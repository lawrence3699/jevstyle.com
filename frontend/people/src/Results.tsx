import {useEffect, useRef, useState} from 'react';
import type {Person, Run, Translate} from './types';
import {citationNumber, criterionCounts, filterPeople, isFinished, resultGroup, safeLink, sourceName, summarize} from './presentation';
import {Icon} from './Icon';

function statusLabel(group: string, t: Translate) {
  return ({matched:t('Supported by the source material','有相关资料支持'), review:t('More evidence is needed','现有资料不足'), not_matched:t('Does not meet the criteria','不符合筛选条件'), pending:t('Assessment in progress','正在核对资料')}[group] || t('Needs review','待核实'));
}
function EvidenceCounts({person, t}: {person:Person; t:Translate}) {
  const n=criterionCounts(person);
  return <span className="criterion-counts">{[
    n.supported ? t(`${n.supported} supported`,`${n.supported} 项有依据`) : '',
    n.missing ? t(`${n.missing} need review`,`${n.missing} 项待核实`) : '',
    n.contradicted ? t(`${n.contradicted} contradicted`,`${n.contradicted} 项不符合`) : ''
  ].filter(Boolean).join(' · ')}</span>;
}
function PersonAnswer({person:p, run, t, number, selected, canSelect, busy, onSelect, onOpen, onSave, onCite}: {
  person:Person; run:Run; t:Translate; number:number; selected:boolean; canSelect:boolean; busy:boolean;
  onSelect:(checked:boolean)=>void; onOpen:()=>void; onSave:()=>void; onCite:(index:number)=>void;
}) {
  const first=p.evidence.find(e=>e.text.trim()), group=resultGroup(p,run);
  const citation=first ? citationNumber(run.profiles,p,first) : 0;
  const item=p.evaluation?.items.length===1 ? p.evaluation.items[0] : null;
  return <article className="answer-person" aria-label={p.name}>
    <div className="answer-person-heading"><h3>{number}. <button onClick={onOpen}>{p.name}</button></h3><button className={'answer-save '+(p.saved?'saved':'')} onClick={onSave} disabled={!isFinished(run)||busy} aria-pressed={p.saved} aria-label={(p.saved?t('Unsave ','取消收藏 '):t('Save ','收藏 '))+p.name} title={p.saved?t('Saved','已收藏'):t('Save person','收藏人物')}><Icon name="bookmark" size={18}/></button></div>
    {first ? <p className="answer-evidence">{first.kind==='publication'?<><strong>{t('Related work: ','相关论文：')}</strong><em>{first.text}</em></>:<>{first.text}</>}{citation>0&&<> <button className="inline-citation" onClick={()=>onCite(citation)} aria-label={t(`Source ${citation} for ${p.name}`,`查看 ${p.name} 的来源 ${citation}`)} title={first.text}>{p.source==='import'?t('Your list','你的名单'):sourceName(p.source)}<span>{citation}</span></button></>}</p>:<p>{t('The source has no descriptive information. Open the profile to check the original record.','来源没有提供详细介绍，可以点击姓名查看原始资料。')}</p>}
    <ul className="answer-facts">
      {p.role&&<li><strong>{t('Role: ','职位：')}</strong>{p.role}</li>}
      {p.affiliation&&<li><strong>{p.location_kind==='publication_affiliation'?t('Publication affiliation: ','论文署名机构：'):t('Company / institution: ','公司 / 机构：')}</strong>{p.affiliation}{p.location?' · '+p.location:''}</li>}
      {!p.affiliation&&p.location&&<li><strong>{p.location_kind==='publication_affiliation'?t('Institution location: ','机构所在地：'):t('Location in source: ','资料中的所在地：')}</strong>{p.location}</li>}
      <li><strong>{t('Assessment: ','条件核对：')}</strong>{item ? <>“{item.text}”{t(' — ','：')}{item.label==='match'?t('supported by the available evidence.','有相关资料支持。'):item.label==='mismatch'?t('the available evidence indicates a mismatch.','现有资料显示不符合。'):t('not enough evidence to confirm.','现有资料不足，需进一步核实。')}</>:p.evaluation?<EvidenceCounts person={p} t={t}/>:statusLabel(group,t)}</li>
    </ul>
    {canSelect&&p.company_domain&&!p.contact&&<label className="answer-select"><input type="checkbox" checked={selected} disabled={!isFinished(run)} onChange={e=>onSelect(e.target.checked)}/>{t('Select for work email lookup','选中以查询工作邮箱')}</label>}
    {p.contact&&<p className="answer-contact"><strong>{t('Work email: ','工作邮箱：')}</strong>{p.contact.email||t('Not found','未找到')} <span>({p.contact.status})</span></p>}
  </article>;
}

