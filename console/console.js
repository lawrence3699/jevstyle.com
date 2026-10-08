/* JevStyle Console. Same-origin script; talks only to the configured API origin.
   Secrets (new keys, the Playground key) live in this page's memory/DOM only — never in storage.
   Storage holds only view preferences: theme, collapsed sidebar, hidden "Get started" card. */
(function () {
  "use strict";
  var ORIGIN = "https://api.jevstyle.com";
  var CONTROL = ORIGIN + "/control/v1";
  var INFERENCE = ORIGIN + "/v1/systemone";
  var THEME_KEY = "jev-api-theme";
  var SIDEBAR_KEY = "jev-console-sidebar";
  var START_KEY = "jev-console-start";
  var PAGES = ["overview", "playground", "keys", "usage", "limits"];
  var TITLES = { overview: "Overview", playground: "Playground", keys: "API keys", usage: "Usage", limits: "Limits & models" };
  var SERIES = ["var(--s1)", "var(--s2)", "var(--s3)"];
  var REVOKED_SERIES = "var(--s0)";
  var MAX_QUESTIONS = 64;
  var MODEL_NAME = "jev-style-decision-v3";

  var state = {
    me: null, verified: false, keys: [], allKeys: [], keysLoaded: false, maxKeys: 3, showRevoked: false,
    usage: null, daily: null, days: 30, usageKey: "", history: null, historyLoaded: false,
    creating: false, renameId: null, revokeId: null, running: false, signedOut: false
  };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function notice(node, text, kind) {
    node.textContent = text || "";
    node.className = "notice" + (kind ? " " + kind : "");
    node.hidden = !text;
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  var root = document.documentElement;

  /* ---------- Theme (stored: the theme preference) ---------- */
  function currentTheme() { try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; } }
  function applyTheme(t) {
    t = t === "light" || t === "dark" ? t : "system";
    if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-set") === t));
    });
  }
  applyTheme(currentTheme());
  document.querySelectorAll("[data-theme-set]").forEach(function (b) {
    b.addEventListener("click", function () { applyTheme(b.getAttribute("data-theme-set")); });
  });

  /* ---------- Sidebar (stored: collapsed or not) ---------- */
  function applySidebar(collapsed) {
    if (collapsed) root.setAttribute("data-sidebar", "collapsed"); else root.removeAttribute("data-sidebar");
    var btn = $("sb-toggle");
    var label = collapsed ? "Expand sidebar" : "Collapse sidebar";
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }
  applySidebar(root.getAttribute("data-sidebar") === "collapsed");
  $("sb-toggle").onclick = function () {
    var collapsed = root.getAttribute("data-sidebar") !== "collapsed";
    applySidebar(collapsed);
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded"); } catch (e) {}
    requestAnimationFrame(function () { if (state.daily && !$("chart").hidden) renderChart(); });
  };

  /* ---------- Account menu ---------- */
  var acctBtn = $("acct-btn");
  var acctMenu = $("acct-menu");
  function setMenu(open) {
    acctMenu.hidden = !open;
    acctBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      var first = acctMenu.querySelector("button:not([hidden]), a");
      if (first) first.focus();
    }
  }
  acctBtn.addEventListener("click", function (ev) { ev.stopPropagation(); setMenu(acctMenu.hidden); });
  document.addEventListener("click", function (ev) {
    if (!acctMenu.hidden && !acctMenu.contains(ev.target)) setMenu(false);
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && !acctMenu.hidden) { setMenu(false); acctBtn.focus(); }
  });
  acctMenu.addEventListener("focusout", function (ev) {
    if (ev.relatedTarget && !acctMenu.contains(ev.relatedTarget) && ev.relatedTarget !== acctBtn) setMenu(false);
  });

  /* ---------- Formatting ---------- */
  var numberFmt = new Intl.NumberFormat("en-US");
  var dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  var fullFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
  var timeFmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  var dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  var dayLongFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  function fmtInt(n) { return numberFmt.format(Number(n) || 0); }
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? "—" : dateFmt.format(d); }
  function fmtFull(iso) { var d = new Date(iso); return isNaN(d) ? "" : fullFmt.format(d); }
  function plural(n, word) { return n + " " + word + (n === 1 ? "" : "s"); }
  function relTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    var s = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (s < 45) return "Just now";
    if (s < 3600) return plural(Math.max(1, Math.round(s / 60)), "minute") + " ago";
    if (s < 86400) return plural(Math.round(s / 3600), "hour") + " ago";
    if (s < 172800) return "Yesterday";
    if (s < 30 * 86400) return Math.floor(s / 86400) + " days ago";
    return fmtDate(iso);
  }
  function countdown(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    if (m < 1) return "less than a minute";
    var h = Math.floor(m / 60);
    return h ? h + "h " + (m % 60) + "m" : m + "m";
  }
  function nextUtcMidnight() {
    var now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  }
  function resetText(iso) {
    var at = iso ? new Date(iso) : nextUtcMidnight();
    if (isNaN(at)) at = nextUtcMidnight();
    return "Resets in " + countdown(at.getTime() - Date.now()) + ", at " + timeFmt.format(at) + " local (00:00 UTC)";
  }
  function pct(p) { return (Math.round(Number(p) * 1000) / 10).toFixed(1) + "%"; }
  function maskKey(prefix) { return String(prefix || "jev_").slice(0, 8) + "…"; }
  function keyName(k) { return (k && k.name) || "Secret key"; }
  function timeNode(iso, text) {
    var t = el("time", null, text);
    t.dateTime = iso;
    t.title = fmtFull(iso);
    return t;
  }

  /* ---------- API ---------- */
  async function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || "GET", credentials: "include", headers: {}, cache: "no-store" };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    var res = await fetch(CONTROL + path, init);
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401 && path !== "/auth/me" && state.me) showGate("expired");
    return { ok: res.ok, status: res.status, data: data };
  }
  function errorText(r, fallback) {
    return (r && r.data && typeof r.data.message === "string" && r.data.message) || fallback;
  }

  /* ---------- Gate / routing ---------- */
  function showGate(kind) {
    var gate = $("gate");
    state.signedOut = true;
    var title = "Sign in to the console";
    var body = "Manage API keys, try requests in the Playground and track your usage.";
    if (kind === "expired") { title = "Your session has ended"; body = "Log in again to keep managing your API keys."; }
    if (kind === "offline") { title = "Can't reach JevStyle right now"; body = "Check your connection, then try again. Your keys keep working while this page is unavailable."; }
    gate.innerHTML = "";
    gate.appendChild(el("h2", null, title));
    gate.appendChild(el("p", null, body));
    var actions = el("div", "gate-actions");
    if (kind === "offline") {
      var retry = el("button", "btn primary", "Try again");
      retry.type = "button";
      retry.onclick = function () { location.reload(); };
      actions.appendChild(retry);
    } else {
      var login = el("a", "btn primary", "Log in");
      login.href = "/login/";
      var register = el("a", "btn", "Create account");
      register.href = "/register/";
      actions.appendChild(login);
      actions.appendChild(register);
    }
    gate.appendChild(actions);
    gate.hidden = false;
    $("verify-banner").hidden = true;
    document.querySelectorAll("[data-view]").forEach(function (v) { v.hidden = true; });
    setAccount(kind === "offline" ? "Offline" : "Not signed in", "");
    $("logout-btn").hidden = kind !== "expired";
    closeDialogs();
  }

  function currentPage() {
    var h = location.hash.replace(/^#/, "");
    return PAGES.indexOf(h) >= 0 ? h : "overview";
  }
  function showPage(fromNav) {
    var page = currentPage();
    document.querySelectorAll("#nav a[data-page]").forEach(function (a) {
      if (a.getAttribute("data-page") === page) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    document.title = TITLES[page] + " · JevStyle Console";
    if (state.signedOut || !state.me) return;
    document.querySelectorAll("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== page; });
    if (fromNav) window.scrollTo(0, 0);
    refreshFor(page);
  }
  window.addEventListener("hashchange", function () { showPage(true); });

  function refreshFor(page) {
    if (page === "overview") { loadKeys(); loadUsage(); loadHistory(); }
    else if (page === "keys") { loadKeys(); }
    else if (page === "usage") { loadUsage(); loadDaily(); loadKeys(); }
    else if (page === "limits") { loadUsage(); loadKeys(); }
    else if (page === "playground") { loadUsage(); }
  }

  /* ---------- Account ---------- */
  function setAccount(label, email) {
    $("user-chip").textContent = label;
    $("user-chip").title = email || "";
    $("menu-email").textContent = email || label;
    var initial = (email || "").trim().charAt(0).toUpperCase();
    $("acct-avatar").textContent = initial || "·";
    acctBtn.setAttribute("aria-label", "Account menu" + (email ? " for " + email : ""));
  }
  async function loadMe() {
    var r;
    try { r = await api("/auth/me"); } catch (e) { showGate("offline"); return null; }
    if (r.status === 401) { showGate("signin"); return null; }
    if (!r.ok || !r.data || !r.data.user) { showGate("offline"); return null; }
    var me = r.data.user;
    state.me = me;
    state.verified = me.email_verified === true;
    setAccount(me.email || me.name || "Signed in", me.email || "");
    $("logout-btn").hidden = false;
    $("ov-email").textContent = me.email || me.name || "your account";
    $("verify-banner").hidden = state.verified;
    if (!state.verified) {
      try { sessionStorage.setItem("jev-verification-email", me.email); } catch (e) {}
    }
    return me;
  }

  /* ---------- Service status ---------- */
  async function loadHealth() {
    var up = false;
    try {
      var res = await fetch(ORIGIN + "/healthz", { credentials: "omit", cache: "no-store" });
      var data = await res.json();
      up = res.ok && data && data.inference_ready === true;
    } catch (e) { up = false; }
    var text = up ? "API operational" : "Inference unavailable";
    $("status-pill").setAttribute("data-state", up ? "up" : "down");
    $("status-text").textContent = text;
    $("status-pill").title = up ? "The API is accepting requests." : "Requests may fail with 503 and are not charged.";
    $("ov-status").textContent = text;
    $("ov-status-dot").setAttribute("data-state", up ? "up" : "down");
  }

  /* ---------- Keys ---------- */
  async function loadKeys() {
    try {
      var r = await api("/keys");
      if (!r.ok || !r.data || !Array.isArray(r.data.items)) {
        if (r.status !== 401) notice($("keys-msg"), "Couldn't load your keys. Refresh the page to try again.", "err");
        return;
      }
      state.maxKeys = r.data.max_keys || 3;
      state.allKeys = r.data.items;
      state.keys = r.data.items.filter(function (k) { return k.status === "active"; });
      state.keysLoaded = true;
      renderKeys();
      renderStart();
      if (state.daily) renderKeyFilter();
    } catch (e) {
      notice($("keys-msg"), "Can't reach JevStyle. Check your connection and refresh.", "err");
    }
  }

  function canCreate() { return state.verified && !state.creating && state.keys.length < state.maxKeys; }
  function updateCreateButtons() {
    var allowed = canCreate();
    var why = !state.verified ? "Verify your email to create API keys."
      : state.keys.length >= state.maxKeys ? "You've reached the " + state.maxKeys + "-key limit. Revoke a key to create another." : "";
    document.querySelectorAll("[data-action=create]").forEach(function (b) {
      b.disabled = !allowed;
      b.title = why;
    });
  }

  var ICONS = {
    revoke: '<path d="M4 6h12M8.5 6V4.5h3V6M5.5 6l.7 9.6a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L14.5 6M8.6 9v4.6M11.4 9v4.6"/>',
    rename: '<path d="M12.8 4.2l3 3L7.6 15.4l-3.7.7.7-3.7z"/><path d="M11.2 5.8l3 3"/>',
    usage: '<path d="M3.5 14.5 8 9.8l3 3 5.5-6.3"/><path d="M13 6.5h3.5V10"/>',
    remove: '<path d="M6 6l8 8M14 6l-8 8"/>',
    grip: '<circle cx="7.5" cy="5.5" r="1.1"/><circle cx="12.5" cy="5.5" r="1.1"/><circle cx="7.5" cy="10" r="1.1"/><circle cx="12.5" cy="10" r="1.1"/><circle cx="7.5" cy="14.5" r="1.1"/><circle cx="12.5" cy="14.5" r="1.1"/>'
  };
  function svgIcon(name) {
    return '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }
  function iconButton(kind, label, value) {
    var b = el("button", "icon-btn" + (kind === "revoke" ? " danger" : ""));
    b.type = "button";
    b.setAttribute("data-" + kind, value);
    b.setAttribute("aria-label", label);
    b.title = { revoke: "Revoke", rename: "Rename", usage: "View usage" }[kind];
    b.innerHTML = svgIcon(kind);
    return b;
  }

  function renderKeys() {
    var body = $("keys-body");
    var keys = state.keys;
    var revoked = state.allKeys.filter(function (k) { return k.status !== "active"; });
    var rows = keys.concat(state.showRevoked ? revoked : []);
    body.textContent = "";
    $("key-count").textContent = keys.length + " of " + state.maxKeys + " keys used";
    $("keys-empty-max").textContent = state.maxKeys;
    $("ov-keys").textContent = keys.length;
    $("ov-max").textContent = state.maxKeys;
    $("l-keys").textContent = state.maxKeys;
    $("show-revoked").closest(".switch").hidden = !revoked.length;
    $("keys-wrap").hidden = !rows.length;
    $("keys-empty").hidden = !!keys.length;
    rows.forEach(function (k) {
      var active = k.status === "active";
      var tr = el("tr", k.id === state.freshKeyId ? "fresh" : active ? null : "revoked");
      tr.setAttribute("data-key-id", k.id);
      var name = el("td", "k-name", keyName(k));
      name.setAttribute("data-label", "Name");
      if (!active) {
        var tag = el("span", "tag", "Revoked");
        if (k.revoked_at) tag.title = "Revoked " + fmtFull(k.revoked_at);
        name.appendChild(tag);
      }
      var secret = el("td");
      secret.setAttribute("data-label", "Secret key");
      var code = el("code", "mask", maskKey(k.key_prefix));
      code.title = "Starts with " + k.key_prefix;
      secret.appendChild(code);
      var created = el("td");
      created.setAttribute("data-label", "Created");
      created.appendChild(timeNode(k.created_at, fmtDate(k.created_at)));
      var last = el("td");
      last.setAttribute("data-label", "Last used");
      if (k.last_used_at) last.appendChild(timeNode(k.last_used_at, relTime(k.last_used_at)));
      else last.appendChild(el("span", "muted", "Never"));
      var today = el("td", "num", fmtInt(k.daily_used || 0));
      today.setAttribute("data-label", "Requests today");
      var actions = el("td", "k-actions");
      actions.appendChild(iconButton("usage", "View usage for " + keyName(k), k.key_prefix));
      if (active) {
        actions.appendChild(iconButton("rename", "Rename " + keyName(k), k.id));
        actions.appendChild(iconButton("revoke", "Revoke " + keyName(k), k.id));
      }
      [name, secret, created, last, today, actions].forEach(function (c) { tr.appendChild(c); });
      body.appendChild(tr);
    });
    updateCreateButtons();
  }

  $("show-revoked").addEventListener("change", function () {
    state.showRevoked = this.checked;
    renderKeys();
  });
  $("keys-body").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-rename")) openRename(btn.getAttribute("data-rename"));
    if (btn.hasAttribute("data-revoke")) openRevoke(btn.getAttribute("data-revoke"));
    if (btn.hasAttribute("data-usage")) {
      state.usageKey = btn.getAttribute("data-usage");
      location.hash = "#usage";
    }
  });
  function findKey(id) { return state.keys.filter(function (k) { return k.id === id; })[0]; }
  function keyByPrefix(prefix) { return state.allKeys.filter(function (k) { return k.key_prefix === prefix; })[0]; }

  /* ---------- Dialogs ---------- */
  function closeDialogs() {
    document.querySelectorAll("dialog[open]").forEach(function (d) { d.close(); });
  }
  document.querySelectorAll("dialog [data-close]").forEach(function (b) {
    b.addEventListener("click", function () { b.closest("dialog").close(); });
  });

  var createDialog = $("create-dialog");
  function openCreate() {
    if (!canCreate()) { updateCreateButtons(); return; }
    $("key-name").value = "";
    notice($("create-msg"), "");
    $("create-step").hidden = false;
    $("created-step").hidden = true;
    createDialog.showModal();
    $("key-name").focus();
  }
  document.querySelectorAll("[data-action=create]").forEach(function (b) { b.addEventListener("click", openCreate); });

  $("create-form").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (state.creating) return;
    var name = $("key-name").value.trim();
    if (name.length > 64) { notice($("create-msg"), "Use 64 characters or fewer.", "err"); return; }
    state.creating = true;
    $("create-submit").disabled = true;
    try {
      var r = await api("/keys", { method: "POST", body: name ? { name: name } : {} });
      if (!r.ok || !r.data || !r.data.api_key) {
        var msg = r.status === 422 ? "That name can't be used. Use up to 64 characters without control characters."
          : errorText(r, "Couldn't create the key. Try again.");
        notice($("create-msg"), msg, "err");
        return;
      }
      $("new-key").value = r.data.api_key;
      $("new-key-curl").textContent = curlFor(r.data.api_key);
      $("created-name").textContent = "Name: " + (r.data.name || "Secret key");
      $("create-step").hidden = true;
      $("created-step").hidden = false;
      createDialog.setAttribute("aria-labelledby", "created-title");
      $("copy-key").focus();
      state.freshKeyId = r.data.id;
      loadKeys();
      loadUsage();
    } catch (e) {
      notice($("create-msg"), "Can't reach JevStyle. Check your connection and try again.", "err");
    } finally {
      state.creating = false;
      $("create-submit").disabled = false;
      updateCreateButtons();
    }
  });
  // Whatever closes the dialog (Done, Esc), the plaintext key leaves the DOM with it.
  createDialog.addEventListener("close", function () {
    $("new-key").value = "";
    $("new-key-curl").textContent = "";
    $("created-name").textContent = "";
    $("created-step").hidden = true;
    $("create-step").hidden = false;
    createDialog.setAttribute("aria-labelledby", "create-title");
    resetCopyLabels(createDialog);
  });
  $("created-done").onclick = function () { createDialog.close(); };
  $("copy-key").onclick = function () { copyText($("new-key").value, this); };
  $("copy-curl").onclick = function () { copyText($("new-key-curl").textContent, this); };
  $("use-in-pg").onclick = function () {
    $("pg-key").value = $("new-key").value;
    createDialog.close();
    location.hash = "#playground";
  };

  function curlFor(key) {
    return "curl " + INFERENCE + " \\\n" +
      "  -H \"Authorization: Bearer " + key + "\" \\\n" +
      "  -H \"Content-Type: application/json\" \\\n" +
      "  -d '{\"state\": \"I was billed twice. Please refund one charge.\", " +
      "\"questions\": {\"refund\": {\"type\": \"noul\", \"instructions\": \"The customer asks for money back.\"}}}'";
  }

  var renameDialog = $("rename-dialog");
  function openRename(id) {
    var k = findKey(id);
    if (!k) return;
    state.renameId = id;
    $("rename-input").value = k.name || "";
    notice($("rename-msg"), "");
    $("rename-save").disabled = !$("rename-input").value.trim();
    renameDialog.showModal();
    $("rename-input").select();
  }
  $("rename-input").addEventListener("input", function () { $("rename-save").disabled = !this.value.trim(); });
  $("rename-form").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var name = $("rename-input").value.trim();
    if (!name) return;
    $("rename-save").disabled = true;
    try {
      var r = await api("/keys/" + encodeURIComponent(state.renameId), { method: "PATCH", body: { name: name } });
      if (!r.ok) {
        notice($("rename-msg"), r.status === 422 ? "Use 1–64 characters without control characters."
          : r.status === 404 ? "This key no longer exists." : errorText(r, "Couldn't rename the key."), "err");
        if (r.status === 404) loadKeys();
        return;
      }
      renameDialog.close();
      notice($("keys-msg"), "Key renamed.", "ok");
      await loadKeys();
    } catch (e) {
      notice($("rename-msg"), "Can't reach JevStyle. Try again.", "err");
    } finally {
      $("rename-save").disabled = !$("rename-input").value.trim();
    }
  });

  var revokeDialog = $("revoke-dialog");
  function openRevoke(id) {
    var k = findKey(id);
    if (!k) return;
    state.revokeId = id;
    $("revoke-name").textContent = keyName(k);
    $("revoke-mask").textContent = maskKey(k.key_prefix);
    notice($("revoke-msg"), "");
    $("revoke-confirm").disabled = false;
    revokeDialog.showModal();
  }
  $("revoke-confirm").onclick = async function () {
    var btn = this;
    btn.disabled = true;
    try {
      var r = await api("/keys/" + encodeURIComponent(state.revokeId) + "/revoke", { method: "POST", body: {} });
      if (!r.ok) { notice($("revoke-msg"), errorText(r, "Couldn't revoke the key."), "err"); return; }
      revokeDialog.close();
      notice($("keys-msg"), "Key revoked. Requests that use it are now rejected.", "ok");
      await loadKeys();
      loadUsage();
    } catch (e) {
      notice($("revoke-msg"), "Can't reach JevStyle. Try again.", "err");
    } finally {
      btn.disabled = false;
    }
  };

  /* ---------- Copy ---------- */
  function resetCopyLabels(scope) {
    scope.querySelectorAll("[data-label-orig]").forEach(function (b) { b.textContent = b.getAttribute("data-label-orig"); });
  }
  function flash(button, text) {
    if (!button) return;
    if (!button.hasAttribute("data-label-orig")) button.setAttribute("data-label-orig", button.textContent);
    button.textContent = text;
    clearTimeout(button._t);
    button._t = setTimeout(function () { button.textContent = button.getAttribute("data-label-orig"); }, 1800);
  }
  async function copyText(text, button) {
    var ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; }
    } catch (e) { ok = false; }
    if (!ok) {
      // Fallback inside the same (possibly modal) container; removed immediately.
      var host = (button && button.closest("dialog")) || document.body;
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      host.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
    }
    flash(button, ok ? "Copied" : "Select and copy");
  }
  document.querySelectorAll(".copy-btn[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var target = b.getAttribute("data-copy");
      var text = target === "qs"
        ? (document.querySelector("[data-qs-pane]:not([hidden])") || {}).textContent
        : $(target).textContent;
      copyText(text || "", b);
    });
  });

  /* ---------- Tabs ---------- */
  function selectTab(tabs, active) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t === active)); t.tabIndex = t === active ? 0 : -1; });
  }
  function tabKeys(tabs, onPick) {
    tabs.forEach(function (t, i) {
      t.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
        ev.preventDefault();
        var next = tabs[(i + (ev.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        onPick(next);
      });
    });
  }

  /* ---------- Overview: Get started + quick start ---------- */
  var qsTabs = Array.prototype.slice.call(document.querySelectorAll("[data-qs]"));
  function pickQs(b) {
    var lang = b.getAttribute("data-qs");
    selectTab(qsTabs, b);
    document.querySelectorAll("[data-qs-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-qs-pane") !== lang; });
  }
  qsTabs.forEach(function (b) { b.addEventListener("click", function () { pickQs(b); }); });
  tabKeys(qsTabs, pickQs);
  selectTab(qsTabs, qsTabs[0]);

  function startHidden() { try { return localStorage.getItem(START_KEY) === "hidden"; } catch (e) { return false; } }
  function setStep(id, done) {
    var li = $(id);
    li.setAttribute("data-done", String(done));
    li.querySelector(".step-state").textContent = done ? "(done)" : "(not done)";
  }
  function renderStart() {
    if (!state.keysLoaded || !state.historyLoaded) return;
    var hasKey = state.allKeys.length > 0;
    var called = state.allKeys.some(function (k) { return !!k.last_used_at; }) ||
      !!(state.usage && Number(state.usage.daily_used) > 0) || !!(state.history && state.history.total > 0);
    setStep("step-key", hasKey);
    setStep("step-call", called);
    var done = (hasKey ? 1 : 0) + (called ? 1 : 0);
    $("start-progress").textContent = done === 2 ? "All done. You're ready to build." : done + " of 2 done";
    $("start-hide").hidden = done < 2;
    $("start-card").hidden = done === 2 && startHidden();
  }
  $("start-hide").onclick = function () {
    try { localStorage.setItem(START_KEY, "hidden"); } catch (e) {}
    $("start-card").hidden = true;
  };

  async function loadHistory() {
    try {
      var r = await api("/usage/daily?days=90");
      if (r.ok && r.data && Array.isArray(r.data.items)) state.history = r.data;
    } catch (e) {}
    state.historyLoaded = true;
    renderSpark();
    renderStart();
  }
  function renderSpark() {
    var svg = $("ov-spark");
    var h = state.history;
    if (!h || !h.items.length) { svg.innerHTML = ""; $("ov-week").textContent = ""; return; }
    var items = h.items.slice(-7);
    var total = 0;
    var max = 1;
    items.forEach(function (it) { total += it.count; max = Math.max(max, it.count); });
    $("ov-week").textContent = fmtInt(total) + " in the last 7 days";
    var n = items.length;
    var pts = items.map(function (it, i) {
      var x = n > 1 ? 2 + (i / (n - 1)) * 116 : 60;
      var y = 25 - (it.count / max) * 21;
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    svg.innerHTML = '<path class="spark-area" d="M' + pts[0].split(",")[0] + ",27 L" + pts.join(" L") + " L" + pts[n - 1].split(",")[0] + ',27 Z"/>' +
      '<polyline class="spark-line" vector-effect="non-scaling-stroke" points="' + pts.join(" ") + '"/>';
  }

  /* ---------- Usage ---------- */
  async function loadUsage() {
    try {
      var r = await api("/usage");
      if (!r.ok || !r.data) {
        if (r.status !== 401) notice($("usage-msg"), "Couldn't load usage. Refresh the page to try again.", "err");
        return;
      }
      state.usage = r.data;
      notice($("usage-msg"), "");
      renderToday();
      renderLimits();
      renderStart();
    } catch (e) {
      notice($("usage-msg"), "Can't reach JevStyle. Check your connection and refresh.", "err");
    }
  }

  function setMeter(fill, used, limit) {
    var ratio = limit > 0 ? Math.min(1, used / limit) : 0;
    fill.style.width = (ratio * 100).toFixed(2) + "%";
    fill.className = ratio >= 1 ? "full" : ratio >= 0.8 ? "warn" : "";
  }
  function renderToday() {
    var u = state.usage;
    if (!u) return;
    var used = Number(u.daily_used) || 0;
    var limit = Number(u.daily_limit) || 10000;
    var remaining = u.daily_remaining != null ? Number(u.daily_remaining) : Math.max(0, limit - used);
    $("u-used").textContent = fmtInt(used);
    $("u-rem").textContent = fmtInt(remaining);
    $("u-limit").textContent = fmtInt(limit);
    $("ov-used").textContent = fmtInt(used);
    $("ov-limit").textContent = fmtInt(limit);
    setMeter($("u-meter"), used, limit);
    setMeter($("ov-meter"), used, limit);
    var wrap = $("u-meter-wrap");
    wrap.setAttribute("aria-valuemax", String(limit));
    wrap.setAttribute("aria-valuenow", String(used));
    renderReset();
  }
  function renderReset() {
    var at = state.usage && state.usage.reset_at;
    var text = resetText(at);
    $("u-reset").textContent = text;
    $("ov-reset").textContent = text;
  }
  function renderLimits() {
    var u = state.usage;
    if (!u) return;
    if (u.concurrency_limit) $("l-conc").textContent = fmtInt(u.concurrency_limit);
    if (u.rpm_limit) $("l-rpm").textContent = fmtInt(u.rpm_limit);
    if (u.daily_limit) $("l-daily").textContent = fmtInt(u.daily_limit);
    if (u.input_token_soft_limit) $("l-tokens").textContent = fmtInt(u.input_token_soft_limit);
  }

  document.querySelectorAll("#range-seg [data-days]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.days = Number(b.getAttribute("data-days"));
      document.querySelectorAll("#range-seg [data-days]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      loadDaily();
    });
  });
  $("u-key").addEventListener("change", function () {
    state.usageKey = this.value;
    renderChart();
  });
  $("u-refresh").onclick = function () { loadUsage(); loadDaily(); loadKeys(); };

  var dailySeq = 0;
  async function loadDaily() {
    var chart = $("chart");
    var seq = ++dailySeq;
    chart.style.opacity = state.daily ? "0.5" : "";
    try {
      var r = await api("/usage/daily?days=" + state.days);
      if (seq !== dailySeq) return;
      if (!r.ok || !r.data || !Array.isArray(r.data.items)) {
        if (r.status !== 401) notice($("usage-msg"), "Couldn't load usage history. Refresh the page to try again.", "err");
        return;
      }
      state.daily = r.data;
      renderKeyFilter();
      renderChart();
    } catch (e) {
      notice($("usage-msg"), "Can't reach JevStyle. Check your connection and refresh.", "err");
    } finally {
      if (seq === dailySeq) chart.style.opacity = "";
    }
  }

  // Keys offered in the filter: every key in this period's legend plus every key on the account.
  function filterKeys() {
    var seen = {};
    var list = [];
    function add(k) {
      if (!k || !k.key_prefix || seen[k.key_prefix]) return;
      seen[k.key_prefix] = true;
      list.push({ key_prefix: k.key_prefix, name: k.name, status: k.status });
    }
    state.allKeys.forEach(add);
    (state.daily ? state.daily.keys || [] : []).forEach(add);
    list.sort(function (a, b) { return (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1); });
    return list;
  }
  function keyLabel(k) {
    return (k.name || "Secret key") + " (" + maskKey(k.key_prefix) + ")" + (k.status === "active" ? "" : " · revoked");
  }
  function renderKeyFilter() {
    var select = $("u-key");
    var keys = filterKeys();
    if (state.usageKey && !keys.some(function (k) { return k.key_prefix === state.usageKey; })) state.usageKey = "";
    select.textContent = "";
    select.appendChild(new Option("All API keys", ""));
    keys.forEach(function (k) { select.appendChild(new Option(keyLabel(k), k.key_prefix)); });
    select.value = state.usageKey;
  }

  // The chart's data for the current key filter (all keys, or one key's share of each day).
  function viewDaily() {
    var d = state.daily;
    var p = state.usageKey;
    if (!p) return d;
    var items = d.items.map(function (it) {
      var n = (it.by_key || {})[p] || 0;
      var byKey = {};
      if (n) byKey[p] = n;
      return { day: it.day, count: n, by_key: byKey };
    });
    var total = items.reduce(function (s, it) { return s + it.count; }, 0);
    return { days: d.days, items: items, total: total, keys: d.keys, only: p };
  }

  function seriesFor(daily) {
    // Active keys keep one colour each (slots 1-3, oldest first); revoked keys share a neutral.
    var list = [];
    var byPrefix = {};
    var used = {};
    daily.items.forEach(function (d) { Object.keys(d.by_key || {}).forEach(function (p) { used[p] = (used[p] || 0) + d.by_key[p]; }); });
    var slot = 0;
    var revoked = null;
    (daily.keys || []).forEach(function (k) {
      if (k.status === "active") {
        var s = { id: k.key_prefix, label: (k.name || "Secret key") + " (" + maskKey(k.key_prefix) + ")", color: SERIES[Math.min(slot, SERIES.length - 1)], total: used[k.key_prefix] || 0 };
        slot += 1;
        byPrefix[k.key_prefix] = s;
        if (s.total) list.push(s);
      } else {
        if (!revoked) revoked = { id: "revoked", label: "Revoked keys", color: REVOKED_SERIES, total: 0 };
        byPrefix[k.key_prefix] = revoked;
      }
    });
    Object.keys(used).forEach(function (p) {
      if (!byPrefix[p]) {
        if (!revoked) revoked = { id: "revoked", label: "Revoked keys", color: REVOKED_SERIES, total: 0 };
        byPrefix[p] = revoked;
      }
      if (byPrefix[p] === revoked) revoked.total += used[p];
    });
    if (revoked && revoked.total) list.push(revoked);
    if (daily.only && byPrefix[daily.only] === revoked) {
      // A single revoked key is shown under its own name, not the shared "Revoked keys" bucket.
      var k = keyByPrefix(daily.only) || { key_prefix: daily.only, status: "revoked" };
      var own = { id: daily.only, label: keyLabel(k), color: REVOKED_SERIES, total: used[daily.only] || 0 };
      byPrefix[daily.only] = own;
      list = own.total ? [own] : [];
    }
    return { list: list, byPrefix: byPrefix };
  }

  function niceScale(max) {
    var steps = [1, 2, 5];
    for (var mag = 1; mag < 1e7; mag *= 10) {
      for (var i = 0; i < steps.length; i++) {
        var step = steps[i] * mag;
        if (Math.ceil(max / step) <= 4) return { step: step, top: Math.max(step, step * Math.ceil(max / step)) };
      }
    }
    return { step: max, top: max };
  }

  function renderChart() {
    if (!state.daily) return;
    var d = viewDaily();
    var chart = $("chart");
    var tip = $("chart-tip");
    tip.hidden = true;
    var period = "Last " + d.days + " days";
    var filtered = d.only ? filterKeys().filter(function (k) { return k.key_prefix === d.only; })[0] : null;
    $("chart-sub").textContent = period + " · UTC";
    $("chart-total").textContent = fmtInt(d.total);
    $("u-period-label").textContent = period;
    $("u-period").textContent = plural(d.total, "request").replace(/^\d+/, fmtInt(d.total));
    $("u-period-foot").textContent = d.only ? keyLabel(filtered || { key_prefix: d.only, status: "revoked" }) : "All API keys";
    $("chart-empty-text").textContent = d.only
      ? "This key has no successful requests in this period."
      : "There are no successful requests in this period.";
    var empty = !d.total;
    $("chart-empty").hidden = !empty;
    chart.hidden = empty;
    $("chart-table-wrap").hidden = empty;
    var legend = $("chart-legend");
    legend.textContent = "";
    if (empty) { legend.hidden = true; return; }
    var series = seriesFor(d);
    legend.hidden = series.list.length < 2;
    if (series.list.length === 1 && !d.only) $("chart-sub").textContent += " · all from " + series.list[0].label;
    series.list.forEach(function (s) {
      var item = el("span");
      var sw = el("i");
      sw.style.background = s.color;
      item.appendChild(sw);
      item.appendChild(document.createTextNode(s.label + " · " + fmtInt(s.total)));
      legend.appendChild(item);
    });

    var max = 0;
    d.items.forEach(function (it) { max = Math.max(max, it.count); });
    var scale = niceScale(max);
    chart.textContent = "";
    var yAxis = el("div", "chart-y");
    var plot = el("div", "chart-plot");
    var grid = el("div", "chart-grid");
    for (var v = 0; v <= scale.top; v += scale.step) {
      var y = (v / scale.top) * 100;
      var line = el("i", v === 0 ? "base" : "");
      line.style.bottom = y + "%";
      grid.appendChild(line);
      var lab = el("span", null, fmtInt(v));
      lab.style.bottom = y + "%";
      yAxis.appendChild(lab);
    }
    var bars = el("div", "chart-bars");
    var cols = "repeat(" + d.items.length + ", minmax(0, 1fr))";
    bars.style.gridTemplateColumns = cols;
    bars.setAttribute("role", "list");
    bars.setAttribute("aria-label", "Successful requests per day");
    var xAxis = el("div", "chart-x");
    xAxis.style.gridTemplateColumns = cols;
    d.items.forEach(function (it) {
      var col = el("div", "col");
      col.setAttribute("role", "listitem");
      col.tabIndex = 0;
      col.setAttribute("aria-label", dayLongFmt.format(new Date(it.day + "T00:00:00Z")) + ": " + plural(it.count, "request"));
      col.setAttribute("data-day", it.day);
      if (it.count > 0) {
        var stack = el("div", "stack");
        stack.style.height = Math.max(1, (it.count / scale.top) * 100) + "%";
        var parts = {};
        Object.keys(it.by_key || {}).forEach(function (p) {
          var s = series.byPrefix[p];
          if (!s) return;
          parts[s.id] = parts[s.id] || { s: s, n: 0 };
          parts[s.id].n += it.by_key[p];
        });
        series.list.forEach(function (s) {
          var part = parts[s.id];
          if (!part || !part.n) return;
          var seg = el("i");
          seg.style.background = s.color;
          seg.style.flexGrow = String(part.n);
          stack.appendChild(seg);
        });
        col.appendChild(stack);
      }
      col.addEventListener("pointerenter", function () { showTip(col, it, series); });
      col.addEventListener("focus", function () { showTip(col, it, series); });
      col.addEventListener("pointerleave", hideTip);
      col.addEventListener("blur", hideTip);
      bars.appendChild(col);
      xAxis.appendChild(el("span"));
    });
    plot.appendChild(grid);
    plot.appendChild(bars);
    chart.appendChild(yAxis);
    chart.appendChild(plot);
    chart.appendChild(xAxis);
    labelDays(xAxis, d.items);
    renderTable(d, series);
  }

  function labelDays(xAxis, items) {
    var width = xAxis.clientWidth || 600;
    var per = width / items.length;
    var step = Math.max(1, Math.ceil(52 / per));
    var spans = xAxis.children;
    for (var i = items.length - 1; i >= 0; i -= step) {
      spans[i].textContent = "";
      spans[i].appendChild(el("b", null, dayFmt.format(new Date(items[i].day + "T00:00:00Z"))));
    }
  }

  function showTip(col, it, series) {
    var tip = $("chart-tip");
    var card = $("chart-card");
    document.querySelectorAll(".col.on").forEach(function (c) { c.classList.remove("on"); });
    col.classList.add("on");
    tip.textContent = "";
    tip.appendChild(el("div", "tip-day", dayLongFmt.format(new Date(it.day + "T00:00:00Z")) + " (UTC)"));
    tip.appendChild(el("div", "tip-total", plural(it.count, "request")));
    var totals = {};
    Object.keys(it.by_key || {}).forEach(function (p) {
      var s = series.byPrefix[p];
      if (!s) return;
      totals[s.id] = (totals[s.id] || 0) + it.by_key[p];
    });
    series.list.forEach(function (s) {
      if (!totals[s.id]) return;
      var row = el("div", "tip-row");
      var key = el("i");
      key.style.background = s.color;
      row.appendChild(key);
      row.appendChild(el("span", null, s.label));
      row.appendChild(el("b", null, fmtInt(totals[s.id])));
      tip.appendChild(row);
    });
    tip.hidden = false;
    var c = card.getBoundingClientRect();
    var r = col.getBoundingClientRect();
    var stack = col.querySelector(".stack");
    var anchor = stack ? stack.getBoundingClientRect().top : r.bottom;
    // Beside the hovered column (right, or left near the edge) so the bar itself stays visible.
    var left = r.right - c.left + 8;
    if (left + tip.offsetWidth > c.width - 8) left = r.left - c.left - tip.offsetWidth - 8;
    left = Math.max(8, left);
    var top = anchor - c.top - tip.offsetHeight / 2;
    top = Math.max(8, Math.min(top, r.bottom - c.top - tip.offsetHeight));
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() {
    $("chart-tip").hidden = true;
    document.querySelectorAll(".col.on").forEach(function (c) { c.classList.remove("on"); });
  }

  function renderTable(d, series) {
    var body = $("chart-table");
    body.textContent = "";
    d.items.slice().reverse().forEach(function (it) {
      var tr = el("tr");
      tr.appendChild(el("td", null, dayFmt.format(new Date(it.day + "T00:00:00Z"))));
      tr.appendChild(el("td", "num", fmtInt(it.count)));
      var parts = Object.keys(it.by_key || {}).map(function (p) {
        var s = series.byPrefix[p];
        return (s && s.id !== "revoked" ? s.label : maskKey(p) + " (revoked)") + ": " + fmtInt(it.by_key[p]);
      });
      tr.appendChild(el("td", "muted", parts.join(", ") || "—"));
      body.appendChild(tr);
    });
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (state.daily && !$("chart").hidden) renderChart(); }, 150);
  });

  /* ---------- Playground: templates ---------- */
  var TEMPLATES = {
    support: {
      state: "Customer: I was billed twice for my Pro plan this month, and the app also logged me out twice today. Please refund one of the charges.",
      questions: {
        refund: { type: "noul", instructions: "Does the customer ask for money back?" },
        team: { type: "choice", instructions: "Which team should handle this ticket first?",
          criteria: { billing: "charges, refunds, invoices", tech: "bugs, crashes, sign-in problems", sales: "pricing and upgrades" } },
        urgency: { type: "score", instructions: "How urgent is this ticket?", criteria: ["low", "medium", "high", "critical"] }
      }
    },
    noul: {
      state: "Customer: I was charged twice for my October invoice. Please refund the duplicate payment.",
      questions: { wants_refund: { type: "noul", instructions: "Does the customer ask for money back?" } }
    },
    choice: {
      state: "User: The app crashes every time I upload a photo larger than 10 MB.",
      questions: { team: { type: "choice", instructions: "Which team should handle this ticket?",
        criteria: { billing: "charges, refunds, invoices", tech: "bugs, crashes, errors", sales: "pricing, upgrades, quotes" } } }
    },
    score: {
      state: "Customer: This is the third outage this week. We are losing orders every hour and will cancel today if it is not fixed.",
      questions: { urgency: { type: "score", instructions: "How urgent is this ticket?", criteria: ["low", "medium", "high", "critical"] } }
    }
  };
  var TYPE_HELP = {
    noul: "Returns the probability that the answer is yes, from 0% to 100%.",
    choice: "Picks one option and returns a probability for each option.",
    score: "Rates the state on your ordered levels and returns a score from the lowest to the highest level."
  };

  var pg = { mode: "form", form: null, template: null, dirty: false };
  function announce(text) {
    var live = $("pg-announce");
    live.textContent = "";
    setTimeout(function () { live.textContent = text; }, 50);
  }

  /* ---------- Playground: form model <-> systemone body ---------- */
  function FormError(message, qi, field, i) { this.message = message; this.qi = qi; this.field = field; this.i = i; }
  function blankQuestion(type) {
    return {
      name: "", type: type || "noul", instructions: "", yes: "", no: "",
      options: [{ name: "", desc: "" }, { name: "", desc: "" }],
      levels: [{ label: "", desc: "" }, { label: "", desc: "" }, { label: "", desc: "" }]
    };
  }
  function isText(v) { return v === undefined || v === null || typeof v === "string"; }
  function isObject(v) { return v instanceof Ordered || (!!v && typeof v === "object" && !Array.isArray(v)); }
  function keysOf(v) { return entries(v).map(function (e) { return e[0]; }); }
  // Last value wins for a repeated key, as with JSON.parse.
  function get(v, key) {
    var hit;
    entries(v).forEach(function (e) { if (e[0] === key) hit = e; });
    return hit ? hit[1] : undefined;
  }

  // Throws FormError when the body uses something the form can't show (structured instructions or criteria).
  // Accepts plain data or Ordered data from parseOrdered, so key order survives JSON -> Form.
  function fromBody(body) {
    if (!isObject(body)) throw new FormError("The request body must be a JSON object.");
    var qs = get(body, "questions");
    if (!isObject(qs)) throw new FormError("The request needs a \"questions\" object.");
    var form = { state: "", stateRaw: undefined, questions: [], extra: [] };
    entries(body).forEach(function (e) { if (e[0] !== "state" && e[0] !== "questions") form.extra.push(e); });
    var state = get(body, "state");
    if (typeof state === "string") form.state = state;
    else if (state !== undefined && state !== null) form.stateRaw = state;
    entries(qs).forEach(function (pair) {
      var name = pair[0];
      var q = pair[1];
      var jsonOnly = new FormError("Question \"" + name + "\" uses structured fields the form can't edit. Keep editing it in JSON.");
      var type = isObject(q) ? get(q, "type") : undefined;
      if (["noul", "choice", "score"].indexOf(type) < 0) {
        throw new FormError("Question \"" + name + "\" needs a type of noul, choice or score. Fix it in JSON first.");
      }
      var instructions = get(q, "instructions");
      if (!isText(instructions)) throw jsonOnly;
      var item = blankQuestion(type);
      item.name = name;
      item.instructions = instructions || "";
      var c = get(q, "criteria");
      if (c === undefined || c === null) return form.questions.push(item);
      if (type === "noul") {
        if (!isObject(c) || keysOf(c).some(function (k) { return k !== "true" && k !== "false"; }) ||
            !isText(get(c, "true")) || !isText(get(c, "false"))) throw jsonOnly;
        item.yes = get(c, "true") || "";
        item.no = get(c, "false") || "";
      } else if (type === "choice") {
        if (!isObject(c)) throw jsonOnly;
        item.options = entries(c).map(function (e) {
          if (!isText(e[1])) throw jsonOnly;
          return { name: e[0], desc: e[1] || "" };
        });
      } else {
        if (!Array.isArray(c)) throw jsonOnly;
        item.levels = c.map(function (l) {
          if (typeof l === "string") return { label: l, desc: "" };
          if (isObject(l) && typeof get(l, "label") === "string" && isText(get(l, "description")) &&
              keysOf(l).every(function (k) { return k === "label" || k === "description"; })) {
            return { label: get(l, "label"), desc: get(l, "description") || "" };
          }
          throw jsonOnly;
        });
      }
      form.questions.push(item);
    });
    return form;
  }

  // Bodies are built as ordered pairs so names keep the order typed (plain objects move
  // integer-like keys such as "10" first) and names like "__proto__" stay ordinary keys.
  function Ordered(pairs) { this.pairs = pairs; }
  function entries(v) { return v instanceof Ordered ? v.pairs : Object.keys(v).map(function (k) { return [k, v[k]]; }); }
  // JSON text; step "  " pretty-prints like JSON.stringify(v, null, 2), step "" is compact.
  function jsonText(v, step, pad) {
    pad = pad || "";
    if (v === null || v === undefined || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
    var inner = pad + step;
    var nl = step ? "\n" : "";
    if (Array.isArray(v)) {
      if (!v.length) return "[]";
      return "[" + nl + v.map(function (x) { return inner + jsonText(x, step, inner); }).join("," + nl) + nl + pad + "]";
    }
    var list = entries(v);
    if (!list.length) return "{}";
    return "{" + nl + list.map(function (e) {
      return inner + JSON.stringify(e[0]) + (step ? ": " : ":") + jsonText(e[1], step, inner);
    }).join("," + nl) + nl + pad + "}";
  }

  // Parses text that JSON.parse already accepted, keeping object key order (as Ordered).
  var JSON_ATOM = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/y;
  function parseOrdered(text) {
    var i = 0;
    function ws() { while (i < text.length && " \t\n\r".indexOf(text[i]) >= 0) i++; }
    function str() {
      var start = i++;
      while (text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
      i++;
      return JSON.parse(text.slice(start, i));
    }
    function value() {
      ws();
      var c = text[i];
      if (c === "{") {
        i++;
        var pairs = [];
        ws();
        if (text[i] === "}") { i++; return new Ordered(pairs); }
        for (;;) {
          ws();
          var key = str();
          ws();
          i++;
          pairs.push([key, value()]);
          ws();
          if (text[i++] === "}") return new Ordered(pairs);
        }
      }
      if (c === "[") {
        i++;
        var list = [];
        ws();
        if (text[i] === "]") { i++; return list; }
        for (;;) {
          list.push(value());
          ws();
          if (text[i++] === "]") return list;
        }
      }
      if (c === '"') return str();
      JSON_ATOM.lastIndex = i;
      var m = JSON_ATOM.exec(text);
      i += m[0].length;
      return JSON.parse(m[0]);
    }
    return value();
  }

  // level "run": every problem stops the build (nothing is sent).
  // level "keep": only problems that would drop or overwrite something stop it (Form to JSON, Code).
  function buildBody(form, level) {
    function fail(message, qi, field, i, lossy) {
      if (level === "run" || (level === "keep" && lossy)) throw new FormError(message, qi, field, i);
    }
    var state = form.stateRaw !== undefined ? form.stateRaw : form.state;
    if (form.stateRaw === undefined && !form.state.trim()) fail("Enter a state: the situation to decide on.", -1, "state");
    if (!form.questions.length) fail("Add at least one question.", -1, "add");
    if (form.questions.length > MAX_QUESTIONS) fail("Use at most " + MAX_QUESTIONS + " questions per request.", -1, "add");
    var names = Object.create(null);
    var questions = form.questions.map(function (q, i) {
      var name = q.name;
      var label = name.trim() ? "Question \"" + name + "\"" : "Question " + (i + 1);
      if (!name.trim()) fail("Give question " + (i + 1) + " a name.", i, "name", undefined, true);
      else if (names[name]) fail("Question names must be unique: \"" + name + "\" is used twice.", i, "name", undefined, true);
      names[name] = true;
      if (!q.instructions.trim()) fail(label + " needs instructions.", i, "instructions");
      var out = [["type", q.type], ["instructions", q.instructions]];
      if (q.type === "noul") {
        var crit = [];
        if (q.yes.trim()) crit.push(["true", q.yes]);
        if (q.no.trim()) crit.push(["false", q.no]);
        if (crit.length) out.push(["criteria", new Ordered(crit)]);
      } else if (q.type === "choice") {
        var seen = Object.create(null);
        var opts = [];
        q.options.forEach(function (o, k) {
          if (!o.name.trim() && !o.desc.trim()) return;
          if (!o.name.trim()) fail(label + ": every option needs a name.", i, "opt-name", k, true);
          else if (seen[o.name]) fail(label + ": option \"" + o.name + "\" is listed twice.", i, "opt-name", k, true);
          seen[o.name] = true;
          opts.push([o.name, o.desc.trim() ? o.desc : null]);
        });
        if (!opts.length) fail(label + " needs at least one option.", i, "opt-name", 0);
        if (opts.length > 255) fail(label + " can have at most 255 options.", i, "opt-name", 255);
        out.push(["criteria", new Ordered(opts)]);
      } else {
        var levels = [];
        q.levels.forEach(function (l, k) {
          if (!l.label.trim() && !l.desc.trim()) return;
          if (!l.label.trim()) fail(label + ": every level needs a label.", i, "lvl-label", k);
          levels.push(l.desc.trim() ? new Ordered([["label", l.label], ["description", l.desc]]) : l.label);
        });
        if (levels.length < 2) fail(label + " needs at least two levels.", i, "lvl-label", levels.length);
        if (levels.length > 10) fail(label + " can have at most ten levels.", i, "lvl-label", 10);
        out.push(["criteria", levels]);
      }
      return [name.trim() ? name : "question_" + (i + 1), new Ordered(out)];
    });
    var body = [["state", state], ["questions", new Ordered(questions)]];
    form.extra.forEach(function (e) { body.push(e); });
    return new Ordered(body);
  }

  /* ---------- Playground: form rendering ---------- */
  function input(cls, field, value, placeholder, label) {
    var node = el("input", cls);
    node.type = "text";
    node.value = value;
    node.placeholder = placeholder;
    node.spellcheck = false;
    node.autocomplete = "off";
    node.setAttribute("data-f", field);
    node.setAttribute("aria-label", label);
    return node;
  }
  function smallButton(act, text, label) {
    var b = el("button", "btn sm ghost add-row");
    b.type = "button";
    b.setAttribute("data-act", act);
    b.innerHTML = '<span aria-hidden="true">+</span> ';
    b.appendChild(document.createTextNode(text));
    if (label) b.setAttribute("aria-label", label);
    return b;
  }
  function removeButton(act, label, disabled) {
    var b = el("button", "icon-btn sm");
    b.type = "button";
    b.setAttribute("data-act", act);
    b.setAttribute("aria-label", label);
    b.title = "Remove";
    b.innerHTML = svgIcon("remove");
    b.disabled = !!disabled;
    return b;
  }
  function subHead(title, aside) {
    var head = el("div", "sub-head");
    head.appendChild(el("span", null, title));
    head.appendChild(el("span", "muted", aside));
    return head;
  }

  function questionNode(q, qi) {
    var title = q.name.trim() || "question " + (qi + 1);
    var box = el("div", "q");
    box.setAttribute("data-qi", qi);
    var head = el("div", "q-head");
    head.appendChild(input("q-name", "name", q.name, "question_name", "Question " + (qi + 1) + " name"));
    var type = el("select", "q-type");
    type.setAttribute("data-f", "type");
    type.setAttribute("aria-label", "Type of " + title);
    [["noul", "Yes / No"], ["choice", "Choice"], ["score", "Score"]].forEach(function (t) {
      type.appendChild(new Option(t[1], t[0], false, q.type === t[0]));
    });
    head.appendChild(type);
    head.appendChild(removeButton("del-q", "Remove " + title));
    box.appendChild(head);

    var insId = "q" + qi + "-ins";
    var insLabel = el("label", "q-lbl", "Instructions");
    insLabel.htmlFor = insId;
    box.appendChild(insLabel);
    var ins = el("textarea", "q-ins");
    ins.id = insId;
    ins.rows = 2;
    ins.value = q.instructions;
    ins.placeholder = q.type === "noul" ? "A yes/no question or statement about the state" : q.type === "choice" ? "What to choose" : "What to rate";
    ins.setAttribute("data-f", "instructions");
    box.appendChild(ins);
    box.appendChild(el("p", "q-help", TYPE_HELP[q.type]));

    if (q.type === "noul") {
      box.appendChild(subHead("What yes and no mean", "Optional"));
      var yn = el("div", "rows");
      yn.appendChild(input("", "yes", q.yes, "Yes means…", "What yes means for " + title));
      yn.appendChild(input("", "no", q.no, "No means…", "What no means for " + title));
      box.appendChild(yn);
    } else if (q.type === "choice") {
      box.appendChild(subHead("Options", "Choose one"));
      var opts = el("div", "rows");
      q.options.forEach(function (o, i) {
        var row = el("div", "row-item");
        row.setAttribute("data-i", i);
        var fields = el("div", "row-fields");
        fields.appendChild(input("opt-name", "opt-name", o.name, "Option " + (i + 1), "Option " + (i + 1) + " name"));
        fields.appendChild(input("desc", "opt-desc", o.desc, "When it applies (optional)", "Option " + (i + 1) + " description"));
        row.appendChild(fields);
        row.appendChild(removeButton("del-opt", "Remove option " + (i + 1), q.options.length <= 1));
        opts.appendChild(row);
      });
      box.appendChild(opts);
      if (q.options.length < 255) box.appendChild(smallButton("add-opt", "Add option", "Add option to " + title));
    } else {
      box.appendChild(subHead("Levels", "Lowest to highest"));
      var levels = el("div", "rows levels");
      q.levels.forEach(function (l, i) {
        var row = el("div", "row-item lvl");
        row.setAttribute("data-i", i);
        var grip = el("button", "grip");
        grip.type = "button";
        grip.setAttribute("data-act", "grip");
        grip.setAttribute("aria-label", "Level " + i + ". Drag, or use the arrow keys, to reorder.");
        grip.title = "Drag to reorder";
        grip.innerHTML = svgIcon("grip");
        row.appendChild(grip);
        row.appendChild(el("span", "idx", String(i)));
        var fields = el("div", "row-fields");
        fields.appendChild(input("lvl-label", "lvl-label", l.label, "Label", "Level " + i + " label"));
        fields.appendChild(input("desc", "lvl-desc", l.desc, "Description (optional)", "Level " + i + " description"));
        row.appendChild(fields);
        row.appendChild(removeButton("del-lvl", "Remove level " + i, q.levels.length <= 2));
        levels.appendChild(row);
      });
      box.appendChild(levels);
      if (q.levels.length < 10) box.appendChild(smallButton("add-lvl", "Add level", "Add level to " + title));
    }
    return box;
  }

  function renderForm(focus) {
    var list = $("q-list");
    list.textContent = "";
    pg.form.questions.forEach(function (q, qi) { list.appendChild(questionNode(q, qi)); });
    var n = pg.form.questions.length;
    $("q-count").textContent = n + " of " + MAX_QUESTIONS;
    $("q-add").disabled = n >= MAX_QUESTIONS;
    renderStateBox();
    if (focus) focusField(focus.qi, focus.field, focus.i);
  }
  function focusField(qi, field, i) {
    var target = null;
    if (field === "state") target = $("pg-state");
    else if (field === "add") target = $("q-add");
    else if (qi >= 0) {
      var box = $("q-list").querySelector('.q[data-qi="' + qi + '"]');
      if (box) {
        var scope = i !== undefined ? box.querySelector('.row-item[data-i="' + i + '"]') || box : box;
        target = scope.querySelector('[data-f="' + field + '"], [data-act="' + field + '"]') || box.querySelector('[data-f="' + field + '"]');
      }
    }
    if (target) { target.focus(); if (target.scrollIntoView) target.scrollIntoView({ block: "nearest" }); }
  }
  function renderStateBox() {
    if (!pg.form) return;
    var box = $("pg-state");
    var note = $("pg-state-note");
    if (pg.mode === "json") {
      box.hidden = true;
      note.hidden = false;
      note.textContent = "Editing the full request as JSON. The state is part of the body.";
      return;
    }
    box.hidden = false;
    if (pg.form.stateRaw !== undefined) {
      box.value = jsonText(pg.form.stateRaw, "  ");
      box.readOnly = true;
      note.hidden = false;
      note.textContent = "This state is structured JSON. Switch to JSON to edit it.";
    } else {
      box.value = pg.form.state;
      box.readOnly = false;
      note.hidden = true;
    }
  }

  function setTemplate(name) {
    pg.template = name;
    document.querySelectorAll(".tpl").forEach(function (t) {
      t.setAttribute("aria-pressed", String(t.getAttribute("data-template") === name));
    });
  }
  function loadTemplate(name) {
    pg.form = fromBody(clone(TEMPLATES[name]));
    if (pg.mode === "json") $("pg-body").value = jsonText(buildBody(pg.form, "draft"), "  ");
    renderForm();
    setTemplate(name);
    pg.dirty = false;
    notice($("pg-msg"), "");
    showEmpty();
  }
  function showEmpty() {
    $("pg-result").hidden = true;
    $("pg-empty").hidden = false;
  }
  document.querySelectorAll(".tpl").forEach(function (t) {
    t.addEventListener("click", function () {
      if (pg.dirty && !window.confirm("Replace your current questions and state with this template?")) return;
      loadTemplate(t.getAttribute("data-template"));
    });
  });
  $("pg-templates-btn").onclick = function () {
    notice($("pg-msg"), "");
    showEmpty();
    var first = document.querySelector(".tpl[aria-pressed=true]") || document.querySelector(".tpl");
    if (first) { first.focus(); first.scrollIntoView({ block: "nearest" }); }
  };

  /* ---------- Playground: editing ---------- */
  function edited() { pg.dirty = true; if (pg.template) setTemplate(null); }
  var qList = $("q-list");
  qList.addEventListener("input", function (ev) {
    var t = ev.target;
    var f = t.getAttribute("data-f");
    var box = t.closest(".q");
    if (!f || !box || f === "type") return;
    var q = pg.form.questions[Number(box.getAttribute("data-qi"))];
    var row = t.closest(".row-item");
    var i = row ? Number(row.getAttribute("data-i")) : -1;
    if (f === "name" || f === "instructions" || f === "yes" || f === "no") q[f] = t.value;
    else if (f === "opt-name") q.options[i].name = t.value;
    else if (f === "opt-desc") q.options[i].desc = t.value;
    else if (f === "lvl-label") q.levels[i].label = t.value;
    else if (f === "lvl-desc") q.levels[i].desc = t.value;
    edited();
  });
  qList.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.getAttribute("data-f") !== "type") return;
    var qi = Number(t.closest(".q").getAttribute("data-qi"));
    pg.form.questions[qi].type = t.value;
    edited();
    renderForm({ qi: qi, field: "type" });
  });
  qList.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-act]");
    if (!b || b.getAttribute("data-act") === "grip") return;
    var qi = Number(b.closest(".q").getAttribute("data-qi"));
    var q = pg.form.questions[qi];
    var row = b.closest(".row-item");
    var i = row ? Number(row.getAttribute("data-i")) : -1;
    var act = b.getAttribute("data-act");
    var focus = null;
    if (act === "del-q") {
      pg.form.questions.splice(qi, 1);
      focus = pg.form.questions.length ? { qi: Math.min(qi, pg.form.questions.length - 1), field: "name" } : { qi: -1, field: "add" };
    } else if (act === "add-opt") {
      q.options.push({ name: "", desc: "" });
      focus = { qi: qi, field: "opt-name", i: q.options.length - 1 };
    } else if (act === "del-opt") {
      q.options.splice(i, 1);
      focus = { qi: qi, field: "opt-name", i: Math.min(i, q.options.length - 1) };
    } else if (act === "add-lvl") {
      q.levels.push({ label: "", desc: "" });
      focus = { qi: qi, field: "lvl-label", i: q.levels.length - 1 };
    } else if (act === "del-lvl") {
      q.levels.splice(i, 1);
      focus = { qi: qi, field: "lvl-label", i: Math.min(i, q.levels.length - 1) };
    } else return;
    edited();
    renderForm(focus);
  });
  $("q-add").onclick = function () {
    if (pg.form.questions.length >= MAX_QUESTIONS) return;
    var q = blankQuestion("noul");
    var taken = {};
    pg.form.questions.forEach(function (x) { taken[x.name.trim()] = true; });
    var n = pg.form.questions.length + 1;
    while (taken["question_" + n]) n += 1;
    q.name = "question_" + n;
    pg.form.questions.push(q);
    edited();
    renderForm({ qi: pg.form.questions.length - 1, field: "instructions" });
  };

  // Levels: keyboard reorder on the grip (arrow keys) and pointer drag.
  function moveLevel(qi, from, to) {
    var levels = pg.form.questions[qi].levels;
    if (to < 0 || to >= levels.length || to === from) return false;
    levels.splice(to, 0, levels.splice(from, 1)[0]);
    edited();
    return true;
  }
  qList.addEventListener("keydown", function (ev) {
    var grip = ev.target.closest && ev.target.closest('[data-act="grip"]');
    if (!grip || (ev.key !== "ArrowUp" && ev.key !== "ArrowDown")) return;
    ev.preventDefault();
    var qi = Number(grip.closest(".q").getAttribute("data-qi"));
    var from = Number(grip.closest(".row-item").getAttribute("data-i"));
    var to = from + (ev.key === "ArrowUp" ? -1 : 1);
    if (moveLevel(qi, from, to)) {
      renderForm({ qi: qi, field: "grip", i: to });
      announce("Moved to position " + (to + 1) + " of " + pg.form.questions[qi].levels.length + ", level " + to + ".");
    }
  });
  qList.addEventListener("pointerdown", function (ev) {
    var grip = ev.target.closest('[data-act="grip"]');
    if (!grip || ev.button !== 0) return;
    ev.preventDefault();
    var row = grip.closest(".row-item");
    var rows = row.parentNode;
    var qi = Number(grip.closest(".q").getAttribute("data-qi"));
    var from = Number(row.getAttribute("data-i"));
    var pointer = ev.pointerId;
    row.classList.add("dragging");
    // Listeners live on the document: moving the row in the DOM must not end the drag.
    function onMove(e) {
      if (e.pointerId !== pointer) return;
      var siblings = Array.prototype.slice.call(rows.children);
      for (var k = 0; k < siblings.length; k++) {
        var s = siblings[k];
        if (s === row) continue;
        var box = s.getBoundingClientRect();
        if (e.clientY > box.top && e.clientY < box.bottom) {
          var target = e.clientY > box.top + box.height / 2 ? s.nextSibling : s;
          if (target !== row && target !== row.nextSibling) rows.insertBefore(row, target);
          break;
        }
      }
    }
    function onUp(e) {
      if (e.pointerId !== pointer) return;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      row.classList.remove("dragging");
      var to = Array.prototype.indexOf.call(rows.children, row);
      if (moveLevel(qi, from, to)) renderForm({ qi: qi, field: "grip", i: to });
      else renderForm({ qi: qi, field: "grip", i: from });
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });

  $("pg-state").addEventListener("input", function () {
    if (pg.form.stateRaw !== undefined) return;
    pg.form.state = this.value;
    edited();
  });
  $("pg-body").addEventListener("input", edited);

  /* ---------- Playground: Form / JSON ---------- */
  function setMode(mode) {
    pg.mode = mode;
    document.querySelectorAll("[data-mode]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode));
    });
    $("pg-form").hidden = mode !== "form";
    $("pg-json").hidden = mode !== "json";
    renderStateBox();
  }
  function switchMode(mode) {
    if (mode === pg.mode) return;
    var msg = $("pg-msg");
    if (mode === "json") {
      var built;
      try { built = buildBody(pg.form, "keep"); } catch (e) {
        if (!(e instanceof FormError)) throw e;
        notice(msg, e.message + " Fix it before switching to JSON, so nothing is lost.", "err");
        focusField(e.qi, e.field, e.i);
        return;
      }
      $("pg-body").value = jsonText(built, "  ");
      notice(msg, "");
      setMode("json");
      return;
    }
    var text = $("pg-body").value;
    try { JSON.parse(text); } catch (e) {
      notice(msg, "The request body isn't valid JSON: " + e.message, "err");
      return;
    }
    try { pg.form = fromBody(parseOrdered(text)); } catch (e) {
      if (!(e instanceof FormError)) throw e;
      notice(msg, e.message, "err");
      return;
    }
    notice(msg, "");
    setMode("form");
    renderForm();
  }
  document.querySelectorAll("[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () { switchMode(b.getAttribute("data-mode")); });
  });
  $("pg-key-toggle").onclick = function () {
    var field = $("pg-key");
    var visible = field.type === "password";
    field.type = visible ? "text" : "password";
    this.textContent = visible ? "Hide" : "Show";
    this.setAttribute("aria-pressed", String(visible));
  };
  $("pg-format").onclick = function () {
    try {
      $("pg-body").value = JSON.stringify(JSON.parse($("pg-body").value), null, 2);
      notice($("pg-msg"), "");
    } catch (e) {
      notice($("pg-msg"), "The request body isn't valid JSON: " + e.message, "err");
    }
  };
  document.querySelector("[data-view=playground]").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey) && ev.target.matches("input, textarea, select")) {
      ev.preventDefault();
      runPlayground();
    }
  });
  $("pg-composer").addEventListener("submit", function (ev) { ev.preventDefault(); runPlayground(); });

  /* ---------- Playground: response tabs ---------- */
  var resTabs = [$("tab-answers"), $("tab-raw")];
  function pickRes(tab) {
    selectTab(resTabs, tab);
    var raw = tab.getAttribute("data-res") === "raw";
    $("pg-answers").hidden = raw;
    $("pg-raw-wrap").hidden = !raw;
  }
  resTabs.forEach(function (t) { t.addEventListener("click", function () { pickRes(t); }); });
  tabKeys(resTabs, pickRes);
  selectTab(resTabs, resTabs[0]);

  /* ---------- Playground: code ---------- */
  function pyRepr(v, indent) {
    if (v === null || v === undefined) return "None";
    if (v === true) return "True";
    if (v === false) return "False";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return JSON.stringify(v);
    var inner = indent + "    ";
    if (Array.isArray(v)) {
      if (!v.length) return "[]";
      return "[\n" + v.map(function (x) { return inner + pyRepr(x, inner) + ","; }).join("\n") + "\n" + indent + "]";
    }
    var list = entries(v);
    if (!list.length) return "{}";
    return "{\n" + list.map(function (e) { return inner + JSON.stringify(e[0]) + ": " + pyRepr(e[1], inner) + ","; }).join("\n") + "\n" + indent + "}";
  }
  // body: the request as Ordered/plain data; text: its exact JSON text for curl.
  function codeFor(lang, body, text) {
    if (lang === "python") {
      return "import os\nimport requests\n\nresponse = requests.post(\n" +
        "    " + JSON.stringify(INFERENCE) + ",\n" +
        "    headers={\"Authorization\": f\"Bearer {os.environ['JEV_API_KEY']}\"},\n" +
        "    json=" + pyRepr(body, "    ") + ",\n" +
        "    timeout=70,\n)\nresponse.raise_for_status()\n" +
        "for name, answer in response.json()[\"answers\"].items():\n    print(name, answer)";
    }
    return "curl " + INFERENCE + " \\\n" +
      "  -H \"Authorization: Bearer $JEV_API_KEY\" \\\n" +
      "  -H \"Content-Type: application/json\" \\\n" +
      "  --data-binary @- <<'JSON'\n" + text + "\nJSON";
  }
  var codeDialog = $("code-dialog");
  function renderCode() {
    var body = null;
    var text = "";
    var msg = $("code-msg");
    if (pg.mode === "json") {
      text = $("pg-body").value.trim();
      try { JSON.parse(text); body = parseOrdered(text); } catch (e) {
        notice(msg, "The request body isn't valid JSON yet: " + e.message, "err");
      }
    } else {
      try {
        body = buildBody(pg.form, "keep");
        text = jsonText(body, "  ");
      } catch (e) {
        if (!(e instanceof FormError)) throw e;
        notice(msg, e.message, "err");
      }
    }
    if (body !== null) notice(msg, "");
    $("code-out").textContent = body === null ? "" : codeFor($("code-lang").value, body, text);
    $("code-copy").disabled = body === null;
  }
  $("pg-code-btn").onclick = function () {
    renderCode();
    codeDialog.showModal();
    $("code-lang").focus();
  };
  $("code-lang").addEventListener("change", renderCode);
  $("code-copy").onclick = function () { copyText($("code-out").textContent, this); };
  $("code-keys-link").addEventListener("click", function () { codeDialog.close(); });
  codeDialog.addEventListener("close", function () { resetCopyLabels(codeDialog); });

  /* ---------- Playground: run ---------- */
  function friendly(status, data) {
    var error = data && data.error;
    var limit = data && data.limit;
    var wait = data && data.retry_after_seconds;
    var u = state.usage || {};
    if (status === 400) return error === "ambiguous_key" ? "Send only one API key per request." : "The request was rejected as malformed.";
    if (status === 401) return "This API key is invalid or has been revoked. Copy an active key from the API keys page.";
    if (status === 403) return error === "email_verification_required" ? "Verify your email before using API keys." : "This request isn't allowed.";
    if (status === 413) return "The input is too large. Keep the state and all questions under " + fmtInt(u.input_token_soft_limit || 8000) + " tokens (and 32,000 UTF-8 bytes).";
    if (status === 422) {
      var where = data && Array.isArray(data.details) ? data.details.slice(0, 3).map(function (x) {
        return (x.path || []).filter(function (p) { return p !== "body"; }).join(" → ") || "body";
      }) : [];
      return "The request doesn't match the systemone format. Check each question's type, instructions and criteria." +
        (where.length ? " Problem at: " + where.join("; ") + "." : "");
    }
    if (status === 429) {
      var retry = wait ? " Try again in " + (wait < 120 ? plural(wait, "second") : countdown(wait * 1000)) + "." : " Try again shortly.";
      if (limit === "concurrency") return "Only " + (u.concurrency_limit || 1) + " request can run at a time per account. Wait for the current request to finish.";
      if (limit === "rpm") return "You've reached " + (u.rpm_limit || 20) + " requests per minute." + retry;
      if (limit === "daily") return "You've used today's " + fmtInt(u.daily_limit || 10000) + " successful requests. " + resetText(u.reset_at) + ".";
      return "The free tier is busy right now." + retry;
    }
    if (status === 503) return "Inference is temporarily unavailable. Failed requests are not charged, so you can try again shortly.";
    if (status === 504) return "The model didn't finish in time. This request was not charged; try again.";
    return (data && data.message) || "The request failed with status " + status + ".";
  }

  function showResult() {
    $("pg-empty").hidden = true;
    $("pg-result").hidden = false;
  }
  async function runPlayground() {
    if (state.running) return;
    var key = $("pg-key").value.trim();
    var msg = $("pg-msg");
    if (!key) { notice(msg, "Paste an API key first. You can create one on the API keys page.", "err"); $("pg-key").focus(); return; }
    if (key.indexOf("jev_") !== 0) { notice(msg, "API keys start with jev_. Check that you pasted the whole key.", "err"); return; }
    var body;
    var text;
    var order;
    if (pg.mode === "json") {
      text = $("pg-body").value;
      try { body = JSON.parse(text); } catch (e) {
        notice(msg, "The request body isn't valid JSON: " + e.message, "err");
        return;
      }
      var parsed = parseOrdered(text);
      order = isObject(parsed) && isObject(get(parsed, "questions")) ? keysOf(get(parsed, "questions")) : [];
    } else {
      try {
        var built = buildBody(pg.form, "run");
        text = jsonText(built, "");
        body = JSON.parse(text);
        order = entries(built.pairs[1][1]).map(function (e) { return e[0]; });
      } catch (e) {
        if (!(e instanceof FormError)) throw e;
        notice(msg, e.message, "err");
        focusField(e.qi, e.field, e.i);
        return;
      }
    }
    state.running = true;
    var run = $("pg-run");
    run.disabled = true;
    run.textContent = "Running…";
    notice(msg, "");
    $("pg-status").hidden = true;
    $("pg-time").textContent = "";
    var started = performance.now();
    try {
      var res = await fetch(INFERENCE, {
        method: "POST", credentials: "omit", cache: "no-store",
        headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
        body: text
      });
      var text = await res.text();
      var elapsed = Math.round(performance.now() - started);
      var data = null;
      try { data = JSON.parse(text); } catch (e) { data = null; }
      var badge = $("pg-status");
      badge.textContent = res.status + (res.ok ? " OK" : "");
      badge.className = "badge " + (res.ok ? "ok" : "err");
      badge.hidden = false;
      $("pg-time").textContent = fmtInt(elapsed) + " ms";
      showResult();
      $("pg-raw").textContent = data ? JSON.stringify(data, null, 2) : text;
      $("pg-answers").textContent = "";
      $("pg-meta").textContent = "";
      if (res.ok && data) {
        renderAnswers(body, data, order);
        pickRes(resTabs[0]);
        loadUsage();
      } else {
        pickRes(resTabs[1]);
        notice(msg, friendly(res.status, data), "err");
      }
    } catch (e) {
      showResult();
      $("pg-status").textContent = "Network error";
      $("pg-status").className = "badge err";
      $("pg-status").hidden = false;
      $("pg-time").textContent = "";
      $("pg-answers").textContent = "";
      $("pg-raw").textContent = "";
      $("pg-meta").textContent = "";
      notice(msg, "Couldn't reach the API. Check your connection and try again.", "err");
    } finally {
      state.running = false;
      run.disabled = false;
      run.textContent = "Run";
    }
  }

  function levelLabel(level, i) {
    if (typeof level === "string") return level;
    if (level && typeof level === "object" && typeof level.label === "string") return level.label;
    return "Level " + i;
  }
  function probRow(label, p, chosen) {
    var row = el("div", "prob" + (chosen ? " chosen" : ""));
    var lab = el("span", "lbl", (chosen ? "✓ " : "") + label);
    lab.title = label;
    var track = el("span", "track");
    var fill = el("span", "fill");
    fill.style.width = Math.max(0, Math.min(1, Number(p) || 0)) * 100 + "%";
    track.appendChild(fill);
    row.appendChild(lab);
    row.appendChild(track);
    row.appendChild(el("span", "val", pct(p)));
    return row;
  }
  function own(obj, key) { return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined; }
  function renderAnswers(request, result, order) {
    var box = $("pg-answers");
    box.textContent = "";
    var answers = (result && result.answers) || {};
    var questions = (request && request.questions) || {};
    var ids = (order || Object.keys(questions)).filter(function (q) { return own(answers, q); });
    Object.keys(answers).forEach(function (q) { if (ids.indexOf(q) < 0) ids.push(q); });
    ids.forEach(function (id) {
      var a = own(answers, id) || {};
      var q = own(questions, id) || {};
      var card = el("div", "answer");
      var head = el("div", "answer-head");
      head.appendChild(el("span", "answer-id", id));
      head.appendChild(el("span", "tag", a.type || q.type || "answer"));
      var sum = el("span", "answer-sum");
      head.appendChild(sum);
      card.appendChild(head);
      if (a.type === "noul") {
        var yes = Number(a.noul);
        sum.textContent = pct(yes) + " yes";
        card.appendChild(probRow("Yes", yes, yes >= 0.5));
        card.appendChild(probRow("No", 1 - yes, yes < 0.5));
      } else if (a.probabilities && typeof a.probabilities === "object") {
        var order = Object.keys(a.probabilities);
        if (a.type === "choice" && q.criteria && typeof q.criteria === "object" && !Array.isArray(q.criteria)) {
          var known = Object.keys(q.criteria).filter(function (k) { return k in a.probabilities; });
          order = known.concat(order.filter(function (k) { return known.indexOf(k) < 0; }));
        }
        if (a.type === "score") order.sort(function (x, y) { return Number(x) - Number(y); });
        var top = a.type === "score" ? String(Math.round(Number(a.score))) : a.choice;
        order.forEach(function (opt) {
          var label = opt;
          if (a.type === "score" && Array.isArray(q.criteria)) label = opt + " · " + levelLabel(q.criteria[Number(opt)], Number(opt));
          card.appendChild(probRow(label, a.probabilities[opt], opt === top));
        });
        sum.textContent = a.type === "score"
          ? "score " + Number(a.score).toFixed(2) + " of " + (order.length - 1) + " · confidence " + pct(a.confidence)
          : "→ " + a.choice + " · confidence " + pct(a.confidence);
      }
      box.appendChild(card);
    });
    if (result && result.usage && typeof result.usage.input_tokens === "number") {
      $("pg-meta").textContent = fmtInt(result.usage.input_tokens) + " input tokens · model " + MODEL_NAME;
    }
  }

  setMode("form");
  loadTemplate("support");

  /* ---------- Log out ---------- */
  $("logout-btn").onclick = async function () {
    try { await api("/auth/logout", { method: "POST", body: {} }); } catch (e) {}
    location.href = "/login/";
  };

  /* ---------- Timers ---------- */
  setInterval(function () {
    if (state.usage) renderReset();
    if (state.keys.length && !document.querySelector("dialog[open]") && !$("keys-body").contains(document.activeElement)) renderKeys();
  }, 30000);
  setInterval(loadHealth, 60000);

  /* ---------- Start ---------- */
  showPage(false);
  loadHealth();
  (async function init() {
    var me = await loadMe();
    if (!me) return;
    state.signedOut = false;
    $("gate").hidden = true;
    showPage(false);
  })();
})();
