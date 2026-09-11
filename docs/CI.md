# GitHub 자동 검증

워크플로: [CI](../.github/workflows/ci.yml). `main` push, `main` 대상 PR, 수동 실행에서 동작합니다. 경로 필터가 없어 문서 PR에도 필수 검사가 실행됩니다.

`Extension validation`은 Ubuntu 24.04 / Node.js 24에서 다음을 순서대로 검사합니다.

1. `npm ci`로 package-lock.json의 의존성 설치
2. `npm run audit:dependencies`로 새 취약점 및 재검토 기한 확인 후 단위 테스트
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

2026-09-11 npm audit에서 개발 의존성 5개 항목(높음 3, 중간 2)이 보고되었습니다. 대상은 web-ext, addons-linter, image-size, adm-zip, firefox-profile입니다. 배포 ZIP에는 포함되지 않습니다. 공식 npm 최신 버전과 보안 권고를 확인했으나 image-size 2.0.2와 adm-zip 0.6.0에는 수정 릴리스가 없습니다. 취약점은 미해결 상태입니다.

CI는 `scripts/audit-baseline.json`에 기록한 3개 원인 권고의 패키지·URL·영향 범위·심각도만 2026-10-11까지 알려진 항목으로 허용합니다. 새 권고, 권고 내용 변경, audit 조회 실패, 재검토 기한 경과는 검사를 실패시킵니다. lint 단계에는 2분 제한이 있습니다. 이 조치는 취약점을 수정하지 않습니다. 수정 릴리스가 나오면 의존성을 업데이트하고 기준선에서 제거해야 합니다.

검증: 알려진 항목 및 취약점 0건은 통과, 새 권고 및 네트워크 오류 응답은 실패하는 것을 확인했습니다.

원인 권고: [ICNS 무한 루프](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [JXL/HEIF 무한 루프](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [ZIP 심볼릭 링크](https://github.com/advisories/GHSA-vwc7-r8mq-g2x9).

설정 참고: [Playwright CI 공식 문서](https://playwright.dev/docs/ci), [GitHub 브랜치 보호 공식 문서](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
