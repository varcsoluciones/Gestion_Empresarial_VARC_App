import React from 'react';
import {
  LayoutDashboard,
  Database,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Calculator,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useTranslation } from '../../i18n/useTranslation';
import { APP_NAME, APP_BRAND } from '../../config/version';
import { AppLogo } from '../common/AppLogo';

export type NavigationTab = 
  | 'dashboard' 
  | 'master-data' 
  | 'purchases' 
  | 'inventory' 
  | 'sales' 
  | 'accounting' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile
}) => {
  const { products, invoices, purchases } = useERP();
  const { t } = useTranslation();

  // Calculate badge alerts
  const lowStockCount = products.filter(p => p.stockActual <= p.stockMinimo).length;
  const pendingInvoicesCount = invoices.filter(i => i.estado === 'emitida' && i.saldoPendiente > 0).length;
  const pendingPurchasesCount = purchases.filter(p => p.estado === 'recibida' && p.saldoPendiente > 0).length;

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard size={19} />
    },
    {
      id: 'master-data',
      label: t.nav.masterData,
      icon: <Database size={19} />
    },
    {
      id: 'purchases',
      label: t.nav.purchases,
      icon: <ShoppingBag size={19} />,
      badge: pendingPurchasesCount > 0 ? pendingPurchasesCount : undefined
    },
    {
      id: 'inventory',
      label: t.nav.inventory,
      icon: <Boxes size={19} />,
      badge: lowStockCount > 0 ? lowStockCount : undefined
    },
    {
      id: 'sales',
      label: t.nav.sales,
      icon: <TrendingUp size={19} />,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined
    },
    {
      id: 'accounting',
      label: t.nav.accounting,
      icon: <Calculator size={19} />
    },
    {
      id: 'reports',
      label: t.nav.reports,
      icon: <BarChart3 size={19} />
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: <Settings size={19} />
    }
  ];

  return (
    <>
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpenMobile ? 'open' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed ? (
            <div className="brand-anchor-card">
              <div className="brand-icon-wrapper">
                <AppLogo size={26} color="#ffffff" />
              </div>
              <div className="brand-info">
                <span className="brand-title">
                  {APP_NAME}
                </span>
                <span className="brand-subtitle">
                  {APP_BRAND}
                </span>
              </div>
            </div>
          ) : (
            <div className="brand-anchor-card collapsed" title={`${APP_NAME} — ${APP_BRAND}`}>
              <div className="brand-icon-wrapper">
                <AppLogo size={26} color="#ffffff" />
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {!isCollapsed && <div className="nav-section-title">Módulos del Sistema</div>}
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-item-icon-wrapper">
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="nav-item-label">{item.label}</span>
                    {isActive && <span className="nav-item-dot" aria-hidden="true" />}
                    {item.badge !== undefined && (
                      <span className="nav-item-badge">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-icon sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
};
