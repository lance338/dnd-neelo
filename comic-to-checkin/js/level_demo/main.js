import { mountGameView } from '../games/drag_drop/drag_drop_game_view.js';
import { audio } from '../services/audio_service.js';

/**
 * Level Demo: one full level (W5R1P1 Level 1), built as a few lesson templates.
 * The setup lives in game_data/level_demo/<id>.json:
 *   launchpad -> module map -> the template's steps (lesson levels) -> level complete -> map.
 * Routes: no hash = launchpad, #t1 = that template's map, #t1/0 = step 0 of template 1.
 * A "level" step is a drag and drop level played by the game view in flow mode, so finishing
 * it (Continue after its check-in) goes on to the next step.
 */
const DEMO = window.LEVEL_DEMO || 'w5_r1_p1_l1';
const app = document.getElementById('app');
let demo = null;
let current = null;
const done = new Set(); // templates finished this session: their map shows Level 1 done and Level 2 open
let lastResult = null; // the last check-in's result, for the stars

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const go = (h) => (location.hash = h);

function screen(html, cls = '') {
  current?.exit?.();
  current = null;
  app.innerHTML = `<div class="ld ${cls}">${html}</div>`;
  return app.firstElementChild;
}

/** Scales a fixed-size stage (w x h) to cover the window, centred. Returns a stop function. */
function coverStage(stage, w, h) {
  const fit = () => {
    const s = Math.max(innerWidth / w, innerHeight / h);
    stage.style.transform = `translate(${(innerWidth - w * s) / 2}px, ${(innerHeight - h * s) / 2}px) scale(${s})`;
  };
  fit();
  addEventListener('resize', fit);
  return () => removeEventListener('resize', fit);
}

/* ---------- launchpad ---------- */
function renderLaunchpad() {
  const el = screen(`
    <header class="ld-head">
      <p class="ld-kicker">${esc(demo.subtitle)}</p>
      <h1>${esc(demo.title)}</h1>
      <p class="ld-lede">Level 1 built as three lesson templates. Each one starts on the module map.</p>
    </header>
    <div class="ld-cards">
      ${demo.templates
        .map((t) => {
          const ready = !!t.steps;
          return `<button class="ld-card${ready ? '' : ' is-soon'}" data-t="${t.id}" ${ready ? '' : 'disabled'}>
            <span class="ld-card-label">${esc(t.label)} · ${esc(t.status)}</span>
            <span class="ld-card-name">${esc(t.name)}</span>
            <span class="ld-card-about">${esc(t.about)}</span>
            ${ready ? '<span class="ld-card-go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg> Play</span>' : ''}
          </button>`;
        })
        .join('')}
    </div>`, 'ld-launch');
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]:not([disabled])');
    if (!b) return;
    audio.unlock();
    go('#' + b.dataset.t);
  });
}

/* ---------- module map ---------- */
function renderMap(t) {
  const M = demo.map;
  const finished = done.has(t.id);
  const pins = M.pins
    .map((p, i) => {
      const state = i === 0 ? (finished ? 'done' : 'open') : i === 1 && finished ? 'open' : 'locked';
      const art = i === 0 && finished ? p.done : i === 1 && finished ? p.open : p.art;
      return `<button class="ld-pin is-${state}" data-i="${i}" style="left:${p.x}px;top:${p.y}px;width:${M.pinSize}px;height:${M.pinSize}px" aria-label="Level ${i + 1}${state === 'locked' ? ', locked' : ''}"><img src="${esc(art)}" alt=""></button>`;
    })
    .join('');
  const el = screen(`
    <div class="ld-map-stage" style="width:${M.w}px;height:${M.h}px">
      <img class="ld-map-art" src="${esc(M.art)}" alt="">
      ${pins}
    </div>
    <button class="ld-exit" aria-label="Back to the launchpad"><img src="assets/ui/ctl_exit.svg" alt=""></button>
    <div class="ld-toast" role="status"></div>`, 'ld-mapscreen');
  const stop = coverStage(el.querySelector('.ld-map-stage'), M.w, M.h);
  current = { exit: stop };
  el.querySelector('.ld-exit').onclick = () => go('');
  el.querySelector('.ld-map-stage').addEventListener('click', (e) => {
    const pin = e.target.closest('.ld-pin');
    if (!pin) return;
    audio.unlock();
    const i = +pin.dataset.i;
    if (i === 0) {
      audio.play('pickup', { gain: 0.6 });
      pin.classList.add('tapped');
      el.classList.add('leaving');
      setTimeout(() => go(`#${t.id}/0`), 380);
      return;
    }
    const toast = el.querySelector('.ld-toast');
    toast.textContent = pin.classList.contains('is-locked') ? 'Finish the level before it to open this one.' : 'Only Level 1 is in this demo.';
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    audio.play('bounce', { gain: 0.5 });
    pin.animate([{ rotate: '0deg' }, { rotate: '-8deg' }, { rotate: '8deg' }, { rotate: '0deg' }], { duration: 320 });
  });
}

