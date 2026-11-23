import { getCfg } from './api.js';
import { loadT } from './i18n.js';

const cfg = await getCfg();
if (cfg.url) {
  await import('./main.js');
} else {
  const t = await loadT();
  const e = document.querySelector('#empty');
  const b = document.createElement('button');
  b.className = 'primary'; b.textContent = t('openSettings');
  b.onclick = () => chrome.runtime.openOptionsPage();
  const p = document.createElement('p'); p.textContent = t('notConfigured');
  e.hidden = false; e.append(p, b);
}
