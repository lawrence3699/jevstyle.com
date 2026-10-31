#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Write the shared header and footer, and the catalogue and company pages.

Run after prerender_home.py and before build_discovery.py. No network, credentials,
or third-party packages. Model facts come from the homepage's site-data block and
release history from assets/updates.json, so a release is added in one place.
"""
from pathlib import Path
import html
import json
import re

import site_chrome as chrome

ROOT = Path(__file__).resolve().parents[1]
FACTS = json.loads((ROOT / 'assets/project-facts.json').read_text())
UPDATES = json.loads((ROOT / 'assets/updates.json').read_text())
EMAIL = chrome.EMAIL
BEACON = '''<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{&quot;token&quot;: &quot;7a7432d7d2fe40b4b52e41e711938ac0&quot;}'></script>'''
GROWTH_CSS = '<link rel="stylesheet" href="/assets/growth.css">'
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">'
CHROME_ASSETS = '<link rel="stylesheet" href="/assets/site-chrome.css">\n<script src="/assets/site-chrome.js" defer></script>'
TAGS = {'en': {'model': 'Model', 'package': 'Package'}, 'zh': {'model': '模型', 'package': '软件包'}}
GROWTH_PAGES = ('benchmarks', 'models/compare', 'models/0-8b-v3', 'models/2b-v4',
                'guides/claude-code-guard', 'guides/decision-evaluation', 'guides/local-decision-models',
                'guides/local-routing-tools', 'guides/local-text-classification', 'guides/replace-label-only-llm-calls',
                'use-cases/local-llm-routing', 'use-cases/local-vision-decisions', 'use-cases/support-ticket-classification')
API_PAGES = ('api/index.html', 'api/auth.html', 'api/endpoints.html', 'api/errors.html', 'api/limits.html', 'api/terms.html')
USE_CASES = [
    ('/use-cases/support-ticket-classification/', 'Support ticket classification', 'Team, refund request, and urgency in one call.'),
    ('/use-cases/local-llm-routing/', 'Local LLM routing', 'Choose a route locally and send uncertain decisions to your LLM.'),
    ('/use-cases/local-vision-decisions/', 'Receipt and screenshot decisions', 'Ask yes/no questions about local images with the PyTorch build.'),
    ('/guides/claude-code-guard/', 'Agent tool-call review', 'Use a local model and explicit rules to allow, ask, or deny.'),
]
GUIDES = [
    ('/guides/local-text-classification/', 'Local text classification in Python', 'Compare a traditional classifier with typed decision models.'),
    ('/guides/local-decision-models/', 'Local decision models on Apple silicon', 'Choose a method and backend for fixed choices and your hardware.'),
    ('/guides/local-routing-tools/', 'Compare local routing tools', 'JevStyle, Semantic Router, scikit-learn and SetFit: interfaces and fit.'),
    ('/guides/replace-label-only-llm-calls/', 'Replace label-only LLM calls', 'Define options, measure errors and coverage, and retain fallback.'),
    ('/guides/claude-code-guard/', 'Claude Code guard', 'Inspect tool calls with a local model and explicit rules.'),
    ('/guides/decision-evaluation/', 'Evaluate your own data', 'Measure accuracy, calibration, coverage, and latency.'),
]
NEXT_STEP = '<section class="sp-next"><h2>Try it on your own data</h2><p>Start with the hosted API, or run the same kind of decision locally.</p><div class="actions"><a class="button" href="/register/" data-track="api_key_open">Get API key</a><a class="button secondary" href="/models/#run">Run locally</a><a class="button secondary" href="/contact/">Contact</a></div></section>'


def swap(doc, key, pattern, content):
    """Fill a marked block, or mark the block that pattern finds on the first run."""
    start, end = f'<!--chrome:{key}-->', f'<!--/chrome:{key}-->'
    rendered = start + content + end
    if start in doc:
        return re.sub(re.escape(start) + '.*?' + re.escape(end), lambda _: rendered, doc, count=1, flags=re.S)
    doc, count = re.subn(pattern, lambda _: rendered, doc, count=1, flags=re.S)
    assert count == 1, key
    return doc


def page(path, lang, title, description, body, url_path, styles=True):
    alternates = ''
    if url_path in chrome.ZH_PAGES:
        alternates = f'<link rel="alternate" hreflang="en" href="https://jevstyle.com{url_path}">\n<link rel="alternate" hreflang="zh-CN" href="https://jevstyle.com{chrome.ZH_PAGES[url_path]}">\n<link rel="alternate" hreflang="x-default" href="https://jevstyle.com{url_path}">\n'
    switch_path = chrome.ZH_PAGES.get(url_path, url_path) if lang == 'zh' else url_path
    doc = f'''<!doctype html>
<html lang="{'zh-CN' if lang == 'zh' else 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description, quote=True)}">
{FONTS}
{GROWTH_CSS}
{CHROME_ASSETS}
<link rel="stylesheet" href="/assets/site-pages.css">
<script src="/assets/journey.js" defer></script>
{alternates}</head>
<body>
<a class="skip" href="#main">{'跳到正文' if lang == 'zh' else 'Skip to content'}</a>
<!--chrome:header-->{chrome.site_header(lang, switch_path)}<!--/chrome:header-->
<main id="main" class="page">{body}</main>
<!--chrome:footer-->{chrome.site_footer(lang, switch_path)}<!--/chrome:footer-->
{BEACON}
</body></html>
'''
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(doc)


def cards(items, track=' data-track="guide_open"'):
    return ''.join(f'<a class="sp-card" href="{href}"{track}><b>{html.escape(title)}</b><span>{html.escape(text)}</span></a>' for href, title, text in items)


def model_card(family, one):
    name = {'v4-2b': 'Jev-Style 2B v4', 'v3-2b': 'Jev-Style 2B v3', 'v3': 'Jev-Style 0.8B v3', 'macjev': 'MacJev 322M', 'v2': 'Decision 2B v2', 'v1': 'Decision 2B v1', 'cascade-9b': 'Jev-Style Cascade 9B'}[family['id']]
    guide = {'v4-2b': '/models/2b-v4/', 'v3': '/models/0-8b-v3/'}.get(family['id'], 'https://huggingface.co/' + family['repos'][0]['repo'])
    links = ''.join(f'<a href="https://huggingface.co/{html.escape(r["repo"])}" data-track="model_open">{html.escape(r["format"])}</a>' for r in family['repos'])
    return f'<article class="sp-model"><h3><a href="{guide}">{name}</a></h3><span class="sp-meta">{html.escape(family["params"])} · {html.escape(family["released"])}</span><p>{html.escape(one)}</p><p class="sp-links">{links}</p></article>'


def models_page(data, one):
    current = [f for f in data['families'] if f['status'] == 'latest']
    older = [f for f in data['families'] if f['status'] != 'latest']
    body = f'''<div class="sp-hero"><p class="eyebrow">Models</p><h1>Small decision models you can run yourself</h1><p class="lead">Each model scores a fixed set of options and returns a probability for each one. Weights are published under Apache-2.0.</p><div class="actions"><a class="button" href="#run">Choose how to run</a><a class="button secondary" href="/models/compare/">Compare models</a><a class="button secondary" href="/benchmarks/">See the evidence</a></div></div>
<section class="sp-section" id="current" aria-labelledby="current-h"><h2 id="current-h">Current models</h2><div class="sp-models">{''.join(model_card(f, one(f['id'])) for f in current)}</div><details class="sp-older"><summary>Earlier releases ({len(older)})</summary><div class="sp-models">{''.join(model_card(f, one(f['id'])) for f in older)}</div></details></section>
<section class="sp-section" id="run" aria-labelledby="run-h"><h2 id="run-h">Three ways to run them</h2><p>The hosted API and Hugging Face demo are separate services and receive what you send them. Local inference stays on your machine once the model is downloaded.</p><div class="sp-grid"><article class="sp-card"><h3>Hosted API</h3><p>Runs 2B v4 Q4_K_M for text only, with up to 8,000 input tokens and one request at a time.</p><div class="actions"><a class="button" href="/register/" data-track="api_key_open">Get API key</a><a class="button secondary" href="/api/">API docs</a></div></article><article class="sp-card"><h3>Your own machine</h3><p>Python 3.10+, inside a virtual environment. PyTorch reads text and images; MLX and GGUF read text.</p><pre><code>python -m pip install "jev-style[torch]"
jev-style serve --release 2b --backend torch
# Open http://127.0.0.1:8765</code></pre><div class="actions"><a class="button secondary" href="{chrome.GITHUB}#quick-start" data-track="quickstart_open">Quickstart</a></div></article><article class="sp-card"><h3>In your browser</h3><p>Try text and image examples on Hugging Face, with no installation or API key.</p><div class="actions"><a class="button secondary" href="https://huggingface.co/spaces/chaoliangUNSW/jev-style-2b?utm_source=jevstyle&amp;utm_medium=website&amp;utm_campaign=models" data-track="demo_open">Try the demo</a></div></article></div></section>'''
    page('models/index.html', 'en', 'Local decision models and downloads | JevStyle', 'Browse JevStyle decision models with sizes, release dates, PyTorch, MLX and GGUF downloads, and three ways to run them.', body, '/models/')


def index_page(path, url_path, eyebrow, heading, lead, title, description, items):
    body = f'<div class="sp-hero"><p class="eyebrow">{eyebrow}</p><h1>{heading}</h1><p class="lead">{lead}</p></div><div class="sp-grid two">{cards(items)}</div>'
    page(path, 'en', title, description, body, url_path)


def updates_page():
    rows = []
    for item in UPDATES:
        rows.append(f'<li><time datetime="{item["date"]}">{item["date"]}</time><span class="sp-tag">{TAGS["en"][item["tag"]]}</span><div><a href="{item["href"]}">{html.escape(item["title"]["en"])}</a><p>{html.escape(item["text"]["en"])}</p></div></li>')
    body = f'<div class="sp-hero"><p class="eyebrow">Company</p><h1>Updates</h1><p class="lead">Model and package releases, newest first. Each entry links to its release notes or model page.</p></div><ol class="sp-log">{"".join(rows)}</ol>'
    page('updates/index.html', 'en', 'Model and package updates | JevStyle', 'A dated record of JevStyle model releases and jev-style Python package releases.', body, '/updates/')


def contact_page(lang):
    if lang == 'zh':
        heading, lead, title, description = '联系我们', '问题、合作或错误反馈，都可以从这里找到我们。', '联系 JevStyle | JevStyle', '通过邮箱、Discord 或 GitHub 联系 JevStyle。'
        items = [(f'mailto:{EMAIL}', '邮箱', EMAIL), (chrome.DISCORD, 'Discord', '和使用者交流，询问模型和接入问题。'), (chrome.LINKEDIN, 'LinkedIn', '严超亮（Chaoliang Yan）'), (chrome.GITHUB + '/issues', 'GitHub Issues', '报告错误或提出功能建议。')]
    else:
        heading, lead, title, description = 'Contact', 'Questions, collaborations, and bug reports all start here.', 'Contact JevStyle | JevStyle', 'Reach JevStyle by email, on Discord, or through GitHub issues.'
        items = [(f'mailto:{EMAIL}', 'Email', EMAIL), (chrome.DISCORD, 'Discord', 'Talk to other users and ask about models or integration.'), (chrome.LINKEDIN, 'LinkedIn', 'Chaoliang Yan'), (chrome.GITHUB + '/issues', 'GitHub Issues', 'Report a bug or suggest a feature.')]
    body = f'<div class="sp-hero"><h1>{heading}</h1><p class="lead">{lead}</p></div><div class="sp-grid two">{cards(items, "")}</div>'
    page('zh/contact/index.html' if lang == 'zh' else 'contact/index.html', lang, title, description, body, '/contact/')


def privacy_page():
    body = f'''<div class="sp-hero"><h1>Privacy</h1><p class="lead">What JevStyle handles depends on where you run the model.</p><p class="hero-note">Reviewed 2026-10-31</p></div><div class="sp-doc">
<section><h2>Local models</h2><p>After dependencies and weights are downloaded, local inference runs on your machine. JevStyle does not receive your inputs.</p></section>
<section><h2>Hosted API</h2><p>Request text (state and questions) is not stored. Metadata such as time, status, and key ID is logged for rate limits and security. Do not submit secrets or government IDs in <code>state</code>.</p></section>
<section><h2>Accounts and API keys</h2><p>An account uses your email address for verification and sign-in. API keys are stored hashed.</p></section>
<section><h2>This website</h2><p>Public pages count page views with Cloudflare Web Analytics, which sets no cookies and does not see API requests. Console and sign-in pages are not counted.</p></section>
<section><h2>Hugging Face demo</h2><p>The demo runs on Hugging Face and is a separate service. Inputs you send there are handled by that service.</p></section>
<section><h2>Questions</h2><p>Write to <a href="mailto:{EMAIL}">{EMAIL}</a>. Related: <a href="/api/terms.html">Terms</a>.</p></section></div>'''
    page('privacy/index.html', 'en', 'Privacy | JevStyle', 'How JevStyle handles local inference, hosted API requests, accounts, website analytics, and the Hugging Face demo.', body, '/privacy/')


def pricing_page():
    api = FACTS['hostedApi']
    body = f'''<div class="sp-hero"><p class="eyebrow">Pricing</p><h1>Pricing and license</h1><p class="lead">The hosted API is free, and the published weights are open. There are no paid plans.</p></div>
<div class="sp-grid two"><article class="sp-card"><h3>Hosted API</h3><p>Free. Each account gets {api['dailyQuota']:,} requests a day. Text only, up to {api['inputTokenLimit']:,} input tokens per request, one request at a time.</p><p>Limits may change, and there is no SLA.</p><div class="actions"><a class="button" href="/register/" data-track="api_key_open">Get API key</a><a class="button secondary" href="/api/limits.html">Limits</a></div></article><article class="sp-card"><h3>Open weights</h3><p>Free to download and run on your own hardware, with no API key.</p><p>PyTorch, MLX and GGUF builds are available. Their inputs differ by model.</p><div class="actions"><a class="button" href="/models/">Explore models</a><a class="button secondary" href="/models/compare/">Compare models</a></div></article></div>
<section class="sp-section sp-doc" aria-labelledby="license-h"><h2 id="license-h">The license, in plain terms</h2><p>Project code and published weights are licensed under Apache-2.0. Keep the license and notice files that come with each distribution.</p><p>Each model card records its base model, training sources, and limitations. Review those notes before commercial use. {html.escape(FACTS['trainingProvenance'])}</p><p>The hosted service does not guarantee your downstream compliance. Read the <a href="/api/terms.html">terms</a>, or <a href="/contact/">contact us</a> with questions.</p></section>'''
    page('pricing/index.html', 'en', 'Pricing and license | JevStyle', 'The JevStyle hosted API is free with per-account limits. Published weights are Apache-2.0 and run on your own hardware.', body, '/pricing/')


def about_page(lang):
    latest = FACTS['latest2bModel']
    if lang == 'zh':
        title, description = '关于 JevStyle：可自行运行的小型决策模型 | JevStyle', 'JevStyle 开发可在本地运行的小型决策模型，用于分类、路由和评分，提供 Python、MCP 和 Agent 技能。'
        hero = '<div class="sp-hero"><p class="eyebrow">关于我们</p><h1>JevStyle 开发能在自己机器上运行的小型决策模型</h1><p class="lead">日常的分类、路由和评分，不一定需要大模型或云账号。给出选项，模型返回每个选项的概率。</p><div class="actions"><a class="button" href="/register/" data-track="api_key_open">获取 API key</a><a class="button secondary" href="/models/">查看模型（英文）</a><a class="button secondary" href="/zh/contact/">联系我们</a></div></div>'
        rows = [
            ('定位', '我们做什么', '<p>给模型文本或 JSON，以及是/否、多选或有序评分问题，一次前向计算返回各选项的概率。可用于客服工单分类、请求路由和 Agent 工具调用的辅助审核，不生成自由文本回复。</p><div class="sp-pillars"><div><b>本地运行</b><span>下载后在你的机器上推理。</span></div><div><b>一次算完</b><span>一次前向给所有选项打分。</span></div><div><b>开放权重</b><span>代码和权重使用 Apache-2.0。</span></div><div><b>公开方法</b><span>测评协议和限制都写清楚。</span></div></div>'),
            ('做事方式', '我们怎么做事', '<ul class="sp-values"><li><b>说明数字怎么来的</b><span>公开的成绩都是项目自测，并写明协议和限制。见<a href="/benchmarks/">评测与复现（英文）</a>。</span></li><li><b>写明训练来源</b><span>每个模型卡记录基础模型和训练来源。2B v4 的蒸馏来源已在<a href="/models/2b-v4/#results">模型页（英文）</a>公开。</span></li><li><b>如实显示服务状态</b><span><a href="/zh/">首页</a>显示托管 API 的实时状态，本地模型不受它影响。</span></li><li><b>保留回退</b><span>不确定的结果应交给人工或更大的模型。见<a href="/guides/decision-evaluation/">评估指南（英文）</a>。</span></li></ul>'),
            ('团队', '谁在做', f'<p><b>严超亮（Chaoliang Yan）</b>，创建者和维护者。<a href="{chrome.LINKEDIN}">LinkedIn</a> · <a href="https://github.com/lawrence3699">GitHub</a> · <a href="{chrome.HF}">Hugging Face</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></p>'),
            ('生态', '支持的工具', '<ul class="sp-tools"><li>Hugging Face</li><li>PyPI</li><li>PyTorch</li><li>MLX</li><li>GGUF</li><li>MCP</li><li>Claude Code</li></ul><p style="margin-top:16px">这里列出的是可以配合使用的工具，不代表合作或背书关系。</p>'),
            ('来源', '官方来源与独立性', f'<p>Jev-Style 是模型系列名称，<code>jev-style</code> 是 Python 包名，JevStyle 是品牌和网站名称。安装依赖并下载模型后，本地推理在你的机器上执行。Hugging Face Demo 与托管 API 是独立服务；托管 API 当前使用 2B v4 Q4_K_M，仅支持文本，最多 8,000 个输入 token，一次处理一个请求。</p><p>以本网站、<a href="{chrome.GITHUB}">GitHub</a>、<a href="{chrome.PYPI}">PyPI</a> 和 <a href="{chrome.HF}">Hugging Face</a> 为核查入口。JevStyle 与 TypeSafe AI（Jev）、Laya 作者、阿里云或 Qwen 团队无隶属或背书关系。2B v4 的部分训练使用 TypeSafe Jev 1.14 公共 API 生成的软标签。</p><p>已发布的性能数字是项目在明确协议下的自测，不是官方榜单名次，也不保证适用于任意任务。</p>'),
        ]
    else:
        title, description = 'About JevStyle: small decision models you can run yourself | JevStyle', 'JevStyle builds small decision models for local classification, routing, and scoring, with Python, MCP, and agent skills. Created and maintained by Chaoliang Yan.'
        hero = '<div class="sp-hero"><p class="eyebrow">About</p><h1>JevStyle builds small decision models you can run yourself</h1><p class="lead">Everyday classification, routing, and scoring should not need a large model or a cloud account. Give a model your options and it returns a probability for each one.</p><div class="actions"><a class="button" href="/register/" data-track="api_key_open">Get API key</a><a class="button secondary" href="/models/">Explore models</a><a class="button secondary" href="/contact/">Contact</a></div></div>'
        rows = [
            ('What we do', 'Decisions, not chat', '<p>Give a model text or JSON and typed yes/no, choice, or ordered-score questions. It scores the options in one forward pass. Use it for support ticket classification, request routing, or an additional review signal for agent tool calls. It does not generate free-form chat replies.</p><div class="sp-pillars"><div><b>Runs locally</b><span>Inference stays on your machine once downloaded.</span></div><div><b>One forward pass</b><span>Every option scored in a single call.</span></div><div><b>Open weights</b><span>Code and published weights are Apache-2.0.</span></div><div><b>Published methods</b><span>Protocols and limits sit next to the numbers.</span></div></div>'),
            ('How we work', 'Show the working', '<ul class="sp-values"><li><b>Say how numbers were measured</b><span>Published results are self-runs with stated protocols and limits. Read the <a href="/benchmarks/">benchmarks and reproduction notes</a>.</span></li><li><b>Disclose training sources</b><span>Each model card records its base model and sources. See the <a href="/models/2b-v4/#results">2B v4 sources</a>.</span></li><li><b>Report service status as it is</b><span>The <a href="/">homepage</a> shows live hosted API status. Local models do not depend on it.</span></li><li><b>Keep a fallback</b><span>Send uncertain results to a person or a larger model. Read <a href="/guides/decision-evaluation/">how to evaluate your own data</a>.</span></li></ul>'),
            ('Team', 'Who builds it', f'<p><b>Chaoliang Yan</b>, creator and maintainer. <a href="{chrome.LINKEDIN}">LinkedIn</a> · <a href="https://github.com/lawrence3699">GitHub</a> · <a href="{chrome.HF}">Hugging Face</a> · <a href="mailto:{EMAIL}">{EMAIL}</a></p>'),
            ('Ecosystem', 'Works with', '<ul class="sp-tools"><li>Hugging Face</li><li>PyPI</li><li>PyTorch</li><li>MLX</li><li>GGUF</li><li>MCP</li><li>Claude Code</li></ul><p style="margin-top:16px">These are tools JevStyle runs with. Listing them does not imply a partnership or endorsement.</p>'),
            ('Sources', 'Official sources and independence', f'<p>Jev-Style names the model family, <code>jev-style</code> is the Python package, and JevStyle is the brand and website. The <a href="/models/compare/">model comparison</a> separates releases, inputs, backends, and weight sizes.</p><p>After dependencies and weights are downloaded, local inference runs on your machine. The Hugging Face demo and hosted API are separate services that receive inputs sent to them. The hosted API currently uses 2B v4 Q4_K_M for text only, with up to 8,000 input tokens and one request at a time. Its limits differ from the local 2B v4 PyTorch model, which also supports images. See the <a href="/api/">current API reference</a>.</p><p>Use this website, <a href="{chrome.GITHUB}">GitHub</a>, <a href="{chrome.PYPI}">PyPI</a>, and <a href="{chrome.HF}">Hugging Face</a> to verify releases and capabilities. JevStyle is not affiliated with or endorsed by TypeSafe AI (Jev), the Laya authors, Alibaba Cloud, or the Qwen team.</p><p>Project code and published weights are licensed under Apache-2.0. Training provenance differs by release: the {html.escape(latest)} model card discloses soft-label distillation from TypeSafe Jev 1.14 through its public API. Published performance numbers are project self-runs under stated protocols, not official leaderboard positions or guarantees for arbitrary tasks.</p>'),
        ]
    body = hero + '<div class="sp-rows">' + ''.join(f'<section class="sp-row"><div><p class="sp-label">{label}</p><h2>{heading}</h2></div><div>{content}</div></section>' for label, heading, content in rows) + '</div>'
    page('zh/about/index.html' if lang == 'zh' else 'about/index.html', lang, title, description, body, '/about/')


def apply_growth_chrome(path, url_path):
    doc = path.read_text()
    doc = swap(doc, 'header', r'<header class="site-header">.*?</header>', chrome.site_header('en', url_path))
    doc = swap(doc, 'footer', r'<footer class="site-footer">.*?</footer>', chrome.site_footer('en', url_path))
    if 'site-chrome.css' not in doc:
        doc = doc.replace(GROWTH_CSS, GROWTH_CSS + '\n' + CHROME_ASSETS, 1)
    if 'fonts.googleapis.com' not in doc:
        doc = doc.replace(GROWTH_CSS, FONTS + '\n' + GROWTH_CSS, 1)
    path.write_text(doc)


def apply_home_chrome(path, lang):
    doc = path.read_text()
    url_path = '/zh/' if lang == 'zh' else '/'
    doc = swap(doc, 'nav', r'<nav class="nav" aria-label="Primary">.*?</nav>', chrome.home_nav(lang))
    doc = swap(doc, 'mobile-nav', r'<nav aria-label="Mobile">.*?</nav>', chrome.home_mobile_nav(lang))
    doc = swap(doc, 'footer', r'<footer class="wrap foot">.*?</footer>', chrome.site_footer(lang, url_path, 'foot'))
    path.write_text(doc)


def apply_api_chrome(path):
    doc = path.read_text()
    doc = swap(doc, 'nav', r'<nav class="(?:top-nav|nav)"[^>]*>.*?</nav>', chrome.api_nav())
    doc = swap(doc, 'key', r'<a class="pill dark" href="/(?:console|register)/"[^>]*>[^<]*</a>', '<a class="pill dark" href="/register/" data-track="api_key_open">Get API key</a>' + chrome.mobile_panel('en'))
    doc = re.sub(r'\s*<span class="brand-sub">[^<]*</span>', '', doc, count=1)
    doc = re.sub(r'\s*<footer class="site-foot">.*?</footer>', '', doc, count=1, flags=re.S)
    footer = '<!--chrome:footer-->' + chrome.site_footer('en', '/api/') + '<!--/chrome:footer-->\n'
    if '<!--chrome:footer-->' in doc:
        doc = re.sub(r'<!--chrome:footer-->.*?<!--/chrome:footer-->\n', lambda _: footer, doc, count=1, flags=re.S)
    else:
        doc = doc.replace('<!-- Cloudflare Web Analytics', footer + '<!-- Cloudflare Web Analytics', 1) if '<!-- Cloudflare Web Analytics' in doc else doc.replace('</body>', footer + '</body>', 1)
    if 'site-chrome.css' not in doc:
        doc = re.sub(r'(<link rel="stylesheet" href="\./styles\.css" />)', lambda m: m[1] + '\n  ' + CHROME_ASSETS.replace('\n', '\n  '), doc, count=1)
    path.write_text(doc)


def apply_next_step(path):
    doc = path.read_text()
    block = '<!--chrome:next-->' + NEXT_STEP + '<!--/chrome:next-->'
    if '<!--chrome:next-->' in doc:
        doc = re.sub(r'<!--chrome:next-->.*?<!--/chrome:next-->', lambda _: block, doc, count=1, flags=re.S)
    else:
        assert doc.count('</main>') == 1, path
        doc = doc.replace('</main>', block + '</main>', 1)
    path.write_text(doc)


def main():
    source = (ROOT / 'index.html').read_text()
    data = json.loads(re.search(r'<script id="site-data" type="application/json">(.*?)</script>', source, re.S)[1])
    i18n = json.loads(re.search(r'const I18N = (.*?);\s*let lang', source, re.S)[1])['en']
    models_page(data, lambda fid: i18n.get('one.' + fid, ''))
    index_page('use-cases/index.html', '/use-cases/', 'Use cases', 'What teams use decision models for', 'Each guide shows when the approach fits, a runnable example, and how to evaluate it on your own data.', 'Local AI use cases: classification and routing | JevStyle', 'Runnable examples for support ticket classification, LLM routing, image decisions, and agent tool-call review.', USE_CASES)
    index_page('guides/index.html', '/guides/', 'Guides', 'Guides for local decisions', 'Choose an approach, compare the tools, and measure the result on your own data.', 'Guides for local classification and routing | JevStyle', 'Practical guides for local text classification, decision models, routing tools, label-only LLM calls, and evaluation.', GUIDES)
    updates_page()
    privacy_page()
    pricing_page()
    for lang in ('en', 'zh'):
        contact_page(lang)
        about_page(lang)
    for name in GROWTH_PAGES:
        apply_growth_chrome(ROOT / name / 'index.html', '/' + name + '/')
    for rel in API_PAGES:
        apply_api_chrome(ROOT / rel)
    for rel in ('use-cases/support-ticket-classification', 'use-cases/local-llm-routing', 'use-cases/local-vision-decisions', 'guides/claude-code-guard'):
        apply_next_step(ROOT / rel / 'index.html')
    apply_home_chrome(ROOT / 'index.html', 'en')
    apply_home_chrome(ROOT / 'zh/index.html', 'zh')
    print('Built shared navigation and company pages.')


if __name__ == '__main__':
    main()
