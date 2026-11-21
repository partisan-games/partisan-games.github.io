"""Pack independent, static scenery props; reuse existing wrecks without copying their art."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OUTPUT = HERE.parents[1] / 'game-ready/scenery'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_json(path, value):
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def main():
    generation = json.loads((HERE / 'generation.json').read_text(encoding='utf-8'))
    source = HERE / generation['image']
    assert digest(source) == generation['sourceSha256']
    raw = Image.open(source).convert('RGBA')
    assert raw.getchannel('A').getextrema() == (0, 255)
    OUTPUT.mkdir(exist_ok=True)
    cells = []
    for row in range(4):
        for column in range(3):
            bounds = tuple(round(value) for value in (
                column * raw.width / 3, row * raw.height / 4,
                (column + 1) * raw.width / 3, (row + 1) * raw.height / 4,
            ))
            cell = raw.crop(bounds)
            cell.putalpha(cell.getchannel('A').point(lambda a: 0 if a < 64 else a))
            box = cell.getbbox()
            assert box and box[0] > 0 and box[1] > 0 and box[2] < cell.width and box[3] < cell.height
            cells.append((cell.crop(box), bounds))
    body_scale = min(120 / max(cell.width for cell, _ in cells[:9]),
                     52 / max(cell.height for cell, _ in cells[:9]))
    assets, catalog = [], {}
    factions = ('partisan', 'german', 'italian')
    poses = ('prone', 'supine', 'side')
    for index, (cell, bounds) in enumerate(cells):
        blood = index >= 9
        kind = 'blood' if blood else 'fallen'
        faction = None if blood else factions[index // 3]
        pose = ('patch', 'smear', 'pool')[index - 9] if blood else poses[index % 3]
        name = f'blood-{pose}' if blood else f'{faction}-fallen-{pose}'
        width, height, baseline = (96, 48, 40) if blood else (128, 64, 56)
        scale = min(84 / cell.width, 28 / cell.height) if blood else body_scale
        packed = Image.new('RGBA', (width, height))
        size = (max(1, round(cell.width * scale)), max(1, round(cell.height * scale)))
        packed.alpha_composite(cell.resize(size, Image.Resampling.NEAREST), (round((width - size[0]) / 2), baseline - size[1]))
        target = OUTPUT / f'{name}.png'
        packed.save(target, optimize=True)
        anchor = {'x': width / 2, 'y': baseline}
        assets.append({
            'id': name, 'image': target.relative_to(HERE.parents[1]).as_posix(),
            'frame': {'width': width, 'height': height, 'columns': 1, 'rows': 1},
            'anchor': anchor, 'baseline': baseline, 'source': source.name, 'sourceBounds': list(bounds),
            'sha256': digest(target),
            'animations': [{'name': 'still', 'row': 0, 'frameCount': 1, 'duration': 1, 'loop': False}],
        })
        # Sprite metadata paths are relative to this recipe, while runtime paths start at assets/images.
        assets[-1]['image'] = '../../' + assets[-1]['image']
        catalog[name] = {'src': target.relative_to(ROOT / 'assets/images').as_posix(),
                         'width': width, 'height': height, 'anchor': anchor, 'kind': kind,
                         'faction': faction, 'layer': 0 if blood else 1}
    wreck_metadata = json.loads((HERE.parent / 'wrecks/sprites.json').read_text(encoding='utf-8'))
    for wreck in wreck_metadata['assets']:
        path = (HERE.parent / 'wrecks' / wreck['image']).resolve()
        assert path.is_relative_to(ROOT) and path.is_file()
        assert digest(path) == wreck['sha256'], wreck['id']
        with Image.open(path) as image:
            assert list(image.size) == [wreck['frame']['width'], wreck['frame']['height']]
            assert image.convert('RGBA').getchannel('A').getextrema()[0] == 0
        catalog[wreck['id']] = {'src': path.relative_to(ROOT / 'assets/images').as_posix(),
                                'width': wreck['frame']['width'], 'height': wreck['frame']['height'],
                                'anchor': wreck['anchor'], 'kind': 'wreck', 'faction': None, 'layer': 1}
    for record in catalog.values():
        assert 0 <= record['anchor']['x'] <= record['width']
        assert 0 <= record['anchor']['y'] <= record['height']
    save_json(HERE / 'sprites.json', {'schemaVersion': 1, 'assets': assets})
    save_json(HERE / 'catalog.json', {'schemaVersion': 1, 'pathBase': 'assets/images', 'props': catalog})
    preview = Image.new('RGB', (480, 360), '#333a30')
    draw = ImageDraw.Draw(preview)
    for index, asset in enumerate(assets):
        left, top = index % 3 * 160, index // 3 * 90
        with Image.open((HERE / asset['image']).resolve()) as image:
            preview.paste(image, (left + (160 - image.width) // 2, top + 4), image)
        draw.text((left + 4, top + 72), asset['id'], fill='#e0e4d7')
    preview.save(HERE / 'game-size.png', optimize=True)
    runtime = '// Generated by assets/images/armies/sources/scenery/prepare.py.\nexport default '
    (ROOT / 'core/sceneryArt.js').write_bytes((runtime + json.dumps(catalog, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    print(f'Prepared {len(assets)} independent sprites; catalog reuses {len(catalog) - len(assets)} existing wrecks.')


if __name__ == '__main__':
    main()
