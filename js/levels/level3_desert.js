"use strict";
/* ============================================================================
   MÀN 3 — SA MẠC KIM TỰ THÁP (Sa mạc — Viên Ngọc Vàng Nắng 🟡)
   Cồn cát gợn sóng PBR bắt nắng, Kim Tự Tháp bậc thang leo lên đỉnh,
   Ốc Đảo có hồ bơi trong vắt + rương ngầm, Tàn tích cột đá & Bình gốm cổ
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  MAY.LEVELS.level3 = function () {
    var ctx = MAY.createWorldCtx("level3");
    ctx.mode = "land";
    ctx.waterLevel = 0.15;
    ctx.worldRadius = 100;
    ctx.minimapBg = "rgba(156,108,42,0.92)";

    MAY.setSunOffset(42, 38, -24);
    MAY.sun.color.setHex(0xffe9b5);
    MAY.sun.intensity = 1.78;
    MAY.hemiLight.color.setHex(0xfff0cc);
    MAY.hemiLight.groundColor.setHex(0xb88b52);
    MAY.hemiLight.intensity = 0.46;
    MAY.diveLight.intensity = 0.12;
    MAY.diveLight.castShadow = false;
    MAY.setAmbientTone(640, 0.032, "level3");
    MAY.setPostGrade({ tint: 0xfffaf0, vignette: 0.22, bloom: 0.30, ssao: 0.50, godRay: 0.38, godRayColor: 0xffe099 });
    ctx.getSurface = function (x, z) {
      return Math.hypot(x - OAS.x, z - OAS.z) < 20 && ctx.groundH(x, z) > 0.5 ? "grass" : "sand";
    };

    ctx.landFog = { color: 0xebc98f, density: 0.0056 };
    ctx.underwaterFog = { color: 0x0b758a, density: 0.032 };
    MAY.scene.fog = new THREE.FogExp2(ctx.landFog.color, ctx.landFog.density);
    MAY.scene.background = new THREE.Color(ctx.landFog.color);

    ctx.addSky({
      zenith: 0x2574c4, horizon: 0xf7d694, ground: 0xb6813e,
      sunDir: new THREE.Vector3(42, 38, -24), sunColor: 0xfff2b2, cloudColor: 0xfff5dc, cloudAmt: 0.22
    });

    /* Tọa độ Kim Tự Tháp (0, -48) & Hồ Ốc Đảo (0, 10) */
    var PYR = { x: 0, z: -48, half: 18 };
    var OAS = { x: 0, z: 10, r: 15 };

    ctx.groundH = function (x, z) {
      /* Kim Tự Tháp bậc thang leo lên đỉnh được! */
      var px = Math.abs(x - PYR.x), pz = Math.abs(z - PYR.z);
      var pm = Math.max(px, pz);
      if (pm < PYR.half) {
        var frac = 1 - pm / PYR.half;
        var tier = Math.floor(frac * 9) / 9;
        return 3.0 + tier * 15.5;
      }
      /* Cồn cát lượn sóng mềm mại */
      var dune = Math.sin(x * 0.055 + Math.cos(z * 0.04) * 1.6) * 2.8 +
                 Math.cos(z * 0.065) * 1.7 +
                 Math.sin((x - z) * 0.12) * 0.45;
      var h = 3.2 + dune;
      /* Lòng hồ Ốc Đảo xanh mát */
      var od = Math.hypot(x - OAS.x, z - OAS.z);
      if (od < OAS.r) {
        var ot = 1 - od / OAS.r;
        h = h * (1 - ot) + (-3.2) * ot * ot;
      }
      return h;
    };

    /* Cát sa mạc gợn sóng mịn màng bắt ánh nắng chiều */
    var sandMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.sandRipple.map,
      normalMap: MAY.PBR.sandRipple.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: MAY.PBR.sandRipple.roughnessMap,
      color: 0xeec882,
      roughness: 0.88
    });
    MAY.applyCaustics(sandMat, 0.15, 0.72);
    ctx.buildTerrain(240, 124, sandMat, {
      staticLights: [
        { x: -4.3, z: PYR.z + PYR.half + 1.4, r: 1.0, g: 0.68, b: 0.28, radius: 18, intensity: 0.45 },
        { x:  4.3, z: PYR.z + PYR.half + 1.4, r: 1.0, g: 0.68, b: 0.28, radius: 18, intensity: 0.45 }
      ]
    });

    /* Hồ Ốc Đảo nước ngọc bích bơi lặn được */
    var oasisWater = ctx.addWater({
      width: 34, height: 34, segs: 42, y: 0.15, offsetX: OAS.x, offsetZ: OAS.z,
      sunDir: new THREE.Vector3(42, 38, -24),
      deepColor: 0x05586b, shallowColor: 0x1fc4c4, skyColor: 0xf7d694,
      foamCenter: new THREE.Vector3(OAS.x, 0.15, OAS.z), foamRadius: 11.2, waveAmp: 0.07
    });
    oasisWater.position.set(OAS.x, 0.15, OAS.z);

    /* Tia nắng khối Screen-Space Volumetric God Rays + Hạt cát vàng bay trong gió */
    if (MAY.setGodRays) MAY.setGodRays({ color: 0xffe099, strength: 0.38, density: 0.92, decay: 0.94 });
    ctx.addAmbientParticles({ count: 280, spread: 120, minY: 0.5, maxY: 16, vy: -0.15, vx: 2.4, color: 0xffe4a0, size: 0.16, opacity: 0.55 });

    /* ---- Kim Tự Tháp Đá Sa Thạch Bậc Thang (0, -48) có vết phong hóa không lặp ---- */
    var sandstoneMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap,
      normalScale: new THREE.Vector2(1.35, 1.35), roughnessMap: MAY.PBR.stoneWall.roughnessMap,
      color: 0xe6be7a, roughness: 0.88
    });
    MAY.applyWorldWeathering(sandstoneMat, { macro: 0.15, stain: 0.22, wallGrime: 0.34, stainColor: 0x6b4b26 });
    var pyrGroup = new THREE.Group();
    for (var tier = 0; tier < 9; tier++) {
      var side = PYR.half * 2 * (1 - tier / 9);
      var block = new THREE.Mesh(new THREE.BoxGeometry(side, 1.78, side), sandstoneMat);
      block.position.y = 3.0 + tier * 1.72 + 0.85;
      block.castShadow = true; block.receiveShadow = true;
      pyrGroup.add(block);
    }
    pyrGroup.position.set(PYR.x, 0, PYR.z);
    /* Đỉnh chóp vàng Kim Tự Tháp + Đôi cột tháp Obelisk Ai Cập + Đài lửa cổ (đài chính đổ bóng thật!) */
    var goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffd93d, emissive: 0xcc8800, emissiveIntensity: 0.45, metalness: 0.85, roughness: 0.18, clearcoat: 1.0 });
    var capstone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.8, 4), goldMat);
    capstone.rotation.y = Math.PI / 4; capstone.position.set(0, 19.8, 0); pyrGroup.add(capstone);
    [-6.0, 6.0].forEach(function (bx, bIdx) {
      var obShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.85, 6.5, 4), sandstoneMat);
      obShaft.rotation.y = Math.PI / 4; obShaft.position.set(bx, 6.2, PYR.half + 2.2); obShaft.castShadow = true; pyrGroup.add(obShaft);
      var obTip = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.1, 4), goldMat);
      obTip.rotation.y = Math.PI / 4; obTip.position.set(bx, 10.0, PYR.half + 2.2); pyrGroup.add(obTip);
      var br = MAY.makeCagedLantern(0xffa438, 3.2, 26, bIdx === 0);
      br.position.set(bx * 0.72, 5.2, PYR.half + 1.4); pyrGroup.add(br);
      ctx.addCollider(PYR.x + bx, PYR.z + PYR.half + 2.2, 0.95, "obelisk", { maxY: 11.2 });
    });
    ctx.add(pyrGroup);
    if (MAY.add3DLoop) {
      MAY.add3DLoop([0, 5.2, PYR.z + PYR.half + 1.4], { kind: "fire", freq: 720, vol: 0.036, maxDist: 36 });
      MAY.add3DLoop([OAS.x, 0.6, OAS.z], { kind: "water", freq: 560, vol: 0.042, maxDist: 34 });
    }

    /* Sỏi đá sa mạc, mảnh sa thạch vụn quanh chân Kim Tự Tháp/Obelisk & Rặng núi cồn cát tầm xa */
    MAY.scatterDebris(ctx, 180, function (x, z) { return Math.hypot(x - OAS.x, z - OAS.z) > 15; }, { spread: 86, size: 0.26, color: 0xb9925c });
    MAY.scatterPropCluster(ctx, [
      { x: -6.0, z: PYR.z + PYR.half + 2.2, rMin: 1.5, rMax: 4.8, count: 16 },
      { x: 6.0,  z: PYR.z + PYR.half + 2.2, rMin: 1.5, rMax: 4.8, count: 16 },
      { x: 0,    z: PYR.z + PYR.half + 4.0, rMin: 2.5, rMax: 7.5, count: 20 }
    ], { size: 0.28, color: 0xa67c46 });
    MAY.buildVistaRing(ctx, { count: 20, radius: 142, hMin: 18, hMax: 42, wBase: 34, baseY: -1, color: 0xc29356 });

    /* Bệ Ngọc Vàng Nắng trên đỉnh Kim Tự Tháp! */
    ctx.addGemAltar([PYR.x, 18.6, PYR.z]);

    /* Quanh Ốc Đảo: Cây dừa thật + Bụi cỏ xanh + Đèn lồng trại + Cá nhỏ trong hồ */
    [[14, 15, 1.15], [-14, 14, 1.05], [12, -3, 1.0], [-13, -2, 1.1], [3, 24, 0.95]].forEach(function (p) {
      var pm = MAY.makeRealisticPalm(p[2]);
      pm.position.set(p[0], ctx.groundH(p[0], p[1]) - 0.1, p[1]);
      pm.rotation.y = p[0]; ctx.add(pm);
      ctx.addCollider(p[0], p[1], 0.55 * p[2], "palm");
    });
    MAY.scatterLushMeadow(ctx, 420, function (x, z) {
      var d = Math.hypot(x - OAS.x, z - OAS.z);
      return d > 11.5 && d < 22;
    }, { spread: 36, color: 0x7fd666, w: 0.9, h: 0.75, flowers: true });

    var oasisFish = [];
    for (var ofi = 0; ofi < 6; ofi++) {
      var fg = MAY.fishBody(ofi % 2 === 0 ? 0xffc83d : 0x38bdf8, 0.95, ofi % 3);
      ctx.add(fg);
      oasisFish.push({ g: fg, a: ofi * 1.05, r: 3.5 + (ofi % 3) * 2.1 });
    }

    /* Tàn tích cột đá cổ sa mạc ở phía Tây (-42, 6) + Va chạm 3D */
    [[-46, 0], [-46, 8], [-46, 16], [-34, 0], [-34, 8], [-34, 16]].forEach(function (cp, idx) {
      var h = idx === 2 ? 4.5 : 7.8;
      var col = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.92, h, 12), sandstoneMat);
      col.position.set(cp[0], ctx.groundH(cp[0], cp[1]) + h / 2, cp[1]);
      col.castShadow = true; col.receiveShadow = true; ctx.add(col);
      ctx.addCollider(cp[0], cp[1], 1.1);
    });
    var lintelY = ctx.groundH(-40, 0);
    var lintel = new THREE.Mesh(new THREE.BoxGeometry(14, 1.4, 2.2), sandstoneMat);
    lintel.position.set(-40, lintelY + 8.2, 0);
    lintel.castShadow = true; lintel.receiveShadow = true; ctx.add(lintel);
    ctx.addBoxCollider(-40, 0, 14.0, 2.2, lintelY + 7.5, lintelY + 9.0, 0, "ruin_lintel", { walkable: true });

    /* ---- 10 Đá Mặt Trời (Nhiệm vụ chính) ---- */
    var sunStoneGeo = new THREE.OctahedronGeometry(0.78, 0);
    var sunStoneMat = new THREE.MeshPhysicalMaterial({ color: 0xffd633, emissive: 0xff8c00, emissiveIntensity: 0.95, roughness: 0.15, metalness: 0.3, clearcoat: 1.0 });
    ctx.addCollectibles([
      [18, 22], [-22, 24], [38, 12], [-40, 8], [52, -16],
      [-54, -22], [32, -40], [-30, -44], [0, 3.6, -34], [4, 46]
    ], { color: 0xffd633, icon: "☀️", yOff: 1.35, makeMesh: function () { return new THREE.Mesh(sunStoneGeo, sunStoneMat); } });

    /* ---- 5 Bạn Sa Mạc + Lạc Đà Nhí Kiki ---- */
    ctx.addFriends([
      { name: "Rùa Sa Mạc",      kind: "tortoise", pos: [16, 22],  greet: "🐢 Rùa Sa Mạc gật đầu chào nhà thám hiểm Mây!" },
      { name: "Cáo Tai To",      kind: "fennec",  pos: [-28, 18], greet: "🦊 Cáo Fennec vẫy đôi tai siêu to chào Mây!" },
      { name: "Thằn Lằn Cát",    kind: "lizard",  pos: [42, -8],  greet: "🦎 Thằn lằn cát chạy zích zắc chào Mây!" },
      { name: "Chồn Đất Nhí",    kind: "meerkat", pos: [-38, -26],greet: "🐾 Chồn đất đứng thẳng vẫy tay chào Mây!" },
      { name: "Đại Bàng Vàng",   kind: "eagle",   pos: [24, 11.5, -24], behavior: "fly", orbitR: 12, opts: { scale: 1.25 }, greet: "🦅 Đại bàng vàng sải cánh chào nhà thám hiểm Mây!" }
    ]);

    /* ---- 3 Rương (1 dưới đáy hồ Ốc Đảo!), 4 Bình Gốm Cổ (amphora.glb), 5 Xương Rồng nở hoa ---- */
    ctx.addChests([[OAS.x, -2.5, OAS.z], [-40, 8], [46, -28]], 0xd9a441);

    ctx.addSouvenirs([[-36, 4], [28, 26], [-24, -36], [34, -18]].map(function (p, i) {
      var m = new THREE.Group();
      var glb = MAY.modelsReady ? MAY.cloneProp("amphora", 0xd99b52, 1.15) : null;
      if (glb) m.add(glb);
      else {
        var vase = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.25, 0), new THREE.Vector2(0.45, 0.5), new THREE.Vector2(0.2, 1.0), new THREE.Vector2(0.32, 1.25)], 12),
          new THREE.MeshStandardMaterial({ color: 0xc97b42, roughness: 0.75 }));
        m.add(vase);
      }
      return { id: "amp" + i, pos: p, mesh: m, color: 0xffd080, msg: "Nhặt được bình gốm cổ cho Ốc Đảo" };
    }));

    function makeCactus(x, z, interactive) {
      var g = new THREE.Group();
      var cm = new THREE.MeshStandardMaterial({ color: 0x3b8a4b, roughness: 0.85, normalMap: MAY.PBR.bark.normalMap });
      var main = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 2.5, 6, 12), cm); main.position.y = 1.5; g.add(main);
      var a1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.0, 5, 10), cm); a1.position.set(0.65, 1.9, 0); a1.rotation.z = -0.35; g.add(a1);
      var a2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.85, 5, 10), cm); a2.position.set(-0.62, 1.4, 0.1); a2.rotation.z = 0.4; g.add(a2);
      if (interactive) {
        var fl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff5c97, emissive: 0xff3b7f, emissiveIntensity: 0.7 }));
        fl.position.y = 3.1; fl.scale.setScalar(0.01); g.add(fl);
        g.userData.flower = fl;
      }
      g.position.set(x, ctx.groundH(x, z), z);
      g.rotation.y = x * 0.6;
      g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      return g;
    }
    [[-18, 34], [26, 36], [56, 8], [-58, 4], [48, -42], [-48, -46], [24, -62], [-18, -68]].forEach(function (p) {
      ctx.add(makeCactus(p[0], p[1], false));
      ctx.addCollider(p[0], p[1], 0.52, "cactus", { maxY: ctx.groundH(p[0], p[1]) + 3.0 });
    });
    ctx.addInteractProps([[22, 6], [-22, 6], [30, -10], [-28, -14], [14, 34]].map(function (p, i) {
      var cg = makeCactus(p[0], p[1], true);
      ctx.addCollider(p[0], p[1], 0.52, "cactus_int", { maxY: ctx.groundH(p[0], p[1]) + 3.0 });
      return {
        id: "cac" + i, obj: cg, label: "Chạm xương rồng nở hoa", burstColor: 0xff6b9d,
        toastText: "Cây xương rồng nở hoa hồng rực rỡ!",
        onActivate: function (obj) { obj.userData.flower.scale.setScalar(1.35); }
      };
    }));

    /* Bảo vật ẩn: Bọ Hung Vàng giấu phía sau Kim Tự Tháp */
    var scarab = new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 10),
      new THREE.MeshPhysicalMaterial({ color: 0xffd700, emissive: 0xcc8800, emissiveIntensity: 0.9, metalness: 0.9, roughness: 0.15, clearcoat: 1.0 }));
    scarab.scale.set(0.85, 0.55, 1.35);
    ctx.addHiddenTreasure([0, ctx.groundH(0, -72) + 1.0, -72], {
      name: "Bọ Hung Vàng May Mắn",
      hint: "Có báu vật vàng óng giấu phía sau lưng Kim Tự Tháp...",
      mesh: scarab
    });

    /* 3 Thử thách Màn 3 */
    ctx.addRingsChallenge([[28, 16], [36, 0], [32, -16], [20, -28], [6, -32]], { title: "5 vòng nắng cồn cát", color: 0xffca3a });
    ctx.addRaceChallenge([-12, 26], [[-32, 16], [-32, -16], [16, -24], [24, 14]], { title: "Đua cùng Cáo Tai To", time: 58 });
    ctx.addQuizStation([0, -24], { label: "Nhân Sư Đố Vui" });

    ctx.addPortal([0, 56], "hub", "🏝️ Về Đảo Mây", 0xfacc15);

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.fillStyle = "#22d3ee";
      mm.beginPath(); mm.arc(C + OAS.x * K, C + OAS.z * K, OAS.r * K, 0, 6.29); mm.fill();
      mm.fillStyle = "#eab308";
      mm.fillRect(C + (PYR.x - PYR.half) * K, C + (PYR.z - PYR.half) * K, PYR.half * 2 * K, PYR.half * 2 * K);
    };

    /* ---- CỐT TRUYỆN CHƯƠNG 3: Lạc Đà Kiki (!) -> Hồi sinh Cây Chà Là (🌿) -> Học Tia Nắng (☀️) -> 3 Đài Gương Laser -> Trùm Bọ Cạp Sa Mạc! ---- */
    ctx.checkpoint = new THREE.Vector3(0, ctx.groundH(0, 44) + 1.1, 44);
    var ch3St = ctx.story;
    var ch3Sc = MAY.STORY_SCRIPTS.level3;
    ctx.setupAtmosphere(
      { fog: 0x9b8875, density: 0.0095, sunInt: 1.05, hemiInt: 0.34, zenith: 0x5c5b66, horizon: 0xbda98e },
      { fog: 0xebc98f, density: 0.0054, sunInt: 1.82, hemiInt: 0.52, zenith: 0x2574c4, horizon: 0xf7d694 },
      !!ch3St.bossDown
    );

    /* Phong ấn Bóng Tối trên đỉnh Kim Tự Tháp (vỡ tan khi 3 Đài Gương chiếu hội tụ!) */
    var pyrPeak = new THREE.Vector3(PYR.x, 20.5, PYR.z);
    var darkSeal = new THREE.Mesh(
      new THREE.OctahedronGeometry(3.8, 0),
      new THREE.MeshPhysicalMaterial({ color: 0x241338, emissive: 0x6b21a8, emissiveIntensity: 0.75, transparent: true, opacity: 0.78, flatShading: true })
    );
    darkSeal.position.copy(pyrPeak);
    darkSeal.visible = ch3St.stage < 3 && !ch3St.bossDown;
    ctx.add(darkSeal);

    /* Cây Chà Là Khô bên bờ Ốc Đảo (dùng 🌿 Nở Hoa hồi sinh mở Đĩa Mặt Trời!) */
    var oasisTree = MAY.buildDeadTree(ctx, 13, 19, { scale: 0.95, blossomColor: 0x52c45a, flowerColor: 0xffd93d, spawnBounce: false });
    if (ch3St.steps.oasisRevived) oasisTree.revive(true);

    /* 3 Đài Gương Mặt Trời quanh sa mạc (đốt bóng tối bằng ☀️ -> bắn 3 tia laser vàng lên đỉnh Kim Tự Tháp!) */
    var mirrorCoords = [[-34, 25], [32, 4], [-27, -25]];
    var mirrors = mirrorCoords.map(function (c, i) {
      var mr = MAY.buildSolarMirror(ctx, c[0], c[1], pyrPeak);
      if (ch3St.steps["mir" + i]) mr.activate(true);
      return mr;
    });

    // Each reflected guide ray can be turned through distinct bearings. The
    // golden sun receiver is the goal; blue moons are decoys, not switches.
    var mirrorSlots = [4, 6, 8], mirrorAnswers = [1, 3, 6];
    var mirrorPuzzles = mirrors.map(function (mr, idx) {
      var slots = mirrorSlots[idx], answer = mirrorAnswers[idx], distance = 9;
      var saved = Number(ch3St.steps["mirrorAim" + idx]);
      var aim = Number.isInteger(saved) && saved >= 0 && saved < slots ? saved : 0;
      var guide = new THREE.Group(); ctx.add(guide);
      var beamMat = new THREE.MeshBasicMaterial({ color: 0xffdf62, transparent: true, opacity: 0.9, depthWrite: false });
      var preview = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, distance, 8), beamMat); guide.add(preview);
      var endpoint = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), beamMat); guide.add(endpoint);
      var receivers = [];
      function bearing(slot) { return slot * Math.PI * 2 / slots; }
      function groundPoint(slot) {
        var a = bearing(slot), x = mr.pos.x + Math.sin(a) * distance, z = mr.pos.z + Math.cos(a) * distance;
        return new THREE.Vector3(x, ctx.groundH(x, z), z);
      }
      var decoys = idx === 0 ? [(answer + 2) % slots] : idx === 1 ? [(answer + 1) % slots, (answer + 4) % slots] : [(answer + 1) % slots, (answer + 3) % slots, (answer + 5) % slots];
      [answer].concat(decoys).forEach(function (slot) {
        var pt = groundPoint(slot), correct = slot === answer, receiver = new THREE.Group(); receiver.position.copy(pt);
        var plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.5, 10), new THREE.MeshStandardMaterial({ color: correct ? 0xc68d37 : 0x55708d, roughness: 0.8 }));
        plinth.position.y = 0.25; receiver.add(plinth);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.10, 6, 16), new THREE.MeshBasicMaterial({ color: correct ? 0xffd33d : 0x75a9d0 }));
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.53; receiver.add(ring);
        var icon = MAY.makeLabel(correct ? "☀️ ĐÍCH NẮNG" : "🌙", { sx: correct ? 2.8 : 1.0, sy: 0.65, bg: "rgba(28,31,48,.84)" });
        icon.position.y = 1.55; receiver.add(icon); ctx.trackLabel(icon, 24, correct ? 2 : 0);
        ctx.add(receiver); receivers.push({ group: receiver, ring: ring, correct: correct });
      });
      // The existing dark cover conceals the reflecting face. Reveal it while
      // adjusting, then keep the original solved beam to the pyramid.
      var dish = mr.group.children[1], cover = mr.group.children[2];
      if (!mr.lit && cover) cover.visible = false;
      var control = {
        obj: mr.group, label: "Xoay gương (T / Enter)",
        isActive: function () { return ch3St.stage >= 2 && !ch3St.steps["mir" + idx]; },
        onInteract: function () {
          if (!control.isActive()) return;
          aim = (aim + 1) % slots; ch3St.steps["mirrorAim" + idx] = aim; MAY.persist(); sync();
          MAY.toast(aim === answer ? "☀️ Tia đã chạm đích nắng! Dùng Tia Nắng (3+R) vào gương." : "🔄 Xoay tiếp để tia vàng chạm vòng ☀️; vòng 🌙 là hướng sai.");
        }
      };
      ctx.interactives.push(control);
      function sync() {
        var active = ch3St.stage >= 2 && !ch3St.steps["mir" + idx];
        guide.visible = active;
        var start = new THREE.Vector3(mr.pos.x, ctx.groundH(mr.pos.x, mr.pos.z) + 0.18, mr.pos.z);
        var end = groundPoint(aim).add(new THREE.Vector3(0, 0.55, 0));
        var delta = end.clone().sub(start); preview.position.copy(start).add(end).multiplyScalar(0.5);
        preview.scale.y = delta.length() / distance;
        preview.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
        endpoint.position.copy(end);
        if (dish && active) dish.rotation.set(0, bearing(aim), 0);
        receivers.forEach(function (r) { r.group.visible = ch3St.stage >= 2; r.ring.material.color.setHex(r.correct && ch3St.steps["mir" + idx] ? 0x67ef9b : r.correct ? 0xffd33d : 0x75a9d0); });
      }
      sync();
      return { aligned: function () { return aim === answer; }, sync: sync, dish: dish };
    });

    /* 4 Bọ Cạp Cát Xám canh giữ các Đài Gương */
    if (!ch3St.bossDown) {
      [[-26, 14], [26, 8], [-14, -26], [16, -24]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l3_scorp_" + i, kind: "sandscorpion", name: "Bọ Cạp Cát Xám", pos: ep, weakSpell: "solar", speed: 3.6, patrolR: 7 });
      });
    }

    /* TRÙM CHƯƠNG 3: 🦂 Bọ Cạp Sa Mạc Khổng Lồ */
    var scorpBossMesh = MAY.makeMonsterMesh("sandscorpion", 2.45);
    var ch3Npc;
    var ch3Boss = ctx.setBoss({
      name: "Bọ Cạp Sa Mạc Khổng Lồ", icon: "🦂",
      pos: new THREE.Vector3(0, ctx.groundH(0, -22), -22), arenaR: 26, maxHp: 3, mesh: scorpBossMesh,
      startActive: ch3St.stage === 3 && !ch3St.bossDown,
      tipFn: function () { return "💡 Né vệt cát đỏ khi Bọ Cạp lao tới rồi tung ☀️ Tia Nắng Rực Rỡ (Phím 3 + R) làm vỡ giáp cát!"; },
      onTick: function (dt, t, bs) {
        var ang = Math.atan2(MAY.player.pos.x - bs.pos.x, MAY.player.pos.z - bs.pos.z);
        bs.mesh.rotation.y = ang + Math.PI;
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 34) {
          bs.atkT = 3.2;
          var targetP = MAY.player.pos.clone();
          targetP.y = ctx.groundH(targetP.x, targetP.z);
          MAY.VFX.spawnTelegraph(targetP, 4.2, 1.0, 0xff9f1c);
          MAY.toast("🦂 Bọ Cạp đang lặn cát lao tới vị trí Mây đứng! Chạy né khỏi vòng cam!");
          ctx.scheduleEvent(1.0, function () {
            if (!bs.active || bs.defeated) return;
            bs.pos.set(targetP.x, targetP.y, targetP.z);
            MAY.burstAt(bs.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xeec882, 20);
            if (MAY.player.pos.distanceTo(bs.pos) < 4.2) {
              MAY.damagePlayer(1, bs.pos, "Bọ Cạp trồi lên từ cát! Dùng ☀️ Tia Nắng làm chói mắt nó!");
            }
          });
        }
      },
      onSpellHit: function (spellId, castPos, bs) {
        if (spellId === "solar") {
          bs.damage("☀️ Tia Nắng Rực Rỡ nổ chói làm vỡ tan lớp giáp cát của Bọ Cạp!");
        } else {
          MAY.toast("💡 Lớp giáp cát rất cứng! Hãy dùng ☀️ Tia Nắng Rực Rỡ (Phím 3 + R) làm chói mắt vỡ giáp!");
        }
      },
      onDefeat: function () {
        ch3St.stage = 4; MAY.persist();
        ch3Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI GẶP LẠC ĐÀ KIKI NHẬN 🟡 NGỌC VÀNG NẮNG!", ch3Npc.pos);
        MAY.toast("☀️ Bão cát tan biến! Quay về gặp Lạc Đà Kiki (★) nhận thưởng!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    // The expedition is part of the main story. Old saves already at the boss
    // retain their progress; each new checkpoint is stored by the journey.
    var ch3LegacyBoss = ch3St.stage >= 3 || ch3St.bossDown || ch3St.rewarded || ctx.save.gem;
    var expedition = MAY.createChapterJourney(ctx, {
      title: "Đường ánh sáng", entry: [0, ctx.groundH(0, -18), -18], color: 0xffd35a,
      clearing: {
        section: 2, name: "Đài đổi hướng bão", brief: "Đi tới từng gương, nối tia qua gương thứ hai rồi hướng tới tháp trống.",
        devices: [
          {id:"sun",name:"Hải đăng",x:0,z:-28,form:"lamp",color:0xffe16a},
          {id:"first",name:"Gương đầu",x:0,z:-14,form:"mirror",color:0xffd774},
          {id:"relay",name:"Gương chuyển",x:12,z:-14,form:"mirror",color:0xffd774},
          {id:"castle",name:"Lâu đài có Bé Gió",x:-15,z:-28,form:"tower",color:0x9783a7},
          {id:"empty",name:"Tháp trống",x:17,z:-29,form:"tower",color:0xd5a76a}
        ],
        hint:function(v){return !v.first ? "Xoay gương đầu để tia tới gương chuyển." : !v.relay ? "Tới gương chuyển, đổi tia khỏi lâu đài." : "Tia đã tới tháp trống; bão rời lâu đài.";},
        action:function(id,v){
          if(id==="first") {v.first=!v.first;return {text:v.first?"Tia tới gương chuyển.":"Tia lại hướng về lâu đài; hãy xoay gương.",done:false};}
          if(id==="relay") {if(!v.first)return {text:"Gương này chưa nhận tia. Hãy nối gương đầu trước.",done:false};v.relay=!v.relay;return {text:v.relay?"Tia tới tháp trống, bão rời Bé Gió!":"Tia hướng về lâu đài; xoay lại để bảo vệ Bé Gió.",done:!!v.relay};}
          return {text:"Theo tia từ hải đăng tới gương, rồi chuyển nó khỏi lâu đài.",done:false};
        },
        look:function(id,v){return {lit:id==="sun" || id==="first" || (id==="relay"&&!!v.first) || (id==="empty"&&!!v.first&&!!v.relay) || (id==="castle"&&(!v.first||!v.relay)),angle:id==="first"?(v.first?Math.PI/2:-Math.PI/2):id==="relay"?(v.relay?Math.PI: -Math.PI/2):0};},
        links:function(v){var a=[["sun","first",0xffe275]];a.push(["first",v.first?"relay":"castle",0xffe275]);if(v.first)a.push(["relay",v.relay?"empty":"castle",0xffe275]);return a;}
      },
      sections: [
        { name: "Sân gương", brief: "Chỉnh gương đưa tia tới vòng nắng.", landmark: "Sân gương mặt trời", length: 690, sky: 0xe8b86e, ground: 0xc89455, path: 0xe8ca8b, scenery: "pyramid", events: [
          {at:0.08,kind:"align",slots:4,answer:2,initial:0,cue:"Xoay gương tới vòng nắng",success:"Tia nối tới sân tiếp theo."},
          {at:0.18,kind:"pass",lane:-1,cue:"Đi bên trái vào bóng cột",success:"Mây đi qua vùng râm."},
          {at:0.28,kind:"cast",spell:"solar",cue:"Dùng Nắng thắp đĩa mặt trời",success:"Đĩa sáng chỉ đường."},
          {at:0.38,kind:"align",slots:4,answer:1,initial:3,cue:"Theo tia tới vòng nắng",success:"Gương đã nối đúng."},
          {at:0.49,kind:"pass",lane:1,cue:"Cát xoáy trái, đi bên phải",success:"Mây tránh cát xoáy."},
          {at:0.59,kind:"switch",choices:["Vòng nắng", "Vòng trăng"],answer:0,cue:"Đích nào nhận ánh sáng vàng?",wrong:"Vòng trăng không nhận tia vàng. Hãy tìm vòng nắng.",success:"Vòng nắng mở lối."},
          {at:0.70,kind:"align",slots:4,answer:3,initial:0,cue:"Chỉnh tia qua cổng",success:"Cổng gương sáng."},
          {at:0.81,kind:"cast",spell:"solar",cue:"Thắp dấu nắng trên cổng",success:"Ánh sáng lan vào kim tự tháp."},
          {at:0.92,kind:"pass",lane:0,cue:"Đi giữa vào bóng râm",success:"Mây tới cửa tháp."}
        ]},
        { name: "Đường sáng kim tự tháp", brief: "Theo tia qua các phòng và sửa gương.", landmark: "Phòng tia sáng", length: 710, sky: 0xa16b4e, ground: 0x986d4c, path: 0xc3a476, scenery: "pyramid", events: [
          {at:0.08,kind:"align",slots:4,answer:1,initial:0,cue:"Đưa tia tới vòng bên phòng đầu",success:"Phòng thứ nhất sáng."},
          {at:0.18,kind:"cast",spell:"solar",cue:"Đánh thức đĩa nắng",success:"Một tia mới hiện ra."},
          {at:0.28,kind:"pass",lane:1,cue:"Bậc đá bên phải còn nguyên",success:"Mây bước qua bậc đá."},
          {at:0.38,kind:"align",slots:4,answer:2,initial:0,cue:"Xoay gương nối hai phòng",success:"Tia nối hai phòng."},
          {at:0.48,kind:"switch",choices:["Theo tia vàng", "Theo bóng tối"],answer:0,cue:"Cửa nào được tia chỉ tới?",wrong:"Bóng tối không dẫn tia tới cửa.",success:"Cửa được chiếu sáng mở ra."},
          {at:0.58,kind:"pass",lane:-1,cue:"Chọn lối trái tránh cột đổ",success:"Mây qua cột đổ."},
          {at:0.68,kind:"align",slots:4,answer:3,initial:1,cue:"Đưa tia lên đích trên tường",success:"Tường hiện bản đồ bầu trời."},
          {at:0.78,kind:"cast",spell:"solar",cue:"Chiếu sáng bản đồ",success:"Đài quan sát hiện ra."},
          {at:0.89,kind:"pass",lane:0,cue:"Đi giữa hai hàng cột",success:"Mây ra khỏi tháp."}
        ]},
        { name: "Đài quan sát", brief: "Nhìn tín hiệu của Bé Gió và hướng bão.", landmark: "Đài quan sát sao", length: 700, sky: 0x85799a, ground: 0xa88c72, path: 0xd6bd91, scenery: "observatory", events: [
          {at:0.08,kind:"align",slots:4,answer:2,initial:1,cue:"Chỉnh kính tới hải đăng",success:"Hải đăng lóe sáng phía xa."},
          {at:0.18,kind:"echo",pattern:[0,0,2],cue:"Bé Gió đáp hai ngắn, một dài. Gõ lại!",success:"Mây nhận ra lời chờ tớ."},
          {at:0.28,kind:"pass",lane:-1,cue:"Theo bóng tia xuống lối trái",success:"Mây thấy bóng bão tiến về lâu đài."},
          {at:0.38,kind:"switch",choices:["Lâu đài có người trú", "Tháp trống"],answer:1,cue:"Bão theo ánh sáng. Dẫn tới đâu?",wrong:"Tia hướng về lâu đài kéo bão tới nơi Bé Gió đang trú! Hãy đổi hướng.",success:"Tháp trống ở xa những người bạn."},
          {at:0.48,kind:"align",slots:4,answer:1,initial:3,cue:"Tách tia khỏi lâu đài, hướng tới tháp trống",success:"Tia rời nơi Bé Gió trú."},
          {at:0.58,kind:"pass",lane:1,cue:"Bão ở trái, tránh sang phải",success:"Mây tránh luồng cát."},
          {at:0.68,kind:"cast",spell:"solar",cue:"Dùng Nắng giữ tia trên tháp trống",success:"Tia đã ổn định."},
          {at:0.78,kind:"echo",pattern:[0,0,2],cue:"Gửi lại lời chờ tớ",success:"Bé Gió thấy tín hiệu."},
          {at:0.89,kind:"align",slots:4,answer:2,initial:0,cue:"Nối gương tới tháp đón bão",success:"Đường sáng đã đổi hướng."}
        ]},
        { name: "Tháp đón bão", brief: "Giữ đường dẫn bão ổn định và báo lối an toàn.", landmark: "Tháp đón bão", length: 710, sky: 0x726574, ground: 0xa48462, path: 0xe4bf79, scenery: "observatory", events: [
          {at:0.08,kind:"pass",lane:1,cue:"Cát xoáy trái, tránh sang phải",success:"Mây tránh bão."},
          {at:0.18,kind:"align",slots:4,answer:3,initial:0,cue:"Chỉnh gương giữ đường dẫn đã đổi hướng",success:"Tia tiếp tục dẫn bão tới tháp trống."},
          {at:0.28,kind:"cast",spell:"solar",cue:"Thắp dấu cảnh báo trên đường bão",success:"Dấu cảnh báo sáng lên."},
          {at:0.38,kind:"pass",lane:-1,cue:"Tìm vùng khuất gió bên trái",success:"Mây tới chỗ khuất gió."},
          {at:0.48,kind:"switch",choices:["Giữ lối trú được đánh dấu", "Tắt dấu cảnh báo"],answer:0,cue:"Làm sao để mọi người nhận ra lối trú?",wrong:"Tắt dấu khiến lối trú khó thấy. Hãy giữ dấu sáng.",success:"Lối trú đã được đánh dấu."},
          {at:0.58,kind:"align",slots:4,answer:2,initial:1,cue:"Chỉnh gương dự phòng khi gió đổi",success:"Gương dự phòng giữ đường dẫn ổn định."},
          {at:0.68,kind:"pass",lane:0,cue:"Lối giữa đã khuất cát",success:"Mây qua cơn gió."},
          {at:0.78,kind:"cast",spell:"solar",cue:"Thắp đèn báo lối trú cuối cùng",success:"Đường trú hiện rõ phía trước."},
          {at:0.89,kind:"echo",pattern:[0,0,2],cue:"Báo cho Bé Gió lối trú đã sáng",success:"Bé Gió thấy dấu báo lối trú."}
        ]}
      ],
      makeVista: function (i, state) {
        var g = new THREE.Group();
        var sandstone = new THREE.MeshStandardMaterial({color:0xb78a5d,roughness:0.9});
        var gold = new THREE.MeshBasicMaterial({color:0xffdc67});
        function box(w,h,d,x,y,z,mat) { var m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); g.add(m); return m; }
        if (i === 0) {
          [-1,1].forEach(function(side) { for (var z=-15; z>=-65; z-=18) { box(2,8,2,side*11,4,z,sandstone); box(3,0.8,3,side*11,8,z,gold); } });
        }
        if (i === 1) {
          // A roof and paired pillars turn this stretch into connected chambers.
          box(29,1,75,0,10,-32,sandstone);
          [-1,1].forEach(function(side) { for(var z=-8;z>=-68;z-=15) { box(2,10,2,side*12,5,z,sandstone); box(5,1,2,side*10,9,z,gold); } });
        }
        if (i >= 2) {
          var towerMat = new THREE.MeshStandardMaterial({color:0xc1a072,roughness:0.8});
          // The lighthouse projects toward the castle until Mây redirects it.
          box(4,11,4,0,5.5,-48,towerMat); box(5,1,5,0,11,-48,gold);
          [-1,1].forEach(function(side) { box(7,6,5,side*10,3,-35,towerMat); box(2,10,2,side*13,5,-35,towerMat); box(2,10,2,side*7,5,-35,towerMat); });
          var castleLabel=MAY.makeLabel("LÂU ĐÀI · BÉ GIÓ",{sx:5,sy:1,bg:"rgba(25,25,40,.9)"}); castleLabel.position.set(-4,6,-23); g.add(castleLabel);
          var emptyLabel=MAY.makeLabel("THÁP TRỐNG",{sx:5,sy:1,bg:"rgba(25,25,40,.9)"}); emptyLabel.position.set(4,6,-23); g.add(emptyLabel);
          var storm=new THREE.Group();
          var cloudMat=new THREE.MeshStandardMaterial({color:0x51485e,roughness:1});
          [-2,0,2].forEach(function(x) { var cloud=new THREE.Mesh(new THREE.SphereGeometry(2.4,9,6),cloudMat); cloud.position.set(x,0,0); storm.add(cloud); });
          var bolt=new THREE.Mesh(new THREE.ConeGeometry(0.5,5,4),gold); bolt.position.y=-3.2; bolt.rotation.z=0.25; storm.add(bolt); g.add(storm);
          var beam=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,1,8),new THREE.MeshBasicMaterial({color:0xffe87b,transparent:true,opacity:0.85})); g.add(beam);
          return {group:g,tick:function(distance,lateral,eventIndex,time) {
            var redirected=i===3 || eventIndex>=5;
            var target=new THREE.Vector3(redirected?10:-10,9,-35), source=new THREE.Vector3(0,11,-48), delta=target.clone().sub(source);
            beam.position.copy(source).add(target).multiplyScalar(0.5); beam.scale.y=delta.length(); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
            storm.position.set(target.x+Math.sin(time)*0.7,16,target.z); bolt.visible=Math.sin(time*4)>0;
          }};
        }
        return {group:g,tick:function(){}};
      },
      makeLandmark: function (i) {
        var g = new THREE.Group();
        var stone = new THREE.MeshStandardMaterial({color:i < 2 ? 0xc8995c : 0x8d7990, roughness:0.85});
        var gold = new THREE.MeshBasicMaterial({color:0xffdc67});
        if (i < 2) {
          var pyramid = new THREE.Mesh(new THREE.ConeGeometry(5.5, 7, 4), stone); pyramid.rotation.y = Math.PI / 4; pyramid.position.y = 3.5; g.add(pyramid);
          var sun = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.17, 8, 20), gold); sun.position.set(0,4,4); g.add(sun);
        } else {
          var tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 7, 8), stone); tower.position.y = 3.5; g.add(tower);
          var ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.18, 8, 24), gold); ring.position.y = 6; g.add(ring);
        }
        return g;
      },
      onComplete: function () { updateCh3Story(); }
    });

    function updateCh3Story() {
      mirrorPuzzles.forEach(function (puzzle) { puzzle.sync(); });
      if (ch3St.rewarded || ctx.save.gem) {
        ch3Npc.setMarker("♥");
        ctx.setObjective("🟡", "SA MẠC ĐÃ RỰC NẮNG — SANG CHƯƠNG 4 HANG PHA LÊ (PHÍM M)", null);
        return;
      }
      if (ch3St.bossDown) {
        ch3Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI GẶP LẠC ĐÀ KIKI NHẬN 🟡 NGỌC VÀNG NẮNG!", ch3Npc.pos);
        return;
      }
      if (ch3St.stage === 0) {
        ch3Npc.setMarker("!");
        ctx.setObjective("💬", "TRÒ CHUYỆN VỚI LẠC ĐÀ KIKI BÊN ỐC ĐẢO (!)", ch3Npc.pos);
        return;
      }
      if (!ch3St.steps.oasisRevived) {
        ch3Npc.setMarker("?");
        ctx.setObjective("🌿", "DÙNG 🌿 NỞ HOA (2+R) HỒI SINH CÂY CHÀ LÀ ỐC ĐẢO", oasisTree.pos);
        return;
      }
      if (ch3St.stage < 2) {
        ch3Npc.setMarker("!");
        ctx.setObjective("💬", "QUAY LẠI LẠC ĐÀ KIKI NHẬN PHÉP ☀️ TIA NẮNG (!)", ch3Npc.pos);
        return;
      }
      var litCount = 0;
      for (var i = 0; i < 3; i++) if (ch3St.steps["mir" + i]) litCount++;
      if (litCount < 3) {
        ch3Npc.setMarker("?");
        var nextM = mirrors[0].pos;
        for (var j = 0; j < 3; j++) if (!ch3St.steps["mir" + j]) { nextM = mirrors[j].pos; break; }
        ctx.setObjective("☀️", "XOAY GƯƠNG ĐẾN ĐÍCH ☀️, RỒI DÙNG TIA NẮNG (" + litCount + "/3)", nextM);
      } else {
        if (!ch3LegacyBoss && expedition.block()) return;
        ch3St.stage = 3; MAY.persist();
        if (darkSeal.visible) {
          darkSeal.visible = false;
          MAY.VFX.spawnShatterBurst(pyrPeak, 0xffd93d);
          MAY.sndShatter(pyrPeak);
        }
        ch3Npc.setMarker("?");
        if (!ch3Boss.active) {
          ch3Boss.activate(function () {
            MAY.openDialogue({
              name: ch3Sc.npcName, role: ch3Sc.npcRole, icon: ch3Sc.npcIcon, color: ch3Sc.npcColor,
              pages: ch3Sc.bossIntro, endBtn: "🦂 Chiến đấu với Bọ Cạp Sa Mạc!", voiceClip: "boss_appear"
            });
          });
        }
        ctx.setObjective("🦂", "DÙNG ☀️ TIA NẮNG ĐÁNH BẠI BỌ CẠP SA MẠC!", ch3Boss.pos);
      }
    }

    ctx.addSkillTarget({
      id: "l3_oasis", pos: oasisTree.pos, radius: 8.5, reqSpell: "growth",
      hint: "🌿 Hồi sinh Cây Chà Là Ốc Đảo!", done: !!ch3St.steps.oasisRevived,
      isActive: function () { return ch3St.stage >= 1 && !ch3St.steps.oasisRevived; },
      onHit: function (sp, tg) {
        ch3St.steps.oasisRevived = true; MAY.persist();
        oasisTree.revive(false);
        tg.markDone();
        MAY.toast("🌴 Ốc Đảo xanh mát làm lộ Đĩa Mặt Trời Cổ! Quay lại gặp Lạc Đà Kiki nhận ☀️ Tia Nắng!", "Kỳ diệu quá! Cây cổ thụ đã hồi sinh nở hoa rực rỡ rồi!");
        updateCh3Story();
      }
    });

    mirrors.forEach(function (mr, idx) {
      ctx.addSkillTarget({
        id: "l3_mir_" + idx, pos: mr.pos, radius: 9.0, reqSpell: "solar",
        hint: "🔄 Xoay gương (T / Enter) → ☀️ Tia Nắng", done: !!ch3St.steps["mir" + idx],
        isActive: function () { return ch3St.stage >= 2 && !ch3St.steps["mir" + idx]; },
        onHit: function (sp, tg) {
          if (!mirrorPuzzles[idx].aligned()) {
            MAY.toast("🔄 Tia chưa chạm vòng ☀️! Đến gần và xoay gương bằng T / Enter hoặc chạm nút.");
            return;
          }
          ch3St.steps["mir" + idx] = true; MAY.persist();
          if (mirrorPuzzles[idx].dish) mirrorPuzzles[idx].dish.lookAt(pyrPeak);
          mr.activate(false);
          tg.markDone();
          MAY.toast("☀️ Đài Gương " + (idx + 1) + "/3 bắn tia nắng vàng rực lên đỉnh Kim Tự Tháp!", "Đài Gương Mặt Trời đã sáng rực, bắn tia nắng vàng thẳng lên Kim Tự Tháp!");
          updateCh3Story();
        }
      });
    });

    ch3Npc = ctx.addQuestNPC({
      kind: "camel", name: ch3Sc.npcName, icon: ch3Sc.npcIcon,
      pos: [6, 35], rotY: 0, scale: 1.15, labelY: 2.8, autoGreet: ch3St.stage === 0,
      onTalk: function () {
        if (ch3St.rewarded || ctx.save.gem) {
          MAY.openDialogue({ name: ch3Sc.npcName, role: ch3Sc.npcRole, icon: ch3Sc.npcIcon, color: ch3Sc.npcColor, pages: ch3Sc.complete, endBtn: "💎 Tới Chương 4: Hang Pha Lê", onDone: function () { MAY.enterLevel("level4"); } });
        } else if (ch3St.bossDown) {
          MAY.openDialogue({
            name: ch3Sc.npcName, role: ch3Sc.npcRole, icon: ch3Sc.npcIcon, color: ch3Sc.npcColor,
            pages: ch3Sc.reward, endBtn: ch3Sc.rewardBtn, voiceClip: "gem_win",
            onDone: function () { ch3St.rewarded = true; MAY.persist(); updateCh3Story(); ctx.awardGem(); }
          });
        } else if (ch3St.stage === 0) {
          MAY.openDialogue({
            name: ch3Sc.npcName, role: ch3Sc.npcRole, icon: ch3Sc.npcIcon, color: ch3Sc.npcColor,
            pages: ch3Sc.intro, endBtn: ch3Sc.introBtn, voiceClip: "npc_ch3",
            onDone: function () {
              ch3St.stage = 1; MAY.persist();
              if (!MAY.isSpellUnlocked("growth")) MAY.unlockSpell("growth", true);
              updateCh3Story();
            }
          });
        } else if (ch3St.steps.oasisRevived && ch3St.stage < 2) {
          MAY.openDialogue({
            name: ch3Sc.npcName, role: ch3Sc.npcRole, icon: ch3Sc.npcIcon, color: ch3Sc.npcColor,
            pages: ch3Sc.stage2GiveSkill, endBtn: ch3Sc.stage2Btn,
            onDone: function () {
              ch3St.stage = 2; MAY.persist();
              MAY.unlockSpell("solar");
              updateCh3Story();
            }
          });
        } else {
          MAY.openDialogue({ name: ch3Sc.npcName, role: ch3Sc.npcRole, icon: ch3Sc.npcIcon, color: ch3Sc.npcColor, pages: ch3Sc.inProgress, endBtn: "☀️ Đi thắp Đài Gương!" });
        }
      }
    });
    updateCh3Story();

    /* ---- Nhiệm Vụ Phụ Tương Tác Chương 3: Bí Ẩn Đồng Hồ Mặt Trời Cổ ---- */
    ctx.setupSideQuest({
      npcPos: [-12, 34], npcRotY: 0.5, npcScale: 1.2, labelY: 2.0,
      tasks: [
        { id: "gnomon",  kind: "gnomon",  label: "Tìm Kim Vàng ven Ốc Đảo",        pos: [-11, 18], color: 0xffd93d },
        { id: "shadow1", kind: "beacon",  label: "Phủi cát Cột Đo Bóng Tây Bắc",   pos: [-46, 4],  color: 0xfacc15 },
        { id: "sundial", kind: "sundial", label: "Lắp Đồng Hồ Mặt Trời ở Tàn Tích", pos: [-40, 12], color: 0xff9f1c, finalOnly: true }
      ]
    });

    ctx.onUpdate = function (dt, t) {
      oasisTree.update(dt);
      if (darkSeal.visible) { darkSeal.rotation.y += dt * 1.4; darkSeal.rotation.x += dt * 0.8; }
      oasisFish.forEach(function (of) {
        of.a += dt * 0.55;
        of.g.position.set(OAS.x + Math.cos(of.a) * of.r, -1.2, OAS.z + Math.sin(of.a) * of.r);
        of.g.rotation.y = -of.a - Math.PI / 2;
      });
    };

    MAY.player.spawnAt(0, ctx.groundH(0, 44) + 1.05, 44, 0, false);
    return ctx;
  };

})(window.MAY);
