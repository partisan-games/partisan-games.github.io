"""Export the five full-elevation textures at their original UV dimensions."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    output = ROOT / data['outputFolder']
    output.mkdir(parents=True, exist_ok=True)
    for facade in data['facades']:
        reference = ROOT / facade['reference']
        draft = SOURCE / facade['source']
        with Image.open(reference) as original:
            size = original.size
        with Image.open(draft) as image:
            art = image.convert('RGB').resize(size, Image.Resampling.NEAREST)
        art = art.quantize(colors=data['paletteSize'], dither=Image.Dither.NONE).convert('RGB')
        target = output / facade['output']
        art.save(target, lossless=True, exact=True, method=6)
        with Image.open(target) as webp:
            assert webp.convert('RGB').tobytes() == art.tobytes()
        facade.update(size=list(size), referenceBytes=reference.stat().st_size, outputBytes=target.stat().st_size,
                      referenceSha256=digest(reference), sourceSha256=digest(draft), outputSha256=digest(target))
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
