import type {Person, Run} from './types';

export const isFinished = (run: Run) => ['completed', 'partial', 'failed', 'cancelled'].includes(run.state);
export function safeLink(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
}
export const sourceName = (source: string) => ({openalex: 'OpenAlex', wikidata: 'Wikidata', icypeas: 'Icypeas', website: 'Website', import: 'CSV'}[source] || source);
export const sourceForScene = (scene: string) => ({research: 'openalex', person: 'wikidata', business: 'icypeas', website: 'website', import: 'import'}[scene] || '');

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
    (!term || [p.name, p.affiliation, p.role, p.location, ...p.evidence.map(e => e.text)].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) :
      ranks[resultGroup(a, run)] - ranks[resultGroup(b, run)] || (b.evaluation?.score ?? -1) - (a.evaluation?.score ?? -1) ||
      (b.evaluation?.coverage ?? -1) - (a.evaluation?.coverage ?? -1));
}
