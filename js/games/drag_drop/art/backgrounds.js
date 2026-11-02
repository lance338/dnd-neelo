import { VividColors as C } from '../../../constants/vivid_colors.js';
import { uid, linear, radial, cloud, cloudBank, stars, tree, bush, flower, island } from './svg_kit.js';

/**
 * Backgrounds are authored in STAGE coordinates (0..1162 x 0..806) but extend
 * past the stage so they can "cover" any screen ratio (iPad 4:3 through phone
 * landscape). viewBox starts at (-BX, -BY).
 */
export const BG = { x: -320, y: -60, w: 1802, h: 926 };

function bgDoc(body, defs = '') {
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BG.x} ${BG.y} ${BG.w} ${BG.h}" width="${BG.w}" height="${BG.h}"><defs>${defs}</defs>${body}</svg>`,
    w: BG.w,
    h: BG.h,
    offsetX: BG.x,
    offsetY: BG.y,
  };
}

function skyRect(id) {
  return `<rect x="${BG.x}" y="${BG.y}" width="${BG.w}" height="${BG.h}" fill="url(#${id})"/>`;
}

/* Aetheris night: the L1 intro "sundrop lights the lantern" scene */
export function night() {
  const g = uid('sky');
  const glow = uid('glow');
  const defs =
    linear(g, [[0, C.w1SkyNightTop], [0.45, C.w1SkyNightMid], [0.85, C.w1SkyNightLow], [1, '#F7B2B0']]) +
    radial(glow, [[0, '#B9A8F0', 0.55], [1, '#B9A8F0', 0]]);
  const body = `${skyRect(g)}
    <circle cx="200" cy="140" r="150" fill="url(#${glow})"/>
    ${stars(1162 + 640, 520, 150, 7).replace('<g ', `<g transform="translate(${BG.x} ${BG.y})" `)}
    <path d="M232 92 a62 62 0 1 0 50 104 a50 50 0 1 1 -50 -104z" fill="#FBEFF7"/>
    ${cloud(150, 150, 0.7, C.w1CloudFar, 0.9)}${cloud(470, 60, 0.6, C.w1CloudFar, 0.8)}
    ${cloud(960, 120, 0.9, C.w1CloudFar, 0.85)}${cloud(780, 320, 0.7, C.w1CloudFar, 0.7)}
    ${cloud(1240, 260, 0.8, C.w1CloudFar, 0.8)}${cloud(60, 340, 0.6, C.w1CloudFar, 0.7)}
    ${cloudBank(560, 1500, C.w1Cloud, 11, 1).replace('<g ', `<g transform="translate(${BG.x + 40} 0)" `)}
    ${cloudBank(680, 1500, C.w1CloudDeep, 23, 0.9).replace('<g ', `<g transform="translate(${BG.x} 0)" `)}
    <path d="M456 806 L476 720 Q581 700 686 720 L706 806Z" fill="#B5786A"/>
    <path d="M470 760 h40 M540 744 h50 M610 770 h46 M500 790 h60" stroke="#D8A08E" stroke-width="10" stroke-linecap="round"/>`;
  return bgDoc(body, defs);
}

/* Same scene after the lantern is lit: warm dawn wash, crossfaded in by the scene */
export function dawn() {
  const g = uid('sky');
  const sun = uid('sun');
  const defs =
    linear(g, [[0, C.w1SkyDawnTop], [0.55, '#B9C8F5'], [0.85, C.w1SkyDawnLow], [1, '#FFE2C2']]) +
    radial(sun, [[0, '#FFF3B8', 0.9], [0.4, '#FFD27A', 0.45], [1, '#FFD27A', 0]]);
  const body = `${skyRect(g)}
    <circle cx="581" cy="430" r="520" fill="url(#${sun})"/>
    ${cloud(150, 150, 0.7, '#FFFFFF', 0.85)}${cloud(470, 60, 0.6, '#FFFFFF', 0.8)}
    ${cloud(960, 120, 0.9, '#FFFFFF', 0.85)}${cloud(780, 320, 0.7, '#FFF4EE', 0.8)}
    ${cloud(1240, 260, 0.8, '#FFFFFF', 0.8)}${cloud(60, 340, 0.6, '#FFF4EE', 0.8)}
    ${cloudBank(560, 1500, '#FFD0DA', 11, 1).replace('<g ', `<g transform="translate(${BG.x + 40} 0)" `)}
    ${cloudBank(680, 1500, '#F3B8D8', 23, 0.9).replace('<g ', `<g transform="translate(${BG.x} 0)" `)}
    <path d="M456 806 L476 720 Q581 700 686 720 L706 806Z" fill="#C98A78"/>
    <path d="M470 760 h40 M540 744 h50 M610 770 h46 M500 790 h60" stroke="#E8B4A2" stroke-width="10" stroke-linecap="round"/>`;
  return bgDoc(body, defs);
}

