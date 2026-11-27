"""Run in Blender with the project as the working directory."""
import json
import sys
from pathlib import Path

import bpy


model = Path("assets/models/character/soldier/partisan-lowpoly.fbx").resolve()
destination = Path(sys.argv[sys.argv.index("--") + 1])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(model))
parts = []
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    mesh = obj.data
    uv = mesh.uv_layers.active
    mesh.calc_loop_triangles()
    triangles = []
    for triangle in mesh.loop_triangles:
        points = [[*uv.data[i].uv, *(obj.matrix_world @ mesh.vertices[mesh.loops[i].vertex_index].co)]
                  for i in triangle.loops]
        triangles.append([mesh.materials[triangle.material_index].name, points])
    parts.append({"name": obj.name, "triangles": triangles})
destination.write_text(json.dumps(parts), encoding="utf-8")
