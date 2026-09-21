# Chrome Web Store 입력 문구

이름: Playback Presets for Submeta

짧은 설명: Submeta 강의의 배속과 자막을 플레이어 아래에서 조절하고, 다음 강의에도 저장한 설정을 적용하세요.

## 상세 설명

Submeta 강의를 볼 때마다 배속과 자막을 다시 설정하는 수고를 줄여 줍니다. 플레이어 바로 아래에서 설정을 바꾸고, 원하는 경우 다음 강의에도 자동으로 유지하세요.

• 배속을 선택하면 현재 영상에 바로 적용됩니다.
• 자막 켜기·끄기·변경하지 않기와 제공되는 자막 언어를 선택할 수 있습니다.
• ‘재생 설정 유지’를 켜면 다음 강의와 새로고침 후에도 저장한 설정을 적용합니다.
• 현재 영상만 자동 적용을 잠시 해제하거나 설정을 다시 적용할 수 있습니다.
• 설정은 현재 브라우저에 저장합니다. 개발자 서버 전송, 광고, 분석 도구는 없습니다.

설치 후 Submeta 강의 페이지를 새로고침하세요. 최초 설치 시 자동 유지는 꺼져 있으며 자막을 자동으로 켜지 않습니다. 선택한 언어가 없는 영상에서는 미제공 상태를 안내합니다.

Chrome 데스크톱용 비공식 보조 확장입니다. Submeta와 제휴하거나 Submeta의 승인을 받은 제품이 아닙니다. 강의 시청에는 Submeta 계정 및 해당 강의 접근 권한이 필요합니다. 영상 다운로드, 구독 제한 해제, 자막 번역 기능을 제공하지 않습니다. 사이트 플레이어 변경에 따라 동작에 제한이 생길 수 있습니다.

게시자: aebongbong
지원: aaabonggg@gmail.com

## Privacy 입력

단일 목적: Submeta 강의 플레이어의 배속과 자막 설정을 사용자가 선택하고 저장하여 다음 강의에 재적용하도록 돕습니다.

storage 권한 사유: 자동 유지 여부, 배속, 자막 모드, 선호 언어 및 저장값 동기화용 식별값을 브라우저 로컬 확장 저장소에 보관합니다.

https://submeta.io/* 접근 사유: 강의 페이지에서 플레이어를 찾아 설정 패널을 표시하고, 페이지·영상 전환을 감지하여 사용자의 재생 설정을 적용합니다.

https://iframe.cloudflarestream.com/* 접근 사유: Submeta에 임베드된 Cloudflare Stream 플레이어 프레임에서 배속과 제공되는 자막 메뉴를 읽고 변경하며, 적용 결과를 동일 탭의 설정 패널에 전달합니다.

원격 코드 사용: 없음. 실행 JavaScript는 모두 ZIP에 포함됩니다. 기존 강의 플레이어의 통신은 서비스 자체 동작입니다.

데이터 처리 설명: 설정은 로컬에 저장되며 개발자에게 수집·전송되지 않습니다. 페이지 경로와 iframe 주소 및 플레이어 상태는 기능 수행 중 메모리에서 처리합니다. 자막 본문, 비밀번호, 쿠키, 분석 데이터는 수집하지 않습니다. 개인정보 안내와 양식의 최신 정의를 확인하여 일관되게 선언합니다.

개인정보 안내 URL: release/PRIVACY.md를 공개 웹페이지에 게시한 실제 URL 입력 필요.

## Test instructions (English)

This is an unofficial helper for existing Submeta lessons. It requires an account with access to a playable lesson; it does not bypass access controls. Reviewer access credentials and a suitable lesson must be supplied privately in this dashboard before submission.

1. Sign in with the supplied reviewer account, open the supplied lesson, and reload after installation.
2. Find the playback settings panel directly below the player.
3. Select speed 1.5. Confirm the video speed changes immediately with retention initially disabled.
4. Enable captions and choose an available language. Confirm captions appear; switch captions off and confirm they disappear.
5. Enable “재생 설정 유지”, select speed 1.5 and available captions, then navigate to another lesson. Confirm settings reapply.
6. Reload and restart Chrome. Confirm saved preferences persist.
7. Expand “저장 및 적용 상태” and choose “현재 영상만 해제”. Confirm automatic enforcement pauses for the current video.

The extension does not translate captions. A language absent from the lesson is reported as unavailable. The store screenshot uses a clearly labeled illustrative test page with the actual extension UI.


## 0.4.0 GIF 추가 소개 / GIF update

플레이어 아래 GIF 만들기 버튼에서 썸네일 타임라인으로 1–15초 구간을 선택하고 움직이는 GIF로 저장하세요. 생성은 기기 안에서 처리합니다. Mac에서는 선택 설치하는 보조 앱으로 저장 폴더를 기억하고 원본 GIF 파일을 자동 복사할 수 있습니다. 보조 앱 없이도 일반 파일 저장은 가능합니다. Windows/Linux에서는 일반 파일 저장을 사용하세요. 사진 앱 저장은 지원하지 않습니다.

Create a 1–15 second animated GIF using a thumbnail trim timeline below the player. Encoding runs locally. Save the GIF using the browser's file dialog. On macOS, an optional separately installed companion remembers a folder and automatically copies the original GIF file. Windows/Linux support ordinary file saving; they do not include native clipboard/folder integration. Photos integration is not included.

Additional permissions: downloads saves only user-generated GIFs; nativeMessaging connects only to the optional local GIF companion for remembered-folder saving and original-file clipboard copy. No remote executable code or developer analytics.
