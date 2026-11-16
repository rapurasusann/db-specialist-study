'use strict';
// Local test-only static server: loopback only; no cloud configuration or writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let decoded;
  try { decoded = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + decoded, decoded.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end('Not found'); return;
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(8766, '127.0.0.1', () => console.log('CS02 test server: http://127.0.0.1:8766/'));
