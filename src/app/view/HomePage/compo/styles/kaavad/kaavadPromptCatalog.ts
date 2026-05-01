import { kaavadPromptV1 } from "./kaavadPromptV1";
import { kaavadPromptV2 } from "./kaavadPromptV2";
import { kaavadPromptV3 } from "./kaavadPromptV3";

export type KaavadVersion = "V1" | "V2" | "V3";

export const KAAVAD_PROMPT_FAMILIES: Record<KaavadVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: kaavadPromptV1,
  V2: kaavadPromptV2,
  V3: kaavadPromptV3,
};
