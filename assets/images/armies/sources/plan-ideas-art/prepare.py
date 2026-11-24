"""Pack image_gen sources with fixed transforms; leave accepted art and runtime untouched.

Run again after generating missing sources. --check verifies the handoff without writes.
"""
import argparse
import hashlib
import json
import math
import statistics
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
OUT = ROOT / 'assets/images/armies/game-ready'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def clean(im):
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    return im


def bounds_union(boxes):
    return (min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes))


def clip(name, row, seconds, loop=True, **extra):
    return dict(name=name, row=row, frameCount=4, duration=seconds, loop=loop, **extra)


def layout(job):
    kind = job['kind']
    if kind == 'vessel':
        return 2, 2, 'brodovi', []
    if kind == 'damage':
        return 1, 1, ('brodovi' if any(t in job['id'] for t in ['boat', 's30', 'launch', 'skiff', 'patrol-vessel'])
                      else 'avioni' if job['id'].startswith(('bf109', 'ju87'))
                      else 'artiljerija' if job['id'].startswith(('flak', 'field-gun', 'pak', 'bunker', 'house', 'shore'))
                      else 'vozovi' if job['id'].startswith('bp42') else 'kamioni' if job['id'].startswith('opel') else 'tenkovi'), []
    if kind == 'mine':
        return 4, 1, 'brodovi', [clip('float', 0, 2.4)]
    if kind == 'crew':
        return 4, 1, 'vojnici', [clip('idle', 0, 1.6)]
    if kind == 'hit':
        return 4, 1, 'artiljerija' if 'crew' in job['id'] else 'vojnici', [clip('hit', 0, .32, False)]
    if kind == 'infantry':
        clips = [clip('idle', 0, 1.6), clip('run', 1, .56), clip('attack', 2, .4, False),
                 clip('hit', 3, .32, False), clip('dead', 4, .8, False), clip('work', 5, 1.6)]
        if job['id'] == 'partisan-loader':
            clips = [c for c in clips if c['name'] != 'attack']
        return 4, 6, 'vojnici', clips
    if kind == 'aircraft':
        clips = [clip('idle', 0, 1.6), clip('attack', 1, .8, False), clip('damaged', 2, 1.6),
                 clip('dead', 3, .8, False), clip('propeller', 4, .12)]
        if job['id'] == 'storch':
            clips = [c for c in clips if c['name'] != 'attack']
        return 4, 5, 'avioni', clips
    return 4, 6, 'vozila', [clip('idle', 0, 1.6), clip('drive', 1, .64),
                          clip('attack', 2, .4, False), clip('damaged', 3, .64),
                          clip('dead', 4, 1.6), clip('gun', 5, .4, False)]


