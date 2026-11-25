"""Exercise service-worker interruption, resume and offline play on a disposable origin."""
from pathlib import Path
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server


class Interrupted(Handler):
    block_golem = True

    def do_GET(self):
        if self.block_golem and self.path.endswith("/boss_crystal_golem.glb"):
            self.send_error(503)
        else:
            super().do_GET()


def main():
    root = Path(__file__).resolve().parents[1]
    server = Server(("127.0.0.1", 0), partial(Interrupted, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--enable-gpu", "--use-angle=d3d11"])
        context = browser.new_context(viewport={"width": 1180, "height": 760})
        page = context.new_page()
        page.set_default_timeout(120000)
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        page.locator("#btn-play").click()
        assert page.evaluate("MAY.started && MAY.currentLevelId === 'hub' && !MAY.RIGGED.golem")
        page.wait_for_function("document.querySelector('#offline-retry').hidden === false")
        page.evaluate("MAY.save.voiceOn = false; MAY.persist()")
        context.set_offline(True)
        Interrupted.block_golem = False
        context.set_offline(False)
        page.wait_for_function("document.querySelector('#offline-status').textContent.includes('Sẵn sàng')")
        # Stopping the origin also takes the service worker's network path offline.
        server.shutdown()
        server.server_close()
        context.set_offline(True)
        page.reload(wait_until="domcontentloaded")
        audio_ok = page.evaluate("""async () => {
          const url = 'assets/voice/hub.mp3';
          const full = new Uint8Array(await (await fetch(url)).arrayBuffer());
          const size = full.length;
          for (const [range, start, end] of [['0-127',0,127],['-4',size-4,size-1],[size-6+'-',size-6,size-1]]) {
            const r = await fetch(url, {headers:{Range:'bytes='+range}});
            const bytes = new Uint8Array(await r.arrayBuffer());
            if (r.status !== 206 || r.headers.get('Content-Range') !== 'bytes '+start+'-'+end+'/'+size ||
                bytes.length !== end-start+1 || !bytes.every((value,i) => value === full[start+i])) return false;
          }
          const outside = await fetch(url, {headers:{Range:'bytes='+size+'-'}});
          return outside.status === 416 && outside.headers.get('Content-Range') === 'bytes */'+size;
        }""")
        assert audio_ok
        previews = page.evaluate("""async () => Promise.all(Object.values(MAY.OUTFITS).map(async outfit => {
          const image = new Image();
          image.src = outfit.img;
          await image.decode();
          return image.naturalWidth;
        }))""")
        assert len(previews) == 6 and min(previews) > 0
        page.locator("#btn-start-free").click()
        page.locator("#btn-play").click()
        assert not page.evaluate("MAY.save.voiceOn")
        for idx in range(1, 7):
            page.evaluate("MAY.Cutscene.cancelSilent(); MAY.closeDialogue(false)")
            page.locator("#btn-map").dispatch_event("click")
            page.locator("#map-grid .map-card").nth(idx).dispatch_event("click")
            page.wait_for_function("id => MAY.currentLevelId === id && MAY.currentCtx", arg=f"level{idx}")
            page.evaluate("() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))")
            assert page.evaluate("MAY.currentCtx.colliders.length > 0 && MAY.ErrorBoundary.history.length === 0")
        page.reload(wait_until="domcontentloaded")
        page.locator("#btn-play").click()
        assert page.evaluate("MAY.currentLevelId === 'level6' && !!MAY.RIGGED.stormking && !MAY.RIGGED.golem")
        print("PASS: partial download, reconnect, offline reload, six map entries, saved world first", flush=True)
        browser.close()


if __name__ == "__main__":
    main()
