"""Register the three redraws in the original house's frame, then export 2× WebP."""

from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, distance_transform_edt, label


SOURCE = Path(__file__).resolve().parent
IMAGES = SOURCE.parents[2]
FRAME = (428, 286)
SIZE = (856, 572)


def sample_axis(landmarks, axis, source_size):
    original, output = FRAME[axis], SIZE[axis]
    target, generated = np.array(landmarks or [(0, 0), (original, original)]).T
    coordinates = (np.arange(output) + .5) * original / output
    return np.clip(np.interp(coordinates, target, generated) * source_size / original,
                   0, source_size - 1).astype(int)


def apply_recesses(pixels, redraw, openings):
    with Image.open(redraw) as image:
        art = np.asarray(image.convert('RGBA').resize(
            (pixels.shape[1], pixels.shape[0]), Image.Resampling.NEAREST))
    for x0, y0, x1, y1 in openings:
        area = np.s_[y0:y1, x0:x1]
        original = pixels[area][:, :, :3]
        replacement = art[area]
        white = (original.min(axis=2) >= 180) & (np.ptp(original, axis=2) <= 28)
        regions, _ = label(white)
        counts = np.bincount(regions.ravel())[1:]
        opening = binary_fill_holes(regions == counts.argmax() + 1)
        # The generated pass can move a recess edge by a few pixels. Fill those edge
        # pixels with the nearest painted shadow while retaining each original sandbag.
        colors = replacement[:, :, :3]
        shadow = opening & (replacement[:, :, 3] >= 128) & (colors.max(axis=2) <= 108)
        assert shadow.any(), 'The redraw has no dark interior in this opening'
        nearest = distance_transform_edt(~shadow, return_distances=False, return_indices=True)
        original[opening] = colors[nearest[0][opening], nearest[1][opening]]


def apply_impacts(frame, sheet, positions):
    with Image.open(sheet) as image:
        art = np.asarray(image.convert('RGB'))
    # Keep the intact architecture pixel-identical around the transferred chips.
    radius = 11
    size = 2 * radius + 1
    y, x = np.ogrid[-radius:radius + 1, -radius:radius + 1]
    weight = np.clip((radius - np.hypot(x, y)) / 4, 0, 1)[:, :, None]
    for index, dx, dy in positions:
        chip = art[:, index * size:(index + 1) * size]
        surface = frame[dy - radius:dy + radius + 1, dx - radius:dx + radius + 1, :3]
        surface[:] = np.rint(surface * (1 - weight) + chip * weight).astype(np.uint8)


def prepare(state):
    source = SOURCE / state['source']
    with Image.open(source) as raw:
        pixels = np.array(raw.convert('RGBA'))
    if 'recessRedraw' in state:
        redraw = SOURCE / state['recessRedraw']
        apply_recesses(pixels, redraw, state['openings'])
        state['recessRedrawSha256'] = sha256(redraw.read_bytes()).hexdigest()
    height, width = pixels.shape[:2]
    x = sample_axis(state.get('xRegistration'), 0, width)
    y = sample_axis(state.get('yRegistration'), 1, height)
    frame = pixels[np.ix_(y, x)]
    frame[frame[:, :, 3] < 128, 3] = 0
    if 'impactSheet' in state:
        sheet = SOURCE / state['impactSheet']
        apply_impacts(frame, sheet, state['impactPositions'])
        state['impactSheetSha256'] = sha256(sheet.read_bytes()).hexdigest()
    picture = Image.fromarray(frame)
    output = IMAGES / state['output']
    picture.save(output, lossless=True, exact=True, method=6)
    with Image.open(output) as decoded:
        assert decoded.convert('RGBA').tobytes() == picture.tobytes(), output
    state['bounds'] = list(picture.getchannel('A').getbbox())
    state['sourceSha256'] = sha256(source.read_bytes()).hexdigest()
    state['outputSha256'] = sha256(output.read_bytes()).hexdigest()
    print(f'{output.name}: {state["bounds"]}')


def main():
    manifest = SOURCE / 'generation.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    for state in data['states']:
        prepare(state)
    manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
