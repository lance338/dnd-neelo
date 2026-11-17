import { Spring, ease, clamp } from '../../../core/motion.js';
import { drawArt, softGlow, star4, hexA } from '../components/draw.js';

/**
 * W2 Cragspire L1: Pack for the Trail, with a lesson behind every piece of gear
 * (the six Figma "L1 - Lesson Comics", now played in the scene).
 *
 * Each drop runs the same beat:
 *   1. the item lands in the backpack
 *   2. the trail dims, Obselda steps over and the item rises out of the pack
 *      into a spotlight circle (the Figma lesson panel, now in the scene)
 *   3. Obselda says the lesson lines while the item acts each one out
 *      (tap to move on to the next line)
 *   4. the item tucks back into the pack, the trail comes back, play goes on
 *
 * Lines and their animations live in the level JSON (`lessons`), so the script
 * can change without touching code. Animation names are the keys of ANIMS.
 * Scenery drawn inside the circle (weather, footprints, trails) stays up for the
 * rest of that lesson once it appears, unless an animation clears it.
 */

const DISC = { x: 790, y: 380, r: 196, fill: '#C6EDF3', ring: '#FFFFFF' };
const DIM = '#1E2A5E';
const TEACH_X = 360; // where Obselda stands to teach

/* --------------------------- the lesson item --------------------------- */

class LessonItem {
  constructor(art, from) {
    this.art = art;
    this.x = new Spring(from.x, 90, 15);
    this.y = new Spring(from.y, 90, 15);
    this.scale = new Spring(0.3, 170, 13);
    this.rot = new Spring(0, 140, 9);
    this.squash = new Spring(0, 320, 8);
    this.stretch = new Spring(0, 90, 7); // sideways stretch (the rope)
    this.ox = 0; // per-frame offsets from the current animation
    this.oy = 0;
    this.anim = null; // { name, t }
    this.props = {};
    this.size = 250;
  }
  goTo(x, y, scale = this.scale.target) {
    this.x.target = x;
    this.y.target = y;
    this.scale.target = scale;
  }
  update(dt) {
    [this.x, this.y, this.scale, this.rot, this.squash, this.stretch].forEach((s) => s.step(dt));
    if (this.anim) this.anim.t += dt;
    Object.values(this.props).forEach((p) => {
      p.v += (p.target - p.v) * Math.min(1, dt * p.speed);
    });
  }
  /** Ease a scenery value toward a target (0 = gone, 1 = fully shown). */
  prop(name, target, speed = 3) {
    const p = (this.props[name] ||= { v: 0, target: 0, speed });
    p.target = target;
    p.speed = speed;
  }
  pv(name) {
    return this.props[name]?.v || 0;
  }
}

const sparkle = (it, g, n = 14) => g.effects.sparkles(it.x.value, it.y.value, n);
const decay = (t, d) => Math.max(0, 1 - t / d);
const home = (it, scale = 1) => it.goTo(DISC.x, DISC.y, scale);
// Some lessons need the circle for scenery: the item steps to the lower left
const aside = (it) => it.goTo(DISC.x - 105, DISC.y + 95, 0.62);

