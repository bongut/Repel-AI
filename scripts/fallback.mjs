import { deflateSync, crc32 } from 'node:zlib';
import { glyphs, makeCanopy, project } from '../src/field.mjs';

function chunk(type, bytes) {
  const label = Buffer.from(type);
  const packed = Buffer.alloc(bytes.length + 12);
  packed.writeUInt32BE(bytes.length);
  label.copy(packed, 4);
  bytes.copy(packed, 8);
  packed.writeUInt32BE(crc32(packed.subarray(4, 8 + bytes.length)), 8 + bytes.length);
  return packed;
}

export function makeFallback() {
  const width = 850;
  const height = 750;
  const stride = width * 4 + 1;
  const pixels = Buffer.alloc(height * stride);
  for (const point of makeCanopy(false)) {
    const { x, y, size, bit, light } = project(point, 0, width, height);
    const unit = size / 9;
    const left = x - unit * 2.5;
    const top = y - unit * 3.5;
    const color = bit ? [222, 240, 141] : [167, 205, 142];
    const alpha = light;
    for (let row = Math.max(0, Math.ceil(top)); row < Math.min(height, top + unit * 7); row++) {
      for (let col = Math.max(0, Math.ceil(left)); col < Math.min(width, left + unit * 5); col++) {
        if (glyphs[bit][Math.floor((row - top) / unit)][Math.floor((col - left) / unit)] !== '1') continue;
        const index = row * stride + 1 + col * 4;
        const existing = pixels[index + 3] / 255 * (1 - alpha);
        const combined = existing + alpha;
        color.forEach((channel, offset) => {
          pixels[index + offset] = Math.round((pixels[index + offset] * existing + channel * alpha) / combined);
        });
        pixels[index + 3] = Math.round(combined * 255);
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))
  ]);
}