export function Results({run,t,selected,onSelect,onOpen,onSave,onExport,onContacts,onSources,paidAvailable,busy}: {
  run:Run; t:Translate; selected:string[]; onSelect:(ids:string[])=>void; onOpen:(p:Person)=>void;
  onSave:(p:Person)=>void; onExport:()=>void; onContacts:()=>void; onSources:(index?:number)=>void; paidAvailable:boolean; busy:boolean;
}) {
  const [filter,setFilter]=useState('all'),[query,setQuery]=useState(''),[sort,setSort]=useState('relevance');
  const [expanded,setExpanded]=useState(false),[controls,setControls]=useState(false),[copyStatus,setCopyStatus]=useState('');
  const answerRef=useRef<HTMLDivElement>(null),controlsRef=useRef<HTMLDivElement>(null);
  const {counts,records,processed}=summarize(run),finished=isFinished(run);
  const people=filterPeople(run,filter,query,sort),visible=expanded||filter!=='all'||query.trim()?people:people.slice(0,5);
  useEffect(()=>{if(controls)controlsRef.current?.scrollIntoView({block:'nearest'});},[controls]);
  useEffect(()=>{if(!copyStatus)return;const timer=window.setTimeout(()=>setCopyStatus(''),2500);return()=>clearTimeout(timer);},[copyStatus]);
  const copy=async()=>{try{const references=records.map((r,i)=>`[${i+1}] ${r.text}${safeLink(r.url)?' — '+safeLink(r.url):''}`).join('\n');await navigator.clipboard.writeText((answerRef.current?.innerText||'')+(references?'\n\n'+t('Sources','来源')+'\n'+references:''));setCopyStatus('copied');}catch{setCopyStatus('failed');}};
  if(!run.profiles.length&&!finished)return null;
  if(!run.profiles.length)return <section className="chat-answer" aria-label={t('Search answer','搜索回答')}><p>{run.state==='completed'?t('I didn’t find any profiles for this search. Try a broader research topic, a more specific name, or upload your own list.','这次没有找到符合搜索条件的人物资料。可以试试更宽泛的研究主题、更具体的姓名，或上传自己的名单。'):t('This search ended before any profiles were available. You can check the search status above and try again.','这次搜索在获取到人物资料前结束了。可以展开上方的搜索过程查看状态，再重新尝试。')}</p></section>;
  return <section className="chat-answer" aria-label={t('Search answer','搜索回答')}>
    <div ref={answerRef}>
      <p className="answer-lead">{t('I found ','这次检索找到了 ')}<strong>{counts.all} {t('candidate profiles','位候选人')}</strong>{t(' and organized them by the available evidence.','，已按现有资料的匹配情况整理如下。')}{counts.review>0&&<> {t(`${counts.review} still need further verification.`, `其中 ${counts.review} 位仍需进一步核实。`)}</>}{!finished&&<> {t(`Assessment is continuing (${processed}/${counts.all}).`,`资料核对仍在进行（${processed}/${counts.all}）。`)}</>}</p>
      {(filter!=='all'||query.trim())&&<p className="answer-context">{t(`The current filter shows ${people.length} people.`, `当前筛选显示 ${people.length} 位候选人。`)}{filter==='saved'&&t(' Only saved profiles are shown.',' 仅显示已收藏的人物。')} <button className="clear-answer-filter" onClick={()=>{setFilter('all');setQuery('');}}>{t('Show all','显示全部')}</button></p>}
      {people.length>visible.length&&<p className="answer-context">{t(`Here are the first ${visible.length}. You can expand the rest below.`,`先展示其中 ${visible.length} 位，其余结果可在下方展开。`)}</p>}
      {people.length===0?<p className="answer-no-match">{filter==='saved'?t('No saved people in this view yet. Use the bookmark beside a name to save a profile.','这里还没有收藏的人物。点击姓名旁的收藏图标即可加入名单。'):t('No profiles match the current filter. Try another keyword or clear the filters below.','当前筛选下没有结果，可以换个关键词，或清除下方的筛选条件。')}</p>:<div className="answer-people">{visible.map((p,i)=><PersonAnswer key={p.id} person={p} run={run} t={t} number={i+1} selected={selected.includes(p.id)} canSelect={paidAvailable} busy={busy} onSelect={checked=>onSelect(checked?[...selected,p.id]:selected.filter(id=>id!==p.id))} onOpen={()=>onOpen(p)} onSave={()=>onSave(p)} onCite={onSources}/>)}</div>}
      {run.profiles.some(p=>p.location_kind==='publication_affiliation')&&<p className="answer-note">{t('Affiliations above come from publication records and may not reflect current positions.','上面的机构信息来自论文署名，可能与当前任职不同。')}</p>}
    </div>
    {people.length>visible.length&&<button className="expand-answer" onClick={()=>setExpanded(true)}>{t(`Show the remaining ${people.length-visible.length} people`,`展开其余 ${people.length-visible.length} 位候选人`)}<Icon name="chevron" size={15}/></button>}
    <div className="answer-actions" role="group" aria-label={t('Answer actions','回答操作')}>
      <button className="answer-action-icon" onClick={copy} aria-label={t('Copy this answer','复制当前回答')} title={t('Copy answer','复制回答')}><Icon name={copyStatus==='copied'?'check':'copy'} size={18}/></button>
      <button className="answer-action-icon" onClick={onExport} disabled={busy} aria-label={t('Export all results as CSV','导出全部结果为 CSV')} title={t('Export all results as CSV','导出全部结果为 CSV')}><Icon name="download" size={18}/></button>
      <button className={'answer-action-icon '+(controls?'chosen':'')} onClick={()=>setControls(!controls)} aria-expanded={controls} aria-controls={'result-filters-'+run.id} aria-label={t('Filter results','筛选结果')} title={t('Filter results','筛选结果')}><Icon name="settings" size={18}/></button>
      {records.length>0&&<button className="answer-sources-button" onClick={()=>onSources()}><span className="source-stack" aria-hidden="true"><Icon name="globe" size={14}/></span>{t('Sources','来源')}<span>{records.length}</span></button>}
      {copyStatus&&<span className="copy-status" role="status">{copyStatus==='copied'?t('Copied','已复制'):t('Copy unavailable. Select the text to copy.','复制失败，可选中文字后复制。')}</span>}
    </div>
    {controls&&<div className="answer-controls" id={'result-filters-'+run.id} ref={controlsRef}>
      <div className="answer-control-heading"><strong>{t('Refine these results','筛选这份名单')}</strong><button onClick={()=>setControls(false)} aria-label={t('Close result filters','收起结果筛选')}>×</button></div>
      <label className="answer-filter-search"><Icon name="search" size={16}/><input aria-label={t('Search within results','在结果中搜索')} placeholder={t('Name, institution or keyword','姓名、机构或关键词')} value={query} onChange={e=>setQuery(e.target.value)}/></label>
      <div className="answer-filter-options"><select aria-label={t('Result group','结果分组')} value={filter} onChange={e=>setFilter(e.target.value)}>{[['all',t('All','全部')],['matched',t('Supported','有依据')],['review',t('Needs review','待核实')],['not_matched',t('Not matched','不符合')],['saved',t('Saved','收藏')]].map(([id,label])=><option value={id} key={id}>{label} ({counts[id]})</option>)}</select><select aria-label={t('Sort results','结果排序')} value={sort} onChange={e=>setSort(e.target.value)}><option value="relevance">{t('Match first','匹配优先')}</option><option value="name">{t('Name A–Z','姓名排序')}</option></select>{(query||filter!=='all')&&<button onClick={()=>{setQuery('');setFilter('all');}}>{t('Clear','清除筛选')}</button>}</div>
    </div>}
    {selected.length>0&&paidAvailable&&<div className="answer-selection"><span>{t(`${selected.length} people selected`, `已选中 ${selected.length} 人`)}</span><button onClick={()=>onSelect([])}>{t('Clear','清除')}</button><button className="button small" disabled={busy||!finished} onClick={onContacts}>{t('Find work emails','查工作邮箱')}</button></div>}
  </section>;
}

