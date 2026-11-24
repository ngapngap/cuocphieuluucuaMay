"use strict";
/* ============================================================================
   AUDIO.JS — 31 Clip Giọng Đọc Tiếng Việt Offline, Tiếng Bước Chân Theo Chất Liệu
   (Foley: cỏ, gỗ, cát, tuyết, băng, đá ướt, nước), Nhạc Môi Trường Từng Vùng & SFX Phép Thuật
   ============================================================================ */
(function (MAY) {

  MAY.voiceOn = true;
  MAY.hasViVoice = false;

  var AC = null;
  var noiseBuf = null;

  function getAC() {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    if (!noiseBuf) {
      var len = 2 * AC.sampleRate;
      noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return AC;
  }

  /* ---- Âm thanh tổng hợp cơ bản + Nhạc chuông ngũ cung ---- */
  MAY.beep = function (f, d, type, vol) {
    try {
      var ac = getAC();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(vol || 0.10, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + d);
    } catch (e) {}
  };

  MAY.sndStar = function () {
    MAY.beep(880, 0.14, "sine", 0.09);
    setTimeout(function () { MAY.beep(1174, 0.16, "sine", 0.09); }, 95);
    setTimeout(function () { MAY.beep(1568, 0.30, "triangle", 0.10); }, 200);
  };
  MAY.sndFriend = function () {
    MAY.beep(523, 0.14, "triangle", 0.09);
    setTimeout(function () { MAY.beep(659, 0.14, "triangle", 0.09); }, 105);
    setTimeout(function () { MAY.beep(784, 0.25, "triangle", 0.10); }, 210);
  };
  MAY.sndGem = function () {
    [523, 659, 784, 1046, 1318, 1568, 2093].forEach(function (n, idx) {
      setTimeout(function () { MAY.beep(n, 0.32, "triangle", 0.11); }, idx * 95);
    });
  };
  MAY.sndBounce = function () {
    try {
      var ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(220, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(640, ac.currentTime + 0.18);
      g.gain.setValueAtTime(0.13, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.22);
    } catch (e) {}
  };
  MAY.sndChime = function (idx) {
    var scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    var f = scale[idx % scale.length];
    MAY.beep(f, 0.55, "sine", 0.12);
    MAY.beep(f * 2, 0.35, "triangle", 0.04);
  };

  /* ---- Foley: Tiếng bước chân & bơi thay đổi theo chất liệu bề mặt ---- */
  function playNoiseBurst(freq, Q, dur, vol, filterType) {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC();
      var src = ac.createBufferSource(); src.buffer = noiseBuf;
      src.loop = true;
      var filt = ac.createBiquadFilter();
      filt.type = filterType || "bandpass";
      filt.frequency.value = freq * (0.88 + Math.random() * 0.24);
      filt.Q.value = Q || 1.4;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.001, ac.currentTime);
      g.gain.linearRampToValueAtTime(vol, ac.currentTime + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, ac.currentTime + dur);
      src.connect(filt); filt.connect(g); g.connect(ac.destination);
      src.start(0, Math.random() * 1.4);
      src.stop(ac.currentTime + dur + 0.02);
    } catch (e) {}
  }

  MAY.sndFootstep = function (surface) {
    if (!MAY.voiceOn) return;
    if (surface === "water") {
      playNoiseBurst(340, 1.2, 0.22, 0.045, "lowpass");
      MAY.beep(260 + Math.random() * 140, 0.07, "sine", 0.025);
    } else if (surface === "ice") {
      playNoiseBurst(3200, 3.2, 0.14, 0.032, "bandpass");
    } else if (surface === "snow") {
      playNoiseBurst(1600, 1.1, 0.11, 0.042, "bandpass");
    } else if (surface === "sand") {
      playNoiseBurst(1100, 0.9, 0.12, 0.038, "bandpass");
    } else if (surface === "wetstone") {
      playNoiseBurst(1400, 2.2, 0.09, 0.045, "bandpass");
      MAY.beep(180 + Math.random() * 50, 0.06, "triangle", 0.035);
    } else if (surface === "wood") {
      MAY.beep(145 + Math.random() * 30, 0.075, "triangle", 0.055);
      playNoiseBurst(750, 1.8, 0.06, 0.025, "bandpass");
    } else if (surface === "cloud") {
      playNoiseBurst(600, 0.8, 0.14, 0.022, "lowpass");
    } else {
      /* grass */
      playNoiseBurst(920, 1.0, 0.10, 0.032, "bandpass");
    }
  };

  /* ---- Âm thanh phép thuật "Juicy" cho 6 kỹ năng nguyên tố ---- */
  MAY.sndSpell = function (spellId) {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC();
      if (spellId === "wave") {
        playNoiseBurst(460, 1.2, 0.65, 0.09, "bandpass");
        [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.25, "sine", 0.07); }, i * 65); });
      } else if (spellId === "growth") {
        playNoiseBurst(1800, 1.5, 0.45, 0.05, "bandpass");
        [392, 493, 587, 784, 987, 1174].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.38, "triangle", 0.08); }, i * 55); });
      } else if (spellId === "solar") {
        playNoiseBurst(260, 0.7, 0.75, 0.13, "lowpass");
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sawtooth"; o.frequency.setValueAtTime(140, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(42, ac.currentTime + 0.55);
        g.gain.setValueAtTime(0.09, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
        o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.62);
        setTimeout(function () { MAY.beep(880, 0.35, "sine", 0.07); }, 120);
      } else if (spellId === "crystal") {
        [659, 987, 1318, 1568, 1975].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.55, "sine", 0.08); }, i * 45); });
      } else if (spellId === "frost") {
        playNoiseBurst(3600, 2.0, 0.65, 0.07, "highpass");
        [1568, 1318, 1760, 2093].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.35, "sine", 0.06); }, i * 50); });
      } else if (spellId === "tornado") {
        playNoiseBurst(380, 0.9, 1.25, 0.12, "bandpass");
        [440, 554, 659, 880, 1108].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.42, "triangle", 0.07); }, i * 75); });
      }
    } catch (e) {}
  };

  /* ---- Âm thanh Không Gian 3D (PositionalAudio PannerNode đồng bộ theo Camera!) ---- */
  var _fwdVec = new THREE.Vector3(), _upVec = new THREE.Vector3();
  MAY.updateAudioListener = function (cam) {
    if (!AC || !cam) return;
    try {
      var l = AC.listener;
      if (l.positionX) {
        l.positionX.value = cam.position.x;
        l.positionY.value = cam.position.y;
        l.positionZ.value = cam.position.z;
        cam.getWorldDirection(_fwdVec);
        _upVec.set(0, 1, 0).applyQuaternion(cam.quaternion);
        l.forwardX.value = _fwdVec.x; l.forwardY.value = _fwdVec.y; l.forwardZ.value = _fwdVec.z;
        l.upX.value = _upVec.x; l.upY.value = _upVec.y; l.upZ.value = _upVec.z;
      } else if (l.setPosition) {
        l.setPosition(cam.position.x, cam.position.y, cam.position.z);
      }
    } catch (e) {}
  };

  MAY.play3DSound = function (pos, freq, dur, type, vol) {
    if (!MAY.voiceOn || !pos) return;
    try {
      var ac = getAC();
      var o = ac.createOscillator(), g = ac.createGain(), pan = ac.createPanner();
      pan.panningModel = "equalpower";
      pan.distanceModel = "inverse";
      pan.refDistance = 6;
      pan.maxDistance = 65;
      if (pan.positionX) { pan.positionX.value = pos.x; pan.positionY.value = pos.y; pan.positionZ.value = pos.z; }
      else if (pan.setPosition) pan.setPosition(pos.x, pos.y, pos.z);
      o.type = type || "triangle";
      o.frequency.value = freq || 440;
      g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (dur || 0.35));
      o.connect(g); g.connect(pan); pan.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + (dur || 0.35));
    } catch (e) {}
  };

  /* ---- Âm thanh Cốt truyện, Giải đố, Hất văng quái & Đấu Trùm (v10.0) ---- */
  MAY.sndDialogue = function () {
    if (!MAY.voiceOn) return;
    MAY.beep(660, 0.08, "sine", 0.06);
    setTimeout(function () { MAY.beep(880, 0.10, "triangle", 0.06); }, 60);
  };
  MAY.sndSkillUnlock = function () {
    if (!MAY.voiceOn) return;
    [523, 659, 784, 1046, 1318, 1568].forEach(function (f, i) {
      setTimeout(function () { MAY.beep(f, 0.42, "triangle", 0.11); }, i * 70);
    });
  };
  MAY.sndTreeRevive = function (pos) {
    if (!MAY.voiceOn) return;
    playNoiseBurst(1600, 1.3, 0.5, 0.055, "bandpass");
    [392, 523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () {
        if (pos) MAY.play3DSound(pos, f, 0.42, "triangle", 0.11);
        else MAY.beep(f, 0.42, "triangle", 0.09);
      }, i * 65);
    });
  };
  MAY.sndShatter = function (pos) {
    if (!MAY.voiceOn) return;
    playNoiseBurst(2600, 0.9, 0.38, 0.11, "highpass");
    [1200, 920, 1580, 640].forEach(function (f, i) {
      setTimeout(function () {
        if (pos) MAY.play3DSound(pos, f, 0.18, "sawtooth", 0.06);
        else MAY.beep(f, 0.18, "sawtooth", 0.05);
      }, i * 35);
    });
  };
  MAY.sndFreeze = function (pos) {
    if (!MAY.voiceOn) return;
    playNoiseBurst(4200, 2.2, 0.48, 0.075, "highpass");
    [1318, 1568, 2093].forEach(function (f, i) {
      setTimeout(function () {
        if (pos) MAY.play3DSound(pos, f, 0.35, "sine", 0.09);
        else MAY.beep(f, 0.35, "sine", 0.07);
      }, i * 55);
    });
  };
  MAY.sndLaser = function (pos) {
    if (!MAY.voiceOn) return;
    if (pos) MAY.play3DSound(pos, 740, 0.55, "sawtooth", 0.08);
    MAY.beep(1110, 0.45, "sine", 0.07);
  };
  MAY.sndLaunchSky = function (pos) {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(280, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(1680, ac.currentTime + 0.65);
      g.gain.setValueAtTime(0.11, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.72);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.75);
      setTimeout(function () { MAY.beep(1760, 0.25, "triangle", 0.09); }, 680);
    } catch (e) {}
  };
  MAY.sndBossRoar = function (pos) {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(135, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(52, ac.currentTime + 0.75);
      g.gain.setValueAtTime(0.13, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.82);
      playNoiseBurst(240, 0.8, 0.7, 0.11, "lowpass");
    } catch (e) {}
  };
  MAY.sndBossHit = function (pos) {
    if (!MAY.voiceOn) return;
    playNoiseBurst(320, 0.7, 0.4, 0.13, "lowpass");
    if (pos) MAY.play3DSound(pos, 523, 0.3, "triangle", 0.13);
    setTimeout(function () { MAY.beep(784, 0.28, "triangle", 0.10); }, 100);
  };
  MAY.sndBossWin = function () {
    if (!MAY.voiceOn) return;
    [523, 659, 784, 1046, 1174, 1318, 1568, 2093].forEach(function (f, i) {
      setTimeout(function () { MAY.beep(f, 0.45, "triangle", 0.11); }, i * 85);
    });
  };
  MAY.sndHurt = function () {
    if (!MAY.voiceOn) return;
    MAY.beep(240, 0.14, "sawtooth", 0.09);
    setTimeout(function () { MAY.beep(165, 0.22, "sawtooth", 0.08); }, 95);
  };
  MAY.sndHeal = function () {
    if (!MAY.voiceOn) return;
    MAY.beep(659, 0.14, "sine", 0.08);
    setTimeout(function () { MAY.beep(987, 0.22, "sine", 0.09); }, 90);
  };

  /* ---- Nhạc môi trường & Âm thanh không gian riêng cho từng vùng đất ---- */
  var ambGain = null, ambFilter = null, ambStarted = false, currentBiome = "hub";
  var musicTimer = null;

  var BIOME_SCALES = {
    hub:    [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    level1: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0],
    level2: [293.7, 329.6, 392.0, 440.0, 523.3, 587.3],
    level3: [261.6, 277.2, 329.6, 349.2, 392.0, 440.0],
    level4: [246.9, 293.7, 329.6, 370.0, 440.0, 493.9],
    level5: [329.6, 392.0, 440.0, 493.9, 587.3, 659.3],
    level6: [349.2, 440.0, 523.3, 587.3, 659.3, 784.0]
  };

  function tickBiomeSoundscape() {
    if (!MAY.voiceOn || !MAY.started || MAY.modalOpen) return;
    try {
      var scale = BIOME_SCALES[currentBiome] || BIOME_SCALES.hub;
      var f = scale[Math.floor(Math.random() * scale.length)];
      if (currentBiome === "level4") {
        /* Tiếng giọt nước nhỏ & pha lê vang nhẹ trong hang */
        MAY.beep(f * 2, 0.65, "sine", 0.032);
        if (Math.random() < 0.45) setTimeout(function () { MAY.beep(1320 + Math.random() * 450, 0.14, "sine", 0.025); }, 380);
      } else if (currentBiome === "level2") {
        /* Đàn harp rừng + tiếng chim hót nhẹ */
        MAY.beep(f, 0.55, "triangle", 0.028);
        if (Math.random() < 0.4) {
          setTimeout(function () {
            MAY.beep(2200 + Math.random() * 700, 0.07, "sine", 0.018);
            setTimeout(function () { MAY.beep(2600 + Math.random() * 500, 0.09, "sine", 0.016); }, 95);
          }, 420);
        }
      } else if (currentBiome === "level5" || currentBiome === "level6") {
        /* Chuông tuyết / chuông gió trên mây trong trẻo */
        MAY.beep(f * 2, 0.72, "sine", 0.026);
        setTimeout(function () { MAY.beep(f * 1.5, 0.6, "triangle", 0.02); }, 240);
      } else {
        /* Hợp âm dịu êm đại dương / đảo / sa mạc */
        MAY.beep(f, 0.65, "sine", 0.026);
        setTimeout(function () { MAY.beep(f * 1.5, 0.5, "triangle", 0.018); }, 280);
      }
    } catch (e) {}
  }

  MAY.startAmbient = function () {
    if (ambStarted) return;
    ambStarted = true;
    try {
      var ac = getAC();
      var len = 2 * ac.sampleRate;
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      }
      var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      ambFilter = ac.createBiquadFilter(); ambFilter.type = "lowpass"; ambFilter.frequency.value = 380;
      ambGain = ac.createGain(); ambGain.gain.value = 0;
      var lfo = ac.createOscillator(); lfo.frequency.value = 0.09;
      var lfoG = ac.createGain(); lfoG.gain.value = 0.014;
      lfo.connect(lfoG); lfoG.connect(ambGain.gain); lfo.start();
      src.connect(ambFilter); ambFilter.connect(ambGain); ambGain.connect(ac.destination);
      src.start();
      ambGain.gain.linearRampToValueAtTime(MAY.voiceOn ? 0.04 : 0, ac.currentTime + 1.5);
    } catch (e) {}
    if (!musicTimer) musicTimer = setInterval(tickBiomeSoundscape, 2900);
  };

  MAY.setAmbientTone = function (freq, vol, biomeId) {
    if (biomeId) currentBiome = biomeId;
    if (ambFilter) ambFilter.frequency.value = freq || 380;
    if (ambGain) ambGain.gain.value = MAY.voiceOn ? (vol !== undefined ? vol : 0.04) : 0;
  };

  /* ---- Giọng đọc tiếng Việt 100% offline (31 MP3 trong assets/voice/ + vi-VN native cho câu đố động) ---- */
  var viVoice = null, _speakSeq = 0, _speakTimer = null, _activeUtterance = null, _curAudio = null;
  var _audioCache = {};

  function scoreViVoice(v) {
    var lang = (v.lang || "").toLowerCase().replace("_", "-");
    var name = (v.name || "").toLowerCase();
    var isVi = (lang === "vi" || lang.indexOf("vi-") === 0 || name.indexOf("vietnam") !== -1 || name.indexOf("tiếng việt") !== -1 || name.indexOf("hoaimy") !== -1 || name.indexOf("namminh") !== -1);
    if (!isVi) return 0;
    var sc = 10;
    if (name.indexOf("hoaimy") !== -1 || name.indexOf("natural") !== -1) sc += 50;
    else if (name.indexOf("google") !== -1) sc += 40;
    else if (name.indexOf("namminh") !== -1 || name.indexOf("linh") !== -1) sc += 35;
    if (lang === "vi-vn") sc += 10;
    return sc;
  }

  function pickVoice() {
    try {
      var vs = speechSynthesis.getVoices() || [];
      var best = null, bestSc = 0;
      for (var i = 0; i < vs.length; i++) {
        var sc = scoreViVoice(vs[i]);
        if (sc > bestSc) { bestSc = sc; best = vs[i]; }
      }
      viVoice = best;
      MAY.hasViVoice = !!viVoice;
    } catch (e) {}
  }

  function cleanSpeechText(text) {
    return String(text || "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, " ")
      .replace(/[•|▶↺✓✨⭐]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function inferVoiceClip(clean) {
    var s = clean.toLowerCase();
    if (s.indexOf("thức tỉnh phép") !== -1 || s.indexOf("kỹ năng mới") !== -1) return "skill_unlock";
    if (s.indexOf("hồi sinh") !== -1 && (s.indexOf("cây") !== -1 || s.indexOf("rừng") !== -1 || s.indexOf("ốc đảo") !== -1)) return "tree_revive";
    if (s.indexOf("hất") !== -1 && s.indexOf("lên trời") !== -1) return "launch_sky";
    if (s.indexOf("đài gương") !== -1 || s.indexOf("tia nắng hội tụ") !== -1) return "mirror_beam";
    if (s.indexOf("cầu băng") !== -1 || s.indexOf("đóng băng") !== -1) return "ice_bridge";
    if (s.indexOf("vỡ tan") !== -1 || s.indexOf("bức tường") !== -1 || s.indexOf("đàn nhạc") !== -1) return "crystal_break";
    if (s.indexOf("xuất hiện") !== -1 || s.indexOf("trùm") !== -1 || s.indexOf("vua mây bão") !== -1 || s.indexOf("bạch tuộc mực") !== -1 || s.indexOf("vua nấm") !== -1 || s.indexOf("bọ cạp sa mạc") !== -1 || s.indexOf("golem") !== -1 || s.indexOf("sói tuyết") !== -1) return "boss_appear";
    if (s.indexOf("đánh bại") !== -1 || s.indexOf("thanh tẩy") !== -1 || s.indexOf("tan biến") !== -1) return "boss_win";
    if (s.indexOf("trúng đòn") !== -1 || s.indexOf("vỡ giáp") !== -1 || s.indexOf("choáng") !== -1) return "boss_hit";
    if (s.indexOf("chào mừng mây về đảo mây") !== -1 || s.indexOf("cụ rùa già gác đèn") !== -1) return "hub";
    if (s.indexOf("vịnh san hô") !== -1) return "level1";
    if (s.indexOf("khu rừng nấm xanh") !== -1) return "level2";
    if (s.indexOf("sa mạc kim tự tháp") !== -1) return "level3";
    if (s.indexOf("hang động pha lê") !== -1) return "level4";
    if (s.indexOf("thung lũng tuyết") !== -1) return "level5";
    if (s.indexOf("vương quốc trên mây") !== -1) return "level6";
    if (s.indexOf("gom đủ 6 viên ngọc") !== -1 || s.indexOf("lễ hội cầu vồng") !== -1) return "finale";
    if (s.indexOf("đã nhận được") !== -1 && s.indexOf("ngọc") !== -1) return "gem_win";
    if (s.indexOf("sẵn sàng") !== -1 || s.indexOf("thức giấc") !== -1) return "gem_ready";
    if (s.indexOf("bảo vật ẩn") !== -1) return "hidden";
    if (s.indexOf("ánh vàng") !== -1 || s.indexOf("ánh trăng") !== -1 || s.indexOf("bí mật") !== -1 || s.indexOf("lấp lánh") !== -1) return "hidden_hint";
    if (s.indexOf("rương kho báu") !== -1 || s.indexOf("tìm được kho báu") !== -1) return "chest";
    if (s.indexOf("thắng cuộc đua") !== -1) return "race_win";
    if (s.indexOf("bắt đầu đua") !== -1) return "race_start";
    if (s.indexOf("hết giờ") !== -1) return "race_timeout";
    if (s.indexOf("qua vòng") !== -1 || s.indexOf("5 vòng") !== -1 || s.indexOf("tiếp tục nào") !== -1) return "ring";
    if (s.indexOf("câu đố nè") !== -1) return "quiz_open";
    if (s.indexOf("đúng rồi") !== -1 || s.indexOf("đúng 3 câu") !== -1) return "quiz_ok";
    if (s.indexOf("chưa đúng") !== -1) return "quiz_wrong";
    if (s.indexOf("lên bờ") !== -1) return "land";
    if (s.indexOf("xuống nước") !== -1) return "water";
    if (s.indexOf("gió mát đỡ mây") !== -1) return "wind_save";
    if (s.indexOf("đọc to cho bé") !== -1) return "voice_on";
    if (s.indexOf("mặc bộ") !== -1) return "outfit";
    if (s.indexOf("đủ hết rồi") !== -1) return "item_done";
    if (s.indexOf("mây gặp") !== -1) return "friend";
    if (s.indexOf("vui lắm") !== -1 || s.indexOf("thích mây") !== -1 || s.indexOf("đi cùng mây") !== -1) return "pet";
    if (s.indexOf("nhặt được rồi") !== -1) return "item";
    if (s.indexOf("nhặt được") !== -1 || s.indexOf("đủ rồi") !== -1) return "souvenir";
    if (s.indexOf("bong bóng") !== -1 || s.indexOf("ngân vang") !== -1 || s.indexOf("nở") !== -1 || s.indexOf("mưa tim") !== -1) return "interact";
    return null;
  }

  function stopSpeech() {
    _speakSeq++;
    clearTimeout(_speakTimer);
    if (_curAudio) { try { _curAudio.pause(); _curAudio.currentTime = 0; } catch (e) {} _curAudio = null; }
    if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch (e) {} }
    _activeUtterance = null;
  }

  function playLocalVoiceClip(key, seq) {
    if (!key || !MAY.voiceOn) return false;
    var a = _audioCache[key];
    if (!a) { a = new Audio("assets/voice/" + key + ".mp3"); a.preload = "auto"; _audioCache[key] = a; }
    try { a.currentTime = 0; } catch (e) {}
    _curAudio = a;
    a.onended = function () { if (seq === _speakSeq) _curAudio = null; };
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
    return true;
  }

  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
    setTimeout(pickVoice, 300);
    setTimeout(pickVoice, 1200);
  }

  MAY.stopSpeech = stopSpeech;
  MAY.playVoice = function (clipKey) {
    if (!MAY.voiceOn || !clipKey) return;
    stopSpeech();
    playLocalVoiceClip(clipKey, _speakSeq);
  };
  MAY.speak = function (text, clipKey) {
    if (!MAY.voiceOn || !text) return;
    var clean = cleanSpeechText(text);
    if (!clean) return;
    stopSpeech();
    var seq = _speakSeq;
    if ("speechSynthesis" in window && !viVoice) pickVoice();

    var isDynamicQuiz = clean.toLowerCase().indexOf("câu đố nè") === 0;
    if (isDynamicQuiz && viVoice && "speechSynthesis" in window) {
      _speakTimer = setTimeout(function () {
        if (seq !== _speakSeq || !MAY.voiceOn) return;
        try {
          var u = new SpeechSynthesisUtterance(clean);
          u.voice = viVoice; u.lang = viVoice.lang || "vi-VN"; u.rate = 0.96; u.pitch = 1.0;
          _activeUtterance = u; u.onend = u.onerror = function () { _activeUtterance = null; };
          speechSynthesis.speak(u);
        } catch (e) {}
      }, 45);
      return;
    }

    var key = clipKey || inferVoiceClip(clean);
    if (key) { playLocalVoiceClip(key, seq); return; }

    if (viVoice && "speechSynthesis" in window) {
      _speakTimer = setTimeout(function () {
        if (seq !== _speakSeq || !MAY.voiceOn) return;
        try {
          var u2 = new SpeechSynthesisUtterance(clean);
          u2.voice = viVoice; u2.lang = viVoice.lang || "vi-VN"; u2.rate = 0.98; u2.pitch = 1.0;
          _activeUtterance = u2; u2.onend = u2.onerror = function () { _activeUtterance = null; };
          speechSynthesis.speak(u2);
        } catch (e) {}
      }, 45);
    }
  };

})(window.MAY);
