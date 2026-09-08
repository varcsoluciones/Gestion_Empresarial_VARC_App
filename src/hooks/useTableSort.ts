import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface UseTableSortOptions<T> {
  defaultKey?: string;
  defaultDirection?: SortDirection;
  defaultIsNumeric?: boolean;
  customGetters?: Record<string, (item: T) => string | number | Date | null | undefined>;
}

export function useTableSort<T>(
  items: T[],
  options?: UseTableSortOptions<T>
) {
  const [sortKey, setSortKey] = useState<string>(options?.defaultKey || '');
  const [sortDirection, setSortDirection] = useState<SortDirection>(options?.defaultDirection || 'desc');

  const requestSort = (key: string, isNumeric = false) => {
    if (sortKey === key) {
      // Toggle direction
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      // If numeric -> default 1st click is 'desc' (Mayor a menor)
      // If text -> default 1st click is 'asc' (A a Z)
      setSortDirection(isNumeric ? 'desc' : 'asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;

    const getter = options?.customGetters?.[sortKey] || ((item: any) => item[sortKey]);

    return [...items].sort((a, b) => {
      let valA = getter(a);
      let valB = getter(b);

      // Handle null/undefined/empty
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      // Direct number comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      // Numeric string or date comparison
      const numA = Number(valA);
      const numB = Number(valB);
      const isNumA = typeof valA !== 'boolean' && valA !== '' && !isNaN(numA);
      const isNumB = typeof valB !== 'boolean' && valB !== '' && !isNaN(numB);

      if (isNumA && isNumB) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Date string comparison (e.g. YYYY-MM-DD or ISO)
      if (typeof valA === 'string' && typeof valB === 'string' && isDateString(valA) && isDateString(valB)) {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }
      }

      // Standard alphabetical string comparison with Spanish collation
      const strA = String(valA).trim().toLowerCase();
      const strB = String(valB).trim().toLowerCase();

      const comparison = strA.localeCompare(strB, 'es', { numeric: true, sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortKey, sortDirection, options?.customGetters]);

  return {
    sortedItems,
    sortKey,
    sortDirection,
    requestSort
  };
}

function isDateString(str: string): boolean {
  if (typeof str !== 'string') return false;
  // Match YYYY-MM-DD or ISO timestamp pattern
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str);
}
