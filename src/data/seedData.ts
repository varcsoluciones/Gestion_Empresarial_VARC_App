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
  nombreEmpresa: 'VARC Soluciones — Boutique & Moda',
  identificacionFiscal: 'VARC-890412-A89',
  moneda: 'MXN',
  monedaSimbolo: '$',
  idioma: 'es',
  tasaImpuestoDefecto: 16,
  criterioProrrateoDefecto: 'costo_material',
  direccion: 'Av. Insurgentes Sur 1450, Col. del Valle, CDMX',
  telefono: '+52 (55) 8432-9012',
  email: 'contacto@varcsoluciones.com',
  website: 'www.varcsoluciones.com',
  pieFactura: 'Gracias por su preferencia. Régimen General de Ley Personas Morales. Pago en una sola exhibición.',
  tema: 'light',
  colorAcento: 'blue',
  respaldoAutomaticoActivo: true,
  ultimoRespaldoAutomatico: new Date().toISOString(),
  ultimoRespaldoPeriodo: new Date().toISOString().slice(0, 7)
};

export const initialCategories: Category[] = [
  { id: 'cat-1', nombre: 'Playeras & Polos', descripcion: 'Prendas superiores de algodón y piqué' },
  { id: 'cat-2', nombre: 'Pantalones & Jeans', descripcion: 'Denim stretch, gabardina y pantalones de vestir' },
  { id: 'cat-3', nombre: 'Sudaderas & Hoodies', descripcion: 'Algodón fleece con y sin capucha' },
  { id: 'cat-4', nombre: 'Accesorios & Gorras', descripcion: 'Cinturones, gorras bordadas y calcetines' }
];

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    nombre: 'Boutique San Pedro S.A. de C.V.',
    identificacionFiscal: 'BSP190520KL1',
    telefono: '55 1234 5678',
    email: 'compras@boutiquesanpedro.com',
    direccion: 'Calzada del Valle 400, San Pedro Garza García, NL',
    tipoPago: 'credito',
    limiteCredito: 50000,
    diasCredito: 30,
    creadoEn: '2026-01-10T10:00:00Z',
    notas: 'Cliente mayorista prioritario con entrega quincenal.'
  },
  {
    id: 'cli-2',
    nombre: 'Moda Urbana CDMX',
    identificacionFiscal: 'MUC2108159X4',
    telefono: '55 9876 5432',
    email: 'contacto@modaurbanacdmx.mx',
    direccion: 'Colima 180, Col. Roma Norte, Cuauhtémoc, CDMX',
    tipoPago: 'contado',
    limiteCredito: 0,
    diasCredito: 0,
    creadoEn: '2026-02-01T14:30:00Z',
    notas: 'Pago de contado vía transferencia interbancaria.'
  },
  {
    id: 'cli-3',
    nombre: 'Alejandro Morales Torres (Público General)',
    identificacionFiscal: 'XAXX010101000',
    telefono: '55 4567 8901',
    email: 'alejandro.morales@gmail.com',
    direccion: 'Av. Universidad 1200, Benito Juárez, CDMX',
    tipoPago: 'contado',
    limiteCredito: 0,
    diasCredito: 0,
    creadoEn: '2026-02-15T11:20:00Z'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'prov-1',
    nombre: 'Textiles del Norte S.A.',
    identificacionFiscal: 'TXN120401AB3',
    telefono: '81 8345 6789',
    email: 'ventas@textilesdelnorte.com',
    direccion: 'Parque Industrial Monterrey, Apodaca, NL',
    contactoNombre: 'Ing. Roberto Garza',
    creadoEn: '2026-01-05T09:00:00Z',
    notas: 'Proveedor principal de telas de algodón y confección de playeras.'
  },
  {
    id: 'prov-2',
    nombre: 'Confecciones & Denim de Puebla',
    identificacionFiscal: 'CDP160710JH8',
    telefono: '22 2456 7890',
    email: 'pedidos@denimpuebla.com.mx',
    direccion: 'Carretera Federal Puebla-Tehuacán Km 12, Puebla',
    contactoNombre: 'Lic. Mariana Lozano',
    creadoEn: '2026-01-08T11:00:00Z',
    notas: 'Especialistas en mezclilla 12oz y pantalones casuales.'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    codigo: 'POL-01',
    nombre: 'Playera Polo Piqué Clásica',
    categoriaId: 'cat-1',
    unidadMedida: 'pza',
    precioVenta: 450,
    costoPromedio: 180,
    stockMinimo: 15,
    stockActual: 60,
    tieneVariantes: true,
    creadoEn: '2026-01-10T10:00:00Z',
    descripcion: 'Playera polo 100% algodón peinado con cuello y puños tejidos.',
    variantes: [
      { id: 'var-1-1', productoId: 'prod-1', sku: 'POL-01-NEG-M', talla: 'M', color: 'Negro', stockActual: 20 },
      { id: 'var-1-2', productoId: 'prod-1', sku: 'POL-01-NEG-L', talla: 'L', color: 'Negro', stockActual: 15 },
      { id: 'var-1-3', productoId: 'prod-1', sku: 'POL-01-BLA-M', talla: 'M', color: 'Blanco', stockActual: 15 },
      { id: 'var-1-4', productoId: 'prod-1', sku: 'POL-01-BLA-L', talla: 'L', color: 'Blanco', stockActual: 10 }
    ]
  },
  {
    id: 'prod-2',
    codigo: 'JEA-02',
    nombre: 'Jeans Slim Fit Denim 12oz',
    categoriaId: 'cat-2',
    unidadMedida: 'pza',
    precioVenta: 890,
    costoPromedio: 360,
    stockMinimo: 10,
    stockActual: 35,
    tieneVariantes: true,
    creadoEn: '2026-01-12T10:00:00Z',
    descripcion: 'Pantalón de mezclilla premium con 2% elastano para confort.',
    variantes: [
      { id: 'var-2-1', productoId: 'prod-2', sku: 'JEA-02-AZU-30', talla: '30', color: 'Azul Índigo', stockActual: 10 },
      { id: 'var-2-2', productoId: 'prod-2', sku: 'JEA-02-AZU-32', talla: '32', color: 'Azul Índigo', stockActual: 15 },
      { id: 'var-2-3', productoId: 'prod-2', sku: 'JEA-02-AZU-34', talla: '34', color: 'Azul Índigo', stockActual: 10 }
    ]
  },
  {
    id: 'prod-3',
    codigo: 'HOO-03',
    nombre: 'Sudadera Hoodie Oversized Fleece',
    categoriaId: 'cat-3',
    unidadMedida: 'pza',
    precioVenta: 750,
    costoPromedio: 290,
    stockMinimo: 8,
    stockActual: 24,
    tieneVariantes: true,
    creadoEn: '2026-01-15T12:00:00Z',
    descripcion: 'Sudadera cálida con gorro ajustable y bolsillo canguro.',
    variantes: [
      { id: 'var-3-1', productoId: 'prod-3', sku: 'HOO-03-GRI-M', talla: 'M', color: 'Gris Jaspe', stockActual: 12 },
      { id: 'var-3-2', productoId: 'prod-3', sku: 'HOO-03-GRI-L', talla: 'L', color: 'Gris Jaspe', stockActual: 12 }
    ]
  },
  {
    id: 'prod-4',
    codigo: 'GOR-04',
    nombre: 'Gorra Trucker Bordada VARC',
    categoriaId: 'cat-4',
    unidadMedida: 'pza',
    precioVenta: 280,
    costoPromedio: 95,
    stockMinimo: 10,
    stockActual: 8,
    tieneVariantes: false,
    creadoEn: '2026-01-20T10:00:00Z',
    descripcion: 'Gorra snapback de 5 paneles con bordado en alto relieve.'
  },
  {
    id: 'prod-5',
    codigo: 'CAL-05',
    nombre: 'Pack 3 Calcetines Bamboo No-Show',
    categoriaId: 'cat-4',
    unidadMedida: 'set',
    precioVenta: 99,
    costoPromedio: 35,
    stockMinimo: 15,
    stockActual: 25,
    tieneVariantes: false,
    creadoEn: '2026-01-22T11:00:00Z',
    descripcion: 'Calcetines invisibles de fibra de bambú hipoalergénicos.'
  }
];

