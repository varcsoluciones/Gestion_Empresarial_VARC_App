import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Database,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Calculator,
  BarChart3,
  Settings,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { APP_NAME, APP_BRAND, APP_VERSION } from '../../config/version';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

type GuideTab = 
  | 'overview'
  | 'dashboard'
  | 'master-data'
  | 'purchases'
  | 'inventory'
  | 'sales'
  | 'accounting'
  | 'reports'
  | 'settings';

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>(initialTab as GuideTab);
  const [searchTerm, setSearchTerm] = useState('');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const guideSections: { id: GuideTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '1. Flujo Global', icon: <Layers size={17} /> },
    { id: 'dashboard', label: '2. Tablero & Alertas', icon: <LayoutDashboard size={17} /> },
    { id: 'master-data', label: '3. Catálogos Base', icon: <Database size={17} /> },
    { id: 'purchases', label: '4. Compras & Proveedores', icon: <ShoppingBag size={17} /> },
    { id: 'inventory', label: '5. Inventario & Kardex', icon: <Boxes size={17} /> },
    { id: 'sales', label: '6. Ventas & CxC', icon: <TrendingUp size={17} /> },
    { id: 'accounting', label: '7. Gastos & Prorrateo', icon: <Calculator size={17} /> },
    { id: 'reports', label: '8. Reportes Financieros', icon: <BarChart3 size={17} /> },
    { id: 'settings', label: '9. Configuración & PWA', icon: <Settings size={17} /> }
  ];

  const allTopics = [
    {
      tab: 'overview' as GuideTab,
      tabLabel: '1. Flujo Global',
      title: 'Ciclo Operativo Completo en 6 Pasos',
      desc: 'Flujo desde dar de alta catálogos, comprar mercancía, recibir al Kardex, emitir facturas, cobrar y prorratear gastos.'
    },
    {
      tab: 'dashboard' as GuideTab,
      tabLabel: '2. Tablero',
      title: 'Semáforo de Cobranza CxC & Alertas de Mora',
      desc: 'Clasificación de facturas vencidas con días de atraso, facturas por vencer en 7 días y botón directo para registrar cobros.'
    },
    {
      tab: 'dashboard' as GuideTab,
      tabLabel: '2. Tablero',
      title: 'Reabastecimiento Sugerido & Compras Necesarias',
      desc: 'Cálculo automático de piezas necesarias a comprar para artículos que alcanzaron su stock mínimo o están agotados.'
    },
    {
      tab: 'master-data' as GuideTab,
      tabLabel: '3. Catálogos',
      title: 'Clientes y Condiciones de Crédito',
      desc: 'Configuración de límite de crédito, días de crédito para vencimiento y condición de pago (contado o crédito).'
    },
    {
      tab: 'master-data' as GuideTab,
      tabLabel: '3. Catálogos',
      title: 'Productos y Variantes (Color / Talla / Modelo)',
      desc: 'Control de inventario desglosado por atributos individuales con SKU y categoría.'
    },
    {
      tab: 'purchases' as GuideTab,
      tabLabel: '4. Compras',
      title: 'Recepción de Mercancía & Costo Promedio Ponderado',
      desc: 'Al recibir compras, se ingresa la mercancía al almacén y se recalcula el costo unitario promedio ponderado.'
    },
    {
      tab: 'inventory' as GuideTab,
      tabLabel: '5. Inventario',
      title: 'Kardex Físico Inmutable y Auditoría',
      desc: 'Historial estricto de entradas, salidas y reingresos con cálculo de saldos y valores monetarios.'
    },
    {
      tab: 'inventory' as GuideTab,
      tabLabel: '5. Inventario',
      title: 'Ajustes de Stock y Mermas',
      desc: 'Registro de conteos físicos y mermas con justificación obligatoria.'
    },
    {
      tab: 'sales' as GuideTab,
      tabLabel: '6. Ventas',
      title: 'Cotizaciones con Semáforo de Existencias en Vivo',
      desc: 'Armado de cotizaciones con indicador de disponibilidad y conversión a factura en 1 clic.'
    },
    {
      tab: 'sales' as GuideTab,
      tabLabel: '6. Ventas',
      title: 'Facturación y Salida Automática de Almacén',
      desc: 'Al emitir la factura se descuentan las existencias y se genera la cuenta por cobrar.'
    },
    {
      tab: 'sales' as GuideTab,
      tabLabel: '6. Ventas',
      title: 'Anulación de Facturas y Reingreso de Mercancía',
      desc: 'Inmutabilidad contable: la factura pasa a ANULADA y las piezas vuelven al almacén.'
    },
    {
      tab: 'accounting' as GuideTab,
      tabLabel: '7. Contabilidad',
      title: 'Gastos Operativos (Fijos y Variables)',
      desc: 'Registro de rentas, nóminas, servicios públicos y fletes con centros de costos.'
    },
    {
      tab: 'accounting' as GuideTab,
      tabLabel: '7. Contabilidad',
      title: 'Activos Fijos y Depreciación Mensual',
      desc: 'Control de maquinaria y mobiliario con cálculo de depreciación en línea recta.'
    },
    {
      tab: 'accounting' as GuideTab,
      tabLabel: '7. Contabilidad',
      title: 'Prorrateo de Costos Absorbidos',
      desc: 'Distribución de los gastos mensuales entre las unidades vendidas para conocer el costo real.'
    },
    {
      tab: 'reports' as GuideTab,
      tabLabel: '8. Reportes',
      title: 'Estado de Resultados (P&L)',
      desc: 'Ventas − Costo de Ventas = Margen Bruto, menos Gastos y Depreciaciones = Utilidad Operativa.'
    },
    {
      tab: 'reports' as GuideTab,
      tabLabel: '8. Reportes',
      title: 'Flujo de Efectivo y Balance General',
      desc: 'Entradas/salidas reales de caja y estructura patrimonial (Activos, Pasivos y Capital).'
    },
    {
      tab: 'settings' as GuideTab,
      tabLabel: '9. Configuración',
      title: 'Respaldos de Base de Datos .JSON',
      desc: 'Descarga copias de seguridad completas y restaura tu información en cualquier momento.'
    },
    {
      tab: 'settings' as GuideTab,
      tabLabel: '9. Configuración',
      title: 'Instalación en Celular (PWA)',
      desc: 'Cómo agregar la app a la pantalla de inicio de tu iPhone o Android.'
    }
  ];

  const filteredTopics = allTopics.filter(t => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.tabLabel.toLowerCase().includes(q)
    );
  });

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 220;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual de Uso & Guía del Sistema"
      subtitle={`${APP_NAME} — ${APP_BRAND} v${APP_VERSION}`}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Search in Guide */}
        <div className="search-input-wrapper" style={{ width: '100%', minWidth: '100%', maxWidth: '100%' }}>
          <Search size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar tema en la guía (ej. Kardex, Facturas, Crédito, Prorrateo, IVA, Respaldos, PWA)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Navigation Tabs Strip with Visible Scrollbar & Chevron Nav */}
        {searchTerm.trim() === '' && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn-icon"
              style={{ flexShrink: 0, width: '28px', height: '28px' }}
              onClick={() => scrollTabs('left')}
              title="Desplazar pestañas a la izquierda"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft size={16} />
            </button>

            <div
              ref={tabsContainerRef}
              className="guide-tabs-strip"
              style={{
                display: 'flex',
                gap: '0.4rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-default)',
                flex: 1,
                scrollBehavior: 'smooth'
              }}
            >
              {guideSections.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`tab-btn ${activeTab === s.id ? 'active' : ''}`}
                  style={{
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    padding: '0.55rem 0.95rem',
                    fontSize: '0.825rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                  onClick={() => { setActiveTab(s.id); }}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-icon"
              style={{ flexShrink: 0, width: '28px', height: '28px' }}
              onClick={() => scrollTabs('right')}
              title="Desplazar pestañas a la derecha"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Content Container */}
        <div style={{ minHeight: '380px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {/* SEARCH RESULTS VIEW */}
          {searchTerm.trim() !== '' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Resultados encontrados para: <strong>"{searchTerm}"</strong> ({filteredTopics.length})
              </div>

              {filteredTopics.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron temas con esa palabra clave. Intenta con "factura", "kardex", "crédito", "inventario", etc.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {filteredTopics.map((item, idx) => (
                    <div
                      key={idx}
                      className="card card-hover"
                      style={{ padding: '1rem', cursor: 'pointer' }}
                      onClick={() => {
                        setActiveTab(item.tab);
                        setSearchTerm('');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                          {item.tabLabel}
                        </span>
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{item.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 1. OVERVIEW */}
          {searchTerm.trim() === '' && activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-accent-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-accent-subtle-border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={20} />
                  Bienvenido a {APP_NAME} ({APP_BRAND})
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  Este sistema está diseñado para que cualquier pyme, negocio comercial o de servicios controle de manera integral y ordenada todo su ciclo de negocio: desde el alta de mercancías hasta la emisión de facturas, cobranza, control físico del almacén y el cálculo de la utilidad real neta.
                </p>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <RefreshCw size={17} style={{ color: 'var(--color-accent)' }} />
                El Ciclo Operativo en 6 Pasos Fundamentales:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-accent)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Paso 1: Dar de alta Catálogos</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Crea tus <strong>Clientes</strong> (con condiciones de crédito), <strong>Proveedores</strong> y <strong>Productos</strong> (simples o con variantes como talla/color).
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-info)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Paso 2: Compras y Almacén</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Genera órdenes de compra a tus proveedores. Al <strong>Recibir la Mercancía</strong>, el sistema ingresa los productos al Kardex y actualiza el costo promedio ponderado.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-warning)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Paso 3: Cotizar y Facturar</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Crea cotizaciones y conviértelas en <strong>Facturas</strong> con 1 clic. Al emitir la factura, las unidades se descuentan del almacén y se crea la cuenta por cobrar.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-success)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Paso 4: Cobranza & Pagos</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Registra abonos de clientes (CxC) y pagos a proveedores (CxP) por transferencia, efectivo o tarjeta para mantener los saldos actualizados.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Paso 5: Gastos y Prorrateo</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Registra la renta, nóminas, servicios y depreciaciones. El sistema <strong>absorbe y prorratea</strong> estos gastos en cada producto vendido para darte su costo real.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #ec4899' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Paso 6: Analítica Financiera</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Consulta tu <strong>Estado de Resultados</strong>, balance general y flujo de caja con líneas de totales y exportación a Excel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. DASHBOARD */}
          {searchTerm.trim() === '' && activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Centro de Mando & Monitoreo en Vivo
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  El Tablero General concentra las alertas más críticas del negocio para que tomes decisiones inmediatas sin tener que buscar en múltiples tablas.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Semáforo de Cobranza & Créditos CxC</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Te avisa qué facturas están <strong>vencidas</strong> (en mora), cuáles están <strong>por vencer en los próximos 7 días</strong> y cuáles están en plazo normal. Incluye un botón directo para registrar cobros.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>
                    <Boxes size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Reabastecimiento Sugerido & Compras Necesarias</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Detecta automáticamente los productos que llegaron a su <strong>stock mínimo o están agotados</strong>, calculando cuántas piezas pedir y la inversión requerida.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info-text)' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Proyección de Flujo de Caja & Margen Operativo</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Compara las entradas esperadas por cobrar vs los pagos y gastos obligatorios del mes para predecir tu saldo neto de liquidez a 30 días.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Top Productos Estrella & Alerta de Inventario Inactivo</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Muestra los productos con mayor rotación e ingresos, y alerta sobre artículos sin ventas en el mes para planear promociones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. MASTER DATA */}
          {searchTerm.trim() === '' && activeTab === 'master-data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Administración de Catálogos Maestros
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Aquí se definen las bases de tu empresa. Cuenta con 3 pestañas principales:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                    1. Catálogo de Clientes
                  </h4>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <li><strong>Tipo de Pago:</strong> Contado o Crédito.</li>
                    <li><strong>Límite de Crédito:</strong> Monto máximo de saldo pendiente que se le permite acumular.</li>
                    <li><strong>Días de Crédito:</strong> Plazo otorgado para calcular automáticamente la fecha de vencimiento en cada factura.</li>
                  </ul>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                    2. Catálogo de Proveedores
                  </h4>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <li>Registro de razón social, RFC/Identificación fiscal, teléfono, correo y contacto comercial.</li>
                    <li>Asignación de compras y control de saldos por pagar (CxP).</li>
                  </ul>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.5rem' }}>
                    3. Catálogo de Productos & Variantes
                  </h4>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <li><strong>Productos Simples:</strong> Artículos unitarios con su propio SKU.</li>
                    <li><strong>Productos con Variantes:</strong> Permite desglosar por Color, Talla, Modelo o Medida (ej. Playera Polo en Negro / Talla M, L, XL), controlando existencias individuales por cada variante.</li>
                  </ul>
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lightbulb size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span>
                  <strong>Creación Rápida:</strong> Puedes crear clientes y productos directamente desde las ventanas de facturación y compras sin salirte de tu trabajo.
                </span>
              </div>
            </div>
          )}

          {/* 4. PURCHASES */}
          {searchTerm.trim() === '' && activeTab === 'purchases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Órdenes de Compra & Recepción de Mercancía
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  El módulo de compras gestiona el abastecimiento del negocio y alimenta el inventario de manera transparente.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    1. Estados de una Orden de Compra:
                  </h4>
                  <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <li><strong>Pendiente / Borrador:</strong> La orden está colocada con el proveedor pero la mercancía aún no ha llegado al almacén físico. No afecta stock ni Kardex.</li>
                    <li><strong>Recibida:</strong> Al hacer clic en <em>"Recibir Mercancía"</em>, el sistema ingresa los productos automáticamente al almacén, actualiza el Kardex e incrementa el costo promedio ponderado.</li>
                    <li><strong>Pagada:</strong> Cuando se liquidan todos los abonos del saldo pendiente.</li>
                  </ul>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    2. Registro de Pagos a Proveedores (CxP):
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Pulsa el botón <strong>+ Abono</strong> en cualquier compra recibida con saldo para registrar pagos parciales o totales indicando el método (Transferencia, Efectivo, Cheque o Tarjeta) y número de referencia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. INVENTORY */}
          {searchTerm.trim() === '' && activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Control de Existencias & Kardex Permanente
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Garantiza que siempre conozcas el valor real de tu almacén bajo la metodología de <strong>Costo Promedio Ponderado</strong>.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    1. Existencias Físicas
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Muestra el stock total de cada producto y el desglose de cada una de sus variantes (colores y tallas), el costo promedio unitario y el valor monetario total del inventario.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    2. Kardex Inmutable
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Bitácora histórica de cada movimiento: Entradas por compras, Salidas por ventas facturadas, Reingresos por anulación de facturas y Ajustes manuales con auditoría.
                  </p>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sliders size={16} style={{ color: 'var(--color-accent)' }} />
                  Realizar un Ajuste de Inventario:
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Usa el botón <strong>+ Ajuste de Inventario</strong> para registrar aumentos o disminuciones por conteo físico, mermas o inventario inicial, justificando siempre el motivo para la auditoría.
                </p>
              </div>
            </div>
          )}

          {/* 6. SALES */}
          {searchTerm.trim() === '' && activeTab === 'sales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Ventas, Cotizaciones & Cuentas por Cobrar (CxC)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Todo el flujo comercial con tus clientes, desde la cotización hasta el cobro de facturas en mora.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.25rem' }}>
                    1. Cotizaciones con Semáforo de Stock en Tiempo Real:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Al armar una cotización, el sistema te indica en verde si hay existencia suficiente en almacén o en amarillo/rojo si la cantidad supera el stock actual. Con un clic en <strong>"Facturar Cotización"</strong> la conviertes en factura formal sin tener que volver a capturar los datos.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.25rem' }}>
                    2. Emisión de Facturas y Salida de Almacén:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Al emitir una factura, el sistema descuenta las prendas del Kardex de manera automática y genera el registro en Cuentas por Cobrar (CxC).
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.25rem' }}>
                    3. Cobros de Clientes & Registro de Abonos:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    En la tabla de facturas, haz clic en <strong>Cobrar (CxC)</strong> para asentar los pagos parciales o totales de tus clientes.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-danger)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-danger-text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={15} />
                    4. Principio de Inmutabilidad Contable (Anulación de Facturas):
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Las facturas emitidas <strong>no se pueden borrar</strong>. Al anular una factura, queda registrada con estado <strong style={{ color: 'var(--color-danger)' }}>ANULADA</strong> con su motivo obligatorio, y el sistema reingresa automáticamente las mercancías al almacén en el Kardex.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. ACCOUNTING */}
          {searchTerm.trim() === '' && activeTab === 'accounting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Gastos Operativos, Activos Fijos & Prorrateo de Costos
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Conoce cuánto cuesta realmente operar tu negocio y cuál es el costo verdadero de cada producto vendido.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    1. Gastos Operativos
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Registra rentas, sueldos, servicios de luz/agua, fletes y comisiones, clasificándolos en <strong>Fijos</strong> o <strong>Variables</strong>.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    2. Activos Fijos & Depreciación
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Registra maquinaria, equipo de transporte o mobiliario. El sistema calcula automáticamente su <strong>depreciación mensual</strong> en línea recta.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    3. Prorrateo de Costos
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Distribuye los gastos del mes entre las prendas vendidas para obtener el <strong>Costo Total Absorbido</strong> y la rentabilidad neta real.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 8. REPORTS */}
          {searchTerm.trim() === '' && activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Estados Financieros & Exportación a Excel
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Información ejecutiva clara para directores, socios y contadores.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    1. Estado de Resultados Devengado:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Ventas Netas − Costo de Ventas = <strong>Margen Bruto</strong>. Al restar los Gastos Operativos y Depreciaciones se obtiene la <strong>Utilidad Operativa Neta</strong> del periodo.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    2. Estado de Flujo de Efectivo:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Dinero real cobrado en caja/bancos vs dinero real pagado a proveedores y gastos del mes.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    3. Balance General (Estructura Patrimonial):
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Resumen de Activos (Cuentas por Cobrar + Inventario en Almacén + Activos Fijos Netos) vs Pasivos (Cuentas por Pagar) y Capital de la Empresa.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    4. Ventas por Producto y Cliente con Fila de Totales:
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Tablas detalladas con el total de piezas vendidas, saldos de clientes y participación porcentual.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 9. SETTINGS */}
          {searchTerm.trim() === '' && activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-accent)' }}>
                  Configuración, Apariencia, Respaldos & App Móvil
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Personaliza la herramienta y asegura tu información.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    1. Temas & Colores de Acento
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Modo Claro y Oscuro con 14 colores de acento corporativos (Azul Cupertino, Azul Marino, Cian, Turquesa, Verde Esmeralda, Verde Bosque, Amarillo Dorado, Naranja, Rojo Vino, Café Moka, Rosa, Púrpura, Índigo y Grafito).
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    2. Respaldos de Base de Datos
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Descarga copias de seguridad completas en formato <strong>.JSON</strong> en 1 clic. Si cambias de equipo, puedes restaurar tu archivo de respaldo inmediatamente.
                  </p>
                </div>

                <div className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '0.35rem' }}>
                    3. Uso en Pantalla de Inicio Móvil (PWA)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    En tu iPhone o Android abre el link en el navegador y selecciona <strong>"Agregar al Inicio"</strong> para tener el icono oficial del Gestor Modular y usarlo como app nativa.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
