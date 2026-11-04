"""ERSTE002 display shell: clean the atypical front/rear protrusions, close the
bottom with a plate, and cut a sensor hole plus a power-switch slot.

This is a display model for the web viewer, not a manufacturable part.

Usage:
  blender --background --factory-startup --python tools/rebuild_shell.py -- <out.obj|out.glb> [--cut-z -0.3]
"""
import sys, math, pathlib
import bpy, bmesh
from mathutils import Vector

PROJECT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(r'C:\ZLF Files\UG(NX)\ERSTE002\FINAL')
PARTS = ['上盖1.5.stl', '新建文件夹/按键盖1.5.stl']

SENSOR_D = 11.0        # mm, sensor lens opening
SWITCH_W, SWITCH_H = 9.0, 4.5
PLATE_T = 1.6          # mm


def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    return a


def import_all():
    objs = []
    for p in PARTS:
        before = set(bpy.data.objects)
        bpy.ops.wm.stl_import(filepath=str(SRC / p))
        objs += [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    return objs


def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    return o


def bisect_clean(obj, z_cut):
    """Delete everything below z_cut (the protruding feet/tabs)."""
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    plane_co = Vector((0, 0, z_cut))
    plane_no = Vector((0, 0, 1))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                           plane_co=plane_co, plane_no=plane_no, clear_inner=True)
    bm.to_mesh(me)
    bm.free()


def bottom_rim_points(obj, z_lo, z_hi):
    pts = []
    for v in obj.data.vertices:
        w = obj.matrix_world @ v.co
        if z_lo <= w.z <= z_hi:
            pts.append(w.copy())
    return pts


def make_plate(shell, z_cut, thickness, name='bottom_plate'):
    """Build a flat plate from the body silhouette at mid height, then thicken down."""
    pts = []
    for v in shell.data.vertices:
        co = shell.matrix_world @ v.co
        if 8.0 <= co.z <= 14.0:
            pts.append(Vector((co.x, co.y, z_cut)))
    if not pts:
        raise RuntimeError('no silhouette points')
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    # convex hull of the silhouette, then Chaikin-smoothed outline
    bm = bmesh.new()
    verts = [bm.verts.new((p.x, p.y, 0)) for p in pts]
    bm.verts.ensure_lookup_table()
    bmesh.ops.convex_hull(bm, input=verts)
    bm.to_mesh(bpy.data.meshes.new('tmp'))
    hull = [v for v in bm.verts if v.link_faces]
    ring = sorted({(round(v.co.x, 3), round(v.co.y, 3)) for v in hull},
                  key=lambda p: math.atan2(p[1] - cy, p[0] - cx))
    bm.free()

    for _ in range(3):  # Chaikin
        smoothed = []
        n = len(ring)
        for i in range(n):
            x0, y0 = ring[i]
            x1, y1 = ring[(i + 1) % n]
            smoothed.append((0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1))
            smoothed.append((0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1))
        ring = smoothed

    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z_cut)) for x, y in ring]
    face = bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    solid = obj.modifiers.new('sol', 'SOLIDIFY')
    solid.thickness = thickness
    solid.offset = -1.0
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=solid.name)
    return obj


def boolean_cut(target, cutter, name='cut'):
    mod = target.modifiers.new(name, 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def add_cylinder(x, y, z, r, depth, axis='Z'):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=(x, y, z))
    c = bpy.context.object
    if axis == 'X':
        c.rotation_euler = (0, math.radians(90), 0)
    return c


def add_box(cx, cy, cz, sx, sy, sz):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, cz))
    b = bpy.context.object
    b.scale = (sx / 2, sy / 2, sz / 2)
    bpy.ops.object.transform_apply(scale=True)
    return b


def main():
    a = args()
    out = pathlib.Path(a[0]) if a else (PROJECT / 'assets' / 'models' / 'shell-v1.obj')
    opts = {}
    for i in range(1, len(a) - 1, 2):
        opts[a[i].lstrip('-')] = a[i + 1]
    z_cut = float(opts.get('cut-z', 0.3))

    bpy.ops.wm.read_factory_settings(use_empty=True)
    objs = import_all()
    shell = join(objs, 'ERSTE002_shell')

    bisect_clean(shell, z_cut)

    # bottom plate from the rim outline
    ys_all = [v.co.y for v in shell.data.vertices]
    plate = make_plate(shell, z_cut, PLATE_T)

    # sensor opening: front third, on the centre line
    y_front, y_back = min(ys_all), max(ys_all)
    y_sensor = y_front + (y_back - y_front) * 0.32
    boolean_cut(plate, add_cylinder(0, y_sensor, z_cut - PLATE_T * 0.5, SENSOR_D / 2, PLATE_T * 4))

    # power switch slot: rear right, under the side buttons
    y_switch = y_back - (y_back - y_front) * 0.18
    boolean_cut(plate, add_box(12.5, y_switch, z_cut - PLATE_T * 0.5,
                               SWITCH_W, SWITCH_H, PLATE_T * 4))

    # merge plate into the shell as one object for export
    shell.select_set(True)
    plate.select_set(True)
    bpy.context.view_layer.objects.active = shell
    bpy.ops.object.join()

    # dark graphite material for the viewer
    mat = bpy.data.materials.new('shell_graphite')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.045, 0.045, 0.05, 1)
    bsdf.inputs['Roughness'].default_value = 0.38
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = 0.3
        bsdf.inputs['Coat Roughness'].default_value = 0.18
    shell.data.materials.clear()
    shell.data.materials.append(mat)

    # lighten the mesh for the web viewer
    dec = shell.modifiers.new('dec', 'DECIMATE')
    dec.ratio = float(opts.get('decimate', 0.35))
    bpy.context.view_layer.objects.active = shell
    bpy.ops.object.modifier_apply(modifier=dec.name)

    out.parent.mkdir(parents=True, exist_ok=True)
    if out.suffix.lower() == '.glb':
        bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', use_selection=True)
    else:
        bpy.ops.wm.obj_export(filepath=str(out), export_selected_objects=True)
    print('SHELL_OK', out, 'verts', len(shell.data.vertices))


main()
