/**
 * Animated night sky (Figma "Section 2" sky assets, Lance's Sandbox).
 *
 * Built from pieces so it fills any viewport:
 *  - the gradient is drawn in code and stretches to the visible height,
 *  - the sparkle stars are drawn in code from their Figma positions and twinkle,
 *  - the small purple clouds drift and bob gently,
 *  - the big cloud bank is two seamless tiles (pink back, purple front) that
 *    slide right at different speeds and repeat across any width.
 *
 * All positions are stage units (1162 x 806). The Figma sky frame sits at
 * x -295, y -7 on the stage, so a Figma section point (sx, sy) maps to
 * (sx - 3053.95, sy - 643.86).
 */
export const NIGHT_SKY_ASSETS = [
  'img:sky_clouds_back',
  'img:sky_clouds_front',
  'img:sky_moon',
  'img:sky_cloud_6',
  'img:sky_cloud_7',
];

const OX = -3053.95;
const OY = -643.86;
const SKY_TOP = -7;
const SKY_BOTTOM = 806;
const SKY_W = 1755; // stars repeat at this period on very wide screens

// Gradient stops from the Figma "Night Sky" frame
const STOPS = [
  [0, '#1C3F95'],
  [0.428, '#7E5C96'],
  [0.75, '#E07A97'],
  [1, '#E07A97'],
];

// [x, y, size, opacity] in Figma section units: 4-point sparkles
const STARS = [[3086,745.7,9,0.76],[2713.1,745.7,9,0.76],[3164.8,714.7,11.4,0.72],[2791.9,714.7,11.4,0.72],[3342.1,669.1,5.8,0.81],[2969.1,669.1,5.8,0.81],[3360.4,758.6,9.4,0.98],[2987.5,758.6,9.4,0.98],[3465.5,692.2,7.3,0.81],[3602.8,749.9,11.6,0.73],[3702.1,732.6,6.2,0.9],[3778.9,713.4,8.7,0.72],[3901.6,672.2,6.3,0.74],[3933.6,747.1,9.7,0.86],[4039.7,736,9,0.77],[4303.8,736,9,0.77],[4195.5,684.7,9.7,0.71],[4459.7,684.7,9.7,0.71],[3084.1,799.9,10.6,0.71],[2711.2,799.9,10.6,0.71],[3223.3,799.3,9.3,0.92],[2850.4,799.3,9.3,0.92],[3282.6,852.9,11.3,0.75],[2909.7,852.9,11.3,0.75],[3359.4,802.8,8.6,0.85],[2986.5,802.8,8.6,0.85],[3456.8,795.7,9.9,0.78],[3565.8,776.8,7.3,0.86],[3648.5,832.6,5.8,0.92],[3812.1,810.4,10.1,0.9],[3850.9,832.1,6.7,0.76],[3950.2,776.6,7,0.73],[4074.8,830.7,9.8,0.94],[4338.9,830.7,9.8,0.94],[4112.6,845.8,6.8,0.8],[4376.8,845.8,6.8,0.8],[3145.5,875.3,8,0.74],[2772.6,875.3,8,0.74],[3203.8,919.1,5.8,0.9],[2830.9,919.1,5.8,0.9],[3343,873.2,9.5,0.79],[2970.1,873.2,9.5,0.79],[3374.1,922.9,9.5,0.93],[3001.1,922.9,9.5,0.93],[3516.2,867.2,11.2,0.94],[3627.2,962.9,9.5,0.85],[3714.8,960.4,8.5,0.81],[3805.2,915.8,11,0.97],[3918.2,960.4,10.4,0.87],[3967.7,944.4,9.5,0.88],[4044.6,937.3,9,0.72],[4308.7,937.3,9,0.72],[4118.5,887,8,0.83],[4382.6,887,8,0.83],[3092.8,1015.9,8.8,0.84],[2719.9,1015.9,8.8,0.84],[3251.6,1024.3,6.2,0.7],[2878.7,1024.3,6.2,0.7],[3311.8,995.6,11.1,0.89],[2938.9,995.6,11.1,0.89],[3496.7,991.5,10.8,0.99],[3644.6,1028.4,8.5,0.9],[3810.1,993,7.9,0.74],[3886,1029.5,6.7,0.87],[3954.1,988,9.5,0.7],[4197.4,1013.7,10.3,1],[4461.6,1013.7,10.3,1]];

