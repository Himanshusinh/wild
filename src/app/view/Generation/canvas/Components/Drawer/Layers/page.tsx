'use client';
import Image from 'next/image';

import React, { useState } from 'react';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  thumbnail: string;
  hasContent: boolean;
}

const Layers: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: '3',
      name: 'Layer 3',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'Normal',
      thumbnail: '/icons/change.png',
      hasContent: false
    },
    {
      id: '1',
      name: 'Layer 1',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'Normal',
      thumbnail: '/icons/colour.png',
      hasContent: true
    },
    {
      id: '2',
      name: 'Layer 2',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'Normal',
      thumbnail: '/icons/light.png',
      hasContent: false
    },
    {
      id: 'background',
      name: 'Background',
      visible: true,
      locked: true,
      opacity: 100,
      blendMode: 'Normal',
      thumbnail: '/icons/facewhite.png',
      hasContent: true
    }
  ]);

  const [selectedLayer, setSelectedLayer] = useState<string>('3');
  const [filterKind, setFilterKind] = useState('Kind');
  const [blendMode, setBlendMode] = useState('Normal');
  const [opacity, setOpacity] = useState(100);
  const [fill, setFill] = useState(100);

  const blendModes = [
    'Normal', 'Dissolve', 'Darken', 'Multiply', 'Linear Burn', 'Color Burn',
    'Lighten', 'Screen', 'Linear Dodge', 'Color Dodge', 'Overlay', 'Soft Light',
    'Hard Light', 'Vivid Light', 'Linear Light', 'Pin Light', 'Hard Mix',
    'Difference', 'Exclusion', 'Subtract', 'Divide', 'Hue', 'Saturation',
    'Color', 'Luminosity'
  ];

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const toggleLayerLock = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  };

  const deleteLayer = (layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer(layers[0]?.id || '');
    }
  };

  const createNewLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'Normal',
      thumbnail: '/icons/change.png',
      hasContent: false
    };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayer(newLayer.id);
  };

  const createNewGroup = () => {
    // Implementation for creating layer groups
    console.log('Create new group');
  };

  const createAdjustmentLayer = () => {
    // Implementation for adjustment layers
    console.log('Create adjustment layer');
  };

  const createLayerMask = () => {
    // Implementation for layer masks
    console.log('Create layer mask');
  };

  const addLayerStyle = () => {
    // Implementation for layer styles
    console.log('Add layer style');
  };

  const linkLayers = () => {
    // Implementation for linking layers
    console.log('Link layers');
  };

  return (
    <div className="p-0 text-white h-full flex flex-col bg-black/40 backdrop-blur-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button className="text-white/60 hover:text-white transition-colors">
            <Image src="/icons/layerswhite.png" alt="Layers" width={24} height={24} />
          </button>
          <h3 className="text-sm font-medium">Layers</h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Top Options Bar */}
      <div className="p-3 border-b border-white/10 space-y-3">
        {/* Filtering Row */}
        <div className="flex items-center gap-2">
          <select 
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="Kind">Kind</option>
            <option value="Name">Name</option>
            <option value="Effect">Effect</option>
          </select>
          
          <div className="flex items-center gap-1">
            <button className="p-1 text-white/60 hover:text-white transition-colors" title="Image Filter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </button>
            <button className="p-1 text-white/60 hover:text-white transition-colors" title="Shape Filter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-1 text-white/60 hover:text-white transition-colors" title="Text Filter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="p-1 text-white/60 hover:text-white transition-colors" title="Folder Filter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </button>
            <button className="p-1 text-white/60 hover:text-white transition-colors" title="Toggle Filter">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Blend Mode, Opacity, Lock, Fill Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <select 
              value={blendMode}
              onChange={(e) => setBlendMode(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 flex-1"
            >
              {blendModes.map((mode) => (
                <option key={mode} value={mode} className="bg-black text-white">
                  {mode}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Opacity:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${opacity}%, rgba(255, 255, 255, 0.1) ${opacity}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
            <span className="text-xs text-white/60 w-12">{opacity}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Lock:</span>
            <div className="flex gap-1">
              <button className="p-1 text-white/60 hover:text-white transition-colors" title="Lock Transparent Pixels">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-1 text-white/60 hover:text-white transition-colors" title="Lock Image Pixels">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="p-1 text-white/60 hover:text-white transition-colors" title="Lock Position">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="p-1 text-white/60 hover:text-white transition-colors" title="Lock All">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Fill:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={fill}
              onChange={(e) => setFill(Number(e.target.value))}
              className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2F6BFF 0%, #2F6BFF ${fill}%, rgba(255, 255, 255, 0.1) ${fill}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
            <span className="text-xs text-white/60 w-12">{fill}%</span>
          </div>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`mb-1 p-2 rounded transition-all cursor-pointer ${
              selectedLayer === layer.id
                ? 'bg-blue-600/20 border border-blue-500/50'
                : 'hover:bg-white/5'
            }`}
            onClick={() => setSelectedLayer(layer.id)}
          >
            <div className="flex items-center gap-2">
              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className="w-4 h-4 flex items-center justify-center"
              >
                {layer.visible ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>

              {/* Layer Type Icon */}
              <div className="w-4 h-4 flex items-center justify-center">
                {layer.hasContent ? (
                  <div className="w-3 h-3 bg-white/20 rounded-sm"></div>
                ) : (
                  <div className="w-3 h-3 bg-transparent border border-white/20 rounded-sm"></div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="w-8 h-8 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                {layer.hasContent ? (
                  <img src={layer.thumbnail} alt={layer.name} className="w-6 h-6 object-cover rounded" />
                ) : (
                  <div className="w-6 h-6 bg-transparent border border-white/20 rounded"></div>
                )}
              </div>

              {/* Layer Name */}
              <span className="flex-1 text-sm font-medium">{layer.name}</span>

              {/* Lock Icon (for Background layer) */}
              {layer.locked && (
                <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={linkLayers}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Link Layers"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 10-2-2.83V2.5a.5.5 0 00-1 0v5.5a.5.5 0 00.5.5h5.5a.5.5 0 000-1H6.5A3 3 0 008 9z" />
                <path d="M12 11a3 3 0 10-2 2.83v2.67a.5.5 0 000 .66.5.5 0 00.66 0h2.67a.5.5 0 00.66-.66V13.83A3 3 0 0012 11z" />
              </svg>
            </button>
            
            <button
              onClick={addLayerStyle}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Add Layer Style"
            >
              <span className="text-xs font-bold">fx</span>
            </button>
            
            <button
              onClick={createLayerMask}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Add Layer Mask"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={createAdjustmentLayer}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Create New Fill or Adjustment Layer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={createNewGroup}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Create New Group"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </button>
            
            <button
              onClick={createNewLayer}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Create New Layer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={() => deleteLayer(selectedLayer)}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Delete Layer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layers;