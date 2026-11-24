"""Preview the shared Opel atlas at Do Trsta's size; never modify source art."""
import hashlib
import json
import runpy
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent


def main():
    usage = json.loads((HERE / 'opel-blitz.json').read_text(encoding='utf-8'))
    metadata_path = (HERE / usage['metadata']).resolve()
    metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
    asset = next(asset for asset in metadata['assets'] if asset['id'] == usage['assetId'])
    image_path = (metadata_path.parent / asset['image']).resolve()
    before = hashlib.sha256(image_path.read_bytes()).digest()
    assert before.hex() == asset['sha256'], 'Atlas differs from its metadata; refresh the shared metadata first.'
    image = Image.open(image_path).convert('RGBA')
    grid = asset['frame']
    assert image.size == (grid['width'] * grid['columns'], grid['height'] * grid['rows'])
    clip = next(clip for clip in asset['animations'] if clip['name'] == 'drive')
    size = (usage['collision']['width'], usage['collision']['height'])
    left, top, right, bottom = usage['render']['sourceContentBounds']
    for animation in asset['animations']:
        for column in range(animation['frameCount']):
            x, y = column * grid['width'], animation['row'] * grid['height']
            cell = image.crop((x, y, x + grid['width'], y + grid['height']))
            bounds = cell.getchannel('A').point(lambda alpha: 255 if alpha >= 64 else 0).getbbox()
            assert bounds and left <= bounds[0] and top <= bounds[1] and right >= bounds[2] and bottom >= bounds[3], 'Content bounds would clip an animation.'
    scale = min(size[0] / (right - left), size[1] / (bottom - top))
    # This inverse affine transform is the same uniform contain mapping as the HTML preview.
    offset_x = size[0] / 2 - (left + right) / 2 * scale
    offset_y = size[1] / 2 - (top + bottom) / 2 * scale
    frames = []
    for column in range(clip['frameCount']):
        x, y = column * grid['width'], clip['row'] * grid['height']
        cell = image.crop((x, y, x + grid['width'], y + grid['height']))
        assert cell.getchannel('A').getbbox() is not None
        frame = cell.transform(size, Image.Transform.AFFINE,
                               (1 / scale, 0, -offset_x / scale,
                                0, 1 / scale, -offset_y / scale),
                               resample=Image.Resampling.NEAREST)
        frames.append(frame)
    assert len({frame.tobytes() for frame in frames}) == clip['frameCount']
    output = HERE / 'previews'
    output.mkdir(exist_ok=True)
    strip = Image.new('RGBA', (size[0] * len(frames), size[1]))
    for index, frame in enumerate(frames):
        strip.paste(frame, (index * size[0], 0))
    strip.save(output / 'opel-blitz-drive-137.png')
    palette = strip.convert('RGB').quantize(colors=255)
    encoded = []
    for frame in frames:
        gif_frame = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        gif_frame.paste(255, mask=frame.getchannel('A').point(lambda alpha: 255 if alpha < 128 else 0))
        encoded.append(gif_frame)
    encoded[0].save(output / 'opel-blitz-drive-137.gif', save_all=True,
                    append_images=encoded[1:], duration=round(clip['duration'] * 1000 / len(frames)),
                    loop=0, transparency=255, background=255, disposal=2, optimize=False)
    with Image.open(output / 'opel-blitz-drive-137.gif') as gif:
        assert gif.n_frames == clip['frameCount'], 'GIF lost drive phases.'
    assert hashlib.sha256(image_path.read_bytes()).digest() == before
    runpy.run_path(str(HERE.parents[3] / 'scripts/prepare-vehicle-art.py'), run_name='__main__')
    print(f'Shared Opel: {len(frames)} distinct drive frames at {size[0]} x {size[1]}; original atlas unchanged.')


if __name__ == '__main__':
    main()
