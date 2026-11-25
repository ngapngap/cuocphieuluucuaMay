"use strict";
/* ============================================================================
   PLAYER — Bé Mây 3D Khớp Chân Thực (Torso Lathe, Tay/Chân 2 Khớp, Vải PBR Ướt,
   Bọt Khí Chân Vịt & Camera Điện Ảnh Góc Nhìn Thứ Ba)
   ============================================================================ */
(function (MAY) {

  var playerPos = new THREE.Vector3(0, 2, 8);
  var vel = new THREE.Vector3(0, 0, 0);
  var P = {
    pos: playerPos,
    vel: vel,
    yaw: 0,
    pitch: 0,
    onLand: true,
    grounded: true,
    gliding: false,
    onIce: false,
    wetness: 0,
    camDist: 4.8,
    camPosInit: false,
    prevSpace: false,
    jumpQueued: false,
    sprintHeld: false,
    keys: {},
    joy: { active: false, x: 0, y: 0 },
    vert: { up: false, down: false },
    locked: false
  };

  /* Vật liệu PBR chân thực cho da, tóc, vải đồ bơi/váy (có độ bóng ướt clearcoat khi xuống nước!) */
  var fabricMaps = MAY.PBR ? MAY.PBR.fabric : {};
  var bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xff8fb8, roughness: 0.58, metalness: 0.05, clearcoat: 0.15, clearcoatRoughness: 0.35,
    normalMap: fabricMaps.normalMap || null, normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: fabricMaps.roughnessMap || null
  });
  var suitLowerMat = new THREE.MeshPhysicalMaterial({
    color: 0x243b53, roughness: 0.52, metalness: 0.08, clearcoat: 0.25, clearcoatRoughness: 0.25,
    normalMap: fabricMaps.normalMap || null, normalScale: new THREE.Vector2(0.6, 0.6),
    roughnessMap: fabricMaps.roughnessMap || null
  });
  var accentMat = new THREE.MeshPhysicalMaterial({ color: 0xffd93d, roughness: 0.38, metalness: 0.15, clearcoat: 0.3 });
  var skinMat = new THREE.MeshPhysicalMaterial({ color: 0xffd7b3, roughness: 0.62, clearcoat: 0.08, clearcoatRoughness: 0.5 });
  var hairMat = new THREE.MeshStandardMaterial({ color: 0x22150e, roughness: 0.65, metalness: 0.1 });

  var diver = new THREE.Group();
  var diverPose = new THREE.Group();
  diver.add(diverPose);
  /* Fallback thủ tục đặt trong procGroup; khi may_rigged.glb tải xong sẽ tự ẩn procGroup và dùng SkinnedMesh + AnimationMixer! */
  var procGroup = new THREE.Group();
  diverPose.add(procGroup);

  /* Thân người giải phẫu tự nhiên bằng LatheGeometry (hông -> eo -> ngực -> vai) */
  var torsoPts = [
    new THREE.Vector2(0.01, -0.36),
    new THREE.Vector2(0.18, -0.32),
    new THREE.Vector2(0.21, -0.18),
    new THREE.Vector2(0.17, -0.02),
    new THREE.Vector2(0.21,  0.18),
    new THREE.Vector2(0.23,  0.34),
    new THREE.Vector2(0.12,  0.42),
    new THREE.Vector2(0.08,  0.48)
  ];
  var torsoGeo = new THREE.LatheGeometry(torsoPts, 20);
  var torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
  torsoMesh.scale.set(1.06, 1.0, 0.78);
  procGroup.add(torsoMesh);

  /* Đai thắt lưng / viền áo */
  var beltMesh = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.032, 8, 20), accentMat);
  beltMesh.rotation.x = Math.PI / 2;
  beltMesh.scale.set(1.05, 0.82, 1.0);
  beltMesh.position.y = -0.04;
  procGroup.add(beltMesh);

  /* Chân váy xếp ly mềm cho các bộ váy (ẩn khi ở dạng đồ lặn chuyên nghiệp) */
  var skirtPts = [
    new THREE.Vector2(0.19, 0.02),
    new THREE.Vector2(0.25, -0.14),
    new THREE.Vector2(0.35, -0.36),
    new THREE.Vector2(0.38, -0.42)
  ];
  var skirtGeo = new THREE.LatheGeometry(skirtPts, 20);
  var skirtMesh = new THREE.Mesh(skirtGeo, bodyMat);
  skirtMesh.scale.set(1.02, 1.0, 0.86);
  procGroup.add(skirtMesh);

  /* Cổ & Đầu + Gương mặt chi tiết */
  var headGroup = new THREE.Group();
  headGroup.position.set(0, 0.52, 0);
  procGroup.add(headGroup);

  var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.09, 0.14, 12), skinMat);
  neck.position.y = 0.02;
  headGroup.add(neck);

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 16), skinMat);
  head.scale.set(0.95, 1.04, 0.98);
  head.position.y = 0.23;
  headGroup.add(head);

  /* Tai + Mũi nhỏ + Mắt có điểm sáng phản chiếu */
  [-0.22, 0.22].forEach(function (ex) {
    var ear = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), skinMat);
    ear.scale.set(0.55, 1.0, 0.8);
    ear.position.set(ex, 0.22, 0.02);
    headGroup.add(ear);
  });
  var nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), skinMat);
  nose.position.set(0, 0.21, -0.23);
  headGroup.add(nose);

  var eyeDark = new THREE.MeshPhysicalMaterial({ color: 0x161421, roughness: 0.05, clearcoat: 1.0 });
  var eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var blushMat = new THREE.MeshBasicMaterial({ color: 0xff8ea8, transparent: true, opacity: 0.65 });
  var smileMat = new THREE.MeshBasicMaterial({ color: 0xd94b6b });
  [-0.085, 0.085].forEach(function (ex) {
    var sclera = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), eyeWhite);
    sclera.scale.set(1.05, 1.15, 0.55); sclera.position.set(ex, 0.252, -0.198); headGroup.add(sclera);
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), eyeDark);
    eye.position.set(ex, 0.25, -0.212); headGroup.add(eye);
    var glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), eyeWhite);
    glint.position.set(ex + 0.012, 0.264, -0.244); headGroup.add(glint);
    var brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.042, 4, 6), hairMat);
    brow.rotation.z = Math.PI / 2 + (ex > 0 ? -0.12 : 0.12); brow.position.set(ex, 0.305, -0.215); headGroup.add(brow);
    var bl = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), blushMat);
    bl.scale.set(1.25, 0.55, 0.35); bl.position.set(ex * 1.48, 0.195, -0.196); headGroup.add(bl);
  });
  var smile = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 6, 12, Math.PI), smileMat);
  smile.rotation.z = Math.PI; smile.position.set(0, 0.175, -0.225); headGroup.add(smile);

  /* Mái tóc mượt có mái bằng + Nơ tóc xinh + Đuôi tóc động đung đưa khi chạy/bơi */
  var hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.248, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hairCrown.position.set(0, 0.245, 0.025);
  hairCrown.rotation.x = -0.38;
  headGroup.add(hairCrown);
  var bangs = new THREE.Mesh(new THREE.SphereGeometry(0.225, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.36), hairMat);
  bangs.position.set(0, 0.275, -0.055); bangs.rotation.x = 0.28; headGroup.add(bangs);
  var bowRibbon = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.024, 6, 12), accentMat);
  bowRibbon.scale.set(1.35, 0.72, 0.6); bowRibbon.position.set(0, 0.35, 0.18); headGroup.add(bowRibbon);

  var hairBack = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.16, 6, 12), hairMat);
  hairBack.position.set(0, 0.14, 0.16);
  hairBack.rotation.x = 0.22;
  headGroup.add(hairBack);

  /* Phụ kiện trang phục chi tiết */
  var pigtailsGroup = new THREE.Group();
  var pigL, pigR;
  [-1, 1].forEach(function (side) {
    var piv = new THREE.Group();
    piv.position.set(side * 0.23, 0.26, 0.09);
    var tie = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.02, 8, 12), accentMat);
    tie.rotation.y = Math.PI / 2;
    piv.add(tie);
    var strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.24, 6, 10), hairMat);
    strand.position.set(side * 0.05, -0.14, 0.05);
    strand.rotation.z = side * 0.25;
    piv.add(strand);
    pigtailsGroup.add(piv);
    if (side < 0) pigL = piv; else pigR = piv;
  });
  headGroup.add(pigtailsGroup);

  var yellowHatGroup = new THREE.Group();
  var hatMat = new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.72, normalMap: fabricMaps.normalMap || null });
  var hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.032, 24), hatMat);
  hatBrim.position.set(0, 0.41, 0);
  var hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.16, 20), hatMat);
  hatTop.position.set(0, 0.50, 0);
  var hatRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.244, 0.244, 0.04, 20), new THREE.MeshStandardMaterial({ color: 0xff6b9d, roughness: 0.5 }));
  hatRibbon.position.set(0, 0.44, 0);
  yellowHatGroup.add(hatBrim, hatTop, hatRibbon);
  headGroup.add(yellowHatGroup);

  var bowGroup = new THREE.Group();
  var bowMat = new THREE.MeshPhysicalMaterial({ color: 0xff5c97, roughness: 0.35, clearcoat: 0.3 });
  [-0.08, 0.08].forEach(function (bx) {
    var bp = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), bowMat);
    bp.scale.set(1.25, 0.65, 0.45);
    bp.position.set(bx, 0.47, 0.04);
    bowGroup.add(bp);
  });
  headGroup.add(bowGroup);

  var crownGroup = new THREE.Group();
  var goldMat = new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.85, roughness: 0.18, emissive: 0xaa7700, emissiveIntensity: 0.35 });
  var crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.028, 8, 20), goldMat);
  crownRing.rotation.x = Math.PI / 2; crownRing.position.set(0, 0.47, 0);
  crownGroup.add(crownRing);
  var crownGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.065), new THREE.MeshPhysicalMaterial({ color: 0xff6bd6, emissive: 0xff6bd6, emissiveIntensity: 0.7, roughness: 0.1, clearcoat: 1.0 }));
  crownGem.position.set(0, 0.54, -0.16);
  crownGroup.add(crownGem);
  headGroup.add(crownGroup);

  var winterHatGroup = new THREE.Group();
  var beanie = new THREE.Mesh(new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), new THREE.MeshStandardMaterial({ color: 0x67c8ff, roughness: 0.9, normalMap: fabricMaps.normalMap || null }));
  beanie.position.set(0, 0.30, 0);
  var cuff = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.048, 8, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
  cuff.rotation.x = Math.PI / 2; cuff.position.set(0, 0.34, 0);
  var pom = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
  pom.position.set(0, 0.58, 0);
  winterHatGroup.add(beanie, cuff, pom);
  headGroup.add(winterHatGroup);

  /* Bộ đồ lặn thật (Kính lặn 2 tròng + Ống thở + Bình khí kim loại có đai vai) */
  var scubaHeadGroup = new THREE.Group();
  var maskRim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.08), new THREE.MeshPhysicalMaterial({ color: 0x162b3d, roughness: 0.3, clearcoat: 0.8 }));
  maskRim.position.set(0, 0.25, -0.21);
  var maskGlass = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.10, 0.03), new THREE.MeshPhysicalMaterial({ color: 0xaef0ff, roughness: 0.05, metalness: 0.2, clearcoat: 1.0, transparent: true, opacity: 0.62 }));
  maskGlass.position.set(0, 0.25, -0.245);
  var maskStrap = new THREE.Mesh(new THREE.TorusGeometry(0.235, 0.018, 6, 20), new THREE.MeshStandardMaterial({ color: 0x162b3d, roughness: 0.6 }));
  maskStrap.rotation.x = Math.PI / 2; maskStrap.position.set(0, 0.25, 0.01);
  var snorkel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.38, 8), new THREE.MeshStandardMaterial({ color: 0xffd93d, roughness: 0.35 }));
  snorkel.position.set(0.22, 0.32, -0.08); snorkel.rotation.x = -0.2;
  scubaHeadGroup.add(maskRim, maskGlass, maskStrap, snorkel);
  headGroup.add(scubaHeadGroup);

  var scubaBackGroup = new THREE.Group();
  var tankMetal = new THREE.MeshStandardMaterial({ color: 0xc2ced6, metalness: 0.82, roughness: 0.24 });
  var tankCyl = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.38, 8, 16), tankMetal);
  tankCyl.position.set(0, 0.10, 0.27);
  var tankValve = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.09, 8), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.6, roughness: 0.4 }));
  tankValve.position.set(0, 0.38, 0.27);
  var tankBand = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.122, 0.06, 16), accentMat);
  tankBand.position.set(0, 0.12, 0.27);
  scubaBackGroup.add(tankCyl, tankValve, tankBand);
  procGroup.add(scubaBackGroup);

  /* Khăn choàng sa mạc/tuyết, Đèn pha pha lê, Đôi cánh mây */
  var scarfGroup = new THREE.Group();
  var scarfM = new THREE.MeshStandardMaterial({ color: 0xff8c42, roughness: 0.85, normalMap: fabricMaps.normalMap || null });
  var scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.055, 8, 18), scarfM);
  scarfRing.rotation.x = Math.PI / 2; scarfRing.position.set(0, 0.44, 0);
  var scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.04), new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.85 }));
  scarfTail.position.set(0.11, 0.24, 0.21); scarfTail.rotation.x = 0.35;
  scarfGroup.add(scarfRing, scarfTail);
  procGroup.add(scarfGroup);

  var lampGroup = new THREE.Group();
  var lampBand = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.022, 6, 18), new THREE.MeshStandardMaterial({ color: 0x6b46c1 }));
  lampBand.rotation.x = Math.PI / 2; lampBand.position.set(0, 0.36, 0.01);
  var lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf3e8ff }));
  lampBulb.position.set(0, 0.36, -0.245);
  lampGroup.add(lampBand, lampBulb);
  headGroup.add(lampGroup);

  var wingsGroup = new THREE.Group();
  var wingMatL = new THREE.MeshPhysicalMaterial({ color: 0xffb3ec, emissive: 0xff6bd6, emissiveIntensity: 0.45, roughness: 0.2, clearcoat: 0.7, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  var wingMatR = new THREE.MeshPhysicalMaterial({ color: 0x9fe8ff, emissive: 0x4dd0ff, emissiveIntensity: 0.45, roughness: 0.2, clearcoat: 0.7, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  var wShape = new THREE.Shape();
  wShape.moveTo(0, 0); wShape.quadraticCurveTo(0.65, 0.55, 1.15, 0.14); wShape.quadraticCurveTo(0.85, -0.38, 0.22, -0.25); wShape.closePath();
  var wGeo = new THREE.ShapeGeometry(wShape);
  var wingL = new THREE.Mesh(wGeo, wingMatL); wingL.position.set(-0.12, 0.22, 0.23); wingL.rotation.y = Math.PI - 0.35;
  var wingR = new THREE.Mesh(wGeo, wingMatR); wingR.position.set(0.12, 0.22, 0.23); wingR.rotation.y = 0.35;
  wingsGroup.add(wingL, wingR);
  diverPose.add(wingsGroup);

  /* ---- Tay 2 khớp (Vai -> Cánh tay trên -> Khuỷu -> Cẳng tay -> Bàn tay) ---- */
  function makeArticulatedArm(side) {
    var shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27, 0.34, 0);
    var upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.22, 6, 10), bodyMat);
    upper.position.y = -0.14;
    shoulder.add(upper);

    var elbow = new THREE.Group();
    elbow.position.y = -0.28;
    var fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.20, 6, 10), skinMat);
    fore.position.y = -0.13;
    elbow.add(fore);

    var hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), skinMat);
    hand.scale.set(0.85, 1.1, 0.65);
    hand.position.y = -0.27;
    elbow.add(hand);

    shoulder.add(elbow);
    procGroup.add(shoulder);
    return { root: shoulder, mid: elbow };
  }

  /* ---- Chân 2 khớp (Hông -> Đùi -> Gối -> Cẳng chân -> Bàn chân + Chân vịt / Ván trượt) ---- */
  var fins = [], skis = [], boots = [];
  function makeArticulatedLeg(side) {
    var hip = new THREE.Group();
    hip.position.set(side * 0.12, -0.32, 0);
    var thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.24, 6, 12), suitLowerMat);
    thigh.position.y = -0.16;
    hip.add(thigh);

    var knee = new THREE.Group();
    knee.position.y = -0.34;
    var calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.24, 6, 12), suitLowerMat);
    calf.position.y = -0.16;
    knee.add(calf);

    /* Giày thể thao / Ủng khám phá */
    var boot = new THREE.Group();
    boot.position.set(0, -0.34, -0.04);
    var bBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.12, 6, 10), accentMat);
    bBody.rotation.x = Math.PI / 2;
    boot.add(bBody);
    knee.add(boot);
    boots.push(boot);

    /* Chân vịt bơi thật dạng vây thuôn dài giống ảnh 2 */
    var finGroup = new THREE.Group();
    finGroup.position.set(0, -0.35, -0.02);
    var finMat = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.28, clearcoat: 0.75 });
    var finTrimMat = new THREE.MeshPhysicalMaterial({ color: 0xffd93d, roughness: 0.3, clearcoat: 0.6 });
    var finPocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.20), finMat);
    finPocket.position.set(0, 0, -0.02);
    var finBlade = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.024, 0.56), finMat);
    finBlade.position.set(0, -0.02, -0.34);
    var finRibL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.036, 0.54), finTrimMat);
    finRibL.position.set(-0.085, -0.02, -0.33);
    var finRibR = finRibL.clone(); finRibR.position.x = 0.085;
    finGroup.add(finPocket, finBlade, finRibL, finRibR);
    finGroup.rotation.x = -0.85;
    knee.add(finGroup);
    fins.push(finGroup);

    /* Ván trượt tuyết */
    var ski = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 1.32), new THREE.MeshPhysicalMaterial({ color: 0xff5c8a, roughness: 0.2, clearcoat: 0.9 }));
    ski.position.set(0, -0.40, -0.08);
    knee.add(ski);
    skis.push(ski);

    hip.add(knee);
    procGroup.add(hip);
    return { root: hip, mid: knee };
  }

  var armL = makeArticulatedArm(-1);
  var armR = makeArticulatedArm(1);
  var legL = makeArticulatedLeg(-1);
  var legR = makeArticulatedLeg(1);

  /* ---- Gậy Phép Cầu Vồng trên tay phải Mây (lấy cảm hứng từ Fable 5.2: thân gỗ uốn cong + đai vàng + ngọc đổi màu theo 6 phép!) ---- */
  var staffGroup = new THREE.Group();
  var staffCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.55, 0),
    new THREE.Vector3(0.02, 0.10, -0.02),
    new THREE.Vector3(-0.04, 0.65, -0.05),
    new THREE.Vector3(0.06, 0.96, -0.03),
    new THREE.Vector3(0.16, 1.06, 0.0),
    new THREE.Vector3(0.08, 1.18, 0.0),
    new THREE.Vector3(-0.06, 1.12, 0.0)
  ]);
  var staffWood = new THREE.MeshStandardMaterial({
    map: MAY.PBR ? MAY.PBR.bark.map : null, normalMap: MAY.PBR ? MAY.PBR.bark.normalMap : null,
    color: 0x7c5332, roughness: 0.85
  });
  var staffShaft = new THREE.Mesh(new THREE.TubeGeometry(staffCurve, 22, 0.028, 7, false), staffWood);
  staffGroup.add(staffShaft);
  var staffWrap = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.012, 6, 12), accentMat);
  staffWrap.rotation.x = Math.PI / 2; staffWrap.position.y = 0.08; staffGroup.add(staffWrap);
  var staffGemMat = new THREE.MeshPhysicalMaterial({
    color: 0x4ade80, emissive: 0x4ade80, emissiveIntensity: 1.15, roughness: 0.08, clearcoat: 1.0
  });
  var staffGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), staffGemMat);
  staffGem.position.set(0.04, 1.08, 0); staffGroup.add(staffGem);
  var staffGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: MAY.TEX.glow, color: 0x4ade80, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  staffGlow.scale.set(0.65, 0.65, 1); staffGlow.position.copy(staffGem.position); staffGroup.add(staffGlow);
  staffGroup.position.set(0.04, -0.25, -0.04);
  staffGroup.rotation.x = -0.35;
  armR.mid.add(staffGroup);

  /* ---- Bộ điều khiển SkinnedMesh + AnimationMixer + Morph Targets cho assets/models/may_rigged.glb ---- */
  var rigMay = null;
  var castAnim = 0;

  function playMayClip(name, fadeSec, oneShot) {
    if (!rigMay || !rigMay.actions[name]) return;
    if (!oneShot && rigMay.curName === name) return;
    var nextAct = rigMay.actions[name];
    var prevAct = rigMay.curAction;
    if (oneShot) {
      nextAct.setLoop(THREE.LoopOnce, 1);
      nextAct.clampWhenFinished = true;
      rigMay.oneShotName = name;
      rigMay.oneShotT = nextAct.getClip().duration || 0.6;
    } else {
      nextAct.setLoop(THREE.LoopRepeat, Infinity);
      nextAct.clampWhenFinished = false;
    }
    nextAct.reset();
    nextAct.enabled = true;
    nextAct.setEffectiveTimeScale(1);
    nextAct.setEffectiveWeight(1);
    nextAct.play();
    if (prevAct && prevAct !== nextAct) prevAct.crossFadeTo(nextAct, fadeSec !== undefined ? fadeSec : 0.14, false);
    rigMay.curAction = nextAct;
    rigMay.curName = name;
  }

  function syncRiggedOutfit(name, inWater) {
    if (!rigMay) return;
    if (name === "rungxanh" && !inWater && !rigMay.forestColor && MAY.prepareForestOutfit) rigMay.forestColor = MAY.prepareForestOutfit(rigMay.root);
    if (rigMay.forestColor) rigMay.forestColor(name === "rungxanh" && !inWater);
    var targetOutfit = inWater ? "Outfit_BoiBien" : (
      name === "haibim" ? "Outfit_HaiBim" :
      name === "muvang" ? "Outfit_MuVang" :
      name === "tuyetbong" ? "Outfit_AoAm" :
      name === "cauvong" ? "Outfit_CongChua" : "Outfit_VayHong"
    );
    Object.keys(rigMay.outfits).forEach(function (k) {
      rigMay.outfits[k].visible = (k === targetOutfit);
    });
    rigMay.goggles.forEach(function (part) { part.visible = !!inWater; });
    if (rigMay.hairBui) rigMay.hairBui.visible = (name !== "haibim");
    if (rigMay.hairHaiBim) rigMay.hairHaiBim.visible = (name === "haibim");
  }

  P.attachRiggedMay = function () {
    if (rigMay || !MAY.cloneSkinnedGLB) return;
    var cl = MAY.cloneSkinnedGLB("may");
    if (!cl || !cl.scene) return;
    var root = cl.scene;
    root.position.set(0, -0.90, 0);
    root.rotation.y = Math.PI;
    root.scale.setScalar(1.06);

    var goggles = [], outfits = {}, hairBui = null, hairHaiBim = null, faceMesh = null, eyeMesh = null, headBone = null, staffNode = null, staffGemNode = null, staffGemRigMat = null, socketBack = null, socketStaff = null;
    root.traverse(function (o) {
      if (o.name && o.name.indexOf("Outfit_") === 0) outfits[o.name] = o;
      if (o.name === "May_GogglesFrame" || o.name === "Gear_GogglesLens" || o.name === "May_DiveGear") goggles.push(o);
      if (o.name === "Hair_Bui") hairBui = o;
      if (o.name === "Hair_HaiBim") hairHaiBim = o;
      if (o.name === "Face" && o.isMesh) faceMesh = o;
      if (o.name === "Head" && o.isBone) headBone = o;
      if (o.isMesh && o.material && o.material.name === "Mat_FaceEye" && o.parent && o.parent.name === "May_Body") {
        o.geometry = o.geometry.clone();
        o.userData.sharedGeo = false;
        var ep = o.geometry.attributes.position, delta = new Float32Array(ep.count * 3);
        for (var ei = 0; ei < ep.count; ei++) delta[ei * 3 + 1] = (1.13 - ep.getY(ei)) * 0.94;
        o.geometry.morphAttributes.position = [new THREE.BufferAttribute(delta, 3)];
        o.geometry.morphTargetsRelative = true;
        o.updateMorphTargets(); eyeMesh = o;
      }
      if (o.name === "Gear_GayPhep") staffNode = o;
      if (o.name === "Socket_Back") socketBack = o;
      if (o.name === "Socket_Staff") socketStaff = o;
      if (o.name === "StaffGem" && o.isMesh) {
        staffGemNode = o;
        o.material = o.material.clone();
        staffGemRigMat = o.material;
      }
      if (o.isMesh && o.material && o.material.name === "Mat_Body" && !o.material.roughnessMap) {
        o.material.roughness = 0.62;
        o.material.metalness = 0.04;
      }
    });

    if (staffGemNode) {
      var sgHalo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: MAY.TEX.glow, color: 0x38bdf8, transparent: true, opacity: 0.72,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      sgHalo.scale.set(0.45, 0.45, 1);
      (socketStaff || staffGemNode).add(sgHalo);
      staffGemNode.userData.halo = sgHalo;
    }

    var happyMouth = null;
    if (headBone) {
      happyMouth = new THREE.Group();
      var mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0x793142 }));
      mouth.scale.set(0.067, 0.025, 0.006); happyMouth.add(mouth);
      var tongue = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshBasicMaterial({ color: 0xf58c98 }));
      tongue.scale.set(0.035, 0.008, 0.004); tongue.position.set(0, -0.011, 0.006); happyMouth.add(tongue);
      happyMouth.position.set(0, 0.095, 0.246); happyMouth.visible = false; headBone.add(happyMouth);
    }
    var mixer = new THREE.AnimationMixer(root);
    var actions = {};
    cl.animations.forEach(function (clip) {
      actions[clip.name] = mixer.clipAction(clip);
    });

    diverPose.add(root);
    procGroup.visible = false;
    rigMay = {
      root: root, mixer: mixer, actions: actions,
      curAction: null, curName: null, oneShotName: null, oneShotT: 0,
      outfits: outfits, goggles: goggles, hairBui: hairBui, hairHaiBim: hairHaiBim,
      faceMesh: faceMesh, eyeMesh: eyeMesh, happyMouth: happyMouth, staffNode: staffNode, staffGemNode: staffGemNode, staffGemMat: staffGemRigMat,
      socketBack: socketBack, forestColor: null,
      blinkT: 2.5, smileT: 0, hurtFaceT: 0
    };
    syncRiggedOutfit(MAY.save.outfit || "vayhong", !P.onLand);
    playMayClip("Idle", 0.01, false);
  };

  P.setStaffSpell = function (sp) {
    if (!sp) return;
    staffGemMat.color.setHex(sp.color);
    staffGemMat.emissive.setHex(sp.color);
    staffGlow.material.color.setHex(sp.color);
    if (rigMay && rigMay.staffGemMat) {
      rigMay.staffGemMat.color.setHex(sp.color);
      if (rigMay.staffGemMat.emissive) {
        rigMay.staffGemMat.emissive.setHex(sp.color);
        rigMay.staffGemMat.emissiveIntensity = 0.9;
      }
      if (rigMay.staffGemNode && rigMay.staffGemNode.userData.halo) {
        rigMay.staffGemNode.userData.halo.material.color.setHex(sp.color);
      }
    }
  };
  P.triggerCastAnim = function () {
    castAnim = 1.0;
    if (rigMay) playMayClip("Cast_Spell", 0.08, true);
  };
  P.triggerPetAnim = function () {
    if (rigMay) { rigMay.smileT = 2.0; playMayClip("Interact_Pet", 0.10, true); }
  };
  P.triggerHurtAnim = function () {
    if (rigMay) { rigMay.hurtFaceT = 1.2; playMayClip("Hit_Hurt", 0.06, true); }
  };
  P.triggerVictoryAnim = function () {
    if (rigMay) { rigMay.smileT = 3.5; playMayClip("Victory", 0.12, true); }
  };

  /* Bóng tiếp xúc chân mềm gắn dưới đất để Mây luôn dính sát mặt đất */
  var playerContact = MAY.makeContactShadow(0.62, 0.62);
  MAY.scene.add(playerContact);

  /* Camera shake, head-bob & Camera điện ảnh quay về Boss khi Trùm xuất hiện */
  var camShake = 0, landDip = 0, prevGrounded = true, stridePhase = 0, lastStepSign = 1;
  var camFocus = null;
  var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  P.addShake = function (amt) { camShake = Math.min(0.65, Math.max(camShake, amt || 0.2)); };
  P.triggerCamFocus = function (worldPos, dur) {
    if (!worldPos) return;
    camFocus = { target: worldPos.clone(), t: dur || 1.7, maxT: dur || 1.7 };
  };
  P.clearKeys = function () {
    Object.keys(P.keys).forEach(function (k) { P.keys[k] = false; });
    P.prevSpace = true;
    P.jumpQueued = false;
    P.sprintHeld = false;
    P.joy.active = false; P.joy.x = 0; P.joy.y = 0;
    P.vert.up = false; P.vert.down = false;
    if (typeof dragging !== "undefined") dragging = false;
    if (typeof canvas !== "undefined" && canvas) canvas.style.cursor = "";
    if (typeof joyId !== "undefined") joyId = null;
    if (typeof lookId !== "undefined") lookId = null;
    if (typeof tapId !== "undefined") tapId = null;
    if (typeof stickEl !== "undefined" && stickEl) stickEl.style.transform = "";
  };

  diver.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  MAY.scene.add(diver);

  /* ---- Dòng bọt khí li ti theo sau chân vịt & mặt nạ giống ảnh 2 ---- */
  var swimBubbles = [];
  var swimBubGeo = new THREE.SphereGeometry(0.048, 7, 6);
  var swimBubMat = new THREE.MeshPhysicalMaterial({ color: 0xe6fbff, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, transparent: true, opacity: 0.68 });
  var bubSpawnT = 0;

  function spawnSwimBubble(x, y, z, r) {
    if (swimBubbles.length > 65) return;
    var m = new THREE.Mesh(swimBubGeo, swimBubMat);
    m.userData.sharedGeo = true;
    m.position.set(x, y, z);
    m.scale.setScalar(r || (0.6 + Math.random() * 0.9));
    m.userData.vy = 0.75 + Math.random() * 0.85;
    m.userData.vx = (Math.random() - 0.5) * 0.35;
    m.userData.vz = (Math.random() - 0.5) * 0.35;
    m.userData.life = 1.6 + Math.random() * 1.1;
    MAY.scene.add(m);
    swimBubbles.push(m);
  }

  function updateSwimBubbles(dt, waterY) {
    for (var i = swimBubbles.length - 1; i >= 0; i--) {
      var b = swimBubbles[i];
      b.position.x += b.userData.vx * dt;
      b.position.y += b.userData.vy * dt;
      b.position.z += b.userData.vz * dt;
      b.userData.life -= dt;
      if (b.userData.life <= 0 || (waterY !== undefined && b.position.y > waterY - 0.1)) {
        MAY.scene.remove(b);
        swimBubbles.splice(i, 1);
      }
    }
  }

  /* Cập nhật trang phục của Mây */
  MAY.applyOutfit = function (name) {
    if (!MAY.OUTFITS[name] || !MAY.isOutfitUnlocked(name)) name = "vayhong";
    MAY.save.outfit = name;
    MAY.persist();
    var o = MAY.OUTFITS[name];
    bodyMat.color.setHex(o.body);
    accentMat.color.setHex(o.accent);
    bowGroup.visible = (name === "vayhong" || name === "rungxanh");
    pigtailsGroup.visible = (name === "haibim");
    yellowHatGroup.visible = (name === "muvang");
    winterHatGroup.visible = (name === "tuyetbong");
    crownGroup.visible = (name === "cauvong");

    var di = document.getElementById("diver-img");
    if (di) di.src = o.img;
    document.querySelectorAll(".outfit").forEach(function (el) {
      el.classList.toggle("sel", el.dataset.outfit === name);
    });
    syncRiggedOutfit(name, !P.onLand);
  };

  function updateGearVisuals(levelId) {
    var inWater = !P.onLand;
    var hasWings = (levelId === "level6" || MAY.hasGear(6));
    var hasSkis  = (levelId === "level5" && P.onLand);
    var hasLamp  = (levelId === "level4" || MAY.hasGear(4));
    var hasScarf = (levelId === "level3" || levelId === "level5" || MAY.hasGear(3));

    if (rigMay) {
      syncRiggedOutfit(MAY.save.outfit || "vayhong", inWater);
      var showStaff = P.onLand || castAnim > 0.01;
      if (rigMay.staffNode) rigMay.staffNode.visible = showStaff;
      if (rigMay.staffGemNode) {
        rigMay.staffGemNode.visible = showStaff;
        if (rigMay.staffGemNode.userData.halo) rigMay.staffGemNode.userData.halo.visible = showStaff;
      }
      wingsGroup.visible = hasWings && !inWater;
      wingsGroup.position.set(0, 0.02, 0.04);
      return;
    }

    scubaHeadGroup.visible = inWater;
    scubaBackGroup.visible = inWater;
    var oName = MAY.save.outfit;
    skirtMesh.visible = !inWater && (oName === "vayhong" || oName === "cauvong" || oName === "haibim");

    /* Hiệu ứng đồ ướt bóng rõ rệt như ảnh 2 & 3 khi lặn / mới lên bờ */
    bodyMat.clearcoat = 0.15 + P.wetness * 0.82;
    bodyMat.roughness = 0.62 - P.wetness * 0.34;
    suitLowerMat.clearcoat = 0.2 + P.wetness * 0.78;
    suitLowerMat.roughness = 0.56 - P.wetness * 0.32;
    skinMat.clearcoat = 0.08 + P.wetness * 0.6;

    fins.forEach(function (f) { f.visible = inWater; });
    skis.forEach(function (s) { s.visible = hasSkis && !inWater; });
    boots.forEach(function (b) { b.visible = !inWater; });
    scarfGroup.visible = hasScarf && !inWater;
    lampGroup.visible = (levelId === "level4") || (hasLamp && inWater);
    wingsGroup.visible = hasWings && !inWater;
  }

  /* ---- Điều khiển bàn phím, chuột & cảm ứng ---- */
  P.isTouch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  if (P.isTouch) document.body.classList.add("touch");
  window.addEventListener("touchstart", function onFirstTouch() {
    if (!P.isTouch) {
      P.isTouch = true;
      document.body.classList.add("touch");
      if (MAY.updateHintText && MAY.currentCtx) MAY.updateHintText(MAY.currentCtx);
    }
    window.removeEventListener("touchstart", onFirstTouch);
  }, { passive: true });

  /* Dùng mã phím vật lý (e.code) để tương thích 100% với bộ gõ tiếng Việt (UniKey/Telex)
     — KHÔNG gán P.keys từ e.key ("ư", "đ", "á", "Process"...) vì bộ gõ chèn ký tự tổng hợp
     không có sự kiện keyup tương ứng, gây lỗi kẹt phím tự di chuyển! */
  var KEY_UP_FALLBACK = { w: "KeyW", "ư": "KeyW", s: "KeyS", a: "KeyA", "ă": "KeyA", "â": "KeyA", d: "KeyD", "đ": "KeyD", c: "KeyC", q: "KeyQ", e: "KeyE", "ê": "KeyE", r: "KeyR", " ": "Space" };
  var DIGIT_CODES = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 };

  window.addEventListener("keydown", function (e) {
    // Let focused controls receive Space/Enter and their native keyboard behavior.
    // Escape still closes the active overlay below.
    if (e.code !== "Escape" && e.target && e.target.closest &&
        (e.target.closest("input, select, textarea, [contenteditable='true']") ||
         ((e.code === "Space" || e.code === "Enter") && e.target.closest("button, summary, [role='button']")))) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) !== -1) e.preventDefault();
    if (e.code === "Escape") {
      P.clearKeys();
      if (MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying()) {
        MAY.Cutscene.skip();
        return;
      }
      if (MAY.dialogueOpen) {
        if (MAY.finishDialogue) MAY.finishDialogue();
        return;
      }
      if (MAY.modalOpen) {
        var qOv = document.getElementById("quiz-ov");
        if (qOv && !qOv.classList.contains("hidden") && MAY.closeQuiz) MAY.closeQuiz();
        else if (MAY.closeAllModals) MAY.closeAllModals();
        return;
      }
    }
    /* Khi bấm phím tổ hợp hệ thống (Alt+Tab, Ctrl+..., Win) -> xả sạch phím đang giữ để chống kẹt */
    if (e.altKey || e.metaKey || e.ctrlKey) {
      P.clearKeys();
      return;
    }
    /* Không bao giờ giữ phím di chuyển khi chưa vào game, đang mở modal/thoại hoặc đang Cutscene */
    if (!MAY.started || MAY.modalOpen || MAY.dialogueOpen || (MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying())) {
      return;
    }
    /* Bỏ qua ký tự IME tổng hợp (UniKey/Telex chèn 'ư', 'đ', 'á' với e.code rỗng hoặc keyCode 229) */
    if (e.isComposing || e.key === "Process" || e.keyCode === 229) return;
    if (e.code && e.code !== "Unidentified") {
      P.keys[e.code] = true;
    }
    if (e.repeat) return;
    var kLow = (e.key || "").toLowerCase();
    if (e.code === "KeyF" || kLow === "f") MAY.cycleCam();
    else if (e.code === "KeyM" || kLow === "m") MAY.toggleMap();
    else if (e.code === "KeyJ" || kLow === "j") MAY.toggleAlbum();
    else if (e.code === "KeyR" || kLow === "r") { if (MAY.castActiveSpell) MAY.castActiveSpell(); }
    else if (e.code === "KeyT" || kLow === "t" || e.code === "Enter") { if (MAY.doInteract) MAY.doInteract(); }
    else if (DIGIT_CODES[e.code] !== undefined && MAY.selectSpell) MAY.selectSpell(DIGIT_CODES[e.code]);
    else if (e.key >= "1" && e.key <= "6" && MAY.selectSpell) MAY.selectSpell(parseInt(e.key, 10) - 1);
  });
  window.addEventListener("keyup", function (e) {
    if (e.code) P.keys[e.code] = false;
    var kLow = (e.key || "").toLowerCase();
    if (KEY_UP_FALLBACK[kLow]) P.keys[KEY_UP_FALLBACK[kLow]] = false;
    if (e.code === "AltLeft" || e.code === "AltRight" || e.code === "MetaLeft" || e.code === "MetaRight") {
      P.clearKeys();
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) P.clearKeys();
  });
  document.addEventListener("click", function (e) {
    var t = e && e.target;
    if (t && t.closest && t.closest(".hbtn, .spell-slot, .spell-cast, #interact")) {
      try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (err) {}
    }
  });

  var canvas = MAY.canvas;
  var dragging = false, dragMoved = false, dragX = 0, dragY = 0, downX = 0, downY = 0, downT = 0;
  var pointerLockBlocked = false;

  document.addEventListener("pointerlockchange", function () {
    var wasLocked = P.locked;
    P.locked = (document.pointerLockElement === canvas);
    if (wasLocked && !P.locked) P.clearKeys();
  });
  document.addEventListener("pointerlockerror", function () {
    pointerLockBlocked = true;
    P.locked = false;
  });

  /* Hỗ trợ xoay camera bằng CẢ kéo chuột trái/phải lẫn Pointer Lock (không bị chặn bởi isTouch!) */
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  window.addEventListener("contextmenu", function (e) { if (e.target !== canvas) P.clearKeys(); });

  function isInCutscene() {
    return !!(MAY.Cutscene && MAY.Cutscene.isPlaying && MAY.Cutscene.isPlaying());
  }

  canvas.addEventListener("mousedown", function (e) {
    if (!MAY.started || MAY.modalOpen || isInCutscene()) return;
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    downX = e.clientX; downY = e.clientY; downT = Date.now();
    dragMoved = false;
    if (!P.locked) {
      dragging = true;
      dragX = e.clientX;
      dragY = e.clientY;
      canvas.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mousemove", function (e) {
    if (!MAY.started || MAY.modalOpen || isInCutscene()) return;
    if (P.locked) {
      P.yaw -= (e.movementX || 0) * 0.0024;
      P.pitch -= (e.movementY || 0) * 0.0024;
      P.pitch = Math.max(-1.35, Math.min(1.25, P.pitch));
    } else if (dragging) {
      if (e.buttons === 0) { dragging = false; canvas.style.cursor = ""; return; }
      var dx = e.clientX - dragX;
      var dy = e.clientY - dragY;
      dragX = e.clientX;
      dragY = e.clientY;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) dragMoved = true;
      P.yaw -= dx * 0.0058;
      P.pitch -= dy * 0.0052;
      P.pitch = Math.max(-1.35, Math.min(1.25, P.pitch));
    }
  });

  window.addEventListener("mouseup", function (e) {
    dragging = false;
    canvas.style.cursor = "";
    if (!MAY.started || MAY.modalOpen || isInCutscene()) return;
    if (e.target !== canvas) return;
    var isShortClick = !dragMoved && Math.hypot(e.clientX - downX, e.clientY - downY) < 7 && (Date.now() - downT < 380);
    if (isShortClick && e.button === 0) {
      if (MAY.doInteract) MAY.doInteract(e.clientX, e.clientY);
    }
  });

  window.addEventListener("blur", function () {
    dragging = false;
    canvas.style.cursor = "";
    P.clearKeys();
  });

  /* Cuộn con lăn chuột để phóng to / thu nhỏ góc nhìn mượt mà */
  canvas.addEventListener("wheel", function (e) {
    if (!MAY.started || MAY.modalOpen || isInCutscene()) return;
    e.preventDefault();
    P.camDist = Math.max(3.0, Math.min(10.5, P.camDist + (e.deltaY > 0 ? 0.55 : -0.55)));
  }, { passive: false });

  var joyEl = document.getElementById("joy"), stickEl = document.getElementById("stick");
  var joyId = null, lookId = null, lookX = 0, lookY = 0;
  var tapId = null, tapX = 0, tapY = 0, tapT = 0;

  function resetTouchState(touches) {
    for (var i = 0; i < touches.length; i++) {
      var t = touches[i];
      if (t.identifier === joyId) {
        joyId = null; P.joy.active = false; P.joy.x = 0; P.joy.y = 0;
        if (stickEl) stickEl.style.transform = "";
      }
      if (t.identifier === lookId) lookId = null;
      if (t.identifier === tapId) tapId = null;
    }
  }

  function joyPos(t) {
    var r = joyEl.getBoundingClientRect();
    var dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
    var dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
    var l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    P.joy.x = dx; P.joy.y = dy;
    stickEl.style.transform = "translate(" + dx * 34 + "px," + dy * 34 + "px)";
  }
  if (joyEl) {
    joyEl.addEventListener("touchstart", function (e) {
      if (!MAY.started || MAY.modalOpen || isInCutscene()) return;
      e.preventDefault(); P.joy.active = true; joyId = e.changedTouches[0].identifier; joyPos(e.changedTouches[0]);
    }, { passive: false });
  }
  window.addEventListener("touchmove", function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === joyId) joyPos(t);
      else if (t.identifier === lookId && !MAY.modalOpen && !isInCutscene()) {
        P.yaw -= (t.clientX - lookX) * 0.005;
        P.pitch -= (t.clientY - lookY) * 0.005;
        P.pitch = Math.max(-1.35, Math.min(1.25, P.pitch));
        lookX = t.clientX; lookY = t.clientY;
      }
    }
    if (MAY.started && !MAY.modalOpen && !isInCutscene()) e.preventDefault();
  }, { passive: false });
  window.addEventListener("touchend", function (e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === joyId) { joyId = null; P.joy.active = false; P.joy.x = 0; P.joy.y = 0; if (stickEl) stickEl.style.transform = ""; }
      if (t.identifier === lookId) lookId = null;
      if (t.identifier === tapId) {
        if (MAY.started && !MAY.modalOpen && !isInCutscene() && Date.now() - tapT < 260 && Math.hypot(t.clientX - tapX, t.clientY - tapY) < 16) {
          if (MAY.doInteract) MAY.doInteract(t.clientX, t.clientY);
        }
        tapId = null;
      }
    }
  });
  window.addEventListener("touchcancel", function (e) {
    resetTouchState(e.changedTouches);
  });
  canvas.addEventListener("touchstart", function (e) {
    if (!MAY.started || MAY.modalOpen || isInCutscene()) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.clientX > window.innerWidth * 0.38 && lookId === null) {
        lookId = t.identifier; lookX = t.clientX; lookY = t.clientY;
        tapId = t.identifier; tapX = t.clientX; tapY = t.clientY; tapT = Date.now();
      }
    }
  }, { passive: true });

  function holdBtn(id, on, off) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", function (e) { e.preventDefault(); on(); }, { passive: false });
    el.addEventListener("touchend", off);
    el.addEventListener("touchcancel", off);
    el.addEventListener("mousedown", on);
    el.addEventListener("mouseup", off);
    el.addEventListener("mouseleave", off);
  }
  holdBtn("btn-up", function () { P.vert.up = true; }, function () { P.vert.up = false; });
  holdBtn("btn-down", function () { P.vert.down = true; }, function () { P.vert.down = false; });
  holdBtn("btn-sprint", function () { P.sprintHeld = true; }, function () { P.sprintHeld = false; });
  var btnJump = document.getElementById("btn-jump");
  if (btnJump) {
    btnJump.addEventListener("touchstart", function (e) { e.preventDefault(); P.jumpQueued = true; P.vert.up = true; }, { passive: false });
    btnJump.addEventListener("touchend", function () { P.vert.up = false; });
    btnJump.addEventListener("touchcancel", function () { P.vert.up = false; });
    btnJump.addEventListener("mousedown", function () { P.jumpQueued = true; });
    btnJump.addEventListener("mouseleave", function () { P.vert.up = false; });
  }

  MAY.cycleCam = function () {
    var dists = [4.2, 6.2, 8.6];
    var i = dists.indexOf(P.camDist);
    P.camDist = dists[(i + 1) % dists.length];
    if (MAY.save) { MAY.save.camDist = P.camDist; MAY.persist(); }
    MAY.toast(P.camDist === 4.2 ? "📷 Góc nhìn gần" : P.camDist === 6.2 ? "📷 Góc nhìn vừa" : "📷 Góc nhìn xa");
  };

  /* ---- Spawn & Cập nhật vật lý / hoạt ảnh khớp chân thực ---- */
  P.spawnAt = function (x, y, z, yaw, isUnderwater) {
    P.clearKeys();
    playerPos.set(x, y, z);
    vel.set(0, 0, 0);
    P.yaw = yaw || 0;
    P.pitch = 0;
    P.onLand = !isUnderwater;
    P.grounded = !isUnderwater;
    P.gliding = false;
    P.wetness = isUnderwater ? 1.0 : 0.0;
    P.camPosInit = false;
    for (var i = swimBubbles.length - 1; i >= 0; i--) MAY.scene.remove(swimBubbles[i]);
    swimBubbles.length = 0;
  };

  P.update = function (dt, t, ctx) {
    if (document.hasFocus && !document.hasFocus()) P.clearKeys();
    var fwd = 0, str = 0;
    if (!MAY.modalOpen && !MAY.dialogueOpen) {
      if (P.keys.KeyW || P.keys.ArrowUp) fwd += 1;
      if (P.keys.KeyS || P.keys.ArrowDown) fwd -= 1;
      if (P.keys.KeyA || P.keys.ArrowLeft) str -= 1;
      if (P.keys.KeyD || P.keys.ArrowRight) str += 1;
      if (P.keys.KeyQ) P.yaw += 2.0 * dt;
      if (P.keys.KeyE) P.yaw -= 2.0 * dt;
      if (P.joy.active) { fwd += -P.joy.y; str += P.joy.x; }
    }

    var sprint = P.keys.ShiftLeft || P.keys.ShiftRight || P.sprintHeld;
    var hasBoots = (ctx.id === "level2" || MAY.hasGear(2));
    var hasScarf = (ctx.id === "level3" || MAY.hasGear(3));
    var hasSkis  = (ctx.id === "level5" || MAY.hasGear(5));
    var hasWings = (ctx.id === "level6" || MAY.hasGear(6));

    var ghNow = ctx.groundH(playerPos.x, playerPos.z);
    var waterY = ctx.waterLevel !== undefined ? ctx.waterLevel : -999;
    var wasLand = P.onLand;

    if (ctx.mode === "underwater" || ctx.waterLevel !== undefined) {
      P.onLand = (ghNow > waterY - 0.85);
    } else {
      P.onLand = true;
    }

    if (ctx.mode === "underwater" || ctx.waterLevel !== undefined) {
      if (P.onLand && !wasLand) {
        MAY.toast("🏝️ Mây lên bờ rồi!", "Mây lên bờ rồi!");
        vel.y = 0;
        if (MAY.triggerLensWetness) MAY.triggerLensWetness();
        MAY.refreshHUD();
      } else if (!P.onLand && wasLand) {
        MAY.toast("💦 Tõm! Mây xuống nước bơi!", "Tõm! Mây xuống nước rồi!");
        MAY.refreshHUD();
      }
    }

    if (!P.onLand) P.wetness = 1.0;
    else if (P.wetness > 0) P.wetness = Math.max(0, P.wetness - dt * 0.08);

    var isIce = P.onLand && ctx.isIce && ctx.isIce(playerPos.x, playerPos.z);
    P.onIce = !!isIce;

    var baseSpeed = P.onLand ? 5.8 : 6.8;
    if (ctx.id === "level3" && hasScarf) baseSpeed = 7.0;
    if (isIce) baseSpeed = hasSkis ? 9.6 : 7.8;
    if (ctx.id === "level6") baseSpeed = 6.6;
    var sp = baseSpeed * (sprint ? 1.55 : 1);

    var sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
    var desVx = (-sin * fwd + cos * str) * sp;
    var desVz = (-cos * fwd - sin * str) * sp;

    if (isIce) {
      var grip = Math.min(1, dt * 2.1);
      vel.x += (desVx - vel.x) * grip;
      vel.z += (desVz - vel.z) * grip;
    } else {
      var accel = P.gliding ? Math.min(1, dt * 4.5) : Math.min(1, dt * 13);
      vel.x += (desVx - vel.x) * accel;
      vel.z += (desVz - vel.z) * accel;
    }

    playerPos.x += vel.x * dt;
    playerPos.z += vel.z * dt;

    /* Va chạm rắn 3D đa hình dạng (OBB hộp xoay, Cylinder trụ, Sphere cầu/vòm — giải lặp 2 vòng + trượt mượt dọc tường!) */
    if (ctx.colliders && ctx.colliders.length) {
      var pRad = 0.50;
      for (var iter = 0; iter < 2; iter++) {
        var pFeet = playerPos.y - 0.92;
        var pHead = playerPos.y + 0.65;
        for (var ci = 0; ci < ctx.colliders.length; ci++) {
          var col = ctx.colliders[ci];
          /* Bỏ qua va chạm ngang nếu Mây đang đứng cao hơn đỉnh hoặc chui hẳn dưới gầm (ví dụ vòm cổng / dầm đá) */
          if (col.maxY !== undefined && pFeet >= col.maxY - (col.walkable ? 0.35 : 0.08)) continue;
          if (col.minY !== undefined && pHead <= col.minY + 0.05) continue;

          if (col.shape === "box") {
            var rot = col.rotY || 0;
            var cs = Math.cos(-rot), sn = Math.sin(-rot);
            var dx = playerPos.x - col.x, dz = playerPos.z - col.z;
            var lx = dx * cs - dz * sn;
            var lz = dx * sn + dz * cs;
            var cx = Math.max(-col.hx, Math.min(col.hx, lx));
            var cz = Math.max(-col.hz, Math.min(col.hz, lz));
            var rx = lx - cx, rz = lz - cz;
            var d2 = rx * rx + rz * rz;
            if (d2 < pRad * pRad) {
              var nLx = 0, nLz = 0, push = 0;
              if (d2 > 1e-6) {
                var dd = Math.sqrt(d2);
                nLx = rx / dd; nLz = rz / dd;
                push = pRad - dd;
              } else {
                /* Tâm Mây rơi vào trong hộp -> đẩy ra theo mặt gần nhất */
                var ox = col.hx - Math.abs(lx), oz = col.hz - Math.abs(lz);
                if (ox < oz) { nLx = lx >= 0 ? 1 : -1; push = ox + pRad; }
                else { nLz = lz >= 0 ? 1 : -1; push = oz + pRad; }
              }
              var wcs = Math.cos(rot), wsn = Math.sin(rot);
              var nWx = nLx * wcs - nLz * wsn;
              var nWz = nLx * wsn + nLz * wcs;
              playerPos.x += nWx * push;
              playerPos.z += nWz * push;
              /* Triệt tiêu thành phần vận tốc đâm vào tường để trượt mượt dọc mép tường */
              var vn = vel.x * nWx + vel.z * nWz;
              if (vn < 0) { vel.x -= vn * nWx; vel.z -= vn * nWz; }
            }
          } else if (col.shape === "sphere") {
            var sy = col.y !== undefined ? col.y : 0;
            var dy = (playerPos.y - 0.15) - sy;
            var rSq = (col.r + pRad) * (col.r + pRad) - dy * dy;
            if (rSq > 0.001) {
              var effR = Math.sqrt(rSq);
              var sdx = playerPos.x - col.x, sdz = playerPos.z - col.z;
              var sdist = Math.hypot(sdx, sdz);
              if (sdist < effR && sdist > 0.0005) {
                var snx = sdx / sdist, snz = sdz / sdist;
                playerPos.x = col.x + snx * effR;
                playerPos.z = col.z + snz * effR;
                var svn = vel.x * snx + vel.z * snz;
                if (svn < 0) { vel.x -= svn * snx; vel.z -= svn * snz; }
              }
            }
          } else {
            /* Cylinder 3D có chặn độ cao [minY, maxY] */
            var cdx = playerPos.x - col.x, cdz = playerPos.z - col.z;
            var cdist = Math.hypot(cdx, cdz);
            var minD = (col.r || 1.2) + pRad;
            if (cdist < minD && cdist > 0.0005) {
              var cnx = cdx / cdist, cnz = cdz / cdist;
              playerPos.x = col.x + cnx * minD;
              playerPos.z = col.z + cnz * minD;
              var cvn = vel.x * cnx + vel.z * cnz;
              if (cvn < 0) { vel.x -= cvn * cnx; vel.z -= cvn * cnz; }
            }
          }
        }
      }
    }

    var maxR = ctx.worldRadius || 106;
    var rr = Math.hypot(playerPos.x, playerPos.z);
    if (rr > maxR) {
      playerPos.x *= maxR / rr;
      playerPos.z *= maxR / rr;
    }

    ghNow = ctx.groundH(playerPos.x, playerPos.z);
    if (ctx.getColliderTopY) {
      var colTop = ctx.getColliderTopY(playerPos.x, playerPos.z, playerPos.y - 0.98);
      if (colTop > ghNow) ghNow = colTop;
    }
    var vyInput = 0;
    P.gliding = false;

    if (P.onLand) {
      var wantJump = ((P.keys.Space && !P.prevSpace) || P.jumpQueued);
      P.jumpQueued = false;
      var jumpPower = (ctx.id === "level6") ? 8.6 : (hasBoots ? 7.5 : 6.2);
      if (wantJump && P.grounded) {
        vel.y = jumpPower;
        P.grounded = false;
        MAY.beep(540, 0.08, "sine", 0.07);
        if (rigMay) playMayClip("Jump_Start", 0.08, true);
      }

      if (ctx.bouncePads && ctx.bouncePads.length) {
        for (var bi = 0; bi < ctx.bouncePads.length; bi++) {
          var bp = ctx.bouncePads[bi];
          if (Math.hypot(playerPos.x - bp.x, playerPos.z - bp.z) < bp.r && Math.abs(playerPos.y - (bp.y + 0.95)) < 1.3 && vel.y <= 1.5) {
            vel.y = bp.power || 12.2;
            P.grounded = false;
            MAY.sndBounce();
            MAY.burstAt(new THREE.Vector3(bp.x, bp.y + 0.5, bp.z), 0x80ffdb, 10);
          }
        }
      }

      var grav = (ctx.id === "level6") ? 11.5 : 16.5;
      var holdGlide = (P.keys.Space || P.vert.up) && !P.grounded && vel.y < 0 && hasWings;
      if (holdGlide) {
        P.gliding = true;
        grav = 2.6;
        if (vel.y < -2.2) vel.y = -2.2;
      }

      vel.y -= grav * dt;
      playerPos.y += vel.y * dt;

      var landY = ghNow + 1.02;
      if (ghNow > -30 && playerPos.y <= landY) {
        playerPos.y = landY;
        vel.y = 0;
        P.grounded = true;
      } else if (ghNow <= -30) {
        P.grounded = false;
      }

      if (ctx.voidY !== undefined && playerPos.y < ctx.voidY) {
        var safe = ctx.getNearestSafePoint ? ctx.getNearestSafePoint(playerPos.x, playerPos.z) : { x: 0, y: 12, z: 0 };
        playerPos.set(safe.x, safe.y + 2.5, safe.z);
        vel.set(0, 2, 0);
        MAY.sndBounce();
        MAY.burstAt(playerPos.clone(), 0xffe066, 14);
        MAY.toast("🌬️ Hù! Làn gió mát đỡ Mây lên đảo mây rồi nè!", "Gió mát đỡ Mây lên lại rồi nè!");
      }
      P.prevSpace = !!P.keys.Space;
    } else {
      P.prevSpace = !!P.keys.Space;
      if (P.keys.Space || P.vert.up) vyInput += 1;
      if (P.keys.KeyC || P.vert.down) vyInput -= 1;
      playerPos.y += vyInput * 4.5 * dt;
      /* Cho phép nổi sát mặt nước như ảnh 3 hoặc lặn sâu xuống đáy như ảnh 2 */
      var ceilY = waterY - 0.15;
      var floorMin = Math.max(ctx.minY !== undefined ? ctx.minY : 1.5, ghNow + 1.05);
      if (playerPos.y > ceilY) playerPos.y = ceilY;
      if (playerPos.y < floorMin) playerPos.y = floorMin;
      P.grounded = false;
    }

    var speedHoriz = Math.hypot(vel.x, vel.z);
    var moving = speedHoriz > 0.35 || vyInput !== 0 || (P.onLand && !P.grounded);

    /* Tạo bọt khí li ti phía sau chân vịt & mặt nạ khi bơi dưới nước giống ảnh 2 */
    if (!P.onLand) {
      bubSpawnT -= dt;
      if (bubSpawnT <= 0) {
        bubSpawnT = moving ? 0.055 : 0.24;
        var bx = playerPos.x + sin * 0.75 + (Math.random() - 0.5) * 0.32;
        var bz = playerPos.z + cos * 0.75 + (Math.random() - 0.5) * 0.32;
        spawnSwimBubble(bx, playerPos.y - 0.12 + (Math.random() - 0.5) * 0.18, bz, 0.5 + Math.random() * 0.75);
        if (Math.random() < 0.35) {
          spawnSwimBubble(playerPos.x - sin * 0.45, playerPos.y + 0.15, playerPos.z - cos * 0.45, 0.7 + Math.random() * 0.7);
        }
      }
    }
    updateSwimBubbles(dt, ctx.waterLevel);

    /* Hoạt ảnh khớp tự nhiên + Gậy phép + Tiếng bước chân theo chất liệu + Camera bob */
    updateGearVisuals(ctx.id);
    staffGroup.visible = P.onLand || castAnim > 0.01;
    staffGem.rotation.y += dt * 2.5;
    if (castAnim > 0) castAnim = Math.max(0, castAnim - dt * 2.1);

    /* Tiếp đất có độ nhún trọng lượng thật */
    if (P.onLand && P.grounded && !prevGrounded) {
      landDip = 0.22;
      if (MAY.sndFootstep) MAY.sndFootstep(ctx.getSurface ? ctx.getSurface(playerPos.x, playerPos.z) : "grass");
      if (rigMay && !rigMay.oneShotName) playMayClip("Land", 0.08, true);
    }
    prevGrounded = P.grounded;
    if (landDip > 0) landDip = Math.max(0, landDip - dt * 1.4);
    if (camShake > 0) camShake = Math.max(0, camShake - dt * 1.15);

    /* Cập nhật bóng tiếp xúc chân dưới mặt đất */
    if (ghNow > -30) {
      var hAbove = Math.max(0, playerPos.y - 1.0 - ghNow);
      playerContact.visible = true;
      playerContact.position.set(playerPos.x, ghNow + 0.05, playerPos.z);
      var cs = Math.max(0.35, 1.0 - hAbove * 0.14);
      playerContact.scale.setScalar(cs);
      playerContact.material.opacity = Math.max(0.08, (P.onLand ? 0.62 : 0.42) * cs);
    } else {
      playerContact.visible = false;
    }

    diver.position.set(playerPos.x, playerPos.y - 0.12 - landDip * 0.3, playerPos.z);
    diver.rotation.y = P.yaw;

    if (P.onLand) {
      diver.rotation.x = 0;
      diver.rotation.z = P.onIce ? -str * 0.16 : -str * 0.04;
      diverPose.rotation.x = P.gliding ? -0.38 : (moving ? -0.07 : 0);
      headGroup.rotation.x = 0;
    } else {
      diver.rotation.x = 0;
      diver.rotation.z = -str * 0.12;
      diverPose.rotation.x = -1.32 + P.pitch * 0.34;
      headGroup.rotation.x = 0.52;
    }

    if (pigL) {
      var hairSway = Math.sin(t * (moving ? 8 : 2.5)) * (moving ? 0.22 : 0.05);
      pigL.rotation.x = (moving ? 0.3 : 0.05) + hairSway;
      pigR.rotation.x = (moving ? 0.3 : 0.05) - hairSway;
    }

    var headBobY = 0, headBobX = 0;
    if (P.gliding) {
      legL.root.rotation.x = 0.24; legR.root.rotation.x = 0.24;
      legL.mid.rotation.x = 0.35; legR.mid.rotation.x = 0.35;
      armL.root.rotation.z = 0.95; armR.root.rotation.z = -0.95;
      armL.root.rotation.x = 0; armR.root.rotation.x = 0;
      armL.mid.rotation.x = -0.2; armR.mid.rotation.x = -0.2;
      wingL.rotation.y = Math.PI - 0.35 + Math.sin(t * 14) * 0.45;
      wingR.rotation.y = 0.35 - Math.sin(t * 14) * 0.45;
    } else if (P.onLand) {
      armL.root.rotation.z = 0.08; armR.root.rotation.z = -0.08;
      var freq = sprint ? 11.5 : 8.5;
      if (!P.grounded) {
        legL.root.rotation.x = -0.45; legL.mid.rotation.x = 0.75;
        legR.root.rotation.x = 0.28; legR.mid.rotation.x = 0.55;
        armL.root.rotation.x = -0.55; armR.root.rotation.x = -0.55;
        armL.mid.rotation.x = -0.45; armR.mid.rotation.x = -0.45;
      } else if (moving) {
        stridePhase += dt * freq;
        var sSign = Math.sin(stridePhase) >= 0 ? 1 : -1;
        if (sSign !== lastStepSign) {
          lastStepSign = sSign;
          var surfType = P.onIce ? "ice" : (ctx.getSurface ? ctx.getSurface(playerPos.x, playerPos.z) : "grass");
          if (MAY.sndFootstep) MAY.sndFootstep(surfType);
        }
        headBobY = Math.abs(Math.sin(stridePhase)) * (sprint ? 0.075 : 0.048);
        headBobX = Math.cos(stridePhase) * 0.025;
        var amp = P.onIce ? 0.28 : (sprint ? 0.65 : 0.48);
        legL.root.rotation.x = Math.sin(stridePhase) * amp;
        legR.root.rotation.x = -Math.sin(stridePhase) * amp;
        legL.mid.rotation.x = Math.max(0, Math.sin(stridePhase - 1.1)) * amp * 1.15;
        legR.mid.rotation.x = Math.max(0, -Math.sin(stridePhase - 1.1)) * amp * 1.15;
        armL.root.rotation.x = -Math.sin(stridePhase) * amp * 0.85;
        armR.root.rotation.x = Math.sin(stridePhase) * amp * 0.55 - 0.15;
        armL.mid.rotation.x = -0.25 - Math.max(0, Math.sin(stridePhase)) * 0.45;
        armR.mid.rotation.x = -0.42;
      } else {
        var idle = Math.sin(t * 2.2) * 0.04;
        legL.root.rotation.x = 0; legR.root.rotation.x = 0;
        legL.mid.rotation.x = 0; legR.mid.rotation.x = 0;
        armL.root.rotation.x = idle; armR.root.rotation.x = -0.18 + idle * 0.5;
        armL.mid.rotation.x = -0.15; armR.mid.rotation.x = -0.45;
      }
      if (wingsGroup.visible) {
        wingL.rotation.y = Math.PI - 0.45 + Math.sin(t * 4) * 0.15;
        wingR.rotation.y = 0.45 - Math.sin(t * 4) * 0.15;
      }
    } else {
      var kFreq = moving ? (sprint ? 9.5 : 6.8) : 2.6;
      stridePhase += dt * kFreq;
      if (moving) {
        var wSign = Math.sin(stridePhase) >= 0 ? 1 : -1;
        if (wSign !== lastStepSign) { lastStepSign = wSign; if (MAY.sndFootstep) MAY.sndFootstep("water"); }
      }
      headBobY = Math.sin(t * 2.1) * 0.045;
      var kAmp = moving ? 0.48 : 0.14;
      legL.root.rotation.x = Math.sin(stridePhase) * kAmp;
      legR.root.rotation.x = -Math.sin(stridePhase) * kAmp;
      legL.mid.rotation.x = Math.max(0, Math.sin(stridePhase - 0.9)) * kAmp * 1.1 + 0.12;
      legR.mid.rotation.x = Math.max(0, -Math.sin(stridePhase - 0.9)) * kAmp * 1.1 + 0.12;
      var armStroke = moving ? Math.sin(t * 3.2) * 0.35 : Math.sin(t * 1.8) * 0.12;
      armL.root.rotation.x = 0.25 + armStroke; armR.root.rotation.x = 0.25 - armStroke;
      armL.root.rotation.z = 0.22 + Math.abs(armStroke) * 0.3; armR.root.rotation.z = -0.22 - Math.abs(armStroke) * 0.3;
      armL.mid.rotation.x = -0.32; armR.mid.rotation.x = -0.32;
    }

    /* Hoạt ảnh vung Gậy Phép khi thi triển kỹ năng */
    if (castAnim > 0) {
      var cArc = Math.sin(castAnim * Math.PI);
      armR.root.rotation.x = -1.35 * cArc;
      armR.root.rotation.z = -0.35 * cArc;
      armR.mid.rotation.x = -0.25;
    }

    /* Cập nhật AnimationMixer (13 clip) + biểu cảm khuôn mặt Shape Keys cho may_rigged.glb */
    if (rigMay) {
      if (rigMay.oneShotT > 0) {
        rigMay.oneShotT -= dt;
        if (rigMay.oneShotT <= 0) rigMay.oneShotName = null;
      }
      if (!rigMay.oneShotName) {
        var desiredClip = "Idle";
        if (!P.onLand) desiredClip = moving ? "Swim_Move" : "Swim_Idle";
        else if (P.gliding) desiredClip = "Glide";
        else if (!P.grounded) desiredClip = vel.y > 1.5 ? "Jump_Start" : "Fall_Loop";
        else if (moving) desiredClip = (sprint || speedHoriz > 7.0) ? "Run" : "Walk";
        playMayClip(desiredClip, 0.14, false);
      }
      rigMay.mixer.update(dt);
      /* Morph Targets trên khuôn mặt Mây: chớp mắt tự nhiên, cười khi vui, ngạc nhiên khi bị đòn */
      if (rigMay.faceMesh && rigMay.faceMesh.morphTargetInfluences && rigMay.faceMesh.morphTargetDictionary) {
        var md = rigMay.faceMesh.morphTargetDictionary;
        var mi = rigMay.faceMesh.morphTargetInfluences;
        rigMay.blinkT -= dt;
        if (rigMay.blinkT <= -0.16) rigMay.blinkT = 2.8 + Math.random() * 2.4;
        var blinkVal = rigMay.blinkT < 0 ? Math.sin((-rigMay.blinkT / 0.16) * Math.PI) : 0;
        if (rigMay.eyeMesh && rigMay.eyeMesh.morphTargetInfluences) rigMay.eyeMesh.morphTargetInfluences[0] = blinkVal;
        if (rigMay.happyMouth) rigMay.happyMouth.visible = rigMay.smileT > 0;
        if (md.Blink !== undefined) mi[md.Blink] = blinkVal;
        if (rigMay.smileT > 0) rigMay.smileT = Math.max(0, rigMay.smileT - dt);
        if (rigMay.hurtFaceT > 0) rigMay.hurtFaceT = Math.max(0, rigMay.hurtFaceT - dt);
        if (md.Smile !== undefined) mi[md.Smile] = rigMay.smileT > 0 ? Math.min(1, rigMay.smileT) : 0.18;
        if (md.Surprised !== undefined) mi[md.Surprised] = rigMay.hurtFaceT > 0 ? Math.min(1, rigMay.hurtFaceT) : 0;
      }
    }

    /* Camera góc nhìn thứ 3 điện ảnh có nhịp bước chân, độ nhún tiếp đất & rung chấn phép thuật */
    var fwdX = -Math.sin(P.yaw), fwdZ = -Math.cos(P.yaw);
    var rightX = Math.cos(P.yaw), rightZ = -Math.sin(P.yaw);
    var reducedMotion = reducedMotionQuery && reducedMotionQuery.matches;
    if (reducedMotion) { headBobX = 0; headBobY = 0; }
    var camH = P.onLand ? 2.35 : 2.15;
    var shakeX = !reducedMotion && camShake > 0 ? (Math.random() - 0.5) * camShake * 0.45 : 0;
    var shakeY = !reducedMotion && camShake > 0 ? (Math.random() - 0.5) * camShake * 0.45 : 0;
    var shoulder = P.onLand ? 0.38 : 0.22;
    var des = new THREE.Vector3(
      playerPos.x - fwdX * P.camDist + rightX * (shoulder + headBobX) + shakeX,
      playerPos.y + camH - P.pitch * 1.85 + headBobY - (reducedMotion ? 0 : landDip * 0.45) + shakeY,
      playerPos.z - fwdZ * P.camDist + rightZ * (shoulder + headBobX)
    );
    var camGround = ctx.groundH(des.x, des.z);
    if (camGround > -30 && des.y < camGround + 0.8) des.y = camGround + 0.8;
    if (!P.onLand && ctx.waterLevel !== undefined && playerPos.y < ctx.waterLevel - 1.1) {
      des.y = Math.min(des.y, ctx.waterLevel - 0.35);
    }

    if (!P.camPosInit) { MAY.camera.position.copy(des); P.camPosInit = true; }
    else MAY.camera.position.lerp(des, Math.min(1, dt * 6.8));

    var lookAhead = 2.6 + (moving ? Math.min(0.65, speedHoriz * 0.08) : 0);
    var lookP = new THREE.Vector3(playerPos.x + fwdX * lookAhead, playerPos.y + (P.onLand ? 0.72 : 0.2) + headBobY * 0.4 - (reducedMotion ? 0 : landDip * 0.2), playerPos.z + fwdZ * lookAhead);
    if (camFocus && camFocus.t > 0) {
      camFocus.t -= dt;
      var fk = Math.sin(Math.max(0, Math.min(1, camFocus.t / camFocus.maxT)) * Math.PI);
      lookP.lerp(camFocus.target, fk * 0.85);
      if (camFocus.t <= 0) camFocus = null;
    }
    MAY.camera.lookAt(lookP);
    if (!reducedMotion) MAY.camera.rotation.z += -str * 0.014 + headBobX * 0.08;
  };

  /* Cập nhật hoạt ảnh xương & khuôn mặt bé Mây trong lúc Cutscene 3D đang quay (không di chuyển vật lý) */
  P.updateRigOnly = function (dt, t, ctx, journeyClip) {
    var d = dt || 0.016;
    diver.position.set(playerPos.x, playerPos.y - 0.12, playerPos.z);
    diver.rotation.y = P.yaw;
    diver.rotation.x = 0;
    diver.rotation.z = 0;
    diverPose.rotation.x = P.onLand ? 0 : -1.2;
    updateGearVisuals(ctx ? ctx.id : (MAY.currentLevelId || "hub"));
    staffGroup.visible = P.onLand || castAnim > 0.01;
    staffGem.rotation.y += d * 2.5;
    if (ctx && ctx.groundH) {
      var ghC = ctx.groundH(playerPos.x, playerPos.z);
      if (ghC > -30) {
        playerContact.visible = true;
        playerContact.position.set(playerPos.x, ghC + 0.05, playerPos.z);
      } else {
        playerContact.visible = false;
      }
    }
    if (rigMay) {
      if (rigMay.oneShotT > 0) {
        rigMay.oneShotT -= d;
        if (rigMay.oneShotT <= 0) rigMay.oneShotName = null;
      }
      if (!rigMay.oneShotName) {
        playMayClip(journeyClip || (P.onLand ? "Idle" : "Swim_Idle"), 0.16, false);
      }
      rigMay.mixer.update(d);
      if (rigMay.faceMesh && rigMay.faceMesh.morphTargetInfluences && rigMay.faceMesh.morphTargetDictionary) {
        var md = rigMay.faceMesh.morphTargetDictionary;
        var mi = rigMay.faceMesh.morphTargetInfluences;
        rigMay.blinkT -= d;
        if (rigMay.blinkT <= -0.16) rigMay.blinkT = 2.8 + Math.random() * 2.4;
        var blinkVal = rigMay.blinkT < 0 ? Math.sin((-rigMay.blinkT / 0.16) * Math.PI) : 0;
        if (rigMay.eyeMesh && rigMay.eyeMesh.morphTargetInfluences) rigMay.eyeMesh.morphTargetInfluences[0] = blinkVal;
        if (rigMay.happyMouth) rigMay.happyMouth.visible = rigMay.smileT > 0;
        if (md.Blink !== undefined) mi[md.Blink] = blinkVal;
        if (rigMay.smileT > 0) rigMay.smileT = Math.max(0, rigMay.smileT - d);
        if (rigMay.hurtFaceT > 0) rigMay.hurtFaceT = Math.max(0, rigMay.hurtFaceT - d);
        if (md.Smile !== undefined) mi[md.Smile] = rigMay.smileT > 0 ? Math.min(1, rigMay.smileT) : 0.22;
        if (md.Surprised !== undefined) mi[md.Surprised] = rigMay.hurtFaceT > 0 ? Math.min(1, rigMay.hurtFaceT) : 0;
      }
    }
  };

  P.updateIdleOrbit = function (t, dt) {
    P.yaw = t * 0.16;
    diver.position.set(playerPos.x, playerPos.y - 0.12, playerPos.z);
    diver.rotation.y = P.yaw;
    diverPose.rotation.x = P.onLand ? 0 : -1.2;
    updateGearVisuals(MAY.currentLevelId || "hub");
    if (rigMay) {
      playMayClip(P.onLand ? "Idle" : "Swim_Idle", 0.2, false);
      rigMay.mixer.update(dt || 0.016);
    }
    MAY.camera.position.set(playerPos.x + Math.sin(t * 0.16) * 7.2, playerPos.y + 2.8, playerPos.z + Math.cos(t * 0.16) * 7.2);
    MAY.camera.lookAt(playerPos.x, playerPos.y + 0.55, playerPos.z);
  };

  MAY.player = P;
  MAY.diver = diver;

})(window.MAY);
