"""Crop the same view from five read-only STL render outputs.

Run after render-002-engineering.mjs with the audited inventory and render root.
The source meshes stay in their ZIPs. Only derived WebP files enter public.
"""

import argparse
from hashlib import file_digest
import json
from pathlib import Path

from PIL import Image


REPO = Path(__file__).resolve().parents[1]
ASSETS = REPO / 'public/cases/erste002/assets/engineering'
RECORD = REPO / 'docs/erste002-engineering-visual-evidence/route-stl-audit.json'
CROP = (256, 296, 1024, 808)


def digest(path):
    with path.open('rb') as stream:
        return file_digest(stream, 'sha256').hexdigest()


def prepare(render_root):
    previews = render_root / 'previews'
    run = json.loads((previews / 'preview-provenance.json').read_text(encoding='utf-8'))
    scan = json.loads((render_root / 'inventory.json').read_text(encoding='utf-8'))
    packages = []
    for package_id in ('P01', 'P02', 'P03', 'P04', 'P05'):
        members = [model for model in run['models'] if model['packageId'] == package_id]
        parent, = (record for record in scan['records'] if record['originalName'] == members[0]['package'])
        if digest(Path(parent['locator'])) != parent['sha256']:
            raise ValueError(f"Source ZIP changed: {parent['originalName']}")
        original = previews / f'{package_id}-inside.png'
        destination = ASSETS / f'route-{package_id.lower()}-inside.webp'
        with Image.open(original) as image:
            tile = image.convert('RGB').crop(CROP)
            tile.save(destination, 'WEBP', quality=91, method=6)
        existing = REPO / '_archive' / parent['originalName']
        packages.append({
            'id': package_id,
            'source': parent['locator'].replace('\\', '/'),
            'sha256': parent['sha256'],
            'matchesLocalArchive': existing.is_file() and digest(existing) == parent['sha256'],
            'formalRevision': None,
            'members': [{
                'id': model['id'], 'file': model['originalName'], 'sha256': model['sha256'],
                'triangles': model['geometry']['triangles'],
            } for model in members],
            'previewSourceSha256': digest(original),
            'file': destination.name, 'width': tile.width, 'height': tile.height,
            'previewSha256': digest(destination),
        })
    record = {
        'renderSetId': run['renderSetId'], 'renderedAtUtc': run['renderedAtUtc'],
        'view': 'inside', 'camera': run['views']['inside'], 'unit': None,
        'display': 'Original mesh coordinates, matched orthographic camera and common crop. No per-package scaling.',
        'cropPixels': CROP, 'packages': packages,
    }
    RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('render_root', type=Path)
    prepare(parser.parse_args().render_root)
