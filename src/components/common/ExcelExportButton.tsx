import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { exportHtmlTableToExcel, exportDataToExcel, type ExcelColumnDefinition } from '../../utils/excelExport';

interface ExcelExportButtonProps {
  tableRef?: React.RefObject<HTMLTableElement | null>;
  tableId?: string;
  data?: Record<string, any>[];
  columns?: ExcelColumnDefinition[];
  filename?: string;
  onClick?: () => void;
  title?: string;
  label?: string;
  className?: string;
  variant?: 'outline' | 'subtle' | 'compact';
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({
  tableRef,
  tableId,
  data,
  columns,
  filename = 'Exportacion_Excel',
  onClick,
  title = 'Exportar esta tabla a Excel / CSV',
  label = 'Excel',
  className = '',
  variant = 'outline'
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick();
      return;
    }

    if (data && columns) {
      exportDataToExcel(data, columns, filename);
      return;
    }

    if (tableRef?.current) {
      exportHtmlTableToExcel(tableRef.current, filename);
      return;
    }

    if (tableId) {
      exportHtmlTableToExcel(tableId, filename);
      return;
    }

    // Auto find closest table in parent container if neither ref nor id provided
    const buttonEl = e.currentTarget as HTMLElement;
    const cardOrContainer = buttonEl.closest('.card') || buttonEl.closest('.page-content') || document;
    const table = cardOrContainer.querySelector('table.table') as HTMLTableElement;
    if (table) {
      exportHtmlTableToExcel(table, filename);
    } else {
      alert('No se encontró la tabla para exportar.');
    }
  };

  const isCompact = variant === 'compact';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-excel-export ${isCompact ? 'compact' : ''} ${className}`}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem',
        padding: isCompact ? '0.25rem 0.5rem' : '0.35rem 0.65rem',
        fontSize: '0.775rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
        color: '#107c41',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        flexGrow: 0,
        width: 'auto',
        maxWidth: 'max-content',
        height: isCompact ? '30px' : '34px',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#107c41';
        e.currentTarget.style.color = '#ffffff';
        e.currentTarget.style.borderColor = '#107c41';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 124, 65, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
        e.currentTarget.style.color = '#107c41';
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <FileSpreadsheet size={15} style={{ flexShrink: 0 }} />
      {!isCompact && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
    </button>
  );
};
