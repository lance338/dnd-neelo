import { DragDropGame } from './drag_drop_game.js';
import { SCENES } from './scenes/index.js';
import { audio } from '../../services/audio_service.js';
import { Icons } from '../../components/icons.js';
import { createTuningPanel } from './ui/tuning_panel.js';
import { tuning } from '../../services/tuning_service.js';

/**
 * Hosts the game plus its overlays (drag_drop_game_view.dart: a
 * ConsumerStatefulWidget with GameWidget + overlay widgets).
 *
 * Nova flow:
 *  1. Intro: Nova (world outfit, quiz pose) rises from below the screen with a
 *     dialog box that says what to do. Game input is locked.
 *  2. "Let's go!": Nova shrinks into the hint circle (bottom right).
 *  3. Play: every say() pops a large bubble above the circle and Nova reacts.
 *     Tapping the circle asks for a hint (line + hand demo).
 *  4. Finish: the circle grows back into Nova (correct pose) with the
 *     success line, stats and the next actions.
 */
const novaArt = (world, pose) => `assets/img/nova_w${world}_${pose}.png`;
/** Nova's head inside the shared 1240 x 1962 NPC frame: centre height and width, as fractions of the art. */
const NOVA_HEAD = { cy: 1001 / 1962, w: 592 / 1240 };
const TONE_ICON = { cheer: '★', hint: '?', info: '' };

