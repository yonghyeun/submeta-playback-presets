# 디자인 시스템 실행 안내

## 화면 열기

Node.js 22.12+ 또는 24와 npm이 있는 환경에서 `npm ci` 후 실행한다.

```sh
npm run storybook
```

현재 데스크톱 작업 폴더에서는 `./scripts/design-local.sh storybook`으로 제공된 Node/npm을 사용할 수 있다. 기본 주소는 `http://127.0.0.1:6006/?path=/story/design--overview`다.

- **시작**: 디자인 철학, 조작 가능한 재생 패널, 상태 비교, 색상 토큰, 밝은 테마, 변경 전 화면.
- **재생 설정**: 기본/불러오는 중/저장 중/실패/유지 꺼짐/언어 미제공/연결 실패/현재 영상 해제/처음 사용/밝은 테마/닫힌 root.
- **기본 요소**: 버튼, 체크박스, 선택 입력, 상태 문구.

Storybook의 입력은 데모 상태를 바꾸며 실제 계정이나 브라우저 설정을 저장하지 않는다. 제품과 동일한 렌더러를 사용한다.

## 검사 실행

```sh
npm run test:install
npm run test:design
npm run test:ui:report
```

현재 작업 폴더에서는 `./scripts/design-local.sh test:design`, 보고서는 `./scripts/design-local.sh test:ui:report`로 실행할 수 있다. 브라우저 실행은 실행 환경의 권한이 필요할 수 있다.

`test:design`은 토큰/스타일 → Storybook 빌드 → UI → 기존 단위 → 확장 lint → 실제 ZIP E2E를 한 번씩 실행한다. 의존성 보안 검사는 기존 CI의 `audit:dependencies`가 담당한다. UI 검사만 반복할 때는 먼저 변경된 사례를 빌드하고 `npm run test:ui`를 실행한다. 테스트가 정적 서버를 시작하고 끝나면 닫는다. 개발 중 이미 켜진 6006 포트의 서버는 로컬에서만 재사용한다.

## 결과 확인

| 결과 | 위치 |
|---|---|
| UI 검사 HTML 보고서 | `design-report/index.html` |
| UI 검사 결과 JSON·실패 이미지·trace | `design-test-results/` |
| 기존 확장 E2E 보고서 | `playwright-report/index.html` |
| 의도적 오류 감지 기록 | `design-fault-results/summary.json` 및 유형별 로그 |
| 오류 감지 실험의 화면 diff 보고서 | `design-fault-report/visual/index.html` |
| 정상 기준 이미지 | `tests/ui/__screenshots__/<platform>-<arch>/` |

HTML 보고서는 `file://`로 열기보다 위 보고서 명령으로 연다. CI artifact는 `design-evidence-linux`, `storybook-preview`이며 7일 보관한다. 다운받은 Storybook은 저장소의 `scripts/design/serve.mjs`로 해당 폴더를 제공해 볼 수 있다.

## 디자인 변경 절차

1. `DESIGN_PROGRESS.md`에서 작업을 선택하고 수용 기준을 기록한다.
2. 디자인 값은 `design/tokens.json`에서 수정하고 `npm run design:generate`를 실행한다.
3. 제품 렌더러를 수정하고 대응하는 Storybook 상태 사례를 추가한다.
4. `npm run test:design`을 실행하고 실패 화면을 검토한다.
5. 의도한 시각 변화만 해당 플랫폼에서 `npm run test:ui:update`로 반영하고 diff를 검토한다. 다른 OS의 이미지를 복사해 통과시키지 않는다.
6. 검증 증거와 예외를 기록하고 PR에 전후 화면을 첨부한다.

Linux 시각 검사는 Playwright 1.62.1의 `mcr.microsoft.com/playwright:v1.62.1-noble` 컨테이너에서 실행한다. Node 24.19.0, 브라우저·폰트 의존성은 잠금 파일, locale `ko-KR`, timezone `Asia/Seoul`, 배율 1, dark/reduced-motion 설정을 사용한다. 로컬 Mac 이미지는 별도로 유지한다. 환경 버전 변경도 기준 이미지 재검토 사유다.

CI 이미지 digest는 `sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`로 고정했다. 기존 CI가 디자인 workflow를 호출하고, 필수 검사인 `Extension validation`은 디자인 결과가 성공해야 진행한다. 디자인 검사가 실패·생략되면 명시적으로 실패하므로 작업 의존성의 skip으로 통과 처리하지 않는다. 저장소 보호 규칙 자체는 변경하지 않는다.

CI에서 기준 이미지가 없으면 검사 실패 결과의 actual을 받는다. **통과 처리하지 않고** 같은 환경에서 얻은 화면을 검토한 뒤 기준 이미지로 커밋하고 다시 CI를 실행한다. 자동 갱신이나 이미지 차이 무시는 없다.

## 검사 자체가 작동하는지 확인

정상 UI 검사 통과 후 `npm run test:design:guards`를 실행한다. 누락 토큰, 버튼 스타일 변경, 접근 가능한 이름 제거, 키보드 차단, 임시 패키지의 배속 처리 오류를 각각 넣고 예상 검사만 실패하는지 확인한다. 실패 메시지와 실패 개수도 확인하므로 환경 오류를 감지 성공으로 취급하지 않는다. 원본 제품 파일과 기준 이미지는 바꾸지 않는다.

자동 접근성 검사는 WCAG 2 A/AA와 2.1 A/AA 태그의 axe 규칙이며 예외는 없다. 이것만으로 전체 접근성 준수를 선언하지 않는다. 실제 GIF 모달·영상·Mac 보조 앱 검수는 P5/P6에서 이어간다.
