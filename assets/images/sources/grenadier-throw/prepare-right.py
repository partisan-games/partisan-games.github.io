"""Pack generated right-throw arm layers over the unchanged accepted standing pose."""
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
TARGET = ROOT / 'assets/images/game-ready/vojnici/bombas-throw-right-sprites.png'
ACCEPTED = ROOT / 'assets/images/game-ready/vojnici/bombas-sprites.png'
SOURCE = HERE / 'throw-right-generated.png'
FRAME_MS = [100, 100, 100, 100, 80, 100, 100, 120]
SIZE = (66, 72)
# Generated cells 2, 3, 6, 7 drifted 35 source pixels left; register arms by the fixed head.
SOURCE_X_OFFSETS = [0, 0, -35, -35, 0, 0, -35, -35]
GRENADE_CROP = (0, 9, 9, 20)
GRENADE_OFFSETS = {1: (8, 5), 2: (14, 0), 3: (15, 0)}
GENERATED_GRENADE_BOUNDS = {1: (13, 8, 19, 14), 2: (20, 3, 26, 9), 3: (20, 3, 26, 9)}
# Selection masks isolate generated arm pixels, never generated bodies or boots.
ARM_POLYGONS = [
    None,
    [(0, 0), (27, 0), (27, 13), (30, 14), (30, 26), (0, 29)],
    [(0, 0), (27, 0), (27, 13), (30, 14), (30, 25), (0, 28)],
    [(0, 0), (27, 0), (27, 13), (30, 14), (30, 25), (0, 28)],
    [(0, 0), (56, 0), (56, 7), (32, 9), (30, 27), (0, 27)],
    [(0, 12), (65, 12), (65, 21), (31, 21), (30, 27), (0, 27)],
    [(0, 12), (30, 12), (30, 24), (17, 36), (0, 36)],
    [(0, 12), (30, 12), (30, 26), (0, 29)],
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png_bytes(im):
    stream = io.BytesIO()
    im.save(stream, format='PNG')
    return stream.getvalue()


def build():
    idle = Image.open(ACCEPTED).convert('RGBA').crop((0, 0, *SIZE))
    assert idle.tobytes() == Image.open(HERE / 'right-idle-reference.png').convert('RGBA').tobytes()
    source = Image.open(SOURCE).convert('RGBA')
    assert source.size == (1536, 1024)
    # Keep the accepted palette. Quantization changes colors only, not the drawn arm pose.
    palette = sorted({p[:3] for p in idle.getdata() if p[3] == 255})
    color_map = {}
    frames = [idle.copy()]
    for index in range(1, 8):
        x, y = index % 4 * 384 + SOURCE_X_OFFSETS[index], index // 4 * 512
        arm = source.crop((x + 27, y + 90, x + 357, y + 450)).resize(SIZE, Image.Resampling.NEAREST)
        selection = Image.new('L', SIZE)
        ImageDraw.Draw(selection).polygon(ARM_POLYGONS[index], fill=255)
        alpha = arm.getchannel('A').point(lambda a: 255 if a >= 240 else 0)
        arm.putalpha(ImageChops.multiply(alpha, selection))
        pixels = []
        for r, g, b, a in arm.getdata():
            color = (r, g, b)
            if a and color not in color_map:
                color_map[color] = min(palette, key=lambda p: sum((p[i] - color[i]) ** 2 for i in range(3)))
            pixels.append((*color_map[color], 255) if a else (0, 0, 0, 0))
        arm.putdata(pixels)
        if index in GRENADE_OFFSETS:
            # Reuse the accepted stick grenade rather than the generated round variant.
            arm.paste((0, 0, 0, 0), GENERATED_GRENADE_BOUNDS[index])
            arm.alpha_composite(idle.crop(GRENADE_CROP), GRENADE_OFFSETS[index])
        if index == 5:
            # Lower the drawn follow-through forearm so it clears the fixed rifle hand.
            arm = arm.rotate(-20, Image.Resampling.NEAREST, center=(29, 17))
        frame = idle.copy()
        # Remove the resting throwing arm; the accepted torso begins at x=30.
        frame.paste((0, 0, 0, 0), (0, 0, 30, 28))
        frame.alpha_composite(arm)
        # Original head and rifle stay in front of the throwing arm where they overlap.
        frame.alpha_composite(idle.crop((30, 0, 44, 14)), (30, 0))
        frame.alpha_composite(idle.crop((44, 0, 66, 31)), (44, 0))
        assert frame.crop((0, 36, 66, 72)).tobytes() == idle.crop((0, 36, 66, 72)).tobytes()
        for px in range(30, 44):
            for py in range(14):
                if idle.getpixel((px, py))[3]:
                    assert frame.getpixel((px, py)) == idle.getpixel((px, py))
        assert frame.getbbox()[3] == 70
        assert set(frame.getchannel('A').getdata()) == {0, 255}
        frames.append(frame)
    assert len({f.tobytes() for f in frames}) == 8
    sheet = Image.new('RGBA', (528, 72))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (i * 66, 0))
    return sheet, frames


