"""Pack imagegen art into uniform PNG sprite sheets; requires Pillow."""
import hashlib
import json
import re
from pathlib import Path
from statistics import median

from PIL import Image

HERE = Path(__file__).resolve().parent
RECIPE = json.loads((HERE / 'manifest.json').read_text(encoding='utf-8'))
TITLES = {'rifleman': 'Nemački strelac', 'assault': 'Nemački jurišnik', 'opel-blitz': 'Opel Blitz', 'opel-blitz-legion': 'Opel Blitz — Legione Croata', 'hummel': 'Guseničar', 'bp42': 'Oklopni vagon BP-42', 'muzzle-flash': 'Plamen pucnja'}


def bounds(image, threshold=64):
    return image.getchannel('A').point(lambda a: 255 if a >= threshold else 0).getbbox()


def preview_gif(frames, target, durations, repeat=True):
    atlas = Image.new('RGB', (frames[0].width, frames[0].height * len(frames)))
    for index, frame in enumerate(frames):
        atlas.paste(frame.convert('RGB'), (0, index * frame.height))
    palette = atlas.quantize(colors=255)
    encoded = []
    for frame in frames:
        image = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        image.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        encoded.append(image)
    options = {'loop': 0} if repeat else {}
    encoded[0].save(target, save_all=True, append_images=encoded[1:], duration=durations, transparency=255, background=255, disposal=2, optimize=False, **options)


def appended_frames(asset, anchor):
    extra = asset['append']
    raw = Image.open(HERE / extra['source']).convert('RGBA')
    if extra.get('sourceTrimTop'):
        # The generated assault source has an isolated mark in its empty top margin.
        raw.paste((0, 0, 0, 0), (0, 0, raw.width, extra['sourceTrimTop']))
    columns, rows = extra['grid']['columns'], extra['grid']['rows']
    width, height = asset['frame']['width'], asset['frame']['height']
    assert columns == asset['grid']['columns']
    assert raw.width * rows == raw.height * columns, f"Non-square extension cells: {asset['key']}"
    frames, boxes = [], []
    for row in range(rows):
        for column in range(columns):
            cell = raw.crop((round(column * raw.width / columns), round(row * raw.height / rows), round((column + 1) * raw.width / columns), round((row + 1) * raw.height / rows)))
            cell.putalpha(cell.getchannel('A').point(lambda a: 0 if a < 64 else a))
            # Resize the complete cell at one fixed scale; never fit individual poses to their bounds.
            cell = cell.resize((width, height), Image.Resampling.NEAREST)
            box = bounds(cell)
            assert box, f"Empty extension frame: {asset['key']}:{row}:{column}"
            offset_y = anchor['y'] - box[3]
            assert box[1] + offset_y > 0, f"Extension above frame: {asset['key']}:{row}:{column}"
            frame = Image.new('RGBA', (width, height))
            frame.alpha_composite(cell, (0, offset_y))
            box = bounds(frame)
            assert box and box[0] > 0 and box[1] > 0 and box[2] < width and box[3] == anchor['y'], f"Clipped or ungrounded extension: {asset['key']}:{row}:{column} {box}"
            frames.append(frame)
            boxes.append(list(box))
    return frames, boxes


