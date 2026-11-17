import { VividColors as C } from '../../../constants/vivid_colors.js';
import { VividTypography as T } from '../../../constants/typography.js';
import { roundRect } from '../components/draw.js';
import { ease, clamp } from '../../../core/motion.js';

/** Right or wrong: choose what goes in the hole. The right pick grows. */
export default {
  assets: ['sprout_1', 'sprout_2', 'sprout_3'],

  init(game) {
    game.sceneState = { stage: 0, stageT: 0 };
  },

  update(game, dt) {
    game.sceneState.stageT += dt;
  },

  drawBack(game, ctx) {
    // Choice tray, like the "Choose a Tool" panel in the reference
    ctx.save();
    ctx.shadowColor = 'rgba(30,18,70,0.25)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = C.woodDark;
    roundRect(ctx, 330, 576, 500, 158, 30);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.wood;
    roundRect(ctx, 340, 584, 480, 140, 24);
    ctx.fill();
    [430, 580, 730].forEach((x) => {
      ctx.fillStyle = '#F7E3C2';
      roundRect(ctx, x - 62, 598, 124, 112, 20);
      ctx.fill();
    });
    ctx.fillStyle = C.woodDark;
    roundRect(ctx, 480, 554, 200, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#FFF4DE';
    ctx.font = `700 22px ${T.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Choose one', 580, 576);
    ctx.restore();
  },

  drawMid(game, ctx) {
    const s = game.sceneState;
    if (!s.stage) return;
    const z = game.zone('hole');
    const k = ease.outBack(clamp(s.stageT / 0.6, 0, 1));
    const a = game.art('sprout_' + s.stage);
    const w = 150;
    const h = (w * a.h) / a.w;
    ctx.save();
    ctx.translate(z.x, z.y + 6);
    ctx.scale(1, k);
    ctx.drawImage(a.img, -w / 2, -h, w, h);
    ctx.restore();
  },

  async onComplete(game) {
    const s = game.sceneState;
    const z = game.zone('hole');
    const ziya = game.actor('ziya');
    await game.wait(0.5);
    for (const st of [1, 2, 3]) {
      s.stage = st;
      s.stageT = 0;
      game.effects.sparkles(z.x, z.y - 40 - st * 35, 12, ['#FFFFFF', '#B8FFD6', '#FFE066'], 0.7);
      game.play('meter', { gain: 0.5, rate: 0.9 + st * 0.08 });
      await game.wait(0.7);
    }
    ziya.setMood('happy');
    ziya.hop(1.1);
    game.effects.hearts(ziya.x.value, ziya.y.value - 80, 3);
    await game.wait(0.6);
  },
};
