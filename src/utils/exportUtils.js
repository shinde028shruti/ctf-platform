function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const cellValue = (v) => {
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export function toCsv(rows, columns) {
  const header = columns.map(c => escapeCsv(c)).join(',');
  const body = rows.map(row => columns.map(c => escapeCsv(row[c])).join(','));
  return [header, ...body].join('\n');
}

export function downloadCsv({ filename, rows, columns }) {
  downloadFile(filename, toCsv(rows, columns), 'text/csv;charset=utf-8');
}

export function downloadJson(filename, data) {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
}

/**
 * Export data as an .xlsx workbook with one or more sheets.
 * Each sheet: { name, rows } where rows is an array of plain objects.
 */
export async function downloadExcel({ filename, sheets }) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  sheets.forEach(s => {
    const ws = s.rows && s.rows.length
      ? XLSX.utils.json_to_sheet(s.rows)
      : XLSX.utils.aoa_to_sheet([[]]);
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  });
  const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadFile(filename, data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * Export tabular data as a PDF report (jsPDF + autoTable).
 * columns: [{ key, label }] — key indexes row entries, label is the header.
 */
export async function downloadPdf({ filename, title, subtitle, columns, rows, orientation = 'landscape' }) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(116, 100, 220);
  doc.text(title, 40, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  let y = subtitle ? 62 : 60;
  if (subtitle) doc.text(subtitle, 40, y);
  y += 12;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);

  autoTable(doc, {
    startY: y + 12,
    head: [columns.map(c => c.label)],
    body: rows.map(r => columns.map(c => cellValue(r[c.key]))),
    theme: 'grid',
    margin: { left: 40, right: 40, top: 40, bottom: 40 },
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [226, 232, 240],
      fillColor: [18, 21, 44],
      lineColor: [45, 55, 72],
      lineWidth: 0.5,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [116, 100, 220],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [24, 28, 52] },
  });

  doc.save(filename);
}

/**
 * Parse an Excel (.xlsx / .xls) File into a list of sheets.
 * Each sheet: { name, rows } where rows is an array of plain objects.
 */
export async function parseExcelFile(file) {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  return wb.SheetNames.map(name => ({
    name,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[name]),
  }));
}

export function todayStamp() {
  return new Date().toISOString().split('T')[0];
}