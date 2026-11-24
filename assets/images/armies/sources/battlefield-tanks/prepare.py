"""Cut the three original left-facing profiles and their wrecks for the shared TankSprite."""
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / 'game-ready' / 'tenkovi'
NEAREST = Image.Resampling.NEAREST
# Source coordinates in vehicles.png. Wheel disks exclude the fixed axles and suspension arms.
RECIPES = [
    dict(id='m15-42', band=(0, 550), body=(100, 79, 941, 501), gun=(135, 150, 345, 190),
         turret=(341, 79, 655, 220), axis=497, pivot=(345, 170), length=5.04, span=2.23,
         wheels=[(164, 391, 31), (873, 399, 26)], tread=(255, 486, 795, 498)),
    dict(id='stug-iii', band=(550, 1020), body=(130, 614, 996, 967), gun=(28, 685, 344, 745),
         turret=None, axis=344, pivot=(344, 715), length=5.4, span=2.95,
         wheels=[(x, 902, 34) for x in (321, 422, 523, 623, 725, 823)], tread=(258, 953, 839, 964)),
    dict(id='hotchkiss', band=(1020, 1536), body=(84, 1056, 921, 1488), gun=(235, 1136, 337, 1187),
         turret=(332, 1056, 613, 1206), axis=472, pivot=(337, 1162), length=4.22, span=1.95,
         wheels=[(155, 1385, 31), (857, 1386, 31)], tread=(228, 1474, 808, 1486)),
]


def binary(image):
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    return image


def rolling(cell, wheels, tread, phase):
    result = cell.copy()
    for x, y, radius in wheels:
        box = (x-radius, y-radius, x+radius, y+radius)
        disk = cell.crop(box)
        mask = Image.new('L', disk.size)
        ImageDraw.Draw(mask).ellipse((0, 0, disk.width-1, disk.height-1), fill=255)
        result.paste(disk.rotate(phase * 22.5, resample=NEAREST), box[:2], mask)
    strip = cell.crop(tread)
    result.paste(ImageChops.offset(strip, phase * 5, 0), tread[:2])
    return result


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pack(r, original, wrecks):
    left, top, right, bottom = r['body']
    frame = (math.ceil(r['length'] * 40), math.ceil((bottom-top) * r['length'] * 40 / (right-left)))
    w, h = frame
    hull = original.copy()
    barrel = hull.crop(r['gun'])
    hull.paste((0, 0, 0, 0), r['gun'])
    atlas = Image.new('RGBA', (w*4, h*7))
    turret = Image.new('RGBA', original.size)
    reverse = turret.copy()
    if r['turret']:
        box = r['turret']
        part = hull.crop(box)
        turret.paste(part, box[:2])
        reverse.paste(ImageOps.mirror(part), (2*r['axis']-box[2], box[1]))
        hull.paste((0, 0, 0, 0), box)
    for column in range(4):
        drive = rolling(hull, r['wheels'], r['tread'], column)
        for row, layer in enumerate([hull, drive, turret, turret, reverse, reverse]):
            atlas.paste(layer.crop(r['body']).resize(frame, NEAREST), (column*w, row*h))

    band = wrecks.crop((0, r['band'][0], original.width, r['band'][1]))
    wreck = band.crop(band.getchannel('A').getbbox())
    scale = min(w/wreck.width, h/wreck.height)
    wreck = wreck.resize((round(wreck.width*scale), round(wreck.height*scale)), NEAREST)
    atlas.paste(wreck, ((w-wreck.width)//2, h*7-wreck.height))
    sheet_path = OUT / (r['id'] + '-layers.png')
    barrel_path = OUT / (r['id'] + '-barrel.png')
    atlas.save(sheet_path)
    barrel_scale = w / (right-left)
    barrel.resize((max(1, math.ceil(barrel.width*barrel_scale)), max(1, math.ceil(barrel.height*barrel_scale))), NEAREST).save(barrel_path)
    scale = r['length'] / (right-left)
    meter = lambda value: round(value * scale, 3)
    center = (left+right)/2
    rows = ['idle', 'drive', 'turretIdle', 'turretDrive', 'rearIdle', 'rearDrive', 'dead']
    animations = [dict(name=name, row=row, frameCount=1 if name == 'dead' else 4,
                       duration=None if name == 'dead' else .64 if name.lower().endswith('drive') else 1.4,
                       loop=name != 'dead')
                  for row, name in enumerate(rows)]
    return dict(id=r['id'], image='../../game-ready/tenkovi/' + sheet_path.name,
                frame=dict(width=w, height=h, columns=4, rows=len(rows)), anchor=dict(x=w/2, y=h/2),
                baseline=h, direction=-1, columns=4, rows=rows, animations=animations,
                durationsMs=dict(idle=1400, drive=640), wreckFrame=0,
                kind=dict(size=dict(length=r['length'], height=meter(bottom-top), width=r['span']),
                          turretAxis=meter(center-r['axis']),
                          barrel=dict(ahead=meter(center-r['pivot'][0]), above=meter((top+bottom)/2-r['pivot'][1]),
                                      length=meter(r['gun'][2]-r['gun'][0]))),
                sha256={sheet_path.name:digest(sheet_path), barrel_path.name:digest(barrel_path)})


if __name__ == '__main__':
    vehicles = binary(Image.open(HERE / 'vehicles.png').convert('RGBA'))
    wrecks = binary(Image.open(HERE / 'wrecks.png').convert('RGBA'))
    metadata = dict(prompts='prompts.json', sources={f:digest(HERE/f) for f in ('vehicles.png','wrecks.png')},
                    assets=[pack(r, vehicles, wrecks) for r in RECIPES])
    (HERE / 'sprites.json').write_text(json.dumps(metadata, indent=2)+'\n', encoding='utf-8')
    profiles = {a['id']:dict(frame={k:a['frame'][k] for k in ('width', 'height')}, kind=a['kind'])
                for a in metadata['assets']}
    module = HERE.parents[4] / 'core/actor/battlefieldTankProfiles.js'
    module.write_text('// Generated by armies/sources/battlefield-tanks/prepare.py.\nexport default '
                      + json.dumps(profiles, indent=2).replace('"', "'") + '\n', encoding='utf-8')