export function SourcesDrawer({run,t,selected,onClose}:{run:Run;t:Translate;selected:number;onClose:()=>void}) {
  const records=summarize(run).records,active=useRef<HTMLLIElement>(null);
  useEffect(()=>{active.current?.scrollIntoView({block:'nearest'});},[selected]);
  return <div className="overlay source-overlay" onClick={onClose}><section className="drawer sources-drawer" role="dialog" aria-modal="true" aria-label={t('Sources','来源')} onClick={e=>e.stopPropagation()}><header><h2>{t('Sources','来源')}</h2><button className="close" onClick={onClose} aria-label={t('Close sources','关闭来源')}>×</button></header><p className="sources-intro">{t(`${records.length} source records attached to this search.`,`这次搜索关联了 ${records.length} 条资料线索。`)}</p><ol className="citation-list">{records.map((r,i)=><li key={i} className={selected===i+1?'selected':''} ref={selected===i+1?active:undefined}><span className="citation-index">{i+1}</span><div><small>{r.source==='import'?t('Your private list','你的私有名单'):sourceName(r.source)}</small><p>{safeLink(r.url)?<a href={safeLink(r.url)} target="_blank" rel="noreferrer">{r.text}<Icon name="external" size={13}/></a>:r.text}</p>{safeLink(r.url)&&<span className="citation-host">{new URL(safeLink(r.url)).hostname}</span>}</div></li>)}</ol></section></div>;
}

