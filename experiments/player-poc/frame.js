(() => {
  'use strict';
  if (window.parent === window) return;
  const channel = 'submeta-player-poc-v1';
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const visible = el => el.getClientRects().length > 0;
  const captionButton = () => [...document.querySelectorAll('[role="combobox"]')]
    .find(el => el.textContent.includes('Captions:'));
  function snapshot() {
    const v = document.querySelector('video');
    return v ? {
      rate: v.playbackRate, paused: v.paused, readyState: v.readyState,
      captions: captionButton()?.textContent.trim() ?? 'unavailable',
      tracks: [...v.textTracks].map(t => ({kind: t.kind, language: t.language,
        label: t.label, mode: t.mode, activeCueCount: t.activeCues?.length ?? 0}))
    } : {error: 'video-not-ready'};
  }
  async function openCaptions() {
    const button = captionButton();
    if (!button) throw new Error('caption-control-unavailable');
    if (button.getAttribute('aria-expanded') !== 'true') {
      button.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerType: 'mouse', button: 0, ctrlKey: false}));
      button.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerType: 'mouse', button: 0}));
      await wait(150);
      if (button.getAttribute('aria-expanded') !== 'true') button.click();
    }
    for (let i = 0; i < 20; i++) {
      const options = [...document.querySelectorAll('[role="option"]')].filter(visible);
      if (options.length) return options;
      await wait(100);
    }
    throw new Error('caption-options-timeout');
  }
  async function captions(label) {
    const options = await openCaptions();
    const labels = options.map(el => el.textContent.trim());
    const option = options.find(el => el.textContent.trim() === label);
    if (!option) throw new Error('requested-caption-unavailable');
    option.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, pointerType: 'mouse', button: 0}));
    option.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerType: 'mouse', button: 0}));
    option.click();
    await wait(500);
    return labels;
  }
  let busy = false;
  window.addEventListener('message', async event => {
    if (event.source !== window.parent || event.origin !== 'https://submeta.io') return;
    const m = event.data;
    if (!m || m.channel !== channel || m.type !== 'request' || !Number.isInteger(m.id)) return;
    if (!['read', 'rate', 'captions'].includes(m.action) || busy) return;
    busy = true;
    const before = snapshot();
    try {
      let labels;
      if (m.action === 'rate') {
        if (![1, 1.25].includes(m.value)) throw new Error('unsupported-experiment-rate');
        const v = document.querySelector('video');
        if (!v) throw new Error('video-not-ready');
        v.playbackRate = m.value;
        await wait(500);
      } else if (m.action === 'captions') {
        if (!['한국어', 'Off'].includes(m.value)) throw new Error('unsupported-experiment-caption');
        labels = await captions(m.value);
      }
      window.parent.postMessage({channel, type: 'result', id: m.id, before, after: snapshot(), labels}, event.origin);
    } catch (error) {
      const known = ['caption-control-unavailable','caption-options-timeout','requested-caption-unavailable','unsupported-experiment-rate','video-not-ready','unsupported-experiment-caption'];
      window.parent.postMessage({channel, type: 'result', id: m.id,
        error: known.includes(error.message) ? error.message : 'experiment-error', before, after: snapshot()}, event.origin);
    } finally { busy = false; }
  });
})();
