import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import type { Invoice, Quote, PaymentMethod, PaymentTerm } from '../types/erp';
import { formatCurrency, formatDate, formatDateTime, generateDocNumber, getNextDocNumber, formatMonthLabel, getTodayLocalDateString, getFutureLocalDateString, buildLocalDateISO, getInvoiceDiscountTotal } from '../utils/formatters';
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
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  Truck
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { QuickCreateCustomerModal } from '../components/quick-create/QuickCreateCustomerModal';
import { QuickCreateProductModal } from '../components/quick-create/QuickCreateProductModal';
import { DocumentPrintView } from '../components/print/DocumentPrintView';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { useTableSort } from '../hooks/useTableSort';

interface DeficitItem {
  code: string;
  nombre: string;
  solicitado: number;
  disponible: number;
  faltante: number;
}

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
  tasaImpuesto?: number;
  impuestos: number;
  costoTransporte?: number;
  tipoTransporte?: string;
  total: number;
  deficitItems?: DeficitItem[];
  onConfirm: () => void;
}

interface SalesPageProps {
  initialTab?: 'invoices' | 'quotes';
}

export const SalesPage: React.FC<SalesPageProps> = ({ initialTab }) => {
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
    convertQuoteToInvoice,
    validateOperationDate
  } = useERP();

  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes'>(initialTab || 'invoices');

  // Date restriction modal state
  const [dateWarningData, setDateWarningData] = useState<{
    isOpen: boolean;
    message: string;
    riskWarning?: string;
    isBlocked: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: '',
    isBlocked: false
  });

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [expandedInvoicePayments, setExpandedInvoicePayments] = useState<Record<string, boolean>>({});

  // Active entities filters for modal selectors
  const activeClients = useMemo(() => clients.filter(c => c.activo !== false), [clients]);
  const activeProducts = useMemo(() => products.filter(p => p.activo !== false), [products]);

  // Form submitting protection
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [formFechaEmision, setFormFechaEmision] = useState(getTodayLocalDateString());
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('');
  const [formTipoPago, setFormTipoPago] = useState<PaymentTerm>('contado');
  const [formTasaImpuesto, setFormTasaImpuesto] = useState<number>(settings.tasaImpuestoDefecto ?? 16);
  const [formNotas, setFormNotas] = useState('');
  const [formTipoTransporte, setFormTipoTransporte] = useState<'sin_transporte' | 'dentro_gam' | 'fuera_gam'>('sin_transporte');
  const [formCostoTransporte, setFormCostoTransporte] = useState<number>(0);
  const [formItems, setFormItems] = useState<{
    productoId: string;
    varianteId?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    subtotal: number;
  }[]>([]);

  const handleSelectTipoTransporte = (tipo: 'sin_transporte' | 'dentro_gam' | 'fuera_gam') => {
    setFormTipoTransporte(tipo);
    if (tipo === 'sin_transporte') {
      setFormCostoTransporte(0);
    } else if (tipo === 'dentro_gam') {
      setFormCostoTransporte(3000);
    } else if (tipo === 'fuera_gam') {
      setFormCostoTransporte(5000);
    }
  };

  // Line item builder inputs
  const [selectedProdForLine, setSelectedProdForLine] = useState('');
  const [selectedVarForLine, setSelectedVarForLine] = useState('');
  const [lineCantidad, setLineCantidad] = useState<number | ''>(1);
  const [linePrecio, setLinePrecio] = useState<number | ''>('');
  const [lineDescuento, setLineDescuento] = useState<number | ''>(0);

  const toggleExpandPayments = (invId: string) => {
    setExpandedInvoicePayments(prev => ({ ...prev, [invId]: !prev[invId] }));
  };

  const checkStockDeficits = (items: { productoId: string; varianteId?: string; cantidad: number; descripcion: string }[]): DeficitItem[] => {
    return items.map(item => {
      const prod = products.find(p => p.id === item.productoId);
      const variant = prod?.variantes?.find(v => v.id === item.varianteId);
      const curStock = prod?.tieneVariantes ? (variant?.stockActual ?? 0) : (prod?.stockActual ?? 0);
      const code = variant?.sku || prod?.codigo || 'SKU';
      const missing = item.cantidad - curStock;
      return {
        code,
        nombre: item.descripcion,
        solicitado: item.cantidad,
        disponible: curStock,
        faltante: missing
      };
    }).filter(x => x.faltante > 0);
  };

  const handleOpenNewInvoice = () => {
    const defaultClient = activeClients[0] || clients[0];
    setFormClienteId(defaultClient?.id || '');
    setFormTipoPago(defaultClient?.tipoPago || 'contado');
    setFormFechaEmision(getTodayLocalDateString());
    const due = getFutureLocalDateString(defaultClient?.diasCredito || 0);
    setFormFechaVencimiento(due);
    setFormTasaImpuesto(settings.tasaImpuestoDefecto ?? 16);
    setFormNotas('');
    setFormTipoTransporte('sin_transporte');
    setFormCostoTransporte(0);
    setFormItems([]);
    setSelectedProdForLine('');
    setSelectedVarForLine('');
    setLineCantidad(1);
    setLinePrecio('');
    setLineDescuento(0);
    setIsNewInvoiceModalOpen(true);
  };

  const handleOpenNewQuote = () => {
    const defaultClient = activeClients[0] || clients[0];
    setFormClienteId(defaultClient?.id || '');
    setFormFechaEmision(getTodayLocalDateString());
    const validUntil = getFutureLocalDateString(30);
    setFormFechaVencimiento(validUntil);
    setFormTasaImpuesto(settings.tasaImpuestoDefecto ?? 16);
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
      const due = getFutureLocalDateString(client.diasCredito || 0);
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
        const varLabel = [variant.talla, variant.color].filter(Boolean).join(' / ');
        desc = varLabel ? `${prod.nombre} (${varLabel})` : prod.nombre;
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

  const formGrossSubtotal = Number(
    formItems.reduce((sum, item) => sum + (Number(item.cantidad || 0) * Number(item.precioUnitario || 0)), 0).toFixed(2)
  );
  const formDescuentoTotal = Number(
    formItems.reduce((sum, item) => {
      const qty = Number(item.cantidad) || 0;
      const price = Number(item.precioUnitario) || 0;
      const disc = Number(item.descuento) || 0;
      return sum + (qty * price * (disc / 100));
    }, 0).toFixed(2)
  );
  const formSubtotal = formItems.reduce((sum, item) => sum + item.subtotal, 0);
  const formImpuestos = Number((formSubtotal * ((formTasaImpuesto || 0) / 100)).toFixed(2));
  const formTransporte = Number(formCostoTransporte) || 0;
  const formTotal = Number((formSubtotal + formImpuestos + formTransporte).toFixed(2));

  const executeSaveDraftInvoice = () => {
    if (isSubmitting || !formClienteId || formItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const emissionDate = buildLocalDateISO(formFechaEmision);

      createInvoice({
        clienteId: formClienteId,
        fechaEmision: emissionDate,
        fechaVencimiento: formFechaVencimiento,
        tipoPago: formTipoPago,
        estado: 'borrador',
        items: formItems.map((item, idx) => ({
          ...item,
          id: `fitem-${Date.now()}-${idx + 1}`,
          facturaId: ''
        })),
        subtotal: formSubtotal,
        descuentoTotal: formDescuentoTotal,
        tasaImpuesto: formTasaImpuesto,
        impuestos: formImpuestos,
        tipoTransporte: formTipoTransporte,
        costoTransporte: formTransporte,
        total: formTotal,
        notas: formNotas
      });

      setIsNewInvoiceModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraftInvoice = () => {
    if (isSubmitting || !formClienteId || formItems.length === 0) return;

    const dateCheck = validateOperationDate(formFechaEmision);
    if (dateCheck.status === 'blocked') {
      setDateWarningData({
        isOpen: true,
        message: dateCheck.message || 'La fecha de emisión no está permitida por restricciones del sistema.',
        isBlocked: true
      });
      return;
    }

    if (dateCheck.status === 'warning') {
      setDateWarningData({
        isOpen: true,
        message: dateCheck.message || 'Advertencia sobre la fecha de emisión seleccionada.',
        riskWarning: dateCheck.riskWarning,
        isBlocked: false,
        onConfirm: () => {
          executeSaveDraftInvoice();
          setDateWarningData({ isOpen: false, message: '', isBlocked: false });
        }
      });
      return;
    }

    executeSaveDraftInvoice();
  };

  const executeRequestIssueNewInvoice = () => {
    if (!formClienteId || formItems.length === 0) return;
    const client = clients.find(c => c.id === formClienteId);
    const nextFolio = generateDocNumber('FA', invoices.length);
    const totalPieces = formItems.reduce((sum, item) => sum + item.cantidad, 0);
    const deficits = checkStockDeficits(formItems);
    const emissionDate = buildLocalDateISO(formFechaEmision);

    setConfirmIssueData({
      title: 'Confirmar Emisión de Factura',
      subtitle: 'Verifica los datos antes de emitir la factura formal y afectar existencias de inventario.',
      docFolio: nextFolio,
      clientName: client?.nombre || 'Cliente General',
      clientRFC: client?.identificacionFiscal || 'XAXX010101000',
      tipoPago: formTipoPago.toUpperCase(),
      fechaEmision: emissionDate,
      totalPieces,
      totalItems: formItems.length,
      subtotal: formSubtotal,
      tasaImpuesto: formTasaImpuesto,
      impuestos: formImpuestos,
      costoTransporte: formTransporte,
      tipoTransporte: formTipoTransporte,
      total: formTotal,
      deficitItems: deficits,
      onConfirm: () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
          const newInv = createInvoice({
            clienteId: formClienteId,
            fechaEmision: emissionDate,
            fechaVencimiento: formFechaVencimiento,
            tipoPago: formTipoPago,
            estado: 'emitida',
            items: formItems.map((item, idx) => ({
              ...item,
              id: `fitem-${Date.now()}-${idx + 1}`,
              facturaId: ''
            })),
            subtotal: formSubtotal,
            descuentoTotal: formDescuentoTotal,
            tasaImpuesto: formTasaImpuesto,
            impuestos: formImpuestos,
            tipoTransporte: formTipoTransporte,
            costoTransporte: formTransporte,
            total: formTotal,
            notas: formNotas
          });
          setConfirmIssueData(null);
          setIsNewInvoiceModalOpen(false);
          setPrintDoc({ doc: newInv, type: 'invoice' });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleRequestIssueNewInvoice = () => {
    if (!formClienteId || formItems.length === 0) return;

    const dateCheck = validateOperationDate(formFechaEmision);
    if (dateCheck.status === 'blocked') {
      setDateWarningData({
        isOpen: true,
        message: dateCheck.message || 'La fecha de emisión no está permitida por restricciones del sistema.',
        isBlocked: true
      });
      return;
    }

    if (dateCheck.status === 'warning') {
      setDateWarningData({
        isOpen: true,
        message: dateCheck.message || 'Advertencia sobre la fecha de emisión seleccionada.',
        riskWarning: dateCheck.riskWarning,
        isBlocked: false,
        onConfirm: () => {
          executeRequestIssueNewInvoice();
          setDateWarningData({ isOpen: false, message: '', isBlocked: false });
        }
      });
      return;
    }

    executeRequestIssueNewInvoice();
  };

  const handleRequestIssueDraft = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clienteId);
    const totalPieces = inv.items.reduce((sum, item) => sum + item.cantidad, 0);
    const deficits = checkStockDeficits(inv.items);

    setConfirmIssueData({
      title: 'Confirmar Emisión de Factura Borrador',
      subtitle: `¿Deseas emitir formalmente la factura borrador ${inv.numeroFactura} y descontar el inventario?`,
      docFolio: inv.numeroFactura,
      clientName: client?.nombre || 'Cliente General',
      clientRFC: client?.identificacionFiscal || 'XAXX010101000',
      tipoPago: inv.tipoPago.toUpperCase(),
      fechaEmision: inv.fechaEmision,
      totalPieces,
      totalItems: inv.items.length,
      subtotal: inv.subtotal,
      tasaImpuesto: inv.tasaImpuesto,
      impuestos: inv.impuestos,
      costoTransporte: inv.costoTransporte,
      tipoTransporte: inv.tipoTransporte,
      total: inv.total,
      deficitItems: deficits,
      onConfirm: () => {
        issueInvoice(inv.id);
        setConfirmIssueData(null);
        setPrintDoc({ doc: inv, type: 'invoice' });
      }
    });
  };

  const handleRequestConvertQuote = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clienteId);
    const totalPieces = quote.items.reduce((sum, item) => sum + item.cantidad, 0);
    const deficits = checkStockDeficits(quote.items);
    const nowIso = buildLocalDateISO();

    setConfirmIssueData({
      title: 'Confirmar Conversión de Cotización a Factura',
      subtitle: `¿Deseas convertir la cotización ${quote.numeroCotizacion} en una Factura emitida y afectar stock?`,
      docFolio: generateDocNumber('FA', invoices.length),
      clientName: client?.nombre || 'Cliente',
      clientRFC: client?.identificacionFiscal || 'N/A',
      tipoPago: (client?.tipoPago || 'contado').toUpperCase(),
      fechaEmision: nowIso,
      totalPieces,
      totalItems: quote.items.length,
      subtotal: quote.subtotal,
      impuestos: quote.impuestos,
      total: quote.total,
      deficitItems: deficits,
      onConfirm: () => {
        const inv = convertQuoteToInvoice(quote.id, true);
        setConfirmIssueData(null);
        setActiveTab('invoices');
        setPrintDoc({ doc: inv, type: 'invoice' });
      }
    });
  };

  const executeSaveQuote = () => {
    if (isSubmitting || !formClienteId || formItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const emissionDate = buildLocalDateISO(formFechaEmision);

      createQuote({
        clienteId: formClienteId,
        fechaEmision: emissionDate,
        fechaVencimiento: formFechaVencimiento,
        estado: 'pendiente',
        items: formItems.map((item, idx) => ({
          ...item,
          id: `qitem-${Date.now()}-${idx + 1}`
        })),
        subtotal: formSubtotal,
        descuentoTotal: formDescuentoTotal,
        tasaImpuesto: formTasaImpuesto,
        impuestos: formImpuestos,
        total: formTotal,
        notas: formNotas
      });

      setIsNewQuoteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuote = () => {
    if (isSubmitting || !formClienteId || formItems.length === 0) return;

    const dateCheck = validateOperationDate(formFechaEmision);
    if (dateCheck.status === 'blocked') {
      setDateWarningData({
        isOpen: true,
        message: dateCheck.message || 'La fecha de cotización no está permitida por restricciones del sistema.',
        isBlocked: true
      });
      return;
    }

    if (dateCheck.status === 'warning') {
      setDateWarningData({
        isOpen: true,
        message: dateCheck.message || 'Advertencia sobre la fecha de cotización seleccionada.',
        riskWarning: dateCheck.riskWarning,
        isBlocked: false,
        onConfirm: () => {
          executeSaveQuote();
          setDateWarningData({ isOpen: false, message: '', isBlocked: false });
        }
      });
      return;
    }

    executeSaveQuote();
  };

  // Payment handler (CxC)
  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.saldoPendiente);
    setPaymentMethod('transferencia');
    const allPayments = invoices.flatMap(inv => inv.pagos || []);
    const nextCobroRef = getNextDocNumber('CB', allPayments);
    setPaymentRef(nextCobroRef);
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedInvoice || !paymentAmount || Number(paymentAmount) <= 0) return;
    setIsSubmitting(true);
    try {
      const allPayments = invoices.flatMap(inv => inv.pagos || []);
      addClientPayment({
        facturaId: selectedInvoice.id,
        fecha: new Date().toISOString(),
        monto: Number(paymentAmount),
        metodoPago: paymentMethod,
        referencia: paymentRef?.trim() || getNextDocNumber('CB', allPayments),
        notas: paymentNotes
      });

      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
    } finally {
      setIsSubmitting(false);
    }
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

  // Available months calculation
  const availableInvoiceMonths = Array.from(
    new Set(invoices.map(i => i.fechaEmision?.slice(0, 7)).filter(Boolean))
  ).sort().reverse();

  const availableQuoteMonths = Array.from(
    new Set(quotes.map(q => q.fechaEmision?.slice(0, 7)).filter(Boolean))
  ).sort().reverse();

  // Filtered queries
  const filteredInvoices = invoices.filter(inv => {
    const cli = clients.find(c => c.id === inv.clienteId);
    const matchesSearch = inv.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cli?.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inv.estado === statusFilter;
    const matchesMonth = monthFilter === 'all' || (inv.fechaEmision && inv.fechaEmision.startsWith(monthFilter));
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const {
    sortedItems: sortedInvoices,
    sortKey: invSortKey,
    sortDirection: invSortDirection,
    requestSort: requestInvSort
  } = useTableSort(filteredInvoices, {
    defaultKey: 'fechaEmision',
    defaultDirection: 'desc',
    defaultIsNumeric: true,
    customGetters: {
      cliente: (inv) => clients.find(c => c.id === inv.clienteId)?.nombre || '',
    }
  });

  const filteredInvoicesTotals = useMemo(() => {
    const activeInvoices = sortedInvoices.filter(i => i.estado !== 'anulada');
    const totalFacturado = activeInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalSaldoPendiente = activeInvoices.reduce((sum, inv) => sum + (inv.saldoPendiente || 0), 0);
    const totalCobrado = totalFacturado - totalSaldoPendiente;
    const countAnuladas = sortedInvoices.filter(i => i.estado === 'anulada').length;

    return {
      totalFacturado,
      totalSaldoPendiente,
      totalCobrado,
      activeCount: activeInvoices.length,
      anuladasCount: countAnuladas,
      totalCount: sortedInvoices.length
    };
  }, [sortedInvoices]);

  const filteredQuotes = quotes.filter(q => {
    const cli = clients.find(c => c.id === q.clienteId);
    const matchesSearch = q.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cli?.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || q.estado === statusFilter;
    const matchesMonth = monthFilter === 'all' || (q.fechaEmision && q.fechaEmision.startsWith(monthFilter));
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const {
    sortedItems: sortedQuotes,
    sortKey: quoteSortKey,
    sortDirection: quoteSortDirection,
    requestSort: requestQuoteSort
  } = useTableSort(filteredQuotes, {
    defaultKey: 'fechaEmision',
    defaultDirection: 'desc',
    defaultIsNumeric: true,
    customGetters: {
      cliente: (q) => clients.find(c => c.id === q.clienteId)?.nombre || '',
      itemsCount: (q) => q.items.reduce((s, i) => s + i.cantidad, 0),
    }
  });

  const selectedProdObj = products.find(p => p.id === selectedProdForLine);
  const selectedVarObj = selectedProdObj?.variantes?.find(v => v.id === selectedVarForLine) || (selectedProdObj?.tieneVariantes ? selectedProdObj.variantes?.[0] : undefined);
  const currentLineStock = selectedProdObj ? (selectedProdObj.tieneVariantes ? (selectedVarObj?.stockActual ?? 0) : selectedProdObj.stockActual) : 0;
  const currentLineQty = typeof lineCantidad === 'number' ? lineCantidad : 0;
  const projectedLineStock = currentLineStock - currentLineQty;

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
          <span>Facturas de Venta</span>
          <span className="tab-badge">{invoices.length}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('quotes'); setSearchTerm(''); }}
        >
          <FileText size={16} />
          <span>Cotizaciones</span>
          <span className="tab-badge">{quotes.length}</span>
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

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <ComboboxInline
            options={[
              { id: 'all', label: 'Todos los meses' },
              ...(activeTab === 'invoices' ? availableInvoiceMonths : availableQuoteMonths).map(m => ({
                id: m,
                label: formatMonthLabel(m)
              }))
            ]}
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Todos los meses"
            hideSearch={true}
            buttonStyle={{ minWidth: '160px' }}
          />

          <ComboboxInline
            options={activeTab === 'invoices' ? [
              { id: 'all', label: 'Todos los estados' },
              { id: 'borrador', label: 'Borrador' },
              { id: 'emitida', label: 'Emitida (Pendiente de Pago)' },
              { id: 'pagada', label: 'Pagada' },
              { id: 'anulada', label: 'Anulada' }
            ] : [
              { id: 'all', label: 'Todos los estados' },
              { id: 'pendiente', label: 'Pendiente' },
              { id: 'aprobada', label: 'Facturada / Aprobada' },
              { id: 'vencida', label: 'Vencida' },
              { id: 'rechazada', label: 'Rechazada' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Todos los estados"
            hideSearch={true}
            buttonStyle={{ minWidth: '180px' }}
          />

          <ExcelExportButton
            filename={activeTab === 'invoices' ? `Facturas_de_Venta_${monthFilter}` : `Cotizaciones_de_Venta_${monthFilter}`}
            title={`Exportar ${activeTab === 'invoices' ? 'facturas' : 'cotizaciones'} a Excel`}
          />
        </div>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <SortableTh
                  sortKey="numeroFactura"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={false}
                >
                  Folio Factura
                </SortableTh>
                <SortableTh
                  sortKey="cliente"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={false}
                >
                  Cliente
                </SortableTh>
                <SortableTh
                  sortKey="fechaEmision"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={true}
                >
                  Emisión / Vencimiento
                </SortableTh>
                <SortableTh
                  sortKey="tipoPago"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={false}
                  align="center"
                >
                  Condición
                </SortableTh>
                <SortableTh
                  sortKey="total"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={true}
                  align="right"
                >
                  Total
                </SortableTh>
                <SortableTh
                  sortKey="saldoPendiente"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={true}
                  align="right"
                >
                  Saldo Pendiente (CxC)
                </SortableTh>
                <SortableTh
                  sortKey="estado"
                  currentSortKey={invSortKey}
                  currentSortDirection={invSortDirection}
                  onSort={requestInvSort}
                  isNumeric={false}
                  align="center"
                >
                  Estado
                </SortableTh>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay facturas registradas con estos criterios.
                  </td>
                </tr>
              ) : (
                sortedInvoices.map(inv => {
                  const client = clients.find(c => c.id === inv.clienteId);
                  const hasPendingBalance = inv.saldoPendiente > 0 && inv.estado !== 'anulada';
                  const isExpanded = !!expandedInvoicePayments[inv.id];

                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        style={{
                          backgroundColor: hasPendingBalance ? 'var(--color-accent-subtle)' : undefined,
                          borderLeft: hasPendingBalance ? '3px solid var(--color-accent)' : '3px solid transparent'
                        }}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {inv.numeroFactura}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{client?.nombre || 'Cliente General'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client?.identificacionFiscal}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatDateTime(inv.fechaEmision)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vence: {formatDate(inv.fechaVencimiento)}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={inv.tipoPago === 'credito' ? 'accent' : 'neutral'}>
                            {inv.tipoPago.toUpperCase()}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <div>{formatCurrency(inv.total)}</div>
                          {getInvoiceDiscountTotal(inv) > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-danger-text)', fontWeight: 500 }}>
                              -{formatCurrency(getInvoiceDiscountTotal(inv))} desc
                            </div>
                          )}
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
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Abonos Toggle Button with Chevron */}
                            <button
                              type="button"
                              className={`btn ${isExpanded ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                              onClick={() => toggleExpandPayments(inv.id)}
                              title={isExpanded ? 'Ocultar historial de abonos' : 'Ver historial de abonos / pagos recibidos'}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              <span>Abonos ({inv.pagos?.length || 0})</span>
                            </button>

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

                      {/* Expanded Sub-Row: Payment History */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <td colSpan={8} style={{ padding: '0.85rem 1.25rem', borderBottom: '2px solid var(--border-default)' }}>
                            <div style={{
                              padding: '1rem 1.25rem',
                              borderRadius: 'var(--radius-lg)',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-default)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <DollarSign size={17} style={{ color: 'var(--color-success)' }} />
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                    Historial de Abonos Recibidos (CxC) — Factura {inv.numeroFactura}
                                  </strong>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({client?.nombre})</span>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Factura: </span>
                                    <strong>{formatCurrency(inv.total)}</strong>
                                  </div>
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total Abonado: </span>
                                    <strong style={{ color: 'var(--color-success-text)' }}>
                                      {formatCurrency(inv.pagos?.reduce((s, p) => s + p.monto, 0) || 0)}
                                    </strong>
                                  </div>
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Saldo Pendiente: </span>
                                    <strong style={{ color: inv.saldoPendiente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                                      {formatCurrency(inv.saldoPendiente)}
                                    </strong>
                                  </div>

                                  {inv.estado === 'emitida' && inv.saldoPendiente > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleOpenPayment(inv)}
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                    >
                                      <Plus size={13} />
                                      + Registrar Abono
                                    </button>
                                  )}
                                </div>
                              </div>

                              {inv.pagos && inv.pagos.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-default)' }}>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>#</th>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>Fecha de Abono</th>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>Método de Pago</th>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>Referencia Bancaria / Folio</th>
                                        <th style={{ padding: '0.4rem 0.6rem' }}>Notas / Concepto</th>
                                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right' }}>Monto Abonado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {inv.pagos.map((pago, pIdx) => (
                                        <tr key={pago.id || pIdx} style={{ borderBottom: '1px solid var(--border-default)' }}>
                                          <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: 'var(--text-muted)' }}>{pIdx + 1}</td>
                                          <td style={{ padding: '0.4rem 0.6rem' }}>{formatDateTime(pago.fecha)}</td>
                                          <td style={{ padding: '0.4rem 0.6rem' }}>
                                            <Badge variant="neutral">
                                              {pago.metodoPago.toUpperCase()}
                                            </Badge>
                                          </td>
                                          <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                            {pago.referencia || '-'}
                                          </td>
                                          <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>
                                            {pago.notas || 'Abono a cuenta de cliente'}
                                          </td>
                                          <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-success-text)' }}>
                                            +{formatCurrency(pago.monto)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr style={{ borderTop: '2px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)' }}>
                                        <td colSpan={5} style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>
                                          Total Abonado:
                                        </td>
                                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-success-text)', fontSize: '0.85rem' }}>
                                          +{formatCurrency(inv.pagos.reduce((s, pago) => s + (pago.monto || 0), 0))}
                                        </td>
                                      </tr>
                                      <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                                        <td colSpan={5} style={{ padding: '0.35rem 0.6rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>
                                          Saldo Pendiente:
                                        </td>
                                        <td style={{
                                          padding: '0.35rem 0.6rem',
                                          textAlign: 'right',
                                          fontWeight: 800,
                                          color: inv.saldoPendiente > 0 ? 'var(--color-danger-text, var(--color-danger))' : 'var(--color-success-text)',
                                          fontSize: '0.85rem'
                                        }}>
                                          {formatCurrency(inv.saldoPendiente)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              ) : (
                                <div style={{
                                  padding: '0.75rem',
                                  textAlign: 'center',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  backgroundColor: 'var(--bg-subtle)',
                                  borderRadius: 'var(--radius-md)'
                                }}>
                                  No se han registrado abonos aún para esta factura. Saldo pendiente total: <strong>{formatCurrency(inv.saldoPendiente)}</strong>.
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
            {sortedInvoices.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', fontWeight: 800, borderTop: '2px solid var(--border-default)', fontSize: '0.9rem' }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                      <span>TOTALES FILTRADOS:</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        ({filteredInvoicesTotals.activeCount} facturas válidas{filteredInvoicesTotals.anuladasCount > 0 ? `, ${filteredInvoicesTotals.anuladasCount} anuladas` : ''})
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.85rem 0.6rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {formatCurrency(filteredInvoicesTotals.totalFacturado)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.85rem 0.6rem', color: filteredInvoicesTotals.totalSaldoPendiente > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)', fontSize: '0.95rem' }}>
                    {formatCurrency(filteredInvoicesTotals.totalSaldoPendiente)}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.85rem 0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success-text)', fontWeight: 700 }}>
                      Cobrado: {formatCurrency(filteredInvoicesTotals.totalCobrado)}
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Tab 2: Quotes Table */}
      {activeTab === 'quotes' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <SortableTh
                  sortKey="numeroCotizacion"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={false}
                >
                  Folio Cotización
                </SortableTh>
                <SortableTh
                  sortKey="cliente"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={false}
                >
                  Cliente
                </SortableTh>
                <SortableTh
                  sortKey="fechaEmision"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={true}
                >
                  Fecha Emisión
                </SortableTh>
                <SortableTh
                  sortKey="fechaVencimiento"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={true}
                >
                  Vencimiento
                </SortableTh>
                <SortableTh
                  sortKey="itemsCount"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={true}
                  align="center"
                >
                  Ítems
                </SortableTh>
                <SortableTh
                  sortKey="total"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={true}
                  align="right"
                >
                  Total
                </SortableTh>
                <SortableTh
                  sortKey="estado"
                  currentSortKey={quoteSortKey}
                  currentSortDirection={quoteSortDirection}
                  onSort={requestQuoteSort}
                  isNumeric={false}
                  align="center"
                >
                  Estado
                </SortableTh>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay cotizaciones registradas.
                  </td>
                </tr>
              ) : (
                sortedQuotes.map(q => {
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
                      <td>{formatDateTime(q.fechaEmision)}</td>
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
                            title="Previsualizar detalle de la cotización"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            onClick={() => setPrintDoc({ doc: q, type: 'quote' })}
                            title="Imprimir o exportar cotización"
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewInvoiceModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraftInvoice}
              disabled={isSubmitting || formItems.length === 0}
            >
              Guardar como Borrador
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRequestIssueNewInvoice}
              disabled={isSubmitting || formItems.length === 0}
            >
              <CheckCircle size={16} />
              {isSubmitting ? 'Guardando...' : 'Guardar y Emitir Factura'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Cliente *</label>
              <ComboboxInline
                options={activeClients.map(c => ({ id: c.id, label: c.nombre, sublabel: `${c.identificacionFiscal} - ${c.tipoPago}` }))}
                value={formClienteId}
                onChange={handleSelectClient}
                placeholder="Seleccionar cliente..."
                onOpenQuickCreateModal={() => setIsQuickClientOpen(true)}
                quickCreateLabel="+ Crear Nuevo Cliente"
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Condición de Pago</label>
              <ComboboxInline
                options={[
                  { id: 'contado', label: 'Contado' },
                  { id: 'credito', label: 'Crédito' },
                ]}
                value={formTipoPago}
                onChange={(val) => setFormTipoPago(val as PaymentTerm)}
                placeholder="Seleccionar condición..."
                hideSearch={true}
                buttonStyle={{ width: '100%' }}
              />
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
          <div className="item-builder-card">
            <div className="item-builder-header">
              <Plus size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Agregar Producto a la Factura</span>
            </div>

            {/* Row 1: Product & Variant */}
            <div className="item-builder-row-products">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto *</label>
                <ComboboxInline
                  options={activeProducts.map(p => ({
                    id: p.id,
                    label: p.nombre,
                    sublabel: `Stock: ${p.stockActual} - P.Venta: ${formatCurrency(p.precioVenta)}`
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

            {/* Row 2: Quantity, Price, Discount, Line Subtotal, and Add Button */}
            <div className="item-builder-row-inputs-sales">
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
                <label className="form-label">Precio ({settings.monedaSimbolo || '$'})</label>
                <input
                  type="number"
                  className="form-control"
                  value={linePrecio}
                  onChange={(e) => setLinePrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0.01}
                  step="any"
                  placeholder="0.00"
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
                  placeholder="0"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subtotal Línea</label>
                <div className="form-control" style={{ backgroundColor: 'var(--bg-surface)', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>
                  {formatCurrency((Number(lineCantidad) || 0) * (Number(linePrecio) || 0) * (1 - (Number(lineDescuento) || 0) / 100))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-add-item"
                  style={{ height: '38px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleAddLineItem}
                  disabled={!selectedProdForLine}
                >
                  <Plus size={16} />
                  + Agregar
                </button>
              </div>
            </div>

            {/* Real-time stock status & commentary */}
            {selectedProdObj && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: currentLineStock < currentLineQty ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${currentLineStock < currentLineQty ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #10b981)'}`,
                color: currentLineStock < currentLineQty ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #10b981)'
              }}>
                {currentLineStock < currentLineQty ? (
                  <>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Inventario insuficiente:</strong> Stock actual en almacén: <strong>{currentLineStock} pzas</strong>. Al facturar <strong>{currentLineQty} pzas</strong>, el inventario resultante será de <strong style={{ textDecoration: 'underline' }}>{projectedLineStock} pzas (Déficit / Negativo: {currentLineQty - currentLineStock} pzas)</strong>.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Stock disponible:</strong> <strong>{currentLineStock} pzas</strong> en almacén (Quedarán <strong>{projectedLineStock} pzas</strong> tras esta venta).
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Row Transporte (Debajo de la selección de producto) */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck size={15} style={{ color: 'var(--color-accent)' }} />
                Transporte
              </label>
              <ComboboxInline
                options={[
                  { id: 'sin_transporte', label: 'Sin transporte' },
                  { id: 'dentro_gam', label: 'Transporte dentro del GAM' },
                  { id: 'fuera_gam', label: 'Transporte fuera del GAM' },
                ]}
                value={formTipoTransporte}
                onChange={(val) => handleSelectTipoTransporte(val as 'sin_transporte' | 'dentro_gam' | 'fuera_gam')}
                placeholder="Seleccionar transporte..."
                hideSearch={true}
                buttonStyle={{ width: '100%', textAlign: 'left' }}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                Costo de Transporte ({settings.monedaSimbolo || '₡'})
              </label>
              <input
                type="number"
                min={0}
                step={100}
                className="form-control"
                value={formCostoTransporte}
                onChange={(e) => setFormCostoTransporte(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder="0"
                style={{ textAlign: 'left' }}
              />
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
          <div className="modal-totals-grid">
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
              {formDescuentoTotal > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    <span>Venta Bruta:</span>
                    <span>{formatCurrency(formGrossSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                    <span>(-) Descuento Aplicado:</span>
                    <span>-{formatCurrency(formDescuentoTotal)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Subtotal Neto:</span>
                <span style={{ fontWeight: formDescuentoTotal > 0 ? 600 : 400 }}>{formatCurrency(formSubtotal)}</span>
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
              {formCostoTransporte > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={13} style={{ color: 'var(--color-accent)' }} />
                    Transporte:
                  </span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(formCostoTransporte)}</span>
                </div>
              )}
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewQuoteModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveQuote}
              disabled={isSubmitting || formItems.length === 0}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cotización'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Cliente *</label>
              <ComboboxInline
                options={activeClients.map(c => ({ id: c.id, label: c.nombre, sublabel: c.identificacionFiscal }))}
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
          <div className="item-builder-card">
            <div className="item-builder-header">
              <Plus size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Agregar Producto a la Cotización</span>
            </div>

            {/* Row 1: Product & Variant */}
            <div className="item-builder-row-products">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Producto *</label>
                <ComboboxInline
                  options={activeProducts.map(p => ({
                    id: p.id,
                    label: p.nombre,
                    sublabel: `P.Venta: ${formatCurrency(p.precioVenta)}`
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

            {/* Row 2: Quantity, Price, Discount, Line Subtotal, and Add Button */}
            <div className="item-builder-row-inputs-sales">
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
                <label className="form-label">Precio ({settings.monedaSimbolo || '$'})</label>
                <input
                  type="number"
                  className="form-control"
                  value={linePrecio}
                  onChange={(e) => setLinePrecio(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0.01}
                  step="any"
                  placeholder="0.00"
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
                  placeholder="0"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Subtotal Línea</label>
                <div className="form-control" style={{ backgroundColor: 'var(--bg-surface)', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>
                  {formatCurrency((Number(lineCantidad) || 0) * (Number(linePrecio) || 0) * (1 - (Number(lineDescuento) || 0) / 100))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-add-item"
                  style={{ height: '38px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleAddLineItem}
                  disabled={!selectedProdForLine}
                >
                  <Plus size={16} />
                  + Agregar
                </button>
              </div>
            </div>

            {/* Real-time stock status in Quote */}
            {selectedProdObj && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: currentLineStock < currentLineQty ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${currentLineStock < currentLineQty ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #10b981)'}`,
                color: currentLineStock < currentLineQty ? 'var(--color-warning, #d97706)' : 'var(--color-success, #10b981)'
              }}>
                {currentLineStock < currentLineQty ? (
                  <>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Aviso de existencias:</strong> Stock actual: <strong>{currentLineStock} pzas</strong>. Cantidad a cotizar: <strong>{currentLineQty} pzas</strong> (Faltante para entrega inmediata: {currentLineQty - currentLineStock} pzas).
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Stock suficiente:</strong> <strong>{currentLineStock} pzas</strong> disponibles para entrega inmediata.
                    </span>
                  </>
                )}
              </div>
            )}
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
              {formDescuentoTotal > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    <span>Venta Bruta:</span>
                    <span>{formatCurrency(formGrossSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                    <span>(-) Descuento Aplicado:</span>
                    <span>-{formatCurrency(formDescuentoTotal)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span>Subtotal Neto:</span>
                <span style={{ fontWeight: formDescuentoTotal > 0 ? 600 : 400 }}>{formatCurrency(formSubtotal)}</span>
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
            <label className="form-label">Monto Cobrado ({settings.monedaSimbolo || '$'}) *</label>
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
                placeholder="Ej. CB0001, SPEI-4481..."
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Si se deja vacío, el sistema asignará automáticamente el folio correlativo (CB0001).
              </span>
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
                disabled={isSubmitting}
              >
                <CheckCircle size={16} />
                {isSubmitting ? 'Emitiendo...' : 'Confirmar y Emitir Factura'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Deficit warning banner if negative stock will occur */}
            {confirmIssueData.deficitItems && confirmIssueData.deficitItems.length > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid var(--color-danger, #ef4444)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--color-danger, #ef4444)', fontWeight: 700, fontSize: '0.95rem' }}>
                  <AlertTriangle size={20} />
                  <span>¡Advertencia: Existencias Insuficientes en Inventario!</span>
                </div>
                <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  Los siguientes productos a facturar superan las existencias físicas en almacén. Si confirmas la emisión, el sistema registrará los saldos negativos en el Kardex e inventarios:
                </p>
                <div style={{ maxHeight: '160px', overflowY: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
                  <table className="table" style={{ fontSize: '0.8rem', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Código / SKU</th>
                        <th>Producto</th>
                        <th style={{ textAlign: 'center' }}>Stock Disp.</th>
                        <th style={{ textAlign: 'center' }}>A Facturar</th>
                        <th style={{ textAlign: 'center', color: 'var(--color-danger)' }}>Déficit / Saldo Negativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmIssueData.deficitItems.map((def, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{def.code}</td>
                          <td>{def.nombre}</td>
                          <td style={{ textAlign: 'center' }}>{def.disponible}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{def.solicitado}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-danger)' }}>
                            -{def.faltante} ({def.disponible - def.solicitado} final)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-danger)' }}>
                  ¿Deseas confirmar la emisión de la factura de todos modos permitiendo saldo negativo?
                </div>
              </div>
            )}

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
            <div className="responsive-split-grid">
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
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDateTime(confirmIssueData.fechaEmision)}</div>
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
                    <span style={{ color: 'var(--text-muted)' }}>IVA ({confirmIssueData.tasaImpuesto ?? settings.tasaImpuestoDefecto}%):</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(confirmIssueData.impuestos)}</span>
                  </div>
                  {confirmIssueData.costoTransporte !== undefined && confirmIssueData.costoTransporte > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Truck size={13} style={{ color: 'var(--color-accent)' }} />
                        Transporte:
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(confirmIssueData.costoTransporte)}</span>
                    </div>
                  )}
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

      {/* Date Restriction / Block Modal */}
      <Modal
        isOpen={dateWarningData.isOpen}
        onClose={() => setDateWarningData({ isOpen: false, message: '', isBlocked: false })}
        title={dateWarningData.isBlocked ? 'Operación No Permitida' : 'Advertencia de Fecha'}
        subtitle={dateWarningData.isBlocked ? 'Restricción activa del sistema' : 'Revisa las condiciones del periodo'}
        size="md"
        footer={
          dateWarningData.isBlocked ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setDateWarningData({ isOpen: false, message: '', isBlocked: false })}
            >
              Entendido
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDateWarningData({ isOpen: false, message: '', isBlocked: false })}
              >
                Cancelar y Cambiar Fecha
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={() => {
                  const cb = dateWarningData.onConfirm;
                  setDateWarningData({ isOpen: false, message: '', isBlocked: false });
                  if (cb) cb();
                }}
              >
                Continuar de Todos Modos
              </button>
            </>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: dateWarningData.isBlocked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${dateWarningData.isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontSize: '0.9rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600 }}>
              <AlertTriangle size={18} style={{ color: dateWarningData.isBlocked ? '#dc2626' : '#d97706' }} />
              <span>{dateWarningData.message}</span>
            </div>
            {dateWarningData.riskWarning && (
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <strong>Riesgo:</strong> {dateWarningData.riskWarning}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
