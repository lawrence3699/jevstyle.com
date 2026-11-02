import {useEffect, useState} from 'react';
import type {Run, Translate} from './types';
import {activityState, safeLink, sourceForScene, sourceName} from './presentation';
import {Icon} from './Icon';

export function SearchActivity({run,t,onStop,stale}:{run:Run;t:Translate;onStop:()=>void;stale:boolean}) {
  const state=activityState(run),contact=run.kind==='contacts',imported=run.spec.scene==='import';
  const [expanded,setExpanded]=useState(!state.finished);
  useEffect(()=>{if(state.finished)setExpanded(false);},[state.finished]);
  const source=sourceName(sourceForScene(run.spec.scene));
  const sourceText=imported?t('your list','你的名单'):source==='Website'?t('the team website','团队网站'):source;
  const title=stale&&!state.finished?t('Reconnecting…','正在重新连接…'):
    run.cancel_requested&&!state.finished?t('Stopping…','正在停止…'):
    state.queued?t('Waiting to search…','正在等待搜索…'):
    run.stage==='reconciliation'?t('Results saved · receipt needs review','结果已保留 · 回执待核对'):
    run.state==='failed'?t('Search could not finish','搜索未能完成'):
    run.state==='cancelled'?t('Search stopped','搜索已停止'):
    run.state==='partial'?t('Search partially completed','搜索部分完成'):
    state.finished?(contact?t(`Checked ${state.processed} contacts`,`已核对 ${state.processed} 个联系人`):t(`Searched ${sourceText} · ${state.records.length} source records`,`已检索 ${sourceText} · ${state.records.length} 条资料`)):
    contact?t('Checking work email records…','正在核对工作邮箱…'):
    state.sourceDone?t(`Reviewing profiles · ${state.processed}/${state.total}`,`正在核对资料 · ${state.processed}/${state.total}`):t(`Searching ${sourceText}…`,`正在检索 ${sourceText}…`);
  return <section className={'search-activity '+(!state.finished&&!stale?'is-running':'')} aria-label={t('Search activity','搜索过程')}>
    <div className="activity-top"><button className="activity-toggle" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded} aria-controls={'activity-'+run.id}>
      <span className={'activity-symbol '+(!state.finished&&!stale?'spinning':'')}><Icon name={run.state==='completed'?'check':state.finished?'info':'search'} size={16}/></span><span className={!state.finished&&!stale?'text-shimmer':''}>{title}</span><span className={'chevron '+(expanded?'up':'')}><Icon name="right" size={13}/></span>
    </button>{!state.finished&&<button className="stop-search" onClick={onStop} disabled={run.cancel_requested}><span/>{t('Stop','停止')}</button>}</div>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{title}</span>
    {expanded&&<div id={'activity-'+run.id} className="activity-body">
      <p className="trace-query"><strong>{contact?t('Selected profiles','选中的人物资料'):imported?t('Read your private list','读取你的私有名单'):t('Search query','检索关键词')}</strong>{run.spec.query||run.spec.title||run.spec.website||sourceText}</p>
      <p className="trace-summary">{state.sourceDone?t(`${state.total} profiles returned; ${state.records.length} distinct records attached.`,`已获取 ${state.total} 位候选人，关联 ${state.records.length} 条不重复的资料线索。`):state.finished?t('No candidate profiles were saved.','未获得可保留的人物资料。'):state.queued?t('The search starts when a processing slot is available.','轮到此任务后开始查询。'):t('Waiting for the source to return records…','正在等待来源返回资料…')}</p>
      {state.records.length>0&&<div className="trace-records">{state.records.slice(0,3).map((r,i)=><div key={i}><Icon name="file" size={14}/>{safeLink(r.url)?<a href={safeLink(r.url)} target="_blank" rel="noreferrer">{r.text}</a>:<span>{r.text}</span>}</div>)}{state.records.length>3&&<p>{t(`+ ${state.records.length-3} more records in Sources`,`另有 ${state.records.length-3} 条，可在“来源”中查看`)}</p>}</div>}
      {state.total>0&&<div className="trace-assessment"><p>{contact?t('Work email checks','工作邮箱核对'):t('Requirement assessment','条件核对')}<span>{state.processed} / {state.total}</span></p><progress aria-label={t('Profiles processed','人员处理进度')} value={state.processed} max={state.total}/>{!contact&&run.spec.criteria?.length>0&&<p className="trace-criteria">{run.spec.criteria.map((c:{text:string})=>c.text).join(' · ')}</p>}</div>}
    </div>}
  </section>;
}
