// Уровни: раскладка, точки спавна, выход, волны. Строятся через примитивы, которые даёт game.js (ctx).
import * as THREE from 'three';
import * as P from './pix.js';

const v = (x, z) => new THREE.Vector3(x, 0, z);

export const LEVELS = [
  {
    name: 'Двор со складом', ground: 'cobble', ambient: 1.25, sky: '#0a0908',
    yard: { minX: -18, maxX: 18, minZ: -14, maxZ: 14 },
    spawns: [v(-17, 12), v(11, -13.5), v(17.5, 9)], exit: v(-17, 12), mangal: v(2, -4),
    playerStart: v(-2, 2),
    waves: [
      { name: 'ВОЛНА 1', interval: 2.0, list: ['sportik', 'sportik', 'hudoy', 'sportik', 'byk', 'hudoy', 'sportik', 'sportik', 'byk'] },
      { name: 'ВОЛНА 2', interval: 1.6, list: ['gopnik', 'sportik', 'hudoy', 'hudoy', 'gopnik', 'byk', 'tolstyak', 'sportik', 'sportik', 'gopnik', 'byk'] },
    ],
    build(c) {
      const sign = P.tex(P.signWallTex(['ШАШЛЫК', 'ПИВО', 'КЕТЧУП'], { base: P.corrugatedTex(), color: '#b8301e', font: 'bold 18px monospace', y0: 30, lh: 26, w: 128, h: 96 }));
      c.box(7, 3.4, 5, -11, -15.5, c.m.corr); c.box(7, 3.4, 5, -3, -15.5, [c.m.corr, c.m.corr, c.m.corr, c.m.corr, c.lam(sign), c.m.corr]); c.box(6, 3.4, 5, 4.5, -15.5, c.m.corr);
      const sila = P.tex(P.signWallTex(['СИЛА', 'В ПРАВДЕ'], { color: '#d8d0c0', font: 'bold 17px monospace', y0: 34, lh: 22, w: 128, h: 96 }));
      c.box(6, 5.5, 14, 21.5, -2, [c.m.brick, c.m.brick, c.m.brick, c.m.brick, c.m.brick, c.lam(sila)]);
      for (let z = -13; z <= 6; z += 3) c.box(0.3, 2, 3, -19, z, c.m.metal);
      c.box(0.3, 2, 8, -19, -18, c.m.metal);
      const nebrat = P.tex(P.signWallTex(['НЕ БРАТ', 'ТЫ МНЕ!!'], { base: P.metalTex(8, [52, 62, 78]), color: '#d8d0c0', font: 'bold 16px monospace', y0: 34, lh: 22, w: 128, h: 96 }));
      const mb = c.lam(c.T.metalBlue);
      c.box(6.5, 2.6, 2.6, 6, 10.5, [mb, mb, mb, mb, c.lam(nebrat), mb]); c.box(6.5, 2.6, 2.6, 13, 13, mb); c.box(6.5, 2.6, 2.6, -1, 17, mb);
      c.box(4.2, 1.6, 2.2, -8, 9, c.lam(c.T.metal, '#5a6a3a')); c.box(1.6, 1.9, 2.2, -5.1, 9, c.lam(c.T.metal, '#4a5a2a'));
      c.box(4.4, 1.2, 1.9, -11, -5, c.lam(c.T.metal, '#34343c')); c.box(2.2, 0.8, 1.7, -11.2, -5, c.lam(c.T.metal, '#222'), { y: 1.2, noCollide: true });
      [[1, -9], [2, -9], [1.5, -8], [7, -9], [-6, 6], [10, 4], [11, 5], [13, -7], [-14, 2], [-13, 6]].forEach(([x, z], i) => c.box(1, 1, 1, x, z, c.m.wood, { y: i % 4 === 2 ? 1 : 0 }));
      [[5, -10], [6, -10.5], [-3, -7], [14, 1], [-15, 9], [9, -3]].forEach(([x, z]) => c.barrel(x, z));
      c.mangal(2, -4); c.lamp(-6, -11); c.lamp(12, -9); c.lamp(-12, 12);
    },
  },
  {
    name: 'Рынок', ground: 'asphalt', ambient: 1.35, sky: '#0b0a0c',
    yard: { minX: -20, maxX: 20, minZ: -14, maxZ: 14 },
    spawns: [v(-19, -12), v(19, -12), v(19, 12), v(-19, 12)], exit: v(0, -14), mangal: v(0, 2),
    playerStart: v(0, 6),
    waves: [
      { name: 'ВОЛНА 1', interval: 1.7, list: ['sportik', 'tetka', 'sportik', 'hudoy', 'tetka', 'gopnik', 'sportik', 'ment', 'hudoy', 'sportik'] },
      { name: 'ВОЛНА 2', interval: 1.5, list: ['tolstyak', 'sportik', 'gopnik', 'tetka', 'byk', 'ment', 'hudoy', 'hudoy', 'sportik', 'tolstyak', 'gopnik', 'byk'] },
      { name: 'ВОЛНА 3', interval: 1.2, list: ['ment', 'ment', 'sportik', 'sportik', 'tetka', 'tolstyak', 'gopnik', 'gopnik', 'byk', 'byk', 'hudoy', 'hudoy', 'sportik', 'tolstyak'] },
    ],
    build(c) {
      const rynok = P.tex(P.signWallTex(['РЫНОК', 'КОЛХОЗНЫЙ'], { color: '#e0c040', font: 'bold 17px monospace', y0: 34, lh: 22, w: 128, h: 96 }));
      c.box(10, 4.5, 4, -7, -17, [c.m.brick, c.m.brick, c.m.brick, c.m.brick, c.lam(rynok), c.m.brick]);
      const shaurma = P.tex(P.signWallTex(['ШАУРМА', '24 ЧАСА'], { base: P.metalTex(8, [90, 80, 70]), color: '#d83030', font: 'bold 16px monospace', y0: 34, lh: 22, w: 128, h: 96 }));
      c.box(5, 3, 3, 9, -16.5, [c.m.metal, c.m.metal, c.m.metal, c.m.metal, c.lam(shaurma), c.m.metal]);
      // прилавки с тентами — два ряда
      const colors = ['#b83030', '#2a6a9a', '#3a8a3a', '#c08020'];
      for (let i = 0; i < 4; i++) { const x = -13 + i * 8.5; c.stall(x, -6, colors[i]); c.stall(x + 2, 6, colors[(i + 1) % 4]); }
      // ограда по периметру с проходами по углам
      for (let x = -14; x <= 14; x += 4) { c.box(3, 1.4, 0.25, x, -13.8, c.m.metal); c.box(3, 1.4, 0.25, x, 13.8, c.m.metal); }
      for (let z = -8; z <= 8; z += 4) { c.box(0.25, 1.4, 3, -19.8, z, c.m.metal); c.box(0.25, 1.4, 3, 19.8, z, c.m.metal); }
      [[-16, 0], [-15, 1], [16, -2], [17, -2], [5, 10], [-6, -10]].forEach(([x, z], i) => c.box(1, 1, 1, x, z, c.m.wood, { y: i % 3 === 1 ? 1 : 0 }));
      [[-4, 10], [15, 9], [-16, -6]].forEach(([x, z]) => c.barrel(x, z));
      c.mangal(0, 2); c.lamp(-10, 0); c.lamp(10, 0); c.lamp(0, -10);
    },
  },
  {
    name: 'Дача', ground: 'grass', ambient: 1.1, sky: '#070a08',
    yard: { minX: -17, maxX: 17, minZ: -13, maxZ: 13 },
    spawns: [v(-16, -12), v(16, 0), v(-16, 11)], exit: v(16, -12), mangal: v(4, 3),
    playerStart: v(0, 6),
    waves: [
      { name: 'ВОЛНА 1', interval: 1.6, list: ['sportik', 'sportik', 'tetka', 'tetka', 'hudoy', 'gopnik', 'byk', 'sportik', 'tolstyak', 'hudoy'] },
      { name: 'ВОЛНА 2', interval: 1.3, list: ['ment', 'gopnik', 'gopnik', 'sportik', 'tetka', 'tolstyak', 'tolstyak', 'byk', 'byk', 'hudoy', 'hudoy', 'sportik', 'ment'] },
      { name: 'МИХАЛЫЧ', interval: 2.5, list: ['boss', 'hudoy', 'hudoy', 'sportik', 'sportik', 'tetka', 'gopnik'] },
    ],
    build(c) {
      // дом с крышей
      c.box(8, 3.2, 6, -10, -8, c.m.wood); c.box(9, 1.2, 7, -10, -8, c.lam(c.T.roof), { y: 3.2, noCollide: true });
      const dacha = P.tex(P.signWallTex(['СОСЕДИ', 'НЕ ЖРАТЬ!'], { base: P.woodTex(), color: '#d8d0c0', font: 'bold 15px monospace', y0: 34, lh: 22, w: 128, h: 96 }));
      c.box(3, 2.6, 3, 10, -9, [c.m.wood, c.m.wood, c.m.wood, c.m.wood, c.lam(dacha), c.m.wood]); // баня
      // грядки (плоские) и парник
      for (let i = 0; i < 3; i++) c.decal(c.T.bed, -8 + i * 4, 8, 3.2, 0.01, 0);
      c.box(4, 1.6, 2, 9, 8, new THREE.MeshLambertMaterial({ color: '#8ab0c0', transparent: true, opacity: 0.6 }));
      // забор штакетник по периметру с дырами
      for (let x = -14; x <= 14; x += 3) { if (Math.abs(x - 16) > 2) c.box(2.6, 1.2, 0.2, x, -13, c.m.wood); if (Math.abs(x + 16) > 3) c.box(2.6, 1.2, 0.2, x, 13, c.m.wood); }
      for (let z = -10; z <= 10; z += 3) { if (Math.abs(z + 12) > 2 && Math.abs(z - 11) > 2) c.box(0.2, 1.2, 2.6, -17, z, c.m.wood); if (Math.abs(z) > 2) c.box(0.2, 1.2, 2.6, 17, z, c.m.wood); }
      // стол со скамейками, бочки, дрова
      c.box(3, 0.9, 1.2, 2, -3, c.m.wood); c.box(3, 0.45, 0.4, 2, -1.9, c.m.wood); c.box(3, 0.45, 0.4, 2, -4.1, c.m.wood);
      [[-3, 3], [-14, 4], [13, 4]].forEach(([x, z]) => c.barrel(x, z));
      [[-2, -12], [-1, -12], [-1.5, -11.2]].forEach(([x, z]) => c.box(1, 0.8, 1, x, z, c.m.wood));
      // деревья
      [[-14, -3], [14, -5], [-5, 11.5], [12, 11], [0, -11]].forEach(([x, z]) => c.tree(x, z));
      c.mangal(4, 3); c.lamp(-4, -4); c.lamp(8, -2);
    },
  },
];
