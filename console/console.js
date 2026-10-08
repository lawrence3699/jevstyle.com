/* JevStyle Console. Same-origin script; talks only to the configured API origin.
   Secrets (new keys, the Playground key) live in this page's memory/DOM only — never in storage. */
(function () {
  "use strict";
  var ORIGIN = "https://api.jevstyle.com";
  var CONTROL = ORIGIN + "/control/v1";
  var INFERENCE = ORIGIN + "/v1/systemone";
  var THEME_KEY = "jev-api-theme";
  var PAGES = ["overview", "playground", "keys", "usage", "limits"];
  var TITLES = { overview: "Overview", playground: "Playground", keys: "API keys", usage: "Usage", limits: "Limits & models" };
  var SERIES = ["var(--s1)", "var(--s2)", "var(--s3)"];
  var REVOKED_SERIES = "var(--s0)";

  var state = {
    me: null, verified: false, keys: [], maxKeys: 3, usage: null, daily: null, days: 30,
    creating: false, renameId: null, revokeId: null, running: false, signedOut: false
  };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function show(node, visible) { node.hidden = !visible; }
  function notice(node, text, kind) {
    node.textContent = text || "";
    node.className = "notice" + (kind ? " " + kind : "");
    node.hidden = !text;
  }

  /* ---------- Theme (only the theme preference is stored) ---------- */
  var THEMES = ["system", "light", "dark"];
  function currentTheme() { try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; } }
  function applyTheme(t) {
    var root = document.documentElement;
    if (!t || t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t || "system"); } catch (e) {}
  }
  applyTheme(currentTheme());
  $("theme-btn").onclick = function () {
    var i = THEMES.indexOf(currentTheme());
    applyTheme(THEMES[(i + 1) % THEMES.length]);
  };

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
    $("user-chip").textContent = kind === "offline" ? "Offline" : "Not signed in";
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
    if (page === "overview") { loadKeys(); loadUsage(); }
    else if (page === "keys") { loadKeys(); }
    else if (page === "usage") { loadUsage(); loadDaily(); }
    else if (page === "limits") { loadUsage(); loadKeys(); }
    else if (page === "playground") { loadUsage(); }
  }

  /* ---------- Account ---------- */
  async function loadMe() {
    var r;
    try { r = await api("/auth/me"); } catch (e) { showGate("offline"); return null; }
    if (r.status === 401) { showGate("signin"); return null; }
    if (!r.ok || !r.data || !r.data.user) { showGate("offline"); return null; }
    var me = r.data.user;
    state.me = me;
    state.verified = me.email_verified === true;
    $("user-chip").textContent = me.email || me.name || "Signed in";
    $("user-chip").title = me.email || "";
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
      state.keys = r.data.items.filter(function (k) { return k.status === "active"; });
      renderKeys();
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

  function iconButton(kind, label, id) {
    var b = el("button", "icon-btn" + (kind === "revoke" ? " danger" : ""));
    b.type = "button";
    b.setAttribute("data-" + kind, id);
    b.setAttribute("aria-label", label);
    b.title = kind === "revoke" ? "Revoke" : "Rename";
    b.innerHTML = kind === "revoke"
      ? '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h12M8.5 6V4.5h3V6M5.5 6l.7 9.6a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L14.5 6M8.6 9v4.6M11.4 9v4.6"/></svg>'
      : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.8 4.2l3 3L7.6 15.4l-3.7.7.7-3.7z"/><path d="M11.2 5.8l3 3"/></svg>';
    return b;
  }

  function renderKeys() {
    var body = $("keys-body");
    var keys = state.keys;
    body.textContent = "";
    $("key-count").textContent = keys.length + " of " + state.maxKeys + " keys used";
    $("keys-empty-max").textContent = state.maxKeys;
    $("ov-keys").textContent = keys.length;
    $("ov-max").textContent = state.maxKeys;
    $("l-keys").textContent = state.maxKeys;
    $("keys-wrap").hidden = !keys.length;
    $("keys-empty").hidden = !!keys.length;
    keys.forEach(function (k) {
      var tr = el("tr", k.id === state.freshKeyId ? "fresh" : null);
      tr.setAttribute("data-key-id", k.id);
      var name = el("td", "k-name", keyName(k));
      name.setAttribute("data-label", "Name");
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
      actions.appendChild(iconButton("rename", "Rename " + keyName(k), k.id));
      actions.appendChild(iconButton("revoke", "Revoke " + keyName(k), k.id));
      [name, secret, created, last, today, actions].forEach(function (c) { tr.appendChild(c); });
      body.appendChild(tr);
    });
    updateCreateButtons();
  }

  $("keys-body").addEventListener("click", function (ev) {
    var btn = ev.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-rename")) openRename(btn.getAttribute("data-rename"));
    if (btn.hasAttribute("data-revoke")) openRevoke(btn.getAttribute("data-revoke"));
  });
  function findKey(id) { return state.keys.filter(function (k) { return k.id === id; })[0]; }

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

  /* ---------- Quick start ---------- */
  document.querySelectorAll("[data-qs]").forEach(function (b) {
    b.addEventListener("click", function () {
      var lang = b.getAttribute("data-qs");
      document.querySelectorAll("[data-qs]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      document.querySelectorAll("[data-qs-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-qs-pane") !== lang; });
    });
  });

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
    var limit = Number(u.daily_limit) || 500;
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

  async function loadDaily() {
    var chart = $("chart");
    chart.style.opacity = state.daily ? "0.5" : "";
    try {
      var r = await api("/usage/daily?days=" + state.days);
      if (!r.ok || !r.data || !Array.isArray(r.data.items)) {
        if (r.status !== 401) notice($("usage-msg"), "Couldn't load usage history. Refresh the page to try again.", "err");
        return;
      }
      state.daily = r.data;
      renderChart();
    } catch (e) {
      notice($("usage-msg"), "Can't reach JevStyle. Check your connection and refresh.", "err");
    } finally {
      chart.style.opacity = "";
    }
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
    var d = state.daily;
    if (!d) return;
    var chart = $("chart");
    var tip = $("chart-tip");
    tip.hidden = true;
    $("chart-sub").textContent = "Last " + d.days + " days · UTC";
    $("chart-total").textContent = fmtInt(d.total);
    var empty = !d.total;
    $("chart-empty").hidden = !empty;
    chart.hidden = empty;
    $("chart-table-wrap").hidden = empty;
    var legend = $("chart-legend");
    legend.textContent = "";
    if (empty) { legend.hidden = true; return; }
    var series = seriesFor(d);
    legend.hidden = series.list.length < 2;
    if (series.list.length === 1) $("chart-sub").textContent += " · all from " + series.list[0].label;
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
    d.items.forEach(function (it, idx) {
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

  /* ---------- Playground ---------- */
  var EXAMPLES = {
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
  function loadExample(name) { $("pg-body").value = JSON.stringify(EXAMPLES[name] || EXAMPLES.support, null, 2); }
  loadExample("support");
  $("pg-example").addEventListener("change", function () { loadExample(this.value); });
  $("pg-key-toggle").onclick = function () {
    var input = $("pg-key");
    var visible = input.type === "password";
    input.type = visible ? "text" : "password";
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
  $("pg-body").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); runPlayground(); }
  });
  $("pg-run").onclick = runPlayground;

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
      var retry = wait ? " Try again in " + plural(wait, "second") + "." : " Try again shortly.";
      if (limit === "concurrency") return "Only " + (u.concurrency_limit || 1) + " request can run at a time per account. Wait for the current request to finish.";
      if (limit === "rpm") return "You've reached " + (u.rpm_limit || 20) + " requests per minute." + retry;
      if (limit === "daily") return "You've used today's " + fmtInt(u.daily_limit || 500) + " successful requests. " + resetText(u.reset_at) + ".";
      return "The free tier is busy right now." + retry;
    }
    if (status === 503) return "Inference is temporarily unavailable. Failed requests are not charged, so you can try again shortly.";
    if (status === 504) return "The model didn't finish in time. This request was not charged; try again.";
    return (data && data.message) || "The request failed with status " + status + ".";
  }

  async function runPlayground() {
    if (state.running) return;
    var key = $("pg-key").value.trim();
    var msg = $("pg-msg");
    if (!key) { notice(msg, "Paste an API key first. You can create one on the API keys page.", "err"); $("pg-key").focus(); return; }
    if (key.indexOf("jev_") !== 0) { notice(msg, "API keys start with jev_. Check that you pasted the whole key.", "err"); return; }
    var body;
    try { body = JSON.parse($("pg-body").value); } catch (e) {
      notice(msg, "The request body isn't valid JSON: " + e.message, "err");
      return;
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
        body: JSON.stringify(body)
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
      $("pg-empty").hidden = true;
      $("pg-raw").textContent = data ? JSON.stringify(data, null, 2) : text;
      $("pg-raw-wrap").hidden = false;
      $("pg-answers").textContent = "";
      if (res.ok && data) { renderAnswers(body, data); loadUsage(); }
      else notice(msg, friendly(res.status, data), "err");
    } catch (e) {
      $("pg-status").textContent = "Network error";
      $("pg-status").className = "badge err";
      $("pg-status").hidden = false;
      $("pg-time").textContent = "";
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
  function renderAnswers(request, result) {
    var box = $("pg-answers");
    box.textContent = "";
    var answers = (result && result.answers) || {};
    var questions = (request && request.questions) || {};
    var ids = Object.keys(questions).filter(function (q) { return answers[q]; });
    Object.keys(answers).forEach(function (q) { if (ids.indexOf(q) < 0) ids.push(q); });
    ids.forEach(function (id) {
      var a = answers[id] || {};
      var q = questions[id] || {};
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
      box.appendChild(el("p", "hint", fmtInt(result.usage.input_tokens) + " input tokens · model " + (result.model || "")));
    }
  }

  /* ---------- Log out ---------- */
  $("logout-btn").onclick = async function () {
    try { await api("/auth/logout", { method: "POST", body: {} }); } catch (e) {}
    location.href = "/login/";
  };

  /* ---------- Timers ---------- */
  setInterval(function () {
    if (state.usage) renderReset();
    if (state.keys.length && !document.querySelector("dialog[open]")) renderKeys();
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
