"""Bake the barrier and replace the Hotchkiss tracks without re-exporting unchanged meshes.

python -B scripts/prepare-kraljevo-models.py sandbags <original.glb> <output.glb> <burlap.png>
python -B scripts/prepare-kraljevo-models.py tracks <original.glb> <output.glb>
python -B scripts/prepare-kraljevo-models.py gun <original.glb> <output.glb>
"""
import argparse
import io
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt
from scipy.spatial import ConvexHull


def load(path):
    raw = path.read_bytes()
    assert raw[:8] == b'glTF\x02\0\0\0', path
    size, = struct.unpack_from('<I', raw, 12)
    gltf = json.loads(raw[20:20 + size])
    binary = raw[28 + size:]
    chunks = [binary[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in gltf['bufferViews']]
    return gltf, chunks


def save(path, gltf, chunks):
    data = bytearray()
    for view, chunk in zip(gltf['bufferViews'], chunks, strict=True):
        data.extend(b'\0' * (-len(data) % 4))
        view.update(byteOffset=len(data), byteLength=len(chunk))
        data.extend(chunk)
    data.extend(b'\0' * (-len(data) % 4))
    gltf['buffers'][0]['byteLength'] = len(data)
    raw = json.dumps(gltf, separators=(',', ':')).encode()
    raw += b' ' * (-len(raw) % 4)
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 28 + len(raw) + len(data))
                     + struct.pack('<I4s', len(raw), b'JSON') + raw
                     + struct.pack('<I4s', len(data), b'BIN\0') + data)


def values(gltf, chunks, index):
    a = gltf['accessors'][index]
    view = gltf['bufferViews'][a['bufferView']]
    dtype = np.dtype({5123: '<u2', 5125: '<u4', 5126: '<f4'}[a['componentType']])
    columns = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
    return np.ndarray((a['count'], columns), dtype=dtype, buffer=chunks[a['bufferView']],
                      offset=a.get('byteOffset', 0), strides=(view.get('byteStride', dtype.itemsize * columns), dtype.itemsize))


def texture(gltf, chunks, image, name, repeat=False):
    data = io.BytesIO()
    image.save(data, 'PNG', optimize=True)
    view = len(chunks)
    chunks.append(data.getvalue())
    gltf['bufferViews'].append({'buffer': 0})
    images = gltf.setdefault('images', [])
    samplers = gltf.setdefault('samplers', [])
    textures = gltf.setdefault('textures', [])
    images.append({'bufferView': view, 'mimeType': 'image/png', 'name': name})
    samplers.append({'wrapS': 10497 if repeat else 33071, 'wrapT': 33071, 'magFilter': 9728, 'minFilter': 9987})
    textures.append({'source': len(images) - 1, 'sampler': len(samplers) - 1, 'name': name})
    return len(textures) - 1


