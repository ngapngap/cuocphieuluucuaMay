"""Compare HEAD and working tree in Chrome with fixed crystal-pillar cameras."""

import functools
import http.server
import io
import json
import pathlib
import sys
import threading
from PIL import Image
from playwright.sync_api import sync_playwright

root = pathlib.Path(sys.argv[1]).resolve()
tag = sys.argv[2]
output = pathlib.Path("tools/issue15-qa")
output.mkdir(exist_ok=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Quiet, directory=str(root))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = "http://127.0.0.1:%s/" % server.server_port
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome", headless=True, args=["--enable-gpu", "--use-angle=d3d11"]
    )
    for quality in ("low", "mid"):
        for width, height in ((1180, 760), (390, 844)):
            context = browser.new_context(
                viewport={"width": width, "height": height}, service_workers="block"
            )
            page = context.new_page()
            page.add_init_script(
                """window.gaps=[]; let last; function f(t){if(last!==undefined)gaps.push({t,gap:t-last});last=t;requestAnimationFrame(f)}requestAnimationFrame(f);"""
            )
            page.goto(url, wait_until="domcontentloaded", timeout=120000)
            page.wait_for_function(
                "window.__ready && !document.querySelector('#btn-play').disabled",
                timeout=180000,
            )
            page.evaluate(
                "q=>{MAY.save.freeExplore=true;MAY.save.quality=q;MAY.applyQuality(q);MAY.LEVEL_META.forEach(m=>MAY.getLevelSave(m.id).introSeen=true);}",
                quality,
            )
            page.click("#btn-play", timeout=120000)
            page.wait_for_function("MAY.currentCtx && MAY.started", timeout=120000)
            page.evaluate(
                """() => {let r=MAY.renderFrame;MAY.renderer.info.autoReset=false;MAY.renderFrame=function(){let m=window.measure; if(window.shot){let s=window.shot;MAY.camera.position.set(s.x,s.y+3.2,s.z+7);MAY.camera.lookAt(s.x,s.y+1.7,s.z)} MAY.renderer.info.reset();let v=r.apply(this,arguments);if(m&&MAY.currentLevelId==='level4'&&!m.first){m.first=performance.now();m.draws=MAY.renderer.info.render.calls}return v;};window.measure={start:performance.now()};}"""
            )
            page.evaluate("() => MAY.enterLevel('level4',true)")
            page.wait_for_function("window.measure.first", timeout=120000)
            page.wait_for_timeout(1500)
            data = page.evaluate(
                """() => {let m=measure;let gl=MAY.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {first:m.first-m.start,draws:m.draws,gap:Math.max(...gaps.filter(x=>x.t>=m.start&&x.t-x.gap<=m.first).map(x=>x.gap)),gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):''}}"""
            )
            for n, x, z in ((0, -16, 10), (1, 16, 10), (2, 0, -28)):
                page.evaluate(
                    """([x,z])=>{let y=MAY.currentCtx.groundH(x,z);MAY.player.pos.set(x,y+1.1,z+7);window.shot={x,y,z}}""",
                    [x, z],
                )
                page.wait_for_timeout(400)
                png = page.screenshot()
                Image.open(io.BytesIO(png)).convert("RGB").save(
                    output / f"{tag}-{quality}-{width}-{n}.webp", "WEBP", quality=88
                )
            data.update(quality=quality, width=width, height=height)
            results.append(data)
            print(tag, data, flush=True)
            context.close()
    browser.close()
server.shutdown()
(output / (tag + ".json")).write_text(json.dumps(results, indent=2), encoding="utf8")
