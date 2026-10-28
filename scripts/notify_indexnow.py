#!/usr/bin/env python3
"""Notify participating search engines of published pages; run explicitly after deploy."""
import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--submit', action='store_true', help='Send the URL notification after checking the live key file')
args = parser.parse_args()
key = (ROOT/'indexnow-key.txt').read_text().strip()
urls = [item.text for item in ET.parse(ROOT/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
payload = {'host':'jevstyle.com', 'key':key, 'keyLocation':'https://jevstyle.com/indexnow-key.txt', 'urlList':urls}
if not args.submit:
    print(f'Prepared {len(urls)} public URLs. No request sent. Run with --submit after deployment.')
else:
    with urlopen(payload['keyLocation'], timeout=30) as response:
        assert response.read().decode().strip() == key, 'Deploy the matching key first'
    request = Request('https://api.indexnow.org/indexnow', data=json.dumps(payload).encode(), headers={'Content-Type':'application/json; charset=utf-8'}, method='POST')
    with urlopen(request, timeout=45) as response:
        print(json.dumps({'status':response.status, 'url_count':len(urls), 'note':'Notification received; indexing is not guaranteed.'}))
