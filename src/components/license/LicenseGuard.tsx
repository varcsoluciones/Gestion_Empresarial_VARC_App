import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { useLicense } from '../../context/LicenseContext';
import { LicenseActivationModal } from './LicenseActivationModal';
import { LicenseExpiredModal } from './LicenseExpiredModal';
import { AppLogo } from '../common/AppLogo';
import { WifiOff, X } from 'lucide-react';

interface LicenseGuardProps {
  children: ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const { status, offlineGraceDaysRemaining } = useLicense();
  const [isGraceBannerDismissed, setIsGraceBannerDismissed] = useState(false);

  // 1. Loading splash
  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          gap: '1.25rem'
        }}
      >
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '24px',
            backgroundColor: '#000000',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            boxShadow: '0 0 40px rgba(124, 58, 237, 0.25)',
            animation: 'pulse 2s infinite ease-in-out'
          }}
        >
          <AppLogo size={56} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            VARC Soluciones
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.35rem 0 0 0' }}>
            Verificando licencia del sistema...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unlicensed -> Show Activation
  if (status === 'unlicensed') {
    return <LicenseActivationModal />;
  }

  // 3. Expired or Deactivated -> Show Block Screen
  if (status === 'expired' || status === 'deactivated') {
    return <LicenseExpiredModal />;
  }

  // 4. Active or Offline Grace -> Render full application
  return (
    <>
      {status === 'offline_grace' && !isGraceBannerDismissed && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#f59e0b',
            color: '#78350f',
            padding: '0.45rem 1rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <WifiOff size={15} />
            <span>
              Modo sin conexión: Licencia validada localmente. Restan {offlineGraceDaysRemaining} {offlineGraceDaysRemaining === 1 ? 'día' : 'días'} de gracia para sincronizar con internet.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsGraceBannerDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#78350f',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Descartar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {children}
    </>
  );
};
