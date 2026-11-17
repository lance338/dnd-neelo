import { DragDropGame } from './drag_drop_game.js';
import { SCENES } from './scenes/index.js';
import { audio } from '../../services/audio_service.js';
import { Icons } from '../../components/icons.js';
import { createTuningPanel } from './ui/tuning_panel.js';
import { tuning } from '../../services/tuning_service.js';
import { mountCheckin, prewarmCheckin } from '../checkin/checkin_view.js';

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

/* The app's comic control icons, inlined so they ship with the engine */
const CTL = {
  exit: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2216%22 fill=%22white%22/%3E%3Crect x=%228%22 y=%228%22 width=%2248%22 height=%2248%22 rx=%2211%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M26.5 25.1244L19.625 31.9994L26.5 38.8744M19.625 31.9994H36.125M32 38.8744C32 39.2809 32 39.4841 32.0151 39.6601C32.1721 41.4896 33.5196 42.9951 35.3206 43.3532C35.4938 43.3876 35.696 43.4101 36.0998 43.455L37.5042 43.611C39.6141 43.8455 40.6691 43.9627 41.5072 43.6945C42.6247 43.3369 43.5371 42.5203 44.0159 41.4491C44.375 40.6457 44.375 39.5843 44.375 37.4614V26.5375C44.375 24.4146 44.375 23.3532 44.0159 22.5498C43.5371 21.4786 42.6247 20.662 41.5072 20.3044C40.6691 20.0362 39.6141 20.1534 37.5042 20.3879L36.0998 20.5439C35.6958 20.5888 35.4939 20.6112 35.3206 20.6457C33.5196 21.0038 32.1721 22.5092 32.0151 24.3388C32 24.5148 32 24.718 32 25.1244%22 stroke-width=%222.75%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke=%22white%22/%3E%3C/svg%3E',
  sound: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2256%22 viewBox=%220 0 64 56%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Crect width=%2264%22 height=%2256%22 rx=%2212%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M29.6797 13.0098C30.5054 12.9299 31.3126 13.3415 31.8506 14.1172C32.348 14.8346 32.4176 15.6827 32.4424 16.0273C32.471 16.426 32.4708 16.9123 32.4707 17.3711V38.6289C32.4708 39.0877 32.471 39.574 32.4424 39.9727C32.4176 40.3173 32.348 41.1654 31.8506 41.8828C31.3126 42.6585 30.5054 43.0701 29.6797 42.9902C28.9164 42.9162 28.3806 42.3775 28.165 42.1553C27.9159 41.8983 27.6364 41.554 27.373 41.2295C27.3584 41.2115 27.3436 41.1937 27.3291 41.1758L22.8604 35.6709C22.8171 35.6176 22.7813 35.5735 22.75 35.5352H20.0879C19.7395 35.5352 19.3743 35.5355 19.0605 35.5039C18.7088 35.4685 18.2593 35.3818 17.7988 35.0928C17.179 34.7038 16.6752 34.0828 16.3594 33.3193C16.1248 32.7523 16.0541 32.1989 16.0254 31.7656C15.9998 31.3792 15.9999 30.9291 16 30.5V25.5C15.9999 25.0709 15.9998 24.6208 16.0254 24.2344C16.0541 23.8011 16.1248 23.2477 16.3594 22.6807C16.6752 21.9172 17.179 21.2962 17.7988 20.9072C18.2593 20.6182 18.7088 20.5315 19.0605 20.4961C19.3743 20.4645 19.7395 20.4648 20.0879 20.4648H22.75C22.7813 20.4265 22.8171 20.3824 22.8604 20.3291L27.3291 14.8242C27.3436 14.8063 27.3584 14.7885 27.373 14.7705C27.6364 14.446 27.9159 14.1017 28.165 13.8447C28.3806 13.6225 28.9164 13.0838 29.6797 13.0098ZM41.8389 13.9453C42.6827 13.1978 43.8587 13.4346 44.4658 14.4736C46.6895 18.2809 48 22.9556 48 28C48 33.0444 46.6895 37.7191 44.4658 41.5264C43.8587 42.5654 42.6827 42.8022 41.8389 42.0547C40.995 41.307 40.8031 39.8578 41.4102 38.8184C43.1884 35.7737 44.2354 32.0408 44.2354 28C44.2354 23.9592 43.1884 20.2263 41.4102 17.1816C40.8031 16.1422 40.995 14.693 41.8389 13.9453ZM36.2109 19.1426C37.0635 18.4105 38.2363 18.668 38.8311 19.7178C40.1608 22.0658 40.9414 24.9243 40.9414 28C40.9414 31.0757 40.1608 33.9342 38.8311 36.2822C38.2363 37.332 37.0635 37.5895 36.2109 36.8574C35.3583 36.1249 35.1484 34.6791 35.7432 33.6289C36.6465 32.0338 37.1768 30.0966 37.1768 28C37.1768 25.9034 36.6465 23.9662 35.7432 22.3711C35.1484 21.3209 35.3583 19.8751 36.2109 19.1426ZM25.5225 23.6074C25.5062 23.6274 25.4888 23.6494 25.4707 23.6719C25.2872 23.8998 25.0087 24.2452 24.666 24.5039C24.3713 24.7263 24.05 24.8908 23.7139 24.9902C23.323 25.1058 22.9276 25.1038 22.667 25.1025C22.6412 25.1024 22.6167 25.1016 22.5938 25.1016H20.1416C19.9959 25.1016 19.8732 25.1015 19.7656 25.1025C19.7648 25.235 19.7646 25.3859 19.7646 25.5654V30.4346C19.7646 30.614 19.7648 30.765 19.7656 30.8975C19.8732 30.8985 19.9959 30.8984 20.1416 30.8984H22.5938C22.6167 30.8984 22.6412 30.8976 22.667 30.8975C22.9276 30.8962 23.323 30.8942 23.7139 31.0098C24.05 31.1092 24.3713 31.2736 24.666 31.4961C25.0087 31.7548 25.2872 32.1002 25.4707 32.3281C25.4888 32.3506 25.5062 32.3726 25.5225 32.3926L28.7061 36.3135V19.6865L25.5225 23.6074Z%22 fill=%22white%22/%3E%3C/svg%3E',
  sound_off: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2256%22 viewBox=%220 0 64 56%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Crect width=%2264%22 height=%2256%22 rx=%2212%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M18 22.5h5.2l7.6-7.2c.9-.8 2.2-.2 2.2 1v23.4c0 1.2-1.3 1.8-2.2 1L23.2 33.5H18c-1.1 0-2-.9-2-2v-7c0-1.1.9-2 2-2z%22 fill=%22white%22 stroke=%22white%22 stroke-width=%222%22 stroke-linejoin=%22round%22/%3E%3Cpath d=%22M38.5 22.5l9 11M47.5 22.5l-9 11%22 stroke=%22white%22 stroke-width=%223.6%22 stroke-linecap=%22round%22/%3E%3C/svg%3E',
  pause: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2256%22 viewBox=%220 0 64 56%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Crect width=%2264%22 height=%2256%22 rx=%2212%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M24.5 12C26.1569 12 27.5 13.3431 27.5 15V41C27.5 42.6569 26.1569 44 24.5 44H21.5C19.8431 44 18.5 42.6569 18.5 41V15C18.5 13.3431 19.8431 12 21.5 12H24.5ZM42.5 12C44.1569 12 45.5 13.3431 45.5 15V41C45.5 42.6569 44.1569 44 42.5 44H39.5C37.8431 44 36.5 42.6569 36.5 41V15C36.5 13.3431 37.8431 12 39.5 12H42.5Z%22 fill=%22white%22/%3E%3C/svg%3E',
  play: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2256%22 viewBox=%220 0 64 56%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Crect width=%2264%22 height=%2256%22 rx=%2212%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M24 15.6c0-2.9 3.2-4.6 5.6-3l15.3 10.4c2.1 1.4 2.1 4.6 0 6L29.6 39.4c-2.4 1.6-5.6-.1-5.6-3V15.6z%22 fill=%22white%22/%3E%3C/svg%3E',
  prev: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2256%22 viewBox=%220 0 64 56%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%3E%3Crect width=%2264%22 height=%2256%22 rx=%2212%22 transform=%22matrix%28-1 0 0 1 64 0%29%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M29.5907 24.1488C29.3127 24.4101 28.9912 24.6196 28.677 24.836C26.441 26.3767 26.441 29.6233 28.677 31.164C28.9912 31.3804 29.3127 31.5899 29.5907 31.8512L41.6076 43.1487C41.8855 43.41 42.1954 43.6424 42.5556 43.7679C45.1447 44.6696 48 42.8398 48 40.0854L48 15.9146C48 13.1602 45.1447 11.3304 42.5556 12.2321C42.1954 12.3576 41.8855 12.59 41.6076 12.8513L29.5907 24.1488Z%22 fill=%22white%22/%3E%3Crect x=%2216%22 y=%2212%22 width=%229%22 height=%2232%22 rx=%223%22 fill=%22white%22/%3E%3C/g%3E%3C/svg%3E',
  next: 'data:image/svg+xml,%3Csvg width=%2264%22 height=%2256%22 viewBox=%220 0 64 56%22 fill=%22none%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Crect width=%2264%22 height=%2256%22 rx=%2212%22 fill=%22%23FC611F%22/%3E%3Cpath d=%22M34.4093 24.1488C34.6873 24.4101 35.0088 24.6196 35.323 24.836C37.559 26.3767 37.559 29.6233 35.323 31.164C35.0088 31.3804 34.6873 31.5899 34.4093 31.8512L22.3924 43.1487C22.1145 43.41 21.8046 43.6424 21.4444 43.7679C18.8553 44.6696 16 42.8398 16 40.0854L16 15.9146C16 13.1602 18.8553 11.3304 21.4444 12.2321C21.8046 12.3576 22.1145 12.59 22.3924 12.8513L34.4093 24.1488Z%22 fill=%22white%22/%3E%3Crect x=%2239%22 y=%2212%22 width=%229%22 height=%2232%22 rx=%223%22 fill=%22white%22/%3E%3C/svg%3E',
};

