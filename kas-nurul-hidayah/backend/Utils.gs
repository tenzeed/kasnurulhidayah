/**
 * Utils.gs
 * Kumpulan fungsi bantu yang dipakai di seluruh backend.
 */

// ================== KONFIGURASI ==================
// ID Spreadsheet diambil dari Script Properties (diisi otomatis saat setup pertama kali,
// atau bisa diisi manual di: Project Settings > Script Properties > SPREADSHEET_ID)
function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  if (ssId) {
    return SpreadsheetApp.openById(ssId);
  }
  // Fallback: gunakan spreadsheet yang mengikat script ini (jika script dibuat dari dalam Spreadsheet)
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }
  throw new Error('SPREADSHEET_ID belum diatur. Jalankan fungsi setupDatabase() terlebih dahulu.');
}

function getSheet_(name) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan setupDatabase() terlebih dahulu.');
  }
  return sheet;
}

// ================== RESPONSE HELPERS ==================
function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return jsonResponse_({ success: true, data: data });
}

function fail_(message, code) {
  return jsonResponse_({ success: false, error: message, code: code || 'ERROR' });
}

// ================== ID GENERATOR ==================
function generateId_(prefix) {
  var uuid = Utilities.getUuid().replace(/-/g, '').substring(0, 10).toUpperCase();
  return prefix + '-' + uuid;
}

// ================== SHEET -> ARRAY OF OBJECTS ==================
function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = values.slice(1);
  return rows
    .filter(function (row) { return row.join('') !== ''; })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) {
        obj[h] = row[i];
      });
      return obj;
    });
}

function findRowIndexById_(sheet, id) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) throw new Error('Kolom "id" tidak ditemukan di sheet ' + sheet.getName());
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) {
      return i + 1; // 1-based row number in the sheet
    }
  }
  return -1;
}

function appendObjectRow_(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) {
    return (obj[h] !== undefined && obj[h] !== null) ? obj[h] : '';
  });
  sheet.appendRow(row);
}

function updateObjectRow_(sheet, rowIndex, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var newRow = headers.map(function (h, i) {
    return (obj[h] !== undefined) ? obj[h] : currentRow[i];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newRow]);
}

// ================== TANGGAL / PERIODE ==================
// Menerima tanggal (Date, string "yyyy-MM-dd", atau kosong) dan bulan/tahun wajib.
// Mengembalikan { tanggal, bulan, tahun } yang konsisten untuk disimpan.
function normalizePeriode_(tanggalInput, bulanInput, tahunInput) {
  var bulan = Number(bulanInput);
  var tahun = Number(tahunInput);
  if (!bulan || bulan < 1 || bulan > 12) throw new Error('Bulan wajib diisi (1-12).');
  if (!tahun || tahun < 2000) throw new Error('Tahun wajib diisi (contoh: 2026).');

  var tanggal = '';
  if (tanggalInput) {
    var d = new Date(tanggalInput);
    if (!isNaN(d.getTime())) {
      tanggal = Utilities.formatDate(d, Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');
    }
  }
  return { tanggal: tanggal, bulan: bulan, tahun: tahun };
}

function toNumber_(v) {
  var n = Number(v);
  if (isNaN(n)) throw new Error('Nominal tidak valid.');
  return n;
}

// ================== PASSWORD HASHING ==================
function getPasswordSalt_() {
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty('PASSWORD_SALT');
  if (!salt) {
    salt = Utilities.getUuid();
    props.setProperty('PASSWORD_SALT', salt);
  }
  return salt;
}

function hashPassword_(plainPassword) {
  var salt = getPasswordSalt_();
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    salt + ':' + plainPassword,
    Utilities.Charset.UTF_8
  );
  return digest.map(function (byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}
