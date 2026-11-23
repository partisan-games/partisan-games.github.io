"""Replace only the rejected fire row with pixel-locked local recoil."""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
ORIGINAL = ROOT / 'assets/images/sprites/vojnici/okupator-sprite.png'
TARGET = ROOT / 'assets/images/armies/game-ready/vojnici/occupier-sprites.png'
SIZE = 210
FRAME_MS = [100] * 5
# This follows the forearms, hands and gun, excluding shoulders and torso edges.
CONTOUR = [(91, 79), (100, 79), (102, 73), (111, 73), (116, 77),
           (122, 79), (123, 85), (117, 89), (105, 93), (100, 99),
           (97, 111), (95, 122), (90, 122), (92, 100), (86, 97),
           (83, 92), (84, 85)]
OFFSETS = [(0, 0), (0, 3), (0, 1), (1, 2), (0, 0)]
MUZZLE = (106, 77)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def png(image):
    out = io.BytesIO()
    image.save(out, format='PNG', optimize=True)
    return out.getvalue()


def build():
    original = Image.open(ORIGINAL).convert('RGBA')
    assert original.size == (1050, 1050)
    protected = json.loads((HERE / 'occupier-fire-protected-inputs.json').read_text(encoding='utf-8'))
    assert sha(ORIGINAL.read_bytes()) == protected['sourceSha256']
    assert sha(original.tobytes()) == protected['preservedRowsRgbaSha256']
    base = original.crop((840, 210, 1050, 420))
    assert sha(base.tobytes()) == protected['referenceRgbaSha256']
    mask = Image.new('L', (SIZE, SIZE))
    ImageDraw.Draw(mask).polygon(CONTOUR, fill=255)
    mask = ImageChops.multiply(mask, base.getchannel('A').filter(ImageFilter.MinFilter(3)))
    weights = [[0] * SIZE for _ in range(SIZE)]
    inner = mask
    for _ in range(3):
        inner = inner.filter(ImageFilter.MinFilter(3))
        for y in range(SIZE):
            for x in range(SIZE):
                if inner.getpixel((x, y)):
                    weights[y][x] += 1
    source = base.load()
    frames, muzzles = [], []
    for dx, dy in OFFSETS:
        frame = base.copy()
        dest = frame.load()
        # Continuous inverse sampling tapers to zero at the contour. No pasted
        # panels, holes, duplicated hands or sliding torso pieces.
        for y in range(SIZE):
            for x in range(SIZE):
                weight = weights[y][x] / 3
                if weight:
                    dest[x, y] = source[x - round(dx * weight), y - round(dy * weight)]
        mx, my = MUZZLE[0] + dx, MUZZLE[1] + dy
        assert weights[my][mx] == 3, 'Muzzle must follow full displacement'
        assert frame.getpixel((mx, my)) == base.getpixel(MUZZLE)
        muzzles.append({'x': mx, 'y': my})
        diff = ImageChops.difference(frame, base).convert('RGB')
        outside = ImageChops.multiply(diff, ImageChops.invert(mask).convert('RGB'))
        assert not outside.getbbox(), 'Changed pixels outside hands/gun/forearms'
        assert frame.getchannel('A').tobytes() == base.getchannel('A').tobytes()
        for bounds in [(0, 0, SIZE, 65), (0, 135, SIZE, SIZE)]:
            assert frame.crop(bounds).tobytes() == base.crop(bounds).tobytes()
        frames.append(frame)
    assert frames[0].tobytes() == base.tobytes() == frames[4].tobytes()
    assert len({sha(frame.tobytes()) for frame in frames}) == 4
    sheet = Image.new('RGBA', (1050, 1260))
    sheet.paste(original, (0, 0))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (SIZE * i, 1050))
    assert sheet.crop((0, 0, 1050, 1050)).tobytes() == original.tobytes()
    return sheet, base, frames, mask, muzzles


def metadata(sheet, muzzles):
    names = ['nagore', 'nadole', 'nalevo', 'nadesno', 'umire', 'fire']
    animations = [{'name': name, 'row': row, 'frameCount': 5, 'duration': .5,
                   'loop': name != 'umire'} for row, name in enumerate(names)]
    animations[-1].update(frameDurationsMs=FRAME_MS, muzzle=muzzles,
                          end='Frame 4 returns pixel-for-pixel to frame 0.')
    return {'schemaVersion': 1, 'assets': [{
        'id': 'occupier', 'image': '../../game-ready/vojnici/occupier-sprites.png',
        'frame': {'width': SIZE, 'height': SIZE, 'columns': 5, 'rows': 6},
        'anchor': {'x': 105, 'y': 210}, 'animations': animations,
        'source': '../../../sprites/vojnici/okupator-sprite.png',
        'sourceSha256': sha(ORIGINAL.read_bytes()), 'sha256': sha(png(sheet)),
        'preparation': {'script': 'prepare-occupier.py',
                        'reference': {'row': 1, 'column': 4},
                        'method': 'Nearest-pixel local deformation of original hands, forearms and MP40; no generated torso patch.',
                        'motionContour': CONTOUR, 'offsetsPixels': OFFSETS,
                        'maximumDisplacementPixels': 3,
                        'locked': 'First five rows, head, torso outline, legs, boots, alpha silhouette, anchor and floor.',
                        'effects': 'No embedded flash/smoke; muzzle coordinates are cell pixels.',
                        'generationAttempt': 'occupier-fire-replacement-attempt.json'},
        'integration': 'OccupierSprite uses this fire loop and per-frame muzzle coordinates in Otpisani and the catalogue; owner visual review remains open.',
    }]}


