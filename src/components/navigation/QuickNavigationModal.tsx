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
  PlusCircle,
  FileSpreadsheet,
  Receipt,
  FileCheck2,
  Sliders,
  DollarSign,
  PieChart,
  Compass
} from 'lucide-react';
import { Modal } from '../common/Modal';
import type { NavigationTab } from '../layout/Sidebar';
import { APP_NAME, APP_BRAND, APP_VERSION } from '../../config/version';

interface QuickNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

interface ModuleSection {
  id: NavigationTab;
  name: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  subTabs: { name: string; desc: string }[];
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
      description: 'KPIs en vivo, semáforo de cobros, alertas de compras y flujo proyectado.',
      subTabs: [
        { name: 'Semáforo de Cobranza', desc: 'Facturas en mora y cobros en los próximos 7 días' },
        { name: 'Reabastecimiento Sugerido', desc: 'Artículos con stock mínimo o agotados' },
        { name: 'Flujo de Caja a 30 Días', desc: 'Cobros esperados vs pagos comprometidos' },
        { name: 'Top Productos Estrella', desc: 'Ranking de rotación comercial e ingresos' }
      ]
    },
    {
      id: 'master-data',
      name: 'Catálogos Base',
      category: 'Administración',
      icon: <Database size={20} />,
      color: '#3b82f6',
      description: 'Gestión central de clientes, proveedores y productos con variantes.',
      subTabs: [
        { name: 'Catálogo de Clientes', desc: 'Límites de crédito, días de plazo y datos fiscales' },
        { name: 'Catálogo de Proveedores', desc: 'Contactos comerciales y saldos por pagar' },
        { name: 'Productos y Variantes', desc: 'Control por tallas, colores, categorías y SKU' }
      ]
    },
    {
      id: 'purchases',
      name: 'Compras & Proveedores',
      category: 'Operaciones',
      icon: <ShoppingBag size={20} />,
      color: '#06b6d4',
      description: 'Órdenes de compra, recepción de mercancía al almacén y abonos CxP.',
      subTabs: [
        { name: 'Órdenes de Compra', desc: 'Generación de pedidos a proveedores con cálculo de IVA' },
        { name: 'Recepción al Almacén', desc: 'Ingreso físico al Kardex y actualización de costo promedio' },
        { name: 'Pagos y Abonos (CxP)', desc: 'Control de saldo pendiente por proveedor' }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventario & Kardex',
      category: 'Almacén',
      icon: <Boxes size={20} />,
      color: '#10b981',
      description: 'Existencias físicas valorizadas, trazabilidad inmutable y ajustes de stock.',
      subTabs: [
        { name: 'Existencias Físicas', desc: 'Stock actual desglosado por variante y valor total' },
        { name: 'Kardex Permanente', desc: 'Bitácora inmutable de entradas, salidas y anulaciones' },
        { name: 'Ajustes de Inventario', desc: 'Aumentos o mermas con justificación para auditoría' }
      ]
    },
    {
      id: 'sales',
      name: 'Ventas & Cotizaciones',
      category: 'Comercial',
      icon: <TrendingUp size={20} />,
      color: '#f59e0b',
      description: 'Facturación, cotizador con semáforo de existencias y cobranza CxC.',
      subTabs: [
        { name: 'Facturas Emitidas', desc: 'Emisión formal con salida automática de inventario' },
        { name: 'Cotizador en Vivo', desc: 'Propuestas comerciales con semáforo de disponibilidad' },
        { name: 'Cobranza (CxC)', desc: 'Registro de abonos parciales y liquidación de saldos' },
        { name: 'Anulación Segura', desc: 'Reingreso automático al almacén y motivo de auditoría' }
      ]
    },
    {
      id: 'accounting',
      name: 'Costos & Contabilidad',
      category: 'Finanzas',
      icon: <Calculator size={20} />,
      color: '#8b5cf6',
      description: 'Gastos fijos/variables, activos fijos y prorrateo de costos absorbidos.',
      subTabs: [
        { name: 'Gastos Operativos', desc: 'Renta, nóminas, servicios públicos y fletes' },
        { name: 'Activos & Depreciación', desc: 'Maquinaria, equipo y cálculo de depreciación mensual' },
        { name: 'Prorrateo de Costos', desc: 'Distribución de gastos entre productos para costo real' }
      ]
    },
    {
      id: 'reports',
      name: 'Reportes Financieros',
      category: 'Analítica',
      icon: <BarChart3 size={20} />,
      color: '#ec4899',
      description: 'Estados financieros, balance, flujo de efectivo y exportación a Excel.',
      subTabs: [
        { name: 'Estado de Resultados (P&L)', desc: 'Utilidad bruta y operativa devengada' },
        { name: 'Flujo de Efectivo', desc: 'Entradas y salidas reales de dinero' },
        { name: 'Balance General', desc: 'Activos vs Pasivos y Capital' },
        { name: 'Ventas por Producto/Cliente', desc: 'Tablas analíticas con totales y exportación XLS' }
      ]
    },
    {
      id: 'settings',
      name: 'Configuración & Sistema',
      category: 'Ajustes',
      icon: <Settings size={20} />,
      color: '#64748b',
      description: 'Identidad corporativa, 9 temas de color, respaldos .JSON y versión.',
      subTabs: [
        { name: 'Datos de la Empresa', desc: 'Razón social, RFC, moneda y tasa de IVA' },
        { name: 'Apariencia y Colores', desc: 'Modo claro/oscuro y paletas Apple' },
        { name: 'Copias de Seguridad', desc: 'Descarga y restauración de base de datos en .JSON' }
      ]
    }
  ];

  const quickShortcuts = [
    { label: 'Nueva Factura', icon: <Receipt size={14} />, tab: 'sales' as NavigationTab },
    { label: 'Nueva Cotización', icon: <FileCheck2 size={14} />, tab: 'sales' as NavigationTab },
    { label: 'Nueva Compra', icon: <PlusCircle size={14} />, tab: 'purchases' as NavigationTab },
    { label: 'Registrar Gasto', icon: <DollarSign size={14} />, tab: 'accounting' as NavigationTab },
    { label: 'Ajuste de Stock', icon: <Sliders size={14} />, tab: 'inventory' as NavigationTab },
    { label: 'Ver Kardex', icon: <Boxes size={14} />, tab: 'inventory' as NavigationTab },
    { label: 'Reporte P&L', icon: <PieChart size={14} />, tab: 'reports' as NavigationTab },
    { label: 'Exportar Excel', icon: <FileSpreadsheet size={14} />, tab: 'reports' as NavigationTab }
  ];

  const filteredModules = modules.filter(m => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.subTabs.some(st => st.name.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q))
    );
  });

  const handleSelectModule = (tab: NavigationTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mapa de Navegación Modular & Accesos Rápidos"
      subtitle={`${APP_NAME} — ${APP_BRAND} v${APP_VERSION}`}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Search & Shortcuts Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar módulo, sección o función (ej. Facturación, Kardex, Gastos, Balance, Clientes)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quick Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Compass size={13} /> Atajos:
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
                onClick={() => handleSelectModule(sc.tab)}
              >
                {sc.icon}
                <span>{sc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div
          style={{
            maxHeight: '58vh',
            overflowY: 'auto',
            paddingRight: '0.35rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}
        >
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              className="card card-hover"
              style={{
                padding: '1.15rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `3px solid ${mod.color}`,
                transition: 'all 0.15s ease'
              }}
              onClick={() => handleSelectModule(mod.id)}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
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
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {mod.name}
                      </h4>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                  {mod.description}
                </p>

                {/* Sub-tabs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                    Secciones & Funciones:
                  </div>
                  {mod.subTabs.map((st, sIdx) => (
                    <div key={sIdx} style={{ fontSize: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: mod.color }} />
                      <strong>{st.name}:</strong>
                      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {st.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enter Button */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Ir a {mod.name} <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
