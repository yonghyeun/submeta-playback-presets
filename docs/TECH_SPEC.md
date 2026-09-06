# 기술 설계 — 검증 전 초안

2026-09-06 조사 반영: 최초 강의에서 Cloudflare Stream iframe을 확인했다. 자막 UI의 7개 언어와 HTML textTracks의 단일 Shaka 트랙이 일치하지 않으므로 표준 자막 API만 사용하는 설계는 보류한다. 상세 관찰과 미확인 사항은 [POC_RESULTS.md](POC_RESULTS.md)에 기록했다. 아래 어댑터 우선순위는 유지하되 실제 제어 경로는 후속 실험으로 확정한다.

## 제안 구성

Firefox WebExtensions Manifest V3, TypeScript, HTML/CSS 팝업, browser.storage.local, esbuild, web-ext. 외부 서버와 UI 프레임워크 없이 시작한다. 의존성 버전과 API 호환성은 구현 시 공식 문서로 확인한다.

팝업 → storage.local → content script → player adapter → 기존 플레이어.

설정 변경은 storage.onChanged, 팝업의 현재 탭 명령은 확장 메시지로 전달한다. background는 프레임 관리 등 실제 필요성이 확인될 때만 추가한다.

## 어댑터와 접근 경로

1. 관찰된 플레이어의 공식 API를 우선한다.
2. 직접 접근 가능한 HTMLMediaElement의 playbackRate, textTracks, TextTrack.mode를 검증한다.
3. 앞선 경로가 불가능하면 검증된 접근성 이름·역할·선택 상태로 메뉴 제어를 검토한다.

Vimeo는 후보 예시일 뿐 확인된 공급자가 아니다. 공식 SDK를 쓰면 패키지에 포함한다. 사이트의 window 전역 객체에 content script가 직접 접근할 수 있다고 가정하지 않는다. 외부 iframe은 부모 문서의 공식 제어 경로부터 조사한다. all_frames만으로 접근 권한이 생긴다고 가정하지 않는다.

## 설정 모델

schemaVersion, 최신 설정을 구분하는 revision, enabled, speed.enabled/value, captions.mode(on/off/leave), captions.language, preferredKind(any 등), missingLanguage(off)를 둔다. 설치 기본값은 PRD를 따른다. 영상 일시해제 상태는 영구 저장하지 않는다.

## 탐지와 적용

- 강의 본문 주 플레이어만 탐지한다. 홍보·미리보기 영상은 제외한다.
- DOM 생성·제거와 실제 미디어 로드·영상 변경 이벤트를 함께 사용한다. 동일 video/iframe의 내부 영상 교체도 다룬다.
- MutationObserver는 요소 탐지용이며 미디어 준비 완료 신호를 대신하지 않는다.
- 설정·영상 식별 → 기능 준비 확인 → 실제값 읽기 → 다른 값만 변경 → 실제값 재확인 → 결과 표시.
- 배속과 자막 처리는 독립적이다.
- 설정 revision과 미디어 세대를 사용해 오래된 비동기 응답이 현재 영상 상태를 덮어쓰지 않게 한다. 늦게 끝난 변경 호출 후 최신 상태를 재확인한다.
- 초기 확인 제한 시간 15초, 항목별 10초 동안 최대 3회 충돌 보정은 초안 값이다. 초과 시 충돌 표시, 상시 고빈도 감시 금지.

## 권한·데이터

storage와 확인된 Submeta 문서 접근 범위만 우선한다. 외부 플레이어 권한은 필요성이 확인된 경우에만 추가한다. all_urls, 쿠키, 전체 방문 기록, 다운로드 권한은 기본 설계에서 제외한다. 사용자 설정만 저장하며 인증 정보·토큰 포함 URL·자막 본문·시청 이력을 수집하거나 영구 저장하지 않는다. 원격 실행 코드는 사용하지 않는다.

## 검증 순서

순수 로직 → 통제된 테스트 페이지 → 실제 Firefox/Submeta. 언어 선택·재시도·오래된 작업 처리, 영상 교체·지연 트랙·빠른 이동·다중 탭·일시해제·재생 부작용을 확인한다. 실제 사이트 검증과 테스트 페이지 성공은 구분한다. 지속 설치는 임시 설치와 구분하여 서명된 패키지로 확인한다.
