// Тонкий клиент для онлайн-кооператива. Хост — авторитетная симуляция,
// гость — управляет вторым игроком и получает снапшоты мира.
const RELAY_URL = 'wss://zhmurki.80-242-61-200.sslip.io';

export class Net {
  constructor() { this.ws = null; this.role = null; this.code = null; this.onMsg = null; this.onPeer = null; this.onLeave = null; this.onErr = null; }
  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(RELAY_URL); this.ws = ws;
      const timeout = setTimeout(() => reject(new Error('Нет связи с сервером')), 7000);
      ws.onopen = () => { clearTimeout(timeout); resolve(); };
      ws.onerror = () => { clearTimeout(timeout); reject(new Error('Нет связи с сервером')); };
      ws.onmessage = ev => {
        let msg; try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.t === 'peer-joined') { this.onPeer && this.onPeer(); return; }
        if (msg.t === 'peer-left') { this.onLeave && this.onLeave(); return; }
        if (msg.t === 'err') { this.onErr && this.onErr(msg.msg); return; }
        this.onMsg && this.onMsg(msg);
      };
      ws.onclose = () => { this.onLeave && this.onLeave(); };
    });
  }
  async createRoom() {
    await this.connect(); this.role = 'host';
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Таймаут создания комнаты')), 7000);
      const prev = this.onMsg; this.onMsg = msg => { if (msg.t === 'created') { clearTimeout(timeout); this.code = msg.code; this.onMsg = prev; resolve(msg.code); } else prev && prev(msg); };
      this.ws.send(JSON.stringify({ t: 'create' }));
    });
  }
  async joinRoom(code) {
    await this.connect(); this.role = 'guest'; this.code = code;
    return new Promise((resolve, reject) => {
      const prevErr = this.onErr; this.onErr = m => { this.onErr = prevErr; reject(new Error(m)); };
      const prev = this.onMsg; this.onMsg = msg => { if (msg.t === 'joined') { this.onErr = prevErr; this.onMsg = prev; resolve(); } else prev && prev(msg); };
      this.ws.send(JSON.stringify({ t: 'join', code }));
    });
  }
  send(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }
  close() { try { this.ws && this.ws.close(); } catch { } }
}
