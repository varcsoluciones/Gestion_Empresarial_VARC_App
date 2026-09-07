import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useERP } from '../../context/ERPContext';
import type { PaymentTerm } from '../../types/erp';

interface QuickCreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (newCustomerId: string) => void;
}

export const QuickCreateCustomerModal: React.FC<QuickCreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated
}) => {
  const { addClient } = useERP();

  const [nombre, setNombre] = useState('');
  const [identificacionFiscal, setIdentificacionFiscal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipoPago, setTipoPago] = useState<PaymentTerm>('contado');
  const [diasCredito, setDiasCredito] = useState(30);
  const [limiteCredito, setLimiteCredito] = useState(10000);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del cliente o razón social es obligatorio');
      return;
    }

    const newClient = addClient({
      nombre: nombre.trim(),
      identificacionFiscal: identificacionFiscal.trim() || 'XAXX010101000',
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      tipoPago,
      diasCredito: tipoPago === 'credito' ? Number(diasCredito) : 0,
      limiteCredito: tipoPago === 'credito' ? Number(limiteCredito) : 0
    });

    onCustomerCreated(newClient.id);
    onClose();
    // Reset form
    setNombre('');
    setIdentificacionFiscal('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setTipoPago('contado');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Cliente (Rápido)"
      subtitle="Captura los datos esenciales sin salir de tu operación actual"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="quick-customer-form" className="btn btn-primary">
            Guardar y Seleccionar
          </button>
        </>
      }
    >
      <form id="quick-customer-form" onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Nombre / Razón Social <span className="form-label-required">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej. Boutique San Ángel o Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">RFC / Identificación Fiscal</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. BSA190415KL9"
              value={identificacionFiscal}
              onChange={(e) => setIdentificacionFiscal(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input
              type="tel"
              className="form-control"
              placeholder="Ej. 55 1234 5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="contacto@cliente.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Condición de Pago</label>
            <select
              className="form-select"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value as PaymentTerm)}
            >
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
        </div>

        {tipoPago === 'credito' && (
          <div className="form-row" style={{ marginTop: '0.25rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Días de Crédito</label>
              <input
                type="number"
                className="form-control"
                value={diasCredito}
                onChange={(e) => setDiasCredito(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Límite de Crédito ($)</label>
              <input
                type="number"
                className="form-control"
                value={limiteCredito}
                onChange={(e) => setLimiteCredito(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
