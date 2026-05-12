import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const WILD_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(WILD_ROOT, "public");
const INDIAN_STYLES_DIR = path.join(
  PUBLIC_DIR,
  "homepage",
  "creativeStyle",
  "indian-styles",
);

const PREVIEWS_TS = path.join(
  WILD_ROOT,
  "src",
  "styles",
  "indianStylePreviews.ts",
);

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function loadEnv() {
  // Prefer api-gateway env (already contains ZATA credentials)
  const apiGatewayEnv = path.resolve(
    WILD_ROOT,
    "..",
    "api-gateway-services-wildmind",
    ".env",
  );
  const wildEnv = path.resolve(WILD_ROOT, ".env");

  if (fs.existsSync(apiGatewayEnv)) {
    dotenv.config({ path: apiGatewayEnv });
    return;
  }
  dotenv.config({ path: wildEnv });
}

function buildClient() {
  const bucket = process.env.ZATA_BUCKET || "devstoragev1";
  const endpoint = process.env.ZATA_ENDPOINT || "";
  const region = process.env.ZATA_REGION || "us-east-1";
  const accessKeyId = process.env.ZATA_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.ZATA_SECRET_ACCESS_KEY || "";
  const forcePathStyle =
    String(process.env.ZATA_FORCE_PATH_STYLE).toLowerCase() === "true";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      [
        "Missing Zata credentials. Provide these env vars:",
        "- ZATA_ENDPOINT (e.g. https://idr01.zata.ai)",
        "- ZATA_BUCKET (e.g. devstoragev1)",
        "- ZATA_REGION (e.g. us-east-1)",
        "- ZATA_ACCESS_KEY_ID",
        "- ZATA_SECRET_ACCESS_KEY",
        "- ZATA_FORCE_PATH_STYLE=true (recommended)",
      ].join("\n"),
    );
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle,
  });

  return { client, bucket, endpoint };
}

async function walkDir(dir: string, callback: (fullPath: string) => Promise<void>) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walkDir(full, callback);
    else await callback(full);
  }
}

function rewritePreviewFileToZataBase(zataPublicBase: string) {
  if (!fs.existsSync(PREVIEWS_TS)) {
    throw new Error(`Missing previews file: ${PREVIEWS_TS}`);
  }
  const content = fs.readFileSync(PREVIEWS_TS, "utf8");
  const localPrefix = "/homepage/creativeStyle/indian-styles";
  const replaced = content.replaceAll(localPrefix, `${zataPublicBase}${localPrefix}`);
  fs.writeFileSync(PREVIEWS_TS, replaced, "utf8");
}

async function main() {
  loadEnv();

  if (!fs.existsSync(INDIAN_STYLES_DIR)) {
    throw new Error(`Missing folder: ${INDIAN_STYLES_DIR}`);
  }

  // Optional CLI filters:
  //   npx tsx scripts/upload-indian-styles-to-zata.ts himachal-pradesh telangana
  // If provided, we only upload files under these state folders.
  const stateFilters = process.argv.slice(2).map((s) => s.trim()).filter(Boolean);
  const stateFilterSet = new Set(stateFilters);

  const { client: s3, bucket, endpoint } = buildClient();
  const endpointNorm = normalizeEndpoint(endpoint);
  const zataPublicBase = `${endpointNorm}/${bucket}/public`;

  console.log("[zata] uploading from:", INDIAN_STYLES_DIR);
  if (stateFilters.length) console.log("[zata] state filters:", stateFilters.join(", "));
  console.log("[zata] bucket:", bucket);
  console.log("[zata] endpoint:", endpointNorm);
  console.log("[zata] public base:", zataPublicBase);

  let uploaded = 0;
  await walkDir(INDIAN_STYLES_DIR, async (fullPath) => {
    const rel = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, "/");
    const ext = path.extname(rel).toLowerCase();
    if (ext !== ".avif") return;

    if (stateFilterSet.size) {
      // rel looks like: homepage/creativeStyle/indian-styles/<state>/...
      const parts = rel.split("/").filter(Boolean);
      const stateIdx = parts.indexOf("indian-styles") + 1;
      const stateSeg = stateIdx > 0 ? parts[stateIdx] : "";
      if (!stateSeg || !stateFilterSet.has(stateSeg)) return;
    }

    const key = `public/${rel}`;
    const body = fs.readFileSync(fullPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/avif",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    uploaded += 1;
    if (uploaded % 100 === 0) console.log(`[zata] uploaded ${uploaded}...`);
  });

  console.log(`[zata] uploaded total: ${uploaded}`);

  // Rewrite mapping to use Zata URLs (so UI uses CDN immediately).
  rewritePreviewFileToZataBase(zataPublicBase);
  console.log("[zata] updated:", PREVIEWS_TS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

