import * as XLSX from 'xlsx';
import type {
  CompanySettings,
  Category,
  Client,
  Supplier,
  Product,
  Purchase,
  Quote,
  Invoice,
  InventoryMovement,
  OperatingExpense,
  FixedAsset,
  ERPBackupPayload
} from '../types/erp';

export interface FullERPData {
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
}

/**
 * Generates and triggers download of a JSON backup file
 */
export const downloadJSONBackup = (data: FullERPData, isAuto = false): string => {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.slice(0, 10);
  const timeStr = timestamp.slice(11, 16).replace(':', '');
  const prefix = isAuto ? 'VARC_ERP_AutoBackup' : 'VARC_ERP_Backup';
  const fileName = `${prefix}_${dateStr}_${timeStr}.json`;

  const payload: ERPBackupPayload = {
    version: '1.0.0',
    fechaExportacion: timestamp,
    empresa: data.settings.nombreEmpresa,
    data
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return timestamp;
};

/**
 * Validates and parses uploaded JSON backup file
 */
export const validateAndParseBackupJSON = (jsonString: string): { success: boolean; data?: FullERPData; error?: string } => {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both wrapped payload format and direct state dump
    const rawData = parsed.data || parsed;

    if (!rawData.products || !Array.isArray(rawData.products)) {
      return { success: false, error: 'El archivo no contiene un catálogo de productos válido.' };
    }

    const validatedData: FullERPData = {
      settings: rawData.settings || {},
      categories: Array.isArray(rawData.categories) ? rawData.categories : [],
      clients: Array.isArray(rawData.clients) ? rawData.clients : [],
      suppliers: Array.isArray(rawData.suppliers) ? rawData.suppliers : [],
      products: Array.isArray(rawData.products) ? rawData.products : [],
      purchases: Array.isArray(rawData.purchases) ? rawData.purchases : [],
      quotes: Array.isArray(rawData.quotes) ? rawData.quotes : [],
      invoices: Array.isArray(rawData.invoices) ? rawData.invoices : [],
      inventoryMovements: Array.isArray(rawData.inventoryMovements) ? rawData.inventoryMovements : [],
      expenses: Array.isArray(rawData.expenses) ? rawData.expenses : [],
      fixedAssets: Array.isArray(rawData.fixedAssets) ? rawData.fixedAssets : []
    };

    return { success: true, data: validatedData };
  } catch (err: any) {
    return { success: false, error: 'El archivo no es un JSON válido o está corrupto: ' + (err.message || '') };
  }
};

/**
 * Generates and triggers download of a complete multi-sheet Excel (.xlsx) file
 */
