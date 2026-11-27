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
        x, y = (tile['column'] * side, tile['row'] * side)
        texture = sheet.crop((x, y, x + side, y + side))
        if 'crop' in tile:
            texture = texture.crop(tuple(round(fraction * side) for fraction in tile['crop']))
        texture = texture.resize(tuple(tile.get('size', data['textureSize'])), Image.Resampling.NEAREST)
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
