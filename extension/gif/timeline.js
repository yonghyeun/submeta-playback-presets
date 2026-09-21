(() => {
  'use strict';
  const Gif = globalThis.SubmetaGif;
  // Trimming never moves the opposite endpoint; moving preserves duration.
  Gif.moveRange = (start, end, side, value, duration) => {
    const max = Math.floor(duration * 10), a = Math.round(start * 10), b = Math.min(max, Math.round(end * 10)), tick = Math.round(value * 10);
    if (![max, a, b, tick].every(Number.isFinite) || max < 10) throw new Error('range-invalid');
    if (side === 'start') return [Math.max(0, b - 150, Math.min(b - 10, tick)) / 10, b / 10];
    if (side === 'end') return [a / 10, Math.min(max, a + 150, Math.max(a + 10, tick)) / 10];
    const length = Math.max(10, Math.min(150, b - a, max));
    const left = Math.max(0, Math.min(max - length, tick));
    return [left / 10, (left + length) / 10];
  };
  Gif.thumbnailURL = (page, poster, time) => {
    const location = new URL(page);
    let url;
    try {
      const candidate = new URL(poster);
      if (candidate.protocol === 'https:' && /(^|\.)cloudflarestream\.com$|(^|\.)videodelivery\.net$/.test(candidate.hostname) && /\/thumbnails\/thumbnail\.(jpg|png)$/.test(candidate.pathname)) url = candidate;
    } catch { /* Older embeds expose the video identifier only in their URL. */ }
    if (!url) {
      const id = location.pathname.split('/').filter(Boolean)[0];
      if (location.origin !== 'https://iframe.cloudflarestream.com' || !id) throw new Error('thumbnail-unavailable');
      url = new URL(`/${id}/thumbnails/thumbnail.jpg`, 'https://videodelivery.net');
    }
    url.searchParams.set('time', `${Math.max(0, time).toFixed(1)}s`);
    url.searchParams.set('width', '240'); url.searchParams.set('height', '136'); url.searchParams.set('fit', 'clip');
    return url.href;
  };
  Gif.timeline = ({container, video, change}) => {
    const section = document.createElement('div');
    section.style.cssText = 'padding:12px 0;border-bottom:1px solid #ccd8d0;margin-bottom:8px';
    const heading = document.createElement('strong'); heading.textContent = '슬라이더로 GIF 구간 선택';
    const summary = document.createElement('p'); summary.style.margin = '6px 0';
    const image = document.createElement('img'); image.alt = '탐색 위치 썸네일'; image.hidden = true;
    image.style.cssText = 'display:block;width:240px;max-width:100%;height:135px;object-fit:contain;background:#eef2ef;margin:6px auto';
    const caption = document.createElement('p'); caption.style.cssText = 'text-align:center;margin:4px 0;min-height:20px';
    caption.textContent = '슬라이더를 움직이면 해당 장면을 보여줍니다.';
    const strip = document.createElement('div');
    strip.style.cssText = 'position:relative;height:62px;margin:14px 12px 8px;touch-action:none;user-select:none;border-radius:6px;background:#26332e';
    const frames = document.createElement('div'); frames.style.cssText = 'position:absolute;inset:0;display:flex;overflow:hidden;border-radius:6px;pointer-events:none';
    const shadeLeft = document.createElement('div'), shadeRight = document.createElement('div');
    for (const shade of [shadeLeft, shadeRight]) shade.style.cssText = 'position:absolute;top:0;bottom:0;background:#0009;pointer-events:none';
    shadeLeft.style.left = '0'; shadeRight.style.right = '0';
    const selected = document.createElement('div');
    selected.tabIndex = 0; selected.setAttribute('role', 'slider'); selected.setAttribute('aria-label', '선택 구간 이동');
    selected.style.cssText = 'position:absolute;top:0;bottom:0;border-top:4px solid #f5c842;border-bottom:4px solid #f5c842;box-sizing:border-box;cursor:grab;touch-action:none;min-width:2px';
    const grips = ['start', 'end'].map((side, index) => {
      const grip = document.createElement('button'); grip.type = 'button'; grip.setAttribute('role', 'slider');
      grip.setAttribute('aria-label', index ? '종료 손잡이' : '시작 손잡이'); grip.textContent = '┃';
      grip.style.cssText = 'position:absolute;top:-4px;bottom:-4px;width:18px;padding:0;margin:0;border:0;background:#f5c842;color:#30280c;border-radius:4px;cursor:ew-resize;touch-action:none;font:700 16px system-ui;z-index:2';
      return grip;
    });
    strip.append(frames, shadeLeft, shadeRight, selected, ...grips);
    const scale = document.createElement('div'); scale.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;color:#58665d';
    const first = document.createElement('span'), last = document.createElement('span'); scale.append(first, last);
    const tools = document.createElement('div'); tools.style.cssText = 'display:flex;justify-content:space-between;gap:4px;margin:8px 0';
    const back = document.createElement('button'), zoom = document.createElement('button'), next = document.createElement('button');
    back.textContent = '← 앞 구간'; next.textContent = '뒤 구간 →'; zoom.textContent = '전체 영상';
    for (const el of [back, zoom, next]) { el.type = 'button'; el.style.cssText = 'font:12px system-ui;padding:5px 7px;margin:0'; tools.append(el); }
    const imageBox = document.createElement('div'); imageBox.style.height = '147px'; imageBox.append(image);
    heading.textContent = 'GIF 구간 자르기'; caption.textContent = '양 끝은 길이 조절 · 가운데는 구간 이동';
    section.append(heading, summary, imageBox, caption, strip, scale, tools);
    let selection = [0, 1], limit = 1, timer, deadline, serial = 0, pending, lastSource, lastRequestAt = 0;
    let disabled = true, full = false, viewStart = 0, viewEnd = 30, drag, frameKey, frameEpoch = 0;
    const clear = (keepImage = false) => { clearTimeout(timer); clearTimeout(deadline); serial++; if (pending) {pending.onload = pending.onerror = null; pending.removeAttribute('src'); pending = null;} if (!keepImage) { image.hidden = true; image.style.display = 'none'; image.removeAttribute('src'); } };
    function thumbnail(time, side) {
      clear();
      const token = serial, media = video(), source = media?.currentSrc;
      const target = Math.min(time, Math.max(0, limit - 0.1));
      caption.textContent = `${side === 'start' ? '시작' : side === 'end' ? '종료' : '구간'} ${Gif.formatTimestamp(time)} · 장면 불러오는 중…`;
      timer = setTimeout(() => {
        try {
          lastRequestAt = Date.now();
          const candidate = new Image(); pending = candidate;
          deadline = setTimeout(() => { if (token === serial) { clear(); caption.textContent = '장면 응답이 늦습니다. 슬라이더를 움직여 다시 시도해주세요.'; } }, 8000);
          candidate.onload = () => {
            if (token !== serial || media !== video() || source !== media?.currentSrc) return;
            clearTimeout(deadline); image.src = candidate.src; image.hidden = false; image.style.display = 'block';
            caption.textContent = `${side === 'start' ? '시작' : side === 'end' ? '종료' : '구간'} ${Gif.formatTimestamp(time)} · 장면 미리보기`;
            pending = null;
          };
          candidate.onerror = () => { clearTimeout(deadline); if (token === serial) { caption.textContent = `${Gif.formatTimestamp(time)} · 장면을 불러오지 못했습니다. 시간 선택은 가능합니다.`; pending = null; } };
          const poster = media?.poster || [...document.querySelectorAll('img')].map(img => img.src).find(src => src.includes('/thumbnails/'));
          candidate.src = Gif.thumbnailURL(window.location.href, poster, target);
        } catch { caption.textContent = '이 영상은 썸네일을 제공하지 않습니다. 시간 선택은 가능합니다.'; }
      }, Math.max(0, 140 - (Date.now() - lastRequestAt)));
    }
    function recenter() {
      const span = full ? limit : Math.min(limit, 30);
      viewStart = full ? 0 : Math.max(0, Math.min(limit - span, (selection[0] + selection[1] - span) / 2));
      viewEnd = viewStart + span;
    }
    const urlAt = time => Gif.thumbnailURL(window.location.href, video()?.poster, Math.min(time, Math.max(0, limit - 0.1)));
    function paint() {
      const span = Math.max(0.1, viewEnd - viewStart), left = Math.max(0, Math.min(100, (selection[0] - viewStart) / span * 100)), right = Math.max(0, Math.min(100, (selection[1] - viewStart) / span * 100));
      selected.style.left = `${left}%`; selected.style.width = `${Math.max(0, right - left)}%`;
      grips[0].style.left = `calc(${left}% - 12px)`; grips[1].style.left = `calc(${right}% - 6px)`;
      for (const grip of grips) grip.style.visibility = selection[1] < viewStart || selection[0] > viewEnd ? 'hidden' : 'visible';
      selected.style.visibility = selection[1] < viewStart || selection[0] > viewEnd ? 'hidden' : 'visible';
      shadeLeft.style.width = `${left}%`; shadeRight.style.width = `${100 - right}%`;
      first.textContent = Gif.formatTimestamp(viewStart); last.textContent = Gif.formatTimestamp(viewEnd);
      summary.textContent = `${Gif.formatTimestamp(selection[0])} – ${Gif.formatTimestamp(selection[1])} · ${Math.max(0, (selection[1] - selection[0])).toFixed(1)}초`;
      zoom.textContent = full ? '선택 구간 확대' : '전체 영상';
      back.disabled = disabled || full || viewStart <= 0; next.disabled = disabled || full || viewEnd >= limit; zoom.disabled = disabled;
      [grips[0], grips[1], selected].forEach((el, i) => {
        const current = selection[i === 1 ? 1 : 0];
        el.setAttribute('aria-valuenow', String(current)); el.setAttribute('aria-valuetext', Gif.formatTimestamp(current));
        el.setAttribute('aria-valuemin', String(i === 0 ? Math.max(0, selection[1] - 15) : i === 1 ? selection[0] + 1 : 0));
        el.setAttribute('aria-valuemax', String(i === 0 ? selection[1] - 1 : i === 1 ? Math.min(limit, selection[0] + 15) : limit - (selection[1] - selection[0])));
        el.setAttribute('aria-disabled', String(disabled)); el.tabIndex = disabled ? -1 : 0;
        if (i < 2) el.disabled = disabled;
      });
      const key = `${lastSource}:${viewStart.toFixed(1)}:${viewEnd.toFixed(1)}`;
      if (!disabled && key !== frameKey) {
        frameKey = key; const epoch = ++frameEpoch; frames.replaceChildren();
        for (let i = 0; i < 6; i++) {
          const tile = document.createElement('img'); tile.alt = ''; tile.draggable = false;
          tile.style.cssText = 'width:16.666%;height:100%;object-fit:cover;pointer-events:none';
          tile.onerror = () => { if (epoch === frameEpoch) tile.style.visibility = 'hidden'; };
          try { tile.src = urlAt(viewStart + span * (i + 0.5) / 6); } catch { tile.style.visibility = 'hidden'; }
          frames.append(tile);
        }
      }
    }
    function apply(side, time) {
      selection = Gif.moveRange(...selection, side, time, limit);
      change(...selection); paint(); thumbnail(selection[side === 'end' ? 1 : 0], side);
    }
    function bind(el, side) {
      el.addEventListener('pointerdown', event => {
        if (disabled || event.button !== 0 || (side === 'move' && grips.includes(event.target))) return;
        event.preventDefault(); event.stopPropagation(); el.focus();
        drag = {id: event.pointerId, x: event.clientX, original: [...selection], side, width: strip.getBoundingClientRect().width, span: viewEnd - viewStart};
        el.setPointerCapture(event.pointerId); thumbnail(selection[side === 'end' ? 1 : 0], side);
      });
      el.addEventListener('pointermove', event => {
        if (!drag || drag.side !== side || event.pointerId !== drag.id || disabled) return;
        const delta = (event.clientX - drag.x) / Math.max(1, drag.width) * drag.span;
        const original = drag.original; selection = [...original]; apply(side, original[side === 'end' ? 1 : 0] + delta);
      });
      const release = event => { if (drag?.id === event.pointerId && drag.side === side) { drag = null; if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId); } };
      el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
      el.addEventListener('keydown', event => {
        if (disabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        const current = selection[side === 'end' ? 1 : 0];
        apply(side, event.key === 'Home' ? 0 : event.key === 'End' ? limit : current + (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 1 : 0.1));
        if (selection[0] < viewStart || selection[1] > viewEnd) { recenter(); paint(); }
      });
    }
    bind(grips[0], 'start'); bind(grips[1], 'end'); bind(selected, 'move');
    strip.addEventListener('pointerdown', event => {
      if (disabled || event.target !== strip || event.button !== 0) return;
      const rect = strip.getBoundingClientRect(); apply('move', viewStart + (event.clientX - rect.left) / rect.width * (viewEnd - viewStart) - (selection[1] - selection[0]) / 2);
    });
    zoom.addEventListener('click', () => { full = !full; recenter(); paint(); });
    function pan(direction) { const span = viewEnd - viewStart; viewStart = Math.max(0, Math.min(limit - span, viewStart + direction * span / 2)); viewEnd = viewStart + span; paint(); }
    back.addEventListener('click', () => pan(-1)); next.addEventListener('click', () => pan(1));
    const note = document.createElement('small'); note.textContent = '1–15초 · 손잡이로 자르기 · 가운데 드래그로 이동'; section.append(note);
    container.prepend(section);
    function sync(start, end, duration, blocked) {
      const changed = selection[0] !== start || selection[1] !== end, source = video()?.currentSrc;
      const mediaChanged = source !== lastSource || limit !== (duration || 1);
      if (changed || mediaChanged) clear();
      else if (blocked) clear(true);
      limit = duration || 1; selection = [start, end]; disabled = blocked || limit < 1;
      if (disabled) drag = null;
      lastSource = source;
      if (mediaChanged || (changed && !drag)) recenter();
      paint();
      if (mediaChanged && !disabled) thumbnail(start, 'start');
    }
    image.style.display = 'none';
    return {sync, dispose: () => { clear(); frameEpoch++; frames.replaceChildren(); drag = null; }};
  };
})();
