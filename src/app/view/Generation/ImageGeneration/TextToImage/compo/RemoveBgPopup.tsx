'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import { X } from 'lucide-react';

interface RemoveBgPopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultImage?: string | null;
  onCompleted?: () => void;
}

const RemoveBgPopup = ({ isOpen, onClose, defaultImage, onCompleted }: RemoveBgPopupProps) => {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [model, setModel] = useState<'851-labs/background-remover' | 'lucataco/remove-bg'>('851-labs/background-remover');
  const [format, setFormat] = useState<'png' | 'jpg' | 'jpeg' | 'webp'>('png');
  const [reverse, setReverse] = useState(false);
  const [threshold, setThreshold] = useState<number>(0);
  const [backgroundType, setBackgroundType] = useState<string>('rgba');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (defaultImage) setImage(defaultImage); }, [defaultImage]);
  if (!isOpen) return null;

  const run = async () => {
    if (!image) return;
    setLoading(true);
    try {
      let isPublic = false;
      try { isPublic = (localStorage.getItem('isPublicGenerations') === 'true'); } catch {}
      const body: any = { image, format, isPublic, model };
      if (reverse) body.reverse = true;
      if (threshold) body.threshold = threshold;
      if (backgroundType) body.background_type = backgroundType;
      await axiosInstance.post('/api/replicate/remove-bg', body);
      if (onCompleted) onCompleted();
      onClose();
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.response?.data?.message || e?.message || 'Remove background failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 max-w-2xl w-full" onClick={(e)=>e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Remove Background</h2>
            <button className="p-2 hover:bg-white/10 rounded" onClick={onClose}><X className="w-5 h-5 text-white"/></button>
          </div>
          <div className="p-4 space-y-4">
            {!image && (
              <div className="rounded-xl p-6 text-center bg-white/5 border border-white/10">
                <div className="text-white/70 text-sm mb-2">Paste a Data URL here or select a file</div>
                <input type="file" accept="image/*" onChange={async (e)=>{
                  const f = e.currentTarget.files?.[0]; if (!f) return;
                  const max = 2 * 1024 * 1024; if (f.size > max) { alert('Max 2MB'); return; }
                  const fr = new FileReader(); fr.onload = ()=> setImage(String(fr.result||'')); fr.readAsDataURL(f);
                }} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm text-white/80">Model</label>
                <select value={model} onChange={(e)=>setModel(e.target.value as any)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm">
                  <option value="851-labs/background-remover">851-labs/background-remover</option>
                  <option value="lucataco/remove-bg">lucataco/remove-bg</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/80">Format</label>
                <select value={format} onChange={(e)=>setFormat(e.target.value as any)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm">
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WEBP</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/80">Background Type</label>
                <input value={backgroundType} onChange={(e)=>setBackgroundType(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
              </div>
              <div>
                <label className="text-sm text-white/80">Threshold (0-1)</label>
                <input type="number" min={0} max={1} step={0.05} value={threshold} onChange={(e)=>setThreshold(Number(e.target.value)||0)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
              </div>
              <div className="flex items-end gap-2">
                <input id="rev" type="checkbox" checked={reverse} onChange={(e)=>setReverse(e.target.checked)} />
                <label htmlFor="rev" className="text-sm text-white/80">Reverse (remove foreground)</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={run} disabled={loading || !image} className="flex-1 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white px-4 py-2 rounded-lg disabled:opacity-50">{loading ? 'Running...' : 'Run'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RemoveBgPopup;


