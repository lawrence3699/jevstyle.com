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
UPDATES_SHOWN = 4


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
    # Restrict substitution to markup, not JS strings that also contain HTML.
    markup, scripts = source.split('<script id="site-data"', 1)
    pattern = r'(<(?P<tag>[\w-]+)\b[^>]*data-i18n="(?P<key>[^"]+)"[^>]*>)[^<]*(</(?P=tag)>)'
    markup = re.sub(pattern, lambda m: m[1] + html.escape(t.get(m['key'], m['key'])) + m[4], markup)
    markup = re.sub(r'<h1 id="heroTitle">.*?</h1>', '<h1 id="heroTitle">' + html.escape(t['h3.title']).replace(t['h3.em'], f"<em>{t['h3.em']}</em>", 1) + '</h1>', markup, flags=re.S)
    markup = re.sub(r'(<span class="bn">).*?(</span>)', r'\1JevStyle\2', markup)
    markup = re.sub(r'<html lang="[^"]+">', f'<html lang="{"zh-CN" if lang == "zh" else "en"}">', markup)
    url = 'https://jevstyle.com/' + ('zh/' if lang == 'zh' else '')
    markup = re.sub(r'(<link rel="canonical" href=")[^"]+', lambda m: m[1] + url, markup)
    markup = re.sub(r'(<meta property="og:url" content=")[^"]+', lambda m: m[1] + url, markup)
    markup = re.sub(r'<title>.*?</title>', '<title>' + html.escape(t['title3']) + '</title>', markup)
    for attr in ['name="description"', 'property="og:description"']:
        markup = re.sub(r'(<meta ' + attr + r' content=")[^"]*', lambda m: m[1] + html.escape(t['h3.meta'], quote=True), markup)
    markup = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m[1] + html.escape(t['title3'], quote=True), markup)
    markup = re.sub(r'(<button[^>]*id="langBtn"[^>]*>)[^<]*', lambda m: m[1] + ('English' if lang == 'zh' else '中文'), markup)
    uses = [('/use-cases/support-ticket-classification/', '工单分类' if lang=='zh' else 'Support ticket classification', '一次请求判断团队、退款诉求与紧急程度。' if lang=='zh' else 'Classify the team, refund request, and urgency in one call.'), ('/guides/claude-code-guard/', 'Agent 工具调用审核' if lang=='zh' else 'Agent tool-call review', '用本地模型与明确规则辅助决定允许、询问或拒绝。' if lang=='zh' else 'Use a local model and explicit rules to allow, ask, or deny.')]
    markup = fragment(markup, 'ucGrid', ''.join(f'<article class="uc3-card static-model"><h3><a href="{url}">{title}</a></h3><p>{description}</p></article>' for url,title,description in uses))
    example = '<div class="static-example"><h3>' + ('每个选项都有概率' if lang=='zh' else 'A probability for each option') + '</h3><p>“I was billed twice. Please refund one charge.”</p><pre>{"refund": {"type": "noul", "instructions": "The customer asks for money back."}}</pre><p>' + ('示例输出：退款概率 0.967。实际结果取决于模型与输入。' if lang=='zh' else 'Illustrative output: refund probability 0.967. Results depend on the model and input.') + '</p></div>'
    markup = fragment(markup, 'tyPanel', example)
    markup = fragment(markup, 'carTrack', '<div class="static-bench"><p>Jev-Style 2B v4: JevBench v1.4.1 public accuracy 74.9%; Decision Index 0.3 public score 44.37.</p><p>Single self-runs, not official board ranks. Hardware, test protocols, confidence intervals, and limitations: <a href="/models/2b-v4/">read the model guide</a>.</p></div>')
    updates = json.loads((ROOT / 'assets/updates.json').read_text())[:UPDATES_SHOWN]
    tags = {'en': {'model': 'Model', 'package': 'Package'}, 'zh': {'model': '模型', 'package': '软件包'}}[lang]
    markup = fragment(markup, 'h3News', ''.join(f'<li><time datetime="{u["date"]}">{u["date"]}</time><span>{tags[u["tag"]]}</span><a href="{u["href"]}">{html.escape(u["title"][lang])}</a></li>' for u in updates))
    markup = fragment(markup, 'omStats', ''.join(f'<div><dt>{html.escape(t[key])}</dt><dd>{value:,}</dd></div>' for value, key in hub_totals(data)))
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
    translations['en'].update({'h3.em':'Local', 'go.key':'10,000 free requests a day', 'go.demo':'No install, no API key', 'go.local':'CPU, CUDA and Apple silicon', 'om.note':'Hugging Face file requests, not unique users.'})
    translations['zh'].update({'om.s.dl':'下载', 'om.s.likes':'点赞', 'om.s.m':'模型', 'h3.em':'本地', 'go.key':'每天 10,000 次免费请求', 'go.demo':'无需安装和 API key', 'go.local':'CPU、CUDA 和 Apple silicon', 'om.note':'Hugging Face 文件请求次数，非独立用户。'})
    translations['en'].update({'news.h':'Latest updates', 'news.all':'All updates', 'uc.all':'All use cases', 'bench.all':'Full evaluation', 'final.h':'Start with one decision', 'final.models':'Explore models', 'f.contact':'Contact', 'nav.about':'About'})
    translations['zh'].update({'news.h':'最新动态', 'news.all':'全部更新', 'uc.all':'全部场景', 'bench.all':'完整评测', 'final.h':'从一个判断开始', 'final.models':'查看模型', 'f.contact':'联系我们', 'nav.about':'关于我们'})
    translations['en'].update({'title3':'Local Text Classification and AI Routing in Python | JevStyle', 'h3.title':'Local classification and routing for AI agents', 'h3.sub':'Small open models that score your options in one call. Run them yourself, or use the free API.', 'h3.meta':'Classify text, route requests, and score fixed choices in Python. Use the free hosted API, or run small open models on CPU, CUDA, or Apple silicon.'})
    translations['zh'].update({'title3':'Python 本地文本分类与 AI 路由模型 | JevStyle', 'h3.title':'AI Agent 的本地分类与路由', 'h3.sub':'小型开放模型，一次调用给每个选项打分。可本地运行，也可用免费 API。', 'h3.meta':'在 Python 中完成文本分类、请求路由和固定选项评分。可用免费托管 API，也可在 CPU、CUDA 与 Apple silicon 上运行小型开源模型。'})
    source = re.sub(r'const I18N = .*?;\s*let lang', lambda _: 'const I18N = '+json.dumps(translations, ensure_ascii=False, indent=1)+';\nlet lang', source, count=1, flags=re.S)
    data = json.loads(re.search(r'<script id="site-data" type="application/json">(.*?)</script>', source, re.S).group(1))
    SOURCE.write_text(render(source, translations, data, 'en'))
    (ROOT / 'zh').mkdir(exist_ok=True)
    (ROOT / 'zh/index.html').write_text(render(source, translations, data, 'zh'))
    print('Prerendered English and Chinese homepages.')


if __name__ == '__main__':
    main()
