import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ComboboxInline } from '../common/ComboboxInline';
import { useERP } from '../../context/ERPContext';
import { getNextProductSKU } from '../../utils/formatters';
import type { Product, Subcategory } from '../../types/erp';
import { Plus, Trash2 } from 'lucide-react';

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onProductCreated?: (newProduct: Product) => void;
}

const unitOptions = [
  { id: 'pza', label: 'Pieza (pza)' },
  { id: 'par', label: 'Par' },
  { id: 'kg', label: 'Kilogramo (kg)' },
  { id: 'm', label: 'Metro (m)' },
  { id: 'set', label: 'Juego / Set' },
  { id: 'L', label: 'Litro (L)' },
  { id: 'caja', label: 'Caja' }
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onProductCreated
}) => {
  const {
    products,
    categories,
    addCategory,
    updateCategory,
    addProduct,
    updateProduct,
    currencySymbol
  } = useERP();

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('pza');
  const [precioVenta, setPrecioVenta] = useState<number | ''>('');
  const [stockMinimo, setStockMinimo] = useState<number | ''>(5);
  const [descripcion, setDescripcion] = useState('');
  const [tieneVariantes, setTieneVariantes] = useState(false);
  const [variantes, setVariantes] = useState<{ talla: string; color: string; sku: string; stockActual: number | '' }[]>([]);
  const [error, setError] = useState('');

  // Synchronize form on modal open or editing change
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    if (productToEdit) {
      setCodigo(productToEdit.codigo);
      setNombre(productToEdit.nombre);
      setCategoriaId(productToEdit.categoriaId);
      setSubcategoriaId(productToEdit.subcategoriaId || '');
      setUnidadMedida(productToEdit.unidadMedida || 'pza');
      setPrecioVenta(productToEdit.precioVenta);
      setStockMinimo(productToEdit.stockMinimo || 5);
      setDescripcion(productToEdit.descripcion || '');
      setTieneVariantes(productToEdit.tieneVariantes);
      setVariantes(productToEdit.variantes ? productToEdit.variantes.map(v => ({
        talla: v.talla,
        color: v.color,
        sku: v.sku,
        stockActual: v.stockActual
      })) : []);
    } else {
      const nextSKU = getNextProductSKU(products);
      setCodigo(nextSKU);
      setNombre('');
      const defaultCatId = categories[0]?.id || '';
      setCategoriaId(defaultCatId);
      setSubcategoriaId('');
      setUnidadMedida('pza');
      setPrecioVenta('');
      setStockMinimo(5);
      setDescripcion('');
      setTieneVariantes(false);
      setVariantes([
        { talla: 'M', color: 'Negro', sku: `${nextSKU}-1`, stockActual: 0 },
        { talla: 'L', color: 'Negro', sku: `${nextSKU}-2`, stockActual: 0 }
      ]);
    }
  }, [isOpen, productToEdit, products, categories]);

  // Categories and Subcategories options
  const categoryOptions = categories.map(c => ({
    id: c.id,
    label: c.nombre
  }));

  const currentCategory = categories.find(c => c.id === categoriaId);
  const subcategoryOptions = (currentCategory?.subcategorias || []).map(s => ({
    id: s.id,
    label: s.nombre
  }));

  const handleSelectCategory = (catId: string) => {
    setCategoriaId(catId);
    const newCat = categories.find(c => c.id === catId);
    if (!newCat?.subcategorias?.some(s => s.id === subcategoriaId)) {
      setSubcategoriaId('');
    }
  };

  const handleCreateCategoryInline = (newCatName: string) => {
    if (!newCatName.trim()) return;
    const newCat = addCategory({ nombre: newCatName.trim() });
    setCategoriaId(newCat.id);
    setSubcategoriaId('');
  };

  const handleCreateSubcategoryInline = (newSubName: string) => {
    if (!newSubName.trim() || !currentCategory) return;
    const nextIdx = (currentCategory.subcategorias?.length || 0) + 1;
    const newSubId = `${currentCategory.id}-${nextIdx}`;
    const newSub: Subcategory = {
      id: newSubId,
      categoriaId: currentCategory.id,
      nombre: newSubName.trim()
    };
    const updatedSubcategories = [...(currentCategory.subcategorias || []), newSub];
    updateCategory(currentCategory.id, {
      ...currentCategory,
      subcategorias: updatedSubcategories
    });
    setSubcategoriaId(newSubId);
  };

  const handleAddVariantRow = () => {
    const nextIdx = variantes.length + 1;
    const variantSKU = `${codigo.trim() || 'SKU0001'}-${nextIdx}`;
    setVariantes(prev => [
      ...prev,
      { talla: '', color: '', sku: variantSKU, stockActual: 0 }
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariantes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (!precioVenta || Number(precioVenta) <= 0) {
      setError('El precio de venta debe ser mayor a 0.');
      return;
    }

    const finalCode = codigo.trim() ? codigo.trim().toUpperCase() : getNextProductSKU(products);
    const finalCatId = categoriaId || categories[0]?.id || 'cat-1';
    const finalSubcatId = subcategoriaId.trim() ? subcategoriaId.trim() : undefined;

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        codigo: finalCode,
        nombre: nombre.trim(),
        categoriaId: finalCatId,
        subcategoriaId: finalSubcatId,
        unidadMedida: unidadMedida || 'pza',
        precioVenta: Number(precioVenta),
        stockMinimo: Number(stockMinimo) || 5,
        tieneVariantes: tieneVariantes,
        descripcion: descripcion.trim() || undefined,
        variantes: tieneVariantes ? variantes.map((v, i) => ({
          id: productToEdit.variantes?.[i]?.id || `var-${productToEdit.id}-${i + 1}`,
          productoId: productToEdit.id,
          sku: `${finalCode}-${i + 1}`,
          talla: v.talla.trim() || `Talla ${i + 1}`,
          color: v.color.trim() || 'Estándar',
          stockActual: productToEdit.variantes?.[i]?.stockActual || 0
        })) : undefined
      });
      onClose();
    } else {
      const newProduct = addProduct({
        codigo: finalCode,
        nombre: nombre.trim(),
        categoriaId: finalCatId,
        subcategoriaId: finalSubcatId,
        unidadMedida: unidadMedida || 'pza',
        precioVenta: Number(precioVenta),
        stockMinimo: Number(stockMinimo) || 5,
        tieneVariantes: tieneVariantes,
        descripcion: descripcion.trim() || undefined,
        variantes: tieneVariantes ? variantes.map((v, i) => ({
          id: `var-${Date.now()}-${i + 1}`,
          productoId: '',
          sku: `${finalCode}-${i + 1}`,
          talla: v.talla.trim() || `Talla ${i + 1}`,
          color: v.color.trim() || 'Estándar',
          stockActual: 0
        })) : undefined
      });

      if (onProductCreated) {
        onProductCreated(newProduct);
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
      subtitle={productToEdit ? 'Modifica los datos del catálogo maestro' : 'Crea un nuevo producto en el catálogo (el inventario se carga en Existencias)'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="universal-product-form" className="btn btn-primary">
            {productToEdit ? 'Guardar Cambios' : (onProductCreated ? 'Guardar y Seleccionar' : 'Guardar Producto')}
          </button>
        </>
      }
    >
      <form id="universal-product-form" onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <div className="form-row">
          <div className="form-group" style={{ flex: '0 0 160px' }}>
            <label className="form-label">
              Código / SKU <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej. SKU0001"
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">
              Nombre del Producto <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Sudadera Hoodie Fleece"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Categories, Subcategories and Unit of Measure in one unified row */}
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Categoría *</label>
            <ComboboxInline
              options={categoryOptions}
              value={categoriaId}
              onChange={handleSelectCategory}
              allowCreateInline={true}
              onCreateInline={handleCreateCategoryInline}
              placeholder="Seleccionar o crear categoría..."
              quickCreateLabel="+ Crear Categoría"
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">
              Subcategoría
              {currentCategory && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.35rem', fontWeight: 'normal' }}>
                  ({subcategoryOptions.length} disp.)
                </span>
              )}
            </label>
            <ComboboxInline
              options={subcategoryOptions}
              value={subcategoriaId}
              onChange={setSubcategoriaId}
              allowCreateInline={!!currentCategory}
              onCreateInline={handleCreateSubcategoryInline}
              placeholder={currentCategory ? (subcategoryOptions.length > 0 ? 'Seleccionar subcategoría...' : 'Escribe para crear subcategoría...') : 'Selecciona categoría primero'}
              disabled={!currentCategory}
              quickCreateLabel="+ Crear Subcategoría"
            />
          </div>

          <div className="form-group" style={{ flex: '0 0 140px' }}>
            <label className="form-label">Unidad de Medida</label>
            <ComboboxInline
              options={unitOptions}
              value={unidadMedida}
              onChange={setUnidadMedida}
              hideSearch={true}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Precio de Venta ({currencySymbol}) *</label>
            <input
              type="number"
              className="form-control"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))}
              min={0.01}
              step="any"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Alerta Stock Mínimo</label>
            <input
              type="number"
              className="form-control"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value === '' ? '' : Number(e.target.value))}
              min={1}
              placeholder="5"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción / Notas del Producto</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalles, especificaciones o información adicional..."
          />
        </div>

        {/* Variants Matrix Section */}
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: tieneVariantes ? '1rem' : 0
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Manejo de Variantes</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Actívalo si este producto tiene diferentes presentaciones (tallas, colores, dimensiones)
              </div>
            </div>
            <input
              type="checkbox"
              id="toggle-variants-modal"
              checked={tieneVariantes}
              onChange={(e) => setTieneVariantes(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {tieneVariantes && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Matriz de Atributos de Variantes
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Define las combinaciones. El stock se alimentará mediante Carga Inicial o Compras.
                  </div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddVariantRow}>
                  <Plus size={14} />
                  + Agregar Variante
                </button>
              </div>

              {/* Variant Table Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.5fr 1.5fr 40px',
                  gap: '0.5rem',
                  padding: '0.45rem 0.6rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  marginBottom: '0.5rem',
                  alignItems: 'center'
                }}
              >
                <div>ID / SKU Variante</div>
                <div>Variable 1 (Talla / Medida)</div>
                <div>Variable 2 (Color / Tipo)</div>
                <div style={{ textAlign: 'center' }}>Acción</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {variantes.map((v, idx) => {
                  const variantSKU = `${codigo.trim() || 'SKU0001'}-${idx + 1}`;
                  return (
                    <div key={idx} className="variant-line-builder" style={{ gridTemplateColumns: '1.4fr 1.5fr 1.5fr 40px' }}>
                      <input
                        type="text"
                        className="form-control"
                        value={variantSKU}
                        readOnly
                        title="ID de variante autogenerado no modificable"
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          cursor: 'not-allowed'
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. S, M, L, 32, 500ml"
                        value={v.talla}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariantes(prev => prev.map((item, i) => i === idx ? { ...item, talla: val } : item));
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Negro, Blanco, Azul, Mate"
                        value={v.color}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariantes(prev => prev.map((item, i) => i === idx ? { ...item, color: val } : item));
                        }}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleRemoveVariantRow(idx)}
                        title="Eliminar variante"
                        disabled={variantes.length <= 1}
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
  );
};
