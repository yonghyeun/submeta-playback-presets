# GitHub 자동 검증

워크플로: [CI](../.github/workflows/ci.yml). `main` push, `main` 대상 PR, 수동 실행에서 동작합니다. 경로 필터가 없어 문서 PR에도 필수 검사가 실행됩니다.

`Extension validation`은 Ubuntu 24.04 / Node.js 24에서 다음을 순서대로 검사합니다.

1. `npm ci`로 package-lock.json의 의존성 설치
2. 단위 테스트
3. Firefox 배포 코드의 web-ext lint (경고도 실패 처리)
4. Chromium 및 시스템 의존성 설치 후 Playwright 11개 항목 실행
5. 허용 파일만 포함하는 미서명 ZIP 생성과 패키지 manifest 확인

Playwright HTML 보고서와 실패 시 trace/screenshot은 실행의 Artifacts에서 7일 동안 확인할 수 있습니다. 실제 Submeta 계정, 로그인 비밀값, 유료 영상은 사용하지 않습니다. Chromium 어댑터 검증이며 실제 Firefox/Submeta 검사를 대체하지 않습니다.

## main 병합 조건

- PR 필수, 최신 main 기준 `Extension validation` 통과 필수
- 리뷰 대화 해결 필수, 관리자에게도 규칙 적용
- 강제 push와 브랜치 삭제 금지
- 필수 승인자 수는 0명: 단독 관리자가 본인 PR을 병합할 수 있습니다. 외부 PR은 관리자가 검토합니다.

CI 이름을 바꿀 때에는 브랜치 보호의 필수 검사 이름도 함께 변경해야 합니다.

## 개발 도구 의존성 점검

2026-09-11 npm audit에서 web-ext 10.6.0 관련 개발 의존성 5개 항목(높음 3, 중간 2)이 보고되었습니다. 대상은 web-ext, addons-linter, image-size, adm-zip, firefox-profile입니다. 배포 ZIP에는 이 의존성들이 포함되지 않습니다. 자동 수정 제안은 web-ext 10.5.0으로 변경하는 것이므로 이번 CI 설정에서는 적용하지 않았습니다. 호환성 검증을 포함한 별도 의존성 수정이 필요합니다. 현재 CI는 npm audit를 병합 차단 검사로 사용하지 않습니다.

설정 참고: [Playwright CI 공식 문서](https://playwright.dev/docs/ci), [GitHub 브랜치 보호 공식 문서](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
