import { softGlow } from '../components/draw.js';
import { loadLottie } from '../components/lottie_fx.js';

/**
 * Lantern payoff: the camera zooms in on the lantern that was just lit, the
 * view shakes as light builds up inside it, then it bursts (flash, rays,
 * shockwave, sparkles) and the camera eases back out.
 * Scenes call lanternBurst() from onComplete and drawLanternBurst() from drawFront.
 */
/* ---------- Lottie version (assets/lottie/lantern_burst.json) ---------- */
// The Lottie is 800 x 800 with the flame at the centre. It is drawn relative to
// the tower art (zone size), so the burst keeps the preview's size against the lantern.
const LOTTIE_SCALE = 0.73;
const LOTTIE_BURST_FRAME = 45; // the file's "burst" marker, at 60 fps
const LOTTIE_FRAMES = 150;

/** Lantern burst styles, picked in Tuning > Effects > Lantern burst. All share the same timing. */
export const BURST_STYLES = ['assets/lottie/lantern_burst.json', 'assets/lottie/lantern_burst_bloom.json', 'assets/lottie/lantern_burst_firework.json', 'assets/lottie/lantern_burst_starburst.json', 'assets/lottie/lantern_burst_bubble.json'];

/**
 * Load the Lottie burst into an offscreen canvas. The game draws that canvas
 * at the lantern every frame, so it zooms and shakes with the camera.
 * Resolves null if the player or the file can't load (the code version runs instead).
 */
export function prepareLottieBurst(url = BURST_STYLES[0]) {
  // Bigger effects (Bubble) use a bigger canvas at the same scale, so the offscreen canvas grows with it
  return url.includes('bubble') ? loadLottie(url, 2048) : loadLottie(url, 1024);
}

export async function lanternBurst(game, at, { zoom = 2.2, charge = 0.75, hold = 1.0, lottie = null, refSize = 330, onBurst = null } = {}) {
  const lt = lottie && (await lottie);
  const fx = (game.lanternFx = { at, charge: 0, chargeStart: 0, burstAt: null, lottie: lt, lottieSize: refSize * LOTTIE_SCALE });
  await game.zoomTo(at.x, at.y + 30, zoom, 0.75);
  if (lt) {
    // The Lottie carries the glow, rings, rays and sparkles; the game adds camera shake and sound
    fx.lottieStart = game.time;
    await game.shake(5, LOTTIE_BURST_FRAME / 60, { grow: true });
    // The lantern lights at the moment of the burst
    onBurst?.();
    game.play('ignite');
    game.shake(9, 0.35);
    await game.wait(hold);
    await game.zoomReset(0.85);
    return;
  }
  // Light builds up inside the lantern while everything trembles
  fx.chargeStart = game.time;
  fx.chargeDur = charge;
  await game.shake(5, charge, { grow: true });
  // Burst
  fx.burstAt = game.time;
  onBurst?.();
  game.play('ignite');
  game.shake(9, 0.35);
  game.effects.ring(at.x, at.y, '#FFF3C4', 420, 22, 0.9);
  game.effects.ring(at.x, at.y, '#FFD27A', 260, 12, 0.6);
  game.effects.sparkles(at.x, at.y, 60, undefined, 1.7);
  await game.wait(0.12);
  game.effects.sparkles(at.x, at.y - 20, 30, undefined, 1.1);
  await game.wait(hold);
  await game.zoomReset(0.85);
}

export function drawLanternBurst(game, ctx, t) {
  const fx = game.lanternFx;
  if (!fx) return;
  const { x, y } = fx.at;
  if (fx.lottie) {
    if (fx.lottieStart === undefined) return;
    const frame = (game.time - fx.lottieStart) * 60;
    if (frame >= LOTTIE_FRAMES - 1) {
      game.lanternFx = null;
      return;
    }
    fx.lottie.anim.goToAndStop(frame, true);
    // Files are authored at 800 x 800 for refSize; a wider file (Bubble is 1600) is drawn larger at the same scale
    const size = fx.lottieSize * ((fx.lottie.w || 800) / 800);
    ctx.drawImage(fx.lottie.canvas, x - size / 2, y - size / 2, size, size);
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Charge: a glow that swells and flickers faster and faster
  if (fx.chargeStart && fx.burstAt === null) {
    const k = Math.min(1, (game.time - fx.chargeStart) / fx.chargeDur);
    const flick = 0.85 + 0.15 * Math.sin(t * (14 + 30 * k));
    softGlow(ctx, x, y, 50 + 150 * k * k, '#FFE7A0', (0.3 + 0.7 * k) * flick);
    softGlow(ctx, x, y, 22 + 30 * k, '#FFFFFF', 0.4 + 0.6 * k);
  }
  if (fx.burstAt !== null) {
    const bt = game.time - fx.burstAt;
    // Rays shoot out, then fade
    const fade = Math.max(0, 1 - bt / 1.5);
    if (fade > 0) {
      const len = 700 * (1 - Math.pow(1 - Math.min(1, bt / 0.5), 3));
      ctx.translate(x, y);
      ctx.rotate(bt * 0.35);
      ctx.fillStyle = `rgba(255,243,196,${0.32 * fade})`;
      for (let i = 0; i < 16; i++) {
        ctx.rotate((Math.PI * 2) / 16);
        const w = i % 2 ? 16 : 30;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-w, -len);
        ctx.lineTo(w, -len);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (bt > 4) game.lanternFx = null;
  }
  ctx.restore();
}
