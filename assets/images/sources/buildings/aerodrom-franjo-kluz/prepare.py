"""Export the new airfield façade in the original ground-aligned frame."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    reference = SOURCE / data['reference']
    source = SOURCE / data['source']
    with Image.open(reference) as original:
        assert original.size == tuple(data['frame'])
    with Image.open(source) as draft:
        art = draft.convert('RGBA')

    alpha = art.getchannel('A').point(lambda value: 255 if value >= 128 else 0)
    art.putalpha(alpha)
    left, top, right, bottom = data['placement']
    scale = data['pixelScale']
    frame = (right - left, bottom - top)
    art = art.crop(alpha.getbbox()).resize((frame[0] // scale, frame[1] // scale), Image.Resampling.NEAREST)
    art = art.resize(frame, Image.Resampling.NEAREST)
    canvas = Image.new('RGBA', tuple(data['frame']))
    canvas.paste(art, (left, top), art.getchannel('A'))

    output = ROOT / data['output']
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as webp:
        assert webp.convert('RGBA').tobytes() == canvas.tobytes()

    data['referenceBytes'] = reference.stat().st_size
    data['outputBytes'] = output.stat().st_size
    data['referenceSha256'] = sha256(reference.read_bytes()).hexdigest()
    data['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    data['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
