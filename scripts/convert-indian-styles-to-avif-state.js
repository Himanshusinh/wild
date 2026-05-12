const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Usage:
//   node scripts/convert-indian-styles-to-avif-state.js "Himachal Pradesh" "Telangana"
//
// Converts only the given state folders from:
//   public/HomePage/creativeStyle/Indian Styles/<State>/...
// into:
//   public/homepage/creativeStyle/indian-styles/<state-slug>/<style-slug>/v{1,2,3}.avif
//
// It tries to infer v1/v2/v3 from either:
// - folder names V1/V2/V3
// - file names containing v1/v2/v3

const SRC_ROOT = path.join(
  __dirname,
  "..",
  "public",
  "HomePage",
  "creativeStyle",
  "Indian Styles",
);

const DST_ROOT = path.join(
  __dirname,
  "..",
  "public",
  "homepage",
  "creativeStyle",
  "indian-styles",
);

function slugify(text) {
  return String(text)
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
  if (s === "v1") return 1;
  if (s === "v2") return 2;
  if (s === "v3") return 3;
  return null;
}

function detectVnFromName(baseLower) {
  const m = baseLower.match(/(?:^|[-_ ])v([123])(?:$|[-_ ])/i);
  return m ? Number(m[1]) : null;
}

async function walk(dir, relSegments, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, [...relSegments, ent.name], onFile);
    else await onFile(full, relSegments, ent.name);
  }
}

async function convertState(stateName) {
  const srcStateDir = path.join(SRC_ROOT, stateName);
  if (!fs.existsSync(srcStateDir)) {
    throw new Error(`Missing source state folder: ${srcStateDir}`);
  }

  const stateSlug = slugify(stateName);
  let converted = 0;

  await walk(srcStateDir, [], async (srcPath, relSegments, filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (!isImageExt(ext)) return;

    const relSegmentsOriginal = relSegments;
    const relSegmentsSlug = relSegmentsOriginal.map(slugify).filter(Boolean);

    // Detect style folder: first segment after state (if any), else fallback to file base.
    const styleSlug = relSegmentsSlug[0] || slugify(path.basename(filename, ext)) || "style";

    // Detect v1/v2/v3:
    const vn =
      relSegmentsOriginal.map(detectVnFromSegment).find(Boolean) ??
      detectVnFromName(path.basename(filename, ext).toLowerCase());
    if (!vn) return;

    const dstDir = path.join(DST_ROOT, stateSlug, styleSlug);
    ensureDir(dstDir);
    const dstPath = path.join(dstDir, `v${vn}.avif`);

    await sharp(srcPath).avif({ quality: 70 }).toFile(dstPath);
    converted += 1;
  });

  return { stateName, stateSlug, converted };
}

async function main() {
  const states = process.argv.slice(2).filter(Boolean);
  if (!states.length) {
    console.error('Provide state names, e.g. "Himachal Pradesh" "Telangana"');
    process.exit(1);
  }

  console.log("[convert] src root:", SRC_ROOT);
  console.log("[convert] dst root:", DST_ROOT);
  console.log("[convert] states:", states.join(", "));

  const results = [];
  for (const s of states) {
    console.log("[convert] state:", s);
    results.push(await convertState(s));
  }

  console.log(JSON.stringify({ results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

