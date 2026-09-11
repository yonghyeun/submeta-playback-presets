#!/usr/bin/env python3
"""Build a deterministic, unsigned Firefox archive; never include account/test files."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
source = root / 'extension'
manifest = json.loads((source / 'manifest.json').read_text())
files = ['manifest.json', 'shared.js', 'background.js', 'panel.js', 'player.js', 'README.md', 'LICENSE',
         'icons/icon.svg', 'icons/icon-48.png', 'icons/icon-96.png', 'icons/icon-128.png']
assert (source / 'LICENSE').read_bytes() == (root / 'LICENSE').read_bytes()
assert manifest['permissions'] == ['storage']
assert manifest['browser_specific_settings']['gecko']['data_collection_permissions'] == {'required': ['none']}
referenced = [*manifest['icons'].values(), *manifest['background']['scripts']]
referenced += [f for entry in manifest['content_scripts'] for f in entry['js']]
assert set(referenced).issubset(files), 'Manifest references a file outside the release allowlist'
for name in files:
    assert (source / name).is_file(), name
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f'submeta-playback-preset-{manifest["version"]}-unsigned.zip'
entries = {}
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for name in sorted(files):
        data = (source / name).read_bytes()
        info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, data)
        entries[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
with zipfile.ZipFile(archive) as z:
    assert sorted(z.namelist()) == sorted(files)
    assert z.testzip() is None
report = {'version': manifest['version'], 'signed': False, 'archive': archive.name,
          'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': entries}
(root / 'release' / 'PACKAGE_MANIFEST.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'Built {archive.name}: {len(files)} allowlisted files, SHA-256 {report["sha256"]}')
