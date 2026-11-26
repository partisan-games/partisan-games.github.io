"""Register the three redraws in the original house's frame, then export 2× WebP."""

from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image


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


def prepare(state):
    source = SOURCE / state['source']
    with Image.open(source) as raw:
        pixels = np.array(raw.convert('RGBA'))
    height, width = pixels.shape[:2]
    x = sample_axis(state.get('xRegistration'), 0, width)
    y = sample_axis(state.get('yRegistration'), 1, height)
    frame = pixels[np.ix_(y, x)]
    frame[frame[:, :, 3] < 128, 3] = 0
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
