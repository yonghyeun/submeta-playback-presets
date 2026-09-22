# P0~P4 실행 결과

실행일: 2026-09-22 (Asia/Seoul). 시작 제품 0.4.0, 시작 커밋 `3791a34`. 작업 중 main의 0.4.1 업데이트(`e6006f5`)를 통합했다. 이번 결과는 디자인 시스템 개발본이며 스토어 배포는 하지 않았다.

## 확인 가능한 산출물

- Storybook: `시작 → 디자인 시스템 둘러보기`, 재생 설정 11개 사례, 기본 요소 1개 사례.
- 공통 원본: `design/tokens.json` → 생성된 `extension/ui/tokens.js` → 공통 컨트롤·재생 설정 렌더러.
- 제품 연결: `extension/panel.js`와 Storybook이 동일 렌더러 사용. 기존 browser/video 통신은 제품 어댑터에 유지.
- 기준 이미지: Mac 12개 + Linux 12개. 390/768/1100px의 기본/불러오는 중/오류/밝은 테마.
- 실행 진입점: `npm run test:design`. 사용자가 볼 수 있는 HTML 보고서와 실패 이미지·trace 포함.
- 검사 자체의 검증: `npm run test:design:guards`, 의도적 오류 5종 감지.

## 로컬 검증

| 항목 | 결과 | 증거 |
|---|---|---|
| P0 기존 제품 기준 | 단위 3 suites, lint 오류·경고·알림 0, E2E 12/12 | `design/evidence/p0/`, 초기 실행 기록 |
| 토큰 검증 | 계약 검사 + 단위 4/4 | `npm run design:check` |
| UI 검사 | 29/29 | `design-report/index.html`, `design-test-results/results.json` |
| 기존 기능 회귀 | 변경 후 12/12 | `playwright-report/index.html` |
| 확장 검사 | 오류·경고·알림 0 | `npm run lint:extension` |
| 의존성 감사 | 새 advisory 없음 | 기존 image-size 2개 advisory, 영향 dependency 3개 유지; 기존 검토 기한 2026-10-11 |
| 단일 진입점 | `test:design` 전체 성공 | 로컬 `.cache/design-all.log` |
| 의도적 오류 | 5/5 정확히 감지 | `design-fault-results/summary.json` |

로컬 환경: macOS 26.6.2 arm64, Node 24.19.0, Playwright 1.62.1/Chromium, 고정된 Noto Sans KR 5.3.0. 최초 샌드박스 브라우저 실행은 실패했으며 임시 테스트 프로필에 대한 브라우저 실행 권한으로 해결했다. 사용자 브라우저 프로필은 사용하지 않았다.

## Linux 검증과 기준 이미지

최초 [CI 실행](https://github.com/yonghyeun/submeta-playback-presets/actions/runs/35618198081)에서는 동작·접근성 등 17개가 통과했고, 기준 이미지가 없는 화면 검사 12개가 예상대로 실패했다. 해당 실행의 실제 화면을 내려받아 기본/오류/불러오는 중/밝은 테마 대표 화면을 검토하고 12개 모두의 이미지 크기를 확인했다. 원본 해시는 `design/evidence/linux-baseline.json`에 남겼다.

등록 후 [일반 CI 비교](https://github.com/yonghyeun/submeta-playback-presets/actions/runs/35618556997)는 성공했다. 토큰 검사, Storybook 빌드, UI 29개, 오류 감지 5종 및 결과 artifact 업로드가 성공했다. 이 실행은 `7b2714c` 기준이며 기준 이미지 자동 갱신을 사용하지 않았다.

그 후 오류 상태 자동 펼침, 실제 제품과 같은 데모 복구 동작, 기존 필수 검사로의 gate 연결을 보완하고 main의 0.4.1을 통합했다. 최종 코드 `eacdce3`의 [통합 CI](https://github.com/yonghyeun/submeta-playback-presets/actions/runs/35619660448)가 성공했다. `Design system / Design validation`과 `Extension validation` 모두 성공했으며 UI 29/29, 오류 감지 5종, 기존 제품 E2E 12/12, 패키지 재생성 후 manifest 일치까지 확인했다. 이후 완료 기록 정리는 문서 변경이다.

## 실패 감지 실험의 의미

| 의도적 오류 | 감지 근거 |
|---|---|
| 없는 토큰 참조 | 참조 오류를 포함한 비정상 종료 |
| 버튼 색·높이 변경 | `toHaveScreenshot` 실패 및 expected/actual/diff |
| 배속의 접근 가능한 이름 제거 | axe `select-name` 위반 |
| 체크박스 키보드 조작 차단 | Space 조작 후 상태 assertion 실패 |
| 임시 ZIP에서 배속을 1배로 고정 | 실제 E2E의 1.5배 기대값 실패 |

각 브라우저 실험은 정확히 한 개의 대상 테스트가 예상 이유로 실패하는지 검사했다. 제품 소스와 기준 이미지를 변경하지 않고 페이지 또는 임시 추출 패키지에만 오류를 넣었다. 빨간 실험 보고서는 정상 제품 검사의 실패를 뜻하지 않는다.

## 범위와 다음 단계

P5의 GIF 편집기 전체 토큰 적용, P6의 실제 로그인 강의·Firefox/Chrome·Mac 보조 앱 검수는 아직 하지 않았다. 별도 출처 iframe 및 closed root에서의 재사용성 검사는 실제 GIF 편집기 통합 검수와 구분한다. 추가 프로젝트 공통화는 대상 프로젝트 확보 후 진행한다.

기존 미커밋 GIF 문서·실험 파일은 작업 브랜치 커밋에 포함하지 않고 보존했다. [PR #5](https://github.com/yonghyeun/submeta-playback-presets/pull/5)는 검토용 초안이며 병합·스토어 배포는 하지 않았다.
