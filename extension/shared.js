globalThis.SubmetaPreset = (() => {
  'use strict';
  const key = 'playbackPreset';
  const languages = {ko:'한국어',en:'English',pt:'português',de:'Deutsch',fr:'français',ja:'日本語',es:'español'};
  const defaults = {schemaVersion:1, enabled:false, manageSpeed:true, rate:1, captions:'leave', language:'ko', revision:''};
  function normalize(value) {
    const p = value && typeof value === 'object' ? value : {};
    return {schemaVersion:1, enabled:p.enabled === true, manageSpeed:p.manageSpeed !== false,
      rate:typeof p.rate === 'number' && p.rate >= 0.5 && p.rate <= 2 && Number.isInteger(p.rate * 4) ? p.rate : 1,
      captions:['on','off','leave'].includes(p.captions) ? p.captions : 'leave',
      language:typeof p.language === 'string' && /^[\p{L}\p{N} _().-]{1,64}$/u.test(p.language) ? p.language : 'ko',
      revision:typeof p.revision === 'string' ? p.revision.slice(0,80) : ''};
  }
  function chooseLabel(preferred, labels) {
    const mapped = languages[preferred] || languages[preferred.split('-')[0]] || preferred;
    return labels.find(label => label === mapped) ?? null;
  }
  function budget() {
    let writes = [];
    return {take(now) { writes = writes.filter(t => now - t < 10000); if (writes.length >= 3) return false; writes.push(now); return true; }};
  }
  return {key, languages, defaults, normalize, chooseLabel, budget};
})();
