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

    // A continuous arched deck follows the same height function as the walkable surface.
    var rbStripeCols = [0xff7180, 0xf4c763, 0x9dcc93, 0x77c8df, 0xb69cdc];
    var deckMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide });
    var railGoldMat = new THREE.MeshStandardMaterial({ color: 0xa87c50, metalness: 0.35, roughness: 0.62 });
    var pierMat = new THREE.MeshStandardMaterial({ color: 0x897b8b, roughness: 0.9 });
    var posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.16, 1.05, 6), railGoldMat, BRIDGES.length * 14);
    var piers = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.52, 0.7, 1.2, 8), pierMat, BRIDGES.length * 4);
    var dummy = new THREE.Object3D(), postIndex = 0, pierIndex = 0;
    BRIDGES.forEach(function (pair) {
      var a = pair[0], b = pair[1], steps = 20;
      var ang = Math.atan2(b.x - a.x, b.z - a.z), px = Math.cos(ang), pz = -Math.sin(ang);
      function point(t, side, dy) { return [a.x + (b.x - a.x) * t + px * side,
        a.y + 0.82 + (b.y - a.y) * t + Math.sin(t * Math.PI) * 2.4 + dy,
        a.z + (b.z - a.z) * t + pz * side]; }
      var positions = [], colors = [];
      function tri(p, q, r, col, shade) {
        var c = new THREE.Color(col).multiplyScalar(shade);
        [p, q, r].forEach(function (v) { positions.push(v[0], v[1], v[2]); colors.push(c.r, c.g, c.b); });
      }
      for (var s = 0; s < steps; s++) {
        var t0 = s / steps, t1 = (s + 1) / steps;
        for (var band = 0; band < 5; band++) {
          var l = -2.8 + band * 1.12, r = l + 1.12;
          var p0 = point(t0, l, 0), p1 = point(t0, r, 0), p2 = point(t1, l, 0), p3 = point(t1, r, 0);
          tri(p0, p2, p1, rbStripeCols[band], 1); tri(p1, p2, p3, rbStripeCols[band], 1);
        }
        [-2.8, 2.8].forEach(function (side) {
          var p0 = point(t0, side, 0), p1 = point(t1, side, 0), p2 = point(t0, side, -0.4), p3 = point(t1, side, -0.4);
          tri(p0, p1, p2, 0x65546d, 0.72); tri(p2, p1, p3, 0x65546d, 0.72);
        });
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
      var deck = new THREE.Mesh(geo, deckMat); deck.receiveShadow = true; ctx.add(deck);
      [-2.8, 2.8].forEach(function (side) {
        var pts = [];
        for (var k = 0; k <= 20; k++) { var v = point(k / 20, side, 1.05); pts.push(new THREE.Vector3(v[0], v[1], v[2])); }
        ctx.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.09, 5, false), railGoldMat));
        for (var j = 1; j <= 7; j++) { var pp = point(j / 8, side, 0.52); dummy.position.set(pp[0], pp[1], pp[2]); dummy.updateMatrix(); posts.setMatrixAt(postIndex++, dummy.matrix); }
        [0.15, 0.85].forEach(function (t) { var pp = point(t, side, -0.55); dummy.position.set(pp[0], pp[1], pp[2]); dummy.updateMatrix(); piers.setMatrixAt(pierIndex++, dummy.matrix); });
      });
    });
    ctx.add(posts); ctx.add(piers);
    // A welcoming arch marks the central island while leaving the bridge clear.
    var gateMat = new THREE.MeshStandardMaterial({color:0xbc8b70,roughness:0.72,metalness:0.16});
    var gateStem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.65,0.9,1,8),gateMat,4), gateDummy=new THREE.Object3D(),gateIndex=0;
    [-1,1].forEach(function(side){var x=side*5.0,z=7,y=ctx.groundH(x,z);[[x,y+3.4,z,0.8,6.8,0.8],[x,y+7,z,1.2,0.5,1.2]].forEach(function(p){gateDummy.position.set(p[0],p[1],p[2]);gateDummy.scale.set(p[3],p[4],p[5]);gateDummy.updateMatrix();gateStem.setMatrixAt(gateIndex++,gateDummy.matrix);});});ctx.add(gateStem);
    var gateArch=new THREE.Mesh(new THREE.TorusGeometry(5.0,0.38,8,26,Math.PI),gateMat);gateArch.position.set(0,ctx.groundH(0,7)+6.6,7);ctx.add(gateArch);
    var gateStar=new THREE.Mesh(new THREE.OctahedronGeometry(0.75,0),new THREE.MeshStandardMaterial({color:0xffdc8d,emissive:0xffdc8d,emissiveIntensity:0.55,roughness:0.3}));gateStar.position.set(0,ctx.groundH(0,7)+12.1,7);ctx.add(gateStar);


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
    // Three slow wind ribbons mark the mill island without a full-screen effect.
    var windRibbons = new THREE.Group();
    var ribbonGeo = new THREE.TorusGeometry(3.6, 0.045, 5, 36, Math.PI * 1.35);
    var ribbonMat = new THREE.MeshBasicMaterial({ color: 0xffe7bf, transparent: true, opacity: 0.55, depthWrite: false });
    for (var wr = 0; wr < 3; wr++) {
      var ribbon = new THREE.Mesh(ribbonGeo, ribbonMat); ribbon.rotation.x = Math.PI / 2 + wr * 0.13;
      ribbon.rotation.z = wr * 2.05; ribbon.position.y = wr * 0.55; windRibbons.add(ribbon);
    }
    windRibbons.position.set(42, 20, 14); ctx.add(windRibbons);

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
      { name: "Bé Gió Lốc Tí Hon", kind: "windspirit",   pos: [0, 19.8, -44],  behavior: "still", greet: "🌬️ Bé Gió lượn một vòng quanh Mây. Từ đây hai bạn lại có thể cùng bay!" }
    ]);
    var windFriend = ctx.friends.find(function (friend) { return friend.kind === "windspirit"; });
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
    // Three open arcs signal the shield without masking the king's face.
    var bossShield = new THREE.Group();
    var shieldMat = new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.65, depthWrite: false });
    var shieldArc = new THREE.TorusGeometry(3.8, 0.065, 5, 32, Math.PI * 1.72);
    for (var si = 0; si < 3; si++) {
      var shieldRing = new THREE.Mesh(shieldArc, shieldMat);
      shieldRing.rotation.set(si === 0 ? Math.PI / 2 : 0.25, si * Math.PI / 3, si * 0.8);
      bossShield.add(shieldRing);
    }
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
          bs.telegraphAttack(1.0);
          var strikePos = MAY.player.pos.clone();
          strikePos.y = Math.max(18.9, ctx.groundH(strikePos.x, strikePos.z));
          MAY.VFX.spawnTelegraph(strikePos, 4.2, 1.0, 0xfef08a);
          MAY.toast("⚡ Vua Mây Bão gọi sét đánh! Chạy né khỏi vòng vàng!");
          ctx.scheduleEvent(1.0, function () {
            if (!bs.active || bs.defeated || bs.state === "stunned") return;
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
        syncBeacon();
        ch6Npc.setMarker("★");
        ctx.setObjective("★", "QUAY LẠI PHƯỢNG HOÀNG NHẬN 🌈 NGỌC CUỐI & MỞ ĐẠI TIỆC!", ch6Npc.pos);
        MAY.toast("🌈 Bão đã tan! Bé Gió bay về trước lâu đài. Về gặp Phượng Hoàng (★)!", "Hoan hô! Mây đã đánh bại Trùm và thanh tẩy Màn Sương Xám!");
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

    // A final beacon turns the restored islands into a route to the storm.
    // Saves that had already opened all locks keep their original boss state.
    var beaconPos = new THREE.Vector3(0, ctx.groundH(0, -34), -34);
    var beaconGroup = new THREE.Group(); beaconGroup.position.copy(beaconPos);
    var beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0xd9c7ea, roughness: 0.7 }));
    beaconBase.position.y = 0.3; beaconGroup.add(beaconBase);
    var beaconCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), new THREE.MeshStandardMaterial({ color: 0x5a4775, emissive: 0x583399, emissiveIntensity: 0.7 }));
    beaconCore.position.y = 1.6; beaconGroup.add(beaconCore); ctx.add(beaconGroup);
    function beaconActive() { return ch6St.stage === 2 && !!ch6St.steps.beaconTrialStarted && !ch6St.steps.beaconTrialDone; }
    var rescuePos = new THREE.Vector3(-12, ctx.groundH(-12, -51), -51);
    var rescueGroup = new THREE.Group(); rescueGroup.position.copy(rescuePos);
    var windFace = new THREE.Group(); rescueGroup.add(windFace);
    var windBody = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), new THREE.MeshStandardMaterial({ color: 0xa8eafa, roughness: 0.65 }));
    windBody.scale.set(1.2, 0.8, 0.8); windBody.position.y = 1.1; windFace.add(windBody);
    var windEyeMat = new THREE.MeshBasicMaterial({ color: 0x183e59 });
    [-0.23, 0.23].forEach(function (x) {
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), windEyeMat);
      eye.position.set(x, 1.2, 0.56); windFace.add(eye);
    });
    var windCage = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.08, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffd86d }));
    windCage.rotation.x = Math.PI / 2; windCage.position.y = 0.18; rescueGroup.add(windCage);
    var rescueLabel = MAY.makeLabel("💨 Bé Gió đang chờ Mây!", { sx: 3.5, sy: 0.8, bg: "rgba(10,32,56,.88)" });
    rescueLabel.position.y = 2.7; rescueGroup.add(rescueLabel); ctx.trackLabel(rescueLabel, 30, 3);
    ctx.add(rescueGroup);
    var rescueTrail = new THREE.Group();
    for (var trailIndex = 1; trailIndex <= 5; trailIndex++) {
      var trailPoint = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffef9a }));
      var trailT = trailIndex / 6;
      var trailX = beaconPos.x + (rescuePos.x - beaconPos.x) * trailT;
      var trailZ = beaconPos.z + (rescuePos.z - beaconPos.z) * trailT;
      trailPoint.position.set(trailX, ctx.groundH(trailX, trailZ) + 0.4, trailZ);
      rescueTrail.add(trailPoint);
    }
    ctx.add(rescueTrail);
    // The evacuation route must be completed before the final beacon is lit.
    var expedition = MAY.createChapterJourney(ctx, {
      title: "Đợi đủ tiếng chuông", entry: [0, ctx.groundH(0, -28), -28], color: 0xffdd8b,
      sections: [
        { name: "Gầm cầu mây", brief: "Đọc chiều gió, phối hợp phép đã học để tới tháp chuông.", landmark: "Gầm cầu mây", length: 760, sky: 0xbba9db, ground: 0xf2e6f6, path: 0xd5c9ee, scenery: "bridge", companion: "wind", events: [
          { at: 0.07, kind: "pass", lane: -1, cue: "Cờ bay sang phải: đi phía trái khuất gió", success: "Mây nép dưới vòm cầu" },
          { at: 0.16, kind: "cast", spell: "wave", lane: 0, cue: "Dùng Sóng đẩy vật chắn dưới cầu", success: "Lối dưới cầu đã thông" },
          { at: 0.25, kind: "pass", lane: 1, cue: "Gió đổi chiều: tìm phía phải vòm cầu", success: "Bé Gió chỉ chỗ khuất gió" },
          { at: 0.34, kind: "cast", spell: "growth", lane: 0, cue: "Cho dây hoa mọc qua khoảng hở", success: "Dây hoa nối tới bậc mây" },
          { at: 0.43, kind: "fork", choices: ["Dưới vòm", "Ngoài gió"], lane: -1, cue: "Chọn đường có vòm che gió", success: "Hai bạn qua dưới vòm cầu" },
          { at: 0.52, kind: "cast", spell: "crystal", lane: 0, cue: "Cộng Hưởng phá đá chặn tháp", success: "Đá tách ra, đường mở" },
          { at: 0.61, kind: "pass", lane: -1, cue: "Dải cờ chỉ gió mới: núp bên trái", success: "Hai bạn tránh cơn gió" },
          { at: 0.70, kind: "cast", spell: "frost", lane: 0, cue: "Kết băng vệt nước tới bậc cầu", success: "Mặt băng nối đường tới tháp" },
          { at: 0.79, kind: "pass", lane: 1, cue: "Đi bên phải cột khi gió thổi từ trái", success: "Cột cầu che gió cho Mây" },
          { at: 0.89, kind: "cast", spell: "tornado", lane: 0, cue: "Lốc thổi tan mây xám che tháp", success: "Tháp chuông hiện ra" }
        ] },
        { name: "Tháp chuông", brief: "Bé Gió chỉ các khu sơ tán và tín hiệu chờ tớ.", landmark: "Tháp chuông", length: 770, sky: 0xcbb7df, ground: 0xf6eaf7, path: 0xe1d1ed, scenery: "bell", companion: "wind", events: [
          { at: 0.07, kind: "echo", pattern: [0, 0, 2], cue: "Hai nhịp ngắn, một nhịp dài: chờ tớ", success: "Chuông đáp lại lời gọi" },
          { at: 0.16, kind: "pass", lane: 1, cue: "Gió lùa bên trái tháp: theo lối phải", success: "Mây lên được bậc tháp" },
          { at: 0.25, kind: "align", slots: 4, answer: 2, initial: 0, cue: "Xoay dấu chuông về khu sơ tán có cờ", success: "Ánh chuông chỉ khu trú cá" },
          { at: 0.34, kind: "cast", spell: "solar", lane: 0, cue: "Chiếu Nắng vào cửa tháp để đọc bản đồ", success: "Ba khu sơ tán hiện trên bản đồ" },
          { at: 0.43, kind: "echo", pattern: [0, 0, 2], cue: "Gửi lại hai ngắn, một dài cho Bé Gió", success: "Bé Gió đáp: các bạn còn đang đi" },
          { at: 0.52, kind: "switch", choices: ["Đợi các bạn", "Bật đèn ngay"], answer: 0, cue: "Đèn sẽ dẫn bão đến đây: chờ đủ lời đáp", success: "Mây giữ đèn tắt và tìm các bạn" },
          { at: 0.61, kind: "pass", lane: -1, cue: "Theo cờ sang phía trái tháp", success: "Lối tới Bubi đã mở" },
          { at: 0.70, kind: "cast", spell: "tornado", lane: 0, cue: "Thổi mây xám khỏi chuông báo hiệu", success: "Chuông báo hiệu nhìn thấy từ xa" },
          { at: 0.79, kind: "echo", pattern: [0, 0, 2], cue: "Gửi tín hiệu chờ tớ tới khu sơ tán", success: "Một tiếng đáp vọng từ phía cầu" },
          { at: 0.89, kind: "pass", lane: 1, cue: "Theo cờ bên phải xuống lối sơ tán", success: "Mây tới lối sơ tán" }
        ] },
        { name: "Lối sơ tán", brief: "Tìm Bubi, Thỏ Bông và Cú Mèo, xác nhận từng bạn an toàn.", landmark: "Lối sơ tán", length: 790, sky: 0xd6bce4, ground: 0xf7e8f4, path: 0xead7ec, scenery: "shelter", companion: "bubi", events: [
          { at: 0.07, kind: "pass", lane: -1, cue: "Theo dấu nước tới mái trú Bubi bên trái", success: "Bubi đưa đàn cá vào chỗ trú" },
          { at: 0.16, kind: "echo", pattern: [0, 0, 2], cue: "Gửi Bubi hai nhịp ngắn, một nhịp dài", success: "Bubi đáp: đàn cá đã an toàn!" },
          { at: 0.25, kind: "cast", spell: "wave", lane: 0, cue: "Đẩy vật cản khỏi cửa trú của Bubi", success: "Cửa trú cá rộng ra" },
          { at: 0.34, kind: "pass", lane: 1, cue: "Theo dấu chân thỏ tới mái trú bên phải", success: "Thỏ Bông vẫy Mây" },
          { at: 0.43, kind: "echo", pattern: [0, 0, 2], cue: "Gửi tín hiệu Thỏ Bông dạy trong rừng", success: "Thỏ Bông đáp: các bạn rừng an toàn!" },
          { at: 0.52, kind: "cast", spell: "growth", lane: 0, cue: "Cho dây hoa giữ mái trú trước gió", success: "Mái trú của Thỏ Bông đã vững" },
          { at: 0.61, kind: "pass", lane: -1, cue: "Theo hình nốt tới Cú Mèo bên trái", success: "Cú Mèo đang chờ lời đáp" },
          { at: 0.70, kind: "echo", pattern: [0, 0, 2], cue: "Gõ hai ngắn, một dài cho Cú Mèo", success: "Cú Mèo đáp: mọi người ở hang an toàn!" },
          { at: 0.79, kind: "cast", spell: "crystal", lane: 0, cue: "Mở lối về lâu đài bằng Cộng Hưởng", success: "Lối trở về lâu đài thông rồi" },
          { at: 0.89, kind: "switch", choices: ["Kiểm tra đủ ba lời đáp", "Bật đèn ngay"], answer: 0, cue: "Bubi, Thỏ Bông và Cú Mèo đã đáp chưa?", success: "Đủ ba lời đáp; Mây có thể về đèn" }
        ] },
        { name: "Sân lâu đài", brief: "Cùng Bé Gió đưa tín hiệu về hải đăng.", landmark: "Sân lâu đài", length: 780, sky: 0xf0c8e2, ground: 0xffedf7, path: 0xf6dfed, scenery: "bell", companion: "wind", events: [
          { at: 0.07, kind: "escort", lane: -1, cue: "Đợi Bé Gió ở phía trái khuất gió", success: "Bé Gió theo kịp Mây" },
          { at: 0.16, kind: "pass", lane: 1, cue: "Cờ đổi chiều: hai bạn sang phía phải", success: "Hai bạn qua cơn gió" },
          { at: 0.25, kind: "cast", spell: "frost", lane: 0, cue: "Kết băng chỗ hở trên lối về sân", success: "Lối tới sân được nối lại" },
          { at: 0.34, kind: "escort", lane: 0, cue: "Chờ Bé Gió qua giữa nhịp cầu", success: "Bé Gió đã tới bên Mây" },
          { at: 0.43, kind: "align", slots: 4, answer: 2, initial: 0, cue: "Xoay tín hiệu về sân đèn, tránh khu trú", success: "Tín hiệu hướng về sân trống" },
          { at: 0.52, kind: "echo", pattern: [0, 0, 2], cue: "Chuyển tín hiệu an toàn tới sân đèn", success: "Chuông sân nhắc lại tín hiệu an toàn" },
          { at: 0.61, kind: "cast", spell: "tornado", lane: 0, cue: "Thổi tan mây xám che đường tới đèn", success: "Hải đăng hiện rõ phía trước" },
          { at: 0.70, kind: "escort", lane: 1, cue: "Đưa Bé Gió tới mái che bên phải", success: "Bé Gió đã an toàn bên sân" },
          { at: 0.79, kind: "switch", choices: ["Hướng về sân đèn", "Hướng về khu trú"], answer: 0, cue: "Chọn hướng đưa tín hiệu tới sân đèn", success: "Tín hiệu chỉ về sân trống" },
          { at: 0.89, kind: "cast", spell: "solar", lane: 0, cue: "Dùng Nắng thắp đèn chỉ đường về hải đăng", success: "Đèn chỉ đường sáng; hãy tự tay bật hải đăng ở sân lâu đài" }
        ] }
      ],
      clearing: {
        section: 2, name: "Đợi đủ tiếng chuông", brief: "Tìm lời đáp của Bubi, Thỏ Bông và Cú Mèo, rồi thắp đèn tín hiệu.",
        devices: [
          { id: "bubi", name: "Bubi bên mái trú cá", x: -18, z: -10, form: "bubi", color: 0x64d7ff },
          { id: "rabbit", name: "Thỏ Bông bên vườn", x: 17, z: -12, form: "rabbit", color: 0xffa9ce },
          { id: "owl", name: "Cú Mèo bên tháp", x: -15, z: -27, form: "owl", color: 0xffd671 },
          { id: "bell", name: "Chuông báo an toàn", x: 13, z: -28, form: "bell", color: 0xffd56c },
          { id: "lamp", name: "Đèn tín hiệu", x: 0, z: -33, form: "lamp", color: 0xffef9a, spell: "solar" }
        ],
        hint: function (v) { return !v.bubi ? "Tìm Bubi phía trái ở mái trú cá." : !v.rabbit ? "Tìm Thỏ Bông phía phải bên vườn." : !v.owl ? "Tìm Cú Mèo phía trái, gần tháp." : !v.bell ? "Gõ chuông phía phải báo cả ba đã an toàn." : "Dùng Nắng bật đèn tín hiệu phía trước."; },
        action: function (id, v) {
          if (id === "bubi" || id === "rabbit" || id === "owl") { v[id] = true; return { text: ({ bubi: "Bubi đáp: đàn cá đã an toàn!", rabbit: "Thỏ Bông đáp: các bạn rừng đã an toàn!", owl: "Cú Mèo đáp: mọi người ở hang đã an toàn!" })[id], done: false }; }
          if (!v.bubi || !v.rabbit || !v.owl) return { text: "Chưa đủ ba lời đáp; hãy tìm người bạn còn thiếu trước khi bật đèn.", done: false };
          if (id === "bell") { v.bell = true; return { text: "Chuông vang lên: cả ba nơi trú đã an toàn!", done: false }; }
          if (!v.bell) return { text: "Hãy gõ chuông báo an toàn trước khi bật đèn tín hiệu.", done: false };
          v.lamp = true; return { text: "Đèn tín hiệu sáng sau lời đáp cuối. Bé Gió dẫn Mây tới hải đăng!", done: true };
        },
        look: function (id, v) { return { lit: !!v[id], angle: 0 }; },
        links: function (v) { return v.bell ? [["bell", "lamp", 0xffe58b]] : []; },
        followers: function () { return []; }
      },
      makeVista: function (index) {
        var group = new THREE.Group(), lights = [];
        var colors = [0x5fd2ff, 0xffa8d6, 0xffdd76];
        for (var i = 0; i < 3; i++) {
          var post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), new THREE.MeshStandardMaterial({ color: 0xc5b1d9 })); post.position.set((i - 1) * 6, 1.5, -18); group.add(post);
          var light = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: 0.2 })); light.position.set((i - 1) * 6, 3.3, -18); group.add(light); lights.push(light);
        }
        var wind = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 6, 20), new THREE.MeshStandardMaterial({ color: 0xb3eeff, emissive: 0x50badd, emissiveIntensity: 0.4 })); wind.position.set(3, 2, 3); group.add(wind);
        return { group: group, tick: function (distance, lateral, eventIndex, time) {
          wind.rotation.z = time * 1.4; wind.position.x += (lateral + 3 - wind.position.x) * 0.04;
          lights.forEach(function (light, i) { light.material.emissiveIntensity = index >= 2 && eventIndex >= (i + 1) * 3 ? 1.1 : 0.2 + 0.1 * Math.sin(time * 2 + i); });
        } };
      },
      makeLandmark: function (index) {
        var g = new THREE.Group();
        var stone = new THREE.MeshStandardMaterial({ color: 0xe9d7f0, roughness: 0.7 });
        var gold = new THREE.MeshStandardMaterial({ color: 0xffd781, emissive: 0x80500f, emissiveIntensity: 0.25 });
        if (index === 0) {
          var arch = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.9, 8, 20, Math.PI), stone); arch.position.y = 0.7; g.add(arch);
        } else if (index === 1) {
          var tower = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.5, 6, 8), stone); tower.position.y = 3; g.add(tower);
          [-2.6, 0, 2.6].forEach(function (x) { var bell = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 10), gold); bell.position.set(x, 6.3, 0); g.add(bell); });
        } else if (index === 2) {
          [-3.5, 0, 3.5].forEach(function (x) { var shelter = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.3, 4), stone); shelter.rotation.y = Math.PI / 4; shelter.position.set(x, 1.65, 0); g.add(shelter); });
        } else {
          var lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.5, 6.5, 10), stone); lighthouse.position.y = 3.25; g.add(lighthouse);
          var lamp = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), gold); lamp.position.y = 7.1; g.add(lamp);
        }
        return g;
      }, onComplete: function () { updateCh6Story(); }
    });

    var beaconTarget = ctx.addSkillTarget({
      id: "l6_beacon_trial", pos: beaconPos, radius: 8, reqSpell: "solar", done: !!ch6St.steps.beaconLit,
      hint: "☀️ Chiếu đèn để tìm Bé Gió", ringColor: 0xfef08a,
      isActive: beaconActive,
      onHit: function (sp, tg) {
        if (!ch6St.steps.beaconLit && sp === "solar") {
          if (ch6St.stage < 3 && expedition.block()) {
            MAY.toast("Chưa đủ lời đáp! Hãy tìm Bubi, Thỏ Bông và Cú Mèo trước khi bật đèn.");
            return;
          }
          ch6St.steps.beaconLit = true; MAY.persist();
          beaconCore.material.color.setHex(0xffdd73); beaconCore.material.emissive.setHex(0xa96b00);
          MAY.VFX.spawnShatterBurst(beaconPos.clone().add(new THREE.Vector3(0, 1.6, 0)), 0xffe47a);
          tg.markDone();
          MAY.toast("☀️ Đèn đã sáng! Đi theo các đốm sáng đến gần Bé Gió để cứu bạn.");
          updateCh6Story();
        }
      }
    });
    function syncBeacon() {
      var active = beaconActive(); beaconGroup.visible = active;
      beaconCore.material.color.setHex(ch6St.steps.beaconLit ? 0xffdd73 : 0x5a4775);
      beaconCore.material.emissive.setHex(ch6St.steps.beaconLit ? 0xa96b00 : 0x583399);
      if (beaconTarget.hintLb) beaconTarget.hintLb.visible = active && !ch6St.steps.beaconLit;
      beaconTarget.ring.visible = active && !ch6St.steps.beaconLit;
      rescueGroup.visible = !!ch6St.steps.beaconTrialStarted && !!ch6St.steps.beaconLit && !ch6St.bossDown;
      windFriend.group.visible = windFriend.label.visible = !!(ch6St.bossDown || ctx.save.gem);
      windCage.visible = active;
      rescueTrail.visible = active && !!ch6St.steps.beaconLit;
    }

    function updateCh6Story() {
      syncBeacon();
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
      } else if (ch6St.stage < 3 && expedition.block()) {
        ch6Npc.setMarker("?");
        return;
      } else if (beaconActive()) {
        ch6Npc.setMarker("?");
        ctx.setObjective(ch6St.steps.beaconLit ? "💨" : "☀️", ch6St.steps.beaconLit
          ? "ĐI THEO ĐỐM SÁNG ĐẾN GẦN BÉ GIÓ ĐỂ CỨU BẠN"
          : "DÙNG ☀️ TIA NẮNG CHIẾU ĐÈN TÌM BÉ GIÓ (3+R)", ch6St.steps.beaconLit ? rescuePos : beaconPos);
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
          if (lockCoords.every(function (_, i) { return !!ch6St.steps["lock" + i]; }) && ch6St.stage === 2) {
            ch6St.steps.beaconTrialStarted = true; MAY.persist();
          }
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
      if (beaconActive() && ch6St.steps.beaconLit && MAY.player.pos.distanceTo(rescuePos) < 3.2) {
        ch6St.steps.beaconTrialDone = true; MAY.persist();
        windCage.visible = false; rescueTrail.visible = false;
        MAY.burstAt(rescuePos.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xa8eafa, 18);
        MAY.toast("💨 Bé Gió được cứu rồi! Bạn ấy reo vui và chỉ đường đến Vua Mây Bão!");
        updateCh6Story();
      }
      if (rescueGroup.visible) {
        windFace.position.y = Math.sin(t * 2.6) * (ch6St.steps.beaconTrialDone ? 0.28 : 0.08);
      }
      windRibbons.rotation.y += dt * 0.16;
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
