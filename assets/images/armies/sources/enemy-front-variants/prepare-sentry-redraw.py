"""Register the redrawn sentry as a separate high-resolution idle proposal."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE / 'winter-sentry-redraw-generated.png'
OUTPUT = HERE / 'winter-sentry-redraw-idle.png'
METADATA = HERE / 'winter-sentry-redraw.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        data = json.loads(METADATA.read_text(encoding='utf8'))
        assert sha(SOURCE) == data['sourceSha256']
        assert sha(OUTPUT) == data['sha256']
        image = Image.open(OUTPUT)
        assert image.size == (512, 512)
        assert set(image.getchannel('A').get_flattened_data()) == {0, 255}
        left, top, right, bottom = image.getbbox()
        assert left > 0 and top > 0 and right < 512 and bottom == 496
        print('Checked redrawn sentry: 512x512, transparent background and registered boots.')
        return
    image = Image.open(SOURCE).convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
    bounds = image.getbbox()
    assert bounds
    figure = image.crop(bounds)
    scale = min(448/figure.height, 480/figure.width)
    figure = figure.resize((round(figure.width*scale), round(figure.height*scale)), Image.Resampling.NEAREST)
    frame = Image.new('RGBA', (512, 512))
    offset = [round((512-figure.width)/2), 496-figure.height]
    frame.alpha_composite(figure, offset)
    frame.save(OUTPUT)
    data = {'id': 'winter-sentry-redraw', 'image': OUTPUT.name, 'source': SOURCE.name,
            'sourceSha256': sha(SOURCE), 'sha256': sha(OUTPUT), 'sourceBounds': list(bounds),
            'frame': {'width': 512, 'height': 512, 'columns': 1, 'rows': 1},
            'anchor': {'x': 256, 'y': 496}, 'standingPixels': figure.height,
            'scale': scale, 'offset': offset, 'alphaThreshold': 128, 'view': 'front',
            'reference': '04-winter-sentry.png', 'styleReference': 'rifleman-redraw-idle.png',
            'generation': 'winter-sentry-redraw-generation.json', 'integrated': False,
            'animations': [{'name': 'idle', 'row': 0, 'frameCount': 1, 'duration': 1, 'loop': True}]}
    METADATA.write_text(json.dumps(data, indent=2)+'\n', encoding='utf8')
    print('Prepared redrawn winter sentry at 512x512; source resolution preserved separately.')


if __name__ == '__main__':
    main()
