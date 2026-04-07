import api from "@/lib/axiosInstance";

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
  const response = await api.get("/api/plans/subscription-catalog");
  return response.data?.data as SubscriptionCatalog;
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
