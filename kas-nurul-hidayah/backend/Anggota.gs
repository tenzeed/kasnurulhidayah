/**
 * Anggota.gs
 * Kelola akun (Users): tambah, edit, hapus, ganti password. Khusus Admin.
 */

function action_getAnggota_(payload) {
  requireAdmin_(payload.token);
  var users = sheetToObjects_(getSheet_('Users'));
  var result = users.map(function (u) {
    return { id: u.id, username: u.username, role: u.role, nama: u.nama, created_at: u.created_at };
  });
  return ok_(result);
}

function action_addAnggota_(payload) {
  requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.username || !d.password || !d.nama) {
    return fail_('Username, password, dan nama wajib diisi.', 'VALIDATION');
  }
  var role = d.role === 'admin' ? 'admin' : 'anggota';

  var sheet = getSheet_('Users');
  var users = sheetToObjects_(sheet);
  var exists = users.some(function (u) { return String(u.username).toLowerCase() === d.username.toLowerCase(); });
  if (exists) return fail_('Username sudah digunakan.', 'VALIDATION');

  var obj = {
    id: generateId_('USR'),
    username: d.username,
    password_hash: hashPassword_(d.password),
    role: role,
    nama: d.nama,
    created_at: new Date()
  };
  appendObjectRow_(sheet, obj);
  return ok_({ id: obj.id, username: obj.username, role: obj.role, nama: obj.nama });
}

function action_editAnggota_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.id) return fail_('ID akun wajib diisi.', 'VALIDATION');
  var sheet = getSheet_('Users');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Akun tidak ditemukan.', 'NOT_FOUND');

  var update = {};
  if (d.nama) update.nama = d.nama;
  if (d.role) update.role = d.role === 'admin' ? 'admin' : 'anggota';
  if (d.password) update.password_hash = hashPassword_(d.password);
  updateObjectRow_(sheet, rowIndex, update);
  return ok_({ id: d.id, updated: true });
}

function action_deleteAnggota_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  var sheet = getSheet_('Users');
  var rowIndex = findRowIndexById_(sheet, d.id);
  if (rowIndex === -1) return fail_('Akun tidak ditemukan.', 'NOT_FOUND');

  var target = sheetToObjects_(sheet).filter(function (u) { return String(u.id) === String(d.id); })[0];
  if (target && target.username === session.username) {
    return fail_('Tidak bisa menghapus akun yang sedang digunakan.', 'VALIDATION');
  }
  sheet.deleteRow(rowIndex);
  return ok_({ id: d.id, deleted: true });
}
