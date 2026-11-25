"""Copy the current game into temporary paired roots and instance stalactites."""

from pathlib import Path
import shutil
import tempfile

source = Path(__file__).resolve().parent.parent
destination = Path(tempfile.mkdtemp(prefix="may-crystal-p0-"))
baseline = destination / "baseline"
candidate = destination / "candidate"
baseline.mkdir()
for name in (
    "assets",
    "icons",
    "js",
    "index.html",
    "style.css",
    "game.js",
    "sw.js",
    "manifest.json",
    "three.min.js",
    "favicon.ico",
):
    src = source / name
    if src.is_dir():
        shutil.copytree(src, baseline / name)
    else:
        shutil.copy2(src, baseline / name)
shutil.copytree(baseline, candidate)
path = candidate / "js/levels/level4_crystal.js"
data = path.read_text(encoding="utf-8")
start = data.index("    for (var st = 0; st < 28; st++) {")
end = data.index("\n    }", start) + len("\n    }")
data = (
    data[:start]
    + """    var stalGroup = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), stalMat, 28);
    var stalDummy = new THREE.Object3D();
    for (var st = 0; st < 28; st++) {
      var sa = (st * 2.399) % 6.28, sr = 14 + (st * 2.4) % 58;
      var sx = Math.cos(sa) * sr, sz = Math.sin(sa) * sr;
      var sl = 5 + (st % 5) * 2.8;
      stalDummy.position.set(sx, 36 - (sr * 0.22), sz);
      stalDummy.rotation.x = Math.PI;
      stalDummy.scale.set(1.1 + (st % 3) * 0.5, sl, 1.1 + (st % 3) * 0.5);
      stalDummy.updateMatrix();
      stalGroup.setMatrixAt(st, stalDummy.matrix);
    }
    stalGroup.instanceMatrix.needsUpdate = true;
    ctx.add(stalGroup);"""
    + data[end:]
)
path.write_text(data, encoding="utf-8")
print(baseline)
print(candidate)
