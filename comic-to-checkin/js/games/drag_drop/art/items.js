import { VividColors as C } from '../../../constants/vivid_colors.js';
import { svgDoc, uid, radial, linear } from './svg_kit.js';
import { lighten, darken } from './characters.js';

/* ---------- Simple Drag Onto: Sundrop + Lantern ---------- */

export function sundrop() {
  const g = uid('s');
  const defs = radial(g, [[0, '#FFFBD1'], [0.55, C.sunCore], [1, C.sunEdge]], 0.42, 0.38, 0.62);
  let rays = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = 80 + Math.cos(a) * 62;
    const y = 80 + Math.sin(a) * 62;
    const deg = (a * 180) / Math.PI + 90;
    rays += `<path transform="translate(${x} ${y}) rotate(${deg})" d="M-12 8 Q0 -26 12 8 Z" fill="${C.sunRay}"/>`;
  }
  const body = `${rays}<circle cx="80" cy="80" r="50" fill="${C.sunRay}"/><circle cx="80" cy="80" r="44" fill="url(#${g})"/>
    <ellipse cx="66" cy="62" rx="14" ry="8" transform="rotate(-35 66 62)" fill="#fff" opacity="0.75"/>`;
  return { svg: svgDoc(160, 160, body, defs), w: 160, h: 160 };
}

export function lantern(lit = false) {
  const gGlass = uid('l');
  const gGlow = uid('lg');
  const defs =
    linear(gGlass, lit ? [[0, '#FFE9A8'], [1, '#FFB36B']] : [[0, C.lanternGlass], [1, '#5E5180']]) +
    radial(gGlow, [[0, '#FFF6C9', lit ? 0.95 : 0], [0.5, '#FFC46B', lit ? 0.5 : 0], [1, '#FF9A5A', 0]]);
  const flame = lit
    ? `<path d="M130 268 C 104 240 116 214 130 186 C 144 214 156 240 130 268 Z" fill="${C.flame}"/>
       <path d="M130 266 C 118 250 122 232 130 214 C 138 232 142 250 130 266 Z" fill="${C.flameCore}"/>`
    : `<path d="M130 262 C 122 252 124 242 130 234 C 136 242 138 252 130 262 Z" fill="#8F7FA8" opacity="0.6"/>`;
  const body = `
    <circle cx="130" cy="210" r="170" fill="url(#${gGlow})"/>
    <circle cx="130" cy="22" r="16" fill="${C.lanternDark}"/>
    <rect x="108" y="32" width="44" height="18" rx="9" fill="${C.lanternDark}"/>
    <path d="M42 136 C 42 64 218 64 218 136 Z" fill="${C.lanternBody}"/>
    <path d="M130 58 C 160 72 172 100 176 136 L 130 136 Z" fill="#000" opacity="0.15"/>
    <rect x="30" y="128" width="200" height="22" rx="8" fill="${C.lanternDark}"/>
    <path d="M46 150 L58 300 L202 300 L214 150 Z" fill="url(#${gGlass})"/>
    <path d="M90 150 L94 300 M170 150 L166 300" stroke="${C.lanternDark}" stroke-width="10"/>
    <path d="M46 150 L58 300 M214 150 L202 300" stroke="${C.lanternDark}" stroke-width="12"/>
    <rect x="128" y="270" width="4" height="0" />
    <rect x="114" y="262" width="32" height="38" rx="5" fill="${lit ? '#FFF5D6' : '#BDB2CE'}"/>
    ${flame}
    <rect x="44" y="296" width="172" height="22" rx="8" fill="${C.lanternBody}"/>
    <rect x="30" y="316" width="200" height="28" rx="10" fill="${C.lanternDark}"/>
    <rect x="70" y="344" width="120" height="44" fill="${C.lanternDark}"/>
    ${lit ? '<path d="M60 160 L70 290" stroke="#fff" stroke-width="6" opacity="0.5" stroke-linecap="round"/>' : ''}`;
  return { svg: svgDoc(260, 390, body, defs), w: 260, h: 390 };
}

/* ---------- State Change: Power Core + Machine ---------- */

