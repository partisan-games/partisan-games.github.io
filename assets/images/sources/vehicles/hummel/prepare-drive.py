from pathlib import Path

from PIL import Image, ImageDraw


SOURCE = Path(__file__).resolve().parent
OUTPUT = SOURCE.parents[2] / "game-ready/tenkovi/hummel-sprites.webp"
WIDTH, HEIGHT, GUTTER = 320, 160, 4
WHEELS = [(40, 118, 11), (257, 118, 12)]
WHEELS += [(x, 133, 7) for x in (68, 91, 113, 136, 158, 181, 204, 227)]
TREAD = (72, 143, 217, 146)
LINK_WIDTH = 8


def drive(base, phase):
    frame = base.copy()
    for x, y, radius in WHEELS:
        box = (x - radius, y - radius, x + radius + 1, y + radius + 1)
        crop = base.crop(box)
        disk = Image.new("L", crop.size)
        ImageDraw.Draw(disk).ellipse((0, 0, 2 * radius, 2 * radius), fill=255)
        frame.paste(crop.rotate(-90 * phase, resample=Image.Resampling.NEAREST), box[:2], disk)

    left, top, right, bottom = TREAD
    link = base.crop((144, top, 144 + LINK_WIDTH, bottom))
    band = Image.new("RGBA", (right - left + LINK_WIDTH, bottom - top))
    for x in range(0, band.width, LINK_WIDTH):
        band.paste(link, (x, 0))
    phase_x = phase * LINK_WIDTH // 4
    strip = band.crop((phase_x, 0, phase_x + right - left, bottom - top))
    frame.paste(strip, (left, top), strip.getchannel("A"))
    return frame


def build():
    with Image.open(SOURCE / "original-idle.png") as image:
        base = image.convert("RGBA")
    assert base.size == (WIDTH, HEIGHT)
    sx, sy = WIDTH + 2 * GUTTER, HEIGHT + 2 * GUTTER
    atlas = Image.new("RGBA", (4 * sx, 2 * sy))
    atlas.alpha_composite(drive(base, 0), (GUTTER, GUTTER))
    for phase in range(4):
        atlas.alpha_composite(drive(base, phase), (phase * sx + GUTTER, sy + GUTTER))
    atlas.save(OUTPUT, lossless=True, exact=True)


if __name__ == "__main__":
    build()
