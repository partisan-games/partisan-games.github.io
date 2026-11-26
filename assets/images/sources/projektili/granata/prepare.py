"""Draw the 32×8 projectile from its authored pixel rows and export lossless WebP."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageColor


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]
ROWS = (
    'ooBBoooooooooooooooooooooo......',
    'ohBYhhhhhhhhhhhhhhhhhdhhhddoo...',
    'olBYllllllllllllllllldhhhhhddoo.',
    'olbbllllllllllllllllldllllddddBo',
    'ombbmmmmmmmmmmmmmmmmmdmmmmddddbo',
    'osaBsssssssssssssssssdssssdddoo.',
    'odabdddddddddddddddddodddddoo...',
    'ooaaoooooooooooooooooooooo......',
)
COLORS = {
    '.': '#00000000',
    'o': '#211d1a',
    'd': '#423e3a',
    's': '#56524c',
    'm': '#69665f',
    'l': '#817e74',
    'h': '#969388',
    'a': '#5c4028',
    'b': '#a06e36',
    'B': '#c29150',
    'Y': '#dfbb74',
}


def main():
    reference = SOURCE / 'original.gif'
    with Image.open(reference) as old:
        old = old.convert('RGBA')
    width, height = old.size
    assert len(ROWS) == height and all(len(row) == width for row in ROWS)

    art = Image.new('RGBA', (width, height))
    palette = {key: ImageColor.getcolor(value, 'RGBA') for key, value in COLORS.items()}
    art.putdata([palette[key] for row in ROWS for key in row])
    assert art.getchannel('A').tobytes() == old.getchannel('A').tobytes()

    output = ROOT / 'assets/images/game-ready/projektili/granata.webp'
    output.parent.mkdir(parents=True, exist_ok=True)
    art.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as webp:
        assert webp.convert('RGBA').tobytes() == art.tobytes()

    data = {
        'method': 'Hand-authored pixel rows in prepare.py',
        'reference': reference.name,
        'frame': [width, height],
        'output': output.relative_to(ROOT).as_posix(),
        'referenceSha256': sha256(reference.read_bytes()).hexdigest(),
        'outputSha256': sha256(output.read_bytes()).hexdigest(),
    }
    (SOURCE / 'generation.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
