"""Prepare stationary BP-42 recoil using accepted pixels, with a separate muzzle-effect layer."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
LIVE = ROOT / 'assets/images/armies/game-ready/vozovi/bp42-sprites.png'
FX = ROOT / 'assets/images/armies/game-ready/efekti/plamen-pucnja-sprites.png'
TARGET = ROOT / 'assets/images/armies/game-ready/vozovi/bp42-fire-sprites.png'
SIZE = (704, 256)
OFFSET = (64, 0)
ANCHOR = (352, 232)
MUZZLE = (75, 57)
FRAME_MS = [60, 80, 100, 140, 180, 240]
RECOIL = [0, 6, 5, 3, 1, 0]
FX_MS = [40, 60, 100, 140]
SCALE = .7
TILE = (512, 212)


def png(image):
    out = io.BytesIO()
    image.save(out, format='PNG')
    return out.getvalue()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def protect():
    for path, digest in json.loads((HERE / 'protected-inputs.json').read_text(encoding='utf-8')).items():
        assert sha(ROOT / path) == digest, 'Protected input changed: ' + path


def build():
    live = Image.open(LIVE).convert('RGBA')
    assert live.size == (2304, 512)
    idle = live.crop((0, 0, 576, 256))
    ready = Image.new('RGBA', SIZE)
    ready.paste(idle, OFFSET)
    # Only the exposed tube/brake retracts. The two recoil cylinders, collar,
    # turret and armor remain in place and occlude the entering barrel.
    mask = Image.new('L', SIZE)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((72, 44, 139, 68), fill=255)
    draw.rectangle((140, 50, 162, 62), fill=255)
    source = ready.load()
    frames = []
    for recoil in RECOIL:
        frame = ready.copy()
        if recoil:
            dest = frame.load()
            for y in range(44, 69):
                for x in range(72, 163):
                    if mask.getpixel((x, y)):
                        sx = x - recoil
                        dest[x, y] = source[sx, y] if sx >= 0 and mask.getpixel((sx, y)) else (0, 0, 0, 0)
        diff = ImageChops.difference(frame, ready)
        for channel in diff.split():
            assert not ImageChops.multiply(channel, ImageChops.invert(mask)).getbbox()
        assert frame.crop((163, 0, 704, 256)).tobytes() == ready.crop((163, 0, 704, 256)).tobytes()
        assert frame.crop((0, 80, 704, 256)).tobytes() == ready.crop((0, 80, 704, 256)).tobytes()
        assert frame.getbbox()[3] == 233
        frames.append(frame)
    assert frames[0].tobytes() == frames[-1].tobytes() == ready.tobytes()
    assert len({f.tobytes() for f in frames}) == 5
    sheet = Image.new('RGBA', (SIZE[0] * 6, SIZE[1]))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (SIZE[0] * i, 0))
    return sheet, frames, idle, ready, mask


def effect_frame(seconds):
    end = 0
    for i, ms in enumerate(FX_MS):
        end += ms / 1000
        if seconds < end:
            return i
    return None


def with_effect(frame, index, seconds):
    result = frame.copy()
    fx_index = effect_frame(seconds)
    if fx_index is None:
        return result
    effects = Image.open(FX).convert('RGBA')
    effect = effects.crop((fx_index * 48, 0, fx_index * 48 + 48, 48))
    effect.putalpha(effect.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    effect = effect.resize((60, 60), Image.Resampling.NEAREST).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    # Flash follows the muzzle; smoke drifts from the discharge, independently of recoil.
    mx = MUZZLE[0] + RECOIL[index] if fx_index < 2 else MUZZLE[0] - (fx_index - 1) * 5
    my = MUZZLE[1] if fx_index < 2 else MUZZLE[1] - (fx_index - 1) * 4
    result.alpha_composite(effect, (mx - 45, my - 30))
    assert result.getbbox()[0] > 0 and result.getbbox()[2] < SIZE[0]
    assert result.crop((0, 80, 704, 256)).tobytes() == frame.crop((0, 80, 704, 256)).tobytes()
    return result


def metadata(sheet, frames):
    muzzle = [{'x': MUZZLE[0] + r, 'y': MUZZLE[1]} for r in RECOIL]
    return {'schemaVersion': 1, 'preparedWith': 'Existing accepted BP-42 pixels and a separate existing muzzle effect', 'assets': [{
        'id': 'bp42-fire', 'title': 'BP-42: stationary cannon recoil',
        'image': '../../game-ready/vozovi/bp42-fire-sprites.png',
        'frame': {'width': 704, 'height': 256, 'columns': 6, 'rows': 1},
        'anchor': {'x': 352, 'y': 232}, 'groundAnchor': {'x': 352, 'y': 232},
        'facing': 'left', 'previewScale': SCALE,
        'source': '../../game-ready/vozovi/bp42-sprites.png', 'sourceSha256': sha(LIVE),
        'reference': 'ready-reference.png', 'referenceSha256': sha(HERE / 'ready-reference.png'),
        'preparation': 'preparation.json', 'preparationSha256': sha(HERE / 'preparation.json'),
        'sha256': hashlib.sha256(png(sheet)).hexdigest(),
        'animations': [{'name': 'fire', 'state': 'attack', 'row': 0, 'frameCount': 6,
                        'distinctFrames': 5, 'duration': .8, 'frameDurationsMs': FRAME_MS, 'loop': False,
                        'muzzle': muzzle,
                        'shot': {'frameIndex': 0, 'atSeconds': 0, 'muzzle': muzzle[0], 'direction': {'x': -1, 'y': 0}},
                        'end': 'Hold frame 5, pixel-identical to ready. No embedded flash or smoke.'}],
        'packing': {'oldCell': [576, 256], 'offset': list(OFFSET),
                    'oldAnchor': [288, 232], 'sourceBodyBounds': [10, 21, 568, 233],
                    'bodyBounds': [74, 21, 632, 233],
                    'recoilPixelsTowardMount': RECOIL, 'motionMask': 'barrel-mask.png',
                    'fixed': 'Hull, turret, fixed recoil cylinders/collar, hatches, markings and wheels.',
                    'alpha': 'Existing accepted source alpha preserved exactly outside the barrel mask; no whole-body thresholding.',
                    'filter': 'nearest'},
        'separateEffect': {'image': '../../game-ready/efekti/plamen-pucnja-sprites.png',
                           'sha256': sha(FX), 'sourceCell': [48, 48], 'frameDurationsMs': FX_MS,
                           'size': [60, 60], 'anchor': [45, 30], 'mirrorSource': True,
                           'alphaThreshold': 128, 'previewSmokeDriftPerPhase': [-5, -4],
                           'rule': 'One discharge at action start. Flash follows muzzle during first 100ms; smoke drifts from shot origin and disappears at 340ms.'},
        'frameBounds': [list(frame.getbbox()) for frame in frames],
        'handoff': {'scope': 'Prepared art for owner review; no runtime, mission AI or catalogue changes.',
                    'placement': 'Keep original art scale and source body bounds. Old (288,232) anchor becomes (352,232) after +64px left padding. Existing anchor screen x is body center x minus one source pixel times artScale; y is body feet. Never refit scale to each recoiling frame or squeeze the wider cell into the old width.',
                    'mirror': 'Mirror body, muzzle and separate effects together about anchor.x. Native facing is left.',
                    'shot': 'Spawn one projectile on crossing t=0, not once per frame. Muzzle coordinates are cell pixels.',
                    'movement': 'Stationary attack only; drive frames are unchanged.',
                    'death': 'Cancel recoil/flash, use the existing BP-42 wreck and existing effects.',
                    'preview': 'preview.html', 'gif': 'fire.gif'},
    }]}


def previews(frames, ready):
    board = Image.new('RGB', (TILE[0] * 3, TILE[1] * 3), '#59634a')
    pen = ImageDraw.Draw(board)
    decorated = []
    elapsed = 0
    for i, frame in enumerate(frames):
        decorated.append(with_effect(frame, i, elapsed / 1000))
        elapsed += FRAME_MS[i]
    for i, frame in enumerate([ready, *decorated]):
        x, y = i % 3 * TILE[0], i // 3 * TILE[1]
        tile = frame.resize((493, 179), Image.Resampling.NEAREST)
        board.paste(tile, (x + 9, y + 20), tile)
        pen.text((x + 9, y + 4), 'Original ready' if i == 0 else f'Fire {i - 1}', fill='#ffdf97')
    board.save(HERE / 'game-size.png')
    scenes = []
    for frame in decorated:
        bg = Image.new('RGB', SIZE, '#59634a')
        bg.paste(frame, (0, 0), frame)
        scenes.append(bg.resize((493, 179), Image.Resampling.NEAREST))
    colors = Image.new('RGB', (493 * 6, 179))
    for i, scene in enumerate(scenes):
        colors.paste(scene, (i * 493, 0))
    palette = colors.quantize(colors=256)
    scenes = [scene.quantize(palette=palette, dither=Image.Dither.NONE) for scene in scenes]
    scenes[0].save(HERE / 'fire.gif', save_all=True, append_images=scenes[1:],
                   duration=FRAME_MS[:-1] + [FRAME_MS[-1] + 1000], loop=0, disposal=2, optimize=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    protect()
    sheet, frames, idle, ready, mask = build()
    phases = Image.new('RGBA', (138 * 5, 61))
    for i, frame in enumerate(frames[:5]):
        phases.paste(frame.crop((64, 27, 202, 88)), (i * 138, 0))
    references = {'idle-reference.png': idle, 'ready-reference.png': ready, 'barrel-mask.png': mask,
                  'barrel-reference.png': idle.crop((4, 27, 142, 88)).resize((828, 366), Image.Resampling.NEAREST),
                  'barrel-phases.png': phases.resize((1380, 122), Image.Resampling.NEAREST)}
    for name, image in references.items():
        if args.check:
            assert (HERE / name).read_bytes() == png(image), name
        else:
            (HERE / name).write_bytes(png(image))
    record = metadata(sheet, frames)
    template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
    assert template.count('__FIRE_METADATA__') == 1
    html = template.replace('__FIRE_METADATA__', json.dumps(record['assets'][0], ensure_ascii=False))
    if args.check:
        assert TARGET.read_bytes() == png(sheet)
        assert json.loads((HERE / 'sprites.json').read_text(encoding='utf-8')) == record
        assert (HERE / 'preview.html').read_text(encoding='utf-8') == html
        for name in ('game-size.png', 'fire.gif'):
            assert (HERE / name).is_file(), name
        with Image.open(HERE / 'fire.gif') as animation:
            assert animation.n_frames == 6
            assert [animation.seek(i) or animation.info['duration'] for i in range(6)] == FRAME_MS[:-1] + [1240]
            animation.seek(0)
            fixed = animation.convert('RGB').crop((0, 57, 493, 179)).tobytes()
            for i in range(6):
                animation.seek(i)
                assert animation.convert('RGB').crop((0, 57, 493, 179)).tobytes() == fixed, 'GIF hull/wheels moved'
        print('Checked: six BP-42 frames, .8s, fixed hull/wheels/turret, exact ready finish, separate effect and protected inputs.')
    else:
        TARGET.write_bytes(png(sheet))
        (HERE / 'sprites.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(frames, ready)
        (HERE / 'preview.html').write_text(html, encoding='utf-8')
        print('Prepared separate BP-42 recoil atlas, muzzle metadata, game-size GIF and browser review; runtime unchanged.')
    protect()


if __name__ == '__main__':
    main()
