import type {Meta, StoryObj} from '@storybook/react-vite';
import {useArgs} from 'storybook/preview-api';
import {fn} from 'storybook/test';
import {PlaybackSettings} from '../ui/components';
import {initialState} from '../ui/types';
import {Frame} from './Frame';
const meta = {
  id:'playbacksettings', title:'조합 요소/PlaybackSettings', component:PlaybackSettings, tags:['autodocs'],
  decorators:[Story => <Frame><Story/></Frame>],
  args:{...initialState,prefs:{enabled:true,manageSpeed:true,rate:1.25,captions:'on',language:'ko'},
    languages:[{value:'ko',label:'한국어'},{value:'en',label:'English'}],connected:true,expanded:true,
    saved:'저장됨 · 이 브라우저에 유지',speedStatus:'배속: 1.25× 적용됨',captionStatus:'자막: 한국어 적용됨',tones:{saved:'success'},
    actions:{change:fn(),suspend:fn(),retry:fn()}},
  render:function Render(args) {
    const [,updateArgs] = useArgs();
    return <PlaybackSettings {...args} actions={{
      change(id,values) {args.actions?.change?.(id,values);updateArgs({prefs:{...args.prefs,...values,rate:values.rate === 'leave' ? args.prefs.rate : Number(values.rate)}});},
      suspend() {args.actions?.suspend?.();updateArgs({suspended:!args.suspended});},
      retry() {args.actions?.retry?.();},
    }}/>;
  },
  argTypes:{prefs:{control:'object',description:'선택값의 단일 원본. 변경 이벤트를 받으면 호출자가 새 값을 전달합니다.'},
    languages:{control:'object',description:'현재 영상에서 선택할 언어 목록'},
    loading:{control:'boolean'},connected:{control:'boolean'},suspended:{control:'boolean'},expanded:{control:'boolean'},
    saved:{control:'text'},speedStatus:{control:'text'},captionStatus:{control:'text'},tones:{control:'object'},actions:{control:false,description:'change(id, values), suspend(), retry(). 브라우저 저장과 플레이어 통신은 호출자에서 처리합니다.'}},
  parameters:{docs:{description:{component:'제품에서 사용하는 조합 컴포넌트의 실제 props 계약입니다. 이 예시는 선택값과 Actions 이벤트만 연결하며 저장·재생 성공을 흉내 내지 않습니다. 전체 상태 흐름은 재생 설정 그룹에서 확인하세요.'}}},
} satisfies Meta<typeof PlaybackSettings>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Loading: Story = {args:{loading:true,saved:'저장값 불러오는 중',tones:{saved:'neutral'}}};
export const Error: Story = {args:{saved:'저장 실패 · 다시 변경해 주세요',tones:{saved:'error'}}};
