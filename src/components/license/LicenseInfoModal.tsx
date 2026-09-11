import React, { useState } from 'react';
import { ShieldCheck, WifiOff, RotateCcw, LogOut, Calendar, Mail, Clock, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useLicense } from '../../context/LicenseContext';
import { formatDate, formatDateTime } from '../../utils/formatters';

interface LicenseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseInfoModal: React.FC<LicenseInfoModalProps> = ({ isOpen, onClose }) => {
  const { license, status, revalidate, logout, isRevalidating, offlineGraceDaysRemaining } = useLicense();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !license) return null;

  const handleRecheck = async () => {
    setFeedback(null);
    const res = await revalidate();
    if (res.success) {
      setFeedback({ type: 'success', text: 'Licencia revalidada exitosamente contra Supabase.' });
    } else {
      setFeedback({ type: 'error', text: res.message || 'No se pudo revalidar la licencia.' });
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  // Calculate days remaining of license validity
  let daysRemaining: number | null = null;
  if (license.vigente_hasta) {
    const exp = new Date(`${license.vigente_hasta}T23:59:59`).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
  }

  const isOffline = status === 'offline_grace';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Información de Licencia"
      subtitle="VARC ERP — Control centralizado en Supabase"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <LogOut size={14} />
            Cerrar Sesión de Licencia
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRecheck}
              disabled={isRevalidating}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isRevalidating ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
              Revalidar
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Status Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: isOffline ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isOffline ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: 'var(--radius-lg, 12px)'
          }}
        >
          <div
            style={{
              padding: '0.65rem',
              borderRadius: '10px',
              backgroundColor: isOffline ? '#fef3c7' : '#d1fae5',
              color: isOffline ? '#b45309' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isOffline ? <WifiOff size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isOffline ? '#b45309' : '#059669' }}>
              {isOffline ? 'Licencia Activa (Modo Sin Conexión)' : 'Licencia Activa & Conectada'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.2rem' }}>
              {isOffline
                ? `Validada en caché local. Restan ${offlineGraceDaysRemaining} días de gracia para reconectar.`
                : 'Validación en segundo plano activa con Supabase.'}
            </div>
          </div>
        </div>

        {feedback && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.85rem',
              backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedback.type === 'success' ? '#059669' : '#dc2626'
            }}
          >
            {feedback.text}
          </div>
        )}

        {/* Details Grid */}
        <div
          style={{
            backgroundColor: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: 'var(--radius-md, 8px)',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} /> Correo Registrado:
            </span>
            <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{license.email}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Vencimiento:
            </span>
            <strong style={{ color: 'var(--text-primary, #0f172a)' }}>
              {license.vigente_hasta ? formatDate(license.vigente_hasta) : 'Indefinida'}
            </strong>
          </div>

          {daysRemaining !== null && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                fontSize: '0.85rem'
              }}
            >
              <span style={{ color: 'var(--text-secondary, #64748b)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} /> Días de vigencia restantes:
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: daysRemaining <= 7 ? '#d97706' : '#059669',
                  backgroundColor: daysRemaining <= 7 ? 'rgba(217, 119, 6, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px'
                }}
              >
                {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ color: 'var(--text-secondary, #64748b)' }}>Última revalidación exitosa:</span>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>
              {license.ultima_validacion ? formatDateTime(license.ultima_validacion) : 'N/A'}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.4 }}>
          Nota de seguridad: Tu PIN de acceso se valida exclusivamente en el servidor central mediante funciones seguras con cifrado Blowfish y nunca se almacena en este dispositivo.
        </div>
      </div>
    </Modal>
  );
};
