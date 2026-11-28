"""Run in Blender background mode from the repository root to rebuild the Kraljevo wreck."""
from collections import defaultdict
from math import atan2, exp, sin, sqrt
from pathlib import Path
from random import Random
import sys

import bpy
from mathutils import Euler, Vector


FOLDER = Path("assets/models/weapon/cannon").resolve()
FINISHES = {
    "barrel": ((0, 0, .84), (.10, .22, -.36), (-.13, .08, -.19)),
    "carriage": ((0, -.2, .58), (.04, -.05, -.19), (.09, .27, -.12)),
    "left-wheel": ((-.66, 0, .66), (-.67, .38, -.4), (.10, -1.46, .22)),
    "right-wheel": ((.66, 0, .66), (.03, -.15, -.14), (-.18, .46, -.16)),
    "left-trail": ((-.14, -.48, .54), (-.03, -.06, -.10), (.08, -.14, -.16)),
    "right-trail": ((.14, -.48, .54), (.19, -.12, -.13), (-.09, .16, .20)),
    "plate": ((0, .1, .68), (.08, .60, -.50), (.18, -.30, -.22)),
}


def islands(mesh):
    """Treat duplicated seam vertices as one point while keeping the original faces."""
    owners, parents = {}, {}

    def root(face):
        while parents[face] != face:
            face = parents[face]
        return face

    for face in mesh.polygons:
        parents[face.index] = face.index
        for index in face.vertices:
            point = tuple(round(axis, 5) for axis in mesh.vertices[index].co)
            first = owners.setdefault(point, face.index)
            parents[root(face.index)] = root(first)
    groups = defaultdict(list)
    for face in mesh.polygons:
        groups[root(face.index)].append(face)
    return groups.values()


def classify(obj, faces, points):
    if obj.parent.name == "Elevation":
        return "barrel"
    if obj.name == "Mesh_10" and len(faces) == 12:
        return "plate"
    center = (sum(points, Vector()) / len(points))
    side = "left" if center.x < 0 else "right"
    if abs(center.x) > .50 and abs(center.y) < .73:
        return f"{side}-wheel"
    if center.y < -.74:
        return f"{side}-trail"
    return "carriage"


def collect_parts(root):
    parts = defaultdict(list)
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        for component in islands(obj.data):
            points = {i: obj.matrix_world @ obj.data.vertices[i].co
                      for face in component for i in face.vertices}
            name = classify(obj, component, list(points.values()))
            for face in component:
                material = obj.data.materials[face.material_index]
                base = material.node_tree.nodes.get("Principled BSDF").inputs["Base Color"].default_value
                parts[name].append((obj.name, tuple(face.vertices), points, base[:3], face.use_smooth))
    return parts


def shape_point(name, point, pivot, rotation, offset):
    local = point - pivot
    if name == "barrel":
        bend = max(0, local.y - .14) ** 1.65
        local.x += .34 * bend
        local.z -= .24 * bend
    elif name == "plate":
        local.x *= 1.7
        local.y *= 1.65
        local.z = local.z * .24 + .13 * max(0, local.x + local.y) ** 1.3
    return pivot + rotation @ local + offset


def stain(name, point, base):
    x, y, z = point
    soot = exp(-((x - .12) ** 2 * 4 + (y - .20) ** 2 * 2.4 + (z - .72) ** 2))
    grain = .5 + .25 * sin(x * 31 - y * 27 + z * 36) + .25 * sin(y * 59 + z * 41)
    severity = .24 + .58 * soot + .15 * grain
    if name == "barrel":
        angle = atan2(z - .84, x)
        burn_band = exp(-((y - .46 - .035 * sin(3 * angle)) / .16) ** 2)
        severity = max(severity, .42 + .55 * burn_band)
    if name.endswith("wheel"):
        severity *= .82
    ash = (.020, .015, .012)
    return (*(v + (a - v) * severity for v, a in zip(base, ash)), 1)


def finish_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = .88
    shader.inputs["Metallic"].default_value = .06
    return material, shader


