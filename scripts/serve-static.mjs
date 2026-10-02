#!/usr/bin/env node
/* Serve a built directory (storybook-static) for the browser gates.
 *
 *   node scripts/serve-static.mjs [directory] [port]
 *
 * Python's `http.server` was used before and answers a Range request with the
 * whole file and a 200. A video served that way is not seekable, so setting
 * `currentTime` does nothing and a gate that seeks to a caption cue reads the
 * cue at 0:00 instead (the cue check failed five runs in five). Real hosting
 * answers ranges, and so does this. Node only, no dependencies.
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const ROOT = resolve(process.argv[2] ?? 'storybook-static');
const PORT = Number(process.argv[3] ?? 6006);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.vtt': 'text/vtt; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.wasm': 'application/wasm',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) { response.writeHead(403).end(); return; }
  let stat;
  try {
    stat = statSync(path);
    if (stat.isDirectory()) { path = join(path, 'index.html'); stat = statSync(path); }
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  const headers = {
    'content-type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');
  if (range && (range[1] !== '' || range[2] !== '')) {
    /* `bytes=start-end`, `bytes=start-` or `bytes=-suffix`. */
    const start = range[1] === '' ? Math.max(0, stat.size - Number(range[2])) : Number(range[1]);
    const end = range[1] === '' || range[2] === '' ? stat.size - 1 : Math.min(Number(range[2]), stat.size - 1);
    if (start > end || start >= stat.size) {
      response.writeHead(416, { 'content-range': `bytes */${stat.size}` }).end();
      return;
    }
    response.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${stat.size}`, 'content-length': end - start + 1 });
    if (request.method === 'HEAD') { response.end(); return; }
    createReadStream(path, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, { ...headers, 'content-length': stat.size });
  if (request.method === 'HEAD') { response.end(); return; }
  createReadStream(path).pipe(response);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}/`);
});
