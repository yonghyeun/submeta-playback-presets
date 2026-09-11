# 0.3.0 배포 준비 자료 — 아직 미제출

## 준비된 파일

- [STORE_LISTING.md](STORE_LISTING.md): 한·영 스토어 소개와 등록 항목 초안
- [PRIVACY.md](PRIVACY.md): 한·영 개인정보 처리 안내
- [REVIEWER_NOTES.md](REVIEWER_NOTES.md): 심사자용 권한 설명·사용 및 재현 절차
- [PACKAGE_MANIFEST.json](PACKAGE_MANIFEST.json): 패키지 파일 목록·SHA-256
- [WEB_EXT_LINT.json](WEB_EXT_LINT.json): Mozilla web-ext 검사 결과
- [assets/listing-desktop.png](assets/listing-desktop.png), [assets/listing-mobile.png](assets/listing-mobile.png): 실제 확장 UI를 사용한 설명용 로컬 테스트 화면
- [아이콘](../extension/icons/icon-128.png): 직접 작성한 SVG에서 생성한 PNG
- 서명 전 패키지: `dist/submeta-playback-preset-0.3.0-unsigned.zip`

## 재생성·검사

```sh
npm install
npm run test:install
npm test
npm run lint:extension
npm run capture:listing
npm run package:release
```

현재 Codex 환경의 자동 테스트는 `./scripts/test-local.sh`로 실행한다. 패키지는 Python 표준 라이브러리만 사용하며 MIT LICENSE를 포함한 허용 목록의 11개 파일만 포함한다. 같은 소스에서 두 번 생성해 동일한 ZIP 해시를 확인했다. .env, 계정, 브라우저 프로필, 테스트 호환 코드, 실험용 코드와 스토어 초안은 설치 패키지에 포함하지 않는다.

## 확정된 정보

- 게시자: **aebongbong**
- 공개 지원 이메일: **aaabonggg@gmail.com**
- 라이선스: [MIT](../LICENSE)
- 코드 기여: [PR 절차](../CONTRIBUTING.md). [공개 원격 저장소](https://github.com/yonghyeun/submeta-playback-presets) 연결 완료. 브랜치 보호는 아직 미설정.

## 제출 전 남은 결정

1. 심사용 Submeta 계정·강의 접근 제공 방법. 기존 개인 계정 정보는 자료에 넣지 않았다.
2. 서명만 받은 뒤 소수 배포할지, experimental 공개로 제출할지.
3. PR 보호 규칙 및 필수 CI 검사 설정.
4. 실제로 선택 언어가 없는 강의 표본 검증 여부. 해당 동작은 자동 테스트만 통과했고 실사이트 표본은 미확인이다.

## 아직 하지 않은 작업

Mozilla 계정 생성/약관 동의, 파일 업로드, 서명 요청, 공개 등록, 서명 XPI 설치 후 Firefox 재시작 검증. ZIP은 서명된 정식 설치 파일이 아니다.

## 참고한 공식 제출 요구사항 — 2026-09-11 확인

- 데이터 수집 없음 선언: https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
- 제출 양식·지원·라이선스·심사 설명: https://extensionworkshop.com/documentation/publish/submitting-an-add-on/
- 기능 검증용 접근 정보: https://extensionworkshop.com/documentation/publish/add-on-policies/

현재 코드에는 `data_collection_permissions.required: ["none"]`를 추가했고 최소 Firefox 버전은 142다. 이는 호환성 선언이며 실제 검증 버전은 macOS Firefox 155.0.1이다. Android 지원은 검증하지 않았으므로 제출 플랫폼으로 선택하지 않는다.
