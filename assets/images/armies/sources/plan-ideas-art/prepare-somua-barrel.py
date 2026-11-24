"""Replace only Somua's barrel pixels inside the existing cropped attachment rectangle."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
SOURCE=HERE/'somua-barrel-redraw-generated.png'
TARGET=ROOT/'assets/images/game-ready/tenkovi/somua-s35-barrel.png'
BODIES=[ROOT/'assets/images/game-ready/tenkovi'/name for name in ['somua-s35-sprites.png','somua-s35-layers.png']]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check',action='store_true')
if parser.parse_args().check:
    record=json.loads((HERE/'somua-barrel-redraw.json').read_text(encoding='utf-8'))
    assert sha(SOURCE)==record['sourceSha256'] and sha(TARGET)==record['sha256']
    for body in BODIES:assert sha(body)==record['protectedBodies'][body.name],body
    assert Image.open(TARGET).size==(2172,724)
    print('Checked Somua barrel: source/output hashes, attachment crop and unchanged hulls.')
else:
    image=Image.open(SOURCE).convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda value:255 if value>=128 else 0))
    bounds=image.getbbox()
    assert bounds
    part=image.crop(bounds).resize((1923,309),Image.Resampling.NEAREST)
    frame=Image.new('RGBA',(2172,724))
    frame.alpha_composite(part,(126,203))
    frame.save(TARGET,optimize=True)
    record=dict(source=SOURCE.name,sourceSha256=sha(SOURCE),sourceBounds=bounds,frame=[2172,724],
                crop=[126,203,1923,309],filter='nearest',alphaThreshold=128,sha256=sha(TARGET),
                protectedBodies={body.name:sha(body)for body in BODIES})
    (HERE/'somua-barrel-redraw.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    print('Prepared drawn Somua barrel; hulls and attachment geometry untouched.')
