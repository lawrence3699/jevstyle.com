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
