"""Wire <img> tags in a page to the generated responsive variants (ADR-003).

Rewrites each <img src="..."> whose source has a manifest entry into a
<picture> block with AVIF and WebP sources plus the original as fallback.
Idempotent: images already wrapped in <picture> are skipped.

Usage: python tools/wire_responsive.py index.html [more.html ...] [--in-place]
"""
import argparse, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'docs' / 'image-manifest.json'
SIZES = '(max-width: 720px) 100vw, (max-width: 1200px) 80vw, 1100px'


def load_manifest():
    return json.loads(MANIFEST.read_text(encoding='utf8'))


def sources_for(entry, fmt):
    widths = sorted({v['width'] for v in entry['variants'] if v['format'] == fmt})
    items = []
    for w in widths:
        v = next(x for x in entry['variants'] if x['format'] == fmt and x['width'] == w)
        items.append(f"{v['path']} {w}w")
    return ', '.join(items)


def build_picture(tag, entry):
    avif = sources_for(entry, 'avif')
    webp = sources_for(entry, 'webp')
    if not avif or not webp:
        return tag
    indent = ' ' * (len(tag) - len(tag.lstrip()))
    return (
        f'<picture>\n'
        f'{indent}    <source type="image/avif" srcset="{avif}" sizes="{SIZES}">\n'
        f'{indent}    <source type="image/webp" srcset="{webp}" sizes="{SIZES}">\n'
        f'{indent}    {tag.strip()}\n'
        f'{indent}</picture>'
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pages', nargs='+')
    ap.add_argument('--in-place', action='store_true')
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding='utf8')
    manifest = load_manifest()

    for page in a.pages:
        path = ROOT / page
        html = path.read_text(encoding='utf8')
        changed = 0

        def repl(m):
            nonlocal changed
            tag, src = m.group(0), m.group(1)
            if src not in manifest:
                return tag
            changed += 1
            return build_picture(tag, manifest[src])

        new_html = re.sub(r'<img\b[^>]*src="([^"]+)"[^>]*>', repl, html)
        new_html = re.sub(r'<picture>\s*(<picture>)', r'\1', new_html)
        print(f'{page}: {changed} image(s) wired')
        if a.in_place and changed:
            path.write_text(new_html, encoding='utf8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
