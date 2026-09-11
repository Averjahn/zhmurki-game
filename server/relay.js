// Минимальный relay-сервер для онлайн-кооператива «Шашлык-шутер».
// Никакой игровой логики тут нет: хост (первый игрок) — авторитетная симуляция,
// сервер только сводит двух игроков в комнату и пересылает их сообщения друг другу.
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 4122;
const http = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('zhmurki relay ok'); });
const wss = new WebSocketServer({ server: http });

const rooms = new Map(); // code -> { host: ws|null, guest: ws|null }
const codeOf = new WeakMap(), roleOf = new WeakMap();

function genCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code; do { code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(''); } while (rooms.has(code));
  return code;
}
function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function peerOf(ws) {
  const code = codeOf.get(ws), role = roleOf.get(ws); const room = code && rooms.get(code);
  if (!room) return null; return role === 'host' ? room.guest : room.host;
}
function leaveRoom(ws) {
  const code = codeOf.get(ws), role = roleOf.get(ws); const room = code && rooms.get(code);
  if (!room) return;
  send(peerOf(ws), { t: 'peer-left' });
  if (role === 'host') room.host = null; else room.guest = null;
  if (!room.host && !room.guest) rooms.delete(code);
}

wss.on('connection', ws => {
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.t === 'create') {
      const code = genCode(); rooms.set(code, { host: ws, guest: null }); codeOf.set(ws, code); roleOf.set(ws, 'host');
      send(ws, { t: 'created', code }); return;
    }
    if (msg.t === 'join') {
      const code = String(msg.code || '').toUpperCase(); const room = rooms.get(code);
      if (!room || !room.host) { send(ws, { t: 'err', msg: 'Комната не найдена' }); return; }
      if (room.guest) { send(ws, { t: 'err', msg: 'Комната занята' }); return; }
      room.guest = ws; codeOf.set(ws, code); roleOf.set(ws, 'guest');
      send(ws, { t: 'joined', code }); send(room.host, { t: 'peer-joined' }); return;
    }
    const peer = peerOf(ws); if (peer) peer.send(raw.toString ? raw.toString() : raw);
  });
  ws.on('close', () => leaveRoom(ws));
  ws.on('error', () => leaveRoom(ws));
});

setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 20000);

http.listen(PORT, '127.0.0.1', () => console.log('zhmurki relay on', PORT));
