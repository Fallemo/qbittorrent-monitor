import { call, getCfg, setupRules } from './api.js';
import { loadT } from './i18n.js';

const $ = s => document.querySelector(s);
const t = await loadT();
document.querySelectorAll('[data-i]').forEach(e => { e.textContent = t(e.dataset.i); });

const F = ['url', 'user', 'pass', 'lang', 'refresh'];
const C = ['intercept', 'notify'];
const cfg = await getCfg();
F.forEach(k => { $('#' + k).value = cfg[k]; });
C.forEach(k => { $('#' + k).checked = cfg[k]; });

const say = (txt, cls = '') => { $('#status').textContent = txt; $('#status').className = cls; };

$('#save').onclick = async () => {
  const c = { ...cfg };
  F.forEach(k => { c[k] = $('#' + k).value; });
  C.forEach(k => { c[k] = $('#' + k).checked; });
  c.refresh = Math.min(30, Math.max(1, +c.refresh || 2));
  c.url = c.url.trim().replace(/\/+$/, '');

  let u;
  try { u = new URL(c.url); } catch { return say(t('o_badUrl'), 'err'); }
  // must run directly in the click handler (user gesture)
  const granted = await chrome.permissions.request({ origins: [`${u.protocol}//${u.hostname}/*`] });
  if (!granted) return say(t('o_noPerm'), 'err');

  await chrome.storage.local.set(c);
  await setupRules(c);
  try {
    const v = await call('app/version', null, c);
    say(`${t('o_saved')} ${t('o_connected')} ${v}`, 'ok');
  } catch (e) {
    say(e.code === 'login' ? t('o_failLogin')
      : e.status === 401 ? t('o_failCsrf')
      : e.status === 403 ? t('o_failBan')
      : `${t('o_failNet')}: ${e.message}`, 'err');
  }
};
