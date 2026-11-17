import { softGlow } from '../components/draw.js';
import { Spring } from '../../../core/motion.js';

/**
 * State change: the force field starts at full strength. Each power core
 * charges up inside the machine (Power Core, State=1..6), fires a beam at the
 * dome and weakens it by one even step; the last core takes it down completely.
 * The dome art shares the background's bounds, so it is drawn with bgRect.
 */
const CORE = [1, 2, 3, 4, 5, 6].map((n) => 'img:power_core_' + n);

export default {
  assets: [...CORE, 'img:ff_dome'],

  init(game) {
    // dome = force field strength, 1 (full) down to 0 (gone)
    game.sceneState = { dome: new Spring(1, 40, 10), beam: 0, origin: null, lit: 0, hit: 0 };
  },

  update(game, dt) {
    const s = game.sceneState;
    s.dome.step(dt);
    if (s.beam > 0) s.beam = Math.max(0, s.beam - dt * 0.8);
    if (s.hit > 0) s.hit = Math.max(0, s.hit - dt * 1.6);
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
    const d = Math.max(0, Math.min(1, s.dome.value));
    if (d > 0.01) {
      // Weaker field = fainter dome; a hit makes it flicker
      const flicker = s.hit > 0 ? 1 - s.hit * (0.5 + 0.5 * Math.sin(t * 55)) : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, (0.15 + 0.85 * d) * flicker);
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
    const s = game.sceneState;
    // Charge the core one stage at a time
    for (let i = 1; i < CORE.length; i++) {
      await game.wait(0.16);
      item.art = game.art(CORE[i]);
      item.squash.value = 0.06;
      game.play('meter', { gain: 0.35, rate: 0.85 + i * 0.07 });
    }
    s.on = true;
    zone.pop.velocity += 2;
    game.effects.ring(zone.x, zone.y - 63, '#FFE7A0', 170, 12, 0.8);
    // The core's energy fires at the dome and weakens it one step
    await game.wait(0.25);
    item.absorb();
    s.beam = 1;
    await game.wait(0.35);
    s.dome.target = 1 - zone.placed.length / zone.capacity;
    s.hit = 1;
    if (s.origin) game.effects.ring(s.origin.cx, s.origin.cy - 80, '#E6FCFF', 260, 10, 0.8);
    if (zone.placed.length < zone.capacity) {
      const cheers = game.level.guide.cheers;
      if (cheers) game.say(cheers[(zone.placed.length - 1) % cheers.length], { duration: 1.6, tone: 'cheer' });
    }
  },

  async onComplete(game) {
    const s = game.sceneState;
    await game.wait(0.3);
    game.play('transform');
    // The field gives out: one last flicker, then it dissolves
    s.hit = 1;
    if (s.origin) {
      game.effects.ring(s.origin.cx, s.origin.cy - 80, '#E6FCFF', 340, 16, 1.2);
      game.effects.sparkles(s.origin.cx, s.origin.cy - 140, 40, ['#FFFFFF', '#B8F5FF', '#8DE3F0'], 1.3);
    }
    await game.wait(1.3);
  },
};
