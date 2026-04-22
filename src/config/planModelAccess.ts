export type CanonicalPlanId =
  | "free"
  | "starter"
  | "spark"
  | "creator"
  | "studio"
  | "agency";

export type RawPlanId =
  | CanonicalPlanId
  | "FREE"
  | "STARTER"
  | string;

export interface PlanModelAccessEntry {
  modelId: string;
  maxGenerations?: number;
}

export interface PlanModelAccessConfig {
  mode?: "all" | "allowlist";
  image: PlanModelAccessEntry[];
  video: PlanModelAccessEntry[];
  audio: PlanModelAccessEntry[];
  assistant?: PlanModelAccessEntry[];
  tools?: string[];
}

export const PLAN_ID_ALIASES: Record<string, CanonicalPlanId> = {
  free: "free",
  starter: "starter",
  spark: "spark",
  creator: "creator",
  studio: "studio",
  agency: "agency",
  FREE: "free",
  STARTER: "starter",

  // New billing codes (subscription variants)
  STARTER_MONTHLY: "starter",
  SPARK_MONTHLY: "spark",
  SPARK_YEARLY: "spark",
  CREATOR_MONTHLY: "creator",
  CREATOR_YEARLY: "creator",
  STUDIO_MONTHLY: "studio",
  STUDIO_YEARLY: "studio",
  AGENCY_MONTHLY: "agency",
  AGENCY_YEARLY: "agency",
};

const DISABLE_PLAN_MODEL_ACCESS = false;

export function normalizePlanId(planId?: string | null): CanonicalPlanId {
  if (!planId) return "free";
  return PLAN_ID_ALIASES[planId] || PLAN_ID_ALIASES[planId.toUpperCase()] || "free";
}

/**
 * Central source of truth for plan-wise model access.
 *
 * Fill the arrays below with the exact model IDs used in the app.
 * Examples:
 * - image: { modelId: "flux-kontext-pro" }, { modelId: "new-turbo-model", maxGenerations: 10 }
 * - video: { modelId: "kling-v3-standard" }, { modelId: "veo3.1-t2v-8s" }
 * - audio: { modelId: "minimax-music-2" }, { modelId: "elevenlabs-tts" }
 * - assistant: { modelId: "gpt-5.2" }, { modelId: "gemini-31-pro" }
 * - tools: feature flags like "studio", "canvas", "api-access"
 */
export const PLAN_MODEL_ACCESS: Record<CanonicalPlanId, PlanModelAccessConfig> = {
  free: {
    mode: "allowlist",
    image: [
      { modelId: "new-turbo-model", maxGenerations: 10 },
      { modelId: "z-image-turbo", maxGenerations: 10 },
    ],
    video: [],
    audio: [],
    assistant: [],
    tools: [],
  },
  starter: {
    mode: "all",
    image: [],
    video: [],
    audio: [],
    assistant: [],
    tools: [],
  },
  spark: {
    mode: "all",
    image: [],
    video: [],
    audio: [],
    assistant: [],
    tools: [],
  },
  creator: {
    mode: "all",
    image: [],
    video: [],
    audio: [],
    assistant: [],
    tools: [],
  },
  studio: {
    mode: "all",
    image: [],
    video: [],
    audio: [],
    assistant: [],
    tools: [],
  },
  agency: {
    mode: "all",
    image: [],
    video: [],
    audio: [],
    assistant: [],
    tools: [],
  },
};

export function getPlanModelAccess(planId?: RawPlanId | null): PlanModelAccessConfig {
  const normalized = normalizePlanId(planId);
  return PLAN_MODEL_ACCESS[normalized];
}

export function getAccessibleModelsByType(
  planId: RawPlanId | null | undefined,
  type: keyof PlanModelAccessConfig,
): string[] {
  const config = getPlanModelAccess(planId);
  const value = config[type];
  return Array.isArray(value)
    ? value
        .map((entry) => (typeof entry === "string" ? entry : entry.modelId))
        .filter(Boolean)
    : [];
}

export function getModelAccessEntry(
  planId: RawPlanId | null | undefined,
  type: keyof PlanModelAccessConfig,
  modelId: string,
): PlanModelAccessEntry | null {
  const config = getPlanModelAccess(planId);
  const value = config[type];
  if (!Array.isArray(value)) return null;

  const match = value.find((entry) =>
    typeof entry === "string" ? entry === modelId : entry.modelId === modelId,
  );

  if (!match) return null;
  return typeof match === "string" ? { modelId: match } : match;
}

export function isModelAccessibleForPlan(
  planId: RawPlanId | null | undefined,
  type: keyof PlanModelAccessConfig,
  modelId: string,
): boolean {
  if (!modelId) return false;
  if (DISABLE_PLAN_MODEL_ACCESS) return true;
  const config = getPlanModelAccess(planId);
  if (config.mode !== "allowlist") return true;
  return !!getModelAccessEntry(planId, type, modelId);
}