/* Sunny meadow, used by Match (nests) and Sort */
export function meadow() {
  const g = uid('sky');
  const defs = linear(g, [[0, C.daySkyTop], [1, C.daySkyLow]]);
  let trees = '';
  [-200, -110, 60, 150, 980, 1060, 1180, 1290].forEach((x, i) => (trees += tree(x, 410, 150 + (i % 3) * 30)));
  let flowers = '';
  [[60, 700], [200, 760], [360, 690], [820, 720], [980, 690], [1110, 760], [-120, 730], [1300, 700]].forEach(([x, y], i) => {
    flowers += flower(x, y, 1.1, i % 2 ? '#FF9EC4' : '#FFFFFF', '#FFE066');
  });
  const body = `${skyRect(g)}
    ${cloud(160, 120, 0.9, '#fff')}${cloud(640, 70, 0.7, '#fff', 0.9)}${cloud(1040, 140, 1, '#fff')}${cloud(-160, 90, 0.8, '#fff')}${cloud(1380, 80, 0.7, '#fff')}
    <path d="M-340 420 Q 0 300 400 400 T 1200 380 T 1500 400 V 900 H -340Z" fill="${C.hillFar}"/>
    ${trees}
    <path d="M-340 470 Q 200 400 640 450 T 1500 440 V 900 H -340Z" fill="${C.hillNear}"/>
    <path d="M-340 520 Q 300 480 700 510 T 1500 500 V 900 H -340Z" fill="${C.w1Grass}"/>
    ${bush(-60, 520, 1.2)}${bush(1220, 515, 1.1)}
    ${flowers}`;
  return bgDoc(body, defs);
}

/* Aetheris dusk islands for "fix the bridge" (L5 Aerial) */
export function islands() {
  const g = uid('sky');
  const defs = linear(g, [[0, '#33449A'], [0.5, '#7A62AE'], [0.85, '#E59CB4'], [1, '#F7C2C0']]);
  const fall = (x, y, h) => `<rect x="${x}" y="${y}" width="22" height="${h}" fill="${C.w1Water}" opacity="0.85"/><rect x="${x + 5}" y="${y}" width="5" height="${h}" fill="#fff" opacity="0.6"/>`;
  const body = `${skyRect(g)}
    ${stars(1802, 300, 70, 3).replace('<g ', `<g transform="translate(${BG.x} ${BG.y})" `)}
    ${cloud(150, 160, 0.8, '#9A82C6', 0.8)}${cloud(900, 110, 1, '#9A82C6', 0.8)}${cloud(1300, 200, 0.7, '#9A82C6', 0.8)}
    ${cloudBank(690, 1500, '#F4A6B8', 5, 0.8).replace('<g ', `<g transform="translate(${BG.x} 0)" `)}
    ${cloudBank(770, 1500, '#C990C9', 9, 0.7).replace('<g ', `<g transform="translate(${BG.x} 0)" `)}
    ${fall(120, 520, 300)}${fall(500, 520, 260)}${fall(1060, 520, 300)}
    ${island(-340, 440, 600, 70, 70)}
    ${island(380, 440, 182, 70, 70)}
    ${island(684, 440, 182, 70, 70)}
    ${island(988, 440, 560, 70, 70)}
    ${tree(-60, 446, 120)}${tree(30, 446, 100)}${tree(1200, 446, 140)}${tree(1290, 446, 110)}
    <g transform="translate(1110 300)">
      <rect x="-50" y="40" width="100" height="106" fill="#F2D3A0"/>
      <path d="M-62 46 Q0 -40 62 46Z" fill="${C.lanternBody}"/>
      <rect x="-16" y="88" width="32" height="58" rx="16" fill="#E39A3E"/>
      <circle cx="0" cy="-10" r="8" fill="#F2B34A"/>
    </g>`;
  return bgDoc(body, defs);
}

