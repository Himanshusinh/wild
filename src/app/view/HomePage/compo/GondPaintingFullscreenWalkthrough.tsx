"use client"
import React from 'react';
import { GondPaintingModal } from '../../../../components/gondpainting';

interface GondPaintingFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const GondPaintingFullscreenWalkthrough: React.FC<GondPaintingFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Gond Painting with data:', data);
    onClose();
  };

  return (
    <GondPaintingModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default GondPaintingFullscreenWalkthrough;
