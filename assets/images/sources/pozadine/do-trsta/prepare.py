"""Prepare the two review sizes from the four original Do Trsta background PNGs."""
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
IMAGES = HERE.parents[2]
NEAREST = Image.Resampling.NEAREST
REVIEW_SIZES = [(1280, 720), (1024, 768)]


def composition(background, source_ground, size, tank, barrel):
    width, height = size
    # The scene places the tracks at 0.8H + 24, halfway down its road.
    tracks = round(height * .8 + 24)
    road_top = round(tracks - min(140, max(64, height * .16)) / 2)
    scene = Image.new("RGBA", size)
    for sy0, sy1, dy0, dy1 in [(0, source_ground, 0, road_top),
                                (source_ground, background.height, road_top, height)]:
        strip = background.crop((0, sy0, background.width, sy1))
        scene.paste(strip.resize((width, dy1 - dy0), NEAREST), (0, dy0))
    # A level barrel keeps the tank silhouette clear. Geometry is 20 px/metre.
    x = round(width * .23)
    scene.alpha_composite(tank, (x - tank.width // 2, tracks - tank.height))
    scene.alpha_composite(barrel, (x + 14, tracks - 26 - 14 - barrel.height // 2))
    return scene.convert("RGB")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    manifest = json.loads((HERE / "backgrounds.json").read_text(encoding="utf-8"))
    ref = manifest["styleReference"]
    assert sha256((IMAGES / ref["src"]).read_bytes()).hexdigest() == ref["sha256"]
    sources = IMAGES / "armies/game-ready/tenkovi"
    with Image.open(sources / "partizanski-tenk-layers.png") as atlas:
        tank = atlas.crop((0, 258, 300, 387)).convert("RGBA")
        tank.alpha_composite(atlas.crop((0, 0, 300, 129)).convert("RGBA"))
        tank = tank.resize((120, 51), NEAREST)
    with Image.open(sources / "partizanski-tenk-cev-pixel.png") as original:
        barrel = original.convert("RGBA").resize((72, max(1, round(72 * original.height / original.width))), NEAREST)
    for stage in manifest["backgrounds"]:
        path = IMAGES / stage["src"]
        assert sha256(path.read_bytes()).hexdigest() == stage["sha256"], path
        with Image.open(path) as background:
            assert list(background.size) == stage["size"]
            assert background.convert("RGBA").getchannel("A").getextrema() == (255, 255)
            assert 0 < stage["groundY"] < background.height
            for size in REVIEW_SIZES:
                result = composition(background, stage["groundY"], size, tank, barrel)
                destination = HERE / "compositions" / f'{stage["id"]}-{size[0]}x{size[1]}.webp'
                with BytesIO() as stream:
                    result.save(stream, format="WEBP", lossless=True)
                    data = stream.getvalue()
                if args.check:
                    assert destination.read_bytes() == data, destination
                else:
                    destination.parent.mkdir(exist_ok=True)
                    destination.write_bytes(data)
    print("Verified four opaque originals and eight compositions with the player's tank.")


if __name__ == "__main__":
    main()
