import React from 'react';
import { Sun, Moon, TrendingUp, ShoppingBag } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import type { NavigationTab } from './Sidebar';
import type { AccentColor } from '../../types/erp';

interface TopbarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
}

const tabTitles: Record<NavigationTab, { title: string; category: string }> = {
  dashboard: { title: 'Dashboard Ejecutivo', category: 'General' },
  'master-data': { title: 'Datos Maestros', category: 'Administración' },
  purchases: { title: 'Compras & Cuentas por Pagar (CxP)', category: 'Operaciones' },
  inventory: { title: 'Control de Inventarios & Kardex', category: 'Almacén' },
  sales: { title: 'Ventas, Cotizaciones & CxC', category: 'Comercial' },
  accounting: { title: 'Contabilidad & Costos Prorrateados', category: 'Finanzas' },
  reports: { title: 'Reportes Financieros & P&L', category: 'Analítica' },
  settings: { title: 'Configuraciones del Sistema', category: 'Ajustes' }
};

const accentColors: { key: AccentColor; name: string; color: string }[] = [
  { key: 'indigo', name: 'Índigo', color: '#6366f1' },
  { key: 'emerald', name: 'Esmeralda', color: '#10b981' },
  { key: 'sapphire', name: 'Zafiro', color: '#0284c7' },
  { key: 'rose', name: 'Rosa', color: '#f43f5e' },
  { key: 'amber', name: 'Ámbar', color: '#d97706' },
  { key: 'slate', name: 'Grafito', color: '#475569' }
];

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onNavigate
}) => {
  const { settings, updateSettings } = useERP();
  const info = tabTitles[currentTab] || { title: 'ERP', category: 'General' };

  const toggleTheme = () => {
    const newTheme = settings.tema === 'light' ? 'dark' : 'light';
    updateSettings({ tema: newTheme });
  };

  const handleAccentChange = (accent: AccentColor) => {
    updateSettings({ colorAcento: accent });
  };

  return (
    <header className="app-topbar no-print">
      <div className="topbar-left">
        <div className="page-breadcrumb">
          <span>{info.category}</span>
          <span>/</span>
          <span className="page-breadcrumb-current">{info.title}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Accent Color Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
          {accentColors.map((acc) => (
            <button
              key={acc.key}
              type="button"
              onClick={() => handleAccentChange(acc.key)}
              title={`Acento: ${acc.name}`}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: acc.color,
                border: settings.colorAcento === acc.key ? '2px solid var(--text-primary)' : '1px solid transparent',
                cursor: 'pointer',
                transform: settings.colorAcento === acc.key ? 'scale(1.15)' : 'none',
                transition: 'transform var(--transition-fast)'
              }}
            />
          ))}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          title={`Cambiar a modo ${settings.tema === 'light' ? 'oscuro' : 'claro'}`}
        >
          {settings.tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Quick Actions */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('purchases')}
          title="Ir a Compras"
        >
          <ShoppingBag size={15} />
          <span>+ Compra</span>
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onNavigate('sales')}
          title="Ir a Ventas"
        >
          <TrendingUp size={15} />
          <span>+ Factura</span>
        </button>
      </div>
    </header>
  );
};
