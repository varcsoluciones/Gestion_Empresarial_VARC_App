import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { Purchase, PaymentMethod } from '../types/erp';
import { formatCurrency, formatDate, formatMonthLabel } from '../utils/formatters';
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  DollarSign
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { QuickCreateSupplierModal } from '../components/quick-create/QuickCreateSupplierModal';
import { QuickCreateProductModal } from '../components/quick-create/QuickCreateProductModal';
import { ExcelExportButton } from '../components/common/ExcelExportButton';

export const PurchasesPage: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    settings,
    createPurchase,
    receivePurchase,
    cancelPurchase,
    addSupplierPayment
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Modals state
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);

  // Detail / Payment / Cancel modal states
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // New Purchase Form State
  const [formProveedorId, setFormProveedorId] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);
  const [formTasaImpuesto, setFormTasaImpuesto] = useState<number>(settings.tasaImpuestoDefecto ?? 16);
  const [formNotas, setFormNotas] = useState('');
  const [formItems, setFormItems] = useState<{
    productoId: string;
    varianteId?: string;
    descripcion: string;
    cantidad: number;
    costoUnitario: number;
    subtotal: number;
  }[]>([]);

  // Item selector helpers inside New Purchase
  const [selectedProdForLine, setSelectedProdForLine] = useState('');
  const [selectedVarForLine, setSelectedVarForLine] = useState('');
  const [lineCantidad, setLineCantidad] = useState<number | ''>(10);
  const [lineCosto, setLineCosto] = useState<number | ''>('');

  const handleOpenNewPurchase = () => {
    setFormProveedorId(suppliers[0]?.id || '');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormTasaImpuesto(settings.tasaImpuestoDefecto ?? 16);
    setFormNotas('');
    setFormItems([]);
    setSelectedProdForLine('');
    setSelectedVarForLine('');
    setLineCantidad(10);
    setLineCosto('');
    setIsNewPurchaseModalOpen(true);
  };

  const handleSelectProductForLine = (prodId: string) => {
    setSelectedProdForLine(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setLineCosto(prod.costoPromedio || 100);
      if (prod.tieneVariantes && prod.variantes && prod.variantes.length > 0) {
        setSelectedVarForLine(prod.variantes[0].id);
      } else {
        setSelectedVarForLine('');
      }
    }
  };

  const handleAddLineItem = () => {
    if (!selectedProdForLine || !lineCantidad || Number(lineCantidad) <= 0 || !lineCosto || Number(lineCosto) < 0) {
      return;
    }

    const prod = products.find(p => p.id === selectedProdForLine);
    if (!prod) return;

    let desc = prod.nombre;
    let varId: string | undefined = undefined;

    if (prod.tieneVariantes && prod.variantes) {
      const variant = prod.variantes.find(v => v.id === selectedVarForLine) || prod.variantes[0];
      if (variant) {
        varId = variant.id;
        desc = `${prod.nombre} (${variant.color} / Talla ${variant.talla})`;
      }
    }

    const qty = Number(lineCantidad);
    const cost = Number(lineCosto);
    const sub = qty * cost;

    setFormItems(prev => [
      ...prev,
      {
        productoId: prod.id,
        varianteId: varId,
        descripcion: desc,
        cantidad: qty,
        costoUnitario: cost,
        subtotal: sub
      }
    ]);

    // Reset line fields
    setSelectedProdForLine('');
    setSelectedVarForLine('');
    setLineCantidad(10);
    setLineCosto('');
  };

  const handleRemoveLineItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const formSubtotal = formItems.reduce((sum, item) => sum + item.subtotal, 0);
  const formImpuestos = Number((formSubtotal * ((formTasaImpuesto || 0) / 100)).toFixed(2));
  const formTotal = formSubtotal + formImpuestos;

  const handleSavePurchase = (directReceive = false) => {
    if (!formProveedorId || formItems.length === 0) return;

    createPurchase({
      proveedorId: formProveedorId,
      fecha: formFecha,
      estado: directReceive ? 'recibida' : 'borrador',
      items: formItems.map((item, idx) => ({
        ...item,
        id: `pdet-${Date.now()}-${idx + 1}`,
        compraId: ''
      })),
      subtotal: formSubtotal,
      impuestos: formImpuestos,
      total: formTotal,
      notas: formNotas
    });

    setIsNewPurchaseModalOpen(false);
  };

  // Payment Handler
  const handleOpenPayment = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setPaymentAmount(purchase.saldoPendiente);
    setPaymentMethod('transferencia');
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase || !paymentAmount || Number(paymentAmount) <= 0) return;

    addSupplierPayment({
      compraId: selectedPurchase.id,
      fecha: new Date().toISOString().split('T')[0],
      monto: Number(paymentAmount),
      metodoPago: paymentMethod,
      referencia: paymentRef || `PAGO-${Date.now().toString().slice(-4)}`,
      notas: paymentNotes
    });

    setIsPaymentModalOpen(false);
    setSelectedPurchase(null);
  };

  // Cancel Handler
  const handleOpenCancel = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase || !cancelReason.trim()) return;

    cancelPurchase(selectedPurchase.id, cancelReason.trim());
    setIsCancelModalOpen(false);
    setSelectedPurchase(null);
  };

  // Extract unique months for filter
  const availableMonths = Array.from(
    new Set(
      purchases
        .map(p => p.fecha ? p.fecha.substring(0, 7) : '')
        .filter(Boolean)
    )
  ).sort().reverse();

  // Filtered Purchases
  const filteredPurchases = purchases.filter(p => {
    const prov = suppliers.find(s => s.id === p.proveedorId);
    const matchesSearch = p.numeroCompra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prov?.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.estado === statusFilter;
    const matchesSupplier = selectedSupplierFilter === 'all' || p.proveedorId === selectedSupplierFilter;
    const matchesMonth = monthFilter === 'all' || (p.fecha && p.fecha.startsWith(monthFilter));

    return matchesSearch && matchesStatus && matchesSupplier && matchesMonth;
  });

  const selectedProdObj = products.find(p => p.id === selectedProdForLine);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Compras & Cuentas por Pagar (CxP)</h1>
          <p className="page-description">
            Órdenes de compra a proveedores, recepción de mercancía con entrada automática al Kardex y control de pagos.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewPurchase}>
            <Plus size={16} />
            + Nueva Orden de Compra
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por folio de compra o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Todos los meses</option>
            {availableMonths.map(mKey => (
              <option key={mKey} value={mKey}>
                {formatMonthLabel(mKey)}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="recibida">Recibida (En Almacén)</option>
            <option value="pagada">Pagada Totalmente</option>
            <option value="anulada">Anulada</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
          >
            <option value="all">Todos los proveedores</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          <ExcelExportButton
            filename={`Ordenes_de_Compra_${monthFilter}`}
            title="Exportar órdenes de compra a Excel"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio Compra</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th style={{ textAlign: 'center' }}>Ítems</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Saldo Pendiente (CxP)</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No se encontraron órdenes de compra registradas.
                </td>
              </tr>
            ) : (
              filteredPurchases.map(p => {
                const prov = suppliers.find(s => s.id === p.proveedorId);
                const hasPendingBalance = p.saldoPendiente > 0 && p.estado !== 'anulada';

                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {p.numeroCompra}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{prov?.nombre || 'Proveedor'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prov?.identificacionFiscal}</div>
                    </td>
                    <td>{formatDate(p.fecha)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral">{p.items.reduce((s, i) => s + i.cantidad, 0)} pzs</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(p.total)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: hasPendingBalance ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                      {p.estado === 'anulada' ? '-' : formatCurrency(p.saldoPendiente)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.estado === 'borrador' && <Badge variant="neutral">Borrador</Badge>}
                      {p.estado === 'recibida' && <Badge variant="warning">Recibida (Saldo Pendiente)</Badge>}
                      {p.estado === 'pagada' && <Badge variant="success">Pagada / Recibida</Badge>}
                      {p.estado === 'anulada' && <Badge variant="danger">Anulada</Badge>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        {p.estado === 'borrador' && (
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => receivePurchase(p.id)}
                            title="Recibir mercancía y cargar a Inventario"
                          >
                            <CheckCircle size={14} />
                            Recibir Mercancía
                          </button>
                        )}

                        {(p.estado === 'recibida' || (p.estado === 'borrador' && p.saldoPendiente > 0)) && p.saldoPendiente > 0 && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenPayment(p)}
                            title="Registrar pago a proveedor (CxP)"
                          >
                            <DollarSign size={14} />
                            Pagar
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => {
                            setSelectedPurchase(p);
                            setIsDetailModalOpen(true);
                          }}
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>

                        {p.estado !== 'anulada' && (
                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleOpenCancel(p)}
                            title="Anular compra (Nunca eliminar)"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Order Modal */}
      <Modal
        isOpen={isNewPurchaseModalOpen}
        onClose={() => setIsNewPurchaseModalOpen(false)}
        title="Crear Nueva Orden de Compra"
        subtitle="Registra productos y variantes para reabastecer el inventario"
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewPurchaseModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSavePurchase(false)}
              disabled={formItems.length === 0}
            >
              Guardar como Borrador
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSavePurchase(true)}
              disabled={formItems.length === 0}
            >
              <CheckCircle size={16} />
              Guardar y Recibir en Almacén
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header metadata */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">
                Proveedor *
              </label>
              <ComboboxInline
                options={suppliers.map(s => ({ id: s.id, label: s.nombre, sublabel: s.identificacionFiscal }))}
                value={formProveedorId}
                onChange={setFormProveedorId}
                placeholder="Seleccionar proveedor..."
                onOpenQuickCreateModal={() => setIsQuickSupplierOpen(true)}
                quickCreateLabel="+ Crear Nuevo Proveedor"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fecha de Compra</label>
              <input
                type="date"
                className="form-control"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
              />
            </div>
          </div>

          {/* Line Item Builder */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Agregar Producto a la Compra
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto</label>
                <ComboboxInline
                  options={products.map(p => ({
                    id: p.id,
                    label: p.nombre,
                    sublabel: `SKU: ${p.codigo} - Costo Prom: ${formatCurrency(p.costoPromedio)}`
                  }))}
                  value={selectedProdForLine}
                  onChange={handleSelectProductForLine}
                  placeholder="Seleccionar producto..."
                  onOpenQuickCreateModal={() => setIsQuickProductOpen(true)}
                  quickCreateLabel="+ Crear Nuevo Producto"
                />
              </div>

              {selectedProdObj && selectedProdObj.tieneVariantes && selectedProdObj.variantes ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Variante</label>
                  <select
                    className="form-select"
                    value={selectedVarForLine}
                    onChange={(e) => setSelectedVarForLine(e.target.value)}
                  >
                    {selectedProdObj.variantes.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.color} / Talla {v.talla} (Stock: {v.stockActual})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo</label>
                  <input type="text" className="form-control" value="Producto Simple" disabled />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  className="form-control"
                  value={lineCantidad}
                  onChange={(e) => setLineCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Costo Unit. ($)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={lineCosto}
                  onChange={(e) => setLineCosto(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  step="any"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ height: '38px' }}
                onClick={handleAddLineItem}
                disabled={!selectedProdForLine}
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Descripción del Producto / Variante</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Costo Unitario</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No has agregado ningún producto a la orden de compra todavía.
                    </td>
                  </tr>
                ) : (
                  formItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.costoUnitario)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)', border: 'none', background: 'none' }}
                          onClick={() => handleRemoveLineItem(idx)}
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

          {/* Totals & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div className="form-group">
              <label className="form-label">Notas u Observaciones de la Compra</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Condiciones de entrega, número de guía, lote de proveedor..."
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
              />
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(formSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  IVA (%):
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={formTasaImpuesto}
                    onChange={(e) => setFormTasaImpuesto(e.target.value === '' ? 0 : Number(e.target.value))}
                    style={{
                      width: '55px',
                      padding: '2px 4px',
                      fontSize: '0.8rem',
                      textAlign: 'right',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  %
                </span>
                <span>{formatCurrency(formImpuestos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', color: 'var(--color-accent)' }}>
                <span>Total de la Compra:</span>
                <span>{formatCurrency(formTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedPurchase && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detalle de Compra: ${selectedPurchase.numeroCompra}`}
          subtitle={`Proveedor: ${suppliers.find(s => s.id === selectedPurchase.proveedorId)?.nombre || '-'}`}
          size="lg"
          footer={
            <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
              Cerrar
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha:</div>
                <div style={{ fontWeight: 600 }}>{formatDate(selectedPurchase.fecha)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total:</div>
                <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatCurrency(selectedPurchase.total)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Pendiente:</div>
                <div style={{ fontWeight: 700, color: selectedPurchase.saldoPendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {formatCurrency(selectedPurchase.saldoPendiente)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado:</div>
                <div><Badge variant={selectedPurchase.estado === 'pagada' ? 'success' : selectedPurchase.estado === 'anulada' ? 'danger' : 'warning'}>{selectedPurchase.estado.toUpperCase()}</Badge></div>
              </div>
            </div>

            {selectedPurchase.anuladoMotivo && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>
                <strong>Compra Anulada el {formatDate(selectedPurchase.anuladoFecha)}:</strong> {selectedPurchase.anuladoMotivo}
              </div>
            )}

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ítem / Variante</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Costo Unitario</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.costoUnitario)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payments history */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Historial de Pagos y Abonos (CxP)
              </div>
              {selectedPurchase.pagos.length === 0 ? (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No hay pagos registrados para esta compra.</div>
              ) : (
                <table className="table" style={{ fontSize: '0.825rem' }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th style={{ textAlign: 'right' }}>Monto Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.pagos.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.fecha)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.metodoPago}</td>
                        <td>{p.referencia}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success-text)' }}>
                          {formatCurrency(p.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Register Payment Modal (CxP) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Pago a Proveedor (CxP)"
        subtitle={`Compra: ${selectedPurchase?.numeroCompra} — Saldo pendiente: ${formatCurrency(selectedPurchase?.saldoPendiente || 0)}`}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="cxp-payment-form" className="btn btn-primary">
              Registrar Abono
            </button>
          </>
        }
      >
        <form id="cxp-payment-form" onSubmit={handleSavePayment}>
          <div className="form-group">
            <label className="form-label">Monto a Pagar ($) *</label>
            <input
              type="number"
              className="form-control"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
              max={selectedPurchase?.saldoPendiente}
              min={0.01}
              step="any"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="transferencia">Transferencia Electrónica</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta Bancaria</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Número de Referencia / Folio</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. SPEI-8921"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas del Pago</label>
            <input
              type="text"
              className="form-control"
              placeholder="Detalle o comprobante..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Cancel Reason Modal (Inmutability audit) */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Anular Orden de Compra"
        subtitle={`Folio: ${selectedPurchase?.numeroCompra} — Trazabilidad Contable`}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCancelModalOpen(false)}>
              Regresar
            </button>
            <button type="submit" form="cancel-purchase-form" className="btn btn-danger">
              Confirmar Anulación
            </button>
          </>
        }
      >
        <form id="cancel-purchase-form" onSubmit={handleConfirmCancel}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Principio de Inmutabilidad</div>
            Este registro no será eliminado del sistema. Quedará marcado como <strong>ANULADO</strong> y se generarán los contra-movimientos de inventario correspondientes para revertir las existencias ingresadas.
          </div>

          <div className="form-group">
            <label className="form-label">
              Motivo Obligatorio de Anulación <span className="form-label-required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe detalladamente el motivo de la anulación (ej. Mercancía defectuosa devuelta, orden cancelada por proveedor...)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* Quick Create Modals */}
      <QuickCreateSupplierModal
        isOpen={isQuickSupplierOpen}
        onClose={() => setIsQuickSupplierOpen(false)}
        onSupplierCreated={(newId) => setFormProveedorId(newId)}
      />

      <QuickCreateProductModal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        onProductCreated={(newId) => handleSelectProductForLine(newId)}
      />
    </div>
  );
};
