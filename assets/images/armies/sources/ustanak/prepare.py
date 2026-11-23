"""Describe accepted Ustanak atlases and export the same geometry to runtime; never redraw them."""
import hashlib
import json
import re
import runpy
from pathlib import Path

from PIL import Image


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
IMAGE_ROOT = ROOT / 'assets/images'
PROFILES = [
    ('partizanska-posada', 'partisanCrew', 'artiljerija', 4, ['idle', 'load', 'fire', 'recoil'], [1.4, .75, .32, .55], 60, 60, .965, 26, 'idle'),
    ('italijanska-posada', 'italianCrew', 'artiljerija', 4, ['idle', 'load', 'fire', 'recoil'], [1.4, .75, .32, .55], 60, 60, .965, 26, 'idle'),
    ('partizanski-strelac', 'rifleman', 'vojnici', 2, ['idle', 'fire'], [1.4, .4], 88, 80, .85, 26, 'idle'),
    ('partizanski-zastavnik', 'partisanBearer', 'vojnici', 1, ['partisan'], [1.6], 60, 80, .95, 35, 'partisan'),
    ('zastavnici', 'italianBearer', 'vojnici', 2, ['partisan', 'italian'], [1.6, 1.6], 80, 80, .95, 35, 'italian'),
]


def clean_source_alpha():
    jobs = json.loads((HERE.parent / 'plan-ideas-art/jobs.json').read_text(encoding='utf-8'))['jobs']
    for ident, _, category, *_ in PROFILES:
        source = f'game-ready/{category}/{ident}-sprites.png'
        path = IMAGE_ROOT / 'armies' / source
        image = Image.open(path).convert('RGBA')
        alpha = image.getchannel('A')
        cleaned = alpha.point(lambda value: 0 if value < 8 else value)
        if alpha.tobytes() != cleaned.tobytes():
            image.putalpha(cleaned)
            image.save(path, optimize=True)
        for job in jobs:
            if job.get('reference') != source or job['kind'] != 'hit':
                continue
            cols, rows, row = job['referenceGrid']
            reference = image.crop((0, round(row * image.height / rows),
                                    round(image.width / cols), round((row + 1) * image.height / rows)))
            reference.save(HERE.parent / f"plan-ideas-art/{job['id']}-reference.png", optimize=True)
            if ident == 'partizanski-strelac':
                reference.save(HERE.parent / 'partisan-rifleman/kneel-reference.png', optimize=True)


