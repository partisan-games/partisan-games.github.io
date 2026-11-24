"""Prepare the winter sentry without rewriting the other chosen enemies."""
import hashlib
import json
import runpy
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
TARGET = ROOT / 'assets/images/game-ready/vojnici/otpisani-sentry-sprites.png'
poses = runpy.run_path(str(HERE / 'prepare-rifleman-redraw.py'))['poses']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_protected():
    data = json.loads((HERE / 'winter-sentry-animation-protected.json').read_text(encoding='utf8'))
    for name, digest in data['files'].items():
        assert sha(ROOT / name) == digest, 'Existing art changed: '+name
    return data


def prepare():
    verify_protected()
    reference = HERE / 'winter-sentry-redraw-idle.png'
    idle = Image.open(reference).convert('RGBA')
    standing = idle.getbbox()[3]-idle.getbbox()[1]
    assert idle.size == (512, 512) and standing >= 400
    sources = [HERE / ('winter-sentry-animation-'+part+'-generated.png') for part in 'abc']
    sheets = [poses(path) for path in sources]
    heights = [max(image.height for image, box in sheet[:4]) for sheet in sheets]
    assert min(heights) >= 400, 'Keep genuine source detail for the high-resolution actor'
    scales = [standing/height for height in heights]
    atlas = Image.new('RGBA', (2048, 3072))
    registration, packed_bounds = [], []
    for sheet_index, (sheet, scale) in enumerate(zip(sheets, scales)):
        for index, (image, box) in enumerate(sheet):
            row, col = sheet_index*2+index//4, index % 4
            if row < 5:
                head = image.crop((0, 0, image.width, max(1, round(image.height*.15)))).getbbox()
                center = (head[0]+head[2])/2
            else:
                center = image.width/2
            resized = image.resize((round(image.width*scale), round(image.height*scale)), Image.Resampling.NEAREST)
            assert resized.width < 502 and resized.height < 490, (row, col, resized.size)
            offset = [round(256-center*scale), 496-resized.height]
            frame = Image.new('RGBA', (512, 512))
            frame.alpha_composite(resized, offset)
            if row == 0:
                frame = idle.copy()
            bounds = frame.getbbox()
            assert bounds[0] > 0 and bounds[1] > 0 and bounds[2] < 512 and bounds[3] == 496, bounds
            atlas.alpha_composite(frame, (col*512, row*512))
            registration.append({'row': row, 'column': col, 'source': sources[sheet_index].name,
                                 'sourceBox': box, 'scale': scale, 'offset': offset})
            packed_bounds.append(list(bounds))
    atlas.save(TARGET)
    preview = Image.new('RGBA', (1200, 250), '#657246')
    for index, (col, row) in enumerate([(0, 0), (0, 1), (0, 2), (0, 3), (1, 4), (3, 5)]):
        tile = atlas.crop((col*512, row*512, (col+1)*512, (row+1)*512)).resize((200, 200), Image.Resampling.NEAREST)
        preview.alpha_composite(tile, (index*200, 25))
    preview.convert('RGB').save(HERE / 'winter-sentry-game-size.png')
    clips = {'idle': {'row': 0, 'ms': [1000], 'loop': True},
             'walk-left': {'row': 1, 'ms': [180]*4, 'loop': True},
             'walk-right': {'row': 2, 'ms': [180]*4, 'loop': True},
             'attack': {'row': 3, 'ms': [100, 160, 360, 580], 'loop': True},
             'hit': {'row': 4, 'ms': [80]*4}, 'dead': {'row': 5, 'ms': [120, 180, 200, 300]}}
    fire = registration[12]
    point = [81, 80]
    muzzle = [fire['offset'][0]+point[0]*scales[1], fire['offset'][1]+point[1]*scales[1]]
    runtime = {'src': 'game-ready/vojnici/'+TARGET.name, 'width': 512, 'height': 512,
               'anchor': {'x': 256, 'y': 496}, 'standingPixels': standing,
               'effectStandingPixels': 194, 'muzzle': muzzle, 'clips': clips}
    animations = [{'name': name, 'row': clip['row'], 'frameCount': len(clip['ms']),
                   'frameDurationsMs': clip['ms'], 'duration': sum(clip['ms'])/1000, 'loop': clip.get('loop', False)}
                  for name, clip in clips.items()]
    return {'id': 'otpisani-sentry', 'image': '../../../game-ready/vojnici/'+TARGET.name,
            'frame': {'width': 512, 'height': 512, 'columns': 4, 'rows': 6},
            'anchor': runtime['anchor'], 'view': 'front-and-side', 'animations': animations,
            'source': sources[0].name, 'sourceSha256': sha(sources[0]),
            'sources': [{'path': path.name, 'sha256': sha(path)} for path in sources],
            'reference': reference.name, 'referenceSha256': sha(reference), 'sha256': sha(TARGET),
            'registration': registration, 'bounds': packed_bounds, 'idlePixelsUnchanged': True,
            'muzzleSource': {'source': sources[1].name, 'crop': fire['sourceBox'], 'point': point},
            'generator': 'winter-sentry-animation-generation.json', 'runtime': runtime}
