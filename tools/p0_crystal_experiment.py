"""Paired crystal transition experiment; roots must differ only in proposed change."""

import functools
import http.server
import json
from pathlib import Path
import sys
import threading

from playwright.sync_api import sync_playwright


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


servers = []
for root in sys.argv[1:3]:
    server = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), functools.partial(Quiet, directory=str(Path(root).resolve()))
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    servers.append(server)
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(
        channel="chrome", headless=True, args=["--enable-gpu", "--use-angle=d3d11"]
    )
    for run in range(4):
        for side in [0, 1] if run % 2 == 0 else [1, 0]:
            context = browser.new_context(
                viewport={"width": 1180, "height": 760}, service_workers="block"
            )
            page = context.new_page()
            page.goto(
                "http://127.0.0.1:%s/" % servers[side].server_port,
                wait_until="domcontentloaded",
                timeout=120000,
            )
            page.wait_for_function(
                "window.__ready && !document.querySelector('#btn-play').disabled",
                timeout=180000,
            )
            page.evaluate(
                """() => {MAY.save.freeExplore=true;MAY.LEVEL_META.forEach(m=>MAY.getLevelSave(m.id).introSeen=true)}"""
            )
            page.locator("#btn-play").click()
            page.wait_for_function("MAY.currentCtx && MAY.started", timeout=120000)
            page.evaluate("""() => {
              window.exp = {frames: [], gaps: [], start: 0};
              let last = null;
              function observeFrame(time) {
                if (last !== null && exp.start) exp.gaps.push({t: time, dt: time - last});
                last = time;
                requestAnimationFrame(observeFrame);
              }
              requestAnimationFrame(observeFrame);
              const render = MAY.renderFrame;
              MAY.renderer.info.autoReset = false;
              MAY.renderFrame = function (...args) {
                MAY.renderer.info.reset();
                const start = performance.now();
                const result = render.apply(this, args);
                if (exp.start && MAY.currentLevelId === 'level4' && exp.frames.length < 30) {
                  exp.frames.push({start, ms: performance.now() - start,
                    draws: MAY.renderer.info.render.calls});
                }
                return result;
              };
            }""")
            page.evaluate("""() => {
              exp.start = performance.now();
              return MAY.enterLevel('level4', true);
            }""")
            page.wait_for_function("exp.frames.length >= 30", timeout=120000)
            result = page.evaluate("""() => {
              const frames = exp.frames;
              const firstDrawEnd = frames[0].start + frames[0].ms;
              const observed = exp.gaps.filter(gap => gap.t <= frames[29].start);
              return {
                first: firstDrawEnd - exp.start,
                draws: frames.map(frame => frame.draws),
                render: frames.map(frame => frame.ms),
                gaps: observed.map(gap => gap.dt),
                afterGaps: observed.filter(gap => gap.t - gap.dt >= firstDrawEnd).map(gap => gap.dt)
              };
            }""")
            result.update(run=run + 1, side="baseline" if side == 0 else "candidate")
            results.append(result)
            print(
                result["run"],
                result["side"],
                "first",
                round(result["first"]),
                "max subsequent",
                round(max(result["render"][1:])),
                flush=True,
            )
            context.close()
    browser.close()
for server in servers:
    server.shutdown()
    server.server_close()
Path(sys.argv[3]).write_text(json.dumps(results, indent=2), encoding="utf8")
