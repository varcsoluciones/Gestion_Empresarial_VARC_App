import type { AppLanguage } from '../types/erp';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: Record<AppLanguage, string>;
}

export const AMERICAS_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: { es: 'Dólar Estadounidense (USD - $)', en: 'US Dollar (USD - $)', pt: 'Dólar Americano (USD - $)' } },
  { code: 'MXN', symbol: '$', name: { es: 'Peso Mexicano (MXN - $)', en: 'Mexican Peso (MXN - $)', pt: 'Peso Mexicano (MXN - $)' } },
  { code: 'BRL', symbol: 'R$', name: { es: 'Real Brasileño (BRL - R$)', en: 'Brazilian Real (BRL - R$)', pt: 'Real Brasileiro (BRL - R$)' } },
  { code: 'COP', symbol: '$', name: { es: 'Peso Colombiano (COP - $)', en: 'Colombian Peso (COP - $)', pt: 'Peso Colombiano (COP - $)' } },
  { code: 'CLP', symbol: '$', name: { es: 'Peso Chileno (CLP - $)', en: 'Chilean Peso (CLP - $)', pt: 'Peso Chileno (CLP - $)' } },
  { code: 'PEN', symbol: 'S/', name: { es: 'Sol Peruano (PEN - S/)', en: 'Peruvian Sol (PEN - S/)', pt: 'Sol Peruano (PEN - S/)' } },
  { code: 'ARS', symbol: '$', name: { es: 'Peso Argentino (ARS - $)', en: 'Argentine Peso (ARS - $)', pt: 'Peso Argentino (ARS - $)' } },
  { code: 'CAD', symbol: '$', name: { es: 'Dólar Canadiense (CAD - $)', en: 'Canadian Dollar (CAD - $)', pt: 'Dólar Canadense (CAD - $)' } },
  { code: 'CRC', symbol: '₡', name: { es: 'Colón Costarricense (CRC - ₡)', en: 'Costa Rican Colón (CRC - ₡)', pt: 'Colom Costarriquenho (CRC - ₡)' } },
  { code: 'GTQ', symbol: 'Q', name: { es: 'Quetzal Guatemalteco (GTQ - Q)', en: 'Guatemalan Quetzal (GTQ - Q)', pt: 'Quetzal Guatemalteco (GTQ - Q)' } },
  { code: 'DOP', symbol: 'RD$', name: { es: 'Peso Dominicano (DOP - RD$)', en: 'Dominican Peso (DOP - RD$)', pt: 'Peso Dominicano (DOP - RD$)' } },
  { code: 'UYU', symbol: '$U', name: { es: 'Peso Uruguayo (UYU - $U)', en: 'Uruguayan Peso (UYU - $U)', pt: 'Peso Uruguaio (UYU - $U)' } },
  { code: 'PAB', symbol: 'B/.', name: { es: 'Balboa Panameño (PAB - B/.)', en: 'Panamanian Balboa (PAB - B/.)', pt: 'Balboa Panamenho (PAB - B/.)' } },
  { code: 'BOB', symbol: 'Bs.', name: { es: 'Boliviano (BOB - Bs.)', en: 'Bolivian Boliviano (BOB - Bs)', pt: 'Boliviano (BOB - Bs.)' } },
  { code: 'HNL', symbol: 'L', name: { es: 'Lempira Hondureño (HNL - L)', en: 'Honduran Lempira (HNL - L)', pt: 'Lempira Hondurenha (HNL - L)' } },
  { code: 'NIO', symbol: 'C$', name: { es: 'Córdoba Nicaragüense (NIO - C$)', en: 'Nicaraguan Córdoba (NIO - C$)', pt: 'Córdoba Nicaraguense (NIO - C$)' } },
  { code: 'PYG', symbol: '₲', name: { es: 'Guaraní Paraguayo (PYG - ₲)', en: 'Paraguayan Guaraní (PYG - ₲)', pt: 'Guarani Paraguaio (PYG - ₲)' } }
];

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  flag: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Español (América Latina)', flag: '🇪🇸' },
  { code: 'en', name: 'English (United States)', flag: '🇺🇸' },
  { code: 'pt', name: 'Português (Brasil)', flag: '🇧🇷' }
];

