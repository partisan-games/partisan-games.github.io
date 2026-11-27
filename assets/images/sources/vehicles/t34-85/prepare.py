from pathlib import Path

from PIL import Image, ImageDraw


HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parents[2] / "game-ready/tenkovi/t34-85-sprites.webp"
FRAME = (672, 240)
GUTTER = 4
WHEELS = [(111, 191), (185, 191), (260, 191), (334, 191), (409, 191)]
TRACK = (102, 224, 418, 229)
LINK_WIDTH = 10
BARREL = (446, 60, 656, 80)
RECOIL = (0, 11, 5, 0)


def original_frame():
    with Image.open(HERE / "redraw.png") as image:
        sprite = image.convert("RGBA")
    alpha = sprite.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    sprite.putalpha(alpha)
    sprite = sprite.crop(alpha.getbbox()).resize((640, 216), Image.Resampling.NEAREST)
    frame = Image.new("RGBA", FRAME)
    frame.alpha_composite(sprite, (16, 16))
    return frame


def driving_frame(base, phase):
    frame = base.copy()
    # The circular rims stay fixed while the highlighted hub details turn.
    radius = 21
    hub_mask = Image.new("L", (2 * radius + 1, 2 * radius + 1))
    ImageDraw.Draw(hub_mask).ellipse((0, 0, 2 * radius, 2 * radius), fill=255)
    for x, y in WHEELS:
        box = (x - radius, y - radius, x + radius + 1, y + radius + 1)
        hub = base.crop(box).rotate(-phase * 60, resample=Image.Resampling.NEAREST)
        frame.paste(hub, box[:2], hub_mask)

    # Repeat an original link across the straight lower run. Its phase moves toward the rear.
    left, top, right, bottom = TRACK
    link = base.crop((200, top, 200 + LINK_WIDTH, bottom))
    tread = Image.new("RGBA", (right - left + LINK_WIDTH, bottom - top))
    offset = phase * LINK_WIDTH // 6
    for x in range(0, tread.width, LINK_WIDTH):
        tread.paste(link, (x, 0))
    frame.paste(tread.crop((offset, 0, offset + right - left, bottom - top)), (left, top))
    return frame


def firing_frame(base, offset):
    if not offset:
        return base
    frame = base.copy()
    frame.paste((0, 0, 0, 0), BARREL)
    frame.alpha_composite(base.crop(BARREL), (BARREL[0] - offset, BARREL[1]))
    return frame


def build_atlas():
    base = original_frame()
    drive = [driving_frame(base, phase) for phase in range(6)]
    rows = [[drive[0]], drive, [firing_frame(drive[0], offset) for offset in RECOIL]]
    step_x, step_y = (size + 2 * GUTTER for size in FRAME)
    atlas = Image.new("RGBA", (len(drive) * step_x, len(rows) * step_y))
    for row, frames in enumerate(rows):
        for column, frame in enumerate(frames):
            atlas.alpha_composite(frame, (column * step_x + GUTTER, row * step_y + GUTTER))
    return atlas


if __name__ == "__main__":
    build_atlas().save(OUTPUT, lossless=True, exact=True)
