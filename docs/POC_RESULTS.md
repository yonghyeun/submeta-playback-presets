# 플레이어 기술검증 기록

상태: T-101 최초 강의 구조 조사 수행. 실제 제어 실험과 Firefox 확장 환경 검증은 미실행.

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