/** Line animations: `start` runs when the line begins, `frame` every frame it is up. */
const ANIMS = {
  /* generic */
  pop: { start: (it, g) => { it.scale.velocity += 3; it.squash.velocity -= 4; sparkle(it, g); } },
  wiggle: { frame: (it, t) => { it.rot.target = Math.sin(t * 9) * 0.18 * decay(t, 1.6); } },
  shake: { start: (it, g) => g.play('bounce', { gain: 0.5 }), frame: (it, t) => { it.ox = Math.sin(t * 55) * 10 * decay(t, 0.9); } },
  bob: { frame: (it, t) => { it.oy += Math.sin(t * 2.6) * 10; } },
  nod: { start: (it) => { it.rot.velocity -= 3; } },
  shine: { start: (it, g) => { g.effects.ring(it.x.value, it.y.value, '#FFFFFF', 240, 12, 0.9); sparkle(it, g, 20); it.prop('glow', 1, 4); g.play('hit', { gain: 0.5 }); } },

  /* rope: stretches without breaking, then drops a climbing line */
  stretch: { frame: (it, t) => { if (t < 2.4) it.stretch.target = Math.max(0, Math.sin(t * 2.6)) * 0.42; else it.stretch.target = 0; } },
  ropeDrop: { start: (it) => it.prop('rope', 1, 1.4) },

  /* snack box: air pressure pushes, the box expands, then snacks */
  pressure: { start: (it) => it.prop('pressure', 1, 3) },
  expand: { start: (it, g) => { it.scale.target = Math.min(1.32, it.scale.target + 0.16); it.squash.velocity -= 5; g.play('pickup', { gain: 0.5 }); } },
  snack: { start: (it, g) => { it.prop('pressure', 0); home(it, 1); it.prop('snack', 1, 2.5); it.squash.velocity -= 4; g.effects.sparkles(it.x.value, it.y.value - 70, 12); } },

  /* helmet + sunglasses, tent: the weather changes */
  sunny: { start: (it, g) => { it.prop('storm', 0, 2); it.prop('sun', 1, 2); g.effects.ring(it.x.value + 20, it.y.value + 50, '#FFFFFF', 90, 6, 0.5); } },
  storm: { start: (it, g) => { it.prop('sun', 0, 2); it.prop('storm', 1, 1.6); g.shake(4, 0.6); } },
  puddle: { start: (it) => { it.prop('sun', 0, 2); it.prop('storm', 1, 2); it.prop('puddle', 1, 2); }, frame: (it, t) => { it.oy -= Math.abs(Math.sin(t * 5)) * 28 * decay(t, 2.4); } },
  heavy: { start: (it) => { it.y.velocity += 380; it.squash.velocity -= 7; }, frame: (it, t) => { it.oy += 10 * decay(t, 1.2); } },
  shelter: { start: (it) => { it.prop('warm', 1, 2); it.scale.target = 1.12; } },
  calm: { start: (it) => { it.prop('storm', 0, 1.2); it.prop('night', 1, 1.5); } },
  clear: { start: (it, g) => { it.prop('storm', 0, 2); it.prop('night', 0, 1.5); it.prop('warm', 0, 2); it.prop('sun', 1, 1.5); home(it, 1); g.effects.ring(DISC.x, DISC.y, '#FFF4B0', 220, 10, 0.9); } },

  /* boots: grip, slip on ice, step up the slope */
  grip: { start: (it) => it.prop('tread', 1, 3), frame: (it, t) => { it.ox = Math.sin(t * 7) * 26 * decay(t, 1.6); it.rot.target = Math.sin(t * 7) * 0.1 * decay(t, 1.6); } },
  slip: { start: (it) => { it.prop('ice', 1, 3); it.goTo(DISC.x, DISC.y + 10, 0.9); }, frame: (it, t) => { const k = decay(t, 2.2); it.ox = Math.sin(t * 4) * 70 * k; it.rot.target = Math.sin(t * 4 + 0.6) * 0.32 * k; } },
  steps: { start: (it) => { it.prop('ice', 0, 3); it.prop('tread', 0, 3); it.rot.target = 0; aside(it); it.prop('steps', 1, 0.8); } },

  /* map: a trail to the peak, a rockslide, then the other trails */
  route: { start: (it) => { it.goTo(DISC.x - 120, DISC.y + 120, 0.5); it.prop('peak', 1, 2.5); it.prop('route1', 1, 0.9); } },
  rockslide: { start: (it, g) => { it.prop('rocks', 1, 2.2); g.shake(7, 0.7); g.play('bounce', { gain: 0.6 }); } },
  routes: { start: (it) => { it.prop('route2', 1, 0.8); it.prop('route3', 1, 0.6); } },
};

/* --------------------------- scenery inside the circle --------------------------- */

function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  [[0, 0, 34], [32, -14, 30], [62, 2, 26], [-30, 6, 24]].forEach(([dx, dy, r]) => {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
  });
  ctx.fill();
}