export function powerCore() {
  const g = uid('c');
  const defs = radial(g, [[0, '#FFB08A'], [0.6, C.core], [1, C.coreRing]], 0.4, 0.35, 0.7);
  const body = `
    <circle cx="80" cy="80" r="74" fill="${C.machine}"/>
    <circle cx="80" cy="80" r="62" fill="url(#${g})"/>
    <circle cx="80" cy="80" r="46" fill="none" stroke="${C.coreBolt}" stroke-width="7" stroke-dasharray="20 12" opacity="0.8"/>
    <path d="M86 44 L62 86 H80 L72 116 L100 70 H82 Z" fill="${C.coreBolt}"/>
    <ellipse cx="60" cy="54" rx="14" ry="7" transform="rotate(-35 60 54)" fill="#fff" opacity="0.5"/>`;
  return { svg: svgDoc(160, 160, body, defs), w: 160, h: 160 };
}

export function machine(on = false) {
  const body = `
    <ellipse cx="200" cy="292" rx="170" ry="14" fill="#000" opacity="0.12"/>
    <rect x="40" y="238" width="80" height="54" rx="24" fill="${C.machine}"/>
    <rect x="280" y="238" width="80" height="54" rx="24" fill="${C.machine}"/>
    <rect x="96" y="250" width="40" height="40" rx="18" fill="${darken(C.machine, 0.15)}"/>
    <rect x="264" y="250" width="40" height="40" rx="18" fill="${darken(C.machine, 0.15)}"/>
    <rect x="70" y="210" width="260" height="44" rx="10" fill="${C.machineMid}"/>
    <rect x="58" y="164" width="284" height="56" rx="8" fill="${C.machineLight}"/>
    <path d="M58 164 h284 v18 h-284z" fill="#6E8790"/>
    <path d="M150 182 h100 l-10 12 h-80z" fill="#6E8790"/>
    <rect x="134" y="138" width="22" height="30" rx="4" fill="#4C5E66"/>
    <rect x="244" y="138" width="22" height="30" rx="4" fill="#4C5E66"/>
    <circle cx="200" cy="96" r="${on ? 88 : 86}" fill="#4C5E66"/>
    <circle cx="200" cy="96" r="70" fill="${on ? '#FFE1B8' : '#33434A'}"/>
    ${on ? '' : '<circle cx="200" cy="96" r="58" fill="none" stroke="#5F7780" stroke-width="5" stroke-dasharray="14 10"/>'}
    <circle cx="96" cy="190" r="7" fill="${on ? C.success : '#9AA9AE'}"/>
    <circle cx="304" cy="190" r="7" fill="${on ? C.success : '#9AA9AE'}"/>`;
  return { svg: svgDoc(400, 310, body), w: 400, h: 310 };
}

/* ---------- Empathy Gem / Consideration Chime ---------- */

export function empathyGem() {
  const g = uid('e');
  const defs = linear(g, [[0, C.gemLight], [0.5, C.gemPink], [1, C.gemPinkDeep]], 0, 0, 1, 1);
  const body = `
    <path d="M75 138 L14 64 C 2 46 14 14 42 14 C 58 14 70 24 75 36 C 80 24 92 14 108 14 C 136 14 148 46 136 64 Z" fill="url(#${g})" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
    <path d="M75 138 L42 60 L75 36 L108 60 Z" fill="#fff" opacity="0.25"/>
    <path d="M14 64 L42 60 L75 138 M136 64 L108 60 L75 138 M42 14 L42 60 M108 14 L108 60" stroke="#fff" stroke-width="2.5" opacity="0.45" fill="none"/>
    <ellipse cx="40" cy="34" rx="10" ry="6" transform="rotate(-30 40 34)" fill="#fff" opacity="0.85"/>`;
  return { svg: svgDoc(150, 150, body, defs), w: 150, h: 150 };
}

