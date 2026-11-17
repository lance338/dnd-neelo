import { audio } from '../../services/audio_service.js';

/**
 * Check-in template (the "Check In Flow" in Lance's Sandbox, Figma 3041:176514).
 * The CMS finds the quiz in the spec sheet and opens this with the level's
 * `checkin` block:
 *
 *   Nova asks -> pick an answer (it turns navy, Check Answer appears)
 *   -> Check Answer -> Nova responds in the middle, then 1s after the line:
 *        correct          -> "Great Job!" summary, coins fly to the counter
 *        first wrong      -> back to the quiz, that answer greyed out
 *        second wrong     -> "Nice Try" summary (no reward)
 *   -> Continue Lesson (onDone('continue')).
 *
 * Laid out on the 1194 x 834 check-in frame and scaled to fit the screen.
 */
const W = 1194;
const H = 834;
const ANSWER_Y = [107.4, 294.5, 481.6];
const CLOUD = 'M226.917 0C241.678 0 254.849 4.16893 263.469 10.6882C267.715 8.94562 272.599 7.95233 277.797 7.95233C287.086 7.95233 295.375 11.1216 300.807 16.0797C308.414 11.4983 318.113 8.75126 328.678 8.75126C353.104 8.75126 372.905 23.4277 372.905 41.5321C397.331 41.5321 417.132 56.2086 417.132 74.3129C417.132 85.2123 409.952 94.8667 398.911 100.827C402.115 103.754 404.037 107.484 404.037 111.547C404.037 118.276 398.77 124.091 391.126 126.856C391.565 128.171 391.801 129.545 391.801 130.961C391.801 139.889 382.529 147.211 370.732 147.928C361.892 154.825 349.401 159.125 335.553 159.125C322.617 159.125 310.864 155.373 302.166 149.257C300.198 149.572 298.155 149.74 296.06 149.74C292.51 149.74 289.111 149.262 285.971 148.39C277.171 155.016 264.932 159.125 251.397 159.125C239.458 159.125 228.529 155.928 220.077 150.627C215.89 152.39 211.049 153.397 205.889 153.397C198.905 153.397 192.503 151.552 187.52 148.484C178.729 155.055 166.541 159.125 153.069 159.125C137.723 159.125 124.043 153.843 115.152 145.599C107.323 149.611 97.8286 151.965 87.5905 151.965C62.7154 151.965 42.2159 138.09 39.403 120.212C17.2007 118.213 0 104.197 0 87.2006C0 77.5927 5.49888 68.9379 14.2887 62.8665C10.7089 59.3117 8.58988 54.9013 8.58988 50.1243C8.58988 39.8186 18.4533 31.2195 31.565 29.2325C34.3899 15.3865 50.5143 4.77386 69.9833 4.77386C81.4427 4.77386 91.7414 8.45194 98.8535 14.3006C104.211 11.604 110.679 10.0286 117.643 10.0286C123.033 10.0286 128.124 10.9733 132.634 12.6497C139.76 6.19144 150.595 2.06884 162.729 2.06884C173.562 2.06884 183.357 5.35588 190.405 10.6561C199.025 4.15474 212.178 0 226.917 0Z';
const TAIL = '<svg class="ci-tail" viewBox="0 0 28 14" aria-hidden="true"><path d="M14.5512 13.275C14.1997 13.6264 13.63 13.6264 13.2785 13.275L0 0H27.8297L14.5512 13.275Z" fill="#595492"/></svg>';

