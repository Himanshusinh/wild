"use client"

import { useEffect, useMemo, useState } from "react"
import { toDirectUrl, toMediaProxy } from "@/lib/thumb"

interface ImageData {
  imageUrl: string
  prompt?: string
  generationId?: string
  creator?: { username?: string; photoURL?: string }
  width?: number
  height?: number
}

const DEFAULT_IMAGE_URL =
  "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/vyom_static_landigpage%2Fsignup%2F3.png?alt=media&token=e67afc08-10e0-4710-b251-d9031ef14026"

const TARGET_IMAGE_COUNT = 20
const SIGNUP_GALLERY_CACHE_KEY = "wildmind_signup_gallery_v1"

const fallbackImages: ImageData[] = Array.from({ length: TARGET_IMAGE_COUNT }).map((_, i) => ({
  imageUrl: `${DEFAULT_IMAGE_URL}&v=${i}`,
  prompt: "Featured creation",
}))

const dedupeImages = (items: ImageData[]): ImageData[] => {
  const uniqueMap = new Map<string, ImageData>()
  for (const item of items) {
    const key = canonicalImageKey(item.imageUrl)
    if (!key || uniqueMap.has(key)) continue
    uniqueMap.set(key, item)
  }
  return Array.from(uniqueMap.values())
}

const normalizeSignupShowcasePayload = (payload: any): ImageData[] => {
  const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
  return items
    .map((item: any) => ({
      imageUrl:
        normalizeMediaUrl(item?.imageUrl) ||
        normalizeMediaUrl(item?.images?.[0]?.url) ||
        normalizeMediaUrl(item?.images?.[0]?.originalUrl),
      prompt: item?.prompt || item?.title || "Featured creation",
      generationId: item?.generationId || item?.id,
      creator: item?.creator || item?.createdBy,
      width: toPositiveNumber(item?.width),
      height: toPositiveNumber(item?.height),
    }))
    .filter((item: ImageData) => !!item.imageUrl)
}

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

const canonicalImageKey = (url?: string): string => {
  if (!url) return ""
  try {
    const u = new URL(url, window.location.origin)
    // External proxy URLs: canonicalize by their real target URL
    const proxiedExternal = u.searchParams.get("url")
    if (proxiedExternal) {
      return decodeURIComponent(proxiedExternal).split("?")[0]!.trim().toLowerCase()
    }
    // Other URLs: ignore query params for dedup
    return `${u.origin}${u.pathname}`.trim().toLowerCase()
  } catch {
    return String(url).split("?")[0]!.trim().toLowerCase()
  }
}

const toPositiveNumber = (value: any): number | undefined => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const resolveItemMedia = (item: any): { imageUrl?: string; width?: number; height?: number } => {
  const candidates = [
    item,
    ...(Array.isArray(item?.images) ? item.images : []),
    ...(Array.isArray(item?.videos) ? item.videos : []),
  ]

  for (const media of candidates) {
    const mediaCandidates = [
      media?.url,
      media?.storagePath,
      media?.avifUrl,
      media?.webpUrl,
      media?.thumbnailUrl,
    ]
    for (const candidate of mediaCandidates) {
      const resolved = normalizeMediaUrl(candidate)
      if (!resolved) continue
      const width =
        toPositiveNumber(media?.width) ||
        toPositiveNumber(media?.dimensions?.width) ||
        toPositiveNumber(media?.metadata?.width)
      const height =
        toPositiveNumber(media?.height) ||
        toPositiveNumber(media?.dimensions?.height) ||
        toPositiveNumber(media?.metadata?.height)
      return { imageUrl: resolved, width, height }
    }
  }

  return {}
}

const fetchArtStationImages = async (): Promise<ImageData[]> => {
  try {
    const response = await fetch("/api/signup-showcase", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "default",
    })
    if (!response.ok) return []
    const data = await response.json()
    return dedupeImages(normalizeSignupShowcasePayload(data))
  } catch (error) {
    console.error("[Signup] Failed to fetch ArtStation gallery images:", error)
  }

  return []
}

