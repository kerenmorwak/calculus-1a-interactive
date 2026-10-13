"""Build the notes website from assets/chapter-N.pdf. Run from repo root."""
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import shutil
import pymupdf
from PIL import Image

TITLES = ['מה אנחנו עושים כאן, והישר הממשי', 'סדרות ומושג הגבול', 'טורים', 'פונקציות', 'הנגזרת', 'טיילור', 'פונקציות קמורות']

def normalized(text):
    return ' '.join(text.split())

def sections_for(pdf, chapter):
    toc = pdf.get_toc()
    roots = [row for row in toc if row[0] == 1]
    target = normalized(TITLES[chapter - 1])
    if roots and not any(target in normalized(row[1]) for row in roots):
        raise ValueError(f'chapter-{chapter}.pdf has chapter bookmarks, but none matches Chapter {chapter}. Check that you uploaded the correct chapter.')
    active = not roots
    counters = []
    result = []
    for level, title, page in toc:
        if level == 1:
            if active and roots:
                break
            active = target in normalized(title)
            continue
        if not active or level < 2 or not 1 <= page <= len(pdf):
            continue
        depth = level - 1
        if depth > len(counters) + 1:
            raise ValueError(f'Unexpected bookmark nesting in Chapter {chapter}: {title}')
        if depth > len(counters):
            counters.append(0)
        counters = counters[:depth]
        counters[-1] += 1
        result.append(dict(level=level, title=title.strip(), page=page,
                           number='.'.join(map(str, [chapter] + counters))))
    return result

def main():
    site = Path('_site')
    if site.exists():
        shutil.rmtree(site)
    site.mkdir()
    for name in ['index.html', 'style.css', 'runtime-config.js', 'auth.js', 'app.js', 'interactive.js']:
        shutil.copy2(name, site / name)
    docs_source = Path('docs/question-bank.json')
    if docs_source.exists():
        docs_target = site / 'docs'
        docs_target.mkdir()
        shutil.copy2(docs_source, docs_target / docs_source.name)
    shutil.copytree('assets', site / 'assets')
    pages_root = site / 'assets/pages'
    if pages_root.exists():
        shutil.rmtree(pages_root)
    pages_root.mkdir()
    data = {}
    for chapter in range(1, len(TITLES) + 1):
        source = Path(f'assets/chapter-{chapter}.pdf')
        if not source.exists():
            continue
        pdf = pymupdf.open(source)
        if not len(pdf):
            raise ValueError(f'{source} is empty')
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
        folder = pages_root / f'chapter-{chapter}'
        folder.mkdir()
        pages = []
        for index, page in enumerate(pdf):
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.9, 1.9), alpha=False, colorspace=pymupdf.csRGB)
            name = f'page-{index + 1:02d}.webp'
            buffer = BytesIO()
            Image.frombytes('RGB', [pix.width, pix.height], pix.samples).save(buffer, 'WEBP', quality=86, method=6)
            (folder / name).write_bytes(buffer.getvalue())
            pages.append(dict(src=f'assets/pages/chapter-{chapter}/{name}?v={digest}', width=pix.width, height=pix.height))
        data[chapter] = dict(pdf=f'assets/chapter-{chapter}.pdf?v={digest}', pages=pages, sections=sections_for(pdf, chapter))
        print(f'Chapter {chapter}: {len(pages)} pages, {len(data[chapter]["sections"])} section links')
    if not data:
        raise ValueError('No assets/chapter-N.pdf files found')
    text = Path('app.js').read_text(encoding='utf-8')
    text, count = re.subn(r'const chapterData = \{\};', lambda _: 'const chapterData = ' + json.dumps(data, ensure_ascii=False) + ';', text, count=1)
    if count != 1:
        raise ValueError('Please upload the matching new app.js file')
    (site / 'app.js').write_text(text, encoding='utf-8')
    (site / 'assets/contents.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    version = hashlib.sha256(text.encode()).hexdigest()[:16]
    style_version = hashlib.sha256(Path('style.css').read_bytes()).hexdigest()[:16]
    auth_version = hashlib.sha256(Path('auth.js').read_bytes()).hexdigest()[:16]
    config_version = hashlib.sha256(Path('runtime-config.js').read_bytes()).hexdigest()[:16]
    interactive_version = hashlib.sha256(Path('interactive.js').read_bytes()).hexdigest()[:16]
    html = Path('index.html').read_text(encoding='utf-8')
    html, count = re.subn(r'(href=["\'])style\.css(?:\?[^"\']*)?(["\'])', lambda m: m[1] + f'style.css?v={style_version}' + m[2], html)
    if not count:
        raise ValueError('Could not find the style.css stylesheet reference in index.html')
    html, count = re.subn(r'(src=[\"\'])runtime-config\.js(?:\?[^\"\']*)?([\"\'])', lambda m: m[1] + f'runtime-config.js?v={config_version}' + m[2], html)
    if not count:
        raise ValueError('Could not find the runtime-config.js script reference in index.html')
    html, count = re.subn(r'(src=[\"\'])auth\.js(?:\?[^\"\']*)?([\"\'])', lambda m: m[1] + f'auth.js?v={auth_version}' + m[2], html)
    if not count:
        raise ValueError('Could not find the auth.js script reference in index.html')
    html, count = re.subn(r'(src=[\"\'])app\.js(?:\?[^\"\']*)?([\"\'])', lambda m: m[1] + f'app.js?v={version}' + m[2], html)
    if not count:
        raise ValueError('Could not find the app.js script reference in index.html')
    html, count = re.subn(r'(src=[\"\'])interactive\.js(?:\?[^\"\']*)?([\"\'])', lambda m: m[1] + f'interactive.js?v={interactive_version}' + m[2], html)
    if not count:
        raise ValueError('Could not find the interactive.js script reference in index.html')
    (site / 'index.html').write_text(html, encoding='utf-8')
    (site / '.nojekyll').touch()

if __name__ == '__main__':
    main()
