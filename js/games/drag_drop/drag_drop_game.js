import { drawNightSky, NIGHT_SKY_ASSETS } from './art/night_sky.js';
import { Dimens } from '../../constants/dimens.js';
import { Spring } from '../../core/motion.js';
import { tuning } from '../../services/tuning_service.js';
import { audio } from '../../services/audio_service.js';
import { loadArt } from './art/registry.js';
import { ItemComponent } from './components/item_component.js';
import { ZoneComponent } from './components/zone_component.js';
import { ActorComponent } from './components/actor_component.js';
import { EffectsComponent } from './components/effects_component.js';
import { HintHandComponent } from './components/hint_hand_component.js';
import { drawArt } from './components/draw.js';
import { GameController } from './game_controller.js';

const MOODS = ['neutral', 'down', 'cross', 'soft', 'happy'];

/**
 * The game (DragDropGame extends FlameGame in Flutter).
 * Owns components, the loop, input and the drop rules. Exposes facade methods
 * (t, play, say, actor, zone, item, art, wait) so components and scene scripts
 * never reach services directly.
 */
export class DragDropGame {
  constructor({ canvas, level, scene, hud }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.scene = scene || {};
    this.hud = hud;
    this.controller = new GameController(level);
    this.arts = new Map();
    this.items = [];
    this.zones = [];
    this.actors = [];
    this.effects = new EffectsComponent(this);
    this.pointer = { x: 0, y: 0, id: null, downX: 0, downY: 0, downT: 0, moved: false };
    this.dragging = null;
    this.selected = null;
    this.hoverZone = null;
    this.assistItem = null;
    this.time = 0;
    this.timers = [];
    this.idleT = 0;
    this.completing = false;
    this.completed = false;
    this.bgFade = new Spring(0, 30, 11);
    // Camera: looks at (x, y) in stage units; zoom 1 at the stage centre is the normal view
    this.cam = { x: Dimens.stageWidth / 2, y: Dimens.stageHeight / 2, zoom: 1, tween: null, shake: null, ox: 0, oy: 0 };
    this.running = false;
    this._bind();
  }

  /* ---------------- facade ---------------- */
  t(key) {
    return tuning.get(key);
  }
  play(event, opts) {
    return audio.play(event, opts);
  }
  art(key) {
    return this.arts.get(key);
  }
  actor(id) {
    return this.actors.find((a) => a.id === id);
  }
  zone(id) {
    return this.zones.find((z) => z.id === id);
  }
  item(id) {
    return this.items.find((i) => i.id === id);
  }
  say(text, opts) {
    if (this.t('showGuideBubbles') && text) this.hud.say(text, opts);
  }
  /** Game-time wait (pauses with the loop). */
  wait(sec) {
    return new Promise((resolve) => this.timers.push({ at: this.time + sec, resolve }));
  }
  /** Ease the camera to look at (x, y) at a zoom level. Resolves when it arrives. */
  zoomTo(x, y, zoom = 1, duration = 0.7) {
    const c = this.cam;
    return new Promise((resolve) => {
      c.tween = { from: { x: c.x, y: c.y, zoom: c.zoom }, to: { x, y, zoom }, t: 0, d: Math.max(0.01, duration), resolve };
    });
  }
  /** Back to the normal view. */
  zoomReset(duration = 0.7) {
    return this.zoomTo(Dimens.stageWidth / 2, Dimens.stageHeight / 2, 1, duration);
  }
  /** Shake the camera (stage units). `grow` ramps the shake up instead of letting it fade. */
  shake(amount = 8, duration = 0.5, { grow = false } = {}) {
    this.cam.shake = { amount, d: duration, t: 0, grow };
    return this.wait(duration);
  }
  _updateCamera(dt) {
    const c = this.cam;
    if (c.tween) {
      const tw = c.tween;
      tw.t = Math.min(tw.d, tw.t + dt);
      const k = tw.t / tw.d;
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      c.x = tw.from.x + (tw.to.x - tw.from.x) * e;
      c.y = tw.from.y + (tw.to.y - tw.from.y) * e;
      c.zoom = tw.from.zoom + (tw.to.zoom - tw.from.zoom) * e;
      if (k >= 1) {
        c.tween = null;
        tw.resolve();
      }
    }
    c.ox = c.oy = 0;
    if (c.shake) {
      const sh = c.shake;
      sh.t += dt;
      const k = Math.min(1, sh.t / sh.d);
      const a = sh.amount * (sh.grow ? 0.25 + 0.75 * k : 1 - k);
      c.ox = Math.sin(this.time * 61) * a * 0.7 + Math.sin(this.time * 37) * a * 0.3;
      c.oy = Math.cos(this.time * 53) * a * 0.6 + Math.sin(this.time * 29) * a * 0.3;
      if (sh.t >= sh.d) c.shake = null;
    }
  }

