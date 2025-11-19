"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from 'next/navigation';
import NextImage from "next/image";
import { ChevronUp } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import RemoveBgPopup from "./RemoveBgPopup";
import EditPopup from "./EditPopup";

import {
  setPrompt,
  generateImages,
  generateMiniMaxImages,
  setUploadedImages,
  setSelectedCharacter,
  addSelectedCharacter,
  removeSelectedCharacter,
  clearSelectedCharacters,
  setSelectedModel,
} from "@/store/slices/generationSlice";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import { runwayGenerate, runwayStatus, bflGenerate, falGenerate, replicateGenerate } from "@/store/slices/generationsApi";
import { toggleDropdown, addNotification } from "@/store/slices/uiSlice";
import {
  loadMoreHistory,
  removeHistoryEntry,
} from "@/store/slices/historySlice";
import useHistoryLoader from '@/hooks/useHistoryLoader';
import axiosInstance from "@/lib/axiosInstance";
import toast from 'react-hot-toast';
import { enhancePromptAPI } from '@/lib/api/geminiApi';
// Frontend history writes removed; rely on backend history service
const updateFirebaseHistory = async (_id: string, _updates: any) => { };
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
// No-op action creators to satisfy existing dispatch calls without affecting store
const updateHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);
const addHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);

// Import the new components
import ModelsDropdown from "./ModelsDropdown";
import ImageCountDropdown from "./ImageCountDropdown";
import FrameSizeDropdown from "./FrameSizeDropdown";
import StyleSelector from "./StyleSelector";
import LucidOriginOptions from "./LucidOriginOptions";
import PhoenixOptions from "./PhoenixOptions";
import FileTypeDropdown from "./FileTypeDropdown";
import ImagePreviewModal from "./ImagePreviewModal";
import UpscalePopup from "./UpscalePopup";
import UploadModal from "./UploadModal";
import CharacterModal, { Character } from "./CharacterModal";
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { getIsPublic } from '@/lib/publicFlag';
import { useGenerationCredits } from "@/hooks/useCredits";
import Image from "next/image";
// Replaced per-page IntersectionObserver with unified bottom scroll pagination
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import InfiniteScrollDebugOverlay, { IOEvent } from '@/components/debug/InfiniteScrollDebugOverlay';

