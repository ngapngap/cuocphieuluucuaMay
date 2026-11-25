"""Exercise crystal note animation across a level transition and offline reload."""

import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Quiet, directory=str(root))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="chrome", headless=True, args=["--enable-gpu", "--use-angle=d3d11"]
    )
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    page.goto(
        "http://127.0.0.1:%s/" % server.server_port, wait_until="domcontentloaded"
    )
    page.wait_for_function(
        "window.__ready && !document.querySelector('#btn-play').disabled",
        timeout=180000,
    )
    page.wait_for_function(
        "document.querySelector('#offline-status').textContent.includes('Sẵn sàng')",
        timeout=180000,
    )
    page.evaluate(
        """() => {MAY.save.freeExplore=true;MAY.save.voiceOn=false;MAY.LEVEL_META.forEach(m=>MAY.getLevelSave(m.id).introSeen=true);let s=MAY.getLevelSave('level4').story;s.stage=2;s.steps={torch0:true,torch1:true,wallBroken:true};MAY.persist()}"""
    )
    page.click("#btn-play")
    page.evaluate("() => MAY.enterLevel('level4',true)")
    page.wait_for_function(
        "MAY.currentLevelId==='level4' && MAY.currentCtx", timeout=120000
    )

    def check():
        return page.evaluate(
            """() => {let c=MAY.currentCtx, nodes=[];MAY.worldRoot.traverse(x=>{if(x.userData.noteTop)nodes.push(x)});let ts=c.skillTargets.filter(x=>x.id.startsWith('l4_echo_'));ts[0].onHit();return {count:nodes.length,active:ts.map(x=>x.isActive()),pulse:nodes[0].userData.noteTime,unique:nodes.map(x=>x.userData.noteTop.geometry.type),progress:c.story.steps.echoProgress}}"""
        )

    def verify(label):
        page.wait_for_timeout(
            3200
        )  # Let the automatic lesson finish before checking one isolated strike.
        result = check()
        assert result["count"] == 3 and result["active"] == [True, True, True]
        assert result["pulse"] > 0 and len(set(result["unique"])) == 3
        page.wait_for_timeout(1100)
        assert page.evaluate(
            """() => {let n;MAY.worldRoot.traverse(x=>{if(x.userData.noteTop&&!n)n=x});return n.userData.noteTime===0 && Math.abs(n.userData.noteTop.material.emissiveIntensity-0.3)<0.01}"""
        )
        print(label, result, "returned to idle", flush=True)

    verify("online")
    page.evaluate("() => MAY.enterLevel('hub',true)")
    page.evaluate("() => MAY.enterLevel('level4',true)")
    verify("revisited")
    context.set_offline(True)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function(
        "window.__ready && !document.querySelector('#btn-play').disabled",
        timeout=180000,
    )
    page.click("#btn-play")
    page.wait_for_function(
        "MAY.currentLevelId==='level4' && MAY.currentCtx", timeout=120000
    )
    verify("offline")
    browser.close()
server.shutdown()
