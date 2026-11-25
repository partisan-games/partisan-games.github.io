"""Pack the measured cels from the Chetnik source sheets with Pillow."""

from hashlib import sha256
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/images/sources/cetnici'
OUTPUT = ROOT / 'assets/images/game-ready/vojnici'
WIDTH, HEIGHT, GUTTER = 232, 164, 4
ANCHOR_X, ANCHOR_Y = 112, 154
STANDING_PIXELS = 144

# The alpha boxes mark the visible bounds; measured x values track the hips
# through the motion. Row and column cuts only run through empty space.
SHEETS = {
    'strelac': {
        'rows': (315, 611, 920),
        'columns': ((310, 630, 950),) * 3 + ((310, 625, 930),),
        'hips': ((153, 469, 783, 1099), (159, 475, 790, 1104),
                 (148, 450, 749, 1085), (157, 465, 747, 1085)),
        'airborne': (0, 0, 0, 0),
        # The unused third source attack cel has a baked muzzle flash.
        'attack': (0, 1, 3, 0),
        'muzzle': (570, 696),
    },
    'jurisnik': {
        'rows': (310, 608, 901),
        'columns': ((326, 656, 1000),) * 3 + ((326, 626, 936),),
        'hips': ((137, 464, 793, 1118), (147, 472, 806, 1134),
                 (124, 441, 779, 1098), (138, 466, 747, 1092)),
        'airborne': (0, 0, 5, 0),
        'attack': (0, 1, 2, 3),
        'muzzle': (593, 687),
    },
    'mitraljezac': {
        'rows': (310, 615, 945),
        'columns': ((314, 628, 944),) * 3 + ((314, 615, 894),),
        'hips': ((111, 425, 739, 1054), (106, 427, 741, 1055),
                 (113, 429, 742, 1058), (117, 428, 737, 1040)),
        'airborne': (0, 0, 0, 0),
        'attack': (0, 1, 2, 3),
        'muzzle': (598, 708),
    },
}


def pack(role, measurements):
    source_path = SOURCE / f'{role}.png'
    with Image.open(source_path) as source:
        image = source.convert('RGBA')
    # Discard the generation fringe while retaining the drawn pixel clusters.
    image.putalpha(image.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0))
    tops = (0, *measurements['rows'], image.height)
    pitch_x, pitch_y = WIDTH + 2 * GUTTER, HEIGHT + 2 * GUTTER
    atlas = Image.new('RGBA', (4 * pitch_x, 4 * pitch_y))
    muzzle = None

    for row, cuts in enumerate(measurements['columns']):
        lefts = (0, *cuts, image.width)
        order = measurements['attack'] if row == 2 else range(4)
        for column, index in enumerate(order):
            left, top = lefts[index], tops[row]
            frame = image.crop((left, top, lefts[index + 1], tops[row + 1]))
            x0, y0, x1, y1 = frame.getbbox()
            frame = frame.crop((x0, y0, x1, y1))
            if row == column == 0:
                scale = STANDING_PIXELS / frame.height
            frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.NEAREST)
            hip = measurements['hips'][row][index]
            x = ANCHOR_X + round((left + x0 - hip) * scale)
            y = ANCHOR_Y - frame.height
            if row == 1:
                y -= measurements['airborne'][index]
            assert 0 <= x <= WIDTH - frame.width and 0 <= y <= HEIGHT - frame.height, (role, row, column, x, y)
            atlas.paste(frame, (column * pitch_x + GUTTER + x, row * pitch_y + GUTTER + y))
            if row == 2 and column == 1:
                mx, my = measurements['muzzle']
                muzzle = (x + round((mx - left - x0) * scale), y + round((my - top - y0) * scale))

    destination = OUTPUT / f'cetnik-{role}.webp'
    atlas.save(destination, lossless=True, method=6)
    print(f'{role}: muzzle={muzzle}, source={sha256(source_path.read_bytes()).hexdigest()}, atlas={sha256(destination.read_bytes()).hexdigest()}')


if __name__ == '__main__':
    for role, measurements in SHEETS.items():
        pack(role, measurements)
