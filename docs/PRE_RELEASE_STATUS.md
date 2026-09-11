# 배포 전 준비 상태 — 2026-09-11

**0.3.0 배포 후보·검증 결과·등록 초안을 준비했다. 외부 제출은 하지 않았다.** 게시자는 aebongbong, 공개 지원 이메일은 aaabonggg@gmail.com, 라이선스는 MIT로 확정했다. 심사용 접근 방식과 공개 방식이 남아 있어 즉시 제출 가능한 상태로 간주하지 않는다.

## 검증과 발견한 문제

| 항목 | 결과 |
| --- | --- |
| Firefox 155.0.1, 실제 자막 편집 | 최초 유지 OFF → 자막 끄기에서 저장 후 자막이 남는 문제 발견. 수정 후 영어 표시 및 OFF 화면 확인. 최종 0.3.0 다시 로드 후 OFF → 한국어 ON 재확인 |
| 저장 이벤트 지연 회귀 | 자신의 저장 이벤트가 set() 완료 이후 도착해 적용 작업을 reset하는 문제. 현재 및 직전 편집의 자체 revision을 식별해 무시하도록 수정. 회귀 테스트 통과 |
| 실제 다음 영상 3회 | Posture and Grip Breaks → Opening the Closed Guard → Closed Guard Open: The Lockpick. 각 강의에서 1.5배·한국어 메뉴·활성화 상태 확인 |
| 현재 영상 해제 | The Lockpick에서 해제 후 원래 플레이어 Settings → Speed 1x 선택. `1배 · 현재 영상 해제` 확인 |
| 다음 영상 자동 재개 | Common Errors in Opening the Closed Guard from Standing에서 다시 1.5배·한국어 확인 |
| 다른 코스 이동 | Foundations IV: Passing → Foundations II: Guard 이동 후 1.5배 유지 |
| 자막 메뉴 없는 실제 강의 | Linking Retention with Offense: `자막 메뉴 없음 · 제어 미지원`, 배속 1.5배 확인 |
| 선택 언어 없는 실제 강의 | 미확인. 접근한 자막 제공 영상들은 한국어를 제공했다. 해당 동작은 Playwright fixture에서 통과 |
| 최종 설정 복원 | 원래 Introduction to Passing the Guard로 돌아와 유지 ON·1.5배·한국어 CC 및 약 2.130초 일시정지로 복원. 시작 3.507초와 정확히 같지는 않음 |
| 자동 테스트 | 기존 두 VM suite + Playwright 11개 통과, 약 2분, 재시도 0회 |
| Mozilla 검사 | web-ext 10.6.0: 오류 0·경고 0·notice 0 |
| 패키지 검사 | MIT LICENSE 포함 허용 파일 11개, ZIP CRC 검사 및 두 번 생성한 SHA-256 일치 |
| 제출 이미지 | 원본 강의/계정 화면 없이 실제 확장 UI와 예시 플레이어로 2종 생성, 육안 확인 |

실제 자막 검증에서는 메뉴·화면·상태 및 재생 위치 진행을 관찰했다. 밀리초 지연, 미세 끊김, 자막 싱크와 장시간 안정성을 계측한 결과는 아니다. 영상 접근 과정에서 서비스의 재생 진행 기록은 변경될 수 있다.

## 코드·패키지 변경

- 버전 0.3.0, 이름 Playback Presets for Submeta, 비공식 설명.
- 지연된 자체 저장 이벤트가 새 편집을 취소하지 않도록 revision 추적(메모리 내 최대 128개).
- 데이터 수집 없음 선언, Firefox 최소 버전 142.
- 직접 제작한 아이콘 및 정적 배속 option HTML로 lint 경고 제거.
- 패키징 스크립트와 파일 해시 목록, 스토어 한·영 소개·개인정보 설명·심사자 초안.

정확한 최종 파일과 해시는 [패키지 명세](../release/PACKAGE_MANIFEST.json), 검사 결과는 [Mozilla lint](../release/WEB_EXT_LINT.json), 반복 검증은 [Playwright 목록](PLAYWRIGHT_TEST_CASES.md) 참조.

## 개발 도구 보안 점검

공식 수정 릴리스가 없는 개발 의존성 5개 항목(원인 권고 3개)은 미해결 상태입니다. 배포 ZIP에는 포함되지 않습니다. 새 권고와 2026-10-11 재검토 기한을 감시하는 CI 검사를 추가했습니다. [CI 운영 문서](CI.md) 참조.

## 제출을 막는 남은 항목

- PR 기여 절차와 양식 및 [공개 원격 저장소](https://github.com/yonghyeun/submeta-playback-presets) 연결 완료. PR 및 `Extension validation` 통과를 요구하는 main 보호 규칙 적용.
- 심사용 Submeta 계정/콘텐츠 접근 방식 미정.
- 실사이트 선택 언어 미제공 표본은 미확인. 공개 설명에서 전체 영상 지원으로 과장하지 않음.
- 서명 및 Firefox 종료/재시작 검증은 제출 이후 별도 수행해야 함.

[배포 자료 모음](../release/README.md)을 검토한 뒤 위 항목을 확정하면 제출 단계로 진행할 수 있다.
