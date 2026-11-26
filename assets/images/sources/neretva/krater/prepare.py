"""Crop the painted impact scar and save an exact lossless game texture."""

from hashlib import sha256
from pathlib import Path
import json

from PIL import Image


SOURCE = Path(__file__).resolve().parent
manifest = SOURCE / 'generation.json'
dressing = json.loads(manifest.read_text(encoding='utf-8'))
output = SOURCE.parents[4] / dressing['output']

with Image.open(SOURCE / dressing['source']) as image:
    crater = image.convert('RGBA')
alpha = crater.getchannel('A').point(lambda a: 0 if a < 144 else a)
crater.putalpha(alpha)
crater = crater.crop(alpha.getbbox())
crater.thumbnail((416, 180), Image.Resampling.NEAREST)
crater.save(output, lossless=True, exact=True, method=6)
with Image.open(output) as webp:
    assert webp.convert('RGBA').tobytes() == crater.tobytes()
dressing['size'] = list(crater.size)
dressing['sourceSha256'] = sha256((SOURCE / dressing['source']).read_bytes()).hexdigest()
dressing['outputSha256'] = sha256(output.read_bytes()).hexdigest()
manifest.write_text(json.dumps(dressing, indent=2) + '\n', encoding='utf-8')
