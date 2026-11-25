"""Run the crystal first-frame ablations or ten water/crystal revisits on localhost."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


class Server(ThreadingHTTPServer):
    request_queue_size = 64


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def handle(self):
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            # Closing a test browser cancels in-flight media and cache requests.
            pass


MEASURE = """async ([level, variant]) => {
  const gl = MAY.renderer.getContext();
  const gpu = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL);
  const row = {level, variant, gpu, passes: {}, glCalls: {}, gaps: [], tasks: []};
  function collect(entries) {
    entries.forEach(e => row.tasks.push({start: e.startTime, duration: e.duration}));
  }
  const observer = new PerformanceObserver(list => collect(list.getEntries()));
  observer.observe({type: 'longtask'});
  const undo = [];
  function wrap(object, key, replacement) {
    const original = object[key];
    object[key] = replacement(original);
    undo.push(() => {object[key] = original});
  }
  ['linkProgram','compileShader','getProgramParameter','getUniformLocation','texImage2D','texSubImage2D'].forEach(key => {
    wrap(gl, key, original => function (...args) {
      const start = performance.now();
      const result = original.apply(this,args);
      row.glCalls[key] = (row.glCalls[key] || 0) + performance.now() - start;
      return result;
    });
  });
  for (const [name, pass] of [['reflection',MAY.PlanarReflector], ['refraction',MAY.WaterRefractor]]) {
    wrap(pass, 'render', original => function (...args) {
      if (variant === name) return;
      const start = performance.now();
      const result = original.apply(this,args);
      if (MAY.currentLevelId === level && !(name in row.passes)) row.passes[name] = performance.now() - start;
      return result;
    });
  }
  wrap(MAY.LEVELS,level,original => function () {
    const start = performance.now();
    const ctx = original();
    row.build = performance.now() - start;
    if (variant === 'lampShadow') MAY.diveLight.castShadow = false;
    if (variant === 'shadows') MAY.renderer.shadowMap.enabled = false;
    if (variant === 'warmTextures' || variant === 'warmMaterials') {
      const before = performance.now();
      if (variant === 'warmTextures') {
        const textures = new Set();
        MAY.scene.traverse(o => {
          for (const m of [].concat(o.material || [])) {
            Object.values(m).filter(x => x && x.isTexture && x.image).forEach(x => textures.add(x));
          }
        });
        textures.forEach(x => MAY.renderer.initTexture(x));
      } else {
        const previous = MAY.renderer.getRenderTarget(), target = new THREE.WebGLRenderTarget(2,2);
        MAY.renderer.setRenderTarget(target);
        try { MAY.renderer.compile(MAY.scene, MAY.camera); }
        finally { MAY.renderer.setRenderTarget(previous); target.dispose(); }
      }
      row.preparation = performance.now() - before;
    }
    return ctx;
  });
  const first = new Promise(resolve => {
    wrap(MAY, 'renderFrame', original => function (...args) {
      const start = performance.now();
      const result = original.apply(this,args);
      if (MAY.currentLevelId === level && row.draw === undefined) {
        row.draw = performance.now() - start;
        row.drawEnd = performance.now();
        resolve();
      }
      return result;
    });
  });
  let prior = await new Promise(requestAnimationFrame);
  let raf;
  function gap(time) { row.gaps.push(time - prior); prior = time; raf = requestAnimationFrame(gap); }
  raf = requestAnimationFrame(gap);
  const start = performance.now();
  window.skipPost = variant === 'post';
  try {
    await MAY.enterLevel(level, true);
    await first;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    row.toDrawEnd = row.drawEnd - start;
    delete row.drawEnd;
    row.maxGap = Math.max(...row.gaps);
    row.memory = {...MAY.renderer.info.memory};
    row.programs = MAY.renderer.info.programs.length;
    row.colliders = MAY.currentCtx.colliders.length;
    row.errors = MAY.ErrorBoundary.history.length;
    row.webglError = gl.getError();
    collect(observer.takeRecords());
    row.tasks = row.tasks.filter(e => e.start + e.duration >= start);
    return row;
  } finally {
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.skipPost = false;
    undo.reverse().forEach(f => f());
  }
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--revisits", action="store_true")
    parser.add_argument("--variants", nargs="+", default=["normal", "reflection", "refraction", "post",
                                                          "lampShadow", "shadows", "warmTextures", "warmMaterials"])
    args = parser.parse_args()
    source = args.root.resolve()
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(source)))
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"
    results = []
    with sync_playwright() as pw:
        for variant in (["normal"] if args.revisits else args.variants):
            browser = pw.chromium.launch(channel="chrome", args=["--enable-gpu", "--use-angle=d3d11",
                                                                  "--disable-gpu-shader-disk-cache"])
            try:
                page = browser.new_page(viewport={"width": 1180, "height": 760}, service_workers="block")
                page.set_default_timeout(120000)
                if variant == "post":
                    source_js = (source / "js/pbr.js").read_text("utf8")
                    page.route("**/js/pbr.js", lambda route: route.fulfill(content_type="text/javascript",
                               body=source_js.replace("|| !post.enabled", "|| window.skipPost || !post.enabled")))
                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_function("window.__ready && !document.querySelector('#btn-play').disabled")
                page.locator("#btn-play").dispatch_event("click")
                page.evaluate("MAY.Cutscene.cancelSilent(); MAY.closeDialogue(false)")
                if not page.evaluate("MAY.isLevelUnlocked('level4')"):
                    page.locator("#btn-map").dispatch_event("click")
                    page.locator("#btn-map-free").dispatch_event("click")
                    page.locator("#map-close").dispatch_event("click")
                levels = ["level1", "level4"] * 5 if args.revisits else ["level4"]
                for level in levels:
                    row = page.evaluate(MEASURE, [level, variant])
                    results.append(row)
                    args.output.write_text(json.dumps(results, indent=2), encoding="utf8")
                    print(variant, level, round(row["draw"]), round(row["maxGap"]), row["memory"], flush=True)
            finally:
                browser.close()
    server.shutdown()
    server.server_close()


if __name__ == "__main__":
    main()
