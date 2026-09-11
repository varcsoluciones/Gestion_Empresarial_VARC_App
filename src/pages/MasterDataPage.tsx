import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import type { Client, Supplier, Product, Category, PaymentTerm } from '../types/erp';
import { formatCurrency, generateDocNumber } from '../utils/formatters';
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
  ChevronRight,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ComboboxInline } from '../components/common/ComboboxInline';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ExcelExportButton } from '../components/common/ExcelExportButton';
import { SortableTh } from '../components/common/SortableTh';
import { useTableSort } from '../hooks/useTableSort';

const paymentTermOptions = [
  { id: 'contado', label: 'Contado (Inmediato)' },
  { id: 'credito', label: 'Crédito (Línea de crédito)' }
];

interface MasterDataPageProps {
  initialTab?: 'clients' | 'suppliers' | 'categories' | 'products';
}

export const MasterDataPage: React.FC<MasterDataPageProps> = ({ initialTab }) => {
  const {
    clients,
    suppliers,
    categories,
    products,
    currencySymbol,
    addClient,
    updateClient,
    toggleClientActive,
    addSupplier,
    updateSupplier,
    toggleSupplierActive,
    addCategory,
    updateCategory,
    toggleProductActive
  } = useERP();

  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers' | 'categories' | 'products'>(initialTab || 'products');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [catSubcategories, setCatSubcategories] = useState<{ id?: string; nombre: string; descripcion: string }[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  const toggleExpandCategory = (id: string) => {
    setExpandedCategoryIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for Client
  const [cliNombre, setCliNombre] = useState('');
  const [cliRFC, setCliRFC] = useState('');
  const [cliTel, setCliTel] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliDir, setCliDir] = useState('');
  const [cliTipoPago, setCliTipoPago] = useState<PaymentTerm>('contado');
  const [cliLimite, setCliLimite] = useState<number | ''>(10000);
  const [cliDias, setCliDias] = useState<number | ''>(30);
  const [cliActivo, setCliActivo] = useState(true);

  // Form states for Supplier
  const [provNombre, setProvNombre] = useState('');
  const [provRFC, setProvRFC] = useState('');
  const [provTel, setProvTel] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provContacto, setProvContacto] = useState('');
  const [provDir, setProvDir] = useState('');
  const [provActivo, setProvActivo] = useState(true);

  // Expandable variants row state
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const toggleExpandProduct = (id: string) => {
    setExpandedProductIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Product Modal Open/Edit handlers
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
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
    setCliActivo(true);
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
    setCliActivo(c.activo !== false);
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
        diasCredito: cliTipoPago === 'credito' ? Number(cliDias) || 0 : 0,
        activo: cliActivo
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
        diasCredito: cliTipoPago === 'credito' ? Number(cliDias) || 0 : 0,
        activo: cliActivo
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
    setProvActivo(true);
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
    setProvActivo(s.activo !== false);
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
        direccion: provDir,
        activo: provActivo
      });
    } else {
      addSupplier({
        nombre: provNombre,
        identificacionFiscal: provRFC || 'PROV-GEN',
        telefono: provTel,
        email: provEmail,
        contactoNombre: provContacto,
        direccion: provDir,
        activo: provActivo
      });
    }
    setIsSupplierModalOpen(false);
  };

  // Category Modal Handlers
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatDesc('');
    setHasSubcategories(false);
    setCatSubcategories([]);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.nombre);
    setNewCatDesc(cat.descripcion || '');
    setHasSubcategories(!!(cat.subcategorias && cat.subcategorias.length > 0));
    setCatSubcategories(cat.subcategorias ? cat.subcategorias.map(s => ({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion || ''
    })) : []);
    setIsCategoryModalOpen(true);
  };

  const handleAddSubcategoryRow = () => {
    const nextIdx = catSubcategories.length + 1;
    const currentPrefix = editingCategory ? editingCategory.id : generateDocNumber('CA', categories.length);
    const subId = `${currentPrefix}-${nextIdx}`;
    setCatSubcategories(prev => [
      ...prev,
      { id: subId, nombre: '', descripcion: '' }
    ]);
  };

  const handleRemoveSubcategoryRow = (index: number) => {
    setCatSubcategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const validSubcats = hasSubcategories
      ? catSubcategories.filter(s => s.nombre.trim()).map((s, idx) => ({
          id: s.id || `${editingCategory?.id || generateDocNumber('CA', categories.length)}-${idx + 1}`,
          categoriaId: editingCategory?.id || '',
          nombre: s.nombre.trim(),
          descripcion: s.descripcion.trim()
        }))
      : undefined;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        nombre: newCatName.trim(),
        descripcion: newCatDesc.trim(),
        subcategorias: validSubcats || []
      });
    } else {
      addCategory({
        nombre: newCatName.trim(),
        descripcion: newCatDesc.trim(),
        subcategorias: validSubcats
      });
    }

    setNewCatName('');
    setNewCatDesc('');
    setHasSubcategories(false);
    setCatSubcategories([]);
    setIsCategoryModalOpen(false);
  };

  // Filtered queries
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return p.activo !== false;
    if (statusFilter === 'archived') return p.activo === false;
    return true;
  });

  const {
    sortedItems: sortedProducts,
    sortKey: prodSortKey,
    sortDirection: prodSortDirection,
    requestSort: requestProdSort
  } = useTableSort(filteredProducts, {
    defaultKey: 'nombre',
    defaultDirection: 'asc',
    defaultIsNumeric: false,
    customGetters: {
      categoria: (p) => categories.find(c => c.id === p.categoriaId)?.nombre || '',
      variantesCount: (p) => p.variantes?.length || 0,
      estado: (p) => p.activo === false ? 'Archivado' : 'Activo'
    }
  });

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.identificacionFiscal.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.activo !== false;
    if (statusFilter === 'archived') return c.activo === false;
    return true;
  });

  const {
    sortedItems: sortedClients,
    sortKey: clientSortKey,
    sortDirection: clientSortDirection,
    requestSort: requestClientSort
  } = useTableSort(filteredClients, {
    defaultKey: 'nombre',
    defaultDirection: 'asc',
    defaultIsNumeric: false,
    customGetters: {
      estado: (c) => c.activo === false ? 'Archivado' : 'Activo'
    }
  });

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.identificacionFiscal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.direccion && s.direccion.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return s.activo !== false;
    if (statusFilter === 'archived') return s.activo === false;
    return true;
  });

  const {
    sortedItems: sortedSuppliers,
    sortKey: supplierSortKey,
    sortDirection: supplierSortDirection,
    requestSort: requestSupplierSort
  } = useTableSort(filteredSuppliers, {
    defaultKey: 'nombre',
    defaultDirection: 'asc',
    defaultIsNumeric: false,
    customGetters: {
      estado: (s) => s.activo === false ? 'Archivado' : 'Activo'
    }
  });

  const filteredCategories = categories.filter(cat =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.descripcion && cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const {
    sortedItems: sortedCategories,
    sortKey: catSortKey,
    sortDirection: catSortDirection,
    requestSort: requestCatSort
  } = useTableSort(filteredCategories, {
    defaultKey: 'nombre',
    defaultDirection: 'asc',
    defaultIsNumeric: false,
    customGetters: {
      subcategoriasCount: (cat) => cat.subcategorias?.length || 0,
      productosCount: (cat) => products.filter(p => p.categoriaId === cat.id).length
    }
  });

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
            <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenNewCategory}>
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
          <span>Productos & Variantes</span>
          <span className="tab-badge">{products.length}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}
        >
          <Users size={16} />
          <span>Clientes</span>
          <span className="tab-badge">{clients.length}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
        >
          <Truck size={16} />
          <span>Proveedores</span>
          <span className="tab-badge">{suppliers.length}</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
        >
          <Tags size={16} />
          <span>Categorías</span>
          <span className="tab-badge">{categories.length}</span>
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

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {activeTab !== 'categories' && (
            <div style={{ minWidth: '180px' }}>
              <ComboboxInline
                options={[
                  { id: 'active', label: 'Solo Activos' },
                  { id: 'archived', label: 'Solo Archivados' },
                  { id: 'all', label: 'Todos los Registros' }
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                placeholder="Filtrar estado..."
                hideSearch={true}
                buttonStyle={{ minWidth: '180px' }}
              />
            </div>
          )}

          <ExcelExportButton filename={`Catalogo_Maestro_${activeTab.toUpperCase()}`} />
        </div>
      </div>

      {/* Tab: Products & Variants */}
      {activeTab === 'products' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <SortableTh
                  sortKey="codigo"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={false}
                >
                  Código / SKU
                </SortableTh>
                <SortableTh
                  sortKey="nombre"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={false}
                >
                  Nombre del Producto
                </SortableTh>
                <SortableTh
                  sortKey="categoria"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={false}
                >
                  Categoría
                </SortableTh>
                <SortableTh
                  sortKey="precioVenta"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={true}
                  align="right"
                >
                  Precio Venta
                </SortableTh>
                <SortableTh
                  sortKey="costoPromedio"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={true}
                  align="right"
                >
                  Costo Promedio
                </SortableTh>
                <SortableTh
                  sortKey="stockActual"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={true}
                  align="center"
                >
                  Stock Actual
                </SortableTh>
                <SortableTh
                  sortKey="stockMinimo"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={true}
                  align="center"
                >
                  Mínimo
                </SortableTh>
                <SortableTh
                  sortKey="variantesCount"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={true}
                  align="center"
                >
                  Variantes
                </SortableTh>
                <SortableTh
                  sortKey="estado"
                  currentSortKey={prodSortKey}
                  currentSortDirection={prodSortDirection}
                  onSort={requestProdSort}
                  isNumeric={false}
                  align="center"
                >
                  Estado
                </SortableTh>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map(p => {
                const category = categories.find(c => c.id === p.categoriaId);
                const isExpanded = expandedProductIds[p.id];
                const hasLowStock = p.stockActual <= p.stockMinimo;

                return (
                  <React.Fragment key={p.id}>
                    <tr style={{ opacity: p.activo === false ? 0.65 : 1 }}>
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
                        {p.subcategoriaId && (() => {
                          const sub = category?.subcategorias?.find(s => s.id === p.subcategoriaId);
                          return sub ? <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>📁 {sub.nombre}</div> : null;
                        })()}
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
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={p.activo === false ? 'neutral' : 'success'}>
                          {p.activo === false ? 'Archivado' : 'Activo'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            onClick={() => handleEditProduct(p)}
                            title="Editar producto"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            onClick={() => toggleProductActive(p.id)}
                            title={p.activo === false ? 'Reactivar producto' : 'Archivar producto'}
                            style={{ color: p.activo === false ? 'var(--color-success)' : 'var(--text-muted)' }}
                          >
                            {p.activo === false ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Variants Breakdown */}
                    {isExpanded && p.tieneVariantes && p.variantes && (
                      <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                        <td colSpan={11} style={{ padding: '0.75rem 2rem' }}>
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
                                      {v.talla || ''}{v.talla && v.color ? ' / ' : ''}{v.color || ''}
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
                <SortableTh
                  sortKey="id"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                >
                  ID
                </SortableTh>
                <SortableTh
                  sortKey="nombre"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                >
                  Nombre / Razón Social
                </SortableTh>
                <SortableTh
                  sortKey="identificacionFiscal"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                >
                  RFC / ID Fiscal
                </SortableTh>
                <SortableTh
                  sortKey="telefono"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                >
                  Contacto
                </SortableTh>
                <SortableTh
                  sortKey="direccion"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                >
                  Dirección
                </SortableTh>
                <SortableTh
                  sortKey="tipoPago"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                  align="center"
                >
                  Condición
                </SortableTh>
                <SortableTh
                  sortKey="limiteCredito"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={true}
                  align="right"
                >
                  Límite Crédito
                </SortableTh>
                <SortableTh
                  sortKey="diasCredito"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={true}
                  align="center"
                >
                  Días Crédito
                </SortableTh>
                <SortableTh
                  sortKey="estado"
                  currentSortKey={clientSortKey}
                  currentSortDirection={clientSortDirection}
                  onSort={requestClientSort}
                  isNumeric={false}
                  align="center"
                >
                  Estado
                </SortableTh>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay clientes registrados en el catálogo.
                  </td>
                </tr>
              ) : (
                sortedClients.map(c => (
                  <tr key={c.id} style={{ opacity: c.activo === false ? 0.65 : 1 }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {c.id}
                    </td>
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
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={c.activo === false ? 'neutral' : 'success'}>
                        {c.activo === false ? 'Archivado' : 'Activo'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => handleEditClient(c)}
                          title="Editar cliente"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => toggleClientActive(c.id)}
                          title={c.activo === false ? 'Reactivar cliente' : 'Archivar cliente'}
                          style={{ color: c.activo === false ? 'var(--color-success)' : 'var(--text-muted)' }}
                        >
                          {c.activo === false ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
                <SortableTh
                  sortKey="id"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                >
                  ID
                </SortableTh>
                <SortableTh
                  sortKey="nombre"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                >
                  Proveedor / Empresa
                </SortableTh>
                <SortableTh
                  sortKey="identificacionFiscal"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                >
                  RFC / ID Fiscal
                </SortableTh>
                <SortableTh
                  sortKey="contactoNombre"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                >
                  Contacto Principal
                </SortableTh>
                <SortableTh
                  sortKey="telefono"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                >
                  Teléfono / Email
                </SortableTh>
                <SortableTh
                  sortKey="direccion"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                >
                  Dirección
                </SortableTh>
                <SortableTh
                  sortKey="estado"
                  currentSortKey={supplierSortKey}
                  currentSortDirection={supplierSortDirection}
                  onSort={requestSupplierSort}
                  isNumeric={false}
                  align="center"
                >
                  Estado
                </SortableTh>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay proveedores registrados en el catálogo.
                  </td>
                </tr>
              ) : (
                sortedSuppliers.map(s => (
                  <tr key={s.id} style={{ opacity: s.activo === false ? 0.65 : 1 }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {s.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>{s.identificacionFiscal}</td>
                    <td>{s.contactoNombre || '-'}</td>
                    <td>
                      <div>{s.telefono}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{s.direccion || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={s.activo === false ? 'neutral' : 'success'}>
                        {s.activo === false ? 'Archivado' : 'Activo'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => handleEditSupplier(s)}
                          title="Editar proveedor"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-sm"
                          onClick={() => toggleSupplierActive(s.id)}
                          title={s.activo === false ? 'Reactivar proveedor' : 'Archivar proveedor'}
                          style={{ color: s.activo === false ? 'var(--color-success)' : 'var(--text-muted)' }}
                        >
                          {s.activo === false ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <SortableTh
                  sortKey="id"
                  currentSortKey={catSortKey}
                  currentSortDirection={catSortDirection}
                  onSort={requestCatSort}
                  isNumeric={false}
                  style={{ width: '90px' }}
                >
                  ID
                </SortableTh>
                <SortableTh
                  sortKey="nombre"
                  currentSortKey={catSortKey}
                  currentSortDirection={catSortDirection}
                  onSort={requestCatSort}
                  isNumeric={false}
                >
                  Nombre de la Categoría
                </SortableTh>
                <SortableTh
                  sortKey="descripcion"
                  currentSortKey={catSortKey}
                  currentSortDirection={catSortDirection}
                  onSort={requestCatSort}
                  isNumeric={false}
                >
                  Descripción / Notas
                </SortableTh>
                <SortableTh
                  sortKey="subcategoriasCount"
                  currentSortKey={catSortKey}
                  currentSortDirection={catSortDirection}
                  onSort={requestCatSort}
                  isNumeric={true}
                  align="center"
                  style={{ width: '160px' }}
                >
                  Subcategorías
                </SortableTh>
                <SortableTh
                  sortKey="productosCount"
                  currentSortKey={catSortKey}
                  currentSortDirection={catSortDirection}
                  onSort={requestCatSort}
                  isNumeric={true}
                  align="center"
                  style={{ width: '160px' }}
                >
                  Productos Asociados
                </SortableTh>
                <th style={{ textAlign: 'right', width: '90px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron categorías registradas.
                  </td>
                </tr>
              ) : (
                sortedCategories.map(cat => {
                  const count = products.filter(p => p.categoriaId === cat.id).length;
                  const hasSubs = !!(cat.subcategorias && cat.subcategorias.length > 0);
                  const isExpanded = expandedCategoryIds[cat.id];

                  return (
                    <React.Fragment key={cat.id}>
                      <tr>
                        <td>
                          {hasSubs && (
                            <button
                              type="button"
                              className="btn-icon btn-sm"
                              style={{ border: 'none', background: 'none' }}
                              onClick={() => toggleExpandCategory(cat.id)}
                              title="Ver subcategorías"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {cat.id}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tags size={15} style={{ color: 'var(--color-accent)' }} />
                            <span>{cat.nombre}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {cat.descripcion || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin descripción adicional</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {hasSubs ? (
                            <span
                              className="badge badge-accent"
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleExpandCategory(cat.id)}
                            >
                              {cat.subcategorias!.length} subcategorías
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Badge variant={count > 0 ? 'accent' : 'neutral'}>
                            {count} {count === 1 ? 'producto' : 'productos'}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-icon btn-sm"
                            onClick={() => handleEditCategory(cat)}
                            title="Editar categoría y subcategorías"
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Subcategories Breakdown */}
                      {isExpanded && hasSubs && (
                        <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <td colSpan={7} style={{ padding: '0.75rem 2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Tags size={14} />
                                Subcategorías de {cat.nombre}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                                {cat.subcategorias!.map(sub => (
                                  <div
                                    key={sub.id}
                                    style={{
                                      backgroundColor: 'var(--bg-surface)',
                                      border: '1px solid var(--border-default)',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '0.6rem 0.85rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sub.nombre}</span>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                        {sub.id}
                                      </span>
                                    </div>
                                    {sub.descripcion && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {sub.descripcion}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

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
          {/* Estado Activo Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: cliActivo ? 'var(--color-accent-subtle)' : 'var(--bg-surface-hover)',
            border: `1px solid ${cliActivo ? 'var(--color-accent)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            transition: 'all var(--transition-fast)'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Estado del Cliente: {cliActivo ? <span style={{ color: 'var(--color-accent)' }}>Activo</span> : <span style={{ color: 'var(--text-muted)' }}>Archivado</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {cliActivo ? 'Disponible para nuevas ventas, cotizaciones y cobros.' : 'Archivado (oculto en nuevos formularios, mantiene historial de facturación).'}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.825rem' }}>
              <input
                type="checkbox"
                checked={cliActivo}
                onChange={(e) => setCliActivo(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
              />
              <span>Activo</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre / Razón Social *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Boutique San Ángel o Juan Pérez"
              value={cliNombre}
              onChange={(e) => setCliNombre(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">RFC / ID Fiscal</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. BSA190415KL9"
                value={cliRFC}
                onChange={(e) => setCliRFC(e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Ej. 55 1234 5678"
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
                placeholder="contacto@cliente.com"
                value={cliEmail}
                onChange={(e) => setCliEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Condición de Pago</label>
              <ComboboxInline
                options={paymentTermOptions}
                value={cliTipoPago}
                onChange={(val) => setCliTipoPago(val as PaymentTerm)}
                hideSearch={true}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección / Ubicación</label>
            <input
              type="text"
              className="form-control"
              placeholder="Calle, Número, Colonia, Ciudad, Estado o C.P."
              value={cliDir}
              onChange={(e) => setCliDir(e.target.value)}
            />
          </div>
          {cliTipoPago === 'credito' && (
            <div className="form-row" style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Días de Crédito</label>
                <input
                  type="number"
                  className="form-control"
                  value={cliDias}
                  onChange={(e) => setCliDias(e.target.value === '' ? '' : Number(e.target.value))}
                  min={1}
                  placeholder="30"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Límite de Crédito ({currencySymbol})</label>
                <input
                  type="number"
                  className="form-control"
                  value={cliLimite}
                  onChange={(e) => setCliLimite(e.target.value === '' ? '' : Number(e.target.value))}
                  min={0}
                  placeholder="10000"
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
          {/* Estado Activo Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: provActivo ? 'var(--color-accent-subtle)' : 'var(--bg-surface-hover)',
            border: `1px solid ${provActivo ? 'var(--color-accent)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            transition: 'all var(--transition-fast)'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Estado del Proveedor: {provActivo ? <span style={{ color: 'var(--color-accent)' }}>Activo</span> : <span style={{ color: 'var(--text-muted)' }}>Archivado</span>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {provActivo ? 'Disponible para nuevas órdenes de compra y pagos.' : 'Archivado (oculto en nuevos formularios, mantiene historial de compras y CxP).'}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.825rem' }}>
              <input
                type="checkbox"
                checked={provActivo}
                onChange={(e) => setProvActivo(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-accent)' }}
              />
              <span>Activo</span>
            </label>
          </div>

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
          <div className="form-group">
            <label className="form-label">Dirección / Ubicación</label>
            <input
              type="text"
              className="form-control"
              placeholder="Calle, Número, Colonia, Ciudad, Estado o C.P."
              value={provDir}
              onChange={(e) => setProvDir(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Category Modal with Subcategories */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Editar Categoría de Producto" : "Nueva Categoría de Producto"}
        subtitle="Administra la categoría y sus subcategorías para clasificar productos"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="cat-form" className="btn btn-primary">
              {editingCategory ? "Actualizar Categoría" : "Guardar Categoría"}
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
              placeholder="Ej. Ropa Deportiva, Calzado, Electrónica"
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
              placeholder="Breve descripción o notas adicionales..."
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
          </div>

          {/* Subcategories Checkbox & Builder */}
          <div style={{ margin: '1rem 0 0.5rem 0', padding: '0.9rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasSubcategories ? '0.9rem' : 0 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>¿Tiene subcategorías?</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Habilita este control para crear clasificaciones secundarias</div>
              </div>
              <input
                type="checkbox"
                id="toggle-subcategories"
                checked={hasSubcategories}
                onChange={(e) => {
                  setHasSubcategories(e.target.checked);
                  if (e.target.checked && catSubcategories.length === 0) {
                    const currentPrefix = editingCategory ? editingCategory.id : generateDocNumber('CA', categories.length);
                    setCatSubcategories([
                      { id: `${currentPrefix}-1`, nombre: '', descripcion: '' }
                    ]);
                  }
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {hasSubcategories && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Lista de Subcategorías
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSubcategoryRow}>
                    <Plus size={14} />
                    + Agregar Subcategoría
                  </button>
                </div>

                {/* Subcategory headers */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.8fr 2fr 40px',
                    gap: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: '0.45rem',
                    alignItems: 'center'
                  }}
                >
                  <div>ID Subcategoría</div>
                  <div>Nombre de Subcategoría</div>
                  <div>Descripción (Opcional)</div>
                  <div style={{ textAlign: 'center' }}>Acción</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {catSubcategories.map((sub, idx) => {
                    const currentPrefix = editingCategory ? editingCategory.id : generateDocNumber('CA', categories.length);
                    const subId = sub.id || `${currentPrefix}-${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1.8fr 2fr 40px',
                          gap: '0.5rem',
                          alignItems: 'center'
                        }}
                      >
                        <input
                          type="text"
                          className="form-control"
                          value={subId}
                          readOnly
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            cursor: 'not-allowed',
                            fontSize: '0.8rem'
                          }}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej. Sudaderas, Playeras, etc."
                          value={sub.nombre}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCatSubcategories(prev => prev.map((item, i) => i === idx ? { ...item, nombre: val } : item));
                          }}
                        />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Notas o detalle..."
                          value={sub.descripcion}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCatSubcategories(prev => prev.map((item, i) => i === idx ? { ...item, descripcion: val } : item));
                          }}
                        />
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleRemoveSubcategoryRow(idx)}
                          title="Eliminar subcategoría"
                          disabled={catSubcategories.length <= 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Product Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
      />
    </div>
  );
};
