/**
 * Code.gs
 * Entry point Web App. Semua request (GET & POST) masuk lewat sini dan
 * di-routing berdasarkan field "action" pada payload.
 *
 * PENTING - CARA MEMANGGIL API DARI FRONTEND:
 * Kirim POST dengan Content-Type "text/plain;charset=utf-8" (BUKAN application/json)
 * berisi JSON.stringify({ action, token, data, ... }). Ini untuk menghindari
 * CORS preflight (OPTIONS) yang tidak didukung Apps Script Web App.
 * Lihat contoh di frontend/js/api.js.
 */

var ACTIONS = {
  // Auth
  login: action_login_,
  logout: action_logout_,

  // Dashboard
  getDashboard: action_getDashboard_,

  // Kas Masuk
  getKasMasuk: action_getKasMasuk_,
  addKasMasuk: action_addKasMasuk_,
  editKasMasuk: action_editKasMasuk_,
  deleteKasMasuk: action_deleteKasMasuk_,

  // Kas Keluar
  getKasKeluar: action_getKasKeluar_,
  addKasKeluar: action_addKasKeluar_,
  editKasKeluar: action_editKasKeluar_,
  deleteKasKeluar: action_deleteKasKeluar_,

  // Laporan
  getLaporanBulanan: action_getLaporanBulanan_,
  getRekapTahunan: action_getRekapTahunan_,

  // Hutang
  getHutang: action_getHutang_,
  addHutang: action_addHutang_,
  getPembayaranHutang: action_getPembayaranHutang_,
  addPembayaranHutang: action_addPembayaranHutang_,

  // Uang Receh / Jajan
  getReceh: action_getReceh_,
  addRecehMasuk: action_addRecehMasuk_,
  editRecehMasuk: action_editRecehMasuk_,
  deleteRecehMasuk: action_deleteRecehMasuk_,
  addRecehKeluar: action_addRecehKeluar_,
  editRecehKeluar: action_editRecehKeluar_,
  deleteRecehKeluar: action_deleteRecehKeluar_,

  // Anggota / akun
  getAnggota: action_getAnggota_,
  addAnggota: action_addAnggota_,
  editAnggota: action_editAnggota_,
  deleteAnggota: action_deleteAnggota_
};

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  // doGet disediakan untuk kemudahan tes manual via browser (?action=...&token=...)
  // Produksi tetap disarankan pakai POST.
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var payload = parsePayload_(e);
    var action = payload.action;

    if (!action) {
      return fail_('Parameter "action" wajib diisi.', 'VALIDATION');
    }
    if (!ACTIONS.hasOwnProperty(action)) {
      return fail_('Action "' + action + '" tidak dikenali.', 'UNKNOWN_ACTION');
    }

    return ACTIONS[action](payload);
  } catch (err) {
    if (err && err.name === 'AuthError') {
      return fail_(err.message, 'AUTH');
    }
    return fail_(err && err.message ? err.message : String(err), 'SERVER_ERROR');
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      throw new Error('Body request bukan JSON yang valid.');
    }
  }
  // Fallback ke query parameter (dipakai saat doGet / testing manual)
  var params = (e && e.parameter) ? e.parameter : {};
  var payload = {};
  Object.keys(params).forEach(function (k) {
    if (k === 'data') {
      try { payload.data = JSON.parse(params.data); } catch (err) { payload.data = {}; }
    } else {
      payload[k] = params[k];
    }
  });
  return payload;
}
