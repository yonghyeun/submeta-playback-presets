# P4.5 — React 공통 컴포넌트 전환

작성: 2026-09-22. 사용자 요청에 따라 P4와 GIF 적용(P5) 사이에 추가한 이정표다. 0.4.1의 재생·저장·자막 로직을 유지하면서 실제 제품과 Storybook이 같은 React 컴포넌트를 사용하게 했다.

## 구조와 소유권

```text
design/tokens.json → extension/ui/tokens.js
  → ui/styles.ts + extension/ui/primitives.js
  → ui/components.tsx (React + TypeScript)
      ├─ ui/mount.tsx → 제품용 번들 → extension/panel.js
      └─ stories/*.stories.tsx → React Storybook + Controls + Docs
  → 타입·생성물·토큰 → Playwright UI → 실제 ZIP E2E → CI
```

- 기본 요소: `Button`, `Checkbox`, `SelectField`, `StatusMessage`, `Disclosure`.
- 조합 요소: `PlaybackSettings`. 위 기본 요소를 실제로 조합한다.
- 입력 계약: `ui/types.ts`의 Preferences, PlaybackState, PlaybackActions. UI는 browser API를 호출하지 않는다.
- 제품 어댑터: `mountPlaybackSettings(root, {state, actions})`의 `update`, `setText`, `destroy`. React가 소유한 DOM을 제품 컨트롤러가 수정하거나 읽어 설정값을 수집하지 않는다. `change(id, values)`에서 전달한 값으로 저장한다. `get`은 통합 검사의 읽기 전용 확인에만 사용한다.
- Storybook 어댑터: Frame의 React portal로 open/closed Shadow DOM을 사용한다. 모든 사례가 같은 컴포넌트를 import한다. 별도 HTML 복제나 제품 번들 안의 React를 중복 마운트하지 않는다.
- 컴포넌트 내부 상태: Disclosure의 펼침 상태만 내부에서 관리한다. 새로운 오류는 복구 영역을 펼치고, 이후 사용자가 접은 상태는 같은 오류의 재렌더링으로 덮어쓰지 않는다.
- 저장·적용 결과 문구와 상태 색은 별도 값이다. 기존 컨트롤러의 문자열 기반 tone 변환은 제품 어댑터에만 남겨두고, React 컴포넌트는 명시적인 tone을 받는다.

## 직접 볼 수 있는 결과

로컬 서버 실행 후 다음 주소를 연다.

- 전체 디자인: `http://127.0.0.1:6006/?path=/story/design--overview`
- 제품 패널의 실제 props와 Controls: `http://127.0.0.1:6006/?path=/story/playbacksettings--default`
- 패널 계약 문서: `http://127.0.0.1:6006/?path=/docs/playbacksettings--docs`
- 버튼 문서: `http://127.0.0.1:6006/?path=/docs/button--docs`
- 컴포넌트 목록: 기본 요소에서 Button / Checkbox / SelectField / StatusMessage / Disclosure를 펼친다.

총 30개 story와 7개 docs 페이지다. 기본 요소의 Controls에서 문구·variant·비활성 상태·선택값을 바꿀 수 있다. 체크박스와 선택 입력을 직접 조작하면 args도 갱신된다. Actions에는 콜백이 기록된다. 조합 요소의 예시는 입력값과 이벤트만 연결하며, 가상의 저장 성공을 만들지 않는다. 재생 설정 그룹은 별도의 고정된 서비스 응답으로 전체 상태 흐름을 재현한다.

실제 화면: `design/evidence/react-components.png`, `design/evidence/react-docs.png`.

## 변경하는 방법

1. 의미 토큰 → 기본 요소 → 조합 요소 순서로 기존 구현을 확인한다.
2. 새 props와 이벤트를 TypeScript로 정의한다. 저장·플레이어·파일 처리는 제품 어댑터에 둔다.
3. 같은 소스 컴포넌트를 import하는 CSF 사례를 추가하고 `component`, `args`, `argTypes`, 사용 설명을 연결한다. 정상·오류·비활성과 필요한 키보드 흐름을 포함한다.
4. `npm run ui:build`로 제품 번들을 생성한다. 토큰을 바꿨다면 먼저 `npm run design:generate`를 실행한다.
5. `npm run test:design`을 실행한다. 필요한 경우 `npm run test:design:guards`로 오류 감지도 확인한다.
6. `npm run package:chrome`과 `npm run package:release`로 패키지 해시 기록을 갱신하고 차이를 검토한다.

