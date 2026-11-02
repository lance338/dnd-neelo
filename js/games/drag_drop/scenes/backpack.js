/**
 * W2 Cragspire: pack Obselda's backpack (Simple drag into, many-to-one).
 * Backpack art comes from the Figma "Backpack" set: Open while packing,
 * Closed-Tent once everything (including the tent) is inside.
 */
const NAMES = { rope: 'Rope', lunchbox: 'Lunch', helmet: 'Headlamp', tent: 'Tent', boots: 'Boots', map: 'Map' };

export default {
  assets: ['img:backpack_tent'],

  async onPlace(game, item, zone) {
    const obselda = game.actor('obselda');
    obselda.hop(0.5);
    zone.pop.velocity += 2;
    if (!game.controller.isComplete) game.say(`${NAMES[item.id] || 'That'}, packed!`, { duration: 1.4, tone: 'cheer' });
  },

  async onComplete(game) {
    const z = game.zone('backpack');
    const obselda = game.actor('obselda');
    await game.wait(0.3);
    z.setArt(game.art('img:backpack_tent'), 'img:backpack_tent');
    z.pop.velocity += 4;
    game.play('snap');
    game.effects.puff(z.x, z.y - 120, 8, '#FFF4DE');
    await game.wait(0.4);
    obselda.hop(1.2);
    game.effects.sparkles(obselda.x.value, obselda.y.value - 160, 18);
    await game.wait(0.8);
  },
};
