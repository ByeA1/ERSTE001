"""Studio render for the ERSTE shell STLs (Blender, headless).

Usage:
  blender.exe --background --factory-startup --python tools/render_shell.py -- <out.png> [--samples 96] [--width 1600] [--height 1200] [--view three-quarter]

Reads the FINAL STLs from the modelling folder, imports them at 1:1000 scale
(STL is in millimetres), builds a neutral studio, and renders with Cycles/GPU.
"""
import sys, math, pathlib
import bpy
from mathutils import Vector

PROJECT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(r'C:\ZLF Files\UG(NX)\ERSTE002\FINAL')
PARTS = ['上盖1.5.stl', '新建文件夹/按键盖1.5.stl']


def argv_after_ddash():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_stl(path, name):
    before = set(bpy.data.objects)
    bpy.ops.wm.stl_import(filepath=str(path))
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        o.name = name if len(new) == 1 else f'{name}_{o.name}'
        o.scale = (0.001, 0.001, 0.001)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bpy.ops.object.shade_smooth()
        m = bpy.data.materials.new(name + '_mat')
        m.use_nodes = True
        bsdf = m.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Base Color'].default_value = (0.018, 0.018, 0.021, 1)
        bsdf.inputs['Roughness'].default_value = 0.42
        bsdf.inputs['Metallic'].default_value = 0.0
        if 'Coat Weight' in bsdf.inputs:
            bsdf.inputs['Coat Weight'].default_value = 0.25
            bsdf.inputs['Coat Roughness'].default_value = 0.2
        o.data.materials.clear()
        o.data.materials.append(m)
    return new


def bounds(objs):
    pts = []
    for o in objs:
        for c in o.bound_box:
            pts.append(o.matrix_world @ Vector(c))
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def add_studio(center, size):
    # backdrop: big curved plane behind and under the object
    bpy.ops.mesh.primitive_plane_add(size=size * 12, location=(center.x, center.y + size * 3.2, center.z - size * 0.55))
    floor = bpy.context.object
    floor.name = 'backdrop'
    m = bpy.data.materials.new('backdrop_mat')
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.86, 0.85, 0.83, 1)
    bsdf.inputs['Roughness'].default_value = 1.0
    floor.data.materials.append(m)

    def area(name, loc, rot, energy, sz):
        bpy.ops.object.light_add(type='AREA', location=loc, rotation=rot)
        L = bpy.context.object
        L.name = name
        L.data.energy = energy
        L.data.size = sz
        return L

    k = (size / 0.12) ** 2
    area('key', (center.x - size * 1.6, center.y - size * 1.2, center.z + size * 1.7),
         (math.radians(52), 0, math.radians(-38)), 1.5 * k, size * 1.6)
    area('fill', (center.x + size * 2.0, center.y - size * 0.4, center.z + size * 0.9),
         (math.radians(70), 0, math.radians(58)), 0.5 * k, size * 2.2)
    area('rim', (center.x, center.y + size * 2.2, center.z + size * 1.2),
         (math.radians(-60), 0, 0), 0.9 * k, size * 1.4)

    world = bpy.data.worlds.new('world')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.78, 0.77, 0.75, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.07
    bpy.context.scene.world = world


def add_camera(center, size, view):
    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 85
    cam = bpy.data.objects.new('cam', cam_data)
    bpy.context.collection.objects.link(cam)
    if view == 'top':
        loc = center + Vector((0, -size * 2.0, size * 2.4))
    else:
        loc = center + Vector((-size * 1.9, -size * 3.0, size * 1.05))
    cam.location = loc
    direction = center - loc
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    return cam


def fit_camera(cam, objs, margin=1.18):
    lo, hi = bounds(objs)
    center = (lo + hi) / 2
    radius = max((hi - lo).length / 2, 1e-3)
    cam.data.lens = 85
    half = math.atan((cam.data.sensor_width / 2.0) / cam.data.lens)
    d = (radius / math.sin(half)) * margin
    cam.location = center + (cam.location - center).normalized() * d
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


def setup_render(out, samples, width, height):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = out
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Base Contrast'


def main():
    args = argv_after_ddash()
    out = args[0] if args else str(PROJECT / 'assets' / 'render-test.png')
    opts = {}
    for i in range(1, len(args) - 1, 2):
        opts[args[i].lstrip('-')] = args[i + 1]
    samples = int(opts.get('samples', 96))
    width = int(opts.get('width', 1600))
    height = int(opts.get('height', 1200))
    view = opts.get('view', 'three-quarter')

    clear_scene()
    objs = []
    for p in PARTS:
        f = SRC / p
        if f.exists():
            objs += import_stl(f, f.stem)
    if not objs:
        raise SystemExit('no STL imported')

    for o in objs:
        mats = [mm.name for mm in o.data.materials] if o.type=='MESH' else []
        bc = tuple(round(v,3) for v in o.data.materials[0].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value) if mats else None
        print('DBG', o.name, o.type, mats, bc)
    lo, hi = bounds(objs)
    center = (lo + hi) / 2
    size = max((hi - lo).x, (hi - lo).y, (hi - lo).z)

    # place object so it rests on the floor plane
    for o in objs:
        o.location.z -= lo.z

    lo, hi = bounds(objs)
    center = (lo + hi) / 2
    add_studio(center, size)
    cam = add_camera(center, size, view)
    fit_camera(cam, objs)
    setup_render(out, samples, width, height)
    bpy.ops.render.render(write_still=True)
    print('RENDER_OK ' + out)


main()