export const initialPurchases: Purchase[] = [
  {
    id: 'pur-1',
    numeroCompra: 'OC-2026-0001',
    proveedorId: 'prov-1',
    fecha: '2026-01-15',
    estado: 'pagada',
    items: [
      {
        id: 'pdet-1',
        compraId: 'pur-1',
        productoId: 'prod-1',
        varianteId: 'var-1-1',
        descripcion: 'Playera Polo Piqué Clásica (Negro / M)',
        cantidad: 30,
        costoUnitario: 180,
        subtotal: 5400
      },
      {
        id: 'pdet-2',
        compraId: 'pur-1',
        productoId: 'prod-1',
        varianteId: 'var-1-2',
        descripcion: 'Playera Polo Piqué Clásica (Negro / L)',
        cantidad: 25,
        costoUnitario: 180,
        subtotal: 4500
      },
      {
        id: 'pdet-3',
        compraId: 'pur-1',
        productoId: 'prod-1',
        varianteId: 'var-1-3',
        descripcion: 'Playera Polo Piqué Clásica (Blanco / M)',
        cantidad: 20,
        costoUnitario: 180,
        subtotal: 3600
      }
    ],
    subtotal: 13500,
    impuestos: 2160,
    total: 15660,
    saldoPendiente: 0,
    pagos: [
      {
        id: 'pay-1',
        compraId: 'pur-1',
        fecha: '2026-01-16',
        monto: 15660,
        metodoPago: 'transferencia',
        referencia: 'TRANS-TXN-9021',
        notas: 'Liquidación total de orden de compra inicial.'
      }
    ],
    recibidaFecha: '2026-01-15T15:00:00Z',
    notas: 'Lote inicial de temporada invierno.'
  },
  {
    id: 'pur-2',
    numeroCompra: 'OC-2026-0002',
    proveedorId: 'prov-2',
    fecha: '2026-02-05',
    estado: 'recibida',
    items: [
      {
        id: 'pdet-4',
        compraId: 'pur-2',
        productoId: 'prod-2',
        varianteId: 'var-2-1',
        descripcion: 'Jeans Slim Fit Denim 12oz (Azul Índigo / 30)',
        cantidad: 15,
        costoUnitario: 360,
        subtotal: 5400
      },
      {
        id: 'pdet-5',
        compraId: 'pur-2',
        productoId: 'prod-2',
        varianteId: 'var-2-2',
        descripcion: 'Jeans Slim Fit Denim 12oz (Azul Índigo / 32)',
        cantidad: 20,
        costoUnitario: 360,
        subtotal: 7200
      }
    ],
    subtotal: 12600,
    impuestos: 2016,
    total: 14616,
    saldoPendiente: 6616,
    pagos: [
      {
        id: 'pay-2',
        compraId: 'pur-2',
        fecha: '2026-02-10',
        monto: 8000,
        metodoPago: 'transferencia',
        referencia: 'ANT-CDP-0012',
        notas: 'Anticipo 50%+ de pedido de mezclilla.'
      }
    ],
    recibidaFecha: '2026-02-05T12:00:00Z',
    notas: 'Recepción conforme en almacén central.'
  }
];

