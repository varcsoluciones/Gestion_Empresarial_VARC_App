import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useERP } from '../../context/ERPContext';

interface QuickCreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierCreated: (newSupplierId: string) => void;
}

export const QuickCreateSupplierModal: React.FC<QuickCreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onSupplierCreated
}) => {
  const { addSupplier } = useERP();

  const [nombre, setNombre] = useState('');
  const [identificacionFiscal, setIdentificacionFiscal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del proveedor es obligatorio');
      return;
    }

    const newSupplier = addSupplier({
      nombre: nombre.trim(),
      identificacionFiscal: identificacionFiscal.trim() || 'PROV-GENERICO',
      telefono: telefono.trim(),
      email: email.trim(),
      contactoNombre: contactoNombre.trim(),
      direccion: ''
    });

    onSupplierCreated(newSupplier.id);
    onClose();
    setNombre('');
    setIdentificacionFiscal('');
    setTelefono('');
    setEmail('');
    setContactoNombre('');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Proveedor (Rápido)"
      subtitle="Registra el proveedor para continuar tu orden de compra"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="quick-supplier-form" className="btn btn-primary">
            Guardar y Seleccionar
          </button>
        </>
      }
    >
      <form id="quick-supplier-form" onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Nombre / Empresa Proveedora <span className="form-label-required">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej. Confecciones del Centro S.A."
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
              placeholder="Ej. CDC120801KL8"
              value={identificacionFiscal}
              onChange={(e) => setIdentificacionFiscal(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nombre de Contacto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Ing. Carlos Ruiz"
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input
              type="tel"
              className="form-control"
              placeholder="Ej. 55 9876 5432"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="ventas@proveedor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
