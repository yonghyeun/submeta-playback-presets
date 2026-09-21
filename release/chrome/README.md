# 0.4.0 업데이트 준비

[통합 배포 기록](../RELEASE_0.4.0.md)을 참고하세요. 아래 0.3.0 심사 상태는 과거 기록이며 0.4.0 제출 완료를 뜻하지 않습니다.

# Chrome Web Store 제출 준비 — 0.3.0

상태: Chrome Web Store 0.3.0 심사 접수 완료 — Pending review. 승인 후 수동 게시.

## 파일

- 업로드: `dist/submeta-playback-preset-0.3.0-chrome.zip` (저장소 루트 기준)
- 패키지 검증 목록: [PACKAGE_MANIFEST.json](PACKAGE_MANIFEST.json)
- 스토어 입력 문구: [STORE_LISTING.md](STORE_LISTING.md)
- 개인정보 안내: [../PRIVACY.md](../PRIVACY.md)
- 아이콘: `extension/icons/icon-128.png`
- 스크린샷: `release/assets/listing-desktop.png` (1280×800, 설명용 테스트 페이지의 실제 확장 UI)
- 작은 홍보 이미지: `release/chrome/promo-440x280.png`

## 로컬 설치

1. `npm run package:chrome` 실행 또는 준비된 Chrome ZIP을 새 폴더에 압축 해제합니다.
2. Chrome의 `chrome://extensions`에서 개발자 모드를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**를 눌러 manifest.json이 있는 폴더를 선택합니다.
4. Submeta 강의 페이지를 새로고침합니다. 플레이어 아래에서 배속·자막을 변경합니다.
5. 재생 설정 유지를 켜고 다음 강의 및 브라우저 재시작 후 저장값 적용을 확인합니다.

Firefox용 `extension/manifest.json`을 Chrome에 직접 로드하지 않습니다. Chrome ZIP은 서비스 워커와 로컬 API 호환 계층을 포함합니다. 브라우저별 설정 저장소는 별개입니다.

## 제출 절차

1. [Chrome 개발자 대시보드](https://chrome.google.com/webstore/devconsole)에 게시자 계정으로 로그인하고 개발자 등록을 완료합니다. 등록비 및 약관은 계정 소유자가 확인합니다.
2. 새 항목에 Chrome ZIP을 업로드합니다.
3. STORE_LISTING.md의 소개, 권한 사유, 단일 목적 및 테스트 안내를 입력합니다. 아이콘·스크린샷·작은 홍보 이미지를 업로드합니다. 모바일 이미지는 Chrome 데스크톱 지원 설명에 사용하지 않습니다.
4. 개인정보 안내를 공개 접근 가능한 웹페이지에 게시한 뒤 해당 URL을 입력합니다. 현재 로컬 Markdown 파일은 공개 URL이 아닙니다.
5. 심사자가 사용할 수 있는 Submeta 강의 접근 방법을 Test instructions에 제공해야 합니다. 개인 계정 비밀번호를 공개 설명이나 저장소에 넣지 않습니다. 계정/구독이 필요한 강의에 대한 심사 접근 정보는 아직 준비되지 않았습니다.
6. 공개 범위와 국가를 확인하고 심사에 제출합니다. 검토 후 수동 게시를 원하면 자동 게시를 해제합니다.

실제 로그인한 Submeta 사이트에서 Chrome으로 배속·자막·연속 강의 동작을 확인하는 단계는 남아 있습니다. 로컬 Chromium 테스트는 사이트 모형을 사용하므로 실사이트 검증과 구분합니다. Chrome 최소 버전 102는 사용 API 기준이며 해당 구버전에서 별도로 테스트한 것은 아닙니다.

## 재생성 및 검증

`npm run package:chrome`, `npm test`, `npm run capture:listing`.
현재 작업 환경에서는 `./scripts/test-local.sh`로 단위 및 Chromium 테스트를 실행합니다. 일반 브라우저 테스트는 제출 ZIP을 그대로 압축 해제하여 로드합니다. 저장 이벤트 지연 재현 테스트만 별도 계측 파일을 추가합니다. ZIP은 허용된 11개 파일만 포함하며 .env·계정·프로필·테스트 파일은 제외합니다.

공식 자료 (2026-09-17 확인): [제출](https://developer.chrome.com/docs/webstore/publish), [개인정보 항목](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [이미지 요구사항](https://developer.chrome.com/docs/webstore/images).

## 검증 결과 — 2026-09-17

- `./scripts/test-local.sh`: 기존 단위 테스트 2개 파일 정상 종료, 실제 Chrome ZIP을 사용하는 Chromium 브라우저 테스트 11/11 통과 (1.9분).
- 배속·CC·언어 즉시 변경, 빠른 연속 변경, 브라우저 재시작 후 저장 유지, 30회 강의 전환, iframe 교체, 현재 영상만 해제, 미제공 언어, 여러 탭 동기화, 지연 저장 이벤트, CC 미지원 영상 검증.
- 스토어 이미지 캡처 1/1 통과. 데스크톱 스크린샷과 440×280 홍보 이미지 육안 확인.
- 동일 소스에서 Chrome ZIP 재생성 후 SHA-256 일치. 패키지 파일 목록과 해시는 PACKAGE_MANIFEST.json 참고.
- `git diff --check` 통과. 개인 프로필 대신 임시 테스트 프로필 사용. 실제 로그인한 Submeta에서 Chrome 수동 검증 및 스토어 제출은 미실행.

## Store draft saved — 2026-09-17

- Item ID: `phmolfcajpjaalohghgmgpehedpeagan`
- Dashboard: https://chrome.google.com/webstore/devconsole/3b171451-55ee-4adf-b7bf-0ab90542bb4c/phmolfcajpjaalohghgmgpehedpeagan/edit
- ZIP uploaded successfully. Status: Draft. Korean description, Education category, icon, screenshot, promo tile, homepage and support URLs saved.
- Single purpose, storage/host justifications, no remote code and three data-use certifications saved.
- Web history (current page/frame addresses) and Website content (player state/caption menus) declared for local-only processing under Google's disclosure requirements. No developer-server transmission.
- Privacy URL verified: https://github.com/yonghyeun/submeta-playback-presets/blob/main/release/PRIVACY.md . Public copy still references Firefox uninstall behavior; synchronize with the local browser-neutral wording in a future repository update.
- Distribution defaults verified: free, Public, All regions.
- English test instructions saved. Reviewer username/password remain empty.
- Submit button enabled; review NOT requested pending reviewer lesson access.

## Review submitted — 2026-09-17

- Reviewer instructions now link to the free Foundations I: Escapes course: https://submeta.io/@lachlangiles/courses/foundations-i-escapes/WOTD7Ux6wHn_ySgqY_RFrg
- Submeta's course list labels it Free Course. The signed-in browser displayed its lesson player and captions menu. Logged-out access was not tested. Instructions say to sign in with a free account if prompted; no paid subscription is required for the cited free course.
- Test instructions cover speed, CC/language, next-video retention, reload/restart and current-video suspension in 458 characters. No personal credentials supplied.
- Submitted successfully. Dashboard shows Pending review and Your extension was submitted for review.
- Automatic publication disabled. After approval, manually publish within the dashboard's stated 30-day staging period.
