import * as THREE from 'three';
import * as P from './pix.js';
import { LEVELS } from './levels.js';
import { Net } from './net.js';

// ================= НАСТРОЙКИ =================
const W = 640, H = 360, VIEW_H = 12.5;
const CAM_OFF = new THREE.Vector3(20, 20, 20);
const FWD = new THREE.Vector3(-1, 0, -1).normalize(), RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const FORESHORT = 1 / Math.cos(Math.atan(1 / Math.SQRT2));
const WEAPON = { name: 'Шампур-ПМ', clip: 8, reserve: 40, fireRate: 0.28, reload: 1.2, speed: 13, range: 9.5 };
const levelIdx = Math.min(LEVELS.length - 1, parseInt(new URLSearchParams(location.search).get('level') || '0', 10) || 0);
const LEVEL = LEVELS[levelIdx]; const YARD = LEVEL.yard;
const SERYOGA_SPEC = { jacket: true, gun: true, hair: '#2a1e14' };
const SIMON_SPEC = { jacket: false, suit: '#2a3a4a', stripe: '#c0c8d0', gun: true, bald: true, hair: '#c9956a' };

// Типы противников. thr — сколько шашлыков до лёжки.
const ENEMY_TYPES = {
  sportik: { name: 'Чушпан', thr: 2, speed: 2.5, spec: { suit: '#8b1a1a', stripe: '#efe6d2', hair: '#2a1e14' }, lines: ['Дай откусить!', 'Я ж не ел с утра', 'Ты чё такой дерзкий?', 'Пахнет-то как…'] },
  hudoy: { name: 'Худой', thr: 1, speed: 3.4, spec: { suit: '#3a3a4a', stripe: '#9aa0b0', hair: '#111', thin: true, cap: true }, lines: ['Одного хватит…', 'Брат, поделись', 'Я быстро'] },
  byk: { name: 'Бык', thr: 3, speed: 1.9, spec: { suit: '#22232a', stripe: '#c0c0c8', hair: '#4a3a2a', big: true }, cover: true, lines: ['Не брат ты мне', 'Меня не накормишь', 'Сила в мясе'] },
  tolstyak: { name: 'Толстяк', thr: 4, speed: 1.4, w: 1.35, h: 1.8, spec: { suit: '#5a3a7a', stripe: '#e0d0f0', hair: '#3a2a1a', big: true }, stainsPer: 3, lines: ['Ещё порцию!', 'Я только разогрелся', 'Мало!'] },
  gopnik: { name: 'Гопник с семечками', thr: 2, speed: 2.3, spec: { suit: '#1a1a1a', stripe: '#d0d0d0', hair: '#111', cap: true, capColor: '#2a2a2a', seeds: true }, spit: true, lines: ['Семки есть?', 'Тьфу!', 'Чё смотришь?'] },
  tetka: { name: 'Тётка с авоськой', thr: 3, speed: 2.0, spec: { suit: '#6a3a5a', dress: true, scarf: true, hair: '#5a4a3a' }, steal: true, lines: ['Внукам отнесу', 'Куда столько мяса!', 'Ой, дай сюда'] },
  ment: { name: 'Мент', thr: 2, speed: 2.2, spec: { suit: '#3a4a6a', uniform: true, hair: '#222' }, takeAmmo: true, lines: ['Делиться надо', 'Документы на шашлык', 'Так, что тут у нас'] },
  boss: { name: 'Михалыч', thr: 8, speed: 1.6, w: 1.5, h: 2.2, spec: { suit: '#2a2a2a', stripe: '#8a8a8a', hair: '#8a8a8a', boss: true, big: true }, boss: true, stainsPer: 2, lines: ['Ну чё, накормил?', 'Я и не такое ел', 'Ты мне не брат'] },
};
const PLAYER_LINES = ['Всё в кетчупе, всё в кетчупе…', 'Не брат ты мне!', 'Ешь, не обляпайся', 'Кто не ел — тот не жил', 'Сейчас накормлю'];

// ================= СЦЕНА =================
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const scene = new THREE.Scene(); scene.background = new THREE.Color(LEVEL.sky);
const aspect = W / H;
const camera = new THREE.OrthographicCamera(-VIEW_H * aspect / 2, VIEW_H * aspect / 2, VIEW_H / 2, -VIEW_H / 2, -60, 120);
const camTarget = LEVEL.playerStart.clone(); camera.position.copy(camTarget).add(CAM_OFF); camera.lookAt(camTarget);
const camYaw = Math.PI / 4;
scene.add(new THREE.AmbientLight('#7a7a8a', LEVEL.ambient));
scene.add(new THREE.HemisphereLight('#4a4a60', '#2a2018', 0.6));
const moon = new THREE.DirectionalLight('#8a90b0', 0.35); moon.position.set(-5, 10, 3); scene.add(moon);

const T = {
  ground: P.tex(P.groundTex(LEVEL.ground), [10, 10]), wood: P.tex(P.woodTex()), metal: P.tex(P.metalTex()), metalBlue: P.tex(P.metalTex(8, [52, 62, 78])),
  corr: P.tex(P.corrugatedTex()), brick: P.tex(P.brickTex()), puddle: P.tex(P.puddleCanvas(32, 1)), puddle2: P.tex(P.puddleCanvas(32, 5)), roof: P.tex(P.roofTex()), bed: P.tex(P.bedTex()),
  shadow: P.tex(P.shadowCanvas()), skewer: P.tex(P.skewerCanvas()), steam: P.tex(P.steamCanvas()), fire: P.tex(P.fireCanvas()), drop: P.tex(P.dropCanvas()), arrow: P.tex(P.arrowCanvas()),
  shell: P.tex(P.shellCanvas()), smoke: P.tex(P.smokeCanvas()),
};
const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshLambertMaterial({ map: T.ground })); ground.rotation.x = -Math.PI / 2; scene.add(ground);

