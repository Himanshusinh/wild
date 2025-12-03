'use client';

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import ArtStationPreview, { PublicItem } from '@/components/ArtStationPreview'
import { API_BASE } from '../routes'

export default function CommunityCreations({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<PublicItem[]>([])
  const [loading, setLoading] = useState<boolean>(true);
  const [preview, setPreview] = useState<PublicItem | null>(null)
  
  // Fetch from our new cached API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/community-showcase')
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        if (json.responseStatus === 'success' && Array.isArray(json.data)) {
          setItems(json.data)
        }
      } catch (e) {
        console.error('Failed to load community creations', e)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  // Prepare cards for Masonry
  const cards = useMemo(() => {
    return items.map(item => {
      // Find the best image
      const img = item.images?.[0]
      return {
        item,
        media: img || { id: '0', url: '' },
        kind: 'image' as const
      }
    })
  }, [items])

  // Limit to 20 items for the homepage
  const limitedCards = useMemo(() => cards.slice(0, 20), [cards])

  return (
    <section className={`w-full ${className}`}>
      <h2 className="text-xl md:text-4xl font-medium text-white md:mb-5 mb-1">
        Community Creations
      </h2>

      {/* Masonry Grid */}
      <div className="relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/60 mt-2">Loading creations...</p>
            </div>
          </div>
        ) : limitedCards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">No community creations to display</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
            {limitedCards.map((card, idx) => {
              const { item, media } = card
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid relative w-full mb-2 cursor-pointer group"
                  onClick={() => setPreview(item)}
                >
                  {/* Image */}
                  <img
                    src={media.url}
                    alt={item.prompt || ''}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-contain block rounded-xl"
                  />
                  
                  {/* Hover Overlay (ArtStation style) */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-xl" />
                </div>
              )
            })}
          </div>
        )}

        {/* Explore Overlay */}
        {!loading && limitedCards.length > 0 && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[150px] flex items-center justify-center z-20 pointer-events-auto">
              <button
                onClick={() => router.push('/view/ArtStation')}
                className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors shadow-lg"
              >
                Explore Art Station
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <ArtStationPreview
          preview={{ kind: 'image', url: preview.images?.[0]?.url || '', item: preview }}
          onClose={() => setPreview(null)}
          onConfirmDelete={async () => {}} // Read-only view
          currentUid={null} // Read-only view
          currentUser={null}
          cards={cards} // Allow navigation through the set
          likedCards={new Set()} // No interaction in this view
          toggleLike={() => {}}
        />
      )}
    </section>
  );
}
