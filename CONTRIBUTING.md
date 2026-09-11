# 기여 안내

이 프로젝트는 MIT 라이선스로 배포합니다. 프로젝트 저장소에 반영할 변경은 **Pull Request(PR)**로 제안합니다. 관리자는 **aebongbong**, 지원 이메일은 **aaabonggg@gmail.com**입니다.

## 변경을 제안하는 방법

1. [공개 저장소](https://github.com/yonghyeun/submeta-playback-presets)를 fork하고 변경용 브랜치를 만듭니다.
2. 한 PR에는 하나의 문제나 관련된 변경을 담습니다. 큰 기능 변경은 먼저 issue에서 논의합니다.
3. 변경 목적, 재현 방법, 수정 후 동작을 PR에 설명합니다.
4. 변경 범위에 맞는 검증 결과를 첨부합니다. UI 변경은 계정 정보가 없는 화면을 첨부합니다.
5. aebongbong의 검토 후 병합합니다. 병합과 스토어 새 버전 배포는 별도 작업입니다.

프로젝트에 대한 기여는 동일한 MIT 라이선스로 제공합니다. PR 절차는 이 프로젝트의 원본 저장소 반영 방식이며, MIT가 허용하는 별도 복사본의 수정·배포 권한에 추가 제한을 두지 않습니다.

## 개발과 검증

```sh
npm ci
npm run test:install
npm test
npm run lint:extension
```

- 배포용 코드: `extension/`. 테스트용 Chromium 변환 코드를 배포 코드에 넣지 않습니다.
- 동작 변경/버그 수정: 재현 가능한 단위 테스트 또는 Playwright 테스트를 추가·수정하고 관련 검사를 실행합니다.
- 문서만 변경: 링크·설명과 `git diff --check`를 확인합니다. 불필요한 브라우저 테스트는 요구하지 않습니다.
- 실제 Submeta/Firefox 검사와 로컬 테스트 결과를 구분합니다.
- 로그인 정보, .env, 쿠키, 영상 인증 URL, 브라우저 프로필은 커밋하지 않습니다.
- 서명, 공개 등록, 배포 버전 확정은 관리자가 수행합니다.

세부 테스트 범위는 [테스트 안내](tests/README.md), 배포 절차는 [배포 자료](release/README.md)를 참고하세요.

## 저장소 설정 상태

공개 저장소는 [https://github.com/yonghyeun/submeta-playback-presets](https://github.com/yonghyeun/submeta-playback-presets)이며 기본 브랜치는 `main`입니다. PR 양식을 이용해 변경을 제안할 수 있습니다. `main`은 PR과 최신 기준 브랜치에서 통과한 `Extension validation` 검사를 요구합니다. 관리자에게도 적용하며 강제 push와 브랜치 삭제를 금지합니다. 대화 해결도 병합 조건입니다. 단독 관리자의 자체 PR 병합을 허용하기 위해 필수 승인자 수는 0명입니다. 외부 기여는 관리자가 검토 후 병합합니다.
