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
  AlertTriangle,
  Trash2,
  Database,
  DollarSign,
  Languages,
  SlidersHorizontal,
  Calendar,
  Lock,
  Percent,
  Info
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { formatDateTime } from '../utils/formatters';
import { validateAndParseBackupJSON, type FullERPData } from '../utils/backupExportUtils';
import { APP_NAME, APP_BRAND, APP_VERSION } from '../config/version';

const accents: { key: AccentColor; name: string; hex: string; description: string }[] = [
  { key: 'blue', name: 'Azul Cupertino', hex: '#007aff', description: 'System Blue icónico y elegante' },
  { key: 'navy', name: 'Azul Marino / Zafiro', hex: '#1d4ed8', description: 'Azul formal, corporativo y de alta confianza' },
  { key: 'cyan', name: 'Cian Cielo', hex: '#0284c7', description: 'Fresco, moderno y de alta legibilidad' },
  { key: 'teal', name: 'Turquesa Apple', hex: '#00c7be', description: 'Balanceado, sobrio y limpio' },
  { key: 'green', name: 'Verde Esmeralda', hex: '#16a34a', description: 'Positivo, financiero y rentable' },
  { key: 'forest', name: 'Verde Bosque / Pino', hex: '#047857', description: 'Sobrio, ejecutivo y natural' },
  { key: 'yellow', name: 'Amarillo Solar / Oro', hex: '#eab308', description: 'Vibrante, luminoso, cálido y de alta energía' },
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
    resetAllERPData,
    products,
    categories,
    clients,
    suppliers,
    invoices,
    purchases,
    quotes,
    inventoryMovements,
    expenses,
    fixedAssets,
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
    capitalAportado: settings.capitalAportado !== undefined ? settings.capitalAportado : 0,
    direccion: settings.direccion,
    telefono: settings.telefono,
    email: settings.email,
    website: settings.website || '',
    pieFactura: settings.pieFactura || '',
    restriccionFechasModo: settings.restriccionFechasModo || 'warning',
    diasMargenFuturo: typeof settings.diasMargenFuturo === 'number' ? settings.diasMargenFuturo : 1,
    exigirCierrePeriodoAnterior: settings.exigirCierrePeriodoAnterior || false
  });

  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'accounting_rules' | 'appearance' | 'data'>('company');

  // Backup & Restore State
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<FullERPData | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Reset Database State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetAcknowledged, setIsResetAcknowledged] = useState(false);
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);

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

  const handleOpenResetModal = () => {
    setIsResetAcknowledged(false);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    resetAllERPData();
    setIsResetModalOpen(false);
    setIsResetAcknowledged(false);
    setResetToastMessage('¡Toda la información ha sido eliminada y la base de datos se ha restablecido desde cero!');
    setTimeout(() => setResetToastMessage(null), 5000);
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
          className={`tab-btn ${activeTab === 'accounting_rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounting_rules')}
        >
          <SlidersHorizontal size={16} />
          Cierre & Políticas Contables
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
            <div className="form-grid-3">
              <div className="form-group col-span-2">
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
                  style={{ maxWidth: '280px' }}
                  value={formData.identificacionFiscal}
                  onChange={(e) => setFormData({ ...formData, identificacionFiscal: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Parámetros Monetarios & Idioma */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Moneda, Idioma & Parámetros Financieros
            </h3>
            <div className="form-grid-3">
              {/* Dropdown 1: Moneda de América */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.currencyLabel} <span className="form-label-required">*</span>
                </label>
                <ComboboxInline
                  options={AMERICAS_CURRENCIES.map((curr) => ({
                    id: curr.code,
                    label: curr.name[lang] || curr.name.es,
                    sublabel: `${curr.code} (${curr.symbol})`
                  }))}
                  value={formData.moneda}
                  onChange={(val) => handleCurrencySelect(val)}
                  placeholder="Seleccionar moneda..."
                  searchPlaceholder="Buscar moneda o país..."
                  buttonStyle={{ width: '100%', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  {t.settings.currencyHelp} (Símbolo activo: <strong>{formData.monedaSimbolo}</strong>)
                </span>
              </div>

              {/* Dropdown 2: Idioma de la Aplicación (Español, Inglés, Portugués) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Languages size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.languageLabel} <span className="form-label-required">*</span>
                </label>
                <ComboboxInline
                  options={APP_LANGUAGES.map((langOpt) => ({
                    id: langOpt.code,
                    label: `${langOpt.name} (${langOpt.shortCode})`
                  }))}
                  value={formData.idioma}
                  onChange={(val) => handleLanguageSelect(val as AppLanguage)}
                  placeholder="Seleccionar idioma..."
                  hideSearch={true}
                  buttonStyle={{ width: '100%', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  {t.settings.languageHelp}
                </span>
              </div>

              {/* Tasa Impuesto */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Percent size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.defaultTax}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '110px', textAlign: 'center', fontWeight: 600 }}
                    value={formData.tasaImpuestoDefecto}
                    onChange={(e) => setFormData({ ...formData, tasaImpuestoDefecto: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>%</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Tasa sugerida en transacciones gravadas.
                </span>
              </div>

              {/* Capital Aportado Inicial */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={15} style={{ color: 'var(--color-accent)' }} />
                  Capital Aportado Inicial
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '24px' }}>
                    {formData.monedaSimbolo || '$'}
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    style={{ maxWidth: '180px', fontWeight: 600 }}
                    value={formData.capitalAportado !== undefined ? formData.capitalAportado : ''}
                    onChange={(e) => setFormData({ ...formData, capitalAportado: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Fondo o capital social aportado.
                </span>
              </div>

              {/* Tarjeta informativa en las 2 columnas restantes */}
              <div className="col-span-2" style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                marginTop: '0.25rem'
              }}>
                <Info size={20} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                    Impacto en Balance General & Finanzas
                  </strong>
                  El capital aportado establece el patrimonio inicial para computar la liquidez neta y el efectivo disponible real en reportes contables.
                </div>
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

          {/* Footer with Save button (Left aligned) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)' }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isSaved ? <Check size={18} /> : <Save size={18} />}
              {isSaved ? t.settings.savedSuccess : t.common.save}
            </button>
            {isSaved && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}>
                <Check size={14} /> Datos guardados exitosamente
              </span>
            )}
          </div>
        </form>
        )}

        {/* 3. Accounting Policies & Period Control Tab */}
        {activeTab === 'accounting_rules' && (
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={18} style={{ color: 'var(--color-accent)' }} />
              Políticas Contables & Control de Periodos
            </h2>
            <p className="card-subtitle">
              Criterio institucional de prorrateo de costos operativos y reglas de restricción de fechas para cierre contable
            </p>
          </div>

          {/* Section 1: Criterio Institucional de Prorrateo de Costos */}
          <div className="form-section-divider">
            <h3 className="form-section-title">
              Criterio Institucional de Prorrateo de Costos
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.45, textAlign: 'left' }}>
              Define la fórmula oficial con la que el sistema absorbe los gastos fijos, gastos variables y depreciaciones entre los productos del catálogo en los reportes de Costo Real y Contabilidad.
            </p>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <SlidersHorizontal size={15} style={{ color: 'var(--color-accent)' }} />
                  {t.settings.prorrateoSection} <span className="form-label-required">*</span>
                </label>
                <ComboboxInline
                  options={[
                    { id: 'costo_material', label: t.settings.ruleMaterialTitle },
                    { id: 'valor_venta', label: t.settings.rulePriceTitle },
                    { id: 'unidades_iguales', label: t.settings.ruleUnitsTitle },
                  ]}
                  value={formData.criterioProrrateoDefecto}
                  onChange={(val) => setFormData({ ...formData, criterioProrrateoDefecto: val as any })}
                  placeholder="Seleccionar regla..."
                  hideSearch={true}
                  buttonStyle={{ width: '100%', fontWeight: 600 }}
                />
              </div>

              {/* Informative breakdown card for the selected criterion occupying 2 columns */}
              <div
                className="col-span-2"
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    Criterio Activo
                  </span>
                  {formData.criterioProrrateoDefecto === 'costo_material' && 'Proporcional al Costo de Material / Compra'}
                  {formData.criterioProrrateoDefecto === 'valor_venta' && 'Proporcional al Valor de Venta (Precio)'}
                  {formData.criterioProrrateoDefecto === 'unidades_iguales' && 'Por Unidades Iguales (Lineal / Volumen)'}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {formData.criterioProrrateoDefecto === 'costo_material' && t.settings.ruleMaterialDesc}
                  {formData.criterioProrrateoDefecto === 'valor_venta' && t.settings.rulePriceDesc}
                  {formData.criterioProrrateoDefecto === 'unidades_iguales' && t.settings.ruleUnitsDesc}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Restricción de Fechas en Registros & Control de Periodos */}
          <div className="form-section-divider">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 className="form-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={17} style={{ color: 'var(--color-accent)' }} />
                Restricción de Fechas en Registros & Control de Periodos
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.45, textAlign: 'left' }}>
              Configura el comportamiento del sistema al ingresar fechas en facturas, cotizaciones, compras, gastos y activos fijos para proteger los periodos cerrados y evitar registros extemporáneos.
            </p>

            {/* 3 Modes Selection Cards */}
            <div className="form-grid-3" style={{ marginBottom: '1.5rem' }}>
              
              {/* Mode 1: Sin Restricción */}
              <div
                onClick={() => setFormData({ ...formData, restriccionFechasModo: 'none' })}
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: formData.restriccionFechasModo === 'none' ? '2px solid var(--color-accent)' : '1px solid var(--border-default)',
                  backgroundColor: formData.restriccionFechasModo === 'none' ? 'var(--color-accent-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: formData.restriccionFechasModo === 'none' ? '5px solid var(--color-accent)' : '2px solid var(--border-default)',
                      backgroundColor: 'transparent'
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Sin restricción
                    </span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Permisivo</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Permite cualquier fecha pasada o futura, sin avisos ni confirmaciones adicionales.
                </p>
                <div style={{
                  padding: '0.65rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderLeft: '3px solid var(--color-warning)',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  textAlign: 'left'
                }}>
                  <strong>Riesgo:</strong> Los reportes de meses ya cerrados pueden verse alterados si registras algo con fecha atrasada por error.
                </div>
              </div>

              {/* Mode 2: Advertencia (Recomendado) */}
              <div
                onClick={() => setFormData({ ...formData, restriccionFechasModo: 'warning' })}
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: formData.restriccionFechasModo === 'warning' ? '2px solid var(--color-accent)' : '1px solid var(--border-default)',
                  backgroundColor: formData.restriccionFechasModo === 'warning' ? 'var(--color-accent-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: formData.restriccionFechasModo === 'warning' ? '5px solid var(--color-accent)' : '2px solid var(--border-default)',
                      backgroundColor: 'transparent'
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Advertencia
                    </span>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Recomendado (Default)</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Si la fecha cae en un mes ya cerrado o es fecha futura, muestra confirmación explicando la consecuencia antes de guardar.
                </p>
                <div style={{
                  padding: '0.65rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderLeft: '3px solid var(--color-accent)',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  textAlign: 'left'
                }}>
                  <strong>Riesgo:</strong> Vas a poder continuar incluso si el sistema te advierte, así que un clic apresurado en "Confirmar" no te protege del todo.
                </div>
              </div>

              {/* Mode 3: Bloqueo Total */}
              <div
                onClick={() => setFormData({ ...formData, restriccionFechasModo: 'strict' })}
                style={{
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  border: formData.restriccionFechasModo === 'strict' ? '2px solid var(--color-accent)' : '1px solid var(--border-default)',
                  backgroundColor: formData.restriccionFechasModo === 'strict' ? 'var(--color-accent-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: formData.restriccionFechasModo === 'strict' ? '5px solid var(--color-accent)' : '2px solid var(--border-default)',
                      backgroundColor: 'transparent'
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Bloqueo total
                    </span>
                  </div>
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Máximo Control</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  No permite guardar si la fecha cae en un mes cerrado o es una fecha futura más allá del margen permitido.
                </p>
                <div style={{
                  padding: '0.65rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderLeft: '3px solid var(--color-danger)',
                  fontSize: '0.775rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.35,
                  textAlign: 'left'
                }}>
                  <strong>Riesgo:</strong> Si necesitas corregir algo de un mes cerrado, vas a tener que reabrir el periodo primero (ver función de cierre de periodo).
                </div>
              </div>

            </div>

            {/* Inputs: Días de margen y Opción avanzada en form-grid-3 */}
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} style={{ color: 'var(--color-accent)' }} />
                  Margen a futuro
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-control"
                    style={{ width: '100px', textAlign: 'center', fontWeight: 600 }}
                    value={formData.diasMargenFuturo}
                    onChange={(e) => setFormData({ ...formData, diasMargenFuturo: Math.max(0, parseInt(e.target.value) || 0) })}
                    min={0}
                    max={30}
                    required
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    día(s)
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: 'left' }}>
                  Tolerancia para registros futuros (default: 1 día por husos horarios).
                </span>
              </div>

              <div className="form-group col-span-2" style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Lock size={15} style={{ color: 'var(--color-accent)' }} />
                  Control de periodos consecutivos
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Avanzado</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  textAlign: 'left'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.exigirCierrePeriodoAnterior}
                    onChange={(e) => setFormData({ ...formData, exigirCierrePeriodoAnterior: e.target.checked })}
                    style={{ marginTop: '0.2rem', width: '17px', height: '17px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                      Exigir cierre formal del periodo anterior
                    </strong>
                    Bloquear o advertir registros en el mes en curso si el mes anterior con movimientos aún no ha sido cerrado formalmente en Contabilidad.
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Footer with Save button (Left aligned) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)' }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isSaved ? <Check size={18} /> : <Save size={18} />}
              {isSaved ? t.settings.savedSuccess : t.common.save}
            </button>
            {isSaved && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}>
                <Check size={14} /> Políticas guardadas exitosamente
              </span>
            )}
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

          {resetToastMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              color: 'var(--color-success-text)',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              <CheckCircle2 size={18} />
              <span>{resetToastMessage}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 3.1 Export & Backup Actions Grid */}
            <div className="form-grid-3">
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
                    {settings.ultimoRespaldoAutomatico ? formatDateTime(settings.ultimoRespaldoAutomatico) : 'Sin registros previos'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Periodo Vigente:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>{settings.ultimoRespaldoPeriodo || 'No registrado'}</strong>
                </div>
              </div>
            </div>

            {/* 3.3 Danger Zone: Reset and Wipe all database */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-danger-border)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '0.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-danger)' }}>
                      Restablecer y Borrar Toda la Información
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Elimina de forma irreversible todos los registros cargados (catálogo, ventas, compras, kardex, clientes, gastos) para comenzar en blanco
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleOpenResetModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  <Trash2 size={15} />
                  Restablecer y Borrar Todo
                </button>
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

      {/* Reset & Wipe Database Confirmation Modal */}
      {isResetModalOpen && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => {
            setIsResetModalOpen(false);
            setIsResetAcknowledged(false);
          }}
          title="⚠️ Restablecer y Borrar Toda la Información"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Critical Warning Alert */}
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              lineHeight: 1.5
            }}>
              <AlertTriangle size={22} style={{ flexShrink: 0, color: 'var(--color-danger)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  ¡ADVERTENCIA CRÍTICA E IRREVERSIBLE!
                </strong>
                Esta acción eliminará de forma permanente <strong>toda la información cargada</strong> en el sistema. Todos los catálogos, productos, existencias, movimientos de Kardex, órdenes de compra, facturas, cotizaciones, clientes, proveedores, gastos y activos fijos serán borrados para que la aplicación comience completamente en blanco desde cero.
              </div>
            </div>

            {/* Current Data Summary */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
                Registros que serán eliminados permanentemente ({products.length + categories.length + invoices.length + quotes.length + purchases.length + inventoryMovements.length + clients.length + suppliers.length + expenses.length + fixedAssets.length} registros en total):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.6rem' }}>
                <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  📦 <strong>Productos y Categorías:</strong> {products.length} / {categories.length}
                </div>
                <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  📄 <strong>Facturas y Cotizaciones:</strong> {invoices.length} / {quotes.length}
                </div>
                <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  🛒 <strong>Órdenes de Compra:</strong> {purchases.length}
                </div>
                <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  📊 <strong>Movimientos Kardex:</strong> {inventoryMovements.length}
                </div>
                <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  👥 <strong>Clientes y Proveedores:</strong> {clients.length} / {suppliers.length}
                </div>
                <div style={{ padding: '0.45rem 0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  💰 <strong>Gastos y Activos Fijos:</strong> {expenses.length} / {fixedAssets.length}
                </div>
              </div>
            </div>

            {/* Quick Preventive Backup recommendation */}
            <div style={{
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-info-bg)',
              border: '1px solid var(--color-info-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-info)' }}>
                💡 <strong>Consejo de seguridad:</strong> Te recomendamos descargar un archivo de respaldo JSON antes de continuar.
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => exportBackupJSON(false)}
                style={{ fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Download size={13} />
                Descargar Respaldo Preventivo
              </button>
            </div>

            {/* Mandatory confirmation checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isResetAcknowledged ? 'var(--color-danger-bg)' : 'var(--bg-surface)',
              border: isResetAcknowledged ? '1px solid var(--color-danger)' : '1px solid var(--border-default)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all var(--transition-fast)'
            }}>
              <input
                type="checkbox"
                checked={isResetAcknowledged}
                onChange={(e) => setIsResetAcknowledged(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-danger)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isResetAcknowledged ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                Entiendo que esta acción no se puede deshacer y confirmo que deseo borrar toda la información para empezar de cero.
              </span>
            </label>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setIsResetAcknowledged(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmReset}
                disabled={!isResetAcknowledged}
                style={{
                  opacity: isResetAcknowledged ? 1 : 0.45,
                  cursor: isResetAcknowledged ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700
                }}
              >
                <Trash2 size={16} />
                Confirmar y Restablecer de Cero
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
