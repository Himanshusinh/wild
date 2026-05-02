import { warliPromptBodyA } from "./warliPromptA";
import { warliPromptBodyB } from "./warliPromptB";
import { warliPromptBodyC } from "./warliPromptC";

export type WarliStyleType = "V1" | "V2" | "V3";

export interface WarliPromptFamily {
  id: WarliStyleType;
  title: string;
  summary: string;
  styleChip: string;
  benchmarkScene: string;
  /** Primary locked directive (Template). */
  promptTemplate: string;
  /** Slot-based reusable phrasing (Variable). */
  promptVariable: string;
  /** Preserve arrangement / restyle semantics (Restyle). */
  promptRestyle: string;
}

export const WARLI_PROMPT_FAMILIES: Record<WarliStyleType, WarliPromptFamily> = {
  V1: {
    id: "V1",
    title: "Traditional 2D mural",
    summary: "Authentic Maharashtrian Warli painting with white geometric figures on terracotta mud walls.",
    styleChip: "2D Mural",
    ...warliPromptBodyA,
  },
  V2: {
    id: "V2",
    title: "Terracotta bas-relief",
    summary: "Warli-inspired sculpted relief with shallow cinematic depth and tactile clay surfaces.",
    styleChip: "Bas-Relief",
    ...warliPromptBodyB,
  },
  V3: {
    id: "V3",
    title: "Full cinematic 3D world",
    summary: "Premium volumetric 3D scene using Warli intelligence without flattening into a mural.",
    styleChip: "3D World",
    ...warliPromptBodyC,
  },
};

export const WARLI_PROMPT_FAMILY_LIST = Object.values(WARLI_PROMPT_FAMILIES);
