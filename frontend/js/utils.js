// utils.js

const BULAN_NAMA = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_SINGKAT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatRupiah(n) {
  const num = Number(n) || 0;
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

function formatRupiahSigned(n) {
  const num = Number(n) || 0;
  const sign = num < 0 ? '-' : '+';
  return sign + formatRupiah(Math.abs(num));
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.getDate() + ' ' + BULAN_SINGKAT[d.getMonth() + 1] + ' ' + d.getFullYear();
}

function formatTanggalPanjang(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.getDate() + ' ' + BULAN_NAMA[d.getMonth() + 1] + ' ' + d.getFullYear();
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function currentMonth() { return new Date().getMonth() + 1; }
function currentYear() { return new Date().getFullYear(); }

function yearOptions(range = 10) {
  const y = currentYear();
  const arr = [];
  for (let i = 0; i < range; i++) arr.push(y - i);
  return arr;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Animasi hitung naik halus untuk angka KPI
function animateCountUp(el, target, opts = {}) {
  const duration = opts.duration || 900;
  const formatter = opts.formatter || formatRupiah;
  const startVal = 0;
  const startTime = performance.now();

  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = startVal + (target - startVal) * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = formatter(target);
  }
  requestAnimationFrame(tick);
}

function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

// Memberi jeda animasi masuk yang bertahap (cascade) pada elemen list/tabel
// supaya tidak semua baris muncul bersamaan sekaligus — kesan lebih halus & modern.
function staggerFadeIn(container, selector, baseDelay = 0.035, max = 14) {
  if (!container) return;
  const items = container.querySelectorAll(selector);
  items.forEach((el, i) => {
    el.style.animationDelay = (Math.min(i, max) * baseDelay).toFixed(3) + 's';
  });
}

// Hash non-kriptografis sederhana (FNV-1a-like) — dipakai untuk membuat idempotency key
// dari isi request, supaya percobaan kirim ulang dengan data PERSIS SAMA bisa dikenali backend.
function simpleHash_(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return 'h' + (hash >>> 0).toString(36);
}
