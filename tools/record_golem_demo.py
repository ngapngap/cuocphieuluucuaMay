"""Record a muted low-quality golem fight from the gameplay camera."""

import functools
import http.server
import os
import pathlib
import subprocess
import tempfile
import threading
import time

import cv2
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


def trim_recording(source, destination, start_seconds):
    """Re-encode the gameplay portion as a small, silent VP9 WebM."""
    video = cv2.VideoCapture(str(source))
    if not video.isOpened():
        raise RuntimeError("Unable to decode the Playwright recording")
    fps = video.get(cv2.CAP_PROP_FPS)
    video.set(cv2.CAP_PROP_POS_MSEC, start_seconds * 1000)
    candidates = sorted(
        (pathlib.Path(os.environ["LOCALAPPDATA"]) / "ms-playwright").glob(
            "ffmpeg-*/ffmpeg-win64.exe"
        )
    )
    if not candidates:
        raise RuntimeError("Playwright FFmpeg not found; run playwright install ffmpeg")
    with tempfile.TemporaryDirectory(prefix="golem-frames-") as temporary:
        frames = pathlib.Path(temporary) / "frames.mjpg"
        count = 0
        try:
            with frames.open("wb") as output:
                while True:
                    ok, frame = video.read()
                    if not ok:
                        break
                    ok, jpeg = cv2.imencode(
                        ".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90]
                    )
                    if not ok:
                        raise RuntimeError("Frame encoding failed")
                    output.write(jpeg.tobytes())
                    count += 1
        finally:
            video.release()
        if not count:
            raise RuntimeError("The selected gameplay segment contains no frames")
        subprocess.run(
            [
                str(candidates[-1]),
                "-loglevel",
                "error",
                "-y",
                "-f",
                "image2pipe",
                "-vcodec",
                "mjpeg",
                "-framerate",
                str(fps),
                "-i",
                str(frames),
                "-an",
                "-c:v",
                "libvpx-vp9",
                "-deadline",
                "realtime",
                "-cpu-used",
                "8",
                "-b:v",
                "700k",
                str(destination),
            ],
            check=True,
        )


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
with (
    tempfile.TemporaryDirectory(prefix="golem-video-") as temporary,
    sync_playwright() as p,
):
    browser = p.chromium.launch(
        channel="chrome",
        headless=True,
        args=["--enable-gpu", "--use-angle=d3d11", "--mute-audio"],
    )
    ctx = browser.new_context(
        service_workers="block",
        viewport={"width": 1180, "height": 760},
        record_video_dir=temporary,
        record_video_size={"width": 1180, "height": 760},
    )
    page = ctx.new_page()
    recording_started = time.monotonic()
    page.goto(f"http://127.0.0.1:{server.server_port}/", wait_until="domcontentloaded")
    page.wait_for_function(
        "window.__ready && !document.querySelector('#btn-play').disabled",
        timeout=120000,
    )
    page.click("#btn-start-free")
    page.evaluate(
        "MAY.applyQuality('low'); MAY.save.quality='low'; MAY.save.voiceOn=false; MAY.save.freeSpells=true; MAY.persist()"
    )
    page.click("#btn-play")
    page.evaluate("MAY.Cutscene.skip()")
    page.evaluate("""async () => {
      const s=MAY.getLevelSave('level4').story;
      s.stage=3; s.bossDown=false; s.steps.torch0=s.steps.torch1=s.steps.wallBroken=s.steps.echoDone=true;
      s.steps.echoArmor=false; MAY.persist();
      await MAY.enterLevel('level4',true);
      MAY.player.pos.set(0, MAY.currentCtx.groundH(0,2)+1.05, 2);
      MAY.player.yaw=0; MAY.player.camPosInit=false;
      MAY.currentCtx.boss.atkT=1.5;
    }""")
    fight_started = time.monotonic()
    page.wait_for_timeout(5500)
    for phase in range(3):
        page.keyboard.press("4")
        page.keyboard.press("r")
        page.wait_for_function(
            "MAY.currentCtx.boss.subState.armorBroken", timeout=20000
        )
        page.wait_for_timeout(2000)
        page.keyboard.press("3")
        page.keyboard.press("r")
        page.wait_for_function(
            "hp => MAY.currentCtx.boss.hp < hp", arg=3 - phase, timeout=20000
        )
        page.wait_for_timeout(2500)
    assert page.evaluate(
        "MAY.currentCtx.story.bossDown && MAY.currentCtx.story.stage === 4"
    )
    page.evaluate("""() => {
      MAY.Cutscene.skip();
      const n=MAY.currentCtx.questNPCs[0];
      MAY.player.pos.set(n.pos.x, MAY.currentCtx.groundH(n.pos.x,n.pos.z)+1.05, n.pos.z+2);
      MAY.player.camPosInit=false;
    }""")
    page.wait_for_timeout(1200)
    page.keyboard.press("t")
    page.wait_for_function("MAY.dialogueOpen", timeout=10000)
    for _ in range(8):
        if page.evaluate("MAY.currentCtx.save.gem"):
            break
        page.locator("#dlg-next").click(force=True)
        page.wait_for_timeout(400)
    assert page.evaluate("MAY.currentCtx.save.gem && MAY.currentCtx.story.rewarded")
    print(
        page.evaluate(
            "({hp:MAY.currentCtx.boss.hp,down:MAY.currentCtx.story.bossDown,broken:!!MAY.currentCtx.boss.subState.armorBroken})"
        ),
        flush=True,
    )
    video = page.video
    page.close()
    ctx.close()
    raw_video = pathlib.Path(temporary) / "raw.webm"
    video.save_as(str(raw_video))
    browser.close()
    trim_recording(
        raw_video,
        ROOT / "docs" / "golem-fight-low-muted.webm",
        fight_started - recording_started,
    )
server.shutdown()
