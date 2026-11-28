"""Repaint the existing B-25 color maps in their original UV registration."""

import io
import json
import struct
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

HERE = Path(__file__).resolve().parent
MODEL = HERE.parent / "model.glb"
OUT = HERE.parent / "pixel-art"
NAMES = ("engines", "left-wing", "right-wing", "tailplane",
         "left-fin", "right-fin", "nose", "fuselage")
OLIVE = (83, 88, 57)
UNDERSIDE = (124, 134, 139)
GLASS = (61, 77, 79)
WEAR = Image.open(HERE / "wear.png").convert("L")


def embedded_maps():
    model = MODEL.read_bytes()
    length = struct.unpack_from("<I", model, 12)[0]
    manifest = json.loads(model[20:20 + length])
    data = model[28 + length:]
    for image in manifest["images"][1:]:
        view = manifest["bufferViews"][image["bufferView"]]
        offset = view.get("byteOffset", 0)
        yield Image.open(io.BytesIO(data[offset:offset + view["byteLength"]])).convert("RGB")


def shade(color, difference):
    return tuple(max(0, min(255, channel + difference)) for channel in color)


def surface(color):
    r, g, b = color
    if r < 75 and g - r > 47 and b - g > 35 and b > 157:
        return "glass"
    if 55 <= r <= 105 and 61 <= g <= 111 and 16 <= b <= 78 and g - b >= 23 and abs(r - g) < 16:
        return "olive"
    if 111 <= r <= 154 and 125 <= g <= 165 and 140 <= b <= 177 and 12 <= b - r <= 45:
        return "underside"
    return None


def seam(color):
    r, g, b = color
    return r < 47 and g < 53 and b < 52 and abs(r - g) < 17


def repaint(original, index):
    width, height = original.width // 2, original.height // 2
    sample = original.resize((width, height), Image.Resampling.NEAREST)
    pixels = sample.load()
    glass_edges = None
    if NAMES[index] in ("nose", "fuselage"):
        mask = Image.new("L", sample.size)
        mask.putdata([255 if surface(color) == "glass" else 0 for color in sample.get_flattened_data()])
        glass_edges = mask.filter(ImageFilter.MaxFilter(3)).load()
    base = sample.copy()
    paint = base.load()
    marks = WEAR.rotate(90 * (index % 4)).resize((width, height), Image.Resampling.BOX)
    if index % 2:
        marks = ImageOps.mirror(marks)
    marks = ImageChops.offset(marks, 23 * index, 13 * index).load()
    for y in range(height):
        for x in range(width):
            color = pixels[x, y]
            material = surface(color)
            r, g, b = color
            glass_edge = glass_edges and glass_edges[x, y] and b > 105 and g - r > 16 and b - g > 16
            if material == "glass" or glass_edge:
                # Long, broken reflections on the windscreen, aligned across adjacent panes.
                level = ((y // 3) * 3 + (x // 4)) % 63
                flash = 20 if 11 <= level <= 14 else 10 if 8 <= level <= 21 else -9 if level > 47 else 0
                if not material:
                    flash -= 13
                paint[x, y] = shade(GLASS, flash)
            elif material:
                metal = OLIVE if material == "olive" else UNDERSIDE
                wear = marks[x, y]
                abrasion = 16 if wear > 100 else 8 if wear > 89 else -4 if wear < 73 else 0
                left = x > 0 and seam(pixels[x - 1, y])
                above = y > 0 and seam(pixels[x, y - 1])
                rivet = left and (y + index) % 7 == 0 or above and (x + index) % 7 == 0
                paint[x, y] = shade(metal, abrasion + (8 if rivet else 3 if left or above else 0))
    return base


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for index, (name, image) in enumerate(zip(NAMES, embedded_maps(), strict=True)):
        repaint(image, index).save(OUT / f"{name}.webp", lossless=True, method=6)
