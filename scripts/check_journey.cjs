#!/usr/bin/env node
/* Verify the event bridge's payload contract and absence of implicit forwarding. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const events = [];
const handlers = {};
let forwarded = 0;
const window = {
  dispatchEvent(event) { events.push(JSON.parse(JSON.stringify(event.detail))); },
  plausible() { forwarded++; },
  gtag() { forwarded++; },
};
const context = {
  window,
  document: {
    addEventListener(name, handler) { handlers[name] = handler; },
    querySelectorAll() { return []; },
  },
  location: {
    href: 'https://jevstyle.com/?utm_source=github&token=private-token',
    origin: 'https://jevstyle.com',
    pathname: '/',
    search: '?utm_source=github&utm_medium=readme&utm_campaign=bad%40email.test&token=private-token',
  },
  URL, URLSearchParams,
  CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } },
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/journey.js'), 'utf8'), context);
window.jevAnalytics.track('unknown_event', {input: 'private input'});
assert.equal(events.length, 0, 'unknown event must not be dispatched');
window.jevAnalytics.track('code_copy', {
  target: '/guides/decision-evaluation/', component: 'example-1', input: 'private input', api_key: 'private-key',
});
assert.deepEqual(events.pop(), {name: 'code_copy', properties: {
  path: '/', utm_source: 'github', utm_medium: 'readme',
  target: '/guides/decision-evaluation/', component: 'example-1',
}});
window.jevAnalytics.track('demo_open', {
  target: '/path?token=private-token', component: {toString() { return 'object-value'; }},
});
assert.deepEqual(events.pop(), {name: 'demo_open', properties: {
  path: '/', utm_source: 'github', utm_medium: 'readme',
}});
handlers.click({target: {closest() { return {
  href: 'https://huggingface.co/spaces/example/demo?token=private-token', dataset: {}, id: 'hero-demo',
}; }}});
assert.deepEqual(events.pop(), {name: 'demo_open', properties: {
  path: '/', utm_source: 'github', utm_medium: 'readme', target: '/spaces/example/demo', component: 'hero-demo',
}});
assert.equal(forwarded, 0, 'existing analytics globals must never receive automatic forwarding');
console.log('Checked event names, payload allowlist, query stripping, click classification, and no implicit forwarding.');