// ---- примитивы уровня (детерминированы: одинаковы у хоста и гостя)
const obstacles = [], smokeSources = [];
const lam = (map, color = '#ffffff') => new THREE.MeshLambertMaterial({ map, color });
const M = { wood: lam(T.wood), metal: lam(T.metal), corr: lam(T.corr), brick: lam(T.brick), dark: new THREE.MeshLambertMaterial({ color: '#222' }) };
function box(w, h, d, x, z, mats, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); m.position.set(x, h / 2 + (opts.y || 0), z); scene.add(m);
  if (!opts.noCollide) obstacles.push({ x, z, hw: w / 2 + 0.05, hd: d / 2 + 0.05 }); return m;
}
function decal(map, x, z, size, y = 0.01, rot = Math.random() * 6.28) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, y, z); m.renderOrder = 1; scene.add(m); return m;
}
function mkBillboard(map, w, h, lit = true) {
  const g = new THREE.PlaneGeometry(w, h * FORESHORT); g.translate(0, h * FORESHORT / 2, 0);
  const mat = lit ? new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }) : new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, mat); m.rotation.y = camYaw; return m;
}
const ctx = {
  box, decal, lam, m: M, T,
  barrel(x, z) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8), [M.metal, M.dark, M.dark]); b.position.set(x, 0.6, z); scene.add(b); obstacles.push({ x, z, hw: 0.55, hd: 0.55 }); },
  mangal(x, z) {
    const [mc, mx] = P.mkCanvas(32, 16); P.drawMangalTop(mx);
    box(1.6, 0.8, 0.8, x, z, [M.dark, M.dark, lam(P.tex(mc)), M.dark, M.dark, M.dark]);
    const fire = new THREE.PointLight('#ff8a30', 2.6, 11, 1.5); fire.position.set(x, 1.4, z); scene.add(fire);
    const fl = mkBillboard(T.fire, 0.6, 0.6); fl.position.set(x, 0.8, z); scene.add(fl); fl.userData.flicker = true; smokeSources.push(new THREE.Vector3(x, 1.0, z));
  },
  lamp(x, z) { box(0.25, 5, 0.25, x, z, M.dark, { noCollide: true }); const l = new THREE.PointLight('#ffd890', 1.6, 12, 1.4); l.position.set(x, 4.6, z); scene.add(l); },
  stall(x, z, color) { box(4, 1.0, 1.4, x, z, M.wood); box(4.4, 0.3, 1.8, x, z, lam(P.tex(P.awningTex(color))), { y: 2.2, noCollide: true }); box(0.15, 2.2, 0.15, x - 2, z + 0.8, M.dark, { noCollide: true }); box(0.15, 2.2, 0.15, x + 2, z + 0.8, M.dark, { noCollide: true }); },
  tree(x, z) { box(0.5, 2.2, 0.5, x, z, lam(T.wood, '#8a7a60')); const c = new THREE.Mesh(new THREE.SphereGeometry(1.6, 6, 5), new THREE.MeshLambertMaterial({ color: '#2e4a1c', flatShading: true })); c.position.set(x, 3.0, z); scene.add(c); },
};
LEVEL.build(ctx);
for (let i = 0; i < 6; i++) decal(i % 2 ? T.puddle : T.puddle2, (Math.random() - .5) * 26, (Math.random() - .5) * 20, 1.2 + Math.random(), 0.005);

// ================= HUD =================
const $ = id => document.getElementById(id);
const hud = { hp: $('hpbar'), ammo: $('ammo'), say: $('sayline'), hint: $('hint'), banner: $('banner'), t1: $('t1'), t1c: $('t1c'), t2: $('t2'), bubbles: $('bubbles'), blind: $('blind'), reload: $('reloadbar'), lvl: $('lvlname'), netBadge: $('netBadge') };
P.drawPortrait($('p1').getContext('2d'), { hair: '#2a1e14' }); P.drawPortrait($('p2').getContext('2d'), { bald: true }); P.drawWeaponIcon($('wicon').getContext('2d'));
hud.lvl.textContent = `Уровень ${levelIdx + 1}: ${LEVEL.name}`;
let bannerTimer = 0;
function banner(text, t = 2.2) { hud.banner.textContent = text; hud.banner.style.opacity = 1; bannerTimer = t; }
function say(text) { hud.say.textContent = text; }
function worldToScreen(v) { const p = v.clone().project(camera); const r = canvas.getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; }

// ================= СЕТЬ (онлайн-кооп) =================
// Хост — авторитетная симуляция (враги/волны/попадания/мангал у каждого свой личный
// кулдаун, поэтому синхронизировать его не нужно). Гость — тонкий клиент: свой
// персонаж двигает и целится сам, шлёт хосту трансформ и события выстрела,
// а врагов/снаряды/еду видит только через снапшоты хоста.
let net = null, netRole = 'solo'; // 'solo' | 'host' | 'guest'
let mate = null; // визуальный «второй игрок», без физики
let idSeq = 1;
const mirrorEnemies = new Map(), mirrorProj = new Map(), mirrorFood = new Map();
let guestBlindPulse = false, guestHurtPulse = false;

function ensureMate() {
  if (mate) return mate;
  mate = new Character(netRole === 'guest' ? SERYOGA_SPEC : SIMON_SPEC, 1.0, 1.7);
  mate.pos.copy(LEVEL.playerStart).add(new THREE.Vector3(1.3, 0, 0.3)); mate.opts = {}; mate.redraw();
  return mate;
}
function applyRemoteTransform(ch, d) {
  if (!d) return; ch.pos.set(d.x, 0, d.z); ch.flip = d.flip; ch.tilt = d.tilt || 0;
  if (ch.frame !== d.frame || ch.pose !== d.pose) { ch.frame = d.frame; ch.pose = d.pose; ch.redraw(); }
  ch.sync();
}
function netBadgeUpdate(code) { hud.netBadge.textContent = `ОНЛАЙН · комната ${code}` + (netRole === 'host' ? ' · ты хост' : ' · ты гость'); hud.netBadge.classList.add('on'); }

// ================= СУЩНОСТИ =================
const enemies = [], projectiles = [], particles = [], groundFood = [], puddles = [], shells = [];
let exitMarker = null;

