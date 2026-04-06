'use client';

import React from 'react';
import ImagePreviewModal from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ImagePreviewModal';
import { HistoryEntry } from '@/types/history';

interface ProductImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HistoryEntry | null;
}

const ProductImagePreview: React.FC<ProductImagePreviewProps> = ({ isOpen, onClose, entry }) => {
  if (!isOpen || !entry?.images?.length) return null;

  return (
    <ImagePreviewModal
      preview={{ entry, image: entry.images[0] }}
      onClose={onClose}
    />
  );
};

export default ProductImagePreview;
