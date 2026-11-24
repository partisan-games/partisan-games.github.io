"""Blender 4.5, --background --python optimize.py. No decimation or texture resizing.

Canonicalize duplicate glTF texture/material descriptions before importing, then
batch opaque static geometry. Keep transparent parts and all three propellers
separate so transparency sorting and future propeller motion remain possible.
"""
import bpy
import hashlib
import json
import struct
import tempfile
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent
source = (ROOT / 'source.glb').read_bytes()
document = json.loads(source[20:20 + struct.unpack_from('<I', source, 12)[0]])
binary_offset = 20 + struct.unpack_from('<I', source, 12)[0]
binary = source[binary_offset + 8:]


def unique(items):
    output, mapping, seen = [], [], {}
    for item in items:
        value = {k: v for k, v in item.items() if k not in ['name', 'extras']}
        key = json.dumps(value, sort_keys=True)
        if key not in seen:
            seen[key] = len(output)
            output.append(item)
        mapping.append(seen[key])
    return output, mapping


textures, texture_map = unique(document['textures'])
document['textures'] = textures
for material in document['materials']:
    material['pbrMetallicRoughness']['baseColorTexture']['index'] = texture_map[material['pbrMetallicRoughness']['baseColorTexture']['index']]
materials, material_map = unique(document['materials'])
document['materials'] = materials
for mesh in document['meshes']:
    for primitive in mesh['primitives']:
        primitive['material'] = material_map[primitive['material']]
encoded = json.dumps(document, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
canonical = struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(binary))
canonical += struct.pack('<I4s', len(encoded), b'JSON') + encoded
canonical += struct.pack('<I4s', len(binary), b'BIN\0') + binary
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
with tempfile.TemporaryDirectory() as temporary:
    path = Path(temporary) / 'canonical.glb'
    path.write_bytes(canonical)
    bpy.ops.import_scene.gltf(filepath=str(path))

opaque = []


def axle_center(points):
    # Fit the blade tips instead of relying on a view-dependent bounding box.
    points = list(set(points))
    random.Random(52).shuffle(points)
    circle = (0, 0, -1)
    def outside(p):
        return (p[0]-circle[0])**2 + (p[1]-circle[1])**2 > circle[2]**2 + 1e-5
    for i, a in enumerate(points):
        if circle[2] >= 0 and not outside(a):
            continue
        circle = (*a, 0)
        for j, b in enumerate(points[:i]):
            if not outside(b):
                continue
            x, y = (a[0]+b[0])/2, (a[1]+b[1])/2
            circle = (x, y, ((a[0]-x)**2+(a[1]-y)**2)**.5)
            for c in points[:j]:
                if not outside(c):
                    continue
                d = 2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]))
                if abs(d) < 1e-10:
                    continue
                aa, bb, cc = sum(v*v for v in a), sum(v*v for v in b), sum(v*v for v in c)
                x = (aa*(b[1]-c[1])+bb*(c[1]-a[1])+cc*(a[1]-b[1]))/d
                y = (aa*(c[0]-b[0])+bb*(a[0]-c[0])+cc*(b[0]-a[0]))/d
                circle = (x, y, ((a[0]-x)**2+(a[1]-y)**2)**.5)
    return circle[:2]


for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    if 'propeller' in obj.name.lower():
        y, z = axle_center([(v.co.y, v.co.z) for v in obj.data.vertices])
        x = (min(v.co.x for v in obj.data.vertices)+max(v.co.x for v in obj.data.vertices))/2
        # The exporter converts vertices from Blender Z-up to glTF Y-up, but
        # custom extras are plain JSON and need the same conversion explicitly.
        obj['axle'] = [x, z, -y]
    names = {m.name for m in obj.data.materials if m}
    transparent = any(m.get('alphaMode') == 'BLEND' and m['name'] in names for m in materials)
    if 'propeller' not in obj.name.lower() and not transparent:
        opaque.append(obj)
bpy.ops.object.select_all(action='DESELECT')
for obj in opaque:
    obj.select_set(True)
bpy.context.view_layer.objects.active = opaque[0]
bpy.ops.object.join()
bpy.context.object.name = 'Ju52-static'

bpy.ops.export_scene.gltf(filepath=str(ROOT / 'model.glb'), export_format='GLB',
                          export_animations=False, export_materials='EXPORT', export_extras=True)
output = (ROOT / 'model.glb').read_bytes()
result = json.loads(output[20:20 + struct.unpack_from('<I', output, 12)[0]])
triangles = sum((len(p.vertices) - 2) for o in bpy.context.scene.objects if o.type == 'MESH' for p in o.data.polygons)
record = {
    'source': {'file': 'source.glb', 'bytes': len(source), 'sha256': hashlib.sha256(source).hexdigest(),
               'materials': 66, 'primitives': 66, 'triangles': 9061},
    'optimized': {'file': 'model.glb', 'bytes': len(output), 'sha256': hashlib.sha256(output).hexdigest(),
                  'materials': len(result['materials']), 'meshes': len(result['meshes']),
                  'primitives': sum(len(m['primitives']) for m in result['meshes']), 'triangles': triangles},
    'changes': 'Deduplicate equivalent textures/materials; batch opaque static geometry. Preserve triangles, image resolution, transparent parts and separate propellers.',
    'provenance': 'User supplied D:/Downloads/junkers-ju-52/source/ju52.glb; no license included. Candidate matches the 9061-triangle Sketchfab upload credited as a Men of War: Assault Squad rip; reuse rights unverified.',
}
(ROOT / 'optimization.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
print('OPTIMIZED', json.dumps(record['optimized']), flush=True)
