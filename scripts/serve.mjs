import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { pages, render } from '../src/render.mjs';
import { dist } from './build.mjs';
import { makeFallback } from './fallback.mjs';

const dev = process.argv.includes('--dev');
const port = Number(process.env.FORM_PORT ?? '4173');
const asset = /^\/assets\/([\w-]+\.(?:css|mjs|png))$/;
const type = { '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const fallback = dev ? makeFallback() : null;

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let path;
  try { path = new URL(request.url, 'http://localhost').pathname.replace(/\/+$/, '') || '/'; }
  catch { response.writeHead(400).end(); return; }
  const match = asset.exec(path);
  try {
    if (match) {
      const file = match[1];
      const content = dev
        ? (file === 'field.png' ? fallback : await readFile(new URL('../src/' + file, import.meta.url)))
        : await readFile(join(dist, 'assets', file));
      response.writeHead(200, { 'Content-Type': type[extname(file)], 'Cache-Control': 'no-cache' }).end(content);
      return;
    }
    const exists = pages.has(path);
    const body = dev ? render(path) : await readFile(exists ? join(dist, path, 'index.html') : join(dist, '404.html'));
    response.writeHead(exists ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }).end(body);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
});
server.listen(port, '127.0.0.1', () => console.log('Local http://127.0.0.1:' + port));

