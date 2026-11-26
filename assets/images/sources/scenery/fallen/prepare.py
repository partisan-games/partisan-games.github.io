"""Register the redrawn figures to the existing still-prop frames."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    source = SOURCE / data['source']
    with Image.open(source) as draft:
        art = draft.convert('RGBA')

    alpha = art.getchannel('A').point(lambda value: 255 if value >= 128 else 0)
    art.putalpha(alpha)
    for figure in data['figures']:
        top, bottom = figure['sourceRows']
        sprite = art.crop((0, top, art.width, bottom))
        sprite = sprite.crop(sprite.getchannel('A').getbbox())
        width = figure['width']
        height = round(width * sprite.height / sprite.width)
        sprite = sprite.resize((width, height), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', tuple(data['frame']))
        frame.paste(sprite, (figure['left'], data['anchor'][1] - height), sprite.getchannel('A'))
        path = ROOT / 'assets/images/game-ready/scenery' / (figure['id'] + '.webp')
        frame.save(path, lossless=True, exact=True, method=6)
        with Image.open(path) as webp:
            assert webp.convert('RGBA').tobytes() == frame.tobytes()
        figure['bounds'] = list(frame.getchannel('A').getbbox())
        figure['outputSha256'] = sha256(path.read_bytes()).hexdigest()
    data['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    data['referenceSha256'] = sha256((SOURCE / data['reference']).read_bytes()).hexdigest()
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
