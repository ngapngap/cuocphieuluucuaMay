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
    p.add_argument("--compare", type=Path, help="Also serve a baseline and alternate the order in each pair")
    p.add_argument("--slow", action="store_true", help="Use 150 ms latency and 1.6 Mbit/s down, service workers blocked")
    args = p.parse_args()
    roots = {"baseline": args.compare, "candidate": args.root} if args.compare else {"candidate": args.root}
    servers = {}
    for name, folder in roots.items():
        server = Server(("127.0.0.1", 0), partial(Handler, directory=str(folder.resolve())))
        Thread(target=server.serve_forever, daemon=True).start()
        servers[name] = server
    rows = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--enable-gpu", "--use-angle=d3d11"])
        for i in range(5):
            for name in (list(servers) if i % 2 == 0 else reversed(servers)):
                context = browser.new_context(viewport={"width": 1180, "height": 760},
                                              service_workers="block" if args.slow else "allow")
                page = context.new_page()
                if args.slow:
                    cdp = context.new_cdp_session(page)
                    cdp.send("Network.enable")
                    cdp.send("Network.emulateNetworkConditions", dict(
                        offline=False, latency=150, downloadThroughput=200000, uploadThroughput=93750,
                        connectionType="cellular3g"))
                page.add_init_script(f"({OBSERVE})()")
                page.goto(f"http://127.0.0.1:{servers[name].server_port}/", wait_until="domcontentloaded", timeout=180000)
                page.wait_for_function("window.startup && startup.control", timeout=180000)
                row = page.evaluate("startup")
                if args.compare or args.slow:
                    row.update(build=name, run=i + 1, resources=page.evaluate("""performance.getEntriesByType('resource')
                        .filter(e=>e.responseEnd<=startup.control).map(e=>[new URL(e.name).pathname,e.encodedBodySize])"""))
                rows.append(row)
                args.output.write_text(json.dumps(rows, indent=2), encoding="utf8")
                print(name, i + 1, round(row["control"]), flush=True)
                context.close()
        browser.close()
    for server in servers.values():
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
