#!/usr/bin/env python3
"""Render the frozen local routing report; never rerun or improve its scores."""
import html
import hashlib
import json
from pathlib import Path
from build_site import page

ROOT = Path(__file__).resolve().parents[1]
BASE = '/experiments/banking-routing-v1/'
RESULTS = BASE + 'results/2026-11-01/'


def main():
    report = json.loads((ROOT / (RESULTS + 'report.json').lstrip('/')).read_text())
    protocol = json.loads((ROOT / (BASE + 'protocol.json').lstrip('/')).read_text())
    folder = ROOT / RESULTS.lstrip('/')
    for name, expected in report['artifacts'].items():
        assert hashlib.sha256((folder / name).read_bytes()).hexdigest() == expected, name
    assert hashlib.sha256((ROOT / BASE.lstrip('/') / 'run.py').read_bytes()).hexdigest() == report['runner_sha256']
    assert hashlib.sha256((ROOT / BASE.lstrip('/') / 'protocol.json').read_bytes()).hexdigest() == report['protocol_sha256']
    predictions = [json.loads(line) for line in (folder / 'predictions.jsonl').read_text().splitlines()]
    assert len(predictions) == 720
    for method in report['results']:
        for split, expected in report['results'][method].items():
            rows = [row for row in predictions if row['method'] == method and row['split'] == split]
            assert len(rows) == expected['count']
            assert sum(row['prediction'] == row['expected'] for row in rows) == expected['correct']
            accepted = [row for row in rows if row['prediction'] is not None and row['top_probability'] >= expected['threshold_from_development']]
            assert len(accepted) == expected['accepted']
            assert sum(row['prediction'] != row['expected'] for row in accepted) == expected['accepted_errors']
    values = report['results']
    def pct(value):
        return 'unmeasured' if value is None else f'{100 * value:.1f}%'
    rows = ''
    for key, label in [('tfidf_logistic', 'TF-IDF + logistic regression'), ('jevstyle', 'JevStyle 0.8B v3 · MLX 8-bit')]:
        d = values[key]['test']
        rows += f'''<tr><th scope="row">{label}</th><td>{d['correct']}/{d['count']} · {pct(d['accuracy'])}</td><td>{d['warm_latency_ms']['median']:.3f} ms</td><td>{d['warm_latency_ms']['p95']:.3f} ms</td><td>{d['accepted']}/{d['count']}</td><td>{d['accepted_errors']}/{d['accepted']} · {pct(d['accepted_errors']/d['accepted'])}</td><td>{d['fallback']}</td></tr>'''
    classes = ''.join(f'<li><code>{html.escape(k)}</code>: {html.escape(v)}</li>' for k, v in protocol['labels'].items())
    perclass = ''
    for label in protocol['labels']:
        a, b = values['tfidf_logistic']['test']['per_class'][label], values['jevstyle']['test']['per_class'][label]
        perclass += f'<tr><th scope="row">{label}</th><td>{a["correct"]}/{a["count"]}</td><td>{b["correct"]}/{b["count"]}</td></tr>'
    limits = ''.join('<li>' + html.escape(x) + '</li>' for x in report['limitations'])
    body = f'''<div class="sp-hero"><p class="eyebrow">Reproducible local experiment</p><h1>Local support routing: JevStyle versus a trained text classifier</h1><p class="lead">Six BANKING77 intents, one fixed test split, full predictions and measured Apple silicon timings.</p><p class="hero-note">Run on 1 November 2026 (Australia/Sydney) · Project self-run · Not an independent review</p></div>
<div class="layout"><article class="article">
<section id="answer"><h2>What did the comparison find?</h2><p>For this six-intent task with labeled training data, TF-IDF plus logistic regression was more accurate and faster in the observed test run: <strong>229/240 correct (95.4%) versus JevStyle's 224/240 (93.3%)</strong>. JevStyle ran without task fine-tuning; the classifier learned from 738 labeled examples. This result does not establish equal-supervision superiority or a general ranking.</p><p>JevStyle remains a candidate to evaluate when a workflow has described choices and you want to start without training a task-specific classifier. When representative labeled data already exist, include a traditional classifier before selecting a larger local model. These measurements provide no production-quality or safety guarantee.</p></section>
<section id="results"><h2>Held-out accuracy, latency and fallback</h2><div class="table-wrap"><table><caption>Same 240 test requests. Single-process, in-process warm predictions on Apple M1 Max, 64 GiB.</caption><thead><tr><th scope="col">Method</th><th scope="col">Correct / test</th><th scope="col">Median</th><th scope="col">p95</th><th scope="col">Accepted</th><th scope="col">Accepted errors</th><th scope="col">Fallback</th></tr></thead><tbody>{rows}</tbody></table></div><p>Latency includes the local prediction and output validation. Model loading, downloads, HTTP transport, queueing and human or remote-model fallback are excluded. No cloud cost saving or hosted API latency is measured. Both methods had zero inference errors.</p><p>95% Wilson accuracy intervals: TF-IDF classifier 92.0–97.4%; JevStyle 89.4–95.9%. This single small run does not establish a statistically reliable performance ranking across workloads.</p></section>
<section id="threshold"><h2>The development error target did not carry over</h2><p>The threshold rule was frozen before test scoring: maximize development coverage with at least 20 accepted rows and observed accepted error no higher than 5%, searching a fixed 0.00–1.00 grid. The classifier selected 0.29; JevStyle selected 0.00 after 114/120 correct on development. The JevStyle test error was then <strong>16/240 (6.7%)</strong>, above that target.</p><p>Do not treat a top option probability as a guaranteed correctness rate. This rule is a reproducible failure case, not a recommended production threshold. Fallback means the request would be sent for review; no reviewer or larger LLM was run, and no perfect fallback accuracy is assumed. The threshold uses the top option probability, not JevStyle's separately normalized confidence.</p></section>
<section id="protocol"><h2>Data, model and fixed protocol</h2><p>We selected these six support intents before evaluating predictions:</p><ul>{classes}</ul><p>Original train and test files retain their upstream split. Normalized duplicate text and train/test overlap are removed. Within each class, SHA-256 ordering with seed 20261101 assigns 20 original training rows to development and the remainder to baseline training. Final sizes are 738 train, 120 development and 240 test. The prompts and descriptions never include gold labels for development/test examples.</p><p>JevStyle: <code>jev-style==0.6.2</code>, 0.8B v3, MLX 8-bit, model revision <code>{report['model']['revision']}</code>. Baseline: scikit-learn 1.7.2, word TF-IDF (1–2 grams, 10,000 features), logistic regression C=1, one CPU thread. Python 3.12.13; macOS 15.7.5; Apple M1 Max, 64 GiB. Baseline fit: {report['baseline_fit_seconds']:.3f} s; JevStyle load: {report['jevstyle_load_seconds']:.3f} s.</p><div class="table-wrap"><table><thead><tr><th scope="col">Intent</th><th scope="col">Classifier correct</th><th scope="col">JevStyle correct</th></tr></thead><tbody>{perclass}</tbody></table></div></section>
<section id="reproduce"><h2>Reproduce and inspect every prediction</h2><p><a href="{BASE}README.md">Complete reproduction instructions</a> · <a href="{BASE}protocol.json">Frozen protocol</a> · <a href="{BASE}run.py">Python runner</a> · <a href="{BASE}requirements.lock">Dependency lock</a></p><p><a href="{RESULTS}report.json">Machine-readable report</a> · <a href="{RESULTS}split-manifest.json">Source row IDs and text hashes</a> · <a href="{RESULTS}predictions.jsonl">All 720 development/test predictions</a> · <a href="{RESULTS}thresholds.json">Frozen thresholds</a></p><pre><code>python3.12 -m venv .venv
.venv/bin/python -m pip install -r experiments/banking-routing-v1/requirements.lock
.venv/bin/jev-style download --release 0.8b-v3 --backend mlx --precision 8bit
.venv/bin/python experiments/banking-routing-v1/run.py --download --data-dir /tmp/jev-banking-data --output /tmp/jev-banking-run-1</code></pre><p>Run from a checkout of this website repository. Use a new output directory. Dataset hashes, script hash and result artifact hashes are included in the report. Numerical probabilities and timings can vary across hardware or runtime versions.</p></section>
<section id="limits"><h2>Scope and dataset attribution</h2><ul>{limits}</ul><p>BANKING77 is © PolyAI Limited, CC BY 4.0. We use fixed CSVs from <a href="https://github.com/PolyAI-LDN/task-specific-datasets/tree/{report['source']['revision']}/banking_data">the original PolyAI repository</a>, select six intents, derive development rows and publish predictions without changing upstream labels. See the <a href="https://github.com/PolyAI-LDN/task-specific-datasets/blob/master/LICENSE">dataset license</a>. Citation: Casanueva et al. (2020), <a href="https://arxiv.org/abs/2003.04807">Efficient Intent Detection with Dual Sentence Encoders</a>.</p><p>Next: <a href="/guides/local-routing-tools/">compare local routing tools</a> · <a href="/guides/decision-evaluation/">evaluate your own requests</a> · <a href="/benchmarks/">other published evaluations</a>.</p></section></article><aside class="toc" aria-label="On this page"><strong>On this page</strong><a href="#answer">What we found</a><a href="#results">Test results</a><a href="#threshold">Threshold failure</a><a href="#protocol">Protocol</a><a href="#reproduce">Reproduce</a><a href="#limits">Limits</a></aside></div>'''
    page('benchmarks/banking-routing/index.html', 'en', 'Local support routing benchmark: JevStyle vs TF-IDF | JevStyle', 'A reproducible six-intent BANKING77 comparison of JevStyle and TF-IDF logistic regression, with held-out accuracy, Apple silicon latency, threshold failure and full predictions.', body, '/benchmarks/banking-routing/')
    print('Rendered the frozen local routing experiment.')


if __name__ == '__main__':
    main()
