"""Build static contact sheets from the actual handoff atlas frames."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
data = json.loads((HERE/'sprites.json').read_text(encoding='utf-8-sig'))
for start in range(0,len(data['assets']),8):
    sheet = Image.new('RGB',(1100,720),'#46645d')
    draw = ImageDraw.Draw(sheet)
    for index,asset in enumerate(data['assets'][start:start+8]):
        left,top = (index%2)*550,(index//2)*180
        draw.text((left+8,top+5),asset['id'],fill='white')
        atlas = Image.open(ROOT/asset['repositoryImage']).convert('RGBA')
        f = asset['frame']
        choices = asset['animations'][:4]
        if len(asset['animations'])>4:
            choices = [asset['animations'][0],asset['animations'][1],asset['animations'][-2],asset['animations'][-1]]
        if len(choices)==1:
            choices = [{**choices[0],'frameColumns':[i],'frameCount':1} for i in range(min(4,choices[0]['frameCount']))]
        for col,clip in enumerate(choices):
            number = clip.get('frameColumns',[0])[0]
            if clip['name'] in ['dead','hit']:
                number += clip['frameCount']-1
            box = (number*f['width'],clip['row']*f['height'],(number+1)*f['width'],(clip['row']+1)*f['height'])
            cell = atlas.crop(box)
            size = min(1,125/cell.width,135/cell.height)
            cell = cell.resize((max(1,round(cell.width*size)),max(1,round(cell.height*size))),Image.Resampling.NEAREST)
            sheet.paste(cell,(left+col*135+8,top+24),cell)
            draw.text((left+col*135+8,top+160),clip['name'],fill='white')
    sheet.save(HERE/f'review-{start//8+1}.png')
print('Built static contact sheets; no browser or gameplay was executed.')
