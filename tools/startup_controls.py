"""Time Play becoming available and the first movement via keyboard after skipping the intro."""
import argparse
from functools import partial
import json
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server


OBSERVE = """() => {
  const times = window.startup = {pageOpen:0};
  const controls = new MutationObserver(() => {
    const play = document.getElementById('btn-play');
    if (play && !play.disabled && times.playReady === undefined) {
      times.playReady = performance.now();
      play.click();
      controls.disconnect();
      requestAnimationFrame(walk);
    }
  });
  let initial;
  function walk() {
    if (!MAY.started || !MAY.currentCtx) return requestAnimationFrame(walk);
    if (MAY.Cutscene.isPlaying() || MAY.dialogueOpen) {
      const button = document.getElementById(MAY.dialogueOpen ? 'dlg-next' : 'cs-skip');
      button.click();
    } else {
      const pos = MAY.player.pos;
      if (!initial) {
        initial = pos.clone();
        window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',code:'KeyW',bubbles:true}));
      } else if (Math.hypot(pos.x-initial.x,pos.z-initial.z)>0.04) {
        times.control = performance.now();
        window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',code:'KeyW',bubbles:true}));
        return;
      }
    }
    requestAnimationFrame(walk);
  }
  controls.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled']});
}"""


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("root", type=Path)
    p.add_argument("output", type=Path)
    args = p.parse_args()
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(args.root.resolve())))
    Thread(target=server.serve_forever, daemon=True).start()
    rows = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--enable-gpu", "--use-angle=d3d11"])
        for _ in range(5):
            context = browser.new_context(viewport={"width": 1180, "height": 760})
            page = context.new_page()
            page.add_init_script(f"({OBSERVE})()")
            page.goto(f"http://127.0.0.1:{server.server_port}/", wait_until="domcontentloaded")
            page.wait_for_function("window.startup && startup.control", timeout=120000)
            rows.append(page.evaluate("startup"))
            args.output.write_text(json.dumps(rows, indent=2), encoding="utf8")
            context.close()
        browser.close()
    server.shutdown()
    server.server_close()


if __name__ == "__main__":
    main()
