"""Register the two Ju 87 appearances with one pixel scale and measured propeller hub."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
SOURCE = HERE / 'ju87-redraw-transparent.png'
source = Image.open(SOURCE).convert('RGBA')
source.putalpha(source.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
cells = [source.crop((0, round(row*source.height/2), source.width, round((row+1)*source.height/2))) for row in range(2)]
boxes = [cell.getbbox() for cell in cells]
assert all(boxes)
left, top = min(box[0] for box in boxes), min(box[1] for box in boxes)
right, bottom = max(box[2] for box in boxes), max(box[3] for box in boxes)
scale = min(388/(right-left), 140/(bottom-top))
offset = (round(6-left*scale), round(4-top*scale))
outputs = [ROOT/'assets/images/game-ready/avioni/ju87.png', HERE/'ju87-damaged-generated.png']
appearances = []
for cell, output in zip(cells, outputs):
    scaled = cell.resize((round(cell.width*scale), round(cell.height*scale)), Image.Resampling.NEAREST)
    packed = Image.new('RGBA', (400, 148))
    packed.alpha_composite(scaled, offset)
    bounds = packed.getbbox()
    assert bounds and 0 < bounds[0] < bounds[2] < 400 and 0 < bounds[1] < bounds[3] < 148
    packed.save(output, optimize=True)
    appearances.append(dict(output=output.relative_to(ROOT).as_posix(), bounds=bounds,
                            sha256=hashlib.sha256(output.read_bytes()).hexdigest()))
(HERE/'ju87-damaged-reference.png').write_bytes(outputs[0].read_bytes())
record = dict(source=SOURCE.name, sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              frame=[400, 148], scale=scale, offset=offset, alphaThreshold=128,
              propellerHub=[round(310*scale+offset[0]), round(205*scale+offset[1])], propellerSpan=84,
              appearances=appearances, filter='nearest', registration='One scale and translation for both source rows.')
(HERE/'ju87-redraw.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
print('Registered both Ju 87 appearances; no collision dimensions changed.')
