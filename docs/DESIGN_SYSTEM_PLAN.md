# 공통 디자인 시스템과 검증 파이프라인

작성: 2026-09-21. 이 문서의 현재 상태 조사는 당시 기준이다. 2026-09-22에 P0~P4 구현을 진행했으며 최신 제품 적용·검증 상태는 진행표를 따른다.

2026-09-22 후속: 실제 구현은 [진행 파이프라인](DESIGN_IMPLEMENTATION_PIPELINE.md)의 단계와 완료 조건을 따르며, 상태는 [진행표](DESIGN_PROGRESS.md)에 기록한다.

## 1. 확인 범위와 버전

앱에 등록된 프로젝트와 현재 작업 폴더에서 확인한 프로젝트는 Submeta 하나다. 다른 프로젝트의 경로를 받으면 아래 규칙의 공통성과 예외를 함께 검토한다. 원격 최신 커밋, 스토어 공개 상태는 이번 조사에서 조회하지 않았다.

| 대상 | 확인한 버전/상태 | 근거 |
|---|---|---|
| 제품 확장 | 0.4.0 | `extension/manifest.json` |
| Chrome 패키지 기록 | 0.4.0 | `release/chrome/PACKAGE_MANIFEST.json` |
| Mac 보조 앱 배포 기록 | 0.4.0 | `release/RELEASE_0.4.0.md` |
| GIF 실험판 | 0.2.8, 제품 0.4.0에 통합 | `experiments/gif-export-poc/manifest.json`, 릴리스 기록 |
| 로컬 HEAD | `3791a34`, 2026-09-21 | `codex/release-0.4.0-submission-record` 브랜치 |
| 테스트 의존성 | Playwright 1.62.1, web-ext 10.6.0 | `package.json` |

기존 문서 수정과 미추적 실험 파일이 존재한다. 이 설계 작업은 해당 변경을 그대로 보존한다. 릴리스 문서는 Chromium 12/12 통과와 양쪽 스토어 제출을 기록한다. 이는 과거 실행 기록이며 이번 작업에서 재실행하거나 공개 상태를 확인한 결과가 아니다.

## 2. 현재의 장점과 빈틈

- 실제 Chrome 제출 ZIP을 사용하는 Playwright 하네스와 GitHub Actions가 이미 있다. 이 경로를 통합 회귀 검사의 기반으로 유지한다.
- 재생 패널은 어두운 배경, 작은 모서리, 상속 글꼴을 사용한다. GIF 편집기는 밝은 배경, 초록 계열 중립색, 카드와 별도 모서리 값을 사용한다. 타임라인은 노란 선택 영역을 사용한다. 각각의 목적은 있지만 공통 의미와 규칙이 정의되어 있지 않다.
- 스타일은 `extension/panel.js`, `extension/gif/panel.js`, `extension/gif/timeline.js`, `extension/gif/launcher.js`에 분산되어 있다. UI 생성과 확장 메시징도 함께 묶여 있다.
- 현재 화면 검사는 일부 위치·색상 assertion과 스크린샷 저장이다. `toHaveScreenshot()` 기준 이미지 비교, Storybook, 공통 토큰 검사, 자동 접근성 감사는 없다.
- GIF UI의 closed Shadow DOM과 light DOM 입력 필드가 섞여 있다. 스타일 적용 범위와 자동 검사 범위를 별도로 설계해야 한다. 키보드 처리, 닫기 및 포커스 복귀 코드는 이미 있으므로 보존하고 실제 동작을 검증한다.
- `scripts/test-local.sh`는 extension/player 단위 검사만 실행하고 GIF 단위 검사를 누락한다. `npm test` 및 CI와 로컬 검증 진입점을 맞추는 일이 필요하다.
- README의 초기 개발 상태와 WORKFLOW의 미배포 설명은 최신 릴리스 기록과 시점이 다르다. 버전·상태 문서의 기준 위치를 하나로 정할 필요가 있다.

## 3. 디자인 철학 초안

**사용자가 하던 일을 유지하면서, 지금의 상태와 다음 행동을 명확하게 보여준다.**

1. 콘텐츠 우선: 영상과 작업 결과가 중심이다. 반복 설정은 낮은 시각적 비중으로, 편집 작업은 충분한 공간으로 제공한다.
2. 예측 가능한 조작: 같은 의미의 버튼·입력·상태는 위치, 이름, 크기, 포커스 규칙을 공유한다. 저장, 생성, 복사를 구분한다.
3. 상태의 정직함: 대기·처리 중·완료·실패·미지원 상태를 문장으로 표현한다. 기능 사용 불가의 이유와 복구 행동을 함께 제시한다.
4. 접근성은 기본 동작: 키보드만으로 주요 흐름을 완료하고, 오류를 색상에만 의존하지 않는다. 포커스가 보이고 닫은 뒤 원래 위치로 돌아와야 한다.
5. 문맥에 맞는 테마: 제품마다 같은 색을 강제하기보다 의미 토큰과 상호작용 규칙을 공유한다. Submeta의 기본 제안은 어두운 호스트에 맞춘 중립 테마이며, 밝은 편집기 유지 여부는 두 상태의 비교 화면으로 결정한다.
6. 근거 있는 예외: 다른 값을 써야 하면 이유, 영향 범위, 검증 사례를 남긴다. 임의의 새 스타일을 반복 생성하지 않는다.

