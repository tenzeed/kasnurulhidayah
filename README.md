# Kas Nurul Hidayah

Aplikasi web manajemen kas digital untuk menggantikan pencatatan manual di Google Spreadsheet.

- **Frontend**: HTML/CSS/JS vanilla, mobile-first, siap deploy ke Vercel — lihat folder `frontend/`.
- **Backend**: Google Apps Script sebagai REST API — lihat folder `backend/`.
- **Database**: Google Spreadsheet.

## Fitur utama
- Login dengan 2 role: **Admin** (akses penuh) dan **Anggota** (read-only).
- Dashboard dengan KPI (saldo kas, total pemasukan/pengeluaran, hutang, uang receh), filter bulan/tahun, dan grafik.
- Modul **Kas Masuk** & **Kas Keluar** dengan kategori dan catatan.
- Modul **Hutang Anggota** — pencatatan hutang, riwayat pembayaran, status otomatis Lunas/Belum Lunas.
- Modul **Uang Receh / Jajan** — terpisah total dari saldo kas utama.
- **Laporan Bulanan** & **Rekap Tahunan**.
- **Kelola Akun** anggota/admin (khusus Admin).
- UI modern: dark mode, toast notification, konfirmasi hapus, empty/loading state, animasi angka KPI.

## Mulai dari sini
Ikuti **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** untuk panduan lengkap langkah demi langkah — dari membuat Spreadsheet, deploy Apps Script, sampai deploy frontend ke Vercel.

## Akun demo awal
Setelah menjalankan `setupDatabase()` di Apps Script (lihat panduan), akun admin default:
- Username: `admin`
- Password: `admin123` (⚠️ segera ganti setelah login pertama)
