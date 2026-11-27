"""Register the redrawn panels and restyle the cloth around the existing badges."""
from argparse import ArgumentParser
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


SOURCE = Path(__file__).resolve().parent
TARGET = SOURCE.parents[3] / 'models/character/soldier/german-heavy-pixel-art'
PANELS = [
    ('face', 128, .88),
    ('trousers', 256, .78),
    ('eyes', 64, 1),
    ('canvas-bag', 128, .85),
]


def panel(image, index, size):
    w, h = image.width // 2, image.height // 2
    x, y = index % 2 * w, index // 2 * h
    return image.crop((x, y, x + w, y + h)).resize((size, size), Image.Resampling.NEAREST)


def save(image, name):
    image.save(TARGET / f'{name}.webp', lossless=True, method=6)


def cloth(name, palette):
    with Image.open(SOURCE / f'{name}-reference.jpg') as image:
        original = image.convert('RGB')
    pixels = np.array(original, dtype=float)
    value = pixels.mean(axis=2)
    if name == 'tunic':
        # Restrict the repaint to neutral, dark wool. Keep colored patches and
        # brighter seams, metal fittings and the small markings in place.
        protected = (np.ptp(pixels, axis=2) > 16) | (value > 75)
        protected = np.array(Image.fromarray(protected.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0
        cloth_mask = ~protected
    else:
        # This polygon covers the uninterrupted shell, inside its existing rim.
        mask = Image.new('1', original.size)
        ImageDraw.Draw(mask).polygon([(9, 102), (42, 102), (98, 127), (138, 105), (172, 91),
                                      (246, 111), (244, 151), (222, 190), (174, 232),
                                      (131, 248), (81, 219), (42, 173), (11, 128)], fill=1)
        cloth_mask = np.asarray(mask) & (value < 73) & (np.ptp(pixels, axis=2) < 12)
    clusters = np.array(original.resize((96, 96), Image.Resampling.BOX)
                        .resize(original.size, Image.Resampling.NEAREST), dtype=float)
    tone = np.round(clusters.mean(axis=2) / 6) * 6
    # Borrow the slight differences between channels from the painted wool;
    # stay within the hue of the original cloth and retain its folds.
    tint = np.clip(palette - palette.mean(), -2, 2)
    pixels[cloth_mask] = (pixels[cloth_mask] * .22 + (tone[cloth_mask, None] + tint) * .78)
    return Image.fromarray(np.rint(pixels).clip(0, 255).astype(np.uint8))


def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE / 'uv-reference.png') as image:
        reference = image.convert('RGB')
    with Image.open(SOURCE / 'redraw.png') as image:
        redraw = image.convert('RGB')
    for i, (name, size, strength) in enumerate(PANELS):
        original = panel(reference, i, size)
        painted = panel(redraw, i, size)
        result = Image.blend(original, painted, strength)
        if name == 'trousers':
            # Preserve the original thin red strip across its actual UV seam.
            pixels = np.array(original, dtype=np.int16)
            red = (pixels[:, :, 0] - pixels[:, :, 1] > 14) & (pixels[:, :, 0] - pixels[:, :, 2] > 12)
            result.paste(original, mask=Image.fromarray(red))
        save(result, name)
    painted_wool = np.array(panel(redraw, 1, 256)).astype(float)[22:86, 50:105].mean(axis=(0, 1))
    for name in ('tunic', 'helmet'):
        save(cloth(name, painted_wool), name)


def prepare_portrait():
    with Image.open(SOURCE / 'portrait-new-identity.png') as image:
        portrait = np.array(image.convert('RGB'))
    with Image.open(TARGET / 'face.webp') as image:
        previous = np.array(image.convert('RGB'))
    size = previous.shape[0]
    # Align the new lids and mouth to the fixed model before sampling the pixel art.
    coords = (np.arange(size) + .5) / size
    warped_y = np.interp(coords, [0, .322, .428, .494, .8, 1], [0, .310, .432, .505, .8, 1])
    row = (warped_y * portrait.shape[0]).astype(int)
    col = (coords * portrait.shape[1]).astype(int)
    face = portrait[row[:, None], col[None, :]]
    # The lower islands contain secondary eye and clothing detail.
    face[round(size * .8):] = previous[round(size * .8):]
    save(Image.fromarray(face), 'face-new-identity')

    with Image.open(TARGET / 'eyes.webp') as image:
        eye = np.array(image.convert('RGB'), dtype=np.int16)
    y, x = np.mgrid[:eye.shape[0], :eye.shape[1]]
    iris = ((x - 32) ** 2 + (y - 32) ** 2 <= 14 ** 2) & (eye[:, :, 0] - eye[:, :, 2] > 14)
    shade = eye[iris].mean(axis=1)
    eye[iris] = np.stack((shade * .76, shade * 1.03, shade * 1.2 + 6), axis=1)
    save(Image.fromarray(eye.astype(np.uint8)), 'eyes-new-identity')


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('--new-portrait', action='store_true')
    args = parser.parse_args()
    if args.new_portrait:
        prepare_portrait()
    else:
        main()
