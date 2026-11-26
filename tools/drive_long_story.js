/* Known-solution player. Only reads the world; movement, spells and switches use the UI. */
(function () {
  var held = new Set(),
    journeyWasOpen = false,
    lastGem = false,
    wrong = new Set();
  function dispatch(code, down) {
    window.dispatchEvent(
      new KeyboardEvent(down ? "keydown" : "keyup", {
        code: code,
        key: code.replace("Key", "").toLowerCase(),
        bubbles: true,
        cancelable: true
      })
    );
  }
  function tap(code) {
    dispatch(code, true);
    dispatch(code, false);
  }
  function hold(keys) {
    held.forEach(function (code) {
      if (!keys.includes(code)) dispatch(code, false);
    });
    keys.forEach(function (code) {
      if (!held.has(code)) dispatch(code, true);
    });
    held = new Set(keys);
  }
  function go(target, options) {
    var p = MAY.player.pos,
      yaw = MAY.player.yaw,
      dx = target.x - p.x,
      dz = target.z - p.z,
      dy = target.y - p.y;
    var forward = -dx * Math.sin(yaw) - dz * Math.cos(yaw),
      side = dx * Math.cos(yaw) - dz * Math.sin(yaw),
      distance = Math.hypot(dx, dz);
    var keys = [];
    if (distance > options.range) {
      keys.push("ShiftLeft");
      if (Math.abs(forward) > Math.abs(side) * 0.42) keys.push(forward > 0 ? "KeyW" : "KeyS");
      if (Math.abs(side) > Math.abs(forward) * 0.42) keys.push(side > 0 ? "KeyD" : "KeyA");
      if (!options.underwater && dy > 0.75) keys.push("Space");
    }
    if (options.underwater && Math.abs(dy) > 0.65) keys.push(dy > 0 ? "Space" : "KeyC");
    hold(keys);
    return options.underwater ? Math.hypot(distance, dy) : distance;
  }
  function cast(id) {
    var spell = MAY.SPELLS.find(function (sp) {
      return sp.id === id;
    });
    if (spell) {
      tap("Digit" + spell.key);
      tap("KeyR");
    }
  }
  var nav = { go: go, hold: hold, tap: tap, cast: cast };
  function inside(c) {
    var j = c.chapterJourney,
      st = c.story.steps.journey,
      section = j.config.sections[st.section],
      e = MAY.journeyEvent(j.config, st, st.section, st.event);
    if (st.clearing?.entered && !st.clearing.done) {
      if (st.clearing.solved) {
        hold([]);
        tap("KeyT");
        return;
      }
      var room = st.clearing,
        field = j.config.clearing,
        id = window["routeClearing" + c.meta.num](room.values);
      var device = field.devices.find(function (d) {
        return d.id === id;
      });
      if (!device) throw Error("Missing clearing device " + id);
      var dx = device.x - room.x,
        dz = device.z - room.z,
        walk = [];
      if (Math.hypot(dx, dz) > 1.1) {
        if (Math.abs(dx) > 0.45) walk.push(dx > 0 ? "KeyD" : "KeyA");
        if (Math.abs(dz) > 0.45) walk.push(dz > 0 ? "KeyS" : "KeyW");
        hold(walk);
      } else {
        hold([]);
        if (device.spell) cast(device.spell);
        else tap("KeyT");
      }
      return;
    }
    var side = e ? (e.kind === "fork" ? 1 : e.lane || 0) : 0;
    // Follow the wind signal after the first flash, then return to cast again.
    if (c.id === "level6" && st.beaconWind === "seek") side = 1;
    var delta = side * MAY.journeyLaneWidth - st.lateral,
      keys = ["ShiftLeft", "KeyW"];
    if (Math.abs(delta) > 0.25) keys.push(delta > 0 ? "KeyD" : "KeyA");
    hold(keys);
    if (!e || st.distance < e.at * section.length - 4.7) return;
    var marker = c.id + "/" + st.section + "/" + st.event;
    if (e.kind === "align") {
      if (st.angle !== e.answer) tap("KeyT");
      else tap("Enter");
    } else if (e.kind === "cast") {
      cast(e.spell);
    } else if (e.kind === "switch") {
      if (!wrong.has(marker)) {
        tap("Digit" + (1 + ((e.answer + 1) % e.choices.length)));
        wrong.add(marker);
      }
      tap("Digit" + (e.answer + 1));
    } else if (e.kind === "echo") {
      var note = e.pattern[st.note || 0];
      if (note !== undefined) tap("Digit" + (note + 1));
    }
  }
  var api = { chapter: 0, failure: null, wrong: wrong, hold: hold };
  function step() {
    try {
      var c = MAY.currentCtx;
      if (api.chapter && c && c.meta.num === api.chapter) {
        if (c.save.gem) {
          if (!lastGem) {
            hold([]);
            lastGem = true;
          }
        } else if (MAY.activeJourney) {
          if (!journeyWasOpen) held.clear();
          journeyWasOpen = true;
          inside(c);
        } else {
          if (journeyWasOpen) {
            hold([]);
            journeyWasOpen = false;
          }
          lastGem = false;
          if (MAY.dialogueOpen || MAY.Cutscene.isPlaying()) {
            hold([]);
            tap("Escape");
          } else if (c.chapterJourney && c.chapterJourney.available) {
            var entry = c.chapterJourney.entry;
            if (go(entry, { range: 2, underwater: c.meta.num === 1 }) < 4.3) tap("KeyT");
          } else window["routeNative" + api.chapter](c, nav);
        }
      }
    } catch (err) {
      api.failure = String(err.stack || err);
      hold([]);
      return;
    }
  }
  api.step = step;
  function tick() {
    step();
    if (api.failure) return;
    requestAnimationFrame(tick);
  }
  window.storyDriver = api;
  requestAnimationFrame(tick);
})();
