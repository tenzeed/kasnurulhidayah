/**
 * Setup.gs
 * Jalankan fungsi setupDatabase() SATU KALI (dari editor Apps Script: pilih fungsi
 * "setupDatabase" lalu klik Run) untuk membuat seluruh struktur sheet dan akun admin awal.
 * Aman dijalankan berulang kali: sheet yang sudah ada tidak akan ditimpa/dihapus.
 */

var SHEET_DEFINITIONS = {
  Users: ['id', 'username', 'password_hash', 'role', 'nama', 'created_at'],
  Kas_Masuk: ['id', 'tanggal', 'bulan', 'tahun', 'keterangan', 'sumber', 'nominal', 'catatan', 'created_at', 'created_by'],
  Kas_Keluar: ['id', 'tanggal', 'bulan', 'tahun', 'keterangan', 'kategori', 'nominal', 'catatan', 'created_at', 'created_by'],
  Hutang: ['id', 'nama_anggota', 'tanggal', 'nominal', 'keterangan', 'status', 'created_at', 'created_by'],
  Pembayaran_Hutang: ['id', 'hutang_id', 'tanggal', 'nominal', 'catatan', 'created_at', 'created_by'],
  Receh_Masuk: ['id', 'tanggal', 'bulan', 'tahun', 'keterangan', 'nominal', 'catatan', 'created_at', 'created_by'],
  Receh_Keluar: ['id', 'tanggal', 'bulan', 'tahun', 'keterangan', 'nominal', 'catatan', 'created_at', 'created_by']
};

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Jalankan fungsi ini dari dalam project Apps Script yang terhubung ke Spreadsheet (Extensions > Apps Script).');
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  Object.keys(SHEET_DEFINITIONS).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    var headers = SHEET_DEFINITIONS[sheetName];
    var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var isEmpty = firstRow.join('') === '';
    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  });

  // Hapus "Sheet1" default kosong jika masih ada dan tidak dipakai
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }

  // Buat akun admin default jika belum ada satupun user
  var usersSheet = ss.getSheetByName('Users');
  var users = sheetToObjects_(usersSheet);
  if (users.length === 0) {
    var defaultPassword = 'admin123'; // WAJIB diganti setelah login pertama kali!
    usersSheet.appendRow([
      generateId_('USR'),
      'admin',
      hashPassword_(defaultPassword),
      'admin',
      'Administrator',
      new Date()
    ]);
    Logger.log('Akun admin default dibuat -> username: admin | password: ' + defaultPassword);
    Logger.log('PENTING: segera ganti password ini melalui menu "Kelola Akun Anggota" setelah login.');
  }

  Logger.log('Setup selesai. Spreadsheet ID: ' + ss.getId());
  Logger.log('Deploy project ini sebagai Web App (Deploy > New deployment > Web app) lalu salin URL-nya ke frontend/js/config.js');
}
