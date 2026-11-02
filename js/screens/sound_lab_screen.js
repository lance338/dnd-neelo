import { SOUND_CATALOG } from '../config/sound_catalog.js';
import { soundLab } from '../services/sound_lab_service.js';
import { audio } from '../services/audio_service.js';
import { tuning } from '../services/tuning_service.js';
import { Icons } from '../components/icons.js';

/**
 * Sound Lab: every sound in the prototype. Play each option, generate one new
 * take in ElevenLabs, pick the one the game uses, and delete the ones you don't.
 * Prototype tooling only; nothing here ships in the Flutter app.
 */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function inUse(sound) {
  const opts = soundLab.options(sound.id);
  const picked = soundLab.chosen(sound.id);
  if (picked && opts.some((o) => o.id === picked)) return picked;
  const local = sound.kind === 'sfx' ? 'ab'[tuning.soundChoice[sound.event] ?? 0] : tuning.get('novaVoiceTake') >= 1 ? 'b' : 'a';
  return opts.some((o) => o.id === local) ? local : opts[0]?.id;
}

const ERRORS = {
  needs_reauth: 'Reconnect ElevenLabs in claude.ai Settings, Connectors.',
  server_not_connected: 'Add the ElevenLabs connector in claude.ai Settings, Connectors.',
  not_in_manifest: 'ElevenLabs is turned off for this page. Turn it on from the artifact permissions.',
  approval_required: 'Generating needs your approval. Press Generate again and allow it.',
  blocked_by_policy: 'Your organization blocks this ElevenLabs tool.',
  not_granted: 'Open this page in Claude to generate new takes.',
  capability_disabled: 'Open this page in Claude to generate new takes.',
  server_unavailable: 'ElevenLabs did not answer. It may still be generating; check back shortly.',
  timeout: 'Still generating. It will show up here when ElevenLabs finishes.',
};
const errorText = (e) => ERRORS[e?.code] || (e?.code === 'tool_error' && e?.message && e.message.length < 140 ? e.message : 'Something went wrong with ElevenLabs. Try again in a moment.');

