"use strict";
/* ============================================================================
   MÀN 5 — THUNG LŨNG TUYẾT TRẮNG (Xứ tuyết — Viên Ngọc Trắng Tuyết ⚪)
   Bầu trời Cực Quang lấp lánh, Tuyết PBR phản sáng, Hồ băng trong suốt trượt ván mượt,
   Làng lều tuyết Igloo đèn ấm, Rừng thông phủ tuyết & Người Tuyết Khổng Lồ
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  MAY.LEVELS.level5 = function () {
    var ctx = MAY.createWorldCtx("level5");
    ctx.mode = "land";
    ctx.worldRadius = 96;
    ctx.minimapBg = "rgba(38,76,118,0.92)";

    MAY.setSunOffset(34, 34, -26);
    MAY.sun.color.setHex(0xffe8d2);
    MAY.sun.intensity = 1.42;
    MAY.hemiLight.color.setHex(0xb4dcf8);
    MAY.hemiLight.groundColor.setHex(0x527598);
    MAY.hemiLight.intensity = 0.44;
    MAY.diveLight.intensity = 0.12;
    MAY.diveLight.castShadow = false;
    MAY.setAmbientTone(480, 0.036, "level5");
    MAY.setPostGrade({ tint: 0xf2f8ff, vignette: 0.22, bloom: 0.30, ssao: 0.48 });
    ctx.getSurface = function (x, z) { return ctx.isIce(x, z) ? "ice" : "snow"; };

    MAY.scene.fog = new THREE.FogExp2(0x9dc7e8, 0.0068);
    MAY.scene.background = new THREE.Color(0x9dc7e8);

    ctx.addSky({
      zenith: 0x16396b, horizon: 0xbce0f7, ground: 0x7aa4c4,
      sunDir: new THREE.Vector3(34, 34, -26), sunColor: 0xffe8c4,
      cloudColor: 0xf0f8ff, cloudAmt: 0.35, aurora: true, stars: true
    });

    /* Hồ băng tròn lớn ở trung tâm (0, -6, r=23) + 3 Khe Suối Băng khoét sâu vào địa hình (đóng băng thành Cầu Băng thật bằng ❄️!) */
    var ICE = { x: 0, z: -6, r: 23 };
    var gapConfigs = [
      { x: -29, z: 0,   rotY: 0.35,  w: 5.8, l: 9.2 },
      { x: 27,  z: 8,   rotY: -0.35, w: 5.8, l: 9.2 },
      { x: 12,  z: -31, rotY: 0.15,  w: 6.0, l: 9.4 }
    ];
    var iceBridges = [];

    function gapLocal(x, z, gc) {
      var dx = x - gc.x, dz = z - gc.z;
      var c = Math.cos(-gc.rotY), s = Math.sin(-gc.rotY);
      return { lx: dx * c - dz * s, lz: dx * s + dz * c };
    }
    function snowBaseH(x, z) {
      var id = Math.hypot(x - ICE.x, z - ICE.z);
      if (id < ICE.r) return 1.05;
      var rim = Math.min(1, (id - ICE.r) / 14);
      var hills = Math.sin(x * 0.055) * Math.cos(z * 0.055) * 3.8 +
                  Math.cos((x + z) * 0.09) * 1.1;
      var h = 1.05 + rim * (3.6 + hills);
      /* Đồi trượt tuyết cao ở phía Đông Nam */
      var sd = Math.hypot(x - 42, z - 24);
      if (sd < 28) h += (1 - sd / 28) * 7.5;
      return h;
    }

    ctx.isIce = function (x, z) {
      if (Math.hypot(x - ICE.x, z - ICE.z) < ICE.r - 1.0) return true;
      for (var i = 0; i < iceBridges.length; i++) {
        var ib = iceBridges[i];
        if (!ib.frozen) continue;
        var lc = gapLocal(x, z, ib.gc);
        if (Math.abs(lc.lx) <= ib.gc.w * 0.5 && Math.abs(lc.lz) <= ib.gc.l * 0.5) return true;
      }
      return false;
    };

    ctx.groundH = function (x, z) {
      var h = snowBaseH(x, z);
      for (var i = 0; i < gapConfigs.length; i++) {
        var gc = gapConfigs[i];
        var lc = gapLocal(x, z, gc);
        var mx = Math.max(0, Math.abs(lc.lx) - gc.w * 0.48);
        var mz = Math.max(0, Math.abs(lc.lz) - gc.l * 0.48);
        var dEdge = Math.hypot(mx, mz);
        if (dEdge < 1.6) {
          var t = 1 - dEdge / 1.6;
          h -= t * t * (3 - 2 * t) * 2.15;
        }
      }
      return h;
    };

    /* Tuyết PBR dịu mát có vệt phong hóa không lặp + Mặt hồ băng trong bóng */
    var snowMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.snow.map,
      normalMap: MAY.PBR.snow.normalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: MAY.PBR.snow.roughnessMap,
      color: 0xdcebf7,
      roughness: 0.76
    });
    MAY.applyWorldWeathering(snowMat, { macro: 0.12, stain: 0.18, wallGrime: 0.16, stainColor: 0x6f96ba });
    ctx.buildTerrain(230, 120, snowMat);

    /* HỒ BĂNG SOI GƯƠNG THỜI GIAN THỰC (Planar Reflection + Roughness vết nứt băng!) */
    var iceGeo = new THREE.CircleGeometry(ICE.r + 0.5, 48);
    iceGeo.rotateX(-Math.PI / 2);
    ctx.addReflective(iceGeo, {
      baseMap: MAY.PBR.ice.map,
      maskMap: MAY.PBR.ice.roughnessMap,
      invertMask: true,
      tint: 0xd8f3ff,
      strength: 0.78,
      repeat: 5.0,
      puddleOverlay: false,
      fogColor: 0x9dc7e8,
      fogDensity: 0.0068
    }, new THREE.Vector3(ICE.x, 1.09, ICE.z));

    /* Dãy núi tuyết Alps + Đá phủ tuyết + Tia sáng Cực Quang rọi xuống thung lũng + Tuyết rơi */
    MAY.buildVistaRing(ctx, { count: 24, radius: 142, hMin: 28, hMax: 58, wBase: 32, baseY: -1, color: 0x5d7a96, snowCap: true });
    MAY.scatterDebris(ctx, 160, function (x, z) { return !ctx.isIce(x, z); }, { spread: 80, size: 0.26, color: 0x8ea4ba });
    var snowRayMat = MAY.makeGodRayMat(0xb8f2ff, 0.19);
    [[0, -6], [-26, 20], [26, 18], [0, -36], [-30, -18], [32, -16]].forEach(function (rp, ri) {
      var ray = new THREE.Mesh(new THREE.ConeGeometry(3.4 + (ri % 3) * 0.8, 42, 12, 1, true), snowRayMat);
      ray.position.set(rp[0], 21, rp[1]);
      ray.rotation.z = -0.22;
      ctx.add(ray);
    });
    ctx.addAmbientParticles({ count: 480, spread: 130, minY: 0.5, maxY: 26, vy: -1.4, vx: 0.6, color: 0xffffff, size: 0.2, opacity: 0.85 });

    /* Rừng thông phủ tuyết dày tán lá đa tầng chân thực */
    var barkMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.bark.map, normalMap: MAY.PBR.bark.normalMap, roughness: 0.95 });
    var pineLeafMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.leafClusterTex, color: 0x4f967c, alphaTest: 0.34, side: THREE.DoubleSide, roughness: 0.82 });
    var capSnowMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.snow.map, color: 0xe6f2fc, roughness: 0.72 });
    function makeSnowPine(s) {
      var g = new THREE.Group();
      var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.38 * s, 6.2 * s, 9), barkMat);
      tr.position.y = 3.1 * s; g.add(tr);
      for (var k = 0; k < 4; k++) {
        var r = (2.1 - k * 0.38) * s, y = (2.2 + k * 1.45) * s;
        var branches = 5 - Math.floor(k / 2);
        for (var b = 0; b < branches; b++) {
          var a = (b / branches) * Math.PI * 2 + k * 0.7;
          var card = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.35, r * 1.25), pineLeafMat);
          card.position.set(Math.cos(a) * r * 0.38, y, Math.sin(a) * r * 0.38);
          card.rotation.y = a + Math.PI / 2;
          card.rotation.x = 0.55;
          g.add(card);
        }
        var snowPuff = new THREE.Mesh(new THREE.SphereGeometry(r * 0.65, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.45), capSnowMat);
        snowPuff.scale.y = 0.42; snowPuff.position.y = y + 0.35 * s; g.add(snowPuff);
      }
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      return g;
    }

    for (var pi = 0; pi < 42; pi++) {
      var pa = (pi * 2.399) % 6.28, pr = 29 + (pi * 1.8) % 54;
      var px = Math.cos(pa) * pr, pz = Math.sin(pa) * pr;
      if (Math.hypot(px - ICE.x, pz - ICE.z) < ICE.r + 5 || Math.hypot(px, pz - 42) < 10 || Math.hypot(px, pz + 38) < 12) continue;
      var nearGap = false;
      for (var gi = 0; gi < gapConfigs.length; gi++) if (Math.hypot(px - gapConfigs[gi].x, pz - gapConfigs[gi].z) < 7.8) { nearGap = true; break; }
      if (nearGap) continue;
      var pine = makeSnowPine(0.9 + (pi % 4) * 0.26);
      pine.position.set(px, ctx.groundH(px, pz) - 0.15, pz);
      pine.rotation.y = pi; ctx.add(pine);
    }

    /* Làng lều tuyết Igloo có vết phong hóa băng đá & ánh đèn vàng ấm (lều chính đổ bóng thật!) */
    var iglooDomeMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap, color: 0xe6f4ff, roughness: 0.65 });
    MAY.applyWorldWeathering(iglooDomeMat, { macro: 0.10, stain: 0.16, wallGrime: 0.22, stainColor: 0x7699ba });
    function makeIgloo(x, z, rotY, castShadow) {
      var g = new THREE.Group();
      var dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), iglooDomeMat);
      dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
      var tun = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 2.2, 12, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.7 }));
      tun.rotation.z = Math.PI / 2; tun.rotation.y = Math.PI / 2; tun.position.set(0, 0.1, 3.0); g.add(tun);
      var glowDoor = new THREE.Mesh(new THREE.CircleGeometry(1.0, 12), new THREE.MeshBasicMaterial({ color: 0xffd680 }));
      glowDoor.position.set(0, 0.9, 2.95); g.add(glowDoor);
      var igLan = MAY.makeCagedLantern(0xffcb69, castShadow ? 3.2 : 2.5, 24, !!castShadow);
      igLan.position.set(0, 1.9, 3.9); g.add(igLan);
      g.add(MAY.makeContactShadow(3.6, 0.52));
      g.position.set(x, ctx.groundH(x, z) - 0.15, z); g.rotation.y = rotY;
      ctx.add(g);
    }
    makeIgloo(-26, 22, 0.7, true);
    makeIgloo(26, 20, -0.8, false);
    makeIgloo(-22, -32, 0.4, false);
    MAY.scatterPropCluster(ctx, [
      { x: -26, z: 22, rMin: 3.4, rMax: 6.4, count: 16 },
      { x: 26,  z: 20, rMin: 3.4, rMax: 6.4, count: 16 },
      { x: -22, z: -32, rMin: 3.4, rMax: 6.4, count: 14 },
      { x: 0,   z: -38, rMin: 2.8, rMax: 6.2, count: 18 }
    ], { size: 0.25, color: 0xa4c0d8 });
    if (MAY.add3DLoop) {
      MAY.add3DLoop([-26, ctx.groundH(-26, 22) + 2.0, 22], { kind: "fire", freq: 780, vol: 0.032, maxDist: 28 });
      MAY.add3DLoop([-29, snowBaseH(-29, 0), 0], { kind: "water", freq: 720, vol: 0.042, maxDist: 34 });
    }

    /* Người Tuyết Khổng Lồ (0, -38) + Bệ Ngọc Trắng Tuyết */
    var sman = new THREE.Group();
    var smY = ctx.groundH(0, -38);
    var s1 = new THREE.Mesh(new THREE.SphereGeometry(2.3, 18, 14), capSnowMat); s1.position.y = 2.0; sman.add(s1);
    var s2 = new THREE.Mesh(new THREE.SphereGeometry(1.65, 16, 12), capSnowMat); s2.position.y = 4.9; sman.add(s2);
    var s3 = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12), capSnowMat); s3.position.y = 7.1; sman.add(s3);
    var carrot = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0xff7b00, roughness: 0.6 }));
    carrot.rotation.x = Math.PI / 2; carrot.position.set(0, 7.1, 1.35); sman.add(carrot);
    var topHat = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 1.3, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    topHat.position.y = 8.4; sman.add(topHat);
    var hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    hatBrim.position.y = 7.8; sman.add(hatBrim);
    var smScarf = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.25, 8, 20), new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.8 }));
    smScarf.rotation.x = Math.PI / 2; smScarf.position.y = 6.0; sman.add(smScarf);
    sman.position.set(0, smY, -38);
    sman.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ctx.add(sman);
    ctx.addGemAltar([0, -32]);

    /* ---- 10 Bông Tuyết Bạc (Nhiệm vụ chính) ---- */
    var flakeMat = new THREE.MeshPhysicalMaterial({ color: 0xe0f7ff, emissive: 0x67e8f9, emissiveIntensity: 0.95, roughness: 0.1, metalness: 0.4, clearcoat: 1.0 });
    function makeSnowflake() {
      var g = new THREE.Group();
      for (var k = 0; k < 3; k++) {
        var bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.16), flakeMat);
        bar.rotation.z = k * Math.PI / 3; g.add(bar);
      }
      return g;
    }
    ctx.addCollectibles([
      [-12, 26], [14, 24], [-12, 2], [12, -2], [0, -14],
      [-34, 6], [36, 4], [-34, -22], [32, -26], [42, 24]
    ], { color: 0x7dd3fc, icon: "❄️", yOff: 1.35, makeMesh: makeSnowflake });

    /* ---- 5 Bạn Xứ Tuyết + Thỏ Tuyết Nhí (không trùng Trưởng Làng Cánh Cụt Bông!) ---- */
    ctx.addFriends([
      { name: "Thỏ Tuyết Nhí",   kind: "rabbit",    pos: [-10, 12], isCompanion: true, opts: { color: 0xf8fafc }, greet: "🐇 Thỏ Tuyết trắng tinh nhảy tưng tưng dẫn đường cho Mây nè!" },
      { name: "Gấu Bắc Cực Nhí", kind: "polarbear", pos: [-30, 14], greet: "🐻‍❄️ Gấu Bắc Cực Nhí vẫy bàn chân bông chào Mây!" },
      { name: "Tuần Lộc Mũi Đỏ", kind: "reindeer",  pos: [34, 16],  greet: "🦌 Tuần lộc nháy chiếc mũi đỏ rực chào bé Mây!" },
      { name: "Cáo Tuyết Trắng", kind: "snowfox",   pos: [-26, -24],greet: "🦊 Cáo tuyết trắng tinh chạy vòng quanh chào Mây!" },
      { name: "Hải Cẩu Con",     kind: "seal",      pos: [10, -10], greet: "🦭 Hải cẩu con vỗ vây thích thú trên mặt hồ băng!" }
    ]);

    /* ---- 3 Rương Băng, 5 Quả Thông Tuyết, 5 Đống Tuyết bật Người Tuyết Mini ---- */
    ctx.addChests([[-20, 26], [0, -6], [42, 18]], 0x7dd3fc);

    ctx.addSouvenirs([[-18, 16], [20, 12], [-32, -12], [28, -18], [16, 32]].map(function (p, i) {
      var cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.72, 8), new THREE.MeshStandardMaterial({ color: 0x7c4a21, roughness: 0.85 }));
      cone.position.y = 0.4;
      return { id: "pn" + i, pos: p, mesh: cone, color: 0xfde68a, msg: "Nhặt được quả thông tuyết" };
    }));

    ctx.addInteractProps([[-14, 18], [16, 16], [-18, -22], [18, -22], [0, 20]].map(function (p, i) {
      var g = new THREE.Group();
      var mound = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), capSnowMat);
      g.add(mound);
      var mini = new THREE.Group(); mini.scale.setScalar(0.01);
      var mb1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), capSnowMat); mb1.position.y = 0.7; mini.add(mb1);
      var mb2 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), capSnowMat); mb2.position.y = 1.25; mini.add(mb2);
      var mc = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0xff7b00 }));
      mc.rotation.x = Math.PI / 2; mc.position.set(0, 1.25, 0.32); mini.add(mc);
      g.add(mini); g.userData.mini = mini;
      g.position.set(p[0], ctx.groundH(p[0], p[1]), p[1]);
      return {
        id: "sm" + i, obj: g, label: "Đánh thức người tuyết bé", burstColor: 0xffffff,
        toastText: "Bùm! Người tuyết tí hon nhảy ra vẫy chào Mây!",
        onActivate: function (obj) { obj.userData.mini.scale.setScalar(1.0); }
      };
    }));

    /* Bảo vật ẩn: Quả Cầu Tuyết Ma Thuật sau đồi băng phía Bắc */
    var globe = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 14),
      new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, emissive: 0x38bdf8, emissiveIntensity: 0.9, roughness: 0.04, clearcoat: 1.0, transparent: true, opacity: 0.9 }));
    ctx.addHiddenTreasure([28, ctx.groundH(28, -56) + 1.2, -56], {
      name: "Quả Cầu Tuyết Ma Thuật",
      hint: "Có quả cầu pha lê băng lấp lánh sau rừng thông phía Bắc...",
      mesh: globe, color: 0x7dd3fc
    });

    /* 3 Thử thách Màn 5 */
    ctx.addRingsChallenge([[-14, -6], [-6, -18], [8, -16], [14, -2], [2, 8]], { title: "5 cổng trượt băng hồ băng", color: 0x7dd3fc, emissive: 0x0284c7 });
    ctx.addRaceChallenge([38, 22], [[24, 12], [10, 2], [-8, -10], [-20, 14]], { title: "Đua trượt tuyết cùng Tuần Lộc", time: 48 });
    ctx.addQuizStation([-18, 26], { label: "Lều Đố Quy Luật" });

    ctx.addPortal([0, 48], "hub", "🏝️ Về Đảo Mây", 0xe0f2fe);

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.fillStyle = "#bae6fd";
      mm.beginPath(); mm.arc(C + ICE.x * K, C + ICE.z * K, ICE.r * K, 0, 6.29); mm.fill();
    };

    /* ---- CỐT TRUYỆN CHƯƠNG 5: Trưởng Làng Cánh Cụt Bông (!) -> Phá Băng Nứt (💎) -> Học Sương Băng (❄️) -> Xây 3 Cầu Băng + Đóng Cứng Cầu Tuyết -> Bẫy Sói Tuyết! ---- */
    ctx.wrapDynamicGround();
    ctx.checkpoint = new THREE.Vector3(0, ctx.groundH(0, 38) + 1.1, 38);
    var ch5St = ctx.story;
    var ch5Sc = MAY.STORY_SCRIPTS.level5;
    ctx.setupAtmosphere(
      { fog: 0x6b7f94, density: 0.0105, sunInt: 0.96, hemiInt: 0.36, zenith: 0x263448, horizon: 0x899eb2 },
      { fog: 0x9dc7e8, density: 0.0066, sunInt: 1.48, hemiInt: 0.50, zenith: 0x16396b, horizon: 0xbce0f7 },
      !!ch5St.bossDown
    );

    /* Hồi 1: Tảng Băng Nứt chắn Động Suối Băng (phá bằng 💎 Cộng Hưởng!) */
    var iceWall = MAY.buildCrackedWall(ctx, 16, ctx.groundH(16, 26), 26, -0.4, 0x38bdf8, "c5_icewall");
    if (ch5St.steps.iceWallBroken) iceWall.shatter(true);

    /* Hồi 3A: 3 Khe Suối Băng thật sự bị khoét sâu dưới lớp tuyết -> Tung ❄️ Sương Băng để KẾT TINH CẦU BĂNG THẬT đi bộ/trượt băng qua! */
    gapConfigs.forEach(function (gc, idx) {
      var rimY = snowBaseH(gc.x, gc.z);
      var waterPit = new THREE.Mesh(
        new THREE.PlaneGeometry(gc.w + 0.8, gc.l + 0.8),
        new THREE.MeshPhysicalMaterial({ color: 0x0a4d78, emissive: 0x062d4a, emissiveIntensity: 0.45, roughness: 0.14, clearcoat: 0.9, transparent: true, opacity: 0.92 })
      );
      waterPit.rotation.x = -Math.PI / 2; waterPit.rotation.z = -gc.rotY;
      waterPit.position.set(gc.x, rimY - 0.88, gc.z); ctx.add(waterPit);

      var slab = new THREE.Mesh(
        new THREE.BoxGeometry(gc.w + 0.4, 0.52, gc.l + 0.4),
        new THREE.MeshPhysicalMaterial({ color: 0xc2ecff, emissive: 0x38bdf8, emissiveIntensity: 0.38, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.94 })
      );
      slab.position.set(gc.x, rimY - 0.18, gc.z); slab.rotation.y = gc.rotY;
      slab.receiveShadow = true; slab.castShadow = true;
      var frozen = !!ch5St.steps["gap" + idx];
      slab.visible = frozen;
      ctx.add(slab);

      var dynPlat = ctx.addDynamicPlatform(gc.x, rimY + 0.08, gc.z, gc.w + 0.6, gc.l + 0.6, gc.rotY, frozen);
      iceBridges.push({ gc: gc, rimY: rimY, slab: slab, plat: dynPlat, pos: new THREE.Vector3(gc.x, rimY + 0.1, gc.z), frozen: frozen });
    });

    /* Hồi 3B: Quả Cầu Tuyết Lăn Khổng Lồ -> Tung ❄️ đóng cứng thành bệ băng! */
    var snowBall = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.9, 1),
      new THREE.MeshStandardMaterial({ color: 0xedf6ff, roughness: 0.72 })
    );
    var sbFrozen = !!ch5St.steps.ballFrozen;
    var sbBase = new THREE.Vector3(24, ctx.groundH(24, -4) + 1.9, -4);
    snowBall.position.copy(sbBase);
    if (sbFrozen) snowBall.material = new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.08, clearcoat: 1.0 });
    ctx.add(snowBall);

    /* 3 Gấu Tuyết Sương Xám tuần tra */
    if (!ch5St.bossDown) {
      [[-24, 6], [26, -12], [-18, -22]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l5_bear_" + i, kind: "frostbear", name: "Gấu Tuyết Sương Xám", pos: ep, weakSpell: "frost", speed: 3.4, patrolR: 7 });
      });
    }

    /* TRÙM CHƯƠNG 5: 🦊 Sói Tuyết Băng Giá (Frostfang Alpha — Đặt bẫy Cột Băng ❄️ cho Sói trượt đâm choáng -> ☀️ thanh tẩy!) */
    var wolfBossMesh = MAY.makeMonsterMesh("icewolf", 2.35);
    var activeIceTrap = null;
    var ch5Npc;
    var ch5Boss = ctx.setBoss({
      name: "Sói Tuyết Băng Giá", icon: "🦊",
      pos: new THREE.Vector3(0, 1.1, -6), arenaR: 25, maxHp: 3, mesh: wolfBossMesh,
      startActive: ch5St.stage === 3 && !ch5St.bossDown,
      tipFn: function (b) {
        return b.subState.dizzy
          ? "💡 Sói Tuyết đập đầu vào Cột Băng đang choáng! Tung ngay ☀️ Tia Nắng (Phím 3 + R) thanh tẩy!"
          : "💡 Khi Sói Tuyết hiện vòng đỏ chuẩn bị lao tới, tung ❄️ Sương Băng (5 + R) dựng Cột Băng bẫy nó!";
      },
      onTick: function (dt, t, bs) {
        if (bs.subState.dizzy) {
          bs.subState.dizzyT -= dt;
          bs.mesh.rotation.y += dt * 7;
          if (bs.subState.dizzyT <= 0) { bs.subState.dizzy = false; bs.syncHUD(); }
          return;
        }
        var ang = Math.atan2(MAY.player.pos.x - bs.pos.x, MAY.player.pos.z - bs.pos.z);
        bs.mesh.rotation.y = ang + Math.PI;
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 34) {
          bs.atkT = 4.0;
          var targetP = MAY.player.pos.clone();
          targetP.y = 1.1;
          MAY.VFX.spawnTelegraph(targetP, 3.6, 1.1, 0xff3b5c);
          MAY.toast("🦊 Sói Tuyết sắp lao vồ! Tung ❄️ Sương Băng (Phím 5 + R) dựng Cột Băng chặn đường nó!");
          ctx.scheduleEvent(1.1, function () {
            if (!bs.active || bs.defeated) return;
            /* Nếu có Cột Băng bẫy gần đường lao -> Sói đâm sầm bị choáng! */
            if (activeIceTrap && activeIceTrap.life > 0 && (activeIceTrap.pos.distanceTo(targetP) < 8.5 || activeIceTrap.pos.distanceTo(bs.pos) < 10.5)) {
              bs.pos.lerp(activeIceTrap.pos, 0.7);
              bs.pos.y = 1.1;
              bs.subState.dizzy = true;
              bs.subState.dizzyT = 6.0;
              activeIceTrap.life = 0;
              MAY.sndShatter(bs.pos);
              MAY.VFX.spawnShatterBurst(bs.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x7dd3fc);
              bs.syncHUD();
              MAY.toast("💥 RẦM! Sói Tuyết trượt đâm thẳng vào Cột Băng choáng váng! Bắn ngay ☀️ Tia Nắng (3 + R)!", "Trúng đòn rồi! Trùm bị choáng váng!");
            } else {
              bs.pos.set(targetP.x, 1.1, targetP.z);
              MAY.burstAt(bs.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xbbe8ff, 16);
              if (MAY.player.pos.distanceTo(bs.pos) < 3.6) {
                MAY.damagePlayer(1, bs.pos, "Sói Tuyết lao trúng rồi! Nhớ tung ❄️ dựng Cột Băng bẫy nó!");
              }
            }
          });
        }
      },
      onSpellHit: function (spellId, castPos, bs) {
        if (spellId === "frost") {
          /* Dựng Cột Băng bẫy Sói ngay trước mặt Mây! */
          MAY.VFX.spawnIcePillar(castPos.clone(), 5.5);
          MAY.sndFreeze(castPos);
          activeIceTrap = { pos: castPos.clone(), life: 5.5 };
          if (castPos.distanceTo(bs.pos) < 7.5) {
            bs.subState.dizzy = true;
            bs.subState.dizzyT = 6.0;
            bs.syncHUD();
            MAY.toast("❄️ Cột Băng mọc ngay dưới chân làm Sói Tuyết trượt ngã choáng váng! Bắn ngay ☀️ Tia Nắng (3 + R)!");
          } else {
            MAY.toast("❄️ Đã dựng Cột Băng bẫy Sói Tuyết trên hồ băng!");
          }
        } else if (spellId === "solar" || spellId === "crystal") {
          if (bs.subState.dizzy) {
            bs.subState.dizzy = false;
            bs.damage("☀️ Tia Nắng làm tan lớp băng sương xám trên bờm Sói Tuyết!");
          } else {
            MAY.toast("💡 Sói chạy nhanh quá! Dùng ❄️ Sương Băng (Phím 5 + R) dựng Cột Băng làm nó choáng trước nhé!");
          }
        }
      },
      onDefeat: function () {
        ch5St.stage = 4; MAY.persist();
        ch5Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI TRƯỞNG LÀNG CÁNH CỤT BÔNG NHẬN ⚪ NGỌC TRẮNG!", ch5Npc.pos);
        MAY.toast("❄️ Cực quang rực sáng khắp thung lũng! Về gặp Cánh Cụt Bông nhận thưởng!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    /* Cho phép dựng Cột Băng mọi nơi trên hồ băng khi Boss đang hoạt động */
    ctx.onSpellCast = function (spellId, targetPos) {
      if (spellId === "frost" && ch5Boss.active && !ch5Boss.defeated) {
        MAY.VFX.spawnIcePillar(targetPos.clone(), 5.5);
        MAY.sndFreeze(targetPos);
        activeIceTrap = { pos: targetPos.clone(), life: 5.5 };
      }
    };

    function updateCh5Story() {
      if (ch5St.rewarded || ctx.save.gem) {
        ch5Npc.setMarker("♥");
        ctx.setObjective("⚪", "XỨ TUYẾT ĐÃ ẤM ÁP — SANG CHƯƠNG 6 VƯƠNG QUỐC MÂY (PHÍM M)", null);
        return;
      }
      if (ch5St.bossDown) {
        ch5Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI TRƯỞNG LÀNG CÁNH CỤT BÔNG NHẬN ⚪ NGỌC TRẮNG!", ch5Npc.pos);
        return;
      }
      if (ch5St.stage === 0) {
        ch5Npc.setMarker("!");
        ctx.setObjective("💬", "TRÒ CHUYỆN VỚI TRƯỞNG LÀNG CÁNH CỤT BÔNG (!)", ch5Npc.pos);
        return;
      }
      if (!ch5St.steps.iceWallBroken) {
        ch5Npc.setMarker("?");
        ctx.setObjective("💎", "DÙNG 💎 CỘNG HƯỞNG (4+R) PHÁ TẢNG BĂNG NỨT ĐỘNG SUỐI", iceWall.pos);
        return;
      }
      if (ch5St.stage < 2) {
        ch5Npc.setMarker("!");
        ctx.setObjective("💬", "QUAY LẠI CÁNH CỤT BÔNG NHẬN PHÉP ❄️ SƯƠNG BĂNG (!)", ch5Npc.pos);
        return;
      }
      var brDone = 0;
      for (var i = 0; i < 3; i++) if (ch5St.steps["gap" + i]) brDone++;
      if (brDone < 3) {
        ch5Npc.setMarker("?");
        var nextG = iceBridges[0].pos;
        for (var j = 0; j < 3; j++) if (!ch5St.steps["gap" + j]) { nextG = iceBridges[j].pos; break; }
        ctx.setObjective("❄️", "DÙNG ❄️ SƯƠNG BĂNG (5+R) XÂY 3 CẦU BĂNG QUA SUỐI (" + brDone + "/3)", nextG);
      } else if (!ch5St.steps.ballFrozen) {
        ch5Npc.setMarker("?");
        ctx.setObjective("❄️", "ĐÓNG CỨNG QUẢ CẦU TUYẾT LĂN BẰNG ❄️ SƯƠNG BĂNG", snowBall.position);
      } else {
        ch5St.stage = 3; MAY.persist();
        ch5Npc.setMarker("?");
        if (!ch5Boss.active) {
          ch5Boss.activate();
          MAY.openDialogue({
            name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor,
            pages: ch5Sc.bossIntro, endBtn: "🦊 Chiến đấu với Sói Tuyết!", voiceClip: "boss_appear"
          });
        }
        ctx.setObjective("🦊", "BẪY CỘT BĂNG (❄️) + CHIẾU NẮNG (☀️) HẠ SÓI TUYẾT!", ch5Boss.pos);
      }
    }

    ctx.addSkillTarget({
      id: "l5_icewall", pos: iceWall.pos, radius: 8.5, reqSpell: "crystal",
      hint: "💎 Phá Tảng Băng Nứt!", done: !!ch5St.steps.iceWallBroken,
      isActive: function () { return ch5St.stage >= 1 && !ch5St.steps.iceWallBroken; },
      onHit: function (sp, tg) {
        ch5St.steps.iceWallBroken = true; MAY.persist();
        iceWall.shatter(false);
        tg.markDone();
        MAY.toast("💥 Tảng băng nứt vỡ tan! Quay về gặp Cánh Cụt Bông nhận Phép ❄️ Sương Băng!", "Ầm! Sóng cộng hưởng pha lê đã phá vỡ tan bức tường đá rồi!");
        updateCh5Story();
      }
    });

    iceBridges.forEach(function (ib, idx) {
      ctx.addSkillTarget({
        id: "l5_gap_" + idx, pos: ib.pos, radius: 9.0, reqSpell: "frost",
        hint: "❄️ Đóng băng xây Cầu Băng (" + (idx + 1) + "/3)", done: !!ch5St.steps["gap" + idx],
        isActive: function () { return ch5St.stage >= 2 && !ch5St.steps["gap" + idx]; },
        onHit: function (sp, tg) {
          ch5St.steps["gap" + idx] = true; MAY.persist();
          ib.frozen = true; ib.slab.visible = true; ib.plat.active = true;
          tg.markDone();
          MAY.sndFreeze(ib.pos);
          MAY.burstAt(ib.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0x7dd3fc, 22);
          MAY.toast("❄️ Mặt suối kết tinh thành Cầu Băng lấp lánh đi bộ qua được rồi!", "Mặt suối đã đóng băng thành Cầu Băng lấp lánh! Mây bước qua thôi nào!");
          updateCh5Story();
        }
      });
    });

    var sbTarget = ctx.addSkillTarget({
      id: "l5_snowball", pos: snowBall.position, radius: 9.0, reqSpell: "frost",
      hint: "❄️ Đóng cứng Cầu Tuyết Lăn!", done: sbFrozen,
      isActive: function () { return ch5St.stage >= 2 && ch5St.steps.gap0 && ch5St.steps.gap1 && ch5St.steps.gap2 && !ch5St.steps.ballFrozen; },
      onHit: function (sp, tg) {
        ch5St.steps.ballFrozen = true; sbFrozen = true; MAY.persist();
        snowBall.material = new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.08, clearcoat: 1.0 });
        tg.markDone();
        MAY.sndFreeze(snowBall.position);
        MAY.toast("❄️ Quả cầu tuyết đã đông cứng! Sói Tuyết Băng Giá nhảy ra giữa hồ băng kìa!");
        updateCh5Story();
      }
    });

    ch5Npc = ctx.addQuestNPC({
      kind: "penguin", name: ch5Sc.npcName, icon: ch5Sc.npcIcon,
      pos: [-6, 32], rotY: 0.3, scale: 1.4, labelY: 2.2, autoGreet: ch5St.stage === 0,
      onTalk: function () {
        if (ch5St.rewarded || ctx.save.gem) {
          MAY.openDialogue({ name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor, pages: ch5Sc.complete, endBtn: "☁️ Tới Chương 6: Vương Quốc Mây!", onDone: function () { MAY.enterLevel("level6"); } });
        } else if (ch5St.bossDown) {
          MAY.openDialogue({
            name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor,
            pages: ch5Sc.reward, endBtn: ch5Sc.rewardBtn, voiceClip: "gem_win",
            onDone: function () { ch5St.rewarded = true; MAY.persist(); updateCh5Story(); ctx.awardGem(); }
          });
        } else if (ch5St.stage === 0) {
          MAY.openDialogue({
            name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor,
            pages: ch5Sc.intro, endBtn: ch5Sc.introBtn, voiceClip: "npc_ch5",
            onDone: function () {
              ch5St.stage = 1; MAY.persist();
              if (!MAY.isSpellUnlocked("crystal")) MAY.unlockSpell("crystal", true);
              if (!MAY.isSpellUnlocked("solar")) MAY.unlockSpell("solar", true);
              updateCh5Story();
            }
          });
        } else if (ch5St.steps.iceWallBroken && ch5St.stage < 2) {
          MAY.openDialogue({
            name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor,
            pages: ch5Sc.stage2GiveSkill, endBtn: ch5Sc.stage2Btn,
            onDone: function () {
              ch5St.stage = 2; MAY.persist();
              MAY.unlockSpell("frost");
              updateCh5Story();
            }
          });
        } else {
          MAY.openDialogue({ name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor, pages: ch5Sc.inProgress, endBtn: "❄️ Đi xây Cầu Băng!" });
        }
      }
    });
    updateCh5Story();

    var chillWarnCd = 0;
    ctx.onUpdate = function (dt, t) {
      if (activeIceTrap && activeIceTrap.life > 0) activeIceTrap.life -= dt;
      if (chillWarnCd > 0) chillWarnCd -= dt;
      /* Nếu Mây lỡ bước xuống khe suối băng chưa đóng băng -> tóe nước lạnh & bật nhẹ lên bờ! */
      if (!MAY.modalOpen) {
        var pp = MAY.player.pos;
        for (var gi = 0; gi < iceBridges.length; gi++) {
          var ib = iceBridges[gi];
          if (ib.frozen) continue;
          var lc = gapLocal(pp.x, pp.z, ib.gc);
          if (Math.abs(lc.lx) < ib.gc.w * 0.44 && Math.abs(lc.lz) < ib.gc.l * 0.44 && pp.y < ib.rimY + 0.15) {
            var pushX = (pp.x - ib.gc.x), pushZ = (pp.z - ib.gc.z);
            var pl = Math.hypot(pushX, pushZ) || 1;
            MAY.player.vel.x = (pushX / pl) * 8.5;
            MAY.player.vel.z = (pushZ / pl) * 8.5;
            MAY.player.vel.y = 8.2;
            MAY.player.grounded = false;
            if (chillWarnCd <= 0) {
              chillWarnCd = 2.0;
              MAY.burstAt(pp.clone(), 0x7dd3fc, 12);
              MAY.toast("🥶 Khe nước suối băng lạnh cóng! Dùng ❄️ Sương Băng (Phím 5 + R) đóng băng thành Cầu Băng đi qua nhé!");
            }
            break;
          }
        }
      }
      if (!sbFrozen) {
        var sx = 24 + Math.sin(t * 1.4) * 7.5;
        snowBall.position.set(sx, ctx.groundH(sx, -4) + 1.9, -4);
        snowBall.rotation.z -= Math.cos(t * 1.4) * dt * 3.5;
        sbTarget.pos.copy(snowBall.position);
        if (sbTarget.ring) sbTarget.ring.position.set(sx, snowBall.position.y - 1.75, -4);
        if (sbTarget.hintLb) sbTarget.hintLb.position.set(sx, snowBall.position.y + 2.6, -4);
        if (!MAY.modalOpen && snowBall.position.distanceTo(MAY.player.pos) < 2.6) {
          MAY.damagePlayer(1, snowBall.position, "Quả cầu tuyết lăn trúng rồi! Dùng ❄️ Sương Băng đóng cứng nó lại!");
        }
      }
    };

    MAY.player.spawnAt(0, ctx.groundH(0, 38) + 1.05, 38, 0, false);
    return ctx;
  };

})(window.MAY);
