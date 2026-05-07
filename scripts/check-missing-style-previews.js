const fs = require("fs");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function extractStyleIds(catalogText) {
  // matches: id: "foo"
  return Array.from(catalogText.matchAll(/id:\s*"([^"]+)"/g)).map((m) =>
    String(m[1] || "").trim(),
  );
}

function extractPreviewKeys(previewsText) {
  // matches: "foo": { v1: "...", v2: "...", v3: "..." }
  return new Set(
    Array.from(previewsText.matchAll(/"([^"]+)"\s*:\s*\{\s*v1:/g)).map((m) =>
      String(m[1] || "").trim(),
    ),
  );
}

function main() {
  const catalog = read("src/styles/creativeStyleCatalog.ts");
  const previews = read("src/styles/indianStylePreviews.ts");

  const ids = extractStyleIds(catalog).map((x) => x.toLowerCase());
  const keys = extractPreviewKeys(previews);

  const missing = ids.filter((id) => !keys.has(id) && id !== "maharashtra");

  console.log(
    JSON.stringify(
      {
        totalStyleIds: ids.length,
        totalPreviewKeys: keys.size,
        missingCount: missing.length,
        missing,
      },
      null,
      2,
    ),
  );
}

main();

