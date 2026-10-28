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
    paths = [ROOT/'index.html', ROOT/'zh/index.html', ROOT/'about/index.html', ROOT/'zh/about/index.html']
    for folder in ('use-cases', 'guides', 'models', 'benchmarks'):
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
        return '''<section id="project-guide" class="growth-guides" aria-labelledby="project-guide-heading"><div class="s3-head"><h2 id="project-guide-heading">选择模型，核对结果</h2><p>JevStyle 是用于本地分类、路由和评分的开源工具；小型决策模型为预定义选项返回概率。</p></div><div class="guide-grid"><a href="/models/compare/"><b>模型选择对照（英文）</b><span>比较 0.8B 与 2B 的输入、后端和权重大小。</span></a><a href="/benchmarks/"><b>评测与复现（英文）</b><span>查看公开自测结果、协议、出处和限制。</span></a></div><div class="project-faq"><h3>可以离线运行吗？</h3><p>安装依赖并下载模型后，可以在本机处理输入。在线 Demo 和托管 API 是独立服务；使用它们会将输入发送到相应服务。</p><h3>应该选择哪个模型？</h3><p>文本任务可以从 0.8B v3 开始，在自己的数据上对照测试 2B v4。图片输入需要 2B v4 的 PyTorch 后端；MLX 和 GGUF 构建仅支持文本。</p><h3>它会生成聊天回复吗？</h3><p>它为是/否、多选和有序评分问题返回概率，不生成自由文本回复。把不确定的情况交给人工或现有大模型。</p><p><a href="/zh/about/">关于项目与维护者</a> · <a href="/api/">托管 API 文档（维护中）</a></p></div></section>'''
    return '''<section id="project-guide" class="growth-guides" aria-labelledby="project-guide-heading"><div class="s3-head"><h2 id="project-guide-heading">Choose a model. Check the evidence.</h2><p>JevStyle is an open-source toolkit for local classification, routing, and scoring. Its small decision models return probabilities for predefined options.</p></div><div class="guide-grid"><a href="/models/compare/"><b>Compare local models</b><span>Choose 0.8B or 2B by input, backend, and weight size.</span></a><a href="/benchmarks/"><b>Benchmarks and reproduction</b><span>Read published self-runs with protocols, sources, and limitations.</span></a></div><div class="project-faq"><h3>Can JevStyle run offline?</h3><p>After installing dependencies and downloading the model, you can process inputs locally. The online demo and hosted API are separate services and receive inputs sent to them.</p><h3>Which model should I use?</h3><p>Start with 0.8B v3 for text and compare 2B v4 on your own examples. Image input requires the 2B v4 PyTorch backend; MLX and GGUF builds are text-only.</p><h3>Does it generate chat replies?</h3><p>It returns probabilities for yes/no, choice, and ordered-score questions, rather than free-form replies. Keep human or LLM fallback for uncertain decisions.</p><p><a href="/about/">About the project and maintainer</a> · <a href="/api/">Hosted API reference (under maintenance)</a></p></div></section>'''


def main():
    assert FACTS['hostedApi']['status'] == 'maintenance', 'Update maintenance copy before changing service state.'
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
            graph += [{'@type':'Person','@id':BASE+'/about/#maintainer','name':FACTS['maintainer'],'url':BASE+'/about/','sameAs':['https://github.com/lawrence3699',FACTS['huggingface']]}, {'@type':'SoftwareSourceCode','@id':BASE+'/#software','name':FACTS['name'],'alternateName':FACTS['alternateName'],'url':FACTS['url'],'description':FACTS['description'],'codeRepository':FACTS['github'],'license':FACTS['license'],'programmingLanguage':'Python','author':{'@id':BASE+'/about/#maintainer'},'sameAs':[FACTS['github'],FACTS['huggingface'],FACTS['pypi']]}]
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
            doc = slot(doc, 'home-guide', home_content(zh), before='  <section id="about">')
        if 'class="site-footer"' in doc and '/about/' not in url:
            nav = '<nav class="project-resource-nav" aria-label="Project resources"><a href="/models/compare/">Compare models</a> · <a href="/benchmarks/">Benchmarks</a> · <a href="/about/">About</a></nav>'
            doc = slot(doc, 'resource-links', nav, before='<footer class="site-footer">')
        path.write_text(doc)
    ns, xh = 'http://www.sitemaps.org/schemas/sitemap/0.9', 'http://www.w3.org/1999/xhtml'
    ET.register_namespace('',ns); ET.register_namespace('xhtml',xh)
    root = ET.Element('{'+ns+'}urlset')
    for path in pages:
        item = ET.SubElement(root,'{'+ns+'}url')
        url = page_url(path)
        ET.SubElement(item,'{'+ns+'}loc').text = url
        if path in (ROOT/'index.html',ROOT/'zh/index.html',ROOT/'about/index.html',ROOT/'zh/about/index.html'):
            suffix = 'about/' if '/about/' in url else ''
            for language, dest in [('en',BASE+'/'+suffix),('zh-CN',BASE+'/zh/'+suffix),('x-default',BASE+'/'+suffix)]:
                ET.SubElement(item,'{'+xh+'}link',rel='alternate',hreflang=language,href=dest)
    ET.indent(root)
    ET.ElementTree(root).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    lines = ['# JevStyle','', '> '+FACTS['description'], '', 'Maintainer: '+FACTS['maintainer']+'. Code and weights: Apache-2.0.', 'Hosted API: under maintenance as of '+FACTS['reviewed']+'. Local models and hosted demos are separate.', '', '## Official pages','']
    for path in pages:
        if '/api/' in str(path) or path == ROOT/'zh/index.html':
            continue
        title = html.unescape(re.search(r'<title>(.*?)</title>',path.read_text(),re.S)[1])
        lines.append(f'- [{title}]({page_url(path)})')
    lines += ['', '## Source and packages','',f'- [Source code]({FACTS["github"]})',f'- [Model cards and weights]({FACTS["huggingface"]})',f'- [Python package]({FACTS["pypi"]})',f'- [Hosted API reference, under maintenance]({BASE}/api/)', '', '## Reading the evidence','', 'Published benchmark results are project self-runs, not official leaderboard positions. See the benchmark page for protocol and limitations. Weight sizes are not total runtime memory. Select thresholds on held-out examples from the intended task.']
    (ROOT/'llms.txt').write_text('\n'.join(lines)+'\n')
    print(f'Built discovery metadata, sitemap ({len(pages)} URLs), and llms.txt.')


if __name__ == '__main__':
    main()
