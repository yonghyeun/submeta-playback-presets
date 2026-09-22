import type {Meta} from '@storybook/react-vite';
import {Scene, states, type DemoProps} from './playback-demo';
export default {
  id:'playback', title:'재생 설정',  tags:['autodocs'],
  render:args => <Scene {...args}/>,
  argTypes:{scenario:{control:'select',options:Object.keys(states),description:'저장·플레이어 응답을 고정한 재현 가능한 상태'},theme:{control:'radio',options:['dark','light']},expanded:{control:'boolean'},mode:{control:'radio',options:['open','closed']}},
  parameters:{controls:{include:['scenario','theme','expanded','mode']},docs:{description:{component:'제품과 동일한 PlaybackSettings입니다. 아래 Controls는 데모 어댑터의 상태를 바꿉니다. 실제 컴포넌트는 prefs·상태·actions를 받고 저장이나 플레이어 API를 직접 호출하지 않습니다.'}}},
} satisfies Meta<DemoProps>;
export const Ready = {name:'01 · 기본 설정', args:{scenario:'ready'}};
export const Loading = {name:'02 · 불러오는 중', args:{scenario:'loading'}};
export const Saving = {name:'03 · 저장 중', args:{scenario:'saving'}};
export const Error = {name:'04 · 저장 실패', args:{scenario:'error'}};
export const Disabled = {name:'05 · 설정 유지 꺼짐', args:{scenario:'disabled'}};
export const Unavailable = {name:'06 · 언어 미제공', args:{scenario:'unavailable'}};
export const Disconnected = {name:'07 · 연결 실패', args:{scenario:'disconnected'}};
export const Suspended = {name:'08 · 현재 영상 해제', args:{scenario:'suspended'}};
export const Defaults = {name:'09 · 처음 사용하는 상태', args:{scenario:'defaults'}};
export const Light = {name:'10 · 밝은 테마 비교', args:{scenario:'ready',theme:'light',expanded:true}};
export const ClosedRoot = {name:'11 · 닫힌 Shadow DOM', args:{scenario:'ready',mode:'closed',expanded:true}};
