// charts.js
// Grafik SVG ringan tanpa dependency eksternal.

function periodeLabel(periode) {
  // periode format "yyyy-mm"
  const [y, m] = periode.split('-');
  return BULAN_SINGKAT[Number(m)] + " '" + y.slice(2);
}

function renderBarChartMasukKeluar(container, data) {
  if (!data || data.length === 0) {
    container.innerHTML = emptyStateHtml('Belum ada data grafik', 'Grafik muncul setelah ada transaksi kas masuk/keluar.');
    return;
  }
  const w = 600, h = 230, padL = 44, padB = 28, padT = 14, padR = 10;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.masuk, d.keluar)));
  const groupW = chartW / data.length;
  const barW = Math.min(16, groupW / 3.2);

  let bars = '';
  let labels = '';
  const gridLines = 4;
  let grid = '';
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (chartH / gridLines) * i;
    const val = maxVal - (maxVal / gridLines) * i;
    grid += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="var(--color-border)" stroke-width="1" />`;
    grid += `<text x="${padL - 8}" y="${y + 4}" font-size="9.5" text-anchor="end" fill="var(--color-text-faint)">${formatCompact_(val)}</text>`;
  }

  data.forEach((d, i) => {
    const gx = padL + groupW * i;
    const hMasuk = (d.masuk / maxVal) * chartH;
    const hKeluar = (d.keluar / maxVal) * chartH;
    const xMasuk = gx + groupW / 2 - barW - 3;
    const xKeluar = gx + groupW / 2 + 3;
    bars += `<rect x="${xMasuk}" y="${padT + chartH - hMasuk}" width="${barW}" height="${hMasuk}" rx="3" style="fill:var(--color-primary)"><title>Masuk: ${formatRupiah(d.masuk)}</title></rect>`;
    bars += `<rect x="${xKeluar}" y="${padT + chartH - hKeluar}" width="${barW}" height="${hKeluar}" rx="3" style="fill:var(--color-danger)"><title>Keluar: ${formatRupiah(d.keluar)}</title></rect>`;
    labels += `<text x="${gx + groupW / 2}" y="${h - 8}" font-size="10" text-anchor="middle" fill="var(--color-text-faint)">${periodeLabel(d.periode)}</text>`;
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible;">
      ${grid}${bars}${labels}
    </svg>
    <div style="display:flex;gap:16px;margin-top:10px;font-size:12px;color:var(--color-text-muted);">
      <span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:2px;background:var(--color-primary);display:inline-block;"></span>Pemasukan</span>
      <span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:9px;height:9px;border-radius:2px;background:var(--color-danger);display:inline-block;"></span>Pengeluaran</span>
    </div>`;
}

function renderLineChartSaldo(container, data) {
  if (!data || data.length === 0) {
    container.innerHTML = emptyStateHtml('Belum ada data', 'Grafik saldo muncul setelah ada transaksi.');
    return;
  }
  const w = 420, h = 200, padL = 44, padB = 26, padT = 14, padR = 14;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const values = data.map((d) => d.saldo);
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  const range = (maxVal - minVal) || 1;

  const points = data.map((d, i) => {
    const x = padL + (chartW / Math.max(1, data.length - 1)) * i;
    const y = padT + chartH - ((d.saldo - minVal) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${padT + chartH} L${points[0].x.toFixed(1)},${padT + chartH} Z`;

  const zeroY = padT + chartH - ((0 - minVal) / range) * chartH;

  let labels = '';
  data.forEach((d, i) => {
    if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
      labels += `<text x="${points[i].x}" y="${h - 6}" font-size="9.5" text-anchor="middle" fill="var(--color-text-faint)">${periodeLabel(d.periode)}</text>`;
    }
  });

  const dots = points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="3" style="fill:var(--color-primary)"><title>${periodeLabel(data[i].periode)}: ${formatRupiah(data[i].saldo)}</title></circle>`).join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible;">
      <defs>
        <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:0.25" />
          <stop offset="100%" style="stop-color:var(--color-primary);stop-opacity:0" />
        </linearGradient>
      </defs>
      <line x1="${padL}" y1="${zeroY}" x2="${w - padR}" y2="${zeroY}" stroke="var(--color-border)" stroke-width="1" />
      <path d="${areaPath}" fill="url(#saldoGrad)" stroke="none" />
      <path d="${linePath}" fill="none" style="stroke:var(--color-primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
      ${labels}
    </svg>`;
}

function renderHutangBars(container, data) {
  if (!data || data.length === 0) {
    container.innerHTML = emptyStateHtml('Tidak ada hutang aktif', 'Semua anggota lunas, atau belum ada data hutang.');
    return;
  }
  const sorted = [...data].sort((a, b) => b.sisa - a.sisa).slice(0, 8);
  const maxVal = Math.max(...sorted.map((d) => d.sisa), 1);

  container.innerHTML = sorted.map((d) => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;">
        <span style="font-weight:600;">${escapeHtml(d.nama)}</span>
        <span class="tabular-nums" style="color:var(--color-danger);font-weight:700;">${formatRupiah(d.sisa)}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${(d.sisa / maxVal) * 100}%; background:var(--color-danger);"></div></div>
    </div>
  `).join('');
}

function formatCompact_(n) {
  const num = Number(n);
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(0) + 'rb';
  return String(Math.round(num));
}
