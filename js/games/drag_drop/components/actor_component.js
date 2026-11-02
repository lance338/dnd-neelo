import { Spring, Tween, ease } from '../../../core/motion.js';
import { drawArt, shadow } from './draw.js';

/**
 * An NPC in the scene (NpcComponent in Flame). Mood is a sprite swap with a
 * short crossfade. Reactions keep the feet planted: everything scales and
 * tilts around the point between the feet, so an NPC never leaves the ground.
 */
export class ActorComponent {
  constructor(def, arts, game) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.npc = def.npc;
    this.arts = arts; // mood -> art
    this.size = def.size || 180;
    this.mood = def.mood || 'neutral';
    this.prevMood = null;
    this.fade = 1;
    this.x = new Spring(def.x, 120, 20);
    this.y = new Spring(def.y, 120, 20);
    this.cheer = new Spring(0, 260, 9); // stretch up from the feet
    this.tilt = new Spring(0, 160, 7); // side to side wiggle around the feet
    this.tiltDir = 1;
    this.facing = def.facing || 1;
    this.phase = Math.random() * 6;
    this.walk = null;
    this.visible = def.hidden !== true;
    this.appear = new Spring(def.hidden ? 0 : 1, 200, 18);
  }

  setMood(m) {
    if (m === this.mood || !this.arts[m]) return;
    this.prevMood = this.mood;
    this.mood = m;
    this.fade = 0;
  }

  /** Happy reaction: a springy stretch and a wiggle, feet stay on the ground. */
  hop(strength = 1) {
    this.cheer.velocity += 7 * strength;
    this.tiltDir *= -1;
    this.tilt.velocity += 5 * strength * this.tiltDir;
  }

  show() {
    this.visible = true;
    this.appear.target = 1;
  }

  /** Walk with a little step bounce. Resolves when done. */
  walkTo(x, y, duration = 1.2) {
    return new Promise((resolve) => {
      this.walk = { from: { x: this.x.value, y: this.y.value }, to: { x, y: y ?? this.y.value }, tw: new Tween(duration, ease.inOutSine), resolve };
      this.facing = x >= this.x.value ? 1 : -1;
    });
  }

  update(dt) {
    this.fade = Math.min(1, this.fade + dt / 0.35);
    if (this.walk) {
      const w = this.walk;
      w.tw.step(dt);
      const v = w.tw.value;
      this.x.set(w.from.x + (w.to.x - w.from.x) * v);
      this.y.set(w.from.y + (w.to.y - w.from.y) * v);
      if (w.tw.done) {
        this.walk = null;
        w.resolve();
      }
    } else {
      this.x.step(dt);
      this.y.step(dt);
    }
    this.cheer.step(dt);
    this.tilt.step(dt);
    this.appear.step(dt);
  }

  render(ctx, time) {
    if (!this.visible) return;
    const m = this.game.t('ambientMotion');
    const breath = Math.sin(time * 2.2 + this.phase) * 0.018 * m;
    const step = this.walk ? Math.abs(Math.sin(this.walk.tw.t * 12)) * -10 : 0;
    const s = this.appear.value;
    const base = this.arts[this.mood] || this.arts.neutral;
    const h = (this.size * base.h) / base.w;
    const x = this.x.value;
    const feetY = this.y.value + h / 2; // all transforms pivot on the feet
    const c = this.cheer.value;
    const bw = this.size * (base.bodyW || 1); // shadow follows the body, not the padded art
    shadow(ctx, x, this.y.value + h * 0.47, bw * 0.32 * s * (1 + c * 0.04), bw * 0.06 * s, 0.16);
    const opts = {
      scaleX: this.facing * s * (1 - breath * 0.5 - c * 0.06),
      scaleY: s * (1 + breath + c * 0.1),
      rot: this.tilt.value * 0.07,
      anchorY: 1,
    };
    const y = feetY + step;
    if (this.prevMood && this.fade < 1) {
      drawArt(ctx, this.arts[this.prevMood], x, y, this.size, opts);
    }
    drawArt(ctx, this.arts[this.mood], x, y, this.size, { ...opts, alpha: this.prevMood && this.fade < 1 ? this.fade : 1 });
  }
}
