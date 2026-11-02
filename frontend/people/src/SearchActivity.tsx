import {useEffect, useState} from 'react';
import type {Run, Translate} from './types';
import {activityState, safeLink, sourceForScene, sourceName} from './presentation';
import {Icon} from './Icon';

export function SearchActivity({run, t, onStop, stale}: {run: Run; t: Translate; onStop: () => void; stale: boolean}) {
  const state = activityState(run);
  const [expanded, setExpanded] = useState(!state.finished);
  useEffect(() => { if (state.finished) setExpanded(false); }, [state.finished]);
  const contact = run.kind === 'contacts', imported = run.spec.scene === 'import';
  const source = sourceName(sourceForScene(run.spec.scene));
  const sourceText = imported ? t('your private CSV', '你的私有名单') : source === 'Website' ? t('the connected team page', '已接入的团队页面') : source;
  const criteria: {text: string}[] = run.spec.criteria || [];
  const title = stale && !state.finished ? t('Reconnecting to search…', '正在重新连接搜索…') :
    run.cancel_requested && !state.finished ? t('Stopping the search…', '正在停止搜索…') :
    state.queued ? t('Search queued', '搜索已加入队列') :
    run.stage === 'reconciliation' ? t('Results saved · receipt needs review', '结果已保留 · 费用回执待核对') :
    run.state === 'failed' ? t('Search could not finish', '搜索未能完成') :
    run.state === 'cancelled' ? t('Search stopped', '搜索已停止') :
    run.state === 'partial' ? t('Partial results saved', '已保留部分结果') :
    state.finished ? t('Search complete', '搜索完成') :
    contact ? t('Checking work emails', '正在核对工作邮箱') :
    state.sourceDone ? t('Checking the evidence', '正在逐项核对资料') :
    imported ? t('Reading your list', '正在读取你的名单') : t(`Searching ${sourceText}`, `正在检索 ${sourceText}`);
  const subtitle = state.sourceDone ? (contact ? t(`${state.processed} / ${state.total} contacts checked`, `已核对 ${state.processed} / ${state.total} 个联系人`) :
    t(`${state.total} people · ${state.records.length} source records · ${state.processed} assessed`, `${state.total} 位候选人 · ${state.records.length} 条资料线索 · 已筛选 ${state.processed} 人`)) :
    state.finished ? t('See the status below for details.', '可查看下方状态说明。') :
    state.queued ? t('Waiting for an available search slot.', '等待处理，进度会自动更新。') :
    t('Retrieving records for your search. Results appear as they arrive.', '正在获取与你的需求相关的资料，返回后会逐步显示。');
  const records = state.records.slice(0, 3);
  return <section className={'search-activity ' + (!state.finished && !stale ? 'is-running' : '')} aria-label={t('Search activity', '搜索过程')}>
    <div className="activity-top">
      <button className="activity-toggle" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={'activity-'+run.id}>
        <span className={'activity-symbol '+(!state.finished && !stale ? 'spinning' : '')}><Icon name={state.finished ? run.state === 'completed' ? 'check' : 'info' : 'search'} size={18}/></span>
        <span className="activity-copy"><strong className={!state.finished && !stale ? 'text-shimmer' : ''}>{title}</strong><small>{subtitle}</small></span>
        <span className={'chevron '+(expanded ? 'up' : '')}><Icon name="chevron" size={16}/></span>
      </button>
      {!state.finished && <button className="stop-search" onClick={onStop} disabled={run.cancel_requested}><span/>{run.cancel_requested ? t('Stopping', '停止中') : t('Stop', '停止')}</button>}
    </div>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{title}. {subtitle}</span>
    {expanded && <div id={'activity-'+run.id} className="activity-body">
      <ol className="activity-timeline">
        <li className={contact ? 'done' : state.sourceState}>
          <span className="timeline-marker"><Icon name={state.sourceDone || contact ? 'check' : 'search'} size={13}/></span>
          <div className="timeline-content"><strong>{contact ? t('Selected profiles', '已选中的人物资料') : imported ? t('Read the private list', '读取私有名单') : t('Find source records', '查询资料来源')}</strong>
            <div className="query-tags"><span><Icon name={imported ? 'book' : 'globe'} size={13}/>{contact ? t('Selected list', '选中名单') : sourceText}</span>{(run.spec.query || run.spec.title || run.spec.website) && <span className="query-tag">{run.spec.query || run.spec.title || run.spec.website}</span>}{run.spec.country && <span>{run.spec.country}</span>}</div>
            <p>{state.sourceDone ? t(`${state.total} candidate profiles returned.`, `已获取 ${state.total} 位候选人的资料。`) : state.finished ? t('No candidate profiles were saved.', '没有保存下来的候选人资料。') : state.queued ? t('This source will be queried when the task starts.', '任务开始后将查询此来源。') : t('Waiting for the source response…', '正在等待资料返回…')}</p>
          </div>
        </li>
        {!contact && <li className={state.sourceDone ? 'done' : state.finished ? 'stopped' : 'waiting'}>
          <span className="timeline-marker"><Icon name={state.sourceDone ? 'check' : 'book'} size={13}/></span>
          <div className="timeline-content"><strong>{t('Collect the available evidence', '汇总已返回的线索')}</strong>
            {state.records.length > 0 ? <><p>{t(`${state.records.length} distinct source records attached to these profiles.`, `这些候选人共关联 ${state.records.length} 条不重复的资料线索。`)}</p><div className="activity-records">{records.map((record, i) => <div className="activity-record" key={record.url+record.text}><Icon name="file" size={14}/>{safeLink(record.url) ? <a href={safeLink(record.url)} target="_blank" rel="noreferrer">{record.text}</a> : <span>{record.text}</span>}<small>{sourceName(record.source)}</small></div>)}</div>{state.records.length > records.length && <small className="more-records">{t(`+ ${state.records.length-records.length} more records in the profile cards`, `另有 ${state.records.length-records.length} 条线索，可在人物卡片中查看`)}</small>}</> : <p>{state.sourceDone ? t('The source did not provide descriptive evidence.', '来源没有提供可用的介绍或研究线索。') : t('Source records will appear here after retrieval.', '查询返回后，这里会列出具体的资料线索。')}</p>}
          </div>
        </li>}
        <li className={state.screeningState}>
          <span className="timeline-marker"><Icon name={state.screeningState === 'done' ? 'check' : 'spark'} size={13}/></span>
          <div className="timeline-content"><strong>{contact ? t('Check work email records', '核对工作邮箱结果') : t('Assess each requirement', '逐项核对筛选条件')}</strong>
            {!contact && <div className="criteria-preview">{criteria.slice(0, 2).map((c, i) => <span key={i}>{c.text}</span>)}{criteria.length > 2 && <span>+{criteria.length-2}</span>}</div>}
            {state.total > 0 ? <><div className="assessment-progress"><span>{t(`${state.processed} of ${state.total} people processed`, `已处理 ${state.processed} / ${state.total} 人`)}</span><span>{state.percent}%</span></div><progress aria-label={t('Profiles processed', '人员处理进度')} value={state.processed} max={state.total}/></> : <p>{state.finished ? t('No profiles were available to assess.', '没有可供判断的人物资料。') : t('Starts after profiles are returned.', '获取候选人后开始判断。')}</p>}
            {!contact && <p className="timeline-footnote">{t('Unsupported requirements stay marked for review.', '资料不足的条件会保留为“待核实”。')}</p>}
          </div>
        </li>
      </ol>
    </div>}
    {!state.finished && <div className={'activity-track '+(stale ? 'paused' : '')} aria-hidden="true"><span/></div>}
  </section>;
}
