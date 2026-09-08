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

  // Handle YYYY-MM-DD explicitly to prevent UTC midnight shifts on negative timezones (e.g. America/Mexico)
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0); // Noon local avoids all boundary shift issues
  }

  // Handle date-time strings with or without timezone
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d;
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

export function generateDocNumber(prefix: string, count: number): string {
  const seq = (count + 1).toString().padStart(4, '0');
  return `${prefix}${seq}`;
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

