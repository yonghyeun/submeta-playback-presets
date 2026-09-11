# Submeta Playback Preset

## 현재 사용자용 버전

[extension/README.md](extension/README.md): 플레이어 아래에서 배속·CC·언어를 설정하고 자동 저장하는 0.2 버전. [구현 및 검증 기록](docs/INLINE_PRESETS.md)을 참고한다. 기존 experiments/ 폴더는 수동 제어 실험이며 사용자용 버전과 구분한다.

Submeta 기존 강의 플레이어의 배속과 자막 설정을 영상마다 자동 적용하는 Firefox 데스크톱 확장 기능.

## 현재 상태

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
