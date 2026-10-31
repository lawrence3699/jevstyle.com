(function (global) {
  'use strict';
  var labels = {substantive: '实质回答', refusal: '拒答', technical_error: '技术失败', blocked: '访问限制', not_run: '未执行'};
  function el(tag, text, className) {
    var node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function metricText(m) {
    if (!m || m.numerator == null || !m.denominator) return '未测量';
    return m.numerator + '/' + m.denominator + (m.unknown ? ' · ' + m.unknown + ' 项未知' : '');
  }
  function percent(m) { return !m || m.rate == null ? '未测量' : (m.rate * 100).toFixed(0) + '%'; }
  function flag(v) { return v == null ? '未知' : v ? '是' : '否'; }
  function date(iso) { return iso ? new Date(iso).toLocaleString('zh-CN', {hour12: false}) : '未知'; }
  function select(label, options, value) {
    var wrap = el('label', label), input = el('select');
    options.forEach(function (o) { var opt = el('option', o[1]); opt.value = o[0]; input.appendChild(opt); });
    input.value = value; wrap.appendChild(input); return {wrap: wrap, input: input};
  }
  function table(headers) {
    var wrap = el('div', null, 'geo-table'), tab = el('table'), head = el('thead'), tr = el('tr'), body = el('tbody');
    headers.forEach(function (h) { var cell = el('th', h); cell.scope = 'col'; tr.appendChild(cell); });
    head.appendChild(tr); tab.appendChild(head); tab.appendChild(body); wrap.appendChild(tab);
    return {wrap: wrap, body: body};
  }
  function mount(root) {
    if (root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    root.appendChild(el('p', '正在读取已审核的 GEO 快照…', 'note'));
    var lastVersion = null;
    function load() { return fetch('/admin/data/geo-observations.json', {cache: 'no-cache', credentials: 'omit'}).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (data) {
        if (data.schema_version !== 1 || !Array.isArray(data.rounds) || !data.rounds.length) throw new Error('不支持的数据格式');
        if (data.generated_at !== lastVersion) { render(root, data); lastVersion=data.generated_at; }
      });
    }
    var initial = load().catch(function () {
      root.replaceChildren(el('p', 'GEO 快照暂时无法加载。未取得的数据不会计作零。', 'geo-error'));
      var button = el('button', '重试', 'btn'); button.type = 'button';
      button.addEventListener('click', function () { delete root.dataset.mounted; root.replaceChildren(); mount(root); });
      root.appendChild(button);
    });
    var timer=global.setInterval(function () { if (document.visibilityState==='visible') load().catch(function () {}); },300000);
    global.addEventListener('pagehide',function () { global.clearInterval(timer); },{once:true});
    document.addEventListener('visibilitychange',function () { if (document.visibilityState==='visible') load().catch(function () {}); });
    return initial;
  }
  function render(root, data) {
    root.replaceChildren();
    var schedule=el('div',null,'geo-summary'); schedule.appendChild(el('p','正在读取复测计划状态…'));root.appendChild(schedule);
    fetch('/admin/data/monitoring-status.json',{cache:'no-cache',credentials:'omit'}).then(function (r) { if (!r.ok) throw new Error();return r.json(); }).then(function (info) {
      var g=info.geo;
      if (!g || !g.enabled) { schedule.firstChild.textContent='复测计划尚未启用，当前仅展示已有历史。';return; }
      var latest=data.rounds[data.rounds.length-1];
      schedule.firstChild.textContent='已启用：'+g.schedule_label+'。运行需要本机开机、Codex 应用运行及可用网页会话。最新记录：'+latest.label+'，完成于 '+date(latest.observed_at_end)+'。页面每 5 分钟检查新结果。';
      if (Date.now()-Date.parse(latest.observed_at_end)>9*86400000) schedule.appendChild(el('p','超过 9 天没有新复测记录，请检查本机和计划任务；现有数据已过期。'));
    }).catch(function () { schedule.firstChild.textContent='复测计划状态暂未取得；历史记录仍可查看。'; });
    var controls = el('div', null, 'geo-controls');
    var round = select('测试轮次', data.rounds.map(function (r) { return [r.id, r.label]; }), data.rounds[data.rounds.length - 1].id);
    var provider = select('AI 平台', data.rounds[0].providers.map(function (p) { return [p.id, p.name]; }), 'gemini');
    controls.appendChild(round.wrap); controls.appendChild(provider.wrap);
    var stamp = el('p', '快照生成：' + date(data.generated_at) + ' · 按本机时区显示', 'note');
    root.appendChild(controls); root.appendChild(stamp);
    var body = el('div'); root.appendChild(body);
    function update() {
      body.replaceChildren();
      var r = data.rounds.find(function (x) { return x.id === round.input.value; });
      var p = r.providers.find(function (x) { return x.id === provider.input.value; });
      if (!p) { body.appendChild(el('p', '此轮没有该平台的数据。')); return; }
      var g = p.discovery, metrics = el('div', null, 'grid geo-metrics');
      [['主动提及', g.metrics.mentions], ['官网引用', g.metrics.site_citations], ['GitHub / HF 引用', g.metrics.project_citations]].forEach(function (m) {
        var card = el('div', null, 'card'); card.appendChild(el('div', m[0], 'k')); card.appendChild(el('div', percent(m[1]), 'v'));
        card.appendChild(el('div', m[1].denominator ? '已核实 ' + metricText(m[1]) : '没有可核实样本', 'n')); metrics.appendChild(card);
      });
      var count = el('div', null, 'card'); count.appendChild(el('div', '实质回答', 'k')); count.appendChild(el('div', g.counts.substantive + '/' + g.planned_questions, 'v'));
      count.appendChild(el('div', g.attempted_questions + ' 题已尝试 · ' + g.attempt_count + ' 次请求', 'n')); metrics.appendChild(count); body.appendChild(metrics);
      var summary = el('div', null, 'geo-summary');
      var findings = [];
      if (!g.counts.substantive) findings.push('本轮未取得可用实质回答，无法评估曝光；失败不算未提及。');
      else [['主动提及', g.metrics.mentions], ['官网引用', g.metrics.site_citations]].forEach(function (m) {
        findings.push(m[1].denominator ? m[0] + '：已核实样本 ' + metricText(m[1]) + '。' : m[0] + '：没有可核实样本，无法评估。');
      });
      findings.push('小样本观察不能代表全网曝光。'); summary.appendChild(el('p', findings.join(' ')));
      body.appendChild(summary);
      var groups=table(['题型（固定题目分组）','有效回答','正文提及','官网引用']);
      [['工具选型',['D3','D6']],['工作流方案',['D1','D2','D4']],['评估方法',['D5','D7']]].forEach(function (group) {
        var all=g.questions.filter(function (q) { return group[1].indexOf(q.id)>=0; }), valid=all.filter(function (q) { return q.status==='substantive'; });
        function count(key) { var known=valid.filter(function (q) { return q[key]===true || q[key]===false; });return known.length?known.filter(function (q) { return q[key]===true; }).length+'/'+known.length+(known.length<valid.length?' · 另有未知':''):'未测量'; }
        var row=el('tr');[group[0]+'（'+group[1].join('、')+'）',valid.length+'/'+all.length,count('brand_mentioned'),count('site_cited')].forEach(function (v) { row.appendChild(el('td',v)); });groups.body.appendChild(row);
      });
      body.appendChild(groups.wrap);body.appendChild(el('p','同一套固定问题按意图拆分；每组样本很少，不生成额外答案，也不把正文提及直接当作推荐。','note'));
      var coverage = el('div', null, 'card'); coverage.appendChild(el('h3', g.planned_questions + ' 个无品牌问题的样本状态'));
      var bar = el('div', null, 'geo-statusbar'); bar.setAttribute('role', 'img');
      var legend = el('div', null, 'geo-legend'), descriptions = [];
      Object.keys(labels).forEach(function (key) {
        var n = g.counts[key]; descriptions.push(labels[key] + ' ' + n);
        if (n) { var piece = el('span', null, 'geo-' + key); piece.style.width = (n / g.planned_questions * 100) + '%'; bar.appendChild(piece); }
        var item = el('span'); item.appendChild(el('i', null, 'geo-swatch geo-' + key)); item.appendChild(document.createTextNode(labels[key] + ' ' + n)); legend.appendChild(item);
      });
      bar.setAttribute('aria-label', descriptions.join('，')); coverage.appendChild(bar); coverage.appendChild(legend);
      coverage.appendChild(el('p', '完整回复不重复生成。技术失败尝试：' + g.technical_failure_attempts + '；无正文误停尝试：' + g.operator_aborted_attempts + '。拒答保留记录，主提及率只使用实质回答。', 'note')); body.appendChild(coverage);
      var env = p.environment;
      var modes={anonymous:'匿名',anonymous_incognito:'匿名临时会话',logged_in_temporary:'登录，临时会话',logged_in_no_personalization:'登录，不个性化',logged_in:'已登录',logged_in_mixed_session_modes:'登录，部分题临时模式未确认'};
      body.appendChild(el('p', [env.browser, modes[env.account_mode] || env.account_mode, env.model, env.search_mode].filter(Boolean).join(' · ') + '。本轮观察：' + date(r.observed_at_start) + ' – ' + date(r.observed_at_end), 'note'));
      var questions = table(['题目 / 固定问题', '状态', '正文提及', '官网引用', '请求数']);
      g.questions.forEach(function (q) {
        var tr = el('tr'), td = el('td', q.id, 'geo-question'); td.appendChild(el('small', q.question)); tr.appendChild(td);
        if (Array.isArray(q.verified_site_sources)) q.verified_site_sources.forEach(function (source, index) {
          if (typeof source!=='string' || !/^https:\/\/jevstyle\.com\/(?:$|guides\/|use-cases\/|models\/|benchmarks\/|about\/|zh\/about\/|api\/)/.test(source)) return;
          var url;try { url=new URL(source); } catch (e) { return; }
          if (url.hostname!=='jevstyle.com' || url.protocol!=='https:' || url.username || url.password || url.search || url.hash) return;
          var link=el('a','已核实官网来源'+(q.verified_site_sources.length>1?' '+(index+1):''));link.href=url.href;link.target='_blank';link.rel='noopener';td.appendChild(el('br'));td.appendChild(link);
        });
        if (q.environment_deviation) td.appendChild(el('small',q.environment_deviation.description));
        [labels[q.status] || q.status, flag(q.brand_mentioned), flag(q.site_cited), q.attempts].forEach(function (v) { tr.appendChild(el('td', v)); }); questions.body.appendChild(tr);
      });
      var detail = el('details'); detail.appendChild(el('summary', '查看逐题检测记录')); detail.appendChild(questions.wrap); body.appendChild(detail);
      var facts = el('details', null, 'geo-facts'); facts.appendChild(el('summary', '品牌事实检查（不计入主动发现率）'));
      p.brand_checks.questions.forEach(function (q) {
        var item = el('div', null, 'geo-question'); item.appendChild(el('p', q.id + ' · ' + q.question));
        if (q.fact_check && q.fact_check.errors && q.fact_check.errors.length) {
          item.appendChild(el('span', '存在事实错误', 'pill')); var ul = el('ul'); q.fact_check.errors.forEach(function (error) { ul.appendChild(el('li', error)); }); item.appendChild(ul);
        } else item.appendChild(el('p', q.fact_check && q.fact_check.classification==='accurate' ? '本次核查未发现错误（限该回答所涉事实）。' : q.status === 'substantive' ? '已取得回答；事实核查摘要未提供，请勿据此视为全对。' : labels[q.status] || q.status, 'note'));
        facts.appendChild(item);
      }); body.appendChild(facts);
    }
    round.input.addEventListener('change', update); provider.input.addEventListener('change', update); update();
    var pair=data.latest_comparison || {before_round_id:'round1',after_round_id:'round2',providers:data.comparison};
    function roundLabel(id) { var x=data.rounds.find(function (r) { return r.id===id; });return x?x.label:id; }
    var beforeLabel=roundLabel(pair.before_round_id),afterLabel=roundLabel(pair.after_round_id);
    var compare = el('div', null, 'card geo-method'); compare.appendChild(el('h3', beforeLabel+' → '+afterLabel+' · 同题对照'));
    compare.appendChild(el('p', '按两轮共同取得实质回答的题目配对。浏览器、登录态或检索环境变化，不能归因于网站改动。', 'note'));
    var rows = table(['平台', beforeLabel+'提及', afterLabel+'提及', beforeLabel+'官网引用', afterLabel+'官网引用', '共同样本']);
    pair.providers.forEach(function (c) {
      var tr = el('tr'); [c.provider_name, metricText(c.metrics.mentions.before), metricText(c.metrics.mentions.after), metricText(c.metrics.site_citations.before), metricText(c.metrics.site_citations.after), c.paired_count ? c.paired_ids.join(', ') : '不可比较'].forEach(function (v) { tr.appendChild(el('td', v)); }); rows.body.appendChild(tr);
    }); compare.appendChild(rows.wrap); root.appendChild(compare);
    var method = el('details', null, 'geo-method'); method.appendChild(el('summary', '这些数据怎样检测、怎样更新？'));
    var list = el('ul');
    ['人工在消费者 AI 网页端，用 D1–D7 固定问题测试，每题独立会话且不提供品牌名；记录正文提及、官网引用与项目引用。', 'B1–B3 明确提供品牌，只检查维护者、模型版本和服务状态，不能当作自然曝光。'].concat(Object.values(data.metric_definitions), data.limitations).forEach(function (text) { list.appendChild(el('li', text)); });
    method.appendChild(list);
    var download = el('a', '下载去隐私化测量快照'); download.href = '/admin/data/geo-observations.json'; download.download = 'jevstyle-geo-observations.json'; method.appendChild(download); root.appendChild(method);
  }
  global.JevDiscovery = {mount: mount};
})(window);
