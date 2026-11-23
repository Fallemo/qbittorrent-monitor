export const bytes = n => {
  if (!n || n < 1) return '0 B';
  const i = Math.min(4, Math.floor(Math.log(n) / Math.log(1024)));
  return (n / 1024 ** i).toFixed(i ? 1 : 0) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
};
export const speed = n => bytes(n) + '/s';
export const eta = s => {
  if (s >= 8640000 || s < 0) return '∞';
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
};
// floor so 99.97% never shows as 100%
export const pct = p => (Math.floor(p * 1000) / 10) + '%';
export const date = ts => ts > 0 ? new Date(ts * 1000).toLocaleString() : '-';

export const DL = new Set(['downloading', 'stalledDL', 'metaDL', 'forcedMetaDL', 'queuedDL', 'checkingDL', 'forcedDL', 'allocating']);

export const match = (x, f) =>
  f === 'all' ||
  (f === 'downloading' && DL.has(x.state)) ||
  (f === 'completed' && x.progress >= 1) ||
  (f === 'stopped' && x.state.startsWith('stopped')) ||
  (f === 'active' && (x.dlspeed > 0 || x.upspeed > 0));

// qBittorrent state -> i18n key suffix (st_<key>)
const SK = {
  downloading: 'downloading', forcedDL: 'downloading', allocating: 'checking',
  stalledDL: 'stalled', metaDL: 'metadata', forcedMetaDL: 'metadata',
  queuedDL: 'queued', queuedUP: 'queued',
  checkingDL: 'checking', checkingUP: 'checking', checkingResumeData: 'checking',
  uploading: 'seeding', forcedUP: 'seeding', stalledUP: 'seeding',
  stoppedDL: 'stopped', stoppedUP: 'completed',
  error: 'error', missingFiles: 'missing', moving: 'moving'
};
export const stateKey = s => SK[s] || 'unknown';
