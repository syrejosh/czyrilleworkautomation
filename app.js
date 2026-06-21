// ── Czyrille's Automations — Shared App Utilities ──────

// Recents helpers (per day)
function getRecentsKey() {
  const today = new Date().toISOString().split('T')[0];
  return `ca_recents_${today}`;
}

function getRecents() {
  try { return JSON.parse(localStorage.getItem(getRecentsKey()) || '[]'); } catch { return []; }
}

function saveRecent(entry) {
  const list = getRecents();
  list.unshift(entry);
  const capped = list.slice(0, 20);
  localStorage.setItem(getRecentsKey(), JSON.stringify(capped));
}

// Date / time formatting
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// Toast system
function showToast(msg, type = '') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}
