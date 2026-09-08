import React from 'react';
import { useERP } from '../context/ERPContext';
import { formatCurrency, getMonthKey } from '../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  CreditCard,
  Calculator,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  Calendar,
  AlertCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import type { NavigationTab } from '../components/layout/Sidebar';
import type { Product } from '../types/erp';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    invoices,
    purchases,
    products,
    clients,
    getProrrateoMensual
  } = useERP();

  const currentMonthKey = getMonthKey();
  const prorrateo = getProrrateoMensual(currentMonthKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. KPI Metrics Calculations
  const validInvoices = invoices.filter(i => i.estado === 'emitida' || i.estado === 'pagada');
  const monthInvoices = validInvoices.filter(i =>
    i.fechaEmision.startsWith(currentMonthKey) || i.emitidaFecha?.startsWith(currentMonthKey)
  );

  const totalSalesMonth = monthInvoices.reduce((sum, i) => sum + i.total, 0);

  const pendingReceivables = invoices
    .filter(i => i.estado === 'emitida' && i.saldoPendiente > 0)
    .reduce((sum, i) => sum + i.saldoPendiente, 0);

  const pendingPayables = purchases
    .filter(p => p.estado === 'recibida' && p.saldoPendiente > 0)
    .reduce((sum, p) => sum + p.saldoPendiente, 0);

  const totalInventoryUnits = products.reduce((sum, p) => sum + p.stockActual, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);

  // Approximate Gross Profit for the month
  const totalSalesSubtotal = monthInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalCostOfGoodsSold = monthInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((iSum, item) => {
      const prod = products.find(p => p.id === item.productoId);
      return iSum + (item.cantidad * (prod?.costoPromedio || 0));
    }, 0);
  }, 0);

  const grossProfit = totalSalesSubtotal - totalCostOfGoodsSold;
  const netOperatingProfit = grossProfit - prorrateo.gastoOperativoTotal;

  // 2. Section 1 Data: Semáforo de Cobranza & Créditos CxC
  const cxcAlerts = invoices
    .filter(i => i.estado === 'emitida' && i.saldoPendiente > 0)
    .map(inv => {
      const due = new Date(inv.fechaVencimiento || inv.fechaEmision);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / 86400000);
      const client = clients.find(c => c.id === inv.clienteId);

      let statusCategory: 'overdue' | 'dueSoon' | 'normal' = 'normal';
      if (diffDays < 0) statusCategory = 'overdue';
      else if (diffDays <= 7) statusCategory = 'dueSoon';

      return {
        ...inv,
        diffDays,
        statusCategory,
        clientName: client?.nombre || 'Cliente General'
      };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const overdueInvoices = cxcAlerts.filter(i => i.statusCategory === 'overdue');
  const dueSoonInvoices = cxcAlerts.filter(i => i.statusCategory === 'dueSoon');
  const totalOverdueAmount = overdueInvoices.reduce((sum, i) => sum + i.saldoPendiente, 0);

  // 3. Section 2 Data: Reabastecimiento Sugerido & Compras Necesarias
  const lowStockProducts = products
    .filter(p => p.stockActual <= p.stockMinimo)
    .map(p => {
      const deficit = Math.max(0, p.stockMinimo - p.stockActual);
      const suggestedQty = Math.max(deficit + Math.max(p.stockMinimo, 5), 10);
      const estimatedCost = suggestedQty * (p.costoPromedio || 50);
      return {
        ...p,
        deficit,
        suggestedQty,
        estimatedCost
      };
    })
    .sort((a, b) => (a.stockActual / (a.stockMinimo || 1)) - (b.stockActual / (b.stockMinimo || 1)));

  const totalRestockCost = lowStockProducts.reduce((sum, p) => sum + p.estimatedCost, 0);

  // 4. Section 3 Data: Proyección de Flujo de Caja & Liquidez (30 Días)
  const totalCommittedOutflows = pendingPayables + prorrateo.gastoOperativoTotal;
  const netCashflowPosition = pendingReceivables - totalCommittedOutflows;

  // 5. Section 4 Data: Top Productos Estrella vs Stock Estancado
  const productSalesMap: Record<string, { product: Product; qty: number; total: number }> = {};
  monthInvoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSalesMap[item.productoId]) {
        const prod = products.find(p => p.id === item.productoId);
        if (prod) productSalesMap[item.productoId] = { product: prod, qty: 0, total: 0 };
      }
      if (productSalesMap[item.productoId]) {
        productSalesMap[item.productoId].qty += item.cantidad;
        productSalesMap[item.productoId].total += item.subtotal;
      }
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const deadStockProducts = products
    .filter(p => p.stockActual > 0 && (!productSalesMap[p.id] || productSalesMap[p.id].qty === 0))
    .slice(0, 4);

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Panel de Control & Centro de Mando</h1>
          <p className="page-description">
            Monitoreo en tiempo real de cobranza, reabastecimiento, liquidez y rotación comercial ({currentMonthKey}).
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('accounting')}>
            <Calculator size={15} />
            Prorrateo & Costos
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('reports')}>
            <BarChart3 size={15} />
            Reportes Financieros
          </button>
        </div>
      </div>

      {/* Compact KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.25rem', gap: '0.85rem' }}>
        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-header" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ventas del Mes</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', width: '28px', height: '28px' }}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 800 }}>{formatCurrency(totalSalesMonth)}</div>
          <div className="stat-footer" style={{ fontSize: '0.725rem', color: 'var(--color-success-text)', marginTop: '0.2rem' }}>
            <ArrowUpRight size={13} />
            <span>{monthInvoices.length} facturas emitidas</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-header" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cuentas por Cobrar (CxC)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', width: '28px', height: '28px' }}>
              <CreditCard size={15} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 800, color: pendingReceivables > 0 ? 'var(--color-info-text)' : 'inherit' }}>
            {formatCurrency(pendingReceivables)}
          </div>
          <div className="stat-footer" style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            <span>{cxcAlerts.length} facturas con saldo</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-header" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cuentas por Pagar (CxP)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', width: '28px', height: '28px' }}>
              <ShoppingBag size={15} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 800, color: pendingPayables > 0 ? 'var(--color-warning-text)' : 'inherit' }}>
            {formatCurrency(pendingPayables)}
          </div>
          <div className="stat-footer" style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            <span>Proveedores pendientes</span>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '0.85rem 1rem' }}>
          <div className="stat-header" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Valor de Inventario</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', width: '28px', height: '28px' }}>
              <Boxes size={15} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 800 }}>{formatCurrency(totalInventoryValue)}</div>
          <div className="stat-footer" style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            <span>{totalInventoryUnits} pzas en stock</span>
          </div>
        </div>
      </div>

      {/* 4 Strategic Operational Sections in 2x2 Grid */}
      <div className="grid-2" style={{ gap: '1.25rem' }}>

        {/* SECTION 1: 🚨 Semáforo de Cobranza & Créditos CxC */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.65rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <ShieldAlert size={18} style={{ color: overdueInvoices.length > 0 ? 'var(--color-danger)' : 'var(--color-info)' }} />
                Semáforo de Cobranza & Créditos CxC
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.775rem' }}>
                Control preventivo de facturas vencidas y créditos por expirar en los próximos 7 días
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExcelExportButton filename="Alertas_Cobranza_CxC" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('sales')}
                style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
              >
                Ver Todas &rarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {cxcAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={30} style={{ color: 'var(--color-success)', margin: '0 auto 0.4rem auto', display: 'block' }} />
                <div style={{ fontWeight: 600 }}>¡Cartera al día!</div>
                <div style={{ fontSize: '0.775rem' }}>No hay facturas vencidas ni saldos pendientes por cobrar.</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Folio / Cliente</th>
                      <th style={{ textAlign: 'center' }}>Vencimiento</th>
                      <th style={{ textAlign: 'right' }}>Saldo CxC</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cxcAlerts.slice(0, 5).map(inv => (
                      <tr key={inv.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.numeroFactura}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {inv.clientName}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {inv.statusCategory === 'overdue' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-danger-text)', fontWeight: 700, backgroundColor: 'var(--color-danger-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                              <AlertCircle size={12} /> {Math.abs(inv.diffDays)}d vencida
                            </span>
                          )}
                          {inv.statusCategory === 'dueSoon' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-warning-text)', fontWeight: 700, backgroundColor: 'var(--color-warning-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                              <Calendar size={12} /> Vence en {inv.diffDays === 0 ? 'hoy' : `${inv.diffDays}d`}
                            </span>
                          )}
                          {inv.statusCategory === 'normal' && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              En {inv.diffDays} días
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: inv.statusCategory === 'overdue' ? 'var(--color-danger-text)' : 'var(--color-warning-text)' }}>
                          {formatCurrency(inv.saldoPendiente)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => onNavigate('sales')}
                          >
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 1 Footer */}
          {cxcAlerts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>
                Vencido en riesgo: <strong style={{ color: 'var(--color-danger-text)' }}>{formatCurrency(totalOverdueAmount)}</strong>
              </span>
              <span>
                Por vencer (7d): <strong>{dueSoonInvoices.length} facturas</strong>
              </span>
            </div>
          )}
        </div>

        {/* SECTION 2: 📦 Reabastecimiento Sugerido & Compras Necesarias */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.65rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                Reabastecimiento Sugerido & Compras ({lowStockProducts.length})
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.775rem' }}>
                Productos bajo el stock de seguridad con cálculo de compra sugerida en 1 clic
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExcelExportButton filename="Compras_Sugeridas_Reabastecimiento" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('inventory')}
                style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
              >
                Inventario &rarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={30} style={{ color: 'var(--color-success)', margin: '0 auto 0.4rem auto', display: 'block' }} />
                <div style={{ fontWeight: 600 }}>¡Stock Saludable!</div>
                <div style={{ fontSize: '0.775rem' }}>Todos los productos se encuentran por encima de su umbral mínimo.</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Producto / SKU</th>
                      <th style={{ textAlign: 'center' }}>Stock / Mín</th>
                      <th style={{ textAlign: 'center' }}>Sugerido Pedir</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {p.nombre}
                          </div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>SKU: {p.codigo}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>{p.stockActual}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}> / {p.stockMinimo} {p.unidadMedida}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-primary" style={{ padding: '0.2rem 0.5rem', fontWeight: 700, fontSize: '0.75rem' }}>
                            +{p.suggestedQty} {p.unidadMedida}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => onNavigate('purchases')}
                            title={`Generar orden de compra por ${p.suggestedQty} piezas`}
                          >
                            + Comprar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2 Footer */}
          {lowStockProducts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-default)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>
                Inversión estimada reposición: <strong style={{ color: 'var(--color-accent)' }}>{formatCurrency(totalRestockCost)}</strong>
              </span>
              <span>
                <strong>{lowStockProducts.length}</strong> artículos críticos
              </span>
            </div>
          )}
        </div>

        {/* SECTION 3: 📊 Proyección de Flujo de Caja & Salud Financiera */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.65rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <DollarSign size={18} style={{ color: 'var(--color-success)' }} />
                Proyección de Flujo de Caja (30 Días)
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.775rem' }}>
                Balance previsto entre cobranza estimada y compromisos de pago operativos
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('accounting')}
              style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
            >
              Costos & P&L &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
            {/* Inflows vs Outflows Bars */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  (+) Entradas Proyectadas (CxC Clientes):
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-success-text)' }}>
                  +{formatCurrency(pendingReceivables)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  (-) Salidas Comprometidas (CxP + Gastos Operativos):
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-danger-text)' }}>
                  -{formatCurrency(totalCommittedOutflows)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '0.5rem',
                marginTop: '0.35rem'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  (=) Posición Neta de Liquidez Esperada:
                </span>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: netCashflowPosition >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)'
                }}>
                  {formatCurrency(netCashflowPosition)}
                </span>
              </div>
            </div>

            {/* Live Operating Profit Mini Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Margen Bruto del Mes
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.15rem' }}>
                  {formatCurrency(grossProfit)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ventas − Costo Mercancía</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Utilidad Operativa Neta
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: netOperatingProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.15rem' }}>
                  {formatCurrency(netOperatingProfit)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absorbiendo {formatCurrency(prorrateo.gastoOperativoTotal)} de gastos</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: 🏆 Top Productos Estrella & Rotación Comercial */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.65rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
                Top Productos Estrella & Rotación
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.775rem' }}>
                Productos de mayor facturación este mes vs. inventario sin rotación
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('reports')}
              style={{ fontSize: '0.775rem', padding: '0.3rem 0.5rem' }}
            >
              Reportes &rarr;
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Top sellers */}
            {topSellingProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se han registrado ventas en el periodo actual ({currentMonthKey}).
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  🔥 Mayores Ingresos Generados
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {topSellingProducts.map(({ product, qty, total }, index) => {
                    const share = totalSalesMonth > 0 ? Math.round((total / totalSalesMonth) * 100) : 0;
                    return (
                      <div
                        key={product.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.45rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border-default)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-accent)', width: '16px' }}>#{index + 1}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                              {product.nombre}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{qty} pzas vendidas</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(total)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{share}% del mes</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dead stock / Slow moving alert */}
            {deadStockProducts.length > 0 && (
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', fontWeight: 700, color: 'var(--color-warning-text)', marginBottom: '0.35rem' }}>
                  <span>⚠️ Inventario sin Ventas en el Mes:</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Sugerencia: Promocionar</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {deadStockProducts.map(p => (
                    <span
                      key={p.id}
                      className="badge badge-neutral"
                      style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                      title={`Stock disponible: ${p.stockActual} ${p.unidadMedida}`}
                    >
                      {p.nombre} ({p.stockActual} pzas)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
