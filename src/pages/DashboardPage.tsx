import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { formatCurrency, formatCompactCurrency, getMonthKey, formatMonthLabel } from '../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Calculator,
  CheckCircle,
  Sparkles,
  DollarSign,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import type { NavigationTab } from '../components/layout/Sidebar';
import type { Product } from '../types/erp';

interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

// Lightweight SVG Sparkline Component
const Sparkline: React.FC<{
  values: number[];
  color: string;
  width?: number;
  height?: number;
}> = ({ values, color, width = 64, height = 24 }) => {
  if (!values || values.length === 0) {
    return <div style={{ width, height }} />;
  }

  // Ensure at least 2 points
  const points = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const range = max - min || 1;

  const pad = 2;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;

  const coords = points.map((val, idx) => {
    const x = pad + (idx / (points.length - 1)) * usableW;
    const y = pad + usableH - ((val - min) / range) * usableH;
    return { x, y };
  });

  // Smooth Bezier Curve Path
  let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = i > 0 ? coords[i - 1] : coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = i < coords.length - 2 ? coords[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) * 0.2;
    const cp1y = p1.y + (p2.y - p0.y) * 0.2;
    const cp2x = p2.x - (p3.x - p1.x) * 0.2;
    const cp2y = p2.y - (p3.y - p1.y) * 0.2;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const lastPoint = coords[coords.length - 1];
  const areaPath = `${path} L ${lastPoint.x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;
  const gradId = `spark-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={color} stroke="var(--bg-surface)" strokeWidth="1" />
    </svg>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    invoices,
    purchases,
    products,
    clients,
    expenses,
    inventoryMovements,
    getProrrateoMensual
  } = useERP();

  const currentMonthKey = getMonthKey();
  const prorrateo = getProrrateoMensual(currentMonthKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tab state for Bottom Column 3: 'cashflow' vs 'topskus'
  const [bottomColView, setBottomColView] = useState<'cashflow' | 'topskus'>('cashflow');

  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [hoveredWaterfallStep, setHoveredWaterfallStep] = useState<number | null>(null);

  // 1. Current Month KPI Metrics Calculations
  const validInvoices = invoices.filter(i => i.estado === 'emitida' || i.estado === 'pagada');
  const monthInvoices = validInvoices.filter(i =>
    i.fechaEmision.startsWith(currentMonthKey)
  );

  const totalSalesMonth = monthInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalSalesSubtotal = monthInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscounts = monthInvoices.reduce((sum, i) => sum + i.descuentoTotal, 0);
  const totalGrossSales = totalSalesSubtotal + totalDiscounts;

  const pendingReceivables = invoices
    .filter(i => i.estado === 'emitida' && i.saldoPendiente > 0)
    .reduce((sum, i) => sum + i.saldoPendiente, 0);

  const pendingPayables = purchases
    .filter(p => p.estado === 'recibida' && p.saldoPendiente > 0)
    .reduce((sum, p) => sum + p.saldoPendiente, 0);

  const totalInventoryUnits = products.reduce((sum, p) => sum + p.stockActual, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);

  // Cost of Goods Sold (COGS)
  const totalCostOfGoodsSold = monthInvoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((iSum, item) => {
      let itemCost = item.costoUnitarioHistorico;
      if (!itemCost) {
        const move = inventoryMovements.find(m => m.referenciaDoc === inv.numeroFactura && m.productoId === item.productoId && m.tipo === 'SALIDA_VENTA');
        if (move && move.costoUnitario > 0) {
          itemCost = move.costoUnitario;
        }
      }
      if (!itemCost) {
        const prod = products.find(p => p.id === item.productoId);
        itemCost = prod?.costoPromedio || 0;
      }
      return iSum + (item.cantidad * itemCost);
    }, 0);
  }, 0);

  const grossProfit = totalSalesSubtotal - totalCostOfGoodsSold;
  const opexExpenses = prorrateo.gastosFijos + prorrateo.gastosVariables;
  const assetDepreciation = prorrateo.depreciacionActivos;
  const totalOperatingCosts = opexExpenses + assetDepreciation;
  const netOperatingProfit = grossProfit - totalOperatingCosts;
  const netProfitMargin = totalSalesSubtotal > 0 ? (netOperatingProfit / totalSalesSubtotal) * 100 : 0;

  // 2. Dynamic Historical Evolution
  const historicalStats = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    const curMonthKey = `${curY}-${String(curM).padStart(2, '0')}`;

    // Collect all month keys that have activity
    const activityMonthKeys = new Set<string>();
    invoices.forEach(i => {
      if (i.estado === 'emitida' || i.estado === 'pagada') {
        if (i.fechaEmision && i.fechaEmision.length >= 7) {
          activityMonthKeys.add(i.fechaEmision.slice(0, 7));
        }
      }
    });
    expenses.forEach(e => {
      if (e.periodoMes) activityMonthKeys.add(e.periodoMes);
      if (e.fecha && e.fecha.length >= 7) activityMonthKeys.add(e.fecha.slice(0, 7));
    });

    const sortedActivity = Array.from(activityMonthKeys).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();

    const minActive = sortedActivity.length > 0 ? sortedActivity[0] : curMonthKey;
    const maxActive = sortedActivity.length > 0 ? sortedActivity[sortedActivity.length - 1] : curMonthKey;
    const endMonthKey = maxActive > curMonthKey ? maxActive : curMonthKey;

    const [endY, endM] = endMonthKey.split('-').map(Number);
    const [minY, minM] = minActive.split('-').map(Number);

    const spanMonths = (endY - minY) * 12 + (endM - minM) + 1;
    const startBack = Math.max(spanMonths - 1, 5); // at least 6 months
    const startDate = new Date(endY, endM - 1 - startBack, 1);
    const endDate = new Date(endY, endM - 1, 1);

    const candidateMonths: string[] = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      candidateMonths.push(`${y}-${m}`);
      curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    }

    const rawStats = candidateMonths.map(mKey => {
      const mInvoices = invoices.filter(i =>
        (i.estado === 'emitida' || i.estado === 'pagada') &&
        (i.fechaEmision.startsWith(mKey))
      );
      const ventas = mInvoices.reduce((sum, i) => sum + i.total, 0);
      const ventasSubtotal = mInvoices.reduce((sum, i) => sum + i.subtotal, 0);

      const cogs = mInvoices.reduce((sum, inv) => {
        return sum + inv.items.reduce((iSum, item) => {
          let itemCost = item.costoUnitarioHistorico;
          if (!itemCost) {
            const move = inventoryMovements.find(m => m.referenciaDoc === inv.numeroFactura && m.productoId === item.productoId && m.tipo === 'SALIDA_VENTA');
            if (move && move.costoUnitario > 0) {
              itemCost = move.costoUnitario;
            }
          }
          if (!itemCost) {
            const prod = products.find(p => p.id === item.productoId);
            itemCost = prod?.costoPromedio || 0;
          }
          return iSum + (item.cantidad * itemCost);
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

      const hasActivity = mInvoices.length > 0 || opex > 0 || cogs > 0 || ventas > 0;

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
        facturasCount: mInvoices.length,
        hasActivity
      };
    });

    const firstActiveIdx = rawStats.findIndex(s => s.hasActivity);
    if (firstActiveIdx !== -1) {
      return rawStats.slice(firstActiveIdx);
    }
    return [rawStats[rawStats.length - 1]];
  }, [invoices, products, expenses, getProrrateoMensual]);

  // Aggregate metrics over active historical range
  const totalVentasHist = historicalStats.reduce((sum, s) => sum + s.ventas, 0);
  const totalCostosHist = historicalStats.reduce((sum, s) => sum + s.costoTotal, 0);
  const totalUtilidadHist = historicalStats.reduce((sum, s) => sum + s.utilidad, 0);
  const totalVentasSubHist = historicalStats.reduce((sum, s) => sum + s.ventasSubtotal, 0);
  const margenPromedioHist = totalVentasSubHist > 0 ? (totalUtilidadHist / totalVentasSubHist) * 100 : 0;

  // Month-over-Month calculation for Top Cards
  const previousMonthStat = historicalStats.length >= 2 ? historicalStats[historicalStats.length - 2] : null;
  const currentMonthStat = historicalStats[historicalStats.length - 1] || null;

  const salesGrowthMoM = previousMonthStat && previousMonthStat.ventas > 0 && currentMonthStat
    ? ((currentMonthStat.ventas - previousMonthStat.ventas) / previousMonthStat.ventas) * 100
    : 0;

  // Sparkline point series (last 6 months)
  const sparklineSales = historicalStats.map(s => s.ventas);
  const sparklineProfit = historicalStats.map(s => Math.max(0, s.utilidad));
  const sparklineMargins = historicalStats.map(s => Math.max(0, s.margen));
  const sparklineCostos = historicalStats.map(s => s.costoTotal);

  // 3. Operational Data: CxC Alerts & Aging
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
  const totalOverdueAmount = overdueInvoices.reduce((sum, i) => sum + i.saldoPendiente, 0);

  // 4. Operational Data: Low Stock & Reordering
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

  // 5. Operational Data: Top Selling SKUs
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

  // 6. Operational Data: Cash Flow 30-Day Projections
  const totalCommittedOutflows = pendingPayables + prorrateo.gastoOperativoTotal;
  const netCashflowPosition = pendingReceivables - totalCommittedOutflows;

  // SVG Chart Geometry Calculations (Spline Multimes)
  const svgWidth = 500;
  const svgHeight = 180;
  const padLeft = 14;
  const padRight = 14;
  const padTop = 12;
  const padBottom = 12;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxChartVal = Math.max(
    ...historicalStats.map(s => Math.max(s.ventas, s.costoTotal)),
    1000
  ) * 1.15;

  const numPoints = historicalStats.length;
  const getX = (index: number) => {
    if (numPoints <= 1) return padLeft + chartW / 2;
    return padLeft + (index * (chartW / (numPoints - 1)));
  };
  const getY = (val: number) => padTop + chartH - (Math.max(0, val) / maxChartVal) * chartH;

  const ventasPoints = historicalStats.map((s, idx) => ({ x: getX(idx), y: getY(s.ventas), val: s.ventas }));
  const costoPoints = historicalStats.map((s, idx) => ({ x: getX(idx), y: getY(s.costoTotal), val: s.costoTotal }));
  const utilidadPoints = historicalStats.map((s, idx) => ({ x: getX(idx), y: getY(Math.max(0, s.utilidad)), val: s.utilidad }));

  const makeSmoothCurve = (points: { x: number; y: number }[], tension = 0.28) => {
    if (points.length <= 1) return '';
    if (points.length === 2) {
      return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
    }

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const makeSmoothArea = (points: { x: number; y: number }[], baseY: number, tension = 0.28) => {
    const curve = makeSmoothCurve(points, tension);
    if (!curve || points.length <= 1) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${curve} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
  };

  const ventasLinePath = makeSmoothCurve(ventasPoints, 0.28);
  const costoLinePath = makeSmoothCurve(costoPoints, 0.28);
  const utilidadLinePath = makeSmoothCurve(utilidadPoints, 0.28);
  const ventasAreaPath = makeSmoothArea(ventasPoints, padTop + chartH, 0.28);

  // 7. Waterfall Profit Bridge Calculation Engine
  const waterfallSteps = useMemo(() => {
    // 1. Gross Sales
    const s1_gross = totalGrossSales || totalSalesSubtotal || 0;
    // 2. Cost of Sales (Deduction)
    const s2_cogs = totalCostOfGoodsSold;
    // 3. Gross Margin (Subtotal)
    const s3_grossMargin = s1_gross - s2_cogs;
    // 4. Operating Expenses OpEx (Deduction)
    const s4_opex = opexExpenses;
    // 5. Asset Depreciation (Deduction)
    const s5_deprec = assetDepreciation;
    // 6. Net Profit (Final Total)
    const s6_netProfit = s3_grossMargin - s4_opex - s5_deprec;

    const maxVal = Math.max(s1_gross, 1000) * 1.15;

    return [
      {
        id: 'gross_sales',
        label: 'Ventas Brutas',
        shortLabel: 'Ingresos',
        amount: s1_gross,
        delta: s1_gross,
        type: 'total' as const,
        startVal: 0,
        endVal: s1_gross,
        color: '#10b981',
        description: 'Facturación total emitida en el periodo'
      },
      {
        id: 'cogs',
        label: '(-) Costo de Venta (COGS)',
        shortLabel: 'Costo Mercancía',
        amount: s2_cogs,
        delta: -s2_cogs,
        type: 'deduction' as const,
        startVal: s1_gross,
        endVal: Math.max(0, s1_gross - s2_cogs),
        color: '#f43f5e',
        description: 'Costo directo promedio de los productos vendidos'
      },
      {
        id: 'gross_margin',
        label: '(=) Margen Bruto',
        shortLabel: 'Margen Bruto',
        amount: s3_grossMargin,
        delta: s3_grossMargin,
        type: 'subtotal' as const,
        startVal: 0,
        endVal: s3_grossMargin,
        color: '#0284c7',
        description: 'Ganancia bruta antes de gastos de estructura y operación'
      },
      {
        id: 'opex',
        label: '(-) Gastos OpEx',
        shortLabel: 'Gastos Operativos',
        amount: s4_opex,
        delta: -s4_opex,
        type: 'deduction' as const,
        startVal: s3_grossMargin,
        endVal: Math.max(0, s3_grossMargin - s4_opex),
        color: '#f59e0b',
        description: 'Gastos fijos, variables y servicios del periodo'
      },
      {
        id: 'depreciation',
        label: '(-) Depreciación',
        shortLabel: 'Deprec. Activos',
        amount: s5_deprec,
        delta: -s5_deprec,
        type: 'deduction' as const,
        startVal: Math.max(0, s3_grossMargin - s4_opex),
        endVal: Math.max(0, s3_grossMargin - s4_opex - s5_deprec),
        color: '#a855f7',
        description: 'Desgaste contable mensual de mobiliario y equipo'
      },
      {
        id: 'net_profit',
        label: '(=) Utilidad Neta Real',
        shortLabel: 'Utilidad Neta',
        amount: s6_netProfit,
        delta: s6_netProfit,
        type: 'final' as const,
        startVal: 0,
        endVal: s6_netProfit,
        color: s6_netProfit >= 0 ? '#059669' : '#dc2626',
        description: 'Resultado neto disponible después de todos los costos contables'
      }
    ].map(step => ({
      ...step,
      maxVal,
      marginPct: s1_gross > 0 ? (step.amount / s1_gross) * 100 : 0
    }));
  }, [totalGrossSales, totalSalesSubtotal, totalCostOfGoodsSold, opexExpenses, assetDepreciation]);

  return (
    <div className="page-content dashboard-page-container">
      {/* 1. Header de Mando */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--color-accent)' }} />
            Tablero de Control & Centro de Mando
          </h1>
          <p className="page-description">
            Monitoreo en tiempo real de operaciones, liquidez, inventario y evolución de rentabilidad contable ({currentMonthKey}).
          </p>
        </div>
        <div className="page-actions" style={{ gap: '0.5rem' }}>
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

      {/* 2. Top 5 Micro-KPIs con Sparklines */}
      <div className="grid-5">
        {/* Card 1: Ventas del Mes */}
        <div className="stat-sparkline-card">
          <div className="stat-sparkline-header">
            <span className="stat-sparkline-title">Ventas del Mes</span>
            <div className="stat-sparkline-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="stat-sparkline-main">
            <div className="stat-sparkline-val">{formatCurrency(totalSalesMonth)}</div>
            <div className="stat-sparkline-graph">
              <Sparkline values={sparklineSales} color="var(--color-accent)" />
            </div>
          </div>
          <div className="stat-sparkline-footer">
            <span>{monthInvoices.length} facturas emitidas</span>
            {salesGrowthMoM !== 0 && (
              <span className="stat-sparkline-badge" style={{
                backgroundColor: salesGrowthMoM > 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                color: salesGrowthMoM > 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)'
              }}>
                {salesGrowthMoM > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {Math.abs(salesGrowthMoM).toFixed(0)}% MoM
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Utilidad Neta & Margen */}
        <div className="stat-sparkline-card">
          <div className="stat-sparkline-header">
            <span className="stat-sparkline-title">Utilidad Neta Real</span>
            <div className="stat-sparkline-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <DollarSign size={14} />
            </div>
          </div>
          <div className="stat-sparkline-main">
            <div className="stat-sparkline-val">
              {formatCurrency(netOperatingProfit)}
            </div>
            <div className="stat-sparkline-graph">
              <Sparkline values={sparklineProfit} color="var(--color-accent)" />
            </div>
          </div>
          <div className="stat-sparkline-footer">
            <span>Margen sobre ventas</span>
            <span className="stat-sparkline-badge" style={{
              backgroundColor: netProfitMargin >= 15 ? 'var(--color-success-bg)' : (netProfitMargin >= 0 ? 'rgba(14, 165, 233, 0.12)' : 'var(--color-danger-bg)'),
              color: netProfitMargin >= 15 ? 'var(--color-success-text)' : (netProfitMargin >= 0 ? '#0284c7' : 'var(--color-danger-text)')
            }}>
              {netProfitMargin.toFixed(1)}% margen
            </span>
          </div>
        </div>

        {/* Card 3: Cuentas por Cobrar (CxC) */}
        <div className="stat-sparkline-card">
          <div className="stat-sparkline-header">
            <span className="stat-sparkline-title">Por Cobrar (CxC)</span>
            <div className="stat-sparkline-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <CreditCard size={14} />
            </div>
          </div>
          <div className="stat-sparkline-main">
            <div className="stat-sparkline-val">
              {formatCurrency(pendingReceivables)}
            </div>
            <div className="stat-sparkline-graph">
              <Sparkline values={sparklineMargins} color="var(--color-accent)" />
            </div>
          </div>
          <div className="stat-sparkline-footer">
            <span>{cxcAlerts.length} facturas con saldo</span>
            {overdueInvoices.length > 0 ? (
              <span className="stat-sparkline-badge" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
                {overdueInvoices.length} vencidas
              </span>
            ) : (
              <span className="stat-sparkline-badge" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                Al día
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Cuentas por Pagar (CxP) */}
        <div className="stat-sparkline-card">
          <div className="stat-sparkline-header">
            <span className="stat-sparkline-title">Por Pagar (CxP)</span>
            <div className="stat-sparkline-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="stat-sparkline-main">
            <div className="stat-sparkline-val">
              {formatCurrency(pendingPayables)}
            </div>
            <div className="stat-sparkline-graph">
              <Sparkline values={sparklineCostos} color="var(--color-accent)" />
            </div>
          </div>
          <div className="stat-sparkline-footer">
            <span>{purchases.filter(p => p.estado === 'recibida' && p.saldoPendiente > 0).length} compras pendientes</span>
            <span className="stat-sparkline-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              Proveedores
            </span>
          </div>
        </div>

        {/* Card 5: Valor de Inventario */}
        <div className="stat-sparkline-card">
          <div className="stat-sparkline-header">
            <span className="stat-sparkline-title">Inventario Activo</span>
            <div className="stat-sparkline-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <Boxes size={14} />
            </div>
          </div>
          <div className="stat-sparkline-main">
            <div className="stat-sparkline-val">{formatCurrency(totalInventoryValue)}</div>
            <div className="stat-sparkline-graph">
              <Sparkline values={sparklineSales.map((v, i) => v * 0.7 + i * 100)} color="var(--color-accent)" />
            </div>
          </div>
          <div className="stat-sparkline-footer">
            <span>{totalInventoryUnits} pzas en stock</span>
            {lowStockProducts.length > 0 ? (
              <span className="stat-sparkline-badge" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>
                {lowStockProducts.length} críticos
              </span>
            ) : (
              <span className="stat-sparkline-badge" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                Stock óptimo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Módulo Analítico Central: Dos Gráficas Separadas Lado a Lado (30% Más Altas y Tipografía Proporcional) */}
      <div className="dashboard-charts-grid">
        {/* Gráfica 1: Tendencias Multimes (Evolución Financiera) */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                <TrendingUp size={18} style={{ color: 'var(--color-accent)' }} />
                Evolución Financiera Histórica
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                Ventas, Costos y Utilidad Neta ({historicalStats.length} {historicalStats.length === 1 ? 'mes' : 'meses'})
              </p>
            </div>

            {/* Leyenda con indicadores de color y totales acumulados */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Ventas ({formatCompactCurrency(totalVentasHist)})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e' }} />
                Costos ({formatCompactCurrency(totalCostosHist)})
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: totalUtilidadHist >= 0 ? '#0284c7' : 'var(--color-danger-text)',
                fontWeight: 600
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0ea5e9' }} />
                Utilidad ({formatCompactCurrency(totalUtilidadHist)} · {margenPromedioHist.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Área del Gráfico con Altura Incrementada un 30% (234px) y Tipografía HTML no deformable */}
          <div style={{ position: 'relative', width: '100%', height: '234px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', width: '100%', height: '202px', position: 'relative' }}>
              {/* Eje Y: Escala en HTML (Cero deformación o estiramiento de texto) */}
              <div style={{ width: '42px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '6px', textAlign: 'right', flexShrink: 0 }}>
                {[1, 0.66, 0.33, 0].map((frac, idx) => {
                  const val = maxChartVal * frac;
                  return (
                    <span key={idx} style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                    </span>
                  );
                })}
              </div>

              {/* Contenedor del SVG interactivo (Solo dibuja trazos, no fuentes) */}
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="areaVentasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineVentasGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="lineCostoGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                    <linearGradient id="lineUtilidadGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>

                  {/* Líneas horizontales guía */}
                  {[0, 0.33, 0.66, 1].map((frac, idx) => {
                    const yPos = padTop + chartH * frac;
                    return (
                      <line key={idx} x1={padLeft} y1={yPos} x2={svgWidth - padRight} y2={yPos} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    );
                  })}

                  {/* Curvas y Áreas Suaves */}
                  {ventasAreaPath && <path d={ventasAreaPath} fill="url(#areaVentasGrad)" />}
                  {costoLinePath && <path d={costoLinePath} fill="none" stroke="url(#lineCostoGrad)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 2" />}
                  {ventasLinePath && <path d={ventasLinePath} fill="none" stroke="url(#lineVentasGrad)" strokeWidth="2.5" strokeLinecap="round" />}
                  {utilidadLinePath && <path d={utilidadLinePath} fill="none" stroke="url(#lineUtilidadGrad)" strokeWidth="2" strokeLinecap="round" />}

                  {/* Nodos Interactivos */}
                  {historicalStats.map((stat, idx) => {
                    const xPos = getX(idx);
                    const isHovered = hoveredMonthIndex === idx;

                    return (
                      <g
                        key={stat.monthKey}
                        onMouseEnter={() => setHoveredMonthIndex(idx)}
                        onMouseLeave={() => setHoveredMonthIndex(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect x={xPos - chartW / (numPoints * 2 || 2)} y={padTop} width={chartW / (numPoints || 1)} height={chartH} fill="transparent" />

                        {isHovered && (
                          <line x1={xPos} y1={padTop} x2={xPos} y2={padTop + chartH} stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="2 2" />
                        )}

                        {/* Ventas Circle */}
                        <circle
                          cx={xPos}
                          cy={getY(stat.ventas)}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#10b981"
                          stroke="var(--bg-surface)"
                          strokeWidth="2"
                        />

                        {/* Costos Circle */}
                        <circle
                          cx={xPos}
                          cy={getY(stat.costoTotal)}
                          r={isHovered ? 4.5 : 3}
                          fill="#f43f5e"
                          stroke="var(--bg-surface)"
                          strokeWidth="1.5"
                        />

                        {/* Utilidad Circle (Punto azul interactivo) */}
                        <circle
                          cx={xPos}
                          cy={getY(Math.max(0, stat.utilidad))}
                          r={isHovered ? 4.5 : 3}
                          fill="#0ea5e9"
                          stroke="var(--bg-surface)"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip Flotante Adaptativo (Tema Claro / Oscuro) */}
                {hoveredMonthIndex !== null && historicalStats[hoveredMonthIndex] && (
                  <div
                    className="dashboard-chart-tooltip"
                    style={{
                      top: '6px',
                      left: `${(hoveredMonthIndex / (numPoints - 1 || 1)) * 100}%`,
                      transform: hoveredMonthIndex > numPoints / 2 ? 'translateX(-85%)' : 'translateX(-15%)',
                    }}
                  >
                    <div style={{ fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.2rem', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                      {historicalStats[hoveredMonthIndex].label}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.85rem', color: '#10b981', marginBottom: '0.15rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Ventas:</span>
                      <strong>{formatCurrency(historicalStats[hoveredMonthIndex].ventas)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.85rem', color: '#f43f5e', marginBottom: '0.15rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Costos:</span>
                      <strong>{formatCurrency(historicalStats[hoveredMonthIndex].costoTotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.85rem', color: '#0ea5e9' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Utilidad Neta:</span>
                      <strong>
                        {formatCurrency(historicalStats[hoveredMonthIndex].utilidad)} ({historicalStats[hoveredMonthIndex].margen.toFixed(0)}%)
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Eje X: Etiquetas de Meses en HTML (Sin distorsión tipográfica) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '42px', paddingRight: '6px', height: '22px', alignItems: 'center' }}>
              {historicalStats.map((stat, idx) => {
                const isHovered = hoveredMonthIndex === idx;
                return (
                  <span
                    key={stat.monthKey}
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isHovered ? 700 : 500,
                      color: isHovered ? 'var(--color-accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {stat.shortLabel}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfica 2: Puente Waterfall de Rentabilidad */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                <BarChart3 size={18} style={{ color: '#0ea5e9' }} />
                Puente de Utilidad (Waterfall)
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                De Ventas a Utilidad Neta Real ({currentMonthKey})
              </p>
            </div>

            <div style={{
              padding: '0.25rem 0.55rem',
              backgroundColor: netOperatingProfit >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-danger-bg)',
              border: `1px solid ${netOperatingProfit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--color-danger)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Neto:</span>
              <strong style={{ color: netOperatingProfit >= 0 ? '#10b981' : 'var(--color-danger-text)' }}>
                {formatCurrency(netOperatingProfit)} ({netProfitMargin.toFixed(0)}%)
              </strong>
            </div>
          </div>

          {/* Área del Gráfico Waterfall con Altura Incrementada un 30% (234px) */}
          <div style={{ position: 'relative', width: '100%', height: '234px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem', height: '100%', alignItems: 'end', padding: '0.25rem 0.15rem 0.5rem 0.15rem' }}>
              {waterfallSteps.map((step, idx) => {
                const maxV = step.maxVal;
                const bottomPct = (step.startVal < step.endVal ? step.startVal : step.endVal) / maxV * 100;
                const heightPct = Math.max(8, (Math.abs(step.endVal - step.startVal) / maxV) * 100);
                const isHovered = hoveredWaterfallStep === idx;

                return (
                  <div
                    key={step.id}
                    onMouseEnter={() => setHoveredWaterfallStep(idx)}
                    onMouseLeave={() => setHoveredWaterfallStep(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Valor numérico superior en HTML (Nítido, nunca estirado) */}
                    <div
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: step.color,
                        textAlign: 'center',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {step.type === 'deduction' ? '-' : (step.type === 'total' ? '+' : '=')}
                      {step.amount >= 1000 ? `$${(step.amount / 1000).toFixed(0)}k` : `$${step.amount.toFixed(0)}`}
                    </div>

                    {/* Barra Flotante Escalonada con Altura Proporcional */}
                    <div style={{ position: 'relative', width: '100%', height: '142px', display: 'flex', alignItems: 'flex-end' }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: `${bottomPct}%`,
                          left: '8%',
                          width: '84%',
                          height: `${heightPct}%`,
                          backgroundColor: step.color,
                          borderRadius: '4px',
                          boxShadow: isHovered ? `0 4px 12px ${step.color}66` : 'none',
                          transform: isHovered ? 'scaleY(1.03)' : 'none',
                          transition: 'all 0.18s ease',
                          opacity: hoveredWaterfallStep !== null && !isHovered ? 0.6 : 1
                        }}
                      />
                    </div>

                    {/* Etiquetas Inferiores en HTML (Nítidas y Proporcionales) */}
                    <div style={{ textAlign: 'center', marginTop: '6px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {step.shortLabel}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {step.marginPct.toFixed(0)}% vta
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tooltip Flotante Waterfall Adaptativo (Tema Claro / Oscuro) */}
            {hoveredWaterfallStep !== null && waterfallSteps[hoveredWaterfallStep] && (
              <div
                className="dashboard-chart-tooltip"
                style={{
                  top: '4px',
                  right: '6px',
                  borderLeft: `3px solid ${waterfallSteps[hoveredWaterfallStep].color}`,
                  maxWidth: '260px',
                  whiteSpace: 'normal'
                }}
              >
                <div style={{ fontWeight: 700, color: waterfallSteps[hoveredWaterfallStep].color, marginBottom: '0.2rem', fontSize: '0.8125rem' }}>
                  {waterfallSteps[hoveredWaterfallStep].label}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.35 }}>
                  {waterfallSteps[hoveredWaterfallStep].description}
                </div>
                <div style={{ marginTop: '0.35rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Impacto:</span>
                  <strong style={{ color: waterfallSteps[hoveredWaterfallStep].color }}>
                    {formatCurrency(waterfallSteps[hoveredWaterfallStep].amount)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Cuadrícula Operativa Inferior (3 Columnas Compactas) */}
      <div className="grid-3" style={{ gap: '0.85rem' }}>
        {/* Columna 1: Semáforo de Cartera CxC */}
        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0, color: 'var(--text-primary)' }}>
              <CreditCard size={16} style={{ color: 'var(--color-info)' }} />
              Semáforo de Cobranza CxC
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {cxcAlerts.length} cuentas pendientes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto', maxHeight: '150px' }}>
            {cxcAlerts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-success-text)', fontSize: '0.8125rem', gap: '0.35rem', padding: '1rem 0' }}>
                <CheckCircle size={15} /> Cartera al 100% cobrada y al día
              </div>
            ) : (
              cxcAlerts.slice(0, 3).map(inv => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${inv.statusCategory === 'overdue' ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '60%' }}>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inv.clientName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Folio: {inv.numeroFactura}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: inv.statusCategory === 'overdue' ? 'var(--color-danger-text)' : 'inherit' }}>
                      {formatCurrency(inv.saldoPendiente)}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: inv.statusCategory === 'overdue' ? 'var(--color-danger-text)' : (inv.statusCategory === 'dueSoon' ? 'var(--color-warning-text)' : 'var(--color-success-text)')
                    }}>
                      {inv.diffDays < 0 ? `${Math.abs(inv.diffDays)}d vencida` : (inv.diffDays === 0 ? 'Vence hoy' : `En ${inv.diffDays}d`)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '0.45rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total vencido:</span>
            <strong style={{ fontSize: '0.85rem', color: totalOverdueAmount > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {formatCurrency(totalOverdueAmount)}
            </strong>
          </div>
        </div>

        {/* Columna 2: Reabastecimiento Inteligente de Stock */}
        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0, color: 'var(--text-primary)' }}>
              <Boxes size={16} style={{ color: 'var(--color-warning)' }} />
              Reabastecimiento de Stock
            </h3>
            <span style={{ fontSize: '0.75rem', color: lowStockProducts.length > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)', fontWeight: 600 }}>
              {lowStockProducts.length} bajo mínimo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto', maxHeight: '150px' }}>
            {lowStockProducts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-success-text)', fontSize: '0.8125rem', gap: '0.35rem', padding: '1rem 0' }}>
                <CheckCircle size={15} /> Todas las existencias están sobre el mínimo
              </div>
            ) : (
              lowStockProducts.slice(0, 3).map(prod => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '60%' }}>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.nombre}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Stock: <strong style={{ color: 'var(--color-danger-text)' }}>{prod.stockActual}</strong> / Min: {prod.stockMinimo}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                      +{prod.suggestedQty} pzas
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Est: {formatCurrency(prod.estimatedCost)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: '0.45rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Costo estimado reposición:</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>
              {formatCurrency(totalRestockCost)}
            </strong>
          </div>
        </div>

        {/* Columna 3: Proyección de Liquidez / SKUs Estrella */}
        <div className="card" style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                type="button"
                onClick={() => setBottomColView('cashflow')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 0.3rem 0.15rem 0.3rem',
                  fontSize: '0.875rem',
                  fontWeight: bottomColView === 'cashflow' ? 700 : 500,
                  color: bottomColView === 'cashflow' ? 'var(--color-accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: bottomColView === 'cashflow' ? '2px solid var(--color-accent)' : '2px solid transparent'
                }}
              >
                Flujo 30 Días
              </button>
              <span style={{ color: 'var(--border-default)', fontSize: '0.875rem' }}>|</span>
              <button
                type="button"
                onClick={() => setBottomColView('topskus')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 0.3rem 0.15rem 0.3rem',
                  fontSize: '0.875rem',
                  fontWeight: bottomColView === 'topskus' ? 700 : 500,
                  color: bottomColView === 'topskus' ? 'var(--color-accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: bottomColView === 'topskus' ? '2px solid var(--color-accent)' : '2px solid transparent'
                }}
              >
                Top SKUs
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {bottomColView === 'cashflow' ? 'Entradas vs Salidas' : 'Más vendidos'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto', maxHeight: '150px' }}>
            {bottomColView === 'cashflow' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.2rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>(+) Cobros esperados (CxC):</span>
                  <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(pendingReceivables)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>(-) Pagos proveedores (CxP):</span>
                  <strong style={{ color: 'var(--color-danger-text)' }}>-{formatCurrency(pendingPayables)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>(-) Gastos OpEx estimados:</span>
                  <strong style={{ color: 'var(--color-warning-text)' }}>-{formatCurrency(prorrateo.gastoOperativoTotal)}</strong>
                </div>
                <div style={{
                  padding: '0.35rem 0.55rem',
                  backgroundColor: netCashflowPosition >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-danger-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${netCashflowPosition >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'var(--color-danger)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600 }}>Posición Neta Proyectada:</span>
                  <strong style={{ color: netCashflowPosition >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                    {formatCurrency(netCashflowPosition)}
                  </strong>
                </div>
              </div>
            ) : (
              topSellingProducts.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1rem 0' }}>
                  Sin ventas registradas en el mes actual
                </div>
              ) : (
                topSellingProducts.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.6rem',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: '65%' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product.nombre}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.total)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.qty} pzas vendidas
                      </span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          <div style={{ marginTop: '0.45rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acción recomendada:</span>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
            >
              Ir a Ventas <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
