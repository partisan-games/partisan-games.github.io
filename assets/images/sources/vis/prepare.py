"""Prepare the separate approach island and landing base for the Vis scene."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[3]


def prepare(state):
    source = SOURCE / state['source']
    reference = SOURCE / state['reference']
    with Image.open(source) as draft:
        art = draft.convert('RGBA')
    with Image.open(reference) as original:
        assert original.size == tuple(state['frame'])

    alpha = art.getchannel('A').point(lambda value: 0 if value < 32 else 255 if value >= 250 else value)
    art.putalpha(alpha)
    canvas = Image.new('RGBA', tuple(state['frame']))
    if 'placement' in state:
        left, top, right, bottom = state['placement']
        art = art.crop(alpha.getbbox()).resize((right - left, bottom - top), Image.Resampling.NEAREST)
        position = left, top
    else:
        assert art.size == canvas.size
        position = tuple(state['offset'])

    visible = art.getchannel('A').point(lambda value: 255 if value else 0)
    canvas.paste(art, position, visible)

    output = ROOT / state['output']
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as webp:
        assert webp.convert('RGBA').tobytes() == canvas.tobytes()

    state['referenceSha256'] = sha256(reference.read_bytes()).hexdigest()
    state['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    state['outputSha256'] = sha256(output.read_bytes()).hexdigest()


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    for state in data['states']:
        prepare(state)
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
