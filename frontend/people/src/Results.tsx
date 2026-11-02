import {useState} from 'react';
import type {Person, Run, Translate} from './types';
import {criterionCounts, filterPeople, isFinished, resultGroup, safeLink, sourceName, summarize} from './presentation';
import {Icon} from './Icon';

function statusLabel(group: string, t: Translate) {
  return ({matched: t('Evidence supports a match', '有相关依据'), review: t('Needs review', '待核实'), not_matched: t('Not matched', '不符合'), pending: t('Awaiting assessment', '待判断')}[group] || t('Needs review', '待核实'));
}
function EvidenceCounts({person, t}: {person: Person; t: Translate}) {
  const count = criterionCounts(person);
  if (!count.total) return null;
  return <div className="criterion-counts">
    {!!count.supported && <span className="supported"><Icon name="check" size={13}/>{t(`${count.supported} supported`, `${count.supported} 项有依据`)}</span>}
    {!!count.missing && <span><Icon name="info" size={13}/>{t(`${count.missing} need review`, `${count.missing} 项待核实`)}</span>}
    {!!count.contradicted && <span><Icon name="minus" size={13}/>{t(`${count.contradicted} contradicted`, `${count.contradicted} 项不符合`)}</span>}
  </div>;
}
function ProfileCard({person: p, run, t, selected, canSelect, busy, onSelect, onOpen, onSave}: {
  person: Person; run: Run; t: Translate; selected: boolean; canSelect: boolean; busy: boolean;
  onSelect: (checked: boolean) => void; onOpen: () => void; onSave: () => void;
}) {
  const group = resultGroup(p, run), evidence = p.evidence.filter(e => e.text.trim()), first = evidence[0];
  const publication = p.location_kind === 'publication_affiliation';
  return <article className={'profile-card '+group} aria-label={p.name}>
    <div className="profile-top"><span className="profile-initials" aria-hidden="true">{p.name.split(/\s+/).slice(0,2).map(x => x[0]).join('')}</span><div className="profile-title"><button onClick={onOpen}><h3>{p.name}</h3></button><span>{p.role || (p.source === 'openalex' ? t('Research author', '论文作者') : t('Public profile', '人物资料'))}</span></div><button className={'save-profile '+(p.saved ? 'saved' : '')} aria-pressed={p.saved} aria-label={(p.saved ? t('Unsave ', '取消收藏 ') : t('Save ', '收藏 '))+p.name} title={p.saved ? t('Saved', '已收藏') : t('Save profile', '收藏人物')} disabled={!isFinished(run) || busy} onClick={onSave}><Icon name="bookmark" size={19}/></button></div>
    <div className="profile-facts">{p.affiliation ? <span><Icon name="building" size={14}/><span>{publication && <small>{t('Publication affiliation · ', '论文署名机构 · ')}</small>}{p.affiliation}</span></span> : <span className="unavailable-fact"><Icon name="building" size={14}/>{t('Affiliation not provided', '来源未提供机构')}</span>}{p.location && <span><Icon name="pin" size={14}/>{p.location}{publication ? t(' · institution location', ' · 机构所在地') : ''}</span>}</div>
    <div className="profile-assessment"><span className={'result-status '+group}><Icon name={group === 'matched' ? 'check' : group === 'not_matched' ? 'minus' : 'info'} size={13}/>{statusLabel(group, t)}</span><EvidenceCounts person={p} t={t}/></div>
    <div className="profile-evidence"><span className="evidence-caption"><Icon name={first?.kind === 'publication' ? 'book' : 'file'} size={13}/>{first?.kind === 'publication' ? t('Related publication', '相关论文') : t('Source excerpt', '来源线索')}</span>{first ? <p>{safeLink(first.url) ? <a href={safeLink(first.url)} target="_blank" rel="noreferrer">{first.text}</a> : first.text}</p> : <p className="muted">{t('No descriptive evidence supplied.', '来源没有提供可用的介绍资料。')}</p>}</div>
    <div className="profile-bottom"><span className="profile-source"><span>{sourceName(p.source).slice(0,1)}</span>{p.source === 'import' ? t('Your list', '你的名单') : sourceName(p.source)}<small>· {evidence.length} {t('records', '条线索')}</small></span><button onClick={onOpen}>{t('View details', '查看详情')}<Icon name="right" size={15}/></button></div>
    {canSelect && p.company_domain && !p.contact && <label className="select-contact"><input type="checkbox" checked={selected} disabled={!isFinished(run)} onChange={e => onSelect(e.target.checked)}/>{t('Select for work email lookup', '选中以查询工作邮箱')}</label>}
    {p.contact && <div className="contact-preview">{t('Work email result', '工作邮箱结果')} · {p.contact.status}</div>}
  </article>;
}

