"""Register both generated Bf 109 appearances with one transform; keep runtime dimensions."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
SOURCE = HERE / 'bf109-redraw-generated.png'
source = Image.open(SOURCE).convert('RGBA')
source.putalpha(source.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
scale = 376 / 1629
offset = (round(14 - 270 * scale), round(65 - 230 * scale))
outputs = [ROOT / 'assets/images/game-ready/avioni/bf109-telo.png',
           HERE / 'bf109-damaged-generated.png']
cells = []
for row, output in enumerate(outputs):
    box = (0, round(row * source.height / 2), source.width, round((row + 1) * source.height / 2))
    cell = source.crop(box)
    cell = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.Resampling.NEAREST)
    packed = Image.new('RGBA', (404, 132))
    packed.alpha_composite(cell, offset)
    bounds = packed.getbbox()
    assert bounds and 0 < bounds[0] < bounds[2] < 404 and 0 < bounds[1] < bounds[3] < 132
    packed.save(output, optimize=True)
    cells.append(dict(sourceBox=box, bounds=bounds, output=output.relative_to(ROOT).as_posix(),
                      sha256=hashlib.sha256(output.read_bytes()).hexdigest()))
reference = HERE / 'bf109-damaged-reference.png'
reference.write_bytes(outputs[0].read_bytes())
record = dict(source=SOURCE.name, sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              frame=[404, 132], scale=scale, offset=offset, alphaThreshold=128,
              propellerHub=[38, 65], filter='nearest', appearances=cells,
              registration='Same scale and translation for intact and damaged source rows; no per-pose fitting.')
(HERE / 'bf109-redraw.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
print('Registered intact and damaged Bf 109; no collision dimensions changed.')
