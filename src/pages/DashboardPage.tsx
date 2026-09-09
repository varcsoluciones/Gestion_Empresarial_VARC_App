import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { formatCurrency, getMonthKey, formatMonthLabel } from '../utils/formatters';
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

  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // 1. KPI Metrics Calculations (Current Month)
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

  // 2. Historical 6-Month Evolution (Ventas vs Costos Operativos Totales)
  const historicalMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
    }
    return months;
  }, []);

  const historicalStats = useMemo(() => {
    return historicalMonths.map(mKey => {
      const mInvoices = invoices.filter(i =>
        (i.estado === 'emitida' || i.estado === 'pagada') &&
        (i.fechaEmision.startsWith(mKey) || i.emitidaFecha?.startsWith(mKey))
      );
      const ventas = mInvoices.reduce((sum, i) => sum + i.total, 0);
      const ventasSubtotal = mInvoices.reduce((sum, i) => sum + i.subtotal, 0);

      const cogs = mInvoices.reduce((sum, inv) => {
        return sum + inv.items.reduce((iSum, item) => {
          const prod = products.find(p => p.id === item.productoId);
          return iSum + (item.cantidad * (prod?.costoPromedio || 0));
        }, 0);
      }, 0);

      const prorrateoM = getProrrateoMensual(mKey);
      const opex = prorrateoM.gastoOperativoTotal;
      const costoTotal = cogs + opex;
      const utilidad = ventasSubtotal - costoTotal;
      const margen = ventasSubtotal > 0 ? (utilidad / ventasSubtotal) * 100 : 0;

      const fullLabel = formatMonthLabel(mKey);
      const [mName, mYear] = fullLabel.split(' ');
      const shortName = (mName || '').slice(0, 3);

      return {
        monthKey: mKey,
        label: fullLabel,
        shortLabel: `${shortName} '${mYear ? mYear.slice(-2) : ''}`,
        year: mYear || mKey.split('-')[0],
        ventas,
        ventasSubtotal,
        cogs,
        opex,
        costoTotal,
        utilidad,
        margen,
        facturasCount: mInvoices.length
      };
    });
  }, [historicalMonths, invoices, products, getProrrateoMensual]);

  // Aggregate 6M metrics
  const totalVentas6M = historicalStats.reduce((sum, s) => sum + s.ventas, 0);
  const totalCostos6M = historicalStats.reduce((sum, s) => sum + s.costoTotal, 0);
  const totalUtilidad6M = historicalStats.reduce((sum, s) => sum + s.utilidad, 0);
  const totalVentasSub6M = historicalStats.reduce((sum, s) => sum + s.ventasSubtotal, 0);
  const margenPromedio6M = totalVentasSub6M > 0 ? (totalUtilidad6M / totalVentasSub6M) * 100 : 0;

  const maxChartVal = Math.max(
    ...historicalStats.map(s => Math.max(s.ventas, s.costoTotal)),
    1000
  ) * 1.15;

  // 3. Section 1 Data: Semáforo de Cobranza & Créditos CxC
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

  // 4. Section 2 Data: Reabastecimiento Sugerido & Compras Necesarias
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

  // 5. Section 3 Data: Top Productos Estrella & Flujo de Caja (30 Días)
  const totalCommittedOutflows = pendingPayables + prorrateo.gastoOperativoTotal;
  const netCashflowPosition = pendingReceivables - totalCommittedOutflows;

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
    .slice(0, 3);

  const deadStockProducts = products
    .filter(p => p.stockActual > 0 && (!productSalesMap[p.id] || productSalesMap[p.id].qty === 0))
    .slice(0, 3);

  return (
    <div className="page-content">
      {/* Welcome & Action Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Panel de Control & Centro de Mando</h1>
          <p className="page-description">
            Monitoreo en tiempo real de cobranza, compras, inventario y evolución de rentabilidad ({currentMonthKey}).
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

      {/* Top 4 KPI Metrics Grid */}
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

      {/* HERO SECTION: 📊 Gráfico Histórico de Ventas vs Costos Operativos (Últimos 6 Meses) */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        {/* Header with Title and Summary Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <div>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
              <BarChart3 size={20} style={{ color: 'var(--color-accent)' }} />
              Evolución Histórica: Ventas vs. Costos Operativos Totales (6 Meses)
            </h2>
            <p className="card-subtitle" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Comparativa mensual entre Ingresos Facturados, Estructura de Costos (Costo Mercancía + Gastos Operativos) y Margen Neto.
            </p>
          </div>

          {/* 6-Month Summary KPI Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.4rem 0.75rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Ventas (6M): </span>
              <strong style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>{formatCurrency(totalVentas6M)}</strong>
            </div>

            <div style={{
              padding: '0.4rem 0.75rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Costos Totales (6M): </span>
              <strong style={{ color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>{formatCurrency(totalCostos6M)}</strong>
            </div>

            <div style={{
              padding: '0.4rem 0.75rem',
              backgroundColor: totalUtilidad6M >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              border: `1px solid ${totalUtilidad6M >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem'
            }}>
              <span style={{ color: totalUtilidad6M >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>Utilidad Neta: </span>
              <strong style={{ color: totalUtilidad6M >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontSize: '0.85rem' }}>
                {formatCurrency(totalUtilidad6M)} ({margenPromedio6M.toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Visual Chart Canvas */}
        <div style={{ position: 'relative', width: '100%', minHeight: '260px', padding: '0.5rem 0' }}>
          {/* Subtle Gridlines Background */}
          <div style={{
            position: 'absolute',
            inset: '0 0 45px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                borderBottom: '1px dashed var(--border-subtle)'
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  width: '65px',
                  textAlign: 'right',
                  paddingRight: '8px',
                  userSelect: 'none'
                }}>
                  {formatCurrency(maxChartVal * ratio)}
                </span>
                <div style={{ flex: 1 }} />
              </div>
            ))}
          </div>

          {/* Month Columns Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${historicalStats.length}, 1fr)`,
            gap: '1rem',
            height: '220px',
            marginLeft: '70px',
            position: 'relative',
            zIndex: 1
          }}>
            {historicalStats.map((stat, index) => {
              const isHovered = hoveredMonthIndex === index;
              const isCurrent = stat.monthKey === currentMonthKey;

              const ventasHeightPercent = maxChartVal > 0 ? Math.min(100, Math.max(4, (stat.ventas / maxChartVal) * 100)) : 4;
              const costoHeightPercent = maxChartVal > 0 ? Math.min(100, Math.max(4, (stat.costoTotal / maxChartVal) * 100)) : 4;
              
              // Proportion of COGS vs OPEX within the Cost bar
              const cogsPercent = stat.costoTotal > 0 ? (stat.cogs / stat.costoTotal) * 100 : 50;
              const opexPercent = stat.costoTotal > 0 ? (stat.opex / stat.costoTotal) * 100 : 50;

              return (
                <div
                  key={stat.monthKey}
                  onMouseEnter={() => setHoveredMonthIndex(index)}
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: '100%',
                    position: 'relative',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isHovered ? 'var(--bg-surface-hover)' : (isCurrent ? 'var(--color-accent-subtle)' : 'transparent'),
                    border: isCurrent ? '1px solid var(--color-accent)' : '1px solid transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {/* Floating Tooltip on Hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      transform: 'translateY(-100%)',
                      zIndex: 20,
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '0.65rem 0.85rem',
                      width: '210px',
                      fontSize: '0.75rem',
                      pointerEvents: 'none',
                      color: 'var(--text-primary)'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.35rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.25rem' }}>
                        {stat.label} {isCurrent && <span style={{ color: 'var(--color-accent)', fontSize: '0.7rem' }}>(Mes Actual)</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--color-success)' }}>● Ventas Totales:</span>
                        <strong>{formatCurrency(stat.ventas)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', paddingLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>Costo Mercancía (COGS):</span>
                        <span>{formatCurrency(stat.cogs)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', paddingLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>Gastos Operativos (OPEX):</span>
                        <span>{formatCurrency(stat.opex)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', borderTop: '1px dashed var(--border-default)', paddingTop: '0.25rem' }}>
                        <span style={{ color: 'var(--color-danger-text)' }}>● Costo Total:</span>
                        <strong>{formatCurrency(stat.costoTotal)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-default)', paddingTop: '0.25rem', marginTop: '0.15rem' }}>
                        <span style={{ fontWeight: 700, color: stat.utilidad >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                          (=) Utilidad Operativa:
                        </span>
                        <strong style={{ color: stat.utilidad >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                          {formatCurrency(stat.utilidad)}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.7rem', textAlign: 'right', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Margen: {stat.margen.toFixed(1)}% | {stat.facturasCount} ventas
                      </div>
                    </div>
                  )}

                  {/* Dual Paired Bars Container */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '6px',
                    height: '180px',
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    {/* Bar 1: Ventas (Emerald Gradient) */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                      width: '28px'
                    }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${ventasHeightPercent}%`,
                          background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                          borderRadius: '4px 4px 0 0',
                          boxShadow: isHovered ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                          transition: 'height 0.3s ease, transform 0.2s ease',
                          transform: isHovered ? 'scaleY(1.02)' : 'none',
                          position: 'relative'
                        }}
                        title={`Ventas: ${formatCurrency(stat.ventas)}`}
                      />
                    </div>

                    {/* Bar 2: Costos Operativos Totales (Stacked COGS + OPEX) */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                      width: '28px'
                    }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${costoHeightPercent}%`,
                          borderRadius: '4px 4px 0 0',
                          display: 'flex',
                          flexDirection: 'column-reverse',
                          overflow: 'hidden',
                          boxShadow: isHovered ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                          transition: 'height 0.3s ease, transform 0.2s ease',
                          transform: isHovered ? 'scaleY(1.02)' : 'none'
                        }}
                        title={`Costos Totales: ${formatCurrency(stat.costoTotal)} (Mercancía: ${formatCurrency(stat.cogs)}, Gastos: ${formatCurrency(stat.opex)})`}
                      >
                        {/* OPEX portion (Purple/Pink tone) */}
                        <div style={{
                          height: `${opexPercent}%`,
                          background: 'linear-gradient(180deg, #a855f7 0%, #9333ea 100%)',
                          width: '100%'
                        }} />
                        {/* COGS portion (Coral / Amber tone) */}
                        <div style={{
                          height: `${cogsPercent}%`,
                          background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)',
                          width: '100%'
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Month Label & Utility Sub-badge */}
                  <div style={{ marginTop: '0.4rem', textAlign: 'center', width: '100%' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? 'var(--color-accent)' : 'var(--text-primary)'
                    }}>
                      {stat.shortLabel}
                    </div>
                    <div style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      color: stat.utilidad >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                      marginTop: '0.1rem'
                    }}>
                      {stat.utilidad >= 0 ? `+${stat.margen.toFixed(0)}%` : `${stat.margen.toFixed(0)}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          marginTop: '0.85rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-default)',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)' }} />
            <span style={{ fontWeight: 600 }}>Ventas Facturadas</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Costo de Mercancía (COGS)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(180deg, #a855f7 0%, #9333ea 100%)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Gastos Operativos (OPEX Prorrateado)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
            <span style={{ color: 'var(--text-muted)' }}>% Margen Neto Mensual</span>
          </div>
        </div>
      </div>

      {/* 3 COMPACT OPERATIONAL COLUMNS BELOW */}
      <div className="grid-3" style={{ gap: '1.25rem' }}>

        {/* COLUMN 1: 🚨 Semáforo de Cobranza & Créditos CxC */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
                <ShieldAlert size={16} style={{ color: overdueInvoices.length > 0 ? 'var(--color-danger)' : 'var(--color-info)' }} />
                Cobranza & Créditos CxC
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.725rem' }}>
                Facturas vencidas y créditos en riesgo
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ExcelExportButton filename="Alertas_Cobranza_CxC" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('sales')}
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.4rem' }}
              >
                Ventas &rarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {cxcAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.75rem 0.75rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={26} style={{ color: 'var(--color-success)', margin: '0 auto 0.35rem auto', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>¡Cartera al día!</div>
                <div style={{ fontSize: '0.725rem' }}>No hay facturas pendientes por cobrar.</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table" style={{ fontSize: '0.775rem' }}>
                  <thead>
                    <tr>
                      <th>Folio / Cliente</th>
                      <th style={{ textAlign: 'center' }}>Vence</th>
                      <th style={{ textAlign: 'right' }}>Saldo</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cxcAlerts.slice(0, 4).map(inv => (
                      <tr key={inv.id}>
                        <td style={{ padding: '0.4rem 0.3rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.numeroFactura}</div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
                            {inv.clientName}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.4rem 0.2rem' }}>
                          {inv.statusCategory === 'overdue' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-danger-text)', fontWeight: 700, backgroundColor: 'var(--color-danger-bg)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', fontSize: '0.675rem' }}>
                              <AlertCircle size={10} /> {Math.abs(inv.diffDays)}d
                            </span>
                          )}
                          {inv.statusCategory === 'dueSoon' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--color-warning-text)', fontWeight: 700, backgroundColor: 'var(--color-warning-bg)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', fontSize: '0.675rem' }}>
                              <Calendar size={10} /> {inv.diffDays === 0 ? 'Hoy' : `${inv.diffDays}d`}
                            </span>
                          )}
                          {inv.statusCategory === 'normal' && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                              {inv.diffDays}d
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, padding: '0.4rem 0.3rem', color: inv.statusCategory === 'overdue' ? 'var(--color-danger-text)' : 'inherit' }}>
                          {formatCurrency(inv.saldoPendiente)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.4rem 0.2rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
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

          {cxcAlerts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-default)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Vencido: <strong style={{ color: 'var(--color-danger-text)' }}>{formatCurrency(totalOverdueAmount)}</strong></span>
              <span>{dueSoonInvoices.length} por vencer</span>
            </div>
          )}
        </div>

        {/* COLUMN 2: 📦 Reabastecimiento Sugerido & Compras */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                Reabastecimiento ({lowStockProducts.length})
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.725rem' }}>
                Artículos bajo stock de seguridad
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ExcelExportButton filename="Compras_Sugeridas_Reabastecimiento" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('inventory')}
                style={{ fontSize: '0.725rem', padding: '0.25rem 0.4rem' }}
              >
                Stock &rarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.75rem 0.75rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={26} style={{ color: 'var(--color-success)', margin: '0 auto 0.35rem auto', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>¡Stock Saludable!</div>
                <div style={{ fontSize: '0.725rem' }}>Todos los productos están sobre el mínimo.</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table" style={{ fontSize: '0.775rem' }}>
                  <thead>
                    <tr>
                      <th>Producto / SKU</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                      <th style={{ textAlign: 'center' }}>Pedir</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 4).map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '0.4rem 0.3rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
                            {p.nombre}
                          </div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>SKU: {p.codigo}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.4rem 0.2rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>{p.stockActual}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem' }}>/{p.stockMinimo}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.4rem 0.2rem' }}>
                          <span className="badge badge-primary" style={{ padding: '0.15rem 0.35rem', fontWeight: 700, fontSize: '0.7rem' }}>
                            +{p.suggestedQty}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.4rem 0.2rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                            onClick={() => onNavigate('purchases')}
                            title={`Generar orden de compra`}
                          >
                            + Pedir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {lowStockProducts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-default)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Inversión reposición: <strong style={{ color: 'var(--color-accent)' }}>{formatCurrency(totalRestockCost)}</strong></span>
              <span>{lowStockProducts.length} críticos</span>
            </div>
          )}
        </div>

        {/* COLUMN 3: 🏆 Top Ventas & Flujo de Caja */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem' }}>
                <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
                Top Productos & Liquidez
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.725rem' }}>
                Rotación de catálogo y posición a 30 días
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('reports')}
              style={{ fontSize: '0.725rem', padding: '0.25rem 0.4rem' }}
            >
              Reportes &rarr;
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Top 3 Selling Products */}
            {topSellingProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No hay ventas registradas en {currentMonthKey}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {topSellingProducts.map(({ product, qty, total }, index) => {
                  const share = totalSalesMonth > 0 ? Math.round((total / totalSalesMonth) * 100) : 0;
                  return (
                    <div
                      key={product.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-accent)', width: '14px', fontSize: '0.75rem' }}>#{index + 1}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            {product.nombre}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{qty} vendidas ({share}%)</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.775rem' }}>
                        {formatCurrency(total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dead stock warning pill */}
            {deadStockProducts.length > 0 && (
              <div style={{ fontSize: '0.675rem', color: 'var(--color-warning-text)', display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'var(--color-warning-bg)', padding: '0.25rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                <AlertTriangle size={11} />
                <span>Sin ventas: {deadStockProducts.map(p => p.nombre).slice(0, 2).join(', ')}...</span>
              </div>
            )}

            {/* Cash Flow Position Mini Card */}
            <div style={{
              marginTop: 'auto',
              padding: '0.6rem 0.75rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                <span>(+) Entradas CxC:</span>
                <strong style={{ color: 'var(--color-success)' }}>+{formatCurrency(pendingReceivables)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                <span>(-) Salidas CxP + Gastos:</span>
                <strong style={{ color: 'var(--color-danger-text)' }}>-{formatCurrency(totalCommittedOutflows)}</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '0.3rem'
              }}>
                <span style={{ fontSize: '0.725rem', fontWeight: 700 }}>Flujo Neto (30d):</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: netCashflowPosition >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {formatCurrency(netCashflowPosition)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
