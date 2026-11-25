(function () {
  "use strict";
  var lastAction = 0;
  function action(fn, delay) {
    if (performance.now() - lastAction < (delay || 450)) return;
    lastAction = performance.now();
    fn();
  }
  function talk(c, nav) {
    var target = c.questNPCs[0].pos;
    if (nav.go(target, { range: 2.5 }) < 2.5)
      action(function () {
        nav.tap("KeyT");
      }, 700);
  }
  function fight(c, nav, spell) {
    if (!c.boss || !c.boss.active) {
      nav.hold([]);
      return;
    }
    if (nav.go(c.boss.pos, { range: 7 }) < 7)
      action(function () {
        nav.cast(spell);
      }, 650);
  }
  window.routeNative3 = function (c, nav) {
    var s = c.story;
    if (s.stage === 0 || (s.steps.oasisRevived && s.stage < 2) || s.bossDown) {
      talk(c, nav);
      return;
    }
    var task = c.skillTargets.find(function (x) {
      return !x.done && x.isActive();
    });
    if (!task) {
      fight(c, nav, "solar");
      return;
    }
    var mirror = /^l3_mir_(\d)$/.exec(task.id);
    if (mirror) {
      var i = Number(mirror[1]),
        aim = Number(s.steps["mirrorAim" + i]) || 0;
      if (nav.go(task.pos, { range: 2.5 }) < 2.5) {
        if (aim !== [1, 3, 6][i]) {
          var dx = task.pos.x - MAY.player.pos.x,
            dz = task.pos.z - MAY.player.pos.z;
          var a = Math.atan2(-dx, -dz) - MAY.player.yaw;
          a = Math.atan2(Math.sin(a), Math.cos(a));
          if (Math.abs(a) > 0.15) {
            nav.hold([a > 0 ? "KeyQ" : "KeyE"]);
            return;
          }
          nav.hold([]);
          action(function () {
            nav.tap("KeyT");
          }, 450);
        } else
          action(function () {
            nav.cast("solar");
          }, 650);
      }
    } else if (nav.go(task.pos, { range: 5 }) < 5)
      action(function () {
        nav.cast(task.reqSpell);
      }, 650);
  };
  window.routeNative4 = function (c, nav) {
    var s = c.story;
    if (s.stage === 0 || (s.steps.torch0 && s.steps.torch1 && s.stage < 2) || s.bossDown) {
      talk(c, nav);
      return;
    }
    if (s.stage >= 2 && s.steps.wallBroken && !s.steps.echoDone) {
      nav.hold([]);
      var i = (s.steps.echoRound === 1 ? [2, 0, 1] : [0, 1, 2])[s.steps.echoProgress || 0];
      var button = document.querySelectorAll("#crystal-music [data-note]")[i];
      if (button)
        action(function () {
          button.click();
        }, 700);
      return;
    }
    var task = c.skillTargets.find(function (x) {
      return !x.done && x.isActive();
    });
    if (task) {
      if (nav.go(task.pos, { range: 5 }) < 5)
        action(function () {
          nav.cast(task.reqSpell);
        }, 650);
    } else fight(c, nav, c.boss && c.boss.subState.armorBroken ? "solar" : "crystal");
  };
})();

window.routeClearing3 = function (v) {
  return !v.first ? "first" : "relay";
};
window.routeClearing4 = function (v) {
  return !v.bank ? "left" : v.crossSignal && v.note===1 && !v.shift ? "right" : (v.note || 0) < 2 ? "short" : "long";
};
