"use strict";
/* ============================================================================
   GAME.JS — Khởi chạy Cuộc Phiêu Lưu Của Mây v13.5 (6 Vùng Đất + PBR + 36 GLB Rig/CC0)
   ============================================================================ */
(function (MAY) {

  var bootPct = 0;

  function setBoot(msg, pct) {
    if (pct > bootPct) bootPct = pct;
    var bm = document.getElementById("boot-msg");
    if (bm) bm.textContent = msg;
    var bf = document.getElementById("boot-fill");
    if (bf) bf.style.width = bootPct + "%";
  }

  /* ---- Chuyển màn chơi mượt mà, chống gọi trùng & dọn sạch trạng thái màn cũ ---- */
  var pendingLevel = null;
  var clock = new THREE.Clock();

  MAY.enterLevel = function (levelId, silent) {
    if (!MAY.LEVELS[levelId]) levelId = "hub";
    if (MAY.isLevelUnlocked && !MAY.isLevelUnlocked(levelId)) {
      if (!MAY.started && silent) levelId = "hub";
      else {
        if (MAY.started) MAY.toast("🔒 Nhận Ngọc của chương trước để mở vùng đất này nhé!");
        return Promise.resolve(false);
      }
    }
    if (pendingLevel && pendingLevel.id === levelId) return pendingLevel.promise;
    var entry = { id: levelId };
    pendingLevel = entry;
    if (MAY.started) MAY.toast("Đang tới " + MAY.getMeta(levelId).shortName + "…");
    entry.promise = MAY.loadWorldModels(levelId).then(function () {
      if (pendingLevel !== entry) return false;
      if (MAY.activeJourney) MAY.activeJourney.leave();
      if (MAY.currentCtx && MAY.currentCtx.leaveBiomeClue) MAY.currentCtx.leaveBiomeClue();
      if (MAY.Cutscene && MAY.Cutscene.cancelSilent) MAY.Cutscene.cancelSilent();
      if (MAY.closeAllModals) MAY.closeAllModals();
      if (MAY.closeDialogue) MAY.closeDialogue(false);
      if (MAY.stopSpeech) MAY.stopSpeech();
      if (MAY.resetInteractTarget) MAY.resetInteractTarget();
      var hintEl = document.getElementById("hint");
      if (hintEl) hintEl.style.display = "";
      if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
      var sbEl = document.getElementById("skill-banner");
      if (sbEl) sbEl.classList.add("hidden");

      if (MAY.currentCtx && MAY.currentCtx.save && !MAY.currentCtx.save.gem && MAY.currentCtx.playSecs > 0) {
        MAY.currentCtx.save.playSecs = Math.round(MAY.currentCtx.playSecs);
      }
      entry.replacingWorld = true;
      MAY.currentCtx = null;
      var crystalPanel = document.getElementById("crystal-music");
      if (crystalPanel) crystalPanel.classList.add("hidden");
      if (MAY.clear3DLoops) MAY.clear3DLoops();
      if (MAY.VFX) MAY.VFX.clear();
      if (MAY.PlanarReflector) MAY.PlanarReflector.clear();
      if (MAY.WaterRefractor) MAY.WaterRefractor.hasValidFrame = false;
      if (MAY.setSunOffset) MAY.setSunOffset(24, 42, 16);
      if (MAY.diveLight) {
        MAY.diveLight.color.setHex(0xbfefff);
        MAY.diveLight.intensity = 0.12;
        MAY.diveLight.castShadow = false;
      }
      if (MAY.camera && MAY.camera.fov !== 70) {
        MAY.camera.fov = 70;
        MAY.camera.updateProjectionMatrix();
      }
      document.body.classList.remove("boss-active");
      MAY.clearWorld();
      MAY.currentLevelId = levelId;

      MAY.currentCtx = MAY.LEVELS[levelId]();
      if (MAY.installBiomeBonus) MAY.installBiomeBonus(MAY.currentCtx);
      MAY.applyOutfit(MAY.save.outfit);
      if (MAY.VFX) MAY.VFX.syncSpellUI();
      MAY.refreshHUD();
      MAY.updateHintText(MAY.currentCtx);

      var mk = document.getElementById("mask");
      var gr = document.getElementById("grade");
      if (mk) mk.style.opacity = 0;
      if (gr) gr.style.opacity = 0;

      /* Xả dt tích lũy trong lúc dựng màn để khung hình đầu tiên không bị giật bước */
      clock.getDelta();

      if (!silent) {
        var m = MAY.getMeta(levelId);
        if (MAY.started && MAY.Cutscene && MAY.Cutscene.playWorldIntro && MAY.currentCtx && MAY.currentCtx.save && !MAY.currentCtx.save.introSeen) {
          MAY.currentCtx.save.introSeen = true;
          MAY.persist();
          MAY.Cutscene.playWorldIntro(MAY.currentCtx, function () {
            MAY.toast(m.icon + " " + m.title, m.intro);
          });
        } else {
          MAY.toast(m.icon + " " + m.title, m.intro);
        }
      }
      MAY.save.currentLevel = levelId;
      MAY.persist();
      if (!MAY.started) {
        document.getElementById("btn-play").disabled = false;
        setBoot("Sẵn sàng khám phá!", 100);
        startOfflineDownload();
      }
      return true;
    }).catch(function (error) {
      if (pendingLevel !== entry) return false;
      if (entry.replacingWorld) MAY.currentCtx = null;
      MAY.releaseRetiredWorld();
      MAY.reportError(error, "enterLevel", { pause: true });
      return false;
    }).finally(function () {
      if (pendingLevel === entry) pendingLevel = null;
    });
    return entry.promise;
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
      MAY.save.quality = b.dataset.q;
      MAY.persist();
      MAY.beep(880, 0.1);
    };
  });

  function syncFreeExploreUI() {
    var qw = document.getElementById("quick-worlds");
    var sf = document.getElementById("btn-start-free");
    var mf = document.getElementById("btn-map-free");
    var on = !!(MAY.save.freeExplore || MAY.save.freeSpells);
    if (qw) qw.classList.toggle("hidden", !on);
    if (sf) sf.textContent = on
      ? "🔓 Đang bật Chế độ Tự do (Chọn nhanh mọi màn) — Bấm về Cốt truyện"
      : "🧭 Chế độ Cốt truyện (Mở từng chương) — Bấm để bật Tự do";
    if (mf) mf.textContent = on ? "🔒 Quay về Chế độ Cốt truyện" : "🔓 Mở Khám phá Tự do";
  }
  MAY.syncFreeExploreUI = syncFreeExploreUI;
  MAY.toggleFreeExplore = function () {
    var next = !(MAY.save.freeExplore || MAY.save.freeSpells);
    MAY.save.freeExplore = next;
    if (!next) MAY.save.freeSpells = false;
    MAY.persist();
    syncFreeExploreUI();
    if (MAY.VFX && MAY.VFX.syncSpellUI) MAY.VFX.syncSpellUI();
    var mapOv = document.getElementById("ov-map");
    if (mapOv && !mapOv.classList.contains("hidden") && MAY.openMap) MAY.openMap();
    MAY.toast(next ? "🔓 Đã bật Chế độ Khám phá Tự do: Mở khóa toàn bộ 6 vùng đất!" : "🧭 Đã trở về Chế độ Cốt truyện: Mở từng chương theo hành trình!");
  };
  var btnStartFree = document.getElementById("btn-start-free");
  if (btnStartFree) btnStartFree.onclick = function () { MAY.toggleFreeExplore(); };
  var btnMapFree = document.getElementById("btn-map-free");
  if (btnMapFree) btnMapFree.onclick = function () { MAY.toggleFreeExplore(); };
  syncFreeExploreUI();

  function startGame(targetLevel) {
    document.getElementById("ov-start").classList.add("hidden");
    MAY.started = true;
    MAY.modalOpen = false;
    MAY.startAmbient();
    if (targetLevel && targetLevel !== MAY.currentLevelId) {
      MAY.enterLevel(targetLevel, false);
    } else {
      var m = MAY.getMeta(MAY.currentLevelId);
      if (MAY.Cutscene && MAY.Cutscene.playWorldIntro && MAY.currentCtx && MAY.currentCtx.save && !MAY.currentCtx.save.introSeen) {
        MAY.currentCtx.save.introSeen = true;
        MAY.persist();
        MAY.Cutscene.playWorldIntro(MAY.currentCtx, function () {
          MAY.toast(m.icon + " " + m.title, m.intro);
        });
      } else {
        MAY.toast(m.icon + " " + m.title, m.intro);
      }
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
    };
  });
  var btnCast = document.getElementById("btn-cast");
  if (btnCast) btnCast.onclick = function () { if (MAY.castActiveSpell) MAY.castActiveSpell(); };
  var intEl = document.getElementById("interact");
  if (intEl) {
    intEl.onclick = function () { if (MAY.doInteract) MAY.doInteract(); };
    intEl.onkeydown = function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); intEl.click(); }
    };
  }
  var freeBtn = document.getElementById("btn-free-spells");
  if (freeBtn) freeBtn.onclick = function () { if (MAY.toggleFreeSpells) MAY.toggleFreeSpells(); };
  document.getElementById("btn-voice").onclick = function () {
    MAY.voiceOn = !MAY.voiceOn;
    MAY.save.voiceOn = MAY.voiceOn;
    MAY.persist();
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
  var btnFinaleReplay = document.getElementById("btn-finale-replay");
  document.getElementById("btn-finale-activities").onclick = function () { MAY.openFestivalInvites(); };
  if (btnFinaleReplay) btnFinaleReplay.onclick = function () {
    if (MAY.showGrandFinale) MAY.showGrandFinale();
  };
  document.getElementById("btn-finale-hub").onclick = function () {
    MAY.closeAllModals();
    MAY.enterLevel("hub");
  };
  var btnFinaleMap = document.getElementById("btn-finale-map");
  if (btnFinaleMap) btnFinaleMap.onclick = function () {
    MAY.closeAllModals();
    if (MAY.openMap) MAY.openMap();
  };
  document.getElementById("btn-finale-stay").onclick = function () { MAY.closeAllModals(); };

  /* Nút phục hồi Global Error Boundary */
  var btnErrResume = document.getElementById("err-resume");
  if (btnErrResume) btnErrResume.onclick = function () {
    if (MAY.currentCtx) MAY.ErrorBoundary.dismiss();
    else MAY.ErrorBoundary.recoverToHub();
  };
  var btnErrHub = document.getElementById("err-hub");
  if (btnErrHub) btnErrHub.onclick = function () {
    if (MAY.ErrorBoundary) MAY.ErrorBoundary.recoverToHub();
  };
  var btnErrReload = document.getElementById("err-reload");
  if (btnErrReload) btnErrReload.onclick = function () { location.reload(); };

  /* ---- Khôi phục cài đặt đã lưu (đồ họa, âm thanh, camera) & khởi tạo màn đầu ---- */
  MAY.voiceOn = MAY.save.voiceOn !== undefined ? !!MAY.save.voiceOn : true;
  var vb = document.getElementById("btn-voice");
  if (vb) vb.textContent = MAY.voiceOn ? "🔊" : "🔇";
  if (MAY.setMasterMute) MAY.setMasterMute(!MAY.voiceOn);
  if (MAY.player && typeof MAY.save.camDist === "number") MAY.player.camDist = MAY.save.camDist;
  MAY.applyQuality(MAY.save.quality || "mid");
  var initLv = MAY.save.currentLevel || "hub";
  if (MAY.isLevelUnlocked && !MAY.isLevelUnlocked(initLv)) initLv = "hub";
  setBoot("Đang chuẩn bị " + MAY.getMeta(initLv).shortName + "…", 20);
  MAY.enterLevel(initLv, true);

  function startOfflineDownload() {
    if (!("serviceWorker" in navigator) || !MAY.currentCtx) return;
    navigator.serviceWorker.ready.then(function (registration) {
      if (registration.active) registration.active.postMessage({ type: "cache-worlds", first: MAY.currentLevelId });
    });
  }
  if ("serviceWorker" in navigator) {
    window.addEventListener("online", startOfflineDownload);
    document.getElementById("offline-retry").onclick = startOfflineDownload;
    navigator.serviceWorker.addEventListener("controllerchange", startOfflineDownload);
    navigator.serviceWorker.addEventListener("message", function (event) {
      if (!event.data || event.data.type !== "offline-progress") return;
      var status = document.getElementById("offline-status");
      if (status) status.textContent = event.data.text;
      document.getElementById("offline-retry").hidden = !event.data.paused;
    });
  }

  /* ---- Vòng lặp chính (được bọc Error Boundary chống treo toàn cục) ---- */
  var frames = 0;

  MAY.renderer.setAnimationLoop(function () {
    if (!MAY.currentCtx || pendingLevel || (MAY.ErrorBoundary && MAY.ErrorBoundary.paused)) return;
    try {
      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;
      if (!MAY.activeJourney && MAY.currentCtx.chapterJourney) MAY.currentCtx.chapterJourney.resumeIfNeeded();
      if (MAY.activeJourney) {
        MAY.activeJourney.frame(dt, t);
        return;
      }
      MAY.shaderUniforms.uTime.value = t;
      MAY.ensureEnv();

      var ctx = MAY.currentCtx;
      var inCutscene = !!(MAY.Cutscene && MAY.Cutscene.isPlaying());
      if (ctx) {
        document.body.classList.toggle("boss-active", !!(ctx.boss && ctx.boss.active && !ctx.boss.defeated));
        if (inCutscene) {
          MAY.Cutscene.update(dt, t, ctx);
          if (MAY.player && MAY.player.updateRigOnly) MAY.player.updateRigOnly(dt, t, ctx);
          if (ctx.updateCutsceneVisuals) ctx.updateCutsceneVisuals(dt, t);
          if (ctx.onUpdate) ctx.onUpdate(dt, t);
          if (MAY.VFX && MAY.VFX.update) MAY.VFX.update(dt, t, ctx);
          MAY.updateBursts(dt);
        } else if (MAY.started) {
          MAY.player.update(dt, t, ctx);
          ctx.updateAll(dt, t);
          MAY.updateBursts(dt);
        } else {
          MAY.player.updateIdleOrbit(t, dt);
          if (ctx.onUpdate) ctx.onUpdate(dt, t);
          MAY.updateSunFollow(MAY.player.pos);
        }
      }

      if (MAY.updateLevelLights) MAY.updateLevelLights(MAY.player ? MAY.player.pos : MAY.camera.position);

      if (MAY.updateAudioListener) MAY.updateAudioListener(MAY.camera);
      var camUnderwater = !!(ctx && ctx.waterLevel !== undefined && MAY.camera.position.y < ctx.waterLevel);
      MAY.renderFrame(dt, camUnderwater);
      MAY.releaseRetiredWorld();
      if (MAY.ErrorBoundary) MAY.ErrorBoundary.consecutiveFrameErrors = 0;

      frames++;
      if (frames === 3) {
        window.__ready = true;
        window.__loadLevel = function (id) {
          document.getElementById("ov-start").classList.add("hidden");
          MAY.started = true;
          MAY.closeAllModals();
          MAY.enterLevel(id, true);
        };
        window.__playFinale = function () {
          document.getElementById("ov-start").classList.add("hidden");
          MAY.started = true;
          if (MAY.showGrandFinale) MAY.showGrandFinale();
        };
        window.__playIntro = function () {
          if (MAY.Cutscene && MAY.currentCtx) MAY.Cutscene.playWorldIntro(MAY.currentCtx);
        };
        window.__state = function () {
          var c = MAY.currentCtx;
          var ls = MAY.getLevelSave(MAY.currentLevelId);
          var lmCount = 0;
          if (MAY.worldRoot) {
            MAY.worldRoot.traverse(function (o) {
              if (o.isMesh && o.material && o.material.lightMap) lmCount++;
            });
          }
          var colShapes = { box: 0, sphere: 0, cylinder: 0 };
          if (c && c.colliders) {
            c.colliders.forEach(function (col) {
              var k = col.shape || "cylinder";
              if (colShapes[k] !== undefined) colShapes[k]++;
            });
          }
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
            sceneChildren: MAY.worldRoot.children.length,
            depthMode: MAY.getDepthMode ? MAY.getDepthMode() : "unknown",
            panningModel: MAY.getPanningModel ? MAY.getPanningModel() : "unknown",
            ambienceMode: MAY.ambienceSourceMode || "unknown",
            colliders: c && c.colliders ? c.colliders.length : 0,
            colliderShapes: colShapes,
            hasLightProbe: !!(c && c.lightProbe),
            lightmapMeshes: lmCount,
            waterRefract: !!(MAY.WaterRefractor && MAY.WaterRefractor.hasValidFrame),
            hasSideQuest: !!(c && c.sideQuest),
            sideQuestDone: !!(ls.sideQuest && ls.sideQuest.done),
            cutscenePlaying: !!(MAY.Cutscene && MAY.Cutscene.isPlaying()),
            errorCount: MAY.ErrorBoundary ? MAY.ErrorBoundary.history.length : 0
          };
        };
      }
    } catch (err) {
      MAY.releaseRetiredWorld();
      if (MAY.ErrorBoundary) {
        MAY.ErrorBoundary.consecutiveFrameErrors++;
        MAY.reportError(err, "renderLoop", { pause: MAY.ErrorBoundary.consecutiveFrameErrors >= 3 });
      } else if (window.console) {
        console.error(err);
      }
    }
  });

})(window.MAY);
