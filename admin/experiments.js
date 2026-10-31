(function (global) {
  'use strict';
  var BASE='/experiments/banking-routing-v1/results/2026-11-01/';
  function mount(root) {
    if (root.dataset.mounted) return;
    root.dataset.mounted='true';
    function el(tag,text,cls) { var e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e; }
    function pct(n) { return typeof n==='number' && Number.isFinite(n)?(100*n).toFixed(1)+'%':'未测量'; }
    root.replaceChildren(el('p','正在读取已完成的本地实验…','note'));
    return fetch(BASE+'report.json',{cache:'no-cache',credentials:'omit'}).then(function (r) { if(!r.ok)throw new Error();return r.json(); }).then(function (report) {
      if(report.schema_version!==1 || report.experiment_id!=='banking-routing-v1')throw new Error();
      var methods=[['tfidf_logistic','TF-IDF + 逻辑回归'],['jevstyle','JevStyle 0.8B v3 · MLX 8-bit']];
      methods.forEach(function (method) { var d=report.results && report.results[method[0]] && report.results[method[0]].test;if(!d || !Number.isSafeInteger(d.count) || d.count<=0 || !Number.isSafeInteger(d.correct) || d.correct<0 || d.correct>d.count || !d.warm_latency_ms || !Number.isFinite(d.warm_latency_ms.median))throw new Error(); });
      root.replaceChildren();
      var note=el('div',null,'geo-summary');note.appendChild(el('p','六类银行客服请求 · 同一组 240 条独立测试 · Apple M1 Max / 64 GiB · 2026-11-01（悉尼）项目自测'));
      note.appendChild(el('p','传统分类器使用 738 条标注训练；JevStyle 使用选项描述，不做任务微调。开发集另有 120 条。监督条件不同，不能当作通用模型排名。','note'));root.appendChild(note);
      var grid=el('div',null,'grid');
      methods.forEach(function (method) {
        var d=report.results[method[0]].test, card=el('div',null,'card');card.appendChild(el('h3',method[1]));
        card.appendChild(el('div',pct(d.correct/d.count),'v'));card.appendChild(el('p',d.correct+'/'+d.count+' 正确 · warm 中位 '+d.warm_latency_ms.median.toFixed(3)+' ms · p95 '+d.warm_latency_ms.p95.toFixed(3)+' ms','note'));
        var bar=el('div',null,'geo-statusbar');bar.setAttribute('role','img');bar.setAttribute('aria-label','准确率 '+pct(d.correct/d.count)+'；刻度 0% 至 100%');var filled=el('span',null,'geo-substantive');filled.style.width=(100*d.correct/d.count)+'%';bar.appendChild(filled);card.appendChild(bar);card.appendChild(el('p','0% — 100%','note'));grid.appendChild(card);
      });root.appendChild(grid);
      var warning=el('div',null,'card');warning.appendChild(el('h3','回退阈值：开发集目标未保证测试集结果'));
      warning.appendChild(el('p','开发集规则要求接受样本的观察错误率 ≤5%。JevStyle 选出阈值 0，测试时接受 240/240，错误 16/240（6.7%）；不建议直接用于生产自动放行。分类器阈值 0.29，接受 229/240，错误 3/229，另有 11 条交给回退。'));
      warning.appendChild(el('p','只统计本地预测和输出校验；未运行人工或大模型回退，未测完整流程成本、质量、延迟或线上转化。公开数据的预训练重叠未知。','note'));
      var links=el('p');[['完整实验页','/benchmarks/banking-routing/'],['逐条预测',BASE+'predictions.jsonl'],['复现说明','/experiments/banking-routing-v1/README.md'],['原始报告',BASE+'report.json']].forEach(function (item,i) { if(i)links.appendChild(document.createTextNode(' · '));var a=el('a',item[0]);a.href=item[1];links.appendChild(a); });warning.appendChild(links);root.appendChild(warning);
    }).catch(function () { root.replaceChildren(el('p','实验报告暂未取得；没有生成替代数值。请刷新后重试。','note')); });
  }
  global.JevExperiments={mount:mount};
})(window);
