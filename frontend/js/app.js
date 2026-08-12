// app.js — bootstrap aplikasi, autentikasi, dan router sederhana berbasis hash.

const NAV_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  kas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="6" width="19.6" height="13.5" rx="2.6"/><path d="M2.2 9.8h19.6"/><circle cx="16.6" cy="14.3" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  hutang: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z"/><path d="M9 8.5h6M9 12.5h6M9 16.5h3.5"/></svg>`,
  receh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8.5" r="6"/><circle cx="15.5" cy="15.5" r="6"/></svg>`,
  laporan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6M9 17h6"/></svg>`,
  anggota: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>`
};

const ROUTES = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'anggota'] },
  { key: 'kas', label: 'Kas', icon: 'kas', roles: ['admin', 'anggota'] },
  { key: 'hutang', label: 'Hutang', icon: 'hutang', roles: ['admin', 'anggota'] },
  { key: 'receh', label: 'Receh', icon: 'receh', roles: ['admin', 'anggota'] },
  { key: 'laporan', label: 'Laporan', icon: 'laporan', roles: ['admin', 'anggota'] },
  { key: 'anggota', label: 'Akun', icon: 'anggota', roles: ['admin'] }
];

const state = {
  user: null,
  route: 'dashboard',
  theme: localStorage.getItem('knh_theme') || 'light'
};

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
}

function currentRoutesForRole(role) {
  return ROUTES.filter((r) => r.roles.includes(role));
}

// ---------------- LOGIN SCREEN ----------------
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-screen">
      <svg class="login-motif m1" viewBox="0 0 100 100"><path d="M50 5 61 39 95 39 68 60 79 95 50 74 21 95 32 60 5 39 39 39Z" fill="currentColor"/></svg>
      <svg class="login-motif m2" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      <div class="login-card">
        <div class="login-brand">
          <div class="login-brand-mark">NH</div>
          <h1 class="brand-font">${window.APP_CONFIG.APP_NAME}</h1>
          <p>Masuk untuk mengelola atau melihat laporan keuangan kas.</p>
        </div>
        <form id="loginForm">
          <div class="field" data-field="username">
            <label>Username</label>
            <input type="text" name="username" autocomplete="username" required />
          </div>
          <div class="field" data-field="password">
            <label>Password</label>
            <input type="password" name="password" autocomplete="current-password" required />
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="loginSubmitBtn">Masuk</button>
        </form>
        <div class="login-demo-note">
          Login pertama kali sebagai Admin menggunakan akun default yang dibuat saat setup
          (lihat <strong>SETUP_GUIDE.md</strong>). Segera ganti password setelah masuk.
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginSubmitBtn');
    const fd = new FormData(form);
    const username = fd.get('username');
    const password = fd.get('password');
    btn.disabled = true;
    btn.textContent = 'Memeriksa...';
    try {
      const data = await Api.login(username, password);
      Api.setToken(data.token);
      Api.setUser(data.user);
      state.user = data.user;
      showToast(`Selamat datang, ${data.user.nama}!`);
      boot();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Masuk';
      showToast(err.message, 'error');
    }
  });
}

// ---------------- APP SHELL ----------------
function renderShell() {
  const routes = currentRoutesForRole(state.user.role);
  document.getElementById('app').innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-mark">NH</div>
        <div class="sidebar-brand-text">${window.APP_CONFIG.APP_NAME}<small>Manajemen Kas Digital</small></div>
      </div>
      <nav class="sidebar-nav" id="sidebarNav"></nav>
      <div class="sidebar-foot">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${initials(state.user.nama)}</div>
          <div class="sidebar-user-info">
            <div class="name">${escapeHtml(state.user.nama)}</div>
            <div class="role">${state.user.role === 'admin' ? 'Administrator' : 'Anggota'}</div>
          </div>
        </div>
        <button class="nav-item" id="btnLogout">${NAV_ICONS.logout}<span>Keluar</span></button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-title" id="topbarTitle">Dashboard</div>
        <div class="topbar-actions">
          <button class="icon-btn" id="btnTheme" title="Ganti tema">${state.theme === 'dark' ? NAV_ICONS.sun : NAV_ICONS.moon}</button>
          <button class="icon-btn" id="btnLogoutTop" title="Keluar">${Icons.logout}</button>
        </div>
      </header>
      <main class="content" id="content"></main>
    </div>

    <nav class="bottom-nav">
      <div class="bottom-nav-inner" id="bottomNav"></div>
    </nav>
  `;

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = routes.map((r) => `
    <button class="nav-item" data-route="${r.key}">${NAV_ICONS[r.icon]}<span>${r.label}</span></button>
  `).join('');
  nav.querySelectorAll('.nav-item').forEach((btn) => {
    btn.onclick = () => navigate(btn.dataset.route);
  });

  const bnav = document.getElementById('bottomNav');
  bnav.innerHTML = routes.map((r) => `
    <button class="bottom-nav-item" data-route="${r.key}" aria-label="${r.label}">
      <span class="bottom-nav-icon">${NAV_ICONS[r.icon]}</span>
      <span class="bottom-nav-label">${r.label}</span>
    </button>
  `).join('');
  bnav.querySelectorAll('.bottom-nav-item').forEach((btn) => {
    btn.onclick = () => navigate(btn.dataset.route);
  });

  document.getElementById('btnLogout').onclick = doLogout;
  document.getElementById('btnLogoutTop').onclick = doLogout;

  async function doLogout() {
    const okLogout = await showConfirm({ title: 'Keluar dari aplikasi?', message: 'Anda perlu login kembali untuk mengakses data.', confirmLabel: 'Keluar', danger: false });
    if (!okLogout) return;
    try { await Api.logout(); } catch (e) { /* ignore */ }
    Api.setToken(null);
    Api.setUser(null);
    state.user = null;
    renderLogin();
  }

  document.getElementById('btnTheme').onclick = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('knh_theme', state.theme);
    applyTheme();
    document.getElementById('btnTheme').innerHTML = state.theme === 'dark' ? NAV_ICONS.sun : NAV_ICONS.moon;
  };

  navigate(routes.some((r) => r.key === state.route) ? state.route : 'dashboard');
}

