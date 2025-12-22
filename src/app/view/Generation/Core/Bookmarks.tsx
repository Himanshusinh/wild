'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentView } from '@/store/slices/uiSlice';
import axiosInstance from '@/lib/axiosInstance';
import { toDirectUrl, toMediaProxy } from '@/lib/thumb';
import type { PublicItem } from '@/components/ArtStationPreview';

type EngagementItem = { generationId: string; createdAt?: string };
type Tab = 'bookmarks' | 'likes';

const formatDate = (input?: string) => {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const pickThumbnail = (item: PublicItem): string | null => {
  const img = (item.images && item.images[0]) || null;
  if (!img) return null;
  return (
    img.thumbnailUrl ||
    img.webpUrl ||
    img.avifUrl ||
    img.url ||
    (typeof img.storagePath === 'string' && img.storagePath ? img.storagePath : null)
  );
};

const getFullImageUrl = (item: PublicItem): string | null => {
  const img = (item.images && item.images[0]) || null;
  if (!img) return null;

  const src = img.url || img.storagePath || null;
  if (!src) return null;

  // Prefer Zata / storage paths via proxy, then direct URL
  if (img.storagePath) {
    return (
      toMediaProxy(img.storagePath) ||
      toDirectUrl(img.storagePath) ||
      img.storagePath
    );
  }

  if (typeof src === 'string' && src.startsWith('http')) {
    return src;
  }

  return toMediaProxy(src) || toDirectUrl(src) || src;
};

const getCreatorAvatar = (item: PublicItem): string | null => {
  const cb: any = item.createdBy || {};
  const photo =
    cb.photoURL ||
    cb.photoUrl ||
    cb.avatarUrl ||
    cb.avatarURL ||
    cb.profileImageUrl ||
    null;
  if (!photo) return null;
  return `/api/proxy/external?url=${encodeURIComponent(String(photo))}`;
};

const Bookmarks = () => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<Tab>('bookmarks');
  const [bookmarks, setBookmarks] = useState<PublicItem[]>([]);
  const [likes, setLikes] = useState<PublicItem[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<PublicItem | null>(null);

  const handleBackToGeneration = () => {
    dispatch(setCurrentView('generation'));
  };

  useEffect(() => {
    const fetchEngagementList = async (
      type: 'bookmarks' | 'likes',
      setter: React.Dispatch<React.SetStateAction<PublicItem[]>>,
      setLoading: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      try {
        setLoading(true);
        setError(null);

        const path =
          type === 'bookmarks'
            ? '/api/engagement/me/bookmarks?limit=50'
            : '/api/engagement/me/likes?limit=50';

        const res = await axiosInstance.get(path);
        const payload = res.data?.data || res.data || {};
        const items: EngagementItem[] = payload.items || [];

        if (!items.length) {
          setter([]);
          return;
        }

        const detailPromises = items.map(async (entry) => {
          try {
            const detailRes = await axiosInstance.get(`/api/feed/${entry.generationId}`);
            const data = detailRes.data?.data || detailRes.data || {};
            const item = data.item as any;
            if (!item) return null;

            const normalizeDate = (d: any) =>
              typeof d === 'string'
                ? d
                : d && typeof d === 'object' && typeof d._seconds === 'number'
                  ? new Date(d._seconds * 1000).toISOString()
                  : undefined;

            const normalized: PublicItem = {
              ...item,
              id: String(item.id || entry.generationId),
              createdAt: normalizeDate(item.createdAt) || item.createdAt,
              updatedAt: normalizeDate(item.updatedAt) || item.updatedAt,
              aspectRatio: item.aspect_ratio || item.aspectRatio || item.frameSize,
              frameSize: item.frameSize || item.aspect_ratio || item.aspectRatio,
            };

            return normalized;
          } catch (e) {
            console.warn('[Bookmarks] Failed to load generation detail', entry.generationId, e);
            return null;
          }
        });

        const detailedItems = (await Promise.all(detailPromises)).filter(
          (it): it is PublicItem => !!it
        );

        setter(detailedItems);
      } catch (e) {
        console.error('[Bookmarks] Failed to load engagement list', type, e);
        setError('Failed to load your saved generations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEngagementList('bookmarks', setBookmarks, setLoadingBookmarks);
    fetchEngagementList('likes', setLikes, setLoadingLikes);
  }, []);

  const isLoading = activeTab === 'bookmarks' ? loadingBookmarks : loadingLikes;
  const items = activeTab === 'bookmarks' ? bookmarks : likes;

  const title = useMemo(
    () => (activeTab === 'bookmarks' ? 'Bookmarked generations' : 'Liked generations'),
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-[#07070B] text-theme-primary p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToGeneration}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Your ArtStation profile</h1>
            <p className="text-sm opacity-70">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm bg-white/5 rounded-full px-1 py-1">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              activeTab === 'bookmarks' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Bookmarks
            {bookmarks.length > 0 && (
              <span className="ml-1 text-xs opacity-80">{bookmarks.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              activeTab === 'likes' ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            Likes
            {likes.length > 0 && <span className="ml-1 text-xs opacity-80">{likes.length}</span>}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px] text-sm text-white/70">
          Loading your {activeTab === 'bookmarks' ? 'bookmarks' : 'likes'}...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="opacity-50">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">
            {activeTab === 'bookmarks' ? 'No bookmarks yet' : 'No likes yet'}
          </h3>
          <p className="text-sm opacity-70 mb-6 max-w-md">
            {activeTab === 'bookmarks'
              ? 'Bookmark your favorite public generations from ArtStation to see them here.'
              : 'Like public generations on ArtStation to see them collected here.'}
          </p>
          <button
            onClick={handleBackToGeneration}
            className="bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white px-6 py-3 rounded-full font-medium transition"
          >
            Go back to generate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {items.map((item) => {
            const thumb = pickThumbnail(item);
            if (!thumb) return null;

            const created = formatDate(item.createdAt);
            const creator =
              item.createdBy?.username ||
              item.createdBy?.displayName ||
              'Unknown creator';
            const avatar = getCreatorAvatar(item);

            return (
              <a
                key={item.id}
                href={`/view/ArtStation?gen=${encodeURIComponent(item.id)}`}
                onClick={(e) => {
                  e.preventDefault();
                  setPreviewItem(item);
                }}
                className="group relative flex flex-col bg-white/5/60 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-200 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
              >
                {/* Thumbnail */}
                <div className="relative w-full pt-[70%] bg-black/50 overflow-hidden">
                  <Image
                    src={thumb}
                    alt={item.prompt || 'Generation'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Meta */}
                <div className="p-3.5 flex flex-col gap-2.5">
                  {/* Prompt */}
                  <p className="text-[13px] leading-snug text-white/90 line-clamp-2">
                    {item.prompt || 'No prompt available'}
                  </p>

                  {/* Creator + date */}
                  <div className="flex items-center justify-between gap-3 text-[11px] text-white/60">
                    <div className="flex items-center gap-2 min-w-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={creator}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] uppercase">
                          {(creator || 'U').slice(0, 1)}
                        </div>
                      )}
                      <span className="truncate">{creator}</span>
                    </div>
                    <span className="whitespace-nowrap">{created || 'Unknown date'}</span>
                  </div>

                  {/* Type pill */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
                      {item.generationType || 'Image'}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Lightweight fullscreen preview for bookmarked / liked item */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center px-3"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] bg-[#05050a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: media */}
            <div className="relative md:w-3/5 w-full bg-black/60 flex items-center justify-center max-h-[90vh]">
              {(() => {
                const full = getFullImageUrl(previewItem) || pickThumbnail(previewItem);
                if (!full) return null;
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={full}
                      alt={previewItem.prompt || 'Generation'}
                      className="max-h-[90vh] max-w-full h-auto w-auto object-contain"
                    />
                  </div>
                );
              })()}
            </div>

            {/* Right: meta */}
            <div className="md:w-2/5 w-full p-4 md:p-5 flex flex-col gap-4 text-white overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const creatorName =
                      previewItem.createdBy?.username ||
                      previewItem.createdBy?.displayName ||
                      'Unknown creator';
                    const avatar = getCreatorAvatar(previewItem);
                    return (
                      <>
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={creatorName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs uppercase">
                            {creatorName.slice(0, 1)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{creatorName}</div>
                          <div className="text-[11px] text-white/60">
                            {formatDate(previewItem.createdAt || previewItem.updatedAt || '')}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Prompt */}
              {previewItem.prompt && (
                <div className="mt-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">
                    Prompt
                  </div>
                  <div className="text-sm text-white/90 whitespace-pre-line line-clamp-6">
                    {previewItem.prompt}
                  </div>
                </div>
              )}

              {/* Type and actions */}
              <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-white/70">
                  {previewItem.generationType || 'Image'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreviewItem(null);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/15 border border-white/15 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = `/view/ArtStation?gen=${encodeURIComponent(
                        previewItem.id
                      )}`;
                    }}
                    className="px-3.5 py-1.5 rounded-full text-xs bg-white text-black hover:bg-white/90 transition-colors"
                  >
                    Open in ArtStation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