`ui:check`는 타입 검사와 번들의 재현 가능한 빌드 비교를 수행한다. 생성물을 직접 고치거나 재빌드를 누락하면 실패한다. `design:check`는 ui/ 아래 추가되는 TypeScript 소스도 재귀적으로 검사해 하드코딩된 디자인 값, 미정의 토큰, 위험한 DOM API 사용을 막는다.

## 런타임과 검사 예외

React/React DOM 19.3.0, Storybook React Vite 10.6.0을 고정했다. React와 React DOM은 개발용 Storybook에만 쓰이는 의존성이 아니라 확장에도 포함된다. 외부 CDN이나 원격 코드는 필요 없다. 기존 manifest에 로컬 `ui/react-runtime.js`를 추가했으며 Chrome과 Firefox ZIP 허용 목록에 런타임과 MIT 고지를 포함했다.

제품 런타임은 223,278 bytes(개별 gzip 69,023 bytes), UI 번들은 11,836 bytes(개별 gzip 4,055 bytes)다. React 도입에 따른 실제 용량 비용이며 다운로드 ZIP 전체 크기와는 다르다. 앱 코드를 런타임과 분리해 독립적으로 검토할 수 있게 했다.

Mozilla linter는 React DOM의 `dangerouslySetInnerHTML` 구현 내부에서 경고 2건을 낸다. 두 위치가 해당 API의 구현임을 확인했다. 파일을 검사에서 제외하지 않고 **전체 파일을 검사**한 후 `scripts/react-lint-baseline.json`의 런타임 SHA-256·경고 코드·파일·줄·열이 모두 일치하는 두 건만 허용한다. 앱 소스에서 이 API와 직접 innerHTML 대입은 금지한다. 새 앱 경고, 오류, 런타임 변경은 실패하며 이 제한을 단위 검사로 확인한다. React/빌드 도구/검사 도구 변경 시 재검토해야 한다. 따라서 lint 결과를 ‘경고 0건’으로 표시하지 않는다. 이 처리는 스토어 심사 승인과 별개다.

## 검증 결과

로컬 macOS/Chromium:

- UI 41/41: 기존 29개 + 컴포넌트 접근성 9개 + 실제 Storybook Controls 조작 + 자동 문서 + 마운트/업데이트/해제 반복.
- 시각 기준 이미지 12개를 수정하지 않고 통과했다. 390/768/1100 폭, 어두운/밝은 테마와 주요 상태가 유지된다.
- 실제 Chrome ZIP E2E 12/12: 배속·자막·연속 변경·브라우저 재시작·30회 영상 전환·탭 동기화 등.
- 기존 단위 검사 3개 스위트, 디자인 계약 검사 5/5, 전체 확장 lint 통과(위 두 건의 명시적 예외).
- 의도적 오류 5종(토큰/화면/접근성/키보드/제품 통합)을 모두 감지했다. 오류 주입은 임시 패키지와 테스트 페이지에만 적용했다.
- 의존성 감사: 새 공지 없음. 기존 image-size 공지 2건의 영향 3개 의존성은 기존 검토 기한 2026-10-11로 유지한다.
- Chrome/Firefox 패키지 재생성 및 해시 기록 갱신.

기능 코드 `b0908ae`의 [고정 Linux CI](https://github.com/yonghyeun/submeta-playback-presets/actions/runs/35622358348)도 Design validation / Extension validation 모두 성공했다. UI 41개, 오류 감지 5종, 기존 단위·감사·lint·제품 E2E 12개와 패키지 해시 일치를 검증했다. 이후 문서만 바뀐 커밋과 기능 검증 기준을 구분한다.

이번 자동 통합 검사는 로컬 모의 영상과 실제 Chrome 확장 ZIP을 사용했다. 로그인된 실제 Submeta, 실제 Firefox, GIF 편집기의 React 전환은 이번 완료 범위에 포함되지 않는다. 다음 적용 대상은 P5의 GIF 공통 UI다.
