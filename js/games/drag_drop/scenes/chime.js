/**
 * L5 lesson (Figma comic "Lesson 3", node 4575:838081).
 * Before play: Luma and Ziya each say what they want (comic frames 1 and 2),
 * then Skyrian pops up to set it up and instruct the player (frame 3).
 * The player drags the Consideration Chime between them. Payoff: the chime
 * rings and they share and listen (frames 4 to 7). The finale is Nova
 * (frame 8) then Skyrian (frame 9). All copy lives in the level JSON (story).
 */
export default {
  assets: ['img:soccer_ball', 'img:jump_rope'],

  drawBack(game) {
    const p = game.level.props || {};
    if (p.ball) game.drawKey('img:soccer_ball', p.ball.x, p.ball.y, p.ball.size);
    if (p.rope) game.drawKey('img:jump_rope', p.rope.x, p.rope.y, p.rope.size, { rot: p.rope.rot || 0 });
  },

  async onComplete(game) {
    const luma = game.actor('luma');
    const ziya = game.actor('ziya');
    const chime = game.item('consideration_chime');
    const z = game.zone('between');
    for (let i = 0; i < 3; i++) {
      chime.rot.velocity += i === 0 ? 5 : 2.5;
      game.effects.ring(z.x, z.y - 30, '#FFE08A', 260 + i * 60, 12, 1.2);
      if (i === 0) game.effects.sparkles(z.x, z.y - 40, 26, ['#FFF6B8', '#FFD84A', '#FFFFFF']);
      await game.wait(0.45);
    }
    luma.setMood('soft');
    ziya.setMood('soft');
    await game.wait(0.5);
    // The comic conversation, one beat at a time
    for (const beat of game.level.story?.after || []) {
      await game.talk(beat.who, beat.text, { mood: beat.mood });
      await game.wait(0.25);
    }
    luma.setMood('cheer');
    ziya.setMood('cheer');
    luma.hop(1);
    await game.wait(0.15);
    ziya.hop(1);
    await game.wait(1.2);
  },
};
