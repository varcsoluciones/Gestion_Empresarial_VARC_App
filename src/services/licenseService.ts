export const APP_ID = 'gestor_modular';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://jofeflzvsmaogjpoxabc.supabase.co').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2x893sLjRl3AMXAWg69vEg_flAOq4Bd';

export const OFFLINE_GRACE_DAYS = 7;
const STORAGE_KEY = 'varc_erp_license_session';

export interface LicenseRpcResponse {
  valido: boolean;
  vigente_hasta: string | null;
  mensaje: string;
}

export type LicenseStatus = 'active' | 'expired' | 'deactivated' | 'unlicensed' | 'offline_grace' | 'network_error';

export interface StoredLicenseSession {
  email: string;
  vigente_hasta: string | null;
  ultima_validacion: string; // ISO 8601 string
  app: string;
  status: 'active' | 'expired' | 'deactivated' | 'offline_grace';
  lastMessage?: string;
}

/**
 * Call Supabase RPC endpoint with timeout
 */
async function callRpc<T>(fnName: string, body: Record<string, any>, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Error en servidor de licencias (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validates email + PIN against Supabase (Initial activation)
 */
export async function validarLicencia(email: string, pin: string, app: string = APP_ID): Promise<LicenseRpcResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPin = pin.trim();

  const data = await callRpc<LicenseRpcResponse[]>('validar_licencia', {
    p_email: cleanEmail,
    p_pin: cleanPin,
    p_app: app
  });

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  throw new Error('Respuesta inesperada del servidor de licencias.');
}

/**
 * Revalidates license in background with email only (no PIN needed)
 */
export async function revalidarLicencia(email: string, app: string = APP_ID): Promise<LicenseRpcResponse> {
  const cleanEmail = email.trim().toLowerCase();

  const data = await callRpc<LicenseRpcResponse[]>('revalidar_licencia', {
    p_email: cleanEmail,
    p_app: app
  });

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  throw new Error('Respuesta inesperada del servidor de licencias.');
}

/**
 * Reads the stored license session from localStorage
 */
export function getStoredLicense(): StoredLicenseSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredLicenseSession;
    if (parsed && typeof parsed.email === 'string' && (parsed.app === APP_ID || parsed.app === 'erp')) {
      parsed.app = APP_ID;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves license session (NEVER stores the PIN)
 */
export function saveStoredLicense(session: StoredLicenseSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Error guardando sesión de licencia:', err);
  }
}

/**
 * Clears stored license session (Logout / Switch license)
 */
export function clearStoredLicense(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error eliminando sesión de licencia:', err);
  }
}

/**
 * Evaluates whether offline grace period applies
 */
export function checkOfflineGrace(stored: StoredLicenseSession): {
  isAllowed: boolean;
  status: LicenseStatus;
  reason: string;
  daysRemainingGrace: number;
} {
  const now = new Date();
  
  // 1. Check if the absolute expiration date has passed
  if (stored.vigente_hasta) {
    const expDate = new Date(`${stored.vigente_hasta}T23:59:59`);
    if (now > expDate) {
      return {
        isAllowed: false,
        status: 'expired',
        reason: 'Licencia vencida por calendario',
        daysRemainingGrace: 0
      };
    }
  }

  // 2. Check days since last online validation
  const lastVal = new Date(stored.ultima_validacion || 0);
  const diffMs = now.getTime() - lastVal.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemainingGrace = Math.max(0, OFFLINE_GRACE_DAYS - diffDays);

  if (diffDays <= OFFLINE_GRACE_DAYS) {
    return {
      isAllowed: true,
      status: 'offline_grace',
      reason: `Validación sin conexión activa (${daysRemainingGrace} días de gracia restantes)`,
      daysRemainingGrace
    };
  }

  return {
    isAllowed: false,
    status: 'network_error',
    reason: `El periodo de gracia sin conexión (${OFFLINE_GRACE_DAYS} días) ha expirado. Conéctate a internet para revalidar tu licencia.`,
    daysRemainingGrace: 0
  };
}
