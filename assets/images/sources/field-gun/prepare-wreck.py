"""Pack the field-gun wreck into the live composition's coordinate system; art only."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
TARGET = ROOT / 'assets/images/game-ready/wrecks/field-gun.png'
SOURCE = HERE / 'wreck-generated.png'
SIZE = (500, 260)
CROP = (18, 122, 1518, 902)
ANCHOR = (240, 164.5)
GROUND_Y = 211
SCALE = .75


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png(im):
    stream = io.BytesIO()
    im.save(stream, format='PNG')
    return stream.getvalue()


def check_protected():
    protected = json.loads((HERE / 'wreck-protected-inputs.json').read_text(encoding='utf-8'))
    for path, digest in protected.items():
        assert sha(ROOT / path) == digest, 'Existing gun changed: ' + path


def build():
    source = Image.open(SOURCE).convert('RGBA')
    assert source.size == (1536, 1024)
    cell = source.crop(CROP)
    cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    cell = cell.resize(SIZE, Image.Resampling.NEAREST)
    wreck = Image.new('RGBA', SIZE)
    wreck.paste(cell, (0, 0), cell)
    bounds = wreck.getbbox()
    assert bounds and bounds[0] > 0 and bounds[1] > 0 and bounds[2] < SIZE[0]
    assert bounds[3] == GROUND_Y + 1, bounds
    assert not any(wreck.getchannel('A').histogram()[1:255])
    assert wreck.crop((0, GROUND_Y + 1, *SIZE)).getbbox() is None
    assert sum(wreck.getpixel((x, GROUND_Y))[3] > 0 for x in range(SIZE[0])) < 120, 'Painted ground stripe'
    return wreck


def flipped(im):
    # Mirror about the carriage anchor, not the centre of the padded image.
    out = Image.new('RGBA', SIZE)
    out.paste(im.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (int(2 * ANCHOR[0] - SIZE[0]), 0))
    return out


def preview(wreck):
    live = Image.open(HERE / 'assembled.png').convert('RGBA')
    assert live.size == SIZE
    board = Image.new('RGB', (750, 430), '#59634a')
    pen = ImageDraw.Draw(board)
    for row, mirror in enumerate((False, True)):
        for col, im in enumerate((live, wreck)):
            if mirror:
                im = flipped(im)
            tile = im.resize((375, 195), Image.Resampling.NEAREST)
            board.paste(tile, (col * 375, row * 215 + 20), tile)
            pen.text((col * 375 + 12, row * 215 + 5),
                     ('Wreck' if col else 'Intact') + (' / left' if mirror else ' / right'), fill='#ffdf97')
    return board


def metadata(wreck):
    generation = json.loads((HERE / 'wreck-generation.json').read_text(encoding='utf-8'))
    return {'schemaVersion': 1, 'generatedWith': 'Built-in image_gen; fixed crop, alpha threshold, nearest-neighbour packing',
            'assets': [{
                'id': 'field-gun-wreck', 'title': 'Shared field gun: destroyed',
                'image': '../../game-ready/wrecks/field-gun.png',
                'frame': {'width': 500, 'height': 260, 'columns': 1, 'rows': 1},
                'anchor': {'x': ANCHOR[0], 'y': ANCHOR[1]},
                'groundAnchor': {'x': ANCHOR[0], 'y': GROUND_Y}, 'baseline': GROUND_Y,
                'frameBounds': [list(wreck.getbbox())], 'facing': 'right',
                'animations': [{'name': 'dead', 'state': 'dead', 'row': 0, 'frameCount': 1, 'duration': 1, 'loop': False}],
                'source': SOURCE.name, 'sourceSha256': sha(SOURCE),
                'reference': 'assembled.png', 'referenceSha256': sha(HERE / 'assembled.png'),
                'generation': 'wreck-generation.json', 'generationSha256': sha(HERE / 'wreck-generation.json'),
                'sha256': hashlib.sha256(png(wreck)).hexdigest(),
                'inputs': [{'path': r['path'], 'sha256': sha(HERE / r['path'])} for r in generation['references']],
                'packing': {'sourceCanvas': [1536, 1024], 'crop': list(CROP), 'output': list(SIZE),
                            'alphaThreshold': 128, 'filter': 'nearest', 'sourceGuideScale': 3, 'sourceGuideOffset': [18, 122]},
                'integration': 'FieldGunSprite uses this wreck in Ustanak and both existing gun stories; owner visual review remains separate.',
                'handoff': {
                    'coordinates': 'Same 500x260 space as assembled.png; carriage origin (40,115).',
                    'carriageAnchor': {'x': 200, 'y': 49.5},
                    'nativeGameScale': SCALE, 'gameSize': [375, 195],
                    'gameGroundBelowAnchor': (GROUND_Y - ANCHOR[1]) * SCALE,
                    'draw': 'Translate to the live carriage anchor, scale by facing and game scale, draw at (-240,-164.5).',
                    'deadLayers': 'Replace both carriage and barrel with this one image. Stop drawing/rotating the live barrel.',
                    'crews': 'One shared gun model for partisan and Italian crews; crews and their fall remain separate.',
                    'effects': 'Static wreck holds. Smoke/fire are separate effects; no baked people or ground.',
                    'backgrounds': 'May also be placed as a separate battlefield prop after owner review.',
                    'preview': 'wreck-preview.html',
                },
            }]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    check_protected()
    wreck = build()
    record = metadata(wreck)
    board = preview(wreck)
    template = (HERE / 'wreck-preview.template.html').read_text(encoding='utf-8')
    assert template.count('__WRECK_METADATA__') == 1
    html = template.replace('__WRECK_METADATA__', json.dumps(record['assets'][0]))
    if args.check:
        assert TARGET.read_bytes() == png(wreck)
        assert json.loads((HERE / 'wreck-sprites.json').read_text(encoding='utf-8')) == record
        assert (HERE / 'wreck-game-size.png').read_bytes() == png(board)
        assert (HERE / 'wreck-preview.html').read_text(encoding='utf-8') == html
        assert flipped(flipped(wreck)).tobytes() == wreck.tobytes(), 'Mirroring clips art'
        print('Checked: 500x260, binary alpha, matching floor/anchor, both directions, hashes and intact gun unchanged.')
    else:
        TARGET.write_bytes(png(wreck))
        (HERE / 'wreck-sprites.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
        (HERE / 'wreck-game-size.png').write_bytes(png(board))
        (HERE / 'wreck-preview.html').write_text(html, encoding='utf-8')
        print('Prepared separate field-gun wreck and game-size comparison. Runtime and intact parts unchanged.')
    check_protected()


if __name__ == '__main__':
    main()
