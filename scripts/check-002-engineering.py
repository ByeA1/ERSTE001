"""Exercise archive safety and mesh reporting without changing real source files."""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
import zipfile

SPEC = importlib.util.spec_from_file_location('scan', Path(__file__).with_name('scan-002-engineering.py'))
scan = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scan)


def tetrahedron():
    points = [(0., 0., 0.), (1., 0., 0.), (0., 1., 0.), (0., 0., 1.)]
    faces = [(0, 2, 1), (0, 1, 3), (0, 3, 2), (1, 2, 3)]
    return b'fixture'.ljust(80, b'\0') + struct.pack('<I', 4) + b''.join(
        struct.pack('<12fH', 0., 0., 0., *(v for i in face for v in points[i]), 0) for face in faces)


class ArchiveSafety(unittest.TestCase):
    def test_closed_mesh_metrics_do_not_invent_units(self):
        data = tetrahedron()
        report = scan.stl_report(data)
        self.assertEqual(report['triangles'], 4)
        self.assertEqual(report['boundaryEdgesAfterWeld'], 0)
        self.assertEqual(report['nonManifoldEdgesAfterWeld'], 0)
        self.assertEqual(report['sameDirectionPairedEdges'], 0)
        self.assertEqual(report['vertexConnectedIslands'], 1)
        self.assertIsNone(report['unit'])

    def test_open_ascii_mesh_is_reported_as_open(self):
        report = scan.stl_report(b'solid test\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid test')
        self.assertEqual(report['boundaryEdgesAfterWeld'], 3)

    def test_zip_is_never_extracted_and_revision_is_never_guessed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'REV01_MJF_test'
            root.mkdir()
            source = root / '1.zip'
            with zipfile.ZipFile(source, 'w') as archive:
                archive.writestr('../outside.stl', tetrahedron())
            before = source.read_bytes(), source.stat().st_mtime_ns
            report = scan.inventory(source, 'fixture')
            self.assertIsNone(report['confirmedRevision'])
            self.assertEqual(report['directoryClaim'], root.name)
            self.assertIsNone(report['members'][0]['confirmedRevision'])
            self.assertEqual(report['members'][0]['sha256'], hashlib.sha256(tetrahedron()).hexdigest())
            self.assertFalse((root.parent / 'outside.stl').exists())
            self.assertEqual(before, (source.read_bytes(), source.stat().st_mtime_ns))

    def test_unreadable_models_are_preserved_and_marked(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'broken.stl').write_bytes(b'not an STL')
            (root / 'native.prt').write_bytes(b'not decoded')
            (root / '_derived').mkdir()
            (root / '_derived' / 'ignored.stl').write_bytes(tetrahedron())
            report = scan.scan(root)
            self.assertEqual(len(report['records']), 2)
            self.assertEqual(report['records'][0]['readStatus'], 'parse-failed')
            self.assertEqual(report['records'][1]['readStatus'], 'not-decoded')
            self.assertEqual((root / 'native.prt').read_bytes(), b'not decoded')

    def test_step_header_is_not_misrepresented_as_geometry(self):
        report = scan.inspect_data('model.step', b"ISO-10303-21;HEADER;FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));ENDSEC;")
        self.assertEqual(report['readStatus'], 'header-only')
        self.assertNotIn('geometry', report)

    def test_archive_is_ignored_untracked_and_absent_from_build(self):
        ignored = subprocess.check_output(['git', 'check-ignore', '_archive/ERSTE002/example.prt'], cwd=scan.REPO).decode()
        self.assertTrue(ignored.strip())
        self.assertEqual(subprocess.check_output(['git', 'ls-files', '_archive'], cwd=scan.REPO), b'')
        manifest = scan.REPO / 'dist' / 'pwa-build.json'
        if manifest.exists():
            files = json.loads(manifest.read_text(encoding='utf-8'))['files']
            self.assertFalse(any('_archive' in path or Path(path).suffix.lower() in {'.prt', '.step', '.stp', '.stl', '.3mf', '.zip'} for path in files))
            self.assertFalse((manifest.parent / '_archive').exists())


if __name__ == '__main__':
    unittest.main()
