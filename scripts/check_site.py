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
    pages = [ROOT/'index.html', ROOT/'zh/index.html']
    for folder in ('use-cases','guides','models'):
        pages.extend(sorted((ROOT/folder).glob('*/index.html')))
    for path in pages:
        page = Page()
        page.feed(path.read_text())
        rel = path.relative_to(ROOT).as_posix()
        urlpath = '/' + rel.removesuffix('index.html')
        assert ''.join(page.h1).strip(), f'{rel}: empty h1'
        assert page.canonical == 'https://jevstyle.com' + urlpath, (rel,page.canonical)
        assert page.metas.get('description'), f'{rel}: description missing'
        assert page.metas.get('og:image') == 'https://jevstyle.com/assets/social-card.png', rel
        assert 'noindex' not in (page.metas.get('robots') or ''), rel
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path:
                continue
            target = destination(url.path) if url.path.startswith('/') else path.parent / unquote(url.path)
            if target.is_dir():
                target = target / 'index.html'
            assert target.exists(), f'{rel}: missing local link {link}'
        for kind,script in page.scripts:
            if kind in ('application/json','application/ld+json'):
                json.loads(script)
            else:
                with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
                    f.write(script); f.flush()
                    subprocess.run(['node','--check',f.name],check=True,capture_output=True)
        for code in page.python:
            ast.parse(code)
    sitemap = ET.parse(ROOT/'sitemap.xml')
    urls = [n.text for n in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
    assert len(urls) == len(set(urls)), 'duplicate sitemap URLs'
    for url in urls:
        assert destination(urlsplit(url).path).exists(), url
    assert 'Sitemap: https://jevstyle.com/sitemap.xml' in (ROOT/'robots.txt').read_text()
    subprocess.run(['node','--check',str(ROOT/'assets/journey.js')],check=True)
    subprocess.run(['node',str(ROOT/'scripts/check_journey.cjs')],check=True)
    print(f'Checked {len(pages)} public growth pages, {len(urls)} sitemap URLs, metadata, links, Python examples and JavaScript syntax.')


if __name__ == '__main__':
    main()
