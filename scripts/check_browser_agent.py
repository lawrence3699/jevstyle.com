#!/usr/bin/env python3
"""Check the published browser-agent evidence and downloadable source package."""
from pathlib import Path
import json
import math
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'tools/browser-agent'
report = json.loads((PAGE / 'runs.json').read_text())
assert report['schema_version'] == 1
assert isinstance(report['runs'], list) and report['runs'], 'Publish actual run evidence.'
assert report.get('generated_at'), 'Record the measurement date.'
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
    for step in run['steps']:
        if step.get('decision_source') == 'local_fallback':
            assert run.get('hybrid') is True and step.get('probability_source') == 'jevstyle'
            assert step.get('fallback_model'), 'Identify the model that made the recovery choice.'
        assert not {'request', 'raw_answers', 'page', 'state', 'authorization', 'api_key'}.intersection(step), 'Only publish allowlisted trace fields.'
        if step.get('screenshot'):
            image = PAGE / step['screenshot']
            assert image.resolve().is_relative_to(PAGE.resolve()) and image.is_file()
archive = PAGE / 'jevstyle-browser.zip'
with zipfile.ZipFile(archive) as z:
    names = z.namelist()
    assert any(n.endswith('/LICENSE') for n in names)
    assert any(n.endswith('/README.md') for n in names)
    assert any(n.endswith('/scripts/run_scenarios.py') for n in names)
    for name in names:
        parts = Path(name).parts
        assert not Path(name).is_absolute() and '..' not in parts
        assert not any(p in {'.git', '.env', '.venv', '__pycache__', 'artifacts'} for p in parts), name
print(f'Browser agent: {len(report["runs"])} recorded runs and source archive verified.')
