"""Run with Blender 4.5 in background: --python scripts/optimize-b17.py -- source.glb output.glb."""

import json
import struct
import sys
from collections import defaultdict
from pathlib import Path

import bpy


def glb_json(path):
    data = path.read_bytes()
    length, = struct.unpack_from("<I", data, 12)
    return json.loads(data[20:20 + length]), data[20 + length:]


def restore_materials(source, output):
    original, original_chunk = glb_json(source)
    model, binary_chunk = glb_json(output)
    model["asset"]["extras"] = original["asset"]["extras"]
    source_slots = {material["name"]: i for i, material in enumerate(original["materials"])}
    for mesh in model["meshes"]:
        for primitive in mesh["primitives"]:
            name = model["materials"][primitive["material"]]["name"]
            primitive["material"] = source_slots[name]

    # Copy the original encoded images and sampler settings verbatim. Discard the exporter's image views.
    image_views = {image["bufferView"] for image in model["images"]}
    views = []
    binary = bytearray()

    def copy_view(view, chunk):
        offset = view.get("byteOffset", 0) + 8  # The first eight bytes are the binary chunk header.
        length = view["byteLength"]
        binary.extend(b"\0" * (-len(binary) % 4))
        views.append({**view, "byteOffset": len(binary)})
        binary.extend(chunk[offset:offset + length])
        return len(views) - 1

    indices = {i: copy_view(view, binary_chunk) for i, view in enumerate(model["bufferViews"]) if i not in image_views}
    for accessor in model["accessors"]:
        accessor["bufferView"] = indices[accessor["bufferView"]]
    for image in original["images"]:
        image["bufferView"] = copy_view(original["bufferViews"][image["bufferView"]], original_chunk)
    for key in ("images", "textures", "materials", "samplers"):
        model[key] = original[key]
    model["bufferViews"] = views
    binary.extend(b"\0" * (-len(binary) % 4))
    model["buffers"][0]["byteLength"] = len(binary)
    raw = json.dumps(model, separators=(",", ":")).encode()
    raw += b" " * (-len(raw) % 4)
    output.write_bytes(struct.pack("<4sII", b"glTF", 2, 28 + len(raw) + len(binary))
                       + struct.pack("<I4s", len(raw), b"JSON") + raw
                       + struct.pack("<I4s", len(binary), b"BIN\0") + binary)


def main(source, output):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene = bpy.context.scene
    parts = [obj for obj in scene.objects if obj.type == "MESH"]
    names = {obj: obj.name.removesuffix(".001") for obj in parts}

    for obj in parts:
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = world
    for obj in list(scene.objects):
        if obj.type == "EMPTY":
            bpy.data.objects.remove(obj, do_unlink=True)
    for obj in parts:
        obj.name = names[obj]

    batches = defaultdict(list)
    for obj in parts:
        material, = obj.data.materials
        name = obj.name.lower()
        # Leave the alpha panes separate for depth sorting and the propeller discs under their original names.
        if material.surface_render_method == "BLENDED":
            continue
        # Keep small parts and the distinctive turret and blade geometry. Reduce dense surfaces around them.
        anchors = any(token in name for token in ("torreta", "cupul", "bola", "helice"))
        if len(obj.data.polygons) > 500 and not anchors:
            bpy.context.view_layer.objects.active = obj
            modifier = obj.modifiers.new("Simplify dense surfaces", "DECIMATE")
            modifier.ratio = 0.50
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        batches[material].append(obj)

    for material, group in batches.items():
        if len(group) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for obj in group:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        bpy.ops.object.join()
        group[0].name = material.name + "-batch"

    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", export_extras=True)
    restore_materials(source, output)


if __name__ == "__main__":
    source, output = map(Path, sys.argv[sys.argv.index("--") + 1:])
    if source.resolve() == output.resolve():
        raise ValueError("Use a separate path for the optimized model.")
    main(source, output)
