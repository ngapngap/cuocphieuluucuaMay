"""Exercise boss intro, skip, cancellation and reload in Chrome."""

import functools
import http.server
import json
import pathlib
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/"
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome",
        headless=True,
        args=["--enable-gpu", "--use-angle=d3d11", "--mute-audio"],
    )
    for fallback in (False, True):
        ctx = browser.new_context(
            service_workers="block", viewport={"width": 1180, "height": 760}
        )
        page = ctx.new_page()
        if fallback:
            page.route("**/assets/models/boss_*.glb", lambda route: route.abort())
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_function(
            "window.__ready && !document.querySelector('#btn-play').disabled",
            timeout=120000,
        )
        page.click("#btn-start-free")
        page.evaluate(
            "MAY.applyQuality('low'); MAY.save.quality='low'; MAY.save.voiceOn=false; MAY.persist()"
        )
        page.click("#btn-play")
        page.evaluate("MAY.Cutscene.skip()")
        for level in ("level2", "level4", "level6"):
            page.evaluate("id => MAY.enterLevel(id, true)", level)
            page.wait_for_function(
                "id => MAY.currentLevelId===id && MAY.currentCtx && MAY.currentCtx.boss",
                arg=level,
                timeout=120000,
            )
            page.evaluate("""() => {
              const b=MAY.currentCtx.boss; window.introCalls=[]; window.introDone=0;
              if(b.mesh.userData.playClip){const f=b.mesh.userData.playClip; b.mesh.userData.playClip=function(n,l){introCalls.push(n);return f(n,l)}}
              b.activate(()=>introDone++);
            }""")
            assert page.evaluate(
                "MAY.Cutscene.isPlaying() && MAY.currentCtx.boss.introPlaying"
            )
            if not fallback:
                assert page.evaluate("introCalls.filter(x=>x==='intro').length") == 1
            page.wait_for_function("!MAY.Cutscene.isPlaying()", timeout=30000)
            normal = page.evaluate(
                "({done:introDone,playing:MAY.currentCtx.boss.introPlaying,calls:introCalls})"
            )
            assert normal["done"] == 1 and not normal["playing"]
            page.evaluate(
                """() => { const b=MAY.currentCtx.boss; b.active=false; b.activate(()=>introDone++); MAY.Cutscene.skip(); }"""
            )
            skipped = page.evaluate(
                "({done:introDone,playing:MAY.currentCtx.boss.introPlaying,calls:introCalls})"
            )
            assert skipped["done"] == 2 and not skipped["playing"]
            if not fallback:
                assert skipped["calls"][-1] == "idle"
            page.evaluate(
                """() => { const b=MAY.currentCtx.boss; b.active=false; b.activate(()=>introDone++); MAY.Cutscene.cancelSilent(); }"""
            )
            page.wait_for_function("!MAY.currentCtx.boss.introPlaying", timeout=30000)
            assert page.evaluate("introDone") == 2
            page.evaluate(
                """() => { MAY.currentCtx.story.stage=3; MAY.currentCtx.story.bossDown=false; MAY.persist(); }"""
            )
            page.reload(wait_until="domcontentloaded")
            page.wait_for_function(
                "window.__ready && !document.querySelector('#btn-play').disabled",
                timeout=120000,
            )
            restored = page.evaluate(
                "({active:MAY.currentCtx.boss.active, intro:!!MAY.currentCtx.boss.introPlaying, cutscene:MAY.Cutscene.isPlaying()})"
            )
            assert restored == {"active": True, "intro": False, "cutscene": False}, (
                restored
            )
            results.append(
                {
                    "fallback": fallback,
                    "level": level,
                    "normal": normal,
                    "skip": skipped,
                    "reload": restored,
                }
            )
            (ROOT / "tools" / "boss-intro-results.json").write_text(
                json.dumps(results, ensure_ascii=False, indent=2), encoding="utf8"
            )
            print(level, "fallback" if fallback else "GLB", "passed", flush=True)
            page.click("#btn-play")
            page.evaluate("MAY.Cutscene.skip()")
        ctx.close()
    browser.close()
server.shutdown()
print(json.dumps(results, ensure_ascii=False, indent=2))