export async function mountGameView(root, levelId, { onExit, onNext, nextLabel }) {
  root.innerHTML = `
    <div class="game">
      <canvas></canvas>
      <div class="loading" role="status" aria-label="Loading"><i></i><i></i><i></i></div>
      <button class="hud-btn hud-back" aria-label="Back">${Icons.back}</button>
      <div class="hud-right">
        <button class="hud-btn" data-a="replay" aria-label="Replay">${Icons.replay}</button>
        <button class="hud-btn" data-a="mute" aria-label="Sound">${audio.muted ? Icons.mute : Icons.sound}</button>
        <button class="hud-btn" data-a="tune" aria-label="Tuning">${Icons.sliders}</button>
      </div>
      <div class="meter"><div class="meter-fill"></div><img class="meter-star" src="assets/img/sundrop_yellow.png" alt=""></div>
      <div class="comic" aria-live="polite"><img class="comic-frame" alt=""><img class="comic-frame" alt=""><div class="comic-end"></div></div>
      <div class="nova-say" aria-live="polite"><span class="ns-icon"></span><span class="ns-text"></span></div>
      <button class="nova-circle" aria-label="Ask Nova for a hint">
        <span class="nc-face"><img alt="" class="nc-img"></span>
        <span class="nc-badge">?</span>
      </button>
      <div class="nova-stage" aria-live="polite">
        <div class="nova-scrim"></div>
        <img class="nova-body" alt="Nova">
        <div class="nova-dialog">
          <div class="nd-tag">Nova</div>
          <div class="nd-text"></div>
          <div class="nd-extra"></div>
        </div>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const gameEl = $('.game');
  const canvas = $('canvas');
  const meter = $('.meter');
  const fill = $('.meter-fill');
  const say = $('.nova-say');
  const sayText = $('.ns-text');
  const sayIcon = $('.ns-icon');
  const circle = $('.nova-circle');
  const circleImg = $('.nc-img');
  const stage = $('.nova-stage');
  const body = $('.nova-body');
  const dialog = $('.nova-dialog');
  const dialogText = $('.nd-text');
  const dialogExtra = $('.nd-extra');
  const panel = createTuningPanel(gameEl);

  let game = null;
  let world = 1;
  let isExiting = false;
  let sayTimer;
  let faceTimer;
  let runId = 0;

  const setFace = (pose, hold) => {
    circleImg.src = novaArt(world, pose === 'flat' ? 'head_flat' : 'head');
    clearTimeout(faceTimer);
    if (hold) faceTimer = setTimeout(() => setFace('happy'), hold * 1000);
  };
  const pulse = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  const hud = {
    say(text, { duration = 4, tone = 'info' } = {}) {
      if (!text || stage.classList.contains('show')) return;
      // Feedback stays up long enough to read, however short the scene asked for
      const secs = Math.max(duration, tuning.get('feedbackMinSeconds'), text.length / 14);
      sayText.textContent = text;
      audio.speak(text, 'nova');
      sayIcon.textContent = TONE_ICON[tone] || '';
      say.className = 'nova-say ' + tone;
      say.style.setProperty('--lift', '0px');
      pulse(say, 'show');
      liftClear();
      circle.classList.add('talking');
      pulse(circle, tone === 'hint' ? 'shake' : 'hop');
      setFace(tone === 'hint' ? 'flat' : 'happy', tone === 'hint' ? secs : 0);
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => {
        say.classList.remove('show');
        circle.classList.remove('talking');
      }, secs * 1000);
    },
    /** The player picked something up: the bubble ducks out of the way. */
    onDragStart() {
      clearTimeout(sayTimer);
      say.classList.remove('show');
      circle.classList.remove('talking');
    },
    /** Idle hint fired: make the circle call for attention. */
    nudge() {
      pulse(circle, 'nudge');
    },
    celebrate() {
      setFace('happy');
      pulse(circle, 'hop');
    },
    setProgress(p, animate) {
      fill.style.width = `calc(${Math.round(p * 100)}% - ${p > 0 ? 8 : 0}px)`;
      if (animate) pulse(meter, 'tick');
      meter.classList.toggle('full', p >= 1);
    },
    onComplete(summary) {
      showFinale(summary);
    },
  };

  /** Raise the bubble until it no longer covers an item waiting to be dragged. */
  function liftClear() {
    if (!game) return;
    // Layout values, not the bounding box: the pop-in animation scales the bubble
    const g = gameEl.getBoundingClientRect();
    const cs = getComputedStyle(say);
    const h = say.offsetHeight;
    const right = g.width - (parseFloat(cs.right) || 0);
    const left = right - say.offsetWidth;
    let bottom = parseFloat(cs.bottom) || 0;
    const base = bottom;
    const rects = game.restingItemRects().map((r) => ({ ...r }));
    for (let n = 0; n < 6; n++) {
      const top = g.height - bottom - h;
      const bot = g.height - bottom;
      const hit = rects.find((r) => r.right > left && r.left < right && r.bottom > top && r.top < bot);
      if (!hit) break;
      bottom = g.height - hit.top + 8;
    }
    // Never push it off the top of the screen; then it stays where it was
    if (g.height - bottom - h < 80) bottom = base;
    say.style.setProperty('--lift', `${bottom - base}px`);
  }

  /* ---------- Story stage (intro + finale): Nova or Skyrian ---------- */
  const NAMES = { nova: 'Nova', skyrian: 'Skyrian' };
  const charArt = (who, pose) => (who === 'nova' ? novaArt(world, pose) : `assets/img/${who}_${pose}.png`);
  let onStage = null; // who is standing on the stage right now

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Rise a character (or swap the line if they are already up). */
  async function showBeat({ who = 'nova', pose = 'quiz', text = '' }, extraHtml = '', { scrim = 'dark' } = {}) {
    hideCircle();
    say.classList.remove('show');
    if (onStage && onStage !== who) {
      // Swap characters: the current one sinks, the next one rises
      stage.classList.remove('risen');
      await sleep(380);
    }
    const sameChar = onStage === who && stage.classList.contains('risen');
    body.getAnimations().forEach((x) => x.cancel());
    body.src = charArt(who, pose);
    $('.nd-tag').textContent = NAMES[who] || who;
    dialogText.textContent = text;
    dialogExtra.innerHTML = extraHtml;
    stage.className = `nova-stage show who-${who} pose-${pose} scrim-${scrim}${sameChar ? ' risen' : ''}`;
    if (sameChar) {
      pulse(dialog, 'swap');
      pulse(body, 'bob');
    } else {
      // Over a comic the page dims first, then the character pops in
      await sleep(scrim === 'comic' ? 550 : 30);
      stage.classList.add('risen');
    }
    onStage = who;
    // The voice starts as the dialog pops in; the character bobs while talking
    await sleep(sameChar ? 120 : 420);
    const src = await audio.speak(text, who);
    if (src && src.buffer) {
      body.classList.add('talking');
      setTimeout(() => body.classList.remove('talking'), src.buffer.duration * 1000);
    }
  }

  /** Wait for the player to continue (button, character, dialog or scrim). */
  function waitTap(id) {
    return new Promise((resolve) => {
      const auto = tuning.get('introAutoContinue') > 0 ? setTimeout(done, tuning.get('introAutoContinue') * 1000) : null;
      function done() {
        clearTimeout(auto);
        stage.onclick = null;
        audio.unlock();
        audio.stopVoice();
        resolve(id === runId);
      }
      stage.onclick = (e) => {
        if (e.target.closest('.nd-go, .nova-dialog, .nova-body, .nova-scrim')) done();
      };
    });
  }

  function hideCircle() {
    circle.classList.remove('in');
  }

  function circleIn() {
    setFace('happy');
    circle.classList.add('in');
    pulse(circle, 'pop');
  }

  /** Nova shrinks into the circle: his head lands exactly on the circle. */
  async function shrinkIntoCircle() {
    stage.classList.add('leaving');
    const r = body.getBoundingClientRect();
    const c = circle.getBoundingClientRect();
    // Art is the shared NPC frame (Figma Section 3): Nova's head is centred at 51% of the
    // height and is 48% of the width wide.
    const headY = r.height * NOVA_HEAD.cy;
    const dx = c.left + c.width / 2 - (r.left + r.width / 2);
    const dy = c.top + c.height / 2 - (r.top + headY);
    // The circle is still scaled to 0 here, so use its layout size (the centre is unaffected)
    const s = (circle.offsetWidth * 0.98) / (r.width * NOVA_HEAD.w);
    body.style.transformOrigin = `50% ${headY}px`;
    const anim = body.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: `translate(${dx * 0.2}px, ${dy * 0.2 - 30}px) scale(${0.9})`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 1, offset: 0.9 },
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 },
      ],
      { duration: tuning.get('novaShrinkMs'), easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' },
    );
    await anim.finished.catch(() => {});
    stage.className = 'nova-stage';
    onStage = null;
    circleIn();
    await sleep(250);
    body.getAnimations().forEach((x) => x.cancel());
  }

  /** Any other character waves goodbye and sinks back down; Nova's circle pops in. */
  async function sinkAway() {
    stage.classList.add('leaving');
    stage.classList.remove('risen');
    await sleep(520);
    stage.className = 'nova-stage';
    onStage = null;
    circleIn();
    await sleep(250);
  }

  /* ---------- Comic strip: frames play one after another, like the app ---------- */
  const comic = $('.comic');
  const comicImgs = [...comic.querySelectorAll('.comic-frame')];
  let comicFront = 0;

  /** Show one frame: it slides in over the last one, its line plays, then it moves on. */
  async function comicFrame(frame, id) {
    const shown = comicImgs[comicFront];
    if (comic.classList.contains('show') && shown.classList.contains('in') && shown.getAttribute('src') === frame.img) return comicLine(frame, id);
    const img = comicImgs[comicFront ^ 1];
    await new Promise((r) => {
      img.onload = r;
      img.onerror = r;
      img.src = frame.img;
      if (img.complete) r();
    });
    if (id !== runId) return false;
    comic.classList.add('show');
    img.classList.remove('in', 'out');
    void img.offsetWidth;
    img.classList.add('in');
    comicImgs[comicFront].classList.remove('instant');
    comicImgs[comicFront].classList.add('out');
    comicFront ^= 1;
    await sleep(420);
    return comicLine(frame, id);
  }

  /** Play a frame's line, then wait for it (or a tap). */
  async function comicLine(frame, id) {
    const src = frame.text ? await audio.speak(frame.text, frame.who) : null;
    const secs = src && src.buffer ? src.buffer.duration + 0.7 : Math.max(2.6, (frame.text || '').length / 14 + 0.8);
    // Tap anywhere on the comic to move on sooner
    await new Promise((r) => {
      const t = setTimeout(done, secs * 1000);
      function done() {
        clearTimeout(t);
        comic.onclick = null;
        r();
      }
      comic.onclick = () => {
        audio.unlock();
        audio.stopVoice();
        done();
      };
    });
    return id === runId;
  }

  async function playComic(frames, id) {
    for (const f of frames || []) if (!(await comicFrame(f, id))) return false;
    return true;
  }

  function hideComic() {
    comic.classList.remove('show');
    comic.onclick = null;
    comicImgs.forEach((i) => i.classList.remove('in', 'out', 'instant'));
    comic.querySelector('.comic-end').innerHTML = '';
    comic.classList.remove('ending');
  }

  async function runIntro(level) {
    const id = runId;
    if (level.comic?.before && !(await playComic(level.comic.before, id))) return false;
    // Comic lines before play: NPCs speak in the scene
    for (const beat of level.story?.before || []) {
      await game.talk(beat.who, beat.text, { mood: beat.mood });
      if (id !== runId) return false;
      await sleep(250);
    }
    const beats = level.story?.intro || [{ who: 'nova', pose: 'quiz', text: level.guide?.intro }];
    for (let i = 0; i < beats.length; i++) {
      const last = i === beats.length - 1;
      // A beat marked "over": "comic" pops up over the comic; the next one is over the game
      if (beats[i].over !== 'comic' && comic.classList.contains('show')) {
        comic.classList.add('leaving');
        await sleep(450);
        hideComic();
        comic.classList.remove('leaving');
      }
      await showBeat({ pose: beats[i].who === 'nova' ? 'quiz' : 'default', ...beats[i] }, `<button class="big-btn go nd-go">${last ? "Let's go!" : 'Next'}</button>`, { scrim: beats[i].over === 'comic' ? 'comic' : 'dark' });
      if (!(await waitTap(id))) return false;
    }
    if (comic.classList.contains('show')) hideComic();
    if (onStage === 'nova') await shrinkIntoCircle();
    else await sinkAway();
    return id === runId;
  }

  async function showFinale(summary) {
    const id = runId;
    const stats = `
      <div class="done-stats">
        <div><b>${summary.seconds ?? '-'}s</b>time</div>
        <div><b>${summary.drops}</b>drops</div>
        <div><b>${summary.firstTryAccuracy}%</b>on target</div>
      </div>
      <div class="done-actions">
        <button class="big-btn" data-a="again">Play again</button>
        ${onNext ? `<button class="big-btn go" data-a="next">${nextLabel || 'Next'}</button>` : `<button class="big-btn go" data-a="map">Back to map</button>`}
      </div>`;
    if (game.level.comic?.after) {
      // The story carries on in the comic; the last frame gets the end card
      hideCircle();
      say.classList.remove('show');
      if (!(await playComic(game.level.comic.after, id))) return;
      const end = comic.querySelector('.comic-end');
      end.innerHTML = stats;
      comic.classList.add('ending');
      end.onclick = (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'again') start();
        if (a === 'next') exit(onNext);
        if (a === 'map') exit(onExit);
      };
      return;
    }
    const beats = game.level.story?.finale || [{ who: 'nova', pose: 'correct', text: game.level.guide?.success || 'You did it!' }];
    for (let i = 0; i < beats.length; i++) {
      const last = i === beats.length - 1;
      const b = { pose: beats[i].who === 'nova' ? 'correct' : 'celebrate', ...beats[i] };
      await showBeat(b, last ? stats : `<button class="big-btn go nd-go">Next</button>`, { scrim: 'light' });
      if (id !== runId) return;
      if (!last && !(await waitTap(id))) return;
    }
    stage.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'again') start();
      if (a === 'next') exit(onNext);
      if (a === 'map') exit(onExit);
    };
  }

  /* ---------- lifecycle ---------- */
  async function start() {
    runId += 1;
    stage.className = 'nova-stage';
    onStage = null;
    audio.stopVoice();
    hideCircle();
    say.classList.remove('show');
    $('.loading').classList.remove('hidden');
    gameEl.classList.add('is-loading');
    if (game) game.onExit();
    const level = await fetch(`game_data/drag_drop/${levelId}.json`).then((r) => r.json());
    world = level.world || 1;
    hideComic();
    // Story beats told as a comic are not a game: no progress meter
    if (Array.isArray(level.comic?.before) || Array.isArray(level.comic?.after)) level.meter = false;
    gameEl.classList.toggle('no-meter', level.meter === false);
    [...(level.comic?.before || []), ...(level.comic?.after || [])].forEach((f) => (new Image().src = f.img));
    ['quiz', 'correct', 'head', 'head_flat'].forEach((p) => (new Image().src = novaArt(world, p)));
    [...(level.story?.intro || []), ...(level.story?.finale || [])].forEach((b) => b.who !== 'nova' && b.pose && (new Image().src = charArt(b.who, b.pose)));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    game = new DragDropGame({ canvas, level, scene: SCENES[level.scene], hud });
    window.__game = game;
    await game.load();
    // A level that opens on a comic shows its first frame straight away,
    // so the game scene never flashes up before the story starts
    const first = level.comic?.before?.[0];
    if (first) {
      const img = comicImgs[comicFront];
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
        img.src = first.img;
        if (img.complete) r();
      });
      comic.classList.add('show', 'instant');
      img.classList.add('in', 'instant');
      void comic.offsetWidth;
      comic.classList.remove('instant');
    }
    $('.loading').classList.add('hidden');
    gameEl.classList.remove('is-loading');
    hud.setProgress(0, false);
    game.start();
    game.lock();
    const id = runId;
    await new Promise((r) => setTimeout(r, 450));
    if (id !== runId) return;
    if (!(await runIntro(level)) || id !== runId) return;
    game.unlock();
  }

  function exit(then) {
    if (isExiting) return;
    isExiting = true;
    runId += 1;
    clearTimeout(sayTimer);
    clearTimeout(faceTimer);
    game?.onExit();
    document.removeEventListener('keydown', onKey);
    then?.();
  }

  function onKey(e) {
    if (e.key === 't' || e.key === 'T') panel.toggle();
    if (e.key === 'Escape') panel.toggle(false);
  }
  document.addEventListener('keydown', onKey);

  circle.addEventListener('click', () => {
    audio.unlock();
    if (!game || game.locked) return;
    pulse(circle, 'press');
    game.requestHint();
  });
  $('.hud-back').addEventListener('click', () => exit(onExit));
  $('.hud-right').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.a === 'replay') start();
    if (b.dataset.a === 'tune') panel.toggle();
    if (b.dataset.a === 'mute') {
      audio.setMuted(!audio.muted);
      b.innerHTML = audio.muted ? Icons.mute : Icons.sound;
    }
  });

  await start();
  return { exit: () => exit() };
}
