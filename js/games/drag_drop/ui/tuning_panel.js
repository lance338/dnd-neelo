import { TUNING_SCHEMA } from '../../../config/tuning_defaults.js';
import { SOUND_MANIFEST } from '../../../config/sound_manifest.js';
import { tuning } from '../../../services/tuning_service.js';
import { audio } from '../../../services/audio_service.js';
import { soundLab } from '../../../services/sound_lab_service.js';
import { Icons } from '../../../components/icons.js';

/**
 * Designer tuning drawer. Debug-only in the real app (behind a flag), it
 * exports the JSON the developer seeds tuning_provider.dart with.
 */
export function createTuningPanel(host) {
  const el = document.createElement('aside');
  el.className = 'tuning';
  el.innerHTML = `
    <header><div><h3>Tuning</h3><p>Changes apply live. Export to hand off.</p></div><button class="close" aria-label="Close">×</button></header>
    <div class="body"></div>
    <footer>
      <button data-a="copy" class="primary">Copy JSON</button>
      <button data-a="download">Download JSON</button>
      <button data-a="import">Import JSON</button>
      <button data-a="reset">Reset defaults</button>
    </footer>`;
  host.appendChild(el);
  const body = el.querySelector('.body');

  const fmt = (p, v) => (p.step >= 1 ? String(Math.round(v)) : Number(v).toFixed(p.step < 0.05 ? 2 : 1));

  function render() {
    body.innerHTML = '';
    TUNING_SCHEMA.forEach((g, gi) => {
      const d = document.createElement('details');
      if (gi < 3) d.open = true;
      d.innerHTML = `<summary>${g.group}</summary>`;
      g.params.forEach((p) => {
        const row = document.createElement('div');
        const v = tuning.get(p.key);
        if (p.type === 'bool') {
          row.className = 'trow bool';
          row.innerHTML = `<label>${p.label}<input type="checkbox" ${v ? 'checked' : ''}></label>`;
          row.querySelector('input').addEventListener('change', (e) => tuning.set(p.key, e.target.checked));
        } else {
          row.className = 'trow';
          row.innerHTML = `<label><span>${p.label}</span><b>${fmt(p, v)}</b></label><input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${v}">`;
          const out = row.querySelector('b');
          row.querySelector('input').addEventListener('input', (e) => {
            const nv = parseFloat(e.target.value);
            out.textContent = fmt(p, nv);
            tuning.set(p.key, nv);
          });
        }
        d.appendChild(row);
      });
      body.appendChild(d);
    });

    const sd = document.createElement('details');
    sd.open = true;
    sd.innerHTML = `<summary>Sounds (pick a take)</summary>`;
    Object.entries(SOUND_MANIFEST).forEach(([ev, s]) => {
      const row = document.createElement('div');
      row.className = 'srow';
      // A pick made in the Sound Lab is shared and wins over this panel
      const labPick = soundLab.chosen('sfx-' + ev);
      const choice = labPick === 'a' ? 0 : labPick === 'b' ? 1 : labPick ? -1 : tuning.soundChoice[ev] ?? 0;
      const res = audio.unlocked ? audio.resolve(ev) : { isFallback: false };
      row.innerHTML = `<div class="sname">${s.label}${res.isFallback ? '<small>new take not added yet, using library sound</small>' : ''}${choice < 0 ? '<small>Using a new take from the Sound Lab</small>' : ''}</div>
        <div class="seg">${(s.optionLabels || ['A', 'B']).map((l, i) => `<button data-o="${i}" class="${choice === i ? 'on' : ''}">${l}</button>`).join('')}<button class="play" aria-label="Preview">${Icons.play}</button></div>`;
      if (s.optionNotes) row.querySelector('.sname').insertAdjacentHTML('beforeend', `<small style="color:var(--ink-soft)">${Object.entries(s.optionNotes).map(([k, v]) => k + ': ' + v).join(' · ')}</small>`);
      row.querySelectorAll('[data-o]').forEach((b) =>
        b.addEventListener('click', () => {
          audio.unlock();
          tuning.setSoundChoice(ev, Number(b.dataset.o));
          if (soundLab.chosen('sfx-' + ev)) soundLab.choose('sfx-' + ev, 'ab'[Number(b.dataset.o)]).catch(() => {});
          row.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', x === b));
          audio.lastPlay.delete(ev);
          audio.play(ev);
        }),
      );
      row.querySelector('.play').addEventListener('click', () => {
        audio.unlock();
        audio.lastPlay.delete(ev);
        audio.play(ev);
      });
      sd.appendChild(row);
    });
    body.appendChild(sd);
  }

  el.querySelector('.close').addEventListener('click', () => toggle(false));
  el.querySelector('footer').addEventListener('click', async (e) => {
    const a = e.target.dataset.a;
    if (!a) return;
    const json = JSON.stringify(tuning.toJSON(), null, 2);
    if (a === 'copy') {
      try {
        await navigator.clipboard.writeText(json);
        toast('Tuning JSON copied');
      } catch (err) {
        download(json);
      }
    } else if (a === 'download') download(json);
    else if (a === 'reset') {
      tuning.reset();
      render();
      toast('Back to defaults');
    } else if (a === 'import') {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'application/json';
      inp.onchange = async () => {
        try {
          const ok = tuning.importJSON(JSON.parse(await inp.files[0].text()));
          render();
          toast(ok ? 'Tuning imported' : 'That file is not a tuning export');
        } catch (err) {
          toast('Could not read that file');
        }
      };
      inp.click();
    }
  });

  function download(json) {
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'neelo-drag-drop-tuning.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Tuning JSON downloaded');
  }

  function toggle(force) {
    const open = force ?? !el.classList.contains('open');
    if (open) render();
    el.classList.toggle('open', open);
  }

  return { el, toggle, render };
}

let toastEl;
export function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
}
