"""Pack painted armor impacts and the final wreck at the live tank's scale."""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


SOURCE = Path(__file__).resolve().parent
TARGET = SOURCE.parents[2] / 'game-ready/tenkovi'
GUTTER = 4
# Each impact pairs a crop from the drawn damage with its position on the live armor.
TANKS = {
    'panzer-iii': {
        'size': (542, 282),
        'wreck': (0, 52, 454, 282),
        'stray_antenna': (457, 0, 463, 249),
        'impacts': [((406, 345, 493, 421), (181, 148, 227, 188)),
                    ((548, 355, 620, 416), (256, 154, 294, 187))],
    },
    't34-85': {
        'size': (672, 240),
        'wreck': (16, 4, 628, 232),
        'impacts': [((399, 267, 506, 346), (251, 54, 317, 104)),
                    ((454, 352, 542, 424), (286, 103, 341, 147))],
    },
}


def place(image, box):
    return image.resize((box[2] - box[0], box[3] - box[1]), Image.Resampling.NEAREST)


def pack(name, layout):
    with Image.open(SOURCE / f'{name}.png') as image:
        sheet = image.convert('RGBA')
    width, height = layout['size']
    stride = width + 2 * GUTTER
    atlas = Image.new('RGBA', (2 * stride, height + 2 * GUTTER))
    for crop, box in layout['impacts']:
        patch = place(sheet.crop(crop), box)
        mask = Image.new('L', patch.size)
        ImageDraw.Draw(mask).ellipse((4, 4, patch.width - 5, patch.height - 5), fill=255)
        patch.putalpha(ImageChops.multiply(patch.getchannel('A'), mask.filter(ImageFilter.GaussianBlur(2))))
        atlas.alpha_composite(patch, (GUTTER + box[0], GUTTER + box[1]))

    wreck = sheet.crop((sheet.width // 2, 0, sheet.width, sheet.height))
    wreck.putalpha(wreck.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0))
    box = layout['wreck']
    bounds = wreck.getbbox()
    if 'stray_antenna' in layout:
        ImageDraw.Draw(wreck).rectangle(layout['stray_antenna'], fill=(0, 0, 0, 0))
    wreck = place(wreck.crop(bounds), box)
    atlas.paste(wreck, (stride + GUTTER + box[0], GUTTER + box[1]))
    atlas.save(TARGET / f'{name}-damage.webp', lossless=True, method=6)


if __name__ == '__main__':
    for name, layout in TANKS.items():
        pack(name, layout)
