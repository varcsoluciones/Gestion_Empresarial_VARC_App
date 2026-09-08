import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { Client, Supplier, Product, PaymentTerm } from '../types/erp';
import { formatCurrency } from '../utils/formatters';
import {
  Users,
  Truck,
  Tags,
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { ExcelExportButton } from '../components/common/ExcelExportButton';

export const MasterDataPage: React.FC = () => {
  const {
    clients,
    suppliers,
    categories,
    products,
    addClient,
    updateClient,
    addSupplier,
    updateSupplier,
    addCategory,
    addProduct,
    updateProduct
  } = useERP();

  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers' | 'categories' | 'products'>('products');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Product
  const [prodCodigo, setProdCodigo] = useState('');
  const [prodNombre, setProdNombre] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodUnidad, setProdUnidad] = useState('pza');
  const [prodPrecio, setProdPrecio] = useState<number | ''>('');
  const [prodCosto, setProdCosto] = useState<number | ''>('');
  const [prodStockMin, setProdStockMin] = useState<number | ''>(5);
  const [prodStockInit, setProdStockInit] = useState<number | ''>(0);
  const [prodTieneVariantes, setProdTieneVariantes] = useState(false);
  const [prodVariantes, setProdVariantes] = useState<{ talla: string; color: string; sku: string; stockActual: number }[]>([]);
  const [prodDesc, setProdDesc] = useState('');

  // Form states for Client
  const [cliNombre, setCliNombre] = useState('');
  const [cliRFC, setCliRFC] = useState('');
  const [cliTel, setCliTel] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliDir, setCliDir] = useState('');
  const [cliTipoPago, setCliTipoPago] = useState<PaymentTerm>('contado');
  const [cliLimite, setCliLimite] = useState<number | ''>(10000);
  const [cliDias, setCliDias] = useState<number | ''>(30);

  // Form states for Supplier
  const [provNombre, setProvNombre] = useState('');
  const [provRFC, setProvRFC] = useState('');
  const [provTel, setProvTel] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provContacto, setProvContacto] = useState('');
  const [provDir, setProvDir] = useState('');

  // Expandable variants row state
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const toggleExpandProduct = (id: string) => {
    setExpandedProductIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Product Modal Open/Edit handlers
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdCodigo(`SKU-${Date.now().toString().slice(-4)}`);
    setProdNombre('');
    setProdCatId(categories[0]?.id || '');
    setProdUnidad('pza');
    setProdPrecio('');
    setProdCosto('');
    setProdStockMin(5);
    setProdStockInit(0);
    setProdTieneVariantes(false);
    setProdVariantes([
      { talla: 'M', color: 'Negro', sku: 'SKU-NEG-M', stockActual: 10 },
      { talla: 'L', color: 'Negro', sku: 'SKU-NEG-L', stockActual: 10 }
    ]);
    setProdDesc('');
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProdCodigo(product.codigo);
    setProdNombre(product.nombre);
    setProdCatId(product.categoriaId);
    setProdUnidad(product.unidadMedida);
    setProdPrecio(product.precioVenta);
    setProdCosto(product.costoPromedio);
    setProdStockMin(product.stockMinimo);
    setProdStockInit(product.stockActual);
    setProdTieneVariantes(product.tieneVariantes);
    setProdVariantes(product.variantes ? product.variantes.map(v => ({
      talla: v.talla,
      color: v.color,
      sku: v.sku,
      stockActual: v.stockActual
    })) : []);
    setProdDesc(product.descripcion || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodPrecio || Number(prodPrecio) <= 0) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        codigo: prodCodigo,
        nombre: prodNombre,
        categoriaId: prodCatId,
        unidadMedida: prodUnidad,
        precioVenta: Number(prodPrecio),
        stockMinimo: Number(prodStockMin) || 5,
        tieneVariantes: prodTieneVariantes,
        descripcion: prodDesc,
        variantes: prodTieneVariantes ? prodVariantes.map((v, i) => ({
          id: editingProduct.variantes?.[i]?.id || `var-${editingProduct.id}-${i + 1}`,
          productoId: editingProduct.id,
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          stockActual: Number(v.stockActual) || 0
        })) : undefined
      });
    } else {
      addProduct({
        codigo: prodCodigo,
        nombre: prodNombre,
        categoriaId: prodCatId,
        unidadMedida: prodUnidad,
        precioVenta: Number(prodPrecio),
        costoInicial: Number(prodCosto) || 0,
        stockInicial: Number(prodStockInit) || 0,
        stockMinimo: Number(prodStockMin) || 5,
        tieneVariantes: prodTieneVariantes,
        descripcion: prodDesc,
        variantes: prodTieneVariantes ? prodVariantes.map(v => ({
          sku: v.sku,
          talla: v.talla,
          color: v.color,
          stockActual: Number(v.stockActual) || 0,
          id: '',
          productoId: ''
        })) : undefined
      });
    }
    setIsProductModalOpen(false);
  };

  const handleAddVariantRow = () => {
    setProdVariantes(prev => [
      ...prev,
      { talla: 'M', color: 'Nuevo', sku: `${prodCodigo}-VAR-${prev.length + 1}`, stockActual: 5 }
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setProdVariantes(prev => prev.filter((_, i) => i !== index));
  };

  // Client Modal Handlers
  const handleOpenNewClient = () => {
    setEditingClient(null);
    setCliNombre('');
    setCliRFC('');
    setCliTel('');
    setCliEmail('');
    setCliDir('');
    setCliTipoPago('contado');
    setCliLimite(10000);
    setCliDias(30);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (c: Client) => {
    setEditingClient(c);
    setCliNombre(c.nombre);
    setCliRFC(c.identificacionFiscal);
    setCliTel(c.telefono);
    setCliEmail(c.email);
    setCliDir(c.direccion);
    setCliTipoPago(c.tipoPago);
    setCliLimite(c.limiteCredito);
    setCliDias(c.diasCredito);
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliNombre.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        nombre: cliNombre,
        identificacionFiscal: cliRFC || 'XAXX010101000',
        telefono: cliTel,
        email: cliEmail,
        direccion: cliDir,
        tipoPago: cliTipoPago,
        limiteCredito: cliTipoPago === 'credito' ? Number(cliLimite) || 0 : 0,
        diasCredito: cliTipoPago === 'credito' ? Number(cliDias) || 0 : 0
      });
    } else {
      addClient({
        nombre: cliNombre,
        identificacionFiscal: cliRFC || 'XAXX010101000',
        telefono: cliTel,
        email: cliEmail,
        direccion: cliDir,
        tipoPago: cliTipoPago,
        limiteCredito: cliTipoPago === 'credito' ? Number(cliLimite) || 0 : 0,
        diasCredito: cliTipoPago === 'credito' ? Number(cliDias) || 0 : 0
      });
    }
    setIsClientModalOpen(false);
  };

  // Supplier Modal Handlers
  const handleOpenNewSupplier = () => {
    setEditingSupplier(null);
    setProvNombre('');
    setProvRFC('');
    setProvTel('');
    setProvEmail('');
    setProvContacto('');
    setProvDir('');
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setProvNombre(s.nombre);
    setProvRFC(s.identificacionFiscal);
    setProvTel(s.telefono);
    setProvEmail(s.email);
    setProvContacto(s.contactoNombre || '');
    setProvDir(s.direccion);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provNombre.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        nombre: provNombre,
        identificacionFiscal: provRFC || 'PROV-GEN',
        telefono: provTel,
        email: provEmail,
        contactoNombre: provContacto,
        direccion: provDir
      });
    } else {
      addSupplier({
        nombre: provNombre,
        identificacionFiscal: provRFC || 'PROV-GEN',
        telefono: provTel,
        email: provEmail,
        contactoNombre: provContacto,
        direccion: provDir
      });
    }
    setIsSupplierModalOpen(false);
  };

  // Category save
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({ nombre: newCatName.trim(), descripcion: newCatDesc.trim() });
    setNewCatName('');
    setNewCatDesc('');
    setIsCategoryModalOpen(false);
  };

  // Filtered queries
  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identificacionFiscal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.identificacionFiscal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogos & Datos Maestros</h1>
          <p className="page-description">
            Configura el catálogo de productos con variantes, clientes, proveedores y categorías.
          </p>
        </div>
        <div className="page-actions">
          {activeTab === 'products' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewProduct}>
              <Plus size={16} />
              + Nuevo Producto
            </button>
          )}
          {activeTab === 'clients' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewClient}>
              <Plus size={16} />
              + Nuevo Cliente
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewSupplier}>
              <Plus size={16} />
              + Nuevo Proveedor
            </button>
          )}
          {activeTab === 'categories' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsCategoryModalOpen(true)}>
              <Plus size={16} />
              + Nueva Categoría
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
        >
          <Package size={16} />
          Productos & Variantes ({products.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}
        >
          <Users size={16} />
          Clientes ({clients.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
        >
          <Truck size={16} />
          Proveedores ({suppliers.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
        >
          <Tags size={16} />
          Categorías ({categories.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="form-control"
            placeholder={`Buscar en ${activeTab === 'products' ? 'productos por nombre o SKU' : activeTab === 'clients' ? 'clientes' : activeTab === 'suppliers' ? 'proveedores' : 'categorías'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ExcelExportButton filename={`Catalogo_Maestro_${activeTab.toUpperCase()}`} />
      </div>

      {/* Tab: Products & Variants */}
      {activeTab === 'products' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Código / SKU</th>
                <th>Nombre del Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Precio Venta</th>
                <th style={{ textAlign: 'right' }}>Costo Promedio</th>
                <th style={{ textAlign: 'center' }}>Stock Actual</th>
                <th style={{ textAlign: 'center' }}>Mínimo</th>
                <th style={{ textAlign: 'center' }}>Variantes</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const category = categories.find(c => c.id === p.categoriaId);
                const isExpanded = expandedProductIds[p.id];
                const hasLowStock = p.stockActual <= p.stockMinimo;

                return (
                  <React.Fragment key={p.id}>
                    <tr>
                      <td>
                        {p.tieneVariantes && p.variantes && p.variantes.length > 0 && (
                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            style={{ border: 'none', background: 'none' }}
                            onClick={() => toggleExpandProduct(p.id)}
                            title="Ver desglose de variantes"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.825rem' }}>
                        {p.codigo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                        {p.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.descripcion}</div>}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{category?.nombre || 'General'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(p.precioVenta)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(p.costoPromedio)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={hasLowStock ? 'danger' : 'success'}>
                          {p.stockActual} {p.unidadMedida}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {p.stockMinimo}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.tieneVariantes && p.variantes ? (
                          <span className="badge badge-accent" style={{ cursor: 'pointer' }} onClick={() => toggleExpandProduct(p.id)}>
                            {p.variantes.length} variantes
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simple</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => handleEditProduct(p)}
                          title="Editar producto"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Variants Breakdown */}
                    {isExpanded && p.tieneVariantes && p.variantes && (
                      <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                        <td colSpan={10} style={{ padding: '0.75rem 2rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Layers size={14} />
                              Desglose de Stock por Variantes ({p.nombre})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                              {p.variantes.map(v => (
                                <div
                                  key={v.id}
                                  style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.6rem 0.85rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                      {v.color} / Talla {v.talla}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                      {v.sku}
                                    </div>
                                  </div>
                                  <Badge variant={v.stockActual <= 3 ? 'danger' : 'neutral'}>
                                    {v.stockActual} pzs
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Clients */}
      {activeTab === 'clients' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre / Razón Social</th>
                <th>RFC / ID Fiscal</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th style={{ textAlign: 'center' }}>Condición</th>
                <th style={{ textAlign: 'right' }}>Límite Crédito</th>
                <th style={{ textAlign: 'center' }}>Días Crédito</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>{c.identificacionFiscal}</td>
                  <td>
                    <div>{c.telefono || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email || '-'}</div>
                  </td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{c.direccion || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={c.tipoPago === 'credito' ? 'accent' : 'neutral'}>
                      {c.tipoPago.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {c.tipoPago === 'credito' ? formatCurrency(c.limiteCredito) : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {c.tipoPago === 'credito' ? `${c.diasCredito} días` : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-icon btn-sm"
                      onClick={() => handleEditClient(c)}
                      title="Editar cliente"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Proveedor / Empresa</th>
                <th>RFC / ID Fiscal</th>
                <th>Contacto Principal</th>
                <th>Teléfono / Email</th>
                <th>Dirección</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>{s.identificacionFiscal}</td>
                  <td>{s.contactoNombre || '-'}</td>
                  <td>
                    <div>{s.telefono}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                  </td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{s.direccion || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-icon btn-sm"
                      onClick={() => handleEditSupplier(s)}
                      title="Editar proveedor"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div className="grid-3">
          {categories.map(cat => {
            const count = products.filter(p => p.categoriaId === cat.id).length;
            return (
              <div key={cat.id} className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tags size={18} style={{ color: 'var(--color-accent)' }} />
                    {cat.nombre}
                  </h3>
                  <Badge variant="accent">{count} productos</Badge>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minHeight: '40px' }}>
                  {cat.descripcion || 'Sin descripción adicional.'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
        subtitle="Configura precios, costos, stock y variantes de producto"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="product-full-form" className="btn btn-primary">
              Guardar Producto
            </button>
          </>
        }
      >
        <form id="product-full-form" onSubmit={handleSaveProduct}>
          <div className="form-row">
            <div className="form-group" style={{ flex: '0 0 150px' }}>
              <label className="form-label">Código / SKU *</label>
              <input
                type="text"
                className="form-control"
                value={prodCodigo}
                onChange={(e) => setProdCodigo(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre del Producto *</label>
              <input
                type="text"
                className="form-control"
                value={prodNombre}
                onChange={(e) => setProdNombre(e.target.value)}
                placeholder="Ej. Sudadera Hoodie Fleece"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <ComboboxInline
                options={categories.map(c => ({ id: c.id, label: c.nombre }))}
                value={prodCatId}
                onChange={setProdCatId}
                allowCreateInline={true}
                onCreateInline={(name) => {
                  const newC = addCategory({ nombre: name });
                  setProdCatId(newC.id);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unidad de Medida</label>
              <select
                className="form-select"
                value={prodUnidad}
                onChange={(e) => setProdUnidad(e.target.value)}
              >
                <option value="pza">Pieza (pza)</option>
                <option value="par">Par</option>
                <option value="kg">Kilogramo (kg)</option>
                <option value="m">Metro (m)</option>
                <option value="set">Set / Conjunto</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Precio de Venta ($) *</label>
              <input
                type="number"
                className="form-control"
                value={prodPrecio}
                onChange={(e) => setProdPrecio(e.target.value === '' ? '' : Number(e.target.value))}
                min={0.01}
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Costo Promedio / Inicial ($)</label>
              <input
                type="number"
                className="form-control"
                value={prodCosto}
                onChange={(e) => setProdCosto(e.target.value === '' ? '' : Number(e.target.value))}
                min={0}
                step="any"
                disabled={!!editingProduct}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alerta Stock Mínimo</label>
              <input
                type="number"
                className="form-control"
                value={prodStockMin}
                onChange={(e) => setProdStockMin(e.target.value === '' ? '' : Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Variants Toggle */}
          <div style={{ margin: '1.25rem 0', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: prodTieneVariantes ? '1rem' : 0 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Manejo de Variantes</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Actívalo si este producto tiene diferentes variantes o presentaciones con control de stock independiente</div>
              </div>
              <input
                type="checkbox"
                id="toggle-variants"
                checked={prodTieneVariantes}
                onChange={(e) => setProdTieneVariantes(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {prodTieneVariantes && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Lista de Variantes</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddVariantRow}>
                    <Plus size={14} />
                    + Agregar Variante
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {prodVariantes.map((v, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 40px', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Variante / Atributo (ej. Negro, 32, Modelo)"
                        value={v.color}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdVariantes(prev => prev.map((item, i) => i === idx ? { ...item, color: val } : item));
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Detalle (ej. M, 12oz)"
                        value={v.talla}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdVariantes(prev => prev.map((item, i) => i === idx ? { ...item, talla: val } : item));
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdVariantes(prev => prev.map((item, i) => i === idx ? { ...item, sku: val } : item));
                        }}
                      />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Stock"
                        value={v.stockActual}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProdVariantes(prev => prev.map((item, i) => i === idx ? { ...item, stockActual: val } : item));
                        }}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleRemoveVariantRow(idx)}
                        title="Eliminar variante"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Client Modal */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsClientModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="client-form" className="btn btn-primary">
              Guardar Cliente
            </button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSaveClient}>
          <div className="form-group">
            <label className="form-label">Nombre / Razón Social *</label>
            <input
              type="text"
              className="form-control"
              value={cliNombre}
              onChange={(e) => setCliNombre(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">RFC / ID Fiscal</label>
              <input
                type="text"
                className="form-control"
                value={cliRFC}
                onChange={(e) => setCliRFC(e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                value={cliTel}
                onChange={(e) => setCliTel(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={cliEmail}
                onChange={(e) => setCliEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Condición de Pago</label>
              <select
                className="form-select"
                value={cliTipoPago}
                onChange={(e) => setCliTipoPago(e.target.value as PaymentTerm)}
              >
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
          </div>
          {cliTipoPago === 'credito' && (
            <div className="form-row" style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div className="form-group">
                <label className="form-label">Días de Crédito</label>
                <input
                  type="number"
                  className="form-control"
                  value={cliDias}
                  onChange={(e) => setCliDias(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Límite de Crédito ($)</label>
                <input
                  type="number"
                  className="form-control"
                  value={cliLimite}
                  onChange={(e) => setCliLimite(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSupplierModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="supplier-form" className="btn btn-primary">
              Guardar Proveedor
            </button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSaveSupplier}>
          <div className="form-group">
            <label className="form-label">Nombre / Empresa *</label>
            <input
              type="text"
              className="form-control"
              value={provNombre}
              onChange={(e) => setProvNombre(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">RFC / ID Fiscal</label>
              <input
                type="text"
                className="form-control"
                value={provRFC}
                onChange={(e) => setProvRFC(e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre de Contacto</label>
              <input
                type="text"
                className="form-control"
                value={provContacto}
                onChange={(e) => setProvContacto(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                value={provTel}
                onChange={(e) => setProvTel(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={provEmail}
                onChange={(e) => setProvEmail(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nueva Categoría de Producto"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="cat-form" className="btn btn-primary">
              Guardar Categoría
            </button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSaveCategory}>
          <div className="form-group">
            <label className="form-label">Nombre de Categoría *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Chamarras & Abrigos"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-control"
              placeholder="Breve descripción..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
