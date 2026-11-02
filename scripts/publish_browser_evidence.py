#!/usr/bin/env python3
"""Combine sanitized runner reports while retaining earlier unsuccessful attempts."""
import argparse
import copy
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--existing', type=Path, help='Retain batches and runs from an existing published bundle')
parser.add_argument('--final-images', help='Verified final-image directory relative to the browser-agent page, for this latest batch only')
parser.add_argument('--compare', action='append', default=[], help='Batch label to feature in the mode comparison; repeat as needed')
parser.add_argument('--release-batch', action='append', default=[], help='Separate batch contributing to this release validation; IDs must be unique and source hashes identical')
parser.add_argument('--batch', action='append', required=True, help='label=/absolute/path/to/runs.json; newest last')
args = parser.parse_args()
batches, runs = [], []
if args.existing:
    existing = json.loads(args.existing.read_text())
    assert existing['schema_version'] == 1 and isinstance(existing['batches'], list)
    batches, runs = copy.deepcopy(existing['batches']), copy.deepcopy(existing['runs'])
latest = None
for item in args.batch:
    label, path = item.split('=', 1)
    assert label not in {b['id'] for b in batches}, 'Batch labels must be unique.'
    source = json.loads(Path(path).read_text())
    assert source['schema_version'] == 1 and isinstance(source['runs'], list)
    batch = {'id': label, 'label': label, 'generated_at': source['generated_at'], 'summary': source.get('summary', {}), 'measurement': source.get('measurement', {})}
    for key in ('batch_status', 'planned_scenarios', 'configuration', 'source_hashes', 'review_every_step', 'post_run_validation', 'evidence_notes', 'interrupted_scenario'):
        if key in source:
            batch[key] = copy.deepcopy(source[key])
    batches.append(batch)
    for row in source['runs']:
        run = copy.deepcopy(row)
        run.update(batch_id=label, attempt_label=label, generated_at=source['generated_at'], configured_review_every_step=source.get('review_every_step', False))
        runs.append(run)
    latest = source
assert latest['runs'], 'Latest suite must contain completed run records.'
last = batches[-1]['id']
if latest.get('batch_status'):
    assert latest['batch_status'] == 'completed', 'Do not publish an incomplete latest suite.'
if latest.get('planned_scenarios'):
    assert set(latest['planned_scenarios']) == {r['id'] for r in latest['runs']}
latest_ids = sorted({r['id'] for r in latest['runs']})
excluded = sorted({r['id'] for r in runs} - set(latest_ids))
assert set(args.compare).issubset({b['id'] for b in batches})
# The latest complete suite is shown first; every earlier attempt remains selectable.
runs.sort(key=lambda r: r['batch_id'] != last)
report = {'schema_version': 1, 'generated_at': latest['generated_at'], 'model': 'See individual runs', 'measurement': latest.get('measurement', {}), 'latest_batch': last, 'coverage': {'latest_scenarios': latest_ids, 'excluded_from_latest': excluded}, 'comparison_batches': args.compare, 'batches': batches, 'runs': runs}
if args.release_batch:
    assert len(args.release_batch) == len(set(args.release_batch)), 'Release batch IDs must be unique.'
    assert all(isinstance(label, str) and label.strip() for label in args.release_batch)
    assert set(args.release_batch).issubset({b['id'] for b in batches})
    hashes = latest.get('source_hashes')
    assert isinstance(hashes, dict) and hashes, 'Release validation needs recorded source hashes.'
    assert all(isinstance(h, str) and len(h) == 64 and all(c in '0123456789abcdef' for c in h) for h in hashes.values())
    release_batches = [b for b in batches if b['id'] in args.release_batch]
    assert all(b.get('batch_status') == 'completed' for b in release_batches)
    assert all(b.get('source_hashes') == latest.get('source_hashes') for b in release_batches)
    release_runs = [r for r in runs if r['batch_id'] in args.release_batch]
    assert len({r['id'] for r in release_runs}) == len(release_runs), 'Do not count a scenario twice.'
    assert all(r['status'] == 'passed' for r in release_runs)
    report['release_validation'] = {'batch_ids': args.release_batch,
                                    'scenario_ids': sorted(r['id'] for r in release_runs),
                                    'scope': 'Separate completed batches with identical executable source hashes; not one timed suite.'}
limits = latest.get('configuration', {}).get('decision_input_limits', {})
replay = latest.get('post_run_validation', {}).get('original_8000_service', {})
if limits:
    report['release_environment_note'] = (f"The timed full suite used an isolated private JevStyle worker with a {limits['aggregate_token_limit']:,}-token aggregate cap, {limits['per_head_token_limit']:,} per-head cap and {limits['native_context_tokens']:,}-token native context. The largest observed request used {limits['observed_peak_primary_input_tokens']:,} tokens. The public limit remains {limits['public_aggregate_limit_unchanged']:,}. " + (f"After the suite, that exact largest request returned HTTP {replay['http_status']} on the original 8,000-token service. This was a single-request compatibility check, not a full suite rerun." if replay else ''))
report['development_rechecks'] = [{'title': 'Interrupted 27B flight attempt 13: corrected-verifier recheck', 'path': 'evidence/r13-corrected-verifier-recheck.json'}] if (Path(__file__).resolve().parents[1] / 'tools/browser-agent/evidence/r13-corrected-verifier-recheck.json').exists() else []
for run in report['runs']:
    if run.get('batch_id') == last and args.final_images:
        folder = Path(args.final_images)
        assert not folder.is_absolute() and '..' not in folder.parts
        run['final_screenshot'] = folder.as_posix().rstrip('/') + '/' + run['id'] + '.jpg'
        assert (Path(__file__).resolve().parents[1] / 'tools/browser-agent' / run['final_screenshot']).is_file()
target = Path(__file__).resolve().parents[1] / 'tools/browser-agent/runs.json'
target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'Published evidence bundle: {len(runs)} attempts across {len(batches)} batches; latest {last}.')