def sandbags(gltf, chunks, swatch):
    mesh = gltf['meshes'][0]['primitives'][0]
    attrs = mesh['attributes']
    xyz, normals, uv = (values(gltf, chunks, attrs[key]) for key in ('POSITION', 'NORMAL', 'TEXCOORD_0'))
    faces = values(gltf, chunks, mesh['indices']).reshape(-1, 3)
    cloth = np.asarray(Image.open(swatch).convert('L').resize((64, 64), Image.Resampling.BOX), dtype=float)
    cloth -= cloth.mean()
    size = 512
    rgb = np.zeros((size, size, 3), dtype=np.uint8)
    used = np.zeros((size, size), dtype=bool)
    for face in faces:
        a, b, c = uv[face] * size
        ab, ac = b - a, c - a
        area = ab[0] * ac[1] - ab[1] * ac[0]
        if abs(area) < 1e-6:
            continue
        low = np.maximum(np.floor(uv[face].min(axis=0) * size).astype(int), 0)
        high = np.minimum(np.ceil(uv[face].max(axis=0) * size).astype(int), size - 1)
        xs, ys = np.meshgrid(np.arange(low[0], high[0] + 1), np.arange(low[1], high[1] + 1))
        dx, dy = xs + .5 - a[0], ys + .5 - a[1]
        beta = (dx * ac[1] - dy * ac[0]) / area
        gamma = (ab[0] * dy - ab[1] * dx) / area
        alpha = 1 - beta - gamma
        inside = (alpha >= 0) & (beta >= 0) & (gamma >= 0)
        weights = np.stack((alpha[inside], beta[inside], gamma[inside]), axis=-1)
        points = weights @ xyz[face]
        normal = weights @ normals[face]
        # Sample the same physical cloth scale regardless of the UV island's orientation.
        grain = np.floor(points * 94).astype(int) % 64
        x, y, z = grain.T
        blend = np.abs(normal) ** 4
        weave = (blend * np.stack((cloth[z, y], cloth[z, x], cloth[y, x]), axis=-1)).sum(axis=-1) / blend.sum(axis=-1)
        broad = 4 * np.sin(points[:, 0] * 12 + points[:, 2] * 6) + 3 * np.sin(points[:, 1] * 15 - points[:, 2] * 24)
        mud = 22 * np.maximum(0, .36 - points[:, 2])
        tone = (broad + 1.05 * weave + 12 * normal[:, 2] - mud) // 4 * 4
        rgb[ys[inside], xs[inside]] = np.clip(tone[:, None] + [148, 128, 95], 0, 255)
        used[ys[inside], xs[inside]] = True
    # Dilate the UV islands so filtering and mipmapping do not pick up unpainted seams.
    _, nearest = distance_transform_edt(~used, return_indices=True)
    rgb = rgb[tuple(nearest)]
    surface = texture(gltf, chunks, Image.fromarray(rgb), 'Weathered sandbag burlap')
    gltf['materials'][mesh['material']]['pbrMetallicRoughness'].update(baseColorTexture={'index': surface}, roughnessFactor=.94)


def normalized(vector):
    return vector / np.linalg.norm(vector, axis=-1, keepdims=True)


def reorder_profile(points, tolerance=.009):
    # Keep the measured outer silhouette, discarding sub-centimetre tread detail.
    ring = points[ConvexHull(points).vertices]
    while True:
        chord = np.roll(ring, -1, axis=0) - np.roll(ring, 1, axis=0)
        offset = ring - np.roll(ring, 1, axis=0)
        deviation = np.abs(chord[:, 0] * offset[:, 1] - chord[:, 1] * offset[:, 0]) / np.linalg.norm(chord, axis=1)
        index = np.argmin(deviation)
        if deviation[index] >= tolerance:
            return ring
        ring = np.delete(ring, index, axis=0)


def track_geometry(source):
    ring = reorder_profile(source[:, [2, 1]])
    tangent = np.roll(ring, -1, axis=0) - ring
    edges = normalized(tangent)[:, [1, 0]] * [1, -1]
    out = normalized(edges + np.roll(edges, 1, axis=0))
    inside = ring - .046 * out
    lengths = np.r_[0, np.cumsum(np.linalg.norm(tangent, axis=1))]
    u = lengths / lengths[-1] * round(lengths[-1] / .084)
    lo, hi = source[:, 0].min(), source[:, 0].max()
    positions, normals, uv, indices = [], [], [], []
    sides = ((ring, lo, .16, ring, hi, .84, 0),
             (inside, hi, .84, inside, lo, .16, 0),
             (inside, lo, 0., ring, lo, .16, -1),
             (ring, hi, .84, inside, hi, 1., 1))
    for side, (first, x0, v0, second, x1, v1, across) in enumerate(sides):
        start = len(positions)
        for i, along in enumerate(u):
            node = i % len(ring)
            z, y = out[node] * (-1 if side == 1 else 1)
            normal = (across, 0, 0) if across else (0, y, z)
            for profile, x, v in ((first, x0, v0), (second, x1, v1)):
                z, y = profile[node]
                positions.append((x, y, z))
                normals.append(normal)
                uv.append((along, v))
        for i in range(len(ring)):
            a = start + 2 * i
            b, c, d = a + 1, a + 2, a + 3
            cross = np.cross(np.subtract(positions[b], positions[a]), np.subtract(positions[c], positions[a]))
            indices.extend((a, b, c, b, d, c) if cross @ normals[a] > 0 else (a, c, b, b, c, d))
    return [np.asarray(data, dtype) for data, dtype in zip((positions, normals, uv, indices), ('<f4', '<f4', '<f4', '<u2'))]


