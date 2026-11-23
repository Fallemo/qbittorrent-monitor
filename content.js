// Intercept clicks on magnet: / .torrent links and hand them to qBittorrent.
let on = false;
const load = () => chrome.storage.local.get({ intercept: true, url: '' })
  .then(c => { on = c.intercept && !!c.url; }).catch(() => {});
load();
chrome.storage.onChanged.addListener(load);

// Fetch the .torrent here, in the page's own session (cookies/login), and pass it as base64.
// Returns null for cross-origin/blocked/non-torrent responses -> background falls back to the URL.
async function grab(href) {
  try {
    const r = await fetch(href, { credentials: 'include' });
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf[0] !== 100) return null; // 'd' = bencoded dict
    let s = '';
    for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192));
    return btoa(s);
  } catch { return null; }
}

// context-menu path: background asks us to download a link
chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m.type === 'grab') { grab(m.url).then(reply); return true; }
});

const nameOf = href => {
  let n = 'file';
  try { n = decodeURIComponent(new URL(href).pathname.split('/').pop() || n); } catch { /* default */ }
  return /\.torrent$/i.test(n) ? n : n + '.torrent';
};

document.addEventListener('click', e => {
  if (!on || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const a = e.target.closest?.('a[href]');
  if (!a || !/^magnet:|\.torrent([?#]|$)/i.test(a.href)) return;
  e.preventDefault();
  e.stopPropagation();
  const href = a.href;
  (async () => {
    const b64 = /^magnet:/i.test(href) ? null : await grab(href);
    const ok = await chrome.runtime.sendMessage(b64 ? { type: 'addFile', name: nameOf(href), b64 } : { type: 'add', url: href });
    if (!ok) location.href = href; // fall back to normal behaviour
  })().catch(() => { location.href = href; });
}, true);
