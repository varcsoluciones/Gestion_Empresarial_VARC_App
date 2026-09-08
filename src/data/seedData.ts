import type { 
  Client, 
  Supplier, 
  Category, 
  Product, 
  Purchase, 
  Quote, 
  Invoice, 
  InventoryMovement, 
  OperatingExpense, 
  FixedAsset, 
  CompanySettings 
} from '../types/erp';

export const initialSettings: CompanySettings = {
  nombreEmpresa: 'Mi Empresa',
  identificacionFiscal: '',
  moneda: 'MXN',
  monedaSimbolo: '$',
  idioma: 'es',
  tasaImpuestoDefecto: 16,
  criterioProrrateoDefecto: 'costo_material',
  direccion: '',
  telefono: '',
  email: '',
  website: '',
  pieFactura: 'Gracias por su preferencia.',
  tema: 'light',
  colorAcento: 'blue',
  respaldoAutomaticoActivo: true,
  ultimoRespaldoAutomatico: new Date().toISOString(),
  ultimoRespaldoPeriodo: new Date().toISOString().slice(0, 7)
};

export const initialCategories: Category[] = [
  { id: 'CA0001', nombre: 'General', descripcion: 'Categoría principal de productos y servicios' }
];

export const initialClients: Client[] = [];
export const initialSuppliers: Supplier[] = [];
export const initialProducts: Product[] = [];
export const initialPurchases: Purchase[] = [];
export const initialQuotes: Quote[] = [];
export const initialInvoices: Invoice[] = [];
export const initialInventoryMovements: InventoryMovement[] = [];
export const initialOperatingExpenses: OperatingExpense[] = [];
export const initialFixedAssets: FixedAsset[] = [];
