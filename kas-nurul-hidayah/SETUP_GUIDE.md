# Panduan Setup — Kas Nurul Hidayah

Panduan ini menjelaskan langkah demi langkah dari nol sampai aplikasi bisa diakses online,
sesuai arsitektur di PRD: **Frontend (Vercel) → Google Apps Script (API) → Google Spreadsheet (Database)**.

Waktu yang dibutuhkan: kurang lebih 20–30 menit untuk setup pertama kali.

---

## Bagian 1 — Menyiapkan Database (Google Spreadsheet + Apps Script)

### 1.1 Buat Spreadsheet baru
1. Buka [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**.
2. Ganti nama spreadsheet menjadi `Database Kas Nurul Hidayah`.

### 1.2 Buka Apps Script Editor
1. Di spreadsheet, klik menu **Extensions (Ekstensi) → Apps Script**.
2. Akan terbuka tab baru: editor Apps Script yang sudah otomatis terhubung ke spreadsheet ini.

### 1.3 Masukkan semua file backend
Project ini punya 9 file backend di folder `backend/`. Anda perlu membuat file yang sama persis di Apps Script editor lalu menyalin isinya (copy-paste).

1. Di Apps Script editor, akan ada file default bernama `Code.gs` — **hapus semua isinya**, lalu salin isi dari `backend/Code.gs` ke sana.
2. Untuk file lainnya, klik ikon **+ (Add a file) → Script**, beri nama sesuai (tanpa `.gs`, Apps Script menambahkannya otomatis), lalu salin isinya:
   - `Utils`
   - `Auth`
   - `Setup`
   - `Kas`
   - `Hutang`
   - `Receh`
   - `Anggota`
   - `Laporan`
3. Terakhir, klik ikon roda gigi **Project Settings**, centang **"Show appsscript.json manifest file in editor"**. Buka file `appsscript.json` yang muncul di editor, dan ganti isinya dengan isi `backend/appsscript.json`.

Setelah selesai, Anda harus punya total 9 file `.gs` + 1 `appsscript.json` di project Apps Script, sama seperti di folder `backend/`.

> Urutan file tidak masalah — Apps Script menggabungkan semua file jadi satu ruang lingkup (global scope) secara otomatis.

### 1.4 Jalankan setup database
1. Di dropdown pemilih fungsi (di sebelah tombol ▷ Run, dekat toolbar), pilih fungsi **`setupDatabase`**.
2. Klik tombol **Run**.
3. Apps Script akan meminta izin akses (**Authorization required**) — klik **Review permissions**, pilih akun Google Anda, klik **Advanced (Lanjutan) → Buka (nama project) (tidak aman)**, lalu **Allow**. Ini normal karena project belum diverifikasi Google (wajar untuk script pribadi/organisasi).
4. Setelah selesai jalan (tidak ada error di log), buka kembali spreadsheet Anda — akan muncul sheet-sheet baru: `Users`, `Kas_Masuk`, `Kas_Keluar`, `Hutang`, `Pembayaran_Hutang`, `Receh_Masuk`, `Receh_Keluar`.
5. Buka menu **View → Logs** (atau **Executions**) di Apps Script untuk melihat pesan:
   ```
   Akun admin default dibuat -> username: admin | password: admin123
   ```
   **Catat kredensial ini** — Anda akan memakainya untuk login pertama kali. **Segera ganti password setelah login** lewat menu "Kelola Akun".

### 1.5 Deploy sebagai Web App
1. Klik tombol **Deploy (Terapkan) → New deployment (Deployment baru)**.
2. Klik ikon roda gigi di samping "Select type" → pilih **Web app**.
3. Isi:
   - **Description**: `Kas Nurul Hidayah API v1`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone` (harus Anyone agar frontend di Vercel bisa memanggilnya tanpa login Google)
4. Klik **Deploy**. Google akan minta konfirmasi izin lagi — setujui.
5. Setelah selesai, akan muncul **Web app URL** seperti:
   ```
   https://script.google.com/macros/s/AKfycb................/exec
   ```
   **Salin URL ini** — akan dipakai di langkah berikutnya.

> **Penting:** setiap kali Anda mengedit kode backend (`.gs`) di kemudian hari, Anda harus membuat **New deployment** baru (atau **Manage deployments → Edit → New version**) agar perubahan aktif di URL yang sama. Sekadar menekan Save saja tidak otomatis memperbarui deployment yang sudah aktif.

---

## Bagian 2 — Menyiapkan Frontend

### 2.1 Isi URL API
1. Buka file `frontend/js/config.js`.
2. Ganti nilai `API_URL` dengan URL Web App dari langkah 1.5:
   ```js
   window.APP_CONFIG = {
     API_URL: 'https://script.google.com/macros/s/AKfycb................/exec',
     APP_NAME: 'Kas Nurul Hidayah'
   };
   ```
3. Simpan file.

### 2.2 Coba jalankan secara lokal (opsional, untuk tes cepat)
Karena aplikasi ini murni HTML/CSS/JS tanpa proses build, Anda bisa langsung membukanya:
- Cara termudah: klik-kanan `frontend/index.html` → buka dengan browser (`Live Server` extension di VS Code juga bisa dipakai agar tidak ada masalah `file://`).
- Login dengan `admin` / `admin123` (atau password yang sudah Anda ganti).

---

## Bagian 3 — Menyimpan ke GitHub

```bash
cd kas-nurul-hidayah
git init
git add .
git commit -m "Initial commit: Kas Nurul Hidayah"
git branch -M main
git remote add origin https://github.com/USERNAME/kas-nurul-hidayah.git
git push -u origin main
```

Ganti `USERNAME` dengan akun GitHub Anda, dan buat repository kosong terlebih dahulu di GitHub (tanpa README) sebelum push.

> **Catatan keamanan:** file `frontend/js/config.js` berisi URL Web App Apps Script Anda. URL ini memang dirancang untuk dipanggil publik (karena aplikasi butuh diakses dari browser tanpa backend server sendiri), jadi aman untuk masuk ke repository — **selama** validasi login & role di backend (`Auth.gs`) tidak diubah/dilemahkan.

---

## Bagian 4 — Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → login (bisa pakai akun GitHub).
2. Klik **Add New → Project**, pilih repository `kas-nurul-hidayah` yang baru di-push.
3. Pada pengaturan project:
   - **Root Directory**: pilih folder `frontend` (klik "Edit" di samping Root Directory).
   - **Framework Preset**: pilih `Other` (karena tidak ada build step).
   - **Build Command**: kosongkan.
   - **Output Directory**: kosongkan (atau `.`).
4. Klik **Deploy**.
5. Setelah selesai, Vercel memberi URL seperti `https://kas-nurul-hidayah.vercel.app` — ini alamat aplikasi Anda yang sudah live.

Setiap kali Anda `git push` perubahan baru ke branch `main`, Vercel otomatis build ulang & deploy versi terbaru.

---

## Bagian 5 — Login Pertama Kali & Langkah Selanjutnya

1. Buka URL Vercel Anda.
2. Login dengan akun admin default (`admin` / `admin123` atau sesuai log di langkah 1.4).
3. Buka **Kelola Akun** → edit akun `admin`, ganti password ke password yang kuat dan rahasia.
4. Buat akun **Anggota** (role read-only) untuk anggota organisasi yang perlu melihat laporan.
5. Mulai input transaksi kas masuk/keluar, hutang, dan uang receh dari menu masing-masing.

---

## Referensi Cepat

### Struktur Sheet di Google Spreadsheet
| Sheet | Kolom |
|---|---|
| `Users` | id, username, password_hash, role, nama, created_at |
| `Kas_Masuk` | id, tanggal, bulan, tahun, keterangan, sumber, nominal, catatan, created_at, created_by |
| `Kas_Keluar` | id, tanggal, bulan, tahun, keterangan, kategori, nominal, catatan, created_at, created_by |
| `Hutang` | id, nama_anggota, tanggal, nominal, keterangan, status, created_at, created_by |
| `Pembayaran_Hutang` | id, hutang_id, tanggal, nominal, catatan, created_at, created_by |
| `Receh_Masuk` / `Receh_Keluar` | id, tanggal, bulan, tahun, keterangan, nominal, catatan, created_at, created_by |

Anda bisa membuka & melihat data mentahnya kapan saja langsung dari Google Spreadsheet (misalnya untuk backup manual, `File → Download → Excel/CSV`), tapi **jangan mengedit header kolom**, karena backend membaca data berdasarkan nama kolom di baris pertama.

### Hal yang perlu diketahui (batasan teknis)
- **Rumus Saldo Kas**: `Saldo Kas = Total Pemasukan − Total Pengeluaran − Sisa Hutang Anggota yang Beredar`. "Pemasukan" dan "Pengeluaran" di sini murni transaksi kas asli (mentas, donasi, konsumsi, dll) — TIDAK dicampur dengan hutang atau pembayaran hutang. Saat admin mencatat hutang baru, sisa hutang beredar bertambah sehingga Saldo Kas otomatis berkurang (uangnya sedang "dipinjam"). Saat anggota membayar, sisa hutang berkurang sehingga Saldo Kas otomatis naik lagi. Semua dihitung otomatis saat dashboard dibuka — tidak ada baris tambahan yang disisipkan ke sheet `Kas_Masuk`/`Kas_Keluar`.
- **Pembayaran hutang otomatis mencicil hutang lain**: kalau seorang anggota punya lebih dari satu catatan hutang, dan pembayaran yang dicatat melebihi sisa hutang pada catatan yang dipilih, kelebihannya otomatis dialokasikan untuk mencicil catatan hutang lain milik anggota yang sama (dimulai dari yang tanggalnya paling lama). Sistem akan menolak pembayaran jika totalnya melebihi total SELURUH sisa hutang anggota tersebut.
- **Urutan data**: seluruh daftar transaksi (Kas Masuk, Kas Keluar, Uang Receh) diurutkan berdasarkan **tanggal/bulan/tahun transaksi**, bukan berdasarkan kapan datanya diinput ke sistem.
- **Sesi login** disimpan di memori server (Apps Script `CacheService`) dan **otomatis habis setelah 6 jam** — ini batas maksimum dari Google Apps Script, bukan bug. Setelah itu pengguna perlu login ulang.
- **Kecepatan**: karena database-nya Google Spreadsheet (bukan database sungguhan), performa sangat baik untuk skala organisasi kecil–menengah (ratusan hingga beberapa ribu baris per sheet), tapi akan melambat jika data sudah puluhan ribu baris. Untuk skala kas RT/RW/organisasi ini lebih dari cukup.
- **Password** disimpan dalam bentuk hash SHA-256 bergaram (salted), bukan plain text — sesuai poin keamanan di PRD.
- Jika Anda mengganti/redeploy backend dan mendapati error `SESSION_ID` atau semua orang ter-logout, itu wajar karena cache sesi memang tidak permanen antar deployment berbeda.

### Cara update backend yang sudah pernah di-deploy
Kalau Anda mengunduh ulang file backend (misalnya setelah ada perbaikan bug), begini cara memperbaruinya tanpa perlu setup ulang dari nol:
1. Buka kembali project Apps Script Anda (dari Spreadsheet → Extensions → Apps Script).
2. Untuk tiap file yang berubah (misalnya `Hutang.gs` dan `Kas.gs`), buka tab file itu, **hapus semua isinya**, lalu tempel isi terbaru dari folder `backend/`.
3. Klik **Deploy → Manage deployments**, klik ikon pensil (Edit) pada deployment yang aktif, ubah **Version** menjadi **New version**, lalu klik **Deploy**.
   (Ini penting — mengedit kode saja tanpa membuat "New version" tidak akan mengubah perilaku di URL Web App yang sudah dipakai frontend.)

### Troubleshooting
| Gejala | Kemungkinan penyebab & solusi |
|---|---|
| Login gagal terus / "Gagal terhubung ke server" | Cek `API_URL` di `config.js` sudah benar & sudah redeploy. Pastikan Web App di-deploy dengan akses **Anyone**. |
| Error `Sesi tidak valid` terus-terusan | Sesi 6 jam sudah habis → login ulang. Jika baru saja login tapi tetap gagal, coba deploy ulang Web App (kadang cache lama masih aktif). |
| Perubahan kode backend tidak berefek | Anda harus buat **New deployment** / **New version** di Apps Script setiap kali mengubah kode — bukan cuma Save. |
| Data tidak muncul realtime di anggota lain | Aplikasi mengambil data ulang tiap kali pindah halaman/login (bukan WebSocket, sesuai PRD). Tekan tombol refresh browser atau pindah menu untuk data terbaru. |

---

## Struktur Project

```
kas-nurul-hidayah/
├── backend/                  # Salin isi tiap file ke Apps Script Editor
│   ├── Code.gs                (routing utama / doGet & doPost)
│   ├── Setup.gs                (jalankan setupDatabase() sekali di awal)
│   ├── Auth.gs                 (login & sesi)
│   ├── Utils.gs                (helper umum)
│   ├── Kas.gs                  (kas masuk & keluar)
│   ├── Hutang.gs                (hutang & pembayaran)
│   ├── Receh.gs                 (uang receh/jajan)
│   ├── Anggota.gs                (kelola akun)
│   ├── Laporan.gs                (dashboard & laporan)
│   └── appsscript.json           (manifest)
├── frontend/                 # Deploy folder ini ke Vercel
│   ├── index.html
│   ├── vercel.json
│   ├── css/style.css
│   └── js/
│       ├── config.js           ← isi URL Web App di sini
│       ├── api.js
│       ├── utils.js
│       ├── components.js
│       ├── charts.js
│       ├── app.js
│       └── views/
│           ├── dashboard.js
│           ├── kas.js
│           ├── hutang.js
│           ├── receh.js
│           ├── laporan.js
│           └── anggota.js
└── SETUP_GUIDE.md            (file ini)
```