export function ProfileDetail({person: p, t, onClose, onSave, canSave}: {person: Person; t: Translate; onClose: () => void; onSave: () => void; canSave: boolean}) {
  const group = p.evaluation?.group || 'review', evidence = p.evidence.filter(e => e.text.trim());
  const date = (value: string) => new Date(value).toLocaleDateString();
  return <div className="overlay" onClick={onClose}><section className="drawer profile-drawer" role="dialog" aria-modal="true" aria-label={p.name} onClick={e => e.stopPropagation()}>
    <button className="close" aria-label={t('Close details', '关闭详情')} onClick={onClose}>×</button>
    <div className="detail-source"><Icon name="globe" size={14}/>{p.source === 'import' ? t('Your private list', '你的私有名单') : sourceName(p.source)}</div><h2>{p.name}</h2>{p.role && <p className="detail-role">{p.role}</p>}
    <dl className="detail-facts"><div><dt>{p.location_kind === 'publication_affiliation' ? t('Publication affiliation', '论文署名机构') : t('Company / institution', '公司 / 机构')}</dt><dd>{p.affiliation || t('Not provided', '未提供')}</dd></div><div><dt>{p.location_kind === 'publication_affiliation' ? t('Institution location', '机构所在地') : t('Location in source', '资料中的所在地')}</dt><dd>{p.location || t('Not provided', '未提供')}</dd></div></dl>
    {p.location_kind === 'publication_affiliation' && <p className="provenance-note">{t('Publication affiliations describe the cited work, and may not reflect a current position.', '机构信息来自论文署名，可能与当前任职不同。')}</p>}
    <div className="detail-actions">{safeLink(p.url) && <a className="button small" href={safeLink(p.url)} target="_blank" rel="noreferrer">{t('Source profile', '来源主页')}<Icon name="external" size={14}/></a>}<button className="button small" onClick={onSave} disabled={!canSave} aria-pressed={p.saved}><Icon name="bookmark" size={14}/>{p.saved ? t('Saved', '已收藏') : t('Save profile', '收藏人物')}</button></div>
    <div className="detail-assessment"><span className={'result-status '+group}>{statusLabel(group,t)}</span><EvidenceCounts person={p} t={t}/></div>
    <h3 className="detail-section-title">{t('Requirement assessment', '条件核对')}</h3>{p.evaluation?.items.map((item,i) => <div className={'detail-criterion '+item.label} key={i}><span><Icon name={item.label === 'match' ? 'check' : item.label === 'mismatch' ? 'minus' : 'info'} size={15}/></span><div><strong>{item.text}</strong><p>{item.label === 'match' ? t('The supplied evidence supports this requirement.', '现有资料支持这项条件。') : item.label === 'mismatch' ? t('The supplied evidence indicates a mismatch.', '现有资料显示不符合这项条件。') : t('The source does not provide enough evidence.', '现有资料不足，需要进一步核实。')}{item.required ? t(' Required.', ' 必须满足。') : ''}</p></div></div>) || <p className="hint">{t('Not assessed yet. You can review the sources below.', '尚未完成判断，可以先查看下方来源资料。')}</p>}
    <h3 className="detail-section-title">{t('Source records', '来源资料')}<span>{evidence.length}</span></h3>{evidence.length ? evidence.map((e,i) => <article className="source-record" key={i}><span className="source-record-number">{String(i+1).padStart(2,'0')}</span><div><span className="source-kind">{e.kind === 'publication' ? t('Publication', '论文') : e.kind === 'user_supplied' ? t('Imported record', '导入资料') : t('Public description', '公开介绍')}</span><p>{e.text}</p>{safeLink(e.url) && <a href={safeLink(e.url)} target="_blank" rel="noreferrer">{t('Read original', '查看原文')}<Icon name="external" size={12}/></a>}</div></article>) : <p className="hint">{t('No descriptive records were provided.', '来源没有提供介绍资料。')}</p>}
    {p.contact && <div className="evidence"><strong>{t('Work email', '工作邮箱')}</strong><p>{p.contact.email || '—'}</p><span className="badge">{p.contact.status}</span><small>{t('Deliverability does not confirm identity.', '可投递性不等于身份已核实。')}</small></div>}
    <p className="detail-timestamp">{t('Retrieved ', '获取时间：')}{date(p.fetched_at)}{p.source_updated_at ? ' · '+t('Source updated ', '来源更新：')+date(p.source_updated_at) : ''}</p>
  </section></div>;
}
