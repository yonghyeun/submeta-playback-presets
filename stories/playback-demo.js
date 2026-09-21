import '../extension/ui/tokens.js';
import '../extension/ui/primitives.js';
import '../extension/ui/playback-settings.js';

export const states = {
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

export function demo({scenario = 'ready', theme = 'dark', expanded, mode = 'open'} = {}) {
  const preset = states[scenario];
  const host = document.createElement('section'); host.className = 'demo-host'; host.dataset.theme = theme;
  const root = host.attachShadow({mode});
  let state = {
    prefs: {enabled:true, manageSpeed:true, rate:1.25, captions:'on', language:'ko'},
    languages:[{value:'ko',label:'한국어'},{value:'en',label:'English'}],
    loading:false, connected:true, suspended:false, expanded:false,
    speedStatus:'배속: 1.25× 적용됨', captionStatus:'자막: 한국어 적용됨', ...preset,
  };
  for (const key of ['enabled','manageSpeed','captions']) if (key in preset) state.prefs[key] = preset[key];
  if (expanded !== undefined) state.expanded = expanded;
  const view = SubmetaUI.mountPlaybackSettings(root, {state, actions:{
    change(_id, values) {
      state = {...state, loading:false, suspended:false, prefs:{...state.prefs, ...values, rate:values.rate === 'leave' ? state.prefs.rate : Number(values.rate)}, saved:'저장됨 · 이 브라우저에 유지'};
      state.speedStatus = `배속: ${state.prefs.manageSpeed ? state.prefs.rate + '× 적용됨' : '기본값'}`;
      state.captionStatus = `자막: ${values.captions === 'on' ? (values.language === 'ko' ? '한국어' : 'English') + ' 적용됨' : '꺼짐'}`;
      view.update(state);
    },
    suspend() {state.suspended = !state.suspended;state.speedStatus = state.suspended ? '배속: 현재 영상 해제' : '배속: 1.25× 적용됨';view.update(state);},
    retry() {state = {...state, connected:true, saved:'저장됨 · 이 브라우저에 유지', captionStatus:'자막: 한국어 적용됨'};view.update(state);},
  }});
  // After the initial state, native details owns its open/closed state.
  delete state.expanded;
  return host;
}

export function scene(options = {}) {
  const page = document.createElement('main'); page.className = 'scenario sm-theme'; page.dataset.theme = options.theme || 'dark';
  const title = document.createElement('h1'); title.textContent = states[options.scenario || 'ready'].name;
  const intro = document.createElement('p'); intro.className = 'scene-note'; intro.textContent = '제품과 같은 UI · 이 화면의 저장과 플레이어 응답은 데모입니다.';
  page.append(title, intro, demo(options)); return page;
}
