// components.js

const Icons = {
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  inbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></svg>`,

  // Set ikon finansial — dipakai di kartu KPI dashboard & ringkasan lain (bukan simbol $)
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="6" width="19.6" height="13.5" rx="2.6"/><path d="M2.2 9.8h19.6"/><circle cx="16.6" cy="14.3" r="1.5" fill="currentColor" stroke="none"/></svg>`,
  trendUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,17 9,11 13,15 21,7"/><polyline points="15,7 21,7 21,13"/></svg>`,
  trendDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,7 9,13 13,9 21,17"/><polyline points="15,17 21,17 21,11"/></svg>`,
  receipt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1Z"/><path d="M9 8.5h6M9 12.5h6M9 16.5h3.5"/></svg>`,
  coins: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8.5" r="6"/><circle cx="15.5" cy="15.5" r="6"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5-7 4 14 2.5-7H21"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>`
};

// ---------------- TOAST ----------------
function ensureToastStack() {
  let stack = document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'success') {
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.innerHTML = (type === 'error' ? Icons.alert : Icons.check) + `<span>${escapeHtml(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

// ---------------- MODAL (generic) ----------------
function openOverlay(overlay) {
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', escCloseHandler);
}
function closeOverlay(overlay) {
  overlay.classList.remove('open');
  document.removeEventListener('keydown', escCloseHandler);
  setTimeout(() => overlay.remove(), 220);
}
function escCloseHandler(e) {
  if (e.key === 'Escape') {
    const overlay = document.querySelector('.modal-overlay.open');
    if (overlay) closeOverlay(overlay);
  }
}

function showConfirm({ title = 'Konfirmasi', message = '', confirmLabel = 'Hapus', cancelLabel = 'Batal', danger = true }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal confirm" role="dialog" aria-modal="true">
        <div class="modal-body">
          <div class="confirm-icon">${Icons.alert}</div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="modal-foot" style="justify-content:center; border-top:none; padding-top:8px;">
          <button class="btn btn-outline" data-act="cancel">${escapeHtml(cancelLabel)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { closeOverlay(overlay); resolve(false); }
    });
    overlay.querySelector('[data-act="cancel"]').onclick = () => { closeOverlay(overlay); resolve(false); };
    overlay.querySelector('[data-act="confirm"]').onclick = () => { closeOverlay(overlay); resolve(true); };
    openOverlay(overlay);
  });
}

/**
 * Modal form generik.
 * fields: [{ name, label, type: 'text'|'number'|'date'|'select'|'textarea', options, required, placeholder, value }]
 * onSubmit(values) harus mengembalikan Promise. Jika resolve -> modal ditutup. Jika reject(err) -> tampilkan error.
 */
function showFormModal({ title, fields, submitLabel = 'Simpan', onSubmit, initialValues = {} }) {
  return new Promise((resolveOuter) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const fieldsHtml = fields.map((f) => {
      const val = initialValues[f.name] !== undefined ? initialValues[f.name] : (f.value !== undefined ? f.value : '');
      const reqAttr = f.required ? 'required' : '';
      let inputHtml = '';
      if (f.type === 'select') {
        const opts = f.options.map((o) => {
          const optVal = typeof o === 'object' ? o.value : o;
          const optLabel = typeof o === 'object' ? o.label : o;
          const selected = String(optVal) === String(val) ? 'selected' : '';
          return `<option value="${escapeHtml(optVal)}" ${selected}>${escapeHtml(optLabel)}</option>`;
        }).join('');
        inputHtml = `<select name="${f.name}" ${reqAttr}>${opts}</select>`;
      } else if (f.type === 'textarea') {
        inputHtml = `<textarea name="${f.name}" rows="3" placeholder="${escapeHtml(f.placeholder || '')}" ${reqAttr}>${escapeHtml(val)}</textarea>`;
      } else {
        inputHtml = `<input type="${f.type || 'text'}" name="${f.name}" value="${escapeHtml(val)}" placeholder="${escapeHtml(f.placeholder || '')}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${reqAttr} />`;
      }
      return `<div class="field" data-field="${f.name}">
        <label>${escapeHtml(f.label)}${f.required ? '' : ' <span style="font-weight:400;color:var(--color-text-faint);">(opsional)</span>'}</label>
        ${inputHtml}
        <div class="field-error"></div>
      </div>`;
    }).join('');

    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>${escapeHtml(title)}</h3>
          <button class="modal-close" data-act="close" aria-label="Tutup">${Icons.close}</button>
        </div>
        <form id="modalForm">
          <div class="modal-body">${fieldsHtml}</div>
          <div class="modal-foot">
            <button type="button" class="btn btn-outline" data-act="close">Batal</button>
            <button type="submit" class="btn btn-primary" data-act="submit">
              <span class="submit-label">${escapeHtml(submitLabel)}</span>
            </button>
          </div>
        </form>
      </div>`;

    const close = () => { closeOverlay(overlay); resolveOuter(null); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('[data-act="close"]').forEach((b) => b.onclick = close);

    const form = overlay.querySelector('#modalForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = overlay.querySelector('[data-act="submit"]');
      const fd = new FormData(form);
      const values = {};
      fields.forEach((f) => { values[f.name] = fd.get(f.name); });

      overlay.querySelectorAll('.field').forEach((el) => el.classList.remove('has-error'));

      submitBtn.disabled = true;
      const originalLabel = submitBtn.querySelector('.submit-label').textContent;
      submitBtn.querySelector('.submit-label').textContent = 'Menyimpan...';

      try {
        const result = await onSubmit(values);
        closeOverlay(overlay);
        resolveOuter(result !== undefined ? result : values);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.querySelector('.submit-label').textContent = originalLabel;
        showToast(err.message || 'Gagal menyimpan data.', 'error');
      }
    });

    openOverlay(overlay);
    setTimeout(() => {
      const firstInput = form.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 250);
  });
}

// ---------------- STATE HELPERS ----------------
function loadingStateHtml(message = 'Memuat data...') {
  return `<div class="loading-state"><div class="spinner"></div><p style="margin-top:12px;font-size:13px;">${escapeHtml(message)}</p></div>`;
}

function emptyStateHtml(title = 'Belum ada data', message = 'Data akan muncul di sini setelah ditambahkan.') {
  return `<div class="empty-state">${Icons.inbox}<h4>${escapeHtml(title)}</h4><p>${escapeHtml(message)}</p></div>`;
}
