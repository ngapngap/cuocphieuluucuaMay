/* Keyboard-only native story routes for issues #20 and #21.
 * The journey driver owns the expedition once available; this module handles
 * the existing world and never changes story state or player position. */
(function () {
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function travel(nav, target, range, underwater) {
    nav.go(target, { range: range, underwater: !!underwater });
  }
  function npc(c, nav, underwater) {
    var target = c.questNPCs[0].pos;
    travel(nav, target, 2.2, underwater);
    if (distance(MAY.player.pos, target) < 4 && (!underwater || Math.abs(MAY.player.pos.y - target.y) < 3))
      nav.tap("KeyT");
  }
  function activeTarget(c) {
    return c.skillTargets.find(function (t) {
      return !t.done && t.isActive();
    });
  }
  window.routeNative1 = function (c, nav) {
    var s = c.story,
      p = MAY.player.pos;
    if (s.stage === 0) {
      npc(c, nav, true);
      return;
    }
    if (s.bossDown) {
      npc(c, nav, true);
      return;
    }
    var task = activeTarget(c);
    if (task) {
      var range = task.id.indexOf("l1_current_") === 0 ? 2.2 : 4;
      travel(nav, task.pos, range, true);
      if (p.distanceTo(task.pos) < task.radius * 0.82) nav.cast("wave");
      return;
    }
    if (c.oceanRescueGoal) {
      travel(nav, c.oceanRescueGoal, 2.2, true);
      return;
    }
    var reflection = { x: -27, y: 5, z: 15 };
    travel(nav, reflection, 4, true);
    if (
      c.bossOrbs &&
      c.bossOrbs.some(function (orb) {
        return !orb.reflected && p.distanceTo(orb.mesh.position) < 9;
      })
    )
      nav.cast("wave");
  };
  window.routeNative2 = function (c, nav) {
    var s = c.story,
      p = MAY.player.pos;
    if (s.stage === 0 || (s.steps.mudClear && s.stage < 2) || s.bossDown) {
      npc(c, nav, false);
      return;
    }
    var task = activeTarget(c);
    if (task) {
      travel(nav, task.pos, 5, false);
      var spell = task.id === "l2_root_trial" ? (s.steps.rootTrialWet ? "growth" : "wave") : task.reqSpell;
      if (Array.isArray(spell)) spell = spell[0];
      if (distance(p, task.pos) < Math.min(task.radius * 0.82, 8)) nav.cast(spell);
      return;
    }
    if (c.boss && c.boss.active) {
      travel(nav, c.boss.pos, 8, false);
      if (distance(p, c.boss.pos) < 8) nav.cast(c.boss.subState.wet ? "growth" : "wave");
    } else nav.hold([]);
  };
  window.routeClearing1 = function (v) {
    return !v.free ? "net" : !v.safe ? "reef" : "shell";
  };
  window.routeClearing2 = function (v) {
    if (!v.source) return "source";
    if (!v.valve) return "valve";
    if (!v.tree) return "tree";
    if (!v.flower) return "flower";
    return (v.notes || 0) < 2 ? "short" : "long";
  };
})();
