# Mac GIF companion 0.4.0

[Install, scope, cache and removal instructions](INSTALL.md).

This optional local companion supports the published Firefox ID `playback-preset@submeta.local`, the GIF development preview, and Chrome Web Store ID `phmolfcajpjaalohghgmgpehedpeagan`. Both the native host manifests and executable caller check restrict access to these callers. It does not permit arbitrary unpacked Chrome extension IDs.

## Build

On macOS with Python 3 and Swift compiler tools:

```sh
python3 scripts/build_gif_folder_macos.py
# Optional local installation for both browsers:
python3 scripts/build_gif_folder_macos.py --install
```

The output ZIP includes an ad-hoc-signed application, install.py and INSTALL.md. The companion is not Apple notarized. Store browser packages do not include or silently install the executable.

## Protocol and data

Native messages are bounded JSON with 96 KiB base64 chunks and sequential acknowledgement. GIF size is limited to 20 MiB. Before file saving or copying, the complete hash, GIF structure, frame count and dimensions are validated. Duplicate finish returns the saved receipt instead of writing again. A normal folder bookmark remembers the chosen directory without granting broader OS access.

Clipboard copy writes original GIF bytes to Library/Caches/Submeta GIF Clipboard and publishes only the file URL. Image/HTML/PNG/TIFF representations are deliberately omitted to avoid single-frame paste conversion. Files survive helper exit and repeat copies reuse a content-addressed path. The previous clipboard is never read. Copy does not use the user's chosen save folder.

## Tests

FolderStoreTests.swift and ClipboardTests.swift take a path to a real generated GIF. The clipboard test uses a separate named pasteboard and checks original file bytes, multiple frames, absence of PNG/TIFF/HTML, hash rejection and duplicate finish. OS pasteboard access is required. Real testing with Submeta's Hip Escape from Mount and Obsidian 1.13.7 confirmed animated .gif file pasting. That result does not certify other applications or Chrome native integration.