def pack(job):
    source = HERE / (job['id'] + '-generated.png')
    if not source.exists():
        return None
    im = clean(Image.open(source))
    if job.get('sourceParts'):
        parts = [clean(Image.open(HERE/name)) for name in job['sourceParts']]
        assert len({part.width for part in parts}) == 1
        im = Image.new('RGBA',(parts[0].width,sum(part.height for part in parts)))
        y = 0
        for part in parts:
            im.paste(part,(0,y))
            y += part.height
    cols, rows, category, clips = layout(job)
    cols = job.get('sourceColumns', cols)
    rows = job.get('sourceRows', rows)
    for animation in clips:
        animation['frameCount'] = cols
    cells = []
    source_boxes = []
    for row in range(rows):
        for col in range(cols):
            edges = job.get('sourceRowEdges')
            box = [round(col*im.width/cols), edges[row] if edges else round(row*im.height/rows),
                   round((col+1)*im.width/cols), edges[row+1] if edges else round((row+1)*im.height/rows)]
            if job['id'] == 'partisan-loader' and row == 4:
                if col == 2:
                    box[2] = 736
                if col == 3:
                    box[0] = 736
            cells.append(im.crop(box))
            source_boxes.append(box)
    if job['id'] == 'partisan-runner':
        # A separate generated fall replaces the two overlapping source cells.
        cells[16:20] = [Image.new('RGBA', cells[0].size) for _ in range(4)]
    if job['kind'] == 'infantry' and job['id'] != 'partisan-loader':
        cells = cells[:20]
        rows = 5
        clips = [c for c in clips if c['name'] != 'work']
    if job['kind'] == 'aircraft':
        cells = cells[:cols*4]
        rows = 4
        clips = [c for c in clips if c['name'] != 'propeller']
        # The game rotates a static wreck; it must not rotate a pre-rotated drawing twice.
        cells[cols*3+1:cols*4] = [cells[cols*3].copy() for _ in range(cols-1)]
        for c in clips:
            if c['name'] == 'dead':
                c['frameCount'] = 1
        if job['id'] == 'he111' and cols == 4:
            cells[10:12] = [cells[8].copy(), cells[9].copy()]
    if job.get('holdWreck'):
        for animation in clips:
            if animation['name'] == 'dead':
                animation.update(frameCount=1, loop=False)
    maxw = max(c.width for c in cells)
    maxh = max(c.height for c in cells)
    common = []
    for cell in cells:
        normalized = Image.new('RGBA', (maxw, maxh))
        normalized.paste(cell, (0, 0))
        common.append(normalized)
    registrations = []
    if job['kind'] in ['infantry', 'vehicle', 'aircraft']:
        def row_anchor(rowcells):
            bb = [c.getbbox() for c in rowcells if c.getbbox()]
            if not bb:
                return None
            return statistics.median((b[1]+b[3])/2 if job['kind'] == 'aircraft' else b[3] for b in bb)
        target = row_anchor(common[:cols])
        for row in range(rows):
            # Detached gun art has its own attachment, rather than a ground anchor.
            if job['kind'] == 'vehicle' and row == 5:
                continue
            value = row_anchor(common[row*cols:(row+1)*cols])
            shift = round(target-value) if value is not None else 0
            registrations.append(dict(row=row, y=shift))
            if shift:
                for i in range(row*cols, (row+1)*cols):
                    moved = Image.new('RGBA', (maxw, maxh+abs(shift)))
                    moved.paste(common[i], (0, max(0, shift)))
                    if shift < 0:
                        moved = moved.crop((0, -shift, maxw, maxh+abs(shift)))
                    common[i] = moved
        maxh = max(c.height for c in common)
    boxes = [c.getbbox() for c in common]
    nonempty = [b for b in boxes if b]
    assert nonempty, job['id']
    union = bounds_union(nonempty)
    kind = job['kind']
    reference = HERE / (job['id'] + '-reference.png')
    if kind == 'damage':
        frame = list(Image.open(reference).size)
        factor = 1 if job.get('registeredDamage') else min((frame[0]-8)/(union[2]-union[0]), (frame[1]-8)/(union[3]-union[1]))
        if job.get('damageBodyBox'):
            left, top, right, bottom = job['damageBodyBox']
            factor = min((right-left)/(union[2]-union[0]), (bottom-top)/(union[3]-union[1]))
    elif kind == 'hit':
        ref = clean(Image.open(reference))
        rw, rh = ref.size
        rb = ref.getbbox()
        first = boxes[0]
        factor = (rb[3]-rb[1])/(first[3]-first[1])
        frame = [math.ceil(max(rw, (union[2]-union[0])*factor))+8,
                 math.ceil(max(rh, (union[3]-union[1])*factor))+8]
    elif kind == 'vessel':
        length = round(job['metres']*job.get('pixelsPerMetre',25))
        factor = length/(union[2]-union[0])
        frame = [length+8, math.ceil((union[3]-union[1])*factor)+8]
    elif kind == 'mine':
        factor = 30/max(union[2]-union[0], union[3]-union[1])
        frame = [38, 38]
    elif kind == 'crew':
        factor = 26/max(union[2]-union[0], union[3]-union[1])
        frame = [34, 34]
    elif kind == 'infantry':
        frame = [160, 144]
        idle_box = bounds_union([b for b in boxes[:cols] if b])
        factor = min(82/(idle_box[3]-idle_box[1]), 152/(union[2]-union[0]), 136/(union[3]-union[1]))
    else:
        lengths = {'he111': 16.5, 'storch': 7.2, 'motorcycle': 3.56, 'sdkfz251': 5.8, 'sdkfz222': 4.8}
        pixels = job.get('pixelsPerMetre', 30.8 if kind == 'aircraft' else 20)
        length = round(lengths[job['id']]*pixels)
        body_boxes = [b for b in boxes[:cols*3] if b]
        body = bounds_union(body_boxes)
        factor = length/(body[2]-body[0])
        if job.get('nativeMinimumSize'):
            first = boxes[0]
            minimum = job['nativeMinimumSize']
            factor = max(factor,(minimum[0]+2)/(first[2]-first[0]),(minimum[1]+2)/(first[3]-first[1]))
            assert factor <= 1, (job['id'],'native source too small')
        frame = [math.ceil((union[2]-union[0])*factor)+12, math.ceil((union[3]-union[1])*factor)+12]
    offset = [round((frame[0]-(union[2]-union[0])*factor)/2 - union[0]*factor),
              round(frame[1]-4-union[3]*factor)]
    if job.get('registeredDamage'):
        offset = [0, 0]
    if job.get('damageBodyBox'):
        left, top, right, bottom = job['damageBodyBox']
        offset = [round((left+right)/2 - (union[0]+union[2])/2*factor), round(bottom-union[3]*factor)]
    outcells = []
    atlas = Image.new('RGBA', (frame[0]*cols, frame[1]*rows))
    warnings = []
    for index, cell in enumerate(common):
        cell = cell.resize((max(1, round(cell.width*factor)), max(1, round(cell.height*factor))), Image.Resampling.NEAREST)
        packed = Image.new('RGBA', tuple(frame))
        packed.paste(cell, tuple(offset))
        if job.get('gunLayer') and index // cols == 5:
            attachment = job['gunLayer']
            scale = attachment['scale']
            anchor = attachment['anchor']
            reduced = packed.resize((round(frame[0]*scale), round(frame[1]*scale)), Image.Resampling.NEAREST)
            packed = Image.new('RGBA', tuple(frame))
            packed.paste(reduced, (round(anchor[0]*(1-scale)), round(anchor[1]*(1-scale))))
        outcells.append(packed)
        atlas.paste(packed, ((index % cols)*frame[0], (index//cols)*frame[1]))
        b = packed.getbbox()
        if b and (b[0] == 0 or b[1] == 0 or b[2] == frame[0] or b[3] == frame[1]):
            warnings.append(f'Frame {index}: nontransparent boundary')
        sb = boxes[index]
        if sb and (sb[0] == 0 or sb[1] == 0 or sb[2] == maxw or sb[3] == maxh):
            warnings.append(f'Source frame {index}: touches cell boundary; inspect for clipping')
    supplements = []
    if job.get('sourceParts'):
        supplements = [dict(source=name,sha256=sha(HERE/name)) for name in job['sourceParts'][1:]]
    if job['id'] == 'partisan-runner':
        fall_path = HERE/'partisan-runner-death-generated.png'
        if fall_path.exists():
            fall = clean(Image.open(fall_path))
            fall_cells = [fall.crop((round(i*fall.width/4),0,round((i+1)*fall.width/4),fall.height)) for i in range(4)]
            first = fall_cells[0].getbbox()
            fall_scale = 82/(first[3]-first[1])
            fall_offset = [round(frame[0]/2-(first[0]+first[2])/2*fall_scale),
                           round(frame[1]-6-first[3]*fall_scale)]
            for i, cell in enumerate(fall_cells):
                packed = Image.new('RGBA', tuple(frame))
                scaled = cell.resize((round(cell.width*fall_scale),round(cell.height*fall_scale)), Image.Resampling.NEAREST)
                packed.paste(scaled, tuple(fall_offset))
                outcells[16+i] = packed
                atlas.paste(packed, (i*frame[0],4*frame[1]))
            supplements.append(dict(source=fall_path.name,sha256=sha(fall_path),
                                    row=4,scale=fall_scale,offset=fall_offset))
    dest = OUT / category
    dest.mkdir(parents=True, exist_ok=True)
    path = dest / (job['id'] + ('-sprites.png' if cols*rows > 1 else '.png'))
    atlas.save(path, optimize=True)
    if kind == 'vessel':
        states = ['intact', 'damaged', 'heavy', 'wreck']
        clips = [dict(name=n, row=i//cols, frameColumns=[i%cols], frameCount=1, duration=1.6, loop=True) for i,n in enumerate(states)]
        for name, cell in zip(states, outcells):
            cell.save(dest / (job['id'] + ('' if name == 'intact' else '-'+name) + '.png'), optimize=True)
    if not clips:
        clips = [dict(name='damaged', row=0, frameCount=1, duration=1.6, loop=True)]
    for c in clips:
        start = c['row']*cols+c.get('frameColumns', [0])[0]
        hashes = {hashlib.sha256(f.tobytes()).hexdigest() for f in outcells[start:start+c['frameCount']]}
        c['distinctFrames'] = len(hashes)
        if c['name'] in ['run', 'drive', 'hit', 'dead', 'propeller'] and c['frameCount'] > 1 and len(hashes) < 2:
            warnings.append('No distinct motion: '+c['name'])
    result = dict(id=job['id'], title=job['title'], kind=kind, integrated=True,
                image=path.relative_to(ROOT).as_posix(), sha256=sha(path),
                frame=dict(width=frame[0], height=frame[1], columns=cols, rows=rows),
                anchor=dict(x=frame[0]/2, y=frame[1]/2 if kind in ['vessel', 'mine', 'aircraft', 'damage'] else frame[1]-4),
                source=source.name, sourceSha256=sha(source), sourceSize=list(im.size),
                sourceCells=source_boxes, transform=dict(scale=factor, offset=offset),
                animations=clips, warnings=warnings, rowRegistration=registrations, supplements=supplements,
                reference=reference.name if reference.exists() else None)
    result['view'] = ('top-down' if kind in ['vessel','mine','crew'] or any(x in job['id'] for x in ['boat','s30','launch','skiff','patrol-vessel','shore-mg'])
                      else 'rear-three-quarter' if job['id']=='partisan-rear' else 'front' if job['id']=='occupier-hit' else 'side')
    result['facing'] = -1 if job['id'] in ['he111','storch','sdkfz251','sdkfz222'] else 1
    result['generation'] = 'generation.json'
    if 'renderOffset' in job:
        result['renderOffset'] = job['renderOffset']
    if job.get('sourceMuzzlePoint'):
        result['muzzlePoint'] = [round(offset[i] + job['sourceMuzzlePoint'][i] * factor) for i in range(2)]
    if job.get('muzzlePoint'):
        result['muzzlePoint'] = job['muzzlePoint']
    if job.get('gunLayer'):
        attachment = job['gunLayer']
        result['layers'] = [dict(name='turret', image=result['image'], row=5, frames=4, seconds=.4,
                                 anchor=attachment['anchor'], mount=attachment['mount'], hideOn=['dead'])]
        result['muzzlePoint'] = attachment['muzzlePoint']
        result['gunPreparation'] = attachment
    if result['view'] == 'top-down':
        result['anchor']['y'] = frame[1]/2
    if kind in ['vessel','mine']:
        result['pixelsPerMetre'] = job.get('pixelsPerMetre',25)
        result['designLengthMetres'] = job.get('metres',1.2)
        result['historicalClassIdentificationConfirmed'] = False
    if kind == 'vessel':
        result['crew'] = dict(image='assets/images/armies/game-ready/vojnici/deck-crew-sprites.png',
                              frame=[34,34],frames=4,seconds=1.6,hideOn=['wreck'],
                              positions=[[round(frame[0]*x),round(frame[1]*y)] for x,y in [(0.27,0.45),(0.43,0.6),(0.65,0.4)]])
    if kind == 'aircraft':
        hub = job.get('sourceHub', [25,153] if job['id']=='he111' else [16,117])
        result['layers'] = [dict(name='propeller',image='assets/images/armies/game-ready/avioni/propeller-side-sprites.png',
                                 frame=[12,48],frames=4,seconds=.12,
                                 mount=[round(offset[0]+hub[0]*factor),round(offset[1]+hub[1]*factor)],
                                 anchor=[6,24],hideOn=['dead'],reused=True)]
    if job['id']=='sdkfz222' and not job.get('gunLayer'):
        result['layers'] = [dict(name='turret',image=result['image'],row=5,frames=4,seconds=.4,
                                 anchor=[round(offset[0]+220*factor),round(offset[1]+90*factor)],
                                 mount=[round(offset[0]+205*factor),round(offset[1]+35*factor)],hideOn=['dead'])]
    if kind == 'infantry' and job['id']!='partisan-loader':
        b = outcells[8].getbbox()
        x = b[2]-1
        ys = [y for y in range(b[1],b[3]) if outcells[8].getpixel((x,y))[3]]
        result['muzzle'] = dict(animation='attack',frame=0,point=[x,round(statistics.median(ys))],eventTime=0)
    result['repositoryImage'] = result['image']
    if job.get('fitAttachments'):
        layer = result['layers'][0]
        hull = outcells[0].getbbox()
        gun = outcells[layer['row']*cols].getbbox()
        dx, dy = [layer['mount'][i]-layer['anchor'][i] for i in range(2)]
        result['renderBounds'] = list(bounds_union([hull, (gun[0]+dx, gun[1]+dy, gun[2]+dx, gun[3]+dy)]))
    result['image'] = '../../game-ready/'+category+'/'+path.name
    result['style'] = job.get('style','reference-pixel-art')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--only', help='Repack one actor, preserving all other prepared assets')
    args = parser.parse_args()
    if args.check:
        manifest = read(HERE/'sprites.json')
        provenance = {entry['source']: entry for entry in read(HERE/'generation.json')['entries']}
        for asset in manifest['assets']:
            image = ROOT / asset['repositoryImage']
            assert sha(image) == asset['sha256'], image
            assert sha(HERE/asset['source']) == asset['sourceSha256'], asset['source']
            im = Image.open(image)
            f = asset['frame']
            assert im.size == (f['width']*f['columns'], f['height']*f['rows'])
            assert im.mode == 'RGBA' and im.getchannel('A').getextrema() == (0,255)
            assert not asset['warnings'], asset['id']
            assert (HERE/asset['generation']).is_file(), asset['generation']
            assert provenance[asset['source']]['prompt'], asset['id']
            for supplement in asset['supplements']:
                assert sha(HERE/supplement['source']) == supplement['sha256']
                assert provenance[supplement['source']]['prompt'], supplement['source']
        print(f"Verified {len(manifest['assets'])} prepared packages; not a runtime or browser check.")
        return
    jobs = read(HERE/'jobs.json')['jobs']
    if not any(job['id']=='rboot' for job in jobs):
        jobs.insert(0, dict(id='rboot', title='R-boot minolovac', kind='vessel', metres=35))
    jobs.append(dict(id='deck-crew',title='Posada plovila odozgo',kind='crew'))
    if args.only:
        job = next(j for j in jobs if j['id'] == args.only)
        asset = pack(job)
        assert asset, args.only
        manifest = read(HERE/'sprites.json')
        manifest['assets'] = [asset if item['id'] == args.only else item for item in manifest['assets']]
        if not any(item['id'] == args.only for item in manifest['assets']):
            manifest['assets'].append(asset)
        manifest['missing'] = [name for name in manifest['missing'] if name != args.only]
        (HERE/'sprites.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        print(f"Prepared {args.only}; {len(asset['warnings'])} review warnings.")
        return
    assets = [asset for j in jobs if (asset := pack(j))]
    manifest = dict(tool='built-in image_gen', integrated=True, assets=assets,
                    missing=[j['id'] for j in jobs if not (HERE/(j['id']+'-generated.png')).exists()])
    (HERE/'sprites.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f"Prepared {len(assets)}/{len(jobs)} packages; {sum(bool(a['warnings']) for a in assets)} with review warnings.")


if __name__ == '__main__':
    main()
