"""Register the redrawn poses to their existing cells and emit a padded lossless atlas."""

from hashlib import sha256
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SIZE = (512, 512)
ALPHA_CUTOFF = 158


def register(draft, bounds, muzzle=None):
    alpha = draft.getchannel('A').point(lambda value: 0 if value < ALPHA_CUTOFF else value)
    draft.putalpha(alpha)
    left, top, right, bottom = bounds
    figure = draft.crop(alpha.getbbox()).resize((right - left, bottom - top), Image.Resampling.NEAREST)
    if muzzle:
        # A measured point on the new barrel is registered to the old flash origin.
        # Confine the correction to the rifle and hands to keep the feet and silhouette fixed.
        source, target = muzzle
        pixels = np.asarray(figure)
        y, x = np.indices(pixels.shape[:2])
        weight = np.clip(1 - ((x + left - target[0]) / 65) ** 2
                         - ((y + top - target[1]) / 42) ** 2, 0, 1)
        dx, dy = np.subtract(source, target)
        figure = Image.fromarray(pixels[np.rint(y + dy * weight).astype(int), np.rint(x + dx * weight).astype(int)])
    frame = Image.new('RGBA', SIZE)
    frame.paste(figure, (left, top))
    assert frame.getchannel('A').getbbox() == tuple(bounds)
    return frame


def column_cuts(row, columns):
    # A long fallen pose can extend beyond its nominal source column. Cut in the nearest gap.
    gaps = np.flatnonzero(np.asarray(row.getchannel('A')).max(axis=0) < ALPHA_CUTOFF)
    cuts = [0]
    for column in range(1, columns):
        center = row.width * column // columns
        cut = int(gaps[np.abs(gaps - center).argmin()])
        assert abs(cut - center) < row.width / columns / 4, 'Source poses overlap'
        cuts.append(cut)
    return [*cuts, row.width]


def main(manifest):
    data = json.loads(manifest.read_text(encoding='utf-8'))
    columns, rows = data['grid']
    gutter = data['gutter']
    pitch = SIZE[0] + 2 * gutter
    atlas = Image.new('RGBA', (pitch * columns, pitch * rows))
    original = ROOT / data['original']
    with Image.open(original) as image:
        template = image.convert('RGBA')
    for block in data['blocks']:
        source = manifest.parent / block['source']
        with Image.open(source) as image:
            raw = image.convert('RGBA')
        for row_index, row in enumerate(block['rows']):
            source_row = raw.crop((0, row_index * raw.height // 2, raw.width, (row_index + 1) * raw.height // 2))
            cuts = column_cuts(source_row, columns)
            for column in range(columns):
                source_column = 0 if row in data.get('singleFrameRows', []) else column
                draft = source_row.crop((cuts[source_column], 0, cuts[source_column + 1], source_row.height))
                x, y = column * SIZE[0], row * SIZE[1]
                bounds = template.crop((x, y, x + SIZE[0], y + SIZE[1])).getchannel('A').getbbox()
                muzzle = (block['muzzlePoints'][column], data['muzzle']) if row == 3 and 'muzzlePoints' in block else None
                frame = register(draft, bounds, muzzle)
                atlas.paste(frame, (column * pitch + gutter, row * pitch + gutter))
        block['sourceSha256'] = sha256(source.read_bytes()).hexdigest()

    output = ROOT / data['output']
    atlas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes()
    data['originalSha256'] = sha256(original.read_bytes()).hexdigest()
    data['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
