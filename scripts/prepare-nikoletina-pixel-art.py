"""Register the new Nikoletina artwork to the original single-material UV atlas."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import LinearNDInterpolator
from scipy.ndimage import binary_fill_holes, distance_transform_edt, label


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/images/sources/partizani/nikoletina-pixel-art/atlas.png'
OUTPUT = ROOT / 'assets/models/character/soldier/nikoletina-pixel-art.webp'
SIZE = 512

# Each correspondence holds the model UV and the same landmark on the redraw, from the top left.
LANDMARKS = [
    (.045, .106, .047, .101), (.21, .072, .224, .068), (.287, .193, .291, .198),
    (.140, .211, .137, .207), (.488, .086, .495, .087), (.636, .174, .651, .180),
    (.581, .282, .587, .293), (.718, .098, .733, .100), (.913, .144, .925, .146),
    (.852, .299, .858, .302), (.722, .047, .730, .040), (.742, .072, .744, .064),
    (.938, .302, .939, .305), (.747, .489, .746, .491),
    (.201, .201, .191, .202), (.092, .319, .089, .322), (.267, .301, .265, .306),
    (.271, .473, .263, .478), (.030, .488, .026, .486), (.175, .540, .171, .526),
    (.032, .647, .038, .649), (.149, .754, .148, .753),
    (.328, .300, .329, .305), (.355, .332, .361, .348), (.390, .365, .392, .368),
    (.457, .310, .451, .319), (.477, .334, .466, .346), (.496, .350, .506, .358),
    (.531, .384, .524, .390), (.442, .403, .457, .410), (.467, .438, .486, .450),
    (.528, .498, .528, .502), (.488, .491, .485, .490),
    (.216, .503, .218, .505), (.405, .509, .410, .511), (.211, .737, .213, .734),
    (.404, .748, .402, .747), (.433, .550, .439, .552), (.624, .527, .626, .532),
    (.655, .608, .651, .613), (.579, .776, .578, .771), (.423, .731, .422, .729),
    (.692, .620, .690, .623), (.898, .627, .900, .632), (.880, .747, .879, .752),
    (.673, .749, .672, .751), (.601, .779, .604, .787), (.780, .761, .793, .763),
    (.819, .970, .828, .973), (.601, .990, .601, .985),
    (.058, .817, .066, .824), (.190, .831, .191, .837), (.233, .869, .243, .874),
    (.058, .871, .056, .872), (.192, .915, .195, .920), (.062, .931, .068, .932),
    (.386, .885, .389, .889), (.359, .899, .363, .906), (.486, .920, .489, .922),
    (.418, .982, .423, .980),
]

TROUSER_ISLANDS = [
    [(426, 556), (495, 529), (562, 537), (628, 521), (653, 543), (662, 621),
     (653, 709), (642, 758), (593, 767), (575, 792), (534, 775), (465, 753), (416, 740)],
    [(597, 786), (666, 767), (742, 777), (803, 752), (796, 829), (824, 899),
     (836, 951), (795, 995), (594, 998), (565, 981), (581, 897)],
]


def main():
    with Image.open(SOURCE) as image:
        drawn = np.asarray(image.convert('RGB'))
    boundary = [(0, 0), (.5, 0), (1, 0), (1, .5), (1, 1), (.5, 1), (0, 1), (0, .5)]
    anchors = np.array([(*point, *point) for point in boundary] + LANDMARKS)
    warp = LinearNDInterpolator(anchors[:, :2], anchors[:, 2:])
    y, x = np.mgrid[:SIZE, :SIZE]
    sx, sy = warp((x + .5) / SIZE, (y + .5) / SIZE).transpose(2, 0, 1)
    height, width = drawn.shape[:2]
    pixels = drawn[np.clip(sy * height, 0, height - 1).astype(int), np.clip(sx * width, 0, width - 1).astype(int)]

    # These two cloth islands sit on the legs. Keep the drafted folds and use contrasting earth tones.
    mask = Image.new('1', (SIZE, SIZE))
    draw = ImageDraw.Draw(mask)
    for island in TROUSER_ISLANDS:
        draw.polygon([(round(u * SIZE / 1000), round(v * SIZE / 1000)) for u, v in island], fill=1)
    trousers = np.asarray(mask)
    blue = trousers & (pixels[:, :, 2].astype(int) - pixels[:, :, 0] > 5)
    tones = pixels[blue, 0].copy()
    for channel, ramp in enumerate([(51, 73, 106), (39, 56, 83), (30, 44, 60)]):
        pixels[blue, channel] = np.interp(tones, [25, 53, 83], ramp).round().astype(np.uint8)

    # Extend the painted island edges over the gray atlas padding, where the redrawn borders shifted.
    gray = (np.ptp(pixels, axis=2) <= 4) & (pixels[:, :, 0] >= 69) & (pixels[:, :, 0] <= 96)
    distance, nearest = distance_transform_edt(gray, return_indices=True)
    bleed = gray & (distance <= 5)
    pixels[bleed] = pixels[nearest[0][bleed], nearest[1][bleed]]

    # Replace the loose badge draft and restore readable lips at their positions on the mesh.
    badge = pixels[round(.865 * SIZE):round(.916 * SIZE), round(.363 * SIZE):round(.413 * SIZE)]
    red, green, blue = badge.transpose(2, 0, 1)
    old_badge = (red > green * 1.4) & (red > blue * 1.3)
    nearest = distance_transform_edt(old_badge, return_distances=False, return_indices=True)
    badge[old_badge] = badge[nearest[0][old_badge], nearest[1][old_badge]]
    uniform = Image.fromarray(pixels).quantize(160, dither=Image.Dither.NONE).convert('RGB')
    with Image.open(SOURCE.with_name('uv-details.png')) as image:
        details = np.asarray(image)
        pixels = np.array(uniform.resize(image.size, Image.Resampling.NEAREST))
    for detail, color in enumerate([(205, 137, 100), (171, 104, 75), (100, 55, 38), (186, 38, 31)], start=1):
        pixels[details == detail] = color
    with Image.open(SOURCE.with_name('sideburns.png')) as image:
        sideburns = np.asarray(image)
    pixels[sideburns == 1] = (78, 44, 30)
    pixels[sideburns == 2] = (99, 56, 37)

    # Repaint the original cap island. Keep its badge and the adjacent atlas islands.
    cap_region = np.s_[860:1019, 360:511]
    cap = pixels[cap_region]
    blue_wool = cap[:, :, 2].astype(int) - cap[:, :, 0] >= 4
    islands, _ = label(blue_wool)
    island_sizes = np.bincount(islands.ravel())[1:]
    wool = binary_fill_holes(islands == island_sizes.argmax() + 1) & (details[cap_region] != 4)
    with Image.open(SOURCE.with_name('cap-redraw.png')) as image:
        redrawn = np.asarray(image.convert('RGB').resize((cap.shape[1], cap.shape[0]), Image.Resampling.NEAREST))
    red, green, blue = redrawn.astype(int).transpose(2, 0, 1)
    olive = (green >= red - 5) & (green - blue >= 12)
    nearest = distance_transform_edt(~olive, return_distances=False, return_indices=True)
    # Extend wool across minor registration differences and retain the existing red stencil.
    light = green[nearest[0][wool], nearest[1][wool]]
    light = np.clip(4 * np.round((light + 6) / 4), 42, 92)
    cap[wool] = np.stack((light - 3, light, light - 23), axis=1)
    Image.fromarray(pixels).save(OUTPUT, lossless=True, method=6)


if __name__ == '__main__':
    main()
