/**
 * Game-agnostic progress + attempt tracking (maps to lib/games/common/
 * game_controller.dart). Never touched by components, only by the game.
 */
export class GameController {
  constructor(level) {
    this.level = level;
    this.reset();
  }

  reset() {
    this.placedIds = new Set();
    this.roundsDone = 0;
    this.attempts = []; // { itemId, zoneId, correct, t }
    this.hints = 0; // taps on Nova for help
    this.startedAt = performance.now();
    this.completedAt = null;
  }

  get requiredIds() {
    return this.level.items.filter((i) => i.required !== false).map((i) => i.id);
  }

  get progress() {
    if (this.level.rounds) return this.roundsDone / this.level.rounds.length;
    const req = this.requiredIds;
    if (!req.length) return 0;
    return req.filter((id) => this.placedIds.has(id)).length / req.length;
  }

  get isComplete() {
    return this.progress >= 1;
  }

  /** Multi-round levels (one drop per round) call this when a round is solved. */
  completeRound() {
    this.roundsDone += 1;
    if (this.isComplete && !this.completedAt) this.completedAt = performance.now();
  }

  recordAttempt(itemId, zoneId, correct) {
    this.attempts.push({ itemId, zoneId, correct, t: (performance.now() - this.startedAt) / 1000 });
  }

  markPlaced(itemId) {
    this.placedIds.add(itemId);
    if (this.level.rounds) return;
    if (this.isComplete && !this.completedAt) this.completedAt = performance.now();
  }

  /** Summary for analytics (Amplitude in the app). */
  summary() {
    const wrong = this.attempts.filter((a) => !a.correct).length;
    return {
      levelId: this.level.id,
      template: this.level.template,
      seconds: this.completedAt ? Math.round((this.completedAt - this.startedAt) / 100) / 10 : null,
      drops: this.attempts.length,
      wrongDrops: wrong,
      hints: this.hints,
      firstTryAccuracy: this.attempts.length ? Math.round(((this.attempts.length - wrong) / this.attempts.length) * 100) : 100,
    };
  }
}
