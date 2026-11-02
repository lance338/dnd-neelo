import { SOUND_CATALOG, LAB_FLOW } from '../config/sound_catalog.js';

/**
 * Sound Lab state: extra takes generated in ElevenLabs, which option each sound
 * uses, and which options were deleted. Shared through the artifact's database
 * (one document per sound at lab/<sound id>):
 *   { chosen: 'a' | 'b' | <generation id>, hidden: ['a'], takes: [{ id, session, flow, at }], node }
 * Generated takes are not files: the page asks ElevenLabs for a fresh signed link
 * each time (links expire after 2 hours, the generation does not).
 *
 * Prototype only. In Flutter the chosen takes become plain asset files; ask Claude
 * to "bake in the Sound Lab picks" to download them into audio/ and the manifests.
 */
const SERVER = 'Elevenlabs';
const byId = new Map(SOUND_CATALOG.map((s) => [s.id, s]));

class SoundLab {
  constructor() {
    this.docs = {}; // id -> doc body
    this.listeners = new Set();
    this.state = 'loading'; // loading | ready | offline (no database on this view)
    this.mcpState = 'loading'; // loading | ready | unavailable
    this.queue = new Map(); // id -> promise chain, one write at a time per document
    this.urlCache = new Map(); // generation id -> { url, at }
    this.synced = {}; // generation id -> audio/lab/<file>.mp3
    this.syncDoc = null; // sync/request: { status: 'requested' | 'done', at, count, takes }
    this.loadSynced();
    this.lastViolation = null;
    document.addEventListener('securitypolicyviolation', (e) => (this.lastViolation = { directive: e.effectiveDirective || e.violatedDirective, blocked: String(e.blockedURI).slice(0, 80) }));
    this._init();
  }

