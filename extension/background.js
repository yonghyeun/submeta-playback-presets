// Relay only extension messages. No URLs, cookies or media addresses are retained.
browser.runtime.onMessage.addListener((m, sender) => {
  if (!m || m.app !== 'submeta-preset' || !sender.tab) return;
  const tabId = sender.tab.id;
  let origin;
  try { origin = new URL(sender.url).origin; } catch { return; }
  if (sender.frameId === 0 && origin === 'https://submeta.io' && m.type === 'relay' && Number.isInteger(m.frameId) && m.frameId > 0) {
    return browser.tabs.sendMessage(tabId, {app:m.app, type:'configure', token:m.token, prefs:m.prefs, suspended:m.suspended, retry:m.retry}, {frameId:m.frameId}).catch(() => ({unavailable:true}));
  }
  if (sender.frameId > 0 && origin === 'https://iframe.cloudflarestream.com' && ['bound','status'].includes(m.type)) {
    return browser.tabs.sendMessage(tabId, {...m, frameId:sender.frameId}, {frameId:0}).catch(() => {});
  }
});
