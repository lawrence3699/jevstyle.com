#!/usr/bin/env python3
"""Create the website's source download without credentials, runtime data or upstream videos."""
import argparse
from pathlib import Path
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
args = parser.parse_args()
source = args.source.resolve()
target = Path(__file__).resolve().parents[1] / 'tools/browser-agent/jevstyle-browser.zip'
files = subprocess.check_output(['git', '-C', str(source), 'ls-files', '--cached', '--others', '--exclude-standard', '-z']).decode().split('\0')
root_files = {'README.md', 'LICENSE', 'NOTICE', 'pyproject.toml', 'uv.lock', '.env.example', '.gitignore'}
folders = {'jev_ultrafast', 'examples', 'scripts', 'tests'}
kept = []
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as out:
    for name in sorted(set(files)):
        if not name:
            continue
        path = Path(name)
        if name not in root_files and path.parts[0] not in folders and name not in {'docs/upstream-readme.md', 'docs/performance.md'}:
            continue
        if any(part in {'.git', '.env', '.venv', '__pycache__', 'artifacts'} for part in path.parts):
            continue
        full = source / path
        if not full.is_file() or full.is_symlink():
            continue
        out.write(full, 'jevstyle-browser/' + name)
        kept.append(name)
assert 'LICENSE' in kept and 'NOTICE' in kept
print(f'Packaged {len(kept)} source files ({target.stat().st_size:,} bytes).')
