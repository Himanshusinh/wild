/**
 * Default public canvas shown on the Wildmind marketing homepage (Infinite Canvas section).
 * Same project as `wildmindcanvas/core/constants/homepageShowcase.ts` — must share
 * `PUBLIC_CANVAS_SNAPSHOT_PROJECT_IDS` (or `publicSnapshotRead`) on the API gateway so
 * logged-out snapshot reads work.
 *
 * Override per deploy with WILDMIND_CANVAS_SHOWCASE_URL or NEXT_PUBLIC_WILDMIND_CANVAS_SHOWCASE_URL
 * (e.g. production studio origin).
 */
export const HOMEPAGE_SHOWCASE_PROJECT_ID = "V8Q8h9Ar1AllNsEW1AVW";

export const DEFAULT_PUBLIC_CANVAS_SHOWCASE_EMBED_URL =
  `https://onstaging-studios.wildmindai.com/embed?projectId=${HOMEPAGE_SHOWCASE_PROJECT_ID}&view=1&mode=view&showcase=1`;
