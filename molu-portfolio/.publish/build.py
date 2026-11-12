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
(OUT / '.nojekyll').touch()
size = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
assert size < 1024 ** 3, 'Pages site exceeds 1 GiB'
print(f'Published asset bytes: {size}; {len(files)} originals verified', flush=True)
