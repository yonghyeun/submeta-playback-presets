#!/usr/bin/env python3
"""Build the Chrome MV3 package from shared Firefox sources and a local API bridge."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
source = root / 'extension'
manifest = json.loads((source / 'manifest.json').read_text())
manifest.pop('browser_specific_settings')
manifest['minimum_chrome_version'] = '102'
manifest['background'] = {'service_worker': 'service-worker.js'}
for entry in manifest['content_scripts']:
    entry['js'].insert(0, 'browser-api.js')
shared = ['shared.js', 'background.js', 'panel.js', 'player.js', 'LICENSE',
          'icons/icon-48.png', 'icons/icon-96.png', 'icons/icon-128.png']
shared += ['gif/' + name for name in ['config.js', 'capture.js', 'encoder-client.js', 'encoder-core.js', 'encoder-worker.js', 'encoder.html', 'encoder-page.js', 'native-folder.js', 'background.js', 'save.js', 'timeline.js', 'panel.js', 'launcher.js']]
provenance = json.loads((source / 'gif/vendor/gifenc/PROVENANCE.json').read_text())
shared += ['gif/vendor/gifenc/PROVENANCE.json'] + ['gif/vendor/gifenc/' + name for name in provenance['files']]
for name, digest in provenance['files'].items():
    assert hashlib.sha256((source / 'gif/vendor/gifenc' / name).read_bytes()).hexdigest() == digest
data = {name: (source / name).read_bytes() for name in shared}
data.update({name: (root / 'chrome' / name).read_bytes()
             for name in ['browser-api.js', 'service-worker.js']})
data['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
assert manifest['permissions'] == ['storage', 'downloads', 'nativeMessaging']
references = [*manifest['icons'].values(), manifest['background']['service_worker']]
references += [name for entry in manifest['content_scripts'] for name in entry['js']]
assert set(references).issubset(data)
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f'submeta-playback-preset-{manifest["version"]}-chrome.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for name, content in sorted(data.items()):
        info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        package.writestr(info, content)
with zipfile.ZipFile(archive) as package:
    assert sorted(package.namelist()) == sorted(data)
    assert package.testzip() is None
report = {'version': manifest['version'], 'archive': archive.name,
          'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
          'files': {name: {'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()}
                    for name, content in sorted(data.items())}}
(root / 'release/chrome/PACKAGE_MANIFEST.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'Built {archive}: {len(data)} allowlisted files')
