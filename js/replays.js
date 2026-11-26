/* Replay the player's fastest route with a star that follows the recorded positions. */
(function (MAY) {
  "use strict";

  function duration(seconds) {
    return seconds.toFixed(1).replace(".", ",") + " giây";
  }

  function sample(time, player) {
    return [time, player.x, player.y, player.z].map(function (n) { return Math.round(n * 100) / 100; });
  }

  MAY.bindRace = function (ctx, race) {
    var player = MAY.player.pos;
    var hint = document.getElementById("hint");
    var armed = true, elapsed = 0, splitTimes = [], path = [], ghostIndex = 0;
    var bonusTime = 0, boostStars = [];
    // Optional detours: the stars buy breathing room, but cost distance to reach.
    for (var i = 0; i < Math.min(2, race.rings.length); i++) {
      var star = new THREE.Mesh(MAY.starGeo, new THREE.MeshBasicMaterial({ color: 0xffd34f }));
      star.userData.sharedGeo = true;
      star.visible = false;
      star.scale.setScalar(0.7);
      ctx.add(star);
      boostStars.push(star);
    }

    race.boostStars = boostStars;

    function placeBoostStars() {
      var wins = ctx.save.raceRecord ? ctx.save.raceRecord.wins : 0;
      boostStars.forEach(function (star, index) {
        var endIndex = Math.min(race.rings.length - 1, index * 2);
        var a = endIndex ? race.rings[endIndex - 1].position : race.startRing.position;
        var b = race.rings[endIndex].position;
        var dx = b.x - a.x, dz = b.z - a.z;
        var length = Math.sqrt(dx * dx + dz * dz) || 1;
        var side = (wins + index) % 2 ? -1 : 1;
        star.position.set((a.x + b.x) / 2 - dz / length * 3.5 * side,
          (a.y + b.y) / 2, (a.z + b.z) / 2 + dx / length * 3.5 * side);
        // The cloud route crosses open sky. Keep the detour over a walkable
        // island or bridge so a player can actually reach it by jumping.
        if (ctx.id === "level6") {
          var found = false;
          [3.5 * side, -3.5 * side, 0].some(function (offset) {
            return [0.5, 0.35, 0.65, 0.2, 0.8].some(function (fraction) {
              var x = a.x + dx * fraction - dz / length * offset;
              var z = a.z + dz * fraction + dx / length * offset;
              var ground = ctx.groundH(x, z);
              if (ground < -100) return false;
              star.position.set(x, ground + 1.4, z);
              found = true;
              return true;
            });
          });
          if (!found) star.position.copy(b);
        }
        star.userData.collected = false;
        star.visible = true;
      });
    }
    var ghost = new THREE.Mesh(MAY.starGeo, new THREE.MeshBasicMaterial({ color: 0xffdc79 }));
    ghost.userData.sharedGeo = true;
    ghost.scale.setScalar(0.46);
    ghost.visible = false;
    ctx.add(ghost);
    var aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: MAY.TEX.glow, color: 0xffc859, transparent: true, opacity: 0.56, depthWrite: false
    }));
    aura.scale.set(3.5, 3.5, 1);
    ghost.add(aura);

    function start() {
      if (race.active) return;
      armed = false;
      race.active = true;
      race.idx = 0;
      race.t = race.limit;
      elapsed = 0;
      bonusTime = 0;
      placeBoostStars();
      splitTimes = [];
      path = [sample(0, player)];
      ghostIndex = 0;
      ghost.visible = !!ctx.save.raceRecord;
      if (ghost.visible) moveGhost();
      MAY.sndFriend();
      MAY.toast("🏁 " + race.title + (ghost.visible ? " · Đua với kỷ lục của mình. Nhặt sao vàng để thêm giờ!" : " · Qua các vòng xanh. Nhặt sao vàng để thêm giờ!"));
    }

    function moveGhost() {
      var points = ctx.save.raceRecord.path;
      while (ghostIndex + 1 < points.length - 1 && points[ghostIndex + 1][0] <= elapsed) ghostIndex++;
      var a = points[ghostIndex], b = points[ghostIndex + 1];
      var f = THREE.MathUtils.clamp((elapsed - a[0]) / Math.max(0.01, b[0] - a[0]), 0, 1);
      ghost.position.set(a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f + 0.5, a[3] + (b[3] - a[3]) * f);
      ghost.quaternion.copy(MAY.camera.quaternion);
    }

    function stop() {
      race.active = false;
      ghost.visible = false;
      boostStars.forEach(function (star) { star.visible = false; });
      race.rings.forEach(function (ring) {
        ring.scale.setScalar(1);
        if (ring.userData.rimMat) ring.userData.rimMat.emissiveIntensity = 1;
      });
      hint.style.display = "";
      MAY.updateHintText(ctx);
    }

    function finish() {
      stop();
      var time = Math.max(0.01, Math.round(elapsed * 100) / 100);
      var previous = ctx.save.raceRecord;
      var isBest = !previous || time < previous.best;
      if (isBest) {
        var end = sample(time, player);
        if (path[path.length - 1][0] < time) path.push(end);
        else path[path.length - 1] = end;
        ctx.save.raceRecord = { best: time, wins: previous ? previous.wins + 1 : 1, splits: splitTimes, path: path };
      } else previous.wins++;
      var message = "🏁 " + duration(time) + (isBest ? " · Kỷ lục mới! Lần sau Mây có thể đua với ngôi sao của mình." : " · Kỷ lục của Mây " + duration(previous.best) + ".");
      if (ctx.save.challenges.race) {
        MAY.persist();
        MAY.toast(message);
      } else ctx.challengeDone("race", "🏅 Huy hiệu tốc độ! " + message);
      if (MAY.VFX) MAY.VFX.spawnTornado(player.clone(), true);
    }

    race.cancel = function () {
      if (race.active) stop();
    };
    race.launch = function () {
      if (race.active) return;
      var startPos = race.startRing.position, target = race.rings[0].position;
      MAY.player.spawnAt(startPos.x, startPos.y, startPos.z,
        Math.atan2(startPos.x - target.x, startPos.z - target.z), startPos.y < ctx.waterLevel);
      start();
    };

    race.update = function (dt, t) {
      if (MAY.modalOpen) return;
      if (!race.active) {
        if (race.startRing.userData.rune) race.startRing.userData.rune.rotation.z += dt * 1.4;
        var distance = race.startRing.position.distanceTo(player);
        if (distance > 3.7) armed = true;
        if (ctx.fishRescueActive || ctx.crystalEncoreActive || ctx.biomeClueActive || (ctx.boss && ctx.boss.active && !ctx.boss.defeated) ||
            (ctx.visitingSideQuest && !ctx.save.sideQuest.done)) {
          if (distance < 3.1) armed = false;
          return;
        }
        if (armed && distance < 3.1) start();
        return;
      }
      elapsed += dt;
      race.t = Math.max(0, race.limit + bonusTime - elapsed);
      if (elapsed >= race.limit + bonusTime) {
        stop();
        MAY.toast("⏱️ Hết giờ. Quay lại vạch xuất phát để thử đường khác nhé!");
        return;
      }
      if (elapsed - path[path.length - 1][0] >= 0.32) path.push(sample(elapsed, player));
      if (ghost.visible) moveGhost();
      boostStars.forEach(function (star) {
        if (star.userData.collected) return;
        star.rotation.y += dt * 2.5;
        star.scale.setScalar(0.7 + Math.sin(t * 5) * 0.1);
        if (star.position.distanceTo(player) < 2.4) {
          star.userData.collected = true;
          star.visible = false;
          bonusTime += 4;
          race.t += 4;
          MAY.sndStar();
          MAY.burstAt(star.position.clone(), 0xffd34f, 14);
          MAY.toast("⭐ Sao tiếp sức! Thêm 4 giây để về đích!");
        }
      });
      var ring = race.rings[race.idx];
      var left = Math.ceil(race.t);
      hint.style.display = "block";
      var message = "🏁 Vòng " + (race.idx + 1) + "/" + race.rings.length + " · " + Math.round(ring.position.distanceTo(player)) + " m · Còn " + left + " giây";
      if (hint.textContent !== message) hint.textContent = message;
      if (ring.userData.rimMat) ring.userData.rimMat.emissiveIntensity = 1.65 + Math.sin(t * 5) * 0.45;
      if (ring.userData.rune) ring.userData.rune.rotation.z -= dt * 2.2;
      ring.scale.setScalar(1.1 + Math.sin(t * 5) * 0.06);
      if (ring.position.distanceTo(player) >= 3.2) return;
      if (ring.userData.rimMat) ring.userData.rimMat.emissiveIntensity = 1;
      ring.scale.setScalar(1);
      MAY.sndStar();
      MAY.burstAt(ring.position.clone(), 0x4dd0ff, 14);
      splitTimes.push(Math.round(elapsed * 100) / 100);
      race.idx++;
      if (race.idx === race.rings.length) { finish(); return; }
      var old = ctx.save.raceRecord;
      var gap = old ? old.splits[race.idx - 1] - elapsed : NaN;
      var split = Number.isFinite(gap) ? (Math.abs(gap) < 0.1 ? " · Ngang kỷ lục" : (gap > 0 ? " · Nhanh hơn " : " · Chậm hơn ") + duration(Math.abs(gap))) : "";
      MAY.toast("🏁 Qua vòng " + race.idx + "/" + race.rings.length + split);
    };
  };

  MAY.visitReplay = function (levelId, activity) {
    if (!MAY.getLevelSave(levelId).gem || !MAY.isLevelUnlocked(levelId)) return Promise.resolve(false);
    MAY.closeAllModals();
    var ready = MAY.currentCtx && MAY.currentCtx.id === levelId ? Promise.resolve(true) : MAY.enterLevel(levelId, true);
    return ready.then(function (ok) {
      var ctx = MAY.currentCtx;
      if (!ok || !ctx || ctx.id !== levelId) return false;
      ctx.visitingSideQuest = activity === "quest";
      if (activity !== "race" && ctx.raceCh) ctx.raceCh.cancel();
      if (activity !== "music" && ctx.leaveCrystalEncore) ctx.leaveCrystalEncore();
      if (activity !== "rematch" && ctx.leaveBossRematch) ctx.leaveBossRematch();
      if (activity !== "fish" && ctx.leaveFishRescue) ctx.leaveFishRescue();
      if (activity !== "clue" && ctx.leaveBiomeClue) ctx.leaveBiomeClue();
      if (activity === "clue" && ctx.startBiomeClue) return ctx.startBiomeClue();
      if (activity === "fish" && ctx.startFishRescue) return ctx.startFishRescue();
      if (activity === "music" && ctx.startCrystalEncore) return ctx.startCrystalEncore();
      if (activity === "rematch" && ctx.startBossRematch) return ctx.startBossRematch();
      if (activity === "race" && ctx.raceCh) ctx.raceCh.launch();
      else if (activity === "quest" && ctx.sideQuest && !ctx.sideQuest.save.done) {
        var friend = ctx.sideQuest, pos = friend.npcPos, z = pos.z + 2;
        var y = friend.floating ? pos.y : ctx.groundH(pos.x, z) + 1.05;
        MAY.player.spawnAt(pos.x, y, z, 0, y < ctx.waterLevel);
        friend.talk();
      } else return false;
      return true;
    });
  };

  MAY.festivalGuests = function () {
    var fish = MAY.getLevelSave("level1").challenges.fishRoutes;
    var forest = MAY.getLevelSave("level2").sideQuest;
    var music = MAY.getLevelSave("level4").challenges.crystalEncore;
    return [
      { id: "level1", name: "Cá heo Bubi", icon: "🐬", ready: !!(fish && fish.home), activity: "fish", task: "Cùng Bubi dẫn đàn cá về nơi trú để bạn kịp về đảo." },
      { id: "level2", name: "Thỏ Rừng Bông", icon: "🐇", ready: !!forest.done, activity: "quest", task: "Giúp Thỏ chuẩn bị hạt dẻ và thắp đèn cho bữa tiệc rừng." },
      { id: "level4", name: "Cú Mèo", icon: "🦉", ready: !!(music && music.wins > 0), activity: "music", task: "Tập một bản hòa tấu với Cú Mèo cho buổi diễn bên hải đăng." }
    ];
  };

  MAY.openFestivalInvites = function () {
    MAY.openAlbum();
    var section = document.getElementById("festival-invites");
    if (!section.hidden) section.scrollIntoView({ block: "start" });
  };

  function renderFestivalInvites() {
    var section = document.getElementById("festival-invites");
    section.hidden = MAY.save.gems.length < 6;
    if (section.hidden) return;
    var guests = MAY.festivalGuests(), list = document.getElementById("festival-guests");
    var readyCount = guests.filter(function (guest) { return guest.ready; }).length;
    list.replaceChildren();
    document.getElementById("festival-progress").textContent = readyCount < guests.length ?
      "Mây đã tìm đủ sáu Ngọc. Gặp ba người bạn để cùng mở buổi hòa nhạc. Đã hẹn " + readyCount + "/3 bạn." :
      (MAY.save.festivalConcerts ? "Đã biểu diễn " + MAY.save.festivalConcerts + " lần. Các bạn sẵn sàng chơi thêm một bản." : "Cả ba bạn đã có mặt. Đến sân khấu dưới chân hải đăng để dẫn nhịp!");
    guests.forEach(function (guest) {
      var item = document.createElement(guest.ready ? "div" : "button");
      item.className = "festival-guest";
      var name = document.createElement("b"), detail = document.createElement("small");
      name.textContent = guest.icon + " " + guest.name;
      detail.textContent = guest.ready ? "✓ Đã hẹn về đảo" : guest.task;
      item.append(name, detail);
      if (!guest.ready) {
        item.type = "button";
        item.setAttribute("aria-label", "Đến gặp " + guest.name + ". " + guest.task);
        item.onclick = function () { MAY.visitReplay(guest.id, guest.activity); };
      }
      list.appendChild(item);
    });
    var conduct = document.getElementById("festival-conduct");
    conduct.hidden = readyCount !== guests.length;
    conduct.onclick = function () {
      MAY.closeAllModals();
      var ready = MAY.currentLevelId === "hub" ? Promise.resolve(true) : MAY.enterLevel("hub", true);
      ready.then(function (ok) {
        var ctx = MAY.currentCtx;
        if (ok && ctx && ctx.id === "hub" && ctx.startFestivalConcert) ctx.startFestivalConcert();
      });
    };
  }

  MAY.renderReplays = function () {
    renderFestivalInvites();
    var section = document.getElementById("album-replays");
    var list = document.getElementById("replay-list");
    list.replaceChildren();
    var cleared = MAY.LEVEL_META.filter(function (meta) { return meta.num && MAY.getLevelSave(meta.id).gem; });
    cleared.forEach(function (meta) {
      var saved = MAY.getLevelSave(meta.id);
      var clueTitle = MAY.getBiomeBonusTitle && MAY.getBiomeBonusTitle(meta.id);
      if (clueTitle) {
        var clue = saved.challenges.biomeClue;
        add(meta, "clue", "🔎 " + clueTitle, clue && clue.wins ? "Kỷ niệm đã tìm: " + clue.wins : "Quan sát ba dấu và tìm lời giải");
      }
      if (meta.id === "level1") {
        var rescue = saved.challenges.fishRoutes, story = saved.story.steps;
        var paths = rescue ? rescue.paths : story.fishRescueChosen ? 1 << (Number(story.fishRescueExit) === 1 ? 1 : 0) : 0;
        var detail = ["Khám phá hai lối thoát", "Thử lối vàng về vịnh", "Thử lối xanh tới rạn", "Đã đưa cá qua cả hai lối"];
        add(meta, "fish", "🐬 Cứu đàn cá cùng Bubi", rescue && rescue.fishRescue === 2 ? "Tiếp tục dẫn đàn cá về nơi trú" : detail[paths & 3]);
      }
      if (meta.id === "level4") {
        var music = saved.challenges.crystalEncore;
        add(meta, "music", "🎵 Hòa tấu cùng Cú Mèo", music && music.bestLength ? "Kỷ lục " + music.bestLength + " nốt" : "Thử một giai điệu mới");
      }
      if (meta.id === "level5") {
        var duels = saved.challenges.bossRematch;
        add(meta, "rematch", "🐺 Đấu tập với Sói Tuyết", duels && duels.wins ? duels.wins + " trận thắng · " + duels.clean + " trận trọn nhịp" : "Đọc tín hiệu băng và nắng");
      }
    });
    cleared.forEach(function (meta) {
      var record = MAY.getLevelSave(meta.id).raceRecord;
      add(meta, "race", "🏁 " + meta.shortName, record ? "Kỷ lục " + duration(record.best) : "Lập kỷ lục đường đua");
    });
    section.hidden = !list.childElementCount;
    function add(meta, activity, title, detail) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "alb-chip replay-choice";
      var name = document.createElement("b"), score = document.createElement("small");
      name.textContent = title; score.textContent = detail;
      button.append(name, score);
      button.onclick = function () { MAY.visitReplay(meta.id, activity); };
      list.appendChild(button);
    }
  };
})(window.MAY);