/* ---------- level complete ---------- */
function renderComplete(t, i) {
  const C = demo.complete;
  // Stars from the check-in: right on the first try 3, after one wrong try 2, otherwise 1
  const wrong = lastResult?.wrong ?? 0;
  const stars = wrong === 0 ? 3 : wrong === 1 ? 2 : 1;
  const starPos = [
    [400, 310, 165],
    [529.8, 263.8, 135],
    [664, 275, 165],
  ];
  const el = screen(`
    <div class="ld-done-stage">
      <img class="ld-done-bg" src="${esc(C.bg)}" alt="">
      <img class="ld-sunburst" src="${esc(C.sunburst)}" alt="">
      <div class="ld-board">
        <img class="ld-board-art" src="${esc(C.scoreboard)}" alt="You did it!">
        ${C.stars.map((s, k) => `<img class="ld-star${k < stars ? ' earned' : ''}" src="${esc(s)}" style="left:${starPos[k][0] - 197}px;top:${starPos[k][1] - 132.6}px;width:${starPos[k][2]}px" alt="">`).join('')}
        <div class="ld-done-btns" style="left:${458 - 197}px;top:${629 - 132.6}px">
          <img src="${esc(C.buttons)}" alt="">
          <button class="ld-replay" aria-label="Play again"></button>
          <button class="ld-continue" aria-label="Continue"></button>
        </div>
      </div>
    </div>`, 'ld-donescreen');
  const stop = coverStage(el.querySelector('.ld-done-stage'), 1194, 834);
  current = { exit: stop };
  // The board pops in, then each earned star lands with a sound
  audio.play('complete');
  [...el.querySelectorAll('.ld-star.earned')].forEach((s, k) =>
    setTimeout(() => {
      s.classList.add('in');
      audio.play('gem', { gain: 0.7, rate: 1 + k * 0.12 });
    }, 900 + k * 380),
  );
  el.querySelector('.ld-replay').onclick = () => {
    audio.unlock();
    go(`#${t.id}/0`);
  };
  el.querySelector('.ld-continue').onclick = () => {
    audio.unlock();
    done.add(t.id);
    go('#' + t.id);
  };
}

/* ---------- steps ---------- */
async function renderStep(t, i) {
  const step = t.steps[i];
  if (!step) return go('#' + t.id);
  if (step.type === 'complete') return renderComplete(t, i);
  current?.exit?.();
  current = await mountGameView(app, step.id, {
    flow: true,
    onExit: () => go('#' + t.id),
    onNext: (result) => {
      if (result) lastResult = result;
      go(`#${t.id}/${i + 1}`);
    },
  });
}

/* ---------- router ---------- */
async function route() {
  if (!demo) demo = await fetch(`game_data/level_demo/${DEMO}.json`).then((r) => r.json());
  document.title = demo.title + ' · Level Demo';
  const m = location.hash.match(/^#(t\d)(?:\/(\d+))?$/);
  const t = m && demo.templates.find((x) => x.id === m[1] && x.steps);
  if (!t) return renderLaunchpad();
  if (m[2] === undefined) return renderMap(t);
  return renderStep(t, +m[2]);
}

window.addEventListener('hashchange', route);
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
route();
