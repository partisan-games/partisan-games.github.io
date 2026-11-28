"""Paint the soil, fields and roads of the current Ratweek route on one pixel grid."""

import json
import math
import subprocess
from bisect import bisect_right
from functools import lru_cache
from pathlib import Path
from random import Random

from PIL import Image, ImageColor

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
WIDTH, HEIGHT = 512, 4096
GAME_SIZE = (384, 2048)
OUTPUT = HERE.parents[1] / "textures" / "terrain" / "ratweek-dolina.webp"

# The renderer and painter use the same route and the same seeded town streets.
ROUTE = """
import { groundPaint, landmarks, towns, townSide, valleyAt, riverAt, river, railwayAt, sidingGap } from './scenes/ratweek/route.js';
const streets = new Map();
landmarks(streets);
const { from, to } = groundPaint;
const samples = Array.from({length: 4096}, (_, y) => {
  const u = from + (y + .5) / 4096 * (to - from);
  return [u, valleyAt(u).floor, riverAt(u), railwayAt(u)];
});
console.log(JSON.stringify({ groundPaint, river, samples,
  towns: towns.map(town => ({ ...town, ...streets.get(town.name), side: townSide(town), sidingGap })) }));
"""


def colors(values):
    return tuple(ImageColor.getrgb(value) for value in values.split())


FIELDS = colors("#8a9060 #9e905e #778658 #a1996c #868353 #908062 #a29c73 #7c8c64")
SLOPES = colors("#838b64 #78845d #6b7755 #606d4e #566348")
BARE = colors("#b1a17d #b6a783 #a39872")
ROADS = colors("#a59270 #b8a685 #c5b493")
TOWN = colors("#93886b #9a8f76 #a2977e")
MEADOW = colors("#818b63 #899266 #91976b")


def tint(color, amount):
    return tuple(max(0, min(255, value + amount)) for value in color)


@lru_cache(maxsize=240)
def parcels(band):
    rng = Random(1944 + band * 6791)
    edges = [-560]
    crops = []
    while edges[-1] < 560:
        edges.append(edges[-1] + rng.randint(25, 75))
        crops.append((rng.randrange(len(FIELDS)), rng.randrange(4), rng.randrange(9)))
    return edges, crops


def roads_at(u, floor, track, towns):
    roads = []
    for side in (-1, 1):
        road = side * (floor * .63 + math.sin(u * .009 + side) * 9)
        roads.append((road, road, 2.7))
        spur = (u + (23 if side > 0 else 109)) % 207
        if spur < 5.4:
            inner = track + side * 17
            roads.append((min(inner, road), max(inner, road), 0))
    for town in towns:
        if not town["from"] <= u <= town["to"]:
            continue
        side = town["side"]
        inner = track + side * (town["sidingGap"] * (town["sidings"] + 1) + 18)
        roads.append((inner, inner, 3.6))
        for index, street in enumerate(town["streets"]):
            if abs(u - street) < town["width"] / 2:
                outer = inner + side * (town["reach"] * (.74 + (index % 4) * .065))
                roads.append((min(inner, outer), max(inner, outer), 0))
    return roads


def paint():
    data = json.loads(subprocess.check_output(
        ["node", "--disable-warning=ExperimentalWarning", "--import", "./tests/unit/setup/register.js",
         "--input-type=module", "-e", ROUTE], cwd=ROOT, encoding="utf-8"))
    span = data["groundPaint"]["width"]
    columns = [(x + .5) / WIDTH * span - span / 2 for x in range(WIDTH)]
    image = Image.new("RGB", (WIDTH, HEIGHT))
    pixels = image.load()
    river = data["river"]
    for y, (u, floor, water, track) in enumerate(data["samples"]):
        roads = roads_at(u, floor, track, data["towns"])
        settlement = next((town for town in data["towns"] if town["from"] <= u <= town["to"]), None)
        cross_shear = math.sin(u * .019) * 5 + math.sin(u * .0047) * 13 + water * .064
        for column, x in enumerate(columns):
            fleck = (column * 53 + y * 97 + (column // 3 ^ y // 3) * 31) % 41
            bank = abs(x - water)
            out = abs(x) - floor
            cross = x - cross_shear
            up = u + x * .17 + math.sin(x * .03) * 8
            band = math.floor(up / 59)
            edges, fields = parcels(band)
            index = bisect_right(edges, cross) - 1
            crop, rows, phase = fields[index]
            if bank < river["half"] + river["banks"] - 1:
                color = BARE[0 if fleck > 4 else fleck % len(BARE)]
            elif out > 5:
                shade = min(len(SLOPES) - 1, max(0, int((out + math.sin(u * .038 + x * .046) * 15) / 39)))
                color = SLOPES[shade]
                grove = (math.sin(x * .089 + u * .038) + math.sin(u * .051 - x * .021)
                         + math.cos(x * .019 + u * .072))
                if grove > .65:
                    color = tint(color, -9)
                elif grove < -1.55:
                    color = tint(color, 7)
            elif out > -13 or bank < river["half"] + river["banks"] + 7 or abs(x - track) < 8:
                color = MEADOW[phase % len(MEADOW)]
            elif settlement and 12 < (x - track) * settlement["side"] < 117:
                color = TOWN[phase % len(TOWN)]
            else:
                color = FIELDS[crop]
                border = min(cross - edges[index], edges[index + 1] - cross, up % 59, 59 - up % 59)
                row = (up if rows % 2 else cross) + phase + math.sin(x * .028 + u * .022) * 2
                if border < 2:
                    color = tint(color, -14 if border < 1.2 else 7)
                elif rows != 3 and row % (6.5 if rows else 9.5) < 1.75:
                    color = tint(color, 8 if crop in (0, 2, 4, 7) else -8)
            if out < -4 and bank > river["half"] + river["banks"] + 2 and abs(x - track) > 8:
                for left, right, shoulder in roads:
                    if left - shoulder <= x <= right + shoulder:
                        color = ROADS[2 if fleck < 10 else 1] if left + 1 < x < right - 1 or abs(x - left) < 1 else ROADS[0]
                        break
            pixels[column, y] = tint(color, 5 if fleck < 3 else -5 if fleck > 38 else 0)
    image.resize(GAME_SIZE, Image.Resampling.BOX).save(OUTPUT, lossless=True, method=6)


if __name__ == "__main__":
    paint()
