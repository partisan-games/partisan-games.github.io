"""Contact proof from the actual runtime atlases at the catalog's natural side-view scale."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
IMAGES = HERE.parents[1]
assets = {a['id'].removeprefix('advance-'): a for a in json.loads((HERE / 'sprites.json').read_text())['assets']}
heights = {'rifleman': 1.72, 'gunner': 1.72, 'backpack': 1.72, 'officer': 1.72, 'tank': 2.27, 'commander': .94}
frame = Image.new('RGBA', (720, 230), '#a3ab94')
draw = ImageDraw.Draw(frame)
draw.rectangle((0, 205, 720, 230), fill='#6c6c48')
draw.text((12, 12), 'Runtime atlas proof / 40 px per metre', fill='#20251e')

def actor(kind, x, ground, action='idle', column=0, crew_visible=True, px_per_meter=40):
    asset = assets[kind]
    w, h = asset['frame']['width'], asset['frame']['height']
    clip = next(c for c in asset['animations'] if c['name'] == action)
    image = Image.open(IMAGES / asset['image'].removeprefix('../../')).convert('RGBA')
    cel = image.crop((column*w, clip['row']*h, (column+1)*w, (clip['row']+1)*h))
    scale = px_per_meter * heights[kind] / asset['standingPixels']
    cel = cel.resize((round(w*scale), round(h*scale)), Image.Resampling.NEAREST)
    frame.alpha_composite(cel, (round(x-asset['anchor']['x']*scale), round(ground-asset['anchor']['y']*scale)))
    if kind == 'tank' and crew_visible:
        mount = asset['crewAnchor']
        actor('commander', x + (mount['x']-asset['anchor']['x'])*scale,
              ground + (mount['y']-asset['anchor']['y'])*scale, px_per_meter=px_per_meter)

actor('rifleman', 53, 205)
actor('gunner', 127, 205)
actor('backpack', 214, 205)
actor('officer', 292, 205, 'signal', 2)
actor('tank', 510, 205)
frame.save(HERE / 'preview.png')
frame.resize((1440, 460), Image.Resampling.NEAREST).save(HERE / 'preview-2x.png')


# Read the actual scene choreography with Node, without launching a browser.
import subprocess
root = HERE.parents[3]
code = """
import {soldiers, tanks, soldierAt, tankAt, cameraAt} from './scenes/bitka/Battle.js';
console.log(JSON.stringify([0,3,6,9,12,15,18].map(time => ({time, camera:cameraAt(time),
 units:[...soldiers.map(s => soldierAt(s,time)),...tanks.map(t => tankAt(t,time))].sort((a,b) => b.z-a.z)}))));
"""
shots = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', code], cwd=root))
proof = Image.new('RGBA', (480 * 2, 270 * 4), '#18201c')
for index, shot in enumerate(shots):
    frame = Image.new('RGBA', (480, 270), '#a3ab94')
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0,156,480,270),fill='#79794a')
    cx, cy, cz = shot['camera']
    for unit in shot['units']:
        distance = unit['z'] - cz
        if distance <= .32:
            continue
        scale = 310 / distance
        asset = assets[unit['kind']]
        clip = next(c for c in asset['animations'] if c['name'] == unit['pose'])
        ms = max(0,unit['poseTime'] * 1000)
        ms = ms % sum(clip['ms']) if clip['loop'] else min(ms, sum(clip['ms']))
        column = len(clip['ms']) - 1
        end = 0
        for cel, duration in enumerate(clip['ms']):
            end += duration
            if ms < end:
                column = cel
                break
        actor(unit['kind'], 240 + (unit['x'] - cx) * scale, 156 + cy * scale,
              unit['pose'], column, unit.get('crewVisible', True), scale)
    ImageDraw.Draw(frame).text((12,12), str(shot['time']) + ' s / projected runtime atlases', fill='#20251e')
    proof.alpha_composite(frame, ((index % 2)*480, (index//2)*270))
proof.save(HERE / 'formation-preview.png')
