"""Pack the drawn poses at a shared boot baseline and register the flag grip."""
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
OUTPUT = SOURCE.parents[2] / "game-ready/vojnici/savo-ustanak-sprites.webp"
CELL = (176, 144)
ANCHOR = (88, 134)
GUTTER = 4
# The silhouettes on the sheet lie within these boundaries. The rightmost fall
# pose starts left of the nominal last column, so use measured boundaries.
COLS = (0, 312, 620, 912, 1254)
ROWS = (0, 315, 630, 953, 1254)
FALL_CENTERS = (148, 448, 728, 1082)
GRIP_X = 34


def main():
    atlas = Image.new("RGBA", tuple(4 * (edge + 2 * GUTTER) for edge in CELL))
    with Image.open(SOURCE / "poses-revised.png") as sheet:
        for row, (top, bottom) in enumerate(zip(ROWS, ROWS[1:])):
            for col, (left, right) in enumerate(zip(COLS, COLS[1:])):
                pose = sheet.crop((left, top, right, bottom)).convert("RGBA")
                alpha = pose.getchannel("A").point(lambda value: 255 if value >= 160 else 0)
                pose.putalpha(alpha)
                x0, y0, x1, y1 = alpha.getbbox()
                pose = pose.crop((x0, y0, x1, y1))
                height = (pose.height + 1) // 2
                # Idle and the neutral ends of a hit share the same standing height.
                if row == 0 or row == 2 and col in (0, 3):
                    height = 128
                pose = pose.resize(((pose.width + 1) // 2, height), Image.Resampling.NEAREST)
                # The centre of the extended fist is seven atlas pixels from its right edge.
                center = x1 - 2 * (GRIP_X + 7) if row < 3 else FALL_CENTERS[col] - left
                x = ANCHOR[0] + round((x0 - center) / 2)
                y = ANCHOR[1] - pose.height
                assert 0 <= x <= CELL[0] - pose.width and 0 <= y <= CELL[1] - pose.height
                atlas.paste(pose, (
                    col * (CELL[0] + 2 * GUTTER) + GUTTER + x,
                    row * (CELL[1] + 2 * GUTTER) + GUTTER + y,
                ))
    atlas.save(OUTPUT, format="WEBP", lossless=True, method=6)


if __name__ == "__main__":
    main()
