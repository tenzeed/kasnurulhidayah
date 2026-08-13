// api.js
// Wrapper pemanggilan API ke Google Apps Script.
// PENTING: Semua request dikirim sebagai GET dengan parameter di URL (bukan POST dengan body).
// Ini SENGAJA, bukan kebetulan: Apps Script Web App merespons lewat redirect ke
// script.googleusercontent.com, dan pada beberapa kondisi jaringan/browser, request POST
// yang mengikuti redirect itu bisa gagal dibaca (muncul error 404 di URL "echo...").
// Request GET jauh lebih stabil melewati mekanisme redirect tersebut. Backend (Code.gs)
// sudah mendukung GET sejak awal lewat fallback e.parameter, jadi tidak perlu ubah backend.

const Api = (() => {
  function getToken() {
    return localStorage.getItem('knh_token') || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem('knh_token', token);
    else localStorage.removeItem('knh_token');
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('knh_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    if (user) localStorage.setItem('knh_user', JSON.stringify(user));
    else localStorage.removeItem('knh_user');
  }

  async function call(action, params = {}) {
    const url = window.APP_CONFIG.API_URL;
    if (!url || url.indexOf('PASTE_URL') !== -1) {
      throw new Error('URL API belum dikonfigurasi. Edit file js/config.js terlebih dahulu.');
    }

    const query = new URLSearchParams();
    query.set('action', action);
    query.set('token', getToken());

    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val === undefined || val === null) return;
      if (key === 'data' && typeof val === 'object') {
        query.set('data', JSON.stringify(val));
        // ANTI-DOBEL: kode unik dari ISI data yang dikirim (bukan waktu/acak), supaya kalau
        // request yang SAMA PERSIS terkirim ulang (baik otomatis oleh retry di bawah, maupun
        // manual karena user klik "Simpan" lagi), backend mengenali dan tidak membuat data
        // dobel. Lihat handleRequest_ di Code.gs.
        query.set('idempotency_key', simpleHash_(action + JSON.stringify(val)));
      } else {
        query.set(key, val);
      }
    });

    return callWithRetry_(url, query, 3);
  }

  function sleep_(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // RETRY OTOMATIS: Apps Script Web App kadang gagal mengirim balik respons ke browser
  // (redirect internal Google yang tidak stabil) meski datanya SUDAH tersimpan di server.
  // Daripada langsung menampilkan error, coba lagi otomatis beberapa kali dulu — aman
  // untuk request tambah/edit/hapus karena selalu membawa idempotency_key yang sama persis
  // di setiap percobaan, jadi tidak akan pernah membuat data dobel di server.
  async function callWithRetry_(url, query, attemptsLeft) {
    // Cache-buster per PERCOBAAN (bukan per aksi) — supaya browser tidak menyimpan cache
    // GET, tapi idempotency_key di atas tetap sama di setiap percobaan.
    query.set('_', Date.now().toString());

    let res;
    try {
      res = await fetch(`${url}?${query.toString()}`, { method: 'GET', cache: 'no-store' });
    } catch (networkErr) {
      if (attemptsLeft > 1) {
        await sleep_(1200);
        return callWithRetry_(url, query, attemptsLeft - 1);
      }
      throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    }

    let json;
    try {
      json = await res.json();
    } catch (parseErr) {
      if (attemptsLeft > 1) {
        await sleep_(1200);
        return callWithRetry_(url, query, attemptsLeft - 1);
      }
      throw new Error('Respons server tidak valid. Pastikan Web App sudah di-deploy dengan benar.');
    }

    if (!json.success) {
      const err = new Error(json.error || 'Terjadi kesalahan.');
      err.code = json.code;
      if (json.code === 'AUTH') {
        setToken(null);
        setUser(null);
      }
      throw err;
    }
    return json.data;
  }

  return {
    getToken, setToken, getUser, setUser, call,

    login: (username, password) => call('login', { username, password }),
    logout: () => call('logout', {}),

    getDashboard: (filter = {}) => call('getDashboard', filter),

    getKasMasuk: (filter = {}) => call('getKasMasuk', filter),
    addKasMasuk: (data) => call('addKasMasuk', { data }),
    editKasMasuk: (data) => call('editKasMasuk', { data }),
    deleteKasMasuk: (id) => call('deleteKasMasuk', { data: { id } }),

    getKasKeluar: (filter = {}) => call('getKasKeluar', filter),
    addKasKeluar: (data) => call('addKasKeluar', { data }),
    editKasKeluar: (data) => call('editKasKeluar', { data }),
    deleteKasKeluar: (id) => call('deleteKasKeluar', { data: { id } }),

    getLaporanBulanan: (bulan, tahun) => call('getLaporanBulanan', { bulan, tahun }),
    getRekapTahunan: (tahun) => call('getRekapTahunan', { tahun }),

    getHutang: (filter = {}) => call('getHutang', filter),
    addHutang: (data) => call('addHutang', { data }),
    getPembayaranHutang: (hutangId) => call('getPembayaranHutang', { hutang_id: hutangId }),
    addPembayaranHutang: (data) => call('addPembayaranHutang', { data }),

    getReceh: (filter = {}) => call('getReceh', filter),
    addRecehMasuk: (data) => call('addRecehMasuk', { data }),
    editRecehMasuk: (data) => call('editRecehMasuk', { data }),
    deleteRecehMasuk: (id) => call('deleteRecehMasuk', { data: { id } }),
    addRecehKeluar: (data) => call('addRecehKeluar', { data }),
    editRecehKeluar: (data) => call('editRecehKeluar', { data }),
    deleteRecehKeluar: (id) => call('deleteRecehKeluar', { data: { id } }),

    getAnggota: () => call('getAnggota', {}),
    addAnggota: (data) => call('addAnggota', { data }),
    editAnggota: (data) => call('editAnggota', { data }),
    deleteAnggota: (id) => call('deleteAnggota', { data: { id } })
  };
})();
