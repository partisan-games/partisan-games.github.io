"""Project painted damage onto the two trucks' length/height planes."""

from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
TRUCKS = HERE.parents[3] / "models" / "vehicle" / "truck"
source = Image.open(HERE / "wreck-paint.png").convert("RGBA")
midpoint = source.width // 2


def decal(box):
    patch = source.crop(box)
    alpha = patch.getchannel("A").point(lambda value: 255 if value >= 144 else 0)
    patch.putalpha(alpha)
    return patch.crop(alpha.getbbox())


steel = decal((0, 0, midpoint, source.height))
wood = decal((midpoint, 0, source.width, source.height))

for model, steel_box, wood_box in (
    ("opel-blitz", (17, 59, 78, 66), (122, 62, 106, 56)),
    ("army-truck", (169, 60, 71, 68), (21, 56, 114, 63)),
):
    atlas = Image.new("RGBA", (256, 160))
    for patch, (x, y, width, height) in ((steel, steel_box), (wood, wood_box)):
        atlas.alpha_composite(patch.resize((width, height), Image.Resampling.NEAREST), (x, y))
    atlas.save(TRUCKS / model / "wreck.webp", lossless=True, method=6)
