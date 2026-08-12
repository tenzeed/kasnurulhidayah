/**
 * Hutang.gs
 * Modul hutang anggota + riwayat pembayaran.
 * Status otomatis menjadi "Lunas" ketika sisa hutang = 0.
 */

function action_getHutang_(payload) {
  requireAuth_(payload.token);
  var hutangList = sheetToObjects_(getSheet_('Hutang'));
  var pembayaranList = sheetToObjects_(getSheet_('Pembayaran_Hutang'));

  var result = hutangList.map(function (h) {
    var pembayaran = pembayaranList
      .filter(function (p) { return String(p.hutang_id) === String(h.id); })
      .sort(function (a, b) { return new Date(a.tanggal) - new Date(b.tanggal); });

    var totalDibayar = pembayaran.reduce(function (sum, p) { return sum + Number(p.nominal || 0); }, 0);
    var sisa = Number(h.nominal || 0) - totalDibayar;
    if (sisa < 0) sisa = 0;

    return {
      id: h.id,
      nama_anggota: h.nama_anggota,
      tanggal: h.tanggal,
      nominal: Number(h.nominal || 0),
      keterangan: h.keterangan,
      status: sisa <= 0 ? 'Lunas' : 'Belum Lunas',
      total_dibayar: totalDibayar,
      sisa_hutang: sisa,
      riwayat_pembayaran: pembayaran.map(function (p) {
        return { id: p.id, tanggal: p.tanggal, nominal: Number(p.nominal || 0), catatan: p.catatan };
      })
    };
  });

  // Filter by nama_anggota jika diminta (dipakai halaman anggota untuk lihat hutang pribadi)
  if (payload.nama_anggota) {
    result = result.filter(function (h) {
      return String(h.nama_anggota).toLowerCase() === String(payload.nama_anggota).toLowerCase();
    });
  }

  result.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  return ok_(result);
}

function action_addHutang_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.nama_anggota) return fail_('Nama anggota wajib diisi.', 'VALIDATION');
  var nominal = toNumber_(d.nominal);
  if (nominal <= 0) return fail_('Nominal hutang harus lebih dari 0.', 'VALIDATION');

  var tanggal = d.tanggal ? Utilities.formatDate(new Date(d.tanggal), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd') : Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');

  var obj = {
    id: generateId_('HT'),
    nama_anggota: d.nama_anggota,
    tanggal: tanggal,
    nominal: nominal,
    keterangan: d.keterangan || '',
    status: 'Belum Lunas',
    created_at: new Date(),
    created_by: session.username
  };
  appendObjectRow_(getSheet_('Hutang'), obj);

  // CATATAN: hutang TIDAK dicatat sebagai baris Kas Keluar terpisah (supaya "Total Pemasukan/Pengeluaran"
  // tetap murni transaksi kas asli). Saldo Kas dihitung dinamis di Dashboard: pemasukan - pengeluaran - sisa hutang beredar.
  return ok_(obj);
}

function action_getPembayaranHutang_(payload) {
  requireAuth_(payload.token);
  var items = sheetToObjects_(getSheet_('Pembayaran_Hutang'));
  if (payload.hutang_id) {
    items = items.filter(function (p) { return String(p.hutang_id) === String(payload.hutang_id); });
  }
  items.sort(function (a, b) { return new Date(b.tanggal) - new Date(a.tanggal); });
  return ok_(items);
}

