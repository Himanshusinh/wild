"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, Layers, Zap } from "lucide-react";

interface KlingVariantOption {
  value: string;
  label: string;
  info?: string;
}

interface KlingFamilyVariantDropdownProps {
  options: KlingVariantOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  onCloseOtherDropdowns?: () => void;
}

const KlingFamilyVariantDropdown: React.FC<KlingFamilyVariantDropdownProps> = ({
  options,
  selectedValue,
  onChange,
  onCloseOtherDropdowns,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownId = "kling-family-variant-dropdown";

  const selectedOption =
    options.find((option) => option.value === selectedValue) || options[0];

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
      let top = buttonRect.top;
      let openUp = true;

      if (left + dropdownWidth > window.innerWidth - 12) {
        left = window.innerWidth - dropdownWidth - 12;
      }
      if (left < 12) {
        left = 12;
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

  const dropdownContent =
    isOpen && dropdownPosition ? (
      <div
        data-dropdown={dropdownId}
        className="fixed z-[9999] w-auto overflow-hidden rounded-lg border border-white/15 bg-black/90 shadow-2xl backdrop-blur-3xl md:w-auto md:min-w-[260px] md:max-w-[min(calc(100vw-24px),360px)]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: dropdownPosition.openUp
            ? "translateY(calc(-100% - 2px))"
            : "none",
        }}
      >
        <div className="max-h-[38vh] space-y-0.5 overflow-y-auto overflow-x-hidden py-1 md:max-h-[min(60vh,24rem)] md:space-y-1 md:py-1">
          {options.map((option) => {
            const isSelected = option.value === selectedValue;
            return (
              <button
                key={option.value}
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
          className="flex h-[28px] w-auto max-w-[44vw] min-w-0 items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-2 text-[11px] font-medium text-white/90 transition hover:bg-white/15 md:h-[32px] md:max-w-none md:w-auto md:px-4 md:text-[13px] md:justify-start"
        >
          <Layers className="h-3 w-3 md:h-4 md:w-4" />
          {/* Desktop: full label. Mobile: compact label + fast icon. */}
          <span className="hidden md:inline truncate mt-0.5">
            {selectedOption?.label}
          </span>
          <span className="md:hidden flex items-center gap-1 min-w-0 flex-shrink truncate mt-0.5">
            <span className="truncate">
              {selectedOption?.label
                .replace("Reference", "Ref")
                .replace("Standard", "Std")
                .replace(" Fast", "")}
            </span>
            {selectedOption?.label.includes("Fast") && (
              <Zap className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </span>
          <ChevronUp
            className={`h-3 w-3 transition-transform duration-200 md:h-4 md:w-4 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      {typeof window !== "undefined" &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default KlingFamilyVariantDropdown;
