import type {Meta, StoryObj} from '@storybook/react-vite';
import {useArgs} from 'storybook/preview-api';
import {fn} from 'storybook/test';
import {Checkbox} from '../ui/components';
import {Frame, specimenCSS} from './Frame';
const meta = {
  id:'checkbox', title:'기본 요소/Checkbox',component:Checkbox,tags:['autodocs'],
  decorators:[Story => <Frame css={specimenCSS}><Story/></Frame>],
  args:{label:'재생 설정 유지',checked:true,disabled:false,onChange:fn()},
  render:function Render(args) {const [,updateArgs] = useArgs();return <Checkbox {...args} onChange={checked => {args.onChange(checked);updateArgs({checked});}}/>;},
  argTypes:{label:{control:'text'},checked:{control:'boolean'},disabled:{control:'boolean'},id:{table:{disable:true}},className:{table:{disable:true}}},
  parameters:{docs:{description:{component:'독립적인 켜기·끄기 선택입니다. label은 항상 보이게 유지하고 checked와 onChange를 함께 연결합니다. Space로 전환합니다.'}}},
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Checked: Story = {};
export const Unchecked: Story = {args:{checked:false}};
export const Disabled: Story = {args:{disabled:true}};
