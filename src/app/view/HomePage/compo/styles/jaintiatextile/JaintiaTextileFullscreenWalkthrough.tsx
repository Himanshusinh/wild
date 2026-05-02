"use client"
import React from 'react';
import { JaintiaTextileModal } from "@/components/jaintiatextile";

interface JaintiaTextileFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const JaintiaTextileFullscreenWalkthrough: React.FC<JaintiaTextileFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Jaintia Textile with data:', data);
    onClose();
  };

  return (
    <JaintiaTextileModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default JaintiaTextileFullscreenWalkthrough;
