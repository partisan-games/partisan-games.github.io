"""Prepare the locally available OBJ of the downloaded B6L6 model, without changing its triangles."""
from pathlib import Path
import json
import hashlib
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / 'junkers-ju-87-stuka'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=str(SOURCE / 'B6L6UIB83ZKUE6YOCT94DAHM3.obj'))
source = bpy.context.selected_objects[0]
world = [source.matrix_world @ v.co for v in source.data.vertices]
scale = 9.92 / (max(v.y for v in world) - min(v.y for v in world))
def transform(v):
    # The source nose is +X. glTF converts Blender +Y to Three.js -Z.
    return Vector((-v.y, v.x, v.z)) * scale

# Find disconnected propeller blades and their root fittings by their position at the nose.
keys = [tuple(round(c, 5) for c in p) for p in world]
adjacent = {}
for face in source.data.polygons:
    for vertex in face.vertices:
        adjacent.setdefault(keys[vertex], set()).update(keys[i] for i in face.vertices)
seen, blade_keys = set(), set()
for key in adjacent:
    if key in seen:
        continue
    pending, component = [key], set()
    while pending:
        current = pending.pop()
        if current in component:
            continue
        component.add(current)
        pending.extend(adjacent[current] - component)
    seen.update(component)
    if min(p[0] for p in component) > .91:
        blade_keys.update(component)

materials = list(source.data.materials)
for material in materials:
    if material.use_nodes:
        shader = material.node_tree.nodes.get('Principled BSDF')
        if shader:
            shader.inputs['Roughness'].default_value = .8
for image in bpy.data.images:
    if image.source == 'FILE':
        local = SOURCE / Path(image.filepath.replace('\\', '/')).name
        assert local.exists(), f'Missing texture: {local}'
        image.filepath = str(local)
        image.reload()

uv = source.data.uv_layers.active
pivot = transform(Vector((1.0, 0, .147)))
counts = {}
for name, is_blade in [('Airframe', False), ('Propeller', True)]:
    faces = [f for f in source.data.polygons if (keys[f.vertices[0]] in blade_keys) == is_blade]
    origin = pivot if is_blade else Vector()
    vertices, polygons, texcoords = [], [], []
    for face in faces:
        polygons.append(tuple(range(len(vertices), len(vertices) + len(face.vertices))))
        vertices.extend(transform(world[i]) - origin for i in face.vertices)
        texcoords.extend(tuple(uv.data[i].uv) for i in face.loop_indices)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], polygons)
    layer = mesh.uv_layers.new(name='UVMap')
    for loop, coord in zip(layer.data, texcoords):
        loop.uv = coord
    for material in materials:
        mesh.materials.append(material)
    for face, original in zip(mesh.polygons, faces):
        face.material_index = original.material_index
        face.use_smooth = original.use_smooth
    mesh.calc_loop_triangles()
    counts[name] = len(mesh.loop_triangles)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = origin
assert sum(counts.values()) == 1981 and counts['Propeller'] > 0
bpy.data.objects.remove(source, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=str(HERE / 'model.glb'), export_format='GLB', export_animations=False)
metadata = {'source': '../junkers-ju-87-stuka/B6L6UIB83ZKUE6YOCT94DAHM3.obj',
            'downloaded_equivalent': 'B6L6UIB83ZKUE6YOCT94DAHM3.fbx; owner download no longer present',
            'triangles': counts, 'wingspan_metres': 9.92, 'propeller_pivot_blender': list(pivot),
            'license': 'Existing RigModels Personal Use License; License.txt in the source folder',
            'sha256': hashlib.sha256((HERE / 'model.glb').read_bytes()).hexdigest()}
(HERE / 'metadata.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
print(json.dumps(metadata), flush=True)

# Offline preview of the prepared assembly; no browser required.
scene = bpy.context.scene
scene.world = bpy.data.worlds.new('Preview')
scene.world.color = (.35, .35, .35)
bpy.ops.object.camera_add(location=(13, 16, 10))
camera = bpy.context.object
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 14
scene.camera = camera
for location, energy in [((4, 5, 10), 1800), ((-5, -3, 6), 1200)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = energy
    light.data.size = 8
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.resolution_x = 800
scene.render.resolution_y = 600
scene.render.resolution_percentage = 100
scene.render.filepath = str(HERE / 'preview.png')
bpy.ops.render.render(write_still=True)
