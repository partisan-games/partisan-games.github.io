"""Run in Blender background mode from the repository root to rebuild the Kraljevo wreck."""
from collections import defaultdict
from pathlib import Path
from runpy import run_path
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
        world_normal = obj.matrix_world.to_3x3().inverted().transposed()
        for component in islands(obj.data):
            points = {i: obj.matrix_world @ obj.data.vertices[i].co
                      for face in component for i in face.vertices}
            name = classify(obj, component, list(points.values()))
            for face in component:
                material = obj.data.materials[face.material_index]
                parts[name].append((obj.name, tuple(face.vertices), points, material, face.use_smooth, world_normal @ face.normal))
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


def finish_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = .88
    shader.inputs["Metallic"].default_value = .06
    return material, shader


def make_part(name, entries, parent, material, project):
    pivot, offset, angles = FINISHES[name]
    pivot, offset, rotation = Vector(pivot), Vector(offset), Euler(angles).to_matrix()
    vertices, indices, faces, paint_uv = [], {}, [], []
    for source, face, points, original, _, normal in entries:
        polygon = []
        for i in face:
            key = (source, i)
            if key not in indices:
                indices[key] = len(vertices)
                vertices.append(shape_point(name, points[i], pivot, rotation, offset))
            polygon.append(indices[key])
            paint_uv.append(project(points[i], normal, original))
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
        polygon.use_smooth = entry[-2]
    uv = data.uv_layers.new(name="Impact paint").uv
    for index, coords in enumerate(paint_uv):
        uv[index].vector = coords
    return obj


def render_preview(folder, label="wreck"):
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
        scene.render.filepath = str(folder / f"field-gun-{label}-{view}.png")
        bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(FOLDER / "field-gun-75.glb"))
    root = bpy.data.objects["FieldGun"]
    parts = collect_parts(root)
    assert parts.keys() == FINISHES.keys()
    materials = sorted({entry[3] for entries in parts.values() for entry in entries}, key=lambda mat: mat.name)
    rows = {material: row for row, material in enumerate(materials)}
    paint = run_path(str(Path(__file__).with_name("paint-field-gun-hit.py")))
    image = paint["make_atlas"](materials, destroyed=True)

    def project(point, normal, material):
        return paint["surface_uv"](point, normal, rows[material], image)

    for obj in root.children_recursive:
        bpy.data.objects.remove(obj, do_unlink=True)
    root.name = "FieldGunWreck"
    painted, shader = finish_material("Charred timber and metal")
    texture = painted.node_tree.nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Closest"
    painted.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    for name, faces in parts.items():
        make_part(name, faces, root, painted, project)
    bpy.ops.export_scene.gltf(filepath=str(FOLDER / "field-gun-75-wreck.glb"), export_format="GLB")
    if "--" in sys.argv:
        render_preview(Path(sys.argv[sys.argv.index("--") + 1]))


if __name__ == "__main__":
    main()
