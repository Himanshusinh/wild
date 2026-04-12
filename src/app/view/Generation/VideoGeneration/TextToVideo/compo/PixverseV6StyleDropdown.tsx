"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, Sparkles } from "lucide-react";

export type PixverseV6StyleValue =
  | ""
  | "anime"
  | "3d_animation"
  | "clay"
  | "comic"
  | "cyberpunk";

const OPTIONS: { value: PixverseV6StyleValue; label: string; info?: string }[] =
  [
    { value: "", label: "Default", info: "No preset style" },
    { value: "anime", label: "Anime" },
    { value: "3d_animation", label: "3D animation" },
    { value: "clay", label: "Clay" },
    { value: "comic", label: "Comic" },
    { value: "cyberpunk", label: "Cyberpunk" },
  ];

interface PixverseV6StyleDropdownProps {
  value: PixverseV6StyleValue;
  onChange: (value: PixverseV6StyleValue) => void;
  onCloseOtherDropdowns?: () => void;
}

/**
 * Style picker for PixVerse V6 — matches PixverseFamilyVariantDropdown visuals;
 * menu always opens upward (above the trigger).
 */
const PixverseV6StyleDropdown: React.FC<PixverseV6StyleDropdownProps> = ({
  value,
  onChange,
  onCloseOtherDropdowns,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownId = "pixverse-v6-style-dropdown";

  const selectedOption =
    OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!;

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
      const dropdownWidth =
        window.innerWidth >= 768 ? 260 : Math.min(248, window.innerWidth - 32);
      let left = buttonRect.left;
      const top = buttonRect.top;
      if (left + dropdownWidth > window.innerWidth - 12) {
        left = window.innerWidth - dropdownWidth - 12;
      }
      if (left < 12) left = 12;
      setDropdownPosition({ top, left });
    };
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  const dropdownContent =
    isOpen && dropdownPosition ? (
      <div
        data-dropdown={dropdownId}
        className="fixed z-[9999] w-[min(calc(100vw-32px),220px)] max-w-[min(calc(100vw-32px),220px)] overflow-hidden rounded-lg border border-white/15 bg-black/90 shadow-2xl backdrop-blur-3xl md:w-auto "
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: "translateY(calc(-100% - 8px))",
        }}
      >
        <div className="max-h-[38vh] space-y-0.5 overflow-y-auto overflow-x-hidden py-1 md:max-h-[min(60vh,24rem)] md:space-y-1 md:py-1">
          {OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || "default"}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full flex-col items-stretch gap-1 rounded-md px-2 py-1.5 text-left text-[10px] transition md:flex-row md:items-center md:justify-between md:gap-3 md:px-3 md:py-2 md:text-[12px] ${
                  isSelected
                    ? "bg-white text-black"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                <span className="shrink-0 font-medium">{option.label}</span>
                <span className="flex flex-row flex-wrap items-center justify-between gap-1.5 md:ml-auto md:flex-nowrap md:justify-end md:gap-2">
                  {option.info ? (
                    <span
                      className={`max-w-full rounded-md px-1.5 py-0.5 text-left text-[8px] font-medium leading-tight md:max-w-[200px] md:rounded-lg md:px-2 md:py-0.5 md:text-[10px] ${
                        isSelected
                          ? "bg-black/5 text-black/95"
                          : "bg-white/5 text-white/85"
                      }`}
                    >
                      {option.info}
                    </span>
                  ) : null}
                  {isSelected && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black md:h-2 md:w-2" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="relative shrink-0">
        <div className="relative dropdown-container">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => {
              try {
                onCloseOtherDropdowns?.();
              } catch {}
              setIsOpen((prev) => !prev);
            }}
            className="flex h-[28px] w-auto max-w-[min(92vw,280px)] min-w-0 items-center justify-between gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2 text-[11px] font-medium text-white/90 transition hover:bg-white/15 md:h-[32px] md:max-w-none md:w-auto md:gap-2 md:px-4 md:text-[13px] md:justify-start"
            aria-label="PixVerse style preset"
            aria-expanded={isOpen}
          >
            <Sparkles className="h-3 w-3 shrink-0 md:h-4 md:w-4" />
            <span className="min-w-0 truncate">
              Style: {selectedOption.label}
            </span>
            <ChevronUp
              className={`h-3 w-3 shrink-0 transition-transform duration-200 md:h-4 md:w-4 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
      {typeof window !== "undefined" &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default PixverseV6StyleDropdown;
