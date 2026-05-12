const fs = require("fs");

const CATALOG_PATH = "src/styles/creativeStyleCatalog.ts";

const LOCAL_ROOT = "public/homepage/creativeStyle/indian-styles";
const ZATA_PUBLIC_BASE = "https://idr01.zata.ai/devstoragev1/public/homepage/creativeStyle/indian-styles";

// Manual overrides for cases where the Zata folder structure doesn't match
// `state/title` slugging in the catalog.
// key: style id slug (same as `slug(style.id)`), value: relDir under `indian-styles/`
const STYLE_FOLDER_OVERRIDES = {
  bamboocanecraft: "north-east",
  basohlipainting: "jammu",
};

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function slug(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function levenshtein(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) dp[j] = j;
  for (let i = 1; i <= m; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n];
}

function similarity(a, b) {
  const aa = slug(a);
  const bb = slug(b);
  const maxLen = Math.max(aa.length, bb.length, 1);
  return 1 - levenshtein(aa, bb) / maxLen;
}

function extractCatalogRawStyles(text) {
  // Extract minimal fields we need from the catalog source: id, state(name), title.
  // This is a pragmatic regex approach to avoid TS parsing.
  const blocks = text.split(/\n\s*\{\s*\n/).slice(1); // crude
  const items = [];
  for (const block of blocks) {
    const id = (block.match(/\bid:\s*"([^"]+)"/) || [])[1];
    const name = (block.match(/\bname:\s*"([^"]+)"/) || [])[1];
    const title = (block.match(/\btitle:\s*"([^"]+)"/) || [])[1];
    if (!id || !name || !title) continue;
    const state = String(name).split(" (")[0].trim();
    items.push({ id, state, title });
  }
  // De-dupe by id
  const seen = new Set();
  return items.filter((x) => {
    const k = slug(x.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function walkDir(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = `${dir}/${ent.name}`;
    if (ent.isDirectory()) walkDir(full, cb);
    else cb(full);
  }
}

function buildTriplesFromLocal() {
  const triples = new Map(); // key: relDir -> triple

  walkDir(LOCAL_ROOT, (fullPath) => {
    if (!fullPath.endsWith(".avif")) return;
    const file = fullPath.split("/").pop() || "";
    const parent = (fullPath.split("/").slice(-2)[0] || "").toLowerCase();

    // Support both layouts:
    // - .../<style>/v1.avif
    // - .../<style>/v1/v1.avif
    const isDirect = ["v1.avif", "v2.avif", "v3.avif"].includes(file);
    // Some folders have 1.avif/2.avif/3.avif instead of v1/v2/v3
    const isDirectNumeric = ["1.avif", "2.avif", "3.avif"].includes(file);
    const isNested = ["v1", "v2", "v3"].includes(parent) && file === `${parent}.avif`;
    const isNestedNumeric = ["1", "2", "3"].includes(parent) && file === `${parent}.avif`;
    if (!isDirect && !isDirectNumeric && !isNested && !isNestedNumeric) return;

    const vn = (() => {
      if (isNested) return parent; // v1/v2/v3
      if (isNestedNumeric) return `v${parent}`; // 1/2/3 -> v1/v2/v3
      if (isDirect) return file.slice(0, 2); // v1/v2/v3
      // direct numeric
      return `v${file[0]}`; // 1.avif -> v1
    })();
    const relDir = fullPath
      .slice(LOCAL_ROOT.length)
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .split("/")
      .slice(0, isNested || isNestedNumeric ? -2 : -1)
      .join("/");
    if (!relDir) return;

    const parts = relDir.split("/").filter(Boolean);
    // Most styles are: <state>/<style>/... but North-East is currently stored as: <state>/v{1,2,3}.avif
    if (parts.length < 1) return;

    // stateSeg is the first segment; styleSeg is the last segment (supports nested state folders)
    const stateSeg = parts[0];
    const styleSeg = parts.length === 1 ? parts[0] : parts[parts.length - 1];

    const cur =
      triples.get(relDir) || { relDir, stateSeg, styleSeg, v1: "", v2: "", v3: "" };
    const url = `${ZATA_PUBLIC_BASE}/${relDir}/${isNested || isNestedNumeric ? `${vn}/${file}` : file}`;
    cur[vn] = url.replace(/\/+/g, "/").replace("https:/", "https://");
    triples.set(relDir, cur);
  });

  return Array.from(triples.values()).filter((t) => t.v1 && t.v2 && t.v3);
}

function pickBestTripleForStyle(style, tripleOptions) {
  const idKey = slug(style.id);
  const titleKey = slug(style.title);
  const stateKey = slug(style.state);

  let best = null;
  let bestScore = -1;

  for (const t of tripleOptions) {
    const styleSeg = slug(t.styleSeg);
    const stateSeg = slug(t.stateSeg);

    // strong preference: exact folder match on title/id
    const titleExact = styleSeg === titleKey ? 1 : 0;
    const idExact = styleSeg === idKey ? 1 : 0;

    const segSim = Math.max(similarity(styleSeg, titleKey), similarity(styleSeg, idKey));
    const stateSim = similarity(stateSeg, stateKey);

    const containsBonus =
      (titleKey && styleSeg && (titleKey.includes(styleSeg) || styleSeg.includes(titleKey))) ||
      (idKey && styleSeg && (idKey.includes(styleSeg) || styleSeg.includes(idKey)))
        ? 3
        : 0;

    // weighted score
    const score = titleExact * 10 + idExact * 8 + segSim * 5 + stateSim * 2 + containsBonus;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  // Require a reasonable match: exact styleSeg OR high similarity
  if (!best) return null;
  const bestSeg = slug(best.styleSeg);
  const ok =
    bestSeg === titleKey ||
    bestSeg === idKey ||
    (titleKey && bestSeg && titleKey.includes(bestSeg)) ||
    (idKey && bestSeg && idKey.includes(bestSeg)) ||
    bestScore >= 6.0;
  return ok ? best : null;
}

function scoreTripleForStyle(style, t) {
  const idKey = slug(style.id);
  const titleKey = slug(style.title);
  const stateKey = slug(style.state);

  const styleSeg = slug(t.styleSeg);
  const stateSeg = slug(t.stateSeg);

  const titleExact = styleSeg === titleKey ? 1 : 0;
  const idExact = styleSeg === idKey ? 1 : 0;

  const segSim = Math.max(similarity(styleSeg, titleKey), similarity(styleSeg, idKey));
  const stateSim = similarity(stateSeg, stateKey);

  const containsBonus =
    (titleKey && styleSeg && (titleKey.includes(styleSeg) || styleSeg.includes(titleKey))) ||
    (idKey && styleSeg && (idKey.includes(styleSeg) || styleSeg.includes(idKey)))
      ? 3
      : 0;

  return titleExact * 10 + idExact * 8 + segSim * 5 + stateSim * 2 + containsBonus;
}

function toTs(previewMap) {
  const keys = Object.keys(previewMap).sort();
  const body = keys
    .map((k) => {
      const t = previewMap[k];
      return `  "${k}": { v1: "${t.v1}", v2: "${t.v2}", v3: "${t.v3}" },`;
    })
    .join("\n");

  return `// Auto-generated from public-zata-manifest.json
export type IndianStylePreviewTriple = { v1: string; v2: string; v3: string };

export const INDIAN_STYLE_PREVIEWS: Record<string, IndianStylePreviewTriple> = {
${body}
};
`;
}

function main() {
  const catalogText = readText(CATALOG_PATH);
  const styles = extractCatalogRawStyles(catalogText).filter((s) => slug(s.id) !== "maharashtra");

  const tripleOptions = buildTriplesFromLocal();
  const previewMap = {};
  const missing = [];
  const weakMatches = [];

  const assignedStyle = new Set();
  const usedTriples = new Set();

  // Build candidate edges
  const edges = [];
  for (const s of styles) {
    const sKey = slug(s.id);
    const overrideRelDir = STYLE_FOLDER_OVERRIDES[sKey];
    if (overrideRelDir) {
      const t = tripleOptions.find((x) => x.relDir === overrideRelDir);
      if (t) {
        previewMap[sKey] = { v1: t.v1, v2: t.v2, v3: t.v3 };
        assignedStyle.add(sKey);
        usedTriples.add(t.relDir);
        continue;
      }
    }
    for (const t of tripleOptions) {
      const score = scoreTripleForStyle(s, t);
      if (score < 6.0) continue;
      edges.push({
        s,
        sKey,
        t,
        tKey: t.relDir,
        score,
      });
    }
  }

  // Greedy unique assignment (high score first)
  edges.sort((a, b) => b.score - a.score);

  for (const e of edges) {
    if (assignedStyle.has(e.sKey)) continue;
    if (usedTriples.has(e.tKey)) continue;
    assignedStyle.add(e.sKey);
    usedTriples.add(e.tKey);
    previewMap[e.sKey] = { v1: e.t.v1, v2: e.t.v2, v3: e.t.v3 };
    if (similarity(e.t.stateSeg, e.s.state) < 0.3) {
      weakMatches.push({
        id: e.s.id,
        state: e.s.state,
        title: e.s.title,
        picked: `${e.t.stateSeg}/${e.t.relDir}`,
        score: e.score,
      });
    }
  }

  for (const s of styles) {
    const k = slug(s.id);
    if (!previewMap[k]) missing.push({ id: s.id, state: s.state, title: s.title });
  }

  const tsOut = toTs(previewMap);
  fs.writeFileSync("src/styles/indianStylePreviews.ts", tsOut, "utf8");

  console.log(
    JSON.stringify(
      {
        totalStyles: styles.length,
        triplesFoundLocal: tripleOptions.length,
        mapped: Object.keys(previewMap).length,
        missingCount: missing.length,
        missing: missing.slice(0, 50),
        weakMatchesCount: weakMatches.length,
        weakMatches: weakMatches.slice(0, 30),
      },
      null,
      2,
    ),
  );
}

main();

