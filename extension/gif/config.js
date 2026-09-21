(() => {
  'use strict';
  const MAX_BYTES = 20 * 1024 * 1024;
  function parseTimestamp(value) {
    const match = /^(-?)(?:(\d+):([0-5]\d):([0-5]\d)|(\d+):([0-5]\d))(?:\.(\d))?$/.exec(value.trim());
    if (!match) throw new Error('timestamp-invalid');
    const seconds = match[2] !== undefined ? Number(match[2]) * 3600 + Number(match[3]) * 60 + Number(match[4]) :
      Number(match[5]) * 60 + Number(match[6]);
    const ticks = seconds * 10 + Number(match[7] || 0);
    if (!Number.isSafeInteger(ticks)) throw new Error('timestamp-invalid');
    return (match[1] ? -ticks : ticks) / 10;
  }
  function formatTimestamp(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0 || !Number.isSafeInteger(Math.round(seconds * 10))) throw new Error('timestamp-invalid');
    const ticks = Math.round(seconds * 10), whole = Math.floor(ticks / 10);
    const minutes = Math.floor(whole / 60), tail = String(whole % 60).padStart(2, '0');
    const time = minutes >= 60 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${tail}` : `${minutes}:${tail}`;
    return time + (ticks % 10 ? `.${ticks % 10}` : '');
  }
  function timestampLimit(duration) {
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('video-not-ready');
    // Round down so a fractional final frame can never select past the media end.
    return Math.floor(duration * 10) / 10;
  }
  function boundTimestamp(value, duration) {
    return formatTimestamp(Math.max(0, Math.min(timestampLimit(duration), parseTimestamp(value))));
  }
  function validateRange(start, end, duration) {
    const ticks = Math.round(end * 10) - Math.round(start * 10);
    if (![start, end, duration].every(Number.isFinite) || start < 0 || end < 0 || start > duration || end > duration ||
        ticks < 10 || ticks > 150 ||
        [start, end].some(time => Math.abs(time * 10 - Math.round(time * 10)) > 0.00001)) {
      throw new Error('range-invalid');
    }
    return ticks;
  }
  function selection(start, end, video) {
    const ticks = validateRange(start, end, video.duration);
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) throw new Error('video-not-ready');
    const ratio = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    return {start, end, fps: 10, width: Math.max(1, Math.round(video.videoWidth * ratio)),
      height: Math.max(1, Math.round(video.videoHeight * ratio)), frameCount: ticks, delayMs: 100};
  }
  function validEncoding(config) {
    return config && ['width', 'height', 'frameCount'].every(key => Number.isInteger(config[key])) &&
      config.width > 0 && config.height > 0 && config.width <= 480 && config.height <= 480 &&
      config.frameCount >= 10 && config.frameCount <= 150 && config.delayMs === 100;
  }
  globalThis.SubmetaGif = {MAX_BYTES, parseTimestamp, formatTimestamp, timestampLimit, boundTimestamp, validateRange, selection, validEncoding};
})();
