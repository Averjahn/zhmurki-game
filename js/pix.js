// Генератор пиксель-арта. Все спрайты рисуются кодом на canvas и отдаются в three.js
// как текстуры без сглаживания. Любой из них можно подменить готовым паком с itch.io.
import * as THREE from 'three';

export function mkCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  return [c, x];
}
export function tex(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const KETCHUP = '#c8281e', KETCHUP2 = '#e8452c', KETCHUP_D = '#8a1410';

// ---------- окружение ----------
export function groundTex(kind = 'cobble') {
  if (kind === 'grass') return grassTex(); if (kind === 'asphalt') return asphaltTex();
  const [c, x] = mkCanvas(128, 128); const r = rng(7);
  x.fillStyle = '#26221e'; x.fillRect(0, 0, 128, 128);
  for (let gy = 0; gy < 16; gy++) for (let gx = 0; gx < 16; gx++) {
    const g = 36 + Math.floor(r() * 20);
    x.fillStyle = `rgb(${g + 6},${g + 1},${g - 5})`; x.fillRect(gx * 8 + 1, gy * 8 + 1, 6, 6);
    x.fillStyle = `rgb(${g + 16},${g + 11},${g + 2})`; x.fillRect(gx * 8 + 1, gy * 8 + 1, 6, 1);
  }
  for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(70,52,34,0.45)'; x.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), Math.floor(r() * 12) + 2, Math.floor(r() * 5) + 1); }
  return c;
}
export function woodTex(seed = 3) {
  const [c, x] = mkCanvas(32, 32); const r = rng(seed);
  x.fillStyle = '#5a4223'; x.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#6b4f2a' : '#4d3720'; x.fillRect(0, i * 8, 32, 7); x.fillStyle = '#2e2012'; x.fillRect(0, i * 8 + 7, 32, 1); }
  for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), Math.floor(r() * 6) + 1, 1); }
  x.fillStyle = '#7a5a30'; x.fillRect(0, 0, 32, 2); x.fillRect(0, 0, 2, 32); x.fillRect(30, 0, 2, 32); x.fillRect(0, 30, 32, 2);
  x.fillStyle = '#3a2a16'; x.fillRect(2, 2, 28, 1); x.fillRect(2, 2, 1, 28);
  return c;
}
export function metalTex(seed = 5, base = [70, 74, 78]) {
  const [c, x] = mkCanvas(32, 32); const r = rng(seed);
  x.fillStyle = `rgb(${base})`; x.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 32; i += 4) { x.fillStyle = `rgba(255,255,255,.07)`; x.fillRect(0, i, 32, 1); x.fillStyle = `rgba(0,0,0,.25)`; x.fillRect(0, i + 3, 32, 1); }
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(120,60,20,.35)'; x.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), Math.floor(r() * 4) + 1, Math.floor(r() * 3) + 1); }
  return c;
}
export function brickTex(seed = 9, w = 64, h = 64) {
  const [c, x] = mkCanvas(w, h); const r = rng(seed);
  x.fillStyle = '#3a2420'; x.fillRect(0, 0, w, h);
  for (let row = 0; row < h / 4; row++) for (let col = -1; col < w / 8 + 1; col++) {
    const off = row % 2 ? 4 : 0; const v = 80 + Math.floor(r() * 30);
    x.fillStyle = `rgb(${v + 20},${v - 30},${v - 45})`; x.fillRect(col * 8 + off, row * 4, 7, 3);
  }
  return c;
}
export function corrugatedTex() {
  const [c, x] = mkCanvas(64, 64);
  for (let i = 0; i < 64; i += 4) { x.fillStyle = '#55524a'; x.fillRect(i, 0, 2, 64); x.fillStyle = '#3a3833'; x.fillRect(i + 2, 0, 2, 64); }
  const r = rng(11); for (let i = 0; i < 50; i++) { x.fillStyle = 'rgba(110,50,20,.4)'; x.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 2, Math.floor(r() * 8) + 2); }
  return c;
}
// стена с надписью (краской из баллончика)
export function signWallTex(lines, opts = {}) {
  const { w = 128, h = 96, base = brickTex(21, w, h), color = '#c4322a', font = 'bold 15px monospace', y0 = 30, lh = 18 } = opts;
  const [c, x] = mkCanvas(w, h); x.drawImage(base, 0, 0, w, h);
  x.font = font; x.textAlign = 'center'; x.fillStyle = color;
  lines.forEach((l, i) => x.fillText(l, w / 2, y0 + i * lh));
  // подтёки
  x.fillStyle = color; const r = rng(4);
  for (let i = 0; i < lines.length * 3; i++) x.fillRect(Math.floor(r() * (w - 20)) + 10, y0 + Math.floor(r() * lines.length) * lh + 2, 1, Math.floor(r() * 6) + 2);
  return c;
}
export function puddleCanvas(size = 32, seed = 1) {
  const [c, x] = mkCanvas(size, size); const r = rng(seed);
  const cx = size / 2, cy = size / 2;
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, d = r() * size * 0.28; const rad = 2 + r() * size * 0.16;
    x.fillStyle = i % 3 ? KETCHUP : KETCHUP_D;
    fillBlob(x, cx + Math.cos(a) * d, cy + Math.sin(a) * d, rad);
  }
  for (let i = 0; i < 10; i++) { x.fillStyle = KETCHUP; x.fillRect(Math.floor(cx + (r() - .5) * size * .9), Math.floor(cy + (r() - .5) * size * .9), 1, 1); }
  return c;
}
function fillBlob(x, cx, cy, rad) {
  for (let py = -rad; py <= rad; py++) for (let px = -rad; px <= rad; px++) if (px * px + py * py <= rad * rad) x.fillRect(Math.floor(cx + px), Math.floor(cy + py), 1, 1);
}
export function shadowCanvas() { const [c, x] = mkCanvas(16, 8); x.fillStyle = 'rgba(0,0,0,.45)'; for (let py = 0; py < 8; py++) for (let px = 0; px < 16; px++) { const dx = (px - 7.5) / 8, dy = (py - 3.5) / 4; if (dx * dx + dy * dy <= 1) x.fillRect(px, py, 1, 1); } return c; }

