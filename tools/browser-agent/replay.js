const byId = id => document.getElementById(id);
let report = null, runIndex = 0, stepIndex = 0, timer = null;
const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const time = value => number(value) === null ? '—' : `${(value / 1000).toFixed(2)} s`;
const set = (id, value) => { byId(id).textContent = value ?? '—'; };
const list = value => Array.isArray(value) ? value : [];
const current = () => report?.runs[runIndex];
const track = () => byId('trace-track').value;
const reviewLabel = run => list(run.fallback_models).some(model => /4b/i.test(model)) ? '4B' : 'local model';
const trace = () => list(track() === 'decisions' ? current()?.decisions : current()?.steps);
function stop() { clearInterval(timer); timer = null; set('play', 'Play replay'); }
function error(message) { const el = byId('load-error'); el.textContent = message; el.hidden = !message; }
function loadReport(value) {
  if (!value || value.schema_version !== 1 || !Array.isArray(value.runs) || value.runs.length > 500) throw new Error('Expected a version 1 browser-agent run report.');
  for (const run of value.runs) {
    if (!run || !Array.isArray(run.steps) || run.steps.length > 1000 || list(run.decisions).length > 1000 || !['passed', 'failed', 'blocked', 'skipped'].includes(run.status)) throw new Error('The report contains an invalid run.');
    if (run.status === 'passed' && (run.verification?.passed !== true || !list(run.verification?.checks).length || !run.verification.checks.every(check => check.passed === true))) throw new Error('A passed run must include successful independent outcome checks.');
  }
  stop(); report = value; runIndex = 0; stepIndex = 0;
  const select = byId('run-select'); select.replaceChildren();
  value.runs.forEach((run, index) => { const option = document.createElement('option'); option.value = index; option.textContent = `${run.title || run.id || `Run ${index + 1}`}${run.attempt_label ? ` · ${run.attempt_label}` : ''} · ${run.status}`; select.append(option); });
  select.disabled = !value.runs.length;
  if (!value.runs.length) { const option = document.createElement('option'); option.textContent = 'No runs recorded'; select.append(option); }
  const latest = value.latest_batch ? value.runs.filter(run => run.batch_id === value.latest_batch) : value.runs;
  const passed = latest.filter(run => run.status === 'passed').length;
  const retained = value.runs.length - latest.length;
  set('report-summary', value.runs.length ? `${passed} of ${latest.length} latest recorded runs passed their independent checks.${retained ? ` ${retained} earlier attempts are retained below.` : ''}` : 'No completed run report is available yet. Open a report from your local runner.');
  set('report-date', `Recorded: ${value.generated_at || 'not specified'} · Model: ${value.model || 'see each run'}`);
  const modes = byId('protocol-summary'); modes.replaceChildren();
  for (const id of list(value.comparison_batches)) {
    const batch = value.runs.filter(run => run.batch_id === id);
    if (!batch.length) continue;
    const card = document.createElement('div'); card.className = 'ba-protocol';
    const title = document.createElement('b'); title.textContent = id;
    const count = document.createElement('span'); count.textContent = `${batch.filter(run => run.status === 'passed').length} / ${batch.length} independently verified`;
    const reviewed = batch.some(run => run.all_decisions_reviewed) && batch.every(run => !run.decision_calls || run.all_decisions_reviewed);
    const note = document.createElement('small'); note.textContent = reviewed ? `JevStyle scoring + ${reviewLabel(batch.find(run => run.fallback_models?.length) || batch[0])} review of every step` : batch.some(run => run.hybrid) ? 'JevStyle + conditional local recovery' : 'JevStyle decisions · text helper for field values';
    card.append(title, count, note); modes.append(card);
  }
  const table = byId('run-table-body'); table.replaceChildren();
  for (const run of value.runs) {
    const row = document.createElement('tr');
    for (const value of [run.title || run.id || 'Run', run.attempt_label || 'Recorded run', run.status, time(run.elapsed_ms)]) { const td = document.createElement('td'); td.textContent = value; row.append(td); }
    table.append(row);
  }
  set('report-measurement', value.measurement ? `Decision loop: ${value.measurement.elapsed_ms || 'not specified'}. End to end: ${value.measurement.wall_ms || 'not specified'}.` : 'Timing scope was not supplied in this report.');
  error(''); renderRun();
}
function renderRun() {
  stop(); stepIndex = 0;
  const run = current();
  set('run-goal', run?.goal || 'No recorded run is selected.');
  set('run-status', run?.status || '—'); set('run-time', time(run?.elapsed_ms)); set('run-wall', time(run?.wall_ms));
  set('run-calls', run?.decision_calls ?? run?.steps.length ?? '—');
  set('run-model', run ? `Primary decision model: ${run.model || report.model || 'not recorded'}` : '');
  set('run-helpers', run ? `Text helper: ${run.text_model || 'not recorded'}` : '');
  set('run-mode', run ? ((run.hybrid || run.configured_review_every_step) ? `${run.all_decisions_reviewed ? `JevStyle scoring + ${reviewLabel(run)} review of every step` : run.configured_review_every_step ? 'Every-step review configured' : 'Conditional recovery'} · ${run.fallback_calls ?? 'unknown'} review calls · ${list(run.fallback_models).join(', ') || run.fallback_model || 'no recovery model called'}` : 'JevStyle decisions · Recovery disabled') : '');
  set('run-completion', run ? `Stopped by: ${run.completion_source === 'independent_verifier' ? 'Independent verifier' : run.agent_status === 'done' ? 'Model DONE' : 'Not completed'} · Agent state: ${run.agent_status || 'not recorded'}` : '');
  const checks = byId('run-checks'); checks.replaceChildren();
  for (const check of list(run?.verification?.checks)) {
    const li = document.createElement('li'); li.textContent = `${check.passed === true ? '✓' : '×'} ${check.name || check.label || 'Outcome check'}`; checks.append(li);
  }
  const failure = byId('run-error'); failure.textContent = typeof run?.error === 'string' ? run.error : run?.error ? `${run.error.type || 'Error'}: ${run.error.message || 'No detail recorded.'}` : ''; failure.hidden = !run?.error;
  const slider = byId('scrubber'); slider.max = Math.max(0, trace().length - 1); slider.value = 0;
  renderStep();
}
function bars(id, distribution, selected) {
  const parent = byId(id); parent.replaceChildren();
  const entries = Object.entries(distribution && typeof distribution === 'object' ? distribution : {}).filter(([, v]) => number(v) !== null && v >= 0 && v <= 1).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!entries.length) { const p = document.createElement('p'); p.className = 'ba-note'; p.textContent = 'Not recorded for this step.'; parent.append(p); return; }
  for (const [key, value] of entries) {
    const row = document.createElement('div'); row.className = `ba-bar${key === selected ? ' selected' : ''}`;
    const label = document.createElement('span'); label.className = 'ba-bar-label'; label.textContent = key; label.title = key;
    const track = document.createElement('div'); track.className = 'ba-bar-track';
    const fill = document.createElement('div'); fill.className = 'ba-bar-fill'; fill.style.width = `${value * 100}%`; track.append(fill);
    const score = document.createElement('span'); score.className = 'ba-bar-value'; score.textContent = `${(value * 100).toFixed(1)}%`;
    row.append(label, track, score); parent.append(row);
  }
}
function renderStep() {
  const run = current(), steps = trace(), step = steps[stepIndex];
  byId('play').disabled = steps.length < 2; byId('previous').disabled = !step || stepIndex === 0;
  byId('next').disabled = !step || stepIndex >= steps.length - 1; byId('scrubber').disabled = steps.length < 2;
  byId('scrubber').value = stepIndex;
  set('step-count', step ? `${track() === 'decisions' ? 'Decision' : 'Action'} ${stepIndex + 1} / ${steps.length}` : (track() === 'decisions' ? 'No decisions recorded' : 'No executed steps recorded'));
  set('step-time', step ? time(step.elapsed_ms) : '—');
  set('step-kind', track() === 'decisions' ? 'Model decision · may not have executed' : 'Executed action');
  set('step-operation', step?.operation || '—');
  set('step-label', step?.label || (step ? (track() === 'decisions' ? 'Scores for the observed page' : `Element ${step.target || '—'}`) : 'Inspect the outcome and any error recorded for this run.'));
  const text = byId('step-value'); text.textContent = step?.text ? `Typed: ${step.text}` : ''; text.hidden = !step?.text;
  const confidence = number(step?.confidence);
  set('step-details', step ? `Decision latency ${time(step.latency_ms)}${confidence === null ? '' : ` · JevStyle confidence ${(confidence * 100).toFixed(1)}%`}${step.target ? ` · Target ${step.target}` : ''}` : '');
  set('step-source', step ? (step.decision_source === 'local_fallback' ? `Choice by local generative review${step.fallback_model ? ` (${step.fallback_model})` : ''}. The scores below belong to JevStyle.` : step.decision_source === 'jevstyle' ? 'Choice by JevStyle. The highlighted choice uses the original JevStyle scores.' : 'Original JevStyle scores, when recorded. This earlier report does not include a per-step source label.') : '');
  bars('operation-bars', step?.operation_probabilities, step?.operation);
  bars('target-bars', step?.target_probabilities || step?.probabilities, step?.target);
  const figure = byId('step-image'), img = figure.querySelector('img'); figure.hidden = true; img.removeAttribute('src');
  // Only images shipped under this page can be loaded; imported reports cannot trigger remote requests.
  if (typeof step?.screenshot === 'string' && /^frames\/[a-zA-Z0-9_/-]+\.(png|jpe?g|webp)$/.test(step.screenshot) && !step.screenshot.includes('..')) { img.src = step.screenshot; figure.hidden = false; }
}
byId('trace-track').addEventListener('change', () => { stop(); stepIndex = 0; byId('scrubber').max = Math.max(0, trace().length - 1); renderStep(); });
byId('run-select').addEventListener('change', event => { runIndex = Number(event.target.value); renderRun(); });
byId('scrubber').addEventListener('input', event => { stop(); stepIndex = Number(event.target.value); renderStep(); });
byId('previous').addEventListener('click', () => { stop(); stepIndex = Math.max(0, stepIndex - 1); renderStep(); });
byId('next').addEventListener('click', () => { stop(); stepIndex = Math.min(trace().length - 1, stepIndex + 1); renderStep(); });
byId('play').addEventListener('click', () => {
  if (timer) { stop(); return; }
  if (stepIndex >= trace().length - 1) stepIndex = 0;
  renderStep(); set('play', 'Pause replay');
  timer = setInterval(() => { if (stepIndex >= trace().length - 1) { stop(); return; } stepIndex++; renderStep(); }, 1200);
});
byId('report-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 8 * 1024 * 1024) throw new Error('Choose a report smaller than 8 MB.'); loadReport(JSON.parse(await file.text())); }
  catch (err) { error(`Could not open report: ${err.message}`); }
  event.target.value = '';
});
fetch('./runs.json').then(response => { if (!response.ok) throw new Error('Run report is unavailable.'); return response.json(); }).then(value => { if (!report) loadReport(value); }).catch(err => { if (report) return; const option = document.createElement('option'); option.textContent = 'No report loaded'; byId('run-select').replaceChildren(option); set('report-summary', 'Recorded runs could not be loaded. You can open your own local report.'); error(err.message); });
