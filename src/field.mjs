export const glyphs = {
  0: ['01110', '11011', '10001', '10001', '10001', '11011', '01110'],
  1: ['00100', '01100', '10100', '00100', '00100', '00100', '01110']
};

export function makeCanopy(compact) {
  const points = [];
  const rings = compact ? 15 : 23;
  for (let ring = 1; ring <= rings; ring++) {
    const r = ring / rings;
    const count = 8 * Math.max(1, Math.round(r * (compact ? 8 : 12)));
    for (let spoke = 0; spoke < count; spoke++) {
      const angle = spoke / count * Math.PI * 2;
      const scallop = Math.sin(angle * 8) ** 2 * r ** 5;
      const radius = 1.64 * r * (1 - .045 * scallop);
      points.push({
        x: radius * Math.cos(angle),
        z: radius * Math.sin(angle),
        y: .86 * Math.sqrt(1 - .97 * r * r) - .11 * scallop,
        bit: (ring * 17 + spoke * 13 + Math.floor(spoke / 3)) % 2,
        light: .50 + .47 * Math.cos(angle - 1.1) ** 2
      });
    }
  }
  for (let index = 0; index < 35; index++) {
    const bend = Math.max(0, index - 25) / 9 * Math.PI;
    points.push({
      x: .19 * (1 - Math.cos(bend)), y: .88 - Math.min(index, 25) * .077 - .19 * Math.sin(bend),
      z: 0, bit: index % 2, light: .84
    });
  }
  return points.sort((left, right) => left.z - right.z);
}

export function project(point, progress, width, height, yaw = 0) {
  const angle = -.18 + .43 * progress + yaw;
  const x = point.x * Math.cos(angle) + point.z * Math.sin(angle);
  const z = point.z * Math.cos(angle) - point.x * Math.sin(angle);
  const depth = 4.15 - progress * 2.15 - z;
  const cameraY = 1.18 - 1.97 * progress;
  const vertical = point.y - cameraY + depth * (.25 - .24 * progress);
  const focal = Math.min(width, height * 1.12) * .91;
  return {
    x: width * .5 + x * focal / depth,
    y: height * .46 - vertical * focal / depth,
    size: Math.min(width * .057, Math.max(2.6, focal * .063 / depth)),
    light: point.light,
    bit: point.bit
  };
}
