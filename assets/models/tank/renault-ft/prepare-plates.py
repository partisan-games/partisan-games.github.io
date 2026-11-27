"""Pack the painted armor projections onto a 512px albedo atlas for the existing model."""
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path(__file__).resolve().parent
TEXTURES = ROOT.parents[2] / 'images/textures/vehicles'
TILE = 256
PAD = 4


def quadrant(image, column, row):
    width, height = image.width // 2, image.height // 2
    return image.crop((column * width, row * height, (column + 1) * width, (row + 1) * height))


def main():
    with Image.open(ROOT / 'plates-source.png') as image:
        painting = image.convert('RGBA')
    with Image.open(ROOT / 'plates-guide.png') as image:
        guide = image.convert('RGBA').getchannel('A')
    with Image.open(TEXTURES / 'renault-ft.webp') as image:
        base = image.convert('RGB').resize((512, 512), Image.Resampling.BOX)
    base.save(TEXTURES / 'renault-ft-base.webp', lossless=True, method=6)

    atlas = Image.new('RGBA', (2 * TILE, 2 * TILE))
    interior = (TILE - 2 * PAD,) * 2
    for row in range(2):
        for column in range(2):
            tile = quadrant(painting, column, row)
            alpha = tile.getchannel('A').point(lambda value: 0 if value < 160 else 255)
            tile.putalpha(alpha)
            tile = tile.crop(alpha.getbbox()).resize(interior, Image.Resampling.BOX)

            # Keep the original silhouette and let the underlying coat blend at plate edges.
            mask = quadrant(guide, column, row)
            mask = mask.crop(mask.getbbox()).filter(ImageFilter.MinFilter(5)).resize(interior, Image.Resampling.BOX)
            finish = tile.convert('RGB').quantize(112, dither=Image.Dither.NONE).convert('RGBA')
            finish.putalpha(ImageChops.multiply(tile.getchannel('A'), mask))
            atlas.paste(finish, (column * TILE + PAD, row * TILE + PAD))
    atlas.save(TEXTURES / 'renault-ft-plates.webp', lossless=True, method=6)


if __name__ == '__main__':
    main()
