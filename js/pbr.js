"use strict";
/* ============================================================================
   PBR & SHADERS v9.0 — Chuẩn "The Hall" + "Fable 5.2":
   - Texture PBR 512x512 + Anti-Tiling Macro Weathering + Bờ ẩm ướt tự động
   - Phản chiếu mặt phẳng thời gian thực (Planar Reflections cho Nước, Băng & Vũng đá ướt)
   - Hậu kỳ Depth-Buffer SSAO (tối khe góc) + DoF nhẹ + Bloom + Film Grain + Spell Flash
   - Thảm cỏ 2.000+ ngọn uốn sóng gió + Hoa dại + Rải sỏi vụn + Dãy núi chân trời + Đèn lồng sắt
   ============================================================================ */
(function (MAY) {

  /* ---- Noise 2D tuần hoàn tốc độ cao ---- */
  function hash2(ix, iy, seed) {
    var n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }
  function tileNoise(u, v, period, seed) {
    var x = u * period, y = v * period;
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var x0 = ((ix % period) + period) % period, x1 = (x0 + 1) % period;
    var y0 = ((iy % period) + period) % period, y1 = (y0 + 1) % period;
    var a = hash2(x0, y0, seed), b = hash2(x1, y0, seed);
    var c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
  }
  function tileFBM(u, v, basePeriod, octaves, seed) {
    var val = 0, amp = 0.5, p = basePeriod, norm = 0;
    for (var i = 0; i < octaves; i++) {
      val += tileNoise(u, v, p, seed + i * 17) * amp;
      norm += amp; p *= 2; amp *= 0.5;
    }
    return val / norm;
  }

  function heightToNormalCanvas(hArr, w, h, strength) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var ctx = c.getContext("2d"), img = ctx.createImageData(w, h), d = img.data;
    var st = strength || 2.0;
    function sm(x, y) { return hArr[(((y % h) + h) % h) * w + (((x % w) + w) % w)]; }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var dx = (sm(x + 1, y - 1) + 2 * sm(x + 1, y) + sm(x + 1, y + 1)) - (sm(x - 1, y - 1) + 2 * sm(x - 1, y) + sm(x - 1, y + 1));
        var dy = (sm(x - 1, y + 1) + 2 * sm(x, y + 1) + sm(x + 1, y + 1)) - (sm(x - 1, y - 1) + 2 * sm(x, y - 1) + sm(x + 1, y - 1));
        var nx = -dx * st, ny = -dy * st, nz = 1.0;
        var inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        var idx = (y * w + x) * 4;
        d[idx] = Math.round((nx * inv * 0.5 + 0.5) * 255);
        d[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
        d[idx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function heightToRoughCanvas(hArr, w, h, rMin, rMax, invert) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var ctx = c.getContext("2d"), img = ctx.createImageData(w, h), d = img.data;
    for (var i = 0; i < w * h; i++) {
      var v = invert ? (1 - hArr[i]) : hArr[i];
      var g = Math.max(0, Math.min(255, Math.round((rMin + v * (rMax - rMin)) * 255)));
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function makeRepeatTex(canvas, rx, ry, isColor) {
    var t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rx) t.repeat.set(rx, ry || rx);
    if (isColor) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  MAY.derivePBRFromImage = function (img, opts) {
    opts = opts || {};
    var sz = opts.size || 256;
    var c = document.createElement("canvas"); c.width = c.height = sz;
    var g = c.getContext("2d"); g.drawImage(img, 0, 0, sz, sz);
    var px = g.getImageData(0, 0, sz, sz).data;
    var hArr = new Float32Array(sz * sz);
    for (var i = 0; i < sz * sz; i++) hArr[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255;
    var rx = opts.rx || 4, ry = opts.ry || rx;
    return {
      normalMap: makeRepeatTex(heightToNormalCanvas(hArr, sz, sz, opts.normalStrength || 2.2), rx, ry, false),
      roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, sz, sz, opts.rMin !== undefined ? opts.rMin : 0.45, opts.rMax !== undefined ? opts.rMax : 0.96, opts.invertRough !== false), rx, ry, false)
    };
  };

  /* ---- Tổng hợp Bộ PBR 384–512px giàu vi chi tiết ---- */
  var PBR = {};
  (function buildProceduralPBR() {
    var S = 384;

    /* 1. Cát mịn gợn gió (Sa mạc & Đáy biển) */
    (function () {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var ctx = c.getContext("2d"), img = ctx.createImageData(S, S), d = img.data, hArr = new Float32Array(S * S);
      for (var y = 0; y < S; y++) {
        for (var x = 0; x < S; x++) {
          var u = x / S, v = y / S;
          var warp = tileFBM(u, v, 3, 3, 11) * 0.15;
          var ripple = Math.sin((u * 8 + warp * 5) * Math.PI * 2) * 0.5 + 0.5;
          var macro = tileFBM(u, v, 4, 4, 7);
          var grain = tileNoise(u, v, 72, 33);
          var h = ripple * 0.22 + macro * 0.58 + grain * 0.20;
          hArr[y * S + x] = h;
          var idx = (y * S + x) * 4;
          d[idx] = Math.round(206 + h * 34); d[idx + 1] = Math.round(182 + h * 32); d[idx + 2] = Math.round(138 + h * 26); d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      PBR.sandRipple = {
        map: makeRepeatTex(c, 16, 16, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, S, S, 0.85), 16, 16, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, S, S, 0.66, 0.96, true), 16, 16, false)
      };
    })();

    /* 2. Đá xây bờ kè / thành cổ có rêu & vữa ẩm (giống tường đá ảnh 3 & The Hall) */
    (function () {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var ctx = c.getContext("2d"), img = ctx.createImageData(S, S), d = img.data, hArr = new Float32Array(S * S);
      var rows = 6, cols = 4;
      for (var y = 0; y < S; y++) {
        for (var x = 0; x < S; x++) {
          var u = x / S, v = y / S;
          var rIdx = Math.floor(v * rows), uOff = (rIdx % 2) * 0.5 / cols;
          var fu = ((u + uOff) * cols) % 1, fv = (v * rows) % 1;
          var cIdx = Math.floor(((u + uOff) * cols) % cols);
          var bEdge = Math.min(Math.min(fu, 1 - fu) * 2.4, Math.min(fv, 1 - fv) * 1.7);
          var mortar = Math.min(1, Math.max(0, (bEdge - 0.05) / 0.09));
          var tone = 0.70 + hash2(cIdx, rIdx, 91) * 0.30;
          var rough = tileFBM(u, v, 8, 4, 19);
          var stain = Math.max(0, (tileFBM(u, v * 0.5, 4, 3, 55) - 0.52) * 2.2);
          var h = mortar * (0.45 + rough * 0.55);
          hArr[y * S + x] = h;
          var base = (78 + rough * 72) * tone * (0.42 + mortar * 0.58);
          var idx = (y * S + x) * 4;
          d[idx] = Math.min(255, Math.round(base * (1 - stain * 0.32) + stain * 34));
          d[idx + 1] = Math.min(255, Math.round(base * (1 - stain * 0.14) + stain * 60));
          d[idx + 2] = Math.min(255, Math.round(base * 0.94 * (1 - stain * 0.36) + stain * 28));
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      PBR.stoneWall = {
        map: makeRepeatTex(c, 4, 2, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, S, S, 3.8), 4, 2, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, S, S, 0.35, 0.95, true), 4, 2, false)
      };
    })();

    /* 3. Đất rừng giàu rêu, cỏ mềm & lá rụng */
    (function () {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var ctx = c.getContext("2d"), img = ctx.createImageData(S, S), d = img.data, hArr = new Float32Array(S * S);
      for (var y = 0; y < S; y++) {
        for (var x = 0; x < S; x++) {
          var u = x / S, v = y / S;
          var m = tileFBM(u, v, 5, 4, 41), f = tileFBM(u, v, 18, 3, 73);
          var gm = Math.min(1, Math.max(0, (m - 0.30) * 2.6));
          hArr[y * S + x] = m * 0.5 + f * 0.5;
          var idx = (y * S + x) * 4;
          var dr = 78 + f * 38, dg = 62 + f * 30, db = 38 + f * 20;
          var gr = 54 + f * 48, gg = 114 + f * 58, gb = 42 + f * 30;
          d[idx] = Math.round(dr + (gr - dr) * gm);
          d[idx + 1] = Math.round(dg + (gg - dg) * gm);
          d[idx + 2] = Math.round(db + (gb - db) * gm);
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      PBR.forestGround = {
        map: makeRepeatTex(c, 18, 18, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, S, S, 2.4), 18, 18, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, S, S, 0.58, 0.98, true), 18, 18, false)
      };
    })();

    /* 4. Vỏ cây rừng có thớ dọc sâu */
    (function () {
      var sz = 256, c = document.createElement("canvas"); c.width = c.height = sz;
      var ctx = c.getContext("2d"), img = ctx.createImageData(sz, sz), d = img.data, hArr = new Float32Array(sz * sz);
      for (var y = 0; y < sz; y++) {
        for (var x = 0; x < sz; x++) {
          var u = x / sz, v = y / sz;
          var h = tileFBM(u, v * 0.25, 16, 4, 107) * 0.78 + tileNoise(u, v, 48, 29) * 0.22;
          hArr[y * sz + x] = h;
          var idx = (y * sz + x) * 4;
          d[idx] = Math.round(58 + h * 64); d[idx + 1] = Math.round(42 + h * 46); d[idx + 2] = Math.round(28 + h * 30); d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      PBR.bark = {
        map: makeRepeatTex(c, 2, 4, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, sz, sz, 3.8), 2, 4, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, sz, sz, 0.74, 0.98, true), 2, 4, false)
      };
    })();

    /* 5. Tuyết lấp lánh + Băng hồ có vết nứt & vùng soi gương */
    (function () {
      var sz = 256, c = document.createElement("canvas"); c.width = c.height = sz;
      var ctx = c.getContext("2d"), img = ctx.createImageData(sz, sz), d = img.data, hArr = new Float32Array(sz * sz);
      for (var y = 0; y < sz; y++) {
        for (var x = 0; x < sz; x++) {
          var u = x / sz, v = y / sz;
          var drift = tileFBM(u, v, 5, 4, 131);
          var glint = tileNoise(u, v, 96, 88) > 0.93 ? 1.0 : 0.0;
          hArr[y * sz + x] = drift * 0.85 + glint * 0.15;
          var idx = (y * sz + x) * 4;
          d[idx] = Math.min(255, Math.round(214 + drift * 34 + glint * 18));
          d[idx + 1] = Math.min(255, Math.round(226 + drift * 24 + glint * 18));
          d[idx + 2] = Math.min(255, Math.round(242 + drift * 12));
          d[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      PBR.snow = {
        map: makeRepeatTex(c, 16, 16, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, sz, sz, 1.5), 16, 16, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, sz, sz, 0.30, 0.85, true), 16, 16, false)
      };

      var ic = document.createElement("canvas"); ic.width = ic.height = sz;
      var ictx = ic.getContext("2d");
      ictx.fillStyle = "#8bcce8"; ictx.fillRect(0, 0, sz, sz);
      var gr = ictx.createRadialGradient(sz * 0.5, sz * 0.5, 10, sz * 0.5, sz * 0.5, sz * 0.65);
      gr.addColorStop(0, "rgba(215,245,255,0.58)"); gr.addColorStop(1, "rgba(65,145,195,0.42)");
      ictx.fillStyle = gr; ictx.fillRect(0, 0, sz, sz);
      ictx.strokeStyle = "rgba(255,255,255,0.72)"; ictx.lineWidth = 1.5;
      for (var k = 0; k < 30; k++) {
        ictx.beginPath();
        var sx = Math.random() * sz, sy = Math.random() * sz; ictx.moveTo(sx, sy);
        for (var j = 0; j < 4; j++) { sx += (Math.random() - 0.5) * 60; sy += (Math.random() - 0.5) * 60; ictx.lineTo(sx, sy); }
        ictx.stroke();
      }
      var ipx = ictx.getImageData(0, 0, sz, sz).data, ih = new Float32Array(sz * sz);
      for (var i = 0; i < sz * sz; i++) ih[i] = ipx[i * 4] / 255;
      PBR.ice = {
        map: makeRepeatTex(ic, 5, 5, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(ih, sz, sz, 2.2), 5, 5, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(ih, sz, sz, 0.04, 0.36, false), 5, 5, false)
      };
    })();

    /* 6. Đá hang động ẩm ướt có VŨNG NƯỚC PHẢN CHIẾU (puddleMask riêng giống "The Hall"!) */
    (function () {
      var c = document.createElement("canvas"); c.width = c.height = S;
      var pc = document.createElement("canvas"); pc.width = pc.height = S;
      var ctx = c.getContext("2d"), img = ctx.createImageData(S, S), d = img.data;
      var pctx = pc.getContext("2d"), pimg = pctx.createImageData(S, S), pd = pimg.data;
      var hArr = new Float32Array(S * S);
      for (var y = 0; y < S; y++) {
        for (var x = 0; x < S; x++) {
          var u = x / S, v = y / S;
          var r1 = tileFBM(u, v, 4, 4, 211);
          var cr = Math.abs(tileFBM(u, v, 9, 3, 251) - 0.5) * 2.0;
          var puddle = Math.max(0, Math.min(1, (0.43 - r1) / 0.10));
          var h = (r1 * 0.68 + cr * 0.32) * (1 - puddle * 0.88);
          hArr[y * S + x] = h;
          var idx = (y * S + x) * 4;
          d[idx] = Math.round((72 + h * 64) * (1 - puddle * 0.38));
          d[idx + 1] = Math.round((76 + h * 66) * (1 - puddle * 0.34));
          d[idx + 2] = Math.round((98 + h * 76) * (1 - puddle * 0.25));
          d[idx + 3] = 255;
          var pv = Math.round(puddle * 255);
          pd[idx] = pd[idx + 1] = pd[idx + 2] = pv; pd[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      pctx.putImageData(pimg, 0, 0);
      PBR.wetCaveRock = {
        map: makeRepeatTex(c, 12, 12, true),
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, S, S, 2.0), 12, 12, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, S, S, 0.06, 0.92, false), 12, 12, false),
        puddleMask: makeRepeatTex(pc, 12, 12, false)
      };
    })();

    /* 7. Vải bộ đồ & Bóng tiếp xúc chân mềm (Contact Shadow) */
    (function () {
      var sz = 128, hArr = new Float32Array(sz * sz);
      for (var y = 0; y < sz; y++) {
        for (var x = 0; x < sz; x++) hArr[y * sz + x] = (Math.sin(x * 1.4) * Math.sin(y * 1.4) * 0.5 + 0.5) * 0.35 + tileFBM(x / sz, y / sz, 4, 2, 17) * 0.65;
      }
      PBR.fabric = {
        normalMap: makeRepeatTex(heightToNormalCanvas(hArr, sz, sz, 1.4), 4, 4, false),
        roughnessMap: makeRepeatTex(heightToRoughCanvas(hArr, sz, sz, 0.32, 0.72, true), 4, 4, false)
      };

      var cs = document.createElement("canvas"); cs.width = cs.height = 128;
      var cg = cs.getContext("2d");
      var gr = cg.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, "rgba(0,0,0,0.58)");
      gr.addColorStop(0.55, "rgba(0,0,0,0.24)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      cg.fillStyle = gr; cg.fillRect(0, 0, 128, 128);
      PBR.contactShadowTex = new THREE.CanvasTexture(cs);
    })();

    /* 8. Lá cây, Lá dừa lông chim & Cỏ đa ngọn */
    (function () {
      var c = document.createElement("canvas"); c.width = c.height = 256;
      var g = c.getContext("2d");
      g.strokeStyle = "#3f5b28"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(128, 248); g.quadraticCurveTo(124, 130, 128, 16); g.stroke();
      for (var i = 0; i < 40; i++) {
        var ang = (Math.random() - 0.5) * 2.4;
        var cx = 128 + (Math.random() - 0.5) * 148, cy = 32 + Math.random() * 195;
        var rx = 18 + Math.random() * 22, ry = 8 + Math.random() * 11;
        g.save(); g.translate(cx, cy); g.rotate(ang);
        var lShift = Math.floor(Math.random() * 38);
        var grd = g.createLinearGradient(-rx, 0, rx, 0);
        grd.addColorStop(0, "rgb(" + (38 + lShift) + "," + (98 + lShift) + "," + (36 + Math.floor(lShift * 0.5)) + ")");
        grd.addColorStop(1, "rgb(" + (82 + lShift) + "," + (158 + lShift) + "," + (48 + Math.floor(lShift * 0.5)) + ")");
        g.fillStyle = grd; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      var lt = new THREE.CanvasTexture(c); lt.encoding = THREE.sRGBEncoding;
      PBR.leafClusterTex = lt;

      var pc = document.createElement("canvas"); pc.width = 256; pc.height = 512;
      var pg = pc.getContext("2d");
      pg.strokeStyle = "#52782d"; pg.lineWidth = 6;
      pg.beginPath(); pg.moveTo(128, 504); pg.lineTo(128, 20); pg.stroke();
      for (var y = 36; y < 484; y += 15) {
        var span = Math.sin((y / 512) * Math.PI) * 120;
        [-1, 1].forEach(function (side) {
          pg.fillStyle = side > 0 ? "#4a9136" : "#3a782b";
          pg.beginPath(); pg.moveTo(128, y);
          pg.quadraticCurveTo(128 + side * span * 0.6, y - 14, 128 + side * span, y + 18);
          pg.quadraticCurveTo(128 + side * span * 0.5, y + 10, 128, y + 8);
          pg.closePath(); pg.fill();
        });
      }
      var pt = new THREE.CanvasTexture(pc); pt.encoding = THREE.sRGBEncoding;
      PBR.palmFrondTex = pt;

      var gc = document.createElement("canvas"); gc.width = gc.height = 128;
      var gg = gc.getContext("2d");
      for (var bi = 0; bi < 16; bi++) {
        var bx = 20 + (bi / 15) * 88, lean = (Math.random() - 0.5) * 44, bh = 60 + Math.random() * 62;
        var ggrd = gg.createLinearGradient(0, 128, 0, 128 - bh);
        ggrd.addColorStop(0, "#245826"); ggrd.addColorStop(0.55, "#4da63c"); ggrd.addColorStop(1, "#9be05a");
        gg.fillStyle = ggrd;
        gg.beginPath(); gg.moveTo(bx - 4.5, 128);
        gg.quadraticCurveTo(bx + lean * 0.4, 128 - bh * 0.55, bx + lean, 128 - bh);
        gg.quadraticCurveTo(bx + lean * 0.4 + 3.5, 128 - bh * 0.55, bx + 4.5, 128);
        gg.closePath(); gg.fill();
      }
      var gt = new THREE.CanvasTexture(gc); gt.encoding = THREE.sRGBEncoding;
      PBR.grassTex = gt;
    })();
  })();

  MAY.PBR = PBR;
  MAY.photoPBR = {};

  MAY.attachPhotoPBR = function (key, tex, targetMats, opts) {
    function build() {
      if (!tex.image || !tex.image.width) return;
      if (!MAY.photoPBR[key]) MAY.photoPBR[key] = MAY.derivePBRFromImage(tex.image, opts);
      var maps = MAY.photoPBR[key];
      (targetMats || []).forEach(function (m) {
        if (!m) return;
        m.normalMap = maps.normalMap;
        m.normalScale = new THREE.Vector2(opts.scale || 0.95, opts.scale || 0.95);
        m.roughnessMap = maps.roughnessMap;
        m.needsUpdate = true;
      });
    }
    if (tex.image && tex.image.complete && tex.image.width) build();
    else {
      var iv = setInterval(function () {
        if (tex.image && tex.image.complete && tex.image.width) { clearInterval(iv); build(); }
      }, 150);
    }
  };

  /* ---- Shader Anti-Tiling Macro Weathering + Mép Bờ Ẩm Ướt + Caustics Dưới Nước ---- */
  MAY.applyWorldWeathering = function (mat, opts) {
    opts = opts || {};
    var wy = opts.waterY !== undefined ? opts.waterY : -999.0;
    var caustStr = opts.caustics || 0.0;
    var macroAmt = opts.macro !== undefined ? opts.macro : 0.16;
    var wetBand = opts.wetShore !== false && wy > -500 ? 1.5 : 0.0;

    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = MAY.shaderUniforms.uTime;
      shader.uniforms.uWaterY = { value: wy };
      shader.uniforms.uCaustStr = { value: caustStr };
      shader.uniforms.uMacroAmt = { value: macroAmt };
      shader.uniforms.uWetBand = { value: wetBand };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vMWPos;\nvarying vec3 vMWNorm;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvMWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvMWNorm = normalize(mat3(modelMatrix) * objectNormal);");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uTime, uWaterY, uCaustStr, uMacroAmt, uWetBand;\nvarying vec3 vMWPos, vMWNorm;")
        .replace("#include <output_fragment>", [
          "/* 1. Pha màu quy mô lớn triệt tiêu vết lặp ô texture */",
          "float mac = sin(vMWPos.x * 0.065 + sin(vMWPos.z * 0.048) * 1.4) * cos(vMWPos.z * 0.058 + cos(vMWPos.x * 0.042) * 1.3);",
          "float mac2 = sin((vMWPos.x + vMWPos.z) * 0.17) * cos((vMWPos.x - vMWPos.z) * 0.14);",
          "outgoingLight *= (1.0 + (mac * 0.65 + mac2 * 0.35) * uMacroAmt);",
          "/* 2. Dải mép bờ ẩm ướt sẫm màu hơn ngay sát mặt nước */",
          "if (uWetBand > 0.01) {",
          "  float hAbove = vMWPos.y - uWaterY;",
          "  float wetF = smoothstep(uWetBand, -0.1, hAbove) * smoothstep(-2.5, -0.1, hAbove);",
          "  outgoingLight *= mix(1.0, 0.68, wetF);",
          "}",
          "/* 3. Caustics ánh nắng loang thế giới 3D dưới nước */",
          "if (uCaustStr > 0.01) {",
          "  float cDepth = uWaterY - vMWPos.y;",
          "  if (cDepth > 0.05) {",
          "    vec2 cp = vMWPos.xz * 0.42 + vMWPos.y * 0.08;",
          "    float c1 = sin(cp.x * 2.1 + uTime * 1.15 + sin(cp.y * 1.6 - uTime * 0.8)) * sin(cp.y * 2.2 - uTime * 0.95 + cos(cp.x * 1.4 + uTime * 0.7));",
          "    float c2 = sin((cp.x + cp.y) * 1.7 - uTime * 0.85) * sin((cp.x - cp.y) * 1.9 + uTime * 0.75);",
          "    float caust = pow(clamp((c1 + c2) * 0.5 + 0.5, 0.0, 1.0), 3.1);",
          "    float upFade = max(dot(normalize(vMWNorm), normalize(vec3(0.25, 1.0, 0.15))), 0.0);",
          "    float depthFade = smoothstep(0.05, 1.1, cDepth) * exp(-cDepth * 0.052);",
          "    float cm = caust * upFade * depthFade * uCaustStr;",
          "    outgoingLight *= (0.86 + 0.36 * cm);",
          "    outgoingLight += vec3(0.45, 0.88, 0.96) * cm * 0.62;",
          "  }",
          "}",
          "#include <output_fragment>"
        ].join("\n"));
    };
    mat.customProgramCacheKey = function () { return "ww_" + wy + "_" + caustStr + "_" + macroAmt; };
    return mat;
  };
  MAY.applyCaustics = function (mat, waterY, intensity) {
    return MAY.applyWorldWeathering(mat, { waterY: waterY, caustics: intensity !== undefined ? intensity : 0.72, macro: 0.14 });
  };

  /* ---- HỆ THỐNG PHẢN CHIẾU MẶT PHẲNG THỜI GIAN THỰC (Planar Reflections chuẩn "The Hall"!) ---- */
  var _reflCam = new THREE.PerspectiveCamera();
  var _biasMat = new THREE.Matrix4().set(
    0.5, 0, 0, 0.5,
    0, 0.5, 0, 0.5,
    0, 0, 0.5, 0.5,
    0, 0, 0, 1
  );
  var _reflTarget = new THREE.Vector3();
  var _reflLook = new THREE.Vector3();
  var _clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  MAY.PlanarReflector = {
    rt: null,
    matrix: new THREE.Matrix4(),
    activePlaneY: null,
    hideMeshes: [],
    hasValidFrame: false,
    init: function () {
      var w = Math.max(2, Math.floor(window.innerWidth * 0.45));
      var h = Math.max(2, Math.floor(window.innerHeight * 0.45));
      if (this.rt) this.rt.dispose();
      this.rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
    },
    configure: function (planeY, hideList) {
      this.activePlaneY = planeY;
      this.hideMeshes = hideList || [];
      this.hasValidFrame = false;
    },
    clear: function () {
      this.activePlaneY = null;
      this.hideMeshes = [];
      this.hasValidFrame = false;
    },
    render: function () {
      if (this.activePlaneY === null || MAY.quality === "low" || !this.rt) {
        this.hasValidFrame = false;
        return;
      }
      var cam = MAY.camera;
      var py = this.activePlaneY;
      if (cam.position.y < py + 0.08) {
        this.hasValidFrame = false;
        return;
      }
      /* Phản chiếu camera thật qua mặt phẳng y = py */
      cam.getWorldDirection(_reflLook);
      _reflCam.fov = cam.fov;
      _reflCam.aspect = cam.aspect;
      _reflCam.near = cam.near;
      _reflCam.far = cam.far;
      _reflCam.updateProjectionMatrix();

      _reflCam.position.set(cam.position.x, 2 * py - cam.position.y, cam.position.z);
      _reflTarget.set(cam.position.x + _reflLook.x, 2 * py - (cam.position.y + _reflLook.y), cam.position.z + _reflLook.z);
      _reflCam.up.set(0, 1, 0);
      _reflCam.lookAt(_reflTarget);
      _reflCam.updateMatrixWorld(true);

      this.matrix.copy(_biasMat).multiply(_reflCam.projectionMatrix).multiply(_reflCam.matrixWorldInverse);

      /* Ẩn mặt phẳng phản chiếu và cắt các vật thể nằm dưới y = py */
      var prevVis = [];
      for (var i = 0; i < this.hideMeshes.length; i++) {
        prevVis.push(this.hideMeshes[i].visible);
        this.hideMeshes[i].visible = false;
      }
      var r = MAY.renderer;
      var prevClip = r.localClippingEnabled;
      _clipPlane.set(new THREE.Vector3(0, 1, 0), -py + 0.12);
      r.localClippingEnabled = true;
      r.clippingPlanes = [_clipPlane];

      r.setRenderTarget(this.rt);
      r.clear();
      r.render(MAY.scene, _reflCam);
      r.setRenderTarget(null);

      r.clippingPlanes = [];
      r.localClippingEnabled = prevClip;
      for (var j = 0; j < this.hideMeshes.length; j++) this.hideMeshes[j].visible = prevVis[j];
      this.hasValidFrame = true;
    }
  };
  MAY.PlanarReflector.init();

  /* ---- Shader Nước Gerstner + Phản Chiếu 3D + Hấp Thụ Độ Sâu Beer-Lambert + SSS + Bọt Bờ Theo Độ Sâu Thật + Snell's Window ---- */
  MAY.makeRealisticWater = function (opts) {
    opts = opts || {};
    var geo = new THREE.PlaneGeometry(opts.width || 280, opts.height || 280, opts.segs || 84, opts.segs || 84);
    geo.rotateX(-Math.PI / 2);
    var wy = opts.y !== undefined ? opts.y : 0;
    var ox = opts.offsetX || 0, oz = opts.offsetZ || 0;
    var pAttr = geo.attributes.position;
    var depthArr = new Float32Array(pAttr.count);
    for (var vi = 0; vi < pAttr.count; vi++) {
      var gh = opts.groundH ? opts.groundH(pAttr.getX(vi) + ox, pAttr.getZ(vi) + oz) : (wy - 6.0);
      depthArr[vi] = Math.max(0.0, wy - gh);
    }
    geo.setAttribute("aDepth", new THREE.BufferAttribute(depthArr, 1));

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: MAY.shaderUniforms.uTime,
        uSunDir: { value: (opts.sunDir || new THREE.Vector3(18, 36, 12)).clone().normalize() },
        uDeep: { value: new THREE.Color(opts.deepColor || 0x032840) },
        uShallow: { value: new THREE.Color(opts.shallowColor || 0x167d96) },
        uSkyCol: { value: new THREE.Color(opts.skyColor || 0x9cd8f5) },
        uSunCol: { value: new THREE.Color(opts.sunColor || 0xfff3cc) },
        uPlayerPos: { value: new THREE.Vector3(0, -100, 0) },
        uFoamCenter: { value: opts.foamCenter || new THREE.Vector3(0, 0, 102) },
        uFoamRadius: { value: opts.foamRadius || 21.5 },
        uWaveAmp: { value: opts.waveAmp !== undefined ? opts.waveAmp : 0.20 },
        uUnderFogCol: { value: new THREE.Color(opts.underFogColor || 0x065c78) },
        uUnderFogDens: { value: opts.underFogDensity !== undefined ? opts.underFogDensity : 0.0175 },
        tReflect: { value: MAY.PlanarReflector.rt.texture },
        uReflMatrix: { value: MAY.PlanarReflector.matrix },
        uUseReflect: { value: 0.0 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: [
        "attribute float aDepth;",
        "uniform float uTime, uWaveAmp;",
        "uniform mat4 uReflMatrix;",
        "varying vec3 vWorldPos, vNormal;",
        "varying float vCrest, vDepth;",
        "varying vec4 vReflCoord;",
        "vec3 gerstner(vec2 pos, float t, vec2 dir, float freq, float steep, float speed, inout vec3 dX, inout vec3 dZ) {",
        "  float ph = dot(dir, pos) * freq + t * speed;",
        "  float s = sin(ph), c = cos(ph), a = steep / freq;",
        "  dX += vec3(-dir.x * dir.x * steep * s, dir.x * steep * c, -dir.x * dir.y * steep * s);",
        "  dZ += vec3(-dir.x * dir.y * steep * s, dir.y * steep * c, -dir.y * dir.y * steep * s);",
        "  return vec3(dir.x * a * c, a * s, dir.y * a * c);",
        "}",
        "void main() {",
        "  vec4 wp0 = modelMatrix * vec4(position, 1.0);",
        "  vec2 p = wp0.xz;",
        "  float shallowDamp = clamp(aDepth * 0.45, 0.22, 1.0);",
        "  vec3 dX = vec3(1,0,0), dZ = vec3(0,0,1), disp = vec3(0);",
        "  disp += gerstner(p, uTime, normalize(vec2(0.85, 0.45)), 0.16, 0.10 * uWaveAmp * 4.5 * shallowDamp, 1.25, dX, dZ);",
        "  disp += gerstner(p, uTime, normalize(vec2(-0.55, 0.82)), 0.27, 0.08 * uWaveAmp * 4.5 * shallowDamp, 1.55, dX, dZ);",
        "  disp += gerstner(p, uTime, normalize(vec2(0.25, -0.95)), 0.43, 0.05 * uWaveAmp * 4.5 * shallowDamp, 1.9, dX, dZ);",
        "  disp += gerstner(p, uTime, normalize(vec2(-0.92, -0.35)), 0.68, 0.03 * uWaveAmp * 4.5 * shallowDamp, 2.3, dX, dZ);",
        "  vec4 wp = wp0 + vec4(disp, 0.0);",
        "  vWorldPos = wp.xyz; vNormal = normalize(cross(dZ, dX)); vCrest = disp.y; vDepth = aDepth;",
        "  vReflCoord = uReflMatrix * wp0;",
        "  gl_Position = projectionMatrix * viewMatrix * wp;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uTime, uFoamRadius, uUnderFogDens, uUseReflect;",
        "uniform vec3 uSunDir, uDeep, uShallow, uSkyCol, uSunCol, uPlayerPos, uFoamCenter, uUnderFogCol;",
        "uniform sampler2D tReflect;",
        "varying vec3 vWorldPos, vNormal; varying float vCrest, vDepth; varying vec4 vReflCoord;",
        "float rippleH(vec2 p, float t) {",
        "  return sin(p.x * 0.95 + t * 1.3 + sin(p.y * 0.7 - t * 0.8)) * 0.52 +",
        "         sin(p.y * 1.15 - t * 1.1 + cos(p.x * 0.85 + t * 0.7)) * 0.34 +",
        "         sin((p.x - p.y) * 1.8 + t * 1.6) * 0.14;",
        "}",
        "void main() {",
        "  vec3 V = normalize(cameraPosition - vWorldPos);",
        "  float camDist = length(cameraPosition - vWorldPos);",
        "  bool underwater = cameraPosition.y < vWorldPos.y;",
        "  float e = 0.18, h0 = rippleH(vWorldPos.xz, uTime);",
        "  vec3 microN = normalize(vec3((h0 - rippleH(vWorldPos.xz + vec2(e,0), uTime)) * 0.38, 1.0, (h0 - rippleH(vWorldPos.xz + vec2(0,e), uTime)) * 0.38));",
        "  vec3 N = normalize(mix(vNormal, microN, 0.38));",
        "  float pDist = length(vWorldPos.xz - uPlayerPos.xz);",
        "  float pNear = smoothstep(3.5, 0.0, abs(uPlayerPos.y - vWorldPos.y));",
        "  float wake = sin(pDist * 4.2 - uTime * 6.0) * exp(-pDist * 0.35) * pNear;",
        "  N = normalize(N + vec3(wake * 0.22, 0.0, wake * 0.22));",
        "  if (underwater) {",
        "    vec3 Nu = -N; float cosT = max(dot(V, Nu), 0.0);",
        "    float snell = smoothstep(0.18, 0.76, cosT);",
        "    vec3 skyWin = mix(vec3(0.12, 0.62, 0.76), vec3(0.42, 0.90, 0.94), snell);",
        "    vec3 tirCol = mix(uUnderFogCol * 0.88, vec3(0.08, 0.48, 0.62), pow(cosT, 0.8));",
        "    vec3 col = mix(tirCol, skyWin, snell);",
        "    col += vec3(0.28, 0.78, 0.85) * smoothstep(0.15, 0.9, h0 * 0.5 + 0.5) * (0.14 + 0.28 * snell);",
        "    col += uSunCol * pow(max(dot(-V, uSunDir), 0.0), 14.0) * 0.9;",
        "    float fogF = 1.0 - exp(-pow(camDist * uUnderFogDens, 2.0));",
        "    col = mix(col, uUnderFogCol, clamp(fogF, 0.0, 1.0));",
        "    gl_FragColor = vec4(col, mix(0.95, 0.72, snell * (1.0 - fogF)));",
        "  } else {",
        "    float NdotV = max(dot(N, V), 0.0);",
        "    float fresnel = 0.05 + 0.95 * pow(1.0 - NdotV, 3.8);",
        "    vec3 R = reflect(-V, N);",
        "    vec3 envRefl = mix(uSkyCol * 0.76, uSkyCol * 1.12, clamp(R.y * 1.4, 0.0, 1.0));",
        "    if (uUseReflect > 0.5 && vReflCoord.w > 0.01) {",
        "      vec2 ruv = vReflCoord.xy / vReflCoord.w;",
        "      ruv += N.xz * 0.048;",
        "      vec3 planar = texture2D(tReflect, clamp(ruv, 0.002, 0.998)).rgb;",
        "      envRefl = mix(envRefl, planar, 0.88);",
        "    }",
        "    /* Hấp thụ ánh sáng Beer-Lambert theo độ sâu nước thật + tán xạ sóng SSS (chuẩn SCUM!) */",
        "    float depthFactor = 1.0 - exp(-vDepth * 0.34);",
        "    vec3 waterBody = mix(uShallow, uDeep, clamp(depthFactor * 0.82 + camDist * 0.003, 0.0, 1.0));",
        "    float sss = pow(max(dot(V, normalize(-uSunDir + N * 0.45)), 0.0), 4.0) * smoothstep(-0.05, 0.28, vCrest + 0.1);",
        "    waterBody += vec3(0.08, 0.42, 0.40) * sss * (0.45 + 0.55 * (1.0 - depthFactor));",
        "    vec3 col = mix(waterBody, envRefl, clamp(fresnel * 0.92 + 0.12 * uUseReflect, 0.0, 0.96));",
        "    vec3 H = normalize(V + uSunDir);",
        "    float spec1 = pow(max(dot(N, H), 0.0), 190.0);",
        "    float spec2 = pow(max(dot(N, H), 0.0), 30.0);",
        "    col += uSunCol * (spec1 * 2.1 + spec2 * 0.22);",
        "    float dShore = abs(length(vWorldPos.xz - uFoamCenter.xz) - uFoamRadius);",
        "    float depthFoam = smoothstep(0.95, 0.04, vDepth) * (0.55 + 0.45 * sin(vDepth * 12.0 - uTime * 2.8 + h0 * 2.4));",
        "    float shoreBand = max(depthFoam, smoothstep(2.8, 0.2, dShore) * (0.45 + 0.45 * sin(dShore * 4.5 - uTime * 2.5 + h0 * 2.0)));",
        "    float wakeFoam = smoothstep(0.15, 0.75, abs(wake)) * pNear * 0.78;",
        "    float crestFoam = smoothstep(0.18, 0.34, vCrest + h0 * 0.08) * 0.26;",
        "    float foam = clamp(shoreBand * 0.78 + wakeFoam + crestFoam, 0.0, 1.0);",
        "    col = mix(col, vec3(0.95, 0.98, 1.0), foam);",
        "    float shallowAlpha = mix(0.46, 0.86, clamp(depthFactor * 1.15, 0.0, 1.0));",
        "    gl_FragColor = vec4(col, clamp(shallowAlpha + fresnel * 0.28 + foam * 0.32 + spec1 * 0.3, 0.38, 0.98));",
        "  }",
        "}"
      ].join("\n")
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = opts.y !== undefined ? opts.y : 0;
    mesh.userData.waterUniforms = mat.uniforms;
    return mesh;
  };

  /* ---- Mặt Phẳng Soi Gương Thực Tế Có Roughness Mask (Hồ Băng Màn 5 & Vũng Nước Sàn Hang Màn 4 giống "The Hall"!) ---- */
  MAY.makeReflectiveSurface = function (geo, opts) {
    opts = opts || {};
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        tBase: { value: opts.baseMap || PBR.ice.map },
        tMask: { value: opts.maskMap || PBR.ice.roughnessMap },
        tReflect: { value: MAY.PlanarReflector.rt.texture },
        uReflMatrix: { value: MAY.PlanarReflector.matrix },
        uUseReflect: { value: 0.0 },
        uTint: { value: new THREE.Color(opts.tint || 0xffffff) },
        uReflStrength: { value: opts.strength !== undefined ? opts.strength : 0.72 },
        uInvertMask: { value: opts.invertMask ? 1.0 : 0.0 },
        uRepeat: { value: opts.repeat || 5.0 },
        uAlphaMode: { value: opts.puddleOverlay ? 1.0 : 0.0 },
        uFogCol: { value: new THREE.Color(opts.fogColor || 0x161230) },
        uFogDens: { value: opts.fogDensity || 0.008 }
      },
      transparent: !!opts.puddleOverlay,
      depthWrite: !opts.puddleOverlay,
      vertexShader: [
        "uniform mat4 uReflMatrix;",
        "varying vec2 vUv; varying vec4 vReflCoord; varying vec3 vWPos;",
        "void main(){",
        "  vUv = uv;",
        "  vec4 wp = modelMatrix * vec4(position, 1.0);",
        "  vWPos = wp.xyz;",
        "  vReflCoord = uReflMatrix * wp;",
        "  gl_Position = projectionMatrix * viewMatrix * wp;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D tBase, tMask, tReflect;",
        "uniform vec3 uTint, uFogCol; uniform float uUseReflect, uReflStrength, uInvertMask, uRepeat, uAlphaMode, uFogDens;",
        "varying vec2 vUv; varying vec4 vReflCoord; varying vec3 vWPos;",
        "void main(){",
        "  vec2 uv = vUv * uRepeat;",
        "  vec3 base = texture2D(tBase, uv).rgb * uTint;",
        "  float m = texture2D(tMask, uv).r;",
        "  if (uInvertMask > 0.5) m = 1.0 - m;",
        "  vec3 V = normalize(cameraPosition - vWPos);",
        "  float fres = 0.22 + 0.78 * pow(1.0 - max(V.y, 0.0), 3.0);",
        "  vec3 col = base;",
        "  if (uUseReflect > 0.5 && vReflCoord.w > 0.01) {",
        "    vec2 ruv = vReflCoord.xy / vReflCoord.w;",
        "    vec3 refl = texture2D(tReflect, clamp(ruv, 0.002, 0.998)).rgb;",
        "    col = mix(base, refl, clamp(m * fres * uReflStrength, 0.0, 0.92));",
        "  }",
        "  float dist = length(cameraPosition - vWPos);",
        "  float fogF = 1.0 - exp(-pow(dist * uFogDens, 2.0));",
        "  col = mix(col, uFogCol, clamp(fogF, 0.0, 1.0));",
        "  if (uAlphaMode > 0.5) {",
        "    /* Lớp vũng nước bóng loáng phủ lên đá hang ướt giống The Hall! */",
        "    float a = smoothstep(0.18, 0.75, m) * (0.55 + 0.35 * fres) * (1.0 - fogF * 0.85);",
        "    gl_FragColor = vec4(col, a);",
        "  } else {",
        "    gl_FragColor = vec4(col, 1.0);",
        "  }",
        "}"
      ].join("\n")
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.userData.reflectUniforms = mat.uniforms;
    return mesh;
  };

  /* ---- Bầu Trời Khí Quyển + Mây FBM + Cực Quang + PMREM ---- */
  MAY.makeAtmosphericSky = function (cfg) {
    cfg = cfg || {};
    var mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTime: MAY.shaderUniforms.uTime,
        uZenith: { value: new THREE.Color(cfg.zenith || 0x1d68b8) },
        uHorizon: { value: new THREE.Color(cfg.horizon || 0xa6dcf5) },
        uGround: { value: new THREE.Color(cfg.ground || 0x0a4968) },
        uSunDir: { value: (cfg.sunDir || new THREE.Vector3(18, 32, 14)).clone().normalize() },
        uSunCol: { value: new THREE.Color(cfg.sunColor || 0xfff4cf) },
        uCloudCol: { value: new THREE.Color(cfg.cloudColor || 0xffffff) },
        uCloudAmt: { value: cfg.cloudAmt !== undefined ? cfg.cloudAmt : 0.48 },
        uAurora: { value: cfg.aurora ? 1.0 : 0.0 },
        uStars: { value: cfg.stars ? 1.0 : 0.0 }
      },
      vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform float uTime, uCloudAmt, uAurora, uStars;",
        "uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunCol, uCloudCol;",
        "varying vec3 vDir;",
        "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
        "float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }",
        "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.04; a*=0.5; } return v; }",
        "void main(){",
        "  vec3 d = normalize(vDir); float h = d.y;",
        "  vec3 sky = h >= 0.0 ? mix(uHorizon, uZenith, pow(h, 0.55)) : mix(uHorizon, uGround, pow(-h, 0.45));",
        "  float sDot = max(dot(d, normalize(uSunDir)), 0.0);",
        "  sky += uSunCol * (pow(sDot, 8.0) * 0.26 + pow(sDot, 120.0) * 0.85 + smoothstep(0.9985, 0.9996, sDot) * 2.0);",
        "  if (h > 0.02 && uCloudAmt > 0.01) {",
        "    vec2 cuv = d.xz / (h + 0.18) * 1.45 + vec2(uTime * 0.012, uTime * 0.005);",
        "    float cl = smoothstep(0.54 - uCloudAmt * 0.25, 0.82, fbm(cuv)) * smoothstep(0.02, 0.24, h);",
        "    float shade = clamp(fbm(cuv + uSunDir.xz * 0.14) * 1.15, 0.3, 1.0);",
        "    sky = mix(sky, mix(uCloudCol * 0.72 + uHorizon * 0.22, uCloudCol + uSunCol * 0.18, shade), cl * 0.88);",
        "  }",
        "  if (uAurora > 0.5 && h > 0.12) {",
        "    float band = sin(d.x * 6.0 + uTime * 0.35 + fbm(d.xz * 3.0) * 4.0);",
        "    float au = smoothstep(0.5, 0.95, band) * smoothstep(0.12, 0.45, h) * (1.0 - smoothstep(0.55, 0.9, h));",
        "    sky += mix(vec3(0.15, 0.95, 0.72), vec3(0.55, 0.45, 1.0), d.z * 0.5 + 0.5) * au * 0.48;",
        "  }",
        "  if (uStars > 0.5 && h > 0.08) {",
        "    vec2 suv = floor(d.xz / (h + 0.3) * 140.0);",
        "    sky += vec3(1.0, 0.96, 0.88) * step(0.994, hash(suv)) * (0.5 + 0.5 * sin(uTime * 3.0 + hash(suv + 9.0) * 20.0));",
        "  }",
        "  gl_FragColor = vec4(sky, 1.0);",
        "}"
      ].join("\n")
    });
    return new THREE.Mesh(new THREE.SphereGeometry(cfg.radius || 235, 32, 20), mat);
  };

  var currentEnvRT = null;
  MAY.bakeBiomeEnv = function (skyMesh) {
    try {
      var ts = new THREE.Scene(); ts.add(new THREE.Mesh(skyMesh.geometry, skyMesh.material));
      var pmrem = new THREE.PMREMGenerator(MAY.renderer);
      var rt = pmrem.fromScene(ts, 0.04);
      if (currentEnvRT) currentEnvRT.dispose();
      currentEnvRT = rt;
      MAY.scene.environment = rt.texture;
      pmrem.dispose();
    } catch (e) {}
  };

  /* ---- Tia Nắng Khối (God Rays) ---- */
  MAY.makeGodRayMat = function (hexColor, opacity) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: MAY.shaderUniforms.uTime, uColor: { value: new THREE.Color(hexColor || 0xfff2c2) }, uOp: { value: opacity !== undefined ? opacity : 0.22 } },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: "varying vec2 vUv; varying vec3 vNorm, vViewPos; void main(){ vUv=uv; vNorm=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vViewPos=-mv.xyz; gl_Position=projectionMatrix*mv; }",
      fragmentShader: "uniform float uTime, uOp; uniform vec3 uColor; varying vec2 vUv; varying vec3 vNorm, vViewPos; void main(){ float axial=smoothstep(0.0,0.35,vUv.y)*smoothstep(1.0,0.2,vUv.y); float fres=pow(abs(dot(normalize(vNorm),normalize(vViewPos))),2.1); float sh=0.8+0.2*sin(uTime*0.7+vUv.x*12.0+vUv.y*5.0); gl_FragColor=vec4(uColor, axial*fres*sh*uOp); }"
    });
  };

  /* ---- Đèn Lồng Sắt Kiến Trúc Có Ánh Sáng Thực (phong cách đèn treo trong The Hall!) ---- */
  MAY.makeCagedLantern = function (colorHex, intensity, dist, castShadow) {
    var g = new THREE.Group();
    var iron = new THREE.MeshStandardMaterial({ color: 0x1e242b, metalness: 0.85, roughness: 0.35 });
    var cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.16, 10), iron); cap.position.y = 0.22; g.add(cap);
    var bot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 10), iron); bot.position.y = -0.22; g.add(bot);
    for (var k = 0; k < 4; k++) {
      var a = (k / 4) * Math.PI * 2;
      var rib = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 5), iron);
      rib.position.set(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17); g.add(rib);
    }
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: colorHex || 0xffe29a }));
    g.add(bulb);
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: MAY.TEX.glow, color: colorHex || 0xffcc66, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(1.8, 1.8, 1); g.add(halo);
    var pl = new THREE.PointLight(colorHex || 0xffcf70, intensity || 2.2, dist || 22, 1.5);
    if (castShadow && MAY.quality !== "low") { pl.castShadow = true; pl.shadow.mapSize.set(512, 512); pl.shadow.bias = -0.002; }
    g.add(pl);
    return g;
  };

  /* ---- Bóng Tiếp Xúc Dưới Chân (Contact Shadow giúp vật thể dính đất 100%) ---- */
  MAY.makeContactShadow = function (radius, opacity) {
    var m = new THREE.Mesh(
      new THREE.PlaneGeometry((radius || 1.2) * 2, (radius || 1.2) * 2),
      new THREE.MeshBasicMaterial({ map: PBR.contactShadowTex, transparent: true, opacity: opacity || 0.65, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.04;
    return m;
  };

  /* ---- Dựng Cây Cối Chân Thực (Cây Dừa rủ tự nhiên + Cây Tán Dày nhiều lớp giống Fable 5.2) ---- */
  MAY.makeRealisticPalm = function (s) {
    s = s || 1.0;
    var g = new THREE.Group();
    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.35 * s, 1.9 * s, 0.15 * s),
      new THREE.Vector3(0.75 * s, 3.8 * s, 0.25 * s), new THREE.Vector3(0.95 * s, 5.4 * s, 0.18 * s)
    ]);
    var trunkMat = new THREE.MeshStandardMaterial({ map: PBR.bark.map, normalMap: PBR.bark.normalMap, roughnessMap: PBR.bark.roughnessMap, color: 0x9b7a58, roughness: 0.95 });
    var trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.26 * s, 8, false), trunkMat);
    trunk.castShadow = true; trunk.receiveShadow = true; g.add(trunk);
    var frondMat = new THREE.MeshStandardMaterial({ map: PBR.palmFrondTex, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.65 });
    var top = new THREE.Vector3(0.95 * s, 5.4 * s, 0.18 * s);
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2 + (i % 2) * 0.18;
      var piv = new THREE.Group(); piv.position.copy(top); piv.rotation.y = a;
      var len = (3.4 + (i % 3) * 0.4) * s;
      var fGeo = new THREE.PlaneGeometry(1.5 * s, len, 2, 8);
      var pos = fGeo.attributes.position;
      for (var k = 0; k < pos.count; k++) {
        var ox = pos.getX(k), oy = pos.getY(k) + len * 0.5, frac = oy / len;
        pos.setXYZ(k, ox, Math.sin(frac * 2.15) * 0.82 * s - frac * frac * 1.48 * s + (i % 2) * 0.22 * s * frac - Math.abs(ox) * 0.24, oy);
      }
      fGeo.computeVertexNormals();
      var frond = new THREE.Mesh(fGeo, frondMat); frond.castShadow = true; piv.add(frond); g.add(piv);
    }
    var nutMat = new THREE.MeshStandardMaterial({ color: 0x5c3e1d, roughness: 0.85 });
    for (var c = 0; c < 3; c++) {
      var nut = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 6), nutMat);
      nut.position.set(top.x + Math.cos(c * 2.1) * 0.32 * s, top.y - 0.28 * s, top.z + Math.sin(c * 2.1) * 0.32 * s); g.add(nut);
    }
    g.add(MAY.makeContactShadow(1.6 * s, 0.52));
    return g;
  };

  MAY.makeRealisticTree = function (s, leafTint) {
    s = s || 1.0;
    var g = new THREE.Group();
    var trunkMat = new THREE.MeshStandardMaterial({ map: PBR.bark.map, normalMap: PBR.bark.normalMap, roughnessMap: PBR.bark.roughnessMap, roughness: 0.95 });
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * s, 0.48 * s, 4.4 * s, 10), trunkMat);
    trunk.position.y = 2.2 * s; trunk.castShadow = true; trunk.receiveShadow = true; g.add(trunk);
    /* Chạc cành vươn ra nâng đỡ tán */
    [[-0.7, 3.6, 0.5, 0.55], [0.8, 3.5, -0.4, -0.6], [0.2, 3.7, 0.7, 0.35]].forEach(function (br) {
      var limb = new THREE.Mesh(new THREE.CylinderGeometry(0.10 * s, 0.18 * s, 1.8 * s, 6), trunkMat);
      limb.position.set(br[0] * s, br[1] * s, br[2] * s); limb.rotation.z = br[3]; limb.castShadow = true; g.add(limb);
    });
    var leafMat = new THREE.MeshStandardMaterial({ map: PBR.leafClusterTex, color: leafTint || 0x8de070, alphaTest: 0.30, side: THREE.DoubleSide, roughness: 0.75 });
    var centers = [[0, 5.0, 0], [1.25, 4.2, 0.7], [-1.15, 4.3, 0.65], [0.6, 4.4, -1.1], [-0.9, 4.0, -0.9], [0, 6.0, 0.2], [1.0, 5.2, -0.5], [-0.9, 5.3, 0.4]];
    var cardGeo = new THREE.PlaneGeometry(3.0 * s, 3.0 * s);
    centers.forEach(function (c, idx) {
      for (var k = 0; k < 3; k++) {
        var card = new THREE.Mesh(cardGeo, leafMat);
        card.position.set(c[0] * s, c[1] * s, c[2] * s);
        card.rotation.y = k * Math.PI / 3 + idx * 0.5; card.rotation.x = (k - 1) * 0.38;
        card.castShadow = true; g.add(card);
      }
    });
    g.add(MAY.makeContactShadow(2.2 * s, 0.55));
    return g;
  };

  /* ---- THẢM CỎ 2.000+ NGỌN UỐN SÓNG GIÓ & HOA DẠI (trực tiếp lấy cảm hứng từ Facebook Reel!) ---- */
  MAY.scatterLushMeadow = function (ctx, count, filterFn, opts) {
    opts = opts || {};
    var bladeN = MAY.quality === "low" ? Math.floor(count * 0.45) : count;
    /* Ngọn cỏ thuôn cong 3 đốt có shader gió chạy thành từng đợt sóng */
    var geo = new THREE.PlaneGeometry(opts.w || 0.92, opts.h || 0.88, 1, 3);
    geo.translate(0, (opts.h || 0.88) * 0.46, 0);
    var mat = new THREE.MeshStandardMaterial({
      map: PBR.grassTex, color: opts.color || 0xaee876, alphaTest: 0.34,
      side: THREE.DoubleSide, roughness: 0.82
    });
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = MAY.shaderUniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace("#include <begin_vertex>", [
          "#include <begin_vertex>",
          "vec4 instW = instanceMatrix * vec4(0.0,0.0,0.0,1.0);",
          "float gust = sin(uTime * 1.8 + instW.x * 0.16 + instW.z * 0.12) * 0.16 + sin(uTime * 3.4 + instW.x * 0.42) * 0.06;",
          "float bend = uv.y * uv.y;",
          "transformed.x += gust * bend;",
          "transformed.z += gust * 0.55 * bend;"
        ].join("\n"));
    };

    var pts = [], spread = opts.spread || 85;
    for (var tries = 0; tries < bladeN * 4 && pts.length < bladeN; tries++) {
      var x = (Math.random() - 0.5) * spread * 2, z = (Math.random() - 0.5) * spread * 2;
      if (filterFn && !filterFn(x, z)) continue;
      pts.push([x, ctx.groundH(x, z), z]);
    }
    if (!pts.length) return null;

    var im = new THREE.InstancedMesh(geo, mat, pts.length * 2);
    var dum = new THREE.Object3D();
    for (var i = 0; i < pts.length; i++) {
      var sc = 0.68 + Math.random() * 0.72, ry = Math.random() * Math.PI;
      dum.position.set(pts[i][0], pts[i][1] - 0.04, pts[i][2]);
      dum.scale.setScalar(sc);
      dum.rotation.set(0, ry, 0); dum.updateMatrix(); im.setMatrixAt(i * 2, dum.matrix);
      dum.rotation.set(0, ry + Math.PI / 2, 0); dum.updateMatrix(); im.setMatrixAt(i * 2 + 1, dum.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    ctx.add(im);

    /* Hoa dại nhiều màu rải trên đồng cỏ giống Fable 5.2 (đỏ anh túc, hồng, xanh, vàng, trắng) */
    if (opts.flowers !== false && pts.length > 40) {
      var fCount = Math.min(240, Math.floor(pts.length * 0.22));
      var fGeo = new THREE.SphereGeometry(0.13, 6, 5); fGeo.scale(1.2, 0.55, 1.2);
      var fMat = new THREE.MeshStandardMaterial({ roughness: 0.55 });
      var fim = new THREE.InstancedMesh(fGeo, fMat, fCount);
      var palette = [new THREE.Color(0xff4d6d), new THREE.Color(0xff8fab), new THREE.Color(0x60a5fa), new THREE.Color(0xfef08a), new THREE.Color(0xffffff)];
      for (var fi = 0; fi < fCount; fi++) {
        var p = pts[(fi * 4) % pts.length];
        dum.position.set(p[0], p[1] + 0.36 + (fi % 3) * 0.12, p[2]);
        dum.scale.setScalar(0.8 + (fi % 4) * 0.25); dum.rotation.set(0, fi, 0); dum.updateMatrix();
        fim.setMatrixAt(fi, dum.matrix);
        fim.setColorAt(fi, palette[fi % palette.length]);
      }
      fim.instanceMatrix.needsUpdate = true;
      if (fim.instanceColor) fim.instanceColor.needsUpdate = true;
      ctx.add(fim);
    }
    return im;
  };
  MAY.scatterGrassField = MAY.scatterLushMeadow;

  /* ---- Rải Vi Chi Tiết Mặt Đất (Đá sỏi vụn / mảnh tinh thể / vỏ ốc — 1 draw call InstancedMesh) ---- */
  MAY.scatterDebris = function (ctx, count, filterFn, opts) {
    opts = opts || {};
    var geo = opts.geo || new THREE.DodecahedronGeometry(opts.size || 0.24, 0);
    var mat = opts.mat || new THREE.MeshStandardMaterial({ color: opts.color || 0x8b867e, roughness: 0.9, flatShading: true });
    var pts = [], spread = opts.spread || 85;
    for (var tries = 0; tries < count * 4 && pts.length < count; tries++) {
      var x = (Math.random() - 0.5) * spread * 2, z = (Math.random() - 0.5) * spread * 2;
      if (filterFn && !filterFn(x, z)) continue;
      pts.push([x, ctx.groundH(x, z), z]);
    }
    if (!pts.length) return null;
    var im = new THREE.InstancedMesh(geo, mat, pts.length);
    var dum = new THREE.Object3D();
    for (var i = 0; i < pts.length; i++) {
      var s = 0.55 + Math.random() * 1.15;
      dum.position.set(pts[i][0], pts[i][1] + (opts.yOff || 0.06), pts[i][2]);
      dum.scale.set(s * 1.25, s * 0.65, s);
      dum.rotation.set(Math.random() * 3, Math.random() * 6, Math.random() * 3);
      dum.updateMatrix();
      im.setMatrixAt(i, dum.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = !!opts.castShadow;
    im.receiveShadow = true;
    ctx.add(im);
    return im;
  };

  /* ---- Vòng Cảnh Quan Đường Chân Trời Tầm Xa (Distant Vista: Núi tuyết, Quần đảo, Cồn cát xa) ---- */
  MAY.buildVistaRing = function (ctx, opts) {
    opts = opts || {};
    var count = opts.count || 22, rMin = opts.radius || 135, hMin = opts.hMin || 18, hMax = opts.hMax || 46;
    var mat = new THREE.MeshStandardMaterial({
      map: opts.map || MAY.TEX.rock, color: opts.color || 0x5c7c94,
      roughness: 0.96, flatShading: opts.flat !== false
    });
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 + (i % 2) * 0.11;
      var r = rMin + (i % 3) * 16;
      var w = (opts.wBase || 24) + (i % 4) * 9;
      var h = hMin + ((i * 7) % 10) / 10 * (hMax - hMin);
      var peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 7), mat);
      peak.position.set(Math.cos(a) * r, (opts.baseY !== undefined ? opts.baseY : -2) + h * 0.42, Math.sin(a) * r);
      peak.rotation.y = i * 1.3;
      ctx.add(peak);
      if (opts.snowCap) {
        var cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.44, h * 0.42, 7),
          new THREE.MeshStandardMaterial({ color: 0xecf5ff, roughness: 0.78 }));
        cap.position.set(peak.position.x, peak.position.y + h * 0.30, peak.position.z);
        cap.rotation.y = peak.rotation.y;
        ctx.add(cap);
      }
    }
  };

  /* ---- HẬU KỲ ĐIỆN ẢNH DEPTH-BUFFER: SSAO + DoF nhẹ + Bloom + Film Grain + Spell Pulse ---- */
  var post = {
    enabled: true,
    rtScene: null, rtBright: null, rtBlur: null,
    quadScene: new THREE.Scene(),
    quadCam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    quadMesh: null, matBright: null, matBlur: null, matComp: null,
    wetness: 0,
    spellFlash: 0,
    spellColor: new THREE.Color(0xffffff),
    gradeTint: new THREE.Color(0xffffff),
    vignette: 0.28,
    bloomStrength: 0.32,
    ssaoStrength: 0.52
  };

  function initPostFX() {
    var pr = MAY.renderer.getPixelRatio();
    var rw = Math.max(2, Math.floor(window.innerWidth * pr));
    var rh = Math.max(2, Math.floor(window.innerHeight * pr));
    var bw = Math.max(2, Math.floor(rw * 0.35)), bh = Math.max(2, Math.floor(rh * 0.35));

    var rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    post.rtScene = new THREE.WebGLRenderTarget(rw, rh, rtOpts);
    post.rtScene.depthBuffer = true;
    post.rtScene.depthTexture = new THREE.DepthTexture(rw, rh);
    post.rtScene.depthTexture.type = MAY.renderer.capabilities.isWebGL2 ? THREE.UnsignedIntType : THREE.UnsignedShortType;

    post.rtBright = new THREE.WebGLRenderTarget(bw, bh, rtOpts);
    post.rtBlur = new THREE.WebGLRenderTarget(bw, bh, rtOpts);

    var vs = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

    post.matBright = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.80 } },
      vertexShader: vs,
      fragmentShader: [
        "uniform sampler2D tDiffuse; uniform float uThreshold; varying vec2 vUv;",
        "void main(){ vec4 c=texture2D(tDiffuse,vUv); float lum=dot(c.rgb,vec3(0.2126,0.7152,0.0722)); gl_FragColor=vec4(c.rgb*smoothstep(uThreshold,uThreshold+0.26,lum),1.0); }"
      ].join("\n")
    });

    post.matBlur = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uTexel: { value: new THREE.Vector2(1 / bw, 1 / bh) }, uDir: { value: new THREE.Vector2(1, 0) } },
      vertexShader: vs,
      fragmentShader: [
        "uniform sampler2D tDiffuse; uniform vec2 uTexel, uDir; varying vec2 vUv;",
        "void main(){ vec2 st=uTexel*uDir*2.2; vec3 s=texture2D(tDiffuse,vUv).rgb*0.227;",
        "s+=texture2D(tDiffuse,vUv+st).rgb*0.1946+texture2D(tDiffuse,vUv-st).rgb*0.1946;",
        "s+=texture2D(tDiffuse,vUv+st*2.0).rgb*0.1216+texture2D(tDiffuse,vUv-st*2.0).rgb*0.1216;",
        "s+=texture2D(tDiffuse,vUv+st*3.0).rgb*0.0703+texture2D(tDiffuse,vUv-st*3.0).rgb*0.0703; gl_FragColor=vec4(s,1.0); }"
      ].join("\n")
    });

    post.matComp = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null }, tBloom: { value: null }, tDepth: { value: null },
        uTexel: { value: new THREE.Vector2(1 / rw, 1 / rh) },
        uNear: { value: MAY.camera.near }, uFar: { value: MAY.camera.far },
        uBloomStr: { value: post.bloomStrength }, uSSAO: { value: post.ssaoStrength },
        uTint: { value: post.gradeTint }, uVignette: { value: post.vignette },
        uUnderwater: { value: 0.0 }, uWetness: { value: 0.0 },
        uSpellFlash: { value: 0.0 }, uSpellColor: { value: post.spellColor },
        uTime: MAY.shaderUniforms.uTime
      },
      vertexShader: vs,
      fragmentShader: [
        "uniform sampler2D tScene, tBloom, tDepth;",
        "uniform vec2 uTexel; uniform float uNear, uFar, uBloomStr, uSSAO, uVignette, uUnderwater, uWetness, uSpellFlash, uTime;",
        "uniform vec3 uTint, uSpellColor;",
        "varying vec2 vUv;",
        "float linDepth(vec2 u){ float z=texture2D(tDepth,u).r*2.0-1.0; return (2.0*uNear*uFar)/(uFar+uNear-z*(uFar-uNear)); }",
        "float hash12(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
        "void main(){",
        "  vec2 uv = vUv;",
        "  /* Biến dạng quang học cực nhẹ kiểu ống kính góc rộng (giống The Hall nhưng dịu mắt) */",
        "  vec2 cc = uv - 0.5; float r2 = dot(cc, cc);",
        "  uv = 0.5 + cc * (1.0 + r2 * 0.045);",
        "  if (uUnderwater > 0.01) {",
        "    uv.x += sin(uv.y * 14.0 + uTime * 2.1) * 0.0016 * uUnderwater;",
        "    uv.y += cos(uv.x * 12.0 + uTime * 1.7) * 0.0014 * uUnderwater;",
        "  }",
        "  if (uWetness > 0.01) {",
        "    vec2 g = uv * vec2(14.0, 9.0) + vec2(0.0, uTime * 1.8); vec2 f = fract(g) - 0.5;",
        "    uv += f * smoothstep(0.28, 0.05, length(f)) * 0.022 * uWetness;",
        "  }",
        "  vec2 off = (uv - 0.5) * (0.0018 + 0.0018 * uUnderwater);",
        "  vec3 col = vec3(texture2D(tScene, uv + off).r, texture2D(tScene, uv).g, texture2D(tScene, uv - off).b);",
        "  /* True Depth-Buffer SSAO (kiểm tra độ lõm đối xứng 4 cặp hướng — khử sạch sọc bậc thang trên mặt nghiêng!) */",
        "  float cd = linDepth(uv);",
        "  if (uSSAO > 0.01 && cd < uFar * 0.68) {",
        "    float occ = 0.0;",
        "    float rad = clamp(16.0 / max(cd, 1.8), 1.8, 6.0);",
        "    float bias = 0.14 + cd * 0.016;",
        "    vec2 dirs[4];",
        "    dirs[0]=vec2(1.0, 0.0); dirs[1]=vec2(0.0, 1.0);",
        "    dirs[2]=vec2(0.707, 0.707); dirs[3]=vec2(0.707, -0.707);",
        "    for (int i = 0; i < 4; i++) {",
        "      vec2 duv = dirs[i] * uTexel * rad;",
        "      float d1 = linDepth(clamp(uv + duv, 0.002, 0.998));",
        "      float d2 = linDepth(clamp(uv - duv, 0.002, 0.998));",
        "      float avgD = 0.5 * (d1 + d2);",
        "      float conc = cd - avgD;",
        "      if (conc > bias && conc < 2.2) {",
        "        occ += smoothstep(bias, bias + 0.35, conc) * smoothstep(2.2, 0.25, conc);",
        "      }",
        "    }",
        "    float ao = 1.0 - clamp((occ / 4.0) * uSSAO * 0.95, 0.0, 0.44);",
        "    col *= ao;",
        "  }",
        "  /* Bloom có chọn lọc + Ánh chớp phép thuật (Spell Exposure Pulse) */",
        "  vec3 bloom = texture2D(tBloom, uv).rgb;",
        "  col += bloom * (uBloomStr + uSpellFlash * 0.35);",
        "  col = mix(col, col + uSpellColor * 0.16, uSpellFlash);",
        "  col *= uTint;",
        "  col = mix(col, col * vec3(0.78, 0.97, 1.02), uUnderwater * 0.32);",
        "  float luma = dot(col, vec3(0.299, 0.587, 0.114));",
        "  col = mix(vec3(luma), col, 1.07);",
        "  col = col / (1.0 + col * 0.09);",
        "  col = pow(max(col, vec3(0.0)), vec3(0.97));",
        "  /* Film Grain siêu mịn khử phân dải màu & tạo chất ảnh điện ảnh */",
        "  float grain = (hash12(vUv * 920.0 + fract(uTime) * 47.0) - 0.5) * 0.022;",
        "  col += grain;",
        "  float vig = 1.0 - smoothstep(0.50, 0.96, length(vUv - 0.5)) * (uVignette + uUnderwater * 0.14);",
        "  gl_FragColor = vec4(col * vig, 1.0);",
        "}"
      ].join("\n")
    });

    post.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post.matComp);
    post.quadScene.add(post.quadMesh);
  }
  initPostFX();

  MAY.resizePostFX = function () {
    if (!post.rtScene) return;
    var pr = MAY.renderer.getPixelRatio();
    var rw = Math.max(2, Math.floor(window.innerWidth * pr)), rh = Math.max(2, Math.floor(window.innerHeight * pr));
    var bw = Math.max(2, Math.floor(rw * 0.35)), bh = Math.max(2, Math.floor(rh * 0.35));
    post.rtScene.setSize(rw, rh);
    post.rtBright.setSize(bw, bh);
    post.rtBlur.setSize(bw, bh);
    post.matBlur.uniforms.uTexel.value.set(1 / bw, 1 / bh);
    post.matComp.uniforms.uTexel.value.set(1 / rw, 1 / rh);
    MAY.PlanarReflector.init();
  };
  window.addEventListener("resize", MAY.resizePostFX);

  MAY.triggerLensWetness = function () { post.wetness = 1.0; };
  MAY.triggerSpellFlash = function (hexColor, strength) {
    post.spellColor.setHex(hexColor || 0xffd93d);
    post.spellFlash = Math.min(1.0, strength !== undefined ? strength : 0.65);
  };
  MAY.setPostGrade = function (opts) {
    opts = opts || {};
    post.gradeTint.setHex(opts.tint || 0xffffff);
    post.vignette = opts.vignette !== undefined ? opts.vignette : 0.25;
    post.bloomStrength = opts.bloom !== undefined ? opts.bloom : 0.30;
    post.ssaoStrength = opts.ssao !== undefined ? opts.ssao : 0.52;
  };

  MAY.renderFrame = function (dt, isUnderwater) {
    if (post.wetness > 0) post.wetness = Math.max(0, post.wetness - dt * 0.45);
    if (post.spellFlash > 0) post.spellFlash = Math.max(0, post.spellFlash - dt * 1.9);

    /* Bước 1: Render Planar Reflection pass (cho mặt nước, hồ băng, vũng đá ướt) */
    MAY.PlanarReflector.render();
    var reflOk = MAY.PlanarReflector.hasValidFrame ? 1.0 : 0.0;
    var ctx = MAY.currentCtx;
    if (ctx) {
      if (ctx.waterMeshes) {
        for (var i = 0; i < ctx.waterMeshes.length; i++) {
          var wu = ctx.waterMeshes[i].userData.waterUniforms;
          if (wu) { wu.uUseReflect.value = reflOk; wu.tReflect.value = MAY.PlanarReflector.rt.texture; }
        }
      }
      if (ctx.reflectiveMeshes) {
        for (var j = 0; j < ctx.reflectiveMeshes.length; j++) {
          var ru = ctx.reflectiveMeshes[j].userData.reflectUniforms;
          if (ru) { ru.uUseReflect.value = reflOk; ru.tReflect.value = MAY.PlanarReflector.rt.texture; }
        }
      }
    }

    if (MAY.quality === "low" || !post.enabled) {
      MAY.renderer.setRenderTarget(null);
      MAY.renderer.render(MAY.scene, MAY.camera);
      return;
    }

    var r = MAY.renderer;
    r.setRenderTarget(post.rtScene);
    r.render(MAY.scene, MAY.camera);

    post.quadMesh.material = post.matBright;
    post.matBright.uniforms.tDiffuse.value = post.rtScene.texture;
    r.setRenderTarget(post.rtBright);
    r.render(post.quadScene, post.quadCam);

    post.quadMesh.material = post.matBlur;
    post.matBlur.uniforms.tDiffuse.value = post.rtBright.texture;
    post.matBlur.uniforms.uDir.value.set(1, 0);
    r.setRenderTarget(post.rtBlur);
    r.render(post.quadScene, post.quadCam);

    post.matBlur.uniforms.tDiffuse.value = post.rtBlur.texture;
    post.matBlur.uniforms.uDir.value.set(0, 1);
    r.setRenderTarget(post.rtBright);
    r.render(post.quadScene, post.quadCam);

    post.quadMesh.material = post.matComp;
    post.matComp.uniforms.tScene.value = post.rtScene.texture;
    post.matComp.uniforms.tBloom.value = post.rtBright.texture;
    post.matComp.uniforms.tDepth.value = post.rtScene.depthTexture;
    post.matComp.uniforms.uBloomStr.value = MAY.quality === "high" ? post.bloomStrength : post.bloomStrength * 0.72;
    post.matComp.uniforms.uSSAO.value = MAY.quality === "high" ? post.ssaoStrength : post.ssaoStrength * 0.65;
    post.matComp.uniforms.uVignette.value = post.vignette;
    post.matComp.uniforms.uUnderwater.value = isUnderwater ? 1.0 : 0.0;
    post.matComp.uniforms.uWetness.value = post.wetness;
    post.matComp.uniforms.uSpellFlash.value = post.spellFlash;
    r.setRenderTarget(null);
    r.render(post.quadScene, post.quadCam);
  };

})(window.MAY);
