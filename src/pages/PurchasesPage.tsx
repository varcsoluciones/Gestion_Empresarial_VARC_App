import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import type { Purchase, PaymentMethod } from '../types/erp';
import { formatCurrency, formatDateTime, formatMonthLabel, getTodayLocalDateString, buildLocalDateISO, getNextDocNumber } from '../utils/formatters';
import {
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { QuickCreateSupplierModal } from '../components/quick-create/QuickCreateSupplierModal';
import { QuickCreateProductModal } from '../components/quick-create/QuickCreateProductModal';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { useTableSort } from '../hooks/useTableSort';

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

  const activeSuppliers = useMemo(() => suppliers.filter(s => s.activo !== false), [suppliers]);
  const activeProducts = useMemo(() => products.filter(p => p.activo !== false), [products]);

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Expandable payments breakdown state for Purchases (CxP)
  const [expandedPurchasePayments, setExpandedPurchasePayments] = useState<Record<string, boolean>>({});

  const toggleExpandPayments = (purchaseId: string) => {
    setExpandedPurchasePayments(prev => ({ ...prev, [purchaseId]: !prev[purchaseId] }));
  };

  // New Purchase Form State
  const [formProveedorId, setFormProveedorId] = useState('');
  const [formFecha, setFormFecha] = useState(getTodayLocalDateString());
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
    const defaultSupplier = activeSuppliers[0] || suppliers[0];
    setFormProveedorId(defaultSupplier?.id || '');
    setFormFecha(getTodayLocalDateString());
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
        const varLabel = [variant.talla, variant.color].filter(Boolean).join(' / ');
        desc = varLabel ? `${prod.nombre} (${varLabel})` : prod.nombre;
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

  // Costo unitario ingresado con IVA incluido: el total es la suma de líneas
  const formTotal = formItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxRate = Number(formTasaImpuesto) || 0;
  const formSubtotal = taxRate > 0 
    ? Number((formTotal / (1 + (taxRate / 100))).toFixed(2)) 
    : formTotal;
  const formImpuestos = Number((formTotal - formSubtotal).toFixed(2));

  const handleSavePurchase = (directReceive = false) => {
    if (isSubmitting || !formProveedorId || formItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const purchaseDate = buildLocalDateISO(formFecha);

      createPurchase({
        proveedorId: formProveedorId,
        fecha: purchaseDate,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment Handler
  const handleOpenPayment = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setPaymentAmount(purchase.saldoPendiente);
    setPaymentMethod('transferencia');
    const allPayments = purchases.flatMap(pur => pur.pagos || []);
    const nextPagoRef = getNextDocNumber('PA', allPayments);
    setPaymentRef(nextPagoRef);
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedPurchase || !paymentAmount || Number(paymentAmount) <= 0) return;
    setIsSubmitting(true);
    try {
      const allPayments = purchases.flatMap(pur => pur.pagos || []);
      addSupplierPayment({
        compraId: selectedPurchase.id,
        fecha: new Date().toISOString(),
        monto: Number(paymentAmount),
        metodoPago: paymentMethod,
        referencia: paymentRef?.trim() || getNextDocNumber('PA', allPayments),
        notas: paymentNotes
      });

      setIsPaymentModalOpen(false);
      setSelectedPurchase(null);
    } finally {
      setIsSubmitting(false);
    }
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

  const {
    sortedItems: sortedPurchases,
    sortKey,
    sortDirection,
    requestSort
  } = useTableSort(filteredPurchases, {
    defaultKey: 'fecha',
    defaultDirection: 'desc',
    defaultIsNumeric: true,
    customGetters: {
      proveedor: (p) => suppliers.find(s => s.id === p.proveedorId)?.nombre || '',
      itemsCount: (p) => p.items.reduce((s, i) => s + i.cantidad, 0),
    }
  });

  const filteredPurchasesTotals = React.useMemo(() => {
    const activePurchases = sortedPurchases.filter(p => p.estado !== 'anulada');
    const totalCompras = activePurchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalSaldoPendiente = activePurchases.reduce((sum, p) => sum + (p.saldoPendiente || 0), 0);
    const totalPagado = totalCompras - totalSaldoPendiente;
    const totalItems = activePurchases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.cantidad, 0), 0);
    return {
      totalCompras,
      totalSaldoPendiente,
      totalPagado,
      totalItems,
      count: activePurchases.length
    };
  }, [sortedPurchases]);

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
              { id: 'all', label: 'Todos los estados' },
              { id: 'borrador', label: 'Borrador' },
              { id: 'recibida', label: 'Recibida (En Almacén)' },
              { id: 'pagada', label: 'Pagada Totalmente' },
              { id: 'anulada', label: 'Anulada' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Todos los estados"
            hideSearch={true}
            buttonStyle={{ minWidth: '170px' }}
          />

          <ComboboxInline
            options={[
              { id: 'all', label: 'Todos los proveedores' },
              ...suppliers.map(s => ({
                id: s.id,
                label: s.nombre,
                sublabel: s.identificacionFiscal
              }))
            ]}
            value={selectedSupplierFilter}
            onChange={setSelectedSupplierFilter}
            placeholder="Todos los proveedores"
            searchPlaceholder="Buscar proveedor..."
            buttonStyle={{ minWidth: '200px' }}
          />

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
              <SortableTh
                sortKey="numeroCompra"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={false}
              >
                Folio Compra
              </SortableTh>
              <SortableTh
                sortKey="proveedor"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={false}
              >
                Proveedor
              </SortableTh>
              <SortableTh
                sortKey="fecha"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={true}
              >
                Fecha
              </SortableTh>
              <SortableTh
                sortKey="itemsCount"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={true}
                align="center"
              >
                Ítems
              </SortableTh>
              <SortableTh
                sortKey="total"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={true}
                align="right"
              >
                Total
              </SortableTh>
              <SortableTh
                sortKey="saldoPendiente"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={true}
                align="right"
              >
                Saldo Pendiente (CxP)
              </SortableTh>
              <SortableTh
                sortKey="estado"
                currentSortKey={sortKey}
                currentSortDirection={sortDirection}
                onSort={requestSort}
                isNumeric={false}
                align="center"
              >
                Estado
              </SortableTh>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedPurchases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No se encontraron órdenes de compra registradas.
                </td>
              </tr>
            ) : (
              sortedPurchases.map(p => {
                const prov = suppliers.find(s => s.id === p.proveedorId);
                const hasPendingBalance = p.saldoPendiente > 0 && p.estado !== 'anulada';
                const isExpanded = !!expandedPurchasePayments[p.id];

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      style={{
                        backgroundColor: hasPendingBalance ? 'var(--color-accent-subtle)' : undefined,
                        borderLeft: hasPendingBalance ? '3px solid var(--color-accent)' : '3px solid transparent'
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {p.numeroCompra}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prov?.nombre || 'Proveedor'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prov?.identificacionFiscal}</div>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{formatDateTime(p.fecha)}</td>
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
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Pagos / Abonos Toggle Button with Chevron */}
                          <button
                            type="button"
                            className={`btn ${isExpanded ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => toggleExpandPayments(p.id)}
                            title={isExpanded ? 'Ocultar historial de pagos' : 'Ver historial de pagos / abonos realizados'}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            <span>Pagos ({p.pagos?.length || 0})</span>
                          </button>

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

                    {/* Expandable Payments Breakdown Row */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                        <td colSpan={8} style={{ padding: '0.75rem 1.25rem', borderBottom: '2px solid var(--border-default)' }}>
                          <div style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-default)',
                            padding: '1rem',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <DollarSign size={17} style={{ color: 'var(--color-primary)' }} />
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  Historial de Pagos / Abonos Realizados (CxP) — Compra {p.numeroCompra}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({prov?.nombre})</span>
                              </div>

                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.8rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Total Factura: </span>
                                  <strong>{formatCurrency(p.total)}</strong>
                                </div>
                                <div style={{ fontSize: '0.8rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Total Pagado: </span>
                                  <strong style={{ color: 'var(--color-success-text)' }}>
                                    {formatCurrency(p.pagos?.reduce((s, pay) => s + pay.monto, 0) || 0)}
                                  </strong>
                                </div>
                                <div style={{ fontSize: '0.8rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Saldo Pendiente: </span>
                                  <strong style={{ color: p.saldoPendiente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                                    {formatCurrency(p.saldoPendiente)}
                                  </strong>
                                </div>

                                {(p.estado === 'recibida' || (p.estado === 'borrador' && p.saldoPendiente > 0)) && p.saldoPendiente > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleOpenPayment(p)}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  >
                                    <Plus size={13} />
                                    + Registrar Abono / Pago
                                  </button>
                                )}
                              </div>
                            </div>

                            {p.pagos && p.pagos.length > 0 ? (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>#</th>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>Fecha de Pago / Abono</th>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>Método de Pago</th>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>Referencia Bancaria / Folio</th>
                                      <th style={{ padding: '0.4rem 0.6rem' }}>Notas / Concepto</th>
                                      <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Monto Pagado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {p.pagos.map((pay, pIdx) => (
                                      <tr key={pay.id || pIdx} style={{ borderBottom: '1px solid var(--border-default)' }}>
                                        <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>{pIdx + 1}</td>
                                        <td style={{ padding: '0.4rem 0.6rem' }}>{formatDateTime(pay.fecha)}</td>
                                        <td style={{ padding: '0.4rem 0.6rem' }}>
                                          <Badge variant="neutral">
                                            {pay.metodoPago.toUpperCase()}
                                          </Badge>
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                          {pay.referencia || '-'}
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>
                                          {pay.notas || 'Pago / Abono a proveedor'}
                                        </td>
                                        <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-text, var(--color-accent))' }}>
                                          +{formatCurrency(pay.monto)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{
                                padding: '1rem',
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                backgroundColor: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                No hay pagos ni abonos registrados para esta orden de compra aún.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
          {sortedPurchases.length > 0 && (
            <tfoot style={{ borderTop: '2px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)', fontWeight: 700 }}>
              <tr>
                <td colSpan={3} style={{ padding: '0.85rem 0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>TOTAL FILTRADO:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                      {filteredPurchasesTotals.count} órdenes activas
                    </span>
                    {sortedPurchases.some(p => p.estado === 'anulada') && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        (excluye anuladas)
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '0.85rem 0.6rem', fontSize: '0.85rem' }}>
                  <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                    {filteredPurchasesTotals.totalItems} pzs
                  </span>
                </td>
                <td style={{ textAlign: 'right', padding: '0.85rem 0.6rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {formatCurrency(filteredPurchasesTotals.totalCompras)}
                </td>
                <td style={{ textAlign: 'right', padding: '0.85rem 0.6rem', color: filteredPurchasesTotals.totalSaldoPendiente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', fontSize: '0.95rem' }}>
                  {formatCurrency(filteredPurchasesTotals.totalSaldoPendiente)}
                </td>
                <td colSpan={2} style={{ textAlign: 'right', padding: '0.85rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total Pagado: <strong style={{ color: 'var(--color-success-text)' }}>{formatCurrency(filteredPurchasesTotals.totalPagado)}</strong>
                </td>
              </tr>
            </tfoot>
          )}
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewPurchaseModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSavePurchase(false)}
              disabled={isSubmitting || formItems.length === 0}
            >
              Guardar como Borrador
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSavePurchase(true)}
              disabled={isSubmitting || formItems.length === 0}
            >
              <CheckCircle size={16} />
              {isSubmitting ? 'Guardando...' : 'Guardar y Recibir en Almacén'}
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
                options={activeSuppliers.map(s => ({ id: s.id, label: s.nombre, sublabel: s.identificacionFiscal }))}
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
          <div className="item-builder-card">
            <div className="item-builder-header">
              <Plus size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Agregar Producto a la Compra</span>
            </div>

            {/* Row 1: Product & Variant Selection */}
            <div className="item-builder-row-products">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto *</label>
                <ComboboxInline
                  options={activeProducts.map(p => ({
                    id: p.id,
                    label: p.nombre,
                    sublabel: `SKU: ${p.codigo} - Costo Prom: ${formatCurrency(p.costoPromedio)}`
                  }))}
                  value={selectedProdForLine}
                  onChange={handleSelectProductForLine}
                  placeholder="Buscar o seleccionar producto..."
                  onOpenQuickCreateModal={() => setIsQuickProductOpen(true)}
                  quickCreateLabel="+ Crear Nuevo Producto"
                />
              </div>

              {selectedProdObj && selectedProdObj.tieneVariantes && selectedProdObj.variantes ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Variante *</label>
                  <ComboboxInline
                    options={selectedProdObj.variantes.map(v => ({
                      id: v.id,
                      label: [v.talla, v.color].filter(Boolean).join(' / ') || v.sku,
                      sublabel: `Stock: ${v.stockActual} | SKU: ${v.sku}`
                    }))}
                    value={selectedVarForLine}
                    onChange={setSelectedVarForLine}
                    hideSearch={true}
                    placeholder="Seleccionar variante..."
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tipo de Producto</label>
                  <input type="text" className="form-control" value="Producto Simple (Sin variantes)" disabled />
                </div>
              )}
            </div>

            {/* Row 2: Quantity, Cost, Line Subtotal, and Add Button */}
            <div className="item-builder-row-inputs-purchase">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  className="form-control"
                  value={lineCantidad}
                  onChange={(e) => setLineCantidad(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                  placeholder="1"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Costo Unit. (IVA incl.) ({settings.monedaSimbolo || '$'})</label>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total Línea (IVA incl.)</label>
                <div className="form-control" style={{ backgroundColor: 'var(--bg-surface)', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>
                  {formatCurrency((Number(lineCantidad) || 0) * (Number(lineCosto) || 0))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-add-item"
                  style={{ height: '38px', minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleAddLineItem}
                  disabled={!selectedProdForLine}
                >
                  <Plus size={16} />
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>SKU / Código</th>
                  <th>Descripción del Producto / Variante</th>
                  <th style={{ textAlign: 'center', width: '15%' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>Costo Unit. (IVA incl.)</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>Total Línea</th>
                  <th style={{ textAlign: 'center', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No has agregado ningún producto a la orden de compra todavía.
                    </td>
                  </tr>
                ) : (
                  formItems.map((item, idx) => {
                    const p = products.find(prod => prod.id === item.productoId);
                    const v = p?.variantes?.find(varItem => varItem.id === item.varianteId);
                    const sku = v?.sku || p?.codigo || '—';

                    return (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem' }}>{sku}</td>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="modal-totals-grid">
            <div className="form-group">
              <label className="form-label">Notas u Observaciones de la Compra</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Condiciones de entrega, folio de factura externa del proveedor, etc."
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
                <span>Total a Pagar:</span>
                <span>{formatCurrency(formTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalle de Compra: ${selectedPurchase?.numeroCompra}`}
        subtitle="Consulta de artículos, impuestos, estados y abonos realizados"
        size="lg"
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        {selectedPurchase && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header info */}
            <div className="grid-3" style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proveedor:</div>
                <div style={{ fontWeight: 700 }}>{suppliers.find(s => s.id === selectedPurchase.proveedorId)?.nombre || 'Proveedor'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{suppliers.find(s => s.id === selectedPurchase.proveedorId)?.identificacionFiscal}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fecha de Registro:</div>
                <div style={{ fontWeight: 600 }}>{formatDateTime(selectedPurchase.fecha)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado Actual:</div>
                <div style={{ marginTop: '0.2rem' }}>
                  {selectedPurchase.estado === 'borrador' && <Badge variant="neutral">Borrador</Badge>}
                  {selectedPurchase.estado === 'recibida' && <Badge variant="warning">Recibida (Saldo Pendiente)</Badge>}
                  {selectedPurchase.estado === 'pagada' && <Badge variant="success">Pagada / Recibida</Badge>}
                  {selectedPurchase.estado === 'anulada' && <Badge variant="danger">Anulada</Badge>}
                </div>
              </div>
            </div>

            {selectedPurchase.recibidaFecha && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-success-text)', fontSize: '0.825rem' }}>
                <span><strong>Ingreso a Almacén / Kardex:</strong> {formatDateTime(selectedPurchase.recibidaFecha)}</span>
              </div>
            )}

            {selectedPurchase.anuladoMotivo && (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>
                <strong>Compra Anulada el {formatDateTime(selectedPurchase.anuladoFecha)}:</strong> {selectedPurchase.anuladoMotivo}
              </div>
            )}

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>SKU / Código</th>
                    <th>Ítem / Variante</th>
                    <th style={{ textAlign: 'center' }}>Cantidad</th>
                    <th style={{ textAlign: 'right' }}>Costo Unit. (IVA incl.)</th>
                    <th style={{ textAlign: 'right' }}>Total Línea</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items.map(item => {
                    const p = products.find(prod => prod.id === item.productoId);
                    const v = p?.variantes?.find(varItem => varItem.id === item.varianteId);
                    const sku = v?.sku || p?.codigo || '—';

                    return (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem' }}>{sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.costoUnitario)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown in Detail Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ minWidth: '240px', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal (Base sin IVA):</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPurchase.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>IVA al proveedor:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedPurchase.impuestos)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, borderTop: '1px solid var(--border-default)', paddingTop: '0.35rem', color: 'var(--color-accent)' }}>
                  <span>Total Factura:</span>
                  <span>{formatCurrency(selectedPurchase.total)}</span>
                </div>
              </div>
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
                      <th>Fecha / Hora</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th style={{ textAlign: 'right' }}>Monto Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.pagos.map(p => (
                      <tr key={p.id}>
                        <td>{formatDateTime(p.fecha)}</td>
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
        )}
      </Modal>

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
            <label className="form-label">Monto a Pagar ({settings.monedaSimbolo || '$'}) *</label>
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
              <ComboboxInline
                options={[
                  { id: 'transferencia', label: 'Transferencia Electrónica' },
                  { id: 'efectivo', label: 'Efectivo' },
                  { id: 'tarjeta', label: 'Tarjeta Bancaria' },
                  { id: 'cheque', label: 'Cheque' },
                ]}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                placeholder="Seleccionar método..."
                hideSearch={true}
                buttonStyle={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Número de Referencia / Comprobante</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. PA0001, SPEI-8921..."
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Si se deja vacío, el sistema asignará automáticamente el folio correlativo (PA0001).
              </span>
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
