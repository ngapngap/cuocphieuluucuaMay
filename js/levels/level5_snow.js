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
    MAY.setPostGrade({ tint: 0xf2f8ff, vignette: 0.22, bloom: 0.30, ssao: 0.48, godRay: 0.34, godRayColor: 0xb8f2ff });
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
    ctx.buildTerrain(230, 120, snowMat, {
      staticLights: [
        { x: -26, z: 22,  r: 1.0, g: 0.80, b: 0.42, radius: 18, intensity: 0.48 },
        { x: 26,  z: 20,  r: 1.0, g: 0.80, b: 0.42, radius: 16, intensity: 0.40 },
        { x: -22, z: -32, r: 1.0, g: 0.80, b: 0.42, radius: 16, intensity: 0.40 }
      ]
    });

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

    /* Dãy núi tuyết Alps + Đá phủ tuyết + Tia sáng Screen-Space Volumetric God Rays + Tuyết rơi */
    MAY.buildVistaRing(ctx, { count: 24, radius: 142, hMin: 28, hMax: 58, wBase: 32, baseY: -1, color: 0x5d7a96, snowCap: true });
    MAY.scatterDebris(ctx, 160, function (x, z) { return !ctx.isIce(x, z); }, { spread: 80, size: 0.26, color: 0x8ea4ba });
    if (MAY.setGodRays) MAY.setGodRays({ color: 0xb8f2ff, strength: 0.34, density: 0.90, decay: 0.94 });
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
      ctx.addCollider(px, pz, 0.55, "pine");
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
      var igY = ctx.groundH(x, z);
      g.position.set(x, igY - 0.15, z); g.rotation.y = rotY;
      ctx.add(g);
      ctx.addSphereCollider(x, igY, z, 3.25, "igloo_dome", { minY: igY - 0.5, maxY: igY + 3.4 });
      var tx = x + Math.sin(rotY) * 3.0, tz = z + Math.cos(rotY) * 3.0;
      ctx.addBoxCollider(tx, tz, 2.4, 2.3, igY - 0.5, igY + 1.9, rotY, "igloo_tunnel");
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
    ctx.addSphereCollider(0, smY + 2.0, -38, 2.35, "snowman_b");
    ctx.addSphereCollider(0, smY + 4.9, -38, 1.65, "snowman_m");
    ctx.addSphereCollider(0, smY + 7.1, -38, 1.15, "snowman_h");
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
      { name: "Thỏ Tuyết Nhí",   kind: "snowhare",    pos: [-10, 12], isCompanion: true, opts: { color: 0xf8fafc }, greet: "🐇 Thỏ Tuyết trắng tinh nhảy tưng tưng dẫn đường cho Mây nè!" },
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
    var wolfBossMesh = MAY.makeRiggedBoss("wolf", 2.8, "icewolf", 2.35);
    if (wolfBossMesh.userData.mixer) {
      // A slightly broader shoulder silhouette reads from the frontal camera.
      wolfBossMesh.children[0].scale.x *= 1.3;
      wolfBossMesh.traverse(function (o) {
        if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.setHex(0xb9ddf2);
        }
      });
      var wolfIceMat = new THREE.MeshStandardMaterial({ color: 0x7edcf5, emissive: 0x2694b5, emissiveIntensity: 0.35, roughness: 0.3 });
      for (var wi = 0; wi < 4; wi++) {
        var wolfShard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55 + (wi % 2) * 0.16, 5), wolfIceMat);
        wolfShard.position.set(0, 2.35 - wi * 0.06, -0.45 + wi * 0.45);
        wolfShard.rotation.x = 0.26; wolfBossMesh.add(wolfShard);
      }
    }
    var activeIceTrap = null;
    function clearBossIceTrap() {
      if (ctx.removeCollider) ctx.removeCollider("boss_ice_pillar");
      activeIceTrap = null;
    }
    function placeBossIcePillar(pos) {
      clearBossIceTrap();
      var p = pos.clone();
      MAY.VFX.spawnIcePillar(p, 5.5);
      MAY.sndFreeze(p);
      if (ctx.addCollider) ctx.addCollider(p.x, p.z, 1.15, "boss_ice_pillar", { minY: p.y - 0.5, maxY: p.y + 3.8 });
      activeIceTrap = { pos: p, life: 5.5 };
    }
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
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("attack", false);
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
              clearBossIceTrap();
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
          /* Cột băng chỉ dựng DUY NHẤT 1 lần trong ctx.onSpellCast (khử sạch bug cột băng nhân đôi!) */
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
        clearBossIceTrap();
        ch5St.stage = 4; MAY.persist();
        ch5Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI TRƯỞNG LÀNG CÁNH CỤT BÔNG NHẬN ⚪ NGỌC TRẮNG!", ch5Npc.pos);
        MAY.toast("❄️ Cực quang rực sáng khắp thung lũng! Về gặp Cánh Cụt Bông nhận thưởng!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    // Optional training match: the story boss and its progress are restored on exit.
    var rematch = null, rematchRing = null;
    function rematchTip() {
      if (!rematch || !rematch.open) return "Chờ vòng màu xuất hiện quanh Sói Tuyết nhé!";
      return rematch.required === "frost"
        ? "Vòng xanh: dùng ❄️ Sương Băng (5 + R)!"
        : "Vòng vàng: dùng ☀️ Tia Nắng (3 + R)!";
    }
    function leaveRematch() {
      if (!rematch) return;
      var saved = rematch.saved;
      rematch = null;
      ctx.bossRematchActive = false;
      if (rematchRing) rematchRing.visible = false;
      clearBossIceTrap();
      ch5Boss.active = saved.active; ch5Boss.defeated = saved.defeated;
      ch5Boss.state = saved.state; ch5Boss.stateT = saved.stateT;
      ch5Boss.hp = saved.hp; ch5Boss.atkT = saved.atkT; ch5Boss.subState = saved.subState;
      ch5Boss.onTick = saved.onTick; ch5Boss.onSpellHit = saved.onSpellHit; ch5Boss.tipFn = saved.tipFn;
      ch5Boss.mesh.position.copy(saved.position); ch5Boss.mesh.rotation.copy(saved.rotation);
      ch5Boss.mesh.scale.copy(saved.scale); ch5Boss.mesh.visible = saved.visible;
      ch5Boss.syncHUD();
      if (MAY.VFX && MAY.VFX.syncSpellUI) MAY.VFX.syncSpellUI();
    }
    ctx.leaveBossRematch = leaveRematch;
    ctx.startBossRematch = function () {
      if (!ctx.save.gem || MAY.currentCtx !== ctx) return false;
      if (rematch) return true;
      var old = {
        active: ch5Boss.active, defeated: ch5Boss.defeated, state: ch5Boss.state,
        stateT: ch5Boss.stateT, hp: ch5Boss.hp, atkT: ch5Boss.atkT, subState: ch5Boss.subState,
        onTick: ch5Boss.onTick, onSpellHit: ch5Boss.onSpellHit, tipFn: ch5Boss.tipFn,
        position: ch5Boss.mesh.position.clone(), rotation: ch5Boss.mesh.rotation.clone(),
        scale: ch5Boss.mesh.scale.clone(), visible: ch5Boss.mesh.visible
      };
      var record = ctx.save.challenges.bossRematch;
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        record = ctx.save.challenges.bossRematch = { wins: 0, clean: 0 };
      }
      record.wins = Math.max(0, Math.floor(Number(record.wins) || 0));
      record.clean = Math.max(0, Math.floor(Number(record.clean) || 0));
      rematch = { saved: old, round: 0, mistakes: 0, open: false, wait: 0.6,
        first: record.wins % 2 ? "solar" : "frost" };
      ctx.bossRematchActive = true;
      if (MAY.VFX && MAY.VFX.syncSpellUI) MAY.VFX.syncSpellUI();
      if (!rematchRing) {
        rematchRing = new THREE.Mesh(new THREE.RingGeometry(3.7, 4.1, 32),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
        rematchRing.rotation.x = -Math.PI / 2;
        rematchRing.position.set(0, ctx.groundH(0, -6) + 0.12, -6);
        ctx.add(rematchRing);
      }
      rematchRing.visible = false;
      clearBossIceTrap();
      ch5Boss.active = true; ch5Boss.defeated = false; ch5Boss.state = "idle";
      ch5Boss.hp = ch5Boss.maxHp; ch5Boss.subState = {};
      ch5Boss.mesh.position.set(0, 1.1, -6); ch5Boss.mesh.visible = true;
      ch5Boss.mesh.scale.setScalar(ch5Boss.baseScale || 1);
      ch5Boss.tipFn = rematchTip;
      ch5Boss.onTick = function (dt, t, bs) {
        if (!rematch) return;
        rematch.wait -= dt;
        if (rematch.wait > 0) return;
        if (rematch.open) {
          rematch.open = false; rematch.mistakes++; rematch.wait = 1;
          rematchRing.visible = false;
          MAY.toast("🐺 Chưa kịp rồi, Sói sẽ cho Mây thử lại nhé!");
          bs.syncHUD(); return;
        }
        rematch.required = rematch.round % 2 === 0 ? rematch.first : (rematch.first === "frost" ? "solar" : "frost");
        rematch.open = true; rematch.wait = 6;
        rematchRing.material.color.setHex(rematch.required === "frost" ? 0x38bdf8 : 0xffd93d);
        rematchRing.visible = true;
        MAY.toast("🐺 " + rematchTip()); bs.syncHUD();
      };
      ch5Boss.onSpellHit = function (spellId, castPos, bs) {
        if (!rematch || !rematch.open) { MAY.toast("🐺 Đợi vòng màu xuất hiện nhé!"); return; }
        if (spellId !== rematch.required) {
          rematch.mistakes++;
          MAY.toast("🐺 Chưa đúng màu. " + rematchTip()); return;
        }
        rematch.open = false; rematchRing.visible = false; rematch.round++; bs.hp = bs.maxHp - rematch.round;
        MAY.sndStar(); MAY.burstAt(bs.pos.clone().add(new THREE.Vector3(0, 2, 0)), 0xffd93d, 20);
        if (rematch.round < bs.maxHp) {
          rematch.wait = 1; bs.syncHUD();
          MAY.toast("⭐ Đúng rồi! Chờ vòng màu tiếp theo nhé."); return;
        }
        var clean = rematch.mistakes === 0;
        record.wins++; if (clean) record.clean++; MAY.persist();
        leaveRematch();
        MAY.toast("⭐ Hoàn thành buổi tập với Sói Tuyết" + (clean ? " không sai!" : "! Cùng thử lại nhé!"));
      };
      MAY.player.spawnAt(0, ctx.groundH(0, 2) + 1.05, 2, 0, false);
      ch5Boss.syncHUD();
      MAY.toast("🐺 Sói Tuyết mời Mây luyện phản xạ: vòng xanh dùng ❄️, vòng vàng dùng ☀️. Sai được thử lại!");
      return true;
    };

    /* Dựng Cột Băng DUY NHẤT 1 lần mỗi lượt tung phép ❄️ khi Boss đang hoạt động */
    ctx.onSpellCast = function (spellId, targetPos) {
      if (spellId === "frost" && !rematch && ch5Boss.active && !ch5Boss.defeated) {
        placeBossIcePillar(targetPos);
      }
    };

    // A separate mountain route keeps the village and existing boss saves intact.
    var expedition = MAY.createChapterJourney(ctx, {
      title: "Qua cầu cùng sói non", entry: [-18, ctx.groundH(-18, 26), 26], color: 0x9eeaff,
      sections: [
        { name: "Trạm trú tuyết", brief: "Rời trạm một mình, nhìn cờ để tìm phía khuất gió.", landmark: "Trạm trú tuyết", length: 620, sky: 0x8faec7, ground: 0xdbeaf4, path: 0xb9d5e6, scenery: "shelter", events: [
          { at: 0.07, kind: "pass", lane: -1, cue: "Cờ bay sang phải: nép sau vách trái", success: "Mây nép sau mái trú" },
          { at: 0.16, kind: "cast", spell: "solar", lane: 0, cue: "Nắng làm tan băng cửa trạm", success: "Cửa trạm mở" },
          { at: 0.25, kind: "fork", choices: ["Sau vách đá", "Sườn gió"], lane: -1, cue: "Chọn đường sau vách đá", success: "Vách đá che tuyết" },
          { at: 0.34, kind: "pass", lane: 1, cue: "Tuyết cuộn bên trái: đi bên phải", success: "Mây qua đợt gió" },
          { at: 0.43, kind: "cast", spell: "frost", lane: 0, cue: "Đóng băng vũng nước trước bậc đá", success: "Mặt nước kết tinh" },
          { at: 0.52, kind: "pass", lane: -1, cue: "Cờ đổi chiều: tìm chỗ khuất bên trái", success: "Mây tìm được chỗ tránh gió" },
          { at: 0.61, kind: "switch", choices: ["Mở cửa trú", "Đi tiếp"], answer: 0, cue: "Mở cửa trạm để đàn sói nghỉ trên đường về", success: "Đèn ấm sáng trong trạm trú" },
          { at: 0.70, kind: "pass", lane: 1, cue: "Theo dấu chân bên phải tảng đá", success: "Dấu chân tiếp tục lên núi" },
          { at: 0.79, kind: "cast", spell: "solar", lane: 0, cue: "Làm tan băng trên biển chỉ đường", success: "Biển chỉ tới sườn khuất gió" },
          { at: 0.89, kind: "pass", lane: -1, cue: "Núp bên trái trước luồng tuyết mới", success: "Mây thấy sườn núi phía trước" }
        ] },
        { name: "Sườn khuất gió", brief: "Đọc chiều gió và tìm đàn sói bên kia sườn núi.", landmark: "Sườn khuất gió", length: 650, sky: 0x789cb7, ground: 0xd4e6f2, path: 0xb5d3e4, scenery: "ice", events: [
          { at: 0.07, kind: "pass", lane: 1, cue: "Cờ bay sang trái: đi bên phải vách đá", success: "Vách đá chắn gió" },
          { at: 0.16, kind: "cast", spell: "solar", lane: 0, cue: "Nắng làm tan băng phủ cờ", success: "Cờ lại bay rõ ràng" },
          { at: 0.25, kind: "pass", lane: -1, cue: "Gió đổi chiều: chuyển sang bên trái", success: "Mây đổi sườn kịp lúc" },
          { at: 0.34, kind: "fork", choices: ["Lối sau đá", "Lối ngoài gió"], lane: -1, cue: "Theo dấu chân nhỏ sau tảng đá", success: "Mây thấy dấu chân sói non" },
          { at: 0.43, kind: "cast", spell: "frost", lane: 0, cue: "Kết băng suối để tìm đàn sói", success: "Mặt băng nối hai bờ" },
          { at: 0.52, kind: "pass", lane: 1, cue: "Tuyết bay từ trái: nép bên phải", success: "Mây tránh luồng gió" },
          { at: 0.61, kind: "switch", choices: ["Gọi đàn sói", "Chạy qua"], answer: 0, cue: "Gọi khẽ để sói non biết có người giúp", success: "Sói con đáp lại phía cầu" },
          { at: 0.70, kind: "pass", lane: -1, cue: "Theo dấu chân bên trái tảng băng", success: "Dấu chân dẫn tới cầu cũ" },
          { at: 0.79, kind: "cast", spell: "solar", lane: 0, cue: "Làm tan băng che lối vào chỗ trú", success: "Lối vào đã thông" },
          { at: 0.89, kind: "pass", lane: 1, cue: "Chọn phía khuất gió trước khi tới cầu", success: "Mây gặp đàn sói non" }
        ] },
        { name: "Cầu băng", brief: "Sửa cầu cho cả đàn; Mây qua một mình chưa đủ.", landmark: "Cầu băng", length: 650, sky: 0x8bb5ce, ground: 0xe3f2fa, path: 0xa9d9ef, scenery: "bridge", companion: "wolf", events: [
          { at: 0.07, kind: "escort", lane: -1, cue: "Đợi sói non sau vách trái", success: "Cả đàn vào chỗ khuất" },
          { at: 0.16, kind: "cast", spell: "frost", lane: 0, cue: "Khoảng hở quá rộng cho sói: dùng Băng nối cầu", success: "Cầu băng nối liền cho cả đàn" },
          { at: 0.25, kind: "escort", lane: 0, cue: "Dẫn đàn giữa cầu, chờ bạn cuối", success: "Sói non theo Mây qua cầu" },
          { at: 0.34, kind: "pass", lane: 1, cue: "Gió thổi từ trái: chọn phía phải", success: "Vách đá che đàn sói" },
          { at: 0.43, kind: "cast", spell: "solar", lane: 0, cue: "Nắng làm tan băng chắn cửa trú", success: "Chỗ trú mở cho đàn sói" },
          { at: 0.52, kind: "escort", lane: 1, cue: "Đưa cả đàn vào chỗ trú bên phải", success: "Sói non nghỉ trong mái trú" },
          { at: 0.61, kind: "cast", spell: "frost", lane: 0, cue: "Đóng băng vũng nước ở nhịp cầu tiếp", success: "Nhịp cầu thứ hai đã vững" },
          { at: 0.70, kind: "escort", lane: 0, cue: "Đi giữa cầu và chờ bạn cuối theo kịp", success: "Bạn cuối đã qua cầu" },
          { at: 0.79, kind: "pass", lane: -1, cue: "Cờ đổi chiều: chuyển sang bên trái", success: "Đàn tránh được gió đổi chiều" },
          { at: 0.89, kind: "escort", lane: -1, cue: "Đưa sói non tới mái trú bên trái", success: "Cả đàn đã qua cây cầu" }
        ] },
        { name: "Đường về làng", brief: "Đàn sói đã an toàn; Mây trở về báo tin cho làng.", landmark: "Đường về làng", length: 670, sky: 0xa5c9df, ground: 0xe5f3fa, path: 0xc4deed, scenery: "shelter", events: [
          { at: 0.07, kind: "pass", lane: 1, cue: "Gió từ trái: nép bên phải", success: "Mây nấp sau vách đá" },
          { at: 0.16, kind: "cast", spell: "frost", lane: 0, cue: "Tạo mặt băng qua suối trên đường về", success: "Mặt suối thành đường an toàn" },
          { at: 0.25, kind: "pass", lane: 0, cue: "Đi giữa nhịp băng mới", success: "Mây đã qua suối" },
          { at: 0.34, kind: "pass", lane: -1, cue: "Cờ đổi chiều: chọn vách trái", success: "Mây thấy phía khuất gió mới" },
          { at: 0.43, kind: "pass", lane: -1, cue: "Nép vào mái trú bên trái", success: "Mây nghỉ qua cơn gió" },
          { at: 0.52, kind: "cast", spell: "solar", lane: 0, cue: "Làm tan băng che biển đường về làng", success: "Biển chỉ đường hiện ra" },
          { at: 0.61, kind: "fork", choices: ["Qua mái trú", "Qua sườn trống"], lane: -1, cue: "Chọn lối có mái trú", success: "Mái trú che Mây khỏi tuyết" },
          { at: 0.70, kind: "pass", lane: 1, cue: "Đổi sang phía phải khi cờ đổi chiều", success: "Mây đổi sườn kịp lúc" },
          { at: 0.79, kind: "cast", spell: "frost", lane: 0, cue: "Sửa nhịp cầu cuối trên đường về", success: "Nhịp cầu cuối đã nối" },
          { at: 0.89, kind: "pass", lane: 0, cue: "Theo dấu đèn về làng báo tin", success: "Mây trở về báo đàn sói đã an toàn!" }
        ] }
      ],
      clearing: {
        section: 2, name: "Đưa sói non về nhà", brief: "Tìm hai sói non, sửa cầu và dẫn cả đàn về mái trú.",
        devices: [
          { id: "pup1", name: "Sói non sau vách đá", x: -17, z: -10, form: "wolf", color: 0xe5f4ff },
          { id: "pup2", name: "Sói non bên suối", x: 16, z: -23, form: "wolf", color: 0xd9ebf7 },
          { id: "thaw", name: "Tuyết phủ chốt cầu", x: 12, z: -7, form: "crystal", color: 0xffca75, spell: "solar" },
          { id: "bridge", name: "Nhịp cầu băng bị nứt", x: 0, z: -20, form: "bridge", color: 0x7dd3fc, spell: "frost" },
          { id: "home", name: "Mái trú ấm", x: 0, z: -32, form: "shelter", color: 0xffd98a }
        ],
        hint: function (v) { return !v.pup1 ? "Tìm sói non phía trái, sau vách đá." : !v.pup2 ? "Tìm sói non thứ hai phía phải bên suối." : v.bridgeTrial && !v.thaw && !v.bridge ? "Dùng Nắng làm tan tuyết phủ chốt cầu bên phải." : !v.bridge ? "Dùng Sương Băng nối nhịp cầu đã sạch tuyết." : "Dẫn cả hai sói non qua cầu tới mái trú phía trước."; },
        action: function (id, v) {
          if (id === "pup1" || id === "pup2") { if(!v.pup1 && !v.pup2 && !v.bridge)v.bridgeTrial=true;v[id] = true; return { text: "Sói non đã tìm thấy Mây và đi theo bạn.", done: false }; }
          if (id === "thaw") { v.thaw=true;return {text:"Nắng làm tan tuyết, lộ chốt cầu để kết băng!",done:false}; }
          if (id === "bridge") { if(v.bridgeTrial && !v.thaw && !v.bridge)return {text:"Tuyết xốp không giữ được băng. Dùng Nắng làm sạch chốt bên phải trước!",done:false};v.bridge = true; return { text: "Nhịp cầu đã nối: dẫn đàn qua được rồi!", done: false }; }
          if (!v.pup1 || !v.pup2) return { text: "Còn sói non đang đợi. Hãy tìm đủ hai bạn!", done: false };
          if (!v.bridge) return { text: "Cầu còn nứt; hãy sửa cầu cho đàn sói.", done: false };
          v.home = true; return { text: "Sói non cuối cùng đã về mái trú và cất tiếng báo an toàn!", done: true };
        },
        look: function (id, v) { var pup = id === "pup1" || id === "pup2"; return { lit: !!v[id], angle: pup ? Math.PI : 0, hide: !!v.home && pup }; },
        links: function (v) { var links=[];if(v.thaw)links.push(["thaw","bridge",0xffca75]);if(v.bridge)links.push(["bridge", "home", 0x7dd3fc]);return links; },
        followers: function (v) { return ["pup1", "pup2"].filter(function (id) { return !!v[id] && !v.home; }); }
      },
      makeVista: function (index) {
        var group = new THREE.Group(), flags = [], wolves = [];
        var poleMat = new THREE.MeshStandardMaterial({ color: 0x586e7d });
        var flagMat = new THREE.MeshStandardMaterial({ color: 0xef826f, side: THREE.DoubleSide });
        [-7, 7].forEach(function (x) {
          var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4, 6), poleMat); pole.position.set(x, 2, -16); group.add(pole);
          var flag = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.1), flagMat); flag.position.set(x + 1.1, 3.5, -16); group.add(flag); flags.push(flag);
        });
        if (index === 2) {
          for (var i = 0; i < 3; i++) {
            var wolf = MAY.makeAnimal("wolf");
            wolf.position.set((i - 1) * 1.4, 0, 4 + i); group.add(wolf); wolves.push(wolf);
          }
        }
        return { group: group, tick: function (distance, lateral, eventIndex, time) {
          flags.forEach(function (flag, i) { flag.rotation.y = Math.sin(time * 3 + i) * 0.35 + (eventIndex % 2 ? -0.6 : 0.6); });
          wolves.forEach(function (wolf, i) { wolf.position.x += (lateral + (i - 1) * 1.4 - wolf.position.x) * 0.04; wolf.position.y = Math.abs(Math.sin(time * 3 + i)) * 0.12; });
        } };
      },
      makeLandmark: function (index) {
        var g = new THREE.Group();
        var wall = new THREE.MeshStandardMaterial({ color: index === 2 ? 0x9ad9f2 : 0xd7edf7, roughness: 0.75 });
        var roof = new THREE.MeshStandardMaterial({ color: 0x4e829c, roughness: 0.8 });
        if (index === 0) {
          var hut = new THREE.Mesh(new THREE.SphereGeometry(4.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), wall); hut.scale.z = 0.55; g.add(hut);
        } else if (index === 1) {
          [-3.3, 3.3].forEach(function (x, i) { var cliff = new THREE.Mesh(new THREE.ConeGeometry(3.5, 6.5 - i, 5), wall); cliff.position.set(x, 2.7, 0); g.add(cliff); });
        } else if (index === 2) {
          [-4, 4].forEach(function (x) { var pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5, 2), wall); pier.position.set(x, 2.5, 0); g.add(pier); });
          var span = new THREE.Mesh(new THREE.BoxGeometry(9, 0.7, 2), roof); span.position.y = 3.4; g.add(span);
        } else {
          var house = new THREE.Mesh(new THREE.BoxGeometry(9, 3.5, 3), wall); house.position.y = 1.75; g.add(house);
          var top = new THREE.Mesh(new THREE.ConeGeometry(6, 3, 4), roof); top.rotation.y = Math.PI / 4; top.position.y = 4.7; g.add(top);
        }
        var sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), new THREE.MeshBasicMaterial({ color: [0xffcf75, 0xf58b81, 0x77d9f4, 0xffd68b][index] })); sign.position.set(3.8, 3.2, 1.1); g.add(sign);
        return g;
      }, onComplete: function () { updateCh5Story(); }
    });

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
        if (ch5St.stage < 3 && expedition.block()) return;
        ch5St.stage = 3; MAY.persist();
        ch5Npc.setMarker("?");
        if (!ch5Boss.active) {
          ch5Boss.activate(function () {
            MAY.openDialogue({
              name: ch5Sc.npcName, role: ch5Sc.npcRole, icon: ch5Sc.npcIcon, color: ch5Sc.npcColor,
              pages: ch5Sc.bossIntro, endBtn: "🦊 Chiến đấu với Sói Tuyết!", voiceClip: "boss_appear"
            });
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
        ctx.addSphereCollider(snowBall.position.x, snowBall.position.y, snowBall.position.z, 1.9, "frozen_snowball");
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

    /* ---- Nhiệm Vụ Phụ Tương Tác Chương 5: Chuyến Củi Ấm Cho Làng Igloo ---- */
    ctx.setupSideQuest({
      npcPos: [8, 32], npcRotY: -0.4, npcScale: 1.15, labelY: 2.3,
      tasks: [
        { id: "wood1",  kind: "wood",   label: "Nhặt Bó Củi Thông Đồi Tây",    pos: [-32, 16], color: 0xd97706 },
        { id: "wood2",  kind: "wood",   label: "Nhặt Bó Củi Thông Đồi Đông",   pos: [32, 14],  color: 0xd97706 },
        { id: "wood3",  kind: "wood",   label: "Nhặt Bó Củi Thông Rừng Bắc",   pos: [-16, -28], color: 0xd97706 },
        { id: "hearth", kind: "hearth", label: "Thắp Lò Sưởi Ấm Làng Igloo",   pos: [-20, 22], color: 0xff9f1c, finalOnly: true }
      ]
    });

    var chillWarnCd = 0;
    ctx.onUpdate = function (dt, t) {
      if (activeIceTrap && activeIceTrap.life > 0) {
        activeIceTrap.life -= dt;
        if (activeIceTrap.life <= 0) clearBossIceTrap();
      }
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
