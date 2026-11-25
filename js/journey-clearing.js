"use strict";
(function (MAY) {
  // A walkable room inside the chapter. Each chapter owns its puzzle, art direction and rules.
  MAY.makeJourneyClearing = function (ctx, config, state) {
    var field = config.clearing,
      room = state.clearing,
      values = room.values;
    var ground = config.sections[state.section].ground,
      sky = config.sections[state.section].sky;
    var scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(54, 1, 0.2, 170);
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.FogExp2(sky, 0.012);
    scene.add(new THREE.HemisphereLight(0xfff6e7, ground, 0.8));
    var sun = new THREE.DirectionalLight(0xffe5bd, 0.95);
    sun.position.set(-12, 24, 8);
    scene.add(sun);
    var box = new THREE.BoxGeometry(1, 1, 1),
      round = new THREE.SphereGeometry(1, 12, 8);
    var log = new THREE.CylinderGeometry(0.8, 1, 1, 9),
      crystal = new THREE.ConeGeometry(1, 1, 6);
    var torus = new THREE.TorusGeometry(1, 0.13, 8, 20),
      rock = new THREE.IcosahedronGeometry(1, 0);
    var materials = new Map();
    function part(parent, geo, color, x, y, z, w, h, d, emissive) {
      var key = color + "/" + !!emissive;
      if (!materials.has(key))
        materials.set(
          key,
          new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.77,
            emissive: emissive ? color : 0,
            emissiveIntensity: 0.35
          })
        );
      var m = new THREE.Mesh(geo, materials.get(key));
      m.position.set(x, y, z);
      m.scale.set(w, h, d);
      parent.add(m);
      return m;
    }
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 94),
      MAY.journeyFloorMaterial(ctx.meta.num, { color: ground, roughness: 0.82 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.09, -10);
    scene.add(floor);
    var border = config.sections[state.section].path;
    for (var k = 0; k < 36; k++) {
      var angle = (k * Math.PI) / 18,
        offset = 1.3 * Math.sin(k * 21.3);
      var x = (27 + offset) * Math.sin(angle),
        z = -12 + (25.5 + offset) * Math.cos(angle);
      if (ctx.meta.num === 3 || ctx.meta.num === 6) {
        part(scene, log, border, x, 1.7, z, 1, 3.6 + offset, 1);
        part(scene, box, ground, x, 3.7 + offset * 0.5, z, 2.3, 0.5, 2.3);
      } else if (ctx.meta.num === 2) {
        part(scene, log, 0x775b42, x, 3.3, z, 1, 7, 1);
        part(scene, rock, 0x608a62, x + 1, 6.7, z, 3.8, 2.8, 3.7);
      } else {
        part(scene, rock, ground, x, 1.0, z, 2.8, 2.4 + offset, 2.9);
        part(scene, ctx.meta.num === 4 ? crystal : rock, border, x + 1, 1.8, z, 1.7, 2.8, 2);
      }
    }
    var devices = new Map(),
      nearest = [],
      links = new THREE.Group(),
      phrase = null;
    scene.add(links);
    function animal(form) {
      var kinds = { fish: "clownfish", wolf: "wolf", bubi: "dolphin", rabbit: "forestrabbit", owl: "owl" };
      return kinds[form] ? MAY.makeAnimal(kinds[form]) : null;
    }
    function buildDevice(d) {
      var root = new THREE.Group(),
        top = new THREE.Group();
      root.add(top);
      var buddy = animal(d.form),
        color = d.color || config.color;
      if (buddy) {
        top.add(buddy);
        if (buddy.userData.playClip)
          buddy.userData.playClip(d.form === "fish" || d.form === "bubi" ? "swim" : "idle");
      } else if (d.form === "mirror" || d.form === "window") {
        part(top, log, 0x946e45, 0, 0.7, 0, 0.65, 1.4, 0.65);
        part(top, box, 0xffc76d, 0, 1.9, 0, 1.95, 1.75, 0.28);
        part(top, box, 0x68ccdd, 0, 1.95, 0.18, 1.65, 1.45, 0.12, true);
      } else if (d.form === "tower" || d.form === "lamp" || d.form === "bell") {
        part(top, log, 0x9c7659, 0, 1.4, 0, 1.1, 2.9, 1.1);
        part(top, d.form === "bell" ? log : round, color, 0, 3.25, 0, 0.9, 1.05, 0.9, true);
        part(top, crystal, 0x736286, 0, 4.2, 0, 1.35, 1.1, 1.35);
      } else if (d.form === "valve") {
        part(top, log, 0x786f60, 0, 0.7, 0, 1, 1.4, 1);
        part(top, torus, color, 0, 1.65, 0, 1.1, 1.1, 1, true);
        part(top, box, color, 0, 1.65, 0, 2.1, 0.17, 0.2);
      } else if (d.form === "tree" || d.form === "flower" || d.form === "reef") {
        part(top, log, 0x796344, 0, 1, 0, 0.64, 2.2, 0.64);
        for (var i = 0; i < 5; i++) {
          var a = (i * Math.PI * 2) / 5;
          part(
            top,
            round,
            color,
            Math.sin(a) * 0.89,
            1.9 + 0.2 * Math.cos(a),
            Math.cos(a) * 0.89,
            0.78,
            0.54,
            0.8
          );
        }
      } else if (d.form === "net" || d.form === "bridge") {
        for (var j = -2; j <= 2; j++) {
          part(top, box, color, j * 0.52, 0.8, 0, 0.13, 1.5, 2.8);
          part(top, box, color, 0, 0.75, j * 0.55, 2.8, 0.18, 0.17);
        }
      } else if (d.form === "shelter" || d.form === "den") {
        part(top, box, 0x815d4b, -1.2, 1, 0, 0.48, 2, 2.9);
        part(top, box, 0x815d4b, 1.2, 1, 0, 0.48, 2, 2.9);
        part(top, crystal, color, 0, 2.7, 0, 2.4, 1.9, 2.4);
      } else {
        part(top, d.form === "shell" ? round : crystal, color, 0, 1, 0, 1.1, 2.1, 0.9, true);
      }
      var ring = part(root, torus, color, 0, 0.04, 0, 1.65, 1.65, 1, true);
      ring.rotation.x = -Math.PI / 2;
      var label = MAY.makeLabel(d.name, { sx: 3.6, sy: 0.65, bg: "rgba(20,37,52,.88)" });
      label.position.y = 3.1;
      root.add(label);
      root.position.set(d.x, 0, d.z);
      scene.add(root);
      devices.set(d.id, {
        definition: d,
        root: root,
        top: top,
        ring: ring,
        buddy: buddy,
        label: label,
        following: false
      });
    }
    field.devices.forEach(buildDevice);
    function refresh() {
      var follow = field.followers ? field.followers(values) : [];
      devices.forEach(function (m, id) {
        var appearance = field.look ? field.look(id, values) || {} : {};
        m.following = follow.includes(id);
        m.root.visible = !appearance.hide;
        if (!m.following)
          m.root.position.set(appearance.x ?? m.definition.x, 0, appearance.z ?? m.definition.z);
        m.top.rotation.y = appearance.angle || 0;
        m.ring.visible = !m.following;
        m.top.scale.setScalar(appearance.lit ? 1.16 : 1);
        m.ring.material = materials.get((m.definition.color || config.color) + "/true");
        m.ring.scale.setScalar(appearance.lit ? 2.1 : 1.6);
      });
      while (links.children.length) {
        var line = links.children.pop();
        line.geometry.dispose();
        line.material.dispose();
      }
      (field.links ? field.links(values) : []).forEach(function (link) {
        var a = devices.get(link[0]),
          b = devices.get(link[1]);
        if (!a || !b) return;
        var from = a.root.position.clone(),
          to = b.root.position.clone();
        var elevated = ctx.meta.num === 3;
        from.y = to.y = elevated ? 1.95 : 0.12;
        var delta = to.clone().sub(from);
        var beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.13, delta.length(), 7),
          new THREE.MeshBasicMaterial({ color: link[2] || config.color })
        );
        beam.position.copy(from).lerp(to, 0.5);
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
        links.add(beam);
      });
    }
    refresh();
    scene.add(MAY.diver);
    var body = new THREE.Vector3(),
      eye = new THREE.Vector3(),
      focus = new THREE.Vector3(),
      facing = 0;
    var map = document.getElementById("journey-map"),
      ink = map.getContext("2d"),
      mapIn = 0;
    function drawMap() {
      ink.clearRect(0, 0, map.width, map.height);
      function dot(x, z, color, r) {
        ink.fillStyle = color;
        ink.beginPath();
        ink.arc(84 + x * 2.95, 116 + z * 2.85, r, 0, Math.PI * 2);
        ink.fill();
        ink.strokeStyle = "#172c3d";
        ink.lineWidth = 2;
        ink.stroke();
      }
      devices.forEach(function (m) {
        if (m.root.visible)
          dot(
            m.root.position.x,
            m.root.position.z,
            "#" + (m.definition.color || config.color).toString(16).padStart(6, "0"),
            5
          );
      });
      dot(room.x, room.z, "#ffffff", 7);
      dot(room.x, room.z, "#db527a", 3);
    }
    function draw(dt, t, dx, dz) {
      if (phrase) {
        phrase.time -= dt;
        if (phrase.time <= 0) {
          var lamp = devices.get(phrase.id).ring;
          if (phrase.lit) {
            lamp.scale.setScalar(1.6);
            phrase.lit = false;
            phrase.time = 0.15;
          } else if (phrase.index < phrase.notes.length) {
            var note = phrase.notes[phrase.index++];
            phrase.time = note === 2 ? 0.47 : 0.21;
            phrase.lit = true;
            lamp.scale.setScalar(note === 2 ? 3.2 : 2.4);
            MAY.beep(note === 2 ? 784 : 523, phrase.time, "sine", 0.09, { exact: true });
          } else phrase = null;
        }
      }
      var mag = Math.hypot(dx, dz),
        previousX = room.x,
        previousZ = room.z;
      if (mag) {
        room.x = Math.max(-24, Math.min(24, room.x + (dx / mag) * 8 * dt));
        room.z = Math.max(-35, Math.min(11, room.z + (dz / mag) * 8 * dt));
        facing = Math.atan2(-dx, -dz);
      }
      var moving = room.x !== previousX || room.z !== previousZ;
      MAY.player.updateRigOnly(
        dt,
        t,
        null,
        ctx.meta.num === 1 ? (moving ? "Swim_Move" : "Swim_Idle") : moving ? "Run" : "Idle"
      );
      body.set(room.x, ctx.meta.num === 1 ? 1.7 : 1, room.z);
      MAY.diver.position.copy(body);
      MAY.diver.rotation.y = facing;
      nearest.length = 0;
      var followerIndex = 0;
      devices.forEach(function (m) {
        if (!m.root.visible) return;
        if (m.following) {
          var offset = (followerIndex++ % 2 === 0 ? 1 : -1) * 1.2;
          var tx = room.x + Math.sin(facing) * 1.5 + offset,
            tz = room.z + Math.cos(facing) * 1.8;
          var mx = tx - m.root.position.x,
            mz = tz - m.root.position.z,
            dist = Math.hypot(mx, mz);
          var step = Math.min(8.7 * dt, dist);
          if (dist > 0.12) {
            m.root.position.x += (step * mx) / dist;
            m.root.position.z += (step * mz) / dist;
            m.top.rotation.y = Math.atan2(mx, mz);
          }
        }
        if (m.buddy && m.buddy.userData.mixer) m.buddy.userData.mixer.update(dt);
        var range = Math.hypot(m.root.position.x - room.x, m.root.position.z - room.z);
        m.label.visible = range < 16 && !m.following;
        if (range <= 3.3 && !m.following) nearest.push({ device: m.definition, range: range });
      });
      nearest.sort(function (a, b) {
        return a.range - b.range;
      });
      mapIn -= dt;
      if (mapIn <= 0) {
        drawMap();
        mapIn = 0.12;
      }
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      eye.set(room.x, room.y || 11.8, room.z + (camera.aspect < 0.8 ? 10.8 : 8.8));
      focus.set(room.x, 0.6, room.z - 3.3);
      camera.position.copy(eye);
      camera.lookAt(focus);
      MAY.drawJourneyScene(scene, camera);
      return moving;
    }
    function act(id, spell) {
      if (
        !nearest.some(function (v) {
          return v.device.id === id;
        })
      )
        return null;
      var device = devices.get(id).definition;
      if (device.spell && spell !== device.spell)
        return { text: "Quan sát vật này rồi chọn phép thích hợp." };
      if (
        Array.from(devices.values()).some(function (m) {
          return m.following && Math.hypot(m.root.position.x - room.x, m.root.position.z - room.z) > 4.5;
        })
      )
        return { text: "Bạn đồng hành còn ở phía sau. Hãy đón bạn vào gần." };
      var result = field.action(id, values);
      refresh();
      if (device.pattern) phrase = { id: id, notes: device.pattern, time: 0, index: 0, lit: false };
      else if (id === "short" || id === "long")
        MAY.beep(id === "short" ? 523 : 784, id === "short" ? 0.16 : 0.52, "sine", 0.09, { exact: true });
      else MAY.beep(result.done ? 880 : 659, 0.16, "sine", 0.07);
      return result;
    }
    return {
      draw: draw,
      near: nearest,
      act: act,
      dispose: function () {
        MAY.scene.add(MAY.diver);
        MAY.disposeSceneBranch(scene);
        [box, round, log, crystal, torus, rock].forEach(function (g) {
          g.dispose();
        });
      }
    };
  };
})(window.MAY);