## 4. 시스템 구조

`디자인 원칙 → 의미 토큰 → 공통 UI → 상태별 사례 → 자동 검증 → 실제 제품 검수`

| 계층 | 내용 | 재사용 범위 |
|---|---|---|
| 기초 값 | 색상 팔레트, 간격, 글꼴 크기, 모서리, 움직임 | 프로젝트 공통 |
| 의미 토큰 | surface / text / border / action / focus / status | 이름은 공통, 테마 값은 제품별 |
| 기본 UI | Button, Select, Checkbox, Field, Status, Dialog | 기술 스택에 맞는 구현 |
| 제품 패턴 | PlaybackSettings, GifEditor, RangeTimeline | Submeta 전용 |
| 검증 사례 | loading, empty, ready, disabled, error, success | 상태 정의와 검사 규칙 공통 |

최초 제안 파일 배치(실제 P0~P4 구현에서는 테마를 `design/tokens.json`에, UI 검사를 `tests/ui/`에 모았다):

```text
design/tokens.json               # 디자인 값의 단일 원본
design/themes/                  # 제품별 의미 토큰 매핑
extension/ui/                   # 생성된 토큰 및 공통 렌더러
stories/                        # 제품 렌더러를 사용하는 상태별 사례
tests/visual/                   # 승인한 이미지와 비교
tests/accessibility/            # 접근성 및 키보드 흐름
tests/e2e/                      # 실제 확장 패키지 통합 검사 유지
```

의미 토큰 예: `surface.canvas`, `surface.panel`, `text.primary`, `text.muted`, `border.default`, `action.primary`, `focus.ring`, `status.error`, `selection.range`. CSS 변수에는 `--sm-` 접두사를 사용한다. 간격과 모서리는 제한된 단계로 정의하며 구체적인 값은 대표 화면 검토 후 확정한다.

토큰 생성기는 Shadow DOM 내부 스타일과 light DOM 스타일 양쪽에 같은 원본을 공급한다. top document의 CSS가 cross-origin iframe까지 전달된다고 가정하지 않는다. manifest에 필요한 스크립트를 양쪽 컨텍스트에 명시하며 패키지 누락도 검사한다. 기존 JS 기반 로딩을 유지할 수 있는 어댑터를 두고 프레임워크 전환은 선행 조건으로 삼지 않는다.

## 5. Storybook과 Playwright의 역할

두 도구를 함께 사용하는 구성을 제안한다. Storybook은 공통 UI와 상태를 찾아보고 검토하는 작업 공간, Playwright는 UI 동작과 기준 이미지 및 실제 확장 통합을 검증하는 실행기다.

현재 UI는 즉시 실행 함수에서 DOM을 생성하므로 Storybook 설치만으로 재사용할 수 없다. 먼저 `mount(container, state, actions)` 형태의 렌더러와 browser/video/native 서비스 어댑터를 분리한다. Storybook과 제품이 같은 렌더러를 호출하도록 한다. Storybook에서만 별도 HTML을 복제하면 제품과 사례가 달라지므로 완료로 보지 않는다.

Storybook 프레임워크는 추출한 렌더러와 설치 시점 지원 조합을 확인해 선택한다. Web Components 방식이면 공식 Web Components/Vite 구성을 검토한다. Storybook 실행기는 프로젝트 조합의 호환성을 확인한 뒤 하나만 채택하며, 초기에는 Playwright에서 빌드된 사례를 검사하는 경로로 중복 검사를 줄인다.

closed Shadow DOM 내부는 일반 Playwright locator나 자동 접근성 감사로 충분히 탐색할 수 없다. 우선 실제 제품의 Shadow DOM 모드를 유지한다. 렌더러에 주입하는 테스트용 root와 공개 키보드 동작·전체 화면 비교를 조합하고, 열린 root에서 수행한 접근성 검사는 실제 제품 전체 검사와 구분해 기록한다. 제품 모드 변경은 이벤트 retargeting 및 플레이어 단축키 회귀를 검증한 별도 변경으로 다룬다.

## 6. 검증 파이프라인

