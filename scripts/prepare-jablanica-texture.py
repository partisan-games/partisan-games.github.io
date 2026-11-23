"""Make Jablanica's lossless WebP uniform from the accepted PNG; preserve every decoded pixel."""
from pathlib import Path

from PIL import Image

folder = Path(__file__).resolve().parent.parent / 'assets/models/character/soldier'
source = folder / 'partisan-wool-uniform.png'
destination = source.with_suffix('.webp')

with Image.open(source) as image:
    image.save(destination, format='WEBP', lossless=True, exact=True, method=6)
    with Image.open(destination) as prepared:
        if image.convert('RGBA').tobytes() != prepared.convert('RGBA').tobytes():
            raise ValueError('The prepared uniform changed decoded pixels')

original = source.stat().st_size
size = destination.stat().st_size
print(f'{original:,} -> {size:,} bytes ({(1 - size / original) * 100:.1f}% smaller); pixels unchanged')
