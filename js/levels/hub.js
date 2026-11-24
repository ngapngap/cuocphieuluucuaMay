"use strict";
/* ============================================================================
   HUB — ĐẢO MÂY (Sảnh Trung Tâm: Bờ kè đá, Thuyền gỗ, Ngọn Hải Đăng Cầu Vồng,
   6 Cổng Thế Giới & Lễ Hội Cầu Vồng khi gom đủ 6 Viên Ngọc)
   ============================================================================ */
(function (MAY) {
  MAY.LEVELS = MAY.LEVELS || {};

  MAY.LEVELS.hub = function () {
    var ctx = MAY.createWorldCtx("hub");
    ctx.mode = "land";
    ctx.waterLevel = 0.0;
    ctx.worldRadius = 68;
    ctx.minimapBg = "rgba(8,76,112,0.92)";

    /* Ánh sáng & Bầu trời ven biển nắng trong (phong cách ảnh 3) */
    MAY.setSunOffset(36, 44, 26);
    MAY.sun.color.setHex(0xfff4da);
    MAY.sun.intensity = 1.72;
    MAY.hemiLight.color.setHex(0xcbeaff);
    MAY.hemiLight.groundColor.setHex(0x4b6e56);
    MAY.hemiLight.intensity = 0.78;
    MAY.diveLight.intensity = 0.12;
    MAY.diveLight.castShadow = false;
    MAY.setAmbientTone(380, 0.04, "hub");
    MAY.setPostGrade({ tint: 0xfffdf8, vignette: 0.22, bloom: 0.30, ssao: 0.50 });

    ctx.getSurface = function (x, z) {
      if (Math.abs(x) < 3.4 && z > 21 && z < 36) return "wood";
      return ctx.groundH(x, z) < 1.9 ? "sand" : "grass";
    };

    ctx.landFog = { color: 0xaadbf2, density: 0.0042 };
    ctx.underwaterFog = { color: 0x075a78, density: 0.024 };
    MAY.scene.fog = new THREE.FogExp2(ctx.landFog.color, ctx.landFog.density);
    MAY.scene.background = new THREE.Color(ctx.landFog.color);

    ctx.addSky({
      zenith: 0x1a6cc4,
      horizon: 0xb7e4f8,
      ground: 0x0a4a68,
      sunDir: new THREE.Vector3(36, 44, 26),
      sunColor: 0xfff6d4,
      cloudColor: 0xffffff,
      cloudAmt: 0.52
    });

    /* Địa hình Đảo Mây có bờ cát thoai thoải, đồi cỏ xanh ở trung tâm và lòng vịnh quanh đảo */
    ctx.groundH = function (x, z) {
      var d = Math.hypot(x, z);
      var und = Math.sin(x * 0.14) * Math.cos(z * 0.13) * 0.42 + Math.sin(x * 0.31 + 1.2) * Math.cos(z * 0.27) * 0.18;
      if (d < 14) return 4.6 + und * 0.45 + (14 - d) * 0.08;
      if (d < 34) {
        var t = (d - 14) / 20;
        var sm = t * t * (3 - 2 * t);
        return 4.6 * (1 - sm) + (-2.4) * sm + und * 0.6;
      }
      return -2.4 - Math.min(4.5, (d - 34) * 0.12) + und * 0.5;
    };

    /* Kết hợp địa hình cỏ-cát mượt theo độ cao (đáy biển -> cát ẩm -> cát vàng -> cỏ xanh) */
    var islandMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.forestGround.map,
      normalMap: MAY.PBR.forestGround.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: MAY.PBR.forestGround.roughnessMap,
      roughness: 0.92,
      vertexColors: true
    });
    var tGeo = new THREE.PlaneGeometry(170, 170, 110, 110);
    tGeo.rotateX(-Math.PI / 2);
    var pos = tGeo.attributes.position;
    var cols = new Float32Array(pos.count * 3);
    var cSand = new THREE.Color(0xe6cf9a), cWet = new THREE.Color(0x9a8862), cGrass = new THREE.Color(0x88c96b), tmp = new THREE.Color();
    for (var i = 0; i < pos.count; i++) {
      var vx = pos.getX(i), vz = pos.getZ(i);
      var vy = ctx.groundH(vx, vz);
      pos.setY(i, vy);
      if (vy < 0.35) tmp.copy(cWet).lerp(cSand, Math.max(0, (vy + 1.8) / 2.15));
      else if (vy < 2.2) tmp.copy(cSand).lerp(cGrass, (vy - 0.35) / 1.85);
      else tmp.copy(cGrass);
      cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
    }
    tGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    tGeo.computeVertexNormals();
    MAY.applyCaustics(islandMat, 0.0, 0.55);
    var islandMesh = new THREE.Mesh(tGeo, islandMat);
    islandMesh.receiveShadow = true;
    ctx.add(islandMesh);

    /* Mặt biển Gerstner chân thực với phản chiếu trời, bọt bờ đảo & sóng rẽ nước quanh Mây */
    ctx.addWater({
      width: 300, height: 300, segs: 88, y: 0.0,
      sunDir: new THREE.Vector3(36, 44, 26),
      deepColor: 0x04304c, shallowColor: 0x16879c, skyColor: 0xaadbf5,
      foamCenter: new THREE.Vector3(0, 0, 0), foamRadius: 26.8, waveAmp: 0.22
    });

    /* Vật liệu đá kè & gỗ cầu cảng có Normal/Roughness thật (phong cách ảnh 3) */
    var quayMat = new THREE.MeshStandardMaterial({
      map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap,
      normalScale: new THREE.Vector2(1.4, 1.4), roughnessMap: MAY.PBR.stoneWall.roughnessMap, roughness: 0.85
    });
    MAY.applyCaustics(quayMat, 0.0, 0.45);
    var dockWoodMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: 0xb89674, roughness: 0.85 });
    MAY.attachPhotoPBR("wood", MAY.TEX.wood, [dockWoodMat], { rx: 2, ry: 2, normalStrength: 3.0, rMin: 0.5, rMax: 0.95 });

    /* Bến đá & Cầu gỗ phía Nam + Con thuyền khám phá có mái che dập dềnh (gợi nhớ ảnh 3!) */
    var pier = new THREE.Group();
    var quayWall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.6, 12.0), quayMat);
    quayWall.position.set(0, 0.4, 28); quayWall.castShadow = true; quayWall.receiveShadow = true;
    pier.add(quayWall);
    for (var pl = 0; pl < 14; pl++) {
      var plank = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 0.82), dockWoodMat);
      plank.position.set(0, 2.28, 22.5 + pl * 0.92);
      plank.castShadow = true; plank.receiveShadow = true;
      pier.add(plank);
    }
    [-2.6, 2.6].forEach(function (px) {
      [24, 29, 34].forEach(function (pz) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.6, 10), dockWoodMat);
        post.position.set(px, 1.5, pz); post.castShadow = true;
        pier.add(post);
      });
    });
    /* Đèn lồng sắt kiến trúc phát ánh sáng ấm thực tế trên 2 đầu cầu cảng (phong cách The Hall + Ảnh 3) */
    var lan1 = MAY.makeCagedLantern(0xffd480, 2.2, 22, false);
    lan1.position.set(2.6, 3.65, 34); pier.add(lan1);
    var lan2 = MAY.makeCagedLantern(0xffd480, 1.6, 18, false);
    lan2.position.set(-2.6, 3.65, 24); pier.add(lan2);
    /* Cọc buộc dây neo bằng sắt & dây thừng trên bến đá */
    var ironM = new THREE.MeshStandardMaterial({ color: 0x222830, metalness: 0.82, roughness: 0.35 });
    [-3.4, 3.4].forEach(function (bx) {
      var bol = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55, 10), ironM);
      bol.position.set(bx, 2.45, 32.5); bol.castShadow = true; pier.add(bol);
    });
    ctx.add(pier);

    /* Con thuyền gỗ có mái che neo cạnh bến đá */
    var boat = new THREE.Group();
    var hullDark = new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: 0x4f3b2b, roughness: 0.78 });
    MAY.attachPhotoPBR("wood", MAY.TEX.wood, [hullDark], { rx: 2, ry: 2, normalStrength: 2.8 });
    var hullBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.15, 7.2), hullDark);
    hullBody.position.y = 0.25; boat.add(hullBody);
    var bow = new THREE.Mesh(new THREE.ConeGeometry(1.55, 2.5, 4), hullDark);
    bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1.25, 1, 0.52); bow.position.set(0, 0.35, 4.7);
    boat.add(bow);
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 3.2), new THREE.MeshStandardMaterial({ color: 0xebe6dc, roughness: 0.7 }));
    cabin.position.set(0, 1.35, -0.4); boat.add(cabin);
    var roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 4.2), new THREE.MeshStandardMaterial({ color: 0x2c4b68, roughness: 0.55 }));
    roof.position.set(0, 2.1, -0.2); boat.add(roof);
    /* Đèn mũi thuyền ấm + Cột buồm nhỏ trên thuyền gỗ */
    var boatLan = MAY.makeCagedLantern(0xffe094, 1.5, 14, false);
    boatLan.position.set(0, 2.55, 1.9); boat.add(boatLan);
    boat.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    boat.position.set(-8.5, -0.1, 35.5); boat.rotation.y = 0.45;
    ctx.add(boat);

    /* ---- NGỌN HẢI ĐĂNG CẦU VỒNG (Trung tâm cốt truyện 6 Viên Ngọc!) ---- */
    var lh = new THREE.Group();
    var lhY = ctx.groundH(0, 0);
    lh.position.set(0, lhY, 0);

    var lhBase = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.5, 2.4, 16), quayMat);
    lhBase.position.y = 1.2; lhBase.castShadow = true; lhBase.receiveShadow = true; lh.add(lhBase);

    var stripeCols = [0xf5f5f5, 0xe6495c, 0xf5f5f5, 0xe6495c, 0xf5f5f5];
    for (var st = 0; st < 5; st++) {
      var rBot = 2.9 - st * 0.22, rTop = 2.68 - st * 0.22;
      var seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 2.3, 18),
        new THREE.MeshStandardMaterial({ color: stripeCols[st], roughness: 0.65 }));
      seg.position.y = 3.5 + st * 2.3; seg.castShadow = true; seg.receiveShadow = true;
      lh.add(seg);
    }
    var gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.1, 0.5, 18), new THREE.MeshStandardMaterial({ color: 0x2a3b4c, metalness: 0.4, roughness: 0.4 }));
    gallery.position.y = 14.0; lh.add(gallery);
    var lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 2.3, 16),
      new THREE.MeshPhysicalMaterial({ color: 0xfff6cc, emissive: 0xffd93d, emissiveIntensity: 0.7 + MAY.save.gems.length * 0.2, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.85 }));
    lanternGlass.position.y = 15.4; lh.add(lanternGlass);
    var dome = new THREE.Mesh(new THREE.ConeGeometry(2.05, 1.8, 16), new THREE.MeshStandardMaterial({ color: 0xd94848, roughness: 0.45 }));
    dome.position.y = 17.4; lh.add(dome);

    var lhLight = new THREE.PointLight(0xffe699, 1.2 + MAY.save.gems.length * 0.35, 38);
    lhLight.position.y = 15.5; lh.add(lhLight);

    /* Chùm tia hải đăng xoay */
    var beamPivot = new THREE.Group();
    beamPivot.position.y = 15.4;
    var beamMat = MAY.makeGodRayMat(0xfff1a8, 0.22 + MAY.save.gems.length * 0.05);
    var beamCone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 34, 14, 1, true), beamMat);
    beamCone.rotation.z = -Math.PI / 2; beamCone.position.x = 18;
    beamPivot.add(beamCone);
    lh.add(beamPivot);

    /* 6 Hốc Viên Ngọc Sắc Màu quanh chân Ngọn Hải Đăng */
    var gemOrbs = [];
    MAY.LEVEL_META.slice(1).forEach(function (m, idx) {
      var a = (idx / 6) * Math.PI * 2 - Math.PI / 2;
      var gx = Math.cos(a) * 4.4, gz = Math.sin(a) * 4.4;
      var ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 1.3, 10), quayMat);
      ped.position.set(gx, 0.65, gz); ped.castShadow = true; lh.add(ped);
      var has = MAY.save.gems.indexOf(m.num) !== -1;
      var orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0),
        new THREE.MeshPhysicalMaterial({
          color: has ? m.gemColor : 0x64748b,
          emissive: has ? m.gemColor : 0x000000,
          emissiveIntensity: has ? 1.15 : 0,
          roughness: 0.12, metalness: 0.2, clearcoat: 1.0, transparent: true, opacity: has ? 0.96 : 0.35
        }));
      orb.position.set(gx, 1.95, gz);
      lh.add(orb);
      gemOrbs.push(orb);
    });

    var lhSign = MAY.makeLabel("🌈 HẢI ĐĂNG CẦU VỒNG (" + MAY.save.gems.length + "/6)", { w: 460, sx: 5.5, sy: 1.0 });
    lhSign.position.set(0, 19.6, 0); lh.add(lhSign);
    ctx.trackLabel(lhSign, 30);
    /* Vòng Rune chân Hải Đăng + Cửa vòm đá có khung */
    var lhRune = MAY.VFX.makeRunePlane(5.8, 0xffd93d, 0.42); lhRune.position.y = 0.14; lh.add(lhRune);
    var lhDoor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x4b3220, roughness: 0.85 }));
    lhDoor.position.set(0, 1.1, 4.15); lh.add(lhDoor);
    var lhDoorLan = MAY.makeCagedLantern(0xffd480, 1.8, 16, false);
    lhDoorLan.position.set(0, 2.6, 4.4); lh.add(lhDoorLan);
    ctx.add(lh);
    ctx.addCollider(0, 0, 4.5, "lighthouse");
    ctx.addCollider(cabX, cabZ, 3.0, "cabin");

    /* ---- CỐT TRUYỆN ĐẢO MÂY: Cụ Rùa Già Gác Đèn (!) + Cây Anh Đào Khô Bí Mật (Hồi sinh bằng 🌿!) ---- */
    var hubSt = ctx.story;
    var hubScripts = MAY.STORY_SCRIPTS.hub;
    var sakuraTree = MAY.buildDeadTree(ctx, 15.5, -1.5, { scale: 0.92, blossomColor: 0xffa6c9, flowerColor: 0xffe4f0, spawnBounce: false });
    if (hubSt.steps.sakura) sakuraTree.revive(true);

    ctx.addSkillTarget({
      id: "hub_sakura", pos: sakuraTree.pos, radius: 7.5, reqSpell: "growth",
      hint: "🌿 Hồi sinh Cây Anh Đào Khô", done: !!hubSt.steps.sakura,
      isActive: function () { return MAY.isSpellUnlocked("growth") && !hubSt.steps.sakura; },
      onHit: function (sp, tg) {
        hubSt.steps.sakura = true;
        MAY.persist();
        sakuraTree.revive(false);
        tg.markDone();
        MAY.sndGem();
        MAY.toast("🌸 Kỳ diệu quá! Cây Anh Đào Kỷ Niệm nở rực khắp Đảo Mây!", "Kỳ diệu quá! Cây cổ thụ đã hồi sinh nở hoa rực rỡ rồi!");
      }
    });

    var hubNpc = ctx.addQuestNPC({
      kind: "tortoise", name: hubScripts.npcName, icon: hubScripts.npcIcon,
      pos: [0, 13.5], rotY: 0, scale: 1.35, labelY: 2.2, autoGreet: !hubSt.steps.introDone,
      onTalk: function (npc) {
        if (MAY.save.gems.length >= 6) {
          MAY.openDialogue({
            name: hubScripts.npcName, role: hubScripts.npcRole, icon: hubScripts.npcIcon, color: hubScripts.npcColor,
            pages: hubScripts.complete, endBtn: "🎉 Tận hưởng Lễ Hội Cầu Vồng!", voiceClip: "finale"
          });
        } else if (MAY.isSpellUnlocked("growth") && !hubSt.steps.sakura) {
          MAY.openDialogue({
            name: hubScripts.npcName, role: hubScripts.npcRole, icon: hubScripts.npcIcon, color: hubScripts.npcColor,
            pages: hubScripts.treeQuestIntro, endBtn: "🌿 Mây đi hồi sinh Cây Anh Đào!",
            onDone: function () { ctx.setObjective("🌿", "HỒI SINH CÂY ANH ĐÀO KHÔ CẠNH NHÀ GỖ", sakuraTree.pos); }
          });
        } else if (!hubSt.steps.introDone) {
          MAY.openDialogue({
            name: hubScripts.npcName, role: hubScripts.npcRole, icon: hubScripts.npcIcon, color: hubScripts.npcColor,
            pages: hubScripts.intro, endBtn: hubScripts.introBtn, voiceClip: "npc_hub",
            onDone: function () {
              hubSt.steps.introDone = true;
              MAY.persist();
              npc.setMarker("?");
              var nextId = MAY.nextRecommendedLevel();
              var nm = MAY.getMeta(nextId);
              ctx.setObjective(nm.icon, "ĐI TỚI " + nm.title.toUpperCase() + " (CỔNG HOẶC PHÍM M)", new THREE.Vector3(-13.8, ctx.groundH(-13.8, -13.8) + 2, -13.8));
              MAY.toast("🗺️ Hãy bước qua Cổng Vịnh San Hô hoặc bấm M mở Bản Đồ để bắt đầu Chương 1!");
            }
          });
        } else {
          MAY.openDialogue({
            name: hubScripts.npcName, role: hubScripts.npcRole, icon: hubScripts.npcIcon, color: hubScripts.npcColor,
            pages: hubSt.steps.sakura ? hubScripts.treeQuestDone.concat(hubScripts.inProgress) : hubScripts.inProgress,
            endBtn: "🗺️ Mở Bản Đồ 6 Chương",
            onDone: function () { MAY.openMap(); }
          });
        }
      }
    });
    if (MAY.save.gems.length >= 6) {
      hubNpc.setMarker("♥");
      ctx.setObjective("🎉", "ĐẠI TIỆC CẦU VỒNG TRÊN ĐẢO MÂY (6/6 NGỌC)!", null);
    } else if (!hubSt.steps.introDone) {
      hubNpc.setMarker("!");
      ctx.setObjective("💬", "TRÒ CHUYỆN VỚI CỤ RÙA GIÀ GÁC ĐÈN (!)", hubNpc.pos);
    } else if (MAY.isSpellUnlocked("growth") && !hubSt.steps.sakura) {
      hubNpc.setMarker("!");
      ctx.setObjective("🌿", "HỒI SINH CÂY ANH ĐÀO KHÔ CẠNH NHÀ GỖ", sakuraTree.pos);
    } else {
      hubNpc.setMarker("?");
      var nextM = MAY.getMeta(MAY.nextRecommendedLevel());
      ctx.setObjective(nextM.icon, "TIẾP TỤC " + nextM.title.toUpperCase() + " (PHÍM M)", null);
    }

    /* Nếu Mây đã gom đủ 6 Viên Ngọc -> Cầu Vồng Khổng Lồ bắc qua Đảo Mây + Lễ Hội! */
    var festivalActive = MAY.save.gems.length >= 6;
    var fireworkTimer = 0;
    if (festivalActive) {
      var rbCols = [0xff595e, 0xff924c, 0xffca3a, 0x8ac926, 0x1982c4, 0x9b5de5];
      rbCols.forEach(function (col, idx) {
        var arc = new THREE.Mesh(
          new THREE.TorusGeometry(32 - idx * 0.9, 0.42, 10, 48, Math.PI),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.72 })
        );
        arc.position.set(0, 3.0, 0);
        ctx.add(arc);
      });
      var spirit = MAY.makeAnimal("windspirit", { scale: 1.15 });
      spirit.position.set(4.5, ctx.groundH(4.5, 7) + 1.2, 7);
      ctx.add(spirit);
      var spLb = MAY.makeLabel("🌬️ Làn Gió Mát (Bạn thân Mây!)", { w: 400, sx: 4.5, sy: 0.95 });
      spLb.position.set(4.5, ctx.groundH(4.5, 7) + 3.6, 7);
      ctx.add(spLb);
    }

    /* ---- Nhà gỗ của Mây & Khung ảnh "Nhà của Mây" ---- */
    var cabinG = new THREE.Group();
    var cabX = 11, cabZ = -7, cabY = ctx.groundH(cabX, cabZ);
    var cabWalls = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, 3.8), dockWoodMat);
    cabWalls.position.y = 1.4; cabWalls.castShadow = true; cabWalls.receiveShadow = true; cabinG.add(cabWalls);
    var cabRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0xc26d3a, roughness: 0.85 }));
    cabRoof.position.y = 3.8; cabRoof.rotation.y = Math.PI / 4; cabRoof.castShadow = true; cabinG.add(cabRoof);
    var cabWin = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.05), new THREE.MeshBasicMaterial({ color: 0xffe49e }));
    cabWin.position.set(0, 1.5, 1.92); cabinG.add(cabWin);
    /* Khung cửa sổ & hiên nhà gỗ chi tiết + đèn lồng treo hiên */
    var trimM = new THREE.MeshStandardMaterial({ color: 0x4b3220, roughness: 0.88 });
    var mullH = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.08, 0.08), trimM); mullH.position.set(0, 1.5, 1.95); cabinG.add(mullH);
    var mullV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.12, 0.08), trimM); mullV.position.set(0, 1.5, 1.95); cabinG.add(mullV);
    var porch = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 1.6), dockWoodMat); porch.position.set(0, 0.15, 2.6); porch.receiveShadow = true; cabinG.add(porch);
    var cabLan = MAY.makeCagedLantern(0xffd27d, 1.9, 18, false); cabLan.position.set(1.6, 2.4, 2.6); cabinG.add(cabLan);
    cabinG.add(MAY.makeContactShadow(3.6, 0.55));
    cabinG.position.set(cabX, cabY, cabZ); cabinG.rotation.y = -0.6;
    ctx.add(cabinG);

    /* Khung ảnh bé Mây */
    var frameG = new THREE.Group();
    var frBox = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 0.16), new THREE.MeshStandardMaterial({ color: 0xd9a400, roughness: 0.3, metalness: 0.7 }));
    var frPic = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 2.85), new THREE.MeshBasicMaterial({ map: MAY.TEX.hero }));
    frPic.position.z = 0.09;
    var frLb = MAY.makeLabel("📷 Nhà của Mây", { sx: 3.2, sy: 0.9 }); frLb.position.y = 2.1;
    frameG.add(frBox, frPic, frLb);
    frameG.position.set(8.5, ctx.groundH(8.5, -2) + 1.8, -2); frameG.rotation.y = -0.8;
    ctx.add(frameG);

    /* Cây dừa chân thực + Cây tán lá + 360 bụi cỏ gió thổi + Đá bờ biển */
    [[-14, 12, 1.15], [16, 10, 1.05], [-16, -9, 1.1], [14, -15, 1.0], [-5, 18, 0.95], [7, 17, 1.05]].forEach(function (p) {
      var pm = MAY.makeRealisticPalm(p[2]);
      pm.position.set(p[0], ctx.groundH(p[0], p[1]) - 0.15, p[1]);
      pm.rotation.y = p[0] * 0.7;
      ctx.add(pm);
    });
    [[-10, -14, 1.0], [18, -1, 0.9], [-18, 2, 0.95]].forEach(function (p) {
      var tr = MAY.makeRealisticTree(p[2], 0x8fd674);
      tr.position.set(p[0], ctx.groundH(p[0], p[1]) - 0.1, p[1]);
      ctx.add(tr);
    });
    MAY.scatterLushMeadow(ctx, 1300, function (x, z) {
      var d = Math.hypot(x, z);
      return d > 5.8 && d < 22 && ctx.groundH(x, z) > 1.75;
    }, { spread: 25, color: 0x9ce376, w: 0.9, h: 0.78, flowers: true });

    /* Sỏi đá nhỏ ven bãi cát & Quần đảo mờ xa ngoài khơi (Distant Vista) */
    MAY.scatterDebris(ctx, 140, function (x, z) {
      var h = ctx.groundH(x, z);
      return h > -0.2 && h < 2.2;
    }, { spread: 30, size: 0.22, color: 0x8e8b82 });
    MAY.buildVistaRing(ctx, { count: 16, radius: 145, hMin: 12, hMax: 34, wBase: 28, baseY: -3, color: 0x4b748e });

    var rockMat = new THREE.MeshStandardMaterial({ map: MAY.TEX.rock, roughness: 0.88 });
    MAY.attachPhotoPBR("rock", MAY.TEX.rock, [rockMat], { rx: 2, ry: 2, normalStrength: 3.5, rMin: 0.45, rMax: 0.95 });
    for (var ri = 0; ri < 18; ri++) {
      var ra = (ri / 18) * Math.PI * 2 + 0.15, rr = 23 + (ri % 3) * 3.5;
      var rx = Math.cos(ra) * rr, rz = Math.sin(ra) * rr;
      if (Math.abs(rx) < 6 && rz > 18) continue;
      var rm = new THREE.Mesh(MAY.rockGeo(ri * 2.1), rockMat);
      var rs = 1.0 + (ri % 4) * 0.65;
      rm.scale.set(rs * 1.25, rs * 0.75, rs);
      rm.position.set(rx, ctx.groundH(rx, rz) + rs * 0.25, rz);
      rm.rotation.y = ri; rm.castShadow = true; rm.receiveShadow = true;
      ctx.add(rm);
    }

    /* ---- 6 Cổng Ánh Sáng dẫn thẳng tới 6 Màn Chơi ---- */
    MAY.LEVEL_META.slice(1).forEach(function (m, idx) {
      var a = (idx / 6) * Math.PI * 2 - Math.PI * 0.75;
      var px = Math.cos(a) * 19.5, pz = Math.sin(a) * 19.5;
      var got = MAY.save.gems.indexOf(m.num) !== -1;
      ctx.addPortal([px, pz], m.id, m.icon + " " + m.shortName + (got ? " ✓" : ""), m.gemColor);
    });

    /* ---- 3 Quả dừa + 4 Bạn trên đảo + Đàn chim + Cún Milo ---- */
    var cocoGeo = new THREE.SphereGeometry(0.36, 12, 10);
    var cocoMat = new THREE.MeshStandardMaterial({ color: 0x6b4a1f, roughness: 0.85, normalMap: MAY.PBR.bark.normalMap });
    ctx.addCollectibles([[-8, 11], [9, 13], [-12, -5]], {
      color: 0xd99b43, icon: "🥥", yOff: 0.45,
      makeMesh: function () { return new THREE.Mesh(cocoGeo, cocoMat); }
    });

    ctx.addFriends([
      { name: "Thỏ trắng", kind: "rabbit", pos: [-7, 5], greet: "🐇 Thỏ trắng nhảy cẫng chào Mây về Đảo Mây!" },
      { name: "Khỉ nâu",   kind: "monkey", pos: [11, 6], greet: "🐒 Khỉ nâu vẫy tay chúc Mây lên đường vui vẻ!" },
      { name: "Cua đỏ",    kind: "crab",   pos: [-16, 16], greet: "🦀 Cua đỏ kẹp càng chào Mây ngoài bãi cát!" },
      { name: "Rùa cạn",   kind: "tortoise", pos: [4, -13], greet: "🐢 Rùa cạn kể chuyện 6 Viên Ngọc Cầu Vồng cho Mây nghe!" }
    ]);

    ctx.setCompanion(MAY.hasGear(6) ? "miloWinged" : "milo", "🐶 Milo");

    var birds = [];
    [["Mòng biển", 0xffffff, 26, 18], ["Vẹt xanh", 0x2ee6a8, 22, 21], ["Vẹt đỏ", 0xff6b6b, 28, 23], ["Hải âu", 0xe8f4fa, 34, 17]].forEach(function (bd, bi) {
      var bg = MAY.makeAnimal("bird", { color: bd[1] });
      ctx.add(bg);
      birds.push({ g: bg, r: bd[2], h: bd[3], a: bi * 1.5, sp: 0.26 + bi * 0.03, ph: bi * 1.6 });
    });

    ctx.minimapDrawExtra = function (mm, C, K) {
      mm.fillStyle = "#5cb85c";
      mm.beginPath(); mm.arc(C, C, 26 * K, 0, 6.29); mm.fill();
    };

    ctx.onUpdate = function (dt, t) {
      sakuraTree.update(dt);
      beamPivot.rotation.y += dt * 0.55;
      gemOrbs.forEach(function (o, i) { o.rotation.y += dt * 1.4; o.position.y = 1.95 + Math.sin(t * 2.4 + i) * 0.14; });
      boat.position.y = -0.1 + Math.sin(t * 1.4) * 0.14;
      boat.rotation.z = Math.sin(t * 1.1) * 0.04;
      boat.rotation.x = Math.cos(t * 0.9) * 0.03;

      birds.forEach(function (b) {
        b.a += b.sp * dt;
        var bx = Math.cos(b.a) * b.r, bz = Math.sin(b.a) * b.r;
        b.g.position.set(bx, b.h + Math.sin(t + b.ph) * 0.9, bz);
        b.g.rotation.y = -b.a;
        var fl = Math.sin(t * 9 + b.ph) * 0.6;
        if (b.g.userData.wl) { b.g.userData.wl.rotation.z = fl; b.g.userData.wr.rotation.z = -fl; }
      });

      if (festivalActive) {
        fireworkTimer -= dt;
        if (fireworkTimer <= 0) {
          fireworkTimer = 2.4;
          var fa = Math.random() * 6.28;
          var cols = [0xff595e, 0xffca3a, 0x8ac926, 0x4dd0ff, 0xd980fa];
          MAY.burstAt(new THREE.Vector3(Math.cos(fa) * 14, 15 + Math.random() * 7, Math.sin(fa) * 14), cols[Math.floor(Math.random() * cols.length)], 18);
        }
      }
    };

    var spawnY = ctx.groundH(0, 20) + 1.05;
    MAY.player.spawnAt(0, spawnY, 20, 0, false);
    return ctx;
  };

})(window.MAY);
