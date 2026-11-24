"""Original camp exterior kit. Run in Blender 4.5 background mode; --render makes one small preview.

Coordinates while authoring: X long axis, Y depth, Z up; glTF exports as Y up, front +Z.
No downloaded geometry or extracted reference pixels. Dimensions are gameplay estimates.
"""
import bpy
import hashlib
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
image = bpy.data.images.load(str(ROOT / 'materials.png'), check_existing=True)
materials = {}
regions = {'plaster': (0, .5), 'roof': (.5, .5), 'wood': (0, 0), 'steel': (.5, 0)}
for name, rough in [('plaster', .97), ('roof', .94), ('wood', .93), ('steel', .78)]:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = rough
    texture = material.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = image
    texture.interpolation = 'Closest'
    material.node_tree.links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
    materials[name] = material
for name, color in {'trim': (.38, .35, .29, 1), 'foundation': (.19, .18, .16, 1),
                    'glass': (.025, .041, .05, 1), 'iron': (.065, .06, .052, 1),
                    'snow': (.71, .76, .79, 1), 'lamp': (.95, .71, .34, 1)}.items():
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = .87
    if name == 'lamp':
        bsdf.inputs['Emission Color'].default_value = color
        bsdf.inputs['Emission Strength'].default_value = 1
    materials[name] = material

# Each static part is assembled in material batches, rather than exporting every nail as a draw call.
batches = {}
roots = []


