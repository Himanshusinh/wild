/** Runway model-specific allowed ratios (kept in sync with backend validator) */
const RUNWAY_RATIOS_GEN4 = new Set([
  "1920:1080",
  "1080:1920",
  "1024:1024",
  "1360:768",
  "1080:1080",
  "1168:880",
  "1440:1080",
  "1080:1440",
  "1808:768",
  "2112:912",
  "1280:720",
  "720:1280",
  "720:720",
  "960:720",
  "720:960",
  "1680:720",
]);

const RUNWAY_RATIOS_GEMINI = new Set([
  "1344:768",
  "768:1344",
  "1024:1024",
  "1184:864",
  "864:1184",
  "1536:672",
]);

export const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
  const ratioMap: { [key: string]: string } = {
    "1:1": "1024:1024",
    "16:9": "1920:1080",
    "9:16": "1080:1920",
    "4:3": "1360:768",
    "3:4": "768:1360",
    "3:2": "1440:1080",
    "2:3": "1080:1440",
    "21:9": "1808:768",
    "9:21": "768:1808",
    "16:10": "1680:720",
    "10:16": "720:1680",
  };

  return ratioMap[frameSize] || "1024:1024";
};

export const coerceRunwayRatio = (ratio: string, model: string): string => {
  const [wStr, hStr] = ratio.split(":");
  const w = Number(wStr),
    h = Number(hStr);
  const aspectOk = w > 0 && h > 0 && w / h >= 0.5 && w / h <= 2;
  const allowed =
    model === "gemini_2.5_flash" ? RUNWAY_RATIOS_GEMINI : RUNWAY_RATIOS_GEN4;
  if (aspectOk && allowed.has(ratio)) return ratio;
  return "1024:1024";
};

/** Map Runway base_resp.status_code to toast message and severity; return whether to stop polling */
export const mapRunwayStatus = (
  status: any,
): {
  shouldStop: boolean;
  toastType: "success" | "error" | "loading" | "blank";
  message: string;
} | null => {
  try {
    const base =
      status && (status.base_resp || (status.data && status.data.base_resp));
    if (!base) return null;
    const code =
      typeof base.status_code === "string"
        ? parseInt(base.status_code, 10)
        : Number(base.status_code);
    const msg = (base.status_msg as string) || "Unknown status";
    if (Number.isNaN(code)) return null;
    if (code === 0)
      return {
        shouldStop: false,
        toastType: "success",
        message: msg || "Success",
      };
    switch (code) {
      case 1002:
        return {
          shouldStop: true,
          toastType: "error",
          message: "Rate limited by Runway. Please try again shortly.",
        };
      case 1004:
      case 2049:
        return {
          shouldStop: true,
          toastType: "error",
          message: "Runway authentication failed. Check API key.",
        };
      case 1008:
        return {
          shouldStop: true,
          toastType: "error",
          message: "Runway balance insufficient. Please top up your plan.",
        };
      case 1026:
        return {
          shouldStop: true,
          toastType: "error",
          message: "Prompt blocked due to content safety.",
        };
      case 2013:
        return {
          shouldStop: true,
          toastType: "error",
          message: "Invalid parameters for Runway request.",
        };
      default:
        return {
          shouldStop: true,
          toastType: "error",
          message: msg || `Runway error (${code}).`,
        };
    }
  } catch {
    return null;
  }
};
