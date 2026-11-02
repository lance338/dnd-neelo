import { Spring, clamp, dist } from '../../../core/motion.js';
import { Dimens } from '../../../constants/dimens.js';
import { drawArt, shadow, softGlow } from './draw.js';
import { VividColors as C } from '../../../constants/vivid_colors.js';

/**
 * A draggable thing (DraggableItemComponent in Flame: PositionComponent +
 * DragCallbacks + TapCallbacks). Reads tuning through the game facade only.
 */
export class ItemComponent {
  constructor(def, art, game) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.tags = def.tags || [def.id];
    this.required = def.required !== false;
    this.hint = def.hint || null;
    this.art = art;
    this.size = def.size || 110;
    this.home = { x: def.x, y: def.y };
    this.x = new Spring(def.x);
    this.y = new Spring(def.y);
    this.scale = new Spring(0);
    this.scale.target = 1;
    this.rot = new Spring(def.rot || 0, 300, 22);
    this.squash = new Spring(0, 380, 9);
    this.alpha = 1;
    this.dim = new Spring(0, 200, 25);
    this.lift = new Spring(0, 400, 26);
    this.state = 'home'; // home | dragging | selected | snapping | placed | returning | absorbed | hidden
    this.zone = null;
    this.slot = null;
    this.misses = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.landed = false;
    this.returnFrom = null;
    this.appearDelay = def.appearDelay ?? 0;
    this.visible = def.hidden !== true;
  }

  get h() {
    return (this.size * this.art.h) / this.art.w;
  }

  get hitRadius() {
    return Math.max(Dimens.minTouchRadius, this.size * 0.55);
  }

  hits(px, py) {
    if (!this.visible) return false;
    if (!(this.state === 'home' || this.state === 'returning' || this.state === 'selected')) return false;
    return dist(px, py, this.x.value, this.y.value) <= this.hitRadius;
  }

  pickUp() {
    this.state = 'dragging';
    this.scale.target = this.game.t('pickupScale');
    this.lift.target = 1;
    this.squash.velocity -= 3;
  }

  select() {
    this.state = 'selected';
    this.scale.target = this.game.t('pickupScale');
    this.lift.target = 1;
  }

  snapTo(zone, slot) {
    this.zone = zone;
    this.slot = slot;
    this.state = 'snapping';
    this.landed = false;
    this.lift.target = 0;
    this.x.stiffness = this.y.stiffness = this.game.t('snapStiffness');
    this.x.damping = this.y.damping = this.game.t('snapDamping');
    this.scale.target = slot.scale ?? 1;
    this.rot.target = slot.rot ?? 0;
  }

  returnHome() {
    this.state = 'returning';
    this.zone = null;
    this.lift.target = 0;
    this.scale.target = 1;
    this.rot.target = this.def.rot || 0;
    this.x.stiffness = this.y.stiffness = this.game.t('returnStiffness');
    this.x.damping = this.y.damping = this.game.t('returnDamping');
    this.x.target = this.home.x;
    this.y.target = this.home.y;
    this.returnFrom = { x: this.x.value, y: this.y.value, d: dist(this.x.value, this.y.value, this.home.x, this.home.y) };
  }

  absorb() {
    this.state = 'absorbed';
    this.scale.stiffness = 160;
    this.scale.damping = 18;
    this.scale.target = 0;
  }

  update(dt, time) {
    const g = this.game;
    if (this.appearDelay > 0) {
      this.appearDelay -= dt;
      return;
    }
    this.dim.target = g.dragging && g.dragging !== this && this.state === 'home' ? g.t('dimOthers') : 0;

    if (this.state === 'dragging') {
      const p = g.pointer;
      let tx = p.x;
      let ty = p.y - g.t('fingerOffsetY');
      const hz = g.hoverZone;
      if (hz && (g.level.blindTargets || hz.canAccept(this))) {
        const m = g.t('magnetStrength') * hz.hover.value;
        const s = hz.nextSlotPos();
        tx += (s.x - tx) * m;
        ty += (s.y - ty) * m;
      }
      this.x.target = tx;
      this.y.target = ty;
      this.x.stiffness = this.y.stiffness = g.t('followStiffness');
      this.x.damping = this.y.damping = g.t('followDamping');
      const tilt = clamp(this.x.velocity * g.t('tiltAmount') * 0.0016, -g.t('tiltMax'), g.t('tiltMax'));
      this.rot.target = tilt;
    } else if (this.state === 'selected') {
      this.x.target = this.home.x;
      this.y.target = this.home.y - 18 + Math.sin(time * 4) * 4;
      this.rot.target = Math.sin(time * 3) * 0.05;
    } else if (this.state === 'snapping' || this.state === 'placed') {
      const s = this.zone.slotPos(this.slot.index);
      this.x.target = s.x;
      this.y.target = s.y;
      if (this.state === 'snapping' && !this.landed && dist(this.x.value, this.y.value, s.x, s.y) < 10) {
        this.landed = true;
        this.squash.value = g.t('squash');
        this.squash.velocity = 0;
        this.state = 'placed';
        g.onItemLanded(this, this.zone);
      }
    } else if (this.state === 'home') {
      const bob = this.def.float ? Math.sin(time * 1.7 + this.phase) * 5 * g.t('ambientMotion') : 0;
      this.x.target = this.home.x;
      this.y.target = this.home.y + bob;
      this.rot.target = (this.def.rot || 0) + (this.def.float ? Math.sin(time * 1.1 + this.phase) * 0.04 * g.t('ambientMotion') : 0);
    } else if (this.state === 'returning') {
      if (dist(this.x.value, this.y.value, this.home.x, this.home.y) < 3) {
        this.state = 'home';
        this.squash.value = g.t('squash') * 0.6;
      }
    } else if (this.state === 'absorbed') {
      const s = this.zone.slotPos(0);
      this.x.target = s.x;
      this.y.target = s.y;
      if (this.scale.value < 0.03) this.state = 'hidden';
    }

    this.x.step(dt);
    this.y.step(dt);
    this.scale.step(dt);
    this.rot.step(dt);
    this.squash.step(dt);
    this.dim.step(dt);
    this.lift.step(dt);
  }

  /** Extra y used while flying home so the item arcs instead of sliding. */
  arcOffset() {
    if (this.state !== 'returning' || !this.returnFrom || this.returnFrom.d < 1) return 0;
    const d = dist(this.x.value, this.y.value, this.home.x, this.home.y);
    const p = clamp(1 - d / this.returnFrom.d, 0, 1);
    return -Math.sin(p * Math.PI) * this.game.t('returnArc') * Math.min(1, this.returnFrom.d / 300);
  }

  renderShadow(ctx) {
    if (!this.visible || this.state === 'hidden' || this.appearDelay > 0 || this.def.noShadow) return;
    const l = this.lift.value;
    const baseY = this.y.value + this.h * 0.42 * this.scale.value;
    const off = l * this.game.t('pickupLift') * 2.2;
    shadow(ctx, this.x.value + off * 0.3, baseY + off, this.size * 0.36 * this.scale.value * (1 + l * 0.1), this.size * 0.09 * this.scale.value, 0.18 * (1 - l * 0.45) * this.scale.value);
  }

  render(ctx, time) {
    if (!this.visible || this.state === 'hidden' || this.appearDelay > 0) return;
    const l = this.lift.value;
    const y = this.y.value - l * this.game.t('pickupLift') + this.arcOffset();
    const s = Math.max(0, this.scale.value);
    const sq = this.squash.value;
    if (this.state === 'selected' || this.game.assistItem === this) {
      softGlow(ctx, this.x.value, y, this.size * 0.95, C.hint, 0.7 + Math.sin(time * 5) * 0.2);
    }
    if (this.def.glow) softGlow(ctx, this.x.value, y, this.size * 0.9 * s, this.def.glow, 0.55 + Math.sin(time * 2 + this.phase) * 0.15);
    drawArt(ctx, this.art, this.x.value, y, this.size, {
      scaleX: s * (1 + sq),
      scaleY: s * (1 - sq),
      rot: this.rot.value,
      alpha: this.alpha * (1 - this.dim.value),
    });
    if (this.game.t('showHitAreas') && (this.state === 'home' || this.state === 'selected')) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,0,120,0.7)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x.value, this.y.value, this.hitRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
