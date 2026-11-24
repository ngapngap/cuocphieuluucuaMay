"use strict";
/* ============================================================================
   CORE ENGINE — Renderer, Scene, Lights, Shared Textures, GLB Models, Audio & TTS
   ============================================================================ */
(function (MAY) {

  /* ---- WebGL Renderer, Scene, Camera, Lights (Audio/TTS đã tách sang js/audio.js) ---- */
  var canvas = document.getElementById("view");
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  } catch (e) {
    document.getElementById("err").style.display = "flex";
    throw e;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x054a73);
  scene.fog = new THREE.Fog(0x054a73, 12, 110);

  var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.3, 260);
  camera.rotation.order = "YXZ";
  scene.add(camera);

  var diveLight = new THREE.SpotLight(0xbfefff, 0.75, 42, 0.65, 0.55, 1.1);
  var diveTarget = new THREE.Object3D();
  diveTarget.position.set(0, 0, -7);
  camera.add(diveTarget);
  diveLight.target = diveTarget;
  camera.add(diveLight);

  var hemiLight = new THREE.HemisphereLight(0xbfefff, 0x0a4d6e, 0.55);
  scene.add(hemiLight);

  var sun = new THREE.DirectionalLight(0xffe6b0, 1.7);
  sun.position.set(24, 42, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -48; sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -48;
  sun.shadow.camera.near = 2; sun.shadow.camera.far = 130;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  var _sunOffset = new THREE.Vector3(24, 42, 16);
  MAY.setSunOffset = function (x, y, z) { _sunOffset.set(x, y, z); };
  MAY.updateSunFollow = function (pos) {
    if (!pos) return;
    /* Snap theo texel bóng để tránh rung lắc shadow shimmer khi di chuyển */
    var sx = Math.round(pos.x * 2) / 2;
    var sz = Math.round(pos.z * 2) / 2;
    sun.target.position.set(sx, pos.y * 0.3, sz);
    sun.position.set(sx + _sunOffset.x, pos.y * 0.3 + _sunOffset.y, sz + _sunOffset.z);
    sun.target.updateMatrixWorld();
  };

  var shaderUniforms = { uTime: { value: 0 } };

  /* Group chứa toàn bộ vật thể của màn chơi hiện tại để dọn dẹp sạch khi đổi màn */
  var worldRoot = new THREE.Group();
  scene.add(worldRoot);

  /* ---- Shared Textures ---- */
  var texLoader = new THREE.TextureLoader();
  function loadRepeatTex(url, rx, ry) {
    var t = texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    if (rx) t.repeat.set(rx, ry || rx);
    return t;
  }

  var TEX = {
    hero: texLoader.load(MAY.IMG.hero),
    sand: loadRepeatTex(MAY.IMG.sand, 16, 16),
    rock: loadRepeatTex(MAY.IMG.rock, 4, 4),
    wood: loadRepeatTex(MAY.IMG.wood, 2, 2),
    caustics: loadRepeatTex(MAY.IMG.caustics, 14, 14),
    pano: texLoader.load(MAY.IMG.pano),
    fan: (function () {
      var t = loadRepeatTex(MAY.IMG.fan, 0.45, 0.9); t.offset.set(0.5, 0); return t;
    })(),
    fanAlpha: (function () {
      var t = loadRepeatTex(MAY.IMG.fanAlpha, 0.45, 0.9); t.offset.set(0.5, 0); return t;
    })()
  };

  TEX.glow = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d");
    var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.4, "rgba(255,240,180,0.45)");
    gr.addColorStop(1, "rgba(255,240,180,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  TEX.brain = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d");
    g.fillStyle = "#3aa981"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(0,60,40,.55)"; g.lineWidth = 5; g.lineCap = "round";
    for (var bi = 0; bi < 26; bi++) {
      g.beginPath();
      var bx = Math.random() * 256, by = Math.random() * 256;
      g.moveTo(bx, by);
      for (var bk = 0; bk < 5; bk++) {
        bx += (Math.random() - 0.5) * 70;
        by += (Math.random() - 0.5) * 70;
        g.lineTo(bx, by);
      }
      g.stroke();
    }
    return new THREE.CanvasTexture(c);
  })();

  TEX.grass = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d");
    g.fillStyle = "#4fa85a"; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 480; i++) {
      g.fillStyle = i % 3 === 0 ? "rgba(120,210,110,0.35)" : i % 3 === 1 ? "rgba(42,115,58,0.28)" : "rgba(220,245,140,0.18)";
      g.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16);
    return t;
  })();

  TEX.snow = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d");
    g.fillStyle = "#eaf6ff"; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 360; i++) {
      g.fillStyle = i % 2 === 0 ? "rgba(185,222,248,0.35)" : "rgba(255,255,255,0.65)";
      g.beginPath();
      g.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 7, 0, 6.29);
      g.fill();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14);
    return t;
  })();

  /* ---- Procedural Geometries & Helpers ---- */
  var sharedStarGeo = (function () {
    var s = new THREE.Shape(), R = 0.7, r = 0.3;
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 === 0 ? R : r, a = i * Math.PI / 5 - Math.PI / 2;
      var x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06 });
  })();

  MAY.makeLabel = function (text, opts) {
    opts = opts || {};
    var c = document.createElement("canvas");
    c.width = opts.w || 320; c.height = 84;
    var g = c.getContext("2d");
    var fs = text.length > 16 ? 24 : text.length > 10 ? 28 : text.length > 6 ? 34 : 42;
    g.font = "bold " + fs + "px 'Segoe UI', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 8;
    g.strokeStyle = opts.stroke || "rgba(0,30,60,0.88)";
    g.strokeText(text, c.width / 2, 42);
    g.fillStyle = opts.fill || "#ffffff";
    g.fillText(text, c.width / 2, 42);
    var tex = new THREE.CanvasTexture(c);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(opts.sx || 3.8, opts.sy || 1.05, 1);
    return sp;
  };

  MAY.makeSkyDome = function (topCol, midCol, botCol, radius) {
    var c = document.createElement("canvas"); c.width = 16; c.height = 256;
    var g = c.getContext("2d");
    var gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, topCol);
    gr.addColorStop(0.5, midCol);
    gr.addColorStop(1, botCol);
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
    var tex = new THREE.CanvasTexture(c);
    var m = new THREE.Mesh(
      new THREE.SphereGeometry(radius || 210, 24, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
    );
    return m;
  };

  MAY.rockGeo = function (seed) {
    var g = new THREE.IcosahedronGeometry(1, 1);
    var pp = g.attributes.position;
    for (var i = 0; i < pp.count; i++) {
      var vx = pp.getX(i), vy = pp.getY(i), vz = pp.getZ(i);
      var n = 1 + 0.22 * Math.sin(vx * 3.1 + seed) * Math.sin(vy * 2.7 + seed * 1.3) * Math.sin(vz * 3.7 + seed * 0.7);
      pp.setXYZ(i, vx * n, vy * n, vz * n);
    }
    g.computeVertexNormals();
    return g;
  };

  MAY.makeWaterPlane = function (w, h, y, deepVec, shalVec) {
    var dV = deepVec || new THREE.Vector3(0.015, 0.22, 0.38);
    var sV = shalVec || new THREE.Vector3(0.22, 0.60, 0.72);
    var surf = new THREE.Mesh(
      new THREE.PlaneGeometry(w || 260, h || 260, 40, 40),
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: shaderUniforms.uTime,
          uSunDir: { value: new THREE.Vector3(10, 30, 6).normalize() },
          uDeep: { value: dV },
          uShal: { value: sV }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        vertexShader: [
          "uniform float uTime;",
          "varying vec3 vPos;",
          "varying vec3 vNormal;",
          "void main(){",
          "  vec3 p = position;",
          "  float w = sin(p.x*0.18 + uTime*0.9)*0.14 + sin(p.y*0.23 - uTime*0.7)*0.14 + sin((p.x+p.y)*0.11 + uTime*0.5)*0.10;",
          "  p.z += w;",
          "  float dx = cos(p.x*0.18 + uTime*0.9)*0.14*0.18 + cos((p.x+p.y)*0.11 + uTime*0.5)*0.10*0.11;",
          "  float dy = cos(p.y*0.23 - uTime*0.7)*0.14*0.23 + cos((p.x+p.y)*0.11 + uTime*0.5)*0.10*0.11;",
          "  vec3 nrm = normalize(vec3(-dx, -dy, 1.0));",
          "  vNormal = normalize(mat3(modelMatrix) * nrm);",
          "  vec4 wp = modelMatrix * vec4(p, 1.0);",
          "  vPos = wp.xyz;",
          "  gl_Position = projectionMatrix * viewMatrix * wp;",
          "}"
        ].join("\n"),
        fragmentShader: [
          "uniform float uTime;",
          "uniform vec3 uSunDir;",
          "uniform vec3 uDeep;",
          "uniform vec3 uShal;",
          "varying vec3 vPos;",
          "varying vec3 vNormal;",
          "float caust(vec2 p, float t){",
          "  float c = 0.0;",
          "  c += sin(p.x*1.1 + t*0.7) * sin(p.y*1.1 - t*0.6);",
          "  c += sin((p.x+p.y)*0.7 + t*0.45) * sin((p.x-p.y)*0.9 - t*0.5);",
          "  return c;",
          "}",
          "void main(){",
          "  vec3 V = normalize(cameraPosition - vPos);",
          "  vec3 N = normalize(vNormal);",
          "  float fres = pow(1.0 - max(dot(V, N), 0.0), 3.0);",
          "  vec3 col = mix(uDeep, uShal, clamp(fres*0.85 + 0.14, 0.0, 1.0));",
          "  vec3 R = reflect(-V, N);",
          "  float spec = pow(max(dot(R, uSunDir), 0.0), 80.0);",
          "  col += vec3(1.0, 0.96, 0.78) * spec * 1.2;",
          "  float shim = smoothstep(0.9, 1.7, caust(vPos.xz*0.9, uTime));",
          "  col += vec3(0.35, 0.65, 0.70) * shim * 0.16;",
          "  float alpha = 0.42 + fres*0.28 + spec*0.32;",
          "  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));",
          "}"
        ].join("\n")
      })
    );
    surf.rotation.x = Math.PI / 2;
    surf.position.y = y || 0;
    return surf;
  };

  MAY.makeBeacon = function (hexColor) {
    var col = new THREE.Color(hexColor || 0xffd93d);
    return new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 28, 12, 1, true),
      new THREE.ShaderMaterial({
        uniforms: { uTime: shaderUniforms.uTime, uPulse: { value: 0.14 }, uColor: { value: col } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: "varying vec2 vUv; varying vec3 vNormal; void main(){ vUv = uv; vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform float uTime; uniform float uPulse; uniform vec3 uColor; varying vec2 vUv; varying vec3 vNormal; void main(){ float axial = 1.0 - smoothstep(0.45, 1.0, vUv.y); float facing = abs(normalize(vNormal).z); float soft = pow(facing, 1.8); float flick = 0.85 + 0.15 * sin(uTime * 2.0 + vUv.y * 5.0); float a = axial * soft * flick * uPulse * 0.95; gl_FragColor = vec4(uColor, a); }"
      })
    );
  };

  /* ---- 15 Mô hình GLB tĩnh + 2 Mô hình GLB có khung xương (SkinnedMesh + AnimationMixer) ---- */
  MAY.MODEL_T = {};
  MAY.RIGGED = {};
  MAY.modelsReady = false;
  var MODEL_FILES = [
    "assets/models/fish.glb", "assets/models/coral.glb", "assets/models/turtle.glb",
    "assets/models/jelly.glb", "assets/models/chest.glb", "assets/models/tang-blue.glb",
    "assets/models/tang-yellow.glb", "assets/models/manta.glb", "assets/models/barrel.glb",
    "assets/models/amphora.glb", "assets/models/clam.glb", "assets/models/sanddollar.glb",
    "assets/models/starfish.glb", "assets/models/seaweed.glb", "assets/models/kelp.glb"
  ];
  var RIGGED_FILES = [
    { key: "may",  url: "assets/models/may_rigged.glb" },
    { key: "milo", url: "assets/models/companion_milo.glb" }
  ];

  function bakeModel(sc) {
    var out = new THREE.Group();
    sc.updateWorldMatrix(true, true);
    sc.traverse(function (o) {
      if (o.isMesh) {
        var geo = o.geometry.clone();
        geo.applyMatrix4(o.matrixWorld);
        geo.deleteAttribute("skinIndex");
        geo.deleteAttribute("skinWeight");
        var mesh = new THREE.Mesh(geo, o.material);
        mesh.name = o.name || "part";
        out.add(mesh);
      }
    });
    return out;
  }

  function normBake(sc, axis, target, bottom) {
    var baked = bakeModel(sc);
    var box = new THREE.Box3().setFromObject(baked);
    var size = new THREE.Vector3(); box.getSize(size);
    var cen = new THREE.Vector3(); box.getCenter(cen);
    var ty = bottom ? -box.min.y : -cen.y;
    baked.traverse(function (o) { if (o.isMesh) o.geometry.translate(-cen.x, ty, -cen.z); });
    var scf = target / (size[axis] || 1);
    baked.traverse(function (o) { if (o.isMesh) o.geometry.scale(scf, scf, scf); });
    return baked;
  }

  /* Bảo vệ tuyệt đối geometry/material/texture gốc trong MAY.MODEL_T để clearWorld không phá hủy template khi đổi màn */
  var protectedGeos = new Set();
  var protectedMats = new Set();
  var protectedTexs = new Set();
  var MAT_TEX_SLOTS = ["map", "normalMap", "roughnessMap", "metalnessMap", "alphaMap", "aoMap", "emissiveMap", "bumpMap", "lightMap", "clearcoatNormalMap"];

  function protectTemplateObj(root) {
    if (!root || !root.traverse) return;
    root.traverse(function (o) {
      if (o.isMesh) {
        o.userData.sharedGeo = true;
        if (o.geometry) protectedGeos.add(o.geometry.uuid);
        if (o.material) {
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function (m) {
            if (!m) return;
            protectedMats.add(m.uuid);
            MAT_TEX_SLOTS.forEach(function (slot) {
              if (m[slot]) protectedTexs.add(m[slot].uuid);
            });
          });
        }
      }
    });
  }

  function registerAllTemplates() {
    var T = MAY.MODEL_T;
    Object.keys(T).forEach(function (k) {
      var entry = T[k];
      if (!entry) return;
      if (entry.group) protectTemplateObj(entry.group);
      if (entry.base) protectTemplateObj(entry.base);
      if (entry.lid) protectTemplateObj(entry.lid);
    });
  }

  function buildTemplates(res) {
    var T = MAY.MODEL_T;
    function fishTemplate(sc) {
      var fb = normBake(sc, "z", 1, false);
      var fg = new THREE.Group(), fin = new THREE.Group();
      fin.rotation.y = Math.PI / 2; fin.add(fb); fg.add(fin);
      return { group: fg };
    }
    function propTemplate(sc, axis, target) {
      var g = new THREE.Group(); g.add(normBake(sc, axis, target, true));
      return { group: g };
    }
    if (res[0]) {
      var fb = normBake(res[0], "z", 1, false);
      var fg = new THREE.Group(), fin = new THREE.Group();
      fin.rotation.y = Math.PI / 2; fin.add(fb);
      var eyeM = new THREE.MeshBasicMaterial({ color: 0x1a1a2e });
      [-0.058, 0.058].forEach(function (ex) {
        var e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeM);
        e.position.set(ex, 0.08, 0.35); fin.add(e);
      });
      fg.add(fin); T.fish = { group: fg };
    }
    if (res[1]) T.coral = propTemplate(res[1], "y", 1);
    if (res[2]) {
      var tb = normBake(res[2], "z", 2.4, true);
      var tg = new THREE.Group(), tin = new THREE.Group();
      tin.rotation.y = Math.PI / 2; tin.add(tb); tg.add(tin);
      T.turtle = { group: tg };
    }
    if (res[3]) {
      var jb = normBake(res[3], "y", 1.4, false);
      jb.traverse(function (o) { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.85; } });
      var jg = new THREE.Group(); jg.add(jb); T.jelly = { group: jg };
    }
    if (res[4]) {
      var base = res[4].getObjectByName("Chest_Base");
      var lid = res[4].getObjectByName("Chest_Top");
      if (base && lid) T.chest = { base: base, lid: lid };
    }
    if (res[5]) T.tangBlue = fishTemplate(res[5]);
    if (res[6]) T.tangYellow = fishTemplate(res[6]);
    if (res[7]) {
      var mb = normBake(res[7], "x", 6, false);
      var mg = new THREE.Group(), min = new THREE.Group();
      min.rotation.y = Math.PI / 2; min.add(mb); mg.add(min);
      T.manta = { group: mg };
    }
    if (res[8]) T.prop_barrel = propTemplate(res[8], "y", 1.2);
    if (res[9]) T.prop_amphora = propTemplate(res[9], "y", 1.2);
    if (res[10]) T.prop_clam = propTemplate(res[10], "x", 1.2);
    if (res[11]) T.prop_sanddollar = propTemplate(res[11], "x", 1.0);
    if (res[12]) T.prop_starfish = propTemplate(res[12], "x", 1.2);
    if (res[13]) T.prop_seaweed = propTemplate(res[13], "y", 2.5);
    if (res[14]) T.prop_kelp = propTemplate(res[14], "y", 3.5);
    registerAllTemplates();
  }

  MAY.cloneFish = function (color, len, species) {
    var T = MAY.MODEL_T;
    var t = species === 1 ? T.tangBlue : species === 2 ? T.tangYellow : T.fish;
    if (!t) t = T.fish;
    if (!t) return null;
    var c = t.group.clone(true);
    c.traverse(function (o) {
      if (o.isMesh) {
        if ((species === 0 || species === undefined) && o.material && o.material.name === "Body") {
          o.material = o.material.clone();
          o.material.color.setHex(color);
        }
        o.castShadow = true;
      }
    });
    c.scale.setScalar(len || 1.4);
    return c;
  };

  MAY.cloneProp = function (name, tint, scale) {
    var t = MAY.MODEL_T["prop_" + name] || MAY.MODEL_T[name];
    if (!t) return null;
    var c = t.group.clone(true);
    c.traverse(function (o) {
      if (o.isMesh) {
        if (tint !== undefined && tint !== null) {
          o.material = o.material.clone();
          o.material.color.setHex(tint);
        }
        o.castShadow = true;
      }
    });
    if (scale) c.scale.setScalar(scale);
    return c;
  };

  MAY.makeChestGLB = function (tint) {
    var t = MAY.MODEL_T.chest;
    if (!t) return null;
    var wrap = new THREE.Group();
    wrap.add(t.base.clone(true));
    var pivot = new THREE.Group();
    pivot.name = "lidPivot";
    pivot.position.set(0, 0.525, -0.353);
    var lid = t.lid.clone(true);
    lid.position.set(0, 0, 0);
    pivot.add(lid);
    wrap.add(pivot);
    wrap.scale.setScalar(1.27);
    wrap.traverse(function (o) {
      if (o.isMesh) {
        if (tint !== undefined && tint !== null && o.material) {
          o.material = o.material.clone();
          o.material.color.lerp(new THREE.Color(tint), 0.35);
        }
        o.castShadow = true;
      }
    });
    return { wrap: wrap, pivot: pivot };
  };

  /* Nhân bản mô hình GLB có khung xương (tương đương SkeletonUtils.clone — rebind Skeleton độc lập cho từng AnimationMixer!) */
  MAY.cloneSkinnedGLB = function (key) {
    var rec = MAY.RIGGED[key];
    if (!rec || !rec.scene) return null;
    var source = rec.scene;
    var clone = source.clone(true);
    var srcList = [], dstList = [];
    source.traverse(function (o) { srcList.push(o); });
    clone.traverse(function (o) { dstList.push(o); });
    var map = new Map();
    for (var i = 0; i < srcList.length; i++) map.set(srcList[i], dstList[i]);
    for (var j = 0; j < srcList.length; j++) {
      var s = srcList[j], d = dstList[j];
      if (s.isSkinnedMesh && d.isSkinnedMesh && s.skeleton) {
        var newBones = s.skeleton.bones.map(function (b) { return map.get(b) || b; });
        var newInverses = s.skeleton.boneInverses.map(function (m) { return m.clone(); });
        d.bind(new THREE.Skeleton(newBones, newInverses), s.bindMatrix.clone());
      }
      if (d.isMesh) {
        d.userData.sharedGeo = true;
        d.castShadow = true;
        d.receiveShadow = true;
        d.frustumCulled = false;
      }
    }
    return { scene: clone, animations: rec.animations || [] };
  };

  var modelsLoadedCount = 0;
  MAY.loadAllModels = function (onProgress, onDone) {
    var loader = new THREE.GLTFLoader();
    var totalCount = MODEL_FILES.length + RIGGED_FILES.length;
    var staticProm = Promise.all(MODEL_FILES.map(function (url) {
      return new Promise(function (res) {
        function finish(sc) {
          modelsLoadedCount++;
          if (onProgress) onProgress(modelsLoadedCount, totalCount);
          res(sc);
        }
        try {
          loader.load(url, function (g) { finish(g.scene); }, undefined, function () { finish(null); });
        } catch (e) { finish(null); }
      });
    }));
    var riggedProm = Promise.all(RIGGED_FILES.map(function (rf) {
      return new Promise(function (res) {
        function finish(gltf) {
          modelsLoadedCount++;
          if (onProgress) onProgress(modelsLoadedCount, totalCount);
          if (gltf && gltf.scene) {
            protectTemplateObj(gltf.scene);
            MAY.RIGGED[rf.key] = { scene: gltf.scene, animations: gltf.animations || [] };
          }
          res(gltf);
        }
        try {
          loader.load(rf.url, function (g) { finish(g); }, undefined, function () { finish(null); });
        } catch (e) { finish(null); }
      });
    }));
    Promise.all([staticProm, riggedProm]).then(function (all) {
      try { buildTemplates(all[0]); } catch (e) { if (window.console) console.log("buildTemplates err", e); }
      MAY.modelsReady = true;
      if (MAY.player && MAY.player.attachRiggedMay && MAY.RIGGED.may) {
        try { MAY.player.attachRiggedMay(); } catch (e) {}
      }
      if (onDone) onDone();
    });
  };

  /* ---- Particle Bursts ---- */
  var bursts = [];
  var burstGeo = new THREE.SphereGeometry(0.11, 6, 5);
  MAY.burstAt = function (pos, color, n) {
    var count = n || 10;
    for (var i = 0; i < count; i++) {
      var pp = new THREE.Mesh(burstGeo, new THREE.MeshBasicMaterial({ color: color || 0xffd93d }));
      pp.position.copy(pos);
      pp.userData.v = new THREE.Vector3((Math.random() - 0.5) * 4.2, Math.random() * 2.8 + 1.2, (Math.random() - 0.5) * 4.2);
      pp.userData.life = 0.75 + Math.random() * 0.25;
      scene.add(pp);
      bursts.push(pp);
    }
  };
  MAY.updateBursts = function (dt) {
    for (var i = bursts.length - 1; i >= 0; i--) {
      var bp = bursts[i];
      bp.position.addScaledVector(bp.userData.v, dt);
      bp.userData.v.y -= 4.2 * dt;
      bp.userData.life -= dt;
      bp.scale.setScalar(Math.max(0.01, bp.userData.life));
      if (bp.userData.life <= 0) {
        scene.remove(bp);
        if (bp.material) bp.material.dispose();
        bursts.splice(i, 1);
      }
    }
  };

  /* ---- Dọn dẹp màn cũ khi chuyển màn ---- */
  function isProtectedTex(tex) {
    if (!tex) return true;
    if (protectedTexs.has(tex.uuid)) return true;
    var k;
    for (k in TEX) if (TEX[k] && TEX[k].uuid === tex.uuid) return true;
    if (MAY.PBR) {
      for (k in MAY.PBR) {
        var entry = MAY.PBR[k];
        if (!entry) continue;
        if (entry.uuid === tex.uuid) return true;
        if (entry.map && entry.map.uuid === tex.uuid) return true;
        if (entry.normalMap && entry.normalMap.uuid === tex.uuid) return true;
        if (entry.roughnessMap && entry.roughnessMap.uuid === tex.uuid) return true;
        if (entry.puddleMask && entry.puddleMask.uuid === tex.uuid) return true;
      }
    }
    if (MAY.VFX) {
      if (MAY.VFX.runicTex && MAY.VFX.runicTex.uuid === tex.uuid) return true;
      if (MAY.VFX.softPuffTex && MAY.VFX.softPuffTex.uuid === tex.uuid) return true;
    }
    if (MAY.photoPBR) {
      for (k in MAY.photoPBR) {
        var pe = MAY.photoPBR[k];
        if (!pe) continue;
        if (pe.normalMap && pe.normalMap.uuid === tex.uuid) return true;
        if (pe.roughnessMap && pe.roughnessMap.uuid === tex.uuid) return true;
      }
    }
    return false;
  }

  MAY.clearWorld = function () {
    for (var i = bursts.length - 1; i >= 0; i--) {
      scene.remove(bursts[i]);
      if (bursts[i].material) bursts[i].material.dispose();
    }
    bursts.length = 0;
    while (worldRoot.children.length > 0) {
      var ch = worldRoot.children[0];
      worldRoot.remove(ch);
      ch.traverse(function (o) {
        if (o.isLight && o.shadow && o.shadow.map) {
          try { o.shadow.map.dispose(); o.shadow.map = null; } catch (e) {}
        }
        if (o.isMesh || o.isPoints || o.isLine) {
          if (o.geometry && o.geometry !== sharedStarGeo && o.geometry !== burstGeo && !o.userData.sharedGeo && !protectedGeos.has(o.geometry.uuid)) {
            try { o.geometry.dispose(); } catch (e) {}
          }
          if (o.isInstancedMesh && o.dispose) {
            try { o.dispose(); } catch (e) {}
          }
          if (o.material) {
            var mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function (m) {
              if (!m || protectedMats.has(m.uuid)) return;
              MAT_TEX_SLOTS.forEach(function (slot) {
                if (m[slot] && !isProtectedTex(m[slot])) { try { m[slot].dispose(); } catch (e) {} }
              });
              try { m.dispose(); } catch (e) {}
            });
          }
        } else if (o.isSprite && o.material) {
          if (o.material.map && !isProtectedTex(o.material.map)) { try { o.material.map.dispose(); } catch (e) {} }
          try { o.material.dispose(); } catch (e) {}
        }
      });
    }
  };

  /* ---- Chất lượng đồ họa ---- */
  MAY.quality = "mid";
  function setShadowSize(n) {
    if (sun.shadow.mapSize.x !== n) {
      sun.shadow.mapSize.set(n, n);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
  }
  MAY.applyQuality = function (q) {
    MAY.quality = q;
    document.querySelectorAll(".qbtn").forEach(function (b) { b.classList.toggle("sel", b.dataset.q === q); });
    if (q === "low") { renderer.setPixelRatio(1); sun.castShadow = false; setShadowSize(1024); }
    else if (q === "mid") { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2)); sun.castShadow = true; setShadowSize(1024); }
    else { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6)); sun.castShadow = true; setShadowSize(2048); }
    if (MAY.resizePostFX) MAY.resizePostFX();
  };

  /* ---- PMREM Environment (chạy 1 lần khi panoTex tải xong) ---- */
  var envDone = false;
  MAY.ensureEnv = function () {
    if (!envDone && TEX.pano.image && TEX.pano.image.width) {
      envDone = true;
      try {
        var envTex = new THREE.Texture();
        envTex.image = TEX.pano.image;
        envTex.mapping = THREE.EquirectangularReflectionMapping;
        envTex.needsUpdate = true;
        var pmrem = new THREE.PMREMGenerator(renderer);
        var envRT = pmrem.fromEquirectangular(envTex);
        if (!scene.environment) scene.environment = envRT.texture;
        MAY._baseEnvRT = envRT;
        envTex.dispose();
        pmrem.dispose();
      } catch (e) {}
    }
  };

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  MAY.canvas = canvas;
  MAY.renderer = renderer;
  MAY.scene = scene;
  MAY.camera = camera;
  MAY.sun = sun;
  MAY.hemiLight = hemiLight;
  MAY.diveLight = diveLight;
  MAY.worldRoot = worldRoot;
  MAY.TEX = TEX;
  MAY.shaderUniforms = shaderUniforms;
  MAY.starGeo = sharedStarGeo;

})(window.MAY);
