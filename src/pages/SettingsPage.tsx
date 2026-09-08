import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { AccentColor, ThemeMode, AppLanguage } from '../types/erp';
import { useTranslation } from '../i18n/useTranslation';
import { AMERICAS_CURRENCIES, APP_LANGUAGES } from '../i18n/translations';
import {
  Palette,
  Sun,
  Moon,
  Building,
  Save,
  Check,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  DollarSign,
  Languages,
  SlidersHorizontal
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { formatDate } from '../utils/formatters';
import { validateAndParseBackupJSON, type FullERPData } from '../utils/backupExportUtils';
import { APP_NAME, APP_BRAND, APP_VERSION } from '../config/version';

const accents: { key: AccentColor; name: string; hex: string; description: string }[] = [
  { key: 'blue', name: 'Azul Cupertino', hex: '#007aff', description: 'System Blue icónico y elegante' },
  { key: 'navy', name: 'Azul Marino / Zafiro', hex: '#1d4ed8', description: 'Azul formal, corporativo y de alta confianza' },
  { key: 'cyan', name: 'Cian Cielo', hex: '#0284c7', description: 'Fresco, moderno y de alta legibilidad' },
  { key: 'teal', name: 'Turquesa Apple', hex: '#00c7be', description: 'Balanceado, sobrio y limpio' },
  { key: 'green', name: 'Verde Esmeralda', hex: '#16a34a', description: 'Positivo, financiero y rentable' },
  { key: 'forest', name: 'Verde Bosque / Pino', hex: '#047857', description: 'Sobrio, ejecutivo y natural' },
  { key: 'yellow', name: 'Amarillo Dorado', hex: '#ca8a04', description: 'Cálido, brillante y enérgico' },
  { key: 'orange', name: 'Naranja Ámbar', hex: '#ea580c', description: 'Dinámico, proactivo y comercial' },
  { key: 'wine', name: 'Rojo Vino / Borgoña', hex: '#be123c', description: 'Rojo vino refinado, intenso y vibrante' },
  { key: 'coffee', name: 'Café Moka / Espresso', hex: '#6c4a38', description: 'Café tostado cálido, acogedor y artesanal' },
  { key: 'pink', name: 'Rosa Fucsia', hex: '#e11d48', description: 'Sofisticado, llamativo y creativo' },
  { key: 'purple', name: 'Púrpura Imperial', hex: '#7c3aed', description: 'Elegante, distintivo y tecnológico' },
  { key: 'indigo', name: 'Índigo Neón', hex: '#4f46e5', description: 'Profundo, moderno y de alto impacto' },
  { key: 'graphite', name: 'Gris Grafito Espacial', hex: '#4b5563', description: 'Space Gray minimalista, neutro y prémium' }
];

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackupJSON,
    exportExcel,
    restoreERPData,
    autoBackupToast,
    clearAutoBackupToast
  } = useERP();

  const { t, lang } = useTranslation();

  const [formData, setFormData] = useState({
    nombreEmpresa: settings.nombreEmpresa,
    identificacionFiscal: settings.identificacionFiscal,
    moneda: settings.moneda,
    monedaSimbolo: settings.monedaSimbolo,
    idioma: settings.idioma || 'es',
    tasaImpuestoDefecto: settings.tasaImpuestoDefecto,
    criterioProrrateoDefecto: settings.criterioProrrateoDefecto || 'costo_material',
    direccion: settings.direccion,
    telefono: settings.telefono,
    email: settings.email,
    website: settings.website || '',
    pieFactura: settings.pieFactura || ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'appearance' | 'data'>('company');

  // Backup & Restore State
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<FullERPData | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

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

  const handleCurrencySelect = (code: string) => {
    const selected = AMERICAS_CURRENCIES.find(c => c.code === code);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        moneda: selected.code,
        monedaSimbolo: selected.symbol
      }));
    }
  };

  const handleLanguageSelect = (langCode: AppLanguage) => {
    setFormData(prev => ({
      ...prev,
      idioma: langCode
    }));
    updateSettings({ idioma: langCode });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validateAndParseBackupJSON(content);
      if (!result.success || !result.data) {
        setImportError(result.error || 'Error al leer el archivo de respaldo.');
        return;
      }

      setPendingRestoreData(result.data);
      setIsRestoreModalOpen(true);
      setImportError(null);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;
    restoreERPData(pendingRestoreData);
    setIsRestoreModalOpen(false);
    setPendingRestoreData(null);
    setImportSuccess('¡Base de datos restaurada con éxito desde el archivo de respaldo!');
    setTimeout(() => setImportSuccess(null), 4000);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.settings.title}</h1>
          <p className="page-description">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          <Building size={16} />
          {t.settings.companyProfile}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          <Palette size={16} />
          {t.settings.themeAndAccent}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Database size={16} />
          {t.settings.dataManagement}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 1. Appearance & Themes */}
        {activeTab === 'appearance' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Palette size={18} style={{ color: 'var(--color-accent)' }} />
              {t.settings.themeAndAccent}
            </h2>
            <p className="card-subtitle">{t.settings.colorPaletteTitle}</p>
          </div>

          {/* Theme Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              {t.settings.themeModeTitle}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
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
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.settings.themeLight}</div>
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
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.settings.themeDark}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Paleta profunda ideal para trabajo nocturno</div>
                </div>
                {settings.tema === 'dark' && <Check size={18} style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />}
              </div>
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>
              {t.settings.colorPaletteTitle}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
              {accents.map((acc) => {
                const isSelected = settings.colorAcento === acc.key || 
                  (acc.key === 'blue' && settings.colorAcento === 'sapphire') ||
                  (acc.key === 'green' && settings.colorAcento === 'emerald') ||
                  (acc.key === 'yellow' && settings.colorAcento === 'amarillo') ||
                  (acc.key === 'orange' && settings.colorAcento === 'amber') ||
                  (acc.key === 'pink' && settings.colorAcento === 'rose') ||
                  (acc.key === 'wine' && settings.colorAcento === 'vino') ||
                  (acc.key === 'coffee' && (settings.colorAcento as any) === 'cafe') ||
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
        )}

        {/* 2. Company Profile & Tax Settings */}
        {activeTab === 'company' && (
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} style={{ color: 'var(--color-accent)' }} />
              {t.settings.companyProfile}
            </h2>
            <p className="card-subtitle">Información fiscal, comercial, moneda e idioma del sistema</p>
          </div>

          {/* Section 1: Identificación Fiscal */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Identificación & Razón Social
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  {t.settings.companyName} <span className="form-label-required">*</span>
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
                  {t.settings.taxId} <span className="form-label-required">*</span>
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

          {/* Section 2: Parámetros Monetarios, Idioma & Regla de Prorrateo */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Moneda, Idioma & Regla de Prorrateo Contable
            </h3>
            <div className="form-grid-2">
              {/* Dropdown 1: Moneda de América */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.currencyLabel} <span className="form-label-required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formData.moneda}
                  onChange={(e) => handleCurrencySelect(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  {AMERICAS_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name[lang] || curr.name.es}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {t.settings.currencyHelp} (Símbolo activo: <strong>{formData.monedaSimbolo}</strong>)
                </span>
              </div>

              {/* Dropdown 2: Idioma de la Aplicación (Español, Inglés, Portugués) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Languages size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.languageLabel} <span className="form-label-required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formData.idioma}
                  onChange={(e) => handleLanguageSelect(e.target.value as AppLanguage)}
                  style={{ fontWeight: 600 }}
                >
                  {APP_LANGUAGES.map((langOpt) => (
                    <option key={langOpt.code} value={langOpt.code}>
                      {langOpt.name} ({langOpt.shortCode})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {t.settings.languageHelp}
                </span>
              </div>

              {/* Tasa Impuesto */}
              <div className="form-group">
                <label className="form-label">
                  {t.settings.defaultTax}
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.tasaImpuestoDefecto}
                  onChange={(e) => setFormData({ ...formData, tasaImpuestoDefecto: Number(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>

              {/* Regla de Prorrateo Contable Institucional */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <SlidersHorizontal size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.prorrateoSection}
                </label>
                <select
                  className="form-control"
                  value={formData.criterioProrrateoDefecto}
                  onChange={(e) => setFormData({ ...formData, criterioProrrateoDefecto: e.target.value as any })}
                  style={{ fontWeight: 600 }}
                >
                  <option value="costo_material">{t.settings.ruleMaterialTitle}</option>
                  <option value="valor_venta">{t.settings.rulePriceTitle}</option>
                  <option value="unidades_iguales">{t.settings.ruleUnitsTitle}</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {formData.criterioProrrateoDefecto === 'costo_material' && t.settings.ruleMaterialDesc}
                  {formData.criterioProrrateoDefecto === 'valor_venta' && t.settings.rulePriceDesc}
                  {formData.criterioProrrateoDefecto === 'unidades_iguales' && t.settings.ruleUnitsDesc}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Ubicación y Contacto */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              {t.settings.contactAddress}
            </h3>
            <div className="form-grid-3">
              <div className="form-group col-span-full">
                <label className="form-label">{t.settings.address}</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.settings.phone}</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.settings.email}</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.settings.website}</label>
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
              {t.settings.invoiceFooter}
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
              {isSaved ? t.settings.savedSuccess : t.common.save}
            </button>
          </div>
        </form>
        )}

        {/* 3. Data Management, Backups & Exports */}
        {activeTab === 'data' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={18} style={{ color: 'var(--color-accent)' }} />
                {t.settings.dataManagement}
              </h2>
              <p className="card-subtitle">
                Exporta tus datos a JSON o Excel (.xlsx), restaura copias de seguridad y configura el respaldo mensual automático
              </p>
            </div>
          </div>

          {/* Toast / Notification Alerts */}
          {autoBackupToast && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              color: 'var(--color-success-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} />
                <span>{autoBackupToast}</span>
              </div>
              <button
                type="button"
                onClick={clearAutoBackupToast}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Cerrar
              </button>
            </div>
          )}

          {importSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              color: 'var(--color-success-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{importSuccess}</span>
            </div>
          )}

          {importError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{importError}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 3.1 Export & Backup Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Card 1: Descarga JSON */}
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                      <FileJson size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Copia de Seguridad (.json)</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Descarga un archivo estructurado con todas las tablas del ERP (Ventas, Compras, Kardex, Clientes, Gastos, Activos) para respaldo o migración.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => exportBackupJSON(false)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Download size={15} />
                  Descargar Respaldo JSON
                </button>
              </div>

              {/* Card 2: Exportar Excel */}
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(52, 199, 89, 0.15)', color: '#34c759' }}>
                      <FileSpreadsheet size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Reporte en Excel (.xlsx)</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Genera un libro de trabajo completo en Excel con 9 hojas tabuladas (Productos, Variantes, Facturas, Kardex, Proveedores, etc.).
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={exportExcel}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Download size={15} />
                  Descargar Libro Excel (.xlsx)
                </button>
              </div>

              {/* Card 3: Restaurar Datos */}
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                      <Upload size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Restaurar / Reemplazar</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Sube un archivo de respaldo JSON previamente descargado para reemplazar los datos actuales en el sistema.
                  </p>
                </div>
                <label
                  className="btn btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  <Upload size={15} />
                  Cargar Archivo de Respaldo (.json)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelected}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* 3.2 Monthly Automatic Backup Controls */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: settings.respaldoAutomaticoActivo ? 'var(--color-accent-subtle)' : 'var(--bg-subtle)',
                    color: settings.respaldoAutomaticoActivo ? 'var(--color-accent)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Respaldo Automático Mensual</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Descarga automática del archivo de respaldo una vez al mes al iniciar operaciones
                    </div>
                  </div>
                </div>

                {/* iOS Style Switch Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: settings.respaldoAutomaticoActivo ? 'var(--color-accent)' : 'var(--text-muted)' }}>
                    {settings.respaldoAutomaticoActivo ? 'Activado' : 'Desactivado'}
                  </span>
                  <div
                    onClick={() => updateSettings({ respaldoAutomaticoActivo: !settings.respaldoAutomaticoActivo })}
                    style={{
                      width: '46px',
                      height: '26px',
                      borderRadius: '13px',
                      backgroundColor: settings.respaldoAutomaticoActivo ? 'var(--color-accent)' : 'var(--border-strong)',
                      padding: '2px',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: settings.respaldoAutomaticoActivo ? '0 2px 6px var(--color-accent-glow)' : 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transform: settings.respaldoAutomaticoActivo ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform var(--transition-fast)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Last Backup Info Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                fontSize: '0.825rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Frecuencia de Respaldo:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>1 vez al mes (Automático)</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Último Respaldo Registrado:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {settings.ultimoRespaldoAutomatico ? formatDate(settings.ultimoRespaldoAutomatico) + ' ' + settings.ultimoRespaldoAutomatico.slice(11, 16) + ' hrs' : 'Sin registros previos'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Periodo Vigente:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>{settings.ultimoRespaldoPeriodo || 'No registrado'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* System Version & Information Footer */}
        <div style={{
          marginTop: '0.5rem',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-default)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {APP_NAME} — {APP_BRAND} <span style={{ color: 'var(--color-accent)' }}>v{APP_VERSION}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Control integral de ventas, compras, inventario permanente con Kardex, contabilidad y prorrateo de costos.
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Base de datos local limpia y preparada para operación | Versión de compilación: <strong>v{APP_VERSION}</strong>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {isRestoreModalOpen && pendingRestoreData && (
        <Modal
          isOpen={isRestoreModalOpen}
          onClose={() => {
            setIsRestoreModalOpen(false);
            setPendingRestoreData(null);
          }}
          title="Confirmar Restauración de Base de Datos"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              color: 'var(--color-warning-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong>Advertencia:</strong> Esta acción reemplazará todos los datos actuales del sistema por los contenidos en el archivo de respaldo seleccionado.
              </span>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Contenido del Respaldo:
              </div>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <li><strong>Empresa:</strong> {pendingRestoreData.settings?.nombreEmpresa || 'No especificada'}</li>
                <li><strong>Productos en catálogo:</strong> {pendingRestoreData.products.length} productos</li>
                <li><strong>Facturas / Ventas:</strong> {pendingRestoreData.invoices.length} facturas</li>
                <li><strong>Órdenes de Compra:</strong> {pendingRestoreData.purchases.length} compras</li>
                <li><strong>Movimientos en Kardex:</strong> {pendingRestoreData.inventoryMovements.length} registros</li>
                <li><strong>Clientes & Proveedores:</strong> {pendingRestoreData.clients.length} clientes, {pendingRestoreData.suppliers.length} proveedores</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setPendingRestoreData(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmRestore}
              >
                Sí, Reemplazar Datos
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
