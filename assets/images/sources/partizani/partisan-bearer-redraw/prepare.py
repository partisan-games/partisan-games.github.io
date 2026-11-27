"""Register each redrawn pose to its original bounding box and pack lossless atlases."""
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
VOJNICI = SOURCE.parents[2] / 'game-ready/vojnici'
# Original file stem, original cell size, and rows on the redrawn sprite sheet.
ATLASES = (
    ('partizanski-zastavnik-sprites', 543, 724, (0,)),
    ('partisan-bearer-actions', 128, 88, (1, 3)),
    ('partisan-bearer-hit-sprites', 551, 732, (2,)),
)


def main():
    with Image.open(SOURCE / 'poses.png') as image:
        sheet = image.convert('RGBA')
    for stem, width, height, rows in ATLASES:
        with Image.open(VOJNICI / f'{stem}.webp') as image:
            original = image.convert('RGBA')
        atlas = Image.new('RGBA', original.size)
        assert original.size == (4 * width, len(rows) * height)
        for row, source_row in enumerate(rows):
            for column in range(4):
                x, y = column * width, row * height
                left, top, right, bottom = original.getchannel('A').crop((x, y, x + width, y + height)).getbbox()
                pose = sheet.crop((
                    column * sheet.width // 4, source_row * sheet.height // 4,
                    (column + 1) * sheet.width // 4, (source_row + 1) * sheet.height // 4,
                ))
                pose.putalpha(pose.getchannel('A').point(lambda alpha: 255 if alpha >= 160 else 0))
                pose = pose.crop(pose.getbbox()).resize((right - left, bottom - top), Image.Resampling.NEAREST)
                assert pose.getbbox() == (0, 0, right - left, bottom - top)
                atlas.paste(pose, (x + left, y + top))
        atlas.save(VOJNICI / f'{stem}-redraw.webp', lossless=True, method=6)


if __name__ == '__main__':
    main()
