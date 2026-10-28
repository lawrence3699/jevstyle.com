# Growth measurement

Cloudflare Web Analytics remains the page-view and referrer provider. The same
existing site token is present on the homepage, Chinese homepage, and new public
guides. No additional analytics service or account has been created.

`assets/journey.js` dispatches an in-page `jevstyle:analytics` CustomEvent. It never
sends or stores events, even when another analytics library exists on the page.
It is **not** an event dashboard or historical log. Cloudflare remains the only
configured analytics service. Do not add a second Cloudflare beacon to a page.

A future, explicitly authorized integration can listen to this interface. For
example, this local debugging listener only prints the event in the browser:

```js
window.addEventListener('jevstyle:analytics', event => {
  const {name, properties} = event.detail;
  console.debug('JevStyle event', name, properties);
});
```

The listener does not install a tracker or transmit data. Any future forwarding
must be implemented explicitly; the bridge does not discover providers.

## Supported events

| Event | Trigger | Meaning |
| --- | --- | --- |
| `demo_open` | Visitor follows a marked HF demo link | Demo intent, not a successful model run |
| `quickstart_open` | Visitor follows a local-install guide link | Install intent, not an installation |
| `guide_open` | Visitor opens a use-case or evaluation guide | Guide discovery |
| `model_open` | Visitor opens a model reference | Model discovery |
| `github_open` | Visitor follows a marked GitHub link | Repository intent, not a star |
| `code_copy` | Clipboard write succeeds for a code snippet | Copy success, not execution |

Events contain only the page path, allowlisted campaign values (`utm_source`,
`utm_medium`, `utm_campaign`), a destination path, and/or a component ID. They do
not contain pasted text, model inputs/outputs, API keys, email addresses, full URLs,
or arbitrary query parameters. No persistent identifier is created.

An HF Space is a separate origin: do not claim that a website `demo_open` event
measures successful inference. Space execution and installation retention need
separate, authorized measurement before those funnel stages can be reported.

## Campaign convention

Use explicit, stable campaign links in authored content:

- HF model card: `?utm_source=huggingface&utm_medium=model_card&utm_campaign=start_here`
- GitHub README: `?utm_source=github&utm_medium=readme&utm_campaign=start_here`
- A future release post: `?utm_source=<channel>&utm_medium=release&utm_campaign=local_decisions`

Cloudflare page-view/referrer reports remain useful before the optional event
provider is enabled. Do not assume the Cloudflare dashboard exposes custom event
or UTM breakdowns: the bridge does not alter Cloudflare's collection protocol.

## Weekly review

Record landing-page views and referrers, then compare guide and model-page views.
After configuring event analytics, add demo intent and code-copy counts. Report
HF downloads and GitHub stars separately; neither is a unique-user count and
they cannot be divided to estimate a cross-platform conversion rate.

## Updating the site

Edit the existing homepage copy/data, then run:

```sh
python3 scripts/prerender_home.py
python3 scripts/check_site.py
```

The prerender step updates crawlable English text and `/zh/` from the same
translation data. Keep language-specific canonical URLs and reciprocal
`hreflang` links. The deployment workflow repeats these checks before publishing.
New guides need a sitemap entry, a link from a relevant existing page, an original
title/description, and a runnable example with limitations.
