import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { formatCurrency, formatDate, getMonthKey } from '../utils/formatters';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Printer,
  Scale
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const {
    invoices,
    purchases,
    products,
    clients,
    expenses,
    fixedAssets,
    settings,
    getProrrateoMensual
  } = useERP();

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [activeReport, setActiveReport] = useState<'pnl' | 'balance' | 'sales' | 'costs'>('pnl');

  const prorrateo = getProrrateoMensual(selectedMonth);

  // 1. Calculations for P&L (Estado de Resultados)
  const monthInvoices = invoices.filter(i =>
    (i.estado === 'emitida' || i.estado === 'pagada') &&
    (i.fechaEmision.startsWith(selectedMonth) || i.emitidaFecha?.startsWith(selectedMonth))
  );

  const totalGrossSales = monthInvoices.reduce((sum, i) => sum + (i.subtotal + i.descuentoTotal), 0);
  const totalDiscounts = monthInvoices.reduce((sum, i) => sum + i.descuentoTotal, 0);
  const totalNetSales = monthInvoices.reduce((sum, i) => sum + i.subtotal, 0);

  // Cost of Goods Sold (Compra direct)
  const totalCOGS = monthInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((iSum, item) => {
      const prod = products.find(p => p.id === item.productoId);
      return iSum + (item.cantidad * (prod?.costoPromedio || 0));
    }, 0);
  }, 0);

  const grossProfit = totalNetSales - totalCOGS;
  const grossMarginPercent = totalNetSales > 0 ? ((grossProfit / totalNetSales) * 100).toFixed(1) : '0';

  const totalOperatingExpenses = prorrateo.gastosFijos + prorrateo.gastosVariables;
  const totalDepreciation = prorrateo.depreciacionActivos;
  const netOperatingIncome = grossProfit - totalOperatingExpenses - totalDepreciation;
  const netMarginPercent = totalNetSales > 0 ? ((netOperatingIncome / totalNetSales) * 100).toFixed(1) : '0';

  // 2. Calculations for Balance Sheet (Balance General)
  const totalClientPaymentsReceived = invoices.reduce((sum, inv) => {
    return sum + inv.pagos.reduce((pSum, p) => pSum + p.monto, 0);
  }, 0);

  const totalSupplierPaymentsMade = purchases.reduce((sum, pur) => {
    return sum + pur.pagos.reduce((pSum, p) => pSum + p.monto, 0);
  }, 0);

  const totalExpensesPaid = expenses.reduce((sum, e) => sum + e.monto, 0);
  const estimatedCash = Math.max(25000, totalClientPaymentsReceived - totalSupplierPaymentsMade - totalExpensesPaid + 50000);

  const totalReceivablesCxC = invoices
    .filter(i => (i.estado === 'emitida' || i.estado === 'borrador') && i.saldoPendiente > 0)
    .reduce((sum, i) => sum + i.saldoPendiente, 0);

  const totalInventoryAssetValue = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);
  const totalFixedAssetsNet = fixedAssets.reduce((sum, a) => sum + a.valorEnLibros, 0);

  const totalAssets = estimatedCash + totalReceivablesCxC + totalInventoryAssetValue + totalFixedAssetsNet;

  // Liabilities (Pasivos):
  const totalPayablesCxP = purchases
    .filter(p => (p.estado === 'recibida' || p.estado === 'borrador') && p.saldoPendiente > 0)
    .reduce((sum, p) => sum + p.saldoPendiente, 0);

  const totalLiabilities = totalPayablesCxP;
  const totalEquity = totalAssets - totalLiabilities;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes Financieros & Estados Contables</h1>
          <p className="page-description">
            Estado de resultados (P&L), balance general, ventas detalladas y reporte de absorción de costos.
          </p>
        </div>
        <div className="page-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Periodo:</span>
            <input
              type="month"
              style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrintReport}>
            <Printer size={15} />
            Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav no-print">
        <button
          type="button"
          className={`tab-btn ${activeReport === 'pnl' ? 'active' : ''}`}
          onClick={() => setActiveReport('pnl')}
        >
          <TrendingUp size={16} />
          Estado de Resultados (P&L)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeReport === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveReport('balance')}
        >
          <Scale size={16} />
          Balance General
        </button>
        <button
          type="button"
          className={`tab-btn ${activeReport === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveReport('sales')}
        >
          <BarChart3 size={16} />
          Ventas por Cliente & Producto
        </button>
        <button
          type="button"
          className={`tab-btn ${activeReport === 'costs' ? 'active' : ''}`}
          onClick={() => setActiveReport('costs')}
        >
          <FileSpreadsheet size={16} />
          Comparativa de Costos (Compra vs Real)
        </button>
      </div>

      {/* Report 1: Estado de Resultados (P&L) */}
      {activeReport === 'pnl' && (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-default)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{settings.nombreEmpresa}</h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.2rem' }}>
              Estado de Resultados (P&L)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Periodo correspondiente a: <strong>{selectedMonth}</strong> (Cifras expresadas en {settings.moneda})
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <tbody>
              {/* Revenue */}
              <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>1. INGRESOS POR VENTAS</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}></td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 1.5rem', color: 'var(--text-secondary)' }}>Ventas Brutas Facturadas</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(totalGrossSales)}</td>
              </tr>
              {totalDiscounts > 0 && (
                <tr>
                  <td style={{ padding: '0.5rem 1.5rem', color: 'var(--color-danger-text)' }}>(-) Descuentos Concedidos</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-danger-text)' }}>-{formatCurrency(totalDiscounts)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: '0.5rem 1.5rem', fontWeight: 600 }}>(=) Ventas Netas del Periodo</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(totalNetSales)}</td>
              </tr>

              {/* COGS */}
              <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>2. COSTO DE VENTAS (COGS)</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: '0.5rem 1.5rem', color: 'var(--text-secondary)' }}>(-) Costo Directo de Mercancía Vendida</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--color-danger-text)' }}>-{formatCurrency(totalCOGS)}</td>
              </tr>

              {/* Gross Profit */}
              <tr style={{ backgroundColor: 'var(--color-accent-subtle)', borderTop: '2px solid var(--border-default)', borderBottom: '2px solid var(--border-default)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--color-accent-text)' }}>
                  (=) UTILIDAD BRUTA (Margen: {grossMarginPercent}%)
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-accent-text)', fontSize: '1.05rem' }}>
                  {formatCurrency(grossProfit)}
                </td>
              </tr>

              {/* Operating Expenses */}
              <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>3. GASTOS DE OPERACIÓN & ADMINISTRACIÓN</td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}></td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 1.5rem', color: 'var(--text-secondary)' }}>(-) Gastos Fijos (Renta, Servicios, Nóminas)</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>-{formatCurrency(prorrateo.gastosFijos)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 1.5rem', color: 'var(--text-secondary)' }}>(-) Gastos Variables (Marketing, Empaques)</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>-{formatCurrency(prorrateo.gastosVariables)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: '0.5rem 1.5rem', color: 'var(--text-secondary)' }}>(-) Depreciación de Activos Fijos del Periodo</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>-{formatCurrency(totalDepreciation)}</td>
              </tr>

              {/* Net Operating Income */}
              <tr style={{ backgroundColor: netOperatingIncome >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', borderTop: '2px solid var(--border-strong)' }}>
                <td style={{ padding: '1rem 0.75rem', fontWeight: 800, fontSize: '1.1rem', color: netOperatingIncome >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  (=) UTILIDAD OPERATIVA NETA (Margen Neto: {netMarginPercent}%)
                </td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 800, fontSize: '1.25rem', color: netOperatingIncome >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  {formatCurrency(netOperatingIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Report 2: Balance General */}
      {activeReport === 'balance' && (
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-default)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{settings.nombreEmpresa}</h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.2rem' }}>
              Balance General (Estructura Patrimonial)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Al cierre de: <strong>{selectedMonth}</strong> | RFC: {settings.identificacionFiscal}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Activos */}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)', borderBottom: '2px solid var(--border-default)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                ACTIVOS
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700, paddingTop: '0.5rem' }}>Activo Circulante:</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)' }}>Efectivo y Bancos (Estimado)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(estimatedCash)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)' }}>Cuentas por Cobrar (CxC)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalReceivablesCxC)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)' }}>Inventario de Mercancías</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalInventoryAssetValue)}</td>
                  </tr>

                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700, paddingTop: '0.75rem' }}>Activo No Circulante:</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)' }}>Activos Fijos Netos (Libros)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalFixedAssetsNet)}</td>
                  </tr>

                  <tr style={{ borderTop: '2px solid var(--border-default)' }}>
                    <td style={{ padding: '0.75rem 0', fontWeight: 800, fontSize: '1rem' }}>TOTAL ACTIVOS</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-accent)' }}>
                      {formatCurrency(totalAssets)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pasivos y Capital */}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-warning-text)', borderBottom: '2px solid var(--border-default)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                PASIVOS & PATRIMONIO
              </div>
              <table style={{ width: '100%', fontSize: '0.875rem' }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700, paddingTop: '0.5rem' }}>Pasivo a Corto Plazo:</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)' }}>Cuentas por Pagar Proveedores (CxP)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalPayablesCxP)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem 0', fontWeight: 700 }}>Total Pasivos</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(totalLiabilities)}</td>
                  </tr>

                  <tr>
                    <td colSpan={2} style={{ fontWeight: 700, paddingTop: '0.75rem', borderTop: '1px solid var(--border-default)' }}>
                      Patrimonio Contable:
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.35rem 0.75rem', color: 'var(--text-secondary)' }}>Capital Social & Resultados Acumulados</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalEquity)}</td>
                  </tr>

                  <tr style={{ borderTop: '2px solid var(--border-default)' }}>
                    <td style={{ padding: '0.75rem 0', fontWeight: 800, fontSize: '1rem' }}>TOTAL PASIVO + PATRIMONIO</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-success)' }}>
                      {formatCurrency(totalLiabilities + totalEquity)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Sales by Client and Product */}
      {activeReport === 'sales' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Desglose de Ventas del Periodo ({selectedMonth})</h2>
              <p className="card-subtitle">Facturas emitidas y comportamiento por cliente</p>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'center' }}>Condición</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>IVA (16%)</th>
                  <th style={{ textAlign: 'right' }}>Total Facturado</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {monthInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No se registraron ventas en el periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  monthInvoices.map(inv => {
                    const cli = clients.find(c => c.id === inv.clienteId);
                    return (
                      <tr key={inv.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inv.numeroFactura}</td>
                        <td style={{ fontWeight: 600 }}>{cli?.nombre}</td>
                        <td>{formatDate(inv.fechaEmision)}</td>
                        <td style={{ textAlign: 'center' }}>{inv.tipoPago.toUpperCase()}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(inv.subtotal)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(inv.impuestos)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(inv.total)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={inv.estado === 'pagada' ? 'success' : 'info'}>{inv.estado.toUpperCase()}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Cost Comparison */}
      {activeReport === 'costs' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Matriz de Costo Directo vs Costo Real Absorbido</h2>
              <p className="card-subtitle">
                Carga operativa mensual prorrateada: <strong>{formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)} por unidad</strong>
              </p>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'right' }}>Precio Venta</th>
                  <th style={{ textAlign: 'right' }}>Costo Compra</th>
                  <th style={{ textAlign: 'right' }}>Costo Operativo Absorvido</th>
                  <th style={{ textAlign: 'right', fontWeight: 800 }}>Costo Real Total</th>
                  <th style={{ textAlign: 'center' }}>Margen Real %</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const unitProrrated = prorrateo.costoOperativoProrrateadoPorUnidad;
                  const realCost = p.costoPromedio + unitProrrated;
                  const realMargin = p.precioVenta > 0 ? (((p.precioVenta - realCost) / p.precioVenta) * 100).toFixed(1) : 0;

                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.codigo}</td>
                      <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(p.precioVenta)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.costoPromedio)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>+{formatCurrency(unitProrrated)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-accent)' }}>{formatCurrency(realCost)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${Number(realMargin) >= 30 ? 'badge-success' : Number(realMargin) > 0 ? 'badge-warning' : 'badge-danger'}`}>
                          {realMargin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
