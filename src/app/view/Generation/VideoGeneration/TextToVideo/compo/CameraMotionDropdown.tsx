"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{
        top: number;
        left: number;
        openUp: boolean;
    } | null>(null);
    const dropdownId = "video-camera-motion-dropdown";

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
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (buttonRef.current?.contains(target)) return;
            if (target.closest(`[data-dropdown="${dropdownId}"]`)) return;
            setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownId, isOpen]);

    useEffect(() => {
        if (!isOpen || !buttonRef.current) {
            setDropdownPosition(null);
            return;
        }

        const updateDropdownPosition = () => {
            if (!buttonRef.current) return;
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 160;
            let left = buttonRect.left;
            let top = buttonRect.top;
            let openUp = true;

            if (left + dropdownWidth > window.innerWidth - 8) {
                left = window.innerWidth - dropdownWidth - 8;
            }
            if (left < 8) {
                left = 8;
            }
            if (top < 8) {
                top = buttonRect.bottom + 8;
                openUp = false;
            }

            setDropdownPosition({ top, left, openUp });
        };

        updateDropdownPosition();
        window.addEventListener("scroll", updateDropdownPosition, true);
        window.addEventListener("resize", updateDropdownPosition);

        return () => {
            window.removeEventListener("scroll", updateDropdownPosition, true);
            window.removeEventListener("resize", updateDropdownPosition);
        };
    }, [isOpen]);

    useEffect(() => {
        if (onCloseThisDropdown && isOpen) {
            setIsOpen(false);
        }
    }, [onCloseThisDropdown, isOpen]);

    const selectedLabel = motions.find(m => m.value === selectedMotion)?.label || 'None';

    const dropdownContent = isOpen && dropdownPosition ? (
        <div
            data-dropdown={dropdownId}
            className="fixed w-40 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-[9999]"
            style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                transform: dropdownPosition.openUp
                    ? "translateY(calc(-100% - 8px))"
                    : "none",
            }}
        >
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
    ) : null;

    return (
        <>
        <div className="relative dropdown-container">
            <button
                ref={buttonRef}
                onClick={() => {
                    if (onCloseOtherDropdowns) onCloseOtherDropdowns();
                    setIsOpen(!isOpen);
                }}
                className="h-[28px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
            >
                <Camera className="w-4 h-4 mr-1" />
                Motion: {selectedLabel}
                <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </div>
        {typeof window !== "undefined" &&
            dropdownContent &&
            createPortal(dropdownContent, document.body)}
        </>
    );
};

export default CameraMotionDropdown;
