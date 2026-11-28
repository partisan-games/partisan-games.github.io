"""Draw independent Lancaster albedo maps at the stock model's measured UV coordinates."""

from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageOps

OUT = Path(__file__).resolve().parents[1] / "pixel-art"
EARTH, GREEN, NIGHT = "#795e44", "#505c42", "#353a3d"
BLUE, RED, WHITE, YELLOW = "#303d53", "#88413e", "#dbd1b6", "#b59a62"
SEAM, METAL, RIVET = "#303731", "#878775", "#57554a"
GLASS, REFLECTION, FRAME = "#293638", "#475b5a", "#77725c"


def canvas(size, color):
    image = Image.new("RGB", size, color)
    return image, ImageDraw.Draw(image)


def row_of_rivets(pen, left, right, y, spacing=7):
    for x in range(left, right, spacing):
        pen.point((x, y), fill=RIVET)


def wear(image, count, seed):
    rng = Random(seed)
    pen = ImageDraw.Draw(image)
    for _ in range(count):
        x = rng.randrange(2, image.width - 6)
        y = rng.randrange(2, image.height - 3)
        r, g, b = image.getpixel((x, y))
        bias = rng.choice((-9, 8, 14))
        color = tuple(max(0, min(255, value + bias)) for value in (r, g, b))
        pen.line((x, y, x + rng.randrange(1, 5), y), fill=color)
        if bias > 8:
            pen.point((x + 1, y + 1), fill=color)


def roundel(pen, center, radius, body=False):
    x, y = center
    rx, ry = radius
    rings = ((1, YELLOW), (.9, BLUE), (.49, WHITE), (.37, RED)) if body else ((1, BLUE), (.4, RED))
    for scale, color in rings:
        width, height = round(rx * scale), round(ry * scale)
        pen.ellipse((x - width, y - height, x + width, y + height), fill=color)


def wing(top, reverse=False):
    image, pen = canvas((256, 64), EARTH if top else NIGHT)
    if top:
        for shape in (
            [(0, 11), (42, 3), (54, 0), (113, 0), (120, 7), (136, 15), (134, 24),
             (115, 31), (102, 28), (81, 19), (67, 21), (58, 31), (24, 37), (0, 45)],
            [(183, 0), (255, 0), (255, 16), (235, 20), (224, 26), (207, 27),
             (197, 19), (189, 10)],
            [(219, 64), (93, 64), (96, 54), (112, 48), (135, 52), (151, 43),
             (182, 43), (196, 51), (210, 53)],
        ):
            pen.polygon(shape, fill=GREEN)
        pen.line([(0, 25), (37, 23), (119, 24), (215, 28), (252, 25)], fill="#62634b")
        pen.line([(55, 4), (80, 2), (114, 4)], fill="#617054")
        pen.line([(130, 57), (150, 50), (179, 48)], fill="#626b51")
    else:
        pen.polygon([(0, 6), (105, 8), (192, 13), (241, 20), (255, 26),
                     (255, 39), (180, 34), (79, 31), (0, 28)], fill="#434a4b")
        pen.rectangle((72, 8, 74, 58), fill="#694443")
        pen.rectangle((202, 16, 203, 55), fill="#694443")
    pen.line([(0, 58), (119, 57), (188, 54), (253, 47)], fill=SEAM, width=2)
    pen.line([(126, 57), (125, 50), (172, 48), (174, 54)], fill=SEAM)
    for x in (34, 74, 121, 191, 218):
        pen.line([(x, 1), (x - 1, 15), (x - 4, 23)], fill=SEAM)
    row_of_rivets(pen, 8, 125, 56)
    wear(image, 38, 55 if top else 41)
    if reverse:
        image = ImageOps.mirror(image)
        pen = ImageDraw.Draw(image)
    if top:
        roundel(pen, (91, 36) if reverse else (166, 37), (22, 16))
    return image


LETTERS = {
    "E": ("11111", "11000", "11000", "11110", "11000", "11000", "11111"),
    "D": ("11110", "11011", "11001", "11001", "11001", "11011", "11110"),
    # The stock fuselage UVs run upward from the bottom of the decal.
    "Z": ("11111", "11000", "01100", "00100", "00110", "00011", "11111"),
}


def code(pen, origin, text):
    x, y = origin
    for value in text:
        for row, mask in enumerate(LETTERS[value]):
            for column, pixel in enumerate(mask):
                if pixel == "1":
                    pen.rectangle((x + column * 3, y + row * 3, x + column * 3 + 2, y + row * 3 + 2), fill=RED)
        x += 19


