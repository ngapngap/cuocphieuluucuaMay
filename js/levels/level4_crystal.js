"use strict";
/* ============================================================================
   MÀN 4 — HANG ĐỘNG PHA LÊ (Hang ngầm lung linh — Viên Ngọc Tím Pha Lê 🟣)
   Ánh sáng điện ảnh tương phản cao như Ảnh 1: Nền đá ẩm phản xạ ánh đèn pha lê,
   Tia sáng từ giếng trời hang, Hồ nước ngầm phát sáng, 5 Cụm Pha Lê Nhạc Đô-Rê-Mi
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  MAY.LEVELS.level4 = function () {
    var ctx = MAY.createWorldCtx("level4");
    ctx.mode = "land";
    ctx.waterLevel = 0.1;
    ctx.worldRadius = 86;
    ctx.minimapBg = "rgba(32,20,66,0.94)";

    MAY.setSunOffset(14, 38, 12);
    MAY.sun.color.setHex(0xc8b8ff);
    MAY.sun.intensity = 0.95;
    MAY.hemiLight.color.setHex(0x7c64c4);
    MAY.hemiLight.groundColor.setHex(0x20183c);
    MAY.hemiLight.intensity = 0.42;
    /* Đèn pha trên mũ Mây bật đổ bóng thực trong hang động giống The Hall! */
    MAY.diveLight.intensity = 2.6;
    MAY.diveLight.color.setHex(0xf6eeff);
    MAY.diveLight.distance = 65;
    MAY.diveLight.castShadow = (MAY.quality === "high");
    if (MAY.diveLight.shadow) { MAY.diveLight.shadow.mapSize.set(1024, 1024); MAY.diveLight.shadow.bias = -0.0008; }
    MAY.setAmbientTone(260, 0.042, "level4");
    MAY.setPostGrade({ tint: 0xf6f0ff, vignette: 0.34, bloom: 0.44, ssao: 0.65, godRay: 0.40, godRayColor: 0xc4b5fd, godRaySourcePos: new THREE.Vector3(0, 32, -8) });
    ctx.getSurface = function (x, z) {
      return (Math.abs(x) < 2.6 && z > -30 && z < 14) || Math.hypot(x, z + 8) < 8.4 ? "stone" : "wetstone";
    };

    ctx.landFog = { color: 0x161230, density: 0.0135 };
    ctx.underwaterFog = { color: 0x142c54, density: 0.030 };
    MAY.scene.fog = new THREE.FogExp2(ctx.landFog.color, ctx.landFog.density);
    MAY.scene.background = new THREE.Color(ctx.landFog.color);

    ctx.addSky({
      zenith: 0x0b081c, horizon: 0x261d4a, ground: 0x0c0a18,
      sunDir: new THREE.Vector3(14, 38, 12), sunColor: 0xc084fc, cloudAmt: 0.05, stars: true
    });

    /* Hồ nước ngầm phát sáng tại (0, -8) + bậc đá tự nhiên + Cầu Đá & Đấu Trường Tròn đi bộ chắc chắn */
    var LAKE = { x: 0, z: -8, r: 22 };
    function caveTerrainH(x, z) {
      var d = Math.hypot(x, z);
      var ridge = Math.sin(x * 0.08) * Math.cos(z * 0.07) * 1.5 + Math.sin(x * 0.19) * Math.cos(z * 0.17) * 0.45;
      var h = 2.75 + ridge;
      /* Hành lang vũng nước phẳng mềm ở phía Nam hang (z=16..46) để vũng nước phản chiếu ánh pha lê & đèn lồng như The Hall! */
      var corr = Math.max(0, 1 - Math.hypot(x * 0.055, (z - 30) * 0.055));
      if (corr > 0) h = h * (1 - corr) + 2.66 * corr;
      var ld = Math.hypot(x - LAKE.x, z - LAKE.z);
      if (ld < LAKE.r) {
        var lt = 1 - ld / LAKE.r;
        h = h * (1 - lt) + (-5.0) * lt * lt;
      }
      if (d > 68) h += (d - 68) * 0.45;
      return h;
    }
    /* Đá hang ẩm ướt có vệt bóng phản chiếu đèn pha lê (roughnessMap thật) */
    ctx.groundH = caveTerrainH;
    var caveMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.wetCaveRock.map,
      normalMap: MAY.PBR.wetCaveRock.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: MAY.PBR.wetCaveRock.roughnessMap,
      roughness: 0.78,
      metalness: 0.12
    });
    MAY.applyCaustics(caveMat, 0.1, 0.75);
    ctx.buildTerrain(200, 116, caveMat, {
      intensity: 0.85,
      staticLights: [
        { x: -26, z: 22,  r: 0.75, g: 0.52, b: 1.0,  radius: 22, intensity: 0.52 },
        { x: 28,  z: 20,  r: 0.25, g: 0.78, b: 1.0,  radius: 22, intensity: 0.52 },
        { x: -34, z: -18, r: 0.96, g: 0.46, b: 0.74, radius: 22, intensity: 0.50 },
        { x: 36,  z: -16, r: 0.22, g: 0.86, b: 0.76, radius: 22, intensity: 0.50 },
        { x: 0,   z: -38, r: 0.72, g: 0.54, b: 1.0,  radius: 24, intensity: 0.55 }
      ]
    });

    /* Sau khi dựng địa hình lòng hồ thật, bật mặt cầu đá & Đấu Trường Tròn Golem (y=2.45) để Mây đi qua hồ không bị rơi! */
    ctx.groundH = function (x, z) {
      var h = caveTerrainH(x, z);
      if ((Math.abs(x) < 2.38 && z > -30.5 && z < 14.5) || Math.hypot(x, z + 8) < 8.4) {
        h = Math.max(h, 2.45);
      }
      return h;
    };

    /* Vòm trần hang động + Thạch nhũ rủ xuống từ trên cao */
    var domeMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.wetCaveRock.map, normalMap: MAY.PBR.wetCaveRock.normalMap,
      color: 0x252040, roughness: 0.85, side: THREE.BackSide
    });
    var dome = new THREE.Mesh(new THREE.SphereGeometry(94, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.54), domeMat);
    dome.position.y = -2;
    ctx.add(dome);

    var stalMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.rock, color: 0x3b355c, roughness: 0.78 });
    for (var st = 0; st < 28; st++) {
      var sa = (st * 2.399) % 6.28, sr = 14 + (st * 2.4) % 58;
      var sx = Math.cos(sa) * sr, sz = Math.sin(sa) * sr;
      var sl = 5 + (st % 5) * 2.8;
      var stal = new THREE.Mesh(new THREE.ConeGeometry(1.1 + (st % 3) * 0.5, sl, 7), stalMat);
      stal.rotation.x = Math.PI;
      stal.position.set(sx, 36 - (sr * 0.22), sz);
      ctx.add(stal);
    }

    /* Hồ nước ngầm phát sáng (tắt planar riêng để nhường Planar Reflection cho Vũng Nước Sàn Hang Ướt!) */
    var lakeW = ctx.addWater({
      width: 52, height: 52, segs: 48, y: 0.1, offsetX: LAKE.x, offsetZ: LAKE.z, planarReflect: false,
      sunDir: new THREE.Vector3(14, 38, 12),
      deepColor: 0x0c1d4a, shallowColor: 0x2a88c8, skyColor: 0x7a5cf5, sunColor: 0xe6d4ff,
      foamCenter: new THREE.Vector3(LAKE.x, 0.1, LAKE.z), foamRadius: 18.2, waveAmp: 0.08
    });
    lakeW.position.set(LAKE.x, 0.1, LAKE.z);

    /* Tia sáng giếng trời hang Screen-Space Volumetric God Rays + Bụi pha lê bay lơ lửng */
    if (MAY.setGodRays) MAY.setGodRays({ color: 0xc4b5fd, strength: 0.40, density: 0.90, decay: 0.93, sourcePos: new THREE.Vector3(0, 32, -8) });
    ctx.addAmbientParticles({ count: 320, spread: 100, minY: 0.8, maxY: 22, vy: 0.18, color: 0xd8b4fe, size: 0.2, opacity: 0.85 });

    /* VŨNG NƯỚC PHẢN CHIẾU THỜI GIAN THỰC TRÊN SÀN HANG ƯỚT (Trực tiếp tái hiện chất liệu sàn ướt "The Hall"!) */
    var puddleGeo = new THREE.PlaneGeometry(54, 34); puddleGeo.rotateX(-Math.PI / 2);
    ctx.addReflective(puddleGeo, {
      baseMap: MAY.PBR.wetCaveRock.map,
      maskMap: MAY.PBR.wetCaveRock.puddleMask,
      tint: 0x7c76a8,
      strength: 0.94,
      repeat: 4.5,
      puddleOverlay: true,
      fogColor: 0x161230,
      fogDensity: 0.0135
    }, new THREE.Vector3(0, 2.71, 30));

    /* Cầu đá + Đấu Trường Tròn Golem có vết rêu ẩm không lặp, cột chống & đèn lồng chính đổ bóng thật! */
    var bridgeMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap,
      roughnessMap: MAY.PBR.stoneWall.roughnessMap, color: 0x625a82, roughness: 0.65
    });
    MAY.applyWorldWeathering(bridgeMat, { waterY: 0.1, caustics: 0.35, macro: 0.14, stain: 0.28, wallGrime: 0.32, stainColor: 0x262040 });
    var archBridge = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.75, 45), bridgeMat);
    archBridge.position.set(0, 2.08, -8); archBridge.castShadow = true; archBridge.receiveShadow = true;
    ctx.add(archBridge);
    /* Sàn Đấu Trường Tròn r=8.4m ở giữa hồ (đỡ trên 4 cột đá cắm sâu xuống đáy hồ để vẫn bơi lặn dưới hồ được!) */
    var arenaDeck = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 8.8, 0.75, 28), bridgeMat);
    arenaDeck.position.set(0, 2.08, -8); arenaDeck.castShadow = true; arenaDeck.receiveShadow = true;
    ctx.add(arenaDeck);
    var arenaTrim = new THREE.Mesh(new THREE.TorusGeometry(8.3, 0.18, 8, 32), new THREE.MeshStandardMaterial({ color: 0x9f8fe0, emissive: 0x6d28d9, emissiveIntensity: 0.4, roughness: 0.35 }));
    arenaTrim.rotation.x = Math.PI / 2; arenaTrim.position.set(0, 2.46, -8); ctx.add(arenaTrim);
    [[-5.2, -13.2], [5.2, -13.2], [-5.2, -2.8], [5.2, -2.8], [0, 8], [0, -24]].forEach(function (pp) {
      var pier = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 7.2, 10), bridgeMat);
      pier.position.set(pp[0], -1.6, pp[1]); pier.castShadow = true; ctx.add(pier);
      ctx.addCollider(pp[0], pp[1], 0.92, "bridge_pier", { minY: -6.0, maxY: 2.0 });
    });
    var postMat = new THREE.MeshStandardMaterial({ color: 0x2b2630, metalness: 0.7, roughness: 0.4 });
    [[-2.2, 11], [2.2, 11], [-2.2, -27], [2.2, -27], [-7.2, -3.5], [7.2, -3.5], [-7.2, -12.5], [7.2, -12.5], [2.2, 28]].forEach(function (lp, lIdx) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 3.1, 8), postMat);
      var py = ctx.groundH(lp[0], lp[1]);
      post.position.set(lp[0], py + 1.55, lp[1]); post.castShadow = true; ctx.add(post);
      ctx.addCollider(lp[0], lp[1], 0.30, "lantern_post", { minY: py - 0.5, maxY: py + 3.2 });
      var lan = MAY.makeCagedLantern(0xffb85c, lIdx === 0 ? 3.2 : 2.4, 24, lIdx === 0);
      lan.position.set(lp[0], py + 3.15, lp[1]); ctx.add(lan);
    });
    if (MAY.add3DLoop) {
      MAY.add3DLoop([0, 0.8, -8], { kind: "water", freq: 520, vol: 0.045, maxDist: 42 });
      MAY.add3DLoop([0, 4.0, -36], { kind: "crystal", freq: 370, vol: 0.022, maxDist: 38 });
      MAY.add3DLoop([-2.2, 5.5, 11], { kind: "fire", freq: 760, vol: 0.028, maxDist: 26 });
    }

    /* Đá vụn ẩm & mảnh tinh thể rải sàn hang + quanh đầu cầu/cụm pha lê lớn */
    var caveDebrisGeo = new THREE.DodecahedronGeometry(0.18, 0);
    var caveDebrisMat = new THREE.MeshStandardMaterial({ color: 0x37354b, roughness: 0.95, flatShading: true });
    MAY.scatterDebris(ctx, 140, function (x, z) { return Math.hypot(x - LAKE.x, z - LAKE.z) > LAKE.r + 2; }, { spread: 68, geo: caveDebrisGeo, mat: caveDebrisMat });
    MAY.scatterPropCluster(ctx, [
      { x: 0, z: 16, rMin: 2.8, rMax: 6.2, count: 18 },
      { x: 0, z: -36, rMin: 2.5, rMax: 6.5, count: 18 },
      { x: -26, z: 22, rMin: 2.0, rMax: 5.5, count: 14 },
      { x: 28, z: 20, rMin: 2.0, rMax: 5.5, count: 14 }
    ], { geo: caveDebrisGeo, mat: caveDebrisMat });

    /* Các cụm Pha Lê khổng lồ trong suốt phản chiếu + Đèn thực tế tỏa sáng lên mặt đá ướt */
    var crysCols = [0xc084fc, 0x38bdf8, 0xf472b6, 0x2dd4bf, 0xa78bfa];
    var crystalGeo = new THREE.ConeGeometry(0.45, 1, 6);
    var crystalMats = {};
    function makeCrystalCluster(color, sc, addLight) {
      var g = new THREE.Group();
      var mat = crystalMats[color] || (crystalMats[color] = new THREE.MeshStandardMaterial({
        color: color, emissive: color, emissiveIntensity: 0.24, roughness: 0.55, metalness: 0.08
      }));
      for (var k = 0; k < 5; k++) {
        var h = (1.8 + (k % 3) * 1.1) * sc;
        var sp = new THREE.Mesh(crystalGeo, mat);
        sp.scale.set(sc, h, sc);
        var a = (k / 5) * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.45 * sc, h * 0.42, Math.sin(a) * 0.45 * sc);
        sp.rotation.z = Math.cos(a) * 0.28; sp.rotation.x = -Math.sin(a) * 0.28;
        g.add(sp);
      }
      if (addLight) {
        var pl = MAY.makePooledLight ? MAY.makePooledLight(color, 2.2, 28) : new THREE.PointLight(color, 2.2, 28);
        pl.position.y = 2.5 * sc; g.add(pl);
      }
      return g;
    }

    [[-26, 22, 1.4, true], [28, 20, 1.35, true], [-34, -18, 1.5, true], [36, -16, 1.45, true], [0, -38, 1.6, true], [-18, -44, 1.2, false], [22, -42, 1.3, false], [-48, 4, 1.4, false], [48, 2, 1.35, false]].forEach(function (cp, idx) {
      var cl = makeCrystalCluster(crysCols[idx % crysCols.length], cp[2], cp[3]);
      var cy = ctx.groundH(cp[0], cp[1]);
      cl.position.set(cp[0], cy, cp[1]);
      ctx.add(cl);
      ctx.addCollider(cp[0], cp[1], cp[2] * 0.72, "crystal", { maxY: cy + cp[2] * 3.8 });
    });

    /* Cá & Sứa phát sáng bơi trong hồ ngầm */
    var lakeCreatures = [];
    for (var lc = 0; lc < 6; lc++) {
      var fg = MAY.fishBody(lc % 2 === 0 ? 0x38bdf8 : 0xe879f9, 1.1, lc % 3);
      ctx.add(fg);
      lakeCreatures.push({ g: fg, a: lc * 1.05, r: 5 + (lc % 3) * 4.5, y: -2.2 + (lc % 2) * 0.9 });
    }

    /* Bệ Ngọc Tím Pha Lê tại (0, -36) */
    ctx.addGemAltar([0, -36]);

    /* ---- 10 Tinh Thể Pha Lê (Nhiệm vụ chính) ---- */
    var shardGeo = new THREE.OctahedronGeometry(0.72, 0); shardGeo.scale(0.68, 1.45, 0.68);
    var shardMat = new THREE.MeshPhysicalMaterial({ color: 0xd8b4fe, emissive: 0xa855f7, emissiveIntensity: 1.05, roughness: 0.08, clearcoat: 1.0 });
    ctx.addCollectibles([
      [-16, 30], [16, 30], [-34, 12], [36, 10], [-42, -16],
      [42, -18], [-24, -36], [24, -36], [-13, -1.8, -10], [13, -2.0, -12]
    ], { color: 0xc084fc, icon: "💎", yOff: 1.3, makeMesh: function () { return new THREE.Mesh(shardGeo, shardMat); } });

    /* ---- 5 Bạn Hang Động + Dơi Nhỏ Bibi bay soi đèn phía trước Mây (không trùng Nhạc Sư Cú Mèo!) ---- */
    ctx.addFriends([
      { name: "Rùa Pha Lê",       kind: "tortoise", pos: [-22, 24], greet: "🐢 Rùa Pha Lê lấp lánh vẫy chào Mây!" },
      { name: "Kỳ Nhông Axolotl", kind: "axolotl",  pos: [-13, -1.8, -4], behavior: "swim", greet: "🩷 Kỳ nhông hồng vẫy mang bơi quanh Mây!" },
      { name: "Chuột Chũi Đèn",   kind: "mole",     pos: [30, 14],  greet: "🔦 Chuột Chũi bật mũ đèn sáng rực chào Mây!" },
      { name: "Đom Đóm Chúa",     kind: "firefly",  pos: [28, 6.5, -24], behavior: "fly", orbitR: 6, greet: "✨ Đom Đóm Chúa vẽ vòng sáng chào Mây!" },
      { name: "Dơi Nhỏ Bibi",     kind: "bat",      pos: [-28, 6.0, -22], behavior: "fly", orbitR: 7, greet: "🦇 Dơi nhỏ Bibi cười hì hì dẫn đường cho Mây!" }
    ]);
    ctx.setCompanion("bat", "🦇 Bibi", { flying: true, light: 0xc084fc, color: 0xa855f7 });

    /* ---- 3 Rương Pha Lê, 4 Nấm Đèn Ngầm, 5 Cụm Pha Lê Nhạc Đô-Rê-Mi-Fa-Son ---- */
    ctx.addChests([[-40, 20], [42, -4], [-28, -40]], 0x9b6dff);

    ctx.addSouvenirs([[-14, 18], [22, 24], [-32, -8], [32, -26]].map(function (p, i) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9, roughness: 0.2 }));
      m.position.y = 0.4;
      return { id: "gm" + i, pos: p, mesh: m, color: 0x38bdf8, msg: "Nhặt được Nấm Đèn Ngầm" };
    }));

    var chimeNames = ["Đô 🎵", "Rê 🎵", "Mi 🎵", "Son 🎵", "La 🎵"];
    ctx.addInteractProps([[-12, 14], [12, 14], [-22, -4], [22, -4], [7, -32]].map(function (p, i) {
      var cl = makeCrystalCluster(crysCols[i], 0.85, false);
      var cpy = ctx.groundH(p[0], p[1]);
      cl.position.set(p[0], cpy, p[1]);
      ctx.addCollider(p[0], p[1], 0.65, "chime_crystal", { minY: cpy - 0.5, maxY: cpy + 2.8 });
      return {
        id: "ch" + i, obj: cl, label: "Gõ pha lê nhạc " + chimeNames[i],
        sound: "chime", burstColor: crysCols[i],
        toastText: "Tiếng pha lê ngân vang nốt " + chimeNames[i] + "!",
        sayText: "Pha lê ngân vang quá!",
        onActivate: function (obj) { obj.scale.setScalar(1.22); }
      };
    }));

    /* Bảo vật ẩn: Viên Ngọc Trai Ánh Trăng dưới đáy hồ ngầm (vùng nước mở phía Đông đấu trường) */
    var moonPearl = new THREE.Mesh(new THREE.SphereGeometry(0.68, 18, 14),
      new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, emissive: 0x93c5fd, emissiveIntensity: 0.95, roughness: 0.05, metalness: 0.2, clearcoat: 1.0 }));
    ctx.addHiddenTreasure([13, -2.6, -2], {
      name: "Ngọc Trai Ánh Trăng",
      hint: "Có ánh trăng dịu nhẹ lấp lánh dưới đáy hồ nước ngầm...",
      mesh: moonPearl, color: 0x93c5fd
    });

    /* 3 Thử thách Màn 4 */
    ctx.addRingsChallenge([[-18, 22], [-28, 6], [-24, -18], [-6, -30], [24, -18]], { title: "5 vòng pha lê ánh sáng", color: 0xd8b4fe, emissive: 0x7e22ce });
    ctx.addRaceChallenge([14, 24], [[32, 14], [34, -16], [0, -30], [-30, -8]], { title: "Đua cùng Dơi Bibi", time: 55 });
    ctx.addQuizStation([0, 26], { label: "Cổng Đố Hình Học" });

    ctx.addPortal([0, 48], "hub", "🏝️ Về Đảo Mây", 0xc084fc);

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.fillStyle = "#38bdf8";
      mm.beginPath(); mm.arc(C + LAKE.x * K, C + LAKE.z * K, LAKE.r * K, 0, 6.29); mm.fill();
    };

    ctx.onUpdate = function (dt, t) {
      lakeCreatures.forEach(function (lc) {
        lc.a += dt * 0.45;
        lc.g.position.set(LAKE.x + Math.cos(lc.a) * lc.r, lc.y + Math.sin(t * 2 + lc.a) * 0.25, LAKE.z + Math.sin(lc.a) * lc.r);
        lc.g.rotation.y = -lc.a - Math.PI / 2;
      });
    };

    /* ---- CỐT TRUYỆN CHƯƠNG 4: Nhạc Sư Cú Mèo (!) -> Thắp 2 Đuốc (☀️) -> Học Pha Lê (💎) -> Phá Tường + Đàn Nhạc Đô-Mi-Son -> Trùm Golem! ---- */
    ctx.checkpoint = new THREE.Vector3(0, ctx.groundH(0, 36) + 1.1, 36);
    var ch4St = ctx.story;
    var ch4Sc = MAY.STORY_SCRIPTS.level4;
    ctx.setupAtmosphere(
      { fog: 0x0b0818, density: 0.0175, sunInt: 0.55, hemiInt: 0.26 },
      { fog: 0x1a1640, density: 0.012, sunInt: 1.15, hemiInt: 0.48 },
      !!ch4St.bossDown
    );

    /* Hồi 1: 2 Ngọn Đuốc Pha Lê bị tắt đầu hang (thắp bằng ☀️ Tia Nắng!) */
    var torchPositions = [new THREE.Vector3(-10, ctx.groundH(-10, 24), 24), new THREE.Vector3(10, ctx.groundH(10, 24), 24)];
    var torchFlames = [];
    torchPositions.forEach(function (tp, idx) {
      var tg = new THREE.Group(); tg.position.copy(tp);
      var base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 2.2, 8), bridgeMat); base.position.y = 1.1; tg.add(base);
      var orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshPhysicalMaterial({ color: 0x3b355c, emissive: 0x000000, roughness: 0.15, clearcoat: 1.0 }));
      orb.position.y = 2.6; tg.add(orb);
      var pl = MAY.makePooledLight ? MAY.makePooledLight(0xffcb69, 0, 28) : new THREE.PointLight(0xffcb69, 0, 28); pl.position.y = 3.2; tg.add(pl);
      if (ch4St.steps["torch" + idx]) { orb.material.color.setHex(0xffe066); orb.material.emissive.setHex(0xff9f1c); orb.material.emissiveIntensity = 1.2; pl.intensity = 3.2; }
      ctx.add(tg);
      ctx.addCollider(tp.x, tp.z, 0.72, "torch_ped", { minY: tp.y - 0.5, maxY: tp.y + 2.6 });
      torchFlames.push({ orb: orb, pl: pl });
    });

    /* Hồi 3A: Bức Tường Pha Lê Nứt chắn cầu sang hồ ngầm (phá bằng 💎 Cộng Hưởng!) */
    var crackedWall = MAY.buildCrackedWall(ctx, 0, ctx.groundH(0, 14), 14, 0, 0x9333ea, "c4_wall");
    if (ch4St.steps.wallBroken) crackedWall.shatter(true);

    /* Hồi 3B: Câu Đố Đàn Nhạc 3 Nốt (Đô 1 -> Mi 2 -> Son 3) phải bắn 💎 đúng thứ tự! */
    var echoCoords = [
      { pos: new THREE.Vector3(-16, ctx.groundH(-16, 10), 10), label: "🎵 Nốt 1: ĐÔ", noteIdx: 0, col: 0x38bdf8 },
      { pos: new THREE.Vector3(16, ctx.groundH(16, 10), 10),   label: "🎵 Nốt 2: MI", noteIdx: 2, col: 0x4ade80 },
      { pos: new THREE.Vector3(0, ctx.groundH(0, -28), -28),   label: "🎵 Nốt 3: SON", noteIdx: 3, col: 0xf472b6 }
    ];
    var echoBaseGeo = new THREE.CylinderGeometry(1.05, 1.22, 0.48, 8);
    var echoBaseMat = new THREE.MeshStandardMaterial({ color: 0x554e6a, roughness: 0.8 });
    var echoShapeGeo = [new THREE.SphereGeometry(0.72, 14, 10), new THREE.ConeGeometry(0.78, 2.05, 3), new THREE.OctahedronGeometry(0.9, 0)];
    var echoMeshes = echoCoords.map(function (ec, idx) {
      var m = new THREE.Group();
      var base = new THREE.Mesh(echoBaseGeo, echoBaseMat); base.position.y = 0.24; m.add(base);
      var top = new THREE.Mesh(echoShapeGeo[idx], new THREE.MeshStandardMaterial({ color: ec.col, emissive: ec.col, emissiveIntensity: 0.3, roughness: 0.35, flatShading: true }));
      top.position.y = 1.65; if (idx === 2) top.scale.y = 1.25; m.add(top);
      var symbol = MAY.makeLabel(["●", "▲", "◆"][idx], { sx: 1.2, sy: 1.2, w: 96, h: 96, fontSize: 56, bg: "rgba(20,20,32,.95)", color: "#ffffff" });
      symbol.position.set(0, 2.8, 0); m.add(symbol);
      m.userData.noteTop = top; m.userData.noteTime = 0;
      m.position.copy(ec.pos); ctx.add(m);
      ctx.addCollider(ec.pos.x, ec.pos.z, 0.92, "echo_crystal", { minY: ec.pos.y - 0.5, maxY: ec.pos.y + 3.6 });
      return m;
    });
    function pulseEcho(idx) { echoMeshes[idx].userData.noteTime = 0.65; }
    var caveUpdate = ctx.onUpdate;
    ctx.onUpdate = function (dt, t) {
      if (caveUpdate) caveUpdate(dt, t);
      echoMeshes.forEach(function (m, i) {
        var data = m.userData, top = data.noteTop;
        data.noteTime = Math.max(0, data.noteTime - dt);
        var hit = data.noteTime / 0.65;
        top.position.y = 1.65 + Math.sin(t * 1.8 + i) * 0.07 - Math.sin(hit * Math.PI) * 0.3;
        top.material.emissiveIntensity = 0.3 + hit * 1.4;
        top.rotation.y += dt * (0.3 + hit * 2);
      });
    };
    var echoPatterns = [[0, 1, 2], [2, 0, 1]];
    var echoRound = ch4St.steps.echoRound === 1 ? 1 : 0;
    var echoProgress = Math.max(0, Math.min(2, Number(ch4St.steps.echoProgress) || 0));
    var practiceActive = false, practiceProgress = 0;
    var noteNames = ["● ĐÔ", "▲ MI", "◆ SON"], replayToken = 0;
    var played = echoPatterns[echoRound].slice(0, echoProgress);
    var musicPanel = document.getElementById("crystal-music");
    var musicStatus = document.getElementById("crystal-music-status");
    var noteButtons = musicPanel.querySelectorAll("[data-note]");
    var echoTargets = [];
    musicPanel.querySelectorAll("button").forEach(function (b) {
      b.onkeydown = function (event) { if (event.code === "Space") { event.preventDefault(); b.click(); } };
    });
    document.getElementById("crystal-close").onclick = function () { ++replayToken; musicPanel.classList.add("hidden"); };
    function replayNotes(notes) {
      var token = ++replayToken;
      noteButtons.forEach(function (b) { b.classList.remove("flash"); });
      notes.forEach(function (n, i) {
        setTimeout(function () {
          if (token !== replayToken || MAY.currentCtx !== ctx) return;
          noteButtons.forEach(function (b) { b.classList.remove("flash"); });
          noteButtons[n].classList.add("flash");
          musicStatus.textContent = "♪ " + noteNames[n];
          pulseEcho(n);
          MAY.sndChime(echoCoords[n].noteIdx);
          setTimeout(function () {
            if (token === replayToken && MAY.currentCtx === ctx) noteButtons[n].classList.remove("flash");
          }, 360);
        }, i * 600);
      });
    }
    document.getElementById("crystal-replay-target").onclick = function () { replayNotes(practiceActive ? [1, 2, 0] : echoPatterns[echoRound]); };
    document.getElementById("crystal-replay-played").onclick = function () { if (played.length) replayNotes(played); else musicStatus.textContent = "Mây chưa gõ nốt nào."; };
    noteButtons.forEach(function (b, i) { b.onclick = function () { if (MAY.currentCtx === ctx && echoTargets[i] && echoTargets[i].isActive()) echoTargets[i].onHit(); }; });
    function echoLesson() {
      var phrase = echoPatterns[echoRound].map(function (n) { return noteNames[n]; }).join(" → ");
      MAY.toast("🎵 Nghe và nhìn nhịp: " + phrase + ". Hãy tự gõ lại bằng phép 💎!");
      musicPanel.classList.remove("hidden");
      replayNotes(echoPatterns[echoRound]);
    }

    /* 3 Golem Đá Nhỏ canh giữ khu vực pha lê */
    if (!ch4St.bossDown) {
      [[-18, 4], [18, 4], [14, -26]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l4_golem_" + i, kind: "stonegolem", name: "Golem Đá Bóng Đêm", pos: ep, weakSpell: "crystal", speed: 2.9, patrolR: 6 });
      });
    }

    /* TRÙM CHƯƠNG 4: 🗿 Golem Pha Lê Khổng Lồ (Rigged Blender GLB — Dùng 💎 phá Giáp Đá -> ☀️ thanh tẩy lõi!) */
    var titanMesh = MAY.makeRiggedBoss("golem", 1.08, "stonegolem", 2.55, { tagMat: { armor: "GolemObsidian" } });
    var ch4Npc;
    var ch4Boss = ctx.setBoss({
      name: "Golem Pha Lê Khổng Lồ", icon: "🗿",
      pos: new THREE.Vector3(0, 2.45, -8), arenaR: 25, maxHp: 3, mesh: titanMesh,
      startActive: ch4St.stage === 3 && !ch4St.bossDown,
      tipFn: function (b) {
        return b.subState.armorBroken
          ? "💡 Giáp đá vỡ tan lộ lõi tím rồi! Tung ngay ☀️ Tia Nắng (Phím 3 + R) thanh tẩy nó!"
          : "💡 Titan đang bọc Giáp Đá Đen! Dùng 💎 Cộng Hưởng (Phím 4 + R) đập vỡ giáp trước!";
      },
      onTick: function (dt, t, bs) {
        var ang = Math.atan2(MAY.player.pos.x - bs.pos.x, MAY.player.pos.z - bs.pos.z);
        bs.mesh.rotation.y = ang + Math.PI;
        bs.mesh.position.y = bs.mesh.userData.mixer ? 2.45 : (2.48 + Math.sin(t * 2.0) * 0.32);
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 34) {
          bs.atkT = 3.5;
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("attack", false);
          var dir = new THREE.Vector3().subVectors(MAY.player.pos, bs.pos).normalize();
          ctx.spawnBossOrb(bs.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), dir, {
            speed: 10.5, radius: 0.95, reflectable: true, reflectSpell: "crystal", color: 0x3b355c, emissive: 0xc084fc,
            onReflectHitBoss: function (b) {
              b.subState.armorBroken = true;
              if (b.mesh.userData.armor) b.mesh.userData.armor.material.emissive.setHex(0xa855f7);
              if (b.mesh.userData.playClip) b.mesh.userData.playClip("hit", false);
              b.syncHUD();
              MAY.sndShatter(b.pos);
              MAY.toast("💎 Tảng đá bật ngược đập vỡ Giáp Đá của Titan! Bắn ngay ☀️ Tia Nắng (3 + R)!");
            }
          });
          MAY.toast("🗿 Titan ném tảng đá! Né hoặc dùng 💎 Cộng Hưởng (4 + R) phản đòn vỡ giáp!");
        }
      },
      onSpellHit: function (spellId, castPos, bs) {
        if (spellId === "crystal") {
          bs.subState.armorBroken = true;
          if (bs.mesh.userData.armor) bs.mesh.userData.armor.material.emissive.setHex(0xc084fc);
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
          MAY.sndShatter(bs.pos);
          MAY.VFX.spawnShatterBurst(bs.pos.clone().add(new THREE.Vector3(0, 2, 0)), 0xc084fc);
          bs.syncHUD();
          MAY.toast("💎 Sóng âm làm vỡ tan Giáp Đá Đen! Tung ngay ☀️ Tia Nắng (Phím 3 + R) vào lõi tím!");
        } else if (spellId === "solar") {
          if (bs.subState.armorBroken) {
            bs.subState.armorBroken = false;
            if (ch4St.steps.echoArmor) { ch4St.steps.echoArmor = false; MAY.persist(); }
            if (bs.mesh.userData.armor) bs.mesh.userData.armor.material.emissive.setHex(0x000000);
            if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
            bs.damage("☀️ Tia Nắng chiếu thẳng vào lõi thanh tẩy Golem Pha Lê!");
          } else {
            MAY.toast("💡 Giáp đá chặn mất tia nắng rồi! Dùng 💎 Cộng Hưởng (Phím 4 + R) phá giáp trước nhé!");
          }
        }
      },
      onDefeat: function () {
        if (titanMesh.userData.playClip) titanMesh.userData.playClip("defeat", false);
        ch4St.stage = 4; MAY.persist();
        ch4Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI NHẠC SƯ CÚ MÈO NHẬN 🟣 NGỌC TÍM PHA LÊ!", ch4Npc.pos);
        MAY.toast("🎵 Golem đã tỉnh ngộ, hang pha lê rực sáng! Về gặp Cú Mèo nhận thưởng!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    function updateCh4Story() {
      if (ch4St.rewarded || ctx.save.gem) {
        ch4Npc.setMarker("♥");
        ctx.setObjective("🟣", "HANG PHA LÊ ĐÃ NGÂN VANG — SANG CHƯƠNG 5 XỨ TUYẾT (PHÍM M)", null);
        return;
      }
      if (ch4St.bossDown) {
        ch4Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI NHẠC SƯ CÚ MÈO NHẬN 🟣 NGỌC TÍM PHA LÊ!", ch4Npc.pos);
        return;
      }
      if (ch4St.stage === 0) {
        ch4Npc.setMarker("!");
        ctx.setObjective("💬", "TRÒ CHUYỆN VỚI NHẠC SƯ CÚ MÈO (!)", ch4Npc.pos);
        return;
      }
      var litT = (ch4St.steps.torch0 ? 1 : 0) + (ch4St.steps.torch1 ? 1 : 0);
      if (litT < 2) {
        ch4Npc.setMarker("?");
        ctx.setObjective("☀️", "DÙNG ☀️ TIA NẮNG (3+R) THẮP 2 ĐUỐC PHA LÊ (" + litT + "/2)", ch4St.steps.torch0 ? torchPositions[1] : torchPositions[0]);
        return;
      }
      if (ch4St.stage < 2) {
        ch4Npc.setMarker("!");
        ctx.setObjective("💬", "QUAY LẠI NHẠC SƯ CÚ MÈO NHẬN PHÉP 💎 CỘNG HƯỞNG (!)", ch4Npc.pos);
        return;
      }
      if (!ch4St.steps.wallBroken) {
        ch4Npc.setMarker("?");
        ctx.setObjective("💎", "DÙNG 💎 CỘNG HƯỞNG (4+R) ĐẬP VỠ TƯỜNG PHA LÊ NỨT", crackedWall.pos);
        return;
      }
      if (!ch4St.steps.echoDone) {
        ch4Npc.setMarker("?");
        ctx.setObjective("🎵", "NHỚ VÀ GÕ NHỊP " + (echoRound + 1) + "/2 BẰNG 💎 (" + echoProgress + "/3) · ● ĐÔ  ▲ MI  ◆ SON", null);
        return;
      }
      ch4St.stage = 3; MAY.persist();
      ch4Npc.setMarker("?");
      if (!ch4Boss.active) {
        ch4Boss.activate(function () {
          MAY.openDialogue({
            name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor,
            pages: ch4Sc.bossIntro, endBtn: "🗿 Chiến đấu với Golem Pha Lê!", voiceClip: "boss_appear"
          });
        });
      }
      if (ch4St.steps.echoArmor) {
        ch4Boss.subState.armorBroken = true;
        if (ch4Boss.mesh.userData.armor) ch4Boss.mesh.userData.armor.material.emissive.setHex(0xc084fc);
        ch4Boss.syncHUD();
      }
      ctx.setObjective("🗿", ch4Boss.subState.armorBroken ? "NHỊP PHA LÊ ĐÃ MỞ GIÁP! CHIẾU ☀️ VÀO LÕI GOLEM!" : "PHÁ GIÁP (💎) + CHIẾU NẮNG (☀️) HẠ GOLEM PHA LÊ!", ch4Boss.pos);
    }

    torchPositions.forEach(function (tp, idx) {
      ctx.addSkillTarget({
        id: "l4_torch_" + idx, pos: tp, radius: 8.5, reqSpell: "solar",
        hint: "☀️ Thắp Đuốc Pha Lê (" + (idx + 1) + "/2)", done: !!ch4St.steps["torch" + idx],
        isActive: function () { return ch4St.stage >= 1 && !ch4St.steps["torch" + idx]; },
        onHit: function (sp, tg) {
          ch4St.steps["torch" + idx] = true; MAY.persist();
          torchFlames[idx].orb.material.color.setHex(0xffe066);
          torchFlames[idx].orb.material.emissive.setHex(0xff9f1c);
          torchFlames[idx].orb.material.emissiveIntensity = 1.25;
          torchFlames[idx].pl.intensity = 3.2;
          tg.markDone();
          MAY.sndLaser(tp);
          MAY.toast("☀️ Đuốc Pha Lê bừng sáng xua bóng tối!");
          updateCh4Story();
        }
      });
    });

    ctx.addSkillTarget({
      id: "l4_wall", pos: crackedWall.pos, radius: 8.5, reqSpell: "crystal",
      hint: "💎 Phá Tường Pha Lê Nứt!", done: !!ch4St.steps.wallBroken,
      isActive: function () { return ch4St.stage >= 2 && !ch4St.steps.wallBroken; },
      onHit: function (sp, tg) {
        ch4St.steps.wallBroken = true; MAY.persist();
        crackedWall.shatter(false);
        tg.markDone();
        echoLesson();
        updateCh4Story();
      }
    });

    echoCoords.forEach(function (ec, idx) {
      echoTargets[idx] = ctx.addSkillTarget({
        id: "l4_echo_" + idx, pos: ec.pos, radius: 9.0, reqSpell: "crystal",
        hint: "💎 " + ["● ĐÔ", "▲ MI", "◆ SON"][idx], hintY: 4.1, done: false,
        isActive: function () { return practiceActive || (ch4St.stage >= 2 && !!ch4St.steps.wallBroken && !ch4St.steps.echoDone); },
        onHit: function () {
          ++replayToken;
          noteButtons.forEach(function (b) { b.classList.remove("flash"); });
          played = played.slice(0, practiceActive ? practiceProgress : echoProgress);
          played.push(idx);
          musicStatus.textContent = "Đã gõ: " + played.map(function (n) { return noteNames[n]; }).join(" → ");
          MAY.sndChime(ec.noteIdx);
          MAY.burstAt(ec.pos.clone().add(new THREE.Vector3(0, 2, 0)), ec.col, 22);
          pulseEcho(idx);
          if (practiceActive) {
            if ([1, 2, 0][practiceProgress] !== idx) {
              MAY.toast("🎵 Thử lại nốt " + (practiceProgress + 1) + ": ▲ MI → ◆ SON → ● ĐÔ");
              return;
            }
            practiceProgress++;
            if (practiceProgress === 3) {
              practiceActive = false; ch4St.steps.echoPracticeDone = true; MAY.persist(); musicPanel.classList.add("hidden");
              MAY.sndStar(); MAY.burstAt(MAY.player.pos.clone(), 0xffd93d, 28);
              MAY.toast("⭐ Giỏi quá! Mây nhận một màn pháo sao luyện nhạc!");
            } else MAY.toast("🎵 Đúng nốt " + practiceProgress + "/3 trong bài luyện!");
            return;
          }
          if (echoPatterns[echoRound][echoProgress] !== idx) {
            MAY.toast("🎵 Chưa đúng nốt " + (echoProgress + 1) + ". Nhớ lại nhịp và thử lại nốt này nhé!");
            return;
          }
          echoProgress++;
          if (echoProgress >= 3 && echoRound === 0) {
            echoRound = 1; echoProgress = 0; played = [];
            ch4St.steps.echoRound = 1; ch4St.steps.echoProgress = 0; MAY.persist();
            echoLesson();
          } else if (echoProgress >= 3) {
            ch4St.steps.echoProgress = 3; ch4St.steps.echoDone = true; ch4St.steps.echoArmor = true; MAY.persist();
            musicPanel.classList.add("hidden");
            MAY.toast("🎵 Nhịp mới làm nứt giáp Golem! Dùng ☀️ chiếu vào lõi!");
          } else {
            ch4St.steps.echoProgress = echoProgress; MAY.persist();
            MAY.toast("🎵 Đúng nốt " + echoProgress + "/3! Hãy nhớ nốt tiếp theo.");
          }
          updateCh4Story();
        }
      });
    });

    ctx.interactives.push({
      obj: echoMeshes[0], label: "🎵 Mở đàn pha lê / luyện nhạc",
      isActive: function () { return (ch4St.stage >= 2 && ch4St.steps.wallBroken && !ch4St.steps.echoDone) || !!ch4St.bossDown; },
      onInteract: function () {
        if (ch4St.stage >= 2 && ch4St.steps.wallBroken && !ch4St.steps.echoDone) { echoLesson(); return; }
        if (!ch4St.bossDown) return;
        if (practiceActive) { musicPanel.classList.remove("hidden"); replayNotes([1, 2, 0]); return; }
        practiceActive = true; practiceProgress = 0; played = []; musicPanel.classList.remove("hidden");
        MAY.toast("🎵 Bài luyện: ▲ MI → ◆ SON → ● ĐÔ. Dùng phép 💎 gõ lại nhé!");
        replayNotes([1, 2, 0]);
      }
    });

    ch4Npc = ctx.addQuestNPC({
      kind: "owl", name: ch4Sc.npcName, icon: ch4Sc.npcIcon,
      pos: [-5.5, 31], rotY: 0.4, scale: 1.45, labelY: 2.3, autoGreet: ch4St.stage === 0,
      onTalk: function () {
        if (ch4St.rewarded || ctx.save.gem) {
          MAY.openDialogue({ name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor, pages: ch4Sc.complete, endBtn: "❄️ Tới Chương 5: Xứ Tuyết", onDone: function () { MAY.enterLevel("level5"); } });
        } else if (ch4St.bossDown) {
          MAY.openDialogue({
            name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor,
            pages: ch4Sc.reward, endBtn: ch4Sc.rewardBtn, voiceClip: "gem_win",
            onDone: function () { ch4St.rewarded = true; MAY.persist(); updateCh4Story(); ctx.awardGem(); }
          });
        } else if (ch4St.stage === 0) {
          MAY.openDialogue({
            name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor,
            pages: ch4Sc.intro, endBtn: ch4Sc.introBtn, voiceClip: "npc_ch4",
            onDone: function () {
              ch4St.stage = 1; MAY.persist();
              if (!MAY.isSpellUnlocked("solar")) MAY.unlockSpell("solar", true);
              updateCh4Story();
            }
          });
        } else if (ch4St.steps.torch0 && ch4St.steps.torch1 && ch4St.stage < 2) {
          MAY.openDialogue({
            name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor,
            pages: ch4Sc.stage2GiveSkill, endBtn: ch4Sc.stage2Btn,
            onDone: function () {
              ch4St.stage = 2; MAY.persist();
              MAY.unlockSpell("crystal");
              updateCh4Story();
            }
          });
        } else {
          MAY.openDialogue({ name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor, pages: ch4Sc.inProgress, endBtn: "💎 Tiếp tục hành trình!" });
        }
      }
    });
    updateCh4Story();
    if (ch4St.stage >= 2 && ch4St.steps.wallBroken && !ch4St.steps.echoDone) {
      setTimeout(function () { if (MAY.currentCtx === ctx && !ch4St.steps.echoDone) echoLesson(); }, 1200);
    }

    /* ---- Nhiệm Vụ Phụ Tương Tác Chương 4: Mạng Lưới Đèn Pha Lê Thợ Mỏ ---- */
    ctx.setupSideQuest({
      npcPos: [8.5, 31], npcRotY: -0.45, npcScale: 1.25, labelY: 2.0,
      tasks: [
        { id: "relay_w", kind: "beacon", label: "Bật Trạm Pha Lê Hốc Tây",    pos: [-30, 14], color: 0xc084fc },
        { id: "relay_n", kind: "beacon", label: "Bật Trạm Pha Lê Bờ Bắc",     pos: [-16, -34], color: 0x38bdf8 },
        { id: "relay_e", kind: "beacon", label: "Bật Trạm Pha Lê Cột Đông",   pos: [32, -8],  color: 0x2dd4bf }
      ]
    });

    MAY.player.spawnAt(0, ctx.groundH(0, 36) + 1.05, 36, 0, false);
    return ctx;
  };

})(window.MAY);
