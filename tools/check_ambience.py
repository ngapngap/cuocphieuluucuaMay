"""Sample the Web Audio mix for sixty seconds in each playable guide chapter."""
import json
from functools import partial
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server


METER = """() => {
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode && this instanceof DynamicsCompressorNode) {
      const meter = this.context.createAnalyser();
      connect.call(this, meter);
      window.mixMeter = meter;
    }
    return connect.call(this, dest, ...rest);
  };
}"""

SAMPLE = """async () => {
  const meter = window.mixMeter, samples = new Float32Array(meter.fftSize);
  const begin = meter.context.currentTime, peaks = [];
  while (meter.context.currentTime - begin < 60) {
    await new Promise(next => setTimeout(next, 500));
    meter.getFloatTimeDomainData(samples);
    peaks.push(samples.reduce((largest, n) => Math.max(largest, Math.abs(n)), 0));
  }
  return {seconds: meter.context.currentTime - begin, windows: peaks.length,
    silentWindows: peaks.filter(p => p < .00001).length, peak: Math.max(...peaks)};
}"""


def main():
    root = Path(__file__).resolve().parents[1]
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required"])
            context = browser.new_context(service_workers="block")
            context.add_init_script("(" + METER + ")()")
            page = context.new_page()
            page.set_default_timeout(120000)
            page.goto(f"http://127.0.0.1:{server.server_port}/")
            samples = page.evaluate("""async () => {
              const ac = new OfflineAudioContext(2, 160000, 16000);
              let compared = 0;
              for (const id of ['hub','level1','level2','level3','level4','level5','level6']) {
                const pair = await Promise.all(['wav','flac'].map(async ext =>
                  ac.decodeAudioData(await (await fetch('assets/audio/amb_' + id + '.' + ext)).arrayBuffer())));
                const [a,b] = pair;
                if (a.numberOfChannels !== b.numberOfChannels || a.length !== b.length) throw Error(id);
                for (let channel = 0; channel < a.numberOfChannels; channel++) {
                  const x = a.getChannelData(channel), y = b.getChannelData(channel);
                  if (!x.every((sample, i) => sample === y[i])) throw Error(id + ' sample mismatch');
                  compared += x.length;
                }
              }
              return compared;
            }""")
            assert samples == 2240000, samples
            page.locator("#btn-start-free").click()
            page.locator("#btn-play").click()
            for level in ("level1", "level4"):
                page.evaluate("id => MAY.enterLevel(id, true)", level)
                page.evaluate("MAY.Cutscene.cancelSilent(); MAY.closeDialogue(false)")
                page.wait_for_function("MAY.ambienceSourceMode === MAY.ambienceFormat + '-buffer' && window.mixMeter && mixMeter.context.state === 'running'")
                result = page.evaluate(SAMPLE)
                print(level, json.dumps(result), flush=True)
                assert result["peak"] > .001 and result["silentWindows"] == 0, result
            # Force the live chapter's decoder to reject a FLAC response.
            page.route("**/amb_level3.flac", lambda route: route.fulfill(body=b"broken audio"))
            page.evaluate("MAY.enterLevel('level3', true)")
            page.wait_for_function("MAY.ambienceSourceMode === 'wav-buffer'")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