def link_image():
    # U covers one link pitch. The outer rows also paint the two slim side faces.
    image = Image.new('RGB', (32, 64), '#2a2722')
    draw = ImageDraw.Draw(image)
    draw.rectangle((3, 0, 28, 63), fill='#6d6456')
    draw.rectangle((4, 5, 28, 58), fill='#766e60')
    draw.line((4, 0, 4, 63), fill='#958877', width=2)
    draw.line((27, 0, 27, 63), fill='#49433a', width=2)
    draw.rectangle((5, 10, 27, 53), fill='#4d4a40')
    draw.polygon(((10, 9), (17, 9), (15, 29), (21, 32), (15, 54), (9, 54), (13, 33), (8, 29)), fill='#756e60')
    draw.line(((10, 10), (8, 29), (13, 33), (9, 53)), fill='#8a8172', width=2)
    draw.line(((18, 12), (16, 28), (22, 32), (16, 53)), fill='#38362e', width=2)
    for y in (4, 59):
        draw.rectangle((22, y - 2, 28, y + 2), fill='#413d34')
        draw.point((23, y - 1), fill='#8b8071')
    return image


def tracks(gltf, chunks):
    for name in ('track-left', 'track-right'):
        node = next(node for node in gltf['nodes'] if node['name'] == name)
        mesh = gltf['meshes'][node['mesh']]['primitives'][0]
        attrs = mesh['attributes']
        arrays = track_geometry(values(gltf, chunks, attrs['POSITION']))
        for index, array in zip((attrs['POSITION'], attrs['NORMAL'], attrs['TEXCOORD_0'], mesh['indices']), arrays, strict=True):
            a = gltf['accessors'][index]
            a.update(count=len(array), min=array.min(axis=0).reshape(-1).tolist(), max=array.max(axis=0).reshape(-1).tolist())
            chunks[a['bufferView']] = array.tobytes()
        material = gltf['materials'][mesh['material']]
        material.pop('occlusionTexture', None)
        material['pbrMetallicRoughness'].update(metallicFactor=.17, roughnessFactor=.86)
    del gltf['images'][6:]
    del gltf['textures'][6:]
    # The exported source has no other bufferView users beyond accessors and images.
    kept = {item['bufferView'] for item in gltf['accessors'] + gltf['images']}
    order = {old: new for new, old in enumerate(sorted(kept))}
    gltf['bufferViews'] = [gltf['bufferViews'][index] for index in order]
    chunks[:] = [chunks[index] for index in order]
    for item in gltf['accessors'] + gltf['images']:
        item['bufferView'] = order[item['bufferView']]
    link = texture(gltf, chunks, link_image(), 'Hotchkiss tread link', repeat=True)
    for material in gltf['materials'][3:5]:
        material['pbrMetallicRoughness']['baseColorTexture'] = {'index': link}


def gun_assemblies(positions, faces):
    """Use connected islands, including vertices duplicated along texture seams."""
    parents, owners = list(range(len(faces))), {}

    def root(face):
        while face != parents[face]:
            face = parents[face]
        return face

    for face, triangle in enumerate(faces):
        for index in triangle:
            key = tuple(round(float(value), 5) for value in positions[index])
            parents[root(face)] = root(owners.setdefault(key, face))
    components = {}
    for face in range(len(faces)):
        components.setdefault(root(face), []).append(face)
    gun_faces = np.zeros(len(faces), dtype=bool)
    for indices in components.values():
        points = positions[faces[indices].reshape(-1)]
        low, high = points.min(axis=0), points.max(axis=0)
        if low[2] > .50 and low[0] > -.32 and high[0] < .02:
            gun_faces[indices] = True
    return gun_faces


def write_accessor(gltf, chunks, index, array):
    accessor = gltf['accessors'][index]
    accessor.update(count=len(array), min=array.min(axis=0).reshape(-1).tolist(),
                    max=array.max(axis=0).reshape(-1).tolist())
    chunks[accessor['bufferView']] = array.tobytes()


