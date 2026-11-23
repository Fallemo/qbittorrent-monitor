const D = {
  en: {
    all: 'All', downloading: 'Downloading', completed: 'Completed', stopped: 'Stopped', active: 'Active',
    search: 'Search…',
    sort_added_on: 'Date added', sort_name: 'Name', sort_dlspeed: 'Speed', sort_progress: 'Progress', sort_size: 'Size',
    add: 'Add torrent', addTitle: 'Add torrent', addHint: 'Magnet links or URLs, one per line', chooseFile: '.torrent files',
    category: 'Category', noCategory: '(no category)', savePath: 'Save path (default if empty)', startStopped: 'Add stopped',
    cancel: 'Cancel', send: 'Add', delTitle: 'Delete torrent?', del: 'Delete', delFiles: 'Delete + files', delete: 'Delete',
    stopAll: 'Stop all', startAll: 'Start all', altSpeed: 'Alternative speed limits', settings: 'Settings',
    noTorrents: 'No torrents', notConfigured: 'Not configured yet.', openSettings: 'Open settings',
    connErr: 'Connection error', free: 'Free', details: 'Details',
    stop: 'Stop', start: 'Start', top: 'Top priority', bottom: 'Lowest priority', up: 'Raise priority', down: 'Lower priority',
    force: 'Force start', recheck: 'Recheck',
    tab_info: 'Info', tab_files: 'Files', tab_trackers: 'Trackers', tab_peers: 'Peers',
    st_downloading: 'Downloading', st_stalled: 'Stalled', st_metadata: 'Fetching metadata', st_queued: 'Queued',
    st_checking: 'Checking', st_seeding: 'Seeding', st_stopped: 'Stopped', st_completed: 'Completed',
    st_error: 'Error', st_missing: 'Missing files', st_moving: 'Moving', st_unknown: 'Unknown',
    i_savePath: 'Save path', i_size: 'Size', i_downloaded: 'Downloaded', i_uploaded: 'Uploaded', i_ratio: 'Ratio',
    i_seeds: 'Seeds', i_peers: 'Peers', i_added: 'Added', i_done: 'Completed', i_category: 'Category', i_comment: 'Comment',
    c_name: 'Name', c_size: 'Size', c_prog: 'Done', c_prio: 'Priority', c_url: 'URL', c_status: 'Status', c_msg: 'Message',
    c_ip: 'IP', c_client: 'Client', skipped: 'skipped', more: 'more…',
    tr_0: 'Disabled', tr_1: 'Not contacted', tr_2: 'Working', tr_3: 'Updating', tr_4: 'Not working',
    // options
    o_title: 'qBittorrent Monitor – Settings', o_server: 'Server', o_url: 'WebUI address', o_user: 'Username', o_pass: 'Password',
    o_lang: 'Language', o_auto: 'Automatic', o_refresh: 'Refresh interval (seconds)',
    o_intercept: 'Send magnet / .torrent links to qBittorrent when clicked', o_notify: 'Notify when a download finishes',
    o_save: 'Save & test', o_saved: 'Saved.', o_connected: 'Connected, qBittorrent',
    o_failLogin: 'Wrong username or password.', o_failCsrf: 'Rejected by server (401). Check the address / CSRF settings.',
    o_failBan: 'Server refused (403) – IP banned after failed logins? Wait and retry.', o_failNet: 'Cannot reach server',
    o_noPerm: 'Permission to access the server was not granted.', o_badUrl: 'Invalid address.',
    ctxMenu: 'Send to qBittorrent', dropHere: 'Drop to add torrent', asFile: 'file', added: 'Added to qBittorrent', addFail: 'Could not add', doneTitle: 'Download complete'
  },
  ro: {
    all: 'Toate', downloading: 'Descarcă', completed: 'Finalizate', stopped: 'Oprite', active: 'Active',
    search: 'Caută…',
    sort_added_on: 'Data adăugării', sort_name: 'Nume', sort_dlspeed: 'Viteză', sort_progress: 'Progres', sort_size: 'Mărime',
    add: 'Adaugă torrent', addTitle: 'Adaugă torrent', addHint: 'Linkuri magnet sau URL-uri, unul pe linie', chooseFile: 'fișiere .torrent',
    category: 'Categorie', noCategory: '(fără categorie)', savePath: 'Folder salvare (implicit dacă e gol)', startStopped: 'Adaugă oprit',
    cancel: 'Anulează', send: 'Adaugă', delTitle: 'Ștergi torrentul?', del: 'Șterge', delFiles: 'Șterge + fișierele', delete: 'Șterge',
    stopAll: 'Oprește tot', startAll: 'Pornește tot', altSpeed: 'Limite de viteză alternative', settings: 'Setări',
    noTorrents: 'Niciun torrent', notConfigured: 'Încă nu e configurat.', openSettings: 'Deschide setările',
    connErr: 'Eroare de conexiune', free: 'Liber', details: 'Detalii',
    stop: 'Oprește', start: 'Pornește', top: 'Prioritate maximă', bottom: 'Prioritate minimă', up: 'Mărește prioritatea', down: 'Scade prioritatea',
    force: 'Forțează start', recheck: 'Reverifică',
    tab_info: 'Info', tab_files: 'Fișiere', tab_trackers: 'Trackere', tab_peers: 'Peers',
    st_downloading: 'Descarcă', st_stalled: 'Blocat', st_metadata: 'Descarc metadata', st_queued: 'În coadă',
    st_checking: 'Verificare', st_seeding: 'Seed', st_stopped: 'Oprit', st_completed: 'Finalizat',
    st_error: 'Eroare', st_missing: 'Fișiere lipsă', st_moving: 'Se mută', st_unknown: 'Necunoscut',
    i_savePath: 'Folder', i_size: 'Mărime', i_downloaded: 'Descărcat', i_uploaded: 'Încărcat', i_ratio: 'Ratio',
    i_seeds: 'Seeds', i_peers: 'Peers', i_added: 'Adăugat', i_done: 'Finalizat', i_category: 'Categorie', i_comment: 'Comentariu',
    c_name: 'Nume', c_size: 'Mărime', c_prog: 'Gata', c_prio: 'Prioritate', c_url: 'URL', c_status: 'Stare', c_msg: 'Mesaj',
    c_ip: 'IP', c_client: 'Client', skipped: 'sărit', more: 'încă…',
    tr_0: 'Dezactivat', tr_1: 'Necontactat', tr_2: 'Funcționează', tr_3: 'Se actualizează', tr_4: 'Nu funcționează',
    o_title: 'qBittorrent Monitor – Setări', o_server: 'Server', o_url: 'Adresa WebUI', o_user: 'Utilizator', o_pass: 'Parolă',
    o_lang: 'Limbă', o_auto: 'Automat', o_refresh: 'Interval reîmprospătare (secunde)',
    o_intercept: 'Trimite linkurile magnet / .torrent la qBittorrent când dau click', o_notify: 'Notifică la terminarea unei descărcări',
    o_save: 'Salvează & testează', o_saved: 'Salvat.', o_connected: 'Conectat, qBittorrent',
    o_failLogin: 'Utilizator sau parolă greșite.', o_failCsrf: 'Respins de server (401). Verifică adresa / setările CSRF.',
    o_failBan: 'Server a refuzat (403) – IP blocat după login-uri greșite? Așteaptă și reîncearcă.', o_failNet: 'Nu pot ajunge la server',
    o_noPerm: 'Permisiunea de acces la server nu a fost acordată.', o_badUrl: 'Adresă invalidă.',
    ctxMenu: 'Trimite la qBittorrent', dropHere: 'Lasă aici ca să adaugi torrentul', asFile: 'fișier', added: 'Adăugat în qBittorrent', addFail: 'Nu am putut adăuga', doneTitle: 'Descărcare finalizată'
  }
};

export async function loadT() {
  const { lang = 'auto' } = await chrome.storage.local.get('lang');
  const l = lang === 'auto' ? (navigator.language.startsWith('ro') ? 'ro' : 'en') : lang;
  return k => D[l]?.[k] ?? D.en[k] ?? k;
}
