/* Contract checks for the real admin bootstrap. All fetches are local stubs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../admin/index.html'), 'utf8');
const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((match) => !/\bsrc\s*=/.test(match[1]))
  .map((match) => match[2]).join('\n');
assert.ok(inline.includes('/admin/stats'), 'Run the actual admin bootstrap, not a mirrored implementation');
assert.match(html, /<main\b[^>]*id="dash"[^>]*\bhidden\b/);

function stats() {
  return {
    generated_at: '2026-10-29T00:00:00Z', days: 30,
    accounts: {active: 5, new_today: 1, new_7d: 2, verified: 4, disabled: 0},
    keys: {active: 3, users_with_key: 2, revoked: 1},
    requests: {today: 2, active_users_today: 1, last_7d: 8, all_time: 11, window: 6},
    daily: [{day: '2026-10-29', signups: 1, requests: 2}], users: []
  };
}
function element(id, attrs = {}) {
  return {
    id, hidden: id === 'dash' || id === 'gate' || id === 'err', textContent: '', innerHTML: '',
    href: '', rows: [], attributes: {...attrs}, listeners: Object.create(null),
    setAttribute(key, value) { this.attributes[key] = String(value); },
    getAttribute(key) { return this.attributes[key] ?? null; },
    addEventListener(type, listener) { this.listeners[type] = listener; }
  };
}
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(setImmediate); };

async function scenario(initial) {
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => [m[1], element(m[1])]));
  const ranges = [7, 30, 90].map((days) => element('range-' + days, {'data-days': String(days)}));
  const mounts = {geo: 0, search: 0};
  const calls = [];
  let response = initial;
  const window = {
    JevDiscovery: {mount(root) { assert.equal(root, nodes.get('geo-content')); mounts.geo++; }},
    JevSearchPerformance: {mount(root) { assert.equal(root, nodes.get('search-content')); mounts.search++; }}
  };
  const context = vm.createContext({
    window, console, Date, Number, String, Math, Array, Error, Promise,
    location: {href: 'https://jevstyle.com/admin/'},
    document: {
      getElementById(id) { assert.ok(nodes.has(id), 'Unknown element: ' + id); return nodes.get(id); },
      querySelectorAll(selector) { assert.equal(selector, '#range button'); return ranges; }
    },
    async fetch(url, options) {
      calls.push({url, options});
      assert.equal(options.credentials, 'include');
      assert.equal(options.cache, 'no-store');
      if (url === 'https://api.jevstyle.com/control/v1/auth/me') return {ok: true, status: 200, json: async () => ({user: {}})};
      assert.match(url, /^https:\/\/api\.jevstyle\.com\/control\/v1\/admin\/stats\?days=(7|30|90)$/);
      if (response === 'networkerror') throw new Error('Synthetic offline condition');
      if (response === 'invalidJSON') return {ok: true, status: 200, json: async () => { throw new SyntaxError('Synthetic malformed JSON'); }};
      const status = typeof response === 'number' ? response : 200;
      const payload = response === 'invalidshape' ? {accounts: 'bad type', keys: {}, requests: {}, daily: [], users: []}
        : response === 'missingfields' ? {accounts: {}, keys: {}, requests: {}}
        : stats();
      if (response === 'invalidcount') payload.accounts.active = null;
      if (response === 'invaliddaily') payload.daily[0].signups = '1';
      if (response === 'invaliduser') payload.users = [{email: 'synthetic@example.invalid', active_keys: -1}];
      return {ok: status >= 200 && status < 300, status, json: async () => payload};
    }
  });
  vm.runInContext(inline, context, {filename: 'admin/index.html:inline', timeout: 1000});
  await flush();
  return {
    nodes, mounts, calls, ranges,
    setResponse(value) { response = value; },
    async refresh() { nodes.get('refresh').listeners.click(); await flush(); },
    async range(days) { const target = ranges.find((b) => b.getAttribute('data-days') === String(days)); target.listeners.click(); await flush(); }
  };
}

(async () => {
  for (const state of [401, 403, 500, 'invalidJSON', 'invalidshape', 'missingfields', 'invalidcount', 'invaliddaily', 'invaliduser', 'networkerror']) {
    const current = await scenario(state);
    assert.equal(current.nodes.get('dash').hidden, true, state + ': dashboard stays hidden');
    assert.equal(current.nodes.get('gate').hidden, false, state + ': an actionable gate is shown');
    assert.deepEqual(current.mounts, {geo: 0, search: 0}, state + ': discovery modules stay unmounted');
    assert.equal(current.calls.filter((call) => call.url.includes('/admin/stats')).length, 1);
  }

  const valid = await scenario(200);
  assert.equal(valid.nodes.get('dash').hidden, false, 'Valid admin stats reveal dashboard');
  assert.equal(valid.nodes.get('gate').hidden, true);
  assert.deepEqual(valid.mounts, {geo: 1, search: 1});
  await valid.refresh(); await valid.range(7); await valid.range(90);
  assert.deepEqual(valid.mounts, {geo: 1, search: 1}, 'Refresh and range changes do not remount modules');
  assert.ok(valid.calls.some((call) => call.url.endsWith('?days=7')));
  assert.ok(valid.calls.some((call) => call.url.endsWith('?days=90')));

  valid.setResponse(403); await valid.refresh();
  assert.equal(valid.nodes.get('dash').hidden, true, 'Revoked authorization hides already mounted dashboard');
  valid.setResponse(200); await valid.refresh();
  assert.equal(valid.nodes.get('dash').hidden, false, 'A later authorized load restores dashboard');
  assert.deepEqual(valid.mounts, {geo: 1, search: 1}, 'Reauthorizing does not duplicate module mounts');
  console.log('Admin gate checks passed: unauthorized, server/network/JSON/shape errors, valid access and single mounts. No network used.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
