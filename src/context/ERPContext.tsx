import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  Client,
  Supplier,
  Category,
  Product,
  ProductVariant,
  Purchase,
  SupplierPayment,
  Quote,
  Invoice,
  ClientPayment,
  InventoryMovement,
  MovementType,
  OperatingExpense,
  FixedAsset,
  CompanySettings,
  ProrrateoCriterion,
  MonthlyProrrateo,
  ProductRealCostResult,
  ClosedPeriod,
  ClosedPeriodAudit,
  ProductPeriodSnapshot,
  DateRestrictionMode
} from '../types/erp';
import {
  initialSettings,
  initialCategories,
  initialClients,
  initialSuppliers,
  initialProducts,
  initialPurchases,
  initialQuotes,
  initialInvoices,
  initialInventoryMovements,
  initialOperatingExpenses,
  initialFixedAssets
} from '../data/seedData';
import { calculateWeightedAverageCost, generateDocNumber, getNextDocNumber, getMonthKey, getNextProductSKU, getNextEntityId, formatCurrency, setActiveCurrencySymbol, getTodayLocalDateString, getFutureLocalDateString, parseDateSafe } from '../utils/formatters';
import {
  downloadJSONBackup,
  downloadExcelWorkbook,
  type FullERPData
} from '../utils/backupExportUtils';

export interface ERPContextType {
  // Entidades
  settings: CompanySettings;
  currencySymbol: string;
  formatMoney: (amount: number) => string;
  clients: Client[];
  suppliers: Supplier[];
  categories: Category[];
  products: Product[];
  purchases: Purchase[];
  quotes: Quote[];
  invoices: Invoice[];
  inventoryMovements: InventoryMovement[];
  expenses: OperatingExpense[];
  fixedAssets: FixedAsset[];

