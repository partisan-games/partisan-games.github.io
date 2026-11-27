"""Register the painted sheets to the existing partisan.fbx UVs and export lossless maps."""

from argparse import ArgumentParser
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt
from scipy.spatial import Delaunay


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/images/sources/partizani/sutjeska-pixel-art'
TARGET = ROOT / 'assets/models/character/soldier/sutjeska-pixel-art'

# Coordinates are fractions from the top left: existing UV landmark, then the painted landmark.
UNIFORM = [
    (.156, .032, .144, .029), (.144, .16, .153, .162),  # cap and collar above front jacket
    (.045, .211, .040, .221), (.290, .211, .324, .213),
    (.17, .325, .180, .343), (.040, .438, .035, .462), (.292, .437, .333, .462),
    (.158, .452, .179, .479), (.033, .552, .030, .557), (.304, .556, .340, .557),
    (.286, .030, .301, .037), (.263, .133, .302, .151), (.437, .039, .488, .042),
    (.419, .144, .461, .151), (.319, .151, .359, .151), (.511, .156, .560, .161),
    (.630, .057, .700, .049), (.622, .167, .678, .159), (.742, .046, .815, .043),
    (.454, .220, .500, .231), (.457, .242, .499, .251), (.459, .264, .501, .277),  # star
    (.342, .208, .374, .219), (.564, .210, .606, .221), (.367, .440, .392, .479),
    (.566, .455, .616, .479), (.337, .542, .364, .553), (.590, .539, .629, .551),
    (.653, .291, .717, .314), (.717, .218, .780, .233), (.780, .332, .833, .365),
    (.890, .247, .930, .269), (.936, .370, .962, .401), (.648, .454, .706, .463),
    (.735, .417, .784, .432), (.864, .561, .884, .576), (.756, .678, .806, .684),
    (.936, .629, .945, .667), (.920, .746, .918, .748), (.932, .831, .924, .838),
    (.931, .938, .926, .931), (.057, .580, .071, .597), (.297, .605, .332, .625),
    (.028, .973, .054, .966), (.281, .979, .326, .979),
    (.343, .589, .391, .601), (.637, .564, .697, .578), (.376, .973, .406, .970),
    (.632, .982, .697, .982), (.701, .720, .736, .732), (.860, .723, .876, .742),
    (.711, .980, .753, .979), (.839, .973, .862, .970),
]

FACE = [
    (.256, .020, .273, .026), (.505, .115, .503, .118), (.758, .018, .774, .028),
    (.112, .225, .096, .222), (.906, .223, .899, .235),
    (.288, .253, .282, .257), (.725, .247, .723, .246),
    (.390, .162, .393, .166), (.608, .155, .603, .158),
    (.446, .221, .443, .212), (.535, .218, .554, .213),
    (.441, .245, .439, .240), (.540, .242, .550, .239),
    (.497, .306, .497, .305), (.507, .351, .503, .353), (.508, .405, .501, .408),
    (.510, .460, .501, .451), (.064, .491, .069, .492), (.924, .496, .927, .496),
    (.130, .679, .145, .677), (.359, .670, .356, .670), (.143, .851, .145, .864),
    (.355, .854, .359, .870), (.630, .693, .618, .695), (.805, .605, .794, .600),
    (.590, .853, .603, .856), (.719, .818, .711, .817),
    (.870, .871, .879, .872),
]

PORTRAIT = [
    (.256, .020, .270, .013), (.505, .115, .505, .098), (.758, .018, .755, .012),
    (.112, .225, .088, .229), (.906, .223, .912, .232),
    (.288, .253, .288, .260), (.725, .247, .716, .260),
    (.390, .162, .393, .145), (.608, .155, .605, .145),
    (.446, .221, .438, .218), (.535, .218, .552, .218),
    (.441, .245, .437, .239), (.540, .242, .552, .239),
    (.497, .306, .497, .305), (.507, .351, .500, .352), (.508, .405, .502, .410),
    (.510, .460, .500, .448), (.064, .491, .065, .482), (.924, .496, .932, .480),
]

