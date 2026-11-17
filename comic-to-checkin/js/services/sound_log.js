const KEY = 'neelo-dnd-sound-log';
let on = false;
try {
  on = localStorage.getItem(KEY) === '1';
} catch (e) {
  /* storage unavailable */
}

/**
 * Developer sound log (Sound Lab > "Sound log"). Every sound the game plays
 * is written to the browser console and to a small on-screen panel: the action it
 * belongs to and the exact file or Sound Lab take that played.
 * Prototype only; in Flutter this maps to a debug overlay behind the same flag.
 */
const MAX = 40;
const entries = [];
let panel = null;
let listEl = null;

const time = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 8) + '.' + String(d.getMilliseconds()).padStart(3, '0');
};
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function ensurePanel() {
  if (panel) return;
  panel = document.createElement('aside');
  panel.className = 'sound-log';
  panel.setAttribute('aria-label', 'Sound log');
  panel.innerHTML = `<header><b>Sound log</b><span><button data-a="clear">Clear</button><button data-a="off" aria-label="Turn sound log off">×</button></span></header><ol></ol>`;
  listEl = panel.querySelector('ol');
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'clear') {
      entries.length = 0;
      render();
    }
    if (a === 'off') setSoundLog(false);
  });
  document.body.appendChild(panel);
}

function render() {
  if (!panel) return;
  listEl.innerHTML = entries
    .map(
      (e) => `<li class="${e.kind}"><time>${e.at}</time><span class="act">${esc(e.action)}</span><span class="snd">${esc(e.sound)}</span>${e.file ? `<small>${esc(e.file)}</small>` : ''}</li>`,
    )
    .join('');
}

function sync() {
  if (on) ensurePanel();
  if (panel) panel.classList.toggle('show', on);
  if (on) render();
}
sync();

export const isSoundLogOn = () => on;
export function setSoundLog(value) {
  on = !!value;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch (e) {
    /* storage unavailable */
  }
  sync();
  document.dispatchEvent(new CustomEvent('soundlog', { detail: on }));
}

/** Record one played sound: kind 'sfx' | 'voice', the action, which sound, and its file. */
export function logSound({ kind = 'sfx', action, sound, file }) {
  if (!on) return;
  const e = { kind, at: time(), action, sound, file };
  entries.unshift(e);
  if (entries.length > MAX) entries.pop();
  console.log(`%c[sound] ${e.at}%c ${action} %c→ ${sound}${file ? `  (${file})` : ''}`, 'color:#8b7fd6', 'font-weight:bold', 'color:inherit');
  ensurePanel();
  render();
}
