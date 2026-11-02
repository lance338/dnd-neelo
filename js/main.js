import { renderHub } from './screens/hub_screen.js';
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
const groupOf = (id) => (index.path.steps.some((s) => s.id === id) ? 'path' : (index.prototypes || []).some((s) => s.id === id) ? 'prototypes' : 'templates');
function fromHash(h) {
  const m = h.match(/^#play-([a-z0-9-]+)$/i);
  if (!m) return null;
  const all = [...index.templates, ...index.path.steps, ...(index.prototypes || [])];
  const hit = all.find((x) => x.id.replace(/_/g, '-') === m[1]);
  return hit ? hit.id : null;
}

function nextOf(id, group) {
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
  if (!id) {
    document.body.style.overflow = '';
    renderHub(app, index, { onPlay: (lid) => (location.hash = toHash(lid)) });
    return;
  }
  const group = groupOf(id);
  document.body.style.overflow = 'hidden';
  const next = nextOf(id, group);
  current = await mountGameView(app, id, {
    onExit: () => (location.hash = '#map'),
    onNext: next ? () => (location.hash = toHash(next.id)) : null,
    nextLabel: next ? `Next: ${next.title || next.label}` : null,
  });
}

window.addEventListener('hashchange', route);
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
route();