class Character {
  constructor(spec, w = 1.0, h = 1.7) {
    this.spec = spec; this.w = w; this.h = h;
    [this.cv, this.cx] = P.mkCanvas(24, 40); this.map = P.tex(this.cv);
    this.mesh = mkBillboard(this.map, w, h); scene.add(this.mesh);
    this.shadow = decal(T.shadow, 0, 0, w * 1.1, 0.012, 0);
    this.pos = this.mesh.position; this.frame = 0; this.animT = 0; this.stains = []; this.flip = 1; this.opts = {}; this.pose = 'walk'; this.poseT = 0; this.tilt = 0;
    this.redraw();
  }
  redraw() { P.drawChar(this.cx, this.spec, this.frame, { ...this.opts, pose: this.pose, tilt: this.tilt, stains: this.stains }); this.map.needsUpdate = true; }
  setPose(pose, t) { this.pose = pose; this.poseT = t; this.frame = 0; this.animT = 0; this.redraw(); }
  animate(dt, moving) {
    if (this.poseT > 0) { this.poseT -= dt; if (this.poseT <= 0) { this.pose = 'walk'; this.tilt = 0; } }
    const rate = this.pose === 'eat' ? 0.12 : (this.pose === 'stumble' || this.pose === 'rise') ? 0.1 : 0.13;
    if (this.pose === 'walk' && !moving) { if (this.frame !== 0) { this.frame = 0; this.redraw(); } return; }
    this.animT += dt; if (this.animT > rate) { this.animT = 0; this.frame = (this.frame + 1) % 4; if (this.pose === 'stumble') this.tilt = Math.max(-1.2, Math.min(1.2, this.tilt + 0.3 * this.stumbleDir)); if (this.pose === 'rise') this.tilt *= 0.5; this.redraw(); }
  }
  sync() { this.mesh.scale.x = this.flip; this.shadow.position.set(this.pos.x, 0.012, this.pos.z); }
  dispose() { scene.remove(this.mesh); scene.remove(this.shadow); }
}

// ---- игрок (я сам — Серёга, если хост/соло; Саймон, если гость)
const player = new Character(SERYOGA_SPEC);
player.pos.copy(LEVEL.playerStart); player.hp = 100; player.clip = WEAPON.clip; player.reserve = WEAPON.reserve;
player.reloadT = 0; player.fireT = 0; player.mangalCd = 0; player.hurtT = 0; player.blindT = 0; player.redraw();
let sharedHp = 100; // общее здоровье на двоих — как в HUD с одной шкалой на двух героев

