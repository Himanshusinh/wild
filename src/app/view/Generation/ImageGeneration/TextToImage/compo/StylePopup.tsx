'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  setStyle,
  applyCustomStyleFromImage,
  addSavedCustomStyleFromImage,
  type SavedCustomStyleFromImage,
} from '@/store/slices/generationSlice';
import { STYLE_CATALOG } from '@/styles/stylesCatalog';
import { ALL_INDIAN_STYLES } from '@/styles/indianStyles';
import { X } from 'lucide-react';
import StyleFiltersBar, { type StyleFilterOption } from '@/components/ui/StyleFiltersBar';

// Wrapper component for style preview images with error handling
const StylePreviewImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill 
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw" 
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      unoptimized
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc('/styles/Logo.gif');
        }
      }}
    />
  );
};

interface StylePopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** When custom style vision analysis is running — parent can pause auto-close timers. */
  onBusyChange?: (busy: boolean) => void;
}

const StylePopup = ({ isOpen, onClose, onBusyChange }: StylePopupProps) => {
  const dispatch = useAppDispatch();
  const currentStyle = useAppSelector((state: any) => state.generation?.style || 'none');
  // Do not force any default model here; empty string means no model chosen yet
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || '');
  const customStyleFromImage = useAppSelector(
    (state: any) => state.generation?.customStyleFromImage ?? null,
  );
  const savedCustomStylesFromImage = useAppSelector(
    (state: any) => state.generation?.savedCustomStylesFromImage ?? [],
  );
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'general' | 'indian'>('general');
  const [indianSearchQuery, setIndianSearchQuery] = useState('');
  const [indianStateFilter, setIndianStateFilter] = useState<string>('all');
  const [indianTypeFilter, setIndianTypeFilter] = useState<string>('all');
  const indianStyleValues = useRef(new Set(ALL_INDIAN_STYLES.map((s) => s.id)));

  const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);
  const [customDataUrl, setCustomDataUrl] = useState<string | null>(null);
  const [customAnalyzing, setCustomAnalyzing] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [customDraftName, setCustomDraftName] = useState('');
  const [customDraftDirective, setCustomDraftDirective] = useState('');
  const [customPlusExpanded, setCustomPlusExpanded] = useState(false);
  const customFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Model-specific style filtering
  const isLucidOrigin = selectedModel === 'leonardoai/lucid-origin';
  const isPhoenix = selectedModel === 'leonardoai/phoenix-1.0';

  // Filter styles based on selected model
  const styles = (() => {
    if (isLucidOrigin) {
      // Lucid Origin: Only show model-specific styles
      const allowedStyles = new Set([
        'bokeh', 'cinematic', 'cinematic_close_up', 'creative', 'dynamic', 'fashion', 
        'film', 'food', 'hdr', 'long_exposure', 'macro', 'minimalist', 'monochrome', 
        'moody', 'neutral', 'none', 'portrait', 'retro', 'stock_photo', 'unprocessed', 'vibrant'
      ]);
      return STYLE_CATALOG.filter(style => allowedStyles.has(style.value));
    }
    if (isPhoenix) {
      // Phoenix 1.0: Only show model-specific styles
      const allowedStyles = new Set([
        '3d_cartoon', 'bokeh', 'cinematic', 'cinematic_concept', 'creative', 'dynamic', 
        'fashion', 'graphic_design_pop_art', 'graphic_design_vector', 'hdr', 'illustration', 
        'macro', 'minimalist', 'moody', 'none', 'portrait', 'pro_bw_photography', 
        'pro_color_photography', 'pro_film_photography', 'portrait_fashion', 'ray_tracing', 
        'sketch_bw', 'sketch_color', 'stock_photo', 'vibrant'
      ]);
      return STYLE_CATALOG.filter(style => allowedStyles.has(style.value));
    }
    // For other models, show only original styles (exclude new model-specific styles)
    const originalStyles = new Set([
      'none', 'neutral_studio', 'realistic', 'minimalist', 'watercolor', 'oil_painting', 
      'abstract', 'cyberpunk', 'neon_noir', 'isometric', 'vintage_poster', 'vaporwave', 
      'pixel_art', 'cartoon', 'pencil_sketch', 'claymation', 'fantasy', 'sci_fi', 
      'steampunk', 'abstract_geometry', 'surrealism', '3d_cartoon', 'ukiyoe', 'graffiti', 
      'renaissance', 'pop_art'
    ]);
    return STYLE_CATALOG.filter(style => originalStyles.has(style.value));
  })();

  useEffect(() => {
    const currentStyleValue = currentStyle;
    if (indianStyleValues.current.has(currentStyleValue)) return;
    if (currentStyleValue === CUSTOM_STYLE_FROM_IMAGE_ID) return;
    const isCurrentStyleSupported = styles.some(style => style.value === currentStyleValue);
    
    if (!isCurrentStyleSupported && styles.length > 0) {
      // Switch to the first supported style (usually 'none')
      dispatch(setStyle(styles[0].value));
    }
  }, [selectedModel, styles, currentStyle, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveCategory(
      currentStyle === CUSTOM_STYLE_FROM_IMAGE_ID
        ? 'custom'
        : indianStyleValues.current.has(currentStyle)
          ? 'indian'
          : 'general',
    );
  }, [isOpen, currentStyle]);

  const indianRowsUnfiltered = useMemo(
    () =>
      ALL_INDIAN_STYLES.map((s) => {
        const typeLabel =
          'tag' in s && typeof (s as { tag?: string }).tag === 'string'
            ? (s as { tag: string }).tag
            : null;
        return {
          name: s.title,
          value: s.id,
          image: s.image,
          description: s.desc,
          state: s.name,
          typeLabel,
          isIndian: true,
        };
      }).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [],
  );

  const indianStateOptions = useMemo(() => {
    const set = new Set(indianRowsUnfiltered.map((r) => r.state));
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  }, [indianRowsUnfiltered]);

  const indianTypeOptions = useMemo(() => {
    const tags = new Set<string>();
    let hasUntagged = false;
    for (const r of indianRowsUnfiltered) {
      if (r.typeLabel) tags.add(r.typeLabel);
      else hasUntagged = true;
    }
    const sorted = Array.from(tags).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
    if (hasUntagged) sorted.push('Other');
    return sorted;
  }, [indianRowsUnfiltered]);

  const indianStateFilterOptions = useMemo<StyleFilterOption[]>(
    () => indianStateOptions.map((state) => ({ value: state, label: state })),
    [indianStateOptions],
  );

  const indianTypeFilterOptions = useMemo<StyleFilterOption[]>(
    () => indianTypeOptions.map((type) => ({ value: type, label: type })),
    [indianTypeOptions],
  );

  const filteredIndianRows = useMemo(() => {
    const q = indianSearchQuery.trim().toLowerCase();
    return indianRowsUnfiltered.filter((row) => {
      if (indianStateFilter !== 'all' && row.state !== indianStateFilter)
        return false;
      if (indianTypeFilter !== 'all') {
        if (indianTypeFilter === 'Other') {
          if (row.typeLabel != null) return false;
        } else if (row.typeLabel !== indianTypeFilter) return false;
      }
      if (q) {
        const hay = `${row.name} ${row.description} ${row.state} ${row.value}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    indianRowsUnfiltered,
    indianSearchQuery,
    indianStateFilter,
    indianTypeFilter,
  ]);

  const allStyles =
    activeCategory === 'general' ? styles : filteredIndianRows;

  const handleStyleSelect = (styleValue: string) => {
    dispatch(setStyle(styleValue));
    onClose();
  };

  const onCustomFile = (file: File | null) => {
    setCustomError(null);
    setCustomDraftDirective('');
    if (!file || !file.type.startsWith('image/')) {
      setCustomDraftName('');
      setCustomPreviewUrl(null);
      setCustomDataUrl(null);
      return;
    }
    if (customPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(customPreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setCustomPreviewUrl(url);
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === 'string') setCustomDataUrl(r);
    };
    reader.readAsDataURL(file);
  };

  const runCustomAnalysis = async () => {
    if (!customDataUrl) {
      setCustomError('Upload an image first.');
      return;
    }
    setCustomError(null);
    setCustomAnalyzing(true);
    setCustomDraftDirective('');
    try {
      const res = await fetch('/api/style/analyze-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: customDataUrl }),
      });
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        const hint = raw.trim().startsWith('<')
          ? 'Service returned HTML instead of JSON (check backend route/deploy).'
          : 'Service returned a non-JSON response.';
        throw new Error(
          `${hint}${res.status ? ` (HTTP ${res.status})` : ''}`,
        );
      }
      if (!data?.ok) {
        setCustomError(
          data?.error ||
            data?.message ||
            `Analysis failed${res.status ? ` (HTTP ${res.status})` : ''}`,
        );
        return;
      }
      const nameFromModel = typeof data.styleName === 'string' ? data.styleName.trim() : '';
      if (nameFromModel) setCustomDraftName(nameFromModel);
      setCustomDraftDirective(
        typeof data.styleDirective === 'string' ? data.styleDirective : '',
      );
    } catch (e: any) {
      setCustomError(e?.message || 'Network error');
    } finally {
      setCustomAnalyzing(false);
    }
  };

  const resetCustomBuilderForm = () => {
    if (customPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(customPreviewUrl);
    setCustomPreviewUrl(null);
    setCustomDataUrl(null);
    setCustomDraftName('');
    setCustomDraftDirective('');
    setCustomError(null);
    if (customFileInputRef.current) customFileInputRef.current.value = '';
  };

  const saveCustomStyleFromBuilder = () => {
    const label = customDraftName.trim();
    const directive = customDraftDirective.trim();
    if (!label) {
      setCustomError('Enter a style name.');
      return;
    }
    if (!directive) {
      setCustomError('Run analyze to get style instructions from the image.');
      return;
    }
    if (!customDataUrl) {
      setCustomError('Upload an image first.');
      return;
    }
    const id = crypto.randomUUID();
    dispatch(
      addSavedCustomStyleFromImage({
        id,
        label,
        directive,
        previewDataUrl: customDataUrl,
      }),
    );
    dispatch(applyCustomStyleFromImage({ id, label, directive }));
    setCustomPlusExpanded(false);
    resetCustomBuilderForm();
  };

  const selectSavedCustomStyle = (item: SavedCustomStyleFromImage) => {
    dispatch(
      applyCustomStyleFromImage({
        id: item.id,
        label: item.label,
        directive: item.directive,
      }),
    );
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const dismissible = !customAnalyzing;

  const popupContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xl p-3 sm:p-6"
        onClick={dismissible ? onClose : undefined}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        aria-busy={customAnalyzing || undefined}
      >
        <div
          className="relative flex h-[90vh] w-full max-w-8xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] shadow-[0_32px_120px_rgba(0,0,0,0.8)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-7">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                Choose Style
              </h2>
              <p className="text-xs text-white/30 font-medium uppercase tracking-widest mt-1">Select a style, or build one from a reference image (vision)</p>
            </div>
            <button
              type="button"
              onClick={dismissible ? onClose : undefined}
              disabled={!dismissible}
              title={customAnalyzing ? 'Wait for analysis to finish' : 'Close'}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white ${!dismissible ? 'cursor-not-allowed opacity-40 hover:border-white/10 hover:bg-white/[0.03]' : ''}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Category Tabs + Indian Filters */}
          <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-white/[0.02] px-5 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCategory('general')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === 'general'
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                General Styles
              </button>
              <button
                onClick={() => setActiveCategory('indian')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === 'indian'
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                Indian Styles
              </button>
            </div>

            {activeCategory === 'indian' && (
              <StyleFiltersBar
                searchValue={indianSearchQuery}
                onSearchChange={setIndianSearchQuery}
                stateValue={indianStateFilter}
                onStateChange={setIndianStateFilter}
                stateOptions={indianStateFilterOptions}
                stateClassName="w-[180px]"
                typeValue={indianTypeFilter}
                onTypeChange={setIndianTypeFilter}
                typeOptions={indianTypeFilterOptions}
                typeClassName="w-[180px]"
              />
            )}
          </div>

          {/* Styles Grid or custom builder */}
          <div className="custom-scrollbar flex-1 min-h-[65vh] overflow-y-auto p-4 sm:p-6 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar]:w-1.5">
            {activeCategory === 'custom' ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {/* Add custom style — same card frame as catalog styles */}
                <div className="group flex flex-col text-left">
                  <div
                    className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-[#18181f] transition-all ${
                      customPlusExpanded
                        ? 'border-white/25'
                        : 'border-dashed border-white/20 hover:border-white/30'
                    }`}
                  >
                    {!customPlusExpanded ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPlusExpanded(true);
                          setCustomError(null);
                        }}
                        className="absolute inset-0 flex items-center justify-center text-white/40 transition hover:bg-white/[0.04] hover:text-white/75"
                        aria-label="Add custom style"
                      >
                        <Plus className="h-11 w-11 sm:h-14 sm:w-14" strokeWidth={1.25} />
                      </button>
                    ) : (
                      <div className="relative flex h-full min-h-0 w-full flex-col">
                        <button
                          type="button"
                          onClick={
                            customAnalyzing
                              ? undefined
                              : () => {
                                  setCustomPlusExpanded(false);
                                  setCustomError(null);
                                }
                          }
                          disabled={customAnalyzing}
                          title={customAnalyzing ? 'Wait for analysis to finish' : 'Close'}
                          className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/70 transition hover:bg-black/80 hover:text-white ${customAnalyzing ? 'cursor-not-allowed opacity-40' : ''}`}
                          aria-label="Close"
                        >
                          <X size={14} />
                        </button>
                        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 pt-9 [scrollbar-width:thin]">
                          <input
                            ref={customFileInputRef}
                            type="file"
                            accept="image/*"
                            className="w-full text-[10px] text-white/70 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-black"
                            onChange={(e) =>
                              onCustomFile(e.target.files?.[0] ?? null)
                            }
                          />
                          <input
                            value={customDraftName}
                            onChange={(e) => setCustomDraftName(e.target.value)}
                            placeholder="Style name"
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/25"
                          />
                          <button
                            type="button"
                            disabled={!customDataUrl || customAnalyzing}
                            onClick={() => void runCustomAnalysis()}
                            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-black disabled:opacity-40"
                          >
                            {customAnalyzing ? 'Analyzing…' : 'Analyze'}
                          </button>
                          {customDraftDirective.trim() ? (
                            <button
                              type="button"
                              onClick={saveCustomStyleFromBuilder}
                              className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-500"
                            >
                              Save style
                            </button>
                          ) : null}
                          {customError ? (
                            <p className="text-[10px] leading-snug text-red-400">
                              {customError}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {savedCustomStylesFromImage.map((item: SavedCustomStyleFromImage) => {
                    const isSelected =
                      currentStyle === CUSTOM_STYLE_FROM_IMAGE_ID &&
                      customStyleFromImage?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectSavedCustomStyle(item)}
                        className="group flex flex-col text-left transition-all hover:-translate-y-1"
                      >
                        <div
                          className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border ${
                            isSelected
                              ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                              : 'border-white/10'
                          } bg-[#18181f] transition-all group-hover:border-white/20`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewDataUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                            <div className="min-w-0 flex-1 flex flex-col">
                              <div
                                className="text-[16px] font-bold uppercase leading-tight tracking-wider text-white sm:text-[20px] line-clamp-2"
                                style={{
                                  fontFamily:
                                    "var(--font-bebas-neue), 'Bebas Neue', sans-serif",
                                }}
                              >
                                {item.label}
                              </div>
                              <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/85">
                                Custom
                              </div>
                              <div className="mt-0.5 text-[9px] leading-snug text-white/50 line-clamp-2">
                                {item.directive}
                              </div>
                            </div>
                            {isSelected ? (
                              <div className="mb-1 ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="white"
                                >
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                })}
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {allStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => handleStyleSelect(style.value)}
                  className="group flex flex-col text-left transition-all hover:-translate-y-1"
                >
                  <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border ${currentStyle === style.value ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10'} bg-[#18181f] transition-all group-hover:border-white/20`}>
                    <StylePreviewImage src={style.image} alt={style.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div className="flex flex-col">
                        <div className="text-[18px] font-bold uppercase tracking-wider text-white sm:text-[22px]" style={{ fontFamily: "var(--font-bebas-neue), 'Bebas Neue', sans-serif" }}>
                          {style.name}
                        </div>
                        {activeCategory === 'indian' && (
                          <>
                            <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/85">
                              {(style as any).state}
                            </div>
                            <div className="mt-0.5 text-[9px] leading-snug text-white/50 line-clamp-1">
                              {(style as any).description}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Selected Indicator */}
                      {currentStyle === style.value && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mb-1 ml-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>  
      {createPortal(popupContent, document.body)}
    </>
  );
};

// Helper function to get style-specific gradients
const getStyleGradient = (style: string) => {
  const gradients: { [key: string]: string } = {
    realistic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    artistic: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cartoon: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    anime: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    abstract: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    vintage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    minimalist: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    cyberpunk: 'linear-gradient(135deg, #0c0c0c 0%, #ff00ff 50%, #00ffff 100%)'
  };
  return gradients[style] || gradients.realistic;
};

// Icons removed

export default StylePopup;
