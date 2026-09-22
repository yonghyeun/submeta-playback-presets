import type {Meta,StoryObj} from '@storybook/react-vite';
import {useArgs} from 'storybook/preview-api';
import {fn} from 'storybook/test';
import {TimeField} from '../ui/gif-components';
import {timeCSS} from '../ui/gif-styles';
import {Frame,specimenCSS} from './Frame';
const meta={
  id:'timefield',title:'기본 요소/TimeField',component:TimeField,tags:['autodocs'],
  decorators:[Story=><Frame css={specimenCSS+timeCSS}><div className="gif-time-content"><div className="gif-time-fields"><Story/></div><p id="time-example-help" className="gif-time-bounds">분:초로 입력합니다. 예: 4:35</p></div></Frame>],
  args:{id:'time-example',label:'시작',value:'0:30',disabled:false,invalid:false,describedBy:'time-example-help',onChange:fn()},
  argTypes:{id:{table:{disable:true}},describedBy:{table:{disable:true}},value:{control:'text'},label:{control:'text'},disabled:{control:'boolean'},invalid:{control:'boolean'}},
  render:function Render(args){const [,updateArgs]=useArgs();return <TimeField {...args} onChange={(value,commit)=>{args.onChange(value,commit);updateArgs({value});}}/>;},
  parameters:{docs:{description:{component:'시간 텍스트 입력입니다. 입력 중인 문자열을 유지하고 blur 시 commit을 전달합니다. 실제 범위 검증은 제품의 시간·영상 길이 규칙에서 수행합니다. invalid는 오류 표시이며 describedBy로 안내와 오류를 연결합니다. GIF 제품에서는 플레이어 단축키가 입력을 알아볼 수 있도록 light DOM 슬롯에 배치합니다.'}}},
} satisfies Meta<typeof TimeField>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Default:Story={};
export const Invalid:Story={args:{value:'0:99',invalid:true}};
