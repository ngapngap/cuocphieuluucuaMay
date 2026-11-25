import functools
import http.server
import json
import pathlib
import sys
import threading
import time

from playwright.sync_api import sync_playwright

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Quiet, directory=str(root))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = "http://127.0.0.1:%s/" % server.server_port
init = """() => { window.metrics={gaps:[],tasks:[],last:null}; new PerformanceObserver(l=>l.getEntries().forEach(e=>metrics.tasks.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true}); function tick(t){if(metrics.last!==null)metrics.gaps.push({at:t,gap:t-metrics.last});metrics.last=t;requestAnimationFrame(tick)} requestAnimationFrame(tick); }"""
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome", headless=True, args=["--enable-gpu", "--use-angle=d3d11"]
    )
    results = []
    for run in range(
        int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 5
    ):
        ctx = browser.new_context(
            service_workers="block", viewport={"width": 1180, "height": 760}
        )
        page = ctx.new_page()
        page.add_init_script("(" + init + ")()")
        for mode in ("cold", "reload"):
            if mode == "reload":
                page.evaluate(
                    """() => { MAY.save.currentLevel='hub'; MAY.persist(); }"""
                )
            start = time.monotonic()
            page.goto(
                url, wait_until="domcontentloaded", timeout=120000
            ) if mode == "cold" else page.reload(
                wait_until="domcontentloaded", timeout=120000
            )
            page.wait_for_function(
                "!document.querySelector('#btn-play').disabled && window.__ready",
                timeout=180000,
            )
            ready = (time.monotonic() - start) * 1000
            device = page.evaluate(
                """() => {let gl=document.createElement('canvas').getContext('webgl'); let ext=gl&&gl.getExtension('WEBGL_debug_renderer_info'); return {ua:navigator.userAgent,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,cores:navigator.hardwareConcurrency};}"""
            )
            if not page.evaluate("MAY.save.freeExplore || MAY.save.freeSpells"):
                page.click("#btn-start-free")
            page.evaluate(
                """() => { MAY.LEVEL_META.forEach(m => MAY.getLevelSave(m.id).introSeen = true); }"""
            )
            page.click("#btn-play")
            page.evaluate("""() => {
          Object.keys(MAY.LEVELS).forEach(id => { let original=MAY.LEVELS[id]; MAY.LEVELS[id]=function(){let m=window.measureCurrent; if(m && m.id===id) m.buildStart=performance.now(); try{return original.apply(this,arguments)}finally{if(m && m.id===id)m.build=performance.now()} }; });
          let render=MAY.renderFrame; MAY.renderFrame=function(){let r=render.apply(this,arguments),m=window.measureCurrent; if(m && m.build && !m.frame && MAY.currentLevelId===m.id)m.frame=performance.now();return r;};
        }""")
            visits = []
            oceanResources = None
            for visit, idx in enumerate([1, 2, 3, 4, 5, 6, 1]):
                if "--from-hub" in sys.argv and visit:
                    page.click("#btn-map", force=True)
                    page.evaluate(
                        "window.measureCurrent={id:'hub',start:performance.now()}"
                    )
                    page.locator("#map-grid .map-card").nth(0).click(
                        force=True, timeout=120000
                    )
                    page.wait_for_function(
                        "window.measureCurrent && window.measureCurrent.frame",
                        timeout=120000,
                    )
                page.click("#btn-map", force=True)
                page.evaluate(
                    "(id) => {window.measureCurrent={id,start:performance.now()}}",
                    "level" + str(idx),
                )
                page.locator("#map-grid .map-card").nth(idx).click(
                    force=True, timeout=120000
                )
                page.wait_for_function(
                    "window.measureCurrent && window.measureCurrent.frame",
                    timeout=120000,
                )
                page.evaluate(
                    """() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))"""
                )
                record = page.evaluate(
                    """() => {let m=measureCurrent; let gaps=metrics.gaps.filter(x=>x.at>=m.start && x.at-x.gap<=m.frame); return {...m,maxGap:Math.max(0,...gaps.map(x=>x.gap)),tasks:metrics.tasks.filter(x=>x.start<=m.frame && x.start+x.duration>=m.start)} }"""
                )
                if oceanResources is None:
                    oceanResources = page.evaluate(
                        """() => performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize,encoded:e.encodedBodySize}))"""
                    )
                before = page.evaluate(
                    """() => [MAY.player.pos.x,MAY.player.pos.y,MAY.player.pos.z]"""
                )
                page.keyboard.down("w")
                page.wait_for_timeout(300)
                page.keyboard.up("w")
                record["control"] = page.evaluate(
                    """before => ({before,after:[MAY.player.pos.x,MAY.player.pos.y,MAY.player.pos.z],modal:MAY.modalOpen,cutscene:!!(MAY.Cutscene&&MAY.Cutscene.isPlaying())})""",
                    before,
                )
                visits.append(record)
            results.append(
                {
                    "run": run + 1,
                    "mode": mode,
                    "scenario": "from-hub"
                    if "--from-hub" in sys.argv
                    else "sequential",
                    "readyMs": ready,
                    "device": device,
                    "visits": visits,
                    "oceanResources": oceanResources,
                }
            )
            print(
                mode,
                run + 1,
                round(ready),
                [
                    (
                        v["id"],
                        round(v["build"] - v["start"]),
                        round(v["frame"] - v["start"]),
                    )
                    for v in visits
                ],
                flush=True,
            )
            pathlib.Path(
                sys.argv[2] if len(sys.argv) > 2 else "tools/perf-baseline.json"
            ).write_text(json.dumps(results, indent=2), encoding="utf8")
        ctx.close()
    browser.close()
server.shutdown()
