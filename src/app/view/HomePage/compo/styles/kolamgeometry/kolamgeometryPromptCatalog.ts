import { kolamgeometryPromptV1 } from "./kolamgeometryPromptV1";
import { kolamgeometryPromptV2 } from "./kolamgeometryPromptV2";
import { kolamgeometryPromptV3 } from "./kolamgeometryPromptV3";

export type KolamgeometryVersion = "V1" | "V2" | "V3";

export const KOLAMGEOMETRY_PROMPT_FAMILIES: Record<KolamgeometryVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: kolamgeometryPromptV1,
  V2: kolamgeometryPromptV2,
  V3: kolamgeometryPromptV3,
};