export const translations = {
  es: {
    // Navigation
    nav: {
      dashboard: 'Tablero General',
      masterData: 'Catálogos & Datos Maestros',
      sales: 'Ventas & CxC',
      purchases: 'Compras & CxP',
      inventory: 'Inventario & Kardex',
      accounting: 'Costos & Contabilidad',
      reports: 'Reportes Financieros',
      settings: 'Configuración'
    },
    topbar: {
      searchPlaceholder: 'Buscar clientes, folios, prendas, compras...',
      criticalStock: 'Stock Crítico',
      newSale: '+ Nueva Venta',
      lightMode: 'Modo Claro',
      darkMode: 'Modo Oscuro'
    },
    common: {
      save: 'Guardar Cambios',
      cancel: 'Cancelar',
      close: 'Cerrar',
      search: 'Buscar...',
      filter: 'Filtrar',
      actions: 'Acciones',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'IVA / Impuestos',
      status: 'Estado',
      date: 'Fecha',
      client: 'Cliente',
      supplier: 'Proveedor',
      product: 'Producto',
      print: 'Imprimir / PDF',
      back: 'Regresar',
      confirm: 'Confirmar',
      loading: 'Cargando...',
      units: 'unidades',
      pieces: 'piezas',
      all: 'Todos'
    },
    // Accounting
    accounting: {
      title: 'Costos Operativos, Activos & Prorrateo Contable',
      subtitle: 'Monitoreo de gastos fijos, depreciación de activos y cálculo del costo real unitario de producto.',
      tabProrrateo: 'Prorrateo de Costo Real (Productos)',
      tabExpenses: 'Gastos Fijos & Variables',
      tabAssets: 'Activos Fijos & Depreciación',
      activeRuleTitle: 'Regla de Prorrateo Contable Activa de la Empresa',
      activeRuleNote: 'Configuración contable fijada a nivel institucional. Para modificar la base de cálculo, dirígete a Configuración.',
      fixedExpensesMonth: 'Gastos Fijos del Mes',
      variableExpensesMonth: 'Gastos Variables del Mes',
      depreciationMonth: 'Depreciación Mensual Activos',
      totalOperatingExpense: 'Gasto Operativo Total',
      absorptionRate: 'Tasa de Absorción',
      tableProduct: 'Producto / Variante',
      tableCostPurchase: 'Costo Compra Directo',
      tableAllocated: 'Sobrecosto Operativo Asignado',
      tableRealCost: 'Costo Real Total',
      tablePrice: 'Precio Venta',
      tableRealMargin: 'Margen Real Neto',
      recommended: 'Recomendado',
      addExpense: '+ Registrar Gasto',
      addAsset: '+ Registrar Activo Fijo',
      ruleMaterialName: 'Costo de Material Directo',
      ruleMaterialExplanation: 'Los gastos operativos se distribuyen como una tasa porcentual sobre el costo de compra de cada prenda. Evita castigar productos de bajo costo.',
      rulePriceName: 'Precio de Venta',
      rulePriceExplanation: 'Distribuye los gastos según el precio de lista o venta del producto.',
      ruleUnitsName: 'Por Unidades Iguales',
      ruleUnitsExplanation: 'Asigna una cuota fija idéntica a cada prenda producida o adquirida.'
    },
    // Settings
    settings: {
      title: 'Configuración del Sistema',
      subtitle: 'Personaliza identidad de empresa, moneda de operación, idioma, reglas de prorrateo y respaldos.',
      savedSuccess: '¡Configuración guardada exitosamente!',
      companyProfile: 'Perfil & Datos Fiscales de la Empresa',
      companyName: 'Razón Social / Nombre Comercial',
      taxId: 'Identificación Fiscal (RFC / Tax ID / CNPJ)',
      currencyLabel: 'Moneda de Operación (América)',
      currencyHelp: 'Define el código ISO y el símbolo monetario utilizado en todo el sistema.',
      languageLabel: 'Idioma del Sistema',
      languageHelp: 'Selecciona el idioma principal de la aplicación.',
      defaultTax: 'Tasa de Impuesto / IVA por Defecto (%)',
      prorrateoSection: 'Regla de Prorrateo Contable por Defecto',
      prorrateoSectionDesc: 'Define cómo se distribuyen los costos operativos y depreciaciones entre las prendas en los reportes de costo real.',
      ruleMaterialTitle: 'Costo de Material Directo (Recomendado para PYMES y Retail)',
      ruleMaterialDesc: 'Distribuye los gastos proporcionalmente al costo de compra de la prenda. Evita castigar productos de bajo costo (ej. calcetines/accesorios) y preserva márgenes netos equilibrados.',
      rulePriceTitle: 'Precio de Venta',
      rulePriceDesc: 'Distribuye los gastos proporcionalmente a la capacidad de ingresos de cada prenda según su precio de lista.',
      ruleUnitsTitle: 'Por Unidades Iguales (Lineal)',
      ruleUnitsDesc: 'Aplica una cuota fija idéntica a cada prenda sin importar su precio de costo o de venta.',
      contactAddress: 'Dirección Comercial & Contacto',
      address: 'Dirección Física',
      phone: 'Teléfono de Contacto',
      email: 'Correo Electrónico',
      website: 'Sitio Web',
      invoiceFooter: 'Leyenda / Notas al Pie de Factura',
      themeAndAccent: 'Apariencia, Tema & Acento de Color',
      colorPaletteTitle: 'Color de Acento Principal (Paleta Apple)',
      themeModeTitle: 'Tema de la Interfaz',
      themeLight: 'Modo Claro',
      themeDark: 'Modo Oscuro',
      dataManagement: 'Gestión de Datos & Respaldos',
      downloadJSONTitle: 'Descargar Respaldo JSON',
      downloadJSONDesc: 'Exporta toda la base de datos de tu empresa (catálogo, inventario, facturas, compras y gastos).',
      downloadJSONBtn: 'Descargar Respaldo JSON',
      exportExcelTitle: 'Exportar Base Completa Excel',
      exportExcelDesc: 'Descarga un libro de cálculo profesional (.xlsx) con 9 hojas completas estructuradas.',
      exportExcelBtn: 'Exportar a Excel (.xlsx)',
      restoreTitle: 'Cargar & Restaurar Respaldo',
      restoreDesc: 'Carga un archivo de respaldo .json previo para restaurar el estado completo.',
      restoreBtn: 'Seleccionar Archivo JSON',
      autoBackupTitle: 'Respaldo Automático Mensual',
      autoBackupDesc: 'Al activarse, la herramienta genera y descarga automáticamente una copia mensual de la base de datos.',
      autoBackupStatusActive: 'Activo (1 vez al mes)',
      autoBackupStatusInactive: 'Desactivado'
    },
    // Sales
    sales: {
      title: 'Ventas, Facturación & Cuentas por Cobrar (CxC)',
      subtitle: 'Cotizaciones convertibles en 1 clic, emisión de facturas con deducción de stock y control de cobranza.',
      newInvoice: '+ Nueva Factura',
      newQuote: '+ Nueva Cotización',
      tabInvoices: 'Facturas de Venta',
      tabQuotes: 'Cotizaciones',
      searchPlaceholder: 'Buscar por folio de factura/cotización o cliente...',
      issueInvoice: 'Emitir',
      collectInvoice: 'Cobrar',
      cancelInvoice: 'Anular'
    },
    // Purchases
    purchases: {
      title: 'Gestión de Compras & Cuentas por Pagar (CxP)',
      subtitle: 'Órdenes de compra a proveedores, recepción de mercancía con entrada automática al Kardex y control de pagos.',
      newPurchase: '+ Nueva Orden de Compra'
    },
    // Inventory
    inventory: {
      title: 'Inventarios & Kardex Permanente',
      subtitle: 'Trazabilidad completa de entradas, salidas y existencias calculadas a partir de movimientos inmutables.',
      newAdjustment: '+ Ajuste Manual de Stock',
      tabKardex: 'Kardex de Movimientos',
      tabStock: 'Existencias & Variantes por Producto'
    },
    // Master Data
    masterData: {
      title: 'Catálogos & Datos Maestros',
      subtitle: 'Configura el catálogo de productos con variantes de talla/color, clientes, proveedores y categorías.',
      newProduct: '+ Nuevo Producto',
      newClient: '+ Nuevo Cliente',
      newSupplier: '+ Nuevo Proveedor',
      newCategory: '+ Nueva Categoría',
      tabProducts: 'Productos & Prendas',
      tabClients: 'Clientes',
      tabSuppliers: 'Proveedores',
      tabCategories: 'Categorías'
    },
    // Dashboard
    dashboard: {
      title: 'Tablero Ejecutivo & Control Financiero',
      subtitle: 'Visión general de ventas, márgenes brutos, gastos operativos e inventarios en tiempo real.'
    },
    // Reports
    reports: {
      title: 'Reportes Financieros & Estados Contables',
      subtitle: 'Estados de Resultados (P&L), Balance General, Análisis de Ventas y Comparativas de Costos.',
      tabPnl: 'Estado de Resultados (P&L)',
      tabBalance: 'Balance General',
      tabSales: 'Ventas por Cliente & Producto',
      tabCosts: 'Comparativa de Costos (Compra vs Real)',
      printReport: 'Imprimir Reporte'
    }
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      masterData: 'Master Data & Catalogs',
      sales: 'Sales & AR',
      purchases: 'Purchases & AP',
      inventory: 'Inventory & Kardex',
      accounting: 'Costs & Accounting',
      reports: 'Financial Reports',
      settings: 'Settings'
    },
    topbar: {
      searchPlaceholder: 'Search clients, invoices, apparel, purchases...',
      criticalStock: 'Low Stock',
      newSale: '+ New Sale',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode'
    },
    common: {
      save: 'Save Changes',
      cancel: 'Cancel',
      close: 'Close',
      search: 'Search...',
      filter: 'Filter',
      actions: 'Actions',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax / VAT',
      status: 'Status',
      date: 'Date',
      client: 'Client',
      supplier: 'Supplier',
      product: 'Product',
      print: 'Print / PDF',
      back: 'Back',
      confirm: 'Confirm',
      loading: 'Loading...',
      units: 'units',
      pieces: 'pieces',
      all: 'All'
    },
    // Accounting
    accounting: {
      title: 'Operating Costs, Assets & Cost Allocation',
      subtitle: 'Fixed cost monitoring, asset depreciation and real unit product cost calculation.',
      tabProrrateo: 'Real Cost Allocation (Products)',
      tabExpenses: 'Fixed & Variable Expenses',
      tabAssets: 'Fixed Assets & Depreciation',
      activeRuleTitle: 'Active Company Cost Allocation Rule',
      activeRuleNote: 'Accounting policy established at company level. To modify calculation basis, go to Settings.',
      fixedExpensesMonth: 'Monthly Fixed Expenses',
      variableExpensesMonth: 'Monthly Variable Expenses',
      depreciationMonth: 'Monthly Asset Depreciation',
      totalOperatingExpense: 'Total Operating Expenses',
      absorptionRate: 'Absorption Rate',
      tableProduct: 'Product / Variant',
      tableCostPurchase: 'Direct Purchase Cost',
      tableAllocated: 'Allocated Operating Cost',
      tableRealCost: 'Total Real Cost',
      tablePrice: 'Selling Price',
      tableRealMargin: 'Net Real Margin',
      recommended: 'Recommended',
      addExpense: '+ Add Expense',
      addAsset: '+ Add Fixed Asset',
      ruleMaterialName: 'Direct Material Cost',
      ruleMaterialExplanation: 'Operating expenses are allocated proportionally to the purchase cost of each item. Prevents overburdening low-cost items.',
      rulePriceName: 'Selling Price',
      rulePriceExplanation: 'Allocates expenses based on list selling price.',
      ruleUnitsName: 'Equal Units',
      ruleUnitsExplanation: 'Applies an identical fixed surcharge to each item regardless of its purchase price.'
    },
    // Settings
    settings: {
      title: 'System Settings',
      subtitle: 'Customize company identity, operating currency, language, cost allocation rules and data backups.',
      savedSuccess: 'Settings saved successfully!',
      companyProfile: 'Company Profile & Tax Information',
      companyName: 'Company / Business Name',
      taxId: 'Tax Identification Number (RFC / Tax ID / CNPJ)',
      currencyLabel: 'Operating Currency (Americas)',
      currencyHelp: 'Sets the ISO currency code and symbol used across the entire application.',
      languageLabel: 'System Language',
      languageHelp: 'Select the primary language for the application.',
      defaultTax: 'Default Tax / VAT Rate (%)',
      prorrateoSection: 'Default Cost Allocation Accounting Rule',
      prorrateoSectionDesc: 'Defines how operating expenses and depreciation are distributed among items in real cost reports.',
      ruleMaterialTitle: 'Direct Material Cost (Recommended for SMBs & Retail)',
      ruleMaterialDesc: 'Allocates expenses proportionally to item purchase cost. Avoids overburdening low-cost items (e.g. socks/accessories) and keeps profit margins balanced.',
      rulePriceTitle: 'Selling Price',
      rulePriceDesc: 'Allocates expenses based on revenue generating capacity of each product according to list price.',
      ruleUnitsTitle: 'Equal Units (Linear)',
      ruleUnitsDesc: 'Charges an equal fixed surcharge to each item regardless of purchase cost or selling price.',
      contactAddress: 'Business Address & Contact Details',
      address: 'Physical Address',
      phone: 'Phone Number',
      email: 'Email Address',
      website: 'Website',
      invoiceFooter: 'Invoice Footer Notes / Terms',
      themeAndAccent: 'Appearance, Theme & Color Accent',
      colorPaletteTitle: 'Primary Accent Color (Apple Palette)',
      themeModeTitle: 'Interface Theme',
      themeLight: 'Light Mode',
      themeDark: 'Dark Mode',
      dataManagement: 'Data Management & Backups',
      downloadJSONTitle: 'Download JSON Backup',
      downloadJSONDesc: 'Export your complete company database (catalog, inventory, invoices, purchases, and expenses).',
      downloadJSONBtn: 'Download JSON Backup',
      exportExcelTitle: 'Export Full Excel Database',
      exportExcelDesc: 'Download a comprehensive spreadsheet (.xlsx) with 9 structured sheets.',
      exportExcelBtn: 'Export to Excel (.xlsx)',
      restoreTitle: 'Load & Restore Backup',
      restoreDesc: 'Upload a previous .json backup file to restore full application state.',
      restoreBtn: 'Select JSON File',
      autoBackupTitle: 'Monthly Automatic Backup',
      autoBackupDesc: 'When enabled, the app automatically generates and downloads a monthly database backup.',
      autoBackupStatusActive: 'Active (Once a month)',
      autoBackupStatusInactive: 'Disabled'
    },
    // Sales
    sales: {
      title: 'Sales, Invoicing & Accounts Receivable (AR)',
      subtitle: 'Quotes convertible in 1 click, invoice emission with stock deduction and collection tracking.',
      newInvoice: '+ New Invoice',
      newQuote: '+ New Quote',
      tabInvoices: 'Sales Invoices',
      tabQuotes: 'Quotes',
      searchPlaceholder: 'Search by invoice/quote number or client...',
      issueInvoice: 'Issue',
      collectInvoice: 'Collect',
      cancelInvoice: 'Cancel'
    },
    // Purchases
    purchases: {
      title: 'Purchases & Accounts Payable (AP)',
      subtitle: 'Supplier purchase orders, goods reception with automatic Kardex entry and payment tracking.',
      newPurchase: '+ New Purchase Order'
    },
    // Inventory
    inventory: {
      title: 'Inventory & Perpetual Kardex',
      subtitle: 'Full traceability of entries, exits and real-time stock calculated from immutable movements.',
      newAdjustment: '+ Manual Stock Adjustment',
      tabKardex: 'Movement Kardex',
      tabStock: 'Stock & Variants by Product'
    },
    // Master Data
    masterData: {
      title: 'Catalogs & Master Data',
      subtitle: 'Configure product catalog with size/color variants, clients, suppliers and categories.',
      newProduct: '+ New Product',
      newClient: '+ New Client',
      newSupplier: '+ New Supplier',
      newCategory: '+ New Category',
      tabProducts: 'Products & Apparel',
      tabClients: 'Clients',
      tabSuppliers: 'Suppliers',
      tabCategories: 'Categories'
    },
    // Dashboard
    dashboard: {
      title: 'Executive Dashboard & Financial Control',
      subtitle: 'Real-time overview of sales, gross profit, operating costs and inventories.'
    },
    // Reports
    reports: {
      title: 'Financial Reports & Statements',
      subtitle: 'Income Statements (P&L), Balance Sheet, Sales Breakdown and Cost Comparisons.',
      tabPnl: 'Income Statement (P&L)',
      tabBalance: 'Balance Sheet',
      tabSales: 'Sales by Customer & Product',
      tabCosts: 'Cost Comparison (Purchase vs Real)',
      printReport: 'Print Report'
    }
  },
  pt: {
    // Navigation
    nav: {
      dashboard: 'Painel Geral',
      masterData: 'Cadastros & Dados Mestres',
      sales: 'Vendas & Contas a Receber',
      purchases: 'Compras & Contas a Pagar',
      inventory: 'Estoque & Kardex',
      accounting: 'Custos & Contabilidade',
      reports: 'Relatórios Financeiros',
      settings: 'Configurações'
    },
    topbar: {
      searchPlaceholder: 'Buscar clientes, notas, produtos, pedidos...',
      criticalStock: 'Estoque Crítico',
      newSale: '+ Nova Venda',
      lightMode: 'Modo Claro',
      darkMode: 'Modo Escuro'
    },
    common: {
      save: 'Salvar Alterações',
      cancel: 'Cancelar',
      close: 'Fechar',
      search: 'Buscar...',
      filter: 'Filtrar',
      actions: 'Ações',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Impostos',
      status: 'Status',
      date: 'Data',
      client: 'Cliente',
      supplier: 'Fornecedor',
      product: 'Produto',
      print: 'Imprimir / PDF',
      back: 'Voltar',
      confirm: 'Confirmar',
      loading: 'Carregando...',
      units: 'unidades',
      pieces: 'peças',
      all: 'Todos'
    },
    // Accounting
    accounting: {
      title: 'Custos Operacionais, Ativos & Rateio Contábil',
      subtitle: 'Acompanhamento de despesas fixas, depreciação de ativos e cálculo do custo real unitário do produto.',
      tabProrrateo: 'Rateio de Custo Real (Produtos)',
      tabExpenses: 'Despesas Fixas e Variáveis',
      tabAssets: 'Ativos Fixos e Depreciação',
      activeRuleTitle: 'Regra Ativa de Rateio Contábil da Empresa',
      activeRuleNote: 'Política contábil definida no nível da empresa. Para modificar a base de cálculo, vá para Configurações.',
      fixedExpensesMonth: 'Despesas Fixas do Mês',
      variableExpensesMonth: 'Despesas Variáveis do Mês',
      depreciationMonth: 'Depreciação Mensal de Ativos',
      totalOperatingExpense: 'Despesa Operacional Total',
      absorptionRate: 'Taxa de Absorção',
      tableProduct: 'Produto / Variante',
      tableCostPurchase: 'Custo de Compra Direto',
      tableAllocated: 'Custo Operacional Alocado',
      tableRealCost: 'Custo Real Total',
      tablePrice: 'Preço de Venda',
      tableRealMargin: 'Margem Real Líquida',
      recommended: 'Recomendado',
      addExpense: '+ Registrar Despesa',
      addAsset: '+ Registrar Ativo Fixo',
      ruleMaterialName: 'Custo de Material Direto',
      ruleMaterialExplanation: 'As despesas operacionais são distribuídas proporcionalmente ao custo de compra de cada peça. Evita penalizar produtos de baixo custo.',
      rulePriceName: 'Preço de Venda',
      rulePriceExplanation: 'Distribui as despesas com base no preço de venda do produto.',
      ruleUnitsName: 'Por Unidades Iguais',
      ruleUnitsExplanation: 'Aplica uma taxa fixa idêntica a cada peça independentemente do custo.'
    },
    // Settings
    settings: {
      title: 'Configurações do Sistema',
      subtitle: 'Personalize a identidade da empresa, moeda de operação, idioma, regras de rateio e backups.',
      savedSuccess: 'Configurações salvas com sucesso!',
      companyProfile: 'Perfil & Dados Fiscais da Empresa',
      companyName: 'Razão Social / Nome Fantasia',
      taxId: 'Identificação Fiscal (CNPJ / CPF / Tax ID)',
      currencyLabel: 'Moeda de Operação (América)',
      currencyHelp: 'Define o código ISO e o símbolo monetário utilizado em todo o sistema.',
      languageLabel: 'Idioma do Sistema',
      languageHelp: 'Selecione o idioma principal do aplicativo.',
      defaultTax: 'Taxa de Imposto Padrão (%)',
      prorrateoSection: 'Regra Padrão de Rateio Contábil',
      prorrateoSectionDesc: 'Define como os custos operacionais e depreciações são distribuídos entre os produtos nos relatórios de custo real.',
      ruleMaterialTitle: 'Custo de Material Direto (Recomendado para Varejo e Confecção)',
      ruleMaterialDesc: 'Distribui as despesas proporcionalmente ao custo de compra. Evita sobrecarregar produtos de baixo custo e preserva margens equilibradas.',
      rulePriceTitle: 'Preço de Venda',
      rulePriceDesc: 'Distribui as despesas proporcionalmente à receita gerada por cada produto conforme preço de tabela.',
      ruleUnitsTitle: 'Por Unidades Iguais (Linear)',
      ruleUnitsDesc: 'Aplica uma taxa fixa idêntica a cada peça, independentemente do preço de custo ou venda.',
      contactAddress: 'Endereço Comercial & Contato',
      address: 'Endereço Físico',
      phone: 'Telefone de Contato',
      email: 'E-mail Comercial',
      website: 'Site',
      invoiceFooter: 'Termos e Notas de Rodapé da Fatura',
      themeAndAccent: 'Aparência, Tema & Cor de Destaque',
      colorPaletteTitle: 'Cor de Destaque Principal (Paleta Apple)',
      themeModeTitle: 'Tema da Interface',
      themeLight: 'Modo Claro',
      themeDark: 'Modo Escuro',
      dataManagement: 'Gestão de Dados & Backups',
      downloadJSONTitle: 'Baixar Backup JSON',
      downloadJSONDesc: 'Exporte todo o banco de dados da sua empresa (catálogo, estoque, faturas, compras e despesas).',
      downloadJSONBtn: 'Baixar Backup JSON',
      exportExcelTitle: 'Exportar Banco Completo em Excel',
      exportExcelDesc: 'Baixe uma planilha profissional (.xlsx) com 9 abas completas e estruturadas.',
      exportExcelBtn: 'Exportar para Excel (.xlsx)',
      restoreTitle: 'Carregar & Restaurar Backup',
      restoreDesc: 'Carregue um arquivo .json de backup anterior para restaurar o estado completo.',
      restoreBtn: 'Selecionar Arquivo JSON',
      autoBackupTitle: 'Backup Automático Mensal',
      autoBackupDesc: 'Quando ativado, o aplicativo gera e baixa automaticamente uma cópia mensal do banco de dados.',
      autoBackupStatusActive: 'Ativo (1 vez por mês)',
      autoBackupStatusInactive: 'Desativado'
    },
    // Sales
    sales: {
      title: 'Vendas, Faturamento & Contas a Receber',
      subtitle: 'Cotações conversíveis em 1 clique, emissão de faturas com baixa de estoque e controle de cobrança.',
      newInvoice: '+ Nova Fatura',
      newQuote: '+ Nova Cotação',
      tabInvoices: 'Faturas de Venda',
      tabQuotes: 'Cotações',
      searchPlaceholder: 'Buscar por número de fatura/cotação ou cliente...',
      issueInvoice: 'Emitir',
      collectInvoice: 'Cobrar',
      cancelInvoice: 'Cancelar'
    },
    // Purchases
    purchases: {
      title: 'Compras & Contas a Pagar',
      subtitle: 'Pedidos de compra a fornecedores, recebimento de mercadorias com entrada no Kardex e controle de pagamentos.',
      newPurchase: '+ Novo Pedido de Compra'
    },
    // Inventory
    inventory: {
      title: 'Estoque & Kardex Permanente',
      subtitle: 'Rastreabilidade total de entradas, saídas e saldo em tempo real calculado a partir de movimentações.',
      newAdjustment: '+ Ajuste Manual de Estoque',
      tabKardex: 'Kardex de Movimentações',
      tabStock: 'Estoque & Variantes por Produto'
    },
    // Master Data
    masterData: {
      title: 'Cadastros & Dados Mestres',
      subtitle: 'Configure catálogo de produtos com variantes de tamanho/cor, clientes, fornecedores e categorias.',
      newProduct: '+ Novo Produto',
      newClient: '+ Novo Cliente',
      newSupplier: '+ Novo Fornecedor',
      newCategory: '+ Nova Categoria',
      tabProducts: 'Produtos & Roupas',
      tabClients: 'Clientes',
      tabSuppliers: 'Fornecedores',
      tabCategories: 'Categorias'
    },
    // Dashboard
    dashboard: {
      title: 'Painel Executivo & Controle Financeiro',
      subtitle: 'Visão geral em tempo real de vendas, lucros brutos, custos operacionais e estoques.'
    },
    // Reports
    reports: {
      title: 'Relatórios Financeiros & Demonstrações',
      subtitle: 'Demonstração de Resultados (DRE), Balanço Patrimonial, Análise de Vendas e Comparativos de Custos.',
      tabPnl: 'Demonstração do Resultado (DRE)',
      tabBalance: 'Balanço Patrimonial',
      tabSales: 'Vendas por Cliente & Produto',
      tabCosts: 'Comparativo de Custos (Compra vs Real)',
      printReport: 'Imprimir Relatório'
    }
  }
};

export function getTranslation(lang: AppLanguage = 'es') {
  return translations[lang] || translations.es;
}
