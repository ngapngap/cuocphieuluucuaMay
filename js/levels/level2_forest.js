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

    // The roots carry the stream to the Mother Tree. This is introduced only
    // when the final tree is revived, so older saves already at the boss keep
    // their existing progress.
    var rootTrialPos = new THREE.Vector3(0, ctx.groundH(0, 17), 17);
    var rootTrial = new THREE.Group(); rootTrial.position.copy(rootTrialPos);
    var rootBasin = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.28, 8, 16), new THREE.MeshStandardMaterial({ color: 0x75634b, roughness: 0.9 }));
    rootBasin.rotation.x = Math.PI / 2; rootBasin.position.y = 0.3; rootTrial.add(rootBasin);
    var rootCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), new THREE.MeshStandardMaterial({ color: 0x8d6b48, emissive: 0x163d2c, emissiveIntensity: 0.6 }));
    rootCore.position.y = 1.1; rootTrial.add(rootCore); ctx.add(rootTrial);
    function rootTrialActive() { return ch2St.stage === 2 && !!ch2St.steps.rootTrialStarted && !ch2St.steps.rootTrialDone; }
    var rootTarget = ctx.addSkillTarget({
      id: "l2_root_trial", pos: rootTrialPos, radius: 7, reqSpell: ["wave", "growth"],
      hint: "🌊 Tưới rễ → 🌿 đánh thức mầm", ringColor: 0x4ade80,
      isActive: rootTrialActive,
      onHit: function (sp, tg) {
        if (!ch2St.steps.rootTrialWet && sp === "wave") {
          ch2St.steps.rootTrialWet = true; MAY.persist();
          rootCore.material.color.setHex(0x41bce0);
          MAY.burstAt(rootTrialPos.clone().add(new THREE.Vector3(0, 1, 0)), 0x38bdf8, 16);
          MAY.toast("🌊 Nước đã tới rễ! Dùng 🌿 Nở Hoa đánh thức mầm bảo vệ Cây Mẹ.");
          updateCh2Story();
        } else if (ch2St.steps.rootTrialWet && sp === "growth") {
          ch2St.steps.rootTrialDone = true; MAY.persist(); tg.markDone();
          MAY.VFX.spawnVineTrap(rootTrialPos.clone(), 2.3);
          MAY.toast("🌿 Rễ Cây Mẹ bừng sáng! Theo lối dưới rễ lên tán nấm tìm tín hiệu của Thỏ Bông.");
          updateCh2Story();
        } else {
          MAY.toast(ch2St.steps.rootTrialWet ? "🌿 Rễ đã ướt: dùng Nở Hoa (2+R)!" : "🌊 Rễ còn khô: dùng Sóng (1+R) trước!");
        }
      }
    });
    function syncRootTrial() {
      var active = rootTrialActive(); rootTrial.visible = active;
      rootCore.material.color.setHex(ch2St.steps.rootTrialWet ? 0x41bce0 : 0x8d6b48);
      if (rootTarget.hintLb) rootTarget.hintLb.visible = active;
      rootTarget.ring.visible = active;
    }

    // Le nouveau sentier commence aux racines, avant le r?veil du Vua N?m.
    var expedition = MAY.createChapterJourney(ctx, {
      title: "Tin nhắn trên tán nấm", entry: [0, ctx.groundH(0, 17), 17], color: 0x85e1a5,
      sections: [
        { name: "Rễ Cây Mẹ", brief: "Soi vệt nước và xoay nhánh dẫn dòng về rễ khô.", landmark: "Đài dẫn nước", length: 590, sky: 0x658c77, ground: 0x537656, path: 0x8bbf80, scenery: "roots", events: [
          {at:.08,kind:"pass",lane:-1,cue:"Vệt nước vòng bên trái rễ lớn.",success:"Mây tìm được đường qua."},
          {at:.19,kind:"align",lane:0,slots:4,answer:2,initial:0,cue:"Xoay máng về phía rễ có lá xanh.",success:"Nhánh đã nối tới dấu sáng."},
          {at:.30,kind:"cast",lane:0,spell:"wave",cue:"Dùng Sóng đưa nước vào máng.",success:"Dòng nước mở lối."},
          {at:.41,kind:"pass",lane:1,cue:"Đi bên phải qua rễ nổi.",success:"Mây tìm được đường qua."},
          {at:.52,kind:"align",lane:-1,slots:4,answer:1,initial:3,cue:"Xoay nhánh về vệt sáng trên rễ.",success:"Nhánh đã nối tới dấu sáng."},
          {at:.64,kind:"cast",lane:0,spell:"wave",cue:"Tưới nước cho rễ vừa nối.",success:"Dòng nước mở lối."},
          {at:.76,kind:"cast",lane:0,spell:"growth",cue:"Rễ đã ướt: dùng Nở Hoa đánh thức mầm.",success:"Mầm bừng nở!"},
          {at:.88,kind:"pass",lane:1,cue:"Theo bậc nấm mới mọc bên phải.",success:"Mây tìm được đường qua."}
        ]},
        { name: "Bậc nấm", brief: "Nấm mở đường lên cao; tìm từng khoảng có thể bước tiếp.", landmark: "Cầu thang nấm", length: 590, sky: 0x82b794, ground: 0x628e63, path: 0xa8d995, scenery: "canopy", events: [
          {at:.08,kind:"pass",lane:1,cue:"Bậc nấm đầu nằm bên phải.",success:"Mây tìm được đường qua."},
          {at:.19,kind:"cast",lane:0,spell:"growth",cue:"Đánh thức cụm mầm giữa đường.",success:"Mầm bừng nở!"},
          {at:.30,kind:"pass",lane:-1,cue:"Nhánh gãy chắn phải; qua trái.",success:"Mây tìm được đường qua."},
          {at:.41,kind:"pass",lane:0,cue:"Theo hàng nấm sáng ở giữa.",success:"Mây tìm được đường qua."},
          {at:.52,kind:"cast",lane:1,spell:"growth",cue:"Gọi bậc nấm phía phải nở ra.",success:"Mầm bừng nở!"},
          {at:.64,kind:"pass",lane:1,cue:"Theo bậc mới sang phải.",success:"Mây tìm được đường qua."},
          {at:.76,kind:"pass",lane:-1,cue:"Lách trái dưới vòm lá thấp.",success:"Mây tìm được đường qua."},
          {at:.88,kind:"pass",lane:0,cue:"Đến khoảng trống giữa tán.",success:"Mây tìm được đường qua."}
        ]},
        { name: "Hai ánh sáng trên tán", brief: "Lần theo nguồn sáng thật và mở lối tắt về Cây Mẹ.", landmark: "Vòm lá hai ánh", length: 590, sky: 0xa8d4a3, ground: 0x6a9d68, path: 0xc7e6a0, scenery: "canopy", events: [
          {at:.08,kind:"switch",lane:0,choices:["Tia xuyên lá", "Đốm phản chiếu"],answer:0,cue:"Tìm tia sáng xuyên qua lá, không phải đốm phản chiếu.",success:"Mây theo đúng nguồn sáng."},
          {at:.19,kind:"fork",lane:0,choices:["Nhánh lá xanh", "Nhánh hoa vàng"],cue:"Chọn nhánh lá xanh bên trái hoặc nhánh hoa vàng bên phải.",success:"Mây chọn một lối qua tán."},
          {at:.30,kind:"align",lane:0,slots:4,answer:2,initial:1,cue:"Xoay nhánh lá để tia tới dấu trên thân cây.",success:"Nhánh đã nối tới dấu sáng.", afterFork:[
            {lane:-1,answer:1,cue:"Nhánh lá xanh: xoay máng bên trái về dấu sáng.",success:"Tia sáng qua nhánh lá xanh."},
            {lane:1,answer:3,cue:"Nhánh hoa vàng: xoay máng bên phải về dấu sáng.",success:"Tia sáng qua nhánh hoa vàng."}
          ]},
          {at:.41,kind:"pass",lane:1,cue:"Đi phía phải tới vệt sáng kế tiếp.",success:"Mây tìm được đường qua."},
          {at:.52,kind:"switch",lane:0,choices:["Đốm phản chiếu", "Tia xuyên lá"],answer:1,cue:"Chọn tia nối liền với khe lá trên cao.",success:"Mây theo đúng nguồn sáng."},
          {at:.64,kind:"cast",lane:0,spell:"growth",cue:"Gọi dây leo ở dấu sáng mở lối tắt.",success:"Mầm bừng nở!"},
          {at:.76,kind:"pass",lane:-1,cue:"Theo dây leo phía trái xuống gốc.",success:"Mây tìm được đường qua."},
          {at:.88,kind:"pass",lane:0,cue:"Tìm Thỏ Bông bên gốc cây.",success:"Mây tìm được đường qua."}
        ]},
        { name: "Lời đáp từ đồi xa", brief: "Tín hiệu đã gửi. Cùng Thỏ Bông theo các ánh đèn để tìm lời đáp từ đồi xa.", landmark: "Đèn hiệu cuối rừng", length: 600, sky: 0x8bb99e, ground: 0x638c6b, path: 0xb4dba0, scenery: "roots", companion: "rabbit", events: [
          {at:.08,kind:"pass",lane:0,cue:"Theo ánh đèn giữa lối ra khỏi vườn rễ.",success:"Ánh đèn xa nhấp nháy sau tán cây."},
          {at:.19,kind:"escort",lane:-1,cue:"Dẫn Thỏ qua lối trái tránh rễ gai.",success:"Bạn đồng hành đã đi qua cùng Mây."},
          {at:.30,kind:"pass",lane:1,cue:"Tìm đèn nhỏ phía phải.",success:"Mây tìm được đường qua."},
          {at:.41,kind:"switch",lane:0,choices:["Hai ngắn, một dài", "Một dài, hai ngắn"],answer:0,cue:"Đèn xa đáp bằng nhịp nào Mây vừa học?",success:"Đúng rồi: hai ngắn, một dài nghĩa là chờ tớ."},
          {at:.52,kind:"escort",lane:1,cue:"Dẫn Thỏ qua lối phải.",success:"Bạn đồng hành đã đi qua cùng Mây."},
          {at:.64,kind:"cast",lane:0,spell:"growth",cue:"Gọi hoa quanh chân đèn nở.",success:"Mầm bừng nở!"},
          {at:.76,kind:"pass",lane:-1,cue:"Theo ánh hoa bên trái tới mé rừng.",success:"Mây tìm được đường qua."},
          {at:.88,kind:"escort",lane:0,cue:"Cùng Thỏ đến chỗ nhìn rõ ánh đèn cuối rừng.",success:"Ánh đèn từ đồi xa đã đáp lại lời gọi của Mây!"}
        ]},
        { name: "Lối dây leo về Cây Mẹ", brief: "Mang lời đáp từ đồi xa về gốc cây qua một trong hai lối trên tán.", landmark: "Cổng dây leo về gốc", length: 430, sky: 0x79aa85, ground: 0x477550, path: 0xb2d999, scenery: "canopy", events: [
          {at:.10,kind:"fork",choices:["Cành ướt bên trái", "Cành hoa bên phải"],cue:"Chọn cành ướt hoặc cành hoa để mang lời đáp về cây.",success:"Mây chọn đường về trên tán."},
          {at:.24,kind:"cast",lane:-1,spell:"wave",cue:"Cành ướt: dùng Sóng nâng nhịp cầu lá.",success:"Cầu lá nổi lên dưới chân.",afterFork:[
            {lane:-1,spell:"wave",cue:"Cành ướt bên trái: dùng Sóng nâng cầu lá.",success:"Cầu lá nổi lên trên dòng nước."},
            {lane:1,spell:"growth",cue:"Cành hoa bên phải: dùng Nở Hoa gọi bậc nấm.",success:"Bậc nấm nở dẫn qua cành hoa."}
          ]},
          {at:.39,kind:"pass",lane:-1,cue:"Qua cầu lá bên trái.",success:"Mây giữ lời đáp trên đường về.",afterFork:[
            {lane:-1,cue:"Qua cầu lá phía trái.",success:"Mây qua cành ướt."},
            {lane:1,cue:"Bước qua bậc nấm phía phải.",success:"Mây qua cành hoa."}
          ]},
          {at:.54,kind:"cast",lane:0,spell:"growth",cue:"Dùng Nở Hoa mở cổng dây leo chung.",success:"Dây leo tách ra, hai lối nhập lại về Cây Mẹ."},
          {at:.69,kind:"pass",lane:1,cue:"Theo dải lá bên phải qua cửa vừa mở.",success:"Mây đi qua cổng dây leo."},
          {at:.84,kind:"echo",pattern:[0,0,2],cue:"Gửi lời đáp từ đồi xa về đèn nơi Cây Mẹ.",success:"Đèn ở gốc nhận hai ngắn, một dài."}
        ]}
      ],
      clearing: {
        section: 2, name: "Vườn rễ và đèn hiệu", brief: "Nối nước từ suối đến rễ, gọi hoa nở rồi gửi lời chờ tớ.",
        devices: [
          {id:"source",name:"Nguồn nước",x:-19,z:0,form:"valve",color:0x75dced},
          {id:"valve",name:"Nhánh dẫn nước",x:-8,z:-20,form:"valve",color:0x80dfe5},
          {id:"tree",name:"Rễ Cây Mẹ",x:10,z:-29,form:"tree",color:0x83ce78},
          {id:"flower",name:"Mầm hoa",x:19,z:-12,form:"flower",color:0xffa9c4,spell:"growth"},
          {id:"short",name:"Đèn nhịp ngắn",x:6,z:2,form:"lamp",color:0xffdf86},
          {id:"long",name:"Đèn nhịp dài",x:-5,z:3,form:"lamp",color:0xffbc71}
        ],
        hint: function(v) { if(!v.source)return "Mở nguồn nước ở đầu vườn."; if(!v.valve)return "Xoay nhánh dẫn nước về rễ."; if(!v.tree)return "Đánh thức rễ đã ướt."; if(!v.flower)return "Gọi mầm hoa nở."; return "Gửi hai nhịp ngắn rồi một nhịp dài. Đã đúng "+(v.notes||0)+"/3."; },
        action: function(id,v) {
          if(id==='source'){v.source=true;return {text:"Nước sáng lên ở đầu nguồn.",done:false};}
          if(id==='valve'){if(!v.source)return {text:"Máng khô; mở nguồn nước trước.",done:false};v.valve=true;return {text:"Nhánh xoay, nước chảy về rễ.",done:false};}
          if(id==='tree'){if(!v.valve)return {text:"Rễ còn khô; hãy nối dòng nước.",done:false};v.tree=true;return {text:"Rễ uống nước và bừng xanh.",done:false};}
          if(id==='flower'){if(!v.tree)return {text:"Mầm đang chờ rễ được tưới.",done:false};v.flower=true;return {text:"Hoa nở, soi sáng hai chiếc đèn.",done:false};}
          if(id==='short'||id==='long'){
            if(!v.flower)return {text:"Đèn chưa sáng; hãy đánh thức hoa.",done:false};
            var expected=(v.notes||0)<2?'short':'long';
            if(id!==expected)return {text:"Nhịp này khác lời gọi. Giữ nhịp đúng và thử lại.",done:false};
            v.notes=(v.notes||0)+1;
            if(v.notes===3){v.sent=true;return {text:"Hai ngắn, một dài: ánh đèn cuối rừng đáp lại!",done:true};}
            return {text:"Đèn sáng nhịp "+v.notes+"/3.",done:false};
          }
          return {text:"Hãy tìm đường nước.",done:false};
        },
        look: function(id,v) {return {lit:id==='source'?!!v.source:id==='valve'?!!v.valve:id==='tree'?!!v.tree:id==='flower'?!!v.flower:!!v.flower,angle:id==='valve'&&v.valve?1.1:0};},
        links: function(v) {var out=[];if(v.source)out.push(["source","valve",0x64cce8]);if(v.valve)out.push(["valve","tree",0x64cce8]);if(v.tree)out.push(["tree","flower",0x8be48f]);if(v.flower)out.push(["flower","short",0xffde84],["flower","long",0xffbd77]);return out;},
        followers: function() {return [];}
      },
      makeVista: function (index, state) {
        if (index !== 4) return null;
        var g = new THREE.Group(), bark = new THREE.MeshStandardMaterial({color:0x557744,roughness:0.9});
        var vine = new THREE.MeshStandardMaterial({color:0x3b9f5c,emissive:0x123618,roughness:0.8}), strands=[];
        [-1,1].forEach(function(side) {
          var post=new THREE.Mesh(new THREE.CylinderGeometry(.65,1,9,8),bark);post.position.set(side*7,4.5,-28);g.add(post);
          var strand=new THREE.Mesh(new THREE.TorusGeometry(4.4,.23,7,24,Math.PI),vine);strand.position.set(side*3,7,-28);strand.rotation.z=side*.25;g.add(strand);strands.push({mesh:strand,side:side});
        });
        var lamp=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8),new THREE.MeshBasicMaterial({color:0xffe078}));lamp.position.set(0,8,-28);g.add(lamp);
        var tag=MAY.makeLabel("ĐÈN CÂY MẸ",{sx:4,sy:.8,bg:"rgba(20,35,22,.92)"});tag.position.set(-3,8,-32);g.add(tag);
        return {group:g,tick:function(distance,lateral,eventIndex,time){
          strands.forEach(function(v){v.mesh.position.x=v.side*(eventIndex>=4?7:3);v.mesh.rotation.z=v.side*(eventIndex>=4?.8:.25);});
          lamp.scale.setScalar(eventIndex>=6?1.5:1+.12*Math.sin(time*3));
        }};
      },
      makeLandmark: function (index) {
        var g = new THREE.Group();
        var bark = new THREE.MeshStandardMaterial({color: 0x765641, roughness: .95});
        var leaf = new THREE.MeshStandardMaterial({color: index === 3 ? 0xffd879 : 0x65bb72, emissive: index === 3 ? 0x64410e : 0x163a20});
        for (var side = -1; side <= 1; side += 2) {
          var trunk = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1.1, 6, 7), bark); trunk.position.set(side * 4.5, 3, 0); trunk.rotation.z = side * -.12; g.add(trunk);
          var crown = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 6), leaf); crown.position.set(side * 4.5, 6, 0); crown.scale.y = .5; g.add(crown);
        }
        var branch = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 9, 7), bark); branch.rotation.z = Math.PI / 2; branch.position.y = 5.5; g.add(branch);
        if (index === 1 || index === 3) { var cap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), leaf); cap.position.set(0, 2.5, 0); g.add(cap); var stem = new THREE.Mesh(new THREE.CylinderGeometry(.3, .5, 2.5, 8), bark); stem.position.y = 1.25; g.add(stem); }
        return g;
      }, onComplete: updateCh2Story
    });

    function updateCh2Story() {
      syncRootTrial();
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
      } else if (rootTrialActive()) {
        ch2Npc.setMarker("?");
        ctx.setObjective(ch2St.steps.rootTrialWet ? "🌿" : "🌊", ch2St.steps.rootTrialWet
          ? "DÙNG 🌿 NỞ HOA ĐÁNH THỨC RỄ CÂY MẸ (2+R)"
          : "DÙNG 🌊 SÓNG DẪN NƯỚC VỀ RỄ CÂY MẸ (1+R)", rootTrialPos);
      } else {
        if (ch2St.stage < 3 && expedition.block()) return;
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
          if (deadTrees.every(function (_, i) { return !!ch2St.steps["tree" + i]; }) && ch2St.stage === 2) {
            ch2St.steps.rootTrialStarted = true; MAY.persist();
          }
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
