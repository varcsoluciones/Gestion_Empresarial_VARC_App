let runtimeCurrencySymbol: string | null = null;

export function setActiveCurrencySymbol(symbol: string): void {
  if (typeof symbol === 'string' && symbol.trim()) {
    runtimeCurrencySymbol = symbol.trim();
  }
}

export function getActiveCurrencySymbol(): string {
  if (runtimeCurrencySymbol) {
    return runtimeCurrencySymbol;
  }
  try {
    const keys = ['VARC_MODULAR_ERP_V1_settings', 'VARC_ERP_settings', 'erp_settings'];
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.monedaSimbolo === 'string' && parsed.monedaSimbolo.trim()) {
          const sym = parsed.monedaSimbolo.trim();
          runtimeCurrencySymbol = sym;
          return sym;
        }
      }
    }
  } catch {}
  return '$';
}

export function formatCurrency(amount: number, _currency = 'MXN', symbol?: string): string {
  const activeSymbol = symbol !== undefined ? symbol : getActiveCurrencySymbol();
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${activeSymbol}0.00`;
  }
  return `${activeSymbol}${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function parseDateSafe(dateString?: string): Date | null {
  if (!dateString) return null;
  const str = String(dateString).trim();
  if (!str) return null;

  // 1. Handle YYYY-MM-DD explicitly to prevent UTC midnight shifts
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0); // Noon local avoids all boundary shift issues
  }

  // 2. Handle any ISO datetime string (with or without 'Z' or timezone offset) by extracting YYYY, MM, DD, HH, mm, ss directly
  // This completely prevents UTC-to-local midnight day-loss (e.g. 2026-10-01T00:00:00.000Z becoming Sep 30 in UTC-6)
  const dateTimeMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dateTimeMatch) {
    const year = parseInt(dateTimeMatch[1], 10);
    const month = parseInt(dateTimeMatch[2], 10) - 1;
    const day = parseInt(dateTimeMatch[3], 10);
    const hour = parseInt(dateTimeMatch[4], 10);
    const minute = parseInt(dateTimeMatch[5], 10);
    const second = dateTimeMatch[6] ? parseInt(dateTimeMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  // Fallback
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Constructs a local ISO date-time string without UTC timezone offset corruption.
 * When given "2026-10-01", it generates "2026-10-01T12:00:00" (or current local time if today),
 * which parses reliably in local time across all timezones without boundary shifts.
 */
export function buildLocalDateISO(dateInput?: string | Date): string {
  const now = new Date();
  const timePart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  if (!dateInput) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}T${timePart}`;
  }

  if (typeof dateInput === 'string') {
    const str = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return `${str}T${timePart}`;
    }
    if (str.includes('T')) {
      // If it contains a timezone suffix Z or offset, strip it to preserve the local date
      return str.replace(/Z|[+-]\d{2}:\d{2}$/, '');
    }
    return `${str}T${timePart}`;
  }

  const y = dateInput.getFullYear();
  const m = String(dateInput.getMonth() + 1).padStart(2, '0');
  const d = String(dateInput.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T${timePart}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = parseDateSafe(dateString);
    if (!d) return dateString;
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const str = String(dateString).trim();
    // If it only has YYYY-MM-DD (no time component), format as date only
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return formatDate(str);
    }
    const d = parseDateSafe(str);
    if (!d) return dateString;
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getFutureLocalDateString(daysToAdd: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the next sequential document number (e.g., FA0001, CO0001, CT0001, CA0001, II0001, AJ0001).
 * Scans all existing documents to find the highest numeric suffix and increments by 1.
 * If passed a numeric count fallback, it safely calculates prefix + (count + 1).
 */
export function getNextDocNumber(
  prefix: string,
  itemsOrCount: Array<{ id?: string; numero?: string; numeroFactura?: string; numeroCompra?: string; numeroCotizacion?: string; referenciaDoc?: string; codigo?: string }> | number = []
): string {
  if (typeof itemsOrCount === 'number') {
    const seq = (itemsOrCount + 1).toString().padStart(4, '0');
    return `${prefix.toUpperCase()}${seq}`;
  }

  let maxNumber = 0;
  const regex = new RegExp(`^${prefix}-?(\\d+)$`, 'i');

  if (Array.isArray(itemsOrCount)) {
    itemsOrCount.forEach(item => {
      const candidates = [
        item?.numeroFactura,
        item?.numeroCompra,
        item?.numeroCotizacion,
        item?.numero,
        item?.referenciaDoc,
        item?.codigo,
        item?.id
      ];
      for (const str of candidates) {
        if (str && typeof str === 'string') {
          const match = str.trim().match(regex);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }
    });
  }

  const nextNumber = maxNumber + 1;
  return `${prefix.toUpperCase()}${nextNumber.toString().padStart(4, '0')}`;
}

export function generateDocNumber(
  prefix: string,
  itemsOrCount: Array<{ id?: string; numero?: string; numeroFactura?: string; numeroCompra?: string; numeroCotizacion?: string; referenciaDoc?: string; codigo?: string }> | number = 0
): string {
  return getNextDocNumber(prefix, itemsOrCount);
}

export function calculateWeightedAverageCost(
  currentStock: number,
  currentCost: number,
  newQuantity: number,
  newCost: number
): number {
  if (newQuantity <= 0) return currentCost;
  const currentVal = Math.max(0, currentStock) * currentCost;
  const newVal = newQuantity * newCost;
  const totalStock = Math.max(0, currentStock) + newQuantity;
  if (totalStock === 0) return newCost;
  return Number(((currentVal + newVal) / totalStock).toFixed(2));
}

export function getMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]} ${year}`;
  }
  return monthKey;
}

/**
 * Calculates the next sequential product SKU starting from SKU0001 (e.g. SKU0001, SKU0002, ...).
 * It scans all existing product codes and variant SKUs to find the highest number and increments by 1.
 */
export function getNextProductSKU(products: { codigo?: string; variantes?: { sku?: string }[] }[] = []): string {
  let maxNumber = 0;
  const skuRegex = /^SKU-?(\d+)$/i;

  if (Array.isArray(products)) {
    products.forEach(p => {
      if (p.codigo) {
        const match = p.codigo.trim().match(skuRegex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
      if (p.variantes && Array.isArray(p.variantes)) {
        p.variantes.forEach(v => {
          if (v && v.sku) {
            const vMatch = v.sku.trim().match(skuRegex);
            if (vMatch) {
              const vNum = parseInt(vMatch[1], 10);
              if (!isNaN(vNum) && vNum > maxNumber) {
                maxNumber = vNum;
              }
            }
          }
        });
      }
    });
  }

  const nextNumber = maxNumber + 1;
  return `SKU${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Calculates the next sequential entity ID for a given prefix (e.g. CL0001, PR0001, AC0001, DE0001, GA0001).
 * Scans all existing IDs with that prefix to find the highest number and increments by 1.
 */
export function getNextEntityId(prefix: string, items: { id?: string; codigoContable?: string }[] = []): string {
  let maxNumber = 0;
  const regex = new RegExp(`^${prefix}-?(\\d+)$`, 'i');

  if (Array.isArray(items)) {
    items.forEach(item => {
      const idToCheck = item?.codigoContable || item?.id;
      if (idToCheck) {
        const match = idToCheck.trim().match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
  }

  const nextNumber = maxNumber + 1;
  return `${prefix.toUpperCase()}${nextNumber.toString().padStart(4, '0')}`;
}

