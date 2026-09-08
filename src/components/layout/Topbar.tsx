import React from 'react';
import { Sun, Moon, TrendingUp, ShoppingBag } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useTranslation } from '../../i18n/useTranslation';
import type { NavigationTab } from './Sidebar';
import type { AccentColor } from '../../types/erp';

interface TopbarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
}

const accentColors: { key: AccentColor; name: string; color: string }[] = [
  { key: 'blue', name: 'Azul Cupertino', color: '#007aff' },
  { key: 'purple', name: 'Púrpura Apple', color: '#5856d6' },
  { key: 'green', name: 'Verde Apple', color: '#34c759' },
  { key: 'orange', name: 'Naranja Apple', color: '#ff9500' },
  { key: 'pink', name: 'Rosa Apple', color: '#ff2d55' },
  { key: 'teal', name: 'Turquesa Apple', color: '#00c7be' },
  { key: 'graphite', name: 'Gris Espacial', color: '#636366' }
];

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onNavigate
}) => {
  const { settings, updateSettings } = useERP();
  const { t } = useTranslation();

  const tabTitles: Record<NavigationTab, { title: string; category: string }> = {
    dashboard: { title: t.nav.dashboard, category: 'General' },
    'master-data': { title: t.nav.masterData, category: 'Admin' },
    purchases: { title: t.nav.purchases, category: 'Operations' },
    inventory: { title: t.nav.inventory, category: 'Warehouse' },
    sales: { title: t.nav.sales, category: 'Commercial' },
    accounting: { title: t.nav.accounting, category: 'Finance' },
    reports: { title: t.nav.reports, category: 'Analytics' },
    settings: { title: t.nav.settings, category: 'Settings' }
  };

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
          {accentColors.map((acc) => {
            const isSelected = settings.colorAcento === acc.key ||
              (acc.key === 'blue' && settings.colorAcento === 'sapphire') ||
              (acc.key === 'purple' && settings.colorAcento === 'indigo') ||
              (acc.key === 'green' && settings.colorAcento === 'emerald') ||
              (acc.key === 'orange' && settings.colorAcento === 'amber') ||
              (acc.key === 'pink' && settings.colorAcento === 'rose') ||
              (acc.key === 'graphite' && settings.colorAcento === 'slate');

            return (
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
                  border: isSelected ? '2px solid var(--text-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.2)' : 'none',
                  boxShadow: isSelected ? `0 0 0 2px var(--bg-surface), 0 2px 6px ${acc.color}88` : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              />
            );
          })}
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
