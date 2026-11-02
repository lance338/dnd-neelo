import { SOUND_MANIFEST } from '../config/sound_manifest.js';
import { logSound } from './sound_log.js';
import { soundLab, voiceIdFor } from './sound_lab_service.js';

/** Bus levels. Fixed mix; which take plays is chosen only in the Sound Lab. */
const MIX = Object.freeze({ sfx: 0.85, jingle: 0.8, voice: 1 });

/**
 * Web Audio implementation of the game's AudioService.
 * In Flutter this maps onto the existing AudioService (audioServiceProvider):
 * one SFX bus and one jingle bus.
 */
/** Lab name of an option ("A", "Take 3") for the sound log. */
const labName = (soundId, optionId) => soundLab.options(soundId).find((o) => o.id === optionId)?.name || optionId;

class AudioService {
  constructor() {
    this.ctx = null;
    this.buffers = new Map(); // url -> AudioBuffer | null (missing)
    this.unlocked = false;
    this.muted = false;
    this.lastPlay = new Map();
  }

  /** Must be called from a user gesture (first tap) on iOS / Safari. */
  unlock() {
    if (this.unlocked) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.sfxBus = this._bus();
    this.jingleBus = this._bus();
    this.voiceBus = this._bus();
    this._applyVolumes();
    this.unlocked = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.preloadAll();
  }

  _bus() {
    const g = this.ctx.createGain();
    g.connect(this.master);
    return g;
  }