def gun(gltf, chunks):
    nodes, meshes = gltf['nodes'], gltf['meshes']
    turret = next(node for node in nodes if node['name'] == 'turret')
    if any(node['name'] == 'gun' for node in nodes):
        raise ValueError('The Hotchkiss already has a separate gun.')
    primitive = meshes[turret['mesh']]['primitives'][0]
    attrs = primitive['attributes']
    keys = ('POSITION', 'NORMAL', 'TEXCOORD_0')
    position, normals, uv = (values(gltf, chunks, attrs[key]) for key in keys)
    faces = values(gltf, chunks, primitive['indices']).reshape(-1, 3)
    movable = gun_assemblies(position, faces)
    if int(movable.sum()) != 164:
        raise ValueError('The Hotchkiss mantlet and barrel no longer match the source mesh.')

    # Positions are in turret-local metres. Positive local X rotation lowers the +Z barrel.
    pivot = np.array([-.155, .367, .55], dtype='<f4')
    muzzle = np.array([-.155, .367, 1.3664], dtype='<f4')
    movable_indices, local_faces = np.unique(faces[movable], return_inverse=True)
    movable_arrays = [position[movable_indices] - pivot, normals[movable_indices], uv[movable_indices],
                      local_faces.reshape(-1).astype('<u2')]

    # A recessed face behind the mantlet. Its UVs continue the adjoining front armor.
    closure = np.array([[-.305, .187, .518], [.004, .187, .518],
                        [.004, .518, .497], [-.305, .518, .497]], dtype='<f4')
    normal = normalized(np.cross(closure[1] - closure[0], closure[2] - closure[0]))
    closure_uv = np.array([.429, .952], dtype='<f4') + (closure[:, :2] - [-.305, .19]) * .102
    stationary_indices, fixed_faces = np.unique(faces[~movable], return_inverse=True)
    n = len(stationary_indices)
    stationary_arrays = [
        np.concatenate((position[stationary_indices], closure)),
        np.concatenate((normals[stationary_indices], np.tile(normal, (4, 1)))),
        np.concatenate((uv[stationary_indices], closure_uv.astype('<f4'))),
        np.concatenate((fixed_faces.reshape(-1), [n, n + 1, n + 2, n, n + 2, n + 3])).astype('<u2'),
    ]

    indices = [*(attrs[key] for key in keys), primitive['indices']]
    gun_accessors = []
    for index, fixed, moving in zip(indices, stationary_arrays, movable_arrays, strict=True):
        old = gltf['accessors'][index]
        view = gltf['bufferViews'][old['bufferView']]
        gun_accessors.append(len(gltf['accessors']))
        gltf['accessors'].append({'bufferView': len(chunks), 'componentType': old['componentType'], 'type': old['type']})
        gltf['bufferViews'].append({'buffer': 0, 'target': view['target']})
        chunks.append(b'')
        write_accessor(gltf, chunks, index, fixed)
        write_accessor(gltf, chunks, gun_accessors[-1], moving)

    turret.setdefault('children', []).append(len(nodes))
    nodes.append({'name': 'gun', 'mesh': len(meshes), 'translation': pivot.tolist(), 'children': [len(nodes) + 1]})
    nodes.append({'name': 'muzzle', 'translation': (muzzle - pivot).tolist()})
    meshes.append({'name': 'Hotchkiss gun and mantlet', 'primitives': [
        {'attributes': dict(zip(keys, gun_accessors[:3], strict=True)), 'indices': gun_accessors[3],
         'material': primitive['material']},
    ]})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('part', choices=('sandbags', 'tracks', 'gun'))
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('swatch', nargs='?', type=Path)
    args = parser.parse_args()
    gltf, chunks = load(args.input)
    if args.part == 'sandbags':
        sandbags(gltf, chunks, args.swatch)
    elif args.part == 'tracks':
        tracks(gltf, chunks)
    else:
        gun(gltf, chunks)
    save(args.output, gltf, chunks)
