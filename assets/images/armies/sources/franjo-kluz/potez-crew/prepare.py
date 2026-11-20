"""Pack the redrawn Potez and its independently animated imagegen layers."""
import hashlib
import json
import math
import os
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

HERE = Path(__file__).resolve().parent
RECIPE = json.loads((HERE / 'manifest.json').read_text(encoding='utf-8'))
SIZE = (RECIPE['frame']['width'], RECIPE['frame']['height'])
OUTPUT = (HERE / RECIPE['outputDirectory']).resolve()
PREVIEWS = HERE / 'previews'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def bounds(image):
    return image.getchannel('A').point(lambda value: 255 if value >= 64 else 0).getbbox()


def source(name):
    image = Image.open(HERE / name).convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda value: value if value >= 64 else 0))
    return image


def fit(image, width, height):
    assert bounds(image), 'Empty source layer'
    image = image.crop(bounds(image))
    scale = min(width / image.width, height / image.height)
    return image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.NEAREST)


def asset(path):
    return {'image': Path(os.path.relpath(path, HERE)).as_posix(),
            'src': path.relative_to(HERE.parents[3]).as_posix(), 'sha256': digest(path)}


def save(image, name):
    path = OUTPUT / name
    image.save(path)
    return asset(path)


def atlas(frames, name, duration, clip_name):
    width, height = frames[0].size
    sheet = Image.new('RGBA', (width * len(frames), height))
    for index, frame in enumerate(frames):
        sheet.paste(frame, (index * width, 0))
    distinct = len({frame.tobytes() for frame in frames})
    assert distinct == len(frames), f'Repeated phases: {name}'
    return {**save(sheet, name), 'frame': {'width': width, 'height': height, 'columns': len(frames), 'rows': 1},
            'animations': [{'name': clip_name, 'row': 0, 'frameCount': len(frames), 'duration': duration,
                            'loop': True, 'distinctFrames': distinct}]}


def crew_frames():
    raw = source(RECIPE['crewIdleSource'])
    columns, rows = RECIPE['crewGrid']['columns'], RECIPE['crewGrid']['rows']
    packed = [Image.new('RGBA', SIZE) for _ in range(columns)]
    for figure in RECIPE['figures']:
        row = figure['row']
        cells = [raw.crop((round(column * raw.width / columns), round(row * raw.height / rows),
                           round((column + 1) * raw.width / columns), round((row + 1) * raw.height / rows)))
                 for column in range(columns)]
        boxes = [bounds(cell) for cell in cells]
        assert all(boxes), f"Missing crew frame: {figure['role']}"
        left, top, right, bottom = figure['targetBox']
        source_left, source_right = min(box[0] for box in boxes), max(box[2] for box in boxes)
        scale = min((right - left) / (source_right - source_left),
                    (bottom - top) / max(box[3] - box[1] for box in boxes))
        x = round((left + right) / 2 - (source_left + source_right) / 2 * scale)
        for index, (cell, box) in enumerate(zip(cells, boxes)):
            resized = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.Resampling.NEAREST)
            packed[index].alpha_composite(resized, (x, bottom - round(box[3] * scale)))
    descriptor = save(packed[0], 'potez-25-posada.png')
    descriptor.update(anchor={'x': 200, 'y': 86.5}, figures=RECIPE['figures'],
                      atlas=atlas(packed, 'potez-25-posada-sprites.png', RECIPE['crewDuration'], 'idle'))
    return packed, descriptor


