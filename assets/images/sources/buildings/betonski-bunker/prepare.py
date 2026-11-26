"""Register the three pillbox drawings to the original side-view frame."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def prepare(state, canvas_size):
    source = SOURCE / state['source']
    with Image.open(source) as draft:
        art = draft.convert('RGBA')
    alpha = art.getchannel('A').point(lambda opacity: 0 if opacity < 128 else opacity)
    art.putalpha(alpha)
    x0, y0, x1, y1 = state['placement']
    art = ImageOps.contain(art.crop(alpha.getbbox()), (x1 - x0, y1 - y0), Image.Resampling.NEAREST)
    canvas = Image.new('RGBA', canvas_size)
    canvas.paste(art, (x0 + (x1 - x0 - art.width) // 2, y1 - art.height))

    path = ROOT / state['output']
    canvas.save(path, lossless=True, exact=True, method=6)
    with Image.open(path) as webp:
        assert webp.convert('RGBA').tobytes() == canvas.tobytes(), path
    state['bounds'] = list(canvas.getchannel('A').getbbox())
    state['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    state['outputSha256'] = sha256(path.read_bytes()).hexdigest()
    print(f'{state["name"]}: {state["bounds"]}')


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    for state in data['states']:
        prepare(state, tuple(data['frame']))
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
