"""Normalize the downloaded sandbag wall to metres and embed its supplied texture."""
from pathlib import Path
import json
import hashlib
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(HERE / 'source/model.fbx'))
model = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
points = [model.matrix_world @ vertex.co for vertex in model.data.vertices]
low = Vector([min(p[i] for p in points) for i in range(3)])
high = Vector([max(p[i] for p in points) for i in range(3)])
scale = 1.1 / (high.z - low.z)
origin = Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
model.matrix_world.identity()
for vertex, point in zip(model.data.vertices, points):
    vertex.co = (point - origin) * scale
model.name = 'Sandbags'
material = bpy.data.materials.new('sandbags')
material.use_nodes = True
shader = material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value = .95
image = material.node_tree.nodes.new('ShaderNodeTexImage')
image.image = bpy.data.images.load(str(HERE / 'source/sandbags01.png'))
material.node_tree.links.new(image.outputs['Color'], shader.inputs['Base Color'])
model.data.materials.clear()
model.data.materials.append(material)
for face in model.data.polygons:
    face.material_index = 0
model.data.calc_loop_triangles()
bpy.ops.object.select_all(action='DESELECT')
model.select_set(True)
bpy.context.view_layer.objects.active = model
bpy.ops.export_scene.gltf(filepath=str(HERE / 'sandbags.glb'), export_format='GLB',
                          use_selection=True, export_animations=False)
bpy.context.view_layer.update()
report = {'triangles': len(model.data.loop_triangles), 'dimensions_blender_xyz': list(model.dimensions),
          'height_metres': 1.1, 'source': 'Owner-supplied download D:/Downloads/sandbags',
          'author': 'Not supplied', 'license': 'Not supplied; original files retained without relicensing',
          'changes': 'Uniform scale; centered horizontally; base at zero; supplied albedo embedded; geometry preserved',
          'sha256': {str(p.relative_to(HERE)): hashlib.sha256(p.read_bytes()).hexdigest()
                     for p in [HERE / 'source/model.fbx', HERE / 'source/sandbags01.png', HERE / 'sandbags.glb']}}
(HERE / 'metadata.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
