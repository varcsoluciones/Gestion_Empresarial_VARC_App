import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { Invoice, Quote, PaymentMethod, PaymentTerm } from '../types/erp';
import { formatCurrency, formatDate, generateDocNumber } from '../utils/formatters';
import {
  TrendingUp,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Printer,
  DollarSign,
  Trash2,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { QuickCreateCustomerModal } from '../components/quick-create/QuickCreateCustomerModal';
import { QuickCreateProductModal } from '../components/quick-create/QuickCreateProductModal';
import { DocumentPrintView } from '../components/print/DocumentPrintView';

interface ConfirmIssueData {
  title: string;
  subtitle: string;
  docFolio: string;
  clientName: string;
  clientRFC: string;
  tipoPago: string;
  fechaEmision: string;
  totalPieces: number;
  totalItems: number;
  subtotal: number;
  impuestos: number;
  total: number;
  onConfirm: () => void;
}

export const SalesPage: React.FC = () => {
  const {
    invoices,
    quotes,
    clients,
    products,
    settings,
    createInvoice,
    issueInvoice,
    cancelInvoice,
    addClientPayment,
    createQuote,
    convertQuoteToInvoice
  } = useERP();

  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [confirmIssueData, setConfirmIssueData] = useState<ConfirmIssueData | null>(null);

  // Print view state
  const [printDoc, setPrintDoc] = useState<{ doc: Invoice | Quote; type: 'invoice' | 'quote' } | null>(null);

  // Payment (CxC) modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Cancel invoice modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Invoice / Quote Form Builder State
  const [formClienteId, setFormClienteId] = useState('');
  const [formFechaEmision, setFormFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('');
  const [formTipoPago, setFormTipoPago] = useState<PaymentTerm>('contado');
  const [formNotas, setFormNotas] = useState('');
  const [formItems, setFormItems] = useState<{
    productoId: string;
    varianteId?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
  }[]>([]);

  // Line item builder inputs
  const [selectedProdForLine, setSelectedProdForLine] = useState('');
  const [selectedVarForLine, setSelectedVarForLine] = useState('');
  const [lineCantidad, setLineCantidad] = useState<number | ''>(1);
  const [linePrecio, setLinePrecio] = useState<number | ''>('');
  const [lineDescuento, setLineDescuento] = useState<number | ''>(0);

  const handleOpenNewInvoice = () => {
    const defaultClient = clients[0];
    setFormClienteId(defaultClient?.id || '');
    setFormTipoPago(defaultClient?.tipoPago || 'contado');
    setFormFechaEmision(new Date().toISOString().split('T')[0]);
    const due = new Date(Date.now() + (defaultClient?.diasCredito || 0) * 86400000).toISOString().split('T')[0];
    setFormFechaVencimiento(due);
    setFormNotas('');
    setFormItems([]);
    setSelectedProdForLine('');
    setSelectedVarForLine('');
    setLineCantidad(1);
    setLinePrecio('');
    setLineDescuento(0);
    setIsNewInvoiceModalOpen(true);
  };

  const handleOpenNewQuote = () => {
    const defaultClient = clients[0];
    setFormClienteId(defaultClient?.id || '');
    setFormFechaEmision(new Date().toISOString().split('T')[0]);
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setFormFechaVencimiento(validUntil);
    setFormNotas('Cotización con vigencia de 30 días naturales.');
    setFormItems([]);
    setSelectedProdForLine('');
    setSelectedVarForLine('');
    setLineCantidad(1);
    setLinePrecio('');
    setLineDescuento(0);
    setIsNewQuoteModalOpen(true);
  };

  const handleSelectClient = (clientId: string) => {
    setFormClienteId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormTipoPago(client.tipoPago);
      const due = new Date(Date.now() + (client.diasCredito || 0) * 86400000).toISOString().split('T')[0];
      setFormFechaVencimiento(due);
    }
  };

  const handleSelectProductForLine = (prodId: string) => {
    setSelectedProdForLine(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setLinePrecio(prod.precioVenta);
      if (prod.tieneVariantes && prod.variantes && prod.variantes.length > 0) {
        setSelectedVarForLine(prod.variantes[0].id);
      } else {
        setSelectedVarForLine('');
      }
    }
  };

  const handleAddLineItem = () => {
    if (!selectedProdForLine || !lineCantidad || Number(lineCantidad) <= 0 || !linePrecio || Number(linePrecio) < 0) {
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
    const price = Number(linePrecio);
    const discPercent = Number(lineDescuento) || 0;
    const itemSub = (qty * price) * (1 - discPercent / 100);

    setFormItems(prev => [
      ...prev,
      {
        productoId: prod.id,
        varianteId: varId,
        descripcion: desc,
        cantidad: qty,
        precioUnitario: price,
        descuento: discPercent,
        subtotal: Number(itemSub.toFixed(2))
      }
    ]);

    setSelectedProdForLine('');
    setSelectedVarForLine('');
    setLineCantidad(1);
    setLinePrecio('');
    setLineDescuento(0);
  };

  const handleRemoveLineItem = (index: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  const formSubtotal = formItems.reduce((sum, item) => sum + item.subtotal, 0);
  const formImpuestos = Number((formSubtotal * (settings.tasaImpuestoDefecto / 100)).toFixed(2));
  const formTotal = formSubtotal + formImpuestos;

  const handleSaveDraftInvoice = () => {
    if (!formClienteId || formItems.length === 0) return;

    createInvoice({
      clienteId: formClienteId,
      fechaEmision: formFechaEmision,
      fechaVencimiento: formFechaVencimiento,
      tipoPago: formTipoPago,
      estado: 'borrador',
      items: formItems.map((item, idx) => ({
        ...item,
        id: `fitem-${Date.now()}-${idx + 1}`,
        facturaId: ''
      })),
      subtotal: formSubtotal,
      descuentoTotal: 0,
      tasaImpuesto: settings.tasaImpuestoDefecto,
      impuestos: formImpuestos,
      total: formTotal,
      notas: formNotas
    });

    setIsNewInvoiceModalOpen(false);
  };

  const handleRequestIssueNewInvoice = () => {
    if (!formClienteId || formItems.length === 0) return;
    const client = clients.find(c => c.id === formClienteId);
    const nextFolio = generateDocNumber('FAC', invoices.length);
    const totalPieces = formItems.reduce((sum, item) => sum + item.cantidad, 0);

    setConfirmIssueData({
      title: 'Confirmar Emisión de Factura',
      subtitle: 'Verifica los datos antes de emitir la factura formal y afectar existencias de inventario.',
      docFolio: nextFolio,
      clientName: client?.nombre || 'Cliente General',
      clientRFC: client?.identificacionFiscal || 'XAXX010101000',
      tipoPago: formTipoPago.toUpperCase(),
      fechaEmision: formFechaEmision,
      totalPieces,
      totalItems: formItems.length,
      subtotal: formSubtotal,
      impuestos: formImpuestos,
      total: formTotal,
      onConfirm: () => {
        const newInv = createInvoice({
          clienteId: formClienteId,
          fechaEmision: formFechaEmision,
          fechaVencimiento: formFechaVencimiento,
          tipoPago: formTipoPago,
          estado: 'emitida',
          items: formItems.map((item, idx) => ({
            ...item,
            id: `fitem-${Date.now()}-${idx + 1}`,
            facturaId: ''
          })),
          subtotal: formSubtotal,
          descuentoTotal: 0,
          tasaImpuesto: settings.tasaImpuestoDefecto,
          impuestos: formImpuestos,
          total: formTotal,
          notas: formNotas
        });
        setConfirmIssueData(null);
        setIsNewInvoiceModalOpen(false);
        setPrintDoc({ doc: newInv, type: 'invoice' });
      }
    });
  };

  const handleRequestIssueDraft = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clienteId);
    const totalPieces = inv.items.reduce((sum, item) => sum + item.cantidad, 0);

    setConfirmIssueData({
      title: 'Confirmar Emisión de Factura Borrador',
      subtitle: `Se emitirá la factura ${inv.numeroFactura} y se descontará el inventario correspondiente.`,
      docFolio: inv.numeroFactura,
      clientName: client?.nombre || 'Cliente General',
      clientRFC: client?.identificacionFiscal || 'N/A',
      tipoPago: inv.tipoPago.toUpperCase(),
      fechaEmision: inv.fechaEmision,
      totalPieces,
      totalItems: inv.items.length,
      subtotal: inv.subtotal,
      impuestos: inv.impuestos,
      total: inv.total,
      onConfirm: () => {
        issueInvoice(inv.id);
        setConfirmIssueData(null);
        setPrintDoc({
          doc: { ...inv, estado: inv.saldoPendiente <= 0 ? 'pagada' : 'emitida', emitidaFecha: new Date().toISOString() },
          type: 'invoice'
        });
      }
    });
  };

  const handleRequestConvertQuote = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clienteId);
    const totalPieces = quote.items.reduce((sum, item) => sum + item.cantidad, 0);

    setConfirmIssueData({
      title: 'Confirmar Conversión de Cotización a Factura',
      subtitle: `¿Deseas convertir la cotización ${quote.numeroCotizacion} en una Factura emitida y afectar stock?`,
      docFolio: 'Próximo Folio FAC',
      clientName: client?.nombre || 'Cliente',
      clientRFC: client?.identificacionFiscal || 'N/A',
      tipoPago: (client?.tipoPago || 'contado').toUpperCase(),
      fechaEmision: new Date().toISOString().split('T')[0],
      totalPieces,
      totalItems: quote.items.length,
      subtotal: quote.subtotal,
      impuestos: quote.impuestos,
      total: quote.total,
      onConfirm: () => {
        const inv = convertQuoteToInvoice(quote.id, true);
        setConfirmIssueData(null);
        setActiveTab('invoices');
        setPrintDoc({ doc: inv, type: 'invoice' });
      }
    });
  };

  const handleSaveQuote = () => {
    if (!formClienteId || formItems.length === 0) return;

    createQuote({
      clienteId: formClienteId,
      fechaEmision: formFechaEmision,
      fechaVencimiento: formFechaVencimiento,
      estado: 'pendiente',
      items: formItems.map((item, idx) => ({
        ...item,
        id: `qitem-${Date.now()}-${idx + 1}`
      })),
      subtotal: formSubtotal,
      descuentoTotal: 0,
      impuestos: formImpuestos,
      total: formTotal,
      notas: formNotas
    });

    setIsNewQuoteModalOpen(false);
  };

  // Payment handler (CxC)
  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.saldoPendiente);
    setPaymentMethod('transferencia');
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount || Number(paymentAmount) <= 0) return;

    addClientPayment({
      facturaId: selectedInvoice.id,
      fecha: new Date().toISOString().split('T')[0],
      monto: Number(paymentAmount),
      metodoPago: paymentMethod,
      referencia: paymentRef || `COBRO-${Date.now().toString().slice(-4)}`,
      notas: paymentNotes
    });

    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  // Cancel Invoice handler
  const handleOpenCancel = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !cancelReason.trim()) return;

    cancelInvoice(selectedInvoice.id, cancelReason.trim());
    setIsCancelModalOpen(false);
    setSelectedInvoice(null);
  };

  // Filtered queries
  const filteredInvoices = invoices.filter(inv => {
    const cli = clients.find(c => c.id === inv.clienteId);
    const matchesSearch = inv.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cli?.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inv.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredQuotes = quotes.filter(q => {
    const cli = clients.find(c => c.id === q.clienteId);
    const matchesSearch = q.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cli?.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || q.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedProdObj = products.find(p => p.id === selectedProdForLine);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas, Facturación & Cuentas por Cobrar (CxC)</h1>
          <p className="page-description">
            Cotizaciones convertibles en 1 clic, emisión de facturas con deducción de stock y control de cobranza.
          </p>
        </div>
        <div className="page-actions">
          {activeTab === 'invoices' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewInvoice}>
              <Plus size={16} />
              + Nueva Factura
            </button>
          )}
          {activeTab === 'quotes' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewQuote}>
              <Plus size={16} />
              + Nueva Cotización
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => { setActiveTab('invoices'); setSearchTerm(''); }}
        >
          <TrendingUp size={16} />
          Facturas de Venta ({invoices.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('quotes'); setSearchTerm(''); }}
        >
          <FileText size={16} />
          Cotizaciones ({quotes.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="form-control"
            placeholder={`Buscar por folio de ${activeTab === 'invoices' ? 'factura' : 'cotización'} o cliente...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {activeTab === 'invoices' ? (
            <>
              <option value="borrador">Borrador</option>
              <option value="emitida">Emitida (Pendiente de Pago)</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </>
          ) : (
            <>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada (Facturada)</option>
              <option value="vencida">Vencida</option>
              <option value="rechazada">Rechazada</option>
            </>
          )}
        </select>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Folio Factura</th>
                <th>Cliente</th>
                <th>Emisión / Vencimiento</th>
                <th style={{ textAlign: 'center' }}>Condición</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Saldo Pendiente (CxC)</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay facturas registradas con estos criterios.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const client = clients.find(c => c.id === inv.clienteId);
                  const hasPendingBalance = inv.saldoPendiente > 0 && inv.estado !== 'anulada';

                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {inv.numeroFactura}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{client?.nombre || 'Cliente General'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client?.identificacionFiscal}</div>
                      </td>
                      <td>
                        <div>{formatDate(inv.fechaEmision)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vence: {formatDate(inv.fechaVencimiento)}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={inv.tipoPago === 'credito' ? 'accent' : 'neutral'}>
                          {inv.tipoPago.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(inv.total)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: hasPendingBalance ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                        {inv.estado === 'anulada' ? '-' : formatCurrency(inv.saldoPendiente)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {inv.estado === 'pagada' && <Badge variant="success">Pagada</Badge>}
                        {inv.estado === 'emitida' && <Badge variant="info">Emitida</Badge>}
                        {inv.estado === 'borrador' && <Badge variant="neutral">Borrador</Badge>}
                        {inv.estado === 'anulada' && <Badge variant="danger">Anulada</Badge>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {inv.estado === 'borrador' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleRequestIssueDraft(inv)}
                              title="Emitir factura y descontar stock"
                            >
                              <CheckCircle size={14} />
                              Emitir
                            </button>
                          )}

                          {inv.estado === 'emitida' && inv.saldoPendiente > 0 && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleOpenPayment(inv)}
                              title="Registrar cobro de cliente (CxC)"
                            >
                              <DollarSign size={14} />
                              Cobrar
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            onClick={() => setPrintDoc({ doc: inv, type: 'invoice' })}
                            title="Imprimir o ver documento"
                          >
                            <Printer size={14} />
                          </button>

                          {inv.estado !== 'anulada' && (
                            <button
                              type="button"
                              className="btn-icon btn-sm"
                              style={{ color: 'var(--color-danger)' }}
                              onClick={() => handleOpenCancel(inv)}
                              title="Anular factura (Nunca eliminar)"
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
      )}

      {/* Tab 2: Quotes Table */}
      {activeTab === 'quotes' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Folio Cotización</th>
                <th>Cliente</th>
                <th>Fecha Emisión</th>
                <th>Vencimiento</th>
                <th style={{ textAlign: 'center' }}>Ítems</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay cotizaciones registradas.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(q => {
                  const client = clients.find(c => c.id === q.clienteId);

                  return (
                    <tr key={q.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {q.numeroCotizacion}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{client?.nombre || 'Cliente'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client?.identificacionFiscal}</div>
                      </td>
                      <td>{formatDate(q.fechaEmision)}</td>
                      <td>{formatDate(q.fechaVencimiento)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-neutral">{q.items.reduce((s, i) => s + i.cantidad, 0)} pzs</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(q.total)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {q.estado === 'aprobada' && <Badge variant="success">Facturada / Aprobada</Badge>}
                        {q.estado === 'pendiente' && <Badge variant="warning">Pendiente</Badge>}
                        {q.estado === 'vencida' && <Badge variant="danger">Vencida</Badge>}
                        {q.estado === 'rechazada' && <Badge variant="neutral">Rechazada</Badge>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {q.estado === 'pendiente' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleRequestConvertQuote(q)}
                              title="Convertir cotización en Factura con 1 clic"
                            >
                              <Sparkles size={14} />
                              Convertir en Factura
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            onClick={() => setPrintDoc({ doc: q, type: 'quote' })}
                            title="Imprimir o ver cotización"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Invoice Modal */}
      <Modal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        title="Crear Nueva Factura de Venta"
        subtitle="Agrega productos, define descuentos y emite la venta con descuento de existencias"
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewInvoiceModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraftInvoice}
              disabled={formItems.length === 0}
            >
              Guardar como Borrador
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRequestIssueNewInvoice}
              disabled={formItems.length === 0}
            >
              <CheckCircle size={16} />
              Guardar y Emitir Factura
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Cliente *</label>
              <ComboboxInline
                options={clients.map(c => ({ id: c.id, label: c.nombre, sublabel: `${c.identificacionFiscal} - ${c.tipoPago}` }))}
                value={formClienteId}
                onChange={handleSelectClient}
                placeholder="Seleccionar cliente..."
                onOpenQuickCreateModal={() => setIsQuickClientOpen(true)}
                quickCreateLabel="+ Crear Nuevo Cliente"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Condición de Pago</label>
              <select
                className="form-select"
                value={formTipoPago}
                onChange={(e) => setFormTipoPago(e.target.value as PaymentTerm)}
              >
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fecha de Emisión</label>
              <input
                type="date"
                className="form-control"
                value={formFechaEmision}
                onChange={(e) => setFormFechaEmision(e.target.value)}
              />
            </div>
          </div>

          {/* Line item builder */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Agregar Producto a la Factura
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto</label>
                <ComboboxInline
                  options={products.map(p => ({
                    id: p.id,
                    label: p.nombre,
                    sublabel: `Stock: ${p.stockActual} - P.Venta: ${formatCurrency(p.precioVenta)}`
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
                  <label className="form-label">Variante (Talla / Color)</label>
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
                <label className="form-label">Precio ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={linePrecio}
                  onChange={(e) => setLinePrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0.01}
                  step="any"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Desc. (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={lineDescuento}
                  onChange={(e) => setLineDescuento(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  max={100}
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
                  <th>Descripción</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                  <th style={{ textAlign: 'right' }}>Desc.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No has agregado productos a la factura.
                    </td>
                  </tr>
                ) : (
                  formItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.precioUnitario)}</td>
                      <td style={{ textAlign: 'right' }}>{item.descuento > 0 ? `${item.descuento}%` : '-'}</td>
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
              <label className="form-label">Notas al pie / Comentarios de Factura</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Observaciones para el cliente..."
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
              />
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(formSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>IVA ({settings.tasaImpuestoDefecto}%):</span>
                <span>{formatCurrency(formImpuestos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', color: 'var(--color-accent)' }}>
                <span>Total Factura:</span>
                <span>{formatCurrency(formTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* New Quote Modal */}
      <Modal
        isOpen={isNewQuoteModalOpen}
        onClose={() => setIsNewQuoteModalOpen(false)}
        title="Crear Nueva Cotización"
        subtitle="Genera una propuesta formal para el cliente. Podrás convertirla en factura en 1 clic."
        size="xl"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewQuoteModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveQuote}
              disabled={formItems.length === 0}
            >
              Guardar Cotización
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Cliente *</label>
              <ComboboxInline
                options={clients.map(c => ({ id: c.id, label: c.nombre, sublabel: c.identificacionFiscal }))}
                value={formClienteId}
                onChange={handleSelectClient}
                placeholder="Seleccionar cliente..."
                onOpenQuickCreateModal={() => setIsQuickClientOpen(true)}
                quickCreateLabel="+ Crear Nuevo Cliente"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Fecha Emisión</label>
              <input
                type="date"
                className="form-control"
                value={formFechaEmision}
                onChange={(e) => setFormFechaEmision(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Vigencia Hasta</label>
              <input
                type="date"
                className="form-control"
                value={formFechaVencimiento}
                onChange={(e) => setFormFechaVencimiento(e.target.value)}
              />
            </div>
          </div>

          {/* Line item builder */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Agregar Producto a la Cotización
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto</label>
                <ComboboxInline
                  options={products.map(p => ({
                    id: p.id,
                    label: p.nombre,
                    sublabel: `P.Venta: ${formatCurrency(p.precioVenta)}`
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
                  <label className="form-label">Variante (Talla / Color)</label>
                  <select
                    className="form-select"
                    value={selectedVarForLine}
                    onChange={(e) => setSelectedVarForLine(e.target.value)}
                  >
                    {selectedProdObj.variantes.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.color} / Talla {v.talla}
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
                <label className="form-label">Precio ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={linePrecio}
                  onChange={(e) => setLinePrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0.01}
                  step="any"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Desc. (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={lineDescuento}
                  onChange={(e) => setLineDescuento(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  max={100}
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
                  <th>Descripción</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                  <th style={{ textAlign: 'right' }}>Desc.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No has agregado productos a la cotización.
                    </td>
                  </tr>
                ) : (
                  formItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
                      <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.precioUnitario)}</td>
                      <td style={{ textAlign: 'right' }}>{item.descuento > 0 ? `${item.descuento}%` : '-'}</td>
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

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '280px', backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(formSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>IVA ({settings.tasaImpuestoDefecto}%):</span>
                <span>{formatCurrency(formImpuestos)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border-default)', paddingTop: '0.5rem', color: 'var(--color-accent)' }}>
                <span>Total Cotización:</span>
                <span>{formatCurrency(formTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Payment (CxC) Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Cobro de Cliente (CxC)"
        subtitle={`Factura: ${selectedInvoice?.numeroFactura} — Saldo pendiente: ${formatCurrency(selectedInvoice?.saldoPendiente || 0)}`}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="cxc-payment-form" className="btn btn-success">
              Registrar Cobro
            </button>
          </>
        }
      >
        <form id="cxc-payment-form" onSubmit={handleSavePayment}>
          <div className="form-group">
            <label className="form-label">Monto Cobrado ($) *</label>
            <input
              type="number"
              className="form-control"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
              max={selectedInvoice?.saldoPendiente}
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
              <label className="form-label">Número de Referencia / Autorización</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. SPEI-4481"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas del Cobro</label>
            <input
              type="text"
              className="form-control"
              placeholder="Detalle o banco emisor..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Cancel Invoice Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Anular Factura de Venta"
        subtitle={`Folio: ${selectedInvoice?.numeroFactura} — Auditoría de Inmutabilidad`}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCancelModalOpen(false)}>
              Regresar
            </button>
            <button type="submit" form="cancel-invoice-form" className="btn btn-danger">
              Confirmar Anulación
            </button>
          </>
        }
      >
        <form id="cancel-invoice-form" onSubmit={handleConfirmCancel}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-danger-text)', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Principio de Inmutabilidad Contable</div>
            Esta factura no se eliminará. Quedará marcada como <strong>ANULADA</strong> y se reingresarán automáticamente los productos al stock del almacén con sus movimientos de inventario de contrapartida.
          </div>

          <div className="form-group">
            <label className="form-label">
              Motivo Obligatorio de Anulación <span className="form-label-required">*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe el motivo de la anulación (ej. Error en datos de facturación del cliente, devolución de prenda, cancelación de pedido...)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal Before Emitting Invoice */}
      {confirmIssueData && (
        <Modal
          isOpen={!!confirmIssueData}
          onClose={() => setConfirmIssueData(null)}
          title={confirmIssueData.title}
          subtitle={confirmIssueData.subtitle}
          size="lg"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmIssueData(null)}
              >
                Regresar / Modificar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmIssueData.onConfirm}
              >
                <CheckCircle size={16} />
                Confirmar y Emitir Factura
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Impact notification alert */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--color-accent-subtle)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={20} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--color-accent)' }}>
                  Afectación Contable e Inventario en Tiempo Real
                </strong>
                Al confirmar la emisión, la factura quedará en estado <strong>EMITIDA</strong> de forma inmutable. Se descontarán automáticamente las existencias de cada variante en el Kardex y se ingresará a <strong>Cuentas por Cobrar (CxC)</strong>.
              </div>
            </div>

            {/* Document summary grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
              <div style={{
                padding: '1.15rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Datos del Documento y Cliente
                </div>
                <div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Folio a emitir:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                    {confirmIssueData.docFolio}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Cliente:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{confirmIssueData.clientName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RFC / ID: {confirmIssueData.clientRFC}</div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Condición:</div>
                    <Badge variant={confirmIssueData.tipoPago === 'CREDITO' ? 'accent' : 'neutral'}>
                      {confirmIssueData.tipoPago}
                    </Badge>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emisión:</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDate(confirmIssueData.fechaEmision)}</div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1.15rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Resumen Económico & Mercancía
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ítems / Variantes:</span>
                    <span style={{ fontWeight: 600 }}>{confirmIssueData.totalItems} ítems ({confirmIssueData.totalPieces} pzs)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(confirmIssueData.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>IVA ({settings.tasaImpuestoDefecto}%):</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(confirmIssueData.impuestos)}</span>
                  </div>
                </div>
                <div style={{
                  borderTop: '2px solid var(--border-default)',
                  paddingTop: '0.6rem',
                  marginTop: '0.6rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Total Factura:</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                    {formatCurrency(confirmIssueData.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Document Modal View */}
      {printDoc && (
        <DocumentPrintView
          document={printDoc.doc}
          type={printDoc.type}
          onClose={() => setPrintDoc(null)}
        />
      )}

      {/* Quick Modals */}
      <QuickCreateCustomerModal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        onCustomerCreated={(newId) => handleSelectClient(newId)}
      />

      <QuickCreateProductModal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        onProductCreated={(newId) => handleSelectProductForLine(newId)}
      />
    </div>
  );
};
