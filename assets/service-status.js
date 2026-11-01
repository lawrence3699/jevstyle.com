(function () {
  'use strict';
  var node = document.querySelector('[data-service-health]');
  if (!node) return;
  var controller = typeof AbortController === 'function' ? new AbortController() : null;
  var timeout = controller ? setTimeout(function () { controller.abort(); }, 7000) : null;
  function unknown() {
    node.textContent = 'Live health could not be verified in this page session. This does not establish that the service is down. Open the health endpoint or try again later.';
  }
  fetch('https://api.jevstyle.com/healthz', { cache: 'no-store', credentials: 'omit', signal: controller ? controller.signal : undefined })
    .then(function (response) {
      if (!response.ok) throw new Error('Health response unavailable');
      return response.json();
    })
    .then(function (body) {
      if (!body || body.ok !== true || typeof body.inference_ready !== 'boolean') { unknown(); return; }
      var observed = new Date().toISOString();
      node.textContent = body.inference_ready
        ? 'Live health reports inference ready. Checked ' + observed + '. This readiness signal does not verify an end-to-end inference request.'
        : 'Live health reports inference not ready. Checked ' + observed + '. Local model inference is a separate path.';
    })
    .catch(unknown)
    .finally(function () { if (timeout !== null) clearTimeout(timeout); });
}());
