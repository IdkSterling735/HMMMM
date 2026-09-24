/**
 * Presence heartbeat off the UI thread (emulators can freeze the main thread).
 */
(function () {
  var ENDPOINT = "/online/ping.php";
  var INTERVAL_MS = 30000;
  var oid = "";

  function ping() {
    try {
      var body = oid ? "id=" + encodeURIComponent(oid) : "";
      fetch(ENDPOINT, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body,
      })
        .then(function (res) {
          return res.ok ? res.json() : null;
        })
        .then(function (data) {
          if (data && typeof data.n === "number") {
            try {
              postMessage({ n: data.n });
            } catch (e) {}
          }
        })
        .catch(function () {});
    } catch (e) {}
  }

  self.onmessage = function (e) {
    if (e && e.data && typeof e.data.id === "string") oid = e.data.id;
    ping();
  };

  ping();
  setInterval(ping, INTERVAL_MS);
})();
