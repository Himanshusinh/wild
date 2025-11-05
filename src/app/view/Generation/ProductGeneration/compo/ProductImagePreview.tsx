'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { toMediaProxy, toZataPath } from '@/lib/thumb';
import { X, Download, ExternalLink, Copy, Check, Share, Trash2 } from 'lucide-react';
import { HistoryEntry, GeneratedImage } from '@/types/history';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateHistoryEntry } from '@/store/slices/historySlice';
import axiosInstance from '@/lib/axiosInstance';
import { removeHistoryEntry } from '@/store/slices/historySlice';
import { downloadFileWithNaming, getFileType, getExtensionFromUrl } from '@/utils/downloadUtils';
import { getModelDisplayName } from '@/utils/modelDisplayNames';

interface ProductImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HistoryEntry;
}

const ProductImagePreview: React.FC<ProductImagePreviewProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth?.user);
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPublicFlag, setIsPublicFlag] = useState<boolean>(true);
  // Fullscreen overlay state
  const [isFsOpen, setIsFsOpen] = React.useState(false);
  const [fsScale, setFsScale] = React.useState(1);
  const [fsFitScale, setFsFitScale] = React.useState(1);
  const [fsOffset, setFsOffset] = React.useState({ x: 0, y: 0 });
  const [fsIsPanning, setFsIsPanning] = React.useState(false);
  const [fsLastPoint, setFsLastPoint] = React.useState({ x: 0, y: 0 });
  const [fsNaturalSize, setFsNaturalSize] = React.useState({ width: 0, height: 0 });
  const fsContainerRef = React.useRef<HTMLDivElement>(null);
  const wheelNavCooldown = React.useRef(false);
  
  if (!isOpen) return null;

  const selectedImage = entry.images[selectedImageIndex];
  
  // Update isPublicFlag based on selected image
  React.useEffect(() => {
    const isPublic = ((selectedImage as any)?.isPublic !== false);
    setIsPublicFlag(isPublic);
  }, [selectedImage]);

  const handleDownload = async () => {
    try {
      // Get username from user state or fallback to 'user'
      const username = user?.username || user?.displayName || null;
      await downloadFileWithNaming(selectedImage.url, username, 'image', 'product');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const toFrontendProxyResourceUrl = (urlOrPath?: string) => {
    if (!urlOrPath) return '';
    const path = urlOrPath.replace(/^https?:\/\/[^/]+\/devstoragev1\//, '');
    return `/api/proxy/resource/${encodeURIComponent(path)}`;
  };

  const getUserPrompt = (rawPrompt: string | undefined) => {
    if (!rawPrompt) return '';
    // Normalize newlines
    let prompt = rawPrompt.replace(/\r\n/g, '\n').trim();

    // Remove trailing style/metainfo blocks like [Style: realistic]
    prompt = prompt.replace(/\s*\[[^\]]*\]\s*$/i, '').trim();

    // Primary: take text right after the first ':' up to first period or newline
    const firstColon = prompt.indexOf(':');
    if (firstColon !== -1) {
      let after = prompt.slice(firstColon + 1).trim();
      // stop at first newline or period
      const newlineIdx = after.indexOf('\n');
      const periodIdx = after.indexOf('.');
      let end = after.length;
      if (newlineIdx !== -1) end = Math.min(end, newlineIdx);
      if (periodIdx !== -1) end = Math.min(end, periodIdx);
      after = after.slice(0, end).replace(/\s*\.$/, '').trim();
      if (after) return after;
    }

    // Try precise known product templates (studio or lifestyle)
    let m = prompt.match(/Create\s+a\s+professional\s+(?:studio|lifestyle)\s+product\s+photograph\s+of:\s*([^\n\.]+?)(?:\s*\.)?(?:\n|$)/i);
    if (m && m[1]) return m[1].trim();

    // Generic "Create ...:" pattern – capture only until first period or newline
    m = prompt.match(/Create[^:]*?:\s*([^\n\.]+?)(?:\s*\.)?(?:\n|$)/i);
    if (m && m[1]) return m[1].trim();

    // If there is a Goal section, only consider the text before it, then try to grab the last clause after a ':'
    const beforeGoal = prompt.split(/\n\s*Goal:/i)[0];
    if (beforeGoal && beforeGoal !== prompt) {
      const mm = beforeGoal.match(/:\s*([^\n\.]+?)(?:\s*\.)?$/i);
      if (mm && mm[1]) return mm[1].trim();
    }

    // Legacy prefix fallback
    let legacy = prompt.replace(/^Product:\s*/i, '').trim();
    legacy = legacy.split('\n')[0].replace(/\s*\.$/, '').trim();
    return legacy;
  };

  const copyPrompt = async (prompt: string, buttonId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedButtonId(buttonId);
      setTimeout(() => {
        setCopiedButtonId(null);
      }, 2000); // Hide after 2 seconds
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  // ---- Fullscreen helpers ----
  const fsClampOffset = React.useCallback((newOffset: { x: number; y: number }, currentScale: number) => {
    if (!fsContainerRef.current) return newOffset;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const imgW = fsNaturalSize.width * currentScale;
    const imgH = fsNaturalSize.height * currentScale;
    const maxX = Math.max(0, (imgW - rect.width) / 2);
    const maxY = Math.max(0, (imgH - rect.height) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, newOffset.x)), y: Math.max(-maxY, Math.min(maxY, newOffset.y)) };
  }, [fsNaturalSize]);
  const fsZoomToPoint = React.useCallback((point: { x: number; y: number }, newScale: number) => {
    if (!fsContainerRef.current) return;
    const rect = fsContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2; const centerY = rect.height / 2;
    const newOffsetX = centerX - (point.x * newScale); const newOffsetY = centerY - (point.y * newScale);
    const clamped = fsClampOffset({ x: newOffsetX, y: newOffsetY }, newScale);
    setFsScale(newScale); setFsOffset(clamped);
  }, [fsClampOffset]);
  const openFullscreen = React.useCallback(() => setIsFsOpen(true), []);
  const closeFullscreen = React.useCallback(() => { setIsFsOpen(false); setFsIsPanning(false); }, []);
  React.useEffect(() => {
    if (!isFsOpen) return;
    const computeFit = () => {
      if (!fsContainerRef.current || !fsNaturalSize.width || !fsNaturalSize.height) return;
      const rect = fsContainerRef.current.getBoundingClientRect();
      const fit = Math.min(rect.width / fsNaturalSize.width, rect.height / fsNaturalSize.height) || 1;
      const base = Math.min(1, fit); setFsFitScale(base); setFsScale(base); setFsOffset({ x: 0, y: 0 });
    };
    computeFit();
    const onResize = () => computeFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isFsOpen, fsNaturalSize]);
  React.useEffect(() => {
    if (!isFsOpen) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isFsOpen]);
  const goPrev = React.useCallback(() => { setSelectedImageIndex((idx)=>{ const total=(entry.images||[]).length; if(total<=1) return idx; return (idx-1+total)%total; }); }, [entry.images]);
  const goNext = React.useCallback(() => { setSelectedImageIndex((idx)=>{ const total=(entry.images||[]).length; if(total<=1) return idx; return (idx+1)%total; }); }, [entry.images]);
  const fsOnWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); if (!fsContainerRef.current) return;
    if (fsScale <= fsFitScale + 0.001) { if (wheelNavCooldown.current) return; const dy=e.deltaY||0; const dx=e.deltaX||0; const d=Math.abs(dy)>Math.abs(dx)?dy:dx; if (d>20) goNext(); else if (d<-20) goPrev(); wheelNavCooldown.current=true; setTimeout(()=>{wheelNavCooldown.current=false;},250); return; }
    const rect = fsContainerRef.current.getBoundingClientRect(); const mx = e.clientX - rect.left; const my = e.clientY - rect.top; const delta = e.deltaY > 0 ? -0.1 : 0.1; const next = Math.max(0.5, Math.min(6, fsScale + delta)); if (next !== fsScale) fsZoomToPoint({ x: mx, y: my }, next);
  }, [fsScale, fsFitScale, fsZoomToPoint, goNext, goPrev]);
  const fsOnMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (fsContainerRef.current) {
      const rect = fsContainerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
      const atFit = fsScale <= fsFitScale + 0.001;
      if (e.button === 0) {
        if (atFit) {
          const next = Math.min(6, fsScale * 1.2);
          if (next !== fsScale) { fsZoomToPoint({ x: mx, y: my }, next); return; }
        } else { setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY }); return; }
      }
      if (e.button === 1) { setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY }); return; }
      if (e.button === 2) {
        const next = Math.max(0.5, fsScale / 1.2);
        if (next !== fsScale) { fsZoomToPoint({ x: mx, y: my }, next); return; }
      }
    }
    setFsIsPanning(true); setFsLastPoint({ x: e.clientX, y: e.clientY });
  }, [fsScale, fsFitScale, fsZoomToPoint]);
  const fsOnMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => { if (!fsIsPanning) return; e.preventDefault(); const dx = e.clientX - fsLastPoint.x; const dy = e.clientY - fsLastPoint.y; const clamped = fsClampOffset({ x: fsOffset.x + dx, y: fsOffset.y + dy }, fsScale); setFsOffset(clamped); setFsLastPoint({ x: e.clientX, y: e.clientY }); }, [fsIsPanning, fsLastPoint, fsOffset, fsClampOffset, fsScale]);
  const fsOnMouseUp = React.useCallback(() => setFsIsPanning(false), []);

  React.useEffect(() => {
    if (!isFsOpen) return; const onKey = (e: KeyboardEvent) => { if (e.key==='ArrowLeft'){e.preventDefault(); goPrev();} else if(e.key==='ArrowRight'){e.preventDefault(); goNext();} else if(e.key==='Escape'){e.preventDefault(); closeFullscreen();} }; window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey);
  }, [isFsOpen, goPrev, goNext, closeFullscreen]);

  const handleDelete = async () => {
    try {
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch {}
      onClose();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete generation');
    }
  };

  const toggleVisibility = async () => {
    try {
      const next = !isPublicFlag;
      setIsPublicFlag(next);
      try {
        if (entry?.id) {
          const target = selectedImage;
          const payload: any = target?.url || target?.id || (target as any)?.storagePath ? { image: { id: (target as any)?.id, url: (target as any)?.url, storagePath: (target as any)?.storagePath, isPublic: next } } : { isPublic: next };
          await axiosInstance.patch(`/api/generations/${entry.id}`, payload);
          try {
            const images = Array.isArray((entry as any).images) ? (entry as any).images.map((im: any) => {
              if ((target?.id && im.id === target.id) || (target?.url && im.url === target.url) || (target as any)?.storagePath && im.storagePath === (target as any).storagePath) {
                return { ...im, isPublic: next };
              }
              return im;
            }) : (entry as any).images;
            dispatch(updateHistoryEntry({ id: entry.id, updates: { images } as any }));
          } catch {}
        }
      } catch {}
    } catch {}
  };

  const userPrompt = getUserPrompt(entry.prompt);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const isLongPrompt = (userPrompt || '').length > 280;


  return (
    <div className="fixed inset-0 mt-15 bg-black/90 md:bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-2 md:py-20" onClick={onClose}>
      <div className="relative h-full md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent border border-white/10 rounded-3xl overflow-hidden shadow-3xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent">
          <div className="text-white/70 text-sm"></div>
          <div className="flex items-center gap-2">
          </div>
        </div>

        {/* Content */}
        <div className="md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-transparent h-[35vh] md:h-[84vh] md:flex-1 group flex items-center justify-center">
            {selectedImage && (
              <Image 
                src={selectedImage.url} 
                alt={entry.prompt} 
                fill 
                className="object-contain" 
              />
            )}
            <button
              aria-label="Fullscreen"
              title="Fullscreen"
              className="absolute top-3 left-3 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-opacity"
              onClick={openFullscreen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 9V5a2 2 0 0 1 2-2h4" />
                <path d="M21 9V5a2 2 0 0 0-2-2h-4" />
                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                <path d="M3 15v4a2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>

          {/* Sidebar */}
          <div className="relative md:p-5 text-white white/10 bg-transparent h-[calc(100vh-35vh-60px)] md:h-full md:w-[34%] mt-4 md:mt-10 flex flex-col">
            {/* Action Buttons - Fixed on mobile to match ImagePreview */}
            <div className="md:mb-4 sticky md:relative top-0 md:top-auto left-0 right-0 md:left-auto md:right-auto z-40 md:z-auto p-4 md:p-0 bg-transparent md:bg-transparent backdrop-blur-0 md:backdrop-blur-0 border-b-0 md:border-b-0 md:mb-4 flex-shrink-0">
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                    aria-label="Download"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 19h14"/></svg>
                  </button>
                  <div className="pointer-events-none absolute  left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Download</div>
                </div>

                <div className="relative group flex-1">
                  <button
                    onClick={() => {
                      if (navigator.share && selectedImage?.url) {
                        navigator.share({ title: 'Check out this image', url: selectedImage.url });
                      } else if (selectedImage?.url) {
                        window.prompt('Copy and share this image URL:', selectedImage.url);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                    aria-label="Share"
                  >
                    <Share className="h-4 w-4" />
                  </button>
                  <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Share</div>
                </div>

                <div className="relative group flex-1">
                  <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm" aria-label="Delete image">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Delete</div>
                </div>

                <div className="relative group flex-1">
                  <button
                    onClick={toggleVisibility}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                    aria-pressed={isPublicFlag}
                    aria-label="Toggle visibility"
                    title={isPublicFlag ? 'Public' : 'Private'}
                  >
                    {isPublicFlag ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5z"/><circle cx="12" cy="12" r="3"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/><path d="M16.1 16.1C14.84 16.7 13.46 17 12 17 7 17 2.73 13.89 1 9.5a14.78 14.78 0 0 1 5.06-5.56"/></svg>
                    )}
                  </button>
                  <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">{isPublicFlag ? 'Public' : 'Private'}</div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 md:p-0 flex-1 overflow-y-auto custom-scrollbar pb-28 md:pb-0">
              {/* Date */}
              <div className="mb-1 ">
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Date</div>
                <div className="text-white text-sm">{new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {(() => { const d = new Date(entry.timestamp); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}-${mm}-${yyyy}` })()}</div>
              </div>

              {/* Prompt */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-2">
                  <span>Prompt</span>
                  <button 
                    onClick={() => copyPrompt(userPrompt, `preview-${entry.id}`)}
                    className={`flex items-center gap-2 px-2 py-1.5 text-white text-xs rounded-lg transition-colors ${
                      copiedButtonId === `preview-${entry.id}` 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {copiedButtonId === `preview-${entry.id}` ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                <div className={`text-white/90 text-xs leading-relaxed whitespace-pre-wrap break-words ${!isPromptExpanded && isLongPrompt ? 'line-clamp-4' : ''}`}>
                  {userPrompt}
                </div>
                {isLongPrompt && (
                  <button
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    className="mt-2 text-xs text-white/70 hover:text-white underline"
                  >
                    Read {isPromptExpanded ? 'less' : 'more'}
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="mb-4">
                <div className="text-white/80 text-xs uppercase tracking-wider mb-2">Details</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Model:</span>
                    <span className="text-white text-sm">{getModelDisplayName(entry.model)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 text-sm">Format:</span>
                    <span className="text-white text-sm">Product</span>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              {entry.images.length > 1 && (
                <div className="mb-4">
                  <div className="text-white/80 text-xs uppercase tracking-wider mb-2">Products ({entry.images.length})</div>
                  <div className="grid grid-cols-3 gap-2">
                    {entry.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square rounded-md overflow-hidden border transition-colors ${selectedImageIndex === index ? 'border-white/10' : 'border-transparent hover:border-white/10'}`}
                      >
                        <Image
                          src={image.url}
                          alt={`Product ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6">
                <button 
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-[#2D6CFF] text-white rounded-lg hover:bg-[#255fe6] transition-colors text-sm font-medium"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
        {isFsOpen && (
          <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center">
            <div className="absolute top-3 right-4 z-[90]">
              <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/30">✕</button>
            </div>
            {(entry.images.length > 1) && (<>
              <button aria-label="Previous image" onClick={(e)=>{e.stopPropagation(); goPrev();}} onMouseDown={(e)=>e.stopPropagation()} type="button" className="absolute left-4 top-1/2 -translate-y-1/2 z-[90] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ring-1 ring-white/20 pointer-events-auto"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
              <button aria-label="Next image" onClick={(e)=>{e.stopPropagation(); goNext();}} onMouseDown={(e)=>e.stopPropagation()} type="button" className="absolute right-4 top-1/2 -translate-y-1/2 z-[90] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ring-1 ring-white/20 pointer-events-auto"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg></button>
            </>)}
            <div
              ref={fsContainerRef}
              className="relative w-full h-full cursor-zoom-in"
              onWheel={fsOnWheel}
              onMouseDown={fsOnMouseDown}
              onMouseMove={fsOnMouseMove}
              onMouseUp={fsOnMouseUp}
              onMouseLeave={fsOnMouseUp}
              onContextMenu={(e)=>{e.preventDefault();}}
              style={{ cursor: fsScale > fsFitScale ? (fsIsPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`, transformOrigin: 'center center', transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out' }}>
                <img
                  src={selectedImage?.url}
                  alt={entry.prompt}
                  onLoad={(e) => { const img = e.currentTarget as HTMLImageElement; setFsNaturalSize({ width: img.naturalWidth, height: img.naturalHeight }); }}
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-white/10 px-3 py-1.5 rounded-md ring-1 ring-white/20">
              Scroll to navigate images. Left-click to zoom in, right-click to zoom out. When zoomed, drag to pan.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImagePreview;
