import { VividColors as C } from '../../../constants/vivid_colors.js';
import * as I from './items.js';
import * as B from './backgrounds.js';
import { bird, nova, hand } from './characters.js';
import { svgToImage } from './svg_kit.js';

/**
 * Art key -> SVG generator. Level JSON refers to art only by key, exactly as
 * level JSON in the app refers to asset paths. Swapping a stand-in for final
 * art means replacing one entry here with a real SVG file.
 */
export const NPC_DEFS = {
  luma: { body: C.lumaBody, wing: C.lumaWing, accessory: 'lashes' },
  ziya: { body: C.ziyaBody, wing: '#F2B98A', accessory: 'bow', accent: C.ziyaBow },
  parentPink: { body: '#F49AB8', wing: '#FFC9DA', accessory: 'tuft' },
  parentBlue: { body: '#7FC8F0', wing: '#BFE6FA', accessory: 'tuft' },
  parentBrown: { body: '#C98A5A', wing: '#E8B98E', accessory: 'tuft' },
  parentOrange: { body: '#FFAA4A', wing: '#FFD49A', accessory: 'tuft' },
};
const MOODS = ['neutral', 'down', 'cross', 'soft', 'happy'];

const ART = {
  // backgrounds
  'bg:night': () => B.night(),
  'bg:dawn': () => B.dawn(),
  'bg:meadow': () => B.meadow(),
  'bg:islands': () => B.islands(),
  'bg:mountains': () => B.mountains(),
  'bg:classroom': () => B.classroom(),
  'bg:schoolyard': () => B.schoolyard(),
  'bg:garden': () => B.garden(),
  // items
  sundrop: () => I.sundrop(),
  lantern_off: () => I.lantern(false),
  lantern_on: () => I.lantern(true),
  power_core: () => I.powerCore(),
  machine_off: () => I.machine(false),
  machine_on: () => I.machine(true),
  empathy_gem: () => I.empathyGem(),
  consideration_chime: () => I.considerationChime(),
  egg_pink: () => I.egg('#F7A8C4', 'stripes'),
  egg_blue: () => I.egg('#8FD9E8', 'dots'),
  egg_brown: () => I.egg('#E3B888', 'spots'),
  egg_orange: () => I.egg('#FFC24A', 'zigzag'),
  nest: () => I.nest(),
  ball: () => I.ball(),
  jump_rope: () => I.jumpRope(),
  kite: () => I.kite(),
  book: () => I.book(),
  palette: () => I.palette(),
  crayons: () => I.crayons(),
  basket: () => I.basket(),
  basket_pink: () => I.basket('#F0A6BE'),
  basket_gold: () => I.basket('#F2C46A'),
  plank: () => I.plank(),
  leaves_0: () => I.leafPile(0),
  leaves_1: () => I.leafPile(1),
  leaves_2: () => I.leafPile(2),
  twig: () => I.twig(),
  paper: () => I.paperScrap(),
  rock: () => I.rock(),
  seed: () => I.seed(),
  leaf: () => I.leaf(),
  dirt_hole: () => I.dirtHole(),
  sprout_1: () => I.sprout(1),
  sprout_2: () => I.sprout(2),
  sprout_3: () => I.sprout(3),
  heart: () => I.heartIcon(),
  // characters
  nova: () => nova('smile'),
  nova_talk: () => nova('talk'),
  hand: () => hand(),
};
Object.entries(NPC_DEFS).forEach(([name, def]) => {
  MOODS.forEach((m) => {
    ART[`npc:${name}:${m}`] = () => bird({ ...def, mood: m });
  });
});

const cache = new Map();
let manifestP = null;
const manifest = () => (manifestP ||= fetch('assets/img/manifest.json').then((r) => r.json()));

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Missing image ' + src));
    img.src = src;
  });
}

/** Darkened copy of an art image (an unlit lantern, a machine before power). */
function dimmed(art, color = 'rgba(28,18,64,0.55)') {
  const c = document.createElement('canvas');
  c.width = art.img.width;
  c.height = art.img.height;
  const x = c.getContext('2d');
  x.drawImage(art.img, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return { ...art, img: c };
}

/**
 * Real Neelo art exported from Figma lives in assets/img (see manifest.json).
 * Keys: 'img:<name>' loads assets/img/<name>.png|jpg, 'dim:img:<name>' a darkened copy.
 */
async function loadImageArt(key) {
  if (key.startsWith('dim:')) return dimmed(await loadArt(key.slice(4)));
  const name = key.slice(4);
  const m = await manifest();
  const entry = m[name];
  if (!entry) throw new Error('Unknown image art: ' + name);
  const img = await loadImage('assets/img/' + entry.file);
  // Padded exports (raised wings, arms) carry their original frame: the art is
  // sized and anchored by that frame and the overflow is drawn around it.
  if (entry.frame) {
    const [fx, fy, fw, fh] = entry.frame;
    return { img, w: fw, h: fh, frame: { x: fx, y: fy, iw: img.naturalWidth, ih: img.naturalHeight } };
  }
  // NPCs share one Figma frame with margin for arms, so the body is ~40% of the art's width.
  return { img, w: img.naturalWidth, h: img.naturalHeight, bodyW: entry.npcFrame ? 0.4 : 1 };
}

/** URL for hub thumbnails: real art file, or the SVG stand-in as a data URI. */
export function artThumb(key) {
  if (key.startsWith('img:')) return 'assets/img/' + key.slice(4) + '.png';
  const svg = artSvg(key);
  return svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : '';
}

/** Load (rasterize) art by key. Returns { img, w, h, offsetX?, offsetY? }. */
export async function loadArt(key, scale = 2) {
  if (key.startsWith('img:') || key.startsWith('dim:')) {
    if (!cache.has(key)) cache.set(key, loadImageArt(key));
    return cache.get(key);
  }
  const ck = key + '@' + scale;
  if (cache.has(ck)) return cache.get(ck);
  const gen = ART[key];
  if (!gen) throw new Error('Unknown art key: ' + key);
  const def = gen();
  const p = svgToImage(def, scale).then((img) => ({ img, w: def.w, h: def.h, offsetX: def.offsetX || 0, offsetY: def.offsetY || 0 }));
  cache.set(ck, p);
  return p;
}

/** Raw SVG for export / hub thumbnails. */
export function artSvg(key) {
  const gen = ART[key];
  return gen ? gen().svg : null;
}

export const ART_KEYS = Object.keys(ART);