```text
변경 요구 + 수용 기준
  → 토큰/렌더러/상태 사례 변경
  → 토큰 검증 + 단위 검사 + 확장 lint
  → Storybook 빌드
  → 사례별 동작 + 접근성 + 시각 비교
  → 실제 Chrome ZIP 통합 회귀
  → 이미지 diff·trace·미확인 항목을 PR에 첨부
  → 디자인 검토와 필수 검사 통과
  → Firefox/Chrome 실제 환경 검수 후 릴리스 판단
```

| 검사 | 실패 조건 | 결과물 |
|---|---|---|
| 토큰 계약 | 누락 참조, 타입 불일치, 순환 참조, 생성물 불일치 | 정확한 토큰 위치 |
| 스타일 규칙 | 토큰화 완료 범위에 승인되지 않은 색·간격 추가 | 파일 위치와 예외 사유 |
| 상태/동작 | 상태 전환, disabled, 오류 복구, 취소·재시도 불일치 | 테스트 리포트 |
| 접근성 | 합의한 자동 규칙 위반, 키보드 흐름 실패 | 위반 목록과 수동 검수 기록 |
| 시각 비교 | 검토되지 않은 이미지 차이 | expected / actual / diff |
| 통합 회귀 | 기존 기능, 메시징, 저장, 영상 전환 실패 | 리포트·실패 trace |

시각 비교는 OS, 브라우저, 폰트, locale, timezone, viewport, device scale을 고정한다. 기준 이미지 생성과 CI 검사는 같은 환경에서 실행한다. 초기 화면 폭은 기존 390px/1100px에 768px을 추가한다. CI에서 자동 기준 이미지 갱신은 금지하고, 의도한 변경은 diff를 검토한 커밋으로 반영한다. 광범위한 마스킹이나 허용 오차 상향으로 실패를 지우지 않는다.

GIF 진행률·타임라인 썸네일 등은 UI 사례에서 고정 상태로 공급한다. 이는 UI 상태 검증이며 실제 GIF 생성 성공의 증거로 사용하지 않는다. 실제 인코딩과 저장은 기존 실제 강의 검수 경로를 유지한다. 초기 픽셀 허용 오차는 고정 환경의 반복 실행으로 안정성을 확인한 뒤 최소한으로 확정한다.

자동 검사로 접근성 전체 준수를 선언하지 않는다. 실제 closed root·cross-origin iframe에서 Tab/Shift+Tab, Escape, 포커스 복귀, 오류 안내 연결, 긴 한국어 문구, 좁은 화면과 확대 사용을 직접 확인한다.

## 7. 첫 구현 범위와 단계별 완료 조건

1. 기준 정리: 재생 패널과 GIF 편집기의 현재 상태·화면을 기록하고 dark/light 방향을 비교한다. 다른 프로젝트가 제공되면 공통/제품별 규칙을 구분한다.
2. 작은 관통 구현: 버튼·입력·상태 표시를 토큰화하고, 실제 재생 설정 패널의 렌더러를 추출한다. 동일 렌더러를 제품과 Storybook에서 사용하고 loading/ready/error/disabled 사례를 만든다.
3. 파이프라인 연결: 관통 구현에 시각 비교, 접근성 검사, 기존 ZIP 회귀를 붙인다. 의도적 스타일 차이와 키보드 오류를 넣었을 때 각각 검사가 실패하는지 확인한다. 로컬/CI 진입점의 GIF 단위 검사 누락도 해결한다.
4. GIF 편집기 확장: 편집 전·입력 오류·생성 중·취소·생성 완료·저장 실패·보조 앱 없음 상태를 연결한다. 포커스, 슬롯 스타일, 플레이어 단축키를 함께 검수한다.
5. 다른 프로젝트 적용: 공통 토큰과 규칙은 공유하고 제품별 어댑터를 둔다. 두 번째 프로젝트에 적용한 결과를 본 뒤 독립 패키지 배포 여부를 정한다.

첫 완료 기준은 “대표 UI가 동일 원본에서 제품과 사례에 렌더링되고, 디자인 위반이 자동 검사에서 실패하며, 검토된 변경만 기준 이미지에 반영되는 것”이다. Storybook 설치나 문서 생성만으로 완료 처리하지 않는다.

## 8. 공식 자료

- [Storybook UI 테스트](https://storybook.js.org/docs/writing-tests): 상태별 사례와 테스트 구성.
- [Storybook Web Components + Vite](https://storybook.js.org/docs/get-started/frameworks/web-components-vite): 해당 렌더러 방식 선택 시 구성 확인.
- [Playwright 시각 비교](https://playwright.dev/docs/test-snapshots): 기준 이미지와 자동 비교, 동일 환경 유지.
- [Playwright 권장 사항](https://playwright.dev/docs/best-practices): 사용자 관점 검증, 안정된 locator와 환경.

작업 실행 규칙은 [디자인 작업 하네스](DESIGN_HARNESS.md)를 함께 사용한다.
