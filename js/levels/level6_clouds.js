"use strict";
/* ============================================================================
   MÀN 6 — VƯƠNG QUỐC TRÊN MÂY (Đảo bay cầu vồng — Viên Ngọc Hồng Cầu Vồng 🌈)
   7 Đảo Mây bồng bềnh nối bằng Cầu Vồng đi bộ được, Lâu Đài Cầu Vồng, Cối Xay Gió,
   Trọng lực nhẹ + Lướt Đôi Cánh Mây (giữ Space) & Bé Gió Lốc Tí Hon!
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  MAY.LEVELS.level6 = function () {
    var ctx = MAY.createWorldCtx("level6");
    ctx.mode = "land";
    ctx.worldRadius = 92;
    ctx.voidY = -4.0;
    ctx.minimapBg = "rgba(116,58,128,0.90)";

    MAY.setSunOffset(38, 28, -32);
    MAY.sun.color.setHex(0xffd9b0);
    MAY.sun.intensity = 1.55;
    MAY.hemiLight.color.setHex(0xffd6f0);
    MAY.hemiLight.groundColor.setHex(0x886ec4);
    MAY.hemiLight.intensity = 0.50;
    MAY.diveLight.intensity = 0.12;
    MAY.diveLight.castShadow = false;
    MAY.setAmbientTone(680, 0.03, "level6");
    MAY.setPostGrade({ tint: 0xfff8fd, vignette: 0.20, bloom: 0.30, ssao: 0.44, godRay: 0.38, godRayColor: 0xffe6f4 });
    ctx.getSurface = function () { return "cloud"; };

    MAY.scene.fog = new THREE.FogExp2(0xe6b5de, 0.0052);
    MAY.scene.background = new THREE.Color(0xe6b5de);

    ctx.addSky({
      zenith: 0x4b3b9e, horizon: 0xffc1d6, ground: 0xf7b2d9,
      sunDir: new THREE.Vector3(38, 28, -32), sunColor: 0xffe49e,
      cloudColor: 0xfff0fa, cloudAmt: 0.65, stars: true
    });

    /* 7 Đảo Mây ở các độ cao khác nhau + 1 tiểu đảo Vương Miện trên đỉnh */
    var ISLANDS = [
      { id: "start",  x: 0,   z: 42,  y: 8.0,  r: 14 },
      { id: "center", x: 0,   z: 0,   y: 12.0, r: 19 },
      { id: "west",   x: -40, z: 14,  y: 11.0, r: 13 },
      { id: "east",   x: 40,  z: 14,  y: 13.0, r: 13 },
      { id: "nw",     x: -36, z: -32, y: 15.0, r: 12 },
      { id: "ne",     x: 36,  z: -32, y: 16.0, r: 12 },
      { id: "castle", x: 0,   z: -48, y: 18.0, r: 16 },
      { id: "spire",  x: 0,   z: -68, y: 23.0, r: 7.5 }
    ];

    /* 7 Cầu Vồng nối các đảo (đi bộ & chạy qua cực mượt!) */
    var BRIDGES = [
      [ISLANDS[0], ISLANDS[1]],
      [ISLANDS[1], ISLANDS[2]],
      [ISLANDS[1], ISLANDS[3]],
      [ISLANDS[2], ISLANDS[4]],
      [ISLANDS[3], ISLANDS[5]],
      [ISLANDS[4], ISLANDS[6]],
      [ISLANDS[5], ISLANDS[6]],
      [ISLANDS[1], ISLANDS[6]]
    ];

    function bridgeHeightAt(x, z, a, b) {
      var abx = b.x - a.x, abz = b.z - a.z;
      var len2 = abx * abx + abz * abz;
      var t = ((x - a.x) * abx + (z - a.z) * abz) / len2;
      if (t < 0 || t > 1) return -999;
      var px = a.x + abx * t, pz = a.z + abz * t;
      var dist = Math.hypot(x - px, z - pz);
      if (dist > 3.6) return -999;
      var arch = Math.sin(t * Math.PI) * 2.4;
      return a.y + 0.82 + (b.y - a.y) * t + arch;
    }

    ctx.groundH = function (x, z) {
      var best = -999;
      for (var i = 0; i < ISLANDS.length; i++) {
        var isl = ISLANDS[i];
        var d = Math.hypot(x - isl.x, z - isl.z);
        if (d < isl.r) {
          var h = isl.y + 0.85;
          if (h > best) best = h;
        }
      }
      for (var j = 0; j < BRIDGES.length; j++) {
        var bh = bridgeHeightAt(x, z, BRIDGES[j][0], BRIDGES[j][1]);
        if (bh > best) best = bh;
      }
      return best;
    };

    ctx.getNearestSafePoint = function (x, z) {
      var best = ISLANDS[0], bd = 1e9;
      for (var i = 0; i < ISLANDS.length - 1; i++) {
        var d = Math.hypot(x - ISLANDS[i].x, z - ISLANDS[i].z);
        if (d < bd) { bd = d; best = ISLANDS[i]; }
      }
      return { x: best.x, y: best.y + 1.9, z: best.z };
    };

    /* Dựng 7 Đảo Mây xốp trắng hồng + thảm cỏ pastel trên mặt đảo */
    var cloudMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.snow.map, normalMap: MAY.PBR.snow.normalMap,
      color: 0xfff5fb, roughness: 0.85, emissive: 0x4b2e5e, emissiveIntensity: 0.12
    });
    var topMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.snow.map, normalMap: MAY.PBR.snow.normalMap,
      color: 0xffeffa, roughness: 0.72
    });
    if (MAY.bakeTerrainLightmap) {
      var l6DummyGeo = new THREE.PlaneGeometry(180, 180, 2, 2);
      MAY.bakeTerrainLightmap(l6DummyGeo, topMat, {
        size: 180,
        res: 96,
        groundH: function (x, z) { var h = ctx.groundH(x, z); return h > -100 ? h : 6.0; },
        skyColor: 0xffc8e4, bounceColor: 0xa684e8, sunColor: 0xffe49e,
        sunDir: new THREE.Vector3(38, 28, -32), intensity: 0.65,
        staticLights: [
          { x: 0, z: 0, r: 1.0, g: 0.85, b: 0.95, radius: 22, intensity: 0.45 },
          { x: 0, z: -48, r: 1.0, g: 0.76, b: 0.92, radius: 24, intensity: 0.55 }
        ]
      });
      l6DummyGeo.dispose();
    }

    ISLANDS.forEach(function (isl) {
      var g = new THREE.Group();
      var deckGeo = new THREE.CylinderGeometry(isl.r * 0.97, isl.r * 0.74, 2.2, 28);
      if (deckGeo.attributes.uv) deckGeo.setAttribute("uv2", deckGeo.attributes.uv.clone());
      var deck = new THREE.Mesh(deckGeo, topMat);
      deck.position.y = -0.25; deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
      /* Vòng bong bóng mây bồng bềnh ôm sát dưới mép đảo (không trồi lên che chân Mây!) */
      var puffs = Math.max(10, Math.round(isl.r * 1.05));
      for (var p = 0; p < puffs; p++) {
        var a = (p / puffs) * Math.PI * 2;
        var pr = isl.r * 0.90;
        var rad = 2.1 + (p % 3) * 0.65;
        var puff = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 10), cloudMat);
        puff.scale.set(1.15, 0.48, 1.15);
        puff.position.set(Math.cos(a) * pr, 0.50 - rad * 0.48, Math.sin(a) * pr);
        puff.castShadow = true; puff.receiveShadow = true;
        g.add(puff);
      }
      var under = new THREE.Mesh(new THREE.SphereGeometry(isl.r * 0.68, 14, 10), cloudMat);
      under.scale.set(1, 0.32, 1); under.position.y = -0.8 - isl.r * 0.68 * 0.32; g.add(under);
      g.position.set(isl.x, isl.y, isl.z);
      ctx.add(g);
    });

    /* Dựng 8 Cầu Vồng phát sáng nối các đảo + Lan can cầu vồng uốn cong TubeGeometry mượt mà */
    var rbStripeCols = [0xff595e, 0xffca3a, 0x8ac926, 0x38bdf8, 0xc084fc];
    var railGoldMat = new THREE.MeshPhysicalMaterial({ color: 0xffe49e, emissive: 0xffb703, emissiveIntensity: 0.45, metalness: 0.65, roughness: 0.2, clearcoat: 0.9 });
    BRIDGES.forEach(function (pair) {
      var a = pair[0], b = pair[1];
      var steps = 16;
      var angY = Math.atan2(b.x - a.x, b.z - a.z);
      var perpX = Math.cos(angY), perpZ = -Math.sin(angY);
      for (var s = 0; s < steps; s++) {
        var t0 = (s + 0.5) / steps;
        var x = a.x + (b.x - a.x) * t0, z = a.z + (b.z - a.z) * t0;
        var y = a.y + 0.82 + (b.y - a.y) * t0 + Math.sin(t0 * Math.PI) * 2.4;
        var segLen = Math.hypot(b.x - a.x, b.z - a.z) / steps + 0.35;
        var plank = new THREE.Mesh(
          new THREE.BoxGeometry(5.6, 0.32, segLen),
          new THREE.MeshPhysicalMaterial({
            color: rbStripeCols[s % rbStripeCols.length],
            emissive: rbStripeCols[s % rbStripeCols.length],
            emissiveIntensity: 0.48, roughness: 0.2, clearcoat: 0.8, transparent: true, opacity: 0.88
          })
        );
        plank.position.set(x, y - 0.16, z);
        plank.rotation.y = angY;
        plank.receiveShadow = true;
        ctx.add(plank);
      }
      /* Hai đường viền lan can vàng cong ôm theo vòm cầu vồng */
      [-2.85, 2.85].forEach(function (side) {
        var pts = [];
        for (var k = 0; k <= 12; k++) {
          var kt = k / 12;
          pts.push(new THREE.Vector3(
            a.x + (b.x - a.x) * kt + perpX * side,
            a.y + 1.02 + (b.y - a.y) * kt + Math.sin(kt * Math.PI) * 2.4,
            a.z + (b.z - a.z) * kt + perpZ * side
          ));
        }
        var rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.12, 6, false), railGoldMat);
        ctx.add(rail);
      });
    });

    /* Biển mây mềm mại bồng bềnh bên dưới */
    var seaCloud = new THREE.Mesh(
      new THREE.PlaneGeometry(340, 340, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfad2ea, transparent: true, opacity: 0.65 })
    );
    seaCloud.rotation.x = -Math.PI / 2; seaCloud.position.y = -11;
    ctx.add(seaCloud);

    /* Bệ bật mây dẫn lên Tiểu Đảo Vương Miện phía sau Lâu Đài */
    var padG = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.4, 0.5, 18),
      new THREE.MeshPhysicalMaterial({ color: 0xffd93d, emissive: 0xff9f43, emissiveIntensity: 0.8, clearcoat: 1.0 }));
    padG.position.set(0, 19.05, -59);
    ctx.add(padG);
    ctx.addBouncePad(0, 19.05, -59, 2.5, 13.5);

    /* Lâu Đài Cầu Vồng trên Đảo Bắc (0, -52) — Hero GLB từ Blender 5.3 + đèn chính đổ bóng thật */
    var castle = new THREE.Group();
    var castleFlags = [];
    var spireStar = null;
    var heroCastle = MAY.cloneLandmark("hero_castle", 1.0);
    if (heroCastle) {
      castle.add(heroCastle);
    } else {
      var cWallMat = new THREE.MeshStandardMaterial({ color: 0xfff0f8, roughness: 0.45, normalMap: MAY.PBR.stoneWall.normalMap });
      MAY.applyWorldWeathering(cWallMat, { macro: 0.10, stain: 0.14, wallGrime: 0.24, stainColor: 0x8e6ea8 });
      var cRoofMat = new THREE.MeshPhysicalMaterial({ color: 0xd980fa, emissive: 0x8b5cf6, emissiveIntensity: 0.35, roughness: 0.25, clearcoat: 0.8 });
      var cGoldMat = new THREE.MeshPhysicalMaterial({ color: 0xffd93d, metalness: 0.72, roughness: 0.2, emissive: 0xaa7700, emissiveIntensity: 0.35 });
      var keep = new THREE.Mesh(new THREE.BoxGeometry(9, 7.5, 8), cWallMat); keep.position.y = 3.75; keep.castShadow = true; keep.receiveShadow = true; castle.add(keep);
      for (var mx = -3.4; mx <= 3.5; mx += 1.7) {
        [-3.85, 3.85].forEach(function (mz) {
          var merlon = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.42), cWallMat);
          merlon.position.set(mx, 7.9, mz); merlon.castShadow = true; castle.add(merlon);
        });
      }
      [[-4.5, -4, 0xff595e], [4.5, -4, 0x38bdf8], [-4.5, 4, 0xffca3a], [4.5, 4, 0x4ade80]].forEach(function (tp, idx) {
        var tw = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.55, 11, 14), cWallMat); tw.position.set(tp[0], 5.5, tp[1]); tw.castShadow = true; castle.add(tw);
        var twTrim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.14, 8, 18), cGoldMat); twTrim.rotation.x = Math.PI / 2; twTrim.position.set(tp[0], 10.9, tp[1]); castle.add(twTrim);
        var sp = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4.2, 14), cRoofMat); sp.position.set(tp[0], 13.1, tp[1]); sp.castShadow = true; castle.add(sp);
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), cGoldMat); pole.position.set(tp[0], 16.0, tp[1]); castle.add(pole);
        var flag = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.5, 4), new THREE.MeshStandardMaterial({ color: tp[2], emissive: tp[2], emissiveIntensity: 0.35, roughness: 0.4 }));
        flag.rotation.z = -Math.PI / 2; flag.position.set(tp[0] + 0.75, 16.6, tp[1]); castle.add(flag);
        castleFlags.push({ mesh: flag, ph: idx * 1.3 });
      });
      var mainSpire = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6.2, 16), cGoldMat);
      mainSpire.position.y = 10.6; castle.add(mainSpire);
      spireStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), new THREE.MeshPhysicalMaterial({ color: 0xfff3b0, emissive: 0xffd93d, emissiveIntensity: 1.0, clearcoat: 1.0 }));
      spireStar.position.y = 14.3; castle.add(spireStar);
      var gateArch = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.24, 10, 22, Math.PI), cGoldMat);
      gateArch.position.set(0, 2.1, 4.08); castle.add(gateArch);
      var gateInner = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.2, 0.22), new THREE.MeshBasicMaterial({ color: 0xffe4f2 }));
      gateInner.position.set(0, 1.6, 4.02); castle.add(gateInner);
      [-1.75, 1.75].forEach(function (gx) {
        var colP = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 3.4, 10), cWallMat);
        colP.position.set(gx, 1.7, 4.18); castle.add(colP);
      });
      var roseWin = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ color: 0xffe6aa }));
      roseWin.position.set(0, 5.4, 4.06); castle.add(roseWin);
      var roseFrame = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.14, 8, 24), cGoldMat);
      roseFrame.position.set(0, 5.4, 4.12); castle.add(roseFrame);
    }
    var cLight = MAY.makeCagedLantern(0xffc2ee, 3.4, 36, true); cLight.position.set(0, 6.4, 5.2); castle.add(cLight);
    castle.position.set(0, 18.85, -52);
    ctx.add(castle);
    ctx.addBoxCollider(0, -52, 9.2, 8.2, 18.0, 27.5, 0, "castle_keep");
    [[-4.3, -55.8], [4.3, -55.8], [-4.3, -48.2], [4.3, -48.2]].forEach(function (tp) {
      ctx.addCollider(tp[0], tp[1], 1.45, "castle_tower", { minY: 18.0, maxY: 32.0 });
    });
    ctx.addGemAltar([0, 18.90, -40]);
    MAY.buildVistaRing(ctx, { count: 18, radius: 145, hMin: 16, hMax: 38, wBase: 36, baseY: -6, color: 0xf4c2e8 });

    /* Tia sáng Screen-Space Volumetric God Rays + Đá mây/pha lê vụn quanh Lâu Đài, Cối Xay Gió & Đài Hợp Nhất */
    if (MAY.setGodRays) MAY.setGodRays({ color: 0xffe6f4, strength: 0.38, density: 0.92, decay: 0.94 });
    MAY.scatterPropCluster(ctx, [
      { x: 0,  z: -48, y: 18.85, rMin: 5.5, rMax: 11.5, count: 22 },
      { x: 42, z: 14,  y: 13.85, rMin: 2.8, rMax: 6.2,  count: 14 },
      { x: 0,  z: 0,   y: 12.85, rMin: 3.2, rMax: 7.5,  count: 16 }
    ], { size: 0.24, color: 0xd8b4fe });
    if (MAY.add3DLoop) {
      MAY.add3DLoop([42, 20, 14], { kind: "wind", freq: 540, vol: 0.042, maxDist: 42 });
      MAY.add3DLoop([0, 14.5, 0], { kind: "crystal", freq: 440, vol: 0.022, maxDist: 36 });
      MAY.add3DLoop([0, 25.0, -47], { kind: "fire", freq: 820, vol: 0.028, maxDist: 32 });
    }

    /* Cối Xay Gió Gỗ trên Đảo Đông (42, 14) — Quaternius CC0 GLB (fallback thủ công) */
    var mill = new THREE.Group();
    var blades = null;
    var millGLB = MAY.cloneLandmark("cc0_windmill", 1.0);
    if (millGLB) {
      mill.add(millGLB);
    } else {
      var woodMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, roughness: 0.82 });
      MAY.attachPhotoPBR("wood", MAY.TEX.wood, [woodMat], { rx: 2, ry: 2, normalStrength: 2.8 });
      MAY.applyWorldWeathering(woodMat, { macro: 0.12, stain: 0.18, wallGrime: 0.26, stainColor: 0x4b3b4e });
      var mTower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 9, 12), woodMat); mTower.position.y = 4.5; mTower.castShadow = true; mill.add(mTower);
      blades = new THREE.Group(); blades.position.set(0, 7.6, 2.0);
      for (var bl = 0; bl < 4; bl++) {
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.2, 0.14), new THREE.MeshStandardMaterial({ color: 0xfff4d6, roughness: 0.6 }));
        arm.rotation.z = bl * Math.PI / 2;
        arm.position.set(Math.sin(bl * Math.PI / 2) * 2.5, Math.cos(bl * Math.PI / 2) * 2.5, 0);
        blades.add(arm);
      }
      mill.add(blades);
    }
    mill.position.set(42, 13.85, 14); mill.rotation.y = -1.2;
    ctx.add(mill);
    ctx.addCollider(42, 14, 2.35, "windmill", { minY: 13.0, maxY: 22.8 });

    /* Sứa Mây (tái sử dụng jelly.glb màu pastel) bay lơ lửng trên bầu trời + Bụi sao cầu vồng */
    var skyJellies = [];
    [[-18, 22, -16], [22, 24, -14], [-16, 19, 24], [24, 21, 28]].forEach(function (jp, idx) {
      var g = new THREE.Group();
      if (MAY.modelsReady && MAY.MODEL_T.jelly) {
        g.add(MAY.MODEL_T.jelly.group.clone(true));
      } else {
        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
          new THREE.MeshPhysicalMaterial({ color: rbStripeCols[idx % rbStripeCols.length], emissive: rbStripeCols[idx % rbStripeCols.length], emissiveIntensity: 0.6, transparent: true, opacity: 0.8 })));
      }
      g.position.set(jp[0], jp[1], jp[2]); ctx.add(g);
      skyJellies.push({ g: g, baseY: jp[1], ph: idx * 1.4 });
    });
    ctx.addAmbientParticles({ count: 320, spread: 130, minY: 4, maxY: 32, vy: 0.25, color: 0xffe4ff, size: 0.22, opacity: 0.85 });

    /* ---- 10 Lông Vũ Cầu Vồng (Nhiệm vụ chính) ---- */
    function makeFeather(idx) {
      var col = rbStripeCols[idx % rbStripeCols.length];
      var m = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.55, 8),
        new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.15, clearcoat: 0.9 }));
      m.scale.set(1.2, 1.0, 0.32); m.rotation.z = 0.25;
      return m;
    }
    ctx.addCollectibles([
      [0, 12.2, 36], [-8, 14.0, 6], [10, 14.0, -4], [-40, 13.0, 14], [38, 15.0, 14],
      [-36, 17.0, -32], [36, 18.0, -32], [-18, 17.2, -16], [18, 17.6, -16], [0, 20.2, -45]
    ], { color: 0xf472b6, icon: "🪶", makeMesh: makeFeather });

    /* ---- 5 Bạn Trên Mây (không trùng Sứ Giả Phượng Hoàng!) + Cún Milo Có Cánh ---- */
    ctx.addFriends([
      { name: "Kỳ Lân Mây Nhí",    kind: "unicorn",      pos: [-8, 12.8, 4],   greet: "🦄 Kỳ Lân Mây vẫy chiếc sừng vàng lấp lánh chào Mây!" },
      { name: "Cừu Bông Biết Bay", kind: "sheep",        pos: [-40, 12.0, 18], greet: "🐑 Cừu Bông mềm mịn nhảy tưng tưng chào Mây!" },
      { name: "Chim Cầu Vồng",     kind: "bird",         pos: [36, 19.5, -28], behavior: "fly", orbitR: 8, opts: { color: 0x38bdf8 }, greet: "🐦 Chim Cầu Vồng sải cánh xanh biếc chào Mây!" },
      { name: "Sao Băng Nhỏ",      kind: "shootingstar", pos: [-34, 18.5, -30],behavior: "fly", orbitR: 6, greet: "🌠 Sao Băng Nhỏ tặng Mây một điều ước lấp lánh!" },
      { name: "Bé Gió Lốc Tí Hon", kind: "windspirit",   pos: [0, 19.8, -44],  behavior: "still", greet: "🌬️ Gió Lốc Tí Hon xin lỗi Mây và hóa thành Làn Gió Mát dễ thương!" }
    ]);
    ctx.setCompanion("miloWinged", "🐶✨ Milo Có Cánh", { flying: true });

    /* ---- 3 Rương Bầu Trời, 5 Hũ Bụi Sao, 5 Quả Bóng Mây nổ mưa tim ---- */
    ctx.addChests([[-45, 11.4, 10], [45, 13.4, 18], [-38, 15.4, -36]], 0xf472b6);

    ctx.addSouvenirs([[6, 9.2, 42], [-10, 13.2, -6], [34, 14.2, 10], [-32, 16.2, -26], [32, 17.2, -28]].map(function (p, i) {
      var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.68, 10),
        new THREE.MeshPhysicalMaterial({ color: 0xffe066, emissive: 0xffb703, emissiveIntensity: 0.9, roughness: 0.1, clearcoat: 1.0 }));
      jar.position.y = 0.4;
      return { id: "sd" + i, pos: p, mesh: jar, color: 0xffe066, msg: "Nhặt được Hũ Bụi Sao lấp lánh" };
    }));

    ctx.addInteractProps([[6, 14.2, 6], [-36, 13.5, 10], [36, 15.5, 20], [-30, 17.5, -34], [30, 18.5, -34]].map(function (p, i) {
      var bal = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12),
        new THREE.MeshPhysicalMaterial({ color: rbStripeCols[i % rbStripeCols.length], emissive: rbStripeCols[i % rbStripeCols.length], emissiveIntensity: 0.45, roughness: 0.15, clearcoat: 1.0 }));
      bal.position.set(p[0], p[1], p[2]);
      return {
        id: "bl" + i, obj: bal, label: "Chạm quả bóng mây", burstColor: rbStripeCols[i % rbStripeCols.length],
        toastText: "Bùm! Mưa tim cầu vồng bay khắp bầu trời!",
        onActivate: function (obj) { obj.scale.setScalar(1.38); }
      };
    }));

    /* Bảo vật ẩn: Vương Miện Mây Vàng trên Tiểu Đảo cao nhất (0, 24.5, -68) */
    var crown = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.18, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 1.0, metalness: 0.9, roughness: 0.15 }));
    crown.rotation.x = Math.PI / 2;
    ctx.addHiddenTreasure([0, 24.8, -68], {
      name: "Vương Miện Mây Vàng",
      hint: "Có ánh vương miện vàng trên tiểu đảo mây cao nhất phía sau Lâu Đài! Nhảy lên bệ bật vàng xem!",
      mesh: crown, color: 0xffd700
    });

    /* 3 Thử thách Màn 6 */
    ctx.addRingsChallenge([[0, 16.5, 20], [-20, 16.0, 8], [-38, 17.5, -8], [-18, 20.5, -40], [18, 20.5, -40]], { title: "5 vòng lướt cánh trên mây", color: 0xff85d0, emissive: 0xd946ef });
    ctx.addRaceChallenge([8, 13.6, 2], [[34, 15.5, 14], [34, 18.5, -30], [0, 20.5, -44], [-34, 17.5, -30]], { title: "Đua bay cùng Phượng Hoàng", time: 58 });
    ctx.addQuizStation([0, 14.0, 10], { label: "Đài Đố Tổng Hợp" });

    ctx.addPortal([0, 8.85, 52.0], "hub", "🏝️ Về Đảo Mây", 0xf472b6);

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.fillStyle = "rgba(255,240,252,0.8)";
      ISLANDS.forEach(function (isl) {
        mm.beginPath(); mm.arc(C + isl.x * K, C + isl.z * K, isl.r * K, 0, 6.29); mm.fill();
      });
    };

    /* ---- CỐT TRUYỆN CHƯƠNG 6 (MÀN CUỐI): Phượng Hoàng (!) -> Đài Hợp Nhất -> Học 🌈 Lốc Cầu Vồng -> Hất Văng Quái Mây Lên Trời -> TRÙM CUỐI VUA MÂY BÃO! ---- */
    ctx.checkpoint = new THREE.Vector3(0, 14.0, 4);
    var ch6St = ctx.story;
    var ch6Sc = MAY.STORY_SCRIPTS.level6;
    ctx.setupAtmosphere(
      { fog: 0x5c4673, density: 0.0085, sunInt: 0.95, hemiInt: 0.34, zenith: 0x261a44, horizon: 0x8b6a9e },
      { fog: 0xe6b5de, density: 0.0050, sunInt: 1.62, hemiInt: 0.54, zenith: 0x4b3b9e, horizon: 0xffc1d6 },
      !!ch6St.bossDown
    );

    /* Hồi 1: Đài Hợp Nhất 5 Viên Ngọc tại Đảo Trung Tâm (0, 12.85, 0) */
    var shrinePos = new THREE.Vector3(0, 12.85, 0);
    var shrineGroup = new THREE.Group(); shrineGroup.position.copy(shrinePos);
    var sPed = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.5, 1.0, 16), new THREE.MeshStandardMaterial({ color: 0xfff5fb, roughness: 0.35 }));
    sPed.position.y = 0.5; shrineGroup.add(sPed);
    var sRune = MAY.VFX.makeRunePlane(3.8, 0xf472b6, 0.8); sRune.position.y = 0.14; shrineGroup.add(sRune);
    var sOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), new THREE.MeshPhysicalMaterial({ color: 0xf472b6, emissive: 0xffd93d, emissiveIntensity: 1.0, clearcoat: 1.0 }));
    sOrb.position.y = 2.6; shrineGroup.add(sOrb);
    ctx.add(shrineGroup);
    ctx.addCollider(0, 0, 2.35, "unity_shrine", { minY: 12.2, maxY: 13.85, walkable: true });

    /* Hồi 2: 3 Ổ Khóa Sét trên các Đảo + 5 Lính Mây Sấm (Dùng 🌈 Lốc Cầu Vồng HẤT VĂNG LÊN TRỜI!) */
    var lockCoords = [
      new THREE.Vector3(-40, 12.2, 14),
      new THREE.Vector3(40, 14.2, 14),
      new THREE.Vector3(0, 13.8, -14)
    ];
    var lockMeshes = lockCoords.map(function (lp, idx) {
      var lg = new THREE.Group(); lg.position.copy(lp);
      var core = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), new THREE.MeshPhysicalMaterial({ color: 0x2e1065, emissive: 0xfef08a, emissiveIntensity: 0.85, roughness: 0.2 }));
      var ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.18, 8, 22), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lg.add(core, ring);
      lg.visible = !ch6St.steps["lock" + idx];
      ctx.add(lg);
      return lg;
    });

    if (!ch6St.bossDown) {
      [[-36, 13.0, 18], [36, 15.0, 18], [-8, 14.0, -8], [10, 14.0, -8], [0, 20.0, -36]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l6_cloud_" + i, kind: "stormcloud", name: "Lính Mây Sấm Xám", pos: ep, flying: true, weakSpell: "tornado", speed: 3.8, patrolR: 8 });
      });
    }

    /* TRÙM CUỐI: ⛈️ VUA MÂY BÃO (Rigged Blender GLB — 3 Pha Tổng Hợp: Hất Quái Vỡ Khiên -> Tia Nắng -> Trói Hoa + Lốc Hất Tung Lên Trời!) */
    var stormBossMesh = MAY.makeRiggedBoss("stormking", 1.15, "stormcloud", 2.95);
    var bossShield = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 18, 14),
      new THREE.MeshPhysicalMaterial({ color: 0x4c1d95, emissive: 0x7e22ce, emissiveIntensity: 0.55, transparent: true, opacity: 0.42, wireframe: false })
    );
    bossShield.position.y = stormBossMesh.userData.mixer ? 2.8 : 1.6;
    stormBossMesh.add(bossShield);

    var ch6Npc;
    var ch6Boss = ctx.setBoss({
      name: "Vua Mây Bão (Bóng Xám)", icon: "⛈️",
      pos: new THREE.Vector3(0, 20.5, -42), arenaR: 28, maxHp: 3, mesh: stormBossMesh,
      startActive: ch6St.stage === 3 && !ch6St.bossDown,
      tipFn: function (b) {
        if (b.hp === 3) return "💡 PHA 1: Tung 🌈 Lốc Cầu Vồng (6+R) hất Lính Mây Sấm bay lên phá Khiên Mây Đen của Trùm!";
        if (b.hp === 2) return "💡 PHA 2: Né sét đỏ rồi tung ☀️ Tia Nắng (Phím 3 + R) xuyên mây đen đánh rớt Vua Mây Bão!";
        return b.subState.vined
          ? "💡 ĐÒN QUYẾT ĐỊNH! Tung 🌈 Lốc Cầu Vồng (Phím 6 + R) HẤT TUNG BÓNG XÁM LÊN TRỜI!"
          : "💡 PHA CUỐI: Dùng 🌿 Nở Hoa (2+R) trói chặt Trùm trước, rồi tung 🌈 Lốc Cầu Vồng hất bay lên trời!";
      },
      onTick: function (dt, t, bs) {
        var ang = Math.atan2(MAY.player.pos.x - bs.pos.x, MAY.player.pos.z - bs.pos.z);
        bs.mesh.rotation.y = ang + Math.PI;
        bs.mesh.position.y = (bs.hp === 2 ? 23.0 : 20.5) + Math.sin(t * 2.4) * 0.7;
        bossShield.visible = (bs.hp === 3);
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 38) {
          bs.atkT = 3.2;
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("attack", false);
          var strikePos = MAY.player.pos.clone();
          strikePos.y = Math.max(18.9, ctx.groundH(strikePos.x, strikePos.z));
          MAY.VFX.spawnTelegraph(strikePos, 4.2, 1.0, 0xfef08a);
          MAY.toast("⚡ Vua Mây Bão gọi sét đánh! Chạy né khỏi vòng vàng!");
          ctx.scheduleEvent(1.0, function () {
            if (!bs.active || bs.defeated) return;
            MAY.VFX.spawnLaserBeam(strikePos.clone().add(new THREE.Vector3(0, 18, 0)), strikePos.clone(), 0xfef08a, false);
            MAY.sndLaser(strikePos);
            if (MAY.player.pos.distanceTo(strikePos) < 4.2) {
              MAY.damagePlayer(1, strikePos, "Sét của Vua Mây Bão! Nhớ chạy né vòng cảnh báo!");
            }
          });
        }
      },
      onSpellHit: function (spellId, castPos, bs) {
        if (bs.hp === 3) {
          if (spellId === "tornado") {
            bossShield.visible = false;
            if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
            MAY.sndShatter(bs.pos);
            MAY.VFX.spawnShatterBurst(bs.pos.clone(), 0xc084fc);
            bs.damage("🌈 Lốc Cầu Vồng hất tung bão mây làm VỠ TAN Khiên Mây Đen của Vua Mây Bão!");
          } else {
            MAY.toast("💡 Khiên Mây Đen quá dày! Dùng 🌈 Lốc Cầu Vồng (Phím 6 + R) thổi bay khiên!");
          }
        } else if (bs.hp === 2) {
          if (spellId === "solar" || spellId === "crystal") {
            if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
            bs.damage("☀️ Tia Nắng xuyên thủng tâm bão đánh rớt Vua Mây Bão xuống sàn!");
          } else {
            MAY.toast("💡 Bão đen đang bao phủ! Dùng ☀️ Tia Nắng Rực Rỡ (Phím 3 + R) xuyên thủng tâm bão!");
          }
        } else {
          if (spellId === "growth") {
            bs.subState.vined = true;
            if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
            MAY.VFX.spawnVineTrap(bs.pos.clone(), 5.0);
            bs.syncHUD();
            MAY.toast("🌿 Dây hoa trói chặt Bóng Xám rồi!! Tung ngay 🌈 LỐC CẦU VỒNG (Phím 6 + R) HẤT BAY NÓ LÊN TRỜI!!");
          } else if (spellId === "tornado") {
            if (bs.subState.vined) {
              if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("defeat", false);
              bs.damage("🌈 VÚT!! LỐC CẦU VỒNG HẤT TUNG BÓNG XÁM BAY THẲNG LÊN TRỜI TAN THÀNH CẦU VỒNG 7 SẮC!!", true);
            } else {
              MAY.toast("💡 Bóng Xám đang né gió! Dùng 🌿 Nở Hoa (Phím 2 + R) trói chặt nó trước rồi tung 🌈 kết liễu!");
            }
          }
        }
      },
      onDefeat: function () {
        ch6St.stage = 4; MAY.persist();
        ch6Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI PHƯỢNG HOÀNG NHẬN 🌈 NGỌC CUỐI & MỞ ĐẠI TIỆC!", ch6Npc.pos);
        MAY.toast("🌈 CHIẾN THẮNG! Bóng Xám tan biến, Bé Gió Lốc được giải cứu rồi! Về gặp Phượng Hoàng (★)!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    var bossMinionsSpawned = false;
    function spawnPhase1Minions() {
      if (bossMinionsSpawned || ch6St.bossDown) return;
      bossMinionsSpawned = true;
      [[-8, 20.4, -38], [8, 20.4, -38]].forEach(function (mp, i) {
        ctx.addEnemy({
          id: "l6_bguard_" + i, kind: "stormcloud", name: "Hộ Vệ Mây Sấm", pos: mp,
          flying: true, weakSpell: "tornado", speed: 3.6, patrolR: 5.5,
          onPurified: function () {
            if (ch6Boss.active && !ch6Boss.defeated && ch6Boss.hp === 3) {
              bossShield.visible = false;
              MAY.sndShatter(ch6Boss.pos);
              MAY.VFX.spawnShatterBurst(ch6Boss.pos.clone(), 0xc084fc);
              ch6Boss.damage("🌈 Hộ Vệ Mây Sấm bị hất tung lên trời làm VỠ TAN Khiên Mây Đen của Vua Mây Bão!");
            }
          }
        });
      });
    }
    if (ch6St.stage === 3 && !ch6St.bossDown) spawnPhase1Minions();

    function updateCh6Story() {
      if (ch6St.rewarded || ctx.save.gem) {
        ch6Npc.setMarker("♥");
        ctx.setObjective("🎉", "VƯƠNG QUỐC MÂY ĐÃ HÒA BÌNH — VỀ ĐẢO MÂY DỰ LỄ HỘI!", null);
        return;
      }
      if (ch6St.bossDown) {
        ch6Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI PHƯỢNG HOÀNG NHẬN 🌈 NGỌC CUỐI & MỞ ĐẠI TIỆC!", ch6Npc.pos);
        return;
      }
      if (ch6St.stage === 0) {
        ch6Npc.setMarker("!");
        ctx.setObjective("💬", "TRÒ CHUYỆN VỚI SỨ GIẢ PHƯỢNG HOÀNG (!)", ch6Npc.pos);
        return;
      }
      if (ch6St.stage < 2) {
        ch6Npc.setMarker("?");
        ctx.setObjective("✨", "ĐI QUA CẦU VỒNG TỚI ĐÀI HỢP NHẤT 5 NGỌC (ĐẢO GIỮA)", shrinePos);
        return;
      }
      var lockDone = 0;
      for (var i = 0; i < 3; i++) if (ch6St.steps["lock" + i]) lockDone++;
      if (lockDone < 3) {
        ch6Npc.setMarker("?");
        var nextL = lockCoords[0];
        for (var j = 0; j < 3; j++) if (!ch6St.steps["lock" + j]) { nextL = lockCoords[j]; break; }
        ctx.setObjective("🌈", "DÙNG 🌈 LỐC CẦU VỒNG (6+R) HẤT QUÁI & PHÁ 3 Ổ KHÓA SÉT (" + lockDone + "/3)", nextL);
      } else {
        ch6St.stage = 3; MAY.persist();
        ch6Npc.setMarker("?");
        if (!ch6Boss.active) {
          ch6Boss.activate(function () {
            MAY.openDialogue({
              name: ch6Sc.npcName, role: ch6Sc.npcRole, icon: ch6Sc.npcIcon, color: ch6Sc.npcColor,
              pages: ch6Sc.bossIntro, endBtn: "⛈️ QUYẾT CHIẾN VUA MÂY BÃO!", voiceClip: "boss_appear"
            });
          });
          spawnPhase1Minions();
        }
        ctx.setObjective("⛈️", "ĐÁNH BẠI TRÙM CUỐI VUA MÂY BÃO TRƯỚC LÂU ĐÀI!", ch6Boss.pos);
      }
    }

    lockCoords.forEach(function (lp, idx) {
      ctx.addSkillTarget({
        id: "l6_lock_" + idx, pos: lp, radius: 9.5, reqSpell: "tornado",
        hint: "🌈 Phá Ổ Khóa Sét (" + (idx + 1) + "/3)", done: !!ch6St.steps["lock" + idx],
        isActive: function () { return ch6St.stage >= 2 && !ch6St.steps["lock" + idx]; },
        onHit: function (sp, tg) {
          ch6St.steps["lock" + idx] = true; MAY.persist();
          lockMeshes[idx].visible = false;
          tg.markDone();
          MAY.sndShatter(lp);
          MAY.VFX.spawnShatterBurst(lp, 0xfef08a);
          MAY.toast("🌈 Ổ Khóa Sét " + (idx + 1) + "/3 đã vỡ tan!");
          updateCh6Story();
        }
      });
    });

    ch6Npc = ctx.addQuestNPC({
      kind: "phoenix", name: ch6Sc.npcName, icon: ch6Sc.npcIcon,
      pos: [5, 10.6, 37], rotY: -0.4, scale: 1.35, labelY: 1.8, floating: true, autoGreet: ch6St.stage === 0,
      onTalk: function () {
        if (ch6St.rewarded || ctx.save.gem) {
          MAY.openDialogue({ name: ch6Sc.npcName, role: ch6Sc.npcRole, icon: ch6Sc.npcIcon, color: ch6Sc.npcColor, pages: ch6Sc.complete, endBtn: "🏝️ Về Đảo Mây dự Lễ Hội!", onDone: function () { MAY.enterLevel("hub"); } });
        } else if (ch6St.bossDown) {
          MAY.openDialogue({
            name: ch6Sc.npcName, role: ch6Sc.npcRole, icon: ch6Sc.npcIcon, color: ch6Sc.npcColor,
            pages: ch6Sc.reward, endBtn: ch6Sc.rewardBtn, voiceClip: "finale",
            onDone: function () { ch6St.rewarded = true; MAY.persist(); updateCh6Story(); ctx.awardGem(); }
          });
        } else if (ch6St.stage === 0) {
          MAY.openDialogue({
            name: ch6Sc.npcName, role: ch6Sc.npcRole, icon: ch6Sc.npcIcon, color: ch6Sc.npcColor,
            pages: ch6Sc.intro, endBtn: ch6Sc.introBtn, voiceClip: "npc_ch6",
            onDone: function () {
              ch6St.stage = 1; MAY.persist();
              ["wave", "growth", "solar", "crystal", "frost"].forEach(function (id) {
                if (!MAY.isSpellUnlocked(id)) MAY.unlockSpell(id, true);
              });
              updateCh6Story();
            }
          });
        } else {
          MAY.openDialogue({ name: ch6Sc.npcName, role: ch6Sc.npcRole, icon: ch6Sc.npcIcon, color: ch6Sc.npcColor, pages: ch6Sc.inProgress, endBtn: "🌈 Tiến lên Lâu Đài!" });
        }
      }
    });
    updateCh6Story();

    /* ---- Nhiệm Vụ Phụ Tương Tác Chương 6: Khúc Nhạc Chuông Gió Trên Mây ---- */
    ctx.setupSideQuest({
      npcPos: [-5.5, 8.85, 37], npcRotY: 0.4, npcScale: 1.15, labelY: 2.3,
      tasks: [
        { id: "chime_w",  kind: "chime", label: "Lên dây Chuông Gió Đảo Tây",      pos: [-42, 11.85, 8],   color: 0x38bdf8 },
        { id: "chime_e",  kind: "chime", label: "Lên dây Chuông Gió Cối Xay Gió",  pos: [35, 13.85, 14],   color: 0xffd93d },
        { id: "chime_ne", kind: "chime", label: "Lên dây Chuông Gió Đảo Đông Bắc", pos: [36, 16.85, -34],  color: 0xf472b6 }
      ]
    });

    ctx.onUpdate = function (dt, t) {
      if (blades) blades.rotation.z -= dt * 0.9;
      sRune.rotation.z += dt * 1.4;
      sOrb.rotation.y += dt * 2.0;
      if (spireStar) spireStar.rotation.y += dt * 1.8;
      castleFlags.forEach(function (cf) { cf.mesh.rotation.y = Math.sin(t * 4.5 + cf.ph) * 0.32; });
      lockMeshes.forEach(function (lm) { if (lm.visible) lm.rotation.y += dt * 2.2; });
      /* Khi Mây bước tới Đài Hợp Nhất ở Hồi 1 -> Tự động Thức Tỉnh Phép 6: 🌈 LỐC CẦU VỒNG! */
      if (ch6St.stage === 1 && !MAY.modalOpen && MAY.player.pos.distanceTo(shrinePos) < 5.5) {
        ch6St.stage = 2; MAY.persist();
        MAY.unlockSpell("tornado");
        MAY.openDialogue({
          name: ch6Sc.npcName, role: ch6Sc.npcRole, icon: ch6Sc.npcIcon, color: ch6Sc.npcColor,
          pages: ch6Sc.stage2GiveSkill, endBtn: ch6Sc.stage2Btn,
          onDone: function () { updateCh6Story(); }
        });
      }
      skyJellies.forEach(function (sj) {
        sj.g.position.y = sj.baseY + Math.sin(t * 1.1 + sj.ph) * 1.2;
        var js = 1 + Math.sin(t * 2.2 + sj.ph) * 0.08;
        sj.g.scale.set(js, 1 / js, js);
      });
    };

    MAY.player.spawnAt(0, 9.9, 42, 0, false);
    return ctx;
  };

})(window.MAY);
