export type PaymentTerm = 'contado' | 'credito';

export type PurchaseStatus = 'borrador' | 'recibida' | 'pagada' | 'anulada';
export type QuoteStatus = 'pendiente' | 'aprobada' | 'vencida' | 'rechazada';
export type InvoiceStatus = 'borrador' | 'emitida' | 'pagada' | 'anulada';

export type MovementType = 
  | 'ENTRADA_COMPRA' 
  | 'SALIDA_VENTA' 
  | 'AJUSTE_MANUAL' 
  | 'INVENTARIO_INICIAL'
  | 'ANULACION_COMPRA' 
  | 'ANULACION_VENTA';

export type ExpenseType = 'fijo' | 'variable';
export type PaymentMethod = 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque';
export type ThemeMode = 'light' | 'dark';

export type AccentColor = 
  | 'blue' 
  | 'navy'
  | 'cyan'
  | 'teal'
  | 'green' 
  | 'forest'
  | 'yellow'
  | 'orange' 
  | 'wine'
  | 'coffee'
  | 'pink' 
  | 'purple' 
  | 'indigo' 
  | 'graphite'
  | 'emerald' 
  | 'sapphire' 
  | 'rose' 
  | 'amber' 
  | 'slate'
  | 'amarillo'
  | 'vino'
  | 'cafe';

// 1. Datos Maestros
export interface Client {
  id: string;
  nombre: string;
  identificacionFiscal: string; // RFC / RUT / NIT / DNI
  telefono: string;
  email: string;
  direccion: string;
  tipoPago: PaymentTerm;
  limiteCredito: number;
  diasCredito: number;
  creadoEn: string;
  notas?: string;
  activo?: boolean;
}

export interface Supplier {
  id: string;
  nombre: string;
  identificacionFiscal: string;
  telefono: string;
  email: string;
  direccion: string;
  contactoNombre?: string;
  creadoEn: string;
  notas?: string;
  activo?: boolean;
}

export interface Subcategory {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion?: string;
}

export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  subcategorias?: Subcategory[];
}

export interface ProductVariant {
  id: string;
  productoId: string;
  sku: string;
  talla: string;
  color: string;
  stockActual: number;
  precioExtra?: number;
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  categoriaId: string;
  subcategoriaId?: string;
  unidadMedida: string; // pza, par, kg, m, set, etc.
  precioVenta: number;
  costoPromedio: number;
  stockMinimo: number;
  stockActual: number; // Suma de variantes o stock directo
  tieneVariantes: boolean;
  variantes?: ProductVariant[];
  creadoEn: string;
  descripcion?: string;
  activo?: boolean;
}

