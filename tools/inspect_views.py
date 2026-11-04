"""Orthographic inspection renders of the shell STLs (top / side / bottom / rear).

Usage: blender --background --factory-startup --python tools/inspect_views.py -- <outdir>
"""
import sys, math, pathlib
import bpy
from mathutils import Vector

PROJECT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(r'C:\ZLF Files\UG(NX)\ERSTE002\FINAL')
PARTS = ['上盖1.5.stl', '新建文件夹/按键盖1.5.stl']


def main():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    outdir = pathlib.Path(args[0]) if args else pathlib.Path(r'C:\Users\Saki\Documents\Codex\2026-10-24\vva-vva-deepseek-windows-agent-agent\outputs\vva-next\workspace\shots\inspect')
    outdir.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    for p in PARTS:
        bpy.ops.wm.stl_import(filepath=str(SRC / p))
    objs = [o for o in bpy.data.objects if o.type == 'MESH']

    mats = []
    mat = bpy.data.materials.new('clay')
    mat.use_nodes = True
    b = mat.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.62, 0.62, 0.64, 1)
    b.inputs['Roughness'].default_value = 0.6
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(mat)

    mins = Vector((1e9,) * 3)
    maxs = Vector((-1e9,) * 3)
    for o in objs:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            for i in range(3):
                mins[i] = min(mins[i], w[i])
                maxs[i] = max(maxs[i], w[i])
    center = (mins + maxs) / 2
    size = max(maxs - mins)

    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.9, 0.9, 0.9, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    bpy.context.scene.world = world

    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = size * 1.15
    cam = bpy.data.objects.new('cam', cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.show_shadows = True
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.show_cavity = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'

    views = {
        'top': Vector((0, 0, 1)),
        'bottom': Vector((0, 0, -1)),
        'front': Vector((0, -1, 0)),
        'side': Vector((1, 0, 0)),
        'iso': Vector((-1, -1, 0.8)),
    }
    for name, d in views.items():
        cam.location = center + d.normalized() * size * 2.5
        cam.rotation_euler = (center - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(outdir / f'view-{name}.png')
        bpy.ops.render.render(write_still=True)
        print('VIEW_OK', name)


main()
