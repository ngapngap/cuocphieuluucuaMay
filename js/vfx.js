"use strict";
/* ============================================================================
   VFX.JS — Hệ Thống Hiệu Ứng Ma Thuật "Juicy" Chuẩn Fable 5.2 (100% Procedural Three.js)
   - Vòng tròn Rune 512x512 (mặt đất & vòng kép trên trời)
   - Shader Lốc Xoáy Cầu Vồng / Gió (Twisted Scrolling-UV Vortex Funnel)
   - Dải năng lượng xoắn ốc (Spiral Ribbons), Mưa cánh hoa/lá bay, Sương băng, Quả cầu nắng,
     Sóng tinh thể, Đài phun bong bóng, Camera Shake & Đèn chớp động
   ============================================================================ */
(function (MAY) {

  var activeFX = [];
  var activeSpellIdx = 1; /* Mặc định: 🌿 Nở Hoa */

  /* ---- Sinh Texture Vòng Tròn Phép Thuật Rune 512x512 siêu nét ---- */
  var runicTex = (function buildRunicTex() {
    var S = 512, c = document.createElement("canvas"); c.width = c.height = S;
    var g = c.getContext("2d"), cx = S / 2, cy = S / 2;
    g.clearRect(0, 0, S, S);
    g.strokeStyle = "#ffffff"; g.fillStyle = "#ffffff";

    /* Vòng răng cưa ngoài cùng (giống vòng GROWTH & TORNADO trong video!) */
    g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, 232, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, 206, 0, Math.PI * 2); g.stroke();
    for (var i = 0; i < 36; i++) {
      var a = (i / 36) * Math.PI * 2;
      g.save(); g.translate(cx + Math.cos(a) * 219, cy + Math.sin(a) * 219); g.rotate(a);
      g.fillRect(-5, -4, 12, 8);
      g.restore();
    }

    /* Vòng ký tự Rune cổ tích ở giữa */
    g.lineWidth = 4;
    g.beginPath(); g.arc(cx, cy, 162, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, cy, 148, 0, Math.PI * 2); g.stroke();
    g.font = "bold 28px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
    var glyphs = ["✦", "◈", "✧", "✺", "❂", "❖", "✴", "✹", "❋", "❈", "✶", "⟡"];
    for (var k = 0; k < 12; k++) {
      var ga = (k / 12) * Math.PI * 2;
      g.save(); g.translate(cx + Math.cos(ga) * 184, cy + Math.sin(ga) * 184); g.rotate(ga + Math.PI / 2);
      g.fillText(glyphs[k], 0, 0);
      g.restore();
    }

    /* Ngôi sao 6 cánh lồng nhau ở tâm */
    g.lineWidth = 3.5;
    [0, Math.PI / 3].forEach(function (off) {
      g.beginPath();
      for (var p = 0; p < 3; p++) {
        var pa = off + (p / 3) * Math.PI * 2;
        var px = cx + Math.cos(pa) * 144, py = cy + Math.sin(pa) * 144;
        if (p === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath(); g.stroke();
    });
    g.beginPath(); g.arc(cx, cy, 62, 0, Math.PI * 2); g.stroke();

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  })();

  /* Texture khói/sương mềm cho Frost Mist & Solar Plumes */
  var softPuffTex = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d");
    var gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, "rgba(255,255,255,0.92)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.42)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  function addFX(root, dur, updateFn) {
    MAY.worldRoot.add(root);
    activeFX.push({ root: root, age: 0, dur: dur, update: updateFn });
  }

  function makeRunePlane(radius, colorHex, opacity, worldPos) {
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({
        map: runicTex, color: colorHex, transparent: true, opacity: opacity || 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    );
    m.rotation.x = -Math.PI / 2;
    /* Căn góc nghiêng vòng Runic ôm sát sườn địa hình nếu có worldPos */
    if (worldPos && MAY.currentCtx && MAY.currentCtx.groundH) {
      var gh = MAY.currentCtx.groundH;
      var hL = gh(worldPos.x - 1.2, worldPos.z), hR = gh(worldPos.x + 1.2, worldPos.z);
      var hD = gh(worldPos.x, worldPos.z - 1.2), hU = gh(worldPos.x, worldPos.z + 1.2);
      if (hL > -30 && hR > -30 && hD > -30 && hU > -30) {
        var sx = Math.atan2(hR - hL, 2.4), sz = Math.atan2(hU - hD, 2.4);
        m.rotation.order = "XZY";
        m.rotation.x = -Math.PI / 2 + Math.max(-0.45, Math.min(0.45, sz));
        m.rotation.y = Math.max(-0.45, Math.min(0.45, -sx));
      }
    }
    return m;
  }

  function makeSpiralRibbon(radius, height, turns, colorHex) {
    var pts = [];
    for (var i = 0; i <= 24; i++) {
      var f = i / 24;
      var a = f * Math.PI * 2 * turns;
      var r = radius * (1.0 - f * 0.35);
      pts.push(new THREE.Vector3(Math.cos(a) * r, f * height, Math.sin(a) * r));
    }
    var curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, 28, 0.085, 5, false),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false })
    );
  }

  /* ---- 1. PHÉP NỞ HOA (GROWTH — chuẩn Fable 5.2: Vòng Rune + Dải xoắn + Mưa lá hoa + Hoa nở!) ---- */
  function spawnGrowth(pos) {
    var root = new THREE.Group();
    root.position.copy(pos);
    var rune = makeRunePlane(5.2, 0x86efac, 0.95, pos); rune.position.y = 0.16; root.add(rune);
    var runeInner = makeRunePlane(3.2, 0xfef08a, 0.85, pos); runeInner.position.y = 0.20; root.add(runeInner);
    var pl = new THREE.PointLight(0x4ade80, 4.5, 24); pl.position.y = 2.4; root.add(pl);

    var ribbons = [];
    for (var r = 0; r < 5; r++) {
      var rb = makeSpiralRibbon(2.4 + (r % 2) * 1.1, 6.2, 1.5, r % 2 === 0 ? 0x4ade80 : 0xfde047);
      rb.rotation.y = (r / 5) * Math.PI * 2;
      root.add(rb); ribbons.push(rb);
    }
    var petals = [], pCols = [0x4ade80, 0xfde047, 0xff7fa5, 0x86efac, 0xffffff];
    var pGeo = new THREE.PlaneGeometry(0.32, 0.18);
    for (var i = 0; i < 36; i++) {
      var pm = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: pCols[i % pCols.length], side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
      var a = Math.random() * 6.28, rad = 0.6 + Math.random() * 4.4;
      pm.position.set(Math.cos(a) * rad, 0.2 + Math.random() * 1.2, Math.sin(a) * rad);
      pm.userData = { a: a, rad: rad, vy: 1.5 + Math.random() * 2.2, spin: 3 + Math.random() * 4 };
      root.add(pm); petals.push(pm);
    }
    var blooms = [];
    for (var b = 0; b < 9; b++) {
      var ba = (b / 9) * Math.PI * 2 + 0.3, br = 1.6 + (b % 3) * 1.15;
      var fl = new THREE.Group();
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
      stem.position.y = 0.5; fl.add(stem);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: pCols[b % pCols.length], emissive: pCols[b % pCols.length], emissiveIntensity: 0.65 }));
      head.scale.set(1.3, 0.65, 1.3); head.position.y = 1.05; fl.add(head);
      fl.position.set(Math.cos(ba) * br, 0, Math.sin(ba) * br);
      fl.scale.setScalar(0.01);
      root.add(fl); blooms.push(fl);
    }

    MAY.triggerSpellFlash(0x4ade80, 0.42);
    MAY.player.addShake(0.16);
    addFX(root, 4.6, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 4) * (1 - Math.max(0, (p - 0.72) / 0.28));
      rune.rotation.z += dt * 1.1; rune.scale.setScalar(0.25 + Math.min(1, age * 2.6) * 0.85);
      runeInner.rotation.z -= dt * 1.9; runeInner.scale.setScalar(0.25 + Math.min(1, age * 3.0) * 0.85);
      rune.material.opacity = env * 0.92; runeInner.material.opacity = env * 0.85;
      pl.intensity = env * 4.2;
      ribbons.forEach(function (rb, idx) {
        rb.rotation.y += dt * (2.6 + idx * 0.2);
        rb.scale.y = Math.min(1.15, age * 1.8);
        rb.material.opacity = env * 0.72;
      });
      petals.forEach(function (pm) {
        pm.userData.a += dt * 1.8;
        pm.position.x = Math.cos(pm.userData.a) * (pm.userData.rad + age * 0.45);
        pm.position.z = Math.sin(pm.userData.a) * (pm.userData.rad + age * 0.45);
        pm.position.y += pm.userData.vy * dt;
        pm.rotation.x += dt * pm.userData.spin; pm.rotation.y += dt * 2.5;
        pm.material.opacity = env;
      });
      blooms.forEach(function (fl, idx) {
        var pop = Math.max(0, Math.min(1, (age - idx * 0.06) * 3.5));
        fl.scale.setScalar(pop * (1 - Math.max(0, (p - 0.8) / 0.2)) + 0.001);
      });
    });
  }

  /* ---- 2. PHÉP BĂNG TUYẾT (FROST — chuẩn Fable 5.2: Vòng băng sáng + Sương lạnh dày + Tinh thể băng) ---- */
  function spawnFrost(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(5.4, 0x7dd3fc, 0.95, pos); rune.position.y = 0.16; root.add(rune);
    var frostDisc = new THREE.Mesh(new THREE.CircleGeometry(5.6, 32),
      new THREE.MeshBasicMaterial({ map: softPuffTex, color: 0xbaf2ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
    frostDisc.rotation.x = -Math.PI / 2; frostDisc.position.y = 0.10; root.add(frostDisc);
    var pl = new THREE.PointLight(0x38bdf8, 4.5, 24); pl.position.y = 2.0; root.add(pl);

    var mists = [];
    for (var m = 0; m < 18; m++) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softPuffTex, color: 0xe0f7ff, transparent: true, opacity: 0.55, depthWrite: false }));
      var a = (m / 18) * Math.PI * 2, r = 0.8 + Math.random() * 4.2;
      sp.position.set(Math.cos(a) * r, 0.7 + Math.random() * 0.8, Math.sin(a) * r);
      sp.scale.setScalar(2.4 + Math.random() * 2.2);
      sp.userData = { dx: Math.cos(a) * 0.7, dz: Math.sin(a) * 0.7 };
      root.add(sp); mists.push(sp);
    }
    var shards = [];
    var sGeo = new THREE.OctahedronGeometry(0.32, 0); sGeo.scale(0.5, 1.8, 0.5);
    for (var s = 0; s < 14; s++) {
      var sh = new THREE.Mesh(sGeo, new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 0.9, roughness: 0.1, clearcoat: 1.0, transparent: true, opacity: 0.9 }));
      var sa = (s / 14) * Math.PI * 2, sr = 1.8 + (s % 3) * 1.1;
      sh.position.set(Math.cos(sa) * sr, 0.5, Math.sin(sa) * sr);
      sh.rotation.z = (s % 2 === 0 ? 1 : -1) * 0.25;
      root.add(sh); shards.push(sh);
    }

    MAY.triggerSpellFlash(0x7dd3fc, 0.44);
    MAY.player.addShake(0.18);
    addFX(root, 4.5, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 4.5) * (1 - Math.max(0, (p - 0.7) / 0.3));
      rune.rotation.z -= dt * 0.8; rune.scale.setScalar(0.2 + Math.min(1, age * 3.0) * 0.85);
      rune.material.opacity = env * 0.9; frostDisc.material.opacity = env * 0.72;
      pl.intensity = env * 4.4;
      mists.forEach(function (sp) {
        sp.position.x += sp.userData.dx * dt; sp.position.z += sp.userData.dz * dt;
        sp.position.y += dt * 0.18;
        sp.material.opacity = env * 0.48;
      });
      shards.forEach(function (sh, idx) {
        sh.rotation.y += dt * 2.5;
        sh.position.y = 0.6 + Math.sin(age * 3 + idx) * 0.25;
        sh.scale.setScalar(Math.min(1, age * 5) * env + 0.001);
      });
    });
  }

  /* ---- 3. LỐC CẦU VỒNG (TORNADO — chuẩn Fable 5.2: Vòng Rune Kép Trên Trời + Phễu Xoáy UV Shader + Mảnh bay!) ---- */
  function spawnTornado(pos, isRainbow) {
    var root = new THREE.Group(); root.position.copy(pos);
    var skyRune1 = makeRunePlane(6.8, 0x7fe3ff, 0.92); skyRune1.position.y = 14.5; root.add(skyRune1);
    var skyRune2 = makeRunePlane(4.4, 0xffa8e2, 0.90); skyRune2.position.y = 11.8; root.add(skyRune2);
    var groundRune = makeRunePlane(4.6, 0xffd93d, 0.88, pos); groundRune.position.y = 0.18; root.add(groundRune);

    /* Phễu lốc xoáy Scrolling-UV Twisted Noise Shader */
    var funnelGeo = new THREE.CylinderGeometry(4.4, 0.75, 14.5, 32, 24, true);
    funnelGeo.translate(0, 7.25, 0);
    var funnelMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: MAY.shaderUniforms.uTime,
        uAlpha: { value: 0.0 },
        uColA: { value: new THREE.Color(isRainbow !== false ? 0xff4da6 : 0xff6b1a) },
        uColB: { value: new THREE.Color(isRainbow !== false ? 0xffcb3b : 0xffdb4d) },
        uColC: { value: new THREE.Color(isRainbow !== false ? 0x22d3ee : 0xff3b00) }
      },
      transparent: true, blending: THREE.NormalBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: [
        "uniform float uTime;",
        "varying vec2 vUv;",
        "void main(){",
        "  vUv = uv;",
        "  vec3 p = position;",
        "  float sway = sin(uv.y * 5.0 - uTime * 4.5) * 0.65 * uv.y;",
        "  p.x += sway; p.z += cos(uv.y * 4.2 - uTime * 3.8) * 0.55 * uv.y;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uTime, uAlpha; uniform vec3 uColA, uColB, uColC; varying vec2 vUv;",
        "void main(){",
        "  float twist = vUv.x * 6.28318 * 3.0 + vUv.y * 18.0 - uTime * 7.8;",
        "  float bands = sin(twist) * 0.5 + 0.5;",
        "  float bands2 = sin(twist * 1.65 - vUv.y * 9.0 + uTime * 4.2) * 0.5 + 0.5;",
        "  float dens = pow(bands * 0.68 + bands2 * 0.32, 1.45);",
        "  vec3 col = mix(uColA, uColB, smoothstep(0.15, 0.78, vUv.y));",
        "  col = mix(col, uColC, smoothstep(0.32, 0.88, bands2) * 0.72);",
        "  col = mix(col, vec3(0.68, 0.36, 0.98), smoothstep(0.55, 0.95, 1.0 - bands) * 0.45);",
        "  float edge = smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.78, vUv.y);",
        "  gl_FragColor = vec4(col * (1.12 + bands * 0.35), clamp(dens * edge * uAlpha * 0.92, 0.0, 0.94));",
        "}"
      ].join("\n")
    });
    var funnel = new THREE.Mesh(funnelGeo, funnelMat);
    root.add(funnel);

    var pl = new THREE.PointLight(0xffb3ec, 5.2, 34); pl.position.y = 6.5; root.add(pl);

    /* Sao & mảnh sáng quay vòng quanh phễu lốc ở nhiều độ cao */
    var orbiters = [], orbCols = [0xff595e, 0xffca3a, 0x8ac926, 0x38bdf8, 0xd980fa];
    for (var i = 0; i < 26; i++) {
      var om = new THREE.Mesh(MAY.starGeo, new THREE.MeshBasicMaterial({ color: orbCols[i % orbCols.length] }));
      om.userData.sharedGeo = true;
      om.scale.setScalar(0.32 + (i % 3) * 0.14);
      om.userData = { a: (i / 26) * 6.28, y: 0.6 + (i / 26) * 12.5, sp: 3.4 + (i % 4) * 0.7 };
      root.add(om); orbiters.push(om);
    }

    MAY.triggerSpellFlash(0xf472b6, 0.55);
    MAY.player.addShake(0.32);
    addFX(root, 5.5, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 3.0) * (1 - Math.max(0, (p - 0.72) / 0.28));
      skyRune1.rotation.z += dt * 1.4; skyRune2.rotation.z -= dt * 2.2; groundRune.rotation.z += dt * 1.8;
      skyRune1.material.opacity = env * 0.9; skyRune2.material.opacity = env * 0.88; groundRune.material.opacity = env * 0.85;
      funnelMat.uniforms.uAlpha.value = env;
      funnel.scale.set(0.3 + Math.min(1, age * 2.5) * 0.7, Math.min(1, age * 2.2), 0.3 + Math.min(1, age * 2.5) * 0.7);
      pl.intensity = env * 5.0;
      orbiters.forEach(function (om) {
        om.userData.a += dt * om.userData.sp;
        var r = 1.4 + (om.userData.y / 14) * 4.4;
        om.position.set(Math.cos(om.userData.a) * r, om.userData.y, Math.sin(om.userData.a) * r);
        om.rotation.y += dt * 4; om.rotation.x += dt * 3;
        om.scale.setScalar(Math.max(0.01, env * 0.42));
      });
    });
  }

  /* ---- 4. TIA NẮNG RỰC RỠ (SOLAR — lấy cảm hứng quả cầu rực rỡ Explosion trong Fable 5.2!) ---- */
  function spawnSolar(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(5.2, 0xffb703, 0.95, pos); rune.position.y = 0.18; root.add(rune);
    var pl = new THREE.PointLight(0xffa726, 6.0, 30); pl.position.y = 3.2; root.add(pl);

    var plumes = [];
    for (var i = 0; i < 14; i++) {
      var col = i < 4 ? 0xfff3b0 : (i < 9 ? 0xffb703 : 0xfb8500);
      var m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15 + Math.random() * 0.8, 2),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false }));
      var a = (i / 14) * Math.PI * 2, r = i < 4 ? 0.5 : (1.5 + Math.random() * 1.8);
      m.position.set(Math.cos(a) * r, 1.0 + Math.random() * 1.5, Math.sin(a) * r);
      m.userData = { vx: Math.cos(a) * 1.1, vy: 1.8 + Math.random() * 1.8, vz: Math.sin(a) * 1.1 };
      root.add(m); plumes.push(m);
    }
    MAY.burstAt(pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xffd93d, 22);
    MAY.triggerSpellFlash(0xffa726, 0.62);
    MAY.player.addShake(0.35);

    addFX(root, 3.2, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 6) * (1 - Math.max(0, (p - 0.55) / 0.45));
      rune.rotation.z += dt * 2.2; rune.scale.setScalar(0.3 + p * 1.25); rune.material.opacity = env * 0.9;
      pl.intensity = env * 6.0;
      plumes.forEach(function (m) {
        m.position.x += m.userData.vx * dt; m.position.y += m.userData.vy * dt; m.position.z += m.userData.vz * dt;
        m.scale.setScalar(0.4 + p * 1.7);
        m.material.opacity = env * 0.75;
      });
    });
  }

  /* ---- 5. PHA LÊ ÂM VANG (CRYSTAL — Vòng sao pha lê + Sóng âm vang sáng hang) ---- */
  function spawnCrystal(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(5.5, 0xc084fc, 0.95, pos); rune.position.y = 0.18; root.add(rune);
    var wave = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.1, 36),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    wave.rotation.x = -Math.PI / 2; wave.position.y = 0.35; root.add(wave);
    var pl = new THREE.PointLight(0xc084fc, 6.2, 42); pl.position.y = 3.0; root.add(pl);

    var prisms = [];
    var geo = new THREE.OctahedronGeometry(0.48, 0); geo.scale(0.6, 1.7, 0.6);
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2;
      var pr = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: i % 2 === 0 ? 0xd8b4fe : 0x67e8f9, emissive: i % 2 === 0 ? 0xa855f7 : 0x06b6d4, emissiveIntensity: 1.1, clearcoat: 1.0 }));
      pr.position.set(Math.cos(a) * 2.8, 0.6, Math.sin(a) * 2.8);
      root.add(pr); prisms.push(pr);
    }
    MAY.triggerSpellFlash(0xc084fc, 0.5);
    MAY.player.addShake(0.2);

    addFX(root, 4.0, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 5) * (1 - Math.max(0, (p - 0.7) / 0.3));
      rune.rotation.z -= dt * 1.5; rune.material.opacity = env * 0.92;
      wave.scale.setScalar(1 + p * 10.5); wave.material.opacity = Math.max(0, 1 - p * 1.5);
      pl.intensity = env * 6.0;
      prisms.forEach(function (pr, idx) {
        pr.rotation.y += dt * 3;
        pr.position.y = 1.0 + Math.sin(age * 3.5 + idx) * 0.45 + p * 1.4;
        pr.scale.setScalar(Math.max(0.01, env));
      });
    });
  }

  /* ---- 6. SÓNG BỌT BIỂN (WAVE — Đài phun bong bóng lấp lánh + Vòng xoáy ngọc lam) ---- */
  function spawnWave(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(4.8, 0x38bdf8, 0.95, pos); rune.position.y = 0.18; root.add(rune);
    var pl = new THREE.PointLight(0x38bdf8, 4.2, 24); pl.position.y = 2.0; root.add(pl);
    var rb1 = makeSpiralRibbon(2.2, 5.2, 1.5, 0x38bdf8); root.add(rb1);
    var rb2 = makeSpiralRibbon(2.8, 5.2, 1.5, 0x99f6e4); rb2.rotation.y = Math.PI; root.add(rb2);

    var bubs = [], bGeo = new THREE.SphereGeometry(0.18, 10, 8);
    var bMat = new THREE.MeshPhysicalMaterial({ color: 0xe0fbff, roughness: 0.05, clearcoat: 1.0, transparent: true, opacity: 0.75 });
    for (var i = 0; i < 32; i++) {
      var b = new THREE.Mesh(bGeo, bMat);
      var a = Math.random() * 6.28, r = Math.random() * 2.8;
      b.position.set(Math.cos(a) * r, 0.3 + Math.random() * 1.2, Math.sin(a) * r);
      b.scale.setScalar(0.5 + Math.random() * 1.1);
      b.userData = { vy: 1.8 + Math.random() * 2.2, ph: Math.random() * 6 };
      root.add(b); bubs.push(b);
    }
    MAY.triggerSpellFlash(0x38bdf8, 0.38);
    MAY.player.addShake(0.14);

    addFX(root, 4.0, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 4) * (1 - Math.max(0, (p - 0.72) / 0.28));
      rune.rotation.z += dt * 1.4; rune.material.opacity = env * 0.9;
      rb1.rotation.y += dt * 3.0; rb2.rotation.y -= dt * 2.4;
      rb1.material.opacity = env * 0.7; rb2.material.opacity = env * 0.7;
      pl.intensity = env * 4.0;
      bubs.forEach(function (b) {
        b.position.y += b.userData.vy * dt;
        b.position.x += Math.sin(age * 4 + b.userData.ph) * 0.4 * dt;
      });
    });
  }

  /* ---- Vòng Thử Thách & Cổng Rune Tinh Xảo (thay vòng neon arcade đơn điệu!) ---- */
  function makeOrnateRing(radius, colorHex, emissiveHex) {
    var g = new THREE.Group();
    var rimMat = new THREE.MeshStandardMaterial({
      color: colorHex || 0xffd93d, emissive: emissiveHex || 0xaa7700, emissiveIntensity: 0.55,
      metalness: 0.75, roughness: 0.25
    });
    var main = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.13, 12, 32), rimMat);
    g.add(main);
    var inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.88, 0.045, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 }));
    g.add(inner);
    /* 6 viên pha lê nhỏ đính quanh vòng */
    var pipGeo = new THREE.OctahedronGeometry(0.22, 0);
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      var pip = new THREE.Mesh(pipGeo, new THREE.MeshPhysicalMaterial({ color: colorHex || 0xffd93d, emissive: colorHex || 0xffd93d, emissiveIntensity: 0.85, clearcoat: 1.0 }));
      pip.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      g.add(pip);
    }
    var rune = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2.05, radius * 2.05),
      new THREE.MeshBasicMaterial({ map: runicTex, color: colorHex || 0xffd93d, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    g.add(rune);
    g.userData.rimMat = rimMat;
    g.userData.rune = rune;
    return g;
  }

  /* Note: makeRunePlane đã xoay mặt phẳng về XZ nên hoạt ảnh xoay mặt đất dùng rotation.y thay vì rotation.z */
  /* ---- Hiệu ứng Giải Đố & Đấu Trùm (v10.0: Cảnh báo đòn đỏ, Dây leo trói, Tia Laser Gương, Cột Băng, Mảnh Vỡ!) ---- */
  function spawnTelegraph(pos, radius, dur, colorHex) {
    var root = new THREE.Group();
    root.position.set(pos.x, pos.y + 0.14, pos.z);
    var col = colorHex || 0xff3b5c;
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.78, radius, 28),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);
    var fill = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 0.78, 28),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
    );
    fill.rotation.x = -Math.PI / 2;
    fill.scale.setScalar(0.05);
    root.add(fill);
    addFX(root, dur || 0.95, function (age, d) {
      var p = Math.min(1, age / d);
      fill.scale.setScalar(0.08 + p * 0.92);
      fill.material.opacity = 0.18 + p * 0.35;
      ring.material.opacity = 0.65 + Math.sin(age * 24) * 0.25;
    });
  }

  function spawnVineTrap(pos, dur) {
    var root = new THREE.Group();
    root.position.copy(pos);
    var vines = [];
    for (var i = 0; i < 4; i++) {
      var rb = makeSpiralRibbon(1.25 + (i % 2) * 0.35, 2.8, 1.5, i % 2 === 0 ? 0x22c55e : 0xfef08a);
      rb.rotation.y = (i / 4) * Math.PI * 2;
      root.add(rb);
      vines.push(rb);
    }
    var flGeo = new THREE.SphereGeometry(0.28, 7, 6);
    var flCols = [0xff5c8a, 0xffd93d, 0xffffff, 0xf472b6];
    for (var f = 0; f < 8; f++) {
      var fl = new THREE.Mesh(flGeo, new THREE.MeshStandardMaterial({ color: flCols[f % flCols.length], emissive: flCols[f % flCols.length], emissiveIntensity: 0.45 }));
      var a = (f / 8) * Math.PI * 2;
      fl.position.set(Math.cos(a) * 1.15, 0.5 + (f % 3) * 0.75, Math.sin(a) * 1.15);
      root.add(fl);
    }
    addFX(root, dur || 3.2, function (age, d, dt) {
      var env = Math.min(1, age * 6) * (1 - Math.max(0, (age / d - 0.8) / 0.2));
      root.scale.set(env, Math.min(1, age * 4) * env, env);
      root.rotation.y += dt * 0.9;
    });
  }

  function spawnLaserBeam(fromPos, toPos, colorHex, persistent) {
    var dir = new THREE.Vector3().subVectors(toPos, fromPos);
    var len = dir.length();
    var g = new THREE.Group();
    var core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, len, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: colorHex || 0xffe066, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    var glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, len, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: colorHex || 0xff9f1c, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    core.rotation.x = Math.PI / 2;
    glow.rotation.x = Math.PI / 2;
    g.add(core, glow);
    g.position.copy(fromPos).add(toPos).multiplyScalar(0.5);
    g.lookAt(toPos);
    if (persistent) {
      MAY.worldRoot.add(g);
      return g;
    }
    addFX(g, 1.4, function (age, d) {
      var env = 1 - age / d;
      core.material.opacity = env * 0.9;
      glow.material.opacity = env * 0.32;
    });
    return g;
  }

  function spawnIcePillar(pos, dur) {
    var root = new THREE.Group();
    root.position.copy(pos);
    var pil = new THREE.Mesh(
      new THREE.ConeGeometry(1.35, 3.8, 7),
      new THREE.MeshPhysicalMaterial({ color: 0xbbe8ff, emissive: 0x38bdf8, emissiveIntensity: 0.55, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.92 })
    );
    pil.position.y = 1.9;
    pil.castShadow = true;
    root.add(pil);
    addFX(root, dur || 5.5, function (age, d) {
      var env = Math.min(1, age * 6) * (1 - Math.max(0, (age / d - 0.82) / 0.18));
      pil.scale.set(env, Math.min(1, age * 5) * env, env);
    });
    return root;
  }

  function spawnShatterBurst(pos, colorHex) {
    var root = new THREE.Group();
    root.position.copy(pos);
    var geo = new THREE.DodecahedronGeometry(0.38, 0);
    var mat = new THREE.MeshStandardMaterial({ color: colorHex || 0xc084fc, emissive: colorHex || 0x7e22ce, emissiveIntensity: 0.45, roughness: 0.35, flatShading: true });
    var chunks = [];
    for (var i = 0; i < 14; i++) {
      var c = new THREE.Mesh(geo, mat);
      c.userData.sharedGeo = true;
      var a = Math.random() * 6.28, sp = 3.2 + Math.random() * 5.2;
      c.userData.vx = Math.cos(a) * sp;
      c.userData.vy = 4.0 + Math.random() * 5.5;
      c.userData.vz = Math.sin(a) * sp;
      c.scale.setScalar(0.5 + Math.random() * 0.9);
      root.add(c);
      chunks.push(c);
    }
    addFX(root, 1.8, function (age, d, dt) {
      var env = 1 - age / d;
      chunks.forEach(function (c) {
        c.userData.vy -= 14 * dt;
        c.position.x += c.userData.vx * dt;
        c.position.y += c.userData.vy * dt;
        c.position.z += c.userData.vz * dt;
        c.rotation.x += dt * 5; c.rotation.y += dt * 4;
        c.scale.setScalar(Math.max(0.01, env * 0.85));
      });
    });
  }

  /* ---- Điều khiển chọn & thi triển 6 Phép Thuật của Mây (có mở khóa dần theo Cốt Truyện!) ---- */
  function firstUnlockedIdx() {
    for (var i = 0; i < MAY.SPELLS.length; i++) {
      if (MAY.isSpellUnlocked(MAY.SPELLS[i].id)) return i;
    }
    return -1;
  }

  function syncSpellUI() {
    var unlockedAny = firstUnlockedIdx();
    if (unlockedAny !== -1 && !MAY.isSpellUnlocked(MAY.SPELLS[activeSpellIdx].id)) {
      activeSpellIdx = unlockedAny;
    }
    var sp = MAY.SPELLS[activeSpellIdx];
    var isCurUnlocked = sp && MAY.isSpellUnlocked(sp.id);

    document.querySelectorAll(".spell-slot").forEach(function (el, idx) {
      var sItem = MAY.SPELLS[idx];
      var unl = sItem && MAY.isSpellUnlocked(sItem.id);
      el.classList.toggle("locked", !unl);
      el.classList.toggle("active", unl && idx === activeSpellIdx);
    });

    var lbl = document.getElementById("spell-name");
    if (lbl) {
      lbl.textContent = isCurUnlocked
        ? (sp.icon + " " + sp.name.toUpperCase() + " — BẤM R ĐỂ DÙNG")
        : "🔒 CHƯA THỨC TỈNH PHÉP — GẶP NPC (!)";
    }
    if (MAY.player && MAY.player.setStaffSpell) {
      MAY.player.setStaffSpell(isCurUnlocked ? sp : { color: 0x8b6f4e });
    }
  }

  MAY.selectSpell = function (idx, silent) {
    if (idx < 0 || idx >= MAY.SPELLS.length) return;
    var sp = MAY.SPELLS[idx];
    if (!MAY.isSpellUnlocked(sp.id)) {
      if (!silent) {
        MAY.beep(240, 0.12, "triangle", 0.06);
        MAY.toast("🔒 Phép " + sp.icon + " " + sp.name + " mở khóa ở Chương " + sp.chapter + "! (Hoặc bật Mở Nhanh trong 📖 Sổ Tay)");
      }
      return;
    }
    activeSpellIdx = idx;
    syncSpellUI();
    if (!silent) MAY.beep(660 + idx * 70, 0.08, "triangle", 0.06);
  };

  var castCooldown = 0;
  MAY.castActiveSpell = function () {
    if (!MAY.started || MAY.modalOpen || !MAY.currentCtx || castCooldown > 0) return;
    var sp = MAY.SPELLS[activeSpellIdx];
    if (!sp || !MAY.isSpellUnlocked(sp.id)) {
      var fi = firstUnlockedIdx();
      if (fi === -1) {
        MAY.beep(220, 0.14, "triangle", 0.06);
        MAY.toast("✨ Gậy Phép chưa có phép nào! Hãy trò chuyện với NPC mang dấu (!) để thức tỉnh phép đầu tiên nhé!");
        return;
      }
      activeSpellIdx = fi;
      sp = MAY.SPELLS[fi];
      syncSpellUI();
    }
    castCooldown = 0.72;
    var p = MAY.player.pos;
    var fwdX = -Math.sin(MAY.player.yaw), fwdZ = -Math.cos(MAY.player.yaw);
    var tx = p.x + fwdX * 6.5, tz = p.z + fwdZ * 6.5;
    var gh = MAY.currentCtx.groundH(tx, tz);
    var ty = MAY.player.onLand ? (gh > -30 ? gh : p.y - 0.9) : p.y - 0.8;
    var target = new THREE.Vector3(tx, ty, tz);

    if (MAY.player.triggerCastAnim) MAY.player.triggerCastAnim();
    if (MAY.sndSpell) MAY.sndSpell(sp.id);

    if (sp.id === "growth") spawnGrowth(target);
    else if (sp.id === "frost") spawnFrost(target);
    else if (sp.id === "tornado") {
      spawnTornado(target, true);
      /* Tạo cột khí nâng vật lý thật 5.2s để Mây nhảy vào bay vọt lên đảo cao! */
      if (MAY.currentCtx.addUpdraft) MAY.currentCtx.addUpdraft(target.x, target.y, target.z, 3.8, 5.2);
    }
    else if (sp.id === "solar") spawnSolar(target);
    else if (sp.id === "crystal") spawnCrystal(target);
    else spawnWave(target);

    /* Tương tác phép thuật thực chiến: Giải đố môi trường, Hồi sinh cây, Quái vật & Boss! */
    if (MAY.dispatchSpellImpact) {
      MAY.dispatchSpellImpact(sp.id, target, p.clone());
    }

    /* Giữ tương tác vui với hoa/san hô/xương rồng/pha lê gần điểm cast */
    var ctx = MAY.currentCtx;
    if (ctx && ctx.interactives) {
      ctx.interactives.forEach(function (it) {
        if (it.isProp && it.obj && it.obj.position.distanceTo(target) < 8.5 && it.onInteract) {
          it.onInteract(it);
        }
      });
    }
  };

  MAY.VFX = {
    runicTex: runicTex,
    softPuffTex: softPuffTex,
    makeRunePlane: makeRunePlane,
    makeOrnateRing: makeOrnateRing,
    spawnGrowth: spawnGrowth,
    spawnFrost: spawnFrost,
    spawnTornado: spawnTornado,
    spawnSolar: spawnSolar,
    spawnCrystal: spawnCrystal,
    spawnWave: spawnWave,
    spawnTelegraph: spawnTelegraph,
    spawnVineTrap: spawnVineTrap,
    spawnLaserBeam: spawnLaserBeam,
    spawnIcePillar: spawnIcePillar,
    spawnShatterBurst: spawnShatterBurst,
    syncSpellUI: syncSpellUI,
    clear: function () {
      activeFX.length = 0;
    },
    update: function (dt) {
      if (castCooldown > 0) castCooldown -= dt;
      for (var i = activeFX.length - 1; i >= 0; i--) {
        var fx = activeFX[i];
        fx.age += dt;
        if (fx.age >= fx.dur) {
          MAY.worldRoot.remove(fx.root);
          fx.root.traverse(function (o) {
            if (o.isLight && o.shadow && o.shadow.map) {
              try { o.shadow.map.dispose(); o.shadow.map = null; } catch (e) {}
            }
            if (o.isMesh || o.isPoints || o.isLine) {
              if (o.geometry && !o.userData.sharedGeo) try { o.geometry.dispose(); } catch (e) {}
              if (o.material && o.material.dispose) try { o.material.dispose(); } catch (e) {}
            } else if (o.isSprite && o.material) try { o.material.dispose(); } catch (e) {}
          });
          activeFX.splice(i, 1);
        } else {
          fx.update(fx.age, fx.dur, dt);
        }
      }
    }
  };

})(window.MAY);
