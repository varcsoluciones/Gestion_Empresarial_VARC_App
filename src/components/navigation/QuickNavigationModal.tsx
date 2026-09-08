import React, { useState } from 'react';
import {
  Search,
  LayoutDashboard,
  Database,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Calculator,
  BarChart3,
  Settings,
  ArrowRight,
  FileSpreadsheet,
  Receipt,
  FileCheck2,
  Sliders,
  DollarSign,
  PieChart,
  Compass,
  Users,
  Building2,
  Package,
  Tags,
  Clock,
  Coins,
  History,
  Building,
  Palette,
  HardDrive,
  Briefcase
} from 'lucide-react';
import { Modal } from '../common/Modal';
import type { NavigationTab } from '../layout/Sidebar';
import { APP_NAME, APP_BRAND, APP_VERSION } from '../../config/version';

interface QuickNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab, subTab?: string) => void;
}

interface SubTabAccess {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

interface ModuleSection {
  id: NavigationTab;
  name: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  subTabs: SubTabAccess[];
}

export const QuickNavigationModal: React.FC<QuickNavigationModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const modules: ModuleSection[] = [
    {
      id: 'dashboard',
      name: 'Tablero General',
      category: 'Centro de Mando',
      icon: <LayoutDashboard size={20} />,
      color: 'var(--color-accent)',
      subTabs: [
        { id: 'kpis', name: 'Indicadores & KPIs en Vivo', desc: 'Resumen financiero, ventas y compras del mes', icon: <TrendingUp size={15} /> },
        { id: 'cxc-semaforo', name: 'Semáforo de Cobranza CxC', desc: 'Facturas vencidas en mora y cobros en 7 días', icon: <Clock size={15} /> },
        { id: 'stock-alert', name: 'Reabastecimiento de Stock', desc: 'Artículos en stock mínimo o agotados', icon: <Boxes size={15} /> },
        { id: 'cashflow-kpi', name: 'Flujo Proyectado a 30 Días', desc: 'Cobros esperados vs pagos obligatorios', icon: <DollarSign size={15} /> }
      ]
    },
    {
      id: 'master-data',
      name: 'Catálogos & Datos Maestros',
      category: 'Administración',
      icon: <Database size={20} />,
      color: '#3b82f6',
      subTabs: [
        { id: 'products', name: 'Productos & Variantes', desc: 'Inventario por tallas, colores y SKUs', icon: <Package size={15} /> },
        { id: 'clients', name: 'Clientes & Límites de Crédito', desc: 'Condiciones de pago, días de plazo y saldos', icon: <Users size={15} /> },
        { id: 'suppliers', name: 'Proveedores', desc: 'Contactos comerciales y saldos por pagar', icon: <Building2 size={15} /> },
        { id: 'categories', name: 'Categorías de Artículos', desc: 'Clasificación para reportes y catálogo', icon: <Tags size={15} /> }
      ]
    },
    {
      id: 'purchases',
      name: 'Compras & Proveedores (CxP)',
      category: 'Operaciones',
      icon: <ShoppingBag size={20} />,
      color: '#06b6d4',
      subTabs: [
        { id: 'orders', name: 'Órdenes de Compra', desc: 'Generar pedidos de mercancía a proveedores', icon: <ShoppingBag size={15} /> },
        { id: 'received', name: 'Recepción al Almacén', desc: 'Ingreso físico de mercancía y actualización al Kardex', icon: <Boxes size={15} /> },
        { id: 'cxp', name: 'Cuentas por Pagar (CxP)', desc: 'Registro de abonos y liquidación de deudas', icon: <Coins size={15} /> }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventario & Kardex',
      category: 'Almacén',
      icon: <Boxes size={20} />,
      color: '#10b981',
      subTabs: [
        { id: 'stock', name: 'Existencias Físicas', desc: 'Stock actual por variantes y valor monetario total', icon: <Boxes size={15} /> },
        { id: 'kardex', name: 'Kardex Permanente', desc: 'Bitácora inmutable de entradas, salidas y anulaciones', icon: <History size={15} /> },
        { id: 'adjustments', name: 'Ajustes de Inventario', desc: 'Registro de aumentos o mermas con justificación', icon: <Sliders size={15} /> }
      ]
    },
    {
      id: 'sales',
      name: 'Ventas & Cotizaciones (CxC)',
      category: 'Comercial',
      icon: <TrendingUp size={20} />,
      color: '#f59e0b',
      subTabs: [
        { id: 'invoices', name: 'Facturas de Venta', desc: 'Emisión con salida automática de almacén y cobros CxC', icon: <Receipt size={15} /> },
        { id: 'quotes', name: 'Cotizador en Vivo', desc: 'Propuestas comerciales con semáforo de existencias', icon: <FileCheck2 size={15} /> }
      ]
    },
    {
      id: 'accounting',
      name: 'Costos & Contabilidad',
      category: 'Finanzas',
      icon: <Calculator size={20} />,
      color: '#8b5cf6',
      subTabs: [
        { id: 'prorrateo', name: 'Prorrateo de Costos', desc: 'Absorción de gastos en productos para costo real', icon: <PieChart size={15} /> },
        { id: 'expenses', name: 'Gastos Operativos', desc: 'Rentas, nóminas, servicios fijos y variables', icon: <DollarSign size={15} /> },
        { id: 'assets', name: 'Activos Fijos & Depreciación', desc: 'Control de maquinaria y depreciación mensual', icon: <Building size={15} /> }
      ]
    },
    {
      id: 'reports',
      name: 'Reportes Financieros',
      category: 'Analítica',
      icon: <BarChart3 size={20} />,
      color: '#ec4899',
      subTabs: [
        { id: 'pnl', name: 'Estado de Resultados (P&L)', desc: 'Margen bruto, gastos y utilidad neta devengada', icon: <TrendingUp size={15} /> },
        { id: 'balance', name: 'Balance General', desc: 'Activos vs Pasivos y Capital contable', icon: <Building2 size={15} /> },
        { id: 'sales', name: 'Ventas por Producto y Cliente', desc: 'Tablas analíticas con totales y exportación XLS', icon: <FileSpreadsheet size={15} /> },
        { id: 'costs', name: 'Reporte de Costos Unitarios', desc: 'Comparativa de costo compra vs costo absorbido', icon: <Calculator size={15} /> }
      ]
    },
    {
      id: 'settings',
      name: 'Configuración & Sistema',
      category: 'Ajustes',
      icon: <Settings size={20} />,
      color: '#64748b',
      subTabs: [
        { id: 'company', name: 'Datos de la Empresa & Moneda', desc: 'Razón social, RFC, divisa y tasa de impuesto', icon: <Briefcase size={15} /> },
        { id: 'appearance', name: 'Apariencia & Paletas de Color', desc: 'Modo claro/oscuro y 9 colores Apple', icon: <Palette size={15} /> },
        { id: 'backup', name: 'Copias de Seguridad .JSON', desc: 'Descarga y restauración de respaldos', icon: <HardDrive size={15} /> }
      ]
    }
  ];

  const quickShortcuts = [
    { label: 'Facturación', icon: <Receipt size={14} />, tab: 'sales' as NavigationTab, subTab: 'invoices' },
    { label: 'Cotizaciones', icon: <FileCheck2 size={14} />, tab: 'sales' as NavigationTab, subTab: 'quotes' },
    { label: 'Kardex', icon: <History size={14} />, tab: 'inventory' as NavigationTab, subTab: 'kardex' },
    { label: 'Stock Físico', icon: <Boxes size={14} />, tab: 'inventory' as NavigationTab, subTab: 'stock' },
    { label: 'Prorrateo Costos', icon: <PieChart size={14} />, tab: 'accounting' as NavigationTab, subTab: 'prorrateo' },
    { label: 'Gastos Operativos', icon: <DollarSign size={14} />, tab: 'accounting' as NavigationTab, subTab: 'expenses' },
    { label: 'Resultados P&L', icon: <TrendingUp size={14} />, tab: 'reports' as NavigationTab, subTab: 'pnl' },
    { label: 'Ventas por Cliente', icon: <FileSpreadsheet size={14} />, tab: 'reports' as NavigationTab, subTab: 'sales' }
  ];

  const filteredModules = modules.map(m => {
    const q = query.toLowerCase().trim();
    if (!q) return m;

    const moduleMatches = m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    const matchingSubTabs = m.subTabs.filter(st =>
      st.name.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q)
    );

    if (moduleMatches) {
      return m;
    }

    if (matchingSubTabs.length > 0) {
      return { ...m, subTabs: matchingSubTabs };
    }

    return null;
  }).filter(Boolean) as ModuleSection[];

