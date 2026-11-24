"use strict";
/* ============================================================================
   GAME.JS — Khởi chạy Cuộc Phiêu Lưu Của Mây v11.0 (6 Vùng Đất + Đảo Mây + PBR)
   ============================================================================ */
(function (MAY) {

  var bootPct = 0;
  var bootDone = false;

  function setBoot(msg, pct) {
    if (pct > bootPct) bootPct = pct;
    var bm = document.getElementById("boot-msg");
    if (bm) bm.textContent = msg;
    var bf = document.getElementById("boot-fill");
    if (bf) bf.style.width = bootPct + "%";
  }

  function maybeEnablePlay() {
    var btn = document.getElementById("btn-play");
    if (btn && bootDone && MAY.modelsReady) {
      btn.disabled = false;
      setBoot("Sẵn sàng khám phá 6 vùng đất kỳ diệu!", 100);
    }
  }

  /* ---- Chuyển màn chơi mượt mà & dọn rác tài nguyên màn cũ ---- */
  MAY.enterLevel = function (levelId, silent) {
    if (!MAY.LEVELS || !MAY.LEVELS[levelId]) levelId = "hub";
    if (MAY.closeDialogue) MAY.closeDialogue();
    if (MAY.clear3DLoops) MAY.clear3DLoops();
    if (MAY.VFX) MAY.VFX.clear();
    if (MAY.PlanarReflector) MAY.PlanarReflector.clear();
    MAY.clearWorld();
    MAY.currentLevelId = levelId;
    MAY.save.currentLevel = levelId;
    MAY.persist();

    MAY.currentCtx = MAY.LEVELS[levelId]();
    MAY.applyOutfit(MAY.save.outfit);
    if (MAY.VFX) MAY.VFX.syncSpellUI();
    MAY.refreshHUD();
    MAY.updateHintText(MAY.currentCtx);

    var mk = document.getElementById("mask");
    var gr = document.getElementById("grade");
    if (mk) mk.style.opacity = 0;
    if (gr) gr.style.opacity = 0;

    if (!silent) {
      var m = MAY.getMeta(levelId);
      MAY.toast(m.icon + " " + m.title, m.intro);
    }
  };

  /* ---- Gắn sự kiện UI ---- */
  document.querySelectorAll("#outfits .outfit").forEach(function (el) {
    el.addEventListener("click", function () {
      MAY.applyOutfit(el.dataset.outfit);
      MAY.beep(880, 0.12);
      MAY.speak("Mây mặc bộ " + el.querySelector("span").textContent + " nè!");
    });
  });

  document.querySelectorAll(".qbtn").forEach(function (b) {
    b.onclick = function () {
      MAY.applyQuality(b.dataset.q);
      MAY.beep(880, 0.1);
    };
  });

  function startGame(targetLevel) {
    document.getElementById("ov-start").classList.add("hidden");
    MAY.started = true;
    MAY.modalOpen = false;
    MAY.startAmbient();
    if (targetLevel && targetLevel !== MAY.currentLevelId) {
      MAY.enterLevel(targetLevel, false);
    } else {
      var m = MAY.getMeta(MAY.currentLevelId);
      MAY.toast(m.icon + " " + m.title, m.intro);
    }
  }

  document.getElementById("btn-play").onclick = function () {
    startGame(MAY.currentLevelId);
  };

  document.querySelectorAll(".start-jump").forEach(function (b) {
    b.onclick = function () {
      if (document.getElementById("btn-play").disabled) return;
      startGame(b.dataset.level);
    };
  });

  document.getElementById("btn-map").onclick = function () { MAY.toggleMap(); };
  document.getElementById("btn-album").onclick = function () { MAY.toggleAlbum(); };
  document.getElementById("btn-cam").onclick = function () { MAY.cycleCam(); };
  document.querySelectorAll(".spell-slot").forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.dataset.idx, 10);
      if (MAY.selectSpell) MAY.selectSpell(idx);
      if (MAY.started && MAY.castActiveSpell) MAY.castActiveSpell();
    };
  });
  var btnCast = document.getElementById("btn-cast");
  if (btnCast) btnCast.onclick = function () { if (MAY.castActiveSpell) MAY.castActiveSpell(); };
  var intEl = document.getElementById("interact");
  if (intEl) intEl.onclick = function () { if (MAY.doInteract) MAY.doInteract(); };
  var freeBtn = document.getElementById("btn-free-spells");
  if (freeBtn) freeBtn.onclick = function () { if (MAY.toggleFreeSpells) MAY.toggleFreeSpells(); };
  document.getElementById("btn-voice").onclick = function () {
    MAY.voiceOn = !MAY.voiceOn;
    document.getElementById("btn-voice").textContent = MAY.voiceOn ? "🔊" : "🔇";
    if (MAY.setMasterMute) MAY.setMasterMute(!MAY.voiceOn);
    if (!MAY.voiceOn && MAY.stopSpeech) MAY.stopSpeech();
    if (MAY.voiceOn) MAY.speak("Mây sẽ đọc to cho bé nghe nhé!");
  };
  document.getElementById("btn-restart").onclick = function () {
    if (confirm("Chơi lại toàn bộ 6 màn từ đầu? Các Viên Ngọc và bộ sưu tập sẽ đặt lại!")) {
      MAY.resetSave();
      location.reload();
    }
  };

  document.getElementById("quiz-close").onclick = function () {
    MAY.closeQuiz();
    MAY.toast("Để sau nhé, trạm câu đố vẫn chờ Mây đó!");
  };
  document.getElementById("map-close").onclick = function () { MAY.closeAllModals(); };
  document.getElementById("album-close").onclick = function () { MAY.closeAllModals(); };
  document.getElementById("btn-win-stay").onclick = function () { MAY.closeAllModals(); };
  document.getElementById("btn-finale-hub").onclick = function () {
    MAY.closeAllModals();
    MAY.enterLevel("hub");
  };
  document.getElementById("btn-finale-stay").onclick = function () { MAY.closeAllModals(); };

  /* ---- Khởi tạo màn đầu tiên & tải 15 mô hình 3D ---- */
  MAY.applyQuality("mid");
  MAY.enterLevel(MAY.save.currentLevel || "hub", true);

  var BOOT_STEPS = [
    ["Đang tổng hợp vật liệu PBR & Normal Map…", 20],
    ["Đang dựng sóng biển Gerstner & bầu trời…", 44],
    ["Đang gọi Cá heo Bubi & Cún Milo…", 68],
    ["Đang thắp sáng 6 Vùng Đất Kỳ Diệu…", 84]
  ];
  BOOT_STEPS.forEach(function (b, i) {
    setTimeout(function () {
      setBoot(b[0], b[1]);
      if (i === BOOT_STEPS.length - 1) { bootDone = true; maybeEnablePlay(); }
    }, 180 + i * 260);
  });

  MAY.loadAllModels(
    function (done, total) {
      setBoot("Đang tải mô hình 3D (" + done + "/" + total + ")…", 84 + Math.round(16 * done / total));
    },
    function () {
      if (MAY.currentCtx && MAY.currentCtx.onModelsReady) {
        try { MAY.currentCtx.onModelsReady(); } catch (e) {}
      }
      maybeEnablePlay();
    }
  );

  /* ---- Vòng lặp chính ---- */
  var clock = new THREE.Clock();
  var frames = 0;

  MAY.renderer.setAnimationLoop(function () {
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    MAY.shaderUniforms.uTime.value = t;
    MAY.ensureEnv();

    var ctx = MAY.currentCtx;
    if (ctx) {
      if (MAY.started) {
        MAY.player.update(dt, t, ctx);
        ctx.updateAll(dt, t);
        MAY.updateBursts(dt);
      } else {
        MAY.player.updateIdleOrbit(t);
        if (ctx.onUpdate) ctx.onUpdate(dt, t);
        MAY.updateSunFollow(MAY.player.pos);
      }
    }

    if (MAY.updateAudioListener) MAY.updateAudioListener(MAY.camera);
    var camUnderwater = !!(ctx && ctx.waterLevel !== undefined && MAY.camera.position.y < ctx.waterLevel);
    MAY.renderFrame(dt, camUnderwater);

    frames++;
    if (frames === 3) {
      window.__ready = true;
      window.__loadLevel = function (id) {
        document.getElementById("ov-start").classList.add("hidden");
        MAY.started = true;
        MAY.closeAllModals();
        MAY.enterLevel(id, true);
      };
      window.__state = function () {
        var c = MAY.currentCtx;
        var ls = MAY.getLevelSave(MAY.currentLevelId);
        return {
          level: MAY.currentLevelId,
          gems: MAY.save.gems.length,
          items: ls.items.length,
          friends: ls.friends.length,
          treasures: ls.treasures.length,
          challenges: Object.keys(ls.challenges).filter(function (k) { return ls.challenges[k]; }).length,
          onLand: MAY.player.onLand,
          camDist: MAY.player.camDist,
          quality: MAY.quality,
          modelsReady: MAY.modelsReady,
          pos: [MAY.player.pos.x.toFixed(1), MAY.player.pos.y.toFixed(1), MAY.player.pos.z.toFixed(1)],
          yaw: MAY.player.yaw.toFixed(2),
          sceneChildren: MAY.worldRoot.children.length
        };
      };
    }
  });

})(window.MAY);
