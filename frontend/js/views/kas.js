// views/kas.js
// Kas Masuk & Kas Keluar digabung jadi satu halaman dengan tab internal
// (menyederhanakan menu navigasi, terutama di bottom nav mobile).

const Views2 = window.Views || {};

const KAS_KATEGORI_OPTIONS = ['Konsumsi', 'Transportasi', 'Peralatan', 'Operasional', 'Lainnya'];

Views2.kas = async function (container, ctx) {
  const isAdmin = ctx.user.role === 'admin';
  let activeTab = 'masuk'; // 'masuk' | 'keluar'

  container.innerHTML = `
    <div class="section-title">
      <h2>Kas Masuk &amp; Keluar</h2>
      <div class="actions">
        ${isAdmin ? `<button class="btn btn-primary btn-sm" id="btnAddKas">+ Tambah</button>` : ''}
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" data-tab="masuk">Kas Masuk</button>
      <button class="tab-btn" data-tab="keluar">Kas Keluar</button>
    </div>

    <div class="filter-bar" id="kasFilterBar">
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
      <button class="btn btn-primary btn-sm" id="btnFilterKas">Terapkan</button>
    </div>

    <div class="card" style="padding:0 0 4px;margin-bottom:8px;">
      <div style="padding:16px 20px 4px;font-size:13px;color:var(--color-text-muted);" id="kasTotalInfo"></div>
    </div>

    <div id="kasTableWrap">${loadingStateHtml()}</div>
  `;

  function cfg() {
    const isMasuk = activeTab === 'masuk';
    return {
      isMasuk,
      title: isMasuk ? 'Kas Masuk' : 'Kas Keluar',
      getFn: isMasuk ? Api.getKasMasuk : Api.getKasKeluar,
      addFn: isMasuk ? Api.addKasMasuk : Api.addKasKeluar,
      editFn: isMasuk ? Api.editKasMasuk : Api.editKasKeluar,
      delFn: isMasuk ? Api.deleteKasMasuk : Api.deleteKasKeluar,
      catLabel: isMasuk ? 'Sumber Pemasukan' : 'Kategori Pengeluaran',
      catField: isMasuk ? 'sumber' : 'kategori'
    };
  }

  async function load() {
    const { isMasuk, title, getFn } = cfg();
    const bulan = document.querySelector('#kasFilterBar [name=bulan]').value;
    const tahun = document.querySelector('#kasFilterBar [name=tahun]').value;
    document.getElementById('kasTableWrap').innerHTML = loadingStateHtml();
    try {
      const items = await getFn({ bulan, tahun });
      const total = items.reduce((s, i) => s + Number(i.nominal || 0), 0);
      document.getElementById('kasTotalInfo').innerHTML =
        `Total ${title}: <strong class="${isMasuk ? 'amount-pos' : 'amount-neg'}">${formatRupiah(total)}</strong> &middot; ${items.length} transaksi`;
      renderTable(items);
    } catch (err) {
      document.getElementById('kasTableWrap').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      showToast(err.message, 'error');
    }
  }

  function renderTable(items) {
    const { isMasuk, title, catLabel, catField, delFn } = cfg();
    const wrap = document.getElementById('kasTableWrap');
    if (items.length === 0) {
      wrap.innerHTML = `<div class="card">${emptyStateHtml('Belum ada transaksi', `Data ${title.toLowerCase()} akan tampil di sini.`)}</div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Tanggal</th><th>Keterangan</th><th>${catLabel}</th><th class="num">Nominal</th><th>Catatan</th>
            ${isAdmin ? '<th></th>' : ''}
          </tr></thead>
          <tbody>
            ${items.map((it) => `
              <tr data-id="${escapeHtml(it.id)}">
                <td>${it.tanggal ? formatTanggal(it.tanggal) : BULAN_NAMA[it.bulan] + ' ' + it.tahun}</td>
                <td>${escapeHtml(it.keterangan)}</td>
                <td>${escapeHtml(it[catField] || '-')}</td>
                <td class="num ${isMasuk ? 'amount-pos' : 'amount-neg'}">${formatRupiah(it.nominal)}</td>
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
          const okDel = await showConfirm({
            title: `Hapus transaksi ${title}?`,
            message: 'Tindakan ini tidak dapat dibatalkan.'
          });
          if (!okDel) return;
          try {
            await delFn(id);
            showToast('Transaksi berhasil dihapus.');
            load();
          } catch (err) { showToast(err.message, 'error'); }
        };
      });
    }
  }

  function openForm(item) {
    const { isMasuk, title, addFn, editFn, catField } = cfg();
    const isEdit = !!item;
    showFormModal({
      title: isEdit ? `Edit ${title}` : `Tambah ${title}`,
      submitLabel: isEdit ? 'Simpan Perubahan' : 'Tambah',
      initialValues: item ? {
        tanggal: item.tanggal || '', bulan: item.bulan, tahun: item.tahun,
        keterangan: item.keterangan, [catField]: item[catField], nominal: item.nominal, catatan: item.catatan
      } : { tanggal: todayISO(), bulan: currentMonth(), tahun: currentYear() },
      fields: [
        { name: 'tanggal', label: 'Tanggal', type: 'date' },
        { name: 'bulan', label: 'Bulan', type: 'select', required: true, options: BULAN_NAMA.slice(1).map((b, i) => ({ value: i + 1, label: b })) },
        { name: 'tahun', label: 'Tahun', type: 'select', required: true, options: yearOptions(6).map((y) => ({ value: y, label: y })) },
        { name: 'keterangan', label: 'Keterangan', type: 'text', required: true, placeholder: isMasuk ? 'Contoh: Mentas di Kempek' : 'Contoh: Beli konsumsi rapat' },
        isMasuk
          ? { name: 'sumber', label: 'Sumber Pemasukan', type: 'text', placeholder: 'Contoh: Mentas, Donasi, dll' }
          : { name: 'kategori', label: 'Kategori Pengeluaran', type: 'select', options: KAS_KATEGORI_OPTIONS },
        { name: 'nominal', label: 'Nominal (Rp)', type: 'number', required: true, min: 0 },
        { name: 'catatan', label: 'Catatan', type: 'textarea' }
      ],
      onSubmit: async (values) => {
        const payload = {
          tanggal: values.tanggal || '', bulan: values.bulan, tahun: values.tahun,
          keterangan: values.keterangan, nominal: values.nominal, catatan: values.catatan,
          [catField]: values[catField]
        };
        if (isEdit) {
          await editFn(Object.assign({ id: item.id }, payload));
          showToast('Transaksi berhasil diperbarui.');
        } else {
          await addFn(payload);
          showToast('Transaksi berhasil ditambahkan.');
        }
        load();
      }
    });
  }

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
      if (isAdmin) document.getElementById('btnAddKas').textContent = `+ Tambah ${cfg().title}`;
      load();
    };
  });

  if (isAdmin) {
    document.getElementById('btnAddKas').textContent = `+ Tambah ${cfg().title}`;
    document.getElementById('btnAddKas').onclick = () => openForm(null);
  }
  document.getElementById('btnFilterKas').onclick = load;
  load();
};

window.Views = Views2;
