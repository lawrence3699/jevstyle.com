#!/usr/bin/env python3
"""Check the published browser-agent evidence and downloadable source package."""
from pathlib import Path
import json
import math
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'tools/browser-agent'
report = json.loads((PAGE / 'runs.json').read_text())
assert report['schema_version'] == 1
assert isinstance(report['runs'], list) and report['runs'], 'Publish actual run evidence.'
assert report.get('generated_at'), 'Record the measurement date.'
latest = next((b for b in report.get('batches', []) if b['id'] == report.get('latest_batch')), {})
if latest.get('batch_status'):
    assert latest['batch_status'] == 'completed'
if latest.get('planned_scenarios'):
    assert set(latest['planned_scenarios']) == {r['id'] for r in report['runs'] if r.get('batch_id') == latest['id']}
release = report.get('release_validation', {})
if release:
    assert isinstance(release['batch_ids'], list) and release['batch_ids']
    assert len(release['batch_ids']) == len(set(release['batch_ids']))
    hashes = latest.get('source_hashes')
    assert isinstance(hashes, dict) and hashes
    assert all(isinstance(h, str) and len(h) == 64 and all(c in '0123456789abcdef' for c in h) for h in hashes.values())
    validation_batches = [b for b in report['batches'] if b['id'] in release['batch_ids']]
    assert len(validation_batches) == len(set(release['batch_ids']))
    assert all(b.get('batch_status') == 'completed' and b.get('source_hashes') == latest.get('source_hashes') for b in validation_batches)
    validation_runs = [r for r in report['runs'] if r['batch_id'] in release['batch_ids']]
    assert len(validation_runs) == len(set(release['scenario_ids']))
    assert {r['id'] for r in validation_runs} == set(release['scenario_ids'])
    assert all(r['status'] == 'passed' for r in validation_runs)
for run in report['runs']:
    assert run['status'] in {'passed', 'failed', 'blocked', 'skipped'}
    assert isinstance(run['steps'], list)
    if run['status'] == 'passed':
        assert run['verification']['passed'] is True, 'DONE alone is not a passed result.'
        assert run['verification']['checks'], 'Include independent result checks.'
        assert all(c['passed'] is True for c in run['verification']['checks'])
    for name in ('elapsed_ms',):
        value = run.get(name)
        if value is not None:
            assert isinstance(value, (int, float)) and math.isfinite(value) and value >= 0
    if run.get('fallback_calls', 0):
        assert run.get('hybrid') is True, 'Recovery calls must be labelled hybrid.'
        assert run.get('fallback_models'), 'Identify the recovery models.'
    if 'reviews_skipped_stale' in run:
        skipped = run['reviews_skipped_stale']
        assert type(skipped) is int and skipped >= 0
        assert run['decision_calls'] == len(run.get('decisions', [])) + skipped
        if skipped:
            assert run['all_decisions_reviewed'] is False, 'Skipped scoring calls were not reviewed.'
    if run.get('all_executed_actions_reviewed'):
        assert run['steps'] and all(step.get('decision_source') == 'local_fallback' for step in run['steps'])
    if run.get('timing'):
        assert set(run['timing']) == {'primary_ms', 'review_ms', 'text_ms', 'other_ms'}
        assert all(type(n) in (int, float) and math.isfinite(n) and n >= 0 for n in run['timing'].values())
        assert abs(sum(run['timing'].values()) - run['elapsed_ms']) < 20
    for step in run['steps']:
        if step.get('decision_source') == 'local_fallback':
            assert run.get('hybrid') is True and step.get('probability_source') == 'jevstyle'
            assert step.get('fallback_model'), 'Identify the model that made the recovery choice.'
        assert not {'request', 'raw_answers', 'page', 'state', 'authorization', 'api_key'}.intersection(step), 'Only publish allowlisted trace fields.'
        if step.get('screenshot'):
            image = PAGE / step['screenshot']
            assert image.resolve().is_relative_to(PAGE.resolve()) and image.is_file()
capture = json.loads((PAGE / 'media/hotel-capture.json').read_text())
assert capture['runs'][0]['verification']['passed'] is True
assert all(c['passed'] for c in capture['runs'][0]['verification']['checks'])
assert capture['frames'][0]['elapsed_ms'] == 0
assert capture['frames'][-1]['elapsed_ms'] == capture['runs'][0]['elapsed_ms']
for frame in capture['frames']:
    image = PAGE / 'media' / frame['path']
    assert image.resolve().is_relative_to(PAGE.resolve()) and image.is_file()
flight_proof = PAGE / 'media/flight-27b-r14'
flight_capture = json.loads((flight_proof / 'flight-capture.json').read_text())
assert flight_capture['run']['verification']['passed'] is True
assert all(c['passed'] for c in flight_capture['run']['verification']['checks'])
assert flight_capture['continuous_video'] is False
assert hashlib.sha256((flight_proof / 'runs.json').read_bytes()).hexdigest() == flight_capture['report_sha256']
for frame in flight_capture['frames']:
    image = flight_proof / frame['path']
    assert image.resolve().is_relative_to(flight_proof.resolve()) and image.is_file()
    assert hashlib.sha256(image.read_bytes()).hexdigest() == frame['sha256']
    if frame['phase'] == 'final_independent_verification':
        assert frame['elapsed_ms'] is None
for run in report['runs']:
    if run.get('final_screenshot'):
        image = PAGE / run['final_screenshot']
        assert image.resolve().is_relative_to(PAGE.resolve()) and image.is_file()
comparison_path = PAGE / 'evidence/speed-comparison.json'
if comparison_path.exists():
    comparison = json.loads(comparison_path.read_text())
    speed_report = PAGE / comparison['optimized']['public_report']
    assert hashlib.sha256(speed_report.read_bytes()).hexdigest() == comparison['report_sha256']
    speed_run = json.loads(speed_report.read_text())['runs'][0]
    assert speed_run['status'] == 'passed' and speed_run['all_executed_actions_reviewed']
    for key in ('elapsed_ms', 'decision_calls', 'fallback_calls', 'reviews_skipped_stale', 'timing'):
        assert comparison['optimized'][key] == speed_run[key]
    assert hashlib.sha256((PAGE / 'media/speed-flight-r16/final.jpg').read_bytes()).hexdigest() == comparison['final_snapshot_sha256']
    baseline = json.loads((PAGE / comparison['baseline']['public_report']).read_text())
    baseline_flight = next(r for r in baseline['runs'] if r['id'] == 'flights')
    assert baseline_flight['elapsed_ms'] == comparison['baseline']['elapsed_ms']
archive = PAGE / 'jevstyle-browser.zip'
with zipfile.ZipFile(archive) as z:
    names = z.namelist()
    assert any(n.endswith('/LICENSE') for n in names)
    assert any(n.endswith('/README.md') for n in names)
    assert any(n.endswith('/scripts/run_scenarios.py') for n in names)
    for path, expected in latest.get('source_hashes', {}).items():
        assert hashlib.sha256(z.read('jevstyle-browser/' + path)).hexdigest() == expected, f'Source changed after verification: {path}'
    for name in names:
        parts = Path(name).parts
        assert not Path(name).is_absolute() and '..' not in parts
        assert not any(p in {'.git', '.env', '.venv', '__pycache__', 'artifacts'} for p in parts), name
print(f'Browser agent: {len(report["runs"])} recorded runs and source archive verified.')
