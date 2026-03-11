"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronUp, Camera } from "lucide-react";

interface CameraMotionDropdownProps {
    selectedMotion: string;
    onMotionChange: (motion: string) => void;
    onCloseOtherDropdowns?: () => void;
    onCloseThisDropdown?: boolean;
}

const CameraMotionDropdown: React.FC<CameraMotionDropdownProps> = ({
    selectedMotion,
    onMotionChange,
    onCloseOtherDropdowns,
    onCloseThisDropdown,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const motions = [
        { value: 'none', label: 'None' },
        { value: 'dolly_in', label: 'Dolly In' },
        { value: 'dolly_out', label: 'Dolly Out' },
        { value: 'dolly_left', label: 'Dolly Left' },
        { value: 'dolly_right', label: 'Dolly Right' },
        { value: 'jib_up', label: 'Jib Up' },
        { value: 'jib_down', label: 'Jib Down' },
        { value: 'static', label: 'Static' },
        { value: 'focus_shift', label: 'Focus Shift' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (onCloseThisDropdown && isOpen) {
            setIsOpen(false);
        }
    }, [onCloseThisDropdown, isOpen]);

    const selectedLabel = motions.find(m => m.value === selectedMotion)?.label || 'None';

    return (
        <div className="relative dropdown-container" ref={dropdownRef}>
            <button
                onClick={() => {
                    if (onCloseOtherDropdowns) onCloseOtherDropdowns();
                    setIsOpen(!isOpen);
                }}
                className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white"
            >
                <Camera className="w-4 h-4 mr-1" />
                Motion: {selectedLabel}
                <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
                    {motions.map((m) => (
                        <button
                            key={m.value}
                            onClick={() => {
                                onMotionChange(m.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 p-2 text-left transition text-[13px] flex items-center justify-between ${selectedMotion === m.value ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                }`}
                        >
                            {m.label}
                            {selectedMotion === m.value && <div className="w-2 h-2 bg-black rounded-full" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CameraMotionDropdown;
