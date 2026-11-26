"""Shrink the images embedded in a GLB to at most `size` px a side, leaving everything else as it is.

python -B scripts/shrink-glb-textures.py model.glb [size]   (512 by default; rewrites the file in place)
"""
import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image


def shrink(path, size=512):
    data = path.read_bytes()
    magic, version, _ = struct.unpack_from('<4sII', data)
    assert magic == b'glTF' and version == 2, path
    json_length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + json_length])
    binary = data[20 + json_length + 8:]
    views = gltf['bufferViews']
    images = {image['bufferView']: image for image in gltf.get('images', []) if 'bufferView' in image}
    chunks = []
    for index, view in enumerate(views):
        start = view.get('byteOffset', 0)
        chunk = binary[start:start + view['byteLength']]
        if index in images:
            picture = Image.open(io.BytesIO(chunk))
            if max(picture.size) > size:
                scale = size / max(picture.size)
                picture = picture.resize((max(1, round(picture.width * scale)), max(1, round(picture.height * scale))),
                                         Image.LANCZOS)
                out = io.BytesIO()
                if images[index]['mimeType'] == 'image/jpeg':
                    picture.convert('RGB').save(out, 'JPEG', quality=88)
                else:
                    picture.save(out, 'PNG', optimize=True)
                chunk = out.getvalue()
        chunks.append(chunk)
    rebuilt = bytearray()
    for view, chunk in zip(views, chunks):
        rebuilt += b'\0' * (-len(rebuilt) % 4)
        view['byteOffset'] = len(rebuilt)
        view['byteLength'] = len(chunk)
        rebuilt += chunk
    rebuilt += b'\0' * (-len(rebuilt) % 4)
    gltf['buffers'][0]['byteLength'] = len(rebuilt)
    text = json.dumps(gltf, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(text) + 8 + len(rebuilt))
                     + struct.pack('<I4s', len(text), b'JSON') + text
                     + struct.pack('<I4s', len(rebuilt), b'BIN\0') + bytes(rebuilt))


if __name__ == '__main__':
    shrink(Path(sys.argv[1]), int(sys.argv[2]) if len(sys.argv) > 2 else 512)
