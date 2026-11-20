"""Register a selected imagegen attempt without changing its pixels."""
import hashlib
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    record_path = Path(sys.argv[1]).resolve()
    record = json.loads(record_path.read_text(encoding='utf-8'))
    manifest_path = HERE / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    entry = next(bg for bg in manifest['backgrounds'] if bg['id'] == record['id'])
    raw = ROOT / record.get('preservedImage', record['rawImage'])
    raw.parent.mkdir(exist_ok=True)
    original = Path(record['generatedFile'])
    if raw.exists():
        expected = sha(original) if original.exists() else record.get('sha256')
        if not expected or sha(raw) != expected:
            raise ValueError('Attempt path already contains different pixels; use a new attempt number')
    else:
        shutil.copyfile(original, raw)
    references = []
    for ref in record['referenceImages']:
        ref = dict(ref) if isinstance(ref, dict) else {'image': ref}
        path = ROOT / ref.get('repositoryImage', ref['image'])
        if path.exists():
            digest = sha(path)
            if ref.get('sha256') and ref['sha256'] != digest:
                raise ValueError(f"Reference pixels changed: {ref['image']}")
            ref['sha256'] = digest
        elif not ref.get('sha256'):
            raise FileNotFoundError(f"Missing reference without a recorded hash: {ref['image']}")
        references.append(ref)
    record['referenceImages'] = references
    record['sha256'] = sha(raw)
    record_path.write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    target = ROOT / entry['image']
    if raw.resolve() != target.resolve():
        shutil.copyfile(raw, target)
    with Image.open(target) as image:
        size = list(image.size)
    generation = record_path.relative_to(ROOT).as_posix()
    if generation not in entry['generations']:
        entry['generations'].append(generation)
    entry.update(status='in-progress', imageSize=size, groundY=record['groundY'], hotspots=record['hotspots'], visualReview=None)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f"Selected {entry['id']}: {size}, groundY={entry['groundY']}; visual review pending")


if __name__ == '__main__':
    main()
