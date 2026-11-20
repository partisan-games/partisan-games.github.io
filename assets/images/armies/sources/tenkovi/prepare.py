"""Pack image_gen tread phases over unchanged tank hulls; requires Pillow."""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

HERE = Path(__file__).resolve().parent


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_gif(frames, path, duration):
    # One palette for the entire loop prevents color flicker between phases.
    strip = Image.new('RGB', (frames[0].width * len(frames), frames[0].height))
    for index, frame in enumerate(frames):
        strip.paste(frame.convert('RGB'), (index * frame.width, 0))
    palette = strip.quantize(colors=255)
    encoded = []
    for frame in frames:
        encoded_frame = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE)
        encoded_frame.paste(255, mask=frame.getchannel('A').point(lambda a: 255 if a < 128 else 0))
        encoded.append(encoded_frame)
    encoded[0].save(path, save_all=True, append_images=encoded[1:], duration=duration,
                    loop=0, transparency=255, background=255, disposal=2, optimize=False)


def build(recipe):
    original_path = (HERE / recipe['reference']).resolve()
    generated_path = HERE / recipe['source']
    original = Image.open(original_path).convert('RGBA')
    generated = Image.open(generated_path).convert('RGBA')
    assert generated.size == tuple(recipe['sourceSize']), f"Source crop needs review: {recipe['id']}"
    width, height = original.size
    mask = Image.new('L', original.size)
    ImageDraw.Draw(mask).polygon(recipe['trackMask'], fill=255)
    mask = ImageChops.multiply(mask, original.getchannel('A'))
    frames = []
    for index in range(4):
        # A shared crop and scale preserve phase registration; never auto-fit each frame.
        cell = generated.crop((round(index * generated.width / 4), 0,
                               round((index + 1) * generated.width / 4), generated.height))
        phase = cell.crop(recipe['sourceCrop']).resize(original.size, Image.Resampling.NEAREST)
        # Freeze the accepted hull, turret, markings and silhouette pixel for pixel.
        # Only the generated opaque tread pixels inside the documented mask are used.
        phase_mask = ImageChops.multiply(mask, phase.getchannel('A'))
        frame = Image.composite(phase, original, phase_mask)
        frame.putalpha(original.getchannel('A'))
        unchanged = ImageChops.difference(frame, original)
        outside = ImageChops.invert(mask.point(lambda a: 255 if a else 0))
        assert all(not ImageChops.multiply(band, outside).getbbox()
                   for band in unchanged.split()), f"Hull changed: {recipe['id']}:{index}"
        assert frame.getchannel('A').tobytes() == original.getchannel('A').tobytes()
        frames.append(frame)
    distinct = len({hashlib.sha256(frame.tobytes()).digest() for frame in frames})
    assert distinct == 4, f"Repeated drive phases: {recipe['id']}"
    sheet = Image.new('RGBA', (width * 4, height * 2))
    for index, frame in enumerate(frames):
        sheet.paste(original, (index * width, 0))
        sheet.paste(frame, (index * width, height))
    output = (HERE / recipe['output']).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)
    preview = HERE / 'previews'
    preview.mkdir(exist_ok=True)
    gif_path = preview / f"{recipe['id']}-drive.gif"
    save_gif(frames, gif_path, 160)
    with Image.open(gif_path) as gif:
        assert gif.n_frames == 4, f"GIF lost phases: {recipe['id']}"
    contact = Image.new('RGBA', (width * 4, height))
    for index, frame in enumerate(frames):
        contact.paste(frame, (index * width, 0))
    contact.save(preview / f"{recipe['id']}-drive.png")
    display_width = recipe['previewWidth']
    display_height = round(height * display_width / width)
    display = Image.new('RGBA', (display_width * 4, display_height))
    for index, frame in enumerate(frames):
        display.paste(frame.resize((display_width, display_height), Image.Resampling.NEAREST),
                      (index * display_width, 0))
    display.save(preview / f"{recipe['id']}-drive-game-size.png")
    return {
        'id': recipe['id'], 'title': recipe['title'], 'image': recipe['output'],
        'frame': {'width': width, 'height': height, 'columns': 4, 'rows': 2},
        'anchor': {'x': width / 2, 'y': height / 2},
        'groundAnchor': {'x': width / 2, 'y': height},
        'facing': recipe['facing'], 'reference': recipe['reference'],
        'referenceSha256': sha256(original_path), 'source': recipe['source'],
        'sourceSha256': sha256(generated_path), 'sha256': sha256(output),
        'hullPixelsOutsideTrackMaskUnchanged': True, 'alphaIdenticalToReference': True,
        'animations': [
            {'name': 'idle', 'row': 0, 'frameCount': 4, 'duration': 1.4,
             'loop': True, 'distinctFrames': 1},
            {'name': 'drive', 'row': 1, 'frameCount': 4, 'duration': .64,
             'loop': True, 'distinctFrames': distinct,
             'preview': f'previews/{gif_path.name}'},
        ],
        'barrel': recipe['barrel'],
    }


def main():
    recipe = json.loads((HERE / 'manifest.json').read_text(encoding='utf-8'))
    assets = [build(asset) for asset in recipe['assets']]
    metadata = {
        'schemaVersion': 1, 'generatedWith': 'Built-in image_gen; Pillow atlas packing',
        'integration': 'Art only. Existing static hulls and barrel resources are unchanged. '
                       'Anchor is the existing center origin; groundAnchor is a separate baseline. '
                       'Keep per-frame dimensions for collision and barrel positioning, never atlas dimensions. '
                       'Drive backwards by reversing phase order. Advance only by game time while moving; '
                       'pause or stopping must freeze the loop. No gameplay consumer is changed by this build.',
        'assets': assets,
    }
    (HERE / 'sprites.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Packed {len(assets)} tank atlases; original hulls and barrels unchanged.')


if __name__ == '__main__':
    main()
