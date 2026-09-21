import './playback-demo.js';
export default {id:'primitives', title:'기본 요소'};
export const Controls = {name:'버튼 · 입력 · 상태', render() {
  const host = document.createElement('section'); host.className = 'primitive-scene';
  host.attachShadow({mode:'open'}).innerHTML = `<style>${SubmetaUI.tokenCSS}${SubmetaUI.controlCSS}:host{display:block;background:var(--sm-surface-canvas);color:var(--sm-text-primary);padding:var(--sm-space-8);font:var(--sm-font-body)/var(--sm-line-body) 'Noto Sans KR',sans-serif}.row{display:flex;flex-wrap:wrap;gap:var(--sm-space-4);margin:var(--sm-space-6) 0}h1{font-size:var(--sm-font-heading)}h2{font-size:var(--sm-font-title)}</style><main><h1>기본 요소</h1><h2>행동의 중요도</h2><div class="row"><button class="sm-button" data-variant="primary">주요 행동</button><button class="sm-button">보조 행동</button><button class="sm-button" disabled>사용 불가</button></div><h2>입력과 상태</h2><div class="row"><label class="sm-field"><input class="sm-checkbox" type="checkbox" checked>설정 유지</label><label class="sm-field">배속<select class="sm-select"><option>1.25×</option><option>1.5×</option></select></label></div><p class="sm-status" data-tone="success">저장됨 · 이 브라우저에 유지</p><p class="sm-status" data-tone="error">저장 실패 · 다시 변경해 주세요</p></main>`;
  return host;
}};
