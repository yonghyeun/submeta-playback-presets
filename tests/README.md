# Automated checks

디자인 토큰·Storybook·시각 비교·접근성·키보드 검사는 [디자인 실행 안내](../docs/DESIGN_RUNBOOK.md)를 따릅니다. `npm run test:design`은 새 UI 검사와 기존 단위/lint/E2E를 연결합니다. UI 보고서는 기존 E2E 보고서와 별도로 보관합니다.

한국어 항목별 절차·판정 기준·검증 한계: [Playwright 테스트 항목 및 검증 결과](../docs/PLAYWRIGHT_TEST_CASES.md).

GIF 기능은 [실제 Submeta 무료 강의 E2E 계획](../docs/GIF_EXPORT_TEST_PLAN.md)과 [결과 기록 양식](../docs/GIF_EXPORT_TEST_RUN_TEMPLATE.md)을 따릅니다. 사용자 요청에 따라 새 합성 영상을 준비하지 않습니다. Mac/Firefox 개발본을 실제 UI로 조작해 생성·저장을 검증한 [실행 결과](../docs/GIF_EXPORT_GENERATION_RUN_2026-09-21.md)가 있으며, 전체 OS/사진 앱 검수는 남아 있습니다. 현재 `npm test`나 CI의 통과 결과에는 포함되지 않습니다.

기능 개발본의 입력·인코더 순서·저장 요청 권한/무결성 검사는 `node tests/gif-export.test.mjs`로 실행합니다. 이 검사는 실제 영상 E2E를 대체하지 않습니다. 실제 저장 결과는 Pillow가 있는 Python에서 `python3 tests/live/verify-gif.py path/to/actual.gif --seconds 5 --sha256 PREVIEW_SHA256`로 독립 디코딩합니다. 길이·크기·프레임 변화·무한 반복·미리보기 해시 일치를 확인하며 새 테스트 영상을 만들지 않습니다. 파일/상세 측정값은 Git 제외 `local-only/`에 둡니다.

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

Playwright loads an actual extension in headless Chromium. `harness.mjs` builds and extracts the Chrome submission ZIP into a temporary directory, using its production service worker and local `browser` API bridge. Only the delayed-storage regression adds test instrumentation. Firefox uses its original manifest.

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

Chrome 브라우저 테스트는 `scripts/package_chrome.py`로 생성한 실제 제출 ZIP을 압축 해제하여 실행합니다. 지연 저장 이벤트 회귀 테스트만 테스트 계측 코드를 추가합니다.


## GIF 통합 회귀 검사

`node tests/gif-export.test.mjs`는 배포용 extension/gif 소스의 시간 범위·전송·원본 바이트·발신자 검증·Chrome 서비스 워커 저장 경로를 검사합니다. 기존 개발본을 비교하려면 `GIF_RELEASE_TEST=0 node tests/gif-export.test.mjs`를 사용합니다. 브라우저 검사에는 닫힌 GIF 편집창이 자막 제어를 막지 않는 회귀 검사가 포함됩니다. 생성 영상의 E2E는 합성 영상 대신 실제 접근 가능한 Submeta 강의에서 수행하며, 자동 프로토콜 검사와 구분해 기록합니다.
