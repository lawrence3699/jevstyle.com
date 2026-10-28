/* Owner-side Search Console CSV viewer. No upload, network calls or third-party code. */
(function (scope) {
  "use strict";
  var MAX_BYTES = 1024 * 1024, MAX_ROWS = 10000, STORAGE = "jevstyle-search-performance-v1";
  var aliases = {
    date: ["date", "日期"], query: ["query", "queries", "top queries", "热门查询", "查询", "热门搜索查询"],
    clicks: ["clicks", "点击次数", "点击量"], impressions: ["impressions", "展示次数", "展示量", "曝光次数"],
    ctr: ["ctr", "click-through rate", "点击率"], position: ["position", "average position", "排名", "平均排名"]
  };
  function key(s) { return String(s).replace(/^\uFEFF/, "").trim().toLowerCase(); }
  function csv(text, rowLimit) {
    rowLimit = rowLimit || 10000;
    if (typeof text !== "string" || text.length > (rowLimit > 10000 ? MAX_BYTES * 16 : MAX_BYTES)) throw new Error("CSV 太大；每个文件上限为 1 MB。");
    var rows = [], row = [], cell = "", quoted = false, closed = false;
    function field() { row.push(cell); cell = ""; closed = false; }
    function line() {
      field();
      if (row.some(function (v) { return v.trim() !== ""; })) rows.push(row);
      row = [];
      if (rows.length > rowLimit + 1) throw new Error("CSV 超过 10,000 行数据上限。");
    }
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
        else cell += c;
      } else if (c === '"') {
        if (cell !== "" || closed) throw new Error("CSV 引号格式不正确。");
        quoted = true;
      } else if (c === ",") field();
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; line(); }
      else { if (closed && c.trim()) throw new Error("CSV 引号后的内容不正确。"); cell += c; }
    }
    if (quoted) throw new Error("CSV 有未闭合的引号。");
    line();
    return rows;
  }
  function numeric(value, label, optional, percent) {
    var v = String(value == null ? "" : value).trim();
    if (!v || v === "—" || v === "-" || /^null$/i.test(v)) { if (optional) return null; throw new Error(label + "缺少数值。"); }
    var hasPercent = /%$/.test(v); v = v.replace(/,/g, "").replace(/%$/, "");
    if (!/^\d+(?:\.\d+)?$/.test(v)) throw new Error(label + "不是有效的非负数。");
    var n = Number(v); if (!Number.isFinite(n)) throw new Error(label + "数值无效。");
    return percent && hasPercent ? n / 100 : n;
  }
  function brand(query) { return /jev[\s-]*style/i.test(query) ? "brand" : "nonbrand"; }
  function parse(text, name, rowLimit) {
    var rows = csv(text.replace(/^\uFEFF/, ""), rowLimit);
    if (rows.length < 2) throw new Error("CSV 需要表头及至少一行数据。");
    var header = rows.shift().map(key), indices = {};
    Object.keys(aliases).forEach(function (k) {
      var hits = header.map(function (v, i) { return aliases[k].indexOf(v) >= 0 ? i : -1; }).filter(function (i) { return i >= 0; });
      if (hits.length > 1) throw new Error("CSV 有重复的" + k + "列。");
      indices[k] = hits.length ? hits[0] : -1;
    });
    if (indices.clicks < 0 || indices.impressions < 0) throw new Error("需要 Clicks/点击次数和 Impressions/展示次数列。");
    var type = indices.date >= 0 ? "date" : indices.query >= 0 ? "query" : null;
    if (!type || (indices.date >= 0 && indices.query >= 0)) throw new Error("请分别导入 Search Console 的日期表或查询表，不要合并维度。");
    var seen = Object.create(null);
    var data = rows.map(function (values, index) {
      var at = "第 " + (index + 2) + " 行：";
      if (values.length !== header.length) throw new Error(at + "列数与表头不一致。");
      var label = values[indices[type]].trim();
      if (!label) throw new Error(at + "日期或查询不能为空。");
      if (type === "date") {
        label = label.replace(/\//g, "-");
        var date = new Date(label + "T00:00:00Z");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(label) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== label) throw new Error(at + "日期必须是有效的 YYYY-MM-DD。");
      }
      if (seen[label]) throw new Error(at + "有重复的日期或查询，请先检查导出表。");
      seen[label] = true;
      var clicks = numeric(values[indices.clicks], at + "点击次数", false);
      var impressions = numeric(values[indices.impressions], at + "展示次数", false);
      if (!Number.isSafeInteger(clicks) || !Number.isSafeInteger(impressions)) throw new Error(at + "点击及展示次数必须是安全范围内的整数。");
      var pos = indices.position < 0 ? null : numeric(values[indices.position], at + "排名", true);
      if (pos === 0) pos = null;
      if (pos !== null && pos < 1) throw new Error(at + "排名应为 1 或更大，未知值请留空。");
      var reportedCtr = indices.ctr < 0 ? null : numeric(values[indices.ctr], at + "点击率", true, true);
      return {label: label, clicks: clicks, impressions: impressions, position: pos, reported_ctr: reportedCtr, brand: type === "query" ? brand(label) : null};
    });
    if (type === "date") data.sort(function (a, b) { return a.label.localeCompare(b.label); });
    return {type: type, name: String(name || "CSV").slice(0, 180), imported_at: new Date().toISOString(), rows: data, overrides: Object.create(null)};
  }
  function aggregate(rows) {
    var d = rows.reduce(function (a, r) {
      a.clicks += r.clicks; a.impressions += r.impressions;
      if (r.position !== null && r.impressions > 0) { a.position_sum += r.position * r.impressions; a.position_impressions += r.impressions; }
      return a;
    }, {clicks: 0, impressions: 0, position_sum: 0, position_impressions: 0});
    d.ctr = d.impressions ? d.clicks / d.impressions : null;
    d.position = d.position_impressions ? d.position_sum / d.position_impressions : null;
    return d;
  }
  function validateSaved(value, rowLimit) {
    rowLimit = rowLimit || MAX_ROWS;
    if (!value || value.version !== 1 || !value.datasets || typeof value.datasets !== "object") throw new Error("保存的数据格式不可用。");
    var clean = {};
    ["date", "query"].forEach(function (type) {
      var d = value.datasets[type]; if (!d) return;
      if (d.type !== type || !Array.isArray(d.rows) || !d.rows.length || d.rows.length > rowLimit) throw new Error("保存的数据无效。");
      var text = (type === "date" ? "Date" : "Query") + ",Clicks,Impressions,Position\n" + d.rows.map(function (r) {
        return '"' + String(r.label).replace(/"/g, '""') + '",' + r.clicks + "," + r.impressions + "," + (r.position == null ? "" : r.position);
      }).join("\n");
      var valid = parse(text, d.name, rowLimit); valid.imported_at = typeof d.imported_at === "string" ? d.imported_at : valid.imported_at;
      Object.keys(d.overrides || {}).forEach(function (q) { if (d.overrides[q] === "brand" || d.overrides[q] === "nonbrand") valid.overrides[q] = d.overrides[q]; });
      clean[type] = valid;
    });
    return clean;
  }
  function mount(root, options) {
    options = options || {};
    var automatic = options.automatic === true;
    if (!root || !root.ownerDocument) throw new Error("A root DOM element is required.");
    var doc = root.ownerDocument, state = {datasets: {}, active: "date", filter: "all", saved: false};
    function el(tag, text, cls) { var e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
    function button(text, run) { var b = el("button", text, "btn"); b.type = "button"; b.addEventListener("click", run); return b; }
    function option(select, value, text) { var o = el("option", text); o.value = value; select.appendChild(o); }
    if (!doc.getElementById("sp-styles")) {
      var style = el("style"); style.id = "sp-styles";
      style.textContent = ".sp-panel{min-width:0}.sp-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0}.sp-tools label{font-size:14px}.sp-tools select{font:inherit;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}.sp-status{font-size:13px;color:var(--ink2);overflow-wrap:anywhere}.sp-status[role=alert]{color:var(--danger)}.sp-empty{padding:24px;background:var(--soft);border-radius:10px;color:var(--ink2)}.sp-table{max-height:460px;overflow:auto}.sp-table td:first-child{white-space:normal;overflow-wrap:anywhere;max-width:380px;min-width:140px}.sp-table select{max-width:130px;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:4px}.sp-chart svg{display:block;width:100%;height:150px}.sp-chart .sp-chart-axis{display:flex;justify-content:space-between;font-size:12px;color:var(--ink3)}.sp-file{max-width:100%;font:inherit;font-size:13px}.sp-panel .grid{margin:14px 0}.sp-panel h3{font-size:15px;margin:0 0 8px}.sp-help{font-size:13px;color:var(--ink2);margin:8px 0}.sp-help summary{cursor:pointer}.sp-help li{margin:5px 0}.sp-panel .sp-card{box-shadow:none;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:16px;min-width:0}";
      doc.head.appendChild(style);
    }
    root.classList.add("sp-panel"); root.replaceChildren();
    var intro = el("p", automatic ? "来自 Google Search Console 只读 API 的服务端缓存；日期与查询分别展示，不相加。" : "导入 Google Search Console 的 CSV，查看真实搜索点击、展示及品牌/非品牌查询。文件只在当前浏览器处理，不上传。", "sub"); root.appendChild(intro);
    if (automatic && options.snapshot.datasets) {
      var missing = options.snapshot.datasets.date && options.snapshot.datasets.date.missing_dates;
      root.appendChild(el("p", "仅使用最终数据；" + (Array.isArray(missing) && missing.length ? missing.length + " 个日期未返回，未补零。" : "未返回的日期不会补零。") + " 查询 API 仅提供热门行，可能省略匿名查询或受行数限制。", "sp-help"));
    }
    var tools = el("div", null, "sp-tools"), file = el("input", null, "sp-file"); file.type = "file"; file.accept = ".csv,text/csv"; file.setAttribute("aria-label", "导入 Search Console CSV"); if (!automatic) tools.appendChild(file);
    var active = el("select"); active.setAttribute("aria-label", automatic ? "选择数据维度" : "选择导入表"); option(active, "date", "每日趋势"); option(active, "query", "搜索查询"); tools.appendChild(active);
    var filter = el("select"); filter.setAttribute("aria-label", "品牌查询筛选"); option(filter, "all", "全部查询"); option(filter, "brand", "品牌查询"); option(filter, "nonbrand", "非品牌查询"); tools.appendChild(filter);
    if (!automatic) tools.appendChild(button("保存到此浏览器", function () {
      if (!Object.keys(state.datasets).length) return status("请先导入 CSV。", true);
      try { scope.localStorage.setItem(STORAGE, JSON.stringify({version: 1, datasets: state.datasets})); state.saved = true; status("已保存到此浏览器；共享设备上的其他使用者可能看到这些数据。", false); }
      catch (e) { status("此浏览器无法保存数据，或存储空间不足；当前查看不受影响。", true); }
    }));
    if (!automatic) tools.appendChild(button("清除导入数据", function () {
      try { scope.localStorage.removeItem(STORAGE); } catch (e) {}
      state.datasets = {}; state.saved = false; file.value = ""; render(); status("已清除当前视图及此浏览器保存的导入数据。", false);
    }));
    root.appendChild(tools);
    var message = el("p", automatic ? "统计仅使用已返回且核实的数据；缺失日期不补零，查询表不代表全站总量。" : "尚未导入。默认仅在本次页面会话保留；选择保存后才写入此浏览器。", "sp-status"); message.setAttribute("aria-live", "polite"); root.appendChild(message);
    var output = el("div"); root.appendChild(output);
    if (automatic && options.snapshot.summary) {
      var total = options.snapshot.summary;
      var count = function (x) { return typeof x === "number" && Number.isSafeInteger(x) && x >= 0; };
      var finite = function (x) { return typeof x === "number" && Number.isFinite(x); };
      var validTotal = ["property_total_api", "returned_date_rows"].indexOf(total.source) >= 0 && count(total.clicks) && count(total.impressions) &&
        (total.ctr === null || (finite(total.ctr) && total.ctr >= 0 && total.ctr <= 1)) &&
        (total.position === null || (finite(total.position) && total.position >= 1));
      if (!validTotal) root.insertBefore(el("p", "服务端汇总数据未通过校验，汇总数值未显示。", "sp-status"), tools);
      else {
      var overview = el("div", null, "sp-card");
      overview.appendChild(el("h3", total.source === "property_total_api" ? "GSC 全站汇总（API，按当前窗口与搜索类型）" : "日期返回行汇总（非完整窗口总量）"));
      overview.appendChild(el("p", "点击 " + number(total.clicks) + " · 展示 " + number(total.impressions) + " · CTR " + (total.ctr == null ? "未测量" : (total.ctr * 100).toFixed(2) + "%") + " · 平均排名 " + number(total.position, 2), "sp-status"));
      root.insertBefore(overview, tools);
      if (options.snapshot.requested_window) overview.appendChild(el("p", options.snapshot.requested_window.start + " 至 " + options.snapshot.requested_window.end + " · Web · 最终数据 · 日期按太平洋时间", "sp-help"));
      }
    }
    var help = el("details", null, "sp-help"); help.appendChild(el("summary", "在哪里取得数据，统计口径是什么？"));
    var list = el("ol"); ["在 Search Console 选择 jevstyle.com → 效果 → 搜索结果，固定相同日期范围及 Web 搜索类型，导出日期表或查询表 CSV；每个文件不超过 1 MB、10,000 行。", "如果下载的是 ZIP，先解压，再选择 Dates.csv 或 Queries.csv。分别导入日期表和查询表。日期表提供每日趋势；查询表用于品牌/非品牌筛选，两张表不相加。查询表常有匿名、遗漏或行数限制，不能当作全站总量。", "CTR = 导入行点击总数 ÷ 展示总数。排名为导入行按展示加权的估算，只使用有排名的行；它不等同于 Search Console 的全量精确汇总。GSC 可能把缺失值导出成 0，本页无法恢复原始缺失状态；排名 0 按未知处理。", "品牌匹配只检查 JevStyle / Jev-Style / jev style；类别词可能产生歧义，请逐行人工校正。修改分类后需再次点击保存才持久保留。", "这是手动导入快照，刷新页面不会从 Google 同步。本面板只导入普通 Web 日期/查询表，不是 Google 的 Generative AI performance report，也不代表 ChatGPT 等平台的品牌曝光。Web 搜索数据不能单独识别所有 AI 引用或 AI 引流；应与独立 GEO 复测分开解读。"].forEach(function (s) { list.appendChild(el("li", s)); }); help.appendChild(list); if (!automatic) root.appendChild(help);
    function status(text, error) { message.textContent = text; if (error) message.setAttribute("role", "alert"); else message.removeAttribute("role"); }
    function number(n, digits) { return n == null ? "未测量" : n.toLocaleString("en-US", {maximumFractionDigits: digits || 0}); }
    function chart(rows, field, title, color) {
      var box = el("div", null, "sp-card sp-chart"); box.appendChild(el("h3", title));
      var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 600 150"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", title + "；下方表格列出完整数值");
      var maximum = Math.max.apply(null, rows.map(function (r) { return r[field]; }).concat([1]));
      var step = 600 / rows.length, width = Math.max(.01, step * .78);
      rows.forEach(function (r, i) {
        var rect = doc.createElementNS(svg.namespaceURI, "rect"), height = 142 * r[field] / maximum;
        rect.setAttribute("x", i * step); rect.setAttribute("y", 150 - height); rect.setAttribute("width", width); rect.setAttribute("height", height); rect.setAttribute("fill", color);
        var titleEl = doc.createElementNS(svg.namespaceURI, "title"); titleEl.textContent = r.label + ": " + number(r[field]); rect.appendChild(titleEl); svg.appendChild(rect);
      }); box.appendChild(svg);
      var axis = el("div", null, "sp-chart-axis"); axis.append(el("span", rows[0].label), el("span", "最高 " + number(maximum === 1 && !rows.some(function (r) { return r[field]; }) ? 0 : maximum)), el("span", rows[rows.length - 1].label)); box.appendChild(axis); return box;
    }
    function render() {
      output.replaceChildren(); active.value = state.active; filter.hidden = state.active !== "query";
      var d = state.datasets[state.active];
      if (!d) { output.appendChild(el("div", automatic ? "Google 尚未返回当前维度的有效数据；这不代表零流量。" : state.active === "date" ? "尚无日期数据。导入日期表后显示每日点击与展示趋势。" : "尚无查询数据。导入查询表后查看品牌与非品牌曝光。", "sp-empty")); return; }
      var rows = d.rows.filter(function (r) { return state.active !== "query" || state.filter === "all" || (d.overrides[r.label] || r.brand) === state.filter; });
      var meta = d.name + " · " + d.rows.length + " 行 · " + (automatic ? "采集于 " : "导入于 ") + new Date(d.imported_at).toLocaleString();
      if (d.type === "date") meta += " · " + d.rows[0].label + " 至 " + d.rows[d.rows.length - 1].label + (automatic ? "（日期按 Google 太平洋时间）" : "（日期按导出表原样）");
      else if (automatic && options.snapshot.requested_window) meta += " · " + options.snapshot.requested_window.start + " 至 " + options.snapshot.requested_window.end;
      else meta += " · 查询表未提供日期范围，请保留导出时的筛选条件";
      output.appendChild(el("p", meta, "sp-status"));
      if (!rows.length) { output.appendChild(el("div", "当前筛选下没有查询，不能计算比率。", "sp-empty")); return; }
      var a = aggregate(rows), grid = el("div", null, "grid");
      [["点击次数", number(a.clicks)], ["展示次数", number(a.impressions)], ["点击率", a.ctr == null ? "未测量" : (a.ctr * 100).toFixed(2) + "%"], ["加权平均排名（估算）", number(a.position, 2)]].forEach(function (m) {
        var c = el("div", null, "sp-card"); c.append(el("div", m[0], "k"), el("div", m[1], "v")); grid.appendChild(c);
      }); output.appendChild(grid);
      output.appendChild(el("p", "仅汇总当前表及筛选的 " + rows.length + " 行；有排名的展示分母：" + number(a.position_impressions) + "。", "sp-help"));
      if (d.type === "date") { var charts = el("div", null, "charts"); charts.append(chart(rows, "clicks", "每日搜索点击", "var(--s1)"), chart(rows, "impressions", "每日搜索展示", "var(--s3)")); output.appendChild(charts); }
      var wrap = el("div", null, "sp-table"), table = el("table"), thead = el("thead"), hr = el("tr");
      [d.type === "date" ? "日期" : "查询", "点击", "展示", "CTR", "排名"].concat(d.type === "query" ? ["品牌分类"] : []).forEach(function (h) { hr.appendChild(el("th", h)); }); thead.appendChild(hr); table.appendChild(thead);
      var body = el("tbody");
      rows.slice(0, 500).forEach(function (r) {
        var tr = el("tr"); [r.label, number(r.clicks), number(r.impressions), r.impressions ? (100 * r.clicks / r.impressions).toFixed(2) + "%" : "—", r.position == null ? "—" : number(r.position, 2)].forEach(function (v) { tr.appendChild(el("td", v)); });
        if (d.type === "query") {
          var td = el("td"), select = el("select"); select.setAttribute("aria-label", "品牌分类：" + r.label);
          option(select, "auto", "自动：" + (r.brand === "brand" ? "品牌" : "非品牌")); option(select, "brand", "人工：品牌"); option(select, "nonbrand", "人工：非品牌"); select.value = d.overrides[r.label] || "auto";
          select.addEventListener("change", function () { if (select.value === "auto") delete d.overrides[r.label]; else d.overrides[r.label] = select.value; render(); status(automatic ? "本次视图使用手动分类；下次采集将恢复自动分类。" : "已修改查询分类；如需保留，请再次点击保存。", false); }); td.appendChild(select); tr.appendChild(td);
        } body.appendChild(tr);
      }); table.appendChild(body); wrap.appendChild(table); output.appendChild(wrap);
      if (rows.length > 500) output.appendChild(el("p", "表格显示前 500 行；汇总与图表包含筛选后的全部 " + rows.length + " 行。", "sp-help"));
    }
    active.addEventListener("change", function () { state.active = active.value; render(); });
    filter.addEventListener("change", function () { state.filter = filter.value; render(); });
    file.addEventListener("change", async function () {
      var selected = file.files[0]; if (!selected) return;
      if (selected.size > MAX_BYTES) { status("文件超过 1 MB；请缩短导出时间或减少行数。", true); return; }
      try { var d = parse(await selected.text(), selected.name); state.datasets[d.type] = d; state.active = d.type; state.filter = "all"; render(); status("已在本次页面会话导入。未上传，也未自动保存；如需保留请点击保存。", false); }
      catch (e) { status(e.message || "CSV 无法读取。", true); }
      file.value = "";
    });
    try {
      if (automatic) {
        var datasets = {};
        ["date", "query"].forEach(function (type) {
          var source = options.snapshot && options.snapshot.datasets && options.snapshot.datasets[type];
          if (source && Array.isArray(source.rows) && source.rows.length) datasets[type] = {type:type,name:"Google Search Console API · " + (type === "date" ? "日表" : "查询表"),rows:source.rows,imported_at:options.snapshot.observed_at};
        });
        if (Object.keys(datasets).length) state.datasets = validateSaved({version:1,datasets:datasets}, 100000);
      }
      var saved = automatic ? null : scope.localStorage.getItem(STORAGE);
      if (saved) { if (saved.length > MAX_BYTES * 3) throw new Error("Saved file too large"); state.datasets = validateSaved(JSON.parse(saved)); state.saved = true; state.active = state.datasets.date ? "date" : "query"; status("已读取此前明确保存到此浏览器的快照；不会自动同步 Google。", false); }
    } catch (e) { status(automatic ? "服务端返回的数据未通过校验，未显示错误数值。" : "此前保存的数据不可用。可重新导入，或点击清除导入数据。", true); }
    render();
    return {clear: function () { try { scope.localStorage.removeItem(STORAGE); } catch (e) {} state.datasets = {}; state.saved = false; render(); }};
  }
  var api = {mount: mount, parse: parse, csv: csv, aggregate: aggregate, classifyBrand: brand, validateSaved: validateSaved, maxBytes: MAX_BYTES, maxRows: 10000};
  scope.JevSearchPerformance = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
