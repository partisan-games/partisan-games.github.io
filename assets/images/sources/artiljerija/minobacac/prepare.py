"""Paint the game-only parts and pack the generated crew poses with clear gutters."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageDraw


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]
INK = '#1e2017'
DARK = '#3b3d2c'
OLIVE = '#596045'
MID = '#747b57'
LIGHT = '#a2a783'


def tube():
    image = Image.new('RGBA', (52, 14))
    paint = ImageDraw.Draw(image)
    paint.polygon([(1, 6), (5, 4), (16, 4), (16, 3), (24, 3), (24, 4),
                   (45, 4), (45, 3), (50, 3), (51, 5), (51, 9), (49, 11),
                   (45, 11), (45, 10), (24, 10), (24, 11), (16, 11),
                   (16, 10), (5, 10), (2, 9)], fill=INK)
    paint.rectangle((5, 5, 48, 9), fill=OLIVE)
    paint.line((6, 5, 48, 5), fill=LIGHT)
    paint.line((5, 9, 49, 9), fill=DARK)
    paint.rectangle((17, 4, 22, 10), fill=MID)
    paint.line((18, 4, 21, 4), fill=LIGHT)
    paint.line((21, 9, 22, 9), fill=DARK)
    paint.polygon([(46, 4), (49, 4), (50, 5), (50, 9), (47, 10), (46, 9)], fill=MID)
    paint.line((50, 5, 50, 8), fill=INK)
    paint.point((3, 7), fill=MID)
    return image


def bipod():
    image = Image.new('RGBA', (29, 28))
    paint = ImageDraw.Draw(image)
    paint.polygon([(12, 3), (16, 3), (11, 12), (7, 25), (3, 25), (5, 19), (9, 9)], fill=INK)
    paint.polygon([(13, 6), (14, 6), (9, 16), (6, 24), (5, 24), (7, 17)], fill=MID)
    paint.polygon([(14, 3), (17, 3), (20, 9), (26, 24), (22, 25), (16, 12)], fill=INK)
    paint.polygon([(16, 6), (17, 6), (24, 23), (23, 24), (19, 16)], fill=OLIVE)
    for x in (2, 21):
        paint.rectangle((x, 24, x + 5, 26), fill=INK)
        paint.line((x + 1, 24, x + 4, 24), fill=OLIVE)
    paint.rounded_rectangle((10, 1, 18, 6), radius=1, fill=INK)
    paint.rectangle((11, 2, 17, 4), fill=MID)
    paint.point((13, 3), fill=LIGHT)
    return image


def plate():
    image = Image.new('RGBA', (37, 13))
    paint = ImageDraw.Draw(image)
    paint.polygon([(2, 6), (8, 4), (30, 4), (35, 7), (36, 9), (33, 12),
                   (4, 12), (0, 10), (0, 8)], fill=INK)
    paint.polygon([(4, 7), (9, 5), (29, 5), (34, 8), (32, 10), (5, 10), (2, 9)], fill=OLIVE)
    paint.line((7, 7, 30, 7), fill=MID)
    paint.rounded_rectangle((13, 3, 23, 8), radius=2, fill=DARK)
    paint.rectangle((16, 5, 20, 7), fill=INK)
    paint.point((13, 7), fill=LIGHT)
    return image


def round_preview():
    image = Image.new('RGBA', (16, 9))
    paint = ImageDraw.Draw(image)
    paint.polygon([(0, 3), (4, 3), (6, 2), (10, 2), (14, 3), (15, 4), (15, 5),
                   (11, 6), (7, 6), (4, 5), (1, 6), (0, 5)], fill=INK)
    paint.polygon([(3, 4), (7, 3), (11, 3), (14, 4), (10, 5), (7, 5)], fill=OLIVE)
    paint.line((6, 3, 11, 3), fill=MID)
    return image


def sprite(source, box):
    art = source.crop(box)
    alpha = art.getchannel('A').point(lambda value: 255 if value >= 128 else 0)
    art.putalpha(alpha)
    return art.crop(alpha.getbbox())


def save(art, path):
    art.save(path, lossless=True, exact=True, method=6)
    with Image.open(path) as webp:
        assert webp.convert('RGBA').tobytes() == art.tobytes()
    return sha256(path.read_bytes()).hexdigest()


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    output = ROOT / data['outputFolder']
    output.mkdir(parents=True, exist_ok=True)
    for spec, draw in zip(data['parts'], (tube, bipod, plate, round_preview), strict=True):
        art = draw()
        art = art.resize((art.width * 2, art.height * 2), Image.Resampling.NEAREST)
        spec['size'] = list(art.size)
        spec['sha256'] = save(art, output / spec['file'])

    crew = data['crew']
    width, height = crew['frame']
    gutter = crew['gutter']
    cols, rows = len(crew['states']), len(crew['factions'])
    step_x, step_y = width + gutter * 2, height + gutter * 2
    atlas = Image.new('RGBA', (step_x * cols, step_y * rows))
    sources = {}
    for filename in {pose['source'] for pose in crew['poses']}:
        p = SOURCE / filename
        with Image.open(p) as image:
            sources[filename] = image.convert('RGBA')
    for pose in crew['poses']:
        art = sprite(sources[pose['source']], pose['crop'])
        ratio = pose['height'] / art.height
        art = art.resize((round(art.width * ratio), pose['height']), Image.Resampling.NEAREST)
        x, y = crew['anchor']
        left = x - round(pose['feetAcross'] * art.width)
        top = y - art.height
        assert left >= 0 and left + art.width <= width and top >= 0 and y <= height, pose
        atlas.paste(art, (pose['column'] * step_x + gutter + left, pose['row'] * step_y + gutter + top), art.getchannel('A'))
        pose['bounds'] = [left, top, left + art.width, y]
    crew['sha256'] = save(atlas, output / crew['file'])
    data['sourceSha256'] = {name: sha256((SOURCE / name).read_bytes()).hexdigest() for name in sorted(sources)}
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
