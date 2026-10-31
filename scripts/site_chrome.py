#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The one navigation and footer used across public pages.

Only these definitions decide what the header and footer link to; build_site.py
writes them into each page. Chinese labels link to English pages until a Chinese
page exists, which is what ZH_PAGES records.
"""

BRAND = '<svg viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="9" cy="11" r="6" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="11" r="2" fill="currentColor"/><path d="M15 11h6" stroke="currentColor" stroke-width="2"/></svg>'
GITHUB = 'https://github.com/lawrence3699/jev-style'
PYPI = 'https://pypi.org/project/jev-style/'
HF = 'https://huggingface.co/chaoliangUNSW'
DISCORD = 'https://discord.gg/udfvMu2GM'
ZH_PAGES = {'/': '/zh/', '/about/': '/zh/about/', '/contact/': '/zh/contact/'}
LABELS = {
    'en': {
        'models': 'Models', 'use': 'Use cases', 'eval': 'Evaluation', 'pricing': 'Pricing', 'dev': 'Developers', 'company': 'Company',
        'docs': 'API docs', 'guides': 'Guides', 'console': 'Console', 'about': 'About', 'updates': 'Updates',
        'contact': 'Contact', 'login': 'Log in', 'key': 'Get API key', 'menu': 'Menu', 'all_models': 'All models',
        'compare': 'Compare models', 'all_use': 'All use cases', 'all_guides': 'All guides', 'tc': 'Local text classification',
        'dm': 'Local decision models', 'rt': 'Compare routing tools', 'img': 'Image decisions', 'label': 'Label-only calls',
        'limits': 'Limits', 'terms': 'Terms', 'privacy': 'Privacy', 'switch': '中文', 'primary': 'Main navigation',
        'note': 'JevStyle is independent and not affiliated with TypeSafe AI (Jev) or the Laya authors. Code and weights: Apache-2.0.',
    },
    'zh': {
        'models': '模型', 'use': '应用场景', 'eval': '评测', 'pricing': '价格', 'dev': '开发者', 'company': '公司',
        'docs': 'API 文档', 'guides': '教程', 'console': '控制台', 'about': '关于我们', 'updates': '更新记录',
        'contact': '联系我们', 'login': '登录', 'key': '获取 API key', 'menu': '菜单', 'all_models': '全部模型',
        'compare': '模型对照', 'all_use': '全部场景', 'all_guides': '全部教程', 'tc': '本地文本分类',
        'dm': '本地决策模型', 'rt': '路由工具对照', 'img': '图片判断', 'label': '替换标签类调用',
        'limits': '限额', 'terms': '条款', 'privacy': '隐私', 'switch': 'English', 'primary': '主导航',
        'note': 'JevStyle 独立运营，与 TypeSafe AI（Jev）及 Laya 作者无隶属关系。代码和权重使用 Apache-2.0 许可证。',
    },
}


def link(href, text, attrs=''):
    return f'<a href="{href}"{attrs}>{text}</a>'


def local(path, lang):
    return ZH_PAGES.get(path, path) if lang == 'zh' else path


def developer_links(lang):
    t = LABELS[lang]
    return [('/api/', t['docs'], ''), ('/guides/', t['guides'], ''), ('/console/', t['console'], ''), (GITHUB, 'GitHub ↗', ' data-track="github_open"'), (PYPI, 'PyPI ↗', ''), (HF, 'Hugging Face ↗', ' data-track="model_open"'), (DISCORD, 'Discord ↗', '')]


def company_links(lang):
    t = LABELS[lang]
    return [(local('/about/', lang), t['about'], ''), ('/updates/', t['updates'], ''), (local('/contact/', lang), t['contact'], '')]


def dropdown(label, items):
    return f'<details class="sc-dd"><summary>{label}</summary><div class="sc-dd-menu">{"".join(link(*item) for item in items)}</div></details>'


def nav_items(lang):
    t = LABELS[lang]
    return link('/models/', t['models']) + link('/use-cases/', t['use']) + link('/benchmarks/', t['eval']) + link('/pricing/', t['pricing']) + dropdown(t['dev'], developer_links(lang)) + dropdown(t['company'], company_links(lang))


def home_nav(lang):
    return f'<nav class="nav sc-nav" aria-label="{LABELS[lang]["primary"]}">{nav_items(lang)}</nav>'


def home_mobile_nav(lang):
    t = LABELS[lang]
    items = [('/models/', t['models']), ('/use-cases/', t['use']), ('/benchmarks/', t['eval']), ('/pricing/', t['pricing']), ('/api/', t['docs']), ('/guides/', t['guides']), (local('/about/', lang), t['about']), ('/updates/', t['updates']), (local('/contact/', lang), t['contact'])]
    links = ''.join(f'<a href="{href}" style="--i:{i}">{text}</a>' for i, (href, text) in enumerate(items))
    return f'<nav aria-label="Mobile">{links}</nav>'


def mobile_panel(lang):
    t = LABELS[lang]
    items = [('/register/', t['key'], ' data-track="api_key_open"'), ('/models/', t['models'], ''), ('/use-cases/', t['use'], ''), ('/benchmarks/', t['eval'], ''), ('/pricing/', t['pricing'], ''), *developer_links(lang), *company_links(lang), ('/login/', t['login'], '')]
    return f'<details class="sc-burger"><summary aria-label="{t["menu"]}"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3.5 7.5h13M3.5 12.5h13"/></svg></summary><div class="sc-burger-panel">{"".join(link(*item) for item in items)}</div></details>'


def switch_link(lang, path):
    t = LABELS[lang]
    if lang == 'zh':
        english = next((en for en, zh in ZH_PAGES.items() if zh == path), '/')
        return f'<a class="sc-lang" href="{english}" lang="en">{t["switch"]}</a>'
    return f'<a class="sc-lang" href="{ZH_PAGES.get(path, "/zh/")}" lang="zh-CN">{t["switch"]}</a>'


def site_header(lang, path):
    t = LABELS[lang]
    home = local('/', lang)
    return f'<header class="site-header sc-header"><div class="sc-header-in"><a class="brand" href="{home}" aria-label="JevStyle home">{BRAND}JevStyle</a><nav class="sc-nav" aria-label="{t["primary"]}">{nav_items(lang)}</nav><span class="sc-sp"></span>{switch_link(lang, path)}<a class="sc-pill sc-login" href="/login/">{t["login"]}</a><a class="sc-pill sc-dark" href="/register/" data-track="api_key_open">{t["key"]}</a>{mobile_panel(lang)}</div></header>'


def api_nav(lang='en'):
    return f'<nav class="top-nav sc-nav" aria-label="{LABELS[lang]["primary"]}">{nav_items(lang)}</nav>'


def footer_columns(lang):
    t = LABELS[lang]
    columns = [
        (t['models'], [('/models/', t['all_models']), ('/models/2b-v4/', 'Jev-Style 2B v4'), ('/models/0-8b-v3/', 'Jev-Style 0.8B v3'), ('/models/compare/', t['compare']), ('/benchmarks/', t['eval'])]),
        (t['guides'], [('/use-cases/', t['all_use']), ('/guides/', t['all_guides']), ('/guides/local-text-classification/', t['tc']), ('/guides/local-decision-models/', t['dm']), ('/guides/local-routing-tools/', t['rt']), ('/use-cases/local-vision-decisions/', t['img']), ('/guides/replace-label-only-llm-calls/', t['label'])]),
        (t['dev'], [('/api/', t['docs']), ('/register/', t['key']), ('/console/', t['console']), ('/api/limits.html', t['limits']), ('/pricing/', t['pricing']), (GITHUB, 'GitHub ↗'), (PYPI, 'PyPI ↗'), (HF, 'Hugging Face ↗')]),
        (t['company'], [*[(href, text) for href, text, _ in company_links(lang)], (DISCORD, 'Discord ↗'), ('/api/terms.html', t['terms']), ('/privacy/', t['privacy'])]),
    ]
    return ''.join(f'<div class="sc-fcol"><p>{title}</p>{"".join(link(href, text) for href, text in items)}</div>' for title, items in columns)


def site_footer(lang, path, classes='site-footer'):
    t = LABELS[lang]
    return f'<footer class="{classes} sc-foot"><div class="sc-foot-in"><div class="sc-fcols">{footer_columns(lang)}</div><div class="sc-fbot"><p>{t["note"]}</p><span>JevStyle © 2026</span>{switch_link(lang, path)}</div></div></footer>'