def fuselage(reverse=False):
    image, pen = canvas((512, 64), NIGHT)
    pen.polygon([(0, 13), (90, 11), (217, 13), (326, 11), (451, 12),
                 (511, 16), (511, 31), (300, 27), (170, 32), (0, 29)], fill="#404748")
    pen.polygon([(0, 42), (81, 43), (156, 43), (210, 45), (317, 46),
                 (430, 43), (511, 42), (511, 63), (0, 63)], fill=GREEN)
    for x, height, length in ((69, 43, 76), (192, 45, 81), (321, 46, 64), (463, 43, 42)):
        pen.polygon([(x + 15, height), (x + length, height), (x + length - 16, 63),
                     (x, 63), (x + 7, 54)], fill=EARTH)
    pen.line([(0, 19), (112, 19), (205, 20), (407, 19), (511, 22)], fill="#505653")
    pen.line([(0, 39), (145, 40), (265, 39), (397, 40), (511, 39)], fill="#2c3335")
    for x in (33, 83, 121, 259, 302, 360, 418, 475):
        pen.line([(x, 7), (x + 2, 21), (x + 1, 37)], fill="#323a3c")
        row_of_rivets(pen, x + 5, min(x + 38, 510), 36)
    for x in (108, 130, 151, 214, 235, 255):
        pen.rounded_rectangle((x, 39, x + 8, 41), radius=1, fill="#83867d")
    wear(image, 47, 51)
    if reverse:
        image = ImageOps.mirror(image)
        pen = ImageDraw.Draw(image)
        code(pen, (263, 22), "ED")
        roundel(pen, (323, 30), (18, 13), body=True)
        code(pen, (345, 22), "Z")
    else:
        code(pen, (146, 22), "Z")
        roundel(pen, (187, 30), (18, 13), body=True)
        code(pen, (209, 22), "ED")
    return image


def nacelle(reverse=False):
    image, pen = canvas((128, 32), NIGHT)
    pen.polygon([(0, 26), (38, 26), (62, 25), (91, 22), (127, 22), (127, 31), (0, 31)], fill=GREEN)
    pen.polygon([(55, 31), (63, 25), (95, 24), (113, 27), (115, 31)], fill=EARTH)
    pen.line([(0, 12), (40, 11), (109, 12), (127, 10)], fill="#464d4b", width=2)
    for x in (33, 68, 91, 119):
        pen.line((x, 4, x, 26), fill=SEAM)
        pen.line((x + 1, 5, x + 1, 20), fill="#59605a")
    for x in range(77, 113, 5):
        pen.line((x, 18, x + 2, 18), fill=METAL)
    wear(image, 20, 143)
    return ImageOps.mirror(image) if reverse else image


def tailplane(reverse=False):
    image, pen = canvas((64, 32), GREEN)
    pen.polygon([(22, 0), (48, 0), (42, 9), (35, 15), (33, 24), (23, 31),
                 (6, 31), (13, 24), (17, 13)], fill=EARTH)
    pen.line([(0, 14), (40, 14), (61, 12)], fill=SEAM, width=2)
    pen.line([(0, 17), (40, 17), (61, 15)], fill="#727260")
    row_of_rivets(pen, 5, 60, 18, 4)
    wear(image, 13, 96)
    return ImageOps.mirror(image) if reverse else image


def fin():
    image, pen = canvas((32, 128), NIGHT)
    pen.polygon([(12, 0), (23, 0), (21, 64), (19, 128), (14, 128)], fill="#434a4a")
    pen.line([(20, 4), (19, 70), (18, 123)], fill=SEAM, width=2)
    pen.rectangle((0, 34, 8, 53), fill=RED)
    pen.rectangle((9, 34, 11, 53), fill=WHITE)
    pen.rectangle((12, 34, 19, 53), fill=BLUE)
    wear(image, 11, 30)
    return image


def intake(reverse=False):
    image, pen = canvas((64, 32), "#3a4544")
    pen.polygon([(0, 0), (63, 0), (63, 7), (40, 11), (4, 10)], fill="#525e59")
    pen.line((1, 23, 62, 23), fill=SEAM)
    for x in range(4, 62, 7):
        pen.line((x, 15, x, 21), fill="#2d3535")
        pen.point((x + 1, 15), fill=METAL)
    wear(image, 13, 155)
    return ImageOps.mirror(image) if reverse else image


def glazing(size, bars, curves=()):
    image, pen = canvas(size, GLASS)
    width, height = size
    pen.polygon([(0, 0), (width * .37, 0), (width * .75, height * .54), (width * .4, height * .5)],
                fill=REFLECTION)
    pen.line((0, 0, width - 1, 0), fill=FRAME)
    for x in bars:
        pen.line((x, 0, x, height - 1), fill=FRAME, width=2)
        pen.line((x + 1, 0, x + 1, height - 1), fill="#a09a80")
    pen.line((0, height // 2, width - 1, height // 2), fill=FRAME, width=2)
    for path in curves:
        pen.line(path, fill=FRAME, width=2)
    return image


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, art in {
        "wing-top-a": wing(True), "wing-top-b": wing(True, True),
        "wing-bottom-a": wing(False), "wing-bottom-b": wing(False, True),
        "fuselage-a": fuselage(), "fuselage-b": fuselage(True),
        "nacelle-a": nacelle(), "nacelle-b": nacelle(True),
        "tailplane-a": tailplane(), "tailplane-b": tailplane(True),
        "fin": fin(), "intake-a": intake(), "intake-b": intake(True),
        "nose-glass": glazing((32, 16), (11, 30), (((1, 2), (2, 12), (10, 15)),)),
        "cockpit-glass": glazing((128, 16), (6, 17, 37, 63, 76, 95, 108),
                                  (((1, 4), (9, 9), (19, 9)), ((77, 1), (117, 8), (126, 7)))),
        "tail-glass": glazing((32, 16), (13, 30), (((1, 9), (6, 14), (27, 14), (31, 9)),)),
        "upper-glass": glazing((32, 32), (6, 13, 25),
                               (((0, 23), (13, 24), (24, 13), (31, 10)), ((11, 31), (30, 16)))),
    }.items():
        art.save(OUT / f"{name}.webp", lossless=True, method=6)
