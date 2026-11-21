"""Append generated upper-body recoil to the unchanged five-row Occupier atlas."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
original = Image.open(ROOT / 'assets/images/sprites/vojnici/okupator-sprite.png').convert('RGBA')
raw = Image.open(HERE / 'occupier-fire-generated.png').convert('RGBA')
cells = [raw.crop((round(i * raw.width / 5), 0, round((i + 1) * raw.width / 5), raw.height)) for i in range(5)]
boxes = [cell.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox() for cell in cells]
crop = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
base = original.crop((0, 210, 210, 420))
sheet = Image.new('RGBA', (1050, 1260))
sheet.paste(original, (0, 0))
frames = []
for i, cell in enumerate(cells):
    body = cell.crop(crop).resize((55, 191), Image.Resampling.NEAREST)
    frame = base.copy()
    # Keep helmet, face, boots and stance from the accepted original; transfer
    # only the generated hands, weapon, forearms and shoulder recoil region.
    frame.paste(body.crop((0, 46, 55, 116)), (80, 65))
    assert frame.crop((0, 135, 210, 210)).tobytes() == base.crop((0, 135, 210, 210)).tobytes()
    sheet.paste(frame, (i * 210, 1050))
    frames.append(frame)
assert len({hashlib.sha256(f.tobytes()).digest() for f in frames}) == 5
assert sheet.crop((0, 0, 1050, 1050)).tobytes() == original.tobytes()
target = ROOT / 'assets/images/armies/game-ready/vojnici/occupier-sprites.png'
sheet.save(target, optimize=True)
strip = Image.new('RGB', (210 * 5, 210))
for i, frame in enumerate(frames):
    strip.paste(frame.convert('RGB'), (i * 210, 0))
palette = strip.quantize(colors=255)
encoded = []
for frame in frames:
    indexed = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
    indexed.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
    encoded.append(indexed)
encoded[0].save(HERE / 'previews/occupier-fire.gif', save_all=True, append_images=encoded[1:], duration=100, loop=0, transparency=255, disposal=2, optimize=False)
metadata = {'schemaVersion': 1, 'assets': [{'id': 'occupier', 'image': '../../game-ready/vojnici/occupier-sprites.png', 'frame': {'width': 210, 'height': 210, 'columns': 5, 'rows': 6}, 'anchor': {'x': 105, 'y': 210}, 'animations': [{'name': name, 'row': row, 'frameCount': 5, 'duration': .5, 'loop': name != 'umire'} for row, name in enumerate(['nagore', 'nadole', 'nalevo', 'nadesno', 'umire', 'fire'])], 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}]}
(HERE / 'occupier-sprites.json').write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
(HERE / 'occupier-preview.html').write_text('<!doctype html><meta charset="utf-8"><title>Occupier fire</title><style>body{background:#687261;color:white}img{image-rendering:pixelated}</style><h1>Occupier: fire</h1><img src="previews/occupier-fire.gif"><p>Five generated recoil phases; original head, boots and first five rows preserved. Same class in Otpisani and Storybook.</p>', encoding='utf-8')
print('Occupier: five fire frames; original rows and stance preserved.')
