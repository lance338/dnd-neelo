/**
 * L3 lesson: the Empathy Gem. Success is Ziya feeling understood, then an
 * invitation she can accept. It is not "make her happy instantly".
 */
export default {
  assets: ['heart'],

  async onComplete(game) {
    const ziya = game.actor('ziya');
    const luma = game.actor('luma');
    const brio = game.actor('brio');
    const zx = ziya.x.value;
    const zy = ziya.y.value;
    game.effects.ring(zx, zy - 40, '#FFB3D9', 220, 14, 1);
    game.effects.hearts(zx, zy - 80, 5);
    await game.wait(0.5);
    game.effects.bubble({ x: zx - 30, y: zy - 190, text: "I want to join in, but I'm not sure how to ask.", icons: [game.art('heart')], duration: 4.4, width: 300 });
    await game.wait(0.6);
    ziya.setMood('soft');
    await game.wait(3.8);
    luma.setMood('soft');
    brio.setMood('neutral');
    await luma.walkTo(zx - 200, null, 1.3);
    luma.setMood('neutral');
    game.effects.bubble({ x: zx - 200, y: luma.y.value - 170, text: 'Want to play with us, Ziya?', kind: 'speech', duration: 3, width: 260 });
    await game.wait(2.2);
    ziya.setMood('happy');
    ziya.hop(1);
    brio.setMood('happy');
    brio.hop(0.8);
    game.effects.hearts(zx - 100, zy - 120, 4);
    await game.wait(0.8);
  },
};
