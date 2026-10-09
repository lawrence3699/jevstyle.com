(function () {
  "use strict";
  var token = window.__jevEmailToken || "";
  delete window.__jevEmailToken;
  var kind = document.body.dataset.authFlow;
  var CONTROL = "https://api.jevstyle.com/control/v1/auth";
  var TOKEN = /^[A-Za-z0-9_-]{43}$/;
  var COOLDOWN = 30;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var card = document.querySelector(".card");
  var stages = Array.prototype.slice.call(document.querySelectorAll(".stage"));
  var validToken = TOKEN.test(token);
  var lastEmail = "";
  var timer = null;
  function $(id) { return document.getElementById(id); }

  // ---- Motion helpers (all skipped when the system asks for reduced motion) ----
  function morph(change) {
    // Animate the card's height between layouts so stage swaps never jump.
    var from = card.getBoundingClientRect().height;
    change();
    if (reduce || !card.animate) return;
    var to = card.getBoundingClientRect().height;
    if (Math.abs(from - to) < 1) return;
    card.style.overflow = "hidden";
    var a = card.animate([{height: from + "px"}, {height: to + "px"}], {duration: 460, easing: "cubic-bezier(.16,1,.3,1)"});
    a.onfinish = a.oncancel = function () { card.style.overflow = ""; };
  }
  function stage(id, focus) {
    var next = $(id);
    var current = stages.filter(function (s) { return !s.hidden; })[0];
    function swap() {
      morph(function () { stages.forEach(function (s) { s.hidden = s !== next; }); });
      var target = focus || next.querySelector("h1");
      if (target) target.focus({preventScroll: true});
    }
    if (current === next) return;
    if (!current || reduce || !current.animate) return swap();
    var fade = current.animate([{opacity: 1, transform: "none"}, {opacity: 0, transform: "translateY(-6px)"}], {duration: 160, easing: "ease-in", fill: "forwards"});
    fade.onfinish = function () { swap(); fade.cancel(); };
  }
  function shake(el) {
    if (reduce || !el || !el.animate) return;
    el.animate([{transform: "translateX(0)"}, {transform: "translateX(-7px)"}, {transform: "translateX(6px)"}, {transform: "translateX(-4px)"}, {transform: "translateX(2px)"}, {transform: "translateX(0)"}], {duration: 420, easing: "ease-out"});
  }
  function busy(button, on) {
    button.classList.toggle("loading", on);
    button.disabled = on;
    button.setAttribute("aria-busy", on ? "true" : "false");
  }
  function show(box, text, error) {
    box.hidden = true; void box.offsetWidth; // replay the slide-in
    box.textContent = text; box.className = "msg" + (error ? " err" : ""); box.hidden = false;
  }

  async function post(path, body) {
    var response = await fetch(CONTROL + path, {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
    var data = {};
    try { data = (await response.json()) || {}; } catch (e) {}
    return {ok: response.ok, status: response.status, data: data};
  }
  var OFFLINE = "Can't reach the service. Please try again later.";

  function finish() {
    clearInterval(timer);
    stage("stage-done");
    $("progress").classList.add("run");
    setTimeout(function () { location.href = "/console/"; }, reduce ? 600 : 1800);
  }

  // ---- Sign-up finished in another tab of this browser ----
  // The tab that opens the email link announces it, so a waiting "Check your inbox" tab
  // moves on by itself; it also checks when it comes back to the front. Same browser only:
  // finishing sign-up must never sign in whoever started it on another device.
  var channel = null, waiting = "";
  try { channel = new BroadcastChannel("jev-auth"); } catch (e) {}
  function arrived(email) {
    if (!waiting || String(email || "").toLowerCase() !== waiting) return;
    waiting = "";
    $("done-text").textContent = "Email verified. Taking you to Console…";
    finish();
  }
  if (channel) channel.onmessage = function (event) {
    if (event.data && event.data.type === "signed-in") arrived(event.data.email);
  };
  document.addEventListener("visibilitychange", async function () {
    if (document.hidden || !waiting) return;
    try {
      var response = await fetch(CONTROL + "/me", {credentials: "include"});
      if (!response.ok) return;
      var me = ((await response.json()) || {}).user;
      if (me && me.email_verified) arrived(me.email);
    } catch (e) {}
  });

  // ---- "Check your inbox" (register and verify-email) ----
  var MAIL = [
    [/^(gmail|googlemail)\.com$/, "Gmail", "https://mail.google.com/mail/u/0/#search/in%3Aanywhere+JevStyle"],
    [/^(outlook|hotmail|live|msn)\.[a-z.]+$/, "Outlook", "https://outlook.live.com/mail/0/"],
    [/^(icloud|me|mac)\.com$/, "iCloud Mail", "https://www.icloud.com/mail/"],
    [/^yahoo\.[a-z.]+$/, "Yahoo Mail", "https://mail.yahoo.com/"],
    [/^(qq|foxmail)\.com$/, "QQ Mail", "https://mail.qq.com/"],
    [/^163\.com$/, "163 Mail", "https://mail.163.com/"],
    [/^126\.com$/, "126 Mail", "https://mail.126.com/"]
  ];
  function cooldown() {
    var button = $("resend"), left = COOLDOWN;
    clearInterval(timer);
    function tick() {
      if (left <= 0) { clearInterval(timer); button.disabled = false; button.textContent = "Resend email"; return; }
      button.disabled = true; button.textContent = "Resend in " + left + "s"; left -= 1;
    }
    tick();
    timer = setInterval(tick, 1000);
  }
  function sent(address) {
    lastEmail = address;
    waiting = address.toLowerCase();
    $("sent-to").textContent = address;
    $("sent-msg").hidden = true;
    var domain = address.split("@").pop().toLowerCase();
    var provider = MAIL.filter(function (m) { return m[0].test(domain); })[0];
    $("open-mail").hidden = !provider;
    if (provider) { $("open-mail").href = provider[2]; $("open-mail-label").textContent = "Open " + provider[1]; }
    try { sessionStorage.setItem("jev-verification-email", address); } catch (e) {}
    stage("stage-sent");
    cooldown();
  }
  function wireSent(requestEmail, back, input) {
    $("resend").addEventListener("click", async function () {
      var button = this;
      busy(button, true);
      try {
        var r = await requestEmail(lastEmail);
        busy(button, false);
        if (!r.ok) { show($("sent-msg"), r.data.message || "Could not send the email.", true); return; }
        show($("sent-msg"), "Sent again. Any link we've sent will work.");
        cooldown();
      } catch (e) { busy(button, false); show($("sent-msg"), OFFLINE, true); }
    });
    $("change-email").addEventListener("click", function () {
      clearInterval(timer);
      waiting = "";
      stage(back, input);
      input.select();
    });
  }
  function requestForm(form, input, box, send) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var address = input.value.trim();
      if (!address || !input.checkValidity()) { show(box, "Enter a valid email address.", true); shake(input); input.focus(); return; }
      if (send.check && !send.check()) return;
      var button = form.querySelector("button[type=submit]");
      busy(button, true);
      try {
        var r = await send(address);
        if (!r.ok) { show(box, r.data.message || "Could not complete this request.", true); shake(form); return; }
        box.hidden = true;
        if (send.done) send.done(address, r); else sent(address);
      } catch (e) { show(box, OFFLINE, true); }
      finally { busy(button, false); }
    });
  }

  // ---- Password with show/hide and strength meter ----
  function rate(pw) {
    if (!pw) return [0, "Use at least 8 characters."];
    if (pw.length < 8) { var n = 8 - pw.length; return [1, n + " more character" + (n === 1 ? "" : "s") + " to go."]; }
    var kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(function (r) { return r.test(pw); }).length;
    if (pw.length >= 16 || (pw.length >= 12 && kinds >= 3)) return [4, "Strong password."];
    if (pw.length >= 12 || kinds >= 3) return [3, "Good password."];
    return [2, "Okay. Longer is stronger."];
  }
  function wirePassword() {
    var input = $("password"), toggle = $("pw-toggle");
    if (toggle) toggle.addEventListener("click", function () {
      var showing = input.type === "text";
      input.type = showing ? "password" : "text";
      toggle.setAttribute("aria-pressed", showing ? "false" : "true");
      toggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      input.focus();
    });
    if ($("meter")) input.addEventListener("input", function () {
      var r = rate(input.value);
      $("meter").dataset.score = String(r[0]);
      $("meter-text").textContent = r[1];
      $("meter-text").classList.toggle("good", r[0] >= 3);
    });
  }

  if (kind === "register") {
    var email = $("email");
    requestForm($("form"), email, $("msg"), Object.assign(function (address) {
      return post("/register", {email: address, accept_tos: true});
    }, {check: function () {
      if ($("tos").checked) return true;
      show($("msg"), "Accept the Terms to continue.", true); shake($("tos-row")); return false;
    }}));
    wireSent(function (address) { return post("/register", {email: address, accept_tos: true}); }, "stage-form", email);
    return;
  }

  if (kind === "verify-email") {
    var requestEmail = function (address) { return post("/verification/request", {email: address}); };
    var proofForm = $("proof-form");
    requestForm($("request-form"), $("email"), $("msg"), requestEmail);
    wireSent(requestEmail, "stage-request", $("email"));
    wirePassword();
    var enter = function (initial) {
      $("proof-msg").hidden = true; $("new-link").hidden = true;
      if (validToken) {
        proofForm.reset(); $("meter").dataset.score = "0"; $("meter-text").textContent = rate("")[1];
        if (initial) stages.forEach(function (s) { s.hidden = s.id !== "stage-password"; });
        else stage("stage-password");
        $("password").focus({preventScroll: true});
        return;
      }
      if (!initial) stage("stage-request");
      if (token) { show($("msg"), "This verification link is invalid. Request a new email.", true); return; }
      try {
        $("email").value = sessionStorage.getItem("jev-verification-email") || "";
        // Register pages cached from before email-first sign-up land here after sending.
        if (sessionStorage.getItem("jev-verification-sent") && $("email").value) {
          sessionStorage.removeItem("jev-verification-sent");
          sent($("email").value);
        }
      } catch (e) {}
    };
    enter(true);
    document.documentElement.removeAttribute("data-token");
    // Email links can change only the fragment of an already-open verification
    // page; that navigation does not reload the document or rerun its head script.
    window.addEventListener("hashchange", function () {
      if (!location.hash) return;
      token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
      history.replaceState(null, "", location.pathname);
      validToken = TOKEN.test(token);
      clearInterval(timer);
      enter(false);
    });
    proofForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var input = $("password"), password = input.value;
      if (!validToken) return;
      if (password.length < 8) { $("meter").dataset.score = "1"; $("meter-text").textContent = rate(password || " ")[1]; shake(input); input.focus(); return; }
      var button = proofForm.querySelector("button[type=submit]");
      busy(button, true);
      try {
        var r = await post("/verification/complete", {token: token, password: password});
        if (!r.ok) {
          show($("proof-msg"), r.data.message || "Could not complete this request.", true);
          if (r.status === 400) $("new-link").hidden = false;
          shake(proofForm); return;
        }
        token = ""; validToken = false; proofForm.reset();
        try { sessionStorage.removeItem("jev-verification-email"); } catch (e) {}
        if (r.data.signed_in) {
          if (channel && r.data.user) channel.postMessage({type: "signed-in", email: r.data.user.email});
          finish();
        } else {
          $("done-heading").textContent = "Account ready";
          $("done-text").textContent = r.data.message || "Sign in with your new password.";
          $("progress").hidden = true;
          $("done-link").href = "/login/"; $("done-link").textContent = "Log in";
          stage("stage-done");
        }
      } catch (e) { show($("proof-msg"), OFFLINE, true); }
      finally { busy(button, false); }
    });
    return;
  }

  // ---- forgot-password / reset-password ----
  var msg = $("msg");
  var resetForm = $("proof-form");
  if (kind === "forgot-password") {
    requestForm($("request-form"), $("email"), msg, Object.assign(function (address) {
      return post("/password/forgot", {email: address});
    }, {done: function (address, r) { show(msg, r.data.message || "Done."); }}));
  }
  if (kind === "reset-password") {
    resetForm.hidden = !validToken;
    if (!validToken) show(msg, "This reset link is missing or invalid. Request a new email using Forgot password.", true);
    window.addEventListener("hashchange", function () {
      if (!location.hash) return;
      token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
      history.replaceState(null, "", location.pathname);
      validToken = TOKEN.test(token);
      morph(function () {
        resetForm.hidden = !validToken; resetForm.reset();
        $("signin-next").hidden = true; msg.hidden = true;
      });
      if (!validToken) show(msg, "This link is invalid. Request a new email.", true);
    });
    resetForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!validToken) return;
      if (!resetForm.reportValidity()) { shake(resetForm); return; }
      var password = $("password").value, confirmation = $("password-confirm").value;
      if (password !== confirmation) { show(msg, "Passwords do not match.", true); shake($("password-confirm")); return; }
      var button = resetForm.querySelector("button[type=submit]");
      busy(button, true);
      try {
        var r = await post("/password/reset", {token: token, password: password, password_confirm: confirmation});
        if (!r.ok) { show(msg, r.data.message || "Could not complete this request.", true); shake(resetForm); return; }
        token = ""; validToken = false;
        morph(function () {
          resetForm.reset(); resetForm.hidden = true;
          show(msg, r.data.message || "Done.");
          $("signin-next").hidden = false;
        });
      } catch (e) { show(msg, OFFLINE, true); }
      finally { busy(button, false); }
    });
  }
})();
