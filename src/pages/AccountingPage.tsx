import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { ExpenseType, OperatingExpense } from '../types/erp';
import { formatCurrency, formatDate, formatDateTime, getMonthKey, getTodayLocalDateString } from '../utils/formatters';
import { useTranslation } from '../i18n/useTranslation';
import {
  Calculator,
  Plus,
  Trash2,
  PieChart,
  HardDrive,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { useTableSort } from '../hooks/useTableSort';

interface AccountingPageProps {
  initialTab?: 'prorrateo' | 'expenses' | 'assets';
}

export const AccountingPage: React.FC<AccountingPageProps> = ({ initialTab }) => {
  const {
    settings,
    expenses,
    fixedAssets,
    products,
    addExpense,
    deleteExpense,
    addFixedAsset,
    getProrrateoMensual,
    getProductRealCost
  } = useERP();

  const { t } = useTranslation();

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [activeTab, setActiveTab] = useState<'prorrateo' | 'expenses' | 'assets'>(initialTab || 'prorrateo');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
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

    const todayStr = getTodayLocalDateString();
    const nowIso = new Date().toISOString();
    const expenseDate = expFecha === todayStr ? nowIso : (expFecha.includes('T') ? expFecha : `${expFecha}T${nowIso.split('T')[1] || '12:00:00.000Z'}`);

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

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.accounting.title}</h1>
          <p className="page-description">
            {t.accounting.subtitle}
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
          {t.accounting.tabProrrateo}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <DollarSign size={16} />
          {t.accounting.tabExpenses} ({filteredExpenses.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <HardDrive size={16} />
          {t.accounting.tabAssets} ({fixedAssets.length})
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
              <select
                className="form-select"
                value={expTipo}
                onChange={(e) => setExpTipo(e.target.value as ExpenseType)}
              >
                <option value="fijo">Gasto Fijo (Mensual Recurrente)</option>
                <option value="variable">Gasto Variable</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-select"
                value={expCategoria}
                onChange={(e) => setExpCategoria(e.target.value)}
              >
                <option value="Renta & Local">Renta & Local</option>
                <option value="Servicios Básicos">Servicios Básicos (Luz, Agua, Internet)</option>
                <option value="Nómina & Sueldos">Nómina & Sueldos</option>
                <option value="Marketing & Publicidad">Marketing & Publicidad</option>
                <option value="Empaques & Logística">Empaques & Logística</option>
                <option value="Software & Mantenimiento">Software & Mantenimiento</option>
                <option value="Honorarios & Contador">Honorarios & Contador</option>
                <option value="Otros Gastos">Otros Gastos</option>
              </select>
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
              <select
                className="form-select"
                value={astCategoria}
                onChange={(e) => setAstCategoria(e.target.value)}
              >
                <option value="Equipo de Cómputo">Equipo de Cómputo</option>
                <option value="Maquinaria y Equipo">Maquinaria y Equipo</option>
                <option value="Mobiliario y Enseres">Mobiliario y Enseres</option>
                <option value="Equipo de Transporte">Equipo de Transporte</option>
                <option value="Herramientas y Utillaje">Herramientas y Utillaje</option>
                <option value="Edificaciones e Instalaciones">Edificaciones e Instalaciones</option>
                <option value="Otros Activos Fijos">Otros Activos Fijos</option>
              </select>
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
