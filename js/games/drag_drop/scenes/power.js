import { softGlow } from '../components/draw.js';
import { Spring } from '../../../core/motion.js';

/**
 * State change: the power core charges up inside the machine (Power Core,
 * State=1..6), the machine lights up (Power Core Machine, Lit Up) and the
 * force field dome grows over the island.
 * The dome art shares the background's bounds, so it is drawn with bgRect.
 */
const CORE = [1, 2, 3, 4, 5, 6].map((n) => 'img:power_core_' + n);

export default {
  assets: [...CORE, 'img:ff_dome'],

  init(game) {
    game.sceneState = { dome: new Spring(0, 40, 10), beam: 0, origin: null, lit: 0 };
  },

  update(game, dt) {
    const s = game.sceneState;
    s.dome.step(dt);
    if (s.beam > 0) s.beam = Math.max(0, s.beam - dt * 0.8);
    if (s.on) s.lit = Math.min(1, s.lit + dt * 2);
  },

  drawBack(game, ctx, t) {
    const s = game.sceneState;
    const r = game.bgRect;
    const dome = game.art('img:ff_dome');
    if (!r || !dome) return;
    // Dome footprint in the shared bounds (measured from the Figma export)
    const cx = r.x + r.w * 0.505;
    const cy = r.y + r.h * 0.67;
    const radius = r.w * 0.125;
    const d = Math.max(0, s.dome.value);
    if (d < 0.98) {
      ctx.save();
      ctx.globalAlpha = (0.2 + Math.abs(Math.sin(t * 8)) * 0.18) * (1 - d);
      ctx.strokeStyle = '#7FE6F2';
      ctx.setLineDash([18, 16]);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 1.32, 0, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }
    if (d > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.6 * d, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = Math.min(1, d * 1.2);
      ctx.drawImage(dome.img, r.x, r.y, r.w, r.h);
      ctx.restore();
    }
    s.origin = { cx, cy, radius };
  },

  drawMid(game, ctx, t) {
    const s = game.sceneState;
    const z = game.zone('machine');
    if (s.beam > 0 && s.origin) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(150,240,255,${s.beam})`;
      ctx.lineWidth = 16 * s.beam;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(z.x, z.y - 70);
      ctx.quadraticCurveTo((z.x + s.origin.cx) / 2, z.y - 380, s.origin.cx, s.origin.cy - s.origin.radius * 1.2);
      ctx.stroke();
      ctx.restore();
    }
    // The Figma "Lit Up" machine is the same art plus a glow, so the glow is drawn here
    if (s.lit > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      softGlow(ctx, z.x, z.y - 63, 175, '#FFE39A', s.lit * (0.45 + Math.sin(t * 4) * 0.1));
      ctx.restore();
    }
  },

  async onPlace(game, item, zone) {
    // Charge the core one stage at a time
    for (let i = 1; i < CORE.length; i++) {
      await game.wait(0.16);
      item.art = game.art(CORE[i]);
      item.squash.value = 0.06;
      game.play('meter', { gain: 0.35, rate: 0.85 + i * 0.07 });
    }
    game.sceneState.on = true;
    zone.pop.velocity += 2;
    game.effects.ring(zone.x, zone.y - 63, '#FFE7A0', 170, 12, 0.8);
  },

  async onComplete(game) {
    const s = game.sceneState;
    await game.wait(0.3);
    s.beam = 1;
    game.play('transform');
    await game.wait(0.45);
    s.dome.target = 1;
    if (s.origin) {
      game.effects.ring(s.origin.cx, s.origin.cy - 80, '#E6FCFF', 320, 16, 1.2);
      game.effects.sparkles(s.origin.cx, s.origin.cy - 140, 36, ['#FFFFFF', '#B8F5FF', '#8DE3F0'], 1.3);
    }
    await game.wait(1.3);
  },
};
