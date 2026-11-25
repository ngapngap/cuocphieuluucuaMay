"""Keep comparable full-resolution WebP screenshots and grayscale contact sheets."""

from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(__file__).resolve().parent / "issue15-qa"
for quality in ("low", "mid"):
    for width in (1180, 390):
        thumb = (590, 380) if width == 1180 else (195, 422)
        sheet = Image.new("RGB", (thumb[0] * 3, thumb[1] * 2 + 44), "white")
        draw = ImageDraw.Draw(sheet)
        for row, tag in enumerate(("before", "after")):
            y = row * (thumb[1] + 22)
            draw.text((5, y + 3), tag.upper(), fill="black")
            for i in range(3):
                image = (
                    Image.open(folder / f"{tag}-{quality}-{width}-{i}.webp")
                    .convert("L")
                    .convert("RGB")
                )
                image.thumbnail(thumb)
                sheet.paste(image, (i * thumb[0], y + 22))
        sheet.save(folder / f"grayscale-{quality}-{width}.webp", "WEBP", quality=90)
