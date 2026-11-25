"""Play the ocean race from the journal, reload, and race the recorded star."""
from functools import partial
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server


DRIVE = """async () => {
  const race = MAY.currentCtx.raceCh, keys = new Set();
  const stopAt = performance.now() + 120000;
  function steer(wanted) {
    for (const key of ['KeyW','KeyS','KeyA','KeyD','Space','KeyC','ShiftLeft']) {
      if (wanted.includes(key) === keys.has(key)) continue;
      window.dispatchEvent(new KeyboardEvent(wanted.includes(key) ? 'keydown' : 'keyup', {code:key,bubbles:true}));
      if (wanted.includes(key)) keys.add(key); else keys.delete(key);
    }
  }
  while (race.active && performance.now() < stopAt) {
    const target = race.rings[race.idx].position, p = MAY.player.pos, yaw = MAY.player.yaw;
    const dx=target.x-p.x, dz=target.z-p.z, dy=target.y-p.y;
    const f=-dx*Math.sin(yaw)-dz*Math.cos(yaw), s=dx*Math.cos(yaw)-dz*Math.sin(yaw);
    const wanted=['ShiftLeft'];
    if (Math.abs(f)>0.5) wanted.push(f>0?'KeyW':'KeyS');
    if (Math.abs(s)>0.5) wanted.push(s>0?'KeyD':'KeyA');
    if (Math.abs(dy)>0.5) wanted.push(dy>0?'Space':'KeyC');
    steer(wanted);
    await new Promise(requestAnimationFrame);
  }
  steer([]);
  return MAY.currentCtx.save.raceRecord;
}"""


def main():
    root = Path(__file__).resolve().parents[1]
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", args=["--enable-gpu", "--use-angle=d3d11"])
            page = browser.new_page(viewport={"width": 720, "height": 540}, service_workers="block")
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.set_default_timeout(90000)
            page.goto(f"http://127.0.0.1:{server.server_port}/")
            page.locator("#btn-play").click()
            page.keyboard.press("Escape")
            # A finished v10 chapter from before race records were introduced.
            page.evaluate("""() => {
              MAY.save.gems=[1]; MAY.save.levels.level1.gem=true;
              MAY.save.levels.level1.story={stage:5, steps:{}, rewarded:true, bossDown:true};
              MAY.save.levels.level1.introSeen=true;
              delete MAY.save.levels.level1.raceRecord;
              MAY.save.quality='low'; MAY.persist(); MAY.applyQuality('low');
            }""")
            previous = None
            for run in (1, 2):
                if run == 2:
                    page.reload()
                    page.locator("#btn-play").click()
                    page.keyboard.press("Escape")
                    assert page.evaluate("MAY.currentCtx.save.raceRecord") == previous
                page.keyboard.press("j")
                choice = page.locator("#replay-list button").filter(has_text="Vịnh San Hô")
                if run == 2:
                    assert "Kỷ lục" in choice.inner_text()
                choice.click()
                page.wait_for_function("MAY.currentCtx?.raceCh?.active")
                page.keyboard.press("j")
                paused = page.evaluate("MAY.currentCtx.raceCh.t")
                page.wait_for_timeout(250)
                assert page.evaluate("MAY.currentCtx.raceCh.t") == paused
                page.locator("#album-close").click()
                record = page.evaluate(DRIVE)
                assert record and record["wins"] == run and len(record["splits"]) == 3
                assert len(record["path"]) >= 2 and record["path"][-1][0] == record["best"]
                if previous:
                    assert record["best"] <= previous["best"]
                print(f"Race {run}: best {record['best']} s, {len(record['path'])} positions", flush=True)
                previous = record
            assert page.evaluate("MAY.save.gems.length === 1 && MAY.badgeCount(MAY.currentCtx.save) === 1")
            page.keyboard.press("j")
            page.locator("#replay-list button").filter(has_text="Cứu đàn cá cùng Bubi").click()
            page.wait_for_function("MAY.currentCtx.fishRescueActive")
            assert page.evaluate("""() => {
                const bubi=MAY.currentCtx.friends.find(f=>f.isCompanion && f.name.includes('Bubi'));
                return bubi.group.visible && bubi.following && bubi.group.position.distanceTo(MAY.player.pos)<6;
            }""")
            # A rescue can cross a race start without launching two activities at once.
            assert page.evaluate("""() => {
                const ctx=MAY.currentCtx, race=ctx.raceCh;
                MAY.player.pos.copy(race.startRing.position);
                race.update(0.016, 1);
                return ctx.fishRescueActive && !race.active;
            }""")
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
