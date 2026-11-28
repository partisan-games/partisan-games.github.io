"""Run from the repository root in Blender background mode to paint the gun's damaged appearance."""
from math import atan2, exp, hypot, sin
from pathlib import Path
from runpy import run_path
import sys

import bpy


FOLDER = Path("assets/models/weapon/cannon").resolve()
TILE_WIDTH, TILE_HEIGHT = 192, 96
# Each projection maps an existing face along its strongest normal. Bounds include the complete source mesh.
PROJECTIONS = [
    ((1, 2), (-2.70, 1.48), (-.05, 1.38)),
    ((0, 2), (-.84, .84), (-.05, 1.38)),
    ((0, 1), (-.84, .84), (-2.70, 1.48)),
]
# Irregular impact blooms and short gouges in the three views, in metres.
IMPACTS = [
    [(-.30, .68, .38, .27), (.36, .82, .23, .13), (.72, .87, .24, .12), (-1.16, .36, .21, .10)],
    [(-.27, .72, .29, .23), (.17, .88, .21, .14), (.6, .41, .13, .14)],
    [(-.21, -.29, .30, .33), (.09, .34, .16, .27), (-.04, .76, .13, .28), (.10, -1.32, .15, .25)],
]
GOUGES = [
    [(-.56, .59, -.31, .71), (-.19, .70, .02, .81), (.25, .81, .49, .88), (.65, .85, .83, .92), (-1.24, .37, -.99, .40)],
    [(-.48, .62, -.22, .75), (-.06, .83, .15, .91), (.58, .38, .65, .50)],
    [(-.44, -.44, -.21, -.21), (-.16, .24, .02, .49), (-.08, .64, .04, .88), (.06, -1.49, .15, -1.22)],
]


def line_distance(x, y, endpoints):
    x1, y1, x2, y2 = endpoints
    dx, dy = x2 - x1, y2 - y1
    fraction = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return hypot(x - x1 - fraction * dx, y - y1 - fraction * dy)


def paint_at(base, x, y, view, destroyed):
    spread = 1.45 if destroyed else .83
    distance = float("inf")
    for cx, cy, rx, ry in (IMPACTS[view] if destroyed else IMPACTS[view][:2]):
        px, py = (x - cx) / (rx * spread), (y - cy) / (ry * spread)
        angle = atan2(py, px)
        edge = 1 + .13 * sin(angle * 5) + .085 * sin(angle * 9 + cx) + .04 * sin(angle * 13)
        distance = min(distance, hypot(px, py) / edge)
    grain = .5 + .3 * sin(x * 107 + y * 163) + .2 * sin(y * 223 - x * 121)
    soot = (.96 if destroyed else .56) * exp(-distance ** 2 * 1.45) * (.86 + .14 * grain)
    ash = (.008, .0065, .0055)
    surface = tuple(value * (.21 + .13 * grain) + residue for value, residue in zip(base, ash)) if destroyed else base
    color = tuple(value + (residue - value) * soot for value, residue in zip(surface, ash))
    if distance < (.22 if destroyed else .14):
        return (.006, .005, .004)
    if .22 <= distance < (.36 if destroyed else .26) and grain > .25:
        return (.18, .145, .105) if destroyed else (.28, .26, .21)
    for gouge in (GOUGES[view] if destroyed else GOUGES[view][:2]):
        gap = line_distance(x, y, gouge)
        if gap < (.026 if destroyed else .014):
            return (.024, .018, .012)
        if gap < (.043 if destroyed else .027) and grain > .25:
            return (.24, .20, .15) if destroyed else (.31, .29, .24)
    return color


def make_atlas(materials, *, destroyed=False):
    width, height = TILE_WIDTH * len(PROJECTIONS), TILE_HEIGHT * len(materials)
    pixels = []
    for material in materials:
        shader = material.node_tree.nodes.get("Principled BSDF")
        color = shader.inputs["Base Color"].default_value[:3]
        for y in range(TILE_HEIGHT):
            for view, (_, (u0, u1), (v0, v1)) in enumerate(PROJECTIONS):
                v = v0 + y / (TILE_HEIGHT - 1) * (v1 - v0)
                for x in range(TILE_WIDTH):
                    u = u0 + x / (TILE_WIDTH - 1) * (u1 - u0)
                    # The source factors are linear. The packed base-color PNG is sRGB.
                    pixels.extend(srgb(value) for value in paint_at(color, u, v, view, destroyed))
                    pixels.append(1)
    image = bpy.data.images.new("Field gun wreck atlas" if destroyed else "Field gun hit atlas",
                                width=width, height=height, alpha=False)
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def srgb(value):
    return 12.92 * value if value <= .0031308 else 1.055 * value ** (1 / 2.4) - .055


def surface_uv(point, normal, row, image):
    view = max(range(3), key=lambda axis: abs(normal[axis]))
    (a, b), (u0, u1), (v0, v1) = PROJECTIONS[view]
    x = (point[a] - u0) / (u1 - u0) * (TILE_WIDTH - 1)
    y = (point[b] - v0) / (v1 - v0) * (TILE_HEIGHT - 1)
    return ((view * TILE_WIDTH + x + .5) / image.size[0], (row * TILE_HEIGHT + y + .5) / image.size[1])


def apply_paint(objects, materials, image):
    for material in materials:
        nodes = material.node_tree.nodes
        shader = nodes.get("Principled BSDF")
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = image
        texture.interpolation = "Closest"
        material.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    rows = {material: row for row, material in enumerate(materials)}
    for obj in objects:
        mesh = obj.data
        uv = mesh.uv_layers.new(name="Impact paint")
        world_normal = obj.matrix_world.to_3x3().inverted().transposed()
        world_vertices = [obj.matrix_world @ vertex.co for vertex in mesh.vertices]
        for face in mesh.polygons:
            normal = world_normal @ face.normal
            row = rows[mesh.materials[face.material_index]]
            for index in face.loop_indices:
                point = world_vertices[mesh.loops[index].vertex_index]
                uv.uv[index].vector = surface_uv(point, normal, row, image)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(FOLDER / "field-gun-75.glb"))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    materials = sorted({mat for obj in meshes for mat in obj.data.materials}, key=lambda mat: mat.name)
    apply_paint(meshes, materials, make_atlas(materials))
    bpy.ops.export_scene.gltf(filepath=str(FOLDER / "field-gun-75-hit.glb"), export_format="GLB")
    if "--" in sys.argv:
        preview = run_path(str(Path(__file__).with_name("build-field-gun-wreck.py")))["render_preview"]
        folder = Path(sys.argv[sys.argv.index("--") + 1])
        preview(folder, label="hit")
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(FOLDER / "field-gun-75.glb"))
        preview(folder, label="intact")


if __name__ == "__main__":
    main()
