"""Keep the three accepted idle pictures and append generated, stationary locomotion clips."""
import hashlib
import json
import runpy
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
IMAGES = ROOT / 'assets/images'

def figures(image):
    """Measure the three separate silhouettes, ignoring isolated low-area alpha artifacts."""
    alpha, seen, groups = image.getchannel('A'), set(), []
    for y in range(image.height):
        for x in range(image.width):
            if (x, y) in seen or alpha.getpixel((x, y)) < 128:
                continue
            pending, points = [(x, y)], []
            seen.add((x, y))
            while pending:
                px, py = pending.pop()
                points.append((px, py))
                for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
                    point = px + dx, py + dy
                    if (0 <= point[0] < image.width and 0 <= point[1] < image.height
                            and point not in seen and alpha.getpixel(point) >= 128):
                        seen.add(point)
                        pending.append(point)
            if len(points) >= 100:
                groups.append((min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points)+1, max(p[1] for p in points)+1))
    assert len(groups) == 3, groups
    return sorted(groups, key=lambda b: b[1])

def main():
    assets, runtime = [], {}
    helpers = runpy.run_path(str(HERE.parent / 'tenkovi/prepare.py'))
    contact = Image.new('RGBA', (650, 300), '#58614a')
    pen = ImageDraw.Draw(contact)
    previews = HERE / 'previews'
    previews.mkdir(exist_ok=True)
    for index, (key, src, move, duration) in enumerate([
        ('wounded', 'armies/ranjeni-partizan.png', 'crawl', 1.2),
        ('german-patrol', 'armies/nemci-patrola.gif', 'walk', .8),
        ('italian-patrol', 'armies/talijani-patrola.gif', 'walk', .8),
    ]):
        suffix = '-repaired-generated.png' if key == 'german-patrol' else '-transparent-generated.png' if key == 'italian-patrol' else '-generated.png'
        source = HERE / (key + suffix)
        if not source.exists():
            continue
        original = Image.open(IMAGES / src).convert('RGBA')
        raw = Image.open(source).convert('RGBA')
        cells, boxes = [], []
        for col in range(4):
            cell = raw.crop((round(col*raw.width/4), 0, round((col+1)*raw.width/4), raw.height))
            cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
            cells.append(cell)
            boxes.append(cell.getbbox())
        union = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        width, height = original.size
        sheet = Image.new('RGBA', (width*4, height*2))
        frames = []
        generated_frames = [cell.crop(union).resize(original.size, Image.Resampling.NEAREST) for cell in cells]
        motion_regions = []
        if key.endswith('patrol'):
            original_figures = figures(original)
            measured = [figures(frame) for frame in generated_frames]
            for actor, target in enumerate(original_figures):
                boxes = [frame[actor] for frame in measured]
                source_box = [min(b[0] for b in boxes), max(b[3] for b in boxes)-6, max(b[2] for b in boxes), max(b[3] for b in boxes)]
                target_box = [target[0], target[3]-6, target[2], target[3]]
                motion_regions.append({'source': source_box, 'target': target_box})
        for col, generated in enumerate(generated_frames):
            frame = generated
            # Keep the exact accepted heads, rifles and formation; register generated steps to each man's feet.
            # A fixed source rectangle and scale per soldier is shared by all four phases, never refit per pose.
            if motion_regions:
                frame = original.copy()
                for region in motion_regions:
                    box = region['target']
                    feet = generated.crop(region['source']).resize((box[2]-box[0], box[3]-box[1]), Image.Resampling.NEAREST)
                    frame.paste(feet, box[:2])
                assert all(frame.getpixel((x, y)) == original.getpixel((x, y))
                    for y in range(height) for x in range(width)
                    if not any(r['target'][0] <= x < r['target'][2] and r['target'][1] <= y < r['target'][3] for r in motion_regions))
            sheet.paste(original, (col*width, 0))
            sheet.paste(frame, (col*width, height))
            frames.append(frame)
        target = IMAGES / 'armies/game-ready/vojnici' / (key + '-sprites.png')
        sheet.save(target)
        assert sheet.crop((0, 0, width, height)).tobytes() == original.tobytes()
        assert len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}) == 4
        for region in motion_regions:
            region['distinctPhases'] = len({hashlib.sha256(frame.crop(region['target']).tobytes()).hexdigest() for frame in frames})
            assert region['distinctPhases'] >= 2, (key, region)
        helpers['save_gif'](frames, previews / (key + '-' + move + '.gif'), round(duration*250))
        pen.text((4, index*100+2), key + ': accepted idle / 4 motion poses', fill='white')
        contact.alpha_composite(original, (4, index*100+18))
        for col, frame in enumerate(frames):
            contact.alpha_composite(frame, (100+col*110, index*100+18))
        descriptor = {'src': 'armies/game-ready/vojnici/' + target.name, 'frame': {'width': width, 'height': height},
            'columns': 4, 'movement': move, 'seconds': duration}
        runtime[key] = descriptor
        assets.append({'id': key, 'image': '../../game-ready/vojnici/' + target.name,
            'frame': {'width': width, 'height': height, 'columns': 4, 'rows': 2},
            'anchor': {'x': width/2, 'y': height/2}, 'view': 'top-down', 'groupSize': 1 if key == 'wounded' else 3,
            'source': source.name, 'reference': '../../../' + src, 'fixedSourceCrop': list(union),
            'acceptedIdlePixelsUnchanged': True, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            'generatedMotionRegions': motion_regions, 'acceptedPixelsOutsideMotionRegionsUnchanged': bool(motion_regions),
            'animations': [{'name': 'idle', 'row': 0, 'frameCount': 1, 'duration': 1.4, 'loop': True},
                {'name': move, 'row': 1, 'frameCount': 4, 'duration': duration, 'loop': True}]})
    (HERE / 'sprites.json').write_text(json.dumps({'schemaVersion': 1, 'assets': assets}, indent=2)+'\n', encoding='utf-8')
    (ROOT / 'core/actor/ranjenikArt.js').write_text('// Generated by assets/images/armies/sources/ranjenik/prepare.py.\nexport default '+json.dumps(runtime, indent=2)+'\n', encoding='utf-8')
    contact.convert('RGB').save(previews / 'ranjenik-game-size.png')
    cards = ''.join('<figure><img src="previews/' + key + '-' + art['movement'] + '.gif"><figcaption>' + key + '</figcaption></figure>' for key, art in runtime.items())
    (HERE / 'preview.html').write_text('<!doctype html><html lang="sr"><meta charset="utf-8"><title>Ranjenik — pokreti</title><style>body{background:#58614a;color:white;font:16px sans-serif}figure{display:inline-block}img{image-rendering:pixelated}</style><h1>Ranjenik — puzanje i patrole</h1>' + cards + '<p>Mirne poze su sačuvani originali. Kretanje po ekranu daje igra; kod koristi isti atlas u postojećem Storybook-u.</p></html>', encoding='utf-8')
    print(f'Packed {len(assets)}/3 Ranjenik actors: accepted idle pixels unchanged, four distinct locomotion poses each.')

if __name__ == '__main__':
    main()
