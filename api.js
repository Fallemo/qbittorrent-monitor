const DEF = { url: '', user: '', pass: '', lang: 'auto', refresh: 2, intercept: true, notify: true };

export const getCfg = () => chrome.storage.local.get(DEF);
export const baseOf = c => c.url.trim().replace(/\/+$/, '');

// qBittorrent's CSRF protection rejects Origin: chrome-extension://… ; rewrite Origin/Referer
// to the server's own for our API calls so the WebUI settings can stay untouched.
export async function setupRules(cfg) {
  const b = baseOf(cfg);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: b ? [{
      id: 1, priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'origin', operation: 'set', value: new URL(b).origin },
          { header: 'referer', operation: 'set', value: b + '/' }
        ]
      },
      condition: { urlFilter: '|' + b + '/api/', resourceTypes: ['xmlhttprequest'] }
    }] : []
  });
}

const raw = (cfg, path, body) => fetch(baseOf(cfg) + '/api/v2/' + path, {
  method: body == null ? 'GET' : 'POST', body, credentials: 'include', cache: 'no-store'
});
const httpErr = r => Object.assign(new Error('HTTP ' + r.status), { status: r.status });

export async function login(cfg) {
  const r = await raw(cfg, 'auth/login', new URLSearchParams({ username: cfg.user, password: cfg.pass }));
  if (r.status !== 200) throw httpErr(r);
  if ((await r.text()).trim() !== 'Ok.') throw Object.assign(new Error('login'), { code: 'login' });
}

// path may include a query string; body (URLSearchParams/FormData) makes it a POST.
export async function call(path, body, cfg) {
  cfg ??= await getCfg();
  let r = await raw(cfg, path, body);
  if (r.status === 403) { await login(cfg); r = await raw(cfg, path, body); } // session expired
  if (!r.ok) throw httpErr(r);
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function add({ urls, files = [], category, savepath, stopped }) {
  const f = new FormData();
  if (urls) f.set('urls', urls);
  files.forEach(x => f.append('torrents', x, x.name));
  if (category) f.set('category', category);
  if (savepath) f.set('savepath', savepath);
  if (stopped) { f.set('stopped', 'true'); f.set('paused', 'true'); } // v5 = stopped, v4 = paused
  const r = await call('torrents/add', f);
  if ((typeof r === 'string' && /fail/i.test(r)) || (r && r.success_count === 0 && r.failure_count > 0))
    throw new Error('qBittorrent: add failed');
}
