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
LINKEDIN = 'https://www.linkedin.com/in/chaoliang-yan-a7061a370/'
EMAIL = 'yanchaoliang369@gmail.com'
SOCIAL = [
    (GITHUB, 'GitHub', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>'),
    (HF, 'Hugging Face', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 14.5c.9 1.5 2.3 2.2 4 2.2s3.100-.7 4-2.200"/><circle cx="8.700" cy="9.700" r="1.100" fill="currentColor" stroke="none"/><circle cx="15.300" cy="9.700" r="1.100" fill="currentColor" stroke="none"/></svg>'),
    (LINKEDIN, 'LinkedIn', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>'),
    (DISCORD, 'Discord', '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.300 4.400A19.800 19.800 0 0 0 15.400 3l-.2.500a18.300 18.300 0 0 0-6.400 0L8.600 3a19.700 19.700 0 0 0-4.900 1.400C.6 9-.300 13.500.2 18a20 20 0 0 0 6 3l1.300-2.100a13 13 0 0 1-2-1l.5-.4a14.200 14.200 0 0 0 12 0l.5.400a13 13 0 0 1-2 1l1.300 2.100a20 20 0 0 0 6-3c.6-5.200-.9-9.600-3.500-13.600ZM8.500 15.300c-1.200 0-2.200-1.100-2.200-2.400s1-2.400 2.200-2.400 2.200 1.100 2.200 2.400-1 2.400-2.200 2.400Zm7 0c-1.200 0-2.200-1.100-2.200-2.400s1-2.400 2.200-2.400 2.200 1.100 2.200 2.400-1 2.400-2.200 2.400Z"/></svg>'),
]
ZH_PAGES = {'/': '/zh/', '/about/': '/zh/about/', '/contact/': '/zh/contact/'}
LABELS = {
    'en': {
        'models': 'Models', 'use': 'Use cases', 'eval': 'Evaluation', 'pricing': 'Pricing', 'dev': 'Developers', 'company': 'Company',
        'docs': 'API docs', 'guides': 'Guides', 'console': 'Console', 'about': 'About', 'updates': 'Updates',
        'contact': 'Contact', 'login': 'Log in', 'key': 'Get API key', 'menu': 'Menu', 'all_models': 'All models',
        'compare': 'Compare models', 'all_use': 'All use cases', 'all_guides': 'All guides', 'tc': 'Local text classification',
        'dm': 'Local decision models', 'rt': 'Compare routing tools', 'img': 'Image decisions', 'label': 'Label-only calls',
        'limits': 'Limits', 'terms': 'Terms', 'privacy': 'Privacy', 'switch': '中文', 'primary': 'Main navigation',
        'tagline': 'Small decision models you can run yourself.', 'since': 'Since 2026', 'tickets': 'Support tickets', 'routing': 'LLM routing', 'guard': 'Tool-call review',
        'note': 'JevStyle is independent and not affiliated with TypeSafe AI (Jev) or the Laya authors. Code and weights: Apache-2.0.',
    },
    'zh': {
        'models': '模型', 'use': '应用场景', 'eval': '评测', 'pricing': '价格', 'dev': '开发者', 'company': '公司',
        'docs': 'API 文档', 'guides': '教程', 'console': '控制台', 'about': '关于我们', 'updates': '更新记录',
        'contact': '联系我们', 'login': '登录', 'key': '获取 API key', 'menu': '菜单', 'all_models': '全部模型',
        'compare': '模型对照', 'all_use': '全部场景', 'all_guides': '全部教程', 'tc': '本地文本分类',
        'dm': '本地决策模型', 'rt': '路由工具对照', 'img': '图片判断', 'label': '替换标签类调用',
        'limits': '限额', 'terms': '条款', 'privacy': '隐私', 'switch': 'English', 'primary': '主导航',
        'tagline': '能在自己机器上运行的小型决策模型。', 'since': '始于 2026', 'tickets': '客服工单', 'routing': '大模型路由', 'guard': '工具调用审核',
        'note': 'JevStyle 独立运营，与 TypeSafe AI（Jev）及 Laya 作者无隶属关系。代码和权重使用 Apache-2.0 许可证。',
    },
}


def link(href, text, attrs=''):
    return f'<a href="{href}"{attrs}>{text}</a>'


def local(path, lang):
    return ZH_PAGES.get(path, path) if lang == 'zh' else path


def developer_links(lang):
    t = LABELS[lang]
    return [('/tools/people-search/', '找人工具' if lang == 'zh' else 'People Search', ''), ('/api/', t['docs'], ''), ('/guides/', t['guides'], ''), ('/console/', t['console'], ''), (GITHUB, 'GitHub ↗', ' data-track="github_open"'), (PYPI, 'PyPI ↗', ''), (HF, 'Hugging Face ↗', ' data-track="model_open"'), (DISCORD, 'Discord ↗', '')]


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


def footer_group(title, items):
    return f'<div class="sc-fgroup"><p>{title}</p>{"".join(link(href, text) for href, text in items)}</div>'


def footer_columns(lang):
    t = LABELS[lang]
    columns = [
        [(t['models'], [('/models/', t['all_models']), ('/models/2b-v4/', 'Jev-Style 2B v4'), ('/models/0-8b-v3/', 'Jev-Style 0.8B v3'), ('/models/compare/', t['compare']), ('/benchmarks/', t['eval'])]),
         (t['dev'], [('/api/', t['docs']), ('/pricing/', t['pricing']), ('/console/', t['console']), ('/api/limits.html', t['limits']), (PYPI, 'PyPI ↗')])],
        [(t['use'], [('/use-cases/', t['all_use']), ('/use-cases/support-ticket-classification/', t['tickets']), ('/use-cases/local-llm-routing/', t['routing']), ('/use-cases/local-vision-decisions/', t['img']), ('/guides/claude-code-guard/', t['guard'])]),
         (t['guides'], [('/guides/', t['all_guides']), ('/guides/local-text-classification/', t['tc']), ('/guides/local-decision-models/', t['dm']), ('/guides/local-routing-tools/', t['rt']), ('/guides/replace-label-only-llm-calls/', t['label'])])],
        [(t['company'], [*[(href, text) for href, text, _ in company_links(lang)], ('/api/terms.html', t['terms']), ('/privacy/', t['privacy'])])],
    ]
    return ''.join(f'<div class="sc-fcol">{"".join(footer_group(*group) for group in column)}</div>' for column in columns)


def footer_brand(lang):
    t = LABELS[lang]
    social = ''.join(f'<a href="{href}" aria-label="{name}" title="{name}">{icon}</a>' for href, name, icon in SOCIAL)
    return f'<div class="sc-fbrand"><a class="brand" href="{local("/", lang)}" aria-label="JevStyle home">{BRAND}JevStyle</a><p>{t["tagline"]}</p><p class="sc-fsince">{t["since"]}</p><div class="sc-fsocial">{social}</div><a class="sc-fmail" href="mailto:{EMAIL}">{EMAIL}</a></div>'


def site_footer(lang, path, classes='site-footer'):
    t = LABELS[lang]
    return f'<footer class="{classes} sc-foot"><div class="sc-foot-in"><div class="sc-fmain">{footer_brand(lang)}<div class="sc-fcols">{footer_columns(lang)}</div></div><div class="sc-fbot"><p>{t["note"]}</p><span>JevStyle © 2026</span>{switch_link(lang, path)}</div></div></footer>'
