"""Prepare the retained hospital study; it is not integrated into the game."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
IMAGES = HERE.parent.parent


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    assets = []
    for name, target, size, footprint in [
        ('house', 'buildings/bunker-house.png', (720, 440), (360, 220)),
    ]:
        source = HERE / f'{name}.png'
        with Image.open(source) as image:
            image = image.convert('RGBA')
            alpha = image.getchannel('A')
            if alpha.getextrema()[0] != 0:
                raise ValueError(f'{name}: expected a transparent background')
            bounds = alpha.point(lambda value: 255 if value >= 16 else 0).getbbox()
            if not bounds:
                raise ValueError(f'{name}: empty sprite')
            sprite = ImageOps.contain(image.crop(bounds), size, Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', size)
            canvas.alpha_composite(sprite, ((size[0] - sprite.width) // 2, (size[1] - sprite.height) // 2))
            output = IMAGES / target
            canvas.save(output, optimize=True)
        assets.append({
            'id': f'bunker-{name}', 'image': f'../../{target}', 'source': source.name,
            'sourceBounds': list(bounds), 'sourceSha256': digest(source), 'sha256': digest(output),
            'frame': {'width': size[0], 'height': size[1], 'columns': 1, 'rows': 1},
            'anchor': {'x': size[0] / 2, 'y': size[1] / 2},
            'renderSize': list(footprint),
            'animations': [{'name': 'idle', 'row': 0, 'frameCount': 1, 'duration': 1, 'loop': False}],
        })
    metadata = {'schemaVersion': 1, 'assets': assets}
    (HERE / 'sprites.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    print('Prepared retained hospital study; game integration unchanged.')


if __name__ == '__main__':
    main()
