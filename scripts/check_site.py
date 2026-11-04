#!/usr/bin/env python3
"""Check crawlable growth pages, local destinations, metadata and inline scripts."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import ast
import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import re
from build_discovery import public_pages, FACTS

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.links = []
        self.metas = {}
        self.canonical = None
        self.h1 = []
        self.scripts = []
        self.script = None
        self.python = []
        self.code = None

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.stack.append(tag)
        if tag in ('a','link','script','img'):
            value = d.get('href') if tag in ('a','link') else d.get('src')
            if value:
                self.links.append(value)
        if tag == 'meta':
            self.metas[d.get('name', d.get('property'))] = d.get('content')
        if tag == 'link' and d.get('rel') == 'canonical':
            self.canonical = d.get('href')
        if tag == 'script' and not d.get('src'):
            self.script = [d.get('type','javascript'),'']
        if tag == 'code' and d.get('class') == 'language-python':
            self.code = ''

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(self.script)
            self.script = None
        if tag == 'code' and self.code is not None:
            self.python.append(self.code)
            self.code = None
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]

    def handle_data(self, data):
        if 'h1' in self.stack:
            self.h1.append(data)
        if self.script is not None:
            self.script[1] += data
        if self.code is not None:
            self.code += data


def destination(path):
    p = ROOT / unquote(path).lstrip('/')
    return p / 'index.html' if p.is_dir() else p


def main():
    pages = public_pages()
    expected_urls = set()
    titles = set()
    for path in pages:
        source = path.read_text()
        page = Page()
        page.feed(source)
        rel = path.relative_to(ROOT).as_posix()
        urlpath = '/' + rel.removesuffix('index.html')
        assert ''.join(page.h1).strip(), f'{rel}: empty h1'
        assert len(re.findall(r'<h1\b', source)) == 1, f'{rel}: expected one main heading'
        assert page.canonical == 'https://jevstyle.com' + urlpath, (rel,page.canonical)
        expected_urls.add(page.canonical)
        title = re.search(r'<title>(.*?)</title>', source, re.S)[1]
        assert title not in titles, f'{rel}: duplicate title'
        titles.add(title)
        assert page.metas.get('description'), f'{rel}: description missing'
        assert '<link rel="icon" href="/favicon.ico"' in source and 'rel="apple-touch-icon"' in source, f'{rel}: favicon links missing'
        assert page.metas.get('og:image') == 'https://jevstyle.com/assets/social-card.png', rel
        assert 'noindex' not in (page.metas.get('robots') or ''), rel
        assert 'sc-nav' in source and 'sc-foot' in source, f'{rel}: shared header or footer missing'
        assert '/api/terms.html' in source and '/privacy/' in source, f'{rel}: legal links missing'
        for link in page.links:
            url = urlsplit(link)
            if url.netloc == 'jevstyle.com':
                target = destination(url.path)
                assert target.exists(), f'{rel}: missing same-site destination {link}'
                continue
            if url.scheme or url.netloc or not url.path:
                continue
            target = destination(url.path) if url.path.startswith('/') else path.parent / unquote(url.path)
            if target.is_dir():
                target = target / 'index.html'
            assert target.exists(), f'{rel}: missing local link {link}'
        for kind,script in page.scripts:
            if kind in ('application/json','application/ld+json'):
                parsed = json.loads(script)
                if kind == 'application/ld+json':
                    graph = parsed['@graph']
                    assert any(n.get('url') == page.canonical and n['@type'] in ('WebPage','AboutPage') for n in graph), rel
                    assert not any(n['@type'] in ('Review','AggregateRating') for n in graph), rel
                    defined = {n['@id'] for n in graph if '@id' in n and '@type' in n}
                    def refs(node):
                        if isinstance(node, dict):
                            if set(node) == {'@id'}:
                                yield node['@id']
                            for value in node.values():
                                yield from refs(value)
                        elif isinstance(node, list):
                            for value in node:
                                yield from refs(value)
                    dangling = sorted(set(refs(graph)) - defined)
                    assert not dangling, f'{rel}: JSON-LD references undefined nodes {dangling}'
                    assert not any(n['@type'] == 'Organization' for n in graph), f'{rel}: no legal entity exists; the publisher is a Person'
            else:
                with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
                    f.write(script); f.flush()
                    subprocess.run(['node','--check',f.name],check=True,capture_output=True)
        for code in page.python:
            ast.parse(code)
    sitemap = ET.parse(ROOT/'sitemap.xml')
    urls = [n.text for n in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    lastmods = [n.text for n in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod')]
    assert len(lastmods) == len(urls) and all(re.fullmatch(r'\d{4}-\d{2}-\d{2}', d or '') for d in lastmods), 'every sitemap URL needs an ISO lastmod'
    for name in ('favicon.ico', 'favicon.svg', 'apple-touch-icon.png'):
        assert (ROOT/name).stat().st_size > 0, name
    assert len(urls) == len(set(urls)), 'duplicate sitemap URLs'
    assert set(urls) == expected_urls, 'sitemap and indexable pages disagree'
    for url in urls:
        assert destination(urlsplit(url).path).exists(), url
    assert 'Sitemap: https://jevstyle.com/sitemap.xml' in (ROOT/'robots.txt').read_text()
    # Every HTML page that is not a public page carries noindex: console, sign-in, password and e-mail flows,
    # admin, People Search, the browser-agent fixtures and the 404 page. The Google verification file is exempt.
    public = set(pages)
    utility = [p for p in ROOT.rglob('*.html') if p not in public and 'node_modules' not in p.parts and p.parts[len(ROOT.parts)] != 'frontend' and not p.name.startswith('google')]
    for path in ('console/index.html', 'login/index.html', 'register/index.html', 'forgot-password/index.html', 'reset-password/index.html', 'verify-email/index.html', 'admin/index.html', 'tools/people-search/index.html', 'api/docs.html', 'api/apply.html', 'api/usage.html', '404.html', 'tools/browser-agent/fixtures/fixture.html', 'tools/browser-agent/fixtures/scenarios/lab.html'):
        assert ROOT/path in utility, f'{path}: expected a utility page'
    for path in utility:
        assert 'noindex' in path.read_text(), f'{path.relative_to(ROOT)}: utility page should not be indexed'
    for path in list(public) + utility:
        assert 'fonts.googleapis.com' not in path.read_text() and 'fonts.gstatic.com' not in path.read_text(), f'{path.relative_to(ROOT)}: fonts are self-hosted'
    not_found = (ROOT/'404.html').read_text()
    assert 'sc-nav' in not_found and 'sc-foot' in not_found and '/api/"+a[1]+".html"' in not_found and 'nozh=1' in not_found, '404.html: chrome or redirects missing'
    for name in ('home.js', 'home.css'):
        assert (ROOT/'assets'/name).exists(), name
        assert sum(f'/assets/{name}?v=' in (ROOT/p).read_text() for p in ('index.html', 'zh/index.html')) == 2, f'{name}: both homepages link the versioned asset'
    subprocess.run(['node','--check',str(ROOT/'assets/home.js')],check=True)
    subprocess.run(['node','--check',str(ROOT/'assets/site-chrome.js')],check=True)
    assert 'https://jevstyle.com/benchmarks/' in (ROOT/'llms.txt').read_text()
    assert 'https://jevstyle.com/models/compare/' in (ROOT/'llms.txt').read_text()
    assert 'Live:</strong>' not in (ROOT/'api/index.html').read_text()
    for path in (ROOT/'index.html',ROOT/'zh/index.html'):
        source = path.read_text()
        assert 'data-v="0.04 s"' not in source
        assert '<!--discovery:home-guide-->' in source
        assert 'id="current-facts"' in source
        assert '/guides/local-text-classification/' in source
        assert '/guides/local-decision-models/' in source
        assert '1.14' in source and FACTS['packageVersion'] in source
    subprocess.run(['node','--check',str(ROOT/'assets/journey.js')],check=True)
    subprocess.run(['node',str(ROOT/'scripts/check_journey.cjs')],check=True)
    print(f'Checked {len(pages)} public growth pages, {len(urls)} sitemap URLs, metadata, links, Python examples and JavaScript syntax.')


if __name__ == '__main__':
    main()
