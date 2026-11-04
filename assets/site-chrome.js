/* Navigation menus are plain <details>, so they work without this file.
 * It only closes them on an outside click or Escape, and keeps one open at a time.
 */
(() => {
  'use strict';
  const openMenus = () => document.querySelectorAll('details.sc-dd[open],details.sc-burger[open]');
  document.addEventListener('click', event => {
    openMenus().forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    openMenus().forEach(menu => { menu.open = false; menu.querySelector('summary').focus(); });
  });
  document.addEventListener('toggle', event => {
    if (!event.target.matches?.('details.sc-dd,details.sc-burger') || !event.target.open) return;
    openMenus().forEach(menu => { if (menu !== event.target) menu.open = false; });
  }, true);
})();

/* Language notices. /zh/?from=<path> means that page has no Chinese version yet; ?nozh=1 marks an
 * English page reached from a /zh/ address (404.html redirects there). Both show one line and clean the URL.
 */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const from = params.get('from');
  const safe = value => typeof value === 'string' && /^\/[a-zA-Z0-9_./-]{0,120}$/.test(value) && !value.startsWith('//');
  let notice = null;
  if (location.pathname === '/zh/' && safe(from)) {
    notice = document.createElement('p');
    notice.className = 'sc-notice';
    notice.setAttribute('role', 'status');
    notice.append('该页暂无中文版，先显示中文首页。英文原页：');
    const link = document.createElement('a');
    link.href = from; link.textContent = from;
    notice.append(link);
  } else if (params.get('nozh') === '1') {
    notice = document.createElement('p');
    notice.className = 'sc-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = '该页暂无中文版，已为你打开英文版。';
  }
  if (!notice) return;
  const main = document.querySelector('main');
  if (main) main.prepend(notice); else document.body.prepend(notice);
  params.delete('from'); params.delete('nozh');
  const rest = params.toString();
  history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
})();