/* Snowy mountain field for the power core / force field (L3 outro) */
export function mountains() {
  const g = uid('sky');
  const defs = linear(g, [[0, '#9ED6EE'], [1, '#D8F1FA']]);
  const body = `${skyRect(g)}
    ${cloud(80, 160, 0.9, '#fff')}${cloud(1080, 120, 1, '#fff')}${cloud(-200, 220, 0.8, '#fff')}${cloud(1360, 190, 0.7, '#fff')}
    <path d="M-340 560 L-60 260 L120 430 L300 180 L560 560Z" fill="#E9F1F3"/>
    <path d="M300 180 L360 250 L330 260 L300 230 L270 270 L240 250Z" fill="#fff"/>
    <path d="M680 560 L960 220 L1240 560Z" fill="#7FA6AE"/>
    <path d="M960 220 L1020 290 L990 300 L960 270 L930 300 L900 290Z" fill="#F7F4F2"/>
    <path d="M1100 560 L1320 300 L1520 560Z" fill="#C9DCE0"/>
    <path d="M-340 560 Q300 520 760 550 T 1500 540 V 900 H -340Z" fill="${C.ground}"/>
    <path d="M-340 640 Q 200 610 700 640 T 1500 630" stroke="#D2CEBB" stroke-width="8" fill="none"/>
    <path d="M700 520 h420 v40 h-420z" fill="#86C9B8" opacity="0.6"/>
    <g transform="translate(850 360)">
      <rect x="0" y="40" width="160" height="120" fill="#5FA3A8"/>
      <rect x="20" y="0" width="120" height="60" fill="#72B5B4"/>
      <rect x="54" y="18" width="36" height="42" rx="18" fill="#2F6E73"/>
      <rect x="24" y="96" width="34" height="64" rx="17" fill="#2F6E73"/>
      <rect x="96" y="70" width="18" height="90" fill="${C.w1Water}"/>
      <path d="M0 40 h160 v10 h-160z" fill="#A8DCCB"/>
    </g>`;
  return bgDoc(body, defs);
}

/* Classroom for the Empathy Gem lesson (L3) */
export function classroom() {
  let books = '';
  const bc = ['#C97B8A', '#5E5690', '#7FC2B8', '#E8A06A', '#8E7BEA'];
  for (let i = 0; i < 5; i++) books += `<rect x="${960 + i * 22}" y="${238 - (i % 2) * 8}" width="18" height="${62 + (i % 2) * 8}" rx="2" fill="${bc[i]}"/>`;
  const body = `<rect x="${BG.x}" y="${BG.y}" width="${BG.w}" height="${BG.h}" fill="#D7ECF6"/>
    <rect x="${BG.x}" y="560" width="${BG.w}" height="400" fill="#C6E0EE"/>
    <rect x="${BG.x}" y="556" width="${BG.w}" height="10" fill="#B0CFE0"/>
    <rect x="-40" y="40" width="560" height="380" rx="8" fill="#6B4A36"/>
    <rect x="-20" y="58" width="520" height="344" rx="4" fill="#3A3A44"/>
    <path d="M40 120 q40 -20 80 0 M60 180 h120 M300 140 q30 30 60 0" stroke="#fff" stroke-width="4" opacity="0.25" fill="none" stroke-linecap="round"/>
    <rect x="900" y="300" width="300" height="12" rx="4" fill="#fff"/>
    <rect x="900" y="200" width="300" height="12" rx="4" fill="#fff" opacity="0"/>
    ${books}
    <rect x="1040" y="250" width="22" height="50" rx="2" fill="#4CB89A"/>
    <path d="M760 0 v40" stroke="#2B2266" stroke-width="4"/><path d="M700 80 Q760 20 820 80Z" fill="#fff"/>
    <ellipse cx="760" cy="82" rx="30" ry="8" fill="#FFE9A8"/>
    <path d="M1230 520 c-40 -40 -30 -120 10 -140 c-10 50 10 80 30 100z" fill="#3E9A6A"/>
    <path d="M1260 520 c30 -60 70 -80 110 -70 c-30 20 -50 50 -60 80z" fill="#54B07A"/>
    <rect x="1200" y="500" width="110" height="70" rx="8" fill="#E9E4F2"/>`;
  return bgDoc(body);
}

