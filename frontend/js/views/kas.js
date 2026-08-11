// views/kas.js

const Views2 = window.Views || {};

function kasViewFactory(jenis) {
  // jenis: 'masuk' | 'keluar'
  const isMasuk = jenis === 'masuk';
  const prefix = isMasuk ? 'KM' : 'KK';
  const title = isMasuk ? 'Kas Masuk' : 'Kas Keluar';
  const getFn = isMasuk ? Api.getKasMasuk : Api.getKasKeluar;
  const addFn = isMasuk ? Api.addKasMasuk : Api.addKasKeluar;
  const editFn = isMasuk ? Api.editKasMasuk : Api.editKasKeluar;
  const delFn = isMasuk ? Api.deleteKasMasuk : Api.deleteKasKeluar;
  const catLabel = isMasuk ? 'Sumber Pemasukan' : 'Kategori Pengeluaran';
  const catField = isMasuk ? 'sumber' : 'kategori';
  const kategoriOptions = ['Konsumsi', 'Transportasi', 'Peralatan', 'Operasional', 'Piutang Anggota', 'Lainnya'];

  return async function (container, ctx) {
    const isAdmin = ctx.user.role === 'admin';

    container.innerHTML = `
      <div class="section-title">
        <h2>${title}</h2>
        <div class="actions">
          ${isAdmin ? `<button class="btn btn-primary btn-sm" id="btnAddKas">+ Tambah ${title}</button>` : ''}
        </div>
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

    async function load() {
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
            : { name: 'kategori', label: 'Kategori Pengeluaran', type: 'select', options: kategoriOptions },
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

    if (isAdmin) document.getElementById('btnAddKas').onclick = () => openForm(null);
    document.getElementById('btnFilterKas').onclick = load;
    load();
  };
}

Views2.kasMasuk = kasViewFactory('masuk');
Views2.kasKeluar = kasViewFactory('keluar');
window.Views = Views2;
