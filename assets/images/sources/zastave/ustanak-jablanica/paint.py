"""Original flag art drawn on the 208 × 130 pixel grid."""

from pathlib import Path
from random import Random

from PIL import Image, ImageColor, ImageDraw

HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parents[2] / "game-ready" / "zastave"
WIDTH, HEIGHT = 208, 130
OUTPUT.mkdir(parents=True, exist_ok=True)

# Tone levels are shared by all panels, so folds cross the seams continuously.
tones = Image.new("L", (WIDTH, HEIGHT), 2)
folds = ImageDraw.Draw(tones)
folds.polygon([(47, 0), (61, 0), (55, 27), (71, 83), (67, 130), (49, 130),
               (53, 83), (40, 29)], fill=1)
folds.polygon([(68, 0), (80, 0), (71, 33), (85, 77), (87, 130), (76, 130),
               (77, 84), (61, 36)], fill=3)
folds.polygon([(124, 0), (139, 0), (148, 36), (139, 79), (149, 130), (124, 130),
               (115, 88), (126, 37)], fill=1)
folds.polygon([(134, 6), (141, 18), (148, 36), (139, 77), (143, 106), (135, 96),
               (130, 76), (139, 38)], fill=0)
folds.polygon([(171, 0), (184, 0), (193, 40), (180, 97), (187, 130), (176, 130),
               (169, 99), (182, 43)], fill=3)
folds.line([(7, 4), (7, 124)], fill=1)
folds.line([(4, 3), (4, 126)], fill=3)
folds.rectangle((0, 0, WIDTH - 1, HEIGHT - 1), outline=1)


def cloth(panels, paint_badge):
    image = Image.new("RGB", (WIDTH, HEIGHT))
    colors = [tuple(ImageColor.getrgb(tone) for tone in panel) for panel in panels]
    for y in range(HEIGHT):
        for x in range(WIDTH):
            image.putpixel((x, y), colors[x * len(colors) // WIDTH][tones.getpixel((x, y))])

    pen = ImageDraw.Draw(image)
    rng = Random(1941)
    for _ in range(140):
        x, y = rng.randrange(10, WIDTH - 4), rng.randrange(4, HEIGHT - 4)
        r, g, b = image.getpixel((x, y))
        shift = rng.choice([-7, -4, 5, 8])
        pen.line((x, y, x + 1, y), fill=tuple(min(255, max(0, value + shift)) for value in (r, g, b)))
    for x in range(8, WIDTH - 3, 5):
        for y in (3, HEIGHT - 4):
            pen.point((x, y), fill=image.getpixel((x, 1 if y == 3 else HEIGHT - 2)))
    paint_badge(pen)
    return image


def partisan_badge(pen):
    gold, light, shade = "#d9ac53", "#e7c778", "#a97433"
    pen.polygon([(26, 10), (28, 16), (35, 16), (30, 20), (32, 27),
                 (26, 23), (20, 27), (22, 20), (17, 16), (24, 16)], fill=gold)
    pen.line([(18, 16), (24, 16), (26, 11)], fill=light)
    pen.polygon([(36, 28), (44, 31), (50, 37), (51, 44), (48, 50), (42, 54),
                 (35, 55), (30, 53), (25, 59), (22, 59), (21, 56), (28, 49),
                 (31, 48), (35, 51), (41, 50), (46, 46), (47, 41),
                 (45, 36), (41, 32)], fill=gold)
    pen.line([(49, 39), (49, 45), (46, 50), (41, 53)], fill=shade)
    pen.polygon([(23, 36), (30, 30), (36, 36), (33, 39), (31, 37), (49, 53),
                 (47, 56), (29, 40), (27, 42)], fill=gold)
    pen.line([(24, 36), (30, 31), (35, 36)], fill=light)


def savoy_badge(pen):
    pen.polygon([(88, 46), (119, 46), (119, 66), (116, 76), (111, 84), (104, 90),
                 (96, 84), (91, 76), (88, 67)], fill="#263c5a")
    pen.polygon([(91, 49), (116, 49), (116, 65), (113, 75), (109, 81), (104, 86),
                 (98, 81), (94, 75), (91, 66)], fill="#9b302e")
    pen.polygon([(101, 49), (106, 49), (106, 62), (116, 62), (115, 67), (106, 67),
                 (106, 84), (104, 86), (101, 84), (101, 67), (92, 67), (91, 62),
                 (101, 62)], fill="#f3e8d0")
    pen.polygon([(88, 35), (92, 34), (96, 38), (98, 35), (102, 33), (106, 33),
                 (110, 35), (112, 38), (116, 34), (120, 35), (117, 42),
                 (116, 45), (92, 45), (91, 42)], fill="#684927")
    pen.polygon([(90, 36), (93, 37), (96, 41), (99, 37), (103, 35), (105, 35),
                 (109, 37), (112, 41), (115, 37), (118, 36), (115, 43),
                 (93, 43)], fill="#c49b4e")
    pen.line([(94, 42), (114, 42)], fill="#e8cd7b")
    pen.line([(104, 28), (104, 35)], fill="#9d7337", width=2)
    pen.line([(101, 30), (107, 30)], fill="#b68a42", width=2)


partisan_red = ["#772531", "#8b2934", "#9e303b", "#ad3b43"]
italian_green = ["#2f4838", "#385543", "#42664f", "#50765b"]
italian_white = ["#a39b8a", "#beb5a1", "#dbd1b9", "#e4dbc5"]
italian_red = ["#743435", "#883c3c", "#a24846", "#b4534d"]
for name, panels, emblem in (
    ("partizanska-zastava", [partisan_red], partisan_badge),
    ("zastava-kraljevine-italije", [italian_green, italian_white, italian_red], savoy_badge),
):
    cloth(panels, emblem).save(OUTPUT / f"{name}.webp", lossless=True, method=6)
