/**
 * Laporan.gs
 * Ringkasan dashboard + laporan bulanan & tahunan.
 */

function action_getDashboard_(payload) {
  requireAuth_(payload.token);

  var kasMasuk = sheetToObjects_(getSheet_('Kas_Masuk'));
  var kasKeluar = sheetToObjects_(getSheet_('Kas_Keluar'));
  var hutangList = sheetToObjects_(getSheet_('Hutang'));
  var pembayaranList = sheetToObjects_(getSheet_('Pembayaran_Hutang'));
  var recehMasuk = sheetToObjects_(getSheet_('Receh_Masuk'));
  var recehKeluar = sheetToObjects_(getSheet_('Receh_Keluar'));

  // Filter periode opsional (bulan/tahun/rentang tanggal) untuk KPI & grafik
  var kmFiltered = filterByPeriode_(kasMasuk, payload);
  var kkFiltered = filterByPeriode_(kasKeluar, payload);

  var totalPemasukan = sumNominal_(kmFiltered);
  var totalPengeluaran = sumNominal_(kkFiltered);

  // Saldo kas = akumulasi SELURUH transaksi (bukan hanya periode terfilter),
  // supaya saldo selalu mencerminkan kondisi riil kas saat ini.
  var saldoKas = sumNominal_(kasMasuk) - sumNominal_(kasKeluar);

  var totalHutang = 0;
  hutangList.forEach(function (h) {
    var dibayar = pembayaranList
      .filter(function (p) { return String(p.hutang_id) === String(h.id); })
      .reduce(function (s, p) { return s + Number(p.nominal || 0); }, 0);
    var sisa = Number(h.nominal || 0) - dibayar;
    if (sisa > 0) totalHutang += sisa;
  });

  var totalReceh = sumNominal_(recehMasuk) - sumNominal_(recehKeluar);

  var jumlahTransaksi = kmFiltered.length + kkFiltered.length;

  // Data untuk grafik: pemasukan vs pengeluaran per bulan (12 bulan terakhir yang ada datanya)
  var grafikBulanan = buildGrafikBulanan_(kasMasuk, kasKeluar);

  // Perkembangan saldo kas kumulatif per bulan
  var grafikSaldo = buildGrafikSaldoKumulatif_(grafikBulanan);

  // Grafik hutang per anggota (sisa hutang)
  var grafikHutang = hutangList.map(function (h) {
    var dibayar = pembayaranList
      .filter(function (p) { return String(p.hutang_id) === String(h.id); })
      .reduce(function (s, p) { return s + Number(p.nominal || 0); }, 0);
    return { nama: h.nama_anggota, sisa: Math.max(0, Number(h.nominal || 0) - dibayar) };
  }).reduce(function (acc, cur) {
    var existing = acc.filter(function (a) { return a.nama === cur.nama; })[0];
    if (existing) existing.sisa += cur.sisa; else acc.push(cur);
    return acc;
  }, []).filter(function (a) { return a.sisa > 0; });

  return ok_({
    saldo_kas: saldoKas,
    total_pemasukan: totalPemasukan,
    total_pengeluaran: totalPengeluaran,
    total_hutang: totalHutang,
    total_receh: totalReceh,
    jumlah_transaksi: jumlahTransaksi,
    grafik_bulanan: grafikBulanan,
    grafik_saldo: grafikSaldo,
    grafik_hutang: grafikHutang
  });
}

function action_getLaporanBulanan_(payload) {
  requireAuth_(payload.token);
  var bulan = Number(payload.bulan);
  var tahun = Number(payload.tahun);
  if (!bulan || !tahun) return fail_('Bulan dan tahun wajib diisi.', 'VALIDATION');

  var kasMasuk = sheetToObjects_(getSheet_('Kas_Masuk')).filter(function (i) {
    return Number(i.bulan) === bulan && Number(i.tahun) === tahun;
  });
  var kasKeluar = sheetToObjects_(getSheet_('Kas_Keluar')).filter(function (i) {
    return Number(i.bulan) === bulan && Number(i.tahun) === tahun;
  });

  kasMasuk.sort(sortByTanggalDesc_);
  kasKeluar.sort(sortByTanggalDesc_);

  var totalMasuk = sumNominal_(kasMasuk);
  var totalKeluar = sumNominal_(kasKeluar);

  // Pengeluaran dikelompokkan per kategori
  var perKategori = {};
  kasKeluar.forEach(function (i) {
    var kat = i.kategori || 'Lainnya';
    perKategori[kat] = (perKategori[kat] || 0) + Number(i.nominal || 0);
  });

  return ok_({
    bulan: bulan,
    tahun: tahun,
    kas_masuk: kasMasuk,
    kas_keluar: kasKeluar,
    total_kas_masuk: totalMasuk,
    total_kas_keluar: totalKeluar,
    saldo_bulan_ini: totalMasuk - totalKeluar,
    pengeluaran_per_kategori: perKategori
  });
}

function action_getRekapTahunan_(payload) {
  requireAuth_(payload.token);
  var tahun = Number(payload.tahun);
  if (!tahun) return fail_('Tahun wajib diisi.', 'VALIDATION');

  var kasMasuk = sheetToObjects_(getSheet_('Kas_Masuk')).filter(function (i) { return Number(i.tahun) === tahun; });
  var kasKeluar = sheetToObjects_(getSheet_('Kas_Keluar')).filter(function (i) { return Number(i.tahun) === tahun; });

  var perBulan = [];
  for (var b = 1; b <= 12; b++) {
    var masukBulan = sumNominal_(kasMasuk.filter(function (i) { return Number(i.bulan) === b; }));
    var keluarBulan = sumNominal_(kasKeluar.filter(function (i) { return Number(i.bulan) === b; }));
    perBulan.push({ bulan: b, total_masuk: masukBulan, total_keluar: keluarBulan, saldo: masukBulan - keluarBulan });
  }

  var totalPemasukan = sumNominal_(kasMasuk);
  var totalPengeluaran = sumNominal_(kasKeluar);

  return ok_({
    tahun: tahun,
    per_bulan: perBulan,
    total_pemasukan: totalPemasukan,
    total_pengeluaran: totalPengeluaran,
    saldo_akhir: totalPemasukan - totalPengeluaran
  });
}

// ---------------- HELPERS ----------------
function sumNominal_(items) {
  return items.reduce(function (s, i) { return s + Number(i.nominal || 0); }, 0);
}

function buildGrafikBulanan_(kasMasuk, kasKeluar) {
  var map = {}; // key "yyyy-mm" -> { masuk, keluar }
  function addTo(list, key) {
    list.forEach(function (i) {
      if (!i.bulan || !i.tahun) return;
      var k = i.tahun + '-' + String(i.bulan).padStart(2, '0');
      if (!map[k]) map[k] = { periode: k, masuk: 0, keluar: 0 };
      map[k][key] += Number(i.nominal || 0);
    });
  }
  addTo(kasMasuk, 'masuk');
  addTo(kasKeluar, 'keluar');

  var arr = Object.keys(map).map(function (k) { return map[k]; });
  arr.sort(function (a, b) { return a.periode.localeCompare(b.periode); });
  return arr.slice(-12); // 12 periode terakhir yang punya data
}

function buildGrafikSaldoKumulatif_(grafikBulanan) {
  var kumulatif = 0;
  return grafikBulanan.map(function (item) {
    kumulatif += (item.masuk - item.keluar);
    return { periode: item.periode, saldo: kumulatif };
  });
}
