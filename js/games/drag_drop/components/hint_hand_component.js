import { ease, clamp } from '../../../core/motion.js';
import { drawArt } from './draw.js';

/** Ghost hand that demonstrates the drag after the child has been idle. */
export class HintHandComponent {
  constructor(game, handArt) {
    this.game = game;
    this.art = handArt;
    this.active = false;
  }

  play(item, zone, loops = 2) {
    const to = zone.nextSlotPos();
    this.item = item;
    this.from = { x: item.x.value, y: item.y.value };
    this.to = { x: to.x, y: to.y };
    this.t = 0;
    this.loops = loops;
    this.active = true;
  }

  stop() {
    this.active = false;
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    if (this.t > 2.6) {
      this.loops -= 1;
      this.t = 0;
      if (this.loops <= 0) this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;
    const t = this.t;
    let alpha = clamp(t / 0.3, 0, 1);
    if (t > 2.1) alpha = clamp(1 - (t - 2.1) / 0.4, 0, 1);
    const press = t > 0.3 && t < 1.9 ? 0.88 : 1;
    const p = ease.inOutSine(clamp((t - 0.5) / 1.2, 0, 1));
    const mx = (this.from.x + this.to.x) / 2;
    const my = Math.min(this.from.y, this.to.y) - 120;
    const x = (1 - p) * (1 - p) * this.from.x + 2 * (1 - p) * p * mx + p * p * this.to.x;
    const y = (1 - p) * (1 - p) * this.from.y + 2 * (1 - p) * p * my + p * p * this.to.y;
    if (t > 0.4 && t < 2.0) {
      drawArt(ctx, this.item.art, x, y - 10, this.item.size, { alpha: 0.45 * alpha, scaleX: 1.08, scaleY: 1.08 });
    }
    drawArt(ctx, this.art, x + 34, y + 54, 84, { alpha, scaleX: press, scaleY: press, rot: -0.25 });
  }
}
