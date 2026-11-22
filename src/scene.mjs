import { makeCanopy, project } from './field.mjs';

const framedView = new WeakMap();
const smooth = value => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function setupPortalWeather(reduced) {
  const canvas = document.createElement('canvas');
  let context;
  try { context = canvas.getContext('2d'); } catch { return () => {}; }
  if (!context) return () => {};
  canvas.className = 'portal-weather';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const controller = new AbortController();
  const { signal } = controller;
  const canopy = makeCanopy(true);
  const curriculum = document.querySelector('.curriculum-stage');
  const hero = document.querySelector('.hero-stage');
  const framed = hero?.querySelector('[data-scene]');
  const cards = curriculum ? [...curriculum.querySelectorAll('.chapter')] : [];
  const orbit = matchMedia('(min-width: 53rem) and (min-height: 40rem)');
  const rain = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let elapsed = 0;
  let previous = 0;
  let progress = 0;
  let chapterPhase = 0;
  let handoff = 0;
  let surface;

  function update() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    curriculum?.toggleAttribute('data-orbit', orbit.matches && !reduced());
    if (!reduced() && !document.hidden && width && height) frame = requestAnimationFrame(draw);
  }

  function measure() {
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    const dpi = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpi);
    canvas.height = Math.round(height * dpi);
    context.setTransform(dpi, 0, 0, dpi, 0, 0);
    surface = new Float32Array(Math.ceil(width / 12));
    rain.length = 0;
    const count = Math.min(52, Math.ceil(width / 24));
    for (let index = 0; index < count; index++) {
      rain.push({
        x: (index + .2 + Math.random() * .6) * width / count,
        y: Math.random() * (height + 100) - 100,
        speed: 180 + Math.random() * 200,
        vx: 0, vy: 0, bounced: false,
        bit: index % 2
      });
    }
    update();
  }

  function markSurface(x, y) {
    const column = Math.floor(x / 12);
    if (column >= 0 && column < surface.length) surface[column] = Math.min(surface[column], y);
  }

  function draw(time) {
    const dt = Math.min(.05, (time - (previous || time)) / 1000);
    previous = time;
    elapsed += dt;
    const root = document.scrollingElement;
    const target = Math.min(1, Math.max(0, scrollY / Math.max(1, root.scrollHeight - root.clientHeight)));
    progress += (target - progress) * (1 - Math.exp(-7 * dt));
    context.clearRect(0, 0, width, height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    surface.fill(Infinity);
    const view = framed && framedView.get(framed);
    if (view) {
      const box = framed.getBoundingClientRect();
      if (box.bottom > 0 && box.top < height) {
        for (const point of canopy) {
          const digit = project(point, view.progress, box.width, box.height, view.yaw);
          if (digit.x >= 0 && digit.x <= box.width && digit.y >= 0 && digit.y <= box.height) {
            markSurface(box.left + digit.x, box.top + digit.y);
          }
        }
      }
    }
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight - scrollY : 0;
    const reveal = hero ? Math.max(0, 1 - heroBottom / (height * .72)) : 1;
    const orbitActive = curriculum?.hasAttribute('data-orbit');
    const bounds = orbitActive ? curriculum.getBoundingClientRect() : null;
    const blend = bounds ? smooth((height * .83 - bounds.top) / (height * .48)) *
      smooth((bounds.bottom + height * .2) / (height * .86)) : 0;
    handoff += (blend - handoff) * (1 - Math.exp(-8 * dt));
    if (orbitActive) {
      const header = document.querySelector('.site-header').offsetHeight;
      const travel = bounds.height - curriculum.firstElementChild.offsetHeight;
      const goal = Math.max(0, Math.min(1, (header - bounds.top) / Math.max(1, travel))) * (cards.length - 1);
      chapterPhase += (goal - chapterPhase) * (1 - Math.exp(-9 * dt));
      const pitch = Math.min(width * .36, 485);
      const exit = smooth((bounds.bottom - height * .18) / (height * .55));
      cards.forEach((card, index) => {
        const angle = Math.max(-1.55, Math.min(1.55, (index - chapterPhase) * .88));
        const depth = Math.cos(angle);
        card.style.setProperty('--orbit-transform', 'translate3d(' + Math.sin(angle) * pitch + 'px,' +
          ((1 - depth) * 47 + Math.sin(angle) * 24) + 'px,' + ((depth - 1) * 380) +
          'px) rotateY(' + -angle * 31 + 'deg)');
        card.style.setProperty('--orbit-opacity', String((.48 + depth * .52) * (.42 + exit * .58)));
        card.style.setProperty('--orbit-depth', String(Math.round(depth * 100)));
      });
    }
    if (reveal > 0) {
      const small = Math.min(width * .58, height * .8, 550);
      const large = Math.min(width * .75, height * 1.02, 900);
      const size = small + (large - small) * handoff;
      const left = (width - size * .92) * (1 - handoff) + (width - size) / 2 * handoff;
      const top = height * (.19 - .13 * handoff);
      const tilt = progress * .78 * (1 - handoff) + (.16 + chapterPhase * .16) * handoff;
      const angle = (chapterPhase * handoff + progress * (1 - handoff)) * Math.PI * 1.5;
      for (const point of canopy) {
        const digit = project(point, tilt, size, size, angle);
        const x = left + digit.x;
        const y = top + digit.y;
        const edge = Math.max(0, Math.min(1, (x / width - .58) * 3.4));
        const strength = reveal * (.52 * handoff + edge * .56 * (1 - handoff));
        if (strength < .01) continue;
        if (strength > .14) markSurface(x, y);
        context.fillStyle = digit.bit ? '#d5f492' : '#85c6bc';
        context.globalAlpha = digit.light * strength;
        context.font = '600 ' + Math.round(digit.size) + 'px monospace';
        context.fillText(digit.bit, x, y);
      }
    }
    context.font = '13px monospace';
    for (const drop of rain) {
      const previousY = drop.y;
      if (drop.bounced) drop.vy = Math.min(drop.speed, drop.vy + 1050 * dt);
      drop.y += (drop.bounced ? drop.vy : drop.speed) * dt;
      drop.x += drop.vx * dt;
      const column = Math.floor(drop.x / 12);
      const impact = surface[column];
      if (!drop.bounced && previousY <= impact && drop.y >= impact && impact > 0) {
        const left = surface[column - 1];
        const right = surface[column + 1];
        const downhill = Number.isFinite(left) && Number.isFinite(right) ? Math.sign(right - left) : 0;
        drop.y = impact;
        drop.vy = -drop.speed * .48;
        drop.vx = (downhill || (drop.x < width / 2 ? -1 : 1)) * drop.speed * .72;
        drop.bounced = true;
      }
      if (drop.y > height + 110 || drop.x < -40 || drop.x > width + 40) {
        drop.y = -20 - Math.random() * 115;
        drop.x = Math.random() * width;
        drop.vx = 0;
        drop.bounced = false;
      }
      const edge = Math.abs(.5 - drop.x / width) * 2;
      for (let tail = 0; tail < (drop.bounced ? 3 : 6); tail++) {
        context.fillStyle = tail < 2 ? '#c8f4a5' : '#80b5a5';
        context.globalAlpha = (.17 + edge * .42 + (drop.bounced ? .16 : 0)) * (1 - tail / 6);
        const bit = (drop.bit + tail + Math.floor(elapsed * 9)) % 2;
        context.fillText(bit, drop.x - drop.vx * tail * .045,
          drop.y - (drop.bounced ? drop.vy * .045 : 18) * tail);
      }
    }
    context.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }

  const preference = new MutationObserver(update);
  preference.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced'] });
  document.addEventListener('visibilitychange', update, { signal });
  orbit.addEventListener('change', update, { signal });
  window.addEventListener('resize', measure, { signal });
  measure();

  return () => {
    cancelAnimationFrame(frame);
    controller.abort();
    preference.disconnect();
    curriculum?.removeAttribute('data-orbit');
    canvas.remove();
  };
}

