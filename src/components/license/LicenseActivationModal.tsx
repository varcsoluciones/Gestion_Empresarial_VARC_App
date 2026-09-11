import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { useLicense } from '../../context/LicenseContext';

export const LicenseActivationModal: React.FC = () => {
  const { login, errorMessage, isRevalidating, clearError } = useLicense();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const cleanEmail = email.trim();
    const cleanPin = pin.trim();

    if (!cleanEmail) {
      setLocalError('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!cleanPin) {
      setLocalError('Por favor ingresa tu PIN de acceso.');
      return;
    }

    const res = await login(cleanEmail, cleanPin);
    if (!res.success) {
      setLocalError(res.message);
    }
  };

  const currentError = localError || errorMessage;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-subtle, rgba(255, 255, 255, 0.1))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with gradient banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '2rem 1.75rem 1.5rem',
            textAlign: 'center',
            color: '#ffffff',
            position: 'relative',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '16px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '1rem',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <AppLogo size={38} color="#6366f1" />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            VARC Soluciones
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.35rem 0 0 0', fontWeight: 500 }}>
            Activación de Licencia — VARC ERP
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary, #64748b)',
              marginBottom: '1.5rem',
              textAlign: 'center',
              lineHeight: 1.5
            }}
          >
            Ingresa tu correo autorizado y tu PIN de seguridad para activar tu acceso al sistema.
          </p>

          {currentError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md, 8px)',
                color: 'var(--color-danger, #ef4444)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Error de activación:</strong> {currentError}
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isRevalidating}
                autoFocus
                required
              />
            </div>
          </div>

          {/* PIN Field */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              PIN de Acceso
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #94a3b8)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Lock size={16} />
              </span>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                className="form-control"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem', letterSpacing: showPin ? 'normal' : '0.2em' }}
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isRevalidating}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.35rem', display: 'block' }}>
              El PIN solo se valida en el servidor; nunca se almacena en tu dispositivo.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isRevalidating}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            {isRevalidating ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Verificando con Supabase...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Activar y Entrar al Sistema</span>
              </>
            )}
          </button>

          {/* Help & Support WhatsApp link */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-secondary, #64748b)'
            }}
          >
            ¿Necesitas adquirir una licencia o soporte?
            <br />
            <a
              href="https://wa.me/50688888888?text=Hola%20VARC%20Soluciones,%20solicito%20informaci%C3%B3n%20para%20activar%20mi%20licencia%20de%20VARC%20ERP"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--color-accent, #6366f1)',
                fontWeight: 600,
                marginTop: '0.35rem',
                textDecoration: 'none'
              }}
            >
              <MessageSquare size={14} />
              Contactar a VARC Soluciones por WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
