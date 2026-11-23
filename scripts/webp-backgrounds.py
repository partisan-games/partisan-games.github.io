"""Makes the WebP backgrounds the games load from their PNG sources, about a seventh of the size.

The accepted art stays a PNG; the games read `background/....webp`, and this script writes each such WebP that the
game code names from the PNG beside it, whenever the PNG is newer, and so the base and the clouds of each folder of
animated layers it names (`layers: 'background/.../'`). Run it after a background PNG changes.
"""
import re
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
images = root / 'assets' / 'images'
named = re.compile(r"background/[\w./-]+?\.webp")
layered = re.compile(r"layers: '(background/[\w-]+/)'")

written = 0
for code in [path for folder in ('core', 'scenes', 'ui') for path in (root / folder).rglob('*.js')]:
    text = code.read_text(encoding='utf-8')
    names = set(named.findall(text)) | {folder + layer for folder in layered.findall(text) for layer in ('base.webp', 'clouds.webp')}
    for name in names:
        target = images / name
        source = target.with_suffix('.png')
        if not source.exists() or (target.exists() and target.stat().st_mtime >= source.stat().st_mtime):
            continue
        Image.open(source).save(target, 'WEBP', quality=90, method=6)
        written += 1
        print(f'{name}: {source.stat().st_size // 1024} KB -> {target.stat().st_size // 1024} KB')
print(f'{written} written')
