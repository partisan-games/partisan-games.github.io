"""Compose a separate Hummel firing clip from existing accepted art; never rewrite live atlases."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
TARGET = ROOT / 'assets/images/armies/game-ready/tenkovi/hummel-fire-sprites.png'
HUMMEL = ROOT / 'assets/images/armies/hummel.png'
LIVE = ROOT / 'assets/images/armies/game-ready/tenkovi/hummel-sprites.png'
FX = ROOT / 'assets/images/armies/game-ready/efekti/plamen-pucnja-sprites.png'
SIZE = (384, 176)
ANCHOR = (192, 156)
FRAME_MS = [40, 60, 100, 140, 180, 280]
RECOIL = [2, 5, 6, 4, 2, 0]
MUZZLE = (340, 54)
TUBE = (303, 49, 341, 61)
FX_FRAMES = [0, 1, 2, 3, 3, None]
FX_DRIFT = [(0, 0), (0, 0), (0, 0), (8, -4), (16, -8), (0, 0)]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png(im):
    stream = io.BytesIO()
    im.save(stream, format='PNG')
    return stream.getvalue()


def protect():
    paths = json.loads((HERE / 'protected-inputs.json').read_text(encoding='utf-8'))
    for path, digest in paths.items():
        assert sha(ROOT / path) == digest, 'Existing Hummel changed: ' + path


def ready_frame():
    idle = Image.open(LIVE).convert('RGBA').crop((0, 0, 320, 160))
    original = Image.open(HUMMEL).convert('RGBA')
    accepted = idle.crop((11, 10, 309, 148))
    assert accepted.getchannel('A').tobytes() == original.getchannel('A').tobytes()
    visible_diff = ImageChops.multiply(ImageChops.difference(accepted.convert('RGB'), original.convert('RGB')),
                                      original.getchannel('A').convert('RGB'))
    assert visible_diff.getbbox() is None
    ready = Image.new('RGBA', SIZE)
    ready.paste(idle, (32, 8))
    return idle, ready


def build():
    _, ready = ready_frame()
    tube = ready.crop(TUBE)
    effects = Image.open(FX).convert('RGBA')
    assert effects.size == (192, 48)
    frames = []
    for index, recoil in enumerate(RECOIL):
        frame = ready.copy()
        if recoil:
            frame.paste((0, 0, 0, 0), TUBE)
            frame.alpha_composite(tube, (TUBE[0] - recoil, TUBE[1]))
            # The exposed tube slides into the fixed support; do not move the support or rear gun.
            frame.paste(ready.crop((0, 0, TUBE[0], SIZE[1])), (0, 0))
        if FX_FRAMES[index] is not None:
            col = FX_FRAMES[index]
            effect = effects.crop((col * 48, 0, col * 48 + 48, 48))
            effect.putalpha(effect.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
            effect = effect.resize((60, 60), Image.Resampling.NEAREST)
            drift_x, drift_y = FX_DRIFT[index]
            # Flash/embers follow the muzzle; loose smoke drifts from the discharge point.
            x = MUZZLE[0] - (recoil if index < 3 else 0) - 15 + drift_x
            y = MUZZLE[1] - 30 + drift_y
            frame.alpha_composite(effect, (x, y))
        assert frame.crop((0, 0, 303, 176)).tobytes() == ready.crop((0, 0, 303, 176)).tobytes()
        assert frame.crop((0, 80, 384, 176)).tobytes() == ready.crop((0, 80, 384, 176)).tobytes()
        assert frame.getbbox()[3] == ANCHOR[1]
        assert frame.getbbox()[2] < SIZE[0], 'Muzzle effect clipped'
        assert not any(frame.getchannel('A').histogram()[1:255])
        frames.append(frame)
    assert frames[-1].tobytes() == ready.tobytes()
    assert len({f.tobytes() for f in frames}) == 6
    sheet = Image.new('RGBA', (SIZE[0] * 6, SIZE[1]))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index * SIZE[0], 0))
    return sheet, frames, ready


def metadata(sheet, frames):
    inputs = [('../../hummel.png', HUMMEL), ('../../game-ready/tenkovi/hummel-sprites.png', LIVE),
              ('../../game-ready/efekti/plamen-pucnja-sprites.png', FX),
              ('../franjo-kluz/manifest.json', HERE.parent / 'franjo-kluz/manifest.json'),
              ('../franjo-kluz/hummel-native-generation.json', HERE.parent / 'franjo-kluz/hummel-native-generation.json')]
    return {'schemaVersion': 1, 'generatedWith': 'Mechanical composition of existing accepted Hummel and muzzle-effect pixels',
            'assets': [{
                'id': 'hummel-fire', 'title': 'Hummel: cannon discharge and recoil',
                'image': '../../game-ready/tenkovi/hummel-fire-sprites.png',
                'frame': {'width': 384, 'height': 176, 'columns': 6, 'rows': 1},
                'anchor': {'x': ANCHOR[0], 'y': ANCHOR[1]},
                'groundAnchor': {'x': ANCHOR[0], 'y': ANCHOR[1]}, 'facing': 'right', 'previewScale': .75,
                'reference': 'ready-reference.png', 'referenceSha256': sha(HERE / 'ready-reference.png'),
                'source': '../../hummel.png', 'sourceSha256': sha(HUMMEL),
                'effectSource': '../../game-ready/efekti/plamen-pucnja-sprites.png', 'effectSourceSha256': sha(FX),
                'sha256': hashlib.sha256(png(sheet)).hexdigest(),
                'inputs': [{'path': name, 'sha256': sha(p)} for name, p in inputs],
                'animations': [{
                    'name': 'fire', 'state': 'attack', 'row': 0, 'frameCount': 6, 'duration': .8,
                    'frameDurationsMs': FRAME_MS, 'loop': False,
                    'shot': {'frameIndex': 0, 'atSeconds': 0, 'muzzle': {'x': MUZZLE[0] - RECOIL[0], 'y': MUZZLE[1]},
                             'direction': {'x': 1, 'y': 0}},
                    'end': 'Frame 5 holds the exact ready pose with no flash or smoke.',
                }],
                'packing': {'readyFrame': {'oldCell': [320, 160], 'offset': [32, 8]},
                            'barrelRect': list(TUBE), 'recoilPixels': RECOIL,
                            'muzzleByFrame': [{'x': MUZZLE[0] - r, 'y': MUZZLE[1]} for r in RECOIL],
                            'effectFrames': FX_FRAMES, 'effectSourceCell': [48, 48], 'effectSize': [60, 60],
                            'effectAnchor': [15, 30], 'effectDrift': [list(p) for p in FX_DRIFT],
                            'alphaThreshold': 128, 'filter': 'nearest',
                            'fixed': 'Original hull, three crew, gun mount, flag and stationary tracks. Only exposed barrel and effects vary.'},
                'frameBounds': [list(f.getbbox()) for f in frames],
                'integration': 'Hummel (Vehicle subclass) and VehicleSprite use this clip with a real shell and cannon sound, in Kluz and Storybook. No automatic anti-aircraft controller added.',
                'handoff': {
                    'placement': 'Draw this wider cell at the old Hummel anchor, with the same art scale; padding is +32,+8.',
                    'sizeRule': 'At preview scale .75: cell 288x132, anchor (144,117). Do not stretch the whole new cell into old cell dimensions.',
                    'shot': 'Discharge/projectile event once at action start, not once per displayed frame. Muzzle is in cell pixels.',
                    'motion': 'Stationary fire only. A moving-fire variant would need a separate track layer.',
                    'mirror': 'Mirror actor, muzzle and effects together about anchor.x when facing left.',
                    'death': 'Stop the attack clip and use the existing Hummel wreck; no flash remains after death.',
                    'preview': 'preview.html', 'gif': 'fire.gif',
                },
            }]}


def previews(frames, ready):
    board = Image.new('RGB', (864, 456), '#59634a')
    pen = ImageDraw.Draw(board)
    for index, frame in enumerate([ready, *frames]):
        x, y = index % 3 * 288, index // 3 * 152
        tile = frame.resize((288, 132), Image.Resampling.NEAREST)
        board.paste(tile, (x, y + 20), tile)
        pen.text((x + 7, y + 3), 'Original ready' if index == 0 else f'Fire {index - 1}', fill='#ffdf97')
    board.save(HERE / 'game-size.png')
    scenes = []
    for frame in frames:
        bg = Image.new('RGB', SIZE, '#59634a')
        bg.paste(frame, (0, 0), frame)
        scenes.append(bg.resize((288, 132), Image.Resampling.NEAREST))
    palette = Image.new('RGB', (288 * 6, 132))
    for i, im in enumerate(scenes):
        palette.paste(im, (288 * i, 0))
    palette = palette.quantize(colors=256)
    scenes = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in scenes]
    scenes[0].save(HERE / 'fire.gif', save_all=True, append_images=scenes[1:],
                   duration=FRAME_MS[:-1] + [FRAME_MS[-1] + 1000], loop=0, disposal=2, optimize=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    protect()
    idle, ready = ready_frame()
    if not args.check:
        (HERE / 'idle-reference.png').write_bytes(png(idle))
        (HERE / 'ready-reference.png').write_bytes(png(ready))
    sheet, frames, ready = build()
    record = metadata(sheet, frames)
    template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
    assert template.count('__FIRE_METADATA__') == 1
    html = template.replace('__FIRE_METADATA__', json.dumps(record['assets'][0]))
    if args.check:
        assert TARGET.read_bytes() == png(sheet)
        assert json.loads((HERE / 'sprites.json').read_text(encoding='utf-8')) == record
        assert (HERE / 'ready-reference.png').read_bytes() == png(ready)
        assert (HERE / 'game-size.png').is_file()
        assert (HERE / 'preview.html').read_text(encoding='utf-8') == html
        with Image.open(HERE / 'fire.gif') as gif:
            assert gif.n_frames == 6
            assert [gif.seek(i) or gif.info['duration'] for i in range(6)] == FRAME_MS[:-1] + [1280]
        print('Checked: 6 frames, .8s, exact ready finish, fixed hull/crew/tracks, binary alpha and protected existing art.')
    else:
        TARGET.write_bytes(png(sheet))
        (HERE / 'sprites.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
        previews(frames, ready)
        (HERE / 'preview.html').write_text(html, encoding='utf-8')
        print('Prepared separate Hummel fire atlas, metadata, game-size preview and GIF; runtime unchanged.')
    protect()


if __name__ == '__main__':
    main()
