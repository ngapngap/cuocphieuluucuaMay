"""Focused journey control regression. All story fixtures are seeded before page load.

Runs in muted Chrome with real keyboard, touch and browser focus transitions. The
fixture is not a full campaign; no game state is changed by the driver after load.
"""

import json
from functools import partial
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
from trace_transition import Handler, Server
from check_journey_saves import STEPS

ROOT = Path(__file__).resolve().parents[1]


def fixture(level, journey):
    n = int(level[-1])
    steps = dict(STEPS[n - 1])
    if n == 6:
        steps.pop("beaconLit", None)
        steps.pop("beaconTrialDone", None)
    steps["journey"] = journey
    return {
        "version": 10,
        "progressionVersion": 1,
        "currentLevel": level,
        "storySeen": True,
        "voiceOn": False,
        "gems": list(range(1, n)),
        "unlockedSpells": ["wave", "growth", "solar", "crystal", "frost", "tornado"],
        "gears": [1],
        "levels": {
            level: {
                "introSeen": True,
                "story": {"stage": 1 if n == 1 else 2, "steps": steps},
            }
        },
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
                    storage_state={
                        "cookies": [],
                        "origins": [
                            {
                                "origin": origin,
                                "localStorage": [
                                    {"name": "may-adv-v10", "value": json.dumps(data)}
                                ],
                            }
                        ],
                    },
                )
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(origin)
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
                f"Escape after reload left Mây {distance:.1f} units from entry"
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

            # Each fixture starts at an intentionally premature target. Recovery
            # after reload is performed through the ordinary keyboard driver.
            cases = [
                (1, 3, 17, -27, "KeyT", "cá nhỏ vẫn mắc", "safe"),
                (2, 2, 10, -29, "KeyT", "Rễ còn khô", "tree"),
                (3, 2, 12, -14, "KeyT", "chưa nhận tia", "relay"),
                (4, 2, 16, -22, "KeyT", "khác câu gọi", "bank"),
                (5, 2, 0, -32, "KeyT", "Còn sói non", "home"),
                (6, 2, 0, -33, "solar", "Chưa đủ ba lời đáp", "lamp"),
            ]
            for n, section, x, z, action, clue, blocked in cases:
                room = {"entered": True, "done": False, "values": {}, "x": x, "z": z}
                ctx, page, errors = open_fixture(
                    fixture("level" + str(n), journey(section, 0, 0, clearing=room)),
                    mobile=True,
                )
                page.wait_for_timeout(400)
                if action == "solar":
                    page.keyboard.press("Digit3")
                    page.keyboard.press("KeyR")
                else:
                    page.keyboard.press(action)
                page.wait_for_timeout(300)
                message = page.locator("#journey-status").inner_text()
                assert clue in message, (n, message)
                assert not page.evaluate(
                    "key => !!MAY.currentCtx.story.steps.journey.clearing.values[key]",
                    blocked,
                )
                # Status/actions may not obscure the visible directional buttons.
                overlap = page.evaluate("""() => {
                  const rect = e => e.getBoundingClientRect();
                  const status = rect(document.querySelector('#journey-status').parentElement);
                  return [...document.querySelectorAll('#journey [data-move]')].some(e => {
                    const b=rect(e); return b.width && b.height && status.left < b.right && status.right > b.left && status.top < b.bottom && status.bottom > b.top;
                  });
                }""")
                assert not overlap, f"chapter {n}: message overlaps movement controls"
                obscured = page.evaluate("""() => [...document.querySelectorAll('#journey [data-move], #journey-actions button, #journey-leave')].filter(e => {
                  const r=e.getBoundingClientRect(); if (!r.width || !r.height) return false;
                  const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
                  return r.left<0 || r.right>innerWidth || r.top<0 || r.bottom>innerHeight || !(hit===e || e.contains(hit));
                }).map(e => e.textContent)""")
                assert not obscured, (n, obscured)
                page.reload()
                page.locator("#btn-play").tap()
                page.wait_for_function("MAY.activeJourney", timeout=90000)
                assert not page.evaluate(
                    "key => !!MAY.currentCtx.story.steps.journey.clearing.values[key]",
                    blocked,
                )
                for script in (
                    "route_ocean_forest.js",
                    "route_desert_crystal.js",
                    "route_snow_clouds.js",
                    "drive_long_story.js",
                ):
                    page.evaluate(
                        (ROOT / "tools" / script).read_text(encoding="utf8")
                        + "\n;void 0;"
                    )
                page.evaluate("n => storyDriver.chapter=n", n)
                page.wait_for_function(
                    "s => {const j=MAY.currentCtx.story.steps.journey; return j.clearing.solved || j.clearing.done || j.section>s;}",
                    arg=section,
                    timeout=180000,
                )
                failure = page.evaluate("storyDriver.failure")
                assert not failure and not errors, (n, failure, errors)
                print(
                    f"PASS clearing {n}: wrong target, visible feedback, reload, keyboard solution",
                    flush=True,
                )
                ctx.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
