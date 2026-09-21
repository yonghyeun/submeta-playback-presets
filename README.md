# Submeta Playback Preset

## 현재 사용자용 버전

0.4.1은 공통 재생 설정 UI와 필요한 파일을 함께 패키징한 업데이트입니다. 배속·자막 설정 유지와 GIF 생성·저장을 지원합니다. [사용 안내](extension/README.md) · [배포 상태 및 지원 범위](release/RELEASE_0.4.1.md).

GIF는 기기에서 생성하며 파일 저장은 보조 앱 없이 사용할 수 있습니다. 저장 폴더 기억과 원본 GIF 파일 클립보드는 선택 설치하는 [Mac 보조 앱](native/macos/gif-folder/INSTALL.md)이 필요합니다. Windows/Linux 보조 앱과 사진 보관함 연동은 포함하지 않습니다.

Submeta 기존 강의 플레이어의 배속과 자막 설정을 영상마다 자동 적용하는 Firefox 데스크톱 확장 기능.

## 디자인 시스템 개발

공통 재생 패널과 상태별 사례를 Storybook에서 확인할 수 있습니다. 현재 작업 폴더에서는 `./scripts/design-local.sh storybook`, 일반 환경에서는 `npm run storybook`을 실행하세요. [화면·검사 실행 안내](docs/DESIGN_RUNBOOK.md) · [진행표](docs/DESIGN_PROGRESS.md).

## 초기 조사 기록 — 2026-09-06

아래는 초기 조사 당시의 기록입니다. 현재 제품·제출 상태는 위의 0.4.1 릴리스 문서, 현재 개발 환경과 검사는 아래 테스트 안내를 기준으로 합니다.

2026-09-06: 실제 Firefox 155.0.1에서 임시 확장으로 단일 강의의 배속 1.25배 변경, 한국어 자막 표시·끄기, 원래 1배/Off 복구를 검증했다. 공식 SDK의 늦은 연결은 실패로 기록했다. 자동 적용 제품 구현과 연속 영상 전환 검증은 아직 진행 전이다.

- [최소 제어 실험 확장](experiments/player-poc/README.md)

- [제품 요구사항](docs/PRD.md)
- [기술 설계 초안](docs/TECH_SPEC.md)
- [단계별 작업](docs/TASKS.md)
- [작업 운영](docs/WORKFLOW.md)
- [관찰 및 검증 기록](docs/POC_RESULTS.md)

출처: https://chatgpt.com/share/6a9d4d73-887c-83e8-b183-49d2a5c7e32b

이 문서는 공유 페이지에서 읽은 대화 내용을 재구성한 것이다. 이전 대화의 첨부 PRD·기술정의서·Git bundle 원본을 가져온 것은 아니며, 그 환경의 커밋 이력도 복원하지 않았다.

Git 2.50.1 실행을 확인하고 main 브랜치에 문서 기준선을 구성했다. 조사·실험은 codex/player-discovery 브랜치에서 기록한다. 다음 작업은 T-301 영상 전환 및 재적용 검증이다. Node.js·npm은 현재 PATH에서 찾지 못했으며 제품 빌드 도입 전 T-003에서 준비한다.

## 자동 테스트

Playwright 브라우저 테스트와 기존 단위 테스트를 함께 실행할 수 있습니다. 현재 작업 환경에서는 `./scripts/test-local.sh`를 실행하세요. 새 환경 설치 방법과 검증 범위는 [tests/README.md](tests/README.md)를 참고하세요.

## 라이선스와 기여

Copyright (c) 2026 aebongbong. [MIT 라이선스](LICENSE)를 사용합니다.

코드 변경은 [기여 안내](CONTRIBUTING.md)에 따라 PR로 제안하고 관리자 검토 후 병합합니다. 공개 저장소: [yonghyeun/submeta-playback-presets](https://github.com/yonghyeun/submeta-playback-presets).

게시자: **aebongbong** · 공개 지원 이메일: **aaabonggg@gmail.com**

## Chrome 배포 준비

Chrome용 별도 ZIP과 설치·스토어 제출 안내는 [Chrome 제출 자료](release/chrome/README.md)를 참고하세요.
