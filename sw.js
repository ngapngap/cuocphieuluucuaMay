/* Shell installation is independent of optional world downloads. */
importScripts("js/packages.js");
var cachePrefix = "may-phieu-luu-" + encodeURIComponent(new URL(self.registration.scope).pathname) + "-";
var CACHE = cachePrefix + "v16";
var legacyCache = "may-phieu-luu-v15-biome-bonus-1";
var SHELL = [
  "./", "index.html", "style.css", "three.min.js",
  "game.js", "manifest.json", "favicon.ico", "js/data.js",
  "js/audio.js", "js/packages.js", "js/core.js", "js/pbr.js",
  "js/vfx.js", "js/outfit-color.js", "js/player.js", "js/systems.js", "js/replays.js", "js/biome-bonus.js", "js/journey-scene.js", "js/journey-clearing.js", "js/journey.js", "js/story.js",
  "js/cutscene.js", "js/levels/hub.js", "js/levels/level1_ocean.js", "js/levels/level2_forest.js",
  "js/levels/level3_desert.js", "js/levels/level4_crystal.js", "js/levels/level5_snow.js", "js/levels/level6_clouds.js",
  "icons/icon-192.png", "icons/icon-512.png"
];
var SHARED_MEDIA = [
  "assets/img/hero.jpg",
  "assets/img/butterfly-wing.webp",
  "assets/img/horizon-reef.webp", "assets/img/horizon-forest.webp", "assets/img/horizon-desert.webp",
  "assets/img/horizon-cavern.webp", "assets/img/horizon-snow.webp", "assets/img/horizon-clouds.webp",
  "assets/img/outfit-preview-vayhong.webp", "assets/img/outfit-preview-haibim.webp", "assets/img/outfit-preview-muvang.webp",
  "assets/img/outfit-preview-rungxanh.webp", "assets/img/outfit-preview-tuyetbong.webp", "assets/img/outfit-preview-cauvong.webp",
  "assets/img/tex-caustics.jpg", "assets/img/tex-fan.jpg", "assets/img/tex-fanalpha.jpg", "assets/img/tex-pano.jpg",
  "assets/img/tex-rock.jpg", "assets/img/tex-sand.jpg", "assets/img/tex-wood.jpg", "assets/voice/hub.mp3",
  "assets/voice/level1.mp3", "assets/voice/level2.mp3", "assets/voice/level3.mp3", "assets/voice/level4.mp3",
  "assets/voice/level5.mp3", "assets/voice/level6.mp3", "assets/voice/item.mp3", "assets/voice/item_done.mp3",
  "assets/voice/friend.mp3", "assets/voice/pet.mp3", "assets/voice/chest.mp3", "assets/voice/souvenir.mp3",
  "assets/voice/interact.mp3", "assets/voice/hidden.mp3", "assets/voice/hidden_hint.mp3", "assets/voice/ring.mp3",
  "assets/voice/race_start.mp3", "assets/voice/race_win.mp3", "assets/voice/race_timeout.mp3", "assets/voice/quiz_open.mp3",
  "assets/voice/quiz_ok.mp3", "assets/voice/quiz_wrong.mp3", "assets/voice/gem_ready.mp3", "assets/voice/gem_win.mp3",
  "assets/voice/finale.mp3", "assets/voice/land.mp3", "assets/voice/water.mp3", "assets/voice/wind_save.mp3",
  "assets/voice/voice_on.mp3", "assets/voice/outfit.mp3", "assets/voice/skill_unlock.mp3", "assets/voice/tree_revive.mp3",
  "assets/voice/launch_sky.mp3", "assets/voice/mirror_beam.mp3", "assets/voice/ice_bridge.mp3", "assets/voice/crystal_break.mp3",
  "assets/voice/boss_appear.mp3", "assets/voice/boss_hit.mp3", "assets/voice/boss_win.mp3", "assets/voice/npc_hub.mp3",
  "assets/voice/npc_ch1.mp3", "assets/voice/npc_ch2.mp3", "assets/voice/npc_ch3.mp3", "assets/voice/npc_ch4.mp3",
  "assets/voice/npc_ch5.mp3", "assets/voice/npc_ch6.mp3"
];
var pending = new Map();
var downloading = new Map();
var unfinishedVariants = new Set();
var previous;
function previousCaches() {
  if (!previous) previous = (async function () {
    var keys = await caches.keys(), result = [];
    for (var name of keys.reverse()) {
      if (name === CACHE || !(name.startsWith(cachePrefix) || name === legacyCache)) continue;
      var old = await caches.open(name);
      if (await old.match(new URL("index.html", self.registration.scope))) result.push({ name: name, cache: old });
    }
    return result;
  })();
  return previous;
}
async function previousFile(url) {
  for (var entry of await previousCaches()) {
    var file = await entry.cache.match(url);
    if (file) return file;
  }
}
async function retirePrevious() {
  for (var entry of await previousCaches()) {
    if (entry.name === legacyCache) {
      // Earlier builds shared a cache name across different Pages repositories.
      var keys = await entry.cache.keys();
      if (keys.some(function (request) { return !request.url.startsWith(self.registration.scope); })) {
        await Promise.all(keys.filter(function (request) { return request.url.startsWith(self.registration.scope); })
          .map(function (request) { return entry.cache.delete(request); }));
        continue;
      }
    }
    await caches.delete(entry.name);
  }
  previous = Promise.resolve([]);
}
function cachedFile(cache, url, requireStorage) {
  url = new URL(url, self.registration.scope).href;
  if (!pending.has(url)) {
    pending.set(url, cache.match(url).then(async function (hit) {
      if (hit) return { response: hit };
      var old = await previousFile(url), headers = new Headers();
      if (old && old.headers.has("ETag")) headers.set("If-None-Match", old.headers.get("ETag"));
      else if (old && old.headers.has("Last-Modified")) headers.set("If-Modified-Since", old.headers.get("Last-Modified"));
      var response = await fetch(url, { headers: headers, cache: old ? "no-cache" : "default" });
      if (response.status === 304 && old) response = old;
      if (response.status !== 200) throw new Error(url);
      try { await cache.put(url, response.clone()); }
      catch (error) { return { response: response, storageError: error }; }
      return { response: response };
    }).finally(function () { pending.delete(url); }));
  }
  return pending.get(url).then(function (result) {
    if (requireStorage && result.storageError) throw result.storageError;
    if (!requireStorage) return result.response.clone();
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

async function report(audio, packed, text, paused) {
  var clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.filter(function (client) { return client.url.startsWith(self.registration.scope); })
    .forEach(function (client) { client.postMessage({ type: "offline-progress", audio: audio, packed: packed, text: text, paused: !!paused }); });
}
async function cacheWorlds(first, audio, packed, variant) {
  unfinishedVariants.add(variant);
  var cache = await caches.open(CACHE);
  var models = MayPackages.models;
  var order = ["common", first].concat(Object.keys(models));
  var urls = new Set();
  order.forEach(function (id) {
    if (!Object.prototype.hasOwnProperty.call(models, id)) return;
    models[id].forEach(function (name) {
      urls.add((packed && MayPackages.modelGzipURL(name)) || MayPackages.modelURL(name));
    });
    (MayPackages.guides[id] || []).forEach(function (key) { urls.add("assets/voice/" + key + ".mp3"); });
    if (id !== "common") urls.add("assets/audio/amb_" + id + "." + audio);
  });
  SHARED_MEDIA.forEach(function (url) { urls.add(url); });
  var count = 0;
  try {
    for (var url of urls) {
      if (count % 8 === 0) await report(audio, packed, "Đang lưu để chơi ngoại tuyến (" + count + "/" + urls.size + ")…");
      await cachedFile(cache, url, true);
      count++;
    }
    unfinishedVariants.delete(variant);
    if (!unfinishedVariants.size) await retirePrevious();
    await report(audio, packed, "Sẵn sàng chơi ngoại tuyến cả sáu chương.");
  } catch (error) {
    var message = error.name === "QuotaExceededError" ? "Bộ nhớ ngoại tuyến đã đầy. Giải phóng dung lượng rồi tiếp tục tải."
      : "Tải ngoại tuyến tạm dừng. Kết nối lại để tiếp tục.";
    await report(audio, packed, message, true);
  }
}
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "cache-worlds") {
    var audio = event.data.audio === "flac" ? "flac" : "wav";
    var packed = event.data.packed === true, variant = audio + (packed ? "-gzip" : "-raw");
    if (!downloading.has(variant)) downloading.set(variant, cacheWorlds(event.data.first, audio, packed, variant).finally(function () { downloading.delete(variant); }));
    event.waitUntil(downloading.get(variant));
  }
});

