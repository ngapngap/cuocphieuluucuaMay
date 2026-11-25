"""Check pre-journey boss/gem saves by entering chapters through the map at phone size."""

import argparse
from functools import partial
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server

ROOT = Path(__file__).resolve().parents[1]
STEPS = [
    dict(
        bubiFree=True,
        bubiRouteVersion=1,
        bubiRouteStarted=True,
        bubiRoute=2,
        fishRescueVersion=1,
        fishRescue=3,
        ink0=True,
        ink1=True,
        ink2=True,
        fishRescueExit=0,
        fishRescueChosen=True,
    ),
    dict(
        mudClear=True,
        tree0=True,
        tree1=True,
        tree2=True,
        rootTrialStarted=True,
        rootTrialWet=True,
        rootTrialDone=True,
    ),
    dict(
        oasisRevived=True,
        mirrorAim0=1,
        mirrorAim1=3,
        mirrorAim2=6,
        mir0=True,
        mir1=True,
        mir2=True,
    ),
    dict(
        torch0=True,
        torch1=True,
        wallBroken=True,
        echoProgress=3,
        echoRound=1,
        echoDone=True,
    ),
    dict(iceWallBroken=True, gap0=True, gap1=True, gap2=True, ballFrozen=True),
    dict(
        lock0=True,
        lock1=True,
        lock2=True,
        beaconTrialStarted=True,
        beaconLit=True,
        beaconTrialDone=True,
    ),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", type=Path, default=ROOT / "tools" / "journey-save-results.json"
    )
    args = parser.parse_args()
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}"
    results, errors = [], []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            channel="chrome", headless=True, args=["--mute-audio"]
        )
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844}, service_workers="block"
        )
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        page.locator("#btn-play").click(timeout=90000)
        page.keyboard.press("Escape")
        for n in range(1, 7):
            for kind in ("boss", "gem"):
                # Seed only the saved story state; level loading still uses the map UI.
                page.evaluate(
                    """([n,kind,steps]) => {
                  MAY.save.gems = kind === 'gem' ? [1,2,3,4,5,6] : [1,2,3,4,5,6].filter(x => x !== n);
                  MAY.save.unlockedSpells = ['wave','growth','solar','crystal','frost','tornado'];
                  const save = MAY.getLevelSave('level'+n);
                  save.gem = kind === 'gem'; save.introSeen = true;
                  save.story = {stage: kind === 'boss' ? (n===1 ? 2 : 3) : (n===1 ? 3 : 4),
                    steps: steps, bossDown:kind==='gem', rewarded:kind==='gem'};
                  MAY.persist();
                }""",
                    [n, kind, STEPS[n - 1]],
                )
                # Exercise persisted state rather than just the live in-memory object.
                page.reload()
                page.locator("#btn-play").click(timeout=90000)
                page.keyboard.press("Escape")
                page.locator("#btn-map").dispatch_event("click")
                page.locator("#map-grid .map-card").nth(n).dispatch_event("click")
                page.wait_for_function(
                    "n=>MAY.currentLevelId===`level${n}` && MAY.currentCtx",
                    arg=n,
                    timeout=90000,
                )
                page.wait_for_timeout(600)
                result = page.evaluate("""() => { const c=MAY.currentCtx; return {
                  stage:c.story.stage, gem:c.save.gem, bossDown:c.story.bossDown,
                  bossActive:c.boss.active, journeyAvailable:c.chapterJourney.available,
                  objective:c.storyObjective && c.storyObjective.text, errors:MAY.ErrorBoundary.history.slice()
                }; }""")
                result.update(chapter=n, fixture=kind)
                result["pass"] = (
                    not result["journeyAvailable"]
                    and bool(result["objective"])
                    and not result["errors"]
                    and (result["gem"] if kind == "gem" else result["bossActive"])
                )
                results.append(result)
                print(json.dumps(result, ensure_ascii=True), flush=True)
        browser.close()
    server.shutdown()
    args.output.write_text(
        json.dumps(
            {"results": results, "pageErrors": errors}, ensure_ascii=False, indent=2
        ),
        encoding="utf8",
    )
    if errors or not all(r["pass"] for r in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
