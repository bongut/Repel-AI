// The static renderer embeds this function so the entrance can run before app.mjs loads.
export function playUmbrellaIntro(effectsKey, panelCount) {
  const template = document.getElementById('umbrella-entrance');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  try { reduced ||= localStorage.getItem(effectsKey) === 'true'; } catch { /* storage is optional */ }
  if (reduced) { template.remove(); return; }

  const root = template.content.firstElementChild;
  template.replaceWith(root);
  const stage = root.querySelector('.intro-stage');
  const rotor = root.querySelector('.intro-rotor');
  const canvas = root.querySelector('.intro-spray');
  const percent = root.querySelector('.intro-percent');
  const track = root.querySelector('.intro-track i');
  const events = new AbortController();
  const { signal } = events;
  const drops = [];
  const circle = Math.PI * 2;
  let context;
  try { context = canvas.getContext('2d'); } catch { /* the canopy still animates */ }
  let glyphScale = 1;
  let frame = 0;
  let previous;
  let turns = 0;
  let lastBurst = -1;
  let displayed = 0;
  let fullAt;
  let revealAt;
  let revealTurns;
  let fontsReady = !document.fonts;

  function dismiss() {
    cancelAnimationFrame(frame);
    events.abort();
    root.remove();
  }
  window.addEventListener('pagehide', dismiss, { signal });
  // If the app cannot start, uncover the server-rendered page.
  window.addEventListener('error', event => {
    if (event.target instanceof HTMLScriptElement || event instanceof ErrorEvent) dismiss();
  }, { capture: true, signal });
  window.addEventListener('wheel', dismiss, { passive: true, signal });
  document.addEventListener('focusin', dismiss, { signal });
  document.addEventListener('pointerdown', dismiss, { capture: true, signal });
  motion.addEventListener('change', () => { if (motion.matches) dismiss(); }, { signal });
  root.addEventListener('animationend', event => { if (event.target === root) dismiss(); }, { signal });

  function watchFonts() {
    document.fonts?.ready.then(() => { fontsReady = true; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchFonts, { once: true, signal });
  else watchFonts();

  function resize() {
    if (!context) return;
    // Use the same 512-unit square and center as the SVG, even when the camera zooms.
    const width = Math.max(1, stage.clientWidth);
    const size = Math.round(width * Math.min(devicePixelRatio || 1, 2));
    glyphScale = Math.max(1, 512 / width);
    canvas.width = canvas.height = size;
    context.setTransform(size / 512, 0, 0, size / 512, size / 2, size / 2);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineCap = 'round';
  }
  resize();
  window.addEventListener('resize', resize, { signal });

  function fling(angle, now) {
    if (!context) return;
    const firstRib = Math.floor(Math.random() * panelCount);
    for (let jet = 0; jet < 4; jet++) {
      const tip = angle - Math.PI / 2 + (firstRib + jet - .5) * circle / panelCount;
      const reach = 82 + Math.random() * 35;
      const sweep = 79 + Math.random() * 29;
      const flight = 600 + Math.random() * 150;
      for (let i = 0; i < 3; i++) {
        drops.push({
          angle: tip + (i - 1) * .025,
          born: now + i * 43, flight: flight + i * 18,
          reach: reach - i * 12, sweep: sweep - i * 13,
          size: (15 - i * 2) * glyphScale, lean: (Math.random() - .5) * .6,
          ink: i === 0 ? '#d6ed92' : '#a2d5c8', bit: Math.random() < .5 ? '0' : '1'
        });
      }
    }
  }

  function drawSpray(now) {
    if (!context) return;
    context.clearRect(-256, -256, 512, 512);
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      const t = (now - drop.born) / drop.flight;
      if (t >= 1) { drops.splice(i, 1); continue; }
      if (t < 0) continue;
      // Leave the rib tangentially, then curve outwards. Each jet has its own radial axis.
      const tail = Math.max(0, t - .17);
      const x = 136 + 8 * t + drop.reach * t * t;
      const y = drop.sweep * t * (2 - t);
      const tailX = 136 + 8 * tail + drop.reach * tail * tail;
      const tailY = drop.sweep * tail * (2 - tail);
      const opacity = Math.min(1, t * 18) * (1 - t * t);
      context.save();
      context.rotate(drop.angle);
      context.strokeStyle = context.fillStyle = drop.ink;
      context.globalAlpha = opacity * .38;
      context.lineWidth = .9;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.quadraticCurveTo(tailX + (t - tail) * (4 + drop.reach * tail),
        tailY + (t - tail) * drop.sweep * (1 - tail), x, y);
      context.stroke();
      context.translate(x, y);
      context.rotate(-drop.angle + drop.lean * t);
      context.globalAlpha = opacity;
      context.font = '500 ' + drop.size + 'px monospace';
      context.fillText(drop.bit, 0, 0);
      context.restore();
    }
  }

  function draw(now) {
    if (!root.isConnected || document.documentElement.hasAttribute('data-reduced')) { dismiss(); return; }
    const dt = Math.min(.064, (now - (previous ?? now)) / 1000);
    previous = now;
    if (revealAt === undefined) {
      turns += dt / 1.12 * (1 - .23 * Math.cos(turns * circle));
    } else {
      const remaining = Math.max(0, 1 - (now - revealAt) / 720);
      const upright = Math.ceil(revealTurns);
      turns = upright - (upright - revealTurns) * remaining ** 3;
    }
    const angle = (turns % 1) * circle;
    rotor.setAttribute('transform', 'rotate(' + angle * 180 / Math.PI + ')');
    const burst = Math.floor((turns - .25) * 2);
    if (burst > lastBurst && revealAt === undefined) { fling(angle, now); lastBurst = burst; }
    drawSpray(now);

    // Smooth the readout only up to the number of completed page-readiness milestones.
    const completed = Number(document.readyState !== 'loading') + Number(fontsReady) +
      Number(root.hasAttribute('data-portal-ready')) + Number(document.readyState === 'complete');
    const next = Math.min(completed * 25, displayed + dt * 70);
    if (Math.floor(next) !== Math.floor(displayed)) {
      percent.textContent = Math.floor(next) + '%';
      track.style.transform = 'scaleX(' + next / 100 + ')';
    }
    displayed = next;
    if (displayed === 100) {
      fullAt ??= now;
      const phase = turns % 1;
      if (revealAt === undefined && turns >= 1.7 && phase >= .72 && phase <= .85 && now - fullAt >= 160) {
        revealAt = now;
        revealTurns = turns;
        root.setAttribute('data-reveal', '');
      }
    }
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
}