// ---- враги (только на симулирующей стороне: хост или соло)
function spawnEnemy(type, at) {
  const def = ENEMY_TYPES[type]; const e = new Character(def.spec, def.w || (def.spec.big ? 1.15 : def.spec.thin ? 0.85 : 1.0), def.h || (def.spec.big ? 1.85 : 1.7));
  Object.assign(e, { id: idSeq++, type, def, fed: 0, thr: def.thr, state: 'hungry', speedMul: 1, biteT: 0, lieT: 0, coverT: Math.random() * 3, cover: false, spitT: 2 + Math.random() * 2, idleT: Math.random(), talkT: 1 + Math.random() * 4, lying: null, lastBubble: '', lastBubbleT: 0 });
  e.pos.copy(at).add(new THREE.Vector3((Math.random() - .5), 0, (Math.random() - .5)));
  e.opts = { mouth: true }; e.redraw(); enemies.push(e); bubble(e, def.lines[Math.floor(Math.random() * def.lines.length)]);
  if (def.boss) { banner('МИХАЛЫЧ ПРИШЁЛ', 2.5); say('Этого так просто не накормишь.'); }
  return e;
}
function feed(e, from) {
  if (e.state !== 'hungry') return false;
  e.fed++; const n = e.def.stainsPer || (Math.random() < 0.5 ? 2 : 1); for (let i = 0; i < n; i++) e.stains.push(P.randomStain());
  splat(from || e.pos.clone().setY(1.2), 8);
  e.setPose('eat', 0.6);
  if (e.fed >= e.thr) { e.state = 'falling'; e.stumbleDir = Math.random() < .5 ? -1 : 1; e.setPose('stumble', 0.45); e.fallT = 0.45; return true; }
  if (e.def.boss && e.fed % 2 === 0) { e.state = 'falling'; e.stumbleDir = 1; e.setPose('stumble', 0.45); e.fallT = 0.45; e.shortLie = 4; bubble(e, 'Ай… секундочку'); return true; }
  e.speedMul = e.fed === 1 ? 0.55 + Math.random() * 0.25 : Math.max(0.25, 0.5 - e.fed * 0.08);
  if (e.fed >= 2) e.opts.belly = true;
  e.redraw(); bubble(e, ['Ммм…', 'Ещё!', 'Ой, живот…', 'Кетчуп на костюм!'][Math.floor(Math.random() * 4)]);
  return true;
}
function lieDown(e) {
  e.state = 'lying'; e.lieT = e.shortLie || (18 + Math.random() * 8); e.mesh.visible = false; e.shadow.visible = false; e.breath = 0;
  const [lc, lx] = P.mkCanvas(40, 24); P.drawLying(lx, e.spec, { stains: e.stains });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(e.h, e.w * 0.9), new THREE.MeshLambertMaterial({ map: P.tex(lc), transparent: true, alphaTest: 0.4 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.position.set(e.pos.x, 0.03, e.pos.z); m.renderOrder = 2; scene.add(m); e.lying = m;
  if (!e.puddle) { e.puddle = decal(Math.random() < .5 ? T.puddle : T.puddle2, e.pos.x, e.pos.z, e.w * 2, 0.015); puddles.push(e.puddle); }
  bubble(e, e.shortLie ? 'Щас встану…' : ['Всё… объелся', 'Не могу больше…', 'Синдром переедания…'][Math.floor(Math.random() * 3)]);
  if (!e.shortLie && Math.random() < .5) say(PLAYER_LINES[Math.floor(Math.random() * PLAYER_LINES.length)]);
}
function standUp(e) {
  scene.remove(e.lying); e.lying = null; e.mesh.visible = true; e.shadow.visible = true;
  if (e.shortLie) { e.shortLie = 0; e.state = 'hungry'; e.def = { ...e.def, speed: e.def.speed * 1.15 }; e.opts = { mouth: true, belly: true }; e.tilt = 0.9; e.setPose('rise', 0.4); bubble(e, 'Ещё давай!'); return; }
  e.state = 'leaving'; e.opts = { mouth: false, belly: true }; e.tilt = 0.9; e.setPose('rise', 0.4); e.speedMul = 0.5;
  let best = null, bd = 1e9; for (const s of LEVEL.spawns) { const d = s.distanceTo(e.pos); if (d < bd) { bd = d; best = s; } } e.exitTo = best;
  bubble(e, ['Пойду полежу дома', 'Наелся, уходим', 'Больше не хочу'][Math.floor(Math.random() * 3)]);
}

// ---- снаряды / еда на земле / частицы
function shoot(dir, from) {
  const origin = (from || player.pos).clone().add(new THREE.Vector3(0, 1.0, 0)).addScaledVector(dir, 0.5);
  const m = mkBillboard(T.skewer, 0.45, 0.45, false); m.position.copy(origin); scene.add(m);
  projectiles.push({ id: idSeq++, mesh: m, dir, dist: 0, rot: 0 });
  const fl = mkBillboard(T.steam, 0.5, 0.5, false); fl.position.copy(origin).addScaledVector(dir, 0.2); scene.add(fl); particles.push({ mesh: fl, life: 0.18, max: 0.18, vel: new THREE.Vector3(0, 0.8, 0), grow: true });
}
function spit(e, targetPos) {
  const dir = tmp.copy(targetPos).sub(e.pos).setY(0).normalize().clone();
  const m = mkBillboard(T.shell, 0.18, 0.18, false); m.position.copy(e.pos).setY(1.1); scene.add(m); shells.push({ mesh: m, dir, dist: 0 });
  e.setPose('eat', 0.3); bubble(e, 'Тьфу!');
}
function dropFood(pos) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), new THREE.MeshLambertMaterial({ map: T.skewer, transparent: true, alphaTest: 0.3 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.position.set(pos.x, 0.03, pos.z); m.renderOrder = 2; scene.add(m); groundFood.push({ id: idSeq++, mesh: m, life: 25 });
}
function splat(pos, n) {
  for (let i = 0; i < n; i++) { const m = mkBillboard(T.drop, 0.14, 0.14, false); m.position.copy(pos); scene.add(m); particles.push({ mesh: m, life: 1.5, vel: new THREE.Vector3((Math.random() - .5) * 4, 1.5 + Math.random() * 2.5, (Math.random() - .5) * 4), drop: true }); }
}
function smoke(src) { const m = mkBillboard(T.smoke, 0.35, 0.35, false); m.position.copy(src); scene.add(m); particles.push({ mesh: m, life: 1.6, max: 1.6, vel: new THREE.Vector3((Math.random() - .5) * 0.3, 0.9, (Math.random() - .5) * 0.3), grow: true }); }
const bubbleEls = new Map();
function bubble(e, text) { let el = bubbleEls.get(e); if (!el) { el = document.createElement('div'); el.className = 'bubble'; hud.bubbles.appendChild(el); bubbleEls.set(e, el); } el.textContent = text; el.dataset.t = 2.2; e.lastBubble = text; e.lastBubbleT = performance.now(); }

// ================= ВВОД (локальный — управляет ТОЛЬКО моим персонажем) =================
const keys = {}; let mouseDown = false; const mouseNdc = new THREE.Vector2(0, 0);
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyR') reload(); if (e.code === 'KeyE') useMangal(); });
addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
addEventListener('mouseup', () => mouseDown = false);
addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mouseNdc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), aimPoint = new THREE.Vector3();
function reload() { if (player.reloadT > 0 || player.clip === WEAPON.clip || player.reserve <= 0) return; player.reloadT = WEAPON.reload; say('Нанизываю…'); }
function useMangal() {
  // мангал общий, но у каждого игрока свой личный кулдаун «когда я в последний раз нанизывал» — сетевого согласования не нужно
  if (player.pos.distanceTo(LEVEL.mangal) > 2.2) return;
  if (player.mangalCd > 0) { say('Мясо ещё жарится'); return; }
  player.reserve = WEAPON.reserve; player.mangalCd = 15; say('Запас пополнен. Всё в кетчупе.'); updateAmmo();
}
function updateAmmo() { hud.ammo.textContent = `${player.clip}/${player.reserve}`; }

// ================= ФИЗИКА =================
function collide(pos, r) {
  for (const o of obstacles) {
    const dx = pos.x - Math.max(o.x - o.hw, Math.min(pos.x, o.x + o.hw)), dz = pos.z - Math.max(o.z - o.hd, Math.min(pos.z, o.z + o.hd));
    const d2 = dx * dx + dz * dz; if (d2 < r * r && d2 > 1e-6) { const d = Math.sqrt(d2); pos.x += dx / d * (r - d); pos.z += dz / d * (r - d); } else if (d2 <= 1e-6) pos.x += r;
  }
  pos.x = Math.max(YARD.minX, Math.min(YARD.maxX, pos.x)); pos.z = Math.max(YARD.minZ, Math.min(YARD.maxZ, pos.z));
}
function blocked(pos) { for (const o of obstacles) if (Math.abs(pos.x - o.x) < o.hw && Math.abs(pos.z - o.z) < o.hd) return true; return false; }

// ================= ВОЛНЫ (только у симулирующей стороны) =================
const wave = { idx: 0, spawnI: 0, t: 1.5, pause: 0, cleared: false };
let levelDone = false, gameOver = false, started = false, waveCounted = 0, totalEnemies = LEVEL.waves.reduce((a, w) => a + w.list.length, 0);
function updateWave(dt) {
  if (wave.cleared) return;
  const wv = LEVEL.waves[wave.idx];
  if (wave.pause > 0) { wave.pause -= dt; if (wave.pause <= 0) { banner(wv.name); say(wave.idx === LEVEL.waves.length - 1 ? 'Последние. Держись.' : 'Ещё идут.'); } }
  else if (wave.spawnI < wv.list.length) { wave.t -= dt; if (wave.t <= 0) { wave.t = wv.interval; spawnEnemy(wv.list[wave.spawnI], LEVEL.spawns[(wave.spawnI + wave.idx) % LEVEL.spawns.length]); wave.spawnI++; } }
  else if (enemies.length === 0) {
    if (wave.idx < LEVEL.waves.length - 1) { wave.idx++; wave.spawnI = 0; wave.t = 1.5; wave.pause = 5; banner('ВОЛНА ОТБИТА', 2); say('Передышка. Сходи к мангалу.'); }
    else { wave.cleared = true; hud.t1.classList.add('done'); banner('ЧУШПАНЫ НАКОРМЛЕНЫ', 2.5); say('Всё. Уходим с района.'); exitMarker = mkBillboard(T.arrow, 1, 1, false); exitMarker.position.copy(LEVEL.exit).setY(1.2); scene.add(exitMarker); }
  }
  hud.t1c.textContent = `(${waveCounted}/${totalEnemies})`;
}

// ================= ЦИКЛ =================
let last = performance.now(); const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(); let smokeT = 0, netT = 0, terminalSent = false;
function loop(now) {
  if (document.hidden) setTimeout(() => loop(performance.now()), 16); else requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try {
    if (started && !gameOver && !levelDone) { if (netRole === 'guest') updateGuest(dt); else updateSim(dt); }
    render(dt);
  } catch (err) { if (!window.__err) { window.__err = String(err.stack || err); console.error(err); } }
}

// ---- локальное движение «моего» персонажа: общее и для хоста/соло, и для гостя
function stepLocalPlayer(dt) {
  const mv = new THREE.Vector3();
  if (keys.KeyW || keys.ArrowUp) mv.add(FWD); if (keys.KeyS || keys.ArrowDown) mv.sub(FWD); if (keys.KeyD || keys.ArrowRight) mv.add(RIGHT); if (keys.KeyA || keys.ArrowLeft) mv.sub(RIGHT);
  const moving = mv.lengthSq() > 0; if (moving) { mv.normalize().multiplyScalar((player.blindT > 0 ? 2.2 : 4.2) * dt); player.pos.add(mv); collide(player.pos, 0.35); }
  player.animate(dt, moving);
  ray.setFromCamera(mouseNdc, camera); ray.ray.intersectPlane(groundPlane, aimPoint);
  const aimDir = tmp.copy(aimPoint).sub(player.pos).setY(0); if (aimDir.lengthSq() > 0.01) { aimDir.normalize(); player.flip = aimDir.dot(RIGHT) < 0 ? -1 : 1; }
  player.fireT -= dt; player.mangalCd -= dt; player.hurtT -= dt; player.blindT -= dt;
  let firedDir = null;
  if (player.reloadT > 0) { player.reloadT -= dt; if (player.reloadT <= 0) { const n = Math.min(WEAPON.clip - player.clip, player.reserve); player.clip += n; player.reserve -= n; updateAmmo(); } }
  else if (mouseDown && player.fireT <= 0) {
    if (player.clip > 0) { player.clip--; player.fireT = WEAPON.fireRate; firedDir = aimDir.clone(); updateAmmo(); if (player.clip === 0) reload(); }
    else { player.fireT = 0.3; if (player.reserve <= 0) say('Мясо кончилось. К мангалу (E)!'); else reload(); }
  }
  hud.hint.style.display = player.pos.distanceTo(LEVEL.mangal) < 2.2 ? 'block' : 'none';
  hud.hint.textContent = player.mangalCd > 0 ? `Мангал: мясо жарится (${Math.ceil(player.mangalCd)} с)` : 'E — взять шашлык с мангала';
  player.sync();
  return firedDir;
}

// ---- ХОСТ / СОЛО: полная авторитетная симуляция
function updateSim(dt) {
  const firedDir = stepLocalPlayer(dt);
  if (firedDir) shoot(firedDir, player.pos);
  if (netRole === 'host') { if (mate) mate.sync(); }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; const step = WEAPON.speed * dt; p.mesh.position.addScaledVector(p.dir, step); p.dist += step; p.rot += dt * 14; p.mesh.rotation.z = p.rot;
    let hit = false;
    for (const e of enemies) {
      if (e.state !== 'hungry') continue;
      if (tmp2.copy(e.pos).sub(p.mesh.position).setY(0).length() < e.w * 0.45) {
        if (e.cover) { e.stains.push(P.randomStain()); e.redraw(); splat(p.mesh.position, 4); bubble(e, 'Не открою!'); } else feed(e, p.mesh.position.clone());
        hit = true; break;
      }
    }
    if (hit || p.dist > WEAPON.range || blocked(p.mesh.position)) { scene.remove(p.mesh); projectiles.splice(i, 1); if (!hit) { const g = p.mesh.position.clone(); if (blocked(g)) g.addScaledVector(p.dir, -0.5); dropFood(g); } }
  }
  const targets = mate ? [player, mate] : [player];
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.mesh.position.addScaledVector(s.dir, 9 * dt); s.dist += 9 * dt; s.mesh.rotation.z += dt * 20;
    let hitT = null;
    for (const t of targets) if (tmp2.copy(t.pos).sub(s.mesh.position).setY(0).length() < 0.5) { hitT = t; break; }
    if (hitT) { hitT.blindT = 1.5; if (hitT === player) say('Шелуха в глаза!'); else guestBlindPulse = true; scene.remove(s.mesh); shells.splice(i, 1); }
    else if (s.dist > 8 || blocked(s.mesh.position)) { scene.remove(s.mesh); shells.splice(i, 1); }
  }
  for (let i = groundFood.length - 1; i >= 0; i--) { const f = groundFood[i]; f.life -= dt; if (f.life <= 0) { scene.remove(f.mesh); groundFood.splice(i, 1); } }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.state === 'falling') { e.fallT -= dt; e.animate(dt, true); e.sync(); if (e.fallT <= 0) lieDown(e); continue; }
    if (e.state === 'lying') { e.lieT -= dt; e.breath += dt; e.lying.scale.set(1, 1 + Math.sin(e.breath * 4) * 0.04, 1); if (e.lieT <= 0) standUp(e); continue; }
    let target = null, eating = false;
    if (e.state === 'hungry') {
      if (e.def.cover) { e.coverT -= dt; if (e.coverT <= 0) { e.cover = !e.cover; e.coverT = e.cover ? 1.2 : 2.2; e.opts = { mouth: !e.cover, cover: e.cover, belly: e.fed >= 2 }; e.redraw(); } }
      else if (e.pose === 'walk') { e.idleT -= dt; if (e.idleT <= 0) { e.idleT = 0.35 + Math.random() * 0.4; e.opts.mouth = !e.opts.mouth; e.redraw(); } }
      const seek = e.def.steal ? 12 : 6; let best = null, bd = seek; for (const f of groundFood) { const d = f.mesh.position.distanceTo(e.pos); if (d < bd) { bd = d; best = f; } }
      let nearest = player; let nd = e.pos.distanceTo(player.pos); if (mate) { const md = e.pos.distanceTo(mate.pos); if (md < nd) { nearest = mate; nd = md; } }
      if (best) { target = best.mesh.position; if (bd < 0.6) { scene.remove(best.mesh); groundFood.splice(groundFood.indexOf(best), 1); if (e.def.steal) { e.setPose('eat', 0.4); bubble(e, 'В авоську!'); } else feed(e); eating = true; } }
      else target = nearest.pos;
      if (e.def.spit) { e.spitT -= dt; const d = e.pos.distanceTo(nearest.pos); if (e.spitT <= 0 && d > 2.5 && d < 7) { e.spitT = 3.2; spit(e, nearest.pos); } }
      e.talkT -= dt; if (e.talkT <= 0) { e.talkT = 5 + Math.random() * 6; bubble(e, e.def.lines[Math.floor(Math.random() * e.def.lines.length)]); }
      e._target = target === best?.mesh.position ? null : nearest;
    } else target = e.exitTo;
    if (e.state === 'leaving' && e.pos.distanceTo(e.exitTo) < 1.2) { e.dispose(); bubbleEls.get(e)?.remove(); bubbleEls.delete(e); enemies.splice(i, 1); waveCounted++; continue; }
    if (eating || e.pose === 'eat') { e.animate(dt, true); e.sync(); continue; }
    const dir = tmp.copy(target).sub(e.pos).setY(0); const dist = dir.length();
    const chasing = e.state === 'hungry' && e._target; const stopAt = chasing ? 0.85 : 0.2; let moved = false;
    if (dist > stopAt) {
      dir.normalize();
      for (const o of enemies) if (o !== e && o.state === e.state) { const d = tmp2.copy(e.pos).sub(o.pos).setY(0); const l = d.length(); if (l < 0.8 && l > 0) dir.addScaledVector(d.normalize(), (0.8 - l) * 2); }
      dir.normalize(); e.pos.addScaledVector(dir, e.def.speed * e.speedMul * dt); collide(e.pos, e.w * 0.35); moved = true; e.flip = dir.dot(RIGHT) < 0 ? -1 : 1;
    } else if (chasing) {
      e.biteT -= dt;
      if (e.biteT <= 0) {
        e.biteT = 0.9; e.setPose('eat', 0.3); const t = e._target;
        if (e.def.takeAmmo && t.reserve > 0) { t.reserve = Math.max(0, t.reserve - 3); if (t === player) updateAmmo(); say(t === player ? 'Мент забрал мясо!' : 'Мент обчистил Саймона!'); }
        else { sharedHp -= e.def.boss ? 12 : 7; t.hurtT = 0.2; if (t !== player) guestHurtPulse = true; hud.hp.style.width = Math.max(0, sharedHp) + '%'; splat(t.pos.clone().setY(1.2), 3); say(['Отвали!', 'Куда лезешь?!', 'Не брат ты мне!'][Math.floor(Math.random() * 3)]); if (sharedHp <= 0) { endGame(false); } }
      }
    }
    e.animate(dt, moved); e.sync();
  }
  if (exitMarker) { exitMarker.position.y = 1.2 + Math.sin(performance.now() / 200) * 0.15; if (player.pos.distanceTo(LEVEL.exit) < 1.5) { hud.t2.classList.add('done'); endGame(true); } }
  updateWave(dt);
  smokeT -= dt; if (smokeT <= 0) { smokeT = 0.35; smokeSources.forEach(smoke); }
  camTarget.lerp(new THREE.Vector3(Math.max(YARD.minX + 6, Math.min(YARD.maxX - 6, player.pos.x)), 0, Math.max(YARD.minZ + 4, Math.min(YARD.maxZ - 4, player.pos.z))), 0.08);
  camera.position.copy(camTarget).add(CAM_OFF); camera.lookAt(camTarget);

  if (netRole === 'host' && net) {
    // финальный снапшот (победа/поражение) шлём немедленно, не дожидаясь такта throttle —
    // иначе гость может никогда не узнать, что игра закончилась
    const terminal = gameOver || levelDone;
    netT -= dt; if (netT <= 0 || (terminal && !terminalSent)) { netT = 1 / 18; broadcastSnapshot(); if (terminal) terminalSent = true; }
  }
}
function broadcastSnapshot() {
  net.send({
    t: 'snap',
    p1: { x: player.pos.x, z: player.pos.z, flip: player.flip, frame: player.frame, pose: player.pose, tilt: player.tilt },
    hp: sharedHp,
    counted: hud.t1c.textContent, t1done: hud.t1.classList.contains('done'), t2done: hud.t2.classList.contains('done'),
    banner: { on: hud.banner.style.opacity !== '0' && hud.banner.style.opacity !== '', text: hud.banner.textContent },
    say: hud.say.textContent,
    exit: !!exitMarker,
    gameOver: gameOver ? 'lose' : (levelDone ? 'win' : null),
    blindHit: guestBlindPulse, hurtHit: guestHurtPulse,
    enemies: enemies.map(e => ({ id: e.id, type: e.type, x: e.pos.x, z: e.pos.z, flip: e.flip, frame: e.frame, pose: e.pose, tilt: e.tilt, state: e.state, stains: e.stains.length, msg: (performance.now() - e.lastBubbleT < 2200) ? e.lastBubble : null })),
    proj: projectiles.map(p => ({ id: p.id, x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z, rot: p.rot })),
    food: groundFood.map(f => ({ id: f.id, x: f.mesh.position.x, z: f.mesh.position.z })),
  });
  guestBlindPulse = false; guestHurtPulse = false;
}

