import type {Meta, StoryObj} from '@storybook/react-vite';
import {StatusMessage} from '../ui/components';
import {Frame, specimenCSS} from './Frame';
const meta = {
  id:'statusmessage', title:'기본 요소/StatusMessage',component:StatusMessage,tags:['autodocs'],
  decorators:[Story => <Frame css={specimenCSS}><div role="status" aria-live="polite"><Story/></div></Frame>],
  args:{children:'저장 중…',tone:'neutral'},
  argTypes:{tone:{control:'radio',options:['neutral','success','error']},children:{control:'text'},id:{table:{disable:true}}},
  parameters:{docs:{description:{component:'상태는 색과 문구로 함께 전달합니다. tone을 명시하며 관련 메시지는 하나의 polite live region에 모읍니다. 저장 성공은 실제 저장 응답 뒤에만 표시합니다.'}}},
} satisfies Meta<typeof StatusMessage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Saving: Story = {};
export const Success: Story = {args:{tone:'success',children:'저장됨 · 이 브라우저에 유지'}};
export const Error: Story = {args:{tone:'error',children:'저장 실패 · 다시 변경해 주세요'}};
