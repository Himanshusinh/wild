"use client"
import React from 'react';
import { HmaramModal } from "@/components/hmaram";

interface HmaramFullscreenWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
}

const HmaramFullscreenWalkthrough: React.FC<HmaramFullscreenWalkthroughProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGenerate = (data: any) => {
    console.log('Generating Hmaram with data:', data);
    onClose();
  };

  return (
    <HmaramModal 
      isOpen={isOpen} 
      onClose={onClose} 
      onGenerate={handleGenerate}
    />
  );
};

export default HmaramFullscreenWalkthrough;