const fetchSignupRandomImage = async (): Promise<ImageData | null> => {
  try {
    const response = await fetch("/api/signup-image", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    if (!response.ok) return null
    const data = await response.json()
    const payload = data?.data
    if (!payload?.imageUrl) return null
    return {
      imageUrl: payload.imageUrl,
      prompt: payload?.prompt || "Featured creation",
      generationId: payload?.generationId,
      creator: payload?.creator,
      width: toPositiveNumber(payload?.width),
      height: toPositiveNumber(payload?.height),
    }
  } catch {
    return null
  }
}

export default function RightImageGallery({ initialImages = [] }: { initialImages?: ImageData[] }) {
  const initialUniqueImages = useMemo(
    () => dedupeImages(initialImages),
    [initialImages],
  )
  const [images, setImages] = useState<ImageData[]>(initialUniqueImages.slice(0, TARGET_IMAGE_COUNT))
  const [isLoading, setIsLoading] = useState(initialUniqueImages.length === 0)

  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024
    if (!isDesktop) {
      setIsLoading(false)
      return
    }

    try {
      const cached = window.sessionStorage.getItem(SIGNUP_GALLERY_CACHE_KEY)
      if (cached) {
        const parsed = dedupeImages(JSON.parse(cached))
          .filter((item) => !!item?.imageUrl)
        if (parsed.length > 0) {
          setImages(parsed.slice(0, TARGET_IMAGE_COUNT))
          setIsLoading(false)
        }
      }
    } catch {
      // ignore invalid storage cache
    }

    const preload = (url?: string) => {
      if (!url) return
      const img = new window.Image()
      img.src = url
    }

    const fetchImages = async () => {
      try {
        const feedList = await fetchArtStationImages()
        let finalList = feedList.length > 0 ? [...feedList] : []

        // Fill with randomized signup images to avoid repetition if feed is homogeneous.
        if (finalList.length < TARGET_IMAGE_COUNT) {
          const extraResults = await Promise.allSettled(
            Array.from({ length: TARGET_IMAGE_COUNT }).map(() => fetchSignupRandomImage())
          )
          const seen = new Set(finalList.map((it) => canonicalImageKey(it.imageUrl)))
          for (const r of extraResults) {
            const val = r.status === "fulfilled" ? r.value : null
            if (!val?.imageUrl) continue
            const key = canonicalImageKey(val.imageUrl)
            if (seen.has(key)) continue
            seen.add(key)
            finalList.push(val)
          }
        }

        if (finalList.length === 0) {
          finalList = initialUniqueImages.length > 0 ? [...initialUniqueImages] : [...fallbackImages]
        }

        finalList = dedupeImages(finalList)

        while (finalList.length < TARGET_IMAGE_COUNT) {
          const i = finalList.length
          finalList.push({
            imageUrl: `https://picsum.photos/seed/wildmind-signup-${i}/1200/900`,
            prompt: "Featured creation",
            width: 1200,
            height: 900,
          })
        }
        const bounded = finalList.slice(0, TARGET_IMAGE_COUNT)
        setImages(bounded)
        try {
          window.sessionStorage.setItem(SIGNUP_GALLERY_CACHE_KEY, JSON.stringify(finalList))
        } catch {
          // ignore storage failures
        }
        bounded.forEach((item) => preload(item.imageUrl))
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
  }, [initialUniqueImages])

  const columns = useMemo(() => {
    const source = images.length > 0 ? images : fallbackImages
    // Hard-split unique pool so the same image is never in both columns.
    const midpoint = Math.floor(source.length / 2)
    const left = source.slice(0, midpoint)
    const right = source.slice(midpoint)
    return [left, right]
  }, [images])

  const creatorInfo = images[0]?.creator

  return (
    <div className="absolute inset-0 overflow-hidden m-0 rounded-lg">
      <div className="relative w-full h-full">
        {/* Top/bottom blend mask for smoother visual integration */}
        <div
          className="pointer-events-none absolute inset-0 z-20"
          // style={{
          //   background:
          //     "linear-gradient(to bottom, #1C1C20 0%, rgba(28,28,32,0) 14%, rgba(28,28,32,0) 86%, #1C1C20 100%)",
          // }}
        />

        {/* <div className="absolute top-5 right-5 z-30 rounded-full border border-white/20 bg-white/8 px-3 py-1.5 backdrop-blur-md">
          <p className="text-[11px] font-medium text-white flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            2,400+ creators active
          </p>
        </div> */}

      <div className={`w-full h-full px-2 py-0 flex gap-2 ${isLoading ? "opacity-70" : "opacity-100"} transition-opacity duration-500`}>
          <GalleryColumn
            items={columns[0]}
            direction="down"
            duration={42}
          />
          <GalleryColumn
            items={columns[1]}
            direction="up"
            duration={46}
          />
        </div>

        {/* {creatorInfo && (creatorInfo.username || creatorInfo.photoURL) && (
          <div className="absolute bottom-6 right-6 text-white z-30 pointer-events-none">
            <p className="text-xs font-medium">
              Created by: <span className="font-bold">@{creatorInfo.username || "wildminduser"}</span> with WildMind AI
            </p>
          </div>
        )} */}
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
  direction,
  duration,
}: {
  items: ImageData[]
  direction: "up" | "down"
  duration: number
}) {
  const list = [...items, ...items]

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
            className="wm-card w-full rounded-md overflow-hidden relative bg-[#1a1a1f] shrink-0"
            key={`${img.imageUrl}-${idx}`}
          >
            <img
              src={img.imageUrl || DEFAULT_IMAGE_URL}
              alt={img.prompt || "Featured creation"}
              className="w-full h-auto block object-cover"
              loading={idx < 2 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