export function Results({run, t, selected, onSelect, onOpen, onSave, onExport, onContacts, paidAvailable, busy}: {
  run: Run; t: Translate; selected: string[]; onSelect: (ids: string[]) => void; onOpen: (p: Person) => void;
  onSave: (p: Person) => void; onExport: () => void; onContacts: () => void; paidAvailable: boolean; busy: boolean;
}) {
  const [filter, setFilter] = useState('all'), [query, setQuery] = useState(''), [sort, setSort] = useState('relevance');
  const {counts} = summarize(run), finished = isFinished(run), people = filterPeople(run, filter, query, sort);
  if (!run.profiles.length && !finished) return <div className="result-skeletons" aria-hidden="true">{[0,1].map(i => <div className="skeleton-card" key={i}><div/><span/><span/><span/></div>)}</div>;
  if (!run.profiles.length) return <div className="results-empty"><Icon name="search" size={25}/><h3>{run.state === 'completed' ? t('No profiles found this time', '这次没有找到人物资料') : t('No profiles to show yet', '暂无可展示的人物资料')}</h3><p>{run.state === 'completed' ? t('Try a more specific name, a broader research topic, or upload your own list.', '可以换一个研究主题、输入更具体的姓名，或上传自己的名单。') : t('Check the search status above. You can try another source or upload a list.', '可查看上方搜索状态，或换个来源、上传名单后再试。')}</p></div>;
  const tabs = [['all', t('All', '全部')], ['matched', t('Supported', '有依据')], ['review', t('Review', '待核实')], ['not_matched', t('Not matched', '不符合')], ['saved', t('Saved', '收藏')]];
  return <section className="results-section" aria-label={t('People found', '搜索结果')}>
    <div className="results-intro"><div><h2>{t(`${counts.all} people found`, `找到 ${counts.all} 位候选人`)}</h2><p>{counts.matched > 0 ? t(`${counts.matched} have supporting evidence`, `${counts.matched} 人有相关依据`) : t('Check the available evidence below', '可在下方核对现有资料')}{counts.review > 0 ? t(` · ${counts.review} need review`, ` · ${counts.review} 人待核实`) : ''}{counts.pending > 0 ? t(` · ${counts.pending} still being assessed`, ` · ${counts.pending} 人待判断`) : ''}</p></div><button className="export-results" onClick={onExport} disabled={busy}><Icon name="download" size={16}/>{t('Export', '导出')}</button></div>
    <div className="result-tabs" role="group" aria-label={t('Filter results', '筛选结果')}>{tabs.map(([id, label]) => <button key={id} className={filter === id ? 'active' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}<span>{counts[id]}</span></button>)}</div>
    <div className="result-search-row"><label className="result-search"><Icon name="search" size={15}/><input aria-label={t('Search within results', '在结果中搜索')} placeholder={t('Name, institution or keyword', '搜索姓名、机构或关键词')} value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label={t('Clear result search', '清除结果搜索')}>×</button>}</label><select aria-label={t('Sort results', '结果排序')} value={sort} onChange={e => setSort(e.target.value)}><option value="relevance">{t('Match first', '匹配优先')}</option><option value="name">{t('Name A–Z', '姓名排序')}</option></select></div>
    {selected.length > 0 && paidAvailable && <div className="selection-bar"><span>{t(`${selected.length} selected`, `已选中 ${selected.length} 人`)}</span><button onClick={() => onSelect([])}>{t('Clear', '清除')}</button><button className="button small" disabled={busy || !finished} onClick={onContacts}>{t('Find work emails', '查工作邮箱')}</button></div>}
    {people.length ? <div className="profile-grid">{people.map(p => <ProfileCard key={p.id} person={p} run={run} t={t} selected={selected.includes(p.id)} canSelect={paidAvailable} busy={busy} onSelect={checked => onSelect(checked ? [...selected,p.id] : selected.filter(id => id !== p.id))} onOpen={() => onOpen(p)} onSave={() => onSave(p)}/>)}</div> : <div className="results-empty"><Icon name={filter === 'saved' ? 'bookmark' : 'search'} size={24}/><h3>{filter === 'saved' && !query ? t('Your shortlist starts here', '这里会显示你收藏的人物') : t('No results in this view', '当前筛选下没有结果')}</h3><p>{filter === 'saved' && !query ? t('Save a profile to return to it later.', '点击人物卡片右上角的收藏按钮，即可加入名单。') : t('Try another keyword or clear the filters.', '可以换个关键词，或清除筛选条件。')}</p><button className="button small" onClick={() => {setFilter('all');setQuery('');}}>{t('Show all people', '查看全部候选人')}</button></div>}
  </section>;
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
