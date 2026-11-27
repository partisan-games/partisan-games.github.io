"""Bake the new portrait into the original single-material Soviet Partisan atlas."""
from argparse import ArgumentParser
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt


SOURCE = Path(__file__).resolve().parent
TARGET = SOURCE.parents[3] / 'models/character/soldier/cetnik-subara-pixel-art.webp'
FACE = (620, 570, 1180, 1110)
NAPE = (1400, 34, 1590, 169)
HEAD_OUTLINE = [
    (34, 34), (142, 43), (218, 54), (274, 69), (292, 45), (314, 65),
    (365, 54), (374, 89), (392, 95), (393, 135), (420, 151), (454, 158),
    (497, 177), (537, 214), (522, 245), (492, 264), (497, 303), (514, 357),
    (529, 403), (533, 519), (482, 515), (430, 505), (401, 518), (364, 517),
    (333, 510), (316, 489), (291, 514), (265, 486), (240, 464), (194, 435),
    (151, 420), (139, 386), (112, 329), (83, 301), (44, 276), (58, 248),
    (40, 237), (47, 205), (42, 175), (50, 135), (47, 105),
]


def paint_island(atlas, original, reference, box, painted_box, outline=None):
    x0, y0, x1, y1 = (round(n / 2) for n in box)
    size = (x1 - x0, y1 - y0)
    source = np.array(original.crop(box).resize(size, Image.Resampling.BOX), dtype=float)
    painted = reference.crop(painted_box)
    painted = painted.resize(tuple(n // 2 for n in size), Image.Resampling.NEAREST)
    painted = np.array(painted.resize(size, Image.Resampling.NEAREST), dtype=float)
    r, g, b = source.transpose(2, 0, 1)
    pr, pg, pb = painted.transpose(2, 0, 1)
    # Skin and hair share the island. Keep the dark eye holes, olive collar and gray padding.
    mask = (r > g + 4) & (r > b + 8) & (r > 17) & (pr > pg + 3) & (pr > pb + 5)
    if outline:
        stencil = Image.new('1', size)
        ImageDraw.Draw(stencil).polygon([(round(x / 2), round(y / 2)) for x, y in outline], fill=1)
        mask &= np.asarray(stencil)
        # A fold in the atlas crosses the cheek below the eye. Follow the source UV there
        # so the portrait's sideburn does not appear as a stripe on the cheek.
        cheek = Image.new('1', size)
        cheek_uv = [(435, 204), (451, 225), (429, 254), (382, 269), (361, 250), (374, 222), (408, 200)]
        ImageDraw.Draw(cheek).polygon([(round(x / 2), round(y / 2)) for x, y in cheek_uv], fill=1)
        blend = np.clip(distance_transform_edt(np.asarray(cheek)) / 5, 0, 1)[..., None]
        skin = (source * [.98, .82, .73] + [31, 14, 9]) // 7 * 7
        painted = painted * (1 - blend) + skin * blend
    elif box == NAPE:
        mask[int(size[1] * .74):] = False

    feather = np.clip(distance_transform_edt(mask) / 3, 0, 1)
    # Keep the skin from the stylized portrait close to the existing neck and hands.
    painted = (painted * .85 + source * .15).round().clip(0, 255).astype(np.uint8)
    alpha = Image.fromarray(np.rint(feather * 255).astype(np.uint8))
    atlas.paste(Image.fromarray(painted), (x0, y0), alpha)


def main(path):
    with Image.open(path) as image:
        original = image.convert('RGB')
    assert original.size == (2048, 2048)
    with Image.open(SOURCE / 'redraw.png') as image:
        portrait = image.convert('RGB').resize((560, 675), Image.Resampling.NEAREST)
    cloth = original.resize((512, 512), Image.Resampling.BOX).quantize(192, dither=Image.Dither.NONE).convert('RGB')
    atlas = cloth.resize((1024, 1024), Image.Resampling.NEAREST)
    paint_island(atlas, original, portrait, FACE, (0, 0, 560, 540), HEAD_OUTLINE)
    paint_island(atlas, original, portrait, NAPE, (0, 540, 190, 675))
    atlas.save(TARGET, lossless=True, method=6)


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('embedded_texture', type=Path)
    main(parser.parse_args().embedded_texture)
