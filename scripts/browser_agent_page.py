"""Render the browser-agent landing page; evidence comes from published run reports."""
from pathlib import Path
import html
import json


def reviewer_names(run):
    """Use recorded reviewer identities; never infer them from parameter-count labels."""
    names = run.get('fallback_models', [])
    if not isinstance(names, list):
        names = []
    if isinstance(run.get('fallback_model'), str):
        names = [*names, run['fallback_model']]
    return list(dict.fromkeys(n for n in names if isinstance(n, str) and n.strip()))


def review_mode(runs):
    if runs and all(r.get('all_executed_actions_reviewed') for r in runs):
        return 'Every executed action reviewed; changed observations may skip review'
    if any(r.get('all_decisions_reviewed') for r in runs) and all(not r.get('decision_calls') or r.get('all_decisions_reviewed') for r in runs):
        return 'JevStyle scoring + review of every decision'
    if runs and all(r.get('configured_review_every_step') for r in runs):
        return 'Per-action review configured; see recorded calls'
    return 'JevStyle + conditional local recovery' if any(r.get('hybrid') for r in runs) else 'JevStyle decisions · text helper for field values'


def build(page, root):
    report_path = root / 'tools/browser-agent/runs.json'
    report = json.loads(report_path.read_text()) if report_path.exists() else {'runs': []}
    runs = report.get('runs', [])
    rows = ''.join('<tr><td>' + html.escape(str(r.get('title', r.get('id', 'Run')))) + '</td><td>' + html.escape(str(r.get('attempt_label', 'Recorded run'))) + '</td><td>' + html.escape(str(r.get('status', 'unverified'))) + '</td><td>' + (f"{r['elapsed_ms']/1000:.2f} s" if isinstance(r.get('elapsed_ms'), (int, float)) else '—') + '</td></tr>' for r in runs)
    body = '''<link rel="stylesheet" href="./replay.css">
<div class="ba-hero"><p class="eyebrow">JevStyle Browser Agent · Preview</p><h1>A goal. A browser.<br>One decision at a time.</h1><p class="lead">JevStyle scores each next action and page element. Choose JevStyle-only decisions or a local generative model that reviews every step, then inspect what the browser actually did.</p><div class="actions"><a class="button" href="#replay">Explore recorded runs <span aria-hidden="true">↘</span></a><a class="button secondary" href="#run-locally">Run it yourself</a></div></div>
<section class="ba-replay" id="replay" aria-labelledby="replay-title"><div class="ba-section-head"><div><p class="eyebrow">Inspect the evidence</p><h2 id="replay-title">Follow every choice</h2></div><span class="ba-label">Recorded replay</span></div>
<p class="ba-note">These are saved runs, not a live connection to your browser. Playback pauses between decisions for inspection; reported timings are from the original run.</p>
<p id="coverage-note" class="ba-coverage"></p><div id="protocol-summary" class="ba-protocols" aria-label="Recorded evaluation modes"></div><p class="ba-note">These are successive development runs, with changes to prompts and stopping policies. The counts are observed outcomes, not a controlled comparison of model accuracy.</p><div class="ba-report"><p id="report-summary" role="status">Loading recorded runs…</p><label class="ba-import">Open your run report<input id="report-file" type="file" accept=".json,application/json"></label></div>
<div id="load-error" class="ba-error" role="alert" hidden></div>
<div class="ba-workspace"><aside class="ba-scenarios"><label for="run-select">Scenario</label><select id="run-select" disabled><option>Loading…</option></select><p id="run-goal">Choose a run to inspect its goal and decisions.</p><a id="run-fixture" class="ba-note" hidden target="_blank" rel="noopener">Open synthetic test page ↗</a><dl class="ba-metrics"><div><dt>Independent check</dt><dd id="run-status">—</dd></div><div><dt>Decision loop</dt><dd id="run-time">—</dd></div><div><dt>End to end</dt><dd id="run-wall">—</dd></div><div><dt>JevStyle scoring calls</dt><dd id="run-calls">—</dd></div></dl><p id="run-model" class="ba-note"></p><p id="run-helpers" class="ba-note"></p><p id="run-mode" class="ba-note"></p><p id="run-skips" class="ba-note"></p><p id="run-timing" class="ba-note"></p><p id="run-completion" class="ba-note"></p><ul id="run-checks" class="ba-checks"></ul><figure id="run-final-page" hidden><a target="_blank" rel="noopener"><img alt="Independently verified final page"></a><figcaption>Final outcome snapshot, after the loop</figcaption></figure><p id="run-error" class="ba-error" hidden></p></aside>
<div class="ba-stage"><div class="ba-track"><label for="trace-track">Replay track</label><select id="trace-track"><option value="actions">Executed actions</option><option value="decisions">Model decisions</option></select></div><div class="ba-stage-top"><span id="step-count">No step selected</span><span id="step-time">—</span></div><div class="ba-decision"><p class="eyebrow" id="step-kind">Executed action</p><div id="step-operation">—</div><p id="step-label">Run traces will appear here.</p><p id="step-value" hidden></p><div id="step-details" class="ba-detail"></div><p id="step-source" class="ba-note"></p></div><div class="ba-probability"><h3>JevStyle operation scores</h3><div id="operation-bars"></div></div><div class="ba-probability"><h3>JevStyle target scores</h3><div id="target-bars"></div></div><figure id="step-image" hidden><img alt="Page captured during this recorded run"><figcaption>Recorded browser frame</figcaption></figure><div class="ba-controls"><button id="play" disabled type="button">Play replay</button><button id="previous" disabled type="button" aria-label="Previous decision">←</button><input id="scrubber" type="range" min="0" max="0" value="0" aria-label="Recorded decision" disabled><button id="next" disabled type="button" aria-label="Next decision">→</button></div></div></div>
<details class="ba-evidence"><summary>Run records and measurement scope</summary><p id="report-date"></p><p id="report-measurement"></p><p id="report-environment">''' + html.escape(report.get('release_environment_note', '')) + '''</p><p>Completion is checked separately from the agent's DONE decision. Runs marked “Independent verifier” are stopped when deterministic task checks pass; the model need not choose DONE. A reviewed or hybrid result includes the generative model and must not be interpreted as JevStyle-only accuracy. A successful fixture run shows one controlled task; it does not establish reliability across arbitrary websites. Failed and blocked runs remain visible.</p><p>See the report's timing scope for setup and verification boundaries. These measurements are not a direct comparison with the upstream 7.1-second video.</p><div class="ba-table"><table><thead><tr><th>Scenario</th><th>Attempt</th><th>Result</th><th>Elapsed</th></tr></thead><tbody id="run-table-body">''' + rows + '''</tbody></table></div><p><a href="./runs.json" download>Download the published run report</a></p></details>
<!--development-history--><noscript><p>The replay controls need JavaScript. The run table and downloadable report remain available.</p></noscript></section>
<section class="ba-how" aria-labelledby="how-title"><div><p class="eyebrow">How it works</p><h2 id="how-title">Small choices.<br>Visible actions.</h2></div><ol><li><b>Observe</b><p>Read visible controls and assign each supported element an index.</p></li><li><b>Decide</b><p>JevStyle scores the next operation and compatible targets in one request. The reviewed configuration asks the selected local generative model to review each action. If the page changed during scoring, the new runtime can discard that observation before review; it still checks the chosen target immediately before input. Each run identifies the model actually called. Conditional recovery is also available as a separate setting.</p></li><li><b>Act and check</b><p>Execute the selected action. A separate text model supplies field values when needed. Read the updated page before continuing.</p></li></ol></section>
<section class="ba-setup" id="run-locally" aria-labelledby="setup-title"><p class="eyebrow">Your machine, your browser</p><h2 id="setup-title">Run the agent yourself</h2><p>Use Python 3.12+, <a href="https://docs.astral.sh/uv/getting-started/installation/">uv</a>, and Chrome. The reviewed releases use <code>jev-style-2b-decision-v4</code> for scores and <code>qwen3.8-27b-uncensored-q4_k_m</code> for per-step review and required field text. Earlier runs keep their own model identities and settings.</p><div class="actions"><a class="button" href="./jevstyle-browser.zip" download>Download the local runner ↓</a><a class="button secondary" href="/guides/run-locally/">Set up a local JevStyle model</a></div><p class="ba-note">Browser runtime adapted from <a href="https://github.com/browser-use/jev-ultrafast">Browser Use</a> under the MIT license. The download includes the original <code>LICENSE</code> and the attribution <code>NOTICE</code>.</p><pre><code>unzip jevstyle-browser.zip
cd jevstyle-browser
uv sync
cp .env.example .env
# Start JevStyle separately: jev-style serve --release 2b
# Start your local generative model server and configure .env.
uv run jev</code></pre><p>Open <code>http://127.0.0.1:8766</code> for the live local inspector. Credentials stay in your local configuration. With a hosted model, page observations needed for decisions are sent to that provider. A local decision model runs on your machine; text and review follow their configured provider.</p><details open><summary>Reproduce the reviewed configuration</summary><p>The download defaults to review off, preserving the JevStyle-only baseline. The following are the tested overrides for the existing local 27B server. Change the loopback endpoint to match your own server; the model alias must match its <code>/v1/models</code> response.</p><pre><code>JEVSTYLE_BASE_URL=http://127.0.0.1:8765
JEVSTYLE_MODEL=jev-style-2b-decision-v4
TEXT_MODEL_BASE_URL=http://127.0.0.1:18768/v1
TEXT_MODEL_API_KEY=local
TEXT_MODEL=qwen3.8-27b-uncensored-q4_k_m
TEXT_MODEL_REASONING=none
JEVSTYLE_FALLBACK=1
JEVSTYLE_FALLBACK_THRESHOLD=1
JEVSTYLE_FALLBACK_FORMAT=action_enum
JEVSTYLE_HTTP_TIMEOUT_SECONDS=120</code></pre><p>With these values in <code>.env</code>, run:</p><pre><code>uv run --env-file .env python scripts/run_scenarios.py --max-seconds 1200 --record-frames --output artifacts/reviewed-eight</code></pre><p>The scope is six synthetic fixtures, Wikipedia and Google Flights. The flight scenario searches matching options and stops before selecting or booking. Generative review is part of the measured system. The historical full suite passed 8/8; newer release checks identify their separate batches below. These are not JevStyle-only results or a claim of arbitrary website reliability.</p><p>The historical 4B seven-scenario release used <code>qwen3:4b-instruct-2507-q4_K_M</code> through Ollama, <code>json_schema</code> review and a 300-second task budget. Its flight attempts failed. Those records remain visible rather than being relabeled as 27B results.</p><p>Review at threshold 0.45 is a separate conditional-recovery configuration. All displayed probabilities come from JevStyle, including when a reviewer selects a different action. See the downloaded README for input budgets and <code>uv run python scripts/run_scenarios.py --help</code> for options. You can open its exported <code>runs.json</code> above; local report files are not uploaded.</p><p>JevStyle is independently maintained and is not affiliated with TypeSafe or Browser Use.</p></details></section>
<script type="module" src="./replay.js"></script>'''
    capture_path = root / 'tools/browser-agent/media/hotel-capture.json'
    if capture_path.exists():
        capture = json.loads(capture_path.read_text())
        frames = capture['frames']
        captured_run = capture['runs'][0]
        options = ''.join('<option value="./media/' + html.escape(frame['path'], quote=True) + '"' + (' selected' if i == len(frames)-1 else '') + '>' + ('Initial page' if i == 0 else f'After action {i}') + f' · {frame["elapsed_ms"]/1000:.2f} s</option>' for i, frame in enumerate(frames))
        captured_reviewers = ', '.join(reviewer_names(captured_run)) or 'not recorded'
        last_frame = './media/' + frames[-1]['path']
        gallery = '<section class="ba-proof" aria-labelledby="proof-title"><div class="ba-section-head"><div><p class="eyebrow">Actual browser snapshots</p><h2 id="proof-title">A hotel search, step by step</h2></div><span class="ba-label">Still frames</span></div><p class="ba-note">A separate verified run of the synthetic hotel fixture: ' + f'{captured_run["elapsed_ms"]/1000:.2f} s, {captured_run["decision_calls"]} JevStyle scoring calls and {captured_run["fallback_calls"]} local reviews. ' + 'Reviewer: ' + html.escape(captured_reviewers) + '. These are snapshots after individual actions, not continuous video. Its timing is separate from the suite below.</p><div class="ba-proof-control"><label for="proof-frame">Recorded frame</label><select id="proof-frame">' + options + '</select><a href="./media/hotel-capture.json" download>Capture report ↓</a></div><a id="proof-link" href="' + last_frame + '" target="_blank" rel="noopener"><img id="proof-image" src="' + last_frame + '" width="1120" height="780" alt="Actual browser snapshot of the synthetic hotel fixture; the verified Casa Flora result is open" loading="lazy"></a></section>'
        body = body.replace('<section class="ba-replay"', gallery + '<section class="ba-replay"', 1)
    flight_capture_path = root / 'tools/browser-agent/media/flight-27b-r14/flight-capture.json'
    if flight_capture_path.exists():
        fc = json.loads(flight_capture_path.read_text())
        fr = fc['run']
        options = []
        for frame in fc['frames']:
            label = 'Final independent verification · after the loop' if frame['phase'] == 'final_independent_verification' else ('Initial page' if frame['phase'] == 'initial' else f"After action {frame['step']}") + f" · {frame['elapsed_ms']/1000:.2f} s"
            url = './media/flight-27b-r14/' + frame['path']
            options.append('<option value="' + html.escape(url, quote=True) + '"' + (' selected' if frame['phase'] == 'final_independent_verification' else '') + '>' + html.escape(label) + '</option>')
        flight_image = './media/flight-27b-r14/' + fc['frames'][-1]['path']
        fg = '<section class="ba-proof" aria-labelledby="flight-proof-title"><div class="ba-section-head"><div><p class="eyebrow">Historical browser snapshots · 485-second baseline</p><h2 id="flight-proof-title">Earlier Zürich to London run</h2></div><span class="ba-label">Still frames</span></div><p class="ba-note">' + f"{fr['elapsed_ms']/1000:.3f} seconds in the decision loop, {fr['decision_calls']} JevStyle scoring calls, {fr['fallback_calls']} generative reviews and {len(fr['steps'])} executed actions. " + 'Reviewer: ' + html.escape(', '.join(reviewer_names(fr))) + '. All nine flight checks passed. No flight was selected or booked. These are discrete recorded snapshots, not continuous video.</p><div class="ba-proof-control"><label for="flight-proof-frame">Flight snapshot</label><select id="flight-proof-frame">' + ''.join(options) + '</select><a href="./media/flight-27b-r14/flight-capture.json" download>Flight capture report ↓</a></div><a id="flight-proof-link" href="' + flight_image + '" target="_blank" rel="noopener"><img id="flight-proof-image" src="' + flight_image + '" width="1120" height="780" alt="Actual Google Flights results from the independently verified Zürich to London one-way search" loading="lazy"></a><p class="ba-note">The final frame was captured during independent verification after the loop; it has no invented exact frame timestamp.</p></section>'
        if capture_path.exists():
            body = body.replace(gallery, fg + '<details class="ba-historical-proof"><summary>Earlier 4B hotel capture</summary>' + gallery + '</details>', 1)
        else:
            body = body.replace('<section class="ba-replay"', fg + '<section class="ba-replay"', 1)
    speed_path = root / 'tools/browser-agent/evidence/speed-comparison.json'
    if speed_path.exists():
        speed = json.loads(speed_path.read_text())
        baseline, optimized = speed['baseline'], speed['optimized']
        difference = (baseline['elapsed_ms'] - optimized['elapsed_ms']) / baseline['elapsed_ms'] * 100
        timing_rows = ''.join('<tr><td>' + label + '</td><td>' + f"{baseline['timing'][key]/1000:.3f} s" + '</td><td>' + f"{optimized['timing'][key]/1000:.3f} s" + '</td></tr>' for key, label in [('primary_ms', 'JevStyle scoring'), ('review_ms', '27B review'), ('text_ms', 'Field text'), ('other_ms', 'Browser and other loop work')])
        speed_section = '<section class="ba-proof" aria-labelledby="speed-title"><div class="ba-section-head"><div><p class="eyebrow">Measured optimization · separate live runs</p><h2 id="speed-title">Skip review when the page has changed</h2></div><span class="ba-label">Verified flight search</span></div><p class="lead">' + f"{baseline['elapsed_ms']/1000:.3f} s → {optimized['elapsed_ms']/1000:.3f} s: {difference:.2f}% less elapsed time in these two runs." + '</p><p>Both used the same Zürich to London goal, February 1, 2027 departure date and local 27B model. The new run passed all nine checks with ' + f"{optimized['decision_calls']} JevStyle scoring calls, {optimized['reviews_skipped_stale']} observations discarded before review, {optimized['fallback_calls']} reviews and {optimized['executed_actions']} executed actions. Every executed action was reviewed." + '</p><p>Most earlier time was spent processing the 27B reviewer’s prompts. The runtime now checks for page changes after JevStyle scoring and can skip an already outdated review. Consecutive skips are bounded; target freshness and occlusion checks still run before input.</p><div class="ba-table"><table><thead><tr><th>Decision-loop component</th><th>Earlier run</th><th>Optimized run</th></tr></thead><tbody>' + timing_rows + '</tbody></table></div><p class="ba-note">' + html.escape(speed['comparison_limit']) + '</p><p><a href="./evidence/speed-comparison.json" download>Timing and provenance ↓</a> · <a href="./evidence/speed-flight-r16.json" download>Optimized flight report ↓</a></p><a href="./media/speed-flight-r16/final.jpg" target="_blank" rel="noopener"><img src="./media/speed-flight-r16/final.jpg" width="1120" height="780" alt="Verified results from the optimized Zürich to London flight search" loading="lazy"></a><p class="ba-note">Actual final snapshot, captured after the loop during independent verification. No flight was selected or booked.</p></section>'
        if flight_capture_path.exists():
            body = body.replace(fg, speed_section + '<details class="ba-historical-proof"><summary>Earlier 485-second flight capture</summary>' + fg + '</details>', 1)
        else:
            body = body.replace('<section class="ba-replay"', speed_section + '<section class="ba-replay"', 1)
    history_rows = ''.join('<tr><td>' + html.escape(b['label']) + '</td><td>' + html.escape(b.get('batch_status', 'Earlier report')) + '</td><td>' + str(sum(r.get('batch_id') == b['id'] for r in runs)) + '</td></tr>' for b in report.get('batches', []))
    rechecks = ''.join('<p><a href="./' + html.escape(r['path'], quote=True) + '">' + html.escape(r['title']) + '</a></p>' for r in report.get('development_rechecks', []))
    history = '<details class="ba-evidence"><summary>Published development batches and rechecks</summary><p>Interrupted batches without a completed outcome are retained without assigning them a success score. The interrupted r13 flight attempt and its later corrected-verifier recheck are separate records; the recheck is not counted as a completed run. The short-ID speed experiment was interrupted after an incorrect trajectory; its code was withdrawn and it is not counted as a successful outcome.</p><div class="ba-table"><table><thead><tr><th>Batch</th><th>Batch status</th><th>Recorded outcomes</th></tr></thead><tbody>' + history_rows + '</tbody></table></div>' + rechecks + '</details>'
    body = body.replace('<!--development-history-->', history)
    excluded = report.get('coverage', {}).get('excluded_from_latest', [])
    flight_runs = sorted([r for r in runs if r.get('id') == 'flights'], key=lambda r: r.get('generated_at', ''))
    latest_runs = [r for r in runs if r.get('batch_id') == report.get('latest_batch')]
    full_suite = {r['id'] for r in latest_runs} == {'hotel', 'reading', 'catalog', 'form', 'guide', 'autocomplete', 'wikipedia', 'flights'}
    scope_note = ('Google Flights remains unverified. ' + ('The latest seven-scenario suite excludes it; ' if 'flights' in excluded else '') + 'its most recent recorded attempt did not pass. Failed flight attempts are retained in the report.') if flight_runs and flight_runs[-1]['status'] != 'passed' else ''
    if full_suite and all(r['status'] == 'passed' for r in latest_runs):
        scope_note = 'Verified scope: six synthetic fixture tasks, Wikipedia, and Google Flights. The flight task searched matching options; no flight was selected or booked. These are recorded outcomes for the named tasks, not a general web reliability benchmark.'
    release = report.get('release_validation', {})
    if release.get('batch_ids'):
        scope_note = f"{len(release['scenario_ids'])} named scenarios passed across {len(release['batch_ids'])} separate release-validation batches using identical executable source. This is not one timed suite. Batches: " + '; '.join(release['batch_ids']) + '. The flight task stopped before selecting or booking.'
    body = body.replace('<p id="coverage-note" class="ba-coverage"></p>', '<p id="coverage-note" class="ba-coverage"' + (' hidden' if not scope_note else '') + '>' + html.escape(scope_note) + '</p>')
    cards = []
    for label in report.get('comparison_batches', []):
        batch = [r for r in runs if r.get('batch_id') == label]
        if not batch:
            continue
        passed = sum(r['status'] == 'passed' for r in batch)
        mode = review_mode(batch)
        reviewers = list(dict.fromkeys(model for run in batch for model in reviewer_names(run)))
        reviewer_note = '<small>Reviewer: ' + html.escape(', '.join(reviewers)) + '</small>' if reviewers else ''
        cards.append('<div class="ba-protocol"><b>' + html.escape(label) + '</b><span>' + f'{passed} / {len(batch)} independently verified' + '</span><small>' + mode + '</small>' + reviewer_note + '</div>')
    body = body.replace('<div id="protocol-summary" class="ba-protocols" aria-label="Recorded evaluation modes"></div>', '<div id="protocol-summary" class="ba-protocols" aria-label="Recorded evaluation modes">' + ''.join(cards) + '</div>')
    page('tools/browser-agent/index.html', 'en', 'JevStyle Browser Agent: recorded runs and local runner | JevStyle', 'Inspect real browser-agent decisions, independent outcome checks, and run timings. Download the JevStyle browser agent and replay your own run reports.', body, '/tools/browser-agent/')
