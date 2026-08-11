// views/receh.js

const ViewsR = window.Views || {};

ViewsR.receh = async function (container, ctx) {
  const isAdmin = ctx.user.role === 'admin';
  let activeTab = 'masuk';

  container.innerHTML = `
    <div class="section-title">
      <h2>Uang Receh / Jajan</h2>
      <div class="actions">
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="btnAddReceh">+ Tambah Catatan</button>` : ''}
      </div>
    </div>

    <div class="grid kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));">
      <div class="card kpi-card">
        <div class="kpi-icon tone-info">${Icons.check}</div>
        <div class="kpi-label">Saldo Uang Receh</div>
        <div class="kpi-value tabular-nums" id="recehSaldo">Rp0</div>
        <div class="kpi-sub">Terpisah dari saldo kas utama</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-icon tone-primary">${Icons.check}</div>
        <div class="kpi-label">Total Masuk</div>
        <div class="kpi-value tabular-nums" id="recehMasukTotal">Rp0</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-icon tone-danger">${Icons.alert}</div>
        <div class="kpi-label">Total Keluar</div>
        <div class="kpi-value tabular-nums" id="recehKeluarTotal">Rp0</div>
      </div>
    </div>

    <div class="filter-bar" id="recehFilterBar" style="margin-top:18px;">
      <div class="field">
        <label>Bulan</label>
        <select name="bulan">
          <option value="">Semua</option>
          ${BULAN_NAMA.slice(1).map((b, i) => `<option value="${i + 1}" ${i + 1 === currentMonth() ? 'selected' : ''}>${b}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Tahun</label>
        <select name="tahun">
          <option value="">Semua</option>
          ${yearOptions().map((y) => `<option value="${y}" ${y === currentYear() ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-sm" id="btnFilterReceh">Terapkan</button>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="masuk">Receh Masuk</button>
      <button class="tab-btn" data-tab="keluar">Receh Keluar</button>
    </div>

    <div id="recehTableWrap">${loadingStateHtml()}</div>
  `;

  let lastData = null;

  async function load() {
    const bulan = document.querySelector('#recehFilterBar [name=bulan]').value;
    const tahun = document.querySelector('#recehFilterBar [name=tahun]').value;
    document.getElementById('recehTableWrap').innerHTML = loadingStateHtml();
    try {
      const d = await Api.getReceh({ bulan, tahun });
      lastData = d;
      animateCountUp(document.getElementById('recehSaldo'), d.saldo, { formatter: formatRupiah });
      animateCountUp(document.getElementById('recehMasukTotal'), d.total_masuk, { formatter: formatRupiah });
      animateCountUp(document.getElementById('recehKeluarTotal'), d.total_keluar, { formatter: formatRupiah });
      renderTable();
    } catch (err) {
      document.getElementById('recehTableWrap').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      showToast(err.message, 'error');
    }
  }

  function renderTable() {
    const items = activeTab === 'masuk' ? lastData.masuk : lastData.keluar;
    const wrap = document.getElementById('recehTableWrap');
    if (!items || items.length === 0) {
      wrap.innerHTML = `<div class="card">${emptyStateHtml('Belum ada catatan', `Data receh ${activeTab} akan tampil di sini.`)}</div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Tanggal</th><th>Keterangan</th><th class="num">Nominal</th><th>Catatan</th>
            ${isAdmin ? '<th></th>' : ''}
          </tr></thead>
          <tbody>
            ${items.map((it) => `
              <tr data-id="${escapeHtml(it.id)}">
                <td>${it.tanggal ? formatTanggal(it.tanggal) : BULAN_NAMA[it.bulan] + ' ' + it.tahun}</td>
                <td>${escapeHtml(it.keterangan)}</td>
                <td class="num ${activeTab === 'masuk' ? 'amount-pos' : 'amount-neg'}">${formatRupiah(it.nominal)}</td>
                <td style="color:var(--color-text-muted);">${escapeHtml(it.catatan || '-')}</td>
                ${isAdmin ? `<td class="actions-cell">
                  <button class="icon-btn" data-act="edit" title="Edit">${Icons.edit}</button>
                  <button class="icon-btn" data-act="delete" title="Hapus">${Icons.trash}</button>
                </td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;

    staggerFadeIn(wrap, 'tbody tr');

    if (isAdmin) {
      wrap.querySelectorAll('[data-act="edit"]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.closest('tr').dataset.id;
          const item = items.find((i) => String(i.id) === id);
          openForm(item);
        };
      });
      wrap.querySelectorAll('[data-act="delete"]').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.closest('tr').dataset.id;
          const okDel = await showConfirm({ title: 'Hapus catatan receh?', message: 'Tindakan ini tidak dapat dibatalkan.' });
          if (!okDel) return;
          try {
            const delFn = activeTab === 'masuk' ? Api.deleteRecehMasuk : Api.deleteRecehKeluar;
            await delFn(id);
            showToast('Catatan berhasil dihapus.');
            load();
          } catch (err) { showToast(err.message, 'error'); }
        };
      });
    }
  }

  function openForm(item) {
    const isEdit = !!item;
    const addFn = activeTab === 'masuk' ? Api.addRecehMasuk : Api.addRecehKeluar;
    const editFn = activeTab === 'masuk' ? Api.editRecehMasuk : Api.editRecehKeluar;

    showFormModal({
      title: (isEdit ? 'Edit ' : 'Tambah ') + 'Receh ' + (activeTab === 'masuk' ? 'Masuk' : 'Keluar'),
      submitLabel: isEdit ? 'Simpan Perubahan' : 'Tambah',
      initialValues: item || { tanggal: todayISO(), bulan: currentMonth(), tahun: currentYear() },
      fields: [
        { name: 'tanggal', label: 'Tanggal', type: 'date' },
        { name: 'bulan', label: 'Bulan', type: 'select', required: true, options: BULAN_NAMA.slice(1).map((b, i) => ({ value: i + 1, label: b })) },
        { name: 'tahun', label: 'Tahun', type: 'select', required: true, options: yearOptions(6).map((y) => ({ value: y, label: y })) },
        { name: 'keterangan', label: 'Keterangan', type: 'text', required: true, placeholder: activeTab === 'masuk' ? 'Contoh: Sisa uang jajan' : 'Contoh: Jajan' },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number', required: true, min: 0 },
        { name: 'catatan', label: 'Catatan', type: 'textarea' }
      ],
      onSubmit: async (values) => {
        if (isEdit) {
          await editFn(Object.assign({ id: item.id }, values));
          showToast('Catatan berhasil diperbarui.');
        } else {
          await addFn(values);
          showToast('Catatan berhasil ditambahkan.');
        }
        load();
      }
    });
  }

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderTable();
    };
  });

  if (isAdmin) document.getElementById('btnAddReceh').onclick = () => openForm(null);
  document.getElementById('btnFilterReceh').onclick = load;
  load();
};
window.Views = ViewsR;
