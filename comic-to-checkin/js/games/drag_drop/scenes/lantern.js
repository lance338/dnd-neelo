import { softGlow } from '../components/draw.js';
import { seeded } from '../../../core/motion.js';
import { lanternBurst, drawLanternBurst } from './lantern_burst.js';

/**
 * Simple drag onto: sundrops light the lantern.
 * The lantern zone starts as the darkened art ('dim:img:lantern'); each drop
 * fades the lit art in a little more, and the last one fully ignites it.
 */
const rnd = seeded(42);
const TWINKLES = Array.from({ length: 40 }, () => ({ x: -200 + rnd() * 1560, y: -40 + rnd() * 440, r: 1.4 + rnd() * 2, p: rnd() * 6, s: 1 + rnd() * 2 }));

export default {
  assets: ['img:lantern'],

  init(game) {
    game.sceneState = { fill: 0, fillShown: 0, lit: false, rays: 0 };
  },

  update(game, dt) {
    const s = game.sceneState;
    s.fillShown += (s.fill - s.fillShown) * Math.min(1, dt * 4);
    if (s.lit) s.rays = Math.min(1, s.rays + dt * 0.7);
  },

  drawBack(game, ctx, t) {
    const s = game.sceneState;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    TWINKLES.forEach((st) => {
      ctx.globalAlpha = (0.25 + 0.6 * Math.abs(Math.sin(t * st.s * game.t('ambientMotion') + st.p))) * (1 - s.rays * 0.6);
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    if (s.rays > 0) {
      const z = game.zone('lantern');
      const cy = z.y + 20;
      // Warm wash over the whole sky once the lantern is lit
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(z.x, cy, 40, z.x, cy, 900);
      g.addColorStop(0, `rgba(255,214,140,${0.55 * s.rays})`);
      g.addColorStop(0.45, `rgba(255,170,120,${0.22 * s.rays})`);
      g.addColorStop(1, 'rgba(255,170,120,0)');
      ctx.fillStyle = g;
      const vr = game.visibleRect();
      ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
      ctx.restore();
      ctx.save();
      ctx.translate(z.x, cy);
      ctx.rotate(t * 0.06);
      ctx.globalAlpha = 0.09 * s.rays;
      ctx.fillStyle = '#FFF3C4';
      for (let i = 0; i < 14; i++) {
        ctx.rotate((Math.PI * 2) / 14);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-46, -1000);
        ctx.lineTo(46, -1000);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  },

  drawMid(game, ctx, t) {
    const s = game.sceneState;
    if (s.fillShown < 0.01) return;
    const z = game.zone('lantern');
    const flicker = 0.88 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.05;
    const k = s.lit ? 1 : s.fillShown * 0.75 * flicker;
    game.drawKey('img:lantern', z.x, z.y, z.size, { alpha: k });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    softGlow(ctx, z.x, z.y + z.def.slots[0].dy, 60 + 120 * s.fillShown, '#FFC46B', 0.8 * s.fillShown * flicker);
    ctx.restore();
  },

  onPlace(game, item, zone) {
    const s = game.sceneState;
    s.fill = zone.placed.length / zone.capacity;
    if (s.fill < 1) {
      game.effects.ring(zone.x, zone.y + zone.def.slots[0].dy, '#FFE7A0', 150, 10, 0.8);
      const cheers = game.level.guide.cheers;
      game.say(cheers[(zone.placed.length - 1) % cheers.length], { duration: 1.8, tone: 'cheer' });
    }
  },

  async onComplete(game) {
    const s = game.sceneState;
    const z = game.zone('lantern');
    const cy = z.y + z.def.slots[0].dy;
    await game.wait(0.2);
    s.fill = 1;
    // Zoom in on the lantern, it trembles, then bursts with light
    const burst = lanternBurst(game, { x: z.x, y: cy }, { zoom: 1.8 });
    await game.wait(0.75 + 0.75);
    s.lit = true;
    z.pop.velocity += 3;
    await burst;
  },

  drawFront(game, ctx, t) {
    drawLanternBurst(game, ctx, t);
  },
};
