# Automated checks

한국어 항목별 절차·판정 기준·검증 한계: [Playwright 테스트 항목 및 검증 결과](../docs/PLAYWRIGHT_TEST_CASES.md).

## Install and run

Node.js 22 or later:

```sh
npm install
npm run test:install
npm test
npm run test:report
```

In the current Codex workspace, the bundled Node runtime and Playwright are available. Run:

```sh
./scripts/test-local.sh
```

This entrypoint also runs the existing VM unit tests. Chromium may require permission to launch outside the desktop filesystem sandbox. It uses a fresh temporary profile for each test, never the user's Firefox or Chrome profile.

## What is tested

Playwright loads an actual extension in headless Chromium. `harness.mjs` copies the production scripts into a temporary directory, converts only the Firefox background manifest to a Chromium service worker, and supplies a test-only `browser` API compatibility shim. The Firefox distribution files are not replaced by this adapter.

`site.mjs` responds locally at the two expected origins using Playwright routes. It supplies a real HTML media element playing generated silence, a real TextTrack, and a small CC menu matching the observed control contract. All other page requests are aborted. No account, paid course media, cookies or .env values are used.

The tests cover layout and checkbox colors, immediate speed and CC edits while retention is off, rapid edits, persistence across browser restart, thirty lesson/frame transitions, current-lesson suspension, unavailable language behavior, multi-tab synchronization, and panel removal.

Production scripts, real cross-origin frames, extension messaging and extension storage are exercised together. Menu behavior is a controlled fixture: these results do not prove compatibility with future Cloudflare UI changes or Firefox's native extension runtime. Firefox/Submeta live verification and Mozilla-signed installation/restart checks remain separate release requirements.

## Results

- `playwright-report/index.html`: HTML report.
- `test-results/`: layout screenshots, failure screenshots and traces.
- Failure trace: `npx playwright show-trace test-results/<failed-test>/trace.zip`.

Reports only contain the local fixture data. Reports, browser downloads and temporary profiles are excluded from Git. There is no automatic scheduled run; execute the commands after changes or in CI.

Reference: https://playwright.dev/docs/chrome-extensions

## Verified run — 2026-09-09

- Playwright 1.62.1, Chromium 151.0.7922.34, macOS arm64.
- 9 browser tests passed in approximately 1.5 minutes; zero retries.
- Existing extension/player VM suites also passed.
- Desktop and 390px viewport screenshots inspected.
- Initial environment failures: browser installer file-lock timeout and sandbox launch restriction. The same official browser archive was downloaded directly, and tests ran with authorized browser-launch access.
- An initial fixture failure came from a missing UTF-8 response charset; corrected before the successful full run. No production code change was needed in this testing task.

## Release candidate run — 2026-09-11

- 0.3.0 candidate: 11 integration tests passed in about 2 minutes, no retries; both VM suites passed.
- Added regression coverage for delayed own storage events during consecutive caption edits, and for missing CC menus.
- The initial delayed-event regression failed on its third caption edit. Tracking locally issued revisions fixed stale events cancelling newer work.
- Listing assets have a separate config/run (`npm run capture:listing`) so they do not replace the integration report.
- Mozilla web-ext 10.6.0: zero errors, warnings or notices (see release/WEB_EXT_LINT.json).
