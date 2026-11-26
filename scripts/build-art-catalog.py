"""List the armies art and the 3D models for the art catalog, art/index.html; the files stay where they are.

Run after adding/removing art or models: it writes only art/catalog.json. --check verifies it without writing.
"""
import argparse
import json
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / 'art' / 'catalog.json'
SECTIONS = [
    {'path': '2d', 'title': '2D', 'source': 'assets/images/armies', 'units': ['slika', 'slike', 'slika'],
     'extensions': {'.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg'}},
    {'path': '3d', 'title': '3D', 'source': 'assets/models', 'units': ['model', 'modela', 'modela'],
     'extensions': {'.fbx', '.glb', '.gltf', '.obj', '.dae'}},
]


def shows_something(path):
    """An FBX of motion alone, which characters load beside their model, has no mesh to show."""
    if path.suffix.lower() != '.fbx':
        return True
    data = path.read_bytes()
    return b'Geometry' in data and b'Vertices' in data


def dimensions(path):
    if path.suffix.lower() == '.svg':
        element = ElementTree.parse(path).getroot()
        box = element.get('viewBox', '').split()
        if len(box) == 4:
            return round(float(box[2])), round(float(box[3]))
        return int(element.get('width', '300').removesuffix('px')), int(element.get('height', '150').removesuffix('px'))
    with Image.open(path) as image:
        return image.size


def entry(path, models):
    """A picture as [name, width, height]; a model as [name, megabytes], with its materials when an OBJ has them."""
    if not models:
        return [path.name, *dimensions(path)]
    mtl = path.with_suffix('.mtl')
    extra = [mtl.name] if path.suffix.lower() == '.obj' and mtl.is_file() else []
    return [path.name, round(path.stat().st_size / 1e6, 1), *extra]


def folder(path, extensions, models):
    """A folder with its files to show and its subfolders; a model folder that shows nothing is left out."""
    files = sorted((p for p in path.iterdir() if p.is_file() and p.suffix.lower() in extensions and shows_something(p)),
                   key=lambda p: p.name.casefold())
    folders = [folder(p, extensions, models) for p in sorted((p for p in path.iterdir() if p.is_dir()),
                                                               key=lambda p: p.name.casefold())]
    # the armies keep their empty folders, as they always did
    folders = [f for f in folders if f['files'] or f['folders'] or not models]
    return {'name': path.name, 'files': [entry(p, models) for p in files], 'folders': folders}


def build():
    sections = []
    for section in SECTIONS:
        models = section['path'] == '3d'
        tree = folder(ROOT / section['source'], section['extensions'], models)
        sections.append({**{k: section[k] for k in ('path', 'title', 'source', 'units')},
                         'files': tree['files'], 'folders': tree['folders']})
    return dump({'sections': sections}) + '\n'


def dump(value, depth=0):
    """JSON with a file a line, so adding a file changes one line; a file's own list stays on that line."""
    compact = lambda item: json.dumps(item, ensure_ascii=False, separators=(',', ':'))
    if not isinstance(value, (dict, list)) or (isinstance(value, list) and all(not isinstance(i, (dict, list)) for i in value)):
        return compact(value)
    pad, inner = ' ' * depth, ' ' * (depth + 1)
    if isinstance(value, dict):
        rows = [f'{inner}{compact(k)}: {dump(v, depth + 1)}' for k, v in value.items()]
        return '{\n' + ',\n'.join(rows) + f'\n{pad}}}'
    if not value:
        return '[]'
    return '[\n' + ',\n'.join(inner + dump(v, depth + 1) for v in value) + f'\n{pad}]'


def count(tree):
    return len(tree['files']) + sum(count(f) for f in tree['folders'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = build()
    if args.check:
        assert CATALOG.is_file() and CATALOG.read_text(encoding='utf-8') == content, 'Regenerate art/catalog.json'
    else:
        CATALOG.write_text(content, encoding='utf-8')
    totals = ', '.join(f"{count(s)} {s['units'][2]}" for s in json.loads(content)['sections'])
    print(f'{"Checked" if args.check else "Wrote"} {CATALOG.relative_to(ROOT).as_posix()}: {totals}.')


if __name__ == '__main__':
    main()
