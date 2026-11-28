"""Draw the Partisan Games UI atlas and its coordinate manifest with Pillow."""

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "ui" / "pixel-icons.webp"
SIZE = 64
INK, LIGHT, SHADE = "#20211e", "#f0e6cc", "#939480"
STEEL, SHADOW = "#c0c5bd", "#777f78"
GOLD, RED = "#e2b866", "#b85f4b"
OLIVE = "#929a72"


class Icon:
    """Ink on a 64-unit canvas, sampled at 4× for smoother silhouettes."""

    scale = 4

    def __init__(self):
        self.image = Image.new("RGBA", (SIZE * self.scale, SIZE * self.scale))
        self.draw = ImageDraw.Draw(self.image)

    def points(self, points):
        return [(round(x * self.scale), round(y * self.scale)) for x, y in points]

    def poly(self, points, color, edge=INK, width=2.5):
        path = list(points)
        self.draw.polygon(self.points(path), fill=color)
        if edge:
            self.line([*path, path[0]], edge, width)

    def line(self, points, color, width, rounded=False):
        path = self.points(points)
        self.draw.line(path, fill=color, width=round(width * self.scale), joint="curve")
        if rounded:
            for x, y in (points[0], points[-1]):
                r = width / 2
                self.ellipse((x-r, y-r, x+r, y+r), color)

    def ellipse(self, box, color, edge=None, width=2.5):
        self.draw.ellipse([round(v * self.scale) for v in box], fill=color, outline=edge,
                          width=round(width * self.scale))

    def round_rect(self, box, radius, color, edge=None, width=2.5):
        self.draw.rounded_rectangle([round(v * self.scale) for v in box], round(radius * self.scale),
                                    fill=color, outline=edge, width=round(width * self.scale))

    def arc(self, box, start, end, color, width):
        self.draw.arc([round(v * self.scale) for v in box], start, end, fill=color,
                      width=round(width * self.scale))

    def finish(self):
        return self.image.resize((SIZE, SIZE), Image.Resampling.BOX)


def gear():
    a = Icon()
    teeth = [(32 + r * math.cos(math.radians(n * 45 + angle)),
              32 + r * math.sin(math.radians(n * 45 + angle)))
             for n in range(8) for angle, r in [(-22.5, 20), (-15, 20), (-11, 26), (11, 26), (15, 20), (22.5, 20)]]
    a.poly(teeth, SHADOW, width=3)
    a.ellipse((13, 13, 51, 51), STEEL, INK, 2)
    a.ellipse((22, 22, 42, 42), INK)
    a.ellipse((25, 25, 39, 39), (0, 0, 0, 0))
    a.arc((15, 15, 49, 49), 196, 275, LIGHT, 2)
    return a.finish()


def medal():
    a = Icon()
    a.poly([(14, 8), (50, 8), (45, 17), (42, 24), (22, 24), (19, 17)], RED)
    a.poly([(22, 10), (28, 10), (29, 22), (26, 22)], LIGHT, None)
    a.poly([(36, 10), (42, 10), (38, 22), (35, 22)], LIGHT, None)
    a.ellipse((11, 19, 53, 60), GOLD, INK, 3)
    a.ellipse((16, 24, 48, 55), "#ac7941", "#6d4a2f", 1.5)
    a.poly(star(32, 39, 13, 5.8), LIGHT, "#775631", 1)
    return a.finish()


def star(x, y, radius, inner, points=5):
    return [(x + r * math.sin(math.pi * i / points), y - r * math.cos(math.pi * i / points))
            for i in range(2 * points) for r in [radius if i % 2 == 0 else inner]]


def shooting():
    a = Icon()
    a.poly([(12, 20), (24, 22), (29, 10), (35, 20), (48, 12), (45, 26),
            (54, 30), (45, 36), (50, 50), (36, 45), (30, 54), (24, 44),
            (12, 48), (17, 36), (9, 30), (19, 27)], "#dc7b43", width=3)
    a.poly([(19, 29), (26, 28), (29, 18), (34, 26), (42, 22), (40, 29),
            (46, 32), (39, 36), (41, 44), (34, 40), (30, 46), (26, 39),
            (19, 41), (23, 35)], GOLD, None)
    a.poly([(24, 32), (29, 30), (31, 26), (34, 30), (38, 29), (36, 34),
            (40, 36), (34, 36), (31, 40), (29, 36), (24, 37), (27, 34)], LIGHT, None)
    return a.finish()


