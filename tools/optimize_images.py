"""Generate responsive AVIF/WebP variants for the portfolio images.

Policy (ADR-003): AVIF primary, WebP fallback, widths 480/960/1440/1920
(never upscale), byte caps 50/100/180/280 KB. Originals are never modified.

Usage:  python tools/optimize_images.py [--only PATH] [--dry-run]
Output: assets/opt/<same relative path>/<stem>-<width>.<ext>
        docs/image-manifest.json
"""
import argparse, io, json, pathlib, sys
from PIL import Image
import pillow_avif  # noqa: F401  (registers the AVIF codec)

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_DIRS = ['assets', 'mouse']
OUT_DIR = ROOT / 'assets' / 'opt'
MANIFEST = ROOT / 'docs' / 'image-manifest.json'
WIDTHS = [480, 960, 1440, 1920]
CAP_KB = {480: 50, 960: 100, 1440: 180, 1920: 280}
FMT_CONF = {'avif': {'ext': '.avif', 'lo': 35, 'hi': 80},
            'webp': {'ext': '.webp', 'lo': 45, 'hi': 88}}


def sources():
    for d in SRC_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in sorted(base.rglob('*')):
            if p.suffix.lower() in ('.jpg', '.jpeg', '.png') and p.is_file():
                if OUT_DIR in p.parents:
                    continue
                yield p


def encode(img, fmt, quality):
    buf = io.BytesIO()
    if fmt == 'avif':
        img.save(buf, format='AVIF', quality=quality, speed=8)
    else:
        img.save(buf, format='WEBP', quality=quality, method=4)
    return buf.getvalue()


def best_variant(img, fmt, cap_bytes):
    conf = FMT_CONF[fmt]
    lo, hi = conf['lo'], conf['hi']
    best = None
    while lo <= hi:
        mid = (lo + hi) // 2
        data = encode(img, fmt, mid)
        if len(data) <= cap_bytes:
            best = (mid, data)
            lo = mid + 1
        else:
            hi = mid - 1
    if best is None:
        data = encode(img, fmt, conf['lo'])
        best = (conf['lo'], data)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='limit to one source path')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf8')

    manifest = {}
    total_src = total_out = 0
    for src in sources():
        rel = src.relative_to(ROOT)
        if a.only and a.only.lower() not in str(rel).replace('\\', '/').lower():
            continue
        with Image.open(src) as im:
            im = im.convert('RGB')
            w, h = im.size
            entry = {'source': str(rel).replace('\\', '/'), 'width': w, 'height': h,
                     'sourceBytes': src.stat().st_size, 'variants': []}
            total_src += entry['sourceBytes']
            for target in WIDTHS:
                if w < target and target != WIDTHS[0]:
                    continue
                scale = min(1.0, target / w)
                nw = max(1, int(round(w * scale)))
                nh = max(1, int(round(h * scale)))
                resized = im.resize((nw, nh), Image.LANCZOS)
                cap = CAP_KB[target] * 1024
                for fmt in ('avif', 'webp'):
                    q, data = best_variant(resized, fmt, cap)
                    out = OUT_DIR / rel.parent / f'{src.stem}-{target}{FMT_CONF[fmt]["ext"]}'
                    entry['variants'].append({'format': fmt, 'width': nw, 'quality': q,
                                              'bytes': len(data),
                                              'path': str(out.relative_to(ROOT)).replace('\\', '/')})
                    total_out += len(data)
                    if not a.dry_run:
                        out.parent.mkdir(parents=True, exist_ok=True)
                        out.write_bytes(data)
                print(f'{rel} -> {target}px ok')
        manifest[entry['source']] = entry

    if a.only:
        print('single-image mode: manifest not rewritten')
        return 0
    if not a.dry_run:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf8')
    print(f'images={len(manifest)} src={total_src/1048576:.1f}MB variants={total_out/1048576:.1f}MB')
    return 0


if __name__ == '__main__':
    sys.exit(main())
