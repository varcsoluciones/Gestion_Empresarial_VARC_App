import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { formatMonthLabel, getMonthKey } from '../../utils/formatters';

interface PeriodSelectorProps {
  value: string; // e.g. "2026-09"
  onChange: (monthKey: string) => void;
  availableMonths?: string[];
  label?: string;
  align?: 'left' | 'right';
  className?: string;
}

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  availableMonths = [],
  label = 'Periodo:',
  align = 'right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current year and month from value (e.g. "2026-09")
  const currentMonthKey = getMonthKey();
  const [selectedYear, selectedMonthIndex] = (() => {
    const parts = (value || currentMonthKey).split('-');
    const y = parseInt(parts[0], 10) || new Date().getFullYear();
    const m = Math.max(0, Math.min(11, (parseInt(parts[1], 10) || 1) - 1));
    return [y, m];
  })();

  // Track the year being viewed in the picker dropdown
  const [pickerYear, setPickerYear] = useState<number>(selectedYear);

  // Sync pickerYear when value changes externally
  useEffect(() => {
    setPickerYear(selectedYear);
  }, [selectedYear]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Quick navigation helpers
  const handleStepMonth = (direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation();
    let newYear = selectedYear;
    let newMonth = selectedMonthIndex + direction;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const formatted = `${pickerYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetCurrentMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(currentMonthKey);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`period-selector-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        userSelect: 'none'
      }}
    >
      {/* Main Pill Control */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '0.2rem 0.35rem',
          boxShadow: 'var(--shadow-sm)',
          gap: '0.25rem',
          transition: 'all var(--transition-fast)'
        }}
      >
        {/* Step Prev Button */}
        <button
          type="button"
          onClick={(e) => handleStepMonth(-1, e)}
          title="Mes anterior"
          aria-label="Mes anterior"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Center Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          title="Seleccionar periodo contable"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: 'none',
            background: isOpen ? 'var(--bg-subtle)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            padding: '0.25rem 0.45rem',
            color: 'var(--text-primary)',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            if (!isOpen) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Calendar size={14} style={{ color: 'var(--color-accent)' }} />
          {label && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.775rem' }}>
              {label}
            </span>
          )}
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {formatMonthLabel(value)}
          </span>
          <ChevronDown
            size={13}
            style={{
              color: 'var(--text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-fast)'
            }}
          />
        </button>

        {/* Step Next Button */}
        <button
          type="button"
          onClick={(e) => handleStepMonth(1, e)}
          title="Mes siguiente"
          aria-label="Mes siguiente"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 100,
            width: '260px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(12px)',
            padding: '0.75rem',
            animation: 'fadeIn var(--transition-fast)'
          }}
        >
          {/* Popover Header: Year Navigator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
              paddingBottom: '0.45rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              onClick={() => setPickerYear(pickerYear - 1)}
              title="Año anterior"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={13} />
            </button>

            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {pickerYear}
            </span>

            <button
              type="button"
              onClick={() => setPickerYear(pickerYear + 1)}
              title="Año siguiente"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          {/* 12 Months Grid (4x3) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.35rem'
            }}
          >
            {MONTH_NAMES_SHORT.map((shortName, idx) => {
              const monthKey = `${pickerYear}-${String(idx + 1).padStart(2, '0')}`;
              const isSelected = monthKey === value;
              const isCurrent = monthKey === currentMonthKey;
              const hasActivity = availableMonths.includes(monthKey);

              return (
                <button
                  key={shortName}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  title={`${MONTH_NAMES_FULL[idx]} ${pickerYear}`}
                  style={{
                    position: 'relative',
                    padding: '0.4rem 0.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected
                      ? '1px solid var(--color-accent)'
                      : isCurrent
                      ? '1px dashed var(--color-accent)'
                      : '1px solid transparent',
                    backgroundColor: isSelected
                      ? 'var(--color-accent)'
                      : isCurrent
                      ? 'var(--color-accent-subtle)'
                      : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : isCurrent
                      ? 'var(--color-accent)'
                      : 'var(--text-primary)',
                    fontSize: '0.775rem',
                    fontWeight: isSelected || isCurrent ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isCurrent ? 'var(--color-accent-subtle)' : 'transparent';
                    }
                  }}
                >
                  <span>{shortName}</span>
                  {isSelected && <Check size={11} />}
                  {hasActivity && !isSelected && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-accent)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Shortcut */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.65rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.725rem'
            }}
          >
            <button
              type="button"
              onClick={handleSetCurrentMonth}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-accent)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.15rem 0.25rem',
                borderRadius: 'var(--radius-sm)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Ir al Mes Actual ({MONTH_NAMES_SHORT[parseInt(currentMonthKey.split('-')[1], 10) - 1]})
            </button>

            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              {formatMonthLabel(value)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
