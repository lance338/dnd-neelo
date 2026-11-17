/**
 * In-app viewer for the developer notes (README.md) and level data (JSON).
 * Files open here instead of in a new tab: the published artifact's files are
 * only served inside the claude.ai viewer, so a new tab is refused.
 */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

/** Small Markdown renderer: headings, paragraphs, lists, tables, code blocks. */
export function renderMarkdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      i++;
      continue;
    }
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|[\s:-]+\|/.test(r) || /[A-Za-z0-9]/.test(r));
      const [head, ...rest] = body;
      out.push(`<table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const m = lines[i].match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
        if (m) items.push(m[1]);
        else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (!l.trim()) {
      i++;
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}

export async function openDoc(host, url, title) {
  const el = document.createElement('div');
  el.className = 'doc-viewer';
  el.innerHTML = `<div class="doc-card" role="dialog" aria-label="${esc(title)}">
      <header><h3>${esc(title)}</h3><button class="doc-close" aria-label="Close">×</button></header>
      <div class="doc-body"><p class="doc-loading">Loading…</p></div>
    </div>`;
  host.appendChild(el);
  const close = () => {
    el.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('.doc-close')) close();
  });
  const body = el.querySelector('.doc-body');
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    const text = await r.text();
    body.innerHTML = /\.json$/i.test(url) ? `<pre><code>${esc(JSON.stringify(JSON.parse(text), null, 2))}</code></pre>` : renderMarkdown(text);
  } catch (e) {
    body.innerHTML = `<p>Could not load ${esc(url)}.</p>`;
  }
}
