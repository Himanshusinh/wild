"use client"
import React from 'react';
import { JhabuaDollsModal } from '../../../../components/jhabuadolls';

interface JhabuaDollsFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const JhabuaDollsFullscreenWalkthrough: React.FC<JhabuaDollsFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Jhabua Dolls with data:', data);
    onClose();
  };

  return (
    <JhabuaDollsModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default JhabuaDollsFullscreenWalkthrough;
