import type {Meta, StoryObj} from '@storybook/react-vite';
import {useArgs} from 'storybook/preview-api';
import {fn} from 'storybook/test';
import {SelectField} from '../ui/components';
import {Frame, specimenCSS} from './Frame';
const meta = {
  id:'selectfield', title:'기본 요소/SelectField',component:SelectField,tags:['autodocs'],
  decorators:[Story => <Frame css={specimenCSS}><Story/></Frame>],
  args:{label:'배속',value:'1.25',options:[{value:'leave',label:'기본값'},{value:'1.25',label:'1.25×'},{value:'1.5',label:'1.5×'},{value:'2',label:'2×'}],disabled:false,onChange:fn()},
  render:function Render(args) {const [,updateArgs] = useArgs();return <SelectField {...args} onChange={value => {args.onChange(value);updateArgs({value});}}/>;},
  argTypes:{value:{control:'select',options:['leave','1.25','1.5','2']},label:{control:'text'},disabled:{control:'boolean'},options:{control:'object'},id:{table:{disable:true}},className:{table:{disable:true}}},
  parameters:{docs:{description:{component:'보이는 label과 네이티브 select를 함께 제공합니다. value는 options의 값 중 하나여야 합니다. 저장·적용은 호출자가 담당합니다.'}}},
} satisfies Meta<typeof SelectField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = {args:{disabled:true}};
