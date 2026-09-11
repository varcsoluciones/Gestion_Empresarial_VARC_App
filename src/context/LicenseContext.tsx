import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  APP_ID,
  validarLicencia,
  revalidarLicencia,
  getStoredLicense,
  saveStoredLicense,
  clearStoredLicense,
  checkOfflineGrace
} from '../services/licenseService';
import type { LicenseStatus, StoredLicenseSession } from '../services/licenseService';

export interface LicenseContextType {
  status: LicenseStatus | 'loading';
  license: StoredLicenseSession | null;
  errorMessage: string | null;
  isRevalidating: boolean;
  offlineGraceDaysRemaining: number;
  login: (email: string, pin: string) => Promise<{ success: boolean; message: string }>;
  revalidate: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  clearError: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<LicenseStatus | 'loading'>('loading');
  const [license, setLicense] = useState<StoredLicenseSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [offlineGraceDaysRemaining, setOfflineGraceDaysRemaining] = useState<number>(0);

  // Initial check on app startup
  useEffect(() => {
    let isMounted = true;

    async function initializeLicense() {
      const stored = getStoredLicense();

      if (!stored) {
        if (isMounted) {
          setLicense(null);
          setStatus('unlicensed');
        }
        return;
      }

      setLicense(stored);

      // Check if calendar expiration date has already passed
      if (stored.vigente_hasta) {
        const expDate = new Date(`${stored.vigente_hasta}T23:59:59`);
        if (new Date() > expDate) {
          const expiredSession: StoredLicenseSession = {
            ...stored,
            status: 'expired',
            lastMessage: 'Licencia vencida'
          };
          saveStoredLicense(expiredSession);
          if (isMounted) {
            setLicense(expiredSession);
            setStatus('expired');
            setErrorMessage('Tu licencia ha expirado. Por favor contacta a VARC Soluciones para renovar.');
          }
          return;
        }
      }

      // Check if offline before attempting network request
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const grace = checkOfflineGrace(stored);
        if (isMounted) {
          setOfflineGraceDaysRemaining(grace.daysRemainingGrace);
          if (grace.isAllowed) {
            setStatus('offline_grace');
          } else {
            setStatus(grace.status);
            setErrorMessage(grace.reason);
          }
        }
        return;
      }

      // Revalidate in background with Supabase
      try {
        setIsRevalidating(true);
        const res = await revalidarLicencia(stored.email, APP_ID);

        if (!isMounted) return;

        if (res.valido) {
          const activeSession: StoredLicenseSession = {
            email: stored.email,
            vigente_hasta: res.vigente_hasta,
            ultima_validacion: new Date().toISOString(),
            app: APP_ID,
            status: 'active',
            lastMessage: res.mensaje
          };
          saveStoredLicense(activeSession);
          setLicense(activeSession);
          setStatus('active');
          setErrorMessage(null);
        } else {
          // Handled server responses: 'Licencia vencida', 'Licencia desactivada', 'Acceso no válido'
          const newStatus: LicenseStatus =
            res.mensaje === 'Licencia vencida'
              ? 'expired'
              : res.mensaje === 'Licencia desactivada'
              ? 'deactivated'
              : 'unlicensed';

          const updatedSession: StoredLicenseSession = {
            ...stored,
            vigente_hasta: res.vigente_hasta || stored.vigente_hasta,
            status: newStatus === 'unlicensed' ? 'deactivated' : newStatus,
            lastMessage: res.mensaje
          };
          saveStoredLicense(updatedSession);
          setLicense(updatedSession);
          setStatus(newStatus);
          setErrorMessage(res.mensaje);
        }
      } catch (err: any) {
        // Network failure / Supabase unreachable -> Check offline grace
        if (!isMounted) return;
        const grace = checkOfflineGrace(stored);
        setOfflineGraceDaysRemaining(grace.daysRemainingGrace);

        if (grace.isAllowed) {
          setStatus('offline_grace');
        } else {
          setStatus(grace.status);
          setErrorMessage(grace.reason);
        }
      } finally {
        if (isMounted) {
          setIsRevalidating(false);
        }
      }
    }

    initializeLicense();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login / Activate with Email + PIN
  const login = useCallback(async (email: string, pin: string): Promise<{ success: boolean; message: string }> => {
    setIsRevalidating(true);
    setErrorMessage(null);

    try {
      const res = await validarLicencia(email, pin, APP_ID);

      if (res.valido) {
        const newSession: StoredLicenseSession = {
          email: email.trim().toLowerCase(),
          vigente_hasta: res.vigente_hasta,
          ultima_validacion: new Date().toISOString(),
          app: APP_ID,
          status: 'active',
          lastMessage: res.mensaje
        };
        saveStoredLicense(newSession);
        setLicense(newSession);
        setStatus('active');
        setErrorMessage(null);
        return { success: true, message: 'Licencia validada exitosamente.' };
      } else {
        setErrorMessage(res.mensaje);
        if (res.mensaje === 'Licencia vencida') {
          setStatus('expired');
        } else if (res.mensaje === 'Licencia desactivada') {
          setStatus('deactivated');
        }
        return { success: false, message: res.mensaje };
      }
    } catch (err: any) {
      const message = err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')
        ? 'No se pudo contactar al servidor de licencias. Verifica tu conexión a internet.'
        : (err?.message || 'Error inesperado al validar la licencia.');
      setErrorMessage(message);
      return { success: false, message };
    } finally {
      setIsRevalidating(false);
    }
  }, []);

  // Manual revalidate (used from Expired screen or Settings)
  const revalidate = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const currentEmail = license?.email;
    if (!currentEmail) {
      setStatus('unlicensed');
      return { success: false, message: 'No hay licencia registrada para revalidar.' };
    }

    setIsRevalidating(true);
    setErrorMessage(null);

    try {
      const res = await revalidarLicencia(currentEmail, APP_ID);

      if (res.valido) {
        const updatedSession: StoredLicenseSession = {
          email: currentEmail,
          vigente_hasta: res.vigente_hasta,
          ultima_validacion: new Date().toISOString(),
          app: APP_ID,
          status: 'active',
          lastMessage: res.mensaje
        };
        saveStoredLicense(updatedSession);
        setLicense(updatedSession);
        setStatus('active');
        setErrorMessage(null);
        return { success: true, message: 'Licencia revalidada y activa con éxito.' };
      } else {
        const newStatus: LicenseStatus =
          res.mensaje === 'Licencia vencida'
            ? 'expired'
            : res.mensaje === 'Licencia desactivada'
            ? 'deactivated'
            : 'unlicensed';

        const updatedSession: StoredLicenseSession = {
          ...license,
          vigente_hasta: res.vigente_hasta || license.vigente_hasta,
          status: newStatus === 'unlicensed' ? 'deactivated' : newStatus,
          lastMessage: res.mensaje
        };
        saveStoredLicense(updatedSession);
        setLicense(updatedSession);
        setStatus(newStatus);
        setErrorMessage(res.mensaje);
        return { success: false, message: res.mensaje };
      }
    } catch (err: any) {
      const msg = 'No se pudo conectar con el servidor para revalidar la licencia.';
      setErrorMessage(msg);
      return { success: false, message: msg };
    } finally {
      setIsRevalidating(false);
    }
  }, [license]);

  // Logout / Switch account
  const logout = useCallback(() => {
    clearStoredLicense();
    setLicense(null);
    setStatus('unlicensed');
    setErrorMessage(null);
    setOfflineGraceDaysRemaining(0);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return (
    <LicenseContext.Provider
      value={{
        status,
        license,
        errorMessage,
        isRevalidating,
        offlineGraceDaysRemaining,
        login,
        revalidate,
        logout,
        clearError
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseContextType => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense debe ser usado dentro de un LicenseProvider');
  }
  return context;
};
