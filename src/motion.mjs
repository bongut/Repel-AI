export function openRainTransition(signal, reduced) {
  if (reduced()) return null;
  const curtain = document.createElement('div');
  curtain.className = 'route-rain';
  curtain.setAttribute('aria-hidden', 'true');
  const count = Math.max(18, Math.min(62, Math.ceil(window.innerWidth / 22)));
  for (let index = 0; index < count; index++) {
    const stream = document.createElement('span');
    stream.className = 'route-rain-stream';
    stream.style.left = (index + .25 + Math.random() * .5) / count * 100 + '%';
    stream.style.setProperty('--fall-time', 380 + Math.random() * 540 + 'ms');
    stream.style.setProperty('--fall-delay', -Math.random() * 900 + 'ms');
    stream.textContent = Array.from({ length: 18 + index % 14 }, () => Math.random() < .5 ? '0' : '1').join('\n');
    curtain.append(stream);
  }
  document.body.append(curtain);
  const clear = () => {
    curtain.remove();
    signal.removeEventListener('abort', clear);
  };
  signal.addEventListener('abort', clear, { once: true });
  const covered = curtain.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 190, easing: 'ease-in', fill: 'both' }
  ).finished.catch(() => {});
  const reveal = async () => {
    if (!curtain.isConnected || reduced()) { clear(); return; }
    try {
      await curtain.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 380, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'both'
      }).finished;
    } catch { /* superseded navigation */ }
    finally { clear(); }
  };
  return { covered, reveal, clear };
}

export function wireSmoothScroll(signal, reduced) {
  let frame = 0;
  let destination = 0;
  let last = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };

  function step(time) {
    if (reduced()) { stop(); return; }
    const current = window.scrollY;
    const limit = document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight;
    destination = Math.max(0, Math.min(limit, destination));
    const remaining = destination - current;
    const dt = last ? Math.min(48, time - last) : 16;
    last = time;
    if (Math.abs(remaining) <= 2) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      stop();
      return;
    }
    const distance = Math.sign(remaining) * Math.max(1, Math.abs(remaining) * (1 - Math.exp(-dt / 92)));
    window.scrollTo({ top: current + distance, behavior: 'instant' });
    frame = requestAnimationFrame(step);
  }

  window.addEventListener('wheel', event => {
    if (reduced() || !event.cancelable || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey ||
      !event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      stop();
      return;
    }
    if (event.target.closest('dialog, textarea, select, input[type="number"], [contenteditable]')) return;
    const root = document.scrollingElement;
    for (let node = event.target; node && node !== document.body; node = node.parentElement) {
      if (node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY)) return;
    }
    const limit = root.scrollHeight - root.clientHeight;
    if (limit <= 0) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1;
    const delta = event.deltaY * unit;
    const current = window.scrollY;
    const base = frame && Math.sign(destination - current) === Math.sign(delta) ? destination : current;
    destination = Math.max(0, Math.min(limit, base + delta));
    if (!frame && destination === current) return;
    event.preventDefault();
    if (!frame) frame = requestAnimationFrame(step);
  }, { signal, passive: false });

  for (const event of ['keydown', 'pointerdown', 'touchstart', 'hashchange', 'popstate']) {
    window.addEventListener(event, stop, { signal, passive: true });
  }
  signal.addEventListener('abort', stop, { once: true });
}

export function wireInteriorScroll(main, signal, reduced) {
  const rail = document.createElement('span');
  rail.className = 'interior-scroll-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.append(document.createElement('i'));
  main.append(rail);
  let y = window.scrollY;
  let velocity = 0;
  let tilt = 0;
  let frame = 0;
  let last = 0;
  let lastScroll = 0;

  function updateRail() {
    const root = document.scrollingElement;
    const limit = root.scrollHeight - root.clientHeight;
    rail.hidden = limit <= 1;
    rail.style.setProperty('--scroll-position', (limit > 1 ? window.scrollY / limit : 0) * 100 + '%');
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = last = lastScroll = 0;
    velocity = tilt = 0;
    y = window.scrollY;
    main.removeAttribute('data-scroll-tilting');
  }

  function step(now) {
    frame = 0;
    if (reduced() || document.hidden) { reset(); return; }
    const dt = last ? Math.min(48, now - last) : 16;
    last = now;
    const current = window.scrollY;
    const distance = current - y;
    y = current;
    if (distance) {
      const next = Math.max(-8, Math.min(8, distance / dt * 3.8));
      velocity += (next - velocity) * .56;
      lastScroll = now;
      updateRail();
    } else if (now - lastScroll > 24) {
      velocity *= Math.exp(-dt / 90);
    }
    tilt += (velocity - tilt) * (1 - Math.exp(-dt / 75));
    if (Math.abs(tilt) < .04 && Math.abs(velocity) < .04 && !distance) { reset(); return; }
    main.setAttribute('data-scroll-tilting', '');
    main.style.setProperty('--scroll-tilt', tilt.toFixed(3) + 'deg');
    frame = requestAnimationFrame(step);
  }

  const onScroll = () => {
    if (reduced()) { y = window.scrollY; updateRail(); return; }
    if (!frame) frame = requestAnimationFrame(step);
  };
  window.addEventListener('scroll', onScroll, { signal, passive: true });
  window.addEventListener('resize', updateRail, { signal });
  const resize = new ResizeObserver(updateRail);
  resize.observe(main);
  const preference = new MutationObserver(() => { if (reduced()) reset(); });
  preference.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced'] });
  signal.addEventListener('abort', () => {
    reset();
    resize.disconnect();
    preference.disconnect();
    rail.remove();
  }, { once: true });
  updateRail();
}

export function wireChapterTilt(stage, signal, reduced) {
  for (const card of stage.querySelectorAll('.chapter')) {
    card.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || reduced()) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      const axis = Math.abs(x) >= Math.abs(y) ? '0 ' + Math.sign(x) : -Math.sign(y) + ' 0';
      card.style.setProperty('--entry-tilt', axis + ' 0 13deg');
    }, { signal });
    card.addEventListener('pointerleave', () => card.style.removeProperty('--entry-tilt'), { signal });
  }
}
