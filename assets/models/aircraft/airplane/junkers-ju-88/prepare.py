import bpy, sys, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
src, out, ratio, shot = argv[0], argv[1], float(argv[2]), argv[3]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
def tris():
    dg = bpy.context.evaluated_depsgraph_get()
    n = 0
    for o in meshes:
        m = o.evaluated_get(dg).to_mesh()
        m.calc_loop_triangles(); n += len(m.loop_triangles)
        o.evaluated_get(dg).to_mesh_clear()
    return n
before = tris()
if ratio < 1:
    shares = {'Engine': ratio, 'Cockpit_frame': .5}
    # thin loose parts, the blades, keep their shape: only the bulky parts are reduced
    engine = next(o for o in meshes if 'Engine' in o.name)
    bpy.context.view_layer.objects.active = engine; engine.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    meshes[:] = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    parts = [o for o in meshes if 'Engine' in o.name]
    span = max(max(o.dimensions) for o in meshes if 'Main_Wings' in o.name)
    for o in parts:
        # specks too small to see from the chase camera go; small parts, the blades among them, keep their shape
        if max(o.dimensions) < .01 * span:
            bpy.data.objects.remove(o)
        elif len(o.data.polygons) <= 30: o.name = 'keep_' + o.name
    meshes[:] = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    print('SPAN', span)
    for o in meshes:
        share = 1 if o.name.startswith('keep_') else next((v for k, v in shares.items() if k in o.name), 1)
        if share < 1:
            d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = share; d.use_collapse_triangulate = True
print('NAMES', [(o.name, len(o.data.polygons)) for o in meshes])
after = tris()
print('TRIS', before, after)
if out != '-':
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True)
# render a preview
lo = Vector((1e9,)*3); hi = Vector((-1e9,)*3)
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
center = (lo + hi) / 2; size = (hi - lo).length
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = center + Vector((size*.7, -size*.7, size*.5))
cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.rotation_euler = (.8, .2, .5); bpy.context.scene.collection.objects.link(sun)
w = bpy.data.worlds.new('w'); w.color = (.6, .65, .7); bpy.context.scene.world = w
r = bpy.context.scene.render; r.engine = 'BLENDER_WORKBENCH'; r.resolution_x, r.resolution_y = 640, 400
bpy.context.scene.display.shading.color_type = 'TEXTURE'; bpy.context.scene.display.shading.light = 'STUDIO'
r.filepath = shot; bpy.ops.render.render(write_still=True)
