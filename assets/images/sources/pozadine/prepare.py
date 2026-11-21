"""Build offline ART-12 composition studies; never run or modify the game."""
import hashlib
import argparse
import html
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageOps


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
ART = ROOT / 'assets/images/armies/game-ready'
NEAREST = Image.Resampling.NEAREST
VIEWPORTS = [(1280, 720), (1024, 768)]


def picture(path):
    with Image.open(path) as image:
        return image.convert('RGBA')


def frame(path, columns=1, rows=1):
    image = picture(path)
    return image.crop((0, 0, image.width // columns, image.height // rows))


def centered(canvas, image, x, y, scale=1, mirror=False):
    image = image.resize((round(image.width * scale), round(image.height * scale)), NEAREST)
    if mirror:
        image = ImageOps.mirror(image)
    canvas.alpha_composite(image, (round(x - image.width / 2), round(y - image.height / 2)))


def landscape(image, ground_y, size, scene):
    width, height = size
    target = round(height * (.75 if scene == 'ustanak' else .8))
    result = Image.new('RGBA', size)
    result.paste(image.crop((0, 0, image.width, ground_y)).resize((width, target), NEAREST))
    result.paste(image.crop((0, ground_y, image.width, image.height)).resize((width, height - target), NEAREST), (0, target))
    return result, target


def tank_barrel(canvas, name, x, y, body_size, scale):
    image = picture(ART / f'tenkovi/{name}-tenk-cev-pixel.png')
    image = image.resize((round(image.width * scale), round(image.height * scale)), NEAREST)
    right = name == 'nemacki'
    pivot = (x + body_size[0] * (-.12 if right else .07), y - body_size[1] * (.35 if right else .33))
    # Match Renderer2D: right barrel is bottom-right anchored, horizontally flipped, then rotated.
    left, top = (0, -image.height) if right else (0, 0)
    if right:
        image = ImageOps.mirror(image)
    layer = Image.new('RGBA', canvas.size)
    layer.alpha_composite(image, (round(pivot[0] + left), round(pivot[1] + top)))
    layer = layer.rotate(-math.degrees(math.pi * (1.1 if right else 1.9)), resample=NEAREST, center=pivot)
    canvas.alpha_composite(layer)


def composition(image, ground_y, size, scene):
    canvas, ground = landscape(image, ground_y, size, scene)
    width, height = size
    if scene == 'tenkici':
        # Current Tenk coordinates are centers, not foot anchors. Deterministic legal x positions.
        scale = .5 if width > 1280 else .4
        for name, x in [('partizanski', width * .2), ('nemacki', width * .8)]:
            body = frame(ART / f'tenkovi/{name}-tenk-sprites.png', 4, 2)
            centered(canvas, body, x, ground, scale)
            tank_barrel(canvas, name, x, ground, (body.width * scale, body.height * scale), scale)
    else:
        # Main's groundLevel is the far edge, not the wheel/feet line: Top.floorY = ground + 34.875.
        top = round(ground + 34.875 - 7)
        tile = picture(ROOT / 'assets/images/background/ustanak-tlo.png')
        for y in range(top, height, tile.height):
            for x in range(0, width, tile.width):
                canvas.alpha_composite(tile, (x, y))
        for x, direction in [(230, 1), (width - 230, -1)]:
            centered(canvas, frame(ART / 'artiljerija/top-cev.gif'), x, ground - 32, .75, direction < 0)
            centered(canvas, frame(ART / 'artiljerija/top-postolje.gif'), x - 40 * direction, ground, .75, direction < 0)
        for name, x, mirror in [('partizanska', 110, False), ('italijanska', width - 110, True)]:
            image = frame(ART / f'artiljerija/{name}-posada-sprites.png', 4, 4).resize((60, 60), NEAREST)
            if mirror:
                image = ImageOps.mirror(image)
            canvas.alpha_composite(image, (round(x - 30), round(ground + 8 + 26 - 60 * .965)))
        rifle = frame(ART / 'vojnici/partizanski-strelac-sprites.png', 4, 2).resize((88, 80), NEAREST)
        canvas.alpha_composite(rifle, (256, round(ground + 8 + 26 - 80 * .85)))
    return canvas.convert('RGB')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--compositions', action='store_true', help='Generate optional large PNG compositions locally.')
    parser.add_argument('--export-handoff', action='store_true', help='Explicitly replace backgrounds.json from art-ready entries.')
    options = parser.parse_args()
    manifest = json.loads((HERE / 'manifest.json').read_text(encoding='utf-8'))
    output = HERE / 'previews'
    if options.compositions:
        output.mkdir(exist_ok=True)
    previous_path = HERE / 'review.json'
    previous = json.loads(previous_path.read_text(encoding='utf-8')) if previous_path.exists() else {}
    previous_references = {ref['image']: ref for ref in previous.get('references', [])}
    report = {'task': 'ART-12', 'gameExecuted': False, 'visualAcceptance': False,
              'compositionPreviewsGenerated': options.compositions, 'references': [], 'backgrounds': []}
    sections = ['<!doctype html><meta charset="utf-8"><title>ART-12 · pozadine</title>',
                '<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#242820;color:#eee;font:16px system-ui;max-width:1300px;margin:24px auto;padding:16px}img{display:block;max-width:100%;height:auto;margin:12px 0}article{margin:40px 0}a{color:#b8d7ed}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}.gallery img{width:100%}summary{cursor:pointer;padding:12px 0}pre{white-space:pre-wrap}</style>',
                '<h1>ART-12 · pozadine</h1><p>Pomoćni prikaz kompozicije sa stvarnim artom; nije pokrenuta igra. '
                'Tenkovi imaju odvojene cevi u početnoj pozi, topovi su u početnoj ravnoj pozi; nema zastava, bunkera, HUD-a, vetra ni efekata. '
                'Tlo je poravnato predloženim prelomom slike; postojeći Tenkići još ne koriste ovo mapiranje.</p>']
    if not options.compositions:
        sections.append('<p>Prikazane su sačuvane slike bez dodatnih PNG kopija. '
                        'Za lokalne kompozicije sa jedinicama pokrenuti <code>python assets/images/sources/pozadine/prepare.py --compositions</code>. '
                        'Pregled ne menja metapodatke koje igre već koriste.</p>')
    cards = []
    for bg in manifest['backgrounds']:
        if (ROOT / bg['image']).exists():
            src = Path(os.path.relpath(ROOT / bg['image'], HERE)).as_posix()
            cards.append(f'<a href="#{bg["id"]}"><img src="{html.escape(src)}" alt="">{html.escape(bg["name"])}</a>')
    sections.append('<nav class="gallery">' + ''.join(cards) + '</nav>')
    jobs = []
    handoff = {'schemaVersion': 1, 'pathBase': 'assets/images', 'integrationStatus': 'Art handoff only; not currently consumed by the game', 'coordinates': 'Source pixels, top-left origin; groundY is the far edge of the flat combat strip, not an actor foot anchor', 'backgrounds': []}
    for index, ref in enumerate(manifest['styleReferences']):
        source = ROOT / ref['image']
        image = picture(source)
        report['references'].append({'image': Path(os.path.relpath(source, HERE)).as_posix(),
                                     'size': list(image.size), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
        jobs.append((f'reference-{index + 1}', source.stem, source, round(image.height * ref['groundRatio'])))
    for ref in manifest['historicalReferences']:
        source = ROOT / ref['image']
        relative = source.relative_to(HERE).as_posix()
        recorded = previous_references.get(relative, {})
        report['references'].append({'image': relative, 'source': ref['source'], 'snapshotPresent': source.exists(),
            'size': list(picture(source).size) if source.exists() else recorded.get('size'),
            'sha256': hashlib.sha256(source.read_bytes()).hexdigest() if source.exists() else ref.get('sha256', recorded.get('sha256'))})
    for bg in manifest['backgrounds']:
        if bg['status'] not in manifest['statusValues']:
            raise ValueError(f"Unknown status: {bg['id']}")
        source = ROOT / bg['image']
        report['backgrounds'].append({'id': bg['id'], 'status': bg['status'], 'imagePresent': source.exists()})
        if bg['status'] == 'removed-by-owner':
            replacement = Path(os.path.relpath(ROOT / bg['preferredSeasonalImage'], HERE)).as_posix()
            sections.append(f'<article><h2>{html.escape(bg["name"])}</h2><p>Ranija verzija je obrisana po odluci vlasnika. <a href="{html.escape(replacement)}">Sezonska verzija</a>.</p></article>')
            continue
        if not source.exists():
            if bg['status'] == 'art-ready':
                raise ValueError(f"Missing selected art: {bg['id']}")
            sections.append(f"<article><h2>{html.escape(bg['name'])}</h2><p>Čeka izradu.</p></article>")
            continue
        image = picture(source)
        if list(image.size) != bg['imageSize'] or not isinstance(bg['groundY'], int) or not 0 < bg['groundY'] < image.height:
            raise ValueError(f"Measure imageSize and groundY first: {bg['id']}")
        if image.getchannel('A').getextrema() != (255, 255):
            raise ValueError(f"Background must be opaque: {bg['id']}")
        if bg['hotspots'] is None:
            raise ValueError(f"Review hotspots first: {bg['id']}")
        if bg['status'] == 'art-ready':
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            if not bg['generations'] or not bg['visualReview'] or bg['visualReview'].get('imageSha256') != digest:
                raise ValueError(f"Record generation and matching visual review first: {bg['id']}")
            handoff['backgrounds'].append({'id': bg['id'], 'name': bg['name'], 'src': source.relative_to(ROOT / 'assets/images').as_posix(), 'size': bg['imageSize'], 'groundY': bg['groundY'], 'hotspots': bg['hotspots'], 'sha256': digest})
        for hotspot in bg['hotspots']:
            if not (0 <= hotspot['x'] < image.width and 0 <= hotspot['y'] < bg['groundY'] and 0 < hotspot['intensity'] <= 1 and hotspot['kind'] in ('fire', 'smoke')):
                raise ValueError(f"Invalid hotspot: {bg['id']}")
        jobs.append((bg['id'], bg['name'], source, bg['groundY']))
    for slug, title, source, ground_y in sorted(jobs, key=lambda job: job[0].startswith('reference-')):
        src = Path(os.path.relpath(source, HERE)).as_posix()
        sections.append(f'<article id="{slug}"><h2>{html.escape(title)}</h2><p><a href="{html.escape(src)}">Konačni PNG / izvorni uzor</a> · linija tla: {ground_y} px</p>')
        bg = next((bg for bg in manifest['backgrounds'] if bg['id'] == slug), None)
        if bg:
            sections.append('<details><summary>Žarišta za animaciju, u pikselima izvornog PNG-a</summary><pre>' + html.escape(json.dumps(bg['hotspots'], ensure_ascii=False, indent=2)) + '</pre></details>')
        for size in VIEWPORTS if options.compositions else []:
            for scene in ('ustanak', 'tenkici'):
                name = f'{slug}-{scene}-{size[0]}x{size[1]}.png'
                composition(picture(source), ground_y, size, scene).save(output / name)
                sections.append(f'<p>{scene} · {size[0]}×{size[1]}</p><a href="previews/{name}"><img src="previews/{name}" alt="{html.escape(title)} · {scene}"></a>')
        sections.append('</article>')
    (HERE / 'preview.html').write_text('\n'.join(sections), encoding='utf-8')
    (HERE / 'review.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    if options.export_handoff:
        if not handoff['backgrounds']:
            raise ValueError('No art-ready entries; refusing to replace the existing game handoff with an empty list')
        (HERE / 'backgrounds.json').write_text(json.dumps(handoff, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f"Prepared {len(jobs)} images; {sum(not bg['imagePresent'] for bg in report['backgrounds'])} backgrounds await art. No game or browser executed.")


if __name__ == '__main__':
    main()
