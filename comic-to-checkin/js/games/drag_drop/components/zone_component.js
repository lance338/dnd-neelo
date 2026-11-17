import { Spring, dist } from '../../../core/motion.js';
import { VividColors as C } from '../../../constants/vivid_colors.js';
import { drawArt, softGlow } from './draw.js';

/**
 * A drop target (DropZoneComponent in Flame). Owns its slots, acceptance rule,
 * hover / highlight / assist glow and the "not me" shake.
 */
export class ZoneComponent {
  constructor(def, art, game, ghostArt, iconArt) {
    this.game = game;
    this.def = def;
    this.id = def.id;
    this.art = art;
    this.ghostArt = ghostArt;
    this.iconArt = iconArt;
    this.ghostSilhouette = ghostArt ? (def.ghostStyle === 'outline' ? dashedOutline(ghostArt) : silhouette(ghostArt)) : null;
    this.size = def.size || 200;
    this.baseX = def.x;
    this.baseY = def.y;
    this.accepts = def.accepts || [];
    this.capacity = def.capacity ?? 1;
    this.slots = def.slots || [{ dx: 0, dy: 0 }];
    this.mode = def.mode || 'stay';
    this.placed = [];
    this.hover = new Spring(0, 260, 26);
    this.highlight = new Spring(0, 160, 22);
    this.assist = false;
    this.shake = new Spring(0, 900, 9);
    this.pop = new Spring(0, 320, 12);
    this.visible = def.hidden !== true;
    this.artKey = def.art;
  }

  get x() {
    const a = this.def.actor && this.game.actor(this.def.actor);
    return (a ? a.x.value : this.baseX) + this.shake.value;
  }

  get y() {
    const a = this.def.actor && this.game.actor(this.def.actor);
    return a ? a.y.value + (this.def.actorDy || 0) : this.baseY;
  }

  get hitX() {
    return this.x + (this.def.hitDx || 0);
  }

  get hitY() {
    return this.y + (this.def.hitDy || 0);
  }

  get hitRadius() {
    return this.def.hitRadius || this.size * 0.5;
  }

  get full() {
    return this.placed.length >= this.capacity;
  }

  canAccept(item) {
    if (this.full) return false;
    return this.accepts.includes(item.id) || item.tags.some((t) => this.accepts.includes(t));
  }

  distanceTo(px, py) {
    return dist(px, py, this.hitX, this.hitY);
  }

  slotPos(i) {
    const s = this.slots[Math.min(i, this.slots.length - 1)];
    return { x: this.x + s.dx, y: this.y + s.dy, scale: s.scale ?? 1, rot: s.rot ?? 0, index: i };
  }

  nextSlotPos() {
    return this.slotPos(this.placed.length);
  }

  place(item) {
    const slot = this.nextSlotPos();
    this.placed.push(item);
    this.pop.velocity += 2.2;
    return slot;
  }

  wrong() {
    this.shake.velocity += this.game.t('wrongShake') * 60;
  }

  setArt(art, key) {
    this.art = art;
    this.artKey = key;
    this.pop.velocity += 2.5;
  }

  update(dt) {
    const g = this.game;
    const d = g.dragging || g.selected;
    const wantsHighlight = d && g.t('highlightTargets') && !g.level.blindTargets && this.canAccept(d);
    this.highlight.target = wantsHighlight || this.assist ? 1 : 0;
    this.hover.target = g.hoverZone === this ? 1 : 0;
    this.hover.step(dt);
    this.highlight.step(dt);
    this.shake.step(dt);
    this.pop.step(dt);
  }

  renderBack(ctx, time) {
    if (!this.visible) return;
    const hl = this.highlight.value;
    const hv = this.hover.value;
    const pulse = 0.75 + Math.sin(time * (this.assist ? 6 : 3)) * 0.25;
    const color = this.def.glowColor || (hv > 0.5 ? C.successGlow : C.hintGlow);
    const r = this.hitRadius * (1.25 + hv * 0.25);
    softGlow(ctx, this.hitX, this.hitY, r, color, Math.min(1, (hl * 0.6 + hv * 0.6) * pulse + (this.assist ? 0.35 * pulse : 0)));
  }

