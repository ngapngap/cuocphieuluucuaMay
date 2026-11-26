"use strict";
/* ============================================================================
   AUDIO.JS — Master Bus (Compressor + Reverb), Biến Thiên Cao Độ/Âm Lượng,
   Tiếng Nền 3 Lớp Theo Màn, Nguồn Âm 3D Lặp Gắn Vật Thể, Ducking Khi Đọc Thoại
   & Giọng Đọc Tiếng Việt Offline
   ============================================================================ */
(function (MAY) {

  MAY.voiceOn = true;
  MAY.hasViVoice = false;

  var AC = null;
  var noiseBuf = null;
  var pinkBuf = null;
  var brownBuf = null;
  var masterGain = null;
  var sfxBus = null;
  var ambBus = null;
  var compressor = null;
  var reverbNode = null;
  var reverbSend = null;
  var isDucked = false;
  var chimeTimer = null;

  function buildReverbIR(ac, seconds, decay) {
    var rate = ac.sampleRate;
    var len = Math.floor(rate * seconds);
    var ir = ac.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var data = ir.getChannelData(ch);
      var lp = 0;
      for (var i = 0; i < len; i++) {
        var env = Math.pow(1 - i / len, decay);
        var n = (Math.random() * 2 - 1) * env;
        lp = lp * 0.55 + n * 0.45;
        data[i] = lp * 0.45;
      }
    }
    return ir;
  }

  function getAC() {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      /* Chuỗi âm thanh tổng: [sfxBus / ambBus] -> masterGain -> (Dry + Reverb) -> Compressor -> Loa */
      masterGain = AC.createGain();
      masterGain.gain.value = MAY.voiceOn ? 1.0 : 0.0;

      sfxBus = AC.createGain();
      sfxBus.gain.value = 1.0;
      sfxBus.connect(masterGain);

      ambBus = AC.createGain();
      ambBus.gain.value = isDucked ? 0.26 : 1.0;
      ambBus.connect(masterGain);

      compressor = AC.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.22;

      reverbNode = AC.createConvolver();
      reverbNode.buffer = buildReverbIR(AC, 1.55, 2.6);
      reverbSend = AC.createGain();
      reverbSend.gain.value = 0.22;

      masterGain.connect(compressor);
      masterGain.connect(reverbSend);
      reverbSend.connect(reverbNode);
      reverbNode.connect(compressor);
      compressor.connect(AC.destination);

      /* Bộ đệm nhiễu dùng chung: Trắng, Hồng, Nâu */
      var len = 2 * AC.sampleRate;
      noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
      pinkBuf = AC.createBuffer(1, len, AC.sampleRate);
      brownBuf = AC.createBuffer(1, len, AC.sampleRate);
      var wd = noiseBuf.getChannelData(0);
      var pd = pinkBuf.getChannelData(0);
      var bd = brownBuf.getChannelData(0);
      var b0 = 0, b1 = 0, b2 = 0, lastB = 0;
      for (var i = 0; i < len; i++) {
        var w = Math.random() * 2 - 1;
        wd[i] = w;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        pd[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
        lastB = (lastB + 0.02 * w) / 1.02;
        bd[i] = lastB * 3.2;
      }
    }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }

  function varyPitch(f, spread) {
    var s = spread !== undefined ? spread : 0.035;
    return f * (1 + (Math.random() * 2 - 1) * s);
  }
  function varyVol(v, spread) {
    var s = spread !== undefined ? spread : 0.08;
    return Math.max(0.002, v * (1 + (Math.random() * 2 - 1) * s));
  }

  /* Nút âm lượng tổng (Master Mute / Volume) — tắt sạch mọi tiếng beep, SFX, reverb, nền & nguồn 3D! */
  MAY.setMasterMute = function (muted) {
    MAY.voiceOn = !muted;
    if (muted) stopSpeech();
    if (MAY.refreshDialogueVoiceUI) MAY.refreshDialogueVoiceUI();
    if (!AC || !masterGain) return;
    try {
      var now = AC.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(muted ? 0.0 : 1.0, now + 0.06);
    } catch (e) {}
  };

  /* Giảm nhạc nền & nguồn 3D mượt mà khi giọng đọc đang phát (Audio Ducking) */
  function setVoiceDuck(active) {
    isDucked = !!active;
    updateAmbienceGain();
  }

  function updateAmbienceGain() {
    if (!AC || !ambBus) return;
    try {
      var now = AC.currentTime;
      var target = chimeTimer !== null ? 0.16 : isDucked ? 0.26 : 1;
      ambBus.gain.cancelScheduledValues(now);
      ambBus.gain.setValueAtTime(ambBus.gain.value, now);
      ambBus.gain.linearRampToValueAtTime(target, now + (target < 1 ? 0.08 : 0.45));
    } catch (e) {}
  }

  /* ---- Âm thanh tổng hợp cơ bản + Nhạc chuông ngũ cung (đều qua masterGain & có biến thiên tự nhiên) ---- */
  MAY.beep = function (f, d, type, vol, opts) {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC();
      opts = opts || {};
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine";
      var pSpread = opts.exact ? 0 : (opts.tight ? 0.012 : 0.032);
      o.frequency.value = varyPitch(f, pSpread);
      var v0 = varyVol(vol || 0.10, opts.tight ? 0.05 : 0.09);
      g.gain.setValueAtTime(v0, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
      o.connect(g);
      g.connect(opts.bus === "amb" ? ambBus : sfxBus);
      o.start(); o.stop(ac.currentTime + d);
    } catch (e) {}
  };

  MAY.sndStar = function () {
    MAY.beep(880, 0.14, "sine", 0.09, { tight: true });
    setTimeout(function () { MAY.beep(1174, 0.16, "sine", 0.09, { tight: true }); }, 95);
    setTimeout(function () { MAY.beep(1568, 0.30, "triangle", 0.10, { tight: true }); }, 200);
  };
  MAY.sndFriend = function () {
    MAY.beep(523, 0.14, "triangle", 0.09, { tight: true });
    setTimeout(function () { MAY.beep(659, 0.14, "triangle", 0.09, { tight: true }); }, 105);
    setTimeout(function () { MAY.beep(784, 0.25, "triangle", 0.10, { tight: true }); }, 210);
  };
  MAY.sndGem = function () {
    [523, 659, 784, 1046, 1318, 1568, 2093].forEach(function (n, idx) {
      setTimeout(function () { MAY.beep(n, 0.32, "triangle", 0.11, { tight: true }); }, idx * 95);
    });
  };
  MAY.sndBounce = function () {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(varyPitch(220, 0.05), ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(varyPitch(640, 0.05), ac.currentTime + 0.18);
      g.gain.setValueAtTime(varyVol(0.13, 0.08), ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
      o.connect(g); g.connect(sfxBus); o.start(); o.stop(ac.currentTime + 0.22);
    } catch (e) {}
  };
  MAY.sndChime = function (idx) {
    if (!MAY.voiceOn) return;
    var scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    var f = scale[idx % scale.length];
    if (currentBiome === "level4") {
      clearTimeout(chimeTimer);
      chimeTimer = setTimeout(function () { chimeTimer = null; updateAmbienceGain(); }, 750);
      updateAmbienceGain();
    }
    MAY.beep(f, 0.55, "sine", 0.12, { exact: true });
    MAY.beep(f * 2, 0.35, "triangle", 0.04, { exact: true });
  };

  MAY.sndCoralRelease = function (pos) {
    if (!MAY.voiceOn) return;
    var ctx = MAY.currentCtx;
    MAY.sndShatter(pos);
    [660, 990, 1320].forEach(function (f, i) {
      setTimeout(function () {
        if (MAY.currentCtx === ctx && MAY.voiceOn) MAY.play3DSound(pos, f, 0.48, "sine", 0.10);
      }, 270 + 150 * i);
    });
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
      filt.frequency.value = varyPitch(freq, 0.12);
      filt.Q.value = Q || 1.4;
      var g = ac.createGain();
      g.gain.setValueAtTime(0.001, ac.currentTime);
      g.gain.linearRampToValueAtTime(varyVol(vol, 0.12), ac.currentTime + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, ac.currentTime + dur);
      src.connect(filt); filt.connect(g); g.connect(sfxBus);
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
    } else if (surface === "stone") {
      playNoiseBurst(1150, 2.0, 0.075, 0.040, "bandpass");
      MAY.beep(165 + Math.random() * 35, 0.055, "triangle", 0.030);
    } else if (surface === "wood") {
      MAY.beep(145 + Math.random() * 30, 0.075, "triangle", 0.055);
      playNoiseBurst(750, 1.8, 0.06, 0.025, "bandpass");
    } else if (surface === "cloud") {
      playNoiseBurst(600, 0.8, 0.14, 0.022, "lowpass");
    } else {
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
        o.type = "sawtooth"; o.frequency.setValueAtTime(varyPitch(140, 0.04), ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(varyPitch(42, 0.04), ac.currentTime + 0.55);
        g.gain.setValueAtTime(varyVol(0.09, 0.08), ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);
        o.connect(g); g.connect(sfxBus); o.start(); o.stop(ac.currentTime + 0.62);
        setTimeout(function () { MAY.beep(880, 0.35, "sine", 0.07); }, 120);
      } else if (spellId === "crystal") {
        [659, 987, 1318, 1568, 1975].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.55, "sine", 0.08, { tight: true }); }, i * 45); });
      } else if (spellId === "frost") {
        playNoiseBurst(3600, 2.0, 0.65, 0.07, "highpass");
        [1568, 1318, 1760, 2093].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.35, "sine", 0.06); }, i * 50); });
      } else if (spellId === "tornado") {
        playNoiseBurst(380, 0.9, 1.25, 0.12, "bandpass");
        [440, 554, 659, 880, 1108].forEach(function (f, i) { setTimeout(function () { MAY.beep(f, 0.42, "triangle", 0.07); }, i * 75); });
      }
    } catch (e) {}
  };

  /* ---- Âm thanh Không Gian 3D HRTF (Binaural PannerNode đồng bộ theo Camera mỗi frame!) ---- */
  var _fwdVec = new THREE.Vector3(), _upVec = new THREE.Vector3();
  MAY.updateAudioListener = function (cam) {
    if (!AC || !cam) return;
    try {
      var l = AC.listener;
      cam.getWorldDirection(_fwdVec);
      _upVec.set(0, 1, 0).applyQuaternion(cam.quaternion);
      if (l.positionX) {
        var now = AC.currentTime;
        l.positionX.setValueAtTime(cam.position.x, now);
        l.positionY.setValueAtTime(cam.position.y, now);
        l.positionZ.setValueAtTime(cam.position.z, now);
        l.forwardX.setValueAtTime(_fwdVec.x, now);
        l.forwardY.setValueAtTime(_fwdVec.y, now);
        l.forwardZ.setValueAtTime(_fwdVec.z, now);
        l.upX.setValueAtTime(_upVec.x, now);
        l.upY.setValueAtTime(_upVec.y, now);
        l.upZ.setValueAtTime(_upVec.z, now);
      } else {
        if (l.setPosition) l.setPosition(cam.position.x, cam.position.y, cam.position.z);
        if (l.setOrientation) l.setOrientation(_fwdVec.x, _fwdVec.y, _fwdVec.z, _upVec.x, _upVec.y, _upVec.z);
      }
    } catch (e) {}
  };

  function createHRTFPanner(ac, pos, refDist, maxDist, rolloff) {
    var pan = ac.createPanner();
    try { pan.panningModel = "HRTF"; } catch (e) { pan.panningModel = "equalpower"; }
    pan.distanceModel = "inverse";
    pan.refDistance = refDist !== undefined ? refDist : 6;
    pan.maxDistance = maxDist !== undefined ? maxDist : 65;
    pan.rolloffFactor = rolloff !== undefined ? rolloff : 1.3;
    pan.coneInnerAngle = 360;
    pan.coneOuterAngle = 360;
    pan.coneOuterGain = 0;
    if (pos) {
      if (pan.positionX) {
        pan.positionX.value = pos.x; pan.positionY.value = pos.y; pan.positionZ.value = pos.z;
      } else if (pan.setPosition) {
        pan.setPosition(pos.x, pos.y, pos.z);
      }
    }
    return pan;
  }
  MAY.getPanningModel = function () { return "HRTF"; };

  MAY.play3DSound = function (pos, freq, dur, type, vol) {
    if (!MAY.voiceOn || !pos) return;
    try {
      var ac = getAC();
      var o = ac.createOscillator(), g = ac.createGain();
      var pan = createHRTFPanner(ac, pos, 6, 65, 1.25);
      o.type = type || "triangle";
      o.frequency.value = varyPitch(freq || 440, 0.035);
      g.gain.setValueAtTime(varyVol(vol || 0.12, 0.08), ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (dur || 0.35));
      o.connect(g); g.connect(pan); pan.connect(sfxBus);
      o.start(); o.stop(ac.currentTime + (dur || 0.35));
    } catch (e) {}
  };

  /* ---- Nguồn Âm 3D HRTF Lặp Gắn Vào Vật Thể Cụ Thể (đèn lồng lửa, suối/thác nước, pha lê, cối xay gió) ---- */
  var active3DLoops = [];
  var pending3DLoops = [];

  function startOne3DLoop(spec) {
    try {
      var ac = getAC();
      var pos = spec.pos;
      var kind = spec.kind || "water";
      var vol = spec.vol !== undefined ? spec.vol : 0.045;
      var pan = createHRTFPanner(ac, pos, spec.refDist || 5.5, spec.maxDist || 48, spec.rolloff || 1.35);

      var g = ac.createGain();
      g.gain.value = vol;
      g.connect(pan);
      pan.connect(ambBus);

      var nodesToStop = [];
      var nodesToDisc = [g, pan];

      if (kind === "fire") {
        /* Tiếng lửa đèn lồng / đài lửa ấm tách tách dịu nhẹ */
        var srcF = ac.createBufferSource(); srcF.buffer = pinkBuf; srcF.loop = true;
        var fltF = ac.createBiquadFilter(); fltF.type = "bandpass"; fltF.frequency.value = spec.freq || 780; fltF.Q.value = 1.6;
        var lfoF = ac.createOscillator(); lfoF.frequency.value = 4.2 + Math.random() * 2.5;
        var lfoFG = ac.createGain(); lfoFG.gain.value = vol * 0.38;
        lfoF.connect(lfoFG); lfoFG.connect(g.gain);
        srcF.connect(fltF); fltF.connect(g);
        srcF.start(0, Math.random() * 1.5); lfoF.start();
        nodesToStop.push(srcF, lfoF); nodesToDisc.push(srcF, fltF, lfoF, lfoFG);
      } else if (kind === "crystal") {
        /* Âm ngân pha lê / đền hợp nhất du dương */
        var f0 = spec.freq || 392;
        var o1 = ac.createOscillator(), o2 = ac.createOscillator();
        o1.type = "sine"; o1.frequency.value = f0;
        o2.type = "sine"; o2.frequency.value = f0 * 1.502;
        var lfoC = ac.createOscillator(); lfoC.frequency.value = 0.35;
        var lfoCG = ac.createGain(); lfoCG.gain.value = vol * 0.35;
        lfoC.connect(lfoCG); lfoCG.connect(g.gain);
        o1.connect(g); o2.connect(g);
        o1.start(); o2.start(); lfoC.start();
        nodesToStop.push(o1, o2, lfoC); nodesToDisc.push(o1, o2, lfoC, lfoCG);
      } else if (kind === "wind") {
        /* Tiếng gió quay cối xay / cầu cao trên mây */
        var srcW = ac.createBufferSource(); srcW.buffer = pinkBuf; srcW.loop = true;
        var fltW = ac.createBiquadFilter(); fltW.type = "bandpass"; fltW.frequency.value = spec.freq || 520; fltW.Q.value = 2.4;
        var lfoW = ac.createOscillator(); lfoW.frequency.value = 0.55;
        var lfoWG = ac.createGain(); lfoWG.gain.value = 140;
        lfoW.connect(lfoWG); lfoWG.connect(fltW.frequency);
        srcW.connect(fltW); fltW.connect(g);
        srcW.start(0, Math.random() * 1.5); lfoW.start();
        nodesToStop.push(srcW, lfoW); nodesToDisc.push(srcW, fltW, lfoW, lfoWG);
      } else {
        /* "water" — tiếng suối chảy / sóng vỗ bờ / hồ nước ngầm */
        var srcA = ac.createBufferSource(); srcA.buffer = brownBuf; srcA.loop = true;
        var fltA = ac.createBiquadFilter(); fltA.type = "bandpass"; fltA.frequency.value = spec.freq || 620; fltA.Q.value = 0.85;
        var lfoA = ac.createOscillator(); lfoA.frequency.value = 0.22 + Math.random() * 0.14;
        var lfoAG = ac.createGain(); lfoAG.gain.value = vol * 0.35;
        lfoA.connect(lfoAG); lfoAG.connect(g.gain);
        srcA.connect(fltA); fltA.connect(g);
        srcA.start(0, Math.random() * 1.5); lfoA.start();
        nodesToStop.push(srcA, lfoA); nodesToDisc.push(srcA, fltA, lfoA, lfoAG);
      }

      active3DLoops.push({ stop: nodesToStop, disc: nodesToDisc });
    } catch (e) {}
  }

  MAY.add3DLoop = function (pos, opts) {
    if (!pos) return;
    var spec = Object.assign({ pos: pos.clone ? pos.clone() : new THREE.Vector3(pos[0], pos[1], pos[2]) }, opts || {});
    if (ambStarted && AC) startOne3DLoop(spec);
    else pending3DLoops.push(spec);
  };

  MAY.clear3DLoops = function () {
    pending3DLoops.length = 0;
    for (var i = 0; i < active3DLoops.length; i++) {
      var lp = active3DLoops[i];
      lp.stop.forEach(function (n) { try { n.stop(); } catch (e) {} });
      lp.disc.forEach(function (n) { try { n.disconnect(); } catch (e) {} });
    }
    active3DLoops.length = 0;
  };

  /* ---- Âm thanh Cốt truyện, Giải đố, Hất văng quái & Đấu Trùm ---- */
  MAY.sndDialogue = function () {
    if (!MAY.voiceOn) return;
    MAY.beep(660, 0.08, "sine", 0.06);
    setTimeout(function () { MAY.beep(880, 0.10, "triangle", 0.06); }, 60);
  };
  MAY.sndSkillUnlock = function () {
    if (!MAY.voiceOn) return;
    [523, 659, 784, 1046, 1318, 1568].forEach(function (f, i) {
      setTimeout(function () { MAY.beep(f, 0.42, "triangle", 0.11, { tight: true }); }, i * 70);
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
      o.frequency.setValueAtTime(varyPitch(280, 0.04), ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(varyPitch(1680, 0.04), ac.currentTime + 0.65);
      g.gain.setValueAtTime(varyVol(0.11, 0.08), ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.72);
      o.connect(g); g.connect(sfxBus); o.start(); o.stop(ac.currentTime + 0.75);
      setTimeout(function () { MAY.beep(1760, 0.25, "triangle", 0.09); }, 680);
    } catch (e) {}
  };
  MAY.sndBossRoar = function (pos) {
    if (!MAY.voiceOn) return;
    try {
      var ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(varyPitch(135, 0.05), ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(varyPitch(52, 0.05), ac.currentTime + 0.75);
      g.gain.setValueAtTime(varyVol(0.13, 0.08), ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
      o.connect(g); g.connect(sfxBus); o.start(); o.stop(ac.currentTime + 0.82);
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
      setTimeout(function () { MAY.beep(f, 0.45, "triangle", 0.11, { tight: true }); }, i * 85);
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

  /* ---- Âm Thanh Môi Trường Stereo Từ File Audio Thực Tế (7 Track WAV Loop Mượt + Crossfade + HRTF) ---- */
  var ambStarted = false, currentBiome = "hub";
  var ambLowGain = null, ambLowFilter = null;
  var ambMidGain = null, ambMidFilter = null;
  var padOsc1 = null, padOsc2 = null, padFilter = null, padGain = null;
  var musicTimer = null;
  var ambFileBuffers = {};
  var ambFilePending = {};
  var activeAmbTrack = null; /* { biome, src, gain } */
  var ambSeq = 0;
  MAY.ambienceFormat = document.createElement("audio").canPlayType("audio/flac") ? "flac" : "wav";
  MAY.ambienceFormatReady = (async function () {
    if (MAY.ambienceFormat !== "flac") return;
    // Test the decoder used by the game even if the player has muted the first visit.
    // This fixture is 32 silent stereo PCM samples at 16 kHz, encoded as FLAC.
    try {
      var decoder = new OfflineAudioContext(2, 32, 16000);
      var probe = atob("ZkxhQwAAACIQABAAAAAPAAAPA+gC8AAAACDwnzWlY3g5RY5GLmNQ7LzkhAAAKCAAAAByZWZlcmVuY2UgbGliRkxBQyAxLjQuMyAyMDIzMDYyMwAAAAD/+GUYAB8KAAAAAAAAwuA=");
      await decoder.decodeAudioData(Uint8Array.from(probe, function (c) { return c.charCodeAt(0); }).buffer);
    } catch (error) { MAY.ambienceFormat = "wav"; }
  })();

  var BIOME_AMB_FILES = {
    hub:    { url: "assets/audio/amb_hub.wav",    gain: 0.24, rev: 0.20 },
    level1: { url: "assets/audio/amb_level1.wav", gain: 0.26, rev: 0.30 },
    level2: { url: "assets/audio/amb_level2.wav", gain: 0.24, rev: 0.22 },
    level3: { url: "assets/audio/amb_level3.wav", gain: 0.24, rev: 0.18 },
    level4: { url: "assets/audio/amb_level4.wav", gain: 0.26, rev: 0.38 },
    level5: { url: "assets/audio/amb_level5.wav", gain: 0.24, rev: 0.26 },
    level6: { url: "assets/audio/amb_level6.wav", gain: 0.24, rev: 0.30 }
  };

  var BIOME_SCALES = {
    hub:    [261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
    level1: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0],
    level2: [293.7, 329.6, 392.0, 440.0, 523.3, 587.3],
    level3: [261.6, 277.2, 329.6, 349.2, 392.0, 440.0],
    level4: [246.9, 293.7, 329.6, 370.0, 440.0, 493.9],
    level5: [329.6, 392.0, 440.0, 493.9, 587.3, 659.3],
    level6: [349.2, 440.0, 523.3, 587.3, 659.3, 784.0]
  };

  /* Fallback tổng hợp tạm thời trong lúc giải mã WAV (tự tắt về 0 ngay khi file WAV sẵn sàng!) */
  var BIOME_AMBIENCE = {
    hub:    { lowF: 360, lowV: 0.022, midF: 950,  midQ: 1.1, midV: 0.010, padF: [130.8, 196.0], padLP: 420, padV: 0.008, rev: 0.20 },
    level1: { lowF: 240, lowV: 0.030, midF: 520,  midQ: 0.8, midV: 0.012, padF: [110.0, 164.8], padLP: 320, padV: 0.009, rev: 0.30 },
    level2: { lowF: 320, lowV: 0.016, midF: 1450, midQ: 1.5, midV: 0.010, padF: [146.8, 220.0], padLP: 460, padV: 0.008, rev: 0.22 },
    level3: { lowF: 440, lowV: 0.018, midF: 1180, midQ: 2.2, midV: 0.012, padF: [130.8, 196.0], padLP: 380, padV: 0.007, rev: 0.18 },
    level4: { lowF: 190, lowV: 0.024, midF: 780,  midQ: 2.8, midV: 0.010, padF: [123.5, 185.0], padLP: 340, padV: 0.010, rev: 0.38 },
    level5: { lowF: 300, lowV: 0.018, midF: 1750, midQ: 2.4, midV: 0.012, padF: [164.8, 246.9], padLP: 480, padV: 0.008, rev: 0.26 },
    level6: { lowF: 480, lowV: 0.015, midF: 1320, midQ: 1.4, midV: 0.010, padF: [174.6, 261.6], padLP: 540, padV: 0.009, rev: 0.30 }
  };

  function setSynthBedLevel(scale) {
    if (!AC) return;
    var cfg = BIOME_AMBIENCE[currentBiome] || BIOME_AMBIENCE.hub;
    var now = AC.currentTime;
    try {
      if (ambLowGain) ambLowGain.gain.setTargetAtTime(cfg.lowV * scale, now, 0.45);
      if (ambMidGain) ambMidGain.gain.setTargetAtTime(cfg.midV * scale, now, 0.45);
      if (padGain) padGain.gain.setTargetAtTime(cfg.padV * scale, now, 0.45);
    } catch (e) {}
  }

  function playDecodedBiomeAmbience(biomeId, clip, seq) {
    if (!AC || !clip || seq !== ambSeq) return;
    try {
      var now = AC.currentTime;
      var meta = BIOME_AMB_FILES[biomeId] || BIOME_AMB_FILES.hub;
      var targetGain = meta.gain || 0.24;

      if (activeAmbTrack && activeAmbTrack.biome === biomeId) return;

      /* Crossfade mượt 1.4s track cũ sang track mới */
      if (activeAmbTrack) {
        var oldT = activeAmbTrack;
        try {
          oldT.gain.gain.cancelScheduledValues(now);
          oldT.gain.gain.setValueAtTime(oldT.gain.gain.value, now);
          oldT.gain.gain.linearRampToValueAtTime(0.0001, now + 1.35);
          setTimeout(function () {
            try { oldT.src.stop(); oldT.src.disconnect(); oldT.gain.disconnect(); } catch (e) {}
          }, 1500);
        } catch (e) {}
      }

      var src = AC.createBufferSource();
      src.buffer = clip.buffer;
      src.loop = true;
      var g = AC.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(targetGain, now + 1.35);
      src.connect(g);
      g.connect(ambBus);
      src.start(0);
      activeAmbTrack = { biome: biomeId, src: src, gain: g };
      MAY.ambienceSourceMode = clip.format + "-buffer";
      /* Tắt sạch lớp nhiễu tổng hợp ngay khi track WAV thật bắt đầu phát */
      setSynthBedLevel(0.0);
    } catch (e) {}
  }

  function loadAndPlayBiomeAmbience(biomeId) {
    if (!AC) return;
    var meta = BIOME_AMB_FILES[biomeId] || BIOME_AMB_FILES.hub;
    var seq = ++ambSeq;
    if (ambFileBuffers[biomeId]) {
      playDecodedBiomeAmbience(biomeId, ambFileBuffers[biomeId], seq);
      return;
    }
    if (!ambFilePending[biomeId]) {
      var format = MAY.ambienceFormat;
      ambFilePending[biomeId] = decodeFile(format)
        .catch(function (error) {
          if (format === "wav") throw error;
          return decodeFile("wav").then(function (clip) {
            if (error.name === "EncodingError" && MAY.ambienceFormat !== "wav") {
              MAY.ambienceFormat = "wav";
              if (MAY.refreshOfflineAudio) MAY.refreshOfflineAudio();
            }
            return clip;
          });
        })
        .then(function (buf) { ambFileBuffers[biomeId] = buf; return buf; })
        .catch(function () { ambFilePending[biomeId] = null; return null; });
    }
    ambFilePending[biomeId].then(function (buf) {
      if (buf && biomeId === currentBiome) playDecodedBiomeAmbience(biomeId, buf, seq);
    });

    async function decodeFile(extension) {
      var response = await fetch(meta.url.replace(".wav", "." + extension));
      if (!response.ok) throw new Error("HTTP " + response.status);
      var buffer = await AC.decodeAudioData(await response.arrayBuffer());
      return { format: extension, buffer: buffer };
    }
  }

  function applyBiomeAmbience(biomeId, overrideFreq, overrideVol) {
    var cfg = BIOME_AMBIENCE[biomeId] || BIOME_AMBIENCE.hub;
    var fMeta = BIOME_AMB_FILES[biomeId] || BIOME_AMB_FILES.hub;
    if (!AC) return;
    var now = AC.currentTime;
    try {
      if (ambLowFilter) ambLowFilter.frequency.setTargetAtTime(overrideFreq || cfg.lowF, now, 0.35);
      if (ambMidFilter) {
        ambMidFilter.frequency.setTargetAtTime(cfg.midF, now, 0.35);
        ambMidFilter.Q.setTargetAtTime(cfg.midQ, now, 0.35);
      }
      if (padOsc1 && padOsc2) {
        padOsc1.frequency.setTargetAtTime(cfg.padF[0], now, 0.5);
        padOsc2.frequency.setTargetAtTime(cfg.padF[1], now, 0.5);
      }
      if (padFilter) padFilter.frequency.setTargetAtTime(cfg.padLP, now, 0.4);
      if (reverbSend) reverbSend.gain.setTargetAtTime(fMeta.rev !== undefined ? fMeta.rev : cfg.rev, now, 0.4);
      if (!ambFileBuffers[biomeId] && !activeAmbTrack) {
        setSynthBedLevel(1.0);
      }
      loadAndPlayBiomeAmbience(biomeId);
    } catch (e) {}
  }

  function tickBiomeSoundscape() {
    musicTimer = setTimeout(tickBiomeSoundscape, 5500 + Math.random() * 8000);
    if (!MAY.voiceOn || !MAY.started || MAY.modalOpen || (MAY.Cutscene && MAY.Cutscene.isPlaying()) || isDucked || chimeTimer !== null) return;
    try {
      var scale = BIOME_SCALES[currentBiome] || BIOME_SCALES.hub;
      var f = scale[Math.floor(Math.random() * scale.length)];
      /* Nốt nhạc nền ngũ cung cực nhẹ kết hợp cùng track môi trường WAV stereo */
      if (currentBiome === "level4") {
        var panel = document.getElementById("crystal-music");
        if (panel && !panel.classList.contains("hidden")) return;
        // A brief drop, distinct from the sustained notes of the puzzle.
        MAY.beep(900 + Math.random() * 260, 0.095, "sine", 0.036, { bus: "amb" });
      } else if (currentBiome === "level5" || currentBiome === "level6") {
        MAY.beep(f * 2, 0.72, "sine", 0.016, { tight: true, bus: "amb" });
      } else {
        MAY.beep(f, 0.62, "sine", 0.015, { tight: true, bus: "amb" });
      }
    } catch (e) {}
  }

  MAY.startAmbient = function () {
    if (ambStarted) return;
    ambStarted = true;
    try {
      var ac = getAC();
      /* Dự phòng nền rất nhẹ chỉ chạy trong tích tắc khi trình duyệt đang giải mã WAV đầu tiên */
      var srcLow = ac.createBufferSource(); srcLow.buffer = brownBuf; srcLow.loop = true;
      ambLowFilter = ac.createBiquadFilter(); ambLowFilter.type = "lowpass"; ambLowFilter.frequency.value = 360;
      ambLowGain = ac.createGain(); ambLowGain.gain.value = 0;
      srcLow.connect(ambLowFilter); ambLowFilter.connect(ambLowGain); ambLowGain.connect(ambBus);
      srcLow.start();

      var srcMid = ac.createBufferSource(); srcMid.buffer = pinkBuf; srcMid.loop = true;
      ambMidFilter = ac.createBiquadFilter(); ambMidFilter.type = "bandpass"; ambMidFilter.frequency.value = 950; ambMidFilter.Q.value = 1.2;
      ambMidGain = ac.createGain(); ambMidGain.gain.value = 0;
      srcMid.connect(ambMidFilter); ambMidFilter.connect(ambMidGain); ambMidGain.connect(ambBus);
      srcMid.start();

      padOsc1 = ac.createOscillator(); padOsc1.type = "sine"; padOsc1.frequency.value = 130.8;
      padOsc2 = ac.createOscillator(); padOsc2.type = "triangle"; padOsc2.frequency.value = 196.0;
      padFilter = ac.createBiquadFilter(); padFilter.type = "lowpass"; padFilter.frequency.value = 420;
      padGain = ac.createGain(); padGain.gain.value = 0;
      padOsc1.connect(padFilter); padOsc2.connect(padFilter);
      padFilter.connect(padGain); padGain.connect(ambBus);
      padOsc1.start(); padOsc2.start();

      applyBiomeAmbience(currentBiome);

      /* Khởi động các nguồn âm 3D HRTF lặp đã đăng ký trước khi người chơi bấm Bắt Đầu */
      while (pending3DLoops.length) startOne3DLoop(pending3DLoops.shift());
    } catch (e) {}
    if (!musicTimer) musicTimer = setTimeout(tickBiomeSoundscape, 6200);
  };

  MAY.setAmbientTone = function (freq, vol, biomeId) {
    if (biomeId) currentBiome = biomeId;
    if (ambStarted) applyBiomeAmbience(currentBiome, freq, vol);
  };

  /* ---- Giọng đọc tiếng Việt 100% offline (47 MP3 trong assets/voice/ + vi-VN native cho câu đố động) ---- */
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
      var voiceChanged = viVoice !== best;
      viVoice = best;
      MAY.hasViVoice = !!viVoice;
      if (voiceChanged && MAY.canSpeakDialogue && MAY.refreshDialogueVoiceUI) MAY.refreshDialogueVoiceUI();
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
    _speakTimer = null;
    if (_curAudio) { try { _curAudio.pause(); _curAudio.currentTime = 0; } catch (e) {} _curAudio = null; }
    if ("speechSynthesis" in window) { try { speechSynthesis.cancel(); } catch (e) {} }
    _activeUtterance = null;
    setVoiceDuck(false);
  }

  function playLocalVoiceClip(key, seq) {
    if (!key || !MAY.voiceOn) return false;
    var a = _audioCache[key];
    if (!a) { a = new Audio("assets/voice/" + key + ".mp3"); a.preload = "auto"; _audioCache[key] = a; }
    try { a.currentTime = 0; } catch (e) {}
    _curAudio = a;
    setVoiceDuck(true);
    var release = function () {
      if (seq === _speakSeq) {
        _curAudio = null;
        setVoiceDuck(false);
      }
    };
    a.onended = release;
    a.onerror = release;
    var p = a.play();
    if (p && p.catch) p.catch(release);
    return true;
  }

  if ("speechSynthesis" in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
    setTimeout(pickVoice, 300);
    setTimeout(pickVoice, 1200);
  }

  MAY.stopSpeech = stopSpeech;
  MAY.isSpeechActive = function () { return !!(_curAudio || _activeUtterance || _speakTimer); };
  // Automatic narration is opportunistic: a stale item or skill hint is text-only
  // while another line or a dialogue is active. Explicit page/shot changes may interrupt.
  MAY.playVoice = function (clipKey, options) {
    if (!MAY.voiceOn || !clipKey) return;
    if (!(options && options.interrupt) && (MAY.dialogueOpen || MAY.isSpeechActive())) return;
    stopSpeech();
    playLocalVoiceClip(clipKey, _speakSeq);
  };
  MAY.canSpeakDialogue = function (text, clipKey) {
    if (!MAY.voiceOn) return false;
    if (clipKey) return true;
    if ("speechSynthesis" in window && !viVoice) pickVoice();
    return !!(text && viVoice && "speechSynthesis" in window);
  };
  MAY.speak = function (text, clipKey, options) {
    if (!MAY.voiceOn || !text) return;
    if (!(options && options.interrupt) && (MAY.dialogueOpen || MAY.isSpeechActive())) return;
    var clean = cleanSpeechText(text);
    if (!clean) return;
    stopSpeech();
    var seq = _speakSeq;
    if ("speechSynthesis" in window && !viVoice) pickVoice();

    var isDynamicQuiz = clean.toLowerCase().indexOf("câu đố nè") === 0;
    if (isDynamicQuiz && viVoice && "speechSynthesis" in window) {
      _speakTimer = setTimeout(function () {
        _speakTimer = null;
        if (seq !== _speakSeq || !MAY.voiceOn) return;
        try {
          var u = new SpeechSynthesisUtterance(clean);
          u.voice = viVoice; u.lang = viVoice.lang || "vi-VN"; u.rate = 0.96; u.pitch = 1.0;
          _activeUtterance = u;
          setVoiceDuck(true);
          u.onend = u.onerror = function () { if (seq === _speakSeq) { _activeUtterance = null; setVoiceDuck(false); } };
          speechSynthesis.speak(u);
        } catch (e) { if (seq === _speakSeq) { _activeUtterance = null; setVoiceDuck(false); } }
      }, 45);
      return;
    }

    var key = clipKey || (!(options && options.exactText) && inferVoiceClip(clean));
    if (key) { playLocalVoiceClip(key, seq); return; }

    if (viVoice && "speechSynthesis" in window) {
      _speakTimer = setTimeout(function () {
        _speakTimer = null;
        if (seq !== _speakSeq || !MAY.voiceOn) return;
        try {
          var u2 = new SpeechSynthesisUtterance(clean);
          u2.voice = viVoice; u2.lang = viVoice.lang || "vi-VN"; u2.rate = 0.98; u2.pitch = 1.0;
          _activeUtterance = u2;
          setVoiceDuck(true);
          u2.onend = u2.onerror = function () { if (seq === _speakSeq) { _activeUtterance = null; setVoiceDuck(false); } };
          speechSynthesis.speak(u2);
        } catch (e) { if (seq === _speakSeq) { _activeUtterance = null; setVoiceDuck(false); } }
      }, 45);
    }
  };

})(window.MAY);
