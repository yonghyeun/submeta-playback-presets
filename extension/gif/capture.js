(() => {
  'use strict';
  const snapshot = video => ({time: video.currentTime, paused: video.paused, rate: video.playbackRate, muted: video.muted});
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  globalThis.SubmetaGif.capture = async ({video, config, controller, host, onFrame, onProgress}) => {
    const before = snapshot(video), started = performance.now(), source = video.currentSrc;
    const signal = controller.signal;
    let mediaEpoch = 0, userControl = false, expectedTime = null, latestRate = before.rate;
    let lastFrame = -1, failure, restoring = false, immediateAfter, restoration = 'not-attempted';
    const samples = [];
    const sameMedia = () => mediaEpoch === 0 && video.isConnected && document.querySelector('video') === video && video.currentSrc === source;
    const check = () => {
      if (signal.aborted) throw new Error(String(signal.reason));
      if (!sameMedia()) throw new Error('media-changed');
      if (document.visibilityState !== 'visible') throw new Error('tab-hidden');
    };
    const user = event => {
      if (!event.isTrusted || event.composedPath().includes(host)) return;
      userControl = true; controller.abort('user-control');
    };
    const changed = () => { mediaEpoch++; controller.abort('media-changed'); };
    const rateChanged = () => { if (video.playbackRate > 0) latestRate = video.playbackRate; };
    const seeking = () => {
      if (expectedTime !== null && Math.abs(video.currentTime - expectedTime) > 0.1) {
        userControl = true; controller.abort('user-seek');
      }
    };
    const visibility = () => { if (document.visibilityState !== 'visible' && !restoring) controller.abort('tab-hidden'); };
    const observer = new MutationObserver(() => { if (!sameMedia()) changed(); });
    const canvas = document.createElement('canvas');
    canvas.width = config.width; canvas.height = config.height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (!context) throw new Error('canvas-unavailable');

    function atTime(target, readPixels) {
      expectedTime = target;
      return new Promise((resolve, reject) => {
        let callback, animation, timer, done = false;
        const finish = (error, metadata) => {
          if (done) return;
          done = true; clearTimeout(timer);
          if (callback !== undefined) video.cancelVideoFrameCallback(callback);
          if (animation !== undefined) cancelAnimationFrame(animation);
          video.removeEventListener('seeked', seeked);
          signal.removeEventListener('abort', aborted);
          if (error) { reject(error); return; }
          try {
            if (readPixels) {
              check();
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              resolve({pixels: context.getImageData(0, 0, canvas.width, canvas.height).data, mediaTime: metadata.mediaTime});
            } else { resolve(); }
          } catch (error) { reject(error); }
        };
        const aborted = () => finish(new Error(String(signal.reason)));
        const seeked = () => { if (!readPixels) finish(); };
        const frame = (_now, metadata) => {
          if (!sameMedia()) { finish(new Error('media-changed')); return; }
          if (!video.seeking && Math.abs(metadata.mediaTime - target) <= 0.075) finish(null, metadata);
          else callback = video.requestVideoFrameCallback(frame);
        };
        timer = setTimeout(() => finish(new Error(readPixels ? 'frame-timeout' : 'restore-timeout')), 8000);
        if (readPixels) signal.addEventListener('abort', aborted, {once: true});
        if (Math.abs(video.currentTime - target) < 0.001 && !video.seeking && video.readyState >= 2) {
          if (readPixels) animation = requestAnimationFrame(() => finish(null, {mediaTime: video.currentTime}));
          else finish();
        } else {
          if (readPixels) callback = video.requestVideoFrameCallback(frame);
          else video.addEventListener('seeked', seeked, {once: true});
          video.currentTime = target;
        }
        if (readPixels && signal.aborted) aborted();
      });
    }

    document.addEventListener('pointerdown', user, true);
    document.addEventListener('keydown', user, true);
    document.addEventListener('visibilitychange', visibility);
    video.addEventListener('loadstart', changed);
    video.addEventListener('emptied', changed);
    video.addEventListener('ratechange', rateChanged);
    video.addEventListener('seeking', seeking);
    observer.observe(document.documentElement, {subtree: true, childList: true});
    try {
      check();
      if (video.mediaKeys || typeof video.requestVideoFrameCallback !== 'function') throw new Error('unsupported-media');
      video.pause();
      for (let index = 0; index < config.frameCount; index++) {
        check();
        const target = config.start + index / config.fps;
        const {pixels, mediaTime} = await atTime(target, true);
        check();
        if (mediaTime <= lastFrame) throw new Error('frame-order-invalid');
        lastFrame = mediaTime;
        let hash = 2166136261;
        for (let offset = 0; offset < pixels.length; offset++) hash = Math.imul(hash ^ pixels[offset], 16777619);
        samples.push({target, mediaTime, hash: (hash >>> 0).toString(16)});
        // One transferable frame, awaiting ACK, bounds the raw pixel queue.
        await onFrame(index, pixels.buffer);
        onProgress(index + 1, config.frameCount);
      }
    } catch (error) { failure = error.name === 'SecurityError' ? 'canvas-security-error' : error.message; }
    finally {
      restoring = true;
      onProgress(config.frameCount, config.frameCount, 'restoring');
      if (!userControl && sameMedia()) {
        try {
          await atTime(before.time, false);
          if (!userControl && sameMedia()) {
            if (video.playbackRate === 0 && latestRate > 0) video.playbackRate = latestRate;
            if (before.paused) video.pause();
            else await video.play();
            restoration = 'restored';
          } else restoration = 'skipped-user-or-media-change';
        } catch { restoration = 'restore-failed'; }
      } else restoration = 'skipped-user-or-media-change';
      immediateAfter = snapshot(video);
      const settleStart = performance.now();
      let stableSince = settleStart, rateRecoveries = 0, pauseRecoveries = 0;
      while (restoration === 'restored' && performance.now() - settleStart < 2500) {
        if (userControl || !sameMedia()) { restoration = 'skipped-user-or-media-change'; break; }
        if (video.playbackRate === 0 && latestRate > 0) {
          video.playbackRate = latestRate; rateRecoveries++; stableSince = performance.now();
        }
        if (before.paused && !video.paused) {
          video.pause(); pauseRecoveries++; stableSince = performance.now();
        }
        if (performance.now() - stableSince >= 750) break;
        await sleep(50);
      }
      const after = snapshot(video);
      if (restoration === 'restored' && (after.rate !== latestRate || after.paused !== before.paused ||
          performance.now() - stableSince < 750 || (before.paused && Math.abs(after.time - before.time) > 0.1))) restoration = 'state-mismatch';
      document.removeEventListener('pointerdown', user, true);
      document.removeEventListener('keydown', user, true);
      document.removeEventListener('visibilitychange', visibility);
      video.removeEventListener('loadstart', changed);
      video.removeEventListener('emptied', changed);
      video.removeEventListener('ratechange', rateChanged);
      video.removeEventListener('seeking', seeking);
      observer.disconnect();
      canvas.width = canvas.height = 0;
      const report = {before, immediateAfter, after, restoration, rateRecoveries, pauseRecoveries,
        captureAndRestoreMs: Math.round(performance.now() - started), frames: samples.length,
        uniqueFrames: new Set(samples.map(sample => sample.hash)).size,
        maxTimeError: samples.length ? Math.max(...samples.map(sample => Math.abs(sample.mediaTime - sample.target))) : null,
        boundaries: [samples[0], samples[Math.floor(samples.length / 2)], samples.at(-1)]};
      // Return failed/cancelled capture details too, rather than hiding restoration failures.
      // Worker teardown can reject an in-flight frame before the capture loop
      // sees the abort. Preserve the initiating cancellation reason in that race.
      return {error: signal.aborted ? String(signal.reason) : failure || null, report};
    }
  };
})();