# Uniform UV outlines in the original FBX, in thousandths from the top left.
JACKET = [
    [(0, 534), (31, 463), (18, 363), (5, 348), (42, 352), (69, 330), (74, 273),
     (14, 211), (65, 181), (93, 76), (138, 18), (195, 28), (224, 57), (242, 153),
     (234, 180), (294, 209), (260, 275), (262, 314), (308, 330), (306, 427),
     (301, 472), (325, 553), (260, 572), (145, 575), (44, 564)],
    [(319, 227), (349, 191), (388, 215), (407, 249), (452, 284), (486, 272), (522, 232),
     (548, 194), (583, 193), (605, 215), (589, 257), (568, 312), (601, 334),
     (580, 433), (581, 474), (600, 546), (537, 553), (358, 553), (320, 548),
     (335, 478), (330, 373), (310, 334), (358, 332), (365, 287)],
    [(646, 429), (717, 409), (803, 400), (850, 408), (881, 442), (883, 563),
     (879, 662), (834, 700), (723, 705), (681, 676)],
    [(643, 735), (722, 707), (858, 703), (880, 743), (860, 874), (833, 982),
     (812, 1000), (731, 1000), (676, 967), (646, 872)],
]

def mask_of(size, pieces):
    mask = Image.new('1', (size, size))
    draw = ImageDraw.Draw(mask)
    for outline in pieces:
        draw.polygon([(round(x * size / 1000), round(y * size / 1000)) for x, y in outline], fill=1)
    return np.array(mask)


def registered(panel, points, size):
    corners = [(0, 0), (.5, 0), (1, 0), (1, .5), (1, 1), (.5, 1), (0, 1), (0, .5)]
    anchors = np.array([(*point, *point) for point in corners] + points)
    triangles = Delaunay(anchors[:, :2])
    y, x = np.mgrid[:size, :size]
    positions = (np.column_stack((x.ravel(), y.ravel())) + .5) / size
    cells = triangles.find_simplex(positions)
    basis = triangles.transform[cells]
    uv = np.einsum('ijk,ik->ij', basis[:, :2], positions - basis[:, 2])
    weights = np.column_stack((uv, 1 - uv.sum(axis=1)))
    pixels = np.einsum('ij,ijk->ik', weights, anchors[triangles.simplices[cells], 2:])
    width, height = panel.size
    sx, sy = np.clip(pixels * [width, height], [0, 0], [width - 1, height - 1]).astype(int).T
    return Image.fromarray(np.asarray(panel)[sy, sx].reshape(size, size, 3))


def save(image, name):
    image.save(TARGET / f'{name}.webp', lossless=True, method=6)


def dress_uniform(uniform):
    pixels = np.array(uniform)
    size = uniform.width
    y, x = np.mgrid[:size, :size]
    tone = pixels[:, :, 0].copy()
    jacket = mask_of(size, JACKET)
    # Keep the collar opening, belt, buckle and the pale metal at the centre of the button row.
    trim = mask_of(size, [[(93, 181), (110, 153), (193, 151), (214, 181), (198, 221), (174, 268), (148, 279), (110, 239)],
                          [(18, 438), (309, 443), (310, 471), (27, 477)],
                          [(334, 429), (589, 430), (589, 463), (334, 470)]])
    buttons = (abs(x / size - .17) < .013) & (y / size > .30) & (y / size < .443) & (tone >= 193)
    cloth = jacket & ~trim & ~buttons
    with Image.open(SOURCE / 'camouflage.png') as image:
        swatch = np.array(image.convert('RGB').resize((106, 106), Image.Resampling.NEAREST))
    pattern = np.pad(swatch, ((0, size - 106), (0, size - 106), (0, 0)), mode='reflect')
    fold = np.interp(tone, [34, 80, 115, 174, 202], [.66, .85, .94, 1.10, 1.16])
    # The left sleeve was darker in the first draft. Match its base exposure to the right sleeve.
    lower_sleeve = mask_of(size, JACKET[-1:])
    fold[lower_sleeve] = np.interp(tone[lower_sleeve], [27, 51, 80, 112], [.66, .92, 1.10, 1.16])
    shaded = np.clip((pattern * 1.03 + 7) * fold[:, :, None], 0, 255)
    pixels[cloth] = shaded[cloth].round().astype(np.uint8)
    # Cover both trouser islands and their UV padding. Only the 3D lighting supplies their shading.
    trousers = (x / size <= .674) & (y / size >= .525) & ~jacket
    pixels[trousers] = (87, 65, 48)
    # Clear the original badge before applying the stencil across the cap's UV seams.
    badge = pixels[42:51, 82:94]
    fabric = np.broadcast_to(pixels[42:51, 80:81], badge.shape)
    old_badge = badge[:, :, 0] >= 106
    badge[old_badge] = fabric[old_badge]
    with Image.open(SOURCE / 'cap-badge.png') as image:
        stencil = np.asarray(image)
        pixels = np.array(Image.fromarray(pixels).resize(image.size, Image.Resampling.NEAREST))
    pixels[stencil == 192] = (179, 29, 24)
    pixels[stencil == 255] = (201, 35, 30)
    return Image.fromarray(pixels)


