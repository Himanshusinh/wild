"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, Layers } from "lucide-react";

interface SeedanceVariantOption {
  value: string;
  label: string;
}

interface SeedanceFamilyVariantDropdownProps {
  options: SeedanceVariantOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  onCloseOtherDropdowns?: () => void;
}

const SeedanceFamilyVariantDropdown: React.FC<
  SeedanceFamilyVariantDropdownProps
> = ({ options, selectedValue, onChange, onCloseOtherDropdowns }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownId = "seedance-family-variant-dropdown";

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
      const dropdownWidth = window.innerWidth >= 768 ? 260 : Math.min(260, window.innerWidth - 16);
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

  const dropdownContent =
    isOpen && dropdownPosition ? (
      <div
        data-dropdown={dropdownId}
        className="fixed w-auto max-w-[calc(100vw-16px)] rounded-lg border border-white/15 bg-black/90 shadow-2xl backdrop-blur-3xl z-[9999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: dropdownPosition.openUp
            ? "translateY(calc(-100% - 8px))"
            : "none",
        }}
      >
        <div className="space-y-1">
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
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[12px] transition ${
                  isSelected
                    ? "bg-white text-black"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <span className="ml-1 h-2 w-2 rounded-full bg-black" />}
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
          className="flex h-[28px] items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2 text-[11px] font-medium text-white/90 transition hover:bg-white/15 md:h-[32px] md:px-4 md:text-[13px]"
        >
          <Layers className="h-3 w-3 md:h-4 md:w-4" />
          <span className="truncate">{selectedOption?.label}</span>
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

export default SeedanceFamilyVariantDropdown;
