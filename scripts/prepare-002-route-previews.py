"""Publish matched portfolio views from five read-only STL render outputs.

Run after render-002-engineering.mjs with the audited inventory and render root.
The source meshes stay in their ZIPs. Only derived WebP files enter public.
"""

import argparse
from hashlib import file_digest
import json
from pathlib import Path
from zipfile import ZipFile

from PIL import Image


REPO = Path(__file__).resolve().parents[1]
ASSETS = REPO / 'public/cases/erste002/assets/engineering'
RECORD = REPO / 'docs/erste002-engineering-visual-evidence/route-stl-audit.json'
VIEWS = {
    'upper': (256, 296, 1024, 808),
    'inside': (256, 296, 1024, 808),
    'mounting': (240, 248, 1056, 792),
    'ribs': (224, 280, 1040, 824),
    'buttons': (224, 216, 1056, 772),
}


def digest(path):
    with path.open('rb') as stream:
        return file_digest(stream, 'sha256').hexdigest()


def publish_view(previews, version, view, source_id, members):
    original = previews / f'{source_id}-{view}.png'
    destination = ASSETS / f'route-{version.lower()}-{view}.webp'
    with Image.open(original) as image:
        tile = image.convert('RGB').crop(VIEWS[view])
        tile.save(destination, 'WEBP', quality=92, method=6)
    return {
        'view': view, 'version': version, 'members': [member['id'] for member in members],
        'originalRender': original.name, 'renderSha256': digest(original),
        'file': destination.name, 'width': tile.width, 'height': tile.height,
        'sha256': digest(destination),
    }


def prepare(render_root):
    previews = render_root / 'previews'
    run = json.loads((previews / 'preview-provenance.json').read_text(encoding='utf-8'))
    scan = json.loads((render_root / 'inventory.json').read_text(encoding='utf-8'))
    packages = []
    for number in range(1, 6):
        version = f'V{number}'
        parent, = (record for record in scan['records'] if record['originalName'] == f'{number}.zip')
        members = [model for model in run['models'] if model['package'] == parent['originalName']]
        zip_path = Path(parent['locator'])
        if digest(zip_path) != parent['sha256']:
            raise ValueError(f"Source ZIP changed: {parent['originalName']}")
        with ZipFile(zip_path) as archive:
            for model in members:
                with archive.open(model['originalName']) as mesh:
                    if file_digest(mesh, 'sha256').hexdigest() != model['sha256']:
                        raise ValueError(f"Source mesh changed: {model['originalName']}")
        shell, = (model for model in members if '上盖' in model['originalName'])
        covers = [model for model in members if '按键' in model['originalName']]
        package_id = shell['packageId']
        images = [publish_view(previews, version, view, package_id, members) for view in ('upper','inside')]
        if number in (2, 4, 5):
            images.append(publish_view(previews, version, 'mounting', package_id, [shell]))
        if number == 2:
            images.append(publish_view(previews, version, 'ribs', package_id, [shell]))
        if covers:
            cover, = covers
            images.append(publish_view(previews, version, 'buttons', cover['id'], covers))
        existing = REPO / '_archive' / parent['originalName']
        packages.append({
            'version': version,
            'source': parent['locator'].replace('\\', '/'),
            'sha256': parent['sha256'],
            'matchesLocalArchive': existing.is_file() and digest(existing) == parent['sha256'],
            'members': [{
                'id': model['id'], 'file': model['originalName'], 'sha256': model['sha256'],
                'triangles': model['geometry']['triangles'],
            } for model in members],
            'images': images,
        })
    record = {
        'renderSetId': run['renderSetId'], 'renderedAtUtc': run['renderedAtUtc'],
        'versionAuthority': 'Designer confirmation, 2026-11-19. ZIP number 1–5 gives revision V1–V5.',
        'unit': None,
        'display': 'Original mesh coordinates. Each view uses the same orthographic camera and crop across revisions, with no per-version scaling.',
        'views': {view: {'camera': run['views'][view], 'cropPixels': crop} for view, crop in VIEWS.items()},
        'packages': packages,
    }
    RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('render_root', type=Path)
    prepare(parser.parse_args().render_root)
