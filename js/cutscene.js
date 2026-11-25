"use strict";
/* ============================================================================
   CUTSCENE.JS — Đạo Diễn Cutscene 3D Trong Engine (Letterbox, Quỹ Đạo Camera,
   Phụ Đề Đồng Bộ, Nút Bỏ Qua An Toàn & Đại Tiệc Kết Thúc 3D Sống Động!)
   ============================================================================ */
(function (MAY) {

  var activeCS = null;
  var _camPos = new THREE.Vector3();
  var _camLook = new THREE.Vector3();
  var _tmpV = new THREE.Vector3();
  var _savedFov = 70;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function showCutsceneUI(show) {
    var el = document.getElementById("cutscene-ui");
    if (el) el.classList.toggle("hidden", !show);
    document.body.classList.toggle("in-cutscene", !!show);
  }

  function setCaption(speaker, text, stepIdx, total) {
    var spEl = document.getElementById("cs-speaker");
    var txEl = document.getElementById("cs-text");
    var pgEl = document.getElementById("cs-prog");
    if (spEl) {
      spEl.textContent = speaker || "";
      spEl.style.display = speaker ? "inline-block" : "none";
    }
    if (txEl) txEl.textContent = text || "";
    if (pgEl) pgEl.textContent = total > 1 ? ("Cảnh " + (stepIdx + 1) + "/" + total) : "🎬 Điện ảnh 3D";
  }

  function beginShot(cs, idx) {
    cs.shotIdx = idx;
    cs.shotT = 0;
    var sh = cs.shots[idx];
    if (!sh) return;
    setCaption(sh.speaker || "", sh.caption || "", idx, cs.shots.length);
    if (sh.voiceClip && MAY.playVoice) MAY.playVoice(sh.voiceClip);
    if (sh.onEnter) {
      try { sh.onEnter(cs); } catch (e) {}
    }
  }

  function finishCutscene(wasSkipped) {
    if (!activeCS) return;
    var cs = activeCS;
    activeCS = null;
    showCutsceneUI(false);
    MAY.camera.fov = _savedFov;
    MAY.camera.updateProjectionMatrix();
    if (MAY.player) {
      MAY.player.camPosInit = false;
      if (MAY.player.clearKeys) MAY.player.clearKeys();
    }
    if (cs.cleanup) {
      try { cs.cleanup(wasSkipped); } catch (e) {}
    }
    if (cs.onDone) {
      try { cs.onDone(wasSkipped); } catch (e) { if (window.console) console.error("Cutscene onDone err:", e); }
    }
  }

  var Cutscene = {
    isPlaying: function () {
      return !!activeCS;
    },

    play: function (opts) {
      if (!opts || !opts.shots || !opts.shots.length) {
        if (opts && opts.onDone) opts.onDone(false);
        return;
      }
      if (activeCS) finishCutscene(true);
      if (MAY.closeAllModals) MAY.closeAllModals();
      if (MAY.dialogueOpen && MAY.closeDialogue) MAY.closeDialogue(false);
      var intEl = document.getElementById("interact");
      if (intEl) intEl.style.display = "none";
      _savedFov = MAY.camera.fov || 70;
      if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
      if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) {} }

      activeCS = {
        id: opts.id || "cs",
        shots: opts.shots,
        shotIdx: 0,
        shotT: 0,
        onDone: opts.onDone || null,
        cleanup: opts.cleanup || null
      };
      showCutsceneUI(true);
      beginShot(activeCS, 0);
    },

    skip: function () {
      if (!activeCS) return;
      if (MAY.beep) MAY.beep(520, 0.08, "sine", 0.05);
      finishCutscene(true);
    },

    cancelSilent: function () {
      if (!activeCS) return;
      var cs = activeCS;
      activeCS = null;
      showCutsceneUI(false);
      MAY.camera.fov = _savedFov;
      MAY.camera.updateProjectionMatrix();
      if (cs.cleanup) { try { cs.cleanup(true); } catch (e) {} }
    },

    update: function (dt, t, ctx) {
      if (!activeCS) return false;
      var cs = activeCS;
      var sh = cs.shots[cs.shotIdx];
      if (!sh) { finishCutscene(false); return false; }

      cs.shotT += dt;
      var dur = Math.max(0.2, sh.dur || 3.0);
      var rawP = Math.min(1, cs.shotT / dur);
      var p = easeInOutCubic(rawP);

      if (sh.orbit) {
        var o = sh.orbit;
        var ang = (o.startAngle || 0) + ((o.endAngle || Math.PI) - (o.startAngle || 0)) * p;
        var rad = (o.radiusStart !== undefined ? o.radiusStart : o.radius) +
                  ((o.radiusEnd !== undefined ? o.radiusEnd : o.radius) - (o.radiusStart !== undefined ? o.radiusStart : o.radius)) * p;
        var h = (o.heightStart !== undefined ? o.heightStart : o.height) +
                ((o.heightEnd !== undefined ? o.heightEnd : o.height) - (o.heightStart !== undefined ? o.heightStart : o.height)) * p;
        _camPos.set(o.center.x + Math.cos(ang) * rad, o.center.y + h, o.center.z + Math.sin(ang) * rad);
        _camLook.copy(o.lookAt || o.center);
      } else {
        _camPos.copy(sh.fromPos).lerp(sh.toPos || sh.fromPos, p);
        _camLook.copy(sh.fromLook).lerp(sh.toLook || sh.fromLook, p);
      }

      /* Giữ camera không xuyên xuống dưới mặt đất trong cảnh quay */
      if (ctx && ctx.groundH && !sh.allowLow) {
        var gh = ctx.groundH(_camPos.x, _camPos.z);
        if (gh > -30 && _camPos.y < gh + 0.9) _camPos.y = gh + 0.9;
      }

      MAY.camera.position.copy(_camPos);
      MAY.camera.lookAt(_camLook);

      if (sh.fov !== undefined) {
        MAY.camera.fov += (sh.fov - MAY.camera.fov) * Math.min(1, dt * 4);
        MAY.camera.updateProjectionMatrix();
      }
      if (sh.onTick) {
        try { sh.onTick(dt, t, rawP, cs); } catch (e) {}
      }

      /* Vẫn giữ bé Mây và mặt trời cập nhật tự nhiên trong lúc quay phim */
      if (MAY.diver && MAY.player) {
        MAY.diver.position.set(MAY.player.pos.x, MAY.player.pos.y - 0.12, MAY.player.pos.z);
        MAY.diver.rotation.y = MAY.player.yaw;
        MAY.updateSunFollow(MAY.player.pos);
      }

      if (cs.shotT >= dur) {
        if (cs.shotIdx + 1 < cs.shots.length) {
          beginShot(cs, cs.shotIdx + 1);
        } else {
          finishCutscene(false);
        }
      }
      return true;
    },

    /* ---- 1. Cutscene Mở Đầu / Nhập Chương 3D (Quét cảnh toàn vùng đất -> NPC Giao Nhiệm Vụ -> Mây) ---- */
    playWorldIntro: function (ctx, onDone) {
      if (!ctx) { if (onDone) onDone(); return; }
      var meta = ctx.meta || MAY.getMeta(ctx.id);
      var p = MAY.player.pos.clone();
      var npc = (ctx.questNPCs && ctx.questNPCs[0]) ? ctx.questNPCs[0].pos.clone() : p.clone().add(new THREE.Vector3(0, 1.5, -8));

      var shots;
      if (ctx.id === "hub") {
        var lhTop = new THREE.Vector3(0, 16, 0);
        shots = [
          {
            dur: 3.6, fov: 62,
            speaker: "🎬 MỞ ĐẦU — ĐẢO MÂY",
            caption: "Vua Mây Bão đã cướp 6 Viên Ngọc Cầu Vồng làm Ngọn Hải Đăng Đảo Mây vụt tắt ánh sáng...",
            orbit: { center: new THREE.Vector3(0, 11, 0), radiusStart: 36, radiusEnd: 24, heightStart: 13, heightEnd: 7, startAngle: 0.9, endAngle: 1.85, lookAt: lhTop }
          },
          {
            dur: 3.0, fov: 66,
            speaker: "🐢 Cụ Rùa Già Gác Đèn",
            caption: "Mây và Cún Milo chuẩn bị lên đường đánh thức 6 Phép Nguyên Tố cứu 6 vùng đất kỳ diệu!",
            fromPos: new THREE.Vector3(10, p.y + 5.5, p.z + 10),
            toPos: new THREE.Vector3(-4.2, npc.y + 3.2, npc.z + 8.5),
            fromLook: p.clone().add(new THREE.Vector3(0, 0.8, 0)),
            toLook: npc.clone().add(new THREE.Vector3(0, 0.6, 0))
          }
        ];
      } else {
        var landmark = ctx.gemAltar ? ctx.gemAltar.pos.clone() : new THREE.Vector3(0, p.y + 4, -20);
        shots = [
          {
            dur: 2.8, fov: 64,
            speaker: meta.icon + " " + meta.title.toUpperCase(),
            caption: meta.intro,
            fromPos: landmark.clone().add(new THREE.Vector3(18, ctx.mode === "underwater" ? 4.5 : 12, 18)),
            toPos: landmark.clone().add(new THREE.Vector3(-12, ctx.mode === "underwater" ? 3.5 : 8.5, 16)),
            fromLook: landmark.clone(),
            toLook: npc.clone()
          },
          {
            dur: 2.2, fov: 68,
            speaker: "✨ HÀNH TRÌNH CỦA MÂY",
            caption: "Hãy gặp NPC mang biểu tượng (!) vàng để mở khóa Phép Nguyên Tố mới!",
            fromPos: npc.clone().add(new THREE.Vector3(7, 3.6, 9)),
            toPos: p.clone().add(new THREE.Vector3(0, 3.2, 6.2)),
            fromLook: npc.clone(),
            toLook: p.clone().add(new THREE.Vector3(0, 0.7, -1))
          }
        ];
      }
      Cutscene.play({ id: "intro_" + ctx.id, shots: shots, onDone: onDone });
    },

    /* ---- 2. Cutscene Trùm Xuất Hiện (Boss Awakening 3D Shot) ---- */
    playBossIntro: function (ctx, boss, onDone) {
      if (!ctx || !boss) { if (onDone) onDone(); return; }
      var bp = boss.pos.clone();
      Cutscene.play({
        id: "boss_intro_" + ctx.id,
        shots: [
          {
            dur: 3.0, fov: 58,
            speaker: "⚠️ TRÙM SƯƠNG XÁM XUẤT HIỆN!",
            caption: boss.icon + " " + boss.name + " đang gầm vang chặn trước kho báu!",
            orbit: { center: bp.clone().add(new THREE.Vector3(0, 2.2, 0)), radiusStart: 16, radiusEnd: 11.5, heightStart: 6.5, heightEnd: 3.4, startAngle: 0.4, endAngle: 1.9, lookAt: bp.clone().add(new THREE.Vector3(0, 2.0, 0)) },
            onEnter: function () {
              if (MAY.sndBossRoar) MAY.sndBossRoar(bp);
              if (MAY.triggerSpellFlash) MAY.triggerSpellFlash(0xff3b5c, 0.55);
              MAY.burstAt(bp.clone().add(new THREE.Vector3(0, 2, 0)), 0x9333ea, 26);
            }
          }
        ],
        onDone: onDone
      });
    },

    /* ---- 3. Cutscene Thanh Tẩy Thế Giới (World Purification 3D Shot sau khi hạ Trùm!) ---- */
    playBossDefeat: function (ctx, bossPos, msg, onDone) {
      if (!ctx || !bossPos) { if (onDone) onDone(); return; }
      var bp = bossPos.clone();
      Cutscene.play({
        id: "boss_defeat_" + ctx.id,
        shots: [
          {
            dur: 3.4, fov: 62,
            speaker: "🌈 THANH TẨY MÀN SƯƠNG XÁM!",
            caption: msg || "Ánh sáng rực rỡ đã quay trở lại vùng đất kỳ diệu!",
            orbit: { center: bp.clone().add(new THREE.Vector3(0, 2.5, 0)), radiusStart: 12, radiusEnd: 24, heightStart: 4.5, heightEnd: 13.5, startAngle: 0.8, endAngle: 2.3, lookAt: bp.clone().add(new THREE.Vector3(0, 3.0, 0)) },
            onEnter: function () {
              if (MAY.player && MAY.player.triggerVictoryAnim) MAY.player.triggerVictoryAnim();
              if (MAY.triggerSpellFlash) MAY.triggerSpellFlash(0xffd93d, 0.65);
              MAY.burstAt(bp.clone().add(new THREE.Vector3(0, 3, 0)), 0xffd93d, 34);
            }
          }
        ],
        onDone: onDone
      });
    },

    /* ---- 4. ĐẠI TIỆC KẾT THÚC 3D SỐNG ĐỘNG (Live 3D Grand Finale — thay thế hoàn toàn overlay tĩnh!) ---- */
    playGrandFinale: function (onDone) {
      /* Nếu đang ở màn khác, đưa Mây về Đảo Mây trước để quay Đại Tiệc Cầu Vồng 3D thật với Hải Đăng & 6 Viên Ngọc! */
      if (MAY.currentLevelId !== "hub") {
        MAY.enterLevel("hub", true);
      }
      var ctx = MAY.currentCtx;
      if (!ctx) { if (onDone) onDone(); return; }

      var p = MAY.player.pos;
      p.set(0, ctx.groundH(0, 12.5) + 1.05, 12.5);
      MAY.player.yaw = Math.PI;
      if (MAY.player.triggerVictoryAnim) MAY.player.triggerVictoryAnim();

      /* Dựng thêm chùm tia sáng từ 6 Viên Ngọc bắn hội tụ lên đỉnh Hải Đăng + Pháo hoa cầu vồng liên hoàn */
      var gemCols = [0x38bdf8, 0x4ade80, 0xfacc15, 0xc084fc, 0xe0f2fe, 0xf472b6];
      var lhY = ctx.groundH(0, 0);
      var beaconTop = new THREE.Vector3(0, lhY + 15.5, 0);
      var beams = [];
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        var from = new THREE.Vector3(Math.cos(a) * 4.4, lhY + 2.0, Math.sin(a) * 4.4);
        var bMesh = MAY.VFX ? MAY.VFX.spawnLaserBeam(from, beaconTop, gemCols[i], true) : null;
        if (bMesh) beams.push(bMesh);
      }

      var fwTimer = 0;
      function tickFireworks(dt) {
        fwTimer -= dt;
        if (fwTimer <= 0) {
          fwTimer = 0.55;
          var ang = Math.random() * Math.PI * 2;
          var rad = 8 + Math.random() * 14;
          var col = gemCols[Math.floor(Math.random() * gemCols.length)];
          MAY.burstAt(new THREE.Vector3(Math.cos(ang) * rad, lhY + 11 + Math.random() * 9, Math.sin(ang) * rad), col, 22);
          if (MAY.beep) MAY.beep(520 + Math.random() * 520, 0.16, "triangle", 0.05);
        }
      }

      Cutscene.play({
        id: "grand_finale_3d",
        shots: [
          {
            dur: 4.2, fov: 60,
            speaker: "🌈 ĐẠI TIỆC CẦU VỒNG — HỒI I",
            caption: "Cả 6 Viên Ngọc Sắc Màu đã hòa nhịp thắp sáng rực rỡ Ngọn Hải Đăng Cầu Vồng trên Đảo Mây!",
            voiceClip: "finale",
            orbit: { center: new THREE.Vector3(0, lhY + 9.5, 0), radiusStart: 30, radiusEnd: 20, heightStart: 11, heightEnd: 6, startAngle: 0.4, endAngle: 1.9, lookAt: beaconTop },
            onEnter: function () {
              if (MAY.sndGem) MAY.sndGem();
              if (MAY.triggerSpellFlash) MAY.triggerSpellFlash(0xffd93d, 0.72);
            },
            onTick: function (dt) { tickFireworks(dt); }
          },
          {
            dur: 4.0, fov: 56,
            speaker: "👑 NGƯỜI HÙNG CẦU VỒNG — BÉ MÂY!",
            caption: "Bé Mây cùng Cún Milo và Bé Gió Lốc Tí Hon nhận Đôi Cánh Mây Vĩnh Viễn & Váy Công Chúa Mây!",
            orbit: { center: new THREE.Vector3(0, p.y + 0.6, 12.5), radiusStart: 7.5, radiusEnd: 5.8, heightStart: 2.2, heightEnd: 1.6, startAngle: 0.7, endAngle: 2.6, lookAt: new THREE.Vector3(0, p.y + 0.7, 12.5) },
            onEnter: function () {
              if (MAY.player.triggerVictoryAnim) MAY.player.triggerVictoryAnim();
              if (MAY.VFX) MAY.VFX.spawnGrowth(new THREE.Vector3(0, ctx.groundH(0, 12.5), 12.5));
            },
            onTick: function (dt) { tickFireworks(dt); }
          },
          {
            dur: 4.2, fov: 66,
            speaker: "🎉 LỄ HỘI HÒA BÌNH KHẮP 6 VÙNG ĐẤT",
            caption: "Vịnh San Hô, Rừng Nấm, Sa Mạc, Hang Pha Lê, Xứ Tuyết và Vương Quốc Mây đều bừng sáng trở lại!",
            fromPos: new THREE.Vector3(-26, lhY + 14, 24),
            toPos: new THREE.Vector3(24, lhY + 19, 32),
            fromLook: new THREE.Vector3(0, lhY + 6, 4),
            toLook: new THREE.Vector3(0, lhY + 10, 0),
            onTick: function (dt) { tickFireworks(dt); }
          }
        ],
        cleanup: function () {
          beams.forEach(function (b) {
            if (!b) return;
            if (b.parent) b.parent.remove(b);
            b.traverse(function (o) {
              if (o.geometry) try { o.geometry.dispose(); } catch (e) {}
              if (o.material && o.material.dispose) try { o.material.dispose(); } catch (e) {}
            });
          });
        },
        onDone: function () {
          if (onDone) onDone();
        }
      });
    }
  };

  /* Nút Bỏ qua Cutscene & Phím tắt Space / Enter / Esc */
  var skipBtn = document.getElementById("cs-skip");
  if (skipBtn) skipBtn.onclick = function () { Cutscene.skip(); };
  window.addEventListener("keydown", function (e) {
    if (!activeCS) return;
    if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      Cutscene.skip();
    }
  }, true);

  MAY.Cutscene = Cutscene;

})(window.MAY);
