"use client"
import React from 'react';
import { HardOrnamentModal } from "@/components/hardornament";

interface HardOrnamentFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const HardOrnamentFullscreenWalkthrough: React.FC<HardOrnamentFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Hard Ornament with data:', data);
    onClose();
  };

  return (
    <HardOrnamentModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default HardOrnamentFullscreenWalkthrough;
