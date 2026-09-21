# 0.4.1 재생 설정 UI 패키지 업데이트

## 변경

- 재생 설정 패널에 공통 디자인 토큰과 UI 렌더러를 적용한다.
- Firefox와 Chrome 패키지 모두 `ui/tokens.js`, `ui/primitives.js`, `ui/playback-settings.js`를 포함하고 `panel.js`보다 먼저 로드한다.
- 확장 ID와 저장 키를 유지하여 기존 배속·자막 설정을 이어서 사용한다. GIF 기능과 권한은 유지한다.
- 같은 0.4.0 번호로 서로 다른 UI를 패키징하지 않도록 제품 버전을 0.4.1로 올린다.

## 확인한 현상

2026-09-22 Firefox 임시 확장이 수정 중인 `extension/` 폴더를 직접 참조했다. UI 분리 후 확장을 다시 로드하기 전에는 GIF 버튼만 보였으며, 확장을 다시 로드하고 강의를 열자 재생 패널과 저장된 2배·한국어 자막 적용 상태가 복구되었다. 기존 배속·자막 구현의 삭제는 없었다. 이 개발 환경의 현상만으로 스토어 0.4.0 패키지가 고장났다고 판정하지 않는다.

개발 중 manifest의 스크립트 목록이 바뀌면 확장 관리 화면에서 확장을 다시 로드하고 강의 페이지도 새로 고침해야 한다.

## 산출물

- Firefox: `dist/submeta-playback-preset-0.4.1-unsigned.zip` (서명 전)
- Chrome: `dist/submeta-playback-preset-0.4.1-chrome.zip`
- 각 파일의 전체 목록과 SHA-256: `release/PACKAGE_MANIFEST.json`, `release/chrome/PACKAGE_MANIFEST.json`
- Mac 보조 앱은 0.4.0을 계속 사용한다.

## 검증 및 공개 상태

검증 결과는 배포 커밋과 PR 검사 결과에 기록한다. 메인 반영과 스토어 업로드·심사·공개는 별도 단계다. 이 기록 작성 시 0.4.1 스토어 제출과 공개는 아직 하지 않았다.
