import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {Button} from '../ui/components';
import {Frame, specimenCSS} from './Frame';
const meta = {
  id:'button', title:'기본 요소/Button',component:Button,tags:['autodocs'],
  decorators:[Story => <Frame css={specimenCSS}><Story/></Frame>],
  args:{children:'다시 적용',variant:'secondary',disabled:false,onClick:fn()},
  argTypes:{variant:{control:'radio',options:['primary','secondary']},children:{control:'text'},disabled:{control:'boolean'},id:{table:{disable:true}}},
  parameters:{docs:{description:{component:'작업을 실행하는 네이티브 버튼. primary는 화면의 주된 행동에만 사용합니다. Enter·Space로 실행하고 disabled는 실행을 막습니다.'}}},
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Secondary: Story = {};
export const Primary: Story = {args:{variant:'primary',children:'저장'}};
export const Disabled: Story = {args:{disabled:true}};