const CSS = `
.ci-root { position: absolute; inset: 0; z-index: 30; background: #14122a; overflow: hidden; opacity: 0; transform: scale(1.025); transition: opacity .8s ease, transform 1s cubic-bezier(.2,.7,.3,1); font-family: "Merriweather Sans", "Trebuchet MS", system-ui, sans-serif; touch-action: manipulation; }
.ci-root.show { opacity: 1; transform: none; }
/* Before the first question animates in, only the scene is shown (no flash of Nova, the question or the answers) */
.ci-root.pre .ci-nq, .ci-root.pre .ci-q, .ci-root.pre .ci-answer { opacity: 0; }
.ci-stage { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px; transform-origin: 50% 50%; overflow: hidden; }
.ci-stage img { max-width: none; display: block; pointer-events: none; -webkit-user-drag: none; }
.ci-bg { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
.ci-sign { transition: opacity .45s ease; }
.ci-nova { position: absolute; }
.ci-pose { position: absolute; left: 0; top: 0; transform-origin: 50% 100%; animation: ci-breathe 2.8s ease-in-out infinite alternate; }
@keyframes ci-breathe { from { transform: scale(1, 1); } to { transform: scale(.995, 1.012); } }
.ci-eye { position: absolute; border-radius: 50%; overflow: hidden; pointer-events: none; }
.ci-eye i { position: absolute; inset: 0; transform: translateY(-102%); }
.ci-eye b { position: absolute; left: 14%; width: 72%; top: 38%; height: 30%; border-bottom: 3.5px solid; border-radius: 0 0 50% 50% / 0 0 100% 100%; opacity: 0; }
.ci-box { position: absolute; width: 422px; box-sizing: border-box; background: #fff; border: 3.6px solid #595492; border-radius: 14.4px; display: grid; place-items: center; text-align: center; color: #2e2a53; font-weight: 700; font-size: 20px; line-height: 1.4; letter-spacing: -0.02em; }
.ci-tag { position: absolute; left: 50%; top: -27px; width: 199px; height: 53px; margin-left: -99.5px; box-sizing: border-box; background: #2e2a53; color: #fff; border-radius: 7.2px; display: grid; place-items: center; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; }
.ci-tail { position: absolute; left: 50%; bottom: -14px; width: 28px; height: 14px; margin-left: -14px; }
.ci-q { left: 61px; top: 117px; min-height: 186px; padding: 52px 40px 40px; }
.ci-r { left: 400px; top: 90px; min-height: 186px; padding: 52px 36px 40px; opacity: 0; }
.ci-answer { position: absolute; left: 649px; width: 417px; height: 159px; padding: 0; border: 0; background: none; cursor: pointer; font: inherit; }
.ci-answer svg { position: absolute; left: -1px; top: 0; width: 418px; height: 160px; overflow: visible; }
.ci-answer path { fill: #fff; stroke: transparent; stroke-width: 4; transition: fill .15s ease, stroke .15s ease; }
.ci-answer span { position: relative; display: grid; place-items: center; height: 100%; padding: 0 38px; color: #2e2a53; font-weight: 800; font-size: 20px; line-height: 1.4; letter-spacing: -0.02em; text-align: center; transition: color .15s ease; }
.ci-answer.selected path { fill: #2e2a53; stroke: #ffe135; }
.ci-answer.selected span { color: #fff; }
.ci-answer.inactive { opacity: .3; cursor: default; }
.ci-answer.gone { visibility: hidden; }
.ci-cta { position: absolute; height: 76px; width: 242px; padding: 0 20px; box-sizing: border-box; background: #fc611f; border: 5px solid #fff; border-radius: 14.3px; color: #fff; font: inherit; font-weight: 700; font-size: 23.87px; letter-spacing: -0.01em; cursor: pointer; white-space: nowrap; box-shadow: 0 6px 0 rgba(46, 42, 83, .18); }
.ci-cta:active { translate: 0 3px; box-shadow: 0 3px 0 rgba(46, 42, 83, .18); }
.ci-check { left: 738px; top: 674px; opacity: 0; pointer-events: none; }
.ci-sum { position: absolute; inset: 0; pointer-events: none; }
.ci-sum > * { position: absolute; opacity: 0; }
.ci-sum.on { pointer-events: auto; }
.ci-glow { left: 426px; top: 374px; width: 343px; height: 162px; border-radius: 300px; background: radial-gradient(ellipse at center, rgba(255, 224, 0, .7) 0%, rgba(255, 224, 0, .28) 45%, rgba(255, 224, 0, 0) 70%); }
.ci-pill { left: 468px; top: 409px; width: 258px; height: 91px; border-radius: 300px; background: #fff; display: flex; align-items: center; justify-content: center; gap: 12px; color: #312f51; font-weight: 800; font-size: 38.6px; font-variant-numeric: tabular-nums; }
.ci-pill img { width: 58px; height: 58px; }
.ci-coin { position: absolute; left: 0; top: 0; width: 58px; height: 58px; pointer-events: none; }
.ci-hud { position: absolute; top: 16px; width: 56px; height: 56px; padding: 0; border: 0; background: none; cursor: pointer; border-radius: 14px; }
.ci-coins { position: absolute; left: 876px; top: 16px; transform-origin: 85% 50%; }
.ci-fx { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; pointer-events: none; }
.ci-answer:focus-visible, .ci-cta:focus-visible, .ci-hud:focus-visible { outline: 4px solid #ffe135; outline-offset: 3px; }
`;

