/**
 * Kas.gs
 * CRUD untuk Kas Masuk dan Kas Keluar.
 */

var KATEGORI_PENGELUARAN = ['Konsumsi', 'Transportasi', 'Peralatan', 'Operasional', 'Piutang Anggota', 'Lainnya'];

// ---------------- KAS MASUK ----------------
function action_getKasMasuk_(payload) {
  requireAuth_(payload.token);
  var items = sheetToObjects_(getSheet_('Kas_Masuk'));
  items = filterByPeriode_(items, payload);
  items.sort(sortByTanggalDesc_);
  return ok_(items);
}

function action_addKasMasuk_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.keterangan) return fail_('Keterangan wajib diisi.', 'VALIDATION');
  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  var nominal = toNumber_(d.nominal);

  var obj = {
    id: generateId_('KM'),
    tanggal: periode.tanggal,
    bulan: periode.bulan,
    tahun: periode.tahun,
    keterangan: d.keterangan,
    sumber: d.sumber || '',
    nominal: nominal,
    catatan: d.catatan || '',
    created_at: new Date(),
    created_by: session.username
  };
  appendObjectRow_(getSheet_('Kas_Masuk'), obj);
  return ok_(obj);
}

function action_editKasMasuk_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.id) return fail_('ID transaksi wajib diisi.', 'VALIDATION');
  var sheet = getSheet_('Kas_Masuk');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Transaksi tidak ditemukan.', 'NOT_FOUND');

  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  var update = {
    tanggal: periode.tanggal,
    bulan: periode.bulan,
    tahun: periode.tahun,
    keterangan: d.keterangan,
    sumber: d.sumber || '',
    nominal: toNumber_(d.nominal),
    catatan: d.catatan || ''
  };
  updateObjectRow_(sheet, rowIndex, update);
  return ok_({ id: d.id, updated: true });
}

function action_deleteKasMasuk_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Kas_Masuk');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Transaksi tidak ditemukan.', 'NOT_FOUND');
  sheet.deleteRow(rowIndex);
  return ok_({ id: d.id, deleted: true });
}

// ---------------- KAS KELUAR ----------------
function action_getKasKeluar_(payload) {
  requireAuth_(payload.token);
  var items = sheetToObjects_(getSheet_('Kas_Keluar'));
  items = filterByPeriode_(items, payload);
  items.sort(sortByTanggalDesc_);
  return ok_(items);
}

function action_addKasKeluar_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.keterangan) return fail_('Keterangan wajib diisi.', 'VALIDATION');
  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  var nominal = toNumber_(d.nominal);
  var kategori = d.kategori || 'Lainnya';

  var obj = {
    id: generateId_('KK'),
    tanggal: periode.tanggal,
    bulan: periode.bulan,
    tahun: periode.tahun,
    keterangan: d.keterangan,
    kategori: kategori,
    nominal: nominal,
    catatan: d.catatan || '',
    created_at: new Date(),
    created_by: session.username
  };
  appendObjectRow_(getSheet_('Kas_Keluar'), obj);
  return ok_(obj);
}

function action_editKasKeluar_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.id) return fail_('ID transaksi wajib diisi.', 'VALIDATION');
  var sheet = getSheet_('Kas_Keluar');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Transaksi tidak ditemukan.', 'NOT_FOUND');

  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  var update = {
    tanggal: periode.tanggal,
    bulan: periode.bulan,
    tahun: periode.tahun,
    keterangan: d.keterangan,
    kategori: d.kategori || 'Lainnya',
    nominal: toNumber_(d.nominal),
    catatan: d.catatan || ''
  };
  updateObjectRow_(sheet, rowIndex, update);
  return ok_({ id: d.id, updated: true });
}

function action_deleteKasKeluar_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Kas_Keluar');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Transaksi tidak ditemukan.', 'NOT_FOUND');
  sheet.deleteRow(rowIndex);
  return ok_({ id: d.id, deleted: true });
}

// ---------------- HELPERS BERSAMA ----------------
function filterByPeriode_(items, payload) {
  var bulan = payload.bulan ? Number(payload.bulan) : null;
  var tahun = payload.tahun ? Number(payload.tahun) : null;
  var dariTanggal = payload.dariTanggal ? new Date(payload.dariTanggal) : null;
  var sampaiTanggal = payload.sampaiTanggal ? new Date(payload.sampaiTanggal) : null;

  return items.filter(function (item) {
    if (bulan && Number(item.bulan) !== bulan) return false;
    if (tahun && Number(item.tahun) !== tahun) return false;
    if ((dariTanggal || sampaiTanggal) && item.tanggal) {
      var t = new Date(item.tanggal);
      if (dariTanggal && t < dariTanggal) return false;
      if (sampaiTanggal && t > sampaiTanggal) return false;
    }
    return true;
  });
}

function sortByTanggalDesc_(a, b) {
  var ta = a.tanggal ? new Date(a.tanggal).getTime() : new Date(a.created_at).getTime();
  var tb = b.tanggal ? new Date(b.tanggal).getTime() : new Date(b.created_at).getTime();
  return tb - ta;
}
