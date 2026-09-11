import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import type { ExpenseType, OperatingExpense, CostAnalysisStage } from '../types/erp';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getMonthKey,
  getTodayLocalDateString,
  buildLocalDateISO,
  parseDateSafe,
  calculateWeightedAverageCost
} from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';
import {
  Calculator,
  Plus,
  Trash2,
  PieChart,
  HardDrive,
  TrendingDown,
  Layers,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Activity
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { useTableSort } from '../hooks/useTableSort';

import { PeriodSelector } from '../components/common/PeriodSelector';

interface AccountingPageProps {
  initialTab?: 'prorrateo' | 'expenses' | 'assets' | 'cost_analysis';
}

export const AccountingPage: React.FC<AccountingPageProps> = ({ initialTab }) => {
  const {
    settings,
    expenses,
    fixedAssets,
    products,
    categories,
    inventoryMovements,
    addExpense,
    deleteExpense,
    addFixedAsset,
    getProrrateoMensual,
    getProductRealCost
  } = useERP();

  const { t } = useTranslation();

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [activeTab, setActiveTab] = useState<'prorrateo' | 'expenses' | 'assets' | 'cost_analysis'>(initialTab || 'prorrateo');
  const [costAnalysisProductId, setCostAnalysisProductId] = useState<string>('');

  const isPastMonth = selectedMonth < getMonthKey();

  const availableMonths = React.useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.periodoMes) set.add(e.periodoMes);
      if (e.fecha) set.add(e.fecha.slice(0, 7));
    });
    inventoryMovements.forEach(m => {
      if (m.fecha) set.add(m.fecha.slice(0, 7));
    });
    return Array.from(set).filter(Boolean);
  }, [expenses, inventoryMovements]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Default product for cost analysis
  React.useEffect(() => {
    if (products.length > 0 && (!costAnalysisProductId || !products.some(p => p.id === costAnalysisProductId))) {
      setCostAnalysisProductId(products[0].id);
    }
  }, [products, costAnalysisProductId]);
  
  // Prorrateo is strictly informative using the company default established in settings:
  const activeCriterio = settings.criterioProrrateoDefecto || 'costo_material';
  const [isProrrateoExpanded, setIsProrrateoExpanded] = useState(false);

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expFecha, setExpFecha] = useState(getTodayLocalDateString());
  const [expTipo, setExpTipo] = useState<ExpenseType>('fijo');
  const [expCategoria, setExpCategoria] = useState('Renta & Local');
  const [expMonto, setExpMonto] = useState<number | ''>('');
  const [expDesc, setExpDesc] = useState('');
  const [expReferenciaFactura, setExpReferenciaFactura] = useState('');

  // Expense Cancellation / Reversal Warning Modal State
  const [expenseToCancel, setExpenseToCancel] = useState<OperatingExpense | null>(null);

  // New Asset Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [astNombre, setAstNombre] = useState('');
  const [astCategoria, setAstCategoria] = useState('Equipo de Cómputo');
  const [astFecha, setAstFecha] = useState(getTodayLocalDateString());
  const [astValor, setAstValor] = useState<number | ''>('');
  const [astVidaMeses, setAstVidaMeses] = useState<number | ''>(36);
  const [astNotas, setAstNotas] = useState('');

  // Monthly Prorrateo Calculation with company criterion
  const prorrateo = getProrrateoMensual(selectedMonth, activeCriterio);

  // Handlers
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expMonto || Number(expMonto) <= 0 || !expDesc.trim()) return;

    const expenseDate = buildLocalDateISO(expFecha);

    addExpense({
      fecha: expenseDate,
      periodoMes: expFecha.slice(0, 7),
      tipo: expTipo,
      categoria: expCategoria,
      monto: Number(expMonto),
      descripcion: expDesc.trim(),
      referenciaFactura: expReferenciaFactura.trim() || undefined
    });

    setIsExpenseModalOpen(false);
    setExpMonto('');
    setExpDesc('');
    setExpReferenciaFactura('');
  };

  const handleConfirmCancelExpense = () => {
    if (expenseToCancel) {
      deleteExpense(expenseToCancel.id);
      setExpenseToCancel(null);
    }
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!astNombre.trim() || !astValor || Number(astValor) <= 0 || !astVidaMeses || Number(astVidaMeses) <= 0) return;

    addFixedAsset({
      nombre: astNombre.trim(),
      categoriaActivo: astCategoria,
      fechaAdquisicion: astFecha,
      valorAdquisicion: Number(astValor),
      vidaUtilMeses: Number(astVidaMeses),
      metodoDepreciacion: 'lineal',
      notas: astNotas.trim()
    });

    setIsAssetModalOpen(false);
    setAstNombre('');
    setAstValor('');
    setAstVidaMeses(36);
    setAstNotas('');
  };

  // Filtered queries
  const filteredExpenses = expenses.filter(e => e.periodoMes === selectedMonth);

  const {
    sortedItems: sortedExpenses,
    sortKey: expSortKey,
    sortDirection: expSortDirection,
    requestSort: requestExpSort
  } = useTableSort(filteredExpenses, {
    defaultKey: 'fecha',
    defaultDirection: 'desc',
    defaultIsNumeric: true,
  });

  const {
    sortedItems: sortedFixedAssets,
    sortKey: assetSortKey,
    sortDirection: assetSortDirection,
    requestSort: requestAssetSort
  } = useTableSort(fixedAssets, {
    defaultKey: 'fechaAdquisicion',
    defaultDirection: 'desc',
    defaultIsNumeric: true,
    customGetters: {
      valorEnLibros: (a) => a.valorAdquisicion - a.depreciacionAcumulada,
      avancePercent: (a) => a.valorAdquisicion > 0 ? (a.depreciacionAcumulada / a.valorAdquisicion) * 100 : 0
    }
  });

  const {
    sortedItems: sortedProrrateoProducts,
    sortKey: proSortKey,
    sortDirection: proSortDirection,
    requestSort: requestProSort
  } = useTableSort(products, {
    defaultKey: 'nombre',
    defaultDirection: 'asc',
    defaultIsNumeric: false,
    customGetters: {
      costoCompra: (p) => getProductRealCost(p.id, selectedMonth).costoCompra,
      tasaAbsorcion: (p) => getProductRealCost(p.id, selectedMonth).tasaAbsorcionPorcentaje,
      gastoOperativo: (p) => getProductRealCost(p.id, selectedMonth).costoOperativoProrrateado,
      costoReal: (p) => getProductRealCost(p.id, selectedMonth).costoReal,
      margenBruto: (p) => {
        const costs = getProductRealCost(p.id, selectedMonth);
        return p.precioVenta > 0 ? ((p.precioVenta - costs.costoCompra) / p.precioVenta) * 100 : 0;
      },
      margenReal: (p) => {
        const costs = getProductRealCost(p.id, selectedMonth);
        return p.precioVenta > 0 ? ((p.precioVenta - costs.costoReal) / p.precioVenta) * 100 : 0;
      }
    }
  });

  // Material Cost Analysis per Product
  const selectedCostProduct = useMemo(() => {
    return products.find(p => p.id === costAnalysisProductId) || products[0] || null;
  }, [products, costAnalysisProductId]);

  const costAnalysisResult = useMemo(() => {
    if (!selectedCostProduct) return null;
    const prodId = selectedCostProduct.id;
    const prodMovements = inventoryMovements
      .filter(m => m.productoId === prodId)
      .sort((a, b) => {
        const tA = parseDateSafe(a.fecha)?.getTime() || 0;
        const tB = parseDateSafe(b.fecha)?.getTime() || 0;
        if (tA !== tB) return tA - tB;
        return inventoryMovements.indexOf(a) - inventoryMovements.indexOf(b);
      });

    // 1. Reconstrucción de stock y costo inicial previo al mes seleccionado
    const pastMoves = prodMovements.filter(m => m.fecha.slice(0, 7) < selectedMonth);
    let initStock = 0;
    let initCost = 0;
    for (const m of pastMoves) {
      const qty = Number(m.cantidad) || 0;
      const cost = Number(m.costoUnitario) || 0;
      if (m.tipo === 'ENTRADA_COMPRA' || m.tipo === 'INVENTARIO_INICIAL') {
        const posQty = Math.abs(qty);
        if (initStock === 0 && cost > 0) {
          initCost = cost;
        } else {
          initCost = calculateWeightedAverageCost(initStock, initCost, posQty, cost);
        }
        initStock += posQty;
      } else if (m.tipo === 'SALIDA_VENTA') {
        initStock = Math.max(0, initStock - Math.abs(qty));
      } else if (m.tipo === 'AJUSTE_MANUAL') {
        initStock = Math.max(0, initStock + qty);
      } else if (m.tipo === 'ANULACION_COMPRA') {
        initStock = Math.max(0, initStock - Math.abs(qty));
      } else if (m.tipo === 'ANULACION_VENTA') {
        initStock += Math.abs(qty);
      }
    }

    // 2. Movimientos del mes seleccionado
    const monthMoves = prodMovements.filter(m => m.fecha.slice(0, 7) === selectedMonth);
    const comprasMoves = monthMoves.filter(m => m.tipo === 'ENTRADA_COMPRA' || m.tipo === 'INVENTARIO_INICIAL');
    const ajustesMoves = monthMoves.filter(m => m.tipo === 'AJUSTE_MANUAL');
    const ventasMoves = monthMoves.filter(m => m.tipo === 'SALIDA_VENTA');

    const comprasQty = comprasMoves.reduce((sum, m) => sum + Math.abs(Number(m.cantidad) || 0), 0);
    const comprasTotalCost = comprasMoves.reduce((sum, m) => sum + (Math.abs(Number(m.cantidad) || 0) * (Number(m.costoUnitario) || 0)), 0);
    const comprasUnitCost = comprasQty > 0 ? Number((comprasTotalCost / comprasQty).toFixed(2)) : 0;

    const ajustesQty = ajustesMoves.reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0);

    const ventasQty = ventasMoves.reduce((sum, m) => sum + Math.abs(Number(m.cantidad) || 0), 0);
    const ventasTotalCost = ventasMoves.reduce((sum, m) => sum + (Math.abs(Number(m.cantidad) || 0) * (Number(m.costoUnitario) || 0)), 0);
    const ventasUnitCost = ventasQty > 0 ? Number((ventasTotalCost / ventasQty).toFixed(2)) : (initCost || selectedCostProduct.costoPromedio);

    // 3. Stock e inventario final
    const finalStock = Math.max(0, initStock + comprasQty + ajustesQty - ventasQty);
    const costs = getProductRealCost(prodId, selectedMonth);
    const finalCost = costs.costoCompra;

    // Prorrateo del mes
    const opUnit = costs.gastoOperativoUnitario;
    const depUnit = costs.gastoDepreciacionUnitario;
    const opexPlusDep = Number((opUnit + depUnit).toFixed(2));

    const stages: CostAnalysisStage[] = [
      {
        etapaId: 'inicial',
        concepto: '1. Inventario Inicial (al 1° del mes)',
        cantidad: initStock,
        costoCompraUnitario: initCost,
        costoCompraTotal: Number((initStock * initCost).toFixed(2)),
        gastoOperativoUnitario: initStock > 0 ? opUnit : 0,
        gastoDepreciacionUnitario: initStock > 0 ? depUnit : 0,
        costoRealUnitario: initStock > 0 ? Number((initCost + opexPlusDep).toFixed(2)) : 0,
        valuacionTotalReal: initStock > 0 ? Number((initStock * (initCost + opexPlusDep)).toFixed(2)) : 0
      },
      {
        etapaId: 'compras',
        concepto: '2. Entradas / Compras del Mes',
        cantidad: comprasQty,
        costoCompraUnitario: comprasUnitCost,
        costoCompraTotal: comprasTotalCost,
        gastoOperativoUnitario: comprasQty > 0 ? opUnit : 0,
        gastoDepreciacionUnitario: comprasQty > 0 ? depUnit : 0,
        costoRealUnitario: comprasQty > 0 ? Number((comprasUnitCost + opexPlusDep).toFixed(2)) : 0,
        valuacionTotalReal: comprasQty > 0 ? Number((comprasQty * (comprasUnitCost + opexPlusDep)).toFixed(2)) : 0
      },
      {
        etapaId: 'ajustes',
        concepto: '3. Ajustes de Inventario del Mes',
        cantidad: ajustesQty,
        costoCompraUnitario: finalCost,
        costoCompraTotal: Number((ajustesQty * finalCost).toFixed(2)),
        gastoOperativoUnitario: ajustesQty !== 0 ? opUnit : 0,
        gastoDepreciacionUnitario: ajustesQty !== 0 ? depUnit : 0,
        costoRealUnitario: ajustesQty !== 0 ? costs.costoReal : 0,
        valuacionTotalReal: Number((ajustesQty * costs.costoReal).toFixed(2))
      },
      {
        etapaId: 'ventas',
        concepto: '4. Salidas / Ventas del Mes',
        cantidad: -ventasQty,
        costoCompraUnitario: ventasUnitCost,
        costoCompraTotal: -Number((ventasQty * ventasUnitCost).toFixed(2)),
        gastoOperativoUnitario: ventasQty > 0 ? -opUnit : 0,
        gastoDepreciacionUnitario: ventasQty > 0 ? -depUnit : 0,
        costoRealUnitario: ventasQty > 0 ? Number((ventasUnitCost + opexPlusDep).toFixed(2)) : 0,
        valuacionTotalReal: -Number((ventasQty * (ventasUnitCost + opexPlusDep)).toFixed(2))
      },
      {
        etapaId: 'final',
        concepto: '5. Inventario Final (al cierre / en balance)',
        cantidad: finalStock,
        costoCompraUnitario: finalCost,
        costoCompraTotal: Number((finalStock * finalCost).toFixed(2)),
        gastoOperativoUnitario: finalStock > 0 ? opUnit : 0,
        gastoDepreciacionUnitario: finalStock > 0 ? depUnit : 0,
        costoRealUnitario: finalStock > 0 ? costs.costoReal : 0,
        valuacionTotalReal: Number((finalStock * costs.costoReal).toFixed(2))
      }
    ];

    return {
      product: selectedCostProduct,
      initStock,
      initCost,
      comprasQty,
      comprasTotalCost,
      ajustesQty,
      ventasQty,
      ventasTotalCost,
      finalStock,
      finalCost,
      costs,
      stages
    };
  }, [selectedCostProduct, inventoryMovements, selectedMonth, getProductRealCost]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.accounting.title}</h1>
          <p className="page-description">
            {t.accounting.subtitle}
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <PeriodSelector
            value={selectedMonth}
            onChange={setSelectedMonth}
            availableMonths={availableMonths}
          />

          {activeTab === 'expenses' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus size={16} />
              {t.accounting.addExpense}
            </button>
          )}

          {activeTab === 'assets' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsAssetModalOpen(true)}>
              <Plus size={16} />
              {t.accounting.addAsset}
            </button>
          )}
        </div>
      </div>

      {/* 1. Monthly Summary Cards Banner (Matching Inventory Order: Header -> Stat Cards -> Tabs -> Content) */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>{t.accounting.fixedExpensesMonth}</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <Calculator size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(prorrateo.gastosFijos)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Renta, servicios, nóminas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>{t.accounting.variableExpensesMonth}</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <PieChart size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(prorrateo.gastosVariables)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Publicidad, empaques, varios</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>{t.accounting.depreciationMonth}</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(prorrateo.depreciacionActivos)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Método lineal ({fixedAssets.length} activos)</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--color-accent)', boxShadow: '0 4px 12px var(--color-accent-glow)' }}>
          <div className="stat-header">
            <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{t.accounting.totalOperatingExpense}</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{formatCurrency(prorrateo.gastoOperativoTotal)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {activeCriterio === 'costo_material' && (
                <>{t.accounting.absorptionRate}: <strong>+{prorrateo.tasaAbsorcionPorcentaje}% s/ costo</strong></>
              )}
              {activeCriterio === 'valor_venta' && (
                <>{t.accounting.absorptionRate}: <strong>+{prorrateo.tasaAbsorcionPorcentaje}% s/ venta</strong></>
              )}
              {activeCriterio === 'unidades_iguales' && (
                <>Carga fija: <strong>{formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)} / pza</strong></>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tabs Navigation */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'prorrateo' ? 'active' : ''}`}
          onClick={() => setActiveTab('prorrateo')}
        >
          <Layers size={16} />
          <span>{t.accounting.tabProrrateo}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <DollarSign size={16} />
          <span>{t.accounting.tabExpenses}</span>
          <span className="tab-badge">{filteredExpenses.length}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <HardDrive size={16} />
          <span>{t.accounting.tabAssets}</span>
          <span className="tab-badge">{fixedAssets.length}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'cost_analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('cost_analysis')}
        >
          <Boxes size={16} />
          <span>Análisis de Costo</span>
        </button>
      </div>

      {/* 3. Tab 1: Prorrateo & Real Cost Comparison Table */}
      {activeTab === 'prorrateo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Rule Information Banner (Collapsible / Acordeón) */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => setIsProrrateoExpanded(!isProrrateoExpanded)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SlidersHorizontal size={17} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '0.925rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {t.accounting.activeRuleTitle}
                    </h3>
                    <span className="badge badge-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.775rem' }}>
                      <ShieldCheck size={13} style={{ marginRight: '3px' }} />
                      {activeCriterio === 'costo_material' && t.accounting.ruleMaterialName}
                      {activeCriterio === 'valor_venta' && t.accounting.rulePriceName}
                      {activeCriterio === 'unidades_iguales' && t.accounting.ruleUnitsName}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                    {activeCriterio === 'costo_material' && `Distribución proporcional por Material Directo (+${prorrateo.tasaAbsorcionPorcentaje}% sobre costo compra)`}
                    {activeCriterio === 'valor_venta' && `Distribución por Precio de Venta (+${prorrateo.tasaAbsorcionPorcentaje}% sobre PVP)`}
                    {activeCriterio === 'unidades_iguales' && `División lineal (${formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)}/unidad)`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.775rem',
                    padding: '0.3rem 0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProrrateoExpanded(!isProrrateoExpanded);
                  }}
                >
                  <span>{isProrrateoExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}</span>
                  {isProrrateoExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>
            </div>

            {isProrrateoExpanded && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-default)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--bg-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>Base Contable del Mes</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {formatCurrency(prorrateo.baseTotalProrrateo)}
                  </span>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {activeCriterio === 'costo_material' ? 'Valoración de inventario a costo de compra' : activeCriterio === 'valor_venta' ? 'Valoración total a precio venta' : 'Unidades en inventario'}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>{t.accounting.absorptionRate}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                    {activeCriterio === 'unidades_iguales'
                      ? `${formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)} / unidad`
                      : `+${prorrateo.tasaAbsorcionPorcentaje}%`}
                  </span>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Carga distribuida sobre cada unidad o valor monetario
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>Ajuste de Criterio</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Configuración Institucional
                  </span>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Puedes cambiar la regla contable en <strong style={{ color: 'var(--color-accent)' }}>Configuración &gt; Datos de la Empresa</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Matrix Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Matriz de Costeo Total Absorbido por Producto</h2>
                <p className="card-subtitle">
                  Comparativa de Costo de Compra Directo vs. Costo Real Final (absorbiendo {formatCurrency(prorrateo.gastoOperativoTotal)} de gastos)
                </p>
              </div>
              <ExcelExportButton filename={`Matriz_Costeo_Prorrateo_${selectedMonth}`} />
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <SortableTh
                      sortKey="codigo"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={false}
                    >
                      Código
                    </SortableTh>
                    <SortableTh
                      sortKey="nombre"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={false}
                    >
                      Producto
                    </SortableTh>
                    <SortableTh
                      sortKey="precioVenta"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="right"
                    >
                      Precio Venta
                    </SortableTh>
                    <SortableTh
                      sortKey="costoCompra"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="right"
                    >
                      1. Costo Compra (Directo)
                    </SortableTh>
                    <SortableTh
                      sortKey="tasaAbsorcion"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="center"
                    >
                      % Absorción
                    </SortableTh>
                    <SortableTh
                      sortKey="gastoOperativo"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="right"
                    >
                      2. Gasto Operativo Absorbido
                    </SortableTh>
                    <SortableTh
                      sortKey="costoReal"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="right"
                      style={{ fontWeight: 800 }}
                    >
                      3. Costo Real Total
                    </SortableTh>
                    <SortableTh
                      sortKey="margenBruto"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="center"
                    >
                      Margen Bruto %
                    </SortableTh>
                    <SortableTh
                      sortKey="margenReal"
                      currentSortKey={proSortKey}
                      currentSortDirection={proSortDirection}
                      onSort={requestProSort}
                      isNumeric={true}
                      align="center"
                    >
                      Margen Real %
                    </SortableTh>
                  </tr>
                </thead>
                <tbody>
                  {sortedProrrateoProducts.map(p => {
                    const costs = getProductRealCost(p.id, selectedMonth);
                    const grossMarginPercent = p.precioVenta > 0 ? (((p.precioVenta - costs.costoCompra) / p.precioVenta) * 100).toFixed(1) : 0;
                    const realMarginPercent = p.precioVenta > 0 ? (((p.precioVenta - costs.costoReal) / p.precioVenta) * 100).toFixed(1) : 0;

                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.codigo}</td>
                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(p.precioVenta)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {formatCurrency(costs.costoCompra)}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {activeCriterio === 'costo_material' ? `+${costs.tasaAbsorcionPorcentaje}%` : activeCriterio === 'valor_venta' ? `+${costs.tasaAbsorcionPorcentaje}% PVP` : 'Fijo'}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-warning-text)', fontWeight: 600 }}>
                          +{formatCurrency(costs.costoOperativoProrrateado)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, backgroundColor: 'var(--bg-subtle)', color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                          {formatCurrency(costs.costoReal)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-success">{grossMarginPercent}%</span>
                        </td>
                        <td style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                          <span className={`badge ${Number(realMarginPercent) >= 30 ? 'badge-success' : Number(realMarginPercent) > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {realMarginPercent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Expenses List Table */}
      {activeTab === 'expenses' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Registro de Gastos del Periodo ({selectedMonth})</h2>
              <p className="card-subtitle">Gastos operativos fijos y variables devengados</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExcelExportButton filename={`Gastos_Operativos_${selectedMonth}`} />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsExpenseModalOpen(true)}>
                <Plus size={16} />
                + Nuevo Gasto
              </button>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <SortableTh
                    sortKey="fecha"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={true}
                  >
                    Fecha
                  </SortableTh>
                  <SortableTh
                    sortKey="codigoContable"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={false}
                  >
                    ID Contable
                  </SortableTh>
                  <SortableTh
                    sortKey="referenciaFactura"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={false}
                  >
                    Ref. Factura
                  </SortableTh>
                  <SortableTh
                    sortKey="categoria"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={false}
                  >
                    Categoría
                  </SortableTh>
                  <SortableTh
                    sortKey="tipo"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={false}
                    align="center"
                  >
                    Tipo
                  </SortableTh>
                  <SortableTh
                    sortKey="descripcion"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={false}
                  >
                    Descripción
                  </SortableTh>
                  <SortableTh
                    sortKey="monto"
                    currentSortKey={expSortKey}
                    currentSortDirection={expSortDirection}
                    onSort={requestExpSort}
                    isNumeric={true}
                    align="right"
                  >
                    Monto ({settings.monedaSimbolo || '$'})
                  </SortableTh>
                  <th style={{ textAlign: 'right' }}>Estado / Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay gastos registrados en el periodo {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  sortedExpenses.map(exp => {
                    const isReversal = !!exp.esAnulacionDe || exp.monto < 0;
                    const isCancelled = exp.anulado;
                    const isAutoDepreciation = !!exp.esDepreciacionDeActivoId || exp.codigoContable?.startsWith('DE');

                    return (
                      <tr key={exp.id} style={{ opacity: isCancelled && !isReversal ? 0.75 : 1 }}>
                        <td>{formatDateTime(exp.fecha)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: isReversal ? 'var(--color-danger)' : (isCancelled ? 'var(--text-muted)' : (isAutoDepreciation ? 'var(--color-accent)' : 'var(--color-accent)'))
                            }}>
                              {exp.codigoContable || exp.id}
                            </span>
                            {isAutoDepreciation && (
                              <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                AUTO
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {exp.referenciaFactura ? (
                            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                              {exp.referenciaFactura}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{exp.categoria}</td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={exp.tipo === 'fijo' ? 'accent' : 'warning'}>
                            {exp.tipo.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ color: isReversal ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                          {exp.descripcion}
                          {exp.esAnulacionDe && (
                            <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-danger)' }}>
                              (Contramovimiento de {exp.esAnulacionDe})
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span style={{
                            color: isReversal ? 'var(--color-danger)' : (isCancelled ? 'var(--text-muted)' : 'inherit'),
                            textDecoration: isCancelled && !isReversal ? 'line-through' : 'none'
                          }}>
                            {formatCurrency(exp.monto)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isCancelled || isReversal ? (
                            <Badge variant="danger">
                              {isReversal ? 'ANULACIÓN' : 'ANULADO'}
                            </Badge>
                          ) : isAutoDepreciation ? (
                            <Badge variant="neutral">
                              ACTIVO FIJO
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              className="btn-icon btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => setExpenseToCancel(exp)}
                              title="Anular gasto (Genera movimiento copia con signo contrario y sufijo A)"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {/* Tab 3: Fixed Assets & Depreciation with Progress Bar */}
      {activeTab === 'assets' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Inventario de Activos Fijos & Depreciación Lineal</h2>
              <p className="card-subtitle">Cálculo de alícuota mensual y barra de avance de depreciación acumulada</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ExcelExportButton filename="Activos_Fijos_Depreciacion" />
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsAssetModalOpen(true)}>
                <Plus size={16} />
                + Nuevo Activo Fijo
              </button>
            </div>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <SortableTh
                    sortKey="id"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={false}
                  >
                    ID Activo
                  </SortableTh>
                  <SortableTh
                    sortKey="nombre"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={false}
                  >
                    Activo / Nombre
                  </SortableTh>
                  <SortableTh
                    sortKey="categoriaActivo"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={false}
                  >
                    Categoría
                  </SortableTh>
                  <SortableTh
                    sortKey="fechaAdquisicion"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                  >
                    Adquisición
                  </SortableTh>
                  <SortableTh
                    sortKey="valorAdquisicion"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                    align="right"
                  >
                    Valor Adquisición
                  </SortableTh>
                  <SortableTh
                    sortKey="vidaUtilMeses"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                    align="center"
                  >
                    Vida Útil
                  </SortableTh>
                  <SortableTh
                    sortKey="avancePercent"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                    style={{ minWidth: '160px' }}
                  >
                    Avance Depreciado
                  </SortableTh>
                  <SortableTh
                    sortKey="depreciacionMensual"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                    align="right"
                  >
                    Depreciación Mensual
                  </SortableTh>
                  <SortableTh
                    sortKey="depreciacionAcumulada"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                    align="right"
                  >
                    Depr. Acumulada
                  </SortableTh>
                  <SortableTh
                    sortKey="valorEnLibros"
                    currentSortKey={assetSortKey}
                    currentSortDirection={assetSortDirection}
                    onSort={requestAssetSort}
                    isNumeric={true}
                    align="right"
                  >
                    Valor en Libros
                  </SortableTh>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sortedFixedAssets.map(ast => {
                  const elapsedMonths = Math.min(
                    ast.vidaUtilMeses,
                    ast.depreciacionMensual > 0
                      ? Math.round(ast.depreciacionAcumulada / ast.depreciacionMensual)
                      : 0
                  );
                  const percentDepreciated = Math.min(
                    100,
                    ast.valorAdquisicion > 0
                      ? Math.round((ast.depreciacionAcumulada / ast.valorAdquisicion) * 100)
                      : 0
                  );

                  return (
                    <tr key={ast.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {ast.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ast.nombre}</div>
                        {ast.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ast.notas}</div>}
                      </td>
                      <td>{ast.categoriaActivo}</td>
                      <td>{formatDate(ast.fechaAdquisicion)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(ast.valorAdquisicion)}</td>
                      <td style={{ textAlign: 'center' }}>{ast.vidaUtilMeses} meses</td>
                      <td style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: percentDepreciated >= 100 ? 'var(--color-success-text)' : 'var(--text-primary)' }}>
                            {percentDepreciated}%
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>
                            {elapsedMonths} de {ast.vidaUtilMeses} meses
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--border-default)'
                        }}>
                          <div style={{
                            width: `${percentDepreciated}%`,
                            height: '100%',
                            backgroundColor: percentDepreciated >= 100 ? 'var(--color-success)' : percentDepreciated >= 75 ? 'var(--color-warning)' : 'var(--color-accent)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {formatCurrency(ast.depreciacionMensual)}/mes
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(ast.depreciacionAcumulada)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-success-text)' }}>
                        {formatCurrency(ast.valorEnLibros)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={ast.activoEstado === 'activo' ? 'success' : 'neutral'}>
                          {ast.activoEstado.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Tab 4: Product Cost Analysis */}
      {activeTab === 'cost_analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls & Product Selector Header Card */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '1.25rem', flex: 1 }}>
                <div style={{ minWidth: '320px', maxWidth: '460px', flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '0.4rem', fontWeight: 700 }}>
                    Producto / Material a Analizar:
                  </label>
                  <ComboboxInline
                    options={products.map(p => ({
                      id: p.id,
                      label: `[${p.codigo}] ${p.nombre}`,
                      sublabel: `Stock: ${p.stockActual} ${p.unidadMedida || 'pzas'} - P.Venta: ${formatCurrency(p.precioVenta)}`
                    }))}
                    value={costAnalysisProductId}
                    onChange={(val) => setCostAnalysisProductId(val)}
                    placeholder="Buscar producto o material..."
                  />
                </div>

                {selectedCostProduct && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingBottom: '0.2rem' }}>
                    <span className="badge badge-neutral" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      SKU: <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedCostProduct.codigo}</strong>
                    </span>
                    <span className="badge badge-info" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      Unidad: {selectedCostProduct.unidadMedida || 'pzas'}
                    </span>
                    {categories.find(c => c.id === selectedCostProduct.categoriaId)?.nombre && (
                      <span className="badge badge-neutral" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {categories.find(c => c.id === selectedCostProduct.categoriaId)?.nombre}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isPastMonth ? (
                  <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.75rem', border: '1px solid var(--border-default)' }}>
                    <Lock size={13} /> Periodo Cerrado (Datos Históricos Fijos)
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    <Sparkles size={13} /> Mes en Curso (Datos Vivos)
                  </span>
                )}
                <ExcelExportButton filename={`Analisis_Costo_${selectedCostProduct?.codigo || 'Material'}_${selectedMonth}`} />
              </div>
            </div>
          </div>

          {costAnalysisResult && (
            <>
              {/* 5 KPI Cards for the Selected Product */}
              <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                {/* 1. Inventario Inicial */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span>1. Inv. Inicial (1° {selectedMonth.slice(-2)})</span>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                      <Package size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{costAnalysisResult.initStock} {costAnalysisResult.product.unidadMedida || 'pzas'}</div>
                  <div className="stat-footer">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Valuación: <strong>{formatCurrency(costAnalysisResult.stages[0].valuacionTotalReal)}</strong>
                    </span>
                  </div>
                </div>

                {/* 2. Compras */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span>2. Entradas / Compras</span>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                      <ArrowDownRight size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>
                    +{costAnalysisResult.comprasQty} {costAnalysisResult.product.unidadMedida || 'pzas'}
                  </div>
                  <div className="stat-footer">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Inversión: <strong>{formatCurrency(costAnalysisResult.comprasTotalCost)}</strong>
                    </span>
                  </div>
                </div>

                {/* 3. Ventas */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span>3. Salidas / Ventas</span>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                      <ArrowUpRight size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>
                    -{costAnalysisResult.ventasQty} {costAnalysisResult.product.unidadMedida || 'pzas'}
                  </div>
                  <div className="stat-footer">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Costo Ventas (COGS): <strong>{formatCurrency(costAnalysisResult.ventasTotalCost)}</strong>
                    </span>
                  </div>
                </div>

                {/* 4. Inventario Final */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span>4. Inv. Final ({selectedMonth})</span>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-accent)' }}>
                      <Boxes size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
                    {costAnalysisResult.finalStock} {costAnalysisResult.product.unidadMedida || 'pzas'}
                  </div>
                  <div className="stat-footer">
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Valuación: <strong>{formatCurrency(costAnalysisResult.stages[4].valuacionTotalReal)}</strong>
                    </span>
                  </div>
                </div>

                {/* 5. Costo Real Unitario */}
                <div className="stat-card" style={{ borderColor: 'var(--color-accent)', boxShadow: '0 4px 12px var(--color-accent-glow)' }}>
                  <div className="stat-header">
                    <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>5. Costo Real Total Unit.</span>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                      <Layers size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-accent)' }}>
                    {formatCurrency(costAnalysisResult.costs.costoReal)}
                  </div>
                  <div className="stat-footer">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Compra {formatCurrency(costAnalysisResult.finalCost)} + Absorb. {formatCurrency(costAnalysisResult.costs.costoOperativoProrrateado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matrix Table: Actual Costing Material Ledger */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 className="card-title">Libro Mayor de Materiales — Flujo & Determinación de Costo Real</h2>
                    <p className="card-subtitle">
                      Material: <strong>[{costAnalysisResult.product.codigo}] {costAnalysisResult.product.nombre}</strong> | Periodo: <strong>{selectedMonth}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                      Base Prorrateo: {activeCriterio === 'costo_material' ? 'Costo Material Directo' : activeCriterio === 'valor_venta' ? 'Precio de Venta' : 'Unidades Físicas'}
                    </span>
                  </div>
                </div>

                <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '280px' }}>Etapa / Categoría del Flujo</th>
                        <th style={{ textAlign: 'center' }}>Cantidad ({costAnalysisResult.product.unidadMedida || 'pzas'})</th>
                        <th style={{ textAlign: 'right' }}>1. Costo Compra Unit.</th>
                        <th style={{ textAlign: 'right' }}>Total Adquisición Directa</th>
                        <th style={{ textAlign: 'right' }}>2. Gasto Operativo Abs.</th>
                        <th style={{ textAlign: 'right' }}>3. Deprec. Absorbida</th>
                        <th style={{ textAlign: 'right', fontWeight: 800, backgroundColor: 'var(--bg-subtle)' }}>4. Costo Real Unit.</th>
                        <th style={{ textAlign: 'right', fontWeight: 900, backgroundColor: 'var(--bg-subtle)' }}>Valuación Total Real</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costAnalysisResult.stages.map(st => {
                        const isFinal = st.etapaId === 'final';
                        const isVenta = st.etapaId === 'ventas';
                        const isCompra = st.etapaId === 'compras';
                        const isAjuste = st.etapaId === 'ajustes';
                        const isInit = st.etapaId === 'inicial';

                        return (
                          <tr
                            key={st.etapaId}
                            style={{
                              backgroundColor: isFinal ? 'var(--bg-subtle)' : 'transparent',
                              borderBottom: isFinal ? '2px solid var(--border-default)' : '1px solid var(--border-subtle)',
                              fontWeight: isFinal ? 700 : 'normal'
                            }}
                          >
                            <td style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1rem' }}>
                              {isInit && <Package size={17} style={{ color: 'var(--color-info)' }} />}
                              {isCompra && <ArrowDownRight size={17} style={{ color: 'var(--color-success)' }} />}
                              {isAjuste && <Activity size={17} style={{ color: 'var(--color-warning)' }} />}
                              {isVenta && <ArrowUpRight size={17} style={{ color: 'var(--color-danger)' }} />}
                              {isFinal && <Boxes size={17} style={{ color: 'var(--color-accent)' }} />}
                              <span style={{ fontWeight: isFinal ? 800 : 600, color: isFinal ? 'var(--color-accent)' : 'inherit' }}>
                                {st.concepto}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              <span style={{
                                color: isVenta ? 'var(--color-danger-text)' : isCompra ? 'var(--color-success-text)' : isFinal ? 'var(--color-accent)' : 'inherit'
                              }}>
                                {st.cantidad > 0 && isCompra ? `+${st.cantidad}` : st.cantidad}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                              {formatCurrency(st.costoCompraUnitario)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: isVenta ? 'var(--color-danger-text)' : 'inherit' }}>
                              {formatCurrency(st.costoCompraTotal)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--color-warning-text)' }}>
                              {st.gastoOperativoUnitario !== 0 ? (st.gastoOperativoUnitario > 0 ? `+${formatCurrency(st.gastoOperativoUnitario)}` : formatCurrency(st.gastoOperativoUnitario)) : '—'}
                            </td>
                            <td style={{ textAlign: 'right', color: '#3b82f6' }}>
                              {st.gastoDepreciacionUnitario !== 0 ? (st.gastoDepreciacionUnitario > 0 ? `+${formatCurrency(st.gastoDepreciacionUnitario)}` : formatCurrency(st.gastoDepreciacionUnitario)) : '—'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, backgroundColor: 'var(--bg-subtle)', color: 'var(--color-accent)' }}>
                              {formatCurrency(st.costoRealUnitario)}
                            </td>
                            <td style={{
                              textAlign: 'right',
                              fontWeight: 900,
                              backgroundColor: 'var(--bg-subtle)',
                              fontSize: isFinal ? '1rem' : '0.925rem',
                              color: isFinal ? 'var(--color-accent)' : isVenta ? 'var(--color-danger-text)' : 'inherit'
                            }}>
                              {formatCurrency(st.valuacionTotalReal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Audit & Balance Equation Verification Card (Matching Prorrateo Format) */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  borderTop: '1px solid var(--border-default)'
                }}>
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          padding: '0.45rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <SlidersHorizontal size={17} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '0.925rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                              Conciliación Contable del Flujo de Material
                            </h3>
                            <span className="badge badge-success" style={{ padding: '0.2rem 0.6rem', fontSize: '0.775rem' }}>
                              <ShieldCheck size={13} style={{ marginRight: '3px' }} />
                              Balance 100% Cuadrado
                            </span>
                          </div>
                          <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                            Ecuación de balance físico: Inventario Inicial + Compras + Ajustes - Ventas = Inventario Final
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-default)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '1rem',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>Ecuación Contable del Flujo</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                          {costAnalysisResult.initStock} + {costAnalysisResult.comprasQty} {costAnalysisResult.ajustesQty >= 0 ? `+ ${costAnalysisResult.ajustesQty}` : `- ${Math.abs(costAnalysisResult.ajustesQty)}`} - {costAnalysisResult.ventasQty} = {costAnalysisResult.finalStock} {costAnalysisResult.product.unidadMedida || 'pzas'}
                        </span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                          Inicial + Compras + Ajustes - Ventas = Final
                        </span>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>Estado de Conciliación</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>
                          ✓ Cuadre Físico Exacto
                        </span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                          Unidades físicas reconciliadas con el Kardex cronológico
                        </span>
                      </div>

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.775rem' }}>Regla de Costeo y Absorción</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                          {activeCriterio === 'costo_material' ? `Material Directo (+${prorrateo.tasaAbsorcionPorcentaje}%)` : activeCriterio === 'valor_venta' ? `Precio de Venta (+${prorrateo.tasaAbsorcionPorcentaje}%)` : `Lineal (${formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)}/pza)`}
                        </span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                          Tasa de absorción contable institucional aplicada
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Expense Reversal Confirmation Modal */}
      <Modal
        isOpen={!!expenseToCancel}
        onClose={() => setExpenseToCancel(null)}
        title="Confirmar Anulación de Gasto Operativo"
        subtitle="Generación de partida contable compensatoria (contra-asiento)"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setExpenseToCancel(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmCancelExpense}
            >
              Confirmar Anulación
            </button>
          </>
        }
      >
        {expenseToCancel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-warning-text)'
            }}>
              <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  ¿Deseas aplicar la anulación automática de este gasto?
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Por normativa de auditoría y trazabilidad contable, este gasto no se eliminará físicamente. En su lugar, el sistema generará automáticamente un <strong>contra-movimiento con signo negativo</strong> para anular su impacto financiero en el periodo <strong>{expenseToCancel.periodoMes}</strong>.
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ID Contable Original</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                  {expenseToCancel.codigoContable || expenseToCancel.id}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ID Contramovimiento (Anulación)</span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-danger)' }}>
                  {expenseToCancel.codigoContable ? `${expenseToCancel.codigoContable}A` : `${expenseToCancel.id}-A`}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Monto a Compensar</span>
                <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                  -{formatCurrency(expenseToCancel.monto)}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Categoría / Tipo</span>
                <span style={{ fontWeight: 600 }}>
                  {expenseToCancel.categoria} ({expenseToCancel.tipo.toUpperCase()})
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Concepto</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {expenseToCancel.descripcion}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Registrar Gasto Operativo"
        subtitle="Registra gastos fijos mensuales o gastos variables"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="expense-form" className="btn btn-primary">
              Guardar Gasto
            </button>
          </>
        }
      >
        <form id="expense-form" onSubmit={handleSaveExpense}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha del Gasto *</label>
              <input
                type="date"
                className="form-control"
                value={expFecha}
                onChange={(e) => setExpFecha(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de Gasto</label>
              <ComboboxInline
                options={[
                  { id: 'fijo', label: 'Gasto Fijo (Mensual Recurrente)' },
                  { id: 'variable', label: 'Gasto Variable' },
                ]}
                value={expTipo}
                onChange={(val) => setExpTipo(val as ExpenseType)}
                placeholder="Seleccionar tipo..."
                hideSearch={true}
                buttonStyle={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <ComboboxInline
                options={[
                  { id: 'Renta & Local', label: 'Renta & Local' },
                  { id: 'Servicios Básicos', label: 'Servicios Básicos (Luz, Agua, Internet)' },
                  { id: 'Nómina & Sueldos', label: 'Nómina & Sueldos' },
                  { id: 'Marketing & Publicidad', label: 'Marketing & Publicidad' },
                  { id: 'Empaques & Logística', label: 'Empaques & Logística' },
                  { id: 'Software & Mantenimiento', label: 'Software & Mantenimiento' },
                  { id: 'Honorarios & Contador', label: 'Honorarios & Contador' },
                  { id: 'Otros Gastos', label: 'Otros Gastos' },
                ]}
                value={expCategoria}
                onChange={(val) => setExpCategoria(val)}
                placeholder="Seleccionar categoría..."
                hideSearch={true}
                buttonStyle={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monto ({settings.monedaSimbolo || '$'}) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={expMonto}
                onChange={(e) => setExpMonto(e.target.value === '' ? '' : Number(e.target.value))}
                min={0.01}
                step="any"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción / Concepto *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Pago de renta correspondiente a showroom Col. del Valle"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">N° Factura / Referencia Proveedor (Opcional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. FAC-00123 / Folio fiscal externo o ref. bancaria"
              value={expReferenciaFactura}
              onChange={(e) => setExpReferenciaFactura(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* New Asset Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="Registrar Activo Fijo"
        subtitle="Cálculo automático de depreciación lineal mensual"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAssetModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="asset-form" className="btn btn-primary">
              Guardar Activo
            </button>
          </>
        }
      >
        <form id="asset-form" onSubmit={handleSaveAsset}>
          <div className="form-group">
            <label className="form-label">Nombre del Activo / Equipo *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Plancha Industrial de Vapor / MacBook Pro M3"
              value={astNombre}
              onChange={(e) => setAstNombre(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría del Activo</label>
              <ComboboxInline
                options={[
                  { id: 'Equipo de Cómputo', label: 'Equipo de Cómputo' },
                  { id: 'Maquinaria y Equipo', label: 'Maquinaria y Equipo' },
                  { id: 'Mobiliario y Enseres', label: 'Mobiliario y Enseres' },
                  { id: 'Equipo de Transporte', label: 'Equipo de Transporte' },
                  { id: 'Herramientas y Utillaje', label: 'Herramientas y Utillaje' },
                  { id: 'Edificaciones e Instalaciones', label: 'Edificaciones e Instalaciones' },
                  { id: 'Otros Activos Fijos', label: 'Otros Activos Fijos' },
                ]}
                value={astCategoria}
                onChange={(val) => setAstCategoria(val)}
                placeholder="Seleccionar categoría..."
                hideSearch={true}
                buttonStyle={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Adquisición</label>
              <input
                type="date"
                className="form-control"
                value={astFecha}
                onChange={(e) => setAstFecha(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor de Adquisición ({settings.monedaSimbolo || '$'}) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={astValor}
                onChange={(e) => setAstValor(e.target.value === '' ? '' : Number(e.target.value))}
                min={1}
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vida Útil (Meses) *</label>
              <input
                type="number"
                className="form-control"
                value={astVidaMeses}
                onChange={(e) => setAstVidaMeses(e.target.value === '' ? '' : Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          {astValor && Number(astValor) > 0 && astVidaMeses && Number(astVidaMeses) > 0 && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Depreciación calculada: <strong>{formatCurrency(Number(astValor) / Number(astVidaMeses))} / mes</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Notas / Número de Serie</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ubicación física o serie..."
              value={astNotas}
              onChange={(e) => setAstNotas(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