def build(asset):
    raw = Image.open(HERE / asset['source']).convert('RGBA')
    columns, rows = asset['grid']['columns'], asset['grid']['rows']
    width, height = asset['frame']['width'], asset['frame']['height']
    cells = []
    for row in range(rows):
        for column in range(columns):
            cell = raw.crop((round(column * raw.width / columns), round(row * raw.height / rows), round((column + 1) * raw.width / columns), round((row + 1) * raw.height / rows)))
            if asset['key'] == 'assault':
                # The corrected source has a faint guide at the cell edges; all figure pixels are inside this gutter.
                inner = cell.crop((12, 12, cell.width - 12, cell.height - 12))
                cell = Image.new('RGBA', cell.size)
                cell.alpha_composite(inner, (12, 12))
            # These source sheets contain alpha 1–63 noise in empty gutters; keep real sprite/stronger smoke alpha.
            cell.putalpha(cell.getchannel('A').point(lambda a: 0 if a < 64 else a))
            cells.append(cell)
    boxes = [bounds(cell) for cell in cells]
    assert all(boxes), f"Empty source frame: {asset['key']}"
    left = min(box[0] for box in boxes)
    top = min(box[1] for box in boxes)
    right = max(box[2] for box in boxes)
    bottom = max(box[3] for box in boxes)
    effect = asset['key'] == 'muzzle-flash'
    soldier = asset['key'] in ('rifleman', 'assault')
    baselines = [(bounds(cell, 224) or box)[3] for cell, box in zip(cells, boxes)]
    baseline = median(baselines)
    anchor = {'x': width // 2, 'y': height - (8 if soldier else 12)}
    if asset['key'] == 'bp42':
        anchor['y'] = height - 24  # leave room below the wheels for the dust frames
    if effect:
        anchor = {'x': 12, 'y': 24}
        scale = min(8 / (150 - left), 32 / (right - 150), 20 / (354 - top), 20 / (bottom - 354))
    else:
        above = max(base - box[1] for base, box in zip(baselines, boxes))
        below = max(box[3] - base for base, box in zip(baselines, boxes))
        scale = min((width - 16) / (right - left), (anchor['y'] - 8) / above)
        if below > 0:
            scale = min(scale, (height - anchor['y'] - 4) / below)
    sheet = Image.new('RGBA', (columns * width, rows * height))
    packed = []
    frame_bounds = []
    for index, cell in enumerate(cells):
        resized = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.Resampling.NEAREST)
        x = round(anchor['x'] - (150 if effect else (left + right) / 2) * scale)
        y = round(anchor['y'] - (354 if effect else baselines[index]) * scale)
        frame = Image.new('RGBA', (width, height))
        frame.alpha_composite(resized, (x, y))
        box = bounds(frame, 16)
        assert box and box[0] > 0 and box[1] > 0 and box[2] < width and box[3] < height, f"Clipped frame: {asset['key']}:{index} {box}"
        assert all(frame.getpixel(point)[3] == 0 for point in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)])
        packed.append(frame)
        frame_bounds.append(list(box))
        sheet.alpha_composite(frame, ((index % columns) * width, (index // columns) * height))
    names = ['fire'] if effect else ['idle', 'fire', 'death'] if soldier else ['idle', 'drive']
    durations = {'idle': 1.4, 'fire': .24 if effect else .32, 'death': .64, 'drive': .64}
    definitions = [{'name': name, 'row': row, 'frameCount': columns, 'duration': durations[name], 'loop': name in ('idle', 'drive')} for row, name in enumerate(names)]
    extra = asset.get('append')
    if extra:
        assert hashlib.sha256(sheet.tobytes()).hexdigest() == extra['basePixelsSha256'], f"Original rows changed: {asset['key']}"
        extra_frames, extra_boxes = appended_frames(asset, anchor)
        assert [clip['row'] for clip in extra['animations']] == list(range(rows, rows + extra['grid']['rows']))
        expanded = Image.new('RGBA', (columns * width, (rows + extra['grid']['rows']) * height))
        expanded.paste(sheet, (0, 0))
        for index, frame in enumerate(extra_frames):
            expanded.paste(frame, ((index % columns) * width, (rows + index // columns) * height))
        assert hashlib.sha256(expanded.crop((0, 0, columns * width, rows * height)).tobytes()).hexdigest() == extra['basePixelsSha256']
        sheet = expanded
        packed.extend(extra_frames)
        frame_bounds.extend(extra_boxes)
        rows += extra['grid']['rows']
        definitions.extend(extra['animations'])
    target = (HERE / asset['output']).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target, optimize=True)
    clips = []
    for definition in definitions:
        row, name = definition['row'], definition['name']
        assert definition['frameCount'] == columns
        clip_frames = packed[row * columns:(row + 1) * columns]
        unique = len({hashlib.sha256(frame.tobytes()).digest() for frame in clip_frames})
        assert unique > 1, f"Static animation: {asset['key']}:{name}"
        gif = f"previews/{asset['name']}-{name}.gif"
        frame_ms = round(definition['duration'] * 1000 / columns)
        preview_gif(clip_frames, HERE / gif, [frame_ms] * (columns - 1) + [1000 if name == 'death' else frame_ms], repeat=definition.get('previewLoop', True))
        clip = {key: definition[key] for key in ('name', 'row', 'frameCount', 'duration', 'loop')}
        if 'muzzle' in definition:
            muzzle = definition['muzzle']
            assert clip_frames[0].getpixel((muzzle['x'], muzzle['y']))[3] >= 64, f"Muzzle outside first frame: {asset['key']}"
            clip['muzzle'] = muzzle
        clips.append({**clip, 'preview': gif, 'distinctFrames': unique})
    return {'id': asset['key'], 'title': TITLES[asset['key']], 'image': asset['output'], 'frame': {'width': width, 'height': height, 'columns': columns, 'rows': rows}, 'anchor': anchor, 'facing': 'right' if soldier or effect or asset['key'] == 'hummel' else 'left', 'previewScale': .5 if effect else .625 if soldier else .7 if asset['key'] == 'bp42' else .75, 'animations': clips, 'frameBounds': frame_bounds, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}


(HERE / 'previews').mkdir(exist_ok=True)
assets = [build(asset) for asset in RECIPE['assets']]
metadata = {'schemaVersion': 1, 'created': '2026-11-20', 'generatedWith': 'Built-in image_gen; mechanical atlas packing with Pillow', 'integration': 'core/actor/Sprite.js uses four columns and named rows with a fixed ground anchor. Original soldier idle/fire/death rows are preserved. rest/walk loop in place; fireUp plays once and its frame 0 is the held aiming pose between shots. fireUp muzzle coordinates are local pixels in frame 0 and are also exported in spriteArt.js. Death holds its final frame. Patrol and alert gameplay integration belongs to Claude; this art preparation does not change it. Execution and owner approval are tracked in docs/PLAN-KLUZ.md.', 'assets': assets}
(HERE / 'sprites.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
runtime = {a['id']: {'src': (HERE / a['image']).resolve().relative_to(HERE.parents[2]).as_posix(), 'frame': {'width': a['frame']['width'], 'height': a['frame']['height']}, 'columns': a['frame']['columns'], 'anchor': a['anchor'], 'body': a['frameBounds'][0], 'clips': {clip['name']: {'row': clip['row'], 'seconds': clip['duration'], 'loop': clip['loop'], **({'muzzle': clip['muzzle']} if 'muzzle' in clip else {})} for clip in a['animations']}} for a in assets}
def single_quote(match):
    value = json.loads(match.group())
    return "'" + value.replace('\\', '\\\\').replace("'", "\\'") + "'"
runtime_text = re.sub(r'"(?:\\.|[^"\\])*"', single_quote, json.dumps(runtime, indent=2))
(HERE.parents[4] / 'core/actor/spriteArt.js').write_text('/** Generated from the FK-13 sprites.json; regenerate with its prepare.py. */\nexport default ' + runtime_text + '\n', encoding='utf-8')
(HERE / 'preview.html').write_text((HERE / 'preview.template.html').read_text(encoding='utf-8'), encoding='utf-8')
print(json.dumps({'atlases': len(assets), 'frames': sum(a['frame']['columns'] * a['frame']['rows'] for a in assets), 'animations': sum(len(a['animations']) for a in assets), 'checks': ['nonempty frames', 'transparent corners', 'no clipped alpha bounds', 'different animation frames']}, ensure_ascii=False))