// ---- ГОСТЬ: только моё движение + рендер зеркала мира по снапшотам
let lastSnap = null, netSendT = 0;
function updateGuest(dt) {
  const firedDir = stepLocalPlayer(dt);
  if (firedDir && net) net.send({ t: 'shoot', x: player.pos.x, z: player.pos.z, dx: firedDir.x, dz: firedDir.z });
  netSendT -= dt; if (netSendT <= 0 && net) { netSendT = 1 / 18; net.send({ t: 'p2', x: player.pos.x, z: player.pos.z, flip: player.flip, frame: player.frame, pose: player.pose, tilt: player.tilt }); }

  if (lastSnap) {
    ensureMate(); applyRemoteTransform(mate, lastSnap.p1);
    sharedHp = lastSnap.hp; hud.hp.style.width = Math.max(0, sharedHp) + '%';
    hud.t1c.textContent = lastSnap.counted; if (lastSnap.t1done) hud.t1.classList.add('done'); if (lastSnap.t2done) hud.t2.classList.add('done');
    hud.banner.style.opacity = lastSnap.banner.on ? 1 : 0; if (lastSnap.banner.on) hud.banner.textContent = lastSnap.banner.text;
    if (lastSnap.say) say(lastSnap.say);
    if (lastSnap.blindHit) player.blindT = 1.5;
    if (lastSnap.hurtHit) player.hurtT = 0.2;
    if (lastSnap.exit && !exitMarker) { exitMarker = mkBillboard(T.arrow, 1, 1, false); exitMarker.position.copy(LEVEL.exit).setY(1.2); scene.add(exitMarker); }
    if (lastSnap.exit) exitMarker.position.y = 1.2 + Math.sin(performance.now() / 200) * 0.15;
    if (lastSnap.gameOver === 'win') endGame(true); else if (lastSnap.gameOver === 'lose') endGame(false);

    const seenE = new Set();
    for (const rec of lastSnap.enemies) {
      seenE.add(rec.id); let m = mirrorEnemies.get(rec.id);
      if (!m) { const def = ENEMY_TYPES[rec.type]; m = new Character(def.spec, def.w || (def.spec.big ? 1.15 : def.spec.thin ? 0.85 : 1.0), def.h || (def.spec.big ? 1.85 : 1.7)); m.stains = []; mirrorEnemies.set(rec.id, m); }
      const wasLying = m._lying; const nowLying = rec.state === 'lying';
      while (m.stains.length < rec.stains) m.stains.push(P.randomStain());
      if (nowLying && !wasLying) {
        m.mesh.visible = false; m.shadow.visible = false;
        const [lc, lx] = P.mkCanvas(40, 24); P.drawLying(lx, m.spec, { stains: m.stains });
        const lm = new THREE.Mesh(new THREE.PlaneGeometry(m.h, m.w * 0.9), new THREE.MeshLambertMaterial({ map: P.tex(lc), transparent: true, alphaTest: 0.4 }));
        lm.rotation.x = -Math.PI / 2; lm.rotation.z = Math.random() * 6.28; lm.position.set(rec.x, 0.03, rec.z); lm.renderOrder = 2; scene.add(lm); m._lyingMesh = lm; m._lying = true;
      } else if (!nowLying && wasLying) { scene.remove(m._lyingMesh); m._lyingMesh = null; m._lying = false; m.mesh.visible = true; m.shadow.visible = true; m.redraw(); }
      if (nowLying) { m.pos.set(rec.x, 0, rec.z); m._lyingMesh.position.set(rec.x, 0.03, rec.z); }
      else { applyRemoteTransform(m, rec); }
      if (rec.msg && rec.msg !== m.lastBubble) bubble(m, rec.msg);
    }
    for (const [id, m] of mirrorEnemies) if (!seenE.has(id)) { m.dispose(); if (m._lyingMesh) scene.remove(m._lyingMesh); bubbleEls.get(m)?.remove(); bubbleEls.delete(m); mirrorEnemies.delete(id); }

    const seenP = new Set();
    for (const rec of lastSnap.proj) { seenP.add(rec.id); let m = mirrorProj.get(rec.id); if (!m) { m = mkBillboard(T.skewer, 0.45, 0.45, false); scene.add(m); mirrorProj.set(rec.id, m); } m.position.set(rec.x, rec.y, rec.z); m.rotation.z = rec.rot; }
    for (const [id, m] of mirrorProj) if (!seenP.has(id)) { scene.remove(m); mirrorProj.delete(id); }
    const seenF = new Set();
    for (const rec of lastSnap.food) {
      seenF.add(rec.id); let m = mirrorFood.get(rec.id);
      if (!m) { m = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), new THREE.MeshLambertMaterial({ map: T.skewer, transparent: true, alphaTest: 0.3 })); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.renderOrder = 2; scene.add(m); mirrorFood.set(rec.id, m); }
      m.position.set(rec.x, 0.03, rec.z);
    }
    for (const [id, m] of mirrorFood) if (!seenF.has(id)) { scene.remove(m); mirrorFood.delete(id); }
  }
  smokeT -= dt; if (smokeT <= 0) { smokeT = 0.35; smokeSources.forEach(smoke); }
  camTarget.lerp(new THREE.Vector3(Math.max(YARD.minX + 6, Math.min(YARD.maxX - 6, player.pos.x)), 0, Math.max(YARD.minZ + 4, Math.min(YARD.maxZ - 4, player.pos.z))), 0.08);
  camera.position.copy(camTarget).add(CAM_OFF); camera.lookAt(camTarget);
}