  async crossfadeBackground(key, duration = 1.4) {
    this.bg2 = this.art(key);
    this.bgFade.stiffness = 40 / duration;
    this.bgFade.damping = 13 / Math.sqrt(duration);
    this.bgFade.target = 1;
  }

  /* ---------------- loading ---------------- */
  async load() {
    const L = this.level;
    const bgKey = typeof L.background === 'string' ? `bg:${L.background}` : L.background.img;
    const keys = new Set(['hand', ...(this.scene.assets || [])]);
    if (bgKey) keys.add(bgKey);
    if (L.background?.type === 'nightSky') NIGHT_SKY_ASSETS.forEach((k) => keys.add(k));
    L.items.forEach((i) => keys.add(i.art));
    L.zones.forEach((z) => {
      if (z.art) keys.add(z.art);
      if (z.ghost) keys.add(z.ghost);
      if (z.icon) keys.add(z.icon);
    });
    (L.actors || []).forEach((a) => (a.moods ? Object.values(a.moods) : MOODS.map((m) => `npc:${a.npc}:${m}`)).forEach((k) => keys.add(k)));
    await Promise.all([...keys].map(async (k) => this.arts.set(k, await loadArt(k, k.startsWith('bg:') ? 1.6 : 2.5))));

    this.bg = bgKey ? this.art(bgKey) : null;
    this.bgDef = typeof L.background === 'string' ? null : L.background;
    this.actors = (L.actors || []).map((a) => {
      let arts;
      if (a.moods) {
        arts = Object.fromEntries(Object.entries(a.moods).map(([m, k]) => [m, this.art(k)]));
        arts.neutral ||= arts[a.mood] || Object.values(arts)[0];
      } else arts = Object.fromEntries(MOODS.map((m) => [m, this.art(`npc:${a.npc}:${m}`)]));
      return new ActorComponent(a, arts, this);
    });
    this.zones = L.zones.map((z) => new ZoneComponent(z, z.art ? this.art(z.art) : null, this, z.ghost ? this.art(z.ghost) : null, z.icon ? this.art(z.icon) : null));
    this.items = L.items.map((i, idx) => {
      const it = new ItemComponent({ appearDelay: 0.15 + idx * 0.07, ...i }, this.art(i.art), this);
      return it;
    });
    this.hand = new HintHandComponent(this, this.art('hand'));
    if (this.scene.init) await this.scene.init(this);
  }