function dashedPath(ctx, pts, k, color = '#6B4A2E', width = 9) {
  if (k <= 0.01) return null;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash([2, 20]);
  const segs = pts.length - 1;
  const f = k * segs;
  ctx.beginPath();
  ctx.moveTo(DISC.x + pts[0][0], DISC.y + pts[0][1]);
  let end = pts[0];
  for (let i = 0; i < segs; i++) {
    const u = clamp(f - i, 0, 1);
    if (u <= 0) break;
    const a = pts[i];
    const b = pts[i + 1];
    end = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    ctx.lineTo(DISC.x + end[0], DISC.y + end[1]);
  }
  ctx.stroke();
  ctx.restore();
  return end;
}

/** Behind the item, clipped to the circle. */
function drawBackScenery(ctx, it, t) {
  const x = it.x.value + it.ox;
  const y = it.y.value + it.oy;

  const sun = it.pv('sun');
  if (sun > 0.01) {
    const sx = DISC.x + 108;
    const sy = DISC.y - 112 + (1 - sun) * 60;
    softGlow(ctx, sx, sy, 110, '#FFE58A', sun);
    ctx.save();
    ctx.globalAlpha = sun;
    ctx.strokeStyle = '#FFD84A';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t * 0.4;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 46, sy + Math.sin(a) * 46);
      ctx.lineTo(sx + Math.cos(a) * 62, sy + Math.sin(a) * 62);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFD84A';
    ctx.beginPath();
    ctx.arc(sx, sy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const night = it.pv('night');
  if (night > 0.01) {
    ctx.save();
    ctx.globalAlpha = night * 0.9;
    ctx.fillStyle = '#2B2F6B';
    ctx.fillRect(DISC.x - DISC.r, DISC.y - DISC.r, DISC.r * 2, DISC.r * 2);
    ctx.fillStyle = '#FFF6C8';
    for (let i = 0; i < 10; i++) {
      const a = i * 2.39;
      star4(ctx, DISC.x + Math.cos(a) * (40 + ((i * 41) % 140)), DISC.y - 30 - Math.abs(Math.sin(a)) * 140, (5 + (i % 3) * 3) * (0.7 + 0.3 * Math.sin(t * 3 + i)), 0);
    }
    // crescent moon: a disc with a bite out of it
    ctx.beginPath();
    ctx.arc(DISC.x - 100, DISC.y - 112, 26, 0, Math.PI * 2);
    ctx.arc(DISC.x - 88, DISC.y - 120, 22, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  }

  const storm = it.pv('storm');
  if (storm > 0.01) {
    ctx.save();
    ctx.globalAlpha = storm * 0.35;
    ctx.fillStyle = '#5E6F8C';
    ctx.fillRect(DISC.x - DISC.r, DISC.y - DISC.r, DISC.r * 2, DISC.r * 2);
    ctx.globalAlpha = storm;
    // rain
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const rx = DISC.x - 180 + ((i * 53 + t * 140) % 380);
      const ry = DISC.y - 90 + ((i * 97 + t * 420) % 280);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 10, ry + 24);
      ctx.stroke();
    }
    // wind
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      const wx = DISC.x - 220 + ((t * 260 + i * 150) % 460);
      const wy = DISC.y - 20 + i * 70;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 50, wy - 18, wx + 90, wy);
      ctx.stroke();
    }
    const drift = Math.sin(t * 0.8) * 12;
    cloud(ctx, DISC.x - 70 + drift - (1 - storm) * 120, DISC.y - 120, 1.25, '#8C98B0');
    cloud(ctx, DISC.x + 70 - drift + (1 - storm) * 120, DISC.y - 140, 1.05, '#A9B3C6');
    ctx.restore();
  }

  const puddle = it.pv('puddle');
  if (puddle > 0.01) {
    ctx.save();
    ctx.globalAlpha = puddle;
    ctx.fillStyle = '#7FB6D6';
    ctx.beginPath();
    ctx.ellipse(DISC.x, DISC.y + 150, 120 * puddle, 26 * puddle, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const warm = it.pv('warm');
  if (warm > 0.01) softGlow(ctx, x, y + 40, 170, '#FFC870', warm);

  const glow = it.pv('glow');
  if (glow > 0.01) softGlow(ctx, x, y, 230, '#FFFFFF', glow);

  // Snack box: air pressure arrows pushing in from every side
  const pressure = it.pv('pressure');
  if (pressure > 0.01) {
    ctx.save();
    ctx.globalAlpha = pressure * 0.85;
    ctx.fillStyle = '#5BA9C4';
    const pulse = Math.sin(t * 6) * 8;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const r = 165 - pulse;
      ctx.save();
      ctx.translate(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.rotate(a + Math.PI);
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-8, -14);
      ctx.lineTo(-8, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-26, -5, 20, 10);
      ctx.restore();
    }
    ctx.restore();
  }

  // Boots: ice underfoot, tread marks, then footprints up the slope
  const ice = it.pv('ice');
  if (ice > 0.01) {
    ctx.save();
    ctx.globalAlpha = ice;
    ctx.fillStyle = '#E8FBFF';
    ctx.beginPath();
    ctx.ellipse(DISC.x, DISC.y + 120, 170, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(DISC.x - 90, DISC.y + 112);
    ctx.lineTo(DISC.x - 40, DISC.y + 108);
    ctx.moveTo(DISC.x + 30, DISC.y + 130);
    ctx.lineTo(DISC.x + 90, DISC.y + 124);
    ctx.stroke();
    ctx.restore();
  }
  const tread = it.pv('tread');
  if (tread > 0.01) {
    ctx.save();
    ctx.globalAlpha = tread * 0.5;
    ctx.fillStyle = '#5A4632';
    for (let i = 0; i < 7; i++) ctx.fillRect(DISC.x - 120 + i * 36, DISC.y + 128, 20, 9);
    ctx.restore();
  }
  const steps = it.pv('steps');
  if (steps > 0.01) {
    ctx.save();
    ctx.fillStyle = 'rgba(80,60,40,0.55)';
    const total = 6;
    for (let i = 0; i < total; i++) {
      const k = clamp(steps * total - i, 0, 1);
      if (k <= 0) continue;
      ctx.globalAlpha = k * 0.9;
      ctx.beginPath();
      ctx.ellipse(DISC.x - 60 + i * 46, DISC.y + 90 - i * 40 + (i % 2 ? 14 : -6), 12 * k, 20 * k, -0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Map: the peak, the main trail, a rockslide on it, then the other trails
  const peak = it.pv('peak');
  if (peak > 0.01) {
    ctx.save();
    ctx.globalAlpha = peak;
    const px = DISC.x + 40;
    const py = DISC.y - 140;
    ctx.fillStyle = '#8B6B57';
    ctx.beginPath();
    ctx.moveTo(px - 190, DISC.y + 200);
    ctx.lineTo(px, py);
    ctx.lineTo(px + 200, DISC.y + 200);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(px - 42, py + 50);
    ctx.lineTo(px, py);
    ctx.lineTo(px + 44, py + 52);
    ctx.lineTo(px + 14, py + 40);
    ctx.lineTo(px - 6, py + 58);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const flagK = Math.max(it.pv('route1'), it.pv('route2'), it.pv('route3'));
    if (flagK > 0.9) {
      ctx.fillStyle = '#E2574C';
      ctx.fillRect(px - 2, py - 34, 5, 36);
      ctx.beginPath();
      ctx.moveTo(px + 3, py - 34);
      ctx.lineTo(px + 30, py - 25);
      ctx.lineTo(px + 3, py - 16);
      ctx.fill();
    }
  }
  const top = [40, -132];
  dashedPath(ctx, [[10, 190], [30, 110], [10, 40], [50, -40], top], it.pv('route1'), it.pv('rocks') > 0.5 ? 'rgba(107,74,46,0.45)' : '#6B4A2E');
  dashedPath(ctx, [[-40, 200], [-30, 130], [-80, 60], [-50, -30], top], it.pv('route2'), '#FFFFFF', 8);
  dashedPath(ctx, [[150, 180], [140, 90], [100, 30], [120, -40], top], it.pv('route3'), '#FFFFFF', 8);
  const rocks = it.pv('rocks');
  if (rocks > 0.01) {
    ctx.save();
    ctx.fillStyle = '#5E4A3C';
    [[20, 60, 26], [52, 70, 20], [0, 82, 18], [36, 46, 16]].forEach(([dx, dy, r], i) => {
      const k = clamp(rocks * 1.6 - i * 0.18, 0, 1);
      const fall = (1 - ease.outBack(k)) * 160;
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.beginPath();
      ctx.arc(DISC.x + dx, DISC.y + dy - fall, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

/** In front of the item (not clipped): the climbing rope and the snacks. */
function drawFrontScenery(ctx, it, t) {
  const x = it.x.value + it.ox;
  const y = it.y.value + it.oy;
  const s = it.scale.value;

  const rope = it.pv('rope');
  if (rope > 0.01) {
    ctx.save();
    ctx.lineCap = 'round';
    const len = 330 * rope;
    const sway = Math.sin(t * 2.2) * 14;
    const draw = (color, w) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x + 30 * s, y + 40 * s);
      ctx.bezierCurveTo(x + 50 * s + sway, y + 40 * s + len * 0.4, x + sway, y + 40 * s + len * 0.7, x + 25 + sway * 1.4, y + 40 * s + len);
      ctx.stroke();
    };
    draw('#5A3B2C', 16);
    draw('#F7C21A', 8);
    ctx.restore();
  }

  const snack = it.pv('snack');
  if (snack > 0.01) {
    ctx.save();
    [[-75, '#E2574C', 'round'], [0, '#F5C26B', 'sandwich'], [75, '#7DBE5A', 'round']].forEach(([dx, c, kind], i) => {
      const k = clamp(snack * 1.4 - i * 0.2, 0, 1);
      if (k <= 0) return;
      const sx = x + dx;
      const sy = y - 70 * s - 80 * ease.outBack(k);
      ctx.globalAlpha = k;
      ctx.fillStyle = c;
      if (kind === 'sandwich') {
        ctx.beginPath();
        ctx.moveTo(sx - 32, sy + 18);
        ctx.lineTo(sx + 32, sy + 18);
        ctx.lineTo(sx, sy - 24);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#9CCB5B';
        ctx.fillRect(sx - 24, sy + 4, 48, 6);
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5A3B2C';
        ctx.fillRect(sx - 2, sy - 32, 4, 12);
      }
    });
    ctx.restore();
  }
}

/* --------------------------- the scene --------------------------- */

const NAMES = { rope: 'Rope', lunchbox: 'Snack box', helmet: 'Helmet and sunglasses', tent: 'Tent', boots: 'Boots', map: 'Map' };

export default {
  assets: ['img:backpack_tent'],

  init(game) {
    game.lesson = { dim: new Spring(0, 60, 14), disc: new Spring(0, 180, 15), item: null };
  },

  async onPlace(game, item, zone) {
    game.actor('obselda').hop(0.5);
    zone.pop.velocity += 2;
    const lines = game.level.lessons?.[item.id];
    if (lines?.length) await runLesson(game, item, zone, lines);
    else if (!game.controller.isComplete) game.say(`${NAMES[item.id] || 'That'}, packed!`, { duration: 1.4, tone: 'cheer' });
  },

  async onComplete(game) {
    const z = game.zone('backpack');
    const obselda = game.actor('obselda');
    await game.wait(0.3);
    z.setArt(game.art('img:backpack_tent'), 'img:backpack_tent');
    z.pop.velocity += 4;
    game.play('snap');
    game.effects.puff(z.x, z.y - 120, 8, '#FFF4DE');
    await game.wait(0.4);
    obselda.hop(1.2);
    game.effects.sparkles(obselda.x.value, obselda.y.value - 160, 18);
    await game.wait(0.8);
  },

  update(game, dt, time) {
    const L = game.lesson;
    if (!L) return;
    L.dim.step(dt);
    L.disc.step(dt);
    const it = L.item;
    if (!it) return;
    it.update(dt);
    it.ox = 0;
    it.oy = Math.sin(time * 2) * 6; // idle float
    const a = it.anim && ANIMS[it.anim.name];
    if (a?.frame) a.frame(it, it.anim.t, game);
  },

  /**
   * Over the placed scene: the dim, the circle and its scenery, Obselda again (so
   * she stays lit), then the item. Speech bubbles and particles draw after this.
   */
  drawMid(game, ctx, t) {
    const L = game.lesson;
    if (!L) return;
    const d = clamp(L.dim.value, 0, 1);
    if (d < 0.005 && !L.item) return;
    const vr = game.visibleRect();
    ctx.save();
    ctx.globalAlpha = d * 0.62;
    ctx.fillStyle = DIM;
    ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
    ctx.restore();

    const ds = Math.max(0, L.disc.value);
    if (ds > 0.01) {
      ctx.save();
      softGlow(ctx, DISC.x, DISC.y, DISC.r * 1.5 * ds, '#BFF3FF', 0.55 * d);
      ctx.beginPath();
      ctx.arc(DISC.x, DISC.y, (DISC.r + 16) * ds, 0, Math.PI * 2);
      ctx.fillStyle = DISC.ring;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(DISC.x, DISC.y, DISC.r * ds, 0, Math.PI * 2);
      ctx.fillStyle = DISC.fill;
      ctx.fill();
      if (L.item) {
        ctx.clip();
        drawBackScenery(ctx, L.item, t);
      }
      ctx.restore();
    }

    if (d > 0.01) game.actor('obselda')?.render(ctx, t);

    const it = L.item;
    if (it) {
      const s = it.scale.value;
      const q = it.squash.value;
      const st = it.stretch.value;
      drawArt(ctx, it.art, it.x.value + it.ox, it.y.value + it.oy, it.size, {
        scaleX: s * (1 - q * 0.06 + st),
        scaleY: s * (1 + q * 0.08 - st * 0.35),
        rot: it.rot.value,
        alpha: clamp(s * 3, 0, 1),
      });
      drawFrontScenery(ctx, it, t);
    }
  },
};

/* --------------------------- the sequence --------------------------- */

async function runLesson(game, item, zone, lines) {
  const L = game.lesson;
  const obselda = game.actor('obselda');
  const start = { x: obselda.x.value, facing: obselda.facing };
  game.lock();
  game.hud.lessonMode?.(true);
  const waiting = game.items.filter((i) => i.visible && i.state === 'home');

  // The trail dims, the gear still waiting tucks away, Obselda steps up to teach
  await game.wait(0.45);
  L.dim.target = 1;
  waiting.forEach((i) => (i.scale.target = 0));
  const walk = obselda.walkTo(TEACH_X, null, 0.9);
  await game.wait(0.25);

  // The item rises out of the pack into the spotlight
  const sp = zone.slotPos(item.slot.index);
  const it = new LessonItem(item.art, { x: sp.x, y: sp.y - 30 });
  L.item = it;
  zone.pop.velocity += 3;
  game.play('pickup');
  game.effects.puff(sp.x, sp.y - 20, 6, '#FFF4DE');
  L.disc.target = 1;
  home(it, 1);
  await walk;
  obselda.facing = 1;
  await game.wait(0.35);
  it.squash.velocity -= 4;
  game.effects.ring(DISC.x, DISC.y, '#FFFFFF', DISC.r + 40, 10, 0.7);
  game.play('hit', { gain: 0.6 });
  await game.wait(0.35);

  // The lesson: one line at a time, the item acting each one out
  for (const line of lines) {
    it.prop('glow', 0, 3);
    it.anim = line.anim ? { name: line.anim, t: 0 } : null;
    ANIMS[line.anim]?.start?.(it, game);
    await game.talk('obselda', line.text, { width: 470, hold: 0.7, skippable: true });
  }
  it.anim = null;

  // Back into the pack, the trail comes back
  await game.wait(0.3);
  Object.keys(it.props).forEach((k) => it.prop(k, 0, 6));
  it.stretch.target = 0;
  it.rot.target = 0;
  it.goTo(sp.x, sp.y - 20, 0.3);
  L.disc.target = 0;
  game.play('return');
  await game.wait(0.55);
  game.effects.puff(sp.x, sp.y - 10, 7, '#FFF4DE');
  zone.pop.velocity += 3;
  L.item = null;
  L.dim.target = 0;
  game.hud.lessonMode?.(false);
  const back = obselda.walkTo(start.x, null, 0.9);
  waiting.forEach((i) => (i.scale.target = 1));
  await back;
  obselda.facing = start.facing;
  if (!game.controller.isComplete) {
    game.locked = false;
    game.idleT = 0;
  }
}
