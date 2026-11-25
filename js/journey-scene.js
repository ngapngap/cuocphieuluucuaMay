"use strict";
(function (MAY) {
  var laneWidth = 3.7;
  MAY.journeyLaneWidth = laneWidth;
  var horizonNames = ["", "reef", "forest", "desert", "cavern", "snow", "clouds"];
  var horizonFog = [0, 0x4599a5, 0x91b4a5, 0xd6af8e, 0x596f99, 0xafc6dd, 0xb7c6df];
  MAY.addJourneyHorizon = function (scene, biome, section, sky) {
    var indoors = biome === 3 && section === 1;
    var dusk = biome === 3 && section >= 2;
    var fog = new THREE.Color(horizonFog[biome]).lerp(new THREE.Color(sky), indoors || dusk ? 0.66 : 0.25);
    scene.fog.color.copy(fog);
    var settings = {
      panorama: { value: null },
      inverseProjection: { value: new THREE.Matrix4() },
      cameraBasis: { value: new THREE.Matrix3() },
      haze: { value: fog },
      grading: { value: indoors ? 0.78 : dusk ? 0.49 : 0.15 },
      azimuth: { value: 0.48 + 0.11 * section }
    };
    var material = new THREE.ShaderMaterial({
      uniforms: settings, depthWrite: false, depthTest: false, toneMapped: false,
      vertexShader: [
        "uniform mat4 inverseProjection; uniform mat3 cameraBasis; varying vec3 sight;",
        "void main(){",
        "  vec4 ray=inverseProjection*vec4(position.xy,1.,1.);",
        "  sight=cameraBasis*ray.xyz; gl_Position=vec4(position.xy,1.,1.);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D panorama; uniform vec3 haze; uniform float grading,azimuth; varying vec3 sight;",
        "void main(){",
        "  vec3 dir=normalize(sight);",
        "  float longitude=atan(dir.x,-dir.z)/6.2831853;",
        "  float x=1.-abs(mod(azimuth+2.*longitude,2.)-1.);",
        "  float y=(asin(clamp(dir.y,-1.,1.))+.115)/.52;",
        "  vec3 ink=texture2D(panorama,vec2(x,clamp(y,.003,.997))).rgb;",
        "  float lum=dot(ink,vec3(.299,.587,.114));",
        "  vec3 color=mix(ink,haze*(.4+.65*lum),grading);",
        "  color=mix(color,haze,.57*(1.-smoothstep(-.22,.09,y)));",
        "  color=mix(color,mix(haze,vec3(.79,.87,.94),.56),.75*smoothstep(.98,1.48,y));",
        "  gl_FragColor=vec4(color,1.);",
        "}"
      ].join("\n")
    });
    var backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    backdrop.name = "JourneyHorizon";
    backdrop.visible = false;
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -1000;
    backdrop.onBeforeRender = function (renderer, world, camera) {
      settings.inverseProjection.value.copy(camera.projectionMatrixInverse);
      settings.cameraBasis.value.setFromMatrix4(camera.matrixWorld);
    };
    scene.add(backdrop);
    var released = false;
    var name = indoors ? "cavern" : horizonNames[biome];
    var texture = new THREE.TextureLoader().load("assets/img/horizon-" + name + ".webp", function () {
      if (!released) backdrop.visible = true;
    });
    settings.panorama.value = texture;
    material.addEventListener("dispose", function () {
      released = true;
      texture.dispose();
    });
  };
  MAY.journeyFloorMaterial = function (biome, options) {
    var name = ["", "sandRipple", "forestGround", "sandRipple", "wetCaveRock", "snow", "stoneWall"][biome];
    var maps = MAY.PBR[name];
    return new THREE.MeshStandardMaterial(
      Object.assign(
        {
          map: maps.map,
          normalMap: maps.normalMap,
          roughnessMap: maps.roughnessMap,
          normalScale: new THREE.Vector2(0.55, 0.55)
        },
        options
      )
    );
  };
  MAY.drawJourneyScene = function (scene, camera) {
    var renderer = MAY.renderer,
      exposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = 0.81;
    try {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    } finally {
      renderer.toneMappingExposure = exposure;
    }
  };

  // Section coordinates follow the trail. Keep lateral steering perpendicular to its slope.
  MAY.makeJourneyScene = function (ctx, config, sectionIndex, state) {
    var s = config.sections[sectionIndex],
      biome = ctx.meta.num;
    var canopy = biome === 2 && s.scenery === "canopy";
    var skyBridge = biome === 6;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(s.sky);
    scene.fog = new THREE.FogExp2(s.sky, biome === 4 ? 0.017 : 0.011);
    MAY.addJourneyHorizon(scene, biome, sectionIndex, s.sky);
    scene.environment = MAY.scene.environment;
    scene.add(new THREE.HemisphereLight(0xfff6df, s.ground, 0.8));
    var sun = new THREE.DirectionalLight(0xffedc2, 0.95);
    sun.position.set(-24, 42, 16);
    scene.add(sun);
    var camera = new THREE.PerspectiveCamera(63, 1, 0.12, 240);
    var seed = biome * 7 + sectionIndex * 3;
    function forkOffset(d, forced) {
      var offset = 0;
      s.events.forEach(function (e, i) {
        if (e.kind !== "fork") return;
        var choice = forced == null ? state.choices[sectionIndex + "-" + i] : forced;
        if (choice !== 0 && choice !== 1) return;
        var progress = (d - e.at * s.length) / 95;
        if (progress > 0 && progress < 1)
          offset += (choice === 0 ? -1 : 1) * 7.5 * Math.sin(Math.PI * progress);
      });
      return offset;
    }
    function xAt(d) {
      return 11 * Math.sin(d / 47 + seed) + 4.5 * Math.sin(d / 20 + seed * 0.6) + forkOffset(d, null);
    }
    function height(d) {
      return (
        (canopy ? 12 : 0) +
        (biome === 2 || biome === 5 || biome === 6 ? 3.6 : 1.75) * Math.sin(d / 38 + seed)
      );
    }
    function place(d, lateral, up, vec) {
      var dx = (xAt(d + 0.05) - xAt(d - 0.05)) / 0.1;
      var k = lateral / Math.sqrt(1 + dx * dx);
      return vec.set(xAt(d) + k, height(d) + up, -d + dx * k);
    }
    var pt = new THREE.Vector3(),
      ahead = new THREE.Vector3();
    var surface = new THREE.Color(s.path),
      soil = new THREE.Color(s.ground);
    function ribbon(edges, colors, material) {
      var verts = [],
        shades = [],
        uvs = [],
        indices = [];
      var count = Math.ceil((s.length + 50) / 5);
      for (var i = 0; i <= count; i++) {
        var d = -20 + i * 5;
        for (var j = 0; j < edges.length; j++) {
          var edge = edges[j],
            variation = 0.97 + 0.035 * Math.sin(i * 0.8 + j);
          place(d, edge[0], edge[1], pt);
          verts.push(pt.x, pt.y, pt.z);
          uvs.push(pt.x / (canopy ? 7 : 115), pt.z / (canopy ? 7 : 115));
          var c = colors[j];
          shades.push(c.r * variation, c.g * variation, c.b * variation);
          if (i && j) {
            var v = i * edges.length + j,
              w = edges.length;
            indices.push(v - w - 1, v - w, v - 1, v - w, v, v - 1);
          }
        }
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      scene.add(
        new THREE.Mesh(
          geo,
          material ||
            MAY.journeyFloorMaterial(biome, {
              vertexColors: true,
              roughness: biome === 5 ? 0.46 : 0.83,
              side: THREE.DoubleSide
            })
        )
      );
    }
    var rim = surface.clone().lerp(new THREE.Color(config.color), 0.35);
    var deckMaterial = canopy
      ? new THREE.MeshStandardMaterial({
          map: MAY.PBR.bark.map,
          normalMap: MAY.PBR.bark.normalMap,
          roughnessMap: MAY.PBR.bark.roughnessMap,
          color: 0xb6a386,
          roughness: 0.9,
          side: THREE.DoubleSide
        })
      : null;
    if (canopy) {
      // The deck is raised above a separate forest floor. Its width covers all
      // three steering lanes; the two fork ribbons below cover both arms.
      var floor = new THREE.Mesh(
        new THREE.PlaneGeometry(500, s.length + 150),
        MAY.journeyFloorMaterial(2, { color: 0x63805f, roughness: 0.95 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, -8, -s.length / 2);
      scene.add(floor);
      ribbon(
        [
          [-7.5, 0],
          [7.5, 0]
        ],
        [soil, soil],
        deckMaterial
      );
    } else if (skyBridge) {
      // A real raised bridge over a cloud sea, rather than a tiled field.
      var cloudSea = new THREE.Mesh(new THREE.PlaneGeometry(500, s.length + 150),
        new THREE.MeshStandardMaterial({ color: 0xd8c5e8, roughness: 1 }));
      cloudSea.rotation.x = -Math.PI / 2;
      cloudSea.position.set(0, -10, -s.length / 2); scene.add(cloudSea);
      var bridgeSide = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide });
      var bridgeStone = new THREE.Color(0x796c96), bridgeEdge = new THREE.Color(0xb19dbd);
      ribbon([[-7.6,0],[-7.6,-1.1],[-7.1,-1.35],[7.1,-1.35],[7.6,-1.1],[7.6,0]],
        [bridgeEdge,bridgeStone,bridgeStone,bridgeStone,bridgeStone,bridgeEdge], bridgeSide);
      var stripe = [0xb85878,0xc59255,0x699a84,0x5c91ae,0x8e73a9].map(function (c) { return new THREE.Color(c); });
      ribbon([[-7.5,0.02],[-4.5,0.02],[-1.5,0.02],[1.5,0.02],[4.5,0.02],[7.5,0.02]],
        [stripe[0],stripe[1],stripe[2],stripe[3],stripe[4],stripe[4]], bridgeSide);
      // Narrow stone kerbs remain legible alongside the pastel paving.
      var edging = new THREE.Color(0xa98a75);
      ribbon([[-7.5,0.045],[-7.12,0.045]], [edging,edging], bridgeSide);
      ribbon([[7.12,0.045],[7.5,0.045]], [edging,edging], bridgeSide);
    } else
      ribbon(
        [
          [-95, -3],
          [-15, -0.8],
          [-7.4, -0.06],
          [-6.8, 0],
          [-5.9, 0.08],
          [0, 0.08],
          [5.9, 0.08],
          [6.8, 0],
          [7.4, -0.06],
          [15, -0.8],
          [95, -3]
        ],
        [soil, soil, soil, rim, surface, surface, surface, rim, soil, soil, soil]
      );
    // Both visible arms exist before choosing; the saved choice steers the
    // player and subsequent stations along the selected curve until rejoining.
    s.events.forEach(function (e) {
      if (e.kind !== "fork") return;
      [0, 1].forEach(function (choice) {
        var vertices = [],
          uvs = [],
          indices = [],
          start = e.at * s.length;
        for (var i = 0; i <= 24; i++) {
          var d = start + (i * 95) / 24,
            base = 11 * Math.sin(d / 47 + seed) + 4.5 * Math.sin(d / 20 + seed * 0.6),
            center = base + forkOffset(d, choice);
          var halfWidth = canopy ? 7.5 : 2.4;
          vertices.push(center - halfWidth, height(d) + 0.12, -d, center + halfWidth, height(d) + 0.12, -d);
          uvs.push((center - halfWidth) / 7, -d / 7, (center + halfWidth) / 7, -d / 7);
          if (i) {
            var v = i * 2;
            indices.push(v - 2, v - 1, v, v - 1, v + 1, v);
          }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        if (canopy) geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        scene.add(
          new THREE.Mesh(
            geo,
            canopy
              ? deckMaterial
              : new THREE.MeshStandardMaterial({
                  color: choice === 0 ? 0x65cba2 : 0xe3c67d,
                  roughness: 0.85,
                  side: THREE.DoubleSide
                })
          )
        );
      });
    });

    if (canopy) {
      // Closely spaced cross-planks make the elevated surface read as a
      // constructed bridge, including on each of the two fork arms.
      var plankTransforms = [],
        plankDummy = new THREE.Object3D();
      function plankAt(d, forced, raised) {
        var base = function (x) {
          return 11 * Math.sin(x / 47 + seed) + 4.5 * Math.sin(x / 20 + seed * 0.6) + forkOffset(x, forced);
        };
        var slope = (base(d + 0.05) - base(d - 0.05)) / 0.1;
        plankDummy.position.set(base(d), height(d) + raised, -d);
        plankDummy.rotation.set(0, -Math.atan(slope), 0);
        plankDummy.scale.set(14.9, 0.12, 1.3);
        plankDummy.updateMatrix();
        plankTransforms.push(plankDummy.matrix.clone());
      }
      for (var pd = -18; pd < s.length + 25; pd += 1.45) plankAt(pd, null, 0.08);
      s.events.forEach(function (e) {
        if (e.kind !== "fork") return;
        for (
          var fd = e.at * s.length + 1.45;
          fd < Math.min(s.length + 20, e.at * s.length + 95);
          fd += 1.45
        ) {
          plankAt(fd, 0, 0.2);
          plankAt(fd, 1, 0.2);
        }
      });
      var planks = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        deckMaterial,
        plankTransforms.length
      );
      plankTransforms.forEach(function (m, i) {
        planks.setMatrixAt(i, m);
      });
      scene.add(planks);
    }

    var box = new THREE.BoxGeometry(1, 1, 1),
      stone = new THREE.IcosahedronGeometry(1, 0);
    var sphere = new THREE.SphereGeometry(1, 10, 7),
      trunk = new THREE.CylinderGeometry(0.66, 1, 1, 8);
    var spike = new THREE.ConeGeometry(1, 1, 6);
    var art = new Map(),
      transform = new THREE.Object3D();
    function stamp(key, geo, color, d, side, h, sx, sy, sz, turn, roll) {
      if (!art.has(key)) art.set(key, { geo: geo, color: color, matrices: [] });
      place(d, side, h, transform.position);
      transform.scale.set(sx, sy, sz);
      transform.rotation.set(0, turn || 0, roll || 0);
      transform.updateMatrix();
      art.get(key).matrices.push(transform.matrix.clone());
    }
    if (skyBridge) {
      // Staggered joints suggest individual slabs without thousands of meshes.
      for (var joint = -18, row = 0; joint < s.length + 24; joint += 3.2, row++) {
        var tangent = -Math.atan((xAt(joint + 0.05) - xAt(joint - 0.05)) / 0.1);
        stamp("sky-paving-joints", box, 0x91828e, joint, 0, 0.055, 14.1, 0.025, 0.045, tangent);
        [-1, 1].forEach(function (side) {
          stamp("sky-paving-joints", box, 0x91828e, joint + 1.6, side * (row % 2 ? 2.2 : 3.6), 0.055, 0.045, 0.025, 3.15, tangent);
        });
      }
    }
    // Separate silhouettes mark navigable edges even with fog or reduced audio.
    for (var i = 0; i < s.length / 6 + 2; i++) {
      var dist = i * 6,
        a = Math.sin(i * 49.7 + seed),
        side = i % 2 ? 1 : -1;
      var offset = side * (8.7 + Math.abs(a) * 5),
        size = 0.8 + Math.abs(a);
      var g = s.scenery || "";
      if (biome === 1 && g === "wreck") {
        stamp("rib", box, 0x704936, dist, offset, 2.6, 0.68, 7, 0.78, 0.2, side * 0.35);
        if (i % 3 !== 1) stamp("plank", box, 0x977052, dist, offset + side * 1.2, 1.1, 2.6, 0.34, 4.6, a * 0.2, side * 0.36);
      } else if (biome === 1) {
        stamp("coral", trunk, 0xf38d74, dist, offset, 1.1, 0.37, 3 * size, 0.42, a, side * 0.2);
        if (i % 3 !== 0) stamp("arm", trunk, 0xffbb8d, dist, offset + 0.52, 1.8, 0.24, 1.8, 0.26, 0, -0.7);
        stamp("kelp", sphere, 0x338575, dist + 1, offset + 0.8, 1, 0.26, 2.6 * size, 0.45, a, 0.25);
      } else if (biome === 2 && canopy) {
        stamp(
          "canopy-trunk",
          trunk,
          0x655747,
          dist,
          offset + side * 3,
          -11,
          size,
          15,
          size,
          a,
          side * 0.08
        );
        stamp("canopy-crown", stone, 0x55936a, dist, offset + side * 3, -4, 4.1 + (i % 3) * 0.7, 2.2 + (i % 2) * 0.8, 5.2, a);
        stamp(
          "canopy-cap",
          sphere,
          i % 4 < 2 ? 0xc48170 : 0xd3a377,
          dist + 1,
          offset,
          -1.7,
          2.1 * size,
          0.55 * size,
          2.1 * size,
          a
        );
      } else if (biome === 2) {
        stamp("bark", trunk, 0x5c5441, dist, offset + side * 3, 4.4, size, 11, size, a, side * 0.13);
        stamp("leaf", stone, 0x478458, dist, offset + side * 3, 9, 4.5, 3.5, 4.7, a);
        if (i % 3 !== 1) stamp("stem", trunk, 0xedce9c, dist + 1, offset, 1, 0.46, 2.5 * size, 0.5, a);
        if (i % 3 !== 1) stamp(
          "cap",
          sphere,
          i % 4 < 2 ? 0xdf846f : 0xecb371,
          dist + 1,
          offset,
          2.1 * size,
          2 * size,
          0.72 * size,
          2 * size,
          a
        );
      } else if (biome === 3) {
        if (i % 3 !== 1) {
          stamp("column", trunk, 0xb48253, dist, offset, 2.9, 1.1, 6 * size, 1.1, a * 0.1);
          stamp("capital", box, 0xf0cc8d, dist, offset, 5.95 * size, 2.6, 0.65, 2.6, a * 0.1);
        } else stamp("ruin", stone, 0xb48253, dist, offset, 1.3, 2.8, 2.1, 2.0, a);
        if (i % 5 === 0) stamp("pylon", spike, 0xbb996a, dist, offset + side * 15, 4, 7, 10, 7, a);
      } else if (biome === 4) {
        stamp("cave", stone, 0x514a75, dist, offset + side * 5, 3.3, 5 * size, 6.8, 4.3, a);
        if (i % 3 !== 1) stamp("quartz", spike, 0x8e9fe5, dist, offset, 2.0, 0.95, (3.5 + i % 3) * size, 1.1, a, side * 0.24);
        if (i % 3 !== 2) stamp("amethyst", spike, 0xc886ef, dist + 1, offset + 1, 1.15, 0.65, 2.9, 0.8, a, -side * 0.3);
        if (i % 4 === 0) {
          stamp("cave-shelf", box, 0x453b60, dist, offset + side * 6, 5.2, 7.2, 1.1, 5.2, a * 0.2, side * 0.08);
          stamp("cave-column", stone, 0x625479, dist + 2, offset + side * 8, 4.5, 2.1, 8.8, 2.8, a);
          stamp("cave-glint", stone, 0x77d6d5, dist + 2, offset + side * 5, 3.4, 0.9, 1.8, 0.9, a);
        }
      } else if (biome === 5) {
        stamp("granite", stone, 0x737e97, dist, offset, 0.65, 2.2 * size, 1.5, 2.4, a);
        stamp("drift", stone, 0xe6f7ff, dist, offset, 1.45, 2.45 * size, 1.1, 2.6, a);
        if (i % 4 !== 1) {
          var pineHeight = 5.0 + (i % 3) * 1.3;
          stamp("icepine", spike, 0x65979a, dist + 2, offset + side * 6, pineHeight * 0.45, 2.0 * size, pineHeight, 2.1, a);
          stamp("whitepine", spike, 0xdae8ee, dist + 2, offset + side * 6, pineHeight * 0.69, 1.55 * size, pineHeight * 0.57, 1.6, a);
        } else stamp("snow-boulder", stone, 0xc1d8e4, dist + 2, offset + side * 6, 1.1, 3.0, 2.2, 2.5, a);
      } else {
        stamp("cloud", sphere, 0xffe8e9, dist, offset + side * 4, 0.8, 4.5 * size, 2, 4.2, a);
        if (i % 4 === 0) {
          stamp("pier", trunk, 0xa99ebd, dist, offset, 2.5, 0.75, 5.3, 0.75, a * 0.2);
          stamp("gold", spike, 0xfac976, dist, offset, 5.9, 1.0, 2.0, 1.0, a);
        } else if (i % 4 === 1) {
          stamp("sky-masonry", box, 0xb99cac, dist, offset, 1.65, 2.6, 3.3, 2.3, a * 0.2);
          stamp("sky-rail", box, 0x9e725d, dist, offset, 3.45, 3.0, 0.35, 2.7, a * 0.2);
        } else if (i % 4 === 2) {
          stamp("pier", trunk, 0xa99ebd, dist, offset, 1.25, 0.48, 2.5, 0.48, a);
          stamp("sky-lantern", sphere, 0xffd889, dist, offset, 2.8, 0.55, 0.7, 0.55, a);
        }
        var bridgeSlope = (xAt(dist + 0.05) - xAt(dist - 0.05)) / 0.1;
        [-1, 1].forEach(function (edge) {
          stamp("sky-rail", box, 0x9e725d, dist, edge * 7.7, 1.15, 0.22, 0.22, 6.3, -Math.atan(bridgeSlope));
          stamp("sky-post", box, 0xb38f75, dist, edge * 7.7, 0.55, 0.22, 1.1, 0.22, 0);
        });
        if (i % 4 === 0) {
          stamp("sky-masonry", box, 0xb99cac, dist + 1, offset + side * 3, -0.5, 6, 1.0, 4.0, a * 0.15);
          stamp("sky-lantern", sphere, 0xffd889, dist + 1, offset + side * 3, 4.7, 0.65, 0.85, 0.65, a);
        }
      }
    }
    art.forEach(function (v) {
      var inst = new THREE.InstancedMesh(
        v.geo,
        new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.79 }),
        v.matrices.length
      );
      v.matrices.forEach(function (m, j) {
        inst.setMatrixAt(j, m);
      });
      scene.add(inst);
    });
    // Only one architectural model per section; the player approaches it in world space.
    var landmark = config.makeLandmark && config.makeLandmark(sectionIndex);
    if (landmark) {
      place(s.length + 5, 0, 0, landmark.position);
      scene.add(landmark);
    }
    var vista = config.makeVista && config.makeVista(sectionIndex, state, s);
    if (vista && vista.group) scene.add(vista.group);
    // Underwater bubbles and a watercourse make the approach read as a place,
    // while leaving the three navigable lanes clear.
    if (biome === 1) {
      var bubbleGeo = new THREE.SphereGeometry(0.25, 8, 6);
      var bubbleMat = new THREE.MeshStandardMaterial({
        color: 0xa7eff2,
        transparent: true,
        opacity: 0.6,
        roughness: 0.15
      });
      var bubbles = new THREE.InstancedMesh(bubbleGeo, bubbleMat, Math.ceil(s.length / 12) * 3);
      for (var bi = 0; bi < bubbles.count; bi++) {
        var bd = Math.floor(bi / 3) * 12,
          bs = (bi % 2 ? 1 : -1) * (8.5 + (bi % 3) * 0.8);
        place(bd, bs, 1.2 + (bi % 3) * 1.5, transform.position);
        transform.scale.setScalar(0.5 + (bi % 3) * 0.35);
        transform.rotation.set(0, 0, 0);
        transform.updateMatrix();
        bubbles.setMatrixAt(bi, transform.matrix);
      }
      scene.add(bubbles);
    } else if (biome === 2 && s.scenery === "roots") {
      var waterColor = new THREE.Color(0x63c9db),
        waterEdge = new THREE.Color(0x378ca6);
      ribbon(
        [
          [-13, -0.5],
          [-10, -0.4],
          [-8.2, -0.3]
        ],
        [waterEdge, waterColor, waterEdge]
      );
    }
    var palette = [0x78edc7, 0xffbb75, 0xd8a4ff];
    var mats = new Map();
    function mesh(group, geo, color, x, y, z, w, h, l, glow) {
      var key = color + "/" + !!glow;
      if (!mats.has(key))
        mats.set(
          key,
          new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.62,
            emissive: glow ? color : 0,
            emissiveIntensity: 0.52
          })
        );
      var m = new THREE.Mesh(geo, mats.get(key));
      m.position.set(x, y, z);
      m.scale.set(w, h, l);
      group.add(m);
      return m;
    }
    var ringGeo = new THREE.TorusGeometry(1, 0.12, 6, 22);
    function resolvedEvent(i) {
      return MAY.journeyEvent ? MAY.journeyEvent(config, state, sectionIndex, i) : s.events[i];
    }
    function makeMarker(e) {
      var station = new THREE.Group(),
        lane = (e.lane || 0) * laneWidth;
      place(e.at * s.length, 0, 0.13, station.position);
      var out = { group: station };
      if (e.kind === "pass" || e.kind === "escort" || e.kind === "fork") {
        for (var n = -1; n <= 1; n++) {
          var safe = e.kind === "fork" ? n !== 0 : n === (e.lane || 0);
          if (safe) {
            var gateColor = e.kind === "fork" ? (n < 0 ? 0x62e4b2 : 0xffd16a) : config.color;
            mesh(station, ringGeo, gateColor, n * laneWidth, 1.55, 0, 1.6, 1.75, 1, true);
          } else {
            if (biome === 1 && s.scenery === "wreck") {
              var plank = mesh(station, box, 0x79543c, n * laneWidth, 1.1, 0, 2.8, 0.45, 0.5);
              plank.rotation.z = n ? 0.4 : -0.4;
              mesh(station, box, 0x997054, n * laneWidth, 0.45, 0, 0.35, 0.9, 0.55);
            } else if (biome === 1) {
              mesh(station, stone, 0x597f86, n * laneWidth, 0.65, 0, 2.1, 1.2, 1.5);
              for (var bubble = 0; bubble < 3; bubble++)
                mesh(
                  station,
                  sphere,
                  0xc0f7f1,
                  n * laneWidth + (bubble - 1) * 0.55,
                  1.5 + bubble * 0.55,
                  0,
                  0.22,
                  0.22,
                  0.22,
                  true
                );
            } else if (biome === 2) {
              var root = mesh(station, trunk, 0x76543d, n * laneWidth, 0.65, 0, 0.55, 2.9, 0.55);
              root.rotation.z = Math.PI / 2;
              mesh(station, sphere, 0x78c879, n * laneWidth, 1.15, 0, 0.6, 0.45, 0.6);
            } else mesh(station, stone, s.ground, n * laneWidth, 0.9, 0, 1.65, 1.55, 1.3);
          }
        }
      } else if (e.kind === "align") {
        out.dial = new THREE.Group();
        out.dial.position.set(lane, 1.35, 0);
        station.add(out.dial);
        mesh(station, trunk, 0x927a6e, lane, 0.52, 0, 0.8, 1.0, 0.8);
        mesh(out.dial, box, 0xa5f3fc, 0, 0.18, 0, 1.2, 1.15, 0.18, true);
        mesh(out.dial, box, 0xffdb83, 0, -0.18, -1.25, 0.1, 0.12, 2.5, true);
        var angle = (e.answer * Math.PI * 2) / e.slots;
        mesh(
          station,
          ringGeo,
          0xffc75c,
          lane - 2.55 * Math.sin(angle),
          1.14,
          -2.55 * Math.cos(angle),
          0.45,
          0.45,
          0.45,
          true
        );
      } else if (e.kind === "echo") {
        out.notes = [];
        for (var k = 0; k < 3; k++)
          out.notes.push(
            mesh(
              station,
              spike,
              palette[k],
              lane + (k - 1) * 1.15,
              0.95,
              0,
              0.55,
              1.7 + k * 0.26,
              0.55,
              true
            )
          );
      } else if (e.kind === "cast") {
        var spell = MAY.spellById
          ? MAY.spellById(e.spell)
          : MAY.SPELLS.find(function (sp) {
              return sp.id === e.spell;
            });
        if (biome === 1 && s.scenery === "wreck") {
          var board = mesh(station, box, 0x94633f, lane, 1.18, 0, 2.3, 0.7, 0.55);
          board.rotation.z = 0.3;
        } else if (biome === 2 && e.spell === "growth") {
          mesh(station, trunk, 0x805e41, lane, 0.55, 0, 0.7, 1.1, 0.7);
          mesh(station, sphere, 0x80c76d, lane, 1.3, 0, 0.65, 0.8, 0.65);
        } else mesh(station, stone, 0x585778, lane, 1.18, 0, 1.6, 1.35, 1.2);
        mesh(station, ringGeo, spell ? spell.color : config.color, lane, 1.6, 0.8, 0.78, 0.78, 0.5, true);
      } else {
        (e.choices || []).forEach(function (_, k, arr) {
          var x = lane + (k - (arr.length - 1) / 2) * 1.45;
          mesh(station, trunk, 0x866557, x, 0.6, 0, 0.4, 1.2, 0.4);
          mesh(
            station,
            k === 0 ? sphere : k === 1 ? spike : box,
            palette[k % 3],
            x,
            1.55,
            0,
            0.5,
            0.65,
            0.5,
            true
          );
        });
      }
      scene.add(station);
      return out;
    }
    var markers = s.events.map(function (_, i) {
      return makeMarker(resolvedEvent(i));
    });
    var lastChoices = JSON.stringify(state.choices);
    function refreshFutureMarkers() {
      var choices = JSON.stringify(state.choices);
      if (choices === lastChoices) return;
      lastChoices = choices;
      for (var i = state.event; i < markers.length; i++) {
        scene.remove(markers[i].group);
        markers[i] = makeMarker(resolvedEvent(i));
      }
    }
    var kinds = {
      bubi: "dolphin",
      fish: "clownfish",
      rabbit: "forestrabbit",
      owl: "owl",
      wolf: "wolf",
      wind: "miloWinged"
    };
    var friends = [],
      companion = s.companion;
    var needsEscort = s.events.some(function (e) {
      return e.kind === "escort";
    });
    var amount = companion === "fish" ? 5 : companion === "wolf" ? 3 : companion || needsEscort ? 1 : 0;
    for (var f = 0; f < amount; f++) {
      var model = MAY.makeAnimal(kinds[companion] || (biome === 5 ? "wolf" : "milo"));
      model.scale.multiplyScalar(companion === "fish" ? 1.4 : 0.88);
      scene.add(model);
      if (model.userData.playClip) model.userData.playClip(biome === 1 ? "swim" : "walk");
      friends.push(model);
    }
    // Reuse Mây's dressed and animated model; put it back before disposing this scene.
    scene.add(MAY.diver);
    var shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 18),
      new THREE.MeshBasicMaterial({ color: 0x302c45, opacity: 0.21, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(0.74, 0.45, 1);
    scene.add(shadow);
    // A chosen shelter visibly changes the trail after the fork and survives reload.
    var branchGroups = [];
    if (biome === 1)
      s.events.forEach(function (e, i) {
        if (e.kind !== "fork") return;
        var choices = [];
        for (var choice = 0; choice < 2; choice++) {
          var branch = new THREE.Group();
          for (var n = 0; n < 8; n++) {
            var d = e.at * s.length + 11 + n * 8,
              lateral = (choice === 0 ? -1 : 1) * (7.8 + (n % 2) * 1.8);
            var prop = mesh(
              branch,
              choice === 0 ? spike : sphere,
              choice === 0 ? 0x64d9a3 : 0xffca70,
              0,
              0,
              0,
              choice === 0 ? 0.8 : 1.2,
              choice === 0 ? 2.3 : 0.8,
              0.8,
              true
            );
            place(d, lateral, 1, prop.position);
          }
          branch.visible = false;
          scene.add(branch);
          choices.push(branch);
        }
        branchGroups.push({ key: sectionIndex + "-" + i, groups: choices });
      });
    function showBranches() {
      branchGroups.forEach(function (b) {
        var chosen = state.choices[b.key];
        b.groups.forEach(function (g, i) {
          g.visible = chosen === i;
        });
      });
    }
    showBranches();
    var buddyLane = state.lateral || 0,
      look = new THREE.Vector3(),
      eye = new THREE.Vector3();
    function draw(dt, t, moving, angle, note) {
      refreshFutureMarkers();
      showBranches();
      var distance = state.distance,
        x = state.lateral,
        heading = place(distance + 1, x, 0, ahead).x - place(distance, x, 0, pt).x;
      if (vista && vista.group) {
        place(distance, 0, 0, vista.group.position);
        if (vista.tick) vista.tick(distance, x, state.event, t);
      }
      MAY.player.updateRigOnly(
        dt,
        t,
        null,
        biome === 1 ? (moving ? "Swim_Move" : "Swim_Idle") : moving ? "Run" : "Idle"
      );
      place(distance, x, biome === 1 ? 1.7 : 1.0, MAY.diver.position);
      MAY.diver.rotation.set(0, -Math.atan(heading), 0);
      place(distance, x, 0.15, shadow.position);
      buddyLane += (x - buddyLane) * Math.min(1, dt * 1.7);
      friends.forEach(function (m, j) {
        var stagger = (j % 2 ? 1 : -1) * (0.78 + 0.18 * j);
        place(
          distance - 1.7 - 0.52 * j,
          buddyLane + stagger,
          (biome === 1 || companion === "owl" || companion === "wind" ? 1.5 : 0.18) +
            0.08 * Math.sin(t * 3 + j),
          m.position
        );
        m.rotation.y = Math.PI - Math.atan(heading);
        if (m.userData.mixer) m.userData.mixer.update(dt);
      });
      var marker = markers[state.event];
      if (marker && marker.dial)
        marker.dial.rotation.y = (angle * 2 * Math.PI) / resolvedEvent(state.event).slots;
      if (marker && marker.notes)
        marker.notes.forEach(function (m, k) {
          m.scale.y = (note === k ? 2.8 : 1.7) + k * 0.26;
        });
      place(distance - 7.2, x * 0.73, 4.1, eye);
      place(distance + 6.6, x * 0.58, 1.15, look);
      camera.aspect = window.innerWidth / window.innerHeight;
      if (camera.aspect < 0.8) {
        eye.y += 1.6;
        eye.z += 2.4;
      }
      camera.updateProjectionMatrix();
      camera.position.copy(eye);
      camera.lookAt(look);
      MAY.drawJourneyScene(scene, camera);
    }
    function completed(i) {
      var marker = markers[i];
      if (!marker) return;
      marker.group.clear();
      // A lasting bloom, clear-water pearl or glowing seal records the change.
      var hue = biome === 1 ? 0x8cefe0 : biome === 2 ? 0x91e69b : config.color;
      mesh(marker.group, ringGeo, hue, 0, 0.3, 0, 0.8, 0.8, 0.8, true).rotation.x = Math.PI / 2;
      mesh(marker.group, sphere, hue, 0, 0.75, 0, 0.35, 0.35, 0.35, true);
    }
    for (var past = 0; past < state.event; past++) completed(past);
    return {
      draw: draw,
      partyLane: function () {
        return buddyLane;
      },
      complete: completed,
      dispose: function () {
        MAY.scene.add(MAY.diver);
        MAY.disposeSceneBranch(scene);
        // Completed stations have been cleared from the scene, so retain and
        // release their shared materials explicitly too.
        mats.forEach(function (material) {
          material.dispose();
        });
        // Some primitive types may have no instances in this biome.
        [box, stone, sphere, trunk, spike, ringGeo].forEach(function (g) {
          g.dispose();
        });
      }
    };
  };
})(window.MAY);