async function mediaRange(response, header) {
  var range = /^bytes=(\d*)-(\d*)$/.exec(header || "");
  if (!range || (!range[1] && !range[2])) return response;
  var blob = await response.blob();
  var end = range[1] && range[2] ? Math.min(Number(range[2]), blob.size - 1) : blob.size - 1;
  var start = range[1] ? Number(range[1]) : Math.max(0, blob.size - Number(range[2]));
  if (start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + blob.size } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: { "Content-Type": blob.type, "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes", "Content-Range": "bytes " + start + "-" + end + "/" + blob.size }
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== "GET" || !url.href.startsWith(self.registration.scope)) return;
  var key = url.origin + url.pathname;
  if (request.mode === "navigate" || /\.(html|js|css|json)$/i.test(url.pathname)) {
    event.respondWith((async function () {
      var cache = await caches.open(CACHE);
      try {
        var response = await fetch(request);
        if (response.status === 200) {
          try { await cache.put(key, response.clone()); } catch (error) { /* Still serve the live page. */ }
        } else if (response.status >= 500 || response.status === 408) {
          return await cache.match(key) || response;
        }
        return response;
      } catch (error) {
        return await cache.match(key) || (request.mode === "navigate" && await cache.match("index.html")) || Response.error();
      }
    })());
  } else {
    event.respondWith(caches.open(CACHE).then(function (cache) { return cachedFile(cache, key); })
      .catch(function () { return previousFile(key); })
      .then(function (response) {
        return response ? mediaRange(response, request.headers.get("Range")) : new Response("", { status: 503, statusText: "Offline" });
      }));
  }
});
