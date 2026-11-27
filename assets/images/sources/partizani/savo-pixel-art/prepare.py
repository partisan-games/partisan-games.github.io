"""Project the portrait onto the existing FBX UVs and export the material maps."""
from argparse import ArgumentParser
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps


SOURCE = Path(__file__).resolve().parent
OUTPUT = SOURCE.parents[3] / "models/character/soldier/savo-pixel-art"
SIZE = 256
COLORS = {
    "skin": ("face", (193, 135, 99)),
    "army.green": ("uniform", (83, 88, 52)),
    "brown": ("hair-and-leather", (70, 52, 41)),
    "navy.blue": ("trousers", (94, 91, 82)),
}
PORTRAIT_SIZE = (450, 490)
PORTRAIT_SCALE = 650
PORTRAIT_BASELINE = 1657
BROWN_UNIFORM = {"army.green": ("uniform-brown", (102, 85, 65))}


def interpolate(points):
    uv = np.array([(u * SIZE, (1 - v) * SIZE) for u, v, *_ in points])
    low = np.clip(np.floor(uv.min(axis=0)).astype(int), 0, SIZE - 1)
    high = np.clip(np.ceil(uv.max(axis=0)).astype(int) + 1, 0, SIZE)
    xs, ys = np.meshgrid(np.arange(low[0], high[0]), np.arange(low[1], high[1]))
    corner = uv[0]
    ab, ac = uv[1] - corner, uv[2] - corner
    area = ab[0] * ac[1] - ab[1] * ac[0]
    if abs(area) < 1e-5:
        return None
    dx, dy = xs + .5 - corner[0], ys + .5 - corner[1]
    b = (dx * ac[1] - dy * ac[0]) / area
    c = (ab[0] * dy - ab[1] * dx) / area
    inside = (b >= 0) & (c >= 0) & (b + c <= 1)
    weights = np.stack((1 - b[inside] - c[inside], b[inside], c[inside]), axis=1)
    return xs[inside], ys[inside], weights @ np.array([point[2:] for point in points])


def portrait_coordinates(x, z):
    px = (PORTRAIT_SIZE[0] / 2 + x * PORTRAIT_SCALE).astype(int).clip(0, PORTRAIT_SIZE[0] - 1)
    py = (PORTRAIT_BASELINE - z * PORTRAIT_SCALE).astype(int).clip(0, PORTRAIT_SIZE[1] - 1)
    return px, py


def paint(material, coordinates, portrait, base, brown_uniform):
    x, y, z = coordinates.T
    color = np.repeat(np.array([base], dtype=float), len(x), axis=0)
    px, py = portrait_coordinates(x, z)
    swatch = portrait[py, px]
    r, g, b = swatch.T
    if material == "skin":
        # Existing facial geometry already supplies the eyes and moustache.
        face = (z > 1.93) & (r > 114) & (r > g + 17) & (g > b + 10)
        projection = np.clip((-y - .07) / .11, 0, 1) * face
        color += (swatch - color) * projection[:, None] * .78
        # Recover the dark brow pixels discarded by the skin-color mask, above the eyelids.
        eyebrow_width = ((px >= 178) & (px <= 219)) | ((px >= 229) & (px <= 272))
        brows = eyebrow_width & (py >= 145) & (py <= 155) & (r < 130)
        strength = np.clip((-y - .07) / .11, 0, 1) * brows * .94
        color += (swatch - color) * strength[:, None]
    elif brown_uniform:
        wool = (z > 1.81) & (r > g + 7) & (r < g + 28) & (g > b + 6) & (g < b + 25) & (r < 120)
        projection = np.clip((-y - .07) / .11, 0, 1) * wool
        # Keep the painted collar and folds as small value changes in the existing wool palette.
        shade = np.clip(np.mean(swatch, axis=1) - 71, -13, 11)
        color += (shade * projection)[:, None]
    elif material == "army.green":
        olive = (z > 1.6) & (g > r - 13) & (g > b + 15) & (g < 140)
        projection = np.clip((-y - .07) / .12, 0, 1) * olive
        color += (swatch - color) * projection[:, None] * .32
        color += (np.floor(z * 5) % 3 - 1)[:, None] * 2
    elif material == "brown":
        hair = z > 2.03
        strands = (np.floor(x * 92 + z * 17) % 5 == 0) * 7
        color[hair] = np.array([48, 34, 27]) + strands[hair, None]
        front = hair & (y < -.17) & (z < 2.25)
        color[front] = (50, 34, 25)
    else:
        knees = (z > .54) & (z < .67) & (y < -.035)
        color[knees] += 3
    return (np.round(color / 4) * 4).clip(0, 255).astype(np.uint8)


def pad_edges(pixels, used):
    # Extend the material into the space outside its UV islands before mipmapping.
    for _ in range(5):
        shifted = np.pad(used, 1)
        colors = np.pad(pixels, ((1, 1), (1, 1), (0, 0)), mode="edge")
        for x, y in ((0, 1), (1, 0), (2, 1), (1, 2)):
            mask = shifted[y:y + SIZE, x:x + SIZE] & ~used
            pixels[mask] = colors[y:y + SIZE, x:x + SIZE][mask]
            used |= mask


def build(parts, brown_uniform=False):
    colors = BROWN_UNIFORM if brown_uniform else COLORS
    name = "brown-portrait.png" if brown_uniform else "portrait.png"
    with Image.open(SOURCE / name) as image:
        portrait = np.array(ImageOps.fit(image.convert("RGB"), PORTRAIT_SIZE, Image.Resampling.NEAREST), dtype=float)
    maps = {name: np.full((SIZE, SIZE, 3), color, dtype=np.uint8) for name, (_, color) in colors.items()}
    filled = {name: np.zeros((SIZE, SIZE), dtype=bool) for name in maps}
    front = np.full((SIZE, SIZE), np.inf)
    for part in parts:
        for material, points in part["triangles"]:
            if material not in maps:
                continue
            sample = interpolate(points)
            if sample is None:
                continue
            x, y, coordinates = sample
            if material == "skin":
                choose = coordinates[:, 1] < front[y, x]
                x, y, coordinates = x[choose], y[choose], coordinates[choose]
                front[y, x] = coordinates[:, 1]
            maps[material][y, x] = paint(material, coordinates, portrait, colors[material][1], brown_uniform)
            filled[material][y, x] = True
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for material, (name, _) in colors.items():
        pad_edges(maps[material], filled[material])
        Image.fromarray(maps[material]).save(OUTPUT / f"{name}.webp", lossless=True, method=6)


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("triangles", type=Path)
    parser.add_argument("--brown-uniform", action="store_true")
    args = parser.parse_args()
    build(json.loads(args.triangles.read_text(encoding="utf-8")), args.brown_uniform)
