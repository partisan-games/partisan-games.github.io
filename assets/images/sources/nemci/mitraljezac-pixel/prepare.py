"""Pack the redrawn machine gunner with a shared pivot, muzzle and transparent gutters."""

from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def register(cell, width, height, tip_x, tip_y):
    pixels = np.array(cell)
    # Strip the faint cutout halo before using the solid barrel as a registration mark.
    pixels[pixels[:, :, 3] < 170, 3] = 0
    y, x = np.nonzero(pixels[:, :, 3])
    left, right = x.min(), x.max()
    muzzle = np.median(y[x <= left + 8])
    # Fit every muzzle to the same point and keep the gunner's back on the window pivot.
    sx = (right - left) / (width - 2 - tip_x)
    u = np.floor(left + (np.arange(width) - tip_x) * sx + .5).astype(int)
    v = np.floor(muzzle + (np.arange(height) - tip_y) / .31 + .5).astype(int)
    frame = Image.fromarray(pixels[np.ix_(v, u)])
    alpha = frame.getchannel('A')
    assert alpha.crop((tip_x - 1, tip_y - 2, tip_x + 3, tip_y + 3)).getbbox(), 'Missing muzzle'
    return frame


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    width, height = data['frame']
    gutter, columns, rows = data['gutter'], data['framesPerRow'], len(data['rows'])
    pitch_x, pitch_y = width + 2 * gutter, height + 2 * gutter
    atlas = Image.new('RGBA', (pitch_x * columns, pitch_y * rows))
    source = SOURCE / data['source']
    with Image.open(source) as draft:
        for row in range(rows):
            for column in range(columns):
                box = (draft.width * column // columns, draft.height * row // rows,
                       draft.width * (column + 1) // columns, draft.height * (row + 1) // rows)
                frame = register(draft.crop(box).convert('RGBA'), width, height, *data['muzzle'])
                atlas.paste(frame, (column * pitch_x + gutter, row * pitch_y + gutter))

    output = ROOT / data['output']
    atlas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as decoded:
        assert decoded.convert('RGBA').tobytes() == atlas.tobytes()
    data['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    data['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    for ref in data['references']:
        ref['sha256'] = sha256((ROOT / ref['path']).read_bytes()).hexdigest()
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
