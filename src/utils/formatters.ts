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
  const currentYear = new Date().getFullYear();
  const seq = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${currentYear}-${seq}`;
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
