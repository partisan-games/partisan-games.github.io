"""Mechanically pack generated ambient clips; preserve the same crop and anchor per row."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
# the game loads the packed layers from here; drafts and generations stay in this folder
GAME = HERE.parents[2] / 'background' / 'batina-1944'


def main():
    raw = Image.open(HERE / 'actors-generated.png').convert('RGBA')
    assert raw.width == raw.height
    source_cell = raw.width / 4
    cell = 128
    actors = [
        {'id': 'flag', 'row': 0, 'body': [56, 48], 'anchor': [64, 8], 'x': 1178, 'y': 443, 'duration': 1.6},
        {'id': 'observer', 'row': 1, 'body': [74, 68], 'anchor': [64, 120], 'x': 1225, 'y': 725, 'duration': 2.8, 'occlusion': [[1178, 700, 110, 45]]},
        {'id': 'gunner', 'row': 2, 'body': [74, 40], 'anchor': [64, 120], 'x': 1034, 'y': 333, 'duration': 3.2, 'occlusion': [[984, 324, 125, 27]]},
        {'id': 'civilians', 'row': 3, 'body': [80, 96], 'anchor': [64, 120], 'x': 212, 'y': 802, 'duration': 4},
    ]
    sheet = Image.new('RGBA', (cell * 4, cell * 4))
    for actor in actors:
        row = actor['row']
        frames = [raw.crop(tuple(round(value) for value in (i * source_cell, row * source_cell, (i + 1) * source_cell, (row + 1) * source_cell))) for i in range(4)]
        for frame in frames:
            frame.putalpha(frame.getchannel('A').point(lambda a: 0 if a < 64 else a))
        boxes = [frame.getbbox() for frame in frames]
        assert all(boxes)
        crop = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        scale = min(actor['body'][0] / (crop[2] - crop[0]), actor['body'][1] / (crop[3] - crop[1]))
        size = (round((crop[2] - crop[0]) * scale), round((crop[3] - crop[1]) * scale))
        packed = []
        for frame in frames:
            frame = frame.crop(crop).resize(size, Image.Resampling.NEAREST)
            target = Image.new('RGBA', (cell, cell))
            y = actor['anchor'][1] if row == 0 else actor['anchor'][1] - size[1]
            target.alpha_composite(frame, (actor['anchor'][0] - size[0] // 2, y))
            if packed:
                # Keep the mounting seam or feet/waist fixed, without redrawing artwork.
                band = (0, 0, cell, 11) if row == 0 else (0, 112, cell, cell)
                target.paste(packed[0].crop(band), (band[0], band[1]))
            packed.append(target)
        distinct = len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in packed})
        assert distinct >= 3, actor['id']
        actor.update(frameCount=4, loop=row != 3, measuredDistinctFrames=distinct)
        if row == 3:
            actor['gestures'] = {'window': 18, 'delay': 6, 'jitter': 8, 'duration': 1.6, 'seed': 23}
        for i, frame in enumerate(packed):
            sheet.paste(frame, (i * cell, row * cell))
    sheet.save(GAME / 'actors.png', optimize=True)
    layout = {'width': 1536, 'height': 1024, 'groundY': 852, 'cell': cell, 'cloudSpeed': 7, 'actors': actors, 'prototype': False, 'ownerAccepted': True, 'gameIntegrated': True}
    (GAME / 'layout.json').write_text(json.dumps(layout, indent=2) + '\n', encoding='utf-8')
    print('Packed four clips with real frame differences, fixed flag seam and feet/waist anchors.')


if __name__ == '__main__':
    main()
