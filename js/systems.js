"use strict";
/* ============================================================================
   SYSTEMS — Nhà máy thú 3D, World Context dùng chung cho 6 màn, HUD, Bản đồ & Sổ tay
   ============================================================================ */
(function (MAY) {

  MAY.modalOpen = false;
  MAY.started = false;
  MAY.currentCtx = null;
  MAY.currentLevelId = "hub";

  /* ---- Toast & HUD ---- */
  var toastTimer = null;
  MAY.toast = function (msg, say) {
    var t = document.getElementById("toast");
    if (t) {
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3000);
    }
    if (say) MAY.speak(say);
  };

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  MAY.refreshHUD = function () {
    var ctx = MAY.currentCtx;
    var meta = MAY.getMeta(ctx ? ctx.id : MAY.currentLevelId);
    var ls = MAY.getLevelSave(meta.id);

    setText("obj-sub", meta.title.toUpperCase());
    if (ls.gem && ctx && ctx.storyObjective && !ctx.storyObjective.targetPos) {
      setText("obj-icon", meta.gemIcon);
      setText("obj-word", ls.sideQuest.done ? "Chơi lại cùng bạn trong Sổ tay (J)" : MAY.SIDE_QUESTS[meta.id].title);
    } else if (ctx && ctx.storyObjective) {
      setText("obj-icon", ctx.storyObjective.icon || "✨");
      setText("obj-word", ctx.storyObjective.text);
    } else {
      setText("obj-icon", meta.collectIcon);
      setText("obj-word", meta.id === "hub" ? "NHẶT QUẢ DỪA" : "TÌM " + meta.collectName.toUpperCase());
    }
    setText("star-n", ls.items.length);
    setText("star-max", meta.collectTarget);
    setText("star-n2", ls.items.length);
    setText("big-icon", meta.collectIcon);
    setText("big-label", meta.collectName.toUpperCase());
    var subEl = document.getElementById("obj-substep");
    if (subEl) {
      if (ctx && ctx.sideQuestStatus) {
        subEl.textContent = ctx.sideQuestStatus.text;
        subEl.classList.toggle("sq-done", !!ctx.sideQuestStatus.done);
      } else {
        subEl.textContent = meta.collectIcon + " Sưu tầm " + meta.collectName + ": " + ls.items.length + "/" + meta.collectTarget;
        subEl.classList.remove("sq-done");
      }
    }
    var pillCol = document.getElementById("pill-col");
    if (pillCol) {
      setText("col-icon", meta.collectIcon);
      setText("col-n", ls.items.length);
      setText("col-max", meta.collectTarget);
    }
    if (MAY.syncHeartsHUD) MAY.syncHeartsHUD(false);

    setText("gem-n", MAY.save.gems.length);
    setText("fr-n", ls.friends.length);
    setText("fr-max", meta.friendTarget);

    var pillTr = document.getElementById("pill-tr");
    if (pillTr) {
      pillTr.style.display = meta.treasureTarget > 0 ? "inline-block" : "none";
      setText("tr-n", ls.treasures.length);
      setText("tr-max", meta.treasureTarget);
    }
    var pillSh = document.getElementById("pill-sh");
    if (pillSh) {
      pillSh.style.display = meta.souvenirTarget > 0 ? "inline-block" : "none";
      setText("sh-icon", meta.souvenirIcon);
      setText("sh-n", ls.souvenirs.length);
      setText("sh-max", meta.souvenirTarget);
    }
    var pillCo = document.getElementById("pill-co");
    if (pillCo) {
      pillCo.style.display = meta.interactTarget > 0 ? "inline-block" : "none";
      setText("co-icon", meta.interactIcon);
      setText("co-n", ls.interacts.length);
      setText("co-max", meta.interactTarget);
    }
    var pillCh = document.getElementById("pill-ch");
    if (pillCh) {
      var doneCh = MAY.badgeCount(ls);
      pillCh.style.display = meta.id === "hub" ? "none" : "inline-block";
      setText("ch-n", doneCh);
    }
    setText("zone-pill", meta.icon + " " + meta.shortName);
    setText("diver-role", MAY.player.onLand ? "MÂY KHÁM PHÁ" : "MÂY ĐANG LẶN");
  };

  /* ---- Raycast tương tác ---- */
  var raycaster = new THREE.Raycaster();
  var rayCenter = new THREE.Vector2(0, 0);
  var currentTarget = null;
  var interactEl = document.getElementById("interact");
  var rayTimer = 0;

  function findInteractive(o, list) {
    while (o) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].obj === o) return list[i];
      }
      o = o.parent;
    }
    return null;
  }

  function isInteractiveActive(it) {
    return !!(it && it.obj && it.obj.visible && (!it.isActive || it.isActive()));
  }

  MAY.resetInteractTarget = function () {
    currentTarget = null;
    rayTimer = 0;
    if (interactEl) interactEl.style.display = "none";
  };

  function updateRaycast(dt, ctx) {
    rayTimer -= dt;
    if (rayTimer > 0) return;
    rayTimer = 0.12;
    if (!MAY.started || MAY.modalOpen || (MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying()) || !ctx || !ctx.interactives.length) {
      if (interactEl) interactEl.style.display = "none";
      currentTarget = null;
      return;
    }
    raycaster.setFromCamera(rayCenter, MAY.camera);
    raycaster.far = 14;
    var objs = [];
    for (var i = 0; i < ctx.interactives.length; i++) {
      if (isInteractiveActive(ctx.interactives[i])) objs.push(ctx.interactives[i].obj);
    }
    var hits = raycaster.intersectObjects(objs, true);
    var found = null;
    for (var h = 0; h < hits.length; h++) {
      var it = findInteractive(hits[h].object, ctx.interactives);
      if (it && isInteractiveActive(it)) { found = it; break; }
    }
    // At hand-in range, the return prompt wins over props behind the quest giver.
    var side = ctx.sideQuest;
    if (side && side.save.stage === 2 && !side.save.done && side.npcPos.distanceTo(MAY.player.pos) < 3.2) {
      found = side.interaction;
    }
    /* Nếu đứng gần NPC Giao Nhiệm Vụ trong 5.6m thì luôn hiện nút trò chuyện tiện lợi! */
    if (!found && MAY.player) {
      if (ctx.questNPCs && ctx.questNPCs.length) {
        var bestNd = 5.6, bestNpc = null;
        for (var q = 0; q < ctx.questNPCs.length; q++) {
          var npc = ctx.questNPCs[q];
          var nd = npc.group.position.distanceTo(MAY.player.pos);
          if (nd < bestNd) {
            bestNd = nd;
            bestNpc = npc;
          }
        }
        if (bestNpc) {
          found = { obj: bestNpc.group, label: "Trò chuyện với " + bestNpc.name + " (Bấm / Enter)", onInteract: function () { if (bestNpc.onTalk) bestNpc.onTalk(bestNpc); } };
        }
      }
      if (!found && ctx.sideQuest && ctx.sideQuest.npcGroup) {
        var sqd = ctx.sideQuest.npcGroup.position.distanceTo(MAY.player.pos);
        if (sqd < 5.6) {
          for (var iq = 0; iq < ctx.interactives.length; iq++) {
            if (ctx.interactives[iq].obj === ctx.sideQuest.npcGroup && isInteractiveActive(ctx.interactives[iq])) {
              found = ctx.interactives[iq];
              break;
            }
          }
        }
      }
    }
    if (ctx.chapterJourney && ctx.chapterJourney.available && MAY.player.pos.distanceTo(ctx.chapterJourney.entry)<5.6) {
      found=ctx.chapterJourney.interaction;
    }
    currentTarget = found;
    if (interactEl) {
      if (found) {
        interactEl.textContent = "👆 " + found.label;
        interactEl.style.display = "block";
      } else {
        interactEl.style.display = "none";
      }
    }
  }

  MAY.doInteract = function (clientX, clientY) {
    if (!MAY.started || MAY.modalOpen || (MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying())) return;
    var ctx = MAY.currentCtx;
    /* Cho phép click trực tiếp vào BẤT KỲ NPC, Rương, Hoa, Trạm đố nào dưới con trỏ chuột (không bắt buộc căn dấu chấm giữa màn hình!) */
    if (typeof clientX === "number" && typeof clientY === "number" && ctx && ctx.interactives && ctx.interactives.length) {
      var ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, MAY.camera);
      raycaster.far = 26;
      var objs = [];
      for (var i = 0; i < ctx.interactives.length; i++) {
        if (isInteractiveActive(ctx.interactives[i])) objs.push(ctx.interactives[i].obj);
      }
      var hits = raycaster.intersectObjects(objs, true);
      var pPos = MAY.player ? MAY.player.pos : MAY.camera.position;
      for (var h = 0; h < hits.length; h++) {
        if (hits[h].point.distanceTo(pPos) > 14) continue;
        var it = findInteractive(hits[h].object, ctx.interactives);
        if (it && isInteractiveActive(it) && it.onInteract) { ctx.storyInputThisFrame = true; it.onInteract(it); return; }
      }
    }
    if (!currentTarget || !isInteractiveActive(currentTarget)) return;
    if (currentTarget.onInteract) { ctx.storyInputThisFrame = true; currentTarget.onInteract(currentTarget); }
  };

  /* ---- Nhà máy tạo bạn thú 3D siêu dễ thương cho cả 6 màn ---- */
  function stdMat(hex, rough, extra) {
    var o = { color: hex, roughness: rough !== undefined ? rough : 0.75 };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return new THREE.MeshStandardMaterial(o);
  }
  var blackEye = new THREE.MeshBasicMaterial({ color: 0x1a1a2a });
  var eyeGlintM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  if (MAY.protectMaterial) { MAY.protectMaterial(blackEye); MAY.protectMaterial(eyeGlintM); }
  function addEyes(g, xOff, y, z, r) {
    var rad = r || 0.055;
    [-xOff, xOff].forEach(function (ex) {
      var e = new THREE.Mesh(new THREE.SphereGeometry(rad, 10, 8), blackEye);
      e.position.set(ex, y, z); g.add(e);
      var gl = new THREE.Mesh(new THREE.SphereGeometry(rad * 0.34, 6, 5), eyeGlintM);
      gl.position.set(ex + rad * 0.25, y + rad * 0.28, z - rad * 0.72); g.add(gl);
    });
  }

  function addLegs(g, mat, dx, dz, h, r) {
    [[-dx, -dz], [dx, -dz], [-dx, dz], [dx, dz]].forEach(function (p) {
      var l = new THREE.Mesh(new THREE.CylinderGeometry(r || 0.06, r || 0.06, h || 0.35, 6), mat);
      l.position.set(p[0], (h || 0.35) / 2, p[1]);
      g.add(l);
    });
  }

  var animalOvalGeo = MAY.protectGeometry(new THREE.SphereGeometry(1, 12, 8));
  var butterflyMap, butterflyPanel;

  function butterflyWings(group, tint) {
    if (!butterflyMap) {
      butterflyMap = new THREE.TextureLoader().load("assets/img/butterfly-wing.webp");
      butterflyMap.encoding = THREE.sRGBEncoding;
      MAY.protectTexture(butterflyMap);
      butterflyPanel = new THREE.PlaneGeometry(1, 1, 5, 5);
      var p = butterflyPanel.attributes.position, uv = butterflyPanel.attributes.uv;
      for (var i = 0; i < p.count; i++) {
        var span = uv.getX(i), chord = 1 - uv.getY(i);
        p.setXYZ(i, span * 1.24, 0.18 * span + 0.07 * Math.sin(span * Math.PI),
          (chord - 0.47) * 1.45 + 0.06 * Math.sin(span * Math.PI));
      }
      butterflyPanel.computeVertexNormals();
      MAY.protectGeometry(butterflyPanel);
    }
    var material = stdMat(tint || 0x8de4fe, 0.74, {
      map: butterflyMap, alphaTest: 0.43, side: THREE.DoubleSide
    });
    [-1, 1].forEach(function (side) {
      var hinge = new THREE.Group(), wing = new THREE.Mesh(butterflyPanel, material);
      wing.scale.x = side;
      hinge.add(wing);
      group.add(hinge);
      if (side < 0) group.userData.wl = hinge;
      else group.userData.wr = hinge;
    });
  }

  function scallopValve() {
    var positions = [], shades = [], indices = [];
    var rim = new THREE.Color(0xad7698), lip = new THREE.Color(0xf5d6bf);
    var pearlColor = new THREE.Color(0xcab6c4), shade = new THREE.Color();
    var ribs = 11, slices = ribs * 4, rows = 8;
    for (var j = 0; j <= rows; j++) {
      var r = j / rows;
      for (var i = 0; i <= slices; i++) {
        var u = i / slices, a = (u - 0.5) * 2.42;
        var ridge = (1 + Math.cos(u * ribs * Math.PI * 2)) * 0.5;
        var edge = 1.54 + 0.08 * ridge;
        positions.push(r * edge * Math.sin(a) * 0.71,
          0.22 * r * r + 0.09 * r * ridge - 0.13 * Math.sin(r * Math.PI),
          -r * edge * Math.cos(a));
        shade.copy(pearlColor).lerp(rim, ridge * 0.37 + r * 0.23).lerp(lip, r > 0.93 ? 0.91 : r * 0.16);
        shades.push(shade.r, shade.g, shade.b);
        if (i && j) {
          var k = j * (slices + 1) + i;
          indices.push(k - slices - 2, k, k - 1, k - slices - 2, k - slices - 1, k);
        }
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    geo.computeVertexNormals();
    return geo;
  }
  function animalOval(parent, material, x, y, z, width, height, length) {
    var part = new THREE.Mesh(animalOvalGeo, material);
    part.userData.sharedGeo = true;
    part.scale.set(width, height, length);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  }

  function taperedLimb(parent, mat, start, end, shoulder, tip) {
    var a = new THREE.Vector3().fromArray(start), b = new THREE.Vector3().fromArray(end);
    var direction = b.clone().sub(a);
    var limb = new THREE.Mesh(new THREE.CylinderGeometry(tip, shoulder, direction.length(), 8), mat);
    limb.position.copy(a).lerp(b, 0.5);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    parent.add(limb);
    return limb;
  }

  MAY.fishBody = function (color, len, species) {
    var g = new THREE.Group();
    if (MAY.modelsReady) {
      var glb = MAY.cloneFish(color, len || 1.6, species || 0);
      if (glb) { g.add(glb); return g; }
    }
    var mat = stdMat(color, 0.55, { side: THREE.DoubleSide });
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mat);
    body.scale.set((len || 1.6) * 0.75, 0.75, 0.55);
    g.add(body);
    var tail = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.6, 4), mat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-(len || 1.6) * 0.5, 0, 0);
    tail.scale.set(1, 1, 0.25);
    g.add(tail);
    [0.14, -0.14].forEach(function (z) {
      var e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), blackEye);
      e.position.set((len || 1.6) * 0.22, 0.1, z);
      g.add(e);
    });
    return g;
  };

  function dressFox(mesh, snowy) {
    var source = mesh.material.map;
    if (!source || !source.image) return;
    var canvas = document.createElement("canvas");
    canvas.width = source.image.width; canvas.height = source.image.height;
    var context = canvas.getContext("2d");
    context.drawImage(source.image, 0, 0);
    var image = context.getImageData(0, 0, canvas.width, canvas.height), pixels = image.data;
    // The fox atlas has five flat swatches. Keep the eyes and white bib intact.
    for (var i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === 165 && pixels[i + 1] === 103) {
        pixels[i] = snowy ? 227 : 224; pixels[i + 1] = snowy ? 234 : 185; pixels[i + 2] = snowy ? 238 : 130;
      } else if (pixels[i] === 79 && pixels[i + 1] === 79) {
        pixels[i] = snowy ? 161 : 142; pixels[i + 1] = snowy ? 177 : 110; pixels[i + 2] = snowy ? 187 : 85;
      }
    }
    context.putImageData(image, 0, 0);
    mesh.material = mesh.material.clone();
    mesh.material.map = source.clone();
    mesh.material.map.source = new THREE.Source(canvas);
    mesh.material.map.needsUpdate = true;
    if (snowy) return;
    // In this mesh the ear tips sit above the brow at y=2.38 toward +Z.
    mesh.geometry = mesh.geometry.clone();
    mesh.userData.sharedGeo = false;
    var pos = mesh.geometry.attributes.position;
    for (var k = 0; k < pos.count; k++) {
      var rise = Math.max(0, pos.getY(k) - 2.38);
      if (rise > 0 && pos.getZ(k) > 1.95) {
        pos.setXYZ(k, pos.getX(k) + Math.sign(pos.getX(k)) * rise * 0.65, pos.getY(k) + rise * 1.6, pos.getZ(k));
      }
    }
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();
  }

  /* Helper tạo thú / NPC có xương Blender & GLB (SkinnedMesh + AnimationMixer) */
  function buildRiggedAnimal(key, cfg, opts) {
    if (!MAY.RIGGED || !MAY.RIGGED[key] || !MAY.cloneSkinnedGLB) return null;
    var cl = MAY.cloneSkinnedGLB(key);
    if (!cl || !cl.scene) return null;
    var g = new THREE.Group();
    g.rotation.order = "YXZ";
    var root = cl.scene;
    root.rotation.y = cfg.rotY !== undefined ? cfg.rotY : Math.PI;
    root.scale.setScalar(cfg.scale || 1.0);
    if (cfg.yOff) root.position.y = cfg.yOff;
    if (cfg.foxCoat) {
      root.traverse(function (o) {
        if (o.isMesh && o.material.name === "Mat_FoxAtlas") dressFox(o, cfg.foxCoat === "snow");
      });
    }
    // Polyfork's rabbit has baked vertex colors. Recolor the fur on a private
    // geometry clone while keeping the dark eyes and rose inner ears intact.
    if (cfg.whiteRabbit) {
      root.traverse(function (o) {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes.color) return;
        o.geometry = o.geometry.clone();
        o.userData.sharedGeo = false;
        var colors = o.geometry.attributes.color;
        for (var i = 0; i < colors.count; i++) {
          var r = colors.getX(i), green = colors.getY(i), blue = colors.getZ(i);
          if (r > 0.25 && r < 0.4 && green > 0.2 && green < 0.32) {
            colors.setXYZ(i, 0.86, 0.86, 0.82);
          } else if (r > 0.6 && green > 0.5 && blue < 0.55) {
            colors.setXYZ(i, 0.93, 0.91, 0.86);
          } else if (r > 0.09 && r < 0.13 && green > 0.045 && green < 0.08) {
            colors.setXYZ(i, 0.70, 0.70, 0.68);
          }
        }
        colors.needsUpdate = true;
      });
    }
    var mixer = new THREE.AnimationMixer(root);
    var acts = {};
    cl.animations.forEach(function (c) {
      var raw = c.name.toLowerCase();
      var tail = raw.split("|").pop();
      var act = mixer.clipAction(c);
      acts[c.name] = act;
      acts[tail] = act;
      if (tail.indexOf("idle") === 0 && !acts.idle) acts.idle = act;
      if (tail.indexOf("walk") === 0 && !acts.walk) acts.walk = act;
      if ((tail.indexOf("gallop") === 0 || tail.indexOf("run") === 0) && !acts.run) acts.run = act;
      if (tail.indexOf("jump") === 0 && !acts.jump) acts.jump = act;
      if (tail.indexOf("dance") === 0 && !acts.dance) acts.dance = act;
      if (tail.indexOf("swim") === 0 && !acts.swim) acts.swim = act;
      if (tail.indexOf("talk") === 0 && !acts.talk) acts.talk = act;
    });
    var cur = null, curName = null;
    g.userData.mixer = mixer;
    g.userData.playClip = function (name) {
      var k = (name || "idle").toLowerCase();
      var nxt = acts[k] || acts[name] || (k === "dance" ? acts.jump : null) || (k === "run" ? acts.walk : null) || acts.idle || acts.swim;
      if (!nxt || cur === nxt) return;
      nxt.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
      if (cur && cur !== nxt) cur.crossFadeTo(nxt, 0.20, false);
      cur = nxt; curName = k;
    };
    g.userData.playClip(cfg.defaultClip || "idle");
    g.add(root);
    if (opts && opts.scale) g.scale.setScalar(opts.scale);
    return g;
  }

  // The two painted coats occupy adjacent halves of one atlas. Each animal
  // owns its UV transform so dressing it cannot recolor another instance.
  function selectCoat(group, secondHalf) {
    group.traverse(function (mesh) {
      var original = mesh.material;
      if (!mesh.isSkinnedMesh || !original || original.name !== "fauna_coat" || !original.map) return;
      var material = original.clone();
      material.map = original.map.clone();
      material.map.repeat.set(0.5, 1);
      material.map.offset.x = secondHalf ? 0.5 : 0;
      material.map.needsUpdate = true;
      mesh.material = material;
    });
  }

  var RIGGED_ANIMAL_MAP = {
    rabbit:       { key: "rabbit", scale: 3.6, whiteRabbit: true, defaultClip: "idle" },
    forestrabbit: { key: "rabbit", scale: 3.6, defaultClip: "idle" },
    snowhare:     { key: "snowhare", scale: 2.7, defaultClip: "idle" },
    tortoise:  { key: "tortoise",  scale: 0.86, defaultClip: "idle" },
    fox:       { key: "fox",       scale: 0.42, defaultClip: "idle" },
    fennec:    { key: "fox",       scale: 0.36, foxCoat: "sand", defaultClip: "idle" },
    snowfox:   { key: "fox",       scale: 0.40, foxCoat: "snow", defaultClip: "idle" },
    deer:      { key: "deer",      scale: 0.85, defaultClip: "idle" },
    reindeer:  { key: "reindeer",  scale: 0.40, defaultClip: "idle" },
    unicorn:   { key: "unicorn",   scale: 0.42, defaultClip: "idle" },
    sheep:     { key: "sheep",     scale: 1.08, defaultClip: "idle" },
    camel:     { key: "camel",     scale: 0.95, defaultClip: "idle" },
    owl:       { key: "owl",       scale: 4.1, defaultClip: "idle" },
    penguin:   { key: "penguin",   scale: 1.8, defaultClip: "idle" },
    octopus:   { key: "octopus",   scale: 0.59, defaultClip: "idle" },
    crab:      { key: "crab",      scale: 0.52, defaultClip: "idle" },
    dolphin:   { key: "dolphin",   scale: 0.34, rotY: Math.PI / 2, defaultClip: "swim" },
    clownfish: { key: "clownfish", scale: 0.24, rotY: Math.PI / 2, defaultClip: "swim" }
  };

  MAY.makeAnimal = function (kind, opts) {
    opts = opts || {};
    if (RIGGED_ANIMAL_MAP[kind]) {
      var rg = buildRiggedAnimal(RIGGED_ANIMAL_MAP[kind].key, RIGGED_ANIMAL_MAP[kind], opts);
      if (rg) {
        if (kind === "rabbit" || kind === "forestrabbit") selectCoat(rg, kind === "rabbit");
        if (kind === "penguin") {
          var scarfMat = stdMat(0xe34c58, 0.85);
          var scarf = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.045, 6, 16), scarfMat);
          scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.91; rg.add(scarf);
          var scarfEnd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.29, 0.065), scarfMat);
          scarfEnd.position.set(0.12, 0.73, -0.25); scarfEnd.rotation.z = 0.12; rg.add(scarfEnd);
        }
        return rg;
      }
    }
    var g = new THREE.Group();
    g.rotation.order = "YXZ";

    if (kind === "milo" || kind === "miloWinged") {
      /* Ưu tiên dùng mô hình Blender có khung xương companion_milo.glb (SkinnedMesh + AnimationMixer 5 clip!) */
      if (MAY.RIGGED && MAY.RIGGED.milo && MAY.cloneSkinnedGLB) {
        var mcl = MAY.cloneSkinnedGLB("milo");
        if (mcl && mcl.scene) {
          var mRoot = mcl.scene;
          mRoot.rotation.y = Math.PI;
          mRoot.scale.setScalar(1.42);
          mRoot.traverse(function (o) {
            if (o.isMesh && /^Wing_[LR](?:_\d+)?$/.test(o.name)) {
              o.visible = (kind === "miloWinged");
            }
            if (o.isMesh && o.material && o.material.name === "Mat_Body") {
              o.material.roughness = 0.72;
              o.material.metalness = 0.04;
            }
          });
          var mMixer = new THREE.AnimationMixer(mRoot);
          var mActs = {};
          mcl.animations.forEach(function (c) { mActs[c.name] = mMixer.clipAction(c); });
          var mCur = null, mCurName = null;
          g.userData.mixer = mMixer;
          g.userData.happyT = 0;
          g.userData.playClip = function (name) {
            if (!mActs[name] || mCurName === name) return;
            var nxt = mActs[name];
            nxt.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
            if (mCur && mCur !== nxt) mCur.crossFadeTo(nxt, 0.16, false);
            mCur = nxt; mCurName = name;
          };
          g.userData.playClip(kind === "miloWinged" ? "Fly" : "Idle");
          g.add(mRoot);
          if (opts.scale) g.scale.setScalar(opts.scale);
          return g;
        }
      }
      /* Fallback thủ tục nếu companion_milo.glb chưa tải xong */
      var bm = stdMat(0xd49452, 0.82), em = stdMat(0x8a5628, 0.88), bellyM = stdMat(0xf7e1be, 0.88);
      var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.44, 8, 12), bm);
      body.rotation.x = Math.PI / 2; body.position.y = 0.46; g.add(body);
      var chest = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bellyM);
      chest.position.set(0, 0.46, -0.24); g.add(chest);
      [[-0.14, -0.24], [0.14, -0.24], [-0.14, 0.24], [0.14, 0.24]].forEach(function (lp) {
        var leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.22, 6, 8), bm);
        leg.position.set(lp[0], 0.19, lp[1]); g.add(leg);
        var paw = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 6), bellyM);
        paw.scale.set(1, 0.6, 1.25); paw.position.set(lp[0], 0.05, lp[1] - 0.03); g.add(paw);
      });
      var collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 8, 16), stdMat(0xff4d6d, 0.4));
      collar.rotation.x = Math.PI / 2 + 0.35; collar.position.set(0, 0.62, -0.34); g.add(collar);
      var tag = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), stdMat(0xffd93d, 0.25, { metalness: 0.7 }));
      tag.position.set(0, 0.54, -0.52); g.add(tag);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), bm); head.position.set(0, 0.76, -0.48); g.add(head);
      var snout = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), bellyM); snout.scale.set(1.0, 0.78, 1.15); snout.position.set(0, 0.69, -0.71); g.add(snout);
      [-0.21, 0.21].forEach(function (x) {
        var ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.18, 6, 8), em);
        ear.position.set(x, 0.78, -0.46); ear.rotation.z = x > 0 ? -0.42 : 0.42; g.add(ear);
      });
      addEyes(g, 0.10, 0.81, -0.72, 0.045);
      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), blackEye); nose.position.set(0, 0.72, -0.84); g.add(nose);
      var tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.30, 6, 8), bm);
      tail.position.set(0, 0.66, 0.48); tail.rotation.x = 0.75; g.add(tail);
      g.userData.tail = tail;
      if (kind === "miloWinged") {
        var wm = stdMat(0xffffff, 0.35, { emissive: 0xffb3ec, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
        var wl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), wm); wl.scale.set(1.4, 0.14, 0.65); wl.position.set(-0.46, 0.62, -0.05); g.add(wl);
        var wr = wl.clone(); wr.position.x = 0.46; g.add(wr);
        g.userData.wl = wl; g.userData.wr = wr;
      }
    } else if (kind === "wolf") {
      // A rounded snow pup with a darker saddle and light cheeks, facing -Z.
      var wolfFur = stdMat(0xaebdcb, 0.88), wolfLight = stdMat(0xf3f8fc, 0.9);
      var wolfDark = stdMat(0x728696, 0.88), wolfPink = stdMat(0xd99fab, 0.9);
      animalOval(g, wolfFur, 0, 0.55, 0.05, 0.42, 0.36, 0.62);
      animalOval(g, wolfDark, 0, 0.79, 0.08, 0.35, 0.16, 0.47);
      animalOval(g, wolfLight, 0, 0.39, -0.34, 0.30, 0.29, 0.25);
      [-0.25, 0.25].forEach(function (x) {
        [-0.30, 0.38].forEach(function (z) {
          animalOval(g, wolfFur, x, 0.25, z, 0.13, 0.23, 0.14);
          animalOval(g, wolfLight, x, 0.09, z - 0.05, 0.15, 0.09, 0.19);
        });
      });
      animalOval(g, wolfFur, 0, 0.90, -0.53, 0.38, 0.34, 0.34);
      [-0.25, 0.25].forEach(function (x) {
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.40, 6), wolfDark);
        ear.position.set(x, 1.23, -0.48); ear.rotation.z = x < 0 ? 0.15 : -0.15; g.add(ear);
        var inner = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 6), wolfPink);
        inner.position.set(x, 1.23, -0.61); inner.rotation.z = ear.rotation.z; g.add(inner);
        animalOval(g, wolfLight, x * 0.72, 0.75, -0.80, 0.20, 0.14, 0.10);
      });
      animalOval(g, wolfLight, 0, 0.76, -0.84, 0.21, 0.14, 0.20);
      animalOval(g, blackEye, 0, 0.81, -1.025, 0.075, 0.055, 0.045);
      addEyes(g, 0.16, 0.97, -0.815, 0.055);
      var wolfTail = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), wolfFur);
      wolfTail.scale.set(0.75, 0.85, 1.7); wolfTail.position.set(0, 0.63, 0.80); wolfTail.rotation.x = -0.45; g.add(wolfTail);
      animalOval(g, wolfLight, 0, 0.78, 1.08, 0.16, 0.16, 0.20);
      g.userData.tail = wolfTail;
    } else if (kind === "rabbit" || kind === "forestrabbit" || kind === "snowhare") {
      var wm = stdMat(kind === "forestrabbit" ? 0x997755 : 0xffffff, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), wm); b.scale.set(0.95, 0.85, 1.2); b.position.y = 0.42; g.add(b);
      var h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), wm); h.position.set(0, 0.8, -0.48); g.add(h);
      [-0.12, 0.12].forEach(function (ex) {
        var ear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6), wm);
        ear.position.set(ex, 1.25, -0.48); ear.rotation.x = -0.15; g.add(ear);
      });
      addEyes(g, 0.12, 0.86, -0.74, 0.045);
      var t = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), wm); t.position.set(0, 0.5, 0.56); g.add(t);
    } else if (kind === "monkey") {
      var m1 = stdMat(0x8a5a2b, 0.9), m2 = stdMat(0xe8c39a, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), m1); b.scale.set(0.95, 1.1, 0.85); b.position.y = 0.58; g.add(b);
      var h = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), m1); h.position.set(0, 1.26, 0); g.add(h);
      var f = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), m2); f.scale.set(1, 0.9, 0.5); f.position.set(0, 1.22, -0.22); g.add(f);
      addEyes(g, 0.1, 1.28, -0.35, 0.045);
      [-0.36, 0.36].forEach(function (ex) { var er = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), m2); er.position.set(ex, 1.32, 0); g.add(er); });
      [-1,1].forEach(function (side) {
        var elbow = [side*0.44,0.66,0.07], wrist = [side*0.48,0.39,-0.12];
        taperedLimb(g,m1,[side*0.28,0.93,0],elbow,0.112,0.080);
        taperedLimb(g,m1,elbow,wrist,0.080,0.067);
        animalOval(g,m2,wrist[0],wrist[1],wrist[2],0.082,0.09,0.07);
        animalOval(g,m1,side*0.23,0.26,0.045,0.147,0.22,0.18);
        animalOval(g,m2,side*0.24,0.093,-0.055,0.112,0.071,0.17);
      });
      var tail = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 6, 12, Math.PI), m1); tail.position.set(0, 0.65, 0.45); tail.rotation.y = Math.PI / 2; g.add(tail);
    } else if (kind === "crab") {
      var rm = stdMat(0xe8483f, 0.6);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), rm); b.scale.set(1.3, 0.55, 1); b.position.y = 0.35; g.add(b);
      [-0.48, 0.48].forEach(function (x) {
        var cl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), rm); cl.position.set(x, 0.42, -0.62); g.add(cl);
        var st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 5), rm); st.position.set(x * 0.45, 0.72, -0.25); g.add(st);
      });
      addEyes(g, 0.21, 0.86, -0.26, 0.055);
    } else if (kind === "tortoise") {
      var gm = stdMat(0x4d9b57, 0.8), hm = stdMat(0x7cc48a, 0.8);
      var sh = new THREE.Mesh(new THREE.SphereGeometry(0.66, 14, 10), gm); sh.scale.set(1.0, 0.55, 1.2); sh.position.y = 0.44; g.add(sh);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), hm); hd.position.set(0, 0.52, -0.88); g.add(hd);
      addLegs(g, hm, 0.42, 0.42, 0.3, 0.1);
      addEyes(g, 0.1, 0.58, -1.08, 0.04);
    } else if (kind === "squirrel") {
      var m = stdMat(0xb86b35, 0.85), bel = stdMat(0xf5dec0, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), m); b.scale.set(0.9, 1.15, 0.9); b.position.y = 0.48; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), m); hd.position.set(0, 0.95, -0.22); g.add(hd);
      [-0.14, 0.14].forEach(function (x) { var er = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), m); er.position.set(x, 1.24, -0.2); g.add(er); });
      var nut = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), stdMat(0x7c4a1d, 0.8)); nut.position.set(0, 0.58, -0.46); g.add(nut);
      var fl = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bel); fl.scale.set(0.65, 1.4, 0.9); fl.position.set(0, 0.86, 0.48); fl.rotation.x = 0.35; g.add(fl);
      [-1,1].forEach(function (side) {
        animalOval(g,m,side*0.20,0.20,0.10,0.16,0.18,0.19);
        animalOval(g,bel,side*0.17,0.075,-0.07,0.085,0.06,0.16);
        taperedLimb(g,m,[side*0.23,0.69,-0.10],[side*0.10,0.56,-0.43],0.083,0.046);
      });
      addEyes(g, 0.11, 1.0, -0.46, 0.045);
    } else if (kind === "deer" || kind === "reindeer") {
      var isRein = (kind === "reindeer");
      var m = stdMat(isRein ? 0x8d5b34 : 0xd08c4e, 0.85);
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.66, 8, 12), m); b.rotation.x = Math.PI / 2; b.position.y = 0.95; g.add(b);
      addLegs(g, m, 0.18, 0.40, 0.72, 0.06);
      var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.48, 6, 10), m); neck.position.set(0, 1.42, -0.50); neck.rotation.x = 0.32; g.add(neck);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), m); hd.scale.set(0.85, 0.9, 1.28); hd.position.set(0, 1.72, -0.72); g.add(hd);
      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), isRein ? stdMat(0xff2e4c, 0.3, { emissive: 0xff2e4c, emissiveIntensity: 0.85 }) : blackEye);
      nose.position.set(0, 1.68, -1.04); g.add(nose);
      addEyes(g, 0.12, 1.78, -0.92, 0.048);
      var antM = stdMat(0x5c3c1e, 0.9);
      [-0.14, 0.14].forEach(function (x) {
        var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.58, 6), antM);
        ant.position.set(x, 2.08, -0.66); ant.rotation.z = x > 0 ? -0.42 : 0.42; g.add(ant);
        var prong = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.28, 5), antM);
        prong.position.set(x * 1.9, 2.22, -0.66); prong.rotation.z = x > 0 ? 0.35 : -0.35; g.add(prong);
      });
      if (!isRein) {
        var spotM = stdMat(0xfff4d6, 0.9);
        [[-0.27, 1.05, 0.1], [0.27, 1.02, -0.15], [-0.27, 0.96, -0.25], [0.27, 1.08, 0.25]].forEach(function (sp) {
          var s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), spotM); s.position.set(sp[0], sp[1], sp[2]); g.add(s);
        });
      }
    } else if (kind === "fox" || kind === "fennec" || kind === "snowfox") {
      var col = kind === "snowfox" ? 0xf5fbff : kind === "fennec" ? 0xf4c989 : 0xf27127;
      var m = stdMat(col, 0.85), wh = stdMat(0xffffff, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), m); b.scale.set(0.85, 0.8, 1.4); b.position.y = 0.48; g.add(b);
      addLegs(g, m, 0.18, 0.32, 0.36, 0.055);
      var hd = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.56, 8), m); hd.rotation.x = -Math.PI / 2; hd.position.set(0, 0.72, -0.65); g.add(hd);
      var earH = kind === "fennec" ? 0.65 : 0.32;
      [-0.17, 0.17].forEach(function (x) {
        var er = new THREE.Mesh(new THREE.ConeGeometry(kind === "fennec" ? 0.16 : 0.1, earH, 6), m);
        er.position.set(x, 0.92 + earH * 0.25, -0.48); er.rotation.z = x > 0 ? -0.35 : 0.35; g.add(er);
      });
      var tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), wh); tail.scale.set(0.75, 0.75, 1.7); tail.position.set(0, 0.56, 0.75); g.add(tail);
      addEyes(g, 0.11, 0.77, -0.72, 0.045);
    } else if (kind === "butterfly") {
      butterflyWings(g, opts.color);
      var thorax = stdMat(0x39303f, 0.88);
      animalOval(g, thorax, 0, 0.046, 0.03, 0.062, 0.074, 0.29);
      animalOval(g, thorax, 0, 0.074, -0.23, 0.078, 0.066, 0.072);
      [-1, 1].forEach(function (side) {
        taperedLimb(g, thorax, [side * 0.04, 0.10, -0.26], [side * 0.18, 0.18, -0.43], 0.012, 0.008);
        animalOval(g, thorax, side * 0.18, 0.18, -0.43, 0.017, 0.015, 0.026);
      });
    } else if (kind === "panda" || kind === "polarbear") {
      var isPanda = kind === "panda";
      // Prefer the locally cached Polyfork bear; the procedural shape below remains offline fallback.
      var realBear = buildRiggedAnimal("polyfork_bear", { rotY: Math.PI, scale: 1.0 }, opts);
      if (realBear) {
        selectCoat(realBear, isPanda);
        return realBear;
      }
      var fur = stdMat(isPanda ? 0xf4f0e6 : 0xeaf4f5, 0.92);
      var darkFur = stdMat(isPanda ? 0x25272b : 0xd3e5e8, 0.94);
      var muzzleMat = stdMat(isPanda ? 0xf5eee4 : 0xf9fbf7, 0.94);
      var noseMat = stdMat(0x252c31, 0.78);
      var bearGeo = new THREE.SphereGeometry(1, 10, 7);
      function bearOval(mat, x, y, z, sx, sy, sz) {
        var o = new THREE.Mesh(bearGeo, mat);
        o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o;
      }
      bearOval(fur, 0, 0.73, 0.18, 0.57, 0.57, 0.86); // rump and back
      bearOval(isPanda ? darkFur : fur, 0, 0.80, -0.31, 0.58, 0.60, 0.48); // shoulders
      [-1, 1].forEach(function (side) {
        [-0.45, 0.58].forEach(function (z) {
          bearOval(darkFur, side * 0.38, 0.36, z, 0.23, 0.37, 0.25);
          bearOval(darkFur, side * 0.38, 0.12, z - 0.09, 0.25, 0.12, 0.31);
        });
      });
      bearOval(fur, 0, 1.02, -0.70, 0.46, 0.41, 0.42); // round head
      [-1, 1].forEach(function (side) {
        bearOval(darkFur, side * 0.32, 1.32, -0.67, 0.15, 0.16, 0.13);
        if (isPanda) {
          var patch = bearOval(darkFur, side * 0.20, 1.08, -1.04, 0.13, 0.17, 0.065);
          patch.rotation.z = side * 0.22;
        }
        bearOval(noseMat, side * 0.20, 1.10, -1.10, 0.039, 0.045, 0.03);
      });
      bearOval(muzzleMat, 0, 0.93, -1.04, 0.24, 0.16, 0.19);
      bearOval(noseMat, 0, 1.01, -1.22, 0.095, 0.055, 0.045);
      bearOval(fur, 0, 0.81, 0.97, 0.11, 0.10, 0.12); // short tail
    } else if (kind === "camel") {
      var cm = stdMat(0xdcb06c, 0.88), dm = stdMat(0xb68642, 0.88);
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.78, 8, 12), cm); b.rotation.x = Math.PI / 2; b.position.y = 1.15; g.add(b);
      var hump = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10), dm); hump.scale.set(0.85, 1.0, 1.05); hump.position.set(0, 1.62, 0.05); g.add(hump);
      var saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.45, 10), stdMat(0xe63946, 0.75)); saddle.rotation.x = Math.PI / 2; saddle.position.set(0, 1.24, 0.05); g.add(saddle);
      addLegs(g, cm, 0.24, 0.48, 0.88, 0.08);
      var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.65, 6, 10), cm); neck.position.set(0, 1.62, -0.78); neck.rotation.x = 0.45; g.add(neck);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), cm); hd.scale.set(0.85, 0.85, 1.3); hd.position.set(0, 1.98, -1.08); g.add(hd);
      addEyes(g, 0.14, 2.04, -1.28, 0.05);
    } else if (kind === "lizard") {
      var lm = stdMat(0x759362, 0.86), gold = stdMat(0xe8bb70, 0.9);
      animalOval(g, lm, 0,0.21,0, 0.24,0.16,0.62);
      animalOval(g, lm, 0,0.29,-0.58, 0.235,0.14,0.31);
      taperedLimb(g,lm,[0,0.20,0.43],[0.11,0.13,0.90],0.145,0.082);
      taperedLimb(g,lm,[0.11,0.13,0.90],[0.28,0.06,1.49],0.082,0.007);
      [-1, 1].forEach(function (side) {
        [-0.34, 0.33].forEach(function (z) {
          var knee = [side*0.35,0.14,z+0.10], ankle = [side*0.51,0.055,z-0.07];
          taperedLimb(g,lm,[side*0.14,0.21,z],knee,0.081,0.065);
          taperedLimb(g,lm,knee,ankle,0.065,0.034);
          for (var toe = -1; toe <= 1; toe++)
            animalOval(g,gold,ankle[0]+toe*0.033,0.035,ankle[2]-0.041,0.015,0.015,0.060).rotation.y = -toe*0.35;
        });
      });
      [-0.25,0,0.22,0.39].forEach(function (z) {
        animalOval(g,gold,0,0.21+0.16*Math.sqrt(1-z*z/0.39),z,0.038,0.011,0.063);
      });
      addEyes(g,0.177,0.36,-0.70,0.045);
    } else if (kind === "meerkat") {
      var mm = stdMat(0xb48960, 0.89), mask = stdMat(0x4b4038, 0.88), cream = stdMat(0xe3c6a0, 0.88);
      animalOval(g,mm,0,0.53,0.04,0.205,0.46,0.18).rotation.x = -0.15;
      animalOval(g,cream,0,0.56,-0.06,0.151,0.32,0.116).rotation.x = -0.15;
      animalOval(g,mm,0,1.035,-0.055,0.22,0.185,0.196);
      animalOval(g,cream,0,0.995,-0.209,0.124,0.080,0.145);
      animalOval(g,blackEye,0,1.013,-0.348,0.047,0.028,0.033);
      taperedLimb(g,mm,[0,0.22,0.15],[0.035,0.10,0.47],0.077,0.052);
      taperedLimb(g,mm,[0.035,0.10,0.47],[0.14,0.042,0.86],0.052,0.009);
      [-1, 1].forEach(function (side) {
        animalOval(g,mask,side*0.108,1.07,-0.207,0.093,0.071,0.046).rotation.z=side*0.25;
        animalOval(g,mask,side*0.199,1.08,0.006,0.065,0.073,0.039);
        animalOval(g,mm,side*0.134,0.096,-0.018,0.094,0.106,0.15);
        var elbow = [side*0.194,0.62,-0.10];
        taperedLimb(g,mm,[side*0.136,0.77,-0.025],elbow,0.063,0.049);
        taperedLimb(g,mm,elbow,[side*0.115,0.55,-0.215],0.049,0.030);
      });
      addEyes(g,0.105,1.077,-0.249,0.035);
    } else if (kind === "bat" || kind === "bird" || kind === "eagle" || kind === "phoenix") {
      var col = opts.color || (kind === "bat" ? 0x9b6dff : kind === "eagle" ? 0xd99b26 : kind === "phoenix" ? 0xff6b9d : 0xffffff);
      var em = kind === "phoenix" ? { emissive: col, emissiveIntensity: 0.18 } : null;
      var bm = stdMat(col, 0.55, em);
      var bd = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), bm); bd.scale.set(0.88, 0.82, 1.52); g.add(bd);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bm); hd.position.set(0, 0.18, -0.48); g.add(hd);
      if (kind !== "bat") {
        var beak = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.28, 8), stdMat(0xffa726));
        beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.15, -0.75); g.add(beak);
      } else {
        [-0.12, 0.12].forEach(function (x) { var er = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), bm); er.position.set(x, 0.39, -0.45); g.add(er); });
      }
      addEyes(g, 0.10, 0.22, -0.68, 0.048);
      /* Cánh lông vũ uốn lượn mềm mại nhiều tầng thay cho tấm hộp thô! */
      var wLen = kind === "eagle" || kind === "phoenix" ? 1.4 : 0.98;
      var wTipM = kind === "phoenix" ? stdMat(0xffd93d, 0.35, { emissive: 0xff9f43, emissiveIntensity: 0.55 }) : bm;
      function makeFeatherWing(side) {
        var piv = new THREE.Group();
        piv.position.set(side * 0.22, 0.10, -0.04);
        if (kind === "bat") {
          var membrane = new THREE.BufferGeometry();
          // Thumb and elbow form the leading edge; the shorter fingers scallop the trailing edge.
          var outline = [[0,0.00,-0.10],[0.43,0.13,-0.31],[0.98,0.08,-0.19],
            [1.26,-0.035,0.005],[0.84,0.018,0.15],[0.68,-0.055,0.33],
            [0.46,0.018,0.21],[0.32,-0.05,0.43],[0.18,0.014,0.28],[0,0.0,0.32]];
          var points = [];
          outline.forEach(function (p) { points.push(side*p[0],p[1],p[2]); });
          membrane.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
          membrane.setIndex([1,2,3,1,3,4,1,4,5,1,5,6,1,6,7,1,7,8,1,8,9,1,9,0]);
          membrane.computeVertexNormals();
          piv.add(new THREE.Mesh(membrane,stdMat(0x604775,0.84,{side:THREE.DoubleSide})));
          [3,5,7].forEach(function (i) {
            var finger = outline[i];
            taperedLimb(piv,bm,[side*0.43,0.14,-0.31],[side*finger[0],finger[1]+0.012,finger[2]],0.022,0.007);
          });
          return piv;
        }
        if (kind === "eagle" || kind === "phoenix") {
          var tips = kind === "phoenix" ? wTipM : stdMat(0x4f3f37,0.85);
          for (var f = 0; f < 5; f++) {
            var feather = animalOval(piv,f % 3 === 0 ? bm : tips,side*(0.70 + f*0.095),0.009*f,
              0.31-f*0.118,wLen*(0.56-f*0.035),0.037,0.102);
            feather.rotation.y = side*(0.45-f*0.095);
          }
        }
        var inner = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), bm);
        inner.scale.set(wLen * 1.05, 0.14, 0.68); inner.position.set(side * wLen * 0.42, 0, 0.02); piv.add(inner);
        var tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, wLen * 0.72, 8), wTipM);
        tip.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2; tip.scale.set(0.32, 1.0, 1.05);
        tip.position.set(side * wLen * 0.85, 0, 0.06); piv.add(tip);
        return piv;
      }
      var wl = makeFeatherWing(-1), wr = makeFeatherWing(1);
      g.add(wl, wr);
      g.userData.wl = wl; g.userData.wr = wr;
      if (kind === "phoenix") {
        var crest = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.38, 6), wTipM);
        crest.position.set(0, 0.46, -0.46); crest.rotation.x = -0.35; g.add(crest);
        [-0.22, 0, 0.22].forEach(function (tx, ti) {
          var pl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1.15 - Math.abs(tx) * 0.8, 7), ti === 1 ? wTipM : bm);
          pl.rotation.x = Math.PI / 2; pl.rotation.z = tx * 0.8; pl.position.set(tx, 0.06, 0.92); g.add(pl);
        });
      }
    } else if (kind === "owl") {
      var om = stdMat(0x7c589c, 0.85), ym = new THREE.MeshBasicMaterial({ color: 0xffd93d });
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), om); b.scale.set(0.95, 1.25, 0.9); b.position.y = 0.62; g.add(b);
      [-0.15, 0.15].forEach(function (x) {
        var ring = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), ym); ring.position.set(x, 0.88, -0.38); g.add(ring);
        var ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 5), om); ear.position.set(x * 1.6, 1.18, -0.1); g.add(ear);
      });
      addEyes(g, 0.15, 0.88, -0.47, 0.05);
      var bk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), stdMat(0xffa726)); bk.rotation.x = -Math.PI / 2; bk.position.set(0, 0.78, -0.48); g.add(bk);
    } else if (kind === "axolotl") {
      var pm = stdMat(0xff99cc, 0.45, { emissive: 0xff66b2, emissiveIntensity: 0.35 });
      var gm = stdMat(0xff4d94, 0.5, { emissive: 0xff4d94, emissiveIntensity: 0.5 });
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), pm); b.scale.set(0.9, 0.7, 1.8); g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), pm); hd.position.set(0, 0.05, -0.62); g.add(hd);
      [-0.36, 0.36].forEach(function (x) {
        for (var k = -1; k <= 1; k++) {
          var gill = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.32, 5), gm);
          gill.position.set(x, 0.08 + k * 0.1, -0.52); gill.rotation.z = x > 0 ? -1.1 : 1.1; g.add(gill);
        }
      });
      addEyes(g, 0.13, 0.12, -0.88, 0.05);
    } else if (kind === "mole") {
      var m = stdMat(0x54453c, 0.9);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), m); b.scale.set(1, 0.9, 1.15); b.position.y = 0.42; g.add(b);
      var hat = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), stdMat(0xffd93d, 0.4));
      hat.position.set(0, 0.75, -0.15); g.add(hat);
      var blb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      blb.position.set(0, 0.85, -0.42); g.add(blb);
      var nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), stdMat(0xff9eb5)); nose.position.set(0, 0.48, -0.56); g.add(nose);
      var glove = stdMat(0xa67564, 0.83), claw = stdMat(0xe4c8a0, 0.88);
      animalOval(g, glove, 0, 0.48, -0.48, 0.20, 0.13, 0.15);
      animalOval(g, stdMat(0xbb923e, 0.74), 0, 0.755, -0.18, 0.315, 0.035, 0.34);
      [-1, 1].forEach(function (side) {
        animalOval(g, m, side * 0.31, 0.33, -0.10, 0.20, 0.17, 0.23);
        animalOval(g, glove, side * 0.42, 0.24, -0.23, 0.16, 0.088, 0.17);
        for (var toe = -1; toe <= 1; toe++) {
          var x = side * (0.42 + toe * 0.061);
          taperedLimb(g, claw, [x, 0.23, -0.33], [x + side * toe * 0.015, 0.18, -0.44 + Math.abs(toe) * 0.025], 0.027, 0.005);
        }
      });
      addEyes(g, 0.13, 0.6, -0.45, 0.04);
    } else if (kind === "firefly" || kind === "shootingstar") {
      var col = kind === "firefly" ? 0xcaff70 : 0xffd93d;
      var orb = new THREE.Mesh(kind === "shootingstar" ? MAY.starGeo : new THREE.SphereGeometry(0.16, 12, 10),
        stdMat(col, 0.25, { emissive: col, emissiveIntensity: 0.95 }));
      if (kind === "shootingstar") orb.scale.setScalar(0.75);
      else {
        orb.position.z = 0.245;
        var beetle = stdMat(0x443d41,0.75), wing = stdMat(0xb3cbc4,0.7);
        animalOval(g,beetle,0,0,0.01,0.135,0.11,0.23);
        animalOval(g,beetle,0,0.035,-0.19,0.108,0.096,0.11);
        [-1,1].forEach(function (side) {
          var cover = animalOval(g,beetle,side*0.09,0.095,0.07,0.065,0.058,0.16);
          cover.rotation.y = side*0.46;
          var fw = animalOval(g,wing,side*0.21,0.13,0.085,0.25,0.016,0.088);
          fw.rotation.y = -side*0.48;
          if (side < 0) g.userData.wl = fw; else g.userData.wr = fw;
          taperedLimb(g,beetle,[side*0.056,0.11,-0.22],[side*0.12,0.21,-0.31],0.014,0.007);
        });
      }
      g.add(orb);
      var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: col, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(kind === "firefly" ? 0.78 : 2.4);
      if (kind === "firefly") { halo.position.copy(orb.position); halo.material.opacity = 0.4; }
      g.add(halo);
    } else if (kind === "penguin") {
      var dk = stdMat(0x1f2d3d, 0.7), wh = stdMat(0xffffff, 0.85);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), dk); b.scale.set(0.95, 1.35, 0.9); b.position.y = 0.56; g.add(b);
      var bel = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), wh); bel.scale.set(0.85, 1.15, 0.55); bel.position.set(0, 0.52, -0.24); g.add(bel);
      var beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 6), stdMat(0xff9f43)); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.88, -0.45); g.add(beak);
      var scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 14), stdMat(0xff4d6d)); scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.76; g.add(scarf);
      addEyes(g, 0.13, 0.96, -0.34, 0.045);
    } else if (kind === "seal") {
      var sm = stdMat(0xdbeafe, 0.75);
      var b = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10), sm); b.scale.set(0.95, 0.75, 1.65); b.position.y = 0.35; g.add(b);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), sm); hd.position.set(0, 0.62, -0.68); g.add(hd);
      var ns = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), blackEye); ns.position.set(0, 0.6, -0.96); g.add(ns);
      [-1,1].forEach(function (side) {
        animalOval(g,sm,side*0.39,0.16,-0.24,0.34,0.07,0.16).rotation.y=side*0.4;
        animalOval(g,sm,side*0.125,0.20,0.76,0.14,0.063,0.24).rotation.y=side*0.37;
      });
      addEyes(g, 0.12, 0.68, -0.9, 0.05);
    } else if (kind === "unicorn") {
      var wh = stdMat(0xffffff, 0.5), pn = stdMat(0xff99dd, 0.45, { emissive: 0xff66cc, emissiveIntensity: 0.32 });
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.66, 8, 12), wh); b.rotation.x = Math.PI / 2; b.position.y = 0.92; g.add(b);
      addLegs(g, wh, 0.19, 0.40, 0.68, 0.068);
      var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.46, 6, 10), wh); neck.position.set(0, 1.35, -0.50); neck.rotation.x = 0.35; g.add(neck);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), wh); hd.scale.set(0.85, 0.9, 1.28); hd.position.set(0, 1.66, -0.74); g.add(hd);
      var horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.55, 10), stdMat(0xffd93d, 0.18, { emissive: 0xffb703, emissiveIntensity: 0.72 }));
      horn.position.set(0, 2.02, -0.84); horn.rotation.x = 0.35; g.add(horn);
      for (var mn = 0; mn < 4; mn++) {
        var tuft = new THREE.Mesh(new THREE.SphereGeometry(0.13 - mn * 0.015, 8, 6), pn);
        tuft.position.set(0, 1.72 - mn * 0.16, -0.48 + mn * 0.10); g.add(tuft);
      }
      var utail = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.42, 6, 8), pn);
      utail.position.set(0, 0.85, 0.68); utail.rotation.x = -0.45; g.add(utail);
      addEyes(g, 0.13, 1.70, -0.96, 0.048);
    } else if (kind === "sheep") {
      var fl = stdMat(0xffffff, 0.95), fc = stdMat(0xffd9b3, 0.85);
      for (var i = 0; i < 6; i++) {
        var puff = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), fl);
        var a = i / 6 * Math.PI * 2;
        puff.position.set(Math.cos(a) * 0.22, 0.55 + (i % 2) * 0.12, Math.sin(a) * 0.26);
        g.add(puff);
      }
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), fc); hd.position.set(0, 0.68, -0.56); g.add(hd);
      addEyes(g, 0.1, 0.74, -0.78, 0.045);
    } else if (kind === "windspirit") {
      /* Bé Gió Lốc Tí Hon dễ thương */
      var wm = stdMat(0xe0f7ff, 0.35, { emissive: 0x7fe3ff, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
      var c1 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.25, 14), wm); c1.rotation.x = Math.PI; c1.position.y = 0.65; g.add(c1);
      var hd = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), wm); hd.position.y = 1.38; g.add(hd);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 8, 20), stdMat(0xffb3ec, 0.3, { emissive: 0xff80df, emissiveIntensity: 0.6 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.95; g.add(ring);
      g.userData.swirl = ring;
      addEyes(g, 0.18, 1.44, -0.46, 0.075);
      var blush = new THREE.MeshBasicMaterial({ color: 0xff8fab });
      [-0.26, 0.26].forEach(function (bx) { var bl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), blush); bl.position.set(bx, 1.33, -0.45); g.add(bl); });
    } else if (kind === "octopus") {
      var mat = stdMat(0x9b59d0, 0.7);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), mat));
      var armCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.34, -0.22, 0),
        new THREE.Vector3(0.52, -0.55, 0), new THREE.Vector3(0.74, -0.71, 0.09), new THREE.Vector3(0.91, -0.65, 0.2)]);
      var armGeometry = new THREE.TubeGeometry(armCurve, 7, 0.095, 6, false);
      for (var k = 0; k < 8; k++) {
        var arm = new THREE.Mesh(armGeometry, mat);
        arm.rotation.y = k * Math.PI / 4; g.add(arm);
      }
      addEyes(g, 0.22, 0.15, -0.62, 0.08);
    } else if (kind === "starfish") {
      var star = MAY.cloneProp("starfish", 0xb272c1, 1.15);
      if (!star) {
        star = new THREE.Mesh(MAY.starGeo, stdMat(0xb272c1, 0.82));
        star.rotation.x = -Math.PI / 2;
      }
      g.add(star);
    } else if (kind === "pearl") {
      var sh = new THREE.Mesh(scallopValve(), stdMat(0xffffff, 0.46, { vertexColors: true, side: THREE.DoubleSide }));
      sh.position.set(0, 0.22, 0.61); g.add(sh);
      var lid = sh.clone();
      lid.rotation.x = 1.25; g.add(lid);
      var pr = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), stdMat(0xffffff, 0.15, { metalness: 0.3, emissive: 0xffeef8, emissiveIntensity: 0.35 }));
      pr.position.set(0, 0.55, -0.12); g.add(pr);
    } else if (kind === "turtle") {
      if (MAY.modelsReady && MAY.MODEL_T.turtle) {
        g.add(MAY.MODEL_T.turtle.group.clone(true));
      } else {
        var shM = stdMat(0x4d9b57, 0.8);
        var sh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 14, 10), shM); sh.scale.set(1.2, 0.55, 1); sh.position.y = 0.2; g.add(sh);
        var hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), stdMat(0x7cc48a)); hd.position.set(1.1, 0.25, 0); g.add(hd);
      }
      g.userData.isTurtle = true;
    } else if (kind === "dolphin") {
      g = MAY.fishBody(0x7fa8c9, 2.5, 1);
    } else if (kind === "clownfish") {
      g = MAY.fishBody(0xff7f2a, 1.5, 0);
    } else {
      g = MAY.fishBody(opts.color || 0xffa726, opts.len || 1.5, opts.species || 0);
    }

    if (opts.scale) g.scale.setScalar(opts.scale);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return g;
  };

  /* ---- World Context Builder: dùng chung cho Hub + cả 6 màn ---- */
  MAY.createWorldCtx = function (levelId) {
    var meta = MAY.getMeta(levelId);
    var ls = MAY.getLevelSave(levelId);
    var ctx = {
      id: levelId,
      meta: meta,
      save: ls,
      mode: "land",
      waterLevel: undefined,
      worldRadius: 106,
      minY: 1.8,
      voidY: undefined,
      minimapBg: "rgba(12,72,102,0.9)",
      minimapLand: null,
      groundH: function () { return 0; },
      isIce: null,
      getNearestSafePoint: null,
      interactives: [],
      collectibles: [],
      friends: [],
      chests: [],
      souvenirs: [],
      interactProps: [],
      bouncePads: [],
      portals: [],
      particles: [],
      waterMeshes: [],
      reflectiveMeshes: [],
      fadingLabels: [],
      getSurface: null,
      underwaterFog: null,
      landFog: null,
      companion: null,
      hidden: null,
      gemAltar: null,
      ringsCh: null,
      raceCh: null,
      quizStation: null,
      beacon: null,
      onUpdate: null,
      playSecs: ls.gem ? 0 : (ls.playSecs || 0),
      portalCooldown: 1.5,
      gemAwardedThisVisit: ls.gem
    };

    ctx.add = function (obj) {
      MAY.worldRoot.add(obj);
      return obj;
    };

    ctx.addSky = function (cfg) {
      cfg = cfg || {};
      ctx._skyCfg = cfg;
      var sky = MAY.makeAtmosphericSky(cfg);
      ctx.add(sky);
      ctx.skyMesh = sky;
      MAY.bakeBiomeEnv(sky);
      if (MAY.createBiomeLightProbe) {
        var lp = MAY.createBiomeLightProbe(cfg);
        ctx.lightProbe = lp;
        ctx.add(lp);
      }
      return sky;
    };

    ctx.addWater = function (opts) {
      opts = opts || {};
      opts.groundH = opts.groundH || ctx.groundH;
      var wm = MAY.makeRealisticWater(opts);
      ctx.add(wm);
      ctx.waterMeshes.push(wm);
      if (opts.planarReflect !== false) {
        MAY.PlanarReflector.configure(opts.y !== undefined ? opts.y : 0, ctx.waterMeshes.concat(ctx.reflectiveMeshes));
      }
      return wm;
    };

    ctx.addReflective = function (geo, opts, pos) {
      var rm = MAY.makeReflectiveSurface(geo, opts);
      if (pos) rm.position.copy(pos);
      ctx.add(rm);
      ctx.reflectiveMeshes.push(rm);
      MAY.PlanarReflector.configure(rm.position.y, ctx.waterMeshes.concat(ctx.reflectiveMeshes));
      return rm;
    };

    ctx.trackLabel = function (sprite, maxDist, priority) {
      ctx.fadingLabels.push({ sp: sprite, maxDist: maxDist || 19, priority: priority || 0 });
      return sprite;
    };
    ctx.untrackLabel = function (sprite) {
      ctx.fadingLabels = ctx.fadingLabels.filter(function (entry) { return entry.sp !== sprite; });
    };

    var viewport = new THREE.Vector2(), labelWorld = new THREE.Vector3(), projected = new THREE.Vector3();
    var candidates = [], occupied = [];
    // Opacity leaves quest and collectible visibility under their owners' control.
    ctx.layoutWorldLabels = function (cinematic) {
      var camera = MAY.camera, player = MAY.player && MAY.player.pos;
      if (!camera || !player) return;
      camera.updateMatrixWorld();
      MAY.renderer.getSize(viewport);
      candidates.length = occupied.length = 0;
      var focalLength = camera.projectionMatrix.elements[5] * viewport.y * 0.5;
      ctx.fadingLabels.forEach(function (entry) {
        var sp = entry.sp;
        if (!sp || !sp.material) return;
        if (cinematic) { sp.material.opacity = 0; return; }
        var shown = sp.visible, parent = sp.parent;
        while (parent && shown) { shown = parent.visible; parent = parent.parent; }
        if (!shown) { sp.material.opacity = 0; return; }
        sp.getWorldPosition(labelWorld);
        var distance = labelWorld.distanceTo(player);
        var alpha = distance < entry.maxDist * 0.55 ? 1 : Math.max(0, 1 - (distance - entry.maxDist * 0.55) / (entry.maxDist * 0.45));
        if (entry.isCompanion) {
          var camD = labelWorld.distanceTo(camera.position);
          var sc = Math.max(0.45, Math.min(1, (camD - 2) / 5.5));
          sp.scale.set(entry.baseSx * sc, entry.baseSy * sc, 1);
          sp.updateWorldMatrix(true, false);
          if (camD < 3.4) alpha *= Math.max(0.12, (camD - 1.8) / 1.6);
        }
        var depth = -projected.copy(labelWorld).applyMatrix4(camera.matrixWorldInverse).z;
        if (alpha <= 0 || depth <= camera.near || depth > camera.far) { sp.material.opacity = 0; return; }
        projected.applyMatrix4(camera.projectionMatrix);
        var e = sp.matrixWorld.elements;
        var sx = Math.hypot(e[0], e[1], e[2]), sy = Math.hypot(e[4], e[5], e[6]);
        var pixelScale = focalLength / depth;
        var cx = (projected.x + 1) * viewport.x * 0.5, cy = (1 - projected.y) * viewport.y * 0.5;
        var halfW = sx * pixelScale * 0.5 + 4, halfH = sy * pixelScale * 0.5 + 4;
        var box = entry.box || (entry.box = {});
        box.left = cx-halfW; box.right = cx+halfW; box.top = cy-halfH; box.bottom = cy+halfH;
        if (box.right < 0 || box.left > viewport.x || box.bottom < 0 || box.top > viewport.y) { sp.material.opacity = 0; return; }
        entry.alpha = alpha; entry.distance = distance;
        candidates.push(entry);
      });
      candidates.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0) || a.distance - b.distance; });
      candidates.forEach(function (item) {
        var b = item.box;
        var overlap = occupied.some(function (a) { return b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top; });
        item.sp.material.opacity = overlap ? 0 : item.alpha;
        if (!overlap) occupied.push(b);
      });
    };

    ctx.ensureBeacon = function (color) {
      if (!ctx.beacon) {
        ctx.beacon = MAY.makeBeacon(color || meta.gemColor);
        ctx.add(ctx.beacon);
      }
      return ctx.beacon;
    };

    /* 1. Tạo địa hình chuẩn từ hàm groundH(x,z) + tự động nướng GI Lightmap (uv2 + mat.lightMap) */
    ctx.buildTerrain = function (size, segs, mat, lmOpts) {
      var geo = new THREE.PlaneGeometry(size, size, segs, segs);
      geo.rotateX(-Math.PI / 2);
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        pos.setY(i, ctx.groundH(pos.getX(i), pos.getZ(i)));
      }
      geo.computeVertexNormals();
      if (MAY.bakeTerrainLightmap && (!lmOpts || lmOpts.enabled !== false)) {
        var sc = ctx._skyCfg || {};
        MAY.bakeTerrainLightmap(geo, mat, Object.assign({
          size: size,
          groundH: ctx.groundH,
          skyColor: sc.horizon || 0xaadbf5,
          bounceColor: sc.ground || 0x4b6e56,
          sunColor: sc.sunColor || 0xfff3cc,
          sunDir: sc.sunDir || new THREE.Vector3(24, 42, 16),
          intensity: 0.72
        }, lmOpts || {}));
      }
      var mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      ctx.add(mesh);
      return mesh;
    };

    /* 2. Hạt môi trường bay/rơi (tuyết biển, đom đóm, cát bay, bụi pha lê, tuyết rơi, bụi sao) */
    ctx.addAmbientParticles = function (opts) {
      opts = opts || {};
      var count = opts.count || 300;
      var spread = opts.spread || 120;
      var minY = opts.minY !== undefined ? opts.minY : 0.5;
      var maxY = opts.maxY !== undefined ? opts.maxY : 20;
      var geo = new THREE.BufferGeometry();
      var arr = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        arr[i * 3] = (Math.random() - 0.5) * spread;
        arr[i * 3 + 1] = minY + Math.random() * (maxY - minY);
        arr[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      var pts = new THREE.Points(geo, new THREE.PointsMaterial({
        color: opts.color || 0xffffff,
        size: opts.size || 0.22,
        transparent: true,
        opacity: opts.opacity || 0.75
      }));
      ctx.add(pts);
      ctx.particles.push({ pts: pts, count: count, minY: minY, maxY: maxY, spread: spread, vy: opts.vy !== undefined ? opts.vy : -0.6, vx: opts.vx || 0 });
      return pts;
    };

    /* 3. Vật phẩm chính (10 mục tiêu) */
    ctx.addCollectibles = function (spots, opts) {
      opts = opts || {};
      ctx.ensureBeacon(opts.color || meta.gemColor);
      spots.forEach(function (p, i) {
        var y = p.length >= 3 ? p[1] : (ctx.groundH(p[0], p[1]) + (opts.yOff || 1.25));
        var z = p.length >= 3 ? p[2] : p[1];
        var mesh = opts.makeMesh ? opts.makeMesh(i) : new THREE.Mesh(
          MAY.starGeo,
          new THREE.MeshStandardMaterial({ color: opts.color || 0xffd93d, emissive: opts.emissive || 0xaa7700, emissiveIntensity: 1.0, roughness: 0.3, metalness: 0.35 })
        );
        mesh.position.set(p[0], y, z);
        mesh.castShadow = true;
        var taken = ls.items.indexOf(i) !== -1;
        mesh.visible = !taken;
        ctx.add(mesh);

        var lb = MAY.makeLabel(opts.icon || meta.collectIcon, { sx: 1.8, sy: 0.65 });
        lb.position.set(p[0], y + 1.45, z);
        lb.visible = !taken;
        ctx.add(lb);
        ctx.trackLabel(lb, 18);

        var glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: MAY.TEX.glow, color: opts.color || 0xffd93d, transparent: true, opacity: 0.65,
          depthWrite: false, blending: THREE.AdditiveBlending
        }));
        glow.scale.set(3.2, 3.2, 1);
        glow.position.set(p[0], y, z);
        glow.visible = !taken;
        ctx.add(glow);

        ctx.collectibles.push({
          idx: i, mesh: mesh, label: lb, glow: glow, baseY: y, taken: taken,
          spin: Math.random() * 6, color: opts.color || 0xffd93d
        });
      });
    };

    /* 4. Bạn thú của vùng đất */
    ctx.addFriends = function (defs) {
      defs.forEach(function (d, i) {
        var g = d.mk ? d.mk() : MAY.makeAnimal(d.kind, d.opts);
        var x = d.pos[0];
        var z = d.pos.length === 3 ? d.pos[2] : d.pos[1];
        var y = d.pos.length === 3 ? d.pos[1] : ctx.groundH(x, z);
        g.position.set(x, y, z);
        if (d.behavior !== "fly" && d.behavior !== "swim") g.add(MAY.makeContactShadow(0.75, 0.55));
        ctx.add(g);

        var lb = MAY.makeLabel(d.name, { sx: 3.0, sy: 0.85 });
        lb.position.set(x, y + (d.labelY || 2.1), z);
        ctx.add(lb);
        ctx.trackLabel(lb, 18);

        var fr = {
          idx: i, group: g, label: lb, name: d.name, kind: d.kind,
          met: ls.friends.indexOf(i) !== -1,
          hx: x, hz: z, baseY: y, labelY: d.labelY || 2.1,
          behavior: d.behavior || "wander",
          orbitR: d.orbitR || 4.5,
          wa: Math.random() * 6.28, wt: 0, hop: 0,
          spin: Math.random() * 6, jump: 1, spinExtra: 0,
          isCompanion: !!d.isCompanion,
          following: !!d.startFollowing || (!!d.isCompanion && ls.friends.indexOf(i) !== -1),
          greetText: d.greet || null
        };
        ctx.friends.push(fr);
        ctx.interactives.push({
          obj: g, label: "Vuốt ve " + d.name,
          onInteract: function () {
            fr.jump = 0;
            MAY.sndFriend();
            MAY.burstAt(g.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xff8fb8, 9);
            if (fr.isCompanion) {
              fr.following = true;
              MAY.toast("💗 " + d.name + " thích Mây lắm! Bạn ấy sẽ đi cùng Mây luôn!", d.name + " đi cùng Mây nè!");
            } else {
              MAY.toast("💗 " + d.name + " vui lắm! Bạn ấy vẫy chào Mây!", d.name + " vui lắm!");
            }
          }
        });
      });
    };

    /* 5. Bạn đồng hành mặc định của màn (chạy/bay bên cạnh Mây) */
    ctx.setCompanion = function (kind, name, opts) {
      opts = opts || {};
      var g = MAY.makeAnimal(kind, opts);
      if (!opts.flying) g.add(MAY.makeContactShadow(0.6, 0.5));
      ctx.add(g);
      var lb = MAY.makeLabel(name, { sx: 1.75, sy: 0.48 });
      ctx.add(lb);
      ctx.fadingLabels.push({ sp: lb, maxDist: 14, isCompanion: true, baseSx: 1.75, baseSy: 0.48 });
      ctx.companion = {
        group: g, label: lb, name: name, kind: kind,
        flying: !!opts.flying,
        yOff: opts.yOff || 0,
        glowLight: opts.light ? (function () {
          var pl = MAY.makePooledLight ? MAY.makePooledLight(opts.light, 1.4, 20) : new THREE.PointLight(opts.light, 1.4, 20);
          g.add(pl);
          return pl;
        })() : null
      };
      ctx.interactives.push({
        obj: g, label: "Vuốt ve " + name,
        onInteract: function () {
          MAY.sndFriend();
          if (MAY.player && MAY.player.triggerPetAnim) MAY.player.triggerPetAnim();
          if (ctx.companion && ctx.companion.group && ctx.companion.group.userData) ctx.companion.group.userData.happyT = 1.8;
          MAY.burstAt(ctx.companion.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0xff8fb8, 9);
          MAY.toast("💗 " + name + " vẫy đuôi thích Mây quá trời!", name + " thích Mây lắm!");
        }
      });
      return ctx.companion;
    };

    /* 6. 3 Rương kho báu (tái sử dụng chest.glb) */
    ctx.addChests = function (spots, tint) {
      spots.forEach(function (p, ci) {
        var x = p[0], z = p.length === 3 ? p[2] : p[1];
        var y = p.length === 3 ? p[1] : ctx.groundH(x, z);
        var g = new THREE.Group();
        g.position.set(x, y, z);
        g.rotation.y = (ci * 2.1) % 6.28;

        var opened = ls.treasures.indexOf(ci) !== -1;
        var lidPivot;
        var glb = MAY.modelsReady ? MAY.makeChestGLB(tint) : null;
        if (glb) {
          g.add(glb.wrap);
          lidPivot = glb.pivot;
        } else {
          var box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.9), new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: tint || 0xffffff, roughness: 0.85 }));
          box.position.y = 0.45; g.add(box);
          lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.9, -0.45);
          var lid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.9), new THREE.MeshStandardMaterial({ map: MAY.TEX.wood, color: tint || 0xccaa77, roughness: 0.85 }));
          lid.position.set(0, 0.16, 0.25); lidPivot.add(lid); g.add(lidPivot);
        }

        var gold = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0xaa7700, emissiveIntensity: 0.9 }));
        gold.position.y = 0.78; gold.visible = opened; g.add(gold);
        if (opened) lidPivot.rotation.x = -1.9;

        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: 0xffd93d, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.scale.set(2.8, 2.8, 1); glow.position.set(0, 1.1, 0); glow.visible = !opened;
        g.add(glow);
        g.add(MAY.makeContactShadow(1.15, 0.6));

        ctx.add(g);
        var ch = { idx: ci, group: g, lid: lidPivot, gold: gold, glow: glow, opened: opened };
        ctx.chests.push(ch);
        ctx.interactives.push({
          obj: g, label: "Mở rương kho báu",
          onInteract: function () {
            if (ch.opened) { MAY.toast("💎 Rương này Mây mở rồi!"); return; }
            ch.opened = true;
            ch.lid.rotation.x = -1.9;
            ch.gold.visible = true;
            ch.glow.visible = false;
            ls.treasures.push(ci);
            MAY.persist();
            MAY.refreshHUD();
            MAY.sndStar();
            MAY.burstAt(g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffd93d, 20);
            if (MAY.VFX) MAY.VFX.spawnSolar(g.position.clone());
            var rem = meta.treasureTarget - ls.treasures.length;
            if (rem <= 0) MAY.toast("💎 Tuyệt vời! Mây mở hết " + meta.treasureTarget + " rương kho báu!", "Mây mở hết rương kho báu rồi!");
            else MAY.toast("💎 Tìm được kho báu! Còn " + rem + " rương nữa!", "Tìm được kho báu rồi!");
          }
        });
      });
    };

    /* 7. Đồ lưu niệm nhặt phụ */
    ctx.addSouvenirs = function (defs) {
      defs.forEach(function (d, i) {
        var sid = d.id || ("sv" + i);
        var x = d.pos[0], z = d.pos.length === 3 ? d.pos[2] : d.pos[1];
        var y = d.pos.length === 3 ? d.pos[1] : ctx.groundH(x, z);
        var wrap = new THREE.Group();
        wrap.position.set(x, y, z);
        wrap.add(d.mesh);
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: d.color || 0xffe699, transparent: true, opacity: 0.7, depthWrite: false }));
        glow.scale.set(2.0, 2.0, 1); glow.position.y = 0.8; wrap.add(glow);
        var taken = ls.souvenirs.indexOf(sid) !== -1;
        wrap.visible = !taken;
        ctx.add(wrap);
        ctx.souvenirs.push({ id: sid, wrap: wrap, pos: new THREE.Vector3(x, y + 0.5, z), taken: taken, msg: d.msg || ("Nhặt được " + meta.souvenirName) });
      });
    };

    /* 8. Vật thể tương tác môi trường (san hô, hoa nở, xương rồng, pha lê nhạc, người tuyết mini, bóng mây) */
    ctx.addInteractProps = function (defs) {
      defs.forEach(function (d, i) {
        var pid = d.id || ("ip" + i);
        ctx.add(d.obj);
        var item = { id: pid, obj: d.obj, touched: ls.interacts.indexOf(pid) !== -1, idx: i };
        ctx.interactProps.push(item);
        if (item.touched && d.onActivate) d.onActivate(d.obj, true);
        ctx.interactives.push({
          obj: d.obj, label: d.label, isProp: true,
          onInteract: function () {
            if (d.sound === "chime") MAY.sndChime(i);
            else MAY.sndStar();
            MAY.burstAt(d.obj.position.clone().add(new THREE.Vector3(0, 1.0, 0)), d.burstColor || 0x9fe8ff, 12);
            if (d.onActivate) d.onActivate(d.obj, false);
            if (ls.interacts.indexOf(pid) === -1) {
              ls.interacts.push(pid);
              item.touched = true;
              MAY.persist();
              MAY.refreshHUD();
              if (ls.interacts.length >= meta.interactTarget) {
                MAY.toast(meta.interactIcon + " Giỏi quá! Đủ " + meta.interactTarget + " " + meta.interactName + " rồi!", "Đủ " + meta.interactTarget + " rồi, Mây giỏi quá!");
              } else {
                MAY.toast(meta.interactIcon + " " + (d.toastText || "Đẹp quá!") + " (" + ls.interacts.length + "/" + meta.interactTarget + ")", d.sayText || d.toastText);
              }
            } else {
              MAY.toast(meta.interactIcon + " " + (d.repeatText || d.toastText || "Lung linh quá!"));
            }
          }
        });
      });
    };

    /* 9. Bảo vật ẩn (1/màn — không hiện trên bản đồ, phát gợi ý khi gần) */
    ctx.addHiddenTreasure = function (pos, opts) {
      opts = opts || {};
      var y = pos.length === 3 ? pos[1] : (ctx.groundH(pos[0], pos[1]) + 1.0);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var m = opts.mesh || new THREE.Mesh(MAY.starGeo, new THREE.MeshStandardMaterial({ color: 0xffb300, emissive: 0xff9500, emissiveIntensity: 1.3, metalness: 0.6, roughness: 0.2 }));
      m.position.set(pos[0], y, z);
      m.scale.setScalar(opts.scale || 1.35);
      m.visible = !ls.hidden;
      ctx.add(m);
      var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: opts.color || 0xffd93d, transparent: true, opacity: 0.9, depthWrite: false }));
      glow.scale.set(3.8, 3.8, 1); glow.position.copy(m.position); glow.visible = !ls.hidden;
      ctx.add(glow);
      ctx.hidden = { mesh: m, glow: glow, hinted: false, name: opts.name || meta.hiddenName, hint: opts.hint || "Có ánh vàng lấp lánh bí mật đâu đây..." };
    };

    /* 10. Thử thách 1: Chuỗi 5 vòng Rune tinh xảo */
    ctx.addRingsChallenge = function (spots, opts) {
      opts = opts || {};
      var list = [];
      spots.forEach(function (p, i) {
        var y = p.length === 3 ? p[1] : (ctx.groundH(p[0], p[1]) + 2.0);
        var z = p.length === 3 ? p[2] : p[1];
        var m = MAY.VFX.makeOrnateRing(opts.radius || 1.85, opts.color || 0xffd93d, opts.emissive || 0xaa7700);
        m.position.set(p[0], y, z);
        if (i < spots.length - 1) {
          var np = spots[i + 1];
          var nz = np.length === 3 ? np[2] : np[1];
          m.rotation.y = Math.atan2(np[0] - p[0], nz - z);
        }
        ctx.add(m);
        var lb = MAY.makeLabel("⭕ " + (i + 1), { sx: 2.0, sy: 0.65 });
        lb.position.set(p[0], y + 2.5, z);
        ctx.add(lb);
        ctx.trackLabel(lb, 22);
        list.push(m);
      });
      ctx.ringsCh = { rings: list, idx: ls.challenges.rings ? list.length : 0, title: opts.title || "5 vòng ánh sáng" };
    };

    /* 11. Thử thách 2: Đua tính giờ cùng bạn thú */
    ctx.addRaceChallenge = function (startPos, spots, opts) {
      opts = opts || {};
      var sy = startPos.length === 3 ? startPos[1] : (ctx.groundH(startPos[0], startPos[1]) + 2.0);
      var sz = startPos.length === 3 ? startPos[2] : startPos[1];
      var startRing = MAY.VFX.makeOrnateRing(2.1, 0x4ade80, 0x16a34a);
      startRing.position.set(startPos[0], sy, sz);
      ctx.add(startRing);
      var slb = MAY.makeLabel("🏁 " + (opts.title || "ĐUA TỐC ĐỘ"), { sx: 3.8, sy: 0.9 });
      slb.position.set(startPos[0], sy + 2.8, sz);
      ctx.add(slb);
      ctx.trackLabel(slb, 22);

      var rList = [];
      spots.forEach(function (p) {
        var y = p.length === 3 ? p[1] : (ctx.groundH(p[0], p[1]) + 2.0);
        var z = p.length === 3 ? p[2] : p[1];
        var m = MAY.VFX.makeOrnateRing(2.0, 0x38bdf8, 0x0284c7);
        m.position.set(p[0], y, z);
        ctx.add(m);
        rList.push(m);
      });
      ctx.raceCh = { startRing: startRing, rings: rList, active: false, t: 0, idx: 0, limit: opts.time || 55, title: opts.title || "Đua tốc độ" };
      MAY.bindRace(ctx, ctx.raceCh);
    };

    /* 12. Thử thách 3: Trạm câu đố giáo dục */
    ctx.addQuizStation = function (pos, opts) {
      opts = opts || {};
      var y = pos.length === 3 ? pos[1] : (ctx.groundH(pos[0], pos[1]) + 1.5);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var g = new THREE.Group();
      var orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0),
        new THREE.MeshPhysicalMaterial({ color: 0xffd93d, emissive: 0xaa7700, emissiveIntensity: 0.85, roughness: 0.15, clearcoat: 1.0 }));
      g.add(orb);
      var halo = MAY.VFX.makeRunePlane(1.75, 0xffd93d, 0.72);
      halo.position.y = -1.2; g.add(halo);
      var lb = MAY.makeLabel("❓ " + (opts.label || "Câu đố"), { sx: 3.2, sy: 0.85 });
      lb.position.y = 1.85;
      g.add(lb);
      ctx.trackLabel(lb, 22);
      g.position.set(pos[0], y, z);
      ctx.add(g);
      ctx.quizStation = { group: g, baseY: y, cd: 0, rune: halo };
      ctx.interactives.push({
        obj: g, label: "Trả lời câu đố",
        onInteract: function () { MAY.openQuiz(ctx.id); }
      });
    };

    /* 13. Bệ Đá Viên Ngọc Sắc Màu có Vòng Rune phát sáng */
    ctx.addGemAltar = function (pos) {
      var y = pos.length === 3 ? pos[1] : ctx.groundH(pos[0], pos[1]);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var g = new THREE.Group();
      g.position.set(pos[0], y, z);

      var pedMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap, color: 0xdbe6f0, roughness: 0.6 });
      var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.95, 1.1, 14), pedMat);
      ped.position.y = 0.55; ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
      var rune = MAY.VFX.makeRunePlane(3.2, meta.gemColor, 0.78);
      rune.position.y = 0.08; g.add(rune);

      var gemMat = new THREE.MeshPhysicalMaterial({
        color: meta.gemColor, emissive: meta.gemColor, emissiveIntensity: 0.95,
        roughness: 0.08, metalness: 0.25, clearcoat: 1.0, transparent: true, opacity: 0.95
      });
      var gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 0), gemMat);
      gem.position.y = 2.4; g.add(gem);

      var halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: MAY.TEX.glow, color: meta.gemColor, transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.scale.set(4.8, 4.8, 1); halo.position.y = 2.4; g.add(halo);

      var lb = MAY.makeLabel(meta.gemIcon + " " + meta.gemName, { sx: 3.8, sy: 0.95 });
      lb.position.y = 4.0; g.add(lb);
      ctx.trackLabel(lb, 24);

      ctx.add(g);
      if (ctx.addCollider) {
        ctx.addCollider(pos[0], z, 1.55, "gem_altar", { minY: y - 0.5, maxY: y + 1.15, walkable: true });
      }
      ctx.gemAltar = { group: g, gem: gem, halo: halo, rune: rune, pos: new THREE.Vector3(pos[0], y + 2.0, z), announced: false };
    };

    /* 14. Cổng dịch chuyển điêu khắc đá + Vòng Rune xoay ma thuật */
    ctx.addPortal = function (pos, targetId, label, color) {
      var y = pos.length === 3 ? pos[1] : ctx.groundH(pos[0], pos[1]);
      var z = pos.length === 3 ? pos[2] : pos[1];
      var g = new THREE.Group();
      g.position.set(pos[0], y, z);
      var stMat = new THREE.MeshStandardMaterial({ map: MAY.PBR.stoneWall.map, normalMap: MAY.PBR.stoneWall.normalMap, color: 0xcbd5e1, roughness: 0.72 });
      [-2.05, 2.05].forEach(function (px) {
        var pil = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 3.2, 10), stMat);
        pil.position.set(px, 1.6, 0); pil.castShadow = true; pil.receiveShadow = true; g.add(pil);
      });
      var arch = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.24, 12, 28, Math.PI),
        new THREE.MeshPhysicalMaterial({ color: color || 0x4dd0ff, emissive: color || 0x4dd0ff, emissiveIntensity: 0.55, roughness: 0.25, clearcoat: 0.9 }));
      arch.position.y = 2.0; g.add(arch);
      var veil = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 3.9),
        new THREE.MeshBasicMaterial({ map: MAY.VFX.runicTex, color: color || 0x4dd0ff, transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
      veil.position.y = 2.1; g.add(veil);
      var gRune = MAY.VFX.makeRunePlane(2.6, color || 0x4dd0ff, 0.55);
      gRune.position.y = 0.08; g.add(gRune);
      var lb = MAY.makeLabel(label, { sx: 3.8, sy: 0.92, bg: "rgba(8,28,50,0.82)", color: "#ffffff" });
      lb.position.y = 4.6; g.add(lb);
      ctx.trackLabel(lb, 24);
      g.lookAt(0, y, 0);
      g.updateMatrixWorld(true);
      ctx.add(g);
      if (ctx.addCollider) {
        var lp = new THREE.Vector3(-2.05, 0, 0).applyMatrix4(g.matrixWorld);
        var rp = new THREE.Vector3(2.05, 0, 0).applyMatrix4(g.matrixWorld);
        ctx.addCollider(lp.x, lp.z, 0.46, "portal_pillar", { minY: y - 0.5, maxY: y + 3.4 });
        ctx.addCollider(rp.x, rp.z, 0.46, "portal_pillar", { minY: y - 0.5, maxY: y + 3.4 });
      }
      ctx.portals.push({ group: g, pos: new THREE.Vector3(pos[0], y + 1.5, z), targetId: targetId, label: label, veil: veil, gRune: gRune, arch: arch });
      ctx.interactives.push({
        obj: g, label: "Đi tới " + label,
        onInteract: function () {
          if (MAY.isLevelUnlocked && !MAY.isLevelUnlocked(targetId)) {
            var tm = MAY.getMeta(targetId);
            MAY.beep(260, 0.14);
            MAY.toast("🔒 Cổng tới " + (tm ? tm.shortName : label) + " đang khóa! Hoàn thành Chương " + (tm ? tm.num - 1 : 1) + " trước (hoặc bật Tự do ở Bản đồ M).");
            return;
          }
          MAY.enterLevel(targetId);
        }
      });
    };

    /* 15. Bệ nhảy nấm lò xo / bệ bật */
    ctx.addBouncePad = function (x, y, z, r, power) {
      ctx.bouncePads.push({ x: x, y: y, z: z, r: r || 1.8, power: power || 12.2 });
    };

    /* Đánh dấu hoàn thành thử thách */
    ctx.challengeDone = function (key, msg, say) {
      if (ls.challenges[key]) return;
      ls.challenges[key] = true;
      MAY.persist();
      MAY.refreshHUD();
      MAY.burstAt(MAY.player.pos.clone(), 0xffd93d, 18);
      MAY.sndStar();
      MAY.toast(msg, say || msg);
    };

    /* Mọi lối nhận Ngọc đều dùng cùng điều kiện hoàn thành trận trùm. */
    ctx.isGemReady = function () {
      return meta.num > 0 && !!(ls.story && ls.story.bossDown);
    };

    ctx.awardGem = function () {
      if (ls.gem || !ctx.isGemReady()) return;
      ls.gem = true;
      ctx.gemAwardedThisVisit = true;
      if (MAY.save.gems.indexOf(meta.num) === -1) MAY.save.gems.push(meta.num);
      if (MAY.save.gears.indexOf(meta.num) === -1) MAY.save.gears.push(meta.num);
      var secs = Math.max(1, Math.round(ctx.playSecs));
      if (!ls.bestTime || secs < ls.bestTime) ls.bestTime = secs;
      ls.playSecs = 0;
      MAY.persist();
      MAY.refreshHUD();
      MAY.sndGem();
      if (MAY.player && MAY.player.triggerVictoryAnim) MAY.player.triggerVictoryAnim();
      MAY.burstAt(MAY.player.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), meta.gemColor, 28);
      var winLevelId = ctx.id;
      var showWinFn = function () {
        if (MAY.currentLevelId !== winLevelId) return;
        if (MAY.save.gems.length >= 6 && !MAY.save.finaleSeen) {
          MAY.save.finaleSeen = true;
          MAY.persist();
          MAY.showGrandFinale();
        } else {
          MAY.showLevelWin(winLevelId, secs);
        }
      };
      if (ctx.scheduleEvent) ctx.scheduleEvent(0.9, showWinFn);
      else setTimeout(showWinFn, 900);
    };

    /* ---- Cập nhật hàng frame cho toàn bộ hệ thống màn chơi ---- */
    var compassTimer = 0, mmTimer = 0;
    var _fogLerpCol = new THREE.Color();
    var _wpTmp = new THREE.Vector3();

    function updateWaterAndFog(dt, pPos) {
      for (var wi = 0; wi < ctx.waterMeshes.length; wi++) {
        var wu = ctx.waterMeshes[wi].userData.waterUniforms;
        if (wu && wu.uPlayerPos && pPos) wu.uPlayerPos.value.copy(pPos);
      }
      if (ctx.waterLevel !== undefined && ctx.underwaterFog && ctx.landFog) {
        var camUnder = MAY.camera.position.y < ctx.waterLevel;
        if (ctx.skyMesh) ctx.skyMesh.visible = !camUnder;
        var fCfg = camUnder ? ctx.underwaterFog : ctx.landFog;
        _fogLerpCol.set(fCfg.color);
        if (!MAY.scene.fog || !MAY.scene.fog.isFogExp2) {
          MAY.scene.fog = new THREE.FogExp2(fCfg.color, fCfg.density);
        } else {
          MAY.scene.fog.color.lerp(_fogLerpCol, Math.min(1, dt * 6));
          MAY.scene.fog.density += (fCfg.density - MAY.scene.fog.density) * Math.min(1, dt * 6);
        }
        if (MAY.scene.background && MAY.scene.background.lerp) {
          MAY.scene.background.lerp(_fogLerpCol, Math.min(1, dt * 6));
        }
      }
    }

    function updateEnvParticles(dt) {
      ctx.particles.forEach(function (pt) {
        var arr = pt.pts.geometry.attributes.position;
        for (var i = 0; i < pt.count; i++) {
          var y = arr.getY(i) + pt.vy * dt;
          var x = arr.getX(i) + pt.vx * dt;
          if (y < pt.minY) y = pt.maxY;
          if (y > pt.maxY) y = pt.minY;
          if (x > pt.spread / 2) x = -pt.spread / 2;
          if (x < -pt.spread / 2) x = pt.spread / 2;
          arr.setY(i, y);
          arr.setX(i, x);
        }
        arr.needsUpdate = true;
      });
    }

    var previousPlayPosition = new THREE.Vector3();
    var previousYaw, previousPitch;
    ctx.updateAll = function (dt, t) {
      var pPos = MAY.player.pos;
      var player = MAY.player;
      var moved = Math.hypot(pPos.x - previousPlayPosition.x, pPos.z - previousPlayPosition.z) > dt * 0.08;
      var rising = player.keys.Space || player.keys.KeyC || player.vert.up || player.vert.down;
      var changedDepth = rising && Math.abs(pPos.y - previousPlayPosition.y) > dt * 0.08;
      var looking = previousYaw !== player.yaw || previousPitch !== player.pitch;
      if (MAY.started && !MAY.modalOpen && !document.hidden && previousYaw !== undefined &&
          (moved || changedDepth || looking || ctx.storyInputThisFrame)) {
        ctx.playSecs += dt;
        if (!ls.gem) ls.playSecs = Math.floor(ctx.playSecs);
      }
      previousPlayPosition.copy(pPos);
      previousYaw = player.yaw;
      previousPitch = player.pitch;
      ctx.storyInputThisFrame = false;
      if (ctx.portalCooldown > 0) ctx.portalCooldown -= dt;

      /* Đèn mặt trời & bóng đổ sắc nét đi theo Mây */
      MAY.updateSunFollow(pPos);

      /* Cập nhật vòng sóng quanh Mây & chuyển sương mù trên/dưới nước */
      updateWaterAndFog(dt, pPos);

      /* Hạt môi trường */
      updateEnvParticles(dt);

      /* Vật phẩm chính + Cột sáng dẫn đường */
      var bestItem = null, bestD = 1e9;
      ctx.collectibles.forEach(function (c) {
        if (c.taken) return;
        c.mesh.rotation.y += dt * 1.5;
        c.mesh.position.y = c.baseY + Math.sin(t * 2.2 + c.spin) * 0.25;
        c.glow.position.copy(c.mesh.position);
        c.glow.material.opacity = 0.5 + Math.sin(t * 3 + c.spin) * 0.2;
        var d = c.mesh.position.distanceTo(pPos);
        if (d < bestD) { bestD = d; bestItem = c; }
        if (d < 2.65) {
          c.taken = true;
          c.mesh.visible = false; c.label.visible = false; c.glow.visible = false;
          ls.items.push(c.idx);
          var healed = MAY.hearts < MAY.maxHearts;
          if (healed && MAY.healPlayer) MAY.healPlayer(1);
          // Optional exploration unlocks the equipment suited to this region.
          var gearReward = meta.num > 1 && ls.items.length >= 5 && MAY.save.gears.indexOf(meta.num) === -1;
          if (gearReward) MAY.save.gears.push(meta.num);
          MAY.persist();
          MAY.refreshHUD();
          MAY.sndStar();
          MAY.burstAt(c.mesh.position.clone(), c.color, 14);
          var left = meta.collectTarget - ls.items.length;
          if (gearReward) {
            var gear = MAY.GEARS[meta.num];
            MAY.toast(meta.collectIcon + " Đã tìm 5 " + meta.collectName + "! Nhận " + gear.icon + " " + gear.name + ": " + gear.desc);
          } else if (healed) {
            MAY.toast(meta.collectIcon + " " + meta.collectName + " hồi phục một trái tim!");
          } else if (left > 0) {
            MAY.toast(meta.collectIcon + " Nhặt được " + meta.collectName + "! Còn " + left + " nữa!", "Nhặt được rồi! Còn " + left + " nữa!");
          } else {
            MAY.toast(meta.collectIcon + " Đủ " + meta.collectTarget + " " + meta.collectName + " rồi! Mây giỏi quá!", "Đủ hết rồi! Mây giỏi quá!");
          }
        }
      });

      if (ctx.beacon) {
        if (bestItem) {
          ctx.beacon.visible = true;
          ctx.beacon.position.set(bestItem.mesh.position.x, bestItem.mesh.position.y + 12, bestItem.mesh.position.z);
          ctx.beacon.material.uniforms.uPulse.value = 0.13 + Math.sin(t * 3) * 0.05;
        } else if (ctx.gemAltar && !ls.gem) {
          ctx.beacon.visible = true;
          ctx.beacon.position.set(ctx.gemAltar.pos.x, ctx.gemAltar.pos.y + 12, ctx.gemAltar.pos.z);
          ctx.beacon.material.uniforms.uPulse.value = 0.22 + Math.sin(t * 4) * 0.08;
        } else {
          ctx.beacon.visible = false;
        }
      }

      /* Bạn thú */
      ctx.friends.forEach(function (f) {
        if (!f.group.visible) return;
        var jy = 0, moving = false;
        if (f.jump < 1) {
          f.jump += dt * 1.5;
          jy = Math.sin(Math.min(1, f.jump) * Math.PI) * 1.1;
          f.spinExtra += dt * 6;
        }
        if (f.following) {
          var tx = pPos.x - Math.sin(MAY.player.yaw) * 3.0 + Math.cos(MAY.player.yaw) * 1.4;
          var tz = pPos.z - Math.cos(MAY.player.yaw) * 3.0 - Math.sin(MAY.player.yaw) * 1.4;
          var dx = tx - f.group.position.x, dz = tz - f.group.position.z;
          var dd = Math.hypot(dx, dz);
          if (dd > 0.5) {
            moving = true;
            var sp = Math.min(5.2, dd * 1.8);
            f.group.position.x += dx / dd * sp * dt;
            f.group.position.z += dz / dd * sp * dt;
            f.group.rotation.y = (f.behavior === "swim" ? Math.atan2(-dz, dx) : Math.atan2(-dx, -dz)) + f.spinExtra;
          }
          if (f.behavior === "swim") {
            f.group.position.y = pPos.y + 0.35 + Math.sin(t * 2 + f.spin) * 0.15;
          } else {
            f.group.position.y = ctx.groundH(f.group.position.x, f.group.position.z) + jy;
          }
        } else if (f.behavior === "fly") {
          f.wa += dt * 0.45;
          f.group.position.x = f.hx + Math.cos(f.wa) * f.orbitR;
          f.group.position.z = f.hz + Math.sin(f.wa) * f.orbitR;
          f.group.position.y = f.baseY + Math.sin(t * 2 + f.spin) * 0.6 + jy;
          f.group.rotation.y = -f.wa;
          if (f.group.userData.wl) {
            var fl = Math.sin(t * 9 + f.spin) * 0.55;
            f.group.userData.wl.rotation.z = fl;
            f.group.userData.wr.rotation.z = -fl;
          }
        } else if (f.behavior === "swim") {
          moving = true;
          f.wa += dt * 0.25;
          f.group.position.x = f.hx + Math.cos(f.wa) * 2.2;
          f.group.position.z = f.hz + Math.sin(f.wa) * 2.2;
          f.group.position.y = f.baseY + Math.sin(t * 1.6 + f.spin) * 0.25 + jy;
          f.group.rotation.y = -f.wa - Math.PI / 2 + f.spinExtra;
        } else if (f.behavior === "still") {
          f.group.position.y = f.baseY + Math.sin(t * 1.8 + f.spin) * 0.18 + jy;
          f.group.rotation.y = Math.sin(t * 0.5 + f.spin) * 0.6 + f.spinExtra;
          if (f.group.userData.swirl) f.group.userData.swirl.rotation.z += dt * 3;
        } else {
          /* Wander trên cạn */
          f.wt -= dt;
          if (f.wt <= 0) { f.wt = 2.2 + Math.random() * 2.8; f.wa = Math.random() * 6.28; }
          var nx = f.hx + Math.cos(f.wa) * f.orbitR, nz = f.hz + Math.sin(f.wa) * f.orbitR;
          var dx2 = nx - f.group.position.x, dz2 = nz - f.group.position.z;
          var dd2 = Math.hypot(dx2, dz2);
          if (dd2 > 0.3) {
            moving = true;
            var sp2 = Math.min(1.4, dd2);
            f.group.position.x += dx2 / dd2 * sp2 * dt;
            f.group.position.z += dz2 / dd2 * sp2 * dt;
            f.group.rotation.y = Math.atan2(-dx2, -dz2) + f.spinExtra;
            f.hop += dt * 6;
          }
          var gy = ctx.groundH(f.group.position.x, f.group.position.z);
          var hopOff = f.group.userData.mixer ? 0 : Math.abs(Math.sin(f.hop)) * 0.14;
          f.group.position.y = (gy > -30 ? gy : f.baseY) + hopOff + jy;
        }
        if (f.group.userData.mixer) {
          if (f.group.userData.playClip) {
            var fc = f.behavior === "swim" ? "swim"
              : (f.jump < 1 ? (f.kind === "crab" ? "dance" : "jump")
              : (moving ? (f.following ? "run" : "walk") : "idle"));
            f.group.userData.playClip(fc);
          }
          f.group.userData.mixer.update(dt);
        }
        f.label.position.set(f.group.position.x, f.group.position.y + f.labelY, f.group.position.z);

        if (!f.met && f.group.position.distanceTo(pPos) < 4.0) {
          f.met = true;
          f.jump = 0;
          if (f.isCompanion) f.following = true;
          ls.friends.push(f.idx);
          MAY.persist();
          MAY.refreshHUD();
          MAY.sndFriend();
          MAY.burstAt(f.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff8fb8, 12);
          var gMsg = f.greetText || ("🎖️ Gặp bạn mới: " + f.name + "!");
          MAY.toast(gMsg, "Mây gặp " + f.name + " nè!");
        }
      });

      /* Bạn đồng hành chính của màn (Milo, Kiki, Bibi, Bông...) */
      if (ctx.companion) {
        var cp = ctx.companion;
        var fwdX = -Math.sin(MAY.player.yaw), fwdZ = -Math.cos(MAY.player.yaw);
        var tx = pPos.x - fwdX * 2.2 + Math.cos(MAY.player.yaw) * 1.5;
        var tz = pPos.z - fwdZ * 2.2 - Math.sin(MAY.player.yaw) * 1.5;
        if (cp.flying) {
          tx = pPos.x + fwdX * 2.2 + Math.cos(MAY.player.yaw) * 1.3;
          tz = pPos.z + fwdZ * 2.2 - Math.sin(MAY.player.yaw) * 1.3;
        }
        cp.group.position.x += (tx - cp.group.position.x) * Math.min(1, dt * 3.5);
        cp.group.position.z += (tz - cp.group.position.z) * Math.min(1, dt * 3.5);
        var cgy = ctx.groundH(cp.group.position.x, cp.group.position.z);
        if (cp.flying) {
          cp.group.position.y += ((pPos.y + 1.4 + Math.sin(t * 3.5) * 0.25) - cp.group.position.y) * Math.min(1, dt * 4);
        } else {
          var targetY = (cgy > -30 ? cgy : pPos.y - 0.8) + cp.yOff;
          cp.group.position.y += (targetY - cp.group.position.y) * Math.min(1, dt * 8);
        }
        var cdx = tx - cp.group.position.x, cdz = tz - cp.group.position.z;
        var cDist = Math.hypot(cdx, cdz);
        if (cDist > 0.15) cp.group.rotation.y = Math.atan2(-cdx, -cdz);
        if (cp.group.userData && cp.group.userData.mixer) {
          if (cp.group.userData.happyT > 0) cp.group.userData.happyT -= dt;
          var mClip = cp.flying ? "Fly" : (cp.group.userData.happyT > 0 ? "Happy" : (cDist > 0.35 ? "Run" : "Idle"));
          if (cp.group.userData.playClip) cp.group.userData.playClip(mClip);
          cp.group.userData.mixer.update(dt);
        } else {
          if (cp.group.userData.tail) cp.group.userData.tail.rotation.z = Math.sin(t * 10) * 0.5;
          if (cp.group.userData.wl) {
            var fl2 = Math.sin(t * 10) * 0.5;
            cp.group.userData.wl.rotation.z = fl2;
            cp.group.userData.wr.rotation.z = -fl2;
          }
        }
        cp.label.position.set(cp.group.position.x, cp.group.position.y + 1.7, cp.group.position.z);
      }

      /* Đồ lưu niệm */
      ctx.souvenirs.forEach(function (sv) {
        if (sv.taken) return;
        if (sv.pos.distanceTo(pPos) < 2.4) {
          sv.taken = true;
          sv.wrap.visible = false;
          ls.souvenirs.push(sv.id);
          MAY.persist();
          MAY.refreshHUD();
          MAY.sndStar();
          MAY.burstAt(sv.pos.clone(), 0xffe066, 10);
          var rem = meta.souvenirTarget - ls.souvenirs.length;
          if (rem <= 0) MAY.toast(meta.souvenirIcon + " Đủ " + meta.souvenirTarget + " " + meta.souvenirName + "! Mây giỏi quá!", "Đủ rồi! Mây giỏi quá!");
          else MAY.toast(meta.souvenirIcon + " " + sv.msg + "! (" + ls.souvenirs.length + "/" + meta.souvenirTarget + ")", sv.msg);
        }
      });

      /* Bảo vật ẩn */
      if (ctx.hidden && !ls.hidden) {
        var h = ctx.hidden;
        h.mesh.rotation.y += dt * 1.8;
        var hd = h.mesh.position.distanceTo(pPos);
        var hintRange = MAY.hasGear(4) ? 28 : 18;
        if (hd < 2.7) {
          ls.hidden = true;
          h.mesh.visible = false; h.glow.visible = false;
          MAY.persist(); MAY.refreshHUD();
          MAY.sndGem();
          MAY.burstAt(h.mesh.position.clone(), 0xffd93d, 22);
          MAY.toast("🏆 Tìm được Bảo Vật Ẩn: " + h.name + "! Mây siêu đỉnh!", "Tìm được bảo vật ẩn " + h.name + " rồi!");
        } else if (hd < hintRange && !h.hinted) {
          h.hinted = true;
          MAY.toast("✨ " + h.hint, h.hint);
        }
      }

      /* Thử thách 1: Chuỗi 5 vòng Rune tinh xảo */
      if (ctx.ringsCh) {
        var rc = ctx.ringsCh;
        rc.rings.forEach(function (m, i) {
          var cur = (i === rc.idx);
          if (m.userData.rimMat) m.userData.rimMat.emissiveIntensity = cur ? 1.1 + Math.sin(t * 4) * 0.45 : 0.22;
          if (m.userData.rune) { m.userData.rune.rotation.z += dt * (cur ? 1.6 : 0.4); m.userData.rune.material.opacity = cur ? 0.55 : 0.14; }
          m.scale.setScalar(cur ? 1.1 + Math.sin(t * 4) * 0.06 : 0.94);
        });
        if (rc.idx < rc.rings.length) {
          var rm = rc.rings[rc.idx];
          if (rm.position.distanceTo(pPos) < 3.0) {
            rc.idx++;
            MAY.sndStar();
            MAY.burstAt(rm.position.clone(), 0xffd93d, 14);
            if (MAY.player.addShake) MAY.player.addShake(0.14);
            if (rc.idx >= rc.rings.length) {
              if (MAY.VFX) MAY.VFX.spawnGrowth(pPos.clone());
              ctx.challengeDone("rings", "⭕ Xong " + rc.title + "! Mây khéo léo quá!", "Mây hoàn thành 5 vòng ánh sáng rồi!");
            } else {
              MAY.toast("⭕ Qua vòng " + rc.idx + "/" + rc.rings.length + " rồi!", "Qua vòng rồi!");
            }
          }
        }
      }

      if (ctx.raceCh) ctx.raceCh.update(dt, t);

      /* Thử thách 3: Trạm câu đố (CHỈ mở khi bấm/tương tác — không tự bật ngang màn hình khi chạy qua!) */
      if (ctx.quizStation) {
        var qs = ctx.quizStation;
        if (qs.cd > 0) qs.cd -= dt;
        qs.group.position.y = qs.baseY + Math.sin(t * 1.6) * 0.25;
        qs.group.rotation.y += dt * 0.65;
        if (qs.rune) qs.rune.rotation.z -= dt * 0.9;
      }

      /* Bệ Viên Ngọc Sắc Màu */
      if (ctx.gemAltar) {
        var ga = ctx.gemAltar;
        var ready = ctx.isGemReady();
        ga.gem.rotation.y += dt * (ready ? 2.2 : 0.7);
        ga.gem.position.y = 2.4 + Math.sin(t * 2.5) * 0.25;
        if (ga.rune) ga.rune.rotation.z += dt * (ready ? 1.6 : 0.5);
        ga.gem.material.opacity = ls.gem ? 0.35 : (ready ? 1.0 : 0.45);
        ga.halo.material.opacity = ls.gem ? 0.2 : (ready ? 0.9 : 0.3);
        if (ready && !ls.gem) {
          if (!ga.announced) {
            ga.announced = true;
            if (MAY.VFX) MAY.VFX.spawnTornado(ga.pos.clone().setY(ga.pos.y - 2.0), true);
            MAY.toast(meta.gemIcon + " " + meta.gemName + " đã thức giấc! Hãy lại gần Bệ Ngọc để nhận nhé!", meta.gemName + " đã sẵn sàng! Mây lại lấy ngọc đi nào!");
          }
          if (ga.pos.distanceTo(pPos) < 4.0) {
            ctx.awardGem();
          }
        }
      }

      /* Cổng dịch chuyển + làm mờ nhãn chữ khi ở xa cho khung hình rộng luôn sạch đẹp */
      for (var pi = 0; pi < ctx.portals.length; pi++) {
        var pt = ctx.portals[pi];
        var open = !MAY.isLevelUnlocked || MAY.isLevelUnlocked(pt.targetId);
        pt.veil.rotation.z += dt * (open ? 0.7 : 0.15);
        pt.veil.material.opacity = open ? (0.42 + Math.sin(t * 3) * 0.14) : 0.12;
        if (pt.arch && pt.arch.material) pt.arch.material.emissiveIntensity = open ? 0.55 : 0.12;
        if (pt.gRune) pt.gRune.rotation.z -= dt * (open ? 0.9 : 0.2);
        if (ctx.portalCooldown <= 0 && !MAY.modalOpen && pt.pos.distanceTo(pPos) < 1.95) {
          ctx.portalCooldown = 2.4;
          if (!open) {
            var tm = MAY.getMeta(pt.targetId);
            MAY.beep(260, 0.14);
            MAY.toast("🔒 Cổng tới " + (tm ? tm.shortName : pt.label) + " đang khóa! Hoàn thành Chương " + (tm ? tm.num - 1 : 1) + " trước (hoặc bật Tự do ở Bản đồ M).");
          } else {
            MAY.enterLevel(pt.targetId);
            return;
          }
        }
      }

      if (MAY.currentCtx !== ctx) return;
      if (ctx.updateStory) ctx.updateStory(dt, t);
      if (MAY.currentCtx !== ctx) return;
      if (MAY.VFX) MAY.VFX.update(dt);
      if (ctx.onUpdate) ctx.onUpdate(dt, t);
      if (MAY.currentCtx !== ctx) return;

      ctx.layoutWorldLabels(false);
      updateRaycast(dt, ctx);
      compassTimer -= dt;
      if (compassTimer <= 0) { compassTimer = 0.12; updateCompass(ctx); }
      mmTimer -= dt;
      if (mmTimer <= 0) { mmTimer = 0.14; drawMinimap(ctx); }
    };

    /* Cập nhật hoạt ảnh nền sống động trong lúc Cutscene 3D đang quay (không kích hoạt gameplay/damage) */
    ctx.updateCutsceneVisuals = function (dt, t) {
      var pPos = MAY.player ? MAY.player.pos : null;
      updateWaterAndFog(dt, pPos);
      updateEnvParticles(dt);
      for (var fi = 0; fi < ctx.friends.length; fi++) {
        var f = ctx.friends[fi];
        if (f.group.userData.wl && f.group.userData.wr) {
          var fl = Math.sin(t * 9 + f.spin) * 0.55;
          f.group.userData.wl.rotation.z = fl;
          f.group.userData.wr.rotation.z = -fl;
        }
        if (f.group.userData.swirl) f.group.userData.swirl.rotation.z += dt * 3;
        if (f.group.userData.mixer) {
          if (f.group.userData.playClip) f.group.userData.playClip(f.behavior === "swim" ? "swim" : "idle");
          f.group.userData.mixer.update(dt);
        }
      }
      if (ctx.companion) {
        var cp = ctx.companion;
        if (cp.group.userData && cp.group.userData.mixer) {
          if (cp.group.userData.happyT > 0) cp.group.userData.happyT -= dt;
          if (cp.group.userData.playClip) cp.group.userData.playClip(cp.flying ? "Fly" : (cp.group.userData.happyT > 0 ? "Happy" : "Idle"));
          cp.group.userData.mixer.update(dt);
        } else {
          if (cp.group.userData.tail) cp.group.userData.tail.rotation.z = Math.sin(t * 10) * 0.5;
          if (cp.group.userData.wl && cp.group.userData.wr) {
            var fl2 = Math.sin(t * 10) * 0.5;
            cp.group.userData.wl.rotation.z = fl2;
            cp.group.userData.wr.rotation.z = -fl2;
          }
        }
      }
      if (ctx.updateStoryCutscene) ctx.updateStoryCutscene(dt, t);
      ctx.layoutWorldLabels(true);
    };

    if (MAY.attachStoryEngine) MAY.attachStoryEngine(ctx);
    return ctx;
  };

  /* ---- La bàn & Minimap ---- */
  var compassIn = document.getElementById("compass-in");
  var _lastCompassHtml = "";
  var CARDINALS = [[0, "Bắc"], [45, "ĐB"], [90, "Đông"], [135, "ĐN"], [180, "Nam"], [225, "TN"], [270, "Tây"], [315, "TB"]];

  function updateCompass(ctx) {
    if (!compassIn) return;
    var heading = ((-MAY.player.yaw * 180 / Math.PI) % 360 + 360) % 360;
    var html = "";
    CARDINALS.forEach(function (c) {
      var rel = ((c[0] - heading + 540) % 360) - 180;
      if (Math.abs(rel) <= 55) html += '<span class="tick" style="left:' + (50 + rel / 110 * 100) + '%"><b>' + c[1] + "</b>|</span>";
    });
    var p = MAY.player.pos;
    var near = [];
    if (ctx.raceCh && ctx.raceCh.active) {
      var goal = ctx.raceCh.rings[ctx.raceCh.idx].position;
      near.push({ pos: goal, d: goal.distanceTo(p), icon: "🏁" });
    }
    if (ctx.storyObjective && ctx.storyObjective.targetPos) {
      near.push({ pos: ctx.storyObjective.targetPos, d: ctx.storyObjective.targetPos.distanceTo(p), icon: ctx.storyObjective.icon || "❗" });
    }
    if (ctx.sideQuestStatus && !ctx.sideQuestStatus.done && ctx.sideQuestStatus.targetPos) {
      near.push({ pos: ctx.sideQuestStatus.targetPos, d: ctx.sideQuestStatus.targetPos.distanceTo(p), icon: "📜" });
    }
    var nearItems = ctx.collectibles.filter(function (c) { return !c.taken; })
      .map(function (c) { return { pos: c.mesh.position, d: c.mesh.position.distanceTo(p), icon: ctx.meta.collectIcon }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 2);
    near = near.concat(nearItems);

    if (near.length === 0 && ctx.gemAltar && !ctx.save.gem) {
      near.push({ pos: ctx.gemAltar.pos, d: ctx.gemAltar.pos.distanceTo(p), icon: ctx.meta.gemIcon });
    }
    near.forEach(function (o) {
      var dx = o.pos.x - p.x, dz = o.pos.z - p.z;
      var ang = (Math.atan2(-dx, -dz) * 180 / Math.PI + 360) % 360;
      var rel = ((ang - heading + 540) % 360) - 180;
      if (Math.abs(rel) <= 55) {
        html += '<span class="mark" style="left:' + (50 + rel / 110 * 100) + '%">' + o.icon + "<small>" + Math.round(o.d) + "m</small></span>";
      }
    });
    if (html !== _lastCompassHtml) {
      _lastCompassHtml = html;
      compassIn.innerHTML = html;
    }
  }

  var minimap = document.getElementById("minimap");
  var mmCtx = minimap ? minimap.getContext("2d") : null;

  function drawMinimap(ctx) {
    if (!mmCtx) return;
    var S = minimap.width, C = S / 2, K = C / (ctx.worldRadius + 8);
    mmCtx.clearRect(0, 0, S, S);
    mmCtx.fillStyle = ctx.minimapBg || "rgba(4,60,95,.9)";
    mmCtx.beginPath(); mmCtx.arc(C, C, C - 2, 0, 6.29); mmCtx.fill();
    mmCtx.strokeStyle = "rgba(255,255,255,.45)";
    mmCtx.beginPath(); mmCtx.arc(C, C, C - 2, 0, 6.29); mmCtx.stroke();

    function dot(x, z, color, r) {
      mmCtx.fillStyle = color;
      mmCtx.beginPath(); mmCtx.arc(C + x * K, C + z * K, r, 0, 6.29); mmCtx.fill();
    }
    if (ctx.minimapDrawExtra) ctx.minimapDrawExtra(mmCtx, C, K);

    ctx.portals.forEach(function (pt) { dot(pt.pos.x, pt.pos.z, "#7fe3ff", 4); });
    ctx.chests.forEach(function (ch) { if (!ch.opened) dot(ch.group.position.x, ch.group.position.z, "#c98a2e", 3); });
    ctx.friends.forEach(function (f) { if (!f.met && f.group.visible) dot(f.group.position.x, f.group.position.z, "#ff8fb8", 3.2); });
    ctx.collectibles.forEach(function (c) { if (!c.taken) dot(c.mesh.position.x, c.mesh.position.z, "#ffd93d", 3.0); });
    if (ctx.enemies) ctx.enemies.forEach(function (en) { if (en.state !== "purified") dot(en.mesh.position.x, en.mesh.position.z, "#ff3b5c", 3.4); });
    if (ctx.boss && ctx.boss.active && !ctx.boss.defeated) dot(ctx.boss.pos.x, ctx.boss.pos.z, "#ff0055", 5.5);
    if (ctx.storyObjective && ctx.storyObjective.targetPos) dot(ctx.storyObjective.targetPos.x, ctx.storyObjective.targetPos.z, "#4ade80", 4.8);
    if (ctx.sideQuestStatus && !ctx.sideQuestStatus.done && ctx.sideQuestStatus.targetPos) dot(ctx.sideQuestStatus.targetPos.x, ctx.sideQuestStatus.targetPos.z, "#22d3ee", 4.2);
    if (ctx.raceCh && ctx.raceCh.active) {
      var nextRing = ctx.raceCh.rings[ctx.raceCh.idx].position;
      dot(nextRing.x, nextRing.z, "#ffee77", 5);
    }
    if (ctx.gemAltar && !ctx.save.gem) dot(ctx.gemAltar.pos.x, ctx.gemAltar.pos.z, "#ffffff", 4.2);

    var p = MAY.player.pos;
    mmCtx.save();
    mmCtx.translate(C + p.x * K, C + p.z * K);
    mmCtx.rotate(-MAY.player.yaw);
    mmCtx.fillStyle = "#fff";
    mmCtx.beginPath(); mmCtx.moveTo(0, -7); mmCtx.lineTo(5, 6); mmCtx.lineTo(-5, 6); mmCtx.closePath(); mmCtx.fill();
    mmCtx.restore();
  }

  MAY.updateHintText = function (ctx) {
    var el = document.getElementById("hint");
    if (!el || !ctx) return;
    if (MAY.player.isTouch) {
      if (ctx.id === "level6") el.textContent = "Kéo nút vàng để chạy • Giữ ⤒ trên không để lướt Cánh Mây! • Vuốt phải để nhìn";
      else if (ctx.mode === "underwater") el.textContent = "Kéo nút vàng để bơi • ▲ ▼ lên xuống • Vuốt phải để nhìn • Chạm để tương tác";
      else el.textContent = "Kéo nút vàng để đi • ⤒ nhảy • 🏃 chạy nhanh • Vuốt phải để nhìn";
    } else {
      if (ctx.id === "level6") el.textContent = "Giữ chuột kéo để xoay • W A S D chạy • Giữ Space lướt Cánh Mây! • Q/E xoay • M Bản đồ • J Sổ tay";
      else if (ctx.mode === "underwater") el.textContent = "Giữ chuột kéo để xoay • W A S D bơi • Space lên • C xuống • Q/E xoay • M Bản đồ";
      else el.textContent = "Giữ chuột kéo để xoay • W A S D đi bộ • Space nhảy • Q/E xoay • Cuộn zoom • M Bản đồ";
    }
  };

  /* ---- Quản lý các cửa sổ Overlay (Quiz, World Map, Sổ tay, Thắng màn, Lễ hội kết) ---- */
  function releasePointerLock() {
    if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
  }

  MAY.closeAllModals = function () {
    ["quiz-ov", "ov-map", "ov-album", "ov-win", "ov-finale"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    MAY.modalOpen = false;
    if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
  };

  // Keep an unfinished question in the save so closing or reloading cannot reset its attempt.
  function quizHint(q, feedback) {
    var kind = MAY.quizKind(q), match, text = "";
    feedback.textContent = "";
    if (kind === "letter") {
      match = q.q.match(/'([^']+)'/);
      if (match) {
        feedback.appendChild(document.createTextNode("Nhìn chữ đầu trong từ: "));
        var strong = document.createElement("strong");
        strong.textContent = match[1].charAt(0);
        feedback.appendChild(strong);
        feedback.appendChild(document.createTextNode(match[1].slice(1) + ". Chữ cái đầu tiên là " + q.ans + ". Dấu thanh cho biết cách đọc tiếng đó."));
        return;
      }
    }
    if (kind === "addition") {
      var nums = q.q.match(/\d+/g);
      if (nums && nums.length >= 2) text = "Gộp hai nhóm: " + "● ".repeat(+nums[0]) + "+ " + "● ".repeat(+nums[1]) + ". Đếm tất cả các chấm nhé!";
    } else if (kind === "missing") {
      text = "Bắt đầu từ " + q.q.match(/\d+/)[0] + ", đếm thêm đến " + q.q.match(/\d+/g)[1] + ". Số bước đếm là số còn thiếu.";
    } else if (kind === "subtraction") {
      var ns = q.q.match(/\d+/g);
      text = "Có " + ns[0] + ", bớt " + ns[1] + ". Hãy đếm lùi " + ns[1] + " bước từ " + ns[0] + ".";
    } else if (kind === "symbolPattern") {
      text = "Hai hình đầu lần lượt lặp lại. Hãy ghép từng cặp để tìm hình còn thiếu.";
    } else if (kind === "pattern") {
      text = "Quan sát khoảng cách giữa hai số liên tiếp rồi thêm cùng khoảng đó vào số cuối.";
    } else if (kind === "compare") {
      text = "Đếm theo thứ tự các số: số xuất hiện sau lớn hơn, số xuất hiện trước bé hơn.";
    } else if (kind === "shape") {
      text = "Hãy tưởng tượng hình và dùng ngón tay lần lượt đếm từng cạnh hoặc cánh nhọn.";
    } else if (kind === "colour") {
      text = q.ans === "Màu Cam" ? "Hai màu ấm này tạo ra màu của quả cam." : /Xanh dương và màu Vàng/.test(q.q) ? "Hãy nghĩ đến màu của lá cây." : "Hai màu này tạo ra màu của quả nho chín.";
    } else {
      var clues = { "Ốc đảo": "Giữa sa mạc có một nơi xanh mát với nước và cây.", "Lạc đà": "Bạn ấy có bướu và đi trên cát.", "Cánh cụt": "Bạn ấy mặc bộ lông như áo đen trắng và bơi rất giỏi.", "Vịnh San Hô": "Cá heo bơi ở vùng biển có nhiều san hô.", "Sa Mạc": "Nơi ấy có nhiều cát và lạc đà.", "Cat": "Tên bạn mèo bắt đầu bằng Ca.", "Bird": "Tên bạn chim bắt đầu bằng chữ B.", "Fish": "Từ tiếng Anh này bắt đầu bằng chữ F.", "Cloud": "Từ tiếng Anh này bắt đầu bằng chữ C.", "1 màu": "Đếm tiếp từ sáu đến bảy. Con đã đếm thêm mấy bước?", "2 màu": "Đếm tiếp từ năm đến bảy và giơ một ngón tay cho mỗi màu thêm.", "3 màu": "Đếm tiếp từ bốn đến bảy. Mỗi bước là một màu còn thiếu.", "7 màu": "Hãy đếm các màu cầu vồng từ đỏ đến tím.", "Thung Lũng Tuyết": "Chim cánh cụt Bông sống ở vùng lạnh phủ tuyết." };
      text = clues[q.ans] || "Hãy đọc lại câu hỏi và tìm chi tiết giúp con chọn nhé!";
    }
    feedback.textContent = text || "Hãy đọc lại câu hỏi và thử đếm nhé!";
  }

  MAY.openQuiz = function (levelId) {
    var ctx = MAY.currentCtx;
    if (!ctx) return;
    releasePointerLock();
    MAY.modalOpen = true;
    var ls = MAY.getLevelSave(levelId);
    var learning = ls.quizLearning || (ls.quizLearning = { firstRight: 0, afterHint: 0, recent: [], pending: null });
    var feedback = document.getElementById("quiz-feedback");
    var box = document.getElementById("quiz-ans");
    var panel = document.getElementById("quiz-ov");
    if (!learning.pending) learning.pending = { question: MAY.makeQuizForLevel(levelId, learning.recent), hinted: false, answered: false };

    function render() {
      var pending = learning.pending, q = pending.question;
      setText("quiz-q", q.q);
      setText("quiz-prog", "Đã đúng " + Math.min(3, ls.quizDone) + "/3 câu của màn này");
      box.innerHTML = "";
      feedback.textContent = "";
      if (pending.answered) {
        feedback.textContent = pending.revealed ? "Đáp án là " + q.ans + ". Hãy thử áp dụng vào câu khác nhé!" : "✅ Đúng rồi! Hãy thử một câu khác nhé.";
        var next = document.createElement("button");
        next.textContent = "Câu tiếp theo";
        next.onclick = function () {
          learning.pending = { question: MAY.makeQuizForLevel(levelId, learning.recent, pending.hinted ? MAY.quizKind(q) : null), hinted: false, answered: false };
          MAY.persist();
          render();
          var firstAnswer = box.querySelector("button");
          if (firstAnswer) firstAnswer.focus();
        };
        box.appendChild(next);
      } else {
        if (pending.hinted) quizHint(q, feedback);
        q.opts.forEach(function (op) {
          var button = document.createElement("button");
          button.textContent = op;
          button.setAttribute("aria-label", "Đáp án: " + op);
          button.onclick = function () {
            if (pending.answered) return;
            if (op !== q.ans) {
              if (pending.hinted) {
                pending.answered = true;
                pending.revealed = true;
                learning.recent.push(q.q);
                learning.recent = learning.recent.slice(-3);
                render();
                box.querySelector("button").focus();
                return;
              }
              pending.hinted = true;
              MAY.persist();
              quizHint(q, feedback);
              MAY.beep(220, 0.22);
              return;
            }
            pending.answered = true;
            if (pending.hinted) learning.afterHint++; else learning.firstRight++;
            learning.recent.push(q.q);
            learning.recent = learning.recent.slice(-3);
            ls.quizDone++;
            MAY.persist();
            MAY.sndStar();
            MAY.burstAt(MAY.player.pos.clone(), 0xffd93d, 14);
            if (ls.quizDone >= 3) ctx.challengeDone("quiz", "❓ Trả lời đúng 3 câu đố! Mây thông minh quá!", "Mây trả lời đúng 3 câu đố rồi!");
            render();
            var nextButton = box.querySelector("button");
            if (nextButton) nextButton.focus();
          };
          box.appendChild(button);
        });
      }
      MAY.persist();
    }
    render();
    panel.classList.remove("hidden");
    MAY.speak("Câu đố nè! " + learning.pending.question.q);
    var first = box.querySelector("button");
    if (first) first.focus();
  };

  MAY.closeQuiz = function () {
    document.getElementById("quiz-ov").classList.add("hidden");
    MAY.modalOpen = false;
    if (MAY.player && MAY.player.clearKeys) MAY.player.clearKeys();
    if (MAY.currentCtx && MAY.currentCtx.quizStation) MAY.currentCtx.quizStation.cd = 4.5;
  };

  MAY.openMap = function () {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;
    var rec = MAY.nextRecommendedLevel();
    var freeOn = !!(MAY.save.freeExplore || MAY.save.freeSpells);
    var lead = document.getElementById("map-lead");
    if (lead) {
      lead.innerHTML = freeOn
        ? "🔓 Đang ở <b>Chế độ Tự do</b> — chọn bất kỳ vùng đất nào để dịch chuyển ngay!"
        : "🧭 <b>Chế độ Cốt truyện</b>: Hoàn thành từng chương để mở khóa vùng đất tiếp theo (hoặc bấm nút Tự do bên dưới).";
    }
    var mf = document.getElementById("btn-map-free");
    if (mf) mf.textContent = freeOn ? "🔒 Quay về Chế độ Cốt truyện" : "🔓 Mở Khám phá Tự do";
    var grid = document.getElementById("map-grid");
    grid.innerHTML = "";
    MAY.LEVEL_META.forEach(function (m) {
      var ls = MAY.getLevelSave(m.id);
      var unlocked = !MAY.isLevelUnlocked || MAY.isLevelUnlocked(m.id);
      var card = document.createElement("button");
      card.className = "map-card" + (MAY.currentLevelId === m.id ? " cur" : "") + (ls.gem ? " cleared" : "") + (!unlocked ? " locked" : "");
      card.style.borderColor = unlocked ? m.theme : "rgba(148,163,184,0.35)";
      if (!unlocked) card.style.opacity = "0.58";
      card.setAttribute("aria-label", unlocked ? ("Đi tới " + m.title) : (m.title + " đang khóa, hoàn thành Chương " + (m.num - 1) + " trước"));
      var badge = "";
      if (!unlocked) badge = '<span class="mbadge">🔒 Qua Chương ' + (m.num - 1) + " trước</span>";
      else if (MAY.currentLevelId === m.id) badge = '<span class="mbadge here">Đang ở đây</span>';
      else if (ls.gem) badge = '<span class="mbadge done">' + m.gemIcon + " Đã có Ngọc</span>";
      else if (m.id === rec) badge = '<span class="mbadge rec">✨ Khuyên chơi</span>';

      var sub = m.id === "hub"
        ? "🌈 " + MAY.save.gems.length + "/6 Ngọc • 🐾 " + ls.friends.length + "/4 Bạn đảo"
        : (ls.story && ls.story.bossDown ? "Đã hạ trùm — nhận Ngọc" : "Vận dụng phép và hạ trùm để nhận Ngọc") +
          " • " + m.collectIcon + " " + ls.items.length + "/" + m.collectTarget + " hồi tim" +
          (m.num > 1 ? "; tìm 5 để nhận " + MAY.GEARS[m.num].name : "; kính lặn giúp bơi nhanh");

      if (ls.gem) {
        sub = m.id === "level1" ? "🐬 Cùng Bubi tìm lối thoát khác cho đàn cá" :
          m.id === "level4" ? "🎵 Cú Mèo có giai điệu mới trong Sổ tay" :
          m.id === "level5" ? "🐺 Sói Tuyết mời Mây đấu tập" :
          (ls.raceRecord ? "🏁 Kỷ lục đường đua " + ls.raceRecord.best.toFixed(1).replace(".", ",") + " giây" : "🏁 Có thể lập kỷ lục đường đua trong Sổ tay");
      }
      card.innerHTML = '<div class="mtop"><span class="mico">' + (unlocked ? m.icon : "🔒") + '</span><div><div class="mname">' + m.title + '</div><div class="msub">' + sub + "</div></div></div>" + badge;
      card.onclick = function () {
        if (!unlocked) {
          MAY.toast("🔒 Hãy hoàn thành Chương " + (m.num - 1) + " trước (hoặc bấm 'Mở Khám phá Tự do' bên dưới)!");
          return;
        }
        MAY.closeAllModals();
        MAY.enterLevel(m.id);
      };
      grid.appendChild(card);
    });
    document.getElementById("ov-map").classList.remove("hidden");
  };

  MAY.toggleMap = function () {
    var el = document.getElementById("ov-map");
    if (el && !el.classList.contains("hidden")) MAY.closeAllModals();
    else MAY.openMap();
  };

  MAY.openAlbum = function () {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;

    /* 6 Viên Ngọc */
    var gemsEl = document.getElementById("alb-gems");
    gemsEl.innerHTML = "";
    MAY.LEVEL_META.slice(1).forEach(function (m) {
      var got = MAY.save.gems.indexOf(m.num) !== -1;
      var d = document.createElement("div");
      d.className = "alb-chip" + (got ? " got" : "");
      d.innerHTML = '<span class="aico">' + (got ? m.gemIcon : "❔") + "</span><b>" + m.gemName + "</b><small>" + m.shortName + "</small>";
      gemsEl.appendChild(d);
    });

    /* 6 Phép Thuật Nguyên Tố (mở khóa dần theo cốt truyện) */
    var spEl = document.getElementById("alb-spells");
    if (spEl) {
      spEl.innerHTML = "";
      MAY.SPELLS.forEach(function (sp) {
        var got = MAY.isSpellUnlocked(sp.id);
        var d = document.createElement("div");
        d.className = "alb-chip" + (got ? " got" : "");
        d.innerHTML = '<span class="aico">' + (got ? sp.icon : "🔒") + "</span><b>" + sp.name + "</b><small>" + (got ? sp.desc : ("Mở khóa Chương " + sp.chapter)) + "</small>";
        spEl.appendChild(d);
      });
    }
    var freeBtn = document.getElementById("btn-free-spells");
    if (freeBtn) {
      freeBtn.textContent = MAY.save.freeSpells ? "🔒 Về Chế Độ Cốt Truyện (Mở từng phép)" : "🔓 Mở nhanh 6 Phép (Chế Độ Tự Do)";
    }

    /* 6 Trang Bị */
    var gearEl = document.getElementById("alb-gears");
    gearEl.innerHTML = "";
    [1, 2, 3, 4, 5, 6].forEach(function (n) {
      var g = MAY.GEARS[n], got = MAY.hasGear(n);
      var d = document.createElement("div");
      d.className = "alb-chip" + (got ? " got" : "");
      d.innerHTML = '<span class="aico">' + (got ? g.icon : "🔒") + "</span><b>" + g.name + "</b><small>" + g.desc + "</small>";
      gearEl.appendChild(d);
    });

    /* Tủ đồ 6 trang phục */
    var outEl = document.getElementById("alb-outfits");
    outEl.innerHTML = "";
    Object.keys(MAY.OUTFITS).forEach(function (k) {
      var o = MAY.OUTFITS[k];
      var ok = MAY.isOutfitUnlocked(k);
      var b = document.createElement("button");
      b.className = "outfit" + (MAY.save.outfit === k ? " sel" : "") + (ok ? "" : " locked");
      b.dataset.outfit = k;
      b.setAttribute("aria-label", ok ? ("Mặc trang phục " + o.name) : ("Trang phục " + o.name + " đang khóa: " + o.desc));
      b.innerHTML = '<img src="' + o.img + '" alt="' + o.name + '"><span>' + (ok ? o.name : "🔒 " + o.name) + "</span>";
      b.onclick = function () {
        if (!ok) { MAY.toast("🔒 " + o.desc); MAY.beep(260, 0.14); return; }
        MAY.applyOutfit(k);
        MAY.beep(880, 0.12);
        MAY.speak("Mây mặc bộ " + o.name + " nè!");
        MAY.openAlbum();
      };
      outEl.appendChild(b);
    });

    /* 7 Nhiệm vụ phụ tương tác thực sự */
    var sqEl = document.getElementById("alb-sidequests");
    var totSQ = 0;
    if (sqEl && MAY.SIDE_QUESTS) {
      sqEl.innerHTML = "";
      MAY.LEVEL_META.forEach(function (m) {
        var sqDef = MAY.SIDE_QUESTS[m.id];
        if (!sqDef) return;
        var lss = MAY.getLevelSave(m.id);
        var done = !!(lss.sideQuest && lss.sideQuest.done);
        var prog = (lss.sideQuest && lss.sideQuest.doneIds) ? lss.sideQuest.doneIds.length : 0;
        if (done) totSQ++;
        var available = lss.gem && !done;
        var d = document.createElement(available ? "button" : "div");
        d.className = "alb-chip" + (done ? " got" : available ? " replay-choice" : "");
        if (available) {
          d.type = "button";
          d.setAttribute("aria-label", "Gặp " + sqDef.npcName + " để chơi " + sqDef.title);
          d.onclick = function () { MAY.visitReplay(m.id, "quest"); };
        }
        d.innerHTML = '<span class="aico">' + (done ? "✅" : sqDef.icon) + "</span><b>" + sqDef.title + "</b><small>" + m.shortName + " • " + (done ? "Hoàn thành!" : (lss.sideQuest && lss.sideQuest.stage > 0 ? ("Đang làm (" + prog + ")") : ("Gặp " + sqDef.npcName))) + "</small>";
        sqEl.appendChild(d);
      });
    }

    /* Tổng kết Bảo vật ẩn & Thử thách */
    var totHidden = 0, totCh = 0, totFriends = 0;
    MAY.LEVEL_META.forEach(function (m) {
      var ls = MAY.getLevelSave(m.id);
      if (ls.hidden) totHidden++;
      totFriends += ls.friends.length;
      totCh += MAY.badgeCount(ls);
    });
    setText("alb-stats", "🎖️ " + totFriends + "/35 bạn thú • 📜 " + totSQ + "/7 nhiệm vụ phụ • 🏆 " + totCh + "/18 thử thách • 👑 " + totHidden + "/6 bảo vật ẩn");
    MAY.renderReplays();
    document.getElementById("ov-album").classList.remove("hidden");
  };
  MAY.renderAlbum = MAY.openAlbum;

  MAY.toggleAlbum = function () {
    var el = document.getElementById("ov-album");
    if (el && !el.classList.contains("hidden")) MAY.closeAllModals();
    else MAY.openAlbum();
  };

  var chapterEndings = {
    level1: "Bubi đã tự do. Đàn cá có thể bơi qua vùng nước quanh tàu đắm.",
    level2: "Cây Mẹ đã xanh trở lại. Sóc và thỏ lại có bóng mát dưới tán lá.",
    level3: "Ánh sáng đã tới đỉnh kim tự tháp. Kiki có thể đưa bạn bè về ốc đảo.",
    level4: "Hang đã sáng. Cú Mèo mời Mây ở lại chơi một bản nhạc mới.",
    level5: "Ngôi làng đã yên bình. Sói Tuyết muốn thử tài phép băng và nắng của Mây.",
    level6: "Bão đã tan. Bé Gió và các bạn lại được bay qua những cây cầu mây."
  };

  MAY.showLevelWin = function (levelId) {
    releasePointerLock();
    MAY.closeAllModals();
    MAY.modalOpen = true;
    var meta = MAY.getMeta(levelId);
    var ls = MAY.getLevelSave(levelId);
    var gear = MAY.GEARS[meta.num];

    setText("win-gem-icon", meta.gemIcon);
    setText("win-title", "MÂY ĐÃ NHẬN " + meta.gemName.toUpperCase() + "!");
    setText("win-desc", chapterEndings[levelId]);
    setText("win-rank", gear.icon + " " + gear.name + " · " + MAY.save.gems.length + "/6 Ngọc");
    setText("win-side", gear.desc);
    var side = document.getElementById("btn-win-quest");
    side.hidden = ls.sideQuest.done;
    side.textContent = "📜 " + MAY.SIDE_QUESTS[levelId].title;
    side.onclick = function () { MAY.visitReplay(levelId, "quest"); };

    var nextId = meta.num < 6 ? ("level" + (meta.num + 1)) : "hub";
    var nextMeta = MAY.getMeta(nextId);
    var btnNext = document.getElementById("btn-win-next");
    if (btnNext) {
      btnNext.textContent = "▶ Tới " + nextMeta.icon + " " + nextMeta.shortName;
      btnNext.onclick = function () { MAY.closeAllModals(); MAY.enterLevel(nextId); };
    }
    var activity = document.getElementById("btn-win-activity");
    var kind = levelId === "level1" ? "fish" : levelId === "level4" ? "music" : levelId === "level5" ? "rematch" : "race";
    activity.textContent = kind === "fish" ? "🐬 Thử lối thoát khác cùng Bubi" : kind === "music" ? "🎵 Hòa tấu cùng Cú Mèo" :
      kind === "rematch" ? "🐺 Đấu tập với Sói Tuyết" : "🏁 Đua ở " + meta.shortName;
    activity.onclick = function () { MAY.visitReplay(levelId, kind); };
    var btnHub = document.getElementById("btn-win-hub");
    if (btnHub) btnHub.onclick = function () { MAY.closeAllModals(); MAY.enterLevel("hub"); };

    document.getElementById("ov-win").classList.remove("hidden");
    MAY.speak("Hoan hô! Mây đã nhận được " + meta.gemName + "! Mây giỏi quá trời luôn!");
  };

  MAY.showGrandFinale = function () {
    releasePointerLock();
    MAY.closeAllModals();
    var showDock = function () {
      var el = document.getElementById("ov-finale");
      if (el) el.classList.remove("hidden");
      /* Thanh đại tiệc nổi gọn ở dưới cùng — giữ nguyên Lễ Hội 3D Cầu Vồng & Pháo Hoa chạy sống động phía sau! */
      MAY.modalOpen = false;
    };
    if (MAY.Cutscene && MAY.Cutscene.playGrandFinale) {
      MAY.Cutscene.playGrandFinale(showDock);
    } else {
      showDock();
      MAY.speak("Chúc mừng Mây! Mây đã gom đủ 6 Viên Ngọc Cầu Vồng! Hãy quay về Đảo Mây dự Lễ Hội Cầu Vồng cùng tất cả các bạn thú nhé!");
    }
  };

})(window.MAY);
