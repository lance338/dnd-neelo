import { TUNING_SCHEMA } from '../../../config/tuning_defaults.js';
import { tuning } from '../../../services/tuning_service.js';
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
