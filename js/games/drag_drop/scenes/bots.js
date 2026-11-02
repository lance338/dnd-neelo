import { softGlow } from '../components/draw.js';
import { seeded } from '../../../core/motion.js';

/**
 * W4 (Lumina tech visual language): wake Voltis's helper bots.
 * Bots start as the darkened art ('dim:img:...') and switch to their awake
 * art when a power core lands (RoundBot 3: Default -> Digital).
 * The lab backdrop is drawn in canvas until a W4 background exists in Figma.
 */
const rnd = seeded(11);
const LIGHTS = Array.from({ length: 26 }, () => ({ x: -250 + rnd() * 1660, y: 120 + rnd() * 300, r: 1 + rnd() * 2.2, p: rnd() * 6 }));
const TOWERS = Array.from({ length: 16 }, (_, i) => ({ x: -280 + i * 110 + rnd() * 40, w: 60 + rnd() * 60, h: 120 + rnd() * 220 }));

export default {
  assets: ['img:roundbot_digital', 'img:bigbot'],

  drawBack(game, ctx, t) {
    const vr = game.visibleRect();
    // City silhouettes
    TOWERS.forEach((tw, i) => {
      ctx.fillStyle = i % 2 ? '#3A3577' : '#2F2B66';
      ctx.fillRect(tw.x, 560 - tw.h, tw.w, tw.h);
      ctx.fillStyle = 'rgba(140,240,255,0.35)';
      for (let y = 560 - tw.h + 16; y < 540; y += 26) ctx.fillRect(tw.x + 10, y, tw.w - 20, 4);
    });
    LIGHTS.forEach((l) => {
      ctx.fillStyle = `rgba(160,245,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 1.4 + l.p))})`;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Lab floor with a glowing grid
    const g = ctx.createLinearGradient(0, 560, 0, vr.y + vr.h);
    g.addColorStop(0, '#5A4D9E');
    g.addColorStop(1, '#2A2560');
    ctx.fillStyle = g;
    ctx.fillRect(vr.x, 560, vr.w, vr.y + vr.h - 560);
    ctx.strokeStyle = 'rgba(140,240,255,0.22)';
    ctx.lineWidth = 2;
    for (let x = -400; x <= 1560; x += 90) {
      ctx.beginPath();
      ctx.moveTo(581 + (x - 581) * 0.35, 560);
      ctx.lineTo(x, 900);
      ctx.stroke();
    }
    [600, 650, 715, 800].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(vr.x, y);
      ctx.lineTo(vr.x + vr.w, y);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(140,240,255,0.55)';
    ctx.fillRect(vr.x, 558, vr.w, 3);
    game.zones.forEach((z) => {
      if (z.placed.length) softGlow(ctx, z.x, z.y, z.size * 0.9, '#8DF0FF', 0.35 + Math.sin(t * 3 + z.x) * 0.1);
    });
  },

  async onPlace(game, item, zone) {
    zone.setArt(game.art(zone.def.onArt), zone.def.onArt);
    game.effects.ring(zone.x, zone.y, '#B8F5FF', 150, 10, 0.8);
    game.effects.sparkles(zone.x, zone.y - 20, 14, ['#FFFFFF', '#B8F5FF', '#8DE3F0']);
    const voltis = game.actor('voltis');
    voltis.setMood('wave');
    voltis.hop(0.4);
    if (!game.controller.isComplete) {
      const cheers = game.level.guide.cheers;
      game.say(cheers[(game.controller.placedIds.size - 1) % cheers.length], { duration: 1.6, tone: 'cheer' });
    }
    await game.wait(1.2);
    if (!game.controller.isComplete) voltis.setMood('neutral');
  },

  async onComplete(game) {
    const voltis = game.actor('voltis');
    const cat = game.actor('cat');
    await game.wait(0.3);
    voltis.setMood('happy');
    voltis.hop(1);
    for (const z of game.zones) {
      z.pop.velocity += 4;
      game.effects.sparkles(z.x, z.y - 30, 10, ['#FFFFFF', '#B8F5FF']);
      await game.wait(0.12);
    }
    cat.hop(1.4);
    await game.wait(0.8);
  },
};