def propeller_frames():
    recipe = RECIPE['propeller']
    size = (recipe['frame']['width'], recipe['frame']['height'])
    drawing = fit(source(recipe['source']), size[0] - 2, size[1] - 8)
    original = Image.new('RGBA', size)
    original.alpha_composite(drawing, ((size[0] - drawing.width) // 2, (size[1] - drawing.height) // 2))
    assert original.getpixel((recipe['pivot']['x'], recipe['pivot']['y']))[3] >= 64, 'Propeller pivot outside hub'
    hub = original.crop(recipe['hubBounds'])
    blades = original.copy()
    blades.paste((0, 0, 0, 0), recipe['hubBounds'])
    frames = []
    for phase in range(4):
        projection = math.cos(phase * math.pi / 4)
        height = max(1, round(size[1] * abs(projection)))
        blade = blades.transpose(Image.Transpose.FLIP_TOP_BOTTOM) if projection < 0 else blades
        blade = blade.resize((size[0], height), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', size)
        frame.alpha_composite(blade, (0, recipe['pivot']['y'] - height // 2))
        frame.paste(hub, recipe['hubBounds'])
        assert frame.crop(recipe['hubBounds']).tobytes() == hub.tobytes()
        frames.append(frame)
    descriptor = {**save(frames[0], 'potez-25-propeler.png'), 'frame': recipe['frame'],
                  'pivot': recipe['pivot'], 'mountInAirframe': recipe['mountInAirframe'],
                  'atlas': atlas(frames, 'potez-25-propeler-sprites.png', recipe['duration'], 'spin'),
                  'projection': 'Four projections about the horizontal shaft; hub fixed. Do not spin in the XY plane.'}
    return frames, descriptor


def airframes():
    recipe = RECIPE['airframes']
    left, top, right, bottom = recipe['targetBox']
    def pack(name):
        raw = source(name)
        image = Image.new('RGBA', SIZE)
        image.alpha_composite(raw.crop(bounds(raw)).resize((right - left, bottom - top), Image.Resampling.NEAREST), (left, top))
        return image
    master, candidate = pack(recipe['masterSource']), pack(recipe['ndhSource'])
    mask = Image.new('L', SIZE)
    painter = ImageDraw.Draw(mask)
    for x1, y1, x2, y2 in recipe['ndhMarkingRegions']:
        painter.rectangle((x1, y1, x2 - 1, y2 - 1), fill=255)
    ndh = Image.composite(candidate, master, ImageChops.multiply(mask, candidate.getchannel('A')))
    ndh.putalpha(master.getchannel('A'))
    outside = ImageChops.invert(mask)
    assert all(not ImageChops.multiply(channel, outside).getbbox()
               for channel in ImageChops.difference(ndh, master).split()), 'Livery changed shared body pixels'
    assert master.getchannel('A').tobytes() == ndh.getchannel('A').tobytes()
    images, descriptors = {}, {}
    for name, image in [('partisan', master), ('ndh', ndh)]:
        images[name] = image
        descriptors[name] = {**save(image, f'potez-25-{name}-bez-mitraljeza.png'),
                             'reference': RECIPE['baseImages'][name],
                             'referenceSha256': digest((HERE / RECIPE['baseImages'][name]).resolve())}
    return images, descriptors


def gun_layer():
    size = (RECIPE['gunFrame']['width'], RECIPE['gunFrame']['height'])
    image = Image.new('RGBA', size)
    drawing = fit(source(RECIPE['gunSource']), size[0] - 2, size[1] - 2)
    image.alpha_composite(drawing, ((size[0] - drawing.width) // 2, (size[1] - drawing.height) // 2))
    pivot, bore_y = RECIPE['gunPivot'], RECIPE['gunBoreY']
    assert image.getpixel((pivot['x'], pivot['y']))[3] >= 64
    muzzle = {'x': next(x for x in range(size[0]) if image.getpixel((x, bore_y))[3] >= 64), 'y': bore_y}
    return image, {**save(image, 'potez-25-zadnji-mitraljez.png'), 'frame': RECIPE['gunFrame'],
                   'pivot': pivot, 'muzzle': muzzle, 'mountInAirframe': RECIPE['gunMount'],
                   'facing': 'left', 'forwardAngleRadians': math.pi}


def composite(body, crew, propeller, gun):
    image = Image.new('RGBA', SIZE)
    image.alpha_composite(crew)
    image.alpha_composite(body)
    for layer, pivot, mount in [(propeller, RECIPE['propeller']['pivot'], RECIPE['propeller']['mountInAirframe']),
                                (gun, RECIPE['gunPivot'], RECIPE['gunMount'])]:
        image.alpha_composite(layer, (mount['x'] - pivot['x'], mount['y'] - pivot['y']))
    return image


def preview_gif(frames, path):
    strip = Image.new('RGB', (frames[0].width * len(frames), frames[0].height))
    for index, frame in enumerate(frames):
        strip.paste(frame.convert('RGB'), (index * frame.width, 0))
    palette = strip.quantize(colors=255)
    encoded = []
    for frame in frames:
        image = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        image.paste(255, mask=frame.getchannel('A').point(lambda alpha: 255 if alpha < 128 else 0))
        encoded.append(image)
    # 4.8 seconds closes both the 1.6 s breathing and 0.12 s propeller loops.
    sequence = [encoded[((step * 30 // 400) % 4) * 4 + step % 4] for step in range(160)]
    sequence[0].save(path, save_all=True, append_images=sequence[1:], duration=30, loop=0,
                     transparency=255, background=255, disposal=2, optimize=False)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(exist_ok=True)
    crew, crew_descriptor = crew_frames()
    propellers, propeller_descriptor = propeller_frames()
    bodies, body_descriptors = airframes()
    gun, gun_descriptor = gun_layer()
    for name, body in bodies.items():
        image = composite(body, crew[0], propellers[0], gun)
        image.save(PREVIEWS / f'potez-25-{name}-crew.png')
        image.resize((220, 95), Image.Resampling.NEAREST).save(PREVIEWS / f'potez-25-{name}-game-size.png')
        frames = [composite(body, person, propeller, gun).resize((220, 95), Image.Resampling.NEAREST)
                  for person in crew for propeller in propellers]
        preview_gif(frames, PREVIEWS / f'potez-25-{name}-animated.gif')
    metadata = {
        'schemaVersion': 2, 'task': 'FK-14', 'artRevision': 'Full pixel-art redraw with separate animated layers',
        'generatedWith': 'Built-in image_gen; mechanical layer/atlas packing with Pillow',
        'status': 'Integrated into Potez and both Storybook variants; see docs/KONTEKST.md#franjo-kluz.',
        'frame': RECIPE['frame'], 'facing': 'right', 'crew': crew_descriptor,
        'rearGun': gun_descriptor, 'propeller': propeller_descriptor, 'variants': body_descriptors,
        'renderOrder': RECIPE['renderOrder'], 'nationalMarkingRegions': RECIPE['airframes']['ndhMarkingRegions'],
        'sharedAirframeAlpha': True, 'sharedPixelsOutsideMarkings': True,
        'integration': 'image paths are relative to this file; src paths are relative to assets/images. '
                       'Redrawn static bodies contain no crew, rear gun or propeller blades. '
                       'Draw crew first so the airframe occludes it; propeller and rear gun go above the airframe. '
                       'Crew atlas: 400x173 cells, four columns, idle loop 1.6 seconds. '
                       'Propeller atlas: 20x128 cells, four columns, spin loop 0.12 seconds, fixed hub. '
                       'Freeze phases in pause; hold propeller frame 0 when stopped and slow cadence with engine speed. '
                       'Anchors are source pixels, scaled by plane.width/400 with owner rotation/camera. '
                       'Gun rotation equals world aim minus PI; transform muzzle-pivot for the shot/flash origin. '
                       'Both markings share geometry and moving layers. Airframe paths match the prior crew contract. '
                       'This packing script neither edits gameplay code nor runs unit/browser checks; verification evidence belongs in docs/TESTING.md.',
        'sources': {name: digest(HERE / name) for name in (RECIPE['crewIdleSource'], RECIPE['gunSource'],
                    RECIPE['airframes']['masterSource'], RECIPE['airframes']['ndhSource'],
                    RECIPE['propeller']['source'], 'manifest.json')},
    }
    (HERE / 'crew.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    sprite_assets = []
    for name, layer, anchor in [('potez-crew', crew_descriptor, crew_descriptor['anchor']),
                                 ('potez-propeller', propeller_descriptor, propeller_descriptor['pivot'])]:
        clip = layer['atlas']
        sprite_assets.append({'id': name, 'image': clip['image'], 'frame': clip['frame'],
                              'anchor': anchor, 'animations': clip['animations']})
    (HERE / 'sprites.json').write_text(json.dumps({'schemaVersion': 1, 'assets': sprite_assets}, indent=2) + '\n', encoding='utf-8')
    print('Packed two coherent airframes, four crew idle frames, four propeller phases and a separate rear gun.')


if __name__ == '__main__':
    main()