export const initialInventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    fecha: '2026-01-15T15:00:00Z',
    tipo: 'ENTRADA_COMPRA',
    referenciaDoc: 'OC-2026-0001',
    productoId: 'prod-1',
    varianteId: 'var-1-1',
    cantidad: 30,
    costoUnitario: 180,
    stockResultante: 30,
    motivo: 'Recepción de Orden de Compra OC-2026-0001',
    usuario: 'Almacén'
  },
  {
    id: 'mov-2',
    fecha: '2026-01-15T15:00:00Z',
    tipo: 'ENTRADA_COMPRA',
    referenciaDoc: 'OC-2026-0001',
    productoId: 'prod-1',
    varianteId: 'var-1-2',
    cantidad: 25,
    costoUnitario: 180,
    stockResultante: 25,
    motivo: 'Recepción de Orden de Compra OC-2026-0001',
    usuario: 'Almacén'
  },
  {
    id: 'mov-3',
    fecha: '2026-01-20T10:00:00Z',
    tipo: 'SALIDA_VENTA',
    referenciaDoc: 'FAC-2026-0001',
    productoId: 'prod-1',
    varianteId: 'var-1-1',
    cantidad: -10,
    costoUnitario: 180,
    stockResultante: 20,
    motivo: 'Emisión de Factura FAC-2026-0001',
    usuario: 'Ventas'
  },
  {
    id: 'mov-4',
    fecha: '2026-02-05T12:00:00Z',
    tipo: 'ENTRADA_COMPRA',
    referenciaDoc: 'OC-2026-0002',
    productoId: 'prod-2',
    varianteId: 'var-2-1',
    cantidad: 15,
    costoUnitario: 360,
    stockResultante: 15,
    motivo: 'Recepción de Orden de Compra OC-2026-0002',
    usuario: 'Almacén'
  },
  {
    id: 'mov-5',
    fecha: '2026-02-12T16:00:00Z',
    tipo: 'AJUSTE_MANUAL',
    referenciaDoc: 'AJU-2026-0001',
    productoId: 'prod-4',
    cantidad: -2,
    costoUnitario: 95,
    stockResultante: 8,
    motivo: 'Muestra comercial para exhibición en mostrador y desgaste.',
    usuario: 'Administrador'
  }
];