  // Acciones Clientes & Proveedores
  addClient: (client: Omit<Client, 'id' | 'creadoEn'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  toggleClientActive: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'creadoEn'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  toggleSupplierActive: (id: string) => void;

  // Acciones Categorías & Productos
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  addProduct: (product: Omit<Product, 'id' | 'creadoEn' | 'costoPromedio' | 'stockActual'> & { costoInicial?: number; stockInicial?: number }) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  toggleProductActive: (id: string) => void;

  // Acciones Compras
  createPurchase: (purchase: Omit<Purchase, 'id' | 'numeroCompra' | 'saldoPendiente' | 'pagos'>) => Purchase;
  receivePurchase: (purchaseId: string) => void;
  cancelPurchase: (purchaseId: string, motivo: string) => void;
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => void;

  // Acciones Cotizaciones
  createQuote: (quote: Omit<Quote, 'id' | 'numeroCotizacion'>) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  convertQuoteToInvoice: (quoteId: string, directIssue?: boolean) => Invoice;

  // Acciones Facturación & CxC
  createInvoice: (invoice: Omit<Invoice, 'id' | 'numeroFactura' | 'saldoPendiente' | 'pagos'>) => Invoice;
  issueInvoice: (invoiceId: string) => void;
  cancelInvoice: (invoiceId: string, motivo: string) => void;
  addClientPayment: (payment: Omit<ClientPayment, 'id'>) => void;

  // Acciones Inventario
  createInventoryAdjustment: (
    productoId: string,
    varianteId: string | undefined,
    cantidad: number,
    motivo: string,
    isInitialLoad?: boolean,
    costoInicialUnitario?: number
  ) => void;
  recalculateInventoryFromKardex: () => void;

  // Acciones Contabilidad
  addExpense: (expense: Omit<OperatingExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addFixedAsset: (asset: Omit<FixedAsset, 'id' | 'depreciacionMensual' | 'depreciacionAcumulada' | 'valorEnLibros' | 'activoEstado'>) => void;
  updateFixedAsset: (id: string, data: Partial<FixedAsset>) => void;

  // Cálculos de Prorrateo & KPIs
  getProrrateoMensual: (mesKey?: string, overrideCriterio?: ProrrateoCriterion) => MonthlyProrrateo;
  getProductRealCost: (productoId: string, mesKey?: string, overrideCriterio?: ProrrateoCriterion) => ProductRealCostResult;
  getProductStockAndCostAtMonth: (productoId: string, mesKey?: string) => { stock: number; costoPromedio: number };

  // Cierre de Periodos & Control de Fechas
  closedPeriods: ClosedPeriod[];
  isPeriodClosed: (monthKey: string) => boolean;
  getClosedPeriod: (monthKey: string) => ClosedPeriod | undefined;
  closePeriod: (monthKey: string, cerradoPor?: string, notas?: string) => ClosedPeriod;
  reopenPeriod: (monthKey: string, reabiertoPor?: string, motivo?: string) => void;
  getPeriodAuditHistory: (monthKey: string) => ClosedPeriodAudit[];
  hasUnclosedPreviousPeriod: (targetMonth?: string) => { hasUnclosed: boolean; unclosedMonth?: string };
  validateOperationDate: (fechaStr: string) => {
    allowed: boolean;
    status: 'ok' | 'warning' | 'blocked';
    message?: string;
    riskWarning?: string;
    reason?: 'closed_period' | 'future_date' | 'previous_unclosed';
  };

  // Gestión de Datos & Respaldos
  getFullERPData: () => FullERPData;
  restoreERPData: (data: FullERPData) => void;
  resetAllERPData: () => void;
  exportBackupJSON: (isAuto?: boolean) => void;
  exportExcel: () => void;
  autoBackupToast: string | null;
  clearAutoBackupToast: () => void;

  // Ajustes y Configuración
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
}

const STORAGE_PREFIX = 'VARC_MODULAR_ERP_V1_';

// Check and wipe legacy demo data if transitioning to clean blank workspace
if (typeof window !== 'undefined' && localStorage.getItem('VARC_ERP_products') && !localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
  const legacyKeys = [
    'VARC_ERP_settings', 'VARC_ERP_categories', 'VARC_ERP_clients',
    'VARC_ERP_suppliers', 'VARC_ERP_products', 'VARC_ERP_purchases',
    'VARC_ERP_quotes', 'VARC_ERP_invoices', 'VARC_ERP_movements',
    'VARC_ERP_expenses', 'VARC_ERP_assets'
  ];
  legacyKeys.forEach(k => localStorage.removeItem(k));
  localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State Initialization from LocalStorage or Seed Data
  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'suppliers');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'purchases');
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'quotes');
    return saved ? JSON.parse(saved) : initialQuotes;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'movements');
    return saved ? JSON.parse(saved) : initialInventoryMovements;
  });

  const [expenses, setExpenses] = useState<OperatingExpense[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : initialOperatingExpenses;
  });

  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'assets');
    return saved ? JSON.parse(saved) : initialFixedAssets;
  });

  const [closedPeriods, setClosedPeriods] = useState<ClosedPeriod[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'closed_periods');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.tema);
    document.documentElement.setAttribute('data-accent', settings.colorAcento);
    if (settings.monedaSimbolo) {
      setActiveCurrencySymbol(settings.monedaSimbolo);
    }
  }, [settings]);

  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'quotes', JSON.stringify(quotes)); }, [quotes]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'movements', JSON.stringify(inventoryMovements)); }, [inventoryMovements]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'assets', JSON.stringify(fixedAssets)); }, [fixedAssets]);
  useEffect(() => { localStorage.setItem(STORAGE_PREFIX + 'closed_periods', JSON.stringify(closedPeriods)); }, [closedPeriods]);

  // Actions: Clients & Suppliers
  const addClient = (data: Omit<Client, 'id' | 'creadoEn'>): Client => {
    const nextId = getNextEntityId('CL', clients);
    const newClient: Client = {
      ...data,
      id: nextId,
      activo: data.activo !== undefined ? data.activo : true,
      creadoEn: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const toggleClientActive = (id: string) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, activo: c.activo === false ? true : false } : c));
  };

  const addSupplier = (data: Omit<Supplier, 'id' | 'creadoEn'>): Supplier => {
    const nextId = getNextEntityId('PR', suppliers);
    const newSupplier: Supplier = {
      ...data,
      id: nextId,
      activo: data.activo !== undefined ? data.activo : true,
      creadoEn: new Date().toISOString()
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const toggleSupplierActive = (id: string) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, activo: s.activo === false ? true : false } : s));
  };

  // Actions: Categories & Products
  const addCategory = (data: Omit<Category, 'id'>): Category => {
    const nextId = generateDocNumber('CA', categories);
    const subcats = data.subcategorias ? data.subcategorias.map((s, idx) => ({
      ...s,
      id: s.id || `${nextId}-${idx + 1}`,
      categoriaId: nextId
    })) : undefined;

    const newCategory: Category = {
      ...data,
      id: nextId,
      subcategorias: subcats
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== id) return c;
      const subcats = data.subcategorias ? data.subcategorias.map((s, idx) => ({
        ...s,
        id: s.id || `${id}-${idx + 1}`,
        categoriaId: id
      })) : c.subcategorias;
      return { ...c, ...data, subcategorias: subcats };
    }));
  };

  const addProduct = (data: Omit<Product, 'id' | 'creadoEn' | 'costoPromedio' | 'stockActual'> & { costoInicial?: number; stockInicial?: number }): Product => {
    const prodId = generateDocNumber('PR', products);
    const initialCost = data.costoInicial || 0;
    const initialStock = data.stockInicial || 0;

    let variants: ProductVariant[] | undefined = undefined;
    let totalStock = initialStock;

    if (data.tieneVariantes && data.variantes && data.variantes.length > 0) {
      variants = data.variantes.map((v, i) => ({
        ...v,
        ubicacion: v.ubicacion || data.ubicacion,
        id: `var-${prodId}-${i + 1}`,
        productoId: prodId
      }));
      totalStock = variants.reduce((acc, v) => acc + (v.stockActual || 0), 0);
    }

    const nextSKU = getNextProductSKU(products);
    const finalCode = (data.codigo && data.codigo.trim()) ? data.codigo.trim().toUpperCase() : nextSKU;

    const newProduct: Product = {
      id: prodId,
      codigo: finalCode,
      nombre: data.nombre,
      categoriaId: data.categoriaId,
      subcategoriaId: data.subcategoriaId,
      unidadMedida: data.unidadMedida || 'pza',
      precioVenta: data.precioVenta,
      costoPromedio: initialCost,
      stockMinimo: data.stockMinimo || 5,
      stockActual: totalStock,
      tieneVariantes: data.tieneVariantes,
      variantes: variants,
      ubicacion: data.ubicacion,
      descripcion: data.descripcion,
      activo: data.activo !== undefined ? data.activo : true,
      creadoEn: new Date().toISOString()
    };

    setProducts(prev => [newProduct, ...prev]);

    // If initial stock was provided, create initial inventory entry
    if (totalStock > 0) {
      const initMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        fecha: new Date().toISOString(),
        tipo: 'ENTRADA_COMPRA',
        referenciaDoc: 'INVENTARIO_INICIAL',
        productoId: prodId,
        cantidad: totalStock,
        costoUnitario: initialCost,
        stockResultante: totalStock,
        motivo: 'Carga de inventario inicial al registrar producto',
        usuario: 'Sistema'
      };
      setInventoryMovements(prev => [initMovement, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...data };
      if (updated.tieneVariantes && updated.variantes) {
        updated.stockActual = updated.variantes.reduce((sum, v) => sum + (v.stockActual || 0), 0);
      }
      return updated;
    }));
  };

  const toggleProductActive = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, activo: p.activo === false ? true : false } : p));
  };

  // Helper to synchronously receive stock and update weighted average cost
  const applyPurchaseStockReception = (purchase: Purchase, receptionDate?: string) => {
    const movementTimestamp = receptionDate || purchase.recibidaFecha || new Date().toISOString();
    const newMovements: InventoryMovement[] = [];

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const itemsForThisProduct = purchase.items.filter(item => item.productoId === product.id);
        if (itemsForThisProduct.length === 0) return product;

        let updatedStock = product.stockActual;
        let updatedCost = product.costoPromedio;
        let updatedVariants = product.variantes ? product.variantes.map(v => ({ ...v })) : undefined;

        for (const item of itemsForThisProduct) {
          updatedCost = calculateWeightedAverageCost(
            updatedStock,
            updatedCost,
            item.cantidad,
            item.costoUnitario
          );

          const targetVarId = item.varianteId || (product.tieneVariantes && updatedVariants && updatedVariants.length > 0 ? updatedVariants[0].id : undefined);

          if (product.tieneVariantes && targetVarId && updatedVariants) {
            updatedVariants = updatedVariants.map(v => {
              if (v.id === targetVarId) {
                const varNewStock = (v.stockActual || 0) + item.cantidad;
                newMovements.push({
                  id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  fecha: movementTimestamp,
                  tipo: 'ENTRADA_COMPRA',
                  referenciaDoc: purchase.numeroCompra,
                  productoId: product.id,
                  varianteId: v.id,
                  cantidad: item.cantidad,
                  costoUnitario: item.costoUnitario,
                  stockResultante: varNewStock,
                  motivo: `Recepción de compra ${purchase.numeroCompra} (${v.talla} / ${v.color})`,
                  usuario: 'Almacén'
                });
                return { ...v, stockActual: varNewStock };
              }
              return v;
            });
          } else {
            updatedStock += item.cantidad;
            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: movementTimestamp,
              tipo: 'ENTRADA_COMPRA',
              referenciaDoc: purchase.numeroCompra,
              productoId: product.id,
              cantidad: item.cantidad,
              costoUnitario: item.costoUnitario,
              stockResultante: updatedStock,
              motivo: `Recepción de compra ${purchase.numeroCompra}`,
              usuario: 'Almacén'
            });
          }
        }

        if (product.tieneVariantes && updatedVariants) {
          updatedStock = updatedVariants.reduce((acc, v) => acc + (v.stockActual || 0), 0);
        }

        return {
          ...product,
          costoPromedio: updatedCost,
          stockActual: updatedStock,
          variantes: updatedVariants
        };
      });
    });

    const directFallbackMovements: InventoryMovement[] = purchase.items.map((item, idx) => {
      const prod = products.find(p => p.id === item.productoId);
      const variant = prod?.variantes?.find(v => v.id === item.varianteId);
      const resultingStock = (variant ? (variant.stockActual || 0) : (prod?.stockActual || 0)) + item.cantidad;
      return {
        id: `mov-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        fecha: movementTimestamp,
        tipo: 'ENTRADA_COMPRA' as MovementType,
        referenciaDoc: purchase.numeroCompra,
        productoId: item.productoId,
        varianteId: item.varianteId,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
        stockResultante: resultingStock,
        motivo: variant
          ? `Recepción de compra ${purchase.numeroCompra} (${variant.talla} / ${variant.color})`
          : `Recepción de compra ${purchase.numeroCompra}`,
        usuario: 'Almacén'
      };
    });

    setInventoryMovements(prev => {
      const itemsToAdd = newMovements.length > 0 ? newMovements : directFallbackMovements;
      return [...itemsToAdd, ...prev];
    });
  };

  // Helper to synchronously deduct stock and generate Kardex movements when an invoice is issued
  const applyInvoiceStockDeduction = (invoice: Invoice, deductionDate?: string) => {
    const movementTimestamp = deductionDate || invoice.emitidaFecha || new Date().toISOString();
    const newMovements: InventoryMovement[] = [];

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const itemsForThisProduct = invoice.items.filter(item => item.productoId === product.id);
        if (itemsForThisProduct.length === 0) return product;

        let updatedStock = product.stockActual;
        let updatedVariants = product.variantes ? product.variantes.map(v => ({ ...v })) : undefined;

        for (const item of itemsForThisProduct) {
          const targetVarId = item.varianteId || (product.tieneVariantes && updatedVariants && updatedVariants.length > 0 ? updatedVariants[0].id : undefined);

          if (product.tieneVariantes && targetVarId && updatedVariants) {
            updatedVariants = updatedVariants.map(v => {
              if (v.id === targetVarId) {
                const varNewStock = (v.stockActual || 0) - item.cantidad;
                newMovements.push({
                  id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  fecha: movementTimestamp,
                  tipo: 'SALIDA_VENTA',
                  referenciaDoc: invoice.numeroFactura,
                  productoId: product.id,
                  varianteId: v.id,
                  cantidad: -item.cantidad,
                  costoUnitario: product.costoPromedio,
                  stockResultante: varNewStock,
                  motivo: `Venta según factura ${invoice.numeroFactura} (${v.talla} / ${v.color})`,
                  usuario: 'Ventas'
                });
                return { ...v, stockActual: varNewStock };
              }
              return v;
            });
          } else {
            updatedStock = updatedStock - item.cantidad;
            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: movementTimestamp,
              tipo: 'SALIDA_VENTA',
              referenciaDoc: invoice.numeroFactura,
              productoId: product.id,
              cantidad: -item.cantidad,
              costoUnitario: product.costoPromedio,
              stockResultante: updatedStock,
              motivo: `Venta según factura ${invoice.numeroFactura}`,
              usuario: 'Ventas'
            });
          }
        }

        if (product.tieneVariantes && updatedVariants) {
          updatedStock = updatedVariants.reduce((acc, v) => acc + (v.stockActual || 0), 0);
        }

        return {
          ...product,
          stockActual: updatedStock,
          variantes: updatedVariants
        };
      });
    });

    if (newMovements.length > 0) {
      setInventoryMovements(prev => [...newMovements, ...prev]);
    }
  };

  // Actions: Compras (Purchases)
  const createPurchase = (data: Omit<Purchase, 'id' | 'numeroCompra' | 'saldoPendiente' | 'pagos'>): Purchase => {
    const num = generateDocNumber('CO', purchases);
    const isDirectReceive = data.estado === 'recibida';
    const now = new Date().toISOString();

    const newPurchase: Purchase = {
      ...data,
      id: num,
      numeroCompra: num,
      saldoPendiente: data.total,
      pagos: [],
      estado: data.estado || 'borrador',
      recibidaFecha: isDirectReceive ? now : undefined
    };

    setPurchases(prev => [newPurchase, ...prev]);

    if (isDirectReceive) {
      applyPurchaseStockReception(newPurchase, now);
    }

    return newPurchase;
  };

  const receivePurchase = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.estado === 'recibida' || purchase.estado === 'pagada' || purchase.estado === 'anulada') {
      return;
    }

    const now = new Date().toISOString();
    applyPurchaseStockReception(purchase, now);

    setPurchases(prev => prev.map(p => p.id === purchaseId ? {
      ...p,
      estado: p.saldoPendiente <= 0 ? 'pagada' : 'recibida',
      recibidaFecha: now
    } : p));
  };

  // Core Reconciliation Engine:
  // Reconstructs products' stockActual, variant stocks, costoPromedio, AND every movement's stockResultante chronologically
  const computeReconciliation = (
    allProducts: Product[],
    allMovements: InventoryMovement[]
  ): { reconciledProducts: Product[]; reconciledMovements: InventoryMovement[]; hasChanges: boolean } => {
    const movementStockResultMap = new Map<string, number>();
    let hasChanges = false;

    const reconciledProducts = allProducts.map(product => {
      const proMovements = allMovements
        .filter(m => m.productoId === product.id)
        .sort((a, b) => {
          const tA = parseDateSafe(a.fecha)?.getTime() || 0;
          const tB = parseDateSafe(b.fecha)?.getTime() || 0;
          if (tA !== tB) return tA - tB;
          return allMovements.indexOf(b) - allMovements.indexOf(a);
        });

      if (proMovements.length === 0) {
        return product;
      }

      let runningStock = 0;
      let runningCost = 0;
      const variantStocks: Record<string, number> = {};

      if (product.variantes) {
        product.variantes.forEach(v => {
          variantStocks[v.id] = 0;
        });
      }

      for (const m of proMovements) {
        const qty = Number(m.cantidad) || 0;
        const cost = Number(m.costoUnitario) || 0;
        const targetVarId = m.varianteId || (product.tieneVariantes && product.variantes && product.variantes.length > 0 ? product.variantes[0].id : undefined);

        if (m.tipo === 'ENTRADA_COMPRA' || m.tipo === 'INVENTARIO_INICIAL') {
          const posQty = Math.abs(qty);
          if (runningStock === 0 && cost > 0) {
            runningCost = cost;
          } else {
            runningCost = calculateWeightedAverageCost(runningStock, runningCost, posQty, cost);
          }
          runningStock += posQty;
          if (targetVarId) {
            variantStocks[targetVarId] = (variantStocks[targetVarId] || 0) + posQty;
          }
        } else if (m.tipo === 'SALIDA_VENTA') {
          const outQty = Math.abs(qty);
          runningStock = runningStock - outQty;
          if (targetVarId) {
            variantStocks[targetVarId] = (variantStocks[targetVarId] || 0) - outQty;
          }
        } else if (m.tipo === 'AJUSTE_MANUAL') {
          runningStock = runningStock + qty;
          if (targetVarId) {
            variantStocks[targetVarId] = (variantStocks[targetVarId] || 0) + qty;
          }
        } else if (m.tipo === 'ANULACION_COMPRA') {
          const cancQty = Math.abs(qty);
          const currentVal = Math.max(0, runningStock * runningCost);
          const cancelledVal = cancQty * cost;
          const remainingVal = Math.max(0, currentVal - cancelledVal);
          runningStock = runningStock - cancQty;
          runningCost = runningStock > 0 ? Number((remainingVal / runningStock).toFixed(2)) : (runningStock === 0 ? 0 : runningCost);
          if (targetVarId) {
            variantStocks[targetVarId] = (variantStocks[targetVarId] || 0) - cancQty;
          }
        } else if (m.tipo === 'ANULACION_VENTA') {
          const reenterQty = Math.abs(qty);
          runningStock += reenterQty;
          if (targetVarId) {
            variantStocks[targetVarId] = (variantStocks[targetVarId] || 0) + reenterQty;
          }
        }

        const resultantForLog = (targetVarId && variantStocks[targetVarId] !== undefined)
          ? variantStocks[targetVarId]
          : runningStock;

        movementStockResultMap.set(m.id, resultantForLog);
      }

      let updatedVariants = product.variantes;
      let finalStock = runningStock;

      if (product.tieneVariantes && product.variantes && product.variantes.length > 0) {
        updatedVariants = product.variantes.map(v => ({
          ...v,
          stockActual: variantStocks[v.id] ?? 0
        }));
        finalStock = updatedVariants.reduce((sum, v) => sum + (v.stockActual || 0), 0);
      }

      if (finalStock !== product.stockActual || runningCost !== product.costoPromedio) {
        hasChanges = true;
        return {
          ...product,
          stockActual: finalStock,
          costoPromedio: runningCost,
          variantes: updatedVariants
        };
      }

      return product;
    });

    const reconciledMovements = allMovements.map(m => {
      if (movementStockResultMap.has(m.id)) {
        const correctResult = movementStockResultMap.get(m.id)!;
        if (m.stockResultante !== correctResult) {
          hasChanges = true;
          return { ...m, stockResultante: correctResult };
        }
      }
      return m;
    });

    return { reconciledProducts, reconciledMovements, hasChanges };
  };

  const getProductStockAndCostAtMonth = (productId: string, mesKey = getMonthKey()): { stock: number; costoPromedio: number } => {
    // 1. Si el mes está formalmente cerrado en closedPeriods, devolver el snapshot inmutable congelado
    const closedPeriod = closedPeriods.find(cp => cp.mes === mesKey);
    if (closedPeriod && closedPeriod.productsSnapshot && closedPeriod.productsSnapshot[productId]) {
      const snap = closedPeriod.productsSnapshot[productId];
      return { stock: Math.max(0, snap.stock), costoPromedio: snap.costoPromedio || 0 };
    }

    const product = products.find(p => p.id === productId);
    if (!product) return { stock: 0, costoPromedio: 0 };

    const currentMonth = getMonthKey();
    if (mesKey >= currentMonth) {
      return { stock: Math.max(0, product.stockActual), costoPromedio: product.costoPromedio || 0 };
    }

    // Para meses pasados cerrados: reconstrucción acumulada hasta el último día del mes
    const proMovements = inventoryMovements
      .filter(m => m.productoId === productId && (m.fecha.slice(0, 7) <= mesKey))
      .sort((a, b) => {
        const tA = parseDateSafe(a.fecha)?.getTime() || 0;
        const tB = parseDateSafe(b.fecha)?.getTime() || 0;
        if (tA !== tB) return tA - tB;
        return inventoryMovements.indexOf(a) - inventoryMovements.indexOf(b);
      });

    if (proMovements.length === 0) {
      return { stock: 0, costoPromedio: product.costoPromedio || 0 };
    }

    let runningStock = 0;
    let runningCost = 0;

    for (const m of proMovements) {
      const qty = Number(m.cantidad) || 0;
      const cost = Number(m.costoUnitario) || 0;

      if (m.tipo === 'ENTRADA_COMPRA' || m.tipo === 'INVENTARIO_INICIAL') {
        const posQty = Math.abs(qty);
        if (runningStock === 0 && cost > 0) {
          runningCost = cost;
        } else {
          runningCost = calculateWeightedAverageCost(runningStock, runningCost, posQty, cost);
        }
        runningStock += posQty;
      } else if (m.tipo === 'SALIDA_VENTA') {
        const outQty = Math.abs(qty);
        runningStock = Math.max(0, runningStock - outQty);
      } else if (m.tipo === 'AJUSTE_MANUAL') {
        runningStock = Math.max(0, runningStock + qty);
      } else if (m.tipo === 'ANULACION_COMPRA') {
        const cancQty = Math.abs(qty);
        const currentVal = Math.max(0, runningStock * runningCost);
        const cancelledVal = cancQty * cost;
        const remainingVal = Math.max(0, currentVal - cancelledVal);
        runningStock = Math.max(0, runningStock - cancQty);
        runningCost = runningStock > 0 ? Number((remainingVal / runningStock).toFixed(2)) : (runningStock === 0 ? 0 : runningCost);
      } else if (m.tipo === 'ANULACION_VENTA') {
        const reenterQty = Math.abs(qty);
        runningStock += reenterQty;
      }
    }

    return {
      stock: Math.max(0, runningStock),
      costoPromedio: runningCost > 0 ? runningCost : (product.costoPromedio || 0)
    };
  };

  // Self-healing & Retroactive Kardex Reconciliation on startup:
  // Reconciles all products' stockActual, variant stocks, weighted average cost AND all movements' stockResultante
  useEffect(() => {
    const movementsToAdd: InventoryMovement[] = [];

    // 1. Verify and self-heal Purchases
    purchases.forEach(pur => {
      if (pur.estado === 'recibida' || pur.estado === 'pagada') {
        const hasEntry = inventoryMovements.some(m => m.referenciaDoc === pur.numeroCompra && m.tipo === 'ENTRADA_COMPRA');
        if (!hasEntry && pur.items && pur.items.length > 0) {
          pur.items.forEach(item => {
            movementsToAdd.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: pur.recibidaFecha || (pur.fecha && pur.fecha.includes('T') ? pur.fecha : undefined) || new Date().toISOString(),
              tipo: 'ENTRADA_COMPRA',
              referenciaDoc: pur.numeroCompra,
              productoId: item.productoId,
              varianteId: item.varianteId,
              cantidad: item.cantidad,
              costoUnitario: item.costoUnitario,
              stockResultante: 0,
              motivo: `Recepción de compra ${pur.numeroCompra}`,
              usuario: 'Almacén'
            });
          });
        }
      }

      if (pur.estado === 'anulada') {
        const hasEntry = inventoryMovements.some(m => m.referenciaDoc === pur.numeroCompra && m.tipo === 'ENTRADA_COMPRA');
        const hasAnnul = inventoryMovements.some(m => m.referenciaDoc === pur.numeroCompra && m.tipo === 'ANULACION_COMPRA');
        if (hasEntry && !hasAnnul && pur.items && pur.items.length > 0) {
          pur.items.forEach(item => {
            movementsToAdd.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: pur.anuladoFecha || (pur.fecha && pur.fecha.includes('T') ? pur.fecha : undefined) || new Date().toISOString(),
              tipo: 'ANULACION_COMPRA',
              referenciaDoc: pur.numeroCompra,
              productoId: item.productoId,
              varianteId: item.varianteId,
              cantidad: -item.cantidad,
              costoUnitario: item.costoUnitario,
              stockResultante: 0,
              motivo: `Anulación de compra ${pur.numeroCompra}: ${pur.anuladoMotivo || 'Anulación registrada'}`,
              usuario: 'Administrador'
            });
          });
        }
      }
    });

    // 2. Verify and self-heal Sales Invoices
    invoices.forEach(inv => {
      if (inv.estado === 'emitida' || inv.estado === 'pagada') {
        const hasExit = inventoryMovements.some(m => m.referenciaDoc === inv.numeroFactura && m.tipo === 'SALIDA_VENTA');
        if (!hasExit && inv.items && inv.items.length > 0) {
          inv.items.forEach(item => {
            const prod = products.find(p => p.id === item.productoId);
            movementsToAdd.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: inv.emitidaFecha || (inv.fechaEmision && inv.fechaEmision.includes('T') ? inv.fechaEmision : undefined) || new Date().toISOString(),
              tipo: 'SALIDA_VENTA',
              referenciaDoc: inv.numeroFactura,
              productoId: item.productoId,
              varianteId: item.varianteId,
              cantidad: -item.cantidad,
              costoUnitario: prod?.costoPromedio || 0,
              stockResultante: 0,
              motivo: `Venta según factura ${inv.numeroFactura}`,
              usuario: 'Ventas'
            });
          });
        }
      }

      if (inv.estado === 'anulada') {
        const hasExit = inventoryMovements.some(m => m.referenciaDoc === inv.numeroFactura && m.tipo === 'SALIDA_VENTA');
        const hasAnnul = inventoryMovements.some(m => m.referenciaDoc === inv.numeroFactura && m.tipo === 'ANULACION_VENTA');
        if (hasExit && !hasAnnul && inv.items && inv.items.length > 0) {
          inv.items.forEach(item => {
            const prod = products.find(p => p.id === item.productoId);
            movementsToAdd.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: inv.anuladoFecha || (inv.fechaEmision && inv.fechaEmision.includes('T') ? inv.fechaEmision : undefined) || new Date().toISOString(),
              tipo: 'ANULACION_VENTA',
              referenciaDoc: inv.numeroFactura,
              productoId: item.productoId,
              varianteId: item.varianteId,
              cantidad: item.cantidad,
              costoUnitario: prod?.costoPromedio || 0,
              stockResultante: 0,
              motivo: `Anulación de factura ${inv.numeroFactura}: ${inv.anuladoMotivo || 'Anulación registrada'}`,
              usuario: 'Administrador'
            });
          });
        }
      }
    });

    const baseMovements = movementsToAdd.length > 0 ? [...movementsToAdd, ...inventoryMovements] : inventoryMovements;
    const { reconciledProducts, reconciledMovements, hasChanges } = computeReconciliation(products, baseMovements);

    if (hasChanges || movementsToAdd.length > 0) {
      setProducts(reconciledProducts);
      setInventoryMovements(reconciledMovements);
    }

    // 3. Verify and sync Fixed Assets Monthly Depreciation
    if (fixedAssets.length > 0) {
      const { updatedExpenses, updatedAssets, hasChanges: depChanges } = syncAssetDepreciation(fixedAssets, expenses);
      if (depChanges) {
        setExpenses(updatedExpenses);
        setFixedAssets(updatedAssets);
      }
    }
  }, []);

  const cancelPurchase = (purchaseId: string, motivo: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.estado === 'anulada') return;

    const now = new Date().toISOString();
    const wasReceived = purchase.estado === 'recibida' || purchase.estado === 'pagada';

    if (wasReceived) {
      const compensatoryMovements: InventoryMovement[] = [];

      setProducts(prevProducts => {
        return prevProducts.map(product => {
          const itemsForThisProduct = purchase.items.filter(item => item.productoId === product.id);
          if (itemsForThisProduct.length === 0) return product;

          let updatedStock = product.stockActual;
          let updatedCost = product.costoPromedio;
          let updatedVariants = product.variantes ? product.variantes.map(v => ({ ...v })) : undefined;

          // Compute total inventory value before cancellation
          const currentTotalVal = Math.max(0, product.stockActual) * (product.costoPromedio || 0);
          let totalCancelledVal = 0;

          for (const item of itemsForThisProduct) {
            const itemCancelledVal = item.cantidad * item.costoUnitario;
            totalCancelledVal += itemCancelledVal;

            const targetVarId = item.varianteId || (product.tieneVariantes && updatedVariants && updatedVariants.length > 0 ? updatedVariants[0].id : undefined);

            if (product.tieneVariantes && targetVarId && updatedVariants) {
              updatedVariants = updatedVariants.map(v => {
                if (v.id === targetVarId) {
                  const varNewStock = Math.max(0, (v.stockActual || 0) - item.cantidad);
                  compensatoryMovements.push({
                    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    fecha: now,
                    tipo: 'ANULACION_COMPRA',
                    referenciaDoc: purchase.numeroCompra,
                    productoId: product.id,
                    varianteId: v.id,
                    cantidad: -item.cantidad,
                    costoUnitario: item.costoUnitario,
                    motivo: `Anulación de compra ${purchase.numeroCompra}: ${motivo}`,
                    usuario: 'Administrador'
                  });
                  return { ...v, stockActual: varNewStock };
                }
                return v;
              });
            } else {
              updatedStock = Math.max(0, updatedStock - item.cantidad);
              compensatoryMovements.push({
                id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                fecha: now,
                tipo: 'ANULACION_COMPRA',
                referenciaDoc: purchase.numeroCompra,
                productoId: product.id,
                cantidad: -item.cantidad,
                costoUnitario: item.costoUnitario,
                motivo: `Anulación de compra ${purchase.numeroCompra}: ${motivo}`,
                usuario: 'Administrador'
              });
            }
          }

          if (product.tieneVariantes && updatedVariants && updatedVariants.length > 0) {
            updatedStock = updatedVariants.reduce((acc, v) => acc + (v.stockActual || 0), 0);
          }

          // Recalculate weighted average cost after reversing cancelled purchase
          const remainingVal = Math.max(0, currentTotalVal - totalCancelledVal);
          if (updatedStock > 0) {
            updatedCost = Number((remainingVal / updatedStock).toFixed(2));
          } else {
            updatedCost = 0;
          }

          return {
            ...product,
            stockActual: updatedStock,
            costoPromedio: updatedCost,
            variantes: updatedVariants
          };
        });
      });

      if (compensatoryMovements.length > 0) {
        setInventoryMovements(prev => [...compensatoryMovements, ...prev]);
      }
    }

    setPurchases(prev => prev.map(p => p.id === purchaseId ? {
      ...p,
      estado: 'anulada',
      anuladoMotivo: motivo,
      anuladoFecha: now,
      anuladoPor: 'Administrador'
    } : p));
  };

  const addSupplierPayment = (paymentData: Omit<SupplierPayment, 'id'>) => {
    const allSupplierPayments = purchases.flatMap(pur => pur.pagos || []);
    const refFinal = paymentData.referencia && paymentData.referencia.trim()
      ? paymentData.referencia.trim()
      : getNextDocNumber('PA', allSupplierPayments);

    const payment: SupplierPayment = {
      ...paymentData,
      referencia: refFinal,
      id: `pay-${Date.now()}`
    };

    setPurchases(prev => prev.map(purchase => {
      if (purchase.id !== payment.compraId) return purchase;
      const newPagos = [...purchase.pagos, payment];
      const totalPagado = newPagos.reduce((sum, p) => sum + p.monto, 0);
      const nuevoSaldo = Math.max(0, purchase.total - totalPagado);
      const nuevoEstado = nuevoSaldo <= 0.01 && purchase.estado === 'recibida' ? 'pagada' : purchase.estado;

      return {
        ...purchase,
        pagos: newPagos,
        saldoPendiente: nuevoSaldo,
        estado: nuevoEstado
      };
    }));
  };

  // Actions: Cotizaciones (Quotes)
  const createQuote = (data: Omit<Quote, 'id' | 'numeroCotizacion'>): Quote => {
    const num = generateDocNumber('CT', quotes);
    const newQuote: Quote = {
      ...data,
      id: num,
      numeroCotizacion: num
    };
    setQuotes(prev => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuote = (id: string, data: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
  };

  const convertQuoteToInvoice = (quoteId: string, directIssue: boolean = true): Invoice => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error('Cotización no encontrada');

    const client = clients.find(c => c.id === quote.clienteId);
    const tipoPago = client?.tipoPago || 'contado';
    const numFactura = generateDocNumber('FA', invoices);

    const invoiceItems = quote.items.map(item => ({
      id: `fitem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      facturaId: '',
      productoId: item.productoId,
      varianteId: item.varianteId,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      descuento: item.descuento,
      subtotal: item.subtotal
    }));

    const emissionDate = getTodayLocalDateString();

    const newInvoice: Invoice = {
      id: numFactura,
      numeroFactura: numFactura,
      cotizacionIdOrigen: quote.id,
      clienteId: quote.clienteId,
      fechaEmision: emissionDate,
      fechaVencimiento: getFutureLocalDateString(client?.diasCredito || 0),
      tipoPago: tipoPago,
      estado: directIssue ? (quote.total <= 0 ? 'pagada' : 'emitida') : 'borrador',
      emitidaFecha: directIssue ? emissionDate : undefined,
      items: invoiceItems,
      subtotal: quote.subtotal,
      descuentoTotal: quote.descuentoTotal,
      tasaImpuesto: settings.tasaImpuestoDefecto,
      impuestos: quote.impuestos,
      total: quote.total,
      saldoPendiente: quote.total,
      pagos: [],
      notas: `Factura generada desde cotización ${quote.numeroCotizacion}`
    };

    if (directIssue) {
      applyInvoiceStockDeduction(newInvoice, emissionDate);
    }

    setInvoices(prev => [newInvoice, ...prev]);
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, estado: 'aprobada', convertidaEnFacturaId: newInvoice.id } : q));

    return newInvoice;
  };

  // Actions: Facturación (Invoices & CxC)
  const createInvoice = (data: Omit<Invoice, 'id' | 'numeroFactura' | 'saldoPendiente' | 'pagos'>): Invoice => {
    const num = generateDocNumber('FA', invoices);
    const emissionDate = data.fechaEmision || getTodayLocalDateString();
    const isDirectEmit = data.estado === 'emitida';

    const itemsWithHistoricalCost = (data.items || []).map(item => {
      const prod = products.find(p => p.id === item.productoId);
      return {
        ...item,
        costoUnitarioHistorico: item.costoUnitarioHistorico ?? prod?.costoPromedio ?? 0
      };
    });

    const newInvoice: Invoice = {
      ...data,
      items: itemsWithHistoricalCost,
      id: num,
      numeroFactura: num,
      fechaEmision: emissionDate,
      saldoPendiente: data.total,
      pagos: [],
      estado: isDirectEmit ? (data.total <= 0 ? 'pagada' : 'emitida') : 'borrador',
      emitidaFecha: isDirectEmit ? (data.emitidaFecha || emissionDate) : undefined
    };

    if (isDirectEmit) {
      applyInvoiceStockDeduction(newInvoice, emissionDate);
    }

    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  };

  const issueInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.estado === 'emitida' || invoice.estado === 'pagada' || invoice.estado === 'anulada') {
      return;
    }

    const emissionDate = invoice.fechaEmision || getTodayLocalDateString();
    applyInvoiceStockDeduction(invoice, emissionDate);

    const itemsWithHistoricalCost = invoice.items.map(item => {
      if (item.costoUnitarioHistorico && item.costoUnitarioHistorico > 0) return item;
      const prod = products.find(p => p.id === item.productoId);
      return {
        ...item,
        costoUnitarioHistorico: prod?.costoPromedio ?? 0
      };
    });

    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {
      ...inv,
      items: itemsWithHistoricalCost,
      estado: inv.saldoPendiente <= 0 ? 'pagada' : 'emitida',
      emitidaFecha: emissionDate
    } : inv));
  };

  const cancelInvoice = (invoiceId: string, motivo: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.estado === 'anulada') return;

    const now = new Date().toISOString();
    const wasIssued = invoice.estado === 'emitida' || invoice.estado === 'pagada';

    if (wasIssued) {
      const compensatoryMovements: InventoryMovement[] = [];

      setProducts(prevProducts => {
        return prevProducts.map(product => {
          const itemsForThisProduct = invoice.items.filter(item => item.productoId === product.id);
          if (itemsForThisProduct.length === 0) return product;

          let updatedStock = product.stockActual;
          let updatedVariants = product.variantes ? product.variantes.map(v => ({ ...v })) : undefined;

          for (const item of itemsForThisProduct) {
            const targetVarId = item.varianteId || (product.tieneVariantes && updatedVariants && updatedVariants.length > 0 ? updatedVariants[0].id : undefined);

            if (product.tieneVariantes && targetVarId && updatedVariants) {
              updatedVariants = updatedVariants.map(v => {
                if (v.id === targetVarId) {
                  const varNewStock = v.stockActual + item.cantidad;
                  compensatoryMovements.push({
                    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    fecha: now,
                    tipo: 'ANULACION_VENTA',
                    referenciaDoc: invoice.numeroFactura,
                    productoId: product.id,
                    varianteId: v.id,
                    cantidad: item.cantidad,
                    costoUnitario: product.costoPromedio,
                    motivo: `Anulación de factura ${invoice.numeroFactura}: ${motivo}`,
                    usuario: 'Administrador'
                  });
                  return { ...v, stockActual: varNewStock };
                }
                return v;
              });
            } else {
              updatedStock += item.cantidad;
              compensatoryMovements.push({
                id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                fecha: now,
                tipo: 'ANULACION_VENTA',
                referenciaDoc: invoice.numeroFactura,
                productoId: product.id,
                cantidad: item.cantidad,
                costoUnitario: product.costoPromedio,
                motivo: `Anulación de factura ${invoice.numeroFactura}: ${motivo}`,
                usuario: 'Administrador'
              });
            }
          }

          if (product.tieneVariantes && updatedVariants) {
            updatedStock = updatedVariants.reduce((acc, v) => acc + v.stockActual, 0);
          }

          return {
            ...product,
            stockActual: updatedStock,
            variantes: updatedVariants
          };
        });
      });

      if (compensatoryMovements.length > 0) {
        setInventoryMovements(prev => [...compensatoryMovements, ...prev]);
      }
    }

    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {
      ...inv,
      estado: 'anulada',
      anuladoMotivo: motivo,
      anuladoFecha: now,
      anuladoPor: 'Administrador'
    } : inv));
  };

  const addClientPayment = (paymentData: Omit<ClientPayment, 'id'>) => {
    const allClientPayments = invoices.flatMap(inv => inv.pagos || []);
    const refFinal = paymentData.referencia && paymentData.referencia.trim()
      ? paymentData.referencia.trim()
      : getNextDocNumber('CB', allClientPayments);

    const payment: ClientPayment = {
      ...paymentData,
      referencia: refFinal,
      id: `cpay-${Date.now()}`
    };

    setInvoices(prev => prev.map(invoice => {
      if (invoice.id !== payment.facturaId) return invoice;
      const newPagos = [...invoice.pagos, payment];
      const totalPagado = newPagos.reduce((sum, p) => sum + p.monto, 0);
      const nuevoSaldo = Math.max(0, invoice.total - totalPagado);
      const nuevoEstado = nuevoSaldo <= 0.01 && invoice.estado === 'emitida' ? 'pagada' : invoice.estado;

      return {
        ...invoice,
        pagos: newPagos,
        saldoPendiente: nuevoSaldo,
        estado: nuevoEstado
      };
    }));
  };

  // Actions: Ajustes de Inventario y Carga Inicial
  const createInventoryAdjustment = (
    productoId: string,
    varianteId: string | undefined,
    cantidad: number,
    motivo: string,
    isInitialLoad = false,
    costoInicialUnitario?: number
  ) => {
    const now = new Date().toISOString();
    let resultingStock = 0;
    const targetProduct = products.find(p => p.id === productoId);
    const unitCost = isInitialLoad && costoInicialUnitario !== undefined && costoInicialUnitario >= 0
      ? costoInicialUnitario
      : (targetProduct?.costoPromedio || 0);

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        if (product.id !== productoId) return product;

        let updatedStock = product.stockActual;
        let updatedCost = product.costoPromedio;
        let updatedVariants = product.variantes ? product.variantes.map(v => ({ ...v })) : undefined;

        if (isInitialLoad && costoInicialUnitario !== undefined && costoInicialUnitario >= 0) {
          if (product.stockActual <= 0) {
            updatedCost = costoInicialUnitario;
          } else {
            updatedCost = calculateWeightedAverageCost(
              product.stockActual,
              product.costoPromedio,
              cantidad,
              costoInicialUnitario
            );
          }
        }

        const targetVarId = varianteId || (product.tieneVariantes && updatedVariants && updatedVariants.length > 0 ? updatedVariants[0].id : undefined);

        if (product.tieneVariantes && targetVarId && updatedVariants) {
          updatedVariants = updatedVariants.map(v => {
            if (v.id === targetVarId) {
              const newVarStock = (v.stockActual || 0) + cantidad;
              resultingStock = newVarStock;
              return { ...v, stockActual: newVarStock };
            }
            return v;
          });
          updatedStock = updatedVariants.reduce((sum, v) => sum + (v.stockActual || 0), 0);
        } else {
          updatedStock = updatedStock + cantidad;
          resultingStock = updatedStock;
        }

        return {
          ...product,
          costoPromedio: updatedCost,
          stockActual: updatedStock,
          variantes: updatedVariants
        };
      });
    });

    const docType: MovementType = isInitialLoad ? 'INVENTARIO_INICIAL' : 'AJUSTE_MANUAL';
    const nextRef = isInitialLoad
      ? generateDocNumber('II', inventoryMovements)
      : generateDocNumber('AJ', inventoryMovements);

    const newMovement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      fecha: now,
      tipo: docType,
      referenciaDoc: nextRef,
      productoId,
      varianteId,
      cantidad,
      costoUnitario: unitCost,
      stockResultante: resultingStock,
      motivo,
      usuario: 'Administrador'
    };

    setInventoryMovements(prev => [newMovement, ...prev]);
  };

  const recalculateInventoryFromKardex = () => {
    const { reconciledProducts, reconciledMovements } = computeReconciliation(products, inventoryMovements);
    setProducts(reconciledProducts);
    setInventoryMovements(reconciledMovements);
  };

  // Actions: Contabilidad (Gastos y Activos Fijos)
  const syncAssetDepreciation = (
    assets: FixedAsset[],
    currentExpenses: OperatingExpense[]
  ): { updatedExpenses: OperatingExpense[]; updatedAssets: FixedAsset[]; hasChanges: boolean } => {
    let hasChanges = false;
    let newExpensesList = [...currentExpenses];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const updatedAssets = assets.map(asset => {
      // Normalize asset ID from legacy DE to AC if present
      const normalizedAssetId = asset.id.startsWith('DE') ? asset.id.replace('DE', 'AC') : asset.id;
      if (normalizedAssetId !== asset.id) {
        hasChanges = true;
      }

      const acqDate = parseDateSafe(asset.fechaAdquisicion) || new Date();
      const startYear = acqDate.getFullYear();
      const startMonth = acqDate.getMonth();
      const startDay = acqDate.getDate();

      const mensual = asset.vidaUtilMeses > 0
        ? Number((asset.valorAdquisicion / asset.vidaUtilMeses).toFixed(2))
        : 0;

      // Calculate month difference
      const monthDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      const totalEligibleMonths = monthDiff < 0
        ? 0
        : Math.min(asset.vidaUtilMeses, monthDiff + 1);

      for (let m = 0; m < totalEligibleMonths; m++) {
        const targetYear = startYear + Math.floor((startMonth + m) / 12);
        const targetMonth = (startMonth + m) % 12;

        // Ensure not in future month
        if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth)) {
          break;
        }

        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const targetDay = Math.min(startDay, daysInMonth);
        const targetDate = new Date(targetYear, targetMonth, targetDay, 12, 0, 0);
        const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

        // Check if already registered
        const exists = newExpensesList.some(e =>
          !e.anulado &&
          (e.esDepreciacionDeActivoId === normalizedAssetId ||
           e.esDepreciacionDeActivoId === asset.id ||
           e.descripcion?.includes(`(${normalizedAssetId})`) ||
           e.descripcion?.includes(`(${asset.id})`)) &&
          e.periodoMes === monthKey
        );

        if (!exists) {
          const nextCode = getNextEntityId('DE', newExpensesList);
          const depExpense: OperatingExpense = {
            id: nextCode,
            codigoContable: nextCode,
            fecha: targetDate.toISOString(),
            periodoMes: monthKey,
            tipo: 'fijo',
            categoria: 'Depreciación de Activos',
            monto: mensual,
            descripcion: `Depreciación mensual (${m + 1}/${asset.vidaUtilMeses}) - ${asset.nombre} (${normalizedAssetId})`,
            referenciaFactura: normalizedAssetId,
            esDepreciacionDeActivoId: normalizedAssetId
          };
          newExpensesList = [depExpense, ...newExpensesList];
          hasChanges = true;
        }
      }

      const totalDepreciated = Math.min(asset.valorAdquisicion, totalEligibleMonths * mensual);
      const bookValue = Math.max(0, Number((asset.valorAdquisicion - totalDepreciated).toFixed(2)));
      const status: 'activo' | 'depreciado' | 'baja' = bookValue <= 0 ? 'depreciado' : 'activo';

      if (
        asset.id !== normalizedAssetId ||
        asset.depreciacionMensual !== mensual ||
        asset.depreciacionAcumulada !== totalDepreciated ||
        asset.valorEnLibros !== bookValue ||
        asset.activoEstado !== status
      ) {
        hasChanges = true;
        return {
          ...asset,
          id: normalizedAssetId,
          depreciacionMensual: mensual,
          depreciacionAcumulada: totalDepreciated,
          valorEnLibros: bookValue,
          activoEstado: status
        };
      }

      return asset;
    });

    return { updatedExpenses: newExpensesList, updatedAssets, hasChanges };
  };

  const addExpense = (expenseData: Omit<OperatingExpense, 'id'>) => {
    const nextCode = getNextEntityId('GA', expenses);
    const newExpense: OperatingExpense = {
      ...expenseData,
      id: nextCode,
      codigoContable: nextCode
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id || e.codigoContable === id);
    if (!exp || exp.anulado) return;
    const reversalCode = `${exp.codigoContable || exp.id}A`;
    const reversalExpense: OperatingExpense = {
      id: reversalCode,
      codigoContable: reversalCode,
      fecha: new Date().toISOString().split('T')[0],
      periodoMes: exp.periodoMes,
      tipo: exp.tipo,
      categoria: exp.categoria,
      monto: -Math.abs(exp.monto),
      descripcion: `Anulación de gasto ${exp.codigoContable || exp.id} - ${exp.descripcion}`,
      referenciaFactura: exp.referenciaFactura,
      anulado: true,
      esAnulacionDe: exp.codigoContable || exp.id
    };
    setExpenses(prev => prev.map(e => (e.id === exp.id ? { ...e, anulado: true } : e)).concat([reversalExpense]));
  };

  const addFixedAsset = (assetData: Omit<FixedAsset, 'id' | 'depreciacionMensual' | 'depreciacionAcumulada' | 'valorEnLibros' | 'activoEstado'>) => {
    const nextId = getNextEntityId('AC', fixedAssets);
    const mensual = assetData.vidaUtilMeses > 0 ? Number((assetData.valorAdquisicion / assetData.vidaUtilMeses).toFixed(2)) : 0;
    const newAsset: FixedAsset = {
      ...assetData,
      id: nextId,
      metodoDepreciacion: 'lineal',
      depreciacionMensual: mensual,
      depreciacionAcumulada: 0,
      valorEnLibros: assetData.valorAdquisicion,
      activoEstado: 'activo'
    };

    const assetsWithNew = [newAsset, ...fixedAssets];
    const { updatedExpenses, updatedAssets } = syncAssetDepreciation(assetsWithNew, expenses);
    setFixedAssets(updatedAssets);
    setExpenses(updatedExpenses);
  };

  const updateFixedAsset = (id: string, data: Partial<FixedAsset>) => {
    setFixedAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  // Cálculos de Prorrateo & Costo Real (Contabilidad Analítica)
  const getProrrateoMensual = (mesKey = getMonthKey(), overrideCriterio?: ProrrateoCriterion): MonthlyProrrateo => {
    const criterio: ProrrateoCriterion = overrideCriterio || settings.criterioProrrateoDefecto || 'costo_material';

    const monthExpenses = expenses.filter(e => (e.periodoMes === mesKey || e.fecha.startsWith(mesKey)) && !e.anulado);
    
    // Gastos fijos (excluye depreciaciones para evitar duplicación con depreciacionActivos)
    const gastosFijos = monthExpenses
      .filter(e => e.tipo === 'fijo' && e.categoria !== 'Depreciación de Activos' && !e.codigoContable?.startsWith('DE'))
      .reduce((sum, e) => sum + e.monto, 0);

    // Gastos variables
    const gastosVariables = monthExpenses
      .filter(e => e.tipo === 'variable')
      .reduce((sum, e) => sum + e.monto, 0);

    // Depreciación del periodo (toma exclusivamente los registros contables de depreciación posteados en este mes)
    const depreciacionActivos = monthExpenses
      .filter(e => (e.categoria === 'Depreciación de Activos' || e.codigoContable?.startsWith('DE') || e.esDepreciacionDeActivoId) && !e.anulado)
      .reduce((sum, e) => sum + e.monto, 0);

    const gastoOperativoTotal = gastosFijos + gastosVariables + depreciacionActivos;

    const validInvoices = invoices.filter(inv => 
      (inv.estado === 'emitida' || inv.estado === 'pagada') && 
      (inv.fechaEmision.startsWith(mesKey))
    );

    // Unidades vendidas en el periodo
    const unidadesVendidasPeriodo = validInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((iSum, item) => iSum + item.cantidad, 0);
    }, 0);

    // Costo de ventas directo del periodo (COGS)
    const costoVentasPeriodo = validInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((iSum, item) => {
        let itemCost = item.costoUnitarioHistorico;
        if (!itemCost) {
          const move = inventoryMovements.find(m => m.referenciaDoc === inv.numeroFactura && m.productoId === item.productoId && m.tipo === 'SALIDA_VENTA');
          if (move && move.costoUnitario > 0) {
            itemCost = move.costoUnitario;
          }
        }
        if (!itemCost) {
          const prod = products.find(p => p.id === item.productoId);
          itemCost = prod?.costoPromedio || (item.precioUnitario > 0 ? item.precioUnitario * 0.5 : 0);
        }
        return iSum + (item.cantidad * itemCost);
      }, 0);
    }, 0);

    // Total facturado del periodo
    const valorVentasPeriodo = validInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Unidades e inventario final disponible (Vivo para mes actual, o reconstruido para meses cerrados)
    const currentMonth = getMonthKey();
    const isPast = mesKey < currentMonth;

    let unidadesEnInventario = 0;
    let valorInventarioCostoTotal = 0;
    let valorInventarioVentaTotal = 0;

    if (isPast) {
      products.forEach(p => {
        const hist = getProductStockAndCostAtMonth(p.id, mesKey);
        unidadesEnInventario += hist.stock;
        valorInventarioCostoTotal += (hist.stock * hist.costoPromedio);
        valorInventarioVentaTotal += (hist.stock * p.precioVenta);
      });
    } else {
      unidadesEnInventario = products.reduce((sum, p) => sum + Math.max(0, p.stockActual), 0);
      valorInventarioCostoTotal = products.reduce((sum, p) => sum + (Math.max(0, p.stockActual) * p.costoPromedio), 0);
      valorInventarioVentaTotal = products.reduce((sum, p) => sum + (Math.max(0, p.stockActual) * p.precioVenta), 0);
    }

    // Volumen Total de Operación del periodo (Lo Vendido + Lo disponible en inventario)
    const totalUnidadesPeriodo = unidadesVendidasPeriodo + unidadesEnInventario;
    const baseCostoTotalPeriodo = costoVentasPeriodo + valorInventarioCostoTotal;
    const baseVentaTotalPeriodo = valorVentasPeriodo + valorInventarioVentaTotal;

    let baseTotalProrrateo = 1;
    let tasaAbsorcionPorcentaje = 0;

    if (criterio === 'costo_material') {
      // Base: Costo Total de Mercancías del Periodo (Costo Vendido + Inventario en Almacén)
      baseTotalProrrateo = baseCostoTotalPeriodo > 0 ? baseCostoTotalPeriodo : 1;
      tasaAbsorcionPorcentaje = Number(((gastoOperativoTotal / baseTotalProrrateo) * 100).toFixed(2));
    } else if (criterio === 'valor_venta') {
      // Base: Valor Comercial Total del Periodo (Ventas Facturadas + Inventario a Precio Venta)
      baseTotalProrrateo = baseVentaTotalPeriodo > 0 ? baseVentaTotalPeriodo : 1;
      tasaAbsorcionPorcentaje = Number(((gastoOperativoTotal / baseTotalProrrateo) * 100).toFixed(2));
    } else {
      // Base: Unidades Físicas Totales del Periodo (Vendidas + En Stock)
      const baseUnidades = totalUnidadesPeriodo > 0 ? totalUnidadesPeriodo : 1;
      baseTotalProrrateo = baseUnidades;
      tasaAbsorcionPorcentaje = Number((gastoOperativoTotal / baseUnidades).toFixed(2));
    }

    const divisorUnidades = totalUnidadesPeriodo > 0 ? totalUnidadesPeriodo : 1;
    const costoOperativoProrrateadoPorUnidad = Number((gastoOperativoTotal / divisorUnidades).toFixed(2));

    return {
      mes: mesKey,
      gastosFijos,
      gastosVariables,
      depreciacionActivos,
      gastoOperativoTotal,
      unidadesVendidasPeriodo,
      unidadesEnInventario,
      totalUnidadesPeriodo,
      costoVentasPeriodo,
      valorVentasPeriodo,
      valorInventarioCostoTotal,
      valorInventarioVentaTotal,
      baseTotalProrrateo,
      criterio,
      tasaAbsorcionPorcentaje,
      costoOperativoProrrateadoPorUnidad
    };
  };

  const getProductRealCost = (productoId: string, mesKey = getMonthKey(), overrideCriterio?: ProrrateoCriterion): ProductRealCostResult => {
    // 1. Si el mes está en closedPeriods, retornar los costos unitarios congelados en el snapshot
    const closedPeriod = closedPeriods.find(cp => cp.mes === mesKey);
    if (closedPeriod && closedPeriod.productsSnapshot && closedPeriod.productsSnapshot[productoId]) {
      const snap = closedPeriod.productsSnapshot[productoId];
      const prorrateo = getProrrateoMensual(mesKey, overrideCriterio);
      return {
        costoCompra: snap.costoPromedio,
        gastoOperativoUnitario: 0,
        gastoDepreciacionUnitario: 0,
        costoOperativoProrrateado: Number(Math.max(0, snap.costoReal - snap.costoPromedio).toFixed(2)),
        costoReal: snap.costoReal,
        tasaAbsorcionPorcentaje: prorrateo.tasaAbsorcionPorcentaje,
        criterio: prorrateo.criterio
      };
    }

    const product = products.find(p => p.id === productoId);
    const currentMonth = getMonthKey();
    const isPast = mesKey < currentMonth;
    const historical = isPast ? getProductStockAndCostAtMonth(productoId, mesKey) : null;
    const costoCompra = historical ? historical.costoPromedio : (product?.costoPromedio || 0);
    const precioVenta = product?.precioVenta || 0;
    const prorrateo = getProrrateoMensual(mesKey, overrideCriterio);

    const gastosFijosYVar = prorrateo.gastosFijos + prorrateo.gastosVariables;
    const gastosDepr = prorrateo.depreciacionActivos;
    const base = prorrateo.baseTotalProrrateo > 0 ? prorrateo.baseTotalProrrateo : 1;

    let gastoOperativoUnitario = 0;
    let gastoDepreciacionUnitario = 0;

    if (prorrateo.criterio === 'costo_material') {
      const tasaOp = (gastosFijosYVar / base);
      const tasaDep = (gastosDepr / base);
      gastoOperativoUnitario = Number((costoCompra * tasaOp).toFixed(2));
      gastoDepreciacionUnitario = Number((costoCompra * tasaDep).toFixed(2));
    } else if (prorrateo.criterio === 'valor_venta') {
      const tasaOp = (gastosFijosYVar / base);
      const tasaDep = (gastosDepr / base);
      gastoOperativoUnitario = Number((precioVenta * tasaOp).toFixed(2));
      gastoDepreciacionUnitario = Number((precioVenta * tasaDep).toFixed(2));
    } else {
      const totalU = prorrateo.totalUnidadesPeriodo > 0 ? prorrateo.totalUnidadesPeriodo : 1;
      gastoOperativoUnitario = Number((gastosFijosYVar / totalU).toFixed(2));
      gastoDepreciacionUnitario = Number((gastosDepr / totalU).toFixed(2));
    }

    const costoOperativoProrrateado = Number((gastoOperativoUnitario + gastoDepreciacionUnitario).toFixed(2));
    const costoReal = Number((costoCompra + costoOperativoProrrateado).toFixed(2));

    return {
      costoCompra,
      gastoOperativoUnitario,
      gastoDepreciacionUnitario,
      costoOperativoProrrateado,
      costoReal,
      tasaAbsorcionPorcentaje: prorrateo.tasaAbsorcionPorcentaje,
      criterio: prorrateo.criterio
    };
  };

  // -------------------------------------------------------------
  // Cierre de Periodos Contables, Snapshots Inmutables & Validación
  // -------------------------------------------------------------

  const isPeriodClosed = (monthKey: string): boolean => {
    return closedPeriods.some(cp => cp.mes === monthKey);
  };

  const getClosedPeriod = (monthKey: string): ClosedPeriod | undefined => {
    return closedPeriods.find(cp => cp.mes === monthKey);
  };

  const closePeriod = (monthKey: string, cerradoPor = 'Usuario Administrador', notas = ''): ClosedPeriod => {
    // 1. Snapshot P&L inmutable
    const monthInvoices = invoices.filter(i =>
      (i.estado === 'emitida' || i.estado === 'pagada') &&
      (i.fechaEmision && i.fechaEmision.startsWith(monthKey))
    );

    const totalGrossSales = monthInvoices.reduce((sum, i) => sum + (i.subtotal + i.descuentoTotal), 0);
    const totalDiscounts = monthInvoices.reduce((sum, i) => sum + i.descuentoTotal, 0);
    const totalNetSales = monthInvoices.reduce((sum, i) => sum + i.subtotal, 0);

    const totalCOGS = monthInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((iSum, item) => {
        let itemCost = item.costoUnitarioHistorico;
        if (!itemCost) {
          const move = inventoryMovements.find(m => m.referenciaDoc === inv.numeroFactura && m.productoId === item.productoId && m.tipo === 'SALIDA_VENTA');
          if (move && move.costoUnitario > 0) {
            itemCost = move.costoUnitario;
          }
        }
        if (!itemCost) {
          const prod = products.find(p => p.id === item.productoId);
          itemCost = prod?.costoPromedio || 0;
        }
        return iSum + (item.cantidad * itemCost);
      }, 0);
    }, 0);

    const grossProfit = totalNetSales - totalCOGS;
    const grossMarginPercent = totalNetSales > 0 ? ((grossProfit / totalNetSales) * 100).toFixed(1) : '0';

    const prorr = getProrrateoMensual(monthKey);
    const totalOperatingExpenses = prorr.gastosFijos + prorr.gastosVariables;
    const totalDepreciation = prorr.depreciacionActivos;
    const netOperatingIncome = grossProfit - totalOperatingExpenses - totalDepreciation;
    const netMarginPercent = totalNetSales > 0 ? ((netOperatingIncome / totalNetSales) * 100).toFixed(1) : '0';

    // 2. Snapshot Balance General inmutable al corte del mes
    const initialCapital = Number(settings.capitalAportado) || 0;
    const totalClientPaymentsReceived = invoices.reduce((sum, inv) => {
      return sum + inv.pagos
        .filter(p => p.fecha && p.fecha.slice(0, 7) <= monthKey)
        .reduce((pSum, p) => pSum + p.monto, 0);
    }, 0);

    const totalSupplierPaymentsMade = purchases.reduce((sum, pur) => {
      return sum + pur.pagos
        .filter(p => p.fecha && p.fecha.slice(0, 7) <= monthKey)
        .reduce((pSum, p) => pSum + p.monto, 0);
    }, 0);

    const totalExpensesPaid = expenses
      .filter(e => (e.periodoMes || (e.fecha && e.fecha.slice(0, 7))) <= monthKey)
      .reduce((sum, e) => sum + e.monto, 0);

    const realCash = initialCapital + totalClientPaymentsReceived - totalSupplierPaymentsMade - totalExpensesPaid;

    const totalReceivablesCxC = invoices
      .filter(i => (i.estado === 'emitida' || i.estado === 'borrador') && i.fechaEmision && i.fechaEmision.slice(0, 7) <= monthKey)
      .reduce((sum, i) => {
        const pagosHastaMes = i.pagos
          .filter(p => p.fecha && p.fecha.slice(0, 7) <= monthKey)
          .reduce((pSum, p) => pSum + p.monto, 0);
        return sum + Math.max(0, i.total - pagosHastaMes);
      }, 0);

    const totalPayablesCxP = purchases
      .filter(p => (p.estado === 'recibida' || p.estado === 'borrador') && p.fecha && p.fecha.slice(0, 7) <= monthKey)
      .reduce((sum, pur) => {
        const pagosHastaMes = pur.pagos
          .filter(p => p.fecha && p.fecha.slice(0, 7) <= monthKey)
          .reduce((pSum, p) => pSum + p.monto, 0);
        return sum + Math.max(0, pur.total - pagosHastaMes);
      }, 0);

    // 3. Snapshot de existencias y costos por producto
    const productsSnapshot: Record<string, ProductPeriodSnapshot> = {};
    let sumStock = 0;
    let sumValCompra = 0;
    let sumValReal = 0;

    products.forEach(p => {
      const stockAndCost = getProductStockAndCostAtMonth(p.id, monthKey);
      const realCostRes = getProductRealCost(p.id, monthKey);
      const valCompra = Number((stockAndCost.stock * stockAndCost.costoPromedio).toFixed(2));
      const valReal = Number((stockAndCost.stock * realCostRes.costoReal).toFixed(2));

      productsSnapshot[p.id] = {
        productId: p.id,
        stock: stockAndCost.stock,
        costoPromedio: stockAndCost.costoPromedio,
        valuacionCompra: valCompra,
        costoReal: realCostRes.costoReal,
        valuacionReal: valReal
      };

      sumStock += stockAndCost.stock;
      sumValCompra += valCompra;
      sumValReal += valReal;
    });

    const totalInventoryAssetValue = sumValCompra;

    // Depreciación acumulada de activos fijos hasta monthKey
    const totalFixedAssetsNet = fixedAssets
      .filter(a => a.fechaAdquisicion && a.fechaAdquisicion.slice(0, 7) <= monthKey)
      .reduce((sum, a) => {
        const [aY, aM] = a.fechaAdquisicion.slice(0, 7).split('-').map(Number);
        const [mY, mM] = monthKey.split('-').map(Number);
        const diffMonths = Math.max(0, (mY - aY) * 12 + (mM - aM) + 1);
        const monthsDepreciated = Math.min(a.vidaUtilMeses, diffMonths);
        const depAcum = monthsDepreciated * a.depreciacionMensual;
        const bookValue = Math.max(0, a.valorAdquisicion - depAcum);
        return sum + bookValue;
      }, 0);

    const totalAssets = realCash + totalReceivablesCxC + totalInventoryAssetValue + totalFixedAssetsNet;
    const totalLiabilities = totalPayablesCxP;
    const totalEquity = totalAssets - totalLiabilities;
    const accumulatedRetainedEarnings = totalEquity - initialCapital;

    // Historial previo si existiera (de closedPeriods o de period_audit)
    const existing = closedPeriods.find(cp => cp.mes === monthKey);
    let previousAudit: ClosedPeriodAudit[] = [];
    if (existing && existing.historial && existing.historial.length > 0) {
      previousAudit = [...existing.historial];
    } else {
      try {
        const rawAudit = JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'period_audit') || '[]');
        previousAudit = rawAudit
          .filter((a: any) => a.mes === monthKey)
          .map((a: any) => ({
            accion: a.accion,
            fecha: a.fecha,
            usuario: a.usuario,
            motivo: a.motivo
          }));
      } catch (e) {}
    }

    const currentAuditItem: ClosedPeriodAudit = {
      accion: 'cierre',
      fecha: new Date().toISOString(),
      usuario: cerradoPor,
      motivo: notas || 'Cierre formal de periodo contable'
    };

    const historial = [...previousAudit, currentAuditItem];

    try {
      const auditLog = JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'period_audit') || '[]');
      auditLog.push({
        mes: monthKey,
        accion: 'cierre',
        fecha: currentAuditItem.fecha,
        usuario: cerradoPor,
        motivo: notas || 'Cierre formal de periodo contable'
      });
      localStorage.setItem(STORAGE_PREFIX + 'period_audit', JSON.stringify(auditLog));
    } catch (e) {
      console.error('Error saving period audit log on close:', e);
    }

    const newClosedPeriod: ClosedPeriod = {
      mes: monthKey,
      cerradoEn: new Date().toISOString(),
      cerradoPor,
      notas,
      historial,
      pnlSnapshot: {
        totalGrossSales,
        totalDiscounts,
        totalNetSales,
        totalCOGS,
        grossProfit,
        grossMarginPercent,
        totalOperatingExpenses,
        totalDepreciation,
        netOperatingIncome,
        netMarginPercent
      },
      balanceSnapshot: {
        realCash,
        totalReceivablesCxC,
        totalInventoryAssetValue,
        totalFixedAssetsNet,
        totalAssets,
        totalPayablesCxP,
        totalLiabilities,
        totalEquity,
        initialCapital,
        accumulatedRetainedEarnings
      },
      productsSnapshot,
      totalStockUnits: sumStock,
      totalValuationCompra: sumValCompra,
      totalValuationReal: sumValReal
    };

    setClosedPeriods(prev => {
      const filtered = prev.filter(cp => cp.mes !== monthKey);
      return [...filtered, newClosedPeriod].sort((a, b) => a.mes.localeCompare(b.mes));
    });

    return newClosedPeriod;
  };

  const reopenPeriod = (monthKey: string, reabiertoPor = 'Usuario Administrador', motivo = '') => {
    setClosedPeriods(prev => {
      const target = prev.find(cp => cp.mes === monthKey);
      if (!target) return prev;

      try {
        const auditLog = JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'period_audit') || '[]');
        if (target.historial) {
          target.historial.forEach(h => {
            const exists = auditLog.some((a: any) => a.mes === monthKey && a.fecha === h.fecha && a.accion === h.accion);
            if (!exists) {
              auditLog.push({
                mes: monthKey,
                accion: h.accion,
                fecha: h.fecha,
                usuario: h.usuario,
                motivo: h.motivo
              });
            }
          });
        }
        auditLog.push({
          mes: monthKey,
          accion: 'reapertura',
          fecha: new Date().toISOString(),
          usuario: reabiertoPor,
          motivo: motivo || 'Reapertura para ajustes contables'
        });
        localStorage.setItem(STORAGE_PREFIX + 'period_audit', JSON.stringify(auditLog));
      } catch (e) {
        console.error('Error saving period audit log:', e);
      }

      return prev.filter(cp => cp.mes !== monthKey);
    });
  };

  const getPeriodAuditHistory = (monthKey: string): ClosedPeriodAudit[] => {
    const cp = closedPeriods.find(p => p.mes === monthKey);
    const cpHistorial: ClosedPeriodAudit[] = cp?.historial || [];

    let auditLog: ClosedPeriodAudit[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'period_audit') || '[]');
      auditLog = raw
        .filter((a: any) => a.mes === monthKey)
        .map((a: any) => ({
          accion: a.accion,
          fecha: a.fecha,
          usuario: a.usuario,
          motivo: a.motivo
        }));
    } catch (e) {}

    const map = new Map<string, ClosedPeriodAudit>();
    [...cpHistorial, ...auditLog].forEach(item => {
      const key = `${item.accion}_${item.fecha}_${item.usuario}`;
      map.set(key, item);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  const hasUnclosedPreviousPeriod = (targetMonth = getMonthKey()): { hasUnclosed: boolean; unclosedMonth?: string } => {
    const monthsWithActivity = new Set<string>();
    invoices.forEach(i => { if (i.fechaEmision) monthsWithActivity.add(i.fechaEmision.slice(0, 7)); });
    purchases.forEach(p => { if (p.fecha) monthsWithActivity.add(p.fecha.slice(0, 7)); });
    expenses.forEach(e => {
      if (e.periodoMes) monthsWithActivity.add(e.periodoMes);
      else if (e.fecha) monthsWithActivity.add(e.fecha.slice(0, 7));
    });

    const pastActiveMonths = Array.from(monthsWithActivity)
      .filter(m => m < targetMonth)
      .sort();

    for (const m of pastActiveMonths) {
      if (!closedPeriods.some(cp => cp.mes === m)) {
        return { hasUnclosed: true, unclosedMonth: m };
      }
    }

    return { hasUnclosed: false };
  };

  const validateOperationDate = (fechaStr: string): {
    allowed: boolean;
    status: 'ok' | 'warning' | 'blocked';
    message?: string;
    riskWarning?: string;
    reason?: 'closed_period' | 'future_date' | 'previous_unclosed';
  } => {
    if (!fechaStr) return { allowed: true, status: 'ok' };
    const fechaYMD = fechaStr.slice(0, 10);
    const fechaMes = fechaStr.slice(0, 7);
    const mode: DateRestrictionMode = settings.restriccionFechasModo || 'warning';

    if (mode === 'none') {
      return { allowed: true, status: 'ok' };
    }

    // 1. Periodo Cerrado
    if (closedPeriods.some(cp => cp.mes === fechaMes)) {
      if (mode === 'strict') {
        return {
          allowed: false,
          status: 'blocked',
          reason: 'closed_period',
          message: `El periodo ${fechaMes} está cerrado formalmente. Para registrar operaciones en este mes, debes reabrir el periodo en el módulo de Contabilidad.`
        };
      } else {
        return {
          allowed: true,
          status: 'warning',
          reason: 'closed_period',
          message: `La fecha seleccionada (${fechaYMD}) corresponde al periodo ${fechaMes}, el cual ya está cerrado formalmente. Registrar movimientos en periodos cerrados puede generar inconsistencias si decides recalcular reportes.`,
          riskWarning: 'Vas a poder continuar incluso si el sistema te advierte, así que un clic apresurado en "Confirmar" no te protege del todo.'
        };
      }
    }

    // 2. Fecha Futura
    const todayStr = getTodayLocalDateString();
    const parsedTarget = parseDateSafe(fechaYMD);
    const parsedToday = parseDateSafe(todayStr);

    if (parsedTarget && parsedToday) {
      const diffMs = parsedTarget.getTime() - parsedToday.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const allowedMargin = typeof settings.diasMargenFuturo === 'number' ? settings.diasMargenFuturo : 1;

      if (diffDays > allowedMargin) {
        if (mode === 'strict') {
          return {
            allowed: false,
            status: 'blocked',
            reason: 'future_date',
            message: `La fecha seleccionada (${fechaYMD}) es futura y excede el margen permitido de ${allowedMargin} día(s). Modifica la fecha o amplía el margen en Configuraciones.`
          };
        } else {
          return {
            allowed: true,
            status: 'warning',
            reason: 'future_date',
            message: `La fecha seleccionada (${fechaYMD}) es una fecha futura que excede el margen habitual (${allowedMargin} día(s)). Asegúrate de que la fecha sea la deseada antes de continuar.`,
            riskWarning: 'Vas a poder continuar incluso si el sistema te advierte, así que un clic apresurado en "Confirmar" no te protege del todo.'
          };
        }
      }
    }

    // 3. Exigir Cierre del Periodo Anterior
    if (settings.exigirCierrePeriodoAnterior) {
      const unclosedCheck = hasUnclosedPreviousPeriod(fechaMes);
      if (unclosedCheck.hasUnclosed && unclosedCheck.unclosedMonth) {
        if (mode === 'strict') {
          return {
            allowed: false,
            status: 'blocked',
            reason: 'previous_unclosed',
            message: `La opción 'Exigir cierre del periodo anterior' está activa y el periodo ${unclosedCheck.unclosedMonth} aún no ha sido cerrado formalmente. Debes cerrar ${unclosedCheck.unclosedMonth} en Contabilidad antes de registrar operaciones en ${fechaMes}.`
          };
        } else {
          return {
            allowed: true,
            status: 'warning',
            reason: 'previous_unclosed',
            message: `El periodo anterior (${unclosedCheck.unclosedMonth}) tiene operaciones pendientes y aún no ha sido cerrado formalmente. Se recomienda cerrarlo antes de operar en ${fechaMes}.`,
            riskWarning: 'Vas a poder continuar incluso si el sistema te advierte, así que un clic apresurado en "Confirmar" no te protege del todo.'
          };
        }
      }
    }

    return { allowed: true, status: 'ok' };
  };

  // Gestión de Datos & Respaldos (Exportación JSON & Excel)
  const [autoBackupToast, setAutoBackupToast] = useState<string | null>(null);

  const getFullERPData = (): FullERPData => ({
    settings,
    categories,
    clients,
    suppliers,
    products,
    purchases,
    quotes,
    invoices,
    inventoryMovements,
    expenses,
    fixedAssets,
    closedPeriods
  });

  const restoreERPData = (data: FullERPData) => {
    if (data.settings) setSettings(data.settings);
    if (data.categories) setCategories(data.categories);
    if (data.clients) setClients(data.clients);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.products) setProducts(data.products);
    if (data.purchases) setPurchases(data.purchases);
    if (data.quotes) setQuotes(data.quotes);
    if (data.invoices) setInvoices(data.invoices);
    if (data.inventoryMovements) setInventoryMovements(data.inventoryMovements);
    if (data.expenses) setExpenses(data.expenses);
    if (data.fixedAssets) setFixedAssets(data.fixedAssets);
    if (data.closedPeriods) setClosedPeriods(data.closedPeriods);
  };

  const resetAllERPData = () => {
    setCategories([]);
    setClients([]);
    setSuppliers([]);
    setProducts([]);
    setPurchases([]);
    setQuotes([]);
    setInvoices([]);
    setInventoryMovements([]);
    setExpenses([]);
    setFixedAssets([]);
    setClosedPeriods([]);
  };

  const exportBackupJSON = (isAuto = false) => {
    const fullData = getFullERPData();
    const timestamp = downloadJSONBackup(fullData, isAuto);
    const monthKey = timestamp.slice(0, 7);
    if (isAuto) {
      setSettings(prev => ({
        ...prev,
        ultimoRespaldoAutomatico: timestamp,
        ultimoRespaldoPeriodo: monthKey
      }));
    }
  };

  const exportExcel = () => {
    const fullData = getFullERPData();
    downloadExcelWorkbook(fullData);
  };

  const clearAutoBackupToast = () => {
    setAutoBackupToast(null);
  };

  // Respaldo Automático Mensual (se activa una vez cada mes automáticamente)
  useEffect(() => {
    if (!settings.respaldoAutomaticoActivo) return;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const lastPeriod = settings.ultimoRespaldoPeriodo;

    if (!lastPeriod || lastPeriod !== currentMonthKey) {
      const timer = setTimeout(() => {
        try {
          const fullData = getFullERPData();
          const timestamp = downloadJSONBackup(fullData, true);
          setSettings(prev => ({
            ...prev,
            ultimoRespaldoAutomatico: timestamp,
            ultimoRespaldoPeriodo: currentMonthKey
          }));
          setAutoBackupToast(`Respaldo automático mensual completado (${currentMonthKey})`);
        } catch (e) {
          console.error('Error en respaldo automático:', e);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [settings.respaldoAutomaticoActivo, settings.ultimoRespaldoPeriodo]);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    if (newSettings.monedaSimbolo) {
      setActiveCurrencySymbol(newSettings.monedaSimbolo);
    }
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (settings.monedaSimbolo) {
    setActiveCurrencySymbol(settings.monedaSimbolo);
  }

  return (
    <ERPContext.Provider
      value={{
        settings,
        currencySymbol: settings.monedaSimbolo || '$',
        formatMoney: (amount: number) => formatCurrency(amount, settings.moneda, settings.monedaSimbolo || '$'),
        clients,
        suppliers,
        categories,
        products,
        purchases,
        quotes,
        invoices,
        inventoryMovements,
        expenses,
        fixedAssets,
        addClient,
        updateClient,
        toggleClientActive,
        addSupplier,
        updateSupplier,
        toggleSupplierActive,
        addCategory,
        updateCategory,
        addProduct,
        updateProduct,
        toggleProductActive,
        createPurchase,
        receivePurchase,
        cancelPurchase,
        addSupplierPayment,
        createQuote,
        updateQuote,
        convertQuoteToInvoice,
        createInvoice,
        issueInvoice,
        cancelInvoice,
        addClientPayment,
        createInventoryAdjustment,
        recalculateInventoryFromKardex,
        addExpense,
        deleteExpense,
        addFixedAsset,
        updateFixedAsset,
        getProrrateoMensual,
        getProductRealCost,
        getProductStockAndCostAtMonth,
        closedPeriods,
        isPeriodClosed,
        getClosedPeriod,
        closePeriod,
        reopenPeriod,
        getPeriodAuditHistory,
        hasUnclosedPreviousPeriod,
        validateOperationDate,
        getFullERPData,
        restoreERPData,
        resetAllERPData,
        exportBackupJSON,
        exportExcel,
        autoBackupToast,
        clearAutoBackupToast,
        updateSettings
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
