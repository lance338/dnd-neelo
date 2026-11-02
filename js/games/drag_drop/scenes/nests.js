/** Match the outline: each egg goes to the nest showing its silhouette. */
export default {
  async onPlace(game, item) {
    const color = item.id.split('_')[1];
    const parent = game.actor('parent_' + color);
    if (!parent) return;
    await game.wait(0.05);
    parent.setMood('happy');
    parent.hop(1);
    game.play('npc', { gain: 0.5, rate: 1.05 });
    if (!game.controller.isComplete) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[Math.floor(Math.random() * cheers.length)], { duration: 1.6, tone: 'cheer' });
    }
    await game.wait(1.4);
    if (!game.controller.isComplete) parent.setMood('soft');
  },

  async onComplete(game) {
    for (const a of game.actors) {
      a.setMood('happy');
      a.hop(1.1);
      game.effects.hearts(a.x.value, a.y.value - 80, 3);
      await game.wait(0.14);
    }
    await game.wait(0.8);
  },
};
