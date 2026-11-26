import { effectsKey } from './model.mjs';
import { playUmbrellaIntro } from './intro-player.mjs';

const name = 'REPEL';
const fabric = ['#40645c', '#36564f', '#2c4844', '#304f49', '#395c54'];
const panels = Array.from(name, (letter, index) => {
  const angle = index * 360 / name.length;
  return `<g transform="rotate(${angle})">
    <use href="#intro-gore" fill="${fabric[index]}"/>
    <g transform="translate(0 -63) rotate(${-angle})">
      <text class="umbrella-print" text-anchor="middle" dy=".35em">${letter}</text>
    </g>
  </g>`;
}).join('');

export const umbrellaIntro = `<template id="umbrella-entrance">
  <div class="umbrella-intro" aria-hidden="true">
    <div class="intro-stage">
      <div class="intro-camera">
        <svg class="intro-canopy" viewBox="-256 -256 512 512" width="512" height="512" focusable="false">
          <defs>
            <path id="intro-gore" d="M0 0 L-79.94 -110.03 Q0 -80 79.94 -110.03 Z"
              stroke="#709286" stroke-width=".85" stroke-linejoin="round"/>
          </defs>
          <g class="intro-unfold">
            <g class="intro-rotor">
              ${panels}
              <circle r="3.6" fill="#b2c6aa"/>
            </g>
          </g>
        </svg>
        <canvas class="intro-spray"></canvas>
      </div>
      <div class="intro-meter"><span class="intro-track"><i></i></span><span class="intro-percent">0%</span></div>
    </div>
  </div>
</template>
<script>
  // Start at first paint, while the portal's modules and fonts are still arriving.
  (${playUmbrellaIntro})(${JSON.stringify(effectsKey)}, ${name.length});
</script>`;