let cssAdded = false;
function addCss() {
  if (cssAdded) return;
  cssAdded = true;
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@700;800&display=swap';
  document.head.appendChild(font);
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const words = (s) => s.trim().split(/\s+/).length;
const lerp = (a, b, t) => a + (b - a) * t;

function popIn(el, delay = 0, from = 0.7, op = 1) {
  return el.animate(
    [
      { transform: `scale(${from})`, opacity: 0 },
      { transform: 'scale(1.05)', opacity: op, offset: 0.7 },
      { transform: 'scale(1)', opacity: op },
    ],
    { duration: 380, delay, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' },
  );
}
function fadeOut(el, dur = 250) {
  return el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: dur, fill: 'forwards' }).finished;
}

/** Eyelids for blinking: eyes are [x, y, diameter] in the art's pixels. */
function addEyes(parent, eyes = [], lid, lash) {
  return eyes.map(([x, y, d]) => {
    const e = document.createElement('div');
    e.className = 'ci-eye';
    Object.assign(e.style, { left: x - 1 + 'px', top: y - 1 + 'px', width: d + 2 + 'px', height: d + 2 + 'px' });
    e.innerHTML = `<i style="background:${lid}"></i><b style="border-color:${lash}"></b>`;
    parent.appendChild(e);
    return e;
  });
}
function blink(eyes) {
  eyes.forEach((e) => {
    e.firstChild.animate([{ transform: 'translateY(-102%)' }, { transform: 'translateY(0)', offset: 0.4 }, { transform: 'translateY(0)', offset: 0.6 }, { transform: 'translateY(-102%)' }], { duration: 190, easing: 'ease-in-out' });
    e.lastChild.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 190 });
  });
}

const warmed = new Map();
/** Loads and decodes a check-in's art ahead of time (called when its level loads). */
export function prewarmCheckin(cfg) {
  const walk = (v) => (typeof v === 'string' ? (/\.(svg|png|jpe?g|webp)$/i.test(v) ? [v] : []) : v && typeof v === 'object' ? Object.values(v).flatMap(walk) : []);
  walk(cfg).forEach((src) => {
    if (warmed.has(src)) return;
    const im = new Image();
    im.src = src;
    warmed.set(src, im);
    im.decode().catch(() => {});
  });
}

