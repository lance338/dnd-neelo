import { TUNING_DEFAULTS } from '../config/tuning_defaults.js';

const STORAGE_KEY = 'neelo-dnd-tuning-v1';

/** Defaults overlaid with saved values; keys that are no longer tuning (old audio settings) are dropped. */
const pick = (saved = {}) => Object.fromEntries(Object.keys(TUNING_DEFAULTS).map((k) => [k, k in saved ? saved[k] : TUNING_DEFAULTS[k]]));

/**
 * Holds live tuning values. In Flutter this becomes a Riverpod Notifier
 * (tuning_provider.dart) seeded from the exported JSON.
 */
class TuningService {
  constructor() {
    this.values = { ...TUNING_DEFAULTS };
    this.listeners = new Set();
    this._load();
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    this.values[key] = value;
    this._save();
    this.listeners.forEach((fn) => fn(key, value));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  reset() {
    this.values = { ...TUNING_DEFAULTS };
    this._save();
    this.listeners.forEach((fn) => fn('*'));
  }

  toJSON() {
    return {
      spec: 'neelo-drag-drop-tuning',
      version: 1,
      exportedAt: new Date().toISOString(),
      stage: { width: 1162, height: 806, units: 'logical' },
      values: { ...this.values },
    };
  }

  importJSON(obj) {
    if (!obj || !obj.values) return false;
    this.values = pick(obj.values);
    this._save();
    this.listeners.forEach((fn) => fn('*'));
    return true;
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      this.values = pick(obj.values);
    } catch (e) {
      /* storage unavailable: run on defaults */
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: this.values }));
    } catch (e) {
      /* storage unavailable */
    }
  }
}

export const tuning = new TuningService();
