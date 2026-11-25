(function () {
  function distance(p, q) {
    return Math.hypot(p.x - q.x, p.z - q.z);
  }
  function act(c, nav, cloud) {
    var s = c.story,
      p = MAY.player.pos,
      target,
      spell,
      range;
    if (c.save.gem) {
      nav.hold([]);
      return;
    }
    if (s.stage === 0 || (s.stage < 2 && s.steps.iceWallBroken) || s.bossDown) {
      target = c.questNPCs[0].pos;
      range = 2.5;
      nav.go(target, { range: range });
      if (distance(p, target) < 4) nav.tap("KeyT");
      return;
    }
    if (cloud && s.stage === 1) {
      nav.go(c.storyObjective.targetPos, { range: 3 });
      return;
    }
    var task = c.skillTargets.find(function (x) {
      return !x.done && x.isActive();
    });
    if (task) {
      target = task.pos;
      spell = task.reqSpell;
      nav.go(target, { range: 5 });
      if (distance(p, target) < 8) nav.cast(spell);
      return;
    }
    if (cloud && s.stage === 2 && s.steps.beaconLit && !s.steps.beaconTrialDone) {
      nav.go(c.storyObjective.targetPos, { range: 1.5 });
      return;
    }
    target = c.boss.pos;
    spell = cloud
      ? c.boss.hp === 3
        ? "tornado"
        : c.boss.hp === 2
          ? "solar"
          : c.boss.subState.vined
            ? "tornado"
            : "growth"
      : c.boss.subState.dizzy
        ? "solar"
        : "frost";
    nav.go(target, { range: 8 });
    if (distance(p, target) < 8) nav.cast(spell);
  }
  window.routeNative5 = function (c, nav) {
    act(c, nav, false);
  };
  window.routeNative6 = function (c, nav) {
    act(c, nav, true);
  };
  window.routeClearing5 = function (v) {
    return !v.pup1 ? "pup1" : !v.pup2 ? "pup2" : !v.bridge ? "bridge" : "home";
  };
  window.routeClearing6 = function (v) {
    return !v.bubi ? "bubi" : !v.rabbit ? "rabbit" : !v.owl ? "owl" : !v.bell ? "bell" : "lamp";
  };
})();