def metadata(sheet, frames):
    generation = json.loads((HERE / 'right-generation.json').read_text(encoding='utf-8'))
    return {
        'id': 'bombas-throw-right', 'title': 'Bombas: screen-right overarm throw without turning',
        'image': '../../game-ready/vojnici/bombas-throw-right-sprites.png',
        'frame': {'width': 66, 'height': 72, 'columns': 8, 'rows': 1},
        'anchor': {'x': 33, 'y': 36}, 'groundAnchor': {'x': 33, 'y': 70},
        'source': SOURCE.name, 'sourceSha256': sha(SOURCE),
        'reference': 'right-idle-reference.png', 'referenceSha256': sha(HERE / 'right-idle-reference.png'),
        'referenceAtlas': '../../game-ready/vojnici/bombas-sprites.png', 'referenceAtlasSha256': sha(ACCEPTED),
        'generationReference': 'right-layout-reference.png', 'generationReferenceSha256': sha(HERE / 'right-layout-reference.png'),
        'sha256': hashlib.sha256(png_bytes(sheet)).hexdigest(),
        'generation': 'right-generation.json', 'generationSha256': sha(HERE / 'right-generation.json'),
        'inputs': [{'path': p['source'], 'sha256': sha(HERE / p['source'])} for p in generation['prompts']],
        'animations': [{
            'name': 'throw', 'state': 'attack', 'row': 0, 'frameCount': 8,
            'duration': 0.8, 'frameDurationsMs': FRAME_MS, 'loop': False,
            'release': {'frameIndex': 4, 'atSeconds': 0.4, 'hand': {'x': 48, 'y': 3},
                        'direction': {'x': 1, 'y': 0}, 'heldBeforeRelease': True, 'emptyHandFromRelease': True},
            'end': 'hold empty-hand frame 7; gameplay owns replenishing the next grenade',
        }],
        'packing': {'sourceCanvas': [1536, 1024], 'sourceGrid': [4, 2], 'sourceCell': [384, 512],
                    'fixedCrop': [27, 90, 357, 450], 'contentSize': [66, 72], 'alphaThreshold': 240,
                    'sourceCellXOffsets': SOURCE_X_OFFSETS,
                    'armSelectionPolygons': [None if p is None else [list(point) for point in p] for p in ARM_POLYGONS],
                    'palette': 'accepted standing sprite',
                    'followThroughArmTransform': {'frameIndex': 5, 'clockwiseDegrees': 20, 'pivot': [29, 17]},
                    'heldGrenade': {'referenceCrop': list(GRENADE_CROP),
                                    'frameOffsets': {str(k): list(v) for k, v in GRENADE_OFFSETS.items()},
                                    'removedGeneratedBounds': {str(k): list(v) for k, v in GENERATED_GRENADE_BOUNDS.items()}},
                    'fixedLayers': 'Original head, rifle, torso and boots; original frame 0 copied exactly.'},
        'frameBounds': [list(f.getbbox()) for f in frames],
        'integration': 'GrenadierSprite uses this atlas in Bunker and the catalogue; standing, walking and throwing share the same body-facing mirror.',
        'handoff': {'referenceHeading': 'screen-right throw, same body orientation as standing',
                    'mirror': 'Do not mirror this animation to implement a right throw.',
                    'releaseRule': 'Spawn once when action time crosses 0.4s; hand coordinates are cell pixels.',
                    'preview': 'right-preview.html', 'gif': 'throw-right.gif'},
    }


