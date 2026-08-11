// views/dashboard.js

const Views = window.Views || {};

Views.dashboard = async function (container, ctx) {
  container.innerHTML = `
    <div class="filter-bar" id="dashFilterBar">
      <div class="field">
        <label>Bulan</label>
        <select name="bulan">
          <option value="">Semua bulan</option>
          ${BULAN_NAMA.slice(1).map((b, i) => `<option value="${i + 1}" ${i + 1 === currentMonth() ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Tahun</label>
        <select name="tahun">
          ${yearOptions().map((y) => `<option value="${y}" ${y === currentYear() ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-sm" id="btnTerapkanFilter">Terapkan</button>
      <button class="btn btn-outline btn-sm" id="btnResetFilter">Semua Waktu</button>
    </div>

    <div id="kpiHero">${loadingStateHtml('Memuat ringkasan...')}</div>
    <div class="grid kpi-grid" id="kpiGrid"></div>

    <div class="charts-row">
      <div class="card chart-card">
        <h3>Pemasukan vs Pengeluaran (per bulan)</h3>
        <div id="chartBarMasukKeluar">${loadingStateHtml()}</div>
      </div>
      <div class="card chart-card">
        <h3>Perkembangan Saldo Kas</h3>
        <div id="chartLineSaldo">${loadingStateHtml()}</div>
      </div>
    </div>

    <div class="card chart-card" style="margin-top:16px;">
      <h3>Sisa Hutang per Anggota</h3>
      <div id="chartHutang">${loadingStateHtml()}</div>
    </div>
  `;

  async function load(filter = {}) {
    document.getElementById('kpiHero').innerHTML = loadingStateHtml('Memuat ringkasan...');
    document.getElementById('kpiGrid').innerHTML = '';
    try {
      const d = await Api.getDashboard(filter);
      renderKpis(d);
      renderBarChartMasukKeluar(document.getElementById('chartBarMasukKeluar'), d.grafik_bulanan);
      renderLineChartSaldo(document.getElementById('chartLineSaldo'), d.grafik_saldo);
      renderHutangBars(document.getElementById('chartHutang'), d.grafik_hutang);
    } catch (err) {
      document.getElementById('kpiHero').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      showToast(err.message, 'error');
    }
  }

  function renderKpis(d) {
    // Kartu utama (hero): Saldo Kas — angka paling penting, ditonjolkan dengan gaya kartu saldo.
    document.getElementById('kpiHero').innerHTML = `
      <div class="card kpi-hero">
        <div class="kpi-hero-top">
          <div>
            <div class="kpi-label">Saldo Kas Saat Ini</div>
            <div class="kpi-hero-value tabular-nums" id="heroSaldoValue" data-target="${d.saldo_kas}">Rp0</div>
          </div>
          <div class="kpi-hero-icon">${Icons.wallet}</div>
        </div>
        <div class="kpi-hero-sub">Total kas masuk dikurangi kas keluar, termasuk pinjaman &amp; pembayaran hutang anggota</div>
      </div>
    `;
    animateCountUp(document.getElementById('heroSaldoValue'), d.saldo_kas, { formatter: formatRupiah });

    const items = [
      { key: 'total_pemasukan', label: 'Total Pemasukan', value: d.total_pemasukan, tone: 'primary', icon: 'trendUp', sub: 'Sesuai filter periode' },
      { key: 'total_pengeluaran', label: 'Total Pengeluaran', value: d.total_pengeluaran, tone: 'danger', icon: 'trendDown', sub: 'Sesuai filter periode' },
      { key: 'total_hutang', label: 'Sisa Hutang Anggota', value: d.total_hutang, tone: 'accent', icon: 'receipt', sub: 'Belum lunas' },
      { key: 'total_receh', label: 'Uang Receh / Jajan', value: d.total_receh, tone: 'info', icon: 'coins', sub: 'Terpisah dari kas utama' },
      { key: 'jumlah_transaksi', label: 'Jumlah Transaksi', value: d.jumlah_transaksi, tone: 'neutral', icon: 'activity', sub: 'Kas masuk + kas keluar', isCount: true }
    ];

    document.getElementById('kpiGrid').innerHTML = items.map((it) => `
      <div class="card kpi-card">
        <div class="kpi-icon tone-${it.tone}">${Icons[it.icon]}</div>
        <div class="kpi-label">${it.label}</div>
        <div class="kpi-value tabular-nums" data-target="${it.value}" data-count="${it.isCount ? '1' : '0'}">Rp0</div>
        <div class="kpi-sub">${it.sub}</div>
      </div>
    `).join('');

    document.querySelectorAll('#kpiGrid .kpi-value').forEach((el) => {
      const target = Number(el.dataset.target);
      const isCount = el.dataset.count === '1';
      animateCountUp(el, target, { formatter: isCount ? (v) => Math.round(v).toLocaleString('id-ID') : formatRupiah });
    });
  }

  document.getElementById('btnTerapkanFilter').onclick = () => {
    const bulan = document.querySelector('#dashFilterBar [name=bulan]').value;
    const tahun = document.querySelector('#dashFilterBar [name=tahun]').value;
    load({ bulan, tahun });
  };
  document.getElementById('btnResetFilter').onclick = () => {
    document.querySelector('#dashFilterBar [name=bulan]').value = '';
    load({});
  };

  load({ bulan: currentMonth(), tahun: currentYear() });
};
window.Views = Views;
