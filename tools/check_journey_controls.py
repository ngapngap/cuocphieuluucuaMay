"""Focused journey control regression. All story fixtures are seeded before page load.

Runs in muted Chrome with real keyboard, touch and browser focus transitions. The
fixture is not a full campaign; no game state is changed by the driver after load.
"""

from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server

ROOT = Path(__file__).resolve().parents[1]


def fixture(level, journey):
    n = int(level[-1])
    steps = (
        {
            "mudClear": True,
            "tree0": True,
            "tree1": True,
            "tree2": True,
            "rootTrialStarted": True,
            "rootTrialDone": True,
        }
        if n == 2
        else {"oasisRevived": True, "mir0": True, "mir1": True, "mir2": True}
        if n == 3
        else {"torch0": True, "torch1": True, "wallBroken": True, "echoDone": True}
    )
    steps["journey"] = journey
    return {
        "version": 10,
        "progressionVersion": 1,
        "currentLevel": level,
        "storySeen": True,
        "voiceOn": False,
        "gems": list(range(1, n)),
        "unlockedSpells": ["wave", "growth", "solar", "crystal"],
        "gears": [1],
        "levels": {level: {"introSeen": True, "story": {"stage": 2, "steps": steps}}},
    }


def journey(section, event, distance, lateral=0, **extra):
    return dict(
        section=section,
        event=event,
        distance=distance,
        lateral=lateral,
        choices={},
        done=False,
        resume=True,
        note=0,
        angle=None,
        **extra,
    )