function render(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt;
    if (p.drop) { p.vel.y -= 9 * dt; p.mesh.position.addScaledVector(p.vel, dt); if (p.mesh.position.y <= 0.02) { scene.remove(p.mesh); particles.splice(i, 1); if (Math.random() < 0.5 && puddles.length < 300) puddles.push(decal(T.drop, p.mesh.position.x, p.mesh.position.z, 0.12 + Math.random() * 0.12, 0.01)); continue; } }
    if (p.grow) { p.mesh.position.addScaledVector(p.vel, dt); const k = 1 - p.life / p.max; p.mesh.scale.setScalar(0.6 + k * 1.6); p.mesh.material.opacity = 1 - k; p.mesh.material.transparent = true; }
    if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
  }
  scene.traverse(o => { if (o.userData.flicker) o.scale.setScalar(0.85 + Math.random() * 0.3); });
  for (const [e, el] of bubbleEls) { let t = parseFloat(el.dataset.t) - dt; el.dataset.t = t; if (t <= 0 || !e.mesh.parent) { el.style.display = 'none'; continue; } el.style.display = 'block'; const [sx, sy] = worldToScreen(tmp.copy(e.pos).setY((e.state === 'lying' || e._lying) ? 0.6 : e.h + 0.4)); el.style.left = sx + 'px'; el.style.top = sy + 'px'; }
  if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) hud.banner.style.opacity = 0; }
  player.mesh.material.color.set(player.hurtT > 0 ? '#ff6060' : '#ffffff');
  hud.blind.style.opacity = player.blindT > 0 ? Math.min(1, player.blindT) * 0.85 : 0;
  if (player.reloadT > 0) { const [sx, sy] = worldToScreen(tmp.copy(player.pos).setY(2.2)); hud.reload.style.display = 'block'; hud.reload.style.left = sx + 'px'; hud.reload.style.top = sy + 'px'; hud.reload.firstElementChild.style.width = (100 - player.reloadT / WEAPON.reload * 100) + '%'; } else hud.reload.style.display = 'none';
  renderer.render(scene, camera);
}
function endGame(win) {
  if (gameOver || levelDone) return;
  gameOver = !win; levelDone = win; const ov = $('overlay'); ov.classList.remove('hidden'); const lastLevel = levelIdx === LEVELS.length - 1;
  $('screenMode').hidden = true; $('screenPlay').hidden = false;
  const h1 = ov.querySelector('h1'), sub = $('playSub');
  h1.textContent = win ? (lastLevel ? 'ИГРА ПРОЙДЕНА' : 'РАЙОН ПРОЙДЕН') : 'ТЕБЯ ОБЪЕЛИ';
  sub.textContent = win ? (lastLevel ? 'Михалыч лежит. Все в кетчупе. Титры.' : `Дальше: ${LEVELS[levelIdx + 1].name}`) : 'Голодные добрались до Серёги и Саймона.';
  ov.querySelectorAll('#screenPlay p:not(#playSub)').forEach(p => p.remove()); $('roomInfo').textContent = '';
  const b = $('start'); b.hidden = false; b.textContent = win ? (lastLevel ? 'СНАЧАЛА' : 'ДАЛЬШЕ') : 'ЕЩЁ РАЗ';
  b.onclick = () => { location.search = win && !lastLevel ? `?level=${levelIdx + 1}` : (win ? '' : `?level=${levelIdx}`); };
}

