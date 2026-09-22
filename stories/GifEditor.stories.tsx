import type {Meta,StoryObj} from '@storybook/react-vite';
import {GifDemo,gifScenarios} from './gif-demo';
const meta={
  id:'gif',title:'GIF 편집기',component:GifDemo,tags:['autodocs'],args:{scenario:'ready',theme:'dark',mode:'open'},
  argTypes:{scenario:{control:'select',options:Object.keys(gifScenarios)},theme:{control:'radio',options:['dark','light']},mode:{control:'radio',options:['open','closed']}},
  parameters:{docs:{description:{component:'GifEditor는 공통 Button·StatusMessage·Disclosure·TimeField와 Timeline을 조합합니다. 제품과 동일한 React 소스와 타임라인을 사용하며, 생성·저장·복사 응답과 썸네일만 고정된 예시입니다. 시간 입력과 타임라인은 실제 제품처럼 light DOM 슬롯에 두어 플레이어 단축키 충돌을 막습니다. React가 타임라인의 생성·동기화·해제를 관리하고 기존 드래그·구간 계산·썸네일 서비스는 전용 하위 영역을 소유합니다.'}}},
} satisfies Meta<typeof GifDemo>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Ready:Story={name:'01 · 구간 선택'};
export const Loading:Story={name:'02 · 영상 준비 중',args:{scenario:'loading'}};
export const Invalid:Story={name:'03 · 시간 입력 오류',args:{scenario:'invalid'}};
export const Generating:Story={name:'04 · 생성 중',args:{scenario:'generating'}};
export const Cancelled:Story={name:'05 · 취소 후',args:{scenario:'cancelled'}};
export const Error:Story={name:'06 · 생성 실패',args:{scenario:'error'}};
export const Complete:Story={name:'07 · 생성 완료',args:{scenario:'complete'}};
export const Saving:Story={name:'08 · 저장 중',args:{scenario:'saving'}};
export const Saved:Story={name:'09 · 저장 완료',args:{scenario:'saved'}};
export const SaveError:Story={name:'10 · 저장 실패',args:{scenario:'saveError'}};
export const CopyError:Story={name:'11 · 복사 실패',args:{scenario:'copyError'}};
export const NativeUnavailable:Story={name:'12 · 보조 앱 없음',args:{scenario:'nativeUnavailable'}};
export const FolderUnselected:Story={name:'13 · 폴더 미선택',args:{scenario:'folderUnselected'}};
export const Light:Story={name:'14 · 밝은 테마',args:{theme:'light'}};
export const ClosedRoot:Story={name:'15 · 닫힌 Shadow DOM',args:{mode:'closed'}};
