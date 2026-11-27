"""Register the painted impacts on the live 2D tanks and pack 3D damage masks."""
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
IMAGES = SOURCE.parents[2] / 'game-ready/tenkovi'
MODELS = SOURCE.parents[3] / 'models/tank/condition'
DECALS = ((65, 155, 460, 416), (570, 110, 946, 459), (1100, 128, 1495, 407),
          (12, 529, 494, 983), (516, 587, 1085, 938), (1106, 590, 1515, 930))
HULLS = {
    'partisan-tank': ((300, 129), ((0, 72, 50, 36, 25), (2, 190, 50, 47, 22))),
    'tiger-i': ((327, 137), ((1, 59, 53, 37, 25), (0, 235, 54, 34, 22))),
    'somua-s35': ((379, 166), ((2, 144, 65, 50, 25), (0, 252, 68, 45, 29))),
    'm15-42': ((202, 102), ((0, 48, 39, 30, 19), (2, 125, 36, 39, 19))),
    'stug-iii': ((216, 89), ((1, 57, 13, 29, 23), (2, 158, 17, 37, 21))),
    'hotchkiss': ((169, 88), ((0, 48, 32, 30, 19), (2, 105, 34, 37, 17))),
}
MASKS = {
    'armor-hits': ((0, 63, 46, 66, 41), (1, 160, 61, 54, 43), (2, 127, 34, 71, 36)),
    'armor-wreck': ((5, 19, 69, 112, 69), (4, 114, 87, 128, 48), (3, 75, 42, 108, 72),
                    (5, 163, 16, 84, 65), (2, 12, 30, 74, 39)),
}


def draw(path, size, impacts, decals):
    result = Image.new('RGBA', size)
    for index, x, y, width, height in impacts:
        result.alpha_composite(decals[index].resize((width, height), Image.Resampling.NEAREST), (x, y))
    result.save(path, lossless=True, method=6)


if __name__ == '__main__':
    with Image.open(SOURCE / 'damage-decals.png') as source:
        decals = [source.crop(box).convert('RGBA') for box in DECALS]
    for decal in decals:
        # Remove the faint background in the generated swatch while keeping the drawn soot along its edge.
        decal.putalpha(decal.getchannel('A').point(lambda a: 0 if a < 72 else min(255, round((a - 72) * 1.65))))
    for name, (size, impacts) in HULLS.items():
        draw(IMAGES / f'{name}-armor-hits.webp', size, impacts, decals)
    for name, impacts in MASKS.items():
        draw(MODELS / f'{name}.webp', (256, 160), impacts, decals)
