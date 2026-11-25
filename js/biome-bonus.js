"use strict";
(function (MAY) {
  // Optional, post-gem observations. The labels on the three markers are the evidence.
  var puzzles = {
    level1: {
      title: "Dấu đường của Bubi", pos: [-22, 5, 8], color: 0x43c6d8,
      items: ["San hô · ●●", "Vỏ ốc · ●", "San hô · ●"], icons: ["coral", "shell", "coral"],
      clues: ["Đàn cá cần nơi trú: tìm san hô có HAI bọt.", "Dấu đường về là vỏ ốc có MỘT bọt.", "Tìm san hô có MỘT bọt."], order: [0, 1],
      story: "Bubi đưa cá tới san hô có hai bọt, rồi theo vỏ ốc có một bọt về nhà."
    },
    level2: {
      title: "Dấu hạt của Sóc", pos: [-24, 10], color: 0x74bd70,
      items: ["Hạt sồi · ●●", "Lá non · ●", "Hạt sồi · ●"], icons: ["acorn", "leaf", "acorn"],
      clues: ["Cất hạt sồi có HAI lá.", "Đánh dấu kho bằng lá non có MỘT giọt sương.", "Để phần bạn nhỏ: chọn hạt sồi có MỘT lá."], order: [2, 1, 0],
      story: "Sóc chia hạt ít lá cho bạn, dùng lá có giọt sương đánh dấu kho, rồi cất hạt nhiều lá."
    },
    level3: {
      title: "Dấu giếng cát", pos: [22, 24], color: 0xe7b550,
      items: ["Mặt trời · ●●", "Bình nước · ●", "Mặt trời · ●"], icons: ["sun", "water", "sun"],
      clues: ["Tìm đường bằng dấu mặt trời có HAI vạch.", "Lấy bình nước có MỘT vạch.", "Tìm dấu mặt trời có MỘT vạch ở giếng."], order: [1, 0, 2],
      story: "Cáo lấy bình nước, theo mặt trời nhiều vạch, rồi tìm mặt trời ít vạch ở giếng."
    },
    level4: {
      title: "Dấu nhạc trong hang", pos: [-23, 32], color: 0xb898ea,
      items: ["Chuông · ●●", "Trống · ●", "Chuông · ●"], icons: ["bell", "drum", "bell"],
      clues: ["Ngân chuông có HAI nhịp.", "Gõ trống có MỘT nhịp.", "Ngân chuông có MỘT nhịp."], order: [2, 1, 0],
      story: "Cú Mèo gọi dàn nhạc bằng chuông ngắn, trống, rồi chuông dài. Một chấm là một nhịp."
    },
    level5: {
      title: "Dấu chân trên tuyết", pos: [25, 28], color: 0x83cce8,
      items: ["Dấu chân · ●●", "Mái nhà · ●", "Dấu chân · ●"], icons: ["paw", "home", "paw"],
      clues: ["Theo dấu chân có HAI bông tuyết.", "Tìm mái nhà có MỘT bông tuyết.", "Theo dấu chân có MỘT bông tuyết."], order: [2, 0, 1],
      story: "Chim cánh cụt theo dấu chân ít bông, rồi nhiều bông, để về mái nhà."
    },
    level6: {
      title: "Dấu gió trên mây", pos: [5, 46], color: 0xe99bc5,
      items: ["Chuông gió · ●●", "Cánh mây · ●", "Chuông gió · ●"], icons: ["chime", "cloud", "chime"],
      clues: ["Ghé chuông gió có HAI dải.", "Ghé cánh mây có MỘT dải.", "Ghé chuông gió có MỘT dải."], order: [0, 2, 1],
      story: "Gió qua chuông nhiều dải, chuông ít dải rồi đưa tiếng nhạc tới cánh mây."
    }
  };

  MAY.getBiomeBonusTitle = function (levelId) {
    return puzzles[levelId] ? puzzles[levelId].title : "";
  };

  MAY.installBiomeBonus = function (ctx) {
    var spec = puzzles[ctx.id];
    if (!spec || ctx.biomeClueInstalled) return;
    if (!ctx.save.gem) {
      // Do not build optional scenery during the required campaign.
      var award = ctx.awardGem;
      ctx.awardGem = function () {
        var result = award.apply(ctx, arguments);
        if (ctx.save.gem) MAY.installBiomeBonus(ctx);
        return result;
      };
      return;
    }
    ctx.biomeClueInstalled = true;
    var x = spec.pos[0], z = spec.pos.length === 3 ? spec.pos[2] : spec.pos[1];
    var water = ctx.id === "level1", baseY = water ? spec.pos[1] : ctx.groundH(x, z);
    var root = new THREE.Group();
    root.position.set(x, baseY, z); root.visible = !!ctx.save.gem; ctx.add(root);
    var standGeo = new THREE.CylinderGeometry(0.32, 0.42, 1.0, 8);
    var standMat = new THREE.MeshStandardMaterial({ color: 0x665d56, roughness: 0.9 });
    var iconMat = new THREE.MeshStandardMaterial({ color: spec.color, emissive: spec.color, emissiveIntensity: 0.25, roughness: 0.7 });
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xffedaa, emissive: 0xffd56c, emissiveIntensity: 0.2, roughness: 0.8 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x604e42, roughness: 0.9 });
    var shapeGeo = { sphere: new THREE.SphereGeometry(1, 10, 7), box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 10), cone: new THREE.ConeGeometry(1, 1, 8) };
    function iconFor(kind) {
      var g = new THREE.Group();
      function part(type, mat, px, py, pz, sx, sy, sz) {
        var m = new THREE.Mesh(shapeGeo[type], mat); m.position.set(px, py, pz); m.scale.set(sx, sy, sz); g.add(m); return m;
      }
      if (kind === "coral") {
        [-1, 0, 1].forEach(function (side) { var p = part("cylinder", iconMat, side * 0.22, side ? -0.03 : 0.12, 0, 0.10, side ? 0.58 : 0.84, 0.10); p.rotation.z = side * -0.35; });
      } else if (kind === "shell") {
        part("sphere", lightMat, 0, 0, 0, 0.43, 0.32, 0.17);
        part("cone", iconMat, 0, 0.05, -0.08, 0.28, 0.65, 0.25);
      } else if (kind === "acorn") {
        part("sphere", lightMat, 0, -0.08, 0, 0.31, 0.41, 0.28);
        part("cylinder", darkMat, 0, 0.25, 0, 0.34, 0.15, 0.31);
      } else if (kind === "leaf") {
        var leaf = part("sphere", iconMat, 0, 0, 0, 0.24, 0.52, 0.09); leaf.rotation.z = -0.45;
        part("cylinder", lightMat, 0, -0.37, 0, 0.035, 0.32, 0.035);
      } else if (kind === "sun") {
        part("sphere", lightMat, 0, 0, 0, 0.27, 0.27, 0.14);
        for (var r = 0; r < 8; r++) { var a = r * Math.PI / 4; var ray = part("box", lightMat, Math.sin(a) * 0.44, Math.cos(a) * 0.44, 0, 0.09, 0.22, 0.08); ray.rotation.z = -a; }
      } else if (kind === "water") {
        part("cylinder", iconMat, 0, -0.05, 0, 0.29, 0.58, 0.24); part("cylinder", lightMat, 0, 0.31, 0, 0.14, 0.15, 0.14);
      } else if (kind === "bell") {
        part("cone", iconMat, 0, 0, 0, 0.38, 0.7, 0.3); part("sphere", lightMat, 0, -0.35, 0, 0.11, 0.11, 0.1);
      } else if (kind === "drum") {
        part("cylinder", iconMat, 0, 0, 0, 0.38, 0.55, 0.31); part("cylinder", lightMat, 0, 0.29, 0, 0.4, 0.08, 0.33);
      } else if (kind === "paw") {
        part("sphere", darkMat, 0, -0.14, 0, 0.33, 0.23, 0.10);
        [-1, 0, 1].forEach(function (side) { part("sphere", darkMat, side * 0.25, 0.20, 0, 0.12, 0.17, 0.10); });
      } else if (kind === "home") {
        part("box", lightMat, 0, -0.05, 0, 0.55, 0.5, 0.32); part("cone", iconMat, 0, 0.42, 0, 0.5, 0.52, 0.4);
      } else if (kind === "chime") {
        part("box", lightMat, 0, 0.42, 0, 0.85, 0.1, 0.1);
        [-1, 0, 1].forEach(function (side) { part("box", iconMat, side * 0.24, -0.02, 0, 0.12, 0.65 - Math.abs(side) * 0.1, 0.1); });
      } else if (kind === "cloud") {
        [-1, 0, 1].forEach(function (side) { part("sphere", lightMat, side * 0.25, side ? -0.08 : 0.08, 0, 0.3, 0.25, 0.2); });
      }
      return g;
    }
    var banner = MAY.makeLabel("🔎 " + spec.title, { w: 480, sx: 4.4, sy: 0.8, bg: "rgba(20,37,52,.94)", color: "#ffffff" });
    banner.position.set(0, 3.1, 2); root.add(banner); ctx.trackLabel(banner, 30, 3);
    var beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), iconMat);
    beacon.position.set(0, 1.45, 2); root.add(beacon);
    var options = [];
    spec.items.forEach(function (text, i) {
      var group = new THREE.Group(), stand = new THREE.Mesh(standGeo, standMat), icon = iconFor(spec.icons[i]);
      // Keep all three signs in the narrow mobile camera without changing their order.
      var offsetX = (i - 1) * (window.innerWidth < 600 ? 2.0 : 3.4);
      var offsetY = water ? 0 : ctx.groundH(x + offsetX, z - 3) - baseY;
      group.position.set(offsetX, offsetY, -3); stand.position.y = 0.5; icon.position.y = 1.5;
      group.add(stand, icon);
      var dotCount = i === 0 ? 2 : 1;
      for (var dot = 0; dot < dotCount; dot++) {
        var marker = new THREE.Mesh(shapeGeo.sphere, lightMat);
        // Put the count on the front of the pedestal, below the floating label.
        marker.position.set((dot - (dotCount - 1) / 2) * 0.36, 0.65, 0.39); marker.scale.setScalar(0.14); group.add(marker);
      }
      var label = MAY.makeLabel(String.fromCharCode(65 + i) + " · " + text, { w: 480, sx: 2.8, sy: 0.68, bg: "rgba(20,37,52,.94)", color: "#ffffff" });
      label.position.y = 2.65; group.add(label);
      root.add(group); group.visible = false; options.push(group);
    });
    var active = false, phase = 0, errors = 0, backwards = false, sequence = [], panel = null;
    function record() {
      var rec = ctx.save.challenges.biomeClue;
      if (!rec || typeof rec !== "object" || Array.isArray(rec)) rec = ctx.save.challenges.biomeClue = { wins: 0, perfects: 0, attempts: 0 };
      ["wins", "perfects", "attempts"].forEach(function (k) { rec[k] = Math.max(0, Math.floor(Number(rec[k]) || 0)); });
      return rec;
    }
    function showCard(message) {
      if (!panel) return;
      panel.querySelector("p").textContent = message;
    }
    function keydown(event) {
      if (!active || MAY.modalOpen || MAY.dialogueOpen || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      var n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[event.code];
      if (n === undefined) return;
      event.preventDefault(); event.stopImmediatePropagation(); choose(n);
    }
    function leave() {
      if (!active) return;
      active = false; ctx.biomeClueActive = false;
      window.removeEventListener("keydown", keydown, true);
      options.forEach(function (g) { g.visible = false; });
      beacon.visible = true; banner.visible = true;
      if (panel) { panel.remove(); panel = null; }
    }
    ctx.leaveBiomeClue = leave;
    function choose(i) {
      if (!active) return;
      if (i !== sequence[phase]) {
        errors++;
        showCard("Chưa khớp. Hãy đọc tên và đếm các chấm trên ba dấu. " + spec.clues[sequence[phase]]);
        MAY.beep(260, 0.10, "sine", 0.04); return;
      }
      MAY.sndChime(i); MAY.burstAt(options[i].getWorldPosition(new THREE.Vector3()), spec.color, 12);
      phase++;
      if (phase < sequence.length) {
        showCard("Đúng rồi! Bước " + (phase + 1) + "/" + sequence.length + ". " + (backwards ? "Đi ngược câu chuyện: " : "") + spec.story); return;
      }
      var rec = record(); rec.wins++; if (!errors) rec.perfects++; MAY.persist();
      var message = "⭐ " + spec.title + ": đã lưu kỷ niệm lần " + rec.wins + (errors ? "." : " · không sai!");
      leave(); MAY.sndStar(); MAY.toast(message);
    }
    function start(teleport) {
      if (!ctx.save.gem || MAY.currentCtx !== ctx) return false;
      if (active) return true;
      if (ctx.raceCh) ctx.raceCh.cancel();
      if (ctx.leaveFishRescue) ctx.leaveFishRescue();
      if (ctx.leaveCrystalEncore) ctx.leaveCrystalEncore();
      if (ctx.leaveBossRematch) ctx.leaveBossRematch();
      ctx.visitingSideQuest = false;
      var rec = record(); rec.attempts++; MAY.persist();
      backwards = !!(rec.wins % 2); sequence = spec.order.slice(); if (backwards) sequence.reverse(); phase = 0; errors = 0;
      active = true; ctx.biomeClueActive = true; options.forEach(function (g) { g.visible = true; });
      beacon.visible = false; banner.visible = false;
      if (teleport) MAY.player.spawnAt(x, water ? baseY + 1 : ctx.groundH(x, z + 4) + 1.05, z + 4, 0, water);
      panel = document.createElement("aside"); panel.setAttribute("aria-label", spec.title); panel.setAttribute("role", "region");
      panel.style.cssText = "position:fixed;z-index:9;top:8px;left:50%;transform:translateX(-50%);width:min(92vw,480px);max-height:35vh;overflow:auto;padding:10px 12px;border-radius:14px;background:rgba(12,32,48,.94);color:white;text-align:center;box-shadow:0 3px 14px #0008;font-size:15px";
      var title = document.createElement("strong"); title.textContent = "🔎 " + spec.title; panel.appendChild(title);
      var description = document.createElement("p"); description.style.margin = "5px 0"; description.setAttribute("role", "status"); description.setAttribute("aria-live", "polite"); panel.appendChild(description);
      ["A · 1", "B · 2", "C · 3"].forEach(function (label, i) {
        var button = document.createElement("button"); button.type = "button"; button.className = "btn small"; button.textContent = label + " · " + spec.items[i];
        button.setAttribute("aria-label", "Chọn " + label + ": " + spec.items[i]); button.onclick = function () { choose(i); }; panel.appendChild(button);
      });
      var close = document.createElement("button"); close.type = "button"; close.className = "btn small"; close.textContent = "Để sau"; close.onclick = leave; panel.appendChild(close);
      document.body.appendChild(panel); window.addEventListener("keydown", keydown, true);
      showCard((backwards ? "Lần này đi ngược câu chuyện. " : "") + spec.story + " Bước 1/" + sequence.length + ": quan sát ba dấu rồi chọn A, B hoặc C.");
      return true;
    }
    ctx.startBiomeClue = function () { return start(true); };
    ctx.interactives.push({ obj: beacon, label: "🔎 " + spec.title, isActive: function () { return !!ctx.save.gem && !active; }, onInteract: function () { start(false); } });
    options.forEach(function (group, i) {
      ctx.interactives.push({ obj: group, label: "Chọn " + String.fromCharCode(65 + i) + " · " + spec.items[i], isActive: function () { return active; }, onInteract: function () { choose(i); } });
    });
    var previousUpdate = ctx.onUpdate;
    ctx.onUpdate = function (dt, t) {
      if (previousUpdate) previousUpdate.call(ctx, dt, t);
      root.visible = !!ctx.save.gem;
      if (root.visible) beacon.rotation.y += dt * 0.8;
    };
  };
})(window.MAY);
