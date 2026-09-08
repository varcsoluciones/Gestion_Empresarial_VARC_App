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
  OperatingExpense,
  FixedAsset,
  CompanySettings,
  ProrrateoCriterion,
  MonthlyProrrateo,
  ProductRealCostResult
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
import { calculateWeightedAverageCost, generateDocNumber, getMonthKey } from '../utils/formatters';

export interface ERPContextType {
  // Entidades
  settings: CompanySettings;
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
  addSupplier: (supplier: Omit<Supplier, 'id' | 'creadoEn'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;

  // Acciones Categorías & Productos
  addCategory: (category: Omit<Category, 'id'>) => Category;
  addProduct: (product: Omit<Product, 'id' | 'creadoEn' | 'costoPromedio' | 'stockActual'> & { costoInicial?: number; stockInicial?: number }) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;

  // Acciones Compras
  createPurchase: (purchase: Omit<Purchase, 'id' | 'numeroCompra' | 'saldoPendiente' | 'pagos'>) => Purchase;
  receivePurchase: (purchaseId: string) => void;
  cancelPurchase: (purchaseId: string, motivo: string) => void;
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => void;

  // Acciones Cotizaciones
  createQuote: (quote: Omit<Quote, 'id' | 'numeroCotizacion'>) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  convertQuoteToInvoice: (quoteId: string) => Invoice;

  // Acciones Facturación & CxC
  createInvoice: (invoice: Omit<Invoice, 'id' | 'numeroFactura' | 'saldoPendiente' | 'pagos'>) => Invoice;
  issueInvoice: (invoiceId: string) => void;
  cancelInvoice: (invoiceId: string, motivo: string) => void;
  addClientPayment: (payment: Omit<ClientPayment, 'id'>) => void;

  // Acciones Inventario
  createInventoryAdjustment: (productoId: string, varianteId: string | undefined, cantidad: number, motivo: string) => void;

  // Acciones Contabilidad
  addExpense: (expense: Omit<OperatingExpense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addFixedAsset: (asset: Omit<FixedAsset, 'id' | 'depreciacionMensual' | 'depreciacionAcumulada' | 'valorEnLibros' | 'activoEstado'>) => void;
  updateFixedAsset: (id: string, data: Partial<FixedAsset>) => void;

  // Cálculos de Prorrateo & KPIs
  getProrrateoMensual: (mesKey?: string, overrideCriterio?: ProrrateoCriterion) => MonthlyProrrateo;
  getProductRealCost: (productoId: string, mesKey?: string, overrideCriterio?: ProrrateoCriterion) => ProductRealCostResult;

  // Ajustes y Configuración
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  resetToDemoData: () => void;
}

const STORAGE_PREFIX = 'VARC_ERP_';

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

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.tema);
    document.documentElement.setAttribute('data-accent', settings.colorAcento);
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

