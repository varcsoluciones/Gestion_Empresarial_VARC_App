import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { MovementType } from '../types/erp';
import { formatCurrency, formatDateTime, formatMonthLabel } from '../utils/formatters';
import {
  Boxes,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { useTableSort } from '../hooks/useTableSort';

interface InventoryPageProps {
  initialView?: 'kardex' | 'stock';
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ initialView }) => {
  const {
    products,
    categories,
    inventoryMovements,
    createInventoryAdjustment,
    recalculateInventoryFromKardex
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'kardex' | 'stock'>(initialView || 'kardex');
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleExpandProduct = (productId: string) => {
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  // Manual Adjustment & Initial Inventory Load Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjIsInitialLoad, setAdjIsInitialLoad] = useState(false);
  const [adjProdId, setAdjProdId] = useState('');
  const [adjVarId, setAdjVarId] = useState('');
  const [adjTipo, setAdjTipo] = useState<'incremento' | 'decremento'>('incremento');
  const [adjCantidad, setAdjCantidad] = useState<number | ''>(1);
  const [adjCostoInicial, setAdjCostoInicial] = useState<number | ''>('');
  const [adjMotivo, setAdjMotivo] = useState('');
  const [adjError, setAdjError] = useState('');

  const handleOpenAdjustment = (prodId?: string, varId?: string, isInitial = false) => {
    const targetProdId = prodId || products[0]?.id || '';
    setAdjProdId(targetProdId);
    const prod = products.find(p => p.id === targetProdId);
    if (prod && prod.tieneVariantes && prod.variantes && prod.variantes.length > 0) {
      if (varId && prod.variantes.some(v => v.id === varId)) {
        setAdjVarId(varId);
      } else {
        setAdjVarId(prod.variantes[0].id);
      }
    } else {
      setAdjVarId('');
    }
    setAdjIsInitialLoad(isInitial);
    setAdjTipo('incremento');
    setAdjCantidad(1);
    setAdjCostoInicial(prod?.costoPromedio ? prod.costoPromedio : '');
    setAdjMotivo(isInitial ? 'Carga de inventario inicial' : '');
    setAdjError('');
    setIsAdjustModalOpen(true);
  };

  const handleSelectAdjProduct = (prodId: string) => {
    setAdjProdId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod && prod.tieneVariantes && prod.variantes && prod.variantes.length > 0) {
      setAdjVarId(prod.variantes[0].id);
    } else {
      setAdjVarId('');
    }
    if (adjIsInitialLoad && prod?.costoPromedio) {
      setAdjCostoInicial(prod.costoPromedio);
    }
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProdId) {
      setAdjError('Selecciona un producto');
      return;
    }
    if (!adjCantidad || Number(adjCantidad) <= 0) {
      setAdjError('La cantidad debe ser mayor a 0');
      return;
    }
    if (adjIsInitialLoad && (adjCostoInicial === '' || Number(adjCostoInicial) < 0)) {
      setAdjError('El costo unitario inicial es obligatorio y debe ser mayor o igual a 0');
      return;
    }
    if (!adjMotivo.trim()) {
      setAdjError('El motivo es obligatorio');
      return;
    }

    const qtyNumber = Number(adjCantidad);
    const finalQty = (!adjIsInitialLoad && adjTipo === 'decremento') ? -qtyNumber : qtyNumber;
    const initialCostNum = adjIsInitialLoad ? (Number(adjCostoInicial) || 0) : undefined;

    createInventoryAdjustment(
      adjProdId,
      adjVarId || undefined,
      finalQty,
      adjMotivo.trim(),
      adjIsInitialLoad,
      initialCostNum
    );

    setIsAdjustModalOpen(false);
  };

  // KPIs
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockActual, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);
  const lowStockCount = products.filter(p => p.stockActual <= p.stockMinimo).length;

  const availableMonths = Array.from(
    new Set(
      inventoryMovements
        .map(m => m.fecha ? m.fecha.substring(0, 7) : '')
        .filter(Boolean)
    )
  ).sort().reverse();

  // Filtered movements
  const filteredMovements = inventoryMovements.filter(m => {
    const prod = products.find(p => p.id === m.productoId);
    const matchesSearch = (prod?.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod?.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.referenciaDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.motivo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProduct = selectedProductFilter === 'all' || m.productoId === selectedProductFilter;
    const matchesType = selectedTypeFilter === 'all' || m.tipo === selectedTypeFilter;
    const matchesMonth = monthFilter === 'all' || (m.fecha && m.fecha.startsWith(monthFilter));

    return matchesSearch && matchesProduct && matchesType && matchesMonth;
  });

  const {
    sortedItems: sortedMovements,
    sortKey: kardexSortKey,
    sortDirection: kardexSortDirection,
    requestSort: requestKardexSort
  } = useTableSort(filteredMovements, {
    defaultKey: 'fecha',
    defaultDirection: 'desc',
    defaultIsNumeric: true,
    customGetters: {
      sku: (m) => {
        const prod = products.find(p => p.id === m.productoId);
        const variant = prod?.variantes?.find(v => v.id === m.varianteId);
        return variant?.sku || prod?.codigo || '';
      },
      producto: (m) => products.find(p => p.id === m.productoId)?.nombre || '',
      costoTotal: (m) => m.cantidad * m.costoUnitario,
    }
  });

  const filteredKardexTotals = React.useMemo(() => {
    const totalCantidad = filteredMovements.reduce((sum, m) => sum + m.cantidad, 0);
    const totalCosto = filteredMovements.reduce((sum, m) => sum + (m.cantidad * m.costoUnitario), 0);
    const totalEntradas = filteredMovements.filter(m => m.cantidad > 0).reduce((sum, m) => sum + m.cantidad, 0);
    const totalSalidas = filteredMovements.filter(m => m.cantidad < 0).reduce((sum, m) => sum + Math.abs(m.cantidad), 0);
    return {
      totalCantidad,
      totalCosto,
      totalEntradas,
      totalSalidas,
      count: filteredMovements.length
    };
  }, [filteredMovements]);

  const filteredStockProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProductFilter === 'all' || p.id === selectedProductFilter;
    return matchesSearch && matchesProduct;
  });

  const {
    sortedItems: sortedStockProducts,
    sortKey: stockSortKey,
    sortDirection: stockSortDirection,
    requestSort: requestStockSort
  } = useTableSort(filteredStockProducts, {
    defaultKey: 'nombre',
    defaultDirection: 'asc',
    defaultIsNumeric: false,
    customGetters: {
      categoria: (p) => categories.find(c => c.id === p.categoriaId)?.nombre || '',
      valorInventario: (p) => p.stockActual * p.costoPromedio,
      estadoStock: (p) => (p.stockActual <= p.stockMinimo ? 'Bajo' : 'Normal')
    }
  });

  const selectedAdjProdObj = products.find(p => p.id === adjProdId);

  const getMovementTypeBadge = (tipo: MovementType) => {
    switch (tipo) {
      case 'INVENTARIO_INICIAL':
        return <Badge variant="accent">Inventario Inicial</Badge>;
      case 'ENTRADA_COMPRA':
        return <Badge variant="success">Entrada (Compra)</Badge>;
      case 'SALIDA_VENTA':
        return <Badge variant="info">Salida (Venta)</Badge>;
      case 'AJUSTE_MANUAL':
        return <Badge variant="warning">Ajuste Manual</Badge>;
      case 'ANULACION_COMPRA':
        return <Badge variant="danger">Anulación Compra</Badge>;
      case 'ANULACION_VENTA':
        return <Badge variant="accent">Anulación Venta (Reingreso)</Badge>;
      default:
        return <Badge variant="neutral">{tipo}</Badge>;
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventarios & Kardex Permanente</h1>
          <p className="page-description">
            Trazabilidad completa de entradas, salidas y existencias calculadas a partir de movimientos inmutables.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              recalculateInventoryFromKardex();
              setSyncToastMessage('Existencias y costo promedio reconciliados y sincronizados con éxito desde el historial de Kardex.');
              setTimeout(() => setSyncToastMessage(null), 4000);
            }}
            title="Auditar y sincronizar todas las existencias y costos con los movimientos de Kardex"
          >
            <RotateCcw size={15} />
            Reconciliar Kardex
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenAdjustment(undefined, undefined, false)}
            title="Ajustar existencias físicas o realizar carga inicial de inventario"
          >
            <SlidersHorizontal size={15} />
            + Ajustar/Cargar
          </button>
        </div>
      </div>

      {/* Sync toast notification */}
      {syncToastMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success-text)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{syncToastMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span>Existencias Totales en Almacén</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
              <Boxes size={18} />
            </div>
          </div>
          <div className="stat-value">{totalStockUnits} pzs</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>{products.length} productos registrados</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Valorización de Inventario (Costo)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalStockValue)}</div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Calculado a costo promedio móvil</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Alertas de Stock Mínimo</span>
            <div className="stat-icon" style={{ backgroundColor: lowStockCount > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)', color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {lowStockCount}
          </div>
          <div className="stat-footer">
            <span style={{ color: 'var(--text-muted)' }}>Productos por debajo del nivel de seguridad</span>
          </div>
        </div>
      </div>

      {/* Tabs / View switch */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeView === 'kardex' ? 'active' : ''}`}
          onClick={() => setActiveView('kardex')}
        >
          <Layers size={16} />
          Kardex de Movimientos ({filteredMovements.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeView === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveView('stock')}
        >
          <Boxes size={16} />
          Existencias & Variantes por Producto ({filteredStockProducts.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por producto, folio, motivo o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <ComboboxInline
            options={[
              { id: 'all', label: 'Todos los productos' },
              ...products.map(p => ({
                id: p.id,
                label: p.nombre,
                sublabel: `SKU: ${p.codigo}`
              }))
            ]}
            value={selectedProductFilter}
            onChange={setSelectedProductFilter}
            placeholder="Todos los productos"
            searchPlaceholder="Buscar producto o SKU..."
            buttonStyle={{ minWidth: '220px' }}
          />

          {activeView === 'kardex' && (
            <>
              <ComboboxInline
                options={[
                  { id: 'all', label: 'Todos los meses' },
                  ...availableMonths.map(mKey => ({
                    id: mKey,
                    label: formatMonthLabel(mKey)
                  }))
                ]}
                value={monthFilter}
                onChange={setMonthFilter}
                placeholder="Todos los meses"
                hideSearch={true}
                buttonStyle={{ minWidth: '160px' }}
              />

              <ComboboxInline
                options={[
                  { id: 'all', label: 'Todos los tipos de movimiento' },
                  { id: 'INVENTARIO_INICIAL', label: 'Carga Inventario Inicial' },
                  { id: 'ENTRADA_COMPRA', label: 'Entrada por Compra' },
                  { id: 'SALIDA_VENTA', label: 'Salida por Venta' },
                  { id: 'AJUSTE_MANUAL', label: 'Ajuste Manual' },
                  { id: 'ANULACION_COMPRA', label: 'Anulación Compra' },
                  { id: 'ANULACION_VENTA', label: 'Anulación Venta' },
                ]}
                value={selectedTypeFilter}
                onChange={setSelectedTypeFilter}
                placeholder="Todos los tipos"
                hideSearch={true}
                buttonStyle={{ minWidth: '210px' }}
              />
            </>
          )}

          <ExcelExportButton
            filename={activeView === 'kardex' ? `Kardex_Movimientos_${monthFilter}` : 'Existencias_Stock_Inventario'}
            title={`Exportar ${activeView === 'kardex' ? 'kardex' : 'existencias de inventario'} a Excel`}
          />
        </div>
      </div>

      {/* View 1: Kardex Movements Table */}
      {activeView === 'kardex' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <SortableTh
                  sortKey="fecha"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={true}
                >
                  Fecha / Hora
                </SortableTh>
                <SortableTh
                  sortKey="tipo"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={false}
                >
                  Tipo de Movimiento
                </SortableTh>
                <SortableTh
                  sortKey="referenciaDoc"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={false}
                >
                  Referencia
                </SortableTh>
                <SortableTh
                  sortKey="sku"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={false}
                >
                  SKU / Código
                </SortableTh>
                <SortableTh
                  sortKey="producto"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={false}
                >
                  Producto / Descripción
                </SortableTh>
                <SortableTh
                  sortKey="cantidad"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={true}
                  align="center"
                >
                  Cantidad
                </SortableTh>
                <SortableTh
                  sortKey="costoUnitario"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={true}
                  align="right"
                >
                  Costo Unit.
                </SortableTh>
                <SortableTh
                  sortKey="costoTotal"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={true}
                  align="right"
                >
                  Costo Total
                </SortableTh>
                <SortableTh
                  sortKey="motivo"
                  currentSortKey={kardexSortKey}
                  currentSortDirection={kardexSortDirection}
                  onSort={requestKardexSort}
                  isNumeric={false}
                >
                  Motivo / Detalle
                </SortableTh>
              </tr>
            </thead>
            <tbody>
              {sortedMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No hay movimientos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                sortedMovements.map(m => {
                  const prod = products.find(p => p.id === m.productoId);
                  const variant = prod?.variantes?.find(v => v.id === m.varianteId);
                  const skuCode = variant?.sku || prod?.codigo || '—';
                  const isPositive = m.cantidad > 0;
                  const totalMovementCost = m.cantidad * m.costoUnitario;

                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDateTime(m.fecha)}
                      </td>
                      <td>{getMovementTypeBadge(m.tipo)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem' }}>
                        {m.referenciaDoc}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem' }}>
                        {skuCode}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod?.nombre || 'Producto'}</div>
                        {variant ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Talla: {variant.talla} | Color: {variant.color}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: isPositive ? 'var(--color-success-text)' : 'var(--color-danger-text)'
                        }}>
                          {isPositive ? `+${m.cantidad}` : m.cantidad} {prod?.unidadMedida}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(m.costoUnitario)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: totalMovementCost >= 0 ? 'var(--color-primary-text, var(--color-accent))' : 'var(--color-danger-text)' }}>
                        {formatCurrency(totalMovementCost)}
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {m.motivo}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedMovements.length > 0 && (
              <tfoot style={{ borderTop: '2px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)', fontWeight: 700 }}>
                <tr>
                  <td colSpan={5} style={{ padding: '0.85rem 0.6rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>TOTAL FILTRADO:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                        {filteredKardexTotals.count} movimientos
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        (+{filteredKardexTotals.totalEntradas} entradas / -{filteredKardexTotals.totalSalidas} salidas)
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.85rem 0.6rem', fontSize: '0.9rem' }}>
                    <span style={{
                      fontWeight: 700,
                      color: filteredKardexTotals.totalCantidad >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)'
                    }}>
                      {filteredKardexTotals.totalCantidad >= 0 ? `+${filteredKardexTotals.totalCantidad}` : filteredKardexTotals.totalCantidad} pzs
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.85rem 0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    —
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.85rem 0.6rem', fontSize: '0.95rem', fontWeight: 800, color: filteredKardexTotals.totalCosto >= 0 ? 'var(--color-accent)' : 'var(--color-danger-text)' }}>
                    {formatCurrency(filteredKardexTotals.totalCosto)}
                  </td>
                  <td style={{ padding: '0.85rem 0.6rem' }}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* View 2: Current Stock and Variants Overview */}
      {activeView === 'stock' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '38px', textAlign: 'center' }}></th>
                <SortableTh
                  sortKey="codigo"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={false}
                >
                  Código
                </SortableTh>
                <SortableTh
                  sortKey="nombre"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={false}
                >
                  Producto
                </SortableTh>
                <SortableTh
                  sortKey="categoria"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={false}
                >
                  Categoría
                </SortableTh>
                <SortableTh
                  sortKey="stockActual"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={true}
                  align="center"
                >
                  Stock Total
                </SortableTh>
                <SortableTh
                  sortKey="stockMinimo"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={true}
                  align="center"
                >
                  Mínimo
                </SortableTh>
                <SortableTh
                  sortKey="costoPromedio"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={true}
                  align="right"
                >
                  Costo Promedio
                </SortableTh>
                <SortableTh
                  sortKey="valorInventario"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={true}
                  align="right"
                >
                  Valor en Inventario
                </SortableTh>
                <SortableTh
                  sortKey="estadoStock"
                  currentSortKey={stockSortKey}
                  currentSortDirection={stockSortDirection}
                  onSort={requestStockSort}
                  isNumeric={false}
                  align="center"
                >
                  Estado
                </SortableTh>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No se encontraron productos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                sortedStockProducts.map(p => {
                  const cat = categories.find(c => c.id === p.categoriaId);
                  const isLow = p.stockActual <= p.stockMinimo;
                  const value = p.stockActual * p.costoPromedio;
                  const hasVariants = Boolean(p.tieneVariantes && p.variantes && p.variantes.length > 0);
                  const isExpanded = expandedProductIds.has(p.id);

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        onClick={() => {
                          if (hasVariants) toggleExpandProduct(p.id);
                        }}
                        style={{
                          cursor: hasVariants ? 'pointer' : 'default',
                          backgroundColor: isExpanded ? 'var(--bg-subtle)' : undefined,
                          transition: 'background-color var(--transition-fast)'
                        }}
                      >
                        <td style={{ textAlign: 'center', width: '38px', padding: '0.5rem 0.25rem' }}>
                          {hasVariants ? (
                            <button
                              type="button"
                              className="btn-icon btn-sm"
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: isExpanded ? 'var(--color-accent)' : 'var(--text-muted)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandProduct(p.id);
                              }}
                              title={isExpanded ? 'Ocultar desglose de variantes' : 'Ver desglose de variantes en tabla'}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.codigo}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        </td>
                        <td>{cat?.nombre || 'General'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {p.stockActual} {p.unidadMedida}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          {p.stockMinimo} {p.unidadMedida}
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(p.costoPromedio)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(value)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={isLow ? 'danger' : 'success'}>
                            {isLow ? 'Stock Bajo' : 'Normal'}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAdjustment(p.id, undefined, false);
                              }}
                              title="Ajustar existencias o realizar carga de inventario"
                            >
                              Ajustar/Cargar
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Variants Breakdown Subtable */}
                      {isExpanded && hasVariants && p.variantes && (
                        <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <td colSpan={10} style={{ padding: '0.75rem 1.25rem 1.25rem 2.5rem', borderBottom: '1px solid var(--border-default)' }}>
                            <div style={{
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-default)',
                              borderRadius: 'var(--radius-lg)',
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-sm)'
                            }}>
                              {/* Subtable Header Banner */}
                              <div style={{
                                padding: '0.65rem 1rem',
                                backgroundColor: 'var(--color-accent-subtle)',
                                borderBottom: '1px solid var(--border-default)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.825rem', color: 'var(--color-accent)' }}>
                                  <Layers size={15} />
                                  <span>Desglose de Existencias por Variante — {p.nombre} ({p.codigo})</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Total: <strong style={{ color: 'var(--text-primary)' }}>{p.variantes.length} variantes</strong> | Costo Promedio Unitario: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.costoPromedio)}</strong>
                                </div>
                              </div>

                              {/* Subtable of Variants */}
                              <div style={{ overflowX: 'auto' }}>
                                <table className="table" style={{ margin: 0, fontSize: '0.825rem' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)' }}>
                                      <th style={{ padding: '0.5rem 0.85rem', width: '22%' }}>SKU / Código Variante</th>
                                      <th style={{ padding: '0.5rem 0.85rem', width: '16%' }}>Color</th>
                                      <th style={{ padding: '0.5rem 0.85rem', width: '14%' }}>Talla</th>
                                      <th style={{ padding: '0.5rem 0.85rem', textAlign: 'center', width: '14%' }}>Existencias (Stock)</th>
                                      <th style={{ padding: '0.5rem 0.85rem', textAlign: 'right', width: '14%' }}>Costo Promedio</th>
                                      <th style={{ padding: '0.5rem 0.85rem', textAlign: 'right', width: '14%' }}>Valor Inventario</th>
                                      <th style={{ padding: '0.5rem 0.85rem', textAlign: 'right', width: '10%' }}>Acción</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {p.variantes.map(v => {
                                      const varValue = v.stockActual * p.costoPromedio;
                                      const isVarLow = v.stockActual <= 3;

                                      return (
                                        <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                          <td style={{ padding: '0.55rem 0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {v.sku || `${p.codigo}-${v.color}-${v.talla}`}
                                          </td>
                                          <td style={{ padding: '0.55rem 0.85rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'inline-block' }} />
                                              {v.color || 'Único'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '0.55rem 0.85rem', fontWeight: 600 }}>
                                            {v.talla || 'Única'}
                                          </td>
                                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'center' }}>
                                            <span style={{
                                              display: 'inline-block',
                                              padding: '0.2rem 0.55rem',
                                              borderRadius: 'var(--radius-sm)',
                                              fontWeight: 700,
                                              backgroundColor: isVarLow ? 'var(--color-danger-bg)' : 'var(--bg-subtle)',
                                              color: isVarLow ? 'var(--color-danger)' : 'var(--text-primary)',
                                              border: isVarLow ? '1px solid var(--color-danger-border)' : '1px solid var(--border-default)'
                                            }}>
                                              {v.stockActual} {p.unidadMedida}
                                            </span>
                                          </td>
                                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {formatCurrency(p.costoPromedio)}
                                          </td>
                                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {formatCurrency(varValue)}
                                          </td>
                                          <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                              <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleOpenAdjustment(p.id, v.id, false);
                                                }}
                                                title={`Ajustar o cargar existencias para ${v.color} - ${v.talla}`}
                                              >
                                                Ajustar/Cargar
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Stock Adjustment & Initial Inventory Load Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={adjIsInitialLoad ? 'Carga de Inventario Inicial' : 'Ajuste Manual de Inventario'}
        subtitle={adjIsInitialLoad ? 'Asigna existencias iniciales con costo unitario de partida (Ref: II0001)' : 'Auditoría obligatoria a costo promedio móvil (Ref: AJ0001)'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="adjust-inventory-form" className="btn btn-primary">
              {adjIsInitialLoad ? 'Guardar Carga Inicial' : 'Guardar Ajuste'}
            </button>
          </>
        }
      >
        <form id="adjust-inventory-form" onSubmit={handleSaveAdjustment}>
          {adjError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {adjError}
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-subtle)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                backgroundColor: !adjIsInitialLoad ? 'var(--bg-surface)' : 'transparent',
                color: !adjIsInitialLoad ? 'var(--color-accent)' : 'var(--text-secondary)',
                boxShadow: !adjIsInitialLoad ? 'var(--shadow-sm)' : 'none'
              }}
              onClick={() => {
                setAdjIsInitialLoad(false);
                if (adjMotivo === 'Carga de inventario inicial') setAdjMotivo('');
              }}
            >
              Ajuste Físico (Entrada / Salida)
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                backgroundColor: adjIsInitialLoad ? 'var(--bg-surface)' : 'transparent',
                color: adjIsInitialLoad ? 'var(--color-accent)' : 'var(--text-secondary)',
                boxShadow: adjIsInitialLoad ? 'var(--shadow-sm)' : 'none'
              }}
              onClick={() => {
                setAdjIsInitialLoad(true);
                setAdjTipo('incremento');
                if (!adjMotivo) setAdjMotivo('Carga de inventario inicial');
              }}
            >
              Carga de Inventario Inicial (Con Costo)
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Producto *</label>
            <ComboboxInline
              options={products.map(p => ({
                id: p.id,
                label: p.nombre,
                sublabel: `Stock actual: ${p.stockActual} ${p.unidadMedida} | Costo prom: ${formatCurrency(p.costoPromedio)}`
              }))}
              value={adjProdId}
              onChange={handleSelectAdjProduct}
              placeholder="Seleccionar producto..."
            />
          </div>

          {selectedAdjProdObj && selectedAdjProdObj.tieneVariantes && selectedAdjProdObj.variantes && (
            <div className="form-group">
              <label className="form-label">Variante Específica</label>
              <ComboboxInline
                options={selectedAdjProdObj.variantes.map(v => ({
                  id: v.id,
                  label: `${v.talla ? `Talla: ${v.talla}` : ''} ${v.color ? `Color: ${v.color}` : ''}`.trim() || v.sku,
                  sublabel: `Stock actual: ${v.stockActual} | SKU: ${v.sku}`
                }))}
                value={adjVarId}
                onChange={setAdjVarId}
                hideSearch={true}
              />
            </div>
          )}

          {adjIsInitialLoad ? (
            /* Mode 1: Initial Inventory Load */
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad Inicial a Cargar *</label>
                <input
                  type="number"
                  className="form-control"
                  value={adjCantidad}
                  onChange={(e) => setAdjCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                  required
                  placeholder="0"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Costo Unitario Inicial ($) *</label>
                <input
                  type="number"
                  className="form-control"
                  value={adjCostoInicial}
                  onChange={(e) => setAdjCostoInicial(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  step="any"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            /* Mode 2: Physical Adjustment */
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de Ajuste</label>
                <ComboboxInline
                  options={[
                    { id: 'incremento', label: '+ Entrada / Aumento (Sobrante, Conteo)' },
                    { id: 'decremento', label: '- Salida / Disminución (Merma, Daño, Pérdida)' },
                  ]}
                  value={adjTipo}
                  onChange={(val) => setAdjTipo(val as any)}
                  placeholder="Seleccionar tipo..."
                  hideSearch={true}
                  buttonStyle={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad *</label>
                <input
                  type="number"
                  className="form-control"
                  value={adjCantidad}
                  onChange={(e) => setAdjCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                  required
                />
              </div>
            </div>
          )}

          {!adjIsInitialLoad && selectedAdjProdObj && (
            <div style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              fontSize: '0.775rem',
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              ℹ️ <strong>Costo automático aplicado:</strong> {formatCurrency(selectedAdjProdObj.costoPromedio)} (Costo promedio móvil actual). Los ajustes físicos no requieren ingresar costo manual.
            </div>
          )}

          {adjIsInitialLoad && (
            <div style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--color-accent-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              fontSize: '0.775rem',
              color: 'var(--color-accent)',
              marginBottom: '1rem'
            }}>
              💡 <strong>Referencia Kardex:</strong> Se registrará automáticamente bajo el folio consecutivo <strong>II000X</strong> y fijará el costo promedio de partida.
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {adjIsInitialLoad ? 'Concepto / Nota de Carga Inicial' : 'Motivo Obligatorio del Ajuste'} <span className="form-label-required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder={adjIsInitialLoad ? 'Ej. Carga de inventario inicial apertura de tienda' : 'Explica la causa del ajuste (ej. Conteo físico anual, merma por humedad...)'}
              value={adjMotivo}
              onChange={(e) => setAdjMotivo(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
