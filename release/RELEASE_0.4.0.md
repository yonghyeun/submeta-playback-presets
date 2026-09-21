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
- Actual Firefox production-ID integration passed on the real free-course lesson using the signed-in paid account, as detailed below. Chrome actual-course generation remains unverified; its package passed automated Chromium regression tests.
- Firefox 0.4.0: submitted successfully; AMO displayed “Version Submitted” and will email when published. Version ID: 6501425. Validation: zero errors/warnings.
- Chrome 0.4.0: submitted successfully; CWS displayed “Your extension was submitted for review”. Automatic publication after approval is enabled. Item ID: phmolfcajpjaalohghgmgpehedpeagan.
- Submission is complete for both stores; public availability of 0.4.0 is pending store approval/publication, not yet confirmed.
- Release PR #3 merged as 1bee51fa7216393588ddc7975611ea5cb7ad7dab after CI run 35579194302 passed.

Live Firefox integration: temporarily loaded extension/manifest.json under the production ID, generated 0:30–0:35 from the real Hip Escape from Mount lesson, and confirmed 2,311 KiB result plus successful original-GIF clipboard through the 0.4.0 native allowlist. The clipboard instruction initially fell back because platform info is not available in that content-script context; moved OS lookup into the authenticated background and added Mac/Windows/failure tests.

CI dependency audit detected GHSA-7q85-xj36-vmfc in adm-zip 0.6.0. Updated the lockfile to compatible patched 0.6.1; the existing audit gate now passes with only the previously tracked image-size advisories. Gate was not relaxed.
