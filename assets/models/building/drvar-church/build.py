"""Blender 4.5: reference-led exterior, metres, Z up; export Y up, entrance -Z.

Run with --background --python build.py; --render adds an offline preview.
The supplied FBX remains untouched. This replacement exterior uses original geometry
and the project's existing stone texture, not pixels taken from the reference photo.
"""
import bpy
import math
import random
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(1944)
materials = {}
for name, color in {
    'stone': (.67, .60, .45, 1), 'trim': (.62, .56, .43, 1),
    'foundation': (.43, .40, .32, 1), 'roof': (.29, .105, .045, 1),
    'tile-light': (.32, .12, .05, 1), 'tile-dark': (.26, .09, .038, 1),
    'wood': (.19, .105, .045, 1), 'glass': (.045, .060, .055, 1),
    'shadow': (.014, .017, .014, 1), 'metal': (.23, .25, .23, 1),
}.items():
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = color
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Roughness'].default_value = .94
    materials[name] = mat
stone_image = bpy.data.images.load(str(REPO / 'assets/images/textures/walls/stone-wall.jpg'))
for name in ['stone', 'foundation', 'trim']:
    mat = materials[name]
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = stone_image
    mat.node_tree.links.new(tex.outputs['Color'], mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

batches = {}


def face(material, points):
    vertices, polygons = batches.setdefault(material, ([], []))
    start = len(vertices)
    vertices.extend(points)
    polygons.append(tuple(range(start, start + len(points))))


def box(material, center, size):
    x, y, z = center
    a, b, c = [s / 2 for s in size]
    corners = [(x-a,y-b,z-c),(x+a,y-b,z-c),(x+a,y+b,z-c),(x-a,y+b,z-c),
               (x-a,y-b,z+c),(x+a,y-b,z+c),(x+a,y+b,z+c),(x-a,y+b,z+c)]
    for indices in [(3,2,1,0),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)]:
        face(material, [corners[i] for i in indices])


def arch(surface, center, width, height, material, rim=True, bars=False):
    """An opaque recessed opening with stone voussoirs, in a facade's local plane."""
    center = Vector(center)
    u = Vector((1, 0, 0) if surface == 'front' else (0, 1, 0))
    outward = Vector((0, 1, 0) if surface == 'front' else (1 if center.x > 0 else -1, 0, 0))
    radius = width / 2
    spring = height - radius

    def p(x, z, depth=0):
        return center + u * x + Vector((0, 0, z)) + outward * depth

    arc = [(-radius, 0), (radius, 0), (radius, spring)]
    arc += [(radius * math.cos(i * math.pi / 16), spring + radius * math.sin(i * math.pi / 16)) for i in range(1, 17)]
    reverse = surface == 'front' or center.x < 0
    def outward_face(material, points):
        face(material, list(reversed(points)) if reverse else points)
    outward_face(material, [p(x, z, .026) for x, z in arc])
    if rim:
        thickness = .12
        for sign in [-1, 1]:
            a, b = sign * radius, sign * (radius + thickness)
            points = [p(a,0,.055),p(b,0,.055),p(b,spring,.055),p(a,spring,.055)]
            outward_face('trim', points if sign > 0 else list(reversed(points)))
        for i in range(12):
            a, b = i * math.pi / 12 + .012, (i+1) * math.pi / 12 - .012
            points = [p(r * math.cos(t), spring + r * math.sin(t), .06)
                      for r, t in [(radius,a),(radius+thickness,a),(radius+thickness,b),(radius,b)]]
            outward_face('trim', points)
    if bars:
        # Narrow, sober glazing and iron mullions rather than the old stained glass.
        for offset in [-width * .23, 0, width * .23]:
            top = spring + math.sqrt(max(0, radius * radius - offset * offset))
            a, b = p(offset, .02, .045), p(offset, top-.04, .045)
            size = (.028, .035, b.z-a.z) if surface == 'front' else (.035, .028, b.z-a.z)
            box('metal', (a+b)/2, size)
        for z in [height*.3, height*.6]:
            a, b = p(-radius, z, .045), p(radius, z, .045)
            size = (width, .035, .026) if surface == 'front' else (.035, width, .026)
            box('metal', (a+b)/2, size)


# The reference has a broad, low nave and a square bell tower over the entry.
# These dimensions are estimates chosen to fit the existing churchyard.
box('stone', (0,-1.5,2.3), (5.2,8.4,4.6))
box('foundation', (0,-1.5,.28), (5.28,8.48,.56))
box('stone', (0,2.8,4.45), (2.65,2.8,8.9))
box('foundation', (0,2.8,.28), (2.73,2.88,.56))
for y in [-5.7, 2.7]:
    points = [(-2.6,y,4.6),(2.6,y,4.6),(0,y,6.05)]
    face('stone', list(reversed(points)) if y > 0 else points)

