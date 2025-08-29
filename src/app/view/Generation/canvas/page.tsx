'use client';

import React, { useState } from 'react'
import InputBox from './Components/InputBox/page'
import ToolBar from './Components/Tools/page'
import TopBar from './Components/TopBar/page'
import Drawer from './Components/Drawer/page'
import ShowScreen from './Components/ShowScreen/page'

const Canvas = () => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [colorValues, setColorValues] = useState<any>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [inputBoxHeight, setInputBoxHeight] = useState(0);

  const handleImageUpload = (files: File[]) => {
    // Only allow one image at a time
    if (files.length > 0) {
      setUploadedImages([files[0]]); // Replace any existing image
    }
  };

  const handleImageSelect = (imageId: string | null) => {
    setSelectedImage(imageId);
  };

  const handleToolSelect = (toolId: string | null) => {
    setSelectedTool(toolId);
    // Reset color values if the tool is not a color-related tool
    if (toolId !== 'Colour Grade') {
      setColorValues(null);
    }
  };

  const handleColorChange = (values: any) => {
    setColorValues(values);
  };

  const handleFrameSizeChange = (width: number, height: number) => {
    // This function is no longer needed as frame size is removed
  };

  const handleExport = () => {
    // This will be handled by ShowScreen component
    // We'll trigger the export from here
    const event = new CustomEvent('exportCanvas');
    window.dispatchEvent(event);
  };

  const handleUndo = () => {
    // Trigger undo event for ShowScreen component
    const event = new CustomEvent('undoCanvas');
    window.dispatchEvent(event);
  };

  const handleRedo = () => {
    // Trigger redo event for ShowScreen component
    const event = new CustomEvent('redoCanvas');
    window.dispatchEvent(event);
  };

  // Only show drawer for specific tools
  const shouldShowDrawer = selectedTool === 'Colour Grade' || selectedTool === 'Relight' || selectedTool === 'FacialExpression';
  
  // Only show input box for specific tools
  const shouldShowInputBox = selectedTool === 'Change Object' || selectedTool === 'Expand';

  // Calculate positioning values for ShowScreen and Drawer alignment
  const drawerTop = 80; // TopBar height + margin (64px + 16px)
  const drawerHeight = `calc(100vh - 80px - ${inputBoxHeight}px)`;

  return (
    <div className="min-h-screen bg-black relative">
      
      <ShowScreen 
        uploadedImages={uploadedImages} 
        selectedImage={selectedImage}
        onImageSelect={handleImageSelect}
        shouldShowDrawer={shouldShowDrawer}
        shouldShowInputBox={shouldShowInputBox}
        colorValues={colorValues}
        selectedTool={selectedTool}
      />
      {shouldShowInputBox && (
        <InputBox onImageUpload={handleImageUpload} />
      )}
      <ToolBar onToolSelect={handleToolSelect} />
      <TopBar 
        onImageUpload={handleImageUpload} 
        onExport={handleExport}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      {shouldShowDrawer && (
        <Drawer 
          top={drawerTop}
          height={drawerHeight}
          selectedTool={selectedTool}
          onColorChange={handleColorChange}
        />
      )}
    </div>
  )
}

export default Canvas