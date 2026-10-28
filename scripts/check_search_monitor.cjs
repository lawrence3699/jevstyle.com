'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../admin/search-monitor.js'),'utf8');
function node(tag,text='') {
  return {tagName:tag,textContent:text,children:[],dataset:{},listeners:{},hidden:false,disabled:false,
    append(...items){this.children.push(...items);},appendChild(item){this.children.push(item);return item;},
    replaceChildren(...items){this.children=items;},setAttribute(){},
    addEventListener(name,fn){this.listeners[name]=fn;}};
}
const flush=async()=>{for(let i=0;i<4;i++)await new Promise(setImmediate);};
const payload=(extras={})=>({source:'google_search_console_api',site_url:'https://jevstyle.com/',state:'not_connected',configured:true,connected:false,snapshot:null,...extras});
async function scenario(first) {
  let reply=first;const calls=[],mounted=[],redirects=[],authLost=[],nodes=[],root=node('root');let interval;
  const document={visibilityState:'visible',createElement(tag){const n=node(tag);nodes.push(n);return n;},addEventListener(){}};
  const window={document,location:{assign(url){redirects.push(url);}},confirm(){return true;},
    setInterval(fn){interval=fn;return 1;},clearInterval(){},addEventListener(){},
    JevAdminAuthorizationLost(status){authLost.push(status);},
    JevSearchPerformance:{mount(target,options){target.appendChild(node('p','private chart'));mounted.push({target,options});}}};
  const context=vm.createContext({window,document,Date,Number,String,Boolean,URL,URLSearchParams,JSON,Error,
    async fetch(url,options){
      assert.equal(options.credentials,'include');assert.equal(options.cache,'no-store');
      if(options.method==='POST'){assert.equal(options.headers['Content-Type'],'application/json');assert.equal(options.body,'{}');}
      calls.push({url,options});if(reply==='network')throw new Error('offline');
      if(typeof reply==='number')return{ok:false,status:reply};
      if(reply && reply.httpStatus)return{ok:false,status:reply.httpStatus,json:async()=>({error:reply.error})};
      if(reply==='bad_json')return{ok:true,status:200,json:async()=>{throw new Error('raw private upstream text');}};
      return{ok:true,status:200,json:async()=>reply};
    }});
  vm.runInContext(code,context);window.JevSearchMonitor.mount(root);await flush();
  return{calls,mounted,redirects,authLost,nodes,root,setReply(x){reply=x;},
    async click(text){const b=nodes.find(n=>n.tagName==='button'&&n.textContent===text);assert.ok(b,text);await b.listeners.click();await flush();},
    async poll(){await interval();await flush();}};
}
(async()=>{
  for(const initial of [401,403,500,'network','bad_json',{}]){
    const s=await scenario(initial);assert.equal(s.mounted.length,0);assert.ok(s.nodes.some(n=>/失效|不可用|无法解析|不受支持/.test(n.textContent)));
    assert.ok(!s.nodes.some(n=>/raw private upstream/.test(n.textContent)));
  }
  const empty=await scenario(payload());assert.equal(empty.mounted.length,0);
  empty.setReply({authorization_url:'https://accounts.google.com/o/oauth2/v2/auth?state=synthetic'});await empty.click('连接 Google（只读）');
  assert.equal(empty.redirects.length,1);assert.ok(empty.calls.at(-1).url.endsWith('/connect'));
  const unsafe=await scenario(payload());unsafe.setReply({authorization_url:'https://example.org/collect'});await unsafe.click('连接 Google（只读）');assert.equal(unsafe.redirects.length,0);
  const failedConnect=await scenario(payload());failedConnect.setReply({httpStatus:503,error:'secure_storage_unavailable'});await failedConnect.click('连接 Google（只读）');
  assert.ok(failedConnect.nodes.some(n=>/503 \/ secure_storage_unavailable/.test(n.textContent)));
  failedConnect.setReply(payload());await failedConnect.poll();assert.ok(failedConnect.nodes.some(n=>/secure_storage_unavailable/.test(n.textContent)),'Status poll retains unresolved connect error');
  const hiddenError=await scenario(payload());hiddenError.setReply({httpStatus:503,error:'private-upstream-secret'});await hiddenError.click('连接 Google（只读）');assert.ok(!hiddenError.nodes.some(n=>/private-upstream-secret/.test(n.textContent)));
  const snapshot={observed_at:'2026-10-29T00:00:00Z',datasets:{date:{rows:[]},query:{rows:[]}}};
  const ready=await scenario(payload({state:'ready',connected:true,snapshot,last_success_at:'2026-10-29T00:00:00Z'}));
  assert.equal(ready.mounted.length,1);assert.equal(ready.mounted[0].options.automatic,true);
  await ready.poll();assert.equal(ready.mounted.length,1,'Identical cache does not remount chart/filter state');
  ready.setReply(500);await ready.poll();assert.equal(ready.mounted.length,1,'Load failure retains rendered cache');
  ready.setReply(payload({state:'error',connected:true,snapshot,stale:true,last_success_at:'2026-10-29T00:00:00Z'}));await ready.poll();
  assert.ok(ready.nodes.some(n=>/数据已标为过期/.test(n.textContent)));
  ready.setReply(payload({state:'collecting',connected:true,snapshot}));await ready.click('立即采集');assert.ok(ready.calls.at(-1).url.endsWith('/refresh'));
  ready.setReply(payload());await ready.click('断开连接');assert.ok(ready.calls.at(-1).url.endsWith('/disconnect'));
  const expired=await scenario(payload({state:'ready',connected:true,snapshot}));expired.setReply(401);await expired.poll();assert.equal(expired.mounted[0].target.children.length,0);assert.deepEqual(expired.authLost,[401]);
  console.log('Private search monitor: admin errors, empty/ready/stale states, same-cache retention, readonly connect URL and actions passed. No network used.');
})().catch(e=>{console.error(e);process.exitCode=1;});
