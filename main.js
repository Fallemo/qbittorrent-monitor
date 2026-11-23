import { call, getCfg, add } from './api.js';
import { loadT } from './i18n.js';
import { bytes, speed, eta, pct, date, match, stateKey } from './util.js';

const t = await loadT();
const cfg = await getCfg();
const $ = s => document.querySelector(s);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};
const post = (p, o) => call(p, new URLSearchParams(o));
const stopped = x => x.state.startsWith('stopped');

document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });
document.querySelectorAll('[data-p]').forEach(e => { e.placeholder = t(e.dataset.p); });
document.querySelectorAll('[data-t]').forEach(e => { e.title = t(e.dataset.t); });
$('#gear').onclick = () => chrome.runtime.openOptionsPage();

let T = {}, S = {}, rid = 0, timer;
let filter = 'all', key = 'added_on', dir = -1, q = '';
let open = null, tab = 'info';
const rows = new Map();
const list = $('#list');

// ---------- helpers ----------
let toastTimer;
function toast(txt) {
  const e = $('#toast'); e.textContent = txt; e.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { e.hidden = true; }, 2500);
}
const refresh = () => { clearTimeout(timer); tick(); };
// Run a server command; afterwards force a full resync so any optimistic UI change is
// confirmed or reverted by the real server state.
async function act(fn) {
  try { await fn(); } catch (e) { toast(e.message); }
  rid = 0; refresh();
}
// Optimistic: show the new state immediately, the resync corrects it if the server disagrees.
function setStopped(x, stp) {
  const up = x.progress >= 1;
  x.state = stp ? (up ? 'stoppedUP' : 'stoppedDL') : (up ? 'queuedUP' : 'queuedDL');
  if (stp) { x.dlspeed = 0; x.upspeed = 0; }
}

// ---------- toolbar ----------
const FILTERS = ['all', 'downloading', 'completed', 'stopped', 'active'];
const fb = {};
FILTERS.forEach(f => {
  const b = el('button', f === filter ? 'on' : '', t(f));
  const c = el('small', '', '0'); b.append(c);
  b.onclick = () => { filter = f; FILTERS.forEach(g => fb[g].b.classList.toggle('on', g === f)); render(); };
  fb[f] = { b, c };
  $('#filters').append(b);
});
['added_on', 'name', 'dlspeed', 'progress', 'size'].forEach(k => {
  const o = el('option', '', t('sort_' + k)); o.value = k; $('#sort').append(o);
});
$('#sort').onchange = e => { key = e.target.value; render(); };
$('#dir').onclick = () => { dir = -dir; $('#dir').textContent = dir > 0 ? '↑' : '↓'; render(); };
$('#q').oninput = e => { q = e.target.value.toLowerCase(); render(); };
$('#alt').onclick = () => act(() => post('transfer/toggleSpeedLimitsMode', {}));
const all = stp => { Object.values(T).forEach(x => setStopped(x, stp)); render(); act(() => post('torrents/' + (stp ? 'stop' : 'start'), { hashes: 'all' })); };
$('#stopAll').onclick = () => all(true);
$('#startAll').onclick = () => all(false);

// ---------- rows ----------
function mk(h) {
  const r = el('div', 't');
  const name = el('span', 'name'), pc = el('span', 'pct');
  const bt = el('button', 'ic'), bd = el('button', 'ic', '🗑');
  bd.title = t('delete');
  const fill = el('i'); const bar = el('div', 'bar'); bar.append(fill);
  const st = el('span'), sz = el('span'), sp = el('span', 'sp'), et = el('span');
  const meta = el('div', 'meta'); meta.append(st, sz, sp, et);
  const top = el('div', 'top'); top.append(name, pc, bt, bd);
  const det = el('div', 'det'); det.hidden = true;
  r.append(top, bar, meta, det);
  bt.onclick = () => {
    const stp = !stopped(T[h]);
    setStopped(T[h], stp); render();
    act(() => post('torrents/' + (stp ? 'stop' : 'start'), { hashes: h }));
  };
  bd.onclick = () => askDel(h);
  r.onclick = e => { if (!e.target.closest('button, .det')) toggle(h); };
  r.$ = { name, pc, bt, fill, st, sz, sp, et, det };
  return r;
}

function upd(r, x) {
  const s = r.$, stp = stopped(x);
  s.name.textContent = x.name; s.name.title = x.name;
  s.pc.textContent = pct(x.progress);
  s.fill.style.width = pct(x.progress);
  s.fill.className = x.state === 'error' || x.state === 'missingFiles' ? 'err' : stp ? 'idle' : x.progress >= 1 ? 'done' : '';
  s.bt.textContent = stp ? '▶' : '⏸'; s.bt.title = t(stp ? 'start' : 'stop');
  s.st.textContent = t('st_' + stateKey(x.state));
  s.sz.textContent = x.progress >= 1 ? bytes(x.size) : `${bytes(x.size * x.progress)} / ${bytes(x.size)}`;
  s.sp.textContent = [x.dlspeed > 0 && '↓ ' + speed(x.dlspeed), x.upspeed > 0 && '↑ ' + speed(x.upspeed)].filter(Boolean).join('  ');
  s.et.textContent = x.progress < 1 && x.dlspeed > 0 ? 'ETA ' + eta(x.eta) : 'ratio ' + x.ratio.toFixed(2);
}

