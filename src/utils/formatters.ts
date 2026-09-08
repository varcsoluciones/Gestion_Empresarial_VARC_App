export function formatCurrency(amount: number, _currency = 'MXN', symbol = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0.00`;
  }
  return `${symbol}${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
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
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
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

