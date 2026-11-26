"""Register the Neretva cover cutouts to the 100 × 150 in-game trench frame at 2×."""

from pathlib import Path
from statistics import median_low

from PIL import Image


SOURCE = Path(__file__).resolve().parent
OUTPUT = SOURCE.parents[2] / 'game-ready' / 'polozaji' / 'neretva'
SIZE = (200, 300)
# Source name, desired maximum width and central lip height, in 2× pixels.
COVERS = {
    'rov-prazan': (200, 170),
    'stena': (194, 167),
    'gomila-kamenja': (196, 169),
}


def lip_height(alpha):
    """Measure where the solid silhouette starts across the soldier's central half."""
    width, height = alpha.size
    return median_low([
        next((y for y in range(height) if alpha.getpixel((x, y)) >= 160), height)
        for x in range(width // 4, width * 3 // 4)
    ])


def register(source, width, lip):
    art = source.convert('RGBA')
    # Drop the faint generated matte while keeping useful edge alpha.
    alpha = art.getchannel('A').point(lambda a: 0 if a < 88 else 255 if a > 224 else a)
    art.putalpha(alpha)
    art = art.crop(alpha.getbbox())
    source_lip = lip_height(art.getchannel('A'))
    scale = min(width / art.width, (SIZE[1] - lip) / (art.height - source_lip),
                (lip - 118) / max(1, source_lip))
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.Resampling.NEAREST)
    top = lip - lip_height(art.getchannel('A'))
    canvas = Image.new('RGBA', SIZE)
    canvas.paste(art, ((SIZE[0] - art.width) // 2, top))
    return canvas


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (width, lip) in COVERS.items():
        with Image.open(SOURCE / f'{name}.png') as source:
            sprite = register(source, width, lip)
        path = OUTPUT / f'{name}.webp'
        sprite.save(path, lossless=True, exact=True, method=6)
        with Image.open(path) as webp:
            assert webp.convert('RGBA').tobytes() == sprite.tobytes(), path


if __name__ == '__main__':
    main()
