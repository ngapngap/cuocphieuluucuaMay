/* The rig uses a shared texture atlas: recolor only saturated pink fabric pixels. */
window.MAY = window.MAY || {};
window.MAY.prepareForestOutfit = function (root) {
  var parts = [];
  root.traverse(function (object) {
    if (object.name !== "May_Body" && object.name.indexOf("May_Dress") !== 0) return;
    object.traverse(function (mesh) {
      if (!mesh.isMesh || !mesh.material || !mesh.material.map) return;
      var original = mesh.material, image = original.map.image;
      if (!image || !image.width || !image.height) return;
      var canvas = document.createElement("canvas");
      canvas.width = image.width; canvas.height = image.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < pixels.data.length; i += 4) {
        var r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
        if (r > g * 1.25 && b > g * 1.12 && r - g > 30) {
          pixels.data[i] = g * 0.75; pixels.data[i + 1] = r; pixels.data[i + 2] = g * 0.8;
        }
      }
      ctx.putImageData(pixels, 0, 0);
      var texture = new THREE.CanvasTexture(canvas);
      texture.flipY = original.map.flipY; texture.encoding = original.map.encoding;
      texture.wrapS = original.map.wrapS; texture.wrapT = original.map.wrapT;
      texture.repeat.copy(original.map.repeat); texture.offset.copy(original.map.offset);
      texture.needsUpdate = true;
      var forest = original.clone(); forest.map = texture;
      parts.push({ mesh: mesh, original: original, forest: forest });
    });
  });
  return function (enabled) { parts.forEach(function (p) { p.mesh.material = enabled ? p.forest : p.original; }); };
};