export function considerationChime() {
  const g = uid('ch');
  const defs = linear(g, [[0, '#FFF0B8'], [0.5, C.chimeGold], [1, C.chimeGoldDeep]], 0, 0, 1, 0);
  const tube = (x, h) => `<line x1="${x}" y1="38" x2="${x}" y2="52" stroke="#8C6A3A" stroke-width="2.5"/>
    <rect x="${x - 11}" y="52" width="22" height="${h}" rx="11" fill="url(#${g})"/>
    <rect x="${x - 5}" y="58" width="5" height="${h - 14}" rx="2.5" fill="#fff" opacity="0.55"/>`;
  const body = `
    <path d="M80 8 v14" stroke="#8C6A3A" stroke-width="4" stroke-linecap="round"/>
    <circle cx="80" cy="8" r="6" fill="${C.chimeGoldDeep}"/>
    <rect x="20" y="22" width="120" height="18" rx="9" fill="${C.woodDark}"/>
    <rect x="20" y="22" width="120" height="7" rx="3.5" fill="${C.wood}"/>
    ${tube(42, 92)}${tube(80, 120)}${tube(118, 76)}
    <circle cx="80" cy="186" r="9" fill="${C.gemPink}" stroke="#fff" stroke-width="3"/>
    <line x1="80" y1="40" x2="80" y2="177" stroke="#8C6A3A" stroke-width="1.5" opacity="0.6"/>`;
  return { svg: svgDoc(160, 200, body, defs), w: 160, h: 200 };
}

/* ---------- Match: eggs + nests ---------- */

export function egg(color, pattern) {
  const id = uid('egg');
  const base = color;
  const dk = darken(color, 0.22);
  const lt = lighten(color, 0.5);
  let pat = '';
  if (pattern === 'stripes') {
    pat = [30, 54, 78, 100].map((y) => `<path d="M0 ${y} Q50 ${y - 16} 100 ${y}" stroke="${lt}" stroke-width="9" fill="none"/>`).join('');
  } else if (pattern === 'spots') {
    pat = [[30, 40, 9], [62, 30, 7], [70, 62, 11], [36, 78, 8], [60, 98, 9], [24, 104, 5], [80, 92, 5]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dk}"/>`)
      .join('');
  } else if (pattern === 'dots') {
    for (let y = 22; y < 128; y += 16) for (let x = 12 + ((y / 16) % 2) * 8; x < 100; x += 16) pat += `<circle cx="${x}" cy="${y}" r="4" fill="${lt}"/>`;
  } else if (pattern === 'zigzag') {
    pat = [44, 82].map((y) => `<path d="M0 ${y} l12 -12 l12 12 l12 -12 l12 12 l12 -12 l12 12 l12 -12 l12 12" stroke="${dk}" stroke-width="7" fill="none" stroke-linejoin="round"/>`).join('');
  }
  const shape = 'M50 6 C 84 6 96 64 96 86 C 96 112 76 128 50 128 C 24 128 4 112 4 86 C 4 64 16 6 50 6 Z';
  const body = `<clipPath id="${id}"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="${base}"/>
    <g clip-path="url(#${id})">${pat}</g>
    <path d="${shape}" fill="none" stroke="${dk}" stroke-width="4"/>
    <ellipse cx="32" cy="40" rx="9" ry="16" transform="rotate(20 32 40)" fill="#fff" opacity="0.5"/>`;
  return { svg: svgDoc(100, 134, body), w: 100, h: 134 };
}

