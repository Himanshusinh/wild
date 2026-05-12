"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateCustomStylePersistence,
  loadPersistedCustomStyleState,
  setIndianStyleVersion,
  type SavedCustomStyleFromImage,
} from "@/store/slices/generationSlice";
import StylePopup from "@/app/view/Generation/ImageGeneration/TextToImage/compo/StylePopup";
import { ChevronUp } from "lucide-react";
import { ALL_INDIAN_STYLES } from "@/styles/indianStyles";
import { CUSTOM_STYLE_FROM_IMAGE_ID } from "@/constants/customStyleFromImage";
import { getStyleByValue } from "@/styles/stylesCatalog";
import { styleGridRowFallbackPrompt } from "@/utils/stylePreviewFallback";
import { StyleThumbnailImage } from "@/components/style/StyleThumbnailImage";
import { zataPublicStyleThumbnailAvifUrl } from "@/lib/zataStyleUrls";

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
  /** Pauses auto-close while StylePopup runs custom style vision analysis. */
  const [stylePopupBusy, setStylePopupBusy] = useState(false);
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
  const customStyleFromImage = useAppSelector(
    (state: any) => state.generation?.customStyleFromImage ?? null,
  );
  const savedCustomStylesFromImage = useAppSelector(
    (state: any) => state.generation?.savedCustomStylesFromImage ?? [],
  );
  const isIndianStyleSelected = ALL_INDIAN_STYLES.some((s) => s.id === style);
  const styleButtonLabel =
    style === "none"
      ? "Style"
      : style === CUSTOM_STYLE_FROM_IMAGE_ID
        ? customStyleFromImage?.label || "Custom style"
        : style;

  const styleTriggerThumb = useMemo(() => {
    if (style === "none") return null;
    if (style === CUSTOM_STYLE_FROM_IMAGE_ID) {
      const id = customStyleFromImage?.id;
      if (id) {
        const saved = savedCustomStylesFromImage.find(
          (entry: SavedCustomStyleFromImage) => entry.id === id,
        );
        if (saved?.previewDataUrl) {
          return {
            src: saved.previewDataUrl,
            alt: saved.label,
            fallback: undefined as string | undefined,
          };
        }
      }
      return null;
    }
    const indian = ALL_INDIAN_STYLES.find((s) => s.id === style);
    if (indian) {
      return {
        src: indian.image,
        alt: indian.title,
        fallback: styleGridRowFallbackPrompt({
          name: indian.title,
          description: indian.desc,
        }),
      };
    }
    const cat = getStyleByValue(style);
    if (cat) {
      return {
        src: zataPublicStyleThumbnailAvifUrl(style),
        alt: cat.name,
        fallback: styleGridRowFallbackPrompt({
          name: cat.name,
          description: cat.description,
          prompt: cat.prompt,
        }),
      };
    }
    return null;
  }, [style, customStyleFromImage, savedCustomStylesFromImage]);

  // Icons removed: display only text

  // Auto-close after 1 minute, but not while custom style analysis is running.
  useEffect(() => {
    if (!isStylePopupOpen) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    if (stylePopupBusy) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsStylePopupOpen(false);
    }, 60000);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isStylePopupOpen, stylePopupBusy]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    dispatch(hydrateCustomStylePersistence(loadPersistedCustomStyleState()));
  }, [mounted, dispatch]);

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
          {styleTriggerThumb ? (
            <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-sm ring-1 ring-white/15 md:h-5 md:w-5">
              <StyleThumbnailImage
                src={styleTriggerThumb.src}
                alt={styleTriggerThumb.alt}
                fallbackPrompt={styleTriggerThumb.fallback}
                instanceKey={`style-trigger-${style}`}
                eager
                className="h-full w-full object-cover"
              />
            </span>
          ) : null}
          <span className="capitalize line-clamp-1 max-w-[140px] md:max-w-[200px]">
            {styleButtonLabel}
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
        onBusyChange={setStylePopupBusy}
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
