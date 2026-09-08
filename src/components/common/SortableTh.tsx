import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '../../hooks/useTableSort';

interface SortableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentSortKey: string;
  currentSortDirection: SortDirection;
  onSort: (key: string, isNumeric?: boolean) => void;
  isNumeric?: boolean;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const SortableTh: React.FC<SortableThProps> = ({
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  isNumeric = false,
  align = 'left',
  children,
  className = '',
  style,
  ...rest
}) => {
  const isActive = currentSortKey === sortKey;

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    // Prevent interfering with resizer handle if dragged
    if ((e.target as HTMLElement).classList.contains('table-col-resizer')) return;
    onSort(sortKey, isNumeric);
  };

  const justify = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';

  const tooltip = isActive
    ? `Ordenado ${currentSortDirection === 'asc' ? (isNumeric ? 'de menor a mayor' : 'alfabéticamente A-Z') : (isNumeric ? 'de mayor a menor' : 'alfabéticamente Z-A')} (Clic para invertir)`
    : `Clic para ordenar ${isNumeric ? 'de mayor a menor' : 'de la A a la Z'}`;

  return (
    <th
      onClick={handleClick}
      className={`sortable-th ${isActive ? 'is-sorted' : ''} ${className}`}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        textAlign: align,
        ...style
      }}
      title={tooltip}
      {...rest}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          justifyContent: justify,
          width: '100%'
        }}
      >
        <span>{children}</span>
        <span
          className="sort-indicator"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            opacity: isActive ? 1 : 0.25,
            color: isActive ? 'var(--color-accent)' : 'inherit',
            transition: 'opacity 0.15s ease, color 0.15s ease'
          }}
        >
          {isActive ? (
            currentSortDirection === 'asc' ? (
              <ArrowUp size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDown size={13} strokeWidth={2.5} />
            )
          ) : (
            <ArrowUpDown size={12} strokeWidth={1.8} />
          )}
        </span>
      </div>
    </th>
  );
};