def grenade():
    a = Icon()
    a.ellipse((31, 6, 46, 21), None, INK, 5)
    a.ellipse((32, 7, 45, 20), None, STEEL, 2)
    a.round_rect((15, 19, 44, 57), 12, OLIVE, INK, 3)
    a.round_rect((20, 14, 37, 24), 3, SHADOW, INK, 2)
    for y in (30, 39, 48):
        a.line([(17, y-1), (27, y), (42, y-1)], "#4c5340", 2)
        a.line([(20, y+2), (28, y+3), (39, y+2)], "#b6bb91", 1.5)
    a.line([(24, 24), (23, 41), (24, 52)], "#565e46", 2)
    a.line([(34, 23), (35, 41), (34, 53)], "#565e46", 2)
    a.line([(29, 17), (40, 18), (48, 29), (48, 48)], INK, 6, True)
    a.line([(29, 17), (40, 18), (48, 29), (48, 48)], STEEL, 3.3, True)
    return a.finish()


def rocket():
    a = Icon()
    a.poly([(17, 41), (21, 38), (27, 44), (17, 54), (8, 56), (12, 48)], RED)
    a.poly([(18, 43), (22, 44), (15, 51), (12, 52)], GOLD, None)
    a.poly([(18, 32), (28, 26), (35, 29), (29, 36), (17, 42), (13, 40)], SHADOW)
    a.poly([(30, 37), (38, 30), (39, 39), (33, 49), (24, 53), (23, 48)], SHADOW)
    a.poly([(18, 38), (42, 13), (48, 9), (55, 8), (54, 15), (50, 22), (27, 47)], STEEL)
    a.line([(23, 39), (46, 16)], LIGHT, 2.5, True)
    a.line([(39, 16), (48, 25)], OLIVE, 5)
    a.line([(20, 36), (29, 45)], INK, 2.5)
    return a.finish()


def hand():
    a = Icon()
    a.poly([(21, 50), (20, 45), (12, 36), (10, 32), (13, 29), (16, 29.5), (22, 35),
            (21, 16.5), (22.5, 13), (26, 13), (28, 15.5), (28, 27.5), (28.5, 11), (30, 8.5),
            (34, 8.5), (35.5, 11), (35.5, 27.5), (37, 14), (40, 12), (43, 14), (43, 27.5),
            (46, 19), (49.5, 18), (52, 21), (50, 35.5), (47.5, 43.5), (43, 47.5), (42.5, 51)], "#d5a47c")
    a.line([(23, 36), (28.5, 31), (39, 31)], "#a17356", 2, True)
    a.line([(31, 12), (31, 24)], "#edd0a7", 2, True)
    a.line([(36, 35.5), (41.5, 37), (43, 41.5)], "#a17356", 2, True)
    a.round_rect((20, 47.5, 43, 55.5), 2, OLIVE, INK, 2.5)
    a.line([(22.5, 51), (40.5, 51)], "#b1b48e", 1.8, True)
    return a.finish()


def play(resume=False):
    a = Icon()
    if resume:
        a.round_rect((10, 14, 20, 50), 2, LIGHT, INK)
    left = 25 if resume else 19
    a.poly([(left, 13), (51, 32), (left, 51)], LIGHT, width=3)
    a.line([(left + 2, 47), (48, 32)], SHADE, 2, True)
    return a.finish()


def pause():
    a = Icon()
    for x in (18, 36):
        a.round_rect((x, 14, x + 10, 50), 2, LIGHT, INK)
        a.line([(x + 3, 47), (x + 7, 47)], SHADE, 1.5, True)
    return a.finish()


def menu():
    a = Icon()
    for y in (14, 27, 40):
        a.round_rect((14, y, 50, y + 10), 2, LIGHT, INK)
    return a.finish()


