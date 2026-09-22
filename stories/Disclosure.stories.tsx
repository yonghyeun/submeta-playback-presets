import type {Meta, StoryObj} from '@storybook/react-vite';
import {Disclosure, StatusMessage} from '../ui/components';
import {Frame, specimenCSS} from './Frame';
const meta = {
  id:'disclosure', title:'기본 요소/Disclosure',component:Disclosure,tags:['autodocs'],
  decorators:[Story => <Frame css={specimenCSS}><Story/></Frame>],
  args:{summary:'저장 및 적용 상태',expanded:false,revealKey:'',children:<p><StatusMessage>배속: 1.25× 적용됨</StatusMessage></p>},
  argTypes:{summary:{control:'text'},expanded:{control:'boolean'},revealKey:{control:'text'},children:{control:false}},
  parameters:{docs:{description:{component:'보조 정보를 접고 펼치는 네이티브 details입니다. Enter·Space로 조작합니다. 새 오류의 revealKey가 들어오면 복구 행동을 펼치되 사용자가 다시 접을 수 있습니다.'}}},
} satisfies Meta<typeof Disclosure>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Collapsed: Story = {};
export const Expanded: Story = {args:{expanded:true}};
export const Error: Story = {args:{revealKey:'저장 실패',children:<p><StatusMessage tone="error">저장 실패 · 다시 변경해 주세요</StatusMessage></p>}};
