// views/laporan.js

const ViewsL = window.Views || {};

ViewsL.laporan = async function (container, ctx) {
  let activeTab = 'bulanan';

  container.innerHTML = `
    <div class="section-title"><h2>Laporan Keuangan</h2></div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="bulanan">Laporan Bulanan</button>
      <button class="tab-btn" data-tab="tahunan">Rekap Tahunan</button>
    </div>
    <div id="laporanContent"></div>
  `;

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    };
  });

  function render() {
    if (activeTab === 'bulanan') renderBulanan();
    else renderTahunan();
  }

  // ---------- LAPORAN BULANAN ----------
  function renderBulanan() {
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
      <div class="filter-bar">
        <div class="field">
          <label>Bulan</label>
          <select id="lbBulan">${BULAN_NAMA.slice(1).map((b, i) => `<option value="${i + 1}" ${i + 1 === currentMonth() ? 'selected' : ''}>${b}</option>`).join('')}</select>
        </div>
        <div class="field">
          <label>Tahun</label>
          <select id="lbTahun">${yearOptions().map((y) => `<option value="${y}" ${y === currentYear() ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </div>
        <button class="btn btn-primary btn-sm" id="btnLoadLB">Tampilkan</button>
      </div>
      <div id="lbResult">${loadingStateHtml()}</div>
    `;

    async function load() {
      const bulan = document.getElementById('lbBulan').value;
      const tahun = document.getElementById('lbTahun').value;
      document.getElementById('lbResult').innerHTML = loadingStateHtml();
      try {
        const d = await Api.getLaporanBulanan(bulan, tahun);
        renderResult(d);
      } catch (err) {
        document.getElementById('lbResult').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      }
    }

    function renderResult(d) {
      const el = document.getElementById('lbResult');
      if (d.kas_masuk.length === 0 && d.kas_keluar.length === 0) {
        el.innerHTML = `<div class="card">${emptyStateHtml('Belum ada transaksi', `Tidak ada data untuk ${BULAN_NAMA[d.bulan]} ${d.tahun}.`)}</div>`;
        return;
      }
      el.innerHTML = `
        <div class="card" style="margin-bottom:18px;">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:14px;">${BULAN_NAMA[d.bulan]} ${d.tahun}</h3>
          <div class="two-col">
            <div>
              <div class="kpi-label">Total Kas Masuk</div>
              <div class="tabular-nums amount-pos" style="font-size:20px;font-weight:700;">${formatRupiah(d.total_kas_masuk)}</div>
            </div>
            <div>
              <div class="kpi-label">Total Kas Keluar</div>
              <div class="tabular-nums amount-neg" style="font-size:20px;font-weight:700;">${formatRupiah(d.total_kas_keluar)}</div>
            </div>
          </div>
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--color-border);">
            <div class="kpi-label">Saldo Bulan Ini</div>
            <div class="tabular-nums" style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${d.saldo_bulan_ini >= 0 ? 'var(--color-primary-dark)' : 'var(--color-danger)'};">${formatRupiah(d.saldo_bulan_ini)}</div>
          </div>
        </div>

        <div class="two-col" style="align-items:start;">
          <div class="card">
            <h4 style="margin-bottom:10px;font-size:14px;">Kas Masuk</h4>
            ${d.kas_masuk.length === 0 ? '<p style="font-size:13px;color:var(--color-text-faint);">Tidak ada.</p>' :
              d.kas_masuk.map((i) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--color-border);font-size:13px;">
                <span>${escapeHtml(i.keterangan)}</span><span class="tabular-nums amount-pos">${formatRupiah(i.nominal)}</span>
              </div>`).join('')}
          </div>
          <div class="card">
            <h4 style="margin-bottom:10px;font-size:14px;">Kas Keluar per Kategori</h4>
            ${Object.keys(d.pengeluaran_per_kategori).length === 0 ? '<p style="font-size:13px;color:var(--color-text-faint);">Tidak ada.</p>' :
              Object.entries(d.pengeluaran_per_kategori).map(([kat, val]) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--color-border);font-size:13px;">
                <span>${escapeHtml(kat)}</span><span class="tabular-nums amount-neg">${formatRupiah(val)}</span>
              </div>`).join('')}
          </div>
        </div>
      `;
    }

    document.getElementById('btnLoadLB').onclick = load;
    load();
  }

  // ---------- REKAP TAHUNAN ----------
  function renderTahunan() {
    const content = document.getElementById('laporanContent');
    content.innerHTML = `
      <div class="filter-bar">
        <div class="field">
          <label>Tahun</label>
          <select id="rtTahun">${yearOptions().map((y) => `<option value="${y}" ${y === currentYear() ? 'selected' : ''}>${y}</option>`).join('')}</select>
        </div>
        <button class="btn btn-primary btn-sm" id="btnLoadRT">Tampilkan</button>
      </div>
      <div id="rtResult">${loadingStateHtml()}</div>
    `;

    async function load() {
      const tahun = document.getElementById('rtTahun').value;
      document.getElementById('rtResult').innerHTML = loadingStateHtml();
      try {
        const d = await Api.getRekapTahunan(tahun);
        renderResult(d);
      } catch (err) {
        document.getElementById('rtResult').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      }
    }

    function renderResult(d) {
      const el = document.getElementById('rtResult');
      el.innerHTML = `
        <div class="grid kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:18px;">
          <div class="card kpi-card">
            <div class="kpi-label">Total Pemasukan ${d.tahun}</div>
            <div class="kpi-value tabular-nums amount-pos">${formatRupiah(d.total_pemasukan)}</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-label">Total Pengeluaran ${d.tahun}</div>
            <div class="kpi-value tabular-nums amount-neg">${formatRupiah(d.total_pengeluaran)}</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-label">Saldo Akhir Tahun</div>
            <div class="kpi-value tabular-nums">${formatRupiah(d.saldo_akhir)}</div>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Bulan</th><th class="num">Pemasukan</th><th class="num">Pengeluaran</th><th class="num">Saldo</th></tr></thead>
            <tbody>
              ${d.per_bulan.map((b) => `<tr>
                <td>${BULAN_NAMA[b.bulan]}</td>
                <td class="num amount-pos">${formatRupiah(b.total_masuk)}</td>
                <td class="num amount-neg">${formatRupiah(b.total_keluar)}</td>
                <td class="num" style="font-weight:700;">${formatRupiah(b.saldo)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    document.getElementById('btnLoadRT').onclick = load;
    load();
  }

  render();
};
window.Views = ViewsL;
