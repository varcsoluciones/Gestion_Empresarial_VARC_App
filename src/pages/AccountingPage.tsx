import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { ExpenseType, ProrrateoCriterion } from '../types/erp';
import { formatCurrency, formatDate, getMonthKey } from '../utils/formatters';
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
  DollarSign,
  ShieldCheck,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AccountingPage: React.FC = () => {
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

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [activeTab, setActiveTab] = useState<'prorrateo' | 'expenses' | 'assets'>('prorrateo');
  const [selectedCriterio, setSelectedCriterio] = useState<ProrrateoCriterion>(
    settings.criterioProrrateoDefecto || 'costo_material'
  );

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expFecha, setExpFecha] = useState(new Date().toISOString().split('T')[0]);
  const [expTipo, setExpTipo] = useState<ExpenseType>('fijo');
  const [expCategoria, setExpCategoria] = useState('Renta & Local');
  const [expMonto, setExpMonto] = useState<number | ''>('');
  const [expDesc, setExpDesc] = useState('');

  // New Asset Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [astNombre, setAstNombre] = useState('');
  const [astCategoria, setAstCategoria] = useState('Equipo de Cómputo');
  const [astFecha, setAstFecha] = useState(new Date().toISOString().split('T')[0]);
  const [astValor, setAstValor] = useState<number | ''>('');
  const [astVidaMeses, setAstVidaMeses] = useState<number | ''>(36);
  const [astNotas, setAstNotas] = useState('');

  // Monthly Prorrateo Calculation with selected criterion
  const prorrateo = getProrrateoMensual(selectedMonth, selectedCriterio);

  // Handlers
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expMonto || Number(expMonto) <= 0 || !expDesc.trim()) return;

    addExpense({
      fecha: expFecha,
      periodoMes: expFecha.slice(0, 7),
      tipo: expTipo,
      categoria: expCategoria,
      monto: Number(expMonto),
      descripcion: expDesc.trim()
    });

    setIsExpenseModalOpen(false);
    setExpMonto('');
    setExpDesc('');
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

  const filteredExpenses = expenses.filter(e => e.periodoMes === selectedMonth || e.fecha.startsWith(selectedMonth));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contabilidad de Costos & Prorrateo Operativo</h1>
          <p className="page-description">
            Control de gastos operativos fijos/variables, depreciación lineal de activos y absorción de costos a producto.
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

          {activeTab === 'expenses' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus size={16} />
              + Registrar Gasto
            </button>
          )}

          {activeTab === 'assets' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsAssetModalOpen(true)}>
              <Plus size={16} />
              + Registrar Activo Fijo
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'prorrateo' ? 'active' : ''}`}
          onClick={() => setActiveTab('prorrateo')}
        >
          <Layers size={16} />
          Prorrateo de Costo Real (Productos)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <DollarSign size={16} />
          Gastos Fijos & Variables ({filteredExpenses.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <HardDrive size={16} />
          Activos Fijos & Depreciación ({fixedAssets.length})
        </button>
      </div>

      {/* Monthly Summary Cards Banner */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>Gastos Fijos del Mes</span>
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
            <span>Gastos Variables</span>
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
            <span>Depreciación Mensual Activos</span>
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
            <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Gasto Operativo Total</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{formatCurrency(prorrateo.gastoOperativoTotal)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {selectedCriterio === 'costo_material' && (
                <>Tasa Absorción: <strong>+{prorrateo.tasaAbsorcionPorcentaje}% s/ costo</strong></>
              )}
              {selectedCriterio === 'valor_venta' && (
                <>Tasa Absorción: <strong>+{prorrateo.tasaAbsorcionPorcentaje}% s/ venta</strong></>
              )}
              {selectedCriterio === 'unidades_iguales' && (
                <>Carga fija: <strong>{formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)} / pza</strong></>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tab 1: Prorrateo & Real Cost Comparison Table */}
      {activeTab === 'prorrateo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Rule Selector Controls */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <SlidersHorizontal size={18} style={{ color: 'var(--color-accent)' }} />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Base / Regla de Prorrateo Contable</h3>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
                    Selecciona cómo distribuir los gastos operativos y depreciación entre los productos
                  </p>
                </div>
              </div>

              {/* Criterion Selector Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedCriterio('costo_material')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: selectedCriterio === 'costo_material' ? 'var(--color-accent)' : 'transparent',
                    color: selectedCriterio === 'costo_material' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: selectedCriterio === 'costo_material' ? '0 2px 8px var(--color-accent-glow)' : 'none'
                  }}
                >
                  <ShieldCheck size={14} />
                  Costo de Material Directo (Recomendado)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCriterio('valor_venta')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: selectedCriterio === 'valor_venta' ? 'var(--color-accent)' : 'transparent',
                    color: selectedCriterio === 'valor_venta' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: selectedCriterio === 'valor_venta' ? '0 2px 8px var(--color-accent-glow)' : 'none'
                  }}
                >
                  <PieChart size={14} />
                  Precio de Venta
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCriterio('unidades_iguales')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: selectedCriterio === 'unidades_iguales' ? 'var(--color-accent)' : 'transparent',
                    color: selectedCriterio === 'unidades_iguales' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: selectedCriterio === 'unidades_iguales' ? '0 2px 8px var(--color-accent-glow)' : 'none'
                  }}
                >
                  <Layers size={14} />
                  Por Unidades Iguales
                </button>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: selectedCriterio === 'costo_material' ? 'var(--color-accent-subtle)' : 'var(--bg-subtle)',
              border: '1px solid ' + (selectedCriterio === 'costo_material' ? 'var(--color-accent)' : 'var(--border-default)'),
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.825rem',
              lineHeight: 1.45
            }}>
              <Info size={18} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                {selectedCriterio === 'costo_material' && (
                  <>
                    <strong style={{ color: 'var(--color-accent)' }}>Criterio Contable Basado en Material Directo: </strong>
                    Los gastos operativos totales ({formatCurrency(prorrateo.gastoOperativoTotal)}) se distribuyen como una tasa del <strong>+{prorrateo.tasaAbsorcionPorcentaje}%</strong> sobre el costo de compra de cada producto (Base inventario valuado: {formatCurrency(prorrateo.valorInventarioCostoTotal)}). 
                    <em> Esto evita castigar productos terminados de bajo costo (ej. calcetines o accesorios), manteniendo márgenes reales y proporcionales.</em>
                  </>
                )}
                {selectedCriterio === 'valor_venta' && (
                  <>
                    <strong style={{ color: 'var(--color-accent)' }}>Criterio Basado en Precio de Venta: </strong>
                    Cada producto absorbe gastos proporcionalmente a su capacidad de generación de ingresos ({prorrateo.tasaAbsorcionPorcentaje}% sobre su precio de lista).
                  </>
                )}
                {selectedCriterio === 'unidades_iguales' && (
                  <>
                    <strong style={{ color: 'var(--color-warning)' }}>Criterio Lineal por Unidades: </strong>
                    Se asignan {formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)} fijos a cada prenda sin importar su precio de costo o venta.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Real Cost Comparison Table */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Análisis de Costo Real con Absorción Operativa</h2>
                <p className="card-subtitle">
                  Fórmula Activa: <strong>Costo Real = Costo de Compra + Gasto Operativo Absorbido ({selectedCriterio === 'costo_material' ? `+${prorrateo.tasaAbsorcionPorcentaje}% del material` : selectedCriterio === 'valor_venta' ? `+${prorrateo.tasaAbsorcionPorcentaje}% del PVP` : `${formatCurrency(prorrateo.costoOperativoProrrateadoPorUnidad)} fijo`})</strong>
                </p>
              </div>
            </div>

            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Código / SKU</th>
                    <th>Producto & Existencias</th>
                    <th style={{ textAlign: 'right' }}>Precio Venta</th>
                    <th style={{ textAlign: 'right' }}>1. Costo Compra Directo</th>
                    <th style={{ textAlign: 'center' }}>% Absorción</th>
                    <th style={{ textAlign: 'right' }}>2. Gasto Operativo Absorbido</th>
                    <th style={{ textAlign: 'right', backgroundColor: 'var(--bg-subtle)' }}>3. Costo Real Total</th>
                    <th style={{ textAlign: 'center' }}>Margen Bruto</th>
                    <th style={{ textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>Margen Real</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const costs = getProductRealCost(p.id, selectedMonth, selectedCriterio);
                    const grossMarginPercent = p.precioVenta > 0
                      ? Number((((p.precioVenta - costs.costoCompra) / p.precioVenta) * 100).toFixed(1))
                      : 0;

                    const realMarginPercent = p.precioVenta > 0
                      ? Number((((p.precioVenta - costs.costoReal) / p.precioVenta) * 100).toFixed(1))
                      : 0;

                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.codigo}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock: {p.stockActual} {p.unidadMedida}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(p.precioVenta)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {formatCurrency(costs.costoCompra)}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {selectedCriterio === 'costo_material' ? `+${costs.tasaAbsorcionPorcentaje}%` : selectedCriterio === 'valor_venta' ? `+${costs.tasaAbsorcionPorcentaje}% PVP` : 'Fijo'}
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
                          <span className={`badge ${realMarginPercent >= 30 ? 'badge-success' : realMarginPercent > 0 ? 'badge-warning' : 'badge-danger'}`}>
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
          <div className="card-header">
            <div>
              <h2 className="card-title">Registro de Gastos del Periodo ({selectedMonth})</h2>
              <p className="card-subtitle">Gastos operativos fijos y variables devengados</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus size={16} />
              + Nuevo Gasto
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'center' }}>Tipo</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'right' }}>Monto ($)</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay gastos registrados en el periodo {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{formatDate(exp.fecha)}</td>
                      <td style={{ fontWeight: 600 }}>{exp.categoria}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={exp.tipo === 'fijo' ? 'accent' : 'warning'}>
                          {exp.tipo.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{exp.descripcion}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(exp.monto)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => deleteExpense(exp.id)}
                          title="Eliminar gasto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fixed Assets & Depreciation */}
      {activeTab === 'assets' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Inventario de Activos Fijos & Depreciación Lineal</h2>
              <p className="card-subtitle">Cálculo de alícuota mensual para absorción en gastos operativos</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsAssetModalOpen(true)}>
              <Plus size={16} />
              + Nuevo Activo Fijo
            </button>
          </div>

          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Activo / Nombre</th>
                  <th>Categoría</th>
                  <th>Adquisición</th>
                  <th style={{ textAlign: 'right' }}>Valor Adquisición</th>
                  <th style={{ textAlign: 'center' }}>Vida Útil</th>
                  <th style={{ textAlign: 'right' }}>Depreciación Mensual</th>
                  <th style={{ textAlign: 'right' }}>Depr. Acumulada</th>
                  <th style={{ textAlign: 'right' }}>Valor en Libros</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {fixedAssets.map(ast => (
                  <tr key={ast.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ast.nombre}</div>
                      {ast.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ast.notas}</div>}
                    </td>
                    <td>{ast.categoriaActivo}</td>
                    <td>{formatDate(ast.fechaAdquisicion)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(ast.valorAdquisicion)}</td>
                    <td style={{ textAlign: 'center' }}>{ast.vidaUtilMeses} meses</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <label className="form-label">Monto ($) *</label>
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
                <option value="Equipo de Cómputo">Equipo de Cómputo (3 años)</option>
                <option value="Maquinaria y Equipo">Maquinaria y Equipo (5-10 años)</option>
                <option value="Mobiliario y Enseres">Mobiliario y Enseres (10 años)</option>
                <option value="Equipo de Transporte">Equipo de Transporte (4 años)</option>
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
              <label className="form-label">Valor de Adquisición ($) *</label>
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
