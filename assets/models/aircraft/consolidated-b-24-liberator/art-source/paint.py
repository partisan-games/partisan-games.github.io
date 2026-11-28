"""Draw the Liberator's three paint projections on blank pixel canvases."""

from math import cos, pi, sin
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "pixel-art"
OLIVE, OLIVE_LIGHT, OLIVE_DARK = "#50563b", "#5d6246", "#444b34"
GRAY, GRAY_LIGHT, GRAY_DARK = "#747c81", "#82898b", "#626d73"
BLUE, WHITE, RED = "#303e53", "#d3d0ba", "#8b4644"


def star_and_bar(pen, x, y, r):
    bar = round(r * 2.1)
    pen.rectangle((x - bar, y - r // 2, x + bar, y + r // 2), fill=BLUE)
    pen.ellipse((x-r, y-r, x+r, y+r), fill=BLUE)
    pen.rectangle((x - bar + 2, y - r // 2 + 2, x + bar - 2, y + r // 2 - 2), fill=WHITE)
    pen.ellipse((x-r+1, y-r+1, x+r-1, y+r-1), fill=BLUE)
    pen.rectangle((x - bar + 2, y, x - r + 1, y + 1), fill=RED)
    pen.rectangle((x + r - 1, y, x + bar - 2, y + 1), fill=RED)
    vertices = []
    for i in range(10):
        angle = i * pi / 5 - pi / 2
        radius = r * (.82 if i % 2 == 0 else .33)
        vertices.append((round(x + cos(angle) * radius), round(y + sin(angle) * radius)))
    pen.polygon(vertices, fill=WHITE)


def wear(image, count, seed):
    rng = Random(seed)
    pen = ImageDraw.Draw(image)
    for _ in range(count):
        x = rng.randrange(4, image.width - 7)
        y = rng.randrange(4, image.height - 3)
        color = image.getpixel((x, y))
        shift = rng.choice((-7, 6, 11, 15))
        tint = tuple(max(0, min(255, v + shift)) for v in color)
        pen.line((x, y, x + rng.randrange(1, 6), y), fill=tint)
        if shift > 10:
            pen.point((x + 1, y + 1), fill=tint)


def plan(upper):
    base, light, dark = (OLIVE, OLIVE_LIGHT, OLIVE_DARK) if upper else (GRAY, GRAY_LIGHT, GRAY_DARK)
    image = Image.new("RGB", (512, 320), base)
    pen = ImageDraw.Draw(image)
    pen.polygon([(0, 104), (104, 83), (213, 73), (302, 73), (402, 86), (511, 110),
                 (511, 119), (404, 103), (309, 91), (205, 91), (103, 100), (0, 118)], fill=light)
    pen.polygon([(0, 147), (119, 150), (213, 164), (304, 164), (407, 150),
                 (511, 143), (511, 180), (0, 180)], fill=dark)
    pen.line([(4, 147), (118, 150), (215, 162), (301, 162), (406, 150), (510, 143)], fill=dark, width=2)
    for x in (43, 88, 125, 184, 224, 286, 327, 384, 424, 468):
        pen.line([(x, 91), (x + 1, 115), (x, 149)], fill=dark)
        for y in range(101, 148, 8):
            pen.point((x + 2, y), fill=light)
    for x in (134, 207, 302, 370):
        # The four nacelles interrupt the leading edge. Soot trails go aft, along the direction of flight.
        pen.polygon([(x-6, 102), (x+6, 99), (x+11, 143), (x+6, 152),
                     (x-5, 140)], fill=dark)
        pen.line((x-7, 118, x+8, 118), fill=light)
    for x in (232, 278):
        pen.line((x, 176, x, 276), fill=dark)
    pen.line([(123, 278), (194, 273), (320, 273), (385, 278)], fill=dark, width=2)
    wear(image, 180, 24 if upper else 25)
    star_and_bar(pen, 94 if upper else 417, 121, 12)
    return image


def side():
    image = Image.new("RGB", (512, 128), OLIVE)
    pen = ImageDraw.Draw(image)
    pen.polygon([(0, 84), (63, 82), (131, 83), (239, 85), (339, 85),
                 (439, 82), (511, 80), (511, 127), (0, 127)], fill=GRAY_DARK)
    pen.polygon([(0, 92), (111, 90), (282, 93), (424, 91), (511, 87),
                 (511, 127), (0, 127)], fill=GRAY)
    pen.line([(0, 63), (78, 59), (228, 60), (402, 61), (511, 67)], fill=OLIVE_LIGHT, width=2)
    pen.line([(7, 82), (185, 80), (299, 81), (508, 78)], fill=OLIVE_DARK)
    for x in (36, 82, 139, 180, 242, 296, 404, 460):
        pen.line((x, 56, x, 101), fill=OLIVE_DARK)
        for y in range(62, 84, 5):
            pen.point((x + 2, y), fill=OLIVE_LIGHT)
    pen.rectangle((84, 71, 108, 83), outline=OLIVE_DARK)
    pen.line((86, 83, 105, 83), fill=OLIVE_LIGHT)
    pen.rectangle((438, 65, 449, 82), outline=OLIVE_DARK)
    pen.polygon([(452, 18), (469, 16), (474, 33), (467, 64), (455, 66)], fill=OLIVE_LIGHT)
    pen.line([(474, 13), (473, 39), (468, 69)], fill=OLIVE_DARK, width=2)
    for y in (22, 35, 48, 61):
        pen.line((475, y, 482, y), fill=OLIVE_DARK)
    wear(image, 72, 44)
    star_and_bar(pen, 368, 73, 10)
    return image


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, image in {"deck": plan(True), "belly": plan(False), "side": side()}.items():
        image.save(OUT / f"{name}.webp", lossless=True, method=6)
