"use client"
import React from 'react';
import { HoysalaReliefModal } from '../../../../components/hoysalarelief';

interface HoysalaReliefFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const HoysalaReliefFullscreenWalkthrough: React.FC<HoysalaReliefFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Hoysala Relief with data:', data);
    onClose();
  };

  return (
    <HoysalaReliefModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default HoysalaReliefFullscreenWalkthrough;
