import { roundRect, wrap } from '../components/draw.js';
import { VividTypography as T } from '../../../constants/typography.js';

/**
 * W1 L4: What's Brio Feeling? A right-or-wrong match played in rounds.
 * Each round shows a situation; the child drags the face that fits onto
 * Brio's blank face. Rounds, answers and copy live in the level JSON.
 */
const PANEL = '#475967';
const TITLE = "What's Brio Feeling?";

function startRound(game) {
  const s = game.sceneState;
  const round = game.level.rounds[s.round];
  const zone = game.zone('brio_face');
  zone.accepts = [round.answer];
  zone.def.wrongHint = round.hint;
  s.captionT = 0;
  s.misses = 0;
  // Nova reads the situation aloud (round 1 waits for the intro, see onStart)
  if (s.round > 0) game.speak(round.caption);
}

export default {
  init(game) {
    game.sceneState = { round: 0, captionT: 0, misses: 0 };
    startRound(game);
  },

  onStart(game) {
    game.speak(game.level.rounds[0].caption);
  },

  hintText(game) {
    return game.level.rounds[game.sceneState.round]?.hint;
  },

  update(game, dt) {
    game.sceneState.captionT += dt;
  },

  drawBack(game, ctx) {
    ctx.save();
    ctx.fillStyle = PANEL;
    roundRect(ctx, 70, 108, 1005, 900, 40);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 54px ${T.family}`;
    ctx.fillText(TITLE, 607, 180);
    // Situation caption, fades in each round
    const s = game.sceneState;
    const round = game.level.rounds[s.round];
    if (round) {
      ctx.globalAlpha = Math.min(1, s.captionT / 0.4);
      ctx.font = `600 24px ${T.family}`;
      ctx.fillStyle = '#DCE7EF';
      wrap(ctx, round.caption, 560).forEach((line, i) => ctx.fillText(line, 800, 248 + i * 30));
    }
    ctx.restore();
  },

  async onPlace(game, item, zone) {
    const s = game.sceneState;
    const round = game.level.rounds[s.round];
    const brio = game.actor('brio');
    brio.hop(0.6);
    game.controller.completeRound();
    game.say(round.reveal, { duration: 2.4, tone: 'cheer' });
    s.round += 1;
    if (game.controller.isComplete) return;
    await game.wait(1.9);
    zone.placed = [];
    item.returnHome();
    startRound(game);
  },

  onWrong(game, item) {
    const s = game.sceneState;
    s.misses += 1;
    // Help ladder points at the right face, not the one the child just tried
    if (s.misses >= game.t('missesBeforeAssist')) {
      game.assistItem = game.item(game.level.rounds[s.round].answer);
      game.zone('brio_face').assist = false;
    }
  },

  async onComplete(game) {
    const brio = game.actor('brio');
    await game.wait(0.4);
    brio.hop(1.2);
    game.effects.sparkles(brio.x.value, brio.y.value - 200, 30);
    await game.wait(0.6);
  },
};
