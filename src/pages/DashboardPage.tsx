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

  // SVG Chart Geometry Calculations
  const svgWidth = 500;
  const svgHeight = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index * (chartW / Math.max(1, historicalStats.length - 1)));
  const getY = (val: number) => padTop + chartH - (Math.max(0, val) / maxChartVal) * chartH;

  const ventasPoints = historicalStats.map((s, idx) => ({ x: getX(idx), y: getY(s.ventas), val: s.ventas }));
  const costoPoints = historicalStats.map((s, idx) => ({ x: getX(idx), y: getY(s.costoTotal), val: s.costoTotal }));
  const utilidadPoints = historicalStats.map((s, idx) => ({ x: getX(idx), y: getY(Math.max(0, s.utilidad)), val: s.utilidad }));

  const makePath = (points: { x: number; y: number }[]) => {
    return points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  };

  const ventasLinePath = makePath(ventasPoints);
  const costoLinePath = makePath(costoPoints);
  const utilidadLinePath = makePath(utilidadPoints);

  const ventasAreaPath = ventasPoints.length > 0
    ? `${ventasLinePath} L ${ventasPoints[ventasPoints.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${ventasPoints[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
    : '';

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
            Monitoreo en tiempo real de cobranza, compras, inventario y tendencias de rentabilidad ({currentMonthKey}).
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

      {/* 4 STRATEGIC OPERATIONAL QUADRANTS (2x2 GRID) */}
      <div className="grid-2" style={{ gap: '1.25rem' }}>

        {/* QUADRANT 1: 📈 Gráfica de Línea de Tendencias Históricas (6 Meses) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem' }}>
                <TrendingUp size={17} style={{ color: 'var(--color-accent)' }} />
                Tendencias Históricas (6 Meses)
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                Ventas vs Costos Operativos Totales y Margen
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <div style={{
                padding: '0.2rem 0.45rem',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Ventas: </span>
                <strong style={{ color: '#10b981' }}>{formatCurrency(totalVentas6M)}</strong>
              </div>
              <div style={{
                padding: '0.2rem 0.45rem',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Costos: </span>
                <strong style={{ color: '#f43f5e' }}>{formatCurrency(totalCostos6M)}</strong>
              </div>
              <div style={{
                padding: '0.2rem 0.45rem',
                backgroundColor: totalUtilidad6M >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                border: `1px solid ${totalUtilidad6M >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem'
              }}>
                <span style={{ color: totalUtilidad6M >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>Utilidad: </span>
                <strong style={{ color: totalUtilidad6M >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  {formatCurrency(totalUtilidad6M)} ({margenPromedio6M.toFixed(0)}%)
                </strong>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: '195px' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="ventasLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#10b981" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Gridlines */}
              {[1, 0.66, 0.33, 0].map((ratio, idx) => {
                const yPos = padTop + chartH * (1 - ratio);
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={padLeft + chartW}
                      y2={yPos}
                      stroke="var(--border-subtle)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 6}
                      y={yPos + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="var(--text-muted)"
                    >
                      {formatCurrency(maxChartVal * ratio).replace('.00', '')}
                    </text>
                  </g>
                );
              })}

              {/* Area under Ventas Line */}
              {ventasAreaPath && (
                <path d={ventasAreaPath} fill="url(#ventasLineGrad)" />
              )}

              {/* Costos Operativos Line (Red/Coral) */}
              <path
                d={costoLinePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Ventas Line (Green Solid) */}
              <path
                d={ventasLinePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowGreen)"
              />

              {/* Utilidad Line (Cyan / Blue) */}
              <path
                d={utilidadLinePath}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X Axis Month Labels & Interactive Columns */}
              {historicalStats.map((stat, idx) => {
                const x = getX(idx);
                const isHovered = hoveredMonthIndex === idx;
                const isCurrent = stat.monthKey === currentMonthKey;

                return (
                  <g key={stat.monthKey} onMouseEnter={() => setHoveredMonthIndex(idx)} onMouseLeave={() => setHoveredMonthIndex(null)} style={{ cursor: 'pointer' }}>
                    {/* Hover vertical bar */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={padTop}
                        x2={x}
                        y2={padTop + chartH}
                        stroke="var(--color-accent)"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Data Points */}
                    <circle
                      cx={x}
                      cy={getY(stat.ventas)}
                      r={isHovered ? 6 : 4}
                      fill="#10b981"
                      stroke="var(--bg-surface)"
                      strokeWidth="2"
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    <circle
                      cx={x}
                      cy={getY(stat.costoTotal)}
                      r={isHovered ? 5 : 3.5}
                      fill="#f43f5e"
                      stroke="var(--bg-surface)"
                      strokeWidth="2"
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    <circle
                      cx={x}
                      cy={getY(Math.max(0, stat.utilidad))}
                      r={isHovered ? 5 : 3}
                      fill="#0ea5e9"
                      stroke="var(--bg-surface)"
                      strokeWidth="1.5"
                      style={{ transition: 'all 0.2s ease' }}
                    />

                    {/* X Month Label */}
                    <text
                      x={x}
                      y={padTop + chartH + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight={isCurrent ? '800' : (isHovered ? '700' : '500')}
                      fill={isCurrent ? 'var(--color-accent)' : (isHovered ? 'var(--text-primary)' : 'var(--text-secondary)')}
                    >
                      {stat.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredMonthIndex !== null && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: `${(getX(hoveredMonthIndex) / svgWidth) * 100}%`,
                transform: hoveredMonthIndex > 3 ? 'translateX(-95%)' : 'translateX(5%)',
                zIndex: 20,
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.5rem 0.75rem',
                width: '185px',
                fontSize: '0.725rem',
                pointerEvents: 'none'
              }}>
                <div style={{ fontWeight: 800, borderBottom: '1px solid var(--border-default)', paddingBottom: '0.2rem', marginBottom: '0.25rem' }}>
                  {historicalStats[hoveredMonthIndex].label}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', marginBottom: '0.15rem' }}>
                  <span>Ventas:</span>
                  <strong>{formatCurrency(historicalStats[hoveredMonthIndex].ventas)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e', marginBottom: '0.15rem' }}>
                  <span>Costos Totales:</span>
                  <strong>{formatCurrency(historicalStats[hoveredMonthIndex].costoTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0ea5e9', borderTop: '1px dashed var(--border-default)', paddingTop: '0.2rem', marginTop: '0.15rem' }}>
                  <span>Utilidad Neta:</span>
                  <strong>{formatCurrency(historicalStats[hoveredMonthIndex].utilidad)}</strong>
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.1rem' }}>
                  Margen: {historicalStats[hoveredMonthIndex].margen.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '0.4rem',
            paddingTop: '0.4rem',
            borderTop: '1px solid var(--border-default)',
            fontSize: '0.725rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontWeight: 600 }}>Ventas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Costos Operativos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Utilidad Neta</span>
            </div>
          </div>
        </div>

        {/* QUADRANT 2: 🚨 Semáforo de Cobranza & Créditos CxC */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem' }}>
                <ShieldAlert size={17} style={{ color: overdueInvoices.length > 0 ? 'var(--color-danger)' : 'var(--color-info)' }} />
                Semáforo de Cobranza & Créditos CxC
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                Facturas vencidas y créditos por cobrar en 7 días
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ExcelExportButton filename="Alertas_Cobranza_CxC" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('sales')}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem' }}
              >
                Ventas &rarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {cxcAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0.75rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={28} style={{ color: 'var(--color-success)', margin: '0 auto 0.35rem auto', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>¡Cartera al día!</div>
                <div style={{ fontSize: '0.75rem' }}>No hay facturas vencidas ni saldos pendientes por cobrar.</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table" style={{ fontSize: '0.775rem' }}>
                  <thead>
                    <tr>
                      <th>Folio / Cliente</th>
                      <th style={{ textAlign: 'center' }}>Vence</th>
                      <th style={{ textAlign: 'right' }}>Saldo CxC</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cxcAlerts.slice(0, 5).map(inv => (
                      <tr key={inv.id}>
                        <td style={{ padding: '0.45rem 0.3rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.numeroFactura}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {inv.clientName}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.45rem 0.2rem' }}>
                          {inv.statusCategory === 'overdue' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-danger-text)', fontWeight: 700, backgroundColor: 'var(--color-danger-bg)', padding: '2px 5px', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem' }}>
                              <AlertCircle size={11} /> {Math.abs(inv.diffDays)}d vencida
                            </span>
                          )}
                          {inv.statusCategory === 'dueSoon' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-warning-text)', fontWeight: 700, backgroundColor: 'var(--color-warning-bg)', padding: '2px 5px', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem' }}>
                              <Calendar size={11} /> {inv.diffDays === 0 ? 'Hoy' : `${inv.diffDays}d`}
                            </span>
                          )}
                          {inv.statusCategory === 'normal' && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.725rem' }}>
                              En {inv.diffDays}d
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, padding: '0.45rem 0.3rem', color: inv.statusCategory === 'overdue' ? 'var(--color-danger-text)' : 'inherit' }}>
                          {formatCurrency(inv.saldoPendiente)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.45rem 0.2rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-default)', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <span>Vencido en riesgo: <strong style={{ color: 'var(--color-danger-text)' }}>{formatCurrency(totalOverdueAmount)}</strong></span>
              <span><strong>{dueSoonInvoices.length}</strong> facturas por vencer</span>
            </div>
          )}
        </div>

        {/* QUADRANT 3: 📦 Reabastecimiento Sugerido & Compras */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem' }}>
                <AlertTriangle size={17} style={{ color: 'var(--color-warning)' }} />
                Reabastecimiento Sugerido & Compras ({lowStockProducts.length})
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                Productos bajo el umbral mínimo con cálculo de compra sugerida
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ExcelExportButton filename="Compras_Sugeridas_Reabastecimiento" />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('inventory')}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem' }}
              >
                Inventario &rarr;
              </button>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0.75rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={28} style={{ color: 'var(--color-success)', margin: '0 auto 0.35rem auto', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>¡Stock Saludable!</div>
                <div style={{ fontSize: '0.75rem' }}>Todos los productos están por encima de su mínimo.</div>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="table" style={{ fontSize: '0.775rem' }}>
                  <thead>
                    <tr>
                      <th>Producto / SKU</th>
                      <th style={{ textAlign: 'center' }}>Stock / Mín</th>
                      <th style={{ textAlign: 'center' }}>Sugerido</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 5).map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '0.45rem 0.3rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {p.nombre}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {p.codigo}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.45rem 0.2rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>{p.stockActual}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}> / {p.stockMinimo}</span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.45rem 0.2rem' }}>
                          <span className="badge badge-primary" style={{ padding: '0.15rem 0.4rem', fontWeight: 700, fontSize: '0.725rem' }}>
                            +{p.suggestedQty} {p.unidadMedida}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.45rem 0.2rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem' }}
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

          {lowStockProducts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-default)', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <span>Inversión reposición: <strong style={{ color: 'var(--color-accent)' }}>{formatCurrency(totalRestockCost)}</strong></span>
              <span><strong>{lowStockProducts.length}</strong> artículos críticos</span>
            </div>
          )}
        </div>

        {/* QUADRANT 4: 🏆 Top Productos & Proyección de Flujo de Caja (30 Días) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem' }}>
                <Sparkles size={17} style={{ color: 'var(--color-accent)' }} />
                Top Productos & Flujo de Caja
              </h2>
              <p className="card-subtitle" style={{ fontSize: '0.75rem' }}>
                Productos estrella de mayor rotación y posición de liquidez a 30 días
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('reports')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.45rem' }}
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
                        padding: '0.35rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        fontSize: '0.775rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-accent)', width: '16px', fontSize: '0.775rem' }}>#{index + 1}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                            {product.nombre}
                          </div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{qty} vendidas ({share}% del mes)</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.8rem' }}>
                        {formatCurrency(total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dead stock warning pill */}
            {deadStockProducts.length > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--color-warning-text)', display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--color-warning-bg)', padding: '0.25rem 0.45rem', borderRadius: 'var(--radius-sm)' }}>
                <AlertTriangle size={12} />
                <span>Inventario sin rotación en el mes: {deadStockProducts.map(p => p.nombre).slice(0, 2).join(', ')}</span>
              </div>
            )}

            {/* Cash Flow Position Mini Card (30 Days) */}
            <div style={{
              marginTop: 'auto',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                <span>(+) Entradas proyectadas (CxC):</span>
                <strong style={{ color: 'var(--color-success)' }}>+{formatCurrency(pendingReceivables)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                <span>(-) Salidas comprometidas (CxP + Gastos):</span>
                <strong style={{ color: 'var(--color-danger-text)' }}>-{formatCurrency(totalCommittedOutflows)}</strong>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '0.35rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Posición Neta de Liquidez:</span>
                <span style={{
                  fontSize: '0.9rem',
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
