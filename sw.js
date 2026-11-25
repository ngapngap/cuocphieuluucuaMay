/* Shell installation is independent of optional world downloads. */
importScripts("js/packages.js");
var CACHE = "may-phieu-luu-v14.0-5";
var SHELL = [
  "./", "index.html", "style.css", "three.min.js",
  "game.js", "manifest.json", "favicon.ico", "js/data.js",
  "js/audio.js", "js/packages.js", "js/core.js", "js/pbr.js",
  "js/vfx.js", "js/outfit-color.js", "js/player.js", "js/systems.js", "js/replays.js", "js/story.js",
  "js/cutscene.js", "js/levels/hub.js", "js/levels/level1_ocean.js", "js/levels/level2_forest.js",
  "js/levels/level3_desert.js", "js/levels/level4_crystal.js", "js/levels/level5_snow.js", "js/levels/level6_clouds.js",
  "icons/icon-192.png", "icons/icon-512.png"
];
var SHARED_MEDIA = [
  "assets/img/hero.jpg",
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
var downloading;
function cachedFile(cache, url) {
  url = new URL(url, self.registration.scope).href;
  if (!pending.has(url)) {
    pending.set(url, cache.match(url).then(async function (hit) {
      if (hit) return hit;
      var response = await fetch(url);
      if (response.status !== 200) throw new Error(url);
      await cache.put(url, response.clone());
      return response;
    }).finally(function () { pending.delete(url); }));
  }
  return pending.get(url).then(function (response) { return response.clone(); });
}

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.startsWith("may-phieu-luu-") && key !== CACHE;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

async function report(text, paused) {
  var clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(function (client) { client.postMessage({ type: "offline-progress", text: text, paused: !!paused }); });
}
async function cacheWorlds(first) {
  var cache = await caches.open(CACHE);
  var models = MayPackages.models;
  var order = ["common", first].concat(Object.keys(models));
  var urls = new Set();
  order.forEach(function (id) {
    if (!Object.prototype.hasOwnProperty.call(models, id)) return;
    models[id].forEach(function (name) { urls.add(MayPackages.modelURL(name)); });
    (MayPackages.guides[id] || []).forEach(function (key) { urls.add("assets/voice/" + key + ".mp3"); });
    if (id !== "common") urls.add("assets/audio/amb_" + id + ".wav");
  });
  SHARED_MEDIA.forEach(function (url) { urls.add(url); });
  var count = 0;
  try {
    for (var url of urls) {
      if (count % 8 === 0) await report("Đang lưu để chơi ngoại tuyến (" + count + "/" + urls.size + ")…");
      await cachedFile(cache, url);
      count++;
    }
    await report("Sẵn sàng chơi ngoại tuyến cả sáu chương.");
  } catch (error) {
    await report("Tải ngoại tuyến tạm dừng. Kết nối lại để tiếp tục.", true);
  }
}
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "cache-worlds") {
    if (!downloading) downloading = cacheWorlds(event.data.first).finally(function () { downloading = null; });
    event.waitUntil(downloading);
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
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  var key = url.origin + url.pathname;
  if (request.mode === "navigate" || /\.(html|js|css|json)$/i.test(url.pathname)) {
    event.respondWith((async function () {
      var cache = await caches.open(CACHE);
      try {
        var response = await fetch(request);
        if (response.status === 200) await cache.put(key, response.clone());
        return response;
      } catch (error) {
        return await cache.match(key) || (request.mode === "navigate" && await cache.match("index.html")) || Response.error();
      }
    })());
  } else {
    event.respondWith(caches.open(CACHE).then(function (cache) { return cachedFile(cache, key); })
      .then(function (response) { return mediaRange(response, request.headers.get("Range")); })
      .catch(function () { return new Response("", { status: 503, statusText: "Offline" }); }));
  }
});
