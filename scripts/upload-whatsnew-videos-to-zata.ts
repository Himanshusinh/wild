/**
 * Upload What's New hero videos to Zata (same prefix as public-zata-manifest.json).
 *
 *   npx tsx scripts/upload-whatsnew-videos-to-zata.ts
 *
 * Env: same as scripts/upload-indian-styles-to-zata.ts (ZATA_* from api-gateway .env or wild/.env).
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const WILD_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(WILD_ROOT, "public");

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function loadEnv() {
  const apiGatewayEnv = path.resolve(WILD_ROOT, "..", "api-gateway-services-wildmind", ".env");
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
  const forcePathStyle = String(process.env.ZATA_FORCE_PATH_STYLE).toLowerCase() === "true";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Zata credentials (ZATA_ENDPOINT, ZATA_ACCESS_KEY_ID, ZATA_SECRET_ACCESS_KEY).");
  }

  return {
    client: new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    }),
    bucket,
    endpoint: normalizeEndpoint(endpoint),
  };
}

/** local file under public/ -> object key under public/ (no leading slash in key body) */
const UPLOADS: { file: string; objectRel: string }[] = [
  { file: "veo 3.1 lite.mp4", objectRel: "homepage/whatsnew/veo-3.1-lite.mp4" },
  { file: "pixverse.mp4", objectRel: "homepage/whatsnew/pixverse.mp4" },
];

async function main() {
  loadEnv();
  const { client, bucket, endpoint } = buildClient();
  const base = `${endpoint}/${bucket}/public`;

  for (const { file, objectRel } of UPLOADS) {
    const abs = path.join(PUBLIC_DIR, file);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing file: ${abs}`);
    }
    const key = `public/${objectRel}`;
    const body = fs.readFileSync(abs);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    console.log("[zata] uploaded:", `${base}/${objectRel}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
