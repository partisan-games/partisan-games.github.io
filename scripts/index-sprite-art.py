"""Measure the actor and background art linked by docs/ART.md; never modify source images."""
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
DOCUMENTS = (ROOT / 'docs/ART.md',)
OUTPUT = ROOT / 'assets/images/sprite-index.json'


def relative(path):
    return path.relative_to(ROOT).as_posix()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    files = set()
    for document_path in DOCUMENTS:
        document = document_path.read_text(encoding='utf-8')
        for link in re.findall(r'\]\(([^)]+)\)', document):
            if '://' in link or link.startswith('#'):
                continue
            path = (document_path.parent / link.split('#', 1)[0]).resolve()
            if not path.is_relative_to(ROOT):
                raise ValueError(f'Index link leaves workspace: {link}')
            if path == OUTPUT:
                continue
            if not path.exists():
                raise FileNotFoundError(f'Index link is missing: {relative(path)}')
            if path.is_file():
                files.add(path)

    atlases = {}
    for metadata_path in sorted(path for path in files if path.name.endswith('sprites.json')):
        metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
        for asset in metadata['assets']:
            image_path = (metadata_path.parent / asset['image']).resolve()
            if not image_path.is_relative_to(ROOT) or not image_path.is_file():
                raise ValueError(f'Invalid sprite image: {image_path}')
            if image_path in atlases:
                raise ValueError(f'Duplicate atlas metadata: {image_path}')
            atlases[image_path] = (metadata_path, asset)
            files.add(image_path)
    images = []
    for path in sorted(files):
        suffix = path.suffix.lower()
        if suffix not in {'.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg'}:
            continue
        record = {'asset': relative(path), 'sha256': digest(path)}
        if suffix == '.svg':
            svg = ET.parse(path).getroot()
            record.update(kind='svg', width=svg.get('width'), height=svg.get('height'), viewBox=svg.get('viewBox'))
            record['containsAnimation'] = any(node.tag.rsplit('}', 1)[-1] in {'animate', 'animateTransform', 'animateMotion', 'set'} for node in svg.iter()) or '@keyframes' in path.read_text(encoding='utf-8')
        else:
            with Image.open(path) as image:
                count = getattr(image, 'n_frames', 1)
                record.update(kind=image.format, width=image.width, height=image.height, imageFrames=count)
                alpha = image.convert('RGBA').getchannel('A').getextrema()
                record['hasTransparentPixelsInFirstFrame'] = alpha[0] < 255
                unique = set()
                for frame in range(count):
                    image.seek(frame)
                    unique.add(hashlib.sha256(image.convert('RGBA').tobytes()).hexdigest())
                record['distinctImageFrames'] = len(unique)
                if path in atlases:
                    metadata_path, atlas = atlases[path]
                    grid = atlas['frame']
                    expected = (grid['width'] * grid['columns'], grid['height'] * grid['rows'])
                    if image.size != expected:
                        raise ValueError(f'Atlas geometry mismatch: {relative(path)}')
                    pixels = image.convert('RGBA')
                    clips = []
                    for clip in atlas['animations']:
                        frames = set()
                        columns = clip.get('frameColumns', range(clip['frameCount']))
                        for column in columns:
                            x, y = column * grid['width'], clip['row'] * grid['height']
                            cell = pixels.crop((x, y, x + grid['width'], y + grid['height']))
                            frames.add(hashlib.sha256(cell.tobytes()).hexdigest())
                        clips.append({key: clip[key] for key in ('name', 'row', 'frameCount', 'duration', 'loop')})
                        clips[-1]['measuredDistinctFrames'] = len(frames)
                    record['atlas'] = {'metadata': relative(metadata_path), 'id': atlas['id'], 'frame': grid, 'anchor': atlas['anchor'], 'clips': clips}
        images.append(record)

    revision = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, check=True, capture_output=True, text=True).stdout.strip()
    sources = files | set(DOCUMENTS) | {Path(__file__).resolve()}
    report = {
        'schemaVersion': 1,
        'measuredAt': datetime.now(timezone.utc).isoformat(),
        'baseRevision': revision,
        'scope': 'Art linked by docs/ART.md, including shared variants; not all unused library art or a runtime/visual acceptance test.',
        'interpretation': 'imageFrames counts file-container frames. A PNG atlas normally has one; named sprite clips require metadata and a runtime mapping. hashes detect exact input changes, not art quality.',
        'images': images,
        'reviewInputs': [{'path': relative(path), 'sha256': digest(path)} for path in sorted(sources)],
    }
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Indexed {len(images)} art files; {len(report["reviewInputs"])} review inputs. Source images unchanged.')


if __name__ == '__main__':
    main()