export function nest() {
  let straws = '';
  for (let i = 0; i < 22; i++) {
    const x = 18 + i * 7;
    straws += `<path d="M${x} ${40 + (i % 3) * 6} q10 20 ${(i % 2 ? 18 : -10)} 34" stroke="${i % 2 ? '#D99A4A' : '#F0C070'}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }
  const body = `<ellipse cx="90" cy="70" rx="86" ry="28" fill="#B8742E"/>
    <ellipse cx="90" cy="50" rx="76" ry="20" fill="#6B4320"/>
    ${straws}
    <path d="M6 62 Q90 104 174 62" stroke="#F3C778" stroke-width="7" fill="none"/>
    <path d="M12 52 Q90 84 168 52" stroke="#E0A24F" stroke-width="5" fill="none"/>`;
  return { svg: svgDoc(180, 100, body), w: 180, h: 100 };
}

/* ---------- Sort: toys + baskets ---------- */

export function ball() {
  const body = `<circle cx="50" cy="50" r="44" fill="#fff" stroke="#2B2140" stroke-width="4"/>
    <path d="M50 30 l18 13 -7 21 h-22 l-7 -21z" fill="#2B2140"/>
    <path d="M50 30 v-24 M68 43 l22 -8 M61 64 l13 18 M39 64 l-13 18 M32 43 l-22 -8" stroke="#2B2140" stroke-width="4"/>`;
  return { svg: svgDoc(100, 100, body), w: 100, h: 100 };
}
export function jumpRope() {
  const body = `<path d="M22 30 C 10 110 110 110 98 30" stroke="#FF7FA8" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="12" y="8" width="20" height="34" rx="9" fill="${C.primary500}"/><rect x="88" y="8" width="20" height="34" rx="9" fill="${C.primary500}"/>
    <rect x="16" y="12" width="5" height="22" rx="2.5" fill="#fff" opacity="0.5"/><rect x="92" y="12" width="5" height="22" rx="2.5" fill="#fff" opacity="0.5"/>`;
  return { svg: svgDoc(120, 110, body), w: 120, h: 110 };
}
export function kite() {
  const body = `<path d="M50 6 L90 50 L50 104 L10 50Z" fill="#FFC94A" stroke="#E08A2E" stroke-width="4" stroke-linejoin="round"/>
    <path d="M50 6 L50 104 M10 50 L90 50" stroke="#E08A2E" stroke-width="3"/>
    <path d="M50 6 L90 50 L50 50Z" fill="#FF8A5B"/><path d="M50 50 L10 50 L50 104Z" fill="#FF8A5B"/>
    <path d="M50 104 q10 10 0 20 q-10 10 0 20" stroke="#2B2266" stroke-width="3" fill="none"/>
    <path d="M44 118 l12 4 M44 132 l12 4" stroke="#FF7FA8" stroke-width="5" stroke-linecap="round"/>`;
  return { svg: svgDoc(100, 150, body), w: 100, h: 150 };
}
export function book() {
  const body = `<path d="M10 20 Q55 6 55 22 V96 Q55 82 10 96Z" fill="#7FD3C8" stroke="#3C9B90" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100 20 Q55 6 55 22 V96 Q55 82 100 96Z" fill="#9EE3DA" stroke="#3C9B90" stroke-width="4" stroke-linejoin="round"/>
    <path d="M20 36 q16 -6 28 -2 M20 50 q16 -6 28 -2 M20 64 q16 -6 28 -2 M64 34 q14 -4 26 2 M64 48 q14 -4 26 2" stroke="#3C9B90" stroke-width="3" fill="none" opacity="0.6"/>`;
  return { svg: svgDoc(110, 110, body), w: 110, h: 110 };
}
export function palette() {
  const body = `<path d="M56 10 C 98 10 108 46 96 66 C 88 80 70 70 64 84 C 58 100 40 104 26 92 C 6 76 8 10 56 10Z" fill="#F7D9A8" stroke="#C9965A" stroke-width="4"/>
    <circle cx="34" cy="38" r="9" fill="#FF6B6B"/><circle cx="58" cy="28" r="9" fill="#FFC94A"/><circle cx="80" cy="40" r="9" fill="#4CD48A"/>
    <circle cx="30" cy="64" r="9" fill="${C.primary500}"/><circle cx="72" cy="66" r="7" fill="#F7D9A8" stroke="#C9965A" stroke-width="3"/>`;
  return { svg: svgDoc(110, 110, body), w: 110, h: 110 };
}
export function crayons() {
  const c = (x, col, rot) => `<g transform="rotate(${rot} ${x + 9} 60)"><rect x="${x}" y="22" width="18" height="70" rx="4" fill="${col}"/><path d="M${x} 22 l9 -16 l9 16z" fill="${darken(col, 0.15)}"/><rect x="${x}" y="40" width="18" height="10" fill="#fff" opacity="0.5"/></g>`;
  const body = c(18, '#FF6B6B', -12) + c(42, '#4CB8FF', 0) + c(66, '#FFC94A', 12);
  return { svg: svgDoc(110, 100, body), w: 110, h: 100 };
}

export function basket(tint = '#E6A35A') {
  let weave = '';
  for (let y = 54; y < 140; y += 16) weave += `<path d="M28 ${y} H172" stroke="${darken(tint, 0.18)}" stroke-width="3" opacity="0.6"/>`;
  for (let x = 40; x < 170; x += 18) weave += `<path d="M${x} 50 L${x + (x - 100) * 0.12} 144" stroke="${darken(tint, 0.18)}" stroke-width="3" opacity="0.4"/>`;
  const body = `<ellipse cx="100" cy="150" rx="78" ry="10" fill="#000" opacity="0.12"/>
    <path d="M14 46 H186 L168 146 Q100 158 32 146Z" fill="${tint}"/>${weave}
    <rect x="8" y="34" width="184" height="24" rx="12" fill="${darken(tint, 0.12)}"/>
    <rect x="14" y="36" width="172" height="8" rx="4" fill="#fff" opacity="0.25"/>`;
  return { svg: svgDoc(200, 165, body), w: 200, h: 165 };
}

/* ---------- Puzzle: bridge planks ---------- */

export function plank() {
  const body = `<rect x="6" y="12" width="208" height="50" rx="10" fill="${C.woodDark}"/>
    <rect x="6" y="8" width="208" height="46" rx="10" fill="${C.wood}"/>
    <path d="M20 22 h70 M110 34 h80 M30 42 h40" stroke="${C.woodDark}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    <rect x="12" y="10" width="196" height="8" rx="4" fill="${C.woodLight}" opacity="0.7"/>
    <circle cx="24" cy="31" r="4.5" fill="#5A3A28"/><circle cx="196" cy="31" r="4.5" fill="#5A3A28"/>`;
  return { svg: svgDoc(220, 70, body), w: 220, h: 70 };
}

/* ---------- Clean Up: debris + big basket ---------- */

export function leafPile(hue = 0) {
  const cols = [['#E8873A', '#C9622A'], ['#F2B23E', '#D08A26'], ['#D9643A', '#AE4628']][hue % 3];
  let leaves = '';
  const pos = [[30, 60, -30], [56, 48, 20], [80, 62, -10], [44, 74, 40], [70, 76, -40], [56, 64, 5]];
  pos.forEach(([x, y, r], i) => {
    const c = cols[i % 2];
    leaves += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -22 C 16 -12 16 12 0 22 C -16 12 -16 -12 0 -22Z" fill="${c}"/><path d="M0 -20 V20" stroke="${darken(c, 0.25)}" stroke-width="2"/></g>`;
  });
  return { svg: svgDoc(110, 110, `<ellipse cx="56" cy="92" rx="44" ry="8" fill="#000" opacity="0.1"/>${leaves}`), w: 110, h: 110 };
}
export function twig() {
  const body = `<path d="M8 70 Q50 50 102 34" stroke="#7A4E32" stroke-width="9" stroke-linecap="round" fill="none"/>
    <path d="M52 52 q4 -20 18 -28 M74 44 q14 6 22 20" stroke="#7A4E32" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M70 24 c10 -8 20 -4 22 4 c-10 6 -18 4 -22 -4z" fill="${C.treeLeaf}"/>`;
  return { svg: svgDoc(110, 90, body), w: 110, h: 90 };
}
export function paperScrap() {
  const body = `<path d="M18 22 L74 12 L90 70 L30 84 Z" fill="#FFFFFF" stroke="#C9C2DE" stroke-width="3"/>
    <path d="M30 36 l38 -7 M33 50 l40 -8 M36 64 l26 -5" stroke="#A9A0CC" stroke-width="3" stroke-linecap="round"/>
    <path d="M74 12 L80 34 L90 70" fill="none" stroke="#C9C2DE" stroke-width="3"/>`;
  return { svg: svgDoc(100, 96, body), w: 100, h: 96 };
}

