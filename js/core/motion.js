/** Small motion toolkit: springs, easing and helpers. */

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export const ease = {
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

/**
 * Damped spring on one value. Semi-implicit Euler, sub-stepped so stiff
 * springs stay stable at low frame rates.
 */
export class Spring {
  constructor(value = 0, stiffness = 300, damping = 20) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  set(v) {
    this.value = v;
    this.target = v;
    this.velocity = 0;
  }

  step(dt) {
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = this.stiffness * (this.target - this.value) - this.damping * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }

  get settled() {
    return Math.abs(this.target - this.value) < 0.05 && Math.abs(this.velocity) < 0.05;
  }
}

/** A one-shot tween you can step manually. */
export class Tween {
  constructor(duration, easing = ease.outCubic, delay = 0) {
    this.duration = duration;
    this.easing = easing;
    this.t = -delay;
  }

  step(dt) {
    this.t += dt;
    return this.value;
  }

  get progress() {
    return clamp(this.t / this.duration, 0, 1);
  }

  get value() {
    return this.easing(this.progress);
  }

  get done() {
    return this.t >= this.duration;
  }
}

/** Deterministic random for art (same stars every load). */
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
