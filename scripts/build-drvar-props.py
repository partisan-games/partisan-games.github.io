"""Run in Blender background mode from the repository root to export the Drvar props."""
from math import cos, radians, sin, tau
from pathlib import Path
from random import Random

import bpy
from mathutils import Vector


ROOT = Path.cwd() / "assets"


def material(name, color, texture=None):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*color, 1)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = result.diffuse_color
    shader.inputs["Roughness"].default_value = .88
    if texture:
        image = result.node_tree.nodes.new("ShaderNodeTexImage")
        image.image = bpy.data.images.load(str(ROOT / "images/textures" / texture), check_existing=True)
        tint = result.node_tree.nodes.new("ShaderNodeMix")
        tint.data_type = "RGBA"
        tint.blend_type = "MULTIPLY"
        factor, base, pigment = (next(pin for pin in tint.inputs if pin.identifier == identifier)
                                 for identifier in ["Factor_Float", "A_Color", "B_Color"])
        factor.default_value = 1
        pigment.default_value = result.diffuse_color
        result.node_tree.links.new(image.outputs["Color"], base)
        result.node_tree.links.new(next(pin for pin in tint.outputs if pin.identifier == "Result_Color"),
                                   shader.inputs["Base Color"])
    return result


def shape(name, vertices, faces, finish):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    uv = data.uv_layers.new()
    for face in data.polygons:
        axis = max(range(3), key=lambda i: abs(face.normal[i]))
        u, v = [i for i in range(3) if i != axis]
        for index in face.loop_indices:
            point = data.vertices[data.loops[index].vertex_index].co
            uv.data[index].uv = (point[u] / 1.7, point[v] / 1.7)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(finish)
    return obj


def box(name, location, size, finish):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(finish)
    return obj


def beam(name, start, end, width, finish):
    a, b = Vector(start), Vector(end)
    obj = box(name, (a + b) / 2, (width, width, (b - a).length), finish)
    obj.rotation_euler = (b - a).to_track_quat("Z", "Y").to_euler()
    return obj


