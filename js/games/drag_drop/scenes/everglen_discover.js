import forest from './everglen_stress.js';

/**
 * W5R1P1 Lesson 1, flow 1: discover body stress with the firefly.
 * The lesson plays in rounds (level.discover). Each round shows one Everling who is
 * already a little stressed; the player brings the firefly over, it lands on the spot
 * where the stress is showing, glows, and the camera eases in. The lesson comic then
 * explains what the player just found. The player discovers the stress; they never cause it.
 *
 * Zones and items carry "round": only that round's Everling and firefly are in play.
 * The game view calls beginRound(r) before each round and waits for sceneState.onRound.
 * sceneConfig: zoom (camera zoom on the find), focus per zone (def.focus: [dx, dy]).
 */
export default {
  assets: [],

  init(game) {
    game.sceneState = { round: -1, finds: [] };
  },

  update(game, dt, t) {
    forest.update?.(game, dt, t);
  },

  drawBack: forest.drawBack,

  /** Show only this round's Everling and firefly; the camera snaps back (behind the comic). */
  beginRound(game, r) {
    const s = game.sceneState;
    s.round = r;
    game.zoomReset(0.01);
    game.zones.forEach((z) => (z.baseX = z.def.round === r ? z.def.x : -4000));
    game.items.forEach((it) => {
      if (it.def.round === r) it.appearDelay = game.level.sceneConfig?.itemDelay ?? 0.4;
      else if (it.state === 'home') it.appearDelay = 9999;
    });
  },

  async onPlace(game, item, zone) {
    const s = game.sceneState;
    const cfg = game.level.sceneConfig || {};
    const sp = zone.slotPos(item.slot.index);
    // The firefly settles on the spot and lights it up
    s.finds.push({ zone, item, t0: game.time });
    game.effects.sparkles(sp.x, sp.y, 16, ['#FFF6B8', '#FFE45C', '#FFFFFF'], 0.8);
    game.play('transform', { gain: 0.6 });
    await game.wait(0.35);
    // The camera eases in on what was found
    const f = zone.def.focus || [0, 0];
    await game.zoomTo(zone.baseX + f[0], zone.baseY + f[1], cfg.zoom || 1.9, 0.95);
    game.effects.ring(sp.x, sp.y, '#FFF3C4', 140, 8, 0.6);
    await game.wait(cfg.hold ?? 0.7);
    s.onRound?.();
  },

  /** A soft, pulsing glow around each firefly that has landed. */
  drawFront(game, ctx, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const f of game.sceneState.finds) {
      if (f.zone.baseX < -1000) continue;
      const p = f.zone.slotPos(f.item.slot.index);
      const k = Math.min(1, (t - f.t0) / 0.5);
      const r = (70 + Math.sin(t * 3) * 8) * k;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, 'rgba(255, 246, 168, 0.55)');
      g.addColorStop(1, 'rgba(255, 228, 92, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
};