def painted_plate():
    """A small opaque pixel map with a soot bloom and broken-edged bright shrapnel marks."""
    rng = Random(7575)
    size = 128
    scars = [(rng.randrange(12, 118), rng.randrange(12, 115), rng.choice([2, 3, 4, 6]), rng.choice([-1, 1]))
             for _ in range(18)]
    pixels = []
    for y in range(size):
        for x in range(size):
            d = sqrt(((x - 81) / 40) ** 2 + ((y - 58) / 32) ** 2)
            soot = max(0, min(1, 1.22 - d + .11 * sin(x * .24 + y * .31) + .05 * sin(x + y * .8)))
            soot = round(soot * 7) / 7
            gray = .29 - .267 * soot + rng.choice([-.009, 0, 0, 0, .009])
            rgb = (gray * .90, gray * .87, gray * .69)
            for sx, sy, length, slope in scars:
                dx, dy = x - sx, y - sy
                line = dy - slope * (dx // 2)
                if abs(dx) <= length and abs(line) < 2:
                    rgb = (.46, .41, .32) if line == 1 else (.026, .019, .014)
                    break
            pixels.extend((*rgb, 1))
    image = bpy.data.images.new("Plate soot and shrapnel", width=size, height=size, alpha=False)
    image.pixels.foreach_set(pixels)
    image.pack()
    material, shader = finish_material("Scored carriage plate")
    texture = material.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    material.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    return material


def make_part(name, entries, parent, material):
    pivot, offset, angles = FINISHES[name]
    pivot, offset, rotation = Vector(pivot), Vector(offset), Euler(angles).to_matrix()
    vertices, indices, faces, colors = [], {}, [], []
    source_points = []
    for source, face, points, base, smooth in entries:
        polygon = []
        for i in face:
            key = (source, i)
            if key not in indices:
                indices[key] = len(vertices)
                vertices.append(shape_point(name, points[i], pivot, rotation, offset))
                source_points.append(points[i])
            polygon.append(indices[key])
            colors.append(stain(name, points[i], base))
        faces.append(polygon)

    lowest = min(point.z for point in vertices)
    # Detached parts should rest on the original ground plane; the barrel and plate lie on the wreck.
    shift = -lowest if name.endswith("wheel") or name.endswith("trail") or lowest < 0 else 0
    if shift:
        for point in vertices:
            point.z += shift

    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.data.materials.append(material)
    for polygon, entry in zip(data.polygons, entries):
        polygon.use_smooth = entry[-1]
    if name == "plate":
        uv = data.uv_layers.new().uv
        for loop in data.loops:
            point = source_points[loop.vertex_index]
            uv[loop.index].vector = ((point.x + .25) * 2, (point.y + .14) / .48)
    else:
        layer = data.color_attributes.new(name="Scorched paint", type="BYTE_COLOR", domain="CORNER")
        for i, color in enumerate(colors):
            layer.data[i].color = color
        data.color_attributes.active_color = layer
    return obj


def render_preview(folder):
    scene = bpy.context.scene
    scene.world = bpy.data.worlds.new("Overcast")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.34, .37, .41, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .44
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.015))
    soil, shader = finish_material("Preview floor")
    shader.inputs["Base Color"].default_value = (.17, .16, .12, 1)
    bpy.context.object.data.materials.append(soil)
    for position, energy, size in [((3, 4, 6), 650, 5), ((-5, -2, 4), 440, 4), ((1, -4, 3), 270, 3)]:
        bpy.ops.object.light_add(type="AREA", location=position)
        light = bpy.context.object
        light.data.energy, light.data.shape, light.data.size = energy, "DISK", size
        light.rotation_euler = (-light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    camera.data.type, camera.data.ortho_scale = "ORTHO", 5.4
    scene.camera = camera
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 12
    scene.render.resolution_x, scene.render.resolution_y = 600, 400
    scene.render.resolution_percentage = 100
    for view, position in [("front", (3.5, 5.5, 2.8)), ("rear", (-4, -4, 2.65))]:
        camera.location = position
        camera.rotation_euler = (Vector((0, -.50, .38)) - camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(folder / f"field-gun-wreck-{view}.png")
        bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(FOLDER / "field-gun-75.glb"))
    root = bpy.data.objects["FieldGun"]
    parts = collect_parts(root)
    assert parts.keys() == FINISHES.keys()
    for obj in root.children_recursive:
        bpy.data.objects.remove(obj, do_unlink=True)
    root.name = "FieldGunWreck"
    painted, shader = finish_material("Charred timber and metal")
    vertex_colors = painted.node_tree.nodes.new("ShaderNodeVertexColor")
    vertex_colors.layer_name = "Scorched paint"
    painted.node_tree.links.new(vertex_colors.outputs["Color"], shader.inputs["Base Color"])
    plate = painted_plate()
    for name, faces in parts.items():
        make_part(name, faces, root, plate if name == "plate" else painted)
    bpy.ops.export_scene.gltf(filepath=str(FOLDER / "field-gun-75-wreck.glb"), export_format="GLB")
    if "--" in sys.argv:
        render_preview(Path(sys.argv[sys.argv.index("--") + 1]))


if __name__ == "__main__":
    main()
