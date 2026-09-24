/**
 * Cloud saves for RGC emulators and ports.
 * Always uses CloudSDKUI (with or without a key). Mount completes before games start.
 */
(function (global) {
  'use strict';
  if (global.__RGC_CLOUD_SAVES) return;
  global.__RGC_CLOUD_SAVES = true;

  (function injectOnline() {
    try {
      if (document.querySelector('script[src*="rgc-online.js"]')) return;
      var s = document.createElement('script');
    s.src = '/assets/rgc-online.js?v=20260917-on4';
      s.async = true;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  })();

  var SDK_SRC = '/assets/jsdos-cloud-sdk.js?v=20260906-psx1';
  var readyResolve;
  var ready = new Promise(function (resolve) { readyResolve = resolve; });
  var started = false;
  var hideWidget = null;
  var hookedFs = [];
  var hookedIdbfs = [];
  var hookedRR = false;
  var hookedStorage = false;
  var wasmGated = false;
  var ejsStatePull = null;
  var ejsStateTried = '';
  var restoringEjs = false;
  var autoLoadedEjs = false;
  var emuWatched = false;
  var EJS_INVALID_NAME = /[#<$+%>!`&*'|{}/\\?"=@:^\r\n]/g;
  var EJS_GENERIC_NAMES = {
    psxtg: 1,
    psx: 1,
    game: 1,
    'sega saturn': 1
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing && global.CloudSDKUI) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function cloudName(suffix) {
    var path = '';
    try { path = String(location.pathname || '/'); } catch (e) { path = '/'; }
    return ('rgc' + path + suffix).replace(/[^a-zA-Z0-9._-]+/g, '_') + '.bin';
  }

  function idbfsFileName(dbName) {
    if (dbName === '/data/saves') return 'rgc.ejs.data.saves.idbfs';
    return cloudName('idbfs' + String(dbName || ''));
  }

  function isIdbfsType(type) {
    return !!(type && (type.DB_STORE_NAME === 'FILE_DATA' || type.dbs || type.DB_VERSION === 21));
  }

  function pullIdbfs(dbName) {
    if (!global.CloudSDKUI || !dbName) return Promise.resolve(false);
    return global.CloudSDKUI.pullIDBFSStorage(idbfsFileName(dbName), dbName).catch(function () {
      return false;
    });
  }

  function pushIdbfs(dbName) {
    if (!global.CloudSDKUI || !dbName) return Promise.resolve(false);
    return global.CloudSDKUI.pushIDBFSStorage(idbfsFileName(dbName), dbName).catch(function () {
      return false;
    });
  }

  function toUint8(data) {
    if (!data) return null;
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (data.buffer && typeof data.byteLength === 'number') {
      return new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength);
    }
    if (data.data) return toUint8(data.data);
    return null;
  }

  function hookIDBFS(IDBFS) {
    if (!IDBFS || IDBFS.__rgcCloudHook) return;
    if (typeof IDBFS.syncfs !== 'function') return;
    IDBFS.__rgcCloudHook = true;
    hookedIdbfs.push(IDBFS);
    var orig = IDBFS.syncfs.bind(IDBFS);
    IDBFS.syncfs = function (mount, populate, callback) {
      var dbName = mount && mount.mountpoint;
      if (typeof populate === 'function') {
        callback = populate;
        populate = false;
      }
      callback = callback || function () {};
      if (populate) {
        pullIdbfs(dbName).then(function () {
          orig(mount, true, callback);
        }, function () {
          orig(mount, true, callback);
        });
        return;
      }
      orig(mount, false, function (err) {
        pushIdbfs(dbName);
        callback(err);
      });
    };
  }

  function hookFS(FS) {
    if (!FS || hookedFs.indexOf(FS) !== -1) return;
    hookedFs.push(FS);
    if (FS.filesystems && FS.filesystems.IDBFS) hookIDBFS(FS.filesystems.IDBFS);
    if (FS.__rgcMountHook) return;
    FS.__rgcMountHook = true;
    if (typeof FS.mount !== 'function') return;
    var origMount = FS.mount.bind(FS);
    FS.mount = function (type, opts, mountpoint) {
      if (isIdbfsType(type)) hookIDBFS(type);
      return origMount(type, opts, mountpoint);
    };
  }

  function watchModule(mod) {
    if (!mod) return;
    if (mod.FS) hookFS(mod.FS);
    if (mod.IDBFS) hookIDBFS(mod.IDBFS);
    if (mod.__rgcCloudOri) return;
    mod.__rgcCloudOri = true;
    var user = mod.onRuntimeInitialized;
    mod.onRuntimeInitialized = function () {
      if (mod.FS) hookFS(mod.FS);
      if (mod.IDBFS) hookIDBFS(mod.IDBFS);
      if (typeof user === 'function') return user.apply(this, arguments);
    };
    if (Array.isArray(mod.preRun)) {
      mod.preRun.unshift(function () {
        if (mod.FS) hookFS(mod.FS);
      });
    }
  }

  function gateWasm() {
    if (wasmGated || typeof WebAssembly === 'undefined') return;
    wasmGated = true;
    function wrap(orig) {
      if (typeof orig !== 'function') return orig;
      return function () {
        var ctx = this;
        var args = arguments;
        return ready.then(function () {
          return orig.apply(ctx, args);
        });
      };
    }
    if (WebAssembly.instantiate) {
      WebAssembly.instantiate = wrap(WebAssembly.instantiate.bind(WebAssembly));
    }
    if (WebAssembly.instantiateStreaming) {
      WebAssembly.instantiateStreaming = wrap(WebAssembly.instantiateStreaming.bind(WebAssembly));
    }
  }

  function uniquePush(list, value) {
    if (!value) return;
    value = String(value);
    if (list.indexOf(value) === -1) list.push(value);
  }

  function asStateKey(name) {
    if (!name) return '';
    name = String(name);
    return /\.state$/i.test(name) ? name : name + '.state';
  }

  function stateNameCore(name) {
    return String(name || '').replace(/\.state$/i, '').replace(EJS_INVALID_NAME, '').trim().toLowerCase();
  }

  function isGenericStateName(name) {
    var core = stateNameCore(name);
    return !core || EJS_GENERIC_NAMES[core] === 1;
  }

  function ejsLocalStateKeys() {
    var keys = [];
    function add(name) {
      if (!name || isGenericStateName(name)) return;
      uniquePush(keys, asStateKey(name));
    }
    var gameName = '';
    try { gameName = String(global.EJS_gameName || ''); } catch (e) {}
    add(gameName);
    if (gameName) add(gameName.replace(EJS_INVALID_NAME, '').trim());
    try {
      var emu = global.EJS_emulator;
      if (emu && emu.started && typeof emu.getBaseFileName === 'function') {
        try { add(emu.getBaseFileName()); } catch (e2) {}
      }
    } catch (e3) {}
    return keys;
  }

  function ejsCloudName(key) {
    return 'rgc.ejs.states.' + String(key).replace(/[^a-zA-Z0-9._-]+/g, '_');
  }

  function ejsCloudNames(localKeys) {
    var names = [];
    (localKeys || ejsLocalStateKeys()).forEach(function (key) {
      uniquePush(names, ejsCloudName(key));
    });
    return names;
  }

  function pullEjsState() {
    if (!global.CloudSDKUI || !global.EJS_STORAGE) return Promise.resolve();
    return ready.then(function () {
      var keys = ejsLocalStateKeys();
      if (!keys.length) return null;
      var stamp = keys.join('\n');
      if (ejsStatePull) return ejsStatePull;
      if (ejsStateTried === stamp) return null;
      var store = new global.EJS_STORAGE('EmulatorJS-states', 'states');
      var found = null;
      var foundKey = null;
      ejsStateTried = stamp;
      ejsStatePull = keys.reduce(function (chain, key) {
        return chain.then(function () {
          if (found) return found;
          return global.CloudSDKUI.pullFromStorage(ejsCloudName(key)).then(function (payload) {
            if (payload) {
              found = payload;
              foundKey = key;
            }
            return found;
          }).catch(function () { return found; });
        });
      }, Promise.resolve());
      return ejsStatePull.then(function () {
        ejsStatePull = null;
        if (!found || !foundKey) return null;
        restoringEjs = true;
        return store.put(foundKey, found).then(function () {
          restoringEjs = false;
          return found;
        }, function () {
          restoringEjs = false;
          return found;
        });
      });
    });
  }

  function skipAutoLoad() {
    try {
      var params = new URLSearchParams(location.search);
      if (params.get('netplay_join') || params.get('netplay_create')) return true;
    } catch (e) {}
    try {
      var emu = global.EJS_emulator;
      if (emu && emu.isNetplay) return true;
    } catch (e2) {}
    return false;
  }

  function autoLoadEjsState(emu) {
    if (autoLoadedEjs || skipAutoLoad()) return Promise.resolve();
    emu = emu || global.EJS_emulator;
    if (!emu || !emu.started || !emu.gameManager || typeof emu.gameManager.loadState !== 'function') {
      return Promise.resolve();
    }
    if (!emu.storage || !emu.storage.states || typeof emu.storage.states.get !== 'function') {
      return Promise.resolve();
    }
    var keys = ejsLocalStateKeys();
    var i = 0;
    function next() {
      if (i >= keys.length) return Promise.resolve();
      var key = keys[i++];
      return emu.storage.states.get(key).then(function (state) {
        var bytes = toUint8(state);
        if (!bytes || !bytes.byteLength) return next();
        autoLoadedEjs = true;
        try { emu.gameManager.loadState(bytes); } catch (e) { autoLoadedEjs = false; }
      }).catch(function () { return next(); });
    }
    return next();
  }

  function watchEmulator(emu) {
    if (!emu || emu.__rgcCloudWatch) return;
    emu.__rgcCloudWatch = true;
    function onStarted() {
      try {
        if (emu.gameManager && typeof emu.gameManager.loadSaveFiles === 'function') {
          emu.gameManager.loadSaveFiles();
        }
      } catch (e) {}
      pullEjsState().then(function () {
        return autoLoadEjsState(emu);
      }).catch(function () {});
    }
    if (typeof emu.on === 'function') {
      emu.on('start', onStarted);
    }
    if (emu.started) onStarted();
  }

  function hookEjsStorage() {
    if (hookedStorage || !global.EJS_STORAGE || !global.EJS_STORAGE.prototype) return;
    hookedStorage = true;
    var proto = global.EJS_STORAGE.prototype;
    var origPut = proto.put;
    proto.put = function (key, data) {
      var self = this;
      var ret = origPut.call(self, key, data);
      if (restoringEjs) return ret;
      if (self.dbName === 'EmulatorJS-states' && key && String(key).indexOf('?') !== 0) {
        var bytes = toUint8(data);
        if (bytes && global.CloudSDKUI) {
          Promise.resolve(ret).then(function () {
            var names = ejsCloudNames([asStateKey(key)]);
            return names.reduce(function (chain, name) {
              return chain.then(function () {
                return global.CloudSDKUI.pushToStorage(name, bytes);
              });
            }, Promise.resolve());
          }).catch(function () {});
        }
      }
      return ret;
    };
  }

  function packFiles(map) {
    var names = Object.keys(map);
    var enc = new TextEncoder();
    var parts = [];
    var total = 8;
    names.forEach(function (name) {
      var n = enc.encode(name);
      var d = map[name];
      total += 8 + n.length + d.length;
      parts.push({ n: n, d: d });
    });
    var out = new Uint8Array(total);
    var view = new DataView(out.buffer);
    view.setUint32(0, 0x52474331, true);
    view.setUint32(4, names.length, true);
    var off = 8;
    parts.forEach(function (p) {
      view.setUint32(off, p.n.length, true); off += 4;
      out.set(p.n, off); off += p.n.length;
      view.setUint32(off, p.d.length, true); off += 4;
      out.set(p.d, off); off += p.d.length;
    });
    return out;
  }

  function unpackFiles(buf) {
    var view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    if (buf.byteLength < 8 || view.getUint32(0, true) !== 0x52474331) return {};
    var count = view.getUint32(4, true);
    var dec = new TextDecoder();
    var off = 8;
    var out = {};
    for (var i = 0; i < count; i++) {
      var nl = view.getUint32(off, true); off += 4;
      var name = dec.decode(buf.subarray(off, off + nl)); off += nl;
      var dl = view.getUint32(off, true); off += 4;
      out[name] = buf.slice(off, off + dl); off += dl;
    }
    return out;
  }

  function filesFromFs(Module) {
    var map = {};
    if (!Module || !Module.FS || typeof Module.FS.readdir !== 'function') return map;
    var names;
    try { names = Module.FS.readdir('/'); } catch (e) { return map; }
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (!n || n === '.' || n === '..') continue;
      if (!/\.(sav|esv|dmo|cfg)$/i.test(n)) continue;
      try {
        var st = Module.FS.stat('/' + n);
        if (st && (st.mode & 61440) === 32768 && st.size < 8 * 1024 * 1024) {
          map[n] = Module.FS.readFile('/' + n);
        }
      } catch (e2) {}
    }
    return map;
  }

  function writeFilesToFs(Module, map) {
    if (!Module || !Module.FS || !map) return;
    Object.keys(map).forEach(function (name) {
      try { Module.FS.writeFile('/' + name, map[name]); } catch (e) {}
    });
  }

  var rrPullCache = null;
  var rrPullStarted = false;

  function pullRRSaves() {
    if (rrPullStarted) return Promise.resolve(rrPullCache);
    rrPullStarted = true;
    if (!global.CloudSDKUI) return Promise.resolve(null);
    return global.CloudSDKUI.pullFromStorage(cloudName('rrsaves')).then(function (payload) {
      if (payload) rrPullCache = unpackFiles(payload);
      return rrPullCache;
    }).catch(function () {
      return null;
    });
  }

  function hookRRSaves() {
    var rr = global.RRSaves;
    if (!rr || hookedRR) return;
    hookedRR = true;
    var origPrefetch = rr.prefetch;
    var origLoad = rr.loadIntoFs;
    var origPersist = rr.persistFromFs;
    var origAttach = rr.attach;

    if (typeof origPrefetch === 'function') {
      rr.prefetch = function () {
        return pullRRSaves().then(function () {
          return origPrefetch.apply(rr, arguments);
        });
      };
    }
    if (typeof origLoad === 'function') {
      rr.loadIntoFs = function (Module, done) {
        origLoad(Module, function () {
          if (rrPullCache) writeFilesToFs(Module, rrPullCache);
          if (done) done();
        });
      };
    }
    if (typeof origPersist === 'function') {
      rr.persistFromFs = function (Module, done) {
        origPersist(Module, function () {
          try {
            var packed = packFiles(filesFromFs(Module));
            if (packed && global.CloudSDKUI) {
              global.CloudSDKUI.pushToStorage(cloudName('rrsaves'), packed);
            }
          } catch (e) {}
          if (done) done();
        });
      };
    }
    if (typeof origAttach === 'function') {
      rr.attach = function (Module) {
        origAttach(Module);
        watchModule(Module);
      };
    }
  }

  function scanHooks() {
    try {
      if (global.FS) hookFS(global.FS);
      if (global.IDBFS) hookIDBFS(global.IDBFS);
      if (global.Module) watchModule(global.Module);
      hookEjsStorage();
      hookRRSaves();
      watchEmulator(global.EJS_emulator);
      if (global.EJS_gameUrl && global.EJS_STORAGE) pullEjsState();
    } catch (e) {}
  }

  function installPropertyWatch() {
    try {
      var current = global.Module;
      Object.defineProperty(global, 'Module', {
        configurable: true,
        enumerable: true,
        get: function () { return current; },
        set: function (v) {
          current = v;
          watchModule(v);
        }
      });
      if (current) watchModule(current);
    } catch (e) {
      watchModule(global.Module);
    }
    if (emuWatched) return;
    emuWatched = true;
    try {
      var emu = global.EJS_emulator;
      Object.defineProperty(global, 'EJS_emulator', {
        configurable: true,
        enumerable: true,
        get: function () { return emu; },
        set: function (v) {
          emu = v;
          watchEmulator(v);
        }
      });
      if (emu) watchEmulator(emu);
    } catch (e2) {
      watchEmulator(global.EJS_emulator);
    }
  }

  function whenBodyReady() {
    return new Promise(function (resolve) {
      if (document.body) {
        resolve();
        return;
      }
      document.addEventListener('DOMContentLoaded', function () {
        resolve();
      }, { once: true });
      var n = 0;
      var t = setInterval(function () {
        if (document.body || ++n > 200) {
          clearInterval(t);
          resolve();
        }
      }, 25);
    });
  }

  function patchMountToWaitForBody() {
    if (!global.CloudSDKUI || typeof global.CloudSDKUI.mount !== 'function') return;
    if (global.CloudSDKUI.__rgcPatchedMount) return;
    global.CloudSDKUI.__rgcPatchedMount = true;
    var orig = global.CloudSDKUI.mount.bind(global.CloudSDKUI);
    global.CloudSDKUI.mount = function () {
      return whenBodyReady().then(function () {
        return orig();
      }).then(function (hide) {
        extraWidgetCss();
        keepWidgetInBody();
        return hide;
      });
    };
  }

  function keepWidgetInBody() {
    if (global.__rgcCloudKeepWidget) return;
    global.__rgcCloudKeepWidget = true;
    setInterval(function () {
      var el = document.getElementById('cloud-saves');
      if (el && document.body && el.parentNode !== document.body) {
        document.body.appendChild(el);
      }
    }, 500);
  }

  function extraWidgetCss() {
    if (document.getElementById('rgc-cloud-saves-css')) return;
    var style = document.createElement('style');
    style.id = 'rgc-cloud-saves-css';
    style.textContent = [
      '#cloud-saves{',
      'position:fixed!important;',
      'top:12px!important;',
      'left:50%!important;',
      'transform:translateX(-50%)!important;',
      'z-index:2147483000!important;',
      'pointer-events:auto!important;',
      '}',
      '#cloud-saves:empty{',
      'display:none!important;',
      'pointer-events:none!important;',
      '}'
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureSdk() {
    if (global.CloudSDKUI) return Promise.resolve();
    return loadScript(SDK_SRC);
  }

  function start() {
    if (started) return ready;
    started = true;
    gateWasm();
    try { installPropertyWatch(); } catch (e) {}
    setInterval(scanHooks, 200);
    scanHooks();

    ensureSdk().then(function () {
      if (!global.CloudSDKUI || typeof global.CloudSDKUI.mount !== 'function') {
        readyResolve();
        return;
      }
      patchMountToWaitForBody();
      return global.CloudSDKUI.mount().then(function (hide) {
        hideWidget = hide;
        extraWidgetCss();
        keepWidgetInBody();
        scanHooks();
        readyResolve();
      });
    }).catch(function (e) {
      console.warn('[RGC cloud]', e);
      readyResolve();
    });

    function flushSaves() {
      try {
        var emu = global.EJS_emulator;
        if (emu && emu.started && emu.gameManager && typeof emu.gameManager.saveSaveFiles === 'function') {
          emu.gameManager.saveSaveFiles();
        }
      } catch (e) {}
    }
    global.addEventListener('pagehide', flushSaves);
    global.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushSaves();
    });
    return ready;
  }

  global.RGCCloud = {
    ready: ready,
    ensure: function () { return start(); },
    pullEjsState: pullEjsState,
    hide: function () { if (typeof hideWidget === 'function') hideWidget(); }
  };

  start();
})(typeof window !== 'undefined' ? window : this);