  // Actions: Clients & Suppliers
  const addClient = (data: Omit<Client, 'id' | 'creadoEn'>): Client => {
    const newClient: Client = {
      ...data,
      id: `cli-${Date.now()}`,
      creadoEn: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const addSupplier = (data: Omit<Supplier, 'id' | 'creadoEn'>): Supplier => {
    const newSupplier: Supplier = {
      ...data,
      id: `prov-${Date.now()}`,
      creadoEn: new Date().toISOString()
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  // Actions: Categories & Products
  const addCategory = (data: Omit<Category, 'id'>): Category => {
    const newCategory: Category = {
      ...data,
      id: `cat-${Date.now()}`
    };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const addProduct = (data: Omit<Product, 'id' | 'creadoEn' | 'costoPromedio' | 'stockActual'> & { costoInicial?: number; stockInicial?: number }): Product => {
    const prodId = `prod-${Date.now()}`;
    const initialCost = data.costoInicial || 0;
    const initialStock = data.stockInicial || 0;

    let variants: ProductVariant[] | undefined = undefined;
    let totalStock = initialStock;

    if (data.tieneVariantes && data.variantes && data.variantes.length > 0) {
      variants = data.variantes.map((v, i) => ({
        ...v,
        id: `var-${prodId}-${i + 1}`,
        productoId: prodId
      }));
      totalStock = variants.reduce((acc, v) => acc + (v.stockActual || 0), 0);
    }

    const newProduct: Product = {
      id: prodId,
      codigo: data.codigo,
      nombre: data.nombre,
      categoriaId: data.categoriaId,
      unidadMedida: data.unidadMedida || 'pza',
      precioVenta: data.precioVenta,
      costoPromedio: initialCost,
      stockMinimo: data.stockMinimo || 5,
      stockActual: totalStock,
      tieneVariantes: data.tieneVariantes,
      variantes: variants,
      descripcion: data.descripcion,
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

  // Actions: Compras (Purchases)
  const createPurchase = (data: Omit<Purchase, 'id' | 'numeroCompra' | 'saldoPendiente' | 'pagos'>): Purchase => {
    const num = generateDocNumber('OC', purchases.length);
    const newPurchase: Purchase = {
      ...data,
      id: `pur-${Date.now()}`,
      numeroCompra: num,
      saldoPendiente: data.total,
      pagos: [],
      estado: data.estado || 'borrador'
    };

    setPurchases(prev => [newPurchase, ...prev]);

    if (newPurchase.estado === 'recibida') {
      setTimeout(() => receivePurchase(newPurchase.id), 50);
    }

    return newPurchase;
  };

  const receivePurchase = (purchaseId: string) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase || purchase.estado === 'recibida' || purchase.estado === 'pagada' || purchase.estado === 'anulada') {
      return;
    }

    const now = new Date().toISOString();
    const newMovements: InventoryMovement[] = [];

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const itemsForThisProduct = purchase.items.filter(item => item.productoId === product.id);
        if (itemsForThisProduct.length === 0) return product;

        let updatedStock = product.stockActual;
        let updatedCost = product.costoPromedio;
        let updatedVariants = product.variantes ? [...product.variantes] : undefined;

        for (const item of itemsForThisProduct) {
          updatedCost = calculateWeightedAverageCost(
            updatedStock,
            updatedCost,
            item.cantidad,
            item.costoUnitario
          );

          if (product.tieneVariantes && item.varianteId && updatedVariants) {
            updatedVariants = updatedVariants.map(v => {
              if (v.id === item.varianteId) {
                const varNewStock = v.stockActual + item.cantidad;
                newMovements.push({
                  id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  fecha: now,
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
              fecha: now,
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
          updatedStock = updatedVariants.reduce((acc, v) => acc + v.stockActual, 0);
        }

        return {
          ...product,
          costoPromedio: updatedCost,
          stockActual: updatedStock,
          variantes: updatedVariants
        };
      });
    });

    if (newMovements.length > 0) {
      setInventoryMovements(prev => [...newMovements, ...prev]);
    }

    setPurchases(prev => prev.map(p => p.id === purchaseId ? {
      ...p,
      estado: p.saldoPendiente <= 0 ? 'pagada' : 'recibida',
      recibidaFecha: now
    } : p));
  };

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
          let updatedVariants = product.variantes ? [...product.variantes] : undefined;

          for (const item of itemsForThisProduct) {
            if (product.tieneVariantes && item.varianteId && updatedVariants) {
              updatedVariants = updatedVariants.map(v => {
                if (v.id === item.varianteId) {
                  const varNewStock = Math.max(0, v.stockActual - item.cantidad);
                  compensatoryMovements.push({
                    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    fecha: now,
                    tipo: 'ANULACION_COMPRA',
                    referenciaDoc: purchase.numeroCompra,
                    productoId: product.id,
                    varianteId: v.id,
                    cantidad: -item.cantidad,
                    costoUnitario: item.costoUnitario,
                    stockResultante: varNewStock,
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
                stockResultante: updatedStock,
                motivo: `Anulación de compra ${purchase.numeroCompra}: ${motivo}`,
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

    setPurchases(prev => prev.map(p => p.id === purchaseId ? {
      ...p,
      estado: 'anulada',
      anuladoMotivo: motivo,
      anuladoFecha: now,
      anuladoPor: 'Administrador'
    } : p));
  };

  const addSupplierPayment = (paymentData: Omit<SupplierPayment, 'id'>) => {
    const payment: SupplierPayment = {
      ...paymentData,
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
    const num = generateDocNumber('COT', quotes.length);
    const newQuote: Quote = {
      ...data,
      id: `quot-${Date.now()}`,
      numeroCotizacion: num
    };
    setQuotes(prev => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuote = (id: string, data: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
  };

  const convertQuoteToInvoice = (quoteId: string): Invoice => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error('Cotización no encontrada');

    const client = clients.find(c => c.id === quote.clienteId);
    const tipoPago = client?.tipoPago || 'contado';
    const numFactura = generateDocNumber('FAC', invoices.length);

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

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      numeroFactura: numFactura,
      cotizacionIdOrigen: quote.id,
      clienteId: quote.clienteId,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(Date.now() + (client?.diasCredito || 0) * 86400000).toISOString().split('T')[0],
      tipoPago: tipoPago,
      estado: 'borrador',
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

    setInvoices(prev => [newInvoice, ...prev]);
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, estado: 'aprobada', convertidaEnFacturaId: newInvoice.id } : q));

    return newInvoice;
  };

  // Actions: Facturación (Invoices & CxC)
  const createInvoice = (data: Omit<Invoice, 'id' | 'numeroFactura' | 'saldoPendiente' | 'pagos'>): Invoice => {
    const num = generateDocNumber('FAC', invoices.length);
    const newInvoice: Invoice = {
      ...data,
      id: `inv-${Date.now()}`,
      numeroFactura: num,
      saldoPendiente: data.total,
      pagos: [],
      estado: data.estado || 'borrador'
    };

    setInvoices(prev => [newInvoice, ...prev]);

    if (newInvoice.estado === 'emitida') {
      setTimeout(() => issueInvoice(newInvoice.id), 50);
    }

    return newInvoice;
  };

  const issueInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.estado === 'emitida' || invoice.estado === 'pagada' || invoice.estado === 'anulada') {
      return;
    }

    const now = new Date().toISOString();
    const newMovements: InventoryMovement[] = [];

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const itemsForThisProduct = invoice.items.filter(item => item.productoId === product.id);
        if (itemsForThisProduct.length === 0) return product;

        let updatedStock = product.stockActual;
        let updatedVariants = product.variantes ? [...product.variantes] : undefined;

        for (const item of itemsForThisProduct) {
          if (product.tieneVariantes && item.varianteId && updatedVariants) {
            updatedVariants = updatedVariants.map(v => {
              if (v.id === item.varianteId) {
                const varNewStock = Math.max(0, v.stockActual - item.cantidad);
                newMovements.push({
                  id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  fecha: now,
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
            updatedStock = Math.max(0, updatedStock - item.cantidad);
            newMovements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fecha: now,
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
          updatedStock = updatedVariants.reduce((acc, v) => acc + v.stockActual, 0);
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

    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {
      ...inv,
      estado: inv.saldoPendiente <= 0 ? 'pagada' : 'emitida',
      emitidaFecha: now
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
          let updatedVariants = product.variantes ? [...product.variantes] : undefined;

          for (const item of itemsForThisProduct) {
            if (product.tieneVariantes && item.varianteId && updatedVariants) {
              updatedVariants = updatedVariants.map(v => {
                if (v.id === item.varianteId) {
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
                    stockResultante: varNewStock,
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
                stockResultante: updatedStock,
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
    const payment: ClientPayment = {
      ...paymentData,
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

  // Actions: Ajustes de Inventario
  const createInventoryAdjustment = (productoId: string, varianteId: string | undefined, cantidad: number, motivo: string) => {
    const now = new Date().toISOString();
    let resultingStock = 0;

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        if (product.id !== productoId) return product;

        let updatedStock = product.stockActual;
        let updatedVariants = product.variantes ? [...product.variantes] : undefined;

        if (product.tieneVariantes && varianteId && updatedVariants) {
          updatedVariants = updatedVariants.map(v => {
            if (v.id === varianteId) {
              const newVarStock = Math.max(0, v.stockActual + cantidad);
              resultingStock = newVarStock;
              return { ...v, stockActual: newVarStock };
            }
            return v;
          });
          updatedStock = updatedVariants.reduce((sum, v) => sum + v.stockActual, 0);
        } else {
          updatedStock = Math.max(0, updatedStock + cantidad);
          resultingStock = updatedStock;
        }

        return {
          ...product,
          stockActual: updatedStock,
          variantes: updatedVariants
        };
      });
    });

    const product = products.find(p => p.id === productoId);
    const newMovement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      fecha: now,
      tipo: 'AJUSTE_MANUAL',
      referenciaDoc: generateDocNumber('AJU', inventoryMovements.filter(m => m.tipo === 'AJUSTE_MANUAL').length),
      productoId,
      varianteId,
      cantidad,
      costoUnitario: product?.costoPromedio || 0,
      stockResultante: resultingStock,
      motivo,
      usuario: 'Administrador'
    };

    setInventoryMovements(prev => [newMovement, ...prev]);
  };

  // Actions: Contabilidad (Gastos y Activos Fijos)
  const addExpense = (expenseData: Omit<OperatingExpense, 'id'>) => {
    const newExpense: OperatingExpense = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addFixedAsset = (assetData: Omit<FixedAsset, 'id' | 'depreciacionMensual' | 'depreciacionAcumulada' | 'valorEnLibros' | 'activoEstado'>) => {
    const mensual = assetData.vidaUtilMeses > 0 ? Number((assetData.valorAdquisicion / assetData.vidaUtilMeses).toFixed(2)) : 0;
    const newAsset: FixedAsset = {
      ...assetData,
      id: `ast-${Date.now()}`,
      metodoDepreciacion: 'lineal',
      depreciacionMensual: mensual,
      depreciacionAcumulada: mensual,
      valorEnLibros: Math.max(0, assetData.valorAdquisicion - mensual),
      activoEstado: 'activo'
    };
    setFixedAssets(prev => [newAsset, ...prev]);
  };

  const updateFixedAsset = (id: string, data: Partial<FixedAsset>) => {
    setFixedAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  // Cálculos de Prorrateo & Costo Real (Contabilidad Analítica)
  const getProrrateoMensual = (mesKey = getMonthKey(), overrideCriterio?: ProrrateoCriterion): MonthlyProrrateo => {
    const criterio: ProrrateoCriterion = overrideCriterio || settings.criterioProrrateoDefecto || 'costo_material';

    const monthExpenses = expenses.filter(e => e.periodoMes === mesKey || e.fecha.startsWith(mesKey));
    const gastosFijos = monthExpenses.filter(e => e.tipo === 'fijo').reduce((sum, e) => sum + e.monto, 0);
    const gastosVariables = monthExpenses.filter(e => e.tipo === 'variable').reduce((sum, e) => sum + e.monto, 0);

    const depreciacionActivos = fixedAssets
      .filter(a => a.activoEstado === 'activo')
      .reduce((sum, a) => sum + a.depreciacionMensual, 0);

    const gastoOperativoTotal = gastosFijos + gastosVariables + depreciacionActivos;

    const validInvoices = invoices.filter(inv => 
      (inv.estado === 'emitida' || inv.estado === 'pagada') && 
      (inv.fechaEmision.startsWith(mesKey) || inv.emitidaFecha?.startsWith(mesKey))
    );

    const unidadesVendidasPeriodo = validInvoices.reduce((sum, inv) => {
      return sum + inv.items.reduce((iSum, item) => iSum + item.cantidad, 0);
    }, 0);

    const unidadesEnInventario = products.reduce((sum, p) => sum + p.stockActual, 0);
    const valorInventarioCostoTotal = products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);
    const valorInventarioVentaTotal = products.reduce((sum, p) => sum + (p.stockActual * p.precioVenta), 0);

    let baseTotalProrrateo = 1;
    let tasaAbsorcionPorcentaje = 0;

    if (criterio === 'costo_material') {
      // Base: Costo Directo de Materiales / Inventario Valuado
      baseTotalProrrateo = valorInventarioCostoTotal > 0 ? valorInventarioCostoTotal : 1;
      tasaAbsorcionPorcentaje = Number(((gastoOperativoTotal / baseTotalProrrateo) * 100).toFixed(2));
    } else if (criterio === 'valor_venta') {
      // Base: Valor Comercial / Ventas Totales
      baseTotalProrrateo = valorInventarioVentaTotal > 0 ? valorInventarioVentaTotal : 1;
      tasaAbsorcionPorcentaje = Number(((gastoOperativoTotal / baseTotalProrrateo) * 100).toFixed(2));
    } else {
      // Base: Unidades Físicas Iguales
      const baseUnidades = unidadesVendidasPeriodo > 0 ? unidadesVendidasPeriodo : (unidadesEnInventario > 0 ? unidadesEnInventario : 1);
      baseTotalProrrateo = baseUnidades;
      tasaAbsorcionPorcentaje = Number((gastoOperativoTotal / baseUnidades).toFixed(2));
    }

    const divisorUnidades = unidadesVendidasPeriodo > 0 ? unidadesVendidasPeriodo : (unidadesEnInventario > 0 ? unidadesEnInventario : 1);
    const costoOperativoProrrateadoPorUnidad = Number((gastoOperativoTotal / divisorUnidades).toFixed(2));

    return {
      mes: mesKey,
      gastosFijos,
      gastosVariables,
      depreciacionActivos,
      gastoOperativoTotal,
      unidadesVendidasPeriodo,
      unidadesEnInventario,
      valorInventarioCostoTotal,
      valorInventarioVentaTotal,
      baseTotalProrrateo,
      criterio,
      tasaAbsorcionPorcentaje,
      costoOperativoProrrateadoPorUnidad
    };
  };

  const getProductRealCost = (productoId: string, mesKey = getMonthKey(), overrideCriterio?: ProrrateoCriterion): ProductRealCostResult => {
    const product = products.find(p => p.id === productoId);
    const costoCompra = product?.costoPromedio || 0;
    const precioVenta = product?.precioVenta || 0;
    const prorrateo = getProrrateoMensual(mesKey, overrideCriterio);

    let costoOperativoProrrateado = 0;

    if (prorrateo.criterio === 'costo_material') {
      // Proporcional al costo de compra directo (material): Tasa % x Costo Directo
      costoOperativoProrrateado = Number((costoCompra * (prorrateo.tasaAbsorcionPorcentaje / 100)).toFixed(2));
    } else if (prorrateo.criterio === 'valor_venta') {
      // Proporcional al precio de venta
      costoOperativoProrrateado = Number((precioVenta * (prorrateo.tasaAbsorcionPorcentaje / 100)).toFixed(2));
    } else {
      // Por partes iguales
      costoOperativoProrrateado = prorrateo.costoOperativoProrrateadoPorUnidad;
    }

    const costoReal = Number((costoCompra + costoOperativoProrrateado).toFixed(2));

    return {
      costoCompra,
      costoOperativoProrrateado,
      costoReal,
      tasaAbsorcionPorcentaje: prorrateo.tasaAbsorcionPorcentaje,
      criterio: prorrateo.criterio
    };
  };

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToDemoData = () => {
    setSettings(initialSettings);
    setCategories(initialCategories);
    setClients(initialClients);
    setSuppliers(initialSuppliers);
    setProducts(initialProducts);
    setPurchases(initialPurchases);
    setQuotes(initialQuotes);
    setInvoices(initialInvoices);
    setInventoryMovements(initialInventoryMovements);
    setExpenses(initialOperatingExpenses);
    setFixedAssets(initialFixedAssets);
  };

  return (
    <ERPContext.Provider
      value={{
        settings,
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
        addSupplier,
        updateSupplier,
        addCategory,
        addProduct,
        updateProduct,
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
        addExpense,
        deleteExpense,
        addFixedAsset,
        updateFixedAsset,
        getProrrateoMensual,
        getProductRealCost,
        updateSettings,
        resetToDemoData
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
