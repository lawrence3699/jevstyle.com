/* In-page event bridge. This file never sends or stores analytics data.
 * Cloudflare Web Analytics remains responsible for page views only.
 * Payloads never include user input, model output, credentials or full query strings.
 */
(() => {
  'use strict';
  const allowed = new Set(['api_key_open','demo_open','quickstart_open','guide_open','model_open','github_open','code_copy']);
  const safe = value => typeof value === 'string' && /^[a-zA-Z0-9_./-]{1,96}$/.test(value) ? value : undefined;
  const query = new URLSearchParams(location.search);
  const campaign = {};
  for (const key of ['utm_source','utm_medium','utm_campaign']) {
    const value = safe(query.get(key));
    if (value) campaign[key] = value;
  }
  const track = (name, properties = {}) => {
    if (!allowed.has(name)) return;
    const payload = {path: location.pathname, ...campaign};
    if (safe(properties.target)) payload.target = properties.target;
    if (safe(properties.component)) payload.component = properties.component;
    window.dispatchEvent(new CustomEvent('jevstyle:analytics', {detail:{name,properties:payload}}));
  };
  window.jevAnalytics = Object.freeze({track});
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const target = new URL(link.href, location.href);
    let name = link.dataset.track;
    if (!name && target.hostname === 'github.com') name = 'github_open';
    if (!name && target.hostname === 'huggingface.co') name = target.pathname.startsWith('/spaces/') ? 'demo_open' : 'model_open';
    if (!name && target.origin === location.origin && /^\/(guides|use-cases)\//.test(target.pathname)) name = 'guide_open';
    if (name) track(name, {target:target.pathname, component:link.id || link.dataset.component});
  });
  // Runnable tutorial examples get a direct next action. Existing homepage copy
  // controls stay with their own UI and call the same event bridge on success.
  document.querySelectorAll('.article pre').forEach((pre, index) => {
    const label = pre.previousElementSibling;
    if (!label?.classList.contains('code-label')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy code';
    button.setAttribute('aria-label', `Copy code example ${index + 1}`);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        track('code_copy', {component:`guide-example-${index + 1}`});
        button.textContent = 'Copied';
      } catch (_) {
        button.textContent = 'Select and copy code';
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges(); selection.addRange(range);
      }
      setTimeout(() => { button.textContent = 'Copy code'; }, 1800);
    });
    label.append(button);
  });
})();
