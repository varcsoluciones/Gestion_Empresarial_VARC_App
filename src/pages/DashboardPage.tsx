import React from 'react';
import { useERP } from '../context/ERPContext';
import { formatCurrency, formatDate, getMonthKey } from '../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  CreditCard,
  PlusCircle,
  FileText,
  Calculator
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import type { NavigationTab } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    invoices,
    purchases,
    products,
    getProrrateoMensual
  } = useERP();

  const currentMonthKey = getMonthKey();
  const prorrateo = getProrrateoMensual(currentMonthKey);

  // 1. Metrics Calculation
  const validInvoices = invoices.filter(i => i.estado === 'emitida' || i.estado === 'pagada');
  const totalSalesMonth = validInvoices
    .filter(i => i.fechaEmision.startsWith(currentMonthKey) || i.emitidaFecha?.startsWith(currentMonthKey))
    .reduce((sum, i) => sum + i.total, 0);

  const pendingReceivables = invoices
    .filter(i => i.estado === 'emitida' && i.saldoPendiente > 0)
    .reduce((sum, i) => sum + i.saldoPendiente, 0);

  const pendingPayables = purchases
    .filter(p => p.estado === 'recibida' && p.saldoPendiente > 0)
    .reduce((sum, p) => sum + p.saldoPendiente, 0);

  const totalInventoryUnits = products.reduce((sum, p) => sum + p.stockActual, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);

  const lowStockProducts = products.filter(p => p.stockActual <= p.stockMinimo);

  // Approximate Gross Profit for the month
  const totalSalesSubtotal = validInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalCostOfGoodsSold = validInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((iSum, item) => {
      const prod = products.find(p => p.id === item.productoId);
      return iSum + (item.cantidad * (prod?.costoPromedio || 0));
    }, 0);
  }, 0);

  const grossProfit = totalSalesSubtotal - totalCostOfGoodsSold;
  const netOperatingProfit = grossProfit - prorrateo.gastoOperativoTotal;

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel de Control & Resumen Ejecutivo</h1>
          <p className="page-description">
            Monitoreo en tiempo real de ventas, inventarios, compras y finanzas del periodo actual ({currentMonthKey}).
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('accounting')}>
            <Calculator size={15} />
            Prorrateo & Costos
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('sales')}>
            <PlusCircle size={15} />
            Nueva Factura / Venta
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>Ventas del Mes</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalSalesMonth)}</div>
          <div className="stat-footer" style={{ color: 'var(--color-success-text)' }}>
            <ArrowUpRight size={14} />
            <span>{validInvoices.length} facturas facturadas/emitidas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Cuentas por Cobrar (CxC)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: pendingReceivables > 0 ? 'var(--color-info-text)' : 'inherit' }}>
            {formatCurrency(pendingReceivables)}
          </div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Saldo pendiente de clientes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Cuentas por Pagar (CxP)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: pendingPayables > 0 ? 'var(--color-warning-text)' : 'inherit' }}>
            {formatCurrency(pendingPayables)}
          </div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Compromisos con proveedores</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Valor de Inventario</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <Boxes size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalInventoryValue)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>{totalInventoryUnits} piezas en stock</span>
          </div>
        </div>
      </div>

      {/* Financial Health Summary Banner */}
      <div className="card" style={{ marginBottom: '1.75rem', background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-subtle))' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Margen Bruto (Ventas - Costo Compra)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
              {formatCurrency(grossProfit)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Antes de gastos operativos y depreciación
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-default)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Gasto Operativo + Depreciación
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning-text)', marginTop: '0.25rem' }}>
              {formatCurrency(prorrateo.gastoOperativoTotal)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Fijos ({formatCurrency(prorrateo.gastosFijos)}) + Var ({formatCurrency(prorrateo.gastosVariables)}) + Depr ({formatCurrency(prorrateo.depreciacionActivos)})
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-default)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Utilidad Operativa Neta (P&L)
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netOperatingProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
              {formatCurrency(netOperatingProfit)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Resultado neto estimado del periodo
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-default)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Prorrateo Operativo / Unidad
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)', marginTop: '0.25rem' }}>
              {formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Carga agregada al costo real por unidad
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Warnings & Recent Activity */}
      <div className="grid-2">
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                Alertas de Stock Mínimo ({lowStockProducts.length})
              </h2>
              <p className="card-subtitle">Productos que han alcanzado o bajado de su umbral crítico</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('inventory')}
            >
              Ver Inventario &rarr;
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
              Todos los productos tienen niveles de stock saludables.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'center' }}>Stock Actual</th>
                    <th style={{ textAlign: 'center' }}>Mínimo</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.codigo}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant="danger">{p.stockActual} {p.unidadMedida}</Badge>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {p.stockMinimo} {p.unidadMedida}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onNavigate('purchases')}
                        >
                          Comprar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Invoices & Sales */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: 'var(--color-accent)' }} />
                Últimas Facturas Emitidas
              </h2>
              <p className="card-subtitle">Actividad reciente de ventas y cobranza</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('sales')}
            >
              Ver Todas &rarr;
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Folio / Fecha</th>
                  <th>Total</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.numeroFactura}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(inv.fechaEmision)}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {inv.estado === 'pagada' && <Badge variant="success">Pagada</Badge>}
                      {inv.estado === 'emitida' && <Badge variant="info">Emitida</Badge>}
                      {inv.estado === 'borrador' && <Badge variant="neutral">Borrador</Badge>}
                      {inv.estado === 'anulada' && <Badge variant="danger">Anulada</Badge>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: inv.saldoPendiente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                      {formatCurrency(inv.saldoPendiente)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
