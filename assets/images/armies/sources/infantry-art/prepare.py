"""Mechanically pack generated clips while preserving accepted existing rows."""
import hashlib
import json
import runpy
import shutil
from pathlib import Path

from PIL import Image


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
GAME = ROOT / 'assets/images/armies/game-ready/vojnici'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    snapshots = HERE / 'references'
    snapshots.mkdir(exist_ok=True)
    original_path = ROOT / 'assets/images/sprites/vojnici/bombas-idle.png'
    snapshot = snapshots / original_path.name
    if not snapshot.exists():
        shutil.copyfile(original_path, snapshot)
    original = Image.open(snapshot).convert('RGBA')
    generated = Image.open(HERE / 'bombas-death-generated.png').convert('RGBA')
    assert generated.size == (1536, 1024)
    sheet = Image.new('RGBA', (528, 216))
    sheet.paste(original, (0, 0))
    frames = []
    for index in range(6):
        x, y = index % 3 * 512, index // 3 * 512
        cell = generated.crop((x + 77, y + 91, x + 437, y + 483))
        # The model's faint low-alpha halo is not part of the pixel sprite; keep solid character pixels only.
        cell.putalpha(cell.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
        cell = cell.resize((66, 72), Image.Resampling.NEAREST)
        frames.append(cell)
        sheet.paste(cell, (index * 66, 144))
    assert sheet.crop((0, 0, 528, 144)).tobytes() == original.tobytes()
    assert len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}) == 6
    target = GAME / 'bombas-sprites.png'
    sheet.save(target)
    previews = HERE / 'previews'
    previews.mkdir(exist_ok=True)
    strip = Image.new('RGBA', (396, 72))
    for index, frame in enumerate(frames):
        strip.paste(frame, (index * 66, 0))
    strip.save(previews / 'bombas-death.png')
    scene = Image.new('RGBA', strip.size, '#3d4332')
    scene.alpha_composite(strip)
    scene.convert('RGB').save(previews / 'bombas-death-game-size.png')
    helpers = runpy.run_path(str(HERE.parent / 'tenkovi/prepare.py'))
    helpers['save_gif'](frames, previews / 'bombas-death.gif', 100)
    metadata = {'schemaVersion': 1, 'generatedWith': 'Built-in image_gen; mechanical Pillow packing', 'assets': [{
        'id': 'bombas', 'title': 'Bombas', 'image': '../../game-ready/vojnici/bombas-sprites.png',
        'frame': {'width': 66, 'height': 72, 'columns': 8, 'rows': 3},
        'anchor': {'x': 33, 'y': 36}, 'groundAnchor': {'x': 33, 'y': 72},
        'reference': 'references/bombas-idle.png', 'referenceSha256': sha(snapshot),
        'source': 'bombas-death-generated.png', 'sourceSha256': sha(HERE / 'bombas-death-generated.png'),
        'sha256': sha(target), 'acceptedRowsUnchanged': True,
        'animations': [
            {'name': 'idle', 'row': 0, 'frameCount': 2, 'duration': .6, 'loop': True},
            {'name': 'kretanje', 'row': 1, 'frameCount': 8, 'duration': .8, 'loop': True},
            {'name': 'death', 'row': 2, 'frameCount': 6, 'duration': .6, 'loop': False},
        ],
        'integration': 'GrenadierSprite shared by Grenadier in Bunker and its existing Storybook story; preserve parent collision dimensions 66x72 and hold death frame 5.',
    }]}
    (HERE / 'sprites.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    print('Packed Bombas: two accepted rows unchanged, six new death frames, collider 66x72 unchanged.')


if __name__ == '__main__':
    main()