/* Schoolyard for the Consideration Chime lesson (L5) */
export function schoolyard() {
  const g = uid('sky');
  const defs = linear(g, [[0, '#8FD3F4'], [1, '#DDF4FF']]);
  let trees = '';
  [-260, -170, -80, 40, 120, 980, 1070, 1160, 1260, 1360].forEach((x, i) => (trees += tree(x, 380, 140 + (i % 3) * 26)));
  const win = (x, y) => `<rect x="${x}" y="${y}" width="52" height="58" rx="3" fill="#BFE6F5" stroke="#fff" stroke-width="6"/><path d="M${x + 26} ${y} v58 M${x} ${y + 29} h52" stroke="#fff" stroke-width="4"/>`;
  const body = `${skyRect(g)}
    ${cloud(120, 110, 0.8, '#fff')}${cloud(1100, 90, 0.9, '#fff')}${cloud(700, 60, 0.6, '#fff', 0.9)}
    <rect x="360" y="-20" width="440" height="400" fill="#F0A33A"/>
    <rect x="360" y="-20" width="440" height="26" fill="#E08A2E"/>
    ${win(400, 30)}${win(480, 30)}${win(560, 30)}${win(640, 30)}${win(720, 30)}
    <rect x="360" y="110" width="440" height="10" fill="#fff" opacity="0.6"/>
    <rect x="430" y="200" width="300" height="180" fill="#D9774C"/>
    <rect x="530" y="270" width="100" height="110" rx="4" fill="#9A4E34"/>
    ${trees}
    <path d="M-340 380 H1500 V900 H-340Z" fill="#7DC459"/>
    <path d="M-340 380 H1500 V400 H-340Z" fill="#5FA845"/>
    <path d="M-340 600 Q 600 560 1500 610" stroke="#8ACF66" stroke-width="40" fill="none" opacity="0.6"/>`;
  return bgDoc(body, defs);
}

/* Garden island for Clean Up and the seed planting */
export function garden() {
  const g = uid('sky');
  const defs = linear(g, [[0, '#A5DDF6'], [1, '#E7F7FF']]);
  let trees = '';
  [-240, -150, 330, 400, 760, 1110, 1200, 1300].forEach((x, i) => (trees += tree(x, 400 - (i % 3) * 6, 130 + (i % 2) * 40)));
  const body = `${skyRect(g)}
    ${cloud(140, 120, 0.9, '#fff')}${cloud(760, 80, 0.8, '#fff')}${cloud(1160, 150, 0.9, '#fff')}
    <path d="M-340 400 Q 200 330 640 390 T 1500 380 V 900 H -340Z" fill="${C.hillFar}"/>
    ${trees}
    <path d="M-340 440 Q 300 400 760 430 T 1500 420 V 900 H -340Z" fill="${C.w1Grass}"/>
    <rect x="-40" y="400" width="14" height="80" fill="#E8D9B8"/><rect x="40" y="400" width="14" height="80" fill="#E8D9B8"/>
    <rect x="120" y="400" width="14" height="80" fill="#E8D9B8"/><rect x="200" y="400" width="14" height="80" fill="#E8D9B8"/>
    <rect x="-60" y="420" width="300" height="10" fill="#E8D9B8"/><rect x="-60" y="452" width="300" height="10" fill="#E8D9B8"/>
    ${bush(1000, 450, 1.2)}${bush(-150, 460, 1)}${bush(560, 430, 0.9, '#8FCB6A')}
    ${[[-80, 760], [130, 790], [900, 770], [1110, 520], [1260, 760], [40, 560]].map(([x, y], i) => flower(x, y, 1.1, i % 2 ? '#FF9EC4' : '#FFFFFF')).join('')}`;
  return bgDoc(body, defs);
}
