"""Prepare the six approved ART-12 locations and offline unit-composition reviews."""
import hashlib
import html
import importlib.util
import json
import sys
from pathlib import Path
from PIL import Image

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def seasonal_variants():
    path = HERE / 'seasonal-backgrounds.json'
    if not path.exists():
        return []
    entries = json.loads(path.read_text(encoding='utf-8'))['backgrounds']
    ready = []
    for entry in entries:
        if entry['status'] != 'art-ready':
            continue
        source = ROOT / entry['image']
        with Image.open(source) as image:
            assert list(image.size) == entry['imageSize']
            assert image.convert('RGBA').getchannel('A').getextrema() == (255, 255)
            assert 0 < entry['groundY'] < image.height
        assert digest(source) == entry['imageSha256']
        for ref, expected in entry['referenceSha256'].items():
            assert digest(ROOT / ref) == expected
        ready.append(entry)
    return ready


def main():
    manifest = json.loads((HERE / 'current-levels.json').read_text(encoding='utf-8'))
    spec = importlib.util.spec_from_file_location('composition', HERE / 'prepare.py')
    composition = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(composition)
    output = HERE / 'current-previews'
    output.mkdir(exist_ok=True)
    cards, records, ready = [], [], []
    for entry in manifest['backgrounds']:
        source = ROOT / entry['image']
        if not source.exists():
            if entry['status'] == 'art-ready':
                raise ValueError(f"Missing ready image: {entry['id']}")
            continue
        assert entry['status'] == 'art-ready'
        with Image.open(source) as image:
            assert list(image.size) == entry['imageSize']
            assert 0 < entry['groundY'] < image.height
            if not entry.get('layers'):
                assert image.convert('RGBA').getchannel('A').getextrema() == (255, 255)
            assert digest(source) == entry['imageSha256']
            previews = []
            for size in [] if entry.get('layers') else [(1280, 720), (1024, 768)]:
                name = f"{entry['id']}-{size[0]}x{size[1]}.webp"
                composition.composition(image.convert('RGBA'), entry['groundY'], size, entry['scene']).convert('RGB').save(output / name, lossless=True)
                previews.append('current-previews/' + name)
        if entry.get('layers'):
            folder = ROOT / entry['layers']
            layout = json.loads((folder / 'layout.json').read_text(encoding='utf-8'))
            assert [layout['width'], layout['height']] == entry['imageSize']
            assert layout['groundY'] == entry['groundY']
            for name in ('base.png', 'clouds.png', 'actors.png', 'layout.json'):
                assert digest(folder / name) == entry['layerSha256'][name]
        for ref in entry['references']:
            assert digest(ROOT / ref) == entry['referenceSha256'][ref]
        for edit in entry.get('edits', []):
            assert digest(ROOT / edit['reference']) == edit['referenceSha256']
        for spot in entry['hotspots']:
            assert spot['kind'] in ('fire', 'smoke') and 0 < spot['intensity'] <= 1
            assert 0 <= spot['x'] < entry['imageSize'][0] and 0 <= spot['y'] < entry['groundY']
        record = {'id': entry['id'], 'sha256': entry['imageSha256'], 'previews': previews, 'previewSha256': {p: digest(HERE / p) for p in previews}, 'gameExecuted': False, 'ownerAccepted': entry.get('ownerAccepted', False)}
        if entry.get('layers'):
            record['animatedPreview'] = entry['animatedPreview']
            assert (ROOT / record['animatedPreview']).is_file()
        records.append(record)
        content = '<a href="../../../../' + entry['image'] + '">PNG</a>' + ''.join('<figure><img src="' + p + '"><figcaption>' + p + '</figcaption></figure>' for p in previews)
        if entry.get('layers'):
            content = '<p><a href="../../../../' + html.escape(record['animatedPreview']) + '">Batina: selected animated background</a> (live layers; no unit-composition still)</p>'
        cards.append('<article><h2>' + html.escape(entry['name']) + '</h2>' + content + '</article>')
        ready.append({'id': entry['id'], 'name': entry['name'], 'scene': entry['scene'], 'src': entry['image'].removeprefix('assets/images/'), 'size': entry['imageSize'], 'groundY': entry['groundY'], 'hotspots': entry['hotspots'], 'staticBaseAudit': entry.get('staticBaseAudit'), 'season': entry.get('season'), 'battlePeriod': entry.get('battlePeriod')})
        if entry.get('layers'):
            ready[-1].update(layers=entry['layers'].removeprefix('assets/images/'), ownerAccepted=entry.get('ownerAccepted', False))
    report = {'schemaVersion': 1, 'gameExecuted': False, 'ownerAccepted': False, 'backgrounds': records}
    (HERE / 'current-review.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    (HERE / 'current-preview.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ART-12: six current locations</title><style>body{background:#252b24;color:#eee;font:16px system-ui;max-width:1300px;margin:auto;padding:20px}img{max-width:100%;height:auto;image-rendering:pixelated}figure{margin:16px 0}a{color:#b7dafa}</style><h1>ART-12: six current locations</h1><p>Offline compositions with actual unit art at 1280×720 and 1024×768. Art handoff for Claude; game, browser and live effects were not executed. Unit positioning follows the existing composition study, not a simulation of combat.</p>' + ''.join(cards), encoding='utf-8')
    handoff = {'schemaVersion': 1, 'pathBase': 'assets/images', 'integrationOwner': 'Claude', 'integrationStatus': manifest.get('integrationStatus', 'pending'), 'artStatus': manifest.get('artStatus'), 'waterAnimation': manifest.get('waterAnimation'), 'integrationConstraints': manifest.get('integrationConstraints', []), 'ownerAccepted': False, 'order': {'tenkici': [e['id'] for e in ready if e['scene'] == 'tenkici'], 'ustanak': [e['id'] for e in ready if e['scene'] == 'ustanak']}, 'backgrounds': ready}
    if len(ready) == 6:
        (HERE / 'current-backgrounds.json').write_text(json.dumps(handoff, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    seasonal_variants()
    print(f'Prepared {len(ready)}/6 backgrounds, {sum(len(record["previews"]) for record in records)} offline previews; no game or browser executed.')


if __name__ == '__main__':
    main()