export const initialQuotes: Quote[] = [
  {
    id: 'quot-1',
    numeroCotizacion: 'COT-2026-0001',
    clienteId: 'cli-1',
    fechaEmision: '2026-01-18',
    fechaVencimiento: '2026-02-18',
    estado: 'aprobada',
    items: [
      {
        id: 'qitem-1',
        productoId: 'prod-1',
        varianteId: 'var-1-1',
        descripcion: 'Playera Polo Piqué Clásica (Negro / M)',
        cantidad: 10,
        precioUnitario: 450,
        descuento: 0,
        subtotal: 4500
      },
      {
        id: 'qitem-2',
        productoId: 'prod-1',
        varianteId: 'var-1-2',
        descripcion: 'Playera Polo Piqué Clásica (Negro / L)',
        cantidad: 10,
        precioUnitario: 450,
        descuento: 5,
        subtotal: 4275
      }
    ],
    subtotal: 8775,
    descuentoTotal: 225,
    impuestos: 1404,
    total: 10179,
    convertidaEnFacturaId: 'inv-1',
    notas: 'Cotización especial con 5% de descuento en talla L.'
  },
  {
    id: 'quot-2',
    numeroCotizacion: 'COT-2026-0002',
    clienteId: 'cli-2',
    fechaEmision: '2026-02-20',
    fechaVencimiento: '2026-03-20',
    estado: 'pendiente',
    items: [
      {
        id: 'qitem-3',
        productoId: 'prod-2',
        varianteId: 'var-2-2',
        descripcion: 'Jeans Slim Fit Denim 12oz (Azul Índigo / 32)',
        cantidad: 5,
        precioUnitario: 890,
        descuento: 0,
        subtotal: 4450
      },
      {
        id: 'qitem-4',
        productoId: 'prod-3',
        varianteId: 'var-3-1',
        descripcion: 'Sudadera Hoodie Oversized Fleece (Gris / M)',
        cantidad: 4,
        precioUnitario: 750,
        descuento: 0,
        subtotal: 3000
      }
    ],
    subtotal: 7450,
    descuentoTotal: 0,
    impuestos: 1192,
    total: 8642,
    notas: 'Vigencia de 30 días.'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    numeroFactura: 'FAC-2026-0001',
    cotizacionIdOrigen: 'quot-1',
    clienteId: 'cli-1',
    fechaEmision: '2026-01-20',
    fechaVencimiento: '2026-02-19',
    tipoPago: 'credito',
    estado: 'pagada',
    items: [
      {
        id: 'fitem-1',
        facturaId: 'inv-1',
        productoId: 'prod-1',
        varianteId: 'var-1-1',
        descripcion: 'Playera Polo Piqué Clásica (Negro / M)',
        cantidad: 10,
        precioUnitario: 450,
        descuento: 0,
        subtotal: 4500
      },
      {
        id: 'fitem-2',
        facturaId: 'inv-1',
        productoId: 'prod-1',
        varianteId: 'var-1-2',
        descripcion: 'Playera Polo Piqué Clásica (Negro / L)',
        cantidad: 10,
        precioUnitario: 450,
        descuento: 5,
        subtotal: 4275
      }
    ],
    subtotal: 8775,
    descuentoTotal: 225,
    tasaImpuesto: 16,
    impuestos: 1404,
    total: 10179,
    saldoPendiente: 0,
    pagos: [
      {
        id: 'cpay-1',
        facturaId: 'inv-1',
        fecha: '2026-02-15',
        monto: 10179,
        metodoPago: 'transferencia',
        referencia: 'SPEI-BSP-48190',
        notas: 'Liquidación en tiempo de crédito a 30 días.'
      }
    ],
    emitidaFecha: '2026-01-20T10:00:00Z',
    notas: 'Factura generada a partir de cotización COT-2026-0001.'
  },
  {
    id: 'inv-2',
    numeroFactura: 'FAC-2026-0002',
    clienteId: 'cli-2',
    fechaEmision: '2026-02-22',
    fechaVencimiento: '2026-02-22',
    tipoPago: 'contado',
    estado: 'emitida',
    items: [
      {
        id: 'fitem-3',
        facturaId: 'inv-2',
        productoId: 'prod-2',
        varianteId: 'var-2-1',
        descripcion: 'Jeans Slim Fit Denim 12oz (Azul Índigo / 30)',
        cantidad: 5,
        precioUnitario: 890,
        descuento: 0,
        subtotal: 4450
      },
      {
        id: 'fitem-4',
        facturaId: 'inv-2',
        productoId: 'prod-4',
        descripcion: 'Gorra Trucker Bordada VARC',
        cantidad: 3,
        precioUnitario: 280,
        descuento: 0,
        subtotal: 840
      }
    ],
    subtotal: 5290,
    descuentoTotal: 0,
    tasaImpuesto: 16,
    impuestos: 846.4,
    total: 6136.4,
    saldoPendiente: 3136.4,
    pagos: [
      {
        id: 'cpay-2',
        facturaId: 'inv-2',
        fecha: '2026-02-22',
        monto: 3000,
        metodoPago: 'tarjeta',
        referencia: 'TDD-AUTH-8821',
        notas: 'Pago parcial con tarjeta de débito.'
      }
    ],
    emitidaFecha: '2026-02-22T14:00:00Z',
    notas: 'Venta de piso en showroom.'
  }
];