// [sprite, stage x, stage y, width, flip]. Only the two complete cloud shapes are
// used: the smaller Figma cloud groups export as half clouds.
const CLOUDS = [
  ['sky_cloud_6', 1025.7, 300.0, 120, 0],
  ['sky_cloud_7', 1285.5, 305.0, 64, 1],
  ['sky_cloud_7', 1105.3, 86.0, 72, 0],
  ['sky_cloud_6', 511.7, 33.0, 76, 1],
  ['sky_cloud_7', 1378.2, 140.0, 72, 1],
  ['sky_cloud_6', 190.0, 128.0, 96, 0],
  ['sky_cloud_6', 371.3, 223.1, 132.4, 0],
  ['sky_cloud_7', 62.3, 345.9, 97.5, 0],
  ['sky_cloud_7', -257.0, 345.9, 97.5, 1],
  ['sky_cloud_7', 660.8, 175.4, 97.5, 1],
  ['sky_cloud_7', 1025.4, 407.4, 97.5, 0],
];

// Cloud bank tiles: 2520 x 520 stage units, top-left at x -469.95, y 416.14
const BANK = { x: -469.95, y: 416.14, w: 2520, h: 520 };
const MOON = { x: 1.2, y: 3.75, w: 440, h: 300 };
const FLOOR = '#DB8FB6'; // colour at the foot of the cloud bank

function hash(i) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function sparkle(ctx, x, y, r) {
  const k = r * 0.2;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + k, y - k);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + k, y + k);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - k, y + k);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - k, y - k);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the sky behind everything. `vr` is the visible stage rect, `t` seconds,
 * `motion` the ambient motion tuning (0 freezes it).
 */
export function drawNightSky(ctx, game, vr, t, motion = 1) {
  const tm = t * motion;
  // 1. Gradient over the whole visible area (stops are pinned to the Figma frame)
  const g = ctx.createLinearGradient(0, SKY_TOP, 0, SKY_BOTTOM);
  STOPS.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(vr.x, vr.y, vr.w, vr.h);

  // 2. Moon and its glow, breathing very slowly
  const moon = game.art('img:sky_moon');
  if (moon) {
    ctx.save();
    ctx.globalAlpha = 0.9 + 0.1 * Math.sin(tm * 0.6);
    ctx.drawImage(moon.img, MOON.x, MOON.y, MOON.w, MOON.h);
    ctx.restore();
  }

  // 3. Sparkle stars, repeated across very wide screens
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  const first = Math.floor((vr.x + 300) / SKY_W) - 1;
  const last = Math.ceil((vr.x + vr.w + 300) / SKY_W);
  STARS.forEach(([sx, sy, size, op], i) => {
    const speed = 0.6 + hash(i) * 1.4;
    const phase = hash(i + 50) * 6.28;
    const tw = 0.5 + 0.5 * Math.sin(tm * speed + phase);
    const r = (size / 2) * (0.75 + 0.35 * tw);
    ctx.globalAlpha = op * (0.35 + 0.65 * tw);
    for (let k = first; k <= last; k++) sparkle(ctx, sx + OX + k * SKY_W, sy + OY, r);
  });
  ctx.restore();

  // 4. Small clouds drift side to side and bob
  CLOUDS.forEach(([key, x, y, w, flip], i) => {
    const a = game.art('img:' + key);
    if (!a) return;
    const h = (w * a.h) / a.w;
    const dx = Math.sin(tm * (0.08 + hash(i + 9) * 0.06) + hash(i) * 6.28) * (10 + hash(i + 3) * 10);
    const dy = Math.sin(tm * (0.35 + hash(i + 7) * 0.2) + hash(i + 1) * 6.28) * 2.5;
    if (flip) {
      ctx.save();
      ctx.translate(x + dx + w, y + dy);
      ctx.scale(-1, 1);
      ctx.drawImage(a.img, 0, 0, w, h);
      ctx.restore();
    } else ctx.drawImage(a.img, x + dx, y + dy, w, h);
  });

  // 5. Cloud bank: two tiles sliding right at different speeds. The back tile is
  // solid at its foot and the floor colour carries on to the bottom of any screen,
  // so the bottom is one seamless cloudscape.
  const floorY = BANK.y + BANK.h - 2;
  if (vr.y + vr.h > floorY) {
    ctx.fillStyle = FLOOR;
    ctx.fillRect(vr.x, floorY, vr.w, vr.y + vr.h - floorY);
  }
  drawBank(ctx, game.art('img:sky_clouds_back'), vr, tm * 7);
  drawBank(ctx, game.art('img:sky_clouds_front'), vr, tm * 13);
}

function drawBank(ctx, a, vr, offset) {
  if (!a) return;
  let x = BANK.x + (offset % BANK.w);
  while (x > vr.x) x -= BANK.w;
  for (; x < vr.x + vr.w; x += BANK.w) ctx.drawImage(a.img, x, BANK.y, BANK.w + 0.5, BANK.h);
}
