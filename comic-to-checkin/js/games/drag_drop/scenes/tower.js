import { softGlow } from '../components/draw.js';
import { seeded } from '../../../core/motion.js';
import { lanternBurst, drawLanternBurst, prepareLottieBurst, BURST_STYLES } from './lantern_burst.js';

/**
 * L1 Outro: light the Lantern Tower. The tower art has 7 stages in Figma
 * (Lantern Tower, Stage=1..7); every sundrop advances one stage.
 */
const rnd = seeded(7);
const TWINKLES = Array.from({ length: 36 }, () => ({ x: -200 + rnd() * 1560, y: -40 + rnd() * 420, r: 1.2 + rnd() * 2, p: rnd() * 6, s: 1 + rnd() * 2 }));
const STAGES = [1, 2, 3, 4, 5, 6, 7].map((n) => 'img:lantern_tower_' + n);

function prepareBurst(game) {
  const s = game.sceneState;
  const url = BURST_STYLES[game.t('burstStyle')] || BURST_STYLES[0];
  if (s.lottieUrl === url) return;
  s.lottieUrl = url;
  s.lottie = prepareLottieBurst(url);
}

export default {
  assets: STAGES,

  init(game) {
    game.sceneState = { glow: 0, glowTarget: 0 };
    // A level with "burst": "lottie" plays the Lottie version of the lantern burst
    // (style picked in Tuning > Effects > Lantern burst)
    if (game.level.burst === 'lottie') prepareBurst(game);
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
    if (lit && !game.sceneState.litPending) softGlow(ctx, lit.x, lit.y, 90 + 8 * Math.sin(t * 2.2), '#FFE7A0', 0.55);
  },

  onPlace(game, item, zone) {
    const n = zone.placed.length;
    const s = game.sceneState;
    const sp = zone.slotPos(item.slot?.index ?? 0);
    s.lit = sp;
    const lightUp = () => {
      zone.setArt(game.art(STAGES[Math.min(n, 6)]), STAGES[Math.min(n, 6)]);
      // One lantern of six per sundrop, so the glow grows with the tower, not the level
      s.glowTarget = n / (zone.def.stages || zone.capacity);
      s.litPending = false;
    };
    // The last sundrop's lantern stays dark until the burst lights it (see onComplete)
    if (n >= zone.capacity) {
      s.litPending = true;
      s.lightUp = lightUp;
      return;
    }
    lightUp();
    game.effects.ring(sp.x, sp.y, '#FFE7A0', 200, 10, 0.8);
    if (n < zone.capacity) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[(n - 1) % cheers.length], { duration: 1.6, tone: 'cheer' });
    }
  },

  async onComplete(game) {
    const z = game.zone('tower');
    const at = game.sceneState.lit || { x: z.x, y: z.y - 60 };
    // The burst style may have changed in Tuning since the level started
    if (game.level.burst === 'lottie') prepareBurst(game);
    await game.wait(0.2);
    // Zoom in on the lantern, it trembles, then bursts with light
    await lanternBurst(game, at, { lottie: game.sceneState.lottie, refSize: z.size, onBurst: () => game.sceneState.lightUp?.() });
  },

  drawFront(game, ctx, t) {
    drawLanternBurst(game, ctx, t);
  },
};
