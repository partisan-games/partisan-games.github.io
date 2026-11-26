"""Fit the church drawing to the original frame and ground line."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    source = SOURCE / data['source']
    with Image.open(source) as draft:
        art = draft.convert('RGBA')

    alpha = art.getchannel('A').point(lambda opacity: 255 if opacity >= 128 else 0)
    art.putalpha(alpha)
    canvas = Image.new('RGBA', tuple(data['frame']))
    art = ImageOps.contain(art.crop(alpha.getbbox()), canvas.size, Image.Resampling.NEAREST)
    canvas.paste(art, ((canvas.width - art.width) // 2, canvas.height - art.height), art)

    output = ROOT / data['output']
    canvas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as webp:
        assert webp.convert('RGBA').tobytes() == canvas.tobytes()

    data['bounds'] = list(canvas.getchannel('A').getbbox())
    data['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    data['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
