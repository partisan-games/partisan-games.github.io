"""Prepare redrawn field-gun parts and composition preview; do not replace source GIFs or runtime."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
GAME = ROOT / 'assets/images/game-ready/artiljerija'
SOURCES = [GAME / 'top-cev.gif', GAME / 'top-postolje.gif']
BARREL = GAME / 'field-gun-barrel-pixel.png'
CARRIAGE = GAME / 'field-gun-carriage-pixel.png'
WHEEL = {'x': 920, 'y': 595, 'radius': 143}
SCALE = 31.5 / WHEEL['radius']
OFFSET = (round(220.5 - WHEEL['x'] * SCALE), round(64.5 - WHEEL['y'] * SCALE))
JOINT = {'x': 1091 * SCALE + OFFSET[0], 'y': 347 * SCALE + OFFSET[1]}
PIVOT = {'x': 100, 'y': 44}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png(image):
    stream = io.BytesIO()
    image.save(stream, format='PNG')
    return stream.getvalue()


def solid(image):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    return image


def build():
    raw_barrel = Image.open(HERE / 'barrel-generated.png').convert('RGBA')
    raw_carriage = Image.open(HERE / 'carriage-generated.png').convert('RGBA')
    assert raw_barrel.size == raw_carriage.size == (1536, 1024)
    barrel = solid(raw_barrel.crop((78, 382, 1460, 642))).resize((274, 52), Image.Resampling.NEAREST)
    carriage = Image.new('RGBA', (400, 99))
    scaled = solid(raw_carriage).resize((round(1536 * SCALE), round(1024 * SCALE)), Image.Resampling.NEAREST)
    carriage.paste(scaled, OFFSET)
    for part in (barrel, carriage):
        assert not any(part.getchannel('A').histogram()[1:255])
        assert part.getbbox()
    assert carriage.getbbox()[3] <= 98
    assert carriage.crop((285, 0, 400, 99)).getbbox() is None, 'Painted ground/right slab returned'
    assert carriage.crop((0, 97, 400, 99)).getbbox() is None, 'Bottom ground stripe returned'
    # Opaque axle and rim at measured matching source coordinates.
    assert carriage.getpixel((220, 64))[3] == 255
    return barrel, carriage


def layout(barrel, carriage):
    return {
        'schemaVersion': 1,
        'scope': 'Integrated shared gun for both crews in Ustanak and the catalogue, through FieldGun/FieldGunSprite.',
        'pathBase': 'assets/images',
        'parts': {
            'barrel': {
                'src': 'game-ready/artiljerija/field-gun-barrel-pixel.png',
                'width': 274, 'height': 52, 'pivot': PIVOT,
                'muzzle': {'x': 273, 'y': 36}, 'sha256': hashlib.sha256(png(barrel)).hexdigest(),
                'packing': {'source': 'barrel-generated.png', 'crop': [78, 382, 1460, 642], 'output': [274, 52]},
                'bounds': list(barrel.getbbox()),
            },
            'carriage': {
                'src': 'game-ready/artiljerija/field-gun-carriage-pixel.png',
                'width': 400, 'height': 99, 'anchor': {'x': 200, 'y': 49.5},
                'joint': JOINT, 'wheel': {'x': 220.5, 'y': 64.5, 'radius': 31.5}, 'groundY': 96,
                'sha256': hashlib.sha256(png(carriage)).hexdigest(),
                'packing': {'source': 'carriage-generated.png', 'sourceWheel': WHEEL, 'scale': SCALE, 'offset': list(OFFSET)},
                'bounds': list(carriage.getbbox()), 'paintedGround': False,
            },
        },
        'composition': {
            'coordinates': 'Carriage-native pixels; upper assembly rotates about carriage.joint and barrel.pivot.',
            'drawOrder': ['carriage', 'barrel'], 'facing': 'right', 'mirror': 'Mirror the assembled pair together.',
            'nativeGameScale': .75, 'gameBarrelSize': [205.5, 39], 'gameCarriageSize': [300, 74.25],
            'sourceJoint': {'x': 253.33333333333334, 'y': 6.833333333333336},
            'sourceBarrelPivot': {'x': 137, 'y': 26},
            'redrawJoint': JOINT,
            'compatibility': 'File dimensions remain the same; new barrel pivot (100,44) and carriage joint are measured separately. Old centre (137,26) drives rear rail into ground at high elevation. Review pivot, muzzle and silhouette when integrating; do not silently change body/collision geometry.',
            'anglesPreviewedDegrees': [5, 20, 35],
        },
        'handoff': {
            'sourceArtwork': 'The GIFs are source drawings, not the finished target style.',
            'crews': 'Existing partisan/Italian crews remain unchanged; no new crew animation or casualty art in this redraw.',
            'movement': 'Turret elevation and recoil are driven by the body, not painted as duplicate frames.',
            'separateAssets': ['wreck-sprites.json', '../cannon-crew-fall/sprites.json'],
        },
        'inputs': [{'path': str(p.relative_to(HERE)), 'sha256': sha(p)} for p in sorted(HERE.glob('*reference.png'))] +
                  [{'path': name, 'sha256': sha(HERE / name)} for name in
                   ('barrel-generated.png', 'carriage-attempt-01.png', 'carriage-generated.png', 'generation.json')],
        'acceptedSourceHashes': {p.name: sha(p) for p in SOURCES},
    }


def composed(barrel, carriage, degrees):
    canvas = Image.new('RGBA', (500, 260))
    origin = (40, 115)
    canvas.alpha_composite(carriage, origin)
    upper = Image.new('RGBA', canvas.size)
    pivot = (origin[0] + JOINT['x'], origin[1] + JOINT['y'])
    upper.alpha_composite(barrel, (round(pivot[0] - PIVOT['x']), round(pivot[1] - PIVOT['y'])))
    upper = upper.rotate(degrees, resample=Image.Resampling.NEAREST, center=pivot)
    canvas.alpha_composite(upper)
    return canvas


def previews(barrel, carriage):
    board = Image.new('RGBA', (1125, 225), '#59634a')
    draw = ImageDraw.Draw(board)
    for index, angle in enumerate((5, 20, 35)):
        scene = composed(barrel, carriage, angle).resize((375, 195), Image.Resampling.NEAREST)
        # Render one full pair per panel at .75 native scale.
        x = index * 375
        board.alpha_composite(scene, (x, 25))
        draw.text((index * 375 + 9, 5), str(angle) + ' deg', fill='#eed99c')
    board.convert('RGB').save(HERE / 'angles.png')
    combined = composed(barrel, carriage, 5)
    combined.save(HERE / 'assembled.png')
    crews = Image.new('RGBA', (1000, 200), '#59634a')
    draw = ImageDraw.Draw(crews)
    for x, flip, kind in ((40, False, 'partisan'), (540, True, 'italian')):
        tile = composed(barrel, carriage, 20).resize((375, 195), Image.Resampling.NEAREST)
        if flip:
            tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        crews.alpha_composite(tile, (x, 30))
        root = (40 + JOINT['x']) * .75
        root = x + (375 - root if flip else root)
        crew = Image.open(HERE / (kind + '-crew-reference.png')).convert('RGBA').resize((60, 60), Image.Resampling.NEAREST)
        if flip:
            crew = crew.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        crew_y = round(30 + (115 + 96) * .75 - 60 * .965)
        crews.alpha_composite(crew, (round(root + (120 if flip else -120) - 30), crew_y))
        draw.text((x + 120, 5), kind + ' crew', fill='#eed99c')
    crews.convert('RGB').save(HERE / 'composition-game-size.png')
    frames = []
    for angle in list(range(5, 36, 2)) + list(range(35, 4, -2)):
        scene = Image.new('RGBA', (500, 260), '#59634a')
        scene.alpha_composite(composed(barrel, carriage, angle))
        frames.append(scene.resize((375, 195), Image.Resampling.NEAREST).convert('RGB'))
    frames[0].save(HERE / 'aim.gif', save_all=True, append_images=frames[1:], duration=80, loop=0, disposal=2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    source_hashes = [sha(p) for p in SOURCES]
    barrel, carriage = build()
    record = layout(barrel, carriage)
    template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
    assert template.count('__GUN_LAYOUT__') == 1
    html = template.replace('__GUN_LAYOUT__', json.dumps(record, ensure_ascii=False))
    if args.check:
        assert BARREL.read_bytes() == png(barrel)
        assert CARRIAGE.read_bytes() == png(carriage)
        assert json.loads((HERE / 'layout.json').read_text(encoding='utf-8')) == record
        assert (HERE / 'preview.html').read_text(encoding='utf-8') == html
        for angle in (5, 20, 35):
            bound = composed(barrel, carriage, angle).getbbox()
            assert bound and bound[0] > 0 and bound[1] > 0 and bound[2] < 500 and bound[3] < 260
            # No barrel pixels may sink below the wheel contact at these elevations.
            upper = Image.new('RGBA', (500, 260))
            pivot = (40 + JOINT['x'], 115 + JOINT['y'])
            upper.alpha_composite(barrel, (round(pivot[0] - PIVOT['x']), round(pivot[1] - PIVOT['y'])))
            upper = upper.rotate(angle, resample=Image.Resampling.NEAREST, center=pivot)
            assert upper.getbbox()[3] <= 115 + 96, (angle, upper.getbbox())
        print('Checked: separate 274x52/400x99 parts, binary alpha, no ground stripe, axle/joint metadata and unchanged source GIFs.')
    else:
        BARREL.write_bytes(png(barrel)); CARRIAGE.write_bytes(png(carriage))
        (HERE / 'layout.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(barrel, carriage)
        (HERE / 'preview.html').write_text(html, encoding='utf-8')
        print('Prepared redrawn gun parts, aiming preview and measured handoff; source GIFs/runtime unchanged.')
    assert [sha(p) for p in SOURCES] == source_hashes


if __name__ == '__main__':
    main()