def previews(frames):
    strip = Image.new('RGB', (594, 92), '#59634a')
    draw = ImageDraw.Draw(strip)
    for i, frame in enumerate([frames[0], *frames]):
        strip.paste(frame, (i * 66, 20), frame)
        draw.text((i * 66 + 2, 3), 'Idle' if i == 0 else str(i - 1) + (' OUT' if i == 5 else ''), fill='white')
    strip.save(HERE / 'right-game-size.png')
    strip.resize((1782, 276), Image.Resampling.NEAREST).save(HERE / 'right-enlarged.png')
    scenes = []
    for f in frames:
        bg = Image.new('RGB', SIZE, '#59634a')
        bg.paste(f, (0, 0), f)
        scenes.append(bg)
    scenes[0].save(HERE / 'throw-right.gif', save_all=True, append_images=scenes[1:],
                   duration=FRAME_MS[:-1] + [1020], loop=0, disposal=2)


def check_existing_art(record):
    baseline = json.loads((HERE / 'right-baseline.json').read_text(encoding='utf-8'))
    for name, digest in baseline['files'].items():
        if name.startswith('assets/'):
            path = ROOT / name
            original = path.read_bytes()
            normalized = original.replace(b'\r\n', b'\n') if path.suffix in ['.json', '.html', '.js'] else original
            assert sha(path) == digest or hashlib.sha256(normalized).hexdigest() == digest, 'Protected existing art changed: ' + name
    left = next(a for a in record['assets'] if a['id'] == 'bombas-throw')
    digest = hashlib.sha256(json.dumps(left, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    assert digest == baseline['leftEntrySha256'], 'Existing left-throw metadata changed'


def main(check=False):
    sheet, frames = build()
    entry = metadata(sheet, frames)
    path = HERE / 'sprites.json'
    record = json.loads(path.read_text(encoding='utf-8'))
    check_existing_art(record)
    if check:
        assert TARGET.read_bytes() == png_bytes(sheet)
        assert next(a for a in record['assets'] if a['id'] == entry['id']) == entry
        for name in ('right-game-size.png', 'right-enlarged.png', 'right-preview.html', 'throw-right.gif'):
            assert (HERE / name).is_file(), name
        with Image.open(HERE / 'throw-right.gif') as gif:
            assert gif.n_frames == 8
            assert [gif.seek(i) or gif.info['duration'] for i in range(8)] == FRAME_MS[:-1] + [1020]
        print('Right throw checked: exact idle frame, fixed head/boots, binary alpha, 8 frames, release at 0.4s.')
    else:
        TARGET.write_bytes(png_bytes(sheet))
        record['assets'] = [a for a in record['assets'] if a['id'] != entry['id']] + [entry]
        path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(frames)
        template = (HERE / 'right-preview.template.html').read_text(encoding='utf-8')
        (HERE / 'right-preview.html').write_text(template.replace('__RIGHT_METADATA__', json.dumps(entry)), encoding='utf-8')
        print('Prepared right throw without changing existing atlases or left previews.')
    check_existing_art(record)


if __name__ == '__main__':
    import sys
    main('--check' in sys.argv)