  start() {
    this.running = true;
    this._resize();
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(1 / 30, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.hud.setProgress(0, false);
    // The view runs Nova's intro, then calls unlock(). Input and idle hints wait for it.
  }

  /** Input is ignored while locked (Nova's intro is on screen). */
  lock() {
    this.locked = true;
    this.hand.stop();
  }

  unlock() {
    this.locked = false;
    this.idleT = 0;
    if (this.scene.onStart) this.scene.onStart(this);
  }

  /**
   * An NPC says a line: comic speech bubble over their head, their voice if
   * one exists in audio/nova/lines.json, then wait until it has been heard.
   */
  async talk(actorId, text, { mood, width = 440, hold = 0.5 } = {}) {
    const a = this.actor(actorId);
    if (!a || !text) return;
    if (mood) a.setMood(mood);
    a.hop(0.35);
    const art = a.arts[a.mood] || a.arts.neutral;
    const top = a.y.value - (a.size * art.h) / art.w / 2;
    const src = await this.speak(text, actorId);
    const secs = src && src.buffer ? src.buffer.duration + hold : Math.max(2.4, text.length / 15 + 1);
    this.effects.bubble({ x: a.x.value, y: top - 8, text, kind: 'comic', duration: secs + 0.35, width });
    await this.wait(secs);
  }

  /** Nova voices a line without a bubble (e.g. text already drawn in the scene). */
  speak(text, who) {
    return audio.speak(text, who);
  }

  /** Screen rects (CSS px) of items waiting at home, so HUD bubbles can avoid covering them. */
  restingItemRects(pad = 24) {
    const v = this.view;
    return this.items
      .filter((i) => i.visible && ['home', 'returning', 'selected'].includes(i.state))
      .map((i) => {
        const half = (i.size / 2 + pad) * v.s;
        const cx = v.ox + i.home.x * v.s;
        const cy = v.oy + i.home.y * v.s;
        return { left: cx - half, right: cx + half, top: cy - half, bottom: cy + half };
      });
  }

  /** Tapping Nova's circle: say the hint line and run the hand demo. */
  requestHint() {
    if (this.locked || this.completing) return;
    this.controller.hints += 1;
    this.idleT = -4;
    const text = (this.scene.hintText && this.scene.hintText(this)) || this.level.guide?.hint || this.level.guide?.intro;
    this.say(text, { duration: 5, tone: 'hint' });
    this.hand.stop();
    this._showHint();
  }

  /** Mirrors onExit(): stop loop, audio, listeners. Safe to call twice. */
  onExit() {
    if (this._exited) return;
    this._exited = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this._unbind();
    audio.onGameExit();
  }

  /* ---------------- update ---------------- */
  update(dt) {
    this.time += dt;
    const due = this.timers.filter((x) => x.at <= this.time);
    this.timers = this.timers.filter((x) => x.at > this.time);
    due.forEach((x) => x.resolve());

    if (this.dragging) this._updateHover();
    this.actors.forEach((a) => a.update(dt));
    this.zones.forEach((z) => z.update(dt));
    this.items.forEach((i) => i.update(dt, this.time));
    this.effects.update(dt);
    this.hand.update(dt);
    this.bgFade.step(dt);
    this._updateCamera(dt);
    if (this.scene.update) this.scene.update(this, dt, this.time);

    if (!this.locked && !this.dragging && !this.selected && !this.completing && !this.hand.active) {
      this.idleT += dt;
      if (this.idleT > this.t('idleHintDelay')) {
        this.idleT = -4;
        this.hud.nudge?.();
        this._showHint();
      }
    }
  }

  _updateHover() {
    const it = this.dragging;
    const radius = this.t('snapRadius');
    let best = null;
    let bd = Infinity;
    this.zones.forEach((z) => {
      // Right-or-wrong levels: every target reacts the same, so hovering never gives the answer away
      if (!z.visible || z.full || (!this.level.blindTargets && !z.canAccept(it))) return;
      const d = z.distanceTo(it.x.value, it.y.value);
      if (d < Math.max(radius, z.hitRadius) && d < bd) {
        best = z;
        bd = d;
      }
    });
    // No hover sound: the target's highlight animation carries this moment
    if (best !== this.hoverZone) this.hoverZone = best;
  }

  _showHint() {
    const item = this.items.find((i) => i.required && i.state === 'home' && i.visible);
    if (!item) return;
    const zone = this.zones.find((z) => z.visible && z.canAccept(item));
    if (!zone) return;
    this.hand.play(item, zone, 2);
  }

  /* ---------------- input ---------------- */
  _bind() {
    this._onDown = (e) => this._down(e);
    this._onMove = (e) => this._move(e);
    this._onUp = (e) => this._up(e);
    this._onResize = () => this._resize();
    this.canvas.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove, { passive: false });
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
    window.addEventListener('resize', this._onResize);
  }

