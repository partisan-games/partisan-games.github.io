"""Pack the generated throw only; never rewrite the accepted runtime atlas."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
TARGET = ROOT / 'assets/images/game-ready/vojnici/bombas-throw-sprites.png'
REFERENCE = HERE.parent / 'infantry-art/bombas-standing-reference.png'
ACCEPTED = ROOT / 'assets/images/game-ready/vojnici/bombas-sprites.png'
SOURCE = HERE / 'throw-generated.png'
SIZE = (66, 72)
FRAME_MS = [100, 100, 100, 100, 80, 100, 100, 120]
RELEASE_FRAME = 4
RELEASE_POINT = {'x': 14, 'y': 9}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png_bytes(image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def build():
    source = Image.open(SOURCE).convert('RGBA')
    assert source.size == (1536, 1024), source.size
    frames = []
    for index in range(8):
        x, y = index % 4 * 384, index // 4 * 512
        # One fixed crop and scale for all frames: no per-pose alignment or redrawing.
        cell = source.crop((x + 27, y + 90, x + 357, y + 450))
        # Generated foreground is near-opaque; discard the low-alpha soft halo.
        cell.putalpha(cell.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0))
        cell = cell.resize((64, 70), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', SIZE)
        frame.paste(cell, (1, 0))
        assert not any(frame.getchannel('A').histogram()[1:255])
        assert frame.getbbox() and frame.getbbox()[3] == 70, (index, frame.getbbox())
        assert frame.getbbox()[0] > 0 and frame.getbbox()[2] < 66
        frames.append(frame)
    assert len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}) == 8
    sheet = Image.new('RGBA', (66 * 8, 72))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (66 * index, 0))
    return sheet, frames


def metadata(sheet):
    generation = json.loads((HERE / 'generation.json').read_text(encoding='utf-8'))
    return {
        'schemaVersion': 1,
        'generatedWith': 'Built-in image_gen; deterministic crop, alpha threshold and nearest-neighbour packing',
        'assets': [{
            'id': 'bombas-throw',
            'title': 'Bombas: overarm hand-grenade throw',
            'image': '../../game-ready/vojnici/bombas-throw-sprites.png',
            'frame': {'width': 66, 'height': 72, 'columns': 8, 'rows': 1},
            'anchor': {'x': 33, 'y': 36},
            'groundAnchor': {'x': 33, 'y': 70},
            'source': SOURCE.name, 'sourceSha256': sha(SOURCE),
            'reference': '../infantry-art/bombas-standing-reference.png',
            'referenceSha256': sha(REFERENCE),
            'sha256': hashlib.sha256(png_bytes(sheet)).hexdigest(),
            'animations': [{
                'name': 'throw', 'state': 'attack', 'row': 0, 'frameCount': 8,
                'duration': sum(FRAME_MS) / 1000, 'frameDurationsMs': FRAME_MS, 'loop': False,
                'release': {
                    'frameIndex': RELEASE_FRAME, 'atSeconds': sum(FRAME_MS[:RELEASE_FRAME]) / 1000,
                    'hand': RELEASE_POINT, 'direction': {'x': -1, 'y': 0},
                    'heldBeforeRelease': True, 'emptyHandFromRelease': True,
                },
                'end': 'hold empty-hand frame 7; gameplay owns replenishing the next grenade',
            }],
            'packing': {
                'sourceCanvas': [1536, 1024], 'sourceGrid': [4, 2], 'sourceCell': [384, 512],
                'fixedCrop': [27, 90, 357, 450], 'contentSize': [64, 70], 'contentOffset': [1, 0],
                'alphaThreshold': 128,
                'reason': 'Common fixed scale places every boot on y=70, matching the original visible contact line.',
            },
            'frameBounds': [list(frame.getbbox()) for frame in build()[1]],
            'integration': 'Prepared separate art only. Accepted 3-row atlas, runtime, story and collision bounds unchanged.',
            'handoff': {
                'referenceHeading': 'throw toward screen-left; release hand is in unmirrored cell pixels',
                'worldMapping': 'Consumer maps pose direction to its projection; do not infer velocity from this art.',
                'mirror': 'Reflect the complete actor about anchor.x; reflect release hand by the same transform.',
                'releaseRule': 'Spawn once when action time crosses 0.4s, including a dt that skips frame 4.',
                'cancelRule': 'Cancel before release: no grenade. After release: projectile remains independent.',
                'notImplemented': ['gameplay throwing', 'grenade physics', 'grenade inventory', 'game/stories integration', 'sound'],
            },
        }],
        'inputs': [
            {'path': item['source'], 'sha256': sha(HERE / item['source'])}
            for item in generation['prompts']
        ],
        'acceptedAtlasSha256': sha(ACCEPTED),
        'previewScope': 'Art/timing only. No game physics, damage or owner visual acceptance asserted.',
    }


def previews(frames):
    reference = Image.open(REFERENCE).convert('RGBA')
    strip = Image.new('RGBA', (66 * 9, 92), '#59634a')
    draw = ImageDraw.Draw(strip)
    strip.alpha_composite(reference, (0, 20))
    draw.text((2, 3), 'Original', fill='#ffffff')
    for index, frame in enumerate(frames):
        strip.alpha_composite(frame, (66 * (index + 1), 20))
        draw.text((66 * (index + 1) + 3, 3), str(index + 1) + (' RELEASE' if index == 4 else ''), fill='#ffdd84')
    strip.convert('RGB').save(HERE / 'game-size.png')
    strip.resize((strip.width * 3, strip.height * 3), Image.Resampling.NEAREST).convert('RGB').save(HERE / 'enlarged.png')
    gif = []
    for frame in frames:
        scene = Image.new('RGBA', SIZE, '#59634a')
        scene.alpha_composite(frame)
        gif.append(scene.convert('RGB'))
    gif[0].save(HERE / 'throw.gif', save_all=True, append_images=gif[1:],
                duration=FRAME_MS[:-1] + [FRAME_MS[-1] + 900], loop=0, disposal=2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--right', action='store_true', help='Prepare/check only the separate right throw')
    args = parser.parse_args()
    if args.right:
        import runpy
        runpy.run_path(str(HERE / 'prepare-right.py'))['main'](args.check)
        return
    accepted_hash = sha(ACCEPTED)
    sheet, frames = build()
    record = metadata(sheet)
    # Preserve independently prepared right-throw metadata during a left rebuild.
    current = json.loads((HERE / 'sprites.json').read_text(encoding='utf-8'))
    record['assets'].extend(a for a in current['assets'] if a['id'] == 'bombas-throw-right')
    if args.check:
        assert TARGET.read_bytes() == png_bytes(sheet), 'Packed atlas differs from source recipe'
        existing = json.loads((HERE / 'sprites.json').read_text(encoding='utf-8'))
        assert existing == record, 'Metadata differs from measured recipe/inputs'
        for name in ('game-size.png', 'enlarged.png', 'throw.gif', 'preview.html'):
            assert (HERE / name).is_file(), name
        with Image.open(HERE / 'throw.gif') as gif:
            assert gif.n_frames == 8
        print('Checked: eight distinct 66x72 frames, fixed y=70 floor, binary alpha, release at 0.4s, matching hashes.')
    else:
        TARGET.write_bytes(png_bytes(sheet))
        (HERE / 'sprites.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(frames)
        template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
        assert template.count('__THROW_METADATA__') == 1
        (HERE / 'preview.html').write_text(template.replace('__THROW_METADATA__', json.dumps(record['assets'][0], ensure_ascii=False)), encoding='utf-8')
        print('Prepared separate throw atlas, metadata and previews. Accepted runtime atlas untouched.')
    assert sha(ACCEPTED) == accepted_hash


if __name__ == '__main__':
    main()

