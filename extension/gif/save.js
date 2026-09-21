(() => {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  globalThis.SubmetaGif.pasteInstruction = async () => {
    try {
      const {os} = await api.runtime.getPlatformInfo();
      if (os === 'mac') return '⌘V로 붙여넣으세요.';
      if (['win', 'linux', 'openbsd', 'cros'].includes(os)) return 'Ctrl+V로 붙여넣으세요.';
    } catch { /* Keep copy success independent of platform detection. */ }
    return '사용할 앱에서 붙여넣기를 선택하세요.';
  };
  globalThis.SubmetaGif.folder = action => api.runtime.sendMessage({type: action === 'choose' ? 'gif:folder-choose' : 'gif:folder-status'});
  globalThis.SubmetaGif.save = async ({blob, filename, hash}, {destination = 'remembered-folder', onFolder = () => {}} = {}) => {
    const begin = await api.runtime.sendMessage({type: 'gif:save-begin', bytes: blob.size, filename, sha256: hash, destination});
    if (!begin?.ticket) return begin;
    if (begin.folder) onFolder(begin.folder);
    let submitted = false;
    try {
      let seq = 0;
      for (let offset = 0; offset < blob.size; offset += begin.chunkBytes) {
        const bytes = new Uint8Array(await blob.slice(offset, offset + begin.chunkBytes).arrayBuffer());
        let binary = '';
        for (let index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index]);
        const response = await api.runtime.sendMessage({type: 'gif:save-chunk', ticket: begin.ticket, seq: seq++, data: btoa(binary)});
        if (response?.received !== Math.min(blob.size, offset + begin.chunkBytes)) return response?.error ? response : {error: 'save-transfer-failed'};
      }
      submitted = true;
      return await api.runtime.sendMessage({type: 'gif:save-finish', ticket: begin.ticket});
    } finally {
      if (!submitted) await api.runtime.sendMessage({type: 'gif:save-abort', ticket: begin.ticket}).catch(() => {});
    }
  };
})();
