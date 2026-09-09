import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Search, Check } from 'lucide-react';

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface ComboboxInlineProps {
  options: ComboboxOption[];
  value: string;
  onChange: (selectedId: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCreateInline?: boolean;
  onCreateInline?: (queryText: string) => void;
  onOpenQuickCreateModal?: () => void;
  quickCreateLabel?: string;
  disabled?: boolean;
  hideSearch?: boolean;
  containerStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
  className?: string;
}

export const ComboboxInline: React.FC<ComboboxInlineProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar opción...',
  searchPlaceholder = 'Buscar...',
  allowCreateInline = false,
  onCreateInline,
  onOpenQuickCreateModal,
  quickCreateLabel = '+ Crear nuevo',
  disabled = false,
  hideSearch,
  containerStyle,
  buttonStyle,
  dropdownStyle,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const showSearch = hideSearch !== undefined ? !hideSearch : (options.length > 5 || allowCreateInline);

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateInline = () => {
    if (searchTerm.trim() && onCreateInline) {
      onCreateInline(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className={`combobox-container ${className}`.trim()} ref={containerRef} style={containerStyle}>
      <button
        type="button"
        className="form-control"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          ...buttonStyle
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? (
            <span>
              <strong style={{ fontWeight: 600 }}>{selectedOption.label}</strong>
              {selectedOption.sublabel && (
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.5rem' }} />
      </button>

      {isOpen && (
        <div className="combobox-dropdown" style={dropdownStyle}>
          {showSearch && (
            <div style={{ position: 'relative', padding: '0.4rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2rem', fontSize: '0.825rem', padding: '0.45rem 0.45rem 0.45rem 2rem' }}
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  className={`combobox-item ${opt.id === value ? 'active' : ''}`}
                  onClick={() => handleSelect(opt.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{opt.label}</span>
                    {opt.sublabel && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opt.sublabel}</span>}
                  </div>
                  {opt.id === value && <Check size={14} style={{ color: 'var(--color-accent)' }} />}
                </div>
              ))
            ) : (
              <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se encontraron resultados
              </div>
            )}
          </div>

          {allowCreateInline && searchTerm.trim().length > 0 && onCreateInline && (
            <div className="combobox-create-btn" onClick={handleCreateInline}>
              <Plus size={14} />
              <span>Crear categoría: "<strong>{searchTerm.trim()}</strong>"</span>
            </div>
          )}

          {onOpenQuickCreateModal && (
            <div
              className="combobox-create-btn"
              onClick={() => {
                setIsOpen(false);
                onOpenQuickCreateModal();
              }}
            >
              <Plus size={14} />
              <span>{quickCreateLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
