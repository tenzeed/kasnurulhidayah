// api.js
// Wrapper pemanggilan API ke Google Apps Script.
// PENTING: Content-Type dipaksa "text/plain" agar browser mengirim "simple request"
// (tanpa preflight OPTIONS) karena Apps Script Web App tidak menangani preflight.

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

    const body = Object.assign({ action, token: getToken() }, params);

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
    } catch (networkErr) {
      throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    }

    let json;
    try {
      json = await res.json();
    } catch (parseErr) {
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
