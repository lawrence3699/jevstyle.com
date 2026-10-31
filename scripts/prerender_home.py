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


def hub_totals(data):
    """Same totals as renderDownloads(), so the first paint already shows the real numbers."""
    stats = ROOT / 'stats.json'
    listed = json.loads(stats.read_text())['models'] if stats.exists() else []
    by_id = {m['id']: m for m in listed}
    known = {r['repo'] for f in data['families'] for r in f['repos']}
    on_hub = lambda r: r.get('downloads') is not None or bool(r.get('createdAt'))
    merged = [{**r, **by_id.get(r['repo'], {})} for f in data['families'] for r in f['repos']]
    hub = [r for r in merged if on_hub(r)] + [m for m in listed if m['id'] not in known]
    all_time = lambda r: r['downloadsAllTime'] if r.get('downloadsAllTime') is not None else r.get('downloads') or 0
    published = sum(any(on_hub(r) for r in f['repos']) for f in data['families'])
    return [(sum(map(all_time, hub)), 'om.s.dl'), (sum(r.get('likes') or 0 for r in hub), 'om.s.likes'), (published, 'om.s.m')]


def render(source, translations, data, lang):
    t = translations[lang]
    facts = json.loads((ROOT / 'assets/project-facts.json').read_text())
    # Restrict substitution to markup, not JS strings that also contain HTML.
    markup, scripts = source.split('<script id="site-data"', 1)
    api = facts['hostedApi']
    summary = ('托管 API 使用 2B v4 Q4_K_M，仅支持文本，最多 8,000 个输入 token，一次处理一个请求。'
               if lang == 'zh' else 'The hosted API runs 2B v4 Q4_K_M for text only, with up to 8,000 input tokens and one request at a time.')
    summary += ' ' + ('核对日期：' if lang == 'zh' else 'Reviewed: ') + facts['reviewed'] + '.'
    markup = re.sub(r'<!--discovery:api-summary-->.*?<!--/discovery:api-summary-->',
                    lambda _: '<!--discovery:api-summary--><p class="api-reference-note">'+html.escape(summary)+'</p><!--/discovery:api-summary-->', markup, flags=re.S)
    markup = re.sub(r'(<dt data-i18n="k3.free">.*?</dt><dd)[^>]*>.*?</dd>',
                    lambda m: m[1]+'>'+format(api['dailyQuota'], ',')+'</dd>', markup, flags=re.S)
    markup = re.sub(r'(<dt data-i18n="k3.tok">.*?</dt><dd)[^>]*>.*?</dd>',
                    lambda m: m[1]+'>'+format(api['inputTokenLimit'], ',')+'</dd>', markup, flags=re.S)
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
    if lang == 'zh':
        markup = markup.replace('href="/about/"', 'href="/zh/about/"')
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
    markup = fragment(markup, 'omStats', ''.join(f'<div><dt>{html.escape(t[key])}</dt><dd>{value:,}</dd></div>' for value, key in hub_totals(data)))
    # A language switch remains crawlable and useful without JS.
    switch = '<a href="' + ('/' if lang=='zh' else '/zh/') + '">' + ('English' if lang=='zh' else '中文') + '</a>'
    markup = re.sub(r'<!--language-fallback-->.*?<!--/language-fallback-->', '', markup, flags=re.S)
    markup = markup.replace('</footer>', '<!--language-fallback--><noscript>' + switch + '</noscript><!--/language-fallback--></footer>')
    return markup + '<script id="site-data"' + scripts


def main():
    source = SOURCE.read_text()
    obj = re.search(r'const I18N = (.*?);\s*let lang', source, re.S).group(1)
    js = "const vm=require('node:vm');let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(vm.runInNewContext('('+s+')',Object.create(null),{timeout:1000}))));"
    try:
        translations = json.loads(obj)
    except json.JSONDecodeError:
        translations = json.loads(subprocess.check_output(['node','-e',js], input=obj.encode('utf-8')))
    facts = json.loads((ROOT / 'assets/project-facts.json').read_text())
    assert facts['hostedApi']['status'] == 'operational', 'Review translated API copy before changing status.'
    translations['en'].update({'k3.free':'daily quota per account', 'k3.lat':'hosted API status', 'tr.3':'Open local models remain available', 'run.ok':'Recorded example · {s} s GPU time'})
    translations['zh'].update({'k3.free':'每个账号的每日额度', 'k3.lat':'托管 API 状态', 'tr.3':'开源本地模型仍可使用', 'code.h':'托管 API 文档', 'run.ok':'已记录的示例 · GPU 计算 {s} 秒'})
    translations['en'].update({'title3':'Local Text Classification and AI Routing in Python | JevStyle', 'h3.title':'Local classification and routing for AI agents', 'h3.sub':'Classify text, route requests, and score fixed choices in Python. Use the free hosted API, or run small open models on CPU, CUDA, or Apple silicon.'})
    translations['zh'].update({'title3':'Python 本地文本分类与 AI 路由模型 | JevStyle', 'h3.title':'AI Agent 的本地分类与路由', 'h3.sub':'在 Python 中完成文本分类、请求路由和固定选项评分。可用免费托管 API，也可在 CPU、CUDA 与 Apple silicon 上运行小型开源模型。'})
    source = re.sub(r'const I18N = .*?;\s*let lang', lambda _: 'const I18N = '+json.dumps(translations, ensure_ascii=False, indent=1)+';\nlet lang', source, count=1, flags=re.S)
    data = json.loads(re.search(r'<script id="site-data" type="application/json">(.*?)</script>', source, re.S).group(1))
    SOURCE.write_text(render(source, translations, data, 'en'))
    (ROOT / 'zh').mkdir(exist_ok=True)
    (ROOT / 'zh/index.html').write_text(render(source, translations, data, 'zh'))
    print('Prerendered English and Chinese homepages.')


if __name__ == '__main__':
    main()
