import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages, render } from '../src/render.mjs';
import { makeFallback } from './fallback.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const dist = resolve(root, 'dist');

export async function build() {
  const assets = join(dist, 'assets');
  await mkdir(assets, { recursive: true });
  for (const file of ['app.mjs', 'content.mjs', 'field.mjs', 'model.mjs', 'motion.mjs', 'scene.mjs', 'style.css']) {
    await copyFile(join(root, 'src', file), join(assets, file));
  }
  await writeFile(join(assets, 'field.png'), makeFallback());
  for (const path of pages.keys()) {
    const dir = join(dist, path);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), render(path));
  }
  await writeFile(join(dist, '404.html'), render('/404'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
  console.log('Built ' + pages.size + ' routes in ' + dist);
}