  async _init() {
    const c = window.claude;
    if (!c?.use) {
      this.state = 'offline';
      this.mcpState = 'unavailable';
      return this._emit();
    }
    c.use('mcp')
      .then((m) => {
        this.mcp = m;
        this.mcpState = m ? 'ready' : 'unavailable';
        this._emit();
      })
      .catch(() => {
        this.mcpState = 'unavailable';
        this._emit();
      });
    let db = null;
    try {
      db = await c.use('db');
    } catch (e) {
      /* no database */
    }
    if (!db) {
      this.state = 'offline';
      return this._emit();
    }
    this.db = db;
    const timer = setTimeout(() => {
      if (this.state === 'loading') {
        this.state = 'slow';
        this._emit();
      }
    }, 10000);
    db.doc('sync/request').onSnapshot(
      (d) => {
        this.syncDoc = d.exists ? d.data() : null;
        this._emit();
      },
      () => {},
    );
    db.collection('lab').onSnapshot(
      (snap) => {
        const next = {};
        snap.docs.forEach((d) => (next[d.id] = d.data()));
        this.docs = next;
        if (!snap.metadata.fromCache) clearTimeout(timer);
        this.state = 'ready';
        this._emit();
      },
      () => {
        clearTimeout(timer);
        this.state = 'offline';
        this._emit();
      },
    );
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit() {
    this.listeners.forEach((fn) => fn());
  }

  doc(id) {
    return this.docs[id] || {};
  }

  /** Options as the Lab lists them: built-in files first, then generated takes. */
  options(id) {
    const s = byId.get(id);
    const d = this.doc(id);
    const hidden = new Set(d.hidden || []);
    const out = s.builtins.filter((b) => !hidden.has(b.key)).map((b) => ({ id: b.key, name: b.key.toUpperCase(), src: b.src, builtin: true }));
    (d.takes || []).forEach((t, i) => out.push({ id: t.id, name: `Take ${i + 1}`, take: t, builtin: false }));
    return out;
  }

  /** The shared choice for a sound, or null when the Lab never set one. */
  chosen(id) {
    return this.doc(id).chosen || null;
  }

  takeFor(id, optionId) {
    return (this.doc(id).takes || []).find((t) => t.id === optionId) || null;
  }

  _write(id, change) {
    const prev = this.queue.get(id) || Promise.resolve();
    const run = prev.then(async () => {
      const body = structuredClone(this.doc(id));
      change(body);
      this.docs[id] = body; // optimistic; the snapshot confirms it
      this._emit();
      if (this.db) await this.db.doc('lab/' + id).set(body);
    });
    this.queue.set(id, run.catch(() => {}));
    return run;
  }

  /** True when choices are shared and kept; otherwise they last until reload. */
  canWrite() {
    return !!this.db && this.state !== 'offline';
  }

  choose(id, optionId) {
    return this._write(id, (b) => (b.chosen = optionId));
  }

  /** Remove every option except the one in use. Built-in files are hidden, takes dropped. */
  deleteUnused(id, inUse) {
    const s = byId.get(id);
    return this._write(id, (b) => {
      b.chosen = inUse;
      b.hidden = s.builtins.map((x) => x.key).filter((k) => k !== inUse);
      b.takes = (b.takes || []).filter((t) => t.id === inUse);
    });
  }

  /** Remove one option. Built-in files are hidden, generated takes dropped. */
  deleteOne(id, optionId) {
    const s = byId.get(id);
    return this._write(id, (b) => {
      if (s.builtins.some((x) => x.key === optionId)) b.hidden = [...new Set([...(b.hidden || []), optionId])];
      else b.takes = (b.takes || []).filter((t) => t.id !== optionId);
      if (b.chosen === optionId) delete b.chosen;
    });
  }

  /** Bring back built-in files that were deleted. */
  restore(id) {
    return this._write(id, (b) => (b.hidden = []));
  }

  async _call(tool, input) {
    const r = await this.mcp.callTool(SERVER, tool, { ...input, context: 'Neelo Sound Lab: ' + (input.context || tool) });
    return r.payload;
  }

  /** How many takes one press of Generate makes. */
  static PER_RUN = 2;

  /** Make new takes for a sound (PER_RUN at a time). Calls back with progress text; resolves the takes. */
  async generate(id, onStatus = () => {}) {
    const s = byId.get(id);
    if (!this.mcp) throw { code: 'not_granted' };
    let { flow, node } = s.gen;
    if (!node) node = this.doc(id).node;
    if (!node) {
      onStatus('Setting up');
      const r = s.gen.recipe;
      const input = { flow_id: LAB_FLOW, node_type: r.node_type, model_id: r.model_id, label: r.label, prompt: r.prompt, model_parameters: r.model_parameters, context: 'node for ' + r.label };
      if (r.voice_id) input.voice_id = r.voice_id;
      const made = await this._call('creative_add_flow_node', input);
      node = made?.node_id || made?.node_ids?.[0] || made?.created_nodes?.[0]?.id || made?.id || made?.node?.id;
      if (!node) throw { code: 'tool_error', message: 'ElevenLabs did not return a node.' };
      await this._write(id, (b) => (b.node = node));
    }
    if (!s.gen.node) flow = LAB_FLOW;
    onStatus('Generating');
    const run = await this._call('creative_run_flow_nodes', {
      flow_id: flow,
      node_ids: [node],
      generations_count: SoundLab.PER_RUN,
      context: `${SoundLab.PER_RUN} new takes of ${s.id}`,
    });
    const sessions = run?.session_ids || (run?.session_id ? [run.session_id] : []);
    if (!sessions.length) throw { code: 'tool_error', message: 'ElevenLabs did not start a run.' };
    let wait = (run.poll_after_seconds || 3) * 1000;
    const started = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, Math.min(Math.max(wait, 1500), 8000)));
      const st = await this._call('creative_get_flow_run_status', { flow_id: flow, session_ids: sessions, context: 'poll ' + s.id });
      if (st?.all_completed || st?.has_failures) {
        const gens = (st.generations || []).filter((g) => g.status !== 'failed' && (g.content_url || (st.media || []).some((m) => m.generation_id === g.id)));
        if (!gens.length) throw { code: 'tool_error', message: 'ElevenLabs could not make these takes.' };
        const takes = gens.map((g, i) => {
          const url = (st.media || []).find((m) => m.generation_id === g.id)?.url || g.content_url;
          if (url) this.urlCache.set(g.id, { url, at: Date.now() });
          return { id: g.id, session: sessions[i] || sessions[0], sessions, flow, at: Date.now() + i, credits: g.price?.credits ?? null };
        });
        await this._write(id, (b) => (b.takes = [...(b.takes || []), ...takes]));
        return takes;
      }
      if (Date.now() - started > 240000) throw { code: 'timeout', message: 'Still generating. Check back in a minute.' };
      wait = (st?.poll_after_seconds || 3) * 1000;
    }
  }

  /** A link to a generated take on ElevenLabs (fresh signed link, cached for an hour). */
  cachedUrl(take) {
    const hit = this.urlCache.get(take.id);
    return hit && Date.now() - hit.at < 3600000 ? hit.url : null;
  }

  async urlFor(take) {
    const hit = this.cachedUrl(take);
    if (hit) return hit;
    if (!this.mcp) return null;
    const st = await this._call('creative_get_flow_run_status', { flow_id: take.flow, session_ids: take.sessions || [take.session], context: 'play a take' });
    const g = (st?.generations || []).find((x) => x.id === take.id);
    const url = (st?.media || []).find((m) => m.generation_id === take.id)?.url || g?.content_url;
    if (url) this.urlCache.set(take.id, { url, at: Date.now() });
    return url || null;
  }

  /**
   * Takes that have been added to the page as real files (audio/lab/index.json,
   * written by Claude when asked to sync). These play on the page and in game.
   */
  localFile(take) {
    return this.synced?.[take.id] || null;
  }

  async loadSynced() {
    try {
      this.synced = await fetch('audio/lab/index.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {}));
    } catch (e) {
      this.synced = {};
    }
    this._emit();
  }

  /** Takes not yet added to the page as files. */
  unsynced() {
    return this.unsyncedTakes().length;
  }

  unsyncedTakes() {
    const out = [];
    Object.entries(this.docs).forEach(([sound, d]) => (d.takes || []).forEach((t) => !this.localFile(t) && out.push({ sound, id: t.id, flow: t.flow, sessions: t.sessions || [t.session] })));
    return out;
  }

  /**
   * Ask for a sync. The page can't add files to itself (only Claude can publish
   * them), so this re-checks what is already on the page, then leaves the list
   * of missing takes at sync/request for Claude to pick up.
   */
  async requestSync() {
    await this.loadSynced();
    const takes = this.unsyncedTakes();
    if (!takes.length) return { count: 0 };
    if (!this.db) throw { code: 'offline' };
    await this.db.doc('sync/request').set({ status: 'requested', at: Date.now(), count: takes.length, takes });
    return { count: takes.length };
  }

  /** Remember why a take could not play here, for diagnosis (one small document). */
  note(info) {
    if (!this.db) return;
    this.db.doc('diag/play').set({ ...info, at: Date.now() }).catch(() => {});
  }
}

export const soundLab = new SoundLab();
export { byId as soundById };

/** Sound id for a voice line file (audio/nova/a/nova-lantern-01-....mp3 -> vo-lantern-01-...). */
export const voiceIdFor = (fileA) => 'vo-' + fileA.split('/').pop().replace(/\.mp3$/, '').replace(/^nova-/, '');
