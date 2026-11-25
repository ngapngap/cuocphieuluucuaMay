"use strict";
/* ============================================================================
   STORY.JS — Động Cơ Cốt Truyện v10.0:
   - Hộp Thoại Kể Chuyện NPC Giao Nhiệm Vụ (! / ? / ★?) & Nghi thức Trao Thưởng
   - Hệ Thống 3 Trái Tim Ánh Sáng, Quái Tuần Tra, Hất Văng Quái Lên Trời (Tornado)
   - Tương Tác Phép Thuật Thực Chiến (Cây Chết Hồi Sinh, Đài Gương Laser, Tường Nứt, Cầu Băng, Cột Khí Nâng)
   - Hệ Thống Đấu Trùm 3 Pha (Boss Arena) & Biến Đổi Khí Quyển Hồi Sinh Thế Giới
   ============================================================================ */
(function (MAY) {

  /* ==========================================================================
     1. HỘP THOẠI KỂ CHUYỆN NPC (MULTI-PAGE RPG DIALOGUE)
     ========================================================================== */
  var dlgState = null;
  var lastDialogueInput = 0;
  MAY.dialogueOpen = false;

  function dialogueClip() {
    if (!dlgState) return null;
    return (dlgState.voiceClips && dlgState.voiceClips[dlgState.idx]) ||
      (dlgState.idx === 0 ? dlgState.voiceClip : null);
  }
  MAY.refreshDialogueVoiceUI = function () {
    var replay = document.getElementById("dlg-replay");
    if (replay) replay.hidden = !dlgState || !MAY.canSpeakDialogue ||
      !MAY.canSpeakDialogue(dlgState.pages[dlgState.idx] || "", dialogueClip());
  };
  MAY.replayDialoguePage = function () {
    if (!dlgState) return;
    var line = dlgState.pages[dlgState.idx] || "", clip = dialogueClip();
    if (MAY.stopSpeech) MAY.stopSpeech();
    if (clip && MAY.playVoice) MAY.playVoice(clip, { interrupt: true });
    else if (MAY.speak) MAY.speak(line, null, { interrupt: true, exactText: true });
  };

  function renderDialoguePage() {
    if (!dlgState) return;
    var box = document.getElementById("dialogue-box");
    var txt = document.getElementById("dlg-text");
    var pg = document.getElementById("dlg-page");
    var btn = document.getElementById("dlg-next");
    var line = dlgState.pages[dlgState.idx] || "";
    if (txt) txt.textContent = line;
    if (pg) pg.textContent = (dlgState.idx + 1) + "/" + dlgState.pages.length;
    var isLast = dlgState.idx >= dlgState.pages.length - 1;
    if (btn) btn.textContent = isLast ? (dlgState.endBtn || "✨ Mây hiểu rồi!") : "Tiếp theo ▸";
    MAY.refreshDialogueVoiceUI();
    if (box) box.classList.remove("hidden");
    if (MAY.sndDialogue) MAY.sndDialogue();
    MAY.replayDialoguePage();
  }

  MAY.openDialogue = function (opts) {
    if (!opts || !opts.pages || !opts.pages.length || dlgState) return;
    if (MAY.stopSpeech) MAY.stopSpeech();
    lastDialogueInput = 0;
    dlgState = {
      name: opts.name || "Bạn Đồng Hành",
      role: opts.role || "",
      icon: opts.icon || "💬",
      color: opts.color || "#ffd93d",
      pages: opts.pages.slice(),
      idx: 0,
      endBtn: opts.endBtn || "✨ Mây nhận lời!",
      voiceClip: opts.voiceClip || null,
      voiceClips: opts.voiceClips || null,
      onDone: opts.onDone || null
    };
    MAY.dialogueOpen = true;
    MAY.modalOpen = true;
    if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
    if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) {} }
    var av = document.getElementById("dlg-avatar");
    var nm = document.getElementById("dlg-name");
    var rl = document.getElementById("dlg-role");
    if (av) { av.textContent = dlgState.icon; av.style.borderColor = dlgState.color; }
    if (nm) { nm.textContent = dlgState.name; nm.style.color = dlgState.color; }
    if (rl) { rl.textContent = dlgState.role; rl.style.display = dlgState.role ? "inline-block" : "none"; }
    renderDialoguePage();
  };

  MAY.advanceDialogue = function () {
    if (!dlgState) return;
    if (MAY.stopSpeech) MAY.stopSpeech();
    if (dlgState.idx < dlgState.pages.length - 1) {
      dlgState.idx++;
      renderDialoguePage();
    } else {
      MAY.finishDialogue();
    }
  };

  /* Kết thúc hộp thoại và LUÔN chạy onDone (dùng cho nút cuối, Space/Enter trang cuối & phím Esc!) */
  MAY.finishDialogue = function () {
    if (!dlgState) return;
    var cb = dlgState.onDone;
    MAY.closeDialogue(false);
    if (cb) {
      try { cb(); } catch (e) { if (window.console) console.error("Dialogue onDone err:", e); }
    }
  };

  MAY.closeDialogue = function (invokeDone) {
    var cb = (invokeDone && dlgState) ? dlgState.onDone : null;
    if (dlgState && MAY.stopSpeech) MAY.stopSpeech();
    dlgState = null;
    MAY.dialogueOpen = false;
    if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
    var box = document.getElementById("dialogue-box");
    if (box) box.classList.add("hidden");
    var anyOther = ["ov-map", "ov-album", "ov-win", "ov-finale", "quiz-ov"].some(function (id) {
      var el = document.getElementById(id);
      return el && !el.classList.contains("hidden");
    });
    if (!anyOther) MAY.modalOpen = false;
    if (cb) {
      try { cb(); } catch (e) { if (window.console) console.error("Dialogue onDone err:", e); }
    }
  };

  var dlgBtn = document.getElementById("dlg-next");
  function advanceFromInput() {
    var now = performance.now();
    if (lastDialogueInput && now - lastDialogueInput < 250) return;
    lastDialogueInput = now;
    MAY.advanceDialogue();
  }
  if (dlgBtn) dlgBtn.onclick = advanceFromInput;
  var replayBtn = document.getElementById("dlg-replay");
  if (replayBtn) replayBtn.onclick = function () { MAY.replayDialoguePage(); };
  window.addEventListener("keydown", function (e) {
    if (!MAY.dialogueOpen) return;
    if (e.code === "Space" || e.code === "Enter") {
      if (e.target && e.target.closest && e.target.closest("#dlg-replay")) return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) advanceFromInput();
    } else if (e.code === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      MAY.finishDialogue();
    }
  }, true);

  /* ---- Banner Thức Tỉnh Kỹ Năng Mới ---- */
  var sbTimer = null;
  MAY.showSkillBanner = function (sp) {
    if (!sp) return;
    var el = document.getElementById("skill-banner");
    if (!el) return;
    var ico = document.getElementById("sb-ico");
    var ttl = document.getElementById("sb-title");
    var dsc = document.getElementById("sb-desc");
    if (ico) ico.textContent = sp.icon;
    if (ttl) ttl.textContent = sp.name.toUpperCase() + " (Phím " + sp.key + " + R)";
    if (dsc) dsc.textContent = sp.desc || "";
    el.classList.remove("hidden");
    if (MAY.sndSkillUnlock) MAY.sndSkillUnlock();
    if (MAY.playVoice) MAY.playVoice("skill_unlock");
    if (MAY.triggerSpellFlash) MAY.triggerSpellFlash(sp.color, 0.72);
    if (MAY.player && MAY.player.pos) MAY.burstAt(MAY.player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), sp.color, 24);
    clearTimeout(sbTimer);
    sbTimer = setTimeout(function () { el.classList.add("hidden"); }, 4600);
  };

  /* ==========================================================================
     2. HỆ THỐNG 3 TRÁI TIM ÁNH SÁNG & CHECKPOINT THÂN THIỆN
     ========================================================================== */
  MAY.hearts = 3;
  MAY.maxHearts = 3;
  var invulnT = 0;

  MAY.syncHeartsHUD = function (hurtPulse) {
    var el = document.getElementById("hearts-hud");
    if (!el) return;
    var s = "";
    for (var i = 0; i < MAY.maxHearts; i++) s += (i < MAY.hearts ? "❤️" : "🤍");
    el.textContent = s;
    if (hurtPulse) {
      el.classList.add("hurt");
      setTimeout(function () { el.classList.remove("hurt"); }, 350);
    }
  };

  MAY.resetHearts = function () {
    MAY.hearts = MAY.maxHearts;
    invulnT = 0;
    MAY.syncHeartsHUD(false);
  };

  MAY.healPlayer = function (amt) {
    if (MAY.hearts >= MAY.maxHearts) return;
    MAY.hearts = Math.min(MAY.maxHearts, MAY.hearts + (amt || 1));
    MAY.syncHeartsHUD(false);
    if (MAY.sndHeal) MAY.sndHeal();
    if (MAY.player && MAY.player.pos) MAY.burstAt(MAY.player.pos.clone().add(new THREE.Vector3(0, 1, 0)), 0xff5c8a, 12);
    MAY.toast("❤️ Hồi 1 Trái Tim Ánh Sáng!");
  };

  MAY.damagePlayer = function (amt, pushFromPos, msg) {
    if (invulnT > 0 || MAY.modalOpen || !MAY.started || (MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying())) return;
    invulnT = 1.65;
    MAY.hearts = Math.max(0, MAY.hearts - (amt || 1));
    MAY.syncHeartsHUD(true);
    if (MAY.sndHurt) MAY.sndHurt();
    if (MAY.player.triggerHurtAnim) MAY.player.triggerHurtAnim();
    if (MAY.player.addShake) MAY.player.addShake(0.42);
    if (MAY.triggerSpellFlash) MAY.triggerSpellFlash(0xff3b5c, 0.45);
    if (pushFromPos && MAY.player && MAY.player.vel) {
      var dx = MAY.player.pos.x - pushFromPos.x;
      var dz = MAY.player.pos.z - pushFromPos.z;
      var d = Math.hypot(dx, dz) || 1;
      MAY.player.vel.x = (dx / d) * 10;
      MAY.player.vel.z = (dz / d) * 10;
      if (MAY.player.onLand) MAY.player.vel.y = 5.0;
    }
    if (MAY.hearts <= 0) {
      MAY.hearts = MAY.maxHearts;
      MAY.syncHeartsHUD(false);
      var ctx = MAY.currentCtx;
      if (ctx && ctx.checkpoint) {
        MAY.player.pos.set(ctx.checkpoint.x, ctx.checkpoint.y, ctx.checkpoint.z);
        MAY.player.vel.set(0, 1, 0);
      }
      MAY.burstAt(MAY.player.pos.clone(), 0xffd93d, 20);
      MAY.toast("💫 Ánh sáng đỡ Mây đứng dậy rồi! Đầy 3 Tim — Thử lại nào!");
    } else if (msg) {
      MAY.toast("💔 " + msg);
    }
  };

  /* ==========================================================================
     3. HÌNH KHỐI QUÁI VẬT SƯƠNG XÁM & CÔNG TRÌNH GIẢI ĐỐ 3D
     ========================================================================== */
  function stdM(hex, rough, extra) {
    var o = { color: hex, roughness: rough !== undefined ? rough : 0.72 };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return new THREE.MeshStandardMaterial(o);
  }
  var glowRedEye = new THREE.MeshBasicMaterial({ color: 0xff3b5c });
  if (MAY.protectMaterial) MAY.protectMaterial(glowRedEye);

  function disposeRuntimeMesh(root) {
    if (!root) return;
    root.traverse(function (o) {
      if (o.isMesh || o.isPoints || o.isLine) {
        if (o.geometry && !o.userData.sharedGeo) try { o.geometry.dispose(); } catch (e) {}
        if (o.material) {
          var ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach(function (m) {
            if (m && m !== glowRedEye && m.dispose) try { m.dispose(); } catch (e) {}
          });
        }
      } else if (o.isSprite && o.material && o.material.dispose) {
        try { o.material.dispose(); } catch (e) {}
      }
    });
  }

  MAY.makeMonsterMesh = function (kind, scale) {
    var g = new THREE.Group();
    var haloMat = new THREE.MeshBasicMaterial({ color: 0x9333ea, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    var darkRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.055, 6, 20), haloMat);
    darkRing.rotation.x = Math.PI / 2; darkRing.position.y = 0.25; g.add(darkRing);
    g.userData.auraRing = darkRing;

    if (kind === "inkjelly") {
      var dome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
        new THREE.MeshPhysicalMaterial({ color: 0x2d1e3e, emissive: 0x6b21a8, emissiveIntensity: 0.55, roughness: 0.18, clearcoat: 0.9 }));
      dome.position.y = 0.65; g.add(dome);
      var frill = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.12, 8, 20), stdM(0x4c1d95, 0.35, { emissive: 0xa855f7, emissiveIntensity: 0.5 }));
      frill.rotation.x = Math.PI / 2; frill.position.y = 0.52; g.add(frill);
      for (var t = 0; t < 8; t++) {
        var a = (t / 8) * Math.PI * 2;
        var tn = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 1.15, 5, 8), stdM(0x1f122b, 0.45, { emissive: 0x7e22ce, emissiveIntensity: 0.4 }));
        tn.position.set(Math.cos(a) * 0.55, -0.25, Math.sin(a) * 0.55); tn.rotation.z = Math.cos(a) * 0.22; g.add(tn);
      }
      [-0.32, 0.32].forEach(function (ex) { var e = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), glowRedEye); e.position.set(ex, 0.92, -0.82); g.add(e); });
    } else if (kind === "thornshroom") {
      var stemPts = [new THREE.Vector2(0.56, 0), new THREE.Vector2(0.46, 0.45), new THREE.Vector2(0.38, 0.95), new THREE.Vector2(0.52, 1.05)];
      var stem = new THREE.Mesh(new THREE.LatheGeometry(stemPts, 14), stdM(0x4b4453, 0.85));
      g.add(stem);
      var cap = new THREE.Mesh(new THREE.SphereGeometry(1.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
        stdM(0x5b2c6f, 0.58, { emissive: 0x3b0764, emissiveIntensity: 0.38 }));
      cap.position.y = 0.88; g.add(cap);
      var gill = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 0.52, 0.16, 16), stdM(0x2e1a40, 0.9));
      gill.position.y = 0.86; g.add(gill);
      var spMat = stdM(0x231433, 0.45);
      for (var s = 0; s < 9; s++) {
        var sa = (s / 9) * Math.PI * 2;
        var sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.62, 6), spMat);
        sp.position.set(Math.cos(sa) * 0.78, 1.52, Math.sin(sa) * 0.78);
        sp.rotation.z = -Math.cos(sa) * 0.55; sp.rotation.x = Math.sin(sa) * 0.55; g.add(sp);
      }
      var crownSp = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 7), spMat); crownSp.position.y = 2.15; g.add(crownSp);
      [-0.22, 0.22].forEach(function (ex) {
        var e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), glowRedEye); e.position.set(ex, 0.62, -0.44); g.add(e);
        var br = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), spMat);
        br.position.set(ex, 0.74, -0.46); br.rotation.z = ex > 0 ? 0.35 : -0.35; g.add(br);
      });
      g.userData.cap = cap;
    } else if (kind === "sandscorpion") {
      var sm = new THREE.MeshPhysicalMaterial({ color: 0x3b2a26, emissive: 0x451a03, emissiveIntensity: 0.38, roughness: 0.32, clearcoat: 0.7 });
      for (var segI = 0; segI < 3; segI++) {
        var plate = new THREE.Mesh(new THREE.SphereGeometry(0.68 - segI * 0.10, 12, 8), sm);
        plate.scale.set(1.08, 0.52, 0.95); plate.position.set(0, 0.44, -0.45 + segI * 0.52); g.add(plate);
      }
      [-1, 1].forEach(function (side) {
        var arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.65, 5, 8), sm);
        arm.rotation.x = Math.PI / 2; arm.rotation.z = side * 0.45; arm.position.set(side * 0.65, 0.42, -0.68); g.add(arm);
        var pincer = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.10, 6, 12, Math.PI * 1.4), sm);
        pincer.rotation.x = Math.PI / 2; pincer.rotation.z = side > 0 ? 0.5 : -2.6; pincer.position.set(side * 0.88, 0.42, -1.18); g.add(pincer);
        for (var l = 0; l < 3; l++) {
          var leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.48, 4, 6), sm);
          leg.position.set(side * 0.75, 0.24, -0.25 + l * 0.42); leg.rotation.z = side * 0.85; g.add(leg);
        }
      });
      for (var k = 0; k < 5; k++) {
        var tSeg = new THREE.Mesh(new THREE.SphereGeometry(0.25 - k * 0.025, 10, 8), sm);
        tSeg.position.set(0, 0.62 + k * 0.35, 0.95 - k * 0.24); g.add(tSeg);
      }
      var sting = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 8), new THREE.MeshPhysicalMaterial({ color: 0xff9f1c, emissive: 0xff5500, emissiveIntensity: 0.95, clearcoat: 1.0 }));
      sting.rotation.x = -Math.PI * 0.72; sting.position.set(0, 2.25, -0.15); g.add(sting);
      [-0.25, 0.25].forEach(function (ex) { var e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), glowRedEye); e.position.set(ex, 0.56, -0.96); g.add(e); });
    } else if (kind === "stonegolem") {
      var gm = stdM(0x2e2942, 0.72, { flatShading: true });
      var crysM = new THREE.MeshPhysicalMaterial({ color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 1.1, roughness: 0.1, clearcoat: 1.0 });
      var torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.98, 0), gm); torso.scale.set(1.1, 1.15, 0.9); torso.position.y = 1.32; g.add(torso);
      var head = new THREE.Mesh(new THREE.OctahedronGeometry(0.54, 0), gm); head.position.set(0, 2.38, -0.12); g.add(head);
      var core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), crysM); core.position.set(0, 1.32, -0.78); g.add(core);
      [-1.28, 1.28].forEach(function (ax) {
        var pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), gm); pauldron.position.set(ax, 1.82, 0); g.add(pauldron);
        var spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.72, 5), crysM); spike.position.set(ax * 1.05, 2.35, 0); spike.rotation.z = ax > 0 ? -0.35 : 0.35; g.add(spike);
        var fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), gm); fist.position.set(ax * 1.06, 0.85, -0.28); g.add(fist);
      });
      [-0.22, 0.22].forEach(function (ex) { var e = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), glowRedEye); e.position.set(ex, 2.42, -0.52); g.add(e); });
      g.userData.armor = torso; g.userData.core = core;
    } else if (kind === "icewolf" || kind === "frostbear") {
      var fm = stdM(0x364963, 0.55, { emissive: 0x0c4a6e, emissiveIntensity: 0.42 });
      var iceMat = new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: 0.75, roughness: 0.1, clearcoat: 1.0 });
      var bd = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.95, 8, 12), fm); bd.rotation.x = Math.PI / 2; bd.position.y = 0.88; g.add(bd);
      [[-0.32, -0.45], [0.32, -0.45], [-0.32, 0.45], [0.32, 0.45]].forEach(function (lp) {
        var lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.52, 5, 8), fm); lg.position.set(lp[0], 0.36, lp[1]); g.add(lg);
      });
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), fm); hd.scale.set(0.92, 0.85, 1.3); hd.position.set(0, 1.18, -0.88); g.add(hd);
      [-0.24, 0.24].forEach(function (ex) {
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 6), fm); ear.position.set(ex, 1.62, -0.78); ear.rotation.z = ex > 0 ? -0.25 : 0.25; g.add(ear);
        var e = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6), glowRedEye); e.position.set(ex * 0.85, 1.26, -1.35); g.add(e);
      });
      var tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 8), iceMat); tail.rotation.x = Math.PI * 0.38; tail.position.set(0, 1.05, 1.05); g.add(tail);
      for (var is = 0; is < 5; is++) {
        var ic = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.65, 6), iceMat);
        ic.position.set(0, 1.52, -0.35 + is * 0.32); ic.rotation.x = 0.32; g.add(ic);
      }
    } else {
      /* stormcloud — Quái Mây Sấm & Trùm Cuối Vua Mây Bão có Vương Miện Sét + Áo Choàng Bão! */
      var cm = stdM(0x281e3b, 0.82, { emissive: 0x4c1d95, emissiveIntensity: 0.5 });
      var mainP = new THREE.Mesh(new THREE.SphereGeometry(0.92, 14, 12), cm); mainP.position.y = 1.25; g.add(mainP);
      for (var cp = 0; cp < 6; cp++) {
        var ca = (cp / 6) * Math.PI * 2;
        var pf = new THREE.Mesh(new THREE.SphereGeometry(0.56, 10, 8), cm);
        pf.position.set(Math.cos(ca) * 0.72, 1.08 + (cp % 2) * 0.28, Math.sin(ca) * 0.72); g.add(pf);
      }
      var crownMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      for (var cr = 0; cr < 5; cr++) {
        var cra = (cr / 5) * Math.PI * 2;
        var horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.58, 5), crownMat);
        horn.position.set(Math.cos(cra) * 0.45, 2.25, Math.sin(cra) * 0.45);
        horn.rotation.z = -Math.cos(cra) * 0.3; horn.rotation.x = Math.sin(cra) * 0.3; g.add(horn);
      }
      var bolt = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.05, 4), crownMat);
      bolt.rotation.x = Math.PI; bolt.position.set(0, 0.38, 0); g.add(bolt);
      [-0.32, 0.32].forEach(function (ex) { var e = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glowRedEye); e.position.set(ex, 1.35, -0.84); g.add(e); });
      g.userData.bolt = bolt;
    }
    if (scale) g.scale.setScalar(scale);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  };

  /* ---- Cây Cổ Thụ Chết Khô -> Hồi Sinh Nở Hoa + Mọc Nấm Lò Xo (Cốt truyện Màn 2 & Đảo Mây!) ---- */
  MAY.buildDeadTree = function (ctx, x, z, opts) {
    opts = opts || {};
    var y = opts.y !== undefined ? opts.y : ctx.groundH(x, z);
    var sc = opts.scale || 1.0;
    var root = new THREE.Group();
    root.position.set(x, y, z);

    /* Thân cây xám khô héo */
    var deadMat = stdM(0x524b47, 0.96, { normalMap: MAY.PBR ? MAY.PBR.bark.normalMap : null });
    var aliveBark = stdM(0x6e472b, 0.88, { map: MAY.PBR ? MAY.PBR.bark.map : null, normalMap: MAY.PBR ? MAY.PBR.bark.normalMap : null });
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * sc, 1.05 * sc, 5.4 * sc, 10), deadMat);
    trunk.position.y = 2.6 * sc; trunk.castShadow = true; trunk.receiveShadow = true; root.add(trunk);

    /* Cành khô trơ trụi */
    var deadBranches = new THREE.Group();
    for (var b = 0; b < 5; b++) {
      var a = (b / 5) * Math.PI * 2 + 0.3;
      var br = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * sc, 0.24 * sc, 2.8 * sc, 7), deadMat);
      br.position.set(Math.cos(a) * 1.15 * sc, (4.3 + (b % 2) * 0.7) * sc, Math.sin(a) * 1.15 * sc);
      br.rotation.z = -Math.cos(a) * 0.85; br.rotation.x = Math.sin(a) * 0.85;
      br.castShadow = true; deadBranches.add(br);
    }
    root.add(deadBranches);

    /* Tán lá xanh & hoa rực rỡ (ẩn ban đầu, bung nở khi được tưới Phép 🌿 Nở Hoa!) */
    var aliveGroup = new THREE.Group();
    var leafCol = opts.blossomColor || 0x4ade80;
    var leafMat = stdM(leafCol, 0.68, { emissive: leafCol, emissiveIntensity: 0.14 });
    var flowerCol = opts.flowerColor || 0xff7fa5;
    var flMat = stdM(flowerCol, 0.45, { emissive: flowerCol, emissiveIntensity: 0.45 });
    [[0, 6.2, 0, 2.7], [-1.7, 5.2, 0.9, 2.0], [1.8, 5.3, -0.7, 2.1], [0.4, 5.1, 1.8, 1.9], [-0.9, 5.4, -1.6, 1.9]].forEach(function (c) {
      var puff = new THREE.Mesh(new THREE.DodecahedronGeometry(c[3] * sc, 1), leafMat);
      puff.position.set(c[0] * sc, c[1] * sc, c[2] * sc);
      puff.castShadow = true; puff.receiveShadow = true;
      aliveGroup.add(puff);
    });
    for (var f = 0; f < 14; f++) {
      var fa = (f / 14) * Math.PI * 2;
      var fl = new THREE.Mesh(new THREE.SphereGeometry(0.34 * sc, 8, 6), flMat);
      fl.position.set(Math.cos(fa) * (2.1 + (f % 3) * 0.45) * sc, (4.9 + (f % 3) * 0.9) * sc, Math.sin(fa) * (2.1 + (f % 3) * 0.45) * sc);
      aliveGroup.add(fl);
    }
    /* Nấm lò xo nảy cao mọc dưới gốc khi cây hồi sinh! */
    if (opts.spawnBounce !== false) {
      var mStem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 0.9, 10), stdM(0xfff4d6, 0.8));
      mStem.position.set(2.4 * sc, 0.45, 0); aliveGroup.add(mStem);
      var mCap = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshPhysicalMaterial({ color: 0xff6b9d, emissive: 0xd946ef, emissiveIntensity: 0.45, roughness: 0.25, clearcoat: 0.8 }));
      mCap.position.set(2.4 * sc, 0.85, 0); aliveGroup.add(mCap);
    }
    aliveGroup.scale.setScalar(0.001);
    aliveGroup.visible = false;
    root.add(aliveGroup);
    ctx.add(root);
    if (ctx.addCollider) ctx.addCollider(x, z, 0.92 * sc, opts.tag || "dead_tree", { minY: y - 0.5, maxY: y + 5.6 * sc });

    var state = {
      root: root, trunk: trunk, aliveGroup: aliveGroup, revived: false, animT: 0,
      pos: new THREE.Vector3(x, y + 1.5, z),
      revive: function (instant) {
        if (state.revived) return;
        state.revived = true;
        trunk.material = aliveBark;
        aliveGroup.visible = true;
        if (opts.spawnBounce !== false) {
          ctx.addBouncePad(x + 2.4 * sc, y + 1.1, z, 2.0, 13.0);
        }
        if (instant) {
          state.animT = 1;
          aliveGroup.scale.setScalar(1);
        } else {
          if (MAY.sndTreeRevive) MAY.sndTreeRevive(state.pos);
          if (MAY.VFX) MAY.VFX.spawnGrowth(new THREE.Vector3(x, y, z));
          MAY.burstAt(new THREE.Vector3(x, y + 5.2 * sc, z), flowerCol, 22);
        }
      },
      update: function (dt) {
        if (state.revived && state.animT < 1) {
          state.animT = Math.min(1, state.animT + dt * 1.45);
          var ease = 1 - Math.pow(1 - state.animT, 3);
          aliveGroup.scale.setScalar(Math.max(0.01, ease));
        }
      }
    };
    return state;
  };

  /* ---- Đài Gương Mặt Trời (Màn 3: Đốt bóng tối & bắn tia Laser Vàng lên đỉnh Kim Tự Tháp!) ---- */
  MAY.buildSolarMirror = function (ctx, x, z, aimPos) {
    var y = ctx.groundH(x, z);
    var g = new THREE.Group();
    g.position.set(x, y, z);
    var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.45, 2.4, 8), stdM(0xd4a96a, 0.85, { map: MAY.TEX.rock }));
    ped.position.y = 1.2; ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
    var dish = new THREE.Group();
    dish.position.y = 2.85;
    var frame = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.16, 10, 22), stdM(0xffd93d, 0.3, { metalness: 0.75 }));
    var glassMat = new THREE.MeshPhysicalMaterial({ color: 0x3b2f3f, emissive: 0x000000, roughness: 0.12, metalness: 0.65, clearcoat: 1.0 });
    var glass = new THREE.Mesh(new THREE.CircleGeometry(1.05, 20), glassMat);
    dish.add(frame, glass);
    dish.lookAt(aimPos);
    g.add(dish);
    /* Lớp gai bóng tối phủ trên mặt gương */
    var shadowCover = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 0), stdM(0x281c36, 0.9, { emissive: 0x3b0764, emissiveIntensity: 0.35, flatShading: true }));
    shadowCover.position.y = 2.85; g.add(shadowCover);
    ctx.add(g);
    if (ctx.addCollider) ctx.addCollider(x, z, 1.35, "solar_mirror", { minY: y - 0.5, maxY: y + 3.8, walkable: true });

    var mirror = {
      group: g, lit: false, beam: null,
      pos: new THREE.Vector3(x, y + 2.85, z),
      activate: function (instant) {
        if (mirror.lit) return;
        mirror.lit = true;
        shadowCover.visible = false;
        glassMat.color.setHex(0xfff3b0);
        glassMat.emissive.setHex(0xffb703);
        glassMat.emissiveIntensity = 1.25;
        mirror.beam = MAY.VFX.spawnLaserBeam(mirror.pos.clone(), aimPos.clone(), 0xffd93d, true);
        if (!instant) {
          if (MAY.sndLaser) MAY.sndLaser(mirror.pos);
          MAY.burstAt(mirror.pos.clone(), 0xffd93d, 20);
        }
      }
    };
    return mirror;
  };

  /* ---- Tường Pha Lê / Băng Nứt (Màn 4 & 5: Đập vỡ tan bằng Phép 💎 Cộng Hưởng Pha Lê!) ---- */
  MAY.buildCrackedWall = function (ctx, x, y, z, rotY, colorHex, tag) {
    var g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY || 0;
    var mat = new THREE.MeshPhysicalMaterial({
      color: colorHex || 0x7e22ce, emissive: colorHex || 0x581c87, emissiveIntensity: 0.45,
      roughness: 0.25, clearcoat: 0.9, flatShading: true
    });
    for (var i = -2; i <= 2; i++) {
      var h = 3.8 + (i === 0 ? 1.2 : (Math.abs(i) === 1 ? 0.6 : 0));
      var slab = new THREE.Mesh(new THREE.ConeGeometry(1.15, h, 6), mat);
      slab.position.set(i * 1.25, h * 0.48, 0);
      slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
    }
    ctx.add(g);
    if (tag && ctx.addBoxCollider) {
      ctx.addBoxCollider(x, z, 6.8, 2.2, y - 0.5, y + 5.2, rotY || 0, tag);
    } else if (tag && ctx.addCollider) {
      ctx.addCollider(x, z, 3.2, tag);
    }
    var wall = {
      group: g, broken: false, pos: new THREE.Vector3(x, y + 2.0, z),
      shatter: function (instant) {
        if (wall.broken) return;
        wall.broken = true;
        g.visible = false;
        if (tag && ctx.removeCollider) ctx.removeCollider(tag);
        if (!instant) {
          if (MAY.sndShatter) MAY.sndShatter(wall.pos);
          if (MAY.VFX) MAY.VFX.spawnShatterBurst(wall.pos.clone(), colorHex || 0xc084fc);
        }
      }
    };
    return wall;
  };

  /* ==========================================================================
     4. MỞ RỘNG WORLD CONTEXT (NPC Giao Nhiệm Vụ, Kỹ Năng Thực Chiến, Quái & Boss)
     ========================================================================== */
  MAY.attachStoryEngine = function (ctx) {
    var ls = ctx.save;
    var st = ls.story;
    ctx.story = st;
    ctx.questNPCs = [];
    ctx.skillTargets = [];
    ctx.enemies = [];
    ctx.boss = null;
    ctx.bossOrbs = [];
    ctx.heartOrbs = [];
    ctx.updrafts = [];
    ctx.dynamicPlatforms = [];
    ctx.colliders = [];
    ctx.scheduledEvents = [];
    ctx.checkpoint = null;
    ctx.storyObjective = null; /* { icon, text, targetPos } */
    ctx._atmosphere = null;

    /* Bộ hẹn giờ an toàn theo dt (tự tạm dừng khi mở thoại/menu & tự hủy khi đổi màn — khử 100% lỗi setTimeout rò rỉ!) */
    ctx.scheduleEvent = function (delay, fn) {
      ctx.scheduledEvents.push({ t: delay, fn: fn });
    };

    /* Cài đặt độ cao nền bao gồm các Cầu Băng / Cầu Ánh Sáng tạo động từ phép thuật! */
    var baseGroundH = ctx.groundH;
    ctx.wrapDynamicGround = function () {
      var orig = ctx.groundH;
      ctx.groundH = function (x, z) {
        var h = orig(x, z);
        for (var i = 0; i < ctx.dynamicPlatforms.length; i++) {
          var pl = ctx.dynamicPlatforms[i];
          if (!pl.active) continue;
          var dx = x - pl.x, dz = z - pl.z;
          var c = Math.cos(-pl.rotY), s = Math.sin(-pl.rotY);
          var lx = dx * c - dz * s, lz = dx * s + dz * c;
          if (Math.abs(lx) <= pl.hw && Math.abs(lz) <= pl.hl && pl.y > h) {
            h = pl.y;
          }
        }
        return h;
      };
    };

    ctx.addDynamicPlatform = function (x, y, z, width, length, rotY, active) {
      var p = { x: x, y: y, z: z, hw: width * 0.5, hl: length * 0.5, rotY: rotY || 0, active: !!active };
      ctx.dynamicPlatforms.push(p);
      return p;
    };

    /* Va chạm rắn 3D đa hình dạng: Cylinder (trụ), OBB/AABB (hộp xoay 3D) & Sphere (cầu/vòm), hỗ trợ đi bộ trên đỉnh (walkable)! */
    ctx.addCollider = function (x, z, r, tag, yRange) {
      if (typeof x !== "number" || typeof z !== "number" || isNaN(x) || isNaN(z)) return null;
      var c = { shape: "cylinder", x: x, z: z, r: r, tag: tag || null };
      if (yRange) {
        if (yRange.minY !== undefined) c.minY = yRange.minY;
        if (yRange.maxY !== undefined) c.maxY = yRange.maxY;
        if (yRange.walkable) c.walkable = true;
      }
      ctx.colliders.push(c);
      return c;
    };
    ctx.addBoxCollider = function (x, z, width, depth, minY, maxY, rotY, tag, opts) {
      if (typeof x !== "number" || typeof z !== "number" || isNaN(x) || isNaN(z)) return null;
      opts = opts || {};
      var c = {
        shape: "box",
        x: x, z: z,
        hx: Math.abs(width || 2) * 0.5,
        hz: Math.abs(depth || 2) * 0.5,
        rotY: rotY || 0,
        minY: minY !== undefined ? minY : -100,
        maxY: maxY !== undefined ? maxY : 100,
        walkable: !!opts.walkable,
        tag: tag || null
      };
      ctx.colliders.push(c);
      return c;
    };
    ctx.addSphereCollider = function (x, y, z, r, tag, opts) {
      if (typeof x !== "number" || typeof z !== "number" || isNaN(x) || isNaN(z)) return null;
      opts = opts || {};
      var c = {
        shape: "sphere",
        x: x, y: y, z: z,
        r: Math.abs(r || 1.2),
        minY: opts.minY !== undefined ? opts.minY : (y - Math.abs(r || 1.2)),
        maxY: opts.maxY !== undefined ? opts.maxY : (y + Math.abs(r || 1.2)),
        walkable: !!opts.walkable,
        tag: tag || null
      };
      ctx.colliders.push(c);
      return c;
    };
    ctx.getColliderTopY = function (x, z, curFeetY) {
      var topY = -999;
      for (var i = 0; i < ctx.colliders.length; i++) {
        var col = ctx.colliders[i];
        if (!col.walkable || col.maxY === undefined) continue;
        if (curFeetY < col.maxY - 0.65) continue;
        if (col.shape === "box") {
          var dx = x - col.x, dz = z - col.z;
          var cs = Math.cos(-(col.rotY || 0)), sn = Math.sin(-(col.rotY || 0));
          var lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
          if (Math.abs(lx) <= col.hx + 0.35 && Math.abs(lz) <= col.hz + 0.35 && col.maxY > topY) {
            topY = col.maxY;
          }
        } else if (col.shape === "cylinder") {
          if (Math.hypot(x - col.x, z - col.z) <= (col.r || 1.2) + 0.32 && col.maxY > topY) {
            topY = col.maxY;
          }
        }
      }
      return topY;
    };
    ctx.removeCollider = function (tag) {
      for (var i = ctx.colliders.length - 1; i >= 0; i--) {
        if (ctx.colliders[i].tag === tag) ctx.colliders.splice(i, 1);
      }
    };

    /* Cột khí nâng (tạo ra mỗi khi tung 🌈 Lốc Cầu Vồng -> nhảy vào bay vọt lên cao!) */
    ctx.addUpdraft = function (x, y, z, r, dur) {
      ctx.updrafts.push({ x: x, y: y, z: z, r: r || 3.8, life: dur || 5.2 });
    };

    /* Khí quyển Sương Xám -> Hồi Sinh Rực Rỡ sau khi hạ Boss! */
    ctx.setupAtmosphere = function (gloomy, bright, alreadyBright) {
      ctx._atmosphere = {
        gloomy: gloomy, bright: bright,
        t: alreadyBright ? 1 : 0,
        target: alreadyBright ? 1 : 0
      };
      applyAtmoBlend(ctx._atmosphere, alreadyBright ? 1 : 0);
    };

    function applyAtmoBlend(a, k) {
      var cFog = new THREE.Color(a.gloomy.fog).lerp(new THREE.Color(a.bright.fog), k);
      if (MAY.scene.fog && MAY.scene.fog.color) {
        MAY.scene.fog.color.copy(cFog);
        if (MAY.scene.fog.density !== undefined && a.gloomy.density !== undefined) {
          MAY.scene.fog.density = a.gloomy.density + (a.bright.density - a.gloomy.density) * k;
        }
      }
      if (MAY.scene.background && MAY.scene.background.isColor) MAY.scene.background.copy(cFog);
      if (a.gloomy.sunInt !== undefined) MAY.sun.intensity = a.gloomy.sunInt + (a.bright.sunInt - a.gloomy.sunInt) * k;
      if (a.gloomy.hemiInt !== undefined) MAY.hemiLight.intensity = a.gloomy.hemiInt + (a.bright.hemiInt - a.gloomy.hemiInt) * k;
      if (ctx.skyMesh && ctx.skyMesh.material && ctx.skyMesh.material.uniforms && a.gloomy.zenith) {
        var u = ctx.skyMesh.material.uniforms;
        u.uZenith.value.setHex(a.gloomy.zenith).lerp(new THREE.Color(a.bright.zenith), k);
        u.uHorizon.value.setHex(a.gloomy.horizon).lerp(new THREE.Color(a.bright.horizon), k);
      }
    }

    ctx.restoreWorld = function () {
      if (ctx._atmosphere) ctx._atmosphere.target = 1;
      if (MAY.triggerSpellFlash) MAY.triggerSpellFlash(0xffe066, 0.7);
    };

    /* Đặt Mục Tiêu Cốt Truyện Đang Làm (cập nhật ngay HUD + La bàn + Cột sáng dẫn đường!) */
    ctx.setObjective = function (icon, text, targetPos) {
      ctx.storyObjective = { icon: icon, text: text, targetPos: targetPos ? targetPos.clone() : null };
      var oi = document.getElementById("obj-icon");
      var ow = document.getElementById("obj-word");
      if (oi) oi.textContent = icon || "✨";
      if (ow) ow.textContent = text;
    };

    /* Rơi Tim Ánh Sáng hồi máu khi thanh tẩy quái */
    ctx.spawnHeartOrb = function (pos) {
      var m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.42, 0),
        new THREE.MeshPhysicalMaterial({ color: 0xff4d6d, emissive: 0xff2a55, emissiveIntensity: 1.0, clearcoat: 1.0 })
      );
      m.position.copy(pos);
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: 0xff5c8a, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
      gl.scale.set(2.2, 2.2, 1); m.add(gl);
      ctx.add(m);
      ctx.heartOrbs.push({ mesh: m, baseY: pos.y, age: 0 });
    };

    /* ---- A. NPC Giao Nhiệm Vụ có biểu tượng ! / ? / ★? nổi 3D ---- */
    function makeQuestMarkerSprite(text, bg) {
      var c = document.createElement("canvas"); c.width = 160; c.height = 160;
      var g = c.getContext("2d");
      g.fillStyle = bg || "#ffd93d";
      g.beginPath(); g.arc(80, 80, 58, 0, Math.PI * 2); g.fill();
      g.lineWidth = 8; g.strokeStyle = "#ffffff"; g.stroke();
      g.fillStyle = "#14263d"; g.font = "900 72px system-ui,sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(text, 80, 84);
      var tx = new THREE.CanvasTexture(c);
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false }));
      sp.scale.set(1.12, 1.12, 1);
      return sp;
    }

    ctx.addQuestNPC = function (cfg) {
      var x = cfg.pos[0], z = cfg.pos.length === 3 ? cfg.pos[2] : cfg.pos[1];
      var y = cfg.pos.length === 3 ? cfg.pos[1] : ctx.groundH(x, z);
      var g = MAY.makeAnimal(cfg.kind, { scale: cfg.scale || 1.25 });
      g.position.set(x, y, z);
      g.rotation.y = cfg.rotY || 0;
      if (!cfg.floating) g.add(MAY.makeContactShadow(0.9, 0.6));

      /* Vòng hào quang vàng dịu đặt sát mặt đất dưới chân NPC Giao Nhiệm Vụ */
      var aura = MAY.VFX.makeRunePlane(1.75, 0xffd93d, 0.55);
      aura.position.y = cfg.floating ? -1.45 : 0.08; g.add(aura);

      var nameLb = MAY.makeLabel(cfg.icon + " " + cfg.name, { w: 480, sx: 3.6, sy: 0.82, bg: "rgba(10,32,56,.88)", color: "#ffd93d" });
      nameLb.position.set(0, (cfg.labelY || 2.3), 0); g.add(nameLb);

      var marker = makeQuestMarkerSprite("!", "#ffd93d");
      marker.position.set(0, (cfg.labelY || 2.3) + 1.15, 0);
      g.add(marker);
      ctx.add(g);

      var npc = {
        group: g, aura: aura, marker: marker, name: cfg.name,
        pos: new THREE.Vector3(x, y + 1.0, z),
        baseY: y, floating: !!cfg.floating, labelY: cfg.labelY || 2.3,
        state: "!", autoGreeted: false, autoGreet: cfg.autoGreet !== false,
        onTalk: cfg.onTalk,
        setMarker: function (sym) {
          npc.state = sym;
          g.remove(npc.marker);
          if (npc.marker.material && npc.marker.material.map) npc.marker.material.map.dispose();
          if (npc.marker.material) npc.marker.material.dispose();
          var bg = sym === "!" ? "#ffd93d" : (sym === "★" ? "#ff9f1c" : (sym === "♥" ? "#4ade80" : "#cbd5e1"));
          npc.marker = makeQuestMarkerSprite(sym, bg);
          npc.marker.position.set(0, npc.labelY + 1.15, 0);
          g.add(npc.marker);
        }
      };
      ctx.questNPCs.push(npc);
      ctx.interactives.push({
        obj: g, label: "💬 Trò chuyện với " + cfg.name, isQuestNPC: true,
        onInteract: function () { if (npc.onTalk) npc.onTalk(npc); }
      });
      return npc;
    };

    /* ---- A2. HỆ THỐNG NHIỆM VỤ PHỤ TƯƠNG TÁC ĐA BƯỚC (7/7 vùng đất — NPC màu ngọc lam -> Nhiệm vụ 3D -> Trả thưởng!) ---- */
    ctx.sideQuest = null;
    ctx.sideQuestStatus = null;

    function makeSideQuestMesh(kind, colorHex) {
      var g = new THREE.Group();
      var col = colorHex || 0x22d3ee;
      var mat = new THREE.MeshPhysicalMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, roughness: 0.25, clearcoat: 0.9 });
      if (kind === "lantern" || kind === "hearth" || kind === "beacon") {
        var ped = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.3, 8), stdM(0x475569, 0.8));
        ped.position.y = 0.65; g.add(ped);
        var orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshPhysicalMaterial({ color: 0x334155, emissive: 0x000000, roughness: 0.2, clearcoat: 1.0 }));
        orb.position.y = 1.65; g.add(orb);
        var pl = MAY.makePooledLight ? MAY.makePooledLight(col, 0, 18) : new THREE.PointLight(col, 0, 18); pl.position.y = 1.9; g.add(pl);
        g.userData.orb = orb; g.userData.pl = pl; g.userData.litColor = col;
      } else if (kind === "bottle" || kind === "basket" || kind === "gnomon" || kind === "wood") {
        var body = new THREE.Mesh(
          kind === "wood" ? new THREE.CylinderGeometry(0.24, 0.24, 1.1, 8) :
          kind === "gnomon" ? new THREE.ConeGeometry(0.35, 1.25, 4) :
          new THREE.CylinderGeometry(0.32, 0.42, 0.85, 10),
          mat
        );
        if (kind === "wood") body.rotation.z = Math.PI / 2;
        body.position.y = 0.65; g.add(body);
        g.userData.pickup = true;
      } else {
        /* conch / chime / sundial */
        var sh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.36, 0.12, 24, 6), mat);
        sh.position.y = 1.05; g.add(sh);
        var pl2 = MAY.makePooledLight ? MAY.makePooledLight(col, 0.6, 14) : new THREE.PointLight(col, 0.6, 14); pl2.position.y = 1.2; g.add(pl2);
        g.userData.orb = sh; g.userData.pl = pl2; g.userData.litColor = col;
      }
      var ring = MAY.VFX.makeRunePlane(1.45, col, 0.48);
      ring.position.y = 0.10; g.add(ring);
      g.userData.ring = ring;
      g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      return g;
    }

    ctx.setupSideQuest = function (cfg) {
      var def = (MAY.SIDE_QUESTS && MAY.SIDE_QUESTS[ctx.id]) || null;
      if (!def || !cfg) return null;
      var sqSave = ls.sideQuest || (ls.sideQuest = { stage: 0, doneIds: [], done: false });
      var nx = cfg.npcPos[0], nz = cfg.npcPos.length === 3 ? cfg.npcPos[2] : cfg.npcPos[1];
      var ny = cfg.npcPos.length === 3 ? cfg.npcPos[1] : ctx.groundH(nx, nz);

      var npcG = MAY.makeAnimal(cfg.npcKind || def.npcKind, { scale: cfg.npcScale || 1.15 });
      npcG.position.set(nx, ny, nz);
      npcG.rotation.y = cfg.npcRotY || 0;
      if (!cfg.floating) npcG.add(MAY.makeContactShadow(0.8, 0.55));
      var aura = MAY.VFX.makeRunePlane(1.5, 0x22d3ee, 0.5);
      aura.position.y = cfg.floating ? -1.2 : 0.07; npcG.add(aura);
      var nameLb = MAY.makeLabel(def.npcIcon + " " + def.npcName, { w: 460, sx: 3.3, sy: 0.78, bg: "rgba(6,44,58,0.90)", color: "#67e8f9" });
      nameLb.position.set(0, cfg.labelY || 2.15, 0); npcG.add(nameLb);
      ctx.trackLabel(nameLb, 24);

      var marker = makeQuestMarkerSprite("!", "#22d3ee");
      marker.position.set(0, (cfg.labelY || 2.15) + 1.05, 0);
      npcG.add(marker);
      ctx.add(npcG);

      var stations = [];
      var sqObj = {
        def: def, save: sqSave, npcGroup: npcG, aura: aura, marker: marker,
        npcPos: new THREE.Vector3(nx, ny + 1.0, nz),
        baseY: ny, floating: !!cfg.floating, labelY: cfg.labelY || 2.15,
        stations: stations,
        setMarker: function (sym) {
          npcG.remove(sqObj.marker);
          if (sqObj.marker.material && sqObj.marker.material.map) sqObj.marker.material.map.dispose();
          if (sqObj.marker.material) sqObj.marker.material.dispose();
          var bg = sym === "!" ? "#22d3ee" : (sym === "★" ? "#fbbf24" : (sym === "✓" ? "#4ade80" : "#94a3b8"));
          sqObj.marker = makeQuestMarkerSprite(sym, bg);
          sqObj.marker.position.set(0, sqObj.labelY + 1.05, 0);
          npcG.add(sqObj.marker);
        },
        syncState: function () {
          var total = stations.length;
          var doneN = 0;
          var othersDone = 0;
          var othersTotal = 0;
          stations.forEach(function (stItem) {
            var isDone = sqSave.done || sqSave.doneIds.indexOf(stItem.id) !== -1;
            stItem.done = isDone;
            if (isDone) doneN++;
            if (!stItem.finalOnly) {
              othersTotal++;
              if (isDone) othersDone++;
            }
          });
          var nextPos = null;
          var nextLabel = "";
          stations.forEach(function (stItem) {
            var isDone = stItem.done;
            var unlocked = sqSave.stage >= 1 && !sqSave.done && (!stItem.finalOnly || othersDone >= othersTotal);
            stItem.unlocked = unlocked;
            if (!isDone && unlocked && !nextPos) { nextPos = stItem.pos; nextLabel = stItem.label; }
            if (stItem.group.userData.pickup) {
              stItem.group.visible = (sqSave.stage >= 1 && !isDone);
            } else {
              stItem.group.visible = true;
              if (stItem.group.userData.ring) stItem.group.userData.ring.visible = unlocked && !isDone;
              if (isDone && stItem.group.userData.orb) {
                stItem.group.userData.orb.material.color.setHex(stItem.group.userData.litColor || 0xffe066);
                if (stItem.group.userData.orb.material.emissive) {
                  stItem.group.userData.orb.material.emissive.setHex(stItem.group.userData.litColor || 0xffb703);
                  stItem.group.userData.orb.material.emissiveIntensity = 1.25;
                }
                if (stItem.group.userData.pl) stItem.group.userData.pl.intensity = 2.6;
              }
            }
            if (stItem.labelSp) stItem.labelSp.visible = unlocked && !isDone;
          });

          if (sqSave.done) {
            sqObj.setMarker("✓");
            ctx.sideQuestStatus = { done: true, text: "✅ Đã xong: " + def.title, count: total, total: total, targetPos: null };
          } else if (sqSave.stage === 0) {
            sqObj.setMarker("!");
            ctx.sideQuestStatus = { done: false, text: "📜 Nhiệm vụ phụ: Gặp " + def.npcName + " (! xanh)", count: 0, total: total, targetPos: sqObj.npcPos };
          } else if (doneN >= total) {
            sqSave.stage = 2; MAY.persist();
            sqObj.setMarker("★");
            ctx.sideQuestStatus = { done: false, text: "📜 Nhiệm vụ phụ: Báo tin cho " + def.npcName + " (★)", count: doneN, total: total, targetPos: sqObj.npcPos };
          } else {
            sqObj.setMarker("?");
            ctx.sideQuestStatus = { done: false, text: "📜 " + def.icon + " " + (nextLabel || def.title) + " (" + doneN + "/" + total + ")", count: doneN, total: total, targetPos: nextPos };
          }
          if (MAY.refreshHUD) MAY.refreshHUD();
        },
        completeTask: function (stItem) {
          if (sqSave.stage < 1 || sqSave.done || stItem.done) return;
          if (stItem.finalOnly) {
            var othersDone = stations.filter(function (s) { return !s.finalOnly && sqSave.doneIds.indexOf(s.id) !== -1; }).length;
            var othersTotal = stations.filter(function (s) { return !s.finalOnly; }).length;
            if (othersDone < othersTotal) {
              MAY.toast("📜 Hãy hoàn thành các bước trước đó (" + othersDone + "/" + othersTotal + ") rồi mới kích hoạt bước cuối nhé!");
              return;
            }
          }
          if (sqSave.doneIds.indexOf(stItem.id) === -1) sqSave.doneIds.push(stItem.id);
          MAY.persist();
          if (MAY.sndChime) MAY.sndChime(sqSave.doneIds.length);
          MAY.burstAt(stItem.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), stItem.color || 0x22d3ee, 18);
          sqObj.syncState();
          var doneN = stations.filter(function (s) { return s.done; }).length;
          if (doneN >= stations.length) {
            MAY.toast("📜 " + def.icon + " Xong hết các bước rồi! Quay lại gặp " + def.npcName + " (★) nhận thưởng!", "Xong rồi! Quay lại báo tin cho bạn nhé!");
          } else {
            MAY.toast("📜 " + def.icon + " Đã xong: " + stItem.label + " (" + doneN + "/" + stations.length + ")");
          }
        }
      };

      (cfg.tasks || []).forEach(function (tk, idx) {
        var tx = tk.pos[0], tz = tk.pos.length === 3 ? tk.pos[2] : tk.pos[1];
        var ty = tk.pos.length === 3 ? tk.pos[1] : ctx.groundH(tx, tz);
        var meshG = makeSideQuestMesh(tk.kind || "lantern", tk.color || 0x22d3ee);
        meshG.position.set(tx, ty, tz);
        ctx.add(meshG);
        var lb = MAY.makeLabel("📜 " + tk.label, { w: 420, sx: 3.1, sy: 0.72, bg: "rgba(6,44,58,0.88)", color: "#a5f3fc" });
        lb.position.set(tx, ty + 2.35, tz);
        ctx.add(lb);
        ctx.trackLabel(lb, 24);
        var stItem = {
          id: tk.id || ("sqt_" + idx),
          label: tk.label,
          kind: tk.kind || "lantern",
          color: tk.color || 0x22d3ee,
          finalOnly: !!tk.finalOnly,
          pos: new THREE.Vector3(tx, ty + 0.8, tz),
          group: meshG,
          labelSp: lb,
          done: false,
          unlocked: false,
          _warnCd: 0
        };
        stations.push(stItem);
        ctx.interactives.push({
          obj: meshG, label: "📜 " + tk.label, isSideQuestTask: true,
          isActive: function () { return sqSave.stage >= 1 && !sqSave.done && !stItem.done && !!stItem.unlocked; },
          onInteract: function () { sqObj.completeTask(stItem); }
        });
      });

      ctx.interactives.push({
        obj: npcG, label: "📜 Nhiệm vụ phụ: " + def.npcName, isQuestNPC: true,
        onInteract: function () {
          if (sqSave.done) {
            MAY.openDialogue({
              name: def.npcName, role: def.npcRole, icon: def.npcIcon, color: "#67e8f9",
              pages: [def.donePages[0]], endBtn: "✨ Vui quá!"
            });
          } else if (sqSave.stage === 0) {
            MAY.openDialogue({
              name: def.npcName, role: def.npcRole, icon: def.npcIcon, color: "#67e8f9",
              pages: def.acceptPages, endBtn: "📜 Nhận Nhiệm Vụ Phụ!",
              onDone: function () {
                sqSave.stage = 1; MAY.persist();
                sqObj.syncState();
                MAY.toast("📜 Đã nhận nhiệm vụ phụ: " + def.title + "!");
              }
            });
          } else if (sqSave.stage >= 2) {
            MAY.openDialogue({
              name: def.npcName, role: def.npcRole, icon: def.npcIcon, color: "#67e8f9",
              pages: def.donePages, endBtn: "🏅 Nhận Huy Hiệu!",
              onDone: function () {
                sqSave.done = true; sqSave.stage = 3; MAY.persist();
                MAY.healPlayer(3);
                if (MAY.sndGem) MAY.sndGem();
                MAY.burstAt(sqObj.npcPos.clone().add(new THREE.Vector3(0, 1, 0)), 0x22d3ee, 28);
                MAY.toast(def.rewardMsg, "Hoàn thành nhiệm vụ phụ rồi! Mây giỏi quá!");
                sqObj.syncState();
              }
            });
          } else {
            MAY.openDialogue({
              name: def.npcName, role: def.npcRole, icon: def.npcIcon, color: "#67e8f9",
              pages: def.remindPages, endBtn: "📜 Đi làm tiếp nào!"
            });
          }
        }
      });

      ctx.sideQuest = sqObj;
      sqObj.syncState();
      return sqObj;
    };

    /* ---- B. Vật Thể Giải Đố Tương Tác Phép Thuật Thực Chiến ---- */
    ctx.addSkillTarget = function (cfg) {
      var pos = cfg.pos instanceof THREE.Vector3 ? cfg.pos : new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      var hintLb = null;
      if (cfg.hint) {
        hintLb = MAY.makeLabel(cfg.hint, { sx: 3.6, sy: 0.85, bg: "rgba(18,28,50,.85)", color: "#ffe8a3" });
        hintLb.position.set(pos.x, pos.y + (cfg.hintY || 3.2), pos.z);
        ctx.add(hintLb);
        ctx.trackLabel(hintLb, 22);
      }
      var ring = MAY.VFX.makeRunePlane(cfg.ringRadius || 2.2, cfg.ringColor || 0xffd93d, 0.42);
      ring.position.set(pos.x, pos.y + 0.12, pos.z);
      ctx.add(ring);

      var tObj = {
        id: cfg.id, pos: pos, radius: cfg.radius || 7.5,
        reqSpell: cfg.reqSpell, /* string hoặc array */
        done: !!cfg.done,
        isActive: cfg.isActive || function () { return true; },
        hintLb: hintLb, ring: ring,
        onHit: cfg.onHit,
        markDone: function () {
          tObj.done = true;
          if (tObj.hintLb) tObj.hintLb.visible = false;
          if (tObj.ring) tObj.ring.visible = false;
        }
      };
      if (tObj.done) tObj.markDone();
      ctx.skillTargets.push(tObj);
      return tObj;
    };

    /* ---- C. Quái Vật Tuần Tra (có cảnh báo đỏ, bị trói, bị đẩy, bị HẤT BAY LÊN TRỜI!) ---- */
    ctx.addEnemy = function (cfg) {
      var x = cfg.pos[0], z = cfg.pos.length === 3 ? cfg.pos[2] : cfg.pos[1];
      var y = cfg.pos.length === 3 ? cfg.pos[1] : ctx.groundH(x, z);
      var mesh = MAY.makeMonsterMesh(cfg.kind, cfg.scale || 1.0);
      mesh.position.set(x, y, z);
      if (!cfg.flying && !cfg.underwater) mesh.add(MAY.makeContactShadow(0.95, 0.65));
      ctx.add(mesh);

      var lb = MAY.makeLabel(cfg.name || "Quái Sương Xám", { sx: 2.8, sy: 0.7, bg: "rgba(56,12,32,.85)", color: "#ffb3c6" });
      lb.position.set(x, y + 2.4, z); ctx.add(lb);
      ctx.trackLabel(lb, 18);

      var en = {
        id: cfg.id || ("en_" + ctx.enemies.length),
        kind: cfg.kind, name: cfg.name || "Quái Sương Xám",
        weakSpell: cfg.weakSpell, /* string hoặc array */
        mesh: mesh, label: lb, baseScale: cfg.scale || 1.0,
        hx: x, hy: y, hz: z,
        flying: !!cfg.flying, underwater: !!cfg.underwater,
        patrolR: cfg.patrolR || 7,
        speed: cfg.speed || 3.4,
        aggroR: cfg.aggroR || 15,
        state: "patrol", /* patrol | chase | windup | stunned | launched | purified */
        timer: 0, atkCd: 1.5, wa: Math.random() * 6.28,
        vy: 0, launchT: 0,
        onPurified: cfg.onPurified || null,
        launchToSky: function () {
          if (en.state === "launched" || en.state === "purified") return;
          en.state = "launched";
          en.launchT = 0;
          en.vy = 23.5;
          if (en.label) en.label.visible = false;
          if (MAY.sndLaunchSky) MAY.sndLaunchSky(en.mesh.position);
          MAY.burstAt(en.mesh.position.clone(), 0xf472b6, 16);
          MAY.toast("🌈 Vút!! " + en.name + " bị Lốc Cầu Vồng hất bay thẳng lên trời!", "Hất bay quái vật lên trời rồi!");
        },
        purify: function (msg, colorHex) {
          if (en.state === "purified") return;
          en.state = "purified";
          en.mesh.visible = false;
          if (en.label) en.label.visible = false;
          MAY.sndFriend();
          MAY.burstAt(en.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), colorHex || 0x4ade80, 20);
          ctx.spawnHeartOrb(en.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0)));
          if (msg) MAY.toast(msg);
          if (en.onPurified) en.onPurified(en);
        }
      };
      ctx.enemies.push(en);
      return en;
    };

    /* ---- D. Đạn Quái / Boss (có thể đẩy ngược bằng 🌊 Sóng hoặc 💎 Pha Lê!) ---- */
    ctx.spawnBossOrb = function (fromPos, dirVec, opts) {
      opts = opts || {};
      var col = opts.color || 0x2e1065;
      var m = new THREE.Mesh(
        new THREE.SphereGeometry(opts.radius || 0.72, 12, 10),
        new THREE.MeshPhysicalMaterial({ color: col, emissive: opts.emissive || 0xa855f7, emissiveIntensity: 0.85, roughness: 0.2, clearcoat: 1.0 })
      );
      m.position.copy(fromPos);
      var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: opts.emissive || 0xff3b5c, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
      gl.scale.set(2.8, 2.8, 1); m.add(gl);
      ctx.add(m);
      ctx.bossOrbs.push({
        mesh: m, dir: dirVec.clone().normalize(), speed: opts.speed || 9.5,
        life: opts.life || 6.5, reflectable: !!opts.reflectable, reflected: false,
        reflectSpell: opts.reflectSpell || "wave",
        onReflectHitBoss: opts.onReflectHitBoss || null
      });
    };

    /* ---- E. Đấu Trường Trùm 3 Pha (Boss Controller) ---- */
    ctx.setBoss = function (cfg) {
      var pos = cfg.pos instanceof THREE.Vector3 ? cfg.pos : new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      cfg.mesh.position.copy(pos);
      cfg.mesh.visible = !!cfg.startActive;
      ctx.add(cfg.mesh);

      var boss = {
        name: cfg.name, icon: cfg.icon || "👾",
        mesh: cfg.mesh, home: pos.clone(), pos: cfg.mesh.position,
        baseScale: (cfg.mesh && cfg.mesh.scale && cfg.mesh.scale.x) ? cfg.mesh.scale.x : 1.0,
        arenaR: cfg.arenaR || 22,
        hp: cfg.maxHp || 3, maxHp: cfg.maxHp || 3,
        active: !!cfg.startActive, defeated: !!st.bossDown,
        state: "idle", /* idle | vulnerable | stunned | charging | launched | defeated */
        stateT: 0, atkT: 2.2, subState: {}, windupT: 0, windupDuration: 0,
        tipFn: cfg.tipFn,
        onSpellHit: cfg.onSpellHit,
        onTick: cfg.onTick,
        onDefeat: cfg.onDefeat,
        telegraphAttack: function (duration) {
          boss.windupDuration = duration;
          boss.windupT = duration;
        },
        syncHUD: function () {
          var hud = document.getElementById("boss-hud");
          if (!hud) return;
          if (!boss.active || boss.defeated) { hud.classList.add("hidden"); return; }
          hud.classList.remove("hidden");
          var nm = document.getElementById("boss-name");
          var ph = document.getElementById("boss-phase");
          var fl = document.getElementById("boss-fill");
          var tp = document.getElementById("boss-tip");
          if (nm) nm.textContent = boss.icon + " " + boss.name.toUpperCase();
          var curP = Math.min(boss.maxHp, boss.maxHp - boss.hp + 1);
          if (ph) ph.textContent = "Pha " + curP + "/" + boss.maxHp;
          if (fl) fl.style.width = Math.max(0, Math.round(boss.hp / boss.maxHp * 100)) + "%";
          if (tp && boss.tipFn) tp.textContent = boss.tipFn(boss);
        },
        activate: function (afterIntroFn) {
          if (boss.defeated || boss.active) {
            if (afterIntroFn) afterIntroFn();
            return;
          }
          boss.active = true;
          boss.mesh.visible = true;
          boss.syncHUD();
          if (MAY.sndBossRoar) MAY.sndBossRoar(boss.pos);
          if (MAY.player.addShake) MAY.player.addShake(0.38);
          MAY.burstAt(boss.pos.clone().add(new THREE.Vector3(0, 2, 0)), 0xff3b5c, 22);
          if (MAY.Cutscene && MAY.Cutscene.playBossIntro && MAY.started) {
            boss.introPlaying = true;
            if (boss.mesh.userData.playClip) boss.mesh.userData.playClip("intro", false);
            MAY.Cutscene.playBossIntro(ctx, boss, function (skipped) {
              boss.introPlaying = false;
              boss.mesh.rotation.x = 0;
              if (boss.mesh.userData.playClip) boss.mesh.userData.playClip("idle");
              if (afterIntroFn) afterIntroFn(skipped);
            });
          } else {
            if (MAY.player.triggerCamFocus) MAY.player.triggerCamFocus(boss.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 1.8);
            if (afterIntroFn) afterIntroFn();
          }
        },
        damage: function (msg, launchFinish) {
          if (boss.defeated || !boss.active) return;
          boss.hp = Math.max(0, boss.hp - 1);
          boss.state = "stunned";
          boss.stateT = 2.0;
          if (MAY.sndBossHit) MAY.sndBossHit(boss.pos);
          if (MAY.player.addShake) MAY.player.addShake(0.42);
          MAY.burstAt(boss.pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 0xffd93d, 26);
          if (boss.hp <= 0) {
            boss.defeated = true;
            st.bossDown = true;
            MAY.persist();
            boss.syncHUD();
            if (MAY.sndBossWin) MAY.sndBossWin();
            ctx.restoreWorld();
            if (launchFinish) {
              boss.state = "launched";
              boss.stateT = 0;
              if (MAY.sndLaunchSky) MAY.sndLaunchSky(boss.pos);
            } else if (boss.mesh && boss.mesh.userData && boss.mesh.userData.mixer) {
              boss.state = "defeating";
              boss.stateT = 0;
            } else {
              boss.mesh.visible = false;
              boss.state = "defeated";
            }
            MAY.burstAt(boss.pos.clone().add(new THREE.Vector3(0, 2.5, 0)), 0xffd93d, 36);
            var defeatPos = boss.pos.clone();
            if (boss.onDefeat) boss.onDefeat(boss);
            if (MAY.Cutscene && MAY.Cutscene.playBossDefeat && MAY.started) {
              MAY.Cutscene.playBossDefeat(ctx, defeatPos, "🌈 " + boss.name + " đã được thanh tẩy! Vùng đất rực sáng trở lại!");
            }
          } else {
            boss.syncHUD();
            if (msg) MAY.toast("💥 " + msg + " (Còn " + boss.hp + "/" + boss.maxHp + " pha!)", "Trúng đòn rồi! Cố lên Mây ơi!");
          }
        }
      };
      if (boss.defeated) boss.mesh.visible = false;
      ctx.boss = boss;
      return boss;
    };

    /* ---- F. Cập nhật mỗi frame cho Toàn Bộ Động Cơ Cốt Truyện ---- */
    ctx.updateStory = function (dt, t) {
      if (invulnT > 0) invulnT -= dt;
      var pPos = MAY.player.pos;

      /* Thực thi sự kiện hẹn giờ an toàn (chỉ chạy khi không bị tạm dừng bởi hộp thoại/modal) */
      if (!MAY.modalOpen && ctx.scheduledEvents.length) {
        for (var evi = ctx.scheduledEvents.length - 1; evi >= 0; evi--) {
          var ev = ctx.scheduledEvents[evi];
          ev.t -= dt;
          if (ev.t <= 0) {
            ctx.scheduledEvents.splice(evi, 1);
            try { ev.fn(); } catch (e) {}
          }
        }
      }

      /* Chuyển mượt khí quyển Sương Xám -> Rực Rỡ khi thế giới được thanh tẩy */
      if (ctx._atmosphere && ctx._atmosphere.t !== ctx._atmosphere.target) {
        var dir = ctx._atmosphere.target > ctx._atmosphere.t ? 1 : -1;
        ctx._atmosphere.t = Math.max(0, Math.min(1, ctx._atmosphere.t + dir * dt * 0.45));
        applyAtmoBlend(ctx._atmosphere, ctx._atmosphere.t);
      }

      /* Cột khí nâng Updraft từ Lốc Cầu Vồng */
      for (var ui = ctx.updrafts.length - 1; ui >= 0; ui--) {
        var ud = ctx.updrafts[ui];
        ud.life -= dt;
        if (ud.life <= 0) { ctx.updrafts.splice(ui, 1); continue; }
        if (Math.hypot(pPos.x - ud.x, pPos.z - ud.z) < ud.r && Math.abs(pPos.y - ud.y) < 15) {
          MAY.player.vel.y = Math.max(MAY.player.vel.y, 13.5);
          MAY.player.grounded = false;
        }
      }

      /* Tim Ánh Sáng rơi ra từ quái */
      for (var hi = ctx.heartOrbs.length - 1; hi >= 0; hi--) {
        var ho = ctx.heartOrbs[hi];
        ho.age += dt;
        ho.mesh.rotation.y += dt * 3;
        ho.mesh.position.y = ho.baseY + Math.sin(t * 4 + hi) * 0.25;
        if (ho.mesh.position.distanceTo(pPos) < 2.6) {
          MAY.worldRoot.remove(ho.mesh);
          disposeRuntimeMesh(ho.mesh);
          ctx.heartOrbs.splice(hi, 1);
          MAY.healPlayer(1);
        } else if (ho.age > 24) {
          MAY.worldRoot.remove(ho.mesh);
          disposeRuntimeMesh(ho.mesh);
          ctx.heartOrbs.splice(hi, 1);
        }
      }

      /* NPC Giao Nhiệm Vụ (quay mặt về phía Mây & đập cánh nếu là chim/phượng hoàng!) */
      for (var ni = 0; ni < ctx.questNPCs.length; ni++) {
        var npc = ctx.questNPCs[ni];
        npc.aura.rotation.z += dt * 0.9;
        npc.marker.position.y = npc.labelY + 1.15 + Math.sin(t * 4.2) * 0.20;
        if (npc.floating) npc.group.position.y = npc.baseY + Math.sin(t * 2.4) * 0.28;
        if (npc.group.userData.wl && npc.group.userData.wr) {
          var wFlap = Math.sin(t * 7.5) * 0.45;
          npc.group.userData.wl.rotation.z = wFlap;
          npc.group.userData.wr.rotation.z = -wFlap;
        }
        var nd = npc.group.position.distanceTo(pPos);
        if (npc.group.userData.mixer) {
          if (npc.group.userData.playClip) npc.group.userData.playClip(nd < 5.5 ? "talk" : "idle");
          npc.group.userData.mixer.update(dt);
        }
        if (nd < 14) {
          /* Mặt thú trong makeAnimal hướng về -Z nên quay về phía Mây dùng (npc - pPos) */
          var ang = Math.atan2(npc.group.position.x - pPos.x, npc.group.position.z - pPos.z);
          npc.group.rotation.y += (Math.atan2(Math.sin(ang - npc.group.rotation.y), Math.cos(ang - npc.group.rotation.y))) * Math.min(1, dt * 4.5);
        }
        if (npc.autoGreet && !npc.autoGreeted && !MAY.modalOpen && !(MAY.isSpeechActive && MAY.isSpeechActive()) && !(MAY.Cutscene && MAY.Cutscene.isPlaying()) && (npc.state === "!" || npc.state === "★") && nd < 4.2) {
          npc.autoGreeted = true;
          if (npc.onTalk) npc.onTalk(npc);
        }
      }

      /* Cập nhật NPC & Trạm Nhiệm Vụ Phụ tương tác 3D */
      if (ctx.sideQuest) {
        var sq = ctx.sideQuest;
        sq.aura.rotation.z -= dt * 1.1;
        sq.marker.position.y = sq.labelY + 1.05 + Math.sin(t * 4.5 + 1.2) * 0.18;
        if (sq.floating) sq.npcGroup.position.y = sq.baseY + Math.sin(t * 2.2) * 0.25;
        if (sq.npcGroup.userData.wl && sq.npcGroup.userData.wr) {
          var swFlap = Math.sin(t * 7.5 + 0.8) * 0.45;
          sq.npcGroup.userData.wl.rotation.z = swFlap;
          sq.npcGroup.userData.wr.rotation.z = -swFlap;
        }
        var sqD = sq.npcGroup.position.distanceTo(pPos);
        if (sq.npcGroup.userData.mixer) {
          if (sq.npcGroup.userData.playClip) sq.npcGroup.userData.playClip(sqD < 5.5 ? "talk" : "idle");
          sq.npcGroup.userData.mixer.update(dt);
        }
        if (sqD < 14) {
          var sAng = Math.atan2(sq.npcGroup.position.x - pPos.x, sq.npcGroup.position.z - pPos.z);
          sq.npcGroup.rotation.y += Math.atan2(Math.sin(sAng - sq.npcGroup.rotation.y), Math.cos(sAng - sq.npcGroup.rotation.y)) * Math.min(1, dt * 4.5);
        }
        sq.stations.forEach(function (stItem, idx) {
          if (stItem._warnCd > 0) stItem._warnCd = Math.max(0, stItem._warnCd - dt);
          if (stItem.group.userData.ring && stItem.group.userData.ring.visible) {
            stItem.group.userData.ring.rotation.z += dt * 1.4;
          }
          if (stItem.group.userData.orb) {
            stItem.group.userData.orb.rotation.y += dt * (stItem.done ? 2.4 : 0.9);
          }
          if (!MAY.modalOpen && sq.save.stage >= 1 && !sq.save.done && !stItem.done && stItem.group.visible && stItem.pos.distanceTo(pPos) < 2.65) {
            if (stItem.unlocked) {
              sq.completeTask(stItem);
            } else if (stItem._warnCd <= 0) {
              stItem._warnCd = 4.5;
              sq.completeTask(stItem);
            }
          }
        });
      }

      /* Vòng gợi ý mục tiêu giải đố kỹ năng */
      for (var si = 0; si < ctx.skillTargets.length; si++) {
        var stg = ctx.skillTargets[si];
        var show = !stg.done && stg.isActive();
        if (stg.ring) { stg.ring.visible = show; if (show) stg.ring.rotation.z += dt * 1.1; }
        if (stg.hintLb) stg.hintLb.visible = show;
      }

      /* Quái Vật Tuần Tra + Vật Lý Bị Lốc Hất Văng Lên Trời! */
      for (var ei = 0; ei < ctx.enemies.length; ei++) {
        var en = ctx.enemies[ei];
        if (en.state === "purified") continue;
        if (en.state === "launched") {
          en.launchT += dt;
          en.mesh.position.y += en.vy * dt;
          en.mesh.rotation.y += dt * 16;
          en.mesh.rotation.x += dt * 9;
          en.mesh.scale.setScalar((en.baseScale || 1.0) * Math.max(0.2, 1.0 - en.launchT * 0.35));
          if (en.launchT > 1.35) {
            en.purify(null, 0xf472b6);
            MAY.burstAt(en.mesh.position.clone(), 0xffd93d, 26);
          }
          continue;
        }
        if (MAY.modalOpen) continue;
        if (en.state === "stunned") {
          en.timer -= dt;
          en.mesh.rotation.y += dt * 6;
          if (en.timer <= 0) en.state = "patrol";
          continue;
        }

        var dP = en.mesh.position.distanceTo(pPos);
        if (en.atkCd > 0) en.atkCd -= dt;

        if (en.state === "windup") {
          en.timer -= dt;
          en.mesh.scale.setScalar((en.baseScale || 1.0) * (1.0 + Math.sin(t * 28) * 0.08));
          if (en.timer <= 0) {
            en.mesh.scale.setScalar(en.baseScale || 1.0);
            en.state = "chase";
            en.atkCd = 2.8;
            if (en.mesh.position.distanceTo(pPos) < 3.4) {
              MAY.damagePlayer(1, en.mesh.position, en.name + " vừa tấn công! Hãy dùng phép khắc chế!");
            }
          }
        } else if (dP < en.aggroR) {
          en.state = "chase";
          var dx = pPos.x - en.mesh.position.x, dz = pPos.z - en.mesh.position.z;
          var dd = Math.hypot(dx, dz) || 1;
          en.mesh.rotation.y = Math.atan2(-dx, -dz);
          if (dd > 2.6) {
            en.mesh.position.x += (dx / dd) * en.speed * dt;
            en.mesh.position.z += (dz / dd) * en.speed * dt;
          } else if (en.atkCd <= 0) {
            en.state = "windup";
            en.timer = 0.85;
            if (MAY.VFX) MAY.VFX.spawnTelegraph(en.mesh.position.clone(), 3.2, 0.85, 0xff3b5c);
          }
        } else {
          en.state = "patrol";
          en.wa += dt * 0.7;
          var tx = en.hx + Math.cos(en.wa) * en.patrolR;
          var tz = en.hz + Math.sin(en.wa) * en.patrolR;
          var pdx = tx - en.mesh.position.x, pdz = tz - en.mesh.position.z;
          var pdd = Math.hypot(pdx, pdz) || 1;
          en.mesh.position.x += (pdx / pdd) * (en.speed * 0.55) * dt;
          en.mesh.position.z += (pdz / pdd) * (en.speed * 0.55) * dt;
          en.mesh.rotation.y = Math.atan2(-pdx, -pdz);
        }
        if (en.flying) {
          en.mesh.position.y = en.hy + Math.sin(t * 3.0 + ei) * 0.55;
        } else if (en.underwater) {
          en.mesh.position.y = en.hy + Math.sin(t * 2.4 + ei) * 0.45;
        } else {
          var egy = ctx.groundH(en.mesh.position.x, en.mesh.position.z);
          if (egy > -30) en.mesh.position.y = egy;
        }
        if (en.label) en.label.position.set(en.mesh.position.x, en.mesh.position.y + 2.4, en.mesh.position.z);
      }

      /* Đạn Quái / Boss (Ngọc Trai Đen Nổ, Đá Ném, Cầu Sét) */
      if (!MAY.modalOpen) {
        for (var oi = ctx.bossOrbs.length - 1; oi >= 0; oi--) {
          var orb = ctx.bossOrbs[oi];
          orb.life -= dt;
          orb.mesh.position.addScaledVector(orb.dir, orb.speed * dt);
          orb.mesh.rotation.y += dt * 5;
          var remove = orb.life <= 0;
          if (!orb.reflected && orb.mesh.position.distanceTo(pPos) < 2.0) {
            MAY.damagePlayer(1, orb.mesh.position, "Coi chừng quả cầu năng lượng! Nhớ né hoặc đẩy ngược bằng phép!");
            MAY.burstAt(orb.mesh.position.clone(), 0xff3b5c, 12);
            remove = true;
          } else if (orb.reflected && ctx.boss && ctx.boss.active && !ctx.boss.defeated && orb.mesh.position.distanceTo(ctx.boss.pos) < 4.5) {
            if (orb.onReflectHitBoss) orb.onReflectHitBoss(ctx.boss);
            else ctx.boss.damage("Quả cầu bật ngược trúng thẳng Trùm!");
            remove = true;
          }
          if (remove) {
            MAY.worldRoot.remove(orb.mesh);
            disposeRuntimeMesh(orb.mesh);
            ctx.bossOrbs.splice(oi, 1);
          }
        }
      }

      /* Cập nhật Boss Arena */
      if (ctx.boss) {
        var bs = ctx.boss;
        if (bs.introPlaying && (!MAY.Cutscene || !MAY.Cutscene.isPlaying())) {
          bs.introPlaying = false;
          bs.mesh.rotation.x = 0;
          if (bs.mesh.userData.playClip) bs.mesh.userData.playClip("idle");
        }
        if (bs.mesh && bs.mesh.userData && bs.mesh.userData.mixer) {
          bs.mesh.userData.mixer.update(dt);
        }
        if (bs.state === "launched") {
          bs.stateT += dt;
          bs.mesh.position.y += 22 * dt;
          bs.mesh.rotation.y += dt * 14;
          bs.mesh.rotation.z += dt * 7;
          bs.mesh.scale.setScalar((bs.baseScale || 1.0) * Math.max(0.05, 1.0 - bs.stateT * 0.55));
          if (bs.stateT > 1.7) {
            bs.mesh.visible = false;
            bs.state = "defeated";
            MAY.burstAt(bs.mesh.position.clone(), 0xf472b6, 40);
          }
        } else if (bs.state === "defeating") {
          bs.stateT += dt;
          if (bs.stateT > 1.55) {
            var sf = Math.max(0.04, 1.0 - (bs.stateT - 1.55) / 0.65);
            bs.mesh.scale.setScalar((bs.baseScale || 1.0) * sf);
          }
          if (bs.stateT >= 2.2) {
            bs.mesh.visible = false;
            bs.state = "defeated";
            MAY.burstAt(bs.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 0xffd93d, 36);
          }
        } else if (bs.active && !bs.defeated && !MAY.modalOpen) {
          if (bs.state === "stunned") {
            bs.windupT = 0;
            bs.mesh.rotation.x = 0;
            bs.stateT -= dt;
            bs.mesh.rotation.y += dt * 4;
            if (bs.stateT <= 0) { bs.state = "idle"; bs.syncHUD(); }
          } else if (bs.onTick) {
            bs.onTick(dt, t, bs);
          }
          if (bs.windupT > 0) {
            bs.windupT = Math.max(0, bs.windupT - dt);
            bs.mesh.rotation.x = -0.25 * Math.sin(Math.PI * (1 - bs.windupT / bs.windupDuration));
          }
        }
      }

      /* Cột sáng dẫn đường ưu tiên chỉ thẳng tới Mục Tiêu Cốt Truyện Đang Làm! */
      if (ctx.beacon && ctx.storyObjective && ctx.storyObjective.targetPos) {
        ctx.beacon.visible = true;
        var tp = ctx.storyObjective.targetPos;
        ctx.beacon.position.set(tp.x, tp.y + 12, tp.z);
        ctx.beacon.material.uniforms.uPulse.value = 0.22 + Math.sin(t * 4) * 0.08;
      }
    };

    /* Cập nhật bầu khí quyển, NPC xương & hoạt ảnh Trùm (bao gồm bay lên trời/Defeat) trong lúc Cutscene 3D! */
    ctx.updateStoryCutscene = function (dt, t) {
      if (ctx._atmosphere && ctx._atmosphere.t !== ctx._atmosphere.target) {
        var dir = ctx._atmosphere.target > ctx._atmosphere.t ? 1 : -1;
        ctx._atmosphere.t = Math.max(0, Math.min(1, ctx._atmosphere.t + dir * dt * 0.45));
        applyAtmoBlend(ctx._atmosphere, ctx._atmosphere.t);
      }
      for (var ni = 0; ni < ctx.questNPCs.length; ni++) {
        var npc = ctx.questNPCs[ni];
        npc.aura.rotation.z += dt * 0.9;
        npc.marker.position.y = npc.labelY + 1.15 + Math.sin(t * 4.2) * 0.20;
        if (npc.floating) npc.group.position.y = npc.baseY + Math.sin(t * 2.4) * 0.28;
        if (npc.group.userData.wl && npc.group.userData.wr) {
          var wFlap = Math.sin(t * 7.5) * 0.45;
          npc.group.userData.wl.rotation.z = wFlap;
          npc.group.userData.wr.rotation.z = -wFlap;
        }
        if (npc.group.userData.mixer) {
          if (npc.group.userData.playClip) npc.group.userData.playClip("idle");
          npc.group.userData.mixer.update(dt);
        }
      }
      if (ctx.sideQuest) {
        var sq = ctx.sideQuest;
        sq.aura.rotation.z -= dt * 1.1;
        sq.marker.position.y = sq.labelY + 1.05 + Math.sin(t * 4.5 + 1.2) * 0.18;
        if (sq.floating) sq.npcGroup.position.y = sq.baseY + Math.sin(t * 2.2) * 0.25;
        if (sq.npcGroup.userData.wl && sq.npcGroup.userData.wr) {
          var swF = Math.sin(t * 7.5 + 0.8) * 0.45;
          sq.npcGroup.userData.wl.rotation.z = swF;
          sq.npcGroup.userData.wr.rotation.z = -swF;
        }
        if (sq.npcGroup.userData.mixer) {
          if (sq.npcGroup.userData.playClip) sq.npcGroup.userData.playClip("idle");
          sq.npcGroup.userData.mixer.update(dt);
        }
      }
      if (ctx.boss) {
        var bs = ctx.boss;
        if (bs.mesh && bs.mesh.userData && bs.mesh.userData.mixer) {
          bs.mesh.userData.mixer.update(dt);
        }
        if (bs.introPlaying && !bs.mesh.userData.mixer) {
          bs.mesh.rotation.x = Math.sin(t * 4) * 0.12;
        }
        if (bs.state === "launched") {
          bs.stateT += dt;
          bs.mesh.position.y += 22 * dt;
          bs.mesh.rotation.y += dt * 14;
          bs.mesh.rotation.z += dt * 7;
          bs.mesh.scale.setScalar((bs.baseScale || 1.0) * Math.max(0.05, 1.0 - bs.stateT * 0.55));
          if (bs.stateT > 1.7) {
            bs.mesh.visible = false;
            bs.state = "defeated";
            MAY.burstAt(bs.mesh.position.clone(), 0xf472b6, 40);
          }
        } else if (bs.state === "defeating") {
          bs.stateT += dt;
          if (bs.stateT > 1.55) {
            var sf2 = Math.max(0.04, 1.0 - (bs.stateT - 1.55) / 0.65);
            bs.mesh.scale.setScalar((bs.baseScale || 1.0) * sf2);
          }
          if (bs.stateT >= 2.2) {
            bs.mesh.visible = false;
            bs.state = "defeated";
            MAY.burstAt(bs.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 0xffd93d, 36);
          }
        }
      }
    };

    /* Đảm bảo Boss HUD tắt sạch khi mới vào màn */
    var bh = document.getElementById("boss-hud");
    if (bh) bh.classList.add("hidden");
    MAY.resetHearts();
  };

  /* ==========================================================================
     5. PHÂN PHỐI TÁC ĐỘNG PHÉP THUẬT THỰC CHIẾN (SKILL IMPACT DISPATCHER)
     ========================================================================== */
  MAY.dispatchSpellImpact = function (spellId, targetPos, playerPos) {
    var ctx = MAY.currentCtx;
    if (!ctx) return;

    var hitSomething = false;
    var sp = MAY.getSpellById(spellId);

    /* 1. Kiểm tra Vật Thể Giải Đố Cốt Truyện (Skill Targets) */
    if (ctx.skillTargets) {
      for (var i = 0; i < ctx.skillTargets.length; i++) {
        var tg = ctx.skillTargets[i];
        if (tg.done || !tg.isActive()) continue;
        var dT = tg.pos.distanceTo(targetPos);
        var dP = tg.pos.distanceTo(playerPos);
        if (dT < tg.radius || dP < tg.radius * 0.85) {
          var reqList = Array.isArray(tg.reqSpell) ? tg.reqSpell : [tg.reqSpell];
          if (reqList.indexOf(spellId) !== -1 || reqList.indexOf("any") !== -1) {
            hitSomething = true;
            if (tg.onHit) tg.onHit(spellId, tg);
          } else if (!hitSomething) {
            var needed = MAY.getSpellById(reqList[0]);
            if (needed) {
              MAY.toast("💡 Thử dùng Phép " + needed.icon + " " + needed.name + " (Phím " + needed.key + " + R) vào đây nhé!");
            }
          }
        }
      }
    }

    /* 2. Kiểm tra Đẩy Ngược Đạn Boss / Quái */
    if (ctx.bossOrbs) {
      for (var oi = 0; oi < ctx.bossOrbs.length; oi++) {
        var orb = ctx.bossOrbs[oi];
        if (orb.reflectable && !orb.reflected) {
          if (orb.mesh.position.distanceTo(targetPos) < 9.5 || orb.mesh.position.distanceTo(playerPos) < 9.5) {
            if (spellId === orb.reflectSpell || spellId === "wave" || spellId === "crystal" || spellId === "tornado") {
              orb.reflected = true;
              if (ctx.boss) {
                orb.dir.subVectors(ctx.boss.pos, orb.mesh.position).normalize();
              } else {
                orb.dir.negate();
              }
              orb.speed = 20;
              orb.life = 4.0;
              orb.mesh.material.color.setHex(0x38bdf8);
              orb.mesh.material.emissive.setHex(0xffe066);
              MAY.sndBounce();
              MAY.toast("💥 Tuyệt vời! Quả cầu bật ngược thẳng về phía Trùm!");
              hitSomething = true;
            }
          }
        }
      }
    }

    /* 3. Kiểm tra Quái Vật Tuần Tra (Hất bay lên trời bằng Lốc Cầu Vồng, trói bằng Nở Hoa...) */
    if (ctx.enemies) {
      for (var ei = 0; ei < ctx.enemies.length; ei++) {
        var en = ctx.enemies[ei];
        if (en.state === "purified" || en.state === "launched") continue;
        var ed = Math.min(en.mesh.position.distanceTo(targetPos), en.mesh.position.distanceTo(playerPos));
        if (ed < 9.5) {
          hitSomething = true;
          if (spellId === "tornado") {
            /* 🌈 LỐC CẦU VỒNG: Hất văng MỌI quái vật bay thẳng lên bầu trời! */
            en.launchToSky();
          } else if (spellId === "growth") {
            if (MAY.VFX) MAY.VFX.spawnVineTrap(en.mesh.position.clone(), 2.4);
            if (!en.weakSpell || en.weakSpell === "growth" || en.kind === "thornshroom") {
              en.purify("🌿 Dây leo nở hoa trói chặt và thanh tẩy " + en.name + "!", 0x4ade80);
            } else {
              en.state = "stunned"; en.timer = 2.8;
              MAY.toast("🌿 " + en.name + " bị dây leo trói chân tạm thời!");
            }
          } else if (!en.weakSpell || en.weakSpell === spellId) {
            en.purify((sp ? sp.icon : "✨") + " Thanh tẩy " + en.name + " thành công!", sp ? sp.color : 0xffd93d);
          } else {
            en.state = "stunned"; en.timer = 2.0;
            var wSp = MAY.getSpellById(en.weakSpell);
            MAY.toast("⚡ " + en.name + " bị choáng nhẹ! Dùng " + (wSp ? wSp.icon + " " + wSp.name : "phép khắc chế") + " để hạ gục!");
          }
        }
      }
    }

    /* 4. Kiểm tra Trùm Chương (Boss Fight) */
    if (ctx.boss && ctx.boss.active && !ctx.boss.defeated) {
      var bd = Math.min(ctx.boss.pos.distanceTo(targetPos), ctx.boss.pos.distanceTo(playerPos));
      if (bd < 13.5 && ctx.boss.onSpellHit) {
        ctx.boss.onSpellHit(spellId, targetPos, ctx.boss);
      }
    }

    /* 5. Phép thuật cũng kích hoạt các Trạm Nhiệm Vụ Phụ gần điểm tung phép */
    if (ctx.sideQuest && ctx.sideQuest.save.stage >= 1 && !ctx.sideQuest.save.done) {
      ctx.sideQuest.stations.forEach(function (stItem) {
        if (!stItem.done && (stItem.pos.distanceTo(targetPos) < 6.5 || stItem.pos.distanceTo(playerPos) < 5.5)) {
          ctx.sideQuest.completeTask(stItem);
        }
      });
    }

    /* 6. Hook riêng của từng màn nếu cần */
    if (ctx.onSpellCast) ctx.onSpellCast(spellId, targetPos, playerPos);
  };

})(window.MAY);