const InputBox = () => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    image: any;
  } | null>(null);
  const [isUpscaleOpen, setIsUpscaleOpen] = useState(false);
  const [isRemoveBgOpen, setIsRemoveBgOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const inputEl = useRef<HTMLTextAreaElement>(null);
  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<HistoryEntry[]>([]);
  
  // Local state to track generation status for button text
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);
  // Local state to track prompt enhancement (loading skeleton)
  const [isEnhancing, setIsEnhancing] = useState(false);
  // Track if we've already shown a Runway base_resp toast to avoid duplicates
  const runwayBaseRespToastShownRef = useRef(false);
  const loadLockRef = useRef(false);

  // Auto-clear local preview after it has completed/failed and backend history refresh kicks in
  useEffect(() => {
    const entry = localGeneratingEntries[0] as any;
    if (!entry) return;
    if (entry.status === 'completed' || entry.status === 'failed') {
      const timer = setTimeout(() => setLocalGeneratingEntries([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [localGeneratingEntries]);

  // Prefill uploaded image and prompt from query params (?image=, ?prompt=, ?sp=, ?model=, ?frame=, ?style=)
  useEffect(() => {
    try {
      const current = new URL(window.location.href);
      const img = current.searchParams.get('image');
      const sp = current.searchParams.get('sp');
      const prm = current.searchParams.get('prompt');
      const mdl = current.searchParams.get('model');
      const frm = current.searchParams.get('frame');
      const sty = current.searchParams.get('style');
      if (sp) {
        const proxied = `/api/proxy/resource/${encodeURIComponent(sp)}`;
        dispatch(setUploadedImages([proxied] as any));
      } else if (img) {
        dispatch(setUploadedImages([img] as any));
      }
      if (prm) dispatch(setPrompt(prm));
      if (mdl) {
        const mapIncomingModel = (m: string): string => {
          if (!m) return m;
          // Normalize known backend → UI mappings
          if (m === 'bytedance/seedream-4') return 'seedream-v4';
          return m;
        };
        dispatch(setSelectedModel(mapIncomingModel(mdl)));
      }
      if (frm) {
        try { (dispatch as any)({ type: 'generation/setFrameSize', payload: frm }); } catch {}
      }
      if (sty) {
        try { (dispatch as any)({ type: 'generation/setStyle', payload: sty }); } catch {}
      }
      // Consume params once so a refresh doesn't keep the image selected
      if (img || prm || sp || mdl || frm || sty) {
        current.searchParams.delete('image');
        current.searchParams.delete('prompt');
        current.searchParams.delete('sp');
        current.searchParams.delete('model');
        current.searchParams.delete('frame');
        current.searchParams.delete('style');
        window.history.replaceState({}, '', current.toString());
      }
    } catch {}
  }, [dispatch, searchParams]);

  // Unified initial load (single guarded request) via custom hook
  const { refresh: refreshHistoryDebounced, refreshImmediate: refreshHistoryImmediate } = useHistoryLoader({ generationType: 'text-to-image', initialLimit: 50 });

  // Helper function to get clean prompt without style
  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, "").trim();
  };

  // Adjust natural language references like "image 4" -> "image 3" (zero-based)
  // Also, if combinedImages and selectedCharacters are provided, replace @Name mentions
  // with the corresponding image index (1-based) that will be sent in uploadedImages.
  const adjustPromptImageNumbers = (text: string, combinedImages?: string[], selectedCharacters?: any[]): string => {
    try {
      let t = String(text || '');

      // If we have combinedImages and selectedCharacters, replace @Name with image N (1-based)
      if (combinedImages && Array.isArray(combinedImages) && selectedCharacters && Array.isArray(selectedCharacters)) {
        const mentionRegex = /@([\w-]+)/g;
        let out = '';
        let lastIndex = 0;
        while ((m = mentionRegex.exec(t))) {
          const matchIndex = m.index as number;
          const name = m[1];
          out += t.slice(lastIndex, matchIndex);
          // find matching character by name
          const char = selectedCharacters.find((c: any) => String(c.name).toLowerCase() === String(name).toLowerCase());
          if (char && char.frontImageUrl) {
            const url = String(char.frontImageUrl);
            const idx = combinedImages.findIndex((u: string) => String(u) === url);
            if (idx >= 0) {
              out += `the character in the image ${idx + 1}`; // 1-based in prompt, will be converted to zero-based below
            } else {
              out += m[0];
            }
          } else {
            out += m[0];
          }
          lastIndex = matchIndex + m[0].length;
        }
        out += t.slice(lastIndex);
        t = out;
      }

      // Now convert any "image N" (1-based) to zero-based indexes expected by some providers
      return t.replace(/\b(image|img)\s*([1-9]\d*)\b/gi, (_m, word, num) => {
        const n = Math.max(0, parseInt(String(num), 10) - 1);
        return `${word} ${n}`;
      });
    } catch {
      return text;
    }
  };

  // Helper function to convert frameSize to Runway ratio format
  const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
    const ratioMap: { [key: string]: string } = {
      "1:1": "1024:1024",
      "16:9": "1920:1080",
      "9:16": "1080:1920",
      "4:3": "1360:768",
      "3:4": "768:1360",
      "3:2": "1440:1080",
      "2:3": "1080:1440",
      "21:9": "1808:768",
      "9:21": "768:1808",
      "16:10": "1680:720",
      "10:16": "720:1680",
    };

    return ratioMap[frameSize] || "1024:1024"; // Default to square if no match
  };

  // Map Runway base_resp.status_code to toast message and severity; return whether to stop polling
  const mapRunwayStatus = (status: any): { shouldStop: boolean; toastType: 'success' | 'error' | 'loading' | 'blank'; message: string } | null => {
    try {
      const base = status && (status.base_resp || (status.data && status.data.base_resp));
      if (!base) return null;
      const code = typeof base.status_code === 'string' ? parseInt(base.status_code, 10) : Number(base.status_code);
      const msg = (base.status_msg as string) || 'Unknown status';
      if (Number.isNaN(code)) return null;
      if (code === 0) return { shouldStop: false, toastType: 'success', message: msg || 'Success' };
      // Non-zero → error/terminal conditions
      switch (code) {
        case 1002: return { shouldStop: true, toastType: 'error', message: 'Rate limited by Runway. Please try again shortly.' };
        case 1004:
        case 2049: return { shouldStop: true, toastType: 'error', message: 'Runway authentication failed. Check API key.' };
        case 1008: return { shouldStop: true, toastType: 'error', message: 'Runway balance insufficient. Please top up your plan.' };
        case 1026: return { shouldStop: true, toastType: 'error', message: 'Prompt blocked due to content safety.' };
        case 2013: return { shouldStop: true, toastType: 'error', message: 'Invalid parameters for Runway request.' };
        default: return { shouldStop: true, toastType: 'error', message: msg || `Runway error (${code}).` };
      }
    } catch { return null; }
  };

  // Runway model-specific allowed ratios (kept in sync with backend validator)
  const RUNWAY_RATIOS_GEN4 = new Set([
    "1920:1080", "1080:1920", "1024:1024", "1360:768", "1080:1080", "1168:880",
    "1440:1080", "1080:1440", "1808:768", "2112:912", "1280:720", "720:1280",
    "720:720", "960:720", "720:960", "1680:720"
  ]);
  const RUNWAY_RATIOS_GEMINI = new Set([
    "1344:768", "768:1344", "1024:1024", "1184:864", "864:1184", "1536:672"
  ]);

  const coerceRunwayRatio = (ratio: string, model: string): string => {
    // Ensure aspect in [0.5, 2] and membership in allowed set for model
    const [wStr, hStr] = ratio.split(":");
    const w = Number(wStr), h = Number(hStr);
    const aspectOk = w > 0 && h > 0 && w / h >= 0.5 && w / h <= 2;
    const allowed = model === "gemini_2.5_flash" ? RUNWAY_RATIOS_GEMINI : RUNWAY_RATIOS_GEN4;
    if (aspectOk && allowed.has(ratio)) return ratio;
    // Fallback to safe square
    return "1024:1024";
  };

  // Helper function to convert frameSize to flux-pro-1.1 dimensions
  const convertFrameSizeToFluxProDimensions = (frameSize: string): { width: number; height: number } => {
    const dimensionMap: { [key: string]: { width: number; height: number } } = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1024, height: 576 }, // 1024 * (9/16) = 576
      "9:16": { width: 576, height: 1024 }, // 1024 * (16/9) = 576
      "4:3": { width: 1024, height: 768 }, // 1024 * (3/4) = 768
      "3:4": { width: 768, height: 1024 }, // 1024 * (4/3) = 768
      "3:2": { width: 1024, height: 672 }, // 1024 * (2/3) = 682, rounded to 672 (multiple of 32)
      "2:3": { width: 672, height: 1008 }, // 672 * (3/2) = 1008
      "21:9": { width: 1024, height: 438 }, // 1024 * (9/21) = 438, rounded to 448 (multiple of 32)
      "9:21": { width: 448, height: 1024 }, // 448 * (21/9) = 1024
      "16:10": { width: 1024, height: 640 }, // 1024 * (10/16) = 640
      "10:16": { width: 640, height: 1024 }, // 640 * (16/10) = 1024
    };

    // Ensure dimensions are within API limits and multiples of 32
    const dimensions = dimensionMap[frameSize] || { width: 1024, height: 1024 };

    // Clamp to API limits: 256 <= x <= 1440, must be multiple of 32
    const clampToLimits = (value: number): number => {
      const clamped = Math.max(256, Math.min(1440, Math.round(value / 32) * 32));
      console.log(`Dimension ${value} clamped to ${clamped} (multiple of 32, within 256-1440 range)`);
      return clamped;
    };

    const result = {
      width: clampToLimits(dimensions.width),
      height: clampToLimits(dimensions.height)
    };

    console.log(`Frame size ${frameSize} converted to dimensions:`, result);
    console.log(`API compliance check: width=${result.width} (${result.width % 32 === 0 ? '✓ multiple of 32' : '✗ not multiple of 32'}), height=${result.height} (${result.height % 32 === 0 ? '✓ multiple of 32' : '✗ not multiple of 32'})`);
    console.log(`Range check: width=${result.width} (${result.width >= 256 && result.width <= 1440 ? '✓ in range 256-1440' : '✗ out of range'}), height=${result.height} (${result.height >= 256 && result.height <= 1440 ? '✓ in range 256-1440' : '✗ out of range'})`);
    return result;
  };
  

  // Copy prompt to clipboard (used on hover overlay)
  const copyPrompt = async (e: React.MouseEvent, text: string) => {
    try {
      console.log("beti")
      e.stopPropagation();
      e.preventDefault();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      (await import('react-hot-toast')).default.success('Prompt copied');
    } catch {
      try {
        (await import('react-hot-toast')).default.error('Failed to copy');
      } catch {}
    }
  };

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteImage = async (e: React.MouseEvent, entry: HistoryEntry) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
      toast.success('Image deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete generation');
    }
  };

  // Normalize frontend proxy URLs to absolute public URLs for provider APIs
  const toAbsoluteFromProxy = (url: string): string => {
    try {
      if (!url) return url;
      if (url.startsWith('data:')) return url;
      const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
      const RESOURCE_SEG = '/api/proxy/resource/';
      if (url.startsWith(RESOURCE_SEG)) {
        const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));
        return `${ZATA_PREFIX}${decoded}`;
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const u = new URL(url);
        if (u.pathname.startsWith(RESOURCE_SEG)) {
          const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));
          return `${ZATA_PREFIX}${decoded}`;
        }
      }
      return url;
    } catch { return url; }
  };

  // Fetch only first page on mount; further pages load on scroll
  // Replace legacy refresh helpers with hook-driven variants (wrapped with cooldown guard)
  const rawRefreshHistory = () => refreshHistoryDebounced();
  const refreshAllHistory = () => refreshHistoryImmediate();
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_COOLDOWN_MS = 2000; // suppress clustered refreshes that follow a generation completion
  const refreshHistory = () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < REFRESH_COOLDOWN_MS) return; // skip redundant refresh within cooldown
    lastRefreshTimeRef.current = now;
    rawRefreshHistory();
  };

  // Redux state
  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "flux-dev"
  );
  const imageCount = useAppSelector(
    (state: any) => state.generation?.imageCount || 1
  );
  const frameSize = useAppSelector(
    (state: any) => state.generation?.frameSize || "1:1"
  );
  const style = useAppSelector(
    (state: any) => state.generation?.style || "realistic"
  );
  // Lucid Origin and Phoenix 1.0 options
  const lucidStyle = useAppSelector((state: any) => state.generation?.lucidStyle || 'none');
  const lucidContrast = useAppSelector((state: any) => state.generation?.lucidContrast || 'medium');
  const lucidMode = useAppSelector((state: any) => state.generation?.lucidMode || 'standard');
  const lucidPromptEnhance = useAppSelector((state: any) => state.generation?.lucidPromptEnhance || false);
  const phoenixStyle = useAppSelector((state: any) => state.generation?.phoenixStyle || 'none');
  const phoenixContrast = useAppSelector((state: any) => state.generation?.phoenixContrast || 'medium');
  const phoenixMode = useAppSelector((state: any) => state.generation?.phoenixMode || 'fast');
  const phoenixPromptEnhance = useAppSelector((state: any) => state.generation?.phoenixPromptEnhance || false);
  const outputFormat = useAppSelector((state: any) => state.generation?.outputFormat || 'jpeg');
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown
  );
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const [page, setPage] = useState(1);

  // Seedream-specific UI state
  const [seedreamSize, setSeedreamSize] = useState<'1K' | '2K' | '4K' | 'custom'>('2K');
  const [seedreamWidth, setSeedreamWidth] = useState<number>(2048);
  const [seedreamHeight, setSeedreamHeight] = useState<number>(2048);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null); // retained for optional debug overlay
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false); // legacy reference (no longer used by IO, kept for compatibility)
  // Block pagination while generation finishes & initial history refresh occurs
  const postGenerationBlockRef = useRef(false);
  // Debug event storage removed; bottom scroll pagination doesn't emit IO events

  // Memoize the filtered entries and group by date
  const historyEntries = useAppSelector(
    (state: any) => {
      const allEntries = state.history?.entries || [];
      // Show all text-to-image generations; normalize underscores/hyphens and case
      const normalize = (t?: string) => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
      const filteredEntries = allEntries.filter((entry: any) => normalize(entry.generationType) === 'text-to-image');
      console.log('🖼️ Image Generation - All entries:', allEntries.length);
      console.log('🖼️ Image Generation - Filtered entries:', filteredEntries.length);
      console.log('🖼️ Image Generation - Current page:', page);
      console.log('🖼️ Image Generation - Has more:', hasMore);
      return filteredEntries;
    },
    // Use shallowEqual to prevent unnecessary rerenders
    shallowEqual
  );

  // Sentinel element at bottom of list (place near end of render)

  // Group entries by date
  const groupedByDate = historyEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );
  // Today key in the same format used for grouping
  const todayKey = new Date().toDateString();
  const uploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || []
  );
  const selectedCharacters = useAppSelector(
    (state: any) => state.generation?.selectedCharacters || []
  );

  // ContentEditable approach for inline character tags (like Cursor)
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  
  // Function to update contentEditable with tags
  const updateContentEditable = React.useCallback(() => {
    if (!contentEditableRef.current || isUpdatingRef.current) return;
    
    const div = contentEditableRef.current;
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    
    // Save cursor position
    let cursorOffset = 0;
    if (range && div.contains(range.startContainer)) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(div);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorOffset = preCaretRange.toString().length;
    }
    
    isUpdatingRef.current = true;
    
    // Clear and rebuild content
    div.innerHTML = '';
    
    // If no prompt and no characters, leave empty
    if (!prompt && selectedCharacters.length === 0) {
      isUpdatingRef.current = false;
      return;
    }
    
  // Parse prompt and create nodes
  let parts: Array<{ type: 'text' | 'tag'; content: string; character?: any }> = [];
    let lastIndex = 0;
    
    // Find all @references in the prompt
    const refMatches = Array.from(prompt.matchAll(/@(\w+)/gi)) as RegExpMatchArray[];
    
    refMatches.forEach((match) => {
      const matchIndex = match.index!;
      const refName = match[1];
      const character = selectedCharacters.find((char: any) => 
        char.name.toLowerCase() === refName.toLowerCase()
      );

      if (character && matchIndex >= lastIndex) {
        // Add text before reference
        if (matchIndex > lastIndex) {
          const textBefore = prompt.substring(lastIndex, matchIndex);
          if (textBefore) {
            parts.push({ type: 'text', content: textBefore });
          }
        }
        // Add reference tag
        parts.push({ type: 'tag', content: match[0], character });
        lastIndex = matchIndex + match[0].length;
      }
    });

    // Add remaining text
    if (lastIndex < prompt.length) {
      const textAfter = prompt.substring(lastIndex);
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter });
      }
    }

    // If no parts and we have text, add it as text
    if (parts.length === 0 && prompt) {
      parts.push({ type: 'text', content: prompt });
    }

    // If there are selected characters but no explicit @tags in the prompt,
    // prepend the selected characters as visible tags so users always see
    // the attached characters in the contentEditable area (like Freepik).
    // This lets users type anywhere while the tags remain present.
    const hasTagParts = parts.some(p => p.type === 'tag');
    if (selectedCharacters && selectedCharacters.length > 0 && !hasTagParts) {
      const leadingTags = selectedCharacters.map((char: any) => ({ type: 'tag' as const, content: `@${char.name}`, character: char }));
      parts = [...leadingTags, ...parts];
    }

    // Build DOM nodes
    parts.forEach((part) => {
      if (part.type === 'tag' && part.character) {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'character-tag group relative inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded text-blue-300 text-sm font-medium hover:bg-blue-500/30 transition-colors mx-0.5';
        tagSpan.contentEditable = 'false';
        tagSpan.style.display = 'inline-flex';
        tagSpan.style.verticalAlign = 'baseline';
        tagSpan.setAttribute('data-character-id', part.character.id);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `@${part.character.name}`;
        tagSpan.appendChild(nameSpan);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-blue-200 hover:text-white';
        removeBtn.type = 'button';
        removeBtn.contentEditable = 'false';
        removeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          removeCharacterReference(part.character.name);
        };
        tagSpan.appendChild(removeBtn);
        
        div.appendChild(tagSpan);
      } else {
        const textNode = document.createTextNode(part.content);
        div.appendChild(textNode);
      }
    });
    
    // Restore cursor position
    if (range && cursorOffset > 0) {
      try {
        const walker = document.createTreeWalker(
          div,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let currentPos = 0;
        let node;
        while (node = walker.nextNode()) {
          const nodeLength = node.textContent?.length || 0;
          if (currentPos + nodeLength >= cursorOffset) {
            const newRange = document.createRange();
            newRange.setStart(node, Math.min(cursorOffset - currentPos, nodeLength));
            newRange.setEnd(node, Math.min(cursorOffset - currentPos, nodeLength));
            selection?.removeAllRanges();
            selection?.addRange(newRange);
            break;
          }
          currentPos += nodeLength;
        }
      } catch (e) {
        // Ignore cursor restoration errors
      }
    }
    
    // Adjust height
    div.style.height = 'auto';
    div.style.height = Math.min(div.scrollHeight, 96) + 'px';
    
    setTimeout(() => { isUpdatingRef.current = false; }, 50);
  }, [prompt, selectedCharacters]);

  // Ensure contentEditable is synced whenever prompt or selected characters change
  useEffect(() => {
    // Defer to next tick to avoid interfering with other layout tasks
    setTimeout(() => {
      try {
        updateContentEditable();
      } catch (e) {
        // ignore
      }
    }, 0);
  }, [prompt, selectedCharacters, updateContentEditable]);

  // Helper function to combine uploadedImages with selectedCharacters images
  // Maps @references in prompt to character images in the correct order
  const getCombinedUploadedImages = (): string[] => {
    const result: string[] = [];
    const added = new Set<string>();

    // 1) Add character images in the order they are mentioned in the prompt (@Name)
    try {
      const mentionRegex = /@([\w-]+)/g;
      const seenNames = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = mentionRegex.exec(prompt))) {
        const name = m[1];
        if (seenNames.has(name.toLowerCase())) continue; // skip duplicate mentions
        seenNames.add(name.toLowerCase());
        const char = (selectedCharacters || []).find((c: any) => String(c.name).toLowerCase() === name.toLowerCase());
        if (char && char.frontImageUrl) {
          const url = String(char.frontImageUrl);
          if (!added.has(url)) {
            result.push(url);
            added.add(url);
          }
        }
      }
    } catch (e) {
      // fall back to simple behavior below
    }

    // 2) Append any selected character images that weren't mentioned (preserve selection order)
    (selectedCharacters || []).forEach((c: any) => {
      const url = c?.frontImageUrl;
      if (url && !added.has(url)) {
        result.push(String(url));
        added.add(String(url));
      }
    });

    // 3) Append other uploaded images (user-uploaded) that are not already included
    (uploadedImages || []).forEach((u: string) => {
      try {
        const url = String(u);
        if (url && !added.has(url)) {
          result.push(url);
          added.add(url);
        }
      } catch { /* ignore */ }
    });

    return result;
  };

  // Function to remove character reference (removes from selectedCharacters)
  const removeCharacterReference = (characterName: string) => {
    // Remove the character from selectedCharacters and clean up any @mentions
    try {
      const character = (selectedCharacters || []).find((char: any) => String(char.name).toLowerCase() === String(characterName).toLowerCase());
      if (character) {
        dispatch(removeSelectedCharacter(character.id));
      }

      // Helper to escape special chars for regex
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');

      // Remove any @characterName occurrences from the prompt (case-insensitive)
      // Be liberal in matching so we also remove trailing punctuation like commas/periods
      const nameEsc = escapeRegExp(String(characterName));
      // Match @Name followed by optional non-word punctuation (e.g. @Name, @Name.) or end of string
      const regex = new RegExp(`@${nameEsc}(?:[^\\w]|$)`, 'gi');
      if (prompt && regex.test(prompt)) {
        const newPrompt = prompt.replace(regex, ' ').trim().replace(/\s+/g, ' ');
        dispatch(setPrompt(newPrompt));
      }

      // Also remove any leftover plain-text @mentions inside the contentEditable DOM
      // (This handles cases where the DOM contains a text node like "@Name" that didn't come from prompt)
      setTimeout(() => {
        try {
          const div = contentEditableRef.current;
          if (div) {
            const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
            const nodesToRemove: Node[] = [];
            const nodesToTrim: { node: Text; value: string }[] = [];
            let node: Node | null = walker.nextNode();
            while (node) {
              // If element is a character-tag with matching data-character-id, remove it
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.classList && el.classList.contains('character-tag')) {
                  const dataId = el.getAttribute('data-character-id');
                  if (character && dataId && String(dataId) === String(character.id)) {
                    nodesToRemove.push(el);
                  }
                }
              }

              // If it's a text node containing the literal @name, trim/remove it
              if (node.nodeType === Node.TEXT_NODE) {
                const txt = node.nodeValue || '';
                // Liberal match inside text nodes (handle trailing punctuation)
                const re = new RegExp(`@${nameEsc}(?:[^\\w]|$)`, 'i');
                if (re.test(txt)) {
                  // If the text node is mostly the mention, remove it entirely
                  if (txt.trim().toLowerCase().replace(/[^\w@]/g, '') === `@${String(characterName).toLowerCase().replace(/[^\w]/g, '')}`) {
                    nodesToRemove.push(node);
                  } else {
                    // Otherwise remove just the mention substring
                    const newVal = txt.replace(re, ' ').replace(/\s+/g, ' ');
                    nodesToTrim.push({ node: node as Text, value: newVal });
                  }
                }
              }

              node = walker.nextNode();
            }

            nodesToRemove.forEach(n => n.parentNode?.removeChild(n));
            nodesToTrim.forEach(t => t.node.nodeValue = t.value);

            // After DOM manip, force the controlled content to re-sync
            updateContentEditable();
            // Keep focus on the contentEditable for UX continuity
            div.focus();
          }
        } catch (e) {
          // ignore DOM cleanup errors
        }
      }, 50);
    } catch (e) {
      // swallow to avoid breaking UI
    }
  };

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits('image', selectedModel, {
    frameSize,
    count: imageCount,
  });

  // Function to clear input after successful generation
  // Note: Selected characters are NOT cleared - they remain like the prompt
  const clearInputs = () => {
    dispatch(setUploadedImages([]));
    // Don't clear selectedCharacters - they should remain like the prompt
    // dispatch(clearSelectedCharacters());
    // Reset file input
    if (inputEl.current) {
      inputEl.current.value = "";
    }
  };

  // Function to auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Auto-adjust height when prompt changes
  useEffect(() => {
    if (inputEl.current) {
      adjustTextareaHeight(inputEl.current);
    }
  }, [prompt]);



  // Bottom scroll pagination (History page style) with added post-load safeguards
  const { userScrolledRef } = useBottomScrollPagination({
    containerRef: scrollRootRef,
    hasMore,
    loading,
    loadMore: async () => {
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        await (dispatch as any)(loadMoreHistory({
          filters: { generationType: 'text-to-image' },
          paginationParams: { limit: 10 }
        })).unwrap();
      } catch (e: any) {
        // swallow non-critical errors; backend handles end-of-pagination
      }
    },
    bottomOffset: 800,
    throttleMs: 250, // slightly higher throttle for heavier image grid
    requireUserScroll: true,
    requireScrollAfterLoad: true, // demand a real user scroll before another auto-trigger
    postLoadCooldownMs: 1200, // suppress layout-driven immediate re-triggers
    blockLoadRef: postGenerationBlockRef, // hard block during generation completion window
  });

  // IntersectionObserver removed; relying solely on bottom scroll pagination above.

  // Removed legacy proactive loaders (scroll proximity, viewport deficiency, auto-fill loop)
  // to prevent uncontrolled pagination bursts. IntersectionObserver above is now the sole
  // trigger for pagination, honoring user scroll intent and existing hasMore/loading guards.
  // If future UX requires prefetch, implement a lightweight, single-fire prefetch with strict
  // cooldown and visibility metrics rather than looping effects.

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const originalPrompt = prompt;
    let finalPrompt = originalPrompt;

    // If prompt-enhance toggles are enabled for the selected model(s), call the backend enhancer first
    if ((lucidPromptEnhance || phoenixPromptEnhance) && !isEnhancing) {
      try {
        setIsEnhancing(true);
        const res = await enhancePromptAPI(originalPrompt, selectedModel as any);
        if (res && res.ok && res.enhancedPrompt) {
          finalPrompt = res.enhancedPrompt;
          // Update the UI prompt with the enhanced version
          try { dispatch(setPrompt(finalPrompt)); } catch {}
        } else {
          // Non-fatal: show an error but continue with original prompt
          if (res && res.error) toast.error(res.error);
        }
      } catch (e) {
        console.error('Prompt enhancement failed:', e);
        toast.error('Prompt enhancement failed');
      } finally {
        setIsEnhancing(false);
      }
    }

    // Engage pagination block; prevents scroll-triggered load bursts while generation runs & history updates
    postGenerationBlockRef.current = true;

    // Set local generation state immediately
    setIsGeneratingLocally(true);

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
    } catch (creditError: any) {
      toast.error(creditError.message || 'Insufficient credits for generation');
      return;
    }

    // Create a local history-style loading entry that mirrors the Logo flow
    const tempEntryId = `loading-${Date.now()}`;
    const tempEntry: HistoryEntry = {
      id: tempEntryId,
      prompt: finalPrompt,
      model: selectedModel,
      generationType: 'text-to-image',
      frameSize: frameSize || undefined,
      aspect_ratio: frameSize || undefined,
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: '',
        originalUrl: ''
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: 'generating'
    } as any;
    setLocalGeneratingEntries([tempEntry]);

    // No local writes to global history; backend tracks persistent history

    let firebaseHistoryId: string | undefined;
    // Read isPublic from backend policy (fallbacks handled internally)
    const isPublic = await getIsPublic();

    try {
      // Check if it's a Runway model
      const isRunwayModel = selectedModel.startsWith("gen4_image");
      // Check if it's a MiniMax model
      const isMiniMaxModel = selectedModel === "minimax-image-01";

      if (isRunwayModel) {
        console.log('🚀 ENTERING RUNWAY GENERATION SECTION');
        console.log('=== STARTING RUNWAY GENERATION ===');
        console.log('Selected model:', selectedModel);
        console.log('Image count:', imageCount);
        console.log('Frame size:', frameSize);
        console.log('Style:', style);
        console.log('Uploaded images count:', uploadedImages.length);

        // 🔥 FIREBASE SAVE FLOW FOR RUNWAY MODELS:
        // 1. Create initial Firebase entry with 'generating' status
        // 2. Update Firebase with progress as images complete
        // 3. Update Firebase with final 'completed' or 'failed' status
        // 4. All updates include images, metadata, and status
        // 5. Error handling updates both Redux and Firebase
        // 6. Firebase ID is used consistently throughout the process

        try {
          firebaseHistoryId = await saveHistoryEntry({
            prompt: prompt,
            model: selectedModel,
            generationType: "text-to-image",
            images: [],
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: imageCount,
            status: 'generating',
            frameSize,
            style
          });
          console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);
          console.log('🔗 Firebase document path: generationHistory/' + firebaseHistoryId);

          // Update the local entry with the Firebase ID
          // dispatch(updateHistoryEntry({
          //   id: loadingEntry.id,
          //   updates: { id: firebaseHistoryId }
          // }));

          // Don't modify the loadingEntry object - use firebaseHistoryId directly
          console.log('Using Firebase ID for all operations:', firebaseHistoryId);
        } catch (firebaseError) {
          console.error('❌ Failed to save to Firebase:', firebaseError);
          console.error('Firebase error details:', {
            message: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
            stack: firebaseError instanceof Error ? firebaseError.stack : 'No stack trace'
          });
          toast.error('Failed to save generation to history');
          return;
        }

        // Validate gen4_image_turbo requires at least one reference image
        console.log('🔍 ABOUT TO START VALIDATION');
        console.log('=== VALIDATING RUNWAY REQUIREMENTS ===');
        console.log('Selected model:', selectedModel);
        console.log('Uploaded images count:', uploadedImages.length);
        console.log('Uploaded images:', uploadedImages);
        console.log('Is gen4_image_turbo:', selectedModel === "gen4_image_turbo");
        console.log('Has uploaded images:', uploadedImages.length > 0);
        console.log('Validation condition:', selectedModel === "gen4_image_turbo" && uploadedImages.length === 0);

        if (
          selectedModel === "gen4_image_turbo" &&
          uploadedImages.length === 0
        ) {
          console.log('❌ VALIDATION FAILED: gen4_image_turbo requires reference image');
          console.log('Stopping generation process...');

          // Update Firebase entry to failed status
          try {
            await updateFirebaseHistory(firebaseHistoryId!, {
              status: "failed",
              error: "gen4_image_turbo requires at least one reference image"
            });
            console.log('✅ Firebase entry updated to failed status');
          } catch (firebaseError) {
            console.error('❌ Failed to update Firebase entry:', firebaseError);
          }

          // Remove the loading entry since validation failed
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId!,
          //     updates: {
          //       status: "failed",
          //       error: "gen4_image_turbo requires at least one reference image"
          //     },
          //   })
          // );

          dispatch(
            addNotification({
              type: "error",
              message: "gen4_image_turbo requires at least one reference image",
            })
          );
          return;
        }

        console.log('✅ VALIDATION PASSED: Proceeding with Runway generation');
        console.log('🎯 VALIDATION COMPLETED - MOVING TO NEXT STEP');

        // Additional safety check
        if (selectedModel === "gen4_image_turbo" && uploadedImages.length === 0) {
          console.error('🚨 SAFETY CHECK FAILED: This should not happen!');
          throw new Error('Validation bypassed unexpectedly');
        }

        // Convert frameSize to Runway ratio format
        let ratio = convertFrameSizeToRunwayRatio(frameSize);
        ratio = coerceRunwayRatio(ratio, selectedModel);
        console.log('Converted frame size to Runway ratio:', ratio);

        // For Runway, support multiple images by creating parallel tasks
        const totalToGenerate = Math.min(imageCount, 4);
        let currentImages = [...uploadedImages]; // Start with uploaded images
        let completedCount = 0;
        let anyFailures = false;

        console.log('Total images to generate:', totalToGenerate);
        console.log('Initial currentImages array:', currentImages);

        // Update initial progress
        // dispatch(
        //   updateHistoryEntry({
        //     id: firebaseHistoryId!,
        //     updates: {
        //       generationProgress: {
        //         current: 0,
        //         total: totalToGenerate * 100,
        //         status: `Starting Runway generation for ${totalToGenerate} image(s)...`,
        //       },
        //     },
        //   })
        // );

        // Create all generation tasks in parallel
        const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
          try {
            console.log(`Starting Runway generation for image ${index + 1}/${totalToGenerate}`);

            // Make direct API call to avoid creating multiple history entries
            console.log(`=== MAKING RUNWAY API CALL FOR IMAGE ${index + 1} ===`);
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const combinedImages = getCombinedUploadedImages();
            console.log('API payload:', {
              promptText: `${promptAdjusted} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImagesCount: combinedImages.length,
              style,
              existingHistoryId: firebaseHistoryId
            });
            const result = await dispatch(runwayGenerate({
              promptText: `${promptAdjusted} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImages: combinedImages,
              style,
              existingHistoryId: firebaseHistoryId,
              isPublic
            })).unwrap();
            console.log(`Runway API call completed for image ${index + 1}, taskId:`, result.taskId);

            // Poll via backend status route; stop on completion or terminal error
            let imageUrl: string | undefined;
            let terminalError: string | undefined;
            let baseRespToastShown = false;
            for (let attempts = 0; attempts < 360; attempts++) {
              const status = await dispatch(runwayStatus(result.taskId)).unwrap();
              // Capture backend historyId if frontend one wasn't created
              if (!firebaseHistoryId && status?.historyId) {
                firebaseHistoryId = status.historyId;
              }
              // If provider returned base_resp codes, handle and stop as needed
              const mapped = mapRunwayStatus(status);
              if (mapped && mapped.shouldStop) {
                terminalError = mapped.message;
                if (mapped.toastType === 'error' && !runwayBaseRespToastShownRef.current && !baseRespToastShown) {
                  toast.error(mapped.message);
                  runwayBaseRespToastShownRef.current = true;
                  baseRespToastShown = true;
                }
                // Stop loader immediately
                setLocalGeneratingEntries(prev => prev.map(e => ({ ...e, status: 'failed' as any })));
                setIsGeneratingLocally(false);
                break;
              }
              // Also stop on explicit failure/cancelled statuses from backend/provider
              const s = String(status?.status || '').toUpperCase();
              if (s === 'FAILED' || s === 'CANCELLED' || s === 'THROTTLED') {
                terminalError = (status?.failure as string) || 'Runway task did not complete';
                if (!runwayBaseRespToastShownRef.current) toast.error(terminalError);
                setLocalGeneratingEntries(prev => prev.map(e => ({ ...e, status: 'failed' as any })));
                setIsGeneratingLocally(false);
                break;
              }
              if (status?.status === 'completed' && Array.isArray(status?.images) && status.images.length > 0) {
                imageUrl = status.images[0]?.url || status.images[0]?.originalUrl;
                break;
              }
              await new Promise(res => setTimeout(res, 1000));
            }
            if (!imageUrl) throw new Error(terminalError || 'Runway generation did not complete in time');

            // Process the completed image
            if (imageUrl) {
              console.log(`Image ${index + 1} completed with URL:`, imageUrl);

              // Create a new array copy instead of modifying the existing one
              const newImages = [...currentImages];
              newImages[index] = {
                id: `${result.taskId}-${index}`,
                url: imageUrl,
                originalUrl: imageUrl
              };

              // Update the reference to use the new array
              currentImages = newImages;
              completedCount++;

              console.log(`Updated currentImages array:`, currentImages);
              console.log(`Completed count:`, completedCount);

              // Upload the image to Firebase Storage
              console.log(`Uploading image ${index + 1} to Firebase Storage...`);
              try {
                const uploadedImage = await uploadGeneratedImage(newImages[index]);
                console.log(`Image ${index + 1} uploaded to Firebase:`, uploadedImage);

                // Update the image with Firebase URL
                newImages[index] = uploadedImage;
                currentImages = newImages;

                // Update the history entry with the new image and Firebase URL
                // dispatch(
                //   updateHistoryEntry({
                //     id: firebaseHistoryId!,
                //     updates: {
                //       images: currentImages,
                //       frameSize: ratio,
                //       generationProgress: {
                //         current: completedCount * 100,
                //         total: totalToGenerate * 100,
                //         status: `Completed ${completedCount}/${totalToGenerate} images`,
                //       },
                //     },
                //   })
                // );

                // 🔥 CRITICAL FIX: Update Firebase with completed image
                try {
                  await updateFirebaseHistory(firebaseHistoryId!, {
                    images: currentImages,
                    frameSize: ratio,
                    generationProgress: {
                      current: completedCount * 100,
                      total: totalToGenerate * 100,
                      status: `Completed ${completedCount}/${totalToGenerate} images`,
                    },
                  });
                  console.log(`✅ Firebase updated with image ${index + 1}`);
                  await refreshHistory();
                } catch (firebaseError) {
                  console.error(`❌ Failed to update Firebase with image ${index + 1}:`, firebaseError);
                }
              } catch (uploadError) {
                console.error(`Failed to upload image ${index + 1} to Firebase:`, uploadError);
                // Continue with the original URL if upload fails
                // dispatch(
                //   updateHistoryEntry({
                //     id: firebaseHistoryId!,
                //     updates: {
                //       images: currentImages,
                //       frameSize: ratio,
                //       generationProgress: {
                //         current: completedCount * 100,
                //         total: totalToGenerate * 100,
                //         status: `Completed ${completedCount}/${totalToGenerate} images (Firebase upload failed)`,
                //       },
                //     },
                //   })
                // );
              }
            } else {
              console.error(`No image URL returned for image ${index + 1}`);
            }

            return { success: true, index, imageUrl };
          } catch (error) {
            console.error(`Runway generation failed for image ${index + 1}:`, error);
            anyFailures = true;
            if (!runwayBaseRespToastShownRef.current) {
              toast.error(`Failed to generate image ${index + 1} with Runway: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            return { success: false, index, error };
          }
        });

        // Wait for all generations to complete
        console.log('Waiting for all Runway generations to complete...');
        const results = await Promise.allSettled(generationPromises);
        console.log('All Runway generations completed. Results:', results);

        // Count successful generations
        const successfulResults = results.filter(
          (result) => result.status === 'fulfilled' && result.value.success
        );
        console.log('Successful generations:', successfulResults.length);
        console.log('Failed generations:', results.length - successfulResults.length);

        // Finalize entry
        console.log('Finalizing history entry...');
        console.log('Final currentImages:', currentImages);
        console.log('Successful generations:', successfulResults.length);

        // dispatch(
        //   updateHistoryEntry({
        //     id: firebaseHistoryId!,
        //     updates: {
        //       status: successfulResults.length > 0 ? "completed" : "failed",
        //       timestamp: new Date().toISOString(),
        //       createdAt: new Date().toISOString(),
        //       imageCount: successfulResults.length,
        //       frameSize: ratio,
        //       style,
        //       generationProgress: {
        //         current: successfulResults.length * 100,
        //         total: totalToGenerate * 100,
        //         status: `Completed ${successfulResults.length}/${totalToGenerate} images`,
        //       },
        //     },
        //   })
        // );

        // 🔥 CRITICAL FIX: Update Firebase with final status
        console.log('💾 UPDATING FIREBASE WITH FINAL STATUS...');
        console.log('Final data to update:', {
          status: successfulResults.length > 0 ? "completed" : "failed",
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          firebaseHistoryId
        });

        // 🔍 DEBUG: Check if firebaseHistoryId is valid
        if (!firebaseHistoryId) {
          console.error('❌ CRITICAL ERROR: firebaseHistoryId is undefined!!');
          console.error('This means the Firebase save failed at the beginning');
          return;
        }

        console.log('🔍 DEBUG: firebaseHistoryId is valid:', firebaseHistoryId);
        console.log('🔍 DEBUG: successfulResults.length:', successfulResults.length);
        console.log('🔍 DEBUG: totalToGenerate:', totalToGenerate);

        const finalStatus = successfulResults.length > 0 ? "completed" : "failed" as "completed" | "failed";
        console.log('🔍 DEBUG: Final status to set:', finalStatus);

        const updateData = {
          status: finalStatus,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          generationProgress: {
            current: successfulResults.length * 100,
            total: totalToGenerate * 100,
            status: `Completed ${successfulResults.length}/${totalToGenerate} images`,
          },
        };

        console.log('🔍 DEBUG: Update data being sent to Firebase:', updateData);

        try {
          console.log('🔍 DEBUG: About to call updateFirebaseHistory...');
          console.log('🔍 DEBUG: Function parameters:', { firebaseHistoryId, updateData });

          await updateFirebaseHistory(firebaseHistoryId, updateData);

          console.log('✅ Firebase updated with final status:', finalStatus);
          console.log('🔗 Firebase document updated: generationHistory/' + firebaseHistoryId);

          // 🔍 DEBUG: Verify the update worked by checking Firebase again
          console.log('🔍 DEBUG: Firebase update completed successfully');

          // 🔍 DEBUG: Add a small delay to ensure Firebase has processed the update
          console.log('🔍 DEBUG: Waiting 1 second for Firebase to process update...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔍 DEBUG: Delay completed, Firebase update should be persisted');

        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase with final status:', firebaseError);
          console.error('Firebase update error details:', {
            message: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
            stack: firebaseError instanceof Error ? firebaseError.stack : 'No stack trace'
          });

          // 🔍 DEBUG: Try to understand what went wrong
          console.error('🔍 DEBUG: firebaseHistoryId that failed:', firebaseHistoryId);
          console.error('🔍 DEBUG: Update data that failed:', updateData);
        }

        if (successfulResults.length > 0) {
          console.log('Runway generation completed successfully!');
          
          // Update local preview with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: currentImages.filter(img => img.url),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: successfulResults.length,
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}
          
          toast.success(`Runway generation completed! Generated ${successfulResults.length}/${totalToGenerate} image(s) successfully`);
          clearInputs();
          
          await refreshHistory();

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } else {
          console.log('All Runway generations failed');
          
          // Update local preview to failed status
          setLocalGeneratingEntries((prev) => prev.map((e) => ({
            ...e,
            status: 'failed'
          })));
        }

        console.log('=== RUNWAY GENERATION COMPLETED ===');
      } else if (isMiniMaxModel) {
        // Use MiniMax generation
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const result = await dispatch(
            generateMiniMaxImages({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            aspect_ratio: frameSize,
            imageCount,
            generationType: "text-to-image",
            uploadedImages,
              style
          })
        ).unwrap();

        // MiniMax now returns images directly with Firebase URLs
        // Update the loading entry with completed data
        // dispatch(
        //   updateHistoryEntry({
        //     id: loadingEntry.id,
        //     updates: {
        //       status: 'completed',
        //       images: result.images,
        //       imageCount: result.images.length,
        //       frameSize: result.aspect_ratio || frameSize,
        //       style,
        //       timestamp: new Date().toISOString(),
        //       createdAt: new Date().toISOString()
        //     },
        //   })
        // );

        // Update the local loading entry with completed images
        try {
          const completedEntry: HistoryEntry = {
            ...(localGeneratingEntries[0] || tempEntry),
            id: (localGeneratingEntries[0]?.id || tempEntryId),
            images: result.images,
            status: 'completed',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: result.images.length,
          } as any;
          setLocalGeneratingEntries([completedEntry]);
        } catch {}

        // Show success notification
        toast.success(`MiniMax generation completed! Generated ${result.images.length} image(s)`);
        clearInputs();
        
        await refreshHistory();

        // Handle credit success
        if (transactionId) {
          await handleGenerationSuccess(transactionId);
        }
      } else if (selectedModel === 'gemini-25-flash-image') {
        // FAL Gemini (Nano Banana) immediate generate flow (align with BFL)
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt, // Store original user-entered prompt
            model: selectedModel,
            // New schema: num_images + aspect_ratio
            num_images: imageCount,
            aspect_ratio: frameSize as any,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            output_format: 'jpeg',
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

        toast.success(`Generated ${result.images?.length || 1} image(s) successfully!`);
        clearInputs();
        
        await refreshHistory();

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          console.error('FAL generate failed:', error);

          // Handle credit failure
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }

          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Google Nano Banana');
          return;
        }
      } else if (selectedModel === 'imagen-4-ultra' || selectedModel === 'imagen-4' || selectedModel === 'imagen-4-fast') {
        // Imagen 4 models via FAL generate endpoint
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt, // Store original user-entered prompt
            model: selectedModel,
            aspect_ratio: frameSize as any,
            num_images: imageCount,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            output_format: outputFormat,
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

        toast.success(`Generated ${result.images?.length || 1} image(s) successfully!`);
        clearInputs();
        
        // Keep local entries visible for a moment before refreshing
        setTimeout(() => {
          setLocalGeneratingEntries([]);
        }, 1000);
        
        await refreshHistory();

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Imagen 4');
          return;
        }
      } else if (selectedModel === 'seedream-v4') {
        // Replicate Seedream v4 (supports T2I and I2I with multi-image input)
        try {
          // Build Seedream payload per new schema
          const seedreamAllowedAspect = new Set([
            'match_input_image','1:1','4:3','3:4','16:9','9:16','3:2','2:3','21:9'
          ]);
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: 'bytedance/seedream-4',
            size: seedreamSize,
            aspect_ratio: seedreamAllowedAspect.has(frameSize) ? frameSize : 'match_input_image',
            sequential_image_generation: 'disabled',
            max_images: Math.min(imageCount, 4),
            isPublic,
          };
          if (seedreamSize === 'custom') {
            payload.width = Math.max(1024, Math.min(4096, Number(seedreamWidth) || 2048));
            payload.height = Math.max(1024, Math.min(4096, Number(seedreamHeight) || 2048));
          }
          if (uploadedImages && uploadedImages.length > 0) payload.image_input = uploadedImages.slice(0, 10).map((u: string) => toAbsoluteFromProxy(u));
          const result = await dispatch(replicateGenerate(payload)).unwrap();

          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

        toast.success(`Generated ${result.images?.length || 1} image(s) successfully!`);
        clearInputs();
        
        // Keep local entries visible for a moment before refreshing
        setTimeout(() => {
          setLocalGeneratingEntries([]);
        }, 1000);
        
        await refreshHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Seedream');
          return;
        }
      } else if (selectedModel === 'ideogram-ai/ideogram-v3') {
        // Ideogram v3 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            '1:3','3:1','1:2','2:1','9:16','16:9','10:16','16:10','2:3','3:2','3:4','4:3','4:5','5:4','1:1'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Ideogram v3 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            // Sensible defaults (can be expanded to UI later)
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'ideogram-ai/ideogram-v3-turbo',
              aspect_ratio: aspect,
              // Provide safe defaults accepted by backend validator/model
              resolution: 'None',
              style_type: 'Auto',
              magic_prompt_option: 'Auto',
            };

            // If user provided a reference image, pass a single image (v3 supports I2I prompt image)
            if (uploadedImages && uploadedImages.length > 0) {
              payload.image = toAbsoluteFromProxy(uploadedImages[0]);
            }

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);
          
          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${combinedResult.images?.length || 1} image(s) successfully!`);
          clearInputs();
          
          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);
          
          await refreshHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Ideogram v3');
          return;
        }
      } else if (selectedModel === 'ideogram-ai/ideogram-v3-quality') {
        // Ideogram v3 Quality via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            '1:3','3:1','1:2','2:1','9:16','16:9','10:16','16:10','2:3','3:2','3:4','4:3','4:5','5:4','1:1'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Ideogram v3 Quality doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            // Sensible defaults (can be expanded to UI later)
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'ideogram-ai/ideogram-v3-quality',
              aspect_ratio: aspect,
              // Provide safe defaults accepted by backend validator/model
              resolution: 'None',
              style_type: 'Auto',
              magic_prompt_option: 'Auto',
            };

            // If user provided a reference image, pass a single image (v3 supports I2I prompt image)
            if (uploadedImages && uploadedImages.length > 0) {
              payload.image = toAbsoluteFromProxy(uploadedImages[0]);
            }

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);
          
          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${combinedResult.images?.length || 1} image(s) successfully!`);
          clearInputs();
          
          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);
          
          await refreshHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Ideogram v3 Quality');
          return;
        }
      } else if (selectedModel === 'leonardoai/lucid-origin') {
        // Lucid Origin via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Lucid Origin
          const allowedAspect = new Set([
            '1:1','16:9','9:16','3:2','2:3','4:5','5:4','3:4','4:3','2:1','1:2','3:1','1:3'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Lucid Origin doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'leonardoai/lucid-origin',
              aspect_ratio: aspect,
              // Use Redux state values for Lucid Origin
              style: lucidStyle,
              contrast: lucidContrast,
              generation_mode: lucidMode,
              prompt_enhance: lucidPromptEnhance,
              num_images: 1
            };

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);
          
          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${combinedResult.images?.length || 1} image(s) successfully!`);
          clearInputs();
          
          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);
          
          await refreshHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Lucid Origin');
          return;
        }
      } else if (selectedModel === 'leonardoai/phoenix-1.0') {
        // Phoenix 1.0 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Phoenix 1.0
          const allowedAspect = new Set([
            '1:1','16:9','9:16','3:2','2:3','4:5','5:4','3:4','4:3','2:1','1:2','3:1','1:3'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Phoenix 1.0 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            const payload: any = {
              prompt: `${prompt} [Style: ${style}]`,
              model: 'leonardoai/phoenix-1.0',
              aspect_ratio: aspect,
              // Use Redux state values for Phoenix 1.0
              style: phoenixStyle,
              contrast: phoenixContrast,
              generation_mode: phoenixMode,
              prompt_enhance: phoenixPromptEnhance,
              num_images: 1
            };

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);
          
          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${combinedResult.images?.length || 1} image(s) successfully!`);
          clearInputs();
          
          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);
          
          await refreshHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Phoenix 1.0');
          return;
        }
      } else {
        // Use regular BFL generation OR local models
        const localModels = [
          // Previously integrated local models
          'flux-schnell',
          'stable-medium',
          'stable-large',
          'stable-turbo',
          'stable-xl',
          // Newly added local models
          'flux-krea',
          'playground',
        ];
        const isLocalImageModel = localModels.includes(selectedModel);

        if (isLocalImageModel) {
          // Create Firebase history entry for local models (generating)
          try {
            firebaseHistoryId = await saveHistoryEntry({
              prompt: prompt,
              model: selectedModel,
              generationType: 'text-to-image',
              images: [],
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount,
              status: 'generating',
              frameSize,
              style,
            });
            // Point the temporary loading entry to the Firebase document id
            // dispatch(updateHistoryEntry({ id: loadingEntry.id, updates: { id: firebaseHistoryId } }));
          } catch (e) {
            console.error('Failed to create Firebase history for local model:', e);
          }

          // Call local image generation proxy (server uploads to Firebase)
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(bflGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            n: imageCount,
            frameSize,
            style,
            isPublic,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
          })).unwrap();

          // History is persisted by backend; no local completed entry needed

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId || loadingEntry.id,
          //     updates: completedEntry,
          //   })
          // );

          // Server already finalized Firebase when historyId is provided

          // Show success notification
          toast.success(`Generated ${result.images.length} image${result.images.length > 1 ? 's' : ''} successfully!`);
          clearInputs();
          await refreshHistory();

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } else {
          // Use regular BFL generation
          // Check if this is a flux-pro model that needs width/height conversion
          // Note: flux-pro, flux-pro-1.1, and flux-pro-1.1-ultra use width/height
          // flux-dev uses frameSize conversion (handled in API route)
          const isFluxProModel = selectedModel === "flux-pro-1.1" || selectedModel === "flux-pro-1.1-ultra" || selectedModel === "flux-pro";

          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          let generationPayload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            imageCount,
            frameSize,
            style,
            generationType: "text-to-image",
            uploadedImages: combinedImages,
          };

          // For flux-pro models, convert frameSize to width/height dimensions (but keep frameSize for history)
          if (isFluxProModel) {
            const dimensions = convertFrameSizeToFluxProDimensions(frameSize);
            generationPayload.width = dimensions.width;
            generationPayload.height = dimensions.height;
            console.log(`Flux Pro model detected: ${selectedModel}, using dimensions:`, dimensions);
            console.log(`Original frameSize: ${frameSize}, converted to: ${dimensions.width}x${dimensions.height}`);
            console.log(`Model type: ${selectedModel} - using width/height parameters for BFL API`);
          }

          const result = await dispatch(
            generateImages(generationPayload)
          ).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          // History is persisted by backend; no local completed entry needed

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: loadingEntry.id,
          //     updates: {
          //       ...completedEntry,
          //       frameSize: isFluxProModel ? `${generationPayload.width}x${generationPayload.height}` : frameSize,
          //     },
          //   })
          // );

          // Show success notification
          toast.success(`Generated ${result.images.length} image${result.images.length > 1 ? "s" : ""
            } successfully!`);
          clearInputs();
          await refreshHistory();

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        }
        
        // Reset local generation state on success
        setIsGeneratingLocally(false);
      }
    } catch (error) {
      console.error("Error generating images:", error);
      // Mark local preview as failed
      setLocalGeneratingEntries((prev) => prev.map((e) => ({
        ...e,
        status: 'failed'
      })));

      // Update loading entry to failed status
      // Use firebaseHistoryId if available, otherwise fall back to loadingEntry.id
      // const entryIdToUpdate = firebaseHistoryId || loadingEntry.id;

      // dispatch(
      //   updateHistoryEntry({
      //     id: entryIdToUpdate,
      //     updates: {
      //         status: "failed",
      //         error:
      //           error instanceof Error
      //             ? error.message
      //             : "Failed to generate images",
      //       },
      //     })
      // );

      // If we have a Firebase ID, also update it there
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to generate images",
          });
          console.log('✅ Firebase entry updated to failed status due to error');
        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase entry to failed status:', firebaseError);
        }
      }

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }

      // Show error notification (skip if a Runway base_resp toast already shown)
      if (!runwayBaseRespToastShownRef.current) {
        toast.error(error instanceof Error ? error.message : 'Failed to generate images');
      }
    } finally {
      // Always reset local generation state
      setIsGeneratingLocally(false);
      // Release pagination block after short cooldown so compressed refreshes don't trigger immediate loadMore
      setTimeout(() => { postGenerationBlockRef.current = false; }, 2500);
      // Reset the base_resp toast guard for next run
      runwayBaseRespToastShownRef.current = false;
    }
  };

  // Handle manual prompt enhancement (button)
  const handleEnhancePrompt = async () => {
    if (isEnhancing) return;
    if (!prompt || !prompt.trim()) {
      toast.info('Please enter a prompt to enhance');
      return;
    }

    try {
      setIsEnhancing(true);
      const res = await enhancePromptAPI(prompt, selectedModel);
      if (res.ok && res.enhancedPrompt) {
        dispatch(setPrompt(res.enhancedPrompt));
        // Update the contentEditable visible HTML/tags
        try { updateContentEditable(); } catch {}
        // Focus and put caret at end
        try {
          const el = contentEditableRef.current as HTMLElement | null;
          if (el) {
            el.focus();
            const range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) { sel.removeAllRanges(); sel.addRange(range); }
          }
        } catch {}
        toast.success('Prompt enhanced');
      } else {
        toast.error(res.error || 'Failed to enhance prompt');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as HTMLElement).closest(".dropdown-container")
      ) {
        dispatch(toggleDropdown(""));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <React.Fragment>
      {/* Enhanced spell check styles */}
      <style jsx global>{`
        /* Remove underline from placeholder across browsers */
        textarea::placeholder { text-decoration: none !important; }
        textarea::-webkit-input-placeholder { text-decoration: none !important; }
        textarea:-ms-input-placeholder { text-decoration: none !important; }
        textarea::-ms-input-placeholder { text-decoration: none !important; }
        
        /* Keep default browser spellcheck underlines without forcing decoration */
        textarea[spellcheck="true"] { text-decoration: none; }
        
        /* Placeholder for contentEditable */
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }
      `}</style>
      
  <div ref={scrollRootRef} className="inset-0 pl-0 pr-6 pb-6 overflow-y-auto no-scrollbar z-0">
        <div className="md:py-6 py-0 md:pl-4 pl-2 ">
          {/* History Header - Fixed during scroll */}
          <div className="fixed top-0 left-0 right-0 z-30 md:py-5 py-2 md:ml-18 ml-13 mr-1 backdrop-blur-lg shadow-xl md:pl-6 pl-4">
            <h2 className="md:text-xl text-md font-semibold text-white pl-0">Image Generation</h2>
            </div>
            {/* Spacer to keep content below fixed header */}
            <div className="h-0"></div>

            <div>
            {/* Local preview: if no row for today yet, render a dated block so preview shows immediately */}
            {localGeneratingEntries.length > 0 && !groupedByDate[todayKey] && (
              <div className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                  </div>
                  <h3 className="text-sm font-medium text-white/70">{new Date(todayKey).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h3>
                </div>
                <div className="flex flex-wrap md:gap-3 gap-1 md:ml-9 ml-0">
                  {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                    <div key={`local-only-${idx}`} className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-[140px] h-[130px] max-w-[130px] max-h-[180px] rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                      {localGeneratingEntries[0].status === 'generating' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="flex flex-col items-center gap-2">
                            <NextImage src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                            <div className="text-xs text-white/60 text-center">Generating...</div>
                          </div>
                        </div>
                      ) : localGeneratingEntries[0].status === 'failed' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                          <div className="flex flex-col items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                            <div className="text-xs text-red-400">Failed</div>
                          </div>
                        </div>
                      ) : image.url ? (
                        <div className="relative w-full h-full group">
                          <Image 
                            src={image.thumbnailUrl || image.avifUrl || image.url} 
                            alt="" 
                            fill 
                            className="object-cover transition-opacity duration-300" 
                            sizes="192px"
                            onLoad={() => {
                              // Smooth fade-in effect
                              try { 
                                const img = document.querySelector(`[data-image-id="${image.id}"]`) as HTMLElement;
                                if (img) img.style.opacity = '1';
                              } catch {}
                            }}
                            style={{ opacity: 0 }}
                          />
                          {/* Shimmer loading effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                          <div className="text-xs text-white/60">No image</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Entries - Grouped by Date */}
            <div className=" space-y-8  ">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/60"
                      >
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>

                  {/* All Images for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 md:ml-9 ml-0">
                    {/* Prepend local preview tiles at the start of today's row to push images right */}
                    {date === todayKey && localGeneratingEntries.length > 0 && (
                      <>
                        {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                          <div key={`local-${idx}`} className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-[140px] h-[130px] max-w-[130px] max-h-[180px] rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                            {localGeneratingEntries[0].status === 'generating' ? (
                              <div className="w-full h-full flex items-center justify-center bg-black/90 backdrop-blur-xl border border-white/20">
                                <div className="flex flex-col items-center gap-2">
                                  <NextImage src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />
                                  <div className="text-xs text-white/60 text-center">Generating...</div>
                                </div>
                              </div>
                            ) : localGeneratingEntries[0].status === 'failed' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                                <div className="flex flex-col items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                  <div className="text-xs text-red-400">Failed</div>
                                </div>
                              </div>
                      ) : image.url ? (
                        <div className="relative w-full h-full group">
                          <Image 
                            src={image.thumbnailUrl || image.avifUrl || image.url}
                            alt="" 
                            fill 
                            className="object-contain transition-opacity duration-300" 
                            sizes="192px"
                            onLoad={() => {
                              // Smooth fade-in effect
                              try { 
                                const img = document.querySelector(`[data-image-id="${image.id}"]`) as HTMLElement;
                                if (img) img.style.opacity = '1';
                              } catch {}
                            }}
                            style={{ opacity: 0 }}
                          />
                          {/* Hover copy button overlay */}
                          <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              aria-label="Copy prompt"
                              className="pointer-events-auto p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 backdrop-blur-sm"
                              onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(prompt)); }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            </button>
                          </div>
                        </div>
                            ) : (
                              <div className="w-full h-full bg-black/90 flex items-center justify-center text-white/60">
                                <div className="text-xs text-white/60">No image</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    {groupedByDate[date].map((entry: HistoryEntry) =>
                      entry.images.map((image: any) => (
                        <div
                          key={`${entry.id}-${image.id}`}
                          data-image-id={`${entry.id}-${image.id}`}
                          onClick={() => setPreview({ entry, image })}
                          className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-[140px] h-[130px] max-w-[130px] max-h-[180px] rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {entry.status === "generating" ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-black/90">
                              <div className="flex flex-col items-center gap-2">
                                <NextImage src="/styles/Logo.gif" alt="Generating" width={64} height={64} className="mx-auto" />

                                <div className="text-xs text-white/60 text-center">
                                  Generating...
                                </div>
                              </div>
                            </div>
                          ) : entry.status === "failed" ? (
                            // Error frame
                            <div className="w-full h-full flex items-center justify-center bg-black/90">
                              <div className="flex flex-col items-center gap-2">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="text-red-400"
                                >
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                <div className="text-xs text-red-400">Failed</div>
                              </div>
                            </div>
                          ) : (
                            // Completed image with shimmer loading
                            <div className="relative w-full h-full group">
                              <Image
                                src={image.thumbnailUrl || image.avifUrl || image.url}
                                alt=""
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200 "
                                sizes="192px"
                                onLoad={() => {
                                  // Remove shimmer when image loads
                                  setTimeout(() => {
                                    const shimmer = document.querySelector(`[data-image-id="${entry.id}-${image.id}"] .shimmer`) as HTMLElement;
                                    if (shimmer) {
                                      shimmer.style.opacity = '0';
                                    }
                                  }, 100);
                                }}
                              />
                              {/* Shimmer loading effect */}
                              <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                              {/* Hover buttons overlay */}
                              <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                <button
                                  aria-label="Copy prompt"
                                  className="pointer-events-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                  onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                </button>
                                <button
                                  aria-label="Delete image"
                                  className="pointer-events-auto p-2 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                  onClick={(e) => handleDeleteImage(e, entry)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              
            </div>
            {/* Infinite scroll sentinel inside scroll container */}
            <div ref={sentinelRef} style={{ height: 24 }} />
          </div>
        </div>
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:w-[90%] w-[90%] md:max-w-[900px] max-w-[95%] z-[60] h-auto">
        <div className="rounded-lg bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          {/* Top row: prompt + actions */}
          <div className="flex items-start gap-0 px-3  pr-0">
            <div className="flex-1 flex items-start gap-2 bg-transparent rounded-lg pr-4 pl-2 py-4 w-full relative">
              {/* ContentEditable with inline character tags - allows typing anywhere */}
              <div
                ref={contentEditableRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  if (isUpdatingRef.current) return;
                  
                  const div = e.currentTarget;
                  
                  // Extract text content (including from tags)
                  let text = '';
                  const walker = document.createTreeWalker(
                    div,
                    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                    null
                  );
                  
                  let node;
                  while (node = walker.nextNode()) {
                    if (node.nodeType === Node.TEXT_NODE) {
                      text += node.textContent || '';
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                      const el = node as Element;
                      if (el.classList.contains('character-tag')) {
                        const nameSpan = el.querySelector('span');
                        if (nameSpan) {
                          text += nameSpan.textContent || '';
                        }
                      } else {
                        // For other elements, get text content
                        text += el.textContent || '';
                      }
                    }
                  }
                  
                  // Clean duplicates
                  const cleanedText = text.replace(/(@\w+)(\s*\1)+/g, '$1');
                  
                  // Update state
                  isUpdatingRef.current = true;
                  dispatch(setPrompt(cleanedText));
                  
                  // Adjust height
                  div.style.height = 'auto';
                  div.style.height = Math.min(div.scrollHeight, 96) + 'px';
                  
                  // Re-render tags after a short delay to ensure they're visible
                  setTimeout(() => {
                    isUpdatingRef.current = false;
                    // Check if tags need to be re-rendered
                    const hasTags = div.querySelector('.character-tag');
                    const shouldHaveTags = selectedCharacters.length > 0 && cleanedText.match(/@\w+/);
                    if (!hasTags && shouldHaveTags) {
                      updateContentEditable();
                    }
                  }, 100);
                }}
                onKeyDown={(e) => {
                  // Allow normal typing, but prevent deleting tags directly
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    const div = e.currentTarget;
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      let node: Node | null = range.startContainer;
                      
                      while (node && node !== div) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const el = node as Element;
                          if (el.classList.contains('character-tag')) {
                            // If cursor is at start of tag, move before it
                            if (e.key === 'Backspace') {
                              e.preventDefault();
                              const textNode = document.createTextNode('');
                              div.insertBefore(textNode, el);
                              range.setStartBefore(textNode);
                              range.collapse(true);
                              selection.removeAllRanges();
                              selection.addRange(range);
                              return;
                            }
                            // If cursor is at end of tag, move after it
                            if (e.key === 'Delete') {
                              e.preventDefault();
                              const textNode = document.createTextNode('');
                              div.insertBefore(textNode, el.nextSibling);
                              range.setStartAfter(textNode);
                              range.collapse(true);
                              selection.removeAllRanges();
                              selection.addRange(range);
                              return;
                            }
                          }
                        }
                        node = node.parentNode;
                      }
                    }
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text/plain');
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  // Trigger input event
                  const inputEvent = new Event('input', { bubbles: true });
                  e.currentTarget.dispatchEvent(inputEvent);
                }}
                className={`flex-1 min-w-[200px] bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-relaxed overflow-y-auto transition-all duration-200 ${
                  !prompt && selectedCharacters.length === 0 ? 'text-white/70' : 'text-white'
                }`}
                style={{
                  minHeight: '24px',
                  maxHeight: '96px',
                  lineHeight: '1.2',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
                data-placeholder={!prompt && selectedCharacters.length === 0 ? "Type your prompt..." : ""}
              />
                {/* Enhancement overlay */}
                {isEnhancing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40 rounded-lg pointer-events-none">
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin text-white/90" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <div className="text-white/90 text-sm">Enhancing…</div>
                    </div>
                  </div>
                )}
              {/* Fixed position buttons container */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Clear prompt button - only show when there's text */}
                {prompt.trim() && (
                  <div className="relative group">
                    <button
                      onClick={() => {
                        dispatch(setPrompt(''));
                        if (inputEl.current) {
                          inputEl.current.focus();
                        }
                      }}
                      className="px-1.5 py-1.5 -mt-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors duration-200 flex items-center gap-1.5"
                      aria-label="Clear prompt"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white/80"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20  text-white/100 backdrop-blur-3xl shadow-3xl text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Clear Prompt</div>
                  </div>
                )}
                {/* Previews just to the left of upload */}
                {(uploadedImages.length > 0 || selectedCharacters.length > 0) && (
                  <div className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden max-w-[55vw] md:max-w-none pr-1 no-scrollbar">
                    {/* Selected Characters Preview */}
                    {selectedCharacters.map((character: any) => (
                      <div
                        key={character.id}
                        className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group flex-shrink-0 transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110"
                        title={`Character: ${character.name}`}
                      >
                        <img
                          src={character.frontImageUrl}
                          alt={character.name}
                          aria-hidden="true"
                          decoding="async"
                          className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                        />
                        <div className="pointer-events-none absolute -top-1 -left-1 z-10">
                          <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                            C
                          </div>
                        </div>
                        <button
                          aria-label={`Remove character ${character.name}`}
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(removeSelectedCharacter(character.id));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {/* Uploaded Images Preview */}
                    {uploadedImages.map((u: string, i: number) => {
                      const count = uploadedImages.length;
                      const sizeClass = count >= 9 ? 'w-8 h-8' : count >= 6 ? 'w-10 h-10' : 'w-12 h-12';
                      return (
                        <div
                          key={i}
                          data-image-index={i}
                          title={`Image ${i + 1} (index ${i})`}
                          className={`relative ${sizeClass} rounded-md overflow-hidden ring-1 ring-white/20 group flex-shrink-0 transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                          />
                          {/* Number badge (1-based display, zero-based in payload order) */}
                          <div className="pointer-events-none absolute -top-1 -left-1 z-10">
                            <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                              {i + 1}
                            </div>
                          </div>
                          <button
                            aria-label="Remove reference"
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = uploadedImages.filter(
                                (_: string, idx: number) => idx !== i
                              );
                              dispatch(setUploadedImages(next));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
               <div className="relative flex items-center gap-1.5 -mr-1 -mt-1.5">
                  {/* Enhance prompt button (manual trigger) */}
                  <div className="relative">
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing || !prompt.trim()}
                      type="button"
                      title="Enhance prompt"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-1 text-sm text-white/90"
                      aria-pressed={isEnhancing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                        <path d="M12 2l1.9 4.2L18 8l-4.1 1.8L12 14l-1.9-4.2L6 8l4.1-1.8L12 2z" fill="currentColor" opacity="0.95" />
                        <path d="M3 13l2 1-2 1 1 2-1 2 2-1 1 2 0-2 2 0-1-2 2-1-2-1 1-2-2 1-1-2-1 2z" fill="currentColor" opacity="0.6" />
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Enhance</div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-0.75 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-0 peer"
                      onClick={() => setIsCharacterModalOpen(true)}
                      type="button"
                      aria-label="Upload character"
                    >
                      <Image src="/icons/character.svg" alt="Attach" width={16} height={16} className="opacity-100 w-6 h-6" />
                      <span className="text-white text-sm"> </span>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Upload Character</div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-0 peer"
                      onClick={() => setIsUploadOpen(true)}
                      type="button"
                      aria-label="Upload image"
                    >
                      <Image src="/icons/fileupload.svg" alt="Attach" width={18} height={18} className="opacity-100" />
                      <span className="text-white text-sm"> </span>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Upload Image</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed position Generate button */}
            
          </div>

          {/* Bottom row: pill options */}
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            {/* Selection Summary */}
            {/* <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-300">
            <span>Selected:</span>
            <span className="text-white/80 font-medium flex flex-wrap gap-1">
              {selectedModel !== 'flux-dev' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {selectedModel.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )}
              {imageCount !== 1 && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {imageCount} Image{imageCount > 1 ? 's' : ''}
                </span>
              )}
              {frameSize !== '1:1' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {frameSize}
                </span>
              )}
              {style !== 'realistic' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded animate-pulse">
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </span>
              )}
              {(selectedModel === 'flux-dev' && imageCount === 1 && frameSize === '1:1' && style === 'realistic') && (
                <span className="text-white/40">Default settings</span>
              )}
            </span>
          </div> */}

            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0 justify-between">
              <div className="flex items-center gap-3 -mb-2"><ModelsDropdown />
              <ImageCountDropdown />
              <FrameSizeDropdown />
              <StyleSelector />
              <LucidOriginOptions />
              <PhoenixOptions />
              <FileTypeDropdown />
              {selectedModel === 'seedream-v4' && (
                <div className="flex items-center gap-2 relative">
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => dispatch(toggleDropdown('seedreamSize'))}
                        className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 hover:bg-white/5 transition flex items-center gap-2"
                    >
                      {seedreamSize}
                      <ChevronUp className={`w-4 h-4 transition-transform ${activeDropdown === 'seedreamSize' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'seedreamSize' && (
                      <div className={`absolute bottom-full mb-2 left-0 w-18 bg-black/80 backdrop-blur-xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/30 py-1 z-50`}>
                        {['1K','2K','4K','custom'].map((opt) => (
                          <button
                            key={opt}
                            onClick={(e) => { e.stopPropagation(); setSeedreamSize(opt as any); dispatch(toggleDropdown('')); }}
                            className={`w-18 px-4 py-2 text-left text-[13px] flex items-center justify-between ${seedreamSize === opt ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'}`}
                          >
                            <span>{opt}</span>
                            {seedreamSize === opt && (
                              <span className="w-2 h-2 bg-black rounded-full"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {seedreamSize === 'custom' && (
                    <>
                      <input
                        type="number"
                        min={1024}
                        max={4096}
                        value={seedreamWidth}
                        onChange={(e)=>setSeedreamWidth(Number(e.target.value)||2048)}
                        placeholder="Width"
                        className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                      />
                      <input
                        type="number"
                        min={1024}
                        max={4096}
                        value={seedreamHeight}
                        onChange={(e)=>setSeedreamHeight(Number(e.target.value)||2048)}
                        placeholder="Height"
                        className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                      />
                    </>
                  )}
                </div>
              )}
</div>
              
              <div><div className="flex flex-col items-end gap-2 flex-shrink-0 justify-end">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={isGeneratingLocally || isEnhancing || !prompt.trim()}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-lg text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
                aria-busy={isEnhancing}
              >
                {isGeneratingLocally ? "Generating..." : isEnhancing ? "Enhancing..." : "Generate"}
              </button>
            </div></div>
            </div>
          </div>
        </div>
      </div>
  {/* sentinel moved inside scroll container */}
      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
      <UpscalePopup isOpen={isUpscaleOpen} onClose={() => setIsUpscaleOpen(false)} defaultImage={uploadedImages[0] || null} onCompleted={refreshAllHistory} />
      <RemoveBgPopup isOpen={isRemoveBgOpen} onClose={() => setIsRemoveBgOpen(false)} defaultImage={uploadedImages[0] || null} onCompleted={refreshAllHistory} />
      <EditPopup
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpscale={() => setIsUpscaleOpen(true)}
        onRemoveBg={() => setIsRemoveBgOpen(true)}
        onResize={() => {
          // Open frame size dropdown programmatically (optional improvement)
          const dropdown = document.querySelector('[data-frame-size-dropdown]') as HTMLElement | null;
          if (dropdown) dropdown.click();
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        historyEntries={historyEntries as any}
        remainingSlots={Math.max(0, 10 - (uploadedImages?.length || 0))}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={async () => {
          try {
            if (!hasMore || loading) return;
            await (dispatch as any)(loadMoreHistory({
              filters: { generationType: 'text-to-image' },
              paginationParams: { limit: 10 }
            })).unwrap();
          } catch {}
        }}
        onAdd={(urls: string[]) => {
          const next = [...uploadedImages, ...urls].slice(0, 10);
          dispatch(setUploadedImages(next));
        }}
      />

      {/* Debug overlay – appears only when localStorage.wild_debug === '1' */}
      {/* <InfiniteScrollDebugOverlay
        hasMore={hasMore}
        loading={loading}
        totalCount={(historyEntries?.length || 0) + (localGeneratingEntries?.length || 0)}
        nextCursor={null}
        containerRef={scrollRootRef as any}
        sentinelRef={sentinelRef as any}
        events={ioEventsRef.current}
      /> */}

      {/* Character Modal */}
      <CharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onAdd={(character: Character) => {
          dispatch(addSelectedCharacter(character));
        }}
        onRemove={(characterId: string) => {
          dispatch(removeSelectedCharacter(characterId));
        }}
        selectedCharacters={selectedCharacters}
        maxCharacters={10}
      />
    </React.Fragment>
  );
};

export default InputBox;
