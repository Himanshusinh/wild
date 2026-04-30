"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIndianStyleVersion } from "@/store/slices/generationSlice";
import StylePopup from "@/app/view/Generation/ImageGeneration/TextToImage/compo/StylePopup";
import { ChevronUp } from "lucide-react";
import { ALL_INDIAN_STYLES } from "@/styles/indianStyles";

const INDIAN_STYLE_VERSION_OPTIONS: Array<{
  value: "V1" | "V2" | "V3";
  label: string;
}> = [
  { value: "V1", label: "V1 - Authentic" },
  { value: "V2", label: "V2 - Traditional" },
  { value: "V3", label: "V3 - Modern" },
];

const StyleSelector = () => {
  const dispatch = useAppDispatch();
  const style = useAppSelector(
    (state: any) => state.generation?.style || "none",
  );
  const indianStyleVersion = useAppSelector(
    (state: any) => state.generation?.indianStyleVersion || "V1",
  );
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "new-turbo-model",
  );
  const [isStylePopupOpen, setIsStylePopupOpen] = useState(false);
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const versionDropdownRef = useRef<HTMLDivElement | null>(null);
  const versionButtonRef = useRef<HTMLButtonElement | null>(null);
  const versionMenuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const isIndianStyleSelected = ALL_INDIAN_STYLES.some((s) => s.id === style);

  // Icons removed: display only text

  // Auto-close popup after 5 seconds
  useEffect(() => {
    if (isStylePopupOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for 1 minute (Bug 46 fix)
      timeoutRef.current = setTimeout(() => {
        setIsStylePopupOpen(false);
      }, 60000);
    } else {
      // Clear timeout if popup is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isStylePopupOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVersionDropdownOpen) return;
    const updateMenuPosition = () => {
      if (!versionButtonRef.current) return;
      const rect = versionButtonRef.current.getBoundingClientRect();
      // Open upward so it doesn't collide with the input area below.
      setMenuPos({
        top: rect.top - 8,
        left: rect.right,
      });
    };
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isVersionDropdownOpen]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!versionDropdownRef.current) return;
      const targetNode = event.target as Node;
      const clickedTrigger = versionDropdownRef.current.contains(targetNode);
      const clickedMenu = versionMenuRef.current?.contains(targetNode) ?? false;
      if (!clickedTrigger && !clickedMenu) {
        setIsVersionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  return (
    <>
      <div className="relative dropdown-container flex items-center gap-2">
        <button
          onClick={() => setIsStylePopupOpen(true)}
          className={`h-[23px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex justify-center items-center gap-2 ${
            style !== "none"
              ? "bg-transparent text-white/90"
              : "bg-transparent text-white/90 hover:bg-white/5"
          }`}
        >
          <span className="capitalize">
            {style === "none" ? "Style" : style}
          </span>
          <div
            className={`w-4 h-4 flex  items-center justify-center ${
              style !== "none" ? "text-white/90" : "text-white/90"
            }`}
          >
            <ChevronUp
              className={`w-4 h-4 transition-transform duration-200 ${isStylePopupOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>
        {isIndianStyleSelected && (
          <div className="relative" ref={versionDropdownRef}>
            <button
              ref={versionButtonRef}
              onClick={() => setIsVersionDropdownOpen((prev) => !prev)}
              className="h-[23px] md:h-[32px] md:px-3 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 hover:bg-white/5 transition flex justify-center items-center gap-1"
            >
              {indianStyleVersion}
              <ChevronUp
                className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${isVersionDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Style Popup */}
      <StylePopup
        isOpen={isStylePopupOpen}
        onClose={() => setIsStylePopupOpen(false)}
      />
      {mounted &&
        isVersionDropdownOpen &&
        createPortal(
          <div
            ref={versionMenuRef}
            className="fixed md:w-36 w-15 bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-[9999] max-h-150 overflow-y-auto dropdown-scrollbar ml-10"
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              transform: "translate(-100%, calc(-100% - 0px))",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {INDIAN_STYLE_VERSION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  dispatch(setIndianStyleVersion(option.value));
                  setIsVersionDropdownOpen(false);
                }}
                className={`w-full md:px-4 px-2 md:py-2 py-1 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                  indianStyleVersion === option.value
                    ? "bg-white text-black"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <span className="uppercase">{option.label}</span>
                {indianStyleVersion === option.value && (
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

export default StyleSelector;
