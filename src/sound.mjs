let context;
let ripple;

function createRipple(context) {
  const duration = .26;
  const { sampleRate } = context;
  const buffer = context.createBuffer(1, Math.round(sampleRate * duration), sampleRate);
  const samples = buffer.getChannelData(0);
  const rings = [
    { delay: 0, start: 480, end: 965, decay: .032, volume: .28 },
    { delay: .047, start: 400, end: 760, decay: .034, volume: .09 },
    { delay: .104, start: 325, end: 615, decay: .031, volume: .043 }
  ];

  // Rising bubble tones with softer, lower echoes give the drop a watery tail.
  for (const { delay, start, end, decay, volume } of rings) {
    const onset = Math.round(delay * sampleRate);
    for (let i = onset; i < samples.length; i++) {
      const time = (i - onset) / sampleRate;
      const sweep = (1 - Math.exp(-time / .016)) * .016;
      const phase = 2 * Math.PI * (end * time - (end - start) * sweep);
      const attack = Math.min(1, time / .006);
      const release = Math.min(1, (samples.length - 1 - i) / (.025 * sampleRate));
      const envelope = volume * attack * release * Math.exp(-time / decay);
      samples[i] += (Math.sin(phase) + .19 * Math.sin(2 * phase)) * envelope;
    }
  }
  return buffer;
}

export async function playRippleSound() {
  if (!globalThis.AudioContext) return;
  try {
    context ??= new AudioContext();
    if (context.state !== 'running') await context.resume();
    ripple ??= createRipple(context);

    const source = context.createBufferSource();
    source.buffer = ripple;
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start();
  } catch {
    // Audio may be blocked by browser settings or unavailable on this device.
  }
}
