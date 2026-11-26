"""Exercise recovery, competing tabs, storage failure and reset in a disposable browser profile."""
from functools import partial
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server


def main():
    root = Path(__file__).resolve().parents[1]
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", args=["--mute-audio"])
            context = browser.new_context(service_workers="block")
            page = context.new_page()
            page.goto(url)
            play = page.locator("#btn-play")
            play.click()
            page.keyboard.press("Escape")
            for broken in ("{", '{"version":10,"levels":[]}'):
                page.evaluate("""() => {
                  MAY.save.gems = [1,2]; MAY.persist();
                  MAY.save.quality = MAY.save.quality === 'high' ? 'mid' : 'high'; MAY.persist();
                }""")
                page.evaluate("value => localStorage.setItem(MAY.SAVE_KEY,value)", broken)
                page.reload()
                play.click()
                page.keyboard.press("Escape")
                assert page.evaluate("MAY.save.gems.join() === '1,2' && MAY.saveStatus === 'recovered'")
                page.keyboard.press("j")
                assert page.locator("[data-save-notice]").is_visible()
                page.locator("#album-close").click()

            second = context.new_page()
            second.goto(url)
            second.locator("#btn-play").click()
            assert second.evaluate("MAY.save.gems.push(3); MAY.persist()")
            assert not page.evaluate("MAY.save.voiceOn = false; MAY.persist()")
            assert page.evaluate("MAY.saveStatus === 'changed' && JSON.parse(localStorage[MAY.SAVE_KEY]).gems.length === 3")
            locked = context.new_page()
            locked.add_init_script("""
              const read = Storage.prototype.getItem;
              Storage.prototype.getItem = function () { throw new DOMException('storage locked','SecurityError') };
              window.unlockStorage = () => { Storage.prototype.getItem = read };
            """)
            locked.goto(url)
            locked.locator("#btn-play").click()
            assert locked.evaluate("MAY.saveStatus === 'unavailable'")
            assert locked.evaluate("""() => {
              unlockStorage();
              return !MAY.persist() && MAY.saveStatus === 'changed' && JSON.parse(localStorage[MAY.SAVE_KEY]).gems.length === 3;
            }""")
            locked.close()
            page.reload()
            play.click()
            assert page.evaluate("MAY.save.gems.length === 3")
            assert page.evaluate("""() => {
              const original = Storage.prototype.setItem;
              try {
                Storage.prototype.setItem = () => {throw new DOMException('quota','QuotaExceededError')};
                return !MAY.resetSave() && MAY.saveStatus === 'unavailable' && MAY.save.gems.length === 3;
              } finally { Storage.prototype.setItem = original; }
            }""")
            page.keyboard.press("Escape")
            page.on("dialog", lambda dialog: dialog.accept())
            page.locator("#btn-restart").click()
            play.click()
            assert page.evaluate("""() => [MAY.SAVE_KEY, MAY.SAVE_KEY+'-backup'].every(key =>
                JSON.parse(localStorage[key]).gems.length === 0)""")
            page.evaluate("""() => {
                localStorage.setItem(MAY.SAVE_KEY, '{');
                localStorage.setItem(MAY.SAVE_KEY + '-backup', 'invalid');
            }""")
            page.reload()
            play.click()
            assert page.evaluate("MAY.saveStatus === 'damaged' && MAY.save.gems.length === 0")
            browser.close()
            print("PASS: save recovery, failed recovery notice, stale tab, locked storage, quota failure, clean reset")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
