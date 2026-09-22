# 전체 제품 UI 적용 범위

2026-09-22. 이번 업데이트의 완료 범위는 **이 저장소의 확장 프로그램이 직접 제공하는 모든 사용자 UI**다. 다른 프로젝트나 원래 Submeta 강의 사이트의 UI를 변경한다는 뜻은 아니다.

## 적용 목록

| 사용자 UI | 공통 구현 | Storybook / 검증 |
|---|---|---|
| 재생 설정·배속·자막·언어·활성화 | PlaybackSettings, Checkbox, SelectField | playback 상태 사례, 실제 ZIP 설정 검사 |
| 저장·적용 상태·재시도·현재 영상 해제 | StatusMessage, Disclosure, Button | 오류·loading·disabled·키보드 검사 |
| GIF 실행·연결 중·영상 준비 필요·연결 실패 | GifLauncher, Button, StatusMessage | giflauncher 6개 사례, 접근성·상태 검사, 실제 ZIP 열기/닫기 |
| 편집창 제목·닫기·배경·반응형 배치 | GifEditor, Button, 공통 토큰 | gif 모바일/데스크톱 기준, 포커스·Escape·배경 잠금 |
| 시간 입력·입력 오류·선택 구간·탐색 버튼 | TimeField, Timeline, 공통 버튼 스타일 | 실제 light DOM 입력·범위·드래그·플레이어 단축키 검사 |
| 생성·취소·진행 표시 | Button, Progress, StatusMessage | 정량/대기/완료 진행 사례, 취소 후 구간 유지 |
| 미리보기·저장·복사·폴더 안내·오류 복구 | GifEditor, Button, StatusMessage | 완료·저장 중/실패·복사 실패·보조 앱 부재 상태 |
| 진단 정보 | Disclosure | 같은 키보드·포커스 규칙, 공통 타입·토큰 검사 |

기존 타임라인 컨트롤러는 React Timeline이 관리하는 하위 영역 안에서 동작한다. 컨트롤러 내부 스타일도 토큰 검사 대상이다. 시간 입력 슬롯은 플레이어 키보드 호환성을 위한 명시적 예외다.

## 시스템 소유 UI

- macOS 폴더 선택: NSOpenPanel. 운영체제의 권한·키보드·접근성 규칙을 유지한다.
- 파일 다운로드/저장 위치: 브라우저 기본 대화상자. 확장의 공통 버튼과 상태 안내에서 연결한다.
- 원래 강의 사이트와 Cloudflare 플레이어의 메뉴·자막·재생 버튼은 외부 서비스가 소유한다.
- 인코더 iframe·캡처 canvas는 사용자 화면이 없는 처리 요소다.
- 개발 실험·테스트 자료·스토어 소개 이미지는 배포되는 제품 UI가 아니다.

## 앞으로의 작업 규칙

1. `design/ui-surfaces.json`에서 기존 화면·컴포넌트·스타일·사례를 확인한다.
2. 새 UI는 공통 컴포넌트를 조합한다. 진행은 Progress, 동작은 Button, 상태는 StatusMessage, 접힌 설명은 Disclosure를 우선 사용한다.
3. 새 화면은 목록에 소유 소스와 Storybook 상태를 등록한다. 기본·대기·오류·사용 불가 상태를 함께 정의한다.
4. `design:check`는 등록되지 않은 확장 DOM 생성과 HTML/CSS 화면을 감지한다. 제품 컨트롤러와 UI 소스의 임의 색상·픽셀 상수도 검사한다. 동적으로 우회하는 모든 DOM API를 증명하는 정적 분석기는 아니므로 코드 검토를 함께 수행한다.
5. UI 검사는 등록한 사례가 실제 빌드에 존재하는지 확인한다. 제품과 사례는 같은 React 소스를 사용한다.
6. 자동 검사와 실제 서비스 검수의 결과를 구분한다. 기존 P6의 실제 Submeta·Firefox·Mac 저장 경로 검수는 별도다.

## 이번 보완

GIF 실행 오류도 공통 오류 색·메시지로 표시하고 재연결 시 오래된 오류를 지운다. 연결 중에는 중복 실행을 막고 상태를 알린다. GIF 생성 진행률을 공통 Progress로 분리했다. Storybook 시작 화면에서 재생 설정·GIF 실행·GIF 편집기·진행 표시로 바로 이동할 수 있다.

검증 결과는 아래 완료 기록에 갱신한다.
