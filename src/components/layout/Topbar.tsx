import React from 'react';
import { Sun, Moon, TrendingUp, ShoppingBag, Settings } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useTranslation } from '../../i18n/useTranslation';
import type { NavigationTab } from './Sidebar';

interface TopbarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickPurchase?: () => void;
}

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
        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          title={`Cambiar a modo ${settings.tema === 'light' ? 'oscuro' : 'claro'}`}
        >
          {settings.tema === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className={`btn-icon ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Configuración de la Empresa & Apariencia"
        >
          <Settings size={18} />
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
