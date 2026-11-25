"""Known route from a fresh story save. Send DOM controls and observe game state."""
import argparse
from functools import partial
import json
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server


ROUTE = """async () => {
  let held = new Set(), waypoint = '', previous = performance.now(), category = 'active';
  const elapsed = {active: 0, dialogue: 0, cinematic: 0};
  let engineActive = 0;
  const routeCtx = MAY.currentCtx, priorUpdate = routeCtx.onUpdate;
  routeCtx.onUpdate = function(dt, t) {
    if (!MAY.dialogueOpen && !MAY.Cutscene.isPlaying()) engineActive += dt;
    if (priorUpdate) priorUpdate(dt, t);
  };
  const steps = [];
  const press = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup',
    {code, key: code.replace('Key','').toLowerCase(), bubbles: true}));
  const tap = code => { press(code,true); press(code,false); };
  function hold(keys) {
    for (const code of held) if (!keys.includes(code)) press(code,false);
    keys.forEach(code => {if (!held.has(code)) press(code,true)});
    held = new Set(keys);
  }
  const start = previous;
  while (performance.now() - start < 180000) {
    await new Promise(requestAnimationFrame);
    const now = performance.now(), ctx = MAY.currentCtx, st = ctx.story, pos = MAY.player.pos;
    elapsed[category] += now - previous;
    previous = now;
    if (ctx.save.gem) {
      hold([]);
      routeCtx.onUpdate = priorUpdate;
      return {steps, elapsed, engineActiveMs: engineActive * 1000, gem: ctx.save.gem,
              fishRescue: st.steps.fishRescue, fishRescueExit: st.steps.fishRescueExit,
              items: ctx.save.items.length, quiz: ctx.save.quizDone,
              sideQuest: ctx.save.sideQuest.done, challenges: Object.keys(ctx.save.challenges).filter(k => ctx.save.challenges[k])};
    }
    if (MAY.Cutscene.isPlaying() || MAY.dialogueOpen) {
      category = MAY.dialogueOpen ? 'dialogue' : 'cinematic';
      hold([]); tap('Escape'); continue;
    }
    category = 'active';
    let id, target;
    const pending = ctx.skillTargets.find(t => !t.done && t.isActive());
    if (!st.stage) { id = 'turtle'; target = {x:0,y:4,z:2}; }
    else if (pending) { id = pending.id; target = pending.pos; }
    else if (ctx.oceanRescueGoal) { id = st.steps.fishRescue === 2 ? 'escort_fish' : 'survey_wreck'; target = ctx.oceanRescueGoal; }
    else if (!st.bossDown) { id = 'reflect'; target = {x:-27,y:5,z:15}; }
    else { id = 'altar'; target = ctx.gemAltar.pos; }
    if (id !== waypoint) { steps.push({id, ms:Math.round(now-start)}); waypoint = id; }
    const dx = target.x-pos.x, dz = target.z-pos.z, dy = target.y-pos.y;
    const yaw = MAY.player.yaw, cos = Math.cos(yaw), sin = Math.sin(yaw);
    const f = -dx*sin-dz*cos, s = dx*cos-dz*sin;
    const range = id === 'altar' || id === 'turtle' ? 1.8 : id.startsWith('l1_current_') || id === 'escort_fish' || id === 'survey_wreck' ? 2.2 : 4;
    const keys = [];
    if (Math.hypot(dx,dz) > range) {
      keys.push('ShiftLeft');
      if (Math.abs(f) > Math.abs(s)*0.42) keys.push(f > 0 ? 'KeyW':'KeyS');
      if (Math.abs(s) > Math.abs(f)*0.42) keys.push(s > 0 ? 'KeyD':'KeyA');
    }
    if (Math.abs(dy)>0.7) keys.push(dy>0?'Space':'KeyC');
    hold(keys);
    if (id === 'turtle' && pos.distanceTo(target)<5) tap('KeyT');
    if (pending && pos.distanceTo(target)<pending.radius*0.82) tap('KeyR');
    if (id === 'reflect' && ctx.bossOrbs.some(o => !o.reflected && pos.distanceTo(o.mesh.position)<9)) tap('KeyR');
  }
  hold([]);
  routeCtx.onUpdate = priorUpdate;
  throw Error('Timed out at ' + waypoint + ': ' + JSON.stringify(MAY.player.pos));
}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(args.root.resolve())))
    Thread(target=server.serve_forever, daemon=True).start()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--enable-gpu", "--use-angle=d3d11"])
        page = browser.new_page(viewport={"width": 1180, "height": 760}, service_workers="block")
        page.set_default_timeout(90000)
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        page.locator("#btn-play").click()
        page.keyboard.press("Escape")
        page.locator("#btn-map").dispatch_event("click")
        page.evaluate("window.oceanRequest = performance.now()")
        page.locator("#map-grid .map-card").nth(1).dispatch_event("click")
        page.wait_for_function("MAY.currentCtx && MAY.currentLevelId === 'level1'")
        loading = page.evaluate("performance.now() - window.oceanRequest")
        result = page.evaluate(ROUTE)
        result["mapWaitMs"] = loading
        args.output.write_text(json.dumps(result, indent=2), encoding="utf8")
        print(result)
        browser.close()
    server.shutdown()
    server.server_close()


if __name__ == "__main__":
    main()
