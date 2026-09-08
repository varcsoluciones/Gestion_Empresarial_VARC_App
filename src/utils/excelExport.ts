/**
 * Utility to export tabular data or HTML tables to Excel-compatible CSV files with UTF-8 BOM.
 */

export interface ExcelColumnDefinition {
  key: string;
  label: string;
  formatter?: (val: any) => string | number;
}

/**
 * Escapes a cell value for CSV / Excel
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports structured array of objects to Excel CSV
 */
export function exportDataToExcel(
  data: Record<string, any>[],
  columns: ExcelColumnDefinition[],
  filename = 'Reporte_Exportado'
) {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const headers = columns.map(c => escapeCsvCell(c.label)).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const rawVal = row[col.key];
      const formattedVal = col.formatter ? col.formatter(rawVal) : rawVal;
      return escapeCsvCell(formattedVal);
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  triggerDownload(csvContent, `${filename}_${getTimestampSuffix()}.csv`);
}

/**
 * Exports an existing HTML table to Excel CSV directly from DOM
 */
export function exportHtmlTableToExcel(
  tableElementOrId: HTMLTableElement | string,
  filename = 'Tabla_Exportada'
) {
  const table = typeof tableElementOrId === 'string'
    ? document.getElementById(tableElementOrId) as HTMLTableElement
    : tableElementOrId;

  if (!table) {
    console.warn('Table not found for export');
    return;
  }

  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  if (!tbody) {
    alert('No hay datos en la tabla para exportar.');
    return;
  }

  const rows: string[] = [];

  // Extract headers
  if (thead) {
    const thElements = Array.from(thead.querySelectorAll('th'));
    const headerRow = thElements
      .filter(th => !th.classList.contains('no-export') && th.innerText.trim() !== '')
      .map(th => {
        // Clone and remove resizers or action buttons from header text
        const clone = th.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.table-col-resizer, button, .no-export').forEach(el => el.remove());
        return escapeCsvCell(clone.innerText.replace(/\r?\n|\r/g, ' ').trim());
      });
    if (headerRow.length > 0) {
      rows.push(headerRow.join(','));
    }
  }

  // Extract body rows
  const trElements = Array.from(tbody.querySelectorAll('tr'));
  trElements.forEach(tr => {
    const tdElements = Array.from(tr.querySelectorAll('td'));
    if (tdElements.length === 0) return;

    // Check if this row is an empty state or nested expanded breakdown
    if (tdElements.length === 1 && tdElements[0].getAttribute('colspan')) {
      const text = tdElements[0].innerText.trim();
      if (text.includes('No se registraron') || text.includes('No hay')) {
        return;
      }
    }

    const rowCells = tdElements
      .filter(td => !td.classList.contains('no-export'))
      .map(td => {
        const clone = td.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('button, .no-export, .table-col-resizer').forEach(el => el.remove());
        return escapeCsvCell(clone.innerText.replace(/\r?\n|\r/g, ' ').trim());
      });

    if (rowCells.some(cell => cell.length > 0)) {
      rows.push(rowCells.join(','));
    }
  });

  if (rows.length === 0) {
    alert('No hay filas para exportar.');
    return;
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  triggerDownload(csvContent, `${filename}_${getTimestampSuffix()}.csv`);
}

function getTimestampSuffix(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
