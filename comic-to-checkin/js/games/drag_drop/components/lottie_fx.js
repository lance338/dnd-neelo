/**
 * Lottie effects drawn inside the game canvas, so they zoom and shake with the camera.
 * Each file gets an offscreen canvas the player renders into; the game draws that
 * canvas where the effect plays. In Flutter these are Lottie widgets (or a
 * LottieComponent in Flame) placed at the same spot.
 */
let lottieLib = null;

export function loadLottieLib() {
  if (window.lottie) return Promise.resolve(window.lottie);
  lottieLib ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    // lottie-web 5.12.2 (MIT), light canvas build (no expressions, no eval), kept in the repo so it works offline
    s.src = 'assets/vendor/lottie_light_canvas.min.js';
    s.onload = () => resolve(window.lottie);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return lottieLib;
}

const dataCache = new Map();

/**
 * Load one Lottie file into its own offscreen canvas.
 * Resolves { anim, canvas, frames, fps }, or null if the player or the file can't load.
 */
export async function loadLottie(url, px = 1024) {
  try {
    if (!dataCache.has(url)) dataCache.set(url, fetch(url).then((r) => r.json()));
    const [lib, data] = await Promise.all([loadLottieLib(), dataCache.get(url)]);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = px;
    const anim = lib.loadAnimation({
      // No container: the player then sizes to the canvas it was given
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: data,
      rendererSettings: { context: canvas.getContext('2d'), clearCanvas: true },
    });
    await new Promise((r) => (anim.isLoaded ? r() : anim.addEventListener('DOMLoaded', r)));
    return { anim, canvas, frames: data.op - data.ip, fps: data.fr, w: data.w };
  } catch (e) {
    return null;
  }
}

/** Correct-drop hit effects, picked in Tuning > Effects > Correct drop effect. */
export const HIT_STYLES = [null, 'assets/lottie/drop_hit_pop.json', 'assets/lottie/drop_hit_stars.json', 'assets/lottie/drop_hit_glow.json', 'assets/lottie/drop_hit_bubble.json'];

/**
 * Short one-shot Lottie effects (the correct-drop hit). Players are pooled per file,
 * so several drops in quick succession each get their own copy.
 */
export class LottieFx {
  constructor() {
    this.live = [];
    this.pool = new Map();
  }

  /** Warm up a file so the first play has no delay. */
  preload(url, count = 2) {
    if (!url) return;
    const list = this.pool.get(url) || [];
    this.pool.set(url, list);
    for (let i = list.length; i < count; i++) list.push(loadLottie(url, 512));
  }

  async play(url, x, y, size) {
    if (!url) return;
    const list = this.pool.get(url) || [];
    this.pool.set(url, list);
    const p = list.length ? list.shift() : loadLottie(url, 512);
    const lt = await p;
    if (!lt) return;
    // Starts on the next frame drawn, so a slow first load doesn't skip the opening frames
    this.live.push({ url, lt, x, y, size, start: null });
  }

  draw(ctx, time) {
    if (!this.live.length) return;
    this.live = this.live.filter((fx) => {
      fx.start ??= time;
      const frame = (time - fx.start) * fx.lt.fps;
      if (frame >= fx.lt.frames - 1) {
        // Back into the pool for the next drop
        this.pool.get(fx.url).push(Promise.resolve(fx.lt));
        return false;
      }
      fx.lt.anim.goToAndStop(frame, true);
      ctx.drawImage(fx.lt.canvas, fx.x - fx.size / 2, fx.y - fx.size / 2, fx.size, fx.size);
      return true;
    });
  }
}
