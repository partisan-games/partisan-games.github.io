"""Prepare a restored mesh with Blender 4.2's FBX reader and writer.

blender -b --factory-startup --python prepare-restored-fbx.py -- bigfoot|iron-giant INPUT.fbx OUTPUT.fbx
Input is model.fbx at Three.js Games revision 0e275ab527d22ece1cd4dfa9bec201bd4ea53833.
External clips stay byte-for-byte identical to the original source.
"""
from pathlib import Path
import sys
from io_scene_fbx import encode_bin, parse_fbx


def remove_objects(sections, kinds):
    objects = sections[b'Objects'].elems
    removed = {node.props[0] for node in objects if node.id in kinds}
    if not removed:
        raise ValueError("Source FBX has none of the expected objects")
    objects[:] = [node for node in objects if node.props[0] not in removed]
    connections = sections[b'Connections'].elems
    connections[:] = [edge for edge in connections if not any(n in removed for n in edge.props[1:3])]
    definitions = sections[b'Definitions'].elems
    definitions[:] = [node for node in definitions if not (node.id == b'ObjectType' and node.props[0] in kinds)]
    next(node for node in definitions if node.id == b'Count').props[0] -= len(removed)


def restore_materials(objects):
    # Swatches from Nobby76's preview replace the eight missing external eye/metal maps.
    colors = {
        b'Metal Dark': (.16, .18, .22), b'Metal Medium': (.26, .29, .35),
        b'Metal Light': (.35, .39, .46), b'Metal Very Light': (.53, .56, .62),
        b'Eyes': (.96, .86, .62), b'Eyes 2': (.96, .86, .62),
    }
    for material in objects.elems:
        if material.id != b'Material':
            continue
        name = material.props[1].split(b'\0')[0]
        if name not in colors:
            continue
        props = next(node for node in material.elems if node.id == b'Properties70')
        for prop in props.elems:
            if prop.props[0] in (b'Diffuse', b'DiffuseColor'):
                prop.props[4:] = colors[name]
            if name.startswith(b'Eyes') and prop.props[0] in (b'Emissive', b'EmissiveColor'):
                prop.props[4:] = (.68, .56, .31)


def encode(node):
    types = dict(B='bool', C='char', Z='int8', Y='int16', I='int32', L='int64', F='float32', D='float64',
                 R='bytes', S='string', i='int32_array', l='int64_array', f='float32_array', d='float64_array',
                 b='bool_array', c='byte_array')
    element = encode_bin.FBXElem(node.id)
    for kind, value in zip(node.props_type, node.props):
        getattr(element, 'add_' + types[chr(kind)])(value)
    element.elems = [encode(child) for child in node.elems]
    return element


def main():
    kind, source, destination = sys.argv[sys.argv.index('--') + 1:]
    if Path(source).resolve() == Path(destination).resolve():
        raise ValueError("Use a separate output path to preserve the source.")
    root, version = parse_fbx.parse(source)
    sections = {node.id: node for node in root.elems}
    if kind == 'bigfoot':
        # The source mesh includes a broken, unused toe rotation. Its three actual actions are separate FBXs.
        remove_objects(sections, {b'AnimationCurve', b'AnimationCurveNode', b'AnimationStack', b'AnimationLayer'})
        root.elems[:] = [node for node in root.elems if node.id != b'Takes']
    elif kind == 'iron-giant':
        # None of its eight external PNGs exists in the upstream package.
        remove_objects(sections, {b'Texture', b'Video'})
        restore_materials(sections[b'Objects'])
    else:
        raise ValueError(kind)
    encode_bin.write(destination, encode(root), version)


if __name__ == '__main__':
    main()
