"""Drive six gems normally, or simulate journey frames for a faster functional regression."""

import argparse
from functools import partial
import json
from pathlib import Path
from threading import Thread
import time
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
NATIVE = ["route_ocean_forest.js", "route_desert_crystal.js", "route_snow_clouds.js"]


def verify_duration(chapters):
    """Require both the six saved gem times and observed activity to reach 10×."""
    records = list(chapters.values())
    if len(records) != 6 or any(r["journeyFramesSimulated"] for r in records):
        raise ValueError("Duration requires all six chapters played at normal speed.")
    clocks = sum(r["clock"] for r in records)
    active = sum(
        r["activity"]["journey"] + r["activity"]["nativeActive"] for r in records
    )
    print(
        f"Saved gem clocks: {clocks}s; independently sampled activity: {active:.2f}s."
    )
    if min(clocks, active) < 2200:
        raise AssertionError("The fresh campaign fell short of 2,200 active seconds.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--resume", type=Path, help="Resume a storage snapshot produced by this test"
    )
    parser.add_argument(
        "--accelerated",
        action="store_true",
        help="Simulate journey frames only; times are not real-time measurements",
    )
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            channel="chrome", args=["--enable-gpu", "--use-angle=d3d11", "--mute-audio"]
        )
        options = {}
        if args.resume:
            snapshot = json.loads(args.resume.read_text(encoding="utf8"))
            snapshot["origins"][0]["origin"] = origin
            options["storage_state"] = snapshot
        context = browser.new_context(
            viewport={"width": 1120, "height": 720}, service_workers="block", **options
        )
        page = context.new_page()
        page.set_default_timeout(90000)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(origin)
        page.locator("#btn-play").click()
        page.keyboard.press("Escape")
        for name in NATIVE:
            page.evaluate(
                "() => {\n" + (TOOLS / name).read_text(encoding="utf8") + "\n}"
            )
        page.evaluate((TOOLS / "drive_long_story.js").read_text(encoding="utf8"))
        page.evaluate("""() => {
          // Sample the game's own clock, never wall time; a native frame counts
          // as active only if the avatar moves or a game state actually changes.
          const totals={}, previous={};
          window.campaignActivity=totals;
          function sample(){
            const c=MAY.currentCtx;
            if(c && c.meta && c.meta.num>0 && c.meta.num<=6){
              const n=c.meta.num, p=MAY.player.pos, inside=!!MAY.activeJourney;
              const valid=!document.hidden && !MAY.dialogueOpen && !MAY.modalOpen && !(MAY.Cutscene&&MAY.Cutscene.isPlaying());
              const sig=JSON.stringify([c.story,c.boss?.hp,c.boss?.state,c.boss?.subState,
                c.skillTargets?.map(t=>[t.id,t.done]),c.save.gem]);
              const old=previous[n], now={clock:c.playSecs,x:p.x,y:p.y,z:p.z,yaw:MAY.player.yaw,sig,inside,ctx:c};
              const out=totals[n]||(totals[n]={journey:0,nativeActive:0,nativeStationary:0});
              if(!out.finished && old && old.ctx===c && c.playSecs>=old.clock){
                const delta=c.playSecs-old.clock;
                if(inside && old.inside)out.journey+=delta;
                else if(!inside && !old.inside && valid){
                  const moved=Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z)>0.001 || Math.abs(MAY.player.yaw-old.yaw)>0.001;
                  if(moved || sig!==old.sig)out.nativeActive+=delta;
                  else out.nativeStationary+=delta;
                }
              }
              if(c.save.gem)out.finished=true;
              previous[n]=now;
            }
            requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        }""")
        if args.accelerated:
            page.evaluate("""() => {
              const renderer=MAY.renderer, original=renderer.render.bind(renderer);
              renderer.render=function(scene,camera){if(!MAY.activeJourney)original(scene,camera);};
              window.acceleratedJourneySeconds=0;
              let t=performance.now()/1000;
              function pump(){
                try {
                  for(let i=0;i<20 && MAY.activeJourney && !storyDriver.failure;i++){
                    storyDriver.step();
                    if(!MAY.activeJourney)break;
                    t+=0.05;window.acceleratedJourneySeconds+=0.05;
                    MAY.activeJourney.frame(0.05,t);
                  }
                } catch(e){storyDriver.failure=String(e.stack||e);}
                requestAnimationFrame(pump);
              }
              requestAnimationFrame(pump);
            }""")
            print(
                "ACCELERATED FUNCTIONAL REGRESSION: journey time is simulated; native world is real time.",
                flush=True,
            )
        before = page.evaluate("MAY.save.gems.slice()")
        print("Start with gems", before, flush=True)
        summary = {}
        for number in range(1, 7):
            if number in before:
                continue
            current = page.evaluate("MAY.currentLevelId")
            if current != f"level{number}":
                page.keyboard.press("Escape")
                page.locator("#btn-map").dispatch_event("click")
                page.locator("#map-grid .map-card").nth(number).dispatch_event("click")
                page.wait_for_function(
                    "id=>MAY.currentCtx && MAY.currentLevelId===id",
                    arg=f"level{number}",
                )
            page.evaluate("n=>storyDriver.chapter=n", number)
            started = time.monotonic()
            prev = None
            while True:
                page.wait_for_timeout(3000)
                result = page.evaluate(
                    """number => {
                  const c=MAY.currentCtx, ls=MAY.getLevelSave('level'+number), s=ls.story.steps.journey, j=c.chapterJourney, p=MAY.player.pos;
                  return {chapter:c.id,stage:ls.story.stage,seconds:c.playSecs,gem:ls.gem,best:ls.bestTime,
                    ready:!!j?.available,inside:!!MAY.activeJourney,section:s?.section,event:s?.event,distance:Math.round(s?.distance||0),
                    objective:c.storyObjective?.text,cue:document.querySelector('#journey-cue').textContent,
                    status:document.querySelector('#journey-status').textContent,position:p.toArray().map(Math.round),
                    driverError:storyDriver.failure,gameErrors:MAY.ErrorBoundary.history};
                }""",
                    number,
                )
                key = (
                    result["stage"],
                    result.get("section"),
                    result.get("event"),
                    result["objective"],
                )
                if key != prev or result["gem"]:
                    print(json.dumps(result, ensure_ascii=False), flush=True)
                    prev = key
                (args.output / "current.json").write_text(
                    json.dumps(result, ensure_ascii=False, indent=2), encoding="utf8"
                )
                context.storage_state(path=args.output / "checkpoint.json")
                if errors or result["driverError"] or result["gameErrors"]:
                    raise RuntimeError((result, errors))
                if result["gem"]:
                    assert page.evaluate(
                        "n=>{const s=MAY.getLevelSave('level'+n).story;return s.steps.journey.done && s.bossDown}",
                        number,
                    )
                    activity = page.evaluate("n=>campaignActivity[n] || null", number)
                    summary[number] = {
                        "clock": result["best"],
                        "wallWithDialogue": round(time.monotonic() - started, 2),
                        "activity": activity,
                        "journeyFramesSimulated": args.accelerated,
                    }
                    (args.output / "times.json").write_text(
                        json.dumps(summary, indent=2), encoding="utf8"
                    )
                    break
                if time.monotonic() - started > (360 if args.accelerated else 1100):
                    raise RuntimeError(result)
            page.evaluate("storyDriver.chapter=0")
            if number < 6:
                page.wait_for_timeout(2000)
                page.keyboard.press("Escape")
        assert page.evaluate("MAY.save.gems.length === 6")
        final = page.evaluate(
            "MAY.LEVEL_META.slice(1).map(m => MAY.getLevelSave(m.id).bestTime)"
        )
        if 6 not in before:
            page.wait_for_function(
                "MAY.save.finaleSeen && !document.getElementById('ov-finale').classList.contains('hidden')",
                timeout=90000,
            )
            print("Grand finale opened after the sixth gem.", flush=True)
            page.locator("#btn-finale-hub").click()
            page.wait_for_function("MAY.currentLevelId === 'hub'", timeout=90000)
            if errors or page.evaluate("MAY.ErrorBoundary.history.length"):
                raise RuntimeError(
                    (
                        "Finale or hub error",
                        errors,
                        page.evaluate("MAY.ErrorBoundary.history"),
                    )
                )
            print("Returned to the hub from the finale.", flush=True)
        print(
            "SIX GEMS:",
            final,
            "total",
            sum(final),
            "(simulated journey clock)" if args.accelerated else "",
            flush=True,
        )
        report = (
            {"gameClocks": final, "journeyFramesSimulated": True}
            if args.accelerated
            else final
        )
        (args.output / "six-gems.json").write_text(json.dumps(report), encoding="utf8")
        if not args.accelerated and not args.resume:
            verify_duration(summary)
        browser.close()
    server.shutdown()
    server.server_close()


if __name__ == "__main__":
    main()