def gif(frames):
    # Shared palette also prevents stationary pixels changing color in the GIF.
    strip = Image.new('RGB', (sum(f.width for f in frames), SIZE), '#687261')
    left = 0
    for frame in frames:
        strip.paste(frame, (left, 0), frame)
        left += frame.width
    palette = strip.quantize(colors=256)
    encoded = []
    for frame in frames:
        scene = Image.new('RGB', frame.size, '#687261')
        scene.paste(frame, (0, 0), frame)
        encoded.append(scene.quantize(palette=palette, dither=Image.Dither.NONE))
    out = io.BytesIO()
    encoded[0].save(out, format='GIF', save_all=True, append_images=encoded[1:],
                    duration=FRAME_MS, loop=0, disposal=2, optimize=False)
    return out.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    sheet, base, frames, mask, muzzles = build()
    comparisons = []
    strip = Image.new('RGBA', (SIZE * 6, SIZE))
    strip.paste(base, (0, 0))
    for i, frame in enumerate(frames):
        comparison = Image.new('RGBA', (SIZE * 2, SIZE))
        comparison.paste(base, (0, 0))
        comparison.paste(frame, (SIZE, 0))
        comparisons.append(comparison)
        strip.paste(frame, (SIZE * (i + 1), 0))
    record = metadata(sheet, muzzles)
    asset = record['assets'][0]
    fire = asset['animations'][5]
    runtime = {'frame': asset['frame'], 'anchor': asset['anchor'],
               'fire': {key: fire[key] for key in ('row', 'duration', 'muzzle')}}
    runtime_js = re.sub(r'"(\w+)":', r'\1:', json.dumps(runtime, indent=2))
    template = (HERE / 'occupier-preview.template.html').read_text(encoding='utf-8')
    assert template.count('__OCCUPIER_METADATA__') == 1
    assert "flash.src='../../../pucanje.png'" in template
    with Image.open(HERE / '../../../pucanje.png') as flash:
        assert flash.size == (19, 21)
    outputs = {
        TARGET: png(sheet),
        HERE / 'occupier-sprites.json': (json.dumps(record, ensure_ascii=False, indent=2) + '\n').encode('utf-8'),
        HERE / 'previews/occupier-fire.gif': gif(frames),
        HERE / 'previews/occupier-fire-comparison.gif': gif(comparisons),
        HERE / 'previews/occupier-fire-game-size.png': png(strip),
        HERE / 'previews/occupier-fire-motion-mask.png': png(mask),
        HERE / 'occupier-preview.html': template.replace('__OCCUPIER_METADATA__', json.dumps(record['assets'][0], ensure_ascii=False)).encode('utf-8'),
        ROOT / 'core/actor/occupierArt.js': ('// Generated by prepare-occupier.py; measured atlas and per-frame muzzle coordinates.\nexport default '
                                            + runtime_js + '\n').encode('utf-8'),
    }
    for path, data in outputs.items():
        if args.check:
            assert path.read_bytes() == data, f'Output differs from recipe: {path.name}'
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    for path in (HERE / 'previews/occupier-fire.gif', HERE / 'previews/occupier-fire-comparison.gif'):
        with Image.open(path) as animation:
            assert animation.n_frames == 5
            assert [animation.seek(i) or animation.info['duration'] for i in range(5)] == FRAME_MS
    with Image.open(HERE / 'previews/occupier-fire.gif') as animation:
        animation.seek(0)
        first = animation.convert('RGB')
        for i in range(5):
            animation.seek(i)
            decoded = animation.convert('RGB')
            outside = ImageChops.multiply(ImageChops.difference(decoded, first), ImageChops.invert(mask).convert('RGB'))
            assert not outside.getbbox(), 'GIF palette changed stationary pixels'
        assert decoded.tobytes() == first.tobytes()
    print(('Checked' if args.check else 'Prepared') + ': 5 frames, .5s, exact return; only hands/gun/forearms differ; original rows, head, silhouette and boots identical.')


if __name__ == '__main__':
    main()