/**
 * `flow`: the level is one step of a longer sequence (the level demo). Finishing it,
 * or tapping Continue after its check-in, goes straight on to `onNext`.
 */
export async function mountGameView(root, levelId, { onExit, onNext, nextLabel, flow = false }) {
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
      <div class="comic" aria-live="polite"><img class="comic-frame" alt=""><img class="comic-frame" alt=""><div class="comic-end"></div>
        <button class="comic-exit" aria-label="Exit"><img src="${CTL.exit}" alt=""></button>
        <div class="comic-ctl" role="toolbar" aria-label="Comic controls">
          <button data-c="sound" aria-label="Sound"><img src="${CTL.sound}" alt=""></button>
          <button data-c="pause" aria-label="Pause"><img src="${CTL.pause}" alt=""></button>
          <button data-c="prev" aria-label="Previous"><img src="${CTL.prev}" alt=""></button>
          <button data-c="next" aria-label="Next"><img src="${CTL.next}" alt=""></button>
        </div></div>
      <div class="nova-say" aria-live="polite"><span class="ns-icon"></span><span class="ns-text"></span></div>
      <button class="nova-circle" aria-label="Ask Nova for a hint">
        <span class="nc-face"><img alt="" class="nc-img"></span>
        <span class="nc-badge">?</span>
      </button>
      <div class="ov" aria-live="polite">
        <div class="ov-layer">
          <div class="ov-char"><div class="ov-pose"><img class="ov-img" alt=""></div></div>
          <div class="ov-box"><span class="ov-text"></span><img class="ov-boximg" alt=""></div>
        </div>
      </div>
      <div class="comic-ctl beat-ctl" role="toolbar" aria-label="Story controls">
        <button data-c="prev" aria-label="Back one frame"><img src="${CTL.prev}" alt=""></button>
      </div>
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
  let checkin = null;
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
    /** A lesson is playing in the scene: the meter and buttons step aside (Back stays). */
    lessonMode(on) {
      gameEl.classList.toggle('in-lesson', !!on);
      if (on) {
        clearTimeout(sayTimer);
        say.classList.remove('show');
        circle.classList.remove('talking');
      }
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
    /** The last drop landed: a guide held on screen during the drag (beat "hold") leaves now. */
    beforeComplete() {
      if (!heldOverlay) return;
      heldOverlay = false;
      ov.classList.remove('passive');
      hideOverlay().then(() => circleIn());
    },
  };
  // True while an overlay beat stays up during the drag (beat "hold": true)
  let heldOverlay = false;

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
  const NAMES = { nova: 'Nova', skyrian: 'Skyrian', tremu: 'Tremu' };
  let cast = {}; // the level's cast: characters that bring their own pose art (SVG)
  const charArt = (who, pose) => (who === 'nova' ? novaArt(world, pose) : cast[who]?.poses?.[pose]?.img || `assets/img/${who}_${pose}.png`);
  let onStage = null; // who is standing on the stage right now

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Rise a character (or swap the line if they are already up). */
  async function showBeat({ who = 'nova', pose = 'quiz', text = '', side = '', mirror = false }, extraHtml = '', { scrim = 'dark' } = {}) {
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
    // "side": "left" stands the character on the left (like Skyrian); "mirror" flips their art to face the other way
    stage.className = `nova-stage show who-${who} pose-${pose} scrim-${scrim}${side ? ' side-' + side : ''}${sameChar ? ' risen' : ''}`;
    body.style.scale = mirror ? '-1 1' : '';
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

  /* Back control over story beats (caption or overlay): steps back one frame, to the
     previous beat or to the comic it came from, which then plays into the beat again. */
  const beatCtl = $('.beat-ctl');
  let beatBack = null;
  beatCtl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!e.target.closest('[data-c="prev"]')) return;
    audio.unlock();
    beatBack?.();
  });
  function armBack(can, fn) {
    beatBack = can ? fn : null;
    beatCtl.classList.toggle('show', !!can);
  }

  /** Wait for the player to continue (button, character, dialog or scrim). Resolves true, 'prev' or false. */
  function waitTap(id, canBack = false) {
    return new Promise((resolve) => {
      const auto = tuning.get('introAutoContinue') > 0 ? setTimeout(() => done(true), tuning.get('introAutoContinue') * 1000) : null;
      function done(r) {
        clearTimeout(auto);
        stage.onclick = null;
        armBack(false);
        audio.unlock();
        audio.stopVoice();
        resolve(id === runId ? r : false);
      }
      stage.onclick = (e) => {
        if (e.target.closest('.nd-go, .nova-dialog, .nova-body, .nova-scrim')) done(true);
      };
      armBack(canBack, () => done('prev'));
    });
  }

  function hideCircle() {
    circle.classList.remove('in');
  }

  function circleIn() {
    // A level with its own guide (W5: Tremu) can leave Nova's hint circle out
    if (game?.level?.guideCircle === false) return;
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

  /* ---------- Overlay beats: a character over the live scene with the bottom text box (W5 style) ---------- */
  // Positions come from the level's `cast` block, in stage units (the Figma frame), so they
  // line up with the canvas: the layer is scaled and offset exactly like the game view.
  const ov = $('.ov');
  const ovLayer = $('.ov-layer');
  const ovChar = $('.ov-char');
  const ovPose = $('.ov-pose');
  const ovImg = $('.ov-img');
  const ovText = $('.ov-text');
  const ovBox = $('.ov-box');
  const ovBoxImg = $('.ov-boximg');
  /** A beat can bring its text box as Figma art (`box`); the line stays as the label for screen readers. */
  function setOverlayText(beat) {
    ovBox.classList.toggle('art', !!beat.box);
    if (beat.box) ovBoxImg.src = beat.box;
    ovText.textContent = beat.text;
    ovBox.setAttribute('aria-label', beat.text);
  }
  let ovEyes = [];
  let ovBlinkAt = 0;
  let ovTimer = null;

  function syncOverlayLayer() {
    if (!game?.view) return;
    const v = game.view;
    ovLayer.style.transform = `translate(${v.ox}px, ${v.oy}px) scale(${v.s})`;
  }
  window.addEventListener('resize', syncOverlayLayer);

  function blinkEyes(eyes) {
    eyes.forEach((e) => {
      e.firstChild.animate([{ transform: 'translateY(-102%)' }, { transform: 'translateY(0)', offset: 0.4 }, { transform: 'translateY(0)', offset: 0.6 }, { transform: 'translateY(-102%)' }], { duration: 190, easing: 'ease-in-out' });
      e.lastChild.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 190 });
    });
  }

  /** Show (or update) an overlay beat. Eyes are [x, y, diameter] in the pose art's pixels. */
  async function showOverlay(beat, level) {
    const cast = level.cast?.[beat.who] || {};
    const p = cast.poses?.[beat.pose] || Object.values(cast.poses || {})[0];
    hideCircle();
    say.classList.remove('show');
    const already = ov.classList.contains('risen') && ov.dataset.who === beat.who;
    ov.dataset.who = beat.who;
    Object.assign(ovChar.style, { left: p.x + 'px', top: p.y + 'px', width: p.w + 'px' });
    ovImg.src = p.img;
    ovImg.style.width = p.w + 'px';
    ovPose.querySelectorAll('.ov-eye').forEach((e) => e.remove());
    ovEyes = (p.eyes || []).map(([x, y, d]) => {
      const e = document.createElement('div');
      e.className = 'ov-eye';
      Object.assign(e.style, { left: x - 1 + 'px', top: y - 1 + 'px', width: d + 2 + 'px', height: d + 2 + 'px' });
      e.innerHTML = `<i style="background:${cast.lid || '#000'}"></i><b style="border-color:${cast.lash || '#000'}"></b>`;
      ovPose.appendChild(e);
      return e;
    });
    if (already) {
      [ovText, ovBoxImg].forEach((el) => el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)', offset: 0.4 }, { opacity: 1, transform: 'none' }], { duration: 420 }));
      setTimeout(() => setOverlayText(beat), 170);
      ovChar.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03, .97)', offset: 0.3 }, { transform: 'scale(.99, 1.02)', offset: 0.65 }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    } else {
      setOverlayText(beat);
      ov.className = 'ov show';
      syncOverlayLayer();
      void ov.offsetWidth;
      ov.classList.add('risen');
      ovBlinkAt = performance.now() + 1400;
      clearInterval(ovTimer);
      ovTimer = setInterval(() => {
        if (performance.now() < ovBlinkAt) return;
        blinkEyes(ovEyes);
        if (Math.random() < 0.2) setTimeout(() => blinkEyes(ovEyes), 260);
        ovBlinkAt = performance.now() + 2200 + Math.random() * 2600;
      }, 100);
    }
    await sleep(already ? 200 : 600);
    audio.speak(beat.text, beat.who);
  }

  function waitOverlayTap(id, canBack = false) {
    return new Promise((resolve) => {
      const auto = tuning.get('introAutoContinue') > 0 ? setTimeout(() => done(true), tuning.get('introAutoContinue') * 1000) : null;
      let settled = false;
      function done(r) {
        if (settled) return;
        settled = true;
        clearTimeout(auto);
        ov.onclick = null;
        armBack(false);
        audio.unlock();
        audio.stopVoice();
        resolve(id === runId ? r : false);
      }
      setTimeout(() => !settled && (ov.onclick = () => done(true)), 350);
      armBack(canBack, () => done('prev'));
    });
  }

  async function hideOverlay() {
    ov.classList.add('leaving');
    await sleep(560);
    clearInterval(ovTimer);
    ov.className = 'ov';
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

  /* Comic controls (as in the app): sound, pause, previous and next frame, and exit */
  const comicCtl = { paused: false, canPrev: false, onCmd: null, onPause: null };
  function syncComicCtl() {
    const q = (c) => comic.querySelector(`[data-c="${c}"]`);
    q('prev').classList.toggle('is-off', !comicCtl.canPrev);
    q('pause').querySelector('img').src = comicCtl.paused ? CTL.play : CTL.pause;
    q('pause').setAttribute('aria-label', comicCtl.paused ? 'Play' : 'Pause');
    q('sound').querySelector('img').src = audio.muted ? CTL.sound_off : CTL.sound;
  }
  comic.querySelector('.comic-ctl').addEventListener('click', (e) => {
    e.stopPropagation();
    const c = e.target.closest('[data-c]')?.dataset.c;
    audio.unlock();
    if (c === 'sound') audio.setMuted(!audio.muted);
    if (c === 'pause') {
      comicCtl.paused = !comicCtl.paused;
      comicCtl.onPause?.(comicCtl.paused);
    }
    if ((c === 'prev' && comicCtl.canPrev) || c === 'next') comicCtl.onCmd?.(c);
    syncComicCtl();
  });
  comic.querySelector('.comic-exit').addEventListener('click', (e) => {
    e.stopPropagation();
    exit(onExit);
  });

  /** Play a frame's line, then wait for it (or a tap, or the controls). Resolves true, 'prev' or false. */
  async function comicLine(frame, id) {
    const src = frame.text ? await audio.speak(frame.text, frame.who) : null;
    const secs = src && src.buffer ? src.buffer.duration + 0.7 : Math.max(2.6, (frame.text || '').length / 14 + 0.8);
    const cmd = await new Promise((r) => {
      let t = null;
      // Moves on by itself after the line, unless paused
      const arm = (s) => {
        clearTimeout(t);
        if (!comicCtl.paused) t = setTimeout(() => done('next'), s * 1000);
      };
      function done(c) {
        clearTimeout(t);
        comic.onclick = null;
        comicCtl.onCmd = comicCtl.onPause = null;
        r(c);
      }
      arm(secs);
      comicCtl.onPause = (p) => (p ? clearTimeout(t) : arm(1.2));
      comicCtl.onCmd = (c) => {
        audio.stopVoice();
        done(c);
      };
      // Tap anywhere on the comic to move on sooner
      comic.onclick = (e) => {
        if (e.target.closest('.comic-ctl, .comic-exit, .comic-end')) return;
        audio.unlock();
        audio.stopVoice();
        done('next');
      };
    });
    if (id !== runId) return false;
    return cmd === 'prev' ? 'prev' : true;
  }

  async function playComic(frames, id, from = 0) {
    const list = frames || [];
    let i = from;
    while (i < list.length) {
      comicCtl.canPrev = i > 0;
      syncComicCtl();
      const r = await comicFrame(list[i], id);
      if (r === false) return false;
      i = r === 'prev' ? Math.max(0, i - 1) : i + 1;
    }
    return true;
  }

  function hideComic() {
    comic.classList.remove('show');
    comic.onclick = null;
    comicImgs.forEach((i) => i.classList.remove('in', 'out', 'instant'));
    comic.querySelector('.comic-end').innerHTML = '';
    comic.classList.remove('ending');
  }

  /** Take down whatever story beat is up (overlay or character), without Nova's circle. */
  async function clearBeat() {
    if (ov.classList.contains('show')) await hideOverlay();
    if (stage.classList.contains('show')) {
      stage.classList.add('leaving');
      stage.classList.remove('risen');
      await sleep(520);
      stage.className = 'nova-stage';
      onStage = null;
    }
  }

  /**
   * The intro: comic, NPC lines, then the story beats. The back control on a beat steps to the
   * beat before it, or from the first beat back to the last comic frame (the level's own comic,
   * or `backTo`, the comic that played just before this intro), which then plays into the beats again.
   */
  async function runIntro(level, { keepComic = false, backTo = null } = {}) {
    const id = runId;
    const own = level.comic?.before || [];
    const back = own.length ? own : backTo || [];
    if (own.length && !(await playComic(own, id))) return false;
    // Comic lines before play: NPCs speak in the scene
    for (const beat of level.story?.before || []) {
      await game.talk(beat.who, beat.text, { mood: beat.mood });
      if (id !== runId) return false;
      await sleep(250);
    }
    const beats = level.story?.intro || [{ who: 'nova', pose: 'quiz', text: level.guide?.intro }];
    let overlay = false;
    let i = 0;
    while (i < beats.length) {
      const last = i === beats.length - 1;
      // A beat marked "over": "comic" pops up over the comic; the next one is over the game
      if (beats[i].over !== 'comic' && comic.classList.contains('show')) {
        comic.classList.add('leaving');
        await sleep(450);
        hideComic();
        comic.classList.remove('leaving');
      }
      const canBack = i > 0 || back.length > 0;
      // Let the scene react to each beat (e.g. pan the camera and bring in the item on beat 2)
      game.scene.onIntroBeat?.(game, i, beats[i]);
      let r;
      if (beats[i].style === 'overlay' && beats[i].hold && last) {
        // The guide stays on screen with this line while the player drags; the drop sends them off
        await showOverlay(beats[i], level);
        if (id !== runId) return false;
        ov.classList.add('passive');
        heldOverlay = true;
        return true;
      }
      if (beats[i].style === 'overlay') {
        overlay = true;
        await showOverlay(beats[i], level);
        r = await waitOverlayTap(id, canBack);
      } else {
        await showBeat({ pose: beats[i].who === 'nova' ? 'quiz' : 'default', ...beats[i] }, `<button class="big-btn go nd-go">${beats[i].cta || (last ? "Let's go!" : 'Next')}</button>`, { scrim: beats[i].over === 'comic' ? 'comic' : 'dark' });
        r = await waitTap(id, canBack);
      }
      if (r === false || id !== runId) return false;
      if (r !== 'prev') {
        i++;
        continue;
      }
      if (i > 0) {
        i--;
        continue;
      }
      // Back to the comic: the beat goes down, the last frame comes back, then the beats play in again
      await clearBeat();
      if (id !== runId || !(await playComic(back, id, back.length - 1))) return false;
    }
    if (comic.classList.contains('show') && !keepComic) hideComic();
    if (overlay) {
      await hideOverlay();
      if (level.kind !== 'interstitial') circleIn();
      await sleep(250);
    } else if (onStage === 'nova') await shrinkIntoCircle();
    else await sinkAway();
    return id === runId;
  }

  /**
   * A lesson played in rounds (level.discover): each round, a character sets up the find,
   * the player makes one drop, the scene shows what was found, then that round's comic
   * explains it. After the last round the finale beat plays over the comic, then the check-in.
   */
  async function runDiscover(level, id) {
    const rounds = level.discover;
    for (let r = 0; r < rounds.length; r++) {
      game.scene.beginRound?.(game, r);
      const intro = { comic: r === 0 ? level.comic : null, story: { intro: rounds[r].intro } };
      if (!(await runIntro(intro, { backTo: r > 0 ? rounds[r - 1].after : null })) || id !== runId) return;
      const found = new Promise((res) => (game.sceneState.onRound = res));
      game.unlock();
      await found;
      if (id !== runId) return;
      game.lock();
      if (!(await playComic(rounds[r].after, id))) return;
    }
    const finale = level.story?.finale || [];
    if (finale.length && !(await runIntro({ story: { intro: finale.map((b) => ({ over: 'comic', ...b })) } }, { keepComic: true, backTo: rounds[rounds.length - 1].after }))) return;
    if (id !== runId) return;
    showFinale(game.controller.summary());
  }

  async function showFinale(summary) {
    const id = runId;
    if (game.level.checkin) {
      // The lesson's check-in follows the game (the CMS finds the quiz in the spec)
      hideCircle();
      say.classList.remove('show');
      checkin = mountCheckin(gameEl, game.level.checkin, { onDone: (_, result) => (flow && onNext ? exit(() => onNext(result)) : start()), onExit: () => exit(onExit) });
      return;
    }
    if (flow && onNext) {
      // One step of a sequence: any outro comic plays, then the next step starts
      hideCircle();
      say.classList.remove('show');
      if (game.level.comic?.after && !(await playComic(game.level.comic.after, id))) return;
      exit(onNext);
      return;
    }
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
    armBack(false);
    checkin?.destroy();
    checkin = null;
    clearInterval(ovTimer);
    ov.className = 'ov';
    heldOverlay = false;
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
    cast = level.cast || {};
    hideComic();
    // Story beats told as a comic are not a game: no progress meter
    if (Array.isArray(level.comic?.before) || Array.isArray(level.comic?.after)) level.meter = false;
    gameEl.classList.toggle('no-meter', level.meter === false);
    [...(level.comic?.before || []), ...(level.comic?.after || []), ...(level.discover || []).flatMap((r) => r.after || [])].forEach((f) => (new Image().src = f.img));
    [...(level.discover || []).flatMap((r) => r.intro || []), ...(level.story?.finale || [])].forEach((b) => b.who && b.pose && (new Image().src = charArt(b.who, b.pose)));
    ['quiz', 'correct', 'head', 'head_flat'].forEach((p) => (new Image().src = novaArt(world, p)));
    [...(level.story?.intro || []), ...(level.story?.finale || [])].forEach((b) => b.who !== 'nova' && b.pose && b.style !== 'overlay' && (new Image().src = charArt(b.who, b.pose)));
    // Overlay beats bring their own art (cast poses and text boxes)
    Object.values(level.cast || {}).forEach((c) => Object.values(c.poses || {}).forEach((p) => (new Image().src = p.img)));
    (level.story?.intro || []).forEach((b) => b.box && (new Image().src = b.box));
    // Warm the check-in art now so it is decoded and ready the moment the check-in opens
    if (level.checkin) prewarmCheckin(level.checkin);
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
    syncOverlayLayer();
    game.lock();
    const id = runId;
    await new Promise((r) => setTimeout(r, 450));
    if (id !== runId) return;
    if (level.kind === 'comic') {
      // A comic on its own (a lesson, or the level's opening or closing story): no game
      if (!(await playComic(level.comic.before, id)) || id !== runId) return;
      if (flow && onNext) return exit(onNext);
      comic.querySelector('.comic-end').innerHTML = `<div class="done-actions"><button class="big-btn" data-a="again">Replay</button><button class="big-btn go" data-a="map">Back</button></div>`;
      comic.classList.add('ending');
      comic.querySelector('.comic-end').onclick = (e) => {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'again') start();
        if (a === 'map') exit(onExit);
      };
      return;
    }
    if (level.discover) return runDiscover(level, id);
    if (!(await runIntro(level)) || id !== runId) return;
    // An interstitial has nothing to drag: its intro leads straight to the check-in
    if (level.kind === 'interstitial') return showFinale(game.controller.summary());
    game.unlock();
  }

  function exit(then) {
    if (isExiting) return;
    isExiting = true;
    runId += 1;
    armBack(false);
    clearTimeout(sayTimer);
    clearTimeout(faceTimer);
    game?.onExit();
    checkin?.destroy();
    clearInterval(ovTimer);
    window.removeEventListener('resize', syncOverlayLayer);
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
