import type {Meta,StoryObj} from '@storybook/react-vite';
import {Progress} from '../ui/components';
import {Frame,specimenCSS} from './Frame';
const meta={id:'progress',title:'기본 요소/Progress',component:Progress,tags:['autodocs'],
 decorators:[Story=><Frame css={specimenCSS}><Story/></Frame>],args:{label:'GIF 생성 진행률',value:24,max:50},
 parameters:{docs:{description:{component:'실제 GIF 생성에 사용하는 진행 표시입니다. 전체 작업량을 모르면 value를 생략합니다. 진행 상태는 옆의 StatusMessage로 함께 안내합니다.'}}},
} satisfies Meta<typeof Progress>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Determinate:Story={};
export const Indeterminate:Story={args:{value:undefined}};
export const Complete:Story={args:{value:50}};
