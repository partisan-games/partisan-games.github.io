"""Register fortified-house and pillbox appearances without changing their shared image dimensions."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
RECIPES = {
    'bunker': dict(frame=[246,93],target='buildings/bunker-02.png',damage='bunker-damaged'),
}
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def build(name):
    recipe = RECIPES[name]
    source = HERE/(name+'-redraw-generated.png')
    image = Image.open(source).convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda value:255 if value >= 128 else 0))
    cells = [image.crop((0,round(i*image.height/2),image.width,round((i+1)*image.height/2))) for i in range(2)]
    boxes = [cell.getbbox() for cell in cells]
    assert all(boxes)
    left,top,right,bottom = boxes[0]
    width,height = recipe['frame']
    sx,sy = (width-4)/(right-left),(height-4)/(bottom-top)
    ox,oy = 2-left*sx,2-top*sy
    outputs = []
    for index,cell in enumerate(cells[:1]):
        shift = bottom-boxes[index][3]
        result = cell.transform((width,height),Image.Transform.AFFINE,(1/sx,0,-ox/sx,0,1/sy,-oy/sy-shift),Image.Resampling.NEAREST)
        frame = Image.new('RGBA',result.size)
        frame.alpha_composite(result)
        bounds = frame.getbbox()
        assert bounds and 0 < bounds[0] and bounds[2] < width and 0 < bounds[1] and bounds[3] < height
        target = ROOT/'assets/images'/recipe['target'] if index == 0 else HERE/(recipe['damage']+'-generated.png')
        frame.save(target,optimize=True)
        outputs.append(dict(path=target.relative_to(ROOT).as_posix(),sha256=sha(target),bounds=bounds,sourceShift=shift))
    record = dict(source=source.name,sourceSha256=sha(source),frame=recipe['frame'],scale=[sx,sy],offset=[ox,oy],
                  appearances=outputs,alphaThreshold=128,filter='nearest',registration='Intact appearance only; damage has its own accepted source.')
    (HERE/(name+'-redraw.json')).write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    print(f'Prepared {name}: intact appearance; existing damage preserved with unchanged image dimensions.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('actor',choices=RECIPES)
    build(parser.parse_args().actor)
