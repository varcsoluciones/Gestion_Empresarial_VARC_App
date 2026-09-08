import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { AccentColor, ThemeMode } from '../types/erp';
import {
  Palette,
  Sun,
  Moon,
  Building,
  RotateCcw,
  Save,
  Check
} from 'lucide-react';

const accents: { key: AccentColor; name: string; hex: string; description: string }[] = [
  { key: 'blue', name: 'Azul Cupertino', hex: '#007aff', description: 'System Blue icónico de Apple' },
  { key: 'purple', name: 'Púrpura Apple', hex: '#5856d6', description: 'System Purple elegante y moderno' },
  { key: 'green', name: 'Verde Apple', hex: '#34c759', description: 'System Green financiero y fresco' },
  { key: 'orange', name: 'Naranja Apple', hex: '#ff9500', description: 'System Orange cálido y dinámico' },
  { key: 'pink', name: 'Rosa Apple', hex: '#ff2d55', description: 'System Pink vibrante y sofisticado' },
  { key: 'teal', name: 'Turquesa Apple', hex: '#00c7be', description: 'System Teal balanceado y limpio' },
  { key: 'graphite', name: 'Gris Espacial', hex: '#636366', description: 'Space Gray minimalista y ejecutivo' }
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = useERP();

  const [formData, setFormData] = useState({
    nombreEmpresa: settings.nombreEmpresa,
    identificacionFiscal: settings.identificacionFiscal,
    moneda: settings.moneda,
    monedaSimbolo: settings.monedaSimbolo,
    tasaImpuestoDefecto: settings.tasaImpuestoDefecto,
    criterioProrrateoDefecto: settings.criterioProrrateoDefecto || 'costo_material',
    direccion: settings.direccion,
    telefono: settings.telefono,
    email: settings.email,
    website: settings.website || '',
    pieFactura: settings.pieFactura || ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    updateSettings({ tema: mode });
  };

  const handleAccentChange = (accent: AccentColor) => {
    updateSettings({ colorAcento: accent });
  };

  const handleResetData = () => {
    resetToDemoData();
    setResetConfirm(false);
  };

  return (
    <div className="page-content" style={{ maxWidth: '1000px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración del Sistema</h1>
          <p className="page-description">
            Personaliza la identidad visual (temas y acentos) y los datos fiscales de tu empresa.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 1. Appearance & Themes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Palette size={18} style={{ color: 'var(--color-accent)' }} />
              Apariencia & Personalización Visual (Estilo Apple)
            </h2>
            <p className="card-subtitle">Selector de modo y paleta de acentos del sistema</p>
          </div>

          {/* Theme Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Modo de Interfaz
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div
                onClick={() => handleThemeChange('light')}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: settings.tema === 'light' ? '2px solid var(--color-accent)' : '1px solid var(--border-default)',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: settings.tema === 'light' ? '0 4px 12px var(--color-accent-glow)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                  <Sun size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Modo Claro</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Fondo blanco limpio con máximo contraste</div>
                </div>
                {settings.tema === 'light' && <Check size={18} style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />}
              </div>

              <div
                onClick={() => handleThemeChange('dark')}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: settings.tema === 'dark' ? '2px solid var(--color-accent)' : '1px solid var(--border-default)',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: settings.tema === 'dark' ? '0 4px 12px var(--color-accent-glow)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', backgroundColor: '#1e293b', color: '#f8fafc' }}>
                  <Moon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Modo Oscuro</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Paleta profunda ideal para trabajo nocturno</div>
                </div>
                {settings.tema === 'dark' && <Check size={18} style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />}
              </div>
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              Color de Acento del Sistema (Paleta Apple)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
              {accents.map((acc) => {
                const isSelected = settings.colorAcento === acc.key || 
                  (acc.key === 'blue' && settings.colorAcento === 'sapphire') ||
                  (acc.key === 'purple' && settings.colorAcento === 'indigo') ||
                  (acc.key === 'green' && settings.colorAcento === 'emerald') ||
                  (acc.key === 'orange' && settings.colorAcento === 'amber') ||
                  (acc.key === 'pink' && settings.colorAcento === 'rose') ||
                  (acc.key === 'graphite' && settings.colorAcento === 'slate');

                return (
                  <div
                    key={acc.key}
                    onClick={() => handleAccentChange(acc.key)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${acc.hex}` : '1px solid var(--border-default)',
                      backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      boxShadow: isSelected ? `0 2px 8px ${acc.hex}33` : 'none',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: acc.hex,
                        boxShadow: `0 2px 6px ${acc.hex}66`,
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Company Profile & Tax Settings */}
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} style={{ color: 'var(--color-accent)' }} />
              Datos Generales de la Empresa
            </h2>
            <p className="card-subtitle">Información fiscal, contable y comercial impresa en documentos</p>
          </div>

          {/* Section 1: Identificación Fiscal */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Identificación & Razón Social
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Nombre Comercial / Razón Social <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombreEmpresa}
                  onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  RFC / Identificación Fiscal <span className="form-label-required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.identificacionFiscal}
                  onChange={(e) => setFormData({ ...formData, identificacionFiscal: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parámetros Monetarios & Contabilidad */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Parámetros Monetarios & Regla de Costeo
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Moneda Principal</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  placeholder="MXN, USD, EUR..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Símbolo de Moneda</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.monedaSimbolo}
                  onChange={(e) => setFormData({ ...formData, monedaSimbolo: e.target.value })}
                  placeholder="$, €, £..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tasa de Impuesto / IVA Defecto (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.tasaImpuestoDefecto}
                  onChange={(e) => setFormData({ ...formData, tasaImpuestoDefecto: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Base de Prorrateo Contable por Defecto</label>
                <select
                  className="form-control"
                  value={formData.criterioProrrateoDefecto}
                  onChange={(e) => setFormData({ ...formData, criterioProrrateoDefecto: e.target.value as any })}
                >
                  <option value="costo_material">💎 Costo de Material Directo (Recomendado)</option>
                  <option value="valor_venta">🏷️ Precio de Venta (Capacidad de Ingresos)</option>
                  <option value="unidades_iguales">⚖️ Unidades Físicas Iguales (Lineal)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Ubicación y Contacto */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Ubicación & Contacto Comercial
            </h3>
            <div className="form-grid-3">
              <div className="form-group col-span-full">
                <label className="form-label">Dirección Fiscal / Ubicación Física</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono de Atención</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sitio Web</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Documentos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 className="form-section-title">
              Pie de Página en Facturas & Cotizaciones
            </h3>
            <div className="form-group">
              <label className="form-label">Leyenda / Términos Comerciales Impresos</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={formData.pieFactura}
                onChange={(e) => setFormData({ ...formData, pieFactura: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isSaved ? <Check size={18} /> : <Save size={18} />}
              {isSaved ? '¡Configuración Guardada!' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {/* 3. Demo Data Management */}
        <div className="card" style={{ borderColor: 'var(--color-warning-border)' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning-text)' }}>
                <RotateCcw size={18} />
                Gestión de Datos & Reset de Demostración
              </h2>
              <p className="card-subtitle">Recarga el catálogo modelo de tienda de ropa para pruebas</p>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Si deseas reiniciar el sistema a su estado inicial de demostración (con las playeras, jeans, sudaderas, compras recibidas, facturas, gastos y activos fijos del caso de estudio), haz clic en el siguiente botón:
          </p>

          {!resetConfirm ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setResetConfirm(true)}
            >
              <RotateCcw size={15} />
              Cargar Datos Iniciales de Demostración (Tienda de Ropa)
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                ¿Confirmas restablecer todos los datos a la demostración inicial?
              </span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleResetData}
              >
                Sí, Restablecer
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setResetConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
