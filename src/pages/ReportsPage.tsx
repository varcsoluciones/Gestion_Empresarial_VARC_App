import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { formatCurrency, formatDateTime, getMonthKey } from '../utils/formatters';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Printer,
  Scale,
  ChevronDown,
  ChevronRight,
  Package,
  Users,
  Boxes,
  DollarSign,
  Layers,
  ArrowDownRight,
  PieChart,
  Search,
  Filter
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { useTableSort } from '../hooks/useTableSort';
import type { ExcelColumnDefinition } from '../utils/excelExport';

interface ReportsPageProps {
  initialReport?: 'pnl' | 'balance' | 'sales' | 'costs' | 'profitability';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialReport }) => {
  const {
    invoices,
    purchases,
    products,
    categories,
    clients,
    expenses,
    fixedAssets,
    settings,
    getProrrateoMensual,
    getProductRealCost
  } = useERP();

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [activeReport, setActiveReport] = useState<'pnl' | 'balance' | 'sales' | 'costs' | 'profitability'>(initialReport || 'pnl');

  React.useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);

  // Expanded row state for Product and Client tables in the Sales report
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const toggleProduct = (id: string) => {
    setExpandedProducts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleClient = (id: string) => {
    setExpandedClients(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  // 3. Detailed Aggregations for Sales Report: By Product and By Client
  const productSalesMap = new Map<string, {
    productoId: string;
    codigo: string;
    nombre: string;
    categoria: string;
    totalCantidad: number;
    totalMonto: number;
    totalDescuento: number;
    ventas: Array<{
      facturaId: string;
      numeroFactura: string;
      fecha: string;
      clienteNombre: string;
      varianteId?: string;
      varianteSku: string;
      varianteDesc: string;
      cantidad: number;
      precioUnitario: number;
      descuentoPorcentaje: number;
      descuentoMonto: number;
      subtotal: number;
      estado: string;
    }>;
  }>();

  monthInvoices.forEach(inv => {
    const cli = clients.find(c => c.id === inv.clienteId);
    const clientName = cli?.nombre || 'Cliente General';

    inv.items.forEach(item => {
      const prod = products.find(p => p.id === item.productoId);
      const prodId = item.productoId || prod?.id || 'sin-id';
      const prodCodigo = prod?.codigo || 'PROD';
      const prodNombre = prod?.nombre || item.descripcion || 'Producto';
      const cat = categories.find(c => c.id === prod?.categoriaId);
      const prodCat = cat?.nombre || 'General';

      const variant = prod?.variantes?.find(v => v.id === item.varianteId);
      const variantSku = variant?.sku || (item.varianteId ? `VAR-${item.varianteId.slice(-4).toUpperCase()}` : '-');
      const variantDesc = variant ? `${variant.color} / Talla ${variant.talla}` : '';

      const lineGross = item.cantidad * item.precioUnitario;
      const lineDiscountPct = item.descuento || 0;
      const lineDiscountMonto = Math.max(0, lineGross - item.subtotal);

      if (!productSalesMap.has(prodId)) {
        productSalesMap.set(prodId, {
          productoId: prodId,
          codigo: prodCodigo,
          nombre: prodNombre,
          categoria: prodCat,
          totalCantidad: 0,
          totalMonto: 0,
          totalDescuento: 0,
          ventas: []
        });
      }

      const entry = productSalesMap.get(prodId)!;
      entry.totalCantidad += item.cantidad;
      entry.totalMonto += item.subtotal;
      entry.totalDescuento += lineDiscountMonto;
      entry.ventas.push({
        facturaId: inv.id,
        numeroFactura: inv.numeroFactura,
        fecha: inv.fechaEmision,
        clienteNombre: clientName,
        varianteId: item.varianteId,
        varianteSku: variantSku,
        varianteDesc: variantDesc,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuentoPorcentaje: lineDiscountPct,
        descuentoMonto: lineDiscountMonto,
        subtotal: item.subtotal,
        estado: inv.estado
      });
    });
  });

  const productSalesList = Array.from(productSalesMap.values()).sort((a, b) => b.totalMonto - a.totalMonto);

  const clientSalesMap = new Map<string, {
    clienteId: string;
    codigo: string;
    nombre: string;
    identificacionFiscal: string;
    totalFacturas: number;
    totalPiezas: number;
    totalMonto: number;
    totalSaldo: number;
    facturas: Array<{
      id: string;
      numeroFactura: string;
      fecha: string;
      tipoPago: string;
      totalPiezas: number;
      subtotal: number;
      impuestos: number;
      total: number;
      saldoPendiente: number;
      estado: string;
    }>;
  }>();

  monthInvoices.forEach(inv => {
    const cli = clients.find(c => c.id === inv.clienteId);
    const clientId = inv.clienteId || 'cli-general';
    const clientCode = cli ? `CL-${cli.id.slice(-4).toUpperCase()}` : 'CL-GEN';
    const clientName = cli?.nombre || 'Cliente General';
    const clientTaxId = cli?.identificacionFiscal || 'XAXX010101000';
    const invPieces = inv.items.reduce((sum, it) => sum + it.cantidad, 0);

    if (!clientSalesMap.has(clientId)) {
      clientSalesMap.set(clientId, {
        clienteId: clientId,
        codigo: clientCode,
        nombre: clientName,
        identificacionFiscal: clientTaxId,
        totalFacturas: 0,
        totalPiezas: 0,
        totalMonto: 0,
        totalSaldo: 0,
        facturas: []
      });
    }

    const entry = clientSalesMap.get(clientId)!;
    entry.totalFacturas += 1;
    entry.totalPiezas += invPieces;
    entry.totalMonto += inv.total;
    entry.totalSaldo += inv.saldoPendiente;
    entry.facturas.push({
      id: inv.id,
      numeroFactura: inv.numeroFactura,
      fecha: inv.fechaEmision,
      tipoPago: inv.tipoPago,
      totalPiezas: invPieces,
      subtotal: inv.subtotal,
      impuestos: inv.impuestos,
      total: inv.total,
      saldoPendiente: inv.saldoPendiente,
      estado: inv.estado
    });
  });

  const clientSalesList = Array.from(clientSalesMap.values()).sort((a, b) => b.totalMonto - a.totalMonto);

  // 4. Calculations for Cost Comparison with Available Stock and Real Inventory Valuation
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockActual, 0);
  const totalValuationCompra = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);
  const totalValuationReal = products.reduce((sum, p) => {
    const costs = getProductRealCost(p.id, selectedMonth);
    return sum + (p.stockActual * costs.costoReal);
  }, 0);

  // 5. Calculations for SKU-Level Profitability Analysis (Análisis de Rentabilidad por SKU)
  const [profitabilitySearch, setProfitabilitySearch] = useState('');
  const [profitabilityCategoryFilter, setProfitabilityCategoryFilter] = useState('all');
  const [profitabilityOnlySales, setProfitabilityOnlySales] = useState(false);

  interface SkuProfitabilityRow {
    id: string;
    productoId: string;
    varianteId?: string;
    sku: string;
    productoNombre: string;
    detalleVariante: string;
    nombreCompleto: string;
    categoriaNombre: string;
    cantidadVendida: number;
    costoCompra: number;
    gastoOperativo: number;
    gastoDepreciacion: number;
    gastoTotal: number;
    precioVenta: number;
    costoTotalVenta: number;
    ingresoTotal: number;
    margenMonto: number;
    margenPorcentaje: number;
  }

  const skuProfitabilityList: SkuProfitabilityRow[] = useMemo(() => {
    const list: SkuProfitabilityRow[] = [];
    const matchedInvoiceItemIds = new Set<string>();

    products.forEach(p => {
      const costs = getProductRealCost(p.id, selectedMonth);
      const cat = categories.find(c => c.id === p.categoriaId);
      const catName = cat?.nombre || 'General';

      if (p.tieneVariantes && p.variantes && p.variantes.length > 0) {
        p.variantes.forEach(v => {
          const skuCode = v.sku || `${p.codigo}-${v.talla}-${v.color}`;
          const variantPrice = p.precioVenta + (v.precioExtra || 0);
          const varDesc = `${v.color} / Talla ${v.talla}`;
          const fullName = `${p.nombre} (${varDesc})`;

          // Find matching invoice items in this month
          const matchingItems = monthInvoices.flatMap(inv => inv.items).filter(it => {
            if (it.productoId === p.id && it.varianteId === v.id) {
              matchedInvoiceItemIds.add(it.id);
              return true;
            }
            return false;
          });

          const cantVendida = matchingItems.reduce((sum, it) => sum + it.cantidad, 0);
          const ingreso = matchingItems.reduce((sum, it) => sum + it.subtotal, 0);
          const costoTotalVta = cantVendida * costs.costoReal;
          const margenM = ingreso - costoTotalVta;
          const margenPct = ingreso > 0
            ? Number(((margenM / ingreso) * 100).toFixed(1))
            : (variantPrice > 0 ? Number((((variantPrice - costs.costoReal) / variantPrice) * 100).toFixed(1)) : 0);

          list.push({
            id: `sku-${p.id}-${v.id}`,
            productoId: p.id,
            varianteId: v.id,
            sku: skuCode,
            productoNombre: p.nombre,
            detalleVariante: varDesc,
            nombreCompleto: fullName,
            categoriaNombre: catName,
            cantidadVendida: cantVendida,
            costoCompra: costs.costoCompra,
            gastoOperativo: costs.gastoOperativoUnitario,
            gastoDepreciacion: costs.gastoDepreciacionUnitario,
            gastoTotal: costs.costoReal,
            precioVenta: variantPrice,
            costoTotalVenta: Number(costoTotalVta.toFixed(2)),
            ingresoTotal: Number(ingreso.toFixed(2)),
            margenMonto: Number(margenM.toFixed(2)),
            margenPorcentaje: margenPct
          });
        });
      } else {
        const skuCode = p.codigo;
        const fullName = p.nombre;

        const matchingItems = monthInvoices.flatMap(inv => inv.items).filter(it => {
          if (it.productoId === p.id) {
            matchedInvoiceItemIds.add(it.id);
            return true;
          }
          return false;
        });

        const cantVendida = matchingItems.reduce((sum, it) => sum + it.cantidad, 0);
        const ingreso = matchingItems.reduce((sum, it) => sum + it.subtotal, 0);
        const costoTotalVta = cantVendida * costs.costoReal;
        const margenM = ingreso - costoTotalVta;
        const margenPct = ingreso > 0
          ? Number(((margenM / ingreso) * 100).toFixed(1))
          : (p.precioVenta > 0 ? Number((((p.precioVenta - costs.costoReal) / p.precioVenta) * 100).toFixed(1)) : 0);

        list.push({
          id: `sku-${p.id}-base`,
          productoId: p.id,
          varianteId: undefined,
          sku: skuCode,
          productoNombre: p.nombre,
          detalleVariante: '',
          nombreCompleto: fullName,
          categoriaNombre: catName,
          cantidadVendida: cantVendida,
          costoCompra: costs.costoCompra,
          gastoOperativo: costs.gastoOperativoUnitario,
          gastoDepreciacion: costs.gastoDepreciacionUnitario,
          gastoTotal: costs.costoReal,
          precioVenta: p.precioVenta,
          costoTotalVenta: Number(costoTotalVta.toFixed(2)),
          ingresoTotal: Number(ingreso.toFixed(2)),
          margenMonto: Number(margenM.toFixed(2)),
          margenPorcentaje: margenPct
        });
      }
    });

    // Capture any custom/orphaned line items in month invoices
    monthInvoices.forEach(inv => {
      inv.items.forEach(it => {
        if (!matchedInvoiceItemIds.has(it.id)) {
          const cantVendida = it.cantidad;
          const ingreso = it.subtotal;
          const costoUnit = (it.precioUnitario * 0.6);
          const costoTotalVta = cantVendida * costoUnit;
          const margenM = ingreso - costoTotalVta;
          list.push({
            id: `sku-custom-${it.id}`,
            productoId: it.productoId || 'custom',
            sku: 'PERSONALIZADO',
            productoNombre: it.descripcion,
            detalleVariante: 'Item en factura',
            nombreCompleto: it.descripcion,
            categoriaNombre: 'Otros',
            cantidadVendida: cantVendida,
            costoCompra: Number(costoUnit.toFixed(2)),
            gastoOperativo: 0,
            gastoDepreciacion: 0,
            gastoTotal: Number(costoUnit.toFixed(2)),
            precioVenta: it.precioUnitario,
            costoTotalVenta: Number(costoTotalVta.toFixed(2)),
            ingresoTotal: Number(ingreso.toFixed(2)),
            margenMonto: Number(margenM.toFixed(2)),
            margenPorcentaje: ingreso > 0 ? Number(((margenM / ingreso) * 100).toFixed(1)) : 0
          });
        }
      });
    });

    return list;
  }, [products, categories, monthInvoices, selectedMonth, getProductRealCost]);

  // Filtering for Profitability Analysis
  const filteredSkuProfitability = useMemo(() => {
    return skuProfitabilityList.filter(item => {
      const matchSearch = item.sku.toLowerCase().includes(profitabilitySearch.toLowerCase()) ||
        item.nombreCompleto.toLowerCase().includes(profitabilitySearch.toLowerCase()) ||
        item.categoriaNombre.toLowerCase().includes(profitabilitySearch.toLowerCase());

      const matchCat = profitabilityCategoryFilter === 'all' || item.categoriaNombre === profitabilityCategoryFilter;
      const matchSales = !profitabilityOnlySales || item.cantidadVendida > 0;

      return matchSearch && matchCat && matchSales;
    });
  }, [skuProfitabilityList, profitabilitySearch, profitabilityCategoryFilter, profitabilityOnlySales]);

  // Sorting for Profitability Analysis
  const {
    sortedItems: sortedSkuProfitability,
    sortKey: profSortKey,
    sortDirection: profSortDirection,
    requestSort: requestProfSort
  } = useTableSort(filteredSkuProfitability, {
    defaultKey: 'ingresoTotal',
    defaultDirection: 'desc',
    defaultIsNumeric: true
  });

  // Totals for filtered profitability
  const profitabilitySummary = useMemo(() => {
    const totalVendidas = sortedSkuProfitability.reduce((s, i) => s + i.cantidadVendida, 0);
    const totalCostoVenta = sortedSkuProfitability.reduce((s, i) => s + i.costoTotalVenta, 0);
    const totalIngreso = sortedSkuProfitability.reduce((s, i) => s + i.ingresoTotal, 0);
    const totalMargenMonto = totalIngreso - totalCostoVenta;
    const totalMargenPct = totalIngreso > 0 ? ((totalMargenMonto / totalIngreso) * 100).toFixed(1) : '0';

    return {
      totalVendidas,
      totalCostoVenta,
      totalIngreso,
      totalMargenMonto,
      totalMargenPct,
      countItems: sortedSkuProfitability.length
    };
  }, [sortedSkuProfitability]);

  const profitabilityExcelColumns: ExcelColumnDefinition[] = [
    { key: 'sku', label: 'SKU / Código' },
    { key: 'productoNombre', label: 'Producto' },
    { key: 'detalleVariante', label: 'Variante / Detalle' },
    { key: 'categoriaNombre', label: 'Categoría' },
    { key: 'cantidadVendida', label: 'Cantidad Vendida' },
    { key: 'costoCompra', label: 'Costo Compra Unitario', formatter: (v) => formatCurrency(v) },
    { key: 'gastoOperativo', label: 'Gasto Operativo Unitario', formatter: (v) => formatCurrency(v) },
    { key: 'gastoDepreciacion', label: 'Gasto Depreciación Unitario', formatter: (v) => formatCurrency(v) },
    { key: 'gastoTotal', label: 'Gasto Total (Costo Real)', formatter: (v) => formatCurrency(v) },
    { key: 'precioVenta', label: 'Precio Venta Unitario', formatter: (v) => formatCurrency(v) },
    { key: 'costoTotalVenta', label: 'Costo Total de Venta', formatter: (v) => formatCurrency(v) },
    { key: 'ingresoTotal', label: 'Ingreso Total Facturado', formatter: (v) => formatCurrency(v) },
    { key: 'margenMonto', label: 'Margen Final ($)', formatter: (v) => formatCurrency(v) },
    { key: 'margenPorcentaje', label: 'Margen Final (%)', formatter: (v) => `${v}%` }
  ];

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input');
              if (input) {
                if ('showPicker' in input && typeof (input as any).showPicker === 'function') {
                  try {
                    (input as any).showPicker();
                  } catch {
                    input.focus();
                  }
                } else {
                  input.focus();
                }
              }
            }}
            title="Haz clic para seleccionar el periodo contable"
          >
            <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Periodo:</span>
            <input
              type="month"
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ExcelExportButton filename={`Reporte_${activeReport.toUpperCase()}_${selectedMonth}`} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrintReport}>
              <Printer size={15} />
              Imprimir Reporte
            </button>
          </div>
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
          Comparativa de Costos
        </button>
        <button
          type="button"
          className={`tab-btn ${activeReport === 'profitability' ? 'active' : ''}`}
          onClick={() => setActiveReport('profitability')}
        >
          <PieChart size={16} />
          Análisis de Rentabilidad
        </button>
      </div>

      {/* Report 1: Estado de Resultados (P&L) */}
      {activeReport === 'pnl' && (
        <div className="card">
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
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(totalGrossSales)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem 1.5rem', color: totalDiscounts > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)' }}>
                  (-) Descuentos y Rebajas sobre Ventas
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: totalDiscounts > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)', fontWeight: totalDiscounts > 0 ? 600 : 400 }}>
                  {totalDiscounts > 0 ? `-${formatCurrency(totalDiscounts)}` : formatCurrency(0)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <td style={{ padding: '0.5rem 1.5rem', fontWeight: 700 }}>(=) Ventas Netas del Periodo</td>
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
        <div className="card">
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-default)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{settings.nombreEmpresa}</h2>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.2rem' }}>
              Balance General (Estructura Patrimonial)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Al cierre de: <strong>{selectedMonth}</strong> | RFC: {settings.identificacionFiscal}
            </div>
          </div>

          <div className="responsive-split-grid">
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

      {/* Report 3: Sales by Client and Product (TWO SEPARATE EXPANDABLE TABLES) */}
      {activeReport === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Quick KPIs Summary Bar */}
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-header">
                <span>Ventas Netas del Mes</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="stat-value">{formatCurrency(totalNetSales)}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>{monthInvoices.length} facturas emitidas</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Productos Vendidos</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                  <Package size={18} />
                </div>
              </div>
              <div className="stat-value">{productSalesList.length} catálogo</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>
                  {productSalesList.reduce((sum, p) => sum + p.totalCantidad, 0)} unidades totales
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Clientes Compradores</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="stat-value">{clientSalesList.length} clientes</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>
                  Saldo CxC: {formatCurrency(clientSalesList.reduce((sum, c) => sum + c.totalSaldo, 0))}
                </span>
              </div>
            </div>
          </div>

          {/* TABLE 1: Resumen y Detalle de Ventas por Producto */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Package size={20} style={{ color: 'var(--color-accent)' }} />
                  <h2 className="card-title">1. Resumen de Ventas por Producto ({selectedMonth})</h2>
                </div>
                <p className="card-subtitle">
                  Monto total vendido y unidades por producto. <strong>Haz clic en cualquier fila para desplegar las transacciones y clientes.</strong>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExcelExportButton filename={`Ventas_Por_Producto_${selectedMonth}`} />
                <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                  {productSalesList.length} productos con movimiento
                </span>
              </div>
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'center' }}>Unidades Vendidas</th>
                    <th style={{ textAlign: 'right' }}>Descuentos ({settings.monedaSimbolo || '$'})</th>
                    <th style={{ textAlign: 'right', fontWeight: 800 }}>Total Vendido ({settings.monedaSimbolo || '$'})</th>
                    <th style={{ textAlign: 'center' }}>% Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {productSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No se registraron ventas de productos en el periodo seleccionado ({selectedMonth}).
                      </td>
                    </tr>
                  ) : (
                    productSalesList.map(prodGroup => {
                      const isExpanded = !!expandedProducts[prodGroup.productoId];
                      const percentShare = totalNetSales > 0 ? ((prodGroup.totalMonto / totalNetSales) * 100).toFixed(1) : '0';

                      return (
                        <React.Fragment key={prodGroup.productoId}>
                          <tr
                            onClick={() => toggleProduct(prodGroup.productoId)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isExpanded ? 'var(--bg-subtle)' : 'transparent',
                              transition: 'background-color 0.15s ease'
                            }}
                            title="Haz clic para ver el desglose de ventas de este producto"
                          >
                            <td style={{ textAlign: 'center', color: 'var(--color-accent)' }}>
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                              {prodGroup.codigo}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{prodGroup.nombre}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {prodGroup.ventas.length} transacciones en el periodo
                              </div>
                            </td>
                            <td>{prodGroup.categoria}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {prodGroup.totalCantidad} pzas
                            </td>
                            <td style={{ textAlign: 'right', color: prodGroup.totalDescuento > 0 ? 'var(--color-danger-text)' : 'var(--text-muted)' }}>
                              {prodGroup.totalDescuento > 0 ? `-${formatCurrency(prodGroup.totalDescuento)}` : formatCurrency(0)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {formatCurrency(prodGroup.totalMonto)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                                {percentShare}%
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Breakdown for Product */}
                          {isExpanded && (
                            <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                              <td colSpan={8} style={{ padding: '1rem 1.5rem' }}>
                                <div style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--border-default)',
                                  padding: '1rem',
                                  boxShadow: 'var(--shadow-sm)'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}>
                                      <ArrowDownRight size={16} style={{ color: 'var(--color-accent)' }} />
                                      Desglose de Facturas y Clientes: <span style={{ color: 'var(--color-accent)' }}>{prodGroup.nombre}</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      Total piezas: <strong>{prodGroup.totalCantidad}</strong> | Total vendido: <strong>{formatCurrency(prodGroup.totalMonto)}</strong>
                                    </span>
                                  </div>

                                  <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.4rem 0.5rem' }}>Folio Factura</th>
                                        <th style={{ padding: '0.4rem 0.5rem' }}>Fecha Emisión</th>
                                        <th style={{ padding: '0.4rem 0.5rem' }}>Cliente</th>
                                        <th style={{ padding: '0.4rem 0.5rem' }}>SKU / Variante</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Cantidad</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Precio Unitario</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Descuento (%)</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>Subtotal</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prodGroup.ventas.map((sale, idx) => (
                                        <tr key={`${sale.facturaId}-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                          <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent)' }}>
                                            {sale.numeroFactura}
                                          </td>
                                          <td style={{ padding: '0.5rem' }}>{formatDateTime(sale.fecha)}</td>
                                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{sale.clienteNombre}</td>
                                          <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                            {sale.varianteSku !== '-' ? (
                                              <div>
                                                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{sale.varianteSku}</span>
                                                {sale.varianteDesc && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sale.varianteDesc}</div>}
                                              </div>
                                            ) : (
                                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                                            )}
                                          </td>
                                          <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{sale.cantidad}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(sale.precioUnitario)}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            {sale.descuentoPorcentaje > 0 ? (
                                              <div>
                                                <Badge variant="warning">{sale.descuentoPorcentaje}%</Badge>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-danger-text)' }}>
                                                  -{formatCurrency(sale.descuentoMonto)}
                                                </div>
                                              </div>
                                            ) : (
                                              <span style={{ color: 'var(--text-muted)' }}>0%</span>
                                            )}
                                          </td>
                                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>
                                            {formatCurrency(sale.subtotal)}
                                          </td>
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <Badge variant={sale.estado === 'pagada' ? 'success' : 'info'}>
                                              {sale.estado.toUpperCase()}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                {productSalesList.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: 'var(--bg-subtle)', fontWeight: 800, borderTop: '2px solid var(--border-default)' }}>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>
                        TOTALES:
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        {productSalesList.reduce((sum, p) => sum + p.totalCantidad, 0)} pzas
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>
                        {formatCurrency(productSalesList.reduce((sum, p) => sum + p.totalDescuento, 0))}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                        {formatCurrency(productSalesList.reduce((sum, p) => sum + p.totalMonto, 0))}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        100.0%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* TABLE 2: Resumen y Detalle de Ventas por Cliente */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Users size={20} style={{ color: 'var(--color-accent)' }} />
                  <h2 className="card-title">2. Resumen de Ventas por Cliente ({selectedMonth})</h2>
                </div>
                <p className="card-subtitle">
                  Compras consolidadas y facturación acumulada por cliente. <strong>Haz clic en cualquier fila para ver el desglose de facturas emitidas.</strong>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExcelExportButton filename={`Ventas_Por_Cliente_${selectedMonth}`} />
                <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                  {clientSalesList.length} clientes con facturación
                </span>
              </div>
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}></th>
                    <th>Código / ID</th>
                    <th>Cliente</th>
                    <th>RFC / ID Fiscal</th>
                    <th style={{ textAlign: 'center' }}>No. Facturas</th>
                    <th style={{ textAlign: 'center' }}>Piezas Totales</th>
                    <th style={{ textAlign: 'right' }}>Saldo Pendiente (CxC)</th>
                    <th style={{ textAlign: 'right', fontWeight: 800 }}>Total Facturado ({settings.monedaSimbolo || '$'})</th>
                    <th style={{ textAlign: 'center' }}>% Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {clientSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No se registraron ventas a clientes en el periodo seleccionado ({selectedMonth}).
                      </td>
                    </tr>
                  ) : (
                    clientSalesList.map(cliGroup => {
                      const isExpanded = !!expandedClients[cliGroup.clienteId];
                      const totalInvoicedAll = clientSalesList.reduce((sum, c) => sum + c.totalMonto, 0);
                      const percentShare = totalInvoicedAll > 0 ? ((cliGroup.totalMonto / totalInvoicedAll) * 100).toFixed(1) : '0';

                      return (
                        <React.Fragment key={cliGroup.clienteId}>
                          <tr
                            onClick={() => toggleClient(cliGroup.clienteId)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isExpanded ? 'var(--bg-subtle)' : 'transparent',
                              transition: 'background-color 0.15s ease'
                            }}
                            title="Haz clic para ver las facturas detalladas de este cliente"
                          >
                            <td style={{ textAlign: 'center', color: 'var(--color-accent)' }}>
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                              {cliGroup.codigo}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{cliGroup.nombre}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {cliGroup.totalFacturas} factura(s) en {selectedMonth}
                              </div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                              {cliGroup.identificacionFiscal}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              {cliGroup.totalFacturas}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {cliGroup.totalPiezas} pzas
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: cliGroup.totalSaldo > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
                              {formatCurrency(cliGroup.totalSaldo)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {formatCurrency(cliGroup.totalMonto)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                                {percentShare}%
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Breakdown for Client */}
                          {isExpanded && (
                            <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                              <td colSpan={9} style={{ padding: '1rem 1.5rem' }}>
                                <div style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid var(--border-default)',
                                  padding: '1rem',
                                  boxShadow: 'var(--shadow-sm)'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem' }}>
                                      <ArrowDownRight size={16} style={{ color: 'var(--color-accent)' }} />
                                      Facturas Emitidas a: <span style={{ color: 'var(--color-accent)' }}>{cliGroup.nombre} ({cliGroup.identificacionFiscal})</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      Total facturas: <strong>{cliGroup.totalFacturas}</strong> | Total facturado: <strong>{formatCurrency(cliGroup.totalMonto)}</strong>
                                    </span>
                                  </div>

                                  <table style={{ width: '100%', fontSize: '0.825rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.4rem 0.5rem' }}>Folio</th>
                                        <th style={{ padding: '0.4rem 0.5rem' }}>Fecha Emisión</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Condición</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Piezas</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Subtotal</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>IVA (16%)</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Saldo Pendiente</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>Total Factura</th>
                                        <th style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cliGroup.facturas.map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                          <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent)' }}>
                                            {inv.numeroFactura}
                                          </td>
                                          <td style={{ padding: '0.5rem' }}>{formatDateTime(inv.fecha)}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>{inv.tipoPago.toUpperCase()}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600 }}>{inv.totalPiezas}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(inv.subtotal)}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(inv.impuestos)}</td>
                                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600, color: inv.saldoPendiente > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
                                            {formatCurrency(inv.saldoPendiente)}
                                          </td>
                                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>
                                            {formatCurrency(inv.total)}
                                          </td>
                                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                            <Badge variant={inv.estado === 'pagada' ? 'success' : 'info'}>
                                              {inv.estado.toUpperCase()}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                {clientSalesList.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: 'var(--bg-subtle)', fontWeight: 800, borderTop: '2px solid var(--border-default)' }}>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>
                        TOTALES:
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        {clientSalesList.reduce((sum, c) => sum + c.totalFacturas, 0)} facturas
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        {clientSalesList.reduce((sum, c) => sum + c.totalPiezas, 0)} pzas
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--color-warning-text)' }}>
                        {formatCurrency(clientSalesList.reduce((sum, c) => sum + c.totalSaldo, 0))}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                        {formatCurrency(clientSalesList.reduce((sum, c) => sum + c.totalMonto, 0))}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        100.0%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Report 4: Cost Comparison with Available Stock and Real Inventory Valuation */}
      {activeReport === 'costs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Real Inventory Balance KPI Cards */}
          <div className="grid-4">
            <div className="stat-card">
              <div className="stat-header">
                <span>Stock Físico Disponible</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                  <Boxes size={18} />
                </div>
              </div>
              <div className="stat-value">{totalStockUnits} pzas</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>{products.length} productos en catálogo</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Valuación Directa (Compra)</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="stat-value">{formatCurrency(totalValuationCompra)}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>Costo base de adquisición</span>
              </div>
            </div>

            <div className="stat-card" style={{ borderColor: 'var(--color-accent)', boxShadow: '0 4px 12px var(--color-accent-glow)' }}>
              <div className="stat-header">
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Valuación Real (Balance)</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{formatCurrency(totalValuationReal)}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Stock × Costo Real Total</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Absorción en Inventario</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-warning-text)' }}>
                +{formatCurrency(totalValuationReal - totalValuationCompra)}
              </div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>Gastos operativos absorbidos</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Matriz de Costo Directo vs Costo Real Absorbido & Valuación de Stock</h2>
                <p className="card-subtitle">
                  Regla Activa: <strong>{prorrateo.criterio === 'costo_material' ? `Distribución proporcional por Material Directo (+${prorrateo.tasaAbsorcionPorcentaje}% sobre costo de compra)` : prorrateo.criterio === 'valor_venta' ? `Distribución por Precio de Venta (+${prorrateo.tasaAbsorcionPorcentaje}% sobre PVP)` : `División lineal (${formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)}/unidad)`}</strong>
                </p>
              </div>
              <ExcelExportButton filename={`Comparativa_Costos_Valuacion_${selectedMonth}`} />
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Precio Venta</th>
                    <th style={{ textAlign: 'right' }}>1. Costo Compra</th>
                    <th style={{ textAlign: 'center' }}>% Absorción</th>
                    <th style={{ textAlign: 'right' }}>2. Gasto Absorbido</th>
                    <th style={{ textAlign: 'right', fontWeight: 800 }}>3. Costo Real</th>
                    <th style={{ textAlign: 'center' }}>Margen Real %</th>
                    <th style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>Vol. Stock Disponible</th>
                    <th style={{ textAlign: 'right', backgroundColor: 'var(--bg-subtle)', fontWeight: 800 }}>Inventario Valuado a Costo Real</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const costs = getProductRealCost(p.id, selectedMonth);
                    const realMargin = p.precioVenta > 0 ? (((p.precioVenta - costs.costoReal) / p.precioVenta) * 100).toFixed(1) : 0;
                    const stockValuationReal = p.stockActual * costs.costoReal;

                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.codigo}</td>
                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(p.precioVenta)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(costs.costoCompra)}</td>
                        <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {costs.criterio === 'costo_material' ? `+${costs.tasaAbsorcionPorcentaje}%` : costs.criterio === 'valor_venta' ? `+${costs.tasaAbsorcionPorcentaje}% PVP` : 'Fijo'}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>+{formatCurrency(costs.costoOperativoProrrateado)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-accent)' }}>{formatCurrency(costs.costoReal)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${Number(realMargin) >= 30 ? 'badge-success' : Number(realMargin) > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {realMargin}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)', fontWeight: 700 }}>
                          <span style={{ color: p.stockActual <= p.stockMinimo ? 'var(--color-danger)' : 'inherit' }}>
                            {p.stockActual} {p.unidadMedida || 'pzas'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', backgroundColor: 'var(--bg-subtle)', fontWeight: 800, color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                          {formatCurrency(stockValuationReal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)' }}>
                    <td colSpan={8} style={{ padding: '0.85rem 1rem', fontWeight: 800, textAlign: 'right' }}>
                      TOTAL VALUACIÓN DE INVENTARIO REAL EN BALANCE:
                    </td>
                    <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: 800 }}>
                      {totalStockUnits} pzas
                    </td>
                    <td style={{ padding: '0.85rem', textAlign: 'right', fontWeight: 900, color: 'var(--color-accent)', fontSize: '1.05rem' }}>
                      {formatCurrency(totalValuationReal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 5: SKU-Level Profitability Analysis (Análisis de Rentabilidad por SKU) */}
      {activeReport === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Profitability KPI Summary Cards */}
          <div className="grid-4">
            <div className="stat-card">
              <div className="stat-header">
                <span>Unidades Vendidas</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                  <Package size={18} />
                </div>
              </div>
              <div className="stat-value">{profitabilitySummary.totalVendidas} pzas</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>{profitabilitySummary.countItems} SKUs en filtro ({monthInvoices.length} facturas)</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Ingreso Total Facturado</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="stat-value">{formatCurrency(profitabilitySummary.totalIngreso)}</div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>Ventas netas devengadas</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span>Costo Total Venta Absorbido</span>
                <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-warning-text)' }}>
                {formatCurrency(profitabilitySummary.totalCostoVenta)}
              </div>
              <div className="stat-footer">
                <span style={{ color: 'var(--text-muted)' }}>Compra directa + Absorción real</span>
              </div>
            </div>

            <div
              className="stat-card"
              style={{
                borderColor: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                boxShadow: profitabilitySummary.totalMargenMonto >= 0 ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 4px 12px rgba(239, 68, 68, 0.12)'
              }}
            >
              <div className="stat-header">
                <span style={{ color: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontWeight: 700 }}>
                  Margen Final Neto Real
                </span>
                <div
                  className="stat-icon"
                  style={{
                    backgroundColor: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                    color: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                  }}
                >
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                {formatCurrency(profitabilitySummary.totalMargenMonto)}
              </div>
              <div className="stat-footer">
                <span style={{ fontWeight: 700, color: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                  Margen Global: {profitabilitySummary.totalMargenPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="card-title">Resumen de Análisis de Rentabilidad Detallado por SKU</h2>
                <p className="card-subtitle">
                  Desglose financiero por producto y variante: Costo compra, absorción de gasto operativo, depreciación, ingreso total y margen final neto.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <ExcelExportButton
                  data={sortedSkuProfitability}
                  columns={profitabilityExcelColumns}
                  filename={`Analisis_Rentabilidad_SKU_${selectedMonth}`}
                  title="Exportar análisis de rentabilidad a Excel"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="search-input" style={{ flex: '1 1 240px', minWidth: '220px' }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar por SKU, producto o categoría..."
                  value={profitabilitySearch}
                  onChange={(e) => setProfitabilitySearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '160px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  value={profitabilityCategoryFilter}
                  onChange={(e) => setProfitabilityCategoryFilter(e.target.value)}
                >
                  <option value="all">Todas las Categorías</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={profitabilityOnlySales}
                  onChange={(e) => setProfitabilityOnlySales(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                <span>Solo productos con ventas en {selectedMonth}</span>
              </label>
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table" id="tabla-analisis-rentabilidad">
                <thead>
                  <tr>
                    <SortableTh
                      sortKey="sku"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={false}
                    >
                      SKU / Código
                    </SortableTh>
                    <SortableTh
                      sortKey="nombreCompleto"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={false}
                    >
                      Producto / Variante
                    </SortableTh>
                    <SortableTh
                      sortKey="cantidadVendida"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="center"
                    >
                      Cant. Vendida
                    </SortableTh>
                    <SortableTh
                      sortKey="costoCompra"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Costo Compra
                    </SortableTh>
                    <SortableTh
                      sortKey="gastoOperativo"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Gasto Operativo
                    </SortableTh>
                    <SortableTh
                      sortKey="gastoDepreciacion"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Gasto Deprec.
                    </SortableTh>
                    <SortableTh
                      sortKey="gastoTotal"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Gasto Total (Costo Real)
                    </SortableTh>
                    <SortableTh
                      sortKey="precioVenta"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Precio Venta
                    </SortableTh>
                    <SortableTh
                      sortKey="costoTotalVenta"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Costo Total Venta
                    </SortableTh>
                    <SortableTh
                      sortKey="ingresoTotal"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Ingreso Total
                    </SortableTh>
                    <SortableTh
                      sortKey="margenMonto"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="right"
                    >
                      Margen Final ($)
                    </SortableTh>
                    <SortableTh
                      sortKey="margenPorcentaje"
                      currentSortKey={profSortKey}
                      currentSortDirection={profSortDirection}
                      onSort={requestProfSort}
                      isNumeric={true}
                      align="center"
                    >
                      Margen Final (%)
                    </SortableTh>
                  </tr>
                </thead>
                <tbody>
                  {sortedSkuProfitability.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No se encontraron productos o variantes con los filtros seleccionados para este periodo.
                      </td>
                    </tr>
                  ) : (
                    sortedSkuProfitability.map(item => {
                      const hasSales = item.cantidadVendida > 0;
                      const isPositive = item.margenMonto >= 0;

                      return (
                        <tr key={item.id} style={{ opacity: hasSales ? 1 : 0.82 }}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>
                            {item.sku}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.productoNombre}</div>
                            {item.detalleVariante ? (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 500 }}>
                                {item.detalleVariante}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {item.categoriaNombre}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant={hasSales ? 'accent' : 'neutral'}>
                              {item.cantidadVendida} {item.cantidadVendida === 1 ? 'pza' : 'pzas'}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                            {formatCurrency(item.costoCompra)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>
                            +{formatCurrency(item.gastoOperativo)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>
                            +{formatCurrency(item.gastoDepreciacion)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)' }}>
                            {formatCurrency(item.gastoTotal)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(item.precioVenta)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: hasSales ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                            {formatCurrency(item.costoTotalVenta)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {formatCurrency(item.ingresoTotal)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: isPositive ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontSize: '0.95rem' }}>
                            {isPositive ? `+${formatCurrency(item.margenMonto)}` : formatCurrency(item.margenMonto)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Badge variant={item.margenPorcentaje >= 30 ? 'success' : item.margenPorcentaje > 0 ? 'warning' : 'danger'}>
                              {item.margenPorcentaje > 0 ? `+${item.margenPorcentaje}%` : `${item.margenPorcentaje}%`}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {sortedSkuProfitability.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        TOTALES FILTRADOS ({profitabilitySummary.countItems} SKUs):
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', fontSize: '0.95rem' }}>
                        {profitabilitySummary.totalVendidas} pzas
                      </td>
                      <td colSpan={5} style={{ padding: '0.85rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        -
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: 'var(--color-warning-text)', fontSize: '0.95rem' }}>
                        {formatCurrency(profitabilitySummary.totalCostoVenta)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: 'var(--color-accent)', fontSize: '1rem' }}>
                        {formatCurrency(profitabilitySummary.totalIngreso)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', color: profitabilitySummary.totalMargenMonto >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', fontSize: '1.05rem' }}>
                        {profitabilitySummary.totalMargenMonto >= 0 ? `+${formatCurrency(profitabilitySummary.totalMargenMonto)}` : formatCurrency(profitabilitySummary.totalMargenMonto)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        <Badge variant={Number(profitabilitySummary.totalMargenPct) >= 0 ? 'success' : 'danger'}>
                          {profitabilitySummary.totalMargenPct}%
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
