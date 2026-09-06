# 플레이어 기술검증 기록

상태: T-101 조사 및 T-201 단일 강의 Firefox 최소 제어 실험 수행. 연속 영상 전환과 제품 자동 유지 기능은 미검증.

## 2026-09-06 — T-201 Firefox 최소 제어 결과

환경: macOS의 실제 Firefox 155.0.1, about:debugging 임시 Manifest V3 확장. 기존 Firefox 로그인 세션을 사용했다. 이번 실험에서 .env를 다시 읽지 않았다. 코드: experiments/player-poc/.

| 실험 | 변경 전 | 변경 후 확인 | 결과 |
| --- | --- | --- | --- |
| iframe content script 읽기 | 영상 일시정지 | 실제 playbackRate=1, readyState=4, Captions:Off | 성공 |
| 준비된 iframe에 SDK를 늦게 연결해 playbackRate=1.25 설정 | 실제 1배 | 1.2초 후 독립적인 frame probe의 실제값은 1배 | 실패 — 이 연결 타이밍에서 미반영 |
| iframe의 HTMLVideoElement.playbackRate=1.25 | 1배, paused=true | 실제 1.25배, paused=true | 성공 |
| 접근성 역할 기반 자막 메뉴에서 한국어 선택 | Captions:Off | Captions:한국어, 배속 1.25와 paused=true 유지 | 성공 |
| 실제 자막 표시 | 한국어 선택, 영상 정지 | 짧게 재생 후 일시정지한 화면에 한국어 자막 표시. 표준 트랙 mode=showing, activeCueCount=1 | 성공 |
| 자막 Off | 한국어 자막이 표시된 정지 프레임 | 동일 프레임에서 글자 사라짐, Captions:Off, mode=hidden | 성공 |
| 원래 설정 복구 | 1.25배 / Off | 실제 1배 / Off / paused=true | 성공 |

### 확보한 제어 경로

- 배속: iframe 안의 content script에서 표준 video.playbackRate를 읽고 변경한 뒤 다시 읽는다.
- 자막: iframe 안의 Captions combobox → option의 표시 언어로 선택한다. Radix UI 메뉴의 pointerdown/pointerup/click 처리를 통해 메뉴 열기와 선택이 가능했다.
- 자막 검증: 메뉴 표시 상태와 TextTrack.mode를 함께 읽고, 실제 화면에서 표시/소실을 확인했다. mode=hidden에서도 activeCueCount가 1로 남았으므로 cue 존재 여부만으로 자막 표시 성공을 판단하면 안 된다.
- 명령은 현재 Submeta 강의의 유일한 Cloudflare iframe을 대상으로 하며, frame probe 응답은 발신 origin과 window를 대조한다. 본문 자막 텍스트와 인증 URL은 코드 출력에 포함하지 않는다.

### 공식 SDK 결과의 해석

다운로드한 공식 SDK 코드에는 playbackRate 속성이 실제로 존재한다. setter는 내부 캐시를 즉시 갱신하며, iframeReady 이전에는 명령을 큐에 둔다. 이번 실험은 iframe이 이미 준비된 뒤 SDK를 연결했으므로 초기 준비 신호를 놓쳤을 가능성이 있다. 원인 확정이나 공식 SDK 전체 미지원 판정은 하지 않는다. 초기 시점 연결·재연결 실험은 후속 과제로 남긴다.

SDK 출처: https://embed.cloudflarestream.com/embed/sdk.latest.js

SHA-256: f8627f93c15f8628b530b802164e1d2afe03e5256ab3ad3595abb52573c14711

### 제한과 후속 작업

- 단일 강의에서 수동 버튼으로 실행한 POC다. 저장·자동 적용·충돌 복구·30회 전환 검수를 통과한 제품이 아니다.
- 초기 패널 주입과 확장 재로드 과정에서 진단 UI가 보이지 않거나 기존 UI의 핸들러가 사라지는 문제를 겪었다. 최종 실험은 확장 재로드 후 강의 페이지도 다시 로드하여 실행했다. 최초 주입 실패의 단일 원인을 확정하지 않는다.
- 제어 검증을 위해 몇 초 재생 후 정지했다. 재생 위치·시청 이력을 되돌리는 조작은 하지 않았다.
- 다음 T-301에서 두 코스 이상 전환, iframe 교체/재사용, 명령 세대 구분, 자막 지연, 설정 재적용을 확인한다. 공식 SDK 초기 연결 가능성도 함께 조사한다.
- 제품에서는 postMessage 진단 브리지 대신 확장 메시지 기반 프레임 식별을 검토하고, 사이트 전체에서 임의로 실행되지 않도록 주 플레이어 연결을 강화한다.

문법 검증: manifest JSON 파싱과 SDK 포함 모든 JavaScript 스크립트의 구문 검사를 통과했다. 빌드 도구가 필요 없는 POC이므로 Node.js·npm 설치 상태와 별개로 실제 Firefox에 임시 로드했다.

최종 최소 권한 manifest로 재로드한 뒤 배속 1→1.25, 한국어/Off, 1배 복구를 재확인했다. 임시 진단용 scripting/activeTab 권한은 최종 코드에서 제거했다. 실험 종료 후 Firefox의 임시 확장을 제거했으며 소스 파일은 저장소에 보존한다.

## 2026-09-06 — T-101 최초 관찰

