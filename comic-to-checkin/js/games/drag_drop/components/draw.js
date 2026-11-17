/**
 * Shared canvas helpers for components. The Flame equivalents are
 * SvgComponent / SpriteComponent with anchor = Anchor.center.
 */
export function drawArt(ctx, art, x, y, width, { scaleX = 1, scaleY = 1, rot = 0, alpha = 1, anchorY = 0.5 } = {}) {
  if (!art || alpha <= 0.001) return;
  const h = (width * art.h) / art.w;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(scaleX, scaleY);
  const f = art.frame;
  if (f) {
    const k = width / art.w;
    ctx.drawImage(art.img, -width / 2 - f.x * k, -h * anchorY - f.y * k, f.iw * k, f.ih * k);
  } else {
    ctx.drawImage(art.img, -width / 2, -h * anchorY, width, h);
  }
  ctx.restore();
}

export function softGlow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, 0.75 * alpha));
  g.addColorStop(0.55, hexA(color, 0.3 * alpha));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function shadow(ctx, x, y, rx, ry, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.fillStyle = `rgba(30,18,70,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function hexA(hex, a) {
  if (hex.startsWith('rgba')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function star4(ctx, x, y, r, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? r : r * 0.32;
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Wraps text to a width; returns lines. */
export function wrap(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}
