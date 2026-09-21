# 작업 운영

작업 선택 → 변경 → 검증 → 결과 기록 → diff 검토 → 커밋 → 다음 작업.

디자인 시스템 작업은 [디자인 진행표](DESIGN_PROGRESS.md)에서 선택하고 [실행 파이프라인](DESIGN_IMPLEMENTATION_PIPELINE.md)과 [검사 실행 안내](DESIGN_RUNBOOK.md)를 따른다.

- main은 검토된 기준 상태. 초기 문서 기준선은 동작하는 확장 기능을 뜻하지 않는다.
- 작업 브랜치는 codex/player-discovery처럼 codex/ 접두사를 사용한다.
- 커밋은 작업 ID를 포함한다. 예: [T-101] docs: record observed player structure.
- 완료 여부는 관찰·테스트 증거로 판단한다. 파일 생성이나 커밋만으로 기능을 완료 처리하지 않는다.
- 성공·실패·미확인을 POC_RESULTS.md에 분리해 기록한다.
- 쿠키, 비밀번호, 인증 토큰, 원본 영상 URL, HAR, 브라우저 프로필을 커밋하지 않는다. .gitignore와 별개로 staged diff를 확인한다.
- 의존성과 권한은 검증에 필요한 시점에 추가한다.
- GitHub 원격 저장소: https://github.com/yonghyeun/submeta-playback-presets. 기본 브랜치는 main이다. 제품 제출·배포 상태는 release/RELEASE_0.4.0.md를 기준으로 한다.