def group(name, parent=None, position=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = position
    return obj


def model(name, purpose):
    obj = group(name)
    obj['units'] = 'metres'
    obj['purpose'] = purpose
    obj['historicalAccuracy'] = 'Interpretation, not a measured February 1942 site reconstruction'
    roots.append(obj)
    return obj


def face(parent, surface, vertices, uv=None):
    key = (parent, surface)
    verts, faces, uvs = batches.setdefault(key, ([], [], []))
    offset = len(verts)
    verts.extend(vertices)
    faces.append(tuple(range(offset, offset + len(vertices))))
    base = regions.get(surface, (0, 0))
    local = uv or [(0, 0), (1, 0), (1, 1), (0, 1)][:len(vertices)]
    # Inset from quadrant boundaries keeps filtering and mip levels away from the adjacent material.
    uvs.append([(base[0] + .006 + u * .488, base[1] + .006 + v * .488) for u, v in local])


def plane(parent, surface, origin, u, v, tile=3):
    origin, u, v = Vector(origin), Vector(u), Vector(v)
    nx, ny = max(1, math.ceil(u.length / tile)), max(1, math.ceil(v.length / tile))
    for x in range(nx):
        for y in range(ny):
            p = origin + u * (x / nx) + v * (y / ny)
            a, b = u / nx, v / ny
            face(parent, surface, [p, p + a, p + a + b, p + b])


def box(parent, surface, center, size):
    x, y, z = center
    a, b, c = [n / 2 for n in size]
    plane(parent, surface, (x-a, y-b, z-c), (0, 0, 2*c), (0, 2*b, 0))
    plane(parent, surface, (x+a, y-b, z-c), (0, 2*b, 0), (0, 0, 2*c))
    plane(parent, surface, (x-a, y-b, z-c), (2*a, 0, 0), (0, 0, 2*c))
    plane(parent, surface, (x-a, y+b, z-c), (0, 0, 2*c), (2*a, 0, 0))
    plane(parent, surface, (x-a, y-b, z-c), (0, 2*b, 0), (2*a, 0, 0))
    plane(parent, surface, (x-a, y-b, z+c), (2*a, 0, 0), (0, 2*b, 0))


def beam(parent, surface, start, end, width, depth=None):
    start, end = Vector(start), Vector(end)
    direction = (end - start).normalized()
    other = Vector((0, 0, 1)) if abs(direction.z) < .9 else Vector((0, 1, 0))
    a = direction.cross(other).normalized() * width / 2
    b = direction.cross(a).normalized() * (depth or width) / 2
    for p, q in [(a+b, -a+b), (-a+b, -a-b), (-a-b, a-b), (a-b, a+b)]:
        face(parent, surface, [start+p, start+q, end+q, end+p])
    face(parent, surface, [start+a+b, start+a-b, start-a-b, start-a+b])
    face(parent, surface, [end+a+b, end-a+b, end-a-b, end+a-b])


def rod(parent, surface, start, end, radius, sides=6):
    start, end = Vector(start), Vector(end)
    direction = (end - start).normalized()
    other = Vector((0, 0, 1)) if abs(direction.z) < .9 else Vector((0, 1, 0))
    a = direction.cross(other).normalized() * radius
    b = direction.cross(a).normalized() * radius
    ring = [a * math.cos(i*math.tau/sides) + b * math.sin(i*math.tau/sides) for i in range(sides)]
    for i in range(sides):
        p, q = ring[i], ring[(i+1) % sides]
        face(parent, surface, [start+p, start+q, end+q, end+p])
    face(parent, surface, [start + p for p in reversed(ring)], [(0, 0)] * sides)
    face(parent, surface, [end + p for p in ring], [(0, 0)] * sides)


def hip(parent, length, depth, eave, ridge):
    x, y = length/2, depth/2
    inset = min(depth*.48, length*.22)
    a, b, c, d = (-x, -y, eave), (x, -y, eave), (x, y, eave), (-x, y, eave)
    left, right = (-x+inset, 0, ridge), (x-inset, 0, ridge)
    def roof_strip(points):
        p, q, r, s = [Vector(point) for point in points]
        count = math.ceil(length/2.5)
        for i in range(count):
            for j in range(2):
                def at(u, v):
                    return p.lerp(q, u).lerp(s.lerp(r, u), v)
                face(parent, 'roof', [at(i/count,j/2), at((i+1)/count,j/2),
                                      at((i+1)/count,(j+1)/2), at(i/count,(j+1)/2)])
    roof_strip([a, b, right, left])
    face(parent, 'roof', [b, c, right], [(0, 0), (1, 0), (.5, 1)])
    roof_strip([c, d, left, right])
    face(parent, 'roof', [d, a, left], [(0, 0), (1, 0), (.5, 1)])
    for p, q in [(a,b),(b,c),(c,d),(d,a)]:
        beam(parent, 'wood', p, q, .15)
    beam(parent, 'roof', left, right, .14)


def window(parent, x, y, z, width=1.15, height=1.7, side=1):
    # Exterior-only glazing: opaque inset avoids rendering empty or unfinished interiors.
    box(parent, 'glass', (x, y, z), (width, .045, height))
    for edge in [-1, 1]:
        box(parent, 'wood', (x+edge*width/2, y-.035*side, z), (.075, .075, height+.13))
        box(parent, 'wood', (x, y-.035*side, z+edge*height/2), (width+.15, .075, .075))
    box(parent, 'wood', (x, y-.06*side, z), (.045, .08, height))
    box(parent, 'wood', (x, y-.06*side, z), (width, .08, .045))
    box(parent, 'trim', (x, y-.09*side, z-height/2-.07), (width+.3, .24, .12))


def storehouse():
    root = model('Storehouse', 'Opaque exterior landmark and cover')
    root['estimatedDimensions'] = '32 x 9 m footprint; roof 9.1 m; chimney 9.74 m; door height 2.3 m'
    box(root, 'plaster', (0, 0, 3.65), (32, 9, 7.3))
    box(root, 'foundation', (0, 0, .22), (32.16, 9.16, .44))
    box(root, 'trim', (0, 0, 7.15), (32.25, 9.25, .2))
    for side in [-1, 1]:
        y = side * 4.54
        for x in [-13.5 + 3*i for i in range(10)]:
            window(root, x, y, 1.85, height=1.5, side=-side)
            window(root, x, y, 5.15, height=1.95, side=-side)
        for x in [-15.1 + 3*i for i in range(11)]:
            box(root, 'plaster', (x, side*4.54, 3.65), (.21, .12, 7.0))
        box(root, 'wood', (0, y+side*.035, 1.15), (1.4, .16, 2.3))
        for z in [.55, 1.75]:
            box(root, 'iron', (0, y+side*.13, z), (1.25, .035, .065))
        box(root, 'iron', (.4, y+side*.15, 1.08), (.18, .06, .04))
        for x in [-15.6, 15.6]:
            rod(root, 'steel', (x, side*4.7, .15), (x, side*4.7, 7.1), .055)
    hip(root, 33, 10, 7.3, 9.1)
    for x in [-10, -3.4, 3.4, 10]:
        box(root, 'steel', (x, 0, 9.1), (.55, .55, 1.1))
        box(root, 'foundation', (x, 0, 9.68), (.68, .68, .12))
    for x in [-16.01, 16.01]:
        # Small end-wall windows keep the short facade readable from a maze junction.
        for y in [-2.6, 0, 2.6]:
            box(root, 'glass', (x, y, 5.15), (.045, 1.1, 1.95))
            for d in [-.6, .6]:
                box(root, 'wood', (x*1.003, y+d, 5.15), (.09, .07, 2.07))
            for z in [4.15, 6.15]:
                box(root, 'wood', (x*1.003, y, z), (.09, 1.3, .07))
    return root


def post(parent, x, y, height=2.6):
    beam(parent, 'wood', (x, y, 0), (x+.018, y+.012, height), .14)
    box(parent, 'iron', (x, y, .18), (.15, .15, .07))


def wires(parent, start, end):
    start, end = Vector(start), Vector(end)
    for level in range(7):
        z = .23 + level*.33
        a, b = start+Vector((0, 0, z)), end+Vector((0, 0, z))
        rod(parent, 'iron', a, b, .009, 4)
        for i in range(1, 10):
            p = a.lerp(b, i/10)
            # Four small triangular barbs; no alpha surface fills the spaces between strands.
            for sign in [-1, 1]:
                face(parent, 'iron', [p+Vector((-.035, 0, -.035)), p+Vector((.035, 0, .035)), p+Vector((.045, sign*.045, -.03))], [(0,0)]*3)
    for z1, z2 in [(.23, 2.21), (2.21, .23)]:
        rod(parent, 'iron', start+Vector((0, 0, z1)), end+Vector((0, 0, z2)), .008, 4)


def fence(kind='straight'):
    root = model('Fence'+kind.title(), 'Blocks walking; porous for sight and projectiles')
    root['moduleLength'] = 5.0
    root['connectionRule'] = 'Start at local origin; open end at x=5; add terminal post once'
    root['blocksWalk'] = True
    root['blocksSight'] = False
    root['blocksShots'] = False
    posts = group('FencePosts', root)
    post(posts, 0, 0)
    if kind == 'terminal':
        return root
    wire = group('FenceWire', root)
    post(posts, 2.5, 0)
    wires(wire, (0, 0, 0), (5, 0, 0))
    if kind == 'corner':
        post(posts, 0, 2.5)
        wires(wire, (0, 0, 0), (0, 5, 0))
        root['connectionRule'] = 'Start corner at origin; arms end at x=5 and depth=5'
    return root


def gate():
    root = model('Gate', 'Two hinged porous leaves, walking opening width 4.7 m')
    for x in [0, 5]:
        post(root, x, 0, 2.8)
    for name, x, sign in [('GateLeft', .15, 1), ('GateRight', 4.85, -1)]:
        leaf = group(name, root, (x, 0, 0))
        width = 2.29*sign
        for x1 in [0, width]:
            beam(leaf, 'wood', (x1, 0, .15), (x1, 0, 2.4), .09)
        for z in [.15, 2.4]:
            beam(leaf, 'wood', (0, 0, z), (width, 0, z), .09)
        beam(leaf, 'wood', (0, .035, .2), (width, .035, 2.35), .08)
        wires(leaf, (0, 0, 0), (width, 0, 0))
        for z in [.4, 2.1]:
            rod(leaf, 'steel', (0, 0, z-.12), (0, 0, z+.12), .045)
    return root


def screen():
    root = model('TimberScreen', 'Opaque cover; blocks walking, sight and projectiles')
    root['blocksWalk'] = root['blocksSight'] = root['blocksShots'] = True
    root['moduleLength'] = 5.0
    for x in [-2.42, 0, 2.42]:
        box(root, 'wood', (x, .03, 1.25), (.16, .2, 2.5))
    for i in range(20):
        x = -2.375+i*.25
        height = 2.29 + .025*math.sin(i*4.3)
        box(root, 'wood', (x, 0, height/2), (.25, .09, height))
        for z in [.35, 1.92]:
            box(root, 'iron', (x, -.052, z), (.018, .012, .018))
    for z in [.35, 1.92]:
        box(root, 'wood', (0, .11, z), (5, .12, .12))
    beam(root, 'wood', (-2.3, .15, .3), (2.3, .15, 2.05), .12)
    return root


def tower():
    root = model('Watchtower', 'Timber observation tower with independent aim pivot and unshadowed spotlight')
    root['estimatedDimensions'] = '2.6 m base, 4.25 m deck, approximately 7 m roof'
    for x in [-1, 1]:
        for y in [-1, 1]:
            beam(root, 'wood', (x*1.24, y*1.24, 0), (x*.98, y*.98, 6.25), .19)
            box(root, 'foundation', (x*1.24, y*1.24, .08), (.37, .37, .16))
    for side in [-1, 1]:
        for start, end in [((-1.2, side*1.2, .35), (.98, side*.98, 4.2)),
                           ((1.2, side*1.2, .35), (-.98, side*.98, 4.2)),
                           ((side*1.2, -1.2, .35), (side*.98, .98, 4.2)),
                           ((side*1.2, 1.2, .35), (side*.98, -.98, 4.2))]:
            beam(root, 'wood', start, end, .13)
    box(root, 'wood', (0, 0, 4.25), (2.55, 2.55, .18))
    for y in [-1.16, 1.16]:
        for z in [4.55, 4.88, 5.22]:
            box(root, 'wood', (0, y, z), (2.5, .1, .16))
    for x in [-1.16, 1.16]:
        for z in [4.55, 4.88, 5.22]:
            box(root, 'wood', (x, 0, z), (.1, 2.5, .16))
    for x in [-.28, .28]:
        beam(root, 'wood', (x, 2.2, 0), (x, 1.2, 4.4), .09)
    for i in range(14):
        t = (i+.65)/14
        beam(root, 'wood', (-.3, 2.2-t, 4.4*t), (.3, 2.2-t, 4.4*t), .06)
    hip(root, 3.05, 3.05, 6.25, 7.1)
    aim = group('SearchlightAim', root, (0, -1.17, 5.64))
    aim.rotation_euler.x = math.radians(12)
    rod(aim, 'steel', (0, .05, -.35), (0, .05, -.08), .045)
    rod(aim, 'steel', (0, .1, 0), (0, -.33, 0), .22, 12)
    rod(aim, 'lamp', (0, -.335, 0), (0, -.35, 0), .185, 12)
    light = bpy.data.lights.new('Searchlight', 'SPOT')
    light.energy = 200
    light.color = (1, .79, .49)
    light.spot_size = math.radians(42)
    light.spot_blend = .4
    obj = bpy.data.objects.new('Searchlight', light)
    bpy.context.collection.objects.link(obj)
    obj.parent = aim
    obj.location = (0, -.37, 0)
    obj.rotation_euler.x = -math.pi/2
    return root


outputs = [('storehouse', storehouse()), ('fence-straight', fence()), ('fence-corner', fence('corner')),
           ('fence-terminal', fence('terminal')), ('gate', gate()), ('timber-screen', screen()), ('watchtower', tower())]
for (parent, surface), (vertices, faces, uvs) in batches.items():
    mesh = bpy.data.meshes.new(parent.name+'_'+surface)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new(name='UVMap')
    for polygon, coordinates in zip(mesh.polygons, uvs):
        for index, uv in zip(polygon.loop_indices, coordinates):
            layer.data[index].uv = uv
    obj = bpy.data.objects.new(mesh.name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    mesh.materials.append(materials[surface])


def descendants(root):
    return [root, *root.children_recursive]


stats = []
for name, root in outputs:
    bpy.ops.object.select_all(action='DESELECT')
    objects = descendants(root)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    # glTF separate keeps one shared atlas file across the kit. Convert its JSON/buffer to a GLB below.
    path = ROOT / (name+'.gltf')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLTF_SEPARATE', use_selection=True,
                              export_animations=False, export_extras=True, export_lights=True,
                              export_texcoords=True, export_normals=True, export_materials='EXPORT',
                              export_image_format='AUTO', export_keep_originals=True)
    document = json.loads(path.read_text(encoding='utf-8'))
    binary_path = ROOT / document['buffers'][0]['uri']
    binary = binary_path.read_bytes()
    del document['buffers'][0]['uri']
    for texture in document.get('images', []):
        texture['uri'] = 'materials.png'
    for sampler in document.get('samplers', []):
        sampler.update(magFilter=9728, minFilter=9984)
    import struct
    encoded = json.dumps(document, separators=(',', ':')).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    binary += b'\0' * ((-len(binary)) % 4)
    data = struct.pack('<4sII', b'glTF', 2, 28+len(encoded)+len(binary))
    data += struct.pack('<I4s', len(encoded), b'JSON')+encoded
    data += struct.pack('<I4s', len(binary), b'BIN\0')+binary
    (ROOT/(name+'.glb')).write_bytes(data)
    path.unlink()
    binary_path.unlink()
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == 'MESH' for corner in obj.bound_box]
    triangles = sum(len(p.vertices)-2 for obj in objects if obj.type == 'MESH' for p in obj.data.polygons)
    stats.append({'file':name+'.glb', 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(),
                  'triangles':triangles, 'meshes':sum(obj.type == 'MESH' for obj in objects),
                  'authoringBounds':{'min':[min(p[i] for p in points) for i in range(3)],
                                     'max':[max(p[i] for p in points) for i in range(3)]}})
    print('KIT', name, triangles, 'triangles,', len(data), 'bytes', flush=True)

