import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activityState, citationNumber, criterionCounts, evidenceRecords, filterPeople, resultGroup, safeLink, summarize} from '../src/presentation.ts';

const person = (id, overrides={}) => ({id, name:id, source:'openalex', role:'', affiliation:'', location:'', evidence:[], evaluation:null, saved:false, ...overrides});
const evaluation = (group, label, coverage=100) => ({group, score:label==='match'?100:null, coverage, items:[{text:'AI experience', label, required:false}]});
const run = (overrides={}) => ({id:'run', kind:'search', state:'running', stage:'scoring', spec:{scene:'research'}, profiles:[], progress:0, ...overrides});

test('queued and failed searches never claim sources or screening completed', () => {
  const waiting=activityState(run({state:'queued',stage:'queued'}));
  assert.equal(waiting.sourceState,'waiting');assert.equal(waiting.screeningState,'waiting');
  const failed=activityState(run({state:'failed',stage:'failed'}));
  assert.equal(failed.sourceDone,false);assert.equal(failed.sourceState,'stopped');assert.equal(failed.screeningState,'stopped');
});
test('progress only counts persisted assessments; incoming profiles remain pending', () => {
  const profiles=[person('one',{evaluation:evaluation('matched','match')}),person('two')];
  const active=run({profiles,progress:99});
  const state=activityState(active);
  assert.equal(state.processed,1);assert.equal(state.percent,50);
  assert.equal(state.counts.pending,1);assert.equal(state.counts.review,0);
  assert.equal(resultGroup(profiles[1],active),'pending');
  const partial=run({profiles,state:'partial',stage:'partial'});
  assert.equal(summarize(partial).counts.review,1);assert.equal(activityState(partial).screeningState,'stopped');
});
test('the same publication shared by authors is counted once; private CSV evidence stays a source record', () => {
  const shared={text:'Shared paper (2025)',url:'https://doi.org/example',kind:'publication'};
  const profiles=[person('one',{evidence:[shared]}),person('two',{evidence:[shared,{text:'',url:'',kind:'public_description'}]}),person('three',{source:'import',evidence:[{...shared,url:''}]})];
  assert.equal(evidenceRecords(profiles).length,2);
  assert.deepEqual(summarize(run({profiles})).sources,[{id:'openalex',count:2},{id:'import',count:1}]);
});
test('email progress does not count existing model judgments as completed contact lookups', () => {
  const profiles=[person('one',{evaluation:evaluation('matched','match')}),person('two',{contact:{email:'work@example.test',status:'unknown'}})];
  const state=activityState(run({kind:'contacts',profiles}));
  assert.equal(state.processed,1);assert.equal(state.percent,50);
});
test('unknown criteria are separate from supported criteria and do not imply confidence', () => {
  const p=person('one',{evaluation:{items:[{label:'match'},{label:'unknown'},{label:'mismatch'}]}});
  assert.deepEqual(criterionCounts(p),{total:3,supported:1,missing:1,contradicted:1});
});
test('result search combines saved/group filters and does not mutate upstream order', () => {
  const profiles=[person('Zoe',{saved:true,evaluation:evaluation('review','unknown')}),person('Ada',{affiliation:'Example Lab',evaluation:evaluation('matched','match')}),person('Ben',{evidence:[{text:'Robotics paper',url:'',kind:'publication'}]})];
  const r=run({profiles,state:'completed'});
  assert.deepEqual(filterPeople(r,'saved','','relevance').map(p=>p.name),['Zoe']);
  assert.deepEqual(filterPeople(r,'all','ROBOTICS','relevance').map(p=>p.name),['Ben']);
  assert.deepEqual(filterPeople(r,'matched','example','name').map(p=>p.name),['Ada']);
  assert.deepEqual(filterPeople(r,'all','','relevance').map(p=>p.name),['Ada','Zoe','Ben']);
  assert.deepEqual(profiles.map(p=>p.name),['Zoe','Ada','Ben']);
});
test('unsafe source URLs cannot become clickable citations', () => {
  for(const url of ['javascript:alert(1)','http://example.test','https://secret@example.test','data:text/html,hi'])assert.equal(safeLink(url),'');
  assert.equal(safeLink('https://example.test/paper'),'https://example.test/paper');
});
test('an empty successful search is different from a source failure', () => {
  const state=activityState(run({state:'completed',stage:'completed'}));
  assert.equal(state.sourceDone,true);assert.equal(state.total,0);assert.equal(state.sourceState,'done');
});
test('answer citations reuse a shared source number across people and remain stable after filtering', () => {
  const first={text:'Shared publication',url:'https://example.test/shared',kind:'publication'};
  const second={text:'Another publication',url:'https://example.test/another',kind:'publication'};
  const a=person('Ada',{evidence:[first,second]}),b=person('Ben',{evidence:[first]});
  assert.equal(citationNumber([a,b],a,first),1);
  assert.equal(citationNumber([a,b],b,first),1);
  assert.equal(citationNumber([a,b],a,second),2);
  const filtered=filterPeople(run({profiles:[a,b]}),'all','Ben','name');
  assert.equal(citationNumber([a,b],filtered[0],first),1);
});
test('an absent or blank source never produces a made-up reference number', () => {
  const p=person('Ada');
  assert.equal(citationNumber([p],p,{text:'Missing',url:'https://example.test',kind:'publication'}),0);
  const blank={text:'',url:'',kind:'public_description'};p.evidence=[blank];
  assert.equal(citationNumber([p],p,blank),0);
});
