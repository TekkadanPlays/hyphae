import { ClientBridge } from './server/bridge';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const PORT = 5173;
const PUBLIC_DIR = join(import.meta.dir, '..', 'public');

// Track active WebSocket bridges
const bridges = new Map<any, ClientBridge>();

// MIME types
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const HTML_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hyphae</title>
  <link rel="stylesheet" href="/public/assets/app.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="app"></div>
  <script src="/public/assets/index.js" type="module"></script>
</body>
</html>`;

export default {
  port: PORT,
  fetch(req: Request, server: any): Response | undefined {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // Static files
    if (url.pathname.startsWith('/public/')) {
      const filePath = join(PUBLIC_DIR, url.pathname.replace('/public/', ''));
      if (existsSync(filePath)) {
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const content = readFileSync(filePath);
        return new Response(content, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
        });
      }
      return new Response('Not found', { status: 404 });
    }

    // SPA shell for all other routes
    return new Response(HTML_SHELL, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
  websocket: {
    open(ws: any) {
      const bridge = new ClientBridge(ws);
      bridges.set(ws, bridge);
      console.log(`[WS] Client connected (${bridges.size} active)`);
    },
    message(ws: any, message: string | Buffer) {
      const bridge = bridges.get(ws);
      if (bridge) {
        bridge.handleMessage(typeof message === 'string' ? message : message.toString());
      }
    },
    close(ws: any) {
      const bridge = bridges.get(ws);
      if (bridge) {
        bridge.destroy();
        bridges.delete(ws);
      }
      console.log(`[WS] Client disconnected (${bridges.size} active)`);
    },
  },
};

console.log(`𓍊𓋼𓆏 Hyphae running at http://localhost:${PORT}`);
