'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ColorGradeProps {
  onColorChange?: (colorValues: ColorValues) => void;
}

interface ColorValues {
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
  hueShift: number;
  redHue: number;
  redSat: number;
  redLight: number;
  greenHue: number;
  greenSat: number;
  greenLight: number;
  blueHue: number;
  blueSat: number;
  blueLight: number;
  clarity: number;
  texture: number;
  dehaze: number;
  selectedLUT: string;
}

const ColourGrade: React.FC<ColorGradeProps> = ({ onColorChange }) => {
  // Basic Controls State
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [vibrance, setVibrance] = useState(0);

  // HSL Controls State
  const [hueShift, setHueShift] = useState(0);
  const [redHue, setRedHue] = useState(0);
  const [redSat, setRedSat] = useState(0);
  const [redLight, setRedLight] = useState(0);
  const [greenHue, setGreenHue] = useState(0);
  const [greenSat, setGreenSat] = useState(0);
  const [greenLight, setGreenLight] = useState(0);
  const [blueHue, setBlueHue] = useState(0);
  const [blueSat, setBlueSat] = useState(0);
  const [blueLight, setBlueLight] = useState(0);

  // Advanced Controls State
  const [clarity, setClarity] = useState(0);
  const [texture, setTexture] = useState(0);
  const [dehaze, setDehaze] = useState(0);

  // LUTs State
  const [selectedLUT, setSelectedLUT] = useState('None');
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  const luts = [
    'None', 'Vintage', 'Film', 'Cyberpunk', 'Horror', 'Warm', 'Cool', 'Cinematic'
  ];

  // Reset all values to default
  const resetAllValues = () => {
    setBrightness(0);
    setContrast(0);
    setHighlights(0);
    setShadows(0);
    setWhites(0);
    setBlacks(0);
    setTemperature(0);
    setTint(0);
    setSaturation(0);
    setVibrance(0);
    setHueShift(0);
    setRedHue(0);
    setRedSat(0);
    setRedLight(0);
    setGreenHue(0);
    setGreenSat(0);
    setGreenLight(0);
    setBlueHue(0);
    setBlueSat(0);
    setBlueLight(0);
    setClarity(0);
    setTexture(0);
    setDehaze(0);
    setSelectedLUT('None');
  };

  // Function to emit color values
  const emitColorValues = useCallback(() => {
    if (onColorChange && isPreviewMode) {
      const colorValues: ColorValues = {
        brightness,
        contrast,
        highlights,
        shadows,
        whites,
        blacks,
        temperature,
        tint,
        saturation,
        vibrance,
        hueShift,
        redHue,
        redSat,
        redLight,
        greenHue,
        greenSat,
        greenLight,
        blueHue,
        blueSat,
        blueLight,
        clarity,
        texture,
        dehaze,
        selectedLUT
      };
      onColorChange(colorValues);
    }
  }, [
    brightness, contrast, highlights, shadows, whites, blacks,
    temperature, tint, saturation, vibrance, hueShift,
    redHue, redSat, redLight, greenHue, greenSat, greenLight,
    blueHue, blueSat, blueLight, clarity, texture, dehaze, selectedLUT, onColorChange, isPreviewMode
  ]);

  // Emit color values whenever any parameter changes
  useEffect(() => {
    emitColorValues();
  }, [emitColorValues]);

  // Enhanced slider with real-time updates
  const Slider = ({ 
    label, 
    value, 
    onChange, 
    min = -100, 
    max = 100, 
    step = 1,
    showValue = true 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
  }) => {
    // Calculate the background based on value
    let backgroundStyle = 'rgba(255, 255, 255, 0.1)'; // Default gray background
    
    if (value > 0) {
      // Positive value: blue from center to right
      const percentage = (value / max) * 50; // 50% is center, so we go from 50% to 50% + percentage
      backgroundStyle = `linear-gradient(to right, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.1) 50%, #2F6BFF 50%, #2F6BFF ${50 + percentage}%, rgba(255, 255, 255, 0.1) ${50 + percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    } else if (value < 0) {
      // Negative value: blue from center to left
      const percentage = (Math.abs(value) / Math.abs(min)) * 50; // 50% is center, so we go from 50% - percentage to 50%
      backgroundStyle = `linear-gradient(to right, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.1) ${50 - percentage}%, #2F6BFF ${50 - percentage}%, #2F6BFF 50%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.1) 100%)`;
    }
    // If value is 0, keep the default gray background
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/80 text-sm font-medium">{label}</span>
          {showValue && (
            <span className="text-white/60 text-xs font-mono">{value}</span>
          )}
        </div>
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer relative z-10"
            style={{
              background: backgroundStyle,
              borderRadius: '8px',
              outline: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              cursor: 'grab'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.cursor = 'grabbing';
              e.currentTarget.style.cursor = '-webkit-grabbing';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.cursor = 'grab';
              e.currentTarget.style.cursor = '-webkit-grab';
            }}
          />
        </div>
      </div>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0">
      <span className="text-white/60 text-lg">{icon}</span>
      <h3 className="text-white font-semibold text-sm">{title}</h3>
    </div>
  );

  return (
    <div className="p-6 text-white h-full flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Color Grade</h2>
          <p className="text-white/60 text-sm">Professional color grading tools</p>
        </div>

        {/* Basic Controls */}
        <SectionHeader title="Basic Controls" icon="🎨" />
        
        <Slider label="Brightness / Exposure" value={brightness} onChange={setBrightness} />
        <Slider label="Contrast" value={contrast} onChange={setContrast} />
        <Slider label="Highlights" value={highlights} onChange={setHighlights} />
        <Slider label="Shadows" value={shadows} onChange={setShadows} />
        <Slider label="Whites" value={whites} onChange={setWhites} />
        <Slider label="Blacks" value={blacks} onChange={setBlacks} />
        <Slider label="Temperature (Warm ↔ Cool)" value={temperature} onChange={setTemperature} />
        <Slider label="Tint (Green ↔ Magenta)" value={tint} onChange={setTint} />
        <Slider label="Saturation" value={saturation} onChange={setSaturation} />
        <Slider label="Vibrance" value={vibrance} onChange={setVibrance} />

        {/* HSL Controls */}
        <SectionHeader title="HSL Controls" icon="🌈" />
        
        <Slider label="Hue Shift" value={hueShift} onChange={setHueShift} />
        
        {/* Red Channel */}
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <h4 className="text-white/80 text-sm font-medium mb-3">Red Channel</h4>
          <Slider label="Hue" value={redHue} onChange={setRedHue} />
          <Slider label="Saturation" value={redSat} onChange={setRedSat} />
          <Slider label="Lightness" value={redLight} onChange={setRedLight} />
        </div>

        {/* Green Channel */}
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <h4 className="text-white/80 text-sm font-medium mb-3">Green Channel</h4>
          <Slider label="Hue" value={greenHue} onChange={setGreenHue} />
          <Slider label="Saturation" value={greenSat} onChange={setGreenSat} />
          <Slider label="Lightness" value={greenLight} onChange={setGreenLight} />
        </div>

        {/* Blue Channel */}
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <h4 className="text-white/80 text-sm font-medium mb-3">Blue Channel</h4>
          <Slider label="Hue" value={blueHue} onChange={setBlueHue} />
          <Slider label="Saturation" value={blueSat} onChange={setBlueSat} />
          <Slider label="Lightness" value={blueLight} onChange={setBlueLight} />
        </div>

        {/* Advanced Controls */}
        <SectionHeader title="Advanced Controls" icon="⚡" />
        
        <Slider label="Clarity" value={clarity} onChange={setClarity} />
        <Slider label="Texture" value={texture} onChange={setTexture} />
        <Slider label="Dehaze" value={dehaze} onChange={setDehaze} />

        {/* LUTs */}
        <SectionHeader title="Cinematic Presets" icon="🎬" />
        
        <div className="mb-4">
          <label className="block text-white/80 text-sm font-medium mb-2">LUT Preset</label>
          <select
            value={selectedLUT}
            onChange={(e) => setSelectedLUT(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {luts.map((lut) => (
              <option key={lut} value={lut} className="bg-black text-white">
                {lut}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fixed Action Buttons at Bottom */}
      <div className="mt-4">
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
              isPreviewMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isPreviewMode ? 'Preview ON' : 'Preview OFF'}
          </button>
          <button 
            onClick={resetAllValues}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColourGrade;