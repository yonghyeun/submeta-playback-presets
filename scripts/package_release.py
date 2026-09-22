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
files += ['ui/tokens.js', 'ui/primitives.js', 'ui/react-runtime.js', 'ui/playback-settings.js', 'ui/gif-editor.js', 'ui/THIRD_PARTY_LICENSES.txt']
files += ['gif/' + name for name in ['config.js', 'capture.js', 'encoder-client.js', 'encoder-core.js', 'encoder-worker.js', 'encoder.html', 'encoder-page.js', 'native-folder.js', 'background.js', 'save.js', 'timeline.js', 'panel.js', 'launcher.js']]
provenance = json.loads((source / 'gif/vendor/gifenc/PROVENANCE.json').read_text())
files += ['gif/vendor/gifenc/PROVENANCE.json'] + ['gif/vendor/gifenc/' + name for name in provenance['files']]
for name, digest in provenance['files'].items():
    assert hashlib.sha256((source / 'gif/vendor/gifenc' / name).read_bytes()).hexdigest() == digest
assert (source / 'LICENSE').read_bytes() == (root / 'LICENSE').read_bytes()
assert manifest['permissions'] == ['storage', 'downloads', 'nativeMessaging']
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
