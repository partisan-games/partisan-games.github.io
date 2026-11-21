"""Prepare a separate reload atlas and timing handoff; accepted game art stays unchanged."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
ACCEPTED = ROOT / 'assets/images/armies/game-ready/vojnici/nemacki-strelac-sprites.png'
TARGET = ROOT / 'assets/images/armies/game-ready/vojnici/nemacki-strelac-reload-sprites.png'
DURATIONS = [160, 160, 180, 220, 220, 220, 220, 220]
EVENTS = [('magazineRemoved', 3), ('magazineSeated', 5), ('boltPulled', 6), ('boltClosed', 7)]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png(image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def build():
    raw = Image.open(HERE / 'reload-generated.png').convert('RGBA')
    assert raw.size == (1536, 1024)
    frames = []
    for index in range(8):
        x, y = index % 4 * 384, index // 4 * 512
        cell = raw.crop((x, y, x + 384, y + 512))
        # Alpha-only cleanup; never paint character pixels or move individual poses.
        cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
        cell = cell.resize((102, 136), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', (128, 128))
        frame.paste(cell, (14, -1))
        box = frame.getbbox()
        assert box and box[3] == 120, (index, box)
        assert 0 < box[0] < box[2] < 128 and box[1] > 0
        assert not any(frame.getchannel('A').histogram()[1:255])
        frames.append(frame)
    assert len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}) == 8
    sheet = Image.new('RGBA', (1024, 128))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index * 128, 0))
    return sheet, frames


def record(sheet, frames):
    events = [{'name': name, 'frameIndex': index, 'atSeconds': sum(DURATIONS[:index]) / 1000}
              for name, index in EVENTS]
    return {
        'schemaVersion': 1, 'generatedWith': 'Built-in image_gen; mechanical Pillow packing',
        'assets': [{
            'id': 'rifleman-reload', 'title': 'German rifleman: detachable-magazine reload',
            'image': '../../game-ready/vojnici/nemacki-strelac-reload-sprites.png',
            'frame': {'width': 128, 'height': 128, 'columns': 8, 'rows': 1},
            'anchor': {'x': 64, 'y': 120}, 'groundAnchor': {'x': 64, 'y': 120},
            'facing': 'right', 'previewScale': 0.625,
            'reference': 'aim-reference.png', 'referenceSha256': sha(HERE / 'aim-reference.png'),
            'source': 'reload-generated.png', 'sourceSha256': sha(HERE / 'reload-generated.png'),
            'sha256': hashlib.sha256(png(sheet)).hexdigest(),
            'animations': [{
                'name': 'reload', 'row': 0, 'frameCount': 8,
                'duration': sum(DURATIONS) / 1000, 'frameDurationsMs': DURATIONS,
                'loop': False, 'events': events,
                'finishedAtSeconds': sum(DURATIONS) / 1000,
                'end': 'Hold frame 7 in aim; the body owns readiness and inventory.',
            }],
            'frameBounds': [list(frame.getbbox()) for frame in frames],
            'packing': {
                'sourceSize': [1536, 1024], 'sourceGrid': [4, 2], 'sourceCell': [384, 512],
                'fixedScale': [102, 136], 'fixedOffset': [14, -1], 'alphaThreshold': 128,
                'reason': 'One shared transform fits the reference body scale and keeps boots at y=120.',
            },
            'handoff': {
                'scope': 'Integrated through Rifleman/RiflemanSprite: explicit reload and level-fire cooldown, in Kluz and Storybook. No ammunition inventory added.',
                'mirror': 'Mirror the complete cell about anchor.x=64, including any future event attachment.',
                'events': 'Observe crossed action-time thresholds once, in order, even when dt skips a frame.',
                'inventory': 'Animation markers do not grant ammunition; the body owns commit/cancel policy and prevents duplicate magazine credit.',
                'interruption': 'Death cancels remaining markers. Pause freezes action time. Reset starts a new action identity.',
                'fire': 'Block shooting during reload; completion is at 1.6s, not at magazineSeated.',
                'audio': 'Markers identify future magazine and bolt sounds; this package contains no new sound or playback.',
            },
        }],
        'inputs': [
            {'path': name, 'sha256': sha(HERE / name)}
            for name in ('aim-reference.png', 'aim-reference-4x.png', 'reload-generated.png', 'generation.json')
        ],
        'acceptedAtlasSha256': sha(ACCEPTED),
        'reviewScope': 'PNG source/composition and preparation assertions; no game/browser run or owner acceptance asserted.',
    }


def previews(frames):
    ref = Image.open(HERE / 'aim-reference.png').convert('RGBA')
    # 0.625 matches the accepted rifleman's documented game preview size: 80x80.
    strip = Image.new('RGBA', (80 * 9, 104), '#59634a')
    draw = ImageDraw.Draw(strip)
    for index, frame in enumerate([ref] + frames):
        strip.alpha_composite(frame.resize((80, 80), Image.Resampling.NEAREST), (index * 80, 24))
        draw.text((index * 80 + 3, 4), 'Original' if index == 0 else str(index), fill='#f1dd9c')
    strip.convert('RGB').save(HERE / 'game-size.png')
    strip.resize((strip.width * 3, strip.height * 3), Image.Resampling.NEAREST).convert('RGB').save(HERE / 'enlarged.png')
    gif = []
    for frame in frames:
        scene = Image.new('RGBA', (128, 128), '#59634a')
        scene.alpha_composite(frame)
        gif.append(scene.resize((80, 80), Image.Resampling.NEAREST).convert('RGB'))
    gif[0].save(HERE / 'reload.gif', save_all=True, append_images=gif[1:],
                duration=DURATIONS[:-1] + [DURATIONS[-1] + 900], loop=0, disposal=2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    accepted_hash = sha(ACCEPTED)
    source_ref = Image.open(ACCEPTED).convert('RGBA').crop((0, 0, 128, 128))
    assert Image.open(HERE / 'aim-reference.png').convert('RGBA').tobytes() == source_ref.tobytes()
    sheet, frames = build()
    metadata = record(sheet, frames)
    rendered = (HERE / 'preview.template.html').read_text(encoding='utf-8').replace(
        '__RELOAD_METADATA__', json.dumps(metadata['assets'][0], ensure_ascii=False))
    assert '__RELOAD_METADATA__' not in rendered
    if args.check:
        assert TARGET.read_bytes() == png(sheet)
        assert json.loads((HERE / 'sprites.json').read_text(encoding='utf-8')) == metadata
        assert (HERE / 'preview.html').read_text(encoding='utf-8') == rendered
        for name in ('game-size.png', 'enlarged.png', 'reload.gif'):
            assert (HERE / name).is_file()
        with Image.open(HERE / 'reload.gif') as gif:
            assert gif.n_frames == 8
        print('Checked: 8 distinct 128x128 frames, y=120 floor, binary alpha, matching references/hashes and event times.')
    else:
        TARGET.write_bytes(png(sheet))
        (HERE / 'sprites.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        previews(frames)
        (HERE / 'preview.html').write_text(rendered, encoding='utf-8')
        print('Prepared reload art: 8 frames, 1.6s, magazine 0.5/0.94s, bolt 1.16/1.38s. Accepted atlas untouched.')
    assert sha(ACCEPTED) == accepted_hash


if __name__ == '__main__':
    main()

