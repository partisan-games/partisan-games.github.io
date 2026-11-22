"""Fixed-scale registration of generated fall poses against the three accepted idle figures."""
from pathlib import Path
import hashlib
from PIL import Image

HERE = Path(__file__).resolve().parent
READY = HERE.parents[1] / 'game-ready/vojnici'
TIMES = [120, 150, 190, 340]
PATROL_BOXES = [(152, 164, 404, 491), (622, 169, 868, 517), (1087, 173, 1421, 567), (1614, 190, 2033, 566)]
# Paired swatches from the same two original uniform and rifle drawings.
GERMAN = [(0, 0, 0), (66, 74, 49), (129, 143, 84), (247, 222, 181), (84, 78, 66), (148, 156, 140)]
ITALIAN = [(0, 0, 0), (110, 92, 69), (220, 204, 146), (246, 220, 179), (101, 83, 57), (146, 154, 138)]


def resized(image, factor):
    return image.resize(tuple(max(1, round(n * factor)) for n in image.size), Image.Resampling.NEAREST)


def patrol_frames(source, original, cells, italian):
    frames = []
    pad = 16
    for phase, box in enumerate(PATROL_BOXES):
        frame = Image.new('RGBA', (original.width + 2*pad, original.height + 2*pad))
        if phase == 0:
            frame.paste(original, (pad, pad))
        else:
            for left, top, right, bottom in cells:
                # The upright reference includes a full rifle. Match it once, then keep that scale through the fall.
                factor = (right - left) / (PATROL_BOXES[0][2] - PATROL_BOXES[0][0])
                pose = resized(source.crop(box), factor)
                for y in range(pose.height):
                    for x in range(pose.width):
                        r, g, b, alpha = pose.getpixel((x, y))
                        if alpha:
                            best = min(range(len(GERMAN)), key=lambda i:
                                sum((a-c)**2 for a, c in zip((r,g,b), GERMAN[i])))
                            pose.putpixel((x,y), (*(ITALIAN if italian else GERMAN)[best], alpha))
                pos = (pad + round((left + right - pose.width)/2), pad + round((top + bottom - pose.height)/2))
                frame.alpha_composite(pose, pos)
        frames.append(frame)
    return frames


def wounded_frames(source, original):
    frames, scale = [], 69/495
    for column in range(4):
        cell = Image.new('RGBA', (83, 49))
        if column == 0:
            cell.paste(original, (7, 11))
        else:
            part = source.crop((column*543, 0, (column+1)*543, 724))
            box = part.getbbox()
            cell.alpha_composite(resized(part.crop(box), scale),
                (round(41.5+(box[0]-275)*scale), round(24.5+(box[1]-345)*scale)))
        frames.append(cell)
    return frames


def prepare_death(key, original, figures):
    name = 'wounded' if key == 'wounded' else 'patrol'
    source_path = HERE / (name + '-death-generated.png')
    source = Image.open(source_path).convert('RGBA')
    source.putalpha(source.getchannel('A').point(lambda a: 255 if a >= 150 else 0))
    frames = (wounded_frames(source, original) if key == 'wounded'
              else patrol_frames(source, original, figures(original), key.startswith('italian')))
    assert len({frame.tobytes() for frame in frames}) == 4
    width, height = frames[0].size
    sheet = Image.new('RGBA', (width*len(frames), height))
    for col, frame in enumerate(frames):
        sheet.paste(frame, (col*width, 0))
    dest = READY / (key + '-death-sprites.png')
    sheet.save(dest)
    descriptor = {'src': 'armies/game-ready/vojnici/' + dest.name, 'width': width, 'height': height,
        'anchor': {'x': width/2, 'y': height/2}, 'clips': {'dead': {'ms': TIMES}}}
    provenance = {'image': '../../game-ready/vojnici/' + dest.name, 'source': source_path.name,
        'sourceSha256': hashlib.sha256(source_path.read_bytes()).hexdigest(),
        'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'generator': 'death-generation.json',
        'anchor': descriptor['anchor'], 'cell': [width,height], 'row': 0, 'frameDurationsMs': TIMES,
        'loop': False, 'end': 'hold last frame'}
    return descriptor, provenance
