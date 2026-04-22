"use client"
import React from 'react';
import { GaroWeavingModal } from '../../../../components/garoweaving';

interface GaroWeavingFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const GaroWeavingFullscreenWalkthrough: React.FC<GaroWeavingFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Garo Weaving with data:', data);
    // Here you would typically call your generation API
    // and then maybe redirect to a results page or close and show a toast
    onClose();
  };

  return (
    <GaroWeavingModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default GaroWeavingFullscreenWalkthrough;