  render(ctx, time) {
    if (!this.visible) return;
    const hv = this.hover.value;
    const s = 1 + hv * (this.game.t('zoneHoverScale') - 1) + this.pop.value * 0.05;
    if (this.art) {
      drawArt(ctx, this.art, this.x, this.y, this.size, { scaleX: s, scaleY: s, anchorY: this.def.anchorY ?? 0.5 });
    }
    if (this.ghostArt && this.placed.length === 0) {
      const sp = this.slotPos(0);
      const gw = this.def.ghostSize || 100;
      const a = 0.55 + Math.sin(time * 2.4) * 0.12 + this.highlight.value * 0.25;
      drawArt(ctx, this.ghostSilhouette, sp.x, sp.y, gw, { alpha: this.def.ghostStyle === 'outline' ? 0.85 : a, scaleX: s, scaleY: s });
      if (this.def.ghostStyle !== 'outline') drawArt(ctx, this.ghostArt, sp.x, sp.y, gw, { alpha: 0.22, scaleX: s, scaleY: s });
    }
    if (this.iconArt) {
      const ix = this.x + (this.def.iconDx || 0);
      const iy = this.y + (this.def.iconDy || 0);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(ix, iy, 34 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawArt(ctx, this.iconArt, ix, iy, 46 * s);
    }
    if (this.game.t('showHitAreas')) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,160,255,0.8)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.hitX, this.hitY, this.hitRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,200,120,0.6)';
      ctx.beginPath();
      ctx.arc(this.hitX, this.hitY, this.game.t('snapRadius'), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** White silhouette of an art image, used for "match the outline" ghosts. */
function silhouette(art) {
  const c = document.createElement('canvas');
  c.width = art.img.width;
  c.height = art.img.height;
  const x = c.getContext('2d');
  x.drawImage(art.img, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = 'rgba(255,255,255,0.75)';
  x.fillRect(0, 0, c.width, c.height);
  return { ...art, img: c };
}

/**
 * Dashed outline of an art image's shape (the empty face slot in the card flip
 * design): a silhouette edge ring, broken into dashes, over a faint fill.
 */
function dashedOutline(art, width = 7, dash = 16) {
  const W = art.img.width;
  const H = art.img.height;
  const pad = width * 2;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = W + pad * 2;
    c.height = H + pad * 2;
    return c;
  };
  const sil = mk();
  const sx = sil.getContext('2d');
  sx.drawImage(art.img, pad, pad);
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = '#fff';
  sx.fillRect(0, 0, sil.width, sil.height);
  // Grow the silhouette by stamping it around a circle, then cut the original out
  const ring = mk();
  const rx = ring.getContext('2d');
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) rx.drawImage(sil, Math.cos(a) * width, Math.sin(a) * width);
  rx.globalCompositeOperation = 'destination-out';
  rx.drawImage(sil, 0, 0);
  // Break the ring into dashes with a diagonal stripe mask
  const stripes = mk();
  const tx = stripes.getContext('2d');
  tx.fillStyle = '#fff';
  for (let d = -stripes.height; d < stripes.width; d += dash * 2) {
    tx.beginPath();
    tx.moveTo(d, 0);
    tx.lineTo(d + dash, 0);
    tx.lineTo(d + dash + stripes.height, stripes.height);
    tx.lineTo(d + stripes.height, stripes.height);
    tx.fill();
  }
  rx.globalCompositeOperation = 'destination-in';
  rx.drawImage(stripes, 0, 0);
  const out = mk();
  const ox = out.getContext('2d');
  ox.globalAlpha = 0.14;
  ox.drawImage(sil, 0, 0);
  ox.globalAlpha = 1;
  ox.drawImage(ring, 0, 0);
  if (art.frame) {
    const f = art.frame;
    return { img: out, w: art.w, h: art.h, frame: { x: f.x + pad, y: f.y + pad, iw: out.width, ih: out.height } };
  }
  const k = art.w / W;
  return { img: out, w: out.width * k, h: out.height * k };
}
