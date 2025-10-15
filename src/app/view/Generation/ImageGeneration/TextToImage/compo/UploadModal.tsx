'use client';

import React from 'react';
import Image from 'next/image';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (urls: string[]) => void;
  historyEntries: any[];
  remainingSlots: number; // how many images can still be added (max 4 total)
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
};

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAdd, historyEntries, remainingSlots, onLoadMore, hasMore, loading }) => {
  const [tab, setTab] = React.useState<'library' | 'computer'>('library');
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [localUploads, setLocalUploads] = React.useState<string[]>([]);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setSelection(new Set());
      setLocalUploads([]);
      setTab('library');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (tab === 'library') {
      const chosen = Array.from(selection).slice(0, remainingSlots);
      if (chosen.length) onAdd(chosen);
      setSelection(new Set());
    } else {
      const chosen = localUploads.slice(0, remainingSlots);
      if (chosen.length) onAdd(chosen);
      setLocalUploads([]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-full text-sm ${tab === 'library' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('library')}>Upload from your library</button>
              <button className={`px-3 py-1.5 rounded-full text-sm ${tab === 'computer' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} onClick={() => setTab('computer')}>Upload from your computer</button>
            </div>
            <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
          </div>

          <div className="p-4">
            {tab === 'library' ? (
              <div>
                <div className="text-white/70 text-sm mb-3 ">Select up to {remainingSlots} image{remainingSlots === 1 ? '' : 's'} from your previously generated results</div>
                <div
                  ref={listRef}
                  onScroll={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    if (!onLoadMore || loading) return;
                    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
                    if (nearBottom && hasMore && !loading) onLoadMore();
                  }}
                  className="grid grid-cols-3 md:grid-cols-5 gap-3 h-[50vh] p-2 overflow-y-auto custom-scrollbar pr-1"
                >
                  {historyEntries.flatMap((entry: any) => ((entry?.images || []).map((im: any) => ({ entry, im })))).map(({ entry, im }: any) => {
                    const selected = selection.has(im.url);
                    const key = `${entry.id}-${im.id}`;
                    return (
                      <button key={key} onClick={() => {
                        const next = new Set(selection);
                        if (selected) next.delete(im.url); else next.add(im.url);
                        setSelection(next);
                      }} className={`relative w-full h-32 rounded-lg overflow-hidden ring-1 ${selected ? 'ring-white' : 'ring-white/20'} bg-black/50`}>
                        <Image src={im.url} alt="library" fill className="object-cover" />
                        {selected && <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full" />}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                      </button>
                    );
                  })}
                </div>
                {hasMore && (
                  <div className="flex items-center justify-center pt-3 text-white/60 text-xs">{loading ? 'Loading more…' : 'Scroll to load more'}</div>
                )}
                <div className="flex justify-end mt-0 gap-2">
                  <button className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-white/70 text-sm mb-3">Choose up to {remainingSlots} image{remainingSlots === 1 ? '' : 's'}</div>
                <div
                  ref={dropRef}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const slotsLeft = Math.max(0, remainingSlots - localUploads.length);
                    if (slotsLeft <= 0) return;
                    const files = Array.from(e.dataTransfer.files || []).slice(0, slotsLeft);
                    const maxSize = 2 * 1024 * 1024;
                    const urls: string[] = [];
                    for (const file of files) {
                      if (file.size > maxSize) continue;
                      const reader = new FileReader();
                      const asDataUrl: string = await new Promise((res) => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
                      urls.push(asDataUrl);
                    }
                    if (urls.length) { setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots)); }
                  }}
                  className={`border-2 border-dashed border-white/30 rounded-xl h-[52vh] flex cursor-pointer hover:border-white/60 overflow-y-auto custom-scrollbar ${localUploads.length > 0 ? 'items-start justify-start p-3' : 'items-center justify-center'}`}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = async () => {
                      const slotsLeft = Math.max(0, remainingSlots - localUploads.length);
                      if (slotsLeft <= 0) return;
                      const files = Array.from(input.files || []).slice(0, slotsLeft);
                      const maxSize = 2 * 1024 * 1024;
                      const urls: string[] = [];
                      for (const file of files) {
                        if (file.size > maxSize) { continue; }
                        const reader = new FileReader();
                        const asDataUrl: string = await new Promise((res) => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(file); });
                        urls.push(asDataUrl);
                      }
                      if (urls.length) { setLocalUploads(prev => [...prev, ...urls].slice(0, remainingSlots)); }
                    };
                    input.click();
                  }}
                >
                  {localUploads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-white/60 select-none ">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      <div className="mt-2 text-sm">Drop images here or click to browse</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3  w-full place-content-start">
                      {localUploads.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                          <Image src={url} alt={`upload-${idx}`} fill className="object-cover" />
                          <button
                            aria-label="Remove"
                            title="Remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalUploads(prev => prev.filter((u, i) => !(u === url && i === idx)));
                            }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                              <path d="M3 6h18" />
                              <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  <button className="px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={onClose}>Cancel</button>
                  <button className="px-4 py-2 rounded-full bg-white text-black hover:bg-gray-200" onClick={handleAdd}>Add</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;