def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE / 'atlas.png') as image:
        atlas = image.convert('RGB')
    half = atlas.width // 2
    uniform = atlas.crop((0, 0, half, atlas.height))
    face = atlas.crop((half, 0, atlas.width, atlas.height))
    save(dress_uniform(registered(uniform, UNIFORM, 192)), 'uniform')
    skin = registered(face, FACE, 192)
    with Image.open(SOURCE / 'portrait.png') as image:
        portrait = image.convert('RGB')
    portrait_mask = mask_of(skin.width, [[(0, 0), (1000, 0), (1000, 600), (870, 600), (870, 514),
                                          (770, 495), (635, 524), (463, 551), (348, 514), (173, 500),
                                          (108, 509), (108, 598), (0, 598)]])
    skin.paste(registered(portrait, PORTRAIT, skin.width), mask=Image.fromarray(portrait_mask))
    save(skin, 'face')
    eye = portrait.crop((round(portrait.width * .744), round(portrait.height * .739), portrait.width, portrait.height))
    save(eye.resize((64, 64), Image.Resampling.NEAREST), 'eyes')


def prepare_koca_portrait():
    # Start from the accepted map so the hands, jaw seam and ears keep their original colors.
    with Image.open(TARGET / 'face.webp') as image:
        skin = image.convert('RGB')
    with Image.open(SOURCE / 'koca-portrait-trial.png') as image:
        portrait = image.convert('RGB')
    # The generated portrait paints ears beside the face that already has ear UVs.
    # Below the hairline, take only the central face and leave both temples intact.
    head = mask_of(skin.width, [[(0, 0), (1000, 0), (1000, 205), (638, 205),
                                 (619, 230), (617, 333), (631, 374), (604, 450), (507, 467),
                                 (413, 453), (373, 374), (385, 333), (383, 230), (362, 205),
                                 (0, 205)]])
    # Feather inward from the mask so the skin tone flows into both cheeks and the jaw.
    weight = np.clip(distance_transform_edt(head) / 9, 0, 1)
    mask = Image.fromarray(np.rint(weight * 255).astype(np.uint8))
    skin.paste(registered(portrait, PORTRAIT, skin.width), mask=mask)

    # The eye mesh supplies the iris and white. Paint the surrounding lid without
    # the second iris embedded in the frontal art, preserving the brow above it.
    pixels = np.array(skin)
    y, x = np.mgrid[:skin.height, :skin.width]
    eyelid = np.array([(102, 57, 39), (113, 64, 45), (142, 81, 57), (167, 95, 66)])
    for center in (87, 107):
        blend = np.clip(2.4 - (x - center) ** 2 / 18 - (y - 45.6) ** 2 / 1.65, 0, 1)
        shade = eyelid[(y - 44).clip(0, len(eyelid) - 1)]
        pixels = np.rint(pixels * (1 - blend[..., None]) + shade * blend[..., None]).astype(np.uint8)
    save(Image.fromarray(pixels), 'face-koca-1943')

    # A common center for both mapped apertures, measured on the model in front view.
    with Image.open(TARGET / 'eyes.webp') as image:
        eye = np.asarray(image.convert('RGB'))
    y, x = np.mgrid[:eye.shape[0], :eye.shape[1]]
    centered = eye[(y + 2).clip(0, eye.shape[0] - 1), (x - 4).clip(0, eye.shape[1] - 1)]
    save(Image.fromarray(centered), 'eyes-koca-1943')


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--koca-portrait', action='store_true')
    args = parser.parse_args()
    if args.koca_portrait:
        prepare_koca_portrait()
    else:
        main()
