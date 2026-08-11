// views/anggota.js

const ViewsA = window.Views || {};

ViewsA.anggota = async function (container, ctx) {
  container.innerHTML = `
    <div class="section-title">
      <h2>Kelola Akun Anggota</h2>
      <div class="actions">
        <button class="btn btn-primary btn-sm" id="btnAddAnggota">+ Tambah Akun</button>
      </div>
    </div>
    <div id="anggotaList">${loadingStateHtml()}</div>
  `;

  async function load() {
    document.getElementById('anggotaList').innerHTML = loadingStateHtml();
    try {
      const users = await Api.getAnggota();
      renderList(users);
    } catch (err) {
      document.getElementById('anggotaList').innerHTML = `<div class="card empty-state">${escapeHtml(err.message)}</div>`;
      showToast(err.message, 'error');
    }
  }

  function renderList(users) {
    const wrap = document.getElementById('anggotaList');
    if (users.length === 0) {
      wrap.innerHTML = `<div class="card">${emptyStateHtml('Belum ada akun', 'Tambahkan akun admin atau anggota.')}</div>`;
      return;
    }
    wrap.innerHTML = users.map((u) => `
      <div class="member-card" data-id="${escapeHtml(u.id)}">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <div class="sidebar-user-avatar" style="background:var(--color-primary-light);color:var(--color-primary-dark);">${initials(u.nama)}</div>
          <div style="min-width:0;">
            <div class="name">${escapeHtml(u.nama)} <span class="badge-role ${u.role === 'admin' ? '' : 'member'}">${u.role}</span></div>
            <div class="sub">@${escapeHtml(u.username)}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="icon-btn" data-act="edit" title="Edit">${Icons.edit}</button>
          ${u.username !== ctx.user.username ? `<button class="icon-btn" data-act="delete" title="Hapus">${Icons.trash}</button>` : ''}
        </div>
      </div>
    `).join('');

    staggerFadeIn(wrap, '.member-card');

    wrap.querySelectorAll('[data-act="edit"]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.closest('.member-card').dataset.id;
        const user = users.find((u) => String(u.id) === id);
        openForm(user);
      };
    });
    wrap.querySelectorAll('[data-act="delete"]').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.closest('.member-card').dataset.id;
        const user = users.find((u) => String(u.id) === id);
        const okDel = await showConfirm({ title: `Hapus akun "${user.nama}"?`, message: 'Akun tidak akan bisa login lagi setelah dihapus.' });
        if (!okDel) return;
        try {
          await Api.deleteAnggota(id);
          showToast('Akun berhasil dihapus.');
          load();
        } catch (err) { showToast(err.message, 'error'); }
      };
    });
  }

  function openForm(user) {
    const isEdit = !!user;
    showFormModal({
      title: isEdit ? `Edit Akun — ${user.nama}` : 'Tambah Akun Baru',
      submitLabel: isEdit ? 'Simpan Perubahan' : 'Tambah Akun',
      initialValues: user ? { nama: user.nama, role: user.role, username: user.username } : { role: 'anggota' },
      fields: [
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true },
        { name: 'username', label: 'Username', type: 'text', required: !isEdit, placeholder: isEdit ? undefined : 'untuk login' },
        { name: 'role', label: 'Role', type: 'select', required: true, options: [{ value: 'anggota', label: 'Anggota (read-only)' }, { value: 'admin', label: 'Admin (akses penuh)' }] },
        { name: 'password', label: isEdit ? 'Password Baru' : 'Password', type: 'text', required: !isEdit, placeholder: isEdit ? 'Kosongkan jika tidak ingin mengubah' : '' }
      ],
      onSubmit: async (values) => {
        if (isEdit) {
          const payload = { id: user.id, nama: values.nama, role: values.role };
          if (values.password) payload.password = values.password;
          await Api.editAnggota(payload);
          showToast('Akun berhasil diperbarui.');
        } else {
          await Api.addAnggota(values);
          showToast('Akun berhasil ditambahkan.');
        }
        load();
      }
    });
  }

  document.getElementById('btnAddAnggota').onclick = () => openForm(null);
  load();
};
window.Views = ViewsA;
