import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { MovementType } from '../types/erp';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  Boxes,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';

export const InventoryPage: React.FC = () => {
  const {
    products,
    categories,
    inventoryMovements,
    createInventoryAdjustment
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'kardex' | 'stock'>('kardex');

  // Manual Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjProdId, setAdjProdId] = useState('');
  const [adjVarId, setAdjVarId] = useState('');
  const [adjTipo, setAdjTipo] = useState<'incremento' | 'decremento'>('incremento');
  const [adjCantidad, setAdjCantidad] = useState<number | ''>(1);
  const [adjMotivo, setAdjMotivo] = useState('');
  const [adjError, setAdjError] = useState('');

  const handleOpenAdjustment = (prodId?: string) => {
    const targetProdId = prodId || products[0]?.id || '';
    setAdjProdId(targetProdId);
    const prod = products.find(p => p.id === targetProdId);
    if (prod && prod.tieneVariantes && prod.variantes && prod.variantes.length > 0) {
      setAdjVarId(prod.variantes[0].id);
    } else {
      setAdjVarId('');
    }
    setAdjTipo('incremento');
    setAdjCantidad(1);
    setAdjMotivo('');
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
    if (!adjMotivo.trim()) {
      setAdjError('El motivo del ajuste es obligatorio');
      return;
    }

    const qtyNumber = Number(adjCantidad);
    const finalQty = adjTipo === 'decremento' ? -qtyNumber : qtyNumber;

    createInventoryAdjustment(
      adjProdId,
      adjVarId || undefined,
      finalQty,
      adjMotivo.trim()
    );

    setIsAdjustModalOpen(false);
  };

  // KPIs
  const totalStockUnits = products.reduce((sum, p) => sum + p.stockActual, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);
  const lowStockCount = products.filter(p => p.stockActual <= p.stockMinimo).length;

  // Filtered movements
  const filteredMovements = inventoryMovements.filter(m => {
    const prod = products.find(p => p.id === m.productoId);
    const matchesSearch = (prod?.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod?.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.referenciaDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.motivo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProduct = selectedProductFilter === 'all' || m.productoId === selectedProductFilter;
    const matchesType = selectedTypeFilter === 'all' || m.tipo === selectedTypeFilter;

    return matchesSearch && matchesProduct && matchesType;
  });

  const selectedAdjProdObj = products.find(p => p.id === adjProdId);

  const getMovementTypeBadge = (tipo: MovementType) => {
    switch (tipo) {
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleOpenAdjustment()}>
            <SlidersHorizontal size={15} />
            + Ajuste Manual de Stock
          </button>
        </div>
      </div>

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
          Existencias & Variantes por Producto ({products.length})
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
          >
            <option value="all">Todos los productos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
            ))}
          </select>

          {activeView === 'kardex' && (
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
            >
              <option value="all">Todos los movimientos</option>
              <option value="ENTRADA_COMPRA">Entrada por Compra</option>
              <option value="SALIDA_VENTA">Salida por Venta</option>
              <option value="AJUSTE_MANUAL">Ajuste Manual</option>
              <option value="ANULACION_COMPRA">Anulación Compra</option>
              <option value="ANULACION_VENTA">Anulación Venta</option>
            </select>
          )}
        </div>
      </div>

      {/* View 1: Kardex Movements Table */}
      {activeView === 'kardex' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Tipo de Movimiento</th>
                <th>Referencia</th>
                <th>Producto / Variante</th>
                <th style={{ textAlign: 'center' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Costo Unit.</th>
                <th style={{ textAlign: 'center' }}>Stock Resultante</th>
                <th>Motivo / Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No hay movimientos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const prod = products.find(p => p.id === m.productoId);
                  const isPositive = m.cantidad > 0;

                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDateTime(m.fecha)}
                      </td>
                      <td>{getMovementTypeBadge(m.tipo)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem' }}>
                        {m.referenciaDoc}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod?.nombre || 'Producto'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {prod?.codigo}</div>
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
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        <span className="badge badge-neutral">{m.stockResultante} {prod?.unidadMedida}</span>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {m.motivo}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View 2: Current Stock and Variants Overview */}
      {activeView === 'stock' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'center' }}>Stock Total</th>
                <th style={{ textAlign: 'center' }}>Mínimo</th>
                <th style={{ textAlign: 'right' }}>Costo Promedio</th>
                <th style={{ textAlign: 'right' }}>Valor en Inventario</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const cat = categories.find(c => c.id === p.categoriaId);
                const isLow = p.stockActual <= p.stockMinimo;
                const value = p.stockActual * p.costoPromedio;

                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.codigo}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                      {p.tieneVariantes && p.variantes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                          {p.variantes.map(v => `${v.color}-${v.talla}: ${v.stockActual}`).join(' | ')}
                        </div>
                      )}
                    </td>
                    <td>{cat?.nombre}</td>
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenAdjustment(p.id)}
                      >
                        Ajustar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Ajuste Manual de Inventario"
        subtitle="Auditoría obligatoria: registra aumentos o disminuciones físicas"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="adjust-inventory-form" className="btn btn-primary">
              Guardar Ajuste
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

          <div className="form-group">
            <label className="form-label">Producto a Ajustar *</label>
            <ComboboxInline
              options={products.map(p => ({
                id: p.id,
                label: p.nombre,
                sublabel: `Stock actual: ${p.stockActual} ${p.unidadMedida}`
              }))}
              value={adjProdId}
              onChange={handleSelectAdjProduct}
              placeholder="Seleccionar producto..."
            />
          </div>

          {selectedAdjProdObj && selectedAdjProdObj.tieneVariantes && selectedAdjProdObj.variantes && (
            <div className="form-group">
              <label className="form-label">Variante (Talla / Color)</label>
              <select
                className="form-select"
                value={adjVarId}
                onChange={(e) => setAdjVarId(e.target.value)}
              >
                {selectedAdjProdObj.variantes.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.color} / Talla {v.talla} (Stock actual: {v.stockActual})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Ajuste</label>
              <select
                className="form-select"
                value={adjTipo}
                onChange={(e) => setAdjTipo(e.target.value as any)}
              >
                <option value="incremento">+ Entrada / Aumento (Sobrante, Conteo)</option>
                <option value="decremento">- Salida / Disminución (Merma, Daño, Pérdida)</option>
              </select>
            </div>

            <div className="form-group">
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

          <div className="form-group">
            <label className="form-label">
              Motivo Obligatorio del Ajuste <span className="form-label-required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Explica la causa del ajuste (ej. Conteo físico anual, merma por humedad, muestra entregada a cliente...)"
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
