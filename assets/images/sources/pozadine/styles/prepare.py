"""Compose existing game units over preserved style studies; never alter study PNGs."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('background_compositions', HERE.parent / 'prepare.py')
compositions = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compositions)

manifest = json.loads((HERE / 'manifest.json').read_text(encoding='utf-8'))
report = {'gameExecuted': False, 'browserExecuted': False, 'ownerAccepted': False, 'variants': []}
for variant in manifest['variants']:
    source = HERE / variant['image']
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != variant['sha256']:
        raise ValueError(f"Study pixels changed: {variant['id']}")
    output = HERE / f"{variant['id']}-units.png"
    compositions.composition(compositions.picture(source), variant['groundY'], (1280, 720), 'ustanak').save(output)
    report['variants'].append({'id': variant['id'], 'sourceSha256': digest, 'preview': output.name, 'previewSha256': hashlib.sha256(output.read_bytes()).hexdigest()})
(HERE / 'review.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f"Prepared {len(manifest['variants'])} style-study compositions; source PNGs unchanged; no game or browser executed.")
