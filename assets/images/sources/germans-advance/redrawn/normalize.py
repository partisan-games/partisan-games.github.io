"""Prepare new generated drawings at the common side-view game scale; never use idea pixels as runtime art."""
from pathlib import Path
from collections import Counter
from functools import lru_cache
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
DENSITY = 2


@lru_cache(maxsize=None)
def palette_for(kind):
    reference = {
        'backpack': 'assets/images/armies/nemci/vojnici/vojnik-27.png',
        'officer': 'assets/images/armies/nemci/vojnici/vojnik-27.png',
        'rifleman': 'assets/images/armies/nemci/vojnici/vojnik-27.png',
        'gunner': 'assets/images/armies/nemci/vojnici/vojnik-26.png',
        'tank': 'assets/images/armies/panzer3.png',
        'commander': 'assets/images/armies/nemci/vojnici/vojnik-27.png',
    }[kind]
    image = Image.open(ROOT / reference).convert('RGBA')
    colors = Counter(image.getpixel((x, y))[:3] for y in range(image.height - 13)
                     for x in range(image.width) if image.getpixel((x, y))[3] >= 200)
    return [color for color, _ in colors.most_common(32)]


def recolor(image, kind):
    palette = palette_for(kind)
    cache = {}
    for y in range(image.height):
        for x in range(image.width):
            color = image.getpixel((x, y))
            if not color[3]:
                continue
            rgb = color[:3]
            if rgb not in cache:
                cache[rgb] = min(palette, key=lambda p: sum((a-b)**2 for a, b in zip(rgb, p)))
            image.putpixel((x, y), (*cache[rgb], color[3]))
    return image


def solid(image):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda alpha: 255 if alpha >= 200 else 0))
    return image


def fit(image, height, size, left=0, hip_x=None, hip_y=None, kind='rifleman'):
    height, left = round(height * DENSITY), round(left * DENSITY)
    size = tuple(round(value * DENSITY) for value in size)
    if hip_x is not None:
        hip_x, hip_y = round(hip_x * DENSITY), round(hip_y * DENSITY)
    crop = image.crop(image.getbbox())
    factor = height / crop.height
    target = crop.resize((round(crop.width * factor), height), Image.Resampling.NEAREST)
    if hip_x is not None:
        row = [x for x in range(target.width) if target.getpixel((x, hip_y))[3]]
        if row:
            left = max(0, min(size[0] - target.width, round(hip_x - (min(row) + max(row)) / 2)))
    assert target.width + left <= size[0], (target.size, size)
    result = Image.new('RGBA', size)
    result.alpha_composite(target, (left, size[1] - height))
    return recolor(result, kind)


def prepare_sources():
    fit(solid(Image.open(HERE / 'backpack-refined.png')), 69, (80, 69), hip_x=23, hip_y=44, kind='backpack').save(HERE / 'backpack-base.png')
    officer = solid(Image.open(HERE / 'officer-refined.png'))
    cell_width = officer.width // 3
    for index, name in enumerate(['officer', 'officer-half', 'officer-full']):
        cel = officer.crop((index * cell_width, 0, (index + 1) * cell_width, officer.height))
        fit(cel, 69, (80, 69), hip_x=23, hip_y=44, kind='officer').save(HERE / (name + '-base.png'))
    rifleman = solid(Image.open(HERE / 'rifleman-refined.png'))
    w, h = rifleman.size
    standing = rifleman.crop((0, 0, w // 2, h))
    crouching = rifleman.crop((w // 2, 0, w, h))
    fit(standing, 69, (80, 69), hip_x=22, hip_y=44).save(HERE / 'rifleman-base.png')
    # Both figures came from one sheet at a common scale; retain their relative height.
    crouch_height = round(crouching.getbbox()[3] - crouching.getbbox()[1]) * 69 / (standing.getbbox()[3] - standing.getbbox()[1])
    fit(crouching, round(crouch_height), (80, round(crouch_height)), 2).save(HERE / 'crouch-base.png')
    fit(solid(Image.open(HERE / 'gunner-refined.png')), 69, (80, 69), hip_x=23, hip_y=42, kind='gunner').save(HERE / 'gunner-base.png')
    # Only the head and shoulders emerge above the hatch; keep its head at the infantry's pixel scale.
    fit(solid(Image.open(HERE / 'commander-refined.png')), 28, (52, 38), kind='commander').save(HERE / 'commander-base.png')
    tank = solid(Image.open(HERE / 'tank-refined.png'))
    crop = tank.crop(tank.getbbox())
    # Keep thin antennae above the normal hull-height measurement.
    alpha = crop.getchannel('A')
    top = next(y for y in range(crop.height) if sum(alpha.getpixel((x, y)) > 0 for x in range(crop.width)) >= crop.width * .05)
    factor = DENSITY * min(91 / (crop.height - top), 265 / crop.width, 137 / crop.height)
    target = crop.resize((round(crop.width * factor), round(crop.height * factor)), Image.Resampling.NEAREST)
    result = Image.new('RGBA', (271 * DENSITY, 141 * DENSITY))
    result.alpha_composite(target, (0, 141 * DENSITY - target.height))
    recolor(result, 'tank').save(HERE / 'tank-base.png')


if __name__ == '__main__':
    prepare_sources()
