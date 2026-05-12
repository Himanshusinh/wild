import api from "@/lib/axiosInstance";

const CATALOG_STORAGE_KEY = "wm_subscription_catalog_v2";
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;

function loadCatalogCache(): { data: SubscriptionCatalog; fetchedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      data: SubscriptionCatalog;
      fetchedAt: number;
    };
    if (!parsed?.data?.plans || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCatalogCache(data: SubscriptionCatalog) {
  try {
    sessionStorage.setItem(
      CATALOG_STORAGE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() }),
    );
  } catch {}
}

/** Sync read for layout hydration (sessionStorage, TTL). */
export function peekCachedSubscriptionCatalog(): SubscriptionCatalog | null {
  const c = loadCatalogCache();
  if (!c || Date.now() - c.fetchedAt >= CATALOG_TTL_MS) return null;
  return c.data;
}

export type SubscriptionCatalogSku = {
  code: string;
  name: string;
  priceInPaise: number;
  gstRatePercent: number;
  gstAmountInPaise: number;
  totalWithGstInPaise: number;
  credits: number;
  storageGB: number;
  billingInterval: "MONTHLY" | "YEARLY";
  billingPeriodMonths: number;
  creditRefreshIntervalMonths: number;
};

export type SubscriptionCatalogTier = {
  family: "spark" | "creator" | "studio" | "agency";
  name: string;
  sort: number;
  monthly: SubscriptionCatalogSku | null;
  yearly: SubscriptionCatalogSku | null;
};

export type SubscriptionCatalog = {
  freePlan: {
    code: string;
    name: string;
    priceInPaise: number;
    gstRatePercent: number;
    gstAmountInPaise: number;
    totalWithGstInPaise: number;
    credits: number;
    storageGB: number;
  } | null;
  plans: SubscriptionCatalogTier[];
};

export async function fetchSubscriptionCatalog(): Promise<SubscriptionCatalog> {
  const cached = loadCatalogCache();
  if (cached && Date.now() - cached.fetchedAt < CATALOG_TTL_MS) {
    return cached.data;
  }
  const response = await api.get("/api/plans/subscription-catalog");
  const data = response.data?.data as SubscriptionCatalog;
  saveCatalogCache(data);
  return data;
}

export function findCatalogSkuByCode(
  catalog: SubscriptionCatalog | null | undefined,
  planCode: string | null | undefined,
): SubscriptionCatalogSku | null {
  if (!catalog || !planCode) return null;
  for (const plan of catalog.plans) {
    if (plan.monthly?.code === planCode) return plan.monthly;
    if (plan.yearly?.code === planCode) return plan.yearly;
  }
  return null;
}
