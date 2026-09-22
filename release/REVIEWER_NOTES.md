# Reviewer notes — 0.4.2

This is an unofficial extension for the authenticated Submeta course player. Controller code is readable JavaScript. React/TypeScript UI and its local React runtime are bundled and minified with esbuild. A matching source archive with locked dependencies and reproduction instructions accompanies this version. No remote code is loaded. The Chrome package includes a local compatibility wrapper for Chrome extension APIs.

## Permissions

- `storage`: local playback preferences only.
- `https://submeta.io/*`: inject the inline settings row into course pages and locate the player.
- `https://iframe.cloudflarestream.com/*`: operate the cross-origin embedded player. Frame control is configured only after a handshake with the Submeta parent and an extension-message relay restricted to the same tab.
- Data collection: `none`. See PRIVACY.md. No developer backend, analytics, cookie access or course downloads.

## Manual steps

1. Install the extension in Firefox Desktop 142 or later (verified on macOS Firefox 155.0.1).
2. Sign in to Submeta using a dedicated review account with access to the test courses.
3. Open a supported lesson; find the settings row below the player.
4. Keep retention off and edit speed, caption mode and language. Observe the existing player's state.
5. Enable retention and move to the next lesson.
6. Expand status to suspend only the current video or retry application.
7. For a caption language not supplied by the video, expect a missing-language message and captions off, rather than an arbitrary substitute.

## Review account — not supplied yet

The publisher must arrange an authorized review account/course access before submission. No personal login from the local development .env file is included in this package or these notes. Credentials must be provided only via the appropriate private Mozilla reviewer channel with the account owner's authorization.

## Reproduction

`python3 scripts/package_release.py` creates the unsigned archive from an explicit allowlist. This uses only Python's standard library. Files are copied without transformation. Manifest and icon metadata are already in the source tree.

Automated development checks: see tests/README.md. Playwright runs real extension scripts in Chromium with test-only API/background adapters and local fixtures. Those checks do not replace Firefox/live-service testing. See docs/RELEASE_EXECUTION_PLAN.md and docs/PRE_RELEASE_STATUS.md for the exact verified scope.


## GIF review

Use the free Foundations I: Escapes lesson Hip Escape from Mount: https://submeta.io/@lachlangiles/courses/foundations-i-escapes/8GDR4M_KPnNy7pnUJ_KTLA . A Submeta account and authorized course access may be required. Testing used a paid account viewing this course marked Free; logged-out/free-account access is not certified.

Click GIF 만들기 below the player. Select 0:30–0:35, then GIF 생성. Keep the tab visible during capture. The result is a local animated GIF. GIF 파일 저장 uses the browser dialog if no companion is available. The optional Mac companion is needed only for clipboard/file-folder integration and is documented in native/macos/gif-folder/INSTALL.md. Its source and deterministic build script are included in the source repository. It is not silently installed by the extension.

New permissions: downloads saves generated GIF bytes; nativeMessaging contacts only io.submeta_player.gif_folder. No clipboard-read permission. Frame capture uses the existing authorized video, without downloading courses or bypassing access. gifenc 1.0.3 is vendored as readable MIT source; hashes/provenance/license are included. No remote code is loaded. UI relays and native transfer requests validate extension identity, origin, tab and frame.
