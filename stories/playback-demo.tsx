import {useState} from 'react';
import {PlaybackSettings} from '../ui/components';
import {initialState, type PlaybackState, type Preferences, type Theme} from '../ui/types';
import {Frame} from './Frame';

export const states: Record<string, {name: string} & Partial<PlaybackState> & Partial<Preferences>> = {
  ready: {name:'기본 설정', saved:'저장됨 · 이 브라우저에 유지'},
  loading: {name:'불러오는 중', loading:true, expanded:true, saved:'저장값 불러오는 중', speedStatus:'배속: 대기', captionStatus:'자막: 대기'},
  saving: {name:'저장 중', expanded:true, saved:'저장 중…'},
  error: {name:'저장 실패', expanded:true, saved:'저장 실패 · 다시 변경해 주세요'},
  disabled: {name:'설정 유지 꺼짐', enabled:false, captions:'off', saved:'설정을 변경하면 자동 저장', speedStatus:'배속: 자동 적용 꺼짐'},
  unavailable: {name:'언어 미제공', expanded:true, languages:[{value:'ko',label:'한국어 — 이 영상 미제공'},{value:'en',label:'English'}], captionStatus:'자막: 선택 언어 미제공'},
  disconnected: {name:'플레이어 연결 실패', expanded:true, connected:false, captionStatus:'플레이어 연결 끊김 — 페이지를 새로고침해 주세요'},
  suspended: {name:'현재 영상 해제', expanded:true, suspended:true, speedStatus:'배속: 현재 영상 해제'},
  defaults: {name:'처음 사용하는 상태', enabled:false, manageSpeed:false, captions:'leave', saved:'설정을 변경하면 자동 저장'},
};

export interface DemoProps {scenario?: string; theme?: Theme; expanded?: boolean; mode?: ShadowRootMode}
function demoState(scenario: string, expanded?: boolean): PlaybackState {
  const preset = states[scenario] || states.ready;
  const prefs: Preferences = {enabled:true, manageSpeed:true, rate:1.25, captions:'on', language:'ko'};
  for (const key of ['enabled','manageSpeed','captions'] as const) if (key in preset) Object.assign(prefs,{[key]:preset[key]});
  return {...initialState, prefs, languages:[{value:'ko',label:'한국어'},{value:'en',label:'English'}], connected:true,
    speedStatus:'배속: 1.25× 적용됨', captionStatus:'자막: 한국어 적용됨', ...preset,
    expanded:expanded ?? preset.expanded ?? false,
    tones:{saved:scenario === 'error' ? 'error' : scenario === 'ready' ? 'success' : 'neutral',captionStatus:scenario === 'disconnected' ? 'error' : 'neutral'},
  };
}
function applied(state: PlaybackState): PlaybackState {
  const language = state.languages.find(item => item.value === state.prefs.language);
  return {...state,
    speedStatus:state.suspended ? '배속: 현재 영상 해제' : `배속: ${state.prefs.manageSpeed ? state.prefs.rate + '× 적용됨' : '기본값'}`,
    captionStatus:!state.connected ? '플레이어 연결 끊김 — 페이지를 새로고침해 주세요' : state.prefs.captions === 'on'
      ? (language && !language.label.includes('미제공') ? `자막: ${language.label} 적용됨` : '자막: 선택 언어 미제공')
      : `자막: ${state.prefs.captions === 'off' ? '꺼짐' : '기본값'}`,
    tones:{...state.tones,captionStatus:state.connected ? 'neutral' : 'error'},
  };
}
function StatefulDemo({scenario = 'ready', theme = 'dark', expanded, mode = 'open'}: DemoProps) {
  const [state, setState] = useState(() => demoState(scenario,expanded));
  return <Frame theme={theme} mode={mode}><PlaybackSettings {...state} actions={{
    change(_id, values) {setState(previous => applied({...previous, loading:false, suspended:false,
      prefs:{...previous.prefs,...values,rate:values.rate === 'leave' ? previous.prefs.rate : Number(values.rate)},
      saved:'저장됨 · 이 브라우저에 유지',tones:{...previous.tones,saved:'success'}}));},
    suspend() {setState(previous => applied({...previous,suspended:!previous.suspended}));},
    retry() {setState(previous => applied({...previous,connected:true}));},
  }}/></Frame>;
}
export function Demo(props: DemoProps) {
  return <StatefulDemo key={`${props.scenario}/${props.theme}/${props.mode}/${props.expanded}`} {...props}/>;
}
export function Scene(options: DemoProps) {
  return <main className="scenario sm-theme" data-theme={options.theme || 'dark'}>
    <h1>{(states[options.scenario || 'ready'] || states.ready).name}</h1>
    <p className="scene-note">제품과 같은 UI · 이 화면의 저장과 플레이어 응답은 데모입니다.</p>
    <Demo {...options}/>
  </main>;
}