export function setupScene(host) {
  const canvas = document.createElement('canvas');
  let context;
  try { context = canvas.getContext('2d', { alpha: true }); } catch { return () => {}; }
  if (!context) return () => {};
  host.append(canvas);
  const stage = host.closest('.hero-stage');
  const controller = new AbortController();
  const { signal } = controller;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let points = [];
  let width = 0;
  let height = 0;
  let frame = 0;
  let previousTime = 0;
  let progress = 0;
  let yaw = 0;
  let pointerYaw = 0;
  let visible = true;
  let available = true;

  const reduced = () => motion.matches || document.documentElement.hasAttribute('data-reduced');
  const active = () => visible && available && !document.hidden;
  const schedule = () => {
    if (!frame && active()) frame = requestAnimationFrame(draw);
  };

  function measure() {
    width = host.clientWidth;
    height = host.clientHeight;
    const compact = width < 470;
    const scale = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.65);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    points = makeCanopy(compact);
    schedule();
  }

  function draw(time) {
    frame = 0;
    if (!active() || !width || !height) return;
    const bounds = stage.getBoundingClientRect();
    const quiet = reduced();
    const travel = Math.max(height * .9, bounds.height - stage.firstElementChild.offsetHeight);
    const header = document.querySelector('.site-header').offsetHeight;
    const target = quiet ? 0 : Math.max(0, Math.min(1, (header - bounds.top) / travel));
    const ease = 1 - Math.exp(-Math.min(40, time - (previousTime || time - 16)) / 92);
    previousTime = time;
    progress = quiet ? 0 : progress + (target - progress) * ease;
    yaw = quiet ? 0 : yaw + (pointerYaw - yaw) * ease;
    context.clearRect(0, 0, width, height);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const rotation = yaw + progress * Math.PI * 1.55;
    framedView.set(host, { progress, yaw: rotation });
    for (const point of points) {
      const glyph = project(point, progress, width, height, rotation);
      if (glyph.x < -20 || glyph.x > width + 20 || glyph.y < -20 || glyph.y > height + 20) continue;
      context.font = '600 ' + Math.round(glyph.size) + 'px monospace';
      context.fillStyle = glyph.bit ? '#def08d' : '#a7cd8e';
      context.globalAlpha = glyph.light;
      context.fillText(glyph.bit, glyph.x, glyph.y);
    }
    context.globalAlpha = 1;
    host.setAttribute('data-ready', '');
    if (!quiet && (Math.abs(target - progress) > .001 || Math.abs(pointerYaw - yaw) > .001)) schedule();
    else previousTime = 0;
  }

  const resize = new ResizeObserver(measure);
  resize.observe(host);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
  });
  visibility.observe(host);
  const preferences = new MutationObserver(schedule);
  preferences.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced'] });
  addEventListener('scroll', schedule, { signal, passive: true });
  motion.addEventListener('change', schedule, { signal });
  document.addEventListener('visibilitychange', schedule, { signal });
  host.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced()) return;
    pointerYaw = (event.offsetX / width - .5) * .36;
    schedule();
  }, { signal, passive: true });
  host.addEventListener('pointerleave', () => { pointerYaw = 0; schedule(); }, { signal });
  canvas.addEventListener('contextlost', () => {
    available = false;
    host.removeAttribute('data-ready');
    stage.removeAttribute('data-canopy');
  }, { signal });
  canvas.addEventListener('contextrestored', () => {
    available = true;
    stage.setAttribute('data-canopy', '');
    measure();
  }, { signal });
  stage.setAttribute('data-canopy', '');
  measure();

  return () => {
    controller.abort();
    cancelAnimationFrame(frame);
    resize.disconnect();
    visibility.disconnect();
    preferences.disconnect();
    canvas.remove();
    host.removeAttribute('data-ready');
    stage.removeAttribute('data-canopy');
  };
}
