"""Exercise dialogue input on Chrome desktop and emulated touch.

Playwright sends keyboard/pointer events; Audio and speechSynthesis are
instrumented mocks, with and without a Vietnamese voice. This is not a physical
device, OS voice, or acoustic overlap test. Run from the repository root.
"""

from pathlib import Path

from playwright.sync_api import sync_playwright

HTML = """
<div id="dialogue-box" class="hidden">
  <div id="dlg-avatar"></div><div id="dlg-name"></div><div id="dlg-role"></div>
  <div id="dlg-text"></div><div id="dlg-page"></div>
  <button id="dlg-next">next</button><button id="dlg-replay">replay</button>
</div>
"""

SETUP = """(hasVoice) => {
  window.events = [];
  window.active = 0;
  window.maximum = 0;
  window.allAudio = [];
  window.MAY = {voiceOn: true};
  window.Audio = class {
    constructor(url) {
      this.url = url;
      this.paused = true;
      allAudio.push(this);
    }
    play() {
      this.paused = false;
      active++;
      maximum = Math.max(maximum, active);
      events.push(['start', this.url]);
      return Promise.resolve();
    }
    pause() {
      if (!this.paused) {
        this.paused = true;
        active--;
        events.push(['stop', this.url]);
      }
    }
  };
  const synth = {
    getVoices: () => hasVoice ? [{lang: 'vi-VN', name: 'Vietnamese'}] : [],
    speak(u) {
      this.u = u;
      active++;
      maximum = Math.max(maximum, active);
      events.push(['synth-start', u.text]);
    },
    cancel() {
      if (this.u) {
        const u = this.u;
        this.u = null;
        active--;
        events.push(['synth-stop', u.text]);
        if (u.onend) u.onend();
      }
    }
  };
  Object.defineProperty(window, 'speechSynthesis', {value: synth, configurable: true});
  window.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; }
  };
}"""


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            channel="chrome", headless=True, args=["--disable-gpu"]
        )
        for mobile in (False, True):
            for voice in (False, True):
                page = browser.new_page(
                    viewport={"width": 390, "height": 844}
                    if mobile
                    else {"width": 1000, "height": 700},
                    has_touch=mobile,
                    is_mobile=mobile,
                )
                page.set_content(HTML)
                page.evaluate(SETUP, voice)
                for path in ("three.min.js", "js/audio.js", "js/story.js"):
                    page.add_script_tag(path=str(Path.cwd() / path))
                page.evaluate("""() => {
                  MAY.sndDialogue = () => {};
                  MAY.player = {clearKeys() {}};
                  MAY.playVoice('level1');
                  MAY.playVoice('item');
                }""")
                assert page.evaluate("events.filter(x => x[0] === 'start').length") == 1
                page.evaluate("""() => MAY.openDialogue({
                  pages: ['first page', 'second page', 'third page'],
                  voiceClips: ['npc_ch1', null, 'npc_ch2']
                })""")
                assert page.locator("#dlg-text").inner_text() == "first page"
                # A stale completion must not clear the current page voice.
                page.evaluate("allAudio[0].onended()")
                assert page.evaluate("MAY.isSpeechActive()")
                if mobile:
                    page.locator("#dlg-next").tap()
                else:
                    page.locator("#dlg-next").focus()
                    page.keyboard.press("Enter")
                assert page.locator("#dlg-text").inner_text() == "second page"
                page.wait_for_timeout(100)
                assert page.evaluate("!allAudio.some(a => !a.paused)")
                assert page.locator("#dlg-replay").is_hidden() == (not voice)
                if voice:
                    page.locator("#dlg-replay").focus()
                    page.keyboard.press("Enter")
                    page.wait_for_timeout(100)
                    assert page.locator("#dlg-text").inner_text() == "second page"
                page.evaluate("MAY.setMasterMute(true)")
                assert page.locator("#dlg-replay").is_hidden()
                assert not page.evaluate("MAY.isSpeechActive()")
                page.evaluate("MAY.setMasterMute(false)")
                assert page.locator("#dlg-replay").is_hidden() == (not voice)
                page.evaluate("""() => {
                  MAY.closeDialogue(false);
                  window.doneCount = 0;
                  MAY.openDialogue({pages: ['a', 'b', 'c'], onDone() { doneCount++; }});
                }""")
                page.locator("#dlg-next").dblclick()
                assert page.locator("#dlg-text").inner_text() == "b"
                page.wait_for_timeout(300)
                page.locator("#dlg-next").click()
                assert page.locator("#dlg-text").inner_text() == "c"
                page.wait_for_timeout(300)
                page.keyboard.down("Enter")
                page.keyboard.down("Enter")
                page.keyboard.up("Enter")
                assert page.evaluate("doneCount") == 1
                assert not page.evaluate("MAY.isSpeechActive()")
                assert page.evaluate("maximum") <= 1
                print(
                    "mobile",
                    mobile,
                    "voice",
                    voice,
                    "max",
                    page.evaluate("maximum"),
                    "events",
                    page.evaluate("events"),
                    flush=True,
                )
                page.close()
        browser.close()


if __name__ == "__main__":
    main()