function render() {
  $('#dl').textContent = '↓ ' + speed(S.dl_info_speed || 0);
  $('#ul').textContent = '↑ ' + speed(S.up_info_speed || 0);
  $('#free').textContent = t('free') + ' ' + bytes(S.free_space_on_disk || 0);
  $('#alt').classList.toggle('on', !!S.use_alt_speed_limits);

  const all = Object.values(T);
  FILTERS.forEach(f => { fb[f].c.textContent = all.filter(x => match(x, f)).length; });

  const view = all.filter(x => match(x, filter) && (!q || x.name.toLowerCase().includes(q)));
  view.sort((a, b) => (key === 'name' ? a.name.localeCompare(b.name) : a[key] - b[key]) * dir);

  const seen = new Set();
  view.forEach((x, i) => {
    let r = rows.get(x.hash);
    if (!r) { r = mk(x.hash); rows.set(x.hash, r); }
    upd(r, x); seen.add(x.hash);
    if (list.children[i] !== r) list.insertBefore(r, list.children[i] || null);
  });
  for (const [h, r] of rows) if (!seen.has(h)) { r.remove(); if (!T[h]) rows.delete(h); }

  $('#empty').hidden = view.length > 0;
  $('#empty').textContent = t('noTorrents');
}

// ---------- details ----------
function toggle(h) {
  if (open && rows.get(open)) {
    const p = rows.get(open); p.$.det.hidden = true; p.$.det.replaceChildren(); p.classList.remove('open');
  }
  if (open === h) { open = null; return; }
  open = h;
  const r = rows.get(h);
  r.classList.add('open'); r.$.det.hidden = false;
  buildDet(r, h);
}

function buildDet(r, h) {
  const d = r.$.det; d.replaceChildren();
  const acts = el('div', 'acts');
  [['top', 'topPrio', '⏫'], ['bottom', 'bottomPrio', '⏬'], ['up', 'increasePrio', '🔼'], ['down', 'decreasePrio', '🔽'],
   ['force', 'setForceStart', '⚡'], ['recheck', 'recheck', '🔄']].forEach(([k, ep, ic]) => {
    const b = el('button', '', ic); b.title = t(k);
    b.onclick = () => act(() => post('torrents/' + ep, ep === 'setForceStart' ? { hashes: h, value: 'true' } : { hashes: h }));
    acts.append(b);
  });
  const tabs = el('div', 'tabs');
  ['info', 'files', 'trackers', 'peers'].forEach(k => {
    const b = el('button', k === tab ? 'on' : '', t('tab_' + k));
    b.onclick = () => { tab = k; [...tabs.children].forEach(c => c.classList.toggle('on', c === b)); loadTab(); };
    tabs.append(b);
  });
  d.append(acts, tabs, el('div', 'dbody'));
  loadTab();
}

function tbl(head, data) {
  const tb = el('table');
  if (head) { const tr = el('tr'); head.forEach(x => tr.append(el('th', '', x))); tb.append(tr); }
  data.forEach(row => { const tr = el('tr'); row.forEach(x => tr.append(el('td', '', String(x)))); tb.append(tr); });
  return tb;
}
const CAP = 200;