// 2. Compras & CxP
export interface PurchaseDetail {
  id: string;
  compraId: string;
  productoId: string;
  varianteId?: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface SupplierPayment {
  id: string;
  compraId: string;
  fecha: string;
  monto: number;
  metodoPago: PaymentMethod;
  referencia: string;
  notas?: string;
}

export interface Purchase {
  id: string;
  numeroCompra: string; // e.g. OC-0001
  proveedorId: string;
  fecha: string;
  estado: PurchaseStatus;
  items: PurchaseDetail[];
  subtotal: number;
  impuestos: number;
  total: number;
  saldoPendiente: number;
  pagos: SupplierPayment[];
  notas?: string;
  anuladoMotivo?: string;
  anuladoFecha?: string;
  anuladoPor?: string;
  recibidaFecha?: string;
}

// 3. Inventarios
export interface InventoryMovement {
  id: string;
  fecha: string;
  tipo: MovementType;
  referenciaDoc: string; // e.g. OC-0001, FAC-0001, AJU-001
  productoId: string;
  varianteId?: string;
  cantidad: number; // Positivo para entradas, negativo para salidas
  costoUnitario: number;
  stockResultante?: number;
  motivo: string;
  usuario?: string;
}

// 4. Ventas & CxC
export interface QuoteItem {
  id: string;
  productoId: string;
  varianteId?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number; // porcentaje o monto
  subtotal: number;
}

export interface Quote {
  id: string;
  numeroCotizacion: string; // e.g. COT-0001
  clienteId: string;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  descuentoTotal: number;
  tasaImpuesto?: number;
  impuestos: number;
  total: number;
  notas?: string;
  convertidaEnFacturaId?: string;
}

export interface InvoiceDetail {
  id: string;
  facturaId: string;
  productoId: string;
  varianteId?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface ClientPayment {
  id: string;
  facturaId: string;
  fecha: string;
  monto: number;
  metodoPago: PaymentMethod;
  referencia: string;
  notas?: string;
}

export interface Invoice {
  id: string;
  numeroFactura: string; // e.g. FAC-0001
  cotizacionIdOrigen?: string;
  clienteId: string;
  fechaEmision: string;
  fechaVencimiento: string;
  tipoPago: PaymentTerm;
  estado: InvoiceStatus;
  items: InvoiceDetail[];
  subtotal: number;
  descuentoTotal: number;
  tasaImpuesto: number; // porcentaje, ej. 16
  impuestos: number;
  total: number;
  saldoPendiente: number;
  pagos: ClientPayment[];
  notas?: string;
  anuladoMotivo?: string;
  anuladoFecha?: string;
  anuladoPor?: string;
  emitidaFecha?: string;
}

// 5. Contabilidad & Prorrateo
export type ProrrateoCriterion = 'costo_material' | 'valor_venta' | 'unidades_iguales';

export interface MonthlyProrrateo {
  mes: string;
  gastosFijos: number;
  gastosVariables: number;
  depreciacionActivos: number;
  gastoOperativoTotal: number;
  unidadesVendidasPeriodo: number;
  unidadesEnInventario: number;
  totalUnidadesPeriodo: number;
  costoVentasPeriodo: number;
  valorVentasPeriodo: number;
  valorInventarioCostoTotal: number;
  valorInventarioVentaTotal: number;
  baseTotalProrrateo: number;
  criterio: ProrrateoCriterion;
  tasaAbsorcionPorcentaje: number;
  costoOperativoProrrateadoPorUnidad: number;
}

export interface ProductRealCostResult {
  costoCompra: number;
  gastoOperativoUnitario: number;
  gastoDepreciacionUnitario: number;
  costoOperativoProrrateado: number;
  costoReal: number;
  tasaAbsorcionPorcentaje: number;
  criterio: ProrrateoCriterion;
}

export interface OperatingExpense {
  id: string;
  codigoContable?: string; // e.g. GA0001, DE0001
  fecha: string;
  periodoMes: string; // YYYY-MM
  tipo: ExpenseType;
  categoria: string; // Renta, Nómina, Publicidad, Depreciación de Activos, etc.
  monto: number;
  descripcion: string;
  referenciaFactura?: string; // N° Factura / Referencia Proveedor (Opcional)
  anulado?: boolean;
  esAnulacionDe?: string; // ID o código del gasto original anulado
  esDepreciacionDeActivoId?: string; // ID del activo relacionado si es depreciación automática
}

export interface FixedAsset {
  id: string;
  nombre: string;
  categoriaActivo: string; // Maquinaria, Equipo de Computo, Mobiliario, Vehiculo
  fechaAdquisicion: string;
  valorAdquisicion: number;
  vidaUtilMeses: number;
  metodoDepreciacion: 'lineal';
  depreciacionMensual: number; // Calculada: valor / vidaUtilMeses
  depreciacionAcumulada: number;
  valorEnLibros: number;
  activoEstado: 'activo' | 'depreciado' | 'baja';
  notas?: string;
}

export type AppLanguage = 'es' | 'en' | 'pt';

// 6. Configuración General & Respaldos
export interface CompanySettings {
  nombreEmpresa: string;
  identificacionFiscal: string;
  moneda: string; // USD, MXN, BRL, COP, CLP, PEN, ARS, etc.
  monedaSimbolo: string; // $, R$, S/, ₡, etc.
  idioma: AppLanguage; // es | en | pt
  tasaImpuestoDefecto: number; // e.g. 16
  criterioProrrateoDefecto: ProrrateoCriterion; // 'costo_material' | 'valor_venta' | 'unidades_iguales'
  capitalAportado?: number; // Capital social / aporte inicial del propietario
  direccion: string;
  telefono: string;
  email: string;
  website?: string;
  pieFactura?: string;
  tema: ThemeMode;
  colorAcento: AccentColor;
  respaldoAutomaticoActivo: boolean;
  ultimoRespaldoAutomatico?: string;
  ultimoRespaldoPeriodo?: string; // YYYY-MM
}

export interface ERPBackupPayload {
  version: string;
  fechaExportacion: string;
  empresa: string;
  data: {
    settings: CompanySettings;
    categories: Category[];
    clients: Client[];
    suppliers: Supplier[];
    products: Product[];
    purchases: Purchase[];
    quotes: Quote[];
    invoices: Invoice[];
    inventoryMovements: InventoryMovement[];
    expenses: OperatingExpense[];
    fixedAssets: FixedAsset[];
  };
}

