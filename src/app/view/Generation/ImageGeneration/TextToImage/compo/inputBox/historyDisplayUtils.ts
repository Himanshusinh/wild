import type { HistoryEntry } from "@/types/history";
import { toDirectUrl } from "@/lib/thumb";

/** Valid CSS aspect-ratio for grid tiles (invalid values collapse to 0 height → "empty" days). */
export const toGridAspectRatioCss = (frameSize?: string): string => {
  const raw = String(frameSize || "1:1").trim().toLowerCase();
  if (
    !raw ||
    raw === "auto" ||
    raw === "match_input_image" ||
    raw === "match input image"
  ) {
    return "1 / 1";
  }
  const normalized = raw.replace(/\s+/g, "");
  const parts = normalized.includes(":")
    ? normalized.split(":")
    : normalized.split("x");
  if (parts.length === 2) {
    const a = parseFloat(parts[0]);
    const b = parseFloat(parts[1]);
    if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
      return `${a} / ${b}`;
    }
  }
  return "1 / 1";
};

/** Resolved URL for a history image tile (must stay in sync with grid render). */
export const getHistoryImageDisplaySrc = (image: any): string => {
  if (!image) return "";
  const pick = [
    image.thumbnailUrl,
    image.avifUrl,
    image.webpUrl,
    image.url,
    image.originalUrl,
    image.firebaseUrl,
  ]
    .map((x) => String(x || "").trim())
    .find((x) => x.length > 0);
  if (pick) return pick;
  const sp = image?.storagePath;
  if (
    typeof sp === "string" &&
    sp.length > 0 &&
    !sp.includes("_thumb.avif")
  ) {
    let basePath = sp.replace(/_thumb\.avif$/i, "").replace(/\.avif$/i, "");
    if (!basePath.match(/\.(jpg|jpeg|png|webp)$/i)) basePath += ".jpg";
    const built = toDirectUrl(basePath.replace(/^\//, ""));
    return built && built.length > 0 ? built : "";
  }
  return "";
};

const historyImageHasRenderableSource = (image: any): boolean =>
  getHistoryImageDisplaySrc(image).length > 0;

/** Tile count that will actually be rendered for a day (after entry filter). */
export const countGalleryCellsForEntries = (entries: HistoryEntry[]): number => {
  let n = 0;
  for (const e of entries) {
    const imgs = Array.isArray((e as any)?.images) ? (e as any).images : [];
    n += imgs.length;
  }
  return n;
};

export const historyEntryContributesGalleryTiles = (entry: any): boolean => {
  const st = String(entry?.status || "");
  const imgs = Array.isArray(entry?.images) ? entry.images : [];
  if (st === "generating" || st === "pending") {
    return imgs.length > 0;
  }
  if (imgs.length === 0) return false;
  if (st === "failed") return true;
  return imgs.some(historyImageHasRenderableSource);
};
