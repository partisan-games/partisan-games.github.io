"""Prepare and verify two generated Belgrade 1944 backgrounds and Otpisani-scale reviews."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
BACKGROUND = ROOT / 'assets/images/background'
ATLAS = ROOT / 'assets/images/armies/game-ready/vojnici/occupier-sprites.png'
SIZE = (1536, 1024)
VARIANTS = [('pixel', 'beograd-1944-pixel.png'), ('monochrome', 'beograd-1944-crno-belo.png')]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encoded(image, format='PNG'):
    out = io.BytesIO()
    image.save(out, format=format, **({'lossless': True} if format == 'WEBP' else {}))
    return out.getvalue()


def composition(background, size):
    scene = background.resize(size, Image.Resampling.NEAREST if background.info.get('style') == 'pixel' else Image.Resampling.LANCZOS).convert('RGBA')
    atlas = Image.open(ATLAS).convert('RGBA')
    assert atlas.size == (1050, 1260)
    # OccupierSprite draws its original 210px square around a center at .75H.
    # Use the actual source art without changing body sizes or stance for either image.
    for ratio, column, row in [(.22, 2, 3), (.5, 0, 5), (.78, 2, 2)]:
        frame = atlas.crop((column * 210, row * 210, (column + 1) * 210, (row + 1) * 210))
        scene.alpha_composite(frame, (round(size[0] * ratio - 105), round(size[1] * .75 - 105)))
    return scene.convert('RGB')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    generation = json.loads((HERE / 'generation.json').read_text(encoding='utf-8'))
    for path, digest in generation['protectedInputs'].items():
        assert sha(ROOT / path) == digest, 'Existing input changed: ' + path
    records, outputs = [], {}
    for key, filename in VARIANTS:
        spec = next(v for v in generation['variants'] if v['id'] == key)
        source = HERE / spec['source']
        assert sha(source) == spec['sourceSha256'], source.name
        raw = Image.open(source).convert('RGBA')
        assert raw.getchannel('A').getextrema() == (255, 255), 'Background must be opaque'
        image = raw.convert('RGB')
        source_size = list(image.size)
        resample = Image.Resampling.NEAREST if key == 'pixel' else Image.Resampling.LANCZOS
        if image.size != SIZE:
            assert abs(image.width / image.height - 1.5) < .015, 'Unexpected source aspect; inspect before resizing'
            image = image.resize(SIZE, resample)
        if key == 'monochrome':
            image = image.convert('L').convert('RGB')
            r, g, b = image.split()
            assert r.tobytes() == g.tobytes() == b.tobytes()
        image.info['style'] = key
        target = BACKGROUND / filename
        data = encoded(image)
        outputs[target] = data
        previews = []
        for size in [(1280, 720), (1024, 768)]:
            name = f'compositions/{key}-{size[0]}x{size[1]}.webp'
            outputs[HERE / name] = encoded(composition(image, size), 'WEBP')
            previews.append({'image': name, 'width': size[0], 'height': size[1]})
        records.append({'id': key, 'title': spec['title'], 'image': '../../../background/' + filename,
                        'source': spec['source'], 'sourceSha256': spec['sourceSha256'],
                        'sha256': hashlib.sha256(data).hexdigest(), 'sourceSize': source_size,
                        'imageSize': list(SIZE), 'opaque': True,
                        'preparation': {'resize': 'none' if source_size == list(SIZE) else 'nearest' if key == 'pixel' else 'lanczos',
                                        'color': 'RGB' if key == 'pixel' else 'neutral grayscale (equal RGB channels)'},
                        'period': 'Belgrade, October 1944',
                        'interpretation': 'Generated historical-game illustration; not an archival photograph or exact reconstruction.',
                        'streetTopY': spec['streetTopY'],
                        'actorPlacement': {'bodyCenterYRatio': .75, 'cellSize': [210, 210], 'cellAnchor': [105, 210],
                                           'visibleBootY': '.75 * canvas.height + 105; same as the existing OccupierSprite'},
                        'hotspots': [], 'compositions': previews,
                        'status': 'selected-and-integrated' if key == 'monochrome' else 'prepared-for-owner-review',
                        'runtimeIntegrated': key == 'monochrome'})
    manifest = {'schemaVersion': 1, 'scene': 'otpisani', 'selectedBackground': 'monochrome', 'backgrounds': records,
                'sourceRecord': 'generation.json', 'historicalSources': generation['historicalSources'],
                'reference': {'image': '../../../background/rusevine-varsava.jpg',
                              'note': 'Existing Warsaw photograph used only as a style comparison.'},
                'actors': {'image': '../../../armies/game-ready/vojnici/occupier-sprites.png', 'sha256': sha(ATLAS)},
                'placement': 'Background.render stretches the whole image to the canvas; this review uses that same image placement.'}
    template = (HERE / 'preview.template.html').read_text(encoding='utf-8')
    assert template.count('__BACKGROUND_MANIFEST__') == 1
    outputs[HERE / 'backgrounds.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    outputs[HERE / 'preview.html'] = template.replace('__BACKGROUND_MANIFEST__', json.dumps(manifest, ensure_ascii=False)).encode('utf-8')
    for path, data in outputs.items():
        if args.check:
            assert path.read_bytes() == data, 'Output differs from source recipe: ' + path.name
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    print(('Checked' if args.check else 'Prepared') + ': two opaque 1536x1024 backgrounds, neutral monochrome, source hashes and four compositions. Monochrome selected for Otpisani.')


if __name__ == '__main__':
    main()