function action_addPembayaranHutang_(payload) {
  var session = requireAdmin_(payload.token);
  var d = payload.data || {};
  if (!d.hutang_id) return fail_('ID hutang wajib diisi.', 'VALIDATION');
  var totalNominal = toNumber_(d.nominal);
  if (totalNominal <= 0) return fail_('Nominal pembayaran harus lebih dari 0.', 'VALIDATION');

  var hutangSheet = getSheet_('Hutang');
  var allHutang = sheetToObjects_(hutangSheet);
  var targetHutang = allHutang.filter(function (h) { return String(h.id) === String(d.hutang_id); })[0];
  if (!targetHutang) return fail_('Data hutang tidak ditemukan.', 'NOT_FOUND');

  var pembayaranSheet = getSheet_('Pembayaran_Hutang');
  var allPembayaran = sheetToObjects_(pembayaranSheet);

  function sisaOf(h) {
    var dibayar = allPembayaran
      .filter(function (p) { return String(p.hutang_id) === String(h.id); })
      .reduce(function (s, p) { return s + Number(p.nominal || 0); }, 0);
    var sisa = Number(h.nominal || 0) - dibayar;
    return sisa < 0 ? 0 : sisa;
  }

  // Kumpulkan SEMUA hutang milik anggota yang sama (nama sama), bukan cuma satu catatan.
  // Urutan alokasi: hutang yang dipilih admin dulu, sisanya (kalau ada kelebihan bayar)
  // otomatis mencicil hutang lain milik anggota yang sama, dari yang paling lama tanggalnya.
  var namaAnggota = targetHutang.nama_anggota;
  var debtsOfMember = allHutang.filter(function (h) {
    return String(h.nama_anggota).toLowerCase() === String(namaAnggota).toLowerCase();
  });
  var lainnya = debtsOfMember
    .filter(function (h) { return String(h.id) !== String(targetHutang.id); })
    .sort(function (a, b) { return new Date(a.tanggal) - new Date(b.tanggal); });
  var urutanAlokasi = [targetHutang].concat(lainnya);

  var totalSisaAnggota = urutanAlokasi.reduce(function (s, h) { return s + sisaOf(h); }, 0);
  if (totalNominal > totalSisaAnggota) {
    return fail_(
      'Nominal pembayaran (Rp' + totalNominal.toLocaleString('id-ID') + ') melebihi total SELURUH sisa hutang ' +
      namaAnggota + ' (Rp' + totalSisaAnggota.toLocaleString('id-ID') + ').',
      'VALIDATION'
    );
  }

  var tanggal = d.tanggal ? Utilities.formatDate(new Date(d.tanggal), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd') : Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd');

  var sisaPembayaran = totalNominal;
  var alokasiHasil = [];

  urutanAlokasi.forEach(function (h) {
    if (sisaPembayaran <= 0) return;
    var sisaHutangIni = sisaOf(h);
    if (sisaHutangIni <= 0) return;

    var alokasi = Math.min(sisaPembayaran, sisaHutangIni);
    var isKelebihan = String(h.id) !== String(targetHutang.id);

    var pembayaranObj = {
      id: generateId_('PH'),
      hutang_id: h.id,
      tanggal: tanggal,
      nominal: alokasi,
      catatan: (d.catatan || '') + (isKelebihan ? ' (otomatis dari kelebihan pembayaran hutang lain)' : ''),
      created_at: new Date(),
      created_by: session.username
    };
    appendObjectRow_(pembayaranSheet, pembayaranObj);
    alokasiHasil.push({ hutang_id: h.id, keterangan: h.keterangan, dialokasikan: alokasi, kelebihan: isKelebihan });

    var sisaBaru = sisaHutangIni - alokasi;
    if (sisaBaru <= 0) {
      var rowIdx = findRowIndexById_(hutangSheet, h.id);
      updateObjectRow_(hutangSheet, rowIdx, { status: 'Lunas' });
    }
    sisaPembayaran -= alokasi;
  });

  var totalDibayarSekarang = totalNominal - sisaPembayaran;

  // CATATAN: pembayaran hutang TIDAK dicatat sebagai baris Kas Masuk terpisah — karena uang itu
  // sejatinya sudah menjadi bagian kas sejak awal (cuma sedang dipinjam), bukan pemasukan baru.
  // Saldo Kas otomatis "kembali naik" karena sisa hutang beredar berkurang (lihat rumus di Laporan.gs).

  var sisaTargetSebelum = sisaOf(targetHutang);
  var totalDibayarTarget = alokasiHasil
    .filter(function (a) { return String(a.hutang_id) === String(targetHutang.id); })
    .reduce(function (s, a) { return s + a.dialokasikan; }, 0);
  var sisaTarget = Math.max(0, sisaTargetSebelum - totalDibayarTarget);

  return ok_({
    alokasi: alokasiHasil,
    total_dibayar: totalDibayarSekarang,
    sisa_hutang: sisaTarget,
    status: sisaTarget <= 0 ? 'Lunas' : 'Belum Lunas'
  });
}
