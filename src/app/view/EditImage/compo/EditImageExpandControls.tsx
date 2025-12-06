'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CustomDimensionInput } from './CustomDimensionInput';
import { ChevronUp } from 'lucide-react';

interface EditImageExpandControlsProps {
    aspectPreset: string;
    expandPrompt: string;
    isExpanding: boolean;
    externalIsExpanding?: boolean;
    sourceImageUrl: string | null;
    onAspectPresetChange: (preset: string) => void;
    onExpandPromptChange: (prompt: string) => void;
    onExpand: () => void;
    aspectPresets: Record<string, { label: string; sizeLabel?: string; width?: number; height?: number }>;
    customWidth: number;
    customHeight: number;
    onCustomWidthChange: (width: number) => void;
    onCustomHeightChange: (height: number) => void;
    imageSize?: { width: number; height: number } | null;
}

export const EditImageExpandControls: React.FC<EditImageExpandControlsProps> = ({
    aspectPreset,
    expandPrompt,
    isExpanding,
    externalIsExpanding,
    sourceImageUrl,
    onAspectPresetChange,
    onExpandPromptChange,
    onExpand,
    aspectPresets,
    customWidth,
    customHeight,
    onCustomWidthChange,
    onCustomHeightChange,
    imageSize,
}) => {
    // Hardcoded dark mode
    const isDark = true;

    const [showCustomInput, setShowCustomInput] = useState(false);
    const customButtonRef = useRef<HTMLDivElement>(null);

    // Calculate minimum frame dimensions based on image size
    const minWidth = imageSize ? imageSize.width : 1024;
    const minHeight = imageSize ? imageSize.height : 1024;

    // Use all presets (removed filtering)
    const availablePresets = aspectPresets;

    const inputBg = '#1a1a1a';
    const inputText = '#ffffff';
    const selectBg = '#121212';
    const selectText = '#ffffff';
    const selectBorder = 'rgba(255, 255, 255, 0.2)';
    const buttonBg = aspectPreset === 'custom' ? '#437eb5' : '#1a1a1a';
    const buttonText = 'white';
    const promptInputBg = '#121212';
    const promptInputText = '#ffffff';
    const headingColor = '#ffffff';

    // Click outside logic moved to CustomDimensionInput

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/90">Expand Image</h3>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                {/* Aspect Ratio Dropdown */}
                <select
                    value={aspectPreset === 'custom' ? (Object.keys(availablePresets).find(k => k !== 'custom') || '1:1') : aspectPreset}
                    onChange={(e) => {
                        const selectedPreset = e.target.value;
                        const preset = availablePresets[selectedPreset];

                        if (selectedPreset === 'custom') {
                            onAspectPresetChange('custom');
                            return;
                        }

                        // Validate preset is large enough
                        if (preset && preset.width && preset.height && imageSize) {
                            if (preset.width < imageSize.width || preset.height < imageSize.height) {
                                // Preset is smaller than image -> Switch to custom with image dimensions (or larger)
                                // We can't set custom dimensions directly here as we don't have the setter for width/height exposed as a prop that controls the PARENT state fully independent of preset change
                                // Wait, we have onCustomWidthChange. We should set them.
                                onCustomWidthChange(Math.max(preset.width, imageSize.width));
                                onCustomHeightChange(Math.max(preset.height, imageSize.height));
                                onAspectPresetChange('custom');
                                return;
                            }
                        }

                        onAspectPresetChange(selectedPreset);
                    }}
                    className="h-[32px] px-3 rounded-lg bg-white/5 border border-white/20 text-white text-xs focus:outline-none cursor-pointer min-w-[100px]"
                >
                    {Object.entries(availablePresets)
                        .filter(([key]) => key !== 'custom')
                        .map(([key, config]) => {
                            const isDisabled = imageSize && (config.width! < imageSize.width || config.height! < imageSize.height);
                            return (
                                <option key={key} value={key} className="bg-black text-white" disabled={!!isDisabled}>
                                    {config.label} {config.sizeLabel && `(${config.sizeLabel})`} {isDisabled ? '(Too small)' : ''}
                                </option>
                            );
                        })}
                </select>

                {/* Width Input */}
                <input
                    type="number"
                    value={aspectPreset === 'custom' ? customWidth : aspectPresets[aspectPreset]?.width || 1500}
                    onChange={(e) => {
                        if (aspectPreset === 'custom') {
                            const value = parseInt(e.target.value) || minWidth;
                            onCustomWidthChange(Math.max(minWidth, Math.min(5000, value)));
                        }
                    }}
                    disabled={aspectPreset !== 'custom'}
                    min={minWidth}
                    max={5000}
                    placeholder="W"
                    className={`h-[32px] w-[70px] px-2 rounded-lg border border-white/20 text-white text-xs focus:outline-none ${aspectPreset === 'custom' ? 'bg-white/5' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
                />

                {/* Height Input */}
                <input
                    type="number"
                    value={aspectPreset === 'custom' ? customHeight : aspectPresets[aspectPreset]?.height || 1500}
                    onChange={(e) => {
                        if (aspectPreset === 'custom') {
                            const value = parseInt(e.target.value) || minHeight;
                            onCustomHeightChange(Math.max(minHeight, Math.min(5000, value)));
                        }
                    }}
                    disabled={aspectPreset !== 'custom'}
                    min={minHeight}
                    max={5000}
                    placeholder="H"
                    className={`h-[32px] w-[70px] px-2 rounded-lg border border-white/20 text-white text-xs focus:outline-none ${aspectPreset === 'custom' ? 'bg-white/5' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
                />

                {/* Custom Button */}
                <div ref={customButtonRef} className="relative">
                    <button
                        onClick={() => {
                            onAspectPresetChange('custom');
                            setShowCustomInput(!showCustomInput);
                        }}
                        className={`h-[32px] px-3 rounded-lg border border-white/20 text-xs font-medium transition-colors ${aspectPreset === 'custom' ? 'bg-[#437eb5] text-white' : 'bg-white/5 text-white/80 hover:bg-white/10'}`}
                    >
                        Custom
                    </button>
                    {showCustomInput && aspectPreset === 'custom' && (
                        <CustomDimensionInput
                            width={customWidth}
                            height={customHeight}
                            onWidthChange={onCustomWidthChange}
                            onHeightChange={onCustomHeightChange}
                            onClose={() => setShowCustomInput(false)}
                            minWidth={minWidth}
                            minHeight={minHeight}
                            anchorElement={customButtonRef.current}
                        />
                    )}
                </div>
            </div>

            {/* Prompt Input */}
            {/* <div className="w-full">
        <input
          type="text"
          value={expandPrompt}
          onChange={(e) => onExpandPromptChange(e.target.value)}
          placeholder="Prompt (optional)"
          className="w-full h-[32px] px-3 rounded-lg bg-white/5 border border-white/20 text-white text-xs focus:outline-none placeholder-white/40"
        />
      </div> */}
        </div>
    );
};
