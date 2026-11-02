import { VividColors as C } from '../../../constants/vivid_colors.js';
import { star4, hexA, roundRect, wrap, drawArt } from './draw.js';
import { VividTypography as T } from '../../../constants/typography.js';
import { Spring } from '../../../core/motion.js';

const SPARK_COLORS = ['#FFF6B8', '#FFD84A', '#FFFFFF', '#FFB3D9', '#B8F5FF'];
const CONFETTI = ['#FFD84A', '#FF7FA8', '#6C5CE0', '#4CD48A', '#5BD5F5', '#FF9F3D'];

/** Particles + canvas speech/thought bubbles. One pooled component per game. */
export class EffectsComponent {
  constructor(game) {
    this.game = game;
    this.parts = [];
    this.bubbles = [];
  }

  sparkles(x, y, n = 20, colors = SPARK_COLORS, speed = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (120 + Math.random() * 260) * speed;
      this.parts.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 220, life: 0, max: 0.6 + Math.random() * 0.5, r: 6 + Math.random() * 9, c: colors[i % colors.length], rot: Math.random() * 3, vr: (Math.random() - 0.5) * 8 });
    }
  }

  ring(x, y, color = '#FFFFFF', maxR = 160, width = 10, dur = 0.7) {
    this.parts.push({ k: 'ring', x, y, life: 0, max: dur, r: maxR, c: color, w: width });
  }

  puff(x, y, n = 8, color = '#FFFFFF') {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      this.parts.push({ k: 'puff', x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 70 - 20, g: -10, life: 0, max: 0.5 + Math.random() * 0.2, r: 18 + Math.random() * 10, c: color });
    }
  }

  hearts(x, y, n = 6) {
    for (let i = 0; i < n; i++) {
      this.parts.push({ k: 'heart', x: x + (Math.random() - 0.5) * 80, y, vx: (Math.random() - 0.5) * 40, vy: -80 - Math.random() * 80, g: -20, life: 0, max: 1.4 + Math.random() * 0.6, r: 18 + Math.random() * 12, c: i % 2 ? C.gemPink : '#FF6FA8', phase: Math.random() * 6 });
    }
  }

  confetti(n = 90) {
    for (let i = 0; i < n; i++) {
      this.parts.push({ k: 'conf', x: Math.random() * 1162, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160, g: 60, life: 0, max: 4 + Math.random() * 1.5, r: 7 + Math.random() * 7, c: CONFETTI[i % CONFETTI.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, sway: Math.random() * 6 });
    }
  }

  /** Thought bubble above an actor/point. icons: art objects. */
  bubble({ x, y, text = '', icons = [], duration = 4, kind = 'thought', width = 300 }) {
    const b = { x, y, text, icons, life: 0, max: duration, kind, width, s: new Spring(0, 300, 16) };
    b.s.target = 1;
    this.bubbles.push(b);
    return b;
  }

  clearBubbles() {
    this.bubbles.forEach((b) => (b.max = Math.min(b.max, b.life + 0.25)));
  }

  update(dt) {
    this.parts.forEach((p) => {
      p.life += dt;
      if (p.vx != null) {
        p.vy += (p.g || 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
      }
      if (p.vr) p.rot += p.vr * dt;
    });
    this.parts = this.parts.filter((p) => p.life < p.max);
    this.bubbles.forEach((b) => {
      b.life += dt;
      if (b.life > b.max - 0.25) b.s.target = 0;
      b.s.step(dt);
    });
    this.bubbles = this.bubbles.filter((b) => b.life < b.max);
  }

  render(ctx, time) {
    this.parts.forEach((p) => {
      const t = p.life / p.max;
      ctx.save();
      if (p.k === 'spark') {
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = p.c;
        star4(ctx, p.x, p.y, p.r * (1 - t * 0.5), p.rot);
      } else if (p.k === 'ring') {
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = p.w * (1 - t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.2 + t * 0.8), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.k === 'puff') {
        ctx.globalAlpha = (1 - t) * 0.85;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.6 + t * 0.8), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.k === 'heart') {
        ctx.globalAlpha = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.6) / 0.4);
        ctx.fillStyle = p.c;
        heartPath(ctx, p.x + Math.sin(time * 3 + p.phase) * 10, p.y, p.r);
        ctx.fill();
      } else if (p.k === 'conf') {
        ctx.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
        ctx.fillStyle = p.c;
        ctx.translate(p.x + Math.sin(time * 2 + p.sway) * 20, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      }
      ctx.restore();
    });
    this.bubbles.forEach((b) => this._renderBubble(ctx, b));
  }

  _renderBubble(ctx, b) {
    if (b.kind === 'comic') return this._renderComic(ctx, b);
    const s = Math.max(0, b.s.value);
    if (s < 0.02) return;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(s, s);
    ctx.font = `${T.bubble.weight} 22px ${T.family}`;
    const pad = 18;
    const lines = b.text ? wrap(ctx, b.text, b.width - pad * 2) : [];
    const iconSize = 64;
    const iconsW = b.icons.length ? b.icons.length * iconSize + (b.icons.length - 1) * 30 : 0;
    const textW = lines.length ? Math.max(...lines.map((l) => ctx.measureText(l).width)) : 0;
    const w = Math.max(iconsW, textW) + pad * 2;
    const h = (b.icons.length ? iconSize + 10 : 0) + lines.length * 28 + pad * 2 - (lines.length ? 4 : 10);
    const x = -w / 2;
    const y = -h - 34;
    ctx.shadowColor = 'rgba(30,18,70,0.22)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x, y, w, h, 26);
    ctx.fill();
    if (b.kind === 'thought') {
      [[-6, -24, 11], [-16, -8, 7]].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      ctx.beginPath();
      ctx.moveTo(-14, y + h - 2);
      ctx.lineTo(0, -18);
      ctx.lineTo(14, y + h - 2);
      ctx.fill();
    }
    ctx.shadowColor = 'transparent';
    let cy = y + pad;
    if (b.icons.length) {
      let ix = -iconsW / 2 + iconSize / 2;
      b.icons.forEach((ic, i) => {
        if (ic === '→') {
          ctx.fillStyle = C.inkSoft;
          ctx.font = `700 34px ${T.family}`;
          ctx.textAlign = 'center';
          ctx.fillText('→', ix, cy + iconSize / 2 + 12);
        } else drawArt(ctx, ic, ix, cy + iconSize / 2, iconSize);
        ix += iconSize + 30;
      });
      cy += iconSize + 10;
    }
    ctx.fillStyle = C.ink;
    ctx.font = `${T.bubble.weight} 22px ${T.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, 0, cy + i * 28));
    ctx.restore();
  }
}

/**
 * Comic speech bubble (Figma "Speech bubbles"): white, navy outline, rounded,
 * tail pointing down at the speaker. The box slides sideways to stay on screen
 * while the tail keeps pointing at the speaker.
 */
EffectsComponent.prototype._renderComic = function (ctx, b) {
  const s = Math.max(0, b.s.value);
  if (s < 0.02) return;
  const INK = '#2E2858';
  const vr = this.game.visibleRect();
  ctx.save();
  ctx.font = `600 26px ${T.family}`;
  const padX = 30;
  const padY = 22;
  const lh = 34;
  const lines = wrap(ctx, b.text, b.width - padX * 2);
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const w = textW + padX * 2;
  const h = lines.length * lh + padY * 2 - 6;
  const tail = 30;
  const margin = 28;
  let bx = b.x - w / 2;
  bx = Math.max(vr.x + margin, Math.min(vr.x + vr.w - margin - w, bx));
  const by = Math.max(vr.y + margin, b.y - tail - h);
  const tipX = b.x;
  const tipY = by + h + tail;
  const baseX = Math.max(bx + 34, Math.min(bx + w - 34, tipX + (tipX < bx + w / 2 ? 18 : -18)));
  // Pop from the tail tip
  ctx.translate(tipX, tipY);
  ctx.scale(s, s);
  ctx.translate(-tipX, -tipY);
  const r = 34;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.arcTo(bx + w, by, bx + w, by + h, r);
  ctx.arcTo(bx + w, by + h, bx, by + h, r);
  ctx.lineTo(baseX + 16, by + h);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(baseX - 16, by + h);
  ctx.arcTo(bx, by + h, bx, by, r);
  ctx.arcTo(bx, by, bx + w, by, r);
  ctx.closePath();
  ctx.shadowColor = 'rgba(30,18,70,0.25)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + padY + i * lh));
  ctx.restore();
};

export function heartPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.45);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  ctx.closePath();
}

export { hexA };
