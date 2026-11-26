"""Register the three overhead frames of the partisan boat and export lossless WebP."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageOps


SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parents[4]


def prepare(state, size):
    source = SOURCE / state['source']
    with Image.open(source) as draft:
        art = draft.convert('RGBA')
    # Remove the faint cutout halo. Keep the redrawn silhouette and its edge alpha.
    alpha = art.getchannel('A').point(lambda opacity: 0 if opacity < 128 else opacity)
    art.putalpha(alpha)
    art = ImageOps.contain(art.crop(alpha.getbbox()), size, Image.Resampling.NEAREST)
    canvas = Image.new('RGBA', size)
    canvas.paste(art, (size[0] - art.width, (size[1] - art.height) // 2))
    output = ROOT / state['output']
    canvas.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as exported:
        assert exported.convert('RGBA').tobytes() == canvas.tobytes(), output
    state['bounds'] = list(canvas.getchannel('A').getbbox())
    state['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    state['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    state['referenceSha256'] = {ref: sha256((ROOT / ref).read_bytes()).hexdigest() for ref in state['references']}
    print(f'{state["name"]}: {canvas.size}, visible bounds {state["bounds"]}')


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    for state in data['states']:
        prepare(state, tuple(data['frame']))
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
