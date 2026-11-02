import { softGlow } from '../components/draw.js';

/**
 * Lantern payoff: the camera zooms in on the lantern that was just lit, the
 * view shakes as light builds up inside it, then it bursts (flash, rays,
 * shockwave, sparkles) and the camera eases back out.
 * Scenes call lanternBurst() from onComplete and drawLanternBurst() from drawFront.
 */
export async function lanternBurst(game, at, { zoom = 2.2, charge = 0.75, hold = 1.0 } = {}) {
  const fx = (game.lanternFx = { at, charge: 0, chargeStart: 0, burstAt: null });
  await game.zoomTo(at.x, at.y + 30, zoom, 0.75);
  // Light builds up inside the lantern while everything trembles
  fx.chargeStart = game.time;
  fx.chargeDur = charge;
  await game.shake(5, charge, { grow: true });
  // Burst
  fx.burstAt = game.time;
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
