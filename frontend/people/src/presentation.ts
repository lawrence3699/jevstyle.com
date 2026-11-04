import type {AssessmentItem, Evidence, Person, Run, Translate} from './types';

export const isFinished = (run: Run) => ['completed', 'partial', 'failed', 'cancelled'].includes(run.state);
export function safeLink(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
}
export const sourceName = (source: string) => ({openalex: 'OpenAlex', wikidata: 'Wikidata', icypeas: 'Icypeas', website: 'Website', import: 'CSV', text: 'Pasted profile', orcid: 'ORCID'}[source] || source);
export const sourceForScene = (scene: string) => ({research: 'openalex', person: 'wikidata', business: 'icypeas', website: 'website', import: 'import', text: 'text'}[scene] || '');

export function evidenceRecords(profiles: Person[]) {
  const seen = new Set<string>();
  return profiles.flatMap(person => person.evidence.filter(e => e.text.trim()).map(e => ({...e, source: person.source})))
    .filter(e => {
      const key = [e.source, e.url, e.text.trim()].join('|');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
}
export function resultGroup(person: Person, run: Run) {
  return person.evaluation?.group || (isFinished(run) ? 'review' : 'pending');
}
export function citationNumber(profiles: Person[], person: Person, evidence: Evidence) {
  return evidenceRecords(profiles).findIndex(e=>e.source===person.source&&e.url===evidence.url&&e.text.trim()===evidence.text.trim())+1;
}
export function summarize(run: Run) {
  const counts: Record<string, number> = {all: run.profiles.length, matched: 0, review: 0, not_matched: 0, pending: 0, saved: 0};
  const sources = new Map<string, number>();
  let processed = 0;
  for (const p of run.profiles) {
    counts[resultGroup(p, run)]++;
    if (p.saved) counts.saved++;
    if (run.kind === 'contacts' ? p.contact : p.evaluation) processed++;
    sources.set(p.source, (sources.get(p.source) || 0) + 1);
  }
  return {counts, sources: [...sources].map(([id, count]) => ({id, count})), processed, records: evidenceRecords(run.profiles)};
}
export function activityState(run: Run) {
  const summary = summarize(run), finished = isFinished(run), total = run.profiles.length;
  const sourceDone = total > 0 || run.stage === 'scoring' || run.state === 'completed';
  const queued = run.state === 'queued' || run.stage === 'queued';
  // Counts describe saved results, never a timer or a guessed upstream total.
  return {...summary, finished, total, queued, sourceDone,
    sourceState: sourceDone ? 'done' : finished ? 'stopped' : queued ? 'waiting' : 'active',
    screeningState: run.state === 'completed' && summary.processed === total ? 'done' : finished ? 'stopped' : !queued && sourceDone ? 'active' : 'waiting',
    percent: total ? Math.min(100, Math.round(summary.processed / total * 100)) : 0};
}
export function criterionCounts(person: Person) {
  const items = person.evaluation?.items || [];
  return {total: items.length, supported: items.filter(i => i.label === 'match').length,
    missing: items.filter(i => i.label === 'unknown').length, contradicted: items.filter(i => i.label === 'mismatch').length};
}
export function filterPeople(run: Run, filter: string, query: string, sort: string) {
  const term = query.trim().toLocaleLowerCase(), ranks: Record<string, number> = {matched: 0, review: 1, pending: 2, not_matched: 3};
  return run.profiles.filter(p => (filter === 'all' || (filter === 'saved' ? p.saved : resultGroup(p, run) === filter)) &&
    (!term || [p.name, p.affiliation, p.role, p.location, p.current_affiliation || '', ...(p.topics || []), ...p.evidence.map(e => e.text)].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) :
      sort === 'recent' ? (b.latest_year ?? 0) - (a.latest_year ?? 0) || (b.evaluation?.score ?? -1) - (a.evaluation?.score ?? -1) :
      sort === 'cited' ? (b.cited_by_count ?? -1) - (a.cited_by_count ?? -1) :
      ranks[resultGroup(a, run)] - ranks[resultGroup(b, run)] || (b.evaluation?.score ?? -1) - (a.evaluation?.score ?? -1) ||
      (b.evaluation?.coverage ?? -1) - (a.evaluation?.coverage ?? -1));
}

// --- v3: source facts, scholar stats and outbound links -----------------------------------

/** Items the backend settled from the record itself (years, institution kind, index depth, name). */
export const isStructured = (item: AssessmentItem) => !!item.kind && item.kind !== 'identity' && item.kind !== 'publication_context' && (item.method === 'source_field_match' || item.method === 'normalized_source_name');

export function structuredLabel(item: AssessmentItem, t: Translate) {
  const years = /last (\d+) years/.exec(item.text)?.[1] || '3';
  switch (item.kind) {
    case 'recency': return t(`Published in the last ${years} years`, `近 ${years} 年有发表`) + (item.value ? ` (${item.value})` : '');
    case 'institution': return t('At a university or research institute', '在高校 / 研究所') + (typeof item.value === 'string' && item.value ? ` (${item.value})` : '');
    case 'depth': return t('Several relevant publications found', '索引中有多篇相关论文') + (typeof item.value === 'number' ? ` (${item.value})` : '');
    case 'name': return t('Name matches the source record', '姓名与来源记录一致');
    case 'identity': return t('Shared name needs more criteria', '同名需补充条件区分');
    case 'publication_context': return t('Scholarly context not yet confirmed', '学术背景尚未独立确认');
    default: return item.text;
  }
}
export const labelMark = (label: string) => label === 'match' ? '✓' : label === 'mismatch' ? '✕' : '?';

const num = (n: number | null | undefined) => typeof n === 'number' ? n.toLocaleString('en-US') : '';
export function scholarStats(p: Person, t: Translate) {
  const parts: string[] = [];
  if (typeof p.works_count === 'number') parts.push(t(`${num(p.works_count)} works`, `论文 ${num(p.works_count)}`));
  if (typeof p.cited_by_count === 'number') parts.push(t(`${num(p.cited_by_count)} citations`, `被引 ${num(p.cited_by_count)}`));
  if (typeof p.h_index === 'number') parts.push(`h-index ${p.h_index}`);
  if (p.first_year && p.latest_year) parts.push(t(`active ${p.first_year}–${p.latest_year}`, `活跃 ${p.first_year}–${p.latest_year}`));
  else if (p.latest_year) parts.push(t(`latest record ${p.latest_year}`, `最近记录 ${p.latest_year}`));
  return parts;
}
export function affiliationLine(p: Person, t: Translate) {
  if (p.current_affiliation) {
    const country = p.current_affiliation_country ? ' · ' + p.current_affiliation_country : '';
    return {label: t('Latest institution (source record)', '最近机构（来源记录）'), value: p.current_affiliation + country, kind: 'current' as const};
  }
  if (p.affiliation) {
    const label = p.location_kind === 'publication_affiliation' ? t('Publication affiliation', '论文署名机构') : t('Company / institution', '公司 / 机构');
    return {label, value: p.affiliation + (p.location ? ' · ' + p.location : ''), kind: 'record' as const};
  }
  return null;
}
/** Outbound links: the source records plus plain search links. Nothing is fetched for these. */
export function scholarLinks(p: Person) {
  const links: {id: string; label: string; url: string}[] = [];
  const add = (id: string, label: string, url: string) => { const safe = safeLink(url); if (safe && !links.some(l => l.url === safe)) links.push({id, label, url: safe}); };
  if (p.source === 'wikidata') add('wikidata', 'Wikidata', p.url);
  if (p.source === 'openalex') add('openalex', 'OpenAlex', p.url);
  if (p.openalex_url) add('openalex', 'OpenAlex', p.openalex_url);
  if (p.orcid) add('orcid', 'ORCID', p.orcid);
  if (p.source !== 'import' && p.source !== 'text' && p.name) {
    const q = encodeURIComponent('"' + p.name + '"' + (p.current_affiliation ? ' ' + p.current_affiliation : ''));
    add('scholar', 'Google Scholar', 'https://scholar.google.com/scholar?q=' + q);
    add('web', 'Web search', 'https://duckduckgo.com/?q=' + q);
  }
  return links;
}
export function criteriaLines(text: string) {
  return text.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);
}