// ---------- снаряд, вспышка, частицы ----------
export function skewerCanvas() {
  const [c, x] = mkCanvas(12, 12);
  x.fillStyle = '#b8b8c0'; for (let i = 0; i < 12; i++) x.fillRect(i, 11 - i, 1, 1);
  const meat = ['#8a3a22', '#a04a2a', '#6e2a18'];
  [[2, 8], [5, 5], [8, 2]].forEach(([mx, my], i) => { x.fillStyle = meat[i]; x.fillRect(mx - 1, my - 1, 3, 3); x.fillStyle = '#c8663a'; x.fillRect(mx - 1, my - 1, 1, 1); x.fillStyle = KETCHUP; x.fillRect(mx + 1, my + 1, 1, 1); });
  return c;
}
export function steamCanvas() { const [c, x] = mkCanvas(10, 10); x.fillStyle = 'rgba(230,225,215,.85)'; fillBlob(x, 5, 5, 3); x.fillStyle = 'rgba(255,240,200,.95)'; fillBlob(x, 5, 5, 1.5); x.fillStyle = 'rgba(230,225,215,.5)'; x.fillRect(1, 4, 1, 1); x.fillRect(8, 5, 1, 1); x.fillRect(4, 1, 1, 1); return c; }
export function fireCanvas() { const [c, x] = mkCanvas(10, 10); x.fillStyle = '#ff8a1a'; fillBlob(x, 5, 5, 3.5); x.fillStyle = '#ffe070'; fillBlob(x, 5, 5, 1.8); return c; }
export function dropCanvas() { const [c, x] = mkCanvas(3, 3); x.fillStyle = KETCHUP; x.fillRect(0, 0, 3, 3); x.fillStyle = KETCHUP2; x.fillRect(0, 0, 1, 1); return c; }

