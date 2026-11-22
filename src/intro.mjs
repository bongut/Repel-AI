import { effectsKey } from './model.mjs';

// Each panel shares its two curved ribs with its neighbours, even mid-fold.
const crown = '240 58';
const ribs = [
  { folded: [229, 101, 217, 196, 226, 246], open: [163, 60, 67, 99, 37, 178] },
  { folded: [233, 102, 220, 186, 230, 234], open: [177, 64, 114, 115, 98, 175] },
  { folded: [236, 104, 227, 191, 235, 251], open: [205, 64, 164, 113, 151, 189] },
  { folded: [243, 105, 245, 195, 246, 242], open: [275, 64, 316, 113, 329, 189] },
  { folded: [247, 102, 256, 191, 251, 249], open: [303, 64, 366, 115, 382, 175] },
  { folded: [251, 106, 262, 197, 255, 237], open: [317, 60, 413, 99, 443, 178] }
];
const hems = [
  { folded: [228, 222], open: [64, 158], shade: 'shade' },
  { folded: [232, 227], open: [123, 157], shade: 'side' },
  { folded: [241, 226], open: [240, 151], shade: 'face' },
  { folded: [249, 224], open: [356, 156], shade: 'side' },
  { folded: [254, 224], open: [412, 153], shade: 'shade' }
];

function panelPath(index, state) {
  const left = ribs[index][state];
  const [x1, y1, x2, y2, tipX, tipY] = ribs[index + 1][state];
  return `M${crown} C${left.join(' ')} Q${hems[index][state].join(' ')} ${tipX} ${tipY} C${x2} ${y2} ${x1} ${y1} ${crown} Z`;
}

function unfold(folded, open, attributes) {
  return `<path d="${folded}" ${attributes}>
    <animate attributeName="d" from="${folded}" to="${open}" begin=".32s" dur=".78s"
      calcMode="spline" keySplines=".36 0 .12 1" keyTimes="0;1" fill="freeze"/>
  </path>`;
}

const panels = hems.map(({ shade }, index) => unfold(panelPath(index, 'folded'), panelPath(index, 'open'),
  `fill="url(#intro-${shade})"`)).join('');

export const umbrellaIntro = `<template id="umbrella-entrance">
  <div class="umbrella-intro" aria-hidden="true">
    <svg viewBox="0 0 480 360" width="480" height="360" focusable="false">
      <defs>
        <linearGradient id="intro-face" x2=".75" y2="1">
          <stop stop-color="#91b5a0"/><stop offset=".36" stop-color="#436960"/><stop offset="1" stop-color="#1d3a3c"/>
        </linearGradient>
        <linearGradient id="intro-side" x2=".9" y2=".8">
          <stop stop-color="#698c7d"/><stop offset=".55" stop-color="#2d4e49"/><stop offset="1" stop-color="#142c30"/>
        </linearGradient>
        <linearGradient id="intro-shade" x2=".3" y2="1">
          <stop stop-color="#4a7166"/><stop offset="1" stop-color="#122628"/>
        </linearGradient>
        <path id="intro-baseline" d="M173 152 Q240 139 307 152"/>
      </defs>
      <g transform="rotate(-7 240 180)" stroke-linecap="round" stroke-linejoin="round">
        <path d="M240 51 V291" fill="none" stroke="#7e9991" stroke-width="3"/>
        <path d="M240 281 V297 a17 17 0 0 1 -34 0 v-4" fill="none" stroke="#98b8a3" stroke-width="7"/>
        <path d="M238.5 285 v12 a15.5 15.5 0 0 1 -31 0" fill="none" stroke="#d4e3bd" stroke-width="1.2"/>
        ${unfold('M227 242 L240 245 L254 235', 'M86 165 L240 194 L396 165', 'fill="none" stroke="#546f65" stroke-width="1.8"')}
        <g stroke="#76978a" stroke-width="1.15">${panels}</g>
        <text class="umbrella-print" text-anchor="middle"><textPath href="#intro-baseline" startOffset="50%">REPEL</textPath></text>
        <path d="M240 57 v-7" stroke="#d7e5b7" stroke-width="3.2"/>
      </g>
    </svg>
  </div>
</template>
<script>
  (() => {
    const template = document.getElementById('umbrella-entrance');
    let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { reduced ||= localStorage.getItem(${JSON.stringify(effectsKey)}) === 'true'; } catch {}
    if (reduced) template.remove();
    else template.replaceWith(template.content);
  })();
</script>`;
