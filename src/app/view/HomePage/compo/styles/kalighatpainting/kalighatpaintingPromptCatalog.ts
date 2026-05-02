import { kalighatpaintingPromptV1 } from "./kalighatpaintingPromptV1";
import { kalighatpaintingPromptV2 } from "./kalighatpaintingPromptV2";
import { kalighatpaintingPromptV3 } from "./kalighatpaintingPromptV3";

export type KalighatpaintingVersion = "V1" | "V2" | "V3";

export const KALIGHATPAINTING_PROMPT_FAMILIES: Record<KalighatpaintingVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: kalighatpaintingPromptV1,
  V2: kalighatpaintingPromptV2,
  V3: kalighatpaintingPromptV3,
};