  _unbind() {
    this.canvas.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
    window.removeEventListener('resize', this._onResize);
  }

  _toStage(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - this.view.ox) / this.view.s, y: (e.clientY - r.top - this.view.oy) / this.view.s };
  }

  _down(e) {
    audio.unlock();
    if (this.pointer.id !== null || this.completing || this.locked) return;
    const p = this._toStage(e);
    this.idleT = 0;
    this.hand.stop();

    const hit = [...this.items].reverse().find((i) => i.hits(p.x, p.y));

    if (this.selected && !hit) {
      // Tap-to-place: tapped somewhere with an item selected
      const sel = this.selected;
      const z = this._zoneAt(p.x, p.y);
      this.selected = null;
      if (z) this._resolveDrop(sel, z);
      else {
        sel.returnHome();
        this.play('return');
      }
      return;
    }
    if (!hit) return;
    if (this.selected && this.selected !== hit) this.selected.returnHome();
    this.selected = null;
    e.preventDefault();
    this.pointer = { x: hit.x.value, y: hit.y.value + this.t('fingerOffsetY'), id: e.pointerId, downX: p.x, downY: p.y, downT: performance.now(), moved: false, grabDX: hit.x.value - p.x, grabDY: hit.y.value - p.y };
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      /* not supported */
    }
    this.dragging = hit;
    this.hud.onDragStart?.();
    this.hoverZone = null;
    hit.pickUp();
    this.play('pickup');
  }

  _move(e) {
    if (e.pointerId !== this.pointer.id || !this.dragging) return;
    e.preventDefault();
    const p = this._toStage(e);
    if (!this.pointer.moved && Math.hypot(p.x - this.pointer.downX, p.y - this.pointer.downY) > 9) this.pointer.moved = true;
    // Until the finger actually moves, keep the item where it is (no jump on tap)
    const blend = this.pointer.moved ? 1 : 0;
    this.pointer.x = p.x + this.pointer.grabDX * (1 - blend);
    this.pointer.y = p.y + this.pointer.grabDY * (1 - blend) + (blend ? 0 : this.t('fingerOffsetY'));
  }

  _up(e) {
    if (e.pointerId !== this.pointer.id) return;
    const it = this.dragging;
    const p = this.pointer;
    this.pointer = { x: p.x, y: p.y, id: null };
    this.dragging = null;
    const hz = this.hoverZone;
    this.hoverZone = null;
    if (!it) return;

    const quickTap = !p.moved && performance.now() - p.downT < 350;
    if (quickTap && this.t('tapToPlace')) {
      it.select();
      this.selected = it;
      return;
    }
    if (hz) return this._resolveDrop(it, hz);
    const near = this._zoneNear(it.x.value, it.y.value);
    if (near) return this._resolveDrop(it, near);
    it.returnHome();
    this.play('return');
  }

  _zoneAt(x, y) {
    return this.zones.filter((z) => z.visible && z.distanceTo(x, y) < z.hitRadius * 1.15).sort((a, b) => a.distanceTo(x, y) - b.distanceTo(x, y))[0];
  }

  _zoneNear(x, y) {
    return this.zones.filter((z) => z.visible && z.distanceTo(x, y) < Math.max(this.t('snapRadius'), z.hitRadius)).sort((a, b) => a.distanceTo(x, y) - b.distanceTo(x, y))[0];
  }

  /* ---------------- rules ---------------- */
  _resolveDrop(item, zone) {
    if (zone.canAccept(item)) {
      const slot = zone.place(item);
      item.snapTo(zone, slot);
      this.controller.recordAttempt(item.id, zone.id, true);
      this.controller.markPlaced(item.id);
      if (this.assistItem === item) this.assistItem = null;
      this.zones.forEach((z) => (z.assist = false));
      // Levels can add a material snap (wood plank) on top of the shared correct-drop sound
      if (zone.def.snapSound) this.play(zone.def.snapSound);
      return;
    }
    // Right kind of target but already full: glide home quietly, not a mistake
    const compatible = zone.accepts.includes(item.id) || item.tags.some((t) => zone.accepts.includes(t));
    if (compatible && zone.full) {
      item.returnHome();
      this.play('return');
      const open = this.zones.find((z) => z.visible && z.canAccept(item));
      if (open) {
        open.assist = true;
        this.wait(1.6).then(() => (open.assist = false));
      }
      return;
    }
    // Wrong target
    this.controller.recordAttempt(item.id, zone.id, false);
    item.misses += 1;
    zone.wrong();
    item.returnHome();
    this.play('bounce');
    const hint = (item.def.hints && item.def.hints[zone.id]) || item.hint || zone.def.wrongHint || this.level.guide?.wrong;
    this.say(hint, { duration: 4.5, tone: 'hint' });
    if (item.misses >= this.t('missesBeforeAssist')) {
      this.assistItem = item;
      this.zones.forEach((z) => (z.assist = z.canAccept(item)));
    }
    if (this.scene.onWrong) this.scene.onWrong(this, item, zone);
  }

  /** Called by ItemComponent the frame it lands in its slot. */
  async onItemLanded(item, zone) {
    const sp = zone.slotPos(item.slot.index);
    this.effects.sparkles(sp.x, sp.y, this.t('sparkleCount'));
    this.effects.ring(sp.x, sp.y, '#FFFFFF', 120, 8, 0.6);
    if (zone.def.landSound) this.play(zone.def.landSound);
    else if (this.level.successSound !== false) this.play('hit');
    if (zone.mode === 'absorb') {
      item.absorb();
      this.effects.puff(sp.x, sp.y - 10, 7);
    }
    this.hud.setProgress(this.controller.progress, true);
    if (this.controller.progress < 1 && this.controller.placedIds.size > 0) this.play('meter', { gain: 0.6 });
    if (this.scene.onPlace) await this.scene.onPlace(this, item, zone);
    else this._cheer();

    if (this.controller.isComplete && !this.completing) this._complete();
  }

  _cheer() {
    const cheers = this.level.guide?.cheers;
    if (!cheers || this.controller.isComplete) return;
    this.say(cheers[Math.floor(Math.random() * cheers.length)], { duration: 1.8, tone: 'cheer' });
  }

  async _complete() {
    this.completing = true;
    this.hand.stop();
    await this.wait(0.35);
    if (this.scene.onComplete) await this.scene.onComplete(this);
    this.effects.confetti(this.t('confettiCount'));
    this.play('complete');
    this.hud.celebrate?.();
    // A level that carries on into a comic lets the confetti play out a little longer first
    await this.wait(this.level.comic?.after ? 3.1 : 1.6);
    this.completed = true;
    this.hud.onComplete(this.controller.summary());
  }

  /* ---------------- render ---------------- */
  _resize() {
    const host = this.canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = host.clientWidth;
    const h = host.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    const s = Math.min(w / Dimens.stageWidth, h / Dimens.stageHeight);
    this.view = { s, ox: (w - Dimens.stageWidth * s) / 2, oy: (h - Dimens.stageHeight * s) / 2, dpr, w, h };
  }

  /** Stage-space rectangle currently visible on screen (for edge-anchored HUD art). */
  visibleRect() {
    const v = this.view;
    const c = this.cam;
    const cx = Dimens.stageWidth / 2;
    const cy = Dimens.stageHeight / 2;
    return { x: c.x - c.ox + (-v.ox / v.s - cx) / c.zoom, y: c.y - c.oy + (-v.oy / v.s - cy) / c.zoom, w: v.w / v.s / c.zoom, h: v.h / v.s / c.zoom };
  }

  render() {
    const ctx = this.ctx;
    const v = this.view;
    const t = this.time;
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    ctx.fillStyle = this.level.edgeColor || '#2B2266';
    ctx.fillRect(0, 0, v.w, v.h);
    ctx.translate(v.ox, v.oy);
    ctx.scale(v.s, v.s);
    const cam = this.cam;
    if (cam.zoom !== 1 || cam.ox || cam.oy || cam.x !== Dimens.stageWidth / 2 || cam.y !== Dimens.stageHeight / 2) {
      ctx.translate(Dimens.stageWidth / 2, Dimens.stageHeight / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x + cam.ox, -cam.y + cam.oy);
    }

    const drawBg = (a, alpha) => {
      if (!a || alpha <= 0) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(a.img, a.offsetX, a.offsetY, a.w, a.h);
      ctx.globalAlpha = 1;
    };
    if (this.bgDef) this._drawImageBackground(ctx);
    else drawBg(this.bg, 1);
    drawBg(this.bg2, Math.min(1, Math.max(0, this.bgFade.value)));

    if (this.scene.drawBack) this.scene.drawBack(this, ctx, t);
    this.zones.forEach((z) => z.renderBack(ctx, t));
    this.actors.filter((a) => a.def.layer !== 'front').sort((a, b) => a.y.value - b.y.value).forEach((a) => a.render(ctx, t));
    this.zones.forEach((z) => z.render(ctx, t));
    const placed = this.items.filter((i) => ['snapping', 'placed', 'absorbed'].includes(i.state));
    placed.forEach((i) => i.render(ctx, t));
    if (this.scene.drawMid) this.scene.drawMid(this, ctx, t);
    this.actors.filter((a) => a.def.layer === 'front').forEach((a) => a.render(ctx, t));

    const free = this.items.filter((i) => ['home', 'returning', 'selected'].includes(i.state));
    free.forEach((i) => i.renderShadow(ctx));
    free.forEach((i) => i.render(ctx, t));
    if (this.dragging) {
      this.dragging.renderShadow(ctx);
      this.dragging.render(ctx, t);
    }
    this.effects.render(ctx, t);
    this.hand.render(ctx);
    if (this.scene.drawFront) this.scene.drawFront(this, ctx, t);
  }

  /**
   * Image backgrounds: { img, x, y, w } places the art in stage units (h follows the aspect);
   * { img, cover: true } fills whatever the screen shows. `color` paints any uncovered edge.
   */
  _drawImageBackground(ctx) {
    const d = this.bgDef;
    const vr = this.visibleRect();
    if (d.type === 'nightSky') {
      drawNightSky(ctx, this, vr, this.time, this.t('ambientMotion'));
      return;
    }
    if (d.color) {
      ctx.fillStyle = d.color;
      ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
    }
    if (d.top) {
      ctx.fillStyle = d.top;
      ctx.fillRect(vr.x, vr.y, vr.w, d.splitY - vr.y);
    }
    if (d.sky) {
      const g = ctx.createLinearGradient(0, vr.y, 0, vr.y + vr.h);
      d.sky.forEach(([o, c]) => g.addColorStop(o, c));
      ctx.fillStyle = g;
      ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
    }
    const a = this.bg;
    if (!a) return;
    let { x = 0, y = 0, w = 1162 } = d;
    let h = (w * a.h) / a.w;
    if (d.cover) {
      const k = Math.max(vr.w / a.w, vr.h / a.h);
      w = a.w * k;
      h = a.h * k;
      x = vr.x + (vr.w - w) * (d.focusX ?? 0.5);
      y = vr.y + (vr.h - h) * (d.focusY ?? 0.5);
    }
    this.bgRect = { x, y, w, h };
    ctx.drawImage(a.img, x, y, w, h);
  }

  /** Helper for scenes: draw a registered art key. */
  drawKey(key, x, y, width, opts) {
    drawArt(this.ctx, this.art(key), x, y, width, opts);
  }
}