source = {'name':'Crveni krst exterior kit', 'author':'Partisan Games contributors with Codex',
          'license':'MIT for original mesh/build code; generated texture and concept supplied for project use',
          'units':'metres', 'up':'+Y in GLB', 'front':'+Z in GLB',
          'origin':'Original Blender geometry and generated atlas. No borrowed meshes or reference image pixels.',
          'limitations':'Gameplay interpretation, estimated dimensions, exterior only. Not a measured site plan. Shared art for catalog and FPS camp level.',
          'references':'../../../../docs/references/ww2-yu/crveni-krst/sources.json',
          'texture':{'file':'materials.png','size':list(image.size), 'bytes':(ROOT/'materials.png').stat().st_size,
                     'sha256':hashlib.sha256((ROOT/'materials.png').read_bytes()).hexdigest()},
          'assets':stats}
(ROOT/'source.json').write_text(json.dumps(source, indent=2)+'\n', encoding='utf-8')

if '--render' in sys.argv:
    # One modest offline composition, using exactly the exported meshes, not a browser or image mockup.
    for root in roots:
        root.hide_render = True
    placements = [('storehouse',(0, 7, 0),0), ('watchtower',(-13,-10,0),0),
                  ('fence-straight',(-10,-8,0),math.pi/2), ('fence-straight',(-10,-3,0),math.pi/2),
                  ('fence-straight',(-5,-5,0),0), ('fence-terminal',(0,-5,0),0),
                  ('timber-screen',(4,-5,0),0), ('gate',(-7.5,-10,0),0)]
    by_name = dict(outputs)
    for name, position, angle in placements:
        original = by_name[name]
        copy = original.copy()
        bpy.context.collection.objects.link(copy)
        copy.hide_render = False
        copy.location = position
        copy.rotation_euler.z = angle
        remap = {original:copy}
        for child in original.children_recursive:
            duplicate = child.copy()
            bpy.context.collection.objects.link(duplicate)
            duplicate.parent = remap[child.parent]
            duplicate.hide_render = False
            remap[child] = duplicate
    # Hiding the original root alone does not hide its children in Blender.
    for root in roots:
        for obj in descendants(root):
            obj.hide_render = True
    bpy.ops.mesh.primitive_plane_add(size=95)
    ground = bpy.context.object
    ground.name = 'PreviewGroundOnly'
    ground.data.materials.append(materials['snow'])
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 24
    scene.render.resolution_x = 960
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.world.color = (.10, .13, .19)
    for name, pos, energy, size, color in [('MoonFill', (5,-10,18),1800,18,(.52,.65,1)),
                                           ('FacadeFill', (1,-3,10),800,10,(1,.76,.48))]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.shape, data.size, data.color = energy, 'DISK', size, color
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = pos
        obj.rotation_euler = (Vector((0, 5, 2))-obj.location).to_track_quat('-Z','Y').to_euler()
    camera_data = bpy.data.cameras.new('PreviewCamera')
    camera = bpy.data.objects.new('PreviewCamera', camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (30,-40,20)
    camera.rotation_euler = (Vector((0,2,3))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.lens = 40
    scene.camera = camera
    scene.view_settings.view_transform = 'AgX'
    scene.render.filepath = str(ROOT/'kit-preview.png')
    scene.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True)
    camera.location = (8,-14,1.78)
    camera.rotation_euler = (Vector((-5,4,3))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.lens = 26
    scene.render.filepath = str(ROOT/'eye-level-preview.png')
    bpy.ops.render.render(write_still=True)