  _applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(MIX.sfx, t, 0.05);
    this.jingleBus.gain.setTargetAtTime(MIX.jingle, t, 0.05);
    this.voiceBus.gain.setTargetAtTime(MIX.voice, t, 0.05);
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, t, 0.05);
  }

  setMuted(m) {
    this.muted = m;
    this._applyVolumes();
  }

  async _load(url) {
    if (!url) return null;
    if (this.buffers.has(url)) return this.buffers.get(url);
    const p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((ab) => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)))
      .catch(() => null);
    this.buffers.set(url, p);
    const buf = await p;
    this.buffers.set(url, buf);
    return buf;
  }

  preloadAll() {
    Object.values(SOUND_MANIFEST).forEach((s) => {
      s.options.forEach((u) => this._load(u));
      if (s.fallback) this._load(s.fallback);
    });
  }

  /** Which file is currently used for an event, honoring A/B choice and fallback. */
  resolve(event) {
    const s = SOUND_MANIFEST[event];
    if (!s) return { url: null, isFallback: false };
    const picked = soundLab.chosen('sfx-' + event);
    const choice = picked === 'b' && s.options.length > 1 ? 1 : 0;
    const url = s.options[choice];
    const buf = this.buffers.get(url);
    if (buf && !(buf instanceof Promise)) return { url, isFallback: false };
    if (buf === undefined || buf instanceof Promise) return { url, isFallback: false, pending: true };
    return { url: s.fallback, isFallback: true };
  }

  async play(event, { gain = 1, rate = 1 } = {}) {
    if (!this.unlocked || !this.ctx) return;
    const s = SOUND_MANIFEST[event];
    if (!s) return;
    // Debounce identical events fired within 40ms (multi-touch, double callbacks)
    const now = performance.now();
    if (now - (this.lastPlay.get(event) || 0) < 40) return;
    this.lastPlay.set(event, now);

    let choice = 0;
    let buf = null;
    let trim = null;
    // A choice made in the Sound Lab wins: a built-in file or a generated take
    // The Sound Lab is the only place a take is chosen: a built-in file or a generated take
    const picked = soundLab.chosen('sfx-' + event);
    if (picked === 'a' || picked === 'b') choice = picked === 'a' ? 0 : 1;
    else if (picked) {
      const take = soundLab.takeFor('sfx-' + event, picked);
      if (take) {
        buf = await this.loadTake(take);
        if (buf) trim = await this.matchLevel(event, buf);
      }
    }
    let file = buf ? soundLab.localFile(soundLab.takeFor('sfx-' + event, picked)) || 'Sound Lab take ' + picked : null;
    let which = buf ? labName('sfx-' + event, picked) : null;
    if (!buf) {
      buf = await this._load(s.options[choice]);
      file = s.options[choice];
      which = (s.optionLabels || ['A', 'B'])[choice] || 'ABCDEFGH'[choice];
    }
    if (!buf && s.fallback) {
      buf = await this._load(s.fallback);
      file = s.fallback;
      which = 'Fallback (library sound)';
    }
    if (!buf) return;
    logSound({ kind: 'sfx', action: s.label || event, sound: which, file });

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const v = s.vary || 0;
    src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * v);
    const g = this.ctx.createGain();
    let level = (s.gain ?? 1) * (trim ?? s.trims?.[choice] ?? 1) * gain;
    g.gain.value = level;
    src.connect(g);
    g.connect(s.bus === 'jingle' ? this.jingleBus : this.sfxBus);
    src.start();
    return src;
  }

  /**
   * A character speaks a line. Lines are looked up by their exact on-screen text
   * in audio/nova/lines.json (optionally prefixed "who|"); a new line cuts off
   * the one before it.
   */
  async speak(text, who) {
    if (!text) return;
    if (!this.voiceLines) {
      this.voiceLines = fetch('audio/nova/lines.json')
        .then((r) => r.json())
        .then((j) => j.lines)
        .catch(() => ({}));
    }
    const lines = await this.voiceLines;
    // A speaker's own take ("skyrian|text") wins over the shared one, so Nova and
    // Skyrian can say the same words in their own voices
    const entry = (who && lines[`${who}|${text}`]) || lines[text];
    if (!entry || !this.unlocked || !this.ctx) return;
    let buf = null;
    const id = voiceIdFor(entry.a);
    const picked = soundLab.chosen(id);
    if (picked && picked !== 'a' && picked !== 'b') {
      const take = soundLab.takeFor(id, picked);
      if (take) buf = await this.loadTake(take);
    }
    const useB = picked === 'b';
    let file = buf ? soundLab.localFile(soundLab.takeFor(id, picked)) || 'Sound Lab take ' + picked : null;
    let which = buf ? labName(id, picked) : null;
    if (!buf) {
      file = useB ? entry.b : entry.a;
      which = useB ? 'B' : 'A';
      buf = await this._load(file);
    }
    if (!buf) return;
    const name = who ? who[0].toUpperCase() + who.slice(1) : 'Nova';
    logSound({ kind: 'voice', action: `${name} says “${text.length > 60 ? text.slice(0, 57) + '…' : text}”`, sound: `Voice ${which}`, file });
    this.stopVoice();
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.voiceBus);
    src.start();
    this.voiceSrc = src;
    return src;
  }

  stopVoice() {
    try {
      this.voiceSrc?.stop();
    } catch (e) {
      /* already stopped */
    }
    this.voiceSrc = null;
  }

  /**
   * Decode a generated Sound Lab take (an ElevenLabs link that is refreshed when it
   * expires). Cached by generation id; null when the link can't be fetched here.
   */
  async loadTake(take) {
    const local = soundLab.localFile(take);
    return local ? this._load(local) : null;
  }

  /**
   * Play a take that is not on the page yet straight from ElevenLabs with the
   * browser's own player. Must start inside the tap that asked for it.
   * Resolves { ok, reason, url }.
   */
  async playRemote(take, volume = 1) {
    this.stopPreview();
    let url = soundLab.cachedUrl(take);
    try {
      if (!url) url = await soundLab.urlFor(take);
      if (!url) return { ok: false, reason: 'Could not reach ElevenLabs for this take.' };
      const el = new Audio(url);
      el.volume = Math.min(1, Math.max(0, volume));
      this.previewEl = el;
      await el.play();
      return { ok: true, url };
    } catch (e) {
      soundLab.note({ take: take.id, error: e?.name || String(e), message: String(e?.message || '').slice(0, 160), csp: soundLab.lastViolation });
      return { ok: false, blocked: true, url, reason: 'This take is not on the page yet.' };
    }
  }

  /** Loudness (RMS) of a decoded buffer. */
  _rms(buf) {
    if (!buf) return 0;
    if (buf._rms) return buf._rms;
    let sum = 0;
    let n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i += 4) {
        sum += d[i] * d[i];
        n++;
      }
    }
    buf._rms = Math.sqrt(sum / Math.max(1, n));
    return buf._rms;
  }

  /**
   * Trim for a new take so it plays as loud as the built-in takes of the same
   * event already do in game (their RMS times their trim).
   */
  async matchLevel(event, buf) {
    const s = SOUND_MANIFEST[event];
    const refs = await Promise.all(s.options.map((u) => this._load(u)));
    const targets = refs.map((b, i) => (b ? this._rms(b) * (s.trims?.[i] ?? 1) : 0)).filter((x) => x > 0);
    const r = this._rms(buf);
    if (!targets.length || !r) return 1;
    const target = targets.reduce((a, b) => a + b, 0) / targets.length;
    return Math.min(6, Math.max(0.15, target / r));
  }

  /**
   * Sound Lab preview: play one option of one sound (catalog entry + option from
   * soundLab.options). Resolves { ok, reason }.
   */
  async preview(sound, option) {
    // A take that is not on the page yet: start the browser player inside this tap
    if (!option.builtin && !soundLab.localFile(option.take)) return this.playRemote(option.take, MIX[sound.kind === 'sfx' ? 'sfx' : 'voice']);
    this.unlock();
    if (!this.ctx) return { ok: false, reason: 'Audio is not available in this browser.' };
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    let buf = null;
    let level = 1;
    if (option.builtin) {
      buf = await this._load(option.src);
      if (sound.kind === 'sfx') {
        const s = SOUND_MANIFEST[sound.event];
        const i = sound.builtins.findIndex((b) => b.key === option.id);
        level = (s?.gain ?? 1) * (s?.trims?.[i] ?? 1);
      }
    } else {
      buf = await this.loadTake(option.take);
      if (buf && sound.kind === 'sfx') level = (SOUND_MANIFEST[sound.event]?.gain ?? 1) * (await this.matchLevel(sound.event, buf));
    }
    if (!buf) return { ok: false, reason: 'File missing.' };
    this.stopPreview();
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = level;
    src.connect(g);
    g.connect(sound.kind === 'voice' ? this.voiceBus : SOUND_MANIFEST[sound.event]?.bus === 'jingle' ? this.jingleBus : this.sfxBus);
    src.start();
    this.previewSrc = src;
    return { ok: true, duration: buf.duration };
  }

  stopPreview() {
    try {
      this.previewSrc?.stop();
    } catch (e) {
      /* already stopped */
    }
    this.previewSrc = null;
    if (this.previewEl) this.previewEl.pause();
    this.previewEl = null;
  }

  /** Stop everything on exit (mirrors GameController.onGameExit()). */
  onGameExit() {
    this.stopVoice();
  }
}

export const audio = new AudioService();
