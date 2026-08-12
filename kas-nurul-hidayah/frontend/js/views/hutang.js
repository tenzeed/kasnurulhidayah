// views/hutang.js

const ViewsH = window.Views || {};

ViewsH.hutang = async function (container, ctx) {
  const isAdmin = ctx.user.role === 'admin';
  let allHutangItems = [];

  container.innerHTML = `
    <div class="section-title">
      <h2>Hutang Anggota</h2>
      <div class="actions">
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="btnAddHutang">+ Catat Hutang Baru</button>` : ''}
      </div>
    </div>
    <div class="grid kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:18px;">
      <div class="card kpi-card">
        <div class="kpi-icon tone-danger">${Icons.alert}</div>
        <div class="kpi-label">Total Sisa Hutang</div>
        <div class="kpi-value tabular-nums" id="totalSisaHutang">Rp0</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-icon tone-primary">${Icons.check}</div>
        <div class="kpi-label">Anggota Lunas</div>
        <div class="kpi-value tabular-nums" id="totalLunas">0</div>
      </div>
    </div>
    <div id="hutangList">${loadingStateHtml()}</div>
  `;

  async function load() {
    document.getElementById('hutangList').innerHTML = loadingStateHtml();
    try {
      const items = await Api.getHutang({});
      allHutangItems = items;
      renderList(items);
      const totalSisa = items.reduce((s, i) => s + i.sisa_hutang, 0);
      const totalLunas = items.filter((i) => i.status === 'Lunas').length;
      animateCountUp(document.getElementById('totalSisaHutang'), totalSisa, { formatter: formatRupiah });
      animateCountUp(document.getElementById('totalLunas'), totalLunas, { formatter: (v) => Math.round(v).toLocaleString('id-ID') });
    } catch (err) {
      document.getElementById('hutangList').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      showToast(err.message, 'error');
    }
  }

  function renderList(items) {
    const wrap = document.getElementById('hutangList');
    if (items.length === 0) {
      wrap.innerHTML = `<div class="card">${emptyStateHtml('Belum ada data hutang', 'Catatan hutang anggota akan muncul di sini.')}</div>`;
      return;
    }

    wrap.innerHTML = items.map((h) => `
      <div class="card" style="margin-bottom:12px;" data-id="${escapeHtml(h.id)}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:800;font-size:15px;">${escapeHtml(h.nama_anggota)}</div>
            <div style="font-size:12.5px;color:var(--color-text-muted);margin-top:2px;">${escapeHtml(h.keterangan || '-')} &middot; ${formatTanggal(h.tanggal)}</div>
          </div>
          <span class="pill ${h.status === 'Lunas' ? 'pill-success' : 'pill-danger'}">${h.status}</span>
        </div>
        <div class="two-col" style="margin-top:14px;">
          <div>
            <div class="kpi-label" style="margin-bottom:2px;">Total Hutang</div>
            <div class="tabular-nums" style="font-weight:700;">${formatRupiah(h.nominal)}</div>
          </div>
          <div>
            <div class="kpi-label" style="margin-bottom:2px;">Sisa Hutang</div>
            <div class="tabular-nums" style="font-weight:700;color:${h.sisa_hutang > 0 ? 'var(--color-danger)' : 'var(--color-primary)'};">${formatRupiah(h.sisa_hutang)}</div>
          </div>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, (h.total_dibayar / h.nominal) * 100)}%;"></div></div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
          <button class="btn btn-outline btn-sm" data-act="toggle-riwayat">Riwayat Pembayaran (${h.riwayat_pembayaran.length})</button>
          ${(isAdmin && h.status !== 'Lunas') ? `<button class="btn btn-primary btn-sm" data-act="bayar">+ Catat Pembayaran</button>` : ''}
        </div>

        <div class="riwayat-panel hidden" style="margin-top:14px;border-top:1px solid var(--color-border);padding-top:12px;">
          ${h.riwayat_pembayaran.length === 0 ? `<p style="font-size:13px;color:var(--color-text-faint);">Belum ada pembayaran.</p>` :
            h.riwayat_pembayaran.map((p) => `
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px dashed var(--color-border);">
                <span style="color:var(--color-text-muted);">${formatTanggal(p.tanggal)}${p.catatan ? ' &middot; ' + escapeHtml(p.catatan) : ''}</span>
                <span class="tabular-nums amount-pos">${formatRupiah(p.nominal)}</span>
              </div>
            `).join('')
          }
        </div>
      </div>
    `).join('');

    staggerFadeIn(wrap, '.card');

    wrap.querySelectorAll('[data-act="toggle-riwayat"]').forEach((btn) => {
      btn.onclick = () => btn.closest('.card').querySelector('.riwayat-panel').classList.toggle('hidden');
    });

    if (isAdmin) {
      wrap.querySelectorAll('[data-act="bayar"]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.closest('.card').dataset.id;
          const item = items.find((i) => String(i.id) === id);
          openPaymentForm(item);
        };
      });
    }
  }

  function openAddHutangForm() {
    showFormModal({
      title: 'Catat Hutang Baru',
      submitLabel: 'Simpan',
      initialValues: { tanggal: todayISO() },
      fields: [
        { name: 'nama_anggota', label: 'Nama Anggota', type: 'text', required: true },
        { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
        { name: 'nominal', label: 'Nominal Hutang (Rp)', type: 'number', required: true, min: 1 },
        { name: 'keterangan', label: 'Keterangan', type: 'textarea', placeholder: 'Contoh: Pinjaman kegiatan' }
      ],
      onSubmit: async (values) => {
        await Api.addHutang(values);
        showToast('Hutang dicatat & saldo kas otomatis berkurang sejumlah pinjaman.');
        load();
      }
    });
  }

  function openPaymentForm(item) {
    // Hitung total sisa SELURUH hutang milik anggota ini (bukan cuma catatan ini),
    // karena kelebihan bayar akan otomatis mencicil hutang lain milik anggota yang sama.
    const debtsOfMember = allHutangItems.filter((h) => h.nama_anggota.toLowerCase() === item.nama_anggota.toLowerCase());
    const totalSisaAnggota = debtsOfMember.reduce((s, h) => s + h.sisa_hutang, 0);
    const adaHutangLain = debtsOfMember.length > 1;

    showFormModal({
      title: `Catat Pembayaran — ${item.nama_anggota}`,
      submitLabel: 'Simpan Pembayaran',
      initialValues: { tanggal: todayISO() },
      fields: [
        { name: 'tanggal', label: 'Tanggal Pembayaran', type: 'date', required: true },
        {
          name: 'nominal',
          label: `Nominal Pembayaran (Rp) — sisa catatan ini ${formatRupiah(item.sisa_hutang)}`,
          type: 'number', required: true, min: 1,
          placeholder: adaHutangLain ? `Maks. total ${formatRupiah(totalSisaAnggota)} (gabungan semua hutang ${item.nama_anggota})` : undefined
        },
        { name: 'catatan', label: 'Catatan', type: 'text' }
      ],
      onSubmit: async (values) => {
        const result = await Api.addPembayaranHutang(Object.assign({ hutang_id: item.id }, values));
        if (result.alokasi && result.alokasi.some((a) => a.kelebihan)) {
          const jumlahLain = result.alokasi.filter((a) => a.kelebihan).length;
          showToast(`Pembayaran tercatat. Kelebihan otomatis mencicil ${jumlahLain} hutang lain milik ${item.nama_anggota}.`);
        } else {
          showToast('Pembayaran tercatat & saldo kas otomatis bertambah.');
        }
        load();
      }
    });

    if (adaHutangLain) {
      showToast(`${item.nama_anggota} punya ${debtsOfMember.length} catatan hutang. Total sisa keseluruhan: ${formatRupiah(totalSisaAnggota)}.`);
    }
  }

  if (isAdmin) document.getElementById('btnAddHutang').onclick = openAddHutangForm;
  load();
};
window.Views = ViewsH;
