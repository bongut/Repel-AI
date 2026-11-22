const surfaces = [
  '.chapter', '.threshold', '.scene', '.chapter-header', '.reflection', '.progress-overview',
  '.progress-row', '.editorial-note', '.play-lab', '.work-output', '.button', '.header-inner nav a', '.effects'
].join(', ');
const onset = 80;
const lifetime = 1750;
let texture;

function svg(name, attributes = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

// Red and green encode the horizontal and vertical slope of a pair of wave crests.
// Transparent water between crests lets earlier waves show through when they cross.
function waveTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const image = ctx.createImageData(96, 96);
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 96; x++) {
      const dx = (x + .5 - 48) / 48;
      const dy = (y + .5 - 48) / 48;
      const radius = Math.hypot(dx, dy);
      const slope = Math.sin((radius - .58) * 16) * Math.exp(-((radius - .58) ** 2) / .050);
      const index = 4 * (y * 96 + x);
      image.data[index] = 128 + 126 * Math.sign(slope) * dx / radius;
      image.data[index + 1] = 128 + 126 * Math.sign(slope) * dy / radius;
      image.data[index + 3] = radius < 1 ? 255 * Math.abs(slope) : 0;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function createSurface(target, definitions, id) {
  const filter = svg('filter', {
    id, x: '-20%', y: '-40%', width: '140%', height: '180%', 'color-interpolation-filters': 'sRGB'
  });
  const stillWater = svg('feFlood', { 'flood-color': '#808080', result: 'still' });
  const map = svg('feMerge', { result: 'surface' });
  map.append(svg('feMergeNode', { in: 'still' }));
  const bend = svg('feDisplacementMap', {
    in: 'SourceGraphic', in2: 'surface', scale: 13, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bent'
  });
  // A little grazing light makes the same deformation legible on flat, dark cards.
  const light = svg('feColorMatrix', {
    in: 'surface', values: '0 0 0 0 .69  0 0 0 0 .87  0 0 0 0 .88  .09 .07 0 0 -.082'
  });
  filter.append(stillWater, map, bend, light, svg('feComposite', { in2: 'bent', operator: 'atop' }));
  definitions.append(filter);
  target.style.filter = 'url(#' + id + ')';
  return { filter, map, waves: [], serial: 0 };
}

function addWave(state, x, y, reach, now) {
  const name = 'wave-' + state.serial++;
  const image = svg('feImage', { href: texture, x, y, width: 1, height: 1 });
  const transfer = svg('feComponentTransfer', { result: name });
  const alpha = svg('feFuncA', { type: 'linear', slope: 0 });
  const layer = svg('feMergeNode', { in: name });
  transfer.append(alpha);
  state.map.before(image, transfer);
  state.map.append(layer);
  state.waves.push({ image, transfer, alpha, layer, x, y, reach, born: now + onset });
}

export function wireRipples(signal, reduced) {
  const definitions = svg('svg', { class: 'ripple-definitions', 'aria-hidden': true, focusable: false });
  const active = new Map();
  let serial = 0;
  let frame = 0;

  function release(target, state) {
    target.style.removeProperty('filter');
    state.filter.remove();
    active.delete(target);
  }

  function animate(now) {
    frame = 0;
    for (const [target, state] of active) {
      if (!target.isConnected) { release(target, state); continue; }
      state.waves = state.waves.filter(wave => {
        const t = (now - wave.born) / lifetime;
        if (t >= 1) {
          wave.image.remove();
          wave.transfer.remove();
          wave.layer.remove();
          return false;
        }
        if (t <= 0) return true;
        const radius = 24 + wave.reach * t;
        const attack = Math.min(1, t / .20);
        const strength = Math.min(1, radius / 110) * attack * attack * (3 - 2 * attack) * (1 - t * t) ** 2;
        wave.alpha.setAttribute('slope', strength.toFixed(3));
        wave.image.setAttribute('x', wave.x - radius);
        wave.image.setAttribute('y', wave.y - radius);
        wave.image.setAttribute('width', 2 * radius);
        wave.image.setAttribute('height', 2 * radius);
        return true;
      });
      if (!state.waves.length) release(target, state);
    }
    if (active.size) frame = requestAnimationFrame(animate);
  }

  function sample(event) {
    const keyboard = event.type === 'focusin';
    if (reduced() || document.hidden) return;
    const target = event.target.closest?.(surfaces);
    if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
    if (keyboard ? !event.target.matches(':focus-visible') : event.pointerType !== 'mouse' || event.buttons) return;
    const now = performance.now();
    let state = active.get(target);
    if (state) {
      if (now - state.last.time < 120) return;
      if (!keyboard && Math.hypot(event.clientX - state.last.x, event.clientY - state.last.y) < 22) return;
    }
    const bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    texture ??= waveTexture();
    if (!texture) return;
    if (!definitions.isConnected) document.body.append(definitions);
    if (!state) {
      state = createSurface(target, definitions, 'water-surface-' + serial++);
      active.set(target, state);
    }
    // Translate from the projected card (including the chapter orbit) into filter coordinates.
    const x = keyboard ? target.offsetWidth / 2 : (event.clientX - bounds.left) * target.offsetWidth / bounds.width;
    const y = keyboard ? target.offsetHeight / 2 : (event.clientY - bounds.top) * target.offsetHeight / bounds.height;
    const reach = Math.min(255, Math.max(80, Math.min(target.offsetWidth, target.offsetHeight) * .83));
    addWave(state, x, y, reach, now);
    state.last = { x: event.clientX, y: event.clientY, time: now };
    if (!frame) frame = requestAnimationFrame(animate);
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const [target, state] of active) release(target, state);
  }
  document.addEventListener('pointermove', sample, { signal, passive: true });
  document.addEventListener('focusin', sample, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); }, { signal });
  const preference = new MutationObserver(() => { if (reduced()) clear(); });
  preference.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced'] });
  signal.addEventListener('abort', () => { clear(); preference.disconnect(); definitions.remove(); }, { once: true });
}
