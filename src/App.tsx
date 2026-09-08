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
  const [targetSubTab, setTargetSubTab] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);

  const handleNavigate = (tab: NavigationTab, subTab?: string) => {
    setCurrentTab(tab);
    setTargetSubTab(subTab);
  };

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'master-data':
        return <MasterDataPage initialTab={targetSubTab as any} />;
      case 'purchases':
        return <PurchasesPage />;
      case 'inventory':
        return <InventoryPage initialView={targetSubTab as any} />;
      case 'sales':
        return <SalesPage initialTab={targetSubTab as any} />;
      case 'accounting':
        return <AccountingPage initialTab={targetSubTab as any} />;
      case 'reports':
        return <ReportsPage initialReport={targetSubTab as any} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="app-main">
        <Topbar
          currentTab={currentTab}
          onNavigate={(tab) => handleNavigate(tab)}
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
        onNavigate={handleNavigate}
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
