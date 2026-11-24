/* Cuộc Phiêu Lưu Của Mây v13.1 — offline cache (PWA). Network-first cho code, cache-first cho model/ảnh/giọng đọc/ambience. */
var CACHE = 'may-phieu-luu-v13.1';
var CORE = [
  "./", "index.html", "style.css", "three.min.js", "game.js", "manifest.json", "favicon.ico",
  "js/data.js", "js/audio.js", "js/core.js", "js/pbr.js", "js/vfx.js", "js/player.js", "js/systems.js", "js/story.js", "js/cutscene.js",
  "js/levels/hub.js", "js/levels/level1_ocean.js", "js/levels/level2_forest.js",
  "js/levels/level3_desert.js", "js/levels/level4_crystal.js", "js/levels/level5_snow.js",
  "js/levels/level6_clouds.js",
  "icons/icon-192.png", "icons/icon-512.png",
  "assets/audio/amb_hub.wav", "assets/audio/amb_level1.wav", "assets/audio/amb_level2.wav",
  "assets/audio/amb_level3.wav", "assets/audio/amb_level4.wav", "assets/audio/amb_level5.wav", "assets/audio/amb_level6.wav",
  "assets/models/may_rigged.glb", "assets/models/companion_milo.glb",
  "assets/models/npc_tortoise_elder.glb", "assets/models/boss_mushroom_king.glb",
  "assets/models/boss_crystal_golem.glb", "assets/models/boss_storm_king.glb",
  "assets/models/hero_lighthouse.glb", "assets/models/hero_castle.glb",
  "assets/models/cc0_cabin.glb", "assets/models/cc0_windmill.glb",
  "assets/models/cc0_shipwreck.glb", "assets/models/cc0_boat.glb",
  "assets/models/cc0_fox.glb", "assets/models/cc0_deer.glb",
  "assets/models/cc0_reindeer.glb", "assets/models/cc0_unicorn.glb",
  "assets/models/cc0_alpaca.glb", "assets/models/cc0_crab.glb",
  "assets/models/cc0_dolphin.glb", "assets/models/cc0_whale.glb",
  "assets/models/cc0_clownfish.glb",
  "assets/models/amphora.glb", "assets/models/barrel.glb", "assets/models/chest.glb",
  "assets/models/clam.glb", "assets/models/coral.glb", "assets/models/fish.glb",
  "assets/models/jelly.glb", "assets/models/kelp.glb", "assets/models/manta.glb",
  "assets/models/sanddollar.glb", "assets/models/seaweed.glb", "assets/models/starfish.glb",
  "assets/models/tang-blue.glb", "assets/models/tang-yellow.glb", "assets/models/turtle.glb",
  "assets/img/hero.jpg", "assets/img/outfit-haibim.jpg", "assets/img/outfit-muvang.jpg",
  "assets/img/outfit-vayhong.jpg", "assets/img/tex-caustics.jpg", "assets/img/tex-fan.jpg",
  "assets/img/tex-fanalpha.jpg", "assets/img/tex-pano.jpg", "assets/img/tex-rock.jpg",
  "assets/img/tex-sand.jpg", "assets/img/tex-wood.jpg",
  "assets/voice/hub.mp3", "assets/voice/level1.mp3", "assets/voice/level2.mp3",
  "assets/voice/level3.mp3", "assets/voice/level4.mp3", "assets/voice/level5.mp3",
  "assets/voice/level6.mp3", "assets/voice/item.mp3", "assets/voice/item_done.mp3",
  "assets/voice/friend.mp3", "assets/voice/pet.mp3", "assets/voice/chest.mp3",
  "assets/voice/souvenir.mp3", "assets/voice/interact.mp3", "assets/voice/hidden.mp3",
  "assets/voice/hidden_hint.mp3", "assets/voice/ring.mp3", "assets/voice/race_start.mp3",
  "assets/voice/race_win.mp3", "assets/voice/race_timeout.mp3", "assets/voice/quiz_open.mp3",
  "assets/voice/quiz_ok.mp3", "assets/voice/quiz_wrong.mp3", "assets/voice/gem_ready.mp3",
  "assets/voice/gem_win.mp3", "assets/voice/finale.mp3", "assets/voice/land.mp3",
  "assets/voice/water.mp3", "assets/voice/wind_save.mp3", "assets/voice/voice_on.mp3",
  "assets/voice/outfit.mp3",
  "assets/voice/skill_unlock.mp3", "assets/voice/tree_revive.mp3", "assets/voice/launch_sky.mp3",
  "assets/voice/mirror_beam.mp3", "assets/voice/ice_bridge.mp3", "assets/voice/crystal_break.mp3",
  "assets/voice/boss_appear.mp3", "assets/voice/boss_hit.mp3", "assets/voice/boss_win.mp3",
  "assets/voice/npc_hub.mp3", "assets/voice/npc_ch1.mp3", "assets/voice/npc_ch2.mp3",
  "assets/voice/npc_ch3.mp3", "assets/voice/npc_ch4.mp3", "assets/voice/npc_ch5.mp3",
  "assets/voice/npc_ch6.mp3"
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  /* Chuẩn hóa khóa cache bỏ query string (?v=...) & CHỈ lưu phản hồi 200 (tránh lỗi 206 Partial Content của file MP3!) */
  var cacheKey = url.origin + url.pathname;
  var isCode = e.request.mode === 'navigate' || url.pathname.endsWith('/') || /\.(html|js|css|json)$/i.test(url.pathname);
  var canCache = function (r) { return r && r.ok && r.status === 200 && r.type === 'basic'; };
  if (isCode) {
    e.respondWith(fetch(e.request).then(function (r) {
      if (canCache(r)) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(cacheKey, copy); }).catch(function () {});
      }
      return r;
    }).catch(function () {
      return caches.match(cacheKey, { ignoreSearch: true }).then(function (h) {
        return h || caches.match('index.html', { ignoreSearch: true }) || caches.match('./', { ignoreSearch: true });
      });
    }));
  } else {
    e.respondWith(caches.match(cacheKey, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (r) {
        if (canCache(r)) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(cacheKey, copy); }).catch(function () {});
        }
        return r;
      }).catch(function () {
        return caches.match(e.request, { ignoreSearch: true }).then(function (h) {
          return h || new Response('', { status: 503, statusText: 'Offline' });
        });
      });
    }));
  }
});