def main():
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                channel="chrome",
                headless=True,
                args=["--mute-audio", "--use-angle=d3d11"],
            )

            def open_fixture(data, mobile=False):
                context = browser.new_context(
                    viewport={"width": 390, "height": 844}
                    if mobile
                    else {"width": 1120, "height": 720},
                    service_workers="block",
                    has_touch=mobile,
                    is_mobile=mobile,
                )
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(origin)
                page.evaluate(
                    "v => localStorage.setItem('may-adv-v10', JSON.stringify(v))", data
                )
                page.reload()
                page.locator("#btn-play").click()
                page.wait_for_function("MAY.activeJourney", timeout=90000)
                page.wait_for_timeout(700)
                return context, page, errors

            # Wrong mirror angle is recoverable; leaving returns to the native world.
            ctx, page, errors = open_fixture(fixture("level3", journey(4, 2, 156)))
            page.keyboard.press("Enter")
            assert "lệch" in page.locator("#journey-status").inner_text()
            assert page.evaluate("MAY.currentCtx.story.steps.journey.event") == 2
            page.keyboard.press("KeyT")
            page.keyboard.press("KeyT")
            page.keyboard.press("Enter")
            page.wait_for_function("MAY.currentCtx.story.steps.journey.event===3")
            page.keyboard.press("Escape")
            page.wait_for_function(
                "!MAY.activeJourney && MAY.currentCtx.chapterJourney.available"
            )
            assert not page.evaluate("MAY.currentCtx.story.steps.journey.resume")
            distance = page.evaluate(
                "MAY.player.pos.distanceTo(MAY.currentCtx.chapterJourney.entry)"
            )
            assert distance < 6, (
                f"Escape after reload left M?y {distance:.1f} units from entry"
            )
            assert not errors, errors
            print(
                f"PASS keyboard: mirror, Escape and legacy door fallback ({distance:.2f} units)",
                flush=True,
            )
            ctx.close()

            # A genuine saved native return point is restored on resumed entry.
            saved_point = [2, 2, -18, 0]
            ctx, page, errors = open_fixture(
                fixture("level3", journey(4, 2, 156, returnPoint=saved_point))
            )
            page.keyboard.press("Escape")
            page.wait_for_function("!MAY.activeJourney")
            actual = page.evaluate("[MAY.player.pos.x, MAY.player.pos.z]")
            assert (
                abs(actual[0] - saved_point[0]) < 0.25
                and abs(actual[1] - saved_point[2]) < 0.25
            ), actual
            assert not errors, errors
            print("PASS reload restores saved native return coordinates", flush=True)
            ctx.close()

            # A wrong note does not erase accepted notes; a reload restores the partial phrase.
            ctx, page, errors = open_fixture(fixture("level4", journey(0, 0, 53.1)))
            page.wait_for_timeout(2300)  # wait for the audible/visual example to finish
            page.keyboard.press("Digit1")
            page.keyboard.press("Digit2")
            assert page.evaluate("MAY.currentCtx.story.steps.journey.note") == 1
            assert "khác" in page.locator("#journey-status").inner_text()
            page.reload()
            page.locator("#btn-play").click()
            page.wait_for_function("MAY.activeJourney", timeout=90000)
            page.wait_for_timeout(2300)
            assert page.evaluate("MAY.currentCtx.story.steps.journey.note") == 1
            page.keyboard.press("Digit1")
            page.keyboard.press("Digit3")
            page.wait_for_function("MAY.currentCtx.story.steps.journey.event===1")
            assert not errors, errors
            print(
                "PASS muted keyboard: wrong note, partial phrase reload, correct completion",
                flush=True,
            )
            ctx.close()

            # Browser focus loss releases held forward movement instead of running on return.
            ctx, page, errors = open_fixture(fixture("level3", journey(4, 0, 0)))
            page.evaluate(
                "window.focusEvents=[]; window.addEventListener('blur',()=>focusEvents.push('blur')); document.addEventListener('visibilitychange',()=>focusEvents.push(document.visibilityState))"
            )
            page.keyboard.down("KeyW")
            page.wait_for_timeout(550)
            other = ctx.new_page()
            other.goto("about:blank")
            other.bring_to_front()
            page.wait_for_timeout(400)
            page.bring_to_front()
            page.wait_for_timeout(500)
            first = page.evaluate("MAY.currentCtx.story.steps.journey.distance")
            page.wait_for_timeout(600)
            second = page.evaluate("MAY.currentCtx.story.steps.journey.distance")
            page.keyboard.up("KeyW")
            focus_events = page.evaluate("window.focusEvents")
            if focus_events:
                assert abs(second - first) < 0.25, (first, second, focus_events)
                print("PASS focus loss releases held movement", flush=True)
            else:
                print(
                    "SKIP focus loss: headless Chrome delivered no blur or visibility event",
                    flush=True,
                )
            # Explicitly inject the browser lifecycle event because some headless
            # environments never focus the new tab. This does not prove OS focus.
            page.keyboard.down("KeyW")
            page.wait_for_timeout(300)
            page.evaluate("window.dispatchEvent(new Event('blur'))")
            stopped = page.evaluate("MAY.currentCtx.story.steps.journey.distance")
            page.wait_for_timeout(600)
            assert (
                abs(
                    page.evaluate("MAY.currentCtx.story.steps.journey.distance")
                    - stopped
                )
                < 0.25
            )
            page.keyboard.up("KeyW")
            page.keyboard.down("KeyW")
            page.wait_for_timeout(400)
            page.keyboard.up("KeyW")
            assert (
                page.evaluate("MAY.currentCtx.story.steps.journey.distance")
                > stopped + 0.5
            )
            print(
                "PASS injected blur: stops held movement until a fresh keydown",
                flush=True,
            )
            assert not errors, errors
            ctx.close()

            # Touch: a solved room is persistent and its visible exit advances.
            room = {
                "entered": True,
                "done": False,
                "values": {"bank": True, "note": 2},
                "x": 8,
                "z": -5,
            }
            ctx, page, errors = open_fixture(
                fixture("level4", journey(2, 8, 600, clearing=room)), mobile=True
            )
            page.locator("#journey-actions button").get_by_text("Nhịp dài").tap()
            page.wait_for_function("MAY.currentCtx.story.steps.journey.clearing.solved")
            page.reload()
            page.locator("#btn-play").tap()
            page.wait_for_function(
                "MAY.activeJourney && MAY.currentCtx.story.steps.journey.clearing.solved",
                timeout=90000,
            )
            page.locator("#journey-actions button").get_by_text("Đi tiếp").tap()
            page.wait_for_function("MAY.currentCtx.story.steps.journey.section===3")
            nav = page.locator('#journey [data-move="KeyW"]').bounding_box()
            point = {
                "x": nav["x"] + nav["width"] / 2,
                "y": nav["y"] + nav["height"] / 2,
            }
            cdp = ctx.new_cdp_session(page)
            cdp.send(
                "Input.dispatchTouchEvent",
                {"type": "touchStart", "touchPoints": [point]},
            )
            page.wait_for_timeout(1000)
            cdp.send(
                "Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}
            )
            assert page.evaluate("MAY.currentCtx.story.steps.journey.distance") > 1
            assert not errors, errors
            print(
                "PASS touch: room interaction, solved reload, exit and held movement",
                flush=True,
            )
            ctx.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
