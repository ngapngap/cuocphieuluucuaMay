"use strict";
(function (MAY) {
  var panel = document.getElementById("journey"),
    actions = document.getElementById("journey-actions");
  var cue = document.getElementById("journey-cue"),
    status = document.getElementById("journey-status");
  var meter = document.getElementById("journey-progress");
  var map = document.getElementById("journey-map");
  var held = new Set(),
    touchKeys = new Map();
  var width = MAY.journeyLaneWidth;
  // A geographical fork can change the obstacle, the device or the safe side downstream.
  MAY.journeyEvent = function (config, state, sectionIndex, eventIndex) {
    var e = config.sections[sectionIndex].events[eventIndex];
    if (!e || !e.afterFork) return e;
    for (var s = sectionIndex; s >= 0; s--) {
      var events = config.sections[s].events;
      for (var i = (s === sectionIndex ? eventIndex : events.length) - 1; i >= 0; i--) {
        if (events[i].kind !== "fork") continue;
        var arm = state.choices[s + "-" + i];
        return arm === 0 || arm === 1 ? Object.assign({}, e, e.afterFork[arm]) : e;
      }
    }
    return e;
  };
  var notes = ["● Đô", "▲ Mi", "◆ Son"],
    tones = [523.25, 659.25, 783.99];
  function sound(n, duration) {
    MAY.beep(tones[n], duration || 0.22, "sine", 0.1, { exact: true });
  }
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function resetInput() {
    held.clear();
    touchKeys.clear();
    MAY.player.clearKeys();
  }
  function button(text, key, fn) {
    var el = document.createElement("button");
    el.type = "button";
    el.textContent = text;
    el.dataset.key = key;
    el.onclick = fn;
    actions.appendChild(el);
    return el;
  }
  function keyboard(ev) {
    var journey = MAY.activeJourney;
    if (!journey || ev.ctrlKey || ev.metaKey || ev.altKey || ev.code === "Tab") return;
    if (
      ev.code === "Enter" &&
      document.activeElement &&
      document.activeElement.tagName === "BUTTON" &&
      panel.contains(document.activeElement)
    )
      return;
    ev.stopImmediatePropagation();
    ev.preventDefault();
    if (ev.type === "keyup") {
      held.delete(ev.code);
      return;
    }
    held.add(ev.code);
    if (!ev.repeat) journey.input(ev.code);
  }
  window.addEventListener("keydown", keyboard, true);
  window.addEventListener("keyup", keyboard, true);
  window.addEventListener("blur", function () {
    if (MAY.activeJourney) resetInput();
  });
  window.addEventListener("pagehide", function () {
    if (MAY.activeJourney) MAY.activeJourney.checkpoint();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && MAY.activeJourney) {
      resetInput();
      MAY.activeJourney.checkpoint();
    }
  });
  panel.querySelectorAll("[data-move]").forEach(function (el) {
    el.onpointerdown = function (e) {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      touchKeys.set(e.pointerId, el.dataset.move);
    };
    el.onlostpointercapture =
      el.onpointerup =
      el.onpointercancel =
        function (e) {
          touchKeys.delete(e.pointerId);
        };
  });
  ["pointerdown", "pointerup", "click", "touchstart", "touchmove", "touchend"].forEach(function (type) {
    panel.addEventListener(type, function (e) {
      e.stopPropagation();
    });
  });
  document.getElementById("journey-leave").onclick = function () {
    if (MAY.activeJourney) MAY.activeJourney.leave();
  };

  MAY.createChapterJourney = function (ctx, config) {
    var entry = new THREE.Vector3().fromArray(config.entry);
    var door = new THREE.Group();
    var frame = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.15, 8, 32),
      new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.35,
        roughness: 0.5
      })
    );
    frame.position.y = 1.75;
    door.add(frame);
    var label = MAY.makeLabel(config.title, { sx: 4.6, sy: 0.75, bg: "rgba(16,39,52,0.91)" });
    label.position.y = 4.25;
    door.add(label);
    door.position.copy(entry);
    door.visible = false;
    ctx.add(door);
    var state = ctx.story.steps.journey,
      view = null,
      saveIn = 0,
      sample = null,
      light = -1,
      litFor = 0;
    var near = false,
      flash = 0,
      beforeLand = true,
      selected = "wave",
      activeAction = false;
    var exploring = false,
      nearbyIds = "";
    var api = {
      available: false,
      entry: entry,
      config: config,
      block: block,
      frame: frameTick,
      input: input,
      leave: leave,
      checkpoint: checkpoint
    };
    ctx.chapterJourney = api;
    function section() {
      return config.sections[state.section];
    }
    function event() {
      return MAY.journeyEvent(config, state, state.section, state.event);
    }
    function initialized() {
      if (!state || typeof state !== "object") {
        state = {
          section: 0,
          event: 0,
          distance: 0,
          lateral: 0,
          choices: {},
          done: false,
          resume: false,
          note: 0,
          angle: null
        };
        ctx.story.steps.journey = state;
      }
      if (!state.choices || typeof state.choices !== "object") state.choices = {};
      state.section = clamp(Math.floor(Number(state.section) || 0), 0, config.sections.length - 1);
      state.event = clamp(Math.floor(Number(state.event) || 0), 0, section().events.length);
      state.distance = clamp(Number(state.distance) || 0, 0, section().length);
      state.lateral = clamp(Number(state.lateral) || 0, -6, 6);
      return state;
    }
    function checkpoint() {
      if (!state) return;
      if (!ctx.save.gem) ctx.save.playSecs = Math.floor(ctx.playSecs);
      MAY.persist();
      saveIn = 0;
    }
    function block() {
      if (ctx.save.gem || ctx.story.bossDown || (state && state.done)) return false;
      initialized();
      api.available = true;
      door.visible = true;
      ctx.setObjective("➜", config.title + " · " + section().name + " — đến cửa và tương tác", entry);
      return true;
    }
    api.interaction = {
      obj: door,
      label: config.title + " · vào khu vực",
      isActive: function () {
        return api.available;
      },
      onInteract: enter
    };
    ctx.interactives.push(api.interaction);
    function message(text) {
      status.textContent = text;
      flash = 2.2;
    }
    function setStage() {
      near = false;
      sample = null;
      light = -1;
      litFor = 0;
      flash = 0;
      actions.replaceChildren();
      document.getElementById("journey-chapter").textContent = ctx.meta.shortName + " · " + config.title;
      document.getElementById("journey-title").textContent = section().name;
      cue.textContent = section().brief;
      status.textContent = "Giữ ↑ hoặc W để tiến, A / D để đổi phía. Shift để chạy.";
      var field = config.clearing;
      exploring = !!(
        field &&
        field.section === state.section &&
        state.clearing &&
        state.clearing.entered &&
        !state.clearing.done
      );
      map.hidden = !exploring;
      if (exploring) {
        nearbyIds = "";
        view = MAY.makeJourneyClearing(ctx, config, state);
        document.getElementById("journey-title").textContent = field.name;
        cue.textContent = field.hint(state.clearing.values);
        status.textContent = field.brief;
        if (state.clearing.solved) showRoomExit();
      } else view = MAY.makeJourneyScene(ctx, config, state.section, state);
      meter.value = state.distance / section().length;
    }
    function enter() {
      if (MAY.activeJourney || !api.available || MAY.currentCtx !== ctx || MAY.modalOpen) return;
      initialized();
      if (state.resume) {
        // Native maps spawn Mây at the usual chapter start on reload. Restore
        // the spot where she stepped through the door before resuming inside.
        var saved = state.returnPoint;
        var valid =
          Array.isArray(saved) &&
          saved.length === 4 &&
          saved.every(Number.isFinite) &&
          Math.hypot(saved[0] - entry.x, saved[2] - entry.z) <= 14;
        var x = valid ? saved[0] : entry.x,
          z = valid ? saved[2] : entry.z + 1.4;
        var water = ctx.waterLevel !== undefined && ctx.groundH(x, z) < ctx.waterLevel - 0.85;
        var y = valid ? saved[1] : water ? entry.y : ctx.groundH(x, z) + 1.05;
        MAY.player.spawnAt(x, y, z, valid ? saved[3] : 0, water);
      }
      state.returnPoint = [MAY.player.pos.x, MAY.player.pos.y, MAY.player.pos.z, MAY.player.yaw];
      state.resume = true;
      MAY.activeJourney = api;
      beforeLand = MAY.player.onLand;
      if (document.pointerLockElement) document.exitPointerLock();
      resetInput();
      MAY.resetInteractTarget();
      MAY.modalOpen = true;
      MAY.player.onLand = ctx.meta.num !== 1;
      document.body.classList.add("in-journey");
      panel.hidden = false;
      selected = (
        MAY.SPELLS.find(function (sp) {
          return MAY.isSpellUnlocked(sp.id);
        }) || MAY.SPELLS[0]
      ).id;
      setStage();
      checkpoint();
    }
    function leave() {
      if (MAY.activeJourney !== api) return;
      state.resume = false;
      checkpoint();
      resetInput();
      sample = null;
      MAY.activeJourney = null;
      exploring = false;
      if (view) {
        view.dispose();
        view = null;
      }
      panel.hidden = true;
      actions.replaceChildren();
      document.body.classList.remove("in-journey");
      MAY.modalOpen = false;
      MAY.player.onLand = beforeLand;
      MAY.player.camPosInit = false;
      MAY.player.updateRigOnly(0.016, performance.now() / 1000, ctx);
      MAY.refreshHUD();
      if (state.done) {
        api.available = false;
        door.visible = false;
        config.onComplete();
      } else block();
    }
    api.resumeIfNeeded = function () {
      if (
        api.available &&
        state &&
        state.resume &&
        MAY.started &&
        !MAY.modalOpen &&
        !MAY.dialogueOpen &&
        (!MAY.Cutscene || !MAY.Cutscene.isPlaying())
      )
        enter();
    };
    function eventLane(e) {
      return (e.lane || 0) * width;
    }
    function closeEnough(e) {
      return e && state.distance >= e.at * section().length - 4.8;
    }
    function mark(e) {
      view.complete(state.event);
      state.event++;
      state.note = 0;
      state.angle = null;
      sample = null;
      light = -1;
      near = false;
      actions.replaceChildren();
      message(e.success);
      cue.textContent = section().landmark;
      checkpoint();
      activeAction = true;
      MAY.beep(780, 0.1, "sine", 0.05, { exact: true });
    }
    function showNote(n) {
      light = n;
      litFor = 0.28;
      sound(n, n === 2 ? 0.34 : 0.18);
      actions.querySelectorAll("[data-note]").forEach(function (b) {
        b.classList.toggle("playing", Number(b.dataset.note) === n);
      });
    }
    function playback() {
      if (!event() || event().kind !== "echo") return;
      sample = { time: 0, index: 0 };
      status.textContent = "Quan sát các nốt sáng, rồi gõ lời đáp.";
      flash = 0;
    }
    function controls(e) {
      actions.replaceChildren();
      cue.textContent = e.cue;
      status.textContent = "";
      flash = 0;
      if (e.kind === "align") {
        if (state.angle == null) state.angle = e.initial || 0;
        button("↶ Xoay gương / van", "KeyT", function () {
          input("KeyT");
        });
        button("Kiểm tra hướng", "Enter", function () {
          input("Enter");
        });
      } else if (e.kind === "echo") {
        notes.forEach(function (v, i) {
          var b = button(v, "Digit" + (i + 1), function () {
            choose(i);
          });
          b.dataset.note = i;
        });
        button("Nghe / nhìn lại", "KeyT", playback);
        playback();
      } else if (e.kind === "cast") {
        MAY.SPELLS.filter(function (sp) {
          return MAY.isSpellUnlocked(sp.id);
        }).forEach(function (sp) {
          var b = button(sp.icon + " " + sp.name, "Digit" + sp.key, function () {
            selected = sp.id;
            attemptCast();
          });
          b.title = "Phím " + sp.key + " rồi R";
          b.dataset.spell = sp.id;
        });
        status.textContent = "Chọn số rồi nhấn R, hoặc chạm phép để thi triển.";
      } else if (e.kind === "switch") {
        e.choices.forEach(function (v, i) {
          button(v, "Digit" + (i + 1), function () {
            choose(i);
          });
        });
      } else if (e.kind === "fork") {
        status.textContent = "◀ " + e.choices[0] + "　 ·　 " + e.choices[1] + " ▶";
      }
    }
    function choose(i) {
      var e = event();
      if (!near || !e) return;
      if (e.kind === "echo") {
        if (i > 2) return;
        if (sample) {
          message("Hãy nghe hoặc nhìn hết câu gọi.");
          return;
        }
        showNote(i);
        if (i !== e.pattern[state.note || 0]) {
          message("Nốt vừa rồi khác câu gọi. Giữ các nốt đúng và thử lại.");
          return;
        }
        state.note = (state.note || 0) + 1;
        activeAction = true;
        if (state.note === e.pattern.length) {
          mark(e);
          return;
        }
        message("Đã đáp " + state.note + " / " + e.pattern.length + " nốt.");
        checkpoint();
      } else if (e.kind === "switch") {
        if (i >= e.choices.length) return;
        if (i === e.answer) {
          mark(e);
          return;
        }
        message(e.wrong || "Chưa đúng. Quan sát dấu hiệu ở đây rồi thử lại.");
      }
    }
    function attemptCast() {
      var e = event();
      if (!near || !e || e.kind !== "cast") return;
      if (Math.abs(state.lateral - eventLane(e)) > 2.45) {
        message("Đến gần vật cản đang phát sáng rồi thi triển.");
        return;
      }
      if (selected !== e.spell) {
        message("Phép này chưa tác động được. " + e.cue);
        return;
      }
      if (!MAY.isSpellUnlocked(selected)) return;
      mark(e);
    }
    function input(code) {
      if (code === "Escape") {
        leave();
        return;
      }
      if (exploring) {
        if (state.clearing.solved) {
          if (code === "KeyT" || code === "Enter") finishRoom();
          return;
        }
        var index = /^Digit[1-6]$/.test(code) ? Number(code.slice(-1)) - 1 : -1;
        if (index >= 0 && MAY.isSpellUnlocked(MAY.SPELLS[index].id)) {
          selected = MAY.SPELLS[index].id;
          message(MAY.SPELLS[index].name + " · R để dùng");
        } else if (view.near.length && (code === "Enter" || code === "KeyT" || code === "KeyR"))
          operate(view.near[0].device.id, code === "KeyR" ? selected : null);
        return;
      }
      var e = event();
      if (!near || !e) return;
      var idx = /^Digit[1-6]$/.test(code) ? Number(code.slice(-1)) - 1 : -1;
      if (e.kind === "echo" || e.kind === "switch") {
        if (idx >= 0) choose(idx);
        else if (code === "KeyT" && e.kind === "echo") playback();
      } else if (e.kind === "align") {
        if (Math.abs(state.lateral - eventLane(e)) > 2.45) {
          if (code === "Enter" || code === "KeyT")
            message("Đứng cạnh gương hoặc van đang phát sáng để điều chỉnh.");
          return;
        }
        if (code === "KeyT") {
          state.angle = ((state.angle || 0) + 1) % e.slots;
          activeAction = true;
          checkpoint();
          message(
            "Hướng " +
              (state.angle + 1) +
              " / " +
              e.slots +
              (state.angle === e.answer ? " · tia đã gặp vòng sáng." : "")
          );
        } else if (code === "Enter" || code === "KeyR") {
          if (state.angle === e.answer) mark(e);
          else message("Tia còn lệch đích. Xoay thêm và nhìn đầu tia sáng.");
        }
      } else if (e.kind === "cast") {
        if (idx >= 0 && MAY.isSpellUnlocked(MAY.SPELLS[idx].id)) {
          selected = MAY.SPELLS[idx].id;
          message(MAY.SPELLS[idx].name + " · R để dùng");
        }
        if (code === "KeyR" || code === "Enter") attemptCast();
      }
    }
    function down(code) {
      if (held.has(code)) return true;
      for (var value of touchKeys.values()) if (value === code) return true;
      return false;
    }
    function operate(id, spell) {
      var result = view.act(id, spell);
      if (!result) return;
      activeAction = true;
      message(result.text);
      cue.textContent = config.clearing.hint(state.clearing.values);
      if (result.done) {
        state.clearing.solved = result.text;
        showRoomExit();
        checkpoint();
      } else {
        nearbyIds = "";
        checkpoint();
      }
    }
    function showRoomExit() {
      actions.replaceChildren();
      cue.textContent = state.clearing.solved;
      status.textContent = "Quan sát kết quả hoặc nhấn T để đi tiếp.";
      button("Đi tiếp", "KeyT", finishRoom);
    }
    function finishRoom() {
      state.clearing.done = true;
      view.dispose();
      view = null;
      exploring = false;
      nextSection();
    }
    function nextSection() {
      if (state.section + 1 === config.sections.length) {
        state.done = true;
        leave();
        return;
      }
      state.section++;
      state.distance = 0;
      state.lateral = 0;
      state.event = 0;
      state.note = 0;
      state.angle = null;
      setStage();
      checkpoint();
    }
    function clockActivity(dt, active) {
      if (active || activeAction) {
        ctx.playSecs += dt;
        saveIn += dt;
        activeAction = false;
        if (saveIn >= 5) checkpoint();
      }
    }
    function exploreFrame(dt, t) {
      var dx = Number(down("KeyD") || down("ArrowRight")) - Number(down("KeyA") || down("ArrowLeft"));
      var dz = Number(down("KeyS") || down("ArrowDown")) - Number(down("KeyW") || down("ArrowUp"));
      clockActivity(dt, view.draw(dt, t, dx, dz));
      if (state.clearing.solved) return;
      var ids = view.near
        .map(function (site) {
          return site.device.id;
        })
        .join(",");
      if (ids !== nearbyIds) {
        nearbyIds = ids;
        actions.replaceChildren();
        view.near.forEach(function (site) {
          var d = site.device;
          if (d.spell) {
            MAY.SPELLS.filter(function (sp) {
              return MAY.isSpellUnlocked(sp.id);
            }).forEach(function (sp) {
              var b = button(sp.icon + " " + d.name, "Digit" + sp.key, function () {
                operate(d.id, sp.id);
              });
              b.title = sp.name + " · " + d.name;
              b.setAttribute("aria-label", b.title);
            });
          } else
            button(d.name, "KeyT", function () {
              operate(d.id, null);
            });
        });
      }
      if (flash > 0) flash = Math.max(0, flash - dt);
      else
        status.textContent = view.near.length
          ? view.near[0].device.spell
            ? "Phím số chọn phép, R để dùng."
            : "T hoặc chạm tên để tương tác."
          : "W A S D / phím mũi tên để đi tự do.";
    }
    function frameTick(dt, t) {
      if (document.hidden) return;
      if (exploring) {
        exploreFrame(dt, t);
        return;
      }
      var s = section(),
        e = event(),
        old = state.distance,
        oldSide = state.lateral;
      var left = down("KeyA") || down("ArrowLeft"),
        right = down("KeyD") || down("ArrowRight");
      var forward = down("KeyW") || down("ArrowUp"),
        back = down("KeyS") || down("ArrowDown");
      var speed = down("ShiftLeft") || down("ShiftRight") || touchKeys.size ? 8 : 6.1;
      state.lateral = clamp(state.lateral + (Number(right) - Number(left)) * 7 * dt, -6, 6);
      var floor = state.event ? s.events[state.event - 1].at * s.length : 0;
      var limit = e ? e.at * s.length : s.length;
      state.distance = clamp(old + (Number(forward) - Number(back)) * speed * dt, floor, limit);
      if (e && closeEnough(e) && !near) {
        near = true;
        controls(e);
      }
      if (e && near && !closeEnough(e)) {
        near = false;
        actions.replaceChildren();
        sample = null;
        status.textContent = "";
      }
      if (e && !near && state.distance > 5 && !flash) {
        cue.textContent = e.cue;
        status.textContent =
          e.kind === "fork" ? "◀ " + e.choices[0] + "　 ·　 " + e.choices[1] + " ▶" : "";
      }
      if (e && near && forward && state.distance >= limit - 0.08) {
        var lane = eventLane(e);
        if (e.kind === "fork" && Math.abs(state.lateral) >= 2.15) {
          state.choices[state.section + "-" + state.event] = state.lateral < 0 ? 0 : 1;
          mark(e);
        } else if (
          (e.kind === "pass" || e.kind === "escort") &&
          Math.abs(state.lateral - lane) < 1.85 &&
          (e.kind !== "escort" || Math.abs(view.partyLane() - lane) < 1.9)
        )
          mark(e);
        else if ((e.kind === "pass" || e.kind === "escort") && !flash)
          status.textContent =
            e.kind === "escort" ? "Đi sát bạn qua vòng sáng." : "Tìm khe có vòng sáng và đổi phía.";
      }
      if (sample && e && e.kind === "echo") {
        sample.time -= dt;
        if (sample.time <= 0) {
          if (sample.index < e.pattern.length) {
            var n = e.pattern[sample.index++];
            showNote(n);
            sample.time = n === 2 ? 0.53 : 0.38;
          } else {
            sample = null;
            status.textContent = "Đến lượt Mây. " + notes.join(" · ");
            flash = 0;
          }
        }
      }
      if (litFor > 0 && (litFor -= dt) <= 0) {
        light = -1;
        actions.querySelectorAll(".playing").forEach(function (b) {
          b.classList.remove("playing");
        });
      }
      var moved = old !== state.distance || oldSide !== state.lateral;
      // The chapter clock counts input that moves Mây or operates a device; resting adds no time.
      clockActivity(dt, moved);
      if (flash > 0) flash = Math.max(0, flash - dt);
      meter.value = state.distance / s.length;
      view.draw(dt, t, moved, state.angle == null ? (e && e.initial) || 0 : state.angle, light);
      if (state.distance >= s.length && !event()) {
        view.dispose();
        view = null;
        if (config.clearing && config.clearing.section === state.section && !state.clearing?.done) {
          state.clearing = { entered: true, done: false, values: {}, x: 0, z: 9 };
          setStage();
          checkpoint();
        } else nextSection();
      }
    }
    return api;
  };
})(window.MAY);
