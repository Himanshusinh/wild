import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { getImageUrl } from '../routes'

// Types for items and categories
type CreationItem = {
  id: string
  src: string
  title: string
  date: string
  category: 'All' | 'Images' | 'Videos' | 'Video Projects' | 'Designs' | 'Audio'
}

const CATEGORIES: Array<CreationItem['category']> = [
  'All',
  'Images',
  'Videos',
  'Video Projects',
  'Designs',
  'Audio',
]

const MOCK_ITEMS: CreationItem[] = [
  { id: '1', src: getImageUrl('recentCreations', 'recent1'), title: 'The style is candid image...', date: 'July 24, 2025', category: 'Images' },
  { id: '2', src: getImageUrl('recentCreations', 'recent2'), title: 'The style is candid image...', date: 'July 24, 2025', category: 'Images' },
  { id: '3', src: getImageUrl('recentCreations', 'recent3'), title: 'The style is candid image...', date: 'July 24, 2025', category: 'Designs' },
  { id: '4', src: getImageUrl('recentCreations', 'recent4'), title: 'The style is candid image...', date: 'July 24, 2025', category: 'Videos' },
  { id: '5', src: getImageUrl('recentCreations', 'recent5'), title: 'The style is candid image...', date: 'July 24, 2025', category: 'Images' },
]

const Recentcreation: React.FC = () => {
  const [active, setActive] = useState<CreationItem['category']>('All')
  const [ratios, setRatios] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    if (active === 'All') return MOCK_ITEMS
    return MOCK_ITEMS.filter((i) => i.category === active)
  }, [active])

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 mt-32">
      {/* Heading */}
      <h3 className="text-white text-4xl md:text-4xl font-medium mb-4">Recent Creations</h3>

      {/* Filters + My creations aligned */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = cat === active
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={
                  `px-4 py-2 rounded-full text-sm transition ` +
                  (isActive
                    ? 'bg-white text-[#0b0f17]'
                    : 'bg-white/10 text-white/80 hover:bg-white/15')
                }
              >
                {cat}
              </button>
            )
          })}
        </div>
        <button className="text-white/80 hover:text-white text-sm ml-4 mr-4">
          My Creations <span className="opacity-70"></span>
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl bg-[#151a20]/80 ring-1 ring-white/10 hover:ring-white/20 transition p-4 flex flex-col gap-3"
          >
            <div className="relative h-[250px] rounded-xl overflow-hidden">
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover"
                onLoadingComplete={(img) => {
                  const w = img.naturalWidth || 1
                  const h = img.naturalHeight || 1
                  const g = gcd(w, h)
                  const rw = Math.round(w / g)
                  const rh = Math.round(h / g)
                  setRatios((prev) => ({ ...prev, [item.id]: `${rw}:${rh}` }))
                }}
              />
            </div>
            {/* Title and aspect ratio in one row */}
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-white text-sm truncate">{item.title}</div>
              <div className="text-white/70 text-sm flex-shrink-0">{ratios[item.id] ?? ''}</div>
            </div>
            <div className="text-white/60 text-xs">{item.date}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Recentcreation
