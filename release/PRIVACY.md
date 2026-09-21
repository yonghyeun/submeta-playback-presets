# 개인정보 처리 안내 / Privacy notice

Version 0.4.0 — 2026-09-21

## 한국어

Playback Presets for Submeta는 비공식 재생 설정 보조 확장입니다.

확장은 자동 유지 여부, 배속, 자막 모드, 선호 언어 및 설정 동기화용 식별값을 브라우저의 확장 로컬 저장소에 저장합니다. 개발자 서버로 개인정보, 시청 기록 또는 분석 데이터를 전송하지 않습니다. 분석 SDK, 광고, 원격 실행 코드가 없습니다.

동작을 위해 현재 강의 페이지의 플레이어 요소, 페이지 경로와 iframe 주소, 배속, 자막 메뉴의 언어 목록과 트랙 표시 상태를 읽습니다. 페이지 경로와 영상 주소는 연결을 관리하는 동안 메모리에서 사용하며 확장 저장소에 보관하거나 개발자에게 전송하지 않습니다. 자막 본문, 로그인 비밀번호 또는 쿠키를 수집하지 않습니다.

현재 영상만 해제 상태는 해당 탭의 메모리에 유지합니다. 브라우저의 확장 관리 기능에서 확장을 제거하면 브라우저가 관리하는 확장 저장 데이터도 제거됩니다. 설치 방식에 따른 브라우저의 데이터 처리 동작은 브라우저 정책을 따릅니다.

Submeta 및 영상 제공 서비스의 자체 네트워크 통신과 개인정보 처리는 해당 서비스의 정책을 따릅니다. 이 확장은 기존 플레이어의 재생·자막 선택 기능을 조작하며, 전체 강의 다운로드나 구독 제한 해제 기능을 제공하지 않습니다. 사용자가 접근할 수 있는 재생 영상의 짧은 구간을 GIF로 생성할 수 있습니다.

게시자: aebongbong. 개인정보 관련 문의: aaabonggg@gmail.com.

## English

Playback Presets for Submeta is an unofficial playback settings helper.

It stores playback retention preferences, speed, caption mode, preferred language and a settings revision identifier in the browser's local extension storage. It does not send personal information, viewing history or analytics to a developer-operated server. It contains no analytics SDK, advertising or remotely executed code.

To operate, it reads the current lesson's player elements, page path and iframe address, playback rate, available caption labels and text-track visibility state. Page paths and media addresses are used in memory to manage the player connection; they are not stored in extension storage or sent to the developer. The extension does not collect caption text, login passwords or cookies.

Current-video suspension is kept in the current tab's memory. Extension data removal is managed by the browser when uninstalling the extension, subject to the browser's behavior for the installation method used.

Submeta and its video provider operate their own network services under their own privacy policies. This extension controls the existing playback and caption interfaces. It does not download courses or bypass subscription access.

Publisher: aebongbong. Privacy and support contact: aaabonggg@gmail.com.


## GIF 기능 / GIF feature

선택한 구간의 영상 프레임을 메모리에서 읽고 로컬에서 GIF로 인코딩합니다. 프레임이나 생성 GIF를 개발자 서버로 전송하지 않습니다. 탐색 미리보기는 영상 제공 서비스의 썸네일 요청을 사용합니다. 파일 저장 시 브라우저 다운로드 기능으로 사용자가 선택한 위치에 GIF를 씁니다.

선택 설치하는 Mac 보조 앱은 nativeMessaging으로 GIF 데이터·파일명·무결성 해시를 전달받습니다. 기억한 폴더의 북마크/경로는 사용자 Library/Application Support/Submeta GIF Folder/folder.json에 저장합니다. 원본 GIF 파일 복사를 위해 Library/Caches/Submeta GIF Clipboard에 GIF를 보관하고 클립보드에는 해당 파일 참조를 씁니다. 이전 클립보드 내용은 읽지 않습니다. 캐시는 자동 삭제하지 않으며 같은 GIF는 재사용합니다. 확장 삭제만으로 보조 앱·폴더 설정·캐시·사용자가 저장한 GIF가 삭제되지는 않습니다. 삭제 절차는 보조 앱 설치 안내에 있습니다. 사진 보관함에는 접근하지 않습니다.

Selected video frames are read in memory and encoded locally. Frames and generated GIFs are not uploaded to a developer server. Timeline previews request thumbnails from the existing video provider. Browser downloads write the generated GIF to a user-selected location.

The optional Mac companion receives GIF bytes, a filename and an integrity hash through nativeMessaging. It stores the selected folder bookmark/path in Library/Application Support/Submeta GIF Folder/folder.json. To copy the original animated file, it keeps a GIF in Library/Caches/Submeta GIF Clipboard and writes its file reference to the clipboard; it never reads the previous clipboard contents. Identical GIFs reuse a cache path. Cache files are not automatically deleted. Uninstalling the extension does not remove the companion, folder preferences, cached GIFs or user-saved GIF files. See the companion installation instructions for removal. The Photos library is not accessed.