async function loadTab() {
  const h = open, tb = tab, r = rows.get(h);
  const body = r?.$.det.querySelector('.dbody');
  if (!body) return;
  try {
    let node;
    if (tb === 'info') {
      const p = await call('torrents/properties?hash=' + h);
      const x = T[h] || {};
      node = tbl(null, [
        [t('i_savePath'), p.save_path], [t('i_size'), bytes(p.total_size)],
        [t('i_downloaded'), bytes(p.total_downloaded)], [t('i_uploaded'), bytes(p.total_uploaded)],
        [t('i_ratio'), (p.share_ratio || 0).toFixed(2)],
        [t('i_seeds'), `${p.seeds} (${p.seeds_total})`], [t('i_peers'), `${p.peers} (${p.peers_total})`],
        [t('i_added'), date(p.addition_date)], [t('i_done'), date(p.completion_date)],
        [t('i_category'), x.category || '-'], [t('i_comment'), p.comment || '-']
      ]);
    } else if (tb === 'files') {
      const f = await call('torrents/files?hash=' + h);
      node = tbl([t('c_name'), t('c_size'), t('c_prog'), t('c_prio')],
        f.slice(0, CAP).map(x => [x.name, bytes(x.size), pct(x.progress), x.priority === 0 ? t('skipped') : x.priority]));
      if (f.length > CAP) node.append(el('caption', '', `+${f.length - CAP} ${t('more')}`));
    } else if (tb === 'trackers') {
      const f = await call('torrents/trackers?hash=' + h);
      node = tbl([t('c_url'), t('c_status'), 'S/P', t('c_msg')],
        f.filter(x => x.tier >= 0 || x.url.startsWith('http') || x.url.startsWith('udp'))
          .map(x => [x.url, t('tr_' + x.status), `${x.num_seeds}/${x.num_peers}`, x.msg]));
    } else {
      const d = await call('sync/torrentPeers?hash=' + h + '&rid=0');
      node = tbl([t('c_ip'), t('c_client'), t('c_prog'), '↓', '↑'],
        Object.entries(d.peers || {}).slice(0, CAP)
          .map(([ip, p]) => [ip, p.client || '', pct(p.progress), speed(p.dl_speed), speed(p.up_speed)]));
    }
    if (open !== h || tab !== tb) return; // user moved on while we were fetching
    const top = body.scrollTop;
    body.replaceChildren(node);
    body.scrollTop = top;
  } catch { /* transient; next tick retries */ }
}

// ---------- delete ----------
let delHash = null;
function askDel(h) {
  delHash = h; $('#delName').textContent = T[h]?.name || h; $('#delD').showModal();
}
$('#delCancel').onclick = () => $('#delD').close();
const doDel = files => { $('#delD').close(); delete T[delHash]; render(); act(() => post('torrents/delete', { hashes: delHash, deleteFiles: files })); };
$('#delOnly').onclick = () => doDel(false);
$('#delAll').onclick = () => doDel(true);

// ---------- add ----------
$('#addBtn').onclick = async () => {
  $('#aErr').textContent = '';
  const sel = $('#aCat'); sel.replaceChildren();
  const none = el('option', '', t('noCategory')); none.value = ''; sel.append(none);
  try {
    Object.keys(await call('torrents/categories')).sort().forEach(c => { const o = el('option', '', c); o.value = c; sel.append(o); });
  } catch { /* category list is optional */ }
  $('#addD').showModal();
};
$('#aCancel').onclick = () => $('#addD').close();
$('#aOk').onclick = async () => {
  const urls = $('#aUrls').value.trim(), files = [...$('#aFiles').files];
  if (!urls && !files.length) return;
  try {
    await add({ urls, files, category: $('#aCat').value, savepath: $('#aPath').value.trim(), stopped: $('#aStop').checked });
    $('#aUrls').value = ''; $('#aFiles').value = '';
    $('#addD').close(); refresh(); toast(t('added'));
  } catch (e) { $('#aErr').textContent = e.message; }
};

// drag & drop .torrent files or magnet text straight onto the popup
// counter because dragenter/dragleave also fire for every child element
let dragDepth = 0;
const dropBox = $('#drop');
document.ondragenter = () => { dragDepth++; dropBox.hidden = false; };
document.ondragleave = () => { if (--dragDepth <= 0) { dragDepth = 0; dropBox.hidden = true; } };
document.ondragover = e => e.preventDefault();
document.ondrop = async e => {
  e.preventDefault();
  dragDepth = 0; dropBox.hidden = true;
  const files = [...e.dataTransfer.files].filter(f => f.name.endsWith('.torrent'));
  const txt = e.dataTransfer.getData('text').trim();
  if (!files.length && !/^(magnet:|https?:)/i.test(txt)) return;
  try { await add({ files, urls: files.length ? '' : txt }); refresh(); toast(t('added')); } catch (err) { toast(err.message); }
};

// ---------- polling ----------
async function tick() {
  try {
    const d = await call('sync/maindata?rid=' + rid);
    if (d.full_update) { T = {}; S = {}; }
    rid = d.rid;
    for (const [h, v] of Object.entries(d.torrents || {})) T[h] = { ...T[h], hash: h, ...v };
    (d.torrents_removed || []).forEach(h => delete T[h]);
    Object.assign(S, d.server_state);
    $('#err').hidden = true;
    render();
    // keep the toolbar badge in sync while the popup is open (same rule as background.js)
    const n = Object.values(T).filter(x => match(x, 'downloading')).length, total = Object.keys(T).length;
    chrome.action.setBadgeBackgroundColor({ color: n ? '#2563eb' : '#6b7280' });
    chrome.action.setBadgeText({ text: total ? String(total) : '' });
    if (open) loadTab();
  } catch (e) {
    $('#err').textContent = `${t('connErr')}: ${e.message}`; $('#err').hidden = false;
    rid = 0;
  }
  timer = setTimeout(tick, cfg.refresh * 1000);
}
tick();
