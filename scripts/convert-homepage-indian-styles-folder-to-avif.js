/**
 * Convert raster images under:
 *   public/HomePage/creativeStyle/indian-styles/<folder>/
 * to AVIF under:
 *   public/homepage/creativeStyle/indian-styles/<stateSlug>/...
 *
 * For Arunachal, the app expects a nested segment (arunachal/arunachal/<style>/v{n}.avif).
 * Source layouts may be either:
 *   - arunachal/<style>/file.jpg
 *   - arunachal/arunachal/<style>/file.jpg
 *
 * Usage:
 *   node scripts/convert-homepage-indian-styles-folder-to-avif.js arunachal
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const WILD_ROOT = path.resolve(__dirname, "..");
const SRC_BASE = path.join(
  WILD_ROOT,
  "public",
  "HomePage",
  "creativeStyle",
  "indian-styles",
);
const DST_ROOT = path.join(
  WILD_ROOT,
  "public",
  "homepage",
  "creativeStyle",
  "indian-styles",
);

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s\-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isImageExt(ext) {
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
}

function detectVnFromSegment(seg) {
  const s = String(seg || "").trim().toLowerCase();
  if (s === "v1" || s === "1") return 1;
  if (s === "v2" || s === "2") return 2;
  if (s === "v3" || s === "3") return 3;
  return null;
}

function detectVnFromName(baseLower) {
  const m = baseLower.match(/(?:^|[-_ ])v([123])(?:$|[-_ ])/i);
  return m ? Number(m[1]) : null;
}

/**
 * Arunachal assets are stored on Zata as:
 *   indian-styles/arunachal/arunachal/<style>/v{n}.avif
 * Flat source folders (style only) need the extra "arunachal" segment.
 */
function normalizeArunachalRelSegments(slugs) {
  if (!slugs.length) return slugs;
  if (slugs[0] !== "arunachal") {
    return ["arunachal", "arunachal", ...slugs];
  }
  if (slugs[1] === "arunachal") {
    return slugs;
  }
  return ["arunachal", "arunachal", ...slugs.slice(1)];
}

function normalizeRelSegments(stateSlug, slugs) {
  if (stateSlug === "arunachal") {
    return normalizeArunachalRelSegments(slugs);
  }
  if (!slugs.length) return [stateSlug];
  if (slugs[0] === stateSlug) return slugs;
  return [stateSlug, ...slugs];
}

async function walk(dir, relOriginal, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full, [...relOriginal, ent.name], onFile);
    } else {
      await onFile(full, relOriginal, ent.name);
    }
  }
}

async function main() {
  const folderArg = (process.argv[2] || "arunachal").trim();
  if (!folderArg) {
    console.error("Usage: node scripts/convert-homepage-indian-styles-folder-to-avif.js <folder>");
    process.exit(1);
  }

  const srcRoot = path.join(SRC_BASE, folderArg);
  if (!fs.existsSync(srcRoot)) {
    console.error("[convert] missing source:", srcRoot);
    process.exit(1);
  }

  const stateSlug = slugify(folderArg);
  let converted = 0;
  let skipped = 0;

  await walk(srcRoot, [], async (srcPath, relOriginal, filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (!isImageExt(ext)) return;

    const relSlugs = relOriginal.map(slugify).filter(Boolean);
    const outRel = normalizeRelSegments(stateSlug, relSlugs);

    const vn =
      relOriginal.map(detectVnFromSegment).find(Boolean) ??
      detectVnFromName(path.basename(filename, ext).toLowerCase());
    if (!vn) {
      skipped += 1;
      return;
    }

    const dstDir = path.join(DST_ROOT, ...outRel);
    ensureDir(dstDir);
    const dstPath = path.join(dstDir, `v${vn}.avif`);

    try {
      await sharp(srcPath).avif({ quality: 70 }).toFile(dstPath);
      converted += 1;
    } catch (e) {
      console.error("[convert] failed:", srcPath, e.message);
    }
  });

  console.log(
    JSON.stringify(
      {
        srcRoot,
        dstRoot: DST_ROOT,
        stateSlug,
        converted,
        skippedNoVersion: skipped,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
