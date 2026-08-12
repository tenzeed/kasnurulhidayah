/**
 * Receh.gs
 * Modul Uang Receh / Uang Jajan - terpisah total dari saldo kas utama.
 */

function action_getReceh_(payload) {
  requireAuth_(payload.token);
  var masuk = filterByPeriode_(sheetToObjects_(getSheet_('Receh_Masuk')), payload);
  var keluar = filterByPeriode_(sheetToObjects_(getSheet_('Receh_Keluar')), payload);
  masuk.sort(sortByTanggalDesc_);
  keluar.sort(sortByTanggalDesc_);

  var totalMasuk = masuk.reduce(function (s, i) { return s + Number(i.nominal || 0); }, 0);
  var totalKeluar = keluar.reduce(function (s, i) { return s + Number(i.nominal || 0); }, 0);

  return ok_({
    masuk: masuk,
    keluar: keluar,
    total_masuk: totalMasuk,
    total_keluar: totalKeluar,
    saldo: totalMasuk - totalKeluar
  });
}

function action_addRecehMasuk_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.keterangan) return fail_('Keterangan wajib diisi.', 'VALIDATION');
  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  var obj = {
    id: generateId_('RM'),
    tanggal: periode.tanggal,
    bulan: periode.bulan,
    tahun: periode.tahun,
    keterangan: d.keterangan,
    nominal: toNumber_(d.nominal),
    catatan: d.catatan || '',
    created_at: new Date(),
    created_by: session.username
  };
  appendObjectRow_(getSheet_('Receh_Masuk'), obj);
  return ok_(obj);
}

function action_editRecehMasuk_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Receh_Masuk');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Data tidak ditemukan.', 'NOT_FOUND');
  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  updateObjectRow_(sheet, rowIndex, {
    tanggal: periode.tanggal, bulan: periode.bulan, tahun: periode.tahun,
    keterangan: d.keterangan, nominal: toNumber_(d.nominal), catatan: d.catatan || ''
  });
  return ok_({ id: d.id, updated: true });
}

function action_deleteRecehMasuk_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Receh_Masuk');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Data tidak ditemukan.', 'NOT_FOUND');
  sheet.deleteRow(rowIndex);
  return ok_({ id: d.id, deleted: true });
}

function action_addRecehKeluar_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.keterangan) return fail_('Keterangan wajib diisi.', 'VALIDATION');
  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  var obj = {
    id: generateId_('RK'),
    tanggal: periode.tanggal,
    bulan: periode.bulan,
    tahun: periode.tahun,
    keterangan: d.keterangan,
    nominal: toNumber_(d.nominal),
    catatan: d.catatan || '',
    created_at: new Date(),
    created_by: session.username
  };
  appendObjectRow_(getSheet_('Receh_Keluar'), obj);
  return ok_(obj);
}

function action_editRecehKeluar_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Receh_Keluar');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Data tidak ditemukan.', 'NOT_FOUND');
  var periode = normalizePeriode_(d.tanggal, d.bulan, d.tahun);
  updateObjectRow_(sheet, rowIndex, {
    tanggal: periode.tanggal, bulan: periode.bulan, tahun: periode.tahun,
    keterangan: d.keterangan, nominal: toNumber_(d.nominal), catatan: d.catatan || ''
  });
  return ok_({ id: d.id, updated: true });
}

function action_deleteRecehKeluar_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Receh_Keluar');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Data tidak ditemukan.', 'NOT_FOUND');
  sheet.deleteRow(rowIndex);
  return ok_({ id: d.id, deleted: true });
}
