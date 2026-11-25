"""Exercise every optional biome station in Chrome, including a reload.

Run from the repository root: python tools/check_biome_bonus.py
The browser profile is temporary; a prepared six-gem save is used as a fixture.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    root = Path(__file__).resolve().parent.parent
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    orders = [[0, 1], [2, 1, 0], [1, 0, 2], [2, 1, 0], [2, 0, 1], [0, 2, 1]]
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="chrome", headless=True)
            page = browser.new_page(viewport={"width": 1180, "height": 760}, service_workers="block")
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/")
            page.wait_for_function("window.__ready", timeout=90000)
            page.evaluate("""() => {
              MAY.save.gems = [1, 2, 3, 4, 5, 6];
              for (let n = 1; n <= 6; n++) {
                const save = MAY.getLevelSave('level' + n);
                save.gem = true; save.story.bossDown = true; save.story.rewarded = true;
              }
              MAY.persist(); MAY.started = true;
              document.getElementById('ov-start').classList.add('hidden');
            }""")
            for number, order in enumerate(orders, 1):
                level = f"level{number}"
                assert page.evaluate("id => MAY.visitReplay(id, 'clue')", level)
                page.wait_for_function("id => MAY.currentLevelId === id && MAY.currentCtx.biomeClueActive", arg=level, timeout=90000)
                before = page.evaluate("JSON.stringify(MAY.currentCtx.save.story)")
                panel = page.locator("aside[aria-label]")
                panel.locator("button").nth((order[0] + 1) % 3).click()
                assert "Chưa khớp" in panel.locator("p").inner_text()
                for choice in order:
                    if number % 2:
                        panel.locator("button").nth(choice).click()
                    else:
                        page.keyboard.press(str(choice + 1))
                assert panel.count() == 0
                assert page.evaluate("MAY.currentCtx.save.challenges.biomeClue") == {
                    "wins": 1, "perfects": 0, "attempts": 1
                }
                assert page.evaluate("JSON.stringify(MAY.currentCtx.save.story)") == before
                print(f"{level}: wrong answer, correction and story isolation OK", flush=True)
            page.reload()
            page.wait_for_function("window.__ready", timeout=90000)
            records = page.evaluate("Array.from({length: 6}, (_, i) => MAY.getLevelSave('level' + (i + 1)).challenges.biomeClue)")
            assert all(record == {"wins": 1, "perfects": 0, "attempts": 1} for record in records)
            assert not errors, errors
            print("Reload: all six records restored; no page errors.")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
