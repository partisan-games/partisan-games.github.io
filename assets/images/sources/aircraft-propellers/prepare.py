"""Prepare native SVG propeller layers without repainting any accepted aircraft body."""
import json
import runpy
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = ROOT / 'assets/images/game-ready/avioni'

def strip(vertical):
    width, height = (12, 48) if vertical else (64, 12)
    spans = [21, 8, 17, 4] if vertical else [29, 12, 24, 5]
    cells = []
    for i, half in enumerate(spans):
        # Pixel-aligned stepped silhouettes, edge-on rather than a rotor rotating in the wing's plane.
        shape = f'<path fill="#222923" stroke="#111810" d="M-1 -{half}H1L2 -3V3L1 {half}H-1L-2 3V-3Z"/><path stroke="#a99545" stroke-width="2" d="M0 -{half-1}v3M0 {half-4}v3"/><rect x="-2" y="-2" width="4" height="4" fill="#384138"/>'
        rotate = '' if vertical else ' rotate(90)'
        cells.append(f'<g transform="translate({i*width+width/2} {height/2}){rotate}">{shape}</g>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width*4}" height="{height}" viewBox="0 0 {width*4} {height}" shape-rendering="crispEdges">' + ''.join(cells) + '</svg>\n'

def main():
    ju87 = json.loads((HERE.parent / 'plan-ideas-art/ju87-redraw.json').read_text(encoding='utf-8'))
    body_specs = [
        ('ju87', 'game-ready/avioni/ju87.png', ju87['frame'], 'side', [[*ju87['propellerHub'], ju87['propellerSpan']]]),
        ('bf109-side', 'game-ready/avioni/bf109.svg', [182, 48], 'side', [[4, 30, 34]]),
        ('bf109-top', 'armies/nemci/avioni/bf-109-odozgo.png', [230, 196], 'top', [[114.5, 5, 58]]),
        ('fw190-top', 'armies/nemci/avioni/fw-190-odozgo.png', [230, 194], 'top', [[114.5, 5, 64]]),
        ('bf110-top', 'armies/nemci/avioni/bf-110-odozgo.png', [354, 265], 'top', [[126.5, 29, 64], [226.5, 29, 64]]),
        ('he111-top', 'armies/nemci/avioni/he-111-odozgo.png', [820, 591], 'top', [[310, 28, 126], [497, 28, 126]]),
        ('bf109-grey-top', 'armies/nemci/avioni/avion-odozgo-01.png', [256, 225], 'top', [[126, 5, 64]]),
        ('bf109-desert-top', 'armies/nemci/avioni/avion-odozgo-02.png', [256, 230], 'top', [[126, 5, 64]]),
    ]
    metadata, layers = [], {}
    for projection, width, height in [('side', 12, 48), ('top', 64, 12)]:
        name = f'propeller-{projection}-sprites.svg'
        (OUT / name).write_text(strip(projection == 'side'), encoding='utf-8')
        raster = name.replace('.svg', '.png')
        subprocess.run(['magick', '-background', 'none', str(OUT / name), str(OUT / raster)], check=True)
        layers[projection] = {'src': 'game-ready/avioni/' + raster, 'frame': {'width': width, 'height': height}, 'columns': 4, 'seconds': .12}
        metadata.append({'id': 'propeller-' + projection, 'image': '../../game-ready/avioni/' + raster, 'vectorSource': '../../game-ready/avioni/' + name,
            'frame': {'width': width, 'height': height, 'columns': 4, 'rows': 1},
            'anchor': {'x': width/2, 'y': height/2},
            'animations': [{'name': 'spin', 'row': 0, 'frameCount': 4, 'duration': .12, 'loop': True}]})
    bodies = {path: {'id': key, 'bodySize': size, 'layer': layers[layer], 'projection': layer,
        'hubs': [{'x': x, 'y': y, 'span': span} for x, y, span in hubs], 'bodyUnchanged': True}
        for key, path, size, layer, hubs in body_specs}
    previews = HERE / 'previews'
    previews.mkdir(exist_ok=True)
    rows = []
    helpers = runpy.run_path(str(HERE.parent / 'tenkovi/prepare.py'))
    for path, body in bodies.items():
        image_path = ROOT / 'assets/images' / path
        if image_path.suffix == '.svg':
            preview_body = previews / (body['id'] + '-body.png')
            subprocess.run(['magick', '-background', 'none', str(image_path), str(preview_body)], check=True)
            image_path = preview_body
        original = Image.open(image_path).convert('RGBA')
        layer = body['layer']
        atlas = Image.open(ROOT / 'assets/images' / layer['src']).convert('RGBA')
        w, h = layer['frame']['width'], layer['frame']['height']
        scale = 1 if body['projection'] == 'side' else .5
        frames = []
        for phase in range(4):
            frame = Image.new('RGBA', (round(original.width * scale) + 30, round(original.height * scale) + 30))
            frame.alpha_composite(original.resize((round(original.width * scale), round(original.height * scale)), Image.Resampling.NEAREST), (15, 15))
            blade = atlas.crop((phase*w, 0, (phase+1)*w, h))
            for hub in body['hubs']:
                s = hub['span'] / (h if body['projection'] == 'side' else w) * scale
                part = blade.resize((max(1, round(w*s)), max(1, round(h*s))), Image.Resampling.NEAREST)
                frame.alpha_composite(part, (round(15 + hub['x']*scale - part.width/2), round(15 + hub['y']*scale - part.height/2)))
            frames.append(frame)
        helpers['save_gif'](frames, previews / (body['id'] + '.gif'), 30)
        rows.append((body['id'], frames))
    contact = Image.new('RGBA', (1800, sum(frames[0].height + 23 for _, frames in rows)), '#65705e')
    pen = ImageDraw.Draw(contact)
    y = 0
    for name, frames in rows:
        pen.text((5, y), name, fill='white')
        for phase, frame in enumerate(frames):
            contact.alpha_composite(frame, (phase*450, y+18))
        y += frames[0].height + 23
    contact.convert('RGB').save(HERE / 'propellers-game-size.png')
    (HERE / 'sprites.json').write_text(json.dumps({'schemaVersion': 1, 'assets': metadata, 'bodies': bodies,
        'notes': 'The accepted bodies have hubs/spinners but no painted blade crossing the propeller disc. No body pixels or SVG paths removed. Native vector layers match the existing SVG assets; four distinct edge-on projections, not a flat helicopter rotor. All hub coordinates are body-image pixels; existing actor transforms apply to both layers. Pauses dt=0 and dead engines hold the phase.'}, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'core/actor/aircraft/propellerArt.js').write_text('// Generated by assets/images/sources/aircraft-propellers/prepare.py.\nexport default ' + json.dumps(bodies, indent=2).replace('"', "'") + '\n', encoding='utf-8')
    cards = ''.join('<figure><img src="previews/' + body['id'] + '.gif"><figcaption>' + body['id'] + '</figcaption></figure>' for body in bodies.values())
    (HERE / 'preview.html').write_text('<!doctype html><html lang="sr"><meta charset="utf-8"><title>Propeleri</title><style>body{background:#65705e;color:white;font:16px sans-serif}img{image-rendering:pixelated}figure{display:inline-block}</style><h1>Četiri faze propelera</h1>' + cards + '<p>Osovine su u sprites.json; isti pokret i trupovi su u postojećim pričama stvarnih aktera.</p></html>', encoding='utf-8')
    print(f'Prepared 2 native SVG four-frame layers and measured hubs for {len(bodies)} unchanged aircraft bodies.')

if __name__ == '__main__':
    main()