def back():
    a = Icon()
    # A hooked return arrow distinguishes navigation back from lateral movement.
    a.line([(20, 25), (39, 25), (46, 27), (50, 32), (50, 40), (46, 46),
            (40, 49), (32, 49)], INK, 11, True)
    a.line([(20, 25), (39, 25), (46, 27), (50, 32), (50, 40), (46, 46),
            (40, 49), (32, 49)], STEEL, 6, True)
    a.poly([(11, 25), (26, 12), (26, 38)], LIGHT)
    return a.finish()


def replay():
    a = Icon()
    a.arc((11, 11, 53, 53), 246, 531, INK, 11)
    a.poly([(15, 20), (25, 34), (8, 36)], INK, width=3)
    a.arc((12, 12, 52, 52), 246, 531, LIGHT, 7)
    a.poly([(15, 20), (25, 34), (8, 36)], LIGHT, None)
    return a.finish()


def defeat():
    a = Icon()
    dome = [(32 + 19 * math.cos(math.radians(angle)), 29 + 17 * math.sin(math.radians(angle)))
            for angle in range(174, 367, 6)]
    a.poly([*dome, (51, 36), (47, 41), (43, 42), (42, 51), (39, 54), (25, 54),
            (22, 51), (21, 42), (17, 41), (13, 36)], LIGHT, width=3)
    a.ellipse((18, 26, 29, 37), INK)
    a.ellipse((35, 26, 46, 37), INK)
    a.poly([(32, 35), (36, 43), (28, 43)], INK, None)
    a.line([(25, 46), (39, 46)], SHADE, 1.8, True)
    for x in (28, 32, 36):
        a.line([(x, 46), (x, 52)], SHADE, 1.5)
    return a.finish()


def direction():
    a = Icon()
    a.poly([(32, 10), (53, 32), (42, 32), (42, 52), (22, 52), (22, 32), (11, 32)],
           LIGHT, width=3)
    return a.finish()


def jumping():
    a = Icon()
    a.poly([(32, 9), (53, 26), (42, 26), (42, 41), (22, 41), (22, 26), (11, 26)],
           LIGHT, width=3)
    a.round_rect((13, 47, 51, 54), 2.5, STEEL, INK)
    return a.finish()


def icons():
    arrow = direction()
    jump = jumping()
    return {
        "start": play(),
        "continue": play(resume=True),
        "pause": pause(),
        "menu": menu(),
        "settings": gear(),
        "back": back(),
        "replay": replay(),
        "victory": medal(),
        "defeat": defeat(),
        "up": arrow,
        "down": arrow.transpose(Image.Transpose.ROTATE_180),
        "left": arrow.transpose(Image.Transpose.ROTATE_90),
        "right": arrow.transpose(Image.Transpose.ROTATE_270),
        "jump": jump,
        "sneak": jump.transpose(Image.Transpose.FLIP_TOP_BOTTOM),
        "shoot": shooting(),
        "bomb": grenade(),
        "rocket": rocket(),
        "take": hand(),
    }


def main():
    cells = icons()
    columns = 6
    rows = (len(cells) + columns - 1) // columns
    atlas = Image.new("RGBA", (columns * SIZE, rows * SIZE))
    entries = {}
    for i, (name, icon) in enumerate(cells.items()):
        x, y = i % columns * SIZE, i // columns * SIZE
        atlas.paste(icon, (x, y))
        entries[name] = {"x": x, "y": y}
    atlas.save(OUT, lossless=True, exact=True)
    manifest = {
        "image": "../../ui/pixel-icons.webp",
        "sha256": hashlib.sha256(OUT.read_bytes()).hexdigest(),
        "cell": {"width": SIZE, "height": SIZE},
        "atlas": {"width": atlas.width, "height": atlas.height},
        "origin": "top-left",
        "source": "Original icons drawn in draw.py for Partisan Games.",
        "references": {
            "ww2EquipmentIcons": "https://enlisted.net/en/news/show/326/current/",
            "distinctCommandIcons": "https://ftp.matrixgames.com/pub/HeadquartersWorldWarII/HQWW2manualEBOOK.pdf",
            "millsGrenadeShape": "https://collection.awm.gov.au/C985657",
        },
        "icons": entries,
    }
    (HERE / "source.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
