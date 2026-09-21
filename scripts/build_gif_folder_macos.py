#!/usr/bin/env python3
"""Build the local GIF folder helper; --install registers this Firefox preview only."""
from pathlib import Path
import argparse
import hashlib
import json
import plistlib
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--install', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
source = root / 'native/macos/gif-folder'
# File-provider folders can attach FinderInfo to .app directories, which makes
# code signing fail. Sign in a local staging directory, then archive/install it.
staging = tempfile.TemporaryDirectory(prefix='submeta-folder-build-', dir='/private/tmp')
app = Path(staging.name) / 'Submeta GIF Folder.app'
binary = app / 'Contents/MacOS/SubmetaGIFFolder'
binary.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(['swiftc', '-swift-version', '5', '-O', '-module-cache-path', '/private/tmp/submeta-swift-cache',
                str(source/'FolderStore.swift'), str(source/'ClipboardWriter.swift'), str(source/'main.swift'), '-o', str(binary)], check=True)
with (app/'Contents/Info.plist').open('wb') as stream:
    plistlib.dump({'CFBundleIdentifier': 'io.submeta-player.gif-folder', 'CFBundleName': 'Submeta GIF Folder',
                  'CFBundleDisplayName': 'Submeta GIF Folder', 'CFBundleExecutable': 'SubmetaGIFFolder',
                  'CFBundlePackageType': 'APPL', 'CFBundleVersion': '0.4.0', 'CFBundleShortVersionString': '0.4.0',
                  'LSUIElement': True, 'NSHighResolutionCapable': True}, stream)
subprocess.run(['codesign', '--force', '--sign', '-', '--timestamp=none', str(app)], check=True)
subprocess.run(['codesign', '--verify', '--strict', str(app)], check=True)
shutil.copy2(source/'install.py', Path(staging.name)/'install.py')
shutil.copy2(source/'INSTALL.md', Path(staging.name)/'INSTALL.md')
archive = shutil.make_archive(str(root/'dist/submeta-gif-folder-0.4.0-macos'), 'zip', root_dir=staging.name)
print('Built local development helper:', archive)
print('Executable SHA-256:', hashlib.sha256(binary.read_bytes()).hexdigest())
if args.install:
    support = Path.home()/'Library/Application Support'
    installed = support/'Submeta GIF Folder'/app.name
    if installed.exists():
        with (installed/'Contents/Info.plist').open('rb') as stream:
            assert plistlib.load(stream)['CFBundleIdentifier'] == 'io.submeta-player.gif-folder'
    shutil.copytree(app, installed, dirs_exist_ok=True)
    manifest = support/'Mozilla/NativeMessagingHosts/io.submeta_player.gif_folder.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    payload = {'name': 'io.submeta_player.gif_folder', 'description': 'Save GIFs to the folder chosen by the user',
               'path': str(installed/'Contents/MacOS/SubmetaGIFFolder'), 'type': 'stdio',
               'allowed_extensions': ['gif-export-poc@submeta.local', 'playback-preset@submeta.local']}
    manifest.write_text(json.dumps(payload, indent=2)+'\n')
    manifest.chmod(0o600)
    print('Registered Firefox preview helper:', manifest)

    chrome_manifest = support/'Google/Chrome/NativeMessagingHosts/io.submeta_player.gif_folder.json'
    chrome_manifest.parent.mkdir(parents=True, exist_ok=True)
    chrome_payload = dict(payload)
    chrome_payload.pop('allowed_extensions')
    chrome_payload['allowed_origins'] = ['chrome-extension://phmolfcajpjaalohghgmgpehedpeagan/']
    chrome_manifest.write_text(json.dumps(chrome_payload, indent=2)+'\n')
    chrome_manifest.chmod(0o600)
    print('Registered Chrome release helper:', chrome_manifest)