export const downloadExcelWorkbook = (data: FullERPData): void => {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);

  // 1. Resumen Ejecutivo
  const totalVentas = data.invoices
    .filter(i => i.estado === 'emitida' || i.estado === 'pagada')
    .reduce((sum, i) => sum + i.total, 0);

  const totalCxC = data.invoices
    .filter(i => i.estado === 'emitida')
    .reduce((sum, i) => sum + i.saldoPendiente, 0);

  const totalCxP = data.purchases
    .filter(p => p.estado === 'recibida')
    .reduce((sum, p) => sum + p.saldoPendiente, 0);

  const totalInventarioValuado = data.products.reduce((sum, p) => sum + (p.stockActual * p.costoPromedio), 0);
  const totalUnidadesInventario = data.products.reduce((sum, p) => sum + p.stockActual, 0);

  const resumenData = [
    { Parámetro: 'Empresa', Valor: data.settings.nombreEmpresa },
    { Parámetro: 'RFC / Identificación Fiscal', Valor: data.settings.identificacionFiscal },
    { Parámetro: 'Fecha del Reporte', Valor: dateStr },
    { Parámetro: 'Moneda', Valor: `${data.settings.moneda} (${data.settings.monedaSimbolo})` },
    { Parámetro: 'Total Facturado (Ventas Acumuladas)', Valor: totalVentas },
    { Parámetro: 'Cuentas por Cobrar (CxC)', Valor: totalCxC },
    { Parámetro: 'Cuentas por Pagar a Proveedores (CxP)', Valor: totalCxP },
    { Parámetro: 'Valor Total del Inventario a Costo', Valor: totalInventarioValuado },
    { Parámetro: 'Total de Unidades en Stock', Valor: totalUnidadesInventario },
    { Parámetro: 'Total de Productos Activos', Valor: data.products.length },
    { Parámetro: 'Total de Clientes Registrados', Valor: data.clients.length },
    { Parámetro: 'Total de Proveedores Registrados', Valor: data.suppliers.length }
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

  // 2. Productos y Variantes
  const productosFlat: any[] = [];
  data.products.forEach(p => {
    const cat = data.categories.find(c => c.id === p.categoriaId)?.nombre || 'General';
    if (p.tieneVariantes && p.variantes && p.variantes.length > 0) {
      p.variantes.forEach(v => {
        productosFlat.push({
          'Código': p.codigo,
          'SKU Variante': v.sku,
          'Nombre Producto': p.nombre,
          'Categoría': cat,
          'Talla': v.talla,
          'Color': v.color,
          'Stock Variante': v.stockActual,
          'Stock Total Producto': p.stockActual,
          'Unidad': p.unidadMedida,
          'Costo Compra Promedio': p.costoPromedio,
          'Precio Venta Base': p.precioVenta + (v.precioExtra || 0),
          'Valor Inventario': v.stockActual * p.costoPromedio,
          'Stock Mínimo': p.stockMinimo
        });
      });
    } else {
      productosFlat.push({
        'Código': p.codigo,
        'SKU Variante': 'N/A',
        'Nombre Producto': p.nombre,
        'Categoría': cat,
        'Talla': 'N/A',
        'Color': 'N/A',
        'Stock Variante': p.stockActual,
        'Stock Total Producto': p.stockActual,
        'Unidad': p.unidadMedida,
        'Costo Compra Promedio': p.costoPromedio,
        'Precio Venta Base': p.precioVenta,
        'Valor Inventario': p.stockActual * p.costoPromedio,
        'Stock Mínimo': p.stockMinimo
      });
    }
  });
  const wsProductos = XLSX.utils.json_to_sheet(productosFlat);
  XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos & Variantes');

  // 3. Ventas y Facturas
  const ventasFlat = data.invoices.map(inv => {
    const cli = data.clients.find(c => c.id === inv.clienteId)?.nombre || 'Cliente General';
    return {
      'Folio': inv.numeroFactura,
      'Cliente': cli,
      'Fecha Emisión': inv.fechaEmision,
      'Fecha Vencimiento': inv.fechaVencimiento,
      'Condición Pago': inv.tipoPago.toUpperCase(),
      'Subtotal': inv.subtotal,
      'Descuento': inv.descuentoTotal,
      'Impuestos (IVA)': inv.impuestos,
      'Total Facturado': inv.total,
      'Saldo Pendiente': inv.saldoPendiente,
      'Estado': inv.estado.toUpperCase(),
      'Pagos Recibidos': inv.pagos.reduce((s, p) => s + p.monto, 0),
      'Notas': inv.notas || ''
    };
  });
  const wsVentas = XLSX.utils.json_to_sheet(ventasFlat);
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas & Facturas');

  // 4. Compras y CxP
  const comprasFlat = data.purchases.map(pur => {
    const prov = data.suppliers.find(s => s.id === pur.proveedorId)?.nombre || 'Proveedor';
    return {
      'Folio': pur.numeroCompra,
      'Proveedor': prov,
      'Fecha Orden': pur.fecha,
      'Fecha Recepción': pur.recibidaFecha || 'Pendiente',
      'Condición Pago': pur.saldoPendiente === 0 ? 'LIQUIDADO' : 'CON SALDO PENDIENTE',
      'Subtotal': pur.subtotal,
      'Impuestos': pur.impuestos,
      'Total': pur.total,
      'Saldo Pendiente': pur.saldoPendiente,
      'Estado': pur.estado.toUpperCase(),
      'Notas': pur.notas || ''
    };
  });
  const wsCompras = XLSX.utils.json_to_sheet(comprasFlat);
  XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras & CxP');

  // 5. Kardex Permanente de Inventarios
  const kardexFlat = data.inventoryMovements.map(m => {
    const prod = data.products.find(p => p.id === m.productoId);
    const varItem = prod?.variantes?.find(v => v.id === m.varianteId);
    return {
      'ID Movimiento': m.id,
      'Fecha y Hora': m.fecha,
      'Tipo Movimiento': m.tipo,
      'Documento Referencia': m.referenciaDoc,
      'Producto': prod?.nombre || 'Desconocido',
      'Variante (Talla/Color)': varItem ? `${varItem.talla} / ${varItem.color}` : 'N/A',
      'Cantidad': m.cantidad,
      'Costo Unitario': m.costoUnitario,
      'Saldo Resultante': m.stockResultante,
      'Motivo': m.motivo,
      'Usuario': m.usuario || 'Sistema'
    };
  });
  const wsKardex = XLSX.utils.json_to_sheet(kardexFlat);
  XLSX.utils.book_append_sheet(wb, wsKardex, 'Kardex Inventario');

  // 6. Gastos Operativos
  const gastosFlat = data.expenses.map(e => ({
    'Fecha': e.fecha,
    'Periodo Mes': e.periodoMes,
    'Tipo Gasto': e.tipo.toUpperCase(),
    'Categoría': e.categoria,
    'Monto': e.monto,
    'Descripción': e.descripcion
  }));
  const wsGastos = XLSX.utils.json_to_sheet(gastosFlat);
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos Operativos');

  // 7. Activos Fijos & Depreciación
  const activosFlat = data.fixedAssets.map(a => ({
    'Nombre Activo': a.nombre,
    'Categoría': a.categoriaActivo,
    'Fecha Adquisición': a.fechaAdquisicion,
    'Valor Adquisición': a.valorAdquisicion,
    'Vida Útil (Meses)': a.vidaUtilMeses,
    'Depreciación Mensual': a.depreciacionMensual,
    'Depreciación Acumulada': a.depreciacionAcumulada,
    'Valor en Libros': a.valorEnLibros,
    'Estado': a.activoEstado.toUpperCase(),
    'Notas': a.notas || ''
  }));
  const wsActivos = XLSX.utils.json_to_sheet(activosFlat);
  XLSX.utils.book_append_sheet(wb, wsActivos, 'Activos Fijos');

  // 8. Clientes
  const clientesFlat = data.clients.map(c => ({
    'Nombre': c.nombre,
    'RFC / Identificación': c.identificacionFiscal,
    'Teléfono': c.telefono,
    'Email': c.email,
    'Dirección': c.direccion,
    'Tipo Pago': c.tipoPago.toUpperCase(),
    'Días Crédito': c.diasCredito,
    'Límite Crédito': c.limiteCredito,
    'Notas': c.notas || ''
  }));
  const wsClientes = XLSX.utils.json_to_sheet(clientesFlat);
  XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

  // 9. Proveedores
  const proveedoresFlat = data.suppliers.map(s => ({
    'Nombre': s.nombre,
    'RFC / Identificación': s.identificacionFiscal,
    'Teléfono': s.telefono,
    'Email': s.email,
    'Dirección': s.direccion,
    'Contacto': s.contactoNombre || '',
    'Notas': s.notas || ''
  }));
  const wsProveedores = XLSX.utils.json_to_sheet(proveedoresFlat);
  XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores');

  // Trigger Download
  const fileName = `VARC_ERP_Libro_Completo_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
