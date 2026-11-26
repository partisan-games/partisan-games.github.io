"""Fit both redraws into the original airframes' centered 2× sprite frames."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def prepare(plane):
    source = SOURCE / plane['source']
    original = ROOT / plane['reference']
    with Image.open(original) as legacy:
        canvas = Image.new('RGBA', (legacy.width * 2, legacy.height * 2))
    with Image.open(source) as draft:
        art = draft.convert('RGBA')
    alpha = art.getchannel('A').point(lambda value: 0 if value < 128 else value)
    art.putalpha(alpha)
    art = ImageOps.contain(art.crop(alpha.getbbox()), canvas.size, Image.Resampling.NEAREST)
    canvas.paste(art, ((canvas.width - art.width) // 2, (canvas.height - art.height) // 2))

    output = ROOT / plane['output']
    canvas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as written:
        assert written.convert('RGBA').tobytes() == canvas.tobytes(), output
    plane['frame'] = list(canvas.size)
    plane['anchor'] = [canvas.width / 2, canvas.height / 2]
    plane['bounds'] = list(canvas.getchannel('A').getbbox())
    for key, path in [('source', source), ('reference', original), ('output', output)]:
        plane[key + 'Sha256'] = sha256(path.read_bytes()).hexdigest()
    print(f'{output.name}: {canvas.size}, visible bounds {plane["bounds"]}')


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    for plane in data['aircraft']:
        prepare(plane)
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
