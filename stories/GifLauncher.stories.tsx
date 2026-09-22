import type {Meta,StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {GifLauncher} from '../ui/gif-components';
import {gifLauncherCSS} from '../ui/gif-styles';
import {Frame} from './Frame';
const meta={id:'giflauncher',title:'조합 요소/GifLauncher',component:GifLauncher,tags:['autodocs'],
  decorators:[(Story,context)=><Frame theme={context.parameters.theme || 'dark'} css={gifLauncherCSS}><Story/></Frame>],
  args:{opened:false,disabled:false,hint:'구간을 선택하고 GIF로 만들기',tone:'neutral',onOpen:fn()},
  argTypes:{tone:{control:'radio',options:['neutral','success','error']}},
  parameters:{docs:{description:{component:'실제 강의 화면의 GIF 실행 영역입니다. 공통 Button과 StatusMessage를 조합하고 연결 중·준비 필요·실패를 구분합니다. 모달 포커스·배경 잠금은 제품 어댑터가 관리합니다.'}}},
} satisfies Meta<typeof GifLauncher>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Ready:Story={};
export const Connecting:Story={args:{disabled:true,hint:'편집창 연결 중…'}};
export const Waiting:Story={args:{hint:'영상을 준비한 뒤 다시 눌러주세요.'}};
export const Opened:Story={args:{opened:true,hint:'GIF 편집창이 열려 있습니다.'}};
export const Error:Story={args:{tone:'error',hint:'편집창을 연결하지 못했습니다. 페이지를 새로 고침해주세요.'}};
export const Light:Story={parameters:{theme:'light'}};
