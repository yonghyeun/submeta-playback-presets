# Reproduce Firefox 0.4.2

Requirements: Node.js 24, npm, Python 3. Run from the archive root:

```sh
npm ci
npm run design:generate
npm run ui:build
python3 scripts/package_release.py
python3 scripts/package_chrome.py
```

Firefox output: dist/submeta-playback-preset-0.4.2-unsigned.zip.
Compare its SHA-256 with release/PACKAGE_MANIFEST.json.
React/React DOM are pinned in package-lock.json, bundled locally by scripts/design/build-ui.mjs. No remote code is used. Vendored gifenc source and provenance are in extension/gif/vendor/gifenc. Generated UI source is under ui/. The source archive excludes credentials, profiles, dependencies, and private media.
