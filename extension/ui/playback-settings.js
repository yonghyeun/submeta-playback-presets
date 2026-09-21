(() => {
  'use strict';
  const UI = globalThis.SubmetaUI;
  UI.mountPlaybackSettings = (root, {state = {}, actions = {}} = {}) => {
    // Only static extension-owned markup. User and service text uses textContent.
    const style = document.createElement('style');
    style.textContent = `${UI.tokenCSS}${UI.controlCSS}
      :host{display:block;clear:both;width:100%;margin:0;font:inherit;color-scheme:dark}
      :host([data-theme="light"]){color-scheme:light}
      .panel{padding:var(--sm-space-4) var(--preset-gutter,var(--sm-space-4));background:var(--sm-surface-canvas);color:var(--sm-text-primary);border-bottom:var(--sm-size-border) solid var(--sm-border-default);font-family:var(--sm-font-family);font-size:var(--sm-font-body);line-height:var(--sm-line-body)}
      .heading{display:flex;align-items:center;justify-content:space-between;gap:var(--sm-space-3);margin-bottom:var(--sm-space-3)}
      .heading h2{font:inherit;font-weight:var(--sm-weight-medium);margin:0}
      .eyebrow{font-size:var(--sm-font-caption);color:var(--sm-text-muted)}
      .fields{display:flex;flex-wrap:wrap;align-items:center;gap:var(--sm-space-3) var(--sm-space-6)}
      .toggle{margin-right:auto;cursor:pointer;min-height:var(--sm-size-control)}
      #language{max-width:var(--sm-size-label-max)}
      details{margin-top:var(--sm-space-3);font-size:var(--sm-font-caption);color:var(--sm-text-muted)}
      summary{cursor:pointer;width:fit-content;min-height:var(--sm-space-6)}
      summary:hover{color:var(--sm-text-primary)}
      .status{display:grid;gap:var(--sm-space-1);margin:var(--sm-space-3) 0}
      .actions{display:flex;flex-wrap:wrap;gap:var(--sm-space-2)}
      .hint{margin:var(--sm-space-3) 0 0;max-width:70ch}
      @media(max-width:${UI.tokens['size.mobile']}){
        .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sm-space-3)}
        .toggle{grid-column:1/-1}.sm-field:not(.toggle){align-items:stretch;flex-direction:column;gap:var(--sm-space-1)}
        .language-field{grid-column:1/-1}#language{max-width:100%;width:100%}.eyebrow{display:none}
      }
    `;
    root.innerHTML = `<section class="panel" role="region" aria-label="재생 기본 설정">
      <div class="heading"><h2>재생 설정</h2><span class="eyebrow">영상마다, 내 방식대로</span></div>
      <div class="fields">
        <label class="sm-field toggle" title="저장한 설정을 다음 영상에도 자동으로 적용합니다"><input class="sm-checkbox" id="enabled" type="checkbox">재생 설정 유지</label>
        <label class="sm-field">배속<select class="sm-select" id="rate"><option value="leave">기본값</option><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select></label>
        <label class="sm-field">CC<select class="sm-select" id="captions"><option value="leave">기본값</option><option value="on">켜기</option><option value="off">끄기</option></select></label>
        <label class="sm-field language-field">언어<select class="sm-select" id="language"><option value="ko">한국어</option></select></label>
      </div>
      <details><summary>저장 및 적용 상태</summary>
        <div class="status" role="status" aria-live="polite"><span class="sm-status" id="saved">저장값 불러오는 중</span><span class="sm-status" id="speedStatus">배속: 대기</span><span class="sm-status" id="captionStatus">자막: 대기</span></div>
        <div class="actions"><button class="sm-button" id="suspend" type="button">현재 영상만 해제</button><button class="sm-button" id="retry" type="button">다시 적용</button></div>
        <p class="hint">변경한 설정은 현재 영상에 바로 적용되고 이 브라우저에 저장됩니다. 설정 유지 중에는 플레이어에서 바꾼 값도 저장한 설정으로 돌아갑니다.</p>
      </details>
    </section>`;
    root.prepend(style);
    const get = id => root.querySelector('#' + id);
    const setText = (id, value, tone) => {
      const element = get(id);
      if (element.textContent !== value) element.textContent = value;
      element.dataset.tone = tone ?? (/실패|끊김/.test(value) ? 'error' : /저장됨/.test(value) ? 'success' : 'neutral');
    };
    function update(next) {
      if (next.prefs) {
        const p = next.prefs;
        get('enabled').checked = p.enabled;
        get('rate').value = p.manageSpeed ? String(p.rate) : 'leave';
        get('captions').value = p.captions;
        if (next.languages) get('language').replaceChildren(...next.languages.map(item => {
          const option = document.createElement('option'); option.value = item.value; option.textContent = item.label; return option;
        }));
        get('language').value = p.language;
        get('language').disabled = next.loading === true || p.captions !== 'on';
        get('suspend').disabled = !p.enabled || !next.connected || next.loading === true;
      }
      if ('loading' in next) {
        for (const id of ['enabled', 'rate', 'captions']) get(id).disabled = next.loading;
        get('retry').disabled = next.loading;
        root.querySelector('.panel').setAttribute('aria-busy', String(next.loading));
      }
      if ('suspended' in next) setText('suspend', next.suspended ? '현재 영상 자동 적용 재개' : '현재 영상만 해제');
      if ('expanded' in next) root.querySelector('details').open = next.expanded;
      for (const id of ['saved', 'speedStatus', 'captionStatus']) if (id in next) setText(id, next[id]);
    }
    const cleanups = [];
    const listen = (id, type, listener) => { get(id).addEventListener(type, listener); cleanups.push(() => get(id).removeEventListener(type, listener)); };
    for (const id of ['enabled', 'rate', 'captions', 'language']) listen(id, 'change', () => actions.change?.(id, {
      enabled:get('enabled').checked, manageSpeed:get('rate').value !== 'leave', rate:get('rate').value,
      captions:get('captions').value, language:get('language').value
    }));
    listen('suspend', 'click', () => actions.suspend?.());
    listen('retry', 'click', () => actions.retry?.());
    update(state);
    return {get, update, setText, destroy() { cleanups.forEach(fn => fn()); root.replaceChildren(); }};
  };
})();
