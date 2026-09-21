(() => {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  globalThis.GifNativeFolder = {
    open() {
      const port = api.runtime.connectNative('io.submeta_player.gif_folder');
      const pending = new Map();
      let sequence = 0, closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        for (const item of pending.values()) { clearTimeout(item.timer); item.reject(new Error('native-host-disconnected')); }
        pending.clear(); port.disconnect();
      };
      port.onDisconnect.addListener(close);
      port.onMessage.addListener(message => {
        const item = pending.get(message?.requestId);
        if (!item) return;
        pending.delete(message.requestId); clearTimeout(item.timer); item.resolve(message);
      });
      return {
        request(type, payload = {}, timeoutMs = 15000) {
          if (closed) return Promise.reject(new Error('native-host-disconnected'));
          const requestId = ++sequence;
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('native-result-unknown')); close(); }, timeoutMs);
            pending.set(requestId, {resolve, reject, timer});
            try { port.postMessage({version: 1, type, requestId, ...payload}); }
            catch { close(); }
          });
        }, close
      };
    },
    async call(type) {
      let connection;
      try {
        connection = this.open();
        return await connection.request(type, {}, type === 'folder.choose' ? 300000 : 15000);
      } catch { return {error: 'native-host-unavailable'}; }
      finally { connection?.close(); }
    }
  };
})();
