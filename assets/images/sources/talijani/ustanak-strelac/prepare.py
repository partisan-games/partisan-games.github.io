"""Register the drawing on the Ustanak rifleman's fixed ground line."""

from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
IMAGES = HERE.parents[2]
OUTPUT = IMAGES / "game-ready" / "vojnici" / "italijanski-strelac-sprites.webp"
WIDTH, HEIGHT, GUTTER, GROUND = 440, 400, 4, 340
SCALE = 1.18
source = Image.open(HERE / "poses.png").convert("RGBA")
cell_width, cell_height = source.width // 4, source.height // 4
stride_x, stride_y = WIDTH + 2 * GUTTER, HEIGHT + 2 * GUTTER
sheet = Image.new("RGBA", (4 * stride_x, 4 * stride_y))

for row in range(4):
    for column in range(4):
        cell = source.crop((column * cell_width, row * cell_height,
                            (column + 1) * cell_width, (row + 1) * cell_height))
        alpha = cell.getchannel("A").point(lambda value: 255 if value >= 190 else 0)
        bounds = alpha.getbbox()
        assert bounds, (row, column)
        left, _, _, bottom = bounds
        cell.putalpha(alpha)
        pose = cell.crop(bounds)
        pose = pose.resize((round(pose.width * SCALE), round(pose.height * SCALE)), Image.Resampling.NEAREST)
        x = max(10, min(WIDTH - pose.width - 10, 55 + round((left - 82) * SCALE)))
        y = GROUND - pose.height + (round((bottom - 235) * SCALE) if row < 3 else 0)
        assert 0 <= x <= WIDTH - pose.width and 0 <= y <= HEIGHT - pose.height
        sheet.alpha_composite(pose, (column * stride_x + GUTTER + x, row * stride_y + GUTTER + y))

sheet.save(OUTPUT, lossless=True, method=6)
