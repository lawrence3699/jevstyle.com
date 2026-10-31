#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build public discovery metadata from visible pages and shared project facts.

Run after prerender_home.py. No network, credentials, or third-party packages.
Only public content goes in the sitemap; account and admin pages stay excluded.
"""
from pathlib import Path
import html
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FACTS = json.loads((ROOT / 'assets/project-facts.json').read_text())
BASE = FACTS['url'].rstrip('/')


def slot(doc, key, content, before=None):
    start, end = f'<!--discovery:{key}-->', f'<!--/discovery:{key}-->'
    rendered = start + content + end
    if start in doc:
        return re.sub(re.escape(start) + '.*?' + re.escape(end), lambda _: rendered, doc, flags=re.S)
    assert before and before in doc, (key, before)
    return doc.replace(before, rendered + '\n' + before, 1)


def public_pages():
    paths = [ROOT/'index.html', ROOT/'zh/index.html', ROOT/'about/index.html', ROOT/'zh/about/index.html', ROOT/'contact/index.html', ROOT/'zh/contact/index.html']
    for folder in ('use-cases', 'guides', 'models', 'benchmarks', 'updates', 'privacy', 'pricing'):
        paths += list((ROOT/folder).rglob('*.html'))
    paths += [p for p in (ROOT/'api').glob('*.html') if p.name not in ('docs.html', 'apply.html', 'usage.html')]
    return sorted(set(paths))


def page_url(path):
    return BASE + '/' + path.relative_to(ROOT).as_posix().removesuffix('index.html')


def meta(doc, key, value, attribute='name'):
    tag = f'<meta {attribute}="{key}" content="{html.escape(value, quote=True)}">'
    pattern = r'<meta\s+' + attribute + r'=[\"\x27]' + re.escape(key) + r'[\"\x27][^>]*>'
    return re.sub(pattern, lambda _: tag, doc, count=1) if re.search(pattern, doc) else doc.replace('</head>', tag+'\n</head>', 1)


def home_content(zh):
    if zh:
        return '''<section id="project-guide" class="growth-guides" aria-labelledby="project-guide-heading"><div class="s3-head"><h2 id="project-guide-heading">选择模型，核对结果</h2><p>JevStyle 是用于本地分类、路由和评分的开源工具；小型决策模型为预定义选项返回概率。</p></div><div class="guide-grid"><a href="/models/compare/"><b>模型选择对照（英文）</b><span>比较 0.8B 与 2B 的输入、后端和权重大小。</span></a><a href="/benchmarks/"><b>评测与复现（英文）</b><span>查看公开自测结果、协议、出处和限制。</span></a></div><div class="project-faq"><h3>可以离线运行吗？</h3><p>安装依赖并下载模型后，可以在本机处理输入。在线 Demo 和托管 API 是独立服务；使用它们会将输入发送到相应服务。</p><h3>应该选择哪个模型？</h3><p>文本任务可以从 0.8B v3 开始，在自己的数据上对照测试 2B v4。图片输入需要 2B v4 的 PyTorch 后端；MLX 和 GGUF 构建仅支持文本。</p><h3>它会生成聊天回复吗？</h3><p>它为是/否、多选和有序评分问题返回概率，不生成自由文本回复。把不确定的情况交给人工或现有大模型。</p><p><a href="/zh/about/">关于项目与维护者</a> · <a href="/api/">托管 API 文档</a></p></div></section>'''
    return '''<section id="project-guide" class="growth-guides" aria-labelledby="project-guide-heading"><div class="s3-head"><h2 id="project-guide-heading">Choose a model. Check the evidence.</h2><p>JevStyle is an open-source toolkit for local classification, routing, and scoring. Its small decision models return probabilities for predefined options.</p></div><div class="guide-grid"><a href="/models/compare/"><b>Compare local models</b><span>Choose 0.8B or 2B by input, backend, and weight size.</span></a><a href="/benchmarks/"><b>Benchmarks and reproduction</b><span>Read published self-runs with protocols, sources, and limitations.</span></a></div><div class="project-faq"><h3>Can JevStyle run offline?</h3><p>After installing dependencies and downloading the model, you can process inputs locally. The online demo and hosted API are separate services and receive inputs sent to them.</p><h3>Which model should I use?</h3><p>Start with 0.8B v3 for text and compare 2B v4 on your own examples. Image input requires the 2B v4 PyTorch backend; MLX and GGUF builds are text-only.</p><h3>Does it generate chat replies?</h3><p>It returns probabilities for yes/no, choice, and ordered-score questions, rather than free-form replies. Keep human or LLM fallback for uncertain decisions.</p><p><a href="/about/">About the project and maintainer</a> · <a href="/api/">Hosted API reference</a></p></div></section>'''


def task_entrypoints(zh):
    """Visible task guidance."""
    if zh:
        title, intro = '从你的任务开始', '先按输入、标签和运行环境选择方法，再在自己的数据上比较结果。'
        cards = [('/guides/local-text-classification/', 'Python 本地文本分类', '比较传统分类器与决策模型，保留低置信度回退。'), ('/guides/local-decision-models/', '本地决策模型与 Apple silicon', '按固定选项、后端和硬件选择运行方式。'), ('/use-cases/local-llm-routing/', '请求路由与大模型回退', '先在本地选择工作流，再处理需要升级的请求。')]
    else:
        title, intro = 'Start with the task you need to run locally', 'Choose an approach for your inputs, labels, and hardware, then compare results on your own data.'
        cards = [('/guides/local-text-classification/', 'Local text classification in Python', 'Compare a traditional classifier with typed decision models, and keep a review path.'), ('/guides/local-decision-models/', 'Local decision models on Apple silicon', 'Choose a method and backend for fixed choices and your available hardware.'), ('/use-cases/local-llm-routing/', 'Workflow routing with LLM fallback', 'Make the local routing decision before escalating uncertain requests.')]
    cards += ([('/guides/local-routing-tools/', '本地路由工具选型', '比较 JevStyle、Semantic Router、scikit-learn 和 SetFit。'), ('/use-cases/local-vision-decisions/', '收据与截图的本地判断', 'PyTorch 图片请求示例，以及人工核验边界。'), ('/guides/replace-label-only-llm-calls/', '替换只返回标签的 LLM 调用', '明确选项、测量错误与覆盖率，并保留回退。')] if zh else [('/guides/local-routing-tools/', 'Compare local routing tools', 'JevStyle, Semantic Router, scikit-learn and SetFit: interfaces and fit.'), ('/use-cases/local-vision-decisions/', 'Local receipt and screenshot decisions', 'An image request with the PyTorch build and a verification path.'), ('/guides/replace-label-only-llm-calls/', 'Replace label-only LLM calls', 'Define options, measure errors and coverage, and retain fallback.')])
    links = ''.join(f'<a href="{url}" data-track="guide_open"><b>{label}</b><span>{text}</span></a>' for url,label,text in cards)
    return f'<section id="local-tasks" class="growth-guides" aria-labelledby="local-tasks-heading"><div class="s3-head"><h2 id="local-tasks-heading">{title}</h2><p>{intro}</p></div><div class="guide-grid">{links}</div></section>'


def current_facts(zh):
    """A dated source of frequently confused facts."""
    version = html.escape(FACTS['packageVersion'])
    maintainer = html.escape(FACTS['maintainer'])
    date = html.escape(FACTS['reviewed'])
    model_date = html.escape(FACTS['latest2bReleased'])
    default_model = html.escape(FACTS['defaultTextModel'].replace('Jev-Style-', '').replace('-Decision-', ' '))
    title = '当前版本与服务状态' if zh else 'Current releases and service availability'
    if zh:
        facts = f'''<dl><div><dt>版本</dt><dd>Python 软件包为 <a href="https://pypi.org/project/jev-style/{version}/">jev-style {version}</a>。<a href="/models/2b-v4/">2B v4 已于 {model_date} 发布</a>：PyTorch 支持文本与图片，MLX 和 GGUF 仅支持文本。默认本地文本模型为 <a href="/models/0-8b-v3/">{default_model}</a>。</dd></div><div><dt>托管 API</dt><dd><strong>托管 API 使用 2B v4 Q4_K_M，仅支持文本，一次处理一个请求。</strong>本地模型与 Hugging Face Demo 是独立入口，托管服务的状态不代表本地模型不可用。</dd></div><div><dt>维护者</dt><dd><a href="/zh/about/">{maintainer}（严超亮）</a>，GitHub：lawrence3699。项目与 TypeSafe 无隶属或背书关系。</dd></div><div><dt>训练出处</dt><dd>2B v4 部分训练使用 TypeSafe Jev 1.14 公共 API 生成的软标签。Python 软件包不附带教师的原始回答数据集。参见<a href="/models/2b-v4/#results">模型与训练来源</a>。</dd></div></dl>'''
    else:
        facts = f'''<dl><div><dt>Releases</dt><dd>The Python package is <a href="https://pypi.org/project/jev-style/{version}/">jev-style {version}</a>. <a href="/models/2b-v4/">2B v4 was released on {model_date}</a>: PyTorch supports text and images; MLX and GGUF builds are text-only. The default local text model is <a href="/models/0-8b-v3/">{default_model}</a>.</dd></div><div><dt>Hosted API</dt><dd><strong>The hosted API runs 2B v4 Q4_K_M for text only, processing one request at a time.</strong> Local models and the Hugging Face demo are separate entry points; hosted-service availability does not determine whether a local model works.</dd></div><div><dt>Maintainer</dt><dd><a href="/about/">{maintainer}</a> (GitHub: lawrence3699). JevStyle is independent and is not affiliated with or endorsed by TypeSafe.</dd></div><div><dt>Training provenance</dt><dd>2B v4 was trained in part on soft labels distilled from TypeSafe Jev 1.14 through its public API. The Python package does not bundle the raw teacher response datasets. See <a href="/models/2b-v4/#results">the model and training sources</a>.</dd></div></dl>'''
    return f'<section class="current-project-facts" id="current-facts" aria-labelledby="current-facts-heading"><div><h2 id="current-facts-heading">{title}</h2><p class="facts-date">{"核对日期" if zh else "Reviewed"}: <time datetime="{date}">{date}</time></p></div>{facts}</section>'


def main():
    assert FACTS['hostedApi']['status'] == 'operational', 'Update service copy before changing service state.'
    pages = public_pages()
    for path in pages:
        doc = path.read_text()
        url = page_url(path)
        zh = path.relative_to(ROOT).as_posix().startswith('zh/')
        lang = 'zh-CN' if zh else 'en'
        title = html.unescape(re.search(r'<title>(.*?)</title>', doc, re.S)[1])
        desc_match = re.search(r'<meta name="description" content="([^"]*)"', doc)
        desc = html.unescape(desc_match[1]) if desc_match else FACTS['description']
        doc = re.sub(r'<link\s+rel="canonical"[^>]*>\s*', '', doc)
        doc = doc.replace('</head>', f'<link rel="canonical" href="{url}">\n</head>', 1)
        for key, value, attr in [('og:title',title,'property'), ('og:description',desc,'property'), ('og:url',url,'property'), ('og:type','website','property'), ('og:image',BASE+'/assets/social-card.png','property'), ('twitter:card','summary_large_image','name'), ('twitter:title',title,'name'), ('twitter:description',desc,'name'), ('twitter:image',BASE+'/assets/social-card.png','name')]:
            doc = meta(doc, key, value, attr)
        doc = re.sub(r'<script[^>]*type="application/ld\+json"[^>]*>.*?</script>\s*', '', doc, flags=re.S)
        website = {'@type':'WebSite','@id':BASE+'/#website','url':FACTS['url'],'name':FACTS['name'],'alternateName':FACTS['alternateName'],'inLanguage':['en','zh-CN']}
        page = {'@type':'AboutPage' if '/about/' in url else 'WebPage','@id':url+'#webpage','url':url,'name':title,'description':desc,'inLanguage':lang,'isPartOf':{'@id':BASE+'/#website'},'about':{'@id':BASE+'/#software'}}
        graph = [website, page]
        if url in (BASE+'/',BASE+'/zh/',BASE+'/about/',BASE+'/zh/about/'):
            graph += [{'@type':'Person','@id':BASE+'/about/#maintainer','name':FACTS['maintainer'],'url':BASE+'/about/','sameAs':['https://github.com/lawrence3699',FACTS['huggingface']]}, {'@type':'SoftwareSourceCode','@id':BASE+'/#software','name':FACTS['name'],'alternateName':FACTS['alternateName'],'url':FACTS['url'],'description':FACTS['description'],'codeRepository':FACTS['github'],'license':FACTS['license'],'programmingLanguage':'Python','version':FACTS['packageVersion'],'author':{'@id':BASE+'/about/#maintainer'},'sameAs':[FACTS['github'],FACTS['huggingface'],FACTS['pypi']]}]
        if url not in (BASE+'/',BASE+'/zh/'):
            graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'首页' if zh else 'Home','item':BASE+'/zh/' if zh else FACTS['url']},{'@type':'ListItem','position':2,'name':title.split(' | ')[0],'item':url}]})
            # The breadcrumb is visible as well as machine readable.
            home_url = BASE + ('/zh/' if zh else '/')
            home_label = '首页' if zh else 'Home'
            if 'aria-label="Breadcrumb"' not in doc and '<main' in doc:
                crumb = f'<nav class="breadcrumb" aria-label="Breadcrumb"><a href="{home_url}">{home_label}</a> / <span aria-current="page">{html.escape(title.split(" | ")[0])}</span></nav>'
                doc = re.sub(r'(<main\b[^>]*>)', lambda m: m[1]+crumb, doc, count=1)
        schema = json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False).replace('</','<\\/')
        doc = doc.replace('</head>', '<script type="application/ld+json">'+schema+'</script>\n</head>', 1)
        if zh and '/about/' in url:
            doc = re.sub(r'<nav class="breadcrumb" aria-label="Breadcrumb">.*?</nav>', lambda _: '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/zh/">首页</a> / <span aria-current="page">关于 JevStyle</span></nav>', doc, count=1, flags=re.S)
        if path in (ROOT/'index.html',ROOT/'zh/index.html'):
            doc = slot(doc, 'task-entrypoints', task_entrypoints(zh), before='  <section id="build-guides"')
            doc = slot(doc, 'home-guide', home_content(zh), before='  <section id="about">')
            doc = slot(doc, 'current-facts', current_facts(zh), before='  <section id="about">')
        path.write_text(doc)
    ns, xh = 'http://www.sitemaps.org/schemas/sitemap/0.9', 'http://www.w3.org/1999/xhtml'
    ET.register_namespace('',ns); ET.register_namespace('xhtml',xh)
    root = ET.Element('{'+ns+'}urlset')
    for path in pages:
        item = ET.SubElement(root,'{'+ns+'}url')
        url = page_url(path)
        ET.SubElement(item,'{'+ns+'}loc').text = url
        if path in (ROOT/'index.html',ROOT/'zh/index.html',ROOT/'about/index.html',ROOT/'zh/about/index.html',ROOT/'contact/index.html',ROOT/'zh/contact/index.html'):
            suffix = 'about/' if '/about/' in url else 'contact/' if '/contact/' in url else ''
            for language, dest in [('en',BASE+'/'+suffix),('zh-CN',BASE+'/zh/'+suffix),('x-default',BASE+'/'+suffix)]:
                ET.SubElement(item,'{'+xh+'}link',rel='alternate',hreflang=language,href=dest)
    ET.indent(root)
    ET.ElementTree(root).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    lines = ['# JevStyle','', '> '+FACTS['description'], '', 'Maintainer: '+FACTS['maintainer']+'. Code and weights: Apache-2.0.', 'Hosted API: 2B v4 Q4_K_M, text only, one request at a time. Reviewed '+FACTS['reviewed']+'. Live status: https://api.jevstyle.com/healthz. Local models and hosted demos are separate.', 'Current Python package: '+FACTS['packageVersion']+'. Local default: 0.8B v3; --release 2b selects 2B v4 (released '+FACTS['latest2bReleased']+').', '2B v4: text and images with PyTorch; MLX and GGUF builds are text-only.', FACTS['trainingProvenance'], '', '## Official pages','']
    for path in pages:
        if '/api/' in str(path) or path == ROOT/'zh/index.html':
            continue
        title = html.unescape(re.search(r'<title>(.*?)</title>',path.read_text(),re.S)[1])
        lines.append(f'- [{title}]({page_url(path)})')
    lines += ['', '## Source and packages','',f'- [Source code]({FACTS["github"]})',f'- [Model cards and weights]({FACTS["huggingface"]})',f'- [Python package]({FACTS["pypi"]})',f'- [Hosted API reference]({BASE}/api/)', '', '## Reading the evidence','', 'Published benchmark results are project self-runs, not official leaderboard positions. See the benchmark page for protocol and limitations. Weight sizes are not total runtime memory. Select thresholds on held-out examples from the intended task.']
    (ROOT/'llms.txt').write_text('\n'.join(lines)+'\n')
    print(f'Built discovery metadata, sitemap ({len(pages)} URLs), and llms.txt.')


if __name__ == '__main__':
    main()