function navigate(routeKey) {
  const route = ROUTES.find((r) => r.key === routeKey);
  if (!route || !route.roles.includes(state.user.role)) routeKey = 'dashboard';
  state.route = routeKey;
  window.location.hash = routeKey;

  document.querySelectorAll('.nav-item[data-route], .bottom-nav-item[data-route]').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === routeKey);
  });
  const activeRoute = ROUTES.find((r) => r.key === routeKey);
  document.getElementById('topbarTitle').textContent = activeRoute.label;

  const content = document.getElementById('content');
  // Reset lalu picu ulang animasi fade-masuk pada container halaman (trik reflow),
  // supaya transisi halus terjadi setiap kali berpindah menu, bukan cuma sekali di awal.
  content.style.animation = 'none';
  content.innerHTML = loadingStateHtml('Memuat halaman...');
  void content.offsetWidth; // force reflow
  content.style.animation = '';

  const viewFn = window.Views[routeKey];
  if (typeof viewFn === 'function') {
    viewFn(content, { user: state.user }).catch((err) => {
      content.innerHTML = `<div class="card empty-state">${escapeHtml(err.message || 'Terjadi kesalahan.')}</div>`;
    });
  } else {
    content.innerHTML = `<div class="card empty-state">Halaman belum tersedia.</div>`;
  }
}

// ---------------- BOOT ----------------
function boot() {
  applyTheme();
  const token = Api.getToken();
  const user = Api.getUser();
  if (token && user) {
    state.user = user;
    const hashRoute = window.location.hash.replace('#', '');
    if (hashRoute) state.route = hashRoute;
    renderShell();
  } else {
    renderLogin();
  }
}

document.addEventListener('DOMContentLoaded', boot);
