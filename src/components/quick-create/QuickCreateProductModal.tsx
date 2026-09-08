import React from 'react';
import { ProductFormModal } from '../products/ProductFormModal';
import type { Product } from '../../types/erp';

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
  return (
    <ProductFormModal
      isOpen={isOpen}
      onClose={onClose}
      onProductCreated={(newProd: Product) => onProductCreated(newProd.id)}
    />
  );
};
