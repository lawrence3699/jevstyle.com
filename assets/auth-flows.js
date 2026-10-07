(function () {
  "use strict";
  var token = window.__jevEmailToken || "";
  delete window.__jevEmailToken;
  var kind = document.body.dataset.authFlow;
  var CONTROL = "https://api.jevstyle.com/control/v1/auth";
  var requestForm = document.getElementById("request-form");
  var proofForm = document.getElementById("proof-form");
  var msg = document.getElementById("msg");
  var validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
  function show(text, error) {
    msg.textContent = text; msg.className = "msg" + (error ? " err" : ""); msg.hidden = false;
  }
  // Email links can change only the fragment of an already-open verification
  // page; that navigation does not reload the document or rerun its head script.
  window.addEventListener("hashchange", function () {
    if (!location.hash) return;
    token = new URLSearchParams(location.hash.slice(1)).get("token") || "";
    history.replaceState(null, "", location.pathname);
    validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
    if (kind === "verify-email" || kind === "reset-password") {
      if (requestForm) requestForm.hidden = validToken;
      proofForm.hidden = !validToken; proofForm.reset();
      document.getElementById("signin-next").hidden = true;
      msg.hidden = true;
      if (!validToken) show("This link is invalid. Request a new email.", true);
      if (validToken && kind === "verify-email") {
        document.getElementById("heading").textContent = "Verify your email";
        document.getElementById("intro").textContent = "Choose and confirm your password to verify your mailbox and secure your account.";
      }
    }
  });
  if (kind === "verify-email" && validToken) {
    requestForm.hidden = true; proofForm.hidden = false;
    document.getElementById("heading").textContent = "Verify your email";
    document.getElementById("intro").textContent = "Choose and confirm your password to verify your mailbox and secure your account.";
  } else if (kind === "reset-password") {
    proofForm.hidden = !validToken;
    if (!validToken) show("This reset link is missing or invalid. Request a new email using Forgot password.", true);
  } else if (kind === "verify-email") {
    try {
      document.getElementById("email").value = sessionStorage.getItem("jev-verification-email") || "";
      if (sessionStorage.getItem("jev-verification-sent")) show("Verification email requested. Check your inbox and spam folder, then open the newest link.");
      sessionStorage.removeItem("jev-verification-sent");
    } catch (e) {}
    if (token) show("This verification link is invalid. Request a new email.", true);
  }
  async function submit(form, path, body) {
    var button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      var response = await fetch(CONTROL + path, {method: "POST", credentials: "include", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
      var payload = await response.json();
      if (!response.ok) { show(payload.message || "Could not complete this request.", true); return false; }
      show(payload.message || "Done."); return true;
    } catch (e) { show("Can't reach the service. Please try again later.", true); return false; }
    finally { button.disabled = false; }
  }
  if (requestForm) requestForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    var email = document.getElementById("email").value.trim();
    await submit(requestForm, kind === "forgot-password" ? "/password/forgot" : "/verification/request", {email: email});
  });
  if (proofForm) proofForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!validToken || !proofForm.reportValidity()) return;
    var password = document.getElementById("password").value;
    var confirmation = document.getElementById("password-confirm").value;
    if (password !== confirmation) { show("Passwords do not match.", true); return; }
    var ok = await submit(proofForm, kind === "verify-email" ? "/verification/complete" : "/password/reset", {token: token, password: password, password_confirm: confirmation});
    if (ok) {
      token = ""; validToken = false; proofForm.reset(); proofForm.hidden = true;
      document.getElementById("signin-next").hidden = false;
    }
  });
})();
