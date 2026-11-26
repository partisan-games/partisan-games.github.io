"""Split the four propellers of the B-24 model into their own nodes, Propeller1 to Propeller4, each turning about its
own shaft, without moving, adding or removing a triangle; the rest of the model stays as it is.

python -B scripts/split-b24-propellers.py   (rewrites assets/models/aircraft/consolidated-b-24-liberator/model.glb)

Coordinates are the model's own, under its root, with z up and the nose along +y. The blades of each propeller lie
within `reach` of its shaft and `depth` of its disc.
"""
import json
import struct
from pathlib import Path

import numpy as np

MODEL = Path(__file__).resolve().parent.parent / 'assets/models/aircraft/consolidated-b-24-liberator/model.glb'
PROPELLER_MESHES = ['Object_11', 'Object_12', 'Object_13']
# where each propeller turns, across and along the model, measured on its blades
SHAFTS = [(-2.36, 1.38), (-1.05, 1.47), (1.05, 1.47), (2.36, 1.38)]
reach, depth = .65, .15
# a quarter turn about x, so a propeller node turns about its own z, as the game turns it, along the model's y
TO_SHAFT = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], dtype=float)


def read(path):
    data = path.read_bytes()
    json_length, = struct.unpack_from('<I', data, 12)
    return json.loads(data[20:20 + json_length]), bytearray(data[20 + json_length + 8:])


def write(path, gltf, binary):
    binary += b'\0' * (-len(binary) % 4)
    gltf['buffers'][0]['byteLength'] = len(binary)
    text = json.dumps(gltf, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 28 + len(text) + len(binary))
                     + struct.pack('<I4s', len(text), b'JSON') + text + struct.pack('<I4s', len(binary), b'BIN\0')
                     + bytes(binary))


def array(gltf, binary, index, kind, width):
    accessor = gltf['accessors'][index]
    view = gltf['bufferViews'][accessor['bufferView']]
    start = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    values = np.frombuffer(binary, kind, accessor['count'] * width, start)
    return values.reshape(-1, width) if width > 1 else values


def add_indices(gltf, binary, indices):
    binary += b'\0' * (-len(binary) % 4)
    gltf['bufferViews'].append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': indices.nbytes, 'target': 34963})
    binary += indices.astype('<u4').tobytes()
    gltf['accessors'].append({'bufferView': len(gltf['bufferViews']) - 1, 'componentType': 5125, 'count': int(indices.size),
                              'type': 'SCALAR', 'min': [int(indices.min())], 'max': [int(indices.max())]})
    return len(gltf['accessors']) - 1


def main():
    gltf, binary = read(MODEL)
    source = bytes(binary)  # read from a copy, as the binary grows
    nodes = gltf['nodes']
    assert not any(node.get('name', '').startswith('Propeller') for node in nodes), 'already split'
    holder = next(node for node in nodes if 'children' in node and nodes[node['children'][0]].get('mesh') is not None)
    sources = [node for node in nodes if node.get('name') in PROPELLER_MESHES]
    blades = {shaft: [] for shaft in SHAFTS}
    cut = []
    for node in sources:
        primitive, = gltf['meshes'][node['mesh']]['primitives']
        positions = array(gltf, source, primitive['attributes']['POSITION'], '<f4', 3)
        triangles = array(gltf, source, primitive['indices'], '<u4', 1).reshape(-1, 3)
        centres = positions[triangles].mean(axis=1)
        taken = np.zeros(len(triangles), bool)
        for x, y in SHAFTS:
            near = (np.abs(centres[:, 0] - x) < reach) & (np.abs(centres[:, 1] - y) < depth) & ~taken
            taken |= near
            if near.any():
                blades[(x, y)].append((primitive, triangles[near], positions[triangles[near]].reshape(-1, 3)))
        cut.append((node, primitive, triangles[~taken]))
    for node, primitive, rest in cut:
        if rest.size:
            primitive['indices'] = add_indices(gltf, binary, rest.reshape(-1))
        else:
            del node['mesh']  # all of it was blades
    for number, place in enumerate(SHAFTS, 1):
        points = np.concatenate([corners for *_, corners in blades[place]])
        # the blades are alike and evenly spaced, so their middle is on the shaft
        shaft = points.mean(axis=0)
        mesh = {'name': f'Propeller{number}', 'primitives': [
            {**{key: value for key, value in primitive.items() if key != 'indices'},
             'indices': add_indices(gltf, binary, triangles.reshape(-1))} for primitive, triangles, _ in blades[place]]}
        gltf['meshes'].append(mesh)
        # the blades keep their place: the inner node undoes the propeller node's place and turn
        inner = np.eye(4)
        inner[:3, :3] = TO_SHAFT.T
        inner[:3, 3] = TO_SHAFT.T @ -shaft
        nodes.append({'name': f'Propeller{number} blades', 'mesh': len(gltf['meshes']) - 1,
                      'matrix': inner.T.reshape(-1).tolist()})
        half = np.sqrt(.5)
        nodes.append({'name': f'Propeller{number}', 'children': [len(nodes) - 1], 'translation': shaft.tolist(),
                      'rotation': [-half, 0, 0, half]})
        holder['children'].append(len(nodes) - 1)
        print(f'Propeller{number}: shaft {np.round(shaft, 3).tolist()}, {sum(len(t) for _, t, _ in blades[place])} triangles')
    write(MODEL, gltf, binary)


if __name__ == '__main__':
    main()
