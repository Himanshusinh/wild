"use client"
import React from 'react';
import { NagaBodyClothModal } from "@/components/nagabodycloth";

interface NagaBodyClothFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const NagaBodyClothFullscreenWalkthrough: React.FC<NagaBodyClothFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Naga Body-Cloth with data:', data);
    onClose();
  };

  return (
    <NagaBodyClothModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default NagaBodyClothFullscreenWalkthrough;
