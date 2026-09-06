# Submeta Playback Preset

Submeta 기존 강의 플레이어의 배속과 자막 설정을 영상마다 자동 적용하는 Firefox 데스크톱 확장 기능.

## 현재 상태

2026-09-06: 공유 대화에서 요구사항을 인계받아 준비 문서를 구성했다. 구현과 실제 사이트 기술검증은 아직 시작하지 않았다.

- [제품 요구사항](docs/PRD.md)
- [기술 설계 초안](docs/TECH_SPEC.md)
- [단계별 작업](docs/TASKS.md)
- [작업 운영](docs/WORKFLOW.md)
- [관찰 및 검증 기록](docs/POC_RESULTS.md)

출처: https://chatgpt.com/share/6a9d4d73-887c-83e8-b183-49d2a5c7e32b

이 문서는 공유 페이지에서 읽은 대화 내용을 재구성한 것이다. 이전 대화의 첨부 PRD·기술정의서·Git bundle 원본을 가져온 것은 아니며, 그 환경의 커밋 이력도 복원하지 않았다.

Git 2.50.1 실행을 확인하고 main 브랜치에 문서 기준선을 구성했다. 다음 작업은 T-101 실제 플레이어 구조 조사다. 공급자·권한·어댑터는 관찰 결과로 확정한다. Node.js·npm은 현재 PATH에서 찾지 못했으며 코드 실험·구현 전 T-003에서 준비한다.
