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
    MAY.hemiLight.intensity = 0.72;
    /* Đèn pha trên mũ Mây bật đổ bóng thực trong hang động giống The Hall! */
    MAY.diveLight.intensity = 2.6;
    MAY.diveLight.color.setHex(0xf6eeff);
    MAY.diveLight.distance = 65;
    MAY.diveLight.castShadow = (MAY.quality !== "low");
    if (MAY.diveLight.shadow) { MAY.diveLight.shadow.mapSize.set(1024, 1024); MAY.diveLight.shadow.bias = -0.0008; }
    MAY.setAmbientTone(260, 0.042, "level4");
    MAY.setPostGrade({ tint: 0xf6f0ff, vignette: 0.34, bloom: 0.44, ssao: 0.65 });
    ctx.getSurface = function (x, z) {
      return Math.abs(x) < 2.6 && Math.abs(z + 8) < 22 ? "wood" : "wetstone";
    };

    ctx.landFog = { color: 0x161230, density: 0.0135 };
    ctx.underwaterFog = { color: 0x142c54, density: 0.030 };
    MAY.scene.fog = new THREE.FogExp2(ctx.landFog.color, ctx.landFog.density);
    MAY.scene.background = new THREE.Color(ctx.landFog.color);

    ctx.addSky({
      zenith: 0x0b081c, horizon: 0x261d4a, ground: 0x0c0a18,
      sunDir: new THREE.Vector3(14, 38, 12), sunColor: 0xc084fc, cloudAmt: 0.05, stars: true
    });

    /* Hồ nước ngầm phát sáng tại (0, -8) + bậc đá tự nhiên bao quanh */
    var LAKE = { x: 0, z: -8, r: 22 };
    ctx.groundH = function (x, z) {
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
    };

    /* Đá hang ẩm ướt có vệt bóng phản chiếu đèn pha lê (roughnessMap thật) */
    var caveMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.wetCaveRock.map,
      normalMap: MAY.PBR.wetCaveRock.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: MAY.PBR.wetCaveRock.roughnessMap,
      roughness: 0.78,
      metalness: 0.12
    });
    MAY.applyCaustics(caveMat, 0.1, 0.75);
    ctx.buildTerrain(200, 116, caveMat);

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

    /* Tia sáng giếng trời hang rọi xuống hồ & hành lang + Bụi pha lê bay lơ lửng */
    var skylightMat = MAY.makeGodRayMat(0xc4b5fd, 0.26);
    [[0, -8], [-22, 20], [24, -22]].forEach(function (rp) {
      var ray = new THREE.Mesh(new THREE.ConeGeometry(4.2, 36, 12, 1, true), skylightMat);
      ray.position.set(rp[0], 17, rp[1]); ray.rotation.z = 0.16; ctx.add(ray);
    });
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

    /* Cầu đá có đèn lồng dây tóc VÀNG ẤM đối lập hoàn hảo với ánh pha lê TÍM-CYAN LẠNH (công thức ánh sáng The Hall!) */
    var bridgeMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap,
      roughnessMap: MAY.PBR.stoneWall.roughnessMap, color: 0x625a82, roughness: 0.65
    });
    var archBridge = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 44), bridgeMat);
    archBridge.position.set(0, 1.3, -8); archBridge.castShadow = true; archBridge.receiveShadow = true;
    ctx.add(archBridge);
    [[-2.2, 10], [2.2, -4], [-2.2, -18], [2.2, 28]].forEach(function (lp) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x2b2630, metalness: 0.7, roughness: 0.4 }));
      var py = lp[1] > 18 ? ctx.groundH(lp[0], lp[1]) : 1.75;
      post.position.set(lp[0], py + 1.6, lp[1]); post.castShadow = true; ctx.add(post);
      var lan = MAY.makeCagedLantern(0xffb85c, 2.8, 26, false);
      lan.position.set(lp[0], py + 3.25, lp[1]); ctx.add(lan);
    });

    /* Đá vụn ẩm & mảnh tinh thể lấp lánh rải sàn hang */
    MAY.scatterDebris(ctx, 200, function (x, z) { return Math.hypot(x - LAKE.x, z - LAKE.z) > LAKE.r + 2; }, { spread: 68, size: 0.25, color: 0x484466 });

    /* Các cụm Pha Lê khổng lồ trong suốt phản chiếu + Đèn thực tế tỏa sáng lên mặt đá ướt */
    var crysCols = [0xc084fc, 0x38bdf8, 0xf472b6, 0x2dd4bf, 0xa78bfa];
    function makeCrystalCluster(color, sc, addLight) {
      var g = new THREE.Group();
      var mat = new THREE.MeshPhysicalMaterial({
        color: color, emissive: color, emissiveIntensity: 0.68,
        roughness: 0.08, metalness: 0.15, clearcoat: 1.0, transparent: true, opacity: 0.9
      });
      for (var k = 0; k < 5; k++) {
        var h = (1.8 + (k % 3) * 1.1) * sc;
        var sp = new THREE.Mesh(new THREE.ConeGeometry(0.45 * sc, h, 6), mat);
        var a = (k / 5) * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.45 * sc, h * 0.42, Math.sin(a) * 0.45 * sc);
        sp.rotation.z = Math.cos(a) * 0.28; sp.rotation.x = -Math.sin(a) * 0.28;
        sp.castShadow = true; g.add(sp);
      }
      if (addLight) {
        var pl = new THREE.PointLight(color, 2.2, 28);
        pl.position.y = 2.5 * sc; g.add(pl);
      }
      return g;
    }

    [[-26, 22, 1.4, true], [28, 20, 1.35, true], [-34, -18, 1.5, true], [36, -16, 1.45, true], [0, -38, 1.6, true], [-18, -44, 1.2, false], [22, -42, 1.3, false], [-48, 4, 1.4, false], [48, 2, 1.35, false]].forEach(function (cp, idx) {
      var cl = makeCrystalCluster(crysCols[idx % crysCols.length], cp[2], cp[3]);
      cl.position.set(cp[0], ctx.groundH(cp[0], cp[1]), cp[1]);
      ctx.add(cl);
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
      [42, -18], [-24, -36], [24, -36], [0, -2.0, -8], [10, -2.5, -12]
    ], { color: 0xc084fc, icon: "💎", yOff: 1.3, makeMesh: function () { return new THREE.Mesh(shardGeo, shardMat); } });

    /* ---- 5 Bạn Hang Động + Dơi Nhỏ Bibi bay soi đèn phía trước Mây ---- */
    ctx.addFriends([
      { name: "Cú Mèo Mắt Vàng",  kind: "owl",      pos: [-22, 24], greet: "🦉 Cú Mèo chớp đôi mắt vàng long lanh chào Mây!" },
      { name: "Kỳ Nhông Axolotl", kind: "axolotl",  pos: [-7, -2.2, -10], behavior: "swim", greet: "🩷 Kỳ nhông hồng vẫy mang bơi quanh Mây!" },
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
    ctx.addInteractProps([[-12, 14], [12, 14], [-22, -4], [22, -4], [0, -28]].map(function (p, i) {
      var cl = makeCrystalCluster(crysCols[i], 0.85, false);
      cl.position.set(p[0], ctx.groundH(p[0], p[1]), p[1]);
      return {
        id: "ch" + i, obj: cl, label: "Gõ pha lê nhạc " + chimeNames[i],
        sound: "chime", burstColor: crysCols[i],
        toastText: "Tiếng pha lê ngân vang nốt " + chimeNames[i] + "!",
        sayText: "Pha lê ngân vang quá!",
        onActivate: function (obj) { obj.scale.setScalar(1.22); }
      };
    }));

    /* Bảo vật ẩn: Viên Ngọc Trai Ánh Trăng dưới đáy hồ ngầm */
    var moonPearl = new THREE.Mesh(new THREE.SphereGeometry(0.68, 18, 14),
      new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, emissive: 0x93c5fd, emissiveIntensity: 0.95, roughness: 0.05, metalness: 0.2, clearcoat: 1.0 }));
    ctx.addHiddenTreasure([6, -4.1, -6], {
      name: "Ngọc Trai Ánh Trăng",
      hint: "Có ánh trăng dịu nhẹ lấp lánh dưới đáy hồ nước ngầm...",
      mesh: moonPearl, color: 0x93c5fd
    });

    /* 3 Thử thách Màn 4 */
    ctx.addRingsChallenge([[-18, 22], [-28, 6], [-24, -18], [0, -28], [24, -18]], { title: "5 vòng pha lê ánh sáng", color: 0xd8b4fe, emissive: 0x7e22ce });
    ctx.addRaceChallenge([14, 24], [[32, 14], [34, -16], [0, -30], [-30, -8]], { title: "Đua cùng Dơi Bibi", time: 55 });
    ctx.addQuizStation([0, 26], { label: "Cổng Đố Hình Học" });

    ctx.addPortal([0, 44], "hub", "🏝️ Về Đảo Mây", 0xc084fc);

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
      { fog: 0x0b0818, density: 0.0175, sunInt: 0.55, hemiInt: 0.36 },
      { fog: 0x1a1640, density: 0.012, sunInt: 1.15, hemiInt: 0.85 },
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
      var pl = new THREE.PointLight(0xffcb69, 0, 28); pl.position.y = 3.2; tg.add(pl);
      if (ch4St.steps["torch" + idx]) { orb.material.color.setHex(0xffe066); orb.material.emissive.setHex(0xff9f1c); orb.material.emissiveIntensity = 1.2; pl.intensity = 3.2; }
      ctx.add(tg);
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
    var echoMeshes = echoCoords.map(function (ec, idx) {
      var m = makeCrystalCluster(ec.col, 1.35, false);
      m.position.copy(ec.pos); ctx.add(m);
      return m;
    });
    var echoProgress = ch4St.steps.echoDone ? 3 : 0;

    /* 3 Golem Đá Nhỏ canh giữ khu vực pha lê */
    if (!ch4St.bossDown) {
      [[-18, 4], [18, 4], [14, -26]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l4_golem_" + i, kind: "stonegolem", name: "Golem Đá Bóng Đêm", pos: ep, weakSpell: "crystal", speed: 2.9, patrolR: 6 });
      });
    }

    /* TRÙM CHƯƠNG 4: 🗿 Golem Pha Lê Khổng Lồ (Echo Titan — Dùng 💎 phá Giáp Đá -> ☀️ thanh tẩy lõi!) */
    var titanMesh = MAY.makeMonsterMesh("stonegolem", 2.55);
    var ch4Npc;
    var ch4Boss = ctx.setBoss({
      name: "Golem Pha Lê Khổng Lồ", icon: "🗿",
      pos: new THREE.Vector3(0, 1.8, -8), arenaR: 25, maxHp: 3, mesh: titanMesh,
      startActive: ch4St.stage === 3 && !ch4St.bossDown,
      tipFn: function (b) {
        return b.subState.armorBroken
          ? "💡 Giáp đá vỡ tan lộ lõi tím rồi! Tung ngay ☀️ Tia Nắng (Phím 3 + R) thanh tẩy nó!"
          : "💡 Titan đang bọc Giáp Đá Đen! Dùng 💎 Cộng Hưởng (Phím 4 + R) đập vỡ giáp trước!";
      },
      onTick: function (dt, t, bs) {
        var ang = Math.atan2(MAY.player.pos.x - bs.pos.x, MAY.player.pos.z - bs.pos.z);
        bs.mesh.rotation.y = ang + Math.PI;
        bs.mesh.position.y = 1.8 + Math.sin(t * 2.0) * 0.35;
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 34) {
          bs.atkT = 3.5;
          var dir = new THREE.Vector3().subVectors(MAY.player.pos, bs.pos).normalize();
          ctx.spawnBossOrb(bs.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), dir, {
            speed: 10.5, radius: 0.95, reflectable: true, reflectSpell: "crystal", color: 0x3b355c, emissive: 0xc084fc,
            onReflectHitBoss: function (b) {
              b.subState.armorBroken = true;
              if (b.mesh.userData.armor) b.mesh.userData.armor.material.emissive.setHex(0xa855f7);
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
          MAY.sndShatter(bs.pos);
          MAY.VFX.spawnShatterBurst(bs.pos.clone().add(new THREE.Vector3(0, 2, 0)), 0xc084fc);
          bs.syncHUD();
          MAY.toast("💎 Sóng âm làm vỡ tan Giáp Đá Đen! Tung ngay ☀️ Tia Nắng (Phím 3 + R) vào lõi tím!");
        } else if (spellId === "solar") {
          if (bs.subState.armorBroken) {
            bs.subState.armorBroken = false;
            if (bs.mesh.userData.armor) bs.mesh.userData.armor.material.emissive.setHex(0x000000);
            bs.damage("☀️ Tia Nắng chiếu thẳng vào lõi thanh tẩy Golem Pha Lê!");
          } else {
            MAY.toast("💡 Giáp đá chặn mất tia nắng rồi! Dùng 💎 Cộng Hưởng (Phím 4 + R) phá giáp trước nhé!");
          }
        }
      },
      onDefeat: function () {
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
        ctx.setObjective("🎵", "GÕ ĐÀN PHA LÊ BẰNG 💎 ĐÚNG THỨ TỰ: ĐÔ→MI→SON (" + echoProgress + "/3)", echoCoords[Math.min(2, echoProgress)].pos);
        return;
      }
      ch4St.stage = 3; MAY.persist();
      ch4Npc.setMarker("?");
      if (!ch4Boss.active) {
        ch4Boss.activate();
        MAY.openDialogue({
          name: ch4Sc.npcName, role: ch4Sc.npcRole, icon: ch4Sc.npcIcon, color: ch4Sc.npcColor,
          pages: ch4Sc.bossIntro, endBtn: "🗿 Chiến đấu với Golem Pha Lê!", voiceClip: "boss_appear"
        });
      }
      ctx.setObjective("🗿", "PHÁ GIÁP (💎) + CHIẾU NẮNG (☀️) HẠ GOLEM PHA LÊ!", ch4Boss.pos);
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
        MAY.toast("💥 Bức tường pha lê vỡ tan! Giờ hãy gõ 3 Trụ Đàn Nhạc theo thứ tự 1→2→3!", "Ầm! Sóng cộng hưởng pha lê đã phá vỡ tan bức tường đá rồi!");
        updateCh4Story();
      }
    });

    echoCoords.forEach(function (ec, idx) {
      ctx.addSkillTarget({
        id: "l4_echo_" + idx, pos: ec.pos, radius: 9.0, reqSpell: "crystal",
        hint: "💎 " + ec.label, done: !!ch4St.steps.echoDone,
        isActive: function () { return ch4St.stage >= 2 && !!ch4St.steps.wallBroken && !ch4St.steps.echoDone && echoProgress === idx; },
        onHit: function () {
          MAY.sndChime(ec.noteIdx);
          MAY.burstAt(ec.pos.clone().add(new THREE.Vector3(0, 2, 0)), ec.col, 22);
          echoMeshes[idx].scale.setScalar(1.22);
          echoProgress++;
          if (echoProgress >= 3) {
            ch4St.steps.echoDone = true; MAY.persist();
            MAY.toast("🎵 Bản giao hưởng Đô–Mi–Son hoàn hảo! Golem Pha Lê thức giấc giữa hồ!");
          } else {
            MAY.toast("🎵 Chuẩn xác " + ec.label + "! Tiếp theo hãy tìm " + echoCoords[echoProgress].label + "!");
          }
          updateCh4Story();
        }
      });
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

    MAY.player.spawnAt(0, ctx.groundH(0, 36) + 1.05, 36, 0, false);
    return ctx;
  };

})(window.MAY);
