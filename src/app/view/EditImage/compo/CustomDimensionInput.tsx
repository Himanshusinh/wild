'use client';

import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomDimensionInputProps {
    width: number;
    height: number;
    onWidthChange: (width: number) => void;
    onHeightChange: (height: number) => void;
    onClose: () => void;
    minWidth?: number;
    minHeight?: number;
    anchorElement?: HTMLElement | null;
}

export const CustomDimensionInput: React.FC<CustomDimensionInputProps> = ({
    width,
    height,
    onWidthChange,
    onHeightChange,
    onClose,
    minWidth = 1024,
    minHeight = 1024,
    anchorElement,
}) => {
    // Hardcoded dark mode to match EditImageInterface
    const isDark = true;

    const [position, setPosition] = useState({ top: 0, left: 0 });

    const containerRef = React.useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (anchorElement) {
            const updatePosition = () => {
                const rect = anchorElement.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + 4,
                    left: rect.left
                });
            };
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [anchorElement]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                anchorElement && // Also check if clicking the trigger button
                !anchorElement.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, anchorElement]);

    const [localWidth, setLocalWidth] = useState(width);
    const [localHeight, setLocalHeight] = useState(height);
    const maxSize = 5000;

    const containerBg = '#121212';
    const containerBorder = 'rgba(255, 255, 255, 0.2)';
    const labelText = '#ffffff';
    const inputBg = '#121212';
    const inputText = '#ffffff';
    const inputBorder = 'rgba(255, 255, 255, 0.2)';
    const buttonText = '#cccccc';
    const helpBorder = 'rgba(255, 255, 255, 0.3)';
    const helpText = '#999999';
    const sliderBg = 'rgba(255, 255, 255, 0.2)';
    const presetButtonBg = '#1a1a1a';
    const presetButtonText = '#ffffff';
    const presetButtonBorder = 'rgba(255, 255, 255, 0.2)';

    const handleWidthChange = useCallback((newWidth: number) => {
        const clamped = Math.max(minWidth, Math.min(maxSize, newWidth));
        setLocalWidth(clamped);
        onWidthChange(clamped);
    }, [onWidthChange, minWidth]);

    const handleHeightChange = useCallback((newHeight: number) => {
        const clamped = Math.max(minHeight, Math.min(maxSize, newHeight));
        setLocalHeight(clamped);
        onHeightChange(clamped);
    }, [onHeightChange, minHeight]);

    const handleWidthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        handleWidthChange(value);
    };

    const handleHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        handleHeightChange(value);
    };

    const handleWidthSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        handleWidthChange(value);
    };

    const handleHeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        handleHeightChange(value);
    };

    const incrementWidth = () => handleWidthChange(localWidth + 10);
    const decrementWidth = () => handleWidthChange(localWidth - 10);
    const incrementHeight = () => handleHeightChange(localHeight + 10);
    const decrementHeight = () => handleHeightChange(localHeight - 10);

    const applyPreset = (presetWidth: number, presetHeight: number) => {
        handleWidthChange(presetWidth);
        handleHeightChange(presetHeight);
    };

    const content = (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                marginTop: '0px',
                backgroundColor: containerBg,
                borderRadius: '6px',
                padding: '12px',
                minWidth: '260px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                zIndex: 10004,
                border: `1px solid ${containerBorder}`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Width Control */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: labelText, fontSize: '12px', fontWeight: 500, transition: 'color 0.3s ease' }}>Width</span>
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                border: `1px solid ${helpBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'help',
                                transition: 'border-color 0.3s ease',
                            }}
                            title="Set the width of the expanded image"
                        >
                            <span style={{ color: helpText, fontSize: '9px', transition: 'color 0.3s ease' }}>?</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                            type="number"
                            value={localWidth}
                            onChange={handleWidthInputChange}
                            min={minWidth}
                            max={maxSize}
                            style={{
                                width: '70px',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${inputBorder}`,
                                backgroundColor: inputBg,
                                color: inputText,
                                fontSize: '12px',
                                outline: 'none',
                                textAlign: 'center',
                                transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <button
                                onClick={incrementWidth}
                                style={{
                                    width: '18px',
                                    height: '14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: buttonText,
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                ▲
                            </button>
                            <button
                                onClick={decrementWidth}
                                style={{
                                    width: '18px',
                                    height: '14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: buttonText,
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                </div>
                <input
                    type="range"
                    min={minWidth}
                    max={maxSize}
                    value={localWidth}
                    onChange={handleWidthSliderChange}
                    style={{
                        width: '100%',
                        height: '3px',
                        backgroundColor: sliderBg,
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        transition: 'background-color 0.3s ease',
                    }}
                />
            </div>

            {/* Height Control */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: labelText, fontSize: '12px', fontWeight: 500, transition: 'color 0.3s ease' }}>Height</span>
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                border: `1px solid ${helpBorder}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'help',
                                transition: 'border-color 0.3s ease',
                            }}
                            title="Set the height of the expanded image"
                        >
                            <span style={{ color: helpText, fontSize: '9px', transition: 'color 0.3s ease' }}>?</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                            type="number"
                            value={localHeight}
                            onChange={handleHeightInputChange}
                            min={minHeight}
                            max={maxSize}
                            style={{
                                width: '70px',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${inputBorder}`,
                                backgroundColor: inputBg,
                                color: inputText,
                                fontSize: '12px',
                                outline: 'none',
                                textAlign: 'center',
                                transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                            }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <button
                                onClick={incrementHeight}
                                style={{
                                    width: '18px',
                                    height: '14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: buttonText,
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                ▲
                            </button>
                            <button
                                onClick={decrementHeight}
                                style={{
                                    width: '18px',
                                    height: '14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: buttonText,
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                </div>
                <input
                    type="range"
                    min={minHeight}
                    max={maxSize}
                    value={localHeight}
                    onChange={handleHeightSliderChange}
                    style={{
                        width: '100%',
                        height: '3px',
                        backgroundColor: sliderBg,
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        transition: 'background-color 0.3s ease',
                    }}
                />
            </div>

            {/* Preset Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={() => applyPreset(localWidth, localHeight)}
                    style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: `1px solid ${presetButtonBorder}`,
                        backgroundColor: presetButtonBg,
                        color: presetButtonText,
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                    }}
                >
                    Custom
                </button>
                <button
                    onClick={() => applyPreset(1440, 1440)}
                    style={{
                        flex: 1,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    1440 x 1440
                </button>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
};
