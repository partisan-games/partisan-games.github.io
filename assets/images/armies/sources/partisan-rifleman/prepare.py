"""Prepare partisan stand-up/walk/fall art; do not change runtime or accepted source atlas."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
ACCEPTED = ROOT / 'assets/images/armies/game-ready/vojnici/partizanski-strelac-sprites.png'
TARGET = ROOT / 'assets/images/armies/game-ready/vojnici/partizanski-strelac-movement-sprites.png'
FRAME = (160, 160)
RENDER = (110, 100)
FLOOR = 137
ANCHOR = {'x': 80, 'y': 140.8}
DURATIONS = {'standUp': [160, 140, 140, 160], 'walk': [100] * 8, 'death': [100, 100, 120, 120, 140, 180], 'deathStanding': [100, 100, 120, 120, 140, 180]}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png(image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def solid(image):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    return image


def reference():
    raw = solid(Image.open(HERE / 'kneel-reference.png'))
    frame = Image.new('RGBA', FRAME)
    frame.paste(raw.resize((128, 128), Image.Resampling.NEAREST), (16, 32))
    assert frame.getbbox()[3] == FLOOR
    return frame


def source_frames(name, grid, scale, offset_x, margin=0):
    raw = Image.open(HERE / name).convert('RGBA')
    cols, rows = grid
    width, height = raw.width / cols, raw.height / rows
    frames, registration = [], []
    for index in range(cols * rows):
        # Fractional cell edges are rounded by Pillow exactly once; no assumed 512px source cells.
        x, y = index % cols * width, index // cols * height
        cell = solid(raw.crop((x, y, x + width, y + height)))
        if margin:
            cropped = cell.crop((margin, 0, cell.width - margin, cell.height))
            cell = Image.new('RGBA', cell.size)
            cell.paste(cropped, (margin, 0))
        size = (round(cell.width * scale), round(cell.height * scale))
        cell = cell.resize(size, Image.Resampling.NEAREST)
        offset_y = FLOOR - cell.getbbox()[3]
        frame = Image.new('RGBA', FRAME)
        frame.paste(cell, (offset_x, offset_y))
        assert frame.getchannel('A').getbbox()[3] == FLOOR
        frames.append(frame)
        registration.append({'index': index, 'sourceSize': list(size), 'offset': [offset_x, offset_y]})
    return frames, registration


def build():
    walking, walk_register = source_frames('walk-generated.png', (4, 3), .35, 14, margin=4)
    falling, death_register = source_frames('death-generated.png', (3, 2), .23, 21)
    standing, standing_register = source_frames('standing-death-generated.png', (3, 2), .25, 0)
    clips = {'standUp': [reference()] + walking[1:4], 'walk': walking[4:12], 'death': falling, 'deathStanding': standing}
    sheet = Image.new('RGBA', (160 * 8, 160 * 4))
    for row, (name, frames) in enumerate(clips.items()):
        assert len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}) == len(frames)
        for column, frame in enumerate(frames):
            box = frame.getbbox()
            assert box and box[0] > 0 and box[1] > 0 and box[2] < 160 and box[3] == FLOOR, (name, column, box)
            assert not any(frame.getchannel('A').histogram()[1:255])
            sheet.paste(frame, (160 * column, 160 * row))
    # The accepted kneeling pose is the exact derivative used as the transition's first keyframe.
    assert sheet.crop((0, 0, 160, 160)).tobytes() == reference().tobytes()
    return sheet, clips, {'walk': walk_register, 'death': death_register, 'deathStanding': standing_register}


def record(sheet, clips, registration):
    return {
        'schemaVersion': 1, 'generatedWith': 'Built-in image_gen; mechanical Pillow packing',
        'assets': [{
            'id': 'partisan-rifleman-movement', 'title': 'Partisan rifleman: stand up, walk, kneeling and standing falls',
            'image': '../../game-ready/vojnici/partizanski-strelac-movement-sprites.png',
            'frame': {'width': 160, 'height': 160, 'columns': 8, 'rows': 4},
            'anchor': ANCHOR, 'groundAnchor': {'x': 80, 'y': FLOOR}, 'facing': 'right',
            'render': {'width': RENDER[0], 'height': RENDER[1]},
            'reference': 'kneel-reference.png', 'referenceSha256': sha(HERE / 'kneel-reference.png'),
            'sha256': hashlib.sha256(png(sheet)).hexdigest(),
            'animations': [{
                'name': name, 'state': 'move' if name == 'walk' else 'dead' if name.startswith('death') else 'idle',
                'row': row, 'frameCount': len(frames), 'duration': sum(DURATIONS[name]) / 1000,
                'frameDurationsMs': DURATIONS[name], 'loop': name == 'walk',
                **({'endsIn': 'standing carry; ready to enter walk'} if name == 'standUp' else {}),
                **({'startsFrom': 'kneeling aim' if name == 'death' else 'standing carry / walking', 'terminal': True, 'holdLastFrame': True} if name.startswith('death') else {}),
            } for row, (name, frames) in enumerate(clips.items())],
            'frameBounds': {name: [list(f.getbbox()) for f in frames] for name, frames in clips.items()},
            'packing': {
                'walkCanvas': [1254, 1254], 'walkGrid': [4, 3], 'walkCell': [313.5, 418],
                'deathCanvas': [1536, 1024], 'deathGrid': [3, 2], 'deathCell': [512, 512],
                'standingDeathCanvas': [1536, 1024], 'standingDeathGrid': [3, 2],
                'fixedScalePerSource': {'walk': .35, 'death': .23, 'deathStanding': .25},
                'sourceSideMarginWalk': 4, 'alphaThreshold': 128,
                'registration': registration,
                'registrationRule': 'One scale per source, fixed x per source; vertical contact registration only, to keep floor at y=137.',
                'firstKeyframe': 'Normalized accepted kneeling reference, not the generated muzzle touching the source cell boundary.',
            },
            'handoff': {
                'scope': 'Art only. No game logic, controls, sounds, collision or Storybook changed.',
                'extraHeadroom': '32px above and 16px on each side of normalized 128x128 accepted frame; 160x160 renders at 110x100, preserving original horizontal/vertical scale.',
                'originalAnchor': {'x': 221.75, 'y': 376.975, 'frame': [443.5, 443.5]},
                'anchorRule': 'Keep source 0.85 baseline via 128*0.85+32=140.8; x=64+16=80. Visible floor y=137 preserves existing clearance.',
                'enterWalk': 'From kneeling: play standUp once, then loop walk. Do not jump directly from kneeling to standing walk.',
                'leaveWalk': 'Stop in a standing carry pose. Reverse standUp order [3,2,1,0] can return to kneel; art-only reuse, not a separate generated clip.',
                'death': 'Select death for kneeling aim and deathStanding for standing/walking. Both hold the last frame.',
                'mirror': 'Mirror the complete frame and attachments about anchor.x=80.',
                'timing': 'Pause freezes action clock; large dt clamps death to its final frame. Reset is separate.',
                'stride': 'World/controller supplies movement; this walk is in-place and playback should follow distance travelled.',
            },
        }],
        'inputs': [{'path': name, 'sha256': sha(HERE / name)} for name in
                   ('kneel-reference.png', 'standing-reference.png', 'walk-attempt-01.png', 'walk-generated.png', 'death-generated.png', 'standing-death-generated.png', 'generation.json')],
        'acceptedAtlasSha256': sha(ACCEPTED),
        'previewScope': 'Source/PNG composition, metadata and preparation checks only; not runtime or owner acceptance.',
    }


def previews(clips):
    reference().save(HERE / 'reference-frame.png')
    for name, frames in clips.items():
        small = []
        strip = Image.new('RGBA', (RENDER[0] * (len(frames) + 1), 126), '#59634a')
        draw = ImageDraw.Draw(strip)
        for index, frame in enumerate([reference()] + frames):
            scene = Image.new('RGBA', FRAME, '#59634a')
            scene.alpha_composite(frame)
            game = scene.resize(RENDER, Image.Resampling.NEAREST).convert('RGB')
            strip.paste(game, (RENDER[0] * index, 26))
            draw.text((RENDER[0] * index + 3, 4), 'Original' if index == 0 else str(index), fill='#ead794')
            if index: small.append(game)
        strip.convert('RGB').save(HERE / (name + '-game-size.png'))
        small[0].save(HERE / (name + '.gif'), save_all=True, append_images=small[1:],
                      duration=DURATIONS[name][:-1] + [DURATIONS[name][-1] + (0 if name == 'walk' else 900)],
                      loop=0, disposal=2)
    # One common comparison at the native preview size; source scale never changes by pose.
    samples = [reference(), clips['standUp'][-1], clips['walk'][0], clips['walk'][4],
               clips['death'][2], clips['death'][-1], clips['deathStanding'][2], clips['deathStanding'][-1]]
    board = Image.new('RGBA', (RENDER[0] * len(samples), 126), '#59634a')
    draw = ImageDraw.Draw(board)
    labels = ['Original', 'Standing', 'Walk 1', 'Walk 5', 'Kneel 3', 'Kneel end', 'Stand 3', 'Stand end']
    for index, frame in enumerate(samples):
        board.alpha_composite(frame.resize(RENDER, Image.Resampling.NEAREST), (RENDER[0] * index, 26))
        draw.text((RENDER[0] * index + 2, 4), labels[index], fill='#ead794')
    board.convert('RGB').save(HERE / 'game-size.png')
    board.resize((board.width * 2, board.height * 2), Image.Resampling.NEAREST).convert('RGB').save(HERE / 'enlarged.png')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    accepted_hash = sha(ACCEPTED)
    raw = Image.open(ACCEPTED).convert('RGBA')
    assert Image.open(HERE / 'kneel-reference.png').convert('RGBA').tobytes() == raw.crop((0, 0, raw.width/4, raw.height/2)).tobytes()
    sheet, clips, registration = build()
    metadata = record(sheet, clips, registration)
    template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
    assert template.count('__PARTISAN_METADATA__') == 1
    html = template.replace('__PARTISAN_METADATA__', json.dumps(metadata['assets'][0], ensure_ascii=False))
    if args.check:
        assert TARGET.read_bytes() == png(sheet)
        assert json.loads((HERE / 'sprites.json').read_text(encoding='utf-8')) == metadata
        assert (HERE / 'preview.html').read_text(encoding='utf-8') == html
        assert (HERE / 'reference-frame.png').read_bytes() == png(reference())
        for name, frames in clips.items():
            with Image.open(HERE / (name + '.gif')) as gif:
                assert gif.n_frames == len(frames), name
        print('Checked: standUp 4, walk 8, kneeling death 6, standing death 6; fixed floor, binary alpha, preserved reference/accepted atlas and matching hashes.')
    else:
        TARGET.write_bytes(png(sheet))
        (HERE / 'sprites.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(clips)
        (HERE / 'preview.html').write_text(html, encoding='utf-8')
        print('Prepared partisan art: standUp 0.6s, walk 0.8s, kneeling/standing falls 0.76s each. Accepted atlas/runtime untouched.')
    assert sha(ACCEPTED) == accepted_hash


if __name__ == '__main__':
    main()

