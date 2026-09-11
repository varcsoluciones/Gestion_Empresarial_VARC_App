import React from 'react';
import type { Invoice, Quote } from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Printer, X } from 'lucide-react';
import { Badge } from '../common/Badge';

interface DocumentPrintViewProps {
  document: Invoice | Quote;
  type: 'invoice' | 'quote';
  onClose: () => void;
}

export const DocumentPrintView: React.FC<DocumentPrintViewProps> = ({
  document: doc,
  type,
  onClose
}) => {
  const { settings, clients } = useERP();
  const client = clients.find(c => c.id === doc.clienteId);

  const isInvoice = type === 'invoice';
  const invoice = isInvoice ? (doc as Invoice) : null;
  const quote = !isInvoice ? (doc as Quote) : null;

  const docNumber = isInvoice ? invoice?.numeroFactura : quote?.numeroCotizacion;
  const docTitle = isInvoice ? 'FACTURA DE VENTA' : 'COTIZACIÓN FORMAL';

  const getStatusBadge = () => {
    if (isInvoice) {
      if (invoice?.estado === 'pagada') return <Badge variant="success">PAGADA</Badge>;
      if (invoice?.estado === 'emitida') return <Badge variant="info">EMITIDA / PENDIENTE</Badge>;
      if (invoice?.estado === 'anulada') return <Badge variant="danger">ANULADA</Badge>;
      return <Badge variant="neutral">BORRADOR</Badge>;
    } else {
      if (quote?.estado === 'aprobada') return <Badge variant="success">APROBADA</Badge>;
      if (quote?.estado === 'pendiente') return <Badge variant="warning">PENDIENTE</Badge>;
      if (quote?.estado === 'vencida') return <Badge variant="danger">VENCIDA</Badge>;
      return <Badge variant="neutral">RECHAZADA</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ padding: '1.5rem 1rem' }}>
      <div className="modal-card modal-xl print-document-container">
        {/* Action Header - Sticky & Hidden on Print */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Vista Previa de Impresión</span>
            {getStatusBadge()}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={16} />
              Imprimir / Guardar PDF
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={16} />
              Cerrar
            </button>
          </div>
        </div>

        {/* Printable Document Body with Smooth Scroll */}
        <div className="print-document-body">
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                {settings.nombreEmpresa}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                RFC / Identificación: <strong>{settings.identificacionFiscal}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {settings.direccion}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Tel: {settings.telefono} | Email: {settings.email}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#4338ca',
                letterSpacing: '-0.02em'
              }}>
                {docTitle}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                {docNumber}
              </div>
              <div style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Metadata Row: Client & Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', margin: '1.5rem 0' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Información del Cliente
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                {client?.nombre || 'Cliente General'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                RFC / ID: <strong>{client?.identificacionFiscal || 'N/A'}</strong>
              </div>
              {client?.direccion && (
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Dirección: {client.direccion}
                </div>
              )}
              {client?.telefono && (
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  Tel: {client.telefono} | {client.email}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Detalles del Documento
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                <span style={{ color: '#64748b' }}>Fecha de Emisión:</span>
                <strong style={{ color: '#0f172a' }}>{formatDateTime(doc.fechaEmision || (doc as any).fecha)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                <span style={{ color: '#64748b' }}>Fecha de Vencimiento:</span>
                <strong style={{ color: '#0f172a' }}>{formatDate(doc.fechaVencimiento)}</strong>
              </div>
              {isInvoice && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                  <span style={{ color: '#64748b' }}>Términos de Pago:</span>
                  <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{invoice?.tipoPago}</strong>
                </div>
              )}
              {isInvoice && invoice?.cotizacionIdOrigen && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                  <span style={{ color: '#64748b' }}>Cotización Origen:</span>
                  <strong style={{ color: '#4338ca' }}>{invoice.cotizacionIdOrigen}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Descripción</th>
                <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '80px' }}>Cant.</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '110px' }}>P. Unitario</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '80px' }}>Desc.</th>
                <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', width: '120px' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#0f172a' }}>
                    <strong>{item.descripcion}</strong>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.875rem', color: '#0f172a' }}>
                    {item.cantidad}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', color: '#0f172a' }}>
                    {formatCurrency(item.precioUnitario)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                    {item.descuento > 0 ? `${item.descuento}%` : '-'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Notes Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Notas y Condiciones Comerciales
                </div>
                <div style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5 }}>
                  {doc.notas || settings.pieFactura || 'Sin notas adicionales.'}
                </div>
              </div>

              {isInvoice && invoice?.anuladoMotivo && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.8rem' }}>
                  <strong>Motivo de Anulación:</strong> {invoice.anuladoMotivo}
                  <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: '#b91c1c' }}>Fecha de Anulación: {formatDateTime(invoice.anuladoFecha)}</div>
                </div>
              )}

              {/* Payments breakdown if any */}
              {isInvoice && invoice && invoice.pagos && invoice.pagos.length > 0 && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Historial de Cobros / Abonos Recibidos ({invoice.pagos.length})
                  </div>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {invoice.pagos.map((p, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <span>{formatDateTime(p.fecha)} — <span style={{ textTransform: 'capitalize', color: '#64748b' }}>{p.metodoPago}</span> {p.referencia ? `(${p.referencia})` : ''}</span>
                        <strong style={{ color: '#059669' }}>{formatCurrency(p.monto)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', color: '#475569' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(doc.subtotal)}</span>
              </div>
              {doc.descuentoTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', color: '#059669' }}>
                  <span>Descuentos:</span>
                  <span>-{formatCurrency(doc.descuentoTotal)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', color: '#475569' }}>
                <span>IVA ({settings.tasaImpuestoDefecto}%):</span>
                <span>{formatCurrency(doc.impuestos)}</span>
              </div>
              {((doc as any).costoTransporte ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', color: '#475569' }}>
                  <span>Transporte:</span>
                  <span>{formatCurrency((doc as any).costoTransporte)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, padding: '0.6rem 0 0.25rem', borderTop: '2px solid #cbd5e1', marginTop: '0.5rem', color: '#0f172a' }}>
                <span>Total Factura:</span>
                <span style={{ color: '#4338ca' }}>{formatCurrency(doc.total)}</span>
              </div>

              {isInvoice && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.35rem 0', color: '#059669', borderTop: '1px dashed #e2e8f0', marginTop: '0.5rem' }}>
                    <span>Total Pagado:</span>
                    <strong>{formatCurrency(invoice ? invoice.total - invoice.saldoPendiente : 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, padding: '0.35rem 0', color: invoice && invoice.saldoPendiente > 0 ? '#b91c1c' : '#059669' }}>
                    <span>Saldo Pendiente (CxC):</span>
                    <span>{formatCurrency(invoice ? invoice.saldoPendiente : 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer note & credentials */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', paddingBottom: '1.5rem' }}>
            <div>Documento emitido para efectos de control interno y administración empresarial por <strong>{settings.nombreEmpresa}</strong>.</div>
            <div style={{ marginTop: '0.2rem' }}>RFC: {settings.identificacionFiscal} | Tel: {settings.telefono} | {settings.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
