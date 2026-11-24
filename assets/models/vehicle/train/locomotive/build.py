"""Blender 4.5: the steam locomotive with each wheel a part of its own, so the game can turn them.

blender --background --factory-startup --python build.py

The supplied model.fbx is one mesh. Its loose parts are split apart; the red spokes and the black rims around one
axle on one side become the object `wheel-N`, its origin on that axle, and the rest is the object `body`. The result,
locomotive.glb, stands on the ground at its middle, its front ahead along -Y (+Z in the game), in metres.
"""
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(ROOT / 'model.fbx'))
source = bpy.context.scene.objects[0]
bpy.context.view_layer.objects.active = source
source.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']


def bounds(objects):
    corners = [o.matrix_world @ Vector(c) for o in objects for c in o.bound_box]
    low = Vector([min(c[i] for c in corners) for i in range(3)])
    high = Vector([max(c[i] for c in corners) for i in range(3)])
    return low, high


def red(part):
    return any(part.data.materials[p.material_index].name == 'red' for p in part.data.polygons)


# The axles turn about x; a wheel is round in y and z and thin in x.
def round_disc(part):
    low, high = bounds([part])
    size = high - low
    return size.x < .12 and size.y > .3 and abs(size.y - size.z) < .05


axles = []
for spokes in (p for p in parts if red(p) and round_disc(p)):
    low, high = bounds([spokes])
    axles.append((low + high) / 2)
axles.sort(key=lambda c: (c.x > 0, c.y))
assert len(axles) == 8, f'expected 8 wheels, found {len(axles)}'

wheels = []
for index, axle in enumerate(axles):
    group = []
    for part in parts:
        low, high = bounds([part])
        center = (low + high) / 2
        same_side = (center.x > 0) == (axle.x > 0) and abs(center.x - axle.x) < .1
        if same_side and round_disc(part) and (center.yz - axle.yz).length < .03:
            group.append(part)
    bpy.ops.object.select_all(action='DESELECT')
    for part in group:
        part.select_set(True)
    bpy.context.view_layer.objects.active = group[0]
    bpy.ops.object.join()
    wheel = bpy.context.view_layer.objects.active
    wheel.name = f'wheel-{index}'
    low, high = bounds([wheel])
    bpy.context.scene.cursor.location = Vector(((low.x + high.x) / 2, axle.y, axle.z))
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    wheels.append(wheel)
    parts = [p for p in parts if p not in group]

bpy.ops.object.select_all(action='DESELECT')
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
body.name = 'body'

# the whole stands on the ground at its middle
low, high = bounds([body, *wheels])
shift = Vector(((low.x + high.x) / -2, (low.y + high.y) / -2, -low.z))
for item in (body, *wheels):
    item.location += shift
bpy.context.scene.cursor.location = Vector()
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

bpy.ops.export_scene.gltf(filepath=str(ROOT / 'locomotive.glb'), export_format='GLB',
                          export_animations=False, export_materials='EXPORT')
low, high = bounds([body, *wheels])
print('LOCOMOTIVE:', len(wheels), 'wheels, size', tuple(round(v, 2) for v in high - low),
      'radii', sorted({round((bounds([w])[1].z - bounds([w])[0].z) / 2, 3) for w in wheels}))
