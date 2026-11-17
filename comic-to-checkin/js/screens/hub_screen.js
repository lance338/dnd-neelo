import { artThumb } from '../games/drag_drop/art/registry.js';
import { seeded } from '../core/motion.js';
import { createTuningPanel } from '../games/drag_drop/ui/tuning_panel.js';
import { openDoc } from '../components/doc_viewer.js';

const svgUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

function starsSvg() {
  const r = seeded(9);
  let s = '';
  for (let i = 0; i < 90; i++) s += `<circle cx="${r() * 100}%" cy="${r() * 60}%" r="${0.6 + r() * 1.4}" fill="#fff" opacity="${0.3 + r() * 0.7}"/>`;
  return `<svg class="hub-stars" width="100%" height="100%">${s}</svg>`;
}

export function renderHub(root, index, { onPlay }) {
  // Two finished modules up top; everything else is a smaller work-in-progress tile
  const featured = new Set((index.featured || []).map((t) => t.id));
  const seen = new Set(featured);
  const wip = [
    ...index.path.steps.map((t) => ({ ...t, label: t.title, tag: `${index.path.world} · ${t.label}`, group: 'path', color: '#4A3B9C' })),
    ...(index.prototypes || []).map((t) => ({ ...t, tag: t.world, group: 'prototypes' })),
    ...index.templates.map((t, i) => ({ ...t, tag: `Template 0${i + 1}`, group: 'templates' })),
  ].filter((t) => !seen.has(t.id) && seen.add(t.id));
  root.innerHTML = `
  <div class="hub">
    ${starsSvg()}
    <div class="hub-inner">
      <div class="hub-head">
        <h1 class="hub-title">Drag &amp; Drop<small>Neelo game prototype · every drag and drop type, one engine</small></h1>
        <div class="hub-actions"><button class="pill-btn" data-a="tune">Tuning</button><a class="pill-btn" href="#sounds" style="text-decoration:none">Sound Lab</a><button class="pill-btn solid" data-doc="README.md" data-title="Developer notes">Developer notes</button></div>
      </div>

      <div class="section-label">Modules</div>
      <h2 class="section-title">Play the modules</h2>
      <div class="feature-grid">
        ${(index.featured || [])
          .map(
            (t) => `<button class="fcard" style="background:${t.color}" data-id="${t.id}" data-group="featured">
              <img alt="" src="${artThumb(t.art)}">
              <span class="num">${t.world}</span><span class="label">${t.label}</span><span class="blurb">${t.blurb}</span>
              <span class="play">Play</span></button>`,
          )
          .join('')}
      </div>

      <div class="section-label">Work in progress</div>
      <h2 class="section-title">Still to refine</h2>
      <div class="wip-grid">
        ${wip
          .map(
            (t) => `<button class="wcard" style="background:${t.color || '#5B4B9A'}" data-id="${t.id}" data-group="${t.group}">
              <img alt="" src="${artThumb(t.art)}">
              <span class="num">${t.tag}</span><span class="label">${t.label}</span></button>`,
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

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * A launch pad: a few versions of one flow side by side (index.json "<name>": { kicker, title, lede, versions }),
 * styled like the Level Demo launchpad (css/level_demo.css).
 */
export function renderLaunchpad(root, pad, { onPlay, onBack = null }) {
  root.innerHTML = `<div class="ld ld-launch">
    <header class="ld-head">
      ${onBack ? '<button class="ld-back" type="button">&larr; All drag and drops</button>' : ''}
      <p class="ld-kicker">${esc(pad.kicker)}</p>
      <h1>${esc(pad.title)}</h1>
      <p class="ld-lede">${esc(pad.lede)}</p>
    </header>
    <div class="ld-cards">
      ${pad.versions
        .map(
          (v) => `<button class="ld-card" data-id="${v.id}">
            <span class="ld-card-label">${esc(v.label)}</span>
            <span class="ld-card-name">${esc(v.name)}</span>
            <span class="ld-card-about">${esc(v.about)}</span>
            <span class="ld-card-go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg> Play</span>
          </button>`,
        )
        .join('')}
    </div>
  </div>`;
  root.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => onPlay(b.dataset.id)));
  root.querySelector('.ld-back')?.addEventListener('click', onBack);
}
