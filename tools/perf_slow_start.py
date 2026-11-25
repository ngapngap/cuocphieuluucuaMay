import functools
import http.server
import json
import pathlib
import sys
import threading
import time

from playwright.sync_api import sync_playwright

root = pathlib.Path(sys.argv[1]).resolve()


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
    results = []
    for i in range(5):
        ctx = browser.new_context(
            service_workers="block", viewport={"width": 1180, "height": 760}
        )
        page = ctx.new_page()
        cdp = ctx.new_cdp_session(page)
        cdp.send("Network.enable")
        cdp.send(
            "Network.emulateNetworkConditions",
            {
                "offline": False,
                "latency": 150,
                "downloadThroughput": 200000,
                "uploadThroughput": 93750,
                "connectionType": "cellular3g",
            },
        )
        start = time.monotonic()
        page.goto(
            "http://127.0.0.1:%s/" % server.server_port,
            wait_until="domcontentloaded",
            timeout=180000,
        )
        page.wait_for_function(
            "!document.querySelector('#btn-play').disabled && window.__ready",
            timeout=300000,
        )
        elapsed = (time.monotonic() - start) * 1000
        result = {
            "run": i + 1,
            "readyMs": elapsed,
            "resources": page.evaluate(
                "performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize,encoded:e.encodedBodySize}))"
            ),
        }
        results.append(result)
        pathlib.Path(sys.argv[2]).write_text(
            json.dumps(results, indent=2), encoding="utf8"
        )
        print(i + 1, round(elapsed), flush=True)
        ctx.close()
    browser.close()
server.shutdown()
