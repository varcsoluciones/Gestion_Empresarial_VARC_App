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
  { key: 'indigo', name: 'Índigo Apple', hex: '#6366f1', description: 'Elegante, moderno y tecnológico' },
  { key: 'emerald', name: 'Esmeralda', hex: '#10b981', description: 'Financiero, fresco y confiable' },
  { key: 'sapphire', name: 'Zafiro Clásico', hex: '#0284c7', description: 'Corporativo, formal y profesional' },
  { key: 'rose', name: 'Rosa Boutique', hex: '#f43f5e', description: 'Vibrante, ideal para moda y diseño' },
  { key: 'amber', name: 'Ámbar Cálido', hex: '#d97706', description: 'Enérgico, artesanal y dinámico' },
  { key: 'slate', name: 'Grafito Minimalista', hex: '#475569', description: 'Sobrio, neutral y ejecutivo' }
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = useERP();

  const [formData, setFormData] = useState({
    nombreEmpresa: settings.nombreEmpresa,
    identificacionFiscal: settings.identificacionFiscal,
    moneda: settings.moneda,
    monedaSimbolo: settings.monedaSimbolo,
    tasaImpuestoDefecto: settings.tasaImpuestoDefecto,
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
              Apariencia & Personalización Visual
            </h2>
            <p className="card-subtitle">Selector de modo y paleta de acentos estilo Apple</p>
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
              Color de Acento del Sistema
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {accents.map((acc) => {
                const isSelected = settings.colorAcento === acc.key;
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
            <p className="card-subtitle">Información impresa en facturas, cotizaciones y reportes</p>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Nombre Comercial / Razón Social *</label>
              <input
                type="text"
                className="form-control"
                value={formData.nombreEmpresa}
                onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">RFC / Identificación Fiscal *</label>
              <input
                type="text"
                className="form-control"
                value={formData.identificacionFiscal}
                onChange={(e) => setFormData({ ...formData, identificacionFiscal: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Moneda Principal</label>
              <input
                type="text"
                className="form-control"
                value={formData.moneda}
                onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Símbolo de Moneda</label>
              <input
                type="text"
                className="form-control"
                value={formData.monedaSimbolo}
                onChange={(e) => setFormData({ ...formData, monedaSimbolo: e.target.value })}
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
          </div>

          <div className="form-group">
            <label className="form-label">Dirección Fiscal / Ubicación</label>
            <input
              type="text"
              className="form-control"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            />
          </div>

          <div className="form-row">
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

          <div className="form-group">
            <label className="form-label">Leyenda / Pie de Página en Documentos</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.pieFactura}
              onChange={(e) => setFormData({ ...formData, pieFactura: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              {isSaved ? <Check size={16} /> : <Save size={16} />}
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
