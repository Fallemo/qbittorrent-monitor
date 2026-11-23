import { call, add, getCfg } from './api.js';
import { loadT } from './i18n.js';
import { DL } from './util.js';

const ICON = 'icons/128.png';

async function menu() {
  const t = await loadT();
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'send', title: t('ctxMenu'), contexts: ['link', 'selection'] });
}

function ensureAlarm() { chrome.alarms.create('poll', { periodInMinutes: 0.5 }); }

chrome.runtime.onInstalled.addListener(() => { menu(); ensureAlarm(); poll(); });
chrome.runtime.onStartup.addListener(() => { menu(); ensureAlarm(); poll(); });
chrome.storage.onChanged.addListener(c => { if (c.url) poll(); }); // settings saved -> refresh badge now
chrome.storage.onChanged.addListener(c => { if (c.lang) menu(); });
chrome.alarms.onAlarm.addListener(a => a.name === 'poll' && poll());

const torrentName = u => {
  let n = 'file';
  try { n = decodeURIComponent(new URL(u).pathname.split('/').pop() || n); } catch { /* keep default */ }
  return /\.torrent$/i.test(n) ? n : n + '.torrent';
};

// Download a .torrent with the browser's cookies (works for private/login-only links) so we can
// upload the file itself; the server fetching the URL fails silently in those cases.
// Needs host permission for that site: granted on the fly when a user gesture (context menu) allows it.
async function fetchTorrent(url) {
  if (!/^https?:/i.test(url)) return null;
  try {
    const o = new URL(url), origins = [`${o.protocol}//${o.hostname}/*`];
    if (!(await chrome.permissions.contains({ origins })) && !(await chrome.permissions.request({ origins }))) return null;
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) return null;
    const b = await r.blob();
    if (b.size && (await b.slice(0, 1).text()) === 'd') // bencoded dict = real torrent, not an HTML login page
      return new File([b], torrentName(url), { type: 'application/x-bittorrent' });
  } catch { /* fall back to letting the server fetch the URL */ }
  return null;
}

async function send(url, file) {
  const t = await loadT();
  try {
    file ??= await fetchTorrent(url);
    await add(file ? { files: [file] } : { urls: url });
    chrome.notifications.create({ type: 'basic', iconUrl: ICON, title: t('added'), message: (file ? `[${t('asFile')}] ${file.name}` : `[URL] ${url}`).slice(0, 120) });
    poll();
    return true;
  } catch (e) {
    chrome.notifications.create({ type: 'basic', iconUrl: ICON, title: t('addFail'), message: e.message });
    return false;
  }
}

const toFile = (b64, name) =>
  new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], name, { type: 'application/x-bittorrent' });

chrome.contextMenus.onClicked.addListener(async (i, tab) => {
  const url = (i.linkUrl || i.selectionText || '').trim();
  if (!url) return;
  let file = null;
  if (/^https?:/i.test(url) && tab?.id >= 0) {
    // ask the page's content script to download it (page cookies/login, no extra permission)
    try {
      const b64 = await chrome.tabs.sendMessage(tab.id, { type: 'grab', url }, { frameId: i.frameId });
      if (b64) file = toFile(b64, torrentName(url));
    } catch { /* no content script here (e.g. chrome:// page) */ }
  }
  send(url, file);
});

chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m.type === 'add') { send(m.url).then(reply); return true; }
  if (m.type === 'addFile') { // .torrent already downloaded by the content script (base64)
    send(m.name, toFile(m.b64, m.name)).then(reply);
    return true;
  }
});

// Badge = number of downloading torrents; notification when one goes incomplete -> complete.
async function poll() {
  const cfg = await getCfg();
  if (!cfg.url) return chrome.action.setBadgeText({ text: '' });
  try {
    const list = await call('torrents/info', null, cfg);
    const n = list.filter(x => DL.has(x.state)).length;
    // badge = total torrents; blue while something downloads, grey otherwise
    chrome.action.setBadgeBackgroundColor({ color: n ? '#2563eb' : '#6b7280' });
    chrome.action.setBadgeText({ text: list.length ? String(list.length) : '' });
    chrome.action.setTitle({ title: `qBittorrent: ${n} ↓ / ${list.length}` });

    const { done } = await chrome.storage.session.get('done');
    const now = {};
    list.forEach(x => { now[x.hash] = x.progress >= 1; });
    if (done && cfg.notify) {
      const t = await loadT();
      list.filter(x => done[x.hash] === false && now[x.hash])
        .forEach(x => chrome.notifications.create({ type: 'basic', iconUrl: ICON, title: t('doneTitle'), message: x.name }));
    }
    await chrome.storage.session.set({ done: now });
  } catch {
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
    chrome.action.setBadgeText({ text: '!' });
  }
}
