"""Offline UV inspection and preview; leaves the source FBX unchanged."""
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(HERE.parent / 'renault-ft.fbx'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
model = meshes[0]
uv = model.data.uv_layers.active
# Original UV islands overlap: isolate the running gear in the atlas's right half.
# Components are numbered by their first source vertex, not Blender object names.
adjacent = [set() for _ in model.data.vertices]
for polygon in model.data.polygons:
    for vertex in polygon.vertices:
        adjacent[vertex].update(polygon.vertices)
components = {}
component = 0
for vertex in range(len(adjacent)):
    if vertex in components:
        continue
    pending = [vertex]
    while pending:
        current = pending.pop()
        if current in components:
            continue
        components[current] = component
        pending.extend(adjacent[current] - components.keys())
    component += 1
assert component == 72, 'Source geometry changed; review running-gear assignment'
running_gear = set(range(9, 32)) | set(range(38, 61))
for polygon in model.data.polygons:
    offset = .52 if components[polygon.vertices[0]] in running_gear else .02
    for loop in polygon.loop_indices:
        uv.data[loop].uv.x = offset + uv.data[loop].uv.x * .46
bpy.context.view_layer.objects.active = model
model.select_set(True)
texture = ROOT / 'assets/images/textures/vehicles/renault-ft.webp'
assert texture.exists(), 'Prepare the generated albedo before building'
material = bpy.data.materials.new('Renault FT')
material.use_nodes = True
shader = material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = .85
image = material.node_tree.nodes.new('ShaderNodeTexImage')
image.image = bpy.data.images.load(str(texture))
material.node_tree.links.new(image.outputs['Color'], shader.inputs['Base Color'])
model.data.materials.clear()
model.data.materials.append(material)
for face in model.data.polygons:
    face.material_index = 0
# Runtime overrides this material with the external atlas, just as for the source FBX.
material.node_tree.nodes.remove(image)
bpy.ops.export_scene.fbx(filepath=str(HERE / 'textured.fbx'), use_selection=True,
                         object_types={'MESH'}, bake_anim=False, path_mode='STRIP')
# Preview the actual exported artifact and reject geometry/transform regressions.
source_points = [model.matrix_world @ vertex.co for vertex in model.data.vertices]
source_faces = len(model.data.polygons)
bpy.data.objects.remove(model, do_unlink=True)
bpy.ops.import_scene.fbx(filepath=str(HERE / 'textured.fbx'))
model = next(o for o in bpy.context.selected_objects if o.type == 'MESH')
exported_points = [model.matrix_world @ vertex.co for vertex in model.data.vertices]
assert len(exported_points) == len(source_points)
assert len(model.data.polygons) == source_faces
assert max(min((point - original).length for original in source_points) for point in exported_points) < .00001
image = material.node_tree.nodes.new('ShaderNodeTexImage')
image.image = bpy.data.images.load(str(texture), check_existing=True)
material.node_tree.links.new(image.outputs['Color'], shader.inputs['Base Color'])
model.data.materials.clear()
model.data.materials.append(material)
for face in model.data.polygons:
    face.material_index = 0
print(f'PASS: {len(exported_points)} vertices, {source_faces} faces, world positions preserved within 0.01 mm', flush=True)
corners = [model.matrix_world @ Vector(corner) for corner in model.bound_box]
center = sum(corners, Vector()) / 8
span = max(max(v[i] for v in corners) - min(v[i] for v in corners) for i in range(3))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 1000
scene.render.resolution_y = 750
scene.render.resolution_percentage = 100
scene.world.color = (.3, .3, .3)
scene.view_settings.view_transform = 'Standard'
bpy.ops.object.camera_add(location=center + Vector((span * 1.2, -span * 1.5, span * .85)))
camera = bpy.context.object
camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = span * 1.4
scene.camera = camera
for offset, power, size in [((2, -3, 4), 1500, 5), ((-3, 1, 2), 900, 4)]:
    bpy.ops.object.light_add(type='AREA', location=center + Vector(offset))
    lamp = bpy.context.object
    lamp.data.energy = power
    lamp.data.shape = 'DISK'
    lamp.data.size = size
    lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
for name, offset in [('preview', (1.2, 1.5, .85)), ('rear', (1.2, -1.5, .85))]:
    camera.location = center + Vector(offset) * span
    camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(HERE / f'{name}.png')
    bpy.ops.render.render(write_still=True)
