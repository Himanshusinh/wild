'use client';

import React from 'react';
import ColourGrade from './ColorGrade/page';
import Relight from './Relight/page';
import FacialExpression from './ChangeFacialExpression/page';

interface DrawerProps {
  top: number;
  height: string | number;
  selectedTool?: string | null;
  onColorChange?: (values: any) => void;
}

const Drawer: React.FC<DrawerProps> = ({ 
  top, 
  height, 
  selectedTool,
  onColorChange 
}) => {
  const renderDrawerContent = () => {
    switch (selectedTool) {
      case 'Colour Grade':
        return <ColourGrade onColorChange={onColorChange} />;
      case 'Relight':
        return <Relight />;
      case 'FacialExpression':
        return <FacialExpression />;
      default:
        return (
          <div className="p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Tool Selected</h2>
            <p className="text-white/60">Select a tool to see its controls.</p>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed right-0 z-40 w-80 bg-black/40 backdrop-blur-xl border-l border-white/20 shadow-2xl transition-all duration-300 ease-in-out overflow-y-auto drawer-scroll"
      style={{
        top,
        height,
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none' /* Internet Explorer 10+ */
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .drawer-scroll::-webkit-scrollbar {
            display: none !important;
          }
        `
      }} />
      {renderDrawerContent()}
    </div>
  );
};

export default Drawer;