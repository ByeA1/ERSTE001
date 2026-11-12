"""Read-only ERSTE002 evidence inventory. No CAD conversion or source writes.

python scripts/scan-002-engineering.py --inbox _archive
All generated output stays in the ignored archive's _derived directory.
"""
import argparse
from array import array
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import zipfile

REPO = Path(__file__).resolve().parents[1]
FORMATS = {'.prt', '.step', '.stp', '.stl', '.3mf', '.glb', '.obj', '.zip',
           '.png', '.jpg', '.jpeg', '.webp', '.pdf', '.txt', '.md', '.csv', '.json', '.mp4', '.mov'}
MAX_MEMBER = 256 * 1024 * 1024
ARCHIVE_FOLDERS = ['REV00_FDM_手感验证', 'REV01_MJF_首次结构验证',
                   'REV02_MJF_支撑杆与装配验证', 'REV03_当前版本_待打印验证', 'UNSORTED_待分类']


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def file_hash(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def stl_report(data):
    count = struct.unpack_from('<I', data, 80)[0] if len(data) >= 84 else 0
    binary = len(data) == 84 + 50 * count
    if binary:
        vertices = [(f[3:6], f[6:9], f[9:12]) for f in struct.iter_unpack('<12fH', data[84:])]
    else:
        text = data.decode('ascii', errors='replace')
        points = [tuple(map(float, match)) for match in re.findall(
            r'\bvertex\s+([\deE+.-]+)\s+([\deE+.-]+)\s+([\deE+.-]+)', text)]
        if not text.lstrip().lower().startswith('solid') or not points or len(points) % 3:
            raise ValueError('Not a reliably readable binary or ASCII STL')
        vertices = [tuple(points[i:i + 3]) for i in range(0, len(points), 3)]
        count = len(vertices)
    if not vertices or not all(math.isfinite(v) for face in vertices for point in face for v in point):
        raise ValueError('Empty mesh or non-finite coordinate')
    low = [min(point[a] for face in vertices for point in face) for a in range(3)]
    high = [max(point[a] for face in vertices for point in face) for a in range(3)]
    dimensions = [high[a] - low[a] for a in range(3)]
    tolerance = max(math.sqrt(sum(d * d for d in dimensions)) * 1e-7, 1e-9)
    ids, edges, edge_balance = {}, Counter(), Counter()
    parents = array('I')

    def find(n):
        while parents[n] != n:
            parents[n] = parents[parents[n]]
            n = parents[n]
        return n

    degenerates = 0
    for face in vertices:
        indices = []
        for point in face:
            key = tuple(round(v / tolerance) for v in point)
            if key not in ids:
                ids[key] = len(parents)
                parents.append(len(parents))
            indices.append(ids[key])
        if len(set(indices)) < 3:
            degenerates += 1
            continue
        for a, b in zip(indices, indices[1:] + indices[:1]):
            edge = (min(a, b), max(a, b))
            edges[edge] += 1
            edge_balance[edge] += 1 if a < b else -1
            ra, rb = find(a), find(b)
            if ra != rb:
                parents[rb] = ra
    return {
        'parser': 'STL binary' if binary else 'STL ASCII',
        'unit': None, 'unitNote': 'STL does not declare units; do not label as mm without export evidence.',
        'triangles': count, 'bounds': {'min': low, 'max': high}, 'dimensions': dimensions,
        'weldToleranceInFileUnits': tolerance, 'weldedVertices': len(ids),
        'vertexConnectedIslands': len({find(i) for i in range(len(parents))}),
        'boundaryEdgesAfterWeld': sum(n == 1 for n in edges.values()),
        'nonManifoldEdgesAfterWeld': sum(n > 2 for n in edges.values()),
        'sameDirectionPairedEdges': sum(edges[e] == 2 and abs(n) == 2 for e, n in edge_balance.items()),
        'collapsedTrianglesAfterWeld': degenerates,
        'limitations': 'Read-only tessellation metrics at stated weld tolerance. Islands are not confirmed parts. No CAD solid, material, manufacturing or stiffness conclusion.',
    }


def inspect_data(name, data):
    extension = Path(name).suffix.lower()
    if extension == '.stl':
        return {'readStatus': 'mesh-readable', 'geometry': stl_report(data)}
    if extension in {'.step', '.stp'}:
        header = data[:262144].decode('ascii', errors='replace')
        return {'readStatus': 'header-only', 'fileSchema': re.findall(r'FILE_SCHEMA\s*\((.*?)\)\s*;', header, re.S),
                'limitations': 'STEP BREP was not decoded. Exporter/file names cannot establish revision or geometry equivalence.'}
    if extension == '.prt':
        return {'readStatus': 'not-decoded', 'limitations': 'NX native model retained unchanged; use corresponding STEP/STL or a reliable NX reader.'}
    if extension == '.3mf':
        return {'readStatus': 'not-decoded', 'limitations': '3MF package inventoried, geometry and declared units not yet verified.'}
    return {'readStatus': 'inventoried-only'}


def inventory(path, provenance):
    stat = path.stat()
    record = {'locator': str(path), 'originalName': path.name, 'sizeBytes': stat.st_size,
              'modifiedUtc': datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
              'sha256': file_hash(path), 'source': provenance, 'confirmedRevision': None,
              'revisionNote': 'Neither a numeric package name, filename nor timestamp establishes REV00–REV03.'}
    record['fileId'] = 'F-' + record['sha256'][:16]
    folder = next((p for p in path.parts if re.match(r'REV0[0-3]_', p)), None)
    record['directoryClaim'] = folder
    if path.suffix.lower() != '.zip':
        if stat.st_size > MAX_MEMBER:
            record.update(readStatus='not-decoded', limitations='Size limit; hash and metadata only.')
        else:
            try:
                record.update(inspect_data(path.name, path.read_bytes()))
            except (ValueError, struct.error) as error:
                record.update(readStatus='parse-failed', error=str(error))
    else:
        record['readStatus'] = 'zip-directory-readable'
        record['members'] = []
        with zipfile.ZipFile(path) as archive:
            for index, entry in enumerate(archive.infolist()):
                if entry.is_dir():
                    continue
                member = {'zipIndex': index, 'originalName': entry.filename, 'sizeBytes': entry.file_size,
                          'compressedBytes': entry.compress_size, 'crc32': f'{entry.CRC:08x}',
                          'zipLocalTimeUnzoned': list(entry.date_time), 'confirmedRevision': None,
                          'locator': str(path) + '::' + entry.filename}
                if entry.file_size > MAX_MEMBER or entry.flag_bits & 1:
                    member.update(readStatus='not-decoded', limitations='Oversize or encrypted ZIP member; not extracted.')
                else:
                    try:
                        data = archive.read(entry)  # CRC checked by ZipFile; never extract to disk.
                        member['sha256'] = sha256(data)
                        member['fileId'] = 'F-' + member['sha256'][:16]
                        member.update(inspect_data(entry.filename, data))
                    except (ValueError, struct.error, zipfile.BadZipFile) as error:
                        member.update(readStatus='parse-failed', error=str(error))
                record['members'].append(member)
    after = path.stat()
    if stat.st_size != after.st_size or stat.st_mtime_ns != after.st_mtime_ns or file_hash(path) != record['sha256']:
        raise RuntimeError('Source changed during scan: ' + str(path))
    return record


def scan(root, inbox=None):
    files = {p.resolve(): 'archive-folder' for p in root.rglob('*')
             if p.is_file() and not p.is_symlink() and '_derived' not in p.relative_to(root).parts
             and p.suffix.lower() in FORMATS}
    if inbox:
        # Only top-level incoming packages, without silently assigning them to this project.
        for p in inbox.glob('*.zip'):
            if p.is_file() and not p.is_symlink():
                files[p.resolve()] = 'parent-inbox-project-and-revision-unconfirmed'
    records = []
    for path, provenance in sorted(files.items(), key=lambda item: str(item[0]).casefold()):
        print('Read-only scan: ' + str(path), flush=True)
        try:
            records.append(inventory(path, provenance))
        except (OSError, zipfile.BadZipFile) as error:
            records.append({'locator': str(path), 'readStatus': 'inventory-failed', 'error': str(error)})
    return {'schemaVersion': 1, 'scannedAtUtc': datetime.now(timezone.utc).isoformat(),
            'archiveRoot': str(root), 'timeWarning': 'Filesystem/ZIP times are metadata, not proven design, printing or test dates.',
            'records': records}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=REPO / '_archive' / 'ERSTE002')
    parser.add_argument('--inbox', type=Path)
    parser.add_argument('--init', action='store_true', help='Create missing archive folders without replacing files.')
    args = parser.parse_args()
    root = args.root.resolve()
    if args.init:
        for folder in ARCHIVE_FOLDERS:
            (root / folder).mkdir(parents=True, exist_ok=True)
    if not root.is_dir():
        parser.error('Create the local archive folders first.')
    report = scan(root, args.inbox.resolve() if args.inbox else None)
    output = root / '_derived' / 'inventory-latest.json'
    output.parent.mkdir(exist_ok=True)
    text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    history = output.parent / 'inventories'
    history.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    snapshot = history / ('scan-' + stamp + '.json')
    with snapshot.open('x', encoding='utf-8') as stream:
        stream.write(text)
    output.write_text(text, encoding='utf-8')
    print('Generated ' + str(output), flush=True)
    print('Preserved snapshot ' + str(snapshot), flush=True)
