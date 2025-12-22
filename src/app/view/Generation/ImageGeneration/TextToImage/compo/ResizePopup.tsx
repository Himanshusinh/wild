'use client';

import React, { useEffect, useRef, useState } from 'react';
import { downloadFileWithNaming } from '@/utils/downloadUtils';

type ResizeModel = 'Lanczos' | 'Bicubic' | 'Nearest';

interface ResizePopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultImage?: string | null;
  onCompleted?: (url?: string) => void;
  inline?: boolean;
}

const ResizePopup: React.FC<ResizePopupProps> = ({ isOpen, onClose, defaultImage, onCompleted, inline }) => {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [model, setModel] = useState<ResizeModel>('Lanczos');
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [originalRatio, setOriginalRatio] = useState<number>(1);
  const [output, setOutput] = useState<string | null>(null);
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(0.92);
  const [loading, setLoading] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { if (defaultImage) setImage(defaultImage); }, [defaultImage]);

  // Lock scroll (modal only)
  useEffect(() => {
    if (inline || !isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = (document.documentElement as HTMLElement).style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    (document.documentElement as HTMLElement).style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      (document.documentElement as HTMLElement).style.overscrollBehavior = prevOverscroll;
    };
  }, [isOpen, inline]);

  const onFile = (file: File) => {
    const max = 2 * 1024 * 1024; if (file.size > max) { alert('Max 2MB'); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const url = String(fr.result || '');
      setImage(url);
      // Get natural size to compute ratio
      const img = new Image();
      img.onload = () => {
        setOriginalRatio(img.width / img.height);
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = url;
    };
    fr.readAsDataURL(file);
  };

  const handleRun = async () => {
    if (!image) return;
    setLoading(true);
    try {
      // Client-side resize with canvas; model is advisory for future backend
      const src = await loadImage(image);
      const canvas = document.createElement('canvas');
      // Always keep the original resolution; only change encoding / file size.
      const targetW = originalWidth ?? width;
      const targetH = originalHeight ?? height;
      canvas.width = Math.max(1, Math.floor(targetW));
      canvas.height = Math.max(1, Math.floor(targetH));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Use imageSmoothingAlgorithm to mimic model choice
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = model === 'Lanczos' ? 'high' : model === 'Bicubic' ? 'medium' : 'low';
      ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
      const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
      const url = canvas.toDataURL(mime, quality);
      setOutput(url);
      if (onCompleted) onCompleted(url);
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.message || 'Resize failed');
    } finally {
      setLoading(false);
    }
  };

  const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

  const content = (
    <div className="p-4 space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) onFile(f); }}
      />
      {!image && (
        <div className="rounded-2xl px-8 py-10 text-center bg-white/5 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold text-white mb-1">Upload an image</h3>
          <p className="text-white/60 mb-6">PNG/JPG/WEBP up to 2 MB</p>
          <button onClick={() => fileRef.current?.click()} className="bg-white text-black px-5 py-2 rounded-xl hover:bg-white/90 transition">Select file</button>
        </div>
      )}

      {image && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/80">Model</label>
              <select value={model} onChange={(e)=> setModel(e.target.value as ResizeModel)} className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-9 text-white text-sm">
                <option className='text-white bg-black/70' value="Lanczos">Lanczos (high quality)</option>
                <option className='text-white bg-black/70' value="Bicubic">Bicubic</option>
                <option className='text-white bg-black/70' value="Nearest">Nearest</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/80">Width</label>
                <input type="number" min={1} value={width} onChange={(e)=>{
                  const v = Math.max(1, Number(e.target.value)||1);
                  setWidth(v);
                  if (keepAspect) setHeight(Math.round(v / originalRatio));
                }} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 h-9 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/80">Height</label>
                <input type="number" min={1} value={height} onChange={(e)=>{
                  const v = Math.max(1, Number(e.target.value)||1);
                  setHeight(v);
                  if (keepAspect) setWidth(Math.round(v * originalRatio));
                }} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 h-9 text-white text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="keep" type="checkbox" checked={keepAspect} onChange={(e)=> setKeepAspect(e.target.checked)} />
              <label htmlFor="keep" className="text-xs text-white/80">Keep aspect ratio</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/80">Format</label>
                <select value={format} onChange={(e)=> setFormat(e.target.value as any)} className="w-full bg-white/10 border border-white/10 rounded-xl px-3 h-8 text-white text-sm">
                  <option className='text-white bg-black/70' value="png">PNG</option>
                  <option className='text-white bg-black/70' value="jpg">JPG</option>
                  <option className='text-white bg-black/70' value="webp">WEBP</option>
                </select>
              </div>
              {/* <div>
                <label className="text-xs text-white/80">Quality (JPG/WEBP)</label>
                <input type="number" min={0.1} max={1} step={0.01} value={quality} onChange={(e)=> setQuality(Math.min(1, Math.max(0.1, Number(e.target.value)||0.92)))} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 h-9 text-white text-sm" />
              </div> */}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=> { setImage(null); setOutput(null); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 h-8 rounded-xl">Clear</button>
              <button onClick={handleRun} disabled={loading || !image} className="flex-1 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white px-3 h-8 rounded-xl disabled:opacity-50">{loading ? 'Resizing...' : 'Run'}</button>
            </div>
            </div>
          </div>
          {/* Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-md font-medium text-white">Original</h3>
                <div className="aspect-square bg-white/5 rounded-2xl ring-1 ring-white/10 overflow-hidden flex items-center justify-center p-2">
                  <img src={image} alt="Original" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-medium text-white">Resized Image</h3>
                <div className="aspect-square bg-white/5 rounded-2xl ring-1 ring-white/10 flex items-center justify-center overflow-hidden">
                  {output ? (
                    <img src={output} alt="Resized" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white/60">Click Run to resize</div>
                  )}
                </div>
              </div>
            </div>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (output) {
                      try {
                        await downloadFileWithNaming(output, null, 'image', 'resized');
                      } catch (error) {
                        console.error('Download failed:', error);
                      }
                    }
                  }}
                  className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 h-10 rounded-xl leading-10"
                >
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (inline) return content;
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 max-w-2xl w-full">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-white text-md font-semibold">Resize</h2>
            <button className="p-2 hover:bg-white/10 rounded" onClick={onClose}>✕</button>
          </div>
          {content}
        </div>
      </div>
    </>
  );
};

export default ResizePopup;


