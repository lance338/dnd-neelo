import { VividColors as C } from '../../../constants/vivid_colors.js';

/** Solve the puzzle: planks fill the gaps, then Luma walks the fixed path. */
function post(ctx, x, y) {
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(x - 6, y - 46, 12, 50);
  ctx.fillStyle = C.wood;
  ctx.fillRect(x - 6, y - 46, 5, 50);
  ctx.beginPath();
  ctx.arc(x, y - 48, 8, 0, Math.PI * 2);
  ctx.fillStyle = C.woodDark;
  ctx.fill();
}

export default {
  drawBack(game, ctx) {
    game.zones.forEach((z) => {
      const y = 448;
      const l = z.x - 74;
      const r = z.x + 74;
      if (z.placed.length) {
        ctx.save();
        ctx.strokeStyle = C.rope;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(l, y - 40);
        ctx.quadraticCurveTo(z.x, y - 20, r, y - 40);
        ctx.stroke();
        ctx.restore();
      }
      post(ctx, l, y);
      post(ctx, r, y);
    });
  },

  async onPlace(game, item, zone) {
    game.effects.puff(zone.x, zone.y + 20, 6, '#F7E3C2');
    if (!game.controller.isComplete) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[(zone.placed.length + game.controller.placedIds.size) % cheers.length], { duration: 1.6, tone: 'cheer' });
    }
  },

  async onComplete(game) {
    const luma = game.actor('luma');
    await game.wait(0.4);
    luma.setMood('happy');
    luma.hop(0.8);
    await game.wait(0.5);
    for (const z of game.zones) {
      await luma.walkTo(z.x, null, 0.85);
      const plank = z.placed[0];
      if (plank) {
        plank.squash.value = 0.14;
        game.play('plank', { gain: 0.8 });
      }
    }
    await luma.walkTo(1080, null, 0.8);
    luma.hop(1.3);
    game.effects.sparkles(1080, 330, 30);
    await game.wait(0.5);
  },
};
