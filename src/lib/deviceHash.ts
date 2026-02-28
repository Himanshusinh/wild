import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedDeviceHash: string | null = null;
let fingerprintPromise: Promise<string> | null = null;

/**
 * Initializes FingerprintJS and returns a unique device visitorId.
 * Caches the result in memory and localStorage for faster subsequent access.
 */
export async function getDeviceHash(): Promise<string> {
  // 1. Check memory cache
  if (cachedDeviceHash) {
    return cachedDeviceHash;
  }

  // 2. Check localStorage (fastest path on reload)
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("wm_device_hash");
      if (stored) {
        cachedDeviceHash = stored;
        // Optionally trigger a background refresh to handle changes, but returning cached is fine for our usecase
        return stored;
      }
    }
  } catch (e) {
    // Ignore storage errors
  }

  // 3. Prevent duplicate simultaneous initialization
  if (fingerprintPromise) {
    return fingerprintPromise;
  }

  // 4. Load FingerprintJS and get hash
  fingerprintPromise = (async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const visitorId = result.visitorId;

      cachedDeviceHash = visitorId;
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("wm_device_hash", visitorId);
        }
      } catch (e) {}

      return visitorId;
    } catch (error) {
      console.error("[DeviceFingerprint] Failed to generate hash:", error);
      // Fallback: generate a persistent random UUID if fingerprinting completely fails
      const fallback = `fb_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      cachedDeviceHash = fallback;
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("wm_device_hash", fallback);
        }
      } catch (e) {}
      return fallback;
    } finally {
      fingerprintPromise = null;
    }
  })();

  return fingerprintPromise;
}
