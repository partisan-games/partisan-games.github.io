"""Normalize the original cutout for Drvar's 100 px/m billboard and write lossless WebP."""
import json
from hashlib import sha256
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/images/sources/nemci/padobranci/drvar-padobranac.png'
TARGET = ROOT / 'assets/images/game-ready/vojnici/drvar-padobranac.webp'
HELMET_Y, FRONT_X = 1043, 511
PERSON_HEIGHT = 180

image = Image.open(SOURCE).convert('RGBA')
# Match the billboard's alpha test. Center on the soldier's feet, preserving the full canopy.
left, top, right, feet = image.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0).getbbox()
radius = max(FRONT_X - left, right - FRONT_X)
crop = (FRONT_X - radius, top, FRONT_X + radius, feet)
scale = PERSON_HEIGHT / (feet - HELMET_Y)
image = image.crop(crop)
image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
image.save(TARGET, lossless=True, quality=100, method=6, exact=True)
assert Image.open(TARGET).convert('RGBA').tobytes() == image.tobytes()
assert image.getchannel('A').point(lambda alpha: 255 if alpha >= 128 else 0).getbbox()[3] == image.height
print(json.dumps({
    'crop': crop,
    'size': image.size,
    'visiblePersonHeightPx': PERSON_HEIGHT,
    'pixelsPerMetre': 100,
    'sourceSha256': sha256(SOURCE.read_bytes()).hexdigest(),
    'outputSha256': sha256(TARGET.read_bytes()).hexdigest(),
}))