export function renderSoundLab(root, { onBack }) {
  const ui = {}; // id -> { status, error, confirm }
  let tab = 'sfx';
  let query = '';
  let playing = null; // `${id}:${optionId}`
  let playTimer = null;
  const remote = {}; // take id -> ElevenLabs link, for takes that can't play on the page yet
  let blockedSeen = false;
  let syncing = false;
  let syncNote = ''; // result of the last Sync press, shown until the next change

  root.innerHTML = `
  <div class="hub lab">
    <div class="hub-inner">
      <div class="hub-head">
        <h1 class="hub-title">Sound Lab<small>Every sound in the prototype. Play it, generate new takes, and pick the one the game uses.</small></h1>
        <div class="hub-actions"><button class="pill-btn" data-a="sync" title="Get new takes ready to play on this page and in the game">Sync takes <span class="lab-count"></span></button><button class="pill-btn" data-a="back">Back to levels</button></div>
      </div>
      <div class="lab-status" role="status"></div>
      <div class="lab-bar">
        <div class="lab-tabs" role="tablist">
          <button role="tab" data-tab="sfx">Sound effects <span></span></button>
          <button role="tab" data-tab="voice">Voice lines <span></span></button>
        </div>
        <input class="lab-search" type="search" placeholder="Search sounds" aria-label="Search sounds">
      </div>
      <div class="lab-list"></div>
    </div>
  </div>`;

  const statusEl = root.querySelector('.lab-status');
  const listEl = root.querySelector('.lab-list');

  function renderStatus() {
    const notes = [];
    if (soundLab.state === 'offline') notes.push('Choices last until you reload: shared saving is not available on this view.');
    else if (soundLab.state === 'loading') notes.push('Loading saved choices…');
    else if (soundLab.state === 'slow') notes.push('Saved choices can not be reached yet. What you see may be out of date.');
    if (soundLab.mcpState === 'unavailable') notes.push('Open this page in Claude with the ElevenLabs connector to generate new takes.');
    const waiting = soundLab.unsynced();
    const req = soundLab.syncDoc;
    if (syncNote) notes.push(syncNote);
    else if (waiting && req?.status === 'requested') notes.push(`Sync requested for ${req.count} take${req.count === 1 ? '' : 's'}. Tell Claude “sync my takes” to finish; they will play here and in the game after that.`);
    else if (blockedSeen && waiting) notes.push(`${waiting} new take${waiting === 1 ? ' is' : 's are'} not on the page yet, so they open in a new tab for now. Press Sync takes, then tell Claude “sync my takes”.`);
    statusEl.innerHTML = notes.map((n) => `<p>${esc(n)}</p>`).join('');
    statusEl.classList.toggle('hidden', !notes.length);
    const sync = root.querySelector('[data-a="sync"]');
    sync.disabled = syncing;
    sync.querySelector('.lab-count').textContent = waiting ? waiting : '';
    sync.classList.toggle('solid', waiting > 0);
  }

  function rowHtml(s) {
    const st = ui[s.id] || {};
    const opts = soundLab.options(s.id);
    const used = inUse(s);
    const busy = st.status === 'gen';
    const canGen = soundLab.mcpState === 'ready' && !busy;
    const extra = opts.length - 1;
    const hidden = (soundLab.doc(s.id).hidden || []).length;
    return `<div class="lab-row" data-id="${s.id}">
      <div class="lab-top">
      <div class="lab-name"><b>${esc(s.label)}</b><small>${esc(s.sub)}</small></div>
      <div class="lab-actions">
        <button class="lab-gen" data-a="gen" ${canGen ? '' : 'disabled'} title="${soundLab.mcpState === 'ready' ? 'Make two new takes in ElevenLabs' : 'Needs the ElevenLabs connector in Claude'}">Generate new sound</button>
        ${
          st.confirm
            ? `<button class="lab-del confirm" data-a="del-yes">Delete ${extra} unused</button><button class="lab-del" data-a="del-no">Keep</button>`
            : `<button class="lab-del" data-a="del" ${extra > 0 && !busy ? '' : 'disabled'}>Delete unused</button>`
        }
        ${hidden && !st.confirm ? `<button class="lab-link" data-a="restore">Restore A/B</button>` : ''}
      </div>
      </div>
      <div class="lab-opts">
        ${opts
          .map((o) => {
            const on = o.id === used;
            const isPlaying = playing === `${s.id}:${o.id}`;
            const tip = o.take ? `Generated ${new Date(o.take.at).toLocaleString()}${o.take.credits != null ? `, ${o.take.credits} credits` : ''}` : o.src.split('/').pop();
            return `<div class="lab-opt${on ? ' on' : ''}${o.builtin ? '' : ' new'}" title="${esc(tip)}">
              ${
                o.take && remote[o.id]
                  ? `<a class="lab-play ext" href="${esc(remote[o.id])}" target="_blank" rel="noopener" aria-label="Open ${esc(o.name)} in a new tab" title="Opens in a new tab">${Icons.play}</a>`
                  : `<button class="lab-play${isPlaying ? ' playing' : ''}" data-a="play" data-o="${o.id}" aria-label="Play ${esc(o.name)}">${Icons.play}</button>`
              }
              <span class="lab-oname">${esc(o.name)}</span>
              ${on ? '<span class="lab-inuse">In use</span>' : `<button class="lab-use" data-a="use" data-o="${o.id}">Use</button>`}
              ${
                on || opts.length < 2
                  ? ''
                  : st.confirmOne === o.id
                    ? `<button class="lab-x confirm" data-a="del-one" data-o="${o.id}" aria-label="Confirm delete ${esc(o.name)}">Delete?</button>`
                    : `<button class="lab-x" data-a="ask-one" data-o="${o.id}" aria-label="Delete ${esc(o.name)}" title="Delete this one">×</button>`
              }
            </div>`;
          })
          .join('')}
        ${busy ? [0, 1].map(() => `<div class="lab-opt pending"><span class="lab-spin" aria-hidden="true"></span><span class="lab-oname">${esc(st.text || 'Generating')}…</span></div>`).join('') : ''}
      </div>
      ${st.error ? `<p class="lab-err" role="alert">${esc(st.error)}</p>` : ''}
    </div>`;
  }

  function renderList() {
    const q = query.trim().toLowerCase();
    const items = SOUND_CATALOG.filter((s) => s.kind === tab && (!q || (s.label + ' ' + s.sub + ' ' + s.group).toLowerCase().includes(q)));
    root.querySelectorAll('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on);
      b.querySelector('span').textContent = SOUND_CATALOG.filter((s) => s.kind === b.dataset.tab).length;
    });
    let html = '';
    let group = null;
    items.forEach((s) => {
      if (s.group !== group) {
        if (group !== null) html += '</section>';
        group = s.group;
        html += `<section class="lab-group"><h2 class="section-title">${esc(group)}</h2>`;
      }
      html += rowHtml(s);
    });
    if (group !== null) html += '</section>';
    listEl.innerHTML = html || '<p class="lab-empty">No sounds match that search.</p>';
  }

  function renderRow(id) {
    const el = listEl.querySelector(`.lab-row[data-id="${id}"]`);
    const s = SOUND_CATALOG.find((x) => x.id === id);
    if (el && s) el.outerHTML = rowHtml(s);
  }

  function render() {
    renderStatus();
    renderList();
  }

  const unsub = soundLab.subscribe(render);

  root.querySelector('[data-a="back"]').addEventListener('click', onBack);
  root.querySelector('[data-a="sync"]').addEventListener('click', async () => {
    syncing = true;
    syncNote = 'Checking which takes are on the page…';
    renderStatus();
    try {
      const { count } = await soundLab.requestSync();
      syncNote = count ? '' : 'All takes are synced. Everything plays on this page and in the game.';
    } catch (err) {
      syncNote = 'Could not send the sync request. Try again, or tell Claude “sync my takes”.';
    }
    syncing = false;
    render();
  });
  root.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      tab = b.dataset.tab;
      renderList();
    }),
  );
  root.querySelector('.lab-search').addEventListener('input', (e) => {
    query = e.target.value;
    renderList();
  });

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-a]');
    if (!btn) return;
    const id = btn.closest('.lab-row').dataset.id;
    const s = SOUND_CATALOG.find((x) => x.id === id);
    const a = btn.dataset.a;
    ui[id] = ui[id] || {};

    if (a === 'play') {
      const opt = soundLab.options(id).find((o) => o.id === btn.dataset.o);
      if (!opt) return;
      playing = `${id}:${opt.id}`;
      clearTimeout(playTimer);
      renderRow(id);
      const r = await audio.preview(s, opt);
      ui[id].error = r.ok || r.blocked ? null : r.reason;
      if (r.blocked && r.url) {
        remote[opt.id] = r.url;
        blockedSeen = true;
        renderStatus();
      }
      playTimer = setTimeout(() => {
        playing = null;
        renderRow(id);
      }, r.ok ? Math.max(600, (r.duration || 1.2) * 1000) : 0);
      renderRow(id);
      return;
    }

    if (a === 'use') {
      const o = btn.dataset.o;
      if (s.kind === 'sfx' && (o === 'a' || o === 'b')) tuning.setSoundChoice(s.event, o === 'a' ? 0 : 1);
      try {
        await soundLab.choose(id, o);
        ui[id].error = null;
      } catch (err) {
        ui[id].error = 'Could not save that choice. Try again.';
      }
      renderRow(id);
      return;
    }

    if (a === 'gen') {
      ui[id] = { status: 'gen', text: 'Starting' };
      renderRow(id);
      try {
        const takes = await soundLab.generate(id, (text) => {
          ui[id].text = text;
          renderRow(id);
        });
        ui[id] = {};
        renderRow(id);
        // Play the first new take straight away when it can play on the page
        const opt = soundLab.options(id).find((o) => o.id === takes[0]?.id);
        if (opt && soundLab.localFile(opt.take)) {
          playing = `${id}:${opt.id}`;
          renderRow(id);
          const r = await audio.preview(s, opt);
          if (!r.ok && !r.blocked) ui[id].error = r.reason;
          playTimer = setTimeout(() => {
            playing = null;
            renderRow(id);
          }, r.ok ? Math.max(600, (r.duration || 1.2) * 1000) : 0);
          renderRow(id);
        }
      } catch (err) {
        ui[id] = { error: errorText(err) };
        renderRow(id);
      }
      return;
    }

    if (a === 'del') ui[id].confirm = true;
    if (a === 'del-no') ui[id].confirm = false;
    if (a === 'del-yes') {
      ui[id].confirm = false;
      try {
        await soundLab.deleteUnused(id, inUse(s));
      } catch (err) {
        ui[id].error = 'Could not delete. Try again.';
      }
    }
    if (a === 'ask-one') ui[id].confirmOne = btn.dataset.o;
    if (a === 'del-one') {
      ui[id].confirmOne = null;
      try {
        await soundLab.deleteOne(id, btn.dataset.o);
      } catch (err) {
        ui[id].error = 'Could not delete. Try again.';
      }
    }
    if (a === 'restore') {
      try {
        await soundLab.restore(id);
      } catch (err) {
        ui[id].error = 'Could not restore. Try again.';
      }
    }
    renderRow(id);
  });

  render();
  return {
    exit() {
      unsub();
      clearTimeout(playTimer);
      audio.stopPreview();
    },
  };
}