  const handleSubTabClick = (moduleId: NavigationTab, subTabId: string) => {
    onNavigate(moduleId, subTabId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accesos Directos a Módulos & Pestañas"
      subtitle={`${APP_NAME} — ${APP_BRAND} v${APP_VERSION}`}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Search & Top Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar pestaña o función (ej. Kardex, Cotizador, Gastos, Clientes, Prorrateo, P&L)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quick Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Compass size={13} /> Atajos Frecuentes:
            </span>
            {quickShortcuts.map((sc, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onClick={() => handleSubTabClick(sc.tab, sc.subTab)}
              >
                {sc.icon}
                <span>{sc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modules with Interactive Sub-Tab Buttons */}
        <div
          style={{
            maxHeight: '58vh',
            overflowY: 'auto',
            paddingRight: '0.35rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.15rem'
          }}
        >
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              className="card"
              style={{
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                borderTop: `3px solid ${mod.color}`,
                backgroundColor: 'var(--bg-card)'
              }}
            >
              {/* Module Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: mod.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {mod.icon}
                </div>
                <div>
                  <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {mod.category}
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {mod.name}
                  </h4>
                </div>
              </div>

              {/* Sub-Tab Access Buttons List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {mod.subTabs.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className="btn card-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      textAlign: 'left',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-default)',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSubTabClick(mod.id, st.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: mod.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {st.icon}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {st.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--color-accent)', flexShrink: 0, marginLeft: '0.5rem' }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
