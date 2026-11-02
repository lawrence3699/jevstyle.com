#!/usr/bin/env python3
"""Combine sanitized runner reports while retaining earlier unsuccessful attempts."""
import argparse
import copy
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--compare', action='append', default=[], help='Batch label to feature in the mode comparison; repeat as needed')
parser.add_argument('--batch', action='append', required=True, help='label=/absolute/path/to/runs.json; newest last')
args = parser.parse_args()
batches, runs = [], []
latest = None
for item in args.batch:
    label, path = item.split('=', 1)
    source = json.loads(Path(path).read_text())
    assert source['schema_version'] == 1 and source['runs']
    batch = {'id': label, 'label': label, 'generated_at': source['generated_at'], 'summary': source.get('summary', {}), 'measurement': source.get('measurement', {})}
    batches.append(batch)
    for row in source['runs']:
        run = copy.deepcopy(row)
        run.update(batch_id=label, attempt_label=label, generated_at=source['generated_at'], configured_review_every_step=source.get('review_every_step', False))
        runs.append(run)
    latest = source
last = batches[-1]['id']
assert set(args.compare).issubset({b['id'] for b in batches})
# The latest complete suite is shown first; every earlier attempt remains selectable.
runs.sort(key=lambda r: r['batch_id'] != last)
report = {'schema_version': 1, 'generated_at': latest['generated_at'], 'model': 'See individual runs', 'measurement': latest.get('measurement', {}), 'latest_batch': last, 'comparison_batches': args.compare, 'batches': batches, 'runs': runs}
target = Path(__file__).resolve().parents[1] / 'tools/browser-agent/runs.json'
target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'Published evidence bundle: {len(runs)} attempts across {len(batches)} batches; latest {last}.')