# Gabled terracotta roof, with shallow rows of individual tiles in material batches.
for sign in [-1, 1]:
    for row in range(13):
        near, far = row/13, (row+1)/13
        for col in range(32):
            y0, y1 = -5.94 + col * 8.88/32, -5.94 + (col+1) * 8.88/32
            def tile(t, y):
                return (sign * (2.82 * (1-t)), y, 4.61 + 1.55*t + .012*(row%2))
            points = [tile(near,y0),tile(near,y1),tile(far,y1),tile(far,y0)]
            if sign < 0:
                points.reverse()
            face(random.choices(['roof','tile-light','tile-dark'], [7,2,1])[0], points)
    box('metal', (sign*2.79,-1.5,4.6), (.09,8.98,.09))
box('roof', (0,-1.5,6.15), (.14,8.96,.10))

# Tower cornices and a raised pyramidal roof, rather than a pointed spire.
for z, width, depth, h in [(8.69,2.78,2.93,.12),(8.91,2.94,3.09,.15)]:
    box('trim', (0,2.8,z), (width,depth,h))
corners = [(-1.57,1.2,9.0),(1.57,1.2,9.0),(1.57,4.4,9.0),(-1.57,4.4,9.0)]
peak = Vector((0,2.8,10.57))
for i in range(4):
    a, b = Vector(corners[i]), Vector(corners[(i+1)%4])
    for row in range(7):
        for col in range(12):
            points = [a.lerp(b,u).lerp(peak,v) for u,v in
                      [(col/12,row/7),((col+1)/12,row/7),((col+1)/12,(row+1)/7),(col/12,(row+1)/7)]]
            face(random.choices(['roof','tile-light','tile-dark'], [7,2,1])[0], points)
box('metal', (0,2.8,10.72), (.035,.035,.43))
box('metal', (0,2.8,10.81), (.24,.035,.035))

# Recess silhouettes sit just outside the masonry; no unfinished interior is exposed.
for side in [-1, 1]:
    for y in [-4.3,-1.8,.7]:
        arch('side', (side*2.603,y,1.7), .67, 1.8, 'glass', bars=True)
    arch('side', (side*1.328,2.8,6.7), .72, 1.55, 'shadow')
    box('metal', (side*2.66,-5.72,2.25), (.065,.065,4.5))
arch('front', (0,4.203,.10), .95, 2.12, 'wood')
arch('front', (0,4.203,6.7), .75, 1.55, 'shadow')
box('wood', (0,4.25,1.03), (.035,.025,1.85))
box('metal', (.27,4.27,1.02), (.07,.035,.04))
box('trim', (0,4.43,.075), (1.55,.50,.15))

for surface, (vertices, polygons) in batches.items():
    mesh = bpy.data.meshes.new(surface)
    mesh.from_pydata(vertices, [], polygons)
    mesh.update()
    obj = bpy.data.objects.new(surface, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(materials[surface])
    uv = mesh.uv_layers.new(name='UVMap')
    for polygon in mesh.polygons:
        normal = polygon.normal
        for index in polygon.loop_indices:
            p = mesh.vertices[mesh.loops[index].vertex_index].co
            if abs(normal.z) > .6:
                coords = (p.x/2.5,p.y/2.5)
            elif abs(normal.x) > .6:
                coords = (p.y/2.5,p.z/2.5)
            else:
                coords = (p.x/2.5,p.z/2.5)
            uv.data[index].uv = coords

bpy.ops.export_scene.gltf(filepath=str(ROOT/'church.glb'), export_format='GLB',
                          export_animations=False, export_materials='EXPORT')
print('CHURCH:', sum(len(p.vertices)-2 for o in bpy.context.scene.objects if o.type == 'MESH' for p in o.data.polygons), 'triangles')

if '--render' in sys.argv:
    # Offline inspection of the actual mesh, no browser and no preview server.
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 12
    scene.render.resolution_x = 900
    scene.render.resolution_y = 700
    scene.render.resolution_percentage = 100
    scene.world.color = (.42,.48,.55)
    bpy.ops.object.light_add(type='AREA', location=(3,5,13))
    bpy.context.object.data.energy = 2100
    bpy.context.object.data.shape = 'DISK'
    bpy.context.object.data.size = 9
    bpy.context.object.rotation_euler = (Vector((0,0,3))-bpy.context.object.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(14,19,10))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0,-.7,4.5))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 16
    scene.camera = camera
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(ROOT/'preview.png')
    bpy.ops.render.render(write_still=True)
