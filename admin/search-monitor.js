/* Private admin API adapter. Credentials and raw OAuth responses stay on the server. */
(function (global) {
  'use strict';
  var API = 'https://api.jevstyle.com/control/v1/admin/search-performance';
  var states = {not_connected:'尚未连接 Google',not_configured:'尚未配置',connected:'已连接，等待采集',auth_required:'需要重新授权',ready:'已取得搜索数据',empty:'Google 未返回可用数据',pending_finalization:'Google 数据尚未完成',partial_error:'部分数据采集失败',storage_unavailable:'私有存储暂不可用',error:'采集暂时失败',collecting:'正在采集'};
  function mount(root) {
    if (root.dataset.serverMounted) return;
    root.dataset.serverMounted = 'true';
    function el(tag, text, cls) { var x = document.createElement(tag); if (text != null) x.textContent=text; if (cls) x.className=cls; return x; }
    root.replaceChildren();
    var status = el('div',null,'card'), title=el('h3','Google Search Console · 每日自动采集'), badge=el('span','读取连接状态…','pill');
    status.append(title,badge);
    var message=el('p','正在读取服务端的私有统计。','note'); message.setAttribute('aria-live','polite'); status.appendChild(message);
    var times=el('p',null,'note'), actions=el('div',null,'bar'); status.append(times,actions); root.appendChild(status);
    var connect=el('button','连接 Google（只读）','btn primary'), refresh=el('button','立即采集','btn'), reload=el('button','刷新状态','btn'), disconnect=el('button','断开连接','btn');
    [connect,refresh,reload,disconnect].forEach(function (b) { b.type='button'; actions.appendChild(b); });
    var notice=el('p','首次连接需要管理员在 Google 页面同意只读 Search Console 权限；无需导入 CSV。凭据仅保存在后端，不进入网页源码或 GitHub。','note'); status.appendChild(notice);
    var display=el('div'); root.appendChild(display);
    var current=null, busy=false, renderKey=null;
    var callbackMessages={invalid_state:'授权会话已失效，请重新连接。',access_denied:'Google 授权未获同意。',scope_required:'需要同意 Search Console 只读权限。',offline_access_required:'Google 未提供离线授权，请重新连接并同意权限。',property_access_required:'此 Google 账号没有本站 Search Console 资源的读取权限。',api_not_enabled:'请先在该 Google 项目启用 Search Console API，再重新连接。',oauth_failed:'Google 连接尚未完成，请重新连接或检查后端状态。'};
    var callbackCode=new URLSearchParams(global.location.search||'').get('gsc');
    function time(t) { return t && Number.isFinite(Date.parse(t)) ? new Date(t).toLocaleString('zh-CN',{hour12:false}) : '未发生'; }
    async function request(path, method) {
      var options={credentials:'include',cache:'no-store',method:method||'GET'};
      if (method==='POST') { options.headers={'Content-Type':'application/json'}; options.body='{}'; }
      var res;
      try { res=await fetch(API+(path||''),options); }
      catch (e) { throw new Error('自动采集接口暂不可用，请检查连接后重试。'); }
      if (res.status===401 || res.status===403) {
        display.replaceChildren(); current=null; renderKey=null;
        if (global.JevAdminAuthorizationLost) global.JevAdminAuthorizationLost(res.status);
        throw new Error('管理员会话已失效，请重新登录。');
      }
      if (!res.ok) throw new Error('自动采集接口暂不可用（HTTP '+res.status+'）。未取得的数据不计作零。');
      try { return await res.json(); } catch (e) { throw new Error('自动采集接口的响应无法解析；未显示错误数值。'); }
    }
    function update(d) {
      if (!d || d.source!=='google_search_console_api' || d.site_url!=='https://jevstyle.com/') throw new Error('服务端返回的数据格式不受支持。');
      current=d; badge.textContent=states[d.state]||d.state||'状态未知';
      if (d.stale && d.snapshot) message.textContent='显示上次成功采集的缓存；最近一次采集未成功，数据已标为过期。';
      else if (!d.connected) message.textContent='管理员连接一次 Google 后，后端每 24 小时采集最近 28 天的最终搜索数据。';
      else if (d.state==='ready') message.textContent='已连接。后端定期采集；打开页面会自动读取最新缓存。';
      else if (d.state==='collecting') message.textContent='采集正在后台执行，完成后本页面会更新。';
      else if (d.state==='auth_required') message.textContent='Google 授权已失效，需要重新连接。历史成功数据保留并标记过期。';
      else message.textContent='当前尚无可用新数据。Google 空响应或处理延迟不等于零流量；请查看上次成功时间。';
      if (d.last_error && d.last_error.code) message.textContent+=' 错误代码：'+String(d.last_error.code).slice(0,80)+'。';
      if (callbackMessages[callbackCode] && !d.connected) message.textContent=callbackMessages[callbackCode]+' '+message.textContent;
      times.textContent='上次尝试：'+time(d.last_checked_at)+' · 上次 API 成功响应：'+time(d.last_success_at)+' · 下次计划：'+time(d.next_due_at)+'（本机时区）';
      connect.hidden=Boolean(d.connected && d.state!=='auth_required'); disconnect.hidden=!d.connected; refresh.disabled=!d.connected || d.state==='collecting';
      var key=d.snapshot?JSON.stringify([d.snapshot.observed_at,d.last_success_at]):'none';
      if (key!==renderKey) {
        renderKey=key;
        if (d.snapshot && global.JevSearchPerformance) global.JevSearchPerformance.mount(display,{automatic:true,snapshot:d.snapshot});
        else display.replaceChildren(el('p','搜索图表尚未取得数据。连接完成并采集成功后自动显示。','sp-empty'));
      }
    }
    async function load() {
      if (busy) return;
      try { update(await request('')); }
      catch (e) { badge.textContent='无法读取状态';message.textContent=e.message; }
    }
    async function action(path) {
      if (busy) return;
      busy=true; connect.disabled=refresh.disabled=reload.disabled=disconnect.disabled=true;
      try {
        var d=await request(path,'POST');
        if (path==='/connect') {
          var url=new URL(d.authorization_url);
          if (url.protocol!=='https:' || url.hostname!=='accounts.google.com') throw new Error('Google 授权地址无效。');
          global.location.assign(url.href); return;
        }
        if (d.source==='google_search_console_api') update(d);
        else { busy=false; await load(); }
      } catch (e) { message.textContent=e.message; }
      finally { busy=false; connect.disabled=reload.disabled=disconnect.disabled=false; refresh.disabled=!current || !current.connected || current.state==='collecting'; }
    }
    connect.addEventListener('click',function () { action('/connect'); });
    refresh.addEventListener('click',function () { action('/refresh'); });
    reload.addEventListener('click',load);
    disconnect.addEventListener('click',function () { if (global.confirm('断开本站的 Search Console 自动采集，并删除本集成保存的授权和缓存？Google 站点资源仍保留，之后可重新连接。')) action('/disconnect'); });
    var timer=global.setInterval(function () { if (document.visibilityState==='visible') load(); },60000);
    global.addEventListener('pagehide',function () { global.clearInterval(timer); },{once:true});
    document.addEventListener('visibilitychange',function () { if (document.visibilityState==='visible') load(); });
    load();
  }
  global.JevSearchMonitor={mount:mount};
})(window);
