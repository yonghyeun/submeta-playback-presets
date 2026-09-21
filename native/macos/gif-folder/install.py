#!/usr/bin/env python3
"""Install the companion shipped next to this script, for the two store extensions."""
from pathlib import Path
import json, plistlib, shutil
source = Path(__file__).resolve().parent / 'Submeta GIF Folder.app'
with (source/'Contents/Info.plist').open('rb') as stream:
    assert plistlib.load(stream)['CFBundleIdentifier'] == 'io.submeta-player.gif-folder'
support = Path.home()/'Library/Application Support'
installed = support/'Submeta GIF Folder'/source.name
shutil.copytree(source, installed, dirs_exist_ok=True)
base = {'name':'io.submeta_player.gif_folder', 'description':'Save and copy local GIF files',
        'path':str(installed/'Contents/MacOS/SubmetaGIFFolder'), 'type':'stdio'}
for path, key, callers in [
    ('Mozilla/NativeMessagingHosts', 'allowed_extensions', ['playback-preset@submeta.local','gif-export-poc@submeta.local']),
    ('Google/Chrome/NativeMessagingHosts', 'allowed_origins', ['chrome-extension://phmolfcajpjaalohghgmgpehedpeagan/'])
]:
    manifest = support/path/'io.submeta_player.gif_folder.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps({**base,key:callers},indent=2)+'\n')
    manifest.chmod(0o600)
    print('Registered:',manifest)
print('Installed. Reload your Submeta lesson to use the companion.')
