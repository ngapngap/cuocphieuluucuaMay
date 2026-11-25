"use strict";
/* ============================================================================
   VFX.JS — Hệ Thống Hiệu Ứng Ma Thuật "Juicy" Chuẩn Fable 5.2 (Tối Ưu 0-Lag v13.3!)
   - KHÔNG tạo/xóa PointLight động (dùng MAY.spellLight cố định -> 0 biên dịch lại shader!)
   - Geometry & Material dùng chung (sharedGeo / sharedMat) -> 0 cấp phát nặng khi tung phép!
   - Vòng tròn Rune 512x512, Phễu Lốc Xoáy UV Shader, Dải xoắn ốc, Mưa cánh hoa,
     Sương băng, Quả cầu nắng, Sóng tinh thể, Đài phun bong bóng & Đèn chớp động
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

  /* ---- Kho Geometry VFX Dùng Chung (tạo 1 lần duy nhất lúc boot -> 0 cấp phát GPU mỗi lần tung phép!) ---- */
  var G_UNIT_PLANE = new THREE.PlaneGeometry(2, 2);
  var G_PETAL      = new THREE.PlaneGeometry(0.32, 0.18);
  var G_STEM       = new THREE.CylinderGeometry(0.05, 0.07, 1.0, 6);
  var G_HEAD       = new THREE.SphereGeometry(0.28, 8, 6);
  var G_FROST_DISC = new THREE.CircleGeometry(5.6, 24);
  var G_SHARD      = (function () { var g = new THREE.OctahedronGeometry(0.32, 0); g.scale(0.5, 1.8, 0.5); return g; })();
  var G_FUNNEL     = (function () { var g = new THREE.CylinderGeometry(4.4, 0.75, 14.5, 24, 16, true); g.translate(0, 7.25, 0); return g; })();
  var G_PLUME      = new THREE.IcosahedronGeometry(1.0, 1);
  var G_WAVE_RING  = new THREE.RingGeometry(0.6, 1.1, 28);
  var G_PRISM      = (function () { var g = new THREE.OctahedronGeometry(0.48, 0); g.scale(0.6, 1.7, 0.6); return g; })();
  var G_BUBBLE     = new THREE.SphereGeometry(0.18, 8, 6);
  var G_ICE_PILLAR = new THREE.ConeGeometry(1.35, 3.8, 7);
  var G_PIP        = new THREE.OctahedronGeometry(0.22, 0);
  var G_TEL_RING   = new THREE.RingGeometry(0.78, 1.0, 24);
  var G_TEL_FILL   = new THREE.CircleGeometry(0.78, 24);
  var G_RIBBON     = (function () {
    var pts = [];
    for (var i = 0; i <= 20; i++) {
      var f = i / 20;
      var a = f * Math.PI * 3.0;
      var r = 1.0 - f * 0.35;
      pts.push(new THREE.Vector3(Math.cos(a) * r, f, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.042, 5, false);
  })();

  if (MAY.protectGeometry) {
    [G_UNIT_PLANE, G_PETAL, G_STEM, G_HEAD, G_FROST_DISC, G_SHARD, G_FUNNEL, G_PLUME, G_WAVE_RING, G_PRISM, G_BUBBLE, G_ICE_PILLAR, G_PIP, G_TEL_RING, G_TEL_FILL, G_RIBBON].forEach(MAY.protectGeometry);
  }

  /* Điều khiển đèn phép cố định MAY.spellLight (0 thêm/xóa PointLight -> 0 recompile shader!) */
  var _spellLightReq = null;
  function requestSpellLight(x, y, z, colorHex, intensity, distance) {
    if (!MAY.spellLight || intensity <= 0.02) return;
    if (!_spellLightReq || intensity > _spellLightReq.intensity) {
      _spellLightReq = { x: x, y: y, z: z, colorHex: colorHex, intensity: intensity, distance: distance || 28 };
    }
  }

  function disposeFXRoot(root) {
    if (!root) return;
    var disposedMats = new Set();
    root.traverse(function (o) {
      if (o.isMesh || o.isPoints || o.isLine) {
        if (o.geometry && !o.userData.sharedGeo) try { o.geometry.dispose(); } catch (e) {}
        if (o.material && o.material.dispose && !disposedMats.has(o.material.uuid)) {
          disposedMats.add(o.material.uuid);
          if (!o.material.userData || !o.material.userData.sharedMat) {
            try { o.material.dispose(); } catch (e) {}
          }
        }
      } else if (o.isSprite && o.material && !disposedMats.has(o.material.uuid)) {
        disposedMats.add(o.material.uuid);
        if (!o.material.userData || !o.material.userData.sharedMat) {
          try { o.material.dispose(); } catch (e) {}
        }
      }
    });
  }

  function addFX(root, dur, updateFn) {
    /* Giới hạn tối đa 10 hiệu ứng đồng thời để tránh tụt FPS khi spam phép */
    if (activeFX.length >= 10) {
      var oldest = activeFX.shift();
      MAY.worldRoot.remove(oldest.root);
      disposeFXRoot(oldest.root);
    }
    MAY.worldRoot.add(root);
    activeFX.push({ root: root, age: 0, dur: dur, update: updateFn });
  }

  function makeRunePlane(radius, colorHex, opacity, worldPos) {
    var m = new THREE.Mesh(
      G_UNIT_PLANE,
      new THREE.MeshBasicMaterial({
        map: runicTex, color: colorHex, transparent: true, opacity: opacity || 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
      })
    );
    m.userData.sharedGeo = true;
    m.userData.baseScale = radius || 1;
    m.scale.setScalar(radius || 1);
    m.rotation.x = -Math.PI / 2;
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

  function makeSpiralRibbon(radius, height, turns, colorHex, sharedMat) {
    var m = new THREE.Mesh(
      G_RIBBON,
      sharedMat || new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    m.userData.sharedGeo = true;
    m.scale.set(radius, height, radius);
    return m;
  }

  /* ---- 1. PHÉP NỞ HOA (GROWTH) ---- */
  function spawnGrowth(pos) {
    var root = new THREE.Group();
    root.position.copy(pos);
    var rune = makeRunePlane(5.2, 0x86efac, 0.95, pos); rune.position.y = 0.16; root.add(rune);
    var runeInner = makeRunePlane(3.2, 0xfef08a, 0.85, pos); runeInner.position.y = 0.20; root.add(runeInner);

    var ribMatA = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false });
    var ribMatB = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false });
    var ribbons = [];
    for (var r = 0; r < 4; r++) {
      var rb = makeSpiralRibbon(2.4 + (r % 2) * 1.1, 6.2, 1.5, 0x4ade80, r % 2 === 0 ? ribMatA : ribMatB);
      rb.rotation.y = (r / 4) * Math.PI * 2;
      root.add(rb); ribbons.push(rb);
    }

    var pCols = [0x4ade80, 0xfde047, 0xff7fa5, 0x86efac, 0xffffff];
    var pMats = pCols.map(function (c) {
      return new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    });
    var petals = [];
    for (var i = 0; i < 20; i++) {
      var pm = new THREE.Mesh(G_PETAL, pMats[i % pMats.length]);
      var a = Math.random() * 6.28, rad = 0.6 + Math.random() * 4.4;
      pm.position.set(Math.cos(a) * rad, 0.2 + Math.random() * 1.2, Math.sin(a) * rad);
      pm.userData = { sharedGeo: true, a: a, rad: rad, vy: 1.5 + Math.random() * 2.2, spin: 3 + Math.random() * 4 };
      root.add(pm); petals.push(pm);
    }

    var stemMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
    var headMats = pCols.map(function (c) {
      return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.65, roughness: 0.45 });
    });
    var blooms = [];
    for (var b = 0; b < 7; b++) {
      var ba = (b / 7) * Math.PI * 2 + 0.3, br = 1.6 + (b % 3) * 1.15;
      var fl = new THREE.Group();
      var stem = new THREE.Mesh(G_STEM, stemMat); stem.userData.sharedGeo = true;
      stem.position.y = 0.5; fl.add(stem);
      var head = new THREE.Mesh(G_HEAD, headMats[b % headMats.length]); head.userData.sharedGeo = true;
      head.scale.set(1.3, 0.65, 1.3); head.position.y = 1.05; fl.add(head);
      fl.position.set(Math.cos(ba) * br, 0, Math.sin(ba) * br);
      fl.scale.setScalar(0.01);
      root.add(fl); blooms.push(fl);
    }

    MAY.triggerSpellFlash(0x4ade80, 0.42);
    MAY.player.addShake(0.16);
    var lx = pos.x, ly = pos.y + 2.4, lz = pos.z;
    addFX(root, 4.4, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 4) * (1 - Math.max(0, (p - 0.72) / 0.28));
      var rSc1 = 0.25 + Math.min(1, age * 2.6) * 0.85;
      var rSc2 = 0.25 + Math.min(1, age * 3.0) * 0.85;
      rune.rotation.z += dt * 1.1; rune.scale.setScalar(5.2 * rSc1);
      runeInner.rotation.z -= dt * 1.9; runeInner.scale.setScalar(3.2 * rSc2);
      rune.material.opacity = env * 0.92; runeInner.material.opacity = env * 0.85;
      requestSpellLight(lx, ly, lz, 0x4ade80, env * 4.2, 24);
      ribMatA.opacity = env * 0.72; ribMatB.opacity = env * 0.72;
      for (var ri = 0; ri < ribbons.length; ri++) {
        ribbons[ri].rotation.y += dt * (2.6 + ri * 0.2);
        ribbons[ri].scale.y = 6.2 * Math.min(1.15, age * 1.8);
      }
      for (var mi = 0; mi < pMats.length; mi++) pMats[mi].opacity = env;
      for (var pi = 0; pi < petals.length; pi++) {
        var pm = petals[pi];
        pm.userData.a += dt * 1.8;
        pm.position.x = Math.cos(pm.userData.a) * (pm.userData.rad + age * 0.45);
        pm.position.z = Math.sin(pm.userData.a) * (pm.userData.rad + age * 0.45);
        pm.position.y += pm.userData.vy * dt;
        pm.rotation.x += dt * pm.userData.spin; pm.rotation.y += dt * 2.5;
      }
      for (var bi = 0; bi < blooms.length; bi++) {
        var pop = Math.max(0, Math.min(1, (age - bi * 0.06) * 3.5));
        blooms[bi].scale.setScalar(pop * (1 - Math.max(0, (p - 0.8) / 0.2)) + 0.001);
      }
    });
  }

  /* ---- 2. PHÉP BĂNG TUYẾT (FROST) ---- */
  function spawnFrost(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(5.4, 0x7dd3fc, 0.95, pos); rune.position.y = 0.16; root.add(rune);
    var frostDisc = new THREE.Mesh(G_FROST_DISC,
      new THREE.MeshBasicMaterial({ map: softPuffTex, color: 0xbaf2ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
    frostDisc.userData.sharedGeo = true;
    frostDisc.rotation.x = -Math.PI / 2; frostDisc.position.y = 0.10; root.add(frostDisc);

    var mistMat = new THREE.SpriteMaterial({ map: softPuffTex, color: 0xe0f7ff, transparent: true, opacity: 0.55, depthWrite: false });
    var mists = [];
    for (var m = 0; m < 10; m++) {
      var sp = new THREE.Sprite(mistMat);
      var a = (m / 10) * Math.PI * 2, r = 0.8 + Math.random() * 4.2;
      sp.position.set(Math.cos(a) * r, 0.7 + Math.random() * 0.8, Math.sin(a) * r);
      sp.scale.setScalar(2.6 + Math.random() * 2.0);
      sp.userData = { dx: Math.cos(a) * 0.7, dz: Math.sin(a) * 0.7 };
      root.add(sp); mists.push(sp);
    }

    var shardMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, emissive: 0x38bdf8, emissiveIntensity: 0.95, roughness: 0.14, metalness: 0.2, transparent: true, opacity: 0.9 });
    var shards = [];
    for (var s = 0; s < 10; s++) {
      var sh = new THREE.Mesh(G_SHARD, shardMat);
      sh.userData.sharedGeo = true;
      var sa = (s / 10) * Math.PI * 2, sr = 1.8 + (s % 3) * 1.1;
      sh.position.set(Math.cos(sa) * sr, 0.5, Math.sin(sa) * sr);
      sh.rotation.z = (s % 2 === 0 ? 1 : -1) * 0.25;
      root.add(sh); shards.push(sh);
    }

    MAY.triggerSpellFlash(0x7dd3fc, 0.44);
    MAY.player.addShake(0.18);
    var lx = pos.x, ly = pos.y + 2.0, lz = pos.z;
    addFX(root, 4.3, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 4.5) * (1 - Math.max(0, (p - 0.7) / 0.3));
      rune.rotation.z -= dt * 0.8; rune.scale.setScalar(5.4 * (0.2 + Math.min(1, age * 3.0) * 0.85));
      rune.material.opacity = env * 0.9; frostDisc.material.opacity = env * 0.72;
      mistMat.opacity = env * 0.48;
      requestSpellLight(lx, ly, lz, 0x38bdf8, env * 4.4, 24);
      for (var mi = 0; mi < mists.length; mi++) {
        var sp = mists[mi];
        sp.position.x += sp.userData.dx * dt; sp.position.z += sp.userData.dz * dt;
        sp.position.y += dt * 0.18;
      }
      var sSc = Math.min(1, age * 5) * env + 0.001;
      for (var si = 0; si < shards.length; si++) {
        var sh = shards[si];
        sh.rotation.y += dt * 2.5;
        sh.position.y = 0.6 + Math.sin(age * 3 + si) * 0.25;
        sh.scale.setScalar(sSc);
      }
    });
  }

  /* ---- 3. LỐC CẦU VỒNG (TORNADO) ---- */
  var _tornadoVS = [
    "uniform float uTime;",
    "varying vec2 vUv;",
    "void main(){",
    "  vUv = uv;",
    "  vec3 p = position;",
    "  float sway = sin(uv.y * 5.0 - uTime * 4.5) * 0.65 * uv.y;",
    "  p.x += sway; p.z += cos(uv.y * 4.2 - uTime * 3.8) * 0.55 * uv.y;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
    "}"
  ].join("\n");
  var _tornadoFS = [
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
  ].join("\n");

  function spawnTornado(pos, isRainbow) {
    var root = new THREE.Group(); root.position.copy(pos);
    var skyRune1 = makeRunePlane(6.8, 0x7fe3ff, 0.92); skyRune1.position.y = 14.5; root.add(skyRune1);
    var skyRune2 = makeRunePlane(4.4, 0xffa8e2, 0.90); skyRune2.position.y = 11.8; root.add(skyRune2);
    var groundRune = makeRunePlane(4.6, 0xffd93d, 0.88, pos); groundRune.position.y = 0.18; root.add(groundRune);

    var funnelMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: MAY.shaderUniforms.uTime,
        uAlpha: { value: 0.0 },
        uColA: { value: new THREE.Color(isRainbow !== false ? 0xff4da6 : 0xff6b1a) },
        uColB: { value: new THREE.Color(isRainbow !== false ? 0xffcb3b : 0xffdb4d) },
        uColC: { value: new THREE.Color(isRainbow !== false ? 0x22d3ee : 0xff3b00) }
      },
      transparent: true, blending: THREE.NormalBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: _tornadoVS,
      fragmentShader: _tornadoFS
    });
    var funnel = new THREE.Mesh(G_FUNNEL, funnelMat);
    funnel.userData.sharedGeo = true;
    root.add(funnel);

    var orbCols = [0xff595e, 0xffca3a, 0x8ac926, 0x38bdf8, 0xd980fa];
    var orbMats = orbCols.map(function (c) { return new THREE.MeshBasicMaterial({ color: c }); });
    var orbiters = [];
    for (var i = 0; i < 18; i++) {
      var om = new THREE.Mesh(MAY.starGeo, orbMats[i % orbMats.length]);
      om.scale.setScalar(0.32 + (i % 3) * 0.14);
      om.userData = { sharedGeo: true, a: (i / 18) * 6.28, y: 0.6 + (i / 18) * 12.5, sp: 3.4 + (i % 4) * 0.7 };
      root.add(om); orbiters.push(om);
    }

    MAY.triggerSpellFlash(0xf472b6, 0.55);
    MAY.player.addShake(0.32);
    var lx = pos.x, ly = pos.y + 6.5, lz = pos.z;
    addFX(root, 5.5, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 3.0) * (1 - Math.max(0, (p - 0.72) / 0.28));
      skyRune1.rotation.z += dt * 1.4; skyRune2.rotation.z -= dt * 2.2; groundRune.rotation.z += dt * 1.8;
      skyRune1.material.opacity = env * 0.9; skyRune2.material.opacity = env * 0.88; groundRune.material.opacity = env * 0.85;
      funnelMat.uniforms.uAlpha.value = env;
      funnel.scale.set(0.3 + Math.min(1, age * 2.5) * 0.7, Math.min(1, age * 2.2), 0.3 + Math.min(1, age * 2.5) * 0.7);
      requestSpellLight(lx, ly, lz, 0xffb3ec, env * 5.0, 34);
      var oSc = Math.max(0.01, env * 0.42);
      for (var oi = 0; oi < orbiters.length; oi++) {
        var om = orbiters[oi];
        om.userData.a += dt * om.userData.sp;
        var r = 1.4 + (om.userData.y / 14) * 4.4;
        om.position.set(Math.cos(om.userData.a) * r, om.userData.y, Math.sin(om.userData.a) * r);
        om.rotation.y += dt * 4; om.rotation.x += dt * 3;
        om.scale.setScalar(oSc);
      }
    });
  }

  /* ---- 4. TIA NẮNG RỰC RỠ (SOLAR) ---- */
  function spawnSolar(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(5.2, 0xffb703, 0.95, pos); rune.position.y = 0.18; root.add(rune);

    var pMats = [0xfff3b0, 0xffb703, 0xfb8500].map(function (col) {
      return new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false });
    });
    var plumes = [];
    for (var i = 0; i < 10; i++) {
      var mIdx = i < 3 ? 0 : (i < 7 ? 1 : 2);
      var m = new THREE.Mesh(G_PLUME, pMats[mIdx]);
      var a = (i / 10) * Math.PI * 2, r = i < 3 ? 0.5 : (1.5 + Math.random() * 1.8);
      m.position.set(Math.cos(a) * r, 1.0 + Math.random() * 1.5, Math.sin(a) * r);
      m.userData = { sharedGeo: true, baseR: 1.15 + Math.random() * 0.7, vx: Math.cos(a) * 1.1, vy: 1.8 + Math.random() * 1.8, vz: Math.sin(a) * 1.1 };
      root.add(m); plumes.push(m);
    }
    MAY.burstAt(pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xffd93d, 18);
    MAY.triggerSpellFlash(0xffa726, 0.62);
    MAY.player.addShake(0.35);

    var lx = pos.x, ly = pos.y + 3.2, lz = pos.z;
    addFX(root, 3.2, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 6) * (1 - Math.max(0, (p - 0.55) / 0.45));
      rune.rotation.z += dt * 2.2; rune.scale.setScalar(5.2 * (0.3 + p * 1.25)); rune.material.opacity = env * 0.9;
      requestSpellLight(lx, ly, lz, 0xffa726, env * 5.8, 30);
      for (var mi = 0; mi < pMats.length; mi++) pMats[mi].opacity = env * 0.75;
      for (var pi = 0; pi < plumes.length; pi++) {
        var m = plumes[pi];
        m.position.x += m.userData.vx * dt; m.position.y += m.userData.vy * dt; m.position.z += m.userData.vz * dt;
        m.scale.setScalar(m.userData.baseR * (0.4 + p * 1.65));
      }
    });
  }

  /* ---- 5. PHA LÊ ÂM VANG (CRYSTAL) ---- */
  function spawnCrystal(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(5.5, 0xc084fc, 0.95, pos); rune.position.y = 0.18; root.add(rune);
    var wave = new THREE.Mesh(G_WAVE_RING,
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    wave.userData.sharedGeo = true;
    wave.rotation.x = -Math.PI / 2; wave.position.y = 0.35; root.add(wave);

    var pMatA = new THREE.MeshStandardMaterial({ color: 0xd8b4fe, emissive: 0xa855f7, emissiveIntensity: 1.15, roughness: 0.16, metalness: 0.25 });
    var pMatB = new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x06b6d4, emissiveIntensity: 1.15, roughness: 0.16, metalness: 0.25 });
    var prisms = [];
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      var pr = new THREE.Mesh(G_PRISM, i % 2 === 0 ? pMatA : pMatB);
      pr.userData.sharedGeo = true;
      pr.position.set(Math.cos(a) * 2.8, 0.6, Math.sin(a) * 2.8);
      root.add(pr); prisms.push(pr);
    }
    MAY.triggerSpellFlash(0xc084fc, 0.5);
    MAY.player.addShake(0.2);

    var lx = pos.x, ly = pos.y + 3.0, lz = pos.z;
    addFX(root, 4.0, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 5) * (1 - Math.max(0, (p - 0.7) / 0.3));
      rune.rotation.z -= dt * 1.5; rune.material.opacity = env * 0.92;
      wave.scale.setScalar(1 + p * 10.5); wave.material.opacity = Math.max(0, 1 - p * 1.5);
      requestSpellLight(lx, ly, lz, 0xc084fc, env * 5.8, 38);
      var prSc = Math.max(0.01, env);
      for (var pi = 0; pi < prisms.length; pi++) {
        var pr = prisms[pi];
        pr.rotation.y += dt * 3;
        pr.position.y = 1.0 + Math.sin(age * 3.5 + pi) * 0.45 + p * 1.4;
        pr.scale.setScalar(prSc);
      }
    });
  }

  /* ---- 6. SÓNG BỌT BIỂN (WAVE) ---- */
  function spawnWave(pos) {
    var root = new THREE.Group(); root.position.copy(pos);
    var rune = makeRunePlane(4.8, 0x38bdf8, 0.95, pos); rune.position.y = 0.18; root.add(rune);
    var rb1 = makeSpiralRibbon(2.2, 5.2, 1.5, 0x38bdf8); root.add(rb1);
    var rb2 = makeSpiralRibbon(2.8, 5.2, 1.5, 0x99f6e4); rb2.rotation.y = Math.PI; root.add(rb2);

    var bMat = new THREE.MeshStandardMaterial({ color: 0xe0fbff, emissive: 0x38bdf8, emissiveIntensity: 0.38, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.78 });
    var bubs = [];
    for (var i = 0; i < 20; i++) {
      var b = new THREE.Mesh(G_BUBBLE, bMat);
      var a = Math.random() * 6.28, r = Math.random() * 2.8;
      b.position.set(Math.cos(a) * r, 0.3 + Math.random() * 1.2, Math.sin(a) * r);
      b.scale.setScalar(0.5 + Math.random() * 1.1);
      b.userData = { sharedGeo: true, vy: 1.8 + Math.random() * 2.2, ph: Math.random() * 6 };
      root.add(b); bubs.push(b);
    }
    MAY.triggerSpellFlash(0x38bdf8, 0.38);
    MAY.player.addShake(0.14);

    var lx = pos.x, ly = pos.y + 2.0, lz = pos.z;
    addFX(root, 4.0, function (age, dur, dt) {
      var p = age / dur;
      var env = Math.min(1, age * 4) * (1 - Math.max(0, (p - 0.72) / 0.28));
      rune.rotation.z += dt * 1.4; rune.material.opacity = env * 0.9;
      rb1.rotation.y += dt * 3.0; rb2.rotation.y -= dt * 2.4;
      rb1.material.opacity = env * 0.7; rb2.material.opacity = env * 0.7;
      bMat.opacity = env * 0.78;
      requestSpellLight(lx, ly, lz, 0x38bdf8, env * 4.0, 24);
      for (var bi = 0; bi < bubs.length; bi++) {
        var b = bubs[bi];
        b.position.y += b.userData.vy * dt;
        b.position.x += Math.sin(age * 4 + b.userData.ph) * 0.4 * dt;
      }
    });
  }

  /* ---- Vòng Thử Thách & Cổng Rune Tinh Xảo ---- */
  function makeOrnateRing(radius, colorHex, emissiveHex) {
    var g = new THREE.Group();
    var rimMat = new THREE.MeshStandardMaterial({
      color: colorHex || 0xffd93d, emissive: emissiveHex || 0xaa7700, emissiveIntensity: 0.55,
      metalness: 0.75, roughness: 0.25
    });
    var main = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.13, 10, 28), rimMat);
    g.add(main);
    var inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.88, 0.045, 6, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 }));
    g.add(inner);
    var pipMat = new THREE.MeshStandardMaterial({ color: colorHex || 0xffd93d, emissive: colorHex || 0xffd93d, emissiveIntensity: 0.85, roughness: 0.2, metalness: 0.3 });
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      var pip = new THREE.Mesh(G_PIP, pipMat);
      pip.userData.sharedGeo = true;
      pip.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      g.add(pip);
    }
    var rune = new THREE.Mesh(
      G_UNIT_PLANE,
      new THREE.MeshBasicMaterial({ map: runicTex, color: colorHex || 0xffd93d, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    rune.userData.sharedGeo = true;
    rune.scale.setScalar(radius * 1.025);
    g.add(rune);
    g.userData.rimMat = rimMat;
    g.userData.rune = rune;
    return g;
  }

  /* ---- Hiệu ứng Giải Đố & Đấu Trùm ---- */
  function spawnTelegraph(pos, radius, dur, colorHex) {
    var root = new THREE.Group();
    root.position.set(pos.x, pos.y + 0.14, pos.z);
    var col = colorHex || 0xff3b5c;
    var ring = new THREE.Mesh(
      G_TEL_RING,
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.userData.sharedGeo = true;
    ring.scale.setScalar(radius);
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);
    var fill = new THREE.Mesh(
      G_TEL_FILL,
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
    );
    fill.userData.sharedGeo = true;
    fill.rotation.x = -Math.PI / 2;
    fill.scale.setScalar(radius * 0.05);
    root.add(fill);
    addFX(root, dur || 0.95, function (age, d) {
      var p = Math.min(1, age / d);
      fill.scale.setScalar(radius * (0.08 + p * 0.92));
      fill.material.opacity = 0.18 + p * 0.35;
      ring.material.opacity = 0.65 + Math.sin(age * 24) * 0.25;
    });
  }

  function spawnVineTrap(pos, dur) {
    var root = new THREE.Group();
    root.position.copy(pos);
    var vMatA = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    var vMatB = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    for (var i = 0; i < 4; i++) {
      var rb = makeSpiralRibbon(1.25 + (i % 2) * 0.35, 2.8, 1.5, 0x22c55e, i % 2 === 0 ? vMatA : vMatB);
      rb.rotation.y = (i / 4) * Math.PI * 2;
      root.add(rb);
    }
    var flCols = [0xff5c8a, 0xffd93d, 0xffffff, 0xf472b6];
    var flMats = flCols.map(function (c) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.5 }); });
    for (var f = 0; f < 8; f++) {
      var fl = new THREE.Mesh(G_HEAD, flMats[f % flMats.length]);
      fl.userData.sharedGeo = true;
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
      G_ICE_PILLAR,
      new THREE.MeshStandardMaterial({ color: 0xbbe8ff, emissive: 0x38bdf8, emissiveIntensity: 0.6, roughness: 0.14, metalness: 0.2, transparent: true, opacity: 0.92 })
    );
    pil.userData.sharedGeo = true;
    pil.position.y = 1.9;
    pil.castShadow = true;
    root.add(pil);
    addFX(root, dur || 5.5, function (age, d) {
      var env = Math.min(1, age * 6) * (1 - Math.max(0, (age / d - 0.82) / 0.18));
      pil.scale.set(env, Math.min(1, age * 5) * env, env);
    });
    return root;
  }

  var shatterGeometry;
  function getShatterGeometry() {
    if (shatterGeometry) return shatterGeometry;
    var crystal = new THREE.OctahedronGeometry(1, 0);
    var geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("position", crystal.attributes.position);
    geo.setAttribute("normal", crystal.attributes.normal);
    var seeds = [];
    for (var i = 0; i < 192; i++) {
      var angle = i * 2.39996;
      var speed = 2.4 + Math.random() * 5.2;
      seeds.push(Math.cos(angle)*speed, 2.1+Math.random()*6.3, Math.sin(angle)*speed,
        i % 8 === 0 ? 0.31 : 0.045+Math.random()*0.13);
    }
    geo.setAttribute("launch", new THREE.InstancedBufferAttribute(new Float32Array(seeds), 4));
    shatterGeometry = MAY.protectGeometry(geo);
    return geo;
  }

  function spawnShatterBurst(pos, colorHex) {
    var geo = getShatterGeometry();
    geo.instanceCount = MAY.quality === "low" ? 32 : MAY.quality === "high" ? 192 : 96;
    var mat = new THREE.ShaderMaterial({
      uniforms: { age: {value:0}, tint: {value:new THREE.Color(colorHex || 0xc084fc).convertSRGBToLinear()} },
      vertexShader: [
        "attribute vec4 launch; uniform float age; varying float facet;",
        "void main(){",
        "  float a = age * (4.0 + launch.y) + launch.x;",
        "  mat2 spin = mat2(cos(a), sin(a), -sin(a), cos(a));",
        "  vec3 p = position * vec3(0.65,1.65,0.56) * launch.w * (1.0-smoothstep(0.65,1.8,age));",
        "  p.xy = spin*p.xy; p += launch.xyz*age; p.y -= 5.6*age*age;",
        "  vec3 n = normal; n.xy = spin*n.xy;",
        "  facet = dot(n,normalize(vec3(-0.45,0.8,0.5)))*0.5+0.5;",
        "  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 tint; varying float facet;",
        "void main(){",
        "  vec3 color = mix(tint*0.25,tint,facet);",
        "  gl_FragColor = vec4(mix(color,vec3(0.96,0.94,0.86),0.52*pow(facet,7.0)),1.0);",
        "  #include <tonemapping_fragment>",
        "  #include <encodings_fragment>",
        "}"
      ].join("\n")
    });
    var shards = new THREE.Mesh(geo, mat);
    shards.position.copy(pos);
    shards.rotation.y = Math.random() * Math.PI * 2;
    shards.userData.sharedGeo = true;
    shards.frustumCulled = false;
    addFX(shards, 1.8, function (age) { mat.uniforms.age.value = age; });
  }

  /* ---- Điều khiển chọn & thi triển 6 Phép Thuật của Mây ---- */
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
      el.hidden = !unl;
      el.setAttribute("aria-pressed", String(!!unl && idx === activeSpellIdx));
      el.classList.toggle("active", unl && idx === activeSpellIdx);
    });

    var bar = document.getElementById("spellbar");
    if (bar) bar.hidden = unlockedAny === -1;
    var lbl = document.getElementById("spell-name");
    if (lbl) {
      lbl.textContent = isCurUnlocked
        ? (sp.icon + " " + sp.name.toUpperCase() + " — BẤM R ĐỂ DÙNG")
        : "🔒 CHƯA THỨC TỈNH PHÉP — GẶP NPC (!)";
    }
    if (MAY.player && MAY.player.setStaffSpell) {
      MAY.player.setStaffSpell(isCurUnlocked ? sp : { color: 0x38bdf8 });
    }
  }

  MAY.selectSpell = function (idx, silent) {
    if (!silent && MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying()) return;
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
  var _castTarget = new THREE.Vector3();
  var _castOrigin = new THREE.Vector3();
  MAY.castActiveSpell = function () {
    if (!MAY.started || MAY.modalOpen || (MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying()) || !MAY.currentCtx || castCooldown > 0) return;
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
    _castTarget.set(tx, ty, tz);
    _castOrigin.copy(p);

    if (MAY.player.triggerCastAnim) MAY.player.triggerCastAnim();
    if (MAY.sndSpell) MAY.sndSpell(sp.id);

    if (sp.id === "growth") spawnGrowth(_castTarget);
    else if (sp.id === "frost") spawnFrost(_castTarget);
    else if (sp.id === "tornado") {
      spawnTornado(_castTarget, true);
      if (MAY.currentCtx.addUpdraft) MAY.currentCtx.addUpdraft(_castTarget.x, _castTarget.y, _castTarget.z, 3.8, 5.2);
    }
    else if (sp.id === "solar") spawnSolar(_castTarget);
    else if (sp.id === "crystal") spawnCrystal(_castTarget);
    else spawnWave(_castTarget);

    if (MAY.dispatchSpellImpact) {
      MAY.dispatchSpellImpact(sp.id, _castTarget, _castOrigin);
    }

    var ctx = MAY.currentCtx;
    if (ctx && ctx.interactives) {
      for (var ii = 0; ii < ctx.interactives.length; ii++) {
        var it = ctx.interactives[ii];
        if (it.isProp && it.obj && it.obj.position.distanceTo(_castTarget) < 8.5 && it.onInteract) {
          it.onInteract(it);
        }
      }
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
      _spellLightReq = null;
      if (MAY.spellLight) MAY.spellLight.intensity = 0;
    },
    update: function (dt) {
      if (castCooldown > 0) castCooldown -= dt;
      _spellLightReq = null;
      for (var i = activeFX.length - 1; i >= 0; i--) {
        var fx = activeFX[i];
        fx.age += dt;
        if (fx.age >= fx.dur) {
          MAY.worldRoot.remove(fx.root);
          disposeFXRoot(fx.root);
          activeFX.splice(i, 1);
        } else {
          fx.update(fx.age, fx.dur, dt);
        }
      }
      if (MAY.spellLight) {
        if (_spellLightReq) {
          MAY.spellLight.position.set(_spellLightReq.x, _spellLightReq.y, _spellLightReq.z);
          MAY.spellLight.color.setHex(_spellLightReq.colorHex);
          MAY.spellLight.intensity = _spellLightReq.intensity;
          MAY.spellLight.distance = _spellLightReq.distance;
        } else if (MAY.spellLight.intensity > 0) {
          MAY.spellLight.intensity = 0;
        }
      }
    }
  };

})(window.MAY);
