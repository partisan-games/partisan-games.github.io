"""Export the repainted quadrants in their original UV orientation."""

from hashlib import sha256
import json
from pathlib import Path
import sys

from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def pad_fabric_edges(texture, reference):
    import numpy as np
    from scipy.ndimage import distance_transform_edt

    colors = np.array(texture)
    red, green, blue = colors.astype(np.int16).transpose(2, 0, 1)
    cloth = (red >= 129) & (green >= 109) & (blue >= 82)
    blank = (colors.max(axis=2) < 117) & (abs(red - green) <= 11)
    distance, indices = distance_transform_edt(~cloth, return_indices=True)
    original_cloth = np.asarray(reference.convert('RGB').resize(texture.size, Image.Resampling.NEAREST)).mean(axis=2) >= 89
    # Use the original island to cover shifted edges, with extra room for mip sampling.
    fill = blank & (distance <= 10) & (original_cloth | (distance <= 5))
    colors[fill] = colors[tuple(indices[:, fill])]
    return Image.fromarray(colors)


def main():
    manifest = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE / 'generation.json'
    folder = manifest.parent
    data = json.loads(manifest.read_text(encoding='utf-8'))
    original = folder / data['source']
    with Image.open(original) as draft:
        sheet = draft.convert('RGB')
    side = sheet.width // 2
    assert sheet.size == (2 * side, 2 * side)

    output = ROOT / data['outputFolder']
    output.mkdir(parents=True, exist_ok=True)
    for tile in data['maps']:
        if 'source' in tile:
            revision = folder / tile['source']
            with Image.open(revision) as image:
                width, height = image.size
                box = tuple(round(fraction * extent) for fraction, extent in zip(tile['sourceBox'], (width, height, width, height)))
                texture = image.convert('RGB').crop(box)
            tile['sourceSha256'] = digest(revision)
        else:
            x, y = (tile['column'] * side, tile['row'] * side)
            texture = sheet.crop((x, y, x + side, y + side))
        if 'crop' in tile:
            texture = texture.crop(tuple(round(fraction * side) for fraction in tile['crop']))
        texture = texture.resize(tuple(tile.get('size', data['textureSize'])), Image.Resampling.NEAREST)
        if tile.get('padFabricEdges'):
            with Image.open(folder / data['reference']) as guide:
                reference_side = guide.width // 2
                left, top = tile['column'] * reference_side, tile['row'] * reference_side
                reference = guide.crop((left, top, left + reference_side, top + reference_side))
                texture = pad_fabric_edges(texture, reference)
        path = output / (tile['name'] + '.webp')
        texture.save(path, lossless=True, exact=True, method=6)
        with Image.open(path) as webp:
            assert webp.convert('RGB').tobytes() == texture.tobytes()
        tile['outputSha256'] = digest(path)
        tile['outputBytes'] = path.stat().st_size

    data['sourceSha256'] = digest(original)
    data['referenceSha256'] = digest(folder / data['reference'])
    data['modelSha256'] = digest(ROOT / data['model'])
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
