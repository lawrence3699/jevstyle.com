'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/service-status.js'), 'utf8');
async function render(mock) {
  const node = {textContent: 'Not checked'};
  const sandbox = {document: {querySelector: () => node}, fetch: mock, Date, AbortController, setTimeout, clearTimeout};
  vm.runInNewContext(source, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  return node.textContent;
}
(async function () {
  const response = body => async () => ({ok:true, json:async () => body});
  assert.match(await render(response({ok:true,inference_ready:true})), /reports inference ready/);
  assert.match(await render(response({ok:true,inference_ready:false})), /reports inference not ready/);
  for (const mock of [response({ok:true}), response({ok:false,inference_ready:true}), async()=>({ok:false}), async()=>{throw Error('network');}, async()=>({ok:true,json:async()=>{throw Error('not JSON');}})]) {
    const text=await render(mock);assert.match(text,/could not be verified/);assert.doesNotMatch(text,/reports inference not ready/);
  }
  console.log('Service status: readiness and unavailable observations remain distinct in seven cases.');
}()).catch(error=>{console.error(error);process.exitCode=1;});
