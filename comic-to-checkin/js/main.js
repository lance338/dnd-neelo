import { renderHub, renderLaunchpad } from './screens/hub_screen.js';
import { mountGameView } from './games/drag_drop/drag_drop_game_view.js';
import { audio } from './services/audio_service.js';
import { renderSoundLab } from './screens/sound_lab_screen.js';

/** Tiny hash router: no hash is the hub, #play-<level-id> is a level (plain names so links can be shared), #sounds is the Sound Lab. */
const app = document.getElementById('app');
let index = null;
let current = null;

async function getIndex() {
  if (!index) index = await fetch('game_data/drag_drop/index.json').then((r) => r.json());
  return index;
}

const toHash = (id) => '#play-' + id.replace(/_/g, '-');
const pad = () => (window.LAUNCHPAD && index[window.LAUNCHPAD]) || null;
// Launch pads in index.json: { kicker, title, lede, versions: [...] }
const pads = () => Object.entries(index).filter(([, v]) => v && Array.isArray(v.versions));
const padOf = (id) => pads().find(([, v]) => v.versions.some((x) => x.id === id))?.[0] || null;
const groupOf = (id) => (pad()?.versions.some((s) => s.id === id) ? 'featured' : (index.featured || []).some((s) => s.id === id) ? 'featured' : index.path.steps.some((s) => s.id === id) ? 'path' : (index.prototypes || []).some((s) => s.id === id) ? 'prototypes' : 'templates');
function fromHash(h) {
  const m = h.match(/^#play-([a-z0-9-]+)$/i);
  if (!m) return null;
  const all = [...pads().flatMap(([, v]) => v.versions), ...(index.featured || []), ...index.templates, ...index.path.steps, ...(index.prototypes || [])];
  const hit = all.find((x) => x.id.replace(/_/g, '-') === m[1]);
  return hit ? hit.id : null;
}

function nextOf(id, group) {
  if (group === 'featured') return null;
  const list = group === 'path' ? index.path.steps : group === 'prototypes' ? index.prototypes : index.templates;
  const i = list.findIndex((x) => x.id === id);
  return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
}

async function route() {
  await getIndex();
  current?.exit?.();
  current = null;
  if (location.hash === '#sounds') {
    document.body.style.overflow = '';
    current = renderSoundLab(app, { onBack: () => (location.hash = '#map') });
    window.scrollTo(0, 0);
    return;
  }
  const id = fromHash(location.hash);
  // A page built for one level (window.SINGLE_LEVEL, e.g. c2c.html) never shows the hub: Back replays it
  if (!id && window.SINGLE_LEVEL) {
    location.hash = toHash(window.SINGLE_LEVEL);
    return;
  }
  // A page built as a launch pad (window.LAUNCHPAD, e.g. c2c.html) lists its versions instead of the hub
  if (!id && pad()) {
    document.body.style.overflow = '';
    renderLaunchpad(app, pad(), { onPlay: (lid) => (location.hash = toHash(lid)) });
    return;
  }
  // A hub card can open a launch pad (#pad-<name>), with a way back to the hub
  const pm = location.hash.match(/^#pad-([a-z0-9_]+)$/i);
  if (pm && index[pm[1]]?.versions) {
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
    renderLaunchpad(app, index[pm[1]], { onPlay: (lid) => (location.hash = toHash(lid)), onBack: () => (location.hash = '#map') });
    return;
  }
  if (!id) {
    document.body.style.overflow = '';
    renderHub(app, index, {
      onPlay: (lid) => {
        const card = (index.featured || []).find((x) => x.id === lid);
        location.hash = card?.pad ? '#pad-' + card.pad : toHash(lid);
      },
    });
    return;
  }
  const group = groupOf(id);
  document.body.style.overflow = 'hidden';
  const next = nextOf(id, group);
  current = await mountGameView(app, id, {
    // A version picked from a launch pad goes back to that launch pad
    // A standalone page can send Back somewhere else entirely (window.EXIT_URL, e.g. the project's launch pad)
    onExit: () => (window.EXIT_URL ? (location.href = window.EXIT_URL) : (location.hash = padOf(id) && !pad() ? '#pad-' + padOf(id) : '#map')),
    onNext: next ? () => (location.hash = toHash(next.id)) : null,
    nextLabel: next ? `Next: ${next.title || next.label}` : null,
  });
}

window.addEventListener('hashchange', route);
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
route();
