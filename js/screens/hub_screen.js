import { artThumb } from '../games/drag_drop/art/registry.js';
import { seeded } from '../core/motion.js';
import { createTuningPanel } from '../games/drag_drop/ui/tuning_panel.js';
import { openDoc } from '../components/doc_viewer.js';

const svgUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

function pathD(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function starsSvg() {
  const r = seeded(9);
  let s = '';
  for (let i = 0; i < 90; i++) s += `<circle cx="${r() * 100}%" cy="${r() * 60}%" r="${0.6 + r() * 1.4}" fill="#fff" opacity="${0.3 + r() * 0.7}"/>`;
  return `<svg class="hub-stars" width="100%" height="100%">${s}</svg>`;
}

export function renderHub(root, index, { onPlay }) {
  const steps = index.path.steps;
  // Even spacing, alternating high and low, like the world map paths
  const PATH_PTS = steps.map((_, i) => [80 + (i * 840) / Math.max(1, steps.length - 1), i % 2 ? 108 : 226]);
  root.innerHTML = `
  <div class="hub">
    ${starsSvg()}
    <div class="hub-inner">
      <div class="hub-head">
        <h1 class="hub-title">Drag &amp; Drop<small>Neelo game prototype · every drag and drop type, one engine</small></h1>
        <div class="hub-actions"><button class="pill-btn" data-a="tune">Tuning</button><a class="pill-btn" href="#sounds" style="text-decoration:none">Sound Lab</a><button class="pill-btn solid" data-doc="README.md" data-title="Developer notes">Developer notes</button></div>
      </div>

      <div class="section-label">Module path · ${index.path.world} ${index.path.module}</div>
      <h2 class="section-title">Play it in the story</h2>
      <div class="path-card">
        <svg class="path-svg" viewBox="0 0 1000 320" aria-hidden="true">
          <path d="${pathD(PATH_PTS)}" stroke="rgba(30,18,70,0.25)" stroke-width="44" fill="none" stroke-linecap="round" transform="translate(0 8)"/>
          <path d="${pathD(PATH_PTS)}" stroke="#9FD35C" stroke-width="40" fill="none" stroke-linecap="round"/>
          <path d="${pathD(PATH_PTS)}" stroke="#86BF4E" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="2 26"/>
        </svg>
        <div class="path-nodes">
          ${steps
            .map((s, i) => {
              const [x, y] = PATH_PTS[i];
              return `<button class="path-node" style="left:${x / 10}%;top:${(y / 320) * 100}%" data-id="${s.id}" data-group="path">
                <span class="badge"><img alt="" src="${artThumb(s.art)}"></span>
                <span class="lvl">${s.label}</span><span class="name">${s.title}</span></button>`;
            })
            .join('')}
        </div>
      </div>

      <div class="section-label">New prototypes</div>
      <h2 class="section-title">From the new Figma assets</h2>
      <div class="grid">
        ${(index.prototypes || [])
          .map(
            (t) => `<button class="tcard" style="background:${t.color}" data-id="${t.id}" data-group="prototypes">
              <img alt="" src="${artThumb(t.art)}">
              <span class="num">${t.world}</span><span class="label">${t.label}</span><span class="blurb">${t.blurb}</span></button>`,
          )
          .join('')}
      </div>

      <div class="section-label">Templates</div>
      <h2 class="section-title">The seven drag and drop types</h2>
      <div class="grid">
        ${index.templates
          .map(
            (t, i) => `<button class="tcard" style="background:${t.color}" data-id="${t.id}" data-group="templates">
              <img alt="" src="${artThumb(t.art)}">
              <span class="num">0${i + 1}</span><span class="label">${t.label}</span><span class="blurb">${t.blurb}</span></button>`,
          )
          .join('')}
      </div>

      <div class="dev-card">
        <h3>For the developer</h3>
        <p>Every level is a JSON file, the art is exported from the Lance's Sandbox Figma file (assets/img), and every feel value lives in the Tuning panel (press T in a level). Export the tuning JSON and use the notes to rebuild this in Flutter + Flame.</p>
        <div class="dev-links">
          <button data-doc="README.md" data-title="Implementation notes">Implementation notes</button>
          <button data-doc="game_data/drag_drop/index.json" data-title="Level data">Level data</button>
          <button data-a="tune">Open tuning</button>
        </div>
      </div>
    </div>
  </div>`;

  const panel = createTuningPanel(root.querySelector('.hub'));
  root.querySelectorAll('[data-a="tune"]').forEach((b) => b.addEventListener('click', () => panel.toggle()));
  root.querySelectorAll('[data-doc]').forEach((b) => b.addEventListener('click', () => openDoc(root.querySelector('.hub'), b.dataset.doc, b.dataset.title)));
  root.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => onPlay(b.dataset.id, b.dataset.group)));
}
