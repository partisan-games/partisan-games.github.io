"""Copy one propeller of the B-24, a three-bladed Hamilton Standard as the B-17 also flew, into a model of its own:
its hub at the origin, its shaft along z and one metre across, so a plane can set it where it needs it.

python -B scripts/extract-b24-propeller.py   (after split-b24-propellers.py; writes propeller.glb beside the B-24)
"""
import json
import struct
from pathlib import Path

import numpy as np

FOLDER = Path(__file__).resolve().parent.parent / 'assets/models/aircraft/consolidated-b-24-liberator'


def read(path):
    data = path.read_bytes()
    json_length, = struct.unpack_from('<I', data, 12)
    return json.loads(data[20:20 + json_length]), data[20 + json_length + 8:]


def array(gltf, binary, index, kind, width):
    accessor = gltf['accessors'][index]
    view = gltf['bufferViews'][accessor['bufferView']]
    start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    return np.frombuffer(binary, kind, accessor['count'] * width, start).reshape(-1, width)


def main():
    gltf, binary = read(FOLDER / 'model.glb')
    nodes = gltf['nodes']
    hub = next(node for node in nodes if node.get('name') == 'Propeller1')
    blades = nodes[hub['children'][0]]
    # from the model's frame into the propeller's: undo its place, then its turn
    turn = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], dtype=float)
    shaft = np.array(hub['translation'])
    parts = []
    for primitive in gltf['meshes'][blades['mesh']]['primitives']:
        used = np.unique(array(gltf, binary, primitive['indices'], '<u4', 1).reshape(-1))
        remap = np.full(used.max() + 1, -1, dtype=np.int64)
        remap[used] = np.arange(used.size)
        positions = (array(gltf, binary, primitive['attributes']['POSITION'], '<f4', 3)[used] - shaft) @ turn
        normals = array(gltf, binary, primitive['attributes']['NORMAL'], '<f4', 3)[used] @ turn
        indices = remap[array(gltf, binary, primitive['indices'], '<u4', 1).reshape(-1)]
        parts.append((positions, normals, indices, gltf['materials'][primitive['material']]))
    across = 2 * max(np.hypot(positions[:, 0], positions[:, 1]).max() for positions, *_ in parts)
    out = {'asset': {'version': '2.0', 'generator': 'extract-b24-propeller.py'}, 'scene': 0,
           'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'Propeller', 'mesh': 0}],
           'meshes': [{'name': 'Propeller', 'primitives': []}], 'materials': [], 'accessors': [], 'bufferViews': [],
           'buffers': [{'byteLength': 0}]}
    data = bytearray()

    def add(values, kind, component, target, bounds=False):
        data.extend(b'\0' * (-len(data) % 4))
        raw = values.astype(kind).tobytes()
        out['bufferViews'].append({'buffer': 0, 'byteOffset': len(data), 'byteLength': len(raw), 'target': target})
        data.extend(raw)
        accessor = {'bufferView': len(out['bufferViews']) - 1, 'componentType': component, 'count': len(values),
                    'type': 'VEC3' if values.ndim == 2 else 'SCALAR'}
        if bounds:
            accessor.update(min=values.min(axis=0).tolist(), max=values.max(axis=0).tolist())
        out['accessors'].append(accessor)
        return len(out['accessors']) - 1

    for positions, normals, indices, material in parts:
        out['materials'].append(material)
        out['meshes'][0]['primitives'].append({
            'attributes': {'POSITION': add(positions / across, '<f4', 5126, 34962, True),
                           'NORMAL': add(normals, '<f4', 5126, 34962)},
            'indices': add(indices, '<u4', 5125, 34963), 'material': len(out['materials']) - 1})
    data.extend(b'\0' * (-len(data) % 4))
    out['buffers'][0]['byteLength'] = len(data)
    text = json.dumps(out, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    (FOLDER / 'propeller.glb').write_bytes(
        struct.pack('<4sII', b'glTF', 2, 28 + len(text) + len(data)) + struct.pack('<I4s', len(text), b'JSON') + text
        + struct.pack('<I4s', len(data), b'BIN\0') + bytes(data))
    print(f'propeller.glb: {sum(len(i) for *_, i, _ in parts) // 3} triangles, {across:.3f} model units across')


if __name__ == '__main__':
    main()
