"""Project the portrait and wool onto the existing cetnik.fbx UV islands."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import distance_transform_edt


SOURCE = Path(__file__).resolve().parent
TARGET = SOURCE.parents[3] / 'models/character/soldier/cetnik-strelac-pixel-art'
SIZE = 256
PALETTE = {
    'skin': ('face', (145, 92, 62)),
    'brown': ('hair-beard', (15, 5, 3)),
    'brown.uniform': ('blouse', (69, 56, 34)),
    'khaki.trousers': ('trousers', (93, 76, 49)),
}


def rasterize(triangle):
    uv = np.array([(u, 1 - v) for u, v, *_ in triangle]) * SIZE
    lo = np.floor(uv.min(axis=0)).astype(int).clip(0, SIZE - 1)
    hi = (np.ceil(uv.max(axis=0)).astype(int) + 1).clip(0, SIZE)
    x, y = np.meshgrid(np.arange(lo[0], hi[0]), np.arange(lo[1], hi[1]))
    origin, b, c = uv
    ab, ac = b - origin, c - origin
    area = ab[0] * ac[1] - ab[1] * ac[0]
    if abs(area) < 1e-5:
        return None
    dx, dy = x + .5 - origin[0], y + .5 - origin[1]
    b = (dx * ac[1] - dy * ac[0]) / area
    c = (ab[0] * dy - ab[1] * dx) / area
    inside = (b >= 0) & (c >= 0) & (b + c <= 1)
    weights = np.column_stack((1 - b[inside] - c[inside], b[inside], c[inside]))
    return x[inside], y[inside], weights @ np.array([point[2:] for point in triangle])


def paint(slot, xyz, portrait):
    x, y, z = xyz.T
    rgb = np.repeat(np.array([PALETTE[slot][1]], dtype=float), len(x), axis=0)
    px = (225 + 650 * x).astype(int).clip(0, 449)
    py = (1657 - 650 * z).astype(int).clip(0, 489)
    sample = portrait[py, px]
    r, g, b = sample.T
    front = np.clip((-y - .075) / .11, 0, 1)
    if slot == 'skin':
        skin = (z > 2.075) & (r > 108) & (r > g + 20) & (g > b + 7)
        brow = (py >= 143) & (py <= 152) & (r < 115) & (abs(px - 225) > 9) & (abs(px - 225) < 48)
        # Eyelids, lips and iris geometry already occupy their own positions.
        strength = np.maximum(front * skin * .68, front * brow * .82)
        rgb += (sample - np.array([165, 117, 83])) * strength[:, None]
        rgb[brow & (front > .64)] = (89, 62, 43)
    elif slot == 'brown':
        head = z > 2.065
        phase = x * 78 + y * 42 + z * 25 + 1.2 * np.sin(z * 55 + y * 37)
        strand = (np.floor(phase) % 5 <= 1) & (np.floor(z * 30 + y * 24) % 4 != 0)
        strands = strand * 9
        rgb[head] = np.array([55, 47, 39]) + strands[head, None]
        cheek = head & (y < -.047) & (z < 2.244)
        rgb[cheek] += 4
        beard = head & (r < 161) & (r > g) & (g > b) & (r < g + 24)
        rgb += (sample * .9 - rgb) * (front * beard * .78)[:, None]
        # The small pupil triangles reuse beard UVs. Keep the shared material in
        # the beard's neutral range, otherwise the iris tint appears on the jaw.
    elif slot == 'brown.uniform':
        wool = (z > 1.8) & (r > g + 4) & (r < g + 23) & (g > b + 10) & (r < 155)
        shade = np.clip((sample.mean(axis=1) - 106) * .33, -7, 8)
        rgb += (front * wool * shade)[:, None]
    elif slot == 'khaki.trousers':
        crease = (z > .57) & (z < .66) & (y < -.055)
        rgb[crease] -= 4
    return np.round(rgb / 3).clip(0, 85).astype(np.uint8) * 3


def main():
    parts = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    with Image.open(SOURCE / 'portrait.png') as image:
        portrait = np.array(ImageOps.fit(image.convert('RGB'), (450, 490), Image.Resampling.NEAREST), dtype=float)
    TARGET.mkdir(parents=True, exist_ok=True)
    Image.new('RGB', (1, 1), (123, 72, 57)).save(TARGET / 'lips.webp', lossless=True)
    for slot, (name, color) in PALETTE.items():
        image = np.full((SIZE, SIZE, 3), color, dtype=np.uint8)
        depth = np.full((SIZE, SIZE), np.inf)
        for part in parts:
            for material, triangle in part['triangles']:
                if material != slot or (pixels := rasterize(triangle)) is None:
                    continue
                x, y, xyz = pixels
                order = xyz[:, 1] - (xyz[:, 2] > 2.065)
                closest = order < depth[y, x]
                x, y, xyz = x[closest], y[closest], xyz[closest]
                depth[y, x] = order[closest]
                image[y, x] = paint(slot, xyz, portrait)
        empty = np.isinf(depth)
        distance, edges = distance_transform_edt(empty, return_indices=True)
        bleed = empty & (distance <= 5)
        image[bleed] = image[tuple(edges[:, bleed])]
        Image.fromarray(image).save(TARGET / f'{name}.webp', lossless=True, method=6)


if __name__ == '__main__':
    main()
