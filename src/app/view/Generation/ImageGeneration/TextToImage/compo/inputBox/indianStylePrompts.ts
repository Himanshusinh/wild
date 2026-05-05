import { ALL_INDIAN_STYLES } from "@/styles/indianStyles";
import { HOMEPAGE_PROMPT_CATALOG_LOADERS } from "@/styles/homepagePromptCatalogLoaders";

export const INDIAN_STYLE_LOOKUP = new Set(
  ALL_INDIAN_STYLES.map((item) => String(item.id || "").trim()),
);

const INDIAN_STYLE_CATALOG_ALIASES: Record<string, string> = {
  uppadajamdani: "uppada",
  "ganjifa-mysore": "ganjifa",
  "ganjifa-sawantwadi": "sawantwadiwoodcraft",
  "thangka-folk": "thangka",
  "tawlhlohpuan-ceremonial": "tawlhlophuan",
  karuppurkalamkari: "kalamkari",
  patachitra: "pattachitra",
  bamboocanecraft: "bamboocraft",
  machilipatnam: "kalamkari",
  banjaraembroidery: "lambaniembroidery",
  maharashtra: "warli",
};

const normalizeIndianCatalogKey = (value: string): string =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const buildIndianStyleCatalogCandidates = (styleId: string): string[] => {
  const styleItem = ALL_INDIAN_STYLES.find((item) => item.id === styleId);
  const aliasKey = INDIAN_STYLE_CATALOG_ALIASES[styleId];
  const rawCandidates = [styleId, styleItem?.title, styleItem?.name].filter(
    Boolean,
  ) as string[];
  const normalized = rawCandidates
    .map(normalizeIndianCatalogKey)
    .filter((item) => item.length > 0);
  if (aliasKey) {
    normalized.unshift(normalizeIndianCatalogKey(aliasKey));
  }
  return Array.from(new Set(normalized));
};

export const getIndianBasePrompt = async (
  styleId: string,
  version: "V1" | "V2" | "V3",
): Promise<string | null> => {
  const selectedStyle = ALL_INDIAN_STYLES.find((item) => item.id === styleId);
  const candidates = buildIndianStyleCatalogCandidates(styleId);
  for (const key of candidates) {
    try {
      const loadCatalog = HOMEPAGE_PROMPT_CATALOG_LOADERS[key];
      if (!loadCatalog) continue;
      const moduleExports = await loadCatalog();
      const familyExportKey = Object.keys(moduleExports).find((exportKey) =>
        exportKey.endsWith("_PROMPT_FAMILIES"),
      );
      if (!familyExportKey) continue;
      const familyRecord = (moduleExports as any)[familyExportKey];
      const selectedFamily = familyRecord?.[version];
      const basePrompt =
        selectedFamily?.promptHard || selectedFamily?.promptVariable || "";
      if (basePrompt) return String(basePrompt);
    } catch {
      // try next naming candidate
    }
  }
  if (selectedStyle) {
    const versionLine =
      version === "V1"
        ? "authentic documentary rendering"
        : version === "V2"
          ? "traditional craft-preserving rendering"
          : "modern reinterpretation while preserving cultural identity";
    return [
      `${selectedStyle.title} visual language, ${selectedStyle.name} regional craft aesthetics.`,
      selectedStyle.desc,
      `Render in ${versionLine} with high detail, culturally respectful motifs, and handcrafted material character.`,
    ]
      .filter(Boolean)
      .join(" ");
  }
  return null;
};
