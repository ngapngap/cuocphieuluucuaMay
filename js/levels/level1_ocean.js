"use strict";
/* ============================================================================
   MÀN 1 — VỊNH SAN HÔ XANH (Dưới nước — Viên Ngọc Xanh Dương 🔵)
   Phong cách thực tế Ảnh 2 & Ảnh 3: Snell's Window, Caustics thế giới 3D,
   Bờ kè đá ven vịnh, Tàu đắm, Rừng san hô, Đàn cá 140 con & 15 mô hình GLB
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  function wrapAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
  function turnTo(cur, target, maxStep) {
    var d = wrapAngle(target - cur);
    if (d > maxStep) d = maxStep; else if (d < -maxStep) d = -maxStep;
    return cur + d;
  }

  MAY.LEVELS.level1 = function () {
    var ctx = MAY.createWorldCtx("level1");
    ctx.mode = "underwater";
    ctx.waterLevel = 14.0;
    ctx.worldRadius = 108;
    ctx.minY = 1.6;
    ctx.minimapBg = "rgba(5,66,94,0.92)";

    MAY.setSunOffset(24, 48, 14);
    MAY.sun.color.setHex(0xffefc8);
    MAY.sun.intensity = 1.85;
    MAY.hemiLight.color.setHex(0x88e8ff);
    MAY.hemiLight.groundColor.setHex(0x063d56);
    MAY.hemiLight.intensity = 0.65;
    MAY.diveLight.intensity = 0.95;
    MAY.diveLight.color.setHex(0xc8f4ff);
    MAY.diveLight.castShadow = false;
    MAY.setAmbientTone(360, 0.052, "level1");
    MAY.setPostGrade({ tint: 0xf4feff, vignette: 0.28, bloom: 0.36, ssao: 0.54 });
    ctx.getSurface = function () { return "sand"; };

    ctx.underwaterFog = { color: 0x065c78, density: 0.0175 };
    ctx.landFog = { color: 0x9ed8f2, density: 0.0045 };
    MAY.scene.fog = new THREE.FogExp2(ctx.underwaterFog.color, ctx.underwaterFog.density);
    MAY.scene.background = new THREE.Color(ctx.underwaterFog.color);

    ctx.addSky({
      zenith: 0x1668b8, horizon: 0x9fdcf5, ground: 0x043d58,
      sunDir: new THREE.Vector3(24, 48, 14), sunColor: 0xfff5d0, cloudAmt: 0.48
    });

    /* Bờ bãi phía Nam nhô lên khỏi mặt nước (nơi có bến đá & thuyền lặn giống ảnh 2-3) */
    var SHORE = { x: 0, z: 96, r: 22 };
    function shoreH(x, z) {
      var d = Math.hypot(x - SHORE.x, z - SHORE.z);
      if (d >= SHORE.r) return 0;
      if (d <= 9.5) return 15.8;
      var t = (d - 9.5) / (SHORE.r - 9.5);
      var sm = t * t * (3 - 2 * t);
      return 15.8 * (1 - sm);
    }

    ctx.groundH = function (x, z) {
      var d = Math.hypot(x, z);
      var h = Math.sin(x * 0.075) * Math.cos(z * 0.068) * 1.15 +
              Math.sin(x * 0.21 + 1.4) * Math.cos(z * 0.18 + 0.5) * 0.42 +
              Math.sin((x + z) * 0.04) * 0.65;
      if (d < 12) h *= d / 12;
      /* Dải đá ngầm phía Đông gợi nhớ thềm đá lớn bên phải ảnh 2 */
      var ledgeD = Math.hypot((x - 28) * 0.75, (z - 12) * 0.5);
      if (ledgeD < 14) h += (1 - ledgeD / 14) * 2.6;
      var sh = shoreH(x, z);
      if (sh > 0) h = Math.max(h, sh);
      return h;
    };

    /* Đáy cát gợn sóng 128x128 mịn tự nhiên có Normal Map dịu + Caustics ánh nắng loang */
    var floorMat = new THREE.MeshStandardMaterial({
      map: MAY.TEX.sand,
      normalMap: MAY.PBR.sandRipple.normalMap,
      normalScale: new THREE.Vector2(0.36, 0.36),
      roughnessMap: MAY.PBR.sandRipple.roughnessMap,
      roughness: 0.90
    });
    MAY.applyCaustics(floorMat, 14.0, 0.78);
    ctx.buildTerrain(250, 128, floorMat);

    /* Mặt biển Gerstner 2 chiều (Snell's Window ngọc lam từ dưới lên + phản chiếu mây từ trên xuống) */
    ctx.addWater({
      width: 280, height: 280, segs: 88, y: 14.0,
      sunDir: new THREE.Vector3(24, 48, 14),
      deepColor: 0x04324e, shallowColor: 0x168ea8, skyColor: 0xa2dcf5,
      foamCenter: new THREE.Vector3(SHORE.x, 14.0, SHORE.z), foamRadius: 15.5, waveAmp: 0.20,
      underFogColor: 0x065c78, underFogDensity: 0.0175
    });

    /* Tia nắng khối xuyên xuống đáy biển */
    var rayMat = MAY.makeGodRayMat(0xb8f6ff, 0.22);
    for (var ri = 0; ri < 12; ri++) {
      var ray = new THREE.Mesh(new THREE.ConeGeometry(2.2 + (ri % 4) * 0.8, 30, 12, 1, true), rayMat);
      ray.position.set(-64 + ri * 12.5, 8.5, -48 + (ri % 4) * 26);
      ray.rotation.z = 0.22;
      ctx.add(ray);
    }

    /* Tuyết biển (marine snow) lơ lửng chân thực */
    ctx.addAmbientParticles({ count: 420, spread: 110, minY: 0.6, maxY: 13.6, vy: -0.28, color: 0xdaf8ff, size: 0.13, opacity: 0.55 });

    /* Vật liệu đá ngầm, kè đá & gỗ tàu đắm đều có Normal/Roughness + Caustics */
    var rockMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.rock, roughness: 0.88 });
    MAY.attachPhotoPBR("rock", MAY.TEX.rock, [rockMat], { rx: 3, ry: 3, normalStrength: 3.6, rMin: 0.42, rMax: 0.94 });
    MAY.applyCaustics(rockMat, 14.0, 0.72);

    var wallMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap,
      normalScale: new THREE.Vector2(1.4, 1.4), roughnessMap: MAY.PBR.stoneWall.roughnessMap, roughness: 0.82
    });
    MAY.applyCaustics(wallMat, 14.0, 0.68);

    var woodMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, roughness: 0.9 });
    MAY.attachPhotoPBR("wood", MAY.TEX.wood, [woodMat], { rx: 2, ry: 2, normalStrength: 3.2, rMin: 0.48, rMax: 0.96 });
    MAY.applyCaustics(woodMat, 14.0, 0.62);

    /* Tường kè đá cảng + Thuyền lặn neo phía Nam (giống ảnh 2 & 3!) */
    var seaWall = new THREE.Mesh(new THREE.BoxGeometry(22, 16.5, 4.5), wallMat);
    seaWall.position.set(16, 7.6, 82); seaWall.rotation.y = -0.25;
    seaWall.castShadow = true; seaWall.receiveShadow = true;
    ctx.add(seaWall);

    var diveBoat = new THREE.Group();
    var bHull = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 7.0), new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: 0x4b3828, roughness: 0.75 }));
    bHull.position.y = 0.25; diveBoat.add(bHull);
    var bCab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.25, 2.8), new THREE.MeshStandardMaterial({ color: 0xf1ece3, roughness: 0.7 }));
    bCab.position.set(0, 1.28, -0.3); diveBoat.add(bCab);
    var bTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 4.0), new THREE.MeshStandardMaterial({ color: 0x264c69, roughness: 0.5 }));
    bTop.position.set(0, 1.98, -0.2); diveBoat.add(bTop);
    diveBoat.position.set(2, 13.9, 75); diveBoat.rotation.y = 0.6;
    diveBoat.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ctx.add(diveBoat);

    /* Cây dừa trên bờ bãi + Cổng về Đảo Mây */
    [[-6, 94, 1.05], [7, 98, 1.0]].forEach(function (p) {
      var pm = MAY.makeRealisticPalm(p[2]);
      pm.position.set(p[0], ctx.groundH(p[0], p[1]) - 0.1, p[1]);
      ctx.add(pm);
    });
    ctx.addPortal([0, 92], "hub", "🏝️ Về Đảo Mây", 0x38bdf8);

    /* Thềm đá ngầm, núi đá xa trong sương & Cổng Đá San Hô cổ */
    for (var rk = 0; rk < 34; rk++) {
      var a = (rk * 2.39996) % 6.28, r = 10 + (rk * 2.65) % 88;
      var rx = Math.cos(a) * r, rz = Math.sin(a) * r;
      if (Math.hypot(rx - SHORE.x, rz - SHORE.z) < 25) continue;
      var rm = new THREE.Mesh(MAY.rockGeo(rk * 1.7 + 0.5), rockMat);
      var sc = 0.9 + (rk % 5) * 0.55;
      rm.scale.set(sc * 1.25, sc * 0.72, sc);
      rm.position.set(rx, ctx.groundH(rx, rz) + sc * 0.3, rz);
      rm.rotation.y = rk * 1.3; rm.castShadow = true; rm.receiveShadow = true;
      ctx.add(rm);
    }
    for (var sp = 0; sp < 8; sp++) {
      var sa = (sp / 8) * Math.PI * 2 + 0.35;
      var sm = new THREE.Mesh(MAY.rockGeo(sp * 2.9), rockMat);
      sm.scale.set(8 + (sp % 3) * 3, 22 + (sp % 4) * 5, 8);
      sm.position.set(Math.cos(sa) * 106, 6, Math.sin(sa) * 106);
      ctx.add(sm);
    }

    /* Cổng đá cổ (-30, 30) — nơi đặt Bệ Ngọc Xanh Dương */
    [-3.4, 3.4].forEach(function (dx) {
      var p = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.6, 2.5), wallMat);
      p.position.set(-30 + dx, ctx.groundH(-30 + dx, 30) + 3.6, 30);
      p.castShadow = true; p.receiveShadow = true; ctx.add(p);
    });
    var archTop = new THREE.Mesh(new THREE.BoxGeometry(10.2, 2.0, 2.6), wallMat);
    archTop.position.set(-30, ctx.groundH(-30, 30) + 8.0, 30);
    archTop.castShadow = true; archTop.receiveShadow = true; ctx.add(archTop);
    ctx.addGemAltar([-30, 30]);

    /* ---- Tàu Đắm Cổ (-60, -40) ---- */
    var wreck = new THREE.Group();
    var hull = new THREE.Mesh(new THREE.BoxGeometry(10.5, 2.4, 3.5), woodMat); hull.position.y = 1.2; hull.rotation.z = 0.12; wreck.add(hull);
    var bow = new THREE.Mesh(new THREE.ConeGeometry(1.75, 3.2, 4), woodMat); bow.rotation.z = -Math.PI / 2; bow.position.set(6.5, 1.2, 0); bow.scale.set(1, 1, 2); wreck.add(bow);
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 7.6, 10), woodMat); mast.position.set(-1, 5.2, 0); mast.rotation.z = 0.24; wreck.add(mast);
    var nest = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.52, 0.55, 10), woodMat); nest.position.set(-1.9, 8.6, 0); wreck.add(nest);
    var sailShape = new THREE.Shape(); sailShape.moveTo(0, 0); sailShape.lineTo(0, 3.6); sailShape.lineTo(2.7, 0.5); sailShape.closePath();
    var sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    sail.position.set(-1.3, 4.7, 0); sail.rotation.y = 0.4; wreck.add(sail);
    var helm = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 16), woodMat); helm.position.set(-3.2, 3.2, 0); helm.rotation.x = -0.5; wreck.add(helm);
    var cannonMat = new THREE.MeshStandardMaterial({ color: 0x262c34, roughness: 0.45, metalness: 0.78 });
    [-1, 1].forEach(function (cs) {
      var cn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.3, 10), cannonMat);
      cn.rotation.z = Math.PI / 2; cn.position.set(0.8, 2.7, cs * 1.0); wreck.add(cn);
    });
    /* Đèn lồng đồng ấm bên trong khoang Tàu Đắm (tương phản ấm/lạnh kiểu The Hall dưới lòng biển!) */
    var wreckLan = MAY.makeCagedLantern(0xffb85c, 3.2, 24, false);
    wreckLan.position.set(-2.2, 3.6, 0); wreck.add(wreckLan);
    wreck.position.set(-60, ctx.groundH(-60, -40), -40); wreck.rotation.y = 0.7; wreck.rotation.z = 0.16;
    wreck.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ctx.add(wreck);

    /* Sỏi san hô & vỏ đá rải đáy biển (1 draw call) + Dải núi ngầm xa chân trời */
    MAY.scatterDebris(ctx, 220, function (x, z) {
      return Math.hypot(x - SHORE.x, z - SHORE.z) > 22;
    }, { spread: 88, size: 0.28, color: 0x7a8a8e });
    MAY.buildVistaRing(ctx, { count: 18, radius: 130, hMin: 18, hMax: 36, wBase: 26, baseY: -4, color: 0x164c62 });

    /* ---- San hô, Rong biển & Vật thể GLB ---- */
    var coralCols = [0xff7fa5, 0xff9f43, 0xc77dff, 0x2ee6a8, 0xff6b6b, 0xffd166];
    var branchCoralGroups = [];
    function makeBranchCoral(color) {
      var g = new THREE.Group();
      g.userData.coralTint = color;
      if (MAY.modelsReady && MAY.MODEL_T.coral) {
        var c = MAY.cloneProp("coral", color, 1.15);
        if (c) { g.add(c); return g; }
      }
      var mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.65 });
      for (var k = 0; k < 5; k++) {
        var a = (k / 5) * Math.PI * 2;
        var br = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.75, 5, 8), mat);
        br.position.set(Math.cos(a) * 0.25, 0.45, Math.sin(a) * 0.25);
        br.rotation.z = Math.cos(a) * 0.45; br.rotation.x = -Math.sin(a) * 0.45;
        br.castShadow = true; g.add(br);
      }
      return g;
    }

    var interactCoralDefs = [];
    for (var ci = 0; ci < 36; ci++) {
      var ca = (ci * 2.1) % 6.28, cr = 12 + (ci * 2.3) % 76;
      var cx = Math.cos(ca) * cr, cz = Math.sin(ca) * cr;
      if (ci < 10) { cx = 40 + (Math.random() - 0.5) * 18; cz = -30 + (Math.random() - 0.5) * 18; }
      if (Math.hypot(cx - SHORE.x, cz - SHORE.z) < 24) continue;
      var col = coralCols[ci % coralCols.length];
      var cg = makeBranchCoral(col);
      cg.scale.setScalar(0.95 + (ci % 4) * 0.35);
      cg.position.set(cx, ctx.groundH(cx, cz), cz);
      cg.rotation.y = ci * 0.9;
      branchCoralGroups.push(cg);
      if (ci < 14) {
        interactCoralDefs.push({
          id: "c" + ci, obj: cg, label: "Chạm vào san hô",
          burstColor: 0x9fe8ff, toastText: "San hô thả bong bóng lung linh!", sayText: "San hô thả bong bóng!"
        });
      } else {
        ctx.add(cg);
      }
    }
    ctx.addInteractProps(interactCoralDefs);

    /* San hô quạt (fanTex + fanAlphaTex) + San hô não (brainTex) + Rong biển đung đưa */
    for (var fi = 0; fi < 10; fi++) {
      var fShape = new THREE.Shape(); fShape.moveTo(0, 0); fShape.absarc(0, 0, 1.25, 0, Math.PI, false); fShape.closePath();
      var fan = new THREE.Mesh(new THREE.ShapeGeometry(fShape, 14),
        new THREE.MeshStandardMaterial({ map: MAY.TEX.fan, alphaMap: MAY.TEX.fanAlpha, alphaTest: 0.4, color: coralCols[fi % coralCols.length], roughness: 0.78, side: THREE.DoubleSide }));
      var fa = fi * 0.65, fr = 16 + (fi % 4) * 16;
      var fx = Math.cos(fa) * fr, fz = Math.sin(fa) * fr;
      fan.position.set(fx, ctx.groundH(fx, fz), fz); fan.rotation.y = fi;
      ctx.add(fan);
    }
    [[38, -36], [48, -28], [-30, 50], [20, 18]].forEach(function (pp) {
      var br = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshStandardMaterial({ map: MAY.TEX.brain, roughness: 0.85 }));
      br.scale.y = 0.72; br.position.set(pp[0], ctx.groundH(pp[0], pp[1]), pp[1]);
      br.castShadow = true; br.receiveShadow = true; ctx.add(br);
    });

    var weeds = [];
    var weedMat = new THREE.MeshStandardMaterial({ color: 0x2a9464, roughness: 0.85, side: THREE.DoubleSide });
    for (var wi = 0; wi < 64; wi++) {
      var wa = wi * 1.9, wr = 8 + (wi * 1.45) % 84;
      var wx = Math.cos(wa) * wr, wz = Math.sin(wa) * wr;
      if (Math.hypot(wx, wz - 8) < 7 || Math.hypot(wx - SHORE.x, wz - SHORE.z) < 24) continue;
      var wh = 1.2 + (wi % 4) * 0.45;
      var bs = new THREE.Shape(); bs.moveTo(-0.26, 0); bs.quadraticCurveTo(-0.3, wh * 0.6, 0, wh); bs.quadraticCurveTo(0.3, wh * 0.6, 0.26, 0); bs.closePath();
      var wm = new THREE.Mesh(new THREE.ShapeGeometry(bs), weedMat);
      wm.position.set(wx, ctx.groundH(wx, wz), wz); wm.rotation.y = wi;
      ctx.add(wm); weeds.push(wm);
    }

    /* Luồng bọt khí phun từ đáy biển */
    var bubbleStreams = [];
    var streamGeo = new THREE.SphereGeometry(0.09, 6, 5);
    var streamMat = new THREE.MeshPhysicalMaterial({ color: 0xdff8ff, roughness: 0.05, clearcoat: 1.0, transparent: true, opacity: 0.6 });
    [[38, -28], [44, -34], [-58, -40], [18, 6]].forEach(function (pp) {
      var bx0 = pp[0], bz0 = pp[1], by0 = ctx.groundH(bx0, bz0) + 0.4;
      for (var bi = 0; bi < 10; bi++) {
        var bm = new THREE.Mesh(streamGeo, streamMat);
        bm.position.set(bx0 + (Math.random() - 0.5) * 0.7, by0 + bi * 1.1, bz0 + (Math.random() - 0.5) * 0.7);
        ctx.add(bm);
        bubbleStreams.push({ m: bm, baseY: by0, sp: 0.9 + Math.random() * 0.7, x0: bm.position.x, z0: bm.position.z, ph: Math.random() * 6 });
      }
    });

    /* ---- Sứa phát sáng, Cá voi, Cá đuối Manta, Đàn cá 140 con & 24 cá rạn ---- */
    var jellies = [];
    var jCols = [0xff9ff3, 0x7fe3ff, 0xc77dff, 0xffb3c1];
    [[-24, 6, -12], [22, 7.5, -18], [-44, 5.5, 22], [48, 6.8, 16]].forEach(function (jp, ji) {
      var jg = new THREE.Group();
      if (MAY.modelsReady && MAY.MODEL_T.jelly) {
        jg.add(MAY.MODEL_T.jelly.group.clone(true));
      } else {
        var jm = new THREE.MeshStandardMaterial({ color: jCols[ji], emissive: jCols[ji], emissiveIntensity: 0.7, transparent: true, opacity: 0.78 });
        jg.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), jm));
      }
      jg.position.set(jp[0], jp[1], jp[2]);
      ctx.add(jg);
      jellies.push({ g: jg, baseY: jp[1], ph: ji * 1.5, drift: 0.14 });
    });

    var whale = new THREE.Group(); whale.rotation.order = "YXZ";
    var whaleMat = new THREE.MeshStandardMaterial({ color: 0x2b5570, roughness: 0.55 });
    var wb = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), whaleMat); wb.scale.set(6.2, 1.75, 1.75); whale.add(wb);
    var wt = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.5, 4), whaleMat); wt.rotation.z = Math.PI / 2; wt.position.x = -6.6; wt.scale.set(1, 1, 0.28); whale.add(wt);
    var wf = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.3, 4), whaleMat); wf.rotation.x = Math.PI / 2; wf.position.set(1, -1.4, 0); wf.scale.set(1, 1, 0.3); whale.add(wf);
    var wbel = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), new THREE.MeshStandardMaterial({ color: 0xa2c8d8, roughness: 0.7 }));
    wbel.scale.set(5.4, 1.2, 1.5); wbel.position.set(0.3, -0.7, 0); whale.add(wbel);
    ctx.add(whale);
    var whaleA = 0;

    var mantaHolder = new THREE.Group(); mantaHolder.rotation.order = "YXZ"; ctx.add(mantaHolder);
    var mantaA = 0.8;
    function populateManta() {
      while (mantaHolder.children.length) mantaHolder.remove(mantaHolder.children[0]);
      if (MAY.MODEL_T.manta) {
        var mc = MAY.MODEL_T.manta.group.clone(true);
        mc.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
        mantaHolder.add(mc);
      }
    }
    if (MAY.modelsReady) populateManta();

    /* Đàn cá nhỏ 140 con bơi theo luồng giống đàn cá xa trong ảnh 2 */
    var tinyGeo = new THREE.SphereGeometry(0.13, 6, 4); tinyGeo.scale(2.4, 0.7, 0.55);
    var tinyMesh = new THREE.InstancedMesh(tinyGeo, new THREE.MeshStandardMaterial({ color: 0xb6e6f5, roughness: 0.3, metalness: 0.65 }), 140);
    tinyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    ctx.add(tinyMesh);
    var tinyFish = [], tinyCenter = { x: 14, z: -12, a: 0 }, tinyDummy = new THREE.Object3D();
    tinyDummy.rotation.order = "YXZ";
    for (var ti = 0; ti < 140; ti++) {
      var tr = 1.6 + Math.random() * 5.2;
      tinyFish.push({ a: Math.random() * 6.28, r: tr, sp: (0.55 + Math.random() * 0.75) / tr, ph: Math.random() * 6, yOff: (Math.random() - 0.5) * 2.2 });
    }

    /* 24 cá rạn đầy màu sắc */
    var school = [];
    var fishCols = [0xffa726, 0x4fc3f7, 0xff8a80, 0xfff176, 0xce93d8];
    for (var sfi = 0; sfi < 24; sfi++) {
      var fg = MAY.fishBody(fishCols[sfi % fishCols.length], 1.2 + Math.random() * 0.75, sfi % 3);
      fg.rotation.order = "YXZ";
      var fa0 = Math.random() * 6.28, fr0 = 14 + Math.random() * 62;
      fg.position.set(Math.cos(fa0) * fr0, 2.2 + Math.random() * 6.5, Math.sin(fa0) * fr0);
      ctx.add(fg);
      var hd0 = Math.random() * 6.28;
      school.push({ g: fg, hd: hd0, hdT: hd0, turnT: Math.random() * 3, yT: 2.5 + Math.random() * 7.5, sp: 1.0 + Math.random() * 1.4, spT: 1.2, ph: Math.random() * 6.28, wagF: 7 + Math.random() * 4, wagA: 0.055, bank: 0 });
      (function (mesh) {
        ctx.interactives.push({
          obj: mesh, label: "Vuốt ve chú cá",
          onInteract: function () {
            mesh.userData.pet = 0; MAY.sndFriend();
            MAY.burstAt(mesh.position.clone(), 0xff8fb8, 8);
            MAY.toast("💗 Chú cá vui lắm! Nó quẫy đuôi chào Mây!", "Chú cá vui lắm!");
          }
        });
      })(fg);
    }

    /* ---- 10 Sao Biển, 6 Bạn Biển (+ Cá heo Bubi), 3 Rương, Vỏ sò & Bảo vật ẩn ---- */
    ctx.addCollectibles([
      [10, 2.4, -6], [-45, 2.0, 15], [55, 3.0, 35], [-60, 2.4, -40], [25, 2.0, -70],
      [-30, 2.8, -76], [72, 2.4, -5], [-76, 2.2, 25], [35, 2.6, 68], [-12, 3.2, 65]
    ], { color: 0xffd93d, emissive: 0xaa7700, icon: "⭐" });

    ctx.addFriends([
      { name: "Cá hề",       kind: "clownfish", pos: [14, 2.8, 2],    behavior: "swim",  greet: "🐠 Mây gặp bạn Cá hề cam sọc trắng nè!" },
      { name: "Ngọc trai",   kind: "pearl",     pos: [-40, 1.4, -20], behavior: "still", greet: "🦪 Ngọc trai mở vỏ lấp lánh chào Mây!" },
      { name: "Bạch tuộc",   kind: "octopus",   pos: [-15, 2.2, -55], behavior: "still", greet: "🐙 Bạch tuộc tím vẫy cả 6 xúc tu chào Mây!" },
      { name: "Cá heo Bubi", kind: "dolphin",   pos: [24, 4.2, -16],  behavior: "swim",  isCompanion: true, greet: "🐬 Cá heo Bubi vui quá! Bubi sẽ bơi cùng Mây luôn!" },
      { name: "Rùa biển",    kind: "turtle",    pos: [-66, 2.4, 28],  behavior: "swim",  greet: "🐢 Cụ Rùa biển gật đầu chào bé Mây!" },
      { name: "Cua đỏ",      kind: "crab",      pos: [25, 1.3, -72],  behavior: "still", greet: "🦀 Cua đỏ giơ càng chào Mây nè!" }
    ]);

    ctx.addChests([[-52, -33], [44, -24], [30, 56]], 0xc99655);

    /* Vỏ sò & đạo cụ đáy biển từ GLB */
    var propHolder = new THREE.Group(); ctx.add(propHolder);
    var shellSpots = [
      ["clam", -48, -22], ["starfish", 36, -27], ["sanddollar", 32, -21],
      ["clam", -6, 18], ["starfish", 4, 10], ["sanddollar", 8, 20]
    ];
    var shellDefs = shellSpots.map(function (d, idx) {
      var m = new THREE.Group();
      var glb = MAY.modelsReady ? MAY.cloneProp(d[0], null, 1.1) : null;
      if (glb) {
        if (d[0] === "starfish") { glb.rotation.x = -Math.PI / 2; glb.position.y = 0.15; }
        m.add(glb);
      } else {
        m.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd1a9, roughness: 0.4 })));
      }
      m.userData.propKind = d[0];
      return { id: "sh" + idx, pos: [d[1], d[2]], mesh: m, color: 0xffd9a0, msg: "Nhặt được vỏ sò đẹp quá" };
    });
    ctx.addSouvenirs(shellDefs);

    function populateStaticProps() {
      while (propHolder.children.length) propHolder.remove(propHolder.children[0]);
      [["barrel", -50, -28], ["amphora", -42, -30], ["seaweed", 30, -28], ["kelp", 38, -20], ["kelp", -60, 10], ["seaweed", 60, 10], ["barrel", 20, 40], ["amphora", -20, 45]].forEach(function (d, idx) {
        var c = MAY.cloneProp(d[0], null, 1.05);
        if (!c) return;
        c.position.set(d[1], ctx.groundH(d[1], d[2]), d[2]);
        c.rotation.y = idx * 1.1;
        propHolder.add(c);
      });
    }
    if (MAY.modelsReady) populateStaticProps();

    ctx.addHiddenTreasure([46, 1.6, -34], { name: "Sao Vàng Ẩn", hint: "Có ánh vàng lấp lánh bí mật trong rừng san hô..." });

    /* 3 Thử thách Màn 1 */
    ctx.addRingsChallenge([[-50, 4.2, -30], [-35, 5.2, -45], [-20, 4.2, -58], [-5, 5.2, -48], [10, 4.2, -34]], { title: "5 vòng san hô vàng" });
    ctx.addRaceChallenge([6, 3.2, 2], [[18, 3.4, -8], [34, 4.2, -24], [52, 3.4, -38]], { title: "Đua cùng Cá heo Bubi", time: 60 });
    ctx.addQuizStation([-18, 3.0, 18], { label: "Phao Câu Đố" });

    /* Callback đổi sang mô hình GLB thật nếu GLB tải xong sau khi vào màn */
    ctx.onModelsReady = function () {
      populateManta();
      populateStaticProps();
      school.forEach(function (f) {
        var c = MAY.cloneFish(f.g.userData.fishColor, f.g.userData.fishLen, f.g.userData.fishSpecies);
        if (!c) return;
        while (f.g.children.length) f.g.remove(f.g.children[0]);
        f.g.add(c);
      });
      ctx.friends.forEach(function (fr) {
        if (fr.kind === "turtle" && MAY.MODEL_T.turtle) {
          while (fr.group.children.length) fr.group.remove(fr.group.children[0]);
          fr.group.add(MAY.MODEL_T.turtle.group.clone(true));
        } else if (fr.kind === "dolphin" || fr.kind === "clownfish") {
          var c = MAY.cloneFish(fr.group.userData.fishColor, fr.group.userData.fishLen, fr.group.userData.fishSpecies);
          if (c) { while (fr.group.children.length) fr.group.remove(fr.group.children[0]); fr.group.add(c); }
        }
      });
      branchCoralGroups.forEach(function (cg) {
        var c = MAY.cloneProp("coral", cg.userData.coralTint, 1.15);
        if (c) { while (cg.children.length) cg.remove(cg.children[0]); cg.add(c); }
      });
      jellies.forEach(function (j) {
        if (MAY.MODEL_T.jelly) { while (j.g.children.length) j.g.remove(j.g.children[0]); j.g.add(MAY.MODEL_T.jelly.group.clone(true)); }
      });
      ctx.chests.forEach(function (ch) {
        if (ch.usingGLB || !MAY.MODEL_T.chest) return;
        var made = MAY.makeChestGLB(ch.tint);
        if (!made) return;
        var toDel = ch.group.children.filter(function (c) { return c !== ch.gold && c !== ch.glow; });
        toDel.forEach(function (c) { ch.group.remove(c); });
        ch.group.add(made.wrap);
        ch.lid = made.pivot;
        if (ch.opened) ch.lid.rotation.x = -1.9;
        ch.usingGLB = true;
      });
      ctx.souvenirs.forEach(function (sv) {
        var holder = sv.wrap.children[0];
        if (!holder || !holder.userData.propKind) return;
        var glb = MAY.cloneProp(holder.userData.propKind, null, 1.1);
        if (!glb) return;
        while (holder.children.length) holder.remove(holder.children[0]);
        if (holder.userData.propKind === "starfish") { glb.rotation.x = -Math.PI / 2; glb.position.y = 0.15; }
        holder.add(glb);
      });
    };

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.fillStyle = "#5cb85c";
      mm.beginPath(); mm.arc(C + SHORE.x * K, C + SHORE.z * K, SHORE.r * K, 0, 6.29); mm.fill();
    };

    ctx.onUpdate = function (dt, t) {
      diveBoat.position.y = 13.9 + Math.sin(t * 1.4) * 0.14;
      diveBoat.rotation.z = Math.sin(t * 1.1) * 0.04;
      weeds.forEach(function (w, wi) { w.rotation.z = Math.sin(t * 1.2 + wi) * 0.14; });
      jellies.forEach(function (j) {
        j.g.position.y = j.baseY + Math.sin(t * 0.8 + j.ph) * 0.8;
        j.g.position.x += Math.sin(t * 0.3 + j.ph) * j.drift * dt;
        var js = 1 + Math.sin(t * 2 + j.ph) * 0.09;
        j.g.scale.set(js, 1 / js, js);
      });
      whaleA += dt * 0.018;
      whale.position.set(Math.cos(whaleA) * 74, 9.2 + Math.sin(t * 0.4) * 0.8, Math.sin(whaleA) * 74);
      whale.rotation.y = -whaleA - Math.PI / 2;
      mantaA += dt * 0.015;
      mantaHolder.position.set(Math.cos(mantaA) * 48, 8.8 + Math.sin(t * 0.5) * 0.7, Math.sin(mantaA) * 48);
      mantaHolder.rotation.y = -mantaA - Math.PI / 2;
      mantaHolder.rotation.x = Math.sin(t * 0.9) * 0.16;

      tinyCenter.a += dt * 0.06;
      tinyCenter.x = Math.cos(tinyCenter.a) * 34;
      tinyCenter.z = Math.sin(tinyCenter.a * 0.75) * 34;
      tinyFish.forEach(function (f, idx) {
        f.a += f.sp * (1 + 0.25 * Math.sin(t * 0.9 + f.ph)) * dt;
        tinyDummy.position.set(tinyCenter.x + Math.cos(f.a) * f.r, 5.2 + f.yOff + Math.sin(t * 1.4 + f.ph) * 0.6, tinyCenter.z + Math.sin(f.a) * f.r);
        tinyDummy.rotation.y = -f.a - Math.PI / 2 + Math.sin(t * 6 + f.ph * 3) * 0.2;
        tinyDummy.updateMatrix();
        tinyMesh.setMatrixAt(idx, tinyDummy.matrix);
      });
      tinyMesh.instanceMatrix.needsUpdate = true;

      bubbleStreams.forEach(function (bs) {
        bs.m.position.y += bs.sp * dt;
        bs.m.position.x = bs.x0 + Math.sin(t * 2 + bs.ph) * 0.16;
        if (bs.m.position.y > 13.7) bs.m.position.y = bs.baseY;
      });

      school.forEach(function (f) {
        f.turnT -= dt;
        if (f.turnT <= 0) {
          f.turnT = 2 + Math.random() * 4.5;
          f.hdT = f.hd + (Math.random() - 0.5) * 1.8;
          f.yT = 2.2 + Math.random() * 8.5;
          f.spT = 0.9 + Math.random() * 1.4;
        }
        var px = f.g.position.x, pz = f.g.position.z;
        if (Math.hypot(px, pz) > 84) { f.hdT = Math.atan2(pz, -px); f.turnT = 1; }
        var hdB = f.hd;
        f.hd = turnTo(f.hd, f.hdT, dt * 0.65);
        f.sp += (f.spT - f.sp) * Math.min(1, dt * 0.6);
        f.g.position.x += Math.cos(f.hd) * f.sp * dt;
        f.g.position.z += -Math.sin(f.hd) * f.sp * dt;
        f.g.position.y += (f.yT - f.g.position.y) * Math.min(1, dt * 0.45);
        f.g.rotation.y = f.hd + Math.sin(t * f.wagF + f.ph) * f.wagA;
        var petRoll = 0;
        if (f.g.userData.pet !== undefined && f.g.userData.pet < 1) {
          f.g.userData.pet += dt * 1.2;
          petRoll = Math.sin(Math.min(1, f.g.userData.pet) * Math.PI * 2) * 0.65;
        }
        f.g.rotation.z = Math.sin(t * 1.1 + f.ph) * 0.08 + petRoll;
      });
    };

    ctx.checkpoint = new THREE.Vector3(0, 4.5, 10);
    var ch1St = ctx.story;
    var ch1Sc = MAY.STORY_SCRIPTS.level1;

    /* Khí quyển Sương Xám mực đen -> Trong xanh rực rỡ sau khi hạ Bạch Tuộc Mực! */
    ctx.setupAtmosphere(
      { fog: 0x162b3b, density: 0.022, sunInt: 1.05, hemiInt: 0.42 },
      { fog: 0x065c78, density: 0.0165, sunInt: 1.85, hemiInt: 0.68 },
      !!ch1St.bossDown
    );

    /* ---- HỒI 1-2: Lưới đá mực nhốt Cá heo Bubi + 3 Đám Mây Mực Đen quanh Tàu Đắm ---- */
    var inkMat = new THREE.MeshStandardMaterial({ color: 0x1a1026, emissive: 0x3b0764, emissiveIntensity: 0.5, transparent: true, opacity: 0.85, roughness: 0.9 });
    var bubiCagePos = new THREE.Vector3(16, 3.2, -10);
    var bubiCage = new THREE.Group();
    bubiCage.position.copy(bubiCagePos);
    var cagedBubi = MAY.fishBody(0x7fa8c9, 2.4, 1);
    bubiCage.add(cagedBubi);
    var cageRocks = new THREE.Mesh(new THREE.DodecahedronGeometry(2.3, 1), new THREE.MeshStandardMaterial({ color: 0x261d38, roughness: 0.9, wireframe: true }));
    var cageShell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 0), new THREE.MeshStandardMaterial({ color: 0x1d132e, transparent: true, opacity: 0.58, flatShading: true }));
    bubiCage.add(cageRocks, cageShell);
    bubiCage.visible = !ch1St.steps.bubiFree;
    ctx.add(bubiCage);

    var inkCloudPositions = [
      new THREE.Vector3(-24, 4.2, -14),
      new THREE.Vector3(-44, 4.0, -26),
      new THREE.Vector3(-56, 4.6, -38)
    ];
    var inkClouds = [];
    inkCloudPositions.forEach(function (ip, idx) {
      var cg = new THREE.Group();
      cg.position.copy(ip);
      for (var p = 0; p < 5; p++) {
        var pf = new THREE.Mesh(new THREE.SphereGeometry(1.7 + (p % 2) * 0.7, 10, 8), inkMat);
        pf.position.set(Math.cos(p * 1.3) * 1.4, Math.sin(p * 1.7) * 0.8, Math.sin(p * 1.3) * 1.4);
        cg.add(pf);
      }
      var done = !!ch1St.steps["ink" + idx];
      cg.visible = !done;
      ctx.add(cg);
      inkClouds.push(cg);
    });

    /* 3 Sứa Điện Xám tuần tra gần Tàu Đắm */
    if (!ch1St.bossDown) {
      [[-18, 4.5, -8], [-38, 4.8, -22], [-50, 4.2, -32]].forEach(function (ep, i) {
        ctx.addEnemy({ id: "l1_jelly_" + i, kind: "inkjelly", name: "Sứa Điện Xám", pos: ep, underwater: true, weakSpell: "wave", speed: 3.0, patrolR: 6 });
      });
    }

    /* ---- TRÙM CHƯƠNG 1: 🐙 Bạch Tuộc Mực Khổng Lồ (Kraken Sương Xám tại Cổng Đá [-30, 5.2, 22]) ---- */
    var krakenMesh = new THREE.Group();
    var kMat = new THREE.MeshStandardMaterial({ color: 0x3b185f, emissive: 0x4c1d95, emissiveIntensity: 0.45, roughness: 0.45 });
    var kHead = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), kMat); kHead.scale.set(1, 1.25, 1); kHead.position.y = 2.0; krakenMesh.add(kHead);
    var kCrown = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.35, 8, 18), new THREE.MeshStandardMaterial({ color: 0x1a0b2e, emissive: 0xff3b5c, emissiveIntensity: 0.8 }));
    kCrown.rotation.x = Math.PI / 2; kCrown.position.y = 3.6; krakenMesh.add(kCrown);
    var kTentacles = [];
    for (var kt = 0; kt < 8; kt++) {
      var ka = (kt / 8) * Math.PI * 2;
      var tn = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 3.6, 6, 10), kMat);
      tn.position.set(Math.cos(ka) * 2.2, -0.4, Math.sin(ka) * 2.2);
      tn.rotation.z = Math.cos(ka) * 0.7; tn.rotation.x = -Math.sin(ka) * 0.7;
      krakenMesh.add(tn); kTentacles.push(tn);
    }
    [-0.95, 0.95].forEach(function (ex) {
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff3b5c }));
      eye.position.set(ex, 2.2, -2.35); krakenMesh.add(eye);
    });
    krakenMesh.traverse(function (o) { if (o.isMesh) o.castShadow = true; });

    var ch1Npc;
    var ch1Boss = ctx.setBoss({
      name: "Bạch Tuộc Mực Khổng Lồ", icon: "🐙",
      pos: new THREE.Vector3(-30, 5.2, 22), arenaR: 26, maxHp: 3, mesh: krakenMesh,
      startActive: ch1St.stage === 2 && !ch1St.bossDown,
      tipFn: function () { return "💡 Khi Bạch Tuộc bắn Ngọc Trai Đen, bấm 🌊 Sóng Xung Kích (1 + R) đẩy ngược vào đầu nó!"; },
      onTick: function (dt, t, bs) {
        bs.mesh.position.y = 5.2 + Math.sin(t * 1.8) * 0.6;
        bs.mesh.lookAt(MAY.player.pos.x, bs.mesh.position.y, MAY.player.pos.z);
        kTentacles.forEach(function (tn, i) { tn.rotation.y = Math.sin(t * 3 + i) * 0.35; });
        bs.atkT -= dt;
        if (bs.atkT <= 0 && bs.pos.distanceTo(MAY.player.pos) < 38) {
          bs.atkT = 3.2;
          var dir = new THREE.Vector3().subVectors(MAY.player.pos, bs.pos).normalize();
          ctx.spawnBossOrb(bs.pos.clone().add(dir.clone().multiplyScalar(3.2)), dir, {
            speed: 8.8, radius: 0.9, reflectable: true, reflectSpell: "wave", color: 0x1a0b2e, emissive: 0xff3b5c,
            onReflectHitBoss: function (b) { b.damage("Ngọc Trai Đen bật ngược nổ tung mũ sương xám của Bạch Tuộc!"); }
          });
          MAY.toast("🐙 Bạch Tuộc bắn Ngọc Trai Đen! Dùng 🌊 Sóng Xung Kích (Phím 1 + R) đẩy ngược lại!");
        }
      },
      onSpellHit: function (spellId, castPos, bs) {
        if (spellId === "wave" && bs.pos.distanceTo(castPos) < 9.5) {
          MAY.toast("🌊 Sóng chạm Bạch Tuộc! Hãy căn lúc Ngọc Trai Đen bay ra rồi tung 🌊 đẩy ngược sẽ mạnh hơn!");
        }
      },
      onDefeat: function () {
        ch1St.stage = 3;
        MAY.persist();
        ch1Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI GẶP CỤ RÙA SAN HÔ NHẬN 🔵 NGỌC XANH DƯƠNG!", ch1Npc.pos);
        MAY.toast("🎉 Đã thanh tẩy Bạch Tuộc Mực! Quay về gặp Cụ Rùa San Hô (★) nhận thưởng!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
      }
    });

    function updateCh1Story() {
      if (ch1St.rewarded || ctx.save.gem) {
        ch1Npc.setMarker("♥");
        ctx.setObjective("🔵", "VỊNH SAN HÔ ĐÃ THANH TẨY — SANG CHƯƠNG 2 (PHÍM M)", null);
        return;
      }
      if (ch1St.bossDown) {
        ch1Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI GẶP CỤ RÙA SAN HÔ NHẬN 🔵 NGỌC XANH DƯƠNG!", ch1Npc.pos);
        return;
      }
      if (ch1St.stage === 0) {
        ch1Npc.setMarker("!");
        ctx.setObjective("💬", "TRÒ CHUYỆN VỚI CỤ RÙA SAN HÔ CỔ (!)", ch1Npc.pos);
        return;
      }
      var inksCleared = 0;
      for (var i = 0; i < 3; i++) if (ch1St.steps["ink" + i]) inksCleared++;
      if (!ch1St.steps.bubiFree) {
        ch1Npc.setMarker("?");
        ctx.setObjective("🌊", "DÙNG 🌊 SÓNG (1+R) PHÁ LƯỚI ĐÁ CỨU CÁ HEO BUBI", bubiCagePos);
      } else if (inksCleared < 3) {
        ch1Npc.setMarker("?");
        var nextInk = inkCloudPositions[0];
        for (var j = 0; j < 3; j++) if (!ch1St.steps["ink" + j]) { nextInk = inkCloudPositions[j]; break; }
        ctx.setObjective("🌊", "DÙNG 🌊 SÓNG THỔI TAN 3 ĐÁM MÂY MỰC (" + inksCleared + "/3)", nextInk);
      } else {
        ch1St.stage = 2;
        MAY.persist();
        ch1Npc.setMarker("?");
        if (!ch1Boss.active) {
          ch1Boss.activate();
          MAY.openDialogue({
            name: ch1Sc.npcName, role: ch1Sc.npcRole, icon: ch1Sc.npcIcon, color: ch1Sc.npcColor,
            pages: ch1Sc.bossIntro, endBtn: "🐙 Chiến đấu với Bạch Tuộc Mực!", voiceClip: "boss_appear"
          });
        }
        ctx.setObjective("🐙", "ĐẨY NGƯỢC NGỌC TRAI ĐEN ĐÁNH BẠI BẠCH TUỘC MỰC!", ch1Boss.pos);
      }
    }

    ctx.addSkillTarget({
      id: "l1_bubi", pos: bubiCagePos, radius: 8.5, reqSpell: "wave",
      hint: "🌊 Phá lưới đá cứu Bubi!", done: !!ch1St.steps.bubiFree,
      isActive: function () { return ch1St.stage >= 1 && !ch1St.steps.bubiFree; },
      onHit: function (sp, tg) {
        ch1St.steps.bubiFree = true;
        MAY.persist();
        bubiCage.visible = false;
        tg.markDone();
        MAY.sndShatter(bubiCagePos);
        MAY.VFX.spawnShatterBurst(bubiCagePos, 0x38bdf8);
        MAY.toast("🐬 Tuyệt quá! Cá heo Bubi được giải cứu và bơi theo Mây rồi! Giờ hãy thổi tan 3 Đám Mây Mực quanh Tàu Đắm!");
        updateCh1Story();
      }
    });

    inkCloudPositions.forEach(function (ip, idx) {
      ctx.addSkillTarget({
        id: "l1_ink_" + idx, pos: ip, radius: 8.5, reqSpell: "wave",
        hint: "🌊 Thổi tan Mây Mực (" + (idx + 1) + "/3)", done: !!ch1St.steps["ink" + idx],
        isActive: function () { return ch1St.stage >= 1 && !!ch1St.steps.bubiFree && !ch1St.steps["ink" + idx]; },
        onHit: function (sp, tg) {
          ch1St.steps["ink" + idx] = true;
          MAY.persist();
          inkClouds[idx].visible = false;
          tg.markDone();
          MAY.sndStar();
          MAY.burstAt(ip.clone(), 0x38bdf8, 22);
          MAY.toast("🌊 Mây mực tan biến rồi! Ánh nắng biển đang quay trở lại!");
          updateCh1Story();
        }
      });
    });

    ch1Npc = ctx.addQuestNPC({
      kind: "turtle", name: ch1Sc.npcName, icon: ch1Sc.npcIcon,
      pos: [0, 4.0, 2], rotY: 0, scale: 1.35, labelY: 2.0, floating: true, autoGreet: ch1St.stage === 0,
      onTalk: function () {
        if (ch1St.rewarded || ctx.save.gem) {
          MAY.openDialogue({ name: ch1Sc.npcName, role: ch1Sc.npcRole, icon: ch1Sc.npcIcon, color: ch1Sc.npcColor, pages: ch1Sc.complete, endBtn: "🌲 Tới Chương 2: Rừng Nấm Xanh", onDone: function () { MAY.enterLevel("level2"); } });
        } else if (ch1St.bossDown) {
          MAY.openDialogue({
            name: ch1Sc.npcName, role: ch1Sc.npcRole, icon: ch1Sc.npcIcon, color: ch1Sc.npcColor,
            pages: ch1Sc.reward, endBtn: ch1Sc.rewardBtn, voiceClip: "gem_win",
            onDone: function () { ch1St.rewarded = true; MAY.persist(); updateCh1Story(); ctx.awardGem(); }
          });
        } else if (ch1St.stage === 0) {
          MAY.openDialogue({
            name: ch1Sc.npcName, role: ch1Sc.npcRole, icon: ch1Sc.npcIcon, color: ch1Sc.npcColor,
            pages: ch1Sc.intro, endBtn: ch1Sc.introBtn, voiceClip: "npc_ch1",
            onDone: function () {
              ch1St.stage = 1; MAY.persist();
              MAY.unlockSpell("wave");
              updateCh1Story();
            }
          });
        } else {
          MAY.openDialogue({ name: ch1Sc.npcName, role: ch1Sc.npcRole, icon: ch1Sc.npcIcon, color: ch1Sc.npcColor, pages: ch1Sc.inProgress, endBtn: "🌊 Đi tiếp nào!" });
        }
      }
    });
    updateCh1Story();

    MAY.player.spawnAt(0, 4.0, 10, 0, true);
    return ctx;
  };

})(window.MAY);
