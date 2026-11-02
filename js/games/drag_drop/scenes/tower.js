import { softGlow } from '../components/draw.js';
import { seeded } from '../../../core/motion.js';
import { lanternBurst, drawLanternBurst } from './lantern_burst.js';

/**
 * L1 Outro: light the Lantern Tower. The tower art has 7 stages in Figma
 * (Lantern Tower, Stage=1..7); every sundrop advances one stage.
 */
const rnd = seeded(7);
const TWINKLES = Array.from({ length: 36 }, () => ({ x: -200 + rnd() * 1560, y: -40 + rnd() * 420, r: 1.2 + rnd() * 2, p: rnd() * 6, s: 1 + rnd() * 2 }));
const STAGES = [1, 2, 3, 4, 5, 6, 7].map((n) => 'img:lantern_tower_' + n);

export default {
  assets: STAGES,

  init(game) {
    game.sceneState = { glow: 0, glowTarget: 0 };
  },

  update(game, dt) {
    const s = game.sceneState;
    s.glow += (s.glowTarget - s.glow) * Math.min(1, dt * 3);
  },

  drawBack(game, ctx, t) {
    const ownSky = game.level.background?.type === 'nightSky';
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    if (!ownSky) TWINKLES.forEach((st) => {
      ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t * st.s * game.t('ambientMotion') + st.p));
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    const z = game.zone('tower');
    softGlow(ctx, z.x, z.y - 40, 260 + 160 * game.sceneState.glow, '#FFD98A', 0.15 + 0.5 * game.sceneState.glow);
    // The lantern that was just lit glows on its own
    const lit = game.sceneState.lit;
    if (lit) softGlow(ctx, lit.x, lit.y, 90 + 8 * Math.sin(t * 2.2), '#FFE7A0', 0.55);
  },

  onPlace(game, item, zone) {
    const n = zone.placed.length;
    zone.setArt(game.art(STAGES[Math.min(n, 6)]), STAGES[Math.min(n, 6)]);
    // One lantern of six per sundrop, so the glow grows with the tower, not the level
    game.sceneState.glowTarget = n / (zone.def.stages || zone.capacity);
    const sp = zone.slotPos(item.slot?.index ?? 0);
    game.sceneState.lit = sp;
    game.effects.ring(sp.x, sp.y, '#FFE7A0', 200, 10, 0.8);
    if (n < zone.capacity) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[(n - 1) % cheers.length], { duration: 1.6, tone: 'cheer' });
    }
  },

  async onComplete(game) {
    const z = game.zone('tower');
    const at = game.sceneState.lit || { x: z.x, y: z.y - 60 };
    await game.wait(0.2);
    // Zoom in on the lantern, it trembles, then bursts with light
    await lanternBurst(game, at);
  },

  drawFront(game, ctx, t) {
    drawLanternBurst(game, ctx, t);
  },
};
