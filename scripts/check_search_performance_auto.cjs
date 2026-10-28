/* Automatic-mode DOM contracts. Synthetic API payloads only; no network/storage. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(path.join(__dirname, '../admin/search-performance.js'), 'utf8');

class Element {
  constructor(tag, doc) {
    this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.children = [];
    this.attributes = {}; this.listeners = {}; this._text = ''; this.value = '';
    this.classList = {add() {}};
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(' '); }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  replaceChildren(...children) { this._text = ''; this.children = []; this.append(...children); }
  insertBefore(child, before) { const i = this.children.indexOf(before); assert.notEqual(i, -1); this.children.splice(i, 0, child); }
  addEventListener(type, handler) { this.listeners[type] = handler; }
}
function all(root) { return [root, ...root.children.flatMap(all)]; }
function mount(snapshot) {
  const doc = {
    createElement(tag) { return new Element(tag, doc); },
    createElementNS(ns, tag) { const node = new Element(tag, doc); node.namespaceURI = ns; return node; },
    getElementById(id) { return [...all(doc.head), ...all(doc.root)].find((node) => node.id === id) || null; }
  };
  doc.head = doc.createElement('head'); doc.root = doc.createElement('section');
  let storageReads = 0;
  const window = {};
  Object.defineProperty(window, 'localStorage', {get() { storageReads++; throw Error('Automatic mode must not access localStorage'); }});
  const context = vm.createContext({window, document: doc, console, module: {exports: {}}, Date, Number, String, Math, Array, Object, Error, Promise});
  vm.runInContext(code, context, {filename: 'admin/search-performance.js', timeout: 1000});
  window.JevSearchPerformance.mount(doc.root, {automatic: true, snapshot});
  assert.equal(storageReads, 0, 'Automatic mode does not read private browser imports');
  assert.equal(all(doc.root).some((node) => node.tagName === 'INPUT'), false, 'No CSV input is attached');
  assert.equal(all(doc.root).some((node) => node.tagName === 'BUTTON' && /保存|清除导入/.test(node.textContent)), false, 'No local import/save controls');
  return {root: doc.root, text: () => doc.root.textContent};
}
const row = (label, clicks, impressions, position = null) => ({label, clicks, impressions, position});
const base = (summary = null, datasets = {}) => ({schema_version: 1, source: 'google_search_console_api',
  observed_at: '2026-10-29T00:00:00Z', requested_window: {start: '2026-10-01', end: '2026-10-28'}, summary, datasets});

// Property totals must remain separate from sums of the returned daily/query rows.
let view = mount(base({source: 'property_total_api', clicks: 7, impressions: 400, ctr: 7 / 400, position: 4},
  {date: {state: 'ready', rows: [row('2026-10-01', 2, 100, 8)]}}));
assert.match(view.text(), /GSC 全站汇总/);
assert.match(view.text(), /点击 7 · 展示 400/);
assert.match(view.text(), /仅汇总当前表及筛选的 1 行/);

// Empty final responses remain unmeasured; no made-up zero metric cards.
view = mount(base(null, {date: {state: 'empty', rows: []}, query: {state: 'empty', rows: []}}));
assert.match(view.text(), /尚未返回.*有效数据/);
assert.doesNotMatch(view.text(), /点击次数|展示次数|GSC 全站汇总/);

// Explicit API zeros are valid observations; unknown CTR/rank remain unknown.
view = mount(base({source: 'property_total_api', clicks: 0, impressions: 0, ctr: null, position: null}));
assert.match(view.text(), /点击 0 · 展示 0 · CTR 未测量 · 平均排名 未测量/);

// A fallback row summary is labelled partial; missing dates are not filled.
view = mount(base({source: 'returned_date_rows', clicks: 2, impressions: 100, ctr: .02, position: null},
  {date: {state: 'ready', rows: [row('2026-10-01', 2, 100), row('2026-10-03', 0, 0)]}, query: {state: 'error', rows: []}}));
assert.match(view.text(), /日期返回行汇总（非完整窗口总量）/);
assert.match(view.text(), /平均排名 未测量/);
assert.match(view.text(), /仅汇总当前表及筛选的 2 行/);
assert.doesNotMatch(view.text(), /2026-10-02/);
const chooser = all(view.root).find((node) => node.attributes['aria-label'] === '选择数据维度');
chooser.value = 'query'; chooser.listeners.change();
assert.match(view.text(), /尚未返回.*有效数据/);

// Invalid rows cannot become zero clicks or charts, while valid official totals remain separately valid.
view = mount(base({source: 'property_total_api', clicks: 9, impressions: 500, ctr: .018, position: null},
  {date: {state: 'ready', rows: [row('2026-10-01', null, 100)]}}));
assert.match(view.text(), /未通过校验/);
assert.match(view.text(), /点击 9 · 展示 500/);
assert.doesNotMatch(view.text(), /仅汇总当前表/);

// The property summary must pass the same fail-closed numeric/provenance boundary.
for (const summary of [
  {source: 'property_total_api', clicks: 'oops', impressions: 10, ctr: 'oops', position: null},
  {source: 'property_total_api', clicks: false, impressions: 10, ctr: 0, position: null},
  {source: 'invented_total', clicks: 2, impressions: 10, ctr: .2, position: null}
]) {
  view = mount(base(summary));
  assert.match(view.text(), /未通过校验|数据格式.*无效|无法校验/, 'Invalid automatic summary is rejected visibly');
  assert.doesNotMatch(view.text(), /oops|NaN|点击 false|点击 2 · 展示 10/);
}

// An invalid total must not discard an independently valid returned daily table.
view = mount(base({source: 'property_total_api', clicks: 'oops', impressions: 10, ctr: 'oops', position: null},
  {date: {state: 'ready', rows: [row('2026-10-01', 2, 100, 8)]}}));
assert.match(view.text(), /未通过校验/);
assert.match(view.text(), /仅汇总当前表及筛选的 1 行/);
assert.doesNotMatch(view.text(), /oops|NaN/);
console.log('Automatic SEO view checks passed: official totals, row estimates, null/empty/partial data, no CSV/localStorage and invalid summary rejection.');
