import { ease, clamp } from '../../../core/motion.js';
import { VividColors as C } from '../../../constants/vivid_colors.js';

/** Clean up: every piece tidied grows a flower where it used to be. */
const PETALS = ['#FF9EC4', '#FFFFFF', '#FFC94A', '#B9A8F0', '#FF8A5B', '#8FD9E8'];

function flower(ctx, x, y, h, k, color) {
  // stem
  ctx.strokeStyle = '#4E9A4A';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h * k);
  ctx.stroke();
  // leaves
  ctx.fillStyle = C.treeLeaf;
  const ly = y - h * k * 0.45;
  ctx.beginPath();
  ctx.ellipse(x - 12 * k, ly, 14 * k, 6 * k, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 12 * k, ly - 6, 14 * k, 6 * k, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // bloom
  const bk = clamp((k - 0.55) / 0.45, 0, 1);
  if (bk <= 0) return;
  const cx = x;
  const cy = y - h * k;
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 12 * bk, cy + Math.sin(a) * 12 * bk, 10 * bk, 7 * bk, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFE066';
  ctx.beginPath();
  ctx.arc(cx, cy, 8 * bk, 0, Math.PI * 2);
  ctx.fill();
}

export default {
  init(game) {
    game.sceneState = { blooms: [] };
  },

  update(game, dt) {
    game.sceneState.blooms.forEach((b) => (b.t += dt));
  },

  drawBack(game, ctx, t) {
    game.sceneState.blooms.forEach((b) => {
      const k = ease.outBack(clamp(b.t / 0.9, 0, 1));
      const sway = Math.sin(t * 1.6 + b.x) * 0.04 * game.t('ambientMotion');
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(sway);
      flower(ctx, 0, 0, 62, k, b.c);
      ctx.restore();
    });
  },

  async onPlace(game, item) {
    const i = game.sceneState.blooms.length;
    game.sceneState.blooms.push({ x: item.home.x, y: item.home.y + 30, t: -0.15, c: PETALS[i % PETALS.length] });
    game.effects.sparkles(item.home.x, item.home.y, 10, ['#FFFFFF', '#B8FFD6', '#FFE066'], 0.6);
    if (!game.controller.isComplete) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[i % cheers.length], { duration: 1.4, tone: 'cheer' });
    }
  },

  async onComplete(game) {
    await game.wait(0.6);
    game.sceneState.blooms.forEach((b, i) => {
      game.effects.sparkles(b.x, b.y - 60, 8);
    });
    game.play('transform');
    await game.wait(0.9);
  },
};
