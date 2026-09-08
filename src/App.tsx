import React, { useState } from 'react';
import { ERPProvider } from './context/ERPContext';
import { Sidebar } from './components/layout/Sidebar';
import type { NavigationTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

import { DashboardPage } from './pages/DashboardPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { AccountingPage } from './pages/AccountingPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAutoTableResizer } from './hooks/useTableResizer';
import { UserGuideModal } from './components/guide/UserGuideModal';
import { QuickNavigationModal } from './components/navigation/QuickNavigationModal';

const AppContent: React.FC = () => {
  useAutoTableResizer();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'master-data':
        return <MasterDataPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <SalesPage />;
      case 'accounting':
        return <AccountingPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="app-main">
        <Topbar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          onOpenQuickNav={() => setIsQuickNavOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
        <div className="app-page-body">
          {renderActivePage()}
        </div>
      </div>

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        initialTab={currentTab}
      />

      <QuickNavigationModal
        isOpen={isQuickNavOpen}
        onClose={() => setIsQuickNavOpen(false)}
        onNavigate={setCurrentTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
}
