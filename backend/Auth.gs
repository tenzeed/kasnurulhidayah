/**
 * Auth.gs
 * Login, manajemen sesi (token), dan pengecekan role.
 * Session disimpan di CacheService (maksimal 6 jam - batas Apps Script).
 */

var SESSION_DURATION_SECONDS = 6 * 60 * 60; // 6 jam

function action_login_(payload) {
  var username = (payload.username || '').trim();
  var password = payload.password || '';
  if (!username || !password) {
    return fail_('Username dan password wajib diisi.', 'VALIDATION');
  }

  var sheet = getSheet_('Users');
  var users = sheetToObjects_(sheet);
  var user = users.filter(function (u) {
    return String(u.username).toLowerCase() === username.toLowerCase();
  })[0];

  if (!user) {
    return fail_('Username atau password salah.', 'AUTH');
  }

  var hashed = hashPassword_(password);
  if (String(user.password_hash) !== hashed) {
    return fail_('Username atau password salah.', 'AUTH');
  }

  var token = Utilities.getUuid();
  var session = {
    userId: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role
  };
  CacheService.getScriptCache().put('session_' + token, JSON.stringify(session), SESSION_DURATION_SECONDS);

  return ok_({
    token: token,
    user: { id: user.id, username: user.username, nama: user.nama, role: user.role }
  });
}

function action_logout_(payload) {
  if (payload.token) {
    CacheService.getScriptCache().remove('session_' + payload.token);
  }
  return ok_({ loggedOut: true });
}

// Mengembalikan objek session { userId, username, nama, role } atau null jika tidak valid.
function getSession_(token) {
  if (!token) return null;
  var raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Melempar error jika token tidak valid / sesi habis.
function requireAuth_(token) {
  var session = getSession_(token);
  if (!session) {
    throw new AuthError_('Sesi tidak valid atau sudah habis. Silakan login kembali.');
  }
  return session;
}

// Melempar error jika bukan admin.
function requireAdmin_(token) {
  var session = requireAuth_(token);
  if (session.role !== 'admin') {
    throw new AuthError_('Aksi ini khusus untuk Admin.');
  }
  return session;
}

function AuthError_(message) {
  this.message = message;
  this.name = 'AuthError';
}
AuthError_.prototype = Object.create(Error.prototype);