// ================= ЛОББИ (соло / онлайн-кооп) =================
const modeSolo = $('modeSolo'), modeHost = $('modeHost'), modeJoin = $('modeJoin'), joinRow = $('joinRow'), joinCode = $('joinCode'), joinGo = $('joinGo'), netStatus = $('netStatus');
const screenMode = $('screenMode'), screenPlay = $('screenPlay'), roomInfo = $('roomInfo'), startBtn = $('start');
$('playSub').textContent = `по мотивам «Жмурок». Уровень ${levelIdx + 1}: ${LEVEL.name}`;

function setStatus(text, isErr) { netStatus.textContent = text; netStatus.classList.toggle('err', !!isErr); }
function goToPlayScreen(info) { screenMode.hidden = true; screenPlay.hidden = false; roomInfo.textContent = info || ''; }

modeSolo.onclick = () => { netRole = 'solo'; goToPlayScreen(''); };

modeHost.onclick = async () => {
  modeHost.disabled = true; setStatus('Подключаюсь к серверу…');
  net = new Net(); netRole = 'host';
  try {
    const code = await net.createRoom();
    setStatus(`Код комнаты: ${code} — скинь его другу. Ждём подключения…`);
    net.onPeer = () => { goToPlayScreen(`Комната ${code} · игрок 2 на связи. Жми «Погнали»!`); startBtn.hidden = false; };
    net.onLeave = () => { if (started) { say('Второй игрок отключился'); } else setStatus(`Игрок 2 отключился. Код комнаты: ${code}`, true); };
    net.onMsg = handleHostMsg;
  } catch (err) { setStatus(err.message, true); modeHost.disabled = false; }
};

