'use client';

import React from 'react';
import { HistoryEntry } from '@/types/history';

interface ImagePreviewModalProps {
  preview: { entry: HistoryEntry; image: { id?: string; url: string } } | null;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ preview, onClose }) => {
  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length);
    return urlOrPath;
  }, []);

  const toMediaProxyUrl = React.useCallback((urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
  }, [toProxyPath]);

  if (!preview) return null;

  return (
    <div 
      className="fixed inset-0 mt-15 bg-black/90 md:bg-black/70 backdrop-blur-sm z-70 flex items-center justify-center p-2 md:py-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    > 

    <button aria-label="Close" className="text-white/100 hover:text-white text-lg absolute top-8 right-10 " onClick={onClose}>✕</button>
      <div 
        className="relative  h-full  md:w-full md:max-w-6xl w-[90%] max-w-[90%] bg-transparent  border border-white/10 rounded-3xl overflow-hidden shadow-3xl"
        onClick={(e) => e.stopPropagation()}
      > 
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-transparent  ">
          <div className="text-white/70 text-sm"></div>
          <div className="flex items-center gap-2">
            {/* <button 
              className="p-2 rounded-full  text-white transition-colors" 
              onClick={handleDelete}
              aria-label="Delete image"
            >
              <Trash2 className="w-5 h-5" />
            </button> */}
          </div>
        </div>

        {/* Content */}
        <div className=" md:flex md:flex-row md:gap-0">
          {/* Media */}
          <div className="relative bg-transparent h-[35vh] md:h-[84vh] md:flex-1 group flex items-center justify-center ">
            {selectedImage?.url && (
              <div className="relative w-full h-full flex items-center justify-center ">
                <img
                  src={objectUrl || toMediaProxyUrl(selectedImage.url)}
                  alt={selectedEntry?.prompt}
                  className="object-contain w-auto h-auto max-w-full max-h-full mx-auto"
                />
                {isUserUploadSelected && (
                  <div className="absolute top-3 left-3 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ">User upload</div>
                )}
              </div>
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
                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
              </svg>
            </button>
          </div>
          {/* Sidebar */}
          <div className="relative md:p-5 text-white white/10 bg-transparent h-[calc(100vh-35vh-60px)] md:h-full md:w-[34%] mt-4 md:mt-10 flex flex-col">
            {/* Action Buttons - Fixed on mobile */}
            <div className="md:mb-4 sticky md:relative top-0 md:top-auto left-0 right-0 md:left-auto md:right-auto z-40 md:z-auto p-4 md:p-0 bg-transparent md:bg-transparent backdrop-blur-0 md:backdrop-blur-0 border-b-0 md:border-b-0 md:mb-4 flex-shrink-0">
              <div className="flex gap-2">
              <div className="relative group flex-1">
                <button
                  onClick={() => downloadImage(selectedImage?.url || preview.image.url)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 3v12" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M5 19h14" />
                  </svg>
                </button>
                <div className="pointer-events-none absolute  left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Download</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={() => shareImage(selectedImage?.url || preview.image.url)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                >
                  <Share className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Share</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm"
                  aria-label="Delete image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Delete</div>
              </div>

              <div className="relative group flex-1">
                <button
                  onClick={toggleVisibility}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/20 text-sm`}
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
              <div className="text-white/60 text-sm uppercase tracking-wider mb-0">Date</div>
              <div className="text-white/80 text-sm">{new Date(selectedEntry?.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {(() => { const d = new Date(selectedEntry?.timestamp); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}-${mm}-${yyyy}` })()}</div>
            </div>

            

            {/* Prompt */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-white/60 text-xs uppercase tracking-wider mb-0">
                <span>Prompt</span>
                <button 
                  onClick={() => copyPrompt(cleanPrompt, `preview-${preview.entry.id}`)}
                  className={`flex items-center gap-2 px-2 py-1.5 text-white/80 text-xs rounded-lg transition-colors ${
                    copiedButtonId === `preview-${preview.entry.id}` 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {copiedButtonId === `preview-${preview.entry.id}` ? (
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
                {cleanPrompt}
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
              <div className="text-white/80 text-sm uppercase tracking-wider mb-1">Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Model:</span>
                  <span className="text-white/80 text-sm">{getModelDisplayName(selectedEntry?.model)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Style:</span>
                  <span className="text-white/80 text-sm">{displayedStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Aspect ratio:</span>
                  <span className="text-white/80 text-sm">{displayedAspect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Format:</span>
                  <span className="text-white/80 text-sm">Image</span>
                </div>
              </div>
            </div>
            {/* Gallery - show all images from this generation run in original order */}
            {Array.isArray((selectedEntry as any)?.images) && (selectedEntry as any).images.length > 1 && (
              <div className="mb-4">
                <div className="text-white/80 text-sm uppercase tracking-wider mb-1">Images</div>
                <div className="grid grid-cols-3 gap-2">
                  {sameDateGallery.map((pair: any, idx: number) => (
                    <button
                      key={pair.image?.id || idx}
                      onClick={() => {
                        try { setSelectedIndex(idx); } catch {}
                      }}
                      className={`relative aspect-square rounded-md overflow-hidden border transition-colors ${selectedIndex === idx ? 'border-white/10' : 'border-transparent hover:border-white/10'}`}
                    >
                      <img src={toMediaProxyUrl(pair.image?.url) || pair.image?.url} alt={`Image ${idx+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => navigateToEdit('upscale')}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Upscale
                </button>
                <button
                  onClick={() => navigateToEdit('remove-bg')}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Remove background
                </button>
                
              </div>

              <div className="flex gap-2">
              <button
                  onClick={() => navigateToEdit('resize')}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  Resize
                </button>
              <button
                onClick={() => {
                  try {
                    const storagePath = (selectedImage as any)?.storagePath || (() => {
                      const original = selectedImage?.url || '';
                      const pathCandidate = toProxyPath(original);
                      return pathCandidate && pathCandidate !== original ? pathCandidate : '';
                    })();
                    const fallbackHttp = selectedImage?.url && !isBlobOrDataUrl(selectedImage.url) ? selectedImage.url : (preview.image.url && !isBlobOrDataUrl(preview.image.url) ? preview.image.url : '');
                    const imgUrl = toFrontendProxyResourceUrl(storagePath) || fallbackHttp;
                    const qs = new URLSearchParams();
                    qs.set('prompt', cleanPrompt);
                    if (imgUrl) qs.set('image', imgUrl);
                    if (storagePath) qs.set('sp', storagePath);
                    // also pass model, frameSize and style for preselection
                    console.log('preview.entry', selectedEntry);
                    if (selectedEntry?.model) {
                      // Map backend model ids to UI dropdown ids where needed
                      const m = String(selectedEntry.model);
                      const mapped = m === 'bytedance/seedream-4' ? 'seedream-v4' : m;
                      qs.set('model', mapped);
                    }
                    if (selectedEntry?.frameSize) qs.set('frame', String(selectedEntry.frameSize));
                    const sty = selectedEntry?.style || extractStyleFromPrompt(selectedEntry?.prompt || '') || '';
                    if (sty) qs.set('style', String(sty));
                    // Client-side navigation to avoid full page reload
                    router.push(`/text-to-image?${qs.toString()}`);
                    onClose();
                  } catch {}
                }}
                className="flex-1 px-3 py-2 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white rounded-lg transition-colors text-sm font-medium shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                Remix 
              </button>
              </div>

              {/* New buttons row */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEditInLiveCanvas}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  {/* <Palette className="h-4 w-4" /> */}
                  Edit in Live Canvas
                </button>
                <button
                  onClick={handleCreateVideo}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white text-sm ring-1 ring-white/20 transition"
                >
                  {/* <Video className="h-4 w-4" /> */}
                  Create Video
                </button>
              </div>
              
            </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fullscreen viewer overlay */}
      {isFsOpen && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <div className="absolute top-3 right-4 z-[90]">
            <button aria-label="Close fullscreen" onClick={closeFullscreen} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm ring-1 ring-white/30">
              ✕
            </button>
          </div>
          {/* Navigation arrows (only when multiple images in this run) */}
          {(sameDateGallery.length > 1) && <button
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); goPrev(e); }}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[90] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ring-1 ring-white/20 pointer-events-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>}
          {(sameDateGallery.length > 1) && <button
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); goNext(e); }}
            onMouseDown={(e) => e.stopPropagation()}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[90] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center ring-1 ring-white/20 pointer-events-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
          </button>}
          <div
            ref={fsContainerRef}
            className="relative w-full h-full cursor-zoom-in"
            onWheel={fsOnWheel}
            onMouseDown={fsOnMouseDown}
            onMouseMove={fsOnMouseMove}
            onMouseUp={fsOnMouseUp}
            onMouseLeave={fsOnMouseUp}
            onContextMenu={(e) => { e.preventDefault(); }}
            style={{ cursor: fsScale > fsFitScale ? (fsIsPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate3d(${fsOffset.x}px, ${fsOffset.y}px, 0) scale(${fsScale})`,
                transformOrigin: 'center center',
                transition: fsIsPanning ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              <img
                src={objectUrl || toMediaProxyUrl(selectedImage?.url) || toMediaProxyUrl(preview.image.url)}
                alt={selectedEntry?.prompt}
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  setFsNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                }}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>
          </div>
          {/* Instructions */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-white/10 px-3 py-1.5 rounded-md ring-1 ring-white/20">
            Scroll to navigate images. Left-click to zoom in, right-click to zoom out. When zoomed, drag to pan.
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewModal;