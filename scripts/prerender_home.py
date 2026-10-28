#!/usr/bin/env python3
"""Update the static English/Chinese homepages from the existing JS data.

No browser or third-party Python packages are required. Node evaluates only the
translation object in an isolated VM; the website application is never executed.
Run before deploying, after editing homepage copy or model data.
"""
from pathlib import Path
import html
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'index.html'


def fragment(doc, ident, content):
    begin, end = f'<!--prerender:{ident}-->', f'<!--/prerender:{ident}-->'
    if begin in doc:
        return re.sub(re.escape(begin) + r'.*?' + re.escape(end), lambda _: begin + content + end, doc, flags=re.S)
    pattern = r'(<(?P<tag>[\w-]+)\b[^>]*\bid="' + re.escape(ident) + r'"[^>]*>)(?P<body>[^<]*)(</(?P=tag)>)'
    out, n = re.subn(pattern, lambda m: m[1] + begin + content + end + m[4], doc, count=1)
    if n != 1:
        raise ValueError(f'Missing static slot: {ident}')
    return out


def render(source, translations, data, lang):
    t = translations[lang]
    # Restrict substitution to markup, not JS strings that also contain HTML.
    markup, scripts = source.split('<script id="site-data"', 1)
    pattern = r'(<(?P<tag>[\w-]+)\b[^>]*data-i18n="(?P<key>[^"]+)"[^>]*>)[^<]*(</(?P=tag)>)'
    markup = re.sub(pattern, lambda m: m[1] + html.escape(t.get(m['key'], m['key'])) + m[4], markup)
    markup = re.sub(r'<h1 id="heroTitle">.*?</h1>', '<h1 id="heroTitle">' + html.escape(t['h3.title']) + '</h1>', markup, flags=re.S)
    markup = re.sub(r'(<span class="bn">).*?(</span>)', r'\1JevStyle\2', markup)
    markup = re.sub(r'<html lang="[^"]+">', f'<html lang="{"zh-CN" if lang == "zh" else "en"}">', markup)
    url = 'https://jevstyle.com/' + ('zh/' if lang == 'zh' else '')
    markup = re.sub(r'(<link rel="canonical" href=")[^"]+', lambda m: m[1] + url, markup)
    markup = re.sub(r'(<meta property="og:url" content=")[^"]+', lambda m: m[1] + url, markup)
    markup = re.sub(r'<title>.*?</title>', '<title>' + html.escape(t['title3']) + '</title>', markup)
    for attr in ['name="description"', 'property="og:description"']:
        markup = re.sub(r'(<meta ' + attr + r' content=")[^"]*', lambda m: m[1] + html.escape(t['h3.sub'], quote=True), markup)
    markup = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m[1] + html.escape(t['title3'], quote=True), markup)
    markup = re.sub(r'(<button[^>]*id="langBtn"[^>]*>)[^<]*', lambda m: m[1] + ('English' if lang == 'zh' else '中文'), markup)
    # Fill all navigational hrefs in the original response.
    markup = re.sub(r'(<a[^>]*id="qsRepo"[^>]*href=")#', r'\1https://github.com/lawrence3699/jev-style#quick-start', markup)
    markup = re.sub(r'(<a[^>]*id="stHF"[^>]*href=")#', r'\1https://huggingface.co/chaoliangUNSW/Jev-Style-2B-Decision-v4', markup)
    # Public fallback works without JavaScript and is replaced by existing interactive views.
    model_routes = {'v4-2b':'/models/2b-v4/', 'v3':'/models/0-8b-v3/'}
    cards = []
    for f in data['families']:
        if not f.get('repos'):
            continue
        repo = 'https://huggingface.co/' + f['repos'][0]['repo']
        links = ' · '.join(f'<a href="https://huggingface.co/{html.escape(r["repo"])}">{html.escape(r["format"])}</a>' for r in f['repos'])
        cards.append(f'<article class="mcard static-model"><h3><a href="{model_routes.get(f["id"], repo)}">{html.escape(f["name"])}</a></h3><p>{html.escape(t.get("one." + f["id"], f.get("params", "")))}</p><p>{links}</p></article>')
    markup = fragment(markup, 'mGrid', ''.join(cards))
    uses = [('/use-cases/support-ticket-classification/', '工单分类' if lang=='zh' else 'Support ticket classification', '一次请求判断团队、退款诉求与紧急程度。' if lang=='zh' else 'Classify the team, refund request, and urgency in one call.'), ('/guides/claude-code-guard/', 'Agent 工具调用审核' if lang=='zh' else 'Agent tool-call review', '用本地模型与明确规则辅助决定允许、询问或拒绝。' if lang=='zh' else 'Use a local model and explicit rules to allow, ask, or deny.')]
    markup = fragment(markup, 'ucGrid', ''.join(f'<article class="uc3-card static-model"><h3><a href="{url}">{title}</a></h3><p>{description}</p></article>' for url,title,description in uses))
    example = '<div class="static-example"><h3>' + ('每个选项都有概率' if lang=='zh' else 'A probability for each option') + '</h3><p>“I was billed twice. Please refund one charge.”</p><pre>{"refund": {"type": "noul", "instructions": "The customer asks for money back."}}</pre><p>' + ('示例输出：退款概率 0.967。实际结果取决于模型与输入。' if lang=='zh' else 'Illustrative output: refund probability 0.967. Results depend on the model and input.') + '</p></div>'
    markup = fragment(markup, 'tyPanel', example)
    quick = '''# Python 3.10+; run inside a virtual environment.
python -m pip install "jev-style[torch]"
jev-style serve --release 2b --backend torch
# Open http://127.0.0.1:8765
# For Apple silicon text-only: install "jev-style[mlx]" and use --backend mlx.'''
    markup = fragment(markup, 'qsCode', html.escape(quick))
    markup = fragment(markup, 'carTrack', '<div class="static-bench"><p>Jev-Style 2B v4: JevBench v1.4.1 public accuracy 74.9%; Decision Index 0.3 public score 44.37.</p><p>Single self-runs, not official board ranks. Hardware, test protocols, confidence intervals, and limitations: <a href="/models/2b-v4/">read the model guide</a>.</p></div>')
    markup = fragment(markup, 'email', html.escape(data['email']))
    markup = fragment(markup, 'proofDl', 'Open models on Hugging Face' if lang=='en' else 'Hugging Face 开源模型')
    # A language switch remains crawlable and useful without JS.
    switch = '<a href="' + ('/' if lang=='zh' else '/zh/') + '">' + ('English' if lang=='zh' else '中文') + '</a>'
    markup = re.sub(r'<!--language-fallback-->.*?<!--/language-fallback-->', '', markup, flags=re.S)
    markup = markup.replace('</footer>', '<!--language-fallback--><noscript>' + switch + '</noscript><!--/language-fallback--></footer>')
    return markup + '<script id="site-data"' + scripts


def main():
    source = SOURCE.read_text()
    obj = re.search(r'const I18N = (.*?);\s*let lang', source, re.S).group(1)
    js = "const vm=require('node:vm');let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(vm.runInNewContext('('+s+')',Object.create(null),{timeout:1000}))));"
    translations = json.loads(subprocess.check_output(['node','-e',js], input=obj.encode()))
    data = json.loads(re.search(r'<script id="site-data" type="application/json">(.*?)</script>', source, re.S).group(1))
    SOURCE.write_text(render(source, translations, data, 'en'))
    (ROOT / 'zh').mkdir(exist_ok=True)
    (ROOT / 'zh/index.html').write_text(render(source, translations, data, 'zh'))
    print('Prerendered English and Chinese homepages.')


if __name__ == '__main__':
    main()
