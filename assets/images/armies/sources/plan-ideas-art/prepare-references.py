"""Extract reference frames only; never invent or redraw game art."""
import json
import subprocess
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
IMAGES = ROOT / 'assets/images'
jobs = json.loads((HERE / 'jobs.json').read_text(encoding='utf-8'))['jobs']
for job in jobs:
    if 'reference' not in job:
        continue
    name = job['reference']
    source = IMAGES / name if name.startswith('buildings/') else IMAGES / 'armies' / name
    target = HERE / (job['id'] + '-reference.png')
    if source.suffix == '.svg':
        subprocess.run(['magick', '-background', 'none', str(source), str(target)], check=True)
        im = Image.open(target).convert('RGBA')
    else:
        im = Image.open(source).convert('RGBA')
    grid = job.get('referenceGrid')
    if grid is None and job['kind'] == 'infantry':
        grid = [4, 4 if 'posada' in name else 2, 0]
    if grid:
        cols, rows, row = grid
        w, h = im.width / cols, im.height / rows
        im = im.crop((0, round(row*h), round(w), round((row+1)*h)))
    im.save(target)
    print(job['id'], im.size)