def export(path):
    target = ROOT / "models" / path
    target.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            for modifier in list(obj.modifiers):
                bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.join()
    bpy.ops.export_scene.gltf(filepath=str(target), export_format="GLB", export_image_format="WEBP", export_yup=True)


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def stone_house(collapsed=False):
    stone = material("Rough limestone", (.63, .57, .48), "walls/stone-wall.jpg")
    burnt = material("Scorched stone", (.19, .15, .12), "walls/stone-wall.jpg")
    smoke = material("Smoke stained stone", (.38, .31, .25), "walls/stone-wall.jpg")
    chips = material("Shrapnel pits", (.125, .097, .072))
    timbers = material("Charred rafters", (.15, .095, .065))
    tiles = material("Damaged clay tiles", (.47, .32, .25), ROOT / "models/building/town/ruins-building/Roof_Tiles.jpg")
    for left, right in [(-3.5, -2.48), (-1.42, -.825), (.825, 1.42), (2.48, 3.5)]:
        box("Facade stone", ((left + right) / 2, -2.85, 1.8), (right - left, .36, 3.6), stone)
    for x in [-1.95, 1.95]:
        box("Window sill wall", (x, -2.85, .46), (1.06, .36, .92), stone)
        box("Window head", (x, -2.85, 3.19), (1.06, .36, .82), stone)
        # Smoke rises unevenly from the opening. Both layers use the wall's continuous UVs.
        for depth, stain, profile in [(-3.034, smoke, [(-.54, 2.78), (.54, 2.78), (.47, 3.17), (.28, 3.36),
                                                         (.14, 3.66), (-.04, 3.52), (-.36, 3.72), (-.35, 3.28)]),
                                       (-3.038, burnt, [(-.44, 2.78), (.43, 2.78), (.32, 3.08), (.06, 3.27),
                                                        (-.13, 3.42), (-.21, 3.19), (-.37, 3.11)])]:
            shape("Soot above window", [(x + dx, depth, z) for dx, z in profile],
                  [tuple(range(len(profile)))], stain)
    box("Lintel above entry", (0, -2.85, 3.13), (1.65, .36, .94), stone)
    outline = [(3.55, 3.6), (2.26, 4.42), (1.08, 5.18), (0, 5.9), (-1.15, 5.15),
               (-2.35, 4.37), (-3.55, 3.6), (0, 3.6)]
    if collapsed:
        outline[:3] = [(3.42, 3.6), (2.19, 3.93), (1.18, 4.7)]
    ring = []
    for radius in [0, .47]:
        for x, z in outline:
            offset = Vector((x, z - 4.55))
            if radius:
                offset = offset.normalized() * radius
            ring.append((offset.x, -2.86, offset.y + 4.55))
    gable = shape("Gable with round opening", ring, [(i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8) for i in range(8)], stone)
    thickness = gable.modifiers.new("Masonry thickness", "SOLIDIFY")
    thickness.thickness = .34
    thickness.offset = 0
    for side, lengths in [(-1, [3.5, 2.75, 2.05, 1.2, .75]), (1, [3.4, 2.9, 1.85, 1.5, .95])]:
        if collapsed and side == 1:
            lengths = [2.85, 1.25, .62, .35, .28]
        for i, height in enumerate(lengths):
            box("Broken side wall", (side * 3.34, -2.18 + i * 1.12, height / 2), (.36, 1.12, height), stone)
    box("Standing chimney", (-2.5, 1.45, 2.65), (.82, .83, 5.3), stone)
    box("Chimney cap", (-2.5, 1.45, 5.34), (.96, .97, .16), burnt)
    beam("Broken rafter", (-3.35, -2.05, 3.6), (.18, -1.8, 5.77), .18, timbers)
    beam("Fallen rafter", (-.45, .45, .23), (2.27, 1.8, 1.55), .19, timbers)
    if collapsed:
        slab = [(1.3, -.8, .56), (2.9, -.63, .32), (3.15, 1.12, .25), (2.5, 1.52, .46),
                (2.21, 1.26, .65), (1.78, 1.56, .92), (1.18, .66, 1.03)]
    else:
        slab = [(-3.55, -2.99, 3.66), (-.08, -2.99, 5.86), (-.08, -1.61, 5.86), (-.76, -1.80, 5.43),
                (-1.24, -1.18, 5.12), (-1.84, -1.49, 4.74), (-2.31, -.78, 4.44), (-3.55, -.97, 3.66)]
    roof = shape("Broken clay tile roof", slab, [tuple(range(len(slab)))], tiles)
    roof.modifiers.new("Tile and lath thickness", "SOLIDIFY").thickness = .08
    rng = Random(72 if collapsed else 25)
    for center in [-2.83, 2.83]:
        for _ in range(15):
            x = center + rng.uniform(-.46, .46)
            z = rng.uniform(.52, 2.98)
            radius = rng.uniform(.026, .087)
            points = [(x + radius * cos(i * tau / 6) * rng.uniform(.66, 1.24), -3.036,
                       z + radius * sin(i * tau / 6) * rng.uniform(.66, 1.24)) for i in range(6)]
            shape("Shrapnel pit in stone", points, [tuple(range(6))], chips)
    # Match the churchyard wall's 2.5 m repeat across the facade, sills and gable.
    bpy.context.view_layer.update()
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.data.materials[0] not in (stone, burnt, smoke):
            continue
        data = obj.data
        uv = data.uv_layers.active.data
        for face in data.polygons:
            axis = max(range(3), key=lambda i: abs(face.normal[i]))
            u, v = [i for i in range(3) if i != axis]
            for index in face.loop_indices:
                point = obj.matrix_world @ data.vertices[data.loops[index].vertex_index].co
                uv[index].uv = (point[u] / 2.5, point[v] / 2.5)
    name = "drvar-collapsed-house" if collapsed else "drvar-stone-house"
    export(f"building/ruins/{name}.glb")


if __name__ == "__main__":
    for build in [stone_house, lambda: stone_house(collapsed=True)]:
        clear()
        build()
