/**
 * Presence: ping /online/ping.php so homepage can show live visitors.
 */
(function () {
  try {
    var path = String(location.pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
    var portGame = path.indexOf('/ports/') === 0 && path !== '/ports' && path !== '/ports/index.html';
    if (portGame && window.top && window.top !== window) {
      window.top.location.replace(location.href);
      return;
    }
  } catch (e) {}

  if (window.__RGC_ONLINE_BOOT) return;
  window.__RGC_ONLINE_BOOT = true;

  var ENDPOINT = "/online/ping.php";
  var INTERVAL_MS = 30000;
  var timer = null;
  var lastN = null;

  function lang() {
    var btn = document.querySelector(".lang-btn.active");
    if (btn && btn.getAttribute("data-lang") === "en") return "en";
    try {
      var v = (localStorage.getItem("retro-lang") || "").slice(0, 2);
      if (v === "en") return "en";
    } catch (e) {}
    return "ru";
  }

  function randomId() {
    var out = "";
    try {
      var buf = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(buf);
      for (var i = 0; i < buf.length; i++) out += (buf[i] + 256).toString(16).slice(1);
      if (out.length === 32) return out;
    } catch (e) {}
    return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, function () {
      return ((Math.random() * 16) | 0).toString(16);
    });
  }

  function ensureId() {
    var id = "";
    try {
      id = localStorage.getItem("rgc_oid") || "";
    } catch (e) {}
    if (!/^[a-f0-9]{32}$/.test(id)) {
      try {
        id = sessionStorage.getItem("rgc_oid") || "";
      } catch (e2) {}
    }
    if (!/^[a-f0-9]{32}$/.test(id)) id = randomId();
    try {
      localStorage.setItem("rgc_oid", id);
    } catch (e3) {}
    try {
      sessionStorage.setItem("rgc_oid", id);
    } catch (e4) {}
    return id;
  }

  function paint(n) {
    lastN = n;
    var wrap = document.getElementById("rgcOnline");
    var num = document.getElementById("rgcOnlineCount");
    var label = document.getElementById("rgcOnlineLabel");
    if (!wrap || !num) return;
    num.textContent = String(n);
    if (label) label.textContent = lang() === "en" ? "ONLINE" : "ОНЛАЙН";
    wrap.hidden = false;
    wrap.setAttribute("aria-label", (lang() === "en" ? "Online now: " : "Сейчас на сайте: ") + n);
  }

  function applyCount(n) {
    if (typeof n !== "number") return;
    window.RGC_ONLINE = n;
    paint(n);
    try {
      window.dispatchEvent(new CustomEvent("rgc-online", { detail: n }));
    } catch (e) {}
  }

  function ping(keepalive) {
    var id = ensureId();
    var body = "id=" + encodeURIComponent(id);
    var opts = {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    };
    if (keepalive) opts.keepalive = true;
    return fetch(ENDPOINT, opts)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (data && typeof data.n === "number") applyCount(data.n);
      })
      .catch(function () {
        try {
          var x = new XMLHttpRequest();
          x.open("POST", ENDPOINT, true);
          x.withCredentials = true;
          x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          x.setRequestHeader("Accept", "application/json");
          x.onreadystatechange = function () {
            if (x.readyState !== 4 || x.status < 200 || x.status >= 300) return;
            try {
              var data = JSON.parse(x.responseText);
              if (data && typeof data.n === "number") applyCount(data.n);
            } catch (e) {}
          };
          x.send(body);
        } catch (e2) {}
      });
  }

  function beacon() {
    try {
      var id = ensureId();
      var payload = "id=" + encodeURIComponent(id);
      if (!navigator.sendBeacon) return ping(true);
      var blob = new Blob([payload], { type: "application/x-www-form-urlencoded" });
      if (!navigator.sendBeacon(ENDPOINT, blob)) ping(true);
    } catch (e) {
      ping(true);
    }
  }

  function startWorker() {
    if (!window.Worker) return;
    try {
      var worker = new Worker("/assets/rgc-online-worker.js?v=20260917-on3");
      worker.onmessage = function (e) {
        if (e && e.data && typeof e.data.n === "number") applyCount(e.data.n);
      };
      worker.postMessage({ id: ensureId() });
    } catch (e) {}
  }

  function loop() {
    ping(false);
    startWorker();
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      ping(false);
    }, INTERVAL_MS);
  }

  document.addEventListener("visibilitychange", function () {
    ping(false);
  });

  window.addEventListener("pagehide", beacon);
  window.addEventListener("freeze", beacon);

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest(".lang-btn");
    if (!btn || lastN == null) return;
    setTimeout(function () {
      paint(lastN);
    }, 0);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loop);
  } else {
    loop();
  }
})();
