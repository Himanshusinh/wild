"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { toDirectUrl, toMediaProxy } from "@/lib/thumb"

interface ImageData {
  imageUrl: string
  prompt?: string
  generationId?: string
  creator?: { username?: string; photoURL?: string }
}

const DEFAULT_IMAGE_URL =
  "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026"

const TARGET_IMAGE_COUNT = 6

const fallbackImages: ImageData[] = Array.from({ length: TARGET_IMAGE_COUNT }).map((_, i) => ({
  imageUrl: `${DEFAULT_IMAGE_URL}&v=${i}`,
  prompt: "Featured creation",
}))

const normalizeMediaUrl = (url?: string): string | undefined => {
  if (!url || typeof url !== "string") return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  if (trimmed.includes("replicate.delivery") || trimmed.includes("replicate.com")) {
    return undefined
  }
  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes("googleusercontent.com") || trimmed.includes("googleapis.com")) {
      return `/api/proxy/external?url=${encodeURIComponent(trimmed)}`
    }
    return trimmed
  }
  if (trimmed.startsWith("/api/")) return trimmed
  if (!trimmed.startsWith("/")) return toMediaProxy(trimmed)
  return toDirectUrl(trimmed)
}

const resolveItemImageUrl = (item: any): string | undefined => {
  const mediaCandidates = [
    item?.url,
    item?.webpUrl,
    item?.avifUrl,
    item?.thumbnailUrl,
    item?.storagePath,
  ]

  for (const candidate of mediaCandidates) {
    const resolved = normalizeMediaUrl(candidate)
    if (resolved) return resolved
  }

  if (Array.isArray(item?.images)) {
    for (const image of item.images) {
      const nestedCandidates = [
        image?.url,
        image?.webpUrl,
        image?.avifUrl,
        image?.thumbnailUrl,
        image?.storagePath,
      ]
      for (const candidate of nestedCandidates) {
        const resolved = normalizeMediaUrl(candidate)
        if (resolved) return resolved
      }
    }
  }

  return undefined
}

const fetchArtStationImages = async (): Promise<ImageData[]> => {
  try {
    const url = new URL("/api/feed", window.location.origin)
    url.searchParams.set("mode", "image")
    url.searchParams.set("limit", "18")
    url.searchParams.set("sortBy", "aestheticScore")
    url.searchParams.set("sortOrder", "desc")

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status}`)
    }

    const data = await response.json()
    const payload = data?.data || data
    const items = Array.isArray(payload?.items) ? payload.items : []

    return items
      .map((item: any) => {
        const imageUrl = resolveItemImageUrl(item)
        if (!imageUrl) return null
        return {
          imageUrl,
          prompt: item?.prompt || item?.title || "Featured creation",
          generationId: item?.id,
          creator: item?.creator,
        } satisfies ImageData
      })
      .filter((item: ImageData | null): item is ImageData => Boolean(item))
  } catch (error) {
    console.error("[Signup] Failed to fetch ArtStation gallery images:", error)
  }

  return []
}

export default function RightImageGallery() {
  const [images, setImages] = useState<ImageData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024
    if (!isDesktop) {
      setIsLoading(false)
      return
    }

    const preload = (url?: string) => {
      if (!url) return
      const img = new window.Image()
      img.src = url
    }

    const fetchImages = async () => {
      try {
        const list = await fetchArtStationImages()

        const finalList = list.length > 0 ? [...list] : [...fallbackImages]
        const seed = [...finalList]
        while (finalList.length < TARGET_IMAGE_COUNT) {
          finalList.push(seed[finalList.length % seed.length])
        }
        setImages(finalList)
        finalList.forEach((item) => preload(item.imageUrl))
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [])

  const columns = useMemo(() => {
    const source = images.length > 0 ? images : fallbackImages
    const buildColumn = (start: number, count: number) =>
      Array.from({ length: count }).map((_, idx) => source[(start + idx) % source.length])

    return [buildColumn(0, 6), buildColumn(3, 6)]
  }, [images])

  const creatorInfo = images[0]?.creator
  const colAHeights = [260, 220, 320, 200, 240, 280]
  const colBHeights = [300, 200, 260, 340, 220, 260]

  return (
    <div className="absolute inset-0 overflow-hidden m-2 rounded-lg">
      <div className="relative w-full h-full">
        {/* Top/bottom blend mask for smoother visual integration */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background:
              "linear-gradient(to bottom, #1C1C20 0%, rgba(28,28,32,0) 14%, rgba(28,28,32,0) 86%, #1C1C20 100%)",
          }}
        />

        <div className="absolute top-5 right-5 z-30 rounded-full border border-white/20 bg-white/8 px-3 py-1.5 backdrop-blur-md">
          <p className="text-[11px] font-medium text-white flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            2,400+ creators active
          </p>
        </div>

      <div className={`w-full h-full px-2 py-2 flex gap-2 ${isLoading ? "opacity-70" : "opacity-100"} transition-opacity duration-500`}>
          <GalleryColumn
            items={columns[0]}
            heights={colAHeights}
            direction="down"
            duration={32}
            badges={{ 0: "Design", 3: "Motion" }}
          />
          <GalleryColumn
            items={columns[1]}
            heights={colBHeights}
            direction="up"
            duration={34}
            badges={{ 1: "Branding", 4: "Editorial" }}
          />
        </div>

        {creatorInfo && (creatorInfo.username || creatorInfo.photoURL) && (
          <div className="absolute bottom-6 right-6 text-white z-30 pointer-events-none">
            <p className="text-xs font-medium">
              Created by: <span className="font-bold">@{creatorInfo.username || "wildminduser"}</span> with WildMind AI
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes wmScrollUp {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(calc(-50% - 5px));
          }
        }

        @keyframes wmScrollDown {
          0% {
            transform: translateY(calc(-50% - 5px));
          }
          100% {
            transform: translateY(0%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wm-track {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function GalleryColumn({
  items,
  heights,
  direction,
  duration,
  badges,
}: {
  items: ImageData[]
  heights: number[]
  direction: "up" | "down"
  duration: number
  badges?: Record<number, string>
}) {
  const list = [...items, ...items]
  const doubledHeights = [...heights, ...heights]

  return (
    <div className="wm-col w-1/2 min-w-0 h-full overflow-hidden relative">
      <div
        className="wm-track absolute left-0 top-0 w-full flex flex-col gap-[10px] will-change-transform"
        style={{
          animationDuration: `${duration}s`,
          animationName: direction === "down" ? "wmScrollDown" : "wmScrollUp",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }}
        aria-hidden="true"
      >
        {list.map((img, idx) => (
          <div
            className="wm-card w-full rounded-lg overflow-hidden relative bg-[#1a1a1f] shrink-0"
            style={{ height: `${doubledHeights[idx % doubledHeights.length]}px` }}
            key={`${img.imageUrl}-${idx}`}
          >
            <Image
              src={img.imageUrl || DEFAULT_IMAGE_URL}
              alt={img.prompt || "Featured creation"}
              fill
              className="object-cover"
              priority={idx < 2}
              loading={idx < 2 ? "eager" : "lazy"}
              unoptimized
            />
            {badges?.[idx % heights.length] && (
              <div className="absolute left-2 bottom-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 px-2 py-1">
                <p className="text-[10px] text-white font-medium flex items-center gap-1">
                  <span>✦</span> {badges[idx % heights.length]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
