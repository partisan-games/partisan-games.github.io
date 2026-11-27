"""Keep the painted islands registered to the embedded FBX atlas."""

from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def atlas(path, size):
    with Image.open(path) as image:
        return np.array(image.convert('RGB').resize(size, Image.Resampling.NEAREST))


def blank(pixels):
    level = pixels.mean(axis=2)
    return (np.ptp(pixels, axis=2) < 12) & (level >= 149) & (level <= 215)


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    reference = SOURCE / data['reference']
    source = SOURCE / data['source']
    # Work at reference density before flattening the artwork into game pixels.
    size = (1024, 1024)
    original = atlas(reference, size)
    painted = atlas(source, size)
    empty = blank(painted)
    distance, indices = distance_transform_edt(empty, return_indices=True)
    # Bleed into the empty atlas around the islands for the texture's mip levels.
    padding = empty & ((distance <= 4) | (~blank(original) & (distance <= 8)))
    painted[padding] = painted[tuple(indices[:, padding])]

    texture = Image.fromarray(painted).resize(tuple(data['frame']), Image.Resampling.NEAREST)
    output = ROOT / data['output']
    output.parent.mkdir(parents=True, exist_ok=True)
    texture.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as webp:
        assert webp.convert('RGB').tobytes() == texture.tobytes()

    data['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    data['referenceSha256'] = sha256(reference.read_bytes()).hexdigest()
    data['modelSha256'] = sha256((ROOT / data['model']).read_bytes()).hexdigest()
    data['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    data['outputBytes'] = output.stat().st_size
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
