export type PlanLabelResult = {
  raw: string;
  label: string;
};

function titleCase(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Convert billing `planCode` values (e.g. AGENCY_YEARLY) into a user-facing label.
 * Falls back gracefully for unknown codes.
 */
export function getPlanLabel(planCode?: string | null): PlanLabelResult {
  const raw = String(planCode || "").trim();
  if (!raw) return { raw: "", label: "Free" };

  const upper = raw.toUpperCase();

  // Legacy/static aliases
  if (upper === "FREE") return { raw, label: "Free" };
  if (upper === "PLAN_A") return { raw, label: "Spark" };
  if (upper === "PLAN_B") return { raw, label: "Creator" };
  if (upper === "PLAN_C") return { raw, label: "Studio" };
  if (upper === "PLAN_D") return { raw, label: "Agency" };

  // New billing codes, like AGENCY_YEARLY / STUDIO_MONTHLY, etc.
  const parts = upper.split("_").filter(Boolean);
  if (parts.length >= 2) {
    const maybeInterval = parts[parts.length - 1];
    const interval =
      maybeInterval === "MONTHLY" ? "Monthly" : maybeInterval === "YEARLY" ? "Yearly" : null;

    const tierParts = interval ? parts.slice(0, -1) : parts;
    const tier = tierParts.map(titleCase).join(" ");

    if (tier) {
      return { raw, label: interval ? `${tier} (${interval})` : tier };
    }
  }

  // Final fallback: humanize the raw string
  const human = upper
    .split("_")
    .filter(Boolean)
    .map(titleCase)
    .join(" ");
  return { raw, label: human || raw };
}

