"""Prepare separate partisan/Italian crew fall art; do not change accepted atlases or gameplay."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
GAME = ROOT / 'assets/images/armies/game-ready/artiljerija'
GUN = HERE.parent / 'field-gun/layout.json'
FRAME = (160, 128)
RENDER = (75, 60)
ANCHOR = {'x': 80, 'y': 123.52}
DURATIONS = [100, 120, 140, 140, 160, 180]
PROFILES = [
    {'id': 'partisan', 'original': 'partizanska-posada', 'scale': .294, 'offsetX': 6,
     'frame': [315.75, 311.5], 'originalAnchor': [157.875, 300.5975]},
    {'id': 'italian', 'original': 'italijanska-posada', 'scale': .29, 'offsetX': 6,
     'frame': [313.5, 313.5], 'originalAnchor': [156.75, 302.5275]},
]


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


def reference(profile):
    src = solid(Image.open(HERE / (profile['original'] + '-reference.png')))
    frame = Image.new('RGBA', FRAME)
    frame.paste(src.resize((128, 128), Image.Resampling.NEAREST), (16, 0))
    return frame


def target(profile):
    return GAME / (profile['original'] + '-death-sprites.png')


def build(profile):
    raw = Image.open(HERE / (profile['id'] + '-fall-generated.png')).convert('RGBA')
    assert raw.size == (1536, 1024)
    floor = reference(profile).getbbox()[3]
    frames, registration = [], []
    for index in range(6):
        x, y = index % 3 * 512, index // 3 * 512
        cell = solid(raw.crop((x, y, x + 512, y + 512)))
        size = (round(cell.width * profile['scale']), round(cell.height * profile['scale']))
        cell = cell.resize(size, Image.Resampling.NEAREST)
        offset_y = floor - cell.getbbox()[3]
        frame = Image.new('RGBA', FRAME)
        frame.paste(cell, (profile['offsetX'], offset_y))
        box = frame.getbbox()
        assert box and 0 < box[0] < box[2] < FRAME[0] and box[1] > 0 and box[3] == floor
        assert not any(frame.getchannel('A').histogram()[1:255])
        frames.append(frame)
        registration.append({'index': index, 'scaledSize': list(size), 'offset': [profile['offsetX'], offset_y]})
    assert len({hashlib.sha256(f.tobytes()).hexdigest() for f in frames}) == 6
    sheet = Image.new('RGBA', (FRAME[0] * 6, FRAME[1]))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (FRAME[0] * index, 0))
    return sheet, frames, registration


def record(prepared):
    assets = []
    for profile, (sheet, frames, registration) in zip(PROFILES, prepared):
        assets.append({
            'id': profile['id'] + '-cannon-crew-death',
            'title': profile['original'] + ': kneeling fall',
            'image': '../../game-ready/artiljerija/' + target(profile).name,
            'frame': {'width': FRAME[0], 'height': FRAME[1], 'columns': 6, 'rows': 1},
            'anchor': ANCHOR, 'groundAnchor': {'x': 80, 'y': reference(profile).getbbox()[3]},
            'facing': 'right', 'render': {'width': RENDER[0], 'height': RENDER[1]},
            'reference': profile['original'] + '-reference.png',
            'referenceSha256': sha(HERE / (profile['original'] + '-reference.png')),
            'previewReference': profile['id'] + '-reference-frame.png',
            'source': profile['id'] + '-fall-generated.png',
            'sourceSha256': sha(HERE / (profile['id'] + '-fall-generated.png')),
            'sha256': hashlib.sha256(png(sheet)).hexdigest(),
            'animations': [{
                'name': 'death', 'state': 'dead', 'row': 0, 'frameCount': 6,
                'duration': sum(DURATIONS) / 1000, 'frameDurationsMs': DURATIONS,
                'loop': False, 'terminal': True, 'holdLastFrame': True,
                'startsFrom': 'existing kneeling gun-crew working pose',
            }],
            'frameBounds': [list(frame.getbbox()) for frame in frames],
            'packing': {'sourceGrid': [3, 2], 'sourceCell': [512, 512],
                        'alphaThreshold': 128, 'fixedScale': profile['scale'], 'registration': registration,
                        'rule': 'One scale/x offset per figure; vertical contact registration only.'},
            'integration': 'CannonCrew/CannonCrewSprite in Ustanak and both existing Storybook stories; destroyed gun selects crew death.',
            'handoff': {
                'padding': '16px on each side of a normalized 128x128 reference; 75x60 display keeps existing 60x60 figure scale.',
                'originalFrame': profile['frame'], 'originalAnchor': profile['originalAnchor'],
                'mirror': 'Mirror complete frame about x=80; do not flip headgear/item separately.',
                'lifeCycle': 'Body triggers death once; cancel load/fire presentation and loading audio on entry; clamp to final frame even after large dt.',
                'gameRules': 'Art does not introduce independent crew health or change Ustanak rules. Scene/body owns when the figure is considered lost.',
                'timing': 'Pause freezes clock; reset/new instance is required to return from the final pose.',
                'sourceIdentity': 'Partisan cap/moustache/loading item retained; Italian helmet and empty hands retained.',
            },
        })
    return {
        'schemaVersion': 1, 'generatedWith': 'Built-in image_gen; mechanical Pillow packing',
        'assets': assets,
        'previewGun': json.loads(GUN.read_text(encoding='utf-8')),
        'inputs': [{'path': name, 'sha256': sha(HERE / name)} for name in
                   ('partizanska-posada-reference.png', 'italijanska-posada-reference.png',
                    'partisan-fall-generated.png', 'italian-fall-generated.png', 'generation.json')] +
                  [{'path': '../field-gun/layout.json', 'sha256': sha(GUN)}],
        'acceptedAtlasHashes': {p['original']: sha(GAME / (p['original'] + '-sprites.png')) for p in PROFILES},
        'scope': 'Art-only handoff and preview; no game/browser run or owner acceptance implied.',
    }


def previews(prepared):
    for profile, (_, frames, _) in zip(PROFILES, prepared):
        reference(profile).save(HERE / (profile['id'] + '-reference-frame.png'))
        strip = Image.new('RGBA', (75 * 7, 86), '#59634a')
        draw = ImageDraw.Draw(strip)
        gif = []
        for index, frame in enumerate([reference(profile)] + frames):
            scene = Image.new('RGBA', FRAME, '#59634a')
            scene.alpha_composite(frame)
            game = scene.resize(RENDER, Image.Resampling.NEAREST).convert('RGB')
            strip.paste(game, (75 * index, 26))
            draw.text((75 * index + 3, 4), 'Original' if index == 0 else str(index), fill='#ead794')
            if index: gif.append(game)
        strip.convert('RGB').save(HERE / (profile['id'] + '-game-size.png'))
        strip.resize((strip.width * 3, strip.height * 3), Image.Resampling.NEAREST).convert('RGB').save(HERE / (profile['id'] + '-enlarged.png'))
        gif[0].save(HERE / (profile['id'] + '-death.gif'), save_all=True, append_images=gif[1:],
                    duration=DURATIONS[:-1] + [DURATIONS[-1] + 900], loop=0, disposal=2)
    gun = json.loads(GUN.read_text(encoding='utf-8'))
    barrel = Image.open(ROOT / 'assets/images' / gun['parts']['barrel']['src']).convert('RGBA')
    carriage = Image.open(ROOT / 'assets/images' / gun['parts']['carriage']['src']).convert('RGBA')
    joint, pivot = gun['parts']['carriage']['joint'], gun['parts']['barrel']['pivot']
    board = Image.new('RGBA', (1000, 200), '#59634a')
    draw = ImageDraw.Draw(board)
    for x, flip, profile, (_, frames, _) in zip((0, 500), (False, True), PROFILES, prepared):
        native = Image.new('RGBA', (500, 260))
        native.alpha_composite(carriage, (40, 115))
        upper = Image.new('RGBA', native.size)
        origin = (40 + joint['x'], 115 + joint['y'])
        upper.alpha_composite(barrel, (round(origin[0] - pivot['x']), round(origin[1] - pivot['y'])))
        native.alpha_composite(upper.rotate(20, resample=Image.Resampling.NEAREST, center=origin))
        tile = native.resize((375, 195), Image.Resampling.NEAREST)
        if flip: tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        board.alpha_composite(tile, (x + 40, 0))
        root = (40 + joint['x']) * .75
        root = x + 40 + (375 - root if flip else root)
        figure = frames[-1].resize(RENDER, Image.Resampling.NEAREST)
        if flip: figure = figure.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        figure_x = root + (120 if flip else -120) - ANCHOR['x'] * RENDER[0] / FRAME[0]
        figure_y = (115 + 96) * .75 - ANCHOR['y'] * RENDER[1] / FRAME[1]
        board.alpha_composite(figure, (round(figure_x), round(figure_y)))
        draw.text((x + 130, 5), profile['id'] + ' crew: final', fill='#ead794')
    board.convert('RGB').save(HERE / 'final-with-guns.png')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    originals = [GAME / (p['original'] + '-sprites.png') for p in PROFILES]
    hashes = [sha(path) for path in originals]
    for profile, source in zip(PROFILES, originals):
        im = Image.open(source).convert('RGBA')
        expected = im.crop((0, 0, im.width/4, im.height/4))
        actual = Image.open(HERE / (profile['original'] + '-reference.png')).convert('RGBA')
        assert actual.tobytes() == expected.tobytes()
    prepared = [build(profile) for profile in PROFILES]
    metadata = record(prepared)
    template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
    assert template.count('__CREW_METADATA__') == 1
    html = template.replace('__CREW_METADATA__', json.dumps(metadata, ensure_ascii=False))
    if args.check:
        for profile, (sheet, _, _) in zip(PROFILES, prepared):
            assert target(profile).read_bytes() == png(sheet)
            assert (HERE / (profile['id'] + '-reference-frame.png')).read_bytes() == png(reference(profile))
            with Image.open(HERE / (profile['id'] + '-death.gif')) as gif:
                assert gif.n_frames == 6
        assert json.loads((HERE / 'sprites.json').read_text(encoding='utf-8')) == metadata
        assert (HERE / 'preview.html').read_text(encoding='utf-8') == html
        print('Checked: two six-frame 160x128 falls, distinct poses, reference contact lines, binary alpha, unchanged original atlases.')
    else:
        for profile, (sheet, _, _) in zip(PROFILES, prepared):
            target(profile).write_bytes(png(sheet))
        (HERE / 'sprites.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(prepared)
        (HERE / 'preview.html').write_text(html, encoding='utf-8')
        print('Prepared partisan/Italian crew falls, 6 frames and 0.84s each, plus gun-context preview.')
    assert [sha(path) for path in originals] == hashes


if __name__ == '__main__':
    main()