// ---------- персонажи ----------
// Зоны для пятен кетчупа [x,y,w,h] на канвасе 24x40
export const ZONES = { face: [8, 2, 8, 7], chest: [6, 12, 12, 10], larm: [2, 12, 4, 10], rarm: [18, 12, 4, 10], lleg: [7, 25, 5, 12], rleg: [12, 25, 5, 12] };
export const ZONE_NAMES = Object.keys(ZONES);
export function randomStain(r = Math.random) {
  const zone = ZONE_NAMES[Math.floor(r() * ZONE_NAMES.length)]; const z = ZONES[zone];
  return { zone, dx: Math.floor(r() * z[2]), dy: Math.floor(r() * z[3]), size: 1 + Math.floor(r() * 2.5), drip: Math.floor(r() * 4) };
}
export function drawChar(x, spec, frame = 0, o = {}) {
  const { skin = '#d9a57a', hair = '#2a1e14', suit = '#8b1a1a', stripe = '#efe6d2', pants, shoes = '#141414', jacket = false, big = false, thin = false, gun = false, cap = false, capColor, dress = false, scarf = false, uniform = false, seeds = false, boss = false } = spec;
  const P = pants || suit;
  x.clearRect(0, 0, 24, 40);
  x.save();
  if (o.tilt) { x.translate(12, 39); x.rotate(o.tilt); x.translate(-12, -39); }
  const wB = boss ? 16 : big ? 14 : thin ? 8 : 12, xB = 12 - wB / 2;
  // фазы ходьбы: 4 кадра, ноги и руки в противофазе
  const legL = [0, 2, 0, -2][frame % 4], armL = -legL;
  const eat = o.pose === 'eat';
  const lw = thin ? 3 : 5;
  // ноги
  x.fillStyle = P;
  if (dress) { x.fillStyle = suit; x.fillRect(xB - 1, 24, wB + 2, 9); x.fillStyle = '#3a3a48'; x.fillRect(xB + 1, 33, lw, 4 - legL / 2); x.fillRect(xB + wB - 1 - lw, 33, lw, 4 + legL / 2); }
  else {
    x.fillRect(xB + 1, 25 - legL, lw, 12); x.fillRect(xB + wB - 1 - lw, 25 + legL, lw, 12);
    if (!jacket && !uniform) { x.fillStyle = stripe; x.fillRect(xB + 1, 25 - legL, 1, 12); x.fillRect(xB + wB - 2, 25 + legL, 1, 12); }
    if (uniform) { x.fillStyle = '#c03030'; x.fillRect(xB + 1, 25 - legL, 1, 12); x.fillRect(xB + wB - 2, 25 + legL, 1, 12); }
  }
  x.fillStyle = shoes; x.fillRect(xB, 36 - legL, lw + 1, 3); x.fillRect(xB + wB - 1 - lw, 36 + legL, lw + 1, 3);
  // туловище
  const body = jacket ? '#1c1a1a' : suit;
  x.fillStyle = body; x.fillRect(xB, 12, wB, 13);
  if (jacket) { x.fillStyle = '#2c2a2a'; x.fillRect(xB + 1, 12, 2, 13); x.fillRect(xB + wB - 3, 12, 2, 13); x.fillStyle = '#4a4646'; x.fillRect(11, 13, 2, 11); }
  else if (uniform) { x.fillStyle = '#d0c060'; x.fillRect(xB + 1, 13, 2, 2); x.fillRect(xB + wB - 3, 13, 2, 2); x.fillStyle = '#2a2a3a'; x.fillRect(11, 14, 2, 10); x.fillStyle = '#d0c060'; x.fillRect(xB + 2, 20, 2, 2); }
  else if (dress) { x.fillStyle = '#e8d8b0'; for (let i = 0; i < 6; i++) x.fillRect(xB + 1 + (i * 5) % (wB - 2), 13 + (i * 3) % 11, 1, 1); }
  else { x.fillStyle = stripe; x.fillRect(xB, 12, wB, 1); x.fillStyle = '#5a0e0e'; x.fillRect(xB, 24, wB, 1); }
  // руки (качаются в противофазе к ногам)
  x.fillStyle = body;
  x.fillRect(xB - 3, 13 + armL / 2, 3, 10); x.fillRect(xB + wB, 13 - armL / 2, 3, 10);
  if (!jacket && !uniform && !dress) { x.fillStyle = stripe; x.fillRect(xB - 3, 13 + armL / 2, 3, 1); x.fillRect(xB + wB, 13 - armL / 2, 3, 1); x.fillRect(xB - 2, 14 + armL / 2, 1, 8); x.fillRect(xB + wB + 1, 14 - armL / 2, 1, 8); }
  x.fillStyle = skin; x.fillRect(xB - 3, 23 + armL / 2, 3, 2); x.fillRect(xB + wB, 23 - armL / 2, 3, 2);
  if (seeds) { x.fillStyle = '#c8b070'; x.fillRect(xB - 4, 21, 4, 4); x.fillStyle = '#5a4020'; x.fillRect(xB - 3, 22, 1, 1); x.fillRect(xB - 2, 23, 1, 1); }
  if (dress) { x.fillStyle = '#8a6a30'; x.fillRect(xB + wB + 1, 20, 4, 6); x.fillStyle = '#c8a040'; x.fillRect(xB + wB + 2, 21, 1, 1); x.fillRect(xB + wB + 3, 23, 1, 1); }
  // голова (при еде кивает)
  const hy = eat ? (frame % 2) : 0;
  x.fillStyle = skin; x.fillRect(8, 2 + hy, 8, 9);
  x.fillStyle = hair;
  if (scarf) { x.fillStyle = '#c04a70'; x.fillRect(7, 1 + hy, 10, 4); x.fillRect(7, 5 + hy, 1, 6); x.fillRect(16, 5 + hy, 1, 6); }
  else if (uniform) { x.fillStyle = '#2a3a5a'; x.fillRect(7, 0 + hy, 10, 3); x.fillRect(6, 3 + hy, 12, 1); x.fillStyle = '#d0c060'; x.fillRect(11, 1 + hy, 2, 1); }
  else if (cap) { x.fillStyle = capColor || hair; x.fillRect(7, 1 + hy, 10, 3); x.fillRect(16, 3 + hy, 2, 1); }
  else { x.fillRect(8, 1 + hy, 8, 2); x.fillRect(8, 3 + hy, 1, 3); x.fillRect(15, 3 + hy, 1, 3); }
  if (boss) { x.fillStyle = hair; x.fillRect(9, 8 + hy, 6, 2); }
  x.fillStyle = '#111'; x.fillRect(10, 5 + hy, 1, 1); x.fillRect(13, 5 + hy, 1, 1);
  // рот
  if (o.cover) { x.fillStyle = skin; x.fillRect(9, 7 + hy, 6, 3); x.fillStyle = '#b07a55'; x.fillRect(9, 9 + hy, 6, 1); }
  else if (eat) { x.fillStyle = '#3a0c0c'; if (frame % 2) x.fillRect(10, 8 + hy, 4, 1); else x.fillRect(10, 7 + hy, 4, 3); x.fillStyle = KETCHUP; x.fillRect(9, 9 + hy, 1, 1); x.fillRect(14, 8 + hy, 1, 1); }
  else if (o.mouth) { x.fillStyle = '#3a0c0c'; x.fillRect(10, 7 + hy, 4, 3); x.fillStyle = '#eee'; x.fillRect(10, 7 + hy, 4, 1); }
  else { x.fillStyle = '#5a2a20'; x.fillRect(11, 8 + hy, 2, 1); }
  // пузо (объелся)
  if (o.belly || big || boss) { x.fillStyle = body; x.fillRect(xB - 1, 17, wB + 2, 7); if (o.belly) { x.fillStyle = skin; x.fillRect(xB + wB / 2 - 1, 21, 3, 2); } }
  // оружие — шампур
  if (gun) { x.fillStyle = '#b8b8c0'; x.fillRect(xB + wB + 2, 17, 8, 1); x.fillStyle = '#3a3a3a'; x.fillRect(xB + wB + 1, 16, 3, 4); x.fillStyle = '#8a3a22'; x.fillRect(xB + wB + 5, 16, 2, 3); x.fillRect(xB + wB + 8, 16, 2, 3); }
  // пятна кетчупа
  for (const s of o.stains || []) {
    const z = ZONES[s.zone]; const px = z[0] + s.dx, py = z[1] + s.dy;
    x.fillStyle = KETCHUP; fillBlob(x, px, py, s.size); x.fillStyle = KETCHUP2; x.fillRect(px - 1, py - 1, 1, 1);
    x.fillStyle = KETCHUP_D; x.fillRect(px, py + s.size, 1, s.drip);
  }
  x.restore();
}
// лежащий: 40x24, повернуть стоящего на бок
export function drawLying(x, spec, o = {}) {
  const [t, tx] = mkCanvas(24, 40); drawChar(tx, spec, 0, { ...o, belly: true, mouth: false });
  x.clearRect(0, 0, 40, 24); x.save(); x.translate(0, 24); x.rotate(-Math.PI / 2); x.drawImage(t, 0, 0); x.restore();
}
export function drawPortrait(x, spec) {
  const { skin = '#d9a57a', hair = '#2a1e14', bald = false } = spec;
  x.fillStyle = '#1a1612'; x.fillRect(0, 0, 32, 32);
  x.fillStyle = '#1c1a1a'; x.fillRect(4, 24, 24, 8); x.fillStyle = '#4a4646'; x.fillRect(15, 25, 2, 7);
  x.fillStyle = skin; x.fillRect(9, 6, 14, 17);
  x.fillStyle = hair; if (!bald) { x.fillRect(9, 4, 14, 4); x.fillRect(9, 8, 2, 5); x.fillRect(21, 8, 2, 5); } else { x.fillStyle = '#c9956a'; x.fillRect(9, 5, 14, 2); }
  x.fillStyle = '#111'; x.fillRect(12, 12, 2, 2); x.fillRect(18, 12, 2, 2); x.fillStyle = '#7a4a30'; x.fillRect(14, 18, 4, 1);
  x.fillStyle = '#3a2a20'; x.fillRect(11, 10, 4, 1); x.fillRect(17, 10, 4, 1);
}
export function drawWeaponIcon(x) {
  x.clearRect(0, 0, 48, 16);
  x.fillStyle = '#3a3a3a'; x.fillRect(4, 6, 10, 5); x.fillRect(6, 10, 4, 5); x.fillStyle = '#5a4a30'; x.fillRect(7, 11, 2, 3);
  x.fillStyle = '#b8b8c0'; x.fillRect(14, 7, 30, 1); x.fillRect(44, 6, 2, 3);
  const meat = ['#8a3a22', '#a04a2a', '#6e2a18', '#8a3a22'];
  for (let i = 0; i < 4; i++) { x.fillStyle = meat[i]; x.fillRect(17 + i * 6, 5, 4, 5); x.fillStyle = '#c8663a'; x.fillRect(17 + i * 6, 5, 1, 1); x.fillStyle = KETCHUP; x.fillRect(19 + i * 6, 9, 1, 2); }
}
export function drawMangalTop(x) { // 32x16 верх мангала с углями
  x.fillStyle = '#2a2a2a'; x.fillRect(0, 0, 32, 16); const r = rng(2);
  for (let i = 0; i < 40; i++) { x.fillStyle = r() > .5 ? '#c84a10' : '#ff8a1a'; x.fillRect(Math.floor(r() * 30) + 1, Math.floor(r() * 14) + 1, 2, 1); }
  x.fillStyle = '#b8b8c0'; for (let i = 0; i < 4; i++) x.fillRect(2, 3 + i * 3, 28, 1);
  x.fillStyle = '#8a3a22'; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) x.fillRect(5 + k * 7, 2 + i * 3, 3, 2);
}
export function arrowCanvas() { const [c, x] = mkCanvas(16, 16); x.fillStyle = '#ffd24a'; x.fillRect(6, 1, 4, 9); x.fillRect(3, 8, 10, 2); x.fillRect(5, 10, 6, 2); x.fillRect(7, 12, 2, 2); return c; }

