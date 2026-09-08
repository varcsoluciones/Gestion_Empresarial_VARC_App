import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ComboboxInline } from '../common/ComboboxInline';
import { useERP } from '../../context/ERPContext';
import { getNextProductSKU } from '../../utils/formatters';

interface QuickCreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProductId: string) => void;
}

export const QuickCreateProductModal: React.FC<QuickCreateProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  const { products, categories, addCategory, addProduct } = useERP();

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoriaId, setCategoriaId] = useState(categories[0]?.id || '');
  const [unidadMedida, setUnidadMedida] = useState('pza');
  const [precioVenta, setPrecioVenta] = useState<number | ''>('');
  const [costoInicial, setCostoInicial] = useState<number | ''>('');
  const [stockInicial, setStockInicial] = useState<number | ''>('');
  const [stockMinimo, setStockMinimo] = useState<number | ''>(5);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCodigo(getNextProductSKU(products));
      setError('');
    }
  }, [isOpen, products]);

  const categoryOptions = categories.map(c => ({
    id: c.id,
    label: c.nombre
  }));

  const handleCreateCategoryInline = (categoryName: string) => {
    const newCat = addCategory({ nombre: categoryName });
    setCategoriaId(newCat.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (!precioVenta || Number(precioVenta) <= 0) {
      setError('El precio de venta debe ser mayor a 0');
      return;
    }

    const autoCode = codigo.trim() ? codigo.trim().toUpperCase() : getNextProductSKU(products);

    const newProduct = addProduct({
      codigo: autoCode,
      nombre: nombre.trim(),
      categoriaId: categoriaId || categories[0]?.id || 'cat-1',
      unidadMedida: unidadMedida || 'pza',
      precioVenta: Number(precioVenta),
      costoInicial: Number(costoInicial) || 0,
      stockInicial: Number(stockInicial) || 0,
      stockMinimo: Number(stockMinimo) || 5,
      tieneVariantes: false
    });

    onProductCreated(newProduct.id);
    onClose();
    // Reset form
    setCodigo('');
    setNombre('');
    setPrecioVenta('');
    setCostoInicial('');
    setStockInicial('');
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Producto (Rápido)"
      subtitle="Alta inmediata de producto para no interrumpir tu documento"
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="quick-product-form" className="btn btn-primary">
            Guardar y Seleccionar
          </button>
        </>
      }
    >
      <form id="quick-product-form" onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div className="form-row">
          <div className="form-group" style={{ flex: '0 0 130px' }}>
            <label className="form-label">Código / SKU</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. POL-05"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">
              Nombre del Producto <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Camisa Oxford Manga Larga"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Categoría (Escribe para crear al vuelo)</label>
            <ComboboxInline
              options={categoryOptions}
              value={categoriaId}
              onChange={setCategoriaId}
              placeholder="Seleccionar o crear categoría..."
              searchPlaceholder="Buscar o escribir nueva categoría..."
              allowCreateInline={true}
              onCreateInline={handleCreateCategoryInline}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unidad de Medida</label>
            <select
              className="form-select"
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
            >
              <option value="pza">Pieza (pza)</option>
              <option value="par">Par</option>
              <option value="kg">Kilogramo (kg)</option>
              <option value="m">Metro (m)</option>
              <option value="set">Juego / Set</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Precio de Venta ($) <span className="form-label-required">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))}
              min={0.01}
              step="any"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Costo Inicial ($)</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={costoInicial}
              onChange={(e) => setCostoInicial(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              step="any"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Stock Inicial</label>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={stockInicial}
              onChange={(e) => setStockInicial(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alerta Stock Mínimo</label>
            <input
              type="number"
              className="form-control"
              placeholder="5"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value === '' ? '' : Number(e.target.value))}
              min={1}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
