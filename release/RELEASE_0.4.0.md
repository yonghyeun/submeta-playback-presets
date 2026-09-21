# 0.4.0 — GIF creation and original-file clipboard

This release integrates GIF preview 0.2.8 into the existing Playback Presets for Submeta extension. Store extension version is 0.4.0; it is not a downgrade to the experiment's 0.2.x numbering.

- GIF button below the player opens a large editor.
- Single filmstrip timeline with start/end handles, thumbnails, and timestamp inputs bounded by the video duration.
- Local 1–15 second animated GIF generation, 480px maximum dimension, 10fps, without audio.
- Ordinary Save As works without a companion. Mac companion enables remembered folders and automatic original GIF file copying; no PNG fallback.
- Mac paste hint uses ⌘V; Windows/Linux use Ctrl+V when copy is supported.
- Fixed data-transfer typo and prevented the closed GIF dialog from blocking caption controls.

## Platform scope

Firefox desktop and Chrome desktop packages include generation and browser file saving. Remembered-folder saving and GIF clipboard require the optional macOS companion. No Windows/Linux native companion and no Photos integration in this release. Copy targets must accept file pasting. Obsidian 1.13.7 accepted and animated the original GIF in real testing; Codex paste was not verified because the UI tool blocks that app.

The Mac companion is ad-hoc signed, not Apple notarized. It is an optional advanced local install; do not advertise it as a one-click notarized application. See native/macos/gif-folder/INSTALL.md. Store installation alone does not install it.

## Packages

- dist/submeta-playback-preset-0.4.0-unsigned.zip — Firefox submission, needs Mozilla signing.
- dist/submeta-playback-preset-0.4.0-chrome.zip — Chrome Web Store submission.
- dist/submeta-gif-folder-0.4.0-macos.zip — optional Mac companion plus installer.

Publication is not complete until each store dashboard confirms submission/publication. Store approval is external to local validation. Exact package hashes are recorded in PACKAGE_MANIFEST.json and chrome/PACKAGE_MANIFEST.json.


## Validation — 2026-09-21

- Production GIF protocol/authorization/range/transfer tests passed, including Chrome service-worker download without createObjectURL.
- Chromium package regression suite: 12/12 passed, including captions after closing GIF editor. Initial integration exposed a hidden-dialog/caption conflict; the passing run includes its fix.
- Firefox web-ext lint: zero errors, warnings and notices.
- Earlier actual Submeta GIF generation and native clipboard testing used preview 0.2.8 plus the same encoder/capture/native byte path. The store-ID integration still needs live-browser confirmation; do not confuse automated fixture tests with a real course GIF run.
- Store access currently requires Mozilla login and Google reauthentication. Neither 0.4.0 store submission has been completed at this point.
