"use strict";
/* ============================================================================
   MÀN 2 — KHU RỪNG NẤM XANH (Khu rừng — Viên Ngọc Xanh Lá 🟢)
   Đồi cỏ rêu PBR, Suối trong có cá bơi, Cầu gỗ có đèn lồng, Cây Cổ Thụ,
   Tia nắng xuyên tán lá, Nấm lò xo nảy cao & 550 bụi cỏ đung đưa theo gió
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  MAY.LEVELS.level2 = function () {
    var ctx = MAY.createWorldCtx("level2");
    ctx.mode = "land";
    ctx.waterLevel = 0.25;
    ctx.worldRadius = 96;
    ctx.minimapBg = "rgba(22,74,42,0.92)";

    MAY.setSunOffset(32, 46, 22);
    MAY.sun.color.setHex(0xfff1c9);
    MAY.sun.intensity = 1.78;
    MAY.hemiLight.color.setHex(0xc8f5c4);
    MAY.hemiLight.groundColor.setHex(0x2d4f28);
    MAY.hemiLight.intensity = 0.46;
    MAY.diveLight.intensity = 0.12;
    MAY.diveLight.castShadow = false;
    MAY.setAmbientTone(520, 0.032, "level2");
    MAY.setPostGrade({ tint: 0xfafff4, vignette: 0.24, bloom: 0.34, ssao: 0.54, godRay: 0.36, godRayColor: 0xfff4be });
    ctx.getSurface = function (x, z) {
      if (Math.abs(x) < 2.6 && Math.abs(z - streamCenterZ(0)) < 8.5) return "wood";
      return "grass";
    };

    ctx.landFog = { color: 0x9ed6ad, density: 0.0078 };
    ctx.underwaterFog = { color: 0x0c5e56, density: 0.038 };
    MAY.scene.fog = new THREE.FogExp2(ctx.landFog.color, ctx.landFog.density);
    MAY.scene.background = new THREE.Color(ctx.landFog.color);

    ctx.addSky({
      zenith: 0x2c82c9, horizon: 0xc2ebd0, ground: 0x234c2b,
      sunDir: new THREE.Vector3(32, 46, 22), sunColor: 0xfff3be, cloudAmt: 0.44
    });

    /* Địa hình rừng: dòng suối uốn lượn quanh trục Z = sin(x*0.06)*12 - 10 + đồi thoai thoải + mỏm đá cao phía Bắc */
    function streamCenterZ(x) { return Math.sin(x * 0.065) * 11 - 12; }
    function forestTerrainH(x, z) {
      var hills = Math.sin(x * 0.055) * Math.cos(z * 0.052) * 2.4 +
                  Math.sin(x * 0.14 + 1.1) * Math.cos(z * 0.13) * 0.75;
      var base = 2.6 + hills;
      /* Lòng suối uốn lượn */
      var sd = Math.abs(z - streamCenterZ(x));
      if (sd < 9.5) {
        var st = 1 - sd / 9.5;
        base -= st * st * 4.2;
      }
      /* Mỏm đá cao giấu Lá Vàng Cổ Tích ở (-36, -42) */
      var ledgeD = Math.hypot(x + 36, z + 42);
      if (ledgeD < 13) {
        var lt = Math.max(0, 1 - ledgeD / 13);
        base += lt * lt * 7.8;
      }
      /* Vùng phẳng quanh Cây Cổ Thụ trung tâm (0, 22) */
      var cD = Math.hypot(x, z - 22);
      if (cD < 12) base = base * (cD / 12) + 3.2 * (1 - cD / 12);
      return base;
    }
    ctx.groundH = forestTerrainH;

    var forestMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.forestGround.map,
      normalMap: MAY.PBR.forestGround.normalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
      roughnessMap: MAY.PBR.forestGround.roughnessMap,
      roughness: 0.92
    });
    MAY.applyCaustics(forestMat, 0.25, 0.65);
    ctx.buildTerrain(230, 120, forestMat, {
      staticLights: [
        { x: 0, z: 25.5, r: 1.0, g: 0.84, b: 0.50, radius: 16, intensity: 0.48 },
        { x: 0, z: -12,  r: 1.0, g: 0.82, b: 0.45, radius: 14, intensity: 0.36 }
      ]
    });

    /* Dòng suối trong vắt có phản chiếu bầu trời & sóng quanh chân Mây (chảy xuyên dưới gầm cầu gỗ!) */
    ctx.addWater({
      width: 220, height: 220, segs: 64, y: 0.25,
      sunDir: new THREE.Vector3(32, 46, 22),
      deepColor: 0x094f4e, shallowColor: 0x249c88, skyColor: 0xc2ebd0,
      foamCenter: new THREE.Vector3(0, 0.25, 22), foamRadius: 22, waveAmp: 0.08
    });

    /* Sau khi dựng lòng suối & mặt nước, bật mặt cầu gỗ bắc qua suối tại x = 0 để Mây đi bộ vững chãi bên trên! */
    var brZ0 = streamCenterZ(0);
    ctx.groundH = function (x, z) {
      var base = forestTerrainH(x, z);
      if (Math.abs(x) < 2.35 && Math.abs(z - brZ0) < 8.4) {
        var bf = Math.min(1, Math.abs(z - brZ0) / 8.4);
        var by = 2.05 + Math.cos(bf * Math.PI * 0.5) * 0.85;
        if (by > base) base = by;
      }
      return base;
    };

    /* Tia nắng khối Screen-Space Volumetric God Rays + Đom đóm vàng bay lơ lửng */
    if (MAY.setGodRays) MAY.setGodRays({ color: 0xfff4be, strength: 0.36, density: 0.90, decay: 0.94 });
    ctx.addAmbientParticles({ count: 240, spread: 110, minY: 1.2, maxY: 14, vy: 0.25, color: 0xeaff7a, size: 0.22, opacity: 0.85 });

    /* Cầu gỗ có đèn lồng ấm bắc qua suối tại x = 0 */
    var woodMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, roughness: 0.86 });
    MAY.attachPhotoPBR("wood", MAY.TEX.wood, [woodMat], { rx: 2, ry: 2, normalStrength: 3.0 });
    MAY.applyWorldWeathering(woodMat, { waterY: 0.25, caustics: 0.0, macro: 0.14, stain: 0.26, wallGrime: 0.24, stainColor: 0x2c3b24 });
    var bridgeZ = streamCenterZ(0);
    var bridge = new THREE.Group();
    for (var bi = -6; bi <= 6; bi++) {
      var archY = 1.95 + Math.cos((bi / 6) * Math.PI * 0.5) * 0.85;
      var plank = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 1.15), woodMat);
      plank.position.set(0, archY, bi * 1.28);
      plank.castShadow = true; plank.receiveShadow = true;
      bridge.add(plank);
    }
    [-2.05, 2.05].forEach(function (bx) {
      [-6, 0, 6].forEach(function (bz) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.8, 8), woodMat);
        post.position.set(bx, 2.8, bz * 1.25); post.castShadow = true; bridge.add(post);
      });
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 16), woodMat);
      rail.position.set(bx, 3.65, 0); bridge.add(rail);
    });
    var brLan1 = MAY.makeCagedLantern(0xffd478, 2.2, 20, false); brLan1.position.set(2.05, 4.15, 6); bridge.add(brLan1);
    var brLan2 = MAY.makeCagedLantern(0xffd478, 2.2, 20, false); brLan2.position.set(-2.05, 4.15, -6); bridge.add(brLan2);
    bridge.position.set(0, 0, bridgeZ);
    ctx.add(bridge);
    /* Va chạm 3D OBB cho 2 thành lan can cầu gỗ */
    ctx.addBoxCollider(-2.15, bridgeZ, 0.35, 16.0, 1.8, 4.1, 0, "bridge_rail_l");
    ctx.addBoxCollider(2.15,  bridgeZ, 0.35, 16.0, 1.8, 4.1, 0, "bridge_rail_r");

    /* Cây Cổ Thụ Mẹ Giữa Rừng (0, 22) — Ban đầu chết khô xám xịt, hồi sinh rực rỡ khi hạ Vua Nấm Khô Héo! */
    var ancient = new THREE.Group();
    var ay = ctx.groundH(0, 22);
    var barkMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.bark.map, normalMap: MAY.PBR.bark.normalMap, normalScale: new THREE.Vector2(1.4, 1.4),
      roughnessMap: MAY.PBR.bark.roughnessMap, roughness: 0.95,
      color: ctx.story.bossDown ? 0xffffff : 0x6b6460
    });
    MAY.applyWorldWeathering(barkMat, { macro: 0.14, stain: 0.20, wallGrime: 0.34, stainColor: 0x2a3b20 });
    var trPts = [new THREE.Vector2(3.8, 0), new THREE.Vector2(3.1, 2.2), new THREE.Vector2(2.4, 6.2), new THREE.Vector2(2.05, 10.2), new THREE.Vector2(2.25, 11.8), new THREE.Vector2(1.45, 13.2), new THREE.Vector2(0.55, 14.0), new THREE.Vector2(0.02, 14.3)];
    var aTrunk = new THREE.Mesh(new THREE.LatheGeometry(trPts, 18), barkMat);
    aTrunk.castShadow = true; aTrunk.receiveShadow = true; ancient.add(aTrunk);
    /* Cổng vòm hốc cây cổ tích + đèn lồng treo đổ bóng thật + 5 cành đại thụ uốn cong + cành ngọn vươn cao */
    var hollow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffe49e }));
    hollow.position.set(0, 0.9, 3.32); ancient.add(hollow);
    var archFrame = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.22, 8, 18, Math.PI), barkMat);
    archFrame.position.set(0, 0.9, 3.30); ancient.add(archFrame);
    var mLan = MAY.makeCagedLantern(0xffd480, 2.6, 24, true); mLan.position.set(0, 2.65, 3.55); ancient.add(mLan);
    if (MAY.add3DLoop) {
      MAY.add3DLoop([0, ay + 2.65, 25.55], { kind: "fire", vol: 0.032, maxDist: 28 });
      MAY.add3DLoop([0, 0.9, bridgeZ], { kind: "water", freq: 680, vol: 0.055, maxDist: 44 });
    }
    for (var bh = 0; bh < 5; bh++) {
      var ba = (bh / 5) * Math.PI * 2 + 0.4;
      var bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(ba) * 1.7, 10.0, Math.sin(ba) * 1.7),
        new THREE.Vector3(Math.cos(ba) * 4.8, 12.4, Math.sin(ba) * 4.8),
        new THREE.Vector3(Math.cos(ba) * 7.4, 13.8, Math.sin(ba) * 7.4)
      ]);
      var bough = new THREE.Mesh(new THREE.TubeGeometry(bCurve, 12, 0.44, 7, false), barkMat);
      bough.castShadow = true; ancient.add(bough);
      var twigCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(ba) * 4.4, 12.2, Math.sin(ba) * 4.4),
        new THREE.Vector3(Math.cos(ba + 0.35) * 5.8, 14.3, Math.sin(ba + 0.35) * 5.8),
        new THREE.Vector3(Math.cos(ba + 0.5) * 6.5, 15.6, Math.sin(ba + 0.5) * 6.5)
      ]);
      var twig = new THREE.Mesh(new THREE.TubeGeometry(twigCurve, 8, 0.20, 6, false), barkMat);
      twig.castShadow = true; ancient.add(twig);
    }
    ctx.addCollider(0, 22, 3.6, "ancient_mother");
    /* Rễ cổ thụ uốn lượn */
    for (var rk = 0; rk < 6; rk++) {
      var ra = (rk / 6) * Math.PI * 2;
      var root = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 3.4, 6, 10), barkMat);
      root.position.set(Math.cos(ra) * 3.4, 0.7, Math.sin(ra) * 3.4);
      root.rotation.z = -Math.cos(ra) * 1.1; root.rotation.x = Math.sin(ra) * 1.1;
      root.castShadow = true; ancient.add(root);
    }
    var motherCanopy = new THREE.Group();
    var aLeafMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.leafClusterTex, color: 0x6ae072, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.72 });
    for (var lc = 0; lc < 22; lc++) {
      var la = (lc / 22) * Math.PI * 2, lr = 2.5 + (lc % 3) * 2.8;
      var card = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 6.8), aLeafMat);
      card.position.set(Math.cos(la) * lr, 13.2 + (lc % 3) * 1.8, Math.sin(la) * lr);
      card.rotation.y = la + 0.6; card.rotation.x = 0.25; card.castShadow = true; motherCanopy.add(card);
    }
    motherCanopy.scale.setScalar(ctx.story.bossDown ? 1.0 : 0.01);
    motherCanopy.visible = !!ctx.story.bossDown;
    ancient.add(motherCanopy);
    var treeLight = MAY.makePooledLight ? MAY.makePooledLight(0x80ffaa, ctx.story.bossDown ? 2.4 : 0.2, 28) : new THREE.PointLight(0x80ffaa, ctx.story.bossDown ? 2.4 : 0.2, 28); treeLight.position.set(0, 7.5, -4); ancient.add(treeLight);
    ancient.position.set(0, ay, 22);
    ctx.add(ancient);
    ctx.addGemAltar([0, 14.5]);

    /* 44 Cây rừng tán lá chân thực + 550 bụi cỏ gió thổi + Đá rêu */
    var leafTints = [0x8ee27a, 0x68c962, 0xa8de6c, 0x52b568];
    for (var ti = 0; ti < 44; ti++) {
      var ta = (ti * 2.39996) % 6.28, tr = 18 + (ti * 1.85) % 68;
      var tx = Math.cos(ta) * tr, tz = Math.sin(ta) * tr;
      if (Math.abs(tz - streamCenterZ(tx)) < 10.5 || Math.hypot(tx, tz - 22) < 13 || Math.hypot(tx, tz - 48) < 9) continue;
      var tree = MAY.makeRealisticTree(0.95 + (ti % 4) * 0.28, leafTints[ti % leafTints.length]);
      tree.position.set(tx, ctx.groundH(tx, tz) - 0.15, tz);
      tree.rotation.y = ti * 1.1;
      ctx.add(tree);
      ctx.addCollider(tx, tz, 0.55, "tree");
    }

    /* Đồng cỏ 1.800 ngọn uốn sóng gió + hoa dại rực rỡ (chuẩn Fable 5.2!) + đá cuội & dãy núi rừng xa */
    MAY.scatterLushMeadow(ctx, 1800, function (x, z) {
      return ctx.groundH(x, z) > 1.0 && Math.hypot(x, z - 22) > 5.2;
    }, { spread: 80, color: 0x8be068, w: 0.96, h: 0.88, flowers: true });
    MAY.scatterDebris(ctx, 180, function (x, z) { return ctx.groundH(x, z) > 0.3; }, { spread: 78, size: 0.24, color: 0x6f7d69 });
    MAY.scatterPropCluster(ctx, [
      { x: 0, z: 22, rMin: 4.5, rMax: 8.5, count: 26 },
      { x: 0, z: bridgeZ + 8.5, rMin: 2.6, rMax: 5.2, count: 14 },
      { x: 0, z: bridgeZ - 8.5, rMin: 2.6, rMax: 5.2, count: 14 }
    ], { size: 0.25, color: 0x5c6b54 });
    MAY.buildVistaRing(ctx, { count: 22, radius: 138, hMin: 22, hMax: 48, wBase: 30, baseY: -2, color: 0x38664b });

    var rockMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.rock, color: 0x8ea88b, roughness: 0.9 });
    MAY.attachPhotoPBR("rock", MAY.TEX.rock, [rockMat], { rx: 2, ry: 2, normalStrength: 3.6 });
    for (var r2 = 0; r2 < 20; r2++) {
      var rx = (Math.sin(r2 * 4.1) * 68), rz = (Math.cos(r2 * 3.3) * 68);
      if (Math.hypot(rx, rz - 22) < 12) continue;
      var rm = new THREE.Mesh(MAY.rockGeo(r2 * 1.9), rockMat);
      var rs = 1.0 + (r2 % 3) * 0.7;
      rm.scale.set(rs * 1.2, rs * 0.75, rs);
      var ry = ctx.groundH(rx, rz);
      rm.position.set(rx, ry + rs * 0.25, rz);
      rm.castShadow = true; rm.receiveShadow = true; ctx.add(rm);
      ctx.addSphereCollider(rx, ry + rs * 0.25, rz, rs * 0.86, "rock", { maxY: ry + rs * 0.85 });
    }

    /* 6 Nấm Lò Xo Khổng Lồ (nhảy lên là nảy bật cao vút!) */
    var bounceMushrooms = [
      [-28, -32, 13.5], [-14, -18, 12.2], [14, -8, 12.2],
      [28, 18, 12.6], [-24, 24, 12.2], [8, -28, 12.8]
    ];
    bounceMushrooms.forEach(function (bm) {
      var g = new THREE.Group();
      var y = ctx.groundH(bm[0], bm[1]);
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.72, 1.5, 12), new THREE.MeshStandardMaterial({ color: 0xf7ecd5, roughness: 0.85 }));
      stem.position.y = 0.75; g.add(stem);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(1.95, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
        new THREE.MeshPhysicalMaterial({ color: 0xff5c8a, emissive: 0x6b1434, emissiveIntensity: 0.35, roughness: 0.3, clearcoat: 0.6 }));
      cap.position.y = 1.35; g.add(cap);
      for (var d = 0; d < 6; d++) {
        var da = (d / 6) * Math.PI * 2;
        var spot = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff8dc }));
        spot.position.set(Math.cos(da) * 1.2, 2.2, Math.sin(da) * 1.2); g.add(spot);
      }
      g.position.set(bm[0], y, bm[1]);
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      ctx.add(g);
      ctx.addCollider(bm[0], bm[1], 0.68, "mushroom_stem", { minY: y - 0.5, maxY: y + 1.35 });
      ctx.addBouncePad(bm[0], y + 2.3, bm[1], 2.2, bm[2]);
    });

    /* Cá bơi nhỏ dưới suối rừng */
    var streamFish = [];
    for (var sf = 0; sf < 8; sf++) {
      var fg = MAY.fishBody(sf % 2 === 0 ? 0xff9f43 : 0x4dd0ff, 0.95, sf % 3);
      var fx = -35 + sf * 10;
      fg.position.set(fx, -0.5, streamCenterZ(fx));
      ctx.add(fg);
      streamFish.push({ g: fg, x0: fx, ph: sf * 1.1 });
    }

    /* ---- 10 Nấm Phát Sáng (Nhiệm vụ chính) ---- */
    function makeGlowMushroom() {
      var g = new THREE.Group();
      var st = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.7, 10), new THREE.MeshStandardMaterial({ color: 0xfff3d1, roughness: 0.7 }));
      st.position.y = 0.35; g.add(st);
      var cp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
        new THREE.MeshPhysicalMaterial({ color: 0x52ff9a, emissive: 0x1ee67a, emissiveIntensity: 0.95, roughness: 0.25, clearcoat: 0.7 }));
      cp.position.y = 0.65; g.add(cp);
      return g;
    }
    ctx.addCollectibles([
      [-12, 34], [14, 32], [-30, 12], [32, 10], [-42, -6],
      [44, -14], [-18, -32], [22, -38], [4, -52], [-48, 36]
    ], { color: 0x52ff9a, icon: "🍄", yOff: 0.35, makeMesh: makeGlowMushroom });

    /* ---- 5 Bạn Rừng + Cún Milo ---- */
    ctx.addFriends([
      { name: "Thỏ Rừng Bông",  kind: "forestrabbit",    pos: [14, 24],  greet: "🐇 Thỏ Rừng Bông vẫy đôi tai dài chào Mây!" },
      { name: "Hươu Sao",       kind: "deer",      pos: [-24, 8],  greet: "🦌 Hươu Sao cúi đầu chào bé Mây xinh!" },
      { name: "Cáo Cam Nhỏ",    kind: "fox",       pos: [34, -22], greet: "🦊 Cáo Cam vẫy chiếc đuôi xù chào Mây!" },
      { name: "Bướm Xanh Lớn",  kind: "butterfly", pos: [-8, 6.2, -16], behavior: "fly", orbitR: 6, opts: { color: 0x4dd0ff, scale: 1.35 }, greet: "🦋 Bướm Xanh đập cánh lấp lánh quanh Mây!" },
      { name: "Gấu Trúc Nhí",   kind: "panda",     pos: [-38, 28], greet: "🐼 Gấu Trúc Nhí ôm tre vẫy tay chào Mây!" }
    ]);
    ctx.setCompanion("milo", "🐶 Milo");

    /* ---- 3 Rương, 5 Hạt Dẻ, 5 Hoa Ngủ Quên nở khi chạm, Lá Vàng Cổ Tích ẩn ---- */
    ctx.addChests([[-34, -2], [38, 26], [10, -48]], 0x5d8a4b);

    var acornMat = new THREE.MeshStandardMaterial({ color: 0x8a5223, roughness: 0.65 });
    var acornCapMat = new THREE.MeshStandardMaterial({ color: 0x523015, roughness: 0.9 });
    ctx.addSouvenirs([[-16, 22], [22, 16], [-26, -18], [28, -32], [-6, 42]].map(function (p, i) {
      var g = new THREE.Group();
      var nut = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), acornMat); nut.scale.set(1, 1.25, 1); nut.position.y = 0.38; g.add(nut);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.45), acornCapMat); cap.position.y = 0.56; g.add(cap);
      return { id: "ac" + i, pos: p, mesh: g, color: 0xffd166, msg: "Nhặt được hạt dẻ cho Sóc Nâu" };
    }));

    var flowerCols = [0xff6b9d, 0xffd93d, 0xc77dff, 0xff8c42, 0x4dd0ff];
    ctx.addInteractProps([[-8, 28], [16, 24], [-22, 16], [24, 2], [-10, -24]].map(function (p, i) {
      var g = new THREE.Group();
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0x2fa35a }));
      stem.position.y = 0.55; g.add(stem);
      var bud = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10),
        new THREE.MeshStandardMaterial({ color: flowerCols[i], emissive: flowerCols[i], emissiveIntensity: 0.2, roughness: 0.45 }));
      bud.position.y = 1.25; g.add(bud);
      g.userData.bud = bud;
      g.position.set(p[0], ctx.groundH(p[0], p[1]), p[1]);
      return {
        id: "fl" + i, obj: g, label: "Đánh thức bông hoa", burstColor: flowerCols[i],
        toastText: "Bông hoa nở bung tỏa phấn sáng!",
        onActivate: function (obj) {
          obj.userData.bud.scale.set(1.85, 0.72, 1.85);
          obj.userData.bud.material.emissiveIntensity = 0.85;
        }
      };
    }));

    /* Bảo vật ẩn trên mỏm đá cao sau suối (dùng nấm lò xo tại [-28, -32] để nhảy lên!) */
    var leafGeo = new THREE.OctahedronGeometry(0.75, 0);
    leafGeo.scale(1.2, 1.6, 0.32);
    ctx.addHiddenTreasure([-36, ctx.groundH(-36, -42) + 1.4, -42], {
      name: "Lá Vàng Cổ Tích",
      hint: "Có chiếc lá vàng lấp lánh trên đỉnh mỏm đá sau suối! Nhảy lên nấm lò xo thử xem!",
      mesh: new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0xffa500, emissiveIntensity: 1.1, metalness: 0.65, roughness: 0.2 }))
    });

    /* 3 Thử thách Màn 2 */
    ctx.addRingsChallenge([[-14, ctx.groundH(-14, -18) + 5.5, -18], [0, 5.2, bridgeZ], [14, ctx.groundH(14, -8) + 5.5, -8], [28, ctx.groundH(28, 18) + 5.5, 18], [16, ctx.groundH(16, 26) + 2.4, 26]], { title: "5 vòng nấm lò xo" });
    ctx.addRaceChallenge([8, 36], [[26, 24], [38, -2], [18, -26], [-12, -26]], { title: "Chạy đua cùng Sóc Nâu", time: 55 });
    ctx.addQuizStation([-10, 38], { label: "Cây Đố Vui" });

    /* Cổng quay về Đảo Mây (đặt lui sau điểm xuất phát tránh lùi nhầm) */
    ctx.addPortal([0, 56], "hub", "🏝️ Về Đảo Mây", 0x4ade80);

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.strokeStyle = "#38bdf8"; mm.lineWidth = 6;
      mm.beginPath();
      for (var x = -95; x <= 95; x += 10) {
        var z = streamCenterZ(x);
        if (x === -95) mm.moveTo(C + x * K, C + z * K); else mm.lineTo(C + x * K, C + z * K);
      }
      mm.stroke();
    };

    /* ---- CỐT TRUYỆN CHƯƠNG 2: Bà Sóc Hạt Dẻ (!) -> Rửa Bùn (🌊) -> Học Nở Hoa (🌿) -> Hồi Sinh 3 Cây Chết -> Đánh Vua Nấm! ---- */
    ctx.checkpoint = new THREE.Vector3(0, ctx.groundH(0, 44) + 1.1, 44);
    var ch2St = ctx.story;
    var ch2Sc = MAY.STORY_SCRIPTS.level2;
    ctx.setupAtmosphere(
      { fog: 0x6f7f78, density: 0.0115, sunInt: 1.05, hemiInt: 0.32, zenith: 0x4b5c66, horizon: 0x9aa8a0 },
      { fog: 0x9ed6ad, density: 0.0075, sunInt: 1.82, hemiInt: 0.50, zenith: 0x2c82c9, horizon: 0xc2ebd0 },
      !!ch2St.bossDown
    );

    /* Ụ Bùn Đen chặn đầu suối (cần Phép 🌊 Sóng Xung Kích rửa trôi!) */
    var mudPos = new THREE.Vector3(-4, ctx.groundH(-4, bridgeZ + 5), bridgeZ + 5);
    var mudDam = new THREE.Group();
    mudDam.position.copy(mudPos);
    var mudMat = new THREE.MeshStandardMaterial({ color: 0x2b2220, roughness: 0.95, flatShading: true });
    for (var mb = 0; mb < 5; mb++) {
      var blob = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5 + (mb % 2) * 0.6, 0), mudMat);
      blob.position.set((mb - 2) * 1.1, 0.9, Math.sin(mb) * 0.7);
      mudDam.add(blob);
    }
    mudDam.visible = !ch2St.steps.mudClear;
    ctx.add(mudDam);
    if (!ch2St.steps.mudClear) ctx.addBoxCollider(mudPos.x, mudPos.z, 6.4, 3.0, mudPos.y - 0.5, mudPos.y + 3.0, 0, "muddam");

    /* 3 Cây Cổ Thụ Chết Khô quanh rừng (hồi sinh bằng 🌿 Nở Hoa -> mọc lá xanh + hoa + nấm lò xo!) */
    var deadTreeCoords = [[-22, 22], [22, 16], [-16, -24]];
    var deadTrees = deadTreeCoords.map(function (c, i) {
      var dtObj = MAY.buildDeadTree(ctx, c[0], c[1], { scale: 1.05, blossomColor: 0x4ade80, flowerColor: i === 1 ? 0xffd93d : 0xff7fa5 });
      if (ch2St.steps["tree" + i]) dtObj.revive(true);
      return dtObj;
    });

    /* 4 Quái Nấm Gai Xám tuần tra quanh các cây chết */
    if (!ch2St.bossDown) {
      [[-18, 16], [18, 10], [-10, -20], [14, -14]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l2_shroom_" + i, kind: "thornshroom", name: "Quái Nấm Gai Xám", pos: ep, weakSpell: "growth", speed: 3.3, patrolR: 6 });
      });
    }

    /* TRÙM CHƯƠNG 2: 🍄 Vua Nấm Khô Héo (Rigged Blender GLB + Phối hợp 2 phép: 🌊 làm ướt vỏ khô -> 🌿 Nở Hoa quấn bung hoa!) */
    var bossShroomMesh = MAY.makeRiggedBoss("mushroomking", 1.15, "thornshroom", 2.35, { tagMat: { cap: "ShroomCap" } });
    var ch2Npc;
    var ch2Boss = ctx.setBoss({
      name: "Vua Nấm Khô Héo", icon: "🍄",
      pos: new THREE.Vector3(0, ctx.groundH(0, 5), 5), arenaR: 22, maxHp: 3, mesh: bossShroomMesh,
      startActive: ch2St.stage === 3 && !ch2St.bossDown,
      tipFn: function (b) {
        return b.subState.wet
          ? "💡 Vỏ đã mềm ướt rồi! Tung ngay 🌿 Nở Hoa (Phím 2 + R) để trói hoa nở trên mũ nấm!"
          : "💡 Vỏ Vua Nấm rất khô cứng! Dùng 🌊 Sóng (Phím 1 + R) tưới ướt trước, rồi tung 🌿 Nở Hoa!";
      },
      onTick: function (dt, t, bs) {
        var ang = Math.atan2(MAY.player.pos.x - bs.pos.x, MAY.player.pos.z - bs.pos.z);
        bs.mesh.rotation.y = ang + Math.PI;
        bs.mesh.position.y = ctx.groundH(bs.pos.x, bs.pos.z) + (bs.mesh.userData.mixer ? 0 : Math.abs(Math.sin(t * 2.5)) * 0.65);
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 28) {
          bs.atkT = 3.6;
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("attack", false);
          bs.telegraphAttack(1.0);
          MAY.VFX.spawnTelegraph(bs.pos.clone(), 8.5, 1.0, 0xff3b5c);
          MAY.toast("🍄 Vua Nấm chuẩn bị dậm sóng đất! Nhấn Space nhảy lên né nhé!");
          ctx.scheduleEvent(1.0, function () {
            if (!bs.active || bs.defeated || bs.state === "stunned") return;
            MAY.burstAt(bs.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x9333ea, 18);
            if (MAY.player.pos.distanceTo(bs.pos) < 8.5 && MAY.player.grounded) {
              MAY.damagePlayer(1, bs.pos, "Sóng đất của Vua Nấm! Nhớ nhấn Space nhảy né vòng đỏ!");
            }
          });
        }
      },
      onSpellHit: function (spellId, castPos, bs) {
        if (spellId === "wave") {
          bs.subState.wet = true;
          if (bs.mesh.userData.cap) bs.mesh.userData.cap.material.emissive.setHex(0x0284c7);
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
          bs.syncHUD();
          MAY.toast("🌊 Vỏ Vua Nấm đã mềm ướt! Tung ngay 🌿 Nở Hoa (Phím 2 + R) nào!");
        } else if (spellId === "growth") {
          if (bs.subState.wet) {
            bs.subState.wet = false;
            if (bs.mesh.userData.cap) bs.mesh.userData.cap.material.emissive.setHex(0x3b0764);
            if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("hit", false);
            MAY.VFX.spawnVineTrap(bs.pos.clone(), 2.8);
            bs.damage("🌿 Dây hoa bùng nở trói chặt Vua Nấm Khô Héo!");
          } else {
            MAY.toast("💡 Vỏ nó còn khô cứng quá! Dùng 🌊 Sóng Xung Kích (Phím 1 + R) tưới ướt trước đã nhé!");
          }
        }
      },
      onDefeat: function () {
        if (bossShroomMesh.userData.playClip) bossShroomMesh.userData.playClip("defeat", false);
        ch2St.stage = 4;
        MAY.persist();
        barkMat.color.setHex(0xffffff);
        motherCanopy.visible = true;
        treeLight.intensity = 2.6;
        MAY.sndTreeRevive(new THREE.Vector3(0, ay + 6, 22));
        ch2Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI GẶP BÀ SÓC HẠT DẺ NHẬN 🟢 NGỌC XANH LÁ!", ch2Npc.pos);
        MAY.toast("🌳 Cây Cổ Thụ Mẹ hồi sinh rực rỡ khắp rừng! Về gặp Bà Sóc nhận thưởng nào!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    function updateCh2Story() {
      if (ch2St.rewarded || ctx.save.gem) {
        ch2Npc.setMarker("♥");
        ctx.setObjective("🟢", "RỪNG NẤM ĐÃ HỒI SINH — SANG CHƯƠNG 3 SA MẠC (PHÍM M)", null);
        return;
      }
      if (ch2St.bossDown) {
        ch2Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI GẶP BÀ SÓC HẠT DẺ NHẬN 🟢 NGỌC XANH LÁ!", ch2Npc.pos);
        return;
      }
      if (ch2St.stage === 0) {
        ch2Npc.setMarker("!");
        ctx.setObjective("💬", "TRÒ CHUYỆN VỚI BÀ SÓC HẠT DẺ (!)", ch2Npc.pos);
        return;
      }
      if (!ch2St.steps.mudClear) {
        ch2Npc.setMarker("?");
        ctx.setObjective("🌊", "DÙNG 🌊 SÓNG (1+R) RỬA SẠCH Ụ BÙN ĐEN ĐẦU SUỐI", mudPos);
        return;
      }
      if (ch2St.stage < 2) {
        ch2Npc.setMarker("!");
        ctx.setObjective("💬", "QUAY LẠI BÀ SÓC HẠT DẺ NHẬN PHÉP 🌿 NỞ HOA (!)", ch2Npc.pos);
        return;
      }
      var revCount = 0;
      for (var i = 0; i < 3; i++) if (ch2St.steps["tree" + i]) revCount++;
      if (revCount < 3) {
        ch2Npc.setMarker("?");
        var nextT = deadTrees[0].pos;
        for (var j = 0; j < 3; j++) if (!ch2St.steps["tree" + j]) { nextT = deadTrees[j].pos; break; }
        ctx.setObjective("🌿", "DÙNG 🌿 NỞ HOA (2+R) HỒI SINH 3 CÂY CHẾT (" + revCount + "/3)", nextT);
      } else {
        ch2St.stage = 3;
        MAY.persist();
        ch2Npc.setMarker("?");
        if (!ch2Boss.active) {
          ch2Boss.activate(function () {
            MAY.openDialogue({
              name: ch2Sc.npcName, role: ch2Sc.npcRole, icon: ch2Sc.npcIcon, color: ch2Sc.npcColor,
              pages: ch2Sc.bossIntro, endBtn: "🍄 Chiến đấu với Vua Nấm!", voiceClip: "boss_appear"
            });
          });
        }
        ctx.setObjective("🍄", "PHỐI HỢP 🌊 + 🌿 ĐÁNH BẠI VUA NẤM KHÔ HÉO!", ch2Boss.pos);
      }
    }

    ctx.addSkillTarget({
      id: "l2_mud", pos: mudPos, radius: 8.5, reqSpell: "wave",
      hint: "🌊 Rửa sạch Ụ Bùn Đen!", done: !!ch2St.steps.mudClear,
      isActive: function () { return ch2St.stage >= 1 && !ch2St.steps.mudClear; },
      onHit: function (sp, tg) {
        ch2St.steps.mudClear = true; MAY.persist();
        mudDam.visible = false;
        ctx.removeCollider("muddam");
        tg.markDone();
        MAY.sndStar();
        MAY.burstAt(mudPos.clone().add(new THREE.Vector3(0, 1, 0)), 0x38bdf8, 24);
        MAY.toast("🌊 Dòng suối trong chảy lại rồi! Quay về gặp Bà Sóc nhận Phép 🌿 Nở Hoa Hồi Sinh!");
        updateCh2Story();
      }
    });

    deadTrees.forEach(function (dtObj, idx) {
      ctx.addSkillTarget({
        id: "l2_tree_" + idx, pos: dtObj.pos, radius: 8.5, reqSpell: "growth",
        hint: "🌿 Hồi sinh Cây Chết (" + (idx + 1) + "/3)", done: !!ch2St.steps["tree" + idx],
        isActive: function () { return ch2St.stage >= 2 && !ch2St.steps["tree" + idx]; },
        onHit: function (sp, tg) {
          ch2St.steps["tree" + idx] = true; MAY.persist();
          dtObj.revive(false);
          tg.markDone();
          MAY.toast("🌿 Cây Cổ Thụ sống lại nở hoa rực rỡ và mọc Nấm Lò Xo!", "Kỳ diệu quá! Cây cổ thụ đã hồi sinh nở hoa rực rỡ rồi!");
          updateCh2Story();
        }
      });
    });

    ch2Npc = ctx.addQuestNPC({
      kind: "squirrel", name: ch2Sc.npcName, icon: ch2Sc.npcIcon,
      pos: [3.5, 36], rotY: 0, scale: 1.45, labelY: 2.3, autoGreet: ch2St.stage === 0,
      onTalk: function () {
        if (ch2St.rewarded || ctx.save.gem) {
          MAY.openDialogue({ name: ch2Sc.npcName, role: ch2Sc.npcRole, icon: ch2Sc.npcIcon, color: ch2Sc.npcColor, pages: ch2Sc.complete, endBtn: "🏜️ Tới Chương 3: Sa Mạc", onDone: function () { MAY.enterLevel("level3"); } });
        } else if (ch2St.bossDown) {
          MAY.openDialogue({
            name: ch2Sc.npcName, role: ch2Sc.npcRole, icon: ch2Sc.npcIcon, color: ch2Sc.npcColor,
            pages: ch2Sc.reward, endBtn: ch2Sc.rewardBtn, voiceClip: "gem_win",
            onDone: function () { ch2St.rewarded = true; MAY.persist(); updateCh2Story(); ctx.awardGem(); }
          });
        } else if (ch2St.stage === 0) {
          MAY.openDialogue({
            name: ch2Sc.npcName, role: ch2Sc.npcRole, icon: ch2Sc.npcIcon, color: ch2Sc.npcColor,
            pages: ch2Sc.intro, endBtn: ch2Sc.introBtn, voiceClip: "npc_ch2",
            onDone: function () {
              ch2St.stage = 1; MAY.persist();
              if (!MAY.isSpellUnlocked("wave")) MAY.unlockSpell("wave", true);
              updateCh2Story();
            }
          });
        } else if (ch2St.steps.mudClear && ch2St.stage < 2) {
          MAY.openDialogue({
            name: ch2Sc.npcName, role: ch2Sc.npcRole, icon: ch2Sc.npcIcon, color: ch2Sc.npcColor,
            pages: ch2Sc.stage2GiveSkill, endBtn: ch2Sc.stage2Btn,
            onDone: function () {
              ch2St.stage = 2; MAY.persist();
              MAY.unlockSpell("growth");
              updateCh2Story();
            }
          });
        } else {
          MAY.openDialogue({ name: ch2Sc.npcName, role: ch2Sc.npcRole, icon: ch2Sc.npcIcon, color: ch2Sc.npcColor, pages: ch2Sc.inProgress, endBtn: "🌿 Tiếp tục hồi sinh rừng!" });
        }
      }
    });
    updateCh2Story();

    /* ---- Nhiệm Vụ Phụ Tương Tác Chương 2: Bữa Tiệc Đèn Lồng Rừng Nấm ---- */
    ctx.setupSideQuest({
      npcPos: [-7.5, 36], npcRotY: 0.35, npcScale: 1.25, labelY: 2.0,
      tasks: [
        { id: "basket", kind: "basket",  label: "Nhặt Giỏ Hạt Dẻ Vàng bên kia suối", pos: [-10, -26], color: 0xffd93d },
        { id: "flan1",  kind: "lantern", label: "Thắp Đèn Nấm Tiệc Bờ Nam",         pos: [-6.5, bridgeZ + 9.5], color: 0x4ade80 },
        { id: "flan2",  kind: "lantern", label: "Thắp Đèn Nấm Tiệc Bờ Bắc",         pos: [6.5,  bridgeZ - 9.5], color: 0x4ade80 }
      ]
    });

    ctx.onUpdate = function (dt, t) {
      deadTrees.forEach(function (d) { d.update(dt); });
      if (ch2St.bossDown && motherCanopy.scale.x < 1) {
        var ns = Math.min(1, motherCanopy.scale.x + dt * 1.1);
        motherCanopy.scale.setScalar(ns);
      }
      streamFish.forEach(function (sf) {
        var fx = sf.x0 + Math.sin(t * 0.6 + sf.ph) * 4.5;
        sf.g.position.set(fx, -0.45, streamCenterZ(fx) + Math.cos(t * 0.8 + sf.ph) * 1.4);
        sf.g.rotation.y = Math.cos(t * 0.6 + sf.ph) > 0 ? 0 : Math.PI;
      });
    };

    MAY.player.spawnAt(0, ctx.groundH(0, 44) + 1.05, 44, 0, false);
    return ctx;
  };

})(window.MAY);
