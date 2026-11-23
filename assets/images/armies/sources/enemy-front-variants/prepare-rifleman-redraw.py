"""Pack the outlined rifleman from three larger sheets at the registered size."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
TARGET = ROOT / 'assets/images/armies/game-ready/vojnici/otpisani-rifleman-sprites.png'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def poses(path):
    raw = Image.open(path).convert('RGBA')
    raw.putalpha(raw.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    result = []
    for row in range(2):
        top, bottom = round(row*raw.height/2), round((row+1)*raw.height/2)
        band = raw.crop((0, top, raw.width, bottom))
        projection = band.getchannel('A').getprojection()[0]
        segments, start = [], None
        for x, occupied in enumerate([*projection, False]):
            if occupied and start is None:
                start = x
            elif not occupied and start is not None:
                if segments and start-segments[-1][1] <= 4:
                    segments[-1][1] = x
                else:
                    segments.append([start, x])
                start = None
        segments = [box for box in segments if box[1]-box[0] >= 16]
        assert len(segments) == 4, (path.name, row, segments)
        for left, right in segments:
            cell = band.crop((left, 0, right, band.height))
            box = cell.getbbox()
            absolute = [left+box[0], top+box[1], left+box[2], top+box[3]]
            result.append((cell.crop(box), absolute))
    return result


def prepare():
    sources = [HERE / ('rifleman-redraw-'+part+'-generated.png') for part in 'abc']
    sheets = [poses(path) for path in sources]
    standing = min(448, max(image.height for image, box in sheets[0][:4]))
    scales = [standing/max(image.height for image, box in sheet[:4]) for sheet in sheets]
    # A shared final fit also protects the complete horizontal corpse.
    fit = min(1, min(500/(image.width*factor) for sheet, factor in zip(sheets, scales) for image, box in sheet))
    scales = [factor*fit for factor in scales]
    standing *= fit
    assert standing >= 400, 'Preserve the new source detail rather than repacking a small sprite'
    atlas = Image.new('RGBA', (2048, 3072))
    rows, packed_bounds = [], []
    for sheet_index, (sheet, factor) in enumerate(zip(sheets, scales)):
        for index, (image, source_box) in enumerate(sheet):
            row, col = sheet_index*2+index//4, index % 4
            if row < 5:
                head = image.crop((0, 0, image.width, max(1, round(image.height*.15)))).getbbox()
                center = (head[0]+head[2])/2
            else:
                center = image.width/2
            resized = image.resize((round(image.width*factor), round(image.height*factor)), Image.Resampling.NEAREST)
            offset = [round(256-center*factor), 496-resized.height]
            frame = Image.new('RGBA', (512, 512))
            frame.alpha_composite(resized, offset)
            bounds = frame.getbbox()
            assert bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 512 and bounds[3] == 496, (row, col, bounds)
            atlas.alpha_composite(frame, (col*512, row*512))
            rows.append({'row': row, 'column': col, 'source': sources[sheet_index].name,
                         'sourceBox': source_box, 'scale': factor, 'offset': offset})
            packed_bounds.append(list(bounds))
    atlas.save(TARGET)
    atlas.crop((0, 0, 512, 512)).save(HERE / 'rifleman-redraw-idle.png')
    preview = Image.new('RGBA', (1200, 250), '#657246')
    for index, (col, row) in enumerate([(0, 0), (0, 1), (0, 2), (0, 3), (1, 4), (3, 5)]):
        tile = atlas.crop((col*512, row*512, (col+1)*512, (row+1)*512)).resize((200, 200), Image.Resampling.NEAREST)
        preview.alpha_composite(tile, (index*200, 25))
    preview.convert('RGB').save(HERE / 'rifleman-redraw-game-size.png')
    reference = HERE / '01-rifleman.png'
    clips = {'idle': {'row': 0, 'ms': [250]*4, 'loop': True},
             'walk-left': {'row': 1, 'ms': [180]*4, 'loop': True},
             'walk-right': {'row': 2, 'ms': [180]*4, 'loop': True},
             'attack': {'row': 3, 'ms': [100, 160, 360, 580], 'loop': True},
             'hit': {'row': 4, 'ms': [80]*4}, 'dead': {'row': 5, 'ms': [120, 180, 200, 300]}}
    # Measured on the first front-facing firing figure, relative to its tight crop.
    fire = rows[12]
    source_muzzle = [101, 80]
    muzzle = [fire['offset'][0]+source_muzzle[0]*scales[1],
              fire['offset'][1]+source_muzzle[1]*scales[1]]
    runtime = {'src': 'armies/game-ready/vojnici/'+TARGET.name, 'width': 512, 'height': 512,
               'anchor': {'x': 256, 'y': 496}, 'standingPixels': standing,
               'effectStandingPixels': 194, 'muzzle': muzzle, 'clips': clips}
    animations = [{'name': name, 'row': clip['row'], 'frameCount': len(clip['ms']),
                   'frameDurationsMs': clip['ms'], 'duration': sum(clip['ms'])/1000, 'loop': clip.get('loop', False)}
                  for name, clip in clips.items()]
    return {'id': 'otpisani-rifleman', 'image': '../../game-ready/vojnici/'+TARGET.name,
            'frame': {'width': 512, 'height': 512, 'columns': 4, 'rows': 6},
            'anchor': runtime['anchor'], 'view': 'front-and-side', 'animations': animations,
            'source': sources[0].name, 'sourceSha256': sha(sources[0]),
            'sources': [{'path': p.name, 'sha256': sha(p)} for p in sources],
            'reference': reference.name, 'referenceSha256': sha(reference), 'sha256': sha(TARGET),
            'registration': rows, 'bounds': packed_bounds, 'idlePixelsUnchanged': False,
            'muzzleSource': {'source': sources[1].name, 'crop': fire['sourceBox'], 'point': source_muzzle},
            'generator': 'rifleman-redraw-generation.json', 'runtime': runtime}
