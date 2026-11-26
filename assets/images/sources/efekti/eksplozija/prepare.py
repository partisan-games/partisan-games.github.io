"""Pack the two source rows into the eight centered frames used in the game."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    source = SOURCE / data['source']
    with Image.open(source) as draft:
        art = draft.convert('RGBA')

    alpha = art.getchannel('A').point(lambda value: value if value >= 128 else 0)
    art.putalpha(alpha)
    columns = data['sourceColumns']
    tops = data['sourceRowTops']
    size = data['frameSize']
    gutter = data['gutter']
    stride = size + 2 * gutter
    atlas = Image.new('RGBA', (stride * columns * len(tops), stride))
    for row, top in enumerate(tops):
        for column in range(columns):
            left = column * art.width // columns
            right = (column + 1) * art.width // columns
            cell = art.crop((left, top, right, top + right - left))
            frame = cell.resize((size, size), Image.Resampling.NEAREST)
            assert frame.getchannel('A').getbbox(), (row, column)
            atlas.paste(frame, ((row * columns + column) * stride + gutter, gutter))

    output = ROOT / data['output']
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as webp:
        assert webp.convert('RGBA').tobytes() == atlas.tobytes()

    data['referenceSha256'] = sha256((SOURCE / data['reference']).read_bytes()).hexdigest()
    data['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    data['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