/* ---------- Right or Wrong: plant the seed ---------- */

export function rock() {
  const body = `<path d="M14 70 C 6 44 30 18 58 20 C 86 22 98 46 92 66 C 86 86 26 92 14 70Z" fill="#9A93AE"/>
    <path d="M24 46 C 34 30 54 26 66 30" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.4" fill="none"/>
    <path d="M60 60 l10 8 M40 66 l6 -6" stroke="#6E6788" stroke-width="4" stroke-linecap="round"/>`;
  return { svg: svgDoc(100, 96, body), w: 100, h: 96 };
}
export function seed() {
  const body = `<path d="M50 8 C 78 24 82 70 50 96 C 18 70 22 24 50 8Z" fill="#7A5236"/>
    <path d="M50 8 C 64 30 64 70 50 96" stroke="#F2D6A8" stroke-width="5" fill="none"/>
    <path d="M50 14 C 38 30 36 60 44 82" stroke="#A9744C" stroke-width="4" fill="none" opacity="0.7"/>
    <ellipse cx="40" cy="32" rx="5" ry="10" fill="#fff" opacity="0.35"/>`;
  return { svg: svgDoc(100, 104, body), w: 100, h: 104 };
}
export function leaf() {
  const body = `<path d="M14 84 C 10 34 50 10 92 12 C 92 54 64 90 14 84Z" fill="${C.treeLeaf}"/>
    <path d="M14 84 C 40 60 60 40 84 20" stroke="#3E8A44" stroke-width="4" fill="none"/>
    <path d="M38 62 l-6 -14 M52 48 l-2 -16 M58 50 l14 2 M44 60 l14 4" stroke="#3E8A44" stroke-width="3" stroke-linecap="round"/>`;
  return { svg: svgDoc(100, 96, body), w: 100, h: 96 };
}
export function dirtHole() {
  const body = `<ellipse cx="130" cy="64" rx="126" ry="40" fill="${C.soil}"/>
    <ellipse cx="130" cy="56" rx="112" ry="30" fill="#9C6A46"/>
    <ellipse cx="130" cy="58" rx="62" ry="18" fill="${C.soilDark}"/>
    <ellipse cx="130" cy="62" rx="44" ry="11" fill="#4A2B18"/>
    <circle cx="40" cy="48" r="5" fill="#B9845C"/><circle cx="214" cy="60" r="6" fill="#B9845C"/><circle cx="196" cy="42" r="4" fill="#B9845C"/>`;
  return { svg: svgDoc(260, 110, body), w: 260, h: 110 };
}
export function sprout(stage = 1) {
  const h = [0, 40, 80, 120][stage];
  const leaves =
    stage >= 1
      ? `<path d="M60 ${140 - h} c-30 -6 -40 -24 -36 -36 c22 0 34 14 36 36z" fill="${C.treeLeaf}"/>
         <path d="M60 ${140 - h} c30 -6 40 -24 36 -36 c-22 0 -34 14 -36 36z" fill="${C.treeLeafLight}"/>`
      : '';
  const bloom =
    stage >= 3
      ? `<g transform="translate(60 ${140 - h - 20})">${[0, 1, 2, 3, 4, 5]
          .map((i) => `<ellipse rx="10" ry="18" transform="rotate(${i * 60}) translate(0 -16)" fill="#FFC94A"/>`)
          .join('')}<circle r="12" fill="#8A5A3C"/></g>`
      : '';
  const body = `<path d="M60 140 V${140 - h}" stroke="#4E9A4A" stroke-width="7" stroke-linecap="round"/>${leaves}${bloom}`;
  return { svg: svgDoc(120, 150, body), w: 120, h: 150 };
}

/** Thought / plan bubble icons used in SEL scenes */
export function heartIcon(color = C.gemPink) {
  return { svg: svgDoc(60, 56, `<path d="M30 52 L6 28 C -2 18 4 4 16 4 C 22 4 27 8 30 13 C 33 8 38 4 44 4 C 56 4 62 18 54 28 Z" fill="${color}"/><ellipse cx="17" cy="15" rx="5" ry="3" fill="#fff" opacity="0.7"/>`), w: 60, h: 56 };
}