export function mountCheckin(host, cfg, { onDone, onExit } = {}) {
  addCss();
  const A = cfg.art;
  const root = document.createElement('div');
  root.className = 'ci-root pre';
  root.innerHTML = `
    <div class="ci-stage" role="application" aria-label="Check-in">
      <img class="ci-bg" src="${A.bg}" alt="">
      <img class="ci-bg ci-sign" src="${A.bgSign}" alt="">
      <div class="ci-nova ci-nq"></div>
      <div class="ci-nova ci-nr" style="opacity:0"></div>
      <div class="ci-box ci-q"><div class="ci-tag">Nova</div><div class="ci-qt"></div>${TAIL}</div>
      <div class="ci-box ci-r" role="status" aria-live="polite"><div class="ci-tag">Nova</div><div class="ci-rt"></div>${TAIL}</div>
      <div class="ci-answers"></div>
      <button class="ci-cta ci-check" tabindex="-1">Check Answer</button>
      <div class="ci-sum ci-great">
        <img src="${A.titleGreat}" style="left:360px;top:164px" alt="Great Job!">
        <div class="ci-glow"></div>
        <div class="ci-pill"><img src="${A.coin}" alt=""><span>+${cfg.reward ?? 450}</span></div>
        <button class="ci-cta ci-cont" style="left:476px;top:585px">Continue Lesson</button>
      </div>
      <div class="ci-sum ci-try">
        <img src="${A.titleTry}" style="left:401px;top:253px" alt="Nice Try">
        <button class="ci-cta ci-cont" style="left:476px;top:441px">Continue Lesson</button>
      </div>
      <button class="ci-hud ci-exit" style="left:16px" aria-label="Back"><img src="${A.hudExit}" alt=""></button>
      <button class="ci-hud ci-help" style="left:88px" aria-label="Hear the question again"><img src="${A.hudHelp}" alt=""></button>
      <img class="ci-coins" src="${A.hudCoins}" alt="Stars and coins">
      <canvas class="ci-fx" width="${W * 2}" height="${H * 2}"></canvas>
    </div>`;
  host.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const stage = $('.ci-stage');

  const fit = () => {
    const r = host.getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  fit();
  window.addEventListener('resize', fit);

  // Nova: the quiz pose stands at the left, the response poses come to the middle
  const novaQ = $('.ci-nq');
  const novaR = $('.ci-nr');
  const P = cfg.nova;
  const eyes = [];
  const mkPose = (parent, p, hidden) => {
    const d = document.createElement('div');
    d.className = 'ci-pose';
    Object.assign(d.style, { width: p.w + 'px', height: p.h + 'px', opacity: hidden ? 0 : 1 });
    d.innerHTML = `<img src="${p.img}" alt="Nova" style="width:${p.w}px;height:${p.h}px">`;
    parent.appendChild(d);
    eyes.push(...addEyes(d, p.eyes, P.lid, P.lash));
    return d;
  };
  Object.assign(novaQ.style, { left: P.quiz.x + 'px', top: P.quiz.y + 'px', width: P.quiz.w + 'px', height: P.quiz.h + 'px' });
  mkPose(novaQ, P.quiz);
  const poseWrong = mkPose(novaR, P.incorrect, false);
  const poseRight = mkPose(novaR, P.correct, true);

  // Sparkle canvas
  const fx = $('.ci-fx').getContext('2d');
  const parts = [];
  function burst(x, y, n = 30, ring = 160) {
    parts.push({ ring: true, x, y, t: 0, life: 0.55, r: ring });
    const cols = ['#FFF6B8', '#FFD84A', '#FFFFFF', '#FFB3D9', '#B8F5FF'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 180 + Math.random() * 320;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: 0, life: 0.6 + Math.random() * 0.5, r: 7 + Math.random() * 9, rot: Math.random() * 3, c: cols[i % cols.length] });
    }
  }

  let alive = true;
  let last = performance.now();
  let nextBlink = 1.2;
  let clock = 0;
  const answerEls = [];
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    if (clock > nextBlink) {
      blink(eyes);
      if (Math.random() < 0.2) setTimeout(() => blink(eyes), 260);
      nextBlink = clock + 2.2 + Math.random() * 2.6;
    }
    answerEls.forEach((el, i) => {
      if (!el.dataset.anim) el.style.transform = `translateY(${Math.sin(clock * 1.3 + i * 1.7) * 3}px)`;
    });
    fx.setTransform(1, 0, 0, 1, 0, 0);
    fx.clearRect(0, 0, W * 2, H * 2);
    fx.setTransform(2, 0, 0, 2, 0, 0);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) {
        parts.splice(i, 1);
        continue;
      }
      const k = p.t / p.life;
      if (p.ring) {
        fx.globalAlpha = (1 - k) * 0.9;
        fx.strokeStyle = '#FFFFFF';
        fx.lineWidth = 10 * (1 - k) + 1;
        fx.beginPath();
        fx.arc(p.x, p.y, p.r * (1 - Math.pow(1 - k, 3)), 0, Math.PI * 2);
        fx.stroke();
        continue;
      }
      p.vx *= 0.965;
      p.vy = p.vy * 0.965 + 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += dt * 4;
      fx.globalAlpha = 1 - k * k;
      fx.fillStyle = p.c;
      fx.save();
      fx.translate(p.x, p.y);
      fx.rotate(p.rot);
      fx.beginPath();
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2;
        const rr = j % 2 ? p.r * 0.32 : p.r * (1 - k * 0.5);
        fx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      fx.closePath();
      fx.fill();
      fx.restore();
    }
    fx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Answers (order as in the spec)
  const checkBtn = $('.ci-check');
  let selected = null;
  let wrongCount = 0;
  const tried = new Set();
  let locked = true;
  cfg.answers.forEach((a, i) => {
    const b = document.createElement('button');
    b.className = 'ci-answer';
    b.style.top = ANSWER_Y[i] + 'px';
    b.innerHTML = `<svg viewBox="0 0 418 160" aria-hidden="true"><path d="${CLOUD}"/></svg><span></span>`;
    b.querySelector('span').textContent = a.text;
    b.addEventListener('click', () => pick(i));
    $('.ci-answers').appendChild(b);
    answerEls.push(b);
  });
  $('.ci-qt').textContent = cfg.question;

  function pick(i) {
    if (locked || tried.has(i)) return;
    audio.unlock();
    selected = i;
    answerEls.forEach((x, j) => x.classList.toggle('selected', j === i));
    const el = answerEls[i];
    el.dataset.anim = '1';
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }).onfinish = () => delete el.dataset.anim;
    audio.play('pickup');
    if (checkBtn.style.opacity !== '1') {
      checkBtn.style.opacity = 1;
      checkBtn.style.pointerEvents = 'auto';
      checkBtn.tabIndex = 0;
      checkBtn.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'ease-out' });
    }
  }
  checkBtn.addEventListener('click', () => {
    if (!locked && selected !== null) check();
  });

  async function ask(first) {
    $('.ci-sign').style.opacity = 1;
    novaQ.getAnimations().forEach((x) => x.cancel());
    root.classList.remove('pre');
    novaQ.animate([{ transform: 'translateX(-60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
    const q = $('.ci-q');
    q.getAnimations().forEach((x) => x.cancel());
    popIn(q, 120, 0.8);
    answerEls.forEach((el, i) => {
      el.classList.remove('selected', 'gone');
      el.classList.toggle('inactive', tried.has(i));
      el.disabled = tried.has(i);
      el.getAnimations().forEach((x) => x.cancel());
      el.dataset.anim = '1';
      const an = popIn(el, 280 + i * 110, 0.75, tried.has(i) ? 0.3 : 1);
      an.onfinish = () => {
        an.cancel();
        delete el.dataset.anim;
      };
    });
    checkBtn.getAnimations().forEach((x) => x.cancel());
    checkBtn.style.opacity = 0;
    checkBtn.style.pointerEvents = 'none';
    checkBtn.tabIndex = -1;
    audio.speak(cfg.question, 'nova');
    await sleep(700);
    locked = false;
  }

  /** Wait for the line to finish (its voice, or reading time), plus 1 second; a tap moves on sooner. */
  function afterLine(text, src) {
    const ms = (src && src.buffer ? src.buffer.duration * 1000 : 1600 + words(text) * 300) + 1000;
    return new Promise((res) => {
      const t = setTimeout(done, ms);
      function done() {
        clearTimeout(t);
        root.removeEventListener('pointerdown', tap);
        audio.stopVoice();
        res();
      }
      function tap(e) {
        if (!e.target.closest('button')) done();
      }
      setTimeout(() => alive && root.addEventListener('pointerdown', tap), 400);
    });
  }

  async function check() {
    locked = true;
    const a = cfg.answers[selected];
    const idx = selected;
    selected = null;
    checkBtn.style.pointerEvents = 'none';
    checkBtn.tabIndex = -1;
    audio.play(a.correct ? 'hit' : 'bounce');
    await Promise.all([fadeOut(checkBtn, 200), ...answerEls.map((el) => ((el.dataset.anim = '1'), fadeOut(el, 260))), fadeOut($('.ci-q'), 220), fadeOut(novaQ, 220)]);
    if (!alive) return;
    $('.ci-sign').style.opacity = 0;
    let text = a.feedback;
    if (!a.correct) {
      wrongCount += 1;
      tried.add(idx);
      if (wrongCount >= 2) text = cfg.secondWrong;
    }
    $('.ci-rt').textContent = text;
    const p = a.correct ? P.correct : P.incorrect;
    poseRight.style.opacity = a.correct ? 1 : 0;
    poseWrong.style.opacity = a.correct ? 0 : 1;
    Object.assign(novaR.style, { left: 611 - p.cx + 'px', top: P.respondY + 'px', width: p.w + 'px', height: p.h + 'px' });
    novaR.getAnimations().forEach((x) => x.cancel());
    novaR.animate([{ transform: 'translateY(120px)', opacity: 0 }, { transform: 'translateY(-14px)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
    const rb = $('.ci-r');
    rb.getAnimations().forEach((x) => x.cancel());
    popIn(rb, 260, 0.8);
    if (a.correct) setTimeout(() => burst(611, 360), 350);
    await sleep(450);
    const src = await audio.speak(text, 'nova');
    await afterLine(text, src);
    if (!alive) return;
    await Promise.all([fadeOut(rb, 220), fadeOut(novaR, 260)]);
    answerEls.forEach((el) => el.classList.add('gone'));
    if (a.correct) return greatJob();
    if (wrongCount >= 2) return niceTry();
    $('.ci-q').getAnimations().forEach((x) => x.cancel());
    await ask(false);
  }

  async function greatJob() {
    $('.ci-sign').style.opacity = 1;
    const s = $('.ci-great');
    const [title, glow, pill, btn] = s.children;
    s.classList.add('on');
    popIn(title, 0, 0.4);
    audio.play('complete');
    setTimeout(() => burst(597, 250, 34, 220), 200);
    await sleep(500);
    glow.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 500, fill: 'both', easing: 'ease-out' });
    glow.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.25)' }, { filter: 'brightness(1)' }], { duration: 1600, iterations: Infinity, delay: 500 });
    popIn(pill, 80, 0.5);
    await sleep(700);
    // Coin reward: coins arc from the pill to the coin counter
    const from = { x: 540, y: 455 };
    const to = { x: 1136, y: 44 };
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('img');
      c.src = A.coin;
      c.className = 'ci-coin';
      c.alt = '';
      stage.appendChild(c);
      const midX = lerp(from.x, to.x, 0.45) + (Math.random() - 0.5) * 120;
      const midY = Math.min(from.y, to.y) - 60 - Math.random() * 80;
      const frames = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const u = 1 - t;
        const x = u * u * from.x + 2 * u * t * midX + t * t * to.x;
        const y = u * u * from.y + 2 * u * t * midY + t * t * to.y;
        frames.push({ transform: `translate(${x - 29}px, ${y - 29}px) scale(${lerp(1, 0.55, t)}) rotate(${t * 220}deg)`, opacity: t > 0.92 ? 0 : 1 });
      }
      c.animate(frames, { duration: 780, delay: i * 90, easing: 'cubic-bezier(.45,0,.6,1)', fill: 'both' }).onfinish = () => {
        c.remove();
        $('.ci-coins').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: 160 });
        // The first coin to land starts a quick run of hits on the counter, 40 ms apart
        if (i === 0) for (let k = 0; k < 5; k++) setTimeout(() => audio.play('coins', { repeat: true }), k * 40);
      };
    }
    await sleep(9 * 90 + 700);
    popIn(btn, 0, 0.6);
  }

  async function niceTry() {
    $('.ci-sign').style.opacity = 1;
    const s = $('.ci-try');
    const [title, btn] = s.children;
    s.classList.add('on');
    popIn(title, 0, 0.4);
    audio.play('transform', { gain: 0.7 });
    await sleep(600);
    popIn(btn, 0, 0.6);
  }

  // The result goes along with Continue: wrong tries before the right answer (2 means it was given)
  root.querySelectorAll('.ci-cont').forEach((b) => b.addEventListener('click', () => onDone?.('continue', { wrong: wrongCount })));
  $('.ci-exit').addEventListener('click', () => onExit?.());
  $('.ci-help').addEventListener('click', () => {
    if (locked) return;
    $('.ci-q').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 360 });
    audio.speak(cfg.question, 'nova');
  });

  // The game fades over to the check-in once every image is decoded, so nothing
  // pops in or flashes partway through (with a cap so a slow image never blocks it)
  const imgs = [...root.querySelectorAll('img')];
  Promise.race([Promise.all(imgs.map((i) => i.decode().catch(() => {}))), sleep(2500)]).then(() => {
    if (!alive) return;
    requestAnimationFrame(() => root.classList.add('show'));
    setTimeout(() => alive && ask(true), 850);
  });

  return {
    destroy() {
      alive = false;
      window.removeEventListener('resize', fit);
      root.remove();
    },
  };
}
