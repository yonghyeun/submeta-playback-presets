// Minimal bridge for the APIs used by this extension. No remote dependencies.
// Register listeners synchronously so service-worker wakeups can deliver messages.
(() => {
  globalThis.browser = {
    storage: chrome.storage,
    downloads: chrome.downloads,
    tabs: chrome.tabs,
    runtime: {
      id: chrome.runtime.id,
      getURL: path => chrome.runtime.getURL(path),
      getPlatformInfo: () => chrome.runtime.getPlatformInfo(),
      connectNative: name => chrome.runtime.connectNative(name),
      sendMessage: (message) => chrome.runtime.sendMessage(message),
      onMessage: {
        addListener(listener) {
          chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const result = listener(message, sender);
            if (result && typeof result.then === 'function') {
              result.then(value => sendResponse(value), () => sendResponse({unavailable: true}));
              return true;
            }
            if (result !== undefined) sendResponse(result);
            return false;
          });
        }
      }
    }
  };
})();
