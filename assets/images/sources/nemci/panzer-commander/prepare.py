"""Pack the original idle and recoil and the fall over the hatch."""
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
TARGET = SOURCE.parents[2] / 'game-ready/vojnici/advance-commander.webp'
WIDTH, HEIGHT, GUTTER, ANCHOR_Y = 104, 128, 4, 84
STRIDE_X, STRIDE_Y = WIDTH + 2 * GUTTER, HEIGHT + 2 * GUTTER
UPRIGHT_HEIGHT = 92
SCALE = 0.15
# Measured separations and positions keep the waist at the hatch as the limbs drop.
FALL_CUTS = (0, 400, 800, 1240, 1695, 2172)
FALL_POSITIONS = ((3, 31), (5, 34), (9, 44), (14, 59), (16, 61))


def fit(pose, threshold):
    pose.putalpha(pose.getchannel('A').point(lambda alpha: 255 if alpha >= threshold else 0))
    pose = pose.crop(pose.getbbox())
    return pose.resize((round(pose.width * SCALE), round(pose.height * SCALE)), Image.Resampling.NEAREST)


def main():
    with Image.open(TARGET) as atlas:
        idle = atlas.convert('RGBA')
    existing_gutter = idle.width == 6 * STRIDE_X
    output = Image.new('RGBA', (6 * STRIDE_X, 3 * STRIDE_Y))
    for column in range(6):
        x = column * (STRIDE_X if existing_gutter else WIDTH) + (GUTTER if existing_gutter else 0)
        y = GUTTER if existing_gutter else 0
        output.paste(idle.crop((x, y, x + WIDTH, y + UPRIGHT_HEIGHT)), (column * STRIDE_X + GUTTER, GUTTER))

    with Image.open(SOURCE / 'redraw.png') as image:
        drawings = image.convert('RGBA')
    cell = drawings.width // 6
    for index in range(2):
        pose = drawings.crop((index * cell, 0, (index + 1) * cell, drawings.height))
        left = pose.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0).getbbox()[0]
        pose = fit(pose, 128)
        x = index * STRIDE_X + GUTTER + round((left - 27) * SCALE)
        y = STRIDE_Y + GUTTER + ANCHOR_Y - pose.height
        output.paste(pose, (x, y))

    with Image.open(SOURCE / 'fall-over-hatch.png') as image:
        fall = image.convert('RGBA')
    assert fall.width == FALL_CUTS[-1]
    for index, ((left, right), (x, y)) in enumerate(zip(zip(FALL_CUTS, FALL_CUTS[1:]), FALL_POSITIONS, strict=True)):
        pose = fit(fall.crop((left, 0, right, fall.height)), 160)
        assert 0 <= x <= WIDTH - pose.width and 0 <= y <= HEIGHT - pose.height
        output.paste(pose, (index * STRIDE_X + GUTTER + x, 2 * STRIDE_Y + GUTTER + y))
    output.save(TARGET, lossless=True, method=6)


if __name__ == '__main__':
    main()
