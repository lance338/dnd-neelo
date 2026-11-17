import { seeded } from '../../../core/motion.js';
import { lanternBurst, drawLanternBurst, prepareLottieBurst, BURST_STYLES } from './lantern_burst.js';

/**
 * W5R1P1 L1: help the Everglenians with body stress.
 * The Lantern Tower template, dragged top to bottom: one item (the body stress
 * symbol) onto one target (the three Everglenians, a single actor the zone
 * stays still like the tower). The same payoff plays: zoom in, tremble, burst.
 * At the burst the target swaps from its stressed art to its calm art (doneArt),
 * like a lantern lighting.
 *
 * Level JSON: sceneConfig.layers (art that drifts), sceneConfig.ground (static),
 * a layer with "mirror" repeats flipped past the stage edges so wide screens never
 * see its edge, sceneConfig.slideTo (where the target glides once the intro is over),
 * sceneConfig.burstZoom and sceneConfig.sparkleAt (offsets from the target).
 */
const rnd = seeded(5);
const LEAVES = Array.from({ length: 7 }, () => ({ x: rnd() * 1162, y: rnd() * 680, p: rnd() * 6, s: 16 + rnd() * 18 }));
const MOTES = Array.from({ length: 12 }, () => ({ x: rnd() * 1162, y: rnd() * 680, p: rnd() * 6, r: 2 + rnd() * 3, s: 6 + rnd() * 10 }));

function prepareBurst(game) {
  const s = game.sceneState;
  const url = BURST_STYLES[game.t('burstStyle')] || BURST_STYLES[0];
  if (s.lottieUrl === url) return;
  s.lottieUrl = url;
  s.lottie = prepareLottieBurst(url);
}

/** The target glides to x with an ease-in-out, like a camera move. */
function glide(game, z, x, dur) {
  const from = z.baseX;
  const t0 = game.time;
  game.sceneState.slide = (t) => {
    const k = dur > 0 ? Math.min(1, (t - t0) / dur) : 1;
    z.baseX = from + (x - from) * (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    if (k >= 1) game.sceneState.slide = null;
  };
}

function drawLayer(game, ctx, l, dx = 0) {
  const art = game.art(l.art);
  if (!art) return;
  const w = l.w || 1162;
  const h = (w * art.h) / art.w;
  const x = (l.x || 0) + dx;
  const y = l.y || 0;
  ctx.drawImage(art.img, x, y, w, h);
  if (!l.mirror) return;
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.translate(side < 0 ? x : x + 2 * w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(art.img, 0, 0, w, h);
    ctx.restore();
  });
}

