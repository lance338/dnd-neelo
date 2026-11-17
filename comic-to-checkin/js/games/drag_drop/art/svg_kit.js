import { VividColors as C } from '../../../constants/vivid_colors.js';
import { seeded } from '../../../core/motion.js';

/**
 * Neelo-style vector stand-ins. All art is authored as SVG so it can be
 * exported straight to assets/images/... and loaded in Flame with Svg.load().
 * Each art function returns { svg, w, h } where w/h is the viewBox size in
 * logical stage units.
 */

export function svgDoc(w, h, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>${body}</svg>`;
}

let _uid = 0;
export const uid = (p = 'g') => `${p}${++_uid}`;

export function linear(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</linearGradient>`;
}

export function radial(id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join('')}</radialGradient>`;
}

/** Puffy flat cloud made of overlapping circles on a flat base. */
export function cloud(x, y, s, fill, opacity = 1) {
  const r = 30 * s;
  return `<g opacity="${opacity}" fill="${fill}">
    <circle cx="${x - r * 1.2}" cy="${y}" r="${r * 0.8}"/>
    <circle cx="${x - r * 0.3}" cy="${y - r * 0.55}" r="${r}"/>
    <circle cx="${x + r * 0.8}" cy="${y - r * 0.25}" r="${r * 0.85}"/>
    <circle cx="${x + r * 1.6}" cy="${y + r * 0.1}" r="${r * 0.6}"/>
    <rect x="${x - r * 2}" y="${y}" width="${r * 4.2}" height="${r * 0.7}" rx="${r * 0.35}"/>
  </g>`;
}

/** Big rolling cloud bank along the bottom of a sky. */
export function cloudBank(y, w, fill, seed, scale = 1) {
  const rnd = seeded(seed);
  let out = `<g fill="${fill}">`;
  let x = -60;
  while (x < w + 80) {
    const r = (60 + rnd() * 70) * scale;
    out += `<circle cx="${x}" cy="${y + rnd() * 30 * scale}" r="${r}"/>`;
    x += r * (0.9 + rnd() * 0.4);
  }
  out += `<rect x="-20" y="${y}" width="${w + 40}" height="${900}"/></g>`;
  return out;
}

export function stars(w, h, count, seed) {
  const rnd = seeded(seed);
  let out = '<g fill="#FFFFFF">';
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 0.8 + rnd() * 1.6;
    const o = 0.4 + rnd() * 0.6;
    if (rnd() > 0.85) {
      const s = r * 2.6;
      out += `<path opacity="${o}" d="M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25}Z"/>`;
    } else {
      out += `<circle opacity="${o}" cx="${x}" cy="${y}" r="${r}"/>`;
    }
  }
  return out + '</g>';
}

/** Neelo tree: tall rounded capsule canopy with a light stripe, like the Figma lesson art. */
export function tree(x, groundY, h, leaf = C.treeLeaf, light = C.treeLeafLight) {
  const w = h * 0.34;
  const top = groundY - h;
  return `<g>
    <rect x="${x - 3}" y="${groundY - h * 0.35}" width="6" height="${h * 0.35}" fill="${C.trunk}"/>
    <rect x="${x - w / 2}" y="${top}" width="${w}" height="${h * 0.78}" rx="${w / 2}" fill="${leaf}"/>
    <rect x="${x - w * 0.12}" y="${top + h * 0.08}" width="${w * 0.24}" height="${h * 0.6}" rx="${w * 0.12}" fill="${light}" opacity="0.55"/>
  </g>`;
}

export function bush(x, y, s, fill = C.hillNear) {
  return `<g fill="${fill}">
    <circle cx="${x - 18 * s}" cy="${y}" r="${18 * s}"/>
    <circle cx="${x + 4 * s}" cy="${y - 10 * s}" r="${24 * s}"/>
    <circle cx="${x + 26 * s}" cy="${y}" r="${17 * s}"/>
    <rect x="${x - 36 * s}" y="${y}" width="${80 * s}" height="${16 * s}" rx="${8 * s}"/>
  </g>`;
}

export function flower(x, y, s, petal = '#FF9EC4', center = '#FFE066') {
  let p = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    p += `<circle cx="${x + Math.cos(a) * 6 * s}" cy="${y + Math.sin(a) * 6 * s}" r="${5 * s}" fill="${petal}"/>`;
  }
  return `<g><rect x="${x - 1.2 * s}" y="${y}" width="${2.4 * s}" height="${16 * s}" fill="${C.w1GrassDark}"/>${p}<circle cx="${x}" cy="${y}" r="${4 * s}" fill="${center}"/></g>`;
}

/** Floating island chunk: grass top + red earth sides + darker underside, Aetheris style. */
export function island(x, y, w, h, depth = 40) {
  return `<g>
    <rect x="${x}" y="${y + 6}" width="${w}" height="${h + depth}" rx="16" fill="${C.w1EarthDark}"/>
    <rect x="${x}" y="${y + 6}" width="${w}" height="${h + depth - 14}" rx="16" fill="${C.w1Earth}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${C.w1Grass}"/>
    <rect x="${x + 8}" y="${y + h - 8}" width="${w - 16}" height="6" rx="3" fill="${C.w1GrassDark}" opacity="0.6"/>
  </g>`;
}

/** Turn an SVG string into an <img> rasterized at `scale` x its viewBox size. */
export function svgToImage({ svg, w, h }, scale = 2) {
  return new Promise((resolve, reject) => {
    const sized = svg.replace(/width="[^"]+" height="[^"]+"/, `width="${w * scale}" height="${h * scale}"`);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
  });
}