def main():
    clean_source_alpha()
    previews = HERE / 'previews'
    previews.mkdir(exist_ok=True)
    helper = runpy.run_path(str(HERE.parent / 'tenkovi/prepare.py'))['save_gif']
    assets, runtime = [], {}
    page = ['<!doctype html><meta charset="utf-8"><title>Ustanak · prihvaćeni atlasi</title><style>body{background:#30372c;color:#eee;font:16px system-ui;padding:24px}img{image-rendering:pixelated;max-width:100%;display:block;margin:12px 0}a{color:#dedc9b}section{margin:32px 0}</style><h1>Ustanak · postojeći atlas i klipovi</h1><p>Sačuvani crteži i mreže kadrova; gotovo providan višak strelca očišćen je na izvoru. GIF petlje služe pregledu kadrova, ne izvršavanju igre.</p>']
    for ident, key, category, rows, names, durations, width, height, baseline, foot, default in PROFILES:
        src = f'armies/game-ready/{category}/{ident}-sprites.png'
        path = IMAGE_ROOT / src
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        original = Image.open(path).convert('RGBA')
        cell_width, cell_height = original.width / 4, original.height / rows
        animations, edge_counts = [], []
        page.append(f'<section><h2>{ident}</h2><a href="../../game-ready/{category}/{ident}-sprites.png">Prihvaćeni izvor</a>')
        for row, (name, duration) in enumerate(zip(names, durations)):
            frames = []
            for column in range(4):
                # Canvas already samples fractional source rectangles. Preserve that accepted grid exactly.
                box = (column * cell_width, row * cell_height, (column + 1) * cell_width, (row + 1) * cell_height)
                cell = original.crop(box)
                opaque = cell.getchannel('A').point(lambda value: 255 if value >= 128 else 0)
                edge_counts.append({'row': row, 'column': column, 'opaqueSilhouetteTouchesCellEdge': any(opaque.crop(edge).getbbox() for edge in [(0, 0, 1, cell.height), (cell.width-1, 0, cell.width, cell.height), (0, 0, cell.width, 1), (0, cell.height-1, cell.width, cell.height)])})
                frames.append(cell.resize((width, height), Image.Resampling.NEAREST))
            # Fractional rectangles can round to different temporary crop sizes; display size remains fixed.
            helper(frames, previews / f'{ident}-{name}.gif', round(duration * 250))
            strip = Image.new('RGBA', (width * 4, height), '#3d4332')
            for column, frame in enumerate(frames):
                strip.alpha_composite(frame, (column * width, 0))
            strip.convert('RGB').save(previews / f'{ident}-{name}.png')
            if ident != 'zastavnici' or row == 1:
                page.append(f'<p>{name} · {duration} s</p><img src="previews/{ident}-{name}.gif" alt="{ident} {name}"><img src="previews/{ident}-{name}.png" alt="Sva četiri kadra">')
            loop = name in ('idle', 'partisan', 'italian')
            animations.append({'name': name, 'row': row, 'frameCount': 4, 'duration': duration, 'loop': loop, 'used': ident != 'zastavnici' or row == 1})
        assets.append({'id': ident, 'title': ident, 'image': f'../../game-ready/{category}/{ident}-sprites.png',
                       'sha256': digest, 'frame': {'width': cell_width, 'height': cell_height, 'columns': 4, 'rows': rows},
                       'anchor': {'x': cell_width / 2, 'y': cell_height * baseline},
                       'render': {'width': width, 'height': height, 'footOffset': foot, 'baseline': baseline},
                       'animations': animations, 'sourceEdges': edge_counts, 'acceptedPixelsUnchanged': True,
                       'note': 'Fractional source rectangles are intentional and unchanged; one uniform grid is read by Sprite/artFrame. No new art or independent cell fitting.'})
        runtime[key] = {'src': src, 'names': names, 'columns': 4, 'durations': dict(zip(names, durations)),
                        'width': width, 'height': height, 'baseline': baseline, 'footOffset': foot, 'defaultAnimation': default}
        assets[-1]['acceptedPixelsUnchanged'] = False
        assets[-1]['alphaCleanup'] = {'script': 'prepare.py', 'alphaCutoff': 8,
                                     'preserved': 'All RGB values and alpha >= 8; dimensions, grid and anchors unchanged.'}
        assert hashlib.sha256(path.read_bytes()).hexdigest() == digest
        page.append('</section>')
    (HERE / 'preview.html').write_text('\n'.join(page), encoding='utf-8')
    (HERE / 'sprites.json').write_text(json.dumps({'schemaVersion': 1, 'generatedWith': 'Measurements of accepted art; source alpha cleanup recorded per atlas', 'assets': assets}, indent=2) + '\n', encoding='utf-8')
    body = json.dumps(runtime, indent=2)
    body = re.sub(r'"(?:\\.|[^"\\])*"', lambda match: "'" + json.loads(match.group()).replace("'", "\\'") + "'", body)
    (ROOT / 'core/actor/ustanakArt.js').write_text('/** Generated from accepted atlas measurements by assets/images/armies/sources/ustanak/prepare.py. */\nexport default ' + body + '\n', encoding='utf-8')
    print('Measured five atlases; source alpha normalized; retained pixels and grids unchanged; exported shared descriptors and GIFs.')


if __name__ == '__main__':
    main()