export default {
  assets: [],

  init(game) {
    game.sceneState = { calm: false };

    if (game.level.burst === 'lottie') prepareBurst(game);
  },

  update(game, dt, t) {
    game.sceneState.slide?.(t);
    const z = game.zones[0];
    if (!z) return;
    // The item always sits directly above the target and stays with it if the target moves
    game.items.forEach((it) => {
      it.home.x = z.baseX;
      if (it.state === 'home') it.x.set(it.home.x);
    });
  },

  /**
   * sceneConfig.onBeat { beat, move, x, duration, itemDelay }: when that intro beat shows,
   * the scene gets ready for the drag while the line is still on screen:
   *   move "slide"  the NPCs glide to x (the middle of the screen)
   *   move "camera" the camera pans until x (where the NPCs stand) is in the middle
   *   move "none"   nothing moves
   * then the item pops in. Going back to an earlier beat undoes it and hides the item.
   */
  onIntroBeat(game, i) {
    const p = (game.level.sceneConfig || {}).onBeat;
    if (!p) return;
    const s = game.sceneState;
    const z = game.zones[0];
    const dur = p.move === 'none' ? 0 : p.duration || 1.2;
    if (i >= p.beat && !s.ready) {
      s.ready = true;
      if (p.move === 'camera') game.panTo(p.x, undefined, dur);
      if (p.move === 'slide') {
        s.homeX ??= z.baseX;
        glide(game, z, p.x, dur);
      }
      game.items.forEach((it, k) => (it.appearDelay = dur + (p.itemDelay ?? 0.25) + k * 0.1));
    } else if (i < p.beat && s.ready) {
      s.ready = false;
      if (p.move === 'camera') game.panTo(1162 / 2, undefined, dur);
      if (p.move === 'slide') glide(game, z, s.homeX, dur);
      game.items.forEach((it) => {
        it.appearDelay = 9999;
        it.scale.set(0);
        it.scale.target = 1;
      });
    }
  },

  drawBack(game, ctx, t) {
    const cfg = game.level.sceneConfig || {};
    const m = game.t('ambientMotion');
    // Forest layers drift gently, the far row slower than the near one
    (cfg.layers || []).forEach((l) => drawLayer(game, ctx, l, l.sway ? Math.sin(t * l.sway[1] + (l.phase || 0)) * l.sway[0] * m : 0));
    // Falling leaves and pollen between the trees and the ground
    ctx.save();
    // A wide background repeats the leaves and pollen across its full width
    const spans = cfg.wide ? [-1162, 0] : [0];
    spans.forEach((sx) => {
    LEAVES.forEach((f) => {
      const y = (f.y + t * f.s * m) % 700;
      ctx.save();
      ctx.translate(sx + f.x + Math.sin(t * 0.9 + f.p) * 26, y);
      ctx.rotate(Math.sin(t * 1.4 + f.p) * 0.9);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#9AD8B6';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = '#FFFFFF';
    MOTES.forEach((p) => {
      const y = 690 - ((690 - p.y + t * p.s * m) % 700);
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + p.p);
      ctx.beginPath();
      ctx.arc(sx + p.x + Math.sin(t * 0.6 + p.p) * 10, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    });
    ctx.restore();
    (cfg.ground || []).forEach((l) => drawLayer(game, ctx, l));
  },

  /** Intro done: the Everglenians step into the middle (the Figma drag frame), then the symbol appears. */
  onStart(game) {
    const cfg = game.level.sceneConfig || {};
    const to = cfg.slideTo;
    const z = game.zones[0];
    // One smooth glide to the middle (the Figma drag frame); no idle motion
    if (to && z && Math.abs(z.baseX - to.x) > 1) glide(game, z, to.x, to.duration || 1);
    // Or the camera finishes its move so the NPCs end up in the middle
    if (cfg.panTo) game.panTo(cfg.panTo.x, undefined, cfg.panTo.duration || 0.9);
    // With sceneConfig.onBeat the item already came in during the intro
    if (!cfg.onBeat) game.items.forEach((it, i) => (it.appearDelay = (cfg.itemDelay ?? 1.2) + i * 0.1));
  },

  async onComplete(game) {
    const cfg = game.level.sceneConfig || {};
    const z = game.zones[0];
    const at = { x: z.x, y: z.y };
    if (game.level.burst === 'lottie') prepareBurst(game);
    // burstDelay leaves room for a held guide to leave before the zoom
    await game.wait(cfg.burstDelay ?? 0.2);
    // Zoom in on the Everglenians, they tremble, then the burst calms them
    await lanternBurst(game, at, {
      zoom: cfg.burstZoom || 1.6,
      lottie: game.sceneState.lottie,
      refSize: z.size,
      onBurst: () => {
        game.sceneState.calm = true;
        if (z.def.doneArt) z.setArt(game.art(z.def.doneArt), z.def.doneArt);
        z.pop.vel += 3;
        (cfg.sparkleAt || []).forEach(([dx, dy]) => game.effects.sparkles(z.x + dx, z.y + dy, 12, ['#B8FFD6', '#FFFFFF', '#FFF6B8'], 0.8));
        game.play('transform');
      },
    });
  },

  drawFront(game, ctx, t) {
    drawLanternBurst(game, ctx, t);
  },
};
