import { VividColors as C } from '../../../constants/vivid_colors.js';
import { svgDoc, uid, radial, linear } from './svg_kit.js';

/**
 * NPC stand-ins in the spirit of Neelo's bird NPCs (Luma, Ziya, Kira).
 * mood: 'neutral' | 'down' | 'cross' | 'soft' | 'happy'
 * Each mood is its own SVG so Flame can swap sprites (or a Rive/Lottie state).
 */
export function bird({ body, wing, belly = '#FFF6EE', accessory = 'tuft', accent = C.ziyaBow, mood = 'neutral', facing = 1 }) {
  const W = 200;
  const H = 240;
  const gB = uid('b');
  const defs = radial(gB, [[0, lighten(body, 0.25)], [1, body]], 0.4, 0.3, 0.8);
  const cx = 100;

  const eyesY = 92;
  const eyeDX = 26;
  const pupilShift = facing * 3;
  let eyes = '';
  if (mood === 'happy') {
    eyes = [cx - eyeDX, cx + eyeDX]
      .map((x) => `<path d="M${x - 13} ${eyesY + 4} Q${x} ${eyesY - 12} ${x + 13} ${eyesY + 4}" stroke="${C.eyeDark}" stroke-width="6" fill="none" stroke-linecap="round"/>`)
      .join('');
  } else {
    const lidDown = mood === 'down' ? 7 : mood === 'cross' ? 5 : 0;
    eyes = [cx - eyeDX, cx + eyeDX]
      .map(
        (x) => `<ellipse cx="${x}" cy="${eyesY}" rx="17" ry="19" fill="${C.eyeWhite}" stroke="${C.eyeDark}" stroke-opacity="0.15" stroke-width="2"/>
      <circle cx="${x + pupilShift}" cy="${eyesY + 3 + (mood === 'down' ? 3 : 0)}" r="10" fill="${C.eyeDark}"/>
      <circle cx="${x + pupilShift + 3}" cy="${eyesY - 1 + (mood === 'down' ? 3 : 0)}" r="3.6" fill="#fff"/>
      ${lidDown ? `<path d="M${x - 18} ${eyesY - 19} h36 v${lidDown + 9} q-18 ${-4} -36 0z" fill="${body}"/>` : ''}`,
      )
      .join('');
  }

  // Brows carry most of the emotion read
  let brows = '';
  const by = eyesY - 26;
  if (mood === 'down') {
    brows = `<path d="M${cx - 40} ${by + 2} q12 -10 24 -4" stroke="${C.eyeDark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
             <path d="M${cx + 40} ${by + 2} q-12 -10 -24 -4" stroke="${C.eyeDark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  } else if (mood === 'cross') {
    brows = `<path d="M${cx - 40} ${by - 6} l24 9" stroke="${C.eyeDark}" stroke-width="5" stroke-linecap="round"/>
             <path d="M${cx + 40} ${by - 6} l-24 9" stroke="${C.eyeDark}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (mood === 'soft') {
    brows = `<path d="M${cx - 38} ${by} q11 -6 22 -2" stroke="${C.eyeDark}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>
             <path d="M${cx + 38} ${by} q-11 -6 -22 -2" stroke="${C.eyeDark}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  }

  const beakY = 112;
  let beak = `<path d="M${cx - 11} ${beakY} Q${cx} ${beakY - 6} ${cx + 11} ${beakY} L${cx} ${beakY + 14} Z" fill="${C.beak}"/>`;
  if (mood === 'happy' || mood === 'soft') {
    beak += `<path d="M${cx - 9} ${beakY + 4} Q${cx} ${beakY + (mood === 'happy' ? 20 : 13)} ${cx + 9} ${beakY + 4}" fill="#E0762B"/>`;
  }
  const cheeks =
    mood === 'happy' || mood === 'soft'
      ? `<ellipse cx="${cx - 46}" cy="${beakY - 2}" rx="11" ry="7" fill="${C.cheek}" opacity="0.7"/><ellipse cx="${cx + 46}" cy="${beakY - 2}" rx="11" ry="7" fill="${C.cheek}" opacity="0.7"/>`
      : `<ellipse cx="${cx - 46}" cy="${beakY - 2}" rx="10" ry="6" fill="${C.cheek}" opacity="0.35"/><ellipse cx="${cx + 46}" cy="${beakY - 2}" rx="10" ry="6" fill="${C.cheek}" opacity="0.35"/>`;

  const wingsOut =
    mood === 'happy'
      ? `<path d="M${cx - 62} 140 q-40 -30 -34 -62 q22 18 40 40z" fill="${wing}"/><path d="M${cx + 62} 140 q40 -30 34 -62 q-22 18 -40 40z" fill="${wing}"/>`
      : `<path d="M${cx - 64} 128 q-26 30 -6 66 q18 -10 24 -40z" fill="${wing}"/><path d="M${cx + 64} 128 q26 30 6 66 q-18 -10 -24 -40z" fill="${wing}"/>`;
  const wingsCrossed = `<g>
      <rect x="${cx - 66}" y="146" width="112" height="32" rx="16" fill="${wing}" transform="rotate(-9 ${cx} 162)"/>
      <rect x="${cx - 46}" y="156" width="112" height="32" rx="16" fill="${darken(wing, 0.1)}" transform="rotate(9 ${cx} 172)"/>
      <path d="M${cx + 52} 166 q14 -2 16 8 M${cx - 58} 154 q-14 0 -14 10" stroke="${darken(wing, 0.25)}" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>`;
  let acc = '';
  if (accessory === 'tuft') {
    acc = `<path d="M${cx - 8} 34 q-6 -26 10 -30 q-2 14 6 18 q4 -16 18 -14 q-10 10 -8 26z" fill="${darken(body, 0.12)}"/>`;
  } else if (accessory === 'bow') {
    acc = `<g transform="translate(${cx} 30)"><path d="M0 0 l-26 -14 q-8 14 0 28z" fill="${accent}"/><path d="M0 0 l26 -14 q8 14 0 28z" fill="${accent}"/><circle r="7" fill="${darken(accent, 0.15)}"/></g>`;
  } else if (accessory === 'lashes') {
    acc = `<path d="M${cx - 48} 70 l-10 -8 M${cx - 42} 66 l-6 -10 M${cx + 48} 70 l10 -8 M${cx + 42} 66 l6 -10" stroke="${C.eyeDark}" stroke-width="3" stroke-linecap="round"/>
           <path d="M${cx - 6} 38 q6 -22 22 -14 q-12 4 -10 18z" fill="${darken(body, 0.15)}"/>`;
  }

  const body_ = `
    <path d="M${cx - 20} ${H - 30} l-10 18 h22z M${cx + 20} ${H - 30} l10 18 h-22z" fill="${C.beak}"/>
    <path d="M${cx} 30 C ${cx + 78} 30 ${cx + 82} 120 ${cx + 72} 170 C ${cx + 60} ${H - 10} ${cx - 60} ${H - 10} ${cx - 72} 170 C ${cx - 82} 120 ${cx - 78} 30 ${cx} 30 Z" fill="url(#${gB})"/>
    <ellipse cx="${cx}" cy="168" rx="46" ry="44" fill="${belly}" opacity="0.85"/>
    ${mood === 'cross' ? '' : wingsOut}
    ${acc}${brows}${eyes}${cheeks}${beak}
    ${mood === 'cross' ? wingsCrossed : ''}`;
  return { svg: svgDoc(W, H, body_, defs), w: W, h: H };
}

/** Nova stand-in: a little aviator guide shown in the round portrait. */
export function nova(mood = 'smile') {
  const W = 160;
  const H = 160;
  const g = uid('n');
  const defs = radial(g, [[0, '#C7B8FF'], [1, '#8E7BEA']], 0.4, 0.3, 0.8) + linear(g + 's', [[0, '#FFB86B'], [1, '#FF8A5B']]);
  const mouth =
    mood === 'talk'
      ? `<ellipse cx="80" cy="112" rx="10" ry="8" fill="#5A2B4A"/><ellipse cx="80" cy="116" rx="6" ry="3" fill="#FF8FA8"/>`
      : `<path d="M66 106 Q80 122 94 106" stroke="#5A2B4A" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const body = `
    <path d="M30 160 Q80 120 130 160Z" fill="url(#${g}s)"/>
    <path d="M44 150 l36 -12 l36 12 l-36 10z" fill="#FFDCA8"/>
    <circle cx="80" cy="88" r="46" fill="url(#${g})"/>
    <path d="M36 70 Q80 22 124 70 Q120 52 80 44 Q40 52 36 70Z" fill="#7A5A3A"/>
    <rect x="44" y="56" width="72" height="16" rx="8" fill="#5A4130"/>
    <circle cx="62" cy="64" r="11" fill="#9FE3FF" stroke="#5A4130" stroke-width="4"/>
    <circle cx="98" cy="64" r="11" fill="#9FE3FF" stroke="#5A4130" stroke-width="4"/>
    <circle cx="59" cy="61" r="3" fill="#fff"/><circle cx="95" cy="61" r="3" fill="#fff"/>
    <ellipse cx="64" cy="92" rx="7" ry="9" fill="#2B2140"/><ellipse cx="96" cy="92" rx="7" ry="9" fill="#2B2140"/>
    <circle cx="66" cy="89" r="2.6" fill="#fff"/><circle cx="98" cy="89" r="2.6" fill="#fff"/>
    <ellipse cx="50" cy="104" rx="8" ry="5" fill="#FF9EB5" opacity="0.7"/><ellipse cx="110" cy="104" rx="8" ry="5" fill="#FF9EB5" opacity="0.7"/>
    ${mouth}`;
  return { svg: svgDoc(W, H, body, defs), w: W, h: H };
}

/** Hint hand (ghost demo of the drag). */
export function hand() {
  const body = `
    <path d="M38 10 c8 0 12 6 12 13 v34 c4 -4 14 -4 16 3 c5 -4 14 -3 16 4 c6 -3 14 0 14 8 v26 c0 24 -14 40 -40 40 c-20 0 -30 -10 -38 -24 l-16 -28 c-4 -8 4 -14 10 -9 l12 12 v-66 c0 -7 6 -13 14 -13z"
      fill="#FFFFFF" stroke="#2B2266" stroke-width="5" stroke-linejoin="round"/>
    <path d="M50 58 v20 M66 62 v18 M82 68 v14" stroke="#2B2266" stroke-width="4" stroke-linecap="round" opacity="0.35"/>`;
  return { svg: svgDoc(120, 150, body), w: 120, h: 150 };
}

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
export function lighten(c, t) {
  return toHex(hex(c).map((v) => v + (255 - v) * t));
}
export function darken(c, t) {
  return toHex(hex(c).map((v) => v * (1 - t)));
}
