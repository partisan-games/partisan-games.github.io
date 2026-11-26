"""Register the eight drawn sprint poses and repack the original non-running frames."""

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/images/sources/partizani/partisan-runner'
OUTPUT = ROOT / 'assets/images/game-ready/vojnici/partisan-runner-sprites.webp'
WIDTH, HEIGHT = 160, 144
GUTTER = 4
RUN_ROW = 1
# The sole touches the common ground plane on landing and support, then lifts during flight.
SOLE_LINES = (140, 140, 138, 131, 140, 140, 138, 131)
CAP_X = 82
RUN_SCALE = .245


def run_frames(sheet):
    for index, sole in enumerate(SOLE_LINES):
        column, row = index % 4, index // 4
        pose = sheet.crop((sheet.width * column // 4, sheet.height * row // 2,
                           sheet.width * (column + 1) // 4, sheet.height * (row + 1) // 2))
        alpha = pose.getchannel('A').point(lambda value: 255 if value >= 128 else 0)
        pose.putalpha(alpha)
        left, top, right, bottom = alpha.getbbox()
        cap_left, _, cap_right, _ = alpha.crop((0, top, pose.width, top + 56)).getbbox()
        cap = (cap_left + cap_right) / 2
        pose = pose.crop((left, top, right, bottom))
        pose = pose.resize((round(pose.width * RUN_SCALE), round(pose.height * RUN_SCALE)), Image.Resampling.NEAREST)
        at = (round(CAP_X - (cap - left) * RUN_SCALE), sole - pose.height)
        assert at[0] >= 0 and at[1] >= 0 and at[0] + pose.width <= WIDTH
        frame = Image.new('RGBA', (WIDTH, HEIGHT))
        frame.paste(pose, at)
        yield frame


def frame_box(column, row, gutter):
    x = column * (WIDTH + 2 * gutter) + gutter
    y = row * (HEIGHT + 2 * gutter) + gutter
    return x, y, x + WIDTH, y + HEIGHT


def main():
    with Image.open(SOURCE / 'original.webp') as image:
        original = image.convert('RGBA')
    with Image.open(SOURCE / 'sprint-cycle.png') as image:
        run = list(run_frames(image.convert('RGBA')))
    atlas = Image.new('RGBA', (8 * (WIDTH + 2 * GUTTER), 5 * (HEIGHT + 2 * GUTTER)))
    for row in range(5):
        frames = run if row == RUN_ROW else [original.crop(frame_box(column, row, 0)) for column in range(4)]
        for column, frame in enumerate(frames):
            atlas.paste(frame, frame_box(column, row, GUTTER)[:2])
    atlas.save(OUTPUT, lossless=True, exact=True, method=6)

    with Image.open(OUTPUT) as saved:
        assert saved.tobytes() == atlas.tobytes()
        for row in (0, 2, 3, 4):
            for column in range(4):
                old = original.crop(frame_box(column, row, 0))
                new = saved.crop(frame_box(column, row, GUTTER))
                assert not ImageChops.difference(old, new).getbbox(alpha_only=False)


if __name__ == '__main__':
    main()
