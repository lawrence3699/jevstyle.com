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

function stats(days = 30) {
  return {
    generated_at: '2026-10-29T00:00:00Z', days,
    accounts: {active: 5, new_today: 1, new_7d: 2, verified: 4, disabled: 0},
    keys: {active: 3, users_with_key: 2, revoked: 1},
    requests: {today: 2, active_users_today: 1, last_7d: 8, all_time: 11, window: 6},
    daily: Array.from({length: days}, (_, i) => ({day: new Date(Date.UTC(2026, 9, 30 - days + i)).toISOString().slice(0, 10), signups: i === days - 1 ? 1 : 0, requests: i === days - 1 ? 2 : 0, active_users: i === days - 1 ? 1 : 0})), users: []
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
  const downloads = [];
  const blobs = [];
  let response = initial;
  const window = {
    JevDiscovery: {mount(root) { assert.equal(root, nodes.get('geo-content')); mounts.geo++; }},
    JevSearchMonitor: {mount(root) { assert.equal(root, nodes.get('search-content')); mounts.search++; }}
  };
  const context = vm.createContext({
    window, console, Date, Number, String, Math, Array, Error, Promise,
    Blob, URL: {createObjectURL(blob) { blobs.push(blob); return "blob:usage-test"; }, revokeObjectURL() {}},
    setTimeout(fn) { fn(); },
    location: {href: 'https://jevstyle.com/admin/'},
    document: {
      body: {appendChild() {}},
      createElement(tag) { assert.equal(tag, "a"); return {click() { downloads.push(this.download); }, remove() {}}; },
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
        : stats(Number(new URL(url).searchParams.get("days")));
      if (response === 'invalidcount') payload.accounts.active = null;
      if (response === 'invaliddaily') payload.daily[0].signups = '1';
      if (response === 'invalidactive') payload.daily[0].active_users = null;
      if (response === 'emptydaily') payload.daily = [];
      if (response === 'zerousage') { payload.daily.forEach(row => { row.requests = 0; row.active_users = 0; }); payload.requests.window = 0; }
      if (response === 'invaliduser') payload.users = [{email: 'synthetic@example.invalid', active_keys: -1}];
      return {ok: status >= 200 && status < 300, status, json: async () => payload};
    }
  });
  vm.runInContext(inline, context, {filename: 'admin/index.html:inline', timeout: 1000});
  await flush();
  return {
    nodes, mounts, calls, ranges, downloads, blobs,
    setResponse(value) { response = value; },
    async refresh() { nodes.get('refresh').listeners.click(); await flush(); },
    async range(days) { const target = ranges.find((b) => b.getAttribute('data-days') === String(days)); target.listeners.click(); await flush(); }
  };
}

(async () => {
  for (const state of [401, 403, 500, 'invalidJSON', 'invalidshape', 'missingfields', 'invalidcount', 'invaliddaily', 'invaliduser', 'invalidactive', 'emptydaily', 'networkerror']) {
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
  assert.equal(valid.nodes.get('usage-today').textContent, '2');
  assert.equal(valid.nodes.get('usage-yesterday').textContent, '0');
  assert.equal(valid.nodes.get('usage-active').textContent, '1');
  assert.equal((valid.nodes.get('usage-rows').innerHTML.match(/<tr>/g) || []).length, 30);
  assert.ok(valid.nodes.get('usage-rows').innerHTML.startsWith('<tr><td>2026-10-29'));
  valid.nodes.get('usage-export').listeners.click();
  assert.equal(valid.downloads[0], 'jev-daily-usage-2026-09-30-2026-10-29.csv');
  const csv = await valid.blobs[0].text();
  assert.ok(csv.startsWith('date_utc,successful_requests,active_accounts\r\n'));
  assert.ok(csv.endsWith('2026-10-29,2,1\r\n'));
  await valid.refresh(); await valid.range(7);
  assert.equal((valid.nodes.get('usage-rows').innerHTML.match(/<tr>/g) || []).length, 7);
  await valid.range(90);
  assert.equal((valid.nodes.get('usage-rows').innerHTML.match(/<tr>/g) || []).length, 90);
  valid.setResponse('zerousage'); await valid.refresh();
  assert.equal(valid.nodes.get('usage-empty').hidden, false);
  assert.equal((valid.nodes.get('usage-rows').innerHTML.match(/<tr>/g) || []).length, 90);
  assert.deepEqual(valid.mounts, {geo: 1, search: 1}, 'Refresh and range changes do not remount modules');
  assert.ok(valid.calls.some((call) => call.url.endsWith('?days=7')));
  assert.ok(valid.calls.some((call) => call.url.endsWith('?days=90')));

  valid.setResponse(403); await valid.refresh();
  assert.equal(valid.nodes.get('dash').hidden, true, 'Revoked authorization hides already mounted dashboard');
  const exportedBefore = valid.downloads.length;
  valid.nodes.get('usage-export').listeners.click();
  assert.equal(valid.downloads.length, exportedBefore, 'Revoked authorization prevents export');
  valid.setResponse(200); await valid.refresh();
  assert.equal(valid.nodes.get('dash').hidden, false, 'A later authorized load restores dashboard');
  assert.deepEqual(valid.mounts, {geo: 1, search: 1}, 'Reauthorizing does not duplicate module mounts');
  console.log('Admin gate checks passed: unauthorized, server/network/JSON/shape errors, valid access, daily usage, zero days, CSV, ranges and single mounts. No network used.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