export function grassTex() {
  const [c, x] = mkCanvas(128, 128); const r = rng(13);
  x.fillStyle = '#2e3a1c'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { const v = r(); x.fillStyle = v < .5 ? '#384a20' : v < .8 ? '#26321a' : '#4a5a28'; x.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1 + Math.floor(r() * 2), 1); }
  for (let i = 0; i < 25; i++) { x.fillStyle = 'rgba(80,60,35,.6)'; x.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), Math.floor(r() * 10) + 3, Math.floor(r() * 4) + 2); }
  return c;
}
export function asphaltTex() {
  const [c, x] = mkCanvas(128, 128); const r = rng(17);
  x.fillStyle = '#2a2a2c'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1500; i++) { const g = 34 + Math.floor(r() * 18); x.fillStyle = `rgb(${g},${g},${g + 2})`; x.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1, 1); }
  for (let i = 0; i < 12; i++) { x.fillStyle = '#1c1c1e'; const sx = Math.floor(r() * 128), sy = Math.floor(r() * 128); for (let k = 0; k < 14; k++) x.fillRect(sx + k, sy + Math.floor(Math.sin(k) * 2), 1, 1); }
  x.fillStyle = '#8a8060'; x.fillRect(0, 60, 128, 2);
  return c;
}
export function shellCanvas() { const [c, x] = mkCanvas(4, 4); x.fillStyle = '#3a2a18'; x.fillRect(0, 1, 3, 2); x.fillStyle = '#6a5030'; x.fillRect(1, 1, 1, 1); return c; }
export function smokeCanvas() { const [c, x] = mkCanvas(8, 8); x.fillStyle = 'rgba(120,115,110,.55)'; fillBlob(x, 4, 4, 3); return c; }
export function awningTex(color) { const [c, x] = mkCanvas(32, 16); for (let i = 0; i < 32; i += 8) { x.fillStyle = color; x.fillRect(i, 0, 4, 16); x.fillStyle = '#e8e0d0'; x.fillRect(i + 4, 0, 4, 16); } return c; }
export function roofTex() { const [c, x] = mkCanvas(32, 32); x.fillStyle = '#4a3a30'; x.fillRect(0, 0, 32, 32); for (let i = 0; i < 32; i += 4) { x.fillStyle = '#5a4838'; x.fillRect(0, i, 32, 2); x.fillStyle = '#2e2420'; x.fillRect(0, i + 3, 32, 1); } return c; }
export function bedTex() { const [c, x] = mkCanvas(32, 32); const r = rng(23); x.fillStyle = '#3a2a1c'; x.fillRect(0, 0, 32, 32); for (let row = 2; row < 32; row += 6) { x.fillStyle = '#2a1e14'; x.fillRect(0, row, 32, 2); for (let k = 2; k < 32; k += 5) { x.fillStyle = r() > .3 ? '#3e6a24' : '#5a8a2c'; x.fillRect(k, row - 1, 3, 3); } } return c; }
