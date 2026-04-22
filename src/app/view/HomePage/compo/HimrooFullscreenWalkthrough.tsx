"use client"
import React from 'react';
import { HimrooModal } from '../../../../components/himroo';

interface HimrooFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const HimrooFullscreenWalkthrough: React.FC<HimrooFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Himroo with data:', data);
    onClose();
  };

  return (
    <HimrooModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default HimrooFullscreenWalkthrough;
