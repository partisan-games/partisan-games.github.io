"""Prepare the three original prisoner faces for the Worker FBX UV layout."""

from hashlib import sha256
import json
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
FOLDER = ROOT / "assets/models/character/soldier"
OUTPUT = FOLDER / "prisoners-pixel-art"
GUIDE = FOLDER / "crni-pixel-art/face.webp"
MODEL = FOLDER / "resistance-fighter.fbx"
SIZE = (256, 256)


def digest(file):
    return sha256(file.read_bytes()).hexdigest()


def prepare():
    manifest = HERE / "source.json"
    data = json.loads(manifest.read_text(encoding="utf-8"))
    OUTPUT.mkdir(exist_ok=True)
    data["modelSha256"] = digest(MODEL)
    data["guideSha256"] = digest(GUIDE)
    for name, entry in data["faces"].items():
        source = HERE / f"{name}.png"
        dest = OUTPUT / f"{name}.webp"
        with Image.open(source) as draft:
            if draft.width != draft.height:
                raise ValueError(f"Expected a square UV draft: {source}")
            draft.convert("RGB").resize(SIZE, Image.Resampling.NEAREST).save(dest, lossless=True, method=6)
        entry.update(sourceSha256=digest(source), outputSha256=digest(dest), outputBytes=dest.stat().st_size)
    manifest.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    prepare()
