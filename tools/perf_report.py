import json
import pathlib
import statistics
import sys

before = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf8"))
after = (
    json.loads(pathlib.Path(sys.argv[2]).read_text(encoding="utf8"))
    if len(sys.argv) > 2
    else []
)
hub_before = (
    json.loads(pathlib.Path(sys.argv[3]).read_text(encoding="utf8"))
    if len(sys.argv) > 3
    else []
)
hub_after = (
    json.loads(pathlib.Path(sys.argv[4]).read_text(encoding="utf8"))
    if len(sys.argv) > 4
    else []
)
slow = (
    json.loads(pathlib.Path(sys.argv[5]).read_text(encoding="utf8"))
    if len(sys.argv) > 5
    else []
)
hub_final = (
    json.loads(pathlib.Path(sys.argv[6]).read_text(encoding="utf8"))
    if len(sys.argv) > 6
    else []
)
lines = [
    "# Level loading measurement",
    "",
    "[Tóm tắt kết quả bằng tiếng Việt](kiem-tra-ban-thu.md)",
    "",
    "Windows desktop, Intel Core i7-10700, 32 GB RAM, Intel UHD 630 driver 31.0.101.2141; Chrome headless with D3D11, 1180×760 and the default medium quality. Local HTTP server; service worker blocked. Each cold run uses a new browser context; reload uses the same context after resetting the saved level to hub. Browser process and GPU shader caches are shared across runs, so later cold contexts are not fully cold GPU starts. Intro animations are marked seen for repeatability; the script presses W for 300 ms after each transition and records player positions, modal and cutscene state. Input displacement is a coarse control check.",
    "",
    "Run `python tools/perf_scenario.py <app-root> <output.json> 5` on the same host with similar background load. The sequential scenario goes hub→1→2→3→4→5→6→1. Add `--from-hub` to return to hub before each target; the last entry is an ocean revisit. Request is sampled immediately before clicking a map card. Build is synchronous builder time; first frame is the first completed `MAY.renderFrame` after build. RAF gap is the largest observer interval intersecting request–first draw. These measurements include automation and rendering and are not presentation timestamps.",
    "",
]
for title, data in [
    ("Before — sequential", before),
    ("After, before the final render fix — sequential", after),
    ("Before — from hub", hub_before),
    ("After, before the final render fix — from hub", hub_after),
    ("Final render fix — from hub", hub_final),
]:
    if not data:
        continue
    lines += [
        "## " + title,
        "",
        f"Samples: {len(data)}; user agent: `{data[0]['device']['ua']}`; renderer: `{data[0]['device']['renderer']}`.",
        "",
        "| Mode | Visit | Median request → first draw (ms) | Median before build (ms) | Median build (ms) | Median / worst RAF gap (ms) |",
        "|---|---|---:|---:|---:|---:|",
    ]
    for mode in ("cold", "reload"):
        rows = [r for r in data if r["mode"] == mode]
        if not rows:
            continue
        lines.append(
            f"| {mode} | Play enabled + ready | {statistics.median(r['readyMs'] for r in rows):.0f} | — | — | — |"
        )
        for i in range(7):
            vs = [r["visits"][i] for r in rows]
            label = vs[0]["id"] + (" revisit" if i == 6 else "")
            wait = statistics.median(v["frame"] - v["start"] for v in vs)
            build = statistics.median(v["build"] - v["buildStart"] for v in vs)
            before_build = statistics.median(v["buildStart"] - v["start"] for v in vs)
            gap = statistics.median(v["maxGap"] for v in vs)
            worst = max(v["maxGap"] for v in vs)
            lines.append(
                f"| {mode} | {label} | {wait:.0f} | {before_build:.0f} | {build:.0f} | {gap:.0f} / {worst:.0f} |"
            )
    lines.append("")
if slow:
    lines += [
        "## Throttled startup",
        "",
        "Five fresh contexts against the updated app before the final render fix, with CDP latency 150 ms, download 1.6 Mbit/s and upload 0.75 Mbit/s; service workers blocked. This is an emulation, not a physical mobile connection. The metric ends when Play is enabled and three animation frames have run.",
        "",
        f"Median: {statistics.median(r['readyMs'] for r in slow):.0f} ms. Samples: "
        + ", ".join(f"{r['readyMs']:.0f}" for r in slow)
        + " ms.",
        "",
    ]
lines += [
    "## Crystal long tasks",
    "",
    "Bars show browser-reported long tasks overlapping the first cold crystal transition; the chart uses durations, not call stacks. See JSON for timestamps and every sample.",
    "",
    "![Crystal long task durations](crystal-long-tasks.svg)",
    "",
]
tasks = before[0]["visits"][3]["tasks"]
maximum = max([t["duration"] for t in tasks] or [1])
height = 85 + 35 * len(tasks)
svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="720" height="{height}" viewBox="0 0 720 {height}">',
    '<rect width="100%" height="100%" fill="white"/>',
    '<text x="10" y="25" font-family="sans-serif" font-size="16">First cold crystal transition — long tasks (ms)</text>',
]
for i, task in enumerate(tasks):
    y = 45 + i * 35
    width = task["duration"] / maximum * 500
    duration = task["duration"]
    svg += [
        f'<text x="10" y="{y + 16}" font-family="sans-serif" font-size="13">{i + 1}</text>',
        f'<rect x="35" y="{y}" width="{width:.1f}" height="20" fill="#7952b3"/>',
        f'<text x="{min(550, 45 + width):.1f}" y="{y + 15}" font-family="sans-serif" font-size="13">{duration:.0f} ms</text>',
    ]
svg.append("</svg>")
pathlib.Path("docs").mkdir(exist_ok=True)
pathlib.Path("docs/crystal-long-tasks.svg").write_text("\n".join(svg), encoding="utf8")
pathlib.Path("docs/performance-measurement.md").write_text(
    "\n".join(lines), encoding="utf8"
)