modeJoin.onclick = () => { joinRow.hidden = false; joinCode.focus(); };
joinGo.onclick = async () => {
  const code = joinCode.value.trim().toUpperCase(); if (code.length < 4) { setStatus('Введи код из 4 символов', true); return; }
  joinGo.disabled = true; setStatus('Подключаюсь…');
  net = new Net(); netRole = 'guest'; player.spec = SIMON_SPEC; player.redraw();
  try {
    await net.joinRoom(code);
    net.onMsg = handleGuestMsg;
    net.onLeave = () => { if (started) say('Хост отключился'); else setStatus('Связь с хостом потеряна', true); };
    goToPlayScreen(`Комната ${code} · подключено. Ждём, когда хост нажмёт «Погнали»…`); startBtn.hidden = true;
  } catch (err) { setStatus(err.message, true); joinGo.disabled = false; }
};
joinCode.addEventListener('keydown', e => { if (e.code === 'Enter') joinGo.click(); });

function handleHostMsg(msg) {
  if (msg.t === 'p2') { ensureMate(); applyRemoteTransform(mate, msg); }
  else if (msg.t === 'shoot') { const dir = new THREE.Vector3(msg.dx, 0, msg.dz); if (dir.lengthSq() > 0.01) shoot(dir.normalize(), new THREE.Vector3(msg.x, 0, msg.z)); }
}
function handleGuestMsg(msg) { if (msg.t === 'snap') lastSnap = msg; else if (msg.t === 'go') startBtn.click(); }

startBtn.onclick = () => {
  $('overlay').classList.add('hidden'); started = true; banner(LEVEL.waves[0].name); say('Чушпаны идут. Кормим.');
  if (net) netBadgeUpdate(net.code);
  if (netRole === 'host') net.send({ t: 'go' });
};
updateAmmo(); requestAnimationFrame(loop);
window.__game = {
  enemies, player, projectiles, groundFood, wave, spawnEnemy, feed, LEVEL, LEVELS, levelIdx, keys, ENEMY_TYPES,
  get started() { return started; }, get levelDone() { return levelDone; }, get netRole() { return netRole; },
  step(sec, dt = 1 / 60) { for (let t = 0; t < sec; t += dt) { if (started && !gameOver && !levelDone) { if (netRole === 'guest') updateGuest(dt); else updateSim(dt); } render(dt); } },
  shootAt(x, z) { mouseNdc.copy(new THREE.Vector3(x, 0, z).project(camera)); mouseDown = true; this.step(0.05); mouseDown = false; },
  _debugStartHost: async () => { modeHost.click(); },
  get mate() { return mate; }, get net() { return net; }, get lastSnap() { return lastSnap; }, mirrorEnemies,
};