환경: Codex 앱 내 브라우저. Firefox 자체를 조작하거나 확장을 설치한 결과가 아니다. 사용자가 제공한 로컬 .env로 Submeta 로그인에 성공했다. 강의 주소는 지정되지 않아 홈의 Continue로 열린 강의를 조사했다. 인증 정보·서명된 iframe 주소·영상 원본 주소는 이 기록에 포함하지 않는다.

### 확인된 사실

| 항목 | 관찰 |
| --- | --- |
| 플레이어 공급자 | iframe 출처가 https://iframe.cloudflarestream.com인 Cloudflare Stream |
| 주 플레이어 | 강의 화면 iframe 1개, 최상위 문서 video 0개, iframe 내부 video 1개 |
| DOM 배치 | VideoContent의 stage → player → MasterPlayer → div → iframe. CSS Modules 클래스 접두사를 관찰했으며 해시 부분은 안정적인 선택자로 취급하지 않음 |
| 강의 식별 후보 | /@강사/courses/코스슬러그/강의UUID 형태의 최상위 페이지 경로 |
| 자막 UI | combobox → listbox → option. português, 한국어, Deutsch, français, 日本語, English, español, Off 제공 |
| 배속 UI | Settings → dialog → Speed combobox. 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x 제공 |
| 실제 미디어 상태 | 조사 중 playbackRate=1, readyState=4 확인 |
| 표준 자막 트랙 | subtitles 종류의 Shaka Player TextTrack 1개, language는 빈 문자열, mode=hidden. UI의 7개 언어와 일대일 대응하지 않음 |
| 전환 UI | 강의 목차, 다음 영상 버튼, NEXT VIDEO 안내가 존재. 실제 전환 방식은 아직 검증하지 않음 |

강의 진입 시 사이트가 자동 재생을 시작했다. 조사 중 일시정지했고, 종료 시에도 일시정지 상태로 두었다. 자막·배속 메뉴를 열어 목록만 확인한 뒤 닫았으며 값은 변경하지 않았다. 사이트의 자동 재생으로 재생 위치가 소폭 진행되었다.

### 설계에 반영할 판단

- 최상위 문서에서 video만 찾는 경로로는 이 강의를 제어할 수 없다.
- Shaka 이름의 트랙은 내부 재생 구현에 대한 단서다. 실제 자막 렌더링 방식과 언어 전환 제어점은 미확인이다. TextTrack.mode만 바꿔 원하는 언어가 표시된다고 가정하지 않는다.
- 부모 문서에서 Cloudflare 공식 SDK를 사용하는 경로를 먼저 검증한다. 불충분하면 해당 iframe에 한정한 content script와 검증된 UI 제어를 검토한다.
- 내부 프레임 접근이 필요한 경우 https://iframe.cloudflarestream.com/* 범위가 후보다. 다른 도메인·전체 사이트 권한으로 확대하지 않는다. Submeta의 주 플레이어와 연결된 프레임에만 동작하도록 식별해야 한다.
- iframe 주소 경로 자체에 서명 정보가 포함될 수 있으므로 진단 출력은 origin만 허용한다. 전체 src, pathname, DOM 전체 덤프는 저장하지 않는다.

### 공식 문서 확인

[Cloudflare Stream Player API](https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/)를 확인했다. 부모 문서의 iframe에 연결하는 SDK가 제공된다. defaultTextTrack은 초기화 시 한 번만 적용되는 설정이라고 설명되어 있어, 지속적인 언어 변경·끄기 요구사항을 충족하는지 별도 실험이 필요하다. 이 페이지의 속성 목록에서는 playbackRate를 확인하지 못했지만 ratechange 이벤트는 문서화되어 있다. 문서의 누락만으로 SDK 제어가 불가능하다고 판정하지 않는다.

### 미확인 / 다음 실험

1. Firefox content script에서 공식 SDK 연결, 배속 읽기·설정·실제값 확인.
2. 실제 언어 목록 조회 경로, 한국어 선택·Off 전환과 화면 표시 검증.
3. iframe 내부 접근 필요 여부와 최종 최소 권한.
4. 다음 강의에서 iframe 교체인지 동일 요소 재사용인지 확인. URL 변화·미디어 준비 신호와 연결.
5. 두 번째 코스와 지연 자막에서 재현 확인.

T-101은 최초 관찰까지 진행했으며 렌더러·제어 접근 경로 확정이 남아 있다. T-201·T-301을 완료 처리하지 않는다.

## T-101 조사 양식

- 조사 일시 / Firefox 버전:
- 강의·코스 구분: 인증 정보와 원본 영상 URL 없이 기록
- 주 플레이어 선택 근거:
- 플레이어 공급자와 관찰 근거:
- video / iframe 구조 및 출처 도메인:
- 공식 제어 API 접근 가능 여부:
- 자막 렌더러 / 트랙 목록 준비 신호:
- 강의 식별 및 전환 신호:
- 필요한 최소 권한:
- 성공 / 실패 / 미확인:

## T-201 제어 결과 양식

항목별로 변경 전 실제값, 목표값, 호출 결과, 변경 후 실제값, 화면 표시 일치 여부를 기록한다. 배속과 자막을 분리하며 호출 성공만으로 적용 성공을 판정하지 않는다.

## T-301 전환 결과 양식

두 코스 이상에서 새 요소 생성, 동일 요소 내부 교체, 빠른 연속 이동, 지연 트랙, 일시해제 종료, 재적용을 각각 기록한다.
