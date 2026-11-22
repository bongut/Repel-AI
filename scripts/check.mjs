import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { pages, render } from '../src/render.mjs';

for (const folder of ['src', 'scripts', 'test']) {
  for (const name of await readdir(folder)) {
    if (!name.endsWith('.mjs')) continue;
    const result = spawnSync(process.execPath, ['--check', folder + '/' + name], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(1);
  }
}
for (const path of pages.keys()) {
  const html = render(path);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate ID at ' + path);
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  for (const link of links) {
    if (link.startsWith('#') && !ids.includes(link.slice(1))) throw new Error('Broken anchor: ' + path + link);
    if (link.startsWith('/') && !link.startsWith('/assets/')) {
      const [target, anchor] = link.split('#');
      if (!pages.has(target) || (anchor && !render(target).includes(' id="' + anchor + '"'))) {
        throw new Error('Broken link from ' + path + ' to ' + link);
      }
    }
  }
}
console.log('JavaScript syntax, IDs, internal routes, and anchors checked.');

