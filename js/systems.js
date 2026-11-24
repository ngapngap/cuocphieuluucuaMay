"use strict";
/* ============================================================================
   SYSTEMS — Nhà máy thú 3D, World Context dùng chung cho 6 màn, HUD, Bản đồ & Sổ tay
   ============================================================================ */
(function (MAY) {

  MAY.modalOpen = false;
  MAY.started = false;
  MAY.currentCtx = null;
  MAY.currentLevelId = "hub";

  /* ---- Toast & HUD ---- */
  var toastTimer = null;
  MAY.toast = function (msg, say) {
    var t = document.getElementById("toast");
    if (t) {
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3000);
    }
    if (say) MAY.speak(say);
  };

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  MAY.refreshHUD = function () {
    var ctx = MAY.currentCtx;
    var meta = MAY.getMeta(ctx ? ctx.id : MAY.currentLevelId);
    var ls = MAY.getLevelSave(meta.id);

    setText("obj-sub", meta.title.toUpperCase());
    if (ctx && ctx.storyObjective) {
      setText("obj-icon", ctx.storyObjective.icon || "✨");
      setText("obj-word", ctx.storyObjective.text);
    } else {
      setText("obj-icon", meta.collectIcon);
      setText("obj-word", meta.id === "hub" ? "NHẶT QUẢ DỪA" : "TÌM " + meta.collectName.toUpperCase());
    }
    setText("star-n", ls.items.length);
    setText("star-max", meta.collectTarget);
    setText("star-n2", ls.items.length);
    setText("big-icon", meta.collectIcon);
    setText("big-label", meta.collectName.toUpperCase());
    if (MAY.syncHeartsHUD) MAY.syncHeartsHUD(false);

    setText("gem-n", MAY.save.gems.length);
    setText("fr-n", ls.friends.length);
    setText("fr-max", meta.friendTarget);

    var pillTr = document.getElementById("pill-tr");
    if (pillTr) {
      pillTr.style.display = meta.treasureTarget > 0 ? "inline-block" : "none";
      setText("tr-n", ls.treasures.length);
      setText("tr-max", meta.treasureTarget);
    }
    var pillSh = document.getElementById("pill-sh");
    if (pillSh) {
      pillSh.style.display = meta.souvenirTarget > 0 ? "inline-block" : "none";
      setText("sh-icon", meta.souvenirIcon);
      setText("sh-n", ls.souvenirs.length);
      setText("sh-max", meta.souvenirTarget);
    }
    var pillCo = document.getElementById("pill-co");
    if (pillCo) {
      pillCo.style.display = meta.interactTarget > 0 ? "inline-block" : "none";
      setText("co-icon", meta.interactIcon);
      setText("co-n", ls.interacts.length);
      setText("co-max", meta.interactTarget);
    }
    var pillCh = document.getElementById("pill-ch");
    if (pillCh) {
      var doneCh = Object.keys(ls.challenges).filter(function (k) { return ls.challenges[k]; }).length;
      pillCh.style.display = meta.id === "hub" ? "none" : "inline-block";
      setText("ch-n", doneCh);
    }
    setText("zone-pill", meta.icon + " " + meta.shortName);
    setText("diver-role", MAY.player.onLand ? "MÂY KHÁM PHÁ" : "MÂY ĐANG LẶN");
  };

  /* ---- Raycast tương tác ---- */
  var raycaster = new THREE.Raycaster();
  var rayCenter = new THREE.Vector2(0, 0);
  var currentTarget = null;
  var interactEl = document.getElementById("interact");
  var rayTimer = 0;

  function findInteractive(o, list) {
    while (o) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].obj === o) return list[i];
      }
      o = o.parent;
    }
    return null;
  }

  function updateRaycast(dt, ctx) {
    rayTimer -= dt;
    if (rayTimer > 0) return;
    rayTimer = 0.12;
    if (!MAY.started || MAY.modalOpen || !ctx || !ctx.interactives.length) {
      if (interactEl) interactEl.style.display = "none";
      currentTarget = null;
      return;
    }
    raycaster.setFromCamera(rayCenter, MAY.camera);
    raycaster.far = 14;
    var objs = [];
    for (var i = 0; i < ctx.interactives.length; i++) {
      if (ctx.interactives[i].obj && ctx.interactives[i].obj.visible) objs.push(ctx.interactives[i].obj);
    }
    var hits = raycaster.intersectObjects(objs, true);
    var found = null;
    for (var h = 0; h < hits.length; h++) {
      var it = findInteractive(hits[h].object, ctx.interactives);
      if (it) { found = it; break; }
    }
    /* Nếu đứng gần NPC Giao Nhiệm Vụ trong 5.5m thì luôn hiện nút trò chuyện tiện lợi! */
    if (!found && ctx.questNPCs && ctx.questNPCs.length && MAY.player) {
      var bestNd = 5.6;
      for (var q = 0; q < ctx.questNPCs.length; q++) {
        var npc = ctx.questNPCs[q];
        var nd = npc.group.position.distanceTo(MAY.player.pos);
        if (nd < bestNd) {
          bestNd = nd;
          found = { obj: npc.group, label: "Trò chuyện với " + npc.name + " (Bấm / Enter)", onInteract: function () { if (npc.onTalk) npc.onTalk(npc); } };
        }
      }
    }
    currentTarget = found;
    if (interactEl) {
      if (found) {
        interactEl.textContent = "👆 " + found.label;
        interactEl.style.display = "block";
      } else {
        interactEl.style.display = "none";
      }
    }
  }

  MAY.doInteract = function (clientX, clientY) {
    var ctx = MAY.currentCtx;
    /* Cho phép click trực tiếp vào BẤT KỲ NPC, Rương, Hoa, Trạm đố nào dưới con trỏ chuột (không bắt buộc căn dấu chấm giữa màn hình!) */
    if (typeof clientX === "number" && typeof clientY === "number" && ctx && ctx.interactives && ctx.interactives.length) {
      var ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, MAY.camera);
      raycaster.far = 26;
      var objs = [];
      for (var i = 0; i < ctx.interactives.length; i++) {
        if (ctx.interactives[i].obj && ctx.interactives[i].obj.visible) objs.push(ctx.interactives[i].obj);
      }
      var hits = raycaster.intersectObjects(objs, true);
      var pPos = MAY.player ? MAY.player.pos : MAY.camera.position;
      for (var h = 0; h < hits.length; h++) {
        if (hits[h].point.distanceTo(pPos) > 14) continue;
        var it = findInteractive(hits[h].object, ctx.interactives);
        if (it && it.onInteract) { it.onInteract(it); return; }
      }
    }
    if (!currentTarget) return;
    if (currentTarget.onInteract) currentTarget.onInteract(currentTarget);
  };

  /* ---- Nhà máy tạo bạn thú 3D siêu dễ thương cho cả 6 màn ---- */
  function stdMat(hex, rough, extra) {
    var o = { color: hex, roughness: rough !== undefined ? rough : 0.75 };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return new THREE.MeshStandardMaterial(o);
  }
  var blackEye = new THREE.MeshBasicMaterial({ color: 0x1a1a2a });

  var eyeGlintM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  function addEyes(g, xOff, y, z, r) {
    var rad = r || 0.055;
    [-xOff, xOff].forEach(function (ex) {
      var e = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 8), blackEye);
      e.position.set(ex, y, z); g.add(e);
      var gl = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.34, 6, 5), eyeGlintM);
      gl.position.set(ex + rad * 0.25, y + rad * 0.28, z - rad * 0.72); g.add(gl);
    });
  }

  function addLegs(g, mat, dx, dz, h, r) {
    [[-dx, -dz], [dx, -dz], [-dx, dz], [dx, dz]].forEach(function (p) {
      var l = new THREE.Mesh(new THREE.CylinderGeometry(r || 0.06, r || 0.06, h || 0.35, 6), mat);
      l.position.set(p[0], (h || 0.35) / 2, p[1]);
      g.add(l);
    });
  }

  MAY.fishBody = function (color, len, species) {
    var g = new THREE.Group();
    g.userData.fishColor = color;
    g.userData.fishLen = len || 1.6;
    g.userData.fishSpecies = species || 0;
    if (MAY.modelsReady) {
      var glb = MAY.cloneFish(color, len || 1.6, species || 0);
      if (glb) { g.add(glb); return g; }
    }
    var mat = stdMat(color, 0.55, { side: THREE.DoubleSide });
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mat);
    body.scale.set((len || 1.6) * 0.75, 0.75, 0.55);
    g.add(body);
    var tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 4), mat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-(len || 1.6) * 0.5, 0, 0);
    tail.scale.set(1, 1, 0.25);
    g.add(tail);
    [0.14, -0.14].forEach(function (z) {
      var e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), blackEye);
      e.position.set((len || 1.6) * 0.22, 0.1, z);
      g.add(e);
    });
    return g;
  };

  MAY.makeAnimal = function (kind, opts) {
    opts = opts || {};
    var g = new THREE.Group();
    g.rotation.order = "YXZ";

    if (kind === "milo" || kind === "miloWinged") {
      /* Nâng cấp hình khối Cún Milo hữu cơ bo tròn (CapsuleGeometry + vòng cổ đỏ + chuông vàng!) */
      var bm = stdMat(0xd49452, 0.82), em = stdMat(0x8a5628, 0.88), bellyM = stdMat(0xf7e1be, 0.88);
      var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.44, 8, 12), bm);
      body.rotation.x = Math.PI / 2; body.position.y = 0.46; g.add(body);
      var chest = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bellyM);
      chest.position.set(0, 0.46, -0.24); g.add(chest);
      [[-0.14, -0.24], [0.14, -0.24], [-0.14, 0.24], [0.14, 0.24]].forEach(function (lp) {
        var leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.22, 6, 8), bm);
        leg.position.set(lp[0], 0.19, lp[1]); g.add(leg);
        var paw = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 6), bellyM);
        paw.scale.set(1, 0.6, 1.25); paw.position.set(lp[0], 0.05, lp[1] - 0.03); g.add(paw);
      });
      var collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 8, 16), stdMat(0xff4d6d, 0.4));
      collar.rotation.x = Math.PI / 2 + 0.35; collar.position.set(0, 0.62, -0.34); g.add(collar);
      var tag = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), stdMat(0xffd93d, 0.25, { metalness: 0.7 }));
      tag.position.set(0, 0.54, -0.52); g.add(tag);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), bm); head.position.set(0, 0.76, -0.48); g.add(head);
      var snout = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), bellyM); snout.scale.set(1.0, 0.78, 1.15); snout.position.set(0, 0.69, -0.71); g.add(snout);
      [-0.21, 0.21].forEach(function (x) {
        var ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.18, 6, 8), em);
        ear.position.set(x, 0.78, -0.46); ear.rotation.z = x > 0 ? -0.42 : 0.42; g.add(ear);
      });
      addEyes(g, 0.10, 0.81, -0.72, 0.045);
      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), blackEye); nose.position.set(0, 0.72, -0.84); g.add(nose);
      var tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.30, 6, 8), bm);
      tail.position.set(0, 0.66, 0.48); tail.rotation.x = 0.75; g.add(tail);
      g.userData.tail = tail;
      if (kind === "miloWinged") {
        var wm = stdMat(0xffffff, 0.35, { emissive: 0xffb3ec, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
        var wl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), wm); wl.scale.set(1.4, 0.14, 0.65); wl.position.set(-0.46, 0.62, -0.05); g.add(wl);
        var wr = wl.clone(); wr.position.x = 0.46; g.add(wr);
        g.userData.wl = wl; g.userData.wr = wr;
      }
    } else if (kind === "rabbit") {
      var wm = stdMat(0xffffff, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), wm); b.scale.set(0.95, 0.85, 1.2); b.position.y = 0.42; g.add(b);
      var h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), wm); h.position.set(0, 0.8, -0.48); g.add(h);
      [-0.12, 0.12].forEach(function (ex) {
        var ear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6), wm);
        ear.position.set(ex, 1.25, -0.48); ear.rotation.x = -0.15; g.add(ear);
      });
      addEyes(g, 0.12, 0.86, -0.74, 0.045);
      var t = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), wm); t.position.set(0, 0.5, 0.56); g.add(t);
    } else if (kind === "monkey") {
      var m1 = stdMat(0x8a5a2b, 0.9), m2 = stdMat(0xe8c39a, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), m1); b.scale.set(0.95, 1.1, 0.85); b.position.y = 0.58; g.add(b);
      var h = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), m1); h.position.set(0, 1.26, 0); g.add(h);
      var f = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), m2); f.scale.set(1, 0.9, 0.5); f.position.set(0, 1.22, -0.22); g.add(f);
      addEyes(g, 0.1, 1.28, -0.35, 0.045);
      [-0.36, 0.36].forEach(function (ex) { var er = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), m2); er.position.set(ex, 1.32, 0); g.add(er); });
      var tail = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 12, Math.PI), m1); tail.position.set(0, 0.65, 0.45); tail.rotation.y = Math.PI / 2; g.add(tail);
    } else if (kind === "crab") {
      var rm = stdMat(0xe8483f, 0.6);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), rm); b.scale.set(1.3, 0.55, 1); b.position.y = 0.35; g.add(b);
      [-0.48, 0.48].forEach(function (x) {
        var cl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), rm); cl.position.set(x, 0.42, -0.62); g.add(cl);
        var st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 5), rm); st.position.set(x * 0.45, 0.72, -0.25); g.add(st);
      });
      addEyes(g, 0.21, 0.86, -0.26, 0.055);
    } else if (kind === "tortoise") {
      var gm = stdMat(0x4d9b57, 0.8), hm = stdMat(0x7cc48a, 0.8);
      var sh = new THREE.Mesh(new THREE.SphereGeometry(0.66, 14, 10), gm); sh.scale.set(1.0, 0.55, 1.2); sh.position.y = 0.44; g.add(sh);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), hm); hd.position.set(0, 0.52, -0.88); g.add(hd);
      addLegs(g, hm, 0.42, 0.42, 0.3, 0.1);
      addEyes(g, 0.1, 0.58, -1.08, 0.04);
    } else if (kind === "squirrel") {
      var m = stdMat(0xb86b35, 0.85), bel = stdMat(0xf5dec0, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), m); b.scale.set(0.9, 1.15, 0.9); b.position.y = 0.48; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), m); hd.position.set(0, 0.95, -0.22); g.add(hd);
      [-0.14, 0.14].forEach(function (x) { var er = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), m); er.position.set(x, 1.24, -0.2); g.add(er); });
      var nut = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), stdMat(0x7c4a1d, 0.8)); nut.position.set(0, 0.58, -0.46); g.add(nut);
      var fl = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bel); fl.scale.set(0.65, 1.4, 0.9); fl.position.set(0, 0.86, 0.48); fl.rotation.x = 0.35; g.add(fl);
      addEyes(g, 0.11, 1.0, -0.46, 0.045);
    } else if (kind === "deer" || kind === "reindeer") {
      var isRein = (kind === "reindeer");
      var m = stdMat(isRein ? 0x8d5b34 : 0xd08c4e, 0.85);
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.66, 8, 12), m); b.rotation.x = Math.PI / 2; b.position.y = 0.95; g.add(b);
      addLegs(g, m, 0.18, 0.40, 0.72, 0.06);
      var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.48, 6, 10), m); neck.position.set(0, 1.42, -0.50); neck.rotation.x = 0.32; g.add(neck);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), m); hd.scale.set(0.85, 0.9, 1.28); hd.position.set(0, 1.72, -0.72); g.add(hd);
      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), isRein ? stdMat(0xff2e4c, 0.3, { emissive: 0xff2e4c, emissiveIntensity: 0.85 }) : blackEye);
      nose.position.set(0, 1.68, -1.04); g.add(nose);
      addEyes(g, 0.12, 1.78, -0.92, 0.048);
      var antM = stdMat(0x5c3c1e, 0.9);
      [-0.14, 0.14].forEach(function (x) {
        var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.58, 6), antM);
        ant.position.set(x, 2.08, -0.66); ant.rotation.z = x > 0 ? -0.42 : 0.42; g.add(ant);
        var prong = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.28, 5), antM);
        prong.position.set(x * 1.9, 2.22, -0.66); prong.rotation.z = x > 0 ? 0.35 : -0.35; g.add(prong);
      });
      if (!isRein) {
        var spotM = stdMat(0xfff4d6, 0.9);
        [[-0.27, 1.05, 0.1], [0.27, 1.02, -0.15], [-0.27, 0.96, -0.25], [0.27, 1.08, 0.25]].forEach(function (sp) {
          var s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), spotM); s.position.set(sp[0], sp[1], sp[2]); g.add(s);
        });
      }
    } else if (kind === "fox" || kind === "fennec" || kind === "snowfox") {
      var col = kind === "snowfox" ? 0xf5fbff : kind === "fennec" ? 0xf4c989 : 0xf27127;
      var m = stdMat(col, 0.85), wh = stdMat(0xffffff, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), m); b.scale.set(0.85, 0.8, 1.4); b.position.y = 0.48; g.add(b);
      addLegs(g, m, 0.18, 0.32, 0.36, 0.055);
      var hd = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.56, 8), m); hd.rotation.x = -Math.PI / 2; hd.position.set(0, 0.72, -0.65); g.add(hd);
      var earH = kind === "fennec" ? 0.65 : 0.32;
      [-0.17, 0.17].forEach(function (x) {
        var er = new THREE.Mesh(new THREE.ConeGeometry(kind === "fennec" ? 0.16 : 0.1, earH, 6), m);
        er.position.set(x, 0.92 + earH * 0.25, -0.48); er.rotation.z = x > 0 ? -0.35 : 0.35; g.add(er);
      });
      var tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), wh); tail.scale.set(0.75, 0.75, 1.7); tail.position.set(0, 0.56, 0.75); g.add(tail);
      addEyes(g, 0.11, 0.77, -0.72, 0.045);
    } else if (kind === "butterfly") {
      var wm = stdMat(opts.color || 0x4dd0ff, 0.4, { emissive: 0x1a88c8, emissiveIntensity: 0.45, side: THREE.DoubleSide });
      var bd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.7, 6), stdMat(0x2a2438));
      bd.rotation.x = Math.PI / 2; g.add(bd);
      var wl = new THREE.Mesh(new THREE.CircleGeometry(0.65, 12), wm); wl.rotation.x = -Math.PI / 2; wl.position.set(-0.62, 0.05, 0); g.add(wl);
      var wr = wl.clone(); wr.position.x = 0.62; g.add(wr);
      g.userData.wl = wl; g.userData.wr = wr;
    } else if (kind === "panda" || kind === "polarbear") {
      var isPanda = (kind === "panda");
      var wh = stdMat(0xf8fbff, 0.9), dk = stdMat(isPanda ? 0x1d1f26 : 0xe4f1fa, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.58, 12, 10), wh); b.scale.set(1, 1.05, 0.95); b.position.y = 0.62; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), wh); hd.position.set(0, 1.32, -0.1); g.add(hd);
      [-0.3, 0.3].forEach(function (x) {
        var er = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), dk); er.position.set(x, 1.66, -0.05); g.add(er);
        var arm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), dk); arm.position.set(x * 1.75, 0.85, -0.18); g.add(arm);
        var leg = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), dk); leg.position.set(x * 1.1, 0.22, -0.2); g.add(leg);
      });
      addEyes(g, 0.14, 1.38, -0.48, isPanda ? 0.075 : 0.05);
      var ns = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 5), blackEye); ns.position.set(0, 1.26, -0.52); g.add(ns);
    } else if (kind === "camel") {
      var cm = stdMat(0xdcb06c, 0.88), dm = stdMat(0xb68642, 0.88);
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.78, 8, 12), cm); b.rotation.x = Math.PI / 2; b.position.y = 1.15; g.add(b);
      var hump = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10), dm); hump.scale.set(0.85, 1.0, 1.05); hump.position.set(0, 1.62, 0.05); g.add(hump);
      var saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.45, 10), stdMat(0xe63946, 0.75)); saddle.rotation.x = Math.PI / 2; saddle.position.set(0, 1.24, 0.05); g.add(saddle);
      addLegs(g, cm, 0.24, 0.48, 0.88, 0.08);
      var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.65, 6, 10), cm); neck.position.set(0, 1.62, -0.78); neck.rotation.x = 0.45; g.add(neck);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), cm); hd.scale.set(0.85, 0.85, 1.3); hd.position.set(0, 1.98, -1.08); g.add(hd);
      addEyes(g, 0.14, 2.04, -1.28, 0.05);
    } else if (kind === "lizard") {
      var lm = stdMat(0x88c456, 0.7);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), lm); b.scale.set(1.0, 0.5, 2.2); b.position.y = 0.24; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), lm); hd.position.set(0, 0.34, -0.78); g.add(hd);
      var tl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 6), lm); tl.rotation.x = Math.PI / 2; tl.position.set(0, 0.22, 1.15); g.add(tl);
      addEyes(g, 0.12, 0.44, -0.92, 0.05);
    } else if (kind === "meerkat") {
      var mm = stdMat(0xc99c68, 0.85), bm = stdMat(0x5b3f24, 0.9);
      var b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 10), mm); b.position.y = 0.48; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mm); hd.position.set(0, 1.06, -0.05); g.add(hd);
      var mask = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.12), bm); mask.position.set(0, 1.08, -0.24); g.add(mask);
      addEyes(g, 0.1, 1.08, -0.31, 0.045);
    } else if (kind === "bat" || kind === "bird" || kind === "eagle" || kind === "phoenix") {
      var col = opts.color || (kind === "bat" ? 0x9b6dff : kind === "eagle" ? 0xd99b26 : kind === "phoenix" ? 0xff6b9d : 0xffffff);
      var em = (kind === "bat" || kind === "phoenix") ? { emissive: col, emissiveIntensity: 0.45 } : null;
      var bm = stdMat(col, 0.55, em);
      var bd = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), bm); bd.scale.set(0.88, 0.82, 1.52); g.add(bd);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bm); hd.position.set(0, 0.18, -0.48); g.add(hd);
      if (kind !== "bat") {
        var beak = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.28, 8), stdMat(0xffa726));
        beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.15, -0.75); g.add(beak);
      } else {
        [-0.12, 0.12].forEach(function (x) { var er = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), bm); er.position.set(x, 0.39, -0.45); g.add(er); });
      }
      addEyes(g, 0.10, 0.22, -0.68, 0.048);
      /* Cánh lông vũ uốn lượn mềm mại nhiều tầng thay cho tấm hộp thô! */
      var wLen = kind === "eagle" || kind === "phoenix" ? 1.4 : 0.98;
      var wTipM = kind === "phoenix" ? stdMat(0xffd93d, 0.35, { emissive: 0xff9f43, emissiveIntensity: 0.55 }) : bm;
      function makeFeatherWing(side) {
        var piv = new THREE.Group();
        piv.position.set(side * 0.22, 0.10, -0.04);
        var inner = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bm);
        inner.scale.set(wLen * 1.05, 0.14, 0.68); inner.position.set(side * wLen * 0.42, 0, 0.02); piv.add(inner);
        var tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, wLen * 0.72, 8), wTipM);
        tip.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2; tip.scale.set(0.32, 1.0, 1.05);
        tip.position.set(side * wLen * 0.85, 0, 0.06); piv.add(tip);
        return piv;
      }
      var wl = makeFeatherWing(-1), wr = makeFeatherWing(1);
      g.add(wl, wr);
      g.userData.wl = wl; g.userData.wr = wr;
      if (kind === "phoenix") {
        var crest = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.38, 6), wTipM);
        crest.position.set(0, 0.46, -0.46); crest.rotation.x = -0.35; g.add(crest);
        [-0.22, 0, 0.22].forEach(function (tx, ti) {
          var pl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.15 - Math.abs(tx) * 0.8, 7), ti === 1 ? wTipM : bm);
          pl.rotation.x = Math.PI / 2; pl.rotation.z = tx * 0.8; pl.position.set(tx, 0.06, 0.92); g.add(pl);
        });
      }
    } else if (kind === "owl") {
      var om = stdMat(0x7c589c, 0.85), ym = new THREE.MeshBasicMaterial({ color: 0xffd93d });
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), om); b.scale.set(0.95, 1.25, 0.9); b.position.y = 0.62; g.add(b);
      [-0.15, 0.15].forEach(function (x) {
        var ring = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), ym); ring.position.set(x, 0.88, -0.38); g.add(ring);
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 5), om); ear.position.set(x * 1.6, 1.18, -0.1); g.add(ear);
      });
      addEyes(g, 0.15, 0.88, -0.47, 0.05);
      var bk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), stdMat(0xffa726)); bk.rotation.x = -Math.PI / 2; bk.position.set(0, 0.78, -0.48); g.add(bk);
    } else if (kind === "axolotl") {
      var pm = stdMat(0xff99cc, 0.45, { emissive: 0xff66b2, emissiveIntensity: 0.35 });
      var gm = stdMat(0xff4d94, 0.5, { emissive: 0xff4d94, emissiveIntensity: 0.5 });
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), pm); b.scale.set(0.9, 0.7, 1.8); g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), pm); hd.position.set(0, 0.05, -0.62); g.add(hd);
      [-0.36, 0.36].forEach(function (x) {
        for (var k = -1; k <= 1; k++) {
          var gill = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.32, 5), gm);
          gill.position.set(x, 0.08 + k * 0.1, -0.52); gill.rotation.z = x > 0 ? -1.1 : 1.1; g.add(gill);
        }
      });
      addEyes(g, 0.13, 0.12, -0.88, 0.05);
    } else if (kind === "mole") {
      var m = stdMat(0x54453c, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), m); b.scale.set(1, 0.9, 1.15); b.position.y = 0.42; g.add(b);
      var hat = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), stdMat(0xffd93d, 0.4));
      hat.position.set(0, 0.75, -0.15); g.add(hat);
      var blb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      blb.position.set(0, 0.85, -0.42); g.add(blb);
      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), stdMat(0xff9eb5)); nose.position.set(0, 0.48, -0.56); g.add(nose);
      addEyes(g, 0.13, 0.6, -0.45, 0.04);
    } else if (kind === "firefly" || kind === "shootingstar") {
      var col = kind === "firefly" ? 0xcaff70 : 0xffd93d;
      var orb = new THREE.Mesh(kind === "shootingstar" ? MAY.starGeo : new THREE.SphereGeometry(0.35, 12, 10),
        stdMat(col, 0.25, { emissive: col, emissiveIntensity: 0.95 }));
      if (kind === "shootingstar") orb.scale.setScalar(0.75);
      g.add(orb);
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: col, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(2.4, 2.4, 1); g.add(halo);
    } else if (kind === "penguin") {
      var dk = stdMat(0x1f2d3d, 0.7), wh = stdMat(0xffffff, 0.85);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), dk); b.scale.set(0.95, 1.35, 0.9); b.position.y = 0.56; g.add(b);
      var bel = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), wh); bel.scale.set(0.85, 1.15, 0.55); bel.position.set(0, 0.52, -0.24); g.add(bel);
      var beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 6), stdMat(0xff9f43)); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.88, -0.45); g.add(beak);
      var scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 14), stdMat(0xff4d6d)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.76; g.add(scarf);
      addEyes(g, 0.13, 0.96, -0.34, 0.045);
    } else if (kind === "seal") {
      var sm = stdMat(0xdbeafe, 0.75);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10), sm); b.scale.set(0.95, 0.75, 1.65); b.position.y = 0.35; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), sm); hd.position.set(0, 0.62, -0.68); g.add(hd);
      var ns = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), blackEye); ns.position.set(0, 0.6, -0.96); g.add(ns);
      addEyes(g, 0.12, 0.68, -0.9, 0.05);
    } else if (kind === "unicorn") {
      var wh = stdMat(0xffffff, 0.5), pn = stdMat(0xff99dd, 0.45, { emissive: 0xff66cc, emissiveIntensity: 0.32 });
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.66, 8, 12), wh); b.rotation.x = Math.PI / 2; b.position.y = 0.92; g.add(b);
      addLegs(g, wh, 0.19, 0.40, 0.68, 0.068);
      var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.46, 6, 10), wh); neck.position.set(0, 1.35, -0.50); neck.rotation.x = 0.35; g.add(neck);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), wh); hd.scale.set(0.85, 0.9, 1.28); hd.position.set(0, 1.66, -0.74); g.add(hd);
      var horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.55, 10), stdMat(0xffd93d, 0.18, { emissive: 0xffb703, emissiveIntensity: 0.72 }));
      horn.position.set(0, 2.02, -0.84); horn.rotation.x = 0.35; g.add(horn);
      for (var mn = 0; mn < 4; mn++) {
        var tuft = new THREE.Mesh(new THREE.SphereGeometry(0.13 - mn * 0.015, 8, 6), pn);
        tuft.position.set(0, 1.72 - mn * 0.16, -0.48 + mn * 0.10); g.add(tuft);
      }
      var utail = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 6, 8), pn);
      utail.position.set(0, 0.85, 0.68); utail.rotation.x = -0.45; g.add(utail);
      addEyes(g, 0.13, 1.70, -0.96, 0.048);
    } else if (kind === "sheep") {
      var fl = stdMat(0xffffff, 0.95), fc = stdMat(0xffd9b3, 0.85);
      for (var i = 0; i < 6; i++) {
        var puff = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), fl);
        var a = i / 6 * Math.PI * 2;
        puff.position.set(Math.cos(a) * 0.22, 0.55 + (i % 2) * 0.12, Math.sin(a) * 0.26);
        g.add(puff);
      }
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), fc); hd.position.set(0, 0.68, -0.56); g.add(hd);
      addEyes(g, 0.1, 0.74, -0.78, 0.045);
    } else if (kind === "windspirit") {
      /* Bé Gió Lốc Tí Hon dễ thương */
      var wm = stdMat(0xe0f7ff, 0.35, { emissive: 0x7fe3ff, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
      var c1 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.25, 14), wm); c1.rotation.x = Math.PI; c1.position.y = 0.65; g.add(c1);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), wm); hd.position.y = 1.38; g.add(hd);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 8, 20), stdMat(0xffb3ec, 0.3, { emissive: 0xff80df, emissiveIntensity: 0.6 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.95; g.add(ring);
      g.userData.swirl = ring;
      addEyes(g, 0.18, 1.44, -0.46, 0.075);
      var blush = new THREE.MeshBasicMaterial({ color: 0xff8fab });
      [-0.26, 0.26].forEach(function (bx) { var bl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), blush); bl.position.set(bx, 1.33, -0.45); g.add(bl); });
    } else if (kind === "octopus") {
      var mat = stdMat(0x9b59d0, 0.7);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), mat));
      for (var k = 0; k < 6; k++) {
        var tn = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.9, 8), mat);
        var a = k / 6 * Math.PI * 2;
        tn.position.set(Math.cos(a) * 0.45, -0.6, Math.sin(a) * 0.45);
        tn.rotation.z = Math.cos(a) * 0.5; tn.rotation.x = -Math.sin(a) * 0.5; g.add(tn);
      }
      addEyes(g, 0.22, 0.15, -0.62, 0.08);
    } else if (kind === "pearl") {
      var sh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), stdMat(0xe8b7d4, 0.4));
      sh.rotation.x = Math.PI; sh.position.y = 0.4; g.add(sh);
      var pr = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), stdMat(0xffffff, 0.15, { metalness: 0.3, emissive: 0xffeef8, emissiveIntensity: 0.35 }));
      pr.position.y = 0.58; g.add(pr);
    } else if (kind === "turtle") {
      if (MAY.modelsReady && MAY.MODEL_T.turtle) {
        g.add(MAY.MODEL_T.turtle.group.clone(true));
      } else {
        var shM = stdMat(0x4d9b57, 0.8);
        var sh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), shM); sh.scale.set(1.2, 0.55, 1); sh.position.y = 0.2; g.add(sh);
        var hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), stdMat(0x7cc48a)); hd.position.set(1.1, 0.25, 0); g.add(hd);
      }
      g.userData.isTurtle = true;
    } else if (kind === "dolphin") {
      g = MAY.fishBody(0x7fa8c9, 2.5, 1);
    } else if (kind === "clownfish") {
      g = MAY.fishBody(0xff7f2a, 1.5, 0);
    } else {
      g = MAY.fishBody(opts.color || 0xffa726, opts.len || 1.5, opts.species || 0);
    }

    if (opts.scale) g.scale.setScalar(opts.scale);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return g;
  };

  /* ---- World Context Builder: dùng chung cho Hub + cả 6 màn ---- */
  MAY.createWorldCtx = function (levelId) {
    var meta = MAY.getMeta(levelId);
    var ls = MAY.getLevelSave(levelId);
    var ctx = {
      id: levelId,
      meta: meta,
      save: ls,
      mode: "land",
      waterLevel: undefined,
      worldRadius: 106,
      minY: 1.8,
      voidY: undefined,
      minimapBg: "rgba(12,72,102,0.9)",
      minimapLand: null,
      groundH: function () { return 0; },
      isIce: null,
      getNearestSafePoint: null,
      interactives: [],
      collectibles: [],
      friends: [],
      chests: [],
      souvenirs: [],
      interactProps: [],
      bouncePads: [],
      portals: [],
      particles: [],
      waterMeshes: [],
      reflectiveMeshes: [],
      fadingLabels: [],
      getSurface: null,
      underwaterFog: null,
      landFog: null,
      companion: null,
      hidden: null,
      gemAltar: null,
      ringsCh: null,
      raceCh: null,
      quizStation: null,
      beacon: null,
      onUpdate: null,
      onModelsReady: null,
      playSecs: ls.gem ? 0 : (ls.playSecs || 0),
      portalCooldown: 1.5,
      gemAwardedThisVisit: ls.gem
    };

    ctx.add = function (obj) {
      MAY.worldRoot.add(obj);
      return obj;
    };

    ctx.addSky = function (cfg) {
      var sky = MAY.makeAtmosphericSky(cfg);
      ctx.add(sky);
      ctx.skyMesh = sky;
      MAY.bakeBiomeEnv(sky);
      return sky;
    };

    ctx.addWater = function (opts) {
      opts = opts || {};
      opts.groundH = opts.groundH || ctx.groundH;
      var wm = MAY.makeRealisticWater(opts);
      ctx.add(wm);
      ctx.waterMeshes.push(wm);
      if (opts.planarReflect !== false) {
        MAY.PlanarReflector.configure(opts.y !== undefined ? opts.y : 0, ctx.waterMeshes.concat(ctx.reflectiveMeshes));
      }
      return wm;
    };

    ctx.addReflective = function (geo, opts, pos) {
      var rm = MAY.makeReflectiveSurface(geo, opts);
      if (pos) rm.position.copy(pos);
      ctx.add(rm);
      ctx.reflectiveMeshes.push(rm);
      MAY.PlanarReflector.configure(rm.position.y, ctx.waterMeshes.concat(ctx.reflectiveMeshes));
      return rm;
    };

    ctx.trackLabel = function (sprite, maxDist) {
      ctx.fadingLabels.push({ sp: sprite, maxDist: maxDist || 19 });
      return sprite;
    };

    ctx.ensureBeacon = function (color) {
      if (!ctx.beacon) {
        ctx.beacon = MAY.makeBeacon(color || meta.gemColor);
        ctx.add(ctx.beacon);
      }
      return ctx.beacon;
    };

    /* 1. Tạo địa hình chuẩn từ hàm groundH(x,z) */
    ctx.buildTerrain = function (size, segs, mat) {
      var geo = new THREE.PlaneGeometry(size, size, segs, segs);
      geo.rotateX(-Math.PI / 2);
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        pos.setY(i, ctx.groundH(pos.getX(i), pos.getZ(i)));
      }
      geo.computeVertexNormals();
      var mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      ctx.add(mesh);
      return mesh;
    };

    /* 2. Hạt môi trường bay/rơi (tuyết biển, đom đóm, cát bay, bụi pha lê, tuyết rơi, bụi sao) */
    ctx.addAmbientParticles = function (opts) {
      opts = opts || {};
      var count = opts.count || 300;
      var spread = opts.spread || 120;
      var minY = opts.minY !== undefined ? opts.minY : 0.5;
      var maxY = opts.maxY !== undefined ? opts.maxY : 20;
      var geo = new THREE.BufferGeometry();
      var arr = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        arr[i * 3] = (Math.random() - 0.5) * spread;
        arr[i * 3 + 1] = minY + Math.random() * (maxY - minY);
        arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      var pts = new THREE.Points(geo, new THREE.PointsMaterial({
        color: opts.color || 0xffffff,
        size: opts.size || 0.22,
        transparent: true,
        opacity: opts.opacity || 0.75
      }));
      ctx.add(pts);
      ctx.particles.push({ pts: pts, count: count, minY: minY, maxY: maxY, spread: spread, vy: opts.vy !== undefined ? opts.vy : -0.6, vx: opts.vx || 0 });
      return pts;
    };

    /* 3. Vật phẩm chính (10 mục tiêu) */
    ctx.addCollectibles = function (spots, opts) {
      opts = opts || {};
      ctx.ensureBeacon(opts.color || meta.gemColor);
      spots.forEach(function (p, i) {
        var y = p.length >= 3 ? p[1] : (ctx.groundH(p[0], p[1]) + (opts.yOff || 1.25));
        var z = p.length >= 3 ? p[2] : p[1];
        var mesh = opts.makeMesh ? opts.makeMesh(i) : new THREE.Mesh(
          MAY.starGeo,
          new THREE.MeshStandardMaterial({ color: opts.color || 0xffd93d, emissive: opts.emissive || 0xaa7700, emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.35 })
        );
        mesh.position.set(p[0], y, z);
        mesh.castShadow = true;
        var taken = ls.items.indexOf(i) !== -1;
        mesh.visible = !taken;
        ctx.add(mesh);

        var lb = MAY.makeLabel(opts.icon || meta.collectIcon, { sx: 1.8, sy: 0.65 });
        lb.position.set(p[0], y + 1.45, z);
        lb.visible = !taken;
        ctx.add(lb);
        ctx.trackLabel(lb, 18);

        var glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: MAY.TEX.glow, color: opts.color || 0xffd93d, transparent: true, opacity: 0.65,
          depthWrite: false, blending: THREE.AdditiveBlending
        }));
        glow.scale.set(3.2, 3.2, 1);
        glow.position.set(p[0], y, z);
        glow.visible = !taken;
        ctx.add(glow);

        ctx.collectibles.push({
          idx: i, mesh: mesh, label: lb, glow: glow, baseY: y, taken: taken,
          spin: Math.random() * 6, color: opts.color || 0xffd93d
        });
      });
    };

    /* 4. Bạn thú của vùng đất */
    ctx.addFriends = function (defs) {
      defs.forEach(function (d, i) {
        var g = d.mk ? d.mk() : MAY.makeAnimal(d.kind, d.opts);
        var x = d.pos[0];
        var z = d.pos.length === 3 ? d.pos[2] : d.pos[1];
        var y = d.pos.length === 3 ? d.pos[1] : ctx.groundH(x, z);
        g.position.set(x, y, z);
        if (d.behavior !== "fly" && d.behavior !== "swim") g.add(MAY.makeContactShadow(0.75, 0.55));
        ctx.add(g);

        var lb = MAY.makeLabel(d.name, { sx: 3.0, sy: 0.85 });
        lb.position.set(x, y + (d.labelY || 2.1), z);
        ctx.add(lb);
        ctx.trackLabel(lb, 18);

        var fr = {
          idx: i, group: g, label: lb, name: d.name, kind: d.kind,
          met: ls.friends.indexOf(i) !== -1,
          hx: x, hz: z, baseY: y, labelY: d.labelY || 2.1,
          behavior: d.behavior || "wander",
          orbitR: d.orbitR || 4.5,
          wa: Math.random() * 6.28, wt: 0, hop: 0,
          spin: Math.random() * 6, jump: 1, spinExtra: 0,
          isCompanion: !!d.isCompanion,
          following: !!d.startFollowing || (!!d.isCompanion && ls.friends.indexOf(i) !== -1),
          greetText: d.greet || null
        };
        ctx.friends.push(fr);
        ctx.interactives.push({
          obj: g, label: "Vuốt ve " + d.name,
          onInteract: function () {
            fr.jump = 0;
            MAY.sndFriend();
            MAY.burstAt(g.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xff8fb8, 9);
            if (fr.isCompanion) {
              fr.following = true;
              MAY.toast("💗 " + d.name + " thích Mây lắm! Bạn ấy sẽ đi cùng Mây luôn!", d.name + " đi cùng Mây nè!");
            } else {
              MAY.toast("💗 " + d.name + " vui lắm! Bạn ấy vẫy chào Mây!", d.name + " vui lắm!");
            }
          }
        });
      });
    };

    /* 5. Bạn đồng hành mặc định của màn (chạy/bay bên cạnh Mây) */
    ctx.setCompanion = function (kind, name, opts) {
      opts = opts || {};
      var g = MAY.makeAnimal(kind, opts);
      if (!opts.flying) g.add(MAY.makeContactShadow(0.6, 0.5));
      ctx.add(g);
      var lb = MAY.makeLabel(name, { sx: 1.75, sy: 0.48 });
      ctx.add(lb);
      ctx.fadingLabels.push({ sp: lb, maxDist: 14, isCompanion: true, baseSx: 1.75, baseSy: 0.48 });
      ctx.companion = {
        group: g, label: lb, name: name, kind: kind,
        flying: !!opts.flying,
        yOff: opts.yOff || 0,
        glowLight: opts.light ? (function () {
          var pl = new THREE.PointLight(opts.light, 1.4, 20);
          g.add(pl);
          return pl;
        })() : null
      };
      ctx.interactives.push({
        obj: g, label: "Vuốt ve " + name,
        onInteract: function () {
          MAY.sndFriend();
          MAY.burstAt(g.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0xff8fb8, 9);
          MAY.toast("💗 " + name + " vẫy đuôi thích Mây quá trời!", name + " thích Mây lắm!");
        }
      });
      return ctx.companion;
    };

    /* 6. 3 Rương kho báu (tái sử dụng chest.glb) */
    ctx.addChests = function (spots, tint) {
      spots.forEach(function (p, ci) {
        var x = p[0], z = p.length === 3 ? p[2] : p[1];
        var y = p.length === 3 ? p[1] : ctx.groundH(x, z);
        var g = new THREE.Group();
        g.position.set(x, y, z);
        g.rotation.y = (ci * 2.1) % 6.28;

        var opened = ls.treasures.indexOf(ci) !== -1;
        var lidPivot;
        var glb = MAY.modelsReady ? MAY.makeChestGLB(tint) : null;
        if (glb) {
          g.add(glb.wrap);
          lidPivot = glb.pivot;
        } else {
          var box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.9), new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: tint || 0xffffff, roughness: 0.85 }));
          box.position.y = 0.45; g.add(box);
          lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.9, -0.45);
          var lid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.9), new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: tint || 0xccaa77, roughness: 0.85 }));
          lid.position.set(0, 0.16, 0.25); lidPivot.add(lid); g.add(lidPivot);
        }

        var gold = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0xaa7700, emissiveIntensity: 0.9 }));
        gold.position.y = 0.78; gold.visible = opened; g.add(gold);
        if (opened) lidPivot.rotation.x = -1.9;

        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: 0xffd93d, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.scale.set(2.8, 2.8, 1); glow.position.set(0, 1.1, 0); glow.visible = !opened;
        g.add(glow);
        g.add(MAY.makeContactShadow(1.15, 0.6));

        ctx.add(g);
        var ch = { idx: ci, group: g, lid: lidPivot, gold: gold, glow: glow, opened: opened, tint: tint, usingGLB: !!glb };
        ctx.chests.push(ch);
        ctx.interactives.push({
          obj: g, label: "Mở rương kho báu",
          onInteract: function () {
            if (ch.opened) { MAY.toast("💎 Rương này Mây mở rồi!"); return; }
            ch.opened = true;
            ch.lid.rotation.x = -1.9;
            ch.gold.visible = true;
            ch.glow.visible = false;
            ls.treasures.push(ci);
            MAY.persist();
            MAY.refreshHUD();
            MAY.sndStar();
            MAY.burstAt(g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffd93d, 20);
            if (MAY.VFX) MAY.VFX.spawnSolar(g.position.clone());
            var rem = meta.treasureTarget - ls.treasures.length;
            if (rem <= 0) MAY.toast("💎 Tuyệt vời! Mây mở hết " + meta.treasureTarget + " rương kho báu!", "Mây mở hết rương kho báu rồi!");
            else MAY.toast("💎 Tìm được kho báu! Còn " + rem + " rương nữa!", "Tìm được kho báu rồi!");
          }
        });
      });
    };

    /* 7. Đồ lưu niệm nhặt phụ */
    ctx.addSouvenirs = function (defs) {
      defs.forEach(function (d, i) {
        var sid = d.id || ("sv" + i);
        var x = d.pos[0], z = d.pos.length === 3 ? d.pos[2] : d.pos[1];
        var y = d.pos.length === 3 ? d.pos[1] : ctx.groundH(x, z);
        var wrap = new THREE.Group();
        wrap.position.set(x, y, z);
        wrap.add(d.mesh);
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: d.color || 0xffe699, transparent: true, opacity: 0.7, depthWrite: false }));
        glow.scale.set(2.0, 2.0, 1); glow.position.y = 0.8; wrap.add(glow);
        var taken = ls.souvenirs.indexOf(sid) !== -1;
        wrap.visible = !taken;
        ctx.add(wrap);
        ctx.souvenirs.push({ id: sid, wrap: wrap, pos: new THREE.Vector3(x, y + 0.5, z), taken: taken, msg: d.msg || ("Nhặt được " + meta.souvenirName) });
      });
    };

    /* 8. Vật thể tương tác môi trường (san hô, hoa nở, xương rồng, pha lê nhạc, người tuyết mini, bóng mây) */
    ctx.addInteractProps = function (defs) {
      defs.forEach(function (d, i) {
        var pid = d.id || ("ip" + i);
        ctx.add(d.obj);
        var item = { id: pid, obj: d.obj, touched: ls.interacts.indexOf(pid) !== -1, idx: i };
        ctx.interactProps.push(item);
        if (item.touched && d.onActivate) d.onActivate(d.obj, true);
        ctx.interactives.push({
          obj: d.obj, label: d.label, isProp: true,
          onInteract: function () {
            if (d.sound === "chime") MAY.sndChime(i);
            else MAY.sndStar();
            MAY.burstAt(d.obj.position.clone().add(new THREE.Vector3(0, 1.0, 0)), d.burstColor || 0x9fe8ff, 12);
            if (d.onActivate) d.onActivate(d.obj, false);
            if (ls.interacts.indexOf(pid) === -1) {
              ls.interacts.push(pid);
              item.touched = true;
              MAY.persist();
              MAY.refreshHUD();
              if (ls.interacts.length >= meta.interactTarget) {
                MAY.toast(meta.interactIcon + " Giỏi quá! Đủ " + meta.interactTarget + " " + meta.interactName + " rồi!", "Đủ " + meta.interactTarget + " rồi, Mây giỏi quá!");
              } else {
                MAY.toast(meta.interactIcon + " " + (d.toastText || "Đẹp quá!") + " (" + ls.interacts.length + "/" + meta.interactTarget + ")", d.sayText || d.toastText);
              }
            } else {
              MAY.toast(meta.interactIcon + " " + (d.repeatText || d.toastText || "Lung linh quá!"));
            }
          }
        });
      });
    };

    /* 9. Bảo vật ẩn (1/màn — không hiện trên bản đồ, phát gợi ý khi gần) */
    ctx.addHiddenTreasure = function (pos, opts) {
      opts = opts || {};
      var y = pos.length === 3 ? pos[1] : (ctx.groundH(pos[0], pos[1]) + 1.0);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var m = opts.mesh || new THREE.Mesh(MAY.starGeo, new THREE.MeshStandardMaterial({ color: 0xffb300, emissive: 0xff9500, emissiveIntensity: 1.3, metalness: 0.6, roughness: 0.2 }));
      m.position.set(pos[0], y, z);
      m.scale.setScalar(opts.scale || 1.35);
      m.visible = !ls.hidden;
      ctx.add(m);
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: opts.color || 0xffd93d, transparent: true, opacity: 0.9, depthWrite: false }));
      glow.scale.set(3.8, 3.8, 1); glow.position.copy(m.position); glow.visible = !ls.hidden;
      ctx.add(glow);
      ctx.hidden = { mesh: m, glow: glow, hinted: false, name: opts.name || meta.hiddenName, hint: opts.hint || "Có ánh vàng lấp lánh bí mật đâu đây..." };
    };

    /* 10. Thử thách 1: Chuỗi 5 vòng Rune tinh xảo */
    ctx.addRingsChallenge = function (spots, opts) {
      opts = opts || {};
      var list = [];
      spots.forEach(function (p, i) {
        var y = p.length === 3 ? p[1] : (ctx.groundH(p[0], p[1]) + 2.0);
        var z = p.length === 3 ? p[2] : p[1];
        var m = MAY.VFX.makeOrnateRing(opts.radius || 1.85, opts.color || 0xffd93d, opts.emissive || 0xaa7700);
        m.position.set(p[0], y, z);
        if (i < spots.length - 1) {
          var np = spots[i + 1];
          var nz = np.length === 3 ? np[2] : np[1];
          m.rotation.y = Math.atan2(np[0] - p[0], nz - z);
        }
        ctx.add(m);
        var lb = MAY.makeLabel("⭕ " + (i + 1), { sx: 2.0, sy: 0.65 });
        lb.position.set(p[0], y + 2.5, z);
        ctx.add(lb);
        ctx.trackLabel(lb, 22);
        list.push(m);
      });
      ctx.ringsCh = { rings: list, idx: ls.challenges.rings ? list.length : 0, title: opts.title || "5 vòng ánh sáng" };
    };

    /* 11. Thử thách 2: Đua tính giờ cùng bạn thú */
    ctx.addRaceChallenge = function (startPos, spots, opts) {
      opts = opts || {};
      var sy = startPos.length === 3 ? startPos[1] : (ctx.groundH(startPos[0], startPos[1]) + 2.0);
      var sz = startPos.length === 3 ? startPos[2] : startPos[1];
      var startRing = MAY.VFX.makeOrnateRing(2.1, 0x4ade80, 0x16a34a);
      startRing.position.set(startPos[0], sy, sz);
      ctx.add(startRing);
      var slb = MAY.makeLabel("🏁 " + (opts.title || "ĐUA TỐC ĐỘ"), { sx: 3.8, sy: 0.9 });
      slb.position.set(startPos[0], sy + 2.8, sz);
      ctx.add(slb);
      ctx.trackLabel(slb, 22);

      var rList = [];
      spots.forEach(function (p) {
        var y = p.length === 3 ? p[1] : (ctx.groundH(p[0], p[1]) + 2.0);
        var z = p.length === 3 ? p[2] : p[1];
        var m = MAY.VFX.makeOrnateRing(2.0, 0x38bdf8, 0x0284c7);
        m.position.set(p[0], y, z);
        ctx.add(m);
        rList.push(m);
      });
      ctx.raceCh = { startRing: startRing, rings: rList, active: false, t: 0, idx: 0, limit: opts.time || 55, title: opts.title || "Đua tốc độ" };
    };

    /* 12. Thử thách 3: Trạm câu đố giáo dục */
    ctx.addQuizStation = function (pos, opts) {
      opts = opts || {};
      var y = pos.length === 3 ? pos[1] : (ctx.groundH(pos[0], pos[1]) + 1.5);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var g = new THREE.Group();
      var orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0),
        new THREE.MeshPhysicalMaterial({ color: 0xffd93d, emissive: 0xaa7700, emissiveIntensity: 0.85, roughness: 0.15, clearcoat: 1.0 }));
      g.add(orb);
      var halo = MAY.VFX.makeRunePlane(1.75, 0xffd93d, 0.72);
      halo.position.y = -1.2; g.add(halo);
      var lb = MAY.makeLabel("❓ " + (opts.label || "Câu đố"), { sx: 3.2, sy: 0.85 });
      lb.position.y = 1.85;
      g.add(lb);
      ctx.trackLabel(lb, 22);
      g.position.set(pos[0], y, z);
      ctx.add(g);
      ctx.quizStation = { group: g, baseY: y, cd: 0, rune: halo };
      ctx.interactives.push({
        obj: g, label: "Trả lời câu đố",
        onInteract: function () { MAY.openQuiz(ctx.id); }
      });
    };

    /* 13. Bệ Đá Viên Ngọc Sắc Màu có Vòng Rune phát sáng */
    ctx.addGemAltar = function (pos) {
      var y = pos.length === 3 ? pos[1] : ctx.groundH(pos[0], pos[1]);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var g = new THREE.Group();
      g.position.set(pos[0], y, z);

      var pedMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap, color: 0xdbe6f0, roughness: 0.6 });
      var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.95, 1.1, 14), pedMat);
      ped.position.y = 0.55; ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
      var rune = MAY.VFX.makeRunePlane(3.2, meta.gemColor, 0.78);
      rune.position.y = 0.08; g.add(rune);

      var gemMat = new THREE.MeshPhysicalMaterial({
        color: meta.gemColor, emissive: meta.gemColor, emissiveIntensity: 0.95,
        roughness: 0.08, metalness: 0.25, clearcoat: 1.0, transparent: true, opacity: 0.95
      });
      var gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 0), gemMat);
      gem.position.y = 2.4; g.add(gem);

      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: MAY.TEX.glow, color: meta.gemColor, transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.scale.set(4.8, 4.8, 1); halo.position.y = 2.4; g.add(halo);

      var lb = MAY.makeLabel(meta.gemIcon + " " + meta.gemName, { sx: 3.8, sy: 0.95 });
      lb.position.y = 4.0; g.add(lb);
      ctx.trackLabel(lb, 24);

      ctx.add(g);
      ctx.gemAltar = { group: g, gem: gem, halo: halo, rune: rune, pos: new THREE.Vector3(pos[0], y + 2.0, z), announced: false };
    };

    /* 14. Cổng dịch chuyển điêu khắc đá + Vòng Rune xoay ma thuật */
    ctx.addPortal = function (pos, targetId, label, color) {
      var y = pos.length === 3 ? pos[1] : ctx.groundH(pos[0], pos[1]);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var g = new THREE.Group();
      g.position.set(pos[0], y, z);
      var stMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap, color: 0xcbd5e1, roughness: 0.72 });
      [-2.05, 2.05].forEach(function (px) {
        var pil = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 3.2, 10), stMat);
        pil.position.set(px, 1.6, 0); pil.castShadow = true; pil.receiveShadow = true; g.add(pil);
      });
      var arch = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.24, 12, 28, Math.PI),
        new THREE.MeshPhysicalMaterial({ color: color || 0x4dd0ff, emissive: color || 0x4dd0ff, emissiveIntensity: 0.55, roughness: 0.25, clearcoat: 0.9 }));
      arch.position.y = 2.0; g.add(arch);
      var veil = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 3.9),
        new THREE.MeshBasicMaterial({ map: MAY.VFX.runicTex, color: color || 0x4dd0ff, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
      veil.position.y = 2.1; g.add(veil);
      var gRune = MAY.VFX.makeRunePlane(2.6, color || 0x4dd0ff, 0.55);
      gRune.position.y = 0.08; g.add(gRune);
      var lb = MAY.makeLabel(label, { sx: 3.8, sy: 0.92 });
      lb.position.y = 4.6; g.add(lb);
      ctx.trackLabel(lb, 24);
      g.lookAt(0, y, 0);
      ctx.add(g);
      ctx.portals.push({ group: g, pos: new THREE.Vector3(pos[0], y + 1.5, z), targetId: targetId, label: label, veil: veil, gRune: gRune });
      ctx.interactives.push({
        obj: g, label: "Đi tới " + label,
        onInteract: function () { MAY.enterLevel(targetId); }
      });
    };

    /* 15. Bệ nhảy nấm lò xo / bệ bật */
    ctx.addBouncePad = function (x, y, z, r, power) {
      ctx.bouncePads.push({ x: x, y: y, z: z, r: r || 1.8, power: power || 12.2 });
    };

    /* Đánh dấu hoàn thành thử thách */
    ctx.challengeDone = function (key, msg, say) {
      if (ls.challenges[key]) return;
      ls.challenges[key] = true;
      MAY.persist();
      MAY.refreshHUD();
      MAY.burstAt(MAY.player.pos.clone(), 0xffd93d, 18);
      MAY.sndStar();
      MAY.toast(msg, say || msg);
    };

    /* Kiểm tra điều kiện nhận Viên Ngọc của màn (Hoàn thành cốt truyện/Boss HOẶC thu thập đủ đồ) */
    ctx.isGemReady = function () {
      if (meta.num <= 0) return false;
      if (ls.story && ls.story.bossDown) return true;
      return ls.items.length >= meta.collectTarget && ls.friends.length >= meta.friendTarget;
    };

    ctx.awardGem = function () {
      if (meta.num <= 0 || ls.gem) return;
      ls.gem = true;
      ctx.gemAwardedThisVisit = true;
      if (MAY.save.gems.indexOf(meta.num) === -1) MAY.save.gems.push(meta.num);
      if (MAY.save.gears.indexOf(meta.num) === -1) MAY.save.gears.push(meta.num);
      var secs = Math.max(1, Math.round(ctx.playSecs));
      if (!ls.bestTime || secs < ls.bestTime) ls.bestTime = secs;
      ls.playSecs = 0;
      MAY.persist();
      MAY.refreshHUD();
      MAY.sndGem();
      MAY.burstAt(MAY.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), meta.gemColor, 28);
      var winLevelId = ctx.id;
      var showWinFn = function () {
        if (MAY.currentLevelId !== winLevelId) return;
        if (MAY.save.gems.length >= 6 && !MAY.save.finaleSeen) {
          MAY.save.finaleSeen = true;
          MAY.persist();
          MAY.showGrandFinale();
        } else {
          MAY.showLevelWin(winLevelId, secs);
        }
      };
      if (ctx.scheduleEvent) ctx.scheduleEvent(0.9, showWinFn);
      else setTimeout(showWinFn, 900);
    };

    /* ---- Cập nhật hàng frame cho toàn bộ hệ thống màn chơi ---- */
    var compassTimer = 0, mmTimer = 0;

    ctx.updateAll = function (dt, t) {
      var pPos = MAY.player.pos;
      if (MAY.started && !MAY.modalOpen) {
        ctx.playSecs += dt;
        if (!ls.gem) ls.playSecs = Math.floor(ctx.playSecs);
      }
      if (ctx.portalCooldown > 0) ctx.portalCooldown -= dt;

      /* Đèn mặt trời & bóng đổ sắc nét đi theo Mây */
      MAY.updateSunFollow(pPos);

      /* Cập nhật vòng sóng quanh Mây trên tất cả mặt nước */
      for (var wi = 0; wi < ctx.waterMeshes.length; wi++) {
        var wu = ctx.waterMeshes[wi].userData.waterUniforms;
        if (wu && wu.uPlayerPos) wu.uPlayerPos.value.copy(pPos);
      }

      /* Chuyển sương mù tự nhiên giữa trên mặt nước (ảnh 3) và dưới lòng biển (ảnh 2) */
      if (ctx.waterLevel !== undefined && ctx.underwaterFog && ctx.landFog) {
        var camUnder = MAY.camera.position.y < ctx.waterLevel;
        if (ctx.skyMesh) ctx.skyMesh.visible = !camUnder;
        var fCfg = camUnder ? ctx.underwaterFog : ctx.landFog;
        if (!MAY.scene.fog || !MAY.scene.fog.isFogExp2) {
          MAY.scene.fog = new THREE.FogExp2(fCfg.color, fCfg.density);
        } else {
          MAY.scene.fog.color.lerp(new THREE.Color(fCfg.color), Math.min(1, dt * 6));
          MAY.scene.fog.density += (fCfg.density - MAY.scene.fog.density) * Math.min(1, dt * 6);
        }
        MAY.scene.background.lerp(new THREE.Color(fCfg.color), Math.min(1, dt * 6));
      }

      /* Hạt môi trường */
      ctx.particles.forEach(function (pt) {
        var arr = pt.pts.geometry.attributes.position;
        for (var i = 0; i < pt.count; i++) {
          var y = arr.getY(i) + pt.vy * dt;
          var x = arr.getX(i) + pt.vx * dt;
          if (y < pt.minY) y = pt.maxY;
          if (y > pt.maxY) y = pt.minY;
          if (x > pt.spread / 2) x = -pt.spread / 2;
          if (x < -pt.spread / 2) x = pt.spread / 2;
          arr.setY(i, y);
          arr.setX(i, x);
        }
        arr.needsUpdate = true;
      });

      /* Vật phẩm chính + Cột sáng dẫn đường */
      var bestItem = null, bestD = 1e9;
      ctx.collectibles.forEach(function (c) {
        if (c.taken) return;
        c.mesh.rotation.y += dt * 1.5;
        c.mesh.position.y = c.baseY + Math.sin(t * 2.2 + c.spin) * 0.25;
        c.glow.position.copy(c.mesh.position);
        c.glow.material.opacity = 0.5 + Math.sin(t * 3 + c.spin) * 0.2;
        var d = c.mesh.position.distanceTo(pPos);
        if (d < bestD) { bestD = d; bestItem = c; }
        if (d < 2.65) {
          c.taken = true;
          c.mesh.visible = false; c.label.visible = false; c.glow.visible = false;
          ls.items.push(c.idx);
          MAY.persist();
          MAY.refreshHUD();
          MAY.sndStar();
          MAY.burstAt(c.mesh.position.clone(), c.color, 14);
          var left = meta.collectTarget - ls.items.length;
          if (left > 0) {
            MAY.toast(meta.collectIcon + " Nhặt được " + meta.collectName + "! Còn " + left + " nữa!", "Nhặt được rồi! Còn " + left + " nữa!");
          } else {
            MAY.toast(meta.collectIcon + " Đủ " + meta.collectTarget + " " + meta.collectName + " rồi! Mây giỏi quá!", "Đủ hết rồi! Mây giỏi quá!");
          }
        }
      });

      if (ctx.beacon) {
        if (bestItem) {
          ctx.beacon.visible = true;
          ctx.beacon.position.set(bestItem.mesh.position.x, bestItem.mesh.position.y + 12, bestItem.mesh.position.z);
          ctx.beacon.material.uniforms.uPulse.value = 0.13 + Math.sin(t * 3) * 0.05;
        } else if (ctx.gemAltar && !ls.gem) {
          ctx.beacon.visible = true;
          ctx.beacon.position.set(ctx.gemAltar.pos.x, ctx.gemAltar.pos.y + 12, ctx.gemAltar.pos.z);
          ctx.beacon.material.uniforms.uPulse.value = 0.22 + Math.sin(t * 4) * 0.08;
        } else {
          ctx.beacon.visible = false;
        }
      }

      /* Bạn thú */
      ctx.friends.forEach(function (f) {
        var jy = 0;
        if (f.jump < 1) {
          f.jump += dt * 1.5;
          jy = Math.sin(Math.min(1, f.jump) * Math.PI) * 1.1;
          f.spinExtra += dt * 6;
        }
        if (f.following) {
          var tx = pPos.x - Math.sin(MAY.player.yaw) * 3.0 + Math.cos(MAY.player.yaw) * 1.4;
          var tz = pPos.z - Math.cos(MAY.player.yaw) * 3.0 - Math.sin(MAY.player.yaw) * 1.4;
          var dx = tx - f.group.position.x, dz = tz - f.group.position.z;
          var dd = Math.hypot(dx, dz);
          if (dd > 0.5) {
            var sp = Math.min(5.2, dd * 1.8);
            f.group.position.x += dx / dd * sp * dt;
            f.group.position.z += dz / dd * sp * dt;
            f.group.rotation.y = (f.behavior === "swim" ? Math.atan2(-dz, dx) : Math.atan2(-dx, -dz)) + f.spinExtra;
          }
          if (f.behavior === "swim") {
            f.group.position.y = pPos.y + 0.35 + Math.sin(t * 2 + f.spin) * 0.15;
          } else {
            f.group.position.y = ctx.groundH(f.group.position.x, f.group.position.z) + jy;
          }
        } else if (f.behavior === "fly") {
          f.wa += dt * 0.45;
          f.group.position.x = f.hx + Math.cos(f.wa) * f.orbitR;
          f.group.position.z = f.hz + Math.sin(f.wa) * f.orbitR;
          f.group.position.y = f.baseY + Math.sin(t * 2 + f.spin) * 0.6 + jy;
          f.group.rotation.y = -f.wa;
          if (f.group.userData.wl) {
            var fl = Math.sin(t * 9 + f.spin) * 0.55;
            f.group.userData.wl.rotation.z = fl;
            f.group.userData.wr.rotation.z = -fl;
          }
        } else if (f.behavior === "swim") {
          f.wa += dt * 0.25;
          f.group.position.x = f.hx + Math.cos(f.wa) * 2.2;
          f.group.position.z = f.hz + Math.sin(f.wa) * 2.2;
          f.group.position.y = f.baseY + Math.sin(t * 1.6 + f.spin) * 0.25 + jy;
          f.group.rotation.y = -f.wa - Math.PI / 2 + f.spinExtra;
        } else if (f.behavior === "still") {
          f.group.position.y = f.baseY + Math.sin(t * 1.8 + f.spin) * 0.18 + jy;
          f.group.rotation.y = Math.sin(t * 0.5 + f.spin) * 0.6 + f.spinExtra;
          if (f.group.userData.swirl) f.group.userData.swirl.rotation.z += dt * 3;
        } else {
          /* Wander trên cạn */
          f.wt -= dt;
          if (f.wt <= 0) { f.wt = 2.2 + Math.random() * 2.8; f.wa = Math.random() * 6.28; }
          var nx = f.hx + Math.cos(f.wa) * f.orbitR, nz = f.hz + Math.sin(f.wa) * f.orbitR;
          var dx2 = nx - f.group.position.x, dz2 = nz - f.group.position.z;
          var dd2 = Math.hypot(dx2, dz2);
          if (dd2 > 0.3) {
            var sp2 = Math.min(1.4, dd2);
            f.group.position.x += dx2 / dd2 * sp2 * dt;
            f.group.position.z += dz2 / dd2 * sp2 * dt;
            f.group.rotation.y = Math.atan2(-dx2, -dz2) + f.spinExtra;
            f.hop += dt * 6;
          }
          var gy = ctx.groundH(f.group.position.x, f.group.position.z);
          f.group.position.y = (gy > -30 ? gy : f.baseY) + Math.abs(Math.sin(f.hop)) * 0.14 + jy;
        }
        f.label.position.set(f.group.position.x, f.group.position.y + f.labelY, f.group.position.z);

        if (!f.met && f.group.position.distanceTo(pPos) < 4.0) {
          f.met = true;
          f.jump = 0;
          if (f.isCompanion) f.following = true;
          ls.friends.push(f.idx);
          MAY.persist();
          MAY.refreshHUD();
          MAY.sndFriend();
          MAY.burstAt(f.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff8fb8, 12);
          var gMsg = f.greetText || ("🎖️ Gặp bạn mới: " + f.name + "!");
          MAY.toast(gMsg, "Mây gặp " + f.name + " nè!");
        }
      });

      /* Bạn đồng hành chính của màn (Milo, Kiki, Bibi, Bông...) */
      if (ctx.companion) {
        var cp = ctx.companion;
        var fwdX = -Math.sin(MAY.player.yaw), fwdZ = -Math.cos(MAY.player.yaw);
        var tx = pPos.x - fwdX * 2.2 + Math.cos(MAY.player.yaw) * 1.5;
        var tz = pPos.z - fwdZ * 2.2 - Math.sin(MAY.player.yaw) * 1.5;
        if (cp.flying) {
          tx = pPos.x + fwdX * 2.2 + Math.cos(MAY.player.yaw) * 1.3;
          tz = pPos.z + fwdZ * 2.2 - Math.sin(MAY.player.yaw) * 1.3;
        }
        cp.group.position.x += (tx - cp.group.position.x) * Math.min(1, dt * 3.5);
        cp.group.position.z += (tz - cp.group.position.z) * Math.min(1, dt * 3.5);
        var cgy = ctx.groundH(cp.group.position.x, cp.group.position.z);
        if (cp.flying) {
          cp.group.position.y += ((pPos.y + 1.4 + Math.sin(t * 3.5) * 0.25) - cp.group.position.y) * Math.min(1, dt * 4);
        } else {
          var targetY = (cgy > -30 ? cgy : pPos.y - 0.8) + cp.yOff;
          cp.group.position.y += (targetY - cp.group.position.y) * Math.min(1, dt * 8);
        }
        var cdx = tx - cp.group.position.x, cdz = tz - cp.group.position.z;
        if (Math.hypot(cdx, cdz) > 0.15) cp.group.rotation.y = Math.atan2(-cdx, -cdz);
        if (cp.group.userData.tail) cp.group.userData.tail.rotation.z = Math.sin(t * 10) * 0.5;
        if (cp.group.userData.wl) {
          var fl2 = Math.sin(t * 10) * 0.5;
          cp.group.userData.wl.rotation.z = fl2;
          cp.group.userData.wr.rotation.z = -fl2;
        }
        cp.label.position.set(cp.group.position.x, cp.group.position.y + 1.7, cp.group.position.z);
      }

      /* Đồ lưu niệm */
      ctx.souvenirs.forEach(function (sv) {
        if (sv.taken) return;
        if (sv.pos.distanceTo(pPos) < 2.4) {
          sv.taken = true;
          sv.wrap.visible = false;
          ls.souvenirs.push(sv.id);
          MAY.persist();
          MAY.refreshHUD();
          MAY.sndStar();
          MAY.burstAt(sv.pos.clone(), 0xffe066, 10);
          var rem = meta.souvenirTarget - ls.souvenirs.length;
          if (rem <= 0) MAY.toast(meta.souvenirIcon + " Đủ " + meta.souvenirTarget + " " + meta.souvenirName + "! Mây giỏi quá!", "Đủ rồi! Mây giỏi quá!");
          else MAY.toast(meta.souvenirIcon + " " + sv.msg + "! (" + ls.souvenirs.length + "/" + meta.souvenirTarget + ")", sv.msg);
        }
      });

      /* Bảo vật ẩn */
      if (ctx.hidden && !ls.hidden) {
        var h = ctx.hidden;
        h.mesh.rotation.y += dt * 1.8;
        var hd = h.mesh.position.distanceTo(pPos);
        var hintRange = MAY.hasGear(4) ? 28 : 18;
        if (hd < 2.7) {
          ls.hidden = true;
          h.mesh.visible = false; h.glow.visible = false;
          MAY.persist(); MAY.refreshHUD();
          MAY.sndGem();
          MAY.burstAt(h.mesh.position.clone(), 0xffd93d, 22);
          MAY.toast("🏆 Tìm được Bảo Vật Ẩn: " + h.name + "! Mây siêu đỉnh!", "Tìm được bảo vật ẩn " + h.name + " rồi!");
        } else if (hd < hintRange && !h.hinted) {
          h.hinted = true;
          MAY.toast("✨ " + h.hint, h.hint);
        }
      }

      /* Thử thách 1: Chuỗi 5 vòng Rune tinh xảo */
      if (ctx.ringsCh) {
        var rc = ctx.ringsCh;
        rc.rings.forEach(function (m, i) {
          var cur = (i === rc.idx);
          if (m.userData.rimMat) m.userData.rimMat.emissiveIntensity = cur ? 1.1 + Math.sin(t * 4) * 0.45 : 0.22;
          if (m.userData.rune) { m.userData.rune.rotation.z += dt * (cur ? 1.6 : 0.4); m.userData.rune.material.opacity = cur ? 0.55 : 0.14; }
          m.scale.setScalar(cur ? 1.1 + Math.sin(t * 4) * 0.06 : 0.94);
        });
        if (rc.idx < rc.rings.length) {
          var rm = rc.rings[rc.idx];
          if (rm.position.distanceTo(pPos) < 3.0) {
            rc.idx++;
            MAY.sndStar();
            MAY.burstAt(rm.position.clone(), 0xffd93d, 14);
            if (MAY.player.addShake) MAY.player.addShake(0.14);
            if (rc.idx >= rc.rings.length) {
              if (MAY.VFX) MAY.VFX.spawnGrowth(pPos.clone());
              ctx.challengeDone("rings", "⭕ Xong " + rc.title + "! Mây khéo léo quá!", "Mây hoàn thành 5 vòng ánh sáng rồi!");
            } else {
              MAY.toast("⭕ Qua vòng " + rc.idx + "/" + rc.rings.length + " rồi!", "Qua vòng rồi!");
            }
          }
        }
      }

      /* Thử thách 2: Đua tính giờ */
      if (ctx.raceCh) {
        var ra = ctx.raceCh;
        if (!ra.active) {
          if (ra.startRing.userData.rune) ra.startRing.userData.rune.rotation.z += dt * 1.4;
          if (ra.startRing.position.distanceTo(pPos) < 3.1) {
            ra.active = true; ra.t = ra.limit; ra.idx = 0;
            MAY.sndFriend();
            MAY.toast("🏁 Bắt đầu " + ra.title + "! Qua " + ra.rings.length + " vòng xanh trong " + ra.limit + " giây!", "Bắt đầu đua nào!");
          }
        } else {
          if (!MAY.modalOpen) ra.t -= dt;
          var hintEl = document.getElementById("hint");
          if (hintEl) hintEl.textContent = "🏁 " + ra.title + ": còn " + Math.ceil(ra.t) + "s — vòng " + (ra.idx + 1) + "/" + ra.rings.length + "!";
          if (ra.t <= 0) {
            ra.active = false;
            MAY.toast("⏱️ Hết giờ rồi, Mây thử đua lại nhé!", "Hết giờ rồi, thử lại nhé!");
            MAY.updateHintText(ctx);
          } else if (ra.idx < ra.rings.length) {
            var rr = ra.rings[ra.idx];
            if (rr.userData.rimMat) rr.userData.rimMat.emissiveIntensity = 1.2 + Math.sin(t * 5) * 0.45;
            if (rr.userData.rune) rr.userData.rune.rotation.z -= dt * 2.2;
            rr.scale.setScalar(1.1 + Math.sin(t * 5) * 0.06);
            if (rr.position.distanceTo(pPos) < 3.2) {
              ra.idx++;
              MAY.sndStar();
              MAY.burstAt(rr.position.clone(), 0x4dd0ff, 14);
              if (ra.idx >= ra.rings.length) {
                ra.active = false;
                MAY.updateHintText(ctx);
                if (MAY.VFX) MAY.VFX.spawnTornado(pPos.clone(), true);
                ctx.challengeDone("race", "🏁 Mây thắng " + ra.title + "! Nhanh như gió luôn!", "Mây thắng cuộc đua rồi!");
              } else {
                MAY.toast("🏁 Qua vòng đua " + ra.idx + "/" + ra.rings.length + "!", "Tiếp tục nào!");
              }
            }
          }
        }
      }

      /* Thử thách 3: Trạm câu đố (CHỈ mở khi bấm/tương tác — không tự bật ngang màn hình khi chạy qua!) */
      if (ctx.quizStation) {
        var qs = ctx.quizStation;
        if (qs.cd > 0) qs.cd -= dt;
        qs.group.position.y = qs.baseY + Math.sin(t * 1.6) * 0.25;
        qs.group.rotation.y += dt * 0.65;
        if (qs.rune) qs.rune.rotation.z -= dt * 0.9;
      }

      /* Bệ Viên Ngọc Sắc Màu */
      if (ctx.gemAltar) {
        var ga = ctx.gemAltar;
        var ready = ctx.isGemReady();
        ga.gem.rotation.y += dt * (ready ? 2.2 : 0.7);
        ga.gem.position.y = 2.4 + Math.sin(t * 2.5) * 0.25;
        if (ga.rune) ga.rune.rotation.z += dt * (ready ? 1.6 : 0.5);
        ga.gem.material.opacity = ls.gem ? 0.35 : (ready ? 1.0 : 0.45);
        ga.halo.material.opacity = ls.gem ? 0.2 : (ready ? 0.9 : 0.3);
        if (ready && !ls.gem) {
          if (!ga.announced) {
            ga.announced = true;
            if (MAY.VFX) MAY.VFX.spawnTornado(ga.pos.clone().setY(ga.pos.y - 2.0), true);
            MAY.toast(meta.gemIcon + " " + meta.gemName + " đã thức giấc! Hãy lại gần Bệ Ngọc để nhận nhé!", meta.gemName + " đã sẵn sàng! Mây lại lấy ngọc đi nào!");
          }
          if (ga.pos.distanceTo(pPos) < 4.0) {
            ctx.awardGem();
          }
        }
      }

      /* Cổng dịch chuyển + làm mờ nhãn chữ khi ở xa cho khung hình rộng luôn sạch đẹp */
      ctx.portals.forEach(function (pt) {
        pt.veil.rotation.z += dt * 0.7;
        pt.veil.material.opacity = 0.42 + Math.sin(t * 3) * 0.14;
        if (pt.gRune) pt.gRune.rotation.z -= dt * 0.9;
        if (ctx.portalCooldown <= 0 && !MAY.modalOpen && pt.pos.distanceTo(pPos) < 1.95) {
          ctx.portalCooldown = 2.0;
          MAY.enterLevel(pt.targetId);
        }
      });

      var wpTmp = new THREE.Vector3();
      for (var li = 0; li < ctx.fadingLabels.length; li++) {
        var fl = ctx.fadingLabels[li];
        if (!fl.sp || !fl.sp.material) continue;
        fl.sp.getWorldPosition(wpTmp);
        var ld = wpTmp.distanceTo(pPos);
        var alpha = ld < fl.maxDist * 0.55 ? 1.0 : Math.max(0, 1 - (ld - fl.maxDist * 0.55) / (fl.maxDist * 0.45));
        if (fl.isCompanion) {
          var camD = wpTmp.distanceTo(MAY.camera.position);
          var sc = Math.max(0.45, Math.min(1.0, (camD - 2.0) / 5.5));
          fl.sp.scale.set(fl.baseSx * sc, fl.baseSy * sc, 1);
          if (camD < 3.4) alpha *= Math.max(0.12, (camD - 1.8) / 1.6);
        }
        fl.sp.material.opacity = alpha;
      }

      if (ctx.updateStory) ctx.updateStory(dt, t);
      if (MAY.VFX) MAY.VFX.update(dt);
      if (ctx.onUpdate) ctx.onUpdate(dt, t);

      updateRaycast(dt, ctx);
      compassTimer -= dt;
      if (compassTimer <= 0) { compassTimer = 0.12; updateCompass(ctx); }
      mmTimer -= dt;
      if (mmTimer <= 0) { mmTimer = 0.14; drawMinimap(ctx); }
    };

    if (MAY.attachStoryEngine) MAY.attachStoryEngine(ctx);
    return ctx;
  };

  /* ---- La bàn & Minimap ---- */
  var compassIn = document.getElementById("compass-in");
  var CARDINALS = [[0, "Bắc"], [45, "ĐB"], [90, "Đông"], [135, "ĐN"], [180, "Nam"], [225, "TN"], [270, "Tây"], [315, "TB"]];

  function updateCompass(ctx) {
    if (!compassIn) return;
    var heading = ((-MAY.player.yaw * 180 / Math.PI) % 360 + 360) % 360;
    var html = "";
    CARDINALS.forEach(function (c) {
      var rel = ((c[0] - heading + 540) % 360) - 180;
      if (Math.abs(rel) <= 55) html += '<span class="tick" style="left:' + (50 + rel / 110 * 100) + '%"><b>' + c[1] + "</b>|</span>";
    });
    var p = MAY.player.pos;
    var near = [];
    if (ctx.storyObjective && ctx.storyObjective.targetPos) {
      near.push({ pos: ctx.storyObjective.targetPos, d: ctx.storyObjective.targetPos.distanceTo(p), icon: ctx.storyObjective.icon || "❗" });
    }
    var nearItems = ctx.collectibles.filter(function (c) { return !c.taken; })
      .map(function (c) { return { pos: c.mesh.position, d: c.mesh.position.distanceTo(p), icon: ctx.meta.collectIcon }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 2);
    near = near.concat(nearItems);

    if (near.length === 0 && ctx.gemAltar && !ctx.save.gem) {
      near.push({ pos: ctx.gemAltar.pos, d: ctx.gemAltar.pos.distanceTo(p), icon: ctx.meta.gemIcon });
    }
    near.forEach(function (o) {
      var dx = o.pos.x - p.x, dz = o.pos.z - p.z;
      var ang = (Math.atan2(-dx, -dz) * 180 / Math.PI + 360) % 360;
      var rel = ((ang - heading + 540) % 360) - 180;
      if (Math.abs(rel) <= 55) {
        html += '<span class="mark" style="left:' + (50 + rel / 110 * 100) + '%">' + o.icon + "<small>" + Math.round(o.d) + "m</small></span>";
      }
    });
    compassIn.innerHTML = html;
  }

  var minimap = document.getElementById("minimap");
  var mmCtx = minimap ? minimap.getContext("2d") : null;

  function drawMinimap(ctx) {
    if (!mmCtx) return;
    var S = minimap.width, C = S / 2, K = C / (ctx.worldRadius + 8);
    mmCtx.clearRect(0, 0, S, S);
    mmCtx.fillStyle = ctx.minimapBg || "rgba(4,60,95,.9)";
    mmCtx.beginPath(); mmCtx.arc(C, C, C - 2, 0, 6.29); mmCtx.fill();
    mmCtx.strokeStyle = "rgba(255,255,255,.45)";
    mmCtx.beginPath(); mmCtx.arc(C, C, C - 2, 0, 6.29); mmCtx.stroke();

    function dot(x, z, color, r) {
      mmCtx.fillStyle = color;
      mmCtx.beginPath(); mmCtx.arc(C + x * K, C + z * K, r, 0, 6.29); mmCtx.fill();
    }
    if (ctx.minimapDrawExtra) ctx.minimapDrawExtra(mmCtx, C, K);

    ctx.portals.forEach(function (pt) { dot(pt.pos.x, pt.pos.z, "#7fe3ff", 4); });
    ctx.chests.forEach(function (ch) { if (!ch.opened) dot(ch.group.position.x, ch.group.position.z, "#c98a2e", 3); });
    ctx.friends.forEach(function (f) { if (!f.met) dot(f.group.position.x, f.group.position.z, "#ff8fb8", 3.2); });
    ctx.collectibles.forEach(function (c) { if (!c.taken) dot(c.mesh.position.x, c.mesh.position.z, "#ffd93d", 3.0); });
    if (ctx.enemies) ctx.enemies.forEach(function (en) { if (en.state !== "purified") dot(en.mesh.position.x, en.mesh.position.z, "#ff3b5c", 3.4); });
    if (ctx.boss && ctx.boss.active && !ctx.boss.defeated) dot(ctx.boss.pos.x, ctx.boss.pos.z, "#ff0055", 5.5);
    if (ctx.storyObjective && ctx.storyObjective.targetPos) dot(ctx.storyObjective.targetPos.x, ctx.storyObjective.targetPos.z, "#4ade80", 4.8);
    if (ctx.gemAltar && !ctx.save.gem) dot(ctx.gemAltar.pos.x, ctx.gemAltar.pos.z, "#ffffff", 4.2);

    var p = MAY.player.pos;
    mmCtx.save();
    mmCtx.translate(C + p.x * K, C + p.z * K);
    mmCtx.rotate(-MAY.player.yaw);
    mmCtx.fillStyle = "#fff";
    mmCtx.beginPath(); mmCtx.moveTo(0, -7); mmCtx.lineTo(5, 6); mmCtx.lineTo(-5, 6); mmCtx.closePath(); mmCtx.fill();
    mmCtx.restore();
  }

  MAY.updateHintText = function (ctx) {
    var el = document.getElementById("hint");
    if (!el || !ctx) return;
    if (MAY.player.isTouch) {
      if (ctx.id === "level6") el.textContent = "Kéo nút vàng để chạy • Giữ ⤒ trên không để lướt Cánh Mây! • Vuốt phải để nhìn";
      else if (ctx.mode === "underwater") el.textContent = "Kéo nút vàng để bơi • ▲ ▼ lên xuống • Vuốt phải để nhìn • Chạm để tương tác";
      else el.textContent = "Kéo nút vàng để đi • ⤒ nhảy • 🏃 chạy nhanh • Vuốt phải để nhìn";
    } else {
      if (ctx.id === "level6") el.textContent = "Giữ chuột kéo để xoay • W A S D chạy • Giữ Space lướt Cánh Mây! • Q/E xoay • M Bản đồ • J Sổ tay";
      else if (ctx.mode === "underwater") el.textContent = "Giữ chuột kéo để xoay • W A S D bơi • Space lên • C xuống • Q/E xoay • M Bản đồ";
      else el.textContent = "Giữ chuột kéo để xoay • W A S D đi bộ • Space nhảy • Q/E xoay • Cuộn zoom • M Bản đồ";
    }
  };

  /* ---- Quản lý các cửa sổ Overlay (Quiz, World Map, Sổ tay, Thắng màn, Lễ hội kết) ---- */
  function releasePointerLock() {
    if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }

  MAY.closeAllModals = function () {
    ["quiz-ov", "ov-map", "ov-album", "ov-win", "ov-finale"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    MAY.modalOpen = false;
  };

  MAY.openQuiz = function (levelId) {
    var ctx = MAY.currentCtx;
    if (!ctx) return;
    releasePointerLock();
    MAY.modalOpen = true;
    var q = MAY.makeQuizForLevel(levelId);
    setText("quiz-q", q.q);
    var ls = MAY.getLevelSave(levelId);
    setText("quiz-prog", "Đã đúng " + Math.min(3, ls.quizDone) + "/3 câu của màn này");
    var box = document.getElementById("quiz-ans");
    box.innerHTML = "";
    q.opts.forEach(function (op) {
      var b = document.createElement("button");
      b.textContent = op;
      b.onclick = function () {
        if (op === q.ans) {
          ls.quizDone++;
          MAY.persist();
          MAY.sndStar();
          MAY.burstAt(MAY.player.pos.clone(), 0xffd93d, 14);
          if (ls.quizDone >= 3) {
            ctx.challengeDone("quiz", "❓ Trả lời đúng 3 câu đố! Mây thông minh quá!", "Mây trả lời đúng 3 câu đố rồi!");
          } else {
            MAY.toast("✅ Đúng rồi! Mây trả lời đúng " + ls.quizDone + "/3 câu!", "Đúng rồi! Giỏi quá!");
          }
          MAY.closeQuiz();
        } else {
          MAY.toast("🤔 Chưa đúng rồi, Mây thử lại nhé!", "Chưa đúng, Mây thử lại nhé!");
          MAY.beep(220, 0.22);
        }
      };
      box.appendChild(b);
    });
    document.getElementById("quiz-ov").classList.remove("hidden");
    MAY.speak("Câu đố nè! " + q.q);
  };

  MAY.closeQuiz = function () {
    document.getElementById("quiz-ov").classList.add("hidden");
    MAY.modalOpen = false;
    if (MAY.currentCtx && MAY.currentCtx.quizStation) MAY.currentCtx.quizStation.cd = 4.5;
  };

  MAY.openMap = function () {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;
    var rec = MAY.nextRecommendedLevel();
    var grid = document.getElementById("map-grid");
    grid.innerHTML = "";
    MAY.LEVEL_META.forEach(function (m) {
      var ls = MAY.getLevelSave(m.id);
      var card = document.createElement("button");
      card.className = "map-card" + (MAY.currentLevelId === m.id ? " cur" : "") + (ls.gem ? " cleared" : "");
      card.style.borderColor = m.theme;
      var badge = "";
      if (MAY.currentLevelId === m.id) badge = '<span class="mbadge here">Đang ở đây</span>';
      else if (ls.gem) badge = '<span class="mbadge done">' + m.gemIcon + " Đã có Ngọc</span>";
      else if (m.id === rec) badge = '<span class="mbadge rec">✨ Khuyên chơi</span>';

      var sub = m.id === "hub"
        ? "🌈 " + MAY.save.gems.length + "/6 Ngọc • 🐾 " + ls.friends.length + "/4 Bạn đảo"
        : m.collectIcon + " " + ls.items.length + "/" + m.collectTarget + " • 🎖️ " + ls.friends.length + "/" + m.friendTarget + " • 🏆 " + Object.keys(ls.challenges).filter(function (k) { return ls.challenges[k]; }).length + "/3";

      card.innerHTML = '<div class="mtop"><span class="mico">' + m.icon + '</span><div><div class="mname">' + m.title + '</div><div class="msub">' + sub + "</div></div></div>" + badge;
      card.onclick = function () {
        MAY.closeAllModals();
        MAY.enterLevel(m.id);
      };
      grid.appendChild(card);
    });
    document.getElementById("ov-map").classList.remove("hidden");
  };

  MAY.toggleMap = function () {
    var el = document.getElementById("ov-map");
    if (el && !el.classList.contains("hidden")) MAY.closeAllModals();
    else MAY.openMap();
  };

  MAY.openAlbum = function () {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;

    /* 6 Viên Ngọc */
    var gemsEl = document.getElementById("alb-gems");
    gemsEl.innerHTML = "";
    MAY.LEVEL_META.slice(1).forEach(function (m) {
      var got = MAY.save.gems.indexOf(m.num) !== -1;
      var d = document.createElement("div");
      d.className = "alb-chip" + (got ? " got" : "");
      d.innerHTML = '<span class="aico">' + (got ? m.gemIcon : "❔") + "</span><b>" + m.gemName + "</b><small>" + m.shortName + "</small>";
      gemsEl.appendChild(d);
    });

    /* 6 Phép Thuật Nguyên Tố (mở khóa dần theo cốt truyện) */
    var spEl = document.getElementById("alb-spells");
    if (spEl) {
      spEl.innerHTML = "";
      MAY.SPELLS.forEach(function (sp) {
        var got = MAY.isSpellUnlocked(sp.id);
        var d = document.createElement("div");
        d.className = "alb-chip" + (got ? " got" : "");
        d.innerHTML = '<span class="aico">' + (got ? sp.icon : "🔒") + "</span><b>" + sp.name + "</b><small>" + (got ? sp.desc : ("Mở khóa Chương " + sp.chapter)) + "</small>";
        spEl.appendChild(d);
      });
    }
    var freeBtn = document.getElementById("btn-free-spells");
    if (freeBtn) {
      freeBtn.textContent = MAY.save.freeSpells ? "🔒 Về Chế Độ Cốt Truyện (Mở từng phép)" : "🔓 Mở nhanh 6 Phép (Chế Độ Tự Do)";
    }

    /* 6 Trang Bị */
    var gearEl = document.getElementById("alb-gears");
    gearEl.innerHTML = "";
    [1, 2, 3, 4, 5, 6].forEach(function (n) {
      var g = MAY.GEARS[n], got = MAY.hasGear(n);
      var d = document.createElement("div");
      d.className = "alb-chip" + (got ? " got" : "");
      d.innerHTML = '<span class="aico">' + (got ? g.icon : "🔒") + "</span><b>" + g.name + "</b><small>" + g.desc + "</small>";
      gearEl.appendChild(d);
    });

    /* Tủ đồ 6 trang phục */
    var outEl = document.getElementById("alb-outfits");
    outEl.innerHTML = "";
    Object.keys(MAY.OUTFITS).forEach(function (k) {
      var o = MAY.OUTFITS[k];
      var ok = MAY.isOutfitUnlocked(k);
      var b = document.createElement("button");
      b.className = "outfit" + (MAY.save.outfit === k ? " sel" : "") + (ok ? "" : " locked");
      b.dataset.outfit = k;
      b.innerHTML = '<img src="' + o.img + '" alt="' + o.name + '"><span>' + (ok ? o.name : "🔒 " + o.name) + "</span>";
      b.onclick = function () {
        if (!ok) { MAY.toast("🔒 " + o.desc); MAY.beep(260, 0.14); return; }
        MAY.applyOutfit(k);
        MAY.beep(880, 0.12);
        MAY.speak("Mây mặc bộ " + o.name + " nè!");
        MAY.openAlbum();
      };
      outEl.appendChild(b);
    });

    /* Tổng kết Bảo vật ẩn & Thử thách */
    var totHidden = 0, totCh = 0, totFriends = 0;
    MAY.LEVEL_META.forEach(function (m) {
      var ls = MAY.getLevelSave(m.id);
      if (ls.hidden) totHidden++;
      totFriends += ls.friends.length;
      totCh += Object.keys(ls.challenges).filter(function (k) { return ls.challenges[k]; }).length;
    });
    setText("alb-stats", "🎖️ Đã gặp " + totFriends + "/35 bạn thú • 🏆 Đạt " + totCh + "/18 thử thách • 👑 Tìm thấy " + totHidden + "/6 bảo vật ẩn");
    document.getElementById("ov-album").classList.remove("hidden");
  };
  MAY.renderAlbum = MAY.openAlbum;

  MAY.toggleAlbum = function () {
    var el = document.getElementById("ov-album");
    if (el && !el.classList.contains("hidden")) MAY.closeAllModals();
    else MAY.openAlbum();
  };

  MAY.showLevelWin = function (levelId, secs) {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;
    var meta = MAY.getMeta(levelId);
    var ls = MAY.getLevelSave(levelId);
    var mm = Math.floor((secs || 0) / 60), ss = (secs || 0) % 60;
    var timeStr = mm + ":" + (ss < 10 ? "0" : "") + ss;
    var rank = secs > 0 && secs < 240 ? "🥇 Huy hiệu Vàng" : secs > 0 && secs < 480 ? "🥈 Huy hiệu Bạc" : "🥉 Huy hiệu Đồng";
    var gear = MAY.GEARS[meta.num];

    setText("win-gem-icon", meta.gemIcon);
    setText("win-title", "MÂY ĐÃ NHẬN " + meta.gemName.toUpperCase() + "!");
    setText("win-desc", "Hoàn thành " + meta.title + "! Mở khóa trang bị: " + gear.icon + " " + gear.name + " (" + gear.desc + ").");
    setText("win-rank", rank + " • Thời gian " + timeStr + " • Tổng Ngọc: " + MAY.save.gems.length + "/6");
    setText("win-side",
      "💎 Rương " + ls.treasures.length + "/" + meta.treasureTarget +
      " • " + meta.souvenirIcon + " " + ls.souvenirs.length + "/" + meta.souvenirTarget +
      " • 🏆 Thử thách " + Object.keys(ls.challenges).filter(function (k) { return ls.challenges[k]; }).length + "/3" +
      " • " + (ls.hidden ? "👑 Đã tìm " + meta.hiddenName : "🔎 Còn Bảo vật ẩn đang chờ!")
    );

    var nextId = meta.num < 6 ? ("level" + (meta.num + 1)) : "hub";
    var nextMeta = MAY.getMeta(nextId);
    var btnNext = document.getElementById("btn-win-next");
    if (btnNext) {
      btnNext.textContent = "▶ Tới " + nextMeta.icon + " " + nextMeta.shortName;
      btnNext.onclick = function () { MAY.closeAllModals(); MAY.enterLevel(nextId); };
    }
    var btnHub = document.getElementById("btn-win-hub");
    if (btnHub) btnHub.onclick = function () { MAY.closeAllModals(); MAY.enterLevel("hub"); };

    document.getElementById("ov-win").classList.remove("hidden");
    MAY.speak("Hoan hô! Mây đã nhận được " + meta.gemName + "! Mây giỏi quá trời luôn!");
  };

  MAY.showGrandFinale = function () {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;
    document.getElementById("ov-finale").classList.remove("hidden");
    MAY.speak("Chúc mừng Mây! Mây đã gom đủ 6 Viên Ngọc Cầu Vồng! Hãy quay về Đảo Mây dự Lễ Hội Cầu Vồng cùng tất cả các bạn thú nhé!");
  };

})(window.MAY);
