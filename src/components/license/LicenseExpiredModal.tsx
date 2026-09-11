import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, LogOut, MessageSquare, ShieldAlert, Loader2, Calendar } from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';
import { formatDate } from '../../utils/formatters';

export const LicenseExpiredModal: React.FC = () => {
  const { status, license, revalidate, logout, isRevalidating, errorMessage } = useLicense();
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const isDeactivated = status === 'deactivated';

  const handleRecheck = async () => {
    setLocalFeedback(null);
    const res = await revalidate();
    if (!res.success) {
      setLocalFeedback(res.message || 'La licencia aún no se encuentra activa en el servidor.');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Víctor / VARC Soluciones, deseo renovar o reactivar mi licencia de VARC ERP.\nCorreo registrado: ${license?.email || 'N/A'}`
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle, rgba(255, 255, 255, 0.1))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with warning banner */}
        <div
          style={{
            background: isDeactivated
              ? 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)'
              : 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
            padding: '2rem 1.75rem 1.5rem',
            textAlign: 'center',
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              marginBottom: '1rem',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            {isDeactivated ? (
              <ShieldAlert size={38} color="#fca5a5" />
            ) : (
              <AlertTriangle size={38} color="#fcd34d" />
            )}
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {isDeactivated ? 'Licencia Desactivada' : 'Licencia Vencida'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', margin: '0.35rem 0 0 0' }}>
            Acceso bloqueado en VARC ERP
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.75rem' }}>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary, #475569)',
              margin: '0 0 1.25rem 0',
              lineHeight: 1.5,
              textAlign: 'center'
            }}
          >
            {isDeactivated
              ? 'Esta licencia ha sido suspendida o revocada en el servidor de licencias de VARC Soluciones.'
              : 'Tu periodo de suscripción ha concluido. Para continuar utilizando el sistema sin interrupciones, comunícate con VARC Soluciones para renovar.'}
          </p>

          {/* License Metadata Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid var(--border-default, #e2e8f0)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted, #64748b)' }}>Cuenta / Correo:</span>
              <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{license?.email || 'N/A'}</strong>
            </div>
            {license?.vigente_hasta && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} /> Venció el:
                </span>
                <strong style={{ color: '#dc2626' }}>{formatDate(license.vigente_hasta)}</strong>
              </div>
            )}
          </div>

          {(localFeedback || errorMessage) && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md, 8px)',
                color: '#dc2626',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}
            >
              {localFeedback || errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* WhatsApp Contact */}
            <a
              href={`https://wa.me/50688888888?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <MessageSquare size={16} />
              <span>Contactar a VARC Soluciones para Renovar</span>
            </a>

            {/* Check Again Button */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRecheck}
              disabled={isRevalidating}
              style={{
                width: '100%',
                padding: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              {isRevalidating ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Revalidando en Supabase...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Ya renové — Verificar Estado Ahora</span>
                </>
              )}
            </button>

            {/* Logout / Reenter Button */}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={logout}
              style={{
                width: '100%',
                padding: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted, #64748b)'
              }}
            >
              <LogOut size={15} />
              <span>Ingresar con otro correo o PIN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
