import base64
import re
from PIL import Image
import concurrent.futures
import hashlib
import json
from pathlib import Path
import shutil
import time
import urllib.parse
import urllib.request

ORIGIN = 'https://molu-design-portfolio.tailanghui856.chatgpt.site'
ROOT = Path.cwd()
OUT = ROOT / '_site'
shutil.copytree(ROOT, OUT, ignore=shutil.ignore_patterns('.git', '.github', '_site', '.publish'))
files = json.loads((ROOT / 'molu-portfolio/.publish/manifest.json').read_text())

def download(item):
    target = OUT / 'molu-portfolio/media' / item['key']
    target.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(5):
        try:
            url = ORIGIN + '/' + urllib.parse.quote(item['key'], safe='/')
            request = urllib.request.Request(url, headers={'User-Agent': 'Molu-Portfolio-Publisher/1.0'})
            digest = hashlib.sha256()
            with urllib.request.urlopen(request, timeout=120) as response, target.open('wb') as output:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
                    digest.update(chunk)
            if target.stat().st_size != item['size'] or digest.hexdigest() != item['sha256']:
                raise ValueError('Original file verification failed: ' + item['key'])
            print('Verified ' + item['key'], flush=True)
            return
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    list(pool.map(download, files))
page = OUT / 'molu-portfolio/index.html'
html = page.read_text(encoding='utf-8').replace(ORIGIN + '/', './media/')
assert ORIGIN not in html
page.write_text(html, encoding='utf-8')

# Lightweight browsing surfaces; full original detail assets remain byte-for-byte verified above.
preview = OUT / 'molu-portfolio/preview'
preview.mkdir(exist_ok=True)
image_urls = json.loads(re.search(r'Object.assign\(window.PORTFOLIO,(\{"images".*?\})\);', html).group(1))['images']
image_urls['opening-art']='./media/images-4k/opening-art.png'
for name, source in image_urls.items():
    source_path = OUT / 'molu-portfolio' / source.removeprefix('./')
    if not source_path.is_file():
        continue
    with Image.open(source_path) as image:
        image = image.convert('RGB')
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(preview / (name+'.webp'), 'WEBP', lossless=True, method=4)
# Preserve the existing music file, but remove its base64 payload from the critical HTML.
legacy_url='https://raw.githubusercontent.com/tailanghui856-art/tailanghui856-art.github.io/a952dad223bd7863a317003880a4ffb949394041/molu-portfolio/index.html'
with urllib.request.urlopen(legacy_url, timeout=60) as response:
    legacy=response.read().decode('utf-8-sig')
audio=re.search(r'data:audio/mp4;base64,([A-Za-z0-9+/=]+)',legacy)
if audio:
    (preview / 'ambience.m4a').write_bytes(base64.b64decode(audio.group(1)))

(OUT / '.nojekyll').touch()
size = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
assert size < 1024 ** 3, 'Pages site exceeds 1 GiB'
print(f'Published asset bytes: {size}; {len(files)} originals verified', flush=True)
