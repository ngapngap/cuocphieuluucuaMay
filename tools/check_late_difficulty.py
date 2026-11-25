"""Keyboard/touch regression for late chapter trials; fixtures begin before room entrance.

The fixture skips earlier chapters; all movement and interactions in the trial use
player controls. It is not a fresh-campaign or timing measurement.
"""
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
from check_journey_controls import ROOT, fixture, journey
from trace_transition import Handler, Server


def main():
    server = Server(("127.0.0.1", 0), partial(Handler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", headless=True, args=["--mute-audio", "--use-angle=d3d11"])
            for level, mobile, event_count, length in [("level4", False, 8, 600), ("level5", True, 10, 650)]:
                context = browser.new_context(viewport={"width": 390, "height": 844} if mobile else {"width": 1120, "height": 720}, has_touch=mobile, is_mobile=mobile, service_workers="block")
                page = context.new_page()
                page.set_default_timeout(90000)
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto("http://127.0.0.1:%s/" % server.server_port)
                data = fixture(level, journey(2, event_count, length - .3))
                page.evaluate("v=>localStorage.setItem('may-adv-v10',JSON.stringify(v))", data)
                page.reload()
                page.locator("#btn-play").click()
                page.wait_for_function("MAY.activeJourney", timeout=90000)
                cdp = context.new_cdp_session(page) if mobile else None

                def down(code):
                    if not mobile:
                        page.keyboard.down(code)
                    else:
                        box = page.locator('[data-move="%s"]' % code).bounding_box()
                        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": box["x"]+box["width"]/2, "y": box["y"]+box["height"]/2}]})

                def up(code):
                    if mobile:
                        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
                    else:
                        page.keyboard.up(code)

                down("KeyW")
                page.wait_for_function("MAY.currentCtx.story.steps.journey.clearing?.entered", timeout=12000)
                up("KeyW")

                def values():
                    return page.evaluate("MAY.currentCtx.story.steps.journey.clearing.values")

                def go(device_id):
                    target = page.evaluate("id=>MAY.currentCtx.chapterJourney.config.clearing.devices.find(d=>d.id===id)", device_id)
                    for axis in ("x", "z"):
                        p = page.evaluate("MAY.currentCtx.story.steps.journey.clearing")
                        delta = target[axis] - p[axis]
                        if abs(delta) <= .8:
                            continue
                        key = ("KeyD" if delta > 0 else "KeyA") if axis == "x" else ("KeyS" if delta > 0 else "KeyW")
                        down(key)
                        page.wait_for_function("([axis,target])=>Math.abs(MAY.currentCtx.story.steps.journey.clearing[axis]-target)<.8", arg=[axis, target[axis]], timeout=20000)
                        up(key)
                    page.wait_for_timeout(850)  # allow companions to catch up
                    return target

                def operate(target):
                    if mobile:
                        if target.get("spell"):
                            spell = page.evaluate("id=>MAY.SPELLS.find(s=>s.id===id).name", target["spell"])
                            page.get_by_role("button", name=spell+" · "+target["name"], exact=True).tap()
                        else:
                            page.get_by_role("button", name=target["name"], exact=True).tap()
                    elif target.get("spell"):
                        key = page.evaluate("id=>MAY.SPELLS.find(s=>s.id===id).key", target["spell"])
                        page.keyboard.press("Digit"+str(key)); page.keyboard.press("KeyR")
                    else:
                        page.keyboard.press("KeyT")
                    page.wait_for_timeout(150)

                if level == "level4":
                    patterns = lambda: page.evaluate("()=>{let c=MAY.currentCtx.chapterJourney.config.clearing,v=MAY.currentCtx.story.steps.journey.clearing.values;return ['left','right'].map(id=>c.devices.find(d=>d.id===id).pattern(v))}")
                    assert patterns() == [[0, 0, 2], [0, 2, 0]]
                    operate(go("left")); operate(go("short")); assert values()["note"] == 1
                    assert patterns() == [[0, 2, 0], [0, 0, 2]]
                    operate(go("short")); assert values()["note"] == 1 and not values().get("shift")
                    assert "chuyển bờ" in page.locator("#journey-status").inner_text()
                    page.reload(); page.locator("#btn-play").click(); page.wait_for_function("MAY.activeJourney && MAY.currentCtx.story.steps.journey.clearing?.entered", timeout=90000)
                    assert values()["note"] == 1 and values()["crossSignal"]
                    operate(go("right")); assert values()["shift"]
                    operate(go("short")); operate(go("long"))
                    assert page.evaluate("!!MAY.currentCtx.story.steps.journey.clearing.solved")
                    print("PASS crystal keyboard: wrong repeat blocked; bank switch, reload and answer", flush=True)
                else:
                    operate(go("pup1")); operate(go("pup2")); operate(go("bridge"))
                    assert not values().get("bridge") and values()["bridgeTrial"]
                    assert "Tuyết xốp" in page.locator("#journey-status").inner_text()
                    operate(go("thaw")); assert values()["thaw"]
                    operate(go("bridge")); assert values()["bridge"]
                    operate(go("home")); assert page.evaluate("!!MAY.currentCtx.story.steps.journey.clearing.solved")
                    print("PASS snow touch: frost before thaw blocked; solar, frost and escort", flush=True)
                assert not errors, errors
                context.close()
            browser.close()
    finally:
        server.shutdown(); server.server_close()


if __name__ == "__main__":
    main()