export const initialOperatingExpenses: OperatingExpense[] = [
  {
    id: 'exp-1',
    fecha: '2026-02-01',
    periodoMes: '2026-02',
    tipo: 'fijo',
    categoria: 'Renta & Local',
    monto: 12000,
    descripcion: 'Renta mensual de local comercial y showroom'
  },
  {
    id: 'exp-2',
    fecha: '2026-02-05',
    periodoMes: '2026-02',
    tipo: 'fijo',
    categoria: 'Servicios Básicos',
    monto: 1850,
    descripcion: 'Energía eléctrica, agua e internet fibra óptica'
  },
  {
    id: 'exp-3',
    fecha: '2026-02-15',
    periodoMes: '2026-02',
    tipo: 'fijo',
    categoria: 'Nómina & Sueldos',
    monto: 16000,
    descripcion: 'Sueldo de encargada de tienda y auxiliar de ventas'
  },
  {
    id: 'exp-4',
    fecha: '2026-02-10',
    periodoMes: '2026-02',
    tipo: 'variable',
    categoria: 'Marketing & Publicidad',
    monto: 3500,
    descripcion: 'Campaña en Meta Ads e Instagram para nueva colección'
  },
  {
    id: 'exp-5',
    fecha: '2026-02-18',
    periodoMes: '2026-02',
    tipo: 'variable',
    categoria: 'Empaques & Logística',
    monto: 1200,
    descripcion: 'Bolsas ecológicas impresas, etiquetas y mensajería local'
  }
];

export const initialFixedAssets: FixedAsset[] = [
  {
    id: 'ast-1',
    nombre: 'Máquina de Coser Industrial Overlock Pegasus',
    categoriaActivo: 'Maquinaria y Equipo',
    fechaAdquisicion: '2025-06-01',
    valorAdquisicion: 24000,
    vidaUtilMeses: 60,
    metodoDepreciacion: 'lineal',
    depreciacionMensual: 400,
    depreciacionAcumulada: 3600,
    valorEnLibros: 20400,
    activoEstado: 'activo',
    notas: 'Equipo en taller para ajustes y confección menor.'
  },
  {
    id: 'ast-2',
    nombre: 'Terminal Punto de Venta iMac 24" M3 + Impresora Térmica',
    categoriaActivo: 'Equipo de Cómputo',
    fechaAdquisicion: '2025-10-01',
    valorAdquisicion: 36000,
    vidaUtilMeses: 36,
    metodoDepreciacion: 'lineal',
    depreciacionMensual: 1000,
    depreciacionAcumulada: 5000,
    valorEnLibros: 31000,
    activoEstado: 'activo',
    notas: 'Computadora de mostrador para gestión del ERP y ventas.'
  },
  {
    id: 'ast-3',
    nombre: 'Mobiliario de Exhibición y Racks de Acero Negro',
    categoriaActivo: 'Mobiliario y Enseres',
    fechaAdquisicion: '2025-07-01',
    valorAdquisicion: 30000,
    vidaUtilMeses: 120,
    metodoDepreciacion: 'lineal',
    depreciacionMensual: 250,
    depreciacionAcumulada: 2000,
    valorEnLibros: 28000,
    activoEstado: 'activo',
    notas: 'Exhibidores modulares y percheros de tienda.'
  }
];
