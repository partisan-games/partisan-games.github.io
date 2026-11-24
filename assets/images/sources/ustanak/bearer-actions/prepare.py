"""Register both bearers' walk and fall to their accepted size and pole grip."""
import hashlib
import json
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
IMAGES = HERE.parents[2]
READY = IMAGES / 'game-ready/vojnici'
WIDTH, HEIGHT, BASE = 128, 88, 80


def opaque(im):
    im = im.convert('RGBA')
    im.putalpha(im.getchannel('A').point(lambda a: 255 if a >= 150 else 0))
    return im


def cut(im, box):
    cell = im.crop(box)
    return cell.crop(cell.getbbox())


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    assets = []
    for k, idle_file, old_rows, old_row, old_width in [
        ('partisan', 'partizanski-zastavnik-sprites.png', 1, 0, 60),
        ('italian', 'zastavnici-sprites.png', 2, 1, 80),
    ]:
        old = opaque(Image.open(READY / idle_file))
        w, h = old.width / 4, old.height / old_rows
        idle = old.crop((0, round(old_row*h), round(w), round((old_row+1)*h))).resize((old_width,80), Image.Resampling.NEAREST)
        source_file = HERE / f'{k}-generated.png'
        source = opaque(Image.open(source_file))
        standing = cut(source, (0,0,430,443))
        factor = (idle.getbbox()[3]-idle.getbbox()[1])/standing.height
        sheet = Image.new('RGBA', (4*WIDTH, 2*HEIGHT))
        for row in range(2):
            for col in range(4):
                cell = Image.new('RGBA', (WIDTH,HEIGHT))
                if col == 0:
                    # Match the actual feet anchor of the idle view, 95% down its 80 px cell.
                    cell.paste(idle, (WIDTH//2-old_width//2, BASE-76))
                else:
                    if k == 'partisan' and row == 1 and col >= 2:
                        revision = opaque(Image.open(HERE/'partisan-grounded.png'))
                        start = (col-2)*revision.width//2
                        pose = cut(revision, (start,0,start+revision.width//2,revision.height))
                        size = (85, round(85*pose.height/pose.width))
                    else:
                        x1,x2 = round(col*source.width/4), round((col+1)*source.width/4)
                        pixel_row = round(row*source.height/2)
                        pose = cut(source,(x1,pixel_row,x2,round((row+1)*source.height/2)))
                        size = tuple(round(n*factor) for n in pose.size)
                    pose = pose.resize(size, Image.Resampling.NEAREST)
                    x = (WIDTH-pose.width)//2
                    if row == 0:
                        # The forward hand in the upper part stays on the game's separate staff.
                        grip = pose.crop((0,0,pose.width,round(pose.height*.49))).getbbox()[2]
                        x = WIDTH//2+20-grip
                    cell.alpha_composite(pose, (x,BASE-pose.height))
                sheet.paste(cell,(col*WIDTH,row*HEIGHT))
        target = READY/f'{k}-bearer-actions.png'
        sheet.save(target)
        files = [source_file, HERE/f'{k}-reference.png', READY/idle_file]
        if k == 'partisan':
            files.append(HERE/'partisan-grounded.png')
        assets.append({'id': k,'image': '../../../game-ready/vojnici/'+target.name,'sha256':digest(target),
            'frame': {'width':WIDTH,'height':HEIGHT,'columns':4,'rows':2},
            'anchor':{'x':WIDTH//2,'y':BASE},'sources':{p.name:digest(p) for p in files},
            'animations':[{'name':'walk','row':0,'frameDurationsMs':[160]*4,'loop':True},
                          {'name':'dead','row':1,'frameDurationsMs':[120,160,180,240],'loop':False,'end':'hold'}]})
    (HERE/'sprites.json').write_text(json.dumps({'assets':assets},indent=2)+'\n',encoding='utf-8')


if __name__ == '__main__':
    main()
