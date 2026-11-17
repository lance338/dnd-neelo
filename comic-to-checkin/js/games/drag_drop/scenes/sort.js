/** Grouping / sorting: toys into the basket of the NPC who'd enjoy them. */
const owner = (zone) => (zone.id === 'basket_luma' ? 'luma' : 'ziya');

export default {
  async onPlace(game, item, zone) {
    const a = game.actor(owner(zone));
    a.setMood('happy');
    a.hop(0.8);
    if (!game.controller.isComplete) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[Math.floor(Math.random() * cheers.length)], { duration: 1.6, tone: 'cheer' });
    }
    await game.wait(1.2);
    if (!game.controller.isComplete) a.setMood('soft');
  },

  async onComplete(game) {
    for (const a of game.actors) {
      a.setMood('cheer');
      a.hop(1.2);
      game.effects.hearts(a.x.value, a.y.value - 90, 4);
      await game.wait(0.2);
    }
    await game.wait(0.8);
  },
};
