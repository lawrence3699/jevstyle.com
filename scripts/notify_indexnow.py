#!/usr/bin/env python3
"""Notify participating search engines of published pages; run explicitly after deploy.

With --changed-since REF only pages whose entry in assets/page-dates.json changed
since REF are sent. If REF or its page-dates.json is unavailable, every sitemap URL is sent.
"""
import argparse
import json
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://jevstyle.com'


def sitemap_urls():
    return [item.text for item in ET.parse(ROOT/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]


def changed_urls(ref, urls):
    if not ref or set(ref) == {'0'}:
        return urls, 'no previous commit; sending all URLs'
    result = subprocess.run(['git', 'show', f'{ref}:assets/page-dates.json'], cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        return urls, f'page dates unavailable at {ref[:12]}; sending all URLs'
    before = json.loads(result.stdout)
    now = json.loads((ROOT/'assets/page-dates.json').read_text())
    changed = {BASE + key for key, entry in now.items() if before.get(key) != entry}
    return [url for url in urls if url in changed], f'{len(changed)} page(s) changed since {ref[:12]}'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--submit', action='store_true', help='Send the URL notification after checking the live key file')
    parser.add_argument('--changed-since', metavar='REF', help='Only send pages whose content changed since this commit')
    args = parser.parse_args()
    key = (ROOT/'indexnow-key.txt').read_text().strip()
    urls = sitemap_urls()
    note = 'all sitemap URLs'
    if args.changed_since is not None:
        urls, note = changed_urls(args.changed_since, urls)
    print(note)
    if not urls:
        print('Nothing to send.')
        return
    payload = {'host': 'jevstyle.com', 'key': key, 'keyLocation': f'{BASE}/indexnow-key.txt', 'urlList': urls}
    if not args.submit:
        print(f'Prepared {len(urls)} public URLs. No request sent. Run with --submit after deployment.')
        for url in urls:
            print(' ', url)
        return
    with urlopen(payload['keyLocation'], timeout=30) as response:
        assert response.read().decode().strip() == key, 'Deploy the matching key first'
    request = Request('https://api.indexnow.org/indexnow', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
    with urlopen(request, timeout=45) as response:
        print(json.dumps({'status': response.status, 'url_count': len(urls), 'note': 'Notification received; indexing is not guaranteed.'}))


if __name__ == '__main__':
    main()
